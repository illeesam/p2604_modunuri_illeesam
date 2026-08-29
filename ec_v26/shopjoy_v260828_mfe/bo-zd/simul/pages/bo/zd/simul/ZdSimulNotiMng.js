/* ZdSimulNotiMng — 알림 시뮬레이션 (메시지전송 / 공지사항생성 / 오류정보생성)
 * ─────────────────────────────────────────────────────────────────────────
 * 6개 메뉴가 이 컴포넌트 하나를 mode prop 으로 갈아끼워 쓴다 — 발송 대상 선택·
 * 템플릿 선택·시나리오 프리셋·전송 이력 구조가 채널만 다르고 완전히 같기 때문이다.
 *
 *   mode='kakao'  알림톡     mode='sms'    SMS       mode='mail'  메일
 *   mode='chat'   채팅        mode='notice' 공지생성   mode='error' 오류정보생성
 *
 * 전송 흐름
 *   ① 수신자 선택 — 회원/사용자를 공통 선택 팝업(cm_popup: member/user)으로 다건 선택.
 *      이메일·연락처는 항상 표시한다(회원 이메일 = 로그인ID).
 *   ② 템플릿 선택(선택사항) — sy_template 에서 채널에 맞는 템플릿을 검색해 제목/본문 채움
 *   ③ 백엔드 발송 API 호출 (/co/cm/send/{mail|sms|kakao}) — 실패해도 시뮬은 계속된다
 *   ④ sy_noti 에 수신자별 1행 적재 (/bo/sy/noti/send)
 *      → 수신자 본인의 BO/FO 화면 상단 종 아이콘에 알림으로 뜬다 (DB 저장이라 기기·브라우저 무관)
 *
 * 오류정보생성(mode='error') 은 수신자 개념 없이 내 알림함에 바로 오류를 쌓는다.
 * 오류 알림은 DB 에 저장하지 않는다 — 서버가 죽었을 때 발생하는 정보라 그때 DB 쓰기가 불가능하다.
 * ───────────────────────────────────────────────────────────────────────── */

  /* 모드 메타 — 화면 제목/설명/발송 API/알림 유형/템플릿 유형을 한 곳에서 관리 */
  const MODE_META = {
    kakao:  { title: '메시지전송 (알림톡)', icon: '🟡', channel: 'kakao', notiType: 'ALARM',
              api: '/co/cm/send/kakao', tplTypes: ['KAKAO'], tplLabel: '알림톡',
              desc: '카카오 알림톡 발송 시뮬레이션 — 주문유형별 전송 / 문의 / 인증정보 전송' },
    sms:    { title: '메시지전송 (SMS)',    icon: '💬', channel: 'sms',   notiType: 'ALARM',
              api: '/co/cm/send/sms',   tplTypes: ['SMS'],   tplLabel: 'SMS',
              desc: 'SMS 발송 시뮬레이션 — 주문유형별 전송 / 문의 / 인증정보 전송' },
    mail:   { title: '메시지전송 (메일)',   icon: '✉️', channel: 'mail',  notiType: 'ALARM',
              api: '/co/cm/send/mail',  tplTypes: ['MAIL', 'EMAIL'], tplLabel: '메일',
              desc: '메일 발송 시뮬레이션 — 주문유형별 전송 / 문의 / 인증정보 전송' },
    chat:   { title: '메시지전송 (채팅)',   icon: '🗨️', channel: 'chat',  notiType: 'ALARM',
              api: '',                  tplTypes: [], tplLabel: '채팅',
              desc: '상담 채팅 메시지 발송 시뮬레이션' },
    notice: { title: '공지사항 생성',       icon: '📢', channel: 'notice', notiType: 'NOTICE',
              api: '',                  tplTypes: [],
              desc: '공지사항을 등록하고 대상에게 공지 알림을 발송' },
    error:  { title: '오류정보 생성',       icon: '💥', channel: '',       notiType: 'ERROR',
              api: '',                  tplTypes: [],
              desc: '500 / 403 등 오류 알림을 내 알림함에 주입해 표시를 확인 (DB 미저장)' },
  };

  /* 시나리오 프리셋 — 주문유형별 / 문의 / 인증정보 (제목·본문 자동 채움) */
  const SCENARIOS = [
    { key: 'ORDER_DONE',   label: '주문완료',     title: '[주문완료] 주문이 정상 접수되었습니다',
      body: '주문번호 {orderNo} 주문이 접수되었습니다.\n결제금액: {amount}원\n감사합니다.' },
    { key: 'ORDER_PAY',    label: '결제완료',     title: '[결제완료] 결제가 완료되었습니다',
      body: '주문번호 {orderNo} 결제가 완료되었습니다.\n결제금액: {amount}원' },
    { key: 'ORDER_DLIV',   label: '배송출발',     title: '[배송출발] 상품이 발송되었습니다',
      body: '주문번호 {orderNo} 상품이 발송되었습니다.\n송장번호: {invoiceNo}' },
    { key: 'ORDER_CANCEL', label: '주문취소',     title: '[주문취소] 주문이 취소되었습니다',
      body: '주문번호 {orderNo} 주문이 취소되었습니다.\n환불금액: {amount}원' },
    { key: 'INQUIRY',      label: '문의 답변',    title: '[문의] 문의하신 내용에 답변이 등록되었습니다',
      body: '문의하신 내용에 답변이 등록되었습니다.\n마이페이지 > 문의내역에서 확인해 주세요.' },
    { key: 'AUTH_CODE',    label: '인증정보 전송', title: '[인증] 인증번호를 안내드립니다',
      body: '인증번호는 [{authCode}] 입니다.\n3분 이내에 입력해 주세요.' },
    { key: 'NOTICE',       label: '공지 안내',    title: '[공지] 서비스 안내드립니다',
      body: '안녕하세요.\n서비스 이용 관련 안내드립니다.' },
    { key: 'CUSTOM',       label: '직접 입력',    title: '', body: '' },
  ];

  /* 오류 프리셋 — 오류정보생성 전용 */
  const ERROR_PRESETS = [
    { key: 500, label: '500 서버 오류',   method: 'GET',  url: '/api/bo/ec/cm/dashboard/list',  uiLabel: '대시보드 > 목록조회',
      message: 'Internal Server Error\nERROR: column "issue_id" does not exist' },
    { key: 403, label: '403 권한 없음',   method: 'POST', url: '/api/bo/sy/user/save',          uiLabel: '사용자관리 > 저장',
      message: 'Forbidden — 해당 기능에 대한 권한이 없습니다.' },
    { key: 404, label: '404 없음',        method: 'GET',  url: '/api/bo/ec/pd/prod/999999',     uiLabel: '상품관리 > 상세조회',
      message: 'Not Found — 존재하지 않는 데이터입니다.' },
    { key: 401, label: '401 인증 만료',   method: 'GET',  url: '/api/bo/sy/menu/tree',          uiLabel: '메뉴관리 > 트리조회',
      message: 'Unauthorized — 세션이 만료되었습니다. 다시 로그인해 주세요.' },
    { key: 0,   label: '0 네트워크 오류', method: 'GET',  url: '/api/co/cm/bo-app-store/getInitData', uiLabel: '시스템 > 초기화데이터조회',
      message: 'Network Error — timeout of 8000ms exceeded' },
  ];

  export default {
    name: 'ZdSimulNotiMng',
    props: {
      navigate:    { type: Function, required: true },                       // 페이지 이동
      mode:        { type: String,   default: 'mail' },                      // kakao|sms|mail|chat|notice|error
      showToast:   { type: Function, default: () => {} },                    // 토스트 알림
      showConfirm: { type: Function, default: () => Promise.resolve(true) }, // 확인 모달
    },
    setup(props) {

      /* ##### [01] 초기 변수 정의 #################################################### */
      const { reactive, computed, onMounted } = Vue;
      const store = window.boNotiStore;

      const uiState = reactive({ sending: false, pickModal: '', tplLoading: false, tplId: null, recvTab: 'user' });
      const codes   = reactive({});

      /* 발송 폼 */
      const baseForm = reactive({
        scenario: 'ORDER_DONE',
        title:    '',
        content:  '',
        orderNo:  '20260815000123',
        amount:   '39,000',
        invoiceNo: '1234567890',
        authCode: '482913',
      });

      /* 오류 생성 폼 */
      const errorForm = reactive({ preset: 500, repeat: 1 });

      /* 수신자 목록 — [{ toType:'member'|'user', toId, toNm, toEmail, toPhone }] */
      const recipients = reactive([]);

      /* 수신 대상 탭 — 회원/사용자를 한 그리드에 섞지 않는다.
         선택 팝업이 유형별로 따로라서, 목록도 같은 축으로 나눠야 어느 팝업과 연결된 행인지 헷갈리지 않는다. */
      const recvTabs = reactive([
        { id: 'member', label: '회원',   icon: '👤', get count() { return recipients.filter(r => r.toType === 'member').length; } },
        { id: 'user',   label: '사용자', icon: '🧑', get count() { return recipients.filter(r => r.toType === 'user').length; } },
      ]);

      /* 템플릿 목록 (sy_template) + 검색 */
      const tplSearch = reactive({ searchValue: '' });
      const templates = reactive([]);

      /* 전송 이력 (이 화면 안에서만 보관 — 시뮬 결과 확인용) */
      const sendLogs = reactive([]);

      /* ##### [02] 액션 모음 (dispatch) ############################################## */

      /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명') */
      const handleBtnAction = (cmd, param = {}) => {
        console.log(' ■■ ZdSimulNotiMng : handleBtnAction -> ', cmd, param);
        if (cmd === 'pick-close') {
          uiState.pickModal = '';
          return;
        } else if (cmd === 'recvTab-pick') {
          /* 현재 탭에 해당하는 선택 팝업을 연다 */
          uiState.pickModal = uiState.recvTab;
          return;
        } else if (cmd === 'recipients-clear') {
          /* 현재 탭 목록만 비운다 (다른 유형 선택은 유지) */
          const keep = recipients.filter(r => r.toType !== uiState.recvTab);
          recipients.splice(0, recipients.length, ...keep);
          return;
        } else if (cmd === 'templates-search') {
          return handleLoadTemplates();
        } else if (cmd === 'templates-reset') {
          tplSearch.searchValue = '';
          return handleLoadTemplates();
        } else if (cmd === 'baseForm-send') {
          return handleSend();
        } else if (cmd === 'errorForm-make') {
          return handleMakeError();
        } else if (cmd === 'sendLogs-clear') {
          sendLogs.splice(0, sendLogs.length);
          return;
        } else {
          console.warn('[handleBtnAction] unknown cmd:', cmd);
        }
      };

      /* handleSelectAction — 행/선택 액션 dispatch */
      const handleSelectAction = (cmd, param = {}) => {
        console.log(' ■■ ZdSimulNotiMng : handleSelectAction -> ', cmd, param);
        if (cmd === 'recvTab-select') {
          uiState.recvTab = param;
          return;
        } else if (cmd === 'scenario-select') {
          return fnApplyScenario(param);
        } else if (cmd === 'template-select') {
          return handleApplyTemplate(param);
        } else if (cmd === 'recipients-remove') {
          const i = recipients.findIndex((r) => r.toType === param.toType ? (r.toId === param.toId) : false);
          if (i >= 0) { recipients.splice(i, 1); }
          return;
        } else if (cmd === 'errorPreset-select') {
          errorForm.preset = param;
          return;
        } else {
          console.warn('[handleSelectAction] unknown cmd:', cmd);
        }
      };

      /* fnCallbackModal — 공통 선택 팝업 콜백 (modalName, _, payload)
         팝업에 init-selected-ids 를 넘겼으므로 payload 는 "그 유형의 최종 선택 전체"다.
         → 해당 유형만 통째로 교체한다. 그래야 팝업에서 해제한 항목이 실제로 빠진다. */
      const fnCallbackModal = (modalName, _unused, payload) => {
        uiState.pickModal = '';
        if (!payload) return;
        const rows     = Array.isArray(payload) ? payload : [payload];
        const isMember = modalName === 'memberPick';
        const toType   = isMember ? 'member' : 'user';

        const next = [];
        rows.forEach((r) => {
          const toId = isMember ? (r.memberId || r.id) : (r.userId || r.id);
          if (!toId) return;
          if (next.some((x) => x.toId === String(toId))) return;
          next.push({
            toType: toType,
            toId:   String(toId),
            toNm:   (isMember ? (r.memberNm || r.nm || r.name) : (r.userNm || r.nm || r.name)) || String(toId),
            /* 이메일은 전용 컬럼만 쓴다 — 로그인ID 로 폴백하면 sim_09960 같은 값이
               이메일인 것처럼 보여 오히려 오해를 부른다. 없으면 '-' 로 비운다. */
            toEmail: isMember ? (r.memberEmail || '') : (r.userEmail || ''),
            toPhone: isMember ? (r.memberPhone || '') : (r.userPhone || ''),
          });
        });

        /* 다른 유형은 그대로 두고 이번 유형만 교체 */
        const others = recipients.filter((x) => x.toType !== toType);
        recipients.splice(0, recipients.length, ...others, ...next);
      };

      /* ##### [03] 이벤트 처리 함수 ################################################## */

      /* handleLoadTemplates — 채널에 맞는 템플릿 목록 조회 (sy_template) */
      const handleLoadTemplates = async () => {
        if (!cfMeta.value.tplTypes.length) { templates.splice(0, templates.length); return; }
        uiState.tplLoading = true;
        try {
          /* 유형이 2개(MAIL/EMAIL)일 수 있어 유형별로 조회 후 합친다 */
          const results = await Promise.all(cfMeta.value.tplTypes.map((t) =>
            boApiSvc.syTemplate.getPage({
              pageNo: 1, pageSize: 100, templateTypeCd: t, useYn: 'Y',
              searchValue: tplSearch.searchValue || undefined,
            }, '알림시뮬', '템플릿조회')));
          const rows = [];
          results.forEach((res) => { (res.data?.data?.pageList || []).forEach((x) => rows.push(x)); });
          templates.splice(0, templates.length, ...rows);
        } catch (err) {
          templates.splice(0, templates.length);
          props.showToast(coUtil.cofErrMsg(err, '템플릿 조회 실패'), 'error', 0);
        } finally {
          uiState.tplLoading = false;
        }
      };

      /* handleApplyTemplate — 템플릿 선택 → 제목/내용 채움 */
      const handleApplyTemplate = (t) => {
        if (!t) return;
        uiState.tplId     = t.templateId;
        baseForm.scenario = 'CUSTOM';
        baseForm.title    = t.templateSubject || t.templateNm || '';
        baseForm.content  = coNotiStore.fnStripHtml(t.templateContent || '');
        props.showToast(`템플릿 [${t.templateNm}] 을 적용했습니다.`, 'success');
      };

      /* handleSend — 메시지/공지 발송: 백엔드 채널 호출 + sy_noti 적재(수신자별 1행) */
      const handleSend = async () => {
        if (!recipients.length) { props.showToast('수신자를 먼저 선택해 주세요.', 'error'); return; }
        if (!baseForm.title)    { props.showToast('제목을 입력해 주세요.', 'error'); return; }
        const ok = await props.showConfirm('발송', `수신자 ${recipients.length}명에게 ${cfMeta.value.title}을 발송하시겠습니까?`);
        if (!ok) return;

        uiState.sending = true;
        const title = fnFillVars(baseForm.title);
        const body  = fnFillVars(baseForm.content);
        let apiMsg  = '';

        /* ① 실제 채널 발송 시도 — 시뮬레이션이므로 실패해도 흐름은 계속(사유만 이력에 남김) */
        if (cfMeta.value.api) {
          try {
            await boApi.post(cfMeta.value.api, {
              subject: title, content: body,
              sendTo: recipients.map((r) => r.toEmail || r.toPhone || r.toId).join(','),
              alarmTypeCd: baseForm.scenario,
            }, coUtil.cofApiHdr('알림시뮬', '발송'));
            apiMsg = '채널 발송 OK';
          } catch (err) {
            apiMsg = '채널 발송 실패: ' + (coUtil.cofErrMsg(err, '알 수 없음'));
          }
        } else {
          apiMsg = '채널 발송 API 없음 (알림만 적재)';
        }

        /* ② sy_noti 적재 — 수신자 본인 화면의 종 아이콘에 뜬다 (DB 저장) */
        let saved = 0;
        try {
          const res = await boApiSvc.syNoti.send({
            recvList: recipients.map((r) => ({
              recvTypeCd: r.toType === 'member' ? 'MEMBER' : 'USER',
              recvId: r.toId, recvNm: r.toNm,
            })),
            notiTypeCd: cfMeta.value.notiType,
            channelCd:  cfMeta.value.channel,
            notiTitle:  title,
            notiContent: body,
          }, '알림시뮬', '알림발송');
          saved = res.data?.data || recipients.length;
          apiMsg += ' / 알림 저장 ' + saved + '건';
        } catch (err) {
          apiMsg += ' / 알림 저장 실패: ' + (coUtil.cofErrMsg(err, '알 수 없음'));
        }

        sendLogs.unshift({
          logId: Date.now(), time: new Date(),
          channel: cfMeta.value.title, title: title,
          toCount: saved, toNames: recipients.map((r) => r.toNm).join(', '), result: apiMsg,
        });
        uiState.sending = false;
        props.showToast(`${saved}명에게 발송했습니다. (${apiMsg})`, saved > 0 ? 'success' : 'error', saved > 0 ? 3500 : 0);
        /* 내가 나에게 보낸 경우 즉시 종에 반영 */
        store.fnLoadServer();
      };

      /* handleMakeError — 오류 알림 주입 (수신자 없음 — 내 알림함에 바로 쌓임, DB 미저장) */
      const handleMakeError = async () => {
        const p = ERROR_PRESETS.find((e) => e.key === errorForm.preset);
        if (!p) return;
        const cnt = Math.max(1, Math.min(20, Number(errorForm.repeat) || 1));
        const ok = await props.showConfirm('오류 생성', `[${p.label}] 알림을 ${cnt}건 생성하시겠습니까?`);
        if (!ok) return;

        for (let i = 0; i < cnt; i++) {
          store.fnAddError({ status: p.key, method: p.method, fullUrl: p.url, uiLabel: p.uiLabel, message: p.message });
        }
        sendLogs.unshift({
          logId: Date.now(), time: new Date(), channel: '오류정보 생성',
          title: p.label, toCount: cnt, toNames: '(내 알림함)',
          result: '동일 오류는 1건으로 병합되고 반복 횟수로 표시됩니다. (DB 미저장)',
        });
        props.showToast(`[${p.label}] ${cnt}건을 생성했습니다. 상단 🔔 을 확인하세요.`, 'success');
      };

      /* ##### [04] 사용자 함수 (헬퍼) ################################################ */

      /* fnApplyScenario — 시나리오 프리셋 → 제목/본문 자동 채움 */
      const fnApplyScenario = (key) => {
        baseForm.scenario = key;
        uiState.tplId = null;
        const s = SCENARIOS.find((x) => x.key === key);
        if (!s) return;
        baseForm.title   = s.title;
        baseForm.content = s.body;
      };

      /* fnSeedLoginRecipients — 현재 로그인된 주체를 수신자 기본값으로 넣는다.
         BO 로그인 사용자(사용자 탭) + 같은 브라우저에 FO 로그인 회원이 있으면 회원 탭에도.
         "나에게 보내보기" 가 시뮬레이션의 기본 동작이라 매번 직접 고르지 않아도 되게 한다.
         (기본값일 뿐 ✕ 로 뺄 수 있다) */
      const fnSeedLoginRecipients = () => {
        const seed = (storeKey, toType) => {
          let u = null;
          try { u = JSON.parse(localStorage.getItem(storeKey) || 'null'); } catch (_) { u = null; }
          if (!u) return;
          const toId = toType === 'member'
            ? (u.memberId || u.authId || '')
            : (u.userId   || u.authId || '');
          if (!toId) return;
          if (recipients.some((r) => r.toType === toType ? (r.toId === String(toId)) : false)) return;
          recipients.push({
            toType: toType,
            toId:   String(toId),
            toNm:   (u.authNm || u.name || u.userNm || u.memberNm || String(toId)),
            toEmail: u.email || u.userEmail || u.memberEmail || '',
            toPhone: u.phone || u.userPhone || u.memberPhone || '',
          });
        };
        seed('modu-bo-auth-authUser', 'user');
        seed('modu-fo-auth-authUser', 'member');
      };

      /* fnFillVars — {orderNo}/{amount}/{invoiceNo}/{authCode} 치환 */
      const fnFillVars = (txt) => String(txt || '')
        .replace(/\{orderNo\}/g,   baseForm.orderNo)
        .replace(/\{amount\}/g,    baseForm.amount)
        .replace(/\{invoiceNo\}/g, baseForm.invoiceNo)
        .replace(/\{authCode\}/g,  baseForm.authCode);

      const fnFmtTime = (t) => coNotiStore.fnFmtTime(t);

      /* ##### [05] 파생값 ########################################################### */
      const cfMeta       = computed(() => MODE_META[props.mode] || MODE_META.mail);
      const cfIsError    = computed(() => props.mode === 'error');
      const cfHasTpl     = computed(() => cfMeta.value.tplTypes.length > 0);
      const cfMemberCnt  = computed(() => recipients.filter((r) => r.toType === 'member').length);
      const cfUserCnt    = computed(() => recipients.filter((r) => r.toType === 'user').length);
      /* 팝업 프리체크용 — 목록에서 빠지지 않고 '선택됨(진하게)' 으로 보이며 클릭 시 해제된다 */
      const cfRecvList   = computed(() => recipients.filter((r) => r.toType === uiState.recvTab));
      /* 팝업 프리체크는 **그 유형만** 넘긴다 — 유형이 섞이면 엉뚱한 행이 선택돼 보인다 */
      const cfPickedIds  = computed(() => recipients.filter((r) => r.toType === uiState.pickModal).map((r) => r.toId));
      const cfPreviewTitle = computed(() => fnFillVars(baseForm.title));
      const cfPreviewBody  = computed(() => fnFillVars(baseForm.content));
      /* 폼 컬럼 — raw form-group 대신 표준 컴포넌트(bo-form-area)로 렌더한다.
         PdProdMng/PdProdDtl 과 같은 컴포넌트를 쓰므로 필드 높이·간격이 자동으로 표준과 일치한다. */
      const sendFormColumns = [
        { key: 'title',   label: '제목', type: 'text', required: true, placeholder: '제목을 입력하세요' },
        { key: 'content', label: '내용', type: 'textarea', rows: 5,
          placeholder: '본문을 입력하세요. {orderNo} {amount} {invoiceNo} {authCode} 는 우측 치환 파라미터 값으로 바뀝니다.' },
      ];
      const paramFormColumns = [
        { key: 'orderNo',   label: '주문번호 {orderNo}',   type: 'text' },
        { key: 'amount',    label: '금액 {amount}',        type: 'text' },
        { key: 'invoiceNo', label: '송장번호 {invoiceNo}', type: 'text' },
        { key: 'authCode',  label: '인증번호 {authCode}',  type: 'text' },
      ];
      const errorFormColumns = [
        { key: 'repeat', label: '생성 건수 (1~20)', type: 'number' },
      ];

      /* 이력 그리드 컬럼 */
      const logGridColumns = [
        { key: 'time',    label: '시각',   style: 'width:80px;', align: 'center', mono: true, fmt: (v, row) => fnFmtTime(row.time) },
        { key: 'channel', label: '채널',   style: 'width:140px;' },
        { key: 'title',   label: '제목',   cellTitle: true },
        { key: 'toCount', label: '건수',   style: 'width:56px;', align: 'right' },
        { key: 'toNames', label: '수신자', style: 'width:200px;', cellTitle: true },
        { key: 'result',  label: '결과',   style: 'width:300px;', cellTitle: true },
      ];

      /* ##### [06] 초기화 ########################################################### */
      const initPage = async () => {
        if (props.mode === 'notice') { fnApplyScenario('NOTICE'); }
        else if (!cfIsError.value)   { fnApplyScenario('ORDER_DONE'); }
        if (!cfIsError.value) { fnSeedLoginRecipients(); }   /* 오류생성은 수신자 개념이 없다 */
        if (cfHasTpl.value) { await handleLoadTemplates(); }
      };
      onMounted(initPage);

      /* ##### [07] return (템플릿 노출) ############################################## */
      return {
        uiState, codes, baseForm, errorForm, recipients, sendLogs, templates, tplSearch,
        SCENARIOS, ERROR_PRESETS, logGridColumns, sendFormColumns, paramFormColumns, errorFormColumns,
        cfMeta, cfIsError, cfHasTpl, cfMemberCnt, cfUserCnt, cfPickedIds, cfRecvList, recvTabs, cfPreviewTitle, cfPreviewBody,
        fnFmtTime, fnCallbackModal, handleBtnAction, handleSelectAction,
      };
    },
    template: /* html */`
<bo-page :title="cfMeta.icon + ' ' + cfMeta.title" :desc-summary="cfMeta.desc">
  <!-- ===== ■. 오류정보 생성 모드 ========================================== -->
  <template v-if="cfIsError">
    <bo-container title="오류 알림 생성">
      <div style="padding:4px 0 10px;">
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
          <button v-for="p in ERROR_PRESETS" :key="p.key" class="btn btn-xs"
            :class="errorForm.preset === p.key ? 'btn-primary' : 'btn-secondary'"
            @click="handleSelectAction('errorPreset-select', p.key)">{{ p.label }}</button>
        </div>
        <bo-form-area :columns="errorFormColumns" :form="errorForm" :errors="{}"
          :cols="3" :show-actions="false" />
        <div style="margin-top:10px;font-size:11.5px;color:#888;line-height:1.6;">
          · 실제 서버에 오류를 일으키지 않고, 알림 표시를 확인하기 위해 내 알림함에 직접 주입합니다.<br/>
          · 같은 오류를 여러 건 생성하면 한 줄로 병합되고 <b>N회 반복</b> 으로 표시됩니다
            (백엔드 장애 시 같은 오류가 쏟아지는 상황 재현).<br/>
          · 오류 알림은 <b>DB 에 저장하지 않습니다</b> — 서버가 죽었을 때 발생하는 정보라 그때 DB 쓰기가 불가능합니다.
        </div>
        <div class="form-actions">
          <button class="btn btn_save" :disabled="uiState.sending" @click="handleBtnAction('errorForm-make')">
            오류 알림 생성
          </button>
        </div>
      </div>
    </bo-container>
  </template>

  <!-- ===== ■. 메시지/공지 발송 모드 ======================================= -->
  <template v-else>
    <!-- 좌: 수신대상·템플릿 / 중: 발송내용·미리보기 / 우: 치환 파라미터(세로 나열) -->
    <div style="display:grid;grid-template-columns:minmax(300px,30%) minmax(0,1fr) minmax(190px,220px);gap:0 12px;align-items:start;">
      <!-- ===== ■.■. 좌: 수신자 + 템플릿 ==================================== -->
      <div>
        <bo-container title="수신 대상" :count-text="recipients.length + '명'">
          <template #toolbar-actions>
            <button class="btn btn-secondary btn-sm" @click="handleBtnAction('recipients-clear')">
              {{ uiState.recvTab === 'member' ? '회원' : '사용자' }} 비우기
            </button>
          </template>
          <!-- 회원/사용자를 한 그리드에 섞지 않는다 — 선택 팝업이 유형별로 따로라 목록도 같은 축으로 나눈다 -->
          <bo-tab-bar :tabs="recvTabs" :tab="uiState.recvTab" :show-modes="false"
            @tab-select="id => handleSelectAction('recvTab-select', id)" />
          <div style="display:flex;align-items:center;gap:8px;padding:8px 0;">
            <button class="btn btn_new" @click="handleBtnAction('recvTab-pick')">
              ＋ {{ uiState.recvTab === 'member' ? '회원' : '사용자' }} 선택
            </button>
            <span style="font-size:11px;color:#888;">목록에서 여러 건을 한 번에 고를 수 있습니다.</span>
          </div>
          <div style="border:1px solid #eef0f3;border-radius:6px;background:#fff;max-height:210px;overflow-y:auto;overflow-x:hidden;">
            <!-- 수신자 1명 = 1줄 (이름 · 이메일 · 연락처). ID 는 폭만 차지하고 쓸 일이 없어 미표시 -->
            <div v-for="r in cfRecvList" :key="r.toType + '-' + r.toId"
              style="display:flex;align-items:center;gap:6px;padding:5px 8px;border-bottom:1px solid #f5f5f5;font-size:11.5px;white-space:nowrap;min-width:0;">
              <span style="flex-shrink:0;font-weight:600;color:#374151;max-width:110px;overflow:hidden;text-overflow:ellipsis;"
                :title="r.toNm">{{ r.toNm }}</span>
              <span style="flex:1;min-width:0;color:#6b7280;overflow:hidden;text-overflow:ellipsis;"
                :title="r.toEmail">✉ {{ r.toEmail || '-' }}</span>
              <span style="flex-shrink:0;color:#6b7280;">☎ {{ r.toPhone || '-' }}</span>
              <button class="btn btn_row_delete" style="flex-shrink:0;" @click="handleSelectAction('recipients-remove', r)">✕</button>
            </div>
            <div v-if="!cfRecvList.length" style="padding:28px 12px;text-align:center;color:#bbb;font-size:12px;">
              선택된 {{ uiState.recvTab === 'member' ? '회원' : '사용자' }}이(가) 없습니다.
            </div>
          </div>
        </bo-container>

        <!-- ===== ■.■.■. 템플릿 목록 (해당 채널 템플릿이 있을 때만) ============ -->
        <bo-container v-if="cfHasTpl" :title="(cfMeta.tplLabel || '') + ' 템플릿 선택'" :count-text="templates.length + '건'">
          <div style="display:flex;gap:6px;align-items:center;padding:2px 0 8px;">
            <input class="form-control" v-model="tplSearch.searchValue" :placeholder="(cfMeta.tplLabel || '') + ' 템플릿명 / 코드 검색'"
              style="flex:1;min-width:0;" @keyup.enter="handleBtnAction('templates-search')" />
            <button class="btn btn_search" style="flex-shrink:0;" @click="handleBtnAction('templates-search')">조회</button>
            <button class="btn btn_reset" style="flex-shrink:0;" @click="handleBtnAction('templates-reset')">초기화</button>
          </div>
          <div style="border:1px solid #eef0f3;border-radius:6px;background:#fff;max-height:230px;overflow-y:auto;">
            <div v-for="t in templates" :key="t.templateId"
              style="padding:5px 8px;border-bottom:1px solid #f5f5f5;cursor:pointer;"
              :style="uiState.tplId === t.templateId ? 'background:#eff6ff;outline:2px solid #2563eb;outline-offset:-2px;position:relative;z-index:1;' : ''"
              @click="handleSelectAction('template-select', t)">
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="badge badge-gray" style="font-size:10px;flex-shrink:0;">{{ t.templateTypeCd }}</span>
                <span style="flex:1;min-width:0;font-size:11.5px;font-weight:600;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ t.templateNm }}</span>
              </div>
              <div style="font-size:10px;color:#9ca3af;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                {{ t.templateCode }}<span v-if="t.templateSubject"> · {{ t.templateSubject }}</span>
              </div>
            </div>
            <div v-if="!templates.length" style="padding:24px 12px;text-align:center;color:#bbb;font-size:12px;">
              {{ uiState.tplLoading ? '조회 중...' : '해당 채널의 템플릿이 없습니다.' }}
            </div>
          </div>
          <div style="margin-top:6px;font-size:11px;color:#888;">
            템플릿을 클릭하면 아래 제목·내용에 자동으로 채워집니다.
          </div>
        </bo-container>
      </div>

      <!-- ===== ■.■. 우: 내용 작성 + 미리보기 =============================== -->
      <div>
        <bo-container title="발송 내용">
          <div style="padding:2px 0 4px;">
            <!-- 시나리오 프리셋 -->
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
              <button v-for="s in SCENARIOS" :key="s.key" class="btn btn-xs"
                :class="baseForm.scenario === s.key ? 'btn-primary' : 'btn-secondary'"
                @click="handleSelectAction('scenario-select', s.key)">{{ s.label }}</button>
            </div>
            <bo-form-area :columns="sendFormColumns" :form="baseForm" :errors="{}"
              :cols="1" :show-actions="false" />
            <div class="form-actions">
              <button class="btn btn_send" :disabled="uiState.sending" @click="handleBtnAction('baseForm-send')">
                {{ uiState.sending ? '발송 중...' : cfMeta.icon + ' ' + recipients.length + '명에게 발송' }}
              </button>
            </div>
          </div>
        </bo-container>

        <!-- ===== ■.■.■. 미리보기 ========================================== -->
        <bo-container title="수신 화면 미리보기">
          <div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <div style="background:#fafbfc;padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;font-weight:700;color:#374151;">
              {{ cfMeta.icon }} {{ cfPreviewTitle || '(제목 없음)' }}
            </div>
            <div style="padding:12px;font-size:12.5px;color:#374151;white-space:pre-wrap;line-height:1.6;min-height:56px;">{{ cfPreviewBody || '(내용 없음)' }}</div>
          </div>
          <div style="margin-top:8px;font-size:11.5px;color:#888;line-height:1.6;">
            · 발송하면 <b>sy_noti 테이블에 수신자별 1행</b> 으로 저장되고, 수신자 본인 화면 상단 🔔 알림에 뜹니다
              (관리자=사용자 / 쇼핑몰=회원).<br/>
            · DB 저장이라 다른 기기·브라우저로 접속해도 그대로 남아 있습니다.
          </div>
        </bo-container>
      </div>

      <!-- ===== ■.■. 우: 치환 파라미터 (세로 나열) ========================== -->
      <div>
        <bo-container title="치환 파라미터">
          <div style="padding:2px 0 4px;">
            <bo-form-area :columns="paramFormColumns" :form="baseForm" :errors="{}"
              :cols="1" :show-actions="false" />
            <div style="font-size:11px;color:#9ca3af;line-height:1.6;margin-top:6px;">
              제목·내용에 쓴 <b>{orderNo}</b> <b>{amount}</b> <b>{invoiceNo}</b> <b>{authCode}</b> 가
              위 값으로 치환되어 발송됩니다.
            </div>
          </div>
        </bo-container>
      </div>
    </div>
  </template>

  <!-- ===== ■. 전송 이력 =================================================== -->
  <bo-container title="시뮬레이션 이력" :count-text="sendLogs.length + '건'">
    <template #toolbar-actions>
      <button class="btn btn-secondary btn-sm" @click="handleBtnAction('sendLogs-clear')">이력 비우기</button>
    </template>
    <bo-grid bare :columns="logGridColumns" :rows="sendLogs" row-key="logId"
      empty-text="아직 발송 이력이 없습니다." />
  </bo-container>

  <!-- ===== ■. 공통 선택 팝업 (cm_popup) =================================== -->
  <bo-cm-popup-modal v-if="uiState.pickModal === 'member'" popup-code="member" modal-name="memberPick"
    title="수신 회원 선택" :multi="true" :init-selected-ids="cfPickedIds"
    :on-callback="fnCallbackModal" @close="handleBtnAction('pick-close')" />
  <bo-cm-popup-modal v-if="uiState.pickModal === 'user'" popup-code="user" modal-name="userPick"
    title="수신 사용자 선택" :multi="true" :init-selected-ids="cfPickedIds"
    :on-callback="fnCallbackModal" @close="handleBtnAction('pick-close')" />
</bo-page>
`,
  };
