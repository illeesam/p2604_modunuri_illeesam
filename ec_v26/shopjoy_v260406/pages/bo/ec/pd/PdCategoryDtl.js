/* ShopJoy Admin - 카테고리 상세/등록 */
window.PdCategoryDtl = {
  name: 'PdCategoryDtl',
  props: ['navigate', 'showToast', 'editId', 'showConfirm', 'setApiRes'],
  setup(props) {
    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const categories = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ category_statuses: [] });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.getBoCodeStore?.();
        if (codeStore?.snGetGrpCodes) {
          codes.category_statuses = codeStore.snGetGrpCodes('CATEGORY_STATUS') || [];
        }
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    // ── watch ────────────────────────────────────────────────────────────────

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApi.get('/bo/ec/pd/category/page', {
          params: { pageNo: 1, pageSize: 10000 },
          ...coUtil.apiHdr('카테고리관리', '상세조회')
        });
        categories.splice(0, categories.length, ...(res.data?.data?.pageList || res.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    const cfIsNew = computed(() => props.editId === null || props.editId === undefined);
    const form = reactive({
      categoryId: null, parentId: null, categoryNm: '', depth: 1, sortOrd: 1, status: '활성', description: '', imgUrl: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      categoryNm: yup.string().required('카테고리명을 입력해주세요.'),
    });

    const handleSearchDetail = async () => {
      if (cfIsNew.value) return;
      try {
        const res = await boApi.get(`/bo/ec/pd/category/${props.editId}`, coUtil.apiHdr('카테고리상세', '상세조회'));
        const c = res.data?.data || res.data;
        if (c) Object.assign(form, { ...c });
      } catch (err) {
        console.error('[catch-info]', err);
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
      handleSearchDetail();
    });

    const cfParentOptions = computed(() => window.safeArrayUtils.safeFilter(categories, c => {
      if (!cfIsNew.value && c.categoryId === props.editId) return false;
      return true;
    }));

    const onParentChange = () => {
      if (form.parentId === null || form.parentId === '') {
        form.depth = 1;
      } else {
        const parent = window.safeArrayUtils.safeFind(categories, c => c.categoryId === Number(form.parentId));
        form.depth = parent ? parent.depth + 1 : 1;
      }
    };

    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        console.error('[catch-info]', err);
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const parentId = form.parentId ? Number(form.parentId) : null;
      const ok = await props.showConfirm(cfIsNew.value ? '등록' : '저장', cfIsNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      try {
        const res = await (cfIsNew.value ? boApi.post(`/bo/ec/pd/category/${form.categoryId}`, { ...form }, coUtil.apiHdr('카테고리관리', '등록')) : boApi.put(`/bo/ec/pd/category/${form.categoryId}`, { ...form }, coUtil.apiHdr('카테고리관리', '저장')));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('pdCategoryMng');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    // ── return ───────────────────────────────────────────────────────────────

    return { cfIsNew, form, errors, handleSave, cfParentOptions, onParentChange, codes };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ cfIsNew ? '카테고리 등록' : '카테고리 수정' }}<span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.categoryId }}</span></div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">상위카테고리</label>
        <select class="form-control" v-model="form.parentId" @change="onParentChange">
          <option :value="null">없음 (최상위)</option>
          <option v-for="c in cfParentOptions" :key="c?.categoryId" :value="c.categoryId">{{ '　'.repeat(c.depth-1) }}{{ c.categoryNm }} (depth {{ c.depth }})</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">카테고리명 <span class="req">*</span></label>
        <input class="form-control" v-model="form.categoryNm" placeholder="카테고리명" :class="errors.categoryNm ? 'is-invalid' : ''" />
        <span v-if="errors.categoryNm" class="field-error">{{ errors.categoryNm }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">depth (자동산정)</label>
        <input class="form-control" type="number" v-model.number="form.depth" min="1" readonly style="background:#f5f5f5;" />
      </div>
      <div class="form-group">
        <label class="form-label">정렬순서</label>
        <input class="form-control" type="number" v-model.number="form.sortOrd" min="1" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" v-model="form.status">
          <option v-for="c in codes.category_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">아이콘/이미지 URL</label>
        <input class="form-control" v-model="form.imgUrl" placeholder="/assets/icons/category.png" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">설명</label>
        <input class="form-control" v-model="form.description" />
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" @click="handleSave">저장</button>
      <button class="btn btn-secondary" @click="navigate('pdCategoryMng')">취소</button>
    </div>
  </div>
</div>
`
};
