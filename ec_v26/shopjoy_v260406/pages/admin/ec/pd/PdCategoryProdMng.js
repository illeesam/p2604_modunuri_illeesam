/* ShopJoy Admin - 카테고리상품관리 (pd_category_prod) */
window.PdCategoryProdMng = {
  name: 'PdCategoryProdMng',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;

    /* ── 뷰모드 영속화 ── */
    if (!window._ecCategoryProdState) window._ecCategoryProdState = { viewMode: 'tab' };
    const viewMode = ref(window._ecCategoryProdState.viewMode || 'tab');
    watch(viewMode, v => { window._ecCategoryProdState.viewMode = v; });

    /* ── 진열 유형 탭 ── */
    const TYPE_TABS = [
      { cd: 'NORMAL',    nm: '일반상품' },
      { cd: 'HIGHLIGHT', nm: '하이라이트상품' },
      { cd: 'RECOMMEND', nm: '추천상품' },
      { cd: 'MAIN',      nm: '대표상품' },
      { cd: 'BANNER',    nm: '배너상품' },
      { cd: 'HOT_DEAL',  nm: '핫딜상품' },
    ];
    const activeTypeCd = ref('NORMAL');

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
    const searchProdNm = ref('');
    const applied      = reactive({ prodNm: '' });
    const onSearch = () => { Object.assign(applied, { prodNm: searchProdNm.value }); };
    const onReset  = () => { searchProdNm.value = ''; Object.assign(applied, { prodNm: '' }); };

    /* ── 카테고리 트리 ── */
    const expandedSet = ref(new Set());

    /* depth 1 노드 기본 펼침 (2레벨 노출) */
    onMounted(() => {
      expandedSet.value = new Set(
        (props.adminData.categories || []).filter(c => c.depth === 1).map(c => c.categoryId)
      );
    });
    const isExpanded  = id => expandedSet.value.has(id);
    const toggleNode  = id => {
      const s = new Set(expandedSet.value);
      if (s.has(id)) s.delete(id); else s.add(id);
      expandedSet.value = s;
    };
    const expandAll   = () => { expandedSet.value = new Set((props.adminData.categories || []).map(c => c.categoryId)); };
    const collapseAll = () => { expandedSet.value = new Set(); };

    /* 카테고리 경로 (재귀) */
    const getCatPath = (categoryId) => {
      const cats = props.adminData.categories || [];
      const cat = cats.find(c => c.categoryId === categoryId);
      if (!cat) return '';
      if (!cat.parentId) return cat.categoryNm;
      const pp = getCatPath(cat.parentId);
      return pp ? `${pp} › ${cat.categoryNm}` : cat.categoryNm;
    };

    /* 모든 하위 ID (자신 포함) */
    const allDescendantIds = (categoryId) => {
      const result = [categoryId];
      (props.adminData.categories || [])
        .filter(c => c.parentId === categoryId)
        .forEach(c => result.push(...allDescendantIds(c.categoryId)));
      return result;
    };

    /* 트리 뱃지 수 */
    const totalProdCount = id => {
      const ids = allDescendantIds(id);
      return (props.adminData.categoryProds || []).filter(cp => ids.includes(cp.categoryId)).length;
    };

    /* 탭별 수 (선택 카테고리 + 하위 합산) */
    const typeCountMap = computed(() => {
      const map = {};
      if (!selectedCatId.value) return map;
      const ids = allDescendantIds(selectedCatId.value);
      (props.adminData.categoryProds || [])
        .filter(cp => ids.includes(cp.categoryId))
        .forEach(cp => {
          const t = cp.categoryProdTypeCd || 'NORMAL';
          map[t] = (map[t] || 0) + 1;
        });
      return map;
    });

    /* 트리 플랫 */
    const catTreeFlat = computed(() => {
      const _ = expandedSet.value;
      const cats = props.adminData.categories || [];
      const map = {};
      cats.forEach(c => { map[c.categoryId] = { ...c, _children: [] }; });
      cats.forEach(c => { if (c.parentId && map[c.parentId]) map[c.parentId]._children.push(map[c.categoryId]); });
      const roots = cats.filter(c => !c.parentId).map(c => map[c.categoryId]).sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
      const result = [];
      const traverse = (node, depth) => {
        result.push({ ...node, _depth: depth, _hasChildren: node._children.length > 0 });
        if (isExpanded(node.categoryId))
          [...node._children].sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(c => traverse(c, depth + 1));
      };
      roots.forEach(r => traverse(r, 0));
      return result;
    });

    /* 선택된 카테고리 */
    const selectedCatId = ref(null);
    const selectedCat   = computed(() => (props.adminData.categories || []).find(c => c.categoryId === selectedCatId.value));
    const isLeafCat     = computed(() => {
      if (!selectedCatId.value) return false;
      return !(props.adminData.categories || []).some(c => c.parentId === selectedCatId.value);
    });
    const selectNode = id => { selectedCatId.value = (selectedCatId.value === id) ? null : id; };

    /* ── 전체 편집 목록 (선택 카테고리 + 하위 모두) ── */
    const allRows = reactive([]);
    let _seq = 1;

    const getProd   = id => (props.adminData.products || []).find(p => p.productId === id);
    const getProdNm = id => { const p = getProd(id); return p ? (p.prodNm || p.productName || '') : ''; };

    const loadAllRows = () => {
      if (!selectedCatId.value) { allRows.length = 0; return; }
      const ids = allDescendantIds(selectedCatId.value);
      const links = (props.adminData.categoryProds || [])
        .filter(cp => ids.includes(cp.categoryId))
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
      allRows.splice(0, allRows.length, ...links.map((cp, i) => ({
        _id:                _seq++,
        categoryProdId:     cp.categoryProdId,
        categoryId:         cp.categoryId,
        prodId:             cp.prodId,
        categoryProdTypeCd: cp.categoryProdTypeCd || 'NORMAL',
        sortOrd:            cp.sortOrd || i + 1,
        emphasisCd:         cp.emphasisCd || '',
        dispYn:             cp.dispYn || 'Y',
        dispStartDate:      cp.dispStartDate || defaultDispStartDate(),
        dispEndDate:        cp.dispEndDate || defaultDispEndDate(),
        _isNew:             false,
      })));
    };

    watch(selectedCatId, loadAllRows);

    /* 현재 탭 행 */
    const tabRows = computed(() => allRows.filter(r => r.categoryProdTypeCd === activeTypeCd.value));

    /* 검색 필터 */
    const filteredRows = computed(() => {
      const kw = applied.prodNm.trim().toLowerCase();
      return tabRows.value.filter(r => !kw || getProdNm(r.prodId).toLowerCase().includes(kw));
    });

    /* ── 드래그 정렬 ── */
    const dragIdx     = ref(null);
    const dragoverIdx = ref(null);
    const onDragStart = idx => { dragIdx.value = idx; };
    const onDragOver  = idx => { dragoverIdx.value = idx; };
    const onDrop = () => {
      if (dragIdx.value === null || dragIdx.value === dragoverIdx.value) {
        dragIdx.value = dragoverIdx.value = null; return;
      }
      const tabArr = [...tabRows.value];
      const [moved] = tabArr.splice(dragIdx.value, 1);
      tabArr.splice(dragoverIdx.value, 0, moved);
      tabArr.forEach((r, i) => { r.sortOrd = i + 1; });
      const others = allRows.filter(r => r.categoryProdTypeCd !== activeTypeCd.value);
      allRows.splice(0, allRows.length, ...others, ...tabArr);
      dragIdx.value = dragoverIdx.value = null;
    };

    /* ── 삭제 ── */
    const removeRow = row => { const idx = allRows.findIndex(r => r._id === row._id); if (idx !== -1) allRows.splice(idx, 1); };

    /* ── 상품 추가 피커 ── */
    const pickerOpen   = ref(false);
    const pickerSearch = ref('');
    const pickerList   = computed(() => {
      const q    = pickerSearch.value.trim().toLowerCase();
      const used = new Set(tabRows.value.map(r => r.prodId));
      return (props.adminData.products || []).filter(p => {
        if (used.has(p.productId)) return false;
        if (!q) return true;
        return String(p.productId).includes(q) || (p.prodNm || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
      });
    });

    const addProd = prod => {
      const targetCatId = selectedCatId.value;
      const maxSort = tabRows.value.length ? Math.max(...tabRows.value.map(r => r.sortOrd)) : 0;
      allRows.push({
        _id: _seq++, categoryProdId: null,
        categoryId:         targetCatId,
        prodId:             prod.productId,
        categoryProdTypeCd: activeTypeCd.value,
        sortOrd:            maxSort + 1,
        emphasisCd:         '',
        dispYn:             'Y',
        dispStartDate:      defaultDispStartDate(),
        dispEndDate:        defaultDispEndDate(),
        _isNew:             true,
      });
      pickerOpen.value = false; pickerSearch.value = '';
    };

    /* ── 저장 (현재 탭, 선택 카테고리+하위 전체) ── */
    const onSave = async () => {
      if (!selectedCatId.value) { props.showToast('카테고리를 선택하세요.', 'error'); return; }
      const activeTab = TYPE_TABS.find(t => t.cd === activeTypeCd.value);
      const ids = allDescendantIds(selectedCatId.value);
      const ok = await props.showConfirm('저장', `[${selectedCat.value?.categoryNm}] ${activeTab?.nm} 목록을 저장하시겠습니까?`);
      if (!ok) return;
      if (!props.adminData.categoryProds) props.adminData.categoryProds = [];
      const others = props.adminData.categoryProds.filter(
        cp => !(ids.includes(cp.categoryId) && (cp.categoryProdTypeCd || 'NORMAL') === activeTypeCd.value)
      );
      let seq2 = 0;
      props.adminData.categoryProds = [
        ...others,
        ...tabRows.value.map(r => ({
          categoryProdId:     r.categoryProdId || `CP_${r.categoryId}_${activeTypeCd.value}_${seq2++}`,
          siteId:             '1',
          categoryId:         r.categoryId,
          prodId:             r.prodId,
          categoryProdTypeCd: r.categoryProdTypeCd,
          sortOrd:            r.sortOrd,
          emphasisCd:         r.emphasisCd,
          dispYn:             r.dispYn,
          dispStartDate:      r.dispStartDate,
          dispEndDate:        r.dispEndDate,
        })),
      ];
      loadAllRows();
      try {
        const res = await window.adminApi.put(`category/${selectedCatId.value}/prods/${activeTypeCd.value}`, { prods: tabRows.value });
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('저장되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const DEPTH_COLORS  = ['#e8587a', '#2563eb', '#52c41a', '#f59e0b'];
    const DEPTH_BULLETS = ['●', '◦', '·', '-'];
    const depthColor  = d => DEPTH_COLORS[d % 4];
    const depthBullet = d => DEPTH_BULLETS[Math.min(d, 3)];

    return {
      viewMode, TYPE_TABS, activeTypeCd, typeCountMap,
      EMPHASIS_OPTS, parseEmphasis, hasEmphasis, toggleEmphasis,
      defaultDispStartDate, defaultDispEndDate,
      searchProdNm, applied, onSearch, onReset,
      expandedSet, isExpanded, toggleNode, expandAll, collapseAll,
      catTreeFlat, selectedCatId, selectedCat, isLeafCat, selectNode,
      totalProdCount, getCatPath,
      allRows, filteredRows, removeRow,
      dragIdx, dragoverIdx, onDragStart, onDragOver, onDrop,
      pickerOpen, pickerSearch, pickerList, addProd,
      onSave, getProd, getProdNm,
      depthColor, depthBullet,
    };
  },

  template: `
<div>
  <div class="page-title">카테고리상품관리</div>

  <!-- 검색 -->
  <div class="card">
    <div class="search-bar">
      <label class="search-label">상품명</label>
      <input class="form-control" v-model="searchProdNm" @keyup.enter="onSearch"
             placeholder="상품명 검색" style="max-width:280px">
      <div class="search-actions">
        <button class="btn btn-primary btn-sm" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <!-- 좌 트리 + 우 상품목록 -->
  <div style="display:grid;grid-template-columns:220px 1fr;gap:16px;align-items:flex-start">

    <!-- 좌측 카테고리 트리 -->
    <div class="card" style="padding:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:13px;font-weight:600;color:#555">📁 카테고리</span>
        <div v-if="selectedCatId" style="font-size:11px;color:#1677ff;cursor:pointer" @click="selectedCatId=null">전체</div>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:8px">
        <button class="btn btn-secondary btn-xs" style="flex:1;font-size:11px" @click="expandAll">▼ 전체</button>
        <button class="btn btn-secondary btn-xs" style="flex:1;font-size:11px" @click="collapseAll">▶ 닫기</button>
      </div>
      <div style="max-height:65vh;overflow-y:auto">
        <div v-for="cat in catTreeFlat" :key="cat.categoryId"
             style="border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:4px;padding:5px 6px"
             :style="{ paddingLeft: (cat._depth * 14 + 6) + 'px',
                       background: selectedCatId===cat.categoryId ? '#fce4ec' : 'transparent',
                       color: selectedCatId===cat.categoryId ? '#e8587a' : '#333',
                       borderLeft: selectedCatId===cat.categoryId ? '3px solid #e8587a' : '3px solid transparent' }"
             @click="selectNode(cat.categoryId)">
          <span v-if="cat._hasChildren"
                style="width:14px;text-align:center;font-size:9px;color:#aaa;flex-shrink:0"
                @click.stop="toggleNode(cat.categoryId)">
            {{ isExpanded(cat.categoryId) ? '▼' : '▶' }}
          </span>
          <span v-else style="width:14px;flex-shrink:0"></span>
          <span :style="{ fontSize:'11px', fontWeight:700, color:depthColor(cat._depth) }">{{ depthBullet(cat._depth) }}</span>
          <span style="font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ cat.categoryNm }}</span>
          <span v-if="totalProdCount(cat.categoryId) > 0"
                style="font-size:10px;background:#1677ff;color:#fff;border-radius:8px;padding:0 5px;flex-shrink:0">
            {{ totalProdCount(cat.categoryId) }}
          </span>
        </div>
        <div v-if="!catTreeFlat.length" style="text-align:center;padding:20px;color:#aaa;font-size:12px">카테고리 없음</div>
      </div>
    </div>

    <!-- 우측 상품 목록 -->
    <div class="card">

      <!-- 선택 전 안내 -->
      <div v-if="!selectedCatId" style="text-align:center;padding:60px;color:#aaa">
        <div style="font-size:32px;margin-bottom:12px">📂</div>
        <div>좌측에서 카테고리를 선택하세요.</div>
      </div>

      <template v-else>
        <!-- 카테고리명 + 저장/추가 버튼 -->
        <div class="toolbar" style="margin-bottom:0">
          <span class="list-title">
            <span :style="{ color: depthColor((selectedCat?.depth||1)-1), fontWeight:700, marginRight:'4px' }">
              {{ depthBullet((selectedCat?.depth||1)-1) }}
            </span>
            {{ selectedCat?.categoryNm }}
            <span v-if="!isLeafCat" style="font-size:11px;color:#aaa;margin-left:6px">(하위 포함)</span>
          </span>
          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary btn-sm" @click="pickerOpen=true;pickerSearch=''">+ 상품추가</button>
            <button class="btn btn-primary btn-sm" @click="onSave">저장</button>
          </div>
        </div>

        <!-- 탭바 + 뷰모드 버튼 -->
        <div class="tab-bar-row" style="margin:12px 0 0">
          <div class="tab-nav" style="flex:1;flex-wrap:wrap">
            <button v-for="tab in TYPE_TABS" :key="tab.cd"
                    class="tab-btn" :class="{ active: activeTypeCd===tab.cd }"
                    @click="activeTypeCd=tab.cd">
              {{ tab.nm }}
              <span v-if="typeCountMap[tab.cd]" class="tab-count">{{ typeCountMap[tab.cd] }}</span>
            </button>
          </div>
          <div class="tab-view-modes">
            <button class="tab-view-mode-btn" :class="{ active: viewMode==='tab' }"  @click="viewMode='tab'"  title="탭으로 보기">📑</button>
            <button class="tab-view-mode-btn" :class="{ active: viewMode==='1col' }" @click="viewMode='1col'" title="1열로 보기">1▭</button>
            <button class="tab-view-mode-btn" :class="{ active: viewMode==='2col' }" @click="viewMode='2col'" title="2열로 보기">2▭</button>
            <button class="tab-view-mode-btn" :class="{ active: viewMode==='3col' }" @click="viewMode='3col'" title="3열로 보기">3▭</button>
            <button class="tab-view-mode-btn" :class="{ active: viewMode==='4col' }" @click="viewMode='4col'" title="4열로 보기">4▭</button>
          </div>
        </div>

        <div style="font-size:12px;color:#aaa;margin:8px 0 4px;padding:0 2px">
          ≡ 드래그로 순서 변경 · 저장 후 반영됩니다.
        </div>

        <!-- TABLE 뷰 (tab / 1col) -->
        <table v-if="viewMode==='tab'||viewMode==='1col'" class="admin-table">
          <thead><tr>
            <th style="width:28px"></th>
            <th style="width:36px;text-align:center">순서</th>
            <th style="width:40px;text-align:center">ID</th>
            <th>상품명 / 강조옵션</th>
            <th style="width:130px;text-align:center">카테고리경로</th>
            <th style="width:78px;text-align:right">판매가</th>
            <th style="width:44px;text-align:center">재고</th>
            <th style="width:52px;text-align:center">상태</th>
            <th v-if="activeTypeCd!=='NORMAL'" style="width:216px;text-align:center">전시기간</th>
            <th v-if="activeTypeCd!=='NORMAL'" style="width:60px;text-align:center">전시</th>
            <th style="width:40px;text-align:center">삭제</th>
          </tr></thead>
          <tbody>
            <tr v-for="(row, idx) in filteredRows" :key="row._id"
                draggable="true"
                @dragstart="onDragStart(idx)"
                @dragover.prevent="onDragOver(idx)"
                @drop="onDrop()"
                :style="dragoverIdx===idx ? 'background:#e6f4ff' : (row._isNew ? 'background:#f6ffed' : (activeTypeCd!=='NORMAL' && row.dispYn==='N' ? 'background:#fafafa;opacity:0.65' : ''))">
              <td style="text-align:center;cursor:grab;color:#bbb;font-size:17px;user-select:none">≡</td>
              <td style="text-align:center;font-size:12px;color:#aaa">{{ idx+1 }}</td>
              <td style="text-align:center;font-size:11px;color:#aaa">{{ row.prodId }}</td>
              <td>
                <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
                  <span v-if="row._isNew" class="badge badge-green" style="font-size:10px">NEW</span>
                  <span style="font-weight:500">{{ getProdNm(row.prodId) }}</span>
                </div>
                <div style="display:flex;gap:3px;flex-wrap:wrap;margin-top:4px">
                  <button v-for="opt in EMPHASIS_OPTS" :key="opt.cd"
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
              <td v-if="activeTypeCd!=='NORMAL'">
                <div style="display:flex;align-items:center;gap:2px;justify-content:center">
                  <input type="date" class="form-control" v-model="row.dispStartDate"
                         style="width:100px;padding:2px 4px;font-size:11px;text-align:center" />
                  <span style="color:#aaa;font-size:11px;flex-shrink:0">~</span>
                  <input type="date" class="form-control" v-model="row.dispEndDate"
                         style="width:100px;padding:2px 4px;font-size:11px;text-align:center" />
                </div>
              </td>
              <td v-if="activeTypeCd!=='NORMAL'" style="text-align:center">
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
            <tr v-if="!filteredRows.length">
              <td :colspan="activeTypeCd!=='NORMAL' ? 11 : 9" style="text-align:center;padding:32px;color:#aaa">
                {{ applied.prodNm ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다. [+ 상품추가] 버튼으로 추가하세요.' }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- CARD GRID 뷰 (2col / 3col / 4col) -->
        <div v-else
             :style="{
               display:'grid',
               gridTemplateColumns: viewMode==='2col' ? 'repeat(2,1fr)' : viewMode==='3col' ? 'repeat(3,1fr)' : 'repeat(4,1fr)',
               gap:'10px',
             }">
          <div v-for="(row, idx) in filteredRows" :key="row._id"
               draggable="true"
               @dragstart="onDragStart(idx)"
               @dragover.prevent="onDragOver(idx)"
               @drop="onDrop()"
               style="border:1px solid #eee;border-radius:10px;padding:10px;background:#fff"
               :style="dragoverIdx===idx ? 'border-color:#1677ff;box-shadow:0 0 0 2px #bfdbfe'
                       : row._isNew ? 'border-color:#52c41a'
                       : (activeTypeCd!=='NORMAL' && row.dispYn==='N') ? 'opacity:0.6' : ''">
            <!-- 카드 헤더 -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <div style="display:flex;align-items:center;gap:5px">
                <span style="cursor:grab;color:#bbb;font-size:15px;user-select:none">≡</span>
                <span style="font-size:10px;color:#aaa">#{{ idx+1 }}</span>
                <span v-if="row._isNew" class="badge badge-green" style="font-size:10px">NEW</span>
              </div>
              <button class="btn btn-danger btn-xs" @click="removeRow(row)">✕</button>
            </div>
            <!-- 상품명 -->
            <div style="font-weight:600;font-size:13px;margin-bottom:3px;line-height:1.4;word-break:keep-all">
              {{ getProdNm(row.prodId) }}
            </div>
            <!-- 카테고리경로 -->
            <div style="font-size:10px;color:#888;margin-bottom:6px;background:#f5f5f5;border-radius:4px;padding:2px 6px;display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              {{ getCatPath(row.categoryId) }}
            </div>
            <!-- 가격/재고/상태 -->
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
            <!-- 강조옵션 chips -->
            <div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:7px">
              <button v-for="opt in EMPHASIS_OPTS" :key="opt.cd"
                      @click="toggleEmphasis(row, opt.cd)"
                      style="padding:1px 5px;border-radius:4px;font-size:10px;cursor:pointer;border:1px solid;line-height:1.5"
                      :style="hasEmphasis(row.emphasisCd, opt.cd)
                        ? 'background:#fce4ec;border-color:#e8587a;color:#e8587a;font-weight:700'
                        : 'background:#f5f5f5;border-color:#ddd;color:#bbb'">
                {{ opt.icon }} {{ opt.nm }}
              </button>
            </div>
            <!-- 전시기간 (NORMAL 제외) -->
            <template v-if="activeTypeCd!=='NORMAL'">
              <div style="display:flex;align-items:center;gap:2px;margin-bottom:4px">
                <input type="date" class="form-control" v-model="row.dispStartDate"
                       style="flex:1;padding:2px 4px;font-size:10px;min-width:0" />
                <span style="color:#aaa;font-size:10px;flex-shrink:0">~</span>
                <input type="date" class="form-control" v-model="row.dispEndDate"
                       style="flex:1;padding:2px 4px;font-size:10px;min-width:0" />
              </div>
              <!-- 전시여부 -->
              <select class="form-control" v-model="row.dispYn"
                      style="width:100%;padding:2px 6px;font-size:11px"
                      :style="row.dispYn==='Y' ? 'color:#16a34a;font-weight:600' : 'color:#9ca3af'">
                <option value="Y">전시</option>
                <option value="N">비전시</option>
              </select>
            </template>
          </div>
          <div v-if="!filteredRows.length"
               style="grid-column:1/-1;text-align:center;padding:40px;color:#aaa;border:1px dashed #eee;border-radius:8px">
            등록된 상품이 없습니다. [+ 상품추가] 버튼으로 추가하세요.
          </div>
        </div>

      </template>
    </div>
  </div>

  <!-- 상품 추가 피커 모달 -->
  <teleport to="body">
    <div v-if="pickerOpen"
         style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:center;justify-content:center"
         @click.self="pickerOpen=false">
      <div style="background:#fff;border-radius:14px;padding:24px;width:620px;max-height:72vh;display:flex;flex-direction:column;box-shadow:0 8px 48px rgba(0,0,0,0.22)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div>
            <strong style="font-size:15px">상품 추가</strong>
            <span style="font-size:12px;color:#aaa;margin-left:8px">
              → {{ selectedCat?.categoryNm }} / {{ TYPE_TABS.find(t=>t.cd===activeTypeCd)?.nm }}
            </span>
          </div>
          <button class="btn btn-secondary btn-xs" @click="pickerOpen=false">닫기</button>
        </div>
        <input class="form-control" v-model="pickerSearch"
               placeholder="상품명 / ID / 카테고리 검색" style="margin-bottom:12px">
        <div style="overflow-y:auto;flex:1;border:1px solid #eee;border-radius:8px">
          <table class="admin-table" style="margin:0">
            <thead><tr>
              <th style="width:44px">ID</th>
              <th>상품명</th>
              <th style="width:80px;text-align:center">카테고리</th>
              <th style="width:90px;text-align:right">판매가</th>
              <th style="width:60px;text-align:center">재고</th>
              <th style="width:56px;text-align:center">추가</th>
            </tr></thead>
            <tbody>
              <tr v-for="p in pickerList" :key="p.productId">
                <td style="color:#aaa;font-size:12px">{{ p.productId }}</td>
                <td>{{ p.prodNm || p.productName }}</td>
                <td style="text-align:center;font-size:12px;color:#888">{{ p.category || '-' }}</td>
                <td style="text-align:right;font-size:12px">{{ (p.salePrice||p.price||0).toLocaleString() }}원</td>
                <td style="text-align:center;font-size:12px">{{ p.stock ?? '-' }}</td>
                <td style="text-align:center">
                  <button class="btn btn-blue btn-xs" @click="addProd(p)">추가</button>
                </td>
              </tr>
              <tr v-if="!pickerList.length">
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
