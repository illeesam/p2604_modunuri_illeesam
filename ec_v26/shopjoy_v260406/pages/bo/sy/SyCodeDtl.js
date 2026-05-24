/* ShopJoy Admin - 공통코드 상세/등록 */
window.SyCodeDtl = {
  name: 'SyCodeDtl',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
    dtlId:       { type: String, default: null }, // 수정 대상 ID
    dtlMode:     { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { reactive, computed, watch, onMounted, ref } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    const pageCodes = reactive({ use_yn: [] });
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });

    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const form = reactive({
      codeId: null, codeGrp: '', codeLabel: '', codeValue: '', sortOrd: 1, useYn: 'Y', codeRemark: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      codeGrp: yup.string().required('코드그룹을 입력해주세요.'),
      codeLabel: yup.string().required('코드라벨을 입력해주세요.'),
      codeValue: yup.string().required('코드값을 입력해주세요.'),
    });

    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.syCode.getById(props.dtlId, '코드관리', '상세조회');
        const data = res.data?.data;
        if (data) Object.assign(form, data);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* fnLoadCodes — 공통코드 로드 */

    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        pageCodes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
      uiState.isPageCodeLoad = true;
    };

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 코드 로드 + 상세 조회
    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      if (!cfIsNew.value) await handleLoadDetail();
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) return;
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
      if (!ok) return;
      try {
        const res = await (cfIsNew.value ? boApiSvc.syCode.create({ ...form }, '코드관리', '등록') : boApiSvc.syCode.update(form.codeId, { ...form }, '코드관리', '저장'));
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('syCodeMng', { reload: true });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    // --- [컬럼 정의] ---

    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================

    const baseFormColumns = [
      { key: 'siteNm',    label: '사이트명', type: 'readonly', fmt: () => cfSiteNm.value, colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'codeGrp',   label: '코드그룹 (code_grp)',  type: 'text', required: true,
        placeholder: '예: ORDER_STATUS', mono: true },
      { key: 'codeLabel', label: '코드라벨 (code_label)', type: 'text', required: true,
        placeholder: '예: 주문완료' },
      { key: 'codeValue', label: '코드값 (code_value)',   type: 'text', required: true,
        placeholder: '예: ORDER_COMPLETE', mono: true },
      { key: 'sortOrd',   label: '정렬순서', type: 'number', min: 1 },
      { key: 'useYn',     label: '사용여부', type: 'select', options: () => pageCodes.use_yn },
      { key: 'codeRemark', label: '비고', type: 'text' },
    ];

    // ===== setup() return ===================================================

    // ===== return (템플릿 노출) ===============================================

    return { uiState, pageCodes, cfIsNew, form, errors, handleSave, cfSiteNm, cfDtlMode, baseFormColumns };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    {{ cfIsNew ? '공통코드 등록' : '공통코드 수정' }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.codeId }}</span>
  </div>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 폼 영역 (BoFormArea 자동 렌더) ================================= -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 폼 영역 ================================================== -->
    <bo-form-area :columns="baseFormColumns" :form="form" :errors="errors"
      :readonly="cfDtlMode" :cols="2"
      @save="handleSave"
      @cancel="navigate('syCodeMng')"
      @edit="navigate('__switchToEdit__')"
      @close="navigate('syCodeMng')" />
  </div>
</div>

    <!-- ===== □.□. 폼 영역 ================================================== -->
  <!-- ===== □. 카드 영역 =================================================== -->`
};
