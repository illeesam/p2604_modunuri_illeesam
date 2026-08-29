/* ShopJoy Admin - 상품관리 상세/등록 */
window._pdProdDtlState = window._pdProdDtlState || { tab: 'info', tabMode: 'tab' };
/* 신상품/베스트/성인상품/당일배송/강제품절 — 5개 독립 Y/N 필드를 BoMultiCheckSelect 로 통합 표시하기 위한 옵션 목록 */
const PROD_FLAG_OPTIONS = [
  { value: 'isNew',         label: '신상품' },
  { value: 'isBest',        label: '베스트' },
  { value: 'adltYn',        label: '성인상품' },
  { value: 'sameDayDlivYn', label: '당일배송' },
  { value: 'soldOutYn',     label: '강제품절' },
];
window.PdProdDtl = {
  name: 'PdProdDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit)
    active:       { type: Boolean, default: true }, // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-bo §18)
    fixedProdTypeCd: { type: String, default: null }, // 신규 등록 시 상품유형 초기값 (유형별 개별 메뉴 진입 시)
    setTabLabel:  { type: Function, default: () => {} }, // 상품명 로드 후 탭/브라우저 타이틀 갱신 (새창 진입 시 등)
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
    const uiState = reactive({ isDraggingDivider: false, loading: false, mdModalOpen: false, error: null, topTab: window._pdProdDtlState.tab || 'info', tabMode2: window._pdProdDtlState.tabMode || 'tab', prodOptCategoryTypeCd: '', dragOptGrpId: null, dragOptItemIdx: null, dragoverOptItemIdx: null, skuFilter1: '', skuFilter2: '', skuFilterStock: '', dragImgIdx: null, dragoverImgIdx: null, dragBlockIdx: null, dragoverBlockIdx: null, splitPct: 65, previewDevice: 'pc', prodPickerOpen: '', prodPickerSearch: '', dragRelIdx: null, dragoverRelIdx: null, dragCodeIdx: null, dragoverCodeIdx: null, catPickerOpen: false, catPickerSearch: '', catDragIdx: null, catDragoverIdx: null, mdSearchType: '', mdSearch: '', prodPickerSearchType: '', promoPicker: null, stockCodePickerOpen: false, stockCodePickerSku: null,
      /* 이미지 업로드 대상 옵션 — 옵션상품은 "옵션1 먼저 고르고 → 여러 장 한 번에" 가 자연스럽다.
         여기서 고른 값이 [파일 선택]/[URL 입력] 으로 새로 추가되는 행의 opt_id_1/2 초기값이 된다.
         (''=공통). 기존 행은 각 행의 select 로 계속 개별 변경할 수 있다. */
      uploadOpt1: '',      // [+ 파일 선택] 이 열릴 때 심어두는 대상 옵션1 그룹 key (onFileChange 가 읽는다)
      skuView: 'list',        // SKU 편집 뷰 — 'list'(144행 목록) | 'matrix'(N×M 격자)
      skuMxField: 'addPrice', // 매트릭스가 편집 중인 필드 key
      skuMxBulk: '',          // 행/열/전체 일괄 채우기에 쓸 값
      dropOpt1: null,      // OS 파일을 끌고 있는 그룹 key (테두리 하이라이트용)
      dragImgId: null });  // 순서변경 드래그 중인 이미지 id — 그룹 간 이동 시 옵션1 재지정에 사용
    const tab = Vue.toRef(uiState, 'tab');
    const codes = reactive([]);
    const grpCodes = reactive({ PROD_STATUS_CD: [], PROD_TYPE: [], PROD_PLAN_STATUS: [], OPT_STOCK_STATUS: [], STOCK_FILTER: [], DLIV_METHOD: [] });

    /* fnProdTypeLabel — 상품유형 코드값 → 라벨 (영역 타이틀에 "옵션 상품수정" 식으로 붙일 때 사용) */
    const fnProdTypeLabel = () => (grpCodes.PROD_TYPE.find(c => c.codeValue === form.prodTypeCd) || {}).codeLabel || '';

    /* 상품 fnLoadCodes */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 상위 레벨 버튼 액션 dispatch (탭 / 저장 / 취소 / 미리보기 등).
     * 자식 컴포넌트 콜백 / SKU / 카테고리 매핑 / Quill 등 세부 액션은 기존 함수 유지 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PdProdDtl.js : handleBtnAction -> ', cmd, param);
      // 탭별 분기 대상(10개 탭). 저장은 탭별로 별도 분기 준비, 취소/닫기/수정전환은 탭 무관 공통 동작이라
      // 같은 탭 목록에서 cmd 접미어만 바꿔 파생시킨다(TAB_IDS 하나만 관리하면 됨).
      const TAB_IDS = ['info', 'option', 'content', 'detail', 'promo', 'image', 'related', 'price', 'bundle', 'setitems'];
      // 폼 저장 — 탭별 분기 자리(현재는 배열에 있는 탭 전부 handleSave() 공용 저장.
      // 특정 탭만 다른 저장 로직이 필요해지면 그 탭만 배열에서 빼고 별도 분기로 추가하면 됨)
      if (TAB_IDS.map(t => t + '-form-save').includes(cmd)) {
        return handleSave();
      // 폼 취소/닫기/수정전환 — 탭 무관 공통 동작(순수 네비게이션이라 탭별 분기 불필요)
      } else if (TAB_IDS.map(t => t + '-form-cancel').includes(cmd)) {
        return props.navigate('__cancelEdit__');
      } else if (TAB_IDS.map(t => t + '-form-close').includes(cmd)) {
        return props.navigate('__closeDtl__');
      } else if (TAB_IDS.map(t => t + '-form-edit').includes(cmd)) {
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
      // 프로모션 탭 재조회
      } else if (cmd === 'promo-coupon-reload') {
        if (!cfCurProdId.value) return;
        boApiSvc.pmCouponItem.getList({ targetId: cfCurProdId.value, targetTypeCd: 'PRODUCT' }, '상품관리', '쿠폰재조회')
          .then(r => tabData.promoCoupons.splice(0, tabData.promoCoupons.length, ...(r.data?.data || [])))
          .catch(() => {});
        return;
      } else if (cmd === 'promo-save-reload') {
        if (!cfCurProdId.value) return;
        boApiSvc.pmSaveItem.getList({ targetId: cfCurProdId.value, targetTypeCd: 'PRODUCT' }, '상품관리', '적립금재조회')
          .then(r => tabData.promoSaves.splice(0, tabData.promoSaves.length, ...(r.data?.data || [])))
          .catch(() => {});
        return;
      } else if (cmd === 'promo-discnt-reload') {
        if (!cfCurProdId.value) return;
        boApiSvc.pmDiscntItem.getList({ targetId: cfCurProdId.value, targetTypeCd: 'PRODUCT' }, '상품관리', '할인재조회')
          .then(r => tabData.promoDiscnts.splice(0, tabData.promoDiscnts.length, ...(r.data?.data || [])))
          .catch(() => {});
        return;
      } else if (cmd === 'promo-coupon-delete') {
        if (!param) return;
        showConfirm('삭제', '이 상품을 쿠폰 대상에서 제거하시겠습니까?').then(ok => {
          if (!ok) return;
          boApiSvc.pmCouponItem.remove(param, '상품관리', '쿠폰삭제')
            .then(() => { showToast('삭제되었습니다.', 'success'); handleBtnAction('promo-coupon-reload'); })
            .catch(err => showToast(err.response?.data?.message || '삭제 실패', 'error', 0));
        });
        return;
      } else if (cmd === 'promo-save-delete') {
        if (!param) return;
        showConfirm('삭제', '이 상품을 적립금 대상에서 제거하시겠습니까?').then(ok => {
          if (!ok) return;
          boApiSvc.pmSaveItem.remove(param, '상품관리', '적립금삭제')
            .then(() => { showToast('삭제되었습니다.', 'success'); handleBtnAction('promo-save-reload'); })
            .catch(err => showToast(err.response?.data?.message || '삭제 실패', 'error', 0));
        });
        return;
      } else if (cmd === 'promo-discnt-delete') {
        if (!param) return;
        showConfirm('삭제', '이 상품을 할인 대상에서 제거하시겠습니까?').then(ok => {
          if (!ok) return;
          boApiSvc.pmDiscntItem.remove(param, '상품관리', '할인삭제')
            .then(() => { showToast('삭제되었습니다.', 'success'); handleBtnAction('promo-discnt-reload'); })
            .catch(err => showToast(err.response?.data?.message || '삭제 실패', 'error', 0));
        });
        return;
      } else if (cmd === 'promo-coupon-add') {
        uiState.promoPicker = 'coupon';
        return;
      } else if (cmd === 'promo-save-add') {
        uiState.promoPicker = 'save';
        return;
      } else if (cmd === 'promo-discnt-add') {
        uiState.promoPicker = 'discnt';
        return;
      } else if (cmd === 'promo-coupon-pick') {
        if (!param?.couponId || !cfCurProdId.value) return;
        boApiSvc.pmCouponItem.create({ couponId: param.couponId, targetTypeCd: 'PRODUCT', targetId: cfCurProdId.value }, '상품관리', '쿠폰추가')
          .then(() => { uiState.promoPicker = null; showToast('추가되었습니다.', 'success'); handleBtnAction('promo-coupon-reload'); })
          .catch(err => showToast(err.response?.data?.message || '추가 실패', 'error', 0));
        return;
      } else if (cmd === 'promo-save-pick') {
        if (!param?.saveId || !cfCurProdId.value) return;
        boApiSvc.pmSaveItem.create({ saveId: param.saveId, targetTypeCd: 'PRODUCT', targetId: cfCurProdId.value }, '상품관리', '적립금추가')
          .then(() => { uiState.promoPicker = null; showToast('추가되었습니다.', 'success'); handleBtnAction('promo-save-reload'); })
          .catch(err => showToast(err.response?.data?.message || '추가 실패', 'error', 0));
        return;
      } else if (cmd === 'promo-discnt-pick') {
        if (!param?.discntId || !cfCurProdId.value) return;
        boApiSvc.pmDiscntItem.create({ discntId: param.discntId, targetTypeCd: 'PRODUCT', targetId: cfCurProdId.value }, '상품관리', '할인추가')
          .then(() => { uiState.promoPicker = null; showToast('추가되었습니다.', 'success'); handleBtnAction('promo-discnt-reload'); })
          .catch(err => showToast(err.response?.data?.message || '추가 실패', 'error', 0));
        return;
      // 사은품 조건
      } else if (cmd === 'promo-gift-reload') {
        if (!cfCurProdId.value) return;
        boApiSvc.pmGiftCond.getList({ targetId: cfCurProdId.value, targetTypeCd: 'PRODUCT' }, '상품관리', '사은품재조회')
          .then(r => tabData.promoGifts.splice(0, tabData.promoGifts.length, ...(r.data?.data || [])))
          .catch(() => {});
        return;
      } else if (cmd === 'promo-gift-delete') {
        if (!param) return;
        showConfirm('삭제', '이 상품을 사은품 대상에서 제거하시겠습니까?').then(ok => {
          if (!ok) return;
          boApiSvc.pmGiftCond.remove(param, '상품관리', '사은품삭제')
            .then(() => { showToast('삭제되었습니다.', 'success'); handleBtnAction('promo-gift-reload'); })
            .catch(err => showToast(err.response?.data?.message || '삭제 실패', 'error', 0));
        });
        return;
      } else if (cmd === 'promo-gift-add') {
        uiState.promoPicker = 'gift';
        return;
      } else if (cmd === 'promo-gift-pick') {
        if (!param?.giftId || !cfCurProdId.value) return;
        boApiSvc.pmGiftCond.create({ giftId: param.giftId, targetTypeCd: 'PRODUCT', targetId: cfCurProdId.value }, '상품관리', '사은품추가')
          .then(() => { uiState.promoPicker = null; showToast('추가되었습니다.', 'success'); handleBtnAction('promo-gift-reload'); })
          .catch(err => showToast(err.response?.data?.message || '추가 실패', 'error', 0));
        return;
      // 카테고리 피커 열기
      } else if (cmd === 'catPicker-open') {
        uiState.catPickerOpen = true;
        return;
      // 카테고리 항목 삭제
      } else if (cmd === 'category-remove') {
        return removeCategory(param);
      // 담당MD 선택 모달 열기
      } else if (cmd === 'mdModal-open') {
        return openMdModal();
      // 담당MD 선택 해제
      } else if (cmd === 'md-clear') {
        form.mdUserId = '';
        return;
      // 담당MD 선택 확정
      } else if (cmd === 'md-select') {
        return selectMdUser(param);
      // 카테고리 피커 닫기
      } else if (cmd === 'catPicker-close') {
        uiState.catPickerOpen = false;
        return;
      // 담당MD 선택 모달 닫기
      } else if (cmd === 'mdModal-close') {
        uiState.mdModalOpen = false;
        return;
      // 도움말 팝업 열기
      } else if (cmd === 'help-open') {
        return openHelp(param);
      // 코드그룹 모달 열기
      } else if (cmd === 'codeGrpModal-open') {
        return openCodeGrpModal(param.codeGrp, param.title);
      // 옵션 그룹 삭제
      } else if (cmd === 'optGroup-remove') {
        return removeOptGroup(param);
      // 옵션 값 추가
      } else if (cmd === 'optItem-add') {
        return addOptItem(param);
      // 옵션 값 삭제
      } else if (cmd === 'optItem-remove') {
        return removeOptItem(param.grp, param.ii);
      // 콘텐츠 블록 추가
      } else if (cmd === 'contentBlock-add') {
        return addContentBlock(param);
      // 콘텐츠 블록 삭제
      } else if (cmd === 'contentBlock-remove') {
        return removeContentBlock(param);
      // 콘텐츠 블록 파일 초기화
      } else if (cmd === 'contentBlock-clearFile') {
        fnDeleteBlockAttachIfPending(param);
        param.content = ''; param.fileName = ''; param.attachId = null; param._persisted = false;
        return;
      // 미리보기 디바이스 변경
      } else if (cmd === 'preview-setDevice') {
        uiState.previewDevice = param;
        return;
      // 플랜 체크 삭제
      } else if (cmd === 'plan-deleteChecked') {
        return deletePlanChecked();
      // 플랜 행 추가
      } else if (cmd === 'plan-addRow') {
        return addPlanRow();
      // 이미지 파일 선택 (파일 input 트리거)
      } else if (cmd === 'img-triggerFile') {
        return triggerFileInput(param);
      // 이미지 URL 입력 추가 (param = 대상 옵션1 그룹 key)
      } else if (cmd === 'img-addByUrl') {
        return addImageByUrl(param);
      // 이미지 대표 설정
      } else if (cmd === 'img-setMain') {
        return setMain(param);
      // 이미지 파일 교체 (해당 행만 파일 바꾸기)
      } else if (cmd === 'img-replaceFile') {
        return triggerReplaceFile(param);
      // 이미지 삭제
      } else if (cmd === 'img-remove') {
        return removeImage(param);
      // 연관상품/세트 피커 열기
      } else if (cmd === 'prodPicker-open') {
        return openProdPicker(param);
      } else if (cmd === 'rel-remove') {
        return removeRelProd(param);
      } else if (cmd === 'codeProd-remove') {
        return removeCodeProd(param);
      } else if (cmd === 'sku-filterReset') {
        uiState.skuFilter1 = ''; uiState.skuFilter2 = ''; uiState.skuFilterStock = '';
      } else if (cmd === 'sku-generate') {
        return generateSkus();
      } else if (cmd === 'sku-move') {
        return moveSku(param.sku, param.dir);
      } else if (cmd === 'skuStockCode-pick') {
        uiState.stockCodePickerSku = param;
        uiState.stockCodePickerOpen = true;
      } else if (cmd === 'skuStockCode-select') {
        if (uiState.stockCodePickerSku) { uiState.stockCodePickerSku.stockCode = param.stockCode; }
        uiState.stockCodePickerOpen = false;
        uiState.stockCodePickerSku = null;
      } else if (cmd === 'skuStockCode-close') {
        uiState.stockCodePickerOpen = false;
        uiState.stockCodePickerSku = null;
      } else if (cmd === 'tabPage-change') {
        return onTabPageChange(param.key, param.pageNo);
      } else if (cmd === 'bundlePicker-open') {
        bundlePickerOpen.value = true;
      } else if (cmd === 'bundleItem-remove') {
        return removeBundleItem(param);
      } else if (cmd === 'setPicker-open') {
        setPickerOpen.value = true;
      } else if (cmd === 'setItem-addEmpty') {
        return addSetItem(null);
      } else if (cmd === 'setItem-remove') {
        return removeSetItem(param);
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
    const fnCallbackModal = (popCmd, param, result) => {
      console.log(' ■■ PdProdDtl : fnCallbackModal -> ', popCmd, param, result);
      if (popCmd === 'cmPopup-category-pick') {
        if (result == null) { uiState.catPickerOpen = false; return; }
        return addCategory(result);
      } else if (popCmd === 'cmPopup-bundle-pick') {
        if (result == null) { bundlePickerOpen.value = false; return; }
        return addBundleItem(result);
      } else if (popCmd === 'cmPopup-set-pick') {
        if (result == null) { setPickerOpen.value = false; return; }
        return addSetItem(result);
      } else if (popCmd === 'cmPopup-md-pick') {
        if (result == null) { uiState.mdModalOpen = false; return; }
        return handleBtnAction('md-select', result);
      } else if (popCmd === 'cmPopup-code-grp') {
        if (result == null) { codeGrpModal.show = false; return; }
        return;
      } else {
        console.warn('[fnCallbackModal] unknown popCmd:', popCmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
        /* PROD_OPT_CATEGORY 는 3단 계층(카테고리 9 → 옵션유형 18 → 프리셋값 99) 전체를 통째로 쓴다.
           cfOptTypeLevel1Codes / getOptTypeCodes / getOptValCodes 가 codeLevel 로 갈라 쓰므로
           그룹 하나만 실으면 세 단계가 모두 채워진다. 빠지면 [옵션 카테고리] select 가 빈 채로 뜬다. */
        await codeStore.saLoadCodes(['PROD_STATUS_CD', 'PROD_TYPE_CD', 'PROD_PLAN_STATUS', 'OPT_STOCK_STATUS', 'STOCK_FILTER', 'DLIV_METHOD_CD', 'PROD_OPT_CATEGORY'], {compNm: 'PdProdDtl'});
        if (!codeStore?.svCodes) { return; }
        codes.length = 0;
        codes.push(...codeStore.svCodes);
        if (codeStore.sgGetGrpCodes) {
          grpCodes.PROD_STATUS_CD  = codeStore.sgGetGrpCodes('PROD_STATUS_CD');
          grpCodes.PROD_TYPE = codeStore.sgGetGrpCodes('PROD_TYPE_CD');
          grpCodes.PROD_PLAN_STATUS = codeStore.sgGetGrpCodes('PROD_PLAN_STATUS');
          grpCodes.OPT_STOCK_STATUS = codeStore.sgGetGrpCodes('OPT_STOCK_STATUS');
          grpCodes.STOCK_FILTER = codeStore.sgGetGrpCodes('STOCK_FILTER');
          grpCodes.DLIV_METHOD = codeStore.sgGetGrpCodes('DLIV_METHOD_CD');
        }
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    // -- 탭별 페이징 상태
    const tabPage = reactive({
      images:  { pageNo: 1, pageSize: 10, totalCount: 0 },
      opts:    { pageNo: 1, pageSize: 10, totalCount: 0 },
      skus:    { pageNo: 1, pageSize: 10, totalCount: 0 },
      content: { pageNo: 1, pageSize: 10, totalCount: 0 },
      rels:    { pageNo: 1, pageSize: 10, totalCount: 0 },
    });
    // 탭별 전체 데이터 (페이징은 프론트 슬라이스)
    const tabData = reactive({ images: [], opts: { groups: [], items: [] }, skus: [], content: [], rels: [], bundleItems: [], setItems: [], promoCoupons: [], promoSaves: [], promoDiscnts: [], promoGifts: [] });


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
          //   pd_prod_img: cdn_img_url / cdn_thumb_url / opt_id_1 / opt_id_2 / is_thumb / sort_ord
          //   화면용:      previewUrl / isMain (=is_thumb=Y)
          const prodImgs_ = p.prodImgs || [];
          tabData.images.splice(0, tabData.images.length, ...prodImgs_.map(img => ({
            ...img,
            id:          imgIdSeq++,
            previewUrl:  img.cdnImgUrl || img.cdnThumbUrl || '',
            isMain:      img.isThumb === 'Y',
            prodOpt1Id:  img.prodOpt1Id || '',
            prodOpt2Id:  img.prodOpt2Id || '',
            _persisted:  true,   // 서버에서 이미 저장된 이미지 — 제거 시 즉시 물리삭제 대상 아님(저장 시 정리)
          })));

          // 옵션그룹+아이템 [4] — GET /opts 응답 구조
          //   백엔드: { optTypes:[{optTypeCd, optTypeLevel}], opts:[pd_prod_opt 항목] }
          //   pd_prod_opt 필드: prodOptId / prodOptNm / prodOptVal / prodOptStdCd / prodOptStyle
          //                   / prodOptTypeLevel(1|2) / prodOpt1TypeCd / prodOpt2TypeCd
          //                   / parentProdOptId / sortOrd / useYn
          //   화면 키: {_id, grpNm, level1Cd, level, items:[{_id, nm, val, stdCd, prodOptStyle, parentOptId, sortOrd, useYn}]}
          const optsRes_   = r[4]?.data?.data || {};
          const optTypes_  = optsRes_.optTypes || [];
          const prodOpts_  = optsRes_.opts     || [];
          tabData.opts.groups.splice(0, tabData.opts.groups.length, ...optTypes_);
          tabData.opts.items.splice(0,  tabData.opts.items.length,  ...prodOpts_);
          if (optTypes_.length) {
            // 유형별(optTypeLevel) 옵션값 채움 — 2단은 독립 행(nm+val 고유 기준, parentOptId 무시)
            const built = optTypes_.map(g => {
              const level = Number(g.optTypeLevel) || 1;
              const seen = new Set();
              const grpOpts = [];
              prodOpts_
                .filter(i => Number(i.prodOptTypeLevel) === level)
                .sort((a,b) => (Number(a.sortOrd)||0) - (Number(b.sortOrd)||0))
                .forEach(i => {
                  const key = (i.prodOptNm||'') + '||' + (i.prodOptVal||'');
                  if (level === 2 && seen.has(key)) { return; } // 2단 중복 제거
                  seen.add(key);
                  grpOpts.push({
                    _id:          _itemSeq++,
                    nm:           i.prodOptNm    || '',
                    val:          i.prodOptVal   || '',
                    stdCd:        i.prodOptStdCd || '',
                    prodOptStyle: i.prodOptStyle || '',
                    parentOptId:  '',
                    sortOrd:      Number(i.sortOrd || 0),
                    useYn:        i.useYn || 'Y',
                  });
                });
              return {
                _id:      _optSeq++,
                grpNm:    g.optTypeCd || '',
                level1Cd: level === 1 ? (g.optTypeCd || '') : (optTypes_[0]?.optTypeCd || ''),
                level2Cd: level === 2 ? (g.optTypeCd || '') : '',
                level,
                items:    grpOpts,
              };
            });
            built.sort((a,b) => a.level - b.level);
            optGroups.splice(0, optGroups.length, ...built);
          }

          // SKU — getById 응답에 embedded (PdProdDto.Item.skus)
          const skuList = p.prodSkus || [];
          tabData.skus.splice(0, tabData.skus.length, ...skuList.map(s => ({ ...s, _id: 'sku_' + s.prodSkuId, _optKey: s.prodSkuId, _nm1: s.prodOptNm1 || '', _nm2: s.prodOptNm2 || '', stock: s.stockQty || 0, stockCode: s.stockCode || '' })));

          // 상품설명 [6] — 백엔드에서 sortOrd ASC 기본 정렬
          const contentList = r[6].data?.data || [];
          tabData.content.splice(0, tabData.content.length, ...contentList);

          // 연관상품 [7]
          const relList = r[7].data?.data || [];
          tabData.rels.splice(0, tabData.rels.length, ...relList.map(rel => ({ ...rel, _id: _relSeq++, prodNm: rel.relProdNm || rel.prodNm || '' })));

          // 묶음구성 / 세트구성 — prodTypeCd 기준 선택 로드
          const prodTypeCd_ = (p.prodTypeCd || '').toUpperCase();
          if (prodTypeCd_ === 'GROUP') {
            try {
              const br = await boApiSvc.pdBundle.getItems(props.dtlId, '상품관리', '묶음구성조회');
              const bundleList = br.data?.data || [];
              tabData.bundleItems.splice(0, tabData.bundleItems.length, ...bundleList.map((b, i) => ({ ...b, _id: i + 1 })));
            } catch (_) { tabData.bundleItems.splice(0); }
          }
          if (prodTypeCd_ === 'SET') {
            try {
              const sr = await boApiSvc.pdSet.getItems(props.dtlId, '상품관리', '세트구성조회');
              const setList = sr.data?.data || [];
              tabData.setItems.splice(0, tabData.setItems.length, ...setList.map((s, i) => ({ ...s, _id: i + 1 })));
            } catch (_) { tabData.setItems.splice(0); }
          }
          // 프로모션 — 이 상품에 연결된 쿠폰/적립금/할인/사은품 항목 조회 (junction 테이블)
          try {
            const [cr, sr2, dr, gr, acr, asr] = await Promise.all([
              boApiSvc.pmCouponItem.getList({ targetId: props.dtlId, targetTypeCd: 'PRODUCT' }, '상품관리', '쿠폰조회'),
              boApiSvc.pmSaveItem.getList(  { targetId: props.dtlId, targetTypeCd: 'PRODUCT' }, '상품관리', '적립금조회'),
              boApiSvc.pmDiscntItem.getList({ targetId: props.dtlId, targetTypeCd: 'PRODUCT' }, '상품관리', '할인조회'),
              boApiSvc.pmGiftCond.getList(  { targetId: props.dtlId, targetTypeCd: 'PRODUCT' }, '상품관리', '사은품조회'),
            ]);
            tabData.promoCoupons.splice(0, tabData.promoCoupons.length, ...(cr.data?.data || []));
            tabData.promoSaves.splice(0,   tabData.promoSaves.length,   ...(sr2.data?.data || []));
            tabData.promoDiscnts.splice(0, tabData.promoDiscnts.length, ...(dr.data?.data || []));
            tabData.promoGifts.splice(0,   tabData.promoGifts.length,   ...(gr.data?.data || []));
          } catch (_) {
            tabData.promoCoupons.splice(0); tabData.promoSaves.splice(0); tabData.promoDiscnts.splice(0); tabData.promoGifts.splice(0);
          }
          // 판매계획 로드
          try {
            const pr = await boApiSvc.pdProd.getPlans(props.dtlId, '상품관리', '판매계획조회');
            const planList = pr.data?.data || [];
            salePlans.splice(0, salePlans.length, ...planList.map(r => ({
              ...r,
              _id: planIdSeq++, _row_status: 'N', _checked: false,
              startDate: r.startDatetime ? String(r.startDatetime).slice(0, 10) : '',
              startTime: r.startDatetime ? String(r.startDatetime).slice(11, 16) : '00:00',
              endDate:   r.endDatetime   ? String(r.endDatetime).slice(0, 10)   : '',
              endTime:   r.endDatetime   ? String(r.endDatetime).slice(11, 16)  : '23:59',
              planStatus: r.planStatusCd || 'SCHEDULED',
            })));
          } catch (_) { salePlans.splice(0); }
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
      tabData.bundleItems.splice(0); tabData.setItems.splice(0);
      tabData.promoCoupons.splice(0); tabData.promoSaves.splice(0); tabData.promoDiscnts.splice(0); tabData.promoGifts.splice(0);
    });

    watch(tabMode2, v => { uiState.tabMode2 = v; window._pdProdDtlState.tabMode = v; });

    /* showTab — 표시 */
    const showTab = id => tabMode2.value !== 'tab' || topTab.value === id;

    /* tabs — 탭 정의 (BoTabBar 데이터, reactive). 카운트는 tabData getter 로 반응형 유지 */
    const tabs = reactive([
      { id: 'info',     label: '기본정보',        icon: '📋' },
      { id: 'detail',   label: '상세설정',        icon: '📝' },
      { id: 'promo',    label: '프로모션',        icon: '🎯' },
      { id: 'content',  label: '상품설명',        icon: '📄', get count() { return tabData.content.length; } },
      { id: 'option',   label: '옵션설정',        icon: '⚙',
        get visible() { return form.prodTypeCd === 'OPTION'; },
        get count() { return tabData.opts.groups.length; } },
      { id: 'price',    label: '옵션(가격/재고)', icon: '💰',
        get visible() { return form.prodTypeCd === 'OPTION'; },
        get count() { return tabData.skus.length; } },
      { id: 'bundle',   label: '묶음구성',        icon: '📦',
        get visible() { return form.prodTypeCd === 'GROUP'; } },
      { id: 'setitems', label: '세트구성',        icon: '🎁',
        get visible() { return form.prodTypeCd === 'SET'; } },
      /* 뱃지는 화면에 실제로 보이는 목록(images) 기준 — tabData(서버본)만 세면 업로드 직후에도 0 으로 남아
         "2개 보이는데 뱃지는 0" 인 상태가 된다 */
      { id: 'image',    label: '이미지',          icon: '🖼', get count() { return images.length; } },
      { id: 'related',  label: '연관상품',        icon: '🔗', get count() { return tabData.rels.length; } },
    ]);

    // -- form: pd_prod 전체 필드
    const form = reactive({
      prodId: null,
      prodNm: '', prodCode: '',
      categoryId: '', brandId: '', brandNm: '', vendorId: '', vendorNm: '',
      mdUserId: '',
      prodTypeCd: 'OPTION', prodStatusCd: 'DRAFT', unsaleMsg: '',
      dlivTmpltId: '', dlivMethodCd: '',
      stdPrice: 0, salePrice: 0, currCd: 'KRW', saleDiscntRate: null, saleDiscntAmt: null, purchasePrice: null, marginRate: null,
      platformFeeRate: null, platformFeeAmount: null,
      saleStartDate: '', saleEndDate: '', dispStartDate: '', dispEndDate: '',
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
      prodTypeCd: yup.string().required('상품유형을 선택해주세요.'),
      dlivTmpltId: yup.string().required('배송템플릿을 선택해주세요.'),
      stdPrice: yup.number().typeError('숫자 입력').min(0).required('정가를 입력해주세요.'),
      salePrice: yup.number().typeError('숫자 입력').min(0).required('판매가를 입력해주세요.'),
    });

    /* prodTypeCd 변경 시 현재 탭이 숨겨지면 info 로 자동 이탈 */
    watch(() => form.prodTypeCd, () => {
      const cur = tabs.find(t => t.id === topTab.value);
      if (cur && cur.visible === false) { topTab.value = 'info'; }
    });

    // -- 옵션 설정
        let _optSeq = 1, _itemSeq = 100;
    const optGroups = reactive([]); // [{_id, grpNm, level1Cd, level2Cd, level, items:[{_id, nm, val, prodOptStyle, parentOptId, sortOrd, useYn}]}]
    const skus = reactive([]);      // [{_id, _optKey, _nm1, _nm2, skuCode, addPrice, stock, useYn}]
    // -- 옵션 공통코드 (DB: PROD_OPT_CATEGORY 3단 트리 — sy_code.code_level + parent_code_value)
    //    level=1 : 옵션 카테고리        (parent=NULL)            — 옵션 카테고리 select
    //    level=2 : 옵션 유형(1·2단)     (parent=level1.code_value)— N단 유형 select
    //    level=3 : 값 프리셋            (parent=level2.code_value)— 공통코드ID select
    const PROD_OPT_GRP = 'PROD_OPT_CATEGORY';
    // svCodes row 원본 키(codeVal/codeNm/codeSortOrd/codeLevel/parentCodeValue) → 화면용 정규화
    //   codeId       : sy_code.code_id (예: CD000900)         — opt_item_val_code_id 저장용
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

    /* fnDateTime — 보기모드 날짜/시간 표시용 (YYYY-MM-DD HH:mm) */
    const fnDateTime = (v) => (v ? String(v).substring(0, 16).replace('T', ' ') : '-');

    /* fnRemainingTime — 종료일(LocalDate)까지 남은 기간을 년/월/일/시간 단위로 표시 (프로모션 적용기간 그리드용) */
    const fnRemainingTime = (endDate) => {
      if (!endDate) return '무기한';
      const end = new Date(String(endDate).slice(0, 10) + 'T23:59:59');
      const diffMs = end.getTime() - Date.now();
      if (diffMs <= 0) return '만료';
      let hours = Math.floor(diffMs / 3600000);
      const years = Math.floor(hours / (24 * 365)); hours -= years * 24 * 365;
      const months = Math.floor(hours / (24 * 30)); hours -= months * 24 * 30;
      const days = Math.floor(hours / 24); hours -= days * 24;
      const parts = [];
      if (years) parts.push(years + '년');
      if (months) parts.push(months + '개월');
      if (days) parts.push(days + '일');
      parts.push(hours + '시간');
      return parts.join(' ');
    };

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
    // 3레벨 — level2Cd 기반 프리셋 값 목록 조회
    /* getOptValCodes — 조회 */
    const getOptValCodes = (level2Cd) => {
      if (!level2Cd) { return []; }
      return (codes||[])
        .filter(c => c.codeGrp === PROD_OPT_GRP && c.useYn === 'Y'
                  && Number(c.codeLevel||0) === 3
                  && c.parentCodeValue === level2Cd)
        .map(fnNorm)
        .sort(fnSortByOrd);
    };
    // level2Cd 라벨 lookup — 모든 카테고리 하위 2레벨 합집합
    const cfOptTypeAllCodes = computed(() =>
      (codes||[])
        .filter(c => c.codeGrp === PROD_OPT_GRP && c.useYn === 'Y' && Number(c.codeLevel||0) === 2)
        .map(fnNorm)
        .sort(fnSortByOrd)
    );



    // 단일 프리셋 → 옵션 행 객체 (sy_code level=3 프리셋 기반)
    /* fnPresetToItem — 유틸 */
    const fnPresetToItem = (preset, sortOrd, parentOptId) => {
      return {
        _id: _itemSeq++,
        nm:           preset ? (preset.codeLabel || preset.codeValue || '') : '',
        val:          preset ? (preset.codeValue || '') : '',
        stdCd:        preset ? (preset.codeValue || '') : '',
        prodOptStyle: preset ? (preset.codeOpt1 || '') : '',
        parentOptId:  parentOptId || '',
        sortOrd:      sortOrd,
        useYn:        'Y',
      };
    };

    // 1단 옵션 행: 해당 level2Cd 프리셋 전체를 정렬 순서대로 행으로 만듦
    /* fnBuildLevel1Items — 유틸 */
    const fnBuildLevel1Items = (level2Cd) => {
      const presets = level2Cd ? getOptValCodes(level2Cd) : [];
      if (presets.length && !presets[0].codeId) {
        console.warn('[PdProdDtl] 프리셋에 codeId 가 없습니다 — 백엔드 재기동/재로그인 필요', presets[0]);
      }
      // getOptValCodes 는 이미 sortOrd 오름차순 정렬됨
      return presets.map((p, i) => fnPresetToItem(p, i + 1, ''));
    };

    // 2단 옵션 행: 프리셋에서 독립 행 빌드 (1단과 N×M 결합 없음 — SKU 생성 시 조합)
    /* fnBuildLevel2Items — 유틸 */
    const fnBuildLevel2Items = (level2Cd) => {
      const presets = level2Cd ? getOptValCodes(level2Cd) : [];
      return presets.map((p, i) => fnPresetToItem(p, i + 1, ''));
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
      slots.forEach((t, i) => {
        const level = i + 1;
        const items = level === 1
          ? fnBuildLevel1Items(t.codeValue)
          : fnBuildLevel2Items(t.codeValue);
        optGroups.push({
          _id: _optSeq++,
          grpNm:    t.codeLabel || t.codeValue,
          level1Cd: uiState.prodOptCategoryTypeCd || '',
          level2Cd: t.codeValue,
          level,
          items,
        });
      });
      generateSkus();
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
      const used = new Set(optGroups.map(g => g.level2Cd).filter(Boolean));
      const next = types.find(t => !used.has(t.codeValue)) || types[optGroups.length] || null;
      const level = optGroups.length + 1;
      const items = level === 1
        ? fnBuildLevel1Items(next ? next.codeValue : '')
        : fnBuildLevel2Items(next ? next.codeValue : '');
      optGroups.push({
        _id: _optSeq++,
        grpNm:    next ? (next.codeLabel || next.codeValue) : '옵션',
        level1Cd: uiState.prodOptCategoryTypeCd || '',
        level2Cd: next ? next.codeValue : '',
        level,
        items,
      });
      generateSkus();
    };

    /* ── 기본정보 [옵션상품] 그룹의 옵션1/옵션2 유형 select 전용 헬퍼 ─────────────
       optGroups 는 "있으면 1단, 하나 더 있으면 2단" 인 가변 배열이라 폼의 고정 2필드와 모양이 다르다.
       그 간극을 여기서 흡수한다 — 폼은 항상 옵션1/옵션2 두 칸을 보여주고, 배열은 필요할 때 늘고 준다. */

    /* fnOptGrpType — 해당 단의 현재 유형 코드 (그룹이 아직 없으면 빈 값) */
    const fnOptGrpType = (level) => (optGroups[level - 1] ? (optGroups[level - 1].level2Cd || '') : '');

    /* fnOptGrpTypeLabel — 보기모드 표시용 라벨 */
    const fnOptGrpTypeLabel = (level) => {
      const cv = fnOptGrpType(level);
      if (!cv) { return '-'; }
      const found = cfOptTypeCodes.value.find(c => c.codeValue === cv);
      return found ? (found.codeLabel || cv) : cv;
    };

    /* onOptGrpTypeChange — 옵션1/옵션2 유형 변경.
       - 그룹이 아직 없으면 만들어서(addOptGroup) 채운다 — 카테고리에 유형이 1개뿐이면 2단이 없다
       - 빈 값을 고르면 2단은 제거(= 1차원 옵션상품). 1단은 옵션상품의 최소 구성이라 남긴다 */
    const onOptGrpTypeChange = (level, codeValue) => {
      if (!codeValue) {
        if (level === 2 ? !!optGroups[1] : false) { removeOptGroup(1); }
        return;
      }
      if (!uiState.prodOptCategoryTypeCd) { showToast('옵션 카테고리를 먼저 선택해주세요.', 'error'); return; }
      while (optGroups.length < level) { addOptGroup(); }
      const grp = optGroups[level - 1];
      if (!grp) { return; }
      const found = (getOptTypeCodes(uiState.prodOptCategoryTypeCd) || []).find(t => t.codeValue === codeValue);
      grp.level2Cd = codeValue;
      grp.grpNm    = found ? (found.codeLabel || codeValue) : codeValue;
      const items  = level === 1 ? fnBuildLevel1Items(codeValue) : fnBuildLevel2Items(codeValue);
      grp.items.splice(0, grp.items.length, ...items);
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
      grp.items.push({ _id: _itemSeq++, nm: '', val: '', stdCd: '', prodOptStyle: '', parentOptId: '', sortOrd: grp.items.length + 1, useYn: 'Y' });
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

    /* cfProdFlags — 신상품/베스트/성인상품/당일배송/강제품절 5개 Y/N 필드를 BoMultiCheckSelect 용
       콤마 결합 문자열로 가교. get: 현재 Y 인 필드들의 key 나열. set: 체크된 key 만 Y, 나머지 N. */
    const cfProdFlags = computed({
      get: () => PROD_FLAG_OPTIONS.filter(o => form[o.value] === 'Y').map(o => o.value).join(','),
      set: (val) => {
        const active = new Set((val || '').split(',').filter(Boolean));
        PROD_FLAG_OPTIONS.forEach(o => { form[o.value] = active.has(o.value) ? 'Y' : 'N'; });
      },
    });

    /* fnEnforceBaseSku — 정책: 옵션상품의 첫 번째 옵션조합(기준상품)은 추가금액 0원 고정.
       상품목록/홈 화면은 sale_price(추가금 미포함)를 대표가로 보여주므로, 그 가격이 실제
       구매 가능한 조합과 일치하려면 최소 1개(첫 조합)는 add_price=0 이어야 한다. */
    const fnEnforceBaseSku = () => { if (skus.length) skus[0].addPrice = 0; };
    /* cfBaseSkuId — 기준상품(첫 번째 옵션조합) SKU의 _id. 필터링된 목록에서도 원본 skus[0] 기준으로 판정 */
    const cfBaseSkuId = computed(() => skus[0]?._id || null);

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
            : { _id: 'sku_' + i1._id, _optKey: key, _nm1: i1.nm, _nm2: '', skuCode: '', stockCode: '', addPrice: 0, stock: 0, useYn: 'Y', statusCd: 'ON_SALE', saleCnt: 0 });
        });
      } else {
        window.safeArrayUtils.safeForEach(g1, i1 => window.safeArrayUtils.safeForEach(g2, i2 => {
          const key = i1._id + '_' + i2._id;
          newSkus.push(existMap[key]
            ? { ...existMap[key], _nm1: i1.nm, _nm2: i2.nm }
            : { _id: 'sku_' + key, _optKey: key, _nm1: i1.nm, _nm2: i2.nm, skuCode: '', stockCode: '', addPrice: 0, stock: 0, useYn: 'Y', statusCd: 'ON_SALE', saleCnt: 0 });
        }));
      }
      skus.splice(0, skus.length, ...newSkus);
      fnEnforceBaseSku();
    };
    const cfTotalStock = computed(() => safeFilter(skus, s => s.useYn === 'Y').reduce((a, s) => a + (Number(s.stock) || 0), 0));

    /* ── SKU 매트릭스 편집 (N×M) ─────────────────────────────────────────────
       144행 목록에서는 "XL 이상만 +2000" 같은 패턴도, 값이 비어 있는 조합도 보이지 않는다.
       조합 설정(useYn 토글)과 같은 격자에 값 필드 하나를 얹어 한 화면에서 채우게 한다.
       목록과 **같은 skus 배열을 직접 편집**하므로 두 뷰 사이에 동기화 로직이 없다.
       SKU코드·재고코드도 값 자체는 텍스트라 격자에 담을 수 있다(2026-08-25 추가) —
       다만 이 둘은 SKU마다 달라야 하는 식별자라 unique:true 로 표시하고,
       fnMxBulkGuard 가 이 플래그를 보고 행/열 일괄 채우기를 원천 차단한다
       (똑같은 코드를 여러 SKU에 한 번의 클릭으로 뿌리는 사고 방지). */
    const SKU_MX_FIELDS = [
      { key: 'addPrice',  label: '추가금액', type: 'number', unit: '원' },
      { key: 'stock',     label: '재고수량', type: 'number', unit: '개' },
      { key: 'statusCd',  label: '판매상태', type: 'select' },
      { key: 'skuCode',   label: 'SKU코드', type: 'text', unique: true },
      { key: 'stockCode', label: '재고코드', type: 'text', unique: true },
    ];
    /* fnMxField — 현재 편집 중인 필드 정의 */
    const fnMxField = () => SKU_MX_FIELDS.find(f => f.key === uiState.skuMxField) || SKU_MX_FIELDS[0];
    /* fnMxItems — 격자의 행(1단)·열(2단) 항목. 목록/조합설정과 동일한 "사용 + 이름 있음" 기준 */
    const fnMxItems = (level) => safeFilter(optGroups[level - 1]?.items || [], i => i ? (i.useYn === 'Y' ? !!String(i.nm || '').trim() : false) : false);
    /* fnMxSku — (1단, 2단) 교차점의 SKU 행 */
    const fnMxSku = (id1, id2) => skus.find(s => s ? s._optKey === (id1 + '_' + id2) : false) || null;
    /* fnMxOn — 그 조합이 활성(useYn=Y)인가. 비활성 셀은 흐리게 + 일괄 채우기 대상에서 제외 */
    const fnMxOn = (id1, id2) => { const s = fnMxSku(id1, id2); return s ? s.useYn === 'Y' : false; };

    /* ── 조합 설정(useYn 토글) 매트릭스 ─────────────────────────────────────
       예전엔 이 로직이 전부 템플릿 속성값 안의 즉시실행함수로 들어가 있었다.
       속성값에 `&&` 를 쓸 수 없어(런타임 컴파일러 크래시) `&amp;&amp;` 로 이스케이프해야 했고,
       한 줄이 300자를 넘어 읽을 수 없었다. setup 으로 빼면 그 제약이 사라진다. */
    const fnCombOn     = (i1, i2) => { const s2 = fnMxSku(i1._id, i2._id); return s2 ? s2.useYn === 'Y' : false; };
    const onCombChange = (i1, i2, v) => { const s2 = fnMxSku(i1._id, i2._id); if (s2) { s2.useYn = v ? 'Y' : 'N'; } };
    /* 행/열 머리글 클릭 — 그 줄이 전부 켜져 있으면 전부 끄고, 아니면 전부 켠다 */
    const fnCombToggle = (fixed, others, pick) => {
      const list = others.map(o => fnMxSku(...pick(fixed, o)));
      const allOn = list.every(x => (x ? x.useYn === 'Y' : false));
      list.forEach(x => { if (x) { x.useYn = allOn ? 'N' : 'Y'; } });
    };
    const onCombRow = (i1) => { if (!cfDtlMode.value) { fnCombToggle(i1, fnMxItems(2), (a, b) => [a._id, b._id]); } };
    const onCombCol = (i2) => { if (!cfDtlMode.value) { fnCombToggle(i2, fnMxItems(1), (a, b) => [b._id, a._id]); } };

    /* ── BoMatrix 어댑터 ─────────────────────────────────────────────────
       BoMatrix 는 콜백에 (행 항목, 열 항목) 객체를 넘긴다. 기존 헬퍼는 (id1, id2) 기반이라
       여기서만 얇게 변환한다 — 헬퍼 자체는 목록 뷰와 공유하므로 손대지 않는다. */
    const fnMxCell   = (i1, i2) => { const s2 = fnMxSku(i1._id, i2._id); return s2 ? s2[fnMxField().key] : ''; };
    const fnMxStyle  = (i1, i2) => fnMxCellStyle(i1._id, i2._id);
    const fnMxTitle  = (i1, i2) => (fnMxOn(i1._id, i2._id) ? '' : '비활성 조합 — 옵션설정 탭의 조합 설정에서 켜야 합니다');
    const onMxCellChange = (i1, i2, v) => {
      const sku = fnMxSku(i1._id, i2._id);
      if (sku) { sku[fnMxField().key] = v; }
    };

    /* fnMxCellStyle — 값 자체로 상태가 읽히게 한다.
       "0 원 / 재고 0" 을 눈에 띄게 해야 채우다 만 조합이 한눈에 드러난다. */
    const fnMxCellStyle = (id1, id2) => {
      const sku = fnMxSku(id1, id2);
      if (!sku) { return 'background:#fafafa;'; }
      if (sku.useYn !== 'Y') { return 'background:#f5f5f5;opacity:0.45;'; }
      const f = fnMxField();
      if (f.key === 'stock')    { return (Number(sku.stock) || 0) === 0 ? 'background:#fff1f0;' : ''; }
      if (f.key === 'addPrice') { return (Number(sku.addPrice) || 0) === 0 ? '' : 'background:#f6ffed;'; }
      if (f.key === 'statusCd') {
        return sku.statusCd === 'SOLD_OUT' ? 'background:#fffbe6;' : (sku.statusCd === 'SUSPENDED' ? 'background:#fff1f0;' : '');
      }
      return '';
    };

    /* fnMxApply — 대상 SKU 들에 현재 일괄값을 적용. 반환값은 실제로 바뀐 셀 수 */
    const fnMxApply = (targets) => {
      const f   = fnMxField();
      const raw = uiState.skuMxBulk;
      const val = f.type === 'number' ? (Number(raw) || 0) : raw;
      let n = 0;
      targets.forEach(sku => { if (sku ? sku.useYn === 'Y' : false) { sku[f.key] = val; n++; } });
      return n;
    };
    /* fnMxBulkGuard — 일괄값이 비었으면 막는다 (빈 값으로 전체를 밀어버리는 사고 방지).
       unique 필드(SKU코드/재고코드)는 애초에 여러 SKU에 같은 값을 넣으면 안 되므로
       행/열 일괄 채우기 자체를 막는다 — 개별 셀 입력만 허용. */
    const fnMxBulkGuard = () => {
      if (fnMxField().unique) {
        showToast(`${fnMxField().label} 은(는) SKU마다 달라야 해서 일괄 채우기를 지원하지 않습니다. 셀을 하나씩 입력해주세요.`, 'error');
        return false;
      }
      if (String(uiState.skuMxBulk || '').trim() === '') {
        showToast('먼저 [일괄값] 을 입력한 뒤 행/열 헤더를 클릭하세요.', 'error');
        return false;
      }
      return true;
    };
    /* onMxFillRow / onMxFillCol — 행·열 헤더 클릭 시 그 줄 전체를 일괄값으로 채운다
       (조합 설정의 행/열 토글과 같은 조작감. 비활성 조합은 건너뛴다) */
    const onMxFillRow = (i1) => {
      if (cfDtlMode.value || !fnMxBulkGuard()) { return; }
      const n = fnMxApply(fnMxItems(2).map(i2 => fnMxSku(i1._id, i2._id)));
      showToast(`${i1.nm} 행 ${n}개 조합에 적용했습니다.`, 'success');
    };
    const onMxFillCol = (i2) => {
      if (cfDtlMode.value || !fnMxBulkGuard()) { return; }
      const n = fnMxApply(fnMxItems(1).map(i1 => fnMxSku(i1._id, i2._id)));
      showToast(`${i2.nm} 열 ${n}개 조합에 적용했습니다.`, 'success');
    };
    /* onMxFillAll — 전체 적용만 confirm 을 받는다. 한 번에 100+ 셀을 덮어쓰는 건
       행/열 채우기(십여 셀, 눈으로 확인 가능)와 성격이 다르다. */
    const onMxFillAll = async () => {
      if (cfDtlMode.value || !fnMxBulkGuard()) { return; }
      const f = fnMxField();
      const targets = [];
      fnMxItems(1).forEach(i1 => fnMxItems(2).forEach(i2 => targets.push(fnMxSku(i1._id, i2._id))));
      const cnt = targets.filter(s => s ? s.useYn === 'Y' : false).length;
      const ok = await showConfirm('전체 적용',
        `활성 조합 ${cnt}개의 [${f.label}] 을(를) "${uiState.skuMxBulk}" 로 모두 덮어씁니다.
계속하시겠습니까?`);
      if (!ok) { return; }
      showToast(`${fnMxApply(targets)}개 조합에 적용했습니다.`, 'success');
    };

    // -- SKU 행 이동 (위/아래 한 칸) — 원본 skus 배열 인덱스 기준 swap
    /* moveSku — 이동 */
    const moveSku = (sku, dir) => {
      const idx = skus.findIndex(s => s._id === sku._id);
      if (idx === -1) { return; }
      const target = idx + (dir === 'up' ? -1 : 1);
      if (target < 0 || target >= skus.length) { return; }
      const [moved] = skus.splice(idx, 1);
      skus.splice(target, 0, moved);
      fnEnforceBaseSku();
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
    /* 파일 교체 — 어느 행을 바꾸는 중인지 기억해 둘 별도 input.
       추가(onFileChange)는 multiple 이라 같은 input 을 쓰면 "교체"인지 "추가"인지 구분할 수 없다. */
    const replaceInputRef = ref(null);
    const replaceImgId = ref(null);

    /* fnOpt1KeyOf — 옵션1 항목 → pd_prod_img.prod_opt1_id 에 저장되는 키 (행 select 의 :value 와 동일 규칙) */
    const fnOpt1KeyOf = (item) => (item ? (item.val || String(item._id)) : '');
    /* fnNormOpt1Key — 그룹 key → 실제 저장값. '__etc__'(고아 그룹)는 공통으로 취급 */
    const fnNormOpt1Key = (key) => (key === '__etc__' || !key ? '' : key);

    /* cfImgGroups — 이미지를 옵션1(색상) 그룹으로 묶는다.
       옵션상품 이미지는 "색상 단위로 여러 장" 이 실무 기본이라, 평면 목록보다 그룹이 훨씬 읽기 쉽다.
       - 그룹 순서: 공통(NULL) → 옵션설정 탭의 옵션1 항목 순서(배열 순서 = 정렬순서)
       - items 의 idx 는 images 원본 인덱스 — 순서변경 드래그/대표/삭제가 그대로 동작해야 한다
       - 옵션설정에서 지워진 옵션값을 물고 있는 이미지는 '__etc__' 그룹으로 모아 눈에 띄게 한다
         (그렇게 안 하면 화면에서 조용히 사라져 저장 시 통째로 날아간다) */
    const cfImgGroups = computed(() => {
      const opt1Items = optGroups[0]?.items || [];
      const hasOpt1 = opt1Items.length > 0;
      const groups = [{ key: '', label: hasOpt1 ? '공통 (옵션 무관)' : '이미지', isEtc: false, items: [] }];
      opt1Items.forEach((it) => {
        if (!it) { return; }
        groups.push({ key: fnOpt1KeyOf(it), label: (it.nm || '(이름 없음)') + (it.val ? ' (' + it.val + ')' : ''), isEtc: false, items: [] });
      });
      const byKey = new Map(groups.map(g => [g.key, g]));
      const etc = { key: '__etc__', label: '옵션값 없음', isEtc: true, items: [] };
      images.forEach((img, idx) => {
        if (!img) { return; }
        const g = byKey.get(img.prodOpt1Id || '');
        (g || etc).items.push({ img, idx });
      });
      if (etc.items.length) { groups.push(etc); }
      return groups;
    });

    /* fnUploadFilesTo — 파일 목록을 특정 옵션1 그룹으로 업로드. [+ 파일 선택]과 파일 드롭이 공용한다.
       base64 인코딩 대신 실제 업로드(coApiSvc.cmUpload)로 CDN URL 확보 —
       sy_attach 에 물리 저장되고, attachId 는 저장 시 pd_prod_img.attach_id 로 연계된다. */
    const fnUploadFilesTo = async (fileList, opt1Key) => {
      const files = Array.from(fileList || []);
      if (!files.length) { return; }
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      fd.append('businessCode', 'PROD_IMG');
      try {
        const res = await window.coApiSvc.cmUpload.uploadMulti(fd, '상품관리', '이미지업로드');
        const uploaded = res.data?.data?.files || [];
        uploaded.forEach(f => {
          images.push({
            id: imgIdSeq++, attachId: f.attachId, _persisted: false,
            previewUrl: f.cdnImgUrl || '',
            prodOpt1Id: fnNormOpt1Key(opt1Key), prodOpt2Id: '',
            isMain: images.length === 0,
          });
        });
      } catch (err) {
        showToast(coUtil.cofErrMsg(err, '이미지 업로드 중 오류가 발생했습니다.'), 'error', 0);
      }
    };

    /* triggerFileInput — 어느 그룹에 넣을지 기억해 두고 파일 선택창을 연다 */
    const triggerFileInput = (opt1Key) => {
      if (cfDtlMode.value) { return; }
      uiState.uploadOpt1 = fnNormOpt1Key(opt1Key);
      fileInputRef.value?.click();
    };

    /* addImageByUrl — 해당 그룹에 URL 입력용 빈 행 추가 */
    const addImageByUrl = (opt1Key) => {
      if (cfDtlMode.value) { return; }
      images.push({ id: imgIdSeq++, previewUrl: '', isMain: images.length === 0,
        prodOpt1Id: fnNormOpt1Key(opt1Key), prodOpt2Id: '' });
    };

    /* onFileChange — 파일 선택창 결과. 대상 그룹은 triggerFileInput 이 심어둔 uploadOpt1 */
    const onFileChange = async (e) => {
      const files = Array.from(e.target.files || []);
      e.target.value = '';
      await fnUploadFilesTo(files, uiState.uploadOpt1);
    };

    /* onImgGroupDragOver / DragLeave / Drop — 그룹 카드에 대한 드래그드롭.
       OS 파일 드롭과 "행 순서변경" 내부 드롭이 같은 drop 이벤트를 타므로 dataTransfer.files 로 구분한다.
       (내부 순서변경엔 files 가 비어 있다 — 그 경우 그룹 간 이동으로 보고 옵션1 을 재지정한다) */
    const fnIsFileDrag = (e) => Array.from(e?.dataTransfer?.types || []).includes('Files');
    const onImgGroupDragOver = (e, key) => {
      if (cfDtlMode.value) { return; }
      if (!fnIsFileDrag(e)) { return; }
      uiState.dropOpt1 = key;
    };
    const onImgGroupDragLeave = (key) => { if (uiState.dropOpt1 === key) { uiState.dropOpt1 = null; } };
    const onImgGroupDrop = async (e, key) => {
      uiState.dropOpt1 = null;
      if (cfDtlMode.value) { return; }
      if (fnIsFileDrag(e)) { await fnUploadFilesTo(e.dataTransfer?.files, key); return; }
      /* 내부 드래그: 다른 그룹으로 끌어다 놓았으면 그 그룹의 옵션1 로 옮긴다.
         (행의 onImgDrop 이 먼저 순서변경을 끝내고 dragImgIdx 를 지우므로 id 로 대상을 찾는다) */
      const target = uiState.dragImgId != null ? images.find(i => i ? i.id === uiState.dragImgId : false) : null;
      if (!target) { return; }
      const newKey = fnNormOpt1Key(key);
      if ((target.prodOpt1Id || '') === newKey) { return; }
      target.prodOpt1Id = newKey;
      target.prodOpt2Id = '';
      showToast('옵션1 을 "' + (cfImgGroups.value.find(g => g.key === key)?.label || '공통') + '" 으로 변경했습니다.', 'success');
    };

    /* triggerReplaceFile / onReplaceFileChange — 이미 등록된 이미지의 파일만 바꾼다.
       삭제 후 재등록과 달리 순서·대표여부·옵션 지정(opt_id_1/2)이 그대로 유지된다.
       기존 attachId 는 저장 시 백엔드가 "더 이상 참조되지 않는 첨부"로 판단해 정리한다. */
    const triggerReplaceFile = (id) => {
      if (cfDtlMode.value) { return; }
      replaceImgId.value = id;
      replaceInputRef.value?.click();
    };
    const onReplaceFileChange = async (e) => {
      const f = (e.target.files || [])[0];
      e.target.value = '';
      const targetId = replaceImgId.value;
      replaceImgId.value = null;
      if (!f || targetId == null) { return; }
      const target = images.find(i => i && i.id === targetId);
      if (!target) { return; }
      try {
        const fd = new FormData();
        fd.append('files', f);
        fd.append('businessCode', 'PROD_IMG');
        const res = await window.coApiSvc.cmUpload.uploadMulti(fd, '상품관리', '이미지교체');
        const up = (res.data?.data?.files || [])[0];
        if (!up) { throw new Error('업로드 결과를 받지 못했습니다.'); }
        target.previewUrl = up.cdnImgUrl || '';
        target.attachId   = up.attachId || null;
        showToast('파일이 교체되었습니다. [저장] 을 눌러야 반영됩니다.', 'success');
      } catch (err) {
        showToast(coUtil.cofErrMsg(err, '이미지 교체 중 오류가 발생했습니다.'), 'error', 0);
      }
    };

    /* syncImagesFromTabData — tabData.images(서버 최신 상태)를 화면 바인딩용 images 로 반영.
       handleLoadData() 는 tabData만 갱신하고 images 는 건드리지 않으므로, 서버 반영 결과를
       화면에 실제로 비추려면(저장 직후 재조회, 부모 reloadTrigger 재조회) 반드시 별도 호출해야 한다. */
    const syncImagesFromTabData = () => {
      /* ⚠️ 업로드했지만 아직 [저장]하지 않은 항목(_persisted === false)은 절대 버리면 안 된다.
         부모 Mng 의 reloadTrigger 나 저장 직후 재조회가 이 함수를 부르는데, 그때 미저장 업로드분을
         날려버리면 사용자는 이미지가 사라진 채로 [저장]하게 되고 → 서버의 기존 이미지까지
         전체 삭제된다(PUT /images 는 전체 교체 방식). 실제로 이 경로로 이미지가 유실됐다. */
      const pending = images.filter(i => i && i._persisted === false);
      if (tabData.images.length) {
        images.splice(0, images.length, ...tabData.images, ...pending);
      } else {
        const p = products[0] || null;
        if (pending.length) { images.splice(0, images.length, ...pending); }
        else if (p?.mainImage) { images.splice(0, images.length, { id: imgIdSeq++, previewUrl: p.mainImage, isMain: true, prodOpt1Id: '', prodOpt2Id: '', _persisted: true }); }
        else { images.splice(0, images.length); }
      }
      if (images.length && !images.some(i => i.isMain)) { safeFirst(images).isMain = true; }
    };

    /* setMain — 설정 */
    const setMain = (id) => window.safeArrayUtils.safeForEach(images, img => { img.isMain = img.id === id; });

    /* removeImage — 제거. 이번 세션에 새로 업로드만 되고 아직 저장 전인 이미지는 물리 파일도 즉시 삭제
       (미저장 상태로 남겨두면 어차피 재사용되지 않고 고아 상태로만 남음) */
    const removeImage = (id) => {
      const idx = images.findIndex(img => img.id === id);
      if (idx === -1) return;
      const target = images[idx];
      const wasMain = target.isMain;
      images.splice(idx, 1);
      if (wasMain && images.length) safeFirst(images).isMain = true;
      if (target.attachId && !target._persisted) {
        window.coApiSvc.cmAttach.deleteFile(target.attachId).catch(err => console.error('[PdProdDtl] 이미지 파일 삭제 실패', err));
      }
    };
    // 2단 옵션 라벨 — 상위옵션값(parent_opt_item)이 있으면 "상위 > 본인" 형식으로 표시
    /* fnOptItem2Label — 유틸 */
    const fnOptItem2Label = (item) => {
      if (!item) { return ''; }
      const baseLabel = (item.nm || '') + (item.val ? ' (' + item.val + ')' : '');
      const parentKey = item.parentOptId;
      if (!parentKey) { return baseLabel; }
      const parents = optGroups[0]?.items || [];
      const p = parents.find(pi => String(pi._id) === String(parentKey) || pi.val === parentKey);
      if (!p) { return baseLabel; }
      const parentLabel = (p.nm || '') + (p.val ? ' (' + p.val + ')' : '');
      return parentLabel + ' > ' + baseLabel;
    };

    // -- 이미지 드래그 정렬
            const onImgDragStart = (idx) => { uiState.dragImgIdx = idx; uiState.dragImgId = images[idx]?.id ?? null; };

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
      contentBlocks.push({ _id: _blockSeq++, type, content: '', fileName: '', attachId: null, _persisted: false });
    };

    /* fnDeleteBlockAttachIfPending — 이번 세션에 새로 업로드만 되고 아직 저장 전인 블록 파일은
       물리 파일도 즉시 삭제 (미저장 상태로 남겨두면 고아 상태로만 남음) */
    const fnDeleteBlockAttachIfPending = (block) => {
      if (block?.attachId && !block._persisted) {
        window.coApiSvc.cmAttach.deleteFile(block.attachId).catch(err => console.error('[PdProdDtl] 첨부 파일 삭제 실패', err));
      }
    };

    /* removeContentBlock — 제거 */
    const removeContentBlock = (idx) => {
      fnDeleteBlockAttachIfPending(contentBlocks[idx]);
      contentBlocks.splice(idx, 1);
    };

    /* onBlockFileChange — 이벤트. base64 인코딩 대신 실제 업로드(coApiSvc.cmUpload)로 CDN URL 확보 */
    const onBlockFileChange = async (block, e) => {
      const file = e.target.files[0]; e.target.value = '';
      if (!file) return;
      fnDeleteBlockAttachIfPending(block);   // 재선택 시 기존 미저장 업로드 파일 정리
      const fd = new FormData();
      fd.append('files', file);
      fd.append('businessCode', 'PROD_CONTENT');
      try {
        const res = await window.coApiSvc.cmUpload.uploadMulti(fd, '상품관리', '상품설명파일업로드');
        const uploaded = (res.data?.data?.files || [])[0];
        if (!uploaded) return;
        block.attachId = uploaded.attachId;
        block.content = uploaded.cdnImgUrl || '';
        block.fileName = uploaded.originalName || file.name;
        block._persisted = false;
      } catch (err) {
        showToast(coUtil.cofErrMsg(err, '파일 업로드 중 오류가 발생했습니다.'), 'error', 0);
      }
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

    /* 판매할인 3방향 동기화 (정가 대비) — 할인율/할인금액/판매가 중 어느 것을 고쳐도 나머지 자동 반영.
       discnt_amt(원)가 항상 최종 저장 기준값 — 할인율은 입력 편의용 보조 필드. */
    const fnSyncFromSaleDiscntRate = (form) => {
      const std = Number(form.stdPrice || 0);
      if (form.saleDiscntRate == null || form.saleDiscntRate === '') { form.saleDiscntAmt = null; return; }
      const amt = Math.round(std * Number(form.saleDiscntRate) / 100);
      form.saleDiscntAmt = amt;
      form.salePrice = Math.max(0, std - amt);
    };
    const fnSyncFromSaleDiscntAmt = (form) => {
      const std = Number(form.stdPrice || 0);
      if (form.saleDiscntAmt == null || form.saleDiscntAmt === '') { form.saleDiscntRate = null; return; }
      const amt = Number(form.saleDiscntAmt);
      form.salePrice = Math.max(0, std - amt);
      form.saleDiscntRate = std > 0 ? Math.round((amt / std) * 10000) / 100 : null;
    };
    const fnSyncFromSalePrice = (form) => {
      const std = Number(form.stdPrice || 0);
      if (std <= 0) { form.saleDiscntAmt = null; form.saleDiscntRate = null; return; }
      const amt = std - Number(form.salePrice || 0);
      form.saleDiscntAmt = amt;
      form.saleDiscntRate = Math.round((amt / std) * 10000) / 100;
    };
    // 정가 변경 시 재기준: 할인율이 설정돼 있으면 할인율 기준으로, 없고 할인금액만 있으면 금액 고정 기준으로 재계산.
    // 둘 다 없으면(레거시 상품) 판매가를 건드리지 않는다.
    const fnSyncFromStdPrice = (form) => {
      const std = Number(form.stdPrice || 0);
      if (form.saleDiscntRate != null && form.saleDiscntRate !== '') {
        const amt = Math.round(std * Number(form.saleDiscntRate) / 100);
        form.saleDiscntAmt = amt;
        form.salePrice = Math.max(0, std - amt);
      } else if (form.saleDiscntAmt != null && form.saleDiscntAmt !== '') {
        form.salePrice = Math.max(0, std - Number(form.saleDiscntAmt));
        form.saleDiscntRate = std > 0 ? Math.round((Number(form.saleDiscntAmt) / std) * 10000) / 100 : null;
      }
    };

    // -- 계산값
    const cfMarginRateCalc = computed(() => {
      if (!form.salePrice || !form.purchasePrice) { return null; }
      return ((form.salePrice - form.purchasePrice) / form.salePrice * 100).toFixed(2);
    });

    // -- 연관상품 / 코드상품
    let _relSeq = 1;
    const relProds  = reactive([]);  // [{ _id, productId, prodNm, category, price, stock, status }]
    const codeProds = reactive([]);  // 동일 구조

    // 상품 추가 피커 모달 — uiState.prodPickerOpen 을 template 에서 직접 참조 가능하도록 toRef
    const prodPickerOpen   = Vue.toRef(uiState, 'prodPickerOpen');

    /* openProdPicker — 열기 (좌:카테고리트리 + 우:상품목록 모달) */
    const openProdPicker = (type) => { uiState.prodPickerOpen = type; };

    /* selectProdItem — 선택 */
    const selectProdItem = (p) => {
      const row = { _id: _relSeq++, prodId: p.prodId, prodNm: p.prodNm,
        cateNm: p.cateNm || p.categoryNm || '',
        stdPrice: p.stdPrice || p.price || 0,
        prodStatusCd: p.prodStatusCd || '' };
      if (uiState.prodPickerOpen === 'rel') { relProds.push(row); }
      else { codeProds.push(row); }
      uiState.prodPickerOpen = '';
    };

    /* fnProdPickerCallback — BoProdCatePickModal 콜백 (선택 시 행 추가, 닫기 시 모달 종료) */
    const fnProdPickerCallback = (popCmd, param, result) => {
      if (popCmd !== 'cmPopup-prod-cate-pick') return;
      if (result == null) { uiState.prodPickerOpen = ''; return; }
      selectProdItem(result);
    };

    /* removeRelProd — 제거 */
    const removeRelProd  = (idx) => relProds.splice(idx, 1);

    /* removeCodeProd — 제거 */
    const removeCodeProd = (idx) => codeProds.splice(idx, 1);

    // 드래그 정렬 — 연관상품


    /* onRelDrop — 이벤트 */
    const onRelDrop = () => {
      if (uiState.dragRelIdx === null || uiState.dragRelIdx === uiState.dragoverRelIdx) { uiState.dragRelIdx = null; uiState.dragoverRelIdx = null; return; }
      const items = [...relProds]; const [m] = items.splice(uiState.dragRelIdx, 1); items.splice(uiState.dragoverRelIdx, 0, m);
      relProds.splice(0, relProds.length, ...items); uiState.dragRelIdx = null; uiState.dragoverRelIdx = null;
    };
    // 드래그 정렬 — 코드상품


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
      const id = cat.selId||cat.id;
      if (window.safeArrayUtils.safeSome(prodCategories, c => String(c.categoryId) === String(id))) { return; }
      prodCategories.push({ categoryId: id, categoryNm: cat.selName||cat.nm||String(id), depth: cat.depth||cat.categoryDepth||cat.level||1 });
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
    const addPlanRow = () => salePlans.unshift({ _id: planIdSeq++, _row_status: 'I', _checked: false, startDate: '', startTime: '00:00', endDate: '', endTime: '23:59', planStatus: '준비중', stdPrice: form.stdPrice || 0, salePrice: form.salePrice || 0, purchasePrice: form.purchasePrice || 0 });

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
    const selectMdUser = (u) => { form.mdUserId = u.selId; uiState.mdModalOpen = false; };

    /* handleInitForm — 처리 */
    const handleInitForm = async () => {
      if (cfIsNew.value) {
        form.mdUserId = cfMdUserList.value[0]?.userId || '';
        if (props.fixedProdTypeCd) { form.prodTypeCd = props.fixedProdTypeCd; }
      }
      if (!cfIsNew.value) {
        const p = products[0] || null;
        if (p) {
          form.prodId         = p.prodId;
          form.prodNm         = p.prodNm || '';
          props.setTabLabel(form.prodNm);
          form.prodCode       = p.prodCode || '';
          form.categoryId     = p.categoryId || '';
          form.brandId        = p.brandId || '';
          form.brandNm        = p.brandNm || '';
          form.vendorId       = p.vendorId || '';
          form.vendorNm       = p.vendorNm || '';
          form.mdUserId       = p.mdUserId || '';
          form.prodTypeCd     = p.prodTypeCd || 'SINGLE';
          form.prodStatusCd   = p.prodStatusCd || 'DRAFT';
          form.unsaleMsg      = p.unsaleMsg || '';
          form.dlivTmpltId    = p.dlivTmpltId || '';
          form.dlivMethodCd   = p.dlivMethodCd || '';
          form.stdPrice      = p.stdPrice || 0;
          form.salePrice      = p.salePrice || 0;
          form.currCd        = p.currCd || 'KRW';
          form.saleDiscntRate     = p.saleDiscntRate != null ? p.saleDiscntRate : null;
          form.saleDiscntAmt      = p.saleDiscntAmt  != null ? p.saleDiscntAmt  : null;
          form.purchasePrice  = p.purchasePrice || null;
          form.platformFeeRate   = p.platformFeeRate   != null ? p.platformFeeRate   : null;
          form.platformFeeAmount = p.platformFeeAmount != null ? p.platformFeeAmount : null;
          form.saleStartDate  = p.saleStartDate || '';
          form.saleEndDate    = p.saleEndDate || '';
          form.dispStartDate  = p.dispStartDate || '';
          form.dispEndDate    = p.dispEndDate || '';
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
          syncImagesFromTabData();

          // 상품설명 — tabData.content에서 채움
          // DB contentTypeCd (HTML/FILE/URL/IMAGE) → 클라이언트 type (html/file/url) 매핑
          const fnMapTypeCd = (cd) => {
            const v = String(cd || 'HTML').toUpperCase();
            if (v === 'FILE') { return 'file'; }
            if (v === 'URL') { return 'url'; }
            if (v === 'IMAGE') return 'file'; // IMAGE 는 첨부와 동일 표시
            return 'html';
          };
          if (tabData.content.length) {
            /* attachId 는 DB 컬럼이 아니라(이번 세션에 새로 업로드된 경우에만 존재) 재조회 시 항상 비움 —
               이미 연계된 파일의 물리 삭제는 하지 않는다(_persisted=true 라 즉시삭제 대상에서 제외됨) */
            contentBlocks.splice(0, contentBlocks.length, ...tabData.content.map(c => ({
              _id: _blockSeq++,
              type: fnMapTypeCd(c.contentTypeCd),
              content: c.contentHtml || '',
              fileName: c.fileName || '',
              attachId: null,
              prodContentId: c.prodContentId,
              _persisted: true,   // 서버에서 이미 저장된 블록 — 제거해도 즉시 물리삭제 대상 아님
            })));
          } else if (form.contentHtml) {
            contentBlocks.splice(0, contentBlocks.length, { _id: _blockSeq++, type: 'html', content: form.contentHtml, fileName: '', attachId: null, _persisted: true });
          }

          // 연관상품 — tabData.rels에서 채움
          if (tabData.rels.length) { relProds.splice(0, relProds.length, ...tabData.rels); }

          // SKU — tabData.skus에서 채움
          if (tabData.skus.length) { skus.splice(0, skus.length, ...tabData.skus); fnEnforceBaseSku(); }

          /* 옵션 카테고리 복원 — pd_prod.prod_opt_std_cd 가 1순위.
             그 컬럼이 비어 있는 과거 데이터만 optGroups 의 level1Cd 로 유추한다(폴백). */
          if (!uiState.prodOptCategoryTypeCd) {
            if (p.prodOptStdCd) {
              uiState.prodOptCategoryTypeCd = p.prodOptStdCd;
            } else if (optGroups.length) {
              const level1Cds = optGroups.map(g => g.level1Cd || '').filter(Boolean);
              if (level1Cds.length) { uiState.prodOptCategoryTypeCd = level1Cds[0]; }
            }
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
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      await handleLoadData();
      await handleInitForm();
    };
    onMounted(initPage);
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleLoadData();
      syncImagesFromTabData();
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
        catch (err) { err.inner.forEach(e => { errors[e.path] = e.message; }); coUtil.cofValidationToast(errors, showToast); return; }
        /* 카테고리는 별도 배열(prodCategories)이라 Yup 스키마로 못 잡음 — info 탭에서만 수동 검증 */
        if (tabId === 'info' && !prodCategories.length) {
          showToast('카테고리를 1개 이상 선택해주세요.', 'error');
          return;
        }
        /* 옵션상품 필수값 — "어떤 옵션 체계로 파는가" 가 없으면 SKU 자체를 만들 수 없다.
           옵션 표준코드는 uiState, 옵션1 은 optGroups[0] 에 있어 form 기반 Yup 이 못 잡는다. */
        if (tabId === 'info' ? form.prodTypeCd === 'OPTION' : false) {
          if (!uiState.prodOptCategoryTypeCd) {
            showToast('옵션 표준코드를 선택해주세요.', 'error');
            return;
          }
          if (!fnOptGrpType(1)) {
            showToast('옵션1을 선택해주세요.', 'error');
            return;
          }
        }

        const isCreate = !cfHasProdId.value; // info 신규
        const ok = await showConfirm(isCreate ? '등록' : '저장', isCreate ? '등록하시겠습니까?' : '저장하시겠습니까?');
        if (!ok) { return; }
        try {
          const payload = { ...form };
          /* 옵션 구성(표준코드/옵션1/옵션2)은 form 이 아니라 uiState·optGroups 에 있어서
             { ...form } 만으로는 pd_prod 의 3개 컬럼에 절대 도달하지 못한다.
             → 목록의 옵션카테고리/옵션1/옵션2 가 항상 "-" 로 보이던 원인. info 탭 저장 시 직접 싣는다.
             백엔드 VoUtil 은 null 필드를 "변경 없음" 으로 보고 건너뛰므로,
             지워야 할 때(단품 전환 등)는 null 이 아니라 '' 를 보내야 실제로 비워진다. */
          if (tabId === 'info') {
            const isOpt = form.prodTypeCd === 'OPTION';
            payload.prodOptStdCd   = isOpt ? (uiState.prodOptCategoryTypeCd || '') : '';
            payload.prodOpt1TypeCd = isOpt ? (fnOptGrpType(1) || '') : '';
            payload.prodOpt2TypeCd = isOpt ? (fnOptGrpType(2) || '') : '';
          }
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
          /* UX-bo §18: 저장 후 재조회 — 본 탭 + 첫 탭(info)이면 상위 Mng 도 */
          await handleLoadData();
          if (tabId === 'info') { try { await props.onListReload(); } catch (_) {} }
          _afterApiOk(res, isCreate ? '등록되었습니다. 다른 탭을 저장할 수 있습니다.' : '저장되었습니다.');
        } catch (err) { _afterApiErr(err); }
        return;
      }

      /* 그 외 탭: 부분 PUT — payload 에 해당 탭 데이터만 포함 */
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) { return; }

      const TAB_LABEL = { content: '상품설명', option: '옵션설정', price: '옵션(가격/재고)', bundle: '묶음구성', setitems: '세트구성', promo: '프로모션', image: '이미지', related: '연관상품', plan: '판매계획' };
      let payload = null;
      switch (tabId) {
        case 'plan': {
          payload = {
            plans: salePlans
              .filter(r => r._row_status !== 'D')
              .map(r => ({
                startDate: r.startDate || '', startTime: r.startTime || '00:00',
                endDate: r.endDate || '',     endTime: r.endTime || '23:59',
                planStatus: r.planStatus || 'SCHEDULED',
                stdPrice: r.stdPrice || null, salePrice: r.salePrice || null,
                purchasePrice: r.purchasePrice || null,
              })),
          };
          break;
        }
        case 'content':  payload = { contentBlocks: [...contentBlocks] }; break;
        case 'option': {
          // 옵션명 누락 자동 보정 (DB pd_prod_opt.prod_opt_nm 은 NOT NULL)
          optGroups.forEach((g, i) => {
            if (!g.grpNm || !String(g.grpNm).trim()) {
              g.grpNm = g.level2Cd || g.level1Cd || ('옵션' + (i + 1));
            }
          });
          // 백엔드 PdProdOptUpdateDto 필드명으로 변환 (optGroups → optTypes)
          payload = {
            optTypes: optGroups.map(g => ({
              _id:          g._id,
              optTypeNm:    g.grpNm,
              optTypeCd:    g.level2Cd || g.level1Cd || '',  // pd_prod.prod_opt_type{N}_cd 로 저장
              level1Cd:     g.level1Cd,
              level2Cd:     g.level2Cd,
              optTypeLevel: g.level,
              optVals: (g.items || []).map(it => ({
                _id:          it._id,
                nm:           it.nm,
                val:          it.val,
                stdCd:        it.stdCd || null,
                prodOptStyle: it.prodOptStyle,
                parentOptId:  it.parentOptId,
                sortOrd:      it.sortOrd,
                useYn:        it.useYn,
              })),
            })),
          };
          break;
        }
        case 'price':    payload = { skus: skus.map(s => ({ ...s, stockQty: s.stock ?? 0, prodSkuCode: s.skuCode || s.prodSkuCode || '' })) }; break;
        case 'bundle':   payload = { items: tabData.bundleItems.map(b => ({ prodId: b.itemProdId || b.prodId || null, qty: b.itemQty || 1, priceRate: b.priceRate || 0, sortOrd: b.sortOrd || 0 })) }; break;
        case 'setitems': payload = { items: tabData.setItems.map(s => ({ prodId: s.itemProdId || s.prodId || null, qty: s.itemQty || 1, itemDesc: s.itemDesc || '', sortOrd: s.sortOrd || 0 })) }; break;
        case 'image': {
          const imgRows = images.map(({ id, ...rest }) => rest);
          /* PUT /images 는 전체 교체다. 화면이 비었는데 서버엔 이미지가 있으면 전삭제가 되므로
             사고 방지를 위해 한 번 더 확인받는다(위 pending 보존과 함께 이미지 유실을 막는 2중 안전장치). */
          if (!imgRows.length && tabData.images.length) {
            const okDelAll = await showConfirm('이미지 전체 삭제',
              `등록된 이미지 ${tabData.images.length}건이 모두 삭제됩니다. 계속하시겠습니까?`);
            if (!okDelAll) { return; }
          }
          payload = { images: imgRows };
          break;
        }
        case 'related':  payload = { relProds, codeProds }; break;
        default:         payload = {}; break;
      }
      try {
        /* content / option / image / bundle / setitems 탭은 전용 엔드포인트로 분리 호출 */
        let res;
        if (tabId === 'content') {
          res = await boApiSvc.pdProd.saveContents(cfCurProdId.value, payload, '상품관리', '상품설명저장');
        } else if (tabId === 'option') {
          res = await boApiSvc.pdProd.saveOpts(cfCurProdId.value, payload, '상품관리', '옵션설정저장');
        } else if (tabId === 'image') {
          res = await boApiSvc.pdProd.saveImages(cfCurProdId.value, payload, '상품관리', '이미지저장');
        } else if (tabId === 'bundle') {
          res = await boApiSvc.pdBundle.updateItems(cfCurProdId.value, payload, '상품관리', '묶음구성저장');
        } else if (tabId === 'setitems') {
          res = await boApiSvc.pdSet.updateItems(cfCurProdId.value, payload, '상품관리', '세트구성저장');
        } else if (tabId === 'plan') {
          res = await boApiSvc.pdProd.savePlans(cfCurProdId.value, payload, '상품관리', '판매계획저장');
        } else {
          res = await boApiSvc.pdProd.update(cfCurProdId.value, payload, '상품관리', `${TAB_LABEL[tabId] || tabId}저장`);
        }
        /* UX-bo §18: 저장한 탭의 데이터를 다시 가져와 화면 동기화 */
        await handleLoadData();
        if (tabId === 'image') {
          /* 저장이 끝났으면 화면의 항목은 모두 서버에 반영된 상태다. _persisted 를 켜 두지 않으면
             바로 아래 sync 에서 "미저장 업로드분"으로 오인해 서버본 뒤에 한 번 더 붙어 중복된다. */
          images.forEach(i => { if (i) { i._persisted = true; } });
          syncImagesFromTabData();
        }
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
    const skuFilter1 = Vue.toRef(uiState, 'skuFilter1');
    const skuFilter2 = Vue.toRef(uiState, 'skuFilter2');
    const skuFilterStock = Vue.toRef(uiState, 'skuFilterStock');
    const splitPct = Vue.toRef(uiState, 'splitPct');

    // 묶음구성 상품 피커 상태
    let _bundleSeq = 1;
    const bundlePickerOpen = ref(false);


    /* addBundleItem — 묶음구성 행 추가 */
    const addBundleItem = (prod) => {
      if (!prod) {
        tabData.bundleItems.push({ _id: _bundleSeq++, itemProdId: null, itemProdNm: '', itemQty: 1, priceRate: 0, sortOrd: tabData.bundleItems.length + 1 });
      } else {
        const already = tabData.bundleItems.some(b => b.itemProdId === prod.selId);
        if (already) { showToast('이미 추가된 상품입니다.', 'error'); return; }
        tabData.bundleItems.push({ _id: _bundleSeq++, itemProdId: prod.selId, itemProdNm: prod.selName || '', itemQty: 1, priceRate: 0, sortOrd: tabData.bundleItems.length + 1 });
      }
      bundlePickerOpen.value = false;
    };

    /* removeBundleItem — 묶음구성 행 제거 */
    const removeBundleItem = (idx) => tabData.bundleItems.splice(idx, 1);

    const cfBundleRateSum = computed(() => tabData.bundleItems.reduce((s, b) => s + (Number(b.priceRate) || 0), 0));
    const cfBundleRateOk  = computed(() => cfBundleRateSum.value === 100 || tabData.bundleItems.length === 0);

    // 세트구성 상품 피커 상태
    let _setSeq = 1;
    const setPickerOpen = ref(false);


    /* addSetItem — 세트구성 행 추가 (상품 없이도 추가 가능) */
    const addSetItem = (prod) => {
      if (!prod) {
        tabData.setItems.push({ _id: _setSeq++, itemProdId: null, itemProdNm: '', itemQty: 1, itemDesc: '', sortOrd: tabData.setItems.length + 1 });
      } else {
        tabData.setItems.push({ _id: _setSeq++, itemProdId: prod.selId, itemProdNm: prod.selName || '', itemQty: 1, itemDesc: '', sortOrd: tabData.setItems.length + 1 });
      }
      setPickerOpen.value = false;
    };

    /* removeSetItem — 세트구성 행 제거 */
    const removeSetItem = (idx) => tabData.setItems.splice(idx, 1);

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    /* fnShareUrl — 이 상품 상세를 가리키는 독립 새창 딥링크 URL 생성 */
    const fnShareUrl = () => {
      const qs = new URLSearchParams();
      qs.set('page', 'pdProdDtl');
      qs.set('id', form.prodId);
      qs.set('embed', '1');
      return `${window.location.origin}${window.location.pathname}?${qs.toString()}`;
    };
    /* handleShareKakao — 카카오톡 공유(피드 카드, 상세보기 모드 전용) */
    const handleShareKakao = () => {
      try {
        window.coExtSdk.shareKakao({
          title: `상품 ${form.prodNm || form.prodId} - ShopJoy BO`,
          description: form.prodNm || '',
          imageUrl: window.location.origin + '/assets/img/shopjoy-share-og.png',
          url: fnShareUrl(),
        });
      } catch (e) {
        showToast(e.message || '카카오톡 공유를 열 수 없습니다.', 'error', 0);
      }
    };
    /* handleCopyLink — 순수 URL만 클립보드에 복사 (카카오톡 카드 없음) */
    const handleCopyLink = async () => {
      try {
        await navigator.clipboard.writeText(fnShareUrl());
        showToast('링크가 복사되었습니다.', 'success');
      } catch (e) {
        showToast(e.message || '링크 복사에 실패했습니다.', 'error', 0);
      }
    };
    /* pdfAreaRef — 상품 상세 카드 캡처 대상. handleExportPdf — PDF 다운로드(항상 노출) */
    const pdfAreaRef = ref(null);
    const pdfExporting = ref(false);
    const handleExportPdf = async () => {
      pdfExporting.value = true;
      try {
        const filename = coUtil.cofBuildExportFilename(`상품상세_${form.prodId || 'new'}.pdf`);
        await window.boUtil.bofExportPdf(pdfAreaRef.value, filename, showToast);
      } finally {
        pdfExporting.value = false;
      }
    };

    /* onPreview — 이벤트 */
    const onPreview = () => {
      if (!cfHasProdId.value) { showToast('상품 등록 후 미리보기 가능합니다.', 'error'); return; }
      /* FO 라우팅은 쿼리스트링 기반(?page=) — 2026-08-22 해시(#)에서 전환(SEO용) */
      window.open(`${window.pageUrl('index.html')}?page=prodView&prodid=${cfCurProdId.value}`, '_blank', 'width=1200,height=800,scrollbars=yes');
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
    // 묶음구성 그리드
    columns.bundleGrid = [
      { key: 'sortOrd',    label: '순서',  style: 'width:46px;', align: 'center', cellStyle: 'color:#888;' },
      { key: 'itemProdNm', label: '구성상품명', cellStyle: 'font-weight:600;',
        fmt: (v, row) => row.itemProdNm || '(직접입력)' },
      { key: 'itemQty',    label: '수량',  style: 'width:70px;', align: 'right', edit: 'number' },
      { key: 'priceRate',  label: '안분율(%)', style: 'width:90px;', align: 'right', edit: 'number',
        cellStyle: (v) => (Number(v) === 0 ? 'color:#f5222d;' : '') },
    ];
    // 세트구성 그리드
    columns.setGrid = [
      { key: 'sortOrd',    label: '순서',  style: 'width:46px;', align: 'center', cellStyle: 'color:#888;' },
      { key: 'itemProdNm', label: '구성품명', cellStyle: 'font-weight:600;',
        fmt: (v, row) => row.itemProdNm || '(비상품 구성품)' },
      { key: 'itemQty',    label: '수량',  style: 'width:70px;', align: 'right', edit: 'number' },
      { key: 'itemDesc',   label: '구성품 설명', edit: 'text', placeholder: '예: 선물박스, 엽서' },
    ];
    // 묶음/세트 상품 피커 공통 그리드
    // 상품 선택 모달 그리드
    columns.prodPickerGrid = [
      { key: 'productId', label: 'ID',       style: 'width:46px;', align: 'center', cellStyle: 'color:#888;' },
      { key: 'prodNm',    label: '상품명',   cellStyle: 'font-weight:600;' },
      { key: 'category',  label: '카테고리', style: 'width:80px;' },
      { key: 'price',     label: '가격',     style: 'width:90px;text-align:right;', align: 'right',
        fmt: (v, row) => (coUtil.cofWon(row.price)) },
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
        fmt: (v) => coUtil.cofWon(v) },
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
        fmt: (v, row) => (coUtil.cofWon(row.price)) },
      { key: '_stock',    label: '재고',   style: 'width:60px;text-align:right;', align: 'right',
        fmt: (v, row) => (row.stock + '개') },
      { key: '_status',   label: '상태',   style: 'width:60px;',
        badge: (row) => (row.status === '판매중' ? 'badge-green' : 'badge-gray'), fmt: (v, row) => row.status },
      { key: '_act',      label: '관리',   style: 'width:54px;text-align:center;' },
    ];
    /* BoGrid 컬럼 — 판매계획 (selectable + 인라인 편집)
     * _start/_end: bo-date-time-picker 커스텀 컴포넌트 슬롯 KEEP
     * planStatus/stdPrice/salePrice/purchasePrice: BoGrid edit 자동 렌더 (@cell-change 미사용, change 시 onPlanChange 호출 위해 슬롯 유지)
     */
    columns.planGrid = [
      { key: '_start',       label: '시작일시', style: 'width:196px;',
        dateTimePick: { dateKey: 'startDate', timeKey: 'startTime', showNow: false, showClear: false, dateWidth: '116px', timeWidth: '72px' } },
      { key: '_end',         label: '종료일시', style: 'width:196px;',
        dateTimePick: { dateKey: 'endDate', timeKey: 'endTime', showNow: false, showClear: false, dateWidth: '116px', timeWidth: '72px' } },
      { key: 'planStatus',   label: '상태',    style: 'width:80px;',
        edit: 'select', options: () => grpCodes.PROD_PLAN_STATUS },
      { key: 'stdPrice',    label: '정가',    style: 'width:90px;', edit: 'number', align: 'right' },
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
      { type: 'group', label: '기본정보' },
      /* 기본정보 — "이 상품이 무엇이고 지금 어떤 상태인가". 상품 자체의 정체성만 둔다.
         소속(카테고리/브랜드/업체)과 사람(담당MD)은 아래 [담당] 그룹으로 분리했다. */
      { key: 'prodNm',       label: '상품명', type: 'text', required: true, placeholder: '상품명' },
      { key: 'prodCode',     label: '상품코드', type: 'text', placeholder: '예: SKU-20260419-001' },
      { key: 'prodTypeCd',   label: '상품유형', type: 'select', nullable: false, required: true,
        options: () => grpCodes.PROD_TYPE },
      { key: 'prodStatusCd', label: '상품상태', type: 'select',
        options: () => grpCodes.PROD_STATUS_CD,
        helpText: 'DRAFT(임시저장)/ACTIVE(전시중)/INACTIVE(판매중지)/ENDED(판매종료) 4종. "지금 판매중/판매예정/품절"인지는 이 상태가 아니라 판매기간·재고로 FO가 그때그때 판단 — ACTIVE(전시중)는 노출 여부만 뜻함. ACTIVE↔INACTIVE는 판매기간 벗어나면(또는 다시 들어오면) 매시간 배치가 자동 전환하고, DRAFT·ENDED는 배치가 절대 건드리지 않음(관리자만 전환).' },
      /* ── 옵션상품 전용 그룹 (상품유형이 OPTION 일 때만 통째로 노출) ──────────────
         옵션설정 탭 상단 바에 있던 3항목을 여기로 옮겼다. "어떤 옵션 체계로 팔 상품인가"는
         옵션 값을 채우기 전에 정해야 하는 상품의 기본 속성이라 기본정보가 맞는 자리다.
         옵션설정 탭은 이 3값을 읽어 값(항목) 편집과 SKU 생성만 담당한다.
         group 도 visible 을 지원하므로(BoAreaComp cfRows) 단품이면 섹션 제목까지 사라진다. */
      { type: 'group',       label: '옵션상품', visible: (f) => f.prodTypeCd === 'OPTION' },
      { key: '_optCategory', label: '옵션 표준코드', colNm: 'prod_opt_std_cd', type: 'slot', name: 'optCategory', required: true,
        visible: (f) => f.prodTypeCd === 'OPTION' },
      { key: '_optType1',    label: '옵션1', colNm: 'prod_opt1_type_cd', type: 'slot', name: 'optType1',
        required: true, visible: (f) => f.prodTypeCd === 'OPTION' },
      { key: '_optType2',    label: '옵션2', colNm: 'prod_opt2_type_cd', type: 'slot', name: 'optType2',
        visible: (f) => f.prodTypeCd === 'OPTION' },
      /* ── 그룹 — "이 상품이 어디에 속하고 누가 맡는가" ─────────────────────────
         카테고리·브랜드·업체는 소속, 담당MD 는 그 소속을 관리하는 사람이라 한 묶음으로 본다. */
      { type: 'group',       label: '그룹' },
      { key: '_categories',  label: '카테고리', colNm: 'pd_category_prod', type: 'slot', name: 'categories', required: true },
      { key: 'brandId',      label: '브랜드', type: 'slot', name: 'brand' },
      { key: 'vendorId',     label: '업체', type: 'slot', name: 'vendor' },
      { key: 'mdUserId',     label: '담당MD', type: 'slot', name: 'mdUser' },
      /* ── 가격 / 원가·마진·수수료 — 예전엔 별도 BoFormArea(columns.basePriceForm) 였다.
         가격 → 판매설정 → 배송 순으로 보이려면 한 폼 안에 있어야 순서를 잡을 수 있어 여기로 합쳤다. */
      { type: 'group', label: '가격',
        desc: '정가·판매가·판매할인율·판매할인금액은 서로 동기화됩니다 — 넷 중 어느 것을 고쳐도 나머지가 자동 재계산됩니다. '
          + '판매할인금액이 항상 "정가-판매가" 기준의 최종 저장값입니다. (pd_prod)' },
      { key: 'stdPrice',         label: '정가', type: 'number', required: true, min: 0, placeholder: '0',
        onChange: (v, form) => fnSyncFromStdPrice(form) },
      { key: 'salePrice',         label: '판매가', type: 'number', required: true, min: 0, placeholder: '0',
        onChange: (v, form) => fnSyncFromSalePrice(form) },
      { key: 'currCd',           label: '통화', type: 'select',
        options: () => [{ value: 'KRW', label: '원 (KRW)' }, { value: 'USD', label: '달러 (USD)' }, { value: 'CNY', label: '위안화 (CNY)' }, { value: 'JPY', label: '엔화 (JPY)' }],
        helpText: '금액 필드(정가/판매가 등)의 표시 기준 통화만 지정 — 환율 자동 변환은 하지 않음.' },
      { key: 'saleDiscntRate',        label: '판매할인율', type: 'number', min: 0, max: 100,
        placeholder: '(예: 20)', hint: '% — 입력 시 판매가 자동계산', onChange: (v, form) => fnSyncFromSaleDiscntRate(form) },
      { key: 'saleDiscntAmt',         label: '판매할인금액', type: 'number', min: 0,
        placeholder: '(원)', hint: '원 — 판매가·할인율에 항상 동기화되는 최종 기준값', onChange: (v, form) => fnSyncFromSaleDiscntAmt(form) },
      { type: 'group', label: '원가 · 마진 · 수수료' },
      { key: 'purchasePrice',     label: '매입가 / 원가', type: 'number', placeholder: '(선택)',
        hint: '내부관리용' },
      { key: '_marginRate',       label: '마진율', colNm: 'margin_rate', type: 'slot', name: 'marginRate' },
      { key: 'platformFeeRate',   label: '플랫폼수수료 율', type: 'number',
        placeholder: '(예: 5.5)', hint: '% — 내부관리용' },
      { key: 'platformFeeAmount', label: '플랫폼수수료 금액', type: 'number', min: 0,
        placeholder: '(요율과 둘 중 하나만 입력)', hint: '원 — 내부관리용' },
      { type: 'group', label: '판매설정',
        desc: '상품상태(PROD_STATUS_CD)는 DRAFT(임시저장)/ACTIVE(전시중)/INACTIVE(판매중지)/ENDED(판매종료) 4종뿐이다. '
          + '예전엔 판매예정·판매중·품절을 각각 다른 상태로 뒀지만, 이 셋은 노출(전시중) 여부와 무관하게 '
          + '"지금 진짜 살 수 있는가"만 다른 것이라 상태를 늘리는 대신 FO가 응답 시점에 판매기간(sale_start_date~'
          + 'sale_end_date)과 재고(sold_out_yn)를 직접 계산해서 판매예정/판매중/품절 배지를 매긴다 — ACTIVE(전시중)는 '
          + '"노출된다"만 뜻하고 실제 구매 가능 여부와는 별개다. '
          + 'ACTIVE↔INACTIVE는 판매기간을 벗어나면(또는 관리자가 종료일을 늘려 다시 기간 안으로 들어오면) 매시간 '
          + '배치가 자동으로 전환한다. DRAFT(작성 중)와 ENDED(관리자가 명시적으로 끝낸 판매종료)는 배치가 절대 '
          + '건드리지 않는다 — DRAFT는 미완성 초안이 날짜만으로 실수 공개되는 걸 막기 위함이고, ENDED는 관리자의 '
          + '최종 결정이라 날짜가 바뀐다고 되살아나면 안 되기 때문(되살리려면 관리자가 직접 ACTIVE로 전환). '
          + '전시기간은 상품페이지 노출 구간(disp_start_date~disp_end_date) — 이 기간 밖이면 상태가 ACTIVE여도 FO에 안 보인다. '
          + '판매·전시 시작일은 NOT NULL(미입력 시 등록시각 자동기입), 종료일은 NULL=무기한.' },
      // 5행: 판매상태(담당·상태 항목과 동일 값 — 판매기간 문맥에서 다시 확인하도록 중복 배치) / 미판매메시지 / 무게
      { key: 'prodStatusCd', label: '판매상태', type: 'select',
        options: () => grpCodes.PROD_STATUS_CD,
        helpText: 'ACTIVE(전시중)↔INACTIVE(판매중지)는 판매기간(위 시작/종료일)을 벗어나거나 다시 들어오면 매시간 배치가 자동 전환. 판매예정/품절 구분은 이 값이 아니라 FO가 판매기간·재고로 그때그때 계산. DRAFT·ENDED는 배치가 손대지 않는 관리자 전용 상태.' },
      { key: 'unsaleMsg',    label: '미판매메시지', type: 'text', placeholder: '예: 현재 판매 준비 중입니다.',
        hint: '판매불가 시 고객 노출' },
      { key: 'weight',       label: '무게', hint: 'kg', type: 'number', min: 0, placeholder: '예: 0.35' },
      // 6행: 사이즈 / 판매시작 / 판매종료
      { key: 'sizeInfoCd',   label: '사이즈', type: 'select',
        options: () => ['FREE','XS','S','M','L','XL','XXL'] },
      { key: 'saleStartDate', label: '판매 시작일시', type: 'slot', name: 'saleStart',
        hint: 'NULL=즉시' },
      { key: 'saleEndDate',   label: '판매 종료일시', type: 'slot', name: 'saleEnd',
        hint: 'NULL=무기한' },
      // 7행: 전시시작 / 전시종료 (빈칸 1) — 판매 전 상품페이지 노출 기간 (sale 기간보다 이르면 출시예정 표시)
      { key: 'dispStartDate', label: '전시 시작일시', type: 'slot', name: 'dispStart',
        hint: 'NULL=즉시. 판매시작일 이전이면 출시예정 표시' },
      { key: 'dispEndDate',   label: '전시 종료일시', type: 'slot', name: 'dispEnd',
        hint: 'NULL=무기한' },
      /* 상품 속성 — 예전엔 폼 밖에 33% 폭 div 로 따로 그렸는데, 판매설정에 속하는 값이라 폼 안으로 넣었다 */
      { key: '_prodFlags', label: '상품 속성', colNm: 'is_new / is_best / adlt_yn / same_day_dliv_yn / sold_out_yn',
        type: 'slot', name: 'prodFlags' },
      { type: 'group', label: '배송' },
      // 4행: 배송템플릿 / 배송방법 override (빈칸 1)
      { key: 'dlivTmpltId',  label: '배송템플릿', type: 'slot', name: 'dlivTmplt', required: true },
      { key: 'dlivMethodCd', label: '배송방법 override', type: 'select',
        options: () => grpCodes.DLIV_METHOD, nullLabel: '배송템플릿 기본값 사용',
        hint: '긴급 발송 등 이 상품만 다른 배송방법을 써야 할 때만 지정 (수수료는 배송수수료정책에 따름)' },
    ];
    // 상세설정 통합 (광고 노출 기간 + 구매 제한) — cols=3 한 행 3필드 채움
    columns.detailForm = [
      // 0행: 홍보문구 (전체 폭)
      { key: 'advrtStmt', label: '홍보문구', type: 'slot', name: 'advrtStmt', colSpan: 3 },
      // 1행: 광고 시작 / 광고 종료 / 최소구매수량
      { key: 'advrtStartDate', label: '광고 노출 시작', type: 'slot', name: 'advrtStart' },
      { key: 'advrtEndDate',   label: '광고 노출 종료', type: 'slot', name: 'advrtEnd' },
      { key: 'minBuyQty',      label: '최소구매수량 (min_buy_qty)', type: 'number', min: 1, placeholder: '1' },
      // 2행: 1회 최대 / 1일 최대 / ID당 누적 최대
      { key: 'maxBuyQty',      label: '1회 최대구매수량 (max_buy_qty)', type: 'number', min: 1, placeholder: '무제한' },
      { key: 'dayMaxBuyQty',   label: '1일 최대구매수량 (day_max_buy_qty)', type: 'number', min: 1, placeholder: '무제한' },
      { key: 'idMaxBuyQty',    label: 'ID당 누적 최대 (id_max_buy_qty)', type: 'number', min: 1, placeholder: '무제한' },
    ];
    // (광고 노출 기간 / 구매 제한은 detailFormColumns 로 통합됨 — 위 정의 참조)
    // 단일 재고 — pd_prod_stock 기반으로 별도 관리 (columns.singleStockForm 미사용)
    columns.singleStockForm = [];
    // 프로모션 탭 — 쿠폰 목록 그리드 (pm_coupon_item 행)
    columns.promoCouponGrid = [
      { key: 'couponId',     label: '쿠폰 ID', style: 'width:180px;', cellStyle: 'font-family:monospace;font-size:11px;color:#555;' },
      { key: 'targetTypeCd', label: '대상유형', style: 'width:90px;', align: 'center',
        badge: () => 'badge-blue', fmt: v => v || 'PRODUCT' },
      { key: 'applyStartDate', label: '적용시작일', align: 'center', fmt: v => v ? String(v).slice(0, 10) : '즉시' },
      { key: 'applyEndDate',   label: '적용종료일', align: 'center', fmt: v => v ? String(v).slice(0, 10) : '무기한' },
      { key: '_remainTime',    label: '남은기간', align: 'center', fmt: (v, r) => fnRemainingTime(r.applyEndDate) },
    ];
    // 프로모션 탭 — 적립금 목록 그리드 (pm_save_item 행)
    // ⚠ pm_save 는 정책 마스터가 아닌 회원별 적립/사용 원장(거래이력) 구조라 적용기간(시작/종료일) 개념이 없음
    //   — 쿠폰/할인/사은품과 달리 적용기간 컬럼 추가 보류 (2026-08-23, 별도 설계 결정 필요)
    columns.promoSaveGrid = [
      { key: 'saveId',     label: '적립금 ID', style: 'width:180px;', cellStyle: 'font-family:monospace;font-size:11px;color:#555;' },
      { key: 'targetTypeCd', label: '대상유형', style: 'width:90px;', align: 'center',
        badge: () => 'badge-blue', fmt: v => v || 'PRODUCT' },
      { key: 'regDate',    label: '연결일시', align: 'center',
        fmt: v => v ? String(v).slice(0, 16) : '' },
    ];
    // 프로모션 탭 — 할인 목록 그리드 (pm_discnt_item 행)
    columns.promoDiscntGrid = [
      { key: 'discntId',     label: '할인 ID', style: 'width:180px;', cellStyle: 'font-family:monospace;font-size:11px;color:#555;' },
      { key: 'targetTypeCd', label: '대상유형', style: 'width:90px;', align: 'center',
        badge: () => 'badge-blue', fmt: v => v || 'PRODUCT' },
      { key: 'applyStartDate', label: '적용시작일', align: 'center', fmt: v => v ? String(v).slice(0, 10) : '즉시' },
      { key: 'applyEndDate',   label: '적용종료일', align: 'center', fmt: v => v ? String(v).slice(0, 10) : '무기한' },
      { key: '_remainTime',    label: '남은기간', align: 'center', fmt: (v, r) => fnRemainingTime(r.applyEndDate) },
    ];
    // 프로모션 탭 — 사은품 조건 그리드 (pm_gift_cond 행)
    columns.promoGiftGrid = [
      { key: 'giftId',       label: '사은품 ID', style: 'width:180px;', cellStyle: 'font-family:monospace;font-size:11px;color:#555;' },
      { key: 'targetTypeCd', label: '대상유형', style: 'width:90px;', align: 'center',
        badge: () => 'badge-green', fmt: v => v || 'PRODUCT' },
      { key: 'condTypeCd',   label: '조건유형', style: 'width:100px;', align: 'center',
        fmt: v => v || '-' },
      { key: 'applyStartDate', label: '적용시작일', align: 'center', fmt: v => v ? String(v).slice(0, 10) : '즉시' },
      { key: 'applyEndDate',   label: '적용종료일', align: 'center', fmt: v => v ? String(v).slice(0, 10) : '무기한' },
      { key: '_remainTime',    label: '남은기간', align: 'center', fmt: (v, r) => fnRemainingTime(r.applyEndDate) },
    ];
    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns, handleBtnAction, fnCallbackModal,                    // dispatch + 모달 통합 콜백
      handleShareKakao, handleCopyLink, pdfAreaRef, pdfExporting, handleExportPdf,   // 링크/카카오공유/PDF
      cfIsNew, cfSaveDisabled, showTab, topTab, cfDtlMode, tabMode2, tabs, form, errors, codeGrpModal, openCodeGrpModal,
      tabPage, tabData, onTabPageChange, cfTabTotalPages, fnTabPageNos,
      uiState, mdModalOpen, cfMdUserListFiltered, cfMdSelectedNm, openMdModal, selectMdUser,
      optGroups, skus, cfTotalStock, generateSkus, moveSku,
      cfSkuFilter1Options, cfSkuFilter2Options, cfSkusFiltered, cfBaseSkuId, cfProdFlags, PROD_FLAG_OPTIONS,
      cfOptTypeAllCodes, cfOptTypeLevel1Codes, cfOptTypeCodes, getOptValCodes,
      fnBuildLevel1Items, fnBuildLevel2Items,
      onCategoryChange, addOptGroup, removeOptGroup, addOptItem, removeOptItem,
      fnOptGrpType, fnOptGrpTypeLabel, onOptGrpTypeChange,
      onOptItemDragStart, onOptItemDragOver, onOptItemDrop,
      images, addImageByUrl, onFileChange, setMain, removeImage, fileInputRef, triggerFileInput, fnOptItem2Label,
      cfImgGroups, onImgGroupDragOver, onImgGroupDragLeave, onImgGroupDrop,
      replaceInputRef, onReplaceFileChange,
      onImgDragStart, onImgDragOver, onImgDrop,
      prodCategories, cfCatExcludeSet, catPickerOpen, removeCategory,
      onCatDragStart, onCatDragOver, onCatDrop,
      relProds, codeProds, prodPickerOpen, openProdPicker, fnProdPickerCallback,
      removeRelProd, removeCodeProd,
      onRelDrop,
      onCodeDrop,
      bundlePickerOpen, addBundleItem, removeBundleItem, cfBundleRateSum, cfBundleRateOk,
      setPickerOpen, addSetItem, removeSetItem,
      cfPlanVisible, cfPlanAllChecked, addPlanRow, onPlanChange, deletePlanChecked,
      cfMarginRateCalc,
      SKU_MX_FIELDS, fnMxField, fnMxItems, fnMxSku, fnMxOn, fnMxCellStyle,
      onMxFillRow, onMxFillCol, onMxFillAll,
      fnMxCell, fnMxStyle, fnMxTitle, onMxCellChange,
      fnCombOn, onCombChange, onCombRow, onCombCol,
      contentBlocks, addContentBlock, removeContentBlock, onBlockFileChange,
      onBlockDragStart, onBlockDragOver, onBlockDrop,
      contentSplitRef, onDividerMousedown,
      prodOptCategoryTypeCd, openHelp,
      safeFirst, safeFind, safeFilter,
      grpCodes, fnProdTypeLabel,
      fnMdRowStyle, fnRemainSkuRowStyle, fnDateTime, fnRemainingTime,
      fnPlanRowChecked, onPlanToggleCheck, onPlanToggleCheckAll, fnPlanRowStyle2,
      dtlId: Vue.computed(() => props.dtlId),
      showToast,
      catDragoverIdx, dragBlockIdx, dragImgIdx, dragOptGrpId, dragOptItemIdx,
      dragoverBlockIdx, dragoverImgIdx, dragoverOptItemIdx, isDraggingDivider,
      previewDevice, skuFilter1, skuFilter2, skuFilterStock, splitPct,
      };
  },
  template: /* html */`
<div ref="pdfAreaRef">
<!-- ===== ■. 상세 카드 (제목 + 탭바 + 탭컨텐츠를 한 영역으로) ===================== -->
<bo-container :title="!active ? '상품 상세' : (cfIsNew ? (fnProdTypeLabel() ? fnProdTypeLabel() + ' 상품 등록' : '상품 등록') : (cfDtlMode ? (fnProdTypeLabel() ? fnProdTypeLabel() + ' 상품 상세' : '상품 상세') : (fnProdTypeLabel() ? fnProdTypeLabel() + ' 상품수정' : '상품 수정')))"
  :title-id="!active ? '' : (cfIsNew ? '' : form.prodId)">
  <template #toolbar-actions>
    <button v-if="active ? (!cfIsNew) : false" class="btn btn-sm" style="background:#fff;border:1px solid #d9d9d9;color:#555;font-weight:500;"
      title="사용자 페이스에서 상품 상세 미리보기" @click="handleBtnAction('form-preview')">
      👁 미리보기
    </button>
    <button v-if="active ? (cfDtlMode ? !cfIsNew : false) : false" class="btn btn_link" title="링크 공유(URL만)" @click="handleCopyLink">🔗</button>
    <button v-if="active ? (cfDtlMode ? !cfIsNew : false) : false" class="btn btn_kakao" title="카카오톡 공유" @click="handleShareKakao">💬</button>
    <button class="btn btn_pdf" title="PDF 다운로드" :disabled="pdfExporting" @click="handleExportPdf">
      <span v-if="pdfExporting">⏳</span>
      <svg v-else width="18" height="20" viewBox="0 0 32 36" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 2 H20 L28 10 V34 H4 Z" fill="#fff" stroke="#c2410c" stroke-width="1.5"/>
        <path d="M20 2 V10 H28 Z" fill="#f3d4c0"/>
        <rect x="2" y="20" width="28" height="12" rx="2" fill="#e2372c"/>
        <text x="16" y="29" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="#fff" text-anchor="middle">PDF</text>
      </svg>
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
        :readonly="cfDtlMode" :cols="3" compact plain-readonly :show-actions="false">
        <!-- 옵션 카테고리 — 옵션설정 탭에서 이동해 온 항목. 값이 바뀌면 onCategoryChange 가
             기존 옵션 구성 초기화 여부를 confirm 한 뒤 1단/2단 유형 후보를 갈아끼운다. -->
        <template #optCategory>
          <div v-if="cfDtlMode" class="readonly-field-plain">
            {{ cfOptTypeLevel1Codes.find(c => c.codeValue === prodOptCategoryTypeCd)?.codeLabel || '-' }}
          </div>
          <template v-else>
            <select class="form-control" v-model="prodOptCategoryTypeCd" @change="onCategoryChange">
              <option value="">-- 선택 --</option>
              <option v-for="c in cfOptTypeLevel1Codes" :key="c?.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
            </select>
            <div v-if="!prodOptCategoryTypeCd" style="font-size:11px;color:#f5a623;margin-top:3px;">
              옵션 카테고리를 선택해야 옵션1 · 옵션2를 지정할 수 있습니다.
            </div>
          </template>
        </template>
        <!-- 옵션1 / 옵션2 — 옵션설정 탭의 "1단/2단 유형" select 를 옮겨온 것.
             optGroups 배열(0~2개)과 폼의 고정 2칸 사이 간극은 onOptGrpTypeChange 가 흡수한다. -->
        <template #optType1>
          <div v-if="cfDtlMode" class="readonly-field-plain">{{ fnOptGrpTypeLabel(1) }}</div>
          <template v-else>
            <select class="form-control" :value="fnOptGrpType(1)" :disabled="!prodOptCategoryTypeCd"
              @change="onOptGrpTypeChange(1, $event.target.value)">
              <option value="">-- 선택 --</option>
              <option v-for="c in cfOptTypeCodes" :key="c?.codeId" :value="c.codeValue">{{ c.codeLabel }}</option>
            </select>
            <div v-if="optGroups[0] ? optGroups[0].items.length > 0 : false" style="font-size:11px;color:#1677ff;margin-top:3px;">
              값 {{ optGroups[0].items.length }}개 — 옵션설정 탭에서 편집
            </div>
          </template>
        </template>
        <template #optType2>
          <div v-if="cfDtlMode" class="readonly-field-plain">{{ fnOptGrpTypeLabel(2) }}</div>
          <template v-else>
            <select class="form-control" :value="fnOptGrpType(2)" :disabled="!prodOptCategoryTypeCd"
              @change="onOptGrpTypeChange(2, $event.target.value)">
              <option value="">-- 미사용 (1차원 옵션) --</option>
              <option v-for="c in cfOptTypeCodes" :key="'t2-'+c?.codeId" :value="c.codeValue">{{ c.codeLabel }}</option>
            </select>
            <div v-if="optGroups[1] ? optGroups[1].items.length > 0 : false" style="font-size:11px;color:#1677ff;margin-top:3px;">
              값 {{ optGroups[1].items.length }}개 — 옵션설정 탭에서 편집
            </div>
          </template>
        </template>
        <template #categories>
          <div v-if="cfDtlMode" class="readonly-field-plain">
            {{ prodCategories.length ? prodCategories.map(c => c.categoryNm).join(' , ') : '-' }}
          </div>
          <div v-else style="border:1px solid #e2e8f0;border-radius:6px;background:#fff;min-height:38px;padding:4px 6px;">
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
              <button type="button" @click="handleBtnAction('category-remove', idx)" style="border:none;background:none;color:#f87171;font-size:13px;padding:0 2px;flex-shrink:0;">
                ✕
              </button>
            </div>
            <button type="button" @click="handleBtnAction('catPicker-open')"
              style="margin-top:4px;font-size:12px;color:#6366f1;border:1px dashed #a5b4fc;background:none;border-radius:4px;padding:2px 8px;width:100%;">
              + 카테고리 추가
            </button>
          </div>
        </template>
        <template #brand>
          <div v-if="cfDtlMode" class="readonly-field-plain">{{ form.brandNm || '-' }}</div>
          <select v-else class="form-control" v-model="form.brandId">
            <option value="">-- 선택 --</option>
            <option v-for="b in ([]||[])" :key="b.brandId||b.id" :value="b.brandId||b.id">{{ b.brandNm||b.name }}</option>
          </select>
        </template>
        <template #vendor>
          <div v-if="cfDtlMode" class="readonly-field-plain">{{ form.vendorNm || '-' }}</div>
          <select v-else class="form-control" v-model="form.vendorId">
            <option value="">-- 선택 --</option>
            <option v-for="v in ([]||[])" :key="v.vendorId||v.id" :value="v.vendorId||v.id">{{ v.vendorNm||v.name }}</option>
          </select>
        </template>
        <template #mdUser>
          <div v-if="cfDtlMode" class="readonly-field-plain">{{ cfMdSelectedNm || '-' }}</div>
          <div v-else style="display:flex;gap:6px;align-items:flex-end;">
            <input class="form-control" :value="cfMdSelectedNm||''" readonly placeholder="담당MD를 선택해주세요"
              style="flex:1;background:#fafafa;" @click="handleBtnAction('mdModal-open')" />
            <span style="display:inline-flex;align-items:center;flex-shrink:0;">
              <button class="btn btn-secondary btn-sm" type="button" @click="handleBtnAction('mdModal-open')" style="padding:2px 7px;" title="선택">🔍</button>
              <button v-if="form.mdUserId" type="button" title="선택 해제" @click="handleBtnAction('md-clear')" style="background:none;border:none;padding:0 4px;color:#bbb;cursor:pointer;font-size:11px;line-height:1;">x</button>
            </span>
          </div>
        </template>
        <template #dlivTmplt>
          <div v-if="cfDtlMode" class="readonly-field-plain">{{ form.dlivTmpltId || '-' }}</div>
          <select v-else class="form-control" v-model="form.dlivTmpltId">
            <option value="">-- 선택 --</option>
            <option v-for="t in ([]||[])" :key="t?.dlivTmpltId" :value="t.dlivTmpltId">{{ t.dlivTmpltNm }}</option>
          </select>
        </template>
        <template #saleStart>
          <div v-if="cfDtlMode" class="readonly-field-plain">{{ form.saleStartDate ? fnDateTime(form.saleStartDate) : '즉시' }}</div>
          <bo-date-time-picker v-else v-model="form.saleStartDate" placeholder-date="즉시" />
        </template>
        <template #saleEnd>
          <div v-if="cfDtlMode" class="readonly-field-plain">{{ form.saleEndDate ? fnDateTime(form.saleEndDate) : '무기한' }}</div>
          <bo-date-time-picker v-else v-model="form.saleEndDate" placeholder-date="무기한" />
        </template>
        <template #dispStart>
          <div v-if="cfDtlMode" class="readonly-field-plain">{{ form.dispStartDate ? fnDateTime(form.dispStartDate) : '즉시' }}</div>
          <bo-date-time-picker v-else v-model="form.dispStartDate" placeholder-date="즉시" />
        </template>
        <!-- 마진율 — 별도 가격 폼에서 이관 (읽기 전용 자동 계산값) -->
        <template #marginRate>
          <div v-if="cfDtlMode" class="readonly-field-plain" :style="{ color: cfMarginRateCalc ? '#389e0d' : '#bbb' }">
            {{ cfMarginRateCalc ? cfMarginRateCalc + '%' : '-' }}
          </div>
          <div v-else class="form-control" :style="{ background:'#f5f5f5', color: cfMarginRateCalc ? '#389e0d' : '#bbb' }">
            {{ cfMarginRateCalc ? cfMarginRateCalc + '%' : '(매입가 입력 시 자동 계산)' }}
          </div>
        </template>
        <!-- 상품 속성 — 폼 밖 33% 폭 div 에서 이관. 이제 판매설정 그룹의 한 칸을 차지한다 -->
        <template #prodFlags>
          <bo-multi-check-select v-model="cfProdFlags" :options="PROD_FLAG_OPTIONS" :show-all="false" wrap list-all
            placeholder="선택 안 함" :plain="cfDtlMode" :disabled="cfDtlMode" min-width="100%" />
        </template>
        <template #dispEnd>
          <div v-if="cfDtlMode" class="readonly-field-plain">{{ form.dispEndDate ? fnDateTime(form.dispEndDate) : '무기한' }}</div>
          <bo-date-time-picker v-else v-model="form.dispEndDate" placeholder-date="무기한" />
        </template>
      </bo-form-area>
      <!-- ===== ■.■.■. 카테고리 피커 모달 ========================================== -->
      <bo-cm-popup-modal v-if="catPickerOpen" popup-cmd="cmPopup-category-pick" popup-code="category"
        :init-selected-ids="[...cfCatExcludeSet]" :on-callback="fnCallbackModal"
        @close="handleBtnAction('catPicker-close')" />
      <!-- ===== ■.■.■. 담당MD 선택 모달 ========================================== -->
      <bo-cm-popup-modal v-if="mdModalOpen" popup-cmd="cmPopup-md-pick" popup-code="user"
        title="담당MD 선택" :on-callback="fnCallbackModal"
        @close="handleBtnAction('mdModal-close')" />
      </fieldset>
      <bo-form-actions v-if="active" :readonly="cfDtlMode" :show-delete="false"
        :save-disabled="cfSaveDisabled" :save-title="cfSaveDisabled ? '먼저 기본정보 탭에서 상품을 등록해주세요.' : ''"
        :edit-click="() => handleBtnAction('info-form-edit')"
        :save-click="() => handleBtnAction('info-form-save')"
        :delete-click="() => handleBtnAction('info-form-delete')"
        :cancel-click="() => handleBtnAction('info-form-cancel')"
        :close-click="() => handleBtnAction('info-form-close')" />
    </div>
    <!-- ══════════════════════════════════════
     ⚙ 옵션설정  (pd_prod_opt / pd_prod_opt_item / pd_prod_sku)
══════════════════════════════════════ -->
    <div class="dtl-pane" v-show="showTab('option')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">⚙ 옵션설정</div>
      <!-- 보기모드: fieldset disabled 로 모든 입력/버튼/select 자동 비활성 (편집 잠금) -->
      <fieldset :disabled="cfDtlMode" style="border:none;padding:0;margin:0;min-width:0;">
      <!-- ===== ■.■.■. 옵션 카테고리 선택 바 ======================================== -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;padding:10px 14px;background:#f9f9f9;border-radius:8px;border:1px solid #eee;">
        <!-- 옵션 카테고리 select 는 기본정보 탭으로 이동했다. 여기서는 선택된 값을 읽기 전용으로만 보여준다
             (1단/2단 유형이 이 값에 종속되므로 무엇이 선택돼 있는지는 계속 보여야 한다) -->
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:12px;color:#555;font-weight:600;flex-shrink:0;">옵션 카테고리</span>
          <span v-if="prodOptCategoryTypeCd" class="badge badge-purple" style="font-size:11px;">
            {{ cfOptTypeLevel1Codes.find(c => c.codeValue === prodOptCategoryTypeCd)?.codeLabel || prodOptCategoryTypeCd }}
          </span>
          <span v-else style="font-size:11px;color:#aaa;">미선택</span>
        </div>
        <!-- 1단/2단 유형 select 도 기본정보 [옵션상품] 그룹으로 이동했다.
             이 탭은 이제 "값(항목) 편집 + SKU 생성" 만 담당하고, 어떤 유형인지는 읽기 전용으로 보여준다. -->
        <template v-if="prodOptCategoryTypeCd ? (optGroups.length>0) : false">
          <span style="font-size:11px;color:#ddd;">│</span>
          <div v-for="(grp, gi) in optGroups" :key="'typeSel-'+grp._id" style="display:flex;align-items:center;gap:6px;">
            <span class="badge badge-blue" style="font-size:11px;">옵션{{ gi+1 }}</span>
            <span v-if="grp.level2Cd" style="font-size:12px;color:#333;font-weight:600;">{{ fnOptGrpTypeLabel(gi+1) }}</span>
            <span v-else style="font-size:11px;color:#aaa;">유형 미지정</span>
            <span v-if="grp.level2Cd" style="font-size:11px;color:#1677ff;">{{ grp.items.length }}개</span>
          </div>
        </template>
        <span v-if="!prodOptCategoryTypeCd" style="font-size:11px;color:#f5a623;">← [기본정보] 탭에서 옵션 카테고리를 먼저 선택하세요</span>
        <span v-else style="font-size:11px;color:#aaa;margin-left:auto;">옵션 카테고리 · 옵션1 · 옵션2 변경은 [기본정보] 탭에서</span>
      </div>
      <!-- ===== ■.■.■. 미사용 안내 ============================================== -->
      <template v-if="!prodOptCategoryTypeCd">
        <div style="padding:10px 14px;background:#f9f0ff;border-radius:8px;border:1px solid #d3adf7;font-size:12px;color:#531dab;margin-bottom:8px;">
          💡 [기본정보] 탭의 <b>옵션 카테고리</b>를 선택하면 옵션 설정이 활성화됩니다.
        </div>
      </template>
      <!-- ===== ■.■.■. 옵션 값 입력 (1단 / 2단 나란히) ============================= -->
      <template v-else>
        <div :style="optGroups.length===2 ? 'display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;' : 'margin-bottom:12px;'">
          <!-- ===== ■.■.■.■. 차원별 블록 ========================================== -->
          <div v-for="(grp, gi) in optGroups" :key="grp?._id"
            style="border:1px solid #e0e0e0;border-radius:8px;padding:12px;background:#fafafa;">
            <!-- 차원 헤더 -->
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <span class="badge badge-blue" style="font-size:11px;flex-shrink:0;">{{ grp.level }}단 옵션</span>
              <input class="form-control" v-model="grp.grpNm" placeholder="옵션명 (예: 색상)"
                style="flex:1;min-width:80px;font-size:12px;" />
              <button v-if="!cfDtlMode" class="btn btn-xs btn-danger" style="flex-shrink:0;" @click="handleBtnAction('optGroup-remove', gi)">삭제</button>
            </div>
            <!-- 옵션값 테이블 -->
            <div style="max-height:220px;overflow-y:auto;border:1px solid #f0f0f0;border-radius:6px;background:#fff;">
              <table style="width:100%;border-collapse:collapse;font-size:12px;">
                <thead style="position:sticky;top:0;background:#f5f5f5;z-index:1;">
                  <tr style="border-bottom:1px solid #e0e0e0;">
                    <th style="width:18px;padding:3px 2px;"></th>
                    <th style="width:22px;padding:3px 4px;text-align:center;color:#888;font-size:11px;">#</th>
                    <th style="padding:3px 6px;text-align:left;font-weight:600;color:#555;font-size:11px;">표시명</th>
                    <th style="width:120px;padding:3px 6px;text-align:left;font-weight:600;color:#555;font-size:11px;">저장값</th>
                    <th style="width:80px;padding:3px 6px;text-align:left;font-weight:600;color:#555;font-size:11px;">스타일</th>
                    <th style="width:30px;padding:3px 4px;text-align:center;color:#555;font-size:11px;">사용</th>
                    <th style="width:22px;padding:3px 2px;"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, ii) in grp.items" :key="item?._id"
                    draggable="true"
                    @dragstart="onOptItemDragStart(grp, ii)"
                    @dragover.prevent="onOptItemDragOver(grp, ii)"
                    @drop.prevent="onOptItemDrop(grp)"
                    @dragend="dragOptGrpId=null;dragOptItemIdx=null;dragoverOptItemIdx=null"
                    style="border-bottom:1px solid #f0f0f0;transition:background 0.1s;"
                    :style="(dragOptGrpId===grp._id ? (dragoverOptItemIdx===ii ? dragOptItemIdx!==ii : false) : false) ? 'background:#dbeafe;' : (ii%2===1 ? 'background:#fafafa;' : '')">
                    <td style="padding:2px;text-align:center;cursor:grab;color:#ccc;font-size:13px;user-select:none;">≡</td>
                    <td style="padding:2px 4px;text-align:center;color:#bbb;font-size:11px;">{{ ii+1 }}</td>
                    <td style="padding:2px 4px;">
                      <input v-model="item.nm" placeholder="예: 블랙"
                        style="width:100%;font-size:12px;border:1px solid #ddd;border-radius:4px;padding:2px 5px;height:22px;"
                        @blur="generateSkus" />
                    </td>
                    <td style="padding:2px 4px;">
                      <input v-model="item.val" placeholder="BLACK"
                        style="width:100%;font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 5px;height:22px;font-family:monospace;"
                        @blur="generateSkus" />
                    </td>
                    <td style="padding:2px 4px;">
                      <div style="display:flex;gap:3px;align-items:center;">
                        <span v-if="item.prodOptStyle ? (item.prodOptStyle.startsWith('#')) : false"
                          :style="'flex-shrink:0;width:14px;height:14px;border-radius:2px;border:1px solid #ddd;background:'+item.prodOptStyle+';'"></span>
                        <input v-model="item.prodOptStyle" placeholder="#hex"
                          style="flex:1;min-width:0;font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;height:22px;font-family:monospace;" />
                      </div>
                    </td>
                    <td style="padding:2px 4px;text-align:center;">
                      <input type="checkbox" :checked="item.useYn==='Y'"
                        @change="item.useYn=$event.target.checked?'Y':'N'; generateSkus()"
                        style="width:13px;height:13px;" />
                    </td>
                    <td style="padding:2px 3px;text-align:center;">
                      <button v-if="!cfDtlMode" style="background:#ff4d4f;color:#fff;border:none;border-radius:3px;width:18px;height:18px;font-size:10px;line-height:1;padding:0;cursor:pointer;"
                        @click="handleBtnAction('optItem-remove', {grp:grp, ii:ii})">✕</button>
                    </td>
                  </tr>
                  <tr v-if="grp.items.length===0">
                    <td colspan="7" style="text-align:center;color:#bbb;padding:10px;font-size:12px;">값을 추가해주세요.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button v-if="!cfDtlMode" class="btn btn-xs btn-secondary" style="margin-top:6px;" @click="handleBtnAction('optItem-add', grp)">+ 값 추가</button>
          </div>
        </div>
        <!-- ===== ■.■.■. N×M 조합 설정 (체크/언체크로 SKU useYn 토글) ==================
         bo-matrix 로 교체(2026-08-25). 이전엔 셀·헤더 로직이 전부 속성값 안 IIFE 였다. -->
        <div v-if="optGroups.length===2" style="border:1px solid #bae0ff;border-radius:8px;padding:12px;background:#f0f8ff;margin-bottom:12px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;">
            <span style="font-size:12px;font-weight:700;color:#0958d9;">📊 N×M 조합 설정</span>
            <span style="font-size:11px;color:#555;">
              {{ fnMxItems(1).length }} × {{ fnMxItems(2).length }}
              = <strong>{{ skus.filter(s=>s.useYn==='Y').length }}</strong> / {{ skus.length }} 활성 SKU
            </span>
          </div>
          <bo-matrix
            :rows="fnMxItems(1)" :cols="fnMxItems(2)"
            row-key="_id" col-key="_id" row-label="nm" col-label="nm"
            row-style-key="prodOptStyle" col-style-key="prodOptStyle"
            :corner="((optGroups[0]?.grpNm)||'1단') + ' / ' + ((optGroups[1]?.grpNm)||'2단')"
            cell-type="checkbox" header-toggle :cell="fnCombOn" :readonly="cfDtlMode"
            max-height="none" cell-width="52px"
            @cell-change="onCombChange" @row-header="onCombRow" @col-header="onCombCol" />
          <div style="margin-top:6px;font-size:11px;color:#888;">💡 행/열 헤더의 체크박스 또는 헤더 셀 클릭 시 해당 행/열 전체 토글</div>
        </div>
        <div style="padding:8px 12px;background:#e6f4ff;border-radius:8px;border:1px solid #bae0ff;font-size:12px;color:#0958d9;">
          💡 SKU별 가격·재고는 <strong>💰 옵션(가격/재고)</strong> 탭에서 관리합니다.
        </div>
      </template>
      </fieldset>
      <bo-form-actions v-if="active" :readonly="cfDtlMode" :show-delete="false"
        :save-disabled="cfSaveDisabled" :save-title="cfSaveDisabled ? '먼저 기본정보 탭에서 상품을 등록해주세요.' : ''"
        :edit-click="() => handleBtnAction('option-form-edit')"
        :save-click="() => handleBtnAction('option-form-save')"
        :delete-click="() => handleBtnAction('option-form-delete')"
        :cancel-click="() => handleBtnAction('option-form-cancel')"
        :close-click="() => handleBtnAction('option-form-close')" />
    </div>
    <!-- ══════════════════════════════════════
     📄 상품설명  (contentBlocks — 첨부/URL/HTML 블록)
══════════════════════════════════════ -->
    <div class="dtl-pane" v-show="showTab('content')" style="margin:0;padding:0;overflow:hidden;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title" style="padding:14px 20px;">📄 상품설명</div>
      <!-- ===== ■.■.■. 상단 툴바: 블록 추가 버튼 (수정모드 전용) ========================= -->
      <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafafa;flex-wrap:wrap;">
        <span style="font-size:13px;font-weight:700;color:#333;margin-right:4px;">상품설명 블록</span>
        <button v-if="!cfDtlMode" class="btn btn-secondary btn-sm" @click="handleBtnAction('contentBlock-add', 'file')">+ 첨부 이미지</button>
        <button v-if="!cfDtlMode" class="btn btn-secondary btn-sm" @click="handleBtnAction('contentBlock-add', 'url')">+ URL 이미지</button>
        <button v-if="!cfDtlMode" class="btn btn-secondary btn-sm" @click="handleBtnAction('contentBlock-add', 'html')">+ HTML 에디터</button>
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
          <div v-for="(block, bi) in contentBlocks" :key="block?._id" :draggable="!cfDtlMode" @dragstart="cfDtlMode ? null : onBlockDragStart(bi)" @dragover.prevent="cfDtlMode ? null : onBlockDragOver(bi)" @drop.prevent="cfDtlMode ? null : onBlockDrop()" @dragend="dragBlockIdx=null;dragoverBlockIdx=null" style="border:1px solid #e8e8e8;border-radius:10px;margin-bottom:10px;background:#fff;transition:border-color 0.15s,background 0.15s;overflow:hidden;" :style="(dragoverBlockIdx===bi ? dragBlockIdx!==bi : false) ? 'border-color:#1677ff;background:#e6f4ff;' : ''">
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
              <button v-if="!cfDtlMode" class="btn btn-xs btn-danger" @click="handleBtnAction('contentBlock-remove', bi)" title="삭제">✕</button>
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
              <button v-if="!cfDtlMode ? (block.content) : false" class="btn btn-xs btn-danger" @click="handleBtnAction('contentBlock-clearFile', block)" style="margin-left:6px;">
                삭제
              </button>
              <span v-if="cfDtlMode ? (!block.content) : false" style="font-size:12px;color:#bbb;">이미지 없음</span>
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
              <div v-if="cfDtlMode" class="readonly-field-plain" style="min-height:120px;line-height:1.6;overflow:auto;" v-html="block.content || '-'"></div>
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
            <button class="btn btn-xs" :class="previewDevice==='pc'?'btn-primary':'btn-secondary'" @click="handleBtnAction('preview-setDevice', 'pc')" style="font-size:11px;padding:2px 8px;">
              🖥 PC
            </button>
            <button class="btn btn-xs" :class="previewDevice==='tablet'?'btn-primary':'btn-secondary'" @click="handleBtnAction('preview-setDevice', 'tablet')" style="font-size:11px;padding:2px 8px;">
              📱 태블릿
            </button>
            <button class="btn btn-xs" :class="previewDevice==='mobile'?'btn-primary':'btn-secondary'" @click="handleBtnAction('preview-setDevice', 'mobile')" style="font-size:11px;padding:2px 8px;">
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
              <div style="display:flex;flex-direction:column;gap:12px;">
                <template v-for="block in contentBlocks" :key="block?._id">
                  <img v-if="(block.type==='file'||block.type==='url') ? block.content : false" :src="block.content" style="max-width:100%;height:auto;display:block;border-radius:4px;" />
                  <div v-else-if="block.type==='html'" v-html="block.content||''"></div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="active" style="padding:8px 16px;border-top:1px solid #f0f0f0;">
        <bo-form-actions :readonly="cfDtlMode" :show-delete="false"
          :save-disabled="cfSaveDisabled" :save-title="cfSaveDisabled ? '먼저 기본정보 탭에서 상품을 등록해주세요.' : ''"
          :edit-click="() => handleBtnAction('content-form-edit')"
          :save-click="() => handleBtnAction('content-form-save')"
          :delete-click="() => handleBtnAction('content-form-delete')"
          :cancel-click="() => handleBtnAction('content-form-cancel')"
          :close-click="() => handleBtnAction('content-form-close')" />
      </div>
    </div>
    <!-- ══════════════════════════════════════
     📝 상세설정  (advrt / 구매제한 / 혜택)
══════════════════════════════════════ -->
    <div class="dtl-pane" v-show="showTab('detail')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📝 상세설정</div>
      <!-- 보기모드: fieldset disabled 로 홍보문구·날짜픽커·혜택 체크박스 자동 비활성 (편집 잠금) -->
      <fieldset :disabled="cfDtlMode" style="border:none;padding:0;margin:0;min-width:0;">
      <!-- ===== ■.■.■. 상세설정 통합 폼 (홍보문구 + 광고 노출 + 구매 제한, cols=3 한 줄 3필드) ===== -->
      <bo-form-area :columns="columns.detailForm" :form="form" :errors="errors"
        :readonly="cfDtlMode" :cols="3" compact plain-readonly :show-actions="false">
        <template #advrtStmt>
          <div v-if="cfDtlMode" class="readonly-field-plain">{{ form.advrtStmt || '-' }}</div>
          <template v-else>
            <input class="form-control" v-model="form.advrtStmt" placeholder="예: 이번 주 한정 20% 할인!" maxlength="500" />
            <div style="font-size:11px;color:#aaa;text-align:right;margin-top:2px;">{{ (form.advrtStmt||'').length }} / 500</div>
          </template>
        </template>
        <template #advrtStart>
          <div v-if="cfDtlMode" class="readonly-field-plain">{{ form.advrtStartDate ? fnDateTime(form.advrtStartDate) : '-' }}</div>
          <bo-date-time-picker v-else v-model="form.advrtStartDate" />
        </template>
        <template #advrtEnd>
          <div v-if="cfDtlMode" class="readonly-field-plain">{{ form.advrtEndDate ? fnDateTime(form.advrtEndDate) : '-' }}</div>
          <bo-date-time-picker v-else v-model="form.advrtEndDate" />
        </template>
      </bo-form-area>
      <!-- ===== ■.■.■. 판매계획 ================================================= -->
      <hr style="border:none;border-top:1px solid #f0f0f0;margin:20px 0 16px;" />
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div style="font-size:13px;font-weight:700;">
          판매계획
          <span style="font-size:12px;font-weight:400;color:#888;">{{ cfPlanVisible.length }}건</span>
        </div>
        <div v-if="!cfDtlMode" style="display:flex;gap:6px;">
          <button class="btn btn-sm btn-danger"    @click="handleBtnAction('plan-deleteChecked')">체크삭제</button>
          <button class="btn btn-sm btn-secondary" @click="handleBtnAction('plan-addRow')">행추가</button>
        </div>
      </div>
      <div style="overflow-x:auto;">
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
      </fieldset>
      <bo-form-actions v-if="active" :readonly="cfDtlMode" :show-delete="false"
        :save-disabled="cfSaveDisabled" :save-title="cfSaveDisabled ? '먼저 기본정보 탭에서 상품을 등록해주세요.' : ''"
        :edit-click="() => handleBtnAction('detail-form-edit')"
        :save-click="() => handleBtnAction('detail-form-save')"
        :delete-click="() => handleBtnAction('detail-form-delete')"
        :cancel-click="() => handleBtnAction('detail-form-cancel')"
        :close-click="() => handleBtnAction('detail-form-close')" />
    </div>
    <!-- ══════════════════════════════════════
     🎯 프로모션  (쿠폰 / 적립금 / 할인 / 프로모션 적용 여부)
══════════════════════════════════════ -->
    <div class="dtl-pane" v-show="showTab('promo')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🎯 프로모션</div>
      <fieldset :disabled="cfDtlMode" style="border:none;padding:0;margin:0;min-width:0;">
      <!-- ===== ■.■.■. 프로모션 적용 여부 ======================================= -->
      <div style="font-size:13px;font-weight:700;color:#333;margin-bottom:10px;">프로모션 적용 여부</div>
      <div style="display:flex;gap:24px;padding:14px;background:#f9f9f9;border-radius:8px;border:1px solid #eee;flex-wrap:wrap;margin-bottom:24px;">
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
      <!-- ===== ■.■.■. 상품 프로모션 정보 (할인/쿠폰/적립금/사은품, 2열 그리드) =========================================== -->
      <div class="section-title" style="margin-top:0;">상품 프로모션 정보</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <!-- 상품 할인 목록 (혜택 큰 순 1위 — 정가 자체를 낮추는 직접할인) -->
      <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div style="font-size:13px;font-weight:700;">
          상품 할인 목록
          <span style="font-size:12px;font-weight:400;color:#888;">{{ tabData.promoDiscnts.length }}건</span>
          <span v-if="!form.discntUseYn || form.discntUseYn==='N'" class="badge badge-gray" style="margin-left:6px;font-size:11px;">사용 미허용</span>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-sm btn-secondary" @click="handleBtnAction('promo-discnt-reload')">🔄 재조회</button>
          <button v-if="!cfDtlMode" class="btn btn-sm btn-primary" @click="handleBtnAction('promo-discnt-add')">+ 할인 추가</button>
        </div>
      </div>
      <bo-grid bare :columns="columns.promoDiscntGrid" :rows="tabData.promoDiscnts"
        row-key="discntItemId"
        empty-text="이 상품에 연결된 할인이 없습니다.">
        <template v-if="!cfDtlMode" #row-actions="{ row: r }">
          <button class="btn btn_row_delete" @click="handleBtnAction('promo-discnt-delete', r.discntItemId)">삭제</button>
        </template>
      </bo-grid>
      </div>
      <!-- 상품 쿠폰 목록 -->
      <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div style="font-size:13px;font-weight:700;">
          상품 쿠폰 목록
          <span style="font-size:12px;font-weight:400;color:#888;">{{ tabData.promoCoupons.length }}건</span>
          <span v-if="!form.couponUseYn || form.couponUseYn==='N'" class="badge badge-gray" style="margin-left:6px;font-size:11px;">사용 미허용</span>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-sm btn-secondary" @click="handleBtnAction('promo-coupon-reload')">🔄 재조회</button>
          <button v-if="!cfDtlMode" class="btn btn-sm btn-primary" @click="handleBtnAction('promo-coupon-add')">+ 쿠폰 추가</button>
        </div>
      </div>
      <bo-grid bare :columns="columns.promoCouponGrid" :rows="tabData.promoCoupons"
        row-key="couponItemId"
        empty-text="이 상품에 연결된 쿠폰이 없습니다.">
        <template v-if="!cfDtlMode" #row-actions="{ row: r }">
          <button class="btn btn_row_delete" @click="handleBtnAction('promo-coupon-delete', r.couponItemId)">삭제</button>
        </template>
      </bo-grid>
      </div>
      <!-- 상품 적립금 목록 -->
      <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div style="font-size:13px;font-weight:700;">
          상품 적립금 목록
          <span style="font-size:12px;font-weight:400;color:#888;">{{ tabData.promoSaves.length }}건</span>
          <span v-if="!form.saveUseYn || form.saveUseYn==='N'" class="badge badge-gray" style="margin-left:6px;font-size:11px;">사용 미허용</span>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-sm btn-secondary" @click="handleBtnAction('promo-save-reload')">🔄 재조회</button>
          <button v-if="!cfDtlMode" class="btn btn-sm btn-primary" @click="handleBtnAction('promo-save-add')">+ 적립금 추가</button>
        </div>
      </div>
      <bo-grid bare :columns="columns.promoSaveGrid" :rows="tabData.promoSaves"
        row-key="saveItemId"
        empty-text="이 상품에 연결된 적립금이 없습니다.">
        <template v-if="!cfDtlMode" #row-actions="{ row: r }">
          <button class="btn btn_row_delete" @click="handleBtnAction('promo-save-delete', r.saveItemId)">삭제</button>
        </template>
      </bo-grid>
      </div>
      <!-- 상품 사은품 목록 -->
      <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div style="font-size:13px;font-weight:700;">
          상품 사은품 목록
          <span style="font-size:12px;font-weight:400;color:#888;">{{ tabData.promoGifts.length }}건</span>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-sm btn-secondary" @click="handleBtnAction('promo-gift-reload')">🔄 재조회</button>
          <button v-if="!cfDtlMode" class="btn btn-sm btn-primary" @click="handleBtnAction('promo-gift-add')">+ 사은품 추가</button>
        </div>
      </div>
      <bo-grid bare :columns="columns.promoGiftGrid" :rows="tabData.promoGifts"
        row-key="giftCondId"
        empty-text="이 상품에 연결된 사은품이 없습니다.">
        <template v-if="!cfDtlMode" #row-actions="{ row: r }">
          <button class="btn btn_row_delete" @click="handleBtnAction('promo-gift-delete', r.giftCondId)">삭제</button>
        </template>
      </bo-grid>
      </div>
      </div>
      </fieldset>
      <!-- 프로모션 피커 모달 4개 — fieldset 밖에 배치 (fieldset disabled 영향 차단) -->
      <bo-cm-popup-modal v-if="uiState.promoPicker === 'coupon'" popup-code="coupon" @select="r => handleBtnAction('promo-coupon-pick', r)" @close="uiState.promoPicker = null" />
      </pm-coupon-pick-modal>
      <bo-cm-popup-modal v-if="uiState.promoPicker === 'save'" popup-code="save" @select="r => handleBtnAction('promo-save-pick', r)" @close="uiState.promoPicker = null" />
      </pm-save-pick-modal>
      <bo-cm-popup-modal v-if="uiState.promoPicker === 'discnt'" popup-code="discnt" @select="r => handleBtnAction('promo-discnt-pick', r)" @close="uiState.promoPicker = null" />
      </pm-discnt-pick-modal>
      <bo-cm-popup-modal v-if="uiState.promoPicker === 'gift'" popup-code="gift" @select="r => handleBtnAction('promo-gift-pick', r)" @close="uiState.promoPicker = null" />
      </pm-gift-pick-modal>
      <!-- 상품 프로모션 정보 그룹의 저장/취소/닫기 -->
      <bo-form-actions v-if="active" :readonly="cfDtlMode" :show-delete="false"
        :save-disabled="cfSaveDisabled" :save-title="cfSaveDisabled ? '먼저 기본정보 탭에서 상품을 등록해주세요.' : ''"
        :edit-click="() => handleBtnAction('promo-form-edit')"
        :save-click="() => handleBtnAction('promo-form-save')"
        :delete-click="() => handleBtnAction('promo-form-delete')"
        :cancel-click="() => handleBtnAction('promo-form-cancel')"
        :close-click="() => handleBtnAction('promo-form-close')" />
    </div>
    <!-- ══════════════════════════════════════
     🖼 이미지  (pd_prod_img)
══════════════════════════════════════ -->
    <div class="dtl-pane" v-show="showTab('image')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🖼 이미지</div>
      <input type="file" ref="fileInputRef" multiple accept="image/*" style="display:none" @change="onFileChange" />
      <input type="file" ref="replaceInputRef" accept="image/*" style="display:none" @change="onReplaceFileChange" />
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">
        <span style="font-size:12px;color:#888;">총 {{ images.length }}개</span>
        <span style="font-size:11px;color:#bbb;">· 옵션1 그룹별로 등록합니다. 파일을 그룹 위에 끌어다 놓아도 됩니다.</span>
      </div>
      <!-- ===== ■.■.■. 옵션1 그룹 목록 =============================================
       옵션상품 이미지는 "색상(옵션1) 단위로 여러 장" 이 실무 기본이라 그룹으로 묶어 보여준다.
       그룹 순서는 옵션설정 탭의 옵션1 항목 순서(= 정렬순서), 공통(NULL)이 맨 앞.
       그룹 카드 전체가 파일 드롭 존이며, 행을 다른 그룹으로 끌어다 놓으면 옵션1 이 바뀐다. -->
      <div style="max-height:620px;overflow-y:auto;padding:2px;">
        <div v-for="g in cfImgGroups" :key="g.key"
          @dragover.prevent="onImgGroupDragOver($event, g.key)"
          @dragleave.self="onImgGroupDragLeave(g.key)"
          @drop.prevent="onImgGroupDrop($event, g.key)"
          style="border:1px solid #e8e8e8;border-radius:10px;margin-bottom:12px;background:#fff;transition:border-color 0.15s,background 0.15s;"
          :style="uiState.dropOpt1===g.key ? 'border-color:#1677ff;background:#e6f4ff;' : (g.isEtc ? 'border-color:#f0c0c2;' : '')">
          <!-- ===== ■.■.■.■. 그룹 헤더 (그룹별 업로드 버튼) ======================== -->
          <div style="display:flex;gap:8px;align-items:center;padding:10px 12px;border-bottom:1px solid #f0f0f0;background:#fafbfc;border-radius:10px 10px 0 0;">
            <span style="font-size:12px;font-weight:700;color:#333;">{{ g.label }}</span>
            <span style="font-size:11px;color:#aaa;">{{ g.items.length }}개</span>
            <span v-if="g.isEtc" style="font-size:11px;color:#d9363e;">옵션설정에 없는 옵션값입니다. 각 행의 opt_id_1 을 다시 지정하세요.</span>
            <div style="margin-left:auto;display:flex;gap:6px;">
              <button v-if="!cfDtlMode" class="btn btn-xs btn-secondary" @click="handleBtnAction('img-triggerFile', g.key)" style="font-size:11px;">+ 파일 선택</button>
              <button v-if="!cfDtlMode" class="btn btn-xs btn-secondary" @click="handleBtnAction('img-addByUrl', g.key)" style="font-size:11px;">+ URL 입력</button>
            </div>
          </div>
          <!-- ===== ■.■.■.■. 그룹 본문 ============================================ -->
          <div style="padding:8px;background:#fafafa;border-radius:0 0 10px 10px;">
            <div v-if="g.items.length===0"
              :style="'border:2px dashed #e4e4e4;border-radius:8px;padding:16px;text-align:center;color:#bbb;font-size:12px;' + (cfDtlMode ? '' : 'cursor:pointer;')"
              @click="cfDtlMode ? null : handleBtnAction('img-triggerFile', g.key)">
              {{ cfDtlMode ? '등록된 이미지가 없습니다.' : '클릭하거나 파일을 끌어다 놓으세요' }}
            </div>
            <div v-for="{ img, idx } in g.items" :key="img?.id" :draggable="!cfDtlMode" @dragstart="cfDtlMode ? null : onImgDragStart(idx)" @dragover.prevent="cfDtlMode ? null : onImgDragOver(idx)" @drop.prevent="cfDtlMode ? null : onImgDrop()" @dragend="dragImgIdx=null;dragoverImgIdx=null;uiState.dragImgId=null" style="display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid #e8e8e8;border-radius:10px;margin-bottom:10px;background:#fff;transition:border-color 0.15s,background 0.15s;" :style="img.isMain ? 'border-color:#e8587a;background:#fff8f9;' : ((dragoverImgIdx===idx ? dragImgIdx!==idx : false) ? 'border-color:#1677ff;background:#e6f4ff;' : '')">
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
            <div v-if="!img.previewUrl||img.previewUrl.startsWith('http')" style="margin-bottom:4px;">
              <label class="form-label" style="font-size:11px;">이미지 URL</label>
              <input class="form-control" v-model="img.previewUrl" placeholder="https://..." style="font-size:12px;" :readonly="cfDtlMode" />
            </div>
            <div v-if="img.previewUrl" style="font-size:9px;color:#bbb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:6px;" :title="img.previewUrl">
              {{ img.previewUrl }}
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <!-- ===== ■.■.■.■.■.■.■. opt_id_1: 옵션 1단 select ================= -->
              <div style="flex:1;min-width:140px;margin-bottom:4px;">
                <label class="form-label" style="font-size:11px;">opt_id_1 <span style="color:#aaa;"> (NULL=공통) </span></label>
                <select class="form-control" v-model="img.prodOpt1Id" style="font-size:12px;" @change="img.prodOpt2Id=''" :disabled="cfDtlMode">
                  <option value="">-- 공통 (NULL) --</option>
                  <option v-if="!safeFirst(optGroups)||safeFirst(optGroups).items.length===0" disabled value="">
                    옵션설정 탭에서 1단 옵션을 먼저 추가하세요
                  </option>
                  <option v-for="item in (optGroups[0]?.items||[])" :key="item?._id" :value="item.val||String(item._id)">
                    {{ item.nm + (item.val ? ' (' + item.val + ')' : '') }}
                  </option>
                </select>
              </div>
              <!-- ===== ■.■.■.■.■.■.■. opt_id_2: 옵션 2단 select (1단 선택 후 연동) ===== -->
              <div style="flex:1;min-width:140px;margin-bottom:4px;">
                <label class="form-label" style="font-size:11px;">opt_id_2 <span style="color:#aaa;"> (NULL=옵션1 공통) </span></label>
                <select class="form-control" v-model="img.prodOpt2Id" style="font-size:12px;" :disabled="cfDtlMode || (!img.prodOpt1Id ? optGroups.length<2 : false)">
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
            <button v-if="!cfDtlMode ? (!img.isMain) : false" class="btn btn-sm btn-secondary" @click="handleBtnAction('img-setMain', img.id)" style="font-size:11px;">대표 설정</button>
            <span v-if="img.isMain" style="font-size:11px;font-weight:700;color:#e8587a;padding:4px 8px;background:#fde8ee;border-radius:4px;">
              ★ 대표
            </span>
            <button v-if="!cfDtlMode" class="btn btn-sm btn-secondary" @click="handleBtnAction('img-replaceFile', img.id)" style="font-size:11px;" title="이 행의 파일만 교체 — 순서·대표·옵션 지정은 유지됩니다">파일 교체</button>
            <button v-if="!cfDtlMode" class="btn btn-sm btn-danger" @click="handleBtnAction('img-remove', img.id)" style="font-size:11px;">삭제</button>
            <span style="font-size:11px;color:#bbb;" title="전체 정렬순서(sort_ord) — 그룹과 무관한 통합 순번입니다">{{ idx+1 }}/{{ images.length }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- ===== ■.■.■. /옵션1 그룹 목록 ============================================= -->
      <bo-form-actions v-if="active" :readonly="cfDtlMode" :show-delete="false"
        :save-disabled="cfSaveDisabled" :save-title="cfSaveDisabled ? '먼저 기본정보 탭에서 상품을 등록해주세요.' : ''"
        :edit-click="() => handleBtnAction('image-form-edit')"
        :save-click="() => handleBtnAction('image-form-save')"
        :delete-click="() => handleBtnAction('image-form-delete')"
        :cancel-click="() => handleBtnAction('image-form-cancel')"
        :close-click="() => handleBtnAction('image-form-close')" />
    </div>
    <!-- ══════════════════════════════════════
     🔗 연관상품
══════════════════════════════════════ -->
    <div class="dtl-pane" v-show="showTab('related')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🔗 연관상품</div>
      <!-- 보기모드: fieldset disabled 로 추가/삭제/선택 버튼·input 자동 비활성 (편집 잠금) -->
      <fieldset :disabled="cfDtlMode" style="border:none;padding:0;margin:0;min-width:0;display:flex;flex-direction:column;gap:24px;">
      <!-- ===== ■.■.■. 섹션1: 연관상품 =========================================== -->
      <div>
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
          <button v-if="!cfDtlMode" class="btn btn-sm btn-secondary" @click="handleBtnAction('prodPicker-open', 'rel')">+ 추가</button>
        </div>
        <!-- ===== ■.■.■.■. 목록 영역 ============================================= -->
        <bo-grid bare :columns="columns.relProdGrid" :rows="relProds" row-key="_id"
          :draggable="!cfDtlMode" row-actions empty-text="+ 추가 버튼으로 연관상품을 등록하세요."
          @reorder="onRelDrop"
          @ref-click="({id}) => navigate('pdProdDtl', { id })">
          <template v-if="!cfDtlMode" #row-actions="{ idx }">
            <button class="btn btn-xs btn-danger" @click="handleBtnAction('rel-remove', idx)">삭제</button>
          </template>
        </bo-grid>
      </div>
      <hr style="border:none;border-top:1px solid #f0f0f0;margin:0;" />
      <!-- ===== ■.■.■. 섹션2: 코디상품 =========================================== -->
      <div>
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
          <button v-if="!cfDtlMode" class="btn btn-sm btn-secondary" @click="handleBtnAction('prodPicker-open', 'code')">+ 추가</button>
        </div>
        <!-- ===== ■.■.■.■. 목록 영역 ============================================= -->
        <bo-grid bare :columns="columns.codeProdGrid" :rows="codeProds" row-key="_id"
          :draggable="!cfDtlMode" row-actions empty-text="+ 추가 버튼으로 코디상품을 등록하세요."
          @reorder="onCodeDrop"
          @ref-click="({id}) => navigate('pdProdDtl', { id })">
          <template v-if="!cfDtlMode" #row-actions="{ idx }">
            <td style="text-align:center;;white-space:nowrap;">
              <button class="btn btn-xs btn-danger" @click="handleBtnAction('codeProd-remove', idx)">삭제</button>
            </td>
          </template>
        </bo-grid>
      </div>
      </fieldset>
      <bo-form-actions v-if="active" :readonly="cfDtlMode" :show-delete="false"
        :save-disabled="cfSaveDisabled" :save-title="cfSaveDisabled ? '먼저 기본정보 탭에서 상품을 등록해주세요.' : ''"
        :edit-click="() => handleBtnAction('related-form-edit')"
        :save-click="() => handleBtnAction('related-form-save')"
        :delete-click="() => handleBtnAction('related-form-delete')"
        :cancel-click="() => handleBtnAction('related-form-cancel')"
        :close-click="() => handleBtnAction('related-form-close')" />
      <!-- ===== ■.■.■. 상품 추가 피커 모달 (좌:카테고리트리 / 우:상품목록) ===================== -->
      <bo-cm-popup-modal v-if="prodPickerOpen" popup-cmd="cmPopup-prod-cate-pick" popup-code="prodByCategory" :title="prodPickerOpen==='rel' ? '연관상품 추가' : '코디상품 추가'" :init-selected-ids="(prodPickerOpen==='rel' ? relProds : codeProds).map(r => r.prodId)" :on-callback="fnProdPickerCallback" />
    </div>
    <!-- ══════════════════════════════════════
     💰 옵션(가격/재고)  (SKU별 가격·재고)
══════════════════════════════════════ -->
    <div class="dtl-pane" v-show="showTab('price')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">💰 옵션(가격/재고)</div>
      <!-- 보기모드: fieldset disabled 로 SKU 재생성·인라인 입력·페이저 자동 비활성 (편집 잠금) -->
      <fieldset :disabled="cfDtlMode" style="border:none;padding:0;margin:0;min-width:0;">
      <!-- ===== ■.■.■. SKU별 가격·재고 (옵션 카테고리 설정 시) ========================= -->
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
                <option v-for="o in grpCodes.STOCK_FILTER" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </div>
            <button v-if="skuFilter1||skuFilter2||skuFilterStock" class="btn btn-xs btn-secondary"
              @click="handleBtnAction('sku-filterReset')">
              ✕ 초기화
            </button>
            <span style="font-size:12px;color:#555;margin-left:4px;">총 재고: <strong> {{ cfTotalStock }} </strong> 개</span>
            <button v-if="!cfDtlMode" class="btn btn-sm btn-secondary" @click="handleBtnAction('sku-generate')">🔄 SKU 재생성</button>
            <!-- 뷰 전환 — 2단 옵션일 때만. 1차원 옵션은 행이 하나라 격자로 얻을 게 없다 -->
            <div v-if="optGroups.length===2" style="display:flex;border:1px solid #d0d0d0;border-radius:6px;overflow:hidden;">
              <button class="btn btn-xs" :class="uiState.skuView==='list' ? 'btn-blue' : 'btn-secondary'"
                style="font-size:11px;border:none;border-radius:0;" @click="uiState.skuView='list'"
                title="SKU 한 건의 모든 값을 편집 — SKU코드·재고코드 포함">📋 목록</button>
              <button class="btn btn-xs" :class="uiState.skuView==='matrix' ? 'btn-blue' : 'btn-secondary'"
                style="font-size:11px;border:none;border-radius:0;" @click="uiState.skuView='matrix'"
                title="한 값을 모든 조합에 걸쳐 편집 — 패턴·누락이 한눈에">▦ 매트릭스</button>
            </div>
          </div>
        </div>
        <!-- ===== ■.■.■.■. 매트릭스 뷰 (한 필드 × 전체 조합) ========================
         목록과 같은 skus 배열을 직접 편집한다. 행/열 헤더 클릭 = 그 줄에 일괄값 채우기. -->
        <div v-if="optGroups.length===2 ? uiState.skuView==='matrix' : false"
          style="border:1px solid #bae0ff;border-radius:8px;padding:12px;background:#f0f8ff;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
            <span style="font-size:12px;font-weight:700;color:#0958d9;">▦ {{ fnMxField().label }} 매트릭스</span>
            <select v-model="uiState.skuMxField" style="font-size:11px;border:1px solid #91caff;border-radius:4px;padding:3px 6px;">
              <option v-for="f in SKU_MX_FIELDS" :key="f.key" :value="f.key">{{ f.label }}</option>
            </select>
            <span style="color:#c0d8f0;">│</span>
            <!-- SKU코드/재고코드는 SKU마다 달라야 하는 식별자라 일괄 채우기 UI 자체를 숨긴다
                 (fnMxBulkGuard 가 로직상으로도 막지만, 애초에 안 되는 조작을 보여주지 않는 게 낫다). -->
            <template v-if="!fnMxField().unique">
              <span style="font-size:11px;color:#555;flex-shrink:0;">일괄값</span>
              <input v-if="fnMxField().type==='number'" type="number" v-model="uiState.skuMxBulk" placeholder="0"
                style="width:90px;font-size:11px;border:1px solid #91caff;border-radius:4px;padding:3px 6px;text-align:right;" />
              <select v-else v-model="uiState.skuMxBulk" style="font-size:11px;border:1px solid #91caff;border-radius:4px;padding:3px 6px;">
                <option value="">-- 선택 --</option>
                <option v-for="c in grpCodes.OPT_STOCK_STATUS" :key="'mxb-'+c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
              </select>
              <button v-if="!cfDtlMode" class="btn btn-xs btn-secondary" style="font-size:11px;" @click="onMxFillAll()">전체 적용</button>
            </template>
            <span v-else style="font-size:11px;color:#c2410c;">SKU마다 고유해야 하는 값이라 셀을 하나씩 입력합니다(일괄 채우기 불가)</span>
            <span style="font-size:11px;color:#888;margin-left:auto;">
              {{ fnMxField().unique ? '' : '행/열 헤더 클릭 = 그 줄에 일괄값 채우기 · ' }}비활성 조합은 제외
            </span>
          </div>
          <bo-matrix
            :rows="fnMxItems(1)" :cols="fnMxItems(2)"
            row-key="_id" col-key="_id" row-label="nm" col-label="nm"
            row-style-key="prodOptStyle" col-style-key="prodOptStyle"
            :corner="((optGroups[0]?.grpNm)||'1단') + ' / ' + ((optGroups[1]?.grpNm)||'2단')"
            :cell-type="fnMxField().type" :options="grpCodes.OPT_STOCK_STATUS"
            :cell="fnMxCell" :cell-style="fnMxStyle" :cell-title="fnMxTitle"
            :readonly="cfDtlMode" max-height="420px" cell-width="70px"
            @cell-change="onMxCellChange" @row-header="onMxFillRow" @col-header="onMxFillCol" />
        </div>
        <!-- ===== ■.■.■.■.■. SKU 테이블 (가격 섹션 + 재고 섹션 컬럼 분리) ===============
         매트릭스 뷰일 때만 숨긴다. 2단 옵션이 아니면 뷰 전환 버튼 자체가 없으므로 항상 목록. -->
        <div v-if="optGroups.length===2 ? uiState.skuView==='list' : true"
          style="overflow:auto;max-height:320px;border:1px solid #e0e0e0;border-radius:6px;margin-bottom:8px;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:900px;">
            <thead style="position:sticky;top:0;z-index:2;">
              <!-- ===== 그룹 헤더 행 ================================================= -->
              <tr>
                <th colspan="4" style="padding:3px 6px;background:#f5f5f5;border-bottom:1px solid #e0e0e0;border-right:2px solid #c7d2fe;"></th>
                <th colspan="3" style="padding:3px 8px;background:#fffbe6;border-bottom:1px solid #e0e0e0;border-right:2px solid #c7d2fe;text-align:center;font-size:11px;font-weight:700;color:#b45309;">
                  💰 가격 설정
                </th>
                <th colspan="3" style="padding:3px 8px;background:#f0fdf4;border-bottom:1px solid #e0e0e0;border-right:2px solid #c7d2fe;text-align:center;font-size:11px;font-weight:700;color:#166534;">
                  📦 재고 설정
                </th>
                <th colspan="2" style="padding:3px 6px;background:#f5f5f5;border-bottom:1px solid #e0e0e0;text-align:center;font-size:11px;font-weight:600;color:#888;"></th>
              </tr>
              <!-- ===== 컬럼 헤더 행 ================================================= -->
              <tr style="background:#f5f5f5;border-bottom:2px solid #d0d0d0;">
                <th style="width:24px;padding:3px 4px;text-align:center;color:#888;font-size:11px;">#</th>
                <th style="width:38px;padding:3px 4px;text-align:center;color:#555;font-size:11px;">이동</th>
                <th style="width:80px;padding:3px 6px;text-align:left;font-weight:600;color:#555;font-size:11px;">
                  1단<span v-if="safeFirst(optGroups)?.grpNm" style="color:#aaa;font-weight:400;"> ({{ safeFirst(optGroups).grpNm }})</span>
                </th>
                <th v-if="optGroups.length>1" style="width:80px;padding:3px 6px;text-align:left;font-weight:600;color:#555;font-size:11px;border-right:2px solid #c7d2fe;">
                  2단<span v-if="optGroups[1]?.grpNm" style="color:#aaa;font-weight:400;"> ({{ optGroups[1].grpNm }})</span>
                </th>
                <th v-else style="width:0;border-right:2px solid #c7d2fe;"></th>
                <!-- 가격 섹션 -->
                <th style="width:130px;padding:3px 6px;text-align:left;font-weight:600;color:#b45309;font-size:11px;background:#fffde7;">SKU코드</th>
                <th style="width:120px;padding:3px 6px;text-align:right;font-weight:600;color:#b45309;font-size:11px;background:#fffde7;">기본가</th>
                <th style="width:100px;padding:3px 6px;text-align:right;font-weight:600;color:#b45309;font-size:11px;background:#fffde7;border-right:2px solid #c7d2fe;">추가금액</th>
                <!-- 재고 섹션 -->
                <th style="width:160px;padding:3px 6px;text-align:left;font-weight:600;color:#166534;font-size:11px;background:#f0fdf4;">재고코드</th>
                <th style="width:90px;padding:3px 6px;text-align:right;font-weight:600;color:#166534;font-size:11px;background:#f0fdf4;">재고수량</th>
                <th style="width:100px;padding:3px 6px;text-align:left;font-weight:600;color:#166534;font-size:11px;background:#f0fdf4;border-right:2px solid #c7d2fe;">판매상태</th>
                <!-- 기타 -->
                <th style="width:58px;padding:3px 6px;text-align:right;color:#555;font-size:11px;">판매수량</th>
                <th style="width:36px;padding:3px 4px;text-align:center;color:#555;font-size:11px;">사용</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(sku, ii) in cfSkusFiltered" :key="sku?._id"
                :style="(sku.useYn==='N' ? 'opacity:0.45;background:#f5f5f5;' : (sku.statusCd==='SOLD_OUT'||sku.stock===0 ? 'background:#fffbe6;' : sku.statusCd==='SUSPENDED'?'background:#fff1f0;':(ii%2===1?'background:#fafafa;':'')))+'border-bottom:1px solid #f0f0f0;'">
                <td style="padding:2px 4px;text-align:center;color:#bbb;font-size:11px;">{{ ii+1 }}</td>
                <td style="padding:2px 2px;text-align:center;white-space:nowrap;">
                  <button type="button" @click="handleBtnAction('sku-move',{sku,dir:'up'})" :disabled="ii===0"
                    style="border:1px solid #ddd;background:#fff;border-radius:3px;width:18px;height:18px;font-size:10px;padding:0;color:#666;margin-right:1px;" title="위로">▲</button>
                  <button type="button" @click="handleBtnAction('sku-move',{sku,dir:'down'})" :disabled="ii===cfSkusFiltered.length-1"
                    style="border:1px solid #ddd;background:#fff;border-radius:3px;width:18px;height:18px;font-size:10px;padding:0;color:#666;" title="아래로">▼</button>
                </td>
                <td style="padding:2px 6px;">
                  <span class="badge badge-gray" style="font-size:11px;">{{ sku._nm1 }}</span>
                  <span v-if="sku._id===cfBaseSkuId" class="badge badge-blue" style="font-size:10px;margin-left:3px;" title="첫 번째 옵션조합 — 상품목록/홈 대표가로 노출되는 기준상품. 추가금액 0원 고정">기준상품</span>
                </td>
                <td v-if="optGroups.length>1" style="padding:2px 6px;border-right:2px solid #e0e8ff;">
                  <span class="badge badge-blue" style="font-size:11px;">{{ sku._nm2 }}</span>
                </td>
                <td v-else style="border-right:2px solid #e0e8ff;"></td>
                <!-- ===== 가격 섹션 (노란 배경) ======================================= -->
                <td style="padding:2px 4px;background:#fffff8;">
                  <input v-model="sku.skuCode" placeholder="SKU-XXX"
                    style="width:100%;font-size:11px;border:1px solid #e8d49a;border-radius:4px;padding:2px 5px;height:22px;font-family:monospace;" />
                </td>
                <td style="padding:2px 4px;background:#fffff8;">
                  <div style="width:100%;font-size:12px;background:#faf7ee;color:#555;border:1px solid #e8d49a;border-radius:4px;padding:2px 6px;height:22px;line-height:18px;text-align:right;">
                    {{ ((form.salePrice||0)+(sku.addPrice||0)).toLocaleString() }}원
                  </div>
                </td>
                <td style="padding:2px 4px;background:#fffff8;border-right:2px solid #e0e8ff;">
                  <input type="number" v-model.number="sku.addPrice" placeholder="0"
                    :disabled="sku._id===cfBaseSkuId" :title="sku._id===cfBaseSkuId ? '기준상품은 추가금액 0원 고정' : ''"
                    style="width:100%;font-size:12px;border:1px solid #e8d49a;border-radius:4px;padding:2px 5px;height:22px;text-align:right;"
                    :style="sku._id===cfBaseSkuId ? 'background:#f5f5f5;color:#999;cursor:not-allowed;' : ''" />
                </td>
                <!-- ===== 재고 섹션 (녹색 배경) ======================================= -->
                <td style="padding:2px 4px;background:#f8fff8;">
                  <div style="display:flex;align-items:center;gap:3px;">
                    <input v-model="sku.stockCode" placeholder="재고코드"
                      style="flex:1;min-width:0;font-size:11px;border:1px solid #86efac;border-radius:4px;padding:2px 4px;height:22px;font-family:monospace;" />
                    <button type="button"
                      @click="handleBtnAction('skuStockCode-pick', sku)"
                      style="flex-shrink:0;border:1px solid #86efac;background:#f0fdf4;color:#166534;border-radius:4px;width:22px;height:22px;font-size:12px;padding:0;cursor:pointer;"
                      title="재고코드 모달 선택">🔍</button>
                  </div>
                </td>
                <td style="padding:2px 4px;background:#f8fff8;">
                  <input type="number" v-model.number="sku.stock" placeholder="0" min="0"
                    :style="'width:100%;font-size:12px;border:1px solid #86efac;border-radius:4px;padding:2px 5px;height:22px;text-align:right;'+((sku.stock||0)===0?'color:#f5222d;font-weight:700;':'')" />
                </td>
                <td style="padding:2px 4px;background:#f8fff8;border-right:2px solid #e0e8ff;">
                  <select v-model="sku.statusCd"
                    :style="'width:100%;font-size:11px;border:1px solid #86efac;border-radius:4px;padding:2px 4px;height:22px;'+(sku.statusCd==='ON_SALE'?'color:#166534;':sku.statusCd==='SOLD_OUT'?'color:#f5a623;':sku.statusCd==='SUSPENDED'?'color:#cf1322;':'color:#555;')">
                    <option v-for="c in grpCodes.OPT_STOCK_STATUS" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
                  </select>
                </td>
                <!-- ===== 기타 ===================================================== -->
                <td style="padding:2px 6px;text-align:right;font-size:11px;color:#888;">{{ (sku.saleCnt||0).toLocaleString() }}</td>
                <td style="padding:2px 4px;text-align:center;">
                  <input type="checkbox" :checked="sku.useYn==='Y'" @change="sku.useYn=$event.target.checked?'Y':'N'" style="width:14px;height:14px;" />
                </td>
              </tr>
              <tr v-if="skus.length===0">
                <td :colspan="optGroups.length>1?13:12" style="text-align:center;color:#bbb;padding:16px;font-size:12px;">
                  옵션설정 탭에서 옵션 값 입력 후 [🔄 SKU 재생성]을 눌러주세요.
                </td>
              </tr>
              <tr v-else-if="cfSkusFiltered.length===0">
                <td :colspan="optGroups.length>1?13:12" style="text-align:center;color:#f5a623;padding:12px;font-size:12px;">
                  필터 조건에 맞는 SKU가 없습니다.
                  <button class="btn btn-xs btn-secondary" @click="handleBtnAction('sku-filterReset')">필터 초기화</button>
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
          :readonly="cfDtlMode" :cols="3" compact plain-readonly :show-actions="false" />
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
              row-key="prodSkuId" :row-style="fnRemainSkuRowStyle" empty-text="잔존 SKU 데이터가 없습니다."></bo-grid>
          </div>
          <div v-if="tabData.skus.length > tabPage.skus.pageSize" class="pagination" style="margin:8px 0 16px;">
            <button class="pager" @click="handleBtnAction('tabPage-change', {key:'skus', pageNo:1})" :disabled="tabPage.skus.pageNo===1">«</button>
            <button class="pager" @click="handleBtnAction('tabPage-change', {key:'skus', pageNo:tabPage.skus.pageNo-1})" :disabled="tabPage.skus.pageNo===1">‹</button>
            <button v-for="n in fnTabPageNos('skus')" :key="n" class="pager" :class="{active:tabPage.skus.pageNo===n}" @click="handleBtnAction('tabPage-change', {key:'skus', pageNo:n})">
              {{ n }}
            </button>
            <button class="pager" @click="handleBtnAction('tabPage-change', {key:'skus', pageNo:tabPage.skus.pageNo+1})" :disabled="tabPage.skus.pageNo===cfTabTotalPages('skus')">
              ›
            </button>
            <button class="pager" @click="handleBtnAction('tabPage-change', {key:'skus', pageNo:cfTabTotalPages('skus')})" :disabled="tabPage.skus.pageNo===cfTabTotalPages('skus')">
              »
            </button>
            <span class="pager-right">{{ tabData.skus.length }}건 / {{ tabPage.skus.pageSize }}개씩</span>
          </div>
        </template>
      </template>
      </fieldset>
      <!-- ===== ■.■.■. 저장/취소 버튼 (맨 아래) ===================================== -->
      <bo-form-actions v-if="active" :readonly="cfDtlMode" :show-delete="false"
        :save-disabled="cfSaveDisabled" :save-title="cfSaveDisabled ? '먼저 기본정보 탭에서 상품을 등록해주세요.' : ''"
        :edit-click="() => handleBtnAction('price-form-edit')"
        :save-click="() => handleBtnAction('price-form-save')"
        :delete-click="() => handleBtnAction('price-form-delete')"
        :cancel-click="() => handleBtnAction('price-form-cancel')"
        :close-click="() => handleBtnAction('price-form-close')" />
    </div>
    <!-- ══════════════════════════════════════
     📦 묶음구성  (pd_prod_bundle_item)
══════════════════════════════════════ -->
    <div class="dtl-pane" v-show="showTab('bundle')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📦 묶음구성</div>
      <fieldset :disabled="cfDtlMode" style="border:none;padding:0;margin:0;min-width:0;">
      <!-- ===== ■.■.■. 안내 + 안분율 요약 =========================================== -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:10px 14px;background:#f9f9f9;border-radius:8px;border:1px solid #eee;flex-wrap:wrap;gap:8px;">
        <div style="font-size:13px;color:#555;">
          묶음상품을 구성하는 개별 상품을 추가하고 <strong>안분율(%)</strong>을 설정하세요.
          <br><span style="font-size:11px;color:#888;">안분율 합계가 100%여야 저장됩니다.</span>
        </div>
        <div style="font-size:14px;font-weight:700;" :style="cfBundleRateOk ? 'color:#389e0d;' : 'color:#f5222d;'">
          안분율 합계: {{ cfBundleRateSum }}%
          <span v-if="!cfBundleRateOk" style="font-size:11px;font-weight:400;margin-left:4px;">(100% 가 되어야 합니다)</span>
        </div>
        <div v-if="!cfDtlMode" style="display:flex;gap:6px;flex-shrink:0;">
          <button class="btn btn-sm btn-secondary" @click="handleBtnAction('bundlePicker-open')">+ 상품 추가</button>
        </div>
      </div>
      <!-- ===== ■.■.■. 구성 목록 ================================================ -->
      <bo-grid bare :columns="columns.bundleGrid" :rows="tabData.bundleItems" row-key="_id"
        empty-text="+ 상품 추가 버튼으로 묶음 구성품을 등록하세요."
        @cell-change="e => { e.row[e.col.key] = e.value; }">
        <template v-if="!cfDtlMode" #row-actions="{ row, idx, pinStyle }">
          <td :style="'text-align:center;white-space:nowrap;' + pinStyle">
            <button class="btn btn-xs btn-danger" @click="handleBtnAction('bundleItem-remove', idx)">삭제</button>
          </td>
        </template>
      </bo-grid>
      </fieldset>
      <bo-form-actions v-if="active" :readonly="cfDtlMode" :show-delete="false"
        :save-disabled="cfSaveDisabled || !cfBundleRateOk"
        :save-title="!cfBundleRateOk ? '안분율 합계가 100%여야 합니다.' : (cfSaveDisabled ? '먼저 기본정보 탭에서 상품을 등록해주세요.' : '')"
        :edit-click="() => handleBtnAction('bundle-form-edit')"
        :save-click="() => handleBtnAction('bundle-form-save')"
        :delete-click="() => handleBtnAction('bundle-form-delete')"
        :cancel-click="() => handleBtnAction('bundle-form-cancel')"
        :close-click="() => handleBtnAction('bundle-form-close')" />
      <!-- ===== ■.■.■. 상품 피커 모달 ============================================= -->
      <bo-cm-popup-modal v-if="bundlePickerOpen" popup-cmd="cmPopup-bundle-pick" popup-code="prod"
        title="묶음 상품 선택" :init-selected-ids="tabData.bundleItems.map(r => r.prodId)"
        :on-callback="fnCallbackModal" @close="bundlePickerOpen = false" />
    </div>
    <!-- ══════════════════════════════════════
     🎁 세트구성  (pd_prod_set_item)
══════════════════════════════════════ -->
    <div class="dtl-pane" v-show="showTab('setitems')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🎁 세트구성</div>
      <fieldset :disabled="cfDtlMode" style="border:none;padding:0;margin:0;min-width:0;">
      <!-- ===== ■.■.■. 안내 + 버튼 ================================================ -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:10px 14px;background:#f9f9f9;border-radius:8px;border:1px solid #eee;flex-wrap:wrap;gap:8px;">
        <div style="font-size:13px;color:#555;">
          세트를 구성하는 상품 또는 비상품 구성품(박스, 엽서 등)을 추가하세요.
          <br><span style="font-size:11px;color:#888;">비상품 구성품은 [빈 행 추가] 후 설명을 입력하세요.</span>
        </div>
        <div v-if="!cfDtlMode" style="display:flex;gap:6px;flex-shrink:0;">
          <button class="btn btn-sm btn-secondary" @click="handleBtnAction('setItem-addEmpty')">+ 빈 행 추가</button>
          <button class="btn btn-sm btn-secondary" @click="handleBtnAction('setPicker-open')">+ 상품 추가</button>
        </div>
      </div>
      <!-- ===== ■.■.■. 구성 목록 ================================================ -->
      <bo-grid bare :columns="columns.setGrid" :rows="tabData.setItems" row-key="_id"
        empty-text="+ 상품 추가 또는 빈 행 추가로 세트 구성품을 등록하세요."
        @cell-change="e => { e.row[e.col.key] = e.value; }">
        <template v-if="!cfDtlMode" #row-actions="{ row, idx }">
          <td style="text-align:center;white-space:nowrap;">
            <button class="btn btn-xs btn-danger" @click="handleBtnAction('setItem-remove', idx)">삭제</button>
          </td>
        </template>
      </bo-grid>
      </fieldset>
      <bo-form-actions v-if="active" :readonly="cfDtlMode" :show-delete="false"
        :save-disabled="cfSaveDisabled" :save-title="cfSaveDisabled ? '먼저 기본정보 탭에서 상품을 등록해주세요.' : ''"
        :edit-click="() => handleBtnAction('setitems-form-edit')"
        :save-click="() => handleBtnAction('setitems-form-save')"
        :delete-click="() => handleBtnAction('setitems-form-delete')"
        :cancel-click="() => handleBtnAction('setitems-form-cancel')"
        :close-click="() => handleBtnAction('setitems-form-close')" />
      </div>
      <!-- ===== ■.■.■. 상품 피커 모달 ============================================= -->
      <bo-cm-popup-modal v-if="setPickerOpen" popup-cmd="cmPopup-set-pick" popup-code="prod"
        title="세트 구성 상품 선택" :init-selected-ids="tabData.setItems.map(r => r.prodId)"
        :on-callback="fnCallbackModal" @close="setPickerOpen = false" />
    </div>
  </div>
  <!-- ===== /dtl-tab-grid ============================================== -->
  <!-- ===== □. 탭 컨텐츠 =================================================== -->
  <!-- ===== ■. 재고코드 선택 모달 (공통팝업 — popup-code="prodStock") ============= -->
  <bo-cm-popup-modal v-if="uiState.stockCodePickerOpen" popup-cmd="cmPopup-prodStock-pick" popup-code="prodStock"
    :title="uiState.stockCodePickerSku ? ('📦 재고코드 선택 — ' + uiState.stockCodePickerSku._nm1 + (uiState.stockCodePickerSku._nm2 ? ' / ' + uiState.stockCodePickerSku._nm2 : '')) : '📦 재고코드 선택'"
    @select="r => handleBtnAction('skuStockCode-select', r)" @close="handleBtnAction('skuStockCode-close')" />
  <!-- ===== □. 재고코드 선택 모달 ============================================= -->
</bo-container>
</div>
<!-- ===== □. 상세 카드 (제목 + 탭바 + 탭컨텐츠를 한 영역으로) ===================== -->
<!-- 이력정보는 목록(PdProdMng) 관리컬럼의 [이력] 버튼으로만 노출된다 — 상세 하단 상시 렌더 폐지(2026-08-16) -->
<!-- ===== ■. 공통코드 그룹 미리보기 모달 (BoModals.js / window.BoCodeGrpModal) ===== -->
<!-- ===== ■. 영역 ====================================================== -->
<bo-cm-popup-modal popup-cmd="cmPopup-code-grp" popup-code="code" :init-param="{ codeGrp: codeGrpModal.codeGrp }" :show="codeGrpModal.show" :title="codeGrpModal.title" :on-callback="fnCallbackModal" />
<!-- ===== □. 영역 ====================================================== -->
`
};
