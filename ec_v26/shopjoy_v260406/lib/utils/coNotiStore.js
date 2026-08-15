/* ShopJoy - 알림 누적 스토어 (FO·BO 공용)  window.coNotiStore / boNotiStore / foNotiStore
 * ─────────────────────────────────────────────────────────────────────────
 * 목적: 화면을 스쳐 지나가는 정보(특히 API 오류 토스트/500 화면)를 사라지지 않게
 *       한 곳에 쌓아두고, 상단 종 아이콘에서 언제든 다시 확인한다.
 *
 * 누적 대상 4종 (type)
 *   error   💥 오류정보   — **DB 미저장. 브라우저(sessionStorage)에만 쌓인다**
 *   notice  📢 공지사항   ─┐
 *   alarm   🔔 수신알림   ─┼─ **sy_noti 테이블에 수신자별 1행으로 저장**
 *   special ⚠️ 특이사항   ─┘   (BO=/bo/sy/noti · FO=/fo/my/noti)
 *
 * 왜 오류만 로컬인가
 *   오류는 서버가 죽었을 때 대량 발생하는데, 그때 DB 에 쓰려면 또 서버가 필요하다.
 *   즉 정작 필요한 순간에 못 남긴다. 게다가 브라우저/세션 진단 정보라 수신자 개념도 없다.
 *
 * 항목 식별
 *   DB 행      : key = 'db:' + notiId
 *   로컬 오류  : key = 'lo:' + 로컬 시퀀스
 *   읽음/삭제 시 key 앞자리를 보고 서버 호출 여부를 가른다.
 *
 * 중복 병합 ⭐ (오류 전용)
 *   백엔드가 죽으면 같은 오류가 순식간에 수십 건 쏟아진다("여러번 나오는데 마지막만 보임").
 *   같은 dedupKey(method+URL+상태)는 새 행을 만들지 않고 count 를 올리고 시각만 갱신한다.
 * ───────────────────────────────────────────────────────────────────────── */
