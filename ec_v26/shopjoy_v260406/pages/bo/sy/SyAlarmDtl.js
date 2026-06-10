/* ShopJoy Admin - 알림관리 상세/등록 */
window.SyAlarmDtl = {
  name: 'SyAlarmDtl',
  props: {
    navigate:      { type: Function, required: true },        // 페이지 이동
    dtlId:         { type: String, default: null },           // 수정 대상 ID
    dtlMode:       { type: String, default: 'view' },         // 상세 모드 (new/view/edit)
    active:        { type: Boolean, default: true },          // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 },              // 첫 탭 저장 시 상위 Mng 재조회 (UX-bo §18)
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, watch, onMounted, ref } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false }); // UI 상태
    const codes = reactive({                       // 공통코드
      alarm_types: [], alarm_statuses: [], alarm_target_types: [],
    });

    const form = reactive({                        // 알림 폼 데이터
      alarmId: null, alarmTitle: '', alarmTypeCd: '', targetTypeCd: '', targetId: '',
      alarmMsg: '', alarmSendDate: '', alarmStatusCd: '', pathId: null,
    });
    // 신규 진입 시에만 기본값 채움 (미선택/초기화 상태에서는 빈 폼 유지)
    const _applyNewDefaults = () => {
      Object.assign(form, { alarmTypeCd: '푸시', targetTypeCd: '전체', alarmStatusCd: '임시' });
    };
    const errors = reactive({});                   // 폼 검증 에러
    const pathPickModal = reactive({ show: false }); // 표시경로 선택 모달

    const schema = yup.object({                    // 폼 검증 스키마
      alarmTitle: yup.string().required('제목을 입력해주세요.'),
      alarmMsg: yup.string().required('메시지를 입력해주세요.'),
    });

    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDtlMode = computed(() => props.dtlMode === 'view'); // dtlMode: 'view' 이면 읽기전용, 'new'/'edit' 이면 편집

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyAlarmDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장 (신규 등록 또는 수정)
      if (cmd === 'form-save') {
        return handleSave();
      // 폼 편집 취소 → 상세영역 유지 + 빈 신규 폼으로 초기화 (영역 사라지지 않음)
      } else if (cmd === 'form-cancel') {
        return props.navigate('__cancelEdit__');
      // 상세 보기 → 편집 모드 전환
      } else if (cmd === 'form-edit') {
        return props.navigate('__switchToEdit__');
      // 폼 닫기 → 상세영역 유지 + 빈 신규 폼으로 초기화
      } else if (cmd === 'form-close') {
        return props.navigate('__cancelEdit__');
      // 표시경로 선택 모달 열기
      } else if (cmd === 'pathModal-open') {
        pathPickModal.show = true;
        return;
      // 표시경로 선택 모달 닫기
      } else if (cmd === 'pathModal-close') {
        pathPickModal.show = false;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 선택/표시경로 모달 등 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyAlarmDtl.js : handleSelectAction -> ', cmd, param);
      // 표시경로 선택 → form.pathId 갱신
      if (cmd === 'pathModal-pick') {
        form.pathId = param;
        pathPickModal.show = false;
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };


    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ SyAlarmDtl : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'path-pick') {
        if (result == null) {
          pathPickModal.show = false;
          return;
        }
        form.pathId = result;
        pathPickModal.show = false;
        return;
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };
    /* pathLabel — 경로 라벨 변환 */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.syAlarm.getById(props.dtlId, '알람관리', '상세조회');
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
          ? boApiSvc.syAlarm.create({ ...form }, '알람관리', '등록')
          : boApiSvc.syAlarm.update(form.alarmId, { ...form }, '알람관리', '저장'));
        if (showToast) { showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('syAlarmMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

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

    // ★ onMounted — 진입 시 코드 로드 + 상세 조회
    onMounted(async () => {
      if (isAppReady.value) { fnLoadCodes(); }
      if (!cfIsNew.value) { await handleLoadDetail(); }
      if (props.active && cfIsNew.value) { _applyNewDefaults(); }
    });

    /* policy: 상위 Mng 이 reloadTrigger 증가시키면 상세 API 재조회 */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleLoadDetail();
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // 기본 폼
    const columns = {};
    columns.baseForm = [
      { key: '_siteNm',       label: '사이트명', type: 'readonly', fmt: () => cfSiteNm.value, colSpan: 3 },
      { key: 'alarmTitle',    label: '제목', type: 'text', required: true, placeholder: '알림 제목', colSpan: 2 },
      { key: 'alarmTypeCd',   label: '유형', type: 'select', options: () => codes.alarm_types },
      { key: 'alarmStatusCd', label: '상태', type: 'select', options: () => codes.alarm_statuses },
      { key: 'targetTypeCd',  label: '대상 유형', type: 'select', options: () => codes.alarm_target_types },
      { key: 'targetId',      label: '대상 ID', type: 'text', placeholder: '특정회원 ID (선택)' },
      { key: 'pathId',        label: '표시경로', type: 'pathPick',
        pathLabel: (id) => pathLabel(id),
        onOpen: () => handleBtnAction('pathModal-open') },
      { key: 'alarmSendDate', label: '발송일시', type: 'slot', name: 'sendDate' },
      { key: 'alarmMsg',      label: '메시지', type: 'textarea', required: true, rows: 4,
        placeholder: '알림 메시지 내용', colSpan: 3 },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      form, errors, pathPickModal,                // 상태 / 데이터
      handleBtnAction, handleSelectAction, fnCallbackModal,          // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfDtlMode,          // computed
    };
  },
  template: /* html */`
<!-- ===== ■. 상세 영역 (제목/폼 모두 컨테이너 안에) ========================= -->
<bo-container :title="!active ? '알림 상세' : (cfIsNew ? '알림 등록' : (cfDtlMode ? '알림 상세' : '알림 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : form.alarmId)">
  <!-- ===== ■.■. 영역 헤더 (제목 = list-title, 페이지 타이틀 아님 → 폰트 축소) ========= -->
  <!-- ===== ■.■. 폼 영역 ================================================== -->
  <bo-form-area :columns="columns.baseForm" :form="form" :errors="errors"
    :readonly="cfDtlMode" :cols="3" compact :show-actions="active"
    @save="handleBtnAction('form-save')"
    @cancel="handleBtnAction('form-cancel')"
    @edit="handleBtnAction('form-edit')"
    @close="handleBtnAction('form-close')">
    <!-- ===== ■.■.■. 발송일시 (DateTimePicker) ================================= -->
    <template #sendDate>
      <bo-date-time-picker v-model="form.alarmSendDate" :readonly="cfDtlMode" />
    </template>
  </bo-form-area>
</bo-container>
<!-- ===== □. 폼 영역 ==================================================== -->
<!-- ===== ■. 표시경로 선택 모달 ============================================= -->
<path-pick-modal v-if="pathPickModal.show" biz-cd="sy_alarm"
  :value="form.pathId"
  title="알림 표시경로 선택" modal-name="path-pick" :on-callback="fnCallbackModal" />
`,
};
