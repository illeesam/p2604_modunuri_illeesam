/* ShopJoy - 상단 알림 종 (FO·BO 공용)  window.CoNotiBell  →  <co-noti-bell ctx="bo">
 * ─────────────────────────────────────────────────────────────────────────
 * 상단 로그인 정보 옆에 붙는 종 아이콘. 누적 알림 개수를 뱃지로 표시하고,
 * 새 알림이 쌓이면 2초간 흔들어 알린다.
 *
 *   종 클릭      → 최근 6건 드롭다운
 *   ▾ 아이콘     → **그 자리에서 내용 펼쳐보기** (모달 없이 바로 확인)
 *   ↗ 아이콘     → **관련 상세화면으로 이동** (linkPage 가 있는 알림만 표시)
 *   ⛶ 전체보기   → 알림함 모달 (유형 필터 + 목록 + 상세)
 *   항목 클릭    → 상세 (오류는 500 화면과 같은 다크 URL 바 + 메시지 본문)
 *
 * 읽음/안읽음 구분 ⭐
 *   안읽음 : 좌측 유형색 3px 액센트 바 + 옅은 배경 + 굵은 제목 + 채운 점 + NEW 칩
 *   읽음   : 흰 배경 + 보통 굵기 + 회색 제목 + 빈 점 (한눈에 대비되도록 대비를 크게)
 *
 * 상태는 전부 {bo,fo}NotiStore 소유 — 이 컴포넌트는 표시/조작만 한다.
 * 오류는 브라우저에만, 공지/수신알림/특이사항은 sy_noti 테이블에 저장된다.
 * ───────────────────────────────────────────────────────────────────────── */
