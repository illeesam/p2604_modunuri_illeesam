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

    const modals = reactive({ isPathPickModal: false });
    const uiState = reactive({ loading: false, error: null });
    const codes = reactive({ use_yn: [] });

    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDtlMode = computed(() => props.dtlMode === 'view'); // view=읽기전용
    // 첨부 ref-id: 신규는 빈값(저장 후 부여), 기존은 FAQ-{faqId}
    const cfAttachRefId = computed(() => props.dtlId ? ('FAQ-' + props.dtlId) : '');
    /* attachGrpRef — pendingChanges(추가/삭제 변경 목록)를 create/update 요청에 attachChanges 로 담아 보내기 위한 template ref.
       실제 sy_attach 반영은 백엔드(CmFaqService.create/update)가 같은 트랜잭션에서 원자적으로 처리한다. */
    const attachGrpRef = ref(null);

    const form = reactive({
      faqId: null, pathId: null, faqQuestion: '', faqAnswer: '',
      sortOrd: '', useYn: '',
    });
    // 신규 진입 시에만 채울 기본값
    const _applyNewDefaults = () => {
      Object.assign(form, { sortOrd: 1, useYn: 'Y' });
    };
    const errors = reactive({});

    /* ── 표시경로 모달 ── */

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
        modals.isPathPickModal = true;
        return;
      } else if (cmd === 'pathModal-close') {
        modals.isPathPickModal = false;
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
        modals.isPathPickModal = false;
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* fnCallbackModal — 모달 통합 dispatch */
    const fnCallbackModal = (popCmd, param, result) => {
      console.log(' ■■ CmFaqDtl : fnCallbackModal -> ', popCmd, param, result);
      if (popCmd === 'cmPopup-path-pick') {
        if (result == null) { modals.isPathPickModal = false; return; }
        form.pathId = result;
        modals.isPathPickModal = false;
        return;
      } else {
        console.warn('[fnCallbackModal] unknown popCmd:', popCmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* pathLabel — 경로 라벨 */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
        await codeStore.saLoadCodes(['USE_YN'], {compNm: 'CmFaqDtl'});
        codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };


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
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      if (!cfIsNew.value) { await handleLoadDetail(); }
      if (props.active && cfIsNew.value) { _applyNewDefaults(); }
    };
    onMounted(initPage);
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
        // 첨부파일 추가/삭제 변경 목록을 함께 전송 — 백엔드(CmFaqService.create/update)가
        // faqId 확정 직후 같은 트랜잭션에서 sy_attach 에 반영한다.
        const attachChanges = attachGrpRef.value?.pendingChanges || [];
        await (cfIsNew.value ? boApiSvc.cmFaq.create({ ...form, attachChanges }, 'FAQ관리', '등록') : boApiSvc.cmFaq.update(form.faqId, { ...form, attachChanges }, 'FAQ관리', '저장'));
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
      { key: 'faqAnswer',        label: '답변',          type: 'slot', name: 'answer',    colSpan: 3 },
      { key: 'answerAttachFiles', label: '답변 첨부파일', type: 'slot', name: 'attachGrp', colSpan: 3 },
      { key: 'sortOrd',          label: '정렬순서',       type: 'number', min: 1 },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {

      modals,   // 모달 표시 상태 모음
      columns,
      form, errors, handleBtnAction, handleSelectAction, fnCallbackModal,
      cfIsNew, cfDtlMode, cfAttachRefId, attachGrpRef,
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
    <template #attachGrp>
      <base-attach-grp ref="attachGrpRef" ref-table-nm="cm_faq" :ref-key-id="dtlId"
        :ref-id="cfAttachRefId" :show-toast="showToast" :readonly="cfDtlMode"
        grp-code="FAQ_ANSWER_ATTACH" grp-nm="FAQ 답변 첨부파일"
        :max-count="5" :max-size-mb="10" allow-ext="jpg,png,gif,pdf,xlsx,docx" />
    </template>
  </bo-form-area>
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
  <bo-cm-popup-modal v-if="modals.isPathPickModal" popup-cmd="cmPopup-path-pick" popup-code="path" result-type="id" :init-param="{ bizCd: 'cm_faq' }" title="FAQ 분류(표시경로) 선택" :on-callback="fnCallbackModal" />
</bo-container>
`
};
