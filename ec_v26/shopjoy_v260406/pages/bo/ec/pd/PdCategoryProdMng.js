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
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => {
      const codeStore = window.getBoCodeStore();
      try {
        codes.product_statuses = codeStore.snGetGrpCodes('PRODUCT_STATUS') || [];
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

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
    });

    /* ── 뷰모드 영속화 ── */
    if (!window._ecCategoryProdState) window._ecCategoryProdState = { viewMode: 'tab' };

        watch(() => uiState.viewMode, v => { window._ecCategoryProdState.viewMode = v; });

    /* ── 진열 유형 탭 ── */
    const TYPE_TABS = [
      { cd: 'NORMAL',    nm: '일반상품' },
      { cd: 'HIGHLIGHT', nm: '하이라이트상품' },
      { cd: 'RECOMMEND', nm: '추천상품' },
      { cd: 'MAIN',      nm: '대표상품' },
      { cd: 'BANNER',    nm: '배너상품' },
      { cd: 'HOT_DEAL',  nm: '핫딜상품' },
    ];
    
    /* ── 강조 옵션 ── */
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

    /* ── 날짜 기본값 ── */
    const defaultDispEndDate   = () => { const y = new Date().getFullYear() + 3; return `${y}-12-31`; };
    const defaultDispStartDate = () => new Date().toISOString().slice(0, 10);

    /* ── 검색 ── */
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const searchParam = reactive({ prodNm: '' });
    const searchParamOrg = reactive({ prodNm: '' });

    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const res = await window.boApi.get('/bo/ec/pd/category-prod/page', {
          params: { pageNo: pager.pageNo, pageSize: pager.pageSize, ...(searchType === 'PAGE_CLICK' ? pager.pageCond : searchParam) },
          ...apiHdr('상품카테고리관리', '목록조회')
        });
        const data = res.data?.data;
        categoryProds.splice(0, categoryProds.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
      } catch (err) {
        console.error('[catch-info]', err);
      }
    };

    const onSearch = () => {
      pager.pageNo = 1;
      Object.assign(pager.pageCond, searchParam);
      handleSearchList('DEFAULT');
    };
  
    const onReset = () => {
    Object.assign(searchParam, searchParamOrg);
    onSearch();
  };
    const cfCatTreeFlat = computed(() => []);
    const cfFilteredRows = computed(() => []);
    const cfPickerList = computed(() => []);

    // ── return ───────────────────────────────────────────────────────────────

  return {
      codes, uiState,
      TYPE_TABS, EMPHASIS_OPTS, parseEmphasis, hasEmphasis, toggleEmphasis,
      defaultDispStartDate, defaultDispEndDate,
      searchParam, searchParamOrg, onSearch, onReset,
      pager,
      cfCatTreeFlat, cfFilteredRows, cfPickerList,
    };
  },

  template: `
<div>
  <div class="page-title">카테고리상품관리</div>

  <!-- ── 검색 ───────────────────────────────────────────────────────────── -->
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

  <!-- ── 좌 트리 + 우 상품목록 ────────────────────────────────────────────────── -->
  <div style="display:grid;grid-template-columns:220px 1fr;gap:16px;align-items:flex-start">

    <!-- ── 좌측 카테고리 트리 ─────────────────────────────────────────────────── -->
    <div class="card" style="padding:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:13px;font-weight:600;color:#555">📁 카테고리</span>
        <div v-if="cfSelectedCatId" style="font-size:11px;color:#1677ff;cursor:pointer" @click="cfSelectedCatId=null">전체</div>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:8px">
        <button class="btn btn-secondary btn-xs" style="flex:1;font-size:11px" @click="expandAll">▼ 전체</button>
        <button class="btn btn-secondary btn-xs" style="flex:1;font-size:11px" @click="collapseAll">▶ 닫기</button>
      </div>
      <div style="max-height:65vh;overflow-y:auto">
        <div v-for="cat in cfCatTreeFlat" :key="cat?.categoryId"
             style="border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:4px;padding:5px 6px"
             :style="{ paddingLeft: (cat._depth * 14 + 6) + 'px',
                       background: cfSelectedCatId===cat.categoryId ? '#fce4ec' : 'transparent',
                       color: cfSelectedCatId===cat.categoryId ? '#e8587a' : '#333',
                       borderLeft: cfSelectedCatId===cat.categoryId ? '3px solid #e8587a' : '3px solid transparent' }"
             @click="selectNode(cat.categoryId)">
          <span v-if="cat._hasChildren"
                style="width:14px;text-align:center;font-size:9px;color:#aaa;flex-shrink:0"
                @click.stop="toggleNode(cat.categoryId)">
            {{ isExpanded(cat.categoryId) ? '▼' : '▶' }}
          </span>
          <span v-else style="width:14px;flex-shrink:0"></span>
          <span :style="{ fontSize:'11px', fontWeight:700, color:fnDepthColor(cat._depth) }">{{ fnDepthBullet(cat._depth) }}</span>
          <span style="font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ cat.categoryNm }}</span>
          <span v-if="totalProdCount(cat.categoryId) > 0"
                style="font-size:10px;background:#1677ff;color:#fff;border-radius:8px;padding:0 5px;flex-shrink:0">
            {{ totalProdCount(cat.categoryId) }}
          </span>
        </div>
        <div v-if="!cfCatTreeFlat.length" style="text-align:center;padding:20px;color:#aaa;font-size:12px">카테고리 없음</div>
      </div>
    </div>

    <!-- ── 우측 상품 목록 ───────────────────────────────────────────────────── -->
    <div class="card">

      <!-- ── 선택 전 안내 ──────────────────────────────────────────────────── -->
      <div v-if="!cfSelectedCatId" style="text-align:center;padding:60px;color:#aaa">
        <div style="font-size:32px;margin-bottom:12px">📂</div>
        <div>좌측에서 카테고리를 선택하세요.</div>
      </div>

      <template v-else>
        <!-- ── 카테고리명 + 저장/추가 버튼 ───────────────────────────────────────── -->
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

        <!-- ── 탭바 + 뷰모드 버튼 ────────────────────────────────────────────── -->
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

        <!-- ── TABLE 뷰 (tab / 1col) ───────────────────────────────────── -->
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
                  <option value="Y">전시</option>
                  <option value="N">비전시</option>
                </select>
              </td>
              <td style="text-align:center">
                <button class="btn btn-danger btn-xs" @click="removeRow(row)">✕</button>
              </td>
            </tr>
            <tr v-if="!cfFilteredRows.length">
              <td :colspan="uiState.activeTypeCd!=='NORMAL' ? 11 : 9" style="text-align:center;padding:32px;color:#aaa">
                {{ applied.prodNm ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다. [+ 상품추가] 버튼으로 추가하세요.' }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- ── CARD GRID 뷰 (2col / 3col / 4col) ───────────────────────── -->
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
            <!-- ── 카드 헤더 ──────────────────────────────────────────────── -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <div style="display:flex;align-items:center;gap:5px">
                <span style="cursor:grab;color:#bbb;font-size:15px;user-select:none">≡</span>
                <span style="font-size:10px;color:#aaa">#{{ idx+1 }}</span>
                <span v-if="row._isNew" class="badge badge-green" style="font-size:10px">NEW</span>
              </div>
              <button class="btn btn-danger btn-xs" @click="removeRow(row)">✕</button>
            </div>
            <!-- ── 상품명 ────────────────────────────────────────────────── -->
            <div style="font-weight:600;font-size:13px;margin-bottom:3px;line-height:1.4;word-break:keep-all">
              {{ getProdNm(row.prodId) }}
            </div>
            <!-- ── 카테고리경로 ─────────────────────────────────────────────── -->
            <div style="font-size:10px;color:#888;margin-bottom:6px;background:#f5f5f5;border-radius:4px;padding:2px 6px;display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              {{ getCatPath(row.categoryId) }}
            </div>
            <!-- ── 가격/재고/상태 ───────────────────────────────────────────── -->
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
            <!-- ── 강조옵션 chips ─────────────────────────────────────────── -->
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
            <!-- ── 전시기간 (NORMAL 제외) ───────────────────────────────────── -->
            <template v-if="uiState.activeTypeCd!=='NORMAL'">
              <div style="display:flex;align-items:center;gap:2px;margin-bottom:4px">
                <input type="date" class="form-control" v-model="row.dispStartDate"
                       style="flex:1;padding:2px 4px;font-size:10px;min-width:0" />
                <span style="color:#aaa;font-size:10px;flex-shrink:0">~</span>
                <input type="date" class="form-control" v-model="row.dispEndDate"
                       style="flex:1;padding:2px 4px;font-size:10px;min-width:0" />
              </div>
              <!-- ── 전시여부 ─────────────────────────────────────────────── -->
              <select class="form-control" v-model="row.dispYn"
                      style="width:100%;padding:2px 6px;font-size:11px"
                      :style="row.dispYn==='Y' ? 'color:#16a34a;font-weight:600' : 'color:#9ca3af'">
                <option value="Y">전시</option>
                <option value="N">비전시</option>
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

  <!-- ── 상품 추가 피커 모달 ──────────────────────────────────────────────────── -->
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
