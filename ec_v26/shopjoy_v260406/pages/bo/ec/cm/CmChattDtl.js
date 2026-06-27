/* ShopJoy Admin - 채팅관리 상세/등록 */
window._cmChattDtlState = window._cmChattDtlState || { tab: 'chat', tabMode: 'tab' };
window.CmChattDtl = {
  name: 'CmChattDtl',
  props: {
    navigate:      { type: Function, required: true }, // 페이지 이동
    dtlId:         { type: String, default: null },    // 수정 대상 ID
    dtlMode:       { type: String, default: 'view' },  // 상세 모드 (new/view/edit)
    active:        { type: Boolean, default: true },   // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 },       // 상위 reload signal
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const showRefModal = window.boApp.showRefModal; // 참조 모달
    const uiState = reactive({                     // UI 상태 (탭/뷰모드 영속화)
      loading: false, error: null, isPageCodeLoad: false,
      tab: window._cmChattDtlState.tab || 'chat',
      tabMode2: window._cmChattDtlState.tabMode || 'tab',
      replyText: '', searchUserId: '', chat: null,
    });
    const codes = reactive({ chatt_statuses: [] }); // 공통코드

    const form = reactive({                        // 신규 채팅 폼
      chattRoomId: null, memberId: '', memberNm: '', subject: '', chattStatusCd: '',
    });
    const errors = reactive({});                   // 폼 검증 에러

    const schema = yup.object({                    // 폼 검증 스키마
      memberId: yup.string().required('회원ID를 입력해주세요.'),
      subject: yup.string().required('제목을 입력해주세요.'),
    });

    const msgBoxRef = ref(null);                   // 메시지 스크롤 컨테이너 ref
    const refModal = reactive({ show: false, type: '', id: null, data: null }); // 채팅 내 참조 모달
    const cfUserChats = reactive([]);              // 고객 채팅 검색 결과
    const messages = reactive([]);                 // 실시간 메시지 목록
    let pollTimer = null;                          // 폴링 타이머
    let pollLastMsgId = null;                      // 마지막 수신 메시지 ID

    const cfIsNew = computed(() => !props.dtlId);
    const cfDtlMode = computed(() => props.dtlMode === 'view'); // dtlMode: 'view' 이면 읽기전용

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ CmChattDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장 (신규 등록)
      if (cmd === 'form-save') {
        return handleSave();
      // 신규 등록 취소 → 상세영역 유지 + 빈 신규 폼으로 초기화
      } else if (cmd === 'form-cancel') {
        return props.navigate('__cancelEdit__');
      // 폼 닫기 → 상세영역 유지 + 빈 신규 폼으로 초기화
      } else if (cmd === 'form-close') {
        return props.navigate('__cancelEdit__');
      // 보기모드 → 수정모드 전환
      } else if (cmd === 'form-edit') {
        return props.navigate('__switchToEdit__');
      // 채팅 답변 전송
      } else if (cmd === 'chat-sendReply') {
        return sendReply();
      // 채팅 종료
      } else if (cmd === 'chat-close') {
        return closeChat();
      // 목록으로 이동 → 상세영역 유지 + 빈 신규 폼으로 초기화
      } else if (cmd === 'chat-back') {
        return props.navigate('__cancelEdit__');
      // 참조 모달 닫기 (상품/주문/클레임)
      } else if (cmd === 'refModal-close') {
        return closeRefModal();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/탭/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ CmChattDtl.js : handleSelectAction -> ', cmd, param);
      // 탭 전환
      if (cmd === 'tab-select') {
        uiState.tab = param;
        return;
      // 뷰모드 변경
      } else if (cmd === 'tab-mode') {
        uiState.tabMode2 = param;
        return;
      // 채팅 내 메시지 참조 클릭 (상품/주문/클레임)
      } else if (cmd === 'chat-msgRef') {
        return openMsgRef(param);
      // 회원 참조 모달 (외부 showRefModal)
      } else if (cmd === 'chat-ref') {
        return showRefModal(param.type, param.id);
      // 회원의 다른 채팅 상세 이동
      } else if (cmd === 'memberChats-rowView') {
        return props.navigate('cmChattDtl', { id: param });
      // 고객 채팅 검색 결과 행 보기
      } else if (cmd === 'userChats-rowView') {
        return props.navigate('cmChattDtl', { id: param });
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ CmChattDtl : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'ref') {
        if (result == null) { return closeRefModal(); }
        return;
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleSearchDetail — 상세 조회 + 메시지 전체 로드 */
    const handleSearchDetail = async () => {
      if (!props.dtlId) { return; }
      uiState.loading = true;
      fnStopPoll();
      try {
        const res = await boApiSvc.cmChatt.getById(props.dtlId, '채팅관리', '상세조회');
        uiState.chat = res.data?.data || null;
        if (uiState.chat) { uiState.chat.memberUnreadCnt = 0; }
        // 메시지 로드
        messages.splice(0, messages.length);
        pollLastMsgId = null;
        try {
          const msgRes = await boApiSvc.cmChatt.getMessages(props.dtlId, {}, '채팅관리', '메시지조회');
          const msgList = msgRes.data?.data || [];
          messages.push(...msgList);
          if (msgList.length > 0) { pollLastMsgId = msgList[msgList.length - 1].chattMsgId; }
        } catch (_) {}
        scrollToBottom();
        // 진행 중인 채팅만 폴링 시작
        if (uiState.chat && (uiState.chat.chattStatusCd === 'OPEN' || uiState.chat.chattStatusCd === 'PENDING' || uiState.chat.chattStatusCd === '진행중')) {
          fnStartPoll();
        }
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* fnStartPoll — 폴링 시작 (3초, 새 메시지만) */
    const fnStartPoll = () => {
      if (pollTimer) { return; }
      pollTimer = setInterval(async () => {
        if (!props.dtlId) { return; }
        try {
          const params = pollLastMsgId ? { afterMsgId: pollLastMsgId } : {};
          const res = await boApiSvc.cmChatt.getMessages(props.dtlId, params, '채팅관리', '폴링');
          const newMsgs = res.data?.data || [];
          if (newMsgs.length > 0) {
            messages.push(...newMsgs);
            pollLastMsgId = newMsgs[newMsgs.length - 1].chattMsgId;
            scrollToBottom();
            // 미읽음 카운트 갱신 (회원이 보낸 것만)
            const memberMsgs = newMsgs.filter(m => m.senderCd === 'MEMBER');
            if (memberMsgs.length > 0 && uiState.chat) { uiState.chat.memberUnreadCnt = (uiState.chat.memberUnreadCnt || 0) + memberMsgs.length; }
          }
        } catch (err) {
          console.warn('[poll]', err.message);
        }
      }, 3000);
    };

    /* fnStopPoll — 폴링 중지 */
    const fnStopPoll = () => {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    };

    /* showTab — 탭 표시 여부 */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;

    /* openMsgRef — 메시지 참조 모달 열기 */
    const openMsgRef = (msg) => {
      if (msg.productId) {
        refModal.type = 'product'; refModal.id = msg.productId; refModal.show = true;
      } else if (msg.orderId) {
        refModal.type = 'order'; refModal.id = msg.orderId; refModal.show = true;
      } else if (msg.claimId) {
        refModal.type = 'claim'; refModal.id = msg.claimId; refModal.show = true;
      }
    };

    /* closeRefModal — 참조 모달 닫기 */
    const closeRefModal = () => { refModal.show = false; };

    /* hasRef — 메시지에 참조가 있는지 */
    const hasRef = (msg) => !!(msg.productId || msg.orderId || msg.claimId);

    /* refLabel — 참조 라벨 */
    const refLabel = (msg) => {
      if (msg.productId) { return '[상품#' + msg.productId + ' 보기]'; }
      if (msg.orderId) { return '[' + msg.orderId + ' 보기]'; }
      if (msg.claimId) { return '[' + msg.claimId + ' 보기]'; }
      return '';
    };

    /* scrollToBottom — 스크롤 하단으로 */
    const scrollToBottom = () => {
      nextTick(() => { const el = msgBoxRef.value; if (el) el.scrollTop = el.scrollHeight; });
    };

    /* sendReply — 답변 전송 (실제 API 호출) */
    const sendReply = async () => {
      const text = uiState.replyText.trim();
      if (!text || !props.dtlId) { return; }
      // 낙관적 UI — 즉시 노출
      const tempMsg = { chattMsgId: '_tmp_' + Date.now(), senderCd: 'ADMIN', msgText: text, sendDate: new Date().toISOString(), _pending: true };
      messages.push(tempMsg);
      uiState.replyText = '';
      scrollToBottom();
      try {
        const res = await boApiSvc.cmChatt.sendMsg(props.dtlId, { msgText: text, senderCd: 'ADMIN' }, '채팅관리', '답변전송');
        const saved = res.data?.data;
        if (saved) {
          tempMsg.chattMsgId = saved.chattMsgId;
          tempMsg.sendDate = saved.sendDate;
          pollLastMsgId = saved.chattMsgId;
        }
        tempMsg._pending = false;
        if (uiState.chat) { uiState.chat.adminUnreadCnt = 0; }
      } catch (err) {
        console.error('[sendReply]', err);
        tempMsg._error = true;
        tempMsg._pending = false;
        showToast(err.response?.data?.message || '전송 실패', 'error');
      }
    };

    /* closeChat — 채팅 종료 (API 상태 변경) */
    const closeChat = async () => {
      if (!props.dtlId || !uiState.chat) { return; }
      const ok = await showConfirm('채팅 종료', '채팅을 종료하시겠습니까?');
      if (!ok) { return; }
      try {
        await boApiSvc.cmChatt.updateStatus(props.dtlId, { chattStatusCd: 'CLOSED' }, '채팅관리', '채팅종료');
        uiState.chat.chattStatusCd = 'CLOSED';
        fnStopPoll();
        messages.push({ chattMsgId: '_sys_close', senderCd: 'SYSTEM', msgText: '채팅이 종료되었습니다.', sendDate: new Date().toISOString() });
        scrollToBottom();
        showToast('채팅이 종료되었습니다.');
      } catch (err) {
        console.error('[closeChat]', err);
        showToast(err.response?.data?.message || '종료 처리 실패', 'error');
      }
    };

    /* handleSearchUserChats — 고객 채팅 조회 (회원ID로 검색) */
    const handleSearchUserChats = async () => {
      if (!uiState.searchUserId.trim()) { return; }
      try {
        const res = await boApiSvc.cmChatt.getPage({ memberId: uiState.searchUserId.trim(), pageSize: 20 }, '채팅관리', '고객채팅조회');
        const rows = res.data?.data?.pageList || [];
        cfUserChats.splice(0, cfUserChats.length, ...rows);
      } catch (err) {
        console.error('[handleSearchUserChats]', err);
        cfUserChats.splice(0, cfUserChats.length);
      }
    };

    /* handleSave — 신규 채팅 등록 저장 */
    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        console.error('[catch-info]', err);
        err.inner.forEach(e => { errors[e.path] = e.message; });
        showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const ok = await showConfirm('등록', '등록하시겠습니까?');
      if (!ok) { return; }
      try {
        const payload = {
          memberId: form.memberId, memberNm: form.memberNm,
          subject: form.subject, chattStatusCd: form.chattStatusCd,
        };
        const res = await boApiSvc.cmChatt.create(payload, '채팅관리', '등록');
        if (showToast) { showToast('등록되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('cmChattMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.chatt_statuses = codeStore.sgGetGrpCodes('CHATT_STATUS');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 진입 시 코드 로드 + 상세 초기 조회
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      if (!cfIsNew.value) {
        handleSearchDetail();
        uiState.tab = 'chat';
      } else {
        uiState.tab = 'new';
      }
    });

    onUnmounted(() => { fnStopPoll(); });

    /* policy: 상위 Mng 이 reloadTrigger 증가시키면 상세 API 재조회 */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleSearchDetail();
    });

    /* watch — 탭/뷰모드 변경 시 window 영속화 */
    watch(() => uiState.tab, v => { window._cmChattDtlState.tab = v; });
    watch(() => uiState.tabMode2, v => { window._cmChattDtlState.tabMode = v; });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    /* cfMemberChats — 회원의 다른 채팅 이력 */
    const cfMemberChats = computed(() => {
      if (!uiState.chat) { return []; }
      return [];
    });

    /* tabs — 탭 정의 (BoTabBar 데이터, reactive) */
    const tabs = reactive([
      { id: 'chat',    label: '채팅 내용',     icon: '💬' },
      { id: 'history', label: '회원 채팅 이력', icon: '🕒', get count() { return cfMemberChats.value.length; } },
    ]);

    /* newTabs — 신규 채팅 등록 탭 정의 */
    const newTabs = reactive([
      { id: 'new',    label: '신규 등록' },
      { id: 'search', label: '고객 채팅 조회' },
    ]);

    // 회원 채팅 그리드
    const columns = {};
    columns.memberChatGrid = [
      { key: 'subject', label: '제목' },
      { key: '_status', label: '상태',
        badge: (row) => row.chattStatusCd === '진행중' ? 'badge-green' : 'badge-gray',
        fmt: (v, row) => row.chattStatusCd },
      { key: 'lastMsgDate', label: '최근 메시지', style: 'max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;', fmt: (v) => v || '-' },
      { key: 'regDate', label: '일시', fmt: (v) => v ? String(v).slice(0, 16) : '-' },
    ];

    // 사용자 채팅 그리드
    columns.userChatGrid = [
      { key: 'subject', label: '제목' },
      { key: '_status', label: '상태',
        badge: (row) => row.chattStatusCd === '진행중' ? 'badge-green' : 'badge-gray',
        fmt: (v, row) => row.chattStatusCd },
      { key: 'lastMsgDate', label: '최근 메시지', style: 'max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;', fmt: (v) => v || '-' },
      { key: 'regDate', label: '일시', fmt: (v) => v ? String(v).slice(0, 16) : '-' },
    ];

    // 신규 폼
    columns.newForm = [
      { key: 'memberId',      label: '회원ID', type: 'slot', name: 'memberId', required: true },
      { key: 'memberNm',      label: '회원명', type: 'text', placeholder: '회원명' },
      { key: 'subject',       label: '제목', type: 'text', required: true,
        placeholder: '채팅 제목', colSpan: 2 },
      { key: 'chattStatusCd', label: '상태', type: 'select', options: () => codes.chatt_statuses,
        width: '200px' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    /* fnMsgSenderLabel — 발신자 라벨 */
    const fnMsgSenderLabel = (msg) => {
      if (msg.senderCd === 'ADMIN') { return '상담사'; }
      if (msg.senderCd === 'MEMBER') { return '고객'; }
      return '시스템';
    };

    /* cfChatStatus — 채팅 진행 중 여부 */
    const cfChatActive = computed(() => {
      const s = uiState.chat?.chattStatusCd;
      return s === 'OPEN' || s === 'PENDING' || s === '진행중';
    });

    return {
      columns,
      uiState, form, errors, refModal, msgBoxRef, cfUserChats, messages, // 상태 / 데이터
      handleBtnAction, handleSelectAction, fnCallbackModal, // dispatch + 모달 통합 콜백
      cfIsNew, cfDtlMode, cfMemberChats, cfChatActive, tabs, newTabs,   // computed / reactive(tabs)
      get active() { return props.active; },                             // props.active 템플릿 노출
      showTab, hasRef, refLabel, fnMsgSenderLabel, handleSearchUserChats, // 헬퍼
      cofAnd: coUtil.cofAnd,                                             // 템플릿 && 대체 (속성값 && 금지)
      showRefModal,                                                      // 참조 모달 (직접 호출)
    };
  },
  template: /* html */`
<bo-container bare>
  <!-- ===== ■. 상세 카드 (제목 = list-title, 항상 표시) ============================= -->
  <bo-container :title="!active ? '채팅 상세' : (cfIsNew ? '채팅 등록' : '채팅 상세')"
    :title-id="!active ? '' : (cfIsNew ? '' : (uiState.chat?.chattRoomId || ''))">
    <!-- ===== □. 페이지 타이틀 ================================================= -->
    <!-- ===== ■. 채팅 상세 =================================================== -->
    <div v-if="!cfIsNew">
      <bo-tab-bar :tabs="tabs" :tab="uiState.tab" :tab-mode="uiState.tabMode2"
        @tab-select="id => handleSelectAction('tab-select', id)"
        @mode-select="m => handleSelectAction('tab-mode', m)" />
      <div :class="uiState.tabMode2!=='tab' ? 'dtl-tab-grid cols-'+uiState.tabMode2.charAt(0) : ''">
        <!-- ===== ■.■.■. 채팅 내용 탭 ============================================= -->
        <div class="card" v-show="showTab('chat')" style="margin:0;">
          <div v-if="uiState.tabMode2!=='tab'" class="dtl-tab-card-title">💬 채팅 내용</div>
          <template v-if="uiState.chat">
            <!-- ===== ■.■.■.■.■. 채팅방 헤더 =========================================== -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding:10px 12px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
              <div>
                <div style="font-size:14px;font-weight:700;color:#111;">{{ uiState.chat.subject }}</div>
                <div style="font-size:12px;color:#888;margin-top:3px;">
                  <span class="ref-link" @click="handleSelectAction('chat-ref', { type:'member', id: uiState.chat.memberId })">
                    {{ uiState.chat.memberNm }}
                  </span>
                  &nbsp;·&nbsp;{{ String(uiState.chat.regDate||'').slice(0,16) }}
                  &nbsp;·&nbsp;
                  <span class="badge" :class="cfChatActive ? 'badge-green' : 'badge-gray'">
                    {{ uiState.chat.chattStatusCd }}
                  </span>
                  <span v-if="uiState.chat.memberUnreadCnt > 0" class="badge badge-red" style="margin-left:6px;">
                    미읽음 {{ uiState.chat.memberUnreadCnt }}
                  </span>
                </div>
              </div>
              <div style="display:flex;gap:6px;align-items:center;">
                <span v-if="cfChatActive" style="font-size:11px;color:#15803d;">● 실시간</span>
                <button v-if="cfChatActive" class="btn btn_cancel" @click="handleBtnAction('chat-close')">
                  채팅 종료
                </button>
                <button class="btn btn_list" @click="handleBtnAction('chat-back')">목록으로</button>
              </div>
            </div>
            <!-- ===== ■.■.■.■.■. 메시지 목록 ========================================== -->
            <div class="chat-messages" ref="msgBoxRef"
              style="height:320px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:8px;padding:12px;background:#fafafa;display:flex;flex-direction:column;gap:8px;">
              <!-- SYSTEM 메시지 -->
              <template v-for="msg in messages" :key="msg.chattMsgId">
                <div v-if="msg.senderCd==='SYSTEM'"
                  style="text-align:center;font-size:11px;color:#888;background:#f0f0f0;border-radius:6px;padding:4px 10px;margin:0 40px;">
                  {{ msg.msgText }}
                </div>
                <!-- MEMBER 메시지 (좌측) -->
                <div v-else-if="msg.senderCd==='MEMBER'" style="display:flex;align-items:flex-end;gap:6px;">
                  <div style="width:26px;height:26px;border-radius:50%;background:#e0e7ff;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;">
                    👤
                  </div>
                  <div>
                    <div style="font-size:10px;color:#888;margin-bottom:2px;">{{ uiState.chat.memberNm }}</div>
                    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:0 10px 10px 10px;padding:7px 10px;font-size:13px;line-height:1.5;max-width:280px;word-break:break-word;">
                      {{ msg.msgText }}
                      <span v-if="hasRef(msg)" class="ref-link" style="display:block;margin-top:4px;font-size:11px;" @click="handleSelectAction('chat-msgRef', msg)">
                        {{ refLabel(msg) }}
                      </span>
                    </div>
                    <div style="font-size:10px;color:#bbb;margin-top:2px;">{{ String(msg.sendDate||'').slice(11,16) }}</div>
                  </div>
                </div>
                <!-- ADMIN 메시지 (우측) -->
                <div v-else style="display:flex;flex-direction:row-reverse;align-items:flex-end;gap:6px;">
                  <div style="width:26px;height:26px;border-radius:50%;background:#fce7f3;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;">
                    💁
                  </div>
                  <div>
                    <div style="font-size:10px;color:#888;margin-bottom:2px;text-align:right;">상담사</div>
                    <div style="background:#e8587a;color:#fff;border-radius:10px 0 10px 10px;padding:7px 10px;font-size:13px;line-height:1.5;max-width:280px;word-break:break-word;"
                      :style="msg._error ? 'opacity:0.6;' : ''">
                      {{ msg.msgText }}
                    </div>
                    <div style="font-size:10px;color:#bbb;margin-top:2px;text-align:right;">
                      <span v-if="msg._pending" style="color:#aaa;">전송 중...</span>
                      <span v-else-if="msg._error" style="color:#f87171;">전송 실패</span>
                      <span v-else>{{ String(msg.sendDate||'').slice(11,16) }}</span>
                    </div>
                  </div>
                </div>
              </template>
              <div v-if="messages.length===0" style="text-align:center;color:#aaa;padding:40px 0;font-size:13px;">
                메시지가 없습니다.
              </div>
            </div>
            <!-- ===== ■.■.■.■.■. 답변 입력 =========================================== -->
            <div v-if="cfChatActive" style="display:flex;gap:8px;margin-top:10px;align-items:flex-end;">
              <textarea class="form-control" v-model="uiState.replyText" rows="3" placeholder="답변 입력 후 Enter 또는 [전송] 클릭" style="resize:none;flex:1;"
                @keydown.enter.exact.prevent="handleBtnAction('chat-sendReply')"></textarea>
              <button class="btn btn_send" @click="handleBtnAction('chat-sendReply')" style="white-space:nowrap;height:72px;">전송</button>
            </div>
            <div v-else style="margin-top:10px;text-align:center;color:#aaa;font-size:13px;padding:10px;background:#fafafa;border-radius:6px;">
              종료된 채팅입니다.
            </div>
          </template>
          <div v-else-if="uiState.loading" style="text-align:center;color:#aaa;padding:40px;">⏳ 로딩 중...</div>
          <div v-else style="text-align:center;color:#aaa;padding:40px;">채팅을 찾을 수 없습니다.</div>
        </div>
        <!-- ===== ■.■.■. 회원 채팅 이력 탭 ========================================== -->
        <div class="card" v-show="showTab('history')" style="margin:0;">
          <div v-if="uiState.tabMode2!=='tab'" class="dtl-tab-card-title">
            🕒 회원 채팅 이력
            <span class="tab-count">{{ cfMemberChats.length }}</span>
          </div>
          <div v-if="uiState.chat" style="margin-bottom:14px;padding:12px;background:#f9f9f9;border-radius:8px;display:flex;align-items:center;gap:12px;">
            <span style="font-size:13px;color:#555;">
              <span class="ref-link" @click="handleSelectAction('chat-ref', { type:'member', id: uiState.chat.memberId })">
                {{ uiState.chat.memberNm }}
              </span>
              의 다른 채팅
            </span>
          </div>
          <!-- ===== ■.■.■.■. 목록 영역 ============================================= -->
          <bo-grid bare :columns="columns.memberChatGrid" :rows="cfMemberChats" row-key="chattRoomId" empty-text="다른 채팅 이력이 없습니다." row-actions>
            <template #row-actions="{ row }">
              <button class="btn btn_detail" @click="handleSelectAction('memberChats-rowView', row.chattRoomId)">상세</button>
            </template>
          </bo-grid>
        </div>
      </div>
    </div>
    <!-- ===== □. 상세 카드 (수정 시 탭) ======================================= -->
    <!-- ===== ■. 신규 채팅 등록 (제목 컨테이너와 한 카드) ============================= -->
    <template v-if="cofAnd(cfIsNew, active)">
      <bo-tab-bar :tabs="newTabs" :tab="uiState.tab" :show-modes="false"
        @tab-select="id => handleSelectAction('tab-select', id)" />
      <!-- ===== ■.■.■. 신규 등록 탭 (BoFormArea 자동 렌더) ========================== -->
      <div v-show="uiState.tab==='new'">
        <!-- ===== ■.■.■.■. 폼 영역 ============================================== -->
        <bo-form-area :columns="columns.newForm" :form="form" :errors="errors"
          :readonly="false" :cols="3" compact :show-actions="false">
          <!-- ===== ■.■.■.■.■. 회원ID + 보기 ======================================= -->
          <template #memberId>
            <div style="display:flex;gap:8px;align-items:center;">
              <input class="form-control" v-model="form.memberId" placeholder="회원 ID" :class="errors.memberId ? 'is-invalid' : ''" />
              <span v-if="form.memberId" class="ref-link" @click="handleSelectAction('chat-ref', { type:'member', id: form.memberId })">
                보기
              </span>
            </div>
          </template>
        </bo-form-area>
        <div class="form-actions" v-if="!cfDtlMode">
          <button class="btn btn_save" @click="handleBtnAction('form-save')">등록</button>
          <button class="btn btn_cancel" @click="handleBtnAction('form-cancel')">취소</button>
        </div>
      </div>
      <!-- ===== ■.■.■. 고객 채팅 조회 탭 ========================================== -->
      <div v-show="uiState.tab==='search'">
        <div style="display:flex;gap:8px;margin-bottom:14px;">
          <input class="form-control" style="max-width:240px;" v-model="uiState.searchUserId" placeholder="회원 ID 입력" @keyup.enter="handleSearchUserChats" />
          <button class="btn btn_search" @click="handleSearchUserChats">조회</button>
        </div>
        <!-- ===== ■.■.■.■. 목록 영역 ============================================= -->
        <bo-grid bare :columns="columns.userChatGrid" :rows="cfUserChats" row-key="chattRoomId" :empty-text="uiState.searchUserId ? '해당 회원을 찾을 수 없습니다.' : '회원 ID를 입력하세요.'" row-actions>
          <template #row-actions="{ row }">
            <button class="btn btn-blue btn-xs" @click="handleSelectAction('userChats-rowView', row.chattRoomId)">보기</button>
          </template>
        </bo-grid>
      </div>
    </template>
  </bo-container>
  <!-- ===== □. 신규 채팅 등록 (제목 컨테이너 닫기) ============================= -->
  <!-- ===== ■. 메시지 내 참조 모달 (상품/주문/클레임) ================================= -->
  <bo-modal :show="refModal.show"
    :title="refModal.type==='product'?'상품 상세':refModal.type==='order'?'주문 상세':'클레임 상세'" modal-name="ref" :on-callback="fnCallbackModal" @close="refModal.show = false">
    <div style="text-align:center;color:#aaa;padding:20px;">정보를 찾을 수 없습니다.</div>
    <template #footer>
      <button class="btn btn_close" @click="handleBtnAction('refModal-close')">닫기</button>
    </template>
  </bo-modal>
  <!-- ===== □. 메시지 내 참조 모달 (상품/주문/클레임) ================================= -->
</bo-container>
`,
};
