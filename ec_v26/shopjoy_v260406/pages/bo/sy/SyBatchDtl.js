/* ShopJoy Admin - 배치스케즐 상세/등록 */
window.SyBatchDtl = {
  name: 'SyBatchDtl',
  props: {
    navigate:      { type: Function, required: true },        // 페이지 이동
    dtlId:         { type: String, default: null },           // 수정 대상 ID
    dtlMode:       { type: String, default: 'view' },         // 상세 모드 (new/view/edit)
    reloadTrigger: { type: Number, default: 0 },              // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    // ===== [01] 초기 변수 정의 ====================================================
    const { reactive, computed, watch, onMounted, ref } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false }); // UI 상태
    const codes = reactive({ active_statuses: [] });

    const form = reactive({                        // 배치 폼 데이터
      batchId: null, batchNm: '', batchCode: '', batchDesc: '', cronExpr: '0 0 * * *', batchStatusCd: '활성',
    });
    const errors = reactive({});                   // 폼 검증 에러

    const schema = yup.object({                    // 폼 검증 스키마
      batchNm: yup.string().required('배치명을 입력해주세요.'),
      batchCode: yup.string().required('배치코드를 입력해주세요.'),
      cronExpr: yup.string().required('Cron 표현식을 입력해주세요.'),
    });

    const CRON_PRESETS = [                         // Cron 프리셋 (편집 모드에서 노출)
      { label: '매일 자정 (0 0 * * *)', value: '0 0 * * *' },
      { label: '매일 오전 1시 (0 1 * * *)', value: '0 1 * * *' },
      { label: '매일 오전 2시 (0 2 * * *)', value: '0 2 * * *' },
      { label: '매시간 (0 * * * *)', value: '0 * * * *' },
      { label: '2시간마다 (0 */2 * * *)', value: '0 */2 * * *' },
      { label: '매주 일요일 자정 (0 0 * * 0)', value: '0 0 * * 0' },
      { label: '매월 1일 오전 8시 (0 8 1 * *)', value: '0 8 1 * *' },
    ];

    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDtlMode = computed(() => props.dtlMode === 'view'); // dtlMode: 'view' 이면 읽기전용, 'new'/'edit' 이면 편집

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyBatchDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장 (신규 등록 또는 수정)
      if (cmd === 'form-save') {
        return handleSave();
      // 폼 편집 취소 → 목록으로 이동
      } else if (cmd === 'form-cancel') {
        return props.navigate('syBatchMng');
      // 상세 보기 → 편집 모드 전환
      } else if (cmd === 'form-edit') {
        return props.navigate('__switchToEdit__');
      // 폼 닫기 → 목록으로 이동
      } else if (cmd === 'form-close') {
        return props.navigate('syBatchMng');
      // Cron 프리셋 적용 (param 은 cron 문자열)
      } else if (cmd === 'cronPreset-apply') {
        form.cronExpr = param;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ====================

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.syBatch.getById(props.dtlId, '배치관리', '상세조회');
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

    /* handleSave — 저장 (신규 등록 / 수정) */
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
        const res = await (cfIsNew.value
          ? boApiSvc.syBatch.create({ ...form }, '배치관리', '등록')
          : boApiSvc.syBatch.update(form.batchId, { ...form }, '배치관리', '저장'));
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('syBatchMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
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

    // ★ onMounted — 진입 시 코드 로드 + 상세 조회
    onMounted(async () => {
      if (isAppReady.value) { fnLoadCodes(); }
      if (!cfIsNew.value) { await handleLoadDetail(); }
    });

    /* policy: 상위 Mng 이 reloadTrigger 증가시키면 상세 API 재조회 */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleLoadDetail();
    });

    // ===== [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ====================

    const baseFormColumns = [
      { key: '_siteNm',       label: '사이트명', type: 'readonly', fmt: () => cfSiteNm.value, colSpan: 2 },
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

    // ===== [06] return (템플릿 노출) ==============================================

    return {
      uiState, codes, form, errors, CRON_PRESETS,           // 상태 / 데이터
      baseFormColumns,                                       // 컬럼 정의
      handleBtnAction,                                       // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfSiteNm, cfDtlMode,                          // computed
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    {{ cfIsNew ? '배치 등록' : (cfDtlMode ? '배치 상세' : '배치 수정') }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">
      #{{ form.batchId }}
    </span>
  </div>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 폼 영역 (BoFormArea 자동 렌더) ================================= -->
  <div class="card">
    <!-- ===== ■.■. 폼 영역 ================================================== -->
    <bo-form-area :columns="baseFormColumns" :form="form" :errors="errors"
      :readonly="cfDtlMode" :cols="2"
      @save="handleBtnAction('form-save')"
      @cancel="handleBtnAction('form-cancel')"
      @edit="handleBtnAction('form-edit')"
      @close="handleBtnAction('form-close')">
      <!-- ===== ■.■.■. Cron 프리셋 버튼 그룹 (편집 모드에서만 노출) =================== -->
      <template #cronPreset>
        <div style="padding:10px 12px;background:#f8f9fa;border-radius:6px;">
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            <button v-for="p in CRON_PRESETS" :key="p.value"
              class="btn btn-secondary btn-sm"
              style="font-size:11px;"
              @click="handleBtnAction('cronPreset-apply', p.value)">
              {{ p.label }}
            </button>
          </div>
        </div>
      </template>
    </bo-form-area>
  </div>
  <!-- ===== □. 폼 영역 ==================================================== -->
</div>
`,
};
