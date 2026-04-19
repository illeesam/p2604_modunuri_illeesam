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
      mdUserId: '',
      prodTypeCd: 'SINGLE', prodStatusCd: 'DRAFT', unsaleMsg: '',
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
    const optGroups = reactive([]); // [{_id, grpNm, typeCd, inputTypeCd, level, items:[{_id, nm, val, valCodeId, parentOptItemId, sortOrd, useYn}]}]
    const skus = reactive([]);      // [{_id, _optKey, _nm1, _nm2, skuCode, addPrice, stock, useYn}]
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

    const clearOpt = () => { optGroups.length = 0; skus.length = 0; prodOptCategoryTypeCd.value = ''; };

    const onCategoryChange = () => {
      optGroups.length = 0;
      skus.length = 0;
      optTypeCodes.value.slice(0, 2).forEach((tc, i) => {
        optGroups.push({ _id: _optSeq++, grpNm: '', typeCd: tc.codeValue, inputTypeCd: 'SELECT', level: i + 1, items: [] });
      });
    };

    const addOptGroup = () => {
      if (!prodOptCategoryTypeCd.value) { props.showToast('옵션 카테고리를 먼저 선택해주세요.', 'error'); return; }
      if (optGroups.length >= 2) { props.showToast('옵션은 최대 2단까지 가능합니다.', 'error'); return; }
      const defaultTypeCd = optTypeCodes.value[optGroups.length]?.codeValue || '';
      optGroups.push({ _id: _optSeq++, grpNm: '', typeCd: defaultTypeCd, inputTypeCd: 'SELECT', level: optGroups.length + 1, items: [] });
    };
    const removeOptGroup = (idx) => {
      optGroups.splice(idx, 1);
      optGroups.forEach((g, i) => { g.level = i + 1; });
      generateSkus();
    };
    const addOptItem = (grp) => {
      grp.items.push({ _id: _itemSeq++, nm: '', val: '', valCodeId: '', parentOptItemId: '', sortOrd: grp.items.length + 1, useYn: 'Y' });
    };
    const removeOptItem = (grp, idx) => { grp.items.splice(idx, 1); generateSkus(); };

    // ── 옵션 아이템 드래그 정렬
    const dragOptGrpId       = ref(null);
    const dragOptItemIdx     = ref(null);
    const dragoverOptItemIdx = ref(null);
    const onOptItemDragStart = (grp, idx) => { dragOptGrpId.value = grp._id; dragOptItemIdx.value = idx; };
    const onOptItemDragOver  = (grp, idx) => { if (dragOptGrpId.value === grp._id) dragoverOptItemIdx.value = idx; };
    const onOptItemDrop      = (grp) => {
      if (dragOptItemIdx.value === null || dragOptItemIdx.value === dragoverOptItemIdx.value) { dragOptGrpId.value = null; dragOptItemIdx.value = null; dragoverOptItemIdx.value = null; return; }
      const items = [...grp.items];
      const [moved] = items.splice(dragOptItemIdx.value, 1);
      items.splice(dragoverOptItemIdx.value, 0, moved);
      grp.items = items;
      dragOptGrpId.value = null; dragOptItemIdx.value = null; dragoverOptItemIdx.value = null;
      generateSkus();
    };

    const generateSkus = () => {
      if (optGroups.length === 0) { skus.length = 0; return; }
      const g1 = optGroups[0]?.items.filter(i => i.useYn === 'Y' && i.nm.trim()) || [];
      const g2 = optGroups[1]?.items.filter(i => i.useYn === 'Y' && i.nm.trim()) || [];
      const existMap = {};
      skus.forEach(s => { existMap[s._optKey] = s; });
      const newSkus = [];
      if (g2.length === 0) {
        g1.forEach(i1 => {
          const key = String(i1._id);
          newSkus.push(existMap[key]
            ? { ...existMap[key], _nm1: i1.nm, _nm2: '' }
            : { _id: 'sku_' + i1._id, _optKey: key, _nm1: i1.nm, _nm2: '', skuCode: '', addPrice: 0, stock: 0, useYn: 'Y', statusCd: 'ON_SALE', saleCnt: 0 });
        });
      } else {
        g1.forEach(i1 => g2.forEach(i2 => {
          const key = i1._id + '_' + i2._id;
          newSkus.push(existMap[key]
            ? { ...existMap[key], _nm1: i1.nm, _nm2: i2.nm }
            : { _id: 'sku_' + key, _optKey: key, _nm1: i1.nm, _nm2: i2.nm, skuCode: '', addPrice: 0, stock: 0, useYn: 'Y', statusCd: 'ON_SALE', saleCnt: 0 });
        }));
      }
      skus.splice(0, skus.length, ...newSkus);
    };
    const totalStock = computed(() => skus.filter(s => s.useYn === 'Y').reduce((a, s) => a + (Number(s.stock) || 0), 0));

    // ── SKU 필터 (1단/2단/재고)
    const skuFilter1     = ref('');
    const skuFilter2     = ref('');
    const skuFilterStock = ref(''); // '' | 'in' | 'out'
    const skuFilter1Options = computed(() => [...new Set(skus.map(s => s._nm1).filter(Boolean))]);
    const skuFilter2Options = computed(() => {
      const base = skuFilter1.value ? skus.filter(s => s._nm1 === skuFilter1.value) : skus;
      return [...new Set(base.map(s => s._nm2).filter(Boolean))];
    });
    const skusFiltered = computed(() => skus.filter(s => {
      if (skuFilter1.value     && s._nm1 !== skuFilter1.value) return false;
      if (skuFilter2.value     && s._nm2 !== skuFilter2.value) return false;
      if (skuFilterStock.value === 'in'  && (s.stock || 0) <= 0) return false;
      if (skuFilterStock.value === 'out' && (s.stock || 0) >  0) return false;
      return true;
    }));

    // ── 이미지
    const images = reactive([]);
    let imgIdSeq = 1;
    const fileInputRef = ref(null);
    const triggerFileInput = () => fileInputRef.value?.click();
    const addImageByUrl = () => images.push({ id: imgIdSeq++, previewUrl: '', isMain: images.length === 0, optItemId1: '', optItemId2: '' });
    const onFileChange = (e) => {
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => images.push({ id: imgIdSeq++, previewUrl: ev.target.result, isMain: images.length === 0, optItemId1: '', optItemId2: '' });
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    };
    const setMain = (id) => images.forEach(img => { img.isMain = img.id === id; });
    const removeImage = (id) => {
      const idx = images.findIndex(img => img.id === id);
      if (idx !== -1) { const wasMain = images[idx].isMain; images.splice(idx, 1); if (wasMain && images.length) images[0].isMain = true; }
    };

    // ── 이미지 드래그 정렬
    const dragImgIdx = ref(null);
    const dragoverImgIdx = ref(null);
    const onImgDragStart = (idx) => { dragImgIdx.value = idx; };
    const onImgDragOver  = (idx) => { dragoverImgIdx.value = idx; };
    const onImgDrop = () => {
      if (dragImgIdx.value === null || dragImgIdx.value === dragoverImgIdx.value) { dragImgIdx.value = null; dragoverImgIdx.value = null; return; }
      const items = [...images];
      const [moved] = items.splice(dragImgIdx.value, 1);
      items.splice(dragoverImgIdx.value, 0, moved);
      images.splice(0, images.length, ...items);
      dragImgIdx.value = null;
      dragoverImgIdx.value = null;
    };

    // ── 상품설명 블록 (contentBlocks)
    const contentBlocks = reactive([]);
    let _blockSeq = 1;
    const _blockQuills = {};
    const addContentBlock = (type) => {
      contentBlocks.push({ _id: _blockSeq++, type, content: '', fileName: '' });
      if (type === 'html') {
        nextTick(() => {
          const el = document.getElementById('quill-block-' + (contentBlocks.at(-1)._id));
          if (el && !_blockQuills[contentBlocks.at(-1)._id]) {
            const block = contentBlocks.at(-1);
            const q = new Quill(el, { theme: 'snow', placeholder: '내용을 입력해주세요.',
              modules: { toolbar: [[{ header: [1,2,3,false] }], ['bold','italic','underline'],[{color:[]},{background:[]}],[{list:'ordered'},{list:'bullet'}],['link','image','clean']] } });
            _blockQuills[block._id] = q;
            q.on('text-change', () => { block.content = q.root.innerHTML; });
          }
        });
      }
    };
    const removeContentBlock = (idx) => {
      const block = contentBlocks[idx];
      delete _blockQuills[block._id];
      contentBlocks.splice(idx, 1);
    };
    const onBlockFileChange = (block, e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => { block.content = ev.target.result; block.fileName = file.name; };
      reader.readAsDataURL(file); e.target.value = '';
    };
    const dragBlockIdx = ref(null);
    const dragoverBlockIdx = ref(null);
    const onBlockDragStart = (idx) => { dragBlockIdx.value = idx; };
    const onBlockDragOver  = (idx) => { dragoverBlockIdx.value = idx; };
    const onBlockDrop = () => {
      if (dragBlockIdx.value === null || dragBlockIdx.value === dragoverBlockIdx.value) { dragBlockIdx.value = null; dragoverBlockIdx.value = null; return; }
      const items = [...contentBlocks];
      const [moved] = items.splice(dragBlockIdx.value, 1);
      items.splice(dragoverBlockIdx.value, 0, moved);
      contentBlocks.splice(0, contentBlocks.length, ...items);
      dragBlockIdx.value = null; dragoverBlockIdx.value = null;
    };
    // ── 스플릿 패널 + 미리보기
    const splitPct = ref(65);
    const previewDevice = ref('pc');
    const isDraggingDivider = ref(false);
    const contentSplitRef = ref(null);
    const onDividerMousedown = (e) => { isDraggingDivider.value = true; e.preventDefault(); };
    let _divMoveH = null, _divUpH = null;

    // ── 계산값
    const marginRateCalc = computed(() => {
      if (!form.salePrice || !form.purchasePrice) return null;
      return ((form.salePrice - form.purchasePrice) / form.salePrice * 100).toFixed(2);
    });
    const discountRate = computed(() => {
      if (!form.listPrice || form.listPrice <= 0) return 0;
      return Math.round((1 - form.salePrice / form.listPrice) * 100);
    });

    // ── 연관상품 / 코드상품
    let _relSeq = 1;
    const relProds  = reactive([]);  // [{ _id, productId, prodNm, category, price, stock, status }]
    const codeProds = reactive([]);  // 동일 구조

    // 상품 추가 피커 모달
    const prodPickerOpen   = ref(''); // '' | 'rel' | 'code'
    const prodPickerSearch = ref('');
    const prodPickerList   = computed(() => {
      const q    = prodPickerSearch.value.trim().toLowerCase();
      const all  = props.adminData.products || [];
      const used = (prodPickerOpen.value === 'rel' ? relProds : codeProds).map(r => r.productId);
      return all.filter(p => {
        if (used.includes(p.productId)) return false;
        if (!q) return true;
        return String(p.productId).includes(q) || (p.prodNm||'').toLowerCase().includes(q) || (p.category||'').toLowerCase().includes(q);
      });
    });
    const openProdPicker = (type) => { prodPickerSearch.value = ''; prodPickerOpen.value = type; };
    const selectProdItem = (p) => {
      const row = { _id: _relSeq++, productId: p.productId, prodNm: p.prodNm, category: p.category||'', price: p.price||0, stock: p.stock||0, status: p.status||'' };
      if (prodPickerOpen.value === 'rel') relProds.push(row);
      else                                codeProds.push(row);
      prodPickerOpen.value = '';
    };
    const removeRelProd  = (idx) => relProds.splice(idx, 1);
    const removeCodeProd = (idx) => codeProds.splice(idx, 1);

    // 드래그 정렬 — 연관상품
    const dragRelIdx = ref(null); const dragoverRelIdx = ref(null);
    const onRelDragStart = (idx) => { dragRelIdx.value = idx; };
    const onRelDragOver  = (idx) => { dragoverRelIdx.value = idx; };
    const onRelDrop = () => {
      if (dragRelIdx.value === null || dragRelIdx.value === dragoverRelIdx.value) { dragRelIdx.value = null; dragoverRelIdx.value = null; return; }
      const items = [...relProds]; const [m] = items.splice(dragRelIdx.value, 1); items.splice(dragoverRelIdx.value, 0, m);
      relProds.splice(0, relProds.length, ...items); dragRelIdx.value = null; dragoverRelIdx.value = null;
    };
    // 드래그 정렬 — 코드상품
    const dragCodeIdx = ref(null); const dragoverCodeIdx = ref(null);
    const onCodeDragStart = (idx) => { dragCodeIdx.value = idx; };
    const onCodeDragOver  = (idx) => { dragoverCodeIdx.value = idx; };
    const onCodeDrop = () => {
      if (dragCodeIdx.value === null || dragCodeIdx.value === dragoverCodeIdx.value) { dragCodeIdx.value = null; dragoverCodeIdx.value = null; return; }
      const items = [...codeProds]; const [m] = items.splice(dragCodeIdx.value, 1); items.splice(dragoverCodeIdx.value, 0, m);
      codeProds.splice(0, codeProds.length, ...items); dragCodeIdx.value = null; dragoverCodeIdx.value = null;
    };

    // ── 카테고리 N개 목록 (pd_category_prod)
    const prodCategories = reactive([]); // [{ categoryId, categoryNm, depth }]
    const catPickerOpen   = ref(false);
    const catPickerSearch = ref('');
    const catDragIdx      = ref(null);
    const catDragoverIdx  = ref(null);
    const catPickerList = computed(() => {
      const q = catPickerSearch.value.trim().toLowerCase();
      const already = new Set(prodCategories.map(c => String(c.categoryId)));
      return (props.adminData.categories||[])
        .filter(c => {
          if (already.has(String(c.categoryId||c.id))) return false;
          if (!q) return true;
          return (c.categoryNm||c.nm||'').toLowerCase().includes(q);
        })
        .sort((a,b) => (a.depth||a.level||1) - (b.depth||b.level||1));
    });
    const getCategoryNm = (id) => {
      const c = (props.adminData.categories||[]).find(x => String(x.categoryId||x.id) === String(id));
      return c ? (c.categoryNm||c.nm||String(id)) : String(id);
    };
    const getCategoryDepth = (id) => {
      const c = (props.adminData.categories||[]).find(x => String(x.categoryId||x.id) === String(id));
      return c ? (c.depth||c.level||1) : 1;
    };
    const addCategory = (cat) => {
      const id = cat.categoryId||cat.id;
      if (prodCategories.some(c => String(c.categoryId) === String(id))) return;
      prodCategories.push({ categoryId: id, categoryNm: cat.categoryNm||cat.nm||String(id), depth: cat.depth||cat.level||1 });
      catPickerOpen.value = false; catPickerSearch.value = '';
    };
    const removeCategory = (idx) => { prodCategories.splice(idx, 1); };
    const onCatDragStart = (idx) => { catDragIdx.value = idx; };
    const onCatDragOver  = (idx) => { catDragoverIdx.value = idx; };
    const onCatDrop = () => {
      if (catDragIdx.value === null || catDragIdx.value === catDragoverIdx.value) { catDragIdx.value = null; catDragoverIdx.value = null; return; }
      const items = [...prodCategories]; const [m] = items.splice(catDragIdx.value, 1); items.splice(catDragoverIdx.value, 0, m);
      prodCategories.splice(0, prodCategories.length, ...items); catDragIdx.value = null; catDragoverIdx.value = null;
    };

    // ── 판매계획
    const salePlans = reactive([]);
    let planIdSeq = 1;
    const planVisible = computed(() => salePlans.filter(r => r._row_status !== 'D'));
    const planAllChecked = computed({
      get: () => planVisible.value.length > 0 && planVisible.value.every(r => r._checked),
      set: v => planVisible.value.forEach(r => { r._checked = v; }),
    });
    const addPlanRow = () => salePlans.unshift({ _id: planIdSeq++, _row_status: 'I', _checked: false, startDate: '', startTime: '00:00', endDate: '', endTime: '23:59', planStatus: '준비중', listPrice: form.listPrice || 0, salePrice: form.salePrice || 0, purchasePrice: form.purchasePrice || 0 });
    const onPlanChange = row => { if (row._row_status === 'N') row._row_status = 'U'; };
    const deletePlanChecked = () => { for (let i = salePlans.length - 1; i >= 0; i--) { const r = salePlans[i]; if (!r._checked) continue; if (r._row_status === 'I') salePlans.splice(i, 1); else r._row_status = 'D'; } };
    const planRowStyle = s => ({ I: 'background:#f6ffed;', U: 'background:#fffbe6;', D: 'background:#fff1f0;opacity:0.6;' }[s] || '');

    // ── mounted
    // ── 담당MD 모달
    const mdModalOpen = ref(false);
    const mdSearch    = ref('');
    const mdUserList  = computed(() => (props.adminData.adminUsers||[]).filter(u => u.status==='활성'));
    const mdUserListFiltered = computed(() => {
      const q = mdSearch.value.trim().toLowerCase();
      if (!q) return mdUserList.value;
      return mdUserList.value.filter(u => u.name.toLowerCase().includes(q) || (u.dept||'').toLowerCase().includes(q) || (u.role||'').toLowerCase().includes(q));
    });
    const mdSelectedNm = computed(() => {
      const u = mdUserList.value.find(u => u.adminUserId === form.mdUserId);
      return u ? `${u.name} (${u.dept||''})` : '';
    });
    const openMdModal  = () => { mdSearch.value = ''; mdModalOpen.value = true; };
    const selectMdUser = (u) => { form.mdUserId = u.adminUserId; mdModalOpen.value = false; };

    onMounted(async () => {
      if (isNew.value) {
        // 신규 등록: 기본값 본인 (목업에서는 첫 번째 활성 사용자)
        form.mdUserId = mdUserList.value[0]?.adminUserId || '';
      }
      if (!isNew.value) {
        const p = props.adminData.getProduct(props.editId);
        if (p) {
          form.prodId         = p.productId || p.prodId;
          form.prodNm         = p.prodNm || '';
          form.prodCode       = p.prodCode || '';
          form.categoryId     = p.categoryId || p.category || '';
          form.brandId        = p.brandId || p.brand || '';
          form.vendorId       = p.vendorId || '';
          form.mdUserId       = p.mdUserId || '';
          form.prodTypeCd     = p.prodTypeCd || 'SINGLE';
          form.prodStatusCd   = p.prodStatusCd || p.status || 'ACTIVE';
          form.unsaleMsg      = p.unsaleMsg || '';
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
          if (p.contentBlocks?.length) contentBlocks.splice(0, contentBlocks.length, ...p.contentBlocks.map(b => ({ ...b, _id: _blockSeq++ })));
          else if (form.contentHtml) contentBlocks.splice(0, contentBlocks.length, { _id: _blockSeq++, type: 'html', content: form.contentHtml, fileName: '' });
          if (p.images?.length) images.splice(0, images.length, ...p.images.map(img => ({ ...img, id: imgIdSeq++ })));
          else if (p.mainImage) images.splice(0, images.length, { id: imgIdSeq++, previewUrl: p.mainImage, isMain: true, optItemId1: '', optItemId2: '' });
          if (p.optGroups?.length) {
            useOpt.value = true;
            optGroups.splice(0, optGroups.length, ...p.optGroups.map(g => ({ ...g, _id: _optSeq++, items: g.items.map(i => ({ ...i, _id: _itemSeq++ })) })));
            skus.splice(0, skus.length, ...(p.skus || []));
          }
          if (p.salePlans?.length) salePlans.splice(0, salePlans.length, ...p.salePlans.map(r => ({ ...r, _id: planIdSeq++, _checked: false })));
          if (p.relProds?.length) {
            relProds.splice(0, relProds.length, ...p.relProds.map(r => ({ ...r, _id: _relSeq++ })));
          } else if (p.relatedProductIds) {
            relProds.splice(0, relProds.length, ...p.relatedProductIds.split(',').map(s => s.trim()).filter(Boolean).map(id => {
              const found = (props.adminData.products||[]).find(x => String(x.productId) === String(id));
              return found ? { _id: _relSeq++, productId: found.productId, prodNm: found.prodNm, category: found.category||'', price: found.price||0, stock: found.stock||0, status: found.status||'' }
                           : { _id: _relSeq++, productId: Number(id), prodNm: '(ID:'+id+')', category: '', price: 0, stock: 0, status: '' };
            }));
          }
          if (p.codeProds?.length) codeProds.splice(0, codeProds.length, ...p.codeProds.map(r => ({ ...r, _id: _relSeq++ })));
          // 카테고리 N개 로드 (pd_category_prod)
          const pid = String(p.productId || p.prodId);
          const linked = (props.adminData.categoryProds||[])
            .filter(cp => String(cp.prodId) === pid)
            .sort((a,b) => (a.sortOrd||0) - (b.sortOrd||0));
          prodCategories.splice(0, prodCategories.length, ...linked.map(cp => ({
            categoryId: cp.categoryId,
            categoryNm: getCategoryNm(cp.categoryId),
            depth: getCategoryDepth(cp.categoryId),
          })));
        }
      }
      await nextTick();
      // HTML 블록 Quill 마운트
      contentBlocks.filter(b => b.type === 'html').forEach(block => {
        const el = document.getElementById('quill-block-' + block._id);
        if (el && !_blockQuills[block._id]) {
          const q = new Quill(el, { theme: 'snow', placeholder: '내용을 입력해주세요.',
            modules: { toolbar: [[{ header: [1,2,3,false] }], ['bold','italic','underline'],[{color:[]},{background:[]}],[{list:'ordered'},{list:'bullet'}],['link','image','clean']] } });
          if (block.content) q.root.innerHTML = block.content;
          _blockQuills[block._id] = q;
          q.on('text-change', () => { block.content = q.root.innerHTML; });
        }
      });
      // 스플릿 패널 divider 마우스 리스너
      _divMoveH = (e) => {
        if (!isDraggingDivider.value || !contentSplitRef.value) return;
        const rect = contentSplitRef.value.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        splitPct.value = Math.max(25, Math.min(78, pct));
      };
      _divUpH = () => { isDraggingDivider.value = false; };
      document.addEventListener('mousemove', _divMoveH);
      document.addEventListener('mouseup', _divUpH);
    });
    onBeforeUnmount(() => {
      if (_divMoveH) document.removeEventListener('mousemove', _divMoveH);
      if (_divUpH)   document.removeEventListener('mouseup',  _divUpH);
    });

    // ── 저장
    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try { await schema.validate(form, { abortEarly: false }); }
      catch (err) { err.inner.forEach(e => { errors[e.path] = e.message; }); props.showToast('입력 내용을 확인해주세요.', 'error'); return; }
      const imgData = images.map(({ id, ...rest }) => rest);
      const mainImg = images.find(img => img.isMain);
      const ok = await props.showConfirm(isNew.value ? '등록' : '저장', isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      let savedProdId;
      if (isNew.value) {
        savedProdId = props.adminData.nextId(props.adminData.products, 'productId');
        props.adminData.products.push({ ...form, productId: savedProdId, price: form.listPrice, stock: useOpt.value ? totalStock.value : form.prodStock, regDate: new Date().toISOString().slice(0, 10), images: imgData, mainImage: mainImg?.previewUrl || '' });
      } else {
        savedProdId = props.editId;
        const idx = props.adminData.products.findIndex(x => x.productId == props.editId);
        if (idx !== -1) Object.assign(props.adminData.products[idx], { ...form, price: form.listPrice, stock: useOpt.value ? totalStock.value : form.prodStock, images: imgData, mainImage: mainImg?.previewUrl || '' });
      }
      // categoryProds 동기화
      if (!props.adminData.categoryProds) props.adminData.categoryProds = [];
      props.adminData.categoryProds = props.adminData.categoryProds.filter(cp => String(cp.prodId) !== String(savedProdId));
      prodCategories.forEach((cat, i) => {
        props.adminData.categoryProds.push({ categoryProdId: 'CP_'+savedProdId+'_'+i, siteId: '1', categoryId: cat.categoryId, prodId: savedProdId, sortOrd: i + 1 });
      });
      try {
        const res = await (isNew.value ? window.adminApi.post(`products/${form.prodId}`, { ...form, contentBlocks: contentBlocks, optGroups: optGroups, skus: skus, relProds: relProds, codeProds: codeProds, salePlans: salePlans }) : window.adminApi.put(`products/${form.prodId}`, { ...form, contentBlocks: contentBlocks, optGroups: optGroups, skus: skus, relProds: relProds, codeProds: codeProds, salePlans: salePlans }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(isNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('pdProdMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    return {
      isNew, topTab, viewMode2, showTab, form, errors, save,
      mdModalOpen, mdSearch, mdUserList, mdUserListFiltered, mdSelectedNm, openMdModal, selectMdUser,
      useOpt, clearOpt, optGroups, skus, totalStock, generateSkus,
      skuFilter1, skuFilter2, skuFilterStock, skuFilter1Options, skuFilter2Options, skusFiltered,
      prodOptCategoryTypeCd, optTypeLevel1Codes, optTypeCodes, optInputTypeCodes, getOptValCodes,
      onCategoryChange, addOptGroup, removeOptGroup, addOptItem, removeOptItem,
      dragOptGrpId, dragOptItemIdx, dragoverOptItemIdx, onOptItemDragStart, onOptItemDragOver, onOptItemDrop,
      images, addImageByUrl, onFileChange, setMain, removeImage, fileInputRef, triggerFileInput,
      dragImgIdx, dragoverImgIdx, onImgDragStart, onImgDragOver, onImgDrop,
      prodCategories, catPickerOpen, catPickerSearch, catPickerList, addCategory, removeCategory,
      catDragIdx, catDragoverIdx, onCatDragStart, onCatDragOver, onCatDrop,
      relProds, codeProds, prodPickerOpen, prodPickerSearch, prodPickerList, openProdPicker, selectProdItem,
      removeRelProd, removeCodeProd,
      dragRelIdx, dragoverRelIdx, onRelDragStart, onRelDragOver, onRelDrop,
      dragCodeIdx, dragoverCodeIdx, onCodeDragStart, onCodeDragOver, onCodeDrop,
      salePlans, planVisible, planAllChecked, addPlanRow, onPlanChange, deletePlanChecked, planRowStyle,
      marginRateCalc, discountRate,
      contentBlocks, addContentBlock, removeContentBlock, onBlockFileChange,
      dragBlockIdx, dragoverBlockIdx, onBlockDragStart, onBlockDragOver, onBlockDrop,
      splitPct, previewDevice, isDraggingDivider, contentSplitRef, onDividerMousedown,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '상품 등록' : '상품 수정' }}<span v-if="!isNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.prodId }}</span></div>

  <!-- 탭바 -->
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:topTab==='info'}"    :disabled="viewMode2!=='tab'" @click="topTab='info'">📋 기본정보</button>
      <button class="tab-btn" :class="{active:topTab==='detail'}"  :disabled="viewMode2!=='tab'" @click="topTab='detail'">📝 상세설정</button>
      <button class="tab-btn" :class="{active:topTab==='image'}"   :disabled="viewMode2!=='tab'" @click="topTab='image'">🖼 이미지 <span class="tab-count">{{ images.length }}</span></button>
      <button class="tab-btn" :class="{active:topTab==='content'}" :disabled="viewMode2!=='tab'" @click="topTab='content'">📄 상품설명 <span class="tab-count">{{ contentBlocks.length }}</span></button>
      <button class="tab-btn" :class="{active:topTab==='option'}"  :disabled="viewMode2!=='tab'" @click="topTab='option'">⚙ 옵션설정</button>
      <button class="tab-btn" :class="{active:topTab==='price'}"   :disabled="viewMode2!=='tab'" @click="topTab='price'">💰 옵션(가격/재고)</button>
      <button class="tab-btn" :class="{active:topTab==='related'}" :disabled="viewMode2!=='tab'" @click="topTab='related'">🔗 연관상품 <span class="tab-count">{{ relProds.length + codeProds.length }}</span></button>
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
        <div style="border:1px solid #e2e8f0;border-radius:6px;background:#fff;min-height:38px;padding:4px 6px;">
          <div v-if="prodCategories.length===0" style="color:#aaa;font-size:12px;padding:4px 2px;">카테고리를 추가해주세요</div>
          <div v-for="(cat,idx) in prodCategories" :key="cat.categoryId"
               draggable="true" @dragstart="onCatDragStart(idx)" @dragover.prevent="onCatDragOver(idx)" @drop.prevent="onCatDrop()"
               :style="catDragoverIdx===idx?'opacity:0.5;':''"
               style="display:flex;align-items:center;gap:4px;padding:2px 0;">
            <span style="cursor:grab;color:#bbb;font-size:14px;flex-shrink:0;">≡</span>
            <span v-if="idx===0" style="font-size:10px;background:#f9a8d4;color:#9d174d;padding:1px 5px;border-radius:10px;flex-shrink:0;">대표</span>
            <span style="font-size:12px;color:#64748b;flex-shrink:0;">
              <span v-if="cat.depth>=1" style="font-size:10px;">{{ ['','대','중','소'][cat.depth]||cat.depth }}▸</span>
            </span>
            <span style="font-size:13px;flex:1;">{{ cat.categoryNm }}</span>
            <button type="button" @click="removeCategory(idx)" style="border:none;background:none;color:#f87171;cursor:pointer;font-size:13px;padding:0 2px;flex-shrink:0;">✕</button>
          </div>
          <button type="button" @click="catPickerOpen=true;catPickerSearch=''"
                  style="margin-top:4px;font-size:12px;color:#6366f1;border:1px dashed #a5b4fc;background:none;border-radius:4px;padding:2px 8px;cursor:pointer;width:100%;">+ 카테고리 추가</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">브랜드</label>
        <select class="form-control" v-model="form.brandId">
          <option value="">-- 선택 --</option>
          <option v-for="b in (adminData.brands||[])" :key="b.brandId||b.id" :value="b.brandId||b.id">{{ b.brandNm||b.name }}</option>
        </select>
      </div>
    </div>

    <!-- 카테고리 피커 모달 -->
    <teleport to="body">
      <div v-if="catPickerOpen" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:center;justify-content:center;" @click.self="catPickerOpen=false">
        <div style="background:#fff;border-radius:12px;width:420px;max-height:520px;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,0.18);">
          <div style="padding:16px 20px 12px;border-bottom:1px solid #f0f0f0;background:linear-gradient(135deg,#fff0f4,#ffe4ec);border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-weight:700;font-size:15px;">카테고리 선택</span>
            <button type="button" @click="catPickerOpen=false" style="border:none;background:none;font-size:18px;cursor:pointer;color:#888;">✕</button>
          </div>
          <div style="padding:10px 16px;">
            <input class="form-control" v-model="catPickerSearch" placeholder="카테고리 검색..." style="font-size:13px;" />
          </div>
          <div style="overflow-y:auto;flex:1;padding:0 8px 12px;">
            <div v-if="catPickerList.length===0" style="text-align:center;color:#aaa;padding:24px;font-size:13px;">검색 결과 없음</div>
            <div v-for="cat in catPickerList" :key="cat.categoryId||cat.id"
                 @click="addCategory(cat)"
                 style="padding:8px 12px;border-radius:6px;cursor:pointer;font-size:13px;display:flex;align-items:center;gap:8px;"
                 onmouseover="this.style.background='#f5f3ff'" onmouseout="this.style.background=''">
              <span style="font-size:10px;color:#94a3b8;width:20px;flex-shrink:0;">{{ ['','대','중','소'][cat.depth||cat.level||1]||'' }}</span>
              <span>{{ cat.categoryNm||cat.nm }}</span>
            </div>
          </div>
        </div>
      </div>
    </teleport>

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

    <!-- 담당MD / 배송템플릿 -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">담당MD (md_user_id)</label>
        <div style="display:flex;gap:6px;align-items:center;">
          <input class="form-control" :value="mdSelectedNm||''" readonly placeholder="담당MD를 선택해주세요"
            style="flex:1;background:#fafafa;cursor:pointer;" @click="openMdModal" />
          <button class="btn btn-secondary btn-sm" type="button" @click="openMdModal" style="flex-shrink:0;">선택</button>
          <button v-if="form.mdUserId" class="btn btn-xs btn-danger" type="button" @click="form.mdUserId=''" style="flex-shrink:0;" title="초기화">✕</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">배송템플릿 (dliv_tmplt_id)</label>
        <select class="form-control" v-model="form.dlvTmpltId">
          <option value="">-- 선택 --</option>
          <option v-for="t in (adminData.dlivTmplts||[])" :key="t.dlivTmpltId" :value="t.dlivTmpltId">{{ t.dlivTmpltNm }}</option>
        </select>
      </div>
    </div>

    <!-- 담당MD 선택 모달 -->
    <teleport to="body">
      <div v-if="mdModalOpen"
        style="position:fixed;inset:0;background:rgba(10,20,40,0.45);backdrop-filter:blur(2px);z-index:9000;display:flex;align-items:center;justify-content:center;"
        @click.self="mdModalOpen=false">
        <div class="modal-box" style="width:480px;max-height:560px;display:flex;flex-direction:column;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.18);">
          <!-- 헤더 -->
          <div class="tree-modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;flex-shrink:0;">
            <span style="font-size:15px;font-weight:700;">담당MD 선택</span>
            <button @click="mdModalOpen=false" style="background:none;border:none;font-size:20px;cursor:pointer;color:#888;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;" class="modal-close-btn">✕</button>
          </div>
          <!-- 검색 -->
          <div style="padding:12px 20px;flex-shrink:0;border-bottom:1px solid #f0f0f0;">
            <input class="form-control" v-model="mdSearch" placeholder="이름 · 부서 · 역할 검색" autofocus style="font-size:13px;" />
          </div>
          <!-- 목록 -->
          <div style="overflow-y:auto;flex:1;padding:8px 12px;">
            <table class="admin-table" style="font-size:13px;">
              <thead>
                <tr><th>이름</th><th>부서</th><th>역할</th></tr>
              </thead>
              <tbody>
                <tr v-for="u in mdUserListFiltered" :key="u.adminUserId"
                  style="cursor:pointer;"
                  :style="form.mdUserId===u.adminUserId ? 'background:#fff0f4;font-weight:700;' : ''"
                  @click="selectMdUser(u)">
                  <td>
                    <span style="display:flex;align-items:center;gap:6px;">
                      <span v-if="form.mdUserId===u.adminUserId" style="color:#e8587a;font-size:12px;">✔</span>
                      {{ u.name }}
                    </span>
                  </td>
                  <td>{{ u.dept }}</td>
                  <td><span class="badge badge-gray" style="font-size:11px;">{{ u.role }}</span></td>
                </tr>
                <tr v-if="mdUserListFiltered.length===0">
                  <td colspan="3" style="text-align:center;color:#bbb;padding:20px;">검색 결과가 없습니다.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- 푸터 -->
          <div style="padding:12px 20px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;">
            <button class="btn btn-secondary btn-sm" @click="mdModalOpen=false">닫기</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 상태 -->
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
        <label class="form-label">미판매메시지 <span style="color:#aaa;font-size:11px;">(판매불가 시 고객 노출)</span></label>
        <input class="form-control" v-model="form.unsaleMsg" placeholder="예: 현재 판매 준비 중입니다." maxlength="200" />
        <div style="font-size:11px;color:#aaa;text-align:right;margin-top:2px;">{{ (form.unsaleMsg||'').length }} / 200</div>
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

    <!-- 옵션 미사용 안내 -->
    <template v-if="!useOpt">
      <div style="padding:10px 14px;background:#f9f0ff;border-radius:8px;border:1px solid #d3adf7;font-size:12px;color:#531dab;margin-bottom:8px;">
        💡 옵션 미사용 — 재고는 <strong>💰 옵션(가격/재고)</strong> 탭에서 관리합니다.
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
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:6px;">
          <thead>
            <tr style="background:#f5f5f5;border-bottom:1px solid #e0e0e0;">
              <th style="width:18px;padding:4px 2px;"></th>
              <th style="width:24px;padding:4px 4px;text-align:center;font-weight:600;color:#888;font-size:11px;">#</th>
              <th v-if="grp.level===2 && optGroups[0]?.items.length>0" style="width:110px;padding:4px 6px;text-align:left;font-weight:600;color:#555;font-size:11px;">상위옵션값</th>
              <th style="padding:4px 6px;text-align:left;font-weight:600;color:#555;font-size:11px;">표시명 (opt_nm)</th>
              <th style="width:170px;padding:4px 6px;text-align:left;font-weight:600;color:#555;font-size:11px;">공통코드ID (opt_val_code_id)</th>
              <th style="width:120px;padding:4px 6px;text-align:left;font-weight:600;color:#555;font-size:11px;">저장값 (opt_val)</th>
              <th style="width:36px;padding:4px 4px;text-align:center;font-weight:600;color:#555;font-size:11px;">사용</th>
              <th style="width:30px;padding:4px 4px;text-align:center;"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, ii) in grp.items" :key="item._id"
              draggable="true"
              @dragstart="onOptItemDragStart(grp, ii)"
              @dragover.prevent="onOptItemDragOver(grp, ii)"
              @drop.prevent="onOptItemDrop(grp)"
              @dragend="dragOptGrpId=null;dragOptItemIdx=null;dragoverOptItemIdx=null"
              style="border-bottom:1px solid #f0f0f0;transition:background 0.1s;"
              :style="dragOptGrpId===grp._id && dragoverOptItemIdx===ii && dragOptItemIdx!==ii
                ? 'background:#dbeafe;'
                : (ii%2===1 ? 'background:#fafafa;' : '')">

              <!-- 햄버거 핸들 -->
              <td style="padding:2px 2px;text-align:center;cursor:grab;color:#ccc;font-size:14px;user-select:none;letter-spacing:-2px;" title="드래그로 순서 변경">≡</td>
              <td style="padding:2px 4px;text-align:center;color:#bbb;font-size:11px;">{{ ii+1 }}</td>

              <!-- 2단: 상위 옵션값 -->
              <td v-if="grp.level===2 && optGroups[0]?.items.length>0" style="padding:2px 4px;">
                <select v-model="item.parentOptItemId"
                  style="width:100%;font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;height:24px;">
                  <option value="">전체 공통</option>
                  <option v-for="p1 in (optGroups[0]?.items||[])" :key="p1._id" :value="String(p1._id)">{{ p1.nm||'(미입력)' }}</option>
                </select>
              </td>

              <!-- 표시명 -->
              <td style="padding:2px 4px;">
                <input v-model="item.nm" placeholder="예: 블랙"
                  style="width:100%;font-size:12px;border:1px solid #ddd;border-radius:4px;padding:2px 6px;height:24px;"
                  @blur="generateSkus" />
              </td>

              <!-- 공통코드ID -->
              <td style="padding:2px 4px;">
                <select v-model="item.valCodeId"
                  style="width:100%;font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;height:24px;"
                  @change="() => { const found = getOptValCodes(grp.typeCd).find(c => c.codeValue === item.valCodeId); if (found) { item.val = found.codeValue; if (!item.nm) item.nm = found.codeLabel; generateSkus(); } else { item.val = ''; } }">
                  <option value="">-- 직접입력 --</option>
                  <option v-for="c in getOptValCodes(grp.typeCd)" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }} ({{ c.codeValue }})</option>
                </select>
              </td>

              <!-- 저장값 -->
              <td style="padding:2px 4px;">
                <input v-model="item.val"
                  :placeholder="item.valCodeId ? '자동입력' : 'MY_VAL'"
                  style="width:100%;font-size:12px;border:1px solid #ddd;border-radius:4px;padding:2px 6px;height:24px;"
                  @blur="generateSkus" />
              </td>

              <td style="padding:2px 4px;text-align:center;">
                <input type="checkbox" :checked="item.useYn==='Y'"
                  @change="item.useYn=$event.target.checked?'Y':'N'; generateSkus()"
                  style="width:14px;height:14px;" />
              </td>
              <td style="padding:2px 4px;text-align:center;">
                <button style="background:#ff4d4f;color:#fff;border:none;border-radius:3px;width:20px;height:20px;cursor:pointer;font-size:11px;line-height:1;padding:0;"
                  @click="removeOptItem(grp, ii)">✕</button>
              </td>
            </tr>
            <tr v-if="grp.items.length===0">
              <td :colspan="grp.level===2&&optGroups[0]?.items.length>0?8:7"
                style="text-align:center;color:#bbb;padding:10px;font-size:12px;border-bottom:1px solid #f0f0f0;">값을 추가해주세요.</td>
            </tr>
          </tbody>
        </table>
        <button class="btn btn-xs btn-secondary" @click="addOptItem(grp)">+ 값 추가</button>
      </div>

    </template>

    <div style="padding:10px 14px;background:#e6f4ff;border-radius:8px;border:1px solid #bae0ff;font-size:12px;color:#0958d9;margin-top:8px;">
      💡 SKU별 가격·재고는 <strong>💰 옵션(가격/재고)</strong> 탭에서 관리합니다.
    </div>

    <div class="form-actions" style="margin-top:16px;">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('pdProdMng')">취소</button>
    </div>
  </div>

  <!-- ══════════════════════════════════════
       📄 상품설명  (contentBlocks — 첨부/URL/HTML 블록)
  ══════════════════════════════════════ -->
  <div class="card" v-show="showTab('content')" style="margin:0;padding:0;overflow:hidden;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title" style="padding:14px 20px;">📄 상품설명</div>

    <!-- 상단 툴바: 블록 추가 버튼 -->
    <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafafa;flex-wrap:wrap;">
      <span style="font-size:13px;font-weight:700;color:#333;margin-right:4px;">상품설명 블록</span>
      <button class="btn btn-secondary btn-sm" @click="addContentBlock('file')">+ 첨부 이미지</button>
      <button class="btn btn-secondary btn-sm" @click="addContentBlock('url')">+ URL 이미지</button>
      <button class="btn btn-secondary btn-sm" @click="addContentBlock('html')">+ HTML 에디터</button>
      <span style="font-size:12px;color:#aaa;margin-left:4px;">{{ contentBlocks.length }}개 블록 · 좌측 ≡ 드래그로 순서 변경</span>
    </div>

    <!-- 스플릿 패널 (편집 좌 + 미리보기 우) -->
    <div ref="contentSplitRef" style="display:flex;height:520px;overflow:hidden;">

      <!-- 좌: 블록 편집 영역 -->
      <div :style="{ width: splitPct + '%', overflowY: 'auto', padding: '12px 14px', flexShrink: 0 }">
        <div v-if="contentBlocks.length === 0"
          style="border:2px dashed #e0e0e0;border-radius:10px;padding:40px 20px;text-align:center;color:#bbb;font-size:13px;">
          위 버튼으로 블록을 추가해주세요.
        </div>

        <!-- 블록 리스트 -->
        <div v-for="(block, bi) in contentBlocks" :key="block._id"
          draggable="true"
          @dragstart="onBlockDragStart(bi)"
          @dragover.prevent="onBlockDragOver(bi)"
          @drop.prevent="onBlockDrop()"
          @dragend="dragBlockIdx=null;dragoverBlockIdx=null"
          style="border:1px solid #e8e8e8;border-radius:10px;margin-bottom:10px;background:#fff;transition:border-color 0.15s,background 0.15s;overflow:hidden;"
          :style="dragoverBlockIdx===bi && dragBlockIdx!==bi ? 'border-color:#1677ff;background:#e6f4ff;' : ''">

          <!-- 블록 헤더 -->
          <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f9f9f9;border-bottom:1px solid #f0f0f0;">
            <!-- 햄버거 핸들 -->
            <span style="cursor:grab;color:#ccc;font-size:16px;user-select:none;letter-spacing:-2px;flex-shrink:0;" title="드래그로 순서 변경">≡</span>
            <span class="badge" :class="block.type==='file'?'badge-green':block.type==='url'?'badge-blue':'badge-orange'" style="font-size:11px;flex-shrink:0;">
              {{ block.type==='file' ? '📎 첨부' : block.type==='url' ? '🔗 URL' : '✏ HTML' }}
            </span>
            <span style="font-size:12px;color:#888;flex:1;">블록 {{ bi+1 }}</span>
            <button class="btn btn-xs btn-danger" @click="removeContentBlock(bi)" title="삭제">✕</button>
          </div>

          <!-- 첨부 방식 -->
          <div v-if="block.type==='file'" style="padding:12px;">
            <div v-if="block.content" style="margin-bottom:8px;">
              <img :src="block.content" style="max-width:100%;max-height:200px;border-radius:6px;border:1px solid #e0e0e0;" />
              <div style="font-size:11px;color:#888;margin-top:4px;">{{ block.fileName }}</div>
            </div>
            <label class="btn btn-secondary btn-sm" style="cursor:pointer;display:inline-block;">
              📎 파일 선택
              <input type="file" accept="image/*" style="display:none;" @change="onBlockFileChange(block, $event)" />
            </label>
            <button v-if="block.content" class="btn btn-xs btn-danger" @click="block.content='';block.fileName=''" style="margin-left:6px;">삭제</button>
          </div>

          <!-- URL 방식 -->
          <div v-else-if="block.type==='url'" style="padding:12px;">
            <input class="form-control" v-model="block.content" placeholder="이미지 URL (https://...)" style="font-size:13px;margin-bottom:8px;" />
            <div v-if="block.content" style="margin-top:4px;">
              <img :src="block.content" style="max-width:100%;max-height:200px;border-radius:6px;border:1px solid #e0e0e0;"
                @error="$event.target.style.display='none'" @load="$event.target.style.display=''" />
            </div>
          </div>

          <!-- HTML 에디터 방식 -->
          <div v-else-if="block.type==='html'" style="padding:12px;">
            <div :id="'quill-block-'+block._id" style="min-height:180px;background:#fff;"></div>
          </div>
        </div>
      </div>

      <!-- 드래그 구분선 -->
      <div @mousedown="onDividerMousedown"
        style="width:5px;flex-shrink:0;background:#e8e8e8;cursor:col-resize;transition:background 0.15s;position:relative;z-index:1;"
        :style="isDraggingDivider ? 'background:#1677ff;' : ''"
        title="드래그로 좌우 너비 조절">
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#ccc;font-size:11px;writing-mode:vertical-rl;user-select:none;">⋮</div>
      </div>

      <!-- 우: 미리보기 영역 -->
      <div :style="{ width: (100 - splitPct) + '%', flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #f0f0f0' }">
        <!-- 디바이스 탭 -->
        <div style="display:flex;align-items:center;gap:4px;padding:8px 12px;border-bottom:1px solid #f0f0f0;background:#fafafa;flex-shrink:0;">
          <span style="font-size:11px;color:#aaa;margin-right:4px;">미리보기</span>
          <button class="btn btn-xs" :class="previewDevice==='pc'?'btn-primary':'btn-secondary'" @click="previewDevice='pc'" style="font-size:11px;padding:2px 8px;">🖥 PC</button>
          <button class="btn btn-xs" :class="previewDevice==='tablet'?'btn-primary':'btn-secondary'" @click="previewDevice='tablet'" style="font-size:11px;padding:2px 8px;">📱 태블릿</button>
          <button class="btn btn-xs" :class="previewDevice==='mobile'?'btn-primary':'btn-secondary'" @click="previewDevice='mobile'" style="font-size:11px;padding:2px 8px;">📲 모바일</button>
        </div>
        <!-- 미리보기 뷰 -->
        <div style="flex:1;overflow-y:auto;padding:12px;background:#f5f5f5;display:flex;justify-content:center;">
          <div :style="{
            width: previewDevice==='pc' ? '100%' : previewDevice==='tablet' ? '768px' : '375px',
            maxWidth: '100%',
            background: '#fff',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            padding: '16px',
            minHeight: '200px',
            fontSize: '14px',
            lineHeight: '1.7',
            overflowX: 'hidden',
          }">
            <div v-if="contentBlocks.length===0" style="color:#bbb;text-align:center;padding:40px;font-size:13px;">블록을 추가하면 여기에 미리보기가 표시됩니다.</div>
            <template v-for="block in contentBlocks" :key="block._id">
              <div v-if="block.type==='file'||block.type==='url'" style="margin-bottom:12px;">
                <img v-if="block.content" :src="block.content" style="max-width:100%;height:auto;display:block;border-radius:4px;" />
              </div>
              <div v-else-if="block.type==='html'" style="margin-bottom:12px;" v-html="block.content||''"></div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="form-actions" style="padding:12px 16px;border-top:1px solid #f0f0f0;">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('pdProdMng')">취소</button>
    </div>
  </div>

  <!-- ══════════════════════════════════════
       📝 상세설정  (advrt / 구매제한 / 혜택)
  ══════════════════════════════════════ -->
  <div class="card" v-show="showTab('detail')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📝 상세설정</div>

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

    <!-- ─── 섹션1: 연관상품 ─── -->
    <div style="margin-bottom:28px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div style="font-size:13px;font-weight:700;">연관상품 <span style="font-size:11px;font-weight:400;color:#888;">(pd_prod_rel · prod_rel_type_cd = <strong style="color:#1677ff;">REL_PROD</strong>)</span>
          <span class="badge badge-blue" style="margin-left:6px;">{{ relProds.length }}건</span>
        </div>
        <button class="btn btn-sm btn-secondary" @click="openProdPicker('rel')">+ 추가</button>
      </div>

      <table class="admin-table" style="font-size:12px;">
        <thead>
          <tr>
            <th style="width:24px;"></th>
            <th style="width:46px;">ID</th>
            <th>상품명</th>
            <th style="width:80px;">카테고리</th>
            <th style="width:90px;">가격</th>
            <th style="width:60px;">재고</th>
            <th style="width:60px;">상태</th>
            <th style="width:54px;">관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, idx) in relProds" :key="p._id"
            draggable="true"
            @dragstart="onRelDragStart(idx)"
            @dragover.prevent="onRelDragOver(idx)"
            @drop.prevent="onRelDrop()"
            @dragend="dragRelIdx=null;dragoverRelIdx=null"
            :style="dragoverRelIdx===idx && dragRelIdx!==idx ? 'background:#e6f4ff;' : ''">
            <td style="text-align:center;cursor:grab;color:#ccc;font-size:15px;user-select:none;letter-spacing:-2px;" title="드래그로 순서 변경">≡</td>
            <td style="text-align:center;color:#888;">{{ p.productId }}</td>
            <td><span class="ref-link" @click="navigate('pdProdDtl',{editId:p.productId})">{{ p.prodNm }}</span></td>
            <td>{{ p.category }}</td>
            <td style="text-align:right;">{{ (p.price||0).toLocaleString() }}원</td>
            <td style="text-align:right;">{{ p.stock }}개</td>
            <td><span class="badge" :class="p.status==='판매중'?'badge-green':'badge-gray'" style="font-size:10px;">{{ p.status }}</span></td>
            <td style="text-align:center;">
              <button class="btn btn-xs btn-danger" @click="removeRelProd(idx)">삭제</button>
            </td>
          </tr>
          <tr v-if="relProds.length===0">
            <td colspan="8" style="text-align:center;color:#bbb;padding:20px;font-size:12px;">+ 추가 버튼으로 연관상품을 등록하세요.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 24px;" />

    <!-- ─── 섹션2: 코디상품 ─── -->
    <div style="margin-bottom:20px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div style="font-size:13px;font-weight:700;">코디상품 <span style="font-size:11px;font-weight:400;color:#888;">(pd_prod_rel · prod_rel_type_cd = <strong style="color:#722ed1;">CODY_PROD</strong>)</span>
          <span class="badge badge-purple" style="margin-left:6px;">{{ codeProds.length }}건</span>
        </div>
        <button class="btn btn-sm btn-secondary" @click="openProdPicker('code')">+ 추가</button>
      </div>

      <table class="admin-table" style="font-size:12px;">
        <thead>
          <tr>
            <th style="width:24px;"></th>
            <th style="width:46px;">ID</th>
            <th>상품명</th>
            <th style="width:80px;">카테고리</th>
            <th style="width:90px;">가격</th>
            <th style="width:60px;">재고</th>
            <th style="width:60px;">상태</th>
            <th style="width:54px;">관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, idx) in codeProds" :key="p._id"
            draggable="true"
            @dragstart="onCodeDragStart(idx)"
            @dragover.prevent="onCodeDragOver(idx)"
            @drop.prevent="onCodeDrop()"
            @dragend="dragCodeIdx=null;dragoverCodeIdx=null"
            :style="dragoverCodeIdx===idx && dragCodeIdx!==idx ? 'background:#e6f4ff;' : ''">
            <td style="text-align:center;cursor:grab;color:#ccc;font-size:15px;user-select:none;letter-spacing:-2px;" title="드래그로 순서 변경">≡</td>
            <td style="text-align:center;color:#888;">{{ p.productId }}</td>
            <td><span class="ref-link" @click="navigate('pdProdDtl',{editId:p.productId})">{{ p.prodNm }}</span></td>
            <td>{{ p.category }}</td>
            <td style="text-align:right;">{{ (p.price||0).toLocaleString() }}원</td>
            <td style="text-align:right;">{{ p.stock }}개</td>
            <td><span class="badge" :class="p.status==='판매중'?'badge-green':'badge-gray'" style="font-size:10px;">{{ p.status }}</span></td>
            <td style="text-align:center;">
              <button class="btn btn-xs btn-danger" @click="removeCodeProd(idx)">삭제</button>
            </td>
          </tr>
          <tr v-if="codeProds.length===0">
            <td colspan="8" style="text-align:center;color:#bbb;padding:20px;font-size:12px;">+ 추가 버튼으로 코디상품을 등록하세요.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="form-actions">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('pdProdMng')">취소</button>
    </div>

    <!-- 상품 추가 피커 모달 (연관상품/코드상품 공용) -->
    <teleport to="body">
      <div v-if="prodPickerOpen"
        style="position:fixed;inset:0;background:rgba(10,20,40,0.45);backdrop-filter:blur(2px);z-index:9000;display:flex;align-items:center;justify-content:center;"
        @click.self="prodPickerOpen=''">
        <div class="modal-box" style="width:580px;max-height:580px;display:flex;flex-direction:column;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.18);">
          <!-- 헤더 -->
          <div class="tree-modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;flex-shrink:0;">
            <span style="font-size:15px;font-weight:700;">{{ prodPickerOpen==='rel' ? '연관상품' : '코디상품' }} 추가</span>
            <button @click="prodPickerOpen=''" class="modal-close-btn" style="background:none;border:none;font-size:20px;cursor:pointer;color:#888;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;">✕</button>
          </div>
          <!-- 검색 -->
          <div style="padding:12px 20px;flex-shrink:0;border-bottom:1px solid #f0f0f0;">
            <input class="form-control" v-model="prodPickerSearch" placeholder="상품명 · ID · 카테고리 검색" style="font-size:13px;" />
          </div>
          <!-- 목록 -->
          <div style="overflow-y:auto;flex:1;padding:8px 12px;">
            <table class="admin-table" style="font-size:12px;">
              <thead>
                <tr><th style="width:46px;">ID</th><th>상품명</th><th style="width:80px;">카테고리</th><th style="width:90px;">가격</th><th style="width:60px;">재고</th><th style="width:60px;">상태</th></tr>
              </thead>
              <tbody>
                <tr v-for="p in prodPickerList" :key="p.productId"
                  style="cursor:pointer;"
                  @mouseenter="$event.currentTarget.style.background='#f9f9f9'"
                  @mouseleave="$event.currentTarget.style.background=''"
                  @click="selectProdItem(p)">
                  <td style="text-align:center;color:#888;">{{ p.productId }}</td>
                  <td style="font-weight:600;">{{ p.prodNm }}</td>
                  <td>{{ p.category }}</td>
                  <td style="text-align:right;">{{ (p.price||0).toLocaleString() }}원</td>
                  <td style="text-align:right;">{{ p.stock }}개</td>
                  <td><span class="badge" :class="p.status==='판매중'?'badge-green':'badge-gray'" style="font-size:10px;">{{ p.status }}</span></td>
                </tr>
                <tr v-if="prodPickerList.length===0">
                  <td colspan="6" style="text-align:center;color:#bbb;padding:20px;">검색 결과가 없습니다.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- 푸터 -->
          <div style="padding:12px 20px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;">
            <button class="btn btn-secondary btn-sm" @click="prodPickerOpen=''">닫기</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>

  <!-- ══════════════════════════════════════
       💰 옵션(가격/재고)  (SKU 가격/재고 + 기본가격 + 판매계획)
  ══════════════════════════════════════ -->
  <div class="card" v-show="showTab('price')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">💰 옵션(가격/재고)</div>

    <!-- ─── 섹션1: SKU별 가격·재고 (옵션 사용 시) ─── -->
    <template v-if="useOpt">
      <!-- 헤더 행 -->
      <div style="display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
        <div style="font-size:13px;font-weight:700;flex-shrink:0;">
          SKU별 가격·재고 <span style="color:#888;font-weight:400;font-size:11px;">(pd_prod_sku)</span>
          <span class="badge badge-blue" style="margin-left:6px;">{{ skusFiltered.filter(s=>s.useYn==='Y').length }}개 활성</span>
          <span v-if="skusFiltered.length < skus.length" class="badge badge-orange" style="margin-left:4px;font-size:10px;">필터 {{ skusFiltered.length }}/{{ skus.length }}</span>
        </div>
        <!-- 필터 영역 -->
        <div style="display:flex;align-items:center;gap:6px;flex:1;justify-content:flex-end;flex-wrap:wrap;">
          <!-- 1단 필터 -->
          <div style="display:flex;align-items:center;gap:4px;">
            <span class="badge badge-gray" style="font-size:11px;flex-shrink:0;">{{ optGroups[0]?.grpNm||'1단' }}</span>
            <select v-model="skuFilter1" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:3px 6px;min-width:80px;"
              @change="skuFilter2=''">
              <option value="">전체</option>
              <option v-for="v in skuFilter1Options" :key="v" :value="v">{{ v }}</option>
            </select>
          </div>
          <!-- 2단 필터 (2단 옵션 있을 때만) -->
          <div v-if="optGroups.length>1" style="display:flex;align-items:center;gap:4px;">
            <span class="badge badge-blue" style="font-size:11px;flex-shrink:0;">{{ optGroups[1]?.grpNm||'2단' }}</span>
            <select v-model="skuFilter2" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:3px 6px;min-width:80px;">
              <option value="">전체</option>
              <option v-for="v in skuFilter2Options" :key="v" :value="v">{{ v }}</option>
            </select>
          </div>
          <!-- 재고 필터 -->
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="font-size:11px;color:#555;flex-shrink:0;">재고</span>
            <select v-model="skuFilterStock" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:3px 6px;min-width:80px;">
              <option value="">전체</option>
              <option value="in">재고있음</option>
              <option value="out">품절(0)</option>
            </select>
          </div>
          <!-- 필터 초기화 -->
          <button v-if="skuFilter1||skuFilter2||skuFilterStock" class="btn btn-xs btn-secondary"
            @click="skuFilter1='';skuFilter2='';skuFilterStock=''">✕ 초기화</button>
          <span style="font-size:12px;color:#555;margin-left:4px;">총 재고: <strong>{{ totalStock }}</strong>개</span>
          <button class="btn btn-sm btn-secondary" @click="generateSkus">🔄 SKU 재생성</button>
        </div>
      </div>
      <div style="overflow-x:auto;margin-bottom:20px;">
        <table class="admin-table" style="font-size:12px;">
          <thead>
            <tr>
              <th>1단<span v-if="optGroups[0]?.grpNm" style="color:#aaa;font-weight:400;">({{ optGroups[0].grpNm }})</span></th>
              <th v-if="optGroups.length>1">2단<span v-if="optGroups[1]?.grpNm" style="color:#aaa;font-weight:400;">({{ optGroups[1].grpNm }})</span></th>
              <th style="width:130px;">SKU코드</th>
              <th style="width:100px;">기본가</th>
              <th style="width:90px;">추가금액</th>
              <th style="width:70px;">재고</th>
              <th style="width:110px;">판매상태</th>
              <th style="width:68px;">판매수량</th>
              <th style="width:42px;">사용</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sku in skusFiltered" :key="sku._id"
              :style="sku.useYn==='N' ? 'opacity:0.45;background:#f5f5f5;' : (sku.statusCd==='SOLD_OUT'||sku.stock===0 ? 'background:#fffbe6;' : sku.statusCd==='SUSPENDED'?'background:#fff1f0;':'')">
              <td><span class="badge badge-gray" style="font-size:11px;">{{ sku._nm1 }}</span></td>
              <td v-if="optGroups.length>1">
                <span class="badge badge-blue" style="font-size:11px;">{{ sku._nm2 }}</span>
              </td>
              <td><input class="form-control" v-model="sku.skuCode" placeholder="SKU-XXX" style="font-size:11px;" /></td>
              <td>
                <div class="form-control" style="font-size:11px;background:#f5f5f5;color:#555;text-align:right;">
                  {{ ((form.salePrice||0) + (sku.addPrice||0)).toLocaleString() }}원
                </div>
              </td>
              <td>
                <input class="form-control" type="number" v-model.number="sku.addPrice" placeholder="0"
                  style="font-size:11px;text-align:right;" />
              </td>
              <td>
                <input class="form-control" type="number" v-model.number="sku.stock" placeholder="0" min="0"
                  style="font-size:11px;text-align:right;"
                  :style="(sku.stock||0)===0 ? 'color:#f5222d;font-weight:700;' : ''" />
              </td>
              <td>
                <select v-model="sku.statusCd"
                  style="width:100%;font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;height:28px;"
                  :style="sku.statusCd==='ON_SALE'?'color:#389e0d;':sku.statusCd==='SOLD_OUT'?'color:#f5a623;':sku.statusCd==='SUSPENDED'?'color:#cf1322;':'color:#555;'">
                  <option value="PREPARING">준비중</option>
                  <option value="ON_SALE">판매중</option>
                  <option value="SOLD_OUT">재고없음</option>
                  <option value="SUSPENDED">판매중지</option>
                </select>
              </td>
              <td style="text-align:right;padding-right:8px;font-size:12px;color:#555;">
                {{ (sku.saleCnt||0).toLocaleString() }}
              </td>
              <td style="text-align:center;">
                <input type="checkbox" :checked="sku.useYn==='Y'" @change="sku.useYn=$event.target.checked?'Y':'N'" />
              </td>
            </tr>
            <tr v-if="skus.length===0">
              <td :colspan="optGroups.length>1?9:8" style="text-align:center;color:#bbb;padding:16px;font-size:12px;">
                옵션설정 탭에서 옵션 값 입력 후 [🔄 SKU 재생성]을 눌러주세요.
              </td>
            </tr>
            <tr v-else-if="skusFiltered.length===0">
              <td :colspan="optGroups.length>1?9:8" style="text-align:center;color:#f5a623;padding:12px;font-size:12px;">
                필터 조건에 맞는 SKU가 없습니다. <button class="btn btn-xs btn-secondary" @click="skuFilter1='';skuFilter2='';skuFilterStock=''">필터 초기화</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 20px;" />
    </template>

    <!-- ─── 섹션2: 단일 재고 (옵션 미사용 시) ─── -->
    <template v-if="!useOpt">
      <div style="font-size:13px;font-weight:700;color:#333;margin-bottom:12px;">
        단일 재고 <span style="font-weight:400;font-size:11px;color:#888;">(옵션 미사용 — pd_prod.prod_stock)</span>
      </div>
      <div class="form-row" style="margin-bottom:20px;">
        <div class="form-group">
          <label class="form-label">재고수량 (prod_stock)</label>
          <input class="form-control" type="number" v-model.number="form.prodStock" placeholder="0" min="0" style="width:160px;" />
        </div>
        <div class="form-group"></div>
      </div>
      <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 20px;" />
    </template>

    <!-- ─── 섹션3: 기본 가격 ─── -->
    <div style="font-size:13px;font-weight:700;color:#333;margin-bottom:12px;">
      기본 가격 <span style="font-weight:400;font-size:11px;color:#888;">(pd_prod)</span>
    </div>
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
