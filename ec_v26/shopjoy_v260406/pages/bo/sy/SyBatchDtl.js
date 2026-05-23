/* ShopJoy Admin - 배치스케즐 상세/등록 */
window.SyBatchDtl = {
  name: 'SyBatchDtl',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
    dtlId:       { type: String, default: null }, // 수정 대상 ID
    tabMode:     { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:     { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    const { reactive, computed, watch, onMounted, ref } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ active_statuses: [] });

    /* 배치 fnLoadCodes */
    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.active_statuses = codeStore.sgGetGrpCodes('ACTIVE_STATUS');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
      uiState.isPageCodeLoad = true;
    };

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ── watch ────────────────────────────────────────────────────────────────


    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const form = reactive({
      batchId: null, batchNm: '', batchCode: '', batchDesc: '', cronExpr: '0 0 * * *', batchStatusCd: '활성',
    });
    const errors = reactive({});

    const schema = yup.object({
      batchNm: yup.string().required('배치명을 입력해주세요.'),
      batchCode: yup.string().required('배치코드를 입력해주세요.'),
      cronExpr: yup.string().required('Cron 표현식을 입력해주세요.'),
    });

    /* 배치 상세조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.syBatch.getById(props.dtlId, '배치관리', '상세조회');
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

    const CRON_PRESETS = [
      { label: '매일 자정 (0 0 * * *)', value: '0 0 * * *' },
      { label: '매일 오전 1시 (0 1 * * *)', value: '0 1 * * *' },
      { label: '매일 오전 2시 (0 2 * * *)', value: '0 2 * * *' },
      { label: '매시간 (0 * * * *)', value: '0 * * * *' },
      { label: '2시간마다 (0 */2 * * *)', value: '0 */2 * * *' },
      { label: '매주 일요일 자정 (0 0 * * 0)', value: '0 0 * * 0' },
      { label: '매월 1일 오전 8시 (0 8 1 * *)', value: '0 8 1 * *' },
    ];

    /* 배치 저장 */
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
        const res = await (cfIsNew.value ? boApiSvc.syBatch.create({ ...form }, '배치관리', '등록') : boApiSvc.syBatch.update(form.batchId, { ...form }, '배치관리', '저장'));
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('syBatchMng', { reload: true });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    // ===== 폼 컬럼 정의 (BoFormArea :columns) ================================
    const baseFormColumns = [
      { key: 'siteNm',        label: '사이트명', type: 'readonly', fmt: () => cfSiteNm.value, colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'batchNm',       label: '배치명', type: 'text', required: true, placeholder: '배치 이름' },
      { key: 'batchCode',     label: '배치코드', type: 'text', required: true,
        placeholder: 'ORDER_AUTO_COMPLETE', mono: true },
      { type: 'rowBreak' },
      { key: 'batchDesc',     label: '설명', type: 'text', placeholder: '배치 처리 내용 설명', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'cronExpr',      label: 'Cron 표현식', type: 'text', required: true,
        placeholder: '0 0 * * *', mono: true, hint: '분 시 일 월 요일', colSpan: 2 },
      { type: 'rowBreak' },
      { key: '_cronPreset',   label: 'Cron 프리셋', type: 'slot', name: 'cronPreset',
        colSpan: 2, visible: () => !cfDtlMode.value },
      { type: 'rowBreak' },
      { key: 'batchStatusCd', label: '활성여부', type: 'select', options: () => codes.active_statuses },
    ];

    // ===== setup() return ===================================================
    return { uiState, codes, cfIsNew, form, errors, handleSave, CRON_PRESETS, cfSiteNm, cfDtlMode, baseFormColumns };
  },
  template: /* html */`
<div>
  <div class="page-title">
    {{ cfIsNew ? '배치 등록' : (cfDtlMode ? '배치 상세' : '배치 수정') }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.batchId }}</span>
  </div>
  <!-- 폼 영역 (BoFormArea 자동 렌더) -->
  <div class="card">
    <bo-form-area :columns="baseFormColumns" :form="form" :errors="errors"
      :readonly="cfDtlMode" :cols="2"
      @save="handleSave"
      @cancel="navigate('syBatchMng')"
      @edit="navigate('__switchToEdit__')"
      @close="navigate('syBatchMng')">
      <template #cronPreset>
        <div style="padding:10px 12px;background:#f8f9fa;border-radius:6px;">
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            <button v-for="p in CRON_PRESETS" :key="p.value"
              class="btn btn-secondary btn-sm"
              style="font-size:11px;"
              @click="form.cronExpr = p.value">
              {{ p.label }}
            </button>
          </div>
        </div>
      </template>
    </bo-form-area>
  </div>
</div>
`
};
