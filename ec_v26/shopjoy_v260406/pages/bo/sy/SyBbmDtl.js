/* ShopJoy Admin - 게시판관리 상세/등록 */
window.SyBbmDtl = {
  name: 'SyBbmDtl',
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

    const { reactive, computed, watch, onMounted, ref } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ bbm_types: [], bbm_comment_types: [], bbm_attach_types: [], bbm_content_types: [], bbm_scope_types: [], use_yn: [],
      allow_yn_opts: [{codeValue:'Y',codeLabel:'허용'},{codeValue:'N',codeLabel:'불가'}],
    });

    /* 게시판 마스터 fnLoadCodes */
    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================


    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.bbm_types = codeStore.sgGetGrpCodes('BBM_TYPE');
        codes.bbm_comment_types = codeStore.sgGetGrpCodes('BBM_COMMENT_TYPE');
        codes.bbm_attach_types = codeStore.sgGetGrpCodes('BBM_ATTACH_TYPE');
        codes.bbm_content_types = codeStore.sgGetGrpCodes('BBM_CONTENT_TYPE');
        codes.bbm_scope_types = codeStore.sgGetGrpCodes('BBM_SCOPE_TYPE');
        codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
      uiState.isPageCodeLoad = true;
    };

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const form = reactive({
      bbmId: null, bbmCode: '', bbmNm: '', bbmTypeCd: '일반',
      allowComment: '불가', allowAttach: '불가', allowLike: 'N',
      contentTypeCd: 'textarea', scopeTypeCd: '공개',
      sortOrd: 1, useYn: 'Y', bbmRemark: '', pathId: null,
    });
    const errors = reactive({});

    /* ── 표시경로 모달 ── */
    const pathPickModal = reactive({ show: false });

    /* openPathPick — 경로 선택 열기 */
    const openPathPick = () => { pathPickModal.show = true; };

    /* closePathPick — 경로 선택 닫기 */
    const closePathPick = () => { pathPickModal.show = false; };

    /* onPathPicked — 이벤트 */
    const onPathPicked = (pathId) => { form.pathId = pathId; pathPickModal.show = false; };

    /* pathLabel — 경로 라벨 */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    const schema = yup.object({
      bbmCode: yup.string().required('게시판코드를 입력해주세요.'),
      bbmNm: yup.string().required('게시판명을 입력해주세요.'),
    });

    /* 게시판 마스터 상세조회 */
    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================


    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.syBbm.getById(props.dtlId, '게시판모드관리', '상세조회');
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
        const res = await (cfIsNew.value ? boApiSvc.syBbm.create({ ...form }, '게시판모드관리', '등록') : boApiSvc.syBbm.update(form.bbmId, { ...form }, '게시판모드관리', '저장'));
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('syBbmMng', { reload: true });
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
    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================


    // --- [컬럼 정의] ---

    const baseFormColumns = [
      { key: 'siteNm',        label: '사이트명',    type: 'readonly', fmt: () => cfSiteNm.value, colSpan: 3 },
      { type: 'rowBreak' },
      { key: 'bbmCode',       label: '게시판코드',  type: 'text', required: true, mono: true, placeholder: 'BOARD_CODE' },
      { key: 'bbmNm',         label: '게시판명',    type: 'text', required: true, placeholder: '게시판명' },
      { key: 'bbmTypeCd',     label: '유형',        type: 'select', options: () => codes.bbm_types },
      { key: 'allowComment',  label: '댓글허용',    type: 'select', options: () => codes.bbm_comment_types },
      { key: 'allowAttach',   label: '첨부허용',    type: 'select', options: () => codes.bbm_attach_types },
      { key: 'allowLike',     label: '좋아요허용',  type: 'select', options: () => codes.allow_yn_opts },
      { key: 'contentTypeCd', label: '내용입력',    type: 'select', options: () => codes.bbm_content_types },
      { key: 'scopeTypeCd',   label: '공개범위',    type: 'select', options: () => codes.bbm_scope_types },
      { type: 'rowBreak' },
      { key: 'pathId',        label: '표시경로',    type: 'pathPick', colSpan: 2,
        pathLabel: (id) => pathLabel(id),
        onOpen: () => openPathPick() },
      { type: 'rowBreak' },
      { key: 'sortOrd',       label: '정렬순서',    type: 'number', min: 1 },
      { key: 'useYn',         label: '사용여부',    type: 'select', options: () => codes.use_yn },
      { key: 'bbmRemark',     label: '비고',        type: 'text', placeholder: '비고' },
    ];

    // ===== setup() return ===================================================
    // ===== return (템플릿 노출) ===============================================


    return { uiState, codes, cfIsNew, form, errors, handleSave, cfSiteNm, cfDtlMode,
      pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel, baseFormColumns };
  },
  template: /* html */`
<div>
  <div class="page-title">
    {{ cfIsNew ? '게시판 등록' : (cfDtlMode ? '게시판 상세' : '게시판 수정') }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.bbmId }}</span>
  </div>
  <!-- 폼 영역 (BoFormArea 자동 렌더) -->
  <div class="card">
    <bo-form-area :columns="baseFormColumns" :form="form" :errors="errors"
      :readonly="cfDtlMode" :cols="3"
      @save="handleSave"
      @cancel="navigate('syBbmMng')"
      @edit="navigate('__switchToEdit__')"
      @close="navigate('syBbmMng')" />
  </div>
  <!-- 표시경로 선택 모달 -->
  <path-pick-modal v-if="pathPickModal.show" biz-cd="sy_bbm"
    :value="form.pathId"
    title="게시판 표시경로 선택"
    @select="onPathPicked" @close="closePathPick" />
</div>
`
};
