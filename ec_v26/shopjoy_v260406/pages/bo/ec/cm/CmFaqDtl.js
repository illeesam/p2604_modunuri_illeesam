/* ShopJoy Admin - FAQ관리 상세/등록 */
window.CmFaqDtl = {
  name: 'CmFaqDtl',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
    dtlId:       { type: String, default: null }, // 수정 대상 ID
    dtlMode:     { type: String, default: 'view' }, // 상세 모드 (new/view/edit)
    active:      { type: Boolean, default: true }, // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, watch, onMounted, ref } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ use_yn: [] });

    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDtlMode = computed(() => props.dtlMode === 'view'); // view=읽기전용
    // 첨부 ref-id: 신규는 빈값(저장 후 부여), 기존은 FAQ-{faqId}
    const cfAttachRefId = computed(() => props.dtlId ? ('FAQ-' + props.dtlId) : '');

    const form = reactive({
      faqId: null, pathId: null, faqQuestion: '', faqAnswer: '',
      answerAttachGrpId: null,
      sortOrd: '', useYn: '',
    });
    // 신규 진입 시에만 채울 기본값
    const _applyNewDefaults = () => {
      Object.assign(form, { sortOrd: 1, useYn: 'Y' });
    };
    const errors = reactive({});

    /* ── 표시경로 모달 ── */
    const pathPickModal = reactive({ show: false });

    const schema = yup.object({
      faqQuestion: yup.string().required('질문을 입력해주세요.'),
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ CmFaqDtl.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'form-save') {
        return handleSave();
      } else if (cmd === 'form-cancel') {
        return props.navigate('__cancelEdit__');
      } else if (cmd === 'form-edit') {
        return props.navigate('__switchToEdit__');
      } else if (cmd === 'form-close') {
        return props.navigate('__cancelEdit__');
      } else if (cmd === 'pathModal-open') {
        pathPickModal.show = true;
        return;
      } else if (cmd === 'pathModal-close') {
        pathPickModal.show = false;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 모달 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ CmFaqDtl.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'pathModal-pick') {
        form.pathId = param;
        pathPickModal.show = false;
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* fnCallbackModal — 모달 통합 dispatch */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ CmFaqDtl : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'path-pick') {
        if (result == null) { pathPickModal.show = false; return; }
        form.pathId = result;
        pathPickModal.show = false;
        return;
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* pathLabel — 경로 라벨 */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
      uiState.isPageCodeLoad = true;
    };

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.cmFaq.getById(props.dtlId, 'FAQ관리', '상세조회');
        const data = res.data?.data;
        if (data) { Object.assign(form, data); }
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
      if (props.active && cfIsNew.value) { _applyNewDefaults(); }
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleLoadDetail();
    });

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
      const ok = await showConfirm(cfIsNew.value ? '등록' : '저장', cfIsNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) { return; }
      try {
        await (cfIsNew.value ? boApiSvc.cmFaq.create({ ...form }, 'FAQ관리', '등록') : boApiSvc.cmFaq.update(form.faqId, { ...form }, 'FAQ관리', '저장'));
        if (showToast) { showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('cmFaqMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // 기본 폼
    const columns = {};
    columns.baseForm = [
      { key: '_siteNm',     label: '사이트명',  type: 'readonly', fmt: () => cfSiteNm.value },
      { key: 'pathId',      label: '분류(표시경로)', type: 'pathPick',
        pathLabel: (id) => pathLabel(id),
        onOpen: () => handleBtnAction('pathModal-open') },
      { key: 'useYn',       label: '노출여부',  type: 'select', options: () => codes.use_yn },
      { key: 'faqQuestion', label: '질문',      type: 'text', required: true, colSpan: 3, placeholder: '질문을 입력하세요' },
      { key: 'faqAnswer',   label: '답변',      type: 'slot', name: 'answer', colSpan: 3 },
      { key: 'sortOrd',     label: '정렬순서',  type: 'number', min: 1 },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      form, errors, pathPickModal,
      handleBtnAction, handleSelectAction, fnCallbackModal,
      cfIsNew, cfDtlMode, cfAttachRefId,
      showToast,
    };
  },
  template: /* html */`
<bo-container :title="!active ? 'FAQ 상세' : (cfIsNew ? 'FAQ 등록' : (cfDtlMode ? 'FAQ 상세' : 'FAQ 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : form.faqId)">
  <!-- ===== ■.■. 폼 영역 ================================================== -->
  <bo-form-area :columns="columns.baseForm" :form="form" :errors="errors"
    :readonly="cfDtlMode" :cols="3" compact :show-actions="false">
    <!-- 답변 (HtmlEditor 또는 view 모드 HTML) -->
    <template #answer>
      <div v-if="cfDtlMode" class="form-control" style="min-height:160px;line-height:1.6;overflow:auto;">
        <div v-if="form.faqAnswer" v-html="form.faqAnswer"></div>
        <span v-else style="color:#bbb;">-</span>
      </div>
      <base-html-editor v-else v-model="form.faqAnswer" height="260px" />
    </template>
  </bo-form-area>
  <!-- ===== ■.■. 답변 첨부파일 ============================================== -->
  <div class="form-group" style="margin-top:12px;">
    <label class="form-label">답변 첨부파일</label>
    <base-attach-grp :model-value="form.answerAttachGrpId" @update:model-value="form.answerAttachGrpId = $event"
      :ref-id="cfAttachRefId" :show-toast="showToast" :readonly="cfDtlMode"
      grp-code="FAQ_ANSWER_ATTACH" grp-nm="FAQ 답변 첨부파일"
      :max-count="5" :max-size-mb="10" allow-ext="jpg,png,gif,pdf,xlsx,docx" />
  </div>
  <!-- ===== ■.■. 폼 액션 (행 선택/신규 시에만 노출) ============================ -->
  <div class="form-actions" v-if="active">
    <template v-if="cfDtlMode">
      <button class="btn btn_edit"  @click="handleBtnAction('form-edit')">수정</button>
      <button class="btn btn_close" @click="handleBtnAction('form-close')">닫기</button>
    </template>
    <template v-else>
      <button class="btn btn_save"   @click="handleBtnAction('form-save')">저장</button>
      <button class="btn btn_cancel" @click="handleBtnAction('form-cancel')">취소</button>
    </template>
  </div>
  <!-- ===== ■. 표시경로 선택 모달 ============================================== -->
  <path-pick-modal v-if="pathPickModal.show" biz-cd="cm_faq"
    :value="form.pathId"
    title="FAQ 분류(표시경로) 선택" modal-name="path-pick" :on-callback="fnCallbackModal" />
</bo-container>
`
};
