/* ShopJoy Admin - 카테고리 상세/등록 */
window.PdCategoryDtl = {
  name: 'PdCategoryDtl',
  props: ['navigate', 'showToast', 'editId', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const categories = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({});

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });

    // onMounted에서 API 로드
    const handleFetchData = async () => {
      uiState.loading = true;
      try {
        const res = await window.boApi.get('/bo/ec/pd/category/page', {
          params: { pageNo: 1, pageSize: 10000 }
        });
        categories.splice(0, categories.length, ...(res.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('PdCategory 로드 실패', 'error');
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

    onMounted(() => {
      handleFetchData();
      if (!cfIsNew.value) {
        const c = window.safeArrayUtils.safeFind(categories, x => x.categoryId === props.editId);
        if (c) Object.assign(form, { ...c });
      }
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
      if (cfIsNew.value) {
        categories.value.push({
          ...form, parentId, categoryId: nextId.value(categories.value, 'categoryId'),
          sortOrd: Number(form.sortOrd) || 1, depth: Number(form.depth) || 1,
        });
      } else {
        const idx = categories.value.findIndex(x => x.categoryId === props.editId);
        if (idx !== -1) Object.assign(categories.value[idx], { ...form, parentId, sortOrd: Number(form.sortOrd) || 1 });
      }
      try {
        const res = await (cfIsNew.value ? window.boApi.post(`/bo/ec/pd/category/${form.categoryId}`, { ...form }) : window.boApi.put(`/bo/ec/pd/category/${form.categoryId}`, { ...form }));
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
          <option>활성</option><option>비활성</option>
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
