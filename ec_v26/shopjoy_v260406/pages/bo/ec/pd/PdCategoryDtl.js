/* ShopJoy Admin - 카테고리 상세/등록 */
window.PdCategoryDtl = {
  name: 'PdCategoryDtl',
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
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const categories = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ category_statuses: [] });

    /* 상품 카테고리 fnLoadCodes */
    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.category_statuses = codeStore.sgGetGrpCodes('CATEGORY_STATUS');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // onMounted에서 API 로드
    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* handleSearchList — 목록 조회 */
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
    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const form = reactive({
      categoryId: null, parentCategoryId: null, categoryNm: '', categoryDepth: 1, sortOrd: 1, categoryStatusCd: 'ACTIVE', categoryDesc: '', imgUrl: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      categoryNm: yup.string().required('카테고리명을 입력해주세요.'),
    });

    /* handleSearchDetail — 처리 */
    const handleSearchDetail = async () => {
      if (cfIsNew.value) return;
      try {
        const res = await boApiSvc.pdCategory.getById(props.dtlId, '카테고리상세', '상세조회');
        const c = res.data?.data || res.data;
        if (c) Object.assign(form, { ...c });
      } catch (err) {
        console.error('[catch-info]', err);
      }
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchDetail();
      handleSearchList('DEFAULT');
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) return;
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleSearchDetail();
    });

    const cfParentOptions = computed(() => window.safeArrayUtils.safeFilter(categories, c => {
      if (!cfIsNew.value && c.categoryId === props.dtlId) return false;
      return true;
    }));

    /* onParentChange — 이벤트 */
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
      if (!ok) return;
      try {
        const res = await (cfIsNew.value ? boApiSvc.pdCategory.create({ ...form }, '카테고리관리', '등록') : boApiSvc.pdCategory.update(form.categoryId, { ...form }, '카테고리관리', '저장'));
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('pdCategoryMng', { reload: true });
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
    // 상위카테고리 옵션: depth indent 적용 + (최상위) null 옵션
    const cfParentSelectOptions = computed(() => {
      const list = cfParentOptions.value.map(c => ({
        value: c.categoryId,
        label: '　'.repeat((c.categoryDepth || 1) - 1) + c.categoryNm + ' (depth ' + c.categoryDepth + ')',
      }));
      return [{ value: null, label: '없음 (최상위)' }, ...list];
    });

    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================


    // --- [컬럼 정의] ---

    const baseFormColumns = [
      { key: 'parentCategoryId', label: '상위카테고리', type: 'select', nullable: false,
        options: () => cfParentSelectOptions.value, onChange: () => onParentChange() },
      { key: 'categoryNm',       label: '카테고리명', type: 'text', required: true, placeholder: '카테고리명' },
      { type: 'rowBreak' },
      { key: 'categoryDepth',    label: 'depth (자동산정)', type: 'number', min: 1, readonly: true },
      { key: 'sortOrd',          label: '정렬순서', type: 'number', min: 1 },
      { type: 'rowBreak' },
      { key: 'categoryStatusCd', label: '상태', type: 'select', options: () => codes.category_statuses },
      { key: 'imgUrl',           label: '아이콘/이미지 URL', type: 'text', placeholder: '/assets/icons/category.png' },
      { type: 'rowBreak' },
      { key: 'categoryDesc',     label: '설명', type: 'text', colSpan: 2 },
    ];

    // ===== setup() return ===================================================
    // ===== return (템플릿 노출) ===============================================

    return { cfIsNew, form, errors, handleSave, cfParentOptions, onParentChange, codes, cfDtlMode, baseFormColumns };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 + ID 표시 ========================================= -->
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    {{ cfIsNew ? '카테고리 등록' : '카테고리 수정' }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.categoryId }}</span>
  </div>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 폼 영역 (BoFormArea 자동 렌더) ================================= -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 폼 영역 ================================================== -->
    <bo-form-area :columns="baseFormColumns" :form="form" :errors="errors"
      :readonly="cfDtlMode" :cols="2"
      @save="handleSave"
      @cancel="navigate('pdCategoryMng')"
      @edit="navigate('__switchToEdit__')"
      @close="navigate('pdCategoryMng')" />
  </div>
</div>

    <!-- ===== □.□. 폼 영역 ================================================== -->
  <!-- ===== □. 카드 영역 =================================================== -->`
};