(function (global) {
  'use strict';

  /* ── 스타일 1회 주입 ─────────────────────────────────────────────
     헤더 전용 애니메이션을 테마 CSS 6개({bo,fo}GlobalStyle01/02/03)에 복제하지 않기 위함. */
  if (!document.getElementById('co-noti-bell-style')) {
    const st = document.createElement('style');
    st.id = 'co-noti-bell-style';
    st.textContent = [
      '@keyframes co-noti-shake{',
      ' 0%,100%{transform:rotate(0)} 8%{transform:rotate(-16deg)} 16%{transform:rotate(14deg)}',
      ' 24%{transform:rotate(-12deg)} 32%{transform:rotate(10deg)} 40%{transform:rotate(-8deg)}',
      ' 48%{transform:rotate(6deg)} 56%{transform:rotate(-4deg)} 64%{transform:rotate(3deg)}',
      ' 72%{transform:rotate(-2deg)} 80%{transform:rotate(1deg)}}',
      '@keyframes co-noti-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}',
      '.co-noti-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;',
      ' width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:15px;padding:0;transition:background .15s;}',
      '.co-noti-btn.ctx-bo{background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.22);color:#fff;}',
      '.co-noti-btn.ctx-bo:hover{background:rgba(255,255,255,.24);}',
      '.co-noti-btn.ctx-fo{background:transparent;border:1px solid var(--border,#e3e3e3);color:var(--text-primary,#333);}',
      '.co-noti-btn.ctx-fo:hover{background:rgba(0,0,0,.05);}',
      '.co-noti-btn.is-shake .co-noti-ico{animation:co-noti-shake 2s ease-in-out;transform-origin:50% 12%;}',
      '.co-noti-btn.is-shake .co-noti-badge{animation:co-noti-pulse .5s ease-in-out 4;}',
      '.co-noti-ico{display:inline-block;line-height:1;}',
      '.co-noti-badge{position:absolute;top:-5px;right:-5px;min-width:16px;height:16px;padding:0 4px;border-radius:9px;',
      ' background:#ef4444;color:#fff;font-size:10px;font-weight:800;line-height:16px;text-align:center;',
      ' box-shadow:0 0 0 2px rgba(0,0,0,.22);}',
      '.co-noti-dd{position:absolute;right:0;top:calc(100% + 8px);width:376px;background:#fff;border:1px solid #e5e7eb;',
      ' border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.20);z-index:9200;overflow:hidden;}',
      '.co-noti-dd-hd{display:flex;align-items:center;gap:6px;padding:9px 12px;border-bottom:1px solid #f0f0f0;background:#fafbfc;}',
      /* ── 행: 읽음/안읽음 대비 ── */
      '.co-noti-row{position:relative;display:flex;gap:8px;padding:9px 10px 9px 14px;border-bottom:1px solid #f2f4f7;',
      ' cursor:pointer;transition:background .12s;}',
      '.co-noti-row::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent;}',
      '.co-noti-row.is-read{background:#fff;}',
      '.co-noti-row.is-read:hover{background:#f6f7f9;}',
      '.co-noti-row.is-read .co-noti-title{color:#8b9099;font-weight:400;}',
      '.co-noti-row.is-read .co-noti-meta{color:#b6bbc3;}',
      '.co-noti-row.is-read .co-noti-emoji{opacity:.45;filter:grayscale(.7);}',
      '.co-noti-row.is-unread{background:#fbfcff;}',
      '.co-noti-row.is-unread:hover{background:#f2f6ff;}',
      '.co-noti-row.is-unread::before{background:var(--noti-accent,#2563eb);}',
      '.co-noti-row.is-unread .co-noti-title{color:#111827;font-weight:700;}',
      '.co-noti-row.is-unread .co-noti-meta{color:#6b7280;}',
      '.co-noti-title{display:block;font-size:12.5px;line-height:1.45;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.co-noti-meta{display:block;font-size:10.5px;margin-top:2px;}',
      '.co-noti-dot{flex-shrink:0;width:7px;height:7px;border-radius:50%;margin-top:6px;}',
      '.co-noti-row.is-read .co-noti-dot{background:#fff;border:1.5px solid #d5d9df;}',
      '.co-noti-new{display:inline-block;margin-left:6px;padding:0 4px;border-radius:3px;background:#ef4444;color:#fff;',
      ' font-size:9px;font-weight:800;line-height:14px;vertical-align:1px;}',
      /* ── 행 우측 아이콘 (펼침/이동) ── */
      '.co-noti-act{flex-shrink:0;display:flex;align-items:flex-start;gap:2px;padding-top:2px;}',
      '.co-noti-ibtn{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;padding:0;',
      ' border:1px solid #e5e7eb;background:#fff;border-radius:5px;cursor:pointer;font-size:10px;color:#6b7280;line-height:1;}',
      '.co-noti-ibtn:hover{background:#eef2ff;border-color:#c7d2fe;color:#4338ca;}',
      '.co-noti-ibtn.is-on{background:#eef2ff;border-color:#c7d2fe;color:#4338ca;}',
      /* ── 인라인 펼침 본문 ── */
      '.co-noti-body{padding:8px 12px 10px 26px;border-bottom:1px solid #f2f4f7;background:#fbfbfd;',
      ' font-size:11.5px;color:#4b5563;white-space:pre-wrap;word-break:break-word;line-height:1.6;max-height:180px;overflow-y:auto;}',
      '.co-noti-body-err{background:#fff5f5;color:#c62828;font-family:monospace;font-size:11px;}',
      /* 자체 버튼 스타일 — FO 전역 CSS 에는 .btn-secondary/.btn-xs/.btn-primary 가 없어
         BO 클래스에 기대면 FO 알림함 버튼이 무스타일로 렌더된다. 두 컨텍스트 공통으로 여기서 정의. */
      '.co-noti-b{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:6px;',
      ' border:1px solid #d8dce3;background:#fff;color:#4b5563;font-size:11px;font-weight:600;',
      ' cursor:pointer;line-height:1.7;white-space:nowrap;}',
      '.co-noti-b:hover{background:#f3f5f8;}',
      '.co-noti-b.is-on{background:#2563eb;border-color:#2563eb;color:#fff;}',
      '.co-noti-b.is-danger{border-color:#f0b4b4;color:#dc2626;}',
      '.co-noti-b.is-danger:hover{background:#fef2f2;}',
    ].join('\n');
    document.head.appendChild(st);
  }

  global.CoNotiBell = {
    name: 'CoNotiBell',
    props: {
      ctx:      { type: String,   default: 'bo' },    // 'bo' | 'fo' — 스토어/모달/색상 선택
      navigate: { type: Function, default: null },    // 알림 → 관련 화면 이동 (없으면 이동 아이콘 미표시)
    },
    setup(props) {
      const { reactive, computed, watch, onMounted, onBeforeUnmount } = Vue;
      const store = props.ctx === 'fo' ? global.foNotiStore : global.boNotiStore;

      /* ##### [01] 초기 변수 정의 ############################################ */
      const uiState = reactive({
        ddShow: false, listShow: false, shaking: false,
        filter: 'all', selectedKey: null,
        expanded: {},          // key → true (인라인 펼침 상태)
      });
      let _shakeTimer = null;
      let _pollTimer  = null;

      /* ##### [02] 파생값 ################################################### */
      const cfUnread   = computed(() => store.cfUnreadCount.value);
      const cfCounts   = computed(() => store.cfTypeCounts.value);
      const cfRecent   = computed(() => store.items.slice(0, 6));
      const cfFiltered = computed(() =>
        uiState.filter === 'all' ? store.items : store.items.filter((it) => it.type === uiState.filter));
      const cfSelected = computed(() =>
        uiState.selectedKey == null ? null : store.items.find((it) => it.key === uiState.selectedKey) || null);
      const cfTabs = computed(() => [{ key: 'all', label: '전체', icon: '📋' }].concat(
        store.TYPE_ORDER.map((t) => ({ key: t, label: store.TYPE_META[t].label, icon: store.TYPE_META[t].icon }))));
      /* 모달 태그 — BO/FO 각자의 표준 모달을 쓴다 */
      const cfModalTag = computed(() => (props.ctx === 'fo' ? 'fo-modal' : 'bo-modal'));

      /* ##### [03] 액션 모음 (dispatch) ###################################### */

      /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명') */
      const handleBtnAction = (cmd, param = {}) => {
        console.log(' ■■ CoNotiBell : handleBtnAction -> ', cmd, param);
        if (cmd === 'bell-toggle') {
          uiState.ddShow = !uiState.ddShow;
          if (uiState.ddShow) { store.fnLoadServer(); }
          return;
        } else if (cmd === 'list-open') {
          uiState.ddShow = false; uiState.listShow = true; uiState.selectedKey = null;
          store.fnLoadServer();
          return;
        } else if (cmd === 'list-close') {
          uiState.listShow = false; uiState.selectedKey = null;
          return;
        } else if (cmd === 'noti-reload') {
          return store.fnLoadServer();
        } else if (cmd === 'noti-markAllRead') {
          return store.fnMarkAllRead();
        } else if (cmd === 'noti-clear') {
          uiState.selectedKey = null;
          return store.fnClear();
        } else if (cmd === 'detail-close') {
          uiState.selectedKey = null;
          return;
        } else if (cmd === 'detail-markUnread') {
          return store.fnMarkUnread(uiState.selectedKey);
        } else {
          console.warn('[handleBtnAction] unknown cmd:', cmd);
        }
      };

      /* handleSelectAction — 행/선택 액션 dispatch */
      const handleSelectAction = (cmd, param = {}) => {
        console.log(' ■■ CoNotiBell : handleSelectAction -> ', cmd, param);
        if (cmd === 'noti-rowSelect') {
          return handleOpenDetail(param);
        } else if (cmd === 'noti-rowExpand') {
          return handleToggleExpand(param);
        } else if (cmd === 'noti-rowGo') {
          return handleGoPage(param);
        } else if (cmd === 'noti-rowRemove') {
          if (uiState.selectedKey === param.key) { uiState.selectedKey = null; }
          return store.fnRemove(param.key);
        } else if (cmd === 'filter-select') {
          uiState.filter = param; uiState.selectedKey = null;
          return;
        } else {
          console.warn('[handleSelectAction] unknown cmd:', cmd);
        }
      };

      /* ##### [04] 이벤트 처리 함수 ########################################## */

      /* handleToggleExpand — 그 자리에서 내용 펼치기/접기 (모달 없이 바로 확인).
         펼치는 것도 "확인"이므로 읽음 처리한다. */
      const handleToggleExpand = (noti) => {
        if (!noti) return;
        if (uiState.expanded[noti.key]) { delete uiState.expanded[noti.key]; return; }
        uiState.expanded[noti.key] = true;
        store.fnMarkRead(noti.key);
      };

      /* handleOpenDetail — 항목 클릭 → 읽음 처리 + 모달 상세 표시 */
      const handleOpenDetail = (noti) => {
        if (!noti) return;
        store.fnMarkRead(noti.key);
        uiState.ddShow = false; uiState.listShow = true; uiState.selectedKey = noti.key;
      };

      /* handleGoPage — 알림이 가리키는 상세화면으로 이동 */
      const handleGoPage = (noti) => {
        if (!noti || !noti.linkPage || !props.navigate) return;
        store.fnMarkRead(noti.key);
        uiState.ddShow = false; uiState.listShow = false;
        props.navigate(noti.linkPage);
      };

      /* ##### [05] 사용자 함수 (헬퍼) ######################################## */
      const fnMeta     = (type) => store.fnTypeMeta(type);
      const fnFmtTime  = (t) => store.fnFmtTime(t);
      /* fnShortUrl — 호스트 제거한 짧은 경로 (목록에서 도메인은 노이즈) */
      const fnShortUrl = (url) => String(url || '').replace(/^https?:\/\/[^/]+/, '');
      /* fnRowClass / fnRowStyle — 읽음·안읽음 대비 (좌측 액센트 바 색은 유형색) */
      const fnRowClass = (n) => 'co-noti-row ' + (n.read ? 'is-read' : 'is-unread');
      const fnRowStyle = (n) => ({ '--noti-accent': fnMeta(n.type).color });
      const fnDotStyle = (n) => (n.read ? {} : { background: fnMeta(n.type).color });
      const fnExpanded = (n) => !!uiState.expanded[n.key];
      /* fnCanGo — 이동 가능한 알림인지 (linkPage 가 있고 navigate 를 받은 경우만 ↗ 노출) */
      const fnCanGo    = (n) => !!(n.linkPage ? props.navigate : null);

      /* fnOutsideClick — 바깥 클릭 시 드롭다운 닫기 */
      const fnOutsideClick = () => { uiState.ddShow = false; };

      /* ##### [06] watch / 라이프사이클 ###################################### */

      /* 새 알림이 쌓이면 2초간 흔든다. 연달아 들어오면 타이머를 다시 시작해
         마지막 알림 기준으로 2초를 채운다(애니메이션 재시작을 위해 한 프레임 끈다). */
      watch(() => store.shakeSeq.value, () => {
        if (_shakeTimer) { clearTimeout(_shakeTimer); }
        uiState.shaking = false;
        requestAnimationFrame(() => { uiState.shaking = true; });
        _shakeTimer = setTimeout(() => { uiState.shaking = false; _shakeTimer = null; }, 2000);
      });

      onMounted(() => {
        document.addEventListener('click', fnOutsideClick);
        store.fnLoadServer();
        /* 다른 사람이 보낸 알림을 받으려면 주기 조회가 필요하다 (푸시 채널 없음) */
        _pollTimer = setInterval(() => store.fnLoadServer(), 60000);
      });
      onBeforeUnmount(() => {
        document.removeEventListener('click', fnOutsideClick);
        if (_shakeTimer) { clearTimeout(_shakeTimer); }
        if (_pollTimer)  { clearInterval(_pollTimer); }
      });

      /* ##### [07] return (템플릿 노출) ###################################### */
      return {
        uiState, cfUnread, cfCounts, cfRecent, cfFiltered, cfSelected, cfTabs, cfModalTag,
        fnMeta, fnFmtTime, fnShortUrl, fnRowClass, fnRowStyle, fnDotStyle, fnExpanded, fnCanGo,
        handleBtnAction, handleSelectAction,
      };
    },
    template: /* html */`
<div style="position:relative;flex-shrink:0;" @click.stop>
  <!-- ===== ■. 종 아이콘 + 카운트 뱃지 ====================================== -->
  <button class="co-noti-btn" :class="[ 'ctx-' + ctx, uiState.shaking ? 'is-shake' : '' ]"
    :title="'알림 ' + cfCounts.all + '건 · 안읽음 ' + cfUnread + '건'"
    @click="handleBtnAction('bell-toggle')">
    <span class="co-noti-ico">🔔</span>
    <span v-if="cfUnread" class="co-noti-badge">{{ cfUnread > 99 ? '99+' : cfUnread }}</span>
  </button>

  <!-- ===== ■. 최근 알림 드롭다운 ========================================== -->
  <div v-if="uiState.ddShow" class="co-noti-dd">
    <div class="co-noti-dd-hd">
      <span style="font-size:12px;font-weight:700;color:#374151;">알림</span>
      <span style="font-size:11px;color:#9ca3af;">{{ cfCounts.all }}건 · 안읽음 {{ cfUnread }}</span>
      <span style="flex:1;"></span>
      <button class="co-noti-b" title="새로고침" @click="handleBtnAction('noti-reload')">↻</button>
      <button v-if="cfUnread" class="co-noti-b" title="모두 읽음 처리"
        @click="handleBtnAction('noti-markAllRead')">모두읽음</button>
      <button class="co-noti-b" title="알림함 전체보기"
        @click="handleBtnAction('list-open')">⛶ 전체보기</button>
    </div>
    <div style="max-height:400px;overflow-y:auto;">
      <template v-for="n in cfRecent" :key="n.key">
        <div :class="fnRowClass(n)" :style="fnRowStyle(n)"
          @click="handleSelectAction('noti-rowSelect', n)">
          <span class="co-noti-dot" :style="fnDotStyle(n)"></span>
          <span class="co-noti-emoji" style="font-size:13px;flex-shrink:0;line-height:1.4;">{{ fnMeta(n.type).icon }}</span>
          <span style="flex:1;min-width:0;">
            <span class="co-noti-title" :title="n.title">
              {{ n.title }}<span v-if="!n.read" class="co-noti-new">NEW</span>
            </span>
            <span class="co-noti-meta">
              {{ fnMeta(n.type).label }} · {{ fnFmtTime(n.time) }}
              <span v-if="n.count > 1" style="color:#dc2626;font-weight:700;">· {{ n.count }}회</span>
            </span>
          </span>
          <!-- 우측 아이콘: 바로펼침 / 상세화면 이동 -->
          <span class="co-noti-act">
            <button class="co-noti-ibtn" :class="fnExpanded(n) ? 'is-on' : ''"
              :title="fnExpanded(n) ? '접기' : '내용 펼쳐보기'"
              @click.stop="handleSelectAction('noti-rowExpand', n)">{{ fnExpanded(n) ? '▴' : '▾' }}</button>
            <button v-if="fnCanGo(n)" class="co-noti-ibtn" title="상세화면으로 이동"
              @click.stop="handleSelectAction('noti-rowGo', n)">↗</button>
          </span>
        </div>
        <!-- 인라인 펼침 본문 (모달 없이 그 자리에서 확인) -->
        <div v-if="fnExpanded(n)" class="co-noti-body" :class="n.type === 'error' ? 'co-noti-body-err' : ''">{{ n.message || '(내용 없음)' }}</div>
      </template>
      <div v-if="!cfRecent.length" style="padding:28px 12px;text-align:center;color:#bbb;font-size:12px;">
        받은 알림이 없습니다.
      </div>
    </div>
  </div>

  <!-- ===== ■. 알림함 모달 (전체보기) ====================================== -->
  <component :is="cfModalTag" :show="uiState.listShow" title="알림함" width="1000px" min-height="520px" max-height="86vh"
    @close="handleBtnAction('list-close')">
    <!-- ===== ■.■. 유형 필터 + 툴바 ======================================== -->
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
      <button v-for="t in cfTabs" :key="t.key" class="co-noti-b"
        :class="uiState.filter === t.key ? 'is-on' : ''"
        @click="handleSelectAction('filter-select', t.key)">
        {{ t.icon }} {{ t.label }} <span style="opacity:.75;">{{ cfCounts[t.key] || 0 }}</span>
      </button>
      <span style="flex:1;"></span>
      <span style="font-size:11px;color:#9ca3af;">총 {{ cfCounts.all }}건 · 안읽음 {{ cfUnread }}건</span>
      <button class="co-noti-b" title="새로고침" @click="handleBtnAction('noti-reload')">↻</button>
      <button v-if="cfUnread" class="co-noti-b" @click="handleBtnAction('noti-markAllRead')">모두읽음</button>
      <button class="co-noti-b is-danger" @click="handleBtnAction('noti-clear')">전체삭제</button>
    </div>

    <!-- ===== ■.■. 알림 목록 =============================================== -->
    <div style="border:1px solid #eef0f3;border-radius:6px;background:#fff;max-height:320px;overflow-y:auto;">
      <template v-for="n in cfFiltered" :key="n.key">
        <div :class="fnRowClass(n)" :style="fnRowStyle(n)"
          @click="handleSelectAction('noti-rowSelect', n)">
          <span class="co-noti-dot" :style="fnDotStyle(n)"></span>
          <span class="co-noti-emoji" style="font-size:14px;flex-shrink:0;line-height:1.4;">{{ fnMeta(n.type).icon }}</span>
          <span style="flex:1;min-width:0;">
            <span class="co-noti-title" :title="n.title">
              {{ n.title }}<span v-if="!n.read" class="co-noti-new">NEW</span>
            </span>
            <span class="co-noti-meta">
              <span class="badge" :style="{ background: fnMeta(n.type).bg, color: fnMeta(n.type).color, border: '1px solid ' + fnMeta(n.type).border, fontSize: '10px' }">
                {{ fnMeta(n.type).label }}
              </span>
              <span style="margin-left:6px;">{{ fnFmtTime(n.time) }}</span>
              <span v-if="n.count > 1" style="color:#dc2626;font-weight:700;margin-left:6px;">{{ n.count }}회 반복</span>
              <span v-if="n.url" style="margin-left:6px;font-family:monospace;">{{ fnShortUrl(n.url) }}</span>
              <span v-if="n.local" style="margin-left:6px;color:#c0c4cc;" title="브라우저에만 보관 (DB 미저장)">· 로컬</span>
            </span>
          </span>
          <span class="co-noti-act">
            <button class="co-noti-ibtn" :class="fnExpanded(n) ? 'is-on' : ''"
              :title="fnExpanded(n) ? '접기' : '내용 펼쳐보기'"
              @click.stop="handleSelectAction('noti-rowExpand', n)">{{ fnExpanded(n) ? '▴' : '▾' }}</button>
            <button v-if="fnCanGo(n)" class="co-noti-ibtn" title="상세화면으로 이동"
              @click.stop="handleSelectAction('noti-rowGo', n)">↗</button>
            <button class="co-noti-ibtn" title="이 알림 삭제"
              @click.stop="handleSelectAction('noti-rowRemove', n)">✕</button>
          </span>
        </div>
        <div v-if="fnExpanded(n)" class="co-noti-body" :class="n.type === 'error' ? 'co-noti-body-err' : ''">{{ n.message || '(내용 없음)' }}</div>
      </template>
      <div v-if="!cfFiltered.length" style="padding:36px 12px;text-align:center;color:#bbb;font-size:12px;">
        해당 유형의 알림이 없습니다.
      </div>
    </div>

    <!-- ===== ■.■. 상세 (오류는 500 화면과 동일 구성) ======================== -->
    <div v-if="cfSelected" style="margin-top:12px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="font-size:12px;font-weight:700;color:#374151;">
          {{ fnMeta(cfSelected.type).icon }} {{ cfSelected.title }}
        </span>
        <span style="flex:1;"></span>
        <button v-if="fnCanGo(cfSelected)" class="co-noti-b"
          @click="handleSelectAction('noti-rowGo', cfSelected)">상세화면으로 이동 ↗</button>
        <button class="co-noti-b" title="안읽음으로 되돌리기"
          @click="handleBtnAction('detail-markUnread')">안읽음</button>
        <button class="co-noti-b" @click="handleBtnAction('detail-close')">닫기</button>
      </div>

      <!-- 오류: 다크 URL 바 + 화면>기능 + 빨간 메시지 본문 -->
      <template v-if="cfSelected.type === 'error'">
        <div style="display:flex;align-items:center;gap:8px;background:#1e1e2e;color:#cdd6f4;padding:10px 14px;border-radius:8px 8px 0 0;font-family:monospace;font-size:13px;flex-wrap:wrap;">
          <span v-if="cfSelected.method" style="background:#f38ba8;color:#1e1e2e;padding:2px 8px;border-radius:4px;font-weight:700;font-size:12px;">
            {{ cfSelected.method }}
          </span>
          <span style="flex:1;word-break:break-all;color:#89dceb;">{{ cfSelected.url }}</span>
          <span style="background:#fab387;color:#1e1e2e;padding:2px 8px;border-radius:4px;font-weight:700;font-size:12px;">
            {{ cfSelected.status }}
          </span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;background:#2a2a3e;padding:6px 14px;border-top:1px solid #444466;font-family:monospace;font-size:11px;flex-wrap:wrap;">
          <span style="color:#94a3b8;font-size:10px;">화면 &gt; 기능:</span>
          <span style="color:#e879f9;font-weight:700;">{{ cfSelected.uiLabel || '-' }}</span>
          <span style="color:#64748b;margin:0 6px;">|</span>
          <span style="color:#94a3b8;font-size:10px;">발생:</span>
          <span style="color:#38bdf8;font-weight:700;">{{ fnFmtTime(cfSelected.time) }}</span>
          <span v-if="cfSelected.count > 1" style="color:#fab387;font-weight:700;">· {{ cfSelected.count }}회 반복</span>
        </div>
        <div style="font-size:12px;color:#c62828;background:#fff5f5;padding:10px 14px;border-radius:0 0 8px 8px;border:1px solid #fca5a5;border-top:none;font-family:monospace;white-space:pre-wrap;word-break:break-all;">{{ cfSelected.message || '(메시지 없음)' }}</div>
      </template>

      <!-- 공지/수신알림/특이사항: 유형 색상 카드 -->
      <div v-else
        :style="{ background: fnMeta(cfSelected.type).bg, border: '1px solid ' + fnMeta(cfSelected.type).border }"
        style="padding:12px 14px;border-radius:8px;font-size:12.5px;color:#374151;white-space:pre-wrap;word-break:break-word;line-height:1.6;min-height:60px;">{{ cfSelected.message || '(내용 없음)' }}</div>
    </div>
  </component>
</div>
`,
  };
})(window);
