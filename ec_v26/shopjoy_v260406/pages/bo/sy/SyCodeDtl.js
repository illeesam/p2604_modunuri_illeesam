/* ShopJoy Admin - 공통코드 상세/등록 */
window.SyCodeDtl = {
  name: 'SyCodeDtl',
  props: {
    navigate:      { type: Function, required: true },        // 페이지 이동
    dtlId:         { type: String, default: null },           // 수정 대상 ID
    dtlMode:       { type: String, default: 'view' },         // 상세 모드 (new/view/edit)
    active:        { type: Boolean, default: true },          // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 },              // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { reactive, computed, watch, onMounted, ref } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달

    const pageCodes = reactive({ use_yn: [] });    // 공통코드
    const uiState   = reactive({ loading: false, error: null, isPageCodeLoad: false }); // UI 상태

    const cfIsNew  = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDtlMode = computed(() => props.dtlMode === 'view'); // dtlMode: 'view' 이면 읽기전용

    const form = reactive({                        // 코드 폼 데이터
      codeId: null, codeGrp: '', codeLabel: '', codeValue: '', sortOrd: '', useYn: '', codeRemark: '',
    });
    // 신규 진입 시에만 채울 기본값 (미선택 inactive 상태에서는 빈 폼 유지)
    const _applyNewDefaults = () => {
      Object.assign(form, { sortOrd: 1, useYn: 'Y' });
    };
    const errors = reactive({});                   // 폼 검증 에러

    const schema = yup.object({                    // 폼 검증 스키마
      codeGrp:   yup.string().required('코드그룹을 입력해주세요.'),
      codeLabel: yup.string().required('코드라벨을 입력해주세요.'),
      codeValue: yup.string().required('코드값을 입력해주세요.'),
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyCodeDtl.js : handleBtnAction -> ', cmd, param);
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
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.syCode.getById(props.dtlId, '코드관리', '상세조회');
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
          ? boApiSvc.syCode.create({ ...form }, '코드관리', '등록')
          : boApiSvc.syCode.update(form.codeId, { ...form }, '코드관리', '저장'));
        if (showToast) { showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('syCodeMng', { reload: true }); }
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
        pageCodes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 코드 로드 + 상세 조회
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
      { key: '_siteNm',   label: '사이트명', type: 'readonly', fmt: () => cfSiteNm.value, colSpan: 2 },
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

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      uiState, pageCodes, form, errors,                      // 상태 / 데이터
      handleBtnAction,                                       // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfDtlMode,                                    // computed
    };
  },
  template: /* html */`
<!-- ===== ■. 상세 영역 (제목/폼 모두 컨테이너 안에) ============================= -->
<bo-container :title="!active ? '공통코드 상세' : (cfIsNew ? '공통코드 등록' : (cfDtlMode ? '공통코드 상세' : '공통코드 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : form.codeId)">
  <!-- ===== ■.■. 헤더 제목 슬롯 (list-title, 페이지 타이틀 아님 → 폰트 축소) ========= -->
  <!-- ===== ■.■. 폼 영역 ================================================== -->
  <bo-form-area :columns="columns.baseForm" :form="form" :errors="errors"
    :readonly="cfDtlMode" :cols="3" compact :show-actions="active"
    @save="handleBtnAction('form-save')"
    @cancel="handleBtnAction('form-cancel')"
    @edit="handleBtnAction('form-edit')"
    @close="handleBtnAction('form-close')" />
</bo-container>
<!-- ===== □. 폼 영역 ==================================================== -->
`,
};
