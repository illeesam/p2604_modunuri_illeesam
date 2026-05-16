/* ShopJoy Admin - 문의관리 상세/등록 */
window._syContactDtlState = window._syContactDtlState || { tab: 'content', tabMode: 'tab' };
window.SyContactDtl = {
  name: 'SyContactDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    tabMode:      { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    const { reactive, computed, onMounted, ref, onBeforeUnmount, nextTick, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, tab: window._syContactDtlState.tab || 'content', tabMode2: window._syContactDtlState.tabMode || 'tab' });
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({ contact_categories: [], contact_statuses: [] });
    const cfIsNew = computed(() => !props.dtlId);
    const cfSiteNm = computed(() => boUtil.getSiteNm());

watch(() => uiState.tab, v => { window._syContactDtlState.tab = v; });

        watch(() => uiState.tabMode2, v => { window._syContactDtlState.tabMode = v; });

    /* 문의 showTab */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;

    /* 문의 fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.contact_categories = codeStore.sgGetGrpCodes('CONTACT_CATEGORY_KR');
      codes.contact_statuses = codeStore.sgGetGrpCodes('CONTACT_STATUS_KR');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);


    const form = reactive({
      contactId: null, memberId: '', memberNm: '', contactDate: '', categoryCd: '배송 문의',
      contactTitle: '', contactContent: '', contactStatusCd: '요청', contactAnswer: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      contactTitle: yup.string().required('제목을 입력해주세요.'),
      contactContent: yup.string().required('문의 내용을 입력해주세요.'),
    });

    /* 문의 상세조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.syContact.getById(props.dtlId, '문의관리', '상세조회');
        const data = res.data?.data;
        if (data) {
          Object.assign(form, data);
          if (form.contactAnswer) uiState.tab = 'answer';
        }
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 상세 조회
    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      if (!cfIsNew.value) { await handleLoadDetail(); }
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) return;
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleLoadDetail();
    });

    /* 문의 onUserIdChange */
    const onUserIdChange = () => {
      const m = getMember.value(Number(form.memberId));
      if (m) form.memberNm = m.memberNm;
    };

    /* 문의 fnStatusBadge */
    const fnStatusBadge = s => ({
      '요청': 'badge-orange', '처리중': 'badge-blue', '답변완료': 'badge-green', '취소됨': 'badge-gray'
    }[s] || 'badge-gray');

    const cfCurId       = computed(() => props.dtlId || form.contactId || null);
    const cfHasId       = computed(() => !!cfCurId.value);
    /* 첫 탭 = content. answer/history 탭은 ID 없으면 비활성. */
    const cfSaveDisabled = computed(() => uiState.tab !== 'content' && !cfHasId.value);

    /* 문의 _afterApiOk */
    const _afterApiOk  = (res, msg) => {
      if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
      if (showToast) showToast(msg, 'success');
    };

    /* 문의 _afterApiErr */
    const _afterApiErr = (err) => {
      console.error('[handleSave]', err);
      const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
      if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
      if (showToast) showToast(errMsg, 'error', 0);
    };

    /* ── 탭별 저장: content=문의 본체(신규/수정), answer=답변만 부분 PUT ── */
    const handleSave = async () => {
      const tabId = uiState.tab;

      if (!cfHasId.value && tabId !== 'content') {
        showToast('먼저 문의 내용 탭에서 등록해주세요.', 'error');
        return;
      }

      if (tabId === 'content') {
        Object.keys(errors).forEach(k => delete errors[k]);
        try { await schema.validate(form, { abortEarly: false }); }
        catch (err) { err.inner.forEach(e => { errors[e.path] = e.message; }); showToast('입력 내용을 확인해주세요.', 'error'); return; }

        const isCreate = !cfHasId.value;
        const ok = await showConfirm(isCreate ? '등록' : '저장', isCreate ? '등록하시겠습니까?' : '저장하시겠습니까?');
        if (!ok) return;
        try {
          const payload = { ...form };
          const res = isCreate
            ? await boApiSvc.syContact.create(payload, '문의관리', '등록')
            : await boApiSvc.syContact.update(cfCurId.value, payload, '문의관리', '문의내용저장');
          if (isCreate) {
            const newId = res.data?.data?.contactId || res.data?.contactId || null;
            if (newId) form.contactId = newId;
          }
          _afterApiOk(res, isCreate ? '등록되었습니다. 답변 탭에서 답변을 저장할 수 있습니다.' : '저장되었습니다.');
        } catch (err) { _afterApiErr(err); }
        return;
      }

      /* answer 탭은 saveAnswer 가 담당 — handleSave 가 호출되면 saveAnswer 로 위임 */
      if (tabId === 'answer') { await saveAnswer(); return; }
    };

    /* ── 답변 부분 저장 ── */
    const saveAnswer = async () => {
      if (!cfHasId.value) {
        showToast('먼저 문의 내용 탭에서 등록해주세요.', 'error');
        return;
      }
      const ok = await showConfirm('답변 저장', '답변을 저장하시겠습니까?');
      if (!ok) return;
      try {
        const res = await boApiSvc.syContact.update(cfCurId.value, { contactAnswer: form.contactAnswer, contactStatusCd: form.contactStatusCd }, '문의관리', '답변저장');
        _afterApiOk(res, '답변이 저장되었습니다.');
      } catch (err) { _afterApiErr(err); }
    };

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    // -- return ---------------------------------------------------------------

    return { uiState, codes, cfIsNew, cfHasId, cfSaveDisabled, tab, tabMode2, cfDtlMode, showTab, form, errors, fnStatusBadge, handleSave, saveAnswer, onUserIdChange, cfSiteNm };
  },
  template: /* html */`
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="page-title">{{ cfIsNew ? '문의 등록' : (cfDtlMode ? '문의 상세' : '문의 수정') }}</div><span v-if="!cfIsNew" style="font-size:12px;color:#999;">#{{ form.contactId }}</span></div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ cfSiteNm }}</div>
      </div>
    </div>
    <div class="tab-bar-row">
      <div class="tab-nav">
        <button class="tab-btn" :class="{active:tab==='content'}" :disabled="tabMode2!=='tab'" @click="tab='content'">📋 문의 내용</button>
        <button class="tab-btn" :class="{active:tab==='answer'}"  :disabled="tabMode2!=='tab'" @click="tab='answer'">💬 답변</button>
        <button v-if="!cfIsNew && form.memberId" class="tab-btn" :class="{active:tab==='history'}" :disabled="tabMode2!=='tab'" @click="tab='history'">🕒 회원 문의 이력</button>
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

    <!-- -- 문의 내용 -------------------------------------------------------- -->
    <div class="card" v-show="showTab('content')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📋 문의 내용</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">회원ID</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input class="form-control" v-model="form.memberId" placeholder="회원 ID" @change="onUserIdChange" :readonly="cfDtlMode" />
            <span v-if="form.memberId" class="ref-link" @click="showRefModal('member', Number(form.memberId))">보기</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">회원명</label>
          <div class="readonly-field">{{ form.memberNm || '-' }}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">카테고리</label>
          <select class="form-control" v-model="form.categoryCd" :disabled="cfDtlMode">
            <option v-for="c in codes.contact_categories" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" v-model="form.contactStatusCd" :disabled="cfDtlMode">
            <option v-for="c in codes.contact_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">제목 <span v-if="!cfDtlMode" class="req">*</span></label>
        <input class="form-control" v-model="form.contactTitle" :readonly="cfDtlMode" :class="errors.contactTitle ? 'is-invalid' : ''" />
        <span v-if="errors.contactTitle" class="field-error">{{ errors.contactTitle }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">문의 내용 <span v-if="!cfDtlMode" class="req">*</span></label>
        <div v-if="cfDtlMode" class="form-control" style="min-height:150px;line-height:1.6;" v-html="form.contactContent || '<span style=color:#bbb>-</span>'"></div>
        <base-html-editor v-else v-model="form.contactContent" height="220px" />
        <span v-if="errors.contactContent" class="field-error">{{ errors.contactContent }}</span>
      </div>
      <div class="form-actions">
        <template v-if="cfDtlMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('syContactMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 문의 내용 탭에서 등록해주세요.' : ''" @click="handleSave">저장</button>
          <button class="btn btn-secondary" @click="navigate('syContactMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- -- 답변 ----------------------------------------------------------- -->
    <div class="card" v-show="showTab('answer')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">💬 답변</div>
      <div v-if="!cfIsNew" style="margin-bottom:16px;padding:14px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8;">
        <div style="font-size:12px;color:#888;margin-bottom:6px;">{{ form.categoryCd }} · {{ form.contactDate }}</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:8px;">{{ form.contactTitle }}</div>
        <div style="font-size:13px;color:#555;white-space:pre-line;">{{ form.contactContent }}</div>
      </div>
      <div class="form-group">
        <label class="form-label">답변 내용 <span v-if="!form.contactAnswer" class="badge badge-orange" style="margin-left:4px;">미답변</span></label>
        <div v-if="cfDtlMode" class="form-control" style="min-height:180px;line-height:1.6;" v-html="form.contactAnswer || '<span style=color:#bbb>-</span>'"></div>
        <base-html-editor v-else v-model="form.contactAnswer" height="240px" />
      </div>
      <div class="form-actions">
        <template v-if="cfDtlMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('syContactMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 문의 내용 탭에서 등록해주세요.' : ''" @click="saveAnswer">답변 저장</button>
          <button class="btn btn-secondary" @click="navigate('syContactMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- -- 회원 문의 이력 ----------------------------------------------------- -->
    <div class="card" v-show="showTab('history')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🕒 회원 문의 이력</div>
      <div style="text-align:center;color:#aaa;padding:30px;font-size:13px;">회원 문의 이력은 목록에서 확인하세요.</div>
    </div>
    </div>
  </div>
</div>
`
};
