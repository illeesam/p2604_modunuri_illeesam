/* ShopJoy Admin - 상품관리 상세/등록 */
window._pdProdDtlState = window._pdProdDtlState || { tab: 'info', viewMode: 'tab' };
window.PdProdDtl = {
  name: 'PdProdDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, ref, onMounted, onBeforeUnmount, nextTick, watch } = Vue;
    const isNew = computed(() => !props.editId);
    const topTab = ref(window._pdProdDtlState.tab || 'info');
    watch(topTab, v => { window._pdProdDtlState.tab = v; });
    const viewMode2 = ref(window._pdProdDtlState.viewMode || 'tab');
    watch(viewMode2, v => { window._pdProdDtlState.viewMode = v; });
    const showTab = id => viewMode2.value !== 'tab' || topTab.value === id;

    // ── form: pd_prod 전체 필드
    const form = reactive({
      prodId: null,
      prodNm: '', prodCode: '',
      categoryId: '', brandId: '', vendorId: '',
      prodTypeCd: 'SINGLE', prodStatusCd: 'DRAFT',
      dlvTmpltId: '',
      listPrice: 0, salePrice: 0, purchasePrice: null, marginRate: null,
      prodStock: 0,
      saleStartDate: '', saleEndDate: '',
      minBuyQty: 1, maxBuyQty: null, dayMaxBuyQty: null, idMaxBuyQty: null,
      adltYn: 'N', sameDayDlivYn: 'N', soldOutYn: 'N',
      couponUseYn: 'Y', saveUseYn: 'Y', discntUseYn: 'Y',
      advrtStmt: '', advrtStartDate: '', advrtEndDate: '',
      weight: null, sizeInfoCd: '',
      isNew_: 'N', isBest: 'N',
      contentHtml: '',
    });
    const errors = reactive({});
    const schema = yup.object({
      prodNm:    yup.string().required('상품명을 입력해주세요.'),
      listPrice: yup.number().typeError('숫자 입력').min(0).required('정가를 입력해주세요.'),
      salePrice: yup.number().typeError('숫자 입력').min(0).required('판매가를 입력해주세요.'),
    });

    // ── 옵션 설정
    const useOpt = ref(true);
    let _optSeq = 1, _itemSeq = 100;
    const optGroups = ref([]); // [{_id, grpNm, typeCd, inputTypeCd, level, items:[{_id, nm, val, valCodeId, parentOptItemId, sortOrd, useYn}]}]
    const skus = ref([]);      // [{_id, _optKey, _nm1, _nm2, skuCode, addPrice, stock, useYn}]
    // ── 옵션 공통코드 (adminData.codes 기반 — OPT_TYPE 2레벨 트리)
    const prodOptCategoryTypeCd = ref(''); // OPT_TYPE 1레벨 (의류/신발/가방/커스텀)
    const optTypeLevel1Codes = computed(() =>
      (props.adminData.codes||[]).filter(c => c.codeGrp==='OPT_TYPE' && c.useYn==='Y' && !c.parentCodeValue && c.codeValue!=='NONE')
        .sort((a,b) => a.sortOrd - b.sortOrd)
    );
    const optTypeCodes = computed(() => {
      if (!prodOptCategoryTypeCd.value) return [];
      return (props.adminData.codes||[]).filter(c => c.codeGrp==='OPT_TYPE' && c.useYn==='Y' && c.parentCodeValue===prodOptCategoryTypeCd.value)
        .sort((a,b) => a.sortOrd - b.sortOrd);
    });
    const optInputTypeCodes = computed(() => (props.adminData.codes||[]).filter(c => c.codeGrp==='OPT_INPUT_TYPE' && c.useYn==='Y').sort((a,b)=>a.sortOrd-b.sortOrd));
    const getOptValCodes    = (typeCd) => (props.adminData.codes||[]).filter(c => c.codeGrp==='OPT_VAL' && c.parentCodeValue===typeCd && c.useYn==='Y').sort((a,b)=>a.sortOrd-b.sortOrd);

    const clearOpt = () => { optGroups.value = []; skus.value = []; prodOptCategoryTypeCd.value = ''; };

    const onCategoryChange = () => {
      optGroups.value = [];
      skus.value = [];
      optTypeCodes.value.slice(0, 2).forEach((tc, i) => {
        optGroups.value.push({ _id: _optSeq++, grpNm: '', typeCd: tc.codeValue, inputTypeCd: 'SELECT', level: i + 1, items: [] });
      });
    };

    const addOptGroup = () => {
      if (!prodOptCategoryTypeCd.value) { props.showToast('옵션 카테고리를 먼저 선택해주세요.', 'error'); return; }
      if (optGroups.value.length >= 2) { props.showToast('옵션은 최대 2단까지 가능합니다.', 'error'); return; }
      const defaultTypeCd = optTypeCodes.value[optGroups.value.length]?.codeValue || '';
      optGroups.value.push({ _id: _optSeq++, grpNm: '', typeCd: defaultTypeCd, inputTypeCd: 'SELECT', level: optGroups.value.length + 1, items: [] });
    };
    const removeOptGroup = (idx) => {
      optGroups.value.splice(idx, 1);
      optGroups.value.forEach((g, i) => { g.level = i + 1; });
      generateSkus();
    };
    const addOptItem = (grp) => {
      grp.items.push({ _id: _itemSeq++, nm: '', val: '', valCodeId: '', parentOptItemId: '', sortOrd: grp.items.length + 1, useYn: 'Y' });
    };
    const removeOptItem = (grp, idx) => { grp.items.splice(idx, 1); generateSkus(); };

    const generateSkus = () => {
      if (optGroups.value.length === 0) { skus.value = []; return; }
      const g1 = optGroups.value[0]?.items.filter(i => i.useYn === 'Y' && i.nm.trim()) || [];
      const g2 = optGroups.value[1]?.items.filter(i => i.useYn === 'Y' && i.nm.trim()) || [];
      const existMap = {};
      skus.value.forEach(s => { existMap[s._optKey] = s; });
      const newSkus = [];
      if (g2.length === 0) {
        g1.forEach(i1 => {
          const key = String(i1._id);
          newSkus.push(existMap[key]
            ? { ...existMap[key], _nm1: i1.nm, _nm2: '' }
            : { _id: 'sku_' + i1._id, _optKey: key, _nm1: i1.nm, _nm2: '', skuCode: '', addPrice: 0, stock: 0, useYn: 'Y' });
        });
      } else {
        g1.forEach(i1 => g2.forEach(i2 => {
          const key = i1._id + '_' + i2._id;
          newSkus.push(existMap[key]
            ? { ...existMap[key], _nm1: i1.nm, _nm2: i2.nm }
            : { _id: 'sku_' + key, _optKey: key, _nm1: i1.nm, _nm2: i2.nm, skuCode: '', addPrice: 0, stock: 0, useYn: 'Y' });
        }));
      }
      skus.value = newSkus;
    };
    const totalStock = computed(() => skus.value.filter(s => s.useYn === 'Y').reduce((a, s) => a + (Number(s.stock) || 0), 0));

    // ── 이미지
    const images = ref([]);
    let imgIdSeq = 1;
    const fileInputRef = ref(null);
    const triggerFileInput = () => fileInputRef.value?.click();
    const addImageByUrl = () => images.value.push({ id: imgIdSeq++, previewUrl: '', isMain: images.value.length === 0, optItemId1: '', optItemId2: '' });
    const onFileChange = (e) => {
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => images.value.push({ id: imgIdSeq++, previewUrl: ev.target.result, isMain: images.value.length === 0, optItemId1: '', optItemId2: '' });
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    };
    const setMain = (id) => images.value.forEach(img => { img.isMain = img.id === id; });
    const removeImage = (id) => {
      const idx = images.value.findIndex(img => img.id === id);
      if (idx !== -1) { const wasMain = images.value[idx].isMain; images.value.splice(idx, 1); if (wasMain && images.value.length) images.value[0].isMain = true; }
    };

    // ── 이미지 드래그 정렬
    const dragImgIdx = ref(null);
    const dragoverImgIdx = ref(null);
    const onImgDragStart = (idx) => { dragImgIdx.value = idx; };
    const onImgDragOver  = (idx) => { dragoverImgIdx.value = idx; };
    const onImgDrop = () => {
      if (dragImgIdx.value === null || dragImgIdx.value === dragoverImgIdx.value) { dragImgIdx.value = null; dragoverImgIdx.value = null; return; }
      const items = [...images.value];
      const [moved] = items.splice(dragImgIdx.value, 1);
      items.splice(dragoverImgIdx.value, 0, moved);
      images.value = items;
      dragImgIdx.value = null;
      dragoverImgIdx.value = null;
    };

    // ── Quill
    const descEl = ref(null);
    let _qDesc = null;

    // ── 계산값
    const marginRateCalc = computed(() => {
      if (!form.salePrice || !form.purchasePrice) return null;
      return ((form.salePrice - form.purchasePrice) / form.salePrice * 100).toFixed(2);
    });
    const discountRate = computed(() => {
      if (!form.listPrice || form.listPrice <= 0) return 0;
      return Math.round((1 - form.salePrice / form.listPrice) * 100);
    });

    // ── 연관상품
    const relatedProductIds = ref('');
    const relatedProducts = computed(() => {
      if (!relatedProductIds.value) return [];
      return relatedProductIds.value.split(',').map(s => Number(s.trim())).filter(Boolean)
        .map(id => props.adminData.getProduct(id)).filter(Boolean);
    });

    // ── 판매계획
    const salePlans = ref([]);
    let planIdSeq = 1;
    const planVisible = computed(() => salePlans.value.filter(r => r._row_status !== 'D'));
    const planAllChecked = computed({
      get: () => planVisible.value.length > 0 && planVisible.value.every(r => r._checked),
      set: v => planVisible.value.forEach(r => { r._checked = v; }),
    });
    const addPlanRow = () => salePlans.value.unshift({ _id: planIdSeq++, _row_status: 'I', _checked: false, startDate: '', startTime: '00:00', endDate: '', endTime: '23:59', planStatus: '준비중', listPrice: form.listPrice || 0, salePrice: form.salePrice || 0, purchasePrice: form.purchasePrice || 0 });
    const onPlanChange = row => { if (row._row_status === 'N') row._row_status = 'U'; };
    const deletePlanChecked = () => { for (let i = salePlans.value.length - 1; i >= 0; i--) { const r = salePlans.value[i]; if (!r._checked) continue; if (r._row_status === 'I') salePlans.value.splice(i, 1); else r._row_status = 'D'; } };
    const planRowStyle = s => ({ I: 'background:#f6ffed;', U: 'background:#fffbe6;', D: 'background:#fff1f0;opacity:0.6;' }[s] || '');

    // ── mounted
    onMounted(async () => {
      if (!isNew.value) {
        const p = props.adminData.getProduct(props.editId);
        if (p) {
          form.prodId         = p.productId || p.prodId;
          form.prodNm         = p.prodNm || '';
          form.prodCode       = p.prodCode || '';
          form.categoryId     = p.categoryId || p.category || '';
          form.brandId        = p.brandId || p.brand || '';
          form.vendorId       = p.vendorId || '';
          form.prodTypeCd     = p.prodTypeCd || 'SINGLE';
          form.prodStatusCd   = p.prodStatusCd || p.status || 'ACTIVE';
          form.dlvTmpltId     = p.dlvTmpltId || '';
          form.listPrice      = p.listPrice || p.price || 0;
          form.salePrice      = p.salePrice || 0;
          form.purchasePrice  = p.purchasePrice || p.costPrice || null;
          form.prodStock      = p.prodStock || p.stock || 0;
          form.saleStartDate  = p.saleStartDate || '';
          form.saleEndDate    = p.saleEndDate || '';
          form.minBuyQty      = p.minBuyQty || 1;
          form.maxBuyQty      = p.maxBuyQty || null;
          form.dayMaxBuyQty   = p.dayMaxBuyQty || null;
          form.idMaxBuyQty    = p.idMaxBuyQty || null;
          form.adltYn         = p.adltYn || 'N';
          form.sameDayDlivYn  = p.sameDayDlivYn || 'N';
          form.soldOutYn      = p.soldOutYn || 'N';
          form.couponUseYn    = p.couponUseYn || 'Y';
          form.saveUseYn      = p.saveUseYn || 'Y';
          form.discntUseYn    = p.discntUseYn || 'Y';
          form.advrtStmt      = p.advrtStmt || '';
          form.advrtStartDate = p.advrtStartDate || '';
          form.advrtEndDate   = p.advrtEndDate || '';
          form.weight         = p.weight || null;
          form.sizeInfoCd     = p.sizeInfoCd || '';
          form.isNew_         = p.isNew_ || 'N';
          form.isBest         = p.isBest || 'N';
          form.contentHtml    = p.contentHtml || p.description || '';
          if (p.images?.length) images.value = p.images.map(img => ({ ...img, id: imgIdSeq++ }));
          else if (p.mainImage) images.value = [{ id: imgIdSeq++, previewUrl: p.mainImage, isMain: true, optItemId1: '', optItemId2: '' }];
          if (p.optGroups?.length) {
            useOpt.value = true;
            optGroups.value = p.optGroups.map(g => ({ ...g, _id: _optSeq++, items: g.items.map(i => ({ ...i, _id: _itemSeq++ })) }));
            skus.value = p.skus || [];
          }
          if (p.salePlans?.length) salePlans.value = p.salePlans.map(r => ({ ...r, _id: planIdSeq++, _checked: false }));
          relatedProductIds.value = p.relatedProductIds || '';
        }
      }
      await nextTick();
      if (descEl.value) {
        _qDesc = new Quill(descEl.value, {
          theme: 'snow', placeholder: '상품 설명을 입력해주세요.',
          modules: { toolbar: [[{ header: [1, 2, 3, false] }], ['bold', 'italic', 'underline'], [{ color: [] }, { background: [] }], [{ list: 'ordered' }, { list: 'bullet' }], ['link', 'clean']] }
        });
        if (form.contentHtml) _qDesc.root.innerHTML = form.contentHtml;
        _qDesc.on('text-change', () => { form.contentHtml = _qDesc.root.innerHTML; });
      }
    });
    onBeforeUnmount(() => { if (_qDesc) { form.contentHtml = _qDesc.root.innerHTML; _qDesc = null; } });

    // ── 저장
    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try { await schema.validate(form, { abortEarly: false }); }
      catch (err) { err.inner.forEach(e => { errors[e.path] = e.message; }); props.showToast('입력 내용을 확인해주세요.', 'error'); return; }
      const imgData = images.value.map(({ id, ...rest }) => rest);
      const mainImg = images.value.find(img => img.isMain);
      await window.adminApiCall({
        method: isNew.value ? 'post' : 'put',
        path: `products/${form.prodId}`,
        data: { ...form, optGroups: optGroups.value, skus: skus.value, relatedProductIds: relatedProductIds.value, salePlans: salePlans.value },
        confirmTitle: isNew.value ? '등록' : '저장',
        confirmMsg: isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?',
        showConfirm: props.showConfirm, showToast: props.showToast, setApiRes: props.setApiRes,
        successMsg: isNew.value ? '등록되었습니다.' : '저장되었습니다.',
        onLocal: () => {
          if (isNew.value) {
            props.adminData.products.push({ ...form, productId: props.adminData.nextId(props.adminData.products, 'productId'), price: form.listPrice, stock: useOpt.value ? totalStock.value : form.prodStock, regDate: new Date().toISOString().slice(0, 10), images: imgData, mainImage: mainImg?.previewUrl || '' });
          } else {
            const idx = props.adminData.products.findIndex(x => x.productId == props.editId);
            if (idx !== -1) Object.assign(props.adminData.products[idx], { ...form, price: form.listPrice, stock: useOpt.value ? totalStock.value : form.prodStock, images: imgData, mainImage: mainImg?.previewUrl || '' });
          }
        },
        navigate: props.navigate, navigateTo: 'pdProdMng',
      });
    };

    return {
      isNew, topTab, viewMode2, showTab, form, errors, save,
      useOpt, clearOpt, optGroups, skus, totalStock, generateSkus,
      prodOptCategoryTypeCd, optTypeLevel1Codes, optTypeCodes, optInputTypeCodes, getOptValCodes,
      onCategoryChange, addOptGroup, removeOptGroup, addOptItem, removeOptItem,
      images, addImageByUrl, onFileChange, setMain, removeImage, fileInputRef, triggerFileInput,
      dragImgIdx, dragoverImgIdx, onImgDragStart, onImgDragOver, onImgDrop,
      relatedProductIds, relatedProducts,
      salePlans, planVisible, planAllChecked, addPlanRow, onPlanChange, deletePlanChecked, planRowStyle,
      marginRateCalc, discountRate, descEl,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '상품 등록' : '상품 수정' }}<span v-if="!isNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.prodId }}</span></div>

  <!-- 탭바 -->
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:topTab==='info'}"    :disabled="viewMode2!=='tab'" @click="topTab='info'">📋 기본정보</button>
      <button class="tab-btn" :class="{active:topTab==='option'}"  :disabled="viewMode2!=='tab'" @click="topTab='option'">⚙ 옵션설정</button>
      <button class="tab-btn" :class="{active:topTab==='detail'}"  :disabled="viewMode2!=='tab'" @click="topTab='detail'">📝 상세설정</button>
      <button class="tab-btn" :class="{active:topTab==='image'}"   :disabled="viewMode2!=='tab'" @click="topTab='image'">🖼 이미지 <span class="tab-count">{{ images.length }}</span></button>
      <button class="tab-btn" :class="{active:topTab==='related'}" :disabled="viewMode2!=='tab'" @click="topTab='related'">🔗 연관상품 <span class="tab-count">{{ relatedProducts.length }}</span></button>
      <button class="tab-btn" :class="{active:topTab==='price'}"   :disabled="viewMode2!=='tab'" @click="topTab='price'">💰 가격</button>
    </div>
    <div class="tab-view-modes">
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='tab'}"  @click="viewMode2='tab'"  title="탭">📑</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='1col'}" @click="viewMode2='1col'" title="1열">1▭</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='2col'}" @click="viewMode2='2col'" title="2열">2▭</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='3col'}" @click="viewMode2='3col'" title="3열">3▭</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='4col'}" @click="viewMode2='4col'" title="4열">4▭</button>
    </div>
  </div>
  <div :class="viewMode2!=='tab' ? 'dtl-tab-grid cols-'+viewMode2.charAt(0) : ''">

  <!-- ══════════════════════════════════════
       📋 기본정보  (pd_prod 주요 필드)
  ══════════════════════════════════════ -->
  <div class="card" v-show="showTab('info')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📋 기본정보</div>

    <!-- 상품명 / 상품코드 -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">상품명 <span class="req">*</span></label>
        <input class="form-control" v-model="form.prodNm" placeholder="상품명" :class="errors.prodNm?'is-invalid':''" />
        <span v-if="errors.prodNm" class="field-error">{{ errors.prodNm }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">상품코드 (SKU)</label>
        <input class="form-control" v-model="form.prodCode" placeholder="예: SKU-20260419-001" />
      </div>
    </div>

    <!-- 카테고리 / 브랜드 -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">카테고리</label>
        <select class="form-control" v-model="form.categoryId">
          <option value="">-- 선택 --</option>
          <option v-for="c in (adminData.categories||[])" :key="c.categoryId||c.id" :value="c.categoryId||c.id">{{ c.categoryNm||c.nm||c.name }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">브랜드</label>
        <select class="form-control" v-model="form.brandId">
          <option value="">-- 선택 --</option>
          <option v-for="b in (adminData.brands||[])" :key="b.brandId||b.id" :value="b.brandId||b.id">{{ b.brandNm||b.name }}</option>
        </select>
      </div>
    </div>

    <!-- 업체 / 상품유형 -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">업체</label>
        <select class="form-control" v-model="form.vendorId">
          <option value="">-- 선택 --</option>
          <option v-for="v in (adminData.vendors||[])" :key="v.vendorId||v.id" :value="v.vendorId||v.id">{{ v.vendorNm||v.name }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">상품유형 (prod_type_cd)</label>
        <select class="form-control" v-model="form.prodTypeCd">
          <option value="SINGLE">단일상품 (SINGLE)</option>
          <option value="GROUP">묶음상품 (GROUP)</option>
          <option value="SET">세트상품 (SET)</option>
        </select>
      </div>
    </div>

    <!-- 상태 / 배송템플릿 -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">상태 (prod_status_cd)</label>
        <select class="form-control" v-model="form.prodStatusCd">
          <option value="DRAFT">준비중 (DRAFT)</option>
          <option value="ACTIVE">판매중 (ACTIVE)</option>
          <option value="INACTIVE">판매중지 (INACTIVE)</option>
          <option value="DELETED">삭제 (DELETED)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">배송템플릿 (dliv_tmplt_id)</label>
        <select class="form-control" v-model="form.dlvTmpltId">
          <option value="">-- 선택 --</option>
          <option v-for="t in (adminData.dlvTmplts||adminData.deliveryTemplates||[])" :key="t.dlvTmpltId||t.id" :value="t.dlvTmpltId||t.id">{{ t.dlvTmpltNm||t.name }}</option>
        </select>
      </div>
    </div>

    <!-- 판매기간 -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">판매 시작일시 <span style="color:#aaa;font-size:11px;font-weight:400;">(NULL=즉시)</span></label>
        <input class="form-control" type="datetime-local" v-model="form.saleStartDate" />
      </div>
      <div class="form-group">
        <label class="form-label">판매 종료일시 <span style="color:#aaa;font-size:11px;font-weight:400;">(NULL=무기한)</span></label>
        <input class="form-control" type="datetime-local" v-model="form.saleEndDate" />
      </div>
    </div>

    <!-- 무게 / 사이즈 -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">무게 (kg)</label>
        <input class="form-control" type="number" v-model.number="form.weight" placeholder="예: 0.35" step="0.01" min="0" />
      </div>
      <div class="form-group">
        <label class="form-label">사이즈 (size_info_cd)</label>
        <select class="form-control" v-model="form.sizeInfoCd">
          <option value="">-- 선택 --</option>
          <option v-for="s in ['FREE','XS','S','M','L','XL','XXL']" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
    </div>

    <!-- 체크박스 그룹 -->
    <div style="display:flex;flex-wrap:wrap;gap:20px;padding:14px;background:#f9f9f9;border-radius:8px;border:1px solid #eee;margin-bottom:16px;">
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;">
        <input type="checkbox" :checked="form.isNew_==='Y'" @change="form.isNew_=$event.target.checked?'Y':'N'" />신상품
      </label>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;">
        <input type="checkbox" :checked="form.isBest==='Y'" @change="form.isBest=$event.target.checked?'Y':'N'" />베스트
      </label>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;">
        <input type="checkbox" :checked="form.adltYn==='Y'" @change="form.adltYn=$event.target.checked?'Y':'N'" />성인상품
      </label>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;">
        <input type="checkbox" :checked="form.sameDayDlivYn==='Y'" @change="form.sameDayDlivYn=$event.target.checked?'Y':'N'" />당일배송
      </label>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;">
        <input type="checkbox" :checked="form.soldOutYn==='Y'" @change="form.soldOutYn=$event.target.checked?'Y':'N'" style="accent-color:#e8587a;" />
        <span style="color:#e8587a;">강제품절</span>
      </label>
    </div>

    <div class="form-actions">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('pdProdMng')">취소</button>
    </div>
  </div>

  <!-- ══════════════════════════════════════
       ⚙ 옵션설정  (pd_prod_opt / pd_prod_opt_item / pd_prod_sku)
  ══════════════════════════════════════ -->
  <div class="card" v-show="showTab('option')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">⚙ 옵션설정</div>

    <!-- 옵션 사용 토글 + OPT_TYPE 2레벨 트리 선택 -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;padding:12px 14px;background:#f9f9f9;border-radius:8px;border:1px solid #eee;">

      <!-- 옵션 사용 체크박스 -->
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;font-weight:600;flex-shrink:0;">
        <input type="checkbox" v-model="useOpt" @change="!useOpt && clearOpt()" style="width:16px;height:16px;" />
        옵션 사용
      </label>
      <span v-if="!useOpt" style="font-size:12px;color:#888;">미사용 시 상품 단위 단일 재고 관리</span>

      <template v-if="useOpt">
        <span style="font-size:11px;color:#ddd;flex-shrink:0;">│</span>

        <!-- STEP 1: OPT_TYPE 1레벨 (카테고리) 선택 — pd_prod_opt.opt_type_cd 레벨 1 -->
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:12px;color:#555;font-weight:600;flex-shrink:0;">옵션 카테고리</span>
          <select class="form-control" v-model="prodOptCategoryTypeCd"
            style="width:170px;font-size:12px;"
            @change="onCategoryChange">
            <option value="">-- OPT_TYPE 1레벨 선택 --</option>
            <option v-for="c in optTypeLevel1Codes" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
          </select>
        </div>

        <!-- STEP 2: OPT_TYPE 2레벨 (1단/2단 유형) — 1레벨 선택 후 활성화 -->
        <template v-if="prodOptCategoryTypeCd && optGroups.length>0">
          <span style="font-size:11px;color:#ddd;flex-shrink:0;">│</span>
          <div v-for="(grp, gi) in optGroups" :key="'typeCd-'+grp._id"
            style="display:flex;align-items:center;gap:6px;">
            <span class="badge badge-blue" style="font-size:11px;flex-shrink:0;">{{ gi+1 }}단 유형</span>
            <select class="form-control" v-model="grp.typeCd" style="width:140px;font-size:12px;"
              @change="grp.items.forEach(i=>{i.val='';i.valCodeId='';})"
              <option value="">-- OPT_TYPE 2레벨 --</option>
              <option v-for="c in optTypeCodes" :key="c.codeId" :value="c.codeValue">{{ c.codeLabel }} ({{ c.codeValue }})</option>
            </select>
            <span v-if="grp.typeCd" style="font-size:11px;color:#1677ff;">{{ getOptValCodes(grp.typeCd).length }}개 프리셋</span>
          </div>
        </template>
        <span v-if="!prodOptCategoryTypeCd" style="font-size:12px;color:#f5a623;">← 옵션 카테고리를 먼저 선택하세요</span>
        <span v-else-if="optGroups.length===0" style="font-size:12px;color:#1677ff;">카테고리 선택 후 + 차원 추가로 1단·2단 설정</span>
      </template>
    </div>

    <!-- 옵션 미사용: 단일 재고 -->
    <template v-if="!useOpt">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">재고수량 (prod_stock)</label>
          <input class="form-control" type="number" v-model.number="form.prodStock" placeholder="0" min="0" style="width:160px;" />
        </div>
        <div class="form-group"></div>
      </div>
    </template>

    <!-- 옵션 사용 -->
    <template v-else>

      <!-- 옵션 차원 헤더 -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div style="font-size:13px;font-weight:700;">
          옵션 차원 <span style="color:#888;font-weight:400;font-size:11px;">(pd_prod_opt, 최대 2단)</span>
        </div>
        <button class="btn btn-sm btn-secondary" @click="addOptGroup" :disabled="optGroups.length>=2">+ 차원 추가</button>
      </div>

      <!-- 차원별 블록 -->
      <div v-for="(grp, gi) in optGroups" :key="grp._id"
        style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;margin-bottom:16px;background:#fafafa;">

        <!-- 차원 설정 행 (typeCd는 위 "옵션사용" 행에서 관리) -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
          <span class="badge badge-blue" style="flex-shrink:0;font-size:12px;">{{ grp.level }}단</span>
          <span v-if="grp.typeCd" class="badge badge-gray" style="font-size:11px;flex-shrink:0;">{{ optTypeCodes.find(c=>c.codeValue===grp.typeCd)?.codeLabel||grp.typeCd }}</span>
          <input class="form-control" v-model="grp.grpNm" placeholder="옵션명 (예: 색상)"
            style="flex:1;min-width:100px;font-size:13px;" />
          <select class="form-control" v-model="grp.inputTypeCd" style="width:160px;font-size:12px;">
            <option v-for="c in optInputTypeCodes" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
          </select>
          <button class="btn btn-xs btn-danger" @click="removeOptGroup(gi)">삭제</button>
        </div>

        <!-- 옵션 값 테이블 (pd_prod_opt_item) -->
        <div style="font-size:11px;color:#888;margin-bottom:6px;">
          옵션 값 목록 (pd_prod_opt_item)
          <span v-if="grp.typeCd && getOptValCodes(grp.typeCd).length>0" style="color:#1677ff;margin-left:6px;">
            공통코드 opt_val: <strong>{{ getOptValCodes(grp.typeCd).length }}</strong>개 프리셋 사용 가능
          </span>
          <span v-else-if="grp.typeCd==='CUSTOM'||!grp.typeCd" style="color:#888;margin-left:6px;">직접 입력 모드 — 프리셋 없음</span>
        </div>
        <table class="admin-table" style="font-size:12px;margin-bottom:8px;">
          <thead>
            <tr>
              <th style="width:28px;">#</th>
              <th v-if="grp.level===2 && optGroups[0]?.items.length>0" style="width:110px;">
                상위 옵션값 <span style="color:#aaa;font-size:10px;">(parent_opt_item_id)</span>
              </th>
              <th>표시명 (opt_nm)</th>
              <th style="width:150px;">공통코드ID (opt_val_code_id) <span style="color:#aaa;font-size:10px;">선택→opt_val 자동</span></th>
              <th style="width:130px;">저장값 (opt_val) <span style="color:#aaa;font-size:10px;">직접입력 가능</span></th>
              <th style="width:46px;">사용</th>
              <th style="width:38px;">삭제</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, ii) in grp.items" :key="item._id">
              <td style="text-align:center;color:#aaa;">{{ ii+1 }}</td>

              <!-- 2단: 상위 옵션값 select (parent_opt_item_id) -->
              <td v-if="grp.level===2 && optGroups[0]?.items.length>0">
                <select class="form-control" v-model="item.parentOptItemId" style="font-size:11px;">
                  <option value="">-- 전체 공통 --</option>
                  <option v-for="p1 in (optGroups[0]?.items||[])" :key="p1._id" :value="String(p1._id)">{{ p1.nm||'(미입력)' }}</option>
                </select>
              </td>

              <!-- 표시명 (opt_nm) -->
              <td><input class="form-control" v-model="item.nm" placeholder="예: 블랙" style="font-size:12px;" @blur="generateSkus" /></td>

              <!-- 공통코드ID (opt_val_code_id) — OPT_VAL select, 선택 시 opt_val + opt_nm 자동 채움 -->
              <td>
                <select class="form-control" v-model="item.valCodeId" style="font-size:12px;"
                  @change="() => { const found = getOptValCodes(grp.typeCd).find(c => c.codeValue === item.valCodeId); if (found) { item.val = found.codeValue; if (!item.nm) item.nm = found.codeLabel; generateSkus(); } else { item.val = ''; } }">
                  <option value="">-- 선택 (직접입력 시 비워두기) --</option>
                  <option v-for="c in getOptValCodes(grp.typeCd)" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }} ({{ c.codeValue }})</option>
                </select>
              </td>

              <!-- 저장값 (opt_val) — input, 공통코드 선택 시 자동 채움 + 수동 수정 가능 -->
              <td>
                <input class="form-control" v-model="item.val"
                  :placeholder="item.valCodeId ? '코드 선택으로 자동입력' : '직접입력 (예: MY_VAL)'"
                  style="font-size:12px;"
                  @blur="generateSkus" />
              </td>

              <td style="text-align:center;">
                <input type="checkbox" :checked="item.useYn==='Y'"
                  @change="item.useYn=$event.target.checked?'Y':'N'; generateSkus()" />
              </td>
              <td style="text-align:center;">
                <button class="btn btn-xs btn-danger" @click="removeOptItem(grp, ii)">✕</button>
              </td>
            </tr>
            <tr v-if="grp.items.length===0">
              <td :colspan="grp.level===2&&optGroups[0]?.items.length>0?7:6" style="text-align:center;color:#bbb;padding:12px;font-size:12px;">값을 추가해주세요.</td>
            </tr>
          </tbody>
        </table>
        <button class="btn btn-xs btn-secondary" @click="addOptItem(grp)">+ 값 추가</button>
      </div>

      <!-- SKU 테이블 (pd_prod_sku) -->
      <div v-if="optGroups.length > 0" style="margin-top:20px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div style="font-size:13px;font-weight:700;">
            SKU 목록 <span style="color:#888;font-weight:400;font-size:11px;">(pd_prod_sku)</span>
            <span class="badge badge-blue" style="margin-left:8px;">{{ skus.filter(s=>s.useYn==='Y').length }}개</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:12px;color:#555;">총 재고: <strong>{{ totalStock }}</strong>개</span>
            <button class="btn btn-sm btn-secondary" @click="generateSkus">🔄 SKU 재생성</button>
          </div>
        </div>
        <div style="overflow-x:auto;">
          <table class="admin-table" style="font-size:12px;">
            <thead>
              <tr>
                <th>{{ optGroups[0]?.grpNm||'옵션1' }} (opt_item_id_1)</th>
                <th v-if="optGroups.length>1">{{ optGroups[1]?.grpNm||'옵션2' }} (opt_item_id_2)</th>
                <th style="width:120px;">SKU코드 (sku_code)</th>
                <th style="width:90px;">추가금액 (add_price)</th>
                <th style="width:80px;">재고 (stock)</th>
                <th style="width:48px;">사용</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sku in skus" :key="sku._id" :style="sku.useYn==='N'?'opacity:0.4;background:#f5f5f5;':''">
                <td><span class="badge badge-gray" style="font-size:11px;">{{ sku._nm1 }}</span></td>
                <td v-if="optGroups.length>1"><span class="badge badge-blue" style="font-size:11px;">{{ sku._nm2 }}</span></td>
                <td><input class="form-control" v-model="sku.skuCode" placeholder="SKU-XXX" style="font-size:11px;" /></td>
                <td><input class="form-control" type="number" v-model.number="sku.addPrice" placeholder="0" style="font-size:11px;text-align:right;" /></td>
                <td><input class="form-control" type="number" v-model.number="sku.stock" placeholder="0" min="0" style="font-size:11px;text-align:right;" /></td>
                <td style="text-align:center;">
                  <input type="checkbox" :checked="sku.useYn==='Y'" @change="sku.useYn=$event.target.checked?'Y':'N'" />
                </td>
              </tr>
              <tr v-if="skus.length===0">
                <td :colspan="optGroups.length>1?6:5" style="text-align:center;color:#bbb;padding:16px;font-size:12px;">
                  옵션 값 입력 후 [🔄 SKU 재생성]을 눌러주세요.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <div class="form-actions" style="margin-top:16px;">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('pdProdMng')">취소</button>
    </div>
  </div>

  <!-- ══════════════════════════════════════
       📝 상세설정  (content / advrt / 구매제한 / 혜택)
  ══════════════════════════════════════ -->
  <div class="card" v-show="showTab('detail')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📝 상세설정</div>

    <!-- 상품 설명 (content_html) -->
    <div style="font-size:13px;font-weight:700;color:#333;margin-bottom:8px;">
      상품 설명 <span style="color:#aaa;font-size:11px;font-weight:400;">(content_html — pd_prod_content 다중탭 사용 시 별도 관리)</span>
    </div>
    <div class="form-group">
      <div ref="descEl" style="min-height:220px;background:#fff;"></div>
    </div>

    <!-- 홍보문구 -->
    <div style="font-size:13px;font-weight:700;color:#333;margin:24px 0 8px;">홍보문구 (advrt_stmt)</div>
    <div class="form-group">
      <input class="form-control" v-model="form.advrtStmt" placeholder="예: 이번 주 한정 20% 할인!" maxlength="500" />
      <div style="font-size:11px;color:#aaa;text-align:right;margin-top:2px;">{{ (form.advrtStmt||'').length }} / 500</div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">노출 시작 (advrt_start_date)</label>
        <input class="form-control" type="datetime-local" v-model="form.advrtStartDate" />
      </div>
      <div class="form-group">
        <label class="form-label">노출 종료 (advrt_end_date)</label>
        <input class="form-control" type="datetime-local" v-model="form.advrtEndDate" />
      </div>
    </div>

    <!-- 구매 제한 -->
    <div style="font-size:13px;font-weight:700;color:#333;margin:24px 0 8px;">
      구매 제한 <span style="color:#aaa;font-size:11px;font-weight:400;">(NULL = 무제한)</span>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">최소구매수량 (min_buy_qty)</label>
        <input class="form-control" type="number" v-model.number="form.minBuyQty" placeholder="1" min="1" />
      </div>
      <div class="form-group">
        <label class="form-label">1회 최대구매수량 (max_buy_qty)</label>
        <input class="form-control" type="number" v-model.number="form.maxBuyQty" placeholder="무제한" min="1" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">1일 최대구매수량 (day_max_buy_qty)</label>
        <input class="form-control" type="number" v-model.number="form.dayMaxBuyQty" placeholder="무제한" min="1" />
      </div>
      <div class="form-group">
        <label class="form-label">ID당 누적 최대 (id_max_buy_qty)</label>
        <input class="form-control" type="number" v-model.number="form.idMaxBuyQty" placeholder="무제한" min="1" />
      </div>
    </div>

    <!-- 혜택 적용 여부 -->
    <div style="font-size:13px;font-weight:700;color:#333;margin:24px 0 8px;">혜택 적용 여부</div>
    <div style="display:flex;gap:24px;padding:14px;background:#f9f9f9;border-radius:8px;border:1px solid #eee;flex-wrap:wrap;">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;">
        <input type="checkbox" :checked="form.couponUseYn==='Y'" @change="form.couponUseYn=$event.target.checked?'Y':'N'" />
        쿠폰 사용 가능 (coupon_use_yn)
      </label>
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;">
        <input type="checkbox" :checked="form.saveUseYn==='Y'" @change="form.saveUseYn=$event.target.checked?'Y':'N'" />
        적립금 사용 가능 (save_use_yn)
      </label>
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;">
        <input type="checkbox" :checked="form.discntUseYn==='Y'" @change="form.discntUseYn=$event.target.checked?'Y':'N'" />
        할인 적용 가능 (discnt_use_yn)
      </label>
    </div>

    <div class="form-actions" style="margin-top:20px;">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('pdProdMng')">취소</button>
    </div>
  </div>

  <!-- ══════════════════════════════════════
       🖼 이미지  (pd_prod_img)
  ══════════════════════════════════════ -->
  <div class="card" v-show="showTab('image')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">🖼 이미지</div>
    <input type="file" ref="fileInputRef" multiple accept="image/*" style="display:none" @change="onFileChange" />
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;">
      <button class="btn btn-secondary" @click="triggerFileInput">+ 파일 선택</button>
      <button class="btn btn-secondary" @click="addImageByUrl">+ URL 입력</button>
      <span style="font-size:12px;color:#aaa;">{{ images.length }}개</span>
    </div>
    <div v-if="images.length===0"
      style="border:2px dashed #e0e0e0;border-radius:10px;padding:40px;text-align:center;color:#bbb;font-size:13px;cursor:pointer;"
      @click="triggerFileInput">클릭하거나 파일을 끌어다 놓으세요</div>
    <div v-for="(img, idx) in images" :key="img.id"
      draggable="true"
      @dragstart="onImgDragStart(idx)"
      @dragover.prevent="onImgDragOver(idx)"
      @drop.prevent="onImgDrop()"
      @dragend="dragImgIdx=null;dragoverImgIdx=null"
      style="display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid #e8e8e8;border-radius:10px;margin-bottom:10px;background:#fff;transition:border-color 0.15s,background 0.15s;"
      :style="img.isMain ? 'border-color:#e8587a;background:#fff8f9;' : (dragoverImgIdx===idx && dragImgIdx!==idx ? 'border-color:#1677ff;background:#e6f4ff;' : '')">

      <!-- 드래그 핸들 -->
      <div style="flex-shrink:0;display:flex;align-items:center;justify-content:center;width:20px;height:90px;cursor:grab;color:#ccc;font-size:15px;user-select:none;letter-spacing:-2px;" title="드래그로 순서 변경">⋮⋮</div>

      <!-- 썸네일 -->
      <div style="flex-shrink:0;width:90px;height:90px;border-radius:8px;overflow:hidden;background:#f5f5f5;border:1px solid #e0e0e0;display:flex;align-items:center;justify-content:center;">
        <img v-if="img.previewUrl" :src="img.previewUrl" style="width:100%;height:100%;object-fit:cover;" />
        <span v-else style="font-size:11px;color:#bbb;text-align:center;">미리보기 없음</span>
      </div>

      <!-- 입력 영역 -->
      <div style="flex:1;min-width:0;">
        <div v-if="!img.previewUrl||img.previewUrl.startsWith('http')" class="form-group" style="margin-bottom:8px;">
          <label class="form-label" style="font-size:11px;">이미지 URL</label>
          <input class="form-control" v-model="img.previewUrl" placeholder="https://..." style="font-size:12px;" />
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <!-- opt_item_id_1: 옵션 1단 select -->
          <div class="form-group" style="flex:1;min-width:140px;margin-bottom:4px;">
            <label class="form-label" style="font-size:11px;">opt_item_id_1 <span style="color:#aaa;">(NULL=공통)</span></label>
            <select class="form-control" v-model="img.optItemId1" style="font-size:12px;" @change="img.optItemId2=''">
              <option value="">-- 공통 (NULL) --</option>
              <option v-if="!optGroups[0]||optGroups[0].items.length===0" disabled value="">옵션설정 탭에서 1단 옵션을 먼저 추가하세요</option>
              <option v-for="item in (optGroups[0]?.items||[])" :key="item._id" :value="item.val||String(item._id)">{{ item.nm + (item.val ? ' (' + item.val + ')' : '') }}</option>
            </select>
          </div>
          <!-- opt_item_id_2: 옵션 2단 select (1단 선택 후 연동) -->
          <div class="form-group" style="flex:1;min-width:140px;margin-bottom:4px;">
            <label class="form-label" style="font-size:11px;">opt_item_id_2 <span style="color:#aaa;">(NULL=옵션1 공통)</span></label>
            <select class="form-control" v-model="img.optItemId2" style="font-size:12px;" :disabled="!img.optItemId1&&optGroups.length<2">
              <option value="">-- 공통 (NULL) --</option>
              <option v-if="!optGroups[1]||optGroups[1].items.length===0" disabled value="">2단 옵션 없음</option>
              <option v-for="item in (optGroups[1]?.items||[])" :key="item._id" :value="item.val||String(item._id)">{{ item.nm + (item.val ? ' (' + item.val + ')' : '') }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 우측 버튼 -->
      <div style="flex-shrink:0;display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
        <button v-if="!img.isMain" class="btn btn-sm btn-secondary" @click="setMain(img.id)" style="font-size:11px;">대표 설정</button>
        <span v-else style="font-size:11px;font-weight:700;color:#e8587a;padding:4px 8px;background:#fde8ee;border-radius:4px;">★ 대표</span>
        <button class="btn btn-sm btn-danger" @click="removeImage(img.id)" style="font-size:11px;">삭제</button>
        <span style="font-size:11px;color:#bbb;">{{ idx+1 }}/{{ images.length }}</span>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('pdProdMng')">취소</button>
    </div>
  </div>

  <!-- ══════════════════════════════════════
       🔗 연관상품
  ══════════════════════════════════════ -->
  <div class="card" v-show="showTab('related')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">🔗 연관상품</div>
    <div class="form-group">
      <label class="form-label">연관 상품 ID (쉼표 구분)</label>
      <input class="form-control" v-model="relatedProductIds" placeholder="1, 2, 3" />
    </div>
    <table class="admin-table" v-if="relatedProducts.length" style="margin-top:12px;">
      <thead><tr><th>ID</th><th>상품명</th><th>카테고리</th><th>가격</th><th>재고</th><th>상태</th><th>관리</th></tr></thead>
      <tbody>
        <tr v-for="p in relatedProducts" :key="p.productId">
          <td>{{ p.productId }}</td>
          <td><span class="ref-link" @click="showRefModal('product', p.productId)">{{ p.prodNm }}</span></td>
          <td>{{ p.category }}</td>
          <td>{{ (p.price||0).toLocaleString() }}원</td>
          <td>{{ p.stock }}개</td>
          <td>{{ p.status }}</td>
          <td><button class="btn btn-blue btn-sm" @click="navigate('pdProdDtl',{id:p.productId})">수정</button></td>
        </tr>
      </tbody>
    </table>
    <div v-else-if="!relatedProductIds" style="text-align:center;color:#aaa;padding:30px;font-size:13px;">연관 상품 ID를 입력하세요.</div>
    <div class="form-actions">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('pdProdMng')">취소</button>
    </div>
  </div>

  <!-- ══════════════════════════════════════
       💰 가격  (pd_prod 가격 필드 + 판매계획)
  ══════════════════════════════════════ -->
  <div class="card" v-show="showTab('price')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">💰 가격</div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">정가 (list_price) <span class="req">*</span></label>
        <input class="form-control" type="number" v-model.number="form.listPrice" placeholder="0" min="0" :class="errors.listPrice?'is-invalid':''" />
        <span v-if="errors.listPrice" class="field-error">{{ errors.listPrice }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">판매가 (sale_price) <span class="req">*</span></label>
        <input class="form-control" type="number" v-model.number="form.salePrice" placeholder="0" min="0" :class="errors.salePrice?'is-invalid':''" />
        <span v-if="errors.salePrice" class="field-error">{{ errors.salePrice }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">매입가 / 원가 (purchase_price) <span style="color:#aaa;font-size:11px;">내부관리용</span></label>
        <input class="form-control" type="number" v-model.number="form.purchasePrice" placeholder="(선택)" />
      </div>
      <div class="form-group">
        <label class="form-label">마진율 (margin_rate)</label>
        <div class="form-control" :style="{ background:'#f5f5f5', color: marginRateCalc ? '#389e0d' : '#bbb' }">
          {{ marginRateCalc ? marginRateCalc + '%' : '(매입가 입력 시 자동 계산)' }}
        </div>
      </div>
    </div>

    <!-- 가격 요약 카드 -->
    <div style="padding:16px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8;margin-bottom:16px;">
      <div style="font-size:12px;font-weight:600;color:#555;margin-bottom:12px;">가격 요약</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;text-align:center;">
        <div>
          <div style="font-size:18px;font-weight:700;">{{ (form.listPrice||0).toLocaleString() }}원</div>
          <div style="font-size:11px;color:#888;margin-top:2px;">정가</div>
        </div>
        <div>
          <div style="font-size:18px;font-weight:700;color:#e8587a;">{{ (form.salePrice||0).toLocaleString() }}원</div>
          <div style="font-size:11px;color:#888;margin-top:2px;">판매가</div>
        </div>
        <div>
          <div style="font-size:18px;font-weight:700;color:#f5222d;">{{ discountRate }}%</div>
          <div style="font-size:11px;color:#888;margin-top:2px;">할인율</div>
        </div>
        <div>
          <div style="font-size:18px;font-weight:700;color:#52c41a;">{{ marginRateCalc ? marginRateCalc + '%' : '-' }}</div>
          <div style="font-size:11px;color:#888;margin-top:2px;">마진율</div>
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('pdProdMng')">취소</button>
    </div>

    <!-- 판매계획 -->
    <div style="margin-top:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div style="font-size:13px;font-weight:700;">판매계획 <span style="font-size:12px;font-weight:400;color:#888;">{{ planVisible.length }}건</span></div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-sm btn-danger"    @click="deletePlanChecked">체크삭제</button>
          <button class="btn btn-sm btn-secondary" @click="addPlanRow">행추가</button>
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table class="admin-table" style="min-width:860px;font-size:12px;">
          <thead>
            <tr>
              <th style="width:36px;"><input type="checkbox" :checked="planAllChecked" @change="e=>planAllChecked=e.target.checked" /></th>
              <th style="width:140px;">시작일시</th>
              <th style="width:140px;">종료일시</th>
              <th style="width:80px;">상태</th>
              <th style="width:90px;">정가</th>
              <th style="width:90px;">판매가</th>
              <th style="width:80px;">매입가</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in planVisible" :key="row._id" :style="planRowStyle(row._row_status)">
              <td style="text-align:center;"><input type="checkbox" v-model="row._checked" /></td>
              <td>
                <div style="display:flex;gap:2px;">
                  <input type="date" v-model="row.startDate" @change="onPlanChange(row)" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;width:104px;" />
                  <input type="time" v-model="row.startTime" @change="onPlanChange(row)" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;width:64px;" />
                </div>
              </td>
              <td>
                <div style="display:flex;gap:2px;">
                  <input type="date" v-model="row.endDate" @change="onPlanChange(row)" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;width:104px;" />
                  <input type="time" v-model="row.endTime" @change="onPlanChange(row)" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;width:64px;" />
                </div>
              </td>
              <td>
                <select v-model="row.planStatus" @change="onPlanChange(row)" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;width:100%;">
                  <option>준비중</option><option>판매예정</option><option>판매중</option><option>판매중지</option><option>판매종료</option>
                </select>
              </td>
              <td><input type="number" v-model.number="row.listPrice"     @input="onPlanChange(row)" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;width:100%;text-align:right;" /></td>
              <td><input type="number" v-model.number="row.salePrice"     @input="onPlanChange(row)" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;width:100%;text-align:right;" /></td>
              <td><input type="number" v-model.number="row.purchasePrice" @input="onPlanChange(row)" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;width:100%;text-align:right;" /></td>
            </tr>
            <tr v-if="planVisible.length===0">
              <td colspan="7" style="text-align:center;color:#aaa;padding:16px;">[행추가]로 판매계획을 추가하세요.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="margin-top:8px;display:flex;gap:8px;font-size:11px;color:#aaa;align-items:center;">
        <span style="background:#f6ffed;border:1px solid #b7eb8f;border-radius:3px;padding:1px 6px;color:#389e0d;">I 신규</span>
        <span style="background:#fffbe6;border:1px solid #ffe58f;border-radius:3px;padding:1px 6px;color:#d46b08;">U 수정</span>
        <span style="background:#fff1f0;border:1px solid #ffa39e;border-radius:3px;padding:1px 6px;color:#cf1322;">D 삭제예정</span>
      </div>
    </div>
  </div>

  </div><!-- /dtl-tab-grid -->

  <!-- 이력 -->
  <div v-if="!isNew" style="margin-top:20px;">
    <pd-prod-hist :prod-id="editId" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" />
  </div>
</div>
`
};
