/* ShopJoy Admin - 채팅관리 상세/등록 */
window._cmChattDtlState = window._cmChattDtlState || { tab: 'chat', viewMode: 'tab' };
window.CmChattDtl = {
  name: 'CmChattDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, ref, onMounted, nextTick } = Vue;
    const isNew = computed(() => !props.editId);
    const tab = ref(window._cmChattDtlState.tab || 'chat');
    Vue.watch(tab, v => { window._cmChattDtlState.tab = v; });
    const viewMode2 = ref(window._cmChattDtlState.viewMode || 'tab');
    Vue.watch(viewMode2, v => { window._cmChattDtlState.viewMode = v; });
    const showTab = (id) => viewMode2.value !== 'tab' || tab.value === id;

    const chat = ref(null);
    const replyText = ref('');
    const msgBoxRef = ref(null);

    /* 채팅 내 참조 모달 (상품/주문/클레임) */
    const refModal = reactive({ show: false, type: '', id: null, data: null });

    const openMsgRef = (msg) => {
      if (msg.productId) {
        refModal.type = 'product'; refModal.id = msg.productId;
        refModal.data = props.adminData.getProduct(msg.productId); refModal.show = true;
      } else if (msg.orderId) {
        refModal.type = 'order'; refModal.id = msg.orderId;
        refModal.data = props.adminData.getOrder(msg.orderId); refModal.show = true;
      } else if (msg.claimId) {
        refModal.type = 'claim'; refModal.id = msg.claimId;
        refModal.data = props.adminData.getClaim(msg.claimId); refModal.show = true;
      }
    };
    const closeRefModal = () => { refModal.show = false; };

    const hasRef = (msg) => !!(msg.productId || msg.orderId || msg.claimId);
    const refLabel = (msg) => {
      if (msg.productId) return '[상품#' + msg.productId + ' 보기]';
      if (msg.orderId) return '[' + msg.orderId + ' 보기]';
      if (msg.claimId) return '[' + msg.claimId + ' 보기]';
      return '';
    };

    const scrollToBottom = () => {
      nextTick(() => { const el = msgBoxRef.value; if (el) el.scrollTop = el.scrollHeight; });
    };

    onMounted(() => {
      if (!isNew.value) {
        chat.value = props.adminData.chats.find(c => c.chatId === props.editId) || null;
        if (chat.value) chat.value.unread = 0;
        scrollToBottom();
      } else {
        tab.value = 'new';
      }
    });

    /* 회원의 다른 채팅 이력 */
    const memberChats = computed(() => {
      if (!chat.value) return [];
      return props.adminData.chats.filter(c => c.userId === chat.value.userId && c.chatId !== chat.value.chatId);
    });

    /* 신규 채팅 form */
    const form = reactive({ chatId: null, userId: '', userNm: '', subject: '', status: '진행중' });
    const errors = reactive({});

    const schema = yup.object({
      userId: yup.string().required('회원ID를 입력해주세요.'),
      subject: yup.string().required('제목을 입력해주세요.'),
    });

    const sendReply = () => {
      if (!replyText.value.trim()) return;
      if (!chat.value) return;
      chat.value.messages.push({ from: 'cs', text: replyText.value.trim(), time: new Date().toTimeString().slice(0, 5) });
      chat.value.lastMsg = replyText.value.trim();
      replyText.value = '';
      scrollToBottom();
      props.showToast('답변을 전송했습니다.');
    };

    const closeChat = () => {
      if (!chat.value) return;
      chat.value.status = '종료';
      props.showToast('채팅이 종료되었습니다.');
    };

    const saveNew = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const ok = await props.showConfirm('등록', '등록하시겠습니까?');
      if (!ok) return;
      const m = props.adminData.getMember(Number(form.userId));
      props.adminData.chats.push({
        chatId: props.adminData.nextId(props.adminData.chats, 'chatId'),
        userId: Number(form.userId), userNm: m ? m.memberNm : form.userNm,
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        subject: form.subject, lastMsg: '', status: form.status, unread: 0, messages: [],
      });
      try {
        const res = await window.adminApi.post(`chatts/${form.chatId}`, { ...form });
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('등록되었습니다.', 'success');
        if (props.navigate) props.navigate('cmChattMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const onUserChange = () => {
      const m = props.adminData.getMember(Number(form.userId));
      if (m) form.userNm = m.memberNm;
    };

    /* 회원 채팅 목록 조회 (신규 탭) */
    const searchUserId = ref('');
    const userChats = computed(() => {
      if (!searchUserId.value) return [];
      return props.adminData.chats.filter(c => String(c.userId) === String(searchUserId.value));
    });
    const searchUser = computed(() => props.adminData.getMember(Number(searchUserId.value)));

    return {
      isNew, tab, viewMode2, showTab, chat, replyText, sendReply, closeChat, msgBoxRef,
      hasRef, refLabel, openMsgRef, refModal, closeRefModal,
      form, errors, saveNew, onUserChange,
      searchUserId, userChats, searchUser,
      memberChats,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '채팅 등록' : (viewMode ? '채팅 상세' : '채팅 수정') }}<span v-if="!isNew && chat" style="font-size:12px;color:#999;margin-left:8px;">#{{ chat.chatId }}</span></div>

  <!-- 채팅 상세 -->
  <div v-if="!isNew">
    <div class="tab-bar-row">
      <div class="tab-nav">
        <button class="tab-btn" :class="{active:tab==='chat'}" :disabled="viewMode2!=='tab'" @click="tab='chat'">💬 채팅 내용</button>
        <button class="tab-btn" :class="{active:tab==='history'}" :disabled="viewMode2!=='tab'" @click="tab='history'">🕒 회원 채팅 이력 <span class="tab-count">{{ memberChats.length }}</span></button>
      </div>
      <div class="tab-view-modes">
        <button class="tab-view-mode-btn" :class="{active:viewMode2==='tab'}" @click="viewMode2='tab'" title="탭으로 보기">📑</button>
        <button class="tab-view-mode-btn" :class="{active:viewMode2==='1col'}" @click="viewMode2='1col'" title="1열로 보기">1▭</button>
        <button class="tab-view-mode-btn" :class="{active:viewMode2==='2col'}" @click="viewMode2='2col'" title="2열로 보기">2▭</button>
        <button class="tab-view-mode-btn" :class="{active:viewMode2==='3col'}" @click="viewMode2='3col'" title="3열로 보기">3▭</button>
        <button class="tab-view-mode-btn" :class="{active:viewMode2==='4col'}" @click="viewMode2='4col'" title="4열로 보기">4▭</button>
      </div>
    </div>
    <div :class="viewMode2!=='tab' ? 'dtl-tab-grid cols-'+viewMode2.charAt(0) : ''">

    <!-- 채팅 내용 탭 -->
    <div class="card" v-show="showTab('chat')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">💬 채팅 내용</div>
      <template v-if="chat">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div>
            <div style="font-size:15px;font-weight:700;">{{ chat.subject }}</div>
            <div style="font-size:12px;color:#888;margin-top:3px;">
              <span class="ref-link" @click="showRefModal('member', chat.userId)">{{ chat.userNm }}</span>
              &nbsp;·&nbsp;{{ chat.date }}
              &nbsp;·&nbsp;<span class="badge" :class="chat.status==='진행중'?'badge-green':'badge-gray'">{{ chat.status }}</span>
            </div>
          </div>
          <button v-if="chat.status==='진행중'" class="btn btn-secondary btn-sm" @click="closeChat">채팅 종료</button>
        </div>

        <!-- 메시지 목록 -->
        <div class="chat-messages" ref="msgBoxRef">
          <div v-for="(msg, idx) in chat.messages" :key="idx" class="chat-msg" :class="msg.from">
            <div class="chat-bubble">
              {{ msg.text }}
              <span v-if="hasRef(msg)" class="ref-link" style="display:block;margin-top:4px;" @click="openMsgRef(msg)">{{ refLabel(msg) }}</span>
            </div>
            <div class="chat-time">{{ msg.from==='user' ? '고객' : 'CS' }} · {{ msg.time }}</div>
          </div>
          <div v-if="chat.messages.length===0" style="text-align:center;color:#aaa;padding:20px;font-size:13px;">메시지가 없습니다.</div>
        </div>

        <!-- 답변 입력 -->
        <div v-if="chat.status==='진행중'" style="display:flex;gap:8px;margin-top:12px;">
          <textarea class="form-control" v-model="replyText" rows="2" placeholder="답변을 입력하고 Enter..." style="resize:none;"
            @keydown.enter.exact.prevent="sendReply"></textarea>
          <button class="btn btn-primary" @click="sendReply" style="white-space:nowrap;">전송</button>
        </div>
        <div v-else style="margin-top:12px;text-align:center;color:#aaa;font-size:13px;padding:10px;background:#fafafa;border-radius:6px;">종료된 채팅입니다.</div>

        <div class="form-actions">
          <button class="btn btn-secondary" @click="navigate('cmChattMng')">목록으로</button>
        </div>
      </template>
      <div v-else style="text-align:center;color:#aaa;padding:40px;">채팅을 찾을 수 없습니다.</div>
    </div>

    <!-- 회원 채팅 이력 탭 -->
    <div class="card" v-show="showTab('history')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">🕒 회원 채팅 이력 <span class="tab-count">{{ memberChats.length }}</span></div>
      <div v-if="chat" style="margin-bottom:14px;padding:12px;background:#f9f9f9;border-radius:8px;display:flex;align-items:center;gap:12px;">
        <span style="font-size:13px;color:#555;">
          <span class="ref-link" @click="showRefModal('member', chat.userId)">{{ chat.userNm }}</span> 의 다른 채팅
        </span>
      </div>
      <table class="admin-table" v-if="memberChats.length">
        <thead><tr><th>제목</th><th>상태</th><th>최근 메시지</th><th>일시</th><th>관리</th></tr></thead>
        <tbody>
          <tr v-for="c in memberChats" :key="c.chatId">
            <td>{{ c.subject }}</td>
            <td><span class="badge" :class="c.status==='진행중'?'badge-green':'badge-gray'">{{ c.status }}</span></td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ c.lastMsg || '-' }}</td>
            <td>{{ c.date }}</td>
            <td><button class="btn btn-blue btn-sm" @click="navigate('cmChattDtl',{id:c.chatId})">상세</button></td>
          </tr>
        </tbody>
      </table>
      <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">다른 채팅 이력이 없습니다.</div>
    </div>
    </div>
  </div>

  <!-- 신규 채팅 등록 -->
  <template v-if="isNew">
    <div class="card">
      <div class="tab-nav">
        <button class="tab-btn" :class="{active:tab==='new'}" @click="tab='new'">신규 등록</button>
        <button class="tab-btn" :class="{active:tab==='search'}" @click="tab='search'">고객 채팅 조회</button>
      </div>

      <!-- 신규 등록 탭 -->
      <div v-show="tab==='new'">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">회원ID <span v-if="!viewMode" class="req">*</span></label>
            <div style="display:flex;gap:8px;align-items:center;">
              <input class="form-control" v-model="form.userId" placeholder="회원 ID" @change="onUserChange" :readonly="viewMode" :class="errors.userId ? 'is-invalid' : ''" />
              <span v-if="form.userId" class="ref-link" @click="showRefModal('member', Number(form.userId))">보기</span>
            </div>
            <span v-if="errors.userId" class="field-error">{{ errors.userId }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">회원명</label>
            <div class="readonly-field">{{ form.userNm || '-' }}</div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">제목 <span v-if="!viewMode" class="req">*</span></label>
          <input class="form-control" v-model="form.subject" placeholder="채팅 제목" :readonly="viewMode" :class="errors.subject ? 'is-invalid' : ''" />
          <span v-if="errors.subject" class="field-error">{{ errors.subject }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" style="max-width:200px;" v-model="form.status" :disabled="viewMode">
            <option>진행중</option><option>종료</option>
          </select>
        </div>
        <div class="form-actions">
          <template v-if="viewMode">
            <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
            <button class="btn btn-secondary" @click="navigate('cmChattMng')">닫기</button>
          </template>
          <template v-else>
            <button class="btn btn-primary" @click="saveNew">등록</button>
            <button class="btn btn-secondary" @click="navigate('cmChattMng')">취소</button>
          </template>
        </div>
      </div>

      <!-- 고객 채팅 조회 탭 -->
      <div v-show="tab==='search'">
        <div style="display:flex;gap:8px;margin-bottom:14px;">
          <input class="form-control" style="max-width:200px;" v-model="searchUserId" placeholder="회원 ID 입력" />
          <span v-if="searchUser" class="ref-link" style="display:flex;align-items:center;" @click="showRefModal('member', Number(searchUserId))">보기</span>
        </div>
        <template v-if="searchUser">
          <div style="margin-bottom:10px;padding:10px 14px;background:#f9f9f9;border-radius:8px;font-size:13px;">
            <b>{{ searchUser.name }}</b> ({{ searchUser.email }}) · {{ searchUser.grade }} · {{ searchUser.status }}
          </div>
          <table class="admin-table" v-if="userChats.length">
            <thead><tr><th>제목</th><th>상태</th><th>최근 메시지</th><th>일시</th><th>보기</th></tr></thead>
            <tbody>
              <tr v-for="c in userChats" :key="c.chatId">
                <td>{{ c.subject }}</td>
                <td><span class="badge" :class="c.status==='진행중'?'badge-green':'badge-gray'">{{ c.status }}</span></td>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ c.lastMsg || '-' }}</td>
                <td>{{ c.date }}</td>
                <td><button class="btn btn-blue btn-sm" @click="navigate('cmChattDtl',{id:c.chatId})">보기</button></td>
              </tr>
            </tbody>
          </table>
          <div v-else style="text-align:center;color:#aaa;padding:20px;font-size:13px;">채팅 내역이 없습니다.</div>
        </template>
        <div v-else-if="searchUserId" style="color:#aaa;font-size:13px;padding:20px;text-align:center;">해당 회원을 찾을 수 없습니다.</div>
        <div v-else style="color:#aaa;font-size:13px;padding:20px;text-align:center;">회원 ID를 입력하세요.</div>
      </div>
    </div>
  </template>

  <!-- 메시지 내 참조 모달 (상품/주문/클레임) -->
  <div v-if="refModal && refModal.show" class="modal-overlay" @click.self="closeRefModal">
    <div class="modal-box">
      <div class="modal-header">
        <span class="modal-title">
          {{ refModal.type==='product'?'상품 상세':refModal.type==='order'?'주문 상세':'클레임 상세' }}
        </span>
        <span class="modal-close" @click="closeRefModal">×</span>
      </div>
      <template v-if="refModal.data">
        <template v-if="refModal.type==='product'">
          <div class="detail-row"><span class="detail-label">상품ID</span><span class="detail-value">{{ refModal.data.productId }}</span></div>
          <div class="detail-row"><span class="detail-label">상품명</span><span class="detail-value">{{ refModal.data.prodNm }}</span></div>
          <div class="detail-row"><span class="detail-label">카테고리</span><span class="detail-value">{{ refModal.data.category }}</span></div>
          <div class="detail-row"><span class="detail-label">가격</span><span class="detail-value">{{ refModal.data.price.toLocaleString() }}원</span></div>
          <div class="detail-row"><span class="detail-label">재고</span><span class="detail-value">{{ refModal.data.stock }}개</span></div>
          <div class="detail-row"><span class="detail-label">상태</span><span class="detail-value">{{ refModal.data.status }}</span></div>
        </template>
        <template v-else-if="refModal.type==='order'">
          <div class="detail-row"><span class="detail-label">주문ID</span><span class="detail-value">{{ refModal.data.orderId }}</span></div>
          <div class="detail-row"><span class="detail-label">회원</span><span class="detail-value">{{ refModal.data.userNm }}</span></div>
          <div class="detail-row"><span class="detail-label">주문일시</span><span class="detail-value">{{ refModal.data.orderDate }}</span></div>
          <div class="detail-row"><span class="detail-label">상품</span><span class="detail-value">{{ refModal.data.prodNm }}</span></div>
          <div class="detail-row"><span class="detail-label">금액</span><span class="detail-value">{{ refModal.data.totalPrice.toLocaleString() }}원</span></div>
          <div class="detail-row"><span class="detail-label">상태</span><span class="detail-value">{{ refModal.data.status }}</span></div>
        </template>
        <template v-else-if="refModal.type==='claim'">
          <div class="detail-row"><span class="detail-label">클레임ID</span><span class="detail-value">{{ refModal.data.claimId }}</span></div>
          <div class="detail-row"><span class="detail-label">주문ID</span><span class="detail-value">{{ refModal.data.orderId }}</span></div>
          <div class="detail-row"><span class="detail-label">유형</span><span class="detail-value">{{ refModal.data.type }}</span></div>
          <div class="detail-row"><span class="detail-label">상태</span><span class="detail-value">{{ refModal.data.status }}</span></div>
          <div class="detail-row"><span class="detail-label">사유</span><span class="detail-value">{{ refModal.data.reason }}</span></div>
          <div class="detail-row"><span class="detail-label">신청일</span><span class="detail-value">{{ refModal.data.requestDate }}</span></div>
        </template>
      </template>
      <div v-else style="text-align:center;color:#aaa;padding:20px;">정보를 찾을 수 없습니다.</div>
      <div style="margin-top:16px;text-align:right;">
        <button class="btn btn-secondary" @click="closeRefModal">닫기</button>
      </div>
    </div>
  </div>
</div>
`
};
