/* ShopJoy - Sample02: 상품 관리 CRUD Grid (Infinity Scroll) */
window.XsSample02 = {
  name: 'XsSample02',
  setup() {
    const { ref, reactive, computed, onMounted, onUnmounted } = Vue;

    /* ── Toast ── */
    const toast = reactive({ show: false, msg: '', type: 'success' });
    let _tId = null;
    const showToast = (msg, type = 'success') => {
      toast.msg = msg; toast.type = type; toast.show = true;
      clearTimeout(_tId); _tId = setTimeout(() => { toast.show = false; }, 2500);
    };

    /* ── 검색 ── */
    const searchKw       = ref('');
    const searchCategory = ref('');
    const searchStatus   = ref('');
    const applied = reactive({ kw: '', category: '', status: '' });

    /* ── CRUD Grid ── */
    const allData    = reactive([]);
    const gridRows   = reactive([]);
    let   _tempId    = -1;
    const focusedIdx = ref(null);
    const EDIT_FIELDS = ['productNm', 'category', 'price', 'stock', 'status'];

    const makeRow = d => ({
      ...d,
      _row_status: 'N', _row_check: false,
      _orig: { productNm: d.productNm, category: d.category, price: d.price, stock: d.stock, status: d.status },
    });

    /* ── 무한스크롤 (IntersectionObserver) ── */
    const visibleCount  = ref(10);
    const sentinelEl    = ref(null);   // 템플릿 ref: "더 불러오기" 요소
    const visibleRows   = computed(() => gridRows.slice(0, visibleCount.value));
    const hasMore       = computed(() => visibleCount.value < gridRows.length);
    const loadMore      = () => { visibleCount.value = Math.min(visibleCount.value + 10, gridRows.length); };

    let _observer = null;
    const setupObserver = () => {
      if (_observer) _observer.disconnect();
      _observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore.value) loadMore();
      }, { threshold: 0.1 });
      if (sentinelEl.value) _observer.observe(sentinelEl.value);
    };

    const loadGrid = () => {
      gridRows.splice(0); focusedIdx.value = null; visibleCount.value = 10;
      allData.filter(d => {
        const kw = applied.kw.toLowerCase();
        if (kw && !String(d.productNm || '').toLowerCase().includes(kw)) return false;
        if (applied.category && d.category !== applied.category) return false;
        if (applied.status   && d.status   !== applied.status)   return false;
        return true;
      }).forEach(d => gridRows.push(makeRow(d)));
    };

    onMounted(async () => {
      try {
        const r = await window.frontApi.get('xs/sample02.json');
        (r.data || []).forEach(d => allData.push(d));
        loadGrid();
        Vue.nextTick(setupObserver);
      } catch { showToast('데이터 로딩 실패', 'error'); }
    });

    onUnmounted(() => {
      if (_observer) _observer.disconnect();
    });

    const onSearch = () => { Object.assign(applied, { kw: searchKw.value, category: searchCategory.value, status: searchStatus.value }); loadGrid(); Vue.nextTick(setupObserver); };
    const onReset  = () => { searchKw.value = ''; searchCategory.value = ''; searchStatus.value = ''; Object.assign(applied, { kw: '', category: '', status: '' }); loadGrid(); Vue.nextTick(setupObserver); };

    const setFocused   = idx => { focusedIdx.value = idx; };
    const onCellChange = row => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      row._row_status = EDIT_FIELDS.some(f => String(row[f]) !== String(row._orig[f])) ? 'U' : 'N';
    };

    const addRow = () => {
      const at = focusedIdx.value !== null ? focusedIdx.value + 1 : Math.min(visibleCount.value, gridRows.length);
      gridRows.splice(at, 0, { productId: _tempId--, productNm: '', category: '상의', price: 0, stock: 0, status: '판매중', regDate: '', _row_status: 'I', _row_check: false, _orig: null });
      focusedIdx.value = at;
      // 새 행이 보이도록 visibleCount 확장
      if (at >= visibleCount.value) visibleCount.value = at + 1;
    };

    const deleteRow = idx => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (focusedIdx.value !== null) focusedIdx.value = Math.max(0, focusedIdx.value - (focusedIdx.value >= idx ? 1 : 0));
        if (idx < visibleCount.value) visibleCount.value = Math.max(10, visibleCount.value - 1);
      } else { row._row_status = 'D'; }
    };

    const cancelRow = idx => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (focusedIdx.value !== null) focusedIdx.value = Math.max(0, focusedIdx.value - (focusedIdx.value >= idx ? 1 : 0));
        if (idx < visibleCount.value) visibleCount.value = Math.max(10, visibleCount.value - 1);
      } else { if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; }); row._row_status = 'N'; }
    };

    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) continue;
        if (gridRows[i]._row_status === 'I') gridRows.splice(i, 1);
        else gridRows[i]._row_status = 'D';
      }
    };

    const cancelChecked = () => {
      const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.productId));
      if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i]; if (!ids.has(row.productId) || row._row_status === 'N') continue;
        if (row._row_status === 'I') gridRows.splice(i, 1);
        else { if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; }); row._row_status = 'N'; }
      }
    };

    const doSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I'), uRows = gridRows.filter(r => r._row_status === 'U'), dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) { if (!r.productNm) { showToast('상품명은 필수 항목입니다.', 'error'); return; } }
      const parts = []; if (iRows.length) parts.push(`등록 ${iRows.length}건`); if (uRows.length) parts.push(`수정 ${uRows.length}건`); if (dRows.length) parts.push(`삭제 ${dRows.length}건`);
      if (!confirm(`${parts.join(', ')}을(를) 저장하시겠습니까?`)) return;
      dRows.forEach(r => { const i = allData.findIndex(d => d.productId === r.productId); if (i !== -1) allData.splice(i, 1); });
      uRows.forEach(r => { const i = allData.findIndex(d => d.productId === r.productId); if (i !== -1) EDIT_FIELDS.forEach(f => { allData[i][f] = r[f]; }); });
      let nid = Math.max(...allData.map(d => d.productId), 0);
      iRows.forEach(r => { allData.push({ productId: ++nid, productNm: r.productNm, category: r.category, price: r.price, stock: r.stock, status: r.status, regDate: new Date().toISOString().slice(0, 10) }); });
      showToast(`${parts.join(', ')} 저장되었습니다.`); loadGrid();
    };

    /* ── Drag ── */
    const dragSrc = ref(null), dragMoved = ref(false);
    const onDragStart = idx => { dragSrc.value = idx; dragMoved.value = false; };
    const onDragOver  = (e, idx) => {
      e.preventDefault();
      if (dragSrc.value === null || dragSrc.value === idx) return;
      const m = gridRows.splice(dragSrc.value, 1)[0]; gridRows.splice(idx, 0, m);
      dragSrc.value = idx; dragMoved.value = true;
    };
    const onDragEnd = () => { if (dragMoved.value) showToast('정렬이 변경되었습니다.'); dragSrc.value = null; dragMoved.value = false; };

    const checkAll = ref(false);
    const toggleCheckAll = () => { visibleRows.value.forEach(r => { r._row_check = checkAll.value; }); };

    const statusBadge = s => ({ N: 'background:#f0f0f0;color:#666;', I: 'background:#dbeafe;color:#1e40af;', U: 'background:#fef3c7;color:#92400e;', D: 'background:#fee2e2;color:#991b1b;' }[s] || '');
    const rowBg       = s => ({ I: 'background:#f0fdf4;', U: 'background:#fffbeb;', D: 'background:#fff1f2;opacity:.45;' }[s] || '');

    const total        = computed(() => gridRows.filter(r => r._row_status !== 'D').length);
    const CATEGORY_OPTS = ['상의', '하의', '아우터', '원피스', '신발', '가방'];

    return {
      toast, searchKw, searchCategory, searchStatus, CATEGORY_OPTS, onSearch, onReset,
      gridRows, visibleRows, total, visibleCount, hasMore, loadMore, sentinelEl,
      focusedIdx, setFocused, onCellChange,
      addRow, deleteRow, cancelRow, deleteRows, cancelChecked, doSave,
      dragSrc, onDragStart, onDragOver, onDragEnd,
      checkAll, toggleCheckAll, statusBadge, rowBg,
    };
  },
  template: /* html */`
<div style="padding:clamp(12px,3vw,24px);">

  <!-- Toast -->
  <div v-if="toast.show" style="position:fixed;top:20px;right:20px;z-index:9999;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.15);pointer-events:none;"
    :style="toast.type==='error'?'background:#fee2e2;color:#991b1b;':toast.type==='info'?'background:#dbeafe;color:#1e40af;':'background:#d1fae5;color:#065f46;'">
    {{ toast.msg }}
  </div>

  <!-- 제목 -->
  <div style="font-size:16px;font-weight:700;margin-bottom:12px;">
    02. 상품 관리
    <span style="font-size:12px;font-weight:400;color:#888;margin-left:8px;">Infinity Scroll CRUD Grid</span>
  </div>

  <!-- 검색 -->
  <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:12px 16px;margin-bottom:8px;">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <input v-model="searchKw" placeholder="상품명 검색" @keyup.enter="onSearch"
        style="font-size:12px;padding:5px 10px;border:1px solid #ddd;border-radius:6px;width:180px;outline:none;" />
      <select v-model="searchCategory" style="font-size:12px;padding:5px 8px;border:1px solid #ddd;border-radius:6px;">
        <option value="">카테고리 전체</option>
        <option v-for="c in CATEGORY_OPTS" :key="c">{{ c }}</option>
      </select>
      <select v-model="searchStatus" style="font-size:12px;padding:5px 8px;border:1px solid #ddd;border-radius:6px;">
        <option value="">상태 전체</option><option>판매중</option><option>품절</option><option>판매중지</option>
      </select>
      <button @click="onSearch" style="font-size:12px;padding:5px 14px;border:none;border-radius:6px;background:#e8587a;color:#fff;cursor:pointer;font-weight:600;">검색</button>
      <button @click="onReset"  style="font-size:12px;padding:5px 12px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;">초기화</button>
    </div>
  </div>

  <!-- CRUD Grid -->
  <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
    <!-- 툴바 -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid #f0f0f0;">
      <span style="font-size:12px;font-weight:700;">
        상품 목록
        <span style="color:#e8587a;margin-left:4px;">{{ total }}건</span>
        <span style="font-size:11px;color:#aaa;font-weight:400;margin-left:6px;">{{ visibleCount }}개 표시 중</span>
      </span>
      <div style="display:flex;gap:5px;">
        <button @click="addRow"        style="font-size:11px;padding:4px 10px;border:1px solid #34a853;border-radius:5px;background:#e6f4ea;color:#1e7e34;cursor:pointer;font-weight:600;">+ 행추가</button>
        <button @click="deleteRows"    style="font-size:11px;padding:4px 10px;border:1px solid #fca5a5;border-radius:5px;background:#fee2e2;color:#991b1b;cursor:pointer;">행삭제</button>
        <button @click="cancelChecked" style="font-size:11px;padding:4px 10px;border:1px solid #ddd;border-radius:5px;background:#fff;color:#555;cursor:pointer;">취소</button>
        <button @click="doSave"        style="font-size:11px;padding:4px 10px;border:none;border-radius:5px;background:#e8587a;color:#fff;cursor:pointer;font-weight:600;">저장</button>
      </div>
    </div>

    <!-- 테이블 -->
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:720px;">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:2px solid #e0e0e0;">
            <th style="width:28px;padding:7px 4px;text-align:center;color:#ccc;font-weight:400;">⠿</th>
            <th style="width:50px;padding:7px;text-align:center;font-weight:600;color:#555;font-size:11px;">ID</th>
            <th style="width:36px;padding:7px;text-align:center;font-weight:600;color:#555;font-size:11px;">상태</th>
            <th style="width:28px;padding:7px;text-align:center;"><input type="checkbox" v-model="checkAll" @change="toggleCheckAll" /></th>
            <th style="padding:7px;text-align:left;font-weight:600;color:#555;">상품명</th>
            <th style="width:90px;padding:7px;text-align:center;font-weight:600;color:#555;">카테고리</th>
            <th style="width:90px;padding:7px;text-align:right;font-weight:600;color:#555;">가격</th>
            <th style="width:70px;padding:7px;text-align:right;font-weight:600;color:#555;">재고</th>
            <th style="width:80px;padding:7px;text-align:center;font-weight:600;color:#555;">판매상태</th>
            <th style="width:96px;padding:7px;text-align:center;font-weight:600;color:#555;">등록일</th>
            <th style="width:48px;"></th>
            <th style="width:48px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="gridRows.length===0">
            <td colspan="12" style="text-align:center;padding:40px;color:#ccc;font-size:13px;">데이터가 없습니다.</td>
          </tr>
          <tr v-for="(row, idx) in visibleRows" :key="row.productId"
            draggable="true"
            @click="setFocused(idx)"
            @dragstart="onDragStart(idx)"
            @dragover="onDragOver($event, idx)"
            @dragend="onDragEnd"
            style="cursor:pointer;border-bottom:1px solid #f5f5f5;transition:background .1s;"
            :style="rowBg(row._row_status)+(focusedIdx===idx?'outline:2px solid #93c5fd inset;':'')">
            <td style="text-align:center;color:#ccc;cursor:grab;font-size:14px;">⠿</td>
            <td style="text-align:center;color:#999;font-size:11px;">{{ row.productId > 0 ? row.productId : 'NEW' }}</td>
            <td style="text-align:center;">
              <span style="font-size:9px;padding:2px 5px;border-radius:8px;font-weight:700;" :style="statusBadge(row._row_status)">{{ row._row_status }}</span>
            </td>
            <td style="text-align:center;"><input type="checkbox" v-model="row._row_check" @click.stop /></td>
            <td>
              <input v-model="row.productNm" :disabled="row._row_status==='D'" @input="onCellChange(row)"
                style="width:100%;border:1px solid transparent;background:transparent;padding:3px 5px;font-size:12px;border-radius:3px;outline:none;"
                @focus="e=>e.target.style.border='1px solid #93c5fd'" @blur="e=>e.target.style.border='1px solid transparent'" />
            </td>
            <td style="text-align:center;">
              <select v-model="row.category" :disabled="row._row_status==='D'" @change="onCellChange(row)"
                style="font-size:11px;padding:2px 4px;border:1px solid #ddd;border-radius:4px;background:#fff;">
                <option v-for="c in CATEGORY_OPTS" :key="c">{{ c }}</option>
              </select>
            </td>
            <td style="text-align:right;">
              <input v-model.number="row.price" type="number" :disabled="row._row_status==='D'" @input="onCellChange(row)"
                style="width:80px;border:1px solid transparent;background:transparent;padding:3px 5px;font-size:12px;text-align:right;border-radius:3px;outline:none;"
                @focus="e=>e.target.style.border='1px solid #93c5fd'" @blur="e=>e.target.style.border='1px solid transparent'" />
            </td>
            <td style="text-align:right;">
              <input v-model.number="row.stock" type="number" :disabled="row._row_status==='D'" @input="onCellChange(row)"
                style="width:55px;border:1px solid transparent;background:transparent;padding:3px 5px;font-size:12px;text-align:right;border-radius:3px;outline:none;"
                @focus="e=>e.target.style.border='1px solid #93c5fd'" @blur="e=>e.target.style.border='1px solid transparent'" />
            </td>
            <td style="text-align:center;">
              <select v-model="row.status" :disabled="row._row_status==='D'" @change="onCellChange(row)"
                style="font-size:11px;padding:2px 4px;border:1px solid #ddd;border-radius:4px;background:#fff;">
                <option>판매중</option><option>품절</option><option>판매중지</option>
              </select>
            </td>
            <td style="text-align:center;color:#999;font-size:11px;">{{ row.regDate }}</td>
            <td style="text-align:center;">
              <button v-if="['U','I','D'].includes(row._row_status)" @click.stop="cancelRow(idx)"
                style="font-size:10px;padding:2px 7px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;">취소</button>
            </td>
            <td style="text-align:center;">
              <button v-if="['N','U'].includes(row._row_status)" @click.stop="deleteRow(idx)"
                style="font-size:10px;padding:2px 7px;border:1px solid #fca5a5;border-radius:4px;background:#fee2e2;color:#991b1b;cursor:pointer;">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 로딩 표시 (IntersectionObserver sentinel) -->
    <div v-if="hasMore" ref="sentinelEl" style="padding:14px;text-align:center;font-size:12px;color:#aaa;border-top:1px solid #f5f5f5;">
      <span style="display:inline-flex;align-items:center;gap:6px;">
        <span style="display:inline-block;width:14px;height:14px;border:2px solid #e8587a;border-top-color:transparent;border-radius:50%;animation:spin .6s linear infinite;"></span>
        스크롤하여 더 불러오기 ({{ visibleCount }} / {{ gridRows.length }}건)
      </span>
    </div>
    <div v-else-if="gridRows.length>0" style="padding:10px;text-align:center;font-size:11px;color:#ccc;border-top:1px solid #f5f5f5;">
      ✓ 전체 {{ gridRows.length }}건 표시 완료
    </div>
  </div>

  <style>
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</div>
  `,
};
