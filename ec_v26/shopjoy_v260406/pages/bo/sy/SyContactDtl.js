/* ShopJoy Admin - 문의관리 상세/등록 */
window._syContactDtlState = window._syContactDtlState || { tab: 'content', tabMode: 'tab' };
window.SyContactDtl = {
  name: 'SyContactDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    active:       { type: Boolean, default: true }, // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
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
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDtlMode = computed(() => props.dtlMode === 'view'); // dtlMode: 'view'이면 읽기전용

    watch(() => uiState.tab, v => { window._syContactDtlState.tab = v; });
    watch(() => uiState.tabMode2, v => { window._syContactDtlState.tabMode = v; });

    /* showTab — 표시 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyContactDtl.js : handleBtnAction -> ', cmd, param);
      // 활성 탭 폼 저장 (content 탭은 handleSave, answer 탭은 saveAnswer 위임)
      if (cmd === 'form-save') {
        return handleSave();
      // 답변 탭 별도 저장 액션
      } else if (cmd === 'form-saveAnswer') {
        return saveAnswer();
      // 폼 편집 취소 → 상세영역 유지 + 빈 신규 폼으로 초기화 (영역 사라지지 않음)
      } else if (cmd === 'form-cancel') {
        return props.navigate('__cancelEdit__');
      // 상세 보기 → 편집 모드 전환
      } else if (cmd === 'form-edit') {
        return props.navigate('__switchToEdit__');
      // 폼 닫기 → 상세영역 유지 + 빈 신규 폼으로 초기화
      } else if (cmd === 'form-close') {
        return props.navigate('__cancelEdit__');
      // 회원 참조 모달 열기
      } else if (cmd === 'member-ref') {
        return showRefModal('member', Number(form.memberId));
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyContactDtl.js : handleSelectAction -> ', cmd, param);
      // 탭 전환 (content/answer/history)
      if (cmd === 'tabs-select') {
        uiState.tab = param;
        return;
      // 뷰모드 전환 (tab/1col/2col/3col/4col)
      } else if (cmd === 'tabMode-select') {
        uiState.tabMode2 = param;
        return;
      // 회원ID 입력 변경 → 회원명 자동 채움
      } else if (cmd === 'form-memberIdChange') {
        return onUserIdChange();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;

    const form = reactive({
      contactId: null, memberId: '', memberNm: '', contactDate: '', categoryCd: '배송 문의',
      contactTitle: '', contactContent: '', contactStatusCd: '요청', contactAnswer: '',
      contentAttachGrpId: null,  // 문의내용 첨부그룹 ID
      answerAttachGrpId: null,   // 답변 첨부그룹 ID
    });

    /* cfContentAttachRefId / cfAnswerAttachRefId — 첨부 ref ID (contactId) */
    const cfContentAttachRefId = computed(() => form.contactId);
    const cfAnswerAttachRefId  = computed(() => form.contactId);
    const errors = reactive({});

    const schema = yup.object({
      contactTitle: yup.string().required('제목을 입력해주세요.'),
      contactContent: yup.string().required('문의 내용을 입력해주세요.'),
    });

    const cfCurId       = computed(() => props.dtlId || form.contactId || null);
    const cfHasId       = computed(() => !!cfCurId.value);
    /* 첫 탭 = content. answer/history 탭은 ID 없으면 비활성. */
    const cfSaveDisabled = computed(() => uiState.tab !== 'content' && !cfHasId.value);

    /* tabs — 탭 정의 (BoTabBar 데이터, reactive) */
    const tabs = reactive([
      { id: 'content', label: '문의 내용', icon: '📋' },
      { id: 'answer',  label: '답변',      icon: '💬' },
    ]);
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.contact_categories = codeStore.sgGetGrpCodes('CONTACT_CATEGORY_KR');
      codes.contact_statuses = codeStore.sgGetGrpCodes('CONTACT_STATUS_KR');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.syContact.getById(props.dtlId, '문의관리', '상세조회');
        const data = res.data?.data;
        if (data) {
          Object.assign(form, data);
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
      if (isAppReady.value) { fnLoadCodes(); }
      if (!cfIsNew.value) { await handleLoadDetail(); }
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleLoadDetail();
    });

    /* onUserIdChange — 이벤트 */
    const onUserIdChange = () => {
      const m = getMember.value(Number(form.memberId));
      if (m) { form.memberNm = m.memberNm; }
    };

    /* 문의 fnStatusBadge */
    const _CONTACT_STATUS_KR_FB = {
      '요청': 'badge-orange', '처리중': 'badge-blue', '답변완료': 'badge-green', '취소됨': 'badge-gray'
    };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('CONTACT_STATUS_KR', s, _CONTACT_STATUS_KR_FB[s] || 'badge-gray');

    /* _afterApiOk — 후 API 성공 */
    const _afterApiOk  = (res, msg) => {
      if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
      if (showToast) { showToast(msg, 'success'); }
    };

    /* _afterApiErr — 후 API 오류 */
    const _afterApiErr = (err) => {
      console.error('[handleSave]', err);
      const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
      if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
      if (showToast) { showToast(errMsg, 'error', 0); }
    };

    /* handleSave — 저장 */
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
        if (!ok) { return; }
        try {
          const payload = { ...form };
          const res = isCreate
            ? await boApiSvc.syContact.create(payload, '문의관리', '등록')
            : await boApiSvc.syContact.update(cfCurId.value, payload, '문의관리', '문의내용저장');
          if (isCreate) {
            const newId = res.data?.data?.contactId || res.data?.contactId || null;
            if (newId) { form.contactId = newId; }
          }
          _afterApiOk(res, isCreate ? '등록되었습니다. 답변 탭에서 답변을 저장할 수 있습니다.' : '저장되었습니다.');
        } catch (err) { _afterApiErr(err); }
        return;
      }

      /* answer 탭은 saveAnswer 가 담당 — handleSave 가 호출되면 saveAnswer 로 위임 */
      if (tabId === 'answer') { await saveAnswer(); return; }
    };

    /* saveAnswer — 저장 */
    const saveAnswer = async () => {
      if (!cfHasId.value) {
        showToast('먼저 문의 내용 탭에서 등록해주세요.', 'error');
        return;
      }
      const ok = await showConfirm('답변 저장', '답변을 저장하시겠습니까?');
      if (!ok) { return; }
      try {
        const res = await boApiSvc.syContact.update(cfCurId.value, { contactAnswer: form.contactAnswer, contactStatusCd: form.contactStatusCd }, '문의관리', '답변저장');
        _afterApiOk(res, '답변이 저장되었습니다.');
      } catch (err) { _afterApiErr(err); }
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // 사이트명 영역
    const columns = {};
    columns.siteForm = [
      { key: '_siteNm', label: '사이트명', type: 'readonly', fmt: () => cfSiteNm.value, colSpan: 4 },
    ];
    // content 탭 영역
    columns.contentForm = [
      { key: 'memberId',        label: '회원ID', type: 'slot', name: 'memberId' },
      { key: 'memberNm',        label: '회원명', type: 'readonly' },
      { key: 'categoryCd',      label: '카테고리', type: 'select', options: () => codes.contact_categories },
      { key: 'contactStatusCd', label: '상태',     type: 'select', options: () => codes.contact_statuses },
      { key: 'contactTitle',    label: '제목', type: 'text', required: true, colSpan: 2 },
      { key: 'contactContent',  label: '문의 내용', type: 'slot', name: 'contactContent', colSpan: 2 },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      uiState, codes, form, errors, tab, tabMode2,                  // 상태 / 데이터
      handleBtnAction, handleSelectAction,                          // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfHasId, cfSaveDisabled, cfSiteNm, cfDtlMode, tabs,  // computed / reactive(tabs)
      showTab, fnStatusBadge,                                       // 헬퍼
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    {{ !active ? '문의 상세' : (cfIsNew ? '문의 등록' : (cfDtlMode ? '문의 상세' : '문의 수정')) }}
    <span v-if="active && !cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">
      #{{ form.contactId }}
    </span>
    <span v-if="!active" style="font-size:12px;color:#bbb;margin-left:8px;font-weight:400;">
      목록에서 행을 선택하거나 [+신규]를 누르세요
    </span>
  </div>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 사이트명 (BoFormArea 자동 렌더) =============================== -->
    <!-- ===== ■.■. 폼 영역 ================================================== -->
    <bo-form-area :columns="columns.siteForm" :form="form" :errors="{}"
      :cols="3" :show-actions="false" />
    <bo-tab-bar :tabs="tabs" :tab="tab" :tab-mode="tabMode2"
      @tab-select="id => handleSelectAction('tabs-select', id)"
      @mode-select="m => handleSelectAction('tabMode-select', m)" />
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">
    <!-- ===== ■.■.■. 문의 내용 탭 (BoFormArea 자동 렌더) ========================== -->
    <div class="card" v-show="showTab('content')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        📋 문의 내용
      </div>
      <!-- ===== ■.■.■.■. 폼 영역 ============================================== -->
      <bo-form-area :columns="columns.contentForm" :form="form" :errors="errors"
          :readonly="cfDtlMode" :cols="3" compact :show-actions="false">
        <!-- ===== ■.■.■.■.■. 회원ID + 보기 버튼 ==================================== -->
        <template #memberId>
          <div style="display:flex;gap:8px;align-items:center;">
            <input class="form-control" v-model="form.memberId" placeholder="회원 ID" @change="handleSelectAction('form-memberIdChange')" :readonly="cfDtlMode" />
            <span v-if="form.memberId" class="ref-link" @click="handleBtnAction('member-ref')">
              보기
            </span>
          </div>
        </template>
        <!-- ===== ■.■.■.■.■. 문의 내용: Quill 또는 view 모드 HTML ==================== -->
        <template #contactContent>
          <div v-if="cfDtlMode" class="form-control" style="min-height:150px;line-height:1.6;" v-html="form.contactContent || '<span style=color:#bbb>-</span>'">
          </div>
          <base-html-editor v-else v-model="form.contactContent" height="220px" />
          <span v-if="errors.contactContent" class="field-error">
            {{ errors.contactContent }}
          </span>
        </template>
      </bo-form-area>
      <!-- ===== ■.■.■.■. 문의 내용 첨부 ======================================== -->
      <div v-if="!cfIsNew" class="form-group" style="margin-top:12px;">
        <label class="form-label">
          첨부파일
        </label>
        <base-attach-grp :model-value="form.contentAttachGrpId"
          @update:model-value="form.contentAttachGrpId = $event"
          :ref-id="cfContentAttachRefId"
          :show-toast="showToast"
          grp-code="CONTACT_CONTENT_ATTACH"
          grp-nm="문의 내용 첨부파일"
          :max-count="5"
          :max-size-mb="10"
          allow-ext="jpg,jpeg,png,gif,pdf,xlsx,docx,zip" />
      </div>
      <div class="form-actions" v-if="active">
        <template v-if="cfDtlMode">
          <button class="btn btn-primary" @click="handleBtnAction('form-edit')">
            수정
          </button>
          <button class="btn btn-secondary" @click="handleBtnAction('form-close')">
            닫기
          </button>
        </template>
        <template v-else>
          <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 문의 내용 탭에서 등록해주세요.' : ''" @click="handleBtnAction('form-save')">
            저장
          </button>
          <button class="btn btn-secondary" @click="handleBtnAction('form-cancel')">
            취소
          </button>
        </template>
      </div>
    </div>
    <!-- ===== ■.■.■. 답변 ================================================== -->
    <div class="card" v-show="showTab('answer')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        💬 답변
      </div>
      <div v-if="!cfIsNew" style="margin-bottom:16px;padding:14px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8;">
        <div style="font-size:12px;color:#888;margin-bottom:6px;">
          {{ form.categoryCd }} · {{ form.contactDate }}
        </div>
        <div style="font-size:14px;font-weight:600;margin-bottom:8px;">
          {{ form.contactTitle }}
        </div>
        <div style="font-size:13px;color:#555;white-space:pre-line;">
          {{ form.contactContent }}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">
          답변 내용
          <span v-if="!form.contactAnswer" class="badge badge-orange" style="margin-left:4px;">
            미답변
          </span>
        </label>
        <div v-if="cfDtlMode" class="form-control" style="min-height:180px;line-height:1.6;" v-html="form.contactAnswer || '<span style=color:#bbb>-</span>'">
        </div>
        <base-html-editor v-else v-model="form.contactAnswer" height="240px" />
      </div>
      <!-- ===== ■.■.■.■. 답변 첨부 ========================================== -->
      <div v-if="!cfIsNew" class="form-group" style="margin-top:12px;">
        <label class="form-label">
          첨부파일
        </label>
        <base-attach-grp :model-value="form.answerAttachGrpId"
          @update:model-value="form.answerAttachGrpId = $event"
          :ref-id="cfAnswerAttachRefId"
          :show-toast="showToast"
          grp-code="CONTACT_ANSWER_ATTACH"
          grp-nm="문의 답변 첨부파일"
          :max-count="5"
          :max-size-mb="10"
          allow-ext="jpg,jpeg,png,gif,pdf,xlsx,docx,zip" />
      </div>
      <div class="form-actions" v-if="active">
        <template v-if="cfDtlMode">
          <button class="btn btn-primary" @click="handleBtnAction('form-edit')">
            수정
          </button>
          <button class="btn btn-secondary" @click="handleBtnAction('form-close')">
            닫기
          </button>
        </template>
        <template v-else>
          <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 문의 내용 탭에서 등록해주세요.' : ''" @click="handleBtnAction('form-saveAnswer')">
            답변 저장
          </button>
          <button class="btn btn-secondary" @click="handleBtnAction('form-cancel')">
            취소
          </button>
        </template>
      </div>
    </div>
  </div>
</div>
</div>
<!-- ===== □.□. 폼 영역 ================================================== -->
<!-- ===== □. 카드 영역 =================================================== -->
`
};
