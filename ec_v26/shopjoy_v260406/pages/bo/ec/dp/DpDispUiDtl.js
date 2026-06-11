/* ShopJoy Admin - 전시UI 상세/등록 (dp_ui)
 * 2026-06-11 구조개선 재작성 — CmNoticeDtl 표준 + 하위 영역 목록(dp_area.ui_id) 표시
 */
window.DpDispUiDtl = {
  name: 'DpDispUiDtl',
  props: {
    navigate:      { type: Function, required: true }, // 페이지 이동
    dtlId:         { type: String, default: null },    // 수정 대상 ID
    dtlMode:       { type: String, default: 'view' },  // 상세 모드 (new/view/edit)
    active:        { type: Boolean, default: true },   // false=행 미선택 빈 폼(버튼 숨김)
    reloadTrigger: { type: Number, default: 0 },       // 상위 reload signal
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, onMounted, watch } = Vue;
    const { showToast, showConfirm } = window.boApp;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ device_types: [], use_yn: [{ value: 'Y', label: '사용' }, { value: 'N', label: '미사용' }] });
    const areas = reactive([]);                       // 하위 영역 목록 (dp_area.ui_id = dtlId)

    const baseForm = reactive({
      uiId: null, uiCd: '', uiNm: '', uiDesc: '', deviceTypeCd: '',
      pathId: null, sortOrd: 1, useYn: 'Y', useStartDate: '', useEndDate: '',
    });
    const errors = reactive({});
    const schema = yup.object({
      uiCd: yup.string().required('UI코드를 입력해주세요.'),
      uiNm: yup.string().required('UI명을 입력해주세요.'),
    });
    const pathPickModal = reactive({ show: false });

    const cfIsNew    = computed(() => props.dtlId == null);
    const cfReadonly = computed(() => props.dtlMode === 'view');

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd) => {
      if (cmd === 'baseForm-save')   return handleSave();
      if (cmd === 'baseForm-cancel') return props.navigate('__cancelEdit__');
      if (cmd === 'baseForm-edit')   return props.navigate('__switchToEdit__');
      if (cmd === 'baseForm-close')  return props.navigate('__cancelEdit__');
      if (cmd === 'pathModal-open')  { pathPickModal.show = true; return; }
      if (cmd === 'areas-goAreaMng') return props.navigate('dpDispAreaMng');
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* fnCallbackModal — 모달 통합 콜백 (표시경로 선택) */
    const fnCallbackModal = (cmd, param, result) => {
      if (cmd === 'path-pick') {
        if (result != null) baseForm.pathId = result;
        pathPickModal.show = false;
        return;
      }
      console.warn('[fnCallbackModal] unknown cmd:', cmd);
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const s = window.sfGetBoCodeStore();
      codes.device_types = s.sgGetGrpCodes('DEVICE_TYPE');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      await handleSearchDetail();
    });

    watch(() => props.reloadTrigger, (n, o) => {
      if (n === o || n === 0) return;
      Object.keys(errors).forEach(k => delete errors[k]);
      handleSearchDetail();
    });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ###################### */

    /* handleSearchDetail — 상세 + 하위 영역 조회 */
    const handleSearchDetail = async () => {
      if (cfIsNew.value) return;
      try {
        const [uiRes, areaRes] = await Promise.all([
          boApiSvc.dpUi.getById(props.dtlId, '전시UI관리', '상세조회'),
          boApiSvc.dpArea.getPage({ uiId: props.dtlId, pageNo: 1, pageSize: 1000 }, '전시UI관리', '영역조회'),
        ]);
        const u = uiRes.data?.data;
        if (u) Object.assign(baseForm, u);
        areas.splice(0, areas.length, ...(areaRes.data?.data?.pageList || []));
      } catch (err) {
        console.error('[handleSearchDetail]', err);
      }
    };

    /* handleSave — 저장 (신규 등록 / 수정) */
    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(baseForm, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const isNew = cfIsNew.value;
      if (!(await showConfirm(isNew ? '등록' : '저장', isNew ? '등록하시겠습니까?' : '저장하시겠습니까?'))) return;
      try {
        const body = { ...baseForm };
        if (!body.useStartDate) delete body.useStartDate;
        if (!body.useEndDate)   delete body.useEndDate;
        await (isNew
          ? boApiSvc.dpUi.create(body, '전시UI관리', '등록')
          : boApiSvc.dpUi.update(props.dtlId, body, '전시UI관리', '저장'));
        showToast(isNew ? '등록되었습니다.' : '저장되었습니다.', 'success');
        props.navigate('dpDispUiMng', { reload: true });
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 컬럼정의) #################################### */

    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    const columns = {};
    columns.baseForm = [
      { key: 'uiCd',         label: 'UI코드',    type: 'text',   required: true, mono: true, placeholder: 'PC_MAIN' },
      { key: 'uiNm',         label: 'UI명',      type: 'text',   required: true, placeholder: 'PC 메인' },
      { key: 'deviceTypeCd', label: '디바이스',  type: 'select', options: () => codes.device_types, nullLabel: '선택' },
      { key: 'pathId',       label: '표시경로',  type: 'pathPick',
        pathLabel: (id) => pathLabel(id),
        onOpen: () => handleBtnAction('pathModal-open') },
      { key: 'sortOrd',      label: '정렬순서',  type: 'number', min: 1 },
      { key: 'useYn',        label: '사용여부',  type: 'select', options: () => codes.use_yn },
      { key: 'useStartDate', label: '사용시작일', type: 'date' },
      { key: 'useEndDate',   label: '사용종료일', type: 'date' },
      { key: 'uiDesc',       label: 'UI설명',    type: 'textarea', colSpan: 2, placeholder: 'UI 설명' },
    ];

    columns.areasGrid = [
      { key: 'areaCd',       label: '영역코드', style: 'width:140px;', mono: true },
      { key: 'areaNm',       label: '영역명' },
      { key: 'areaTypeCd',   label: '영역유형', style: 'width:100px;', badge: () => 'badge-blue' },
      { key: 'pathId',       label: '표시경로', style: 'width:160px;', fmt: (v) => pathLabel(v) || '-' },
      { key: 'useYn',        label: '사용',     style: 'width:70px;',
        badge: (row) => row.useYn === 'Y' ? 'badge-green' : 'badge-gray', fmt: (v) => v === 'Y' ? '사용' : '미사용' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, codes, baseForm, errors, areas, pathPickModal,
      handleBtnAction, fnCallbackModal,
      cfIsNew, cfReadonly,
    };
  },
  template: /* html */`
<bo-container :title="!active ? '전시UI 상세' : (cfIsNew ? '전시UI 등록' : (cfReadonly ? '전시UI 상세' : '전시UI 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : baseForm.uiId)">
  <!-- ===== ■. 폼 영역 ===================================================== -->
  <bo-form-area :columns="columns.baseForm" :form="baseForm" :errors="errors"
    :readonly="cfReadonly" :cols="2" compact :show-actions="false" />
  <!-- ===== ■. 하위 영역 목록 (수정 시에만) =================================== -->
  <div v-if="!cfIsNew" style="margin-top:14px;">
    <div class="toolbar">
      <span class="list-title">소속 영역</span>
      <span class="list-count">{{ areas.length }}개</span>
      <div style="margin-left:auto;">
        <button class="btn btn_detail" @click="handleBtnAction('areas-goAreaMng')">전시영역관리로 이동</button>
      </div>
    </div>
    <bo-grid bare :columns="columns.areasGrid" :rows="areas" row-key="areaId" empty-text="소속 영역이 없습니다. 전시영역관리에서 등록하세요." />
  </div>
  <!-- ===== ■. 폼 액션 ===================================================== -->
  <div class="form-actions" v-if="active">
    <template v-if="cfReadonly">
      <button class="btn btn_edit"  @click="handleBtnAction('baseForm-edit')">수정</button>
      <button class="btn btn_close" @click="handleBtnAction('baseForm-close')">닫기</button>
    </template>
    <template v-else>
      <button class="btn btn_save"   @click="handleBtnAction('baseForm-save')">저장</button>
      <button class="btn btn_cancel" @click="handleBtnAction('baseForm-cancel')">취소</button>
    </template>
  </div>
  <!-- ===== ■. 표시경로 선택 모달 ============================================ -->
  <path-pick-modal v-if="pathPickModal.show" biz-cd="ec_disp_ui"
    :value="baseForm.pathId"
    title="전시UI 표시경로 선택" modal-name="path-pick" :on-callback="fnCallbackModal" />
</bo-container>
`,
};
