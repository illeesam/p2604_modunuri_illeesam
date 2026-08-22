/* ShopJoy Admin - 전시영역 상세/등록 (dp_area)
 * 2026-06-11 구조개선 재작성 — CmNoticeDtl 표준 + 상위 UI 선택 + 소속 패널 목록(dp_panel.area_id) 표시
 */
window.DpDispAreaDtl = {
  name: 'DpDispAreaDtl',
  props: {
    navigate:      { type: Function, required: true }, // 페이지 이동
    dtlId:         { type: String, default: null },    // 수정 대상 ID
    dtlMode:       { type: String, default: 'view' },  // 상세 모드 (new/view/edit)
    active:        { type: Boolean, default: true },   // false=행 미선택 빈 폼(버튼 숨김)
    reloadTrigger: { type: Number, default: 0 },       // 상위 reload signal
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const { showToast, showConfirm } = window.boApp;
    const modals = reactive({ isPathPickModal: false });
    const uiState = reactive({ loading: false, error: null });
    const codes = reactive({ area_types: [], use_yn: [{ value: 'Y', label: '사용' }, { value: 'N', label: '미사용' }] });
    const uis = reactive([]);                         // 상위 UI 목록 (select)
    const panels = reactive([]);                      // 소속 패널 목록 (dp_panel.area_id = dtlId)

    const baseForm = reactive({
      areaId: null, uiId: '', areaCd: '', areaNm: '', areaTypeCd: '', areaDesc: '',
      pathId: null, useYn: 'Y', useStartDate: '', useEndDate: '',
    });
    const errors = reactive({});
    const schema = yup.object({
      uiId: yup.string().required('소속 UI를 선택해주세요.'),
      areaCd: yup.string().required('영역코드를 입력해주세요.'),
      areaNm: yup.string().required('영역명을 입력해주세요.'),
    });

    const cfIsNew    = computed(() => props.dtlId == null);
    const cfReadonly = computed(() => props.dtlMode === 'view');

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd) => {
      if (cmd === 'baseForm-save')     return handleSave();
      if (cmd === 'baseForm-cancel')   return props.navigate('__cancelEdit__');
      if (cmd === 'baseForm-edit')     return props.navigate('__switchToEdit__');
      if (cmd === 'baseForm-close')    return props.navigate('__closeDtl__');
      if (cmd === 'baseForm-delete')   return handleDelete();
      if (cmd === 'pathModal-open')    { modals.isPathPickModal = true; return; }
      if (cmd === 'panels-goPanelMng') return props.navigate('dpDispPanelMng');
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* fnCallbackModal — 모달 통합 콜백 (표시경로 선택) */
    const fnCallbackModal = (popCmd, param, result) => {
      if (popCmd === 'cmPopup-path-pick') {
        if (result != null) baseForm.pathId = result;
        modals.isPathPickModal = false;
        return;
      }
      console.warn('[fnCallbackModal] unknown popCmd:', popCmd);
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const s = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await s.saLoadCodes(['AREA_TYPE_CD'], {compNm: 'DpDispAreaDtl'});
      codes.area_types = s.sgGetGrpCodes('AREA_TYPE_CD');
    };

    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      await handleLoadUis();
      await handleSearchDetail();
    };
    onMounted(initPage);

    watch(() => props.reloadTrigger, (n, o) => {
      if (n === o || n === 0) return;
      Object.keys(errors).forEach(k => delete errors[k]);
      handleSearchDetail();
    });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ###################### */

    /* handleLoadUis — 상위 UI 전체 로드 */
    const handleLoadUis = async () => {
      try {
        const d = (await boApiSvc.dpUi.getPage({ pageNo: 1, pageSize: 1000 }, '전시영역관리', 'UI조회')).data?.data;
        uis.splice(0, uis.length, ...(d?.pageList || []));
      } catch (err) {
        console.error('[handleLoadUis]', err);
      }
    };

    /* handleSearchDetail — 상세 + 소속 패널 조회 (getById 는 영역만 반환 → 패널은 별도 getPage) */
    const handleSearchDetail = async () => {
      if (cfIsNew.value) return;
      try {
        const [areaRes, panelRes] = await Promise.all([
          boApiSvc.dpArea.getById(props.dtlId, '전시영역관리', '상세조회'),
          boApiSvc.dpPanel.getPage({ areaId: props.dtlId, pageNo: 1, pageSize: 1000 }, '전시영역관리', '패널조회'),
        ]);
        const data = areaRes.data?.data || {};
        Object.assign(baseForm, data);
        panels.splice(0, panels.length, ...(panelRes.data?.data?.pageList || []));
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
        delete body.panels;
        if (!body.useStartDate) delete body.useStartDate;
        if (!body.useEndDate)   delete body.useEndDate;
        await (isNew
          ? boApiSvc.dpArea.create(body, '전시영역관리', '등록')
          : boApiSvc.dpArea.update(props.dtlId, body, '전시영역관리', '저장'));
        showToast(isNew ? '등록되었습니다.' : '저장되었습니다.', 'success');
        props.navigate('dpDispAreaMng', { reload: true });
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* handleDelete — 삭제 */
    const handleDelete = async () => {
      if (cfIsNew.value) { return; }
      const ok = await showConfirm('삭제', '삭제하시겠습니까?');
      if (!ok) { return; }
      try {
        await boApiSvc.dpArea.remove(baseForm.areaId, '전시영역관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        props.navigate('dpDispAreaMng', { reload: true });
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 컬럼정의) #################################### */

    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    const columns = {};
    columns.baseForm = [
      { key: 'uiId',         label: '소속 UI',   type: 'select', required: true,
        options: () => uis.map(u => ({ value: u.uiId, label: u.uiNm })), nullLabel: '선택' },
      { key: 'areaCd',       label: '영역코드',  type: 'text',   required: true, mono: true, placeholder: 'MAIN_TOP' },
      { key: 'areaNm',       label: '영역명',    type: 'text',   required: true, placeholder: '메인 톱배너' },
      { key: 'areaTypeCd',   label: '영역유형',  type: 'select', options: () => codes.area_types, nullLabel: '선택' },
      { key: 'pathId',       label: '표시경로',  type: 'pathPick',
        pathLabel: (id) => pathLabel(id),
        onOpen: () => handleBtnAction('pathModal-open') },
      { key: 'useYn',        label: '사용여부',  type: 'select', options: () => codes.use_yn },
      { key: 'useStartDate', label: '사용시작일', type: 'date' },
      { key: 'useEndDate',   label: '사용종료일', type: 'date' },
      { key: 'areaDesc',     label: '영역설명',  type: 'textarea', colSpan: 2, placeholder: '영역 설명' },
    ];

    columns.panelsGrid = [
      { key: 'panelNm',           label: '패널명' },
      { key: 'panelTypeCd',       label: '표시유형', style: 'width:110px;', badge: () => 'badge-blue' },
      { key: 'dispPanelStatusCd', label: '상태',     style: 'width:80px;',
        badge: (row) => row.dispPanelStatusCd === 'SHOW' ? 'badge-green' : 'badge-gray' },
      { key: 'useYn',             label: '사용',     style: 'width:70px;',
        badge: (row) => row.useYn === 'Y' ? 'badge-green' : 'badge-gray', fmt: (v) => v === 'Y' ? '사용' : '미사용' },
      { key: 'regDate',           label: '등록일',   style: 'width:110px;', fmt: (v) => coUtil.cofYmd(v) || '-' },
    ];

    /* fnShareUrl — 이 전시영역 상세를 가리키는 독립 새창 딥링크 URL 생성 */
    const fnShareUrl = () => {
      const qs = new URLSearchParams();
      qs.set('page', 'dpDispAreaDtl');
      qs.set('id', baseForm.areaId);
      qs.set('embed', '1');
      return `${window.location.origin}${window.location.pathname}?${qs.toString()}`;
    };
    /* handleShareKakao — 카카오톡 공유(피드 카드, 상세보기 모드 전용) */
    const handleShareKakao = () => {
      try {
        window.coExtSdk.shareKakao({
          title: `전시영역 ${baseForm.areaId} - ShopJoy BO`,
          description: baseForm.areaDesc || baseForm.areaNm || '',
          imageUrl: window.location.origin + '/assets/img/shopjoy-share-og.png',
          url: fnShareUrl(),
        });
      } catch (e) {
        showToast(e.message || '카카오톡 공유를 열 수 없습니다.', 'error', 0);
      }
    };
    /* handleCopyLink — 순수 URL만 클립보드에 복사 (카카오톡 카드 없음) */
    const handleCopyLink = async () => {
      try {
        await navigator.clipboard.writeText(fnShareUrl());
        showToast('링크가 복사되었습니다.', 'success');
      } catch (e) {
        showToast(e.message || '링크 복사에 실패했습니다.', 'error', 0);
      }
    };
    /* pdfAreaRef — 전시영역 상세 카드 캡처 대상. handleExportPdf — PDF 다운로드(상세보기 모드 전용) */
    const pdfAreaRef = ref(null);
    const pdfExporting = ref(false);
    const handleExportPdf = async () => {
      pdfExporting.value = true;
      try {
        const filename = coUtil.cofBuildExportFilename(`전시영역상세_${baseForm.areaId}.pdf`);
        await window.boUtil.bofExportPdf(pdfAreaRef.value, filename, showToast);
      } finally {
        pdfExporting.value = false;
      }
    };

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {

      modals,   // 모달 표시 상태 모음
      columns,
      uiState, codes, baseForm, errors, uis, panels, handleBtnAction, fnCallbackModal,
      cfIsNew, cfReadonly,
      handleShareKakao, handleCopyLink, pdfAreaRef, pdfExporting, handleExportPdf,
    };
  },
  template: /* html */`
<div ref="pdfAreaRef">
<bo-container :title="!active ? '전시영역 상세' : (cfIsNew ? '전시영역 등록' : (cfReadonly ? '전시영역 상세' : '전시영역 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : baseForm.areaId)">
  <template #toolbar-actions>
    <button v-if="active ? (cfReadonly ? !cfIsNew : false) : false" class="btn btn_link" title="링크 공유(URL만)" @click="handleCopyLink">🔗</button>
    <button v-if="active ? (cfReadonly ? !cfIsNew : false) : false" class="btn btn_kakao" title="카카오톡 공유" @click="handleShareKakao">💬</button>
    <button class="btn btn_pdf" title="PDF 다운로드" :disabled="pdfExporting" @click="handleExportPdf">
      <span v-if="pdfExporting">⏳</span>
      <svg v-else width="18" height="20" viewBox="0 0 32 36" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 2 H20 L28 10 V34 H4 Z" fill="#fff" stroke="#c2410c" stroke-width="1.5"/>
        <path d="M20 2 V10 H28 Z" fill="#f3d4c0"/>
        <rect x="2" y="20" width="28" height="12" rx="2" fill="#e2372c"/>
        <text x="16" y="29" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="#fff" text-anchor="middle">PDF</text>
      </svg>
    </button>
  </template>
  <!-- ===== ■. 폼 영역 ===================================================== -->
  <bo-form-area plain-readonly :columns="columns.baseForm" :form="baseForm" :errors="errors"
    :readonly="cfReadonly" :cols="2" compact :show-actions="active" :show-cancel="!cfIsNew" :show-delete="!cfIsNew"
    @save="handleBtnAction('baseForm-save')"
    @cancel="handleBtnAction('baseForm-cancel')"
    @edit="handleBtnAction('baseForm-edit')"
    @close="handleBtnAction('baseForm-close')"
    @delete="handleBtnAction('baseForm-delete')" />
  <!-- ===== ■. 소속 패널 목록 (수정 시에만) =================================== -->
  <div v-if="!cfIsNew" style="margin-top:14px;">
    <div class="toolbar">
      <span class="list-title">소속 패널</span>
      <span class="list-count">{{ panels.length }}개</span>
      <div style="margin-left:auto;">
        <button class="btn btn_detail" @click="handleBtnAction('panels-goPanelMng')">전시패널관리로 이동</button>
      </div>
    </div>
    <bo-grid bare :columns="columns.panelsGrid" :rows="panels" row-key="panelId" empty-text="소속 패널이 없습니다. 전시패널관리에서 등록하세요." />
  </div>
  <!-- ===== ■. 표시경로 선택 모달 ============================================ -->
  <bo-cm-popup-modal v-if="modals.isPathPickModal" popup-cmd="cmPopup-path-pick" popup-code="path" result-type="id" :init-param="{ bizCd: 'ec_disp_area' }" title="전시영역 표시경로 선택" :on-callback="fnCallbackModal" />
</bo-container>
</div>
`,
};
