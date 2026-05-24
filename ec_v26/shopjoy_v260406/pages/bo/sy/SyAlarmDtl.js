/* ShopJoy Admin - 알림관리 상세/등록 */
window.SyAlarmDtl = {
  name: 'SyAlarmDtl',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
    dtlId:       { type: String, default: null }, // 수정 대상 ID
    tabMode:     { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:     { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    // --- Vue API / boApp 전역 함수 참조 ---
    const { reactive, computed, watch, onMounted, ref } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    // --- 화면 상태 / 코드 (reactive) ---
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ alarm_types: [], alarm_statuses: [], alarm_target_types: [] });

    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.alarm_types = codeStore.sgGetGrpCodes('ALARM_TYPE');
        codes.alarm_statuses = codeStore.sgGetGrpCodes('ALARM_STATUS');
        codes.alarm_target_types = codeStore.sgGetGrpCodes('ALARM_TARGET_TYPE');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
      uiState.isPageCodeLoad = true;
    };

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // --- 폼 상태 / computed / 스키마 ---
    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const form = reactive({
      alarmId: null, alarmTitle: '', alarmTypeCd: '푸시', targetTypeCd: '전체', targetId: '',
      alarmMsg: '', alarmSendDate: '', alarmStatusCd: '임시',
    });
    const errors = reactive({});

    const schema = yup.object({
      alarmTitle: yup.string().required('제목을 입력해주세요.'),
      alarmMsg: yup.string().required('메시지를 입력해주세요.'),
    });

    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    // --- [데이터 로드] ---

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.syAlarm.getById(props.dtlId, '알람관리', '상세조회');
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

    // --- [라이프사이클] onMounted / reloadTrigger watch ---

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

    // --- [저장] ---

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
        const res = await (cfIsNew.value ? boApiSvc.syAlarm.create({ ...form }, '알람관리', '등록') : boApiSvc.syAlarm.update(form.alarmId, { ...form }, '알람관리', '저장'));
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('syAlarmMng', { reload: true });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================

    // --- [모드 / 헬퍼] ---

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    // --- [컬럼 정의] 폼 컬럼 정의 (BoFormArea :columns) ---
    const baseFormColumns = [
      { key: 'siteNm',        label: '사이트명', type: 'readonly', fmt: () => cfSiteNm.value, colSpan: 3 },
      { type: 'rowBreak' },
      { key: 'alarmTitle',    label: '제목', type: 'text', required: true, placeholder: '알림 제목', colSpan: 2 },
      { key: 'alarmTypeCd',   label: '유형', type: 'select', options: () => codes.alarm_types },
      { key: 'alarmStatusCd', label: '상태', type: 'select', options: () => codes.alarm_statuses },
      { type: 'rowBreak' },
      { key: 'targetTypeCd',  label: '대상 유형', type: 'select', options: () => codes.alarm_target_types },
      { key: 'targetId',      label: '대상 ID', type: 'text', placeholder: '특정회원 ID (선택)' },
      { key: 'alarmSendDate', label: '발송일시', type: 'slot', name: 'sendDate' },
      { type: 'rowBreak' },
      { key: 'alarmMsg',      label: '메시지', type: 'textarea', required: true, rows: 4,
        placeholder: '알림 메시지 내용', colSpan: 3 },
    ];

    // ===== return (템플릿 노출) ===============================================

    return {
      // 상태 / 데이터
      uiState, codes, form, errors,

      // computed
      cfIsNew, cfSiteNm, cfDtlMode,

      // 컬럼 정의
      baseFormColumns,

      // 저장
      handleSave,
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    {{ cfIsNew ? '알림 등록' : (cfDtlMode ? '알림 상세' : '알림 수정') }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.alarmId }}</span>
  </div>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 폼 영역 (BoFormArea 자동 렌더) ================================= -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 폼 영역 ================================================== -->
    <bo-form-area :columns="baseFormColumns" :form="form" :errors="errors"
      :readonly="cfDtlMode" :cols="3"
      @save="handleSave"
      @cancel="navigate('syAlarmMng')"
      @edit="navigate('__switchToEdit__')"
      @close="navigate('syAlarmMng')">
      <template #sendDate>
        <bo-date-time-picker v-model="form.alarmSendDate" :readonly="cfDtlMode" />
      </template>
    </bo-form-area>
  </div>
</div>

    <!-- ===== □.□. 폼 영역 ================================================== -->
  <!-- ===== □. 카드 영역 =================================================== -->`
};
