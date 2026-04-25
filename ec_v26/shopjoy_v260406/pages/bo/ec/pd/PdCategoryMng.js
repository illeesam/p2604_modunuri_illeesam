/* ShopJoy Admin - 카테고리관리 */
window.PdCategoryMng = {
  name: 'PdCategoryMng',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const categories = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedCatId: null, focusedIdx: null, descOpen: false});
    const codes = reactive({
      category_depths: [],
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
        codes.category_depths = codeStore.snGetGrpCodes('CATEGORY_DEPTH') || [];
        codes.product_statuses = codeStore.snGetGrpCodes('PRODUCT_STATUS') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });

    /* ── 검색 파라미터 ── */
    const searchParam = reactive({
      kw: '',
      depth: '',
      status: ''
    });
    const searchParamOrg = reactive({
      kw: '',
      depth: '',
      status: ''
    });

    /* ── 트리 expanded 상태 (ref+Set 재할당으로 반응성 보장) ── */
    const expandedSet = reactive(new Set());

    /* depth 1 노드 기본 펼침 (2레벨 노출) */
    const handleFetchData = async () => {
      try {
        const res = await window.boApi.get('/bo/ec/pd/category/page', { params: { pageNo: 1, pageSize: 10000 } });
        const list = res.data?.data?.list || [];
        categories.splice(0, categories.length, ...list);
        gridRows.splice(0);
        buildTreeRows(list).forEach(c => gridRows.push(makeRow(c)));
      } catch (_) {
      console.error('[catch-info]', _);}
      expandedSet.clear();
      categories.filter(c => c.depth === 1).forEach(c => expandedSet.add(c.categoryId));
    };
    onMounted(() => { handleFetchData();
    Object.assign(searchParamOrg, searchParam); });
    const isExpanded  = id => expandedSet.has(id);
    const toggleNode  = id => {
      if (expandedSet.has(id)) expandedSet.delete(id); else expandedSet.add(id);
    };
    const expandAll  = () => { expandedSet.clear(); categories.forEach(c => expandedSet.add(c.categoryId)); };
    const collapseAll = () => { expandedSet.clear(); };

    /* ── 선택된 카테고리 (좌측 트리 클릭) ── */
        const selectNode = id => {
      uiState.selectedCatId = (uiState.selectedCatId === id) ? null : id;
    };
    watch(() => uiState.selectedCatId, () => handleFetchData());

    /* ── 좌측 트리 빌드 (expanded 반영) ── */
    const cfCatTreeFlat = computed(() => {
      const _ = expandedSet; // reactive dependency
      const cats = categories;
      const map = {};
      window.safeArrayUtils.safeForEach(cats, c => { map[c.categoryId] = { ...c, _children: [] }; });
      window.safeArrayUtils.safeForEach(cats, c => { if (c.parentId && map[c.parentId]) map[c.parentId]._children.push(map[c.categoryId]); });
      const roots = window.safeArrayUtils.safeFilter(cats, c => !c.parentId).map(c => map[c.categoryId]).sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
      const result = [];
      const traverse = (node, depth) => {
        result.push({ ...node, _depth: depth, _hasChildren: node._children.length > 0 });
        if (isExpanded(node.categoryId))
          [...node._children].sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(c => traverse(c, depth + 1));
      };
      window.safeArrayUtils.safeForEach(roots, r => traverse(r, 0));
      return result;
    });


    /* ── 그리드 ── */
    const gridRows   = reactive([]);
    let   _tempId    = -1;
        const pager      = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const EDIT_FIELDS = ['categoryNm', 'parentId', 'sortOrd', 'description', 'status'];

    /* 그리드 트리 평탄화 */
    const buildTreeRows = (items) => {
      const map = {};
      window.safeArrayUtils.safeForEach(items, c => { map[c.categoryId] = { ...c, _children: [] }; });
      const roots = [];
      window.safeArrayUtils.safeForEach(items, c => {
        if (c.parentId && map[c.parentId]) map[c.parentId]._children.push(map[c.categoryId]);
        else roots.push(map[c.categoryId]);
      });
      const result = [];
      const traverse = (node, depth) => {
        result.push({ ...node, _depth: depth });
        node._children.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(c => traverse(c, depth + 1));
      };
      roots.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(r => traverse(r, 0));
      return result;
    };

    const makeRow = c => ({
      ...c, _depth: c._depth || 0, _row_status: 'N', _row_check: false,
      _orig: { categoryNm: c.categoryNm, parentId: c.parentId, sortOrd: c.sortOrd, description: c.description, status: c.status },
    });


    const cfTotal      = computed(() => window.safeArrayUtils.safeFilter((gridRows || []), r => r._row_status !== 'D').length);
    const cfPagedRows  = computed(() => (gridRows || []).slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const cfTotalPages = computed(() => Math.max(1, Math.ceil((gridRows || []).length / pager.size)));
    const cfPageNums   = computed(() => {
      const c = pager.page, l = cfTotalPages.value, s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      return Array.from({ length: e - s + 1 }, (_, i) => s + i);
    });
    const setPage       = n => { if (n >= 1 && n <= cfTotalPages.value) pager.page = n; };
    const onSizeChange  = () => { pager.page = 1; };
    const getRealIdx    = localIdx => (pager.page - 1) * pager.size + localIdx;

    const onSearch = async () => {
      pager.page = 1;
      await handleFetchData();
    };
  
    const onReset = () => {
      Object.assign(searchParam, searchParamOrg);
      handleFetchData();
    };
    return {
      codes, uiState,
      expandedSet, isExpanded, toggleNode, expandAll, collapseAll, cfCatTreeFlat,
      selectNode,
      searchParam, searchParamOrg,
      gridRows, cfPagedRows, cfTotal, pager, PAGE_SIZES, cfTotalPages, cfPageNums, setPage, onSizeChange, getRealIdx,
      onSearch, onReset,
    };
  },

  template: `
<div>
  <div class="page-title">카테고리관리</div>
  <div style="margin:-8px 0 16px;padding:10px 14px;background:#f0faf4;border-left:3px solid #3ba87a;border-radius:0 6px 6px 0;font-size:13px;color:#444;line-height:1.7">
    <span><strong style="color:#1a7a52">카테고리관리</strong>는 상품 분류를 위한 3단계 계층(대/중/소) 카테고리를 관리합니다.</span>
    <button @click="uiState.descOpen=!uiState.descOpen" style="margin-left:8px;font-size:12px;color:#3ba87a;background:none;border:none;cursor:pointer;padding:0">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" style="margin-top:6px">
      ✔ 대·중·소 3단계로 카테고리 트리를 구성합니다.<br>
      ✔ 정렬순서·표시여부를 설정하고 상품과 연결합니다.<br>
      ✔ 카테고리 삭제 시 하위 카테고리와 연결 상품을 함께 확인합니다.<br>
      <span style="color:#888;font-size:12px">예) 의류 &gt; 상의 &gt; 티셔츠, 전자기기 &gt; 스마트폰</span>
    </div>
  </div>

  <!-- 검색 -->
  <div class="card">
    <div class="search-bar">
      <label class="search-label">카테고리명</label>
      <input class="form-control" v-model="searchParam.kw" placeholder="카테고리명 검색" style="max-width:240px" @keyup.enter="() => onSearch?.()">
      <label class="search-label">단계</label>
      <select class="form-control" v-model="searchParam.depth" style="width:120px">
        <option value="">전체</option>
        <option value="1">1단계 (대)</option>
        <option value="2">2단계 (중)</option>
        <option value="3">3단계 (소)</option>
      </select>
      <label class="search-label">상태</label>
      <select class="form-control" v-model="searchParam.status" style="width:100px">
        <option value="">전체</option>
        <option>활성</option>
        <option>비활성</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary btn-sm" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <!-- 좌 트리 + 우 그리드 -->
  <div style="display:grid;grid-template-columns:220px 1fr;gap:16px;align-items:flex-start">

    <!-- 좌측: 카테고리 트리 -->
    <div class="card" style="padding:12px;position:sticky;top:0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:13px;font-weight:600;color:#555">📁 카테고리</span>
        <div v-if="uiState.selectedCatId" style="font-size:11px;color:#1677ff;cursor:pointer" @click="uiState.selectedCatId=null">전체보기</div>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:8px">
        <button class="btn btn-secondary btn-xs" style="flex:1;font-size:11px" @click="expandAll">▼ 전체</button>
        <button class="btn btn-secondary btn-xs" style="flex:1;font-size:11px" @click="collapseAll">▶ 닫기</button>
      </div>
      <div style="max-height:60vh;overflow-y:auto">
        <div v-for="cat in cfCatTreeFlat" :key="cat?.categoryId"
             :style="{ paddingLeft: (cat._depth * 14 + 6) + 'px', cursor:'pointer', padding:'5px 8px',
                       borderRadius:'4px', paddingLeft: (cat._depth * 14 + 6) + 'px',
                       background: uiState.selectedCatId===cat.categoryId ? '#fce4ec' : 'transparent',
                       color: uiState.selectedCatId===cat.categoryId ? '#e8587a' : '#333',
                       fontWeight: uiState.selectedCatId===cat.categoryId ? 600 : 400,
                       borderLeft: uiState.selectedCatId===cat.categoryId ? '3px solid #e8587a' : '3px solid transparent' }"
             @click="selectNode(cat.categoryId)">
          <span v-if="cat._hasChildren"
                style="display:inline-block;width:14px;text-align:center;font-size:9px;color:#aaa;cursor:pointer;margin-right:2px"
                @click.stop="toggleNode(cat.categoryId)">
            {{ isExpanded(cat.categoryId) ? '▼' : '▶' }}
          </span>
          <span v-else style="display:inline-block;width:16px"></span>
          <span :style="{ fontSize:'11px', fontWeight:600, color:fnDepthColor(cat._depth), marginRight:'5px' }">{{ fnDepthBullet(cat._depth) }}</span>
          <span style="font-size:12px">{{ cat.categoryNm }}</span>
          <span v-if="cat.status==='비활성'" style="font-size:10px;color:#bbb;margin-left:4px">(비활성)</span>
        </div>
        <div v-if="!cfCatTreeFlat.length" style="text-align:center;padding:20px;color:#aaa;font-size:12px">카테고리 없음</div>
      </div>
    </div>

    <!-- 우측: 카테고리 그리드 -->
    <div class="card">
      <div class="toolbar">
        <span class="list-title">
          카테고리 목록
          <span v-if="uiState.selectedCatId" style="font-size:12px;color:#1677ff;margin-left:6px">
            — {{ [].find(c=>c.categoryId===uiState.selectedCatId)&&[].find(c=>c.categoryId===uiState.selectedCatId).categoryNm }} 하위
          </span>
          <span class="list-count">{{ cfTotal }}건</span>
        </span>
        <div style="display:flex;gap:6px">
          <button class="btn btn-green btn-sm" @click="addRow">+ 행추가</button>
          <button class="btn btn-danger btn-sm" @click="deleteRows">행삭제</button>
          <button class="btn btn-secondary btn-sm" @click="cancelChecked">취소</button>
          <button class="btn btn-primary btn-sm" @click="handleSave">저장</button>
        </div>
      </div>

      <table class="bo-table" style="table-layout:fixed">
        <colgroup>
          <col style="width:28px"><!-- 드래그 핸들 -->
          <col style="width:36px"><!-- 상태 -->
          <col style="width:32px"><!-- 체크 -->
          <col style="min-width:140px"><!-- 카테고리명 -->
          <col style="min-width:120px"><!-- 상위 -->
          <col style="width:64px"><!-- 순서 -->
          <col><!-- 설명 -->
          <col style="width:70px"><!-- 상태 -->
          <col style="width:32px"><!-- 하위추가 -->
          <col style="width:44px"><!-- 취소 -->
          <col style="width:44px"><!-- 삭제 -->
        </colgroup>
        <thead><tr>
          <th></th>
          <th>상태</th>
          <th><input type="checkbox" v-model="checkAll" @change="toggleCheckAll"></th>
          <th>카테고리명</th>
          <th>상위카테고리</th>
          <th style="text-align:center">순서</th>
          <th>설명</th>
          <th style="text-align:center">활성</th>
          <th></th>
          <th></th>
          <th></th>
        </tr></thead>
        <tbody>
          <tr v-if="!gridRows.length">
            <td colspan="11" style="text-align:center;color:#aaa;padding:30px">
              {{ uiState.selectedCatId ? '하위 카테고리가 없습니다. [+ 행추가]로 추가하세요.' : '데이터가 없습니다.' }}
            </td>
          </tr>
          <tr v-for="(row, idx) in cfPagedRows" :key="row?.categoryId"
              :class="[uiState.focusedIdx===getRealIdx(idx) ? 'focused' : '', 'status-'+row._row_status]"
              draggable="true"
              @dragstart="onRowDragStart(getRealIdx(idx))"
              @dragover.prevent="onRowDragOver(getRealIdx(idx))"
              @drop="onRowDrop()"
              :style="dragoverRowIdx===getRealIdx(idx) ? 'background:#e6f4ff' : ''"
              @click="setFocused(getRealIdx(idx))">

            <!-- 드래그 핸들 -->
            <td style="text-align:center;cursor:grab;color:#ccc;font-size:16px;user-select:none">≡</td>

            <!-- 행 상태 뱃지 -->
            <td style="text-align:center">
              <span class="badge badge-xs" :class="fnStatusClass(row._row_status)">{{ row._row_status }}</span>
            </td>

            <!-- 체크박스 -->
            <td style="text-align:center"><input type="checkbox" v-model="row._row_check" @click.stop></td>

            <!-- 카테고리명 (들여쓰기 트리 표현) -->
            <td style="padding:3px 6px">
              <div style="display:flex;align-items:center">
                <span :style="{ marginLeft:(row._depth*12)+'px', marginRight:'5px', fontWeight:700,
                                fontSize: row._depth===0?'8px':'11px', flexShrink:0, color:fnDepthColor(row._depth) }">
                  {{ fnDepthBullet(row._depth) }}
                </span>
                <input class="grid-input" v-model="row.categoryNm" :disabled="row._row_status==='D'"
                       @input="onCellChange(row)" style="flex:1" placeholder="카테고리명">
              </div>
            </td>

            <!-- 상위카테고리 -->
            <td style="padding:3px 8px">
              <div style="display:flex;align-items:center;gap:4px">
                <span style="flex:1;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                      :style="row.parentId ? 'color:#444' : 'color:#bbb;font-style:italic'">
                  {{ row.parentId ? parentNm(row.parentId) : '최상위' }}
                </span>
                <button v-if="row._row_status!=='D'" class="btn btn-secondary btn-xs"
                        style="flex-shrink:0;padding:1px 6px;font-size:11px;color:#e8587a"
                        @click.stop="openParentModal(row)" title="상위 선택">🔍</button>
              </div>
            </td>

            <!-- 순서 -->
            <td style="padding:3px 4px">
              <input class="grid-input grid-num" type="number" v-model.number="row.sortOrd"
                     :disabled="row._row_status==='D'" @input="onCellChange(row)" style="text-align:center">
            </td>

            <!-- 설명 -->
            <td style="padding:3px 6px">
              <input class="grid-input" v-model="row.description"
                     :disabled="row._row_status==='D'" @input="onCellChange(row)" placeholder="설명">
            </td>

            <!-- 활성 -->
            <td style="padding:3px 4px;text-align:center">
              <select class="grid-select" v-model="row.status"
                      :disabled="row._row_status==='D'" @change="onCellChange(row)" style="width:58px">
                <option>활성</option>
                <option>비활성</option>
              </select>
            </td>

            <!-- 하위 추가 -->
            <td style="text-align:center;padding:2px">
              <button v-if="row._row_status!=='D' && row.categoryId>0"
                      class="btn btn-xs" style="padding:1px 5px;font-size:11px;background:#f0f7ff;color:#1677ff;border:1px solid #91caff"
                      title="하위 카테고리 추가" @click.stop="addChildRow(row, getRealIdx(idx))">+하위</button>
            </td>

            <!-- 취소 -->
            <td style="text-align:center;padding:2px">
              <button v-if="['U','I','D'].includes(row._row_status)"
                      class="btn btn-secondary btn-xs" @click.stop="cancelRow(getRealIdx(idx))">취소</button>
            </td>

            <!-- 삭제 -->
            <td style="text-align:center;padding:2px">
              <button v-if="['N','U'].includes(row._row_status)"
                      class="btn btn-danger btn-xs" @click.stop="deleteRow(getRealIdx(idx))">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 페이지네이션 -->
      <div class="pagination">
        <div></div>
        <div class="pager">
          <button :disabled="pager.page===1" @click="setPage(1)">«</button>
          <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
          <button v-for="n in cfPageNums" :key="Math.random()" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
          <button :disabled="pager.page===cfTotalPages" @click="setPage(pager.page+1)">›</button>
          <button :disabled="pager.page===cfTotalPages" @click="setPage(cfTotalPages)">»</button>
        </div>
        <div class="pager-right">
          <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
            <option v-for="s in PAGE_SIZES" :key="Math.random()" :value="s">{{ s }}개</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- 상위카테고리 선택 모달 -->
  <teleport to="body" v-if="catPickerModal.show">
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:center;justify-content:center"
         @click.self="catPickerModal.show=false">
      <div style="background:#fff;border-radius:14px;padding:22px;width:460px;max-height:70vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,0.22)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <strong style="font-size:15px">상위 카테고리 선택</strong>
          <button class="btn btn-secondary btn-xs" @click="catPickerModal.show=false">닫기</button>
        </div>
        <input class="form-control" v-model="catPickerModal.search" placeholder="카테고리명 검색" style="margin-bottom:10px">
        <div style="overflow-y:auto;flex:1;border:1px solid #eee;border-radius:8px">
          <div style="padding:8px 12px;font-size:12px;border-bottom:1px solid #f0f0f0;cursor:pointer;color:#1677ff"
               @click="onParentSelect(null)">최상위 (상위없음)</div>
          <div v-for="c in cfCatPickerList" :key="c?.categoryId"
               style="padding:7px 12px;font-size:13px;border-bottom:1px solid #f9f9f9;cursor:pointer;display:flex;align-items:center;gap:6px"
               :style="{ paddingLeft: (c.depth * 14 + 12) + 'px' }"
               @mouseenter="$event.target.style.background='#f5f5f5'" @mouseleave="$event.target.style.background=''"
               @click="onParentSelect(c)">
            <span :style="{ fontSize:'11px', fontWeight:700, color:fnDepthColor((c.depth||1)-1) }">{{ fnDepthBullet((c.depth||1)-1) }}</span>
            <span>{{ c.categoryNm }}</span>
            <span style="font-size:11px;color:#aaa;margin-left:auto">depth {{ c.depth }}</span>
          </div>
          <div v-if="!cfCatPickerList.length" style="text-align:center;padding:20px;color:#aaa">검색 결과 없음</div>
        </div>
      </div>
    </div>
  </teleport>
</div>`
};
