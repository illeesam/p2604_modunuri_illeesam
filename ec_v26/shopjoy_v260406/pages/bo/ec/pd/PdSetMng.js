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
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const categories = reactive([]);
    const products = reactive([]);
    const brands = reactive([]);
    const sets = reactive([]);
    const categoryProds = reactive([]);
    const uiState = reactive({ descOpen: false, loading: false, error: null, isPageCodeLoad: false, dtlMode: null, editSetId: null, catPickerOpen: false, catPickerSearch: '', catDragIdx: null, catDragoverIdx: null, dragIdx: null, dragoverIdx: null, pickerOpen: false, pickerSearchType: '', pickerSearch: '' });
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
      // 페이지 크기 변경
      } else if (cmd === 'sets-pager-sizeChange') {
        return onSizeChange();
      // 설명 토글
      } else if (cmd === 'desc-toggle') {
        uiState.descOpen = !uiState.descOpen;
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
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PdSetMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 행 클릭 → Dtl 열기
      if (cmd === 'sets-rowEdit') {
        return openDtl(param);
      // 그리드 행 삭제
      } else if (cmd === 'sets-rowDelete') {
        return handleDelete(param);
      // 페이지 번호 클릭
      } else if (cmd === 'sets-pager-setPage') {
        return setPage(param);
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

const pager    = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

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

    /* getBrandNm — 조회 */
    const getBrandNm = id => { const b = (brands||[]).find(b=>b.brandId==id); return b ? (b.brandNm||id) : id; };

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
      pager.pageTotalCount = setList.length;
      pager.pageTotalPage  = Math.max(1, Math.ceil(setList.length / pager.pageSize));
      fnBuildPagerNums();
    };

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* onSearch — 조회 */
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchData('DEFAULT');
    };

    /* onReset — 초기화 */
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      pager.pageNo = 1;
      await handleSearchData();
    };

    /* setPage — 설정 */
    const setPage  = n => { if (n >= 1 && n <= pager.pageTotalPage) pager.pageNo = n; };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; };

    /* openNew — 신규 열기 */
    const openNew = () => {
      uiState.dtlMode = 'new';
      uiState.editSetId = null;
      Object.assign(newForm, { prodNm: '', brandId: '', vendorId: '', listPrice: 0, salePrice: 0, stock: 0, prodStatusCd: 'DRAFT' });
      Object.keys(newErrors).forEach(k => delete newErrors[k]);
      dtlCategories.length = 0;
      dtlItems.length = 0;
    };

    /* openDtl — 열기 */
    const openDtl = setProdId => {
      uiState.dtlMode = 'edit';
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

    /* closeDtl — 닫기 */
    const closeDtl = () => { uiState.dtlMode = null; uiState.editSetId = null; dtlItems.length = 0; };

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
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast(isNewSet ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
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
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };
    /* BoGrid 컬럼 — 세트상품 목록 (client-side slice 페이징) */
    const cfSetPageRows = computed(() => setList.slice((pager.pageNo - 1) * pager.pageSize, pager.pageNo * pager.pageSize));
        // --- [컬럼 정의] ---
        const baseSearchColumns = [
      { key: 'nm', label: '세트상품명', type: 'text', placeholder: '세트상품명 검색', width: '320px' },
    ];
    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // 세트 그리드
    const setGridColumns = [
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
    const setItemGridColumns = [
      { key: 'itemNm',     label: '표시명 (item_nm) *',       style: 'width:180px', edit: 'text', placeholder: '표시명 입력' },
      { key: 'itemProdId', label: '연결상품 (item_prod_id)' },
      { key: 'itemQty',    label: '수량',        style: 'width:80px;text-align:center', edit: 'number', align: 'center' },
      { key: 'itemDesc',   label: '구성품 설명', edit: 'text', placeholder: '소재·용량·색상 등 부가 설명' },
      { key: 'useYn',      label: '사용',        style: 'width:60px;text-align:center', edit: 'select', options: () => codes.use_yn },
    ];
    /* fnSetItemRowStyle — 유틸 */
    const fnSetItemRowStyle = (item, idx) => uiState.dragoverIdx === idx ? 'background:#e6f4ff' : (item.useYn === 'N' ? 'opacity:0.55' : '');

    /* BoGrid 컬럼 — 구성품 상품 피커 */
    const pickerGridColumns = [
      { key: 'productId', label: 'ID',       style: 'width:44px', cellStyle: 'color:#aaa;' },
      { key: 'prodNm',    label: '상품명', fmt: (v, row) => (row.prodNm || row.productName) },
      { key: 'category',  label: '카테고리', style: 'width:70px;text-align:center', align: 'center',
        cellStyle: 'color:#888;', fmt: (v) => (v || '-') },
      { key: '_price',    label: '판매가',   style: 'width:90px;text-align:right', align: 'right',
        fmt: (v, row) => ((row.salePrice || row.price || 0).toLocaleString() + '원') },
    ];

    // 신규 세트 폼
    const newSetFormColumns = [
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
      codes, uiState, setList, searchParam, pager,                                          // 상태 / 데이터
      dtlCategories, dtlItems, newForm, newErrors, pickerResults,                           // 상태 / 데이터
      baseSearchColumns, setGridColumns, setItemGridColumns, pickerGridColumns, newSetFormColumns, // 컬럼 정의
      handleBtnAction, handleSelectAction,                                                  // dispatch (모든 이벤트 / 액션 라우팅)
      cfCatExcludeSet, cfDtlProdNm, cfSetPageRows, cfPickerList,                            // computed
      fnSetRowStyle, fnSetItemRowStyle,                                                     // 헬퍼
      getProdNm, getProd, getBrandNm, getCategoryNm, getCategoryDepth,                      // 헬퍼
      onItemReorder,                                                                        // BoGrid 콜백 (closure 필요)
    };
  },

  template: `
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    세트상품관리
  </div>
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="margin:-8px 0 16px;padding:10px 14px;background:#fff4ec;border-left:3px solid #e3803b;border-radius:0 6px 6px 0;font-size:13px;color:#444;line-height:1.7">
    <span>
      <strong style="color:#bf5a1a">
        세트상품
      </strong>
      은 여러 구성품을 하나의 세트로 판매하는 방식입니다.
    </span>
    <button @click="handleBtnAction('desc-toggle')" style="margin-left:8px;font-size:12px;color:#e3803b;background:none;border:none;cursor:pointer;padding:0">
      {{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}
    </button>
    <div v-if="uiState.descOpen" style="margin-top:6px">
      ✔ 안분율 없이
      <strong>
        세트 전체 단일 가격
      </strong>
      으로 판매·정산합니다.
      <br>
      ✔ 클레임은
      <strong>
        세트 전체 단위
      </strong>
      로만 가능합니다 (부분 취소·교환·반품 불가).
      <br>
      ✔ 구성품은 등록 상품 연결 없이
      <strong>
        비상품 항목
      </strong>
      도 추가할 수 있습니다.
      <br>
      <span style="color:#888;font-size:12px">
        예) 선물세트, 패키지 구성품, 사은품 포함 세트
      </span>
    </div>
  </div>
  <!-- ===== □. 본문 영역 =================================================== -->
  <!-- ===== ■. 검색 ====================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 목록 ====================================================== -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">
        세트상품 목록
      </span>
      <span class="list-count">
        총 {{ pager.pageTotalCount }}건
      </span>
      <div class="pager-right">
        <button class="btn btn-green btn-sm" @click="handleBtnAction('sets-add')">
          + 신규등록
        </button>
      </div>
    </div>
    <!-- ===== ■.■. 그리드 (기본 10개 영역 + 화면 높이 반응형 확장, 초과 시 내부 스크롤) =========== -->
    <div style="max-height:calc(100vh - 340px);min-height:480px;overflow-y:auto;border:1px solid #eef0f3;border-radius:6px;background:#fff;">
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="setGridColumns" :rows="cfSetPageRows" :pager="pager"
        row-key="setProdId" :row-style="fnSetRowStyle" empty-text="데이터가 없습니다." row-actions>
        <template #cell-prodNm="{ row }">
          <td>
            <div style="display:flex;align-items:flex-start;gap:6px">
              <span class="badge badge-orange" style="flex-shrink:0;margin-top:1px">
                세트
              </span>
              <div>
                <span class="title-link" @click="handleSelectAction('sets-rowEdit', row.setProdId)">
                  {{ row.prodNm }}
                </span>
                <div style="margin-top:3px;display:flex;flex-wrap:wrap;gap:4px">
                  <span v-for="(item,i) in row.items" :key="item.setItemId||i"
                    style="font-size:11px;color:#888;background:#f5f5f5;padding:1px 7px;border-radius:10px;white-space:nowrap">
                    {{ item.itemNm }}
                    <span style="color:#1677ff">
                      ×{{ item.itemQty }}
                    </span>
                    <span v-if="coUtil.cofAnd(!item.itemProdId, !item.componentProdId)" style="color:#f59e0b;margin-left:2px" title="비상품구성품">
                      ◆
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </td>
        </template>
        <template #row-actions="{ row }">
          <button class="btn btn-blue btn-xs" @click="handleSelectAction('sets-rowEdit', row.setProdId)">
            수정
          </button>
          <button class="btn btn-danger btn-xs" @click="handleSelectAction('sets-rowDelete', row.setProdId)">
            삭제
          </button>
        </template>
      </bo-grid>
    </div>
    <!-- ===== □.□. 그리드 (기본 10개 영역 + 화면 높이 반응형 확장, 초과 시 내부 스크롤) =========== -->
    <!-- ===== ■.■. /그리드 스크롤 컨테이너 ========================================= -->
    <!-- ===== ■.■. 페이저: 한 줄 표시 + 카드 하단 깔끔 마감 ============================= -->
    <div style="margin-top:6px;white-space:nowrap;overflow-x:auto;">
      <bo-pager :pager="pager" :on-set-page="n => handleSelectAction('sets-pager-setPage', n)" :on-size-change="() => handleBtnAction('sets-pager-sizeChange')"
        style="margin-top:0;min-height:34px;" />
    </div>
  </div>
  <!-- ===== □.□. 페이저: 한 줄 표시 + 카드 하단 깔끔 마감 ============================= -->
  <!-- ===== □. 목록 ====================================================== -->
  <!-- ===== ■. 신규등록 / 구성관리 (인라인 Dtl) =================================== -->
  <div v-if="uiState.dtlMode !== null" class="card"
    :style="uiState.dtlMode==='new' ? 'border-top:3px solid #52c41a' : 'border-top:3px solid #f59e0b'">
    <!-- ===== ■.■. Dtl 헤더 ================================================ -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #f0f0f0">
      <div style="display:flex;align-items:center;gap:10px">
        <span :class="['badge', uiState.dtlMode==='new' ? 'badge-green' : 'badge-orange']">
          {{ uiState.dtlMode==='new' ? '신규' : '세트' }}
        </span>
        <strong style="font-size:15px">
          {{ cfDtlProdNm }}
        </strong>
        <span style="font-size:12px;color:#aaa">
          {{ uiState.dtlMode==='new' ? '세트상품 등록' : '구성품 관리' }}
        </span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:12px;color:#888;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;padding:3px 10px">
          🔒 세트 전체 단위로만 클레임 가능
        </span>
        <button class="btn btn-secondary btn-sm" @click="handleBtnAction('detailPanel-close')">
          닫기
        </button>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('detailPanel-save')">
          {{ uiState.dtlMode==='new' ? '등록' : '저장' }}
        </button>
      </div>
    </div>
    <!-- ===== □.□. Dtl 헤더 ================================================ -->
    <!-- ===== ■.■. 신규 세트상품 기본정보 (BoFormArea 자동 렌더, 신규 시만 표시) ============= -->
    <div v-if="uiState.dtlMode==='new'" style="background:#fafafa;border:1px solid #f0f0f0;border-radius:8px;padding:16px 20px;margin-bottom:20px">
      <div style="font-size:13px;font-weight:600;color:#555;margin-bottom:12px">
        세트상품 기본정보 (pd_prod)
      </div>
      <!-- ===== ■.■.■. 폼 영역 ================================================ -->
      <bo-form-area :columns="newSetFormColumns" :form="newForm" :errors="newErrors"
        :cols="3" :show-actions="false">
        <template #brand>
          <select class="form-control" v-model="newForm.brandId">
            <option value="">
              선택
            </option>
            <option v-for="b in ([]||[])" :key="(b && b.brandId)" :value="b.brandId">
            {{ b.brandNm || b.brandName }}
          </option>
        </select>
      </template>
      <template #vendor>
        <select class="form-control" v-model="newForm.vendorId">
          <option value="">
            선택
          </option>
          <option v-for="v in ([]||[])" :key="(v && v.vendorId)" :value="v.vendorId">
          {{ v.vendorNm || v.vendorName }}
        </option>
      </select>
    </template>
  </bo-form-area>
</div>
<!-- ===== □.□. 신규 세트상품 기본정보 (BoFormArea 자동 렌더, 신규 시만 표시) ============= -->
<!-- ===== ■.■. ② 카테고리 ================================================ -->
<div class="form-row" style="margin-bottom:16px">
  <div class="form-group">
    <label class="form-label">
      카테고리
      <span style="font-size:11px;color:#aaa;font-weight:400">
        N개 등록 · 첫 번째 = 대표
      </span>
    </label>
    <div style="border:1px solid #e2e8f0;border-radius:6px;background:#fff;min-height:38px;padding:4px 6px">
      <div v-if="dtlCategories.length===0" style="color:#aaa;font-size:12px;padding:4px 2px">
        카테고리를 추가해주세요
      </div>
      <div v-for="(cat,idx) in dtlCategories" :key="(cat && cat.categoryId)" draggable="true" @dragstart="handleSelectAction('detailPanel-categoryDragStart', idx)" @dragover.prevent="handleSelectAction('detailPanel-categoryDragOver', idx)" @drop.prevent="handleSelectAction('detailPanel-categoryDrop')" :style="uiState.catDragoverIdx===idx ? 'opacity:0.5' : ''" style="display:flex;align-items:center;gap:4px;padding:2px 0">
      <span style="cursor:grab;color:#bbb;font-size:14px;flex-shrink:0">
        ≡
      </span>
      <span v-if="idx===0" style="font-size:10px;background:#f9a8d4;color:#9d174d;padding:1px 5px;border-radius:10px;flex-shrink:0">
        대표
      </span>
      <span style="font-size:11px;color:#94a3b8;flex-shrink:0">
        {{ ['','대','중','소'][cat.depth]||cat.depth }}▸
      </span>
      <span style="font-size:13px;flex:1">
        {{ cat.categoryNm }}
      </span>
      <button type="button" @click="handleSelectAction('detailPanel-categoryRemove', idx)" style="border:none;background:none;color:#f87171;cursor:pointer;font-size:13px;padding:0 2px;flex-shrink:0">
        ✕
      </button>
    </div>
    <button type="button" @click="handleBtnAction('categoryModal-open')"
            style="margin-top:4px;font-size:12px;color:#6366f1;border:1px dashed #a5b4fc;background:none;border-radius:4px;padding:2px 8px;cursor:pointer;width:100%">
      + 카테고리 추가
    </button>
  </div>
</div>
</div>
<!-- ===== □.□. ② 카테고리 ================================================ -->
<!-- ===== ■.■. ③ 구성품 목록 ============================================== -->
<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
  <span style="font-size:13px;font-weight:600;color:#555">
    구성품 목록 (pd_prod_set_item)
  </span>
  <span style="font-size:11px;color:#888;background:#fff7ed;border:1px solid #fed7aa;border-radius:4px;padding:1px 8px">
    표시 목적 · 재고 개별 차감 없음 · 안분율 없음
  </span>
</div>
<!-- ===== □.□. ③ 구성품 목록 ============================================== -->
<!-- ===== ■.■. 목록 영역 ================================================= -->
<bo-grid bare :columns="setItemGridColumns" :rows="dtlItems" row-key="_id"
      draggable row-actions :row-style="fnSetItemRowStyle"
      empty-text="구성품이 없습니다. 아래 버튼으로 추가하세요."
      @reorder="onItemReorder">
  <template #cell-itemProdId="{ row }">
    <td>
      <div v-if="row.itemProdId" style="display:flex;align-items:center;gap:6px">
        <span style="font-size:11px;color:#aaa;background:#f5f5f5;padding:1px 6px;border-radius:4px">
          #{{ row.itemProdId }}
        </span>
        <span style="font-size:13px;color:#333">
          {{ getProdNm(row.itemProdId) }}
        </span>
        <button type="button" @click="handleSelectAction('detailPanel-itemUnlink', row)"
              style="border:none;background:none;color:#f87171;cursor:pointer;font-size:12px;padding:0 2px">
          ✕ 연결해제
        </button>
      </div>
      <div v-else style="display:flex;align-items:center;gap:6px">
        <span class="badge badge-orange" style="font-size:10px">
          비상품
        </span>
        <span style="font-size:12px;color:#aaa">
          상품 미연결 (예: 증정품·박스)
        </span>
      </div>
    </td>
  </template>
  <template #row-actions="{ idx }">
    <td style="text-align:center">
      <button class="btn btn-danger btn-xs" @click="handleSelectAction('detailPanel-itemRemove', idx)">
        ✕
      </button>
    </td>
  </template>
</bo-grid>
<!-- ===== □.□. 목록 영역 ================================================= -->
<!-- ===== ■.■. 구성품 추가 버튼 ============================================= -->
<div style="margin-top:12px;display:flex;gap:8px">
  <button class="btn btn-secondary btn-sm" @click="handleBtnAction('prodPickModal-open')">
    + 상품 구성품 추가
  </button>
  <button class="btn btn-secondary btn-sm" @click="handleBtnAction('detailPanel-itemAddBlank')">
    + 비상품 구성품 추가
    <span style="font-size:11px;color:#aaa">
      (박스·엽서 등)
    </span>
  </button>
</div>
</div>
<!-- ===== □.□. 구성품 추가 버튼 ============================================= -->
<!-- ===== □. 신규등록 / 구성관리 (인라인 Dtl) =================================== -->
<!-- ===== ■. 상품 피커 모달 ================================================ -->
<teleport to="body" v-if="uiState.pickerOpen">
  <div style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:center;justify-content:center"
      @click.self="handleBtnAction('prodPickModal-close')">
    <div style="background:#fff;border-radius:14px;padding:24px;width:580px;max-height:72vh;display:flex;flex-direction:column;box-shadow:0 8px 48px rgba(0,0,0,0.22)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <strong style="font-size:15px">
          구성품 상품 선택
        </strong>
        <button class="btn btn-secondary btn-xs" @click="handleBtnAction('prodPickModal-close')">
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
        <!-- ===== ■.■.■.■.■. 목록 영역 =========================================== -->
        <bo-grid bare :columns="pickerGridColumns" :rows="cfPickerList" row-key="productId"
            empty-text="검색 결과가 없습니다." row-actions>
          <template #row-actions="{ row }">
            <button class="btn btn-blue btn-xs" @click="handleSelectAction('prodPickModal-add', row)">
              선택
            </button>
          </template>
        </bo-grid>
      </div>
    </div>
  </div>
</teleport>
<!-- ===== □. 상품 피커 모달 ================================================ -->
<!-- ===== ■. 카테고리 피커 모달 ============================================== -->
<bo-category-tree mode="picker" :show="uiState.catPickerOpen" :exclude-ids="cfCatExcludeSet"
    @select="cat => handleSelectAction('categoryModal-select', cat)" @close="handleBtnAction('categoryModal-close')" />
</div>
<!-- ===== □. 카테고리 피커 모달 ============================================== -->
`
};
