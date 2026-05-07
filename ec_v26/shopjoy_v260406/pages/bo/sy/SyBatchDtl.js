/* ShopJoy Admin - 배치스케즐 상세/등록 */
window.SyBatchDtl = {
  name: 'SyBatchDtl',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
    dtlId:       { type: String, default: null }, // 수정 대상 ID
    tabMode:     { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:     { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} }, // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    const { reactive, computed, watch, onMounted, ref } = Vue;
    const showToast    = window.boApp.showToast;
    const showConfirm  = window.boApp.showConfirm;
    const showRefModal = window.boApp.showRefModal;
    const setApiRes    = window.boApp.setApiRes;

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ active_statuses: [] });

    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.active_statuses = codeStore.sgGetGrpCodes('ACTIVE_STATUS');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
      uiState.isPageCodeLoad = true;
    };

    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);

    // ── watch ────────────────────────────────────────────────────────────────


    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfSiteNm = computed(() => boUtil.getSiteNm());
    const form = reactive({
      batchId: null, batchNm: '', batchCode: '', description: '', cron: '0 0 * * *', statusCd: '활성',
    });
    const errors = reactive({});

    const schema = yup.object({
      batchNm: yup.string().required('배치명을 입력해주세요.'),
      batchCode: yup.string().required('배치코드를 입력해주세요.'),
      cron: yup.string().required('Cron 표현식을 입력해주세요.'),
    });

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

    const CRON_PRESETS = [
      { label: '매일 자정 (0 0 * * *)', value: '0 0 * * *' },
      { label: '매일 오전 1시 (0 1 * * *)', value: '0 1 * * *' },
      { label: '매일 오전 2시 (0 2 * * *)', value: '0 2 * * *' },
      { label: '매시간 (0 * * * *)', value: '0 * * * *' },
      { label: '2시간마다 (0 */2 * * *)', value: '0 */2 * * *' },
      { label: '매주 일요일 자정 (0 0 * * 0)', value: '0 0 * * 0' },
      { label: '매월 1일 오전 8시 (0 8 1 * *)', value: '0 8 1 * *' },
    ];

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

    // ── return ───────────────────────────────────────────────────────────────

    return { uiState, codes, cfIsNew, form, errors, handleSave, CRON_PRESETS, cfSiteNm, cfDtlMode };
  },
  template: /* html */`
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="page-title">{{ cfIsNew ? '배치 등록' : (cfDtlMode ? '배치 상세' : '배치 수정') }}</div><span v-if="!cfIsNew" style="font-size:12px;color:#999;">#{{ form.batchId }}</span></div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ cfSiteNm }}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">배치명 <span v-if="!cfDtlMode" class="req">*</span></label>
        <input class="form-control" v-model="form.batchNm" placeholder="배치 이름" :readonly="cfDtlMode" :class="errors.batchNm ? 'is-invalid' : ''" />
        <span v-if="errors.batchNm" class="field-error">{{ errors.batchNm }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">배치코드 <span v-if="!cfDtlMode" class="req">*</span></label>
        <input class="form-control" v-model="form.batchCode" placeholder="ORDER_AUTO_COMPLETE" style="text-transform:uppercase;" :readonly="cfDtlMode" :class="errors.batchCode ? 'is-invalid' : ''" />
        <span v-if="errors.batchCode" class="field-error">{{ errors.batchCode }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">설명</label>
        <input class="form-control" v-model="form.description" placeholder="배치 처리 내용 설명" :readonly="cfDtlMode" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">Cron 표현식 <span v-if="!cfDtlMode" class="req">*</span>
          <span style="font-size:11px;color:#888;margin-left:8px;">분 시 일 월 요일</span>
        </label>
        <input class="form-control" v-model="form.cron" placeholder="0 0 * * *" :readonly="cfDtlMode" :class="errors.cron ? 'is-invalid' : ''" />
        <span v-if="errors.cron" class="field-error">{{ errors.cron }}</span>
      </div>
    </div>
    <div v-if="!cfDtlMode" style="margin-bottom:16px;padding:10px 12px;background:#f8f9fa;border-radius:6px;">
      <div style="font-size:12px;color:#666;margin-bottom:8px;font-weight:600;">Cron 프리셋</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        <button v-for="p in CRON_PRESETS" :key="p.value"
          class="btn btn-secondary btn-sm"
          style="font-size:11px;"
          @click="form.cron = p.value">{{ p.label }}</button>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">활성여부</label>
        <select class="form-control" v-model="form.statusCd" :disabled="cfDtlMode">
          <option v-for="c in codes.active_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
    </div>
    <div class="form-actions" v-if="!cfDtlMode">
      <template v-if="cfDtlMode">
        <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
        <button class="btn btn-secondary" @click="navigate('syBatchMng')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click="handleSave">저장</button>
        <button class="btn btn-secondary" @click="navigate('syBatchMng')">취소</button>
      </template>
    </div>
  </div>
</div>
`
};
