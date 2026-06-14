/* ShopJoy Admin - 세트상품관리 (pd_prod_set_item) */
window.PdSetMng = {
  name: 'PdSetMng',
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
    const sets = reactive([]);
    const categoryProds = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, dtlMode: 'new', detailActive: false, editSetId: null, catPickerOpen: false, catPickerSearch: '', catDragIdx: null, catDragoverIdx: null, dragIdx: null, dragoverIdx: null, pickerOpen: false, pickerSearchType: '', pickerSearch: '', brandModalOpen: false, vendorModalOpen: false });
    const codes = reactive({
      product_statuses: [],
      bundle_statuses: [],
      use_yn: [],
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PdSetMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return onSearch();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      // 세트상품 신규 등록 (인라인 Dtl 열기)
      } else if (cmd === 'sets-add') {
        return openNew();
      // 세트상품 Dtl 저장
      } else if (cmd === 'detailPanel-save') {
        return handleSave();
      // 세트상품 Dtl 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDtl();
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
      // 상품 피커 모달 열기
      } else if (cmd === 'prodPickModal-open') {
        return openPicker();
      // 상품 피커 모달 닫기
      } else if (cmd === 'prodPickModal-close') {
        uiState.pickerOpen = false;
        return;
      // 상품 피커 검색
      } else if (cmd === 'prodPickModal-search') {
        return onPickerSearch();
      // 비상품 구성품 추가
      } else if (cmd === 'detailPanel-itemAddBlank') {
        return addItemBlank();
      // 페이지 번호 클릭
      } else if (cmd === 'sets-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PdSetMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경 (select)
      if (cmd === 'sets-pager-sizeChange') {
        return onSizeChange();
      // 그리드 행 클릭 → Dtl 열기
      } else if (cmd === 'sets-rowEdit') {
        return openDtl(param);
      // 그리드 행 삭제
      } else if (cmd === 'sets-rowDelete') {
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
      // 구성품 행 연결해제
      } else if (cmd === 'detailPanel-itemUnlink') {
        param.itemProdId = null;
        return;
      // 카테고리 모달에서 선택
      } else if (cmd === 'categoryModal-select') {
        return addCategory(param);
      // 구성품 피커 모달에서 선택
      } else if (cmd === 'prodPickModal-add') {
        return addItemFromProd(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };


    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ PdSetMng : fnCallbackModal -> ', cmd, param, result);
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
        // Backend mappers not implemented - use mock data
        const [prodsRes, catsRes] = await Promise.all([
          boApiSvc.pdProd.getPage({ pageNo: 1, pageSize: 10000 }, '상품세트관리', '목록조회').catch(() => ({ data: { data: { pageList: [] } } })),
          boApiSvc.pdCategory.getPage({ pageNo: 1, pageSize: 10000 }, '상품세트관리', '목록조회').catch(() => ({ data: { data: { pageList: [] } } })),
        ]);
        sets.splice(0, sets.length);
        products.splice(0, products.length, ...(prodsRes.data?.data?.pageList || prodsRes.data?.data?.list || []));
        categories.splice(0, categories.length, ...(catsRes.data?.data?.pageList || catsRes.data?.data?.list || []));
        fnBuildSetList();
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

const setGridPager    = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* -- 신규등록 폼 -- */
    const newForm = reactive({
      prodNm: '', brandId: '', vendorId: '',
      listPrice: 0, salePrice: 0, stock: 0,
      prodStatusCd: 'DRAFT',
    });
    const newErrors = reactive({});

    /* -- 카테고리 N개 -- */
    const dtlCategories   = reactive([]);
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
    const addCategory    = cat => {
      if (window.safeArrayUtils.safeSome(dtlCategories, c => String(c.categoryId) === String(cat.categoryId))) { return; }
      dtlCategories.push({ categoryId: cat.categoryId, categoryNm: cat.categoryNm, depth: cat.depth || cat.categoryDepth || 1 });
      uiState.catPickerOpen = false;
    };

    /* removeCategory — 제거 */
    const removeCategory = idx => dtlCategories.splice(idx, 1);

    /* getCategoryNm — 조회 */
    const getCategoryNm  = id => { const c = (categories||[]).find(c=>c.categoryId==id); return c ? c.categoryNm : String(id); };

    /* getCategoryDepth — 조회 */
    const getCategoryDepth = id => { const c = (categories||[]).find(c=>c.categoryId==id); return c ? (c.depth||1) : 1; };

    /* -- 구성품 목록 -- */
    const dtlItems = reactive([]);
    let _seq = 1;







    /* onItemReorder — 이벤트 */
    const onItemReorder = () => {
      window.safeArrayUtils.safeForEach(dtlItems, (item, i) => { item.sortOrd = i + 1; });
    };

    /* -- 상품 피커 -- */
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
        const res = await boApiSvc.pdProd.getPage(params, '상품세트관리', '상품검색');
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
    const cfPickerList   = computed(() => {
      const used = new Set(dtlItems.map(d => d.itemProdId).filter(Boolean));
      return pickerResults.filter(p => p.productId !== uiState.editSetId && !used.has(p.productId));
    });

    /* getProd — 조회 */
    const getProd   = id => id ? (products || []).find(p => p.productId === id) : null;

    /* getProdNm — 조회 */
    const getProdNm = id => { const p = getProd(id); return p ? (p.prodNm || p.productName || '상품#' + id) : id ? '상품#' + id : ''; };

    /* getBrandNm — 조회 (모달 선택 시 보관한 이름 우선) */
    const getBrandNm = id => { if (newForm._brandNm) { return newForm._brandNm; } const b = (brands||[]).find(b=>b.brandId==id); return b ? (b.brandNm||id) : id; };

    /* getVendorNm — 조회 (모달 선택 시 보관한 이름 우선) */
    const getVendorNm = id => newForm._vendorNm || id;

    /* -- 세트상품 목록 -- */
    const setList = reactive([]);

    /* fnBuildSetList — 유틸 */
    const fnBuildSetList = () => {
      const searchVal = searchParam.nm.toLowerCase();
      const ids = [...new Set((sets || []).map(s => s.setProdId))];
      const result = ids
        .map(id => {
          const items = (sets || [])
            .filter(s => s.setProdId === id)
            .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
          return { setProdId: id, prodNm: getProdNm(id), prod: getProd(id), items, itemCount: items.length };
        })
        .filter(g => !searchVal || g.prodNm.toLowerCase().includes(searchVal));
      setList.splice(0, setList.length, ...result);
      setGridPager.pageTotalCount = setList.length;
      setGridPager.pageTotalPage  = Math.max(1, Math.ceil(setList.length / setGridPager.pageSize));
      coUtil.cofBuildPagerNums(setGridPager);
    };


    /* onSearch — 조회 */
    const onSearch = async () => {
      setGridPager.pageNo = 1;
      await handleSearchData('DEFAULT');
    };

    /* onReset — 초기화 */
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      setGridPager.pageNo = 1;
      await handleSearchData();
    };

    /* setPage — 설정 */
    const setPage  = n => { if (n >= 1 && n <= setGridPager.pageTotalPage) setGridPager.pageNo = n; };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { setGridPager.pageNo = 1; };

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   detailActive=false → 저장/닫기 등 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      uiState.dtlMode = 'new';
      uiState.detailActive = false;   // 버튼 숨김
      uiState.editSetId = null;
      Object.assign(newForm, { prodNm: '', brandId: '', vendorId: '', listPrice: 0, salePrice: 0, stock: 0, prodStatusCd: 'DRAFT' });
      Object.keys(newErrors).forEach(k => delete newErrors[k]);
      dtlCategories.length = 0;
      dtlItems.length = 0;
    };

    /* openNew — 신규 열기 (빈 폼 + 활성 → 저장/닫기 노출) */
    const openNew = () => {
      resetDetailToNew();
      uiState.detailActive = true;    // 신규 입력 가능 → 저장/닫기 노출
    };

    /* openDtl — 열기 */
    const openDtl = setProdId => {
      uiState.dtlMode = 'edit';
      uiState.detailActive = true;    // 행 선택 → 저장/닫기 노출
      uiState.editSetId = setProdId;
      const src = (sets)
        .filter(s => s.setProdId === setProdId)
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
      dtlItems.splice(0, dtlItems.length, ...src.map((s, i) => ({
        _id:       _seq++,
        setItemId: s.setItemId,
        setProdId: s.setProdId,
        itemProdId: s.itemProdId ?? s.componentProdId ?? null,
        itemSkuId: s.itemSkuId || null,
        itemNm:    s.itemNm || '',
        itemQty:   s.itemQty || 1,
        itemDesc:  s.itemDesc || '',
        sortOrd:   s.sortOrd || i + 1,
        useYn:     s.useYn || 'Y',
      })));
      const pid = String(setProdId);
      const _catArr = (categoryProds || [])
        .filter(cp => String(cp.prodId) === pid)
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(cp => ({ categoryId: cp.categoryId, categoryNm: getCategoryNm(cp.categoryId), depth: getCategoryDepth(cp.categoryId) }));
      dtlCategories.splice(0, dtlCategories.length, ..._catArr);
    };

    /* closeDtl — 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDtl = () => { resetDetailToNew(); };

    const cfDtlProdNm = computed(() => uiState.dtlMode === 'new' ? (newForm.prodNm || '(신규 세트상품)') : getProdNm(uiState.editSetId));

    /* addItemFromProd — 추가 */
    const addItemFromProd = prod => {
      const maxSort = dtlItems.length ? Math.max(...dtlItems.map(d => d.sortOrd)) : 0;
      dtlItems.push({
        _id: _seq++, setItemId: null,
        setProdId:  uiState.editSetId,
        itemProdId: prod.productId,
        itemSkuId:  null,
        itemNm:     prod.prodNm || prod.productName || '',
        itemQty:    1,
        itemDesc:   '',
        sortOrd:    maxSort + 1,
        useYn:      'Y',
      });
      uiState.pickerOpen = false; uiState.pickerSearchType = ''; uiState.pickerSearch = '';
    };

    /* addItemBlank — 추가 */
    const addItemBlank = () => {
      const maxSort = dtlItems.length ? Math.max(...dtlItems.map(d => d.sortOrd)) : 0;
      dtlItems.push({
        _id: _seq++, setItemId: null,
        setProdId:  uiState.editSetId,
        itemProdId: null,
        itemSkuId:  null,
        itemNm:     '',
        itemQty:    1,
        itemDesc:   '',
        sortOrd:    maxSort + 1,
        useYn:      'Y',
      });
    };

    /* removeItem — 제거 */
    const removeItem = idx => dtlItems.splice(idx, 1);

    /* handleSave — 저장 */
    const handleSave = async () => {
      Object.keys(newErrors).forEach(k => delete newErrors[k]);
      if (uiState.dtlMode === 'new') {
        if (!newForm.prodNm.trim()) { newErrors.prodNm = '세트상품명을 입력해주세요.'; }
        if (!newForm.salePrice || newForm.salePrice <= 0) { newErrors.salePrice = '판매가를 입력해주세요.'; }
        if (Object.keys(newErrors).length) { showToast('입력 내용을 확인해주세요.', 'error'); return; }
      }
      const hasBlankNm = window.safeArrayUtils.safeSome(dtlItems, d => !d.itemNm.trim());
      if (hasBlankNm) { showToast('구성품 표시명을 모두 입력해주세요.', 'error'); return; }

      const isNewSet  = uiState.dtlMode === 'new';
      const newProdId = isNewSet ? (Math.max(0, ...(products || []).map(p => p.productId)) + 1) : null;
      const setProdId = isNewSet ? newProdId : uiState.editSetId;

      const ok = await showConfirm(isNewSet ? '등록' : '저장', isNewSet ? '세트상품을 등록하시겠습니까?' : '구성품 설정을 저장하시겠습니까?');
      if (!ok) { return; }
      if (isNewSet) {
        products.push({
          productId: newProdId, prodNm: newForm.prodNm,
          brandId: newForm.brandId, vendorId: newForm.vendorId,
          listPrice: newForm.listPrice, salePrice: newForm.salePrice,
          price: newForm.salePrice, stock: newForm.stock,
          prodTypeCd: 'SET', prodStatusCd: newForm.prodStatusCd,
          status: newForm.prodStatusCd === 'ACTIVE' ? '판매중' : '준비중',
          regDate: new Date().toISOString().slice(0, 10),
        });
      }
      const others = (sets).filter(s => s.setProdId !== setProdId);
      const newSets = [
        ...others,
        ...dtlItems.map((d, i) => ({
          setItemId:       d.setItemId || `SI_${setProdId}_${i + 1}`,
          siteId:          '1',
          setProdId,
          itemProdId:      d.itemProdId || null,
          componentProdId: d.itemProdId || null,
          itemSkuId:       d.itemSkuId || null,
          itemNm:          d.itemNm,
          itemQty:         d.itemQty,
          itemDesc:        d.itemDesc,
          sortOrd:         d.sortOrd,
          useYn:           d.useYn,
        })),
      ];
      sets.splice(0, sets.length, ...newSets);
      const filteredCatProds = window.safeArrayUtils.safeFilter(categoryProds, cp => String(cp.prodId) !== String(setProdId));
      categoryProds.splice(0, categoryProds.length, ...filteredCatProds);
      window.safeArrayUtils.safeForEach(dtlCategories, (cat, i) => {
        categoryProds.push({ categoryProdId: `CP_SET_${setProdId}_${i}`, siteId: '1', categoryId: cat.categoryId, prodId: setProdId, sortOrd: i + 1 });
      });
      if (isNewSet) { uiState.dtlMode = 'edit'; uiState.editSetId = newProdId; }
      try {
        /* PdProdSetSaveDto: CreateRequest {prodNm, siteId, items[]}, UpdateItemsRequest {items[]}, Item {prodId, qty, sortOrd} */
        const setItems = dtlItems.map(d => ({ prodId: d.itemProdId || null, qty: d.itemQty, sortOrd: d.sortOrd }));
        const res = await (isNewSet
          ? boApiSvc.pdSet.create({ prodNm: newForm.prodNm, siteId: newForm.siteId || null, items: setItems }, '세트상품관리', '등록')
          : boApiSvc.pdSet.updateItems(setProdId, { items: setItems }, '세트상품관리', '저장'));
        if (showToast) { showToast(isNewSet ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        /* 저장 완료: 목록 재조회 후 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
        await handleSearchData('RELOAD');
        resetDetailToNew();
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* handleDelete — 삭제 */
    const handleDelete = async setProdId => {
      const ok = await showConfirm('삭제', '세트상품을 삭제하시겠습니까?\n구성품 설정도 함께 삭제됩니다.');
      if (!ok) { return; }
      const remaining = (sets).filter(s => s.setProdId !== setProdId);
      sets.splice(0, sets.length, ...remaining);
      if (uiState.editSetId === setProdId) { closeDtl(); }
      try {
        const res = await boApiSvc.pdSet.remove(setProdId, '세트상품관리', '삭제');
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };
    /* BoGrid 컬럼 — 세트상품 목록 (client-side slice 페이징) */
    const cfSetPageRows = computed(() => setList.slice((setGridPager.pageNo - 1) * setGridPager.pageSize, setGridPager.pageNo * setGridPager.pageSize));
        // --- [컬럼 정의] ---
        const columns = {};
        columns.baseSearch = [
      { key: 'nm', label: '세트상품명', type: 'text', placeholder: '세트상품명 검색', width: '320px' },
    ];

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // 세트 그리드
    columns.setGrid = [
      { key: 'prodNm',    label: '세트상품' },
      { key: 'itemCount', label: '구성품수', style: 'width:70px;text-align:center', fmt: v => (v || 0) + '개' },
      { key: '_price',    label: '판매가',   style: 'width:110px;text-align:right', align: 'right',
        fmt: (v, row) => (row.prod ? (row.prod.salePrice || row.prod.price || 0).toLocaleString() + '원' : '-') },
      { key: '_stock',    label: '재고',     style: 'width:60px;text-align:center', align: 'center',
        fmt: (v, row) => (row.prod ? (row.prod.stock != null ? row.prod.stock : '-') : '-') },
      { key: '_status',   label: '상태',     style: 'width:90px;text-align:center', align: 'center',
        badge: (row) => { const pr = row.prod || {}; return (pr.status === '판매중' || pr.prodStatusCd === 'ACTIVE') ? 'badge-green' : (pr.prodStatusCd === 'DRAFT' ? 'badge-orange' : 'badge-gray'); },
        fmt: (v, row) => (row.prod ? (row.prod.status || row.prod.prodStatusCd || '-') : '-') },
    ];
    /* fnSetRowStyle — 유틸 */
    const fnSetRowStyle = (g) => (uiState.dtlMode === 'edit' && uiState.editSetId === g.setProdId) ? 'background:#e6f4ff' : '';

    /* BoGrid 컬럼 — 구성품 목록 (인라인 편집 + 드래그) */
    columns.setItemGrid = [
      { key: 'itemNm',     label: '표시명 (item_nm) *',       style: 'width:180px', edit: 'text', placeholder: '표시명 입력' },
      { key: 'itemProdId', label: '연결상품 (item_prod_id)' },
      { key: 'itemQty',    label: '수량',        style: 'width:80px;text-align:center', edit: 'number', align: 'center' },
      { key: 'itemDesc',   label: '구성품 설명', edit: 'text', placeholder: '소재·용량·색상 등 부가 설명' },
      { key: 'useYn',      label: '사용',        style: 'width:60px;text-align:center', edit: 'select', options: () => codes.use_yn },
    ];
    /* fnSetItemRowStyle — 유틸 */
    const fnSetItemRowStyle = (item, idx) => uiState.dragoverIdx === idx ? 'background:#e6f4ff' : (item.useYn === 'N' ? 'opacity:0.55' : '');

    /* BoGrid 컬럼 — 구성품 상품 피커 */
    columns.pickerGrid = [
      { key: 'productId', label: 'ID',       style: 'width:44px', cellStyle: 'color:#aaa;' },
      { key: 'prodNm',    label: '상품명', fmt: (v, row) => (row.prodNm || row.productName) },
      { key: 'category',  label: '카테고리', style: 'width:70px;text-align:center', align: 'center',
        cellStyle: 'color:#888;', fmt: (v) => (v || '-') },
      { key: '_price',    label: '판매가',   style: 'width:90px;text-align:right', align: 'right',
        fmt: (v, row) => ((row.salePrice || row.price || 0).toLocaleString() + '원') },
    ];

    // 신규 세트 폼
    columns.newSetForm = [
      { key: 'prodNm',       label: '세트상품명', type: 'text', required: true,
        placeholder: '세트상품명 입력', colSpan: 2 },
      { key: 'prodStatusCd', label: '상태', type: 'select', options: () => codes.bundle_statuses },
      { type: 'rowBreak' },
      { key: 'listPrice',    label: '정가 (list_price)', type: 'number', min: 0, placeholder: '0' },
      { key: 'salePrice',    label: '판매가 (sale_price)', type: 'number', required: true, min: 0, placeholder: '0' },
      { key: 'stock',        label: '재고 (세트 단위)', type: 'number', min: 0, placeholder: '0' },
      { type: 'rowBreak' },
      { key: 'brandId',      label: '브랜드', type: 'slot', name: 'brand' },
      { key: 'vendorId',     label: '판매업체', type: 'slot', name: 'vendor' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, searchParam, setGridPager,                // 상태 / 데이터
      dtlCategories, dtlItems, newForm, newErrors,               // 상태 / 데이터
      handleBtnAction, handleSelectAction, fnCallbackModal,                                                  // dispatch (모든 이벤트 / 액션 라우팅)
      cfCatExcludeSet, cfDtlProdNm, cfSetPageRows, cfPickerList, // computed
      fnSetRowStyle, fnSetItemRowStyle, // 헬퍼
      getProdNm, getBrandNm, getVendorNm,                                          // 헬퍼
      onItemReorder,                                                                        // BoGrid 콜백 (closure 필요)
    };
  },

  template: `
<bo-page title="세트상품관리"
  desc-summary="세트상품은 여러 구성품을 하나의 세트로 판매하는 방식입니다."
  :desc-detail="['✔ 안분율 없이 세트 전체 단일 가격으로 판매·정산합니다.','✔ 클레임은 세트 전체 단위로만 가능합니다 (부분 취소·교환·반품 불가).','✔ 구성품은 등록 상품 연결 없이 비상품 항목도 추가할 수 있습니다.','예) 선물세트, 패키지 구성품, 사은품 포함 세트'].join(String.fromCharCode(10))">
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 목록 ====================================================== -->
  <bo-container title="세트상품 목록" :count-text="setGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <button class="btn btn_new" @click="handleBtnAction('sets-add')">+ 신규등록</button>
    </template>
    <!-- ===== ■.■. 그리드 (기본 10개 영역 + 화면 높이 반응형 확장, 초과 시 내부 스크롤) =========== -->
    <div style="max-height:calc(100vh - 340px);min-height:480px;overflow-y:auto;border:1px solid #eef0f3;border-radius:6px;background:#fff;">
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="columns.setGrid" :rows="cfSetPageRows"
        row-key="setProdId" :selected-key="uiState.editSetId" :row-style="fnSetRowStyle" empty-text="데이터가 없습니다." row-actions>
        <template #cell-prodNm="{ row }">
          <td>
            <div style="display:flex;align-items:flex-start;gap:6px">
              <span class="badge badge-orange" style="flex-shrink:0;margin-top:1px">세트</span>
              <div>
                <span class="title-link" @click="handleSelectAction('sets-rowEdit', row.setProdId)">{{ row.prodNm }}</span>
                <div style="margin-top:3px;display:flex;flex-wrap:wrap;gap:4px">
                  <span v-for="(item,i) in row.items" :key="item.setItemId||i"
                    style="font-size:11px;color:#888;background:#f5f5f5;padding:1px 7px;border-radius:10px;white-space:nowrap">
                    {{ item.itemNm }}
                    <span style="color:#1677ff">×{{ item.itemQty }}</span>
                    <span v-if="!item.itemProdId ? !item.componentProdId : false" style="color:#f59e0b;margin-left:2px" title="비상품구성품">
                      ◆
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </td>
        </template>
        <template #row-actions="{ row }">
          <button class="btn btn_row_edit" @click="handleSelectAction('sets-rowEdit', row.setProdId)">수정</button>
          <button class="btn btn_row_delete" @click="handleSelectAction('sets-rowDelete', row.setProdId)">삭제</button>
        </template>
      </bo-grid>
    </div>
    <!-- ===== □.□. 그리드 (기본 10개 영역 + 화면 높이 반응형 확장, 초과 시 내부 스크롤) =========== -->
    <!-- ===== ■.■. /그리드 스크롤 컨테이너 ========================================= -->
    <!-- ===== ■.■. 페이저: 한 줄 표시 + 카드 하단 깔끔 마감 ============================= -->
    <div style="margin-top:6px;white-space:nowrap;overflow-x:auto;">
      <bo-pager :pager="setGridPager" :on-set-page="n => handleBtnAction('sets-pager-setPage', n)" :on-size-change="() => handleSelectAction('sets-pager-sizeChange')"
        style="margin-top:0;min-height:34px;" />
    </div>
  </bo-container>
  <!-- ===== □.□. 페이저: 한 줄 표시 + 카드 하단 깔끔 마감 ============================= -->
  <!-- ===== □. 목록 ====================================================== -->
  <!-- ===== ■. 신규등록 / 구성관리 (인라인 Dtl, 항상 표시) =========================== -->
  <bo-container
    :card-style="!uiState.detailActive ? '' : (uiState.dtlMode==='new' ? 'border-top:3px solid #52c41a' : 'border-top:3px solid #f59e0b')">
    <!-- ===== ■.■. Dtl 헤더 ================================================ -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #f0f0f0">
      <div style="display:flex;align-items:center;gap:10px">
        <template v-if="uiState.detailActive">
          <span :class="['badge', uiState.dtlMode==='new' ? 'badge-green' : 'badge-orange']">
            {{ uiState.dtlMode==='new' ? '신규' : '세트' }}
          </span>
          <strong style="font-size:15px">{{ cfDtlProdNm }}</strong>
          <span style="font-size:12px;color:#aaa">{{ uiState.dtlMode==='new' ? '세트상품 등록' : '구성품 관리' }}</span>
        </template>
        <template v-else><strong style="font-size:15px"> 세트상품 상세 </strong></template>
      </div>
      <div v-if="uiState.detailActive" style="display:flex;align-items:center;gap:8px">
        <span style="font-size:12px;color:#888;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;padding:3px 10px">
          🔒 세트 전체 단위로만 클레임 가능
        </span>
      </div>
    </div>
    <!-- ===== □.□. Dtl 헤더 ================================================ -->
    <!-- ===== ■.■. Dtl 본문 (활성 시에만 표시) ====================================== -->
    <template v-if="uiState.detailActive">
      <!-- ===== ■.■. 신규 세트상품 기본정보 (BoFormArea 자동 렌더, 신규 시만 표시) ============= -->
      <div v-if="uiState.dtlMode==='new'" style="background:#fafafa;border:1px solid #f0f0f0;border-radius:8px;padding:16px 20px;margin-bottom:20px">
        <div style="font-size:13px;font-weight:600;color:#555;margin-bottom:12px">세트상품 기본정보 (pd_prod)</div>
        <!-- ===== ■.■.■. 폼 영역 ================================================ -->
        <bo-form-area :columns="columns.newSetForm" :form="newForm" :errors="newErrors"
          :cols="3" compact :show-actions="false">
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
      <!-- ===== □.□. 신규 세트상품 기본정보 (BoFormArea 자동 렌더, 신규 시만 표시) ============= -->
      <!-- ===== ■.■. ② 카테고리 ================================================ -->
      <div class="form-row" style="margin-bottom:16px">
        <div class="form-group">
          <label class="form-label">카테고리 <span style="font-size:11px;color:#aaa;font-weight:400"> N개 등록 · 첫 번째 = 대표 </span></label>
          <div style="border:1px solid #e2e8f0;border-radius:6px;background:#fff;min-height:38px;padding:4px 6px">
            <div v-if="dtlCategories.length===0" style="color:#aaa;font-size:12px;padding:4px 2px">카테고리를 추가해주세요</div>
            <div v-for="(cat,idx) in dtlCategories" :key="(cat?.categoryId)" draggable="true" @dragstart="handleSelectAction('detailPanel-categoryDragStart', idx)" @dragover.prevent="handleSelectAction('detailPanel-categoryDragOver', idx)" @drop.prevent="handleSelectAction('detailPanel-categoryDrop')" :style="uiState.catDragoverIdx===idx ? 'opacity:0.5' : ''" style="display:flex;align-items:center;gap:4px;padding:2px 0">
              <span style="cursor:grab;color:#bbb;font-size:14px;flex-shrink:0">≡</span>
              <span v-if="idx===0" style="font-size:10px;background:#f9a8d4;color:#9d174d;padding:1px 5px;border-radius:10px;flex-shrink:0">
                대표
              </span>
              <span style="font-size:11px;color:#94a3b8;flex-shrink:0">{{ ['','대','중','소'][cat.depth]||cat.depth }}▸</span>
              <span style="font-size:13px;flex:1">{{ cat.categoryNm }}</span>
              <button type="button" @click="handleSelectAction('detailPanel-categoryRemove', idx)" style="border:none;background:none;color:#f87171;font-size:13px;padding:0 2px;flex-shrink:0">
                ✕
              </button>
            </div>
            <button type="button" @click="handleBtnAction('categoryModal-open')"
              style="margin-top:4px;font-size:12px;color:#6366f1;border:1px dashed #a5b4fc;background:none;border-radius:4px;padding:2px 8px;width:100%">
              + 카테고리 추가
            </button>
          </div>
        </div>
      </div>
      <!-- ===== □.□. ② 카테고리 ================================================ -->
      <!-- ===== ■.■. ③ 구성품 목록 (제목 좌 + 추가 버튼 그리드 상단 우측) ============= -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;flex-wrap:wrap">
        <span style="display:flex;align-items:center;gap:10px">
          <span style="font-size:13px;font-weight:600;color:#555">구성품 목록 (pd_prod_set_item)</span>
          <span style="font-size:11px;color:#888;background:#fff7ed;border:1px solid #fed7aa;border-radius:4px;padding:1px 8px">
            표시 목적 · 재고 개별 차감 없음 · 안분율 없음
          </span>
        </span>
        <span style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" @click="handleBtnAction('prodPickModal-open')">+ 상품 구성품 추가</button>
          <button class="btn btn-secondary btn-sm" @click="handleBtnAction('detailPanel-itemAddBlank')">
            + 비상품 구성품 추가
            <span style="font-size:11px;color:#aaa">(박스·엽서 등)</span>
          </button>
        </span>
      </div>
      <!-- ===== □.□. ③ 구성품 목록 ============================================== -->
      <!-- ===== ■.■. 목록 영역 ================================================= -->
      <bo-grid bare :columns="columns.setItemGrid" :rows="dtlItems" row-key="_id"
        draggable row-actions :row-style="fnSetItemRowStyle"
        empty-text="구성품이 없습니다. 위 [+ 구성품 추가] 버튼으로 추가하세요."
        @reorder="onItemReorder">
        <template #cell-itemProdId="{ row }">
          <td>
            <div v-if="row.itemProdId" style="display:flex;align-items:center;gap:6px">
              <span style="font-size:11px;color:#aaa;background:#f5f5f5;padding:1px 6px;border-radius:4px">#{{ row.itemProdId }}</span>
              <span style="font-size:13px;color:#333">{{ getProdNm(row.itemProdId) }}</span>
              <button type="button" @click="handleSelectAction('detailPanel-itemUnlink', row)"
                style="border:none;background:none;color:#f87171;font-size:12px;padding:0 2px">
                ✕ 연결해제
              </button>
            </div>
            <div v-else style="display:flex;align-items:center;gap:6px">
              <span class="badge badge-orange" style="font-size:10px">비상품</span>
              <span style="font-size:12px;color:#aaa">상품 미연결 (예: 증정품·박스)</span>
            </div>
          </td>
        </template>
        <template #row-actions="{ idx }">
          <td style="text-align:center;white-space:nowrap;">
            <button class="btn btn-danger btn-xs" @click="handleSelectAction('detailPanel-itemRemove', idx)">✕</button>
          </td>
        </template>
      </bo-grid>
      <!-- ===== □.□. 목록 영역 ================================================= -->
      <!-- ===== ■.■. 하단 액션 (저장/닫기 중앙 정렬) ================================ -->
      <div class="form-actions">
        <button class="btn btn_save" @click="handleBtnAction('detailPanel-save')">{{ uiState.dtlMode==='new' ? '등록' : '저장' }}</button>
        <button class="btn btn_close" @click="handleBtnAction('detailPanel-close')">닫기</button>
      </div>
    </template>
    <!-- ===== □.□. Dtl 본문 (활성 시에만 표시) ====================================== -->
  </bo-container>
  <!-- ===== □.□. 구성품 추가 버튼 ============================================= -->
  <!-- ===== □. 신규등록 / 구성관리 (인라인 Dtl) =================================== -->
  <!-- ===== ■. 상품 피커 모달 ================================================ -->
  <teleport to="body" v-if="uiState.pickerOpen">
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:center;justify-content:center"
      @click.self="handleBtnAction('prodPickModal-close')">
      <div style="background:#fff;border-radius:14px;padding:24px;width:580px;max-height:72vh;display:flex;flex-direction:column;box-shadow:0 8px 48px rgba(0,0,0,0.22)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <strong style="font-size:15px">구성품 상품 선택</strong>
          <button class="btn btn_close" @click="handleBtnAction('prodPickModal-close')">닫기</button>
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
          <button class="btn btn-primary btn-sm" @click="handleBtnAction('prodPickModal-search')">조회</button>
        </div>
        <div style="overflow-y:auto;flex:1;border:1px solid #eee;border-radius:8px">
          <!-- ===== ■.■.■.■.■. 목록 영역 =========================================== -->
          <bo-grid bare :columns="columns.pickerGrid" :rows="cfPickerList" row-key="productId"
            empty-text="검색 결과가 없습니다." row-actions>
            <template #row-actions="{ row }">
              <button class="btn btn_select" @click="handleSelectAction('prodPickModal-add', row)">선택</button>
            </template>
          </bo-grid>
        </div>
      </div>
    </div>
  </teleport>
  <!-- ===== □. 상품 피커 모달 ================================================ -->
  <!-- ===== ■. 카테고리 피커 모달 ============================================== -->
  <bo-category-tree mode="picker" :show="uiState.catPickerOpen" :exclude-ids="cfCatExcludeSet" modal-name="category-pick" :on-callback="fnCallbackModal" />
  <!-- ===== ■. 브랜드 / 판매업체 선택 모달 ===================================== -->
  <brand-select-modal v-if="uiState.brandModalOpen" modal-name="brand-select" :on-callback="fnCallbackModal" />
  <vendor-select-modal v-if="uiState.vendorModalOpen" modal-name="vendor-select" :on-callback="fnCallbackModal" />
  <!-- ===== □. 브랜드 / 판매업체 선택 모달 ===================================== -->
</bo-page>
<!-- ===== □. 카테고리 피커 모달 ============================================== -->
`
};
