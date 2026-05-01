/* ShopJoy Admin - 문의관리 상세/등록 */
window._syContactDtlState = window._syContactDtlState || { tab: 'content', viewMode: 'tab' };
window.SyContactDtl = {
  name: 'SyContactDtl',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes', 'editId', 'viewMode'],
  setup(props) {
    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { reactive, computed, onMounted, ref, onBeforeUnmount, nextTick, watch } = Vue;

    const contacts = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, tab: window._syContactDtlState.tab || 'content', viewMode2: window._syContactDtlState.viewMode || 'tab', contentEl: null, answerEl: null });
    const tab = Vue.toRef(uiState, 'tab');
    const viewMode2 = Vue.toRef(uiState, 'viewMode2');
    const codes = reactive({ contact_categories: [], contact_statuses: [] });

    // onMounted에서 API 로드
    const handleLoadData = async () => {
      uiState.loading = true;
      try {
        const res = await boApi.get('/bo/sy/contact/page', {
          params: { pageNo: 1, pageSize: 10000 },
          ...coUtil.apiHdr('문의관리', '상세조회')
        });
        contacts = res.data?.data?.pageList || res.data?.data?.list || [];
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    const cfIsNew = computed(() => !props.editId);
    const cfSiteNm = computed(() => boUtil.getSiteNm());

    // ── watch ────────────────────────────────────────────────────────────────

        watch(() => uiState.tab, v => { window._syContactDtlState.tab = v; });

        watch(() => uiState.viewMode2, v => { window._syContactDtlState.viewMode = v; });
    const showTab = (id) => uiState.viewMode2 !== 'tab' || uiState.tab === id;

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.contact_categories = await codeStore.snGetGrpCodes('CONTACT_CATEGORY_KR') || [];
        codes.contact_statuses = await codeStore.snGetGrpCodes('CONTACT_STATUS_KR') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });

    const form = reactive({
      inquiryId: null, userId: '', userNm: '', date: '', categoryCd: '배송 문의',
      title: '', content: '', statusCd: '요청', answer: '',
    });
    const errors = reactive({});

        let _qContent = null;
        let _qAnswer = null;

    const schema = yup.object({
      title: yup.string().required('제목을 입력해주세요.'),
      content: yup.string().required('문의 내용을 입력해주세요.'),
    });

    const handleInitForm = async () => {
      if (!isNew.value) {
        const c = contacts.find(x => x.inquiryId === props.editId);
        if (c) Object.assign(form, { ...c });
        // 답변 있으면 답변 탭 기본 선택
        if (form.answer) uiState.tab = 'answer';
      }
      await nextTick();
      const fullToolbar = [[{header:[1,2,3,false]}],['bold','italic','underline'],[{color:[]},{background:[]}],[{list:'ordered'},{list:'bullet'}],['link','blockquote','clean']];
      if (uiState.contentEl) {
        _qContent = new Quill(uiState.contentEl, {
          theme: 'snow',
          placeholder: '내용을 입력하세요...',
          modules: { toolbar: fullToolbar }
        });
        if (form.content) _qContent.root.innerHTML = form.content;
        _qContent.on('text-change', () => { form.content = _qContent.root.innerHTML; });
      }
      if (uiState.answerEl) {
        _qAnswer = new Quill(uiState.answerEl, {
          theme: 'snow',
          placeholder: '고객에게 전달할 답변을 입력하세요.',
          modules: { toolbar: fullToolbar }
        });
        if (form.answer) _qAnswer.root.innerHTML = form.answer;
        _qAnswer.on('text-change', () => { form.answer = _qAnswer.root.innerHTML; });
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleLoadData();
      handleInitForm();
    });

    onBeforeUnmount(() => {
      if (_qContent) { form.content = _qContent.root.innerHTML; _qContent = null; }
      if (_qAnswer) { form.answer = _qAnswer.root.innerHTML; _qAnswer = null; }
    });

    const onUserIdChange = () => {
      const m = getMember.value(Number(form.userId));
      if (m) form.userNm = m.memberNm;
    };

    /* 같은 회원의 다른 문의 */
    const cfMemberContacts = computed(() =>
      contacts.filter(c => String(c.userId) === String(form.userId) && c.inquiryId !== props.editId)
    );

    const fnStatusBadge = s => ({
      '요청': 'badge-orange', '처리중': 'badge-blue', '답변완료': 'badge-green', '취소됨': 'badge-gray'
    }[s] || 'badge-gray');

    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        console.error('[catch-info]', err);
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const ok = await props.showConfirm(cfIsNew.value ? '등록' : '저장', cfIsNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      if (cfIsNew.value) {
        contacts.push({ ...form, inquiryId: nextId.value(contacts, 'inquiryId'), userId: Number(form.userId), date: form.date || new Date().toISOString().slice(0, 16).replace('T', ' ') });
      } else {
        const idx = contacts.findIndex(x => x.inquiryId === props.editId);
        if (idx !== -1) Object.assign(contacts[idx], { ...form });
      }
      try {
        const res = await (cfIsNew.value ? boApi.post(`/bo/sy/contact/${form.inquiryId}`, { ...form }, coUtil.apiHdr('문의관리', '등록')) : boApi.put(`/bo/sy/contact/${form.inquiryId}`, { ...form }, coUtil.apiHdr('문의관리', '저장')));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('syContactMng');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const saveAnswer = () => {
      if (!cfIsNew.value) {
        const idx = contacts.findIndex(x => x.inquiryId === props.editId);
        if (idx !== -1) {
          contacts[idx].answer = form.answer;
          if (form.answer) contacts[idx].statusCd = '답변완료';
        }
      }
      props.showToast('답변이 저장되었습니다.');
    };

    const answerEl = Vue.toRef(uiState, 'answerEl');
    const contentEl = Vue.toRef(uiState, 'contentEl');

    // ── return ───────────────────────────────────────────────────────────────

    return { contacts, uiState, codes, cfIsNew, tab, viewMode2, showTab, form, errors, cfMemberContacts, fnStatusBadge, handleSave, saveAnswer, onUserIdChange, cfSiteNm, contentEl, answerEl };
  },
  template: /* html */`
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="page-title">{{ cfIsNew ? '문의 등록' : (viewMode ? '문의 상세' : '문의 수정') }}</div><span v-if="!cfIsNew" style="font-size:12px;color:#999;">#{{ form.inquiryId }}</span></div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ cfSiteNm }}</div>
      </div>
    </div>
    <div class="tab-bar-row">
      <div class="tab-nav">
        <button class="tab-btn" :class="{active:tab==='content'}" :disabled="viewMode2!=='tab'" @click="tab='content'">📋 문의 내용</button>
        <button class="tab-btn" :class="{active:tab==='answer'}"  :disabled="viewMode2!=='tab'" @click="tab='answer'">💬 답변</button>
        <button v-if="!cfIsNew && form.userId" class="tab-btn" :class="{active:tab==='history'}" :disabled="viewMode2!=='tab'" @click="tab='history'">🕒 회원 문의 이력 <span class="tab-count">{{ cfMemberContacts.length }}</span></button>
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

    <!-- ── 문의 내용 ──────────────────────────────────────────────────────── -->
    <div class="card" v-show="showTab('content')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📋 문의 내용</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">회원ID</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input class="form-control" v-model="form.userId" placeholder="회원 ID" @change="onUserIdChange" :readonly="viewMode" />
            <span v-if="form.userId" class="ref-link" @click="showRefModal('member', Number(form.userId))">보기</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">회원명</label>
          <div class="readonly-field">{{ form.userNm || '-' }}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">카테고리</label>
          <select class="form-control" v-model="form.categoryCd" :disabled="viewMode">
            <option v-for="c in codes.contact_categories" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" v-model="form.statusCd" :disabled="viewMode">
            <option v-for="c in codes.contact_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">제목 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.title" :readonly="viewMode" :class="errors.title ? 'is-invalid' : ''" />
        <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">문의 내용 <span v-if="!viewMode" class="req">*</span></label>
        <div v-if="viewMode" class="form-control" style="min-height:150px;line-height:1.6;" v-html="form.content || '<span style=color:#bbb>-</span>'"></div>
        <div v-else ref="contentEl" style="min-height:150px;background:#fff;" :class="errors.content ? 'is-invalid' : ''"></div>
        <span v-if="errors.content" class="field-error">{{ errors.content }}</span>
      </div>
      <div class="form-actions">
        <template v-if="viewMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('syContactMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" @click="handleSave">저장</button>
          <button class="btn btn-secondary" @click="navigate('syContactMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- ── 답변 ─────────────────────────────────────────────────────────── -->
    <div class="card" v-show="showTab('answer')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">💬 답변</div>
      <div v-if="!cfIsNew" style="margin-bottom:16px;padding:14px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8;">
        <div style="font-size:12px;color:#888;margin-bottom:6px;">{{ form.categoryCd }} · {{ form.date }}</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:8px;">{{ form.title }}</div>
        <div style="font-size:13px;color:#555;white-space:pre-line;">{{ form.content }}</div>
      </div>
      <div class="form-group">
        <label class="form-label">답변 내용 <span v-if="!form.answer" class="badge badge-orange" style="margin-left:4px;">미답변</span></label>
        <div v-if="viewMode" class="form-control" style="min-height:180px;line-height:1.6;" v-html="form.answer || '<span style=color:#bbb>-</span>'"></div>
        <div v-else ref="answerEl" style="min-height:180px;background:#fff;"></div>
      </div>
      <div class="form-actions">
        <template v-if="viewMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('syContactMng')">닫기</button>
        </template>
        <template v-else>
          <button v-if="!cfIsNew" class="btn btn-primary" @click="saveAnswer">답변 저장</button>
          <button class="btn btn-primary" @click="handleSave">전체 저장</button>
          <button class="btn btn-secondary" @click="navigate('syContactMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- ── 회원 문의 이력 ───────────────────────────────────────────────────── -->
    <div class="card" v-show="showTab('history')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">🕒 회원 문의 이력 <span class="tab-count">{{ cfMemberContacts.length }}</span></div>
      <table class="bo-table" v-if="cfMemberContacts.length">
        <thead><tr><th>카테고리</th><th>제목</th><th>상태</th><th>등록일</th><th>관리</th></tr></thead>
        <tbody>
          <tr v-for="c in cfMemberContacts" :key="c.inquiryId">
            <td><span class="tag">{{ c.categoryCd }}</span></td>
            <td>{{ c.title }}</td>
            <td><span class="badge" :class="fnStatusBadge(c.statusCd)">{{ c.statusCd }}</span></td>
            <td>{{ c.date.slice(0,10) }}</td>
            <td><button class="btn btn-blue btn-sm" @click="navigate('syContactDtl',{id:c.inquiryId})">상세</button></td>
          </tr>
        </tbody>
      </table>
      <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">다른 문의 이력이 없습니다.</div>
    </div>
    </div>
  </div>
</div>
`
};
