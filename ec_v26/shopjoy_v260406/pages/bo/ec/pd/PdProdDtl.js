/* ShopJoy Admin - 상품관리 상세/등록 */
window._pdProdDtlState = window._pdProdDtlState || { tab: 'info', tabMode: 'tab' };
window.PdProdDtl = {
  name: 'PdProdDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit)
    active:       { type: Boolean, default: true }, // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, onMounted, watch, onBeforeUnmount, nextTick } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    // window 접근 불가한 템플릿용 + setup 내부 공용 헬퍼
    const { safeFirst, safeGet, safeFind, safeFilter } = window.safeArrayUtils;
    const products = reactive([]);
    const boUsers = reactive([]);
    const categories = reactive([]);
    const categoryProds = reactive([]);
    const uiState = reactive({ isDraggingDivider: false, loading: false, mdModalOpen: false, error: null, isPageCodeLoad: false, topTab: window._pdProdDtlState.tab || 'info', tabMode2: window._pdProdDtlState.tabMode || 'tab', useOpt: true, prodOptCategoryTypeCd: '', dragOptGrpId: null, dragOptItemIdx: null, dragoverOptItemIdx: null, skuFilter1: '', skuFilter2: '', skuFilterStock: '', dragImgIdx: null, dragoverImgIdx: null, dragBlockIdx: null, dragoverBlockIdx: null, splitPct: 65, previewDevice: 'pc', prodPickerOpen: '', prodPickerSearch: '', dragRelIdx: null, dragoverRelIdx: null, dragCodeIdx: null, dragoverCodeIdx: null, catPickerOpen: false, catPickerSearch: '', catDragIdx: null, catDragoverIdx: null, mdSearchType: '', mdSearch: '', prodPickerSearchType: '' });
    const tab = Vue.toRef(uiState, 'tab');
    const codes = reactive([]);
    const grpCodes = reactive({ product_statuses: [], prod_types: [], prod_plan_statuses: [], opt_stock_statuses: [], stock_filter_opts: [{value:'in',label:'재고있음'},{value:'out',label:'품절(0)'}] });

    /* 상품 fnLoadCodes */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 상위 레벨 버튼 액션 dispatch (탭 / 저장 / 취소 / 미리보기 등).
     * 자식 컴포넌트 콜백 / SKU / 카테고리 매핑 / Quill 등 세부 액션은 기존 함수 유지 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PdProdDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장 (현재 탭)
      if (cmd === 'form-save') {
        return handleSave();
      // 폼 취소 → 상세영역 유지 + 빈 신규 폼으로 초기화 (영역 사라지지 않음)
      } else if (cmd === 'form-cancel') {
        return props.navigate('__cancelEdit__');
      // 폼 닫기 → 상세영역 유지 + 빈 신규 폼으로 초기화
      } else if (cmd === 'form-close') {
        return props.navigate('__cancelEdit__');
      // 보기모드 → 수정모드 전환
      } else if (cmd === 'form-edit') {
        return props.navigate('__switchToEdit__');
      // 탭 전환
      } else if (cmd === 'tab-select') {
        topTab.value = param;
        return;
      // 뷰모드 변경
      } else if (cmd === 'tab-mode') {
        tabMode2.value = param;
        return;
      // 사용자 페이스 미리보기 (새창)
      } else if (cmd === 'form-preview') {
        return onPreview();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 상위 레벨 선택 액션 dispatch (현재 미사용, 확장 대비) */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PdProdDtl.js : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ PdProdDtl : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'category-pick') {
        if (result == null) { uiState.catPickerOpen = false; return; }
        return addCategory(result);
      } else if (cmd === 'code-grp') {
        if (result == null) { codeGrpModal.show = false; return; }
        return;
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        if (!codeStore?.svCodes) { return; }
        codes.length = 0;
        codes.push(...codeStore.svCodes);
        if (codeStore.sgGetGrpCodes) {
          grpCodes.product_statuses = codeStore.sgGetGrpCodes('PRODUCT_STATUS');
          grpCodes.prod_types = codeStore.sgGetGrpCodes('PROD_TYPE');
          grpCodes.prod_plan_statuses = codeStore.sgGetGrpCodes('PROD_PLAN_STATUS');
          grpCodes.opt_stock_statuses = codeStore.sgGetGrpCodes('OPT_STOCK_STATUS');
        }
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // -- 탭별 페이징 상태
    const tabPage = reactive({
      images:  { pageNo: 1, pageSize: 10, totalCount: 0 },
      opts:    { pageNo: 1, pageSize: 10, totalCount: 0 },
      skus:    { pageNo: 1, pageSize: 10, totalCount: 0 },
      content: { pageNo: 1, pageSize: 10, totalCount: 0 },
      rels:    { pageNo: 1, pageSize: 10, totalCount: 0 },
    });
    // 탭별 전체 데이터 (페이징은 프론트 슬라이스)
    const tabData = reactive({ images: [], opts: { groups: [], items: [] }, skus: [], content: [], rels: [] });

    const cfTabPageList = computed(() => ({
      images:  tabData.images.slice((tabPage.images.pageNo -1)*tabPage.images.pageSize,   tabPage.images.pageNo  *tabPage.images.pageSize),
      skus:    tabData.skus.slice(  (tabPage.skus.pageNo   -1)*tabPage.skus.pageSize,     tabPage.skus.pageNo    *tabPage.skus.pageSize),
      content: tabData.content.slice((tabPage.content.pageNo-1)*tabPage.content.pageSize, tabPage.content.pageNo *tabPage.content.pageSize),
      rels:    tabData.rels.slice(  (tabPage.rels.pageNo   -1)*tabPage.rels.pageSize,     tabPage.rels.pageNo    *tabPage.rels.pageSize),
    }));

    /* 상품 onTabPageChange */

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* onTabPageChange — 이벤트 */
    const onTabPageChange = (tabKey, pageNo) => { tabPage[tabKey].pageNo = pageNo; };

    /* cfTabTotalPages — 파생값 */
    const cfTabTotalPages = (tabKey) => Math.ceil(tabData[tabKey].length / tabPage[tabKey].pageSize) || 1;

    /* fnTabPageNos — 유틸 */
    const fnTabPageNos = (tabKey) => {
      const total = cfTabTotalPages(tabKey);
      const cur   = tabPage[tabKey].pageNo;
      const start = Math.max(1, cur - 2);
      const end   = Math.min(total, start + 4);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    /* TAB_BASE — TAB_ 기본 */
    const TAB_BASE = () => `/bo/ec/pd/prod/${props.dtlId}`;

    /* HDR — 헤더 */
    const HDR = (cmd) => coUtil.cofApiHdr('상품관리', cmd);

    // 보조 데이터(사용자/카테고리) + 기본정보 + 탭 전체 동시 조회
    /* handleLoadData — 처리 */
    const handleLoadData = async () => {
      uiState.loading = true;
      try {
        const isNew = !props.dtlId;
        const baseCalls = [
          boApiSvc.syUser.getPage({ pageNo: 1, pageSize: 1000 }, '상품관리', '상세조회'),
          boApiSvc.pdCategory.getPage({ pageNo: 1, pageSize: 1000 }, '상품관리', '상세조회'),
        ];
        if (!isNew) baseCalls.push(
          boApiSvc.pdProd.getById(props.dtlId, '상품관리', '기본정보조회'),
          boApiSvc.pdProd.getImages(props.dtlId,   '상품관리', '이미지조회'),
          boApiSvc.pdProd.getOpts(props.dtlId,     '상품관리', '옵션조회'),
          boApiSvc.pdProd.getSkus(props.dtlId,     '상품관리', 'SKU조회'),
          boApiSvc.pdProd.getContents(props.dtlId, '상품관리', '상품설명조회'),
          boApiSvc.pdProd.getRels(props.dtlId,     '상품관리', '연관상품조회'),
          boApiSvc.pdCategory.getProds({ prodId: props.dtlId, pageNo: 1, pageSize: 1000 }, '상품관리', '카테고리매핑조회'),
        );
        const r = await Promise.all(baseCalls);

        boUsers.splice(0,     boUsers.length,     ...(r[0].data?.data?.pageList || r[0].data?.data?.list || []));
        categories.splice(0,  categories.length,  ...(r[1].data?.data?.pageList || r[1].data?.data?.list || []));

        if (!isNew) {
          /* pd_category_prod 매핑 (baseCalls 마지막 항목 = r[8]) */
          const cpRes = r[8];
          categoryProds.splice(0, categoryProds.length, ...(cpRes?.data?.data?.pageList || cpRes?.data?.data?.list || []));

          // 기본정보
          const p = r[2].data?.data || r[2].data;
          if (p) { products.splice(0, products.length, p); }

          // 이미지 — getById 응답에 embedded (PdProdDto.Item.images)
          //   pd_prod_img: cdn_img_url / cdn_thumb_url / opt_item_id_1 / opt_item_id_2 / is_thumb / sort_ord
          //   화면용:      previewUrl / isMain (=is_thumb=Y)
          const prodImgs_ = p.prodImgs || [];
          tabData.images.splice(0, tabData.images.length, ...prodImgs_.map(img => ({
            ...img,
            id:          imgIdSeq++,
            previewUrl:  img.cdnImgUrl || img.cdnThumbUrl || '',
            isMain:      img.isThumb === 'Y',
            optItemId1:  img.optItemId1 || '',
            optItemId2:  img.optItemId2 || '',
          })));

          // 옵션그룹+아이템 [4]
          //   백엔드 키:  pd_prod_opt        → optId / optGrpNm / optTypeCd / optInputTypeCd / optLevel / sortOrd
          //              pd_prod_opt_item   → optItemId / optId / optNm / optVal / optValCodeId / parentOptItemId / sortOrd / useYn
          //   화면 키:    {_id, grpNm, typeCd, inputTypeCd, level, items:[{_id, nm, val, valCodeId, parentOptItemId, sortOrd, useYn}]}
          //   getById 응답에 embedded (PdProdDto.Item: opts=옵션그룹배열, optItems=옵션아이템배열)
          const prodOpts_ = p.prodOpts     || [];
          const prodOptItems_  = p.prodOptItems || [];
          tabData.opts.groups.splice(0, tabData.opts.groups.length, ...prodOpts_);
          tabData.opts.items.splice(0,  tabData.opts.items.length,  ...prodOptItems_);
          if (prodOpts_.length) {
            // 1) 그룹: optId → 임시 _id 매핑 (parentOptItemId 변환에 사용)
            const groupClientId = {};
            const built = prodOpts_.map(g => {
              const _id = _optSeq++;
              groupClientId[g.optId] = _id;
              return {
                _id,
                _origOptId: g.optId,
                grpNm:       g.optGrpNm || g.grpNm || '',
                typeCd:      g.optTypeCd || g.typeCd || '',
                inputTypeCd: g.optInputTypeCd || g.inputTypeCd || 'SELECT',
                level:       g.optLevel != null ? Number(g.optLevel) : (g.level || 1),
                sortOrd:     Number(g.sortOrd || 0),
                items:       [],
              };
            });
            // 2) 아이템: opt_item_id → 임시 _id 매핑 (자기 자신용)
            const itemClientId = {};
            prodOptItems_.forEach(i => { itemClientId[i.optItemId] = _itemSeq++; });
            // 3) 그룹별 아이템 채움 + parentOptItemId 를 화면용 _id 로 변환
            built.forEach(grp => {
              const prodOptItems = prodOptItems_.filter(i => i.optId === grp._origOptId).map(i => {
                const parentClient = i.parentOptItemId ? itemClientId[i.parentOptItemId] : '';
                return {
                  _id: itemClientId[i.optItemId],
                  nm:        i.optNm || '',
                  val:       i.optVal || '',
                  valCodeId: i.optValCodeId || '',
                  optStyle:  i.optStyle || '',
                  parentOptItemId: parentClient ? String(parentClient) : '',
                  sortOrd:   Number(i.sortOrd || 0),
                  useYn:     i.useYn || 'Y',
                };
              });
              prodOptItems.sort((a,b) => (a.sortOrd||0) - (b.sortOrd||0));
              grp.items = prodOptItems;
              delete grp._origOptId;
            });
            built.sort((a,b) => (a.level||0) - (b.level||0) || (a.sortOrd||0) - (b.sortOrd||0));
            optGroups.splice(0, optGroups.length, ...built);
          }

          // SKU — getById 응답에 embedded (PdProdDto.Item.skus)
          const skuList = p.prodSkus || [];
          tabData.skus.splice(0, tabData.skus.length, ...skuList.map(s => ({ ...s, _id: 'sku_' + s.skuId, _optKey: s.skuId, _nm1: s.optItemNm1 || '', _nm2: s.optItemNm2 || '', stock: s.prodOptStock || 0 })));

          // 상품설명 [6] — 백엔드에서 sortOrd ASC 기본 정렬
          const contentList = r[6].data?.data || [];
          tabData.content.splice(0, tabData.content.length, ...contentList);

          // 연관상품 [7]
          const relList = r[7].data?.data || [];
          tabData.rels.splice(0, tabData.rels.length, ...relList.map(rel => ({ ...rel, _id: _relSeq++, prodNm: rel.relProdNm || rel.prodNm || '' })));
        }
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    const cfIsNew = computed(() => !props.dtlId);
    const topTab = ref(uiState.topTab);
    const tabMode2 = ref(uiState.tabMode2);

    watch(topTab, v => { uiState.topTab = v; window._pdProdDtlState.tab = v; });

    watch(() => props.dtlId, () => {
      images.splice(0); optGroups.splice(0); skus.splice(0);
      contentBlocks.splice(0); relProds.splice(0);
      tabData.images.splice(0); tabData.skus.splice(0);
      tabData.content.splice(0); tabData.rels.splice(0);
      tabData.opts.groups.splice(0); tabData.opts.items.splice(0);
    });

    watch(tabMode2, v => { uiState.tabMode2 = v; window._pdProdDtlState.tabMode = v; });

    /* showTab — 표시 */
    const showTab = id => tabMode2.value !== 'tab' || topTab.value === id;

    /* tabs — 탭 정의 (BoTabBar 데이터, reactive). 카운트는 tabData getter 로 반응형 유지 */
    const tabs = reactive([
      { id: 'info',    label: '기본정보',        icon: '📋' },
      { id: 'detail',  label: '상세설정',        icon: '📝' },
      { id: 'content', label: '상품설명',        icon: '📄', get count() { return tabData.content.length; } },
      { id: 'option',  label: '옵션설정',        icon: '⚙',  get count() { return tabData.opts.groups.length; } },
      { id: 'price',   label: '옵션(가격/재고)', icon: '💰', get count() { return tabData.skus.length; } },
      { id: 'image',   label: '이미지',          icon: '🖼', get count() { return tabData.images.length; } },
      { id: 'related', label: '연관상품',        icon: '🔗', get count() { return tabData.rels.length; } },
    ]);

    // -- form: pd_prod 전체 필드
    const form = reactive({
      prodId: null,
      prodNm: '', prodCode: '',
      categoryId: '', brandId: '', vendorId: '',
      mdUserId: '',
      prodTypeCd: 'SINGLE', prodStatusCd: 'DRAFT', unsaleMsg: '',
      dlivTmpltId: '',
      listPrice: 0, salePrice: 0, purchasePrice: null, marginRate: null,
      platformFeeRate: null, platformFeeAmount: null,
      prodStock: 0,
      saleStartDate: '', saleEndDate: '',
      minBuyQty: 1, maxBuyQty: null, dayMaxBuyQty: null, idMaxBuyQty: null,
      adltYn: 'N', sameDayDlivYn: 'N', soldOutYn: 'N',
      couponUseYn: 'Y', saveUseYn: 'Y', discntUseYn: 'Y',
      advrtStmt: '', advrtStartDate: '', advrtEndDate: '',
      weight: null, sizeInfoCd: '',
      isNew: 'N', isBest: 'N',
      contentHtml: '',
    });
    const errors = reactive({});
    const schema = yup.object({
      prodNm:    yup.string().required('상품명을 입력해주세요.'),
      listPrice: yup.number().typeError('숫자 입력').min(0).required('정가를 입력해주세요.'),
      salePrice: yup.number().typeError('숫자 입력').min(0).required('판매가를 입력해주세요.'),
    });

    // -- 옵션 설정
        let _optSeq = 1, _itemSeq = 100;
    const optGroups = reactive([]); // [{_id, grpNm, typeCd, inputTypeCd, level, items:[{_id, nm, val, valCodeId, parentOptItemId, sortOrd, useYn}]}]
    const skus = reactive([]);      // [{_id, _optKey, _nm1, _nm2, skuCode, addPrice, stock, useYn}]
    // -- 옵션 공통코드 (DB: PROD_OPT_CATEGORY 3단 트리 — sy_code.code_level + parent_code_value)
    //    level=1 : 옵션 카테고리        (parent=NULL)            — 옵션 카테고리 select
    //    level=2 : 옵션 유형(1·2단)     (parent=level1.code_value)— N단 유형 select
    //    level=3 : 값 프리셋            (parent=level2.code_value)— 공통코드ID select
    const PROD_OPT_GRP = 'PROD_OPT_CATEGORY';
    // svCodes row 원본 키(codeVal/codeNm/codeSortOrd/codeLevel/parentCodeValue) → 화면용 정규화
    //   codeId       : sy_code.code_id (예: CD000900)         — opt_val_code_id 저장용
    //   codeValue    : sy_code.code_value (예: CAT_CLOTHING)  — select :value
    //   codeLabel    : sy_code.code_label (예: 의류)          — select 표시
    //   codeLevel    : 1/2/3
    //   parentCodeValue
    //   sortOrd
    /* fnNorm — 유틸 */
    const fnNorm = (c) => ({
      codeId:          c.codeId,
      codeValue:       c.codeVal ?? c.codeValue ?? '',
      codeLabel:       c.codeNm  ?? c.codeLabel ?? c.codeVal ?? '',
      codeLevel:       Number(c.codeLevel ?? 1),
      parentCodeValue: c.parentCodeValue ?? null,
      sortOrd:         Number(c.codeSortOrd ?? c.sortOrd ?? 0),
      codeRemark:      c.codeRemark ?? '',
      codeOpt1:        c.codeOpt1 ?? '',
      useYn:           c.useYn ?? 'Y',
    });

    /* fnSortByOrd — 유틸 */
    const fnSortByOrd = (a,b) => (a.sortOrd||0) - (b.sortOrd||0);

    // 1레벨 — 옵션 카테고리 선택용
    const cfOptTypeLevel1Codes = computed(() =>
      (codes||[])
        .filter(c => c.codeGrp === PROD_OPT_GRP && c.useYn === 'Y' && Number(c.codeLevel||1) === 1)
        .map(fnNorm)
        .sort(fnSortByOrd)
    );
    // 2레벨 — 선택된 카테고리 하위의 옵션 유형 목록 (1단·2단 유형 select 공용)
    /* getOptTypeCodes — 조회 */
    const getOptTypeCodes = (categoryCd) => {
      if (!categoryCd) { return []; }
      return (codes||[])
        .filter(c => c.codeGrp === PROD_OPT_GRP && c.useYn === 'Y'
                  && Number(c.codeLevel||0) === 2
                  && c.parentCodeValue === categoryCd)
        .map(fnNorm)
        .sort(fnSortByOrd);
    };
    // 현재 화면에서 자주 쓰는 형태 — 선택된 카테고리 하위 2레벨 (computed)
    const cfOptTypeCodes = computed(() => getOptTypeCodes(uiState.prodOptCategoryTypeCd));
    // 3레벨 — 공통코드ID(opt_val_code_id) 드롭다운: 선택된 N단 유형(typeCd)의 자식
    /* getOptValCodes — 조회 */
    const getOptValCodes = (typeCd) => {
      if (!typeCd) { return []; }
      return (codes||[])
        .filter(c => c.codeGrp === PROD_OPT_GRP && c.useYn === 'Y'
                  && Number(c.codeLevel||0) === 3
                  && c.parentCodeValue === typeCd)
        .map(fnNorm)
        .sort(fnSortByOrd);
    };
    // (호환용) typeCd 라벨 lookup — 모든 카테고리 하위 2레벨 합집합
    const cfOptTypeAllCodes = computed(() =>
      (codes||[])
        .filter(c => c.codeGrp === PROD_OPT_GRP && c.useYn === 'Y' && Number(c.codeLevel||0) === 2)
        .map(fnNorm)
        .sort(fnSortByOrd)
    );

    const cfOptInputTypeCodes = computed(() =>
      (codes||[])
        .filter(c => c.codeGrp==='OPT_INPUT_TYPE' && c.useYn==='Y')
        .map(fnNorm)
        .sort(fnSortByOrd)
    );

    /* clearOpt — 비우기 */
    const clearOpt = () => { optGroups.length = 0; skus.length = 0; uiState.prodOptCategoryTypeCd = ''; };

    // 단일 프리셋 → 옵션 행 객체
    //   valCodeId 는 sy_code.code_id (예: CD000963) — select v-model 매칭용
    //   preset.codeId 가 비어있으면 codeValue 로 fallback
    /* fnPresetToItem — 유틸 */
    const fnPresetToItem = (preset, sortOrd, parentOptItemId) => {
      const codeId = preset ? (preset.codeId || preset.codeValue || '') : '';
      return {
        _id: _itemSeq++,
        nm:        preset ? (preset.codeLabel || preset.codeValue || '') : '',
        val:       preset ? (preset.codeValue || '') : '',
        valCodeId: codeId,
        optStyle:  preset ? (preset.codeOpt1 || '') : '',
        parentOptItemId: parentOptItemId || '',
        sortOrd:   sortOrd,
        useYn:     'Y',
      };
    };

    // 1단 옵션 행: 해당 typeCd 프리셋 전체를 정렬 순서대로 행으로 만듦
    /* fnBuildLevel1Items — 유틸 */
    const fnBuildLevel1Items = (typeCd) => {
      const presets = typeCd ? getOptValCodes(typeCd) : [];
      if (presets.length && !presets[0].codeId) {
        console.warn('[PdProdDtl] 프리셋에 codeId 가 없습니다 — 백엔드 재기동/재로그인 필요', presets[0]);
      }
      // getOptValCodes 는 이미 sortOrd 오름차순 정렬됨
      return presets.map((p, i) => fnPresetToItem(p, i + 1, ''));
    };

    // 2단 옵션 행: 1단 행 N × 2단 프리셋 M 카르테시안 곱 — 각 행의 상위옵션값은 1단 행의 _id 로 연결
    /* fnBuildLevel2Items — 유틸 */
    const fnBuildLevel2Items = (typeCd, level1Items) => {
      const presets = typeCd ? getOptValCodes(typeCd) : [];
      const items = [];
      let ord = 1;
      const parents = (level1Items && level1Items.length) ? level1Items : [null];
      // parents: 1단 행 (정렬 보존), presets: 2단 프리셋 (정렬 보존)
      parents.forEach(parent => {
        presets.forEach(p => {
          items.push(fnPresetToItem(p, ord++, parent ? String(parent._id) : ''));
        });
      });
      return items;
    };

    // 카테고리 선택 시: DB의 2레벨 자식을 그대로 1·2단으로 자동 세팅 (최대 2개)
    //                  1단 = 1단 프리셋 N개
    //                  2단 = 1단 N × 2단 M 행 (상위옵션값 자동 매핑)
    //   기존에 옵션 항목/SKU 가 있는 상태에서 카테고리를 바꾸면 모두 초기화되므로 confirm 받음.
    let _prevCategoryCd = uiState.prodOptCategoryTypeCd || '';

    /* fnLabelOfCategory — 유틸 */
    const fnLabelOfCategory = (cv) => {
      if (!cv) { return '(미선택)'; }
      const found = cfOptTypeLevel1Codes.value.find(c => c.codeValue === cv);
      return found ? `${found.codeLabel} (${cv})` : cv;
    };

    /* fnApplyCategory — 유틸 */
    const fnApplyCategory = () => {
      const types = getOptTypeCodes(uiState.prodOptCategoryTypeCd);
      const slots = types.slice(0, 2);
      let level1Items = [];
      slots.forEach((t, i) => {
        const level = i + 1;
        const items = level === 1
          ? fnBuildLevel1Items(t.codeValue)
          : fnBuildLevel2Items(t.codeValue, level1Items);
        if (level === 1) { level1Items = items; }
        optGroups.push({
          _id: _optSeq++,
          grpNm: t.codeLabel || t.codeValue,
          typeCd: t.codeValue,
          inputTypeCd: 'SELECT',
          level,
          items,
        });
      });
      // SKU 는 자동 생성하지 않음. 사용자가 옵션(가격/재고) 탭에서 [🔄 SKU 재생성] 으로 직접 만들도록 빈 상태 유지.
      _prevCategoryCd = uiState.prodOptCategoryTypeCd;
    };

    /* onCategoryChange — 이벤트 */
    const onCategoryChange = async () => {
      const newCd = uiState.prodOptCategoryTypeCd;
      const oldCd = _prevCategoryCd;
      // 변경 전에 항목/SKU/이미지가 있으면 사용자에게 확인
      const hasItems = optGroups.some(g => (g.items || []).length > 0);
      const hasSkus  = skus.length > 0;
      const hasImgs  = images.length > 0;
      if (oldCd && oldCd !== newCd && (hasItems || hasSkus || hasImgs)) {
        const ok = await showConfirm(
          '옵션 카테고리 변경',
          `옵션 카테고리가 ${fnLabelOfCategory(oldCd)} 에서 ${fnLabelOfCategory(newCd)} 으로 변경되었습니다.\n` +
          `값이 변경되면 옵션항목 / 옵션(가격·재고) / 이미지 가 모두 삭제됩니다.\n` +
          `그래도 변경하시겠습니까?`
        );
        if (!ok) {
          // 사용자 취소 → 원래 값 복구
          uiState.prodOptCategoryTypeCd = oldCd;
          return;
        }
      }
      // 옵션 항목 / SKU / 이미지 모두 비움 (이미지는 행 자체 제거)
      optGroups.length = 0;
      skus.length      = 0;
      images.length    = 0;
      fnApplyCategory();
    };

    /* addOptGroup — 추가 */
    const addOptGroup = () => {
      if (!uiState.prodOptCategoryTypeCd) { showToast('옵션 카테고리를 먼저 선택해주세요.', 'error'); return; }
      if (optGroups.length >= 2) { showToast('옵션은 최대 2단까지 가능합니다.', 'error'); return; }
      const types = getOptTypeCodes(uiState.prodOptCategoryTypeCd);
      const used = new Set(optGroups.map(g => g.typeCd).filter(Boolean));
      const next = types.find(t => !used.has(t.codeValue)) || types[optGroups.length] || null;
      const level = optGroups.length + 1;
      const items = level === 1
        ? fnBuildLevel1Items(next ? next.codeValue : '')
        : fnBuildLevel2Items(next ? next.codeValue : '', optGroups[0]?.items || []);
      optGroups.push({
        _id: _optSeq++,
        grpNm: next ? (next.codeLabel || next.codeValue) : '옵션',
        typeCd: next ? next.codeValue : '',
        inputTypeCd: 'SELECT',
        level,
        items,
      });
      generateSkus();
    };

    /* removeOptGroup — 제거 */
    const removeOptGroup = (idx) => {
      optGroups.splice(idx, 1);
      window.safeArrayUtils.safeForEach(optGroups, (g, i) => { g.level = i + 1; });
      generateSkus();
    };

    /* addOptItem — 추가 */
    const addOptItem = (grp) => {
      grp.items.push({ _id: _itemSeq++, nm: '', val: '', valCodeId: '', optStyle: '', parentOptItemId: '', sortOrd: grp.items.length + 1, useYn: 'Y' });
    };

    /* removeOptItem — 제거 */
    const removeOptItem = (grp, idx) => { grp.items.splice(idx, 1); generateSkus(); };

    // -- 옵션 아이템 드래그 정렬
    /* onOptItemDragStart — 이벤트 */
    const onOptItemDragStart = (grp, idx) => { uiState.dragOptGrpId = grp._id; uiState.dragOptItemIdx = idx; };

    /* onOptItemDragOver — 이벤트 */
    const onOptItemDragOver  = (grp, idx) => { if (uiState.dragOptGrpId === grp._id) uiState.dragoverOptItemIdx = idx; };

    /* onOptItemDrop — 이벤트 */
    const onOptItemDrop      = (grp) => {
      if (uiState.dragOptItemIdx === null || uiState.dragOptItemIdx === uiState.dragoverOptItemIdx) { uiState.dragOptGrpId = null; uiState.dragOptItemIdx = null; uiState.dragoverOptItemIdx = null; return; }
      const items = [...grp.items];
      const [moved] = items.splice(uiState.dragOptItemIdx, 1);
      items.splice(uiState.dragoverOptItemIdx, 0, moved);
      grp.items = items;
      uiState.dragOptGrpId = null; uiState.dragOptItemIdx = null; uiState.dragoverOptItemIdx = null;
      generateSkus();
    };

    /* generateSkus — 생성 Skus */
    const generateSkus = () => {
      if (optGroups.length === 0) { skus.length = 0; return; }
      const g1 = safeFirst(optGroups)?.items.filter(i => i.useYn === 'Y' && i.nm.trim()) || [];
      const g2 = optGroups[1]?.items.filter(i => i.useYn === 'Y' && i.nm.trim()) || [];
      const existMap = {};
      window.safeArrayUtils.safeForEach(skus, s => { existMap[s._optKey] = s; });
      const newSkus = [];
      if (g2.length === 0) {
        window.safeArrayUtils.safeForEach(g1, i1 => {
          const key = String(i1._id);
          newSkus.push(existMap[key]
            ? { ...existMap[key], _nm1: i1.nm, _nm2: '' }
            : { _id: 'sku_' + i1._id, _optKey: key, _nm1: i1.nm, _nm2: '', skuCode: '', addPrice: 0, stock: 0, useYn: 'Y', statusCd: 'ON_SALE', saleCnt: 0 });
        });
      } else {
        window.safeArrayUtils.safeForEach(g1, i1 => window.safeArrayUtils.safeForEach(g2, i2 => {
          const key = i1._id + '_' + i2._id;
          newSkus.push(existMap[key]
            ? { ...existMap[key], _nm1: i1.nm, _nm2: i2.nm }
            : { _id: 'sku_' + key, _optKey: key, _nm1: i1.nm, _nm2: i2.nm, skuCode: '', addPrice: 0, stock: 0, useYn: 'Y', statusCd: 'ON_SALE', saleCnt: 0 });
        }));
      }
      skus.splice(0, skus.length, ...newSkus);
    };
    const cfTotalStock = computed(() => safeFilter(skus, s => s.useYn === 'Y').reduce((a, s) => a + (Number(s.stock) || 0), 0));

    // -- SKU 행 이동 (위/아래 한 칸) — 원본 skus 배열 인덱스 기준 swap
    /* moveSku — 이동 */
    const moveSku = (sku, dir) => {
      const idx = skus.findIndex(s => s._id === sku._id);
      if (idx === -1) { return; }
      const target = idx + (dir === 'up' ? -1 : 1);
      if (target < 0 || target >= skus.length) { return; }
      const [moved] = skus.splice(idx, 1);
      skus.splice(target, 0, moved);
    };

    // -- SKU 필터 (1단/2단/재고) - uiState 참조
    const cfSkuFilter1Options = computed(() => [...new Set(skus.map(s => s._nm1).filter(Boolean))]);
    const cfSkuFilter2Options = computed(() => {
      const base = uiState.skuFilter1 ? skus.filter(s => s._nm1 === uiState.skuFilter1) : skus;
      return [...new Set(base.map(s => s._nm2).filter(Boolean))];
    });
    const cfSkusFiltered = computed(() => safeFilter(skus, s => {
      if (uiState.skuFilter1     && s._nm1 !== uiState.skuFilter1) { return false; }
      if (uiState.skuFilter2     && s._nm2 !== uiState.skuFilter2) { return false; }
      if (uiState.skuFilterStock === 'in'  && (s.stock || 0) <= 0) { return false; }
      if (uiState.skuFilterStock === 'out' && (s.stock || 0) >  0) { return false; }
      return true;
    }));

    // -- 이미지
    const images = reactive([]);
    let imgIdSeq = 1;
    const fileInputRef = ref(null);

    /* triggerFileInput — trigger 파일 입력 */
    const triggerFileInput = () => fileInputRef.value?.click();

    /* addImageByUrl — 추가 */
    const addImageByUrl = () => images.push({ id: imgIdSeq++, previewUrl: '', isMain: images.length === 0, optItemId1: '', optItemId2: '' });

    /* onFileChange — 이벤트 */
    const onFileChange = (e) => {
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => images.push({ id: imgIdSeq++, previewUrl: ev.target.result, isMain: images.length === 0, optItemId1: '', optItemId2: '' });
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    };

    /* setMain — 설정 */
    const setMain = (id) => window.safeArrayUtils.safeForEach(images, img => { img.isMain = img.id === id; });

    /* removeImage — 제거 */
    const removeImage = (id) => {
      const idx = images.findIndex(img => img.id === id);
      if (idx !== -1) { const wasMain = images[idx].isMain; images.splice(idx, 1); if (wasMain && images.length) safeFirst(images).isMain = true; }
    };
    // 2단 옵션 라벨 — 상위옵션값(parent_opt_item)이 있으면 "상위 > 본인" 형식으로 표시
    /* fnOptItem2Label — 유틸 */
    const fnOptItem2Label = (item) => {
      if (!item) { return ''; }
      const baseLabel = (item.nm || '') + (item.val ? ' (' + item.val + ')' : '');
      const parentKey = item.parentOptItemId;
      if (!parentKey) { return baseLabel; }
      const parents = optGroups[0]?.items || [];
      const p = parents.find(pi => String(pi._id) === String(parentKey) || pi.val === parentKey);
      if (!p) { return baseLabel; }
      const parentLabel = (p.nm || '') + (p.val ? ' (' + p.val + ')' : '');
      return parentLabel + ' > ' + baseLabel;
    };

    // -- 이미지 드래그 정렬
            const onImgDragStart = (idx) => { uiState.dragImgIdx = idx; };

    /* onImgDragOver — 이벤트 */
    const onImgDragOver  = (idx) => { uiState.dragoverImgIdx = idx; };

    /* onImgDrop — 이벤트 */
    const onImgDrop = () => {
      if (uiState.dragImgIdx === null || uiState.dragImgIdx === uiState.dragoverImgIdx) { uiState.dragImgIdx = null; uiState.dragoverImgIdx = null; return; }
      const items = [...images];
      const [moved] = items.splice(uiState.dragImgIdx, 1);
      items.splice(uiState.dragoverImgIdx, 0, moved);
      images.splice(0, images.length, ...items);
      uiState.dragImgIdx = null;
      uiState.dragoverImgIdx = null;
    };

    // -- 상품설명 블록 (contentBlocks)
    const contentBlocks = reactive([]);
    let _blockSeq = 1;

    /* addContentBlock — 추가 */
    const addContentBlock = (type) => {
      contentBlocks.push({ _id: _blockSeq++, type, content: '', fileName: '' });
    };

    /* removeContentBlock — 제거 */
    const removeContentBlock = (idx) => {
      contentBlocks.splice(idx, 1);
    };

    /* onBlockFileChange — 이벤트 */
    const onBlockFileChange = (block, e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => { block.content = ev.target.result; block.fileName = file.name; };
      reader.readAsDataURL(file); e.target.value = '';
    };
            const onBlockDragStart = (idx) => { uiState.dragBlockIdx = idx; };

    /* onBlockDragOver — 이벤트 */
    const onBlockDragOver  = (idx) => { uiState.dragoverBlockIdx = idx; };

    /* onBlockDrop — 이벤트. 정책서 §19 v2: 정렬변경은 즉시 저장 (본문 미저장 편집은 건드리지 않음) */
    const onBlockDrop = async () => {
      if (uiState.dragBlockIdx === null || uiState.dragBlockIdx === uiState.dragoverBlockIdx) { uiState.dragBlockIdx = null; uiState.dragoverBlockIdx = null; return; }
      const items = [...contentBlocks];
      const [moved] = items.splice(uiState.dragBlockIdx, 1);
      items.splice(uiState.dragoverBlockIdx, 0, moved);
      contentBlocks.splice(0, contentBlocks.length, ...items);
      uiState.dragBlockIdx = null; uiState.dragoverBlockIdx = null;

      /* 저장된 블록들만 sort 즉시 저장 — DB에 없는 신규 블록(prodContentId 없음)은 부모 [저장] 시 일괄 처리 */
      const prodId = cfCurProdId.value;
      if (!prodId) { return; }
      let ord = 0;
      const list = [];
      contentBlocks.forEach(b => {
        ord++;
        if (b?.prodContentId != null && b.prodContentId !== '') {
          list.push({ id: b.prodContentId, sortOrd: ord });
        }
      });
      if (list.length === 0) { return; }
      try {
        await boApiSvc.pdProd.updateSortOrds(prodId, list, '상품관리', '상품설명순서변경');
        if (showToast) { showToast('순서가 저장되었습니다.', 'success'); }
      } catch (err) { _afterApiErr(err); }
    };
    // -- 스플릿 패널 + 미리보기
            const contentSplitRef = ref(null);

    /* onDividerMousedown — 이벤트 */
    const onDividerMousedown = (e) => { uiState.isDraggingDivider = true; e.preventDefault(); };
    let _divMoveH = null, _divUpH = null;

    // -- 계산값
    const cfMarginRateCalc = computed(() => {
      if (!form.salePrice || !form.purchasePrice) { return null; }
      return ((form.salePrice - form.purchasePrice) / form.salePrice * 100).toFixed(2);
    });
    const cfDiscountRate = computed(() => {
      if (!form.listPrice || form.listPrice <= 0) { return 0; }
      return Math.round((1 - form.salePrice / form.listPrice) * 100);
    });
    // 플랫폼수수료: amount 우선 — amount 가 비어 있으면 rate × salePrice 로 환산
    const cfPlatformFee = computed(() => {
      const sale = Number(form.salePrice || 0);
      if (form.platformFeeAmount != null && form.platformFeeAmount !== '') {
        return Math.round(Number(form.platformFeeAmount) || 0);
      }
      if (form.platformFeeRate != null && form.platformFeeRate !== '') {
        return Math.round(sale * (Number(form.platformFeeRate) || 0) / 100);
      }
      return 0;
    });
    const cfPlatformFeeDisp = computed(() => {
      const fee = cfPlatformFee.value;
      if (!fee) { return '-'; }
      if (form.platformFeeAmount != null && form.platformFeeAmount !== '') { return fee.toLocaleString() + '원'; }
      if (form.platformFeeRate   != null && form.platformFeeRate   !== '') { return fee.toLocaleString() + '원 (' + form.platformFeeRate + '%)'; }
      return '-';
    });
    // 예상 순수익 = 판매가 - 매입가 - 플랫폼수수료
    const cfNetRevenueDisp = computed(() => {
      const sale = Number(form.salePrice || 0);
      if (!sale) { return '-'; }
      const cost = Number(form.purchasePrice || 0);
      const fee  = cfPlatformFee.value;
      const net  = sale - cost - fee;
      return net.toLocaleString() + '원';
    });

    // -- 연관상품 / 코드상품
    let _relSeq = 1;
    const relProds  = reactive([]);  // [{ _id, productId, prodNm, category, price, stock, status }]
    const codeProds = reactive([]);  // 동일 구조

    // 상품 추가 피커 모달 — uiState.prodPickerOpen 을 template 에서 직접 참조 가능하도록 toRef
    const prodPickerOpen   = Vue.toRef(uiState, 'prodPickerOpen');
        const cfProdPickerList   = computed(() => {
      const q    = (uiState.prodPickerSearch || '').trim().toLowerCase();
      const all  = products;
      const used = (uiState.prodPickerOpen === 'rel' ? relProds : codeProds).map(r => r.prodId);
      const types = uiState.prodPickerSearchType || 'prodId,prodNm,cateNm';
      return safeFilter(all, p => {
        if (used.includes(p.prodId)) { return false; }
        if (!q) { return true; }
        const hits = [];
        if (types.includes('prodId')) { hits.push(String(p.prodId).includes(q)); }
        if (types.includes('prodNm')) { hits.push((p.prodNm || '').toLowerCase().includes(q)); }
        if (types.includes('cateNm')) { hits.push((p.cateNm || '').toLowerCase().includes(q)); }
        return hits.some(Boolean);
      });
    });

    /* openProdPicker — 열기 (좌:카테고리트리 + 우:상품목록 모달) */
    const openProdPicker = (type) => { uiState.prodPickerOpen = type; };

    /* selectProdItem — 선택 */
    const selectProdItem = (p) => {
      const row = { _id: _relSeq++, prodId: p.prodId, prodNm: p.prodNm,
        cateNm: p.cateNm || p.categoryNm || '',
        listPrice: p.listPrice || p.price || 0,
        prodStock: p.prodStock || 0,
        prodStatusCd: p.prodStatusCd || '' };
      if (uiState.prodPickerOpen === 'rel') { relProds.push(row); }
      else { codeProds.push(row); }
      uiState.prodPickerOpen = '';
    };

    /* fnProdPickerCallback — BoProdCatePickModal 콜백 (선택 시 행 추가, 닫기 시 모달 종료) */
    const fnProdPickerCallback = (cmd, param, result) => {
      if (cmd !== 'prod-cate-pick') return;
      if (result == null) { uiState.prodPickerOpen = ''; return; }
      selectProdItem(result);
    };

    /* removeRelProd — 제거 */
    const removeRelProd  = (idx) => relProds.splice(idx, 1);

    /* removeCodeProd — 제거 */
    const removeCodeProd = (idx) => codeProds.splice(idx, 1);

    // 드래그 정렬 — 연관상품
    const onRelDragStart = (idx) => { uiState.dragRelIdx = idx; };

    /* onRelDragOver — 이벤트 */
    const onRelDragOver  = (idx) => { uiState.dragoverRelIdx = idx; };

    /* onRelDrop — 이벤트 */
    const onRelDrop = () => {
      if (uiState.dragRelIdx === null || uiState.dragRelIdx === uiState.dragoverRelIdx) { uiState.dragRelIdx = null; uiState.dragoverRelIdx = null; return; }
      const items = [...relProds]; const [m] = items.splice(uiState.dragRelIdx, 1); items.splice(uiState.dragoverRelIdx, 0, m);
      relProds.splice(0, relProds.length, ...items); uiState.dragRelIdx = null; uiState.dragoverRelIdx = null;
    };
    // 드래그 정렬 — 코드상품
    const onCodeDragStart = (idx) => { uiState.dragCodeIdx = idx; };

    /* onCodeDragOver — 이벤트 */
    const onCodeDragOver  = (idx) => { uiState.dragoverCodeIdx = idx; };

    /* onCodeDrop — 이벤트 */
    const onCodeDrop = () => {
      if (uiState.dragCodeIdx === null || uiState.dragCodeIdx === uiState.dragoverCodeIdx) { uiState.dragCodeIdx = null; uiState.dragoverCodeIdx = null; return; }
      const items = [...codeProds]; const [m] = items.splice(uiState.dragCodeIdx, 1); items.splice(uiState.dragoverCodeIdx, 0, m);
      codeProds.splice(0, codeProds.length, ...items); uiState.dragCodeIdx = null; uiState.dragoverCodeIdx = null;
    };

    // -- 카테고리 N개 목록 (pd_category_prod)
    const prodCategories = reactive([]); // [{ categoryId, categoryNm, depth }]
    const cfCatExcludeSet = computed(() => new Set(prodCategories.map(c => String(c.categoryId))));

    /* getCategoryNm — 조회 */
    const getCategoryNm = (id) => {
      const c = (categories||[]).find(x => String(x.categoryId||x.id) === String(id));
      return c ? (c.categoryNm||c.nm||String(id)) : String(id);
    };

    /* getCategoryDepth — 조회 */
    const getCategoryDepth = (id) => {
      const c = (categories||[]).find(x => String(x.categoryId||x.id) === String(id));
      return c ? (c.depth||c.level||1) : 1;
    };

    /* addCategory — 추가 */
    const addCategory = (cat) => {
      const id = cat.categoryId||cat.id;
      if (window.safeArrayUtils.safeSome(prodCategories, c => String(c.categoryId) === String(id))) { return; }
      prodCategories.push({ categoryId: id, categoryNm: cat.categoryNm||cat.nm||String(id), depth: cat.depth||cat.categoryDepth||cat.level||1 });
      uiState.catPickerOpen = false;
    };

    /* removeCategory — 제거 */
    const removeCategory = (idx) => { prodCategories.splice(idx, 1); };

    /* onCatDragStart — 이벤트 */
    const onCatDragStart = (idx) => { uiState.catDragIdx = idx; };

    /* onCatDragOver — 이벤트 */
    const onCatDragOver  = (idx) => { uiState.catDragoverIdx = idx; };

    /* onCatDrop — 이벤트 */
    const onCatDrop = () => {
      if (uiState.catDragIdx === null || uiState.catDragIdx === uiState.catDragoverIdx) { uiState.catDragIdx = null; uiState.catDragoverIdx = null; return; }
      const items = [...prodCategories]; const [m] = items.splice(uiState.catDragIdx, 1); items.splice(uiState.catDragoverIdx, 0, m);
      prodCategories.splice(0, prodCategories.length, ...items); uiState.catDragIdx = null; uiState.catDragoverIdx = null;
    };

    // -- 판매계획
    const salePlans = reactive([]);
    let planIdSeq = 1;
    const cfPlanVisible = computed(() => safeFilter(salePlans, r => r._row_status !== 'D'));
    const cfPlanAllChecked = computed({
      get: () => cfPlanVisible.value.length > 0 && window.safeArrayUtils.safeEvery(cfPlanVisible.value, r => r._checked),
      set: v => window.safeArrayUtils.safeForEach(cfPlanVisible.value, r => { r._checked = v; }),
    });

    /* addPlanRow — 추가 */
    const addPlanRow = () => salePlans.unshift({ _id: planIdSeq++, _row_status: 'I', _checked: false, startDate: '', startTime: '00:00', endDate: '', endTime: '23:59', planStatus: '준비중', listPrice: form.listPrice || 0, salePrice: form.salePrice || 0, purchasePrice: form.purchasePrice || 0 });

    /* onPlanChange — 이벤트 */
    const onPlanChange = row => { if (row._row_status === 'N') row._row_status = 'U'; };

    /* deletePlanChecked — 삭제 */
    const deletePlanChecked = () => { for (let i = salePlans.length - 1; i >= 0; i--) { const r = salePlans[i]; if (!r._checked) continue; if (r._row_status === 'I') salePlans.splice(i, 1); else r._row_status = 'D'; } };

    /* planRowStyle — 기획전 행 스타일 */
    const planRowStyle = s => ({ I: 'background:#f6ffed;', U: 'background:#fffbe6;', D: 'background:#fff1f0;opacity:0.6;' }[s] || '');

    // -- mounted
    // -- 담당MD 모달
    const mdSearchType = ref('');
    const mdSearch    = ref('');
    const cfMdUserList  = computed(() => (boUsers||[]).filter(u => u.userStatusCd !== 'SUSPENDED' && u.userStatusCd !== 'DELETED'));
    const cfMdUserListFiltered = computed(() => {
      const q = (uiState.mdSearch || '').trim().toLowerCase();
      if (!q) { return cfMdUserList.value; }
      const types = (uiState.mdSearchType || mdSearchType.value) || 'userNm,deptId,roleId';
      return cfMdUserList.value.filter(u => {
        const hits = [];
        if (types.includes('userNm')) { hits.push((u.userNm || '').toLowerCase().includes(q)); }
        if (types.includes('deptId')) { hits.push((u.deptId || '').toLowerCase().includes(q)); }
        if (types.includes('roleId')) { hits.push((u.roleId || '').toLowerCase().includes(q)); }
        return hits.some(Boolean);
      });
    });
    const cfMdSelectedNm = computed(() => {
      const u = cfMdUserList.value.find(u => u.userId === form.mdUserId);
      return u ? `${u.userNm} (${u.deptId||''})` : '';
    });

    /* openMdModal — 열기 */
    const openMdModal  = () => { uiState.mdSearch = ''; uiState.mdModalOpen = true; };

    /* selectMdUser — 선택 */
    const selectMdUser = (u) => { form.mdUserId = u.userId; uiState.mdModalOpen = false; };

    /* handleInitForm — 처리 */
    const handleInitForm = async () => {
      if (cfIsNew.value) {
        form.mdUserId = cfMdUserList.value[0]?.userId || '';
      }
      if (!cfIsNew.value) {
        const p = products[0] || null;
        if (p) {
          form.prodId         = p.prodId;
          form.prodNm         = p.prodNm || '';
          form.prodCode       = p.prodCode || '';
          form.categoryId     = p.categoryId || '';
          form.brandId        = p.brandId || '';
          form.vendorId       = p.vendorId || '';
          form.mdUserId       = p.mdUserId || '';
          form.prodTypeCd     = p.prodTypeCd || 'SINGLE';
          form.prodStatusCd   = p.prodStatusCd || 'DRAFT';
          form.unsaleMsg      = p.unsaleMsg || '';
          form.dlivTmpltId    = p.dlivTmpltId || '';
          form.listPrice      = p.listPrice || 0;
          form.salePrice      = p.salePrice || 0;
          form.purchasePrice  = p.purchasePrice || null;
          form.platformFeeRate   = p.platformFeeRate   != null ? p.platformFeeRate   : null;
          form.platformFeeAmount = p.platformFeeAmount != null ? p.platformFeeAmount : null;
          form.prodStock      = p.prodStock || 0;
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
          form.isNew          = p.isNew || 'N';
          form.isBest         = p.isBest || 'N';
          form.contentHtml    = p.contentHtml || p.description || '';
          // 이미지 — tabData에서 채움 (handleLoadData에서 이미 로드)
          if (tabData.images.length) {
            images.splice(0, images.length, ...tabData.images);
            // 대표가 하나도 없으면 첫 번째 자동 지정
            if (!images.some(i => i.isMain)) { safeFirst(images).isMain = true; }
          }
          else if (p.mainImage) { images.splice(0, images.length, { id: imgIdSeq++, previewUrl: p.mainImage, isMain: true, optItemId1: '', optItemId2: '' }); }

          // 상품설명 — tabData.content에서 채움
          // DB contentTypeCd (HTML/FILE/URL/IMAGE) → 클라이언트 type (html/file/url) 매핑
          const fnMapTypeCd = (cd) => {
            const v = String(cd || 'HTML').toUpperCase();
            if (v === 'FILE') { return 'file'; }
            if (v === 'URL') { return 'url'; }
            if (v === 'IMAGE') return 'file'; // IMAGE 는 첨부와 동일 표시 (data:image)
            return 'html';
          };
          if (tabData.content.length) {
            contentBlocks.splice(0, contentBlocks.length, ...tabData.content.map(c => ({
              _id: _blockSeq++,
              type: fnMapTypeCd(c.contentTypeCd),
              content: c.contentHtml || '',
              fileName: c.fileName || '',
              prodContentId: c.prodContentId,
            })));
          } else if (form.contentHtml) {
            contentBlocks.splice(0, contentBlocks.length, { _id: _blockSeq++, type: 'html', content: form.contentHtml, fileName: '' });
          }

          // 연관상품 — tabData.rels에서 채움
          if (tabData.rels.length) { relProds.splice(0, relProds.length, ...tabData.rels); }

          // SKU — tabData.skus에서 채움
          if (tabData.skus.length) { skus.splice(0, skus.length, ...tabData.skus); }

          // 옵션 사용 여부 — DB 값 우선 반영 (없으면 true 기본)
          if (p.useOptYn !== undefined) { uiState.useOpt = p.useOptYn === 'Y'; }
          else { uiState.useOpt = true; }

          // 옵션 카테고리 복원 — optGroups 의 typeCd(=2레벨 code_value)의 parent_code_value 로 역추적
          //   svCodes row 원본 키(codeVal / codeLevel / parentCodeValue) 기준으로 비교
          if (optGroups.length && !uiState.prodOptCategoryTypeCd) {
            const typeCds = optGroups.map(g => g.typeCd || g.optTypeCd || '').filter(Boolean);
            const lvl2 = (codes||[]).filter(c => c.codeGrp === PROD_OPT_GRP && Number(c.codeLevel||0) === 2);
            const parentSet = new Set(typeCds.map(tc => {
              const found = lvl2.find(c => (c.codeVal || c.codeValue) === tc);
              return found ? found.parentCodeValue : null;
            }).filter(Boolean));
            // 모든 typeCd 가 동일한 부모(카테고리)에 속할 때만 자동 복원
            if (parentSet.size === 1) { uiState.prodOptCategoryTypeCd = [...parentSet][0]; }
          }
          // 변경 confirm 비교용 — 현재 카테고리를 baseline 으로 기록
          _prevCategoryCd = uiState.prodOptCategoryTypeCd || '';

          if (p.salePlans?.length) { salePlans.splice(0, salePlans.length, ...p.salePlans.map(r => ({ ...r, _id: planIdSeq++, _checked: false }))); }
          // 카테고리 N개 로드 (pd_category_prod)
          const pid = String(p.prodId);
          const linked = (categoryProds||[])
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
      // 스플릿 패널 divider 마우스 리스너
      _divMoveH = (e) => {
        if (!uiState.isDraggingDivider || !contentSplitRef.value) { return; }
        const rect = contentSplitRef.value.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        uiState.splitPct = Math.max(25, Math.min(78, pct));
      };
      _divUpH = () => { uiState.isDraggingDivider = false; };
      document.addEventListener('mousemove', _divMoveH);
      document.addEventListener('mouseup', _divUpH);
    };

    // ★ onMounted
    onMounted(async () => {
      if (isAppReady.value) { fnLoadCodes(); }
      await handleLoadData();
      await handleInitForm();
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleLoadData();
    });
    onBeforeUnmount(() => {
      if (_divMoveH) { document.removeEventListener('mousemove', _divMoveH); }
      if (_divUpH) { document.removeEventListener('mouseup',  _divUpH); }
    });

    // -- 저장
    /* ── 현재 작업중인 prodId: props.dtlId 우선, 없으면 신규등록 직후 form.prodId ── */
    const cfCurProdId   = computed(() => props.dtlId || form.prodId || null);
    const cfHasProdId   = computed(() => !!cfCurProdId.value);
    /* info 외 탭의 [저장] 버튼은 prodId 없으면 비활성화 (info 탭은 신규등록 위해 항상 활성) */
    const cfSaveDisabled = computed(() => topTab.value !== 'info' && !cfHasProdId.value);

    /* _afterApiOk — 후 API 성공 */
    const _afterApiOk  = (res, msg) => {
      if (showToast) { showToast(msg, 'success'); }
    };

    /* _afterApiErr — 후 API 오류 */
    const _afterApiErr = (err) => {
      console.error('[handleSave]', err);
      const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
      if (showToast) { showToast(errMsg, 'error', 0); }
    };

    /* ── 탭별 저장: topTab 값으로 분기. info/detail 은 form 전체 저장(같은 form 공유).
     *   info 탭의 신규 모드만 create() 호출 — 응답에서 prodId 받아 form.prodId 에 주입하면
     *   cfCurProdId 가 true 가 되어 다른 탭의 [저장] 버튼이 활성화된다. */
    /* handleSave — 저장 */
    const handleSave = async () => {
      const tabId = topTab.value;

      /* 신규(prodId 없음)인데 info 가 아닌 탭에서 저장 시도 시 가드 */
      if (!cfHasProdId.value && tabId !== 'info') {
        showToast('먼저 기본정보 탭에서 상품을 등록해주세요.', 'error');
        return;
      }

      /* info / detail 탭: pd_prod 본체 전체 저장 (둘은 form 공유) */
      if (tabId === 'info' || tabId === 'detail') {
        Object.keys(errors).forEach(k => delete errors[k]);
        try { await schema.validate(form, { abortEarly: false }); }
        catch (err) { err.inner.forEach(e => { errors[e.path] = e.message; }); showToast('입력 내용을 확인해주세요.', 'error'); return; }

        const isCreate = !cfHasProdId.value; // info 신규
        const ok = await showConfirm(isCreate ? '등록' : '저장', isCreate ? '등록하시겠습니까?' : '저장하시겠습니까?');
        if (!ok) { return; }
        try {
          const payload = { ...form };
          const res = isCreate
            ? await boApiSvc.pdProd.create(payload, '상품관리', '등록')
            : await boApiSvc.pdProd.update(cfCurProdId.value, payload, '상품관리', tabId === 'info' ? '기본정보저장' : '상세설정저장');
          /* 신규 등록 응답에서 prodId 추출하여 form.prodId 에 주입 → 다른 탭 활성화 */
          if (isCreate) {
            const newId = res.data?.data?.prodId || res.data?.prodId || null;
            if (newId) { form.prodId = newId; }
          }
          /* 카테고리 매핑 저장 — pd_category_prod 전체 교체 (D + I) */
          const pid = cfCurProdId.value || form.prodId;
          if (pid && tabId === 'info') {
            try {
              const curIds = new Set(prodCategories.map(c => String(c.categoryId)));
              const existing = (categoryProds || []).filter(cp => String(cp.prodId) === String(pid));
              const existingIds = new Set(existing.map(cp => String(cp.categoryId)));
              const rows = [];
              /* D: 기존 매핑 중 현재 목록에 없는 행 */
              existing.forEach(cp => {
                if (!curIds.has(String(cp.categoryId))) {
                  rows.push({ rowStatus: 'D', categoryProdId: cp.categoryProdId });
                }
              });
              /* I: 현재 목록 중 기존에 없던 행 */
              prodCategories.forEach((c, i) => {
                if (!existingIds.has(String(c.categoryId))) {
                  rows.push({ rowStatus: 'I', prodId: pid, categoryId: c.categoryId, typeCd: 'NORMAL', sortOrd: i + 1, dispYn: 'Y' });
                }
              });
              if (rows.length > 0) {
                await boApiSvc.pdCategory.updateProds({ categoryProds: rows }, '상품관리', '카테고리저장');
              }
            } catch (catErr) { console.error('[handleSave:category]', catErr); }
          }
          /* UX-admin §18: 저장 후 재조회 — 본 탭 + 첫 탭(info)이면 상위 Mng 도 */
          await handleLoadData();
          if (tabId === 'info') { try { await props.onListReload(); } catch (_) {} }
          _afterApiOk(res, isCreate ? '등록되었습니다. 다른 탭을 저장할 수 있습니다.' : '저장되었습니다.');
        } catch (err) { _afterApiErr(err); }
        return;
      }

      /* 그 외 탭: 부분 PUT — payload 에 해당 탭 데이터만 포함 */
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) { return; }

      const TAB_LABEL = { content: '상품설명', option: '옵션설정', price: '옵션(가격/재고)', image: '이미지', related: '연관상품' };
      let payload = null;
      switch (tabId) {
        case 'content':  payload = { contentBlocks: [...contentBlocks] }; break;
        case 'option': {
          // 옵션명 누락 자동 보정 (DB pd_prod_opt.opt_grp_nm 은 NOT NULL)
          optGroups.forEach((g, i) => {
            if (!g.grpNm || !String(g.grpNm).trim()) {
              g.grpNm = g.typeCd || ('옵션' + (i + 1));
            }
          });
          payload = { optGroups };
          break;
        }
        case 'price':    payload = { skus };          break;
        case 'image':    payload = { images: images.map(({ id, ...rest }) => rest) }; break;
        case 'related':  payload = { relProds, codeProds }; break;
        default:         payload = {}; break;
      }
      try {
        /* content / option / image 탭은 전용 엔드포인트로 분리 호출 — 백엔드에서 일괄 저장 처리 */
        let res;
        if (tabId === 'content') {
          res = await boApiSvc.pdProd.saveContents(cfCurProdId.value, payload, '상품관리', '상품설명저장');
        } else if (tabId === 'option') {
          res = await boApiSvc.pdProd.saveOpts(cfCurProdId.value, payload, '상품관리', '옵션설정저장');
        } else if (tabId === 'image') {
          res = await boApiSvc.pdProd.saveImages(cfCurProdId.value, payload, '상품관리', '이미지저장');
        } else {
          res = await boApiSvc.pdProd.update(cfCurProdId.value, payload, '상품관리', `${TAB_LABEL[tabId] || tabId}저장`);
        }
        /* UX-admin §18: 저장한 탭의 데이터를 다시 가져와 화면 동기화 */
        await handleLoadData();
        _afterApiOk(res, `${TAB_LABEL[tabId] || ''} 저장되었습니다.`);
      } catch (err) { _afterApiErr(err); }
    };

    const catDragoverIdx = Vue.toRef(uiState, 'catDragoverIdx');
    const catPickerOpen = Vue.toRef(uiState, 'catPickerOpen');
    const dragBlockIdx = Vue.toRef(uiState, 'dragBlockIdx');
    const dragCodeIdx = Vue.toRef(uiState, 'dragCodeIdx');
    const dragImgIdx = Vue.toRef(uiState, 'dragImgIdx');
    const dragOptGrpId = Vue.toRef(uiState, 'dragOptGrpId');
    const dragOptItemIdx = Vue.toRef(uiState, 'dragOptItemIdx');
    const dragRelIdx = Vue.toRef(uiState, 'dragRelIdx');
    const dragoverBlockIdx = Vue.toRef(uiState, 'dragoverBlockIdx');
    const dragoverCodeIdx = Vue.toRef(uiState, 'dragoverCodeIdx');
    const dragoverImgIdx = Vue.toRef(uiState, 'dragoverImgIdx');
    const dragoverOptItemIdx = Vue.toRef(uiState, 'dragoverOptItemIdx');
    const dragoverRelIdx = Vue.toRef(uiState, 'dragoverRelIdx');
    const isDraggingDivider = Vue.toRef(uiState, 'isDraggingDivider');
    const mdModalOpen = Vue.toRef(uiState, 'mdModalOpen');
    const previewDevice = Vue.toRef(uiState, 'previewDevice');
    const prodOptCategoryTypeCd = Vue.toRef(uiState, 'prodOptCategoryTypeCd');

    /* openHelp — 열기 */
    const openHelp = (topic) => { if (window.showBoHelp) window.showBoHelp(topic); };
    const prodPickerSearch = Vue.toRef(uiState, 'prodPickerSearch');
    const prodPickerSearchType = Vue.toRef(uiState, 'prodPickerSearchType');
    const mdSearchTypeRef = Vue.toRef(uiState, 'mdSearchType');
    const skuFilter1 = Vue.toRef(uiState, 'skuFilter1');
    const skuFilter2 = Vue.toRef(uiState, 'skuFilter2');
    const skuFilterStock = Vue.toRef(uiState, 'skuFilterStock');
    const splitPct = Vue.toRef(uiState, 'splitPct');
    const useOpt = Vue.toRef(uiState, 'useOpt');

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    /* onPreview — 이벤트 */
    const onPreview = () => {
      if (!cfHasProdId.value) { showToast('상품 등록 후 미리보기 가능합니다.', 'error'); return; }
      window.open(`${window.pageUrl('index.html')}#page=prodView&prodid=${cfCurProdId.value}`, '_blank', 'width=1200,height=800,scrollbars=yes');
    };
    /* 공통코드 그룹 미리보기 모달 (BoCodeGrpModal) */
    const codeGrpModal = reactive({ show: false, codeGrp: '', title: '' });

    /* openCodeGrpModal — 열기 */
    const openCodeGrpModal = (codeGrp, title) => {
      codeGrpModal.codeGrp = codeGrp;
      codeGrpModal.title = title || '';
      codeGrpModal.show = true;
    };

    // -- bo-grid 컬럼 정의 (특수 셀은 #cell- 슬롯) ----------------------------
    /* fnNoCursor — 유틸 */
    const fnNoCursor = () => '';

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // 담당 MD 그리드
    const columns = {};
    columns.mdUserGrid = [
      { key: 'userNm', label: '이름',
        fmt: (v, row) => form.mdUserId === row.userId ? `✔ ${row.userNm || ''}` : (row.userNm || ''),
        cellStyle: (v, row) => form.mdUserId === row.userId ? 'color:#e8587a;' : '' },
      { key: 'deptId', label: '부서' },
      { key: 'roleId', label: '역할', badge: () => 'badge-gray', cellStyle: 'font-size:11px;' },
    ];
    /* fnMdRowStyle — 유틸 */
    const fnMdRowStyle = (u) => '' + (form.mdUserId === u.userId ? 'font-weight:700;' : '');
    // 상품 선택 모달 그리드
    columns.prodPickerGrid = [
      { key: 'productId', label: 'ID',       style: 'width:46px;', align: 'center', cellStyle: 'color:#888;' },
      { key: 'prodNm',    label: '상품명',   cellStyle: 'font-weight:600;' },
      { key: 'category',  label: '카테고리', style: 'width:80px;' },
      { key: 'price',     label: '가격',     style: 'width:90px;text-align:right;', align: 'right',
        fmt: (v, row) => ((row.price || 0).toLocaleString() + '원') },
      { key: 'stock',     label: '재고',     style: 'width:60px;text-align:right;', align: 'right',
        fmt: (v, row) => (row.stock + '개') },
      { key: 'status',    label: '상태',     style: 'width:60px;', badge: row => row.status==='판매중' ? 'badge-green' : 'badge-gray', cellStyle: 'font-size:10px;' },
    ];
    // 잔여 SKU 그리드
    columns.remainSkuGrid = [
      { key: '_nm1',     label: '1단 옵션', badge: () => 'badge-gray', fmt: (v, row) => (row._nm1 || '-') },
      { key: '_nm2',     label: '2단 옵션', badge: () => 'badge-blue', fmt: (v, row) => (row._nm2 || '-') },
      { key: 'skuCode',  label: 'SKU코드',  style: 'color:#888;' },
      { key: 'addPrice', label: '추가금액', style: 'width:100px;', align: 'right', cellStyle: 'color:#888;',
        fmt: (v) => (v || 0).toLocaleString() + '원' },
      { key: 'stock',    label: '재고',     style: 'width:80px;', align: 'right',
        cellStyle: (v) => ((v || 0) === 0 ? 'color:#f5222d;font-weight:700;' : ''),
        fmt: (v) => (v || 0) },
      { key: 'statusCd', label: '판매상태', style: 'width:110px;', badge: () => 'badge-gray' },
      { key: 'saleCnt',  label: '판매수량', style: 'width:68px;', align: 'right', cellStyle: 'color:#888;',
        fmt: (v) => (v || 0).toLocaleString() },
      { key: 'useYn',    label: '사용',     style: 'width:42px;', align: 'center',
        badge: (row) => (row.useYn === 'Y' ? 'badge-green' : 'badge-gray') },
    ];
    /* fnRemainSkuRowStyle — 유틸 */
    const fnRemainSkuRowStyle = () => 'opacity:0.6;background:#f9f9f9;';

    /* BoGrid 컬럼 — 연관상품 (pd_prod_rel · REL_PROD) */
    columns.relProdGrid = [
      { key: '_id2',     label: 'ID',     style: 'width:46px;text-align:center;', align: 'center',
        cellStyle: 'color:#888;', fmt: (v, row) => (row.relProdId || row.prodId) },
      { key: 'prodNm',   label: '상품명', refLink: 'prod', refKey: 'relProdId' },
      { key: '_relType', label: '유형',   style: 'width:80px;', fmt: (v, row) => (row.prodRelTypeCdNm || row.prodRelTypeCd) },
    ];
    /* BoGrid 컬럼 — 코디상품 (pd_prod_rel · CODY_PROD) */
    columns.codeProdGrid = [
      { key: 'productId', label: 'ID',     style: 'width:46px;text-align:center;', align: 'center', cellStyle: 'color:#888;' },
      { key: 'prodNm',    label: '상품명', refLink: 'prod', refKey: 'productId' },
      { key: 'category',  label: '카테고리', style: 'width:80px;' },
      { key: '_price',    label: '가격',   style: 'width:90px;text-align:right;', align: 'right',
        fmt: (v, row) => ((row.price || 0).toLocaleString() + '원') },
      { key: '_stock',    label: '재고',   style: 'width:60px;text-align:right;', align: 'right',
        fmt: (v, row) => (row.stock + '개') },
      { key: '_status',   label: '상태',   style: 'width:60px;',
        badge: (row) => (row.status === '판매중' ? 'badge-green' : 'badge-gray'), fmt: (v, row) => row.status },
      { key: '_act',      label: '관리',   style: 'width:54px;text-align:center;' },
    ];
    /* BoGrid 컬럼 — 판매계획 (selectable + 인라인 편집)
     * _start/_end: bo-date-time-picker 커스텀 컴포넌트 슬롯 KEEP
     * planStatus/listPrice/salePrice/purchasePrice: BoGrid edit 자동 렌더 (@cell-change 미사용, change 시 onPlanChange 호출 위해 슬롯 유지)
     */
    columns.planGrid = [
      { key: '_start',       label: '시작일시', style: 'width:140px;',
        dateTimePick: { dateKey: 'startDate', timeKey: 'startTime', showNow: false, showClear: false } },
      { key: '_end',         label: '종료일시', style: 'width:140px;',
        dateTimePick: { dateKey: 'endDate', timeKey: 'endTime', showNow: false, showClear: false } },
      { key: 'planStatus',   label: '상태',    style: 'width:80px;',
        edit: 'select', options: () => grpCodes.prod_plan_statuses },
      { key: 'listPrice',    label: '정가',    style: 'width:90px;', edit: 'number', align: 'right' },
      { key: 'salePrice',    label: '판매가',  style: 'width:90px;', edit: 'number', align: 'right' },
      { key: 'purchasePrice', label: '매입가', style: 'width:80px;', edit: 'number', align: 'right' },
    ];
    /* fnPlanRowChecked — 유틸 */
    const fnPlanRowChecked = (key) => {
      const r = window.safeArrayUtils.safeFind(cfPlanVisible.value, x => String(x._id) === String(key));
      return !!(r && r._checked);
    };
    /* onPlanToggleCheck — 이벤트 */
    const onPlanToggleCheck = (key) => {
      const r = window.safeArrayUtils.safeFind(cfPlanVisible.value, x => String(x._id) === String(key));
      if (r) { r._checked = !r._checked; }
    };
    /* onPlanToggleCheckAll — 이벤트 */
    const onPlanToggleCheckAll = () => { cfPlanAllChecked.value = !cfPlanAllChecked.value; };
    /* fnPlanRowStyle2 — 유틸 */
    const fnPlanRowStyle2 = (row) => planRowStyle(row._row_status);

    // 기본정보 통합 폼 (cols=3 한 줄에 3필드씩 배치)
    columns.infoForm = [
      // 1행: 상품명 / 상품코드(SKU) / 상품유형
      { key: 'prodNm',       label: '상품명', type: 'text', required: true, placeholder: '상품명' },
      { key: 'prodCode',     label: '상품코드 (SKU)', type: 'text', placeholder: '예: SKU-20260419-001' },
      { key: 'prodTypeCd',   label: '상품유형 (prod_type_cd)', type: 'select', nullable: false,
        options: () => grpCodes.prod_types },
      // 2행: 카테고리 / 브랜드 / 업체
      { key: '_categories',  label: '카테고리', type: 'slot', name: 'categories' },
      { key: 'brandId',      label: '브랜드', type: 'slot', name: 'brand' },
      { key: 'vendorId',     label: '업체', type: 'slot', name: 'vendor' },
      // 3행: 담당MD / 배송템플릿 / 상태
      { key: 'mdUserId',     label: '담당MD (md_user_id)', type: 'slot', name: 'mdUser' },
      { key: 'dlivTmpltId',  label: '배송템플릿 (dliv_tmplt_id)', type: 'slot', name: 'dlivTmplt' },
      { key: 'prodStatusCd', label: '상태 (prod_status_cd)', type: 'select',
        options: () => grpCodes.product_statuses },
      // 4행: 미판매메시지 / 무게 / 사이즈
      { key: 'unsaleMsg',    label: '미판매메시지', type: 'text', placeholder: '예: 현재 판매 준비 중입니다.',
        hint: '판매불가 시 고객 노출' },
      { key: 'weight',       label: '무게 (kg)', type: 'number', min: 0, placeholder: '예: 0.35' },
      { key: 'sizeInfoCd',   label: '사이즈 (size_info_cd)', type: 'select',
        options: () => ['FREE','XS','S','M','L','XL','XXL'] },
      // 5행: 판매시작 / 판매종료 / (빈)
      { key: 'saleStartDate', label: '판매 시작일시', type: 'slot', name: 'saleStart',
        hint: 'NULL=즉시' },
      { key: 'saleEndDate',   label: '판매 종료일시', type: 'slot', name: 'saleEnd',
        hint: 'NULL=무기한' },
    ];
    // 상세설정 통합 (광고 노출 기간 + 구매 제한) — cols=3 한 행 3필드 채움
    columns.detailForm = [
      // 1행: 광고 시작 / 광고 종료 / 최소구매수량
      { key: 'advrtStartDate', label: '광고 노출 시작', type: 'slot', name: 'advrtStart' },
      { key: 'advrtEndDate',   label: '광고 노출 종료', type: 'slot', name: 'advrtEnd' },
      { key: 'minBuyQty',      label: '최소구매수량 (min_buy_qty)', type: 'number', min: 1, placeholder: '1' },
      // 2행: 1회 최대 / 1일 최대 / ID당 누적 최대
      { key: 'maxBuyQty',      label: '1회 최대구매수량 (max_buy_qty)', type: 'number', min: 1, placeholder: '무제한' },
      { key: 'dayMaxBuyQty',   label: '1일 최대구매수량 (day_max_buy_qty)', type: 'number', min: 1, placeholder: '무제한' },
      { key: 'idMaxBuyQty',    label: 'ID당 누적 최대 (id_max_buy_qty)', type: 'number', min: 1, placeholder: '무제한' },
    ];
    // 기본 가격 (3 rows: 정가/판매가, 매입가/마진율, 플랫폼수수료율/금액)
    columns.basePriceForm = [
      { key: 'listPrice',         label: '정가 (list_price)', type: 'number', required: true, min: 0, placeholder: '0' },
      { key: 'salePrice',         label: '판매가 (sale_price)', type: 'number', required: true, min: 0, placeholder: '0' },
      { key: 'purchasePrice',     label: '매입가 / 원가 (purchase_price)', type: 'number', placeholder: '(선택)',
        hint: '내부관리용' },
      { key: '_marginRate',       label: '마진율 (margin_rate)', type: 'slot', name: 'marginRate' },
      { key: 'platformFeeRate',   label: '플랫폼수수료 율 (platform_fee_rate)', type: 'number',
        placeholder: '(예: 5.5)', hint: '% — 내부관리용' },
      { key: 'platformFeeAmount', label: '플랫폼수수료 금액 (platform_fee_amount)', type: 'number', min: 0,
        placeholder: '(요율과 둘 중 하나만 입력)', hint: '원 — 내부관리용' },
    ];
    // (광고 노출 기간 / 구매 제한은 detailFormColumns 로 통합됨 — 위 정의 참조)
    // 단일 재고 (옵션 미사용)
    columns.singleStockForm = [
      { key: 'prodStock', label: '재고수량 (prod_stock)', type: 'number',
        placeholder: '0', min: 0, width: '160px' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns, handleBtnAction, handleSelectAction, fnCallbackModal,                   // dispatch + 모달 통합 콜백
      cfIsNew, cfHasProdId, cfSaveDisabled, showTab, topTab, cfDtlMode, tabMode2, tabs, form, errors, handleSave, onPreview, codeGrpModal, openCodeGrpModal,
      tabPage, tabData, cfTabPageList, onTabPageChange, cfTabTotalPages, fnTabPageNos,
      uiState, cfMdUserList, cfMdUserListFiltered, cfMdSelectedNm, openMdModal, selectMdUser, mdSearchTypeRef, prodPickerSearchType,
      clearOpt, optGroups, skus, cfTotalStock, generateSkus, moveSku,
      cfSkuFilter1Options, cfSkuFilter2Options, cfSkusFiltered,
      cfOptTypeAllCodes, cfOptTypeLevel1Codes, cfOptTypeCodes, cfOptInputTypeCodes, getOptValCodes,
      onCategoryChange, addOptGroup, removeOptGroup, addOptItem, removeOptItem,
      onOptItemDragStart, onOptItemDragOver, onOptItemDrop,
      images, addImageByUrl, onFileChange, setMain, removeImage, fileInputRef, triggerFileInput, fnOptItem2Label,
      onImgDragStart, onImgDragOver, onImgDrop,
      prodCategories, cfCatExcludeSet, catPickerOpen, addCategory, removeCategory,
      onCatDragStart, onCatDragOver, onCatDrop,
      relProds, codeProds, cfProdPickerList, prodPickerOpen, openProdPicker, selectProdItem, fnProdPickerCallback,
      removeRelProd, removeCodeProd,
      onRelDragStart, onRelDragOver, onRelDrop,
      onCodeDragStart, onCodeDragOver, onCodeDrop,
      salePlans, cfPlanVisible, cfPlanAllChecked, addPlanRow, onPlanChange, deletePlanChecked, planRowStyle,
      cfMarginRateCalc, cfDiscountRate, cfPlatformFee, cfPlatformFeeDisp, cfNetRevenueDisp,
      contentBlocks, addContentBlock, removeContentBlock, onBlockFileChange,
      onBlockDragStart, onBlockDragOver, onBlockDrop,
      contentSplitRef, onDividerMousedown,
      prodOptCategoryTypeCd, openHelp,
      safeFirst, safeGet, safeFind, safeFilter,
      grpCodes,
      fnNoCursor, fnMdRowStyle, fnRemainSkuRowStyle,
      fnPlanRowChecked, onPlanToggleCheck, onPlanToggleCheckAll, fnPlanRowStyle2,
      dtlId: Vue.computed(() => props.dtlId),
      };
  },
  template: /* html */`
<!-- ===== ■. 상세 카드 (제목 + 탭바 + 탭컨텐츠를 한 영역으로) ===================== -->
<bo-container :title="!active ? '상품 상세' : (cfIsNew ? '상품 등록' : (cfDtlMode ? '상품 상세' : '상품 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : form.prodId)">
  <template #toolbar-actions>
    <button v-if="active && !cfIsNew" class="btn btn-sm" style="background:#fff;border:1px solid #d9d9d9;color:#555;font-weight:500;"
      title="사용자 페이스에서 상품 상세 미리보기" @click="handleBtnAction('form-preview')">
      👁 미리보기
    </button>
  </template>
  <!-- ===== ■.■. 탭바 ==================================================== -->
  <bo-tab-bar :tabs="tabs" :tab="topTab" :tab-mode="tabMode2"
    @tab-select="id => handleBtnAction('tab-select', id)"
    @mode-select="m => handleBtnAction('tab-mode', m)" />
  <!-- ===== □. 탭바 ====================================================== -->
  <!-- ===== ■. 탭 컨텐츠 =================================================== -->
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">
    <!-- ══════════════════════════════════════
     📋 기본정보  (pd_prod 주요 필드)
══════════════════════════════════════ -->
    <div class="dtl-pane" v-show="showTab('info')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📋 기본정보</div>
      <!-- 보기모드: fieldset disabled 로 슬롯(카테고리/MD/날짜픽커/select)·체크박스 자동 비활성. 모달은 teleport 로 fieldset 밖이라 영향 없음 -->
      <fieldset :disabled="cfDtlMode" style="border:none;padding:0;margin:0;min-width:0;">
      <!-- ===== ■.■.■. 기본정보 통합 폼 (BoFormArea 자동 렌더, cols=3 한 줄 3필드) ======== -->
      <bo-form-area :columns="columns.infoForm" :form="form" :errors="errors"
        :readonly="cfDtlMode" :cols="3" compact :show-actions="false">
        <template #categories>
          <div style="border:1px solid #e2e8f0;border-radius:6px;background:#fff;min-height:38px;padding:4px 6px;">
            <div v-if="prodCategories.length===0" style="color:#aaa;font-size:12px;padding:4px 2px;">카테고리를 추가해주세요</div>
            <div v-for="(cat,idx) in prodCategories" :key="cat?.categoryId"
              draggable="true" @dragstart="onCatDragStart(idx)" @dragover.prevent="onCatDragOver(idx)" @drop.prevent="onCatDrop()"
              :style="catDragoverIdx===idx?'opacity:0.5;':''"
              style="display:flex;align-items:center;gap:4px;padding:2px 0;">
              <span style="cursor:grab;color:#bbb;font-size:14px;flex-shrink:0;">≡</span>
              <span v-if="idx===0" style="font-size:10px;background:#f9a8d4;color:#9d174d;padding:1px 5px;border-radius:10px;flex-shrink:0;">
                대표
              </span>
              <span style="font-size:12px;color:#64748b;flex-shrink:0;">
                <span v-if="cat.depth>=1" style="font-size:10px;">{{ ['','대','중','소'][cat.depth]||cat.depth }}▸</span>
              </span>
              <span style="font-size:13px;flex:1;">{{ cat.categoryNm }}</span>
              <button type="button" @click="removeCategory(idx)" style="border:none;background:none;color:#f87171;font-size:13px;padding:0 2px;flex-shrink:0;">
                ✕
              </button>
            </div>
            <button type="button" @click="catPickerOpen=true"
              style="margin-top:4px;font-size:12px;color:#6366f1;border:1px dashed #a5b4fc;background:none;border-radius:4px;padding:2px 8px;width:100%;">
              + 카테고리 추가
            </button>
          </div>
        </template>
        <template #brand>
          <select class="form-control" v-model="form.brandId">
            <option value="">-- 선택 --</option>
            <option v-for="b in ([]||[])" :key="b.brandId||b.id" :value="b.brandId||b.id">{{ b.brandNm||b.name }}</option>
          </select>
        </template>
        <template #vendor>
          <select class="form-control" v-model="form.vendorId">
            <option value="">-- 선택 --</option>
            <option v-for="v in ([]||[])" :key="v.vendorId||v.id" :value="v.vendorId||v.id">{{ v.vendorNm||v.name }}</option>
          </select>
        </template>
        <template #mdUser>
          <div style="display:flex;gap:6px;align-items:flex-end;">
            <input class="form-control" :value="cfMdSelectedNm||''" readonly placeholder="담당MD를 선택해주세요"
              style="flex:1;background:#fafafa;" @click="openMdModal" />
            <button class="btn btn-secondary btn-sm" type="button" @click="openMdModal" style="flex-shrink:0;">선택</button>
            <button v-if="form.mdUserId" type="button" title="선택 해제" @click="form.mdUserId=''"
              style="background:none;border:none;padding:0 2px 2px;margin-left:-4px;color:#999;cursor:pointer;font-size:13px;line-height:1;flex-shrink:0;">
              x
            </button>
          </div>
        </template>
        <template #dlivTmplt>
          <select class="form-control" v-model="form.dlivTmpltId">
            <option value="">-- 선택 --</option>
            <option v-for="t in ([]||[])" :key="t?.dlivTmpltId" :value="t.dlivTmpltId">{{ t.dlivTmpltNm }}</option>
          </select>
        </template>
        <template #saleStart>
          <bo-date-time-picker v-model="form.saleStartDate" placeholder-date="즉시" />
        </template>
        <template #saleEnd>
          <bo-date-time-picker v-model="form.saleEndDate" placeholder-date="무기한" />
        </template>
      </bo-form-area>
      <!-- ===== ■.■.■. 카테고리 피커 모달 ========================================== -->
      <bo-category-tree mode="picker" :show="catPickerOpen" :exclude-ids="cfCatExcludeSet" modal-name="category-pick" :on-callback="fnCallbackModal" />
      <!-- ===== ■.■.■. 담당MD 선택 모달 ========================================== -->
      <teleport to="body">
        <div v-if="mdModalOpen"
          style="position:fixed;inset:0;background:rgba(10,20,40,0.45);backdrop-filter:blur(2px);z-index:9000;display:flex;align-items:center;justify-content:center;"
          @click.self="mdModalOpen=false">
          <div class="modal-box" style="width:480px;max-height:560px;display:flex;flex-direction:column;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.18);">
            <!-- ===== ■.■.■.■.■.■. 헤더 ============================================ -->
            <div class="tree-modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;flex-shrink:0;">
              <span style="font-size:15px;font-weight:700;">담당MD 선택</span>
              <button @click="mdModalOpen=false" style="background:none;border:none;font-size:20px;color:#888;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;" class="modal-close-btn">
                ✕
              </button>
            </div>
            <!-- ===== ■.■.■.■.■.■. 검색 ============================================ -->
            <div style="padding:12px 20px;flex-shrink:0;border-bottom:1px solid #f0f0f0;">
              <bo-multi-check-select
                v-model="uiState.mdSearchType"
                :options="[
                { value: 'userNm', label: '이름' },
                { value: 'deptId', label: '부서' },
                { value: 'roleId', label: '역할' },
                ]"
                placeholder="검색대상 전체"
                all-label="전체 선택"
                min-width="160px" />
              <input class="form-control" v-model="uiState.mdSearch" placeholder="검색어 입력" autofocus style="font-size:13px;margin-top:6px;" />
            </div>
            <!-- ===== ■.■.■.■.■.■. 목록 ============================================ -->
            <div style="overflow-y:auto;flex:1;padding:8px 12px;">
              <!-- ===== ■.■.■.■.■.■.■. 목록 영역 ======================================= -->
              <bo-grid bare :columns="columns.mdUserGrid" :rows="cfMdUserListFiltered" row-key="userId" :selected-key="form.mdUserId"
                :row-style="fnMdRowStyle" empty-text="검색 결과가 없습니다." @cell-click="e => selectMdUser(e.row)"></bo-grid>
            </div>
            <!-- ===== ■.■.■.■.■.■. 푸터 ============================================ -->
            <div style="padding:12px 20px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;">
              <button class="btn btn-secondary btn-sm" @click="mdModalOpen=false">닫기</button>
            </div>
          </div>
        </div>
      </teleport>
      <!-- ===== ■.■.■. 체크박스 그룹 (세로 슬림) ===================================== -->
      <div style="display:flex;flex-wrap:wrap;gap:16px;padding:7px 12px;background:#f9f9f9;border-radius:8px;border:1px solid #eee;margin-bottom:10px;">
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;">
          <input type="checkbox" :checked="form.isNew==='Y'" @change="form.isNew=$event.target.checked?'Y':'N'" />
          신상품
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;">
          <input type="checkbox" :checked="form.isBest==='Y'" @change="form.isBest=$event.target.checked?'Y':'N'" />
          베스트
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;">
          <input type="checkbox" :checked="form.adltYn==='Y'" @change="form.adltYn=$event.target.checked?'Y':'N'" />
          성인상품
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;">
          <input type="checkbox" :checked="form.sameDayDlivYn==='Y'" @change="form.sameDayDlivYn=$event.target.checked?'Y':'N'" />
          당일배송
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;">
          <input type="checkbox" :checked="form.soldOutYn==='Y'" @change="form.soldOutYn=$event.target.checked?'Y':'N'" style="accent-color:#e8587a;" />
          <span style="color:#e8587a;">강제품절</span>
        </label>
      </div>
      </fieldset>
      <div class="form-actions" v-if="cfDtlMode && active">
        <button class="btn btn_edit" @click="handleBtnAction('form-edit')">수정</button>
        <button class="btn btn_close" @click="handleBtnAction('form-close')">닫기</button>
      </div>
      <div class="form-actions" v-if="!cfDtlMode && active">
        <button class="btn btn_save" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 상품을 등록해주세요.' : ''" @click="handleBtnAction('form-save')">
          저장
        </button>
        <button class="btn btn_cancel" @click="handleBtnAction('form-cancel')">취소</button>
      </div>
    </div>
    <!-- ══════════════════════════════════════
     ⚙ 옵션설정  (pd_prod_opt / pd_prod_opt_item / pd_prod_sku)
══════════════════════════════════════ -->
    <div class="dtl-pane" v-show="showTab('option')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">⚙ 옵션설정</div>
      <!-- 보기모드: fieldset disabled 로 모든 입력/버튼/select 자동 비활성 (편집 잠금) -->
      <fieldset :disabled="cfDtlMode" style="border:none;padding:0;margin:0;min-width:0;">
      <!-- ===== ■.■.■. 옵션 사용 토글 + PROD_OPT_CATEGORY 3단 트리 선택 =============== -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;padding:12px 14px;background:#f9f9f9;border-radius:8px;border:1px solid #eee;">
        <!-- ===== ■.■.■.■. 옵션 사용 체크박스 (disabled — 옵션 카테고리 선택 시 자동 체크) ======== -->
        <label style="display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;flex-shrink:0;cursor:default;">
          <input type="checkbox" :checked="!!prodOptCategoryTypeCd" disabled style="width:16px;height:16px;cursor:not-allowed;opacity:0.6;" />
          옵션 사용
        </label>
        <!-- ===== ■.■.■.■. 도움말 아이콘 =========================================== -->
        <span @click="openHelp('prodOpt')"
          style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#1677ff;color:#fff;font-size:11px;font-weight:700;user-select:none;flex-shrink:0;"
          title="옵션설정 도움말">
          ?
        </span>
        <span style="font-size:11px;color:#ddd;flex-shrink:0;">│</span>
        <!-- ===== ■.■.■.■. STEP 1: PROD_OPT_CATEGORY level=1 (옵션 카테고리) 선택 ===== -->
        <div style="display:flex;align-items:flex-start;gap:6px;">
          <div style="display:flex;flex-direction:column;gap:2px;align-items:flex-start;flex-shrink:0;margin-top:6px;">
            <span style="font-size:12px;color:#555;font-weight:600;">옵션 카테고리</span>
            <code style="font-size:10px;color:#6a1b9a;background:#f3e5f5;padding:1px 4px;border-radius:3px;font-family:monospace;border:1px solid #e1bee7;">
              PROD_OPT_CATEGORY
            </code>
          </div>
          <div style="display:flex;flex-direction:column;gap:2px;">
            <select class="form-control" v-model="prodOptCategoryTypeCd"
              style="width:170px;font-size:12px;"
              @change="onCategoryChange">
              <option value="">-- 옵션 카테고리 선택 --</option>
              <option v-for="c in cfOptTypeLevel1Codes" :key="c?.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
            </select>
            <code v-if="prodOptCategoryTypeCd" style="font-size:10px;color:#1565c0;background:#f5f5f7;padding:1px 4px;border-radius:3px;font-family:monospace;align-self:flex-start;">
              {{ prodOptCategoryTypeCd }}
            </code>
          </div>
          <button type="button" class="btn btn-xs"
            style="background:#fff;border:1px solid #d9d9d9;color:#555;font-size:13px;padding:2px 8px;margin-top:4px;"
            title="옵션 카테고리 공통코드 미리보기 (PROD_OPT_CATEGORY)"
            @click="openCodeGrpModal('PROD_OPT_CATEGORY', '옵션 카테고리 공통코드')">
            📋
          </button>
        </div>
        <!-- ===== ■.■.■.■. STEP 2: 옵션 차원별 유형 선택 — 1레벨 선택 후 활성화 =============== -->
        <template v-if="prodOptCategoryTypeCd && optGroups.length>0">
          <span style="font-size:11px;color:#ddd;flex-shrink:0;">│</span>
          <div v-for="(grp, gi) in optGroups" :key="'typeCd-'+grp._id"
            style="display:flex;align-items:flex-start;gap:6px;">
            <span class="badge badge-blue" style="font-size:11px;flex-shrink:0;margin-top:4px;">{{ gi+1 }}단 유형</span>
            <div style="display:flex;flex-direction:column;gap:2px;">
              <select class="form-control" v-model="grp.typeCd" style="width:140px;font-size:12px;"
                @change="grp.items.forEach(i=>{i.val='';i.valCodeId='';i.optStyle='';})"
                >
                <option value="">-- 유형선택 --</option>
                <option v-for="c in cfOptTypeCodes" :key="c?.codeId" :value="c.codeValue">{{ c.codeLabel }}</option>
              </select>
              <code v-if="grp.typeCd" style="font-size:10px;color:#1565c0;background:#f5f5f7;padding:1px 4px;border-radius:3px;font-family:monospace;align-self:flex-start;">
                {{ grp.typeCd }}
              </code>
            </div>
            <span v-if="grp.typeCd" style="font-size:11px;color:#1677ff;margin-top:6px;">{{ getOptValCodes(grp.typeCd).length }}개 프리셋</span>
          </div>
        </template>
        <span v-if="!prodOptCategoryTypeCd" style="font-size:12px;color:#f5a623;">← 옵션 카테고리를 먼저 선택하세요</span>
        <span v-else-if="optGroups.length===0" style="font-size:12px;color:#1677ff;">카테고리 선택 후 + 차원 추가로 1단·2단 설정</span>
      </div>
      <!-- ===== ■.■.■. 옵션 미사용 안내 =========================================== -->
      <template v-if="!prodOptCategoryTypeCd">
        <div style="padding:10px 14px;background:#f9f0ff;border-radius:8px;border:1px solid #d3adf7;font-size:12px;color:#531dab;margin-bottom:8px;">
          💡 옵션 카테고리를 선택하면 옵션 설정이 활성화됩니다.
        </div>
      </template>
      <!-- ===== ■.■.■. 옵션 사용 =============================================== -->
      <template v-else>
        <!-- ===== ■.■.■.■. 옵션 차원 헤더 ========================================== -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div style="font-size:13px;font-weight:700;">
            옵션 차원
            <span style="color:#888;font-weight:400;font-size:11px;">(pd_prod_opt, 최대 2단)</span>
          </div>
          <button class="btn btn-sm btn-secondary" @click="addOptGroup" :disabled="optGroups.length>=2">+ 차원 추가</button>
        </div>
        <!-- ===== ■.■.■.■. 차원별 블록 ============================================ -->
        <div v-for="(grp, gi) in optGroups" :key="grp?._id"
          style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;margin-bottom:16px;background:#fafafa;">
          <!-- ===== ■.■.■.■.■. 차원 설정 행 (typeCd는 위 "옵션사용" 행에서 관리) =============== -->
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
            <span class="badge badge-blue" style="flex-shrink:0;font-size:12px;">{{ grp.level }}단</span>
            <span v-if="grp.typeCd" class="badge badge-gray" style="font-size:11px;flex-shrink:0;">
              {{ safeFind(cfOptTypeAllCodes, c=>c.codeValue===grp.typeCd)?.codeLabel||grp.typeCd }}
            </span>
            <input class="form-control" v-model="grp.grpNm" placeholder="옵션명 (예: 색상)"
              style="flex:1;min-width:100px;font-size:13px;" />
            <select class="form-control" v-model="grp.inputTypeCd" style="width:160px;font-size:12px;">
              <option v-for="c in cfOptInputTypeCodes" :key="c?.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
            </select>
            <button class="btn btn-xs btn-danger" @click="removeOptGroup(gi)">삭제</button>
          </div>
          <!-- ===== ■.■.■.■.■. 옵션 값 테이블 (pd_prod_opt_item) ===================== -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <div style="font-size:11px;color:#888;">
              옵션 값 목록 (pd_prod_opt_item)
              <span v-if="grp.typeCd && getOptValCodes(grp.typeCd).length>0" style="color:#1677ff;margin-left:6px;">
                공통코드 opt_val:
                <strong>{{ getOptValCodes(grp.typeCd).length }}</strong>
                개 프리셋 사용 가능
              </span>
              <span v-else-if="grp.typeCd==='CUSTOM'||!grp.typeCd" style="color:#888;margin-left:6px;">직접 입력 모드 — 프리셋 없음</span>
            </div>
            <button class="btn btn-xs btn-secondary" @click="addOptItem(grp)" style="flex-shrink:0;">+ 값 추가</button>
          </div>
          <!-- ===== ■.■.■.■.■. 옵션 값 스크롤 컨테이너 — 1단=5행, 2단=10행 정도 보이고 그 이상은 세로 스크롤 ===== -->
          <div :style="'max-height:'+(grp.level===1?'200px':'340px')+';overflow-y:auto;border:1px solid #f0f0f0;border-radius:6px;margin-bottom:6px;background:#fff;'">
            <!-- ===== ■.■.■.■.■.■. 테이블 =========================================== -->
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <thead style="position:sticky;top:0;background:#f5f5f5;z-index:1;">
                <tr style="background:#f5f5f5;border-bottom:1px solid #e0e0e0;">
                  <th style="width:18px;padding:4px 2px;"></th>
                  <th style="width:24px;padding:4px 4px;text-align:center;font-weight:600;color:#888;font-size:11px;">#</th>
                  <th v-if="grp.level===2 && safeFirst(optGroups)?.items.length>0" style="width:110px;padding:4px 6px;text-align:left;font-weight:600;color:#555;font-size:11px;">
                    상위옵션값
                  </th>
                  <th style="padding:4px 6px;text-align:left;font-weight:600;color:#555;font-size:11px;">표시명 (opt_nm)</th>
                  <th style="width:234px;padding:4px 6px;text-align:left;font-weight:600;color:#555;font-size:11px;">저장값 (opt_val)</th>
                  <th style="width:170px;padding:4px 6px;text-align:left;font-weight:600;color:#555;font-size:11px;">스타일 (opt_style)</th>
                  <th style="width:221px;padding:4px 6px;text-align:left;font-weight:600;color:#555;font-size:11px;">
                    공통코드ID (opt_val_code_id)
                  </th>
                  <th style="width:36px;padding:4px 4px;text-align:center;font-weight:600;color:#555;font-size:11px;">사용</th>
                  <th style="width:30px;padding:4px 4px;text-align:center;"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, ii) in grp.items" :key="item?._id" draggable="true" @dragstart="onOptItemDragStart(grp, ii)" @dragover.prevent="onOptItemDragOver(grp, ii)" @drop.prevent="onOptItemDrop(grp)" @dragend="dragOptGrpId=null;dragOptItemIdx=null;dragoverOptItemIdx=null" style="border-bottom:1px solid #f0f0f0;transition:background 0.1s;" :style="dragOptGrpId===grp._id && dragoverOptItemIdx===ii && dragOptItemIdx!==ii ? 'background:#dbeafe;' : (ii%2===1 ? 'background:#fafafa;' : '')">
                  <!-- ===== ■.■.■.■.■.■.■.■.■. 햄버거 핸들 ================================== -->
                  <td style="padding:2px 2px;text-align:center;cursor:grab;color:#ccc;font-size:14px;user-select:none;letter-spacing:-2px;" title="드래그로 순서 변경">
                    ≡
                  </td>
                  <td style="padding:2px 4px;text-align:center;color:#bbb;font-size:11px;">{{ ii+1 }}</td>
                  <!-- ===== ■.■.■.■.■.■.■.■.■. 2단: 상위 옵션값 ============================== -->
                  <td v-if="grp.level===2 && safeFirst(optGroups)?.items.length>0" style="padding:2px 4px;">
                    <select v-model="item.parentOptItemId"
                      style="width:100%;font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;height:24px;">
                      <option value="">전체 공통</option>
                      <option v-for="p1 in (optGroups[0]?.items||[])" :key="p1?._id" :value="String(p1._id)">{{ p1.nm||'(미입력)' }}</option>
                    </select>
                  </td>
                  <!-- ===== ■.■.■.■.■.■.■.■.■. 표시명 ===================================== -->
                  <td style="padding:2px 4px;">
                    <input v-model="item.nm" placeholder="예: 블랙"
                      style="width:100%;font-size:12px;border:1px solid #ddd;border-radius:4px;padding:2px 6px;height:24px;"
                      @blur="generateSkus" />
                  </td>
                  <!-- ===== ■.■.■.■.■.■.■.■.■. 저장값 ===================================== -->
                  <td style="padding:2px 4px;">
                    <input v-model="item.val"
                      :placeholder="item.valCodeId ? '자동입력' : 'MY_VAL'"
                      style="width:100%;font-size:12px;border:1px solid #ddd;border-radius:4px;padding:2px 6px;height:24px;"
                      @blur="generateSkus" />
                  </td>
                  <!-- ===== ■.■.■.■.■.■.■.■.■. 스타일 (opt_style = 컬러 hex / 아이콘 클래스 등) ===== -->
                  <td style="padding:2px 4px;">
                    <div style="display:flex;gap:4px;align-items:center;">
                      <span v-if="item.optStyle && item.optStyle.startsWith('#')" :style="'flex-shrink:0;width:18px;height:18px;border-radius:3px;border:1px solid #ddd;background:'+item.optStyle+';'"></span>
                      <input v-model="item.optStyle"
                        placeholder="#000000 / fa-icon"
                        style="flex:1;min-width:0;font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 6px;height:24px;font-family:monospace;" />
                    </div>
                  </td>
                  <!-- ===== ■.■.■.■.■.■.■.■.■. 공통코드ID (opt_val_code_id = sy_code.code_id) ===== -->
                  <td style="padding:2px 4px;">
                    <select v-model="item.valCodeId"
                      style="width:100%;font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;height:24px;"
                      @change="() => { const found = getOptValCodes(grp.typeCd).find(c => c.codeId === item.valCodeId); if (found) { item.val = found.codeValue; if (!item.nm) item.nm = found.codeLabel; if (found.codeOpt1) item.optStyle = found.codeOpt1; generateSkus(); } else { item.val = ''; } }">
                      <option value="">-- 직접입력 --</option>
                      <option v-for="c in getOptValCodes(grp.typeCd)" :key="c?.codeId" :value="c.codeId">
                        {{ c.codeLabel }} ({{ c.codeValue }})
                      </option>
                    </select>
                  </td>
                  <td style="padding:2px 4px;text-align:center;">
                    <input type="checkbox" :checked="item.useYn==='Y'"
                      @change="item.useYn=$event.target.checked?'Y':'N'; generateSkus()"
                      style="width:14px;height:14px;" />
                  </td>
                  <td style="padding:2px 4px;text-align:center;">
                    <button style="background:#ff4d4f;color:#fff;border:none;border-radius:3px;width:20px;height:20px;font-size:11px;line-height:1;padding:0;"
                      @click="removeOptItem(grp, ii)">
                      ✕
                    </button>
                  </td>
                </tr>
                <tr v-if="grp.items.length===0">
                  <td :colspan="grp.level===2&&safeFirst(optGroups)?.items.length>0?9:8" style="text-align:center;color:#bbb;padding:10px;font-size:12px;border-bottom:1px solid #f0f0f0;">
                    값을 추가해주세요.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- ===== ■.■.■.■.■. /옵션 값 스크롤 컨테이너 ================================== -->
        </div>
      </template>
      <div style="padding:10px 14px;background:#e6f4ff;border-radius:8px;border:1px solid #bae0ff;font-size:12px;color:#0958d9;margin-top:8px;">
        💡 SKU별 가격·재고는
        <strong>💰 옵션(가격/재고)</strong>
        탭에서 관리합니다.
      </div>
      </fieldset>
      <div class="form-actions" v-if="cfDtlMode && active">
        <button class="btn btn_edit" @click="handleBtnAction('form-edit')">수정</button>
        <button class="btn btn_close" @click="handleBtnAction('form-close')">닫기</button>
      </div>
      <div class="form-actions" v-if="!cfDtlMode && active">
        <button class="btn btn_save" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 상품을 등록해주세요.' : ''" @click="handleBtnAction('form-save')">
          저장
        </button>
        <button class="btn btn_cancel" @click="handleBtnAction('form-cancel')">취소</button>
      </div>
    </div>
    <!-- ══════════════════════════════════════
     📄 상품설명  (contentBlocks — 첨부/URL/HTML 블록)
══════════════════════════════════════ -->
    <div class="dtl-pane" v-show="showTab('content')" style="margin:0;padding:0;overflow:hidden;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title" style="padding:14px 20px;">📄 상품설명</div>
      <!-- ===== ■.■.■. 상단 툴바: 블록 추가 버튼 (수정모드 전용) ========================= -->
      <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafafa;flex-wrap:wrap;">
        <span style="font-size:13px;font-weight:700;color:#333;margin-right:4px;">상품설명 블록</span>
        <button v-if="!cfDtlMode" class="btn btn-secondary btn-sm" @click="addContentBlock('file')">+ 첨부 이미지</button>
        <button v-if="!cfDtlMode" class="btn btn-secondary btn-sm" @click="addContentBlock('url')">+ URL 이미지</button>
        <button v-if="!cfDtlMode" class="btn btn-secondary btn-sm" @click="addContentBlock('html')">+ HTML 에디터</button>
        <span style="font-size:12px;color:#aaa;margin-left:4px;">{{ contentBlocks.length }}개 블록<span v-if="!cfDtlMode"> · 좌측 ≡ 드래그로 순서 변경</span></span>
      </div>
      <!-- ===== ■.■.■. 스플릿 패널 (편집 좌 + 미리보기 우) ============================== -->
      <div ref="contentSplitRef" style="display:flex;height:520px;overflow:hidden;">
        <!-- ===== ■.■.■.■. 좌: 블록 편집 영역 ======================================= -->
        <div :style="{ width: splitPct + '%', overflowY: 'auto', padding: '12px 14px', flexShrink: 0 }">
          <div v-if="contentBlocks.length === 0"
            style="border:2px dashed #e0e0e0;border-radius:10px;padding:40px 20px;text-align:center;color:#bbb;font-size:13px;">
            위 버튼으로 블록을 추가해주세요.
          </div>
          <!-- ===== ■.■.■.■.■. 블록 리스트 ========================================== -->
          <div v-for="(block, bi) in contentBlocks" :key="block?._id" :draggable="!cfDtlMode" @dragstart="cfDtlMode ? null : onBlockDragStart(bi)" @dragover.prevent="cfDtlMode ? null : onBlockDragOver(bi)" @drop.prevent="cfDtlMode ? null : onBlockDrop()" @dragend="dragBlockIdx=null;dragoverBlockIdx=null" style="border:1px solid #e8e8e8;border-radius:10px;margin-bottom:10px;background:#fff;transition:border-color 0.15s,background 0.15s;overflow:hidden;" :style="dragoverBlockIdx===bi && dragBlockIdx!==bi ? 'border-color:#1677ff;background:#e6f4ff;' : ''">
            <!-- ===== ■.■.■.■.■.■. 블록 헤더 ========================================= -->
            <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f9f9f9;border-bottom:1px solid #f0f0f0;">
              <!-- ===== ■.■.■.■.■.■.■. 햄버거 핸들 (수정모드 전용) ========================= -->
              <span v-if="!cfDtlMode" style="cursor:grab;color:#ccc;font-size:16px;user-select:none;letter-spacing:-2px;flex-shrink:0;" title="드래그로 순서 변경">
                ≡
              </span>
              <span class="badge" :class="block.type==='file'?'badge-green':block.type==='url'?'badge-blue':'badge-orange'" style="font-size:11px;flex-shrink:0;">
                {{ block.type==='file' ? '📎 첨부' : block.type==='url' ? '🔗 URL' : '✏ HTML' }}
              </span>
              <span style="font-size:12px;color:#888;flex:1;">블록 {{ bi+1 }}</span>
              <button v-if="!cfDtlMode" class="btn btn-xs btn-danger" @click="removeContentBlock(bi)" title="삭제">✕</button>
            </div>
            <!-- ===== ■.■.■.■.■.■. 첨부 방식 ========================================= -->
            <div v-if="block.type==='file'" style="padding:12px;">
              <div v-if="block.content" style="margin-bottom:8px;">
                <img :src="block.content" style="max-width:100%;max-height:200px;border-radius:6px;border:1px solid #e0e0e0;" />
                <div style="font-size:11px;color:#888;margin-top:4px;">{{ block.fileName }}</div>
              </div>
              <label v-if="!cfDtlMode" class="btn btn-secondary btn-sm" style="display:inline-block;">
                📎 파일 선택
                <input type="file" accept="image/*" style="display:none;" @change="onBlockFileChange(block, $event)" />
              </label>
              <button v-if="!cfDtlMode && block.content" class="btn btn-xs btn-danger" @click="block.content='';block.fileName=''" style="margin-left:6px;">
                삭제
              </button>
              <span v-if="cfDtlMode && !block.content" style="font-size:12px;color:#bbb;">이미지 없음</span>
            </div>
            <!-- ===== ■.■.■.■.■.■. URL 방식 ======================================== -->
            <div v-else-if="block.type==='url'" style="padding:12px;">
              <input v-if="!cfDtlMode" class="form-control" v-model="block.content" placeholder="이미지 URL (https://...)" style="font-size:13px;margin-bottom:8px;" />
              <div v-if="block.content" style="margin-top:4px;">
                <img :src="block.content" style="max-width:100%;max-height:200px;border-radius:6px;border:1px solid #e0e0e0;"
                  @error="$event.target.style.display='none'" @load="$event.target.style.display=''" />
              </div>
              <span v-else-if="cfDtlMode" style="font-size:12px;color:#bbb;">이미지 없음</span>
            </div>
            <!-- ===== ■.■.■.■.■.■. HTML 에디터 방식 (Toast UI) — 보기모드는 렌더만 ========= -->
            <div v-else-if="block.type==='html'" style="padding:12px;">
              <div v-if="cfDtlMode" class="form-control" style="min-height:120px;line-height:1.6;overflow:auto;" v-html="block.content || '<span style=color:#bbb>-</span>'"></div>
              <base-html-editor v-else v-model="block.content" height="240px" />
            </div>
          </div>
        </div>
        <!-- ===== ■.■.■.■. 드래그 구분선 =========================================== -->
        <div @mousedown="onDividerMousedown"
          style="width:5px;flex-shrink:0;background:#e8e8e8;cursor:col-resize;transition:background 0.15s;position:relative;z-index:1;"
          :style="isDraggingDivider ? 'background:#1677ff;' : ''"
          title="드래그로 좌우 너비 조절">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#ccc;font-size:11px;writing-mode:vertical-rl;user-select:none;">
            ⋮
          </div>
        </div>
        <!-- ===== ■.■.■.■. 우: 미리보기 영역 ======================================== -->
        <div :style="{ width: (100 - splitPct) + '%', flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #f0f0f0' }">
          <!-- ===== ■.■.■.■.■. 디바이스 탭 ========================================== -->
          <div style="display:flex;align-items:center;gap:4px;padding:8px 12px;border-bottom:1px solid #f0f0f0;background:#fafafa;flex-shrink:0;">
            <span style="font-size:11px;color:#aaa;margin-right:4px;">미리보기</span>
            <button class="btn btn-xs" :class="previewDevice==='pc'?'btn-primary':'btn-secondary'" @click="previewDevice='pc'" style="font-size:11px;padding:2px 8px;">
              🖥 PC
            </button>
            <button class="btn btn-xs" :class="previewDevice==='tablet'?'btn-primary':'btn-secondary'" @click="previewDevice='tablet'" style="font-size:11px;padding:2px 8px;">
              📱 태블릿
            </button>
            <button class="btn btn-xs" :class="previewDevice==='mobile'?'btn-primary':'btn-secondary'" @click="previewDevice='mobile'" style="font-size:11px;padding:2px 8px;">
              📲 모바일
            </button>
          </div>
          <!-- ===== ■.■.■.■.■. 미리보기 뷰 ========================================== -->
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
              <div v-if="contentBlocks.length===0" style="color:#bbb;text-align:center;padding:40px;font-size:13px;">
                블록을 추가하면 여기에 미리보기가 표시됩니다.
              </div>
              <template v-for="block in contentBlocks" :key="block?._id">
                <div v-if="block.type==='file'||block.type==='url'" style="margin-bottom:12px;">
                  <img v-if="block.content" :src="block.content" style="max-width:100%;height:auto;display:block;border-radius:4px;" />
                </div>
                <div v-else-if="block.type==='html'" style="margin-bottom:12px;" v-html="block.content||''"></div>
              </template>
            </div>
          </div>
        </div>
      </div>
      <div class="form-actions" v-if="cfDtlMode && active" style="padding:8px 16px;border-top:1px solid #f0f0f0;">
        <button class="btn btn_edit" @click="handleBtnAction('form-edit')">수정</button>
        <button class="btn btn_close" @click="handleBtnAction('form-close')">닫기</button>
      </div>
      <div class="form-actions" v-if="!cfDtlMode && active" style="padding:8px 16px;border-top:1px solid #f0f0f0;">
        <button class="btn btn_save" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 상품을 등록해주세요.' : ''" @click="handleBtnAction('form-save')">
          저장
        </button>
        <button class="btn btn_cancel" @click="handleBtnAction('form-cancel')">취소</button>
      </div>
    </div>
    <!-- ══════════════════════════════════════
     📝 상세설정  (advrt / 구매제한 / 혜택)
══════════════════════════════════════ -->
    <div class="dtl-pane" v-show="showTab('detail')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📝 상세설정</div>
      <!-- 보기모드: fieldset disabled 로 홍보문구·날짜픽커·혜택 체크박스 자동 비활성 (편집 잠금) -->
      <fieldset :disabled="cfDtlMode" style="border:none;padding:0;margin:0;min-width:0;">
      <!-- ===== ■.■.■. 홍보문구 ================================================ -->
      <div style="font-size:13px;font-weight:700;color:#333;margin:24px 0 8px;">홍보문구 (advrt_stmt)</div>
      <div class="form-group">
        <input class="form-control" v-model="form.advrtStmt" placeholder="예: 이번 주 한정 20% 할인!" maxlength="500" />
        <div style="font-size:11px;color:#aaa;text-align:right;margin-top:2px;">{{ (form.advrtStmt||'').length }} / 500</div>
      </div>
      <!-- ===== ■.■.■. 상세설정 통합 폼 (광고 노출 + 구매 제한, cols=3 한 줄 3필드) ===== -->
      <bo-form-area :columns="columns.detailForm" :form="form" :errors="errors"
        :readonly="cfDtlMode" :cols="3" compact :show-actions="false">
        <template #advrtStart>
          <bo-date-time-picker v-model="form.advrtStartDate" />
        </template>
        <template #advrtEnd>
          <bo-date-time-picker v-model="form.advrtEndDate" />
        </template>
      </bo-form-area>
      <!-- ===== ■.■.■. 혜택 적용 여부 ============================================ -->
      <div style="font-size:13px;font-weight:700;color:#333;margin:24px 0 8px;">혜택 적용 여부</div>
      <div style="display:flex;gap:24px;padding:14px;background:#f9f9f9;border-radius:8px;border:1px solid #eee;flex-wrap:wrap;">
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;">
          <input type="checkbox" :checked="form.couponUseYn==='Y'" @change="form.couponUseYn=$event.target.checked?'Y':'N'" />
          쿠폰 사용 가능 (coupon_use_yn)
        </label>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;">
          <input type="checkbox" :checked="form.saveUseYn==='Y'" @change="form.saveUseYn=$event.target.checked?'Y':'N'" />
          적립금 사용 가능 (save_use_yn)
        </label>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;">
          <input type="checkbox" :checked="form.discntUseYn==='Y'" @change="form.discntUseYn=$event.target.checked?'Y':'N'" />
          할인 적용 가능 (discnt_use_yn)
        </label>
      </div>
      </fieldset>
      <div class="form-actions" v-if="cfDtlMode && active">
        <button class="btn btn_edit" @click="handleBtnAction('form-edit')">수정</button>
        <button class="btn btn_close" @click="handleBtnAction('form-close')">닫기</button>
      </div>
      <div class="form-actions" v-if="!cfDtlMode && active">
        <button class="btn btn_save" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 상품을 등록해주세요.' : ''" @click="handleBtnAction('form-save')">
          저장
        </button>
        <button class="btn btn_cancel" @click="handleBtnAction('form-cancel')">취소</button>
      </div>
    </div>
    <!-- ══════════════════════════════════════
     🖼 이미지  (pd_prod_img)
══════════════════════════════════════ -->
    <div class="dtl-pane" v-show="showTab('image')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🖼 이미지</div>
      <input type="file" ref="fileInputRef" multiple accept="image/*" style="display:none" @change="onFileChange" />
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;">
        <button v-if="!cfDtlMode" class="btn btn-secondary" @click="triggerFileInput">+ 파일 선택</button>
        <button v-if="!cfDtlMode" class="btn btn-secondary" @click="addImageByUrl">+ URL 입력</button>
        <span style="font-size:12px;color:#aaa;">{{ images.length }}개</span>
      </div>
      <div v-if="images.length===0"
        :style="'border:2px dashed #e0e0e0;border-radius:10px;padding:22px;text-align:center;color:#bbb;font-size:13px;' + (cfDtlMode ? '' : 'cursor:pointer;')"
        @click="cfDtlMode ? null : triggerFileInput()">
        {{ cfDtlMode ? '등록된 이미지가 없습니다.' : '클릭하거나 파일을 끌어다 놓으세요' }}
      </div>
      <!-- ===== ■.■.■. 이미지 5행 보이는 스크롤 컨테이너 (행 ≈ 116px × 5 + 여유 → 620px) ===== -->
      <div v-if="images.length>0" style="max-height:620px;overflow-y:auto;border:1px solid #f0f0f0;border-radius:10px;padding:8px;background:#fafafa;">
        <div v-for="(img, idx) in images" :key="img?.id" :draggable="!cfDtlMode" @dragstart="cfDtlMode ? null : onImgDragStart(idx)" @dragover.prevent="cfDtlMode ? null : onImgDragOver(idx)" @drop.prevent="cfDtlMode ? null : onImgDrop()" @dragend="dragImgIdx=null;dragoverImgIdx=null" style="display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid #e8e8e8;border-radius:10px;margin-bottom:10px;background:#fff;transition:border-color 0.15s,background 0.15s;" :style="img.isMain ? 'border-color:#e8587a;background:#fff8f9;' : (dragoverImgIdx===idx && dragImgIdx!==idx ? 'border-color:#1677ff;background:#e6f4ff;' : '')">
          <!-- ===== ■.■.■.■.■. 드래그 핸들 (수정모드 전용) ============================= -->
          <div v-if="!cfDtlMode" style="flex-shrink:0;display:flex;align-items:center;justify-content:center;width:20px;height:90px;cursor:grab;color:#ccc;font-size:15px;user-select:none;letter-spacing:-2px;" title="드래그로 순서 변경">
            ⋮⋮
          </div>
          <!-- ===== ■.■.■.■.■. 썸네일 ============================================= -->
          <div style="flex-shrink:0;width:90px;height:90px;border-radius:8px;overflow:hidden;background:#f5f5f5;border:1px solid #e0e0e0;display:flex;align-items:center;justify-content:center;">
            <img v-if="img.previewUrl" :src="img.previewUrl" style="width:100%;height:100%;object-fit:cover;" />
            <span v-else style="font-size:11px;color:#bbb;text-align:center;">미리보기 없음</span>
          </div>
          <!-- ===== ■.■.■.■.■. 입력 영역 =========================================== -->
          <div style="flex:1;min-width:0;">
            <div v-if="!img.previewUrl||img.previewUrl.startsWith('http')" class="form-group" style="margin-bottom:4px;">
              <label class="form-label" style="font-size:11px;">이미지 URL</label>
              <input class="form-control" v-model="img.previewUrl" placeholder="https://..." style="font-size:12px;" :readonly="cfDtlMode" />
            </div>
            <div v-if="img.previewUrl" style="font-size:9px;color:#bbb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:6px;" :title="img.previewUrl">
              {{ img.previewUrl }}
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <!-- ===== ■.■.■.■.■.■.■. opt_item_id_1: 옵션 1단 select ================= -->
              <div class="form-group" style="flex:1;min-width:140px;margin-bottom:4px;">
                <label class="form-label" style="font-size:11px;">opt_item_id_1 <span style="color:#aaa;"> (NULL=공통) </span></label>
                <select class="form-control" v-model="img.optItemId1" style="font-size:12px;" @change="img.optItemId2=''" :disabled="cfDtlMode">
                  <option value="">-- 공통 (NULL) --</option>
                  <option v-if="!safeFirst(optGroups)||safeFirst(optGroups).items.length===0" disabled value="">
                    옵션설정 탭에서 1단 옵션을 먼저 추가하세요
                  </option>
                  <option v-for="item in (optGroups[0]?.items||[])" :key="item?._id" :value="item.val||String(item._id)">
                    {{ item.nm + (item.val ? ' (' + item.val + ')' : '') }}
                  </option>
                </select>
              </div>
              <!-- ===== ■.■.■.■.■.■.■. opt_item_id_2: 옵션 2단 select (1단 선택 후 연동) ===== -->
              <div class="form-group" style="flex:1;min-width:140px;margin-bottom:4px;">
                <label class="form-label" style="font-size:11px;">opt_item_id_2 <span style="color:#aaa;"> (NULL=옵션1 공통) </span></label>
                <select class="form-control" v-model="img.optItemId2" style="font-size:12px;" :disabled="cfDtlMode || (!img.optItemId1 && optGroups.length<2)">
                  <option value="">-- 공통 (NULL) --</option>
                  <option v-if="!optGroups[1]||optGroups[1].items.length===0" disabled value="">2단 옵션 없음</option>
                  <option v-for="item in (optGroups[1]?.items||[])" :key="item?._id" :value="item.val||String(item._id)">
                    {{ fnOptItem2Label(item) }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          <!-- ===== ■.■.■.■.■. 우측 버튼 =========================================== -->
          <div style="flex-shrink:0;display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
            <button v-if="!cfDtlMode && !img.isMain" class="btn btn-sm btn-secondary" @click="setMain(img.id)" style="font-size:11px;">대표 설정</button>
            <span v-if="img.isMain" style="font-size:11px;font-weight:700;color:#e8587a;padding:4px 8px;background:#fde8ee;border-radius:4px;">
              ★ 대표
            </span>
            <button v-if="!cfDtlMode" class="btn btn-sm btn-danger" @click="removeImage(img.id)" style="font-size:11px;">삭제</button>
            <span style="font-size:11px;color:#bbb;">{{ idx+1 }}/{{ images.length }}</span>
          </div>
        </div>
      </div>
      <!-- ===== ■.■.■. /이미지 스크롤 컨테이너 ======================================= -->
      <div class="form-actions" v-if="cfDtlMode && active">
        <button class="btn btn_edit" @click="handleBtnAction('form-edit')">수정</button>
        <button class="btn btn_close" @click="handleBtnAction('form-close')">닫기</button>
      </div>
      <div class="form-actions" v-if="!cfDtlMode && active">
        <button class="btn btn_save" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 상품을 등록해주세요.' : ''" @click="handleBtnAction('form-save')">
          저장
        </button>
        <button class="btn btn_cancel" @click="handleBtnAction('form-cancel')">취소</button>
      </div>
    </div>
    <!-- ══════════════════════════════════════
     🔗 연관상품
══════════════════════════════════════ -->
    <div class="dtl-pane" v-show="showTab('related')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🔗 연관상품</div>
      <!-- 보기모드: fieldset disabled 로 추가/삭제/선택 버튼·input 자동 비활성 (편집 잠금) -->
      <fieldset :disabled="cfDtlMode" style="border:none;padding:0;margin:0;min-width:0;">
      <!-- ===== ■.■.■. 섹션1: 연관상품 =========================================== -->
      <div style="margin-bottom:28px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div style="font-size:13px;font-weight:700;">
            연관상품
            <span style="font-size:11px;font-weight:400;color:#888;">
              (pd_prod_rel · prod_rel_type_cd =
              <strong style="color:#1677ff;">REL_PROD</strong>
              )
            </span>
            <span class="badge badge-blue" style="margin-left:6px;">{{ relProds.length }}건</span>
          </div>
          <button class="btn btn-sm btn-secondary" @click="openProdPicker('rel')">+ 추가</button>
        </div>
        <!-- ===== ■.■.■.■. 목록 영역 ============================================= -->
        <bo-grid bare :columns="columns.relProdGrid" :rows="relProds" row-key="_id"
          draggable row-actions empty-text="+ 추가 버튼으로 연관상품을 등록하세요."
          @reorder="onRelDrop"
          @ref-click="({id}) => navigate('pdProdDtl', { id })">
          <template #row-actions="{ idx }">
            <button class="btn btn-xs btn-danger" @click="removeRelProd(idx)">삭제</button>
          </template>
        </bo-grid>
      </div>
      <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 24px;" />
      <!-- ===== ■.■.■. 섹션2: 코디상품 =========================================== -->
      <div style="margin-bottom:20px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div style="font-size:13px;font-weight:700;">
            코디상품
            <span style="font-size:11px;font-weight:400;color:#888;">
              (pd_prod_rel · prod_rel_type_cd =
              <strong style="color:#722ed1;">CODY_PROD</strong>
              )
            </span>
            <span class="badge badge-purple" style="margin-left:6px;">{{ codeProds.length }}건</span>
          </div>
          <button class="btn btn-sm btn-secondary" @click="openProdPicker('code')">+ 추가</button>
        </div>
        <!-- ===== ■.■.■.■. 목록 영역 ============================================= -->
        <bo-grid bare :columns="columns.codeProdGrid" :rows="codeProds" row-key="_id"
          draggable row-actions empty-text="+ 추가 버튼으로 코디상품을 등록하세요."
          @reorder="onCodeDrop"
          @ref-click="({id}) => navigate('pdProdDtl', { id })">
          <template #row-actions="{ idx }">
            <td style="text-align:center;;white-space:nowrap;">
              <button class="btn btn-xs btn-danger" @click="removeCodeProd(idx)">삭제</button>
            </td>
          </template>
        </bo-grid>
      </div>
      </fieldset>
      <div class="form-actions" v-if="cfDtlMode && active">
        <button class="btn btn_edit" @click="handleBtnAction('form-edit')">수정</button>
        <button class="btn btn_close" @click="handleBtnAction('form-close')">닫기</button>
      </div>
      <div class="form-actions" v-if="!cfDtlMode && active">
        <button class="btn btn_save" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 상품을 등록해주세요.' : ''" @click="handleBtnAction('form-save')">
          저장
        </button>
        <button class="btn btn_cancel" @click="handleBtnAction('form-cancel')">취소</button>
      </div>
      <!-- ===== ■.■.■. 상품 추가 피커 모달 (좌:카테고리트리 / 우:상품목록) ===================== -->
      <bo-prod-cate-pick-modal v-if="prodPickerOpen"
        :title="prodPickerOpen==='rel' ? '연관상품 추가' : '코디상품 추가'"
        :exclude-ids="(prodPickerOpen==='rel' ? relProds : codeProds).map(r => r.prodId)"
        modal-name="prod-cate-pick"
        :on-callback="fnProdPickerCallback" />
    </div>
    <!-- ══════════════════════════════════════
     💰 옵션(가격/재고)  (SKU 가격/재고 + 기본가격 + 판매계획)
══════════════════════════════════════ -->
    <div class="dtl-pane" v-show="showTab('price')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">💰 옵션(가격/재고)</div>
      <!-- 보기모드: fieldset disabled 로 SKU 재생성·인라인 입력·페이저 자동 비활성 (편집 잠금) -->
      <fieldset :disabled="cfDtlMode" style="border:none;padding:0;margin:0;min-width:0;">
      <!-- ===== ■.■.■. 기본 가격 (BoFormArea 자동 렌더) ============================ -->
      <div style="font-size:13px;font-weight:700;color:#333;margin-bottom:12px;">
        기본 가격
        <span style="font-weight:400;font-size:11px;color:#888;">(pd_prod)</span>
      </div>
      <!-- ===== ■.■.■. 폼 영역 ================================================ -->
      <bo-form-area :columns="columns.basePriceForm" :form="form" :errors="errors"
        :readonly="cfDtlMode" :cols="3" compact :show-actions="false">
        <!-- ===== ■.■.■.■. 마진율 (purchasePrice 입력 시 자동 계산) ==================== -->
        <template #marginRate>
          <div class="form-control" :style="{ background:'#f5f5f5', color: cfMarginRateCalc ? '#389e0d' : '#bbb' }">
            {{ cfMarginRateCalc ? cfMarginRateCalc + '%' : '(매입가 입력 시 자동 계산)' }}
          </div>
        </template>
      </bo-form-area>
      <!-- ===== ■.■.■. 가격 요약 카드 (컴팩트) ====================================== -->
      <div style="padding:8px 12px;background:#f9f9f9;border-radius:6px;border:1px solid #e8e8e8;margin-bottom:12px;">
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;text-align:center;align-items:center;">
          <div>
            <div style="font-size:14px;font-weight:700;">{{ (form.listPrice||0).toLocaleString() }}원</div>
            <div style="font-size:10px;color:#888;">정가</div>
          </div>
          <div>
            <div style="font-size:14px;font-weight:700;color:#e8587a;">{{ (form.salePrice||0).toLocaleString() }}원</div>
            <div style="font-size:10px;color:#888;">판매가</div>
          </div>
          <div>
            <div style="font-size:14px;font-weight:700;color:#f5222d;">{{ cfDiscountRate }}%</div>
            <div style="font-size:10px;color:#888;">할인율</div>
          </div>
          <div>
            <div style="font-size:14px;font-weight:700;color:#52c41a;">{{ cfMarginRateCalc ? cfMarginRateCalc + '%' : '-' }}</div>
            <div style="font-size:10px;color:#888;">마진율</div>
          </div>
          <div>
            <div style="font-size:14px;font-weight:700;color:#722ed1;">{{ cfPlatformFeeDisp }}</div>
            <div style="font-size:10px;color:#888;">플랫폼수수료</div>
          </div>
          <div>
            <div style="font-size:14px;font-weight:700;color:#1677ff;">{{ cfNetRevenueDisp }}</div>
            <div style="font-size:10px;color:#888;">예상 순수익</div>
          </div>
        </div>
      </div>
      <!-- ===== ■.■.■. 섹션2: 판매계획 =========================================== -->
      <div style="margin-top:24px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div style="font-size:13px;font-weight:700;">
            판매계획
            <span style="font-size:12px;font-weight:400;color:#888;">{{ cfPlanVisible.length }}건</span>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-sm btn-danger"    @click="deletePlanChecked">체크삭제</button>
            <button class="btn btn-sm btn-secondary" @click="addPlanRow">행추가</button>
          </div>
        </div>
        <div style="overflow-x:auto;">
          <!-- ===== ■.■.■.■.■. 목록 영역 =========================================== -->
          <bo-grid bare :columns="columns.planGrid" :rows="cfPlanVisible" row-key="_id"
            selectable checked-key="_id"
            :all-checked="cfPlanAllChecked" :is-checked="fnPlanRowChecked"
            :row-style="fnPlanRowStyle2"
            empty-text="[행추가]로 판매계획을 추가하세요."
            @toggle-check="onPlanToggleCheck" @toggle-check-all="onPlanToggleCheckAll"
            @cell-change="e => onPlanChange(e.row)"></bo-grid>
        </div>
        <div style="margin-top:8px;display:flex;gap:8px;font-size:11px;color:#aaa;align-items:center;">
          <span style="background:#f6ffed;border:1px solid #b7eb8f;border-radius:3px;padding:1px 6px;color:#389e0d;">I 신규</span>
          <span style="background:#fffbe6;border:1px solid #ffe58f;border-radius:3px;padding:1px 6px;color:#d46b08;">U 수정</span>
          <span style="background:#fff1f0;border:1px solid #ffa39e;border-radius:3px;padding:1px 6px;color:#cf1322;">D 삭제예정</span>
        </div>
      </div>
      <!-- ===== ■.■.■. 섹션3: SKU별 가격·재고 (옵션 카테고리 설정 시) ====================== -->
      <template v-if="prodOptCategoryTypeCd">
        <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0 20px;" />
        <!-- ===== ■.■.■.■. 헤더 행 ============================================== -->
        <div style="display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
          <div style="font-size:13px;font-weight:700;flex-shrink:0;">
            SKU별 가격·재고
            <span style="color:#888;font-weight:400;font-size:11px;">(pd_prod_sku)</span>
            <span class="badge badge-blue" style="margin-left:6px;">{{ safeFilter(cfSkusFiltered, s=>s.useYn==='Y').length }}개 활성</span>
            <span v-if="cfSkusFiltered.length < skus.length" class="badge badge-orange" style="margin-left:4px;font-size:10px;">
              필터 {{ cfSkusFiltered.length }}/{{ skus.length }}
            </span>
          </div>
          <!-- ===== ■.■.■.■.■. 필터 영역 =========================================== -->
          <div style="display:flex;align-items:center;gap:6px;flex:1;justify-content:flex-end;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:4px;">
              <span class="badge badge-gray" style="font-size:11px;flex-shrink:0;">{{ optGroups[0]?.grpNm||'1단' }}</span>
              <select v-model="skuFilter1" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:3px 6px;min-width:80px;"
                @change="skuFilter2=''">
                <option value="">전체</option>
                <option v-for="v in cfSkuFilter1Options" :key="Math.random()" :value="v">{{ v }}</option>
              </select>
            </div>
            <div v-if="optGroups.length>1" style="display:flex;align-items:center;gap:4px;">
              <span class="badge badge-blue" style="font-size:11px;flex-shrink:0;">{{ optGroups[1]?.grpNm||'2단' }}</span>
              <select v-model="skuFilter2" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:3px 6px;min-width:80px;">
                <option value="">전체</option>
                <option v-for="v in cfSkuFilter2Options" :key="Math.random()" :value="v">{{ v }}</option>
              </select>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
              <span style="font-size:11px;color:#555;flex-shrink:0;">재고</span>
              <select v-model="skuFilterStock" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:3px 6px;min-width:80px;">
                <option value="">전체</option>
                <option v-for="o in grpCodes.stock_filter_opts" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </div>
            <button v-if="skuFilter1||skuFilter2||skuFilterStock" class="btn btn-xs btn-secondary"
              @click="skuFilter1='';skuFilter2='';skuFilterStock=''">
              ✕ 초기화
            </button>
            <span style="font-size:12px;color:#555;margin-left:4px;">총 재고: <strong> {{ cfTotalStock }} </strong> 개</span>
            <button class="btn btn-sm btn-secondary" @click="generateSkus">🔄 SKU 재생성</button>
          </div>
        </div>
        <!-- 컴팩트 SKU 테이블 — 페이지 없이 약 10행 보이는 스크롤 컨테이너 (행 높이 24px × 10 + 헤더 ≈ 280px) -->
        <div style="overflow:auto;max-height:300px;border:1px solid #e0e0e0;border-radius:6px;margin-bottom:8px;">
          <!-- ===== ■.■.■.■.■. 테이블 ============================================= -->
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead style="position:sticky;top:0;background:#f5f5f5;z-index:1;">
              <tr style="background:#f5f5f5;border-bottom:1px solid #e0e0e0;">
                <th style="width:24px;padding:4px 4px;text-align:center;font-weight:600;color:#888;font-size:11px;">#</th>
                <th style="width:42px;padding:4px 4px;text-align:center;font-weight:600;color:#555;font-size:11px;">이동</th>
                <th style="width:90px;padding:4px 6px;text-align:left;font-weight:600;color:#555;font-size:11px;">
                  1단
                  <span v-if="safeFirst(optGroups)?.grpNm" style="color:#aaa;font-weight:400;">({{ safeFirst(optGroups).grpNm }})</span>
                </th>
                <th v-if="optGroups.length>1" style="width:90px;padding:4px 6px;text-align:left;font-weight:600;color:#555;font-size:11px;">
                  2단
                  <span v-if="optGroups[1]?.grpNm" style="color:#aaa;font-weight:400;">({{ optGroups[1].grpNm }})</span>
                </th>
                <th style="width:195px;padding:4px 6px;text-align:left;font-weight:600;color:#555;font-size:11px;">SKU코드</th>
                <th style="width:150px;padding:4px 6px;text-align:right;font-weight:600;color:#555;font-size:11px;">기본가</th>
                <th style="width:135px;padding:4px 6px;text-align:right;font-weight:600;color:#555;font-size:11px;">추가금액</th>
                <th style="width:105px;padding:4px 6px;text-align:right;font-weight:600;color:#555;font-size:11px;">재고</th>
                <th style="width:110px;padding:4px 6px;text-align:left;font-weight:600;color:#555;font-size:11px;">판매상태</th>
                <th style="width:68px;padding:4px 6px;text-align:right;font-weight:600;color:#555;font-size:11px;">판매수량</th>
                <th style="width:42px;padding:4px 4px;text-align:center;font-weight:600;color:#555;font-size:11px;">사용</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(sku, ii) in cfSkusFiltered" :key="sku?._id"
                :style="(sku.useYn==='N' ? 'opacity:0.45;background:#f5f5f5;' : (sku.statusCd==='SOLD_OUT'||sku.stock===0 ? 'background:#fffbe6;' : sku.statusCd==='SUSPENDED'?'background:#fff1f0;':(ii%2===1?'background:#fafafa;':'')))+'border-bottom:1px solid #f0f0f0;transition:background 0.1s;'">
                <td style="padding:2px 4px;text-align:center;color:#bbb;font-size:11px;">{{ ii+1 }}</td>
                <td style="padding:2px 2px;text-align:center;white-space:nowrap;">
                  <button type="button" @click="moveSku(sku,'up')"   :disabled="ii===0"
                    style="border:1px solid #ddd;background:#fff;border-radius:3px;width:18px;height:18px;font-size:10px;line-height:1;padding:0;color:#666;margin-right:1px;"
                    title="위로">
                    ▲
                  </button>
                  <button type="button" @click="moveSku(sku,'down')" :disabled="ii===cfSkusFiltered.length-1"
                    style="border:1px solid #ddd;background:#fff;border-radius:3px;width:18px;height:18px;font-size:10px;line-height:1;padding:0;color:#666;"
                    title="아래로">
                    ▼
                  </button>
                </td>
                <!-- ===== ■.■.■.■.■.■.■.■. 영역 ======================================== -->
                <td style="padding:2px 6px;"><span class="badge badge-gray" style="font-size:11px;"> {{ sku._nm1 }} </span></td>
                <td v-if="optGroups.length>1" style="padding:2px 6px;">
                  <span class="badge badge-blue" style="font-size:11px;">{{ sku._nm2 }}</span>
                </td>
                <td style="padding:2px 4px;">
                  <input v-model="sku.skuCode" placeholder="SKU-XXX"
                    style="width:100%;font-size:12px;border:1px solid #ddd;border-radius:4px;padding:2px 6px;height:24px;" />
                </td>
                <td style="padding:2px 4px;">
                  <div style="width:100%;font-size:12px;background:#f5f5f5;color:#555;border:1px solid #eee;border-radius:4px;padding:2px 6px;height:24px;line-height:20px;text-align:right;">
                    {{ ((form.salePrice||0) + (sku.addPrice||0)).toLocaleString() }}원
                  </div>
                </td>
                <td style="padding:2px 4px;">
                  <input type="number" v-model.number="sku.addPrice" placeholder="0"
                    style="width:100%;font-size:12px;border:1px solid #ddd;border-radius:4px;padding:2px 6px;height:24px;text-align:right;" />
                </td>
                <td style="padding:2px 4px;">
                  <input type="number" v-model.number="sku.stock" placeholder="0" min="0"
                    :style="'width:100%;font-size:12px;border:1px solid #ddd;border-radius:4px;padding:2px 6px;height:24px;text-align:right;'+((sku.stock||0)===0?'color:#f5222d;font-weight:700;':'')" />
                </td>
                <td style="padding:2px 4px;">
                  <select v-model="sku.statusCd"
                    :style="'width:100%;font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;height:24px;'+(sku.statusCd==='ON_SALE'?'color:#389e0d;':sku.statusCd==='SOLD_OUT'?'color:#f5a623;':sku.statusCd==='SUSPENDED'?'color:#cf1322;':'color:#555;')">
                    <option v-for="c in grpCodes.opt_stock_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
                  </select>
                </td>
                <td style="padding:2px 6px;text-align:right;font-size:12px;color:#555;">{{ (sku.saleCnt||0).toLocaleString() }}</td>
                <td style="padding:2px 4px;text-align:center;">
                  <input type="checkbox" :checked="sku.useYn==='Y'" @change="sku.useYn=$event.target.checked?'Y':'N'" style="width:14px;height:14px;" />
                </td>
              </tr>
              <!-- ===== ■.■.■.■.■.■.■. 조건부 영역 ====================================== -->
              <tr v-if="skus.length===0">
                <td :colspan="optGroups.length>1?11:10" style="text-align:center;color:#bbb;padding:16px;font-size:12px;">
                  옵션설정 탭에서 옵션 값 입력 후 [🔄 SKU 재생성]을 눌러주세요.
                </td>
              </tr>
              <tr v-else-if="cfSkusFiltered.length===0">
                <td :colspan="optGroups.length>1?11:10" style="text-align:center;color:#f5a623;padding:12px;font-size:12px;">
                  필터 조건에 맞는 SKU가 없습니다.
                  <button class="btn btn-xs btn-secondary" @click="skuFilter1='';skuFilter2='';skuFilterStock=''">필터 초기화</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#888;margin-bottom:16px;">
          <!-- ===== ■.■.■.■.■. 영역 ============================================== -->
          <span>
            총
            <strong style="color:#333;">{{ cfSkusFiltered.length }}</strong>
            건
            <span v-if="cfSkusFiltered.length<skus.length">/ 전체 {{ skus.length }}건</span>
          </span>
          <span>
            활성
            <strong style="color:#1677ff;">{{ safeFilter(skus, s=>s.useYn==='Y').length }}</strong>
            건 · 총 재고
            <strong style="color:#52c41a;">{{ cfTotalStock }}</strong>
            개
          </span>
        </div>
      </template>
      <!-- ===== ■.■.■. 섹션4: 단일 재고 (옵션 카테고리 미설정 시) ========================== -->
      <template v-if="!prodOptCategoryTypeCd">
        <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0 20px;" />
        <div style="font-size:13px;font-weight:700;color:#333;margin-bottom:12px;">
          단일 재고
          <span style="font-weight:400;font-size:11px;color:#888;">(옵션 미사용 — pd_prod.prod_stock)</span>
        </div>
        <!-- ===== ■.■.■.■. 재고수량 (BoFormArea 자동 렌더) =========================== -->
        <!-- ===== ■.■.■.■. 폼 영역 ============================================== -->
        <bo-form-area :columns="columns.singleStockForm" :form="form" :errors="errors"
          :readonly="cfDtlMode" :cols="3" compact :show-actions="false" />
        <template v-if="tabData.skus.length">
          <div style="font-size:12px;font-weight:600;color:#888;margin-bottom:8px;">
            잔존 SKU 데이터
            <span class="badge badge-orange" style="margin-left:4px;">{{ tabData.skus.length }}건</span>
            <span style="font-weight:400;font-size:11px;margin-left:6px;">옵션 미사용 전환 후 남아있는 SKU 이력 (읽기 전용)</span>
          </div>
          <div style="overflow-x:auto;margin-bottom:16px;">
            <!-- ===== ■.■.■.■.■.■. 목록 영역 ========================================= -->
            <bo-grid bare :columns="columns.remainSkuGrid"
              :rows="tabData.skus.slice((tabPage.skus.pageNo-1)*tabPage.skus.pageSize, tabPage.skus.pageNo*tabPage.skus.pageSize)"
              row-key="skuId" :row-style="fnRemainSkuRowStyle" empty-text="잔존 SKU 데이터가 없습니다."></bo-grid>
          </div>
          <div v-if="tabData.skus.length > tabPage.skus.pageSize" class="pagination" style="margin:8px 0 16px;">
            <button class="pager" @click="onTabPageChange('skus',1)" :disabled="tabPage.skus.pageNo===1">«</button>
            <button class="pager" @click="onTabPageChange('skus',tabPage.skus.pageNo-1)" :disabled="tabPage.skus.pageNo===1">‹</button>
            <button v-for="n in fnTabPageNos('skus')" :key="n" class="pager" :class="{active:tabPage.skus.pageNo===n}" @click="onTabPageChange('skus',n)">
              {{ n }}
            </button>
            <button class="pager" @click="onTabPageChange('skus',tabPage.skus.pageNo+1)" :disabled="tabPage.skus.pageNo===cfTabTotalPages('skus')">
              ›
            </button>
            <button class="pager" @click="onTabPageChange('skus',cfTabTotalPages('skus'))" :disabled="tabPage.skus.pageNo===cfTabTotalPages('skus')">
              »
            </button>
            <span class="pager-right">{{ tabData.skus.length }}건 / {{ tabPage.skus.pageSize }}개씩</span>
          </div>
        </template>
      </template>
      </fieldset>
      <!-- ===== ■.■.■. 저장/취소 버튼 (맨 아래) ===================================== -->
      <div class="form-actions" v-if="cfDtlMode && active">
        <button class="btn btn_edit" @click="handleBtnAction('form-edit')">수정</button>
        <button class="btn btn_close" @click="handleBtnAction('form-close')">닫기</button>
      </div>
      <div class="form-actions" v-if="!cfDtlMode && active">
        <button class="btn btn_save" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 상품을 등록해주세요.' : ''" @click="handleBtnAction('form-save')">
          저장
        </button>
        <button class="btn btn_cancel" @click="handleBtnAction('form-cancel')">취소</button>
      </div>
    </div>
  </div>
  <!-- ===== /dtl-tab-grid ============================================== -->
  <!-- ===== □. 탭 컨텐츠 =================================================== -->
</bo-container>
<!-- ===== □. 상세 카드 (제목 + 탭바 + 탭컨텐츠를 한 영역으로) ===================== -->
<!-- ===== ■. 이력 ====================================================== -->
<div v-if="!cfIsNew" style="margin-top:12px;">
  <pd-prod-hist :prod-id="dtlId" :navigate="navigate" />
</div>
<!-- ===== □. 이력 ====================================================== -->
<!-- ===== ■. 공통코드 그룹 미리보기 모달 (BoModals.js / window.BoCodeGrpModal) ===== -->
<!-- ===== ■. 영역 ====================================================== -->
<bo-code-grp-modal
  :show="codeGrpModal.show"
  :code-grp="codeGrpModal.codeGrp"
  :title="codeGrpModal.title" modal-name="code-grp" :on-callback="fnCallbackModal" />
<!-- ===== □. 영역 ====================================================== -->
`
};
