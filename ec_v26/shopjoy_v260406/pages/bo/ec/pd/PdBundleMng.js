/* ShopJoy Admin - 묶음상품관리 (pd_prod_bundle_item) */
window.PdBundleMng = {
  name: 'PdBundleMng',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const categories = reactive([]);
    const products = reactive([]);
    const brands = reactive([]);
    const bundles = reactive([]);
    const categoryProds = reactive([]);
    const uiState = reactive({ descOpen: false, loading: false, error: null, isPageCodeLoad: false, dtlMode: null, editBundleId: null, catPickerOpen: false, catPickerSearch: '', catDragIdx: null, catDragoverIdx: null, pickerOpen: false, pickerSearch: '', dragIdx: null, dragoverIdx: null });
    const codes = reactive({
      product_statuses: [],
      bundle_types: [],
      bundle_statuses: [],
      use_yn: [],
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.product_statuses = codeStore.snGetGrpCodes('PRODUCT_STATUS') || [];
        codes.bundle_types = codeStore.snGetGrpCodes('BUNDLE_TYPE') || [];
        codes.bundle_statuses = codeStore.snGetGrpCodes('BUNDLE_STATUS') || [];
        codes.use_yn = codeStore.snGetGrpCodes('USE_YN') || [];
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
    const handleSearchData = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const bundleParams = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...(searchParam.nm ? { nm: searchParam.nm.trim() } : {}),
        };
        const [bundlesRes, prodsRes, catsRes] = await Promise.all([
          boApiSvc.pdBundle.getPage(bundleParams, '상품번들관리', '목록조회'),
          boApiSvc.pdProd.getPage({ pageNo: 1, pageSize: 10000 }, '상품번들관리', '목록조회'),
          boApiSvc.pdCategory.getPage({ pageNo: 1, pageSize: 10000 }, '상품번들관리', '목록조회'),
        ]);
        const dBundles = bundlesRes.data?.data;
        bundles.splice(0, bundles.length, ...(dBundles?.pageList || dBundles?.list || []));
        pager.pageTotalCount = dBundles?.pageTotalCount || 0;
        pager.pageTotalPage  = dBundles?.pageTotalPage  || 1;
        fnBuildPagerNums();
        products.splice(0, products.length, ...(prodsRes.data?.data?.pageList || prodsRes.data?.data?.list || []));
        categories.splice(0, categories.length, ...(catsRes.data?.data?.pageList || catsRes.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    /* ── 검색 파라미터 ── */
    const _initSearchParam = () => ({ nm: '' });
    const searchParam = reactive(_initSearchParam());

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchData('DEFAULT');
    });

const pager    = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    // 'edit' 시 bundleId는 uiState.editBundleId 사용

    /* ── 신규등록 폼 (pd_prod 기본정보) ── */
    const newForm = reactive({
      prodNm: '', brandId: '', vendorId: '',
      listPrice: 0, salePrice: 0,
      prodStatusCd: 'DRAFT',
    });
    const newErrors = reactive({});

    /* ── 카테고리 N개 (pd_category_prod) — 신규/편집 공통 ── */
    const dtlCategories  = reactive([]);  // [{ categoryId, categoryNm, depth }]
    const cfCatExcludeSet = computed(() => new Set(dtlCategories.map(c => String(c.categoryId))));

    /* 카테고리 드래그 */
    const onCatDragStart = idx => { uiState.catDragIdx = idx; };
    const onCatDragOver  = idx => { uiState.catDragoverIdx = idx; };
    const onCatDrop = () => {
      if (uiState.catDragIdx === null || uiState.catDragIdx === uiState.catDragoverIdx) {
        uiState.catDragIdx = uiState.catDragoverIdx = null; return;
      }
      const arr = [...dtlCategories];
      const [moved] = arr.splice(uiState.catDragIdx, 1);
      arr.splice(uiState.catDragoverIdx, 0, moved);
      dtlCategories.splice(0, dtlCategories.length, ...arr);
      uiState.catDragIdx = uiState.catDragoverIdx = null;
    };

    const addCategory = cat => {
      const id = cat.categoryId;
      if (window.safeArrayUtils.safeSome(dtlCategories, c => String(c.categoryId) === String(id))) return;
      dtlCategories.push({ categoryId: id, categoryNm: cat.categoryNm || String(id), depth: cat.depth || cat.categoryDepth || 1 });
      uiState.catPickerOpen = false;
    };
    const removeCategory = idx => dtlCategories.splice(idx, 1);

    const getCategoryNm = id => {
      const c = (categories || []).find(c => c.categoryId == id);
      return c ? (c.categoryNm || c.cateNm || id) : String(id);
    };
    const getCategoryDepth = id => {
      const c = (categories || []).find(c => c.categoryId == id);
      return c ? (c.depth || 1) : 1;
    };

    /* ── 구성품 목록 (신규/편집 공통) ── */
    const dtlItems = reactive([]);
    let _seq = 1;

    /* ── 구성품 추가 피커 / 드래그 상태는 uiState에서 관리 ── */
    
    /* ── helpers ── */
    const getProd     = id => (products || []).find(p => p.productId === id);
    const getProdNm   = id => { const p = getProd(id); return p ? (p.prodNm || p.productName || '상품#' + id) : '상품#' + id; };
    const getProdPrice = id => { const p = getProd(id); return p ? (p.salePrice || p.price || 0) : 0; };

    const getBrandNm = id => {
      const b = (brands || []).find(b => b.brandId == id);
      return b ? (b.brandNm || b.brandName || id) : id;
    };

    /* ── 안분율 합계 ── */
    const rateSum = bundleProdId =>
      (bundles)
        .filter(b => b.bundleProdId === bundleProdId)
        .reduce((s, b) => s + (b.priceRate || 0), 0);
    const fnRateSumBadge = id => Math.abs(rateSum(id) - 100) < 0.01 ? 'badge-green' : 'badge-red';

    /* ── 묶음상품 목록 ── */
    const bundleList = reactive([]);
    const updateBundleList = () => {
      try {
        const bundleArray = bundles;
        if (!Array.isArray(bundleArray) || bundleArray.length === 0) {
          bundleList.splice(0, bundleList.length);
          return;
        }
        const result = bundleArray.map(b => {
          const id = b?.prodId || b?.bundleProdId;
          return {
            bundleProdId: id,
            prodNm: b?.prodNm || b?.prodName || getProdNm(id),
            prod: b,
            items: [],
            itemCount: 0,
            salePrice: b?.salePrice || 0,
            prodStatusCd: b?.prodStatusCd || b?.status,
            regDate: b?.regDate,
          };
        });
        bundleList.splice(0, bundleList.length, ...result);
      } catch (e) {
        console.error('bundleList error:', e);
        bundleList.splice(0, bundleList.length);
      }
    };
    updateBundleList();

    watch(bundles, updateBundleList);

    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchData('DEFAULT');
    };

    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      pager.pageNo = 1;
      await handleSearchData();
    };

    const setPage  = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchData(); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchData(); };

    /* ── 신규등록 열기 ── */
    const openNew = () => {
      uiState.dtlMode = 'new';
      uiState.editBundleId = null;
      Object.assign(newForm, { prodNm: '', brandId: '', vendorId: '', listPrice: 0, salePrice: 0, prodStatusCd: 'DRAFT' });
      Object.keys(newErrors).forEach(k => delete newErrors[k]);
      dtlCategories.length = 0;
      dtlItems.length = 0;
    };

    /* ── 편집 열기 ── */
    const openDtl = bundleProdId => {
      uiState.dtlMode = 'edit';
      uiState.editBundleId = bundleProdId;
      const src = (bundles)
        .filter(b => b.bundleProdId === bundleProdId)
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
      dtlItems.splice(0, dtlItems.length, ...src.map((b, i) => ({
        _id: _seq++, bundleItemId: b.bundleItemId,
        bundleProdId: b.bundleProdId, itemProdId: b.itemProdId,
        itemSkuId: b.itemSkuId || null, itemQty: b.itemQty || 1,
        priceRate: b.priceRate || 0, sortOrd: b.sortOrd || i + 1, useYn: b.useYn || 'Y',
      })));
      // 카테고리 로드
      const pid = String(bundleProdId);
      const _cats = (categoryProds || [])
        .filter(cp => String(cp.prodId) === pid)
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(cp => ({ categoryId: cp.categoryId, categoryNm: getCategoryNm(cp.categoryId), depth: getCategoryDepth(cp.categoryId) }));
      dtlCategories.splice(0, dtlCategories.length, ..._cats);
    };

    const closeDtl = () => { uiState.dtlMode = null; uiState.editBundleId = null; dtlItems.length = 0; };

    /* ── 편집 모드에서 표시할 묶음상품명 ── */
    const cfDtlProdNm = computed(() => uiState.dtlMode === 'new' ? (newForm.prodNm || '(신규 묶음상품)') : getProdNm(uiState.editBundleId));
    const cfDtlBundleId = computed(() => uiState.dtlMode === 'edit' ? uiState.editBundleId : null);

    /* ── 안분율 ── */
    const cfDtlRateSum  = computed(() => dtlItems.reduce((s, b) => s + (parseFloat(b.priceRate) || 0), 0));
    const cfDtlRateOk   = computed(() => Math.abs(cfDtlRateSum.value - 100) < 0.01);
    const cfDtlRateDiff = computed(() => parseFloat((100 - cfDtlRateSum.value).toFixed(2)));

    /* ── 피커 목록 ── */
    const cfCurrentBundleId = computed(() => uiState.dtlMode === 'edit' ? uiState.editBundleId : -1);
    const cfPickerList = computed(() => {
      const q    = (uiState.pickerSearch || '').trim().toLowerCase();
      const used = dtlItems.map(d => d.itemProdId);
      return (products || []).filter(p => {
        if (p.productId === cfCurrentBundleId.value) return false;
        if (used.includes(p.productId)) return false;
        if (!q) return true;
        return String(p.productId).includes(q) || (p.prodNm || '').toLowerCase().includes(q);
      });
    });

    const addItem = prod => {
      const maxSort = dtlItems.length ? Math.max(...dtlItems.map(d => d.sortOrd)) : 0;
      dtlItems.push({
        _id: _seq++, bundleItemId: null,
        bundleProdId: uiState.editBundleId,
        itemProdId: prod.productId, itemSkuId: null,
        itemQty: 1, priceRate: 0, sortOrd: maxSort + 1, useYn: 'Y',
      });
      uiState.pickerOpen = false; uiState.pickerSearch = '';
    };
    const removeItem = idx => dtlItems.splice(idx, 1);

    /* ── 드래그 ── */
    const onDragStart = idx => { uiState.dragIdx = idx; };
    const onDragOver  = idx => { uiState.dragoverIdx = idx; };
    const onDrop = () => {
      if (uiState.dragIdx === null || uiState.dragIdx === uiState.dragoverIdx) {
        uiState.dragIdx = uiState.dragoverIdx = null; return;
      }
      const arr = [...dtlItems];
      const [moved] = arr.splice(uiState.dragIdx, 1);
      arr.splice(uiState.dragoverIdx, 0, moved);
      window.safeArrayUtils.safeForEach(arr, (item, i) => { item.sortOrd = i + 1; });
      dtlItems.splice(0, dtlItems.length, ...arr);
      uiState.dragIdx = uiState.dragoverIdx = null;
    };

    /* ── 저장 ── */
    const handleSave = async () => {
      /* 유효성 */
      Object.keys(newErrors).forEach(k => delete newErrors[k]);
      if (uiState.dtlMode === 'new') {
        if (!newForm.prodNm.trim())   { newErrors.prodNm = '묶음상품명을 입력해주세요.'; }
        if (!newForm.salePrice || newForm.salePrice <= 0) { newErrors.salePrice = '판매가를 입력해주세요.'; }
        if (Object.keys(newErrors).length) { props.showToast('입력 내용을 확인해주세요.', 'error'); return; }
      }
      if (!cfDtlRateOk.value) {
        props.showToast(`안분율 합계가 100%여야 합니다. (현재 ${cfDtlRateSum.value.toFixed(1)}%)`, 'error');
        return;
      }

      const isNewBundle = uiState.dtlMode === 'new';
      const newProdId = isNewBundle
        ? (Math.max(0, ...(products || []).map(p => p.productId)) + 1)
        : null;
      const bundleProdId = isNewBundle ? newProdId : uiState.editBundleId;

      const ok = await props.showConfirm(isNewBundle ? '등록' : '저장', isNewBundle ? '묶음상품을 등록하시겠습니까?' : '구성품 설정을 저장하시겠습니까?');
      if (!ok) return;
      /* 신규: products 목록에 BUNDLE 상품 추가 */
      if (isNewBundle) {
        products.push({
          productId: newProdId,
          prodNm: newForm.prodNm,
          category: newForm.categoryId || '-',
          brandId: newForm.brandId,
          vendorId: newForm.vendorId,
          listPrice: newForm.listPrice,
          salePrice: newForm.salePrice,
          price: newForm.salePrice,
          prodTypeCd: 'BUNDLE',
          prodStatusCd: newForm.prodStatusCd,
          status: newForm.prodStatusCd === 'ACTIVE' ? '판매중' : '준비중',
          regDate: new Date().toISOString().slice(0, 10),
        });
      }
      /* bundles 데이터 반영 */
      const others = (bundles).filter(b => b.bundleProdId !== bundleProdId);
      const newBundles = [
        ...others,
        ...dtlItems.map((d, i) => ({
          bundleItemId: d.bundleItemId || `B_${bundleProdId}_${i + 1}`,
          siteId: '1', bundleProdId,
          itemProdId: d.itemProdId, itemSkuId: d.itemSkuId || null,
          itemQty: d.itemQty, priceRate: parseFloat(d.priceRate) || 0,
          sortOrd: d.sortOrd, useYn: d.useYn,
        })),
      ];
      bundles.splice(0, bundles.length, ...newBundles);
      /* categoryProds 동기화 */
      const filteredProds = window.safeArrayUtils.safeFilter(categoryProds, cp => String(cp.prodId) !== String(bundleProdId));
      const newCategoryProds = [
        ...filteredProds,
      ];
      window.safeArrayUtils.safeForEach(dtlCategories, (cat, i) => {
        newCategoryProds.push({ categoryProdId: `CP_${bundleProdId}_${i}`, siteId: '1', categoryId: cat.categoryId, prodId: bundleProdId, sortOrd: i + 1 });
      });
      categoryProds.splice(0, categoryProds.length, ...newCategoryProds);
      if (isNewBundle) { uiState.dtlMode = 'edit'; uiState.editBundleId = newProdId; }
      try {
        const res = await (isNewBundle ? boApiSvc.pdBundle.create({ prod: { ...newForm, prodTypeCd: 'BUNDLE' }, items: dtlItems }, '묶음상품관리', '등록') : boApiSvc.pdBundle.updateItems(bundleProdId, { items: dtlItems }, '묶음상품관리', '저장'));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(isNewBundle ? '등록되었습니다.' : '저장되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    /* ── 삭제 ── */
    const handleDelete = async bundleProdId => {
      const ok = await props.showConfirm('삭제', '묶음상품을 삭제하시겠습니까?\n구성품 설정도 함께 삭제됩니다.');
      if (!ok) return;
      bundles = (bundles).filter(b => b.bundleProdId !== bundleProdId);
      if (uiState.editBundleId === bundleProdId) closeDtl();
      try {
        const res = await boApiSvc.pdBundle.remove(bundleProdId, '묶음상품관리', '삭제');
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };


    // ── return ───────────────────────────────────────────────────────────────

    return {
      codes, uiState, bundles, bundleList,
      searchParam, pager, setPage,
      onSearch, onReset, rateSum, fnRateSumBadge, getProdNm, getProdPrice,
      getCategoryNm, getCategoryDepth, getBrandNm,
      categories, products, brands, categoryProds,
      dtlCategories, cfCatExcludeSet,
      addCategory, removeCategory, onCatDragStart, onCatDragOver, onCatDrop,
      newForm, newErrors,
      dtlItems, cfDtlRateSum, cfDtlRateOk, cfDtlRateDiff, cfDtlProdNm, cfDtlBundleId,
      openNew, openDtl, closeDtl, handleSave, handleDelete,
      addItem, removeItem,
      cfPickerList,
      onDragStart, onDragOver, onDrop, onSizeChange };
  },

  template: `
<div>
  <div class="page-title">묶음상품관리</div>
  <div style="margin:-8px 0 16px;padding:10px 14px;background:#f0f4ff;border-left:3px solid #6b7fe3;border-radius:0 6px 6px 0;font-size:13px;color:#444;line-height:1.7">
    <span><strong style="color:#3b4dbf">묶음상품</strong>은 여러 단품을 하나의 묶음으로 판매하는 방식입니다.</span>
    <button @click="uiState.descOpen=!uiState.descOpen" style="margin-left:8px;font-size:12px;color:#6b7fe3;background:none;border:none;cursor:pointer;padding:0">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" style="margin-top:6px">
      ✔ 구성 상품별 <strong>안분율</strong>을 설정해 가격·정산을 개별 처리합니다.<br>
      ✔ 구성 상품 단위로 <strong>부분 취소·교환·반품</strong>이 가능합니다.<br>
      ✔ 재고는 각 구성 상품의 재고를 개별 차감합니다.<br>
      <span style="color:#888;font-size:12px">예) 상의+하의 코디 세트, 3개 묶음 할인 패키지</span>
    </div>
  </div>

  <!-- ── 검색 ───────────────────────────────────────────────────────────── -->
  <div class="card">
    <div class="search-bar">
      <label class="search-label">묶음상품명</label>
      <input class="form-control" v-model="searchParam.nm" @keyup.enter="() => onSearch?.()"
             placeholder="묶음상품명 검색" style="max-width:320px">
      <div class="search-actions">
        <button class="btn btn-primary btn-sm" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <!-- ── 목록 ───────────────────────────────────────────────────────────── -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">묶음상품 목록</span>
      <span class="list-count">총 {{ pager.pageTotalCount }}건</span>
      <div class="pager-right">
        <button class="btn btn-green btn-sm" @click="openNew">+ 신규등록</button>
      </div>
    </div>
    <table class="bo-table">
      <thead><tr>
        <th style="width:36px;text-align:center;">번호</th>
        <th>묶음상품</th>
        <th style="width:70px;text-align:center">구성품수</th>
        <th style="width:130px;text-align:center">안분율 합계</th>
        <th style="width:110px;text-align:right">판매가</th>
        <th style="width:90px;text-align:center">상태</th>
        <th style="width:110px;text-align:center">관리</th>
      </tr></thead>
      <tbody>
        <template v-for="(g, idx) in bundleList" :key="g?.bundleProdId">
          <tr :style="(uiState.dtlMode==='edit' && uiState.editBundleId===g.bundleProdId) ? 'background:#e6f4ff' : ''">
            <td style="text-align:center;font-size:11px;color:#999;vertical-align:top;padding-top:12px;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
            <td>
              <div style="display:flex;align-items:flex-start;gap:6px">
                <span class="badge badge-blue" style="flex-shrink:0;margin-top:1px">묶음</span>
                <div>
                  <span class="title-link" @click="openDtl(g.bundleProdId)">{{ g.prodNm }}</span>
                  <div style="margin-top:3px;display:flex;flex-wrap:wrap;gap:4px">
                    <span v-for="(item,i) in (g?.items || [])" :key="item?.bundleItemId||i"
                          style="font-size:11px;color:#888;background:#f5f5f5;padding:1px 7px;border-radius:10px;white-space:nowrap">
                      {{ getProdNm(item.itemProdId) }}
                      <span style="color:#1677ff">×{{ item.itemQty }}</span>
                      <span style="color:#aaa;margin-left:2px">{{ item.priceRate }}%</span>
                    </span>
                  </div>
                </div>
              </div>
            </td>
            <td style="text-align:center">{{ g.itemCount }}개</td>
            <td style="text-align:center">
              <span :class="['badge', fnRateSumBadge(g.bundleProdId)]" style="font-size:12px">
                합계 {{ rateSum(g.bundleProdId).toFixed(1) }}%
              </span>
            </td>
            <td style="text-align:right">
              {{ g.prod ? (g.prod.salePrice || g.prod.price || 0).toLocaleString() + '원' : '-' }}
            </td>
            <td style="text-align:center">
              <span :class="['badge',
                g.prod && (g.prod.prodStatusCd||g.prod.status)==='ACTIVE'  ? 'badge-green' :
                g.prod && g.prod.status==='판매중'                          ? 'badge-green' :
                g.prod && (g.prod.prodStatusCd||g.prod.status)==='INACTIVE' ? 'badge-gray' : 'badge-orange']">
                {{ g.prod ? (g.prod.prodStatusCd || g.prod.status || '-') : '-' }}
              </span>
            </td>
            <td style="text-align:center" class="actions">
              <button class="btn btn-blue btn-xs" @click="openDtl(g.bundleProdId)">수정</button>
              <button class="btn btn-danger btn-xs" @click="handleDelete(g.bundleProdId)">삭제</button>
            </td>
          </tr>
        </template>
        <tr v-if="!bundleList.length">
          <td colspan="7" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
           <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
           <button v-for="n in pager.pageNums" :key="Math.random()" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
           <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageNo+1)">›</button>
           <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageTotalPage)">»</button>
         </div>
         <div class="pager-right">
           <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
             <option v-for="s in pager.pageSizes" :key="Math.random()" :value="s">{{ s }}개</option>
           </select>
         </div>
       </div>
  </div>

  <!-- ── 신규등록 / 구성관리 (인라인 Dtl) ────────────────────────────────────────── -->
  <div v-if="uiState.dtlMode !== null" class="card"
       :style="uiState.dtlMode==='new' ? 'border-top:3px solid #52c41a' : 'border-top:3px solid #1677ff'">

    <!-- ── Dtl 헤더 ─────────────────────────────────────────────────────── -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #f0f0f0">
      <div style="display:flex;align-items:center;gap:10px">
        <span :class="['badge', uiState.dtlMode==='new' ? 'badge-green' : 'badge-blue']">
          {{ uiState.dtlMode==='new' ? '신규' : '묶음' }}
        </span>
        <strong style="font-size:15px">{{ cfDtlProdNm }}</strong>
        <span style="font-size:12px;color:#aaa">{{ uiState.dtlMode==='new' ? '묶음상품 등록' : '구성품 관리' }}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span :class="['badge', cfDtlRateOk ? 'badge-green' : 'badge-red']"
              style="font-size:12px;padding:4px 10px;font-weight:600">
          안분율 {{ cfDtlRateSum.toFixed(1) }}%
          <span v-if="!cfDtlRateOk"> ({{ cfDtlRateDiff > 0 ? '+' : '' }}{{ cfDtlRateDiff }}% 필요)</span>
          <span v-else> ✓</span>
        </span>
        <button class="btn btn-secondary btn-sm" @click="closeDtl">닫기</button>
        <button class="btn btn-primary btn-sm" @click="handleSave">
          {{ uiState.dtlMode==='new' ? '등록' : '저장' }}
        </button>
      </div>
    </div>

    <!-- ── ① 기본정보 (신규 시만 표시) ──────────────────────────────────────────── -->
    <div v-if="uiState.dtlMode==='new'" style="background:#fafafa;border:1px solid #f0f0f0;border-radius:8px;padding:16px 20px;margin-bottom:20px">
      <div style="font-size:13px;font-weight:600;color:#555;margin-bottom:12px">묶음상품 기본정보 (pd_prod)</div>
      <div class="form-row">
        <div class="form-group" style="flex:2">
          <label class="form-label">묶음상품명 <span style="color:#f5222d">*</span></label>
          <input class="form-control" :class="{'is-invalid': newErrors.prodNm}"
                 v-model="newForm.prodNm" placeholder="묶음상품명 입력" maxlength="200">
          <div v-if="newErrors.prodNm" class="field-error">{{ newErrors.prodNm }}</div>
        </div>
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" v-model="newForm.prodStatusCd">
            <option v-for="c in codes.bundle_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">정가 (list_price)</label>
          <input type="number" class="form-control" v-model.number="newForm.listPrice"
                 min="0" placeholder="0">
        </div>
        <div class="form-group">
          <label class="form-label">판매가 (sale_price) <span style="color:#f5222d">*</span></label>
          <input type="number" class="form-control" :class="{'is-invalid': newErrors.salePrice}"
                 v-model.number="newForm.salePrice" min="0" placeholder="0">
          <div v-if="newErrors.salePrice" class="field-error">{{ newErrors.salePrice }}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">브랜드</label>
          <select class="form-control" v-model="newForm.brandId">
            <option value="">선택</option>
            <option v-for="b in ([]||[])" :key="b?.brandId" :value="b.brandId">
              {{ b.brandNm || b.brandName }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">판매업체</label>
          <select class="form-control" v-model="newForm.vendorId">
            <option value="">선택</option>
            <option v-for="v in ([]||[])" :key="v?.vendorId" :value="v.vendorId">
              {{ v.vendorNm || v.vendorName }}
            </option>
          </select>
        </div>
      </div>

    </div>

    <!-- ── ② 카테고리 N개 (신규/편집 공통) ───────────────────────────────────────── -->
    <div class="form-row" style="margin-bottom:16px">
      <div class="form-group">
        <label class="form-label">카테고리 <span style="font-size:11px;color:#aaa;font-weight:400">N개 등록 · 첫 번째 = 대표</span></label>
        <div style="border:1px solid #e2e8f0;border-radius:6px;background:#fff;min-height:38px;padding:4px 6px;">
          <div v-if="dtlCategories.length===0" style="color:#aaa;font-size:12px;padding:4px 2px;">카테고리를 추가해주세요</div>
          <div v-for="(cat,idx) in dtlCategories" :key="cat?.categoryId"
               draggable="true" @dragstart="onCatDragStart(idx)" @dragover.prevent="onCatDragOver(idx)" @drop.prevent="onCatDrop()"
               :style="uiState.catDragoverIdx===idx?'opacity:0.5;':''"
               style="display:flex;align-items:center;gap:4px;padding:2px 0;">
            <span style="cursor:grab;color:#bbb;font-size:14px;flex-shrink:0;">≡</span>
            <span v-if="idx===0" style="font-size:10px;background:#f9a8d4;color:#9d174d;padding:1px 5px;border-radius:10px;flex-shrink:0;">대표</span>
            <span style="font-size:11px;color:#94a3b8;flex-shrink:0;">{{ ['','대','중','소'][cat.depth]||cat.depth }}▸</span>
            <span style="font-size:13px;flex:1;">{{ cat.categoryNm }}</span>
            <button type="button" @click="removeCategory(idx)" style="border:none;background:none;color:#f87171;cursor:pointer;font-size:13px;padding:0 2px;flex-shrink:0;">✕</button>
          </div>
          <button type="button" @click="uiState.catPickerOpen=true"
                  style="margin-top:4px;font-size:12px;color:#6366f1;border:1px dashed #a5b4fc;background:none;border-radius:4px;padding:2px 8px;cursor:pointer;width:100%;">+ 카테고리 추가</button>
        </div>
      </div>
    </div>

    <!-- ── ③ 구성품 목록 ───────────────────────────────────────────────────── -->
    <div style="font-size:13px;font-weight:600;color:#555;margin-bottom:10px">
      구성품 목록 (pd_prod_bundle_item)
      <span style="font-weight:400;color:#aaa;margin-left:6px">※ 안분율 합계 = 100% 필수</span>
    </div>
    <table class="bo-table">
      <thead><tr>
        <th style="width:28px"></th>
        <th>구성품 상품 (item_prod_id)</th>
        <th style="width:90px;text-align:right">개별가</th>
        <th style="width:80px;text-align:center">수량</th>
        <th style="width:140px;text-align:center">안분율 % (price_rate)</th>
        <th style="width:110px;text-align:right">환불기준가</th>
        <th style="width:60px;text-align:center">사용</th>
        <th style="width:50px;text-align:center">삭제</th>
      </tr></thead>
      <tbody>
        <tr v-for="(item, idx) in dtlItems" :key="item?._id"
            draggable="true"
            @dragstart="onDragStart(idx)"
            @dragover.prevent="onDragOver(idx)"
            @drop="onDrop()"
            :style="uiState.dragoverIdx===idx ? 'background:#e6f4ff' : ''">
          <td style="text-align:center;cursor:grab;color:#bbb;font-size:17px;user-select:none">≡</td>
          <td>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="font-size:11px;color:#aaa;background:#f5f5f5;padding:1px 6px;border-radius:4px">#{{ item.itemProdId }}</span>
              <span style="font-weight:500">{{ getProdNm(item.itemProdId) }}</span>
            </div>
          </td>
          <td style="text-align:right;color:#888;font-size:12px">
            {{ getProdPrice(item.itemProdId).toLocaleString() }}원
          </td>
          <td style="text-align:center">
            <input type="number" class="form-control" v-model.number="item.itemQty"
                   min="1" style="width:60px;text-align:center;margin:0 auto;padding:3px 6px">
          </td>
          <td>
            <div style="display:flex;align-items:center;justify-content:center;gap:4px">
              <input type="number" class="form-control" v-model.number="item.priceRate"
                     min="0" max="100" step="0.01"
                     style="width:72px;text-align:right;padding:3px 6px">
              <span style="color:#888">%</span>
            </div>
          </td>
          <td style="text-align:right;font-size:12px;color:#1677ff">
            <span v-if="newForm.salePrice > 0 || getProdPrice(cfDtlBundleId) > 0">
              {{ Math.round((newForm.salePrice || getProdPrice(cfDtlBundleId)) * item.priceRate / 100).toLocaleString() }}원
            </span>
            <span v-else style="color:#ccc">-</span>
          </td>
          <td style="text-align:center">
            <select class="form-control" v-model="item.useYn" style="width:56px;padding:2px 4px">
              <option v-for="c in codes.use_yn" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
            </select>
          </td>
          <td style="text-align:center">
            <button class="btn btn-danger btn-xs" @click="removeItem(idx)">✕</button>
          </td>
        </tr>
        <tr v-if="!dtlItems.length">
          <td colspan="8" style="text-align:center;padding:24px;color:#aaa">
            구성품이 없습니다. 아래 [+ 구성품 추가] 버튼으로 추가하세요.
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ── 구성품 추가 / 안분율 안내 ────────────────────────────────────────────── -->
    <div style="margin-top:12px;display:flex;align-items:flex-start;gap:12px">
      <button class="btn btn-secondary btn-sm" style="flex-shrink:0" @click="uiState.pickerOpen=true;uiState.pickerSearch=''">
        + 구성품 추가
      </button>
      <div v-if="dtlItems.length" style="flex:1;padding:7px 14px;border-radius:6px;font-size:12px"
           :style="cfDtlRateOk
             ? 'background:#f6ffed;border:1px solid #b7eb8f;color:#389e0d'
             : 'background:#fff1f0;border:1px solid #ffa39e;color:#cf1322'">
        <strong>안분율(price_rate) 합계 = 100% 필수</strong> — 부분클레임(반품/취소) 시 구성품별 환불 금액 계산 기준입니다.
        <span v-if="!cfDtlRateOk"> 현재 {{ cfDtlRateSum.toFixed(1) }}% — {{ Math.abs(cfDtlRateDiff) }}%
          {{ cfDtlRateDiff > 0 ? '부족' : '초과' }}합니다.</span>
        <span v-else> 배분 완료 ✓</span>
      </div>
    </div>
  </div>

  <!-- ── 구성품 Picker Modal ─────────────────────────────────────────────── -->
  <teleport to="body" v-if="uiState.pickerOpen">
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:center;justify-content:center"
         @click.self="uiState.pickerOpen=false">
      <div style="background:#fff;border-radius:14px;padding:24px;width:580px;max-height:72vh;display:flex;flex-direction:column;box-shadow:0 8px 48px rgba(0,0,0,0.22)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <strong style="font-size:15px">구성품 상품 선택</strong>
          <button class="btn btn-secondary btn-xs" @click="uiState.pickerOpen=false">닫기</button>
        </div>
        <input class="form-control" v-model="uiState.pickerSearch"
               placeholder="상품명 / ID 검색" style="margin-bottom:12px">
        <div style="overflow-y:auto;flex:1;border:1px solid #eee;border-radius:8px">
          <table class="bo-table" style="margin:0">
            <thead><tr>
              <th style="width:44px">ID</th>
              <th>상품명</th>
              <th style="width:70px;text-align:center">카테고리</th>
              <th style="width:90px;text-align:right">판매가</th>
              <th style="width:56px;text-align:center">선택</th>
            </tr></thead>
            <tbody>
              <tr v-for="p in cfPickerList" :key="p?.productId">
                <td style="color:#aaa;font-size:12px">{{ p.productId }}</td>
                <td>{{ p.prodNm || p.productName }}</td>
                <td style="text-align:center;font-size:12px;color:#888">{{ p.category || '-' }}</td>
                <td style="text-align:right">{{ (p.salePrice || p.price || 0).toLocaleString() }}원</td>
                <td style="text-align:center">
                  <button class="btn btn-blue btn-xs" @click="addItem(p)">선택</button>
                </td>
              </tr>
              <tr v-if="!cfPickerList.length">
                <td colspan="5" style="text-align:center;padding:24px;color:#aaa">검색 결과가 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </teleport>

  <!-- ── 카테고리 피커 모달 ───────────────────────────────────────────────────── -->
  <category-tree mode="picker" :show="uiState.catPickerOpen" :exclude-ids="cfCatExcludeSet"
                 @select="addCategory" @close="uiState.catPickerOpen=false" />
</div>`
};
