/* ShopJoy Admin - 채팅관리 상세/등록 */
window._cmChattDtlState = window._cmChattDtlState || { tab: 'chat', tabMode: 'tab' };
window.CmChattDtl = {
  name: 'CmChattDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    tabMode:      { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, onMounted, watch, nextTick } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, tab: window._cmChattDtlState.tab || 'chat', tabMode2: window._cmChattDtlState.tabMode || 'tab', replyText: '', searchUserId: '', chat: null });
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({ chatt_statuses: [] });

    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.chatt_statuses = codeStore.sgGetGrpCodes('CHATT_STATUS');
      uiState.isPageCodeLoad = true;
    };

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* handleSearchDetail — 처리 */
    const handleSearchDetail = async () => {
      if (!props.dtlId) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.cmChatt.getById(props.dtlId, '채팅관리', '상세조회');
        uiState.chat = res.data?.data || null;
        if (uiState.chat) uiState.chat.memberUnreadCnt = 0;
        scrollToBottom();
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    const cfIsNew = computed(() => !props.dtlId);

    watch(() => uiState.tab, v => { window._cmChattDtlState.tab = v; });

    watch(() => uiState.tabMode2, v => { window._cmChattDtlState.tabMode = v; });

    /* showTab — 표시 */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;

    const msgBoxRef = ref(null);

    /* 채팅 내 참조 모달 (상품/주문/클레임) */
    const refModal = reactive({ show: false, type: '', id: null, data: null });

    /* openMsgRef — 열기 */
    const openMsgRef = (msg) => {
      if (msg.productId) {
        refModal.type = 'product'; refModal.id = msg.productId; refModal.show = true;
      } else if (msg.orderId) {
        refModal.type = 'order'; refModal.id = msg.orderId; refModal.show = true;
      } else if (msg.claimId) {
        refModal.type = 'claim'; refModal.id = msg.claimId; refModal.show = true;
      }
    };

    /* closeRefModal — 닫기 */
    const closeRefModal = () => { refModal.show = false; };

    /* hasRef — 여부 확인 */
    const hasRef = (msg) => !!(msg.productId || msg.orderId || msg.claimId);

    /* refLabel — ref 라벨 */
    const refLabel = (msg) => {
      if (msg.productId) return '[상품#' + msg.productId + ' 보기]';
      if (msg.orderId) return '[' + msg.orderId + ' 보기]';
      if (msg.claimId) return '[' + msg.claimId + ' 보기]';
      return '';
    };

    /* scrollToBottom — 스크롤 → 하단 */
    const scrollToBottom = () => {
      nextTick(() => { const el = msgBoxRef.value; if (el) el.scrollTop = el.scrollHeight; });
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      if (!cfIsNew.value) {
        handleSearchDetail();
        uiState.tab = 'chat';
      } else {
        uiState.tab = 'new';
      }
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) return;
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleSearchDetail();
    });

    /* 회원의 다른 채팅 이력 */
    const cfMemberChats = computed(() => {
      if (!uiState.chat) return [];
      return [];
    });

    /* 신규 채팅 form */
    const form = reactive({ chattRoomId: null, memberId: '', memberNm: '', subject: '', chattStatusCd: '' });
    const errors = reactive({});

    const schema = yup.object({
      memberId: yup.string().required('회원ID를 입력해주세요.'),
      subject: yup.string().required('제목을 입력해주세요.'),
    });

    /* sendReply — 전송 Reply */
    const sendReply = () => {
      if (!uiState.replyText.trim()) return;
      if (!uiState.chat) return;
      if (!uiState.chat.messages) uiState.chat.messages = [];
      uiState.chat.messages.push({ from: 'cs', text: uiState.replyText.trim(), time: new Date().toTimeString().slice(0, 5) });
      uiState.chat.lastMsg = uiState.replyText.trim();
      uiState.replyText = '';
      scrollToBottom();
      showToast('답변을 전송했습니다.');
    };

    /* closeChat — 닫기 */
    const closeChat = () => {
      if (!uiState.chat) return;
      uiState.chat.chattStatusCd = '종료';
      showToast('채팅이 종료되었습니다.');
    };

    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* handleSave — 저장 */
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
      if (!ok) return;
      try {
        /* CmChattRoom 엔티티 필드명에 맞춰 전송 */
        const payload = {
          memberId: form.memberId,
          memberNm: form.memberNm,
          subject: form.subject,
          chattStatusCd: form.chattStatusCd,
        };
        const res = await boApiSvc.cmChatt.create(payload, '채팅관리', '등록');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('등록되었습니다.', 'success');
        if (props.navigate) props.navigate('cmChattMng', { reload: true });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* onUserChange — 이벤트 */
    const onUserChange = () => {};

    const cfUserChats = reactive([]);

    const replyText = Vue.toRef(uiState, 'replyText');
    const searchUserId = Vue.toRef(uiState, 'searchUserId');
    const chat = Vue.toRef(uiState, 'chat');

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    /* BoGrid 컬럼 정의 */
    const memberChatGridColumns = [
      { key: 'subject', label: '제목' },
      { key: '_status', label: '상태',
        badge: (row) => row.chattStatusCd === '진행중' ? 'badge-green' : 'badge-gray',
        fmt: (v, row) => row.chattStatusCd },
      { key: 'lastMsgDate', label: '최근 메시지', style: 'max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;', fmt: (v) => v || '-' },
      { key: 'regDate', label: '일시' },
    ];
    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================

    // --- [컬럼 정의] ---
    const userChatGridColumns = [
      { key: 'subject', label: '제목' },
      { key: '_status', label: '상태',
        badge: (row) => row.chattStatusCd === '진행중' ? 'badge-green' : 'badge-gray',
        fmt: (v, row) => row.chattStatusCd },
      { key: 'lastMsgDate', label: '최근 메시지', style: 'max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;', fmt: (v) => v || '-' },
      { key: 'regDate', label: '일시' },
    ];

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - 신규 등록 탭 ==================
    const newFormColumns = [
      { key: 'memberId',     label: '회원ID', type: 'slot', name: 'memberId', required: true },
      { key: 'memberNm',     label: '회원명', type: 'text', placeholder: '회원명' },
      { type: 'rowBreak' },
      { key: 'subject',      label: '제목', type: 'text', required: true,
        placeholder: '채팅 제목', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'chattStatusCd', label: '상태', type: 'select', options: () => codes.chatt_statuses,
        width: '200px' },
    ];

    // ===== return (템플릿 노출) ===============================================


    return { cfIsNew, tab, cfDtlMode, tabMode2, showTab, chat, replyText, sendReply, closeChat, msgBoxRef,
      hasRef, refLabel, openMsgRef, refModal, closeRefModal,
      form, errors, handleSave, onUserChange,
      searchUserId, cfUserChats,
      cfMemberChats, codes,
      memberChatGridColumns, userChatGridColumns, newFormColumns, showRefModal,
    };
  },
  template: /* html */`
<div>
  <!-- ===== 페이지 타이틀 ==================================================== -->
  <div class="page-title">
    {{ cfIsNew ? '채팅 등록' : '채팅 상세' }}
    <span v-if="!cfIsNew && chat" style="font-size:12px;color:#999;margin-left:8px;">
      #{{ chat.chattRoomId }}
    </span>
  </div>
  <!-- ===== 채팅 상세 ====================================================== -->
  <div v-if="!cfIsNew">
    <div class="tab-bar-row">
      <div class="tab-nav">
        <button class="tab-btn" :class="{active:tab==='chat'}" :disabled="tabMode2!=='tab'" @click="tab='chat'">💬 채팅 내용</button>
        <button class="tab-btn" :class="{active:tab==='history'}" :disabled="tabMode2!=='tab'" @click="tab='history'">
          🕒 회원 채팅 이력
          <span class="tab-count">{{ cfMemberChats.length }}</span>
        </button>
      </div>
      <div class="tab-modes">
        <button class="tab-mode-btn" :class="{active:tabMode2==='tab'}" @click="tabMode2='tab'" title="탭으로 보기">📑</button>
        <button class="tab-mode-btn" :class="{active:tabMode2==='1col'}" @click="tabMode2='1col'" title="1열로 보기">1▭</button>
        <button class="tab-mode-btn" :class="{active:tabMode2==='2col'}" @click="tabMode2='2col'" title="2열로 보기">2▭</button>
        <button class="tab-mode-btn" :class="{active:tabMode2==='3col'}" @click="tabMode2='3col'" title="3열로 보기">3▭</button>
        <button class="tab-mode-btn" :class="{active:tabMode2==='4col'}" @click="tabMode2='4col'" title="4열로 보기">4▭</button>
      </div>
    </div>
    <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">
      <!-- ===== 채팅 내용 탭 ==================================================== -->
      <div class="card" v-show="showTab('chat')" style="margin:0;">
        <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">💬 채팅 내용</div>
        <template v-if="chat">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div>
              <div style="font-size:15px;font-weight:700;">{{ chat.subject }}</div>
              <div style="font-size:12px;color:#888;margin-top:3px;">
                <span class="ref-link" @click="showRefModal('member', chat.memberId)">{{ chat.memberNm }}</span>
                &nbsp;·&nbsp;{{ chat.regDate }} &nbsp;·&nbsp;
                <span class="badge" :class="chat.chattStatusCd==='진행중'?'badge-green':'badge-gray'">{{ chat.chattStatusCd }}</span>
              </div>
            </div>
            <button v-if="chat.chattStatusCd==='진행중'" class="btn btn-secondary btn-sm" @click="closeChat">채팅 종료</button>
          </div>
          <!-- ===== 메시지 목록 ===================================================== -->
          <div class="chat-messages" ref="msgBoxRef">
            <div v-for="(msg, idx) in (chat.messages||[])" :key="idx" class="chat-msg" :class="msg.from">
              <div class="chat-bubble">
                {{ msg.text }}
                <span v-if="hasRef(msg)" class="ref-link" style="display:block;margin-top:4px;" @click="openMsgRef(msg)">
                  {{ refLabel(msg) }}
                </span>
              </div>
              <div class="chat-time">{{ msg.from==='user' ? '고객' : 'CS' }} · {{ msg.time }}</div>
            </div>
            <div v-if="!(chat.messages||[]).length" style="text-align:center;color:#aaa;padding:20px;font-size:13px;">메시지가 없습니다.</div>
          </div>
          <!-- ===== 답변 입력 ====================================================== -->
          <div v-if="chat.chattStatusCd==='진행중'" style="display:flex;gap:8px;margin-top:12px;">
            <textarea class="form-control" v-model="replyText" rows="2" placeholder="답변을 입력하고 Enter..." style="resize:none;"
              @keydown.enter.exact.prevent="() => sendReply?.()"></textarea>
            <button class="btn btn-primary" @click="sendReply" style="white-space:nowrap;">전송</button>
          </div>
          <div v-else style="margin-top:12px;text-align:center;color:#aaa;font-size:13px;padding:10px;background:#fafafa;border-radius:6px;">
            종료된 채팅입니다.
          </div>
          <div class="form-actions" v-if="!cfDtlMode">
            <button class="btn btn-secondary" @click="navigate('cmChattMng')">목록으로</button>
          </div>
        </template>
        <div v-else style="text-align:center;color:#aaa;padding:40px;">채팅을 찾을 수 없습니다.</div>
      </div>
      <!-- ===== 회원 채팅 이력 탭 ================================================= -->
      <div class="card" v-show="showTab('history')" style="margin:0;">
        <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🕒 회원 채팅 이력 <span class="tab-count">{{ cfMemberChats.length }}</span></div>
        <div v-if="chat" style="margin-bottom:14px;padding:12px;background:#f9f9f9;border-radius:8px;display:flex;align-items:center;gap:12px;">
          <span style="font-size:13px;color:#555;">
            <span class="ref-link" @click="showRefModal('member', chat.memberId)">{{ chat.memberNm }}</span>
            의 다른 채팅
          </span>
        </div>
        <!-- ===== 목록 영역 ====================================================== -->
        <bo-grid bare :columns="memberChatGridColumns" :rows="cfMemberChats" row-key="chattRoomId" empty-text="다른 채팅 이력이 없습니다." row-actions>
          <template #row-actions="{ row }">
            <button class="btn btn-blue btn-sm" @click="navigate('cmChattDtl',{id:row.chattRoomId})">상세</button>
          </template>
        </bo-grid>
      </div>
    </div>
  </div>
  <!-- ===== 신규 채팅 등록 =================================================== -->
  <template v-if="cfIsNew">
    <div class="card">
      <div class="tab-nav">
        <button class="tab-btn" :class="{active:tab==='new'}" @click="tab='new'">신규 등록</button>
        <button class="tab-btn" :class="{active:tab==='search'}" @click="tab='search'">고객 채팅 조회</button>
      </div>
      <!-- 신규 등록 탭 (BoFormArea 자동 렌더) -->
      <div v-show="tab==='new'">
        <!-- ===== 폼 영역 ======================================================= -->
        <bo-form-area :columns="newFormColumns" :form="form" :errors="errors"
          :readonly="false" :cols="2" :show-actions="false">
          <!-- 회원ID + 보기 -->
          <template #memberId>
            <div style="display:flex;gap:8px;align-items:center;">
              <input class="form-control" v-model="form.memberId" placeholder="회원 ID" @change="onUserChange" :class="errors.memberId ? 'is-invalid' : ''" />
              <span v-if="form.memberId" class="ref-link" @click="showRefModal('member', form.memberId)">보기</span>
            </div>
          </template>
        </bo-form-area>
        <div class="form-actions" v-if="!cfDtlMode">
          <button class="btn btn-primary" @click="handleSave">등록</button>
          <button class="btn btn-secondary" @click="navigate('cmChattMng')">취소</button>
        </div>
      </div>
      <!-- ===== 고객 채팅 조회 탭 ================================================= -->
      <div v-show="tab==='search'">
        <div style="display:flex;gap:8px;margin-bottom:14px;">
          <input class="form-control" style="max-width:200px;" v-model="searchUserId" placeholder="회원 ID 입력" />
        </div>
        <!-- ===== 목록 영역 ====================================================== -->
        <bo-grid bare :columns="userChatGridColumns" :rows="cfUserChats" row-key="chattRoomId" :empty-text="searchUserId ? '해당 회원을 찾을 수 없습니다.' : '회원 ID를 입력하세요.'" row-actions>
          <template #row-actions="{ row }">
            <button class="btn btn-blue btn-sm" @click="navigate('cmChattDtl',{id:row.chattRoomId})">보기</button>
          </template>
        </bo-grid>
      </div>
    </div>
  </template>
  <!-- ===== 메시지 내 참조 모달 (상품/주문/클레임) ==================================== -->
  <bo-modal :show="refModal.show"
    :title="refModal.type==='product'?'상품 상세':refModal.type==='order'?'주문 상세':'클레임 상세'"
    @close="closeRefModal">
    <div style="text-align:center;color:#aaa;padding:20px;">정보를 찾을 수 없습니다.</div>
    <template #footer>
      <button class="btn btn-secondary" @click="closeRefModal">닫기</button>
    </template>
  </bo-modal>
</div>
`
};
