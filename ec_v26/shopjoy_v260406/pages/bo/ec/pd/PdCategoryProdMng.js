/* ShopJoy Admin - 카테고리상품관리 (pd_category_prod) */
window.PdCategoryProdMng = {
  name: 'PdCategoryProdMng',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const categories = reactive([]);
    const products = reactive([]);
    const categoryProds = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, viewMode: window._ecCategoryProdState?.viewMode || 'tab', activeTypeCd: 'NORMAL'});
    const tab = Vue.toRef(uiState, 'tab');
    const codes = reactive({
      product_statuses: [],
      disp_yn_opts: [{ codeValue: 'Y', codeLabel: '전시' }, { codeValue: 'N', codeLabel: '비전시' }],
    });


    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.product_statuses = codeStore.sgGetGrpCodes('PRODUCT_STATUS');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = boUtil.useAppCodeReady(uiState, fnLoadCodes);


    /* 선택된 카테고리 (watch 이전에 선언 필수) */
    const cfSelectedCatId = ref(null);


    watch(() => cfSelectedCatId.value, async (newVal) => {
      if (newVal) {
        pager.pageNo = 1;
        searchParam.categoryId = newVal;
        await handleSearchList('DEFAULT');
      } else {
        categoryProds.splice(0, categoryProds.length);
      }
    });

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
    });

    /* -- 뷰모드 영속화 -- */
    if (!window._ecCategoryProdState) window._ecCategoryProdState = { viewMode: 'tab' };

        watch(() => uiState.viewMode, v => { window._ecCategoryProdState.viewMode = v; });

    /* -- 진열 유형 탭 -- */
    const TYPE_TABS = [
      { cd: 'NORMAL',    nm: '일반상품' },
      { cd: 'HIGHLIGHT', nm: '하이라이트상품' },
      { cd: 'RECOMMEND', nm: '추천상품' },
      { cd: 'MAIN',      nm: '대표상품' },
      { cd: 'BANNER',    nm: '배너상품' },
      { cd: 'HOT_DEAL',  nm: '핫딜상품' },
    ];
    
    /* -- 강조 옵션 -- */
    const EMPHASIS_OPTS = [
      { cd: 'BOLD',       nm: '볼드',      icon: 'B' },
      { cd: 'TEXT_COLOR', nm: '글자색',    icon: 'A' },
      { cd: 'EMOTICON',   nm: '이모티콘',  icon: '😊' },
      { cd: 'MARQUEE',    nm: '흐르는글자', icon: '〜' },
    ];
    const parseEmphasis  = str => str ? str.split('^').filter(Boolean) : [];
    const hasEmphasis    = (str, cd) => parseEmphasis(str).includes(cd);
    const toggleEmphasis = (row, cd) => {
      const s = new Set(parseEmphasis(row.emphasisCd));
      if (s.has(cd)) s.delete(cd); else s.add(cd);
      row.emphasisCd = s.size ? '^' + [...s].join('^') + '^' : '';
    };

    /* -- 날짜 기본값 -- */
    const defaultDispEndDate   = () => { const y = new Date().getFullYear() + 3; return `${y}-12-31`; };
    const defaultDispStartDate = () => new Date().toISOString().slice(0, 10);

    /* -- 검색 -- */
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const _initSearchParam = () => ({ prodNm: '', categoryId: '' });
    const searchParam = reactive(_initSearchParam());

    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const { prodNm, ...restParam } = searchParam;
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...Object.fromEntries(Object.entries(restParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
          ...(prodNm ? { prodNm: prodNm.trim() } : {}),
        };
        const res = await boApiSvc.pdCategory.getProds(params, '카테고리상품관리', '목록조회');
        const data = res.data?.data;
        categoryProds.splice(0, categoryProds.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage  = data?.pageTotalPage  || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
      } catch (err) {
        console.error('[handleSearchList]', err);
        categoryProds.splice(0, categoryProds.length);
      }
    };

    const onSearch = () => {
      pager.pageNo = 1;
      Object.assign(pager.pageCond, searchParam);
      handleSearchList('DEFAULT');
    };
  
    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      onSearch();
    };

    /* 카테고리 목록 로드 (getCategoryNm 등 로컬 lookup용) */
    const handleSearchCategoriesList = async () => {
      try {
        const res = await boApiSvc.pdCategory.getPage({ pageNo: 1, pageSize: 10000 }, '카테고리관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        categories.splice(0, categories.length, ...list);
      } catch (e) {
        console.error('[handleSearchCategoriesList]', e);
      }
    };

    /* 상품 목록 로드 (피커/헬퍼용) */
    const handleSearchProductsList = async () => {
      try {
        const res = await boApiSvc.pdProd.getPage({ pageNo: 1, pageSize: 10000 }, '카테고리상품관리', '상품목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        products.splice(0, products.length, ...list);
      } catch (e) {
        console.error('[handleSearchProductsList]', e);
      }
    };

    /* ★ onMounted — 진입 시 카테고리·상품 목록 조회 */
    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      await Promise.all([handleSearchCategoriesList(), handleSearchProductsList()]);
      try {
        await handleSearchList('DEFAULT');
      } catch (err) {
        console.warn('[onMounted] handleSearchList failed:', err.message);
      }
    });

    /* 선택된 카테고리 - selectNode 헬퍼 */
    const selectNode = id => {
      if (id === null) { cfSelectedCatId.value = null; return; }
      cfSelectedCatId.value = (cfSelectedCatId.value === id) ? null : id;
    };
    const cfSelectedCat = computed(() => categories.find(c => c.categoryId === cfSelectedCatId.value));
    const cfIsLeafCat = computed(() => !categories.some(c => c.parentCategoryId === cfSelectedCatId.value));

    /* 좌측 트리 빌드 (expanded 반영) */
    const fnDepthColor = (d) => ({0:'#e8587a',1:'#1677ff',2:'#3ba87a'}[d] || '#999');
    const fnDepthBullet = (d) => ['●','○','▪'][d] || '·';
    const totalProdCount = (catId) => categoryProds.filter(cp => cp.categoryId === catId).length;
    const cfTypeCountMap = computed(() => {
      const map = {};
      TYPE_TABS.forEach(t => { map[t.cd] = categoryProds.filter(cp => cp.typeCd === t.cd).length; });
      return map;
    });
    const cfFilteredRows = computed(() => {
      if (!cfSelectedCatId.value) return [];
      return categoryProds.filter(cp => {
        const isSameCategory = cp.categoryId === cfSelectedCatId.value;
        const isChildCategory = categories.some(c => c.parentCategoryId === cfSelectedCatId.value && cp.categoryId === c.categoryId);
        const isSameType = cp.typeCd === uiState.activeTypeCd;
        return (isSameCategory || isChildCategory) && isSameType;
      });
    });

    /* -- 드래그 상태 -- */
    const dragoverIdx = ref(null);
    let dragStartIdx = null;
    const onDragStart = (idx) => { dragStartIdx = idx; };
    const onDragOver = (idx) => { dragoverIdx.value = idx; };
    const onDrop = () => {
      if (dragStartIdx !== null && dragoverIdx.value !== null && dragStartIdx !== dragoverIdx.value) {
        const temp = categoryProds[dragStartIdx];
        categoryProds.splice(dragStartIdx, 1);
        categoryProds.splice(dragoverIdx.value, 0, temp);
      }
      dragoverIdx.value = null;
      dragStartIdx = null;
    };

    /* -- 상품 정보 조회 헬퍼 -- */
    const getProdNm = (prodId) => {
      const prod = products.find(p => p.prodId === prodId || p.productId === prodId);
      return prod?.prodNm || prod?.productName || `[${prodId}]`;
    };
    const getProd = (prodId) => products.find(p => p.prodId === prodId || p.productId === prodId);
    const getCatPath = (catId) => {
      const cat = categories.find(c => c.categoryId === catId);
      if (!cat) return '-';
      const path = [cat.categoryNm];
      let parent = cat.parentCategoryId;
      while (parent && categories.some(c => c.categoryId === parent)) {
        const p = categories.find(c => c.categoryId === parent);
        path.unshift(p.categoryNm);
        parent = p.parentCategoryId;
      }
      return path.join(' > ');
    };

    /* -- 행 제거 -- */
    const removeRow = (row) => {
      const idx = categoryProds.findIndex(r => r === row);
      if (idx !== -1) categoryProds.splice(idx, 1);
    };

    /* -- 상품 추가 -- */
    const addProd = (prod) => {
      const exists = categoryProds.some(cp => cp.prodId === prod.productId && cp.categoryId === cfSelectedCatId.value && cp.typeCd === uiState.activeTypeCd);
      if (exists) {
        if (props.showToast) props.showToast('이미 추가된 상품입니다.', 'warning');
        return;
      }
      const newRow = {
        _id: Math.random(),
        _isNew: true,
        prodId: prod.productId,
        categoryId: cfSelectedCatId.value,
        typeCd: uiState.activeTypeCd,
        emphasisCd: '',
        dispStartDate: defaultDispStartDate(),
        dispEndDate: defaultDispEndDate(),
        dispYn: 'Y'
      };
      categoryProds.push(newRow);
      pickerOpen.value = false;
      if (props.showToast) props.showToast('상품이 추가되었습니다.', 'success');
    };

    /* -- 피커 검색 -- */
    const cfPickerList = computed(() => {
      return products.filter(p => {
        const q = pickerSearch.value.toLowerCase();
        return !q || p.prodNm?.toLowerCase().includes(q) || String(p.prodId || p.productId || '').includes(q);
      }).slice(0, 50);
    });

    const pickerOpen = ref(false);
    const pickerSearch = ref('');
    const onSave = async () => {
      const ok = await props.showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;
      try {
        const res = await boApiSvc.pdCategory.updateProds({ categoryProds }, '카테고리상품관리', '저장');
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('저장되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    // -- return ---------------------------------------------------------------

    return {
      codes, uiState, categories, categoryProds,
      TYPE_TABS, EMPHASIS_OPTS, parseEmphasis, hasEmphasis, toggleEmphasis,
      defaultDispStartDate, defaultDispEndDate,
      searchParam, onSearch, onReset,
      pager,
      cfFilteredRows, cfPickerList,
      cfSelectedCatId, cfSelectedCat, cfIsLeafCat, selectNode,
      fnDepthColor, fnDepthBullet, totalProdCount, cfTypeCountMap,
      dragoverIdx, onDragStart, onDragOver, onDrop,
      getProdNm, getProd, getCatPath, removeRow, addProd,
      pickerOpen, pickerSearch, onSave,
      showRefModal: props.showRefModal, showToast: props.showToast, showConfirm: props.showConfirm, setApiRes: props.setApiRes, navigate: props.navigate,
    };
  },

  template: `
<div>
  <div class="page-title">카테고리상품관리</div>

  <!-- -- 검색 ------------------------------------------------------------- -->
  <div class="card">
    <div class="search-bar">
      <label class="search-label">상품명</label>
      <input class="form-control" v-model="searchParam.prodNm" @keyup.enter="() => onSearch?.()"
             placeholder="상품명 검색" style="max-width:280px">
      <div class="search-actions">
        <button class="btn btn-primary btn-sm" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <!-- -- 좌 트리 + 우 상품목록 -------------------------------------------------- -->
  <div style="display:grid;grid-template-columns:220px 1fr;gap:16px;align-items:flex-start">

    <!-- -- 좌측 카테고리 트리 --------------------------------------------------- -->
    <div class="card" style="padding:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:13px;font-weight:600;color:#555">📁 카테고리</span>
        <div v-if="cfSelectedCatId" style="font-size:11px;color:#1677ff;cursor:pointer" @click="selectNode(null)">전체</div>
      </div>
      <category-tree mode="tree" :selected="cfSelectedCatId" :show-count="totalProdCount" @select="selectNode" />
    </div>

    <!-- -- 우측 상품 목록 ----------------------------------------------------- -->
    <div class="card">

      <!-- -- 선택 전 안내 ---------------------------------------------------- -->
      <div v-if="!cfSelectedCatId" style="text-align:center;padding:60px;color:#aaa">
        <div style="font-size:32px;margin-bottom:12px">📂</div>
        <div>좌측에서 카테고리를 선택하세요.</div>
      </div>

      <template v-else>
        <!-- -- 카테고리명 + 저장/추가 버튼 ----------------------------------------- -->
        <div class="toolbar" style="margin-bottom:0">
          <span class="list-title">
            <span :style="{ color: fnDepthColor((cfSelectedCat?.depth||1)-1), fontWeight:700, marginRight:'4px' }">
              {{ fnDepthBullet((cfSelectedCat?.depth||1)-1) }}
            </span>
            {{ cfSelectedCat?.categoryNm }}
            <span v-if="!cfIsLeafCat" style="font-size:11px;color:#aaa;margin-left:6px">(하위 포함)</span>
          </span>
          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary btn-sm" @click="pickerOpen=true;pickerSearch=''">+ 상품추가</button>
            <button class="btn btn-primary btn-sm" @click="onSave">저장</button>
          </div>
        </div>

        <!-- -- 탭바 + 뷰모드 버튼 ---------------------------------------------- -->
        <div class="tab-bar-row" style="margin:12px 0 0">
          <div class="tab-nav" style="flex:1;flex-wrap:wrap">
            <button v-for="tab in TYPE_TABS" :key="tab?.cd"
                    class="tab-btn" :class="{ active: uiState.activeTypeCd===tab.cd }"
                    @click="uiState.activeTypeCd=tab.cd">
              {{ tab.nm }}
              <span v-if="cfTypeCountMap[tab.cd]" class="tab-count">{{ cfTypeCountMap[tab.cd] }}</span>
            </button>
          </div>
          <div class="tab-view-modes">
            <button class="tab-view-mode-btn" :class="{ active: uiState.viewMode==='tab' }"  @click="uiState.viewMode='tab'"  title="탭으로 보기">📑</button>
            <button class="tab-view-mode-btn" :class="{ active: uiState.viewMode==='1col' }" @click="uiState.viewMode='1col'" title="1열로 보기">1▭</button>
            <button class="tab-view-mode-btn" :class="{ active: uiState.viewMode==='2col' }" @click="uiState.viewMode='2col'" title="2열로 보기">2▭</button>
            <button class="tab-view-mode-btn" :class="{ active: uiState.viewMode==='3col' }" @click="uiState.viewMode='3col'" title="3열로 보기">3▭</button>
            <button class="tab-view-mode-btn" :class="{ active: uiState.viewMode==='4col' }" @click="uiState.viewMode='4col'" title="4열로 보기">4▭</button>
          </div>
        </div>

        <div style="font-size:12px;color:#aaa;margin:8px 0 4px;padding:0 2px">
          ≡ 드래그로 순서 변경 · 저장 후 반영됩니다.
        </div>

        <!-- -- TABLE 뷰 (tab / 1col) ------------------------------------- -->
        <table v-if="uiState.viewMode==='tab'||uiState.viewMode==='1col'" class="bo-table">
          <thead><tr>
            <th style="width:28px"></th>
            <th style="width:36px;text-align:center">순서</th>
            <th style="width:40px;text-align:center">ID</th>
            <th>상품명 / 강조옵션</th>
            <th style="width:130px;text-align:center">카테고리경로</th>
            <th style="width:78px;text-align:right">판매가</th>
            <th style="width:44px;text-align:center">재고</th>
            <th style="width:52px;text-align:center">상태</th>
            <th v-if="uiState.activeTypeCd!=='NORMAL'" style="width:216px;text-align:center">전시기간</th>
            <th v-if="uiState.activeTypeCd!=='NORMAL'" style="width:60px;text-align:center">전시</th>
            <th style="width:40px;text-align:center">삭제</th>
          </tr></thead>
          <tbody>
            <tr v-for="(row, idx) in cfFilteredRows" :key="row?._id"
                draggable="true"
                @dragstart="onDragStart(idx)"
                @dragover.prevent="onDragOver(idx)"
                @drop="onDrop()"
                :style="dragoverIdx===idx ? 'background:#e6f4ff' : (row._isNew ? 'background:#f6ffed' : (uiState.activeTypeCd!=='NORMAL' && row.dispYn==='N' ? 'background:#fafafa;opacity:0.65' : ''))">
              <td style="text-align:center;cursor:grab;color:#bbb;font-size:17px;user-select:none">≡</td>
              <td style="text-align:center;font-size:12px;color:#aaa">{{ idx+1 }}</td>
              <td style="text-align:center;font-size:11px;color:#aaa">{{ row.prodId }}</td>
              <td>
                <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
                  <span v-if="row._isNew" class="badge badge-green" style="font-size:10px">NEW</span>
                  <span style="font-weight:500">{{ getProdNm(row.prodId) }}</span>
                </div>
                <div style="display:flex;gap:3px;flex-wrap:wrap;margin-top:4px">
                  <button v-for="opt in EMPHASIS_OPTS" :key="opt?.cd"
                          @click="toggleEmphasis(row, opt.cd)"
                          style="padding:1px 5px;border-radius:4px;font-size:10px;cursor:pointer;border:1px solid;line-height:1.5"
                          :style="hasEmphasis(row.emphasisCd, opt.cd)
                            ? 'background:#fce4ec;border-color:#e8587a;color:#e8587a;font-weight:700'
                            : 'background:#f5f5f5;border-color:#ddd;color:#bbb'">
                    {{ opt.icon }} {{ opt.nm }}
                  </button>
                </div>
              </td>
              <td style="text-align:center;font-size:10px;color:#888;line-height:1.3">
                {{ getCatPath(row.categoryId) }}
              </td>
              <td style="text-align:right;font-size:12px">
                {{ ((getProd(row.prodId)?.salePrice||getProd(row.prodId)?.price||0)).toLocaleString() }}원
              </td>
              <td style="text-align:center;font-size:12px">{{ getProd(row.prodId)?.stock ?? '-' }}</td>
              <td style="text-align:center">
                <span :class="['badge',
                       getProd(row.prodId)?.status==='판매중' ? 'badge-green' :
                       getProd(row.prodId)?.status==='품절'   ? 'badge-red'   : 'badge-gray']"
                      style="font-size:11px">
                  {{ getProd(row.prodId)?.status || '-' }}
                </span>
              </td>
              <td v-if="uiState.activeTypeCd!=='NORMAL'">
                <div style="display:flex;align-items:center;gap:2px;justify-content:center">
                  <input type="date" class="form-control" v-model="row.dispStartDate"
                         style="width:100px;padding:2px 4px;font-size:11px;text-align:center" />
                  <span style="color:#aaa;font-size:11px;flex-shrink:0">~</span>
                  <input type="date" class="form-control" v-model="row.dispEndDate"
                         style="width:100px;padding:2px 4px;font-size:11px;text-align:center" />
                </div>
              </td>
              <td v-if="uiState.activeTypeCd!=='NORMAL'" style="text-align:center">
                <select class="form-control" v-model="row.dispYn"
                        style="width:52px;padding:2px 4px;font-size:12px;text-align:center"
                        :style="row.dispYn==='Y' ? 'color:#16a34a;font-weight:600' : 'color:#9ca3af'">
                  <option v-for="c in codes.disp_yn_opts" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
                </select>
              </td>
              <td style="text-align:center">
                <button class="btn btn-danger btn-xs" @click="removeRow(row)">✕</button>
              </td>
            </tr>
            <tr v-if="!cfFilteredRows.length">
              <td :colspan="uiState.activeTypeCd!=='NORMAL' ? 11 : 9" style="text-align:center;padding:32px;color:#aaa">
                {{ searchParam.prodNm ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다. [+ 상품추가] 버튼으로 추가하세요.' }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- -- CARD GRID 뷰 (2col / 3col / 4col) ------------------------- -->
        <div v-else
             :style="{
               display:'grid',
               gridTemplateColumns: uiState.viewMode==='2col' ? 'repeat(2,1fr)' : uiState.viewMode==='3col' ? 'repeat(3,1fr)' : 'repeat(4,1fr)',
               gap:'10px',
             }">
          <div v-for="(row, idx) in cfFilteredRows" :key="row?._id"
               draggable="true"
               @dragstart="onDragStart(idx)"
               @dragover.prevent="onDragOver(idx)"
               @drop="onDrop()"
               style="border:1px solid #eee;border-radius:10px;padding:10px;background:#fff"
               :style="dragoverIdx===idx ? 'border-color:#1677ff;box-shadow:0 0 0 2px #bfdbfe'
                       : row._isNew ? 'border-color:#52c41a'
                       : (uiState.activeTypeCd!=='NORMAL' && row.dispYn==='N') ? 'opacity:0.6' : ''">
            <!-- -- 카드 헤더 ------------------------------------------------ -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <div style="display:flex;align-items:center;gap:5px">
                <span style="cursor:grab;color:#bbb;font-size:15px;user-select:none">≡</span>
                <span style="font-size:10px;color:#aaa">#{{ idx+1 }}</span>
                <span v-if="row._isNew" class="badge badge-green" style="font-size:10px">NEW</span>
              </div>
              <button class="btn btn-danger btn-xs" @click="removeRow(row)">✕</button>
            </div>
            <!-- -- 상품명 -------------------------------------------------- -->
            <div style="font-weight:600;font-size:13px;margin-bottom:3px;line-height:1.4;word-break:keep-all">
              {{ getProdNm(row.prodId) }}
            </div>
            <!-- -- 카테고리경로 ----------------------------------------------- -->
            <div style="font-size:10px;color:#888;margin-bottom:6px;background:#f5f5f5;border-radius:4px;padding:2px 6px;display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              {{ getCatPath(row.categoryId) }}
            </div>
            <!-- -- 가격/재고/상태 --------------------------------------------- -->
            <div style="display:flex;align-items:center;gap:5px;margin-bottom:6px;flex-wrap:wrap">
              <span style="font-size:12px;font-weight:700;color:#e8587a">
                {{ ((getProd(row.prodId)?.salePrice||getProd(row.prodId)?.price||0)).toLocaleString() }}원
              </span>
              <span style="font-size:10px;color:#999">재고 {{ getProd(row.prodId)?.stock ?? '-' }}</span>
              <span :class="['badge',
                     getProd(row.prodId)?.status==='판매중' ? 'badge-green' :
                     getProd(row.prodId)?.status==='품절'   ? 'badge-red'   : 'badge-gray']"
                    style="font-size:10px">
                {{ getProd(row.prodId)?.status || '-' }}
              </span>
            </div>
            <!-- -- 강조옵션 chips ------------------------------------------- -->
            <div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:7px">
              <button v-for="opt in EMPHASIS_OPTS" :key="opt?.cd"
                      @click="toggleEmphasis(row, opt.cd)"
                      style="padding:1px 5px;border-radius:4px;font-size:10px;cursor:pointer;border:1px solid;line-height:1.5"
                      :style="hasEmphasis(row.emphasisCd, opt.cd)
                        ? 'background:#fce4ec;border-color:#e8587a;color:#e8587a;font-weight:700'
                        : 'background:#f5f5f5;border-color:#ddd;color:#bbb'">
                {{ opt.icon }} {{ opt.nm }}
              </button>
            </div>
            <!-- -- 전시기간 (NORMAL 제외) ------------------------------------- -->
            <template v-if="uiState.activeTypeCd!=='NORMAL'">
              <div style="display:flex;align-items:center;gap:2px;margin-bottom:4px">
                <input type="date" class="form-control" v-model="row.dispStartDate"
                       style="flex:1;padding:2px 4px;font-size:10px;min-width:0" />
                <span style="color:#aaa;font-size:10px;flex-shrink:0">~</span>
                <input type="date" class="form-control" v-model="row.dispEndDate"
                       style="flex:1;padding:2px 4px;font-size:10px;min-width:0" />
              </div>
              <!-- -- 전시여부 ----------------------------------------------- -->
              <select class="form-control" v-model="row.dispYn"
                      style="width:100%;padding:2px 6px;font-size:11px"
                      :style="row.dispYn==='Y' ? 'color:#16a34a;font-weight:600' : 'color:#9ca3af'">
                <option v-for="c in codes.disp_yn_opts" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
              </select>
            </template>
          </div>
          <div v-if="!cfFilteredRows.length"
               style="grid-column:1/-1;text-align:center;padding:40px;color:#aaa;border:1px dashed #eee;border-radius:8px">
            등록된 상품이 없습니다. [+ 상품추가] 버튼으로 추가하세요.
          </div>
        </div>

      </template>
    </div>
  </div>

  <!-- -- 상품 추가 피커 모달 ---------------------------------------------------- -->
  <teleport to="body">
    <div v-if="pickerOpen"
         style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:center;justify-content:center"
         @click.self="pickerOpen=false">
      <div style="background:#fff;border-radius:14px;padding:24px;width:620px;max-height:72vh;display:flex;flex-direction:column;box-shadow:0 8px 48px rgba(0,0,0,0.22)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div>
            <strong style="font-size:15px">상품 추가</strong>
            <span style="font-size:12px;color:#aaa;margin-left:8px">
              → {{ cfSelectedCat?.categoryNm }} / {{ window.safeArrayUtils.safeFind(TYPE_TABS, t=>t.cd===uiState.activeTypeCd)?.nm }}
            </span>
          </div>
          <button class="btn btn-secondary btn-xs" @click="pickerOpen=false">닫기</button>
        </div>
        <input class="form-control" v-model="pickerSearch"
               placeholder="상품명 / ID / 카테고리 검색" style="margin-bottom:12px">
        <div style="overflow-y:auto;flex:1;border:1px solid #eee;border-radius:8px">
          <table class="bo-table" style="margin:0">
            <thead><tr>
              <th style="width:44px">ID</th>
              <th>상품명</th>
              <th style="width:80px;text-align:center">카테고리</th>
              <th style="width:90px;text-align:right">판매가</th>
              <th style="width:60px;text-align:center">재고</th>
              <th style="width:56px;text-align:center">추가</th>
            </tr></thead>
            <tbody>
              <tr v-for="p in cfPickerList" :key="p?.productId">
                <td style="color:#aaa;font-size:12px">{{ p.productId }}</td>
                <td>{{ p.prodNm || p.productName }}</td>
                <td style="text-align:center;font-size:12px;color:#888">{{ p.category || '-' }}</td>
                <td style="text-align:right;font-size:12px">{{ (p.salePrice||p.price||0).toLocaleString() }}원</td>
                <td style="text-align:center;font-size:12px">{{ p.stock ?? '-' }}</td>
                <td style="text-align:center">
                  <button class="btn btn-blue btn-xs" @click="addProd(p)">추가</button>
                </td>
              </tr>
              <tr v-if="!cfPickerList.length">
                <td colspan="6" style="text-align:center;padding:24px;color:#aaa">검색 결과가 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </teleport>
</div>`
};
