/* ShopJoy Admin - 기획전관리 상세/등록 */
window._ecPlanDtlState = window._ecPlanDtlState || { tab: 'info', viewMode: 'tab' };
window.PmPlanDtl = {
  name: 'PmPlanDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, ref, onMounted } = Vue;
    const isNew = computed(() => !props.editId);
    const tab = ref(window._ecPlanDtlState.tab || 'info');
    Vue.watch(tab, v => { window._ecPlanDtlState.tab = v; });

    const _today = new Date();
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END   = `${_today.getFullYear()+1}-12-31`;

    const CATEGORIES = [
      { value: '패션', label: '패션' },
      { value: '스포츠', label: '스포츠' },
      { value: '스타일링', label: '스타일링' },
      { value: '직원전용', label: '직원전용' },
      { value: '명품', label: '명품' },
    ];

    const STATUS_OPTIONS = [
      { value: '활성', label: '활성' },
      { value: '예정', label: '예정' },
      { value: '비활성', label: '비활성' },
      { value: '종료', label: '종료' },
    ];

    const form = reactive({
      planNm: '', category: '패션', theme: '', status: '활성',
      startDate: DEFAULT_START, endDate: DEFAULT_END,
      productIds: [], visibilityTargets: '^PUBLIC^',
      desc: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      planNm: yup.string().required('기획전명을 입력해주세요.'),
      category: yup.string().required('카테고리를 선택해주세요.'),
    });

    onMounted(() => {
      if (!isNew.value) {
        const p = (props.adminData.plans || []).find(x => x.planId === props.editId);
        if (p) {
          Object.assign(form, { ...p, productIds: [...(p.productIds || [])] });
          if (!form.visibilityTargets) form.visibilityTargets = '^PUBLIC^';
        }
      }
    });

    /* 대상 상품 팝업 */
    const showProdPopup = ref(false);
    const prodSearch = ref('');
    const filteredProds = computed(() => props.adminData.products.filter(p => {
      const kw = prodSearch.value.trim().toLowerCase();
      return !kw || p.prodNm.toLowerCase().includes(kw);
    }));
    const toggleProduct = (pid) => {
      const idx = form.productIds.indexOf(pid);
      if (idx === -1) form.productIds.push(pid);
      else form.productIds.splice(idx, 1);
    };
    const selectedProducts = computed(() =>
      props.adminData.products.filter(p => form.productIds.includes(p.productId))
    );

    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }

      await window.adminApiCall({
        method: isNew.value ? 'post' : 'put',
        path: `plans${isNew.value ? '' : '/' + props.editId}`,
        data: form,
        confirmTitle: '저장',
        confirmMsg: '저장하시겠습니까?',
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: '저장되었습니다.',
        onLocal: () => {
          if (isNew.value) {
            const newId = Math.max(...(props.adminData.plans || []).map(p => p.planId), 0) + 1;
            const newPlan = {
              planId: newId, ...form, regDate: new Date().toISOString().slice(0, 10),
              viewCount: 0, thumbUrl: '🎯',
            };
            props.adminData.plans.push(newPlan);
            props.navigate('pmPlanMng');
          } else {
            const idx = props.adminData.plans.findIndex(x => x.planId === props.editId);
            if (idx !== -1) Object.assign(props.adminData.plans[idx], form);
            props.navigate('pmPlanMng');
          }
        },
      });
    };

    const onCancel = () => {
      if (confirm('저장되지 않은 변경사항이 있습니다. 계속하시겠습니까?')) {
        props.navigate('pmPlanMng');
      }
    };

    return {
      isNew, tab, form, errors, CATEGORIES, STATUS_OPTIONS, save, onCancel,
      showProdPopup, prodSearch, filteredProds, toggleProduct, selectedProducts,
    };
  },
  template: /* html */`
<div class="card dtl-tab-grid cols-1">
  <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #f0f0f0;">
    <h3 style="margin:0;font-size:14px;font-weight:700;color:#222;">{{ isNew ? '기획전 신규' : '기획전 상세' }}</h3>
    <div style="display:flex;gap:8px;">
      <button class="btn btn-primary" @click="save">💾 저장</button>
      <button class="btn btn-secondary" @click="onCancel">취소</button>
    </div>
  </div>

  <div style="padding:16px;">
    <!-- 기본정보 -->
    <div class="form-row">
      <label class="form-label">기획전명 <span style="color:#e74c3c;">*</span></label>
      <input v-model="form.planNm" class="form-control" placeholder="기획전명 입력" style="width:100%;" />
      <div v-if="errors.planNm" class="field-error">{{ errors.planNm }}</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div class="form-row">
        <label class="form-label">카테고리 <span style="color:#e74c3c;">*</span></label>
        <select v-model="form.category" class="form-control" style="width:100%;">
          <option v-for="c in CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
        <div v-if="errors.category" class="field-error">{{ errors.category }}</div>
      </div>
      <div class="form-row">
        <label class="form-label">테마</label>
        <input v-model="form.theme" class="form-control" placeholder="예: 봄맞이, 세일" style="width:100%;" />
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div class="form-row">
        <label class="form-label">상태</label>
        <select v-model="form.status" class="form-control" style="width:100%;">
          <option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
      </div>
      <div class="form-row">
        <label class="form-label">공개대상</label>
        <select v-model="form.visibilityTargets" class="form-control" style="width:100%;">
          <option value="^PUBLIC^">전체공개</option>
          <option value="^MEMBER^">회원공개</option>
          <option value="^VERIFIED^">인증회원</option>
          <option value="^VIP^">VIP전용</option>
        </select>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div class="form-row">
        <label class="form-label">시작일</label>
        <input v-model="form.startDate" type="date" class="form-control" style="width:100%;" />
      </div>
      <div class="form-row">
        <label class="form-label">종료일</label>
        <input v-model="form.endDate" type="date" class="form-control" style="width:100%;" />
      </div>
    </div>

    <div class="form-row">
      <label class="form-label">설명</label>
      <textarea v-model="form.desc" class="form-control" placeholder="기획전 설명" style="width:100%;min-height:60px;"></textarea>
    </div>

    <!-- 대상상품 -->
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e0e0e0;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <label class="form-label" style="margin:0;">대상상품 ({{ form.productIds.length }}개)</label>
        <button class="btn btn-primary btn-sm" @click="showProdPopup=true">+ 상품선택</button>
      </div>

      <!-- 선택된 상품 표시 -->
      <div v-if="selectedProducts.length > 0" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;">
        <div v-for="p in selectedProducts" :key="p.productId" style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;background:#fff;">
          <div style="height:100px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:32px;border-bottom:1px solid #e8e8e8;">📦</div>
          <div style="padding:8px;font-size:11px;">
            <div style="font-weight:600;color:#222;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ p.prodNm }}</div>
            <div style="color:#e8587a;font-weight:700;margin-bottom:4px;">{{ (p.price||0).toLocaleString() }}원</div>
            <button style="width:100%;padding:4px;background:#fff;border:1px solid #ddd;border-radius:4px;font-size:10px;cursor:pointer;color:#666;" @click="toggleProduct(p.productId)">제거</button>
          </div>
        </div>
      </div>
      <div v-else style="text-align:center;color:#999;padding:20px;background:#f9f9f9;border-radius:6px;">선택된 상품이 없습니다.</div>
    </div>
  </div>
</div>

<!-- 상품선택 모달 -->
<div v-if="showProdPopup" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
  <div style="background:#fff;border-radius:8px;width:90%;max-width:600px;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;">
    <div style="padding:16px;border-bottom:1px solid #e0e0e0;display:flex;justify-content:space-between;align-items:center;">
      <h3 style="margin:0;font-size:14px;font-weight:700;">상품선택</h3>
      <button @click="showProdPopup=false" style="background:none;border:none;font-size:20px;cursor:pointer;color:#999;">✕</button>
    </div>
    <div style="padding:12px;border-bottom:1px solid #f0f0f0;">
      <input v-model="prodSearch" type="text" placeholder="상품명 검색" class="form-control" style="width:100%;" />
    </div>
    <div style="flex:1;overflow-y:auto;">
      <div v-if="filteredProds.length === 0" style="text-align:center;color:#999;padding:40px;">상품이 없습니다.</div>
      <div v-for="p in filteredProds" :key="p.productId"
        @click="toggleProduct(p.productId)"
        style="padding:12px 16px;border-bottom:1px solid #f0f0f0;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:background .1s;"
        :style="form.productIds.includes(p.productId) ? 'background:#ede7f6;' : ''"
        @mouseenter="$event.target.parentElement.style.background='#f9f9f9'"
        @mouseleave="$event.target.parentElement.style.background=form.productIds.includes(p.productId) ? '#ede7f6' : 'white'">
        <div style="flex:1;">
          <div style="font-weight:600;font-size:12px;color:#222;">{{ p.prodNm }}</div>
          <div style="font-size:11px;color:#999;margin-top:2px;">{{ (p.price||0).toLocaleString() }}원</div>
        </div>
        <div v-if="form.productIds.includes(p.productId)" style="color:#6a1b9a;font-weight:700;font-size:18px;">✓</div>
      </div>
    </div>
    <div style="padding:12px 16px;border-top:1px solid #e0e0e0;display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-secondary" @click="showProdPopup=false">완료</button>
    </div>
  </div>
</div>
`
};
