/* ShopJoy Admin - 카테고리 상세/등록 */
window.PdCategoryDtl = {
  name: 'PdCategoryDtl',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
    dtlId:       { type: String, default: null }, // 수정 대상 ID
    dtlMode:     { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng (UX-bo §18)
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const categories = reactive([]);              // 카테고리 목록 (상위 카테고리 옵션용)
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ category_statuses: [] });

    const form = reactive({                       // 카테고리 폼 데이터
      categoryId: null, parentCategoryId: null, categoryNm: '', categoryDepth: 1, sortOrd: 1, categoryStatusCd: 'ACTIVE', categoryDesc: '', imgUrl: '',
    });
    const errors = reactive({});                  // 폼 검증 에러

    const schema = yup.object({                   // 폼 검증 스키마
      categoryNm: yup.string().required('카테고리명을 입력해주세요.'),
    });

    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PdCategoryDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장 (신규 등록 또는 수정)
      if (cmd === 'form-save') {
        return handleSave();
      // 폼 편집 취소 → 목록으로 이동
      } else if (cmd === 'form-cancel') {
        return props.navigate('pdCategoryMng');
      // 상세 보기 → 편집 모드 전환
      } else if (cmd === 'form-edit') {
        return props.navigate('__switchToEdit__');
      // 폼 닫기 → 목록으로 이동
      } else if (cmd === 'form-close') {
        return props.navigate('pdCategoryMng');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleSearchList — 카테고리 목록 조회 (상위 옵션용) */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.pdCategory.getPage({ pageNo: 1, pageSize: 10000 }, '카테고리관리', '상세조회');
        categories.splice(0, categories.length, ...(res.data?.data?.pageList || res.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* handleSearchDetail — 상세 조회 */
    const handleSearchDetail = async () => {
      if (cfIsNew.value) { return; }
      try {
        const res = await boApiSvc.pdCategory.getById(props.dtlId, '카테고리상세', '상세조회');
        const c = res.data?.data || res.data;
        if (c) { Object.assign(form, { ...c }); }
      } catch (err) {
        console.error('[catch-info]', err);
      }
    };

    /* onParentChange — 상위카테고리 변경 시 depth 자동 산정 */
    const onParentChange = () => {
      if (form.parentCategoryId === null || form.parentCategoryId === '') {
        form.categoryDepth = 1;
      } else {
        const parent = window.safeArrayUtils.safeFind(categories, c => c.categoryId === form.parentCategoryId);
        form.categoryDepth = parent ? (parent.categoryDepth || 0) + 1 : 1;
      }
    };

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
      if (!ok) { return; }
      try {
        const res = await (cfIsNew.value ? boApiSvc.pdCategory.create({ ...form }, '카테고리관리', '등록') : boApiSvc.pdCategory.update(form.categoryId, { ...form }, '카테고리관리', '저장'));
        if (showToast) { showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('pdCategoryMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.category_statuses = codeStore.sgGetGrpCodes('CATEGORY_STATUS');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchDetail();
      handleSearchList('DEFAULT');
    });

    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleSearchDetail();
    });

    const cfParentOptions = computed(() => window.safeArrayUtils.safeFilter(categories, c => {
      if (!cfIsNew.value && c.categoryId === props.dtlId) { return false; }
      return true;
    }));

    // 상위카테고리 옵션: depth indent 적용 + (최상위) null 옵션
    const cfParentSelectOptions = computed(() => {
      const list = cfParentOptions.value.map(c => ({
        value: c.categoryId,
        label: '　'.repeat((c.categoryDepth || 1) - 1) + c.categoryNm + ' (depth ' + c.categoryDepth + ')',
      }));
      return [{ value: null, label: '없음 (최상위)' }, ...list];
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // 기본 폼
    const columns = {};
    columns.baseForm = [
      { key: 'parentCategoryId', label: '상위카테고리', type: 'select', nullable: false,
        options: () => cfParentSelectOptions.value, onChange: () => onParentChange() },
      { key: 'categoryNm',       label: '카테고리명', type: 'text', required: true, placeholder: '카테고리명' },
      { key: 'categoryDepth',    label: 'depth (자동산정)', type: 'number', min: 1, readonly: true },
      { key: 'sortOrd',          label: '정렬순서', type: 'number', min: 1 },
      { key: 'categoryStatusCd', label: '상태', type: 'select', options: () => codes.category_statuses },
      { key: 'imgUrl',           label: '아이콘/이미지 URL', type: 'text', placeholder: '/assets/icons/category.png' },
      { key: 'categoryDesc',     label: '설명', type: 'text', colSpan: 2 },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      form, errors, codes,                                       // 상태 / 데이터
      handleBtnAction,                                           // dispatch
      cfIsNew, cfDtlMode, cfParentOptions,                       // computed
    };
  },
  template: /* html */`
<!-- ===== ■. 상세 영역 (제목/폼 모두 컨테이너 안에) ======================== -->
<bo-container :title="cfIsNew ? '카테고리 등록' : '카테고리 수정'"
  :title-id="cfIsNew ? '' : form.categoryId">
  <!-- ===== ■.■. 폼 영역 (BoFormArea 자동 렌더) ========================== -->
  <bo-form-area :columns="columns.baseForm" :form="form" :errors="errors"
    :readonly="cfDtlMode" :cols="3" compact
    @save="handleBtnAction('form-save')"
    @cancel="handleBtnAction('form-cancel')"
    @edit="handleBtnAction('form-edit')"
    @close="handleBtnAction('form-close')" />
</bo-container>
`
};