(function (global) {
  'use strict';

  const { reactive, ref, computed } = Vue;

  const MAX_LOCAL       = 50;                  // 로컬 오류 최대 보관 건수
  const MERGE_WINDOW_MS = 5 * 60 * 1000;       // 이 시간 안의 동일 오류는 병합

  /* 유형 메타 — 아이콘/라벨/색을 한 곳에서 관리 (뱃지·필터·상세가 모두 참조) */
  const TYPE_META = {
    error:   { label: '오류정보', icon: '💥', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', code: 'ERROR' },
    notice:  { label: '공지사항', icon: '📢', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', code: 'NOTICE' },
    alarm:   { label: '수신알림', icon: '🔔', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', code: 'ALARM' },
    special: { label: '특이사항', icon: '⚠️', color: '#d97706', bg: '#fffbeb', border: '#fde68a', code: 'SPECIAL' },
  };
  const TYPE_ORDER = ['error', 'notice', 'alarm', 'special'];
  /* DB noti_type_cd ↔ 프론트 type 매핑 */
  const CODE_TO_TYPE = { ERROR: 'error', NOTICE: 'notice', ALARM: 'alarm', SPECIAL: 'special' };

  /* 발송 채널 메타 — 시뮬레이션 발송 화면과 알림 표기가 같은 정의를 쓴다 */
  const CHANNEL_META = {
    mail:   { label: '메일',   icon: '✉️' },
    sms:    { label: 'SMS',    icon: '💬' },
    kakao:  { label: '알림톡', icon: '🟡' },
    chat:   { label: '채팅',   icon: '🗨️' },
    notice: { label: '공지',   icon: '📢' },
  };

  /* ── 공용 헬퍼 ──────────────────────────────────────────────────── */

  /* fnStripHtml — HTML 본문을 알림 목록용 평문으로 */
  const fnStripHtml = (html) => String(html)
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

  /* fnFmtTime — 목록 표기용 상대시각 (방금 전 / N분 전 / HH:MM / MM-DD) */
  const fnFmtTime = (t) => {
    const d   = t instanceof Date ? t : new Date(t);
    const gap = Date.now() - d.getTime();
    if (gap < 60000)    { return '방금 전'; }
    if (gap < 3600000)  { return Math.floor(gap / 60000) + '분 전'; }
    if (gap < 86400000) { return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
    return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  /* fnTypeMeta — 유형 메타 조회 (미정의 유형도 안전하게 기본값 반환) */
  const fnTypeMeta = (type) => TYPE_META[type] || TYPE_META.special;

  /* ── 스토어 팩토리 ──────────────────────────────────────────────── */

  /* fnCreate — 컨텍스트('bo'|'fo')별 알림 스토어 생성 */
  const fnCreate = (ctx) => {
    const LOCAL_KEY = 'modu-' + ctx + '-noti-local';   // 로컬 오류 전용 저장소

    /* items — DB 행 + 로컬 오류가 합쳐진 표시용 목록 (최신순) */
    const items    = reactive([]);
    const shakeSeq = ref(0);          // ++ 될 때마다 종 흔들기 (CoNotiBell 이 watch)
    const uiState  = reactive({ loading: false, loaded: false, lastError: '' });
    let   _localSeq = 0;

    /* svc — 컨텍스트별 알림 API (로드 시점엔 아직 없을 수 있어 호출 때 조회) */
    const fnSvc = () => (ctx === 'fo'
      ? (global.foApiSvc ? global.foApiSvc.myNoti : null)
      : (global.boApiSvc ? global.boApiSvc.syNoti : null));

    /* ── 로컬 오류 저장/복원 ── */
    const fnSaveLocal = () => {
      try {
        sessionStorage.setItem(LOCAL_KEY, JSON.stringify(items.filter((it) => it.local)));
      } catch (_) {}
    };
    const fnLoadLocal = () => {
      try {
        const rows = JSON.parse(sessionStorage.getItem(LOCAL_KEY) || '[]');
        rows.forEach((r) => {
          const seq = Number(String(r.key || '').replace('lo:', '')) || 0;
          if (seq > _localSeq) _localSeq = seq;
          items.push({ ...r, time: new Date(r.time) });
        });
      } catch (_) {}
    };

    const fnSort = () => { items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()); };

    /* ── 파생값 ── */
    const cfUnreadCount = computed(() => items.filter((it) => !it.read).length);
    const cfTypeCounts  = computed(() => {
      const m = { all: items.length };
      TYPE_ORDER.forEach((t) => { m[t] = 0; });
      items.forEach((it) => { m[it.type] = (m[it.type] || 0) + 1; });
      return m;
    });

    /* ── 로컬 오류 적재 ─────────────────────────────────────────── */

    /* fnAddError — api-response-error detail → 오류 알림 (DB 미저장)
       dedupKey = method+URL+status (같은 API 의 같은 실패는 한 줄로 뭉침) */
    const fnAddError = (d) => {
      if (!d) return null;
      const st  = d.status;
      const url = d.fullUrl || d.url || '';
      const mth = d.method || '';
      const now = new Date();
      const dedupKey = 'error|' + mth + '|' + url + '|' + st;

      const prev = items.find((it) => it.local ? (it.dedupKey === dedupKey) : false);
      if (prev) {
        const gap = now.getTime() - new Date(prev.time).getTime();
        if (gap <= MERGE_WINDOW_MS) {
          prev.count  += 1;
          prev.time    = now;
          prev.read    = false;             /* 재발하면 다시 미읽음 */
          prev.message = d.message || prev.message;
          fnSort(); fnSaveLocal(); shakeSeq.value++;
          return prev;
        }
      }

      const shortUrl = String(url).replace(/^https?:\/\/[^/]+/, '');
      const item = {
        key: 'lo:' + (++_localSeq), notiId: null, local: true,
        type: 'error', channel: '',
        title: (st === 0 ? '연결 실패' : st + ' 오류') + ' · ' + (d.uiLabel || shortUrl),
        message: d.message || '', read: false, time: now, count: 1, dedupKey: dedupKey,
        method: mth, url: url, status: st, uiLabel: d.uiLabel || '',
        linkPage: '', refId: '',
      };
      items.unshift(item);
      /* 로컬 오류만 상한 적용 (DB 행은 서버 페이징이 관리) */
      const locals = items.filter((it) => it.local);
      if (locals.length > MAX_LOCAL) {
        const drop = locals.slice(MAX_LOCAL).map((it) => it.key);
        drop.forEach((k) => { const i = items.findIndex((it) => it.key === k); if (i >= 0) items.splice(i, 1); });
      }
      fnSort(); fnSaveLocal(); shakeSeq.value++;
      return item;
    };

    /* ── 서버 조회 ──────────────────────────────────────────────── */

    /* fnMapRow — sy_noti 행 → 표시용 항목 */
    const fnMapRow = (r) => {
      const ch = CHANNEL_META[r.channelCd];
      return {
        key: 'db:' + r.notiId, notiId: r.notiId, local: false,
        type: CODE_TO_TYPE[r.notiTypeCd] || 'alarm',
        channel: r.channelCd || '',
        title: (ch ? ch.icon + ' [' + ch.label + '] ' : '') + (r.notiTitle || ''),
        message: r.notiContent || '',
        read: r.readYn === 'Y',
        time: r.regDate ? new Date(r.regDate) : new Date(),
        count: 1, dedupKey: '',
        method: '', url: '', status: '', uiLabel: '',
        linkPage: r.linkPage || '', refId: r.refId || '',
      };
    };

    /* fnLoadServer — DB 알림을 다시 읽어 items 의 DB 구간만 교체 (로컬 오류는 보존).
       실패해도 조용히 넘어간다 — 알림 로딩 실패로 또 오류 알림을 쌓으면 무한 루프가 된다. */
    const fnLoadServer = async (pageSize = 50) => {
      const svc = fnSvc();
      if (!svc) return 0;
      uiState.loading = true;
      try {
        const res  = ctx === 'fo'
          ? await svc.getList({ pageNo: 1, pageSize: pageSize, sort: 'regDate desc' }, '알림', '목록조회')
          : await svc.getMyList({ pageNo: 1, pageSize: pageSize, sort: 'regDate desc' }, '알림', '목록조회');
        const rows = res.data?.data || [];
        const mapped = rows.map(fnMapRow);

        /* 새로 도착한(기존에 없던) 안읽음 알림이 있으면 종을 흔든다 */
        const before = new Set(items.filter((it) => !it.local).map((it) => it.key));
        const fresh  = mapped.filter((m) => !before.has(m.key) && !m.read).length;

        /* DB 구간 교체 — 로컬 오류만 남기고 새로 받은 DB 행을 붙인다 */
        const locals = items.filter((it) => it.local);
        items.splice(0, items.length, ...locals, ...mapped);
        fnSort();
        uiState.loaded = true; uiState.lastError = '';
        if (fresh > 0) { shakeSeq.value++; }
        return fresh;
      } catch (err) {
        uiState.lastError = err.response?.data?.message || err.message || '알림 조회 실패';
        return 0;
      } finally {
        uiState.loading = false;
      }
    };

    /* ── 읽음/삭제 (DB 행은 서버 반영, 로컬 오류는 메모리만) ────────── */

    const fnFind = (key) => items.find((it) => it.key === key);

    const fnMarkRead = async (key, readYn = 'Y') => {
      const it = fnFind(key);
      if (!it) return;
      const read = readYn !== 'N';
      if (it.read === read) return;
      it.read = read;                       /* 낙관적 반영 — 클릭 즉시 스타일이 바뀐다 */
      if (it.local) { fnSaveLocal(); return; }
      const svc = fnSvc();
      if (!svc) return;
      try {
        await svc.markRead(it.notiId, read ? 'Y' : 'N', '알림', read ? '읽음' : '안읽음');
      } catch (_) { it.read = !read; }      /* 실패 시 되돌린다 */
    };

    const fnMarkUnread = (key) => fnMarkRead(key, 'N');

    const fnMarkAllRead = async () => {
      const hadDb = items.some((it) => !it.local && !it.read);
      items.forEach((it) => { it.read = true; });
      fnSaveLocal();
      if (!hadDb) return;
      const svc = fnSvc();
      if (!svc) return;
      try { await svc.markAllRead('알림', '모두읽음'); } catch (_) { await fnLoadServer(); }
    };

    const fnRemove = async (key) => {
      const it = fnFind(key);
      if (!it) return;
      const i = items.findIndex((x) => x.key === key);
      if (i >= 0) items.splice(i, 1);
      if (it.local) { fnSaveLocal(); return; }
      const svc = fnSvc();
      if (!svc) return;
      try { await svc.remove(it.notiId, '알림', '삭제'); } catch (_) { await fnLoadServer(); }
    };

    const fnClear = async () => {
      const hadDb = items.some((it) => !it.local);
      items.splice(0, items.length);
      fnSaveLocal();
      if (!hadDb) return;
      const svc = fnSvc();
      if (!svc) return;
      try {
        await (ctx === 'fo' ? svc.removeAll('알림', '전체삭제') : svc.removeMyAll('알림', '전체삭제'));
      } catch (_) { await fnLoadServer(); }
    };

    /* fnAddSpecial — 특이사항 알림을 DB 에 남긴다 (BO 전용 — 나 자신에게 발송).
       서버가 없으면 최소한 화면에는 뜨도록 로컬 오류 형식으로 대체하지 않고 조용히 실패한다. */
    const fnAddSpecial = async (title, message, linkPage) => {
      if (ctx !== 'bo') return null;
      const svc = fnSvc();
      if (!svc) return null;
      try {
        const me = fnMe();
        if (!me) return null;
        await svc.send({
          recvList: [{ recvTypeCd: 'USER', recvId: me.id, recvNm: me.nm }],
          notiTypeCd: 'SPECIAL', notiTitle: title, notiContent: message || '', linkPage: linkPage || '',
        }, '알림', '특이사항등록');
        await fnLoadServer();
      } catch (_) { return null; }
    };

    /* fnMe — 현재 로그인 주체 (BO=사용자 / FO=회원) */
    const fnMe = () => {
      try {
        const key = ctx === 'fo' ? 'modu-fo-auth-authUser' : 'modu-bo-auth-authUser';
        const u   = JSON.parse(localStorage.getItem(key) || 'null');
        if (!u) return null;
        const id = ctx === 'fo' ? (u.memberId || u.authId || u.userId || '')
                                : (u.userId   || u.authId || u.memberId || '');
        if (!id) return null;
        return { type: ctx === 'fo' ? 'MEMBER' : 'USER', id: id, nm: u.authNm || u.name || '' };
      } catch (_) { return null; }
    };

    fnLoadLocal();
    fnSort();

    return {
      ctx, TYPE_META, TYPE_ORDER, CHANNEL_META,
      items, shakeSeq, uiState, cfUnreadCount, cfTypeCounts,
      fnAddError, fnAddSpecial, fnLoadServer,
      fnMarkRead, fnMarkUnread, fnMarkAllRead, fnRemove, fnClear,
      fnMe, fnFmtTime, fnTypeMeta, fnStripHtml,
    };
  };

  global.coNotiStore = { TYPE_META, TYPE_ORDER, CHANNEL_META, CODE_TO_TYPE, fnCreate, fnFmtTime, fnTypeMeta, fnStripHtml };

  /* 컨텍스트별 인스턴스 — 로드된 페이지에 맞는 것만 쓰면 된다 (양쪽 다 만들어도 가볍다) */
  global.boNotiStore = global.boNotiStore || fnCreate('bo');
  global.foNotiStore = global.foNotiStore || fnCreate('fo');
})(window);
