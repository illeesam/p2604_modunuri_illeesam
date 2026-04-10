/* ShopJoy Admin - 카테고리 상세/등록 */
window.CategoryDtl = {
  name: 'CategoryDtl',
  props: ['navigate', 'adminData', 'showToast', 'editId'],
  setup(props) {
    const { reactive, computed, onMounted } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const form = reactive({
      parentId: null, categoryName: '', depth: 1, sortOrd: 1, status: '활성', description: '', imgUrl: '',
    });

    onMounted(() => {
      if (!isNew.value) {
        const c = props.adminData.categories.find(x => x.categoryId === props.editId);
        if (c) Object.assign(form, { ...c });
      }
    });

    const parentOptions = computed(() => props.adminData.categories.filter(c => {
      if (!isNew.value && c.categoryId === props.editId) return false;
      return true;
    }));

    const onParentChange = () => {
      if (form.parentId === null || form.parentId === '') {
        form.depth = 1;
      } else {
        const parent = props.adminData.categories.find(c => c.categoryId === Number(form.parentId));
        form.depth = parent ? parent.depth + 1 : 1;
      }
    };

    const save = () => {
      if (!form.categoryName) { props.showToast('카테고리명은 필수입니다.', 'error'); return; }
      const parentId = form.parentId ? Number(form.parentId) : null;
      if (isNew.value) {
        props.adminData.categories.push({
          ...form, parentId, categoryId: props.adminData.nextId(props.adminData.categories, 'categoryId'),
          sortOrd: Number(form.sortOrd) || 1, depth: Number(form.depth) || 1,
        });
        props.showToast('카테고리가 등록되었습니다.');
      } else {
        const idx = props.adminData.categories.findIndex(x => x.categoryId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.categories[idx], { ...form, parentId, sortOrd: Number(form.sortOrd) || 1 });
        props.showToast('저장되었습니다.');
      }
      props.navigate('categoryMng');
    };

    return { isNew, form, save, parentOptions, onParentChange };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '카테고리 등록' : '카테고리 수정' }}</div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">상위카테고리</label>
        <select class="form-control" v-model="form.parentId" @change="onParentChange">
          <option :value="null">없음 (최상위)</option>
          <option v-for="c in parentOptions" :key="c.categoryId" :value="c.categoryId">{{ '　'.repeat(c.depth-1) }}{{ c.categoryName }} (depth {{ c.depth }})</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">카테고리명 <span class="req">*</span></label>
        <input class="form-control" v-model="form.categoryName" placeholder="카테고리명" />
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
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('categoryMng')">취소</button>
    </div>
  </div>
</div>
`
};
