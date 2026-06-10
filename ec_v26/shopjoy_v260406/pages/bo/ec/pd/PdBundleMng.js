/* ShopJoy Admin - 묶음상품관리 (pd_prod_bundle_item) */
window.PdBundleMng = {
  name: 'PdBundleMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const categories = reactive([]);
    const products = reactive([]);
    const brands = reactive([]);
    const bundles = reactive([]);
    const categoryProds = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, dtlMode: 'new', detailActive: false, editBundleId: null, catPickerOpen: false, catPickerSearch: '', catDragIdx: null, catDragoverIdx: null, pickerOpen: false, pickerSearchType: '', pickerSearch: '', dragIdx: null, dragoverIdx: null, brandModalOpen: false, vendorModalOpen: false });
    const codes = reactive({
      product_statuses: [],
      bundle_types: [],
      bundle_statuses: [],
      use_yn: [],
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PdBundleMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return onSearch();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      // 묶음상품 신규 등록 (인라인 Dtl 열기)
      } else if (cmd === 'bundles-add') {
        return openNew();
      // 묶음상품 Dtl 저장
      } else if (cmd === 'detailPanel-save') {
        return handleSave();
      // 묶음상품 Dtl 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDtl();
      // 페이지 크기 변경
      } else if (cmd === 'bundles-pager-sizeChange') {
        return onSizeChange();
      // 브랜드 선택 모달 열기
      } else if (cmd === 'brandModal-open') {
        uiState.brandModalOpen = true;
        return;
      // 판매업체 선택 모달 열기
      } else if (cmd === 'vendorModal-open') {
        uiState.vendorModalOpen = true;
        return;
      // 카테고리 피커 모달 열기
      } else if (cmd === 'categoryModal-open') {
        uiState.catPickerOpen = true;
        return;
      // 카테고리 피커 모달 닫기
      } else if (cmd === 'categoryModal-close') {
        uiState.catPickerOpen = false;
        return;
      // 구성품 피커 모달 열기
      } else if (cmd === 'prodPickModal-open') {
        return openPicker();
      // 구성품 피커 모달 닫기
      } else if (cmd === 'prodPickModal-close') {
        uiState.pickerOpen = false;
        return;
      // 구성품 피커 검색
      } else if (cmd === 'prodPickModal-search') {
        return onPickerSearch();
      // 페이지 번호 클릭
      } else if (cmd === 'bundles-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PdBundleMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 행 클릭 → Dtl 열기
      if (cmd === 'bundles-rowEdit') {
        return openDtl(param);
      // 그리드 행 삭제
      } else if (cmd === 'bundles-rowDelete') {
        return handleDelete(param);
      // 카테고리 행 삭제
      } else if (cmd === 'detailPanel-categoryRemove') {
        return removeCategory(param);
      // 카테고리 행 드래그
      } else if (cmd === 'detailPanel-categoryDragStart') {
        return onCatDragStart(param);
      } else if (cmd === 'detailPanel-categoryDragOver') {
        return onCatDragOver(param);
      } else if (cmd === 'detailPanel-categoryDrop') {
        return onCatDrop();
      // 구성품 행 삭제
      } else if (cmd === 'detailPanel-itemRemove') {
        return removeItem(param);
      // 구성품 행 드래그
      } else if (cmd === 'detailPanel-itemDragStart') {
        return onDragStart(param);
      } else if (cmd === 'detailPanel-itemDragOver') {
        return onDragOver(param);
      } else if (cmd === 'detailPanel-itemDrop') {
        return onDrop();
      // 카테고리 모달에서 선택
      } else if (cmd === 'categoryModal-select') {
        return addCategory(param);
      // 구성품 피커 모달에서 선택
      } else if (cmd === 'prodPickModal-add') {
        return addItem(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };


    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ PdBundleMng : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'category-pick') {
        if (result == null) {
            uiState.catPickerOpen = false;
            return;
        }
          return addCategory(result);
      // 브랜드 선택 모달 콜백
      } else if (cmd === 'brand-select') {
        uiState.brandModalOpen = false;
        if (result) { newForm.brandId = result.brandId; newForm._brandNm = result.brandNm || result.brandName || ''; }
        return;
      // 판매업체 선택 모달 콜백
      } else if (cmd === 'vendor-select') {
        uiState.vendorModalOpen = false;
        if (result) { newForm.vendorId = result.vendorId; newForm._vendorNm = result.vendorNm || result.vendorName || ''; }
        return;
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.product_statuses = codeStore.sgGetGrpCodes('PRODUCT_STATUS');
        codes.bundle_types = codeStore.sgGetGrpCodes('BUNDLE_TYPE');
        codes.bundle_statuses = codeStore.sgGetGrpCodes('BUNDLE_STATUS');
        codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // onMounted에서 API 로드

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleSearchData — 처리 */
    const handleSearchData = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const bundleParams = {
          pageNo: bundleGridPager.pageNo, pageSize: bundleGridPager.pageSize,
          ...(searchParam.nm ? { nm: searchParam.nm.trim() } : {}),
        };
        const [bundlesRes, prodsRes, catsRes] = await Promise.all([
          boApiSvc.pdBundle.getPage(bundleParams, '상품번들관리', '목록조회'),
          boApiSvc.pdProd.getPage({ pageNo: 1, pageSize: 10000 }, '상품번들관리', '목록조회'),
          boApiSvc.pdCategory.getPage({ pageNo: 1, pageSize: 10000 }, '상품번들관리', '목록조회'),
        ]);
        const dBundles = bundlesRes.data?.data;
        bundles.splice(0, bundles.length, ...(dBundles?.pageList || dBundles?.list || []));
        bundleGridPager.pageTotalCount = dBundles?.pageTotalCount || 0;
        bundleGridPager.pageTotalPage  = dBundles?.pageTotalPage  || 1;
        coUtil.cofBuildPagerNums(bundleGridPager);
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

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => ({ nm: '' });
    const searchParam = reactive(_initSearchParam());

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchData('DEFAULT');
    });

const bundleGridPager    = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    // 'edit' 시 bundleId는 uiState.editBundleId 사용

    /* -- 신규등록 폼 (pd_prod 기본정보) -- */
    const newForm = reactive({
      prodNm: '', brandId: '', vendorId: '',
      listPrice: 0, salePrice: 0,
      prodStatusCd: 'DRAFT',
    });
    const newErrors = reactive({});

    /* -- 카테고리 N개 (pd_category_prod) — 신규/편집 공통 -- */
    const dtlCategories  = reactive([]);  // [{ categoryId, categoryNm, depth }]
    const cfCatExcludeSet = computed(() => new Set(dtlCategories.map(c => String(c.categoryId))));

    /* onCatDragStart — 이벤트 */
    const onCatDragStart = idx => { uiState.catDragIdx = idx; };

    /* onCatDragOver — 이벤트 */
    const onCatDragOver  = idx => { uiState.catDragoverIdx = idx; };

    /* onCatDrop — 이벤트 */
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

    /* addCategory — 추가 */
    const addCategory = cat => {
      const id = cat.categoryId;
      if (window.safeArrayUtils.safeSome(dtlCategories, c => String(c.categoryId) === String(id))) { return; }
      dtlCategories.push({ categoryId: id, categoryNm: cat.categoryNm || String(id), depth: cat.depth || cat.categoryDepth || 1 });
      uiState.catPickerOpen = false;
    };

    /* removeCategory — 제거 */
    const removeCategory = idx => dtlCategories.splice(idx, 1);

    /* getCategoryNm — 조회 */
    const getCategoryNm = id => {
      const c = (categories || []).find(c => c.categoryId == id);
      return c ? (c.categoryNm || c.cateNm || id) : String(id);
    };

    /* getCategoryDepth — 조회 */
    const getCategoryDepth = id => {
      const c = (categories || []).find(c => c.categoryId == id);
      return c ? (c.depth || 1) : 1;
    };

    /* -- 구성품 목록 (신규/편집 공통) -- */
    const dtlItems = reactive([]);
    let _seq = 1;

    /* -- 구성품 추가 피커 / 드래그 상태는 uiState에서 관리 -- */

    /* getProd — 조회 */
    const getProd     = id => (products || []).find(p => p.productId === id);

    /* getProdNm — 조회 */
    const getProdNm   = id => { const p = getProd(id); return p ? (p.prodNm || p.productName || '상품#' + id) : '상품#' + id; };

    /* getProdPrice — 조회 */
    const getProdPrice = id => { const p = getProd(id); return p ? (p.salePrice || p.price || 0) : 0; };

    /* getBrandNm — 조회 (모달 선택 시 보관한 이름 우선) */
    const getBrandNm = id => {
      if (newForm._brandNm) { return newForm._brandNm; }
      const b = (brands || []).find(b => b.brandId == id);
      return b ? (b.brandNm || b.brandName || id) : id;
    };

    /* getVendorNm — 조회 (모달 선택 시 보관한 이름 우선) */
    const getVendorNm = id => newForm._vendorNm || id;

    /* rateSum — 비율 합계 */
    const rateSum = bundleProdId =>
      (bundles)
        .filter(b => b.bundleProdId === bundleProdId)
        .reduce((s, b) => s + (b.priceRate || 0), 0);

    /* fnRateSumBadge — 유틸 */
    const fnRateSumBadge = id => Math.abs(rateSum(id) - 100) < 0.01 ? 'badge-green' : 'badge-red';

    /* -- 묶음상품 목록 -- */
    const bundleList = reactive([]);

    /* updateBundleList — 갱신 */
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


    /* onSearch — 조회 */
    const onSearch = async () => {
      bundleGridPager.pageNo = 1;
      await handleSearchData('DEFAULT');
    };

    /* onReset — 초기화 */
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      bundleGridPager.pageNo = 1;
      await handleSearchData();
    };

    /* setPage — 설정 */
    const setPage  = async n => { if (n >= 1 && n <= bundleGridPager.pageTotalPage) { bundleGridPager.pageNo = n; await handleSearchData(); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { bundleGridPager.pageNo = 1; handleSearchData(); };

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   detailActive=false → 저장/취소 등 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      uiState.dtlMode = 'new';
      uiState.detailActive = false;   // 버튼 숨김
      uiState.editBundleId = null;
      Object.assign(newForm, { prodNm: '', brandId: '', vendorId: '', listPrice: 0, salePrice: 0, prodStatusCd: 'DRAFT' });
      Object.keys(newErrors).forEach(k => delete newErrors[k]);
      dtlCategories.length = 0;
      dtlItems.length = 0;
    };

    /* openNew — 신규 열기 (빈 폼 + 활성 → 저장/취소 노출) */
    const openNew = () => {
      uiState.dtlMode = 'new';
      uiState.detailActive = true;    // 신규 입력 가능 → 저장/취소 노출
      uiState.editBundleId = null;
      Object.assign(newForm, { prodNm: '', brandId: '', vendorId: '', listPrice: 0, salePrice: 0, prodStatusCd: 'DRAFT' });
      Object.keys(newErrors).forEach(k => delete newErrors[k]);
      dtlCategories.length = 0;
      dtlItems.length = 0;
    };

    /* openDtl — 열기 (행 선택 → 저장/취소 노출) */
    const openDtl = bundleProdId => {
      uiState.dtlMode = 'edit';
      uiState.detailActive = true;    // 행 선택 → 저장/취소 노출
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

    /* closeDtl — 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDtl = () => { resetDetailToNew(); };

    /* -- 편집 모드에서 표시할 묶음상품명 -- */
    const cfDtlProdNm = computed(() => uiState.dtlMode === 'new' ? (newForm.prodNm || '(신규 묶음상품)') : getProdNm(uiState.editBundleId));
    const cfDtlBundleId = computed(() => uiState.dtlMode === 'edit' ? uiState.editBundleId : null);

    /* -- 안분율 -- */
    const cfDtlRateSum  = computed(() => dtlItems.reduce((s, b) => s + (parseFloat(b.priceRate) || 0), 0));
    const cfDtlRateOk   = computed(() => Math.abs(cfDtlRateSum.value - 100) < 0.01);
    const cfDtlRateDiff = computed(() => parseFloat((100 - cfDtlRateSum.value).toFixed(2)));

    /* -- 피커 목록 -- */
    const cfCurrentBundleId = computed(() => uiState.dtlMode === 'edit' ? uiState.editBundleId : -1);
    /* 피커 상품 서버검색 — 검색어/검색대상을 pdProd.getPage 에 전달(상위 50건).
       이미 담긴 항목·자기자신은 서버결과에서 클라이언트 제외(소량). 모달열기/Enter/[조회] 시점에만 호출. */
    const pickerResults = reactive([]);
    /* onPickerSearch — 이벤트 */
    const onPickerSearch = async () => {
      try {
        const params = { pageNo: 1, pageSize: 50 };
        const sv = (uiState.pickerSearch || '').trim();
        if (sv) {
          params.searchValue = sv;
          if (uiState.pickerSearchType) { params.searchType = uiState.pickerSearchType; }
        }
        const res = await boApiSvc.pdProd.getPage(params, '상품번들관리', '상품검색');
        const list = (res.data?.data?.pageList || res.data?.data?.list || [])
          .map(p => ({ ...p, productId: p.prodId ?? p.productId }));
        pickerResults.splice(0, pickerResults.length, ...list);
      } catch (e) {
        console.error('[onPickerSearch]', e);
        pickerResults.splice(0, pickerResults.length);
      }
    };
    /* openPicker — 열기 */
    const openPicker = () => {
      uiState.pickerOpen = true; uiState.pickerSearchType = ''; uiState.pickerSearch = '';
      onPickerSearch();
    };
    /* 서버결과에서 이미 담긴 항목·자기자신 제외 */
    const cfPickerList = computed(() => {
      const used = new Set(dtlItems.map(d => d.itemProdId));
      return pickerResults.filter(p => p.productId !== cfCurrentBundleId.value && !used.has(p.productId));
    });

    /* addItem — 추가 */
    const addItem = prod => {
      const maxSort = dtlItems.length ? Math.max(...dtlItems.map(d => d.sortOrd)) : 0;
      dtlItems.push({
        _id: _seq++, bundleItemId: null,
        bundleProdId: uiState.editBundleId,
        itemProdId: prod.productId, itemSkuId: null,
        itemQty: 1, priceRate: 0, sortOrd: maxSort + 1, useYn: 'Y',
      });
      uiState.pickerOpen = false; uiState.pickerSearchType = ''; uiState.pickerSearch = '';
    };

    /* removeItem — 제거 */
    const removeItem = idx => dtlItems.splice(idx, 1);

    /* onDragStart — 드래그 시작 */
    const onDragStart = idx => { uiState.dragIdx = idx; };

    /* onDragOver — 드래그 오버 */
    const onDragOver  = idx => { uiState.dragoverIdx = idx; };

    /* onDrop — 이벤트 */
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

    /* handleSave — 저장 */
    const handleSave = async () => {
      /* 유효성 */
      Object.keys(newErrors).forEach(k => delete newErrors[k]);
      if (uiState.dtlMode === 'new') {
        if (!newForm.prodNm.trim())   { newErrors.prodNm = '묶음상품명을 입력해주세요.'; }
        if (!newForm.salePrice || newForm.salePrice <= 0) { newErrors.salePrice = '판매가를 입력해주세요.'; }
        if (Object.keys(newErrors).length) { showToast('입력 내용을 확인해주세요.', 'error'); return; }
      }
      if (!cfDtlRateOk.value) {
        showToast(`안분율 합계가 100%여야 합니다. (현재 ${cfDtlRateSum.value.toFixed(1)}%)`, 'error');
        return;
      }

      const isNewBundle = uiState.dtlMode === 'new';
      const newProdId = isNewBundle
        ? (Math.max(0, ...(products || []).map(p => p.productId)) + 1)
        : null;
      const bundleProdId = isNewBundle ? newProdId : uiState.editBundleId;

      const ok = await showConfirm(isNewBundle ? '등록' : '저장', isNewBundle ? '묶음상품을 등록하시겠습니까?' : '구성품 설정을 저장하시겠습니까?');
      if (!ok) { return; }
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
        /* PdProdBundleSaveDto: CreateRequest {prodNm, siteId, items[]}, UpdateItemsRequest {items[]}, Item {prodId, qty, sortOrd} */
        const bundleItems = dtlItems.map(d => ({ prodId: d.itemProdId, qty: d.itemQty, sortOrd: d.sortOrd }));
        const res = await (isNewBundle
          ? boApiSvc.pdBundle.create({ prodNm: newForm.prodNm, siteId: newForm.siteId || null, items: bundleItems }, '묶음상품관리', '등록')
          : boApiSvc.pdBundle.updateItems(bundleProdId, { items: bundleItems }, '묶음상품관리', '저장'));
        if (showToast) { showToast(isNewBundle ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        /* 저장 완료: 목록 재조회 + 상세영역은 유지하고 빈 신규 폼(비활성)으로 초기화 */
        await handleSearchData('RELOAD');
        resetDetailToNew();
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* handleDelete — 삭제 */
    const handleDelete = async bundleProdId => {
      const ok = await showConfirm('삭제', '묶음상품을 삭제하시겠습니까?\n구성품 설정도 함께 삭제됩니다.');
      if (!ok) { return; }
      bundles = (bundles).filter(b => b.bundleProdId !== bundleProdId);
      if (uiState.editBundleId === bundleProdId) { closeDtl(); }
      try {
        const res = await boApiSvc.pdBundle.remove(bundleProdId, '묶음상품관리', '삭제');
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };
    /* 묶음상품 목록 그리드 컬럼 (모든 셀 커스텀 → #cell 슬롯, 헤더만 정의) */
        // --- [컬럼 정의] ---
        const columns = {};
        columns.baseSearch = [
      { key: 'nm', label: '묶음상품명', type: 'text', placeholder: '묶음상품명 검색', width: '320px' },
    ];

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // 번들 그리드
    columns.bundleGrid = [
      { key: 'prodNm',    label: '묶음상품' },
      { key: 'itemCount', label: '구성품수',   style: 'width:70px;text-align:center;', align: 'center', fmt: (v) => (v + '개') },
      { key: 'rateSum',   label: '안분율 합계', style: 'width:130px;text-align:center;', align: 'center',
        badge: (g) => fnRateSumBadge(g.bundleProdId), fmt: (v, g) => ('합계 ' + rateSum(g.bundleProdId).toFixed(1) + '%') },
      { key: 'salePrice', label: '판매가',     style: 'width:110px;text-align:right;', align: 'right',
        fmt: (v, g) => (g.prod ? (g.prod.salePrice || g.prod.price || 0).toLocaleString() + '원' : '-') },
      { key: 'status',    label: '상태',       style: 'width:90px;text-align:center;', align: 'center',
        badge: (g) => fnBundleStatusBadge(g).replace('badge ', ''), fmt: (v, g) => fnBundleStatusText(g) },
    ];
    /* fnBundleRowStyle — 유틸 */
    const fnBundleRowStyle = (g) =>
      (uiState.dtlMode === 'edit' && uiState.editBundleId === g.bundleProdId)
        ? 'background:#e6f4ff' : '';
    /* fnBundleStatusBadge — 유틸 */
    const fnBundleStatusBadge = (g) => {
      const st = g.prod ? (g.prod.prodStatusCd || g.prod.status) : null;
      if (st === 'ACTIVE' || st === '판매중') { return 'badge badge-green'; }
      if (st === 'INACTIVE') { return 'badge badge-gray'; }
      return 'badge badge-orange';
    };
    /* fnBundleStatusText — 유틸 */
    const fnBundleStatusText = (g) =>
      g.prod ? (g.prod.prodStatusCd || g.prod.status || '-') : '-';

    // 신규 번들 폼
    columns.newBundleForm = [
      { key: 'prodNm',       label: '묶음상품명', type: 'text', required: true,
        placeholder: '묶음상품명 입력', colSpan: 2 },
      { key: 'prodStatusCd', label: '상태', type: 'select', options: () => codes.bundle_statuses },
      { type: 'rowBreak' },
      { key: 'listPrice',    label: '정가 (list_price)', type: 'number', min: 0, placeholder: '0' },
      { key: 'salePrice',    label: '판매가 (sale_price)', type: 'number', required: true, min: 0, placeholder: '0' },
      { type: 'rowBreak' },
      { key: 'brandId',      label: '브랜드', type: 'slot', name: 'brand' },
      { key: 'vendorId',     label: '판매업체', type: 'slot', name: 'vendor' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      codes, uiState, bundles, bundleList, searchParam, bundleGridPager, // 상태 / 데이터
      dtlCategories, dtlItems, newForm, newErrors,                                             // 상태 / 데이터
      handleBtnAction, handleSelectAction, fnCallbackModal,                                                       // dispatch (모든 이벤트 / 액션 라우팅)
      cfCatExcludeSet, cfDtlRateSum, cfDtlRateOk, cfDtlRateDiff, cfDtlProdNm, cfDtlBundleId, cfPickerList, // computed
      fnBundleRowStyle,                                                                  // 헬퍼
      getProdNm, getProdPrice, getBrandNm, getVendorNm,                                 // 헬퍼
    };
  },

  template: `
<bo-page title="묶음상품관리"
    desc-summary="묶음상품은 여러 단품을 하나의 묶음으로 판매하는 방식입니다."
    desc-detail="✔ 구성 상품별 안분율을 설정해 가격·정산을 개별 처리합니다.&#10;✔ 구성 상품 단위로 부분 취소·교환·반품이 가능합니다.&#10;✔ 재고는 각 구성 상품의 재고를 개별 차감합니다.&#10;예) 상의+하의 코디 세트, 3개 묶음 할인 패키지">
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 목록 ====================================================== -->
  <bo-container title="묶음상품 목록" :count-text="bundleGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <button class="btn btn_new" @click="handleBtnAction('bundles-add')">
        + 신규등록
      </button>
    </template>
    <bo-grid bare :columns="columns.bundleGrid" :rows="bundleList" :row-style="fnBundleRowStyle" row-key="bundleProdId" :selected-key="uiState.editBundleId"
      empty-text="데이터가 없습니다." :row-actions="true">
    <template #cell-prodNm="{ row: g }">
      <td style="font-size:12px;">
        <div style="display:flex;align-items:flex-start;gap:6px">
          <span class="badge badge-blue" style="flex-shrink:0;margin-top:1px">
            묶음
          </span>
          <div>
            <span class="title-link" @click="handleSelectAction('bundles-rowEdit', g.bundleProdId)">
              {{ g.prodNm }}
            </span>
            <div style="margin-top:3px;display:flex;flex-wrap:wrap;gap:4px">
              <span v-for="(item,i) in (g?.items || [])" :key="(item && item.bundleItemId)||i" style="font-size:11px;color:#888;background:#f5f5f5;padding:1px 7px;border-radius:10px;white-space:nowrap">
              {{ getProdNm(item.itemProdId) }}
              <span style="color:#1677ff">
                ×{{ item.itemQty }}
              </span>
              <span style="color:#aaa;margin-left:2px">
                {{ item.priceRate }}%
              </span>
            </span>
          </div>
        </div>
      </div>
    </td>
  </template>
  <template #row-actions="{ row: g }">
    <button class="btn btn_row_edit" @click="handleSelectAction('bundles-rowEdit', g.bundleProdId)">
      수정
    </button>
    <button class="btn btn_row_delete" @click="handleSelectAction('bundles-rowDelete', g.bundleProdId)">
      삭제
    </button>
  </template>
    </bo-grid>
    <!-- 페이저는 그리드 밖, 컨테이너 안에 배치 -->
    <bo-pager :pager="bundleGridPager" :on-set-page="n => handleBtnAction('bundles-pager-setPage', n)" :on-size-change="() => handleBtnAction('bundles-pager-sizeChange')" />
  </bo-container>
  <!-- ===== □. 목록 ====================================================== -->
  <!-- ===== ■. 신규등록 / 구성관리 (인라인 Dtl, 항상 표시) =================================== -->
  <bo-container
    :card-style="!uiState.detailActive ? 'border-top:3px solid #d9d9d9' : (uiState.dtlMode==='new' ? 'border-top:3px solid #52c41a' : 'border-top:3px solid #1677ff')">
  <!-- ===== ■.■. 미선택 안내 (영역은 항상 표시) ================================= -->
  <div v-if="!uiState.detailActive" style="padding:24px;text-align:center;color:#aaa;font-size:13px">
    목록에서 행을 선택하거나 [+신규]를 누르세요
  </div>
  <!-- ===== ■.■. 활성 상세영역 (행 선택 / 신규 시) ============================= -->
  <div v-if="uiState.detailActive">
  <!-- ===== ■.■. Dtl 헤더 ================================================ -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #f0f0f0">
    <div style="display:flex;align-items:center;gap:10px">
      <span :class="['badge', uiState.dtlMode==='new' ? 'badge-green' : 'badge-blue']">
        {{ uiState.dtlMode==='new' ? '신규' : '묶음' }}
      </span>
      <strong style="font-size:15px">
        {{ cfDtlProdNm }}
      </strong>
      <span style="font-size:12px;color:#aaa">
        {{ uiState.dtlMode==='new' ? '묶음상품 등록' : '구성품 관리' }}
      </span>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <span :class="['badge', cfDtlRateOk ? 'badge-green' : 'badge-red']"
          style="font-size:12px;padding:4px 10px;font-weight:600">
        안분율 {{ cfDtlRateSum.toFixed(1) }}%
        <span v-if="!cfDtlRateOk">
          ({{ cfDtlRateDiff > 0 ? '+' : '' }}{{ cfDtlRateDiff }}% 필요)
        </span>
        <span v-else>
          ✓
        </span>
      </span>
    </div>
  </div>
  <!-- ===== □.□. Dtl 헤더 ================================================ -->
  <!-- ===== ■.■. 신규 묶음상품 기본정보 (BoFormArea 자동 렌더, 신규 시만 표시) ============= -->
  <div v-if="uiState.dtlMode==='new'" style="background:#fafafa;border:1px solid #f0f0f0;border-radius:8px;padding:16px 20px;margin-bottom:20px">
    <div style="font-size:13px;font-weight:600;color:#555;margin-bottom:12px">
      묶음상품 기본정보 (pd_prod)
    </div>
    <!-- ===== ■.■.■. 폼 영역 ================================================ -->
    <bo-form-area :columns="columns.newBundleForm" :form="newForm" :errors="newErrors"
        :cols="3" compact :show-actions="false">
      <!-- ===== ■.■.■.■. 브랜드/판매업체 — 모달 선택 팝업 ============================ -->
      <template #brand>
        <div style="display:flex;gap:6px;align-items:flex-end">
          <input class="form-control" :value="newForm.brandId ? getBrandNm(newForm.brandId) : ''" readonly
            placeholder="브랜드를 선택해주세요" style="flex:1;background:#fafafa;cursor:pointer"
            @click="handleBtnAction('brandModal-open')" />
          <button class="btn btn-secondary btn-sm" type="button" style="flex-shrink:0" @click="handleBtnAction('brandModal-open')">
            선택
          </button>
          <button v-if="newForm.brandId" type="button" title="선택 해제" @click="newForm.brandId=''"
            style="background:none;border:none;padding:0 2px 2px;margin-left:-4px;color:#999;cursor:pointer;font-size:13px;line-height:1;flex-shrink:0;">
            x
          </button>
        </div>
      </template>
      <template #vendor>
        <div style="display:flex;gap:6px;align-items:flex-end">
          <input class="form-control" :value="newForm.vendorId ? getVendorNm(newForm.vendorId) : ''" readonly
            placeholder="판매업체를 선택해주세요" style="flex:1;background:#fafafa;cursor:pointer"
            @click="handleBtnAction('vendorModal-open')" />
          <button class="btn btn-secondary btn-sm" type="button" style="flex-shrink:0" @click="handleBtnAction('vendorModal-open')">
            선택
          </button>
          <button v-if="newForm.vendorId" type="button" title="선택 해제" @click="newForm.vendorId=''"
            style="background:none;border:none;padding:0 2px 2px;margin-left:-4px;color:#999;cursor:pointer;font-size:13px;line-height:1;flex-shrink:0;">
            x
          </button>
        </div>
      </template>
    </bo-form-area>
</div>
<!-- ===== □.□. 신규 묶음상품 기본정보 (BoFormArea 자동 렌더, 신규 시만 표시) ============= -->
<!-- ===== ■.■. ② 카테고리 N개 (신규/편집 공통) ================================== -->
<div class="form-row" style="margin-bottom:16px">
  <div class="form-group">
    <label class="form-label">
      카테고리
      <span style="font-size:11px;color:#aaa;font-weight:400">
        N개 등록 · 첫 번째 = 대표
      </span>
    </label>
    <div style="border:1px solid #e2e8f0;border-radius:6px;background:#fff;min-height:38px;padding:4px 6px;">
      <div v-if="dtlCategories.length===0" style="color:#aaa;font-size:12px;padding:4px 2px;">
        카테고리를 추가해주세요
      </div>
      <div v-for="(cat,idx) in dtlCategories" :key="(cat && cat.categoryId)" draggable="true" @dragstart="handleSelectAction('detailPanel-categoryDragStart', idx)" @dragover.prevent="handleSelectAction('detailPanel-categoryDragOver', idx)" @drop.prevent="handleSelectAction('detailPanel-categoryDrop')" :style="uiState.catDragoverIdx===idx?'opacity:0.5;':''" style="display:flex;align-items:center;gap:4px;padding:2px 0;">
      <span style="cursor:grab;color:#bbb;font-size:14px;flex-shrink:0;">
        ≡
      </span>
      <span v-if="idx===0" style="font-size:10px;background:#f9a8d4;color:#9d174d;padding:1px 5px;border-radius:10px;flex-shrink:0;">
        대표
      </span>
      <span style="font-size:11px;color:#94a3b8;flex-shrink:0;">
        {{ ['','대','중','소'][cat.depth]||cat.depth }}▸
      </span>
      <span style="font-size:13px;flex:1;">
        {{ cat.categoryNm }}
      </span>
      <button type="button" @click="handleSelectAction('detailPanel-categoryRemove', idx)" style="border:none;background:none;color:#f87171;font-size:13px;padding:0 2px;flex-shrink:0;">
        ✕
      </button>
    </div>
    <button type="button" @click="handleBtnAction('categoryModal-open')"
            style="margin-top:4px;font-size:12px;color:#6366f1;border:1px dashed #a5b4fc;background:none;border-radius:4px;padding:2px 8px;width:100%;">
      + 카테고리 추가
    </button>
  </div>
</div>
</div>
<!-- ===== □.□. ② 카테고리 N개 (신규/편집 공통) ================================== -->
<!-- ===== ■.■. ③ 구성품 목록 (제목 좌 + 추가 버튼 그리드 상단 우측) ============= -->
<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;flex-wrap:wrap">
  <span style="font-size:13px;font-weight:600;color:#555">
    구성품 목록 (pd_prod_bundle_item)
    <span style="font-weight:400;color:#aaa;margin-left:6px">
      ※ 안분율 합계 = 100% 필수
    </span>
  </span>
  <button class="btn btn-secondary btn-sm" style="flex-shrink:0" @click="handleBtnAction('prodPickModal-open')">
    + 구성품 추가
  </button>
</div>
<!-- ===== □.□. ③ 구성품 목록 ============================================== -->
<!-- ===== ■.■. 테이블 =================================================== -->
<table class="bo-table">
  <thead>
    <tr>
      <th style="width:28px">
      </th>
      <th>
        구성품 상품 (item_prod_id)
      </th>
      <th style="width:90px;text-align:right">
        개별가
      </th>
      <th style="width:80px;text-align:center">
        수량
      </th>
      <th style="width:140px;text-align:center">
        안분율 % (price_rate)
      </th>
      <th style="width:110px;text-align:right">
        환불기준가
      </th>
      <th style="width:60px;text-align:center">
        사용
      </th>
      <th style="width:50px;text-align:center">
        삭제
      </th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="(item, idx) in dtlItems" :key="(item && item._id)" draggable="true" @dragstart="handleSelectAction('detailPanel-itemDragStart', idx)" @dragover.prevent="handleSelectAction('detailPanel-itemDragOver', idx)" @drop="handleSelectAction('detailPanel-itemDrop')" :style="uiState.dragoverIdx===idx ? 'background:#e6f4ff' : ''">
    <td style="text-align:center;cursor:grab;color:#bbb;font-size:17px;user-select:none">
      ≡
    </td>
    <td>
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:11px;color:#aaa;background:#f5f5f5;padding:1px 6px;border-radius:4px">
          #{{ item.itemProdId }}
        </span>
        <span style="font-weight:500">
          {{ getProdNm(item.itemProdId) }}
        </span>
      </div>
    </td>
    <td style="text-align:right;color:#888;font-size:12px">
      {{ getProdPrice(item.itemProdId).toLocaleString() }}원
    </td>
    <td style="text-align:center">
      <input type="number" class="form-control" v-model.number="item.itemQty"
              min="1" style="width:60px;text-align:center;margin:0 auto;padding:3px 6px">
    </td>
    <!-- ===== ■.■.■.■.■. 영역 ============================================== -->
    <td>
      <div style="display:flex;align-items:center;justify-content:center;gap:4px">
        <input type="number" class="form-control" v-model.number="item.priceRate"
                min="0" max="100" step="0.01"
                style="width:72px;text-align:right;padding:3px 6px">
        <span style="color:#888">
          %
        </span>
      </div>
    </td>
    <td style="text-align:right;font-size:12px;color:#1677ff">
      <span v-if="newForm.salePrice > 0 || getProdPrice(cfDtlBundleId) > 0">
        {{ Math.round((newForm.salePrice || getProdPrice(cfDtlBundleId)) * item.priceRate / 100).toLocaleString() }}원
      </span>
      <span v-else style="color:#ccc">
        -
      </span>
    </td>
    <td style="text-align:center">
      <select class="form-control" v-model="item.useYn" style="width:56px;padding:2px 4px">
        <option v-for="c in codes.use_yn" :key="c.codeValue" :value="c.codeValue">
          {{ c.codeLabel }}
        </option>
      </select>
    </td>
    <td style="text-align:center">
      <button class="btn btn-danger btn-xs" @click="handleSelectAction('detailPanel-itemRemove', idx)">
        ✕
      </button>
    </td>
  </tr>
  <tr v-if="!dtlItems.length">
    <td colspan="8" style="text-align:center;padding:24px;color:#aaa">
      구성품이 없습니다. 아래 [+ 구성품 추가] 버튼으로 추가하세요.
    </td>
  </tr>
</tbody>
</table>
<!-- ===== □.□. 테이블 =================================================== -->
<!-- ===== ■.■. 안분율 안내 ================================================ -->
<div style="margin-top:12px">
  <div v-if="dtlItems.length" style="padding:7px 14px;border-radius:6px;font-size:12px"
        :style="cfDtlRateOk
        ? 'background:#f6ffed;border:1px solid #b7eb8f;color:#389e0d'
        : 'background:#fff1f0;border:1px solid #ffa39e;color:#cf1322'">
    <strong>
      안분율(price_rate) 합계 = 100% 필수
    </strong>
    — 부분클레임(반품/취소) 시 구성품별 환불 금액 계산 기준입니다.
    <span v-if="!cfDtlRateOk">
      현재 {{ cfDtlRateSum.toFixed(1) }}% — {{ Math.abs(cfDtlRateDiff) }}% {{ cfDtlRateDiff > 0 ? '부족' : '초과' }}합니다.
    </span>
    <span v-else>
      배분 완료 ✓
    </span>
  </div>
</div>
<!-- ===== ■.■. 하단 액션 (저장/닫기 중앙 정렬) ================================ -->
<div class="form-actions">
  <button class="btn btn_save" @click="handleBtnAction('detailPanel-save')">
    {{ uiState.dtlMode==='new' ? '등록' : '저장' }}
  </button>
  <button class="btn btn_close" @click="handleBtnAction('detailPanel-close')">
    닫기
  </button>
</div>
  </div>
  <!-- ===== □.□. 활성 상세영역 (행 선택 / 신규 시) ============================= -->
  </bo-container>
<!-- ===== □.□. 구성품 추가 / 안분율 안내 ======================================= -->
<!-- ===== □. 신규등록 / 구성관리 (인라인 Dtl) =================================== -->
<!-- ===== ■. 구성품 Picker Modal ======================================== -->
<teleport to="body" v-if="uiState.pickerOpen">
  <div style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:center;justify-content:center"
      @click.self="handleBtnAction('prodPickModal-close')">
    <div style="background:#fff;border-radius:14px;padding:24px;width:580px;max-height:72vh;display:flex;flex-direction:column;box-shadow:0 8px 48px rgba(0,0,0,0.22)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <strong style="font-size:15px">
          구성품 상품 선택
        </strong>
        <button class="btn btn_close" @click="handleBtnAction('prodPickModal-close')">
          닫기
        </button>
      </div>
      <bo-multi-check-select
          v-model="uiState.pickerSearchType"
          :options="[
          { value: 'prodNm', label: '상품명' },
          { value: 'prodId', label: 'ID' },
          ]"
          placeholder="검색대상 전체"
          all-label="전체 선택"
          min-width="100%" />
      <div style="display:flex;gap:6px;margin:8px 0 12px 0;">
        <input class="form-control" v-model="uiState.pickerSearch"
            placeholder="검색어 입력 후 Enter" style="flex:1;margin:0;"
            @keyup.enter="handleBtnAction('prodPickModal-search')">
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('prodPickModal-search')">
          조회
        </button>
      </div>
      <div style="overflow-y:auto;flex:1;border:1px solid #eee;border-radius:8px">
        <!-- ===== ■.■.■.■.■. 테이블 ============================================= -->
        <table class="bo-table" style="margin:0">
          <thead>
            <tr>
              <th style="width:44px">
                ID
              </th>
              <th>
                상품명
              </th>
              <th style="width:70px;text-align:center">
                카테고리
              </th>
              <th style="width:90px;text-align:right">
                판매가
              </th>
              <th style="width:56px;text-align:center">
                선택
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in cfPickerList" :key="(p && p.productId)">
            <td style="color:#aaa;font-size:12px">
              {{ p.productId }}
            </td>
            <td>
              {{ p.prodNm || p.productName }}
            </td>
            <td style="text-align:center;font-size:12px;color:#888">
              {{ p.category || '-' }}
            </td>
            <td style="text-align:right">
              {{ (p.salePrice || p.price || 0).toLocaleString() }}원
            </td>
            <td style="text-align:center">
              <button class="btn btn_select" @click="handleSelectAction('prodPickModal-add', p)">
                선택
              </button>
            </td>
          </tr>
          <tr v-if="!cfPickerList.length">
            <td colspan="5" style="text-align:center;padding:24px;color:#aaa">
              검색 결과가 없습니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
</teleport>
<!-- ===== □. 구성품 Picker Modal ======================================== -->
<!-- ===== ■. 카테고리 피커 모달 ============================================== -->
<bo-category-tree mode="picker" :show="uiState.catPickerOpen" :exclude-ids="cfCatExcludeSet" modal-name="category-pick" :on-callback="fnCallbackModal" />
<!-- ===== □. 카테고리 피커 모달 ============================================== -->
<!-- ===== ■. 브랜드 / 판매업체 선택 모달 ===================================== -->
<brand-select-modal v-if="uiState.brandModalOpen" modal-name="brand-select" :on-callback="fnCallbackModal" />
<vendor-select-modal v-if="uiState.vendorModalOpen" modal-name="vendor-select" :on-callback="fnCallbackModal" />
<!-- ===== □. 브랜드 / 판매업체 선택 모달 ===================================== -->
</bo-page>
`
};
