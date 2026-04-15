/* ShopJoy Admin - 배치스케즐관리 (CRUD 그리드) */
window.SyBatchMng = {
  name: 'SyBatchMng',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    /* ── 표시경로 선택 모달 (sy_path) ── */
    const pathPickModal = Vue.reactive({ show: false, row: null });
    const openPathPick = (row) => { pathPickModal.row = row; pathPickModal.show = true; };
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };
    const onPathPicked = (pathId) => {
      const row = pathPickModal.row;
      if (row) {
        row.pathId = pathId;
        if (row._row_status === 'N') row._row_status = 'U';
      }
    };
    const pathLabel = (id) => window.adminUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));


    /* ── 좌측 표시경로 트리 ── */
    const selectedPath = Vue.ref(null);
    const expanded = Vue.reactive(new Set(['']));
    const toggleNode = (path) => { if (expanded.has(path)) expanded.delete(path); else expanded.add(path); };
    const selectNode = (path) => { selectedPath.value = path; };
    const tree = Vue.computed(() => window.adminUtil.buildPathTree('sy_batch'));
    const expandAll = () => { const walk = (n) => { expanded.add(n.path); n.children.forEach(walk); }; walk(tree.value); };
    const collapseAll = () => { expanded.clear(); expanded.add(''); };
    /* _expand3: 기본 3레벨 펼침 */
    Vue.onMounted(() => {
      const initSet = window.adminUtil.collectExpandedToDepth(tree.value, 2);
      expanded.clear(); initSet.forEach(v => expanded.add(v));
    });

    const { ref, reactive, computed } = Vue;

    /* ── 검색 ── */
    const searchKw = ref('');
    const searchStatus = ref('');
    const searchRunStatus = ref('');
    const searchDateRange = ref(''); const searchDateStart = ref(''); const searchDateEnd = ref('');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) { const r = window.adminUtil.getDateRange(searchDateRange.value); searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : ''; }
    };
    const applied = reactive({ kw: '', status: '', runStatus: '', dateStart: '', dateEnd: '' });

    /* ── CRUD 그리드 ── */
    const gridRows = reactive([]);
    let _tempId = -1;
    const focusedIdx = ref(null);
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const getRealIdx = (localIdx) => (pager.page - 1) * pager.size + localIdx;

    const EDIT_FIELDS = ['batchNm', 'batchCode', 'cron', 'statusCd', 'description'];

    const makeRow = (b) => ({
      ...b,
      _row_status: 'N', _row_check: false,
      _orig: { batchNm: b.batchNm, batchCode: b.batchCode, cron: b.cron, statusCd: b.statusCd, description: b.description },
    });

    const loadGrid = () => {
      gridRows.splice(0); focusedIdx.value = null; pager.page = 1;
      props.adminData.batches
        .filter(b => {
          const kw = applied.kw.trim().toLowerCase();
          if (kw && !b.batchNm.toLowerCase().includes(kw) && !b.batchCode.toLowerCase().includes(kw)) return false;
          if (applied.status && b.statusCd !== applied.status) return false;
          if (applied.runStatus && b.runStatus !== applied.runStatus) return false;
          const _d = String(b.regDate || '').slice(0, 10);
          if (applied.dateStart && _d < applied.dateStart) return false;
          if (applied.dateEnd && _d > applied.dateEnd) return false;
          return true;
        })
        .forEach(b => gridRows.push(makeRow(b)));
    };
    loadGrid();

    const total = computed(() => gridRows.filter(r => r._row_status !== 'D').length);

    const onSearch = () => {
      Object.assign(applied, { kw: searchKw.value, status: searchStatus.value, runStatus: searchRunStatus.value, dateStart: searchDateStart.value, dateEnd: searchDateEnd.value });
      loadGrid();
    };
    const onReset = () => {
      searchKw.value = ''; searchStatus.value = ''; searchRunStatus.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      Object.assign(applied, { kw: '', status: '', runStatus: '', dateStart: '', dateEnd: '' });
      loadGrid();
    };

    const setFocused = (idx) => { focusedIdx.value = idx; };

    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      row._row_status = EDIT_FIELDS.some(f => String(row[f]) !== String(row._orig[f])) ? 'U' : 'N';
    };

    const addRow = () => {
      const ref = focusedIdx.value !== null ? gridRows[focusedIdx.value] : null;
      const newRow = {
        batchId: _tempId--, batchNm: '', batchCode: '',
        cron: ref ? ref.cron : '0 0 * * *',
        statusCd: '활성', description: '',
        lastRun: '-', nextRun: '-', runCount: 0, runStatus: '대기',
        _row_status: 'I', _row_check: false, _orig: null,
      };
      const insertAt = focusedIdx.value !== null ? focusedIdx.value + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      focusedIdx.value = insertAt;
      pager.page = Math.ceil((insertAt + 1) / pager.size);
    };

    const deleteRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (focusedIdx.value !== null) focusedIdx.value = Math.max(0, focusedIdx.value - (focusedIdx.value >= idx ? 1 : 0));
      } else { row._row_status = 'D'; }
    };

    const cancelRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (focusedIdx.value !== null) focusedIdx.value = Math.max(0, focusedIdx.value - (focusedIdx.value >= idx ? 1 : 0));
      } else {
        if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; });
        row._row_status = 'N';
      }
    };

    const cancelChecked = () => {
      const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.batchId));
      if (!ids.size) { props.showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!ids.has(row.batchId) || row._row_status === 'N') continue;
        if (row._row_status === 'I') { gridRows.splice(i, 1); }
        else { if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; }); row._row_status = 'N'; }
      }
    };

    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) continue;
        if (gridRows[i]._row_status === 'I') { gridRows.splice(i, 1); }
        else { gridRows[i]._row_status = 'D'; }
      }
    };

    const doSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { props.showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) {
        if (!r.batchNm || !r.batchCode || !r.cron) { props.showToast('배치명, 배치코드, Cron 표현식은 필수 항목입니다.', 'error'); return; }
      }
      const details = [];
      if (iRows.length) details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' });
      if (uRows.length) details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' });
      if (dRows.length) details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' });
      const ok = await props.showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?', { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) return;

      dRows.forEach(r => { const i = props.adminData.batches.findIndex(b => b.batchId === r.batchId); if (i !== -1) props.adminData.batches.splice(i, 1); });
      uRows.forEach(r => { const i = props.adminData.batches.findIndex(b => b.batchId === r.batchId); if (i !== -1) Object.assign(props.adminData.batches[i], { batchNm: r.batchNm, batchCode: r.batchCode, cron: r.cron, statusCd: r.statusCd, description: r.description }); });
      let nextId = Math.max(...props.adminData.batches.map(b => b.batchId), 0);
      iRows.forEach(r => { props.adminData.batches.push({ batchId: ++nextId, batchNm: r.batchNm, batchCode: r.batchCode, cron: r.cron, statusCd: r.statusCd, description: r.description, lastRun: '-', nextRun: '-', runCount: 0, runStatus: '대기', regDate: new Date().toISOString().slice(0, 10) }); });

      const parts = [];
      if (iRows.length) parts.push(`등록 ${iRows.length}건`);
      if (uRows.length) parts.push(`수정 ${uRows.length}건`);
      if (dRows.length) parts.push(`삭제 ${dRows.length}건`);
      props.showToast(`${parts.join(', ')} 저장되었습니다.`);
      loadGrid();
    };

    /* ── 즉시 실행 ── */
    const runNow = async (row) => {
      const ok = await props.showConfirm('즉시 실행', `[${row.batchNm}] 배치를 즉시 실행하시겠습니까?`);
      if (!ok) return;
      const src = props.adminData.batches.find(x => x.batchId === row.batchId);
      row.runStatus = '실행중';
      if (src) src.runStatus = '실행중';
      props.showToast('배치 실행을 시작했습니다.');
      setTimeout(() => {
        const now = new Date().toLocaleString('ko-KR').slice(0, 16);
        row.runStatus = '성공'; row.lastRun = now; row.runCount = (row.runCount || 0) + 1;
        if (src) { src.runStatus = '성공'; src.lastRun = now; src.runCount = row.runCount; }
      }, 1500);
    };

    /* ── Cron 프리셋 / 편집 모달 ── */
    const CRON_PRESETS = [
      { label: '매일 자정',       value: '0 0 * * *'   },
      { label: '매일 01:00',     value: '0 1 * * *'   },
      { label: '매일 02:00',     value: '0 2 * * *'   },
      { label: '매시간',          value: '0 * * * *'   },
      { label: '2시간마다',       value: '0 */2 * * *' },
      { label: '매주 일요일 자정', value: '0 0 * * 0'   },
      { label: '매월 1일 08:00', value: '0 8 1 * *'   },
    ];
    const CRON_FIELDS = [
      { key: 'minute',  label: '분',   placeholder: '0', hint: '0-59, */n' },
      { key: 'hour',    label: '시',   placeholder: '0', hint: '0-23, */n' },
      { key: 'day',     label: '일',   placeholder: '*', hint: '1-31, *'   },
      { key: 'month',   label: '월',   placeholder: '*', hint: '1-12, *'   },
      { key: 'weekday', label: '요일', placeholder: '*', hint: '0-6 (일=0)' },
    ];

    const cronPicker = reactive({
      show: false, rowIdx: null,
      minute: '0', hour: '0', day: '*', month: '*', weekday: '*',
      preview: '0 0 * * *',
    });

    const updateCronPreview = () => {
      cronPicker.preview = `${cronPicker.minute} ${cronPicker.hour} ${cronPicker.day} ${cronPicker.month} ${cronPicker.weekday}`;
    };

    const cronPresetLabel = computed(() => {
      const m = CRON_PRESETS.find(p => p.value === cronPicker.preview);
      return m ? m.label : '';
    });

    /* ── Cron → 한국어 설명 ── */
    const cronToKorean = (expr) => {
      if (!expr) return '';
      const pts = expr.trim().split(/\s+/);
      if (pts.length !== 5) return '';
      const [min, hour, day, month, weekday] = pts;
      const WD = ['일', '월', '화', '수', '목', '금', '토'];
      const t = (h, m) => {
        if (h === '*') return '';
        const hh = String(h).padStart(2, '0');
        const mm = (m === '*' ? '00' : String(m).padStart(2, '0'));
        return ` ${hh}:${mm}`;
      };
      // 매분
      if (min === '*' && hour === '*' && day === '*' && month === '*' && weekday === '*') return '매분 실행';
      // N분마다
      const minN = min.match(/^\*\/(\d+)$/);
      if (minN && hour === '*' && day === '*' && month === '*' && weekday === '*') return `${minN[1]}분마다 실행`;
      // 매시간 (on specific minute)
      if (hour === '*' && day === '*' && month === '*' && weekday === '*') {
        return min === '0' ? '매시간 실행' : `매시간 ${min}분에 실행`;
      }
      // N시간마다
      const hourN = hour.match(/^\*\/(\d+)$/);
      if (hourN && day === '*' && month === '*' && weekday === '*') {
        return `${hourN[1]}시간마다 실행${min !== '0' && min !== '*' ? ` (${min}분)` : ''}`;
      }
      // 매년 Mo월 D일 H:M
      if (month !== '*' && day !== '*' && weekday === '*') {
        const mo = month.match(/^\*\/(\d+)$/) ? `${month.match(/^\*\/(\d+)$/)[1]}개월마다` : `${month}월`;
        return `매년 ${mo} ${day}일${t(hour, min)} 실행`;
      }
      // 매주 요일 H:M
      if (day === '*' && month === '*' && weekday !== '*') {
        const wds = weekday.split(',').map(w => {
          const n = parseInt(w);
          return isNaN(n) ? w : (WD[n % 7] + '요일');
        }).join(', ');
        return `매주 ${wds}${t(hour, min)} 실행`;
      }
      // 매월 D일 H:M
      if (month === '*' && weekday === '*' && day !== '*') {
        const ds = day.match(/^\*\/(\d+)$/) ? `${day.match(/^\*\/(\d+)$/)[1]}일마다` : `${day}일`;
        return `매월 ${ds}${t(hour, min)} 실행`;
      }
      // 매일 H:M
      if (day === '*' && month === '*' && weekday === '*') {
        return `매일${t(hour, min)} 실행`;
      }
      return '';
    };

    const cronDesc = computed(() => cronToKorean(cronPicker.preview));

    const openCronPicker = (realIdx) => {
      const row = gridRows[realIdx];
      if (!row || row._row_status === 'D') return;
      cronPicker.rowIdx = realIdx;
      const pts = (row.cron || '0 0 * * *').split(' ');
      cronPicker.minute  = pts[0] || '*';
      cronPicker.hour    = pts[1] || '*';
      cronPicker.day     = pts[2] || '*';
      cronPicker.month   = pts[3] || '*';
      cronPicker.weekday = pts[4] || '*';
      cronPicker.preview = row.cron || '0 0 * * *';
      cronPicker.show = true;
    };

    const applyCronPreset = (value) => {
      const pts = value.split(' ');
      cronPicker.minute = pts[0]; cronPicker.hour = pts[1];
      cronPicker.day = pts[2]; cronPicker.month = pts[3]; cronPicker.weekday = pts[4];
      cronPicker.preview = value;
    };

    const applyCron = () => {
      if (cronPicker.rowIdx !== null) {
        const row = gridRows[cronPicker.rowIdx];
        if (row) { row.cron = cronPicker.preview; onCellChange(row); }
      }
      cronPicker.show = false;
    };

    /* ── 드래그 ── */
    const dragSrc = ref(null); const dragMoved = ref(false);
    const onDragStart = (idx) => { dragSrc.value = idx; dragMoved.value = false; };
    const onDragOver = (e, idx) => {
      e.preventDefault();
      if (dragSrc.value === null || dragSrc.value === idx) return;
      const moved = gridRows.splice(dragSrc.value, 1)[0];
      gridRows.splice(idx, 0, moved);
      dragSrc.value = idx; dragMoved.value = true;
    };
    const onDragEnd = () => { if (dragMoved.value) props.showToast('정렬정보가 저장되었습니다.'); dragSrc.value = null; dragMoved.value = false; };

    /* ── 체크 ── */
    const checkAll = ref(false);
    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = checkAll.value; }); };

    const statusBadge  = s => ({ '활성': 'badge-green', '비활성': 'badge-gray' }[s] || 'badge-gray');
    const runBadge     = s => ({ '성공': 'badge-green', '실패': 'badge-red', '실행중': 'badge-blue', '대기': 'badge-gray' }[s] || 'badge-gray');
    const statusClass  = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');
    const siteNm     = computed(() => window.adminUtil.getSiteNm());

    const pagedRows  = computed(() => { const s = (pager.page - 1) * pager.size; return gridRows.slice(s, s + pager.size); });
    const totalPages = computed(() => Math.max(1, Math.ceil(gridRows.length / pager.size)));
    const pageNums   = computed(() => { const c = pager.page, l = totalPages.value; const s = Math.max(1, c - 2), e = Math.min(l, s + 4); return Array.from({ length: e - s + 1 }, (_, i) => s + i); });
    const setPage    = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const exportExcel = () => window.adminUtil.exportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [{label:'ID',key:'batchId'},{label:'배치명',key:'batchNm'},{label:'배치코드',key:'batchCode'},{label:'Cron',key:'cron'},{label:'최근실행',key:'lastRun'},{label:'실행횟수',key:'runCount'},{label:'활성',key:'statusCd'},{label:'실행상태',key:'runStatus'},{label:'설명',key:'description'}],
      '배치목록.csv'
    );
    /* 트리 path 변경 시 자동 reload (loadGrid 있으면 호출) */
    Vue.watch(selectedPath, () => { if (typeof loadGrid === 'function') loadGrid(); });


    return {
      pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      selectedPath, expanded, toggleNode, selectNode, expandAll, collapseAll, tree,
      siteNm, searchKw, searchStatus, searchRunStatus, searchDateRange, searchDateStart, searchDateEnd,
      DATE_RANGE_OPTIONS, onDateRangeChange, applied,
      gridRows, pagedRows, total, pager, PAGE_SIZES, totalPages, pageNums, setPage, onSizeChange, getRealIdx,
      focusedIdx, setFocused, onSearch, onReset, onCellChange,
      addRow, deleteRow, cancelRow, cancelChecked, deleteRows, doSave, runNow,
      CRON_PRESETS, CRON_FIELDS, cronPicker, openCronPicker, applyCronPreset, applyCron, updateCronPreview, cronPresetLabel, cronDesc,
      dragSrc, onDragStart, onDragOver, onDragEnd,
      checkAll, toggleCheckAll, statusBadge, runBadge, statusClass,
      exportExcel,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">배치스케즐관리</div>  <!-- 검색 -->
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="배치명 / 배치코드 검색" />
      <select v-model="searchStatus">
        <option value="">활성여부 전체</option><option>활성</option><option>비활성</option>
      </select>
      <select v-model="searchRunStatus">
        <option value="">실행상태 전체</option><option>성공</option><option>실패</option><option>실행중</option><option>대기</option>
      </select>
      <span class="search-label">등록일</span>
      <input type="date" v-model="searchDateStart" class="date-range-input" />
      <span class="date-range-sep">~</span>
      <input type="date" v-model="searchDateEnd" class="date-range-input" />
      <select v-model="searchDateRange" @change="onDateRangeChange">
        <option value="">옵션선택</option>
        <option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  




  <!-- 좌 트리 + 우 영역 -->
  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:8px;"><span class="list-title" style="font-size:13px;">📂 표시경로</span></div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="expandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
        <button class="btn btn-sm" @click="collapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <prop-tree-node :node="tree" :expanded="expanded" :selected="selectedPath" :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
    </div>
    <div>
<!-- CRUD 그리드 -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>배치목록 <span class="list-count">{{ total }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-green btn-sm" @click="addRow">+ 행추가</button>
        <button class="btn btn-danger btn-sm" @click="deleteRows">행삭제</button>
        <button class="btn btn-secondary btn-sm" @click="cancelChecked">취소</button>
        <button class="btn btn-primary btn-sm" @click="doSave">저장</button>
      </div>
    </div>

    <div style="overflow-x:auto;">
    <table class="admin-table crud-grid" style="min-width:1000px;">
      <thead>
        <tr>
          <th style="min-width:140px;">표시경로</th>
          <th class="col-drag"></th>
          <th class="col-id">ID</th>
          <th class="col-status">상태</th>
          <th class="col-check"><input type="checkbox" v-model="checkAll" @change="toggleCheckAll" /></th>
          <th style="min-width:120px;">배치명</th>
          <th style="min-width:160px;">배치코드</th>
          <th style="min-width:170px;">Cron 표현식</th>
          <th style="width:62px;">활성</th>
          <th style="min-width:130px;">설명</th>
          <th style="width:110px;">최근실행</th>
          <th style="width:72px;">실행상태</th>
          <th style="width:55px;">사이트</th>
          <th style="width:36px;"></th>
          <th class="col-act-cancel"></th>
          <th class="col-act-delete"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="gridRows.length===0">
          <td colspan="16" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
        </tr>
        <tr v-for="(row, idx) in pagedRows" :key="row.batchId"
          class="crud-row" :class="['status-'+row._row_status, focusedIdx===getRealIdx(idx) ? 'focused' : '']"
          draggable="true"
          @click="setFocused(getRealIdx(idx))"
          @dragstart="onDragStart(getRealIdx(idx))"
          @dragover="onDragOver($event, getRealIdx(idx))"
          @dragend="onDragEnd">
          <td>
              <div :style="{padding:'5px 6px 5px 10px',border:'1px solid #e5e7eb',borderRadius:'5px',fontSize:'12px',minHeight:'26px',background:'#f5f5f7',color: row.pathId != null ? '#374151' : '#9ca3af',fontWeight: row.pathId != null ? 600 : 400,display:'flex',alignItems:'center',gap:'6px'}">
                <span style="flex:1;">{{ pathLabel(row.pathId) || '경로 선택...' }}</span>
                <button type="button" @click="openPathPick(row)" title="표시경로 선택"
                  :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'22px',height:'22px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'11px',color:'#6b7280',flexShrink:0,padding:'0'}"
                  @mouseover="$event.currentTarget.style.background='#eef2ff'"
                  @mouseout="$event.currentTarget.style.background='#fff'">🔍</button>
              </div>
            </td>
          <td class="drag-handle" title="드래그로 순서 변경">⠿</td>
          <td class="col-id-val">{{ row.batchId > 0 ? row.batchId : 'NEW' }}</td>
          <td class="col-status-val"><span class="badge badge-xs" :class="statusClass(row._row_status)">{{ row._row_status }}</span></td>
          <td class="col-check-val"><input type="checkbox" v-model="row._row_check" /></td>
          <td><input class="grid-input" v-model="row.batchNm" :disabled="row._row_status==='D'" @input="onCellChange(row)" placeholder="배치명" /></td>
          <td><input class="grid-input grid-mono" v-model="row.batchCode" :disabled="row._row_status==='D'" @input="onCellChange(row)" placeholder="BATCH_CODE" style="text-transform:uppercase;" /></td>
          <td>
            <div style="display:flex;align-items:center;gap:3px;">
              <input class="grid-input grid-mono" v-model="row.cron" :disabled="row._row_status==='D'" @input="onCellChange(row)" placeholder="0 0 * * *" style="flex:1;color:#2563eb;min-width:0;" />
              <button v-if="row._row_status!=='D'" class="btn btn-secondary btn-xs" style="flex-shrink:0;padding:2px 5px;font-size:11px;" title="Cron 편집" @click.stop="openCronPicker(getRealIdx(idx))">🕐</button>
            </div>
          </td>
          <td>
            <select class="grid-select" v-model="row.statusCd" :disabled="row._row_status==='D'" @change="onCellChange(row)" style="width:58px;">
              <option>활성</option><option>비활성</option>
            </select>
          </td>
          <td><input class="grid-input" v-model="row.description" :disabled="row._row_status==='D'" @input="onCellChange(row)" placeholder="설명" /></td>
          <td style="font-size:11px;color:#555;text-align:center;white-space:nowrap;">{{ row.lastRun }}</td>
          <td style="text-align:center;"><span class="badge badge-xs" :class="runBadge(row.runStatus)">{{ row.runStatus }}</span></td>
          <td style="font-size:11px;color:#2563eb;text-align:center;">{{ siteNm }}</td>
          <td style="text-align:center;">
            <button v-if="row._row_status!=='I' && row._row_status!=='D'" class="btn btn-secondary btn-xs" title="즉시실행" @click.stop="runNow(row)">▶</button>
          </td>
          <td class="col-act-cancel-val">
            <button v-if="['U','I','D'].includes(row._row_status)" class="btn btn-secondary btn-xs" @click.stop="cancelRow(getRealIdx(idx))">취소</button>
          </td>
          <td class="col-act-delete-val">
            <button v-if="['N','U'].includes(row._row_status)" class="btn btn-danger btn-xs" @click.stop="deleteRow(getRealIdx(idx))">삭제</button>
          </td>
        </tr>
      </tbody>
    </table>
    </div>

    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="pager.page===1" @click="setPage(1)">«</button>
        <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
        <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.page===totalPages" @click="setPage(pager.page+1)">›</button>
        <button :disabled="pager.page===totalPages" @click="setPage(totalPages)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
          <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>

  <!-- ── 배치 실행이력 ── -->
  <div class="card" style="margin-top:4px;">
    <sy-batch-hist :admin-data="adminData" />
  </div>

  <!-- ── Cron 편집 모달 ── -->
  <div v-if="cronPicker && cronPicker.show"
    style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;"
    @click.self="cronPicker.show=false">
    <div style="background:#fff;border-radius:16px;width:500px;max-width:95vw;box-shadow:0 24px 60px rgba(0,0,0,.28),0 2px 8px rgba(0,0,0,.08);overflow:hidden;border:1px solid rgba(255,255,255,.6);">

      <!-- 헤더 -->
      <div style="padding:14px 20px;border-bottom:1px solid #ffc9d6;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#fff0f4 0%,#ffe4ec 60%,#ffd5e1 100%);">
        <div style="font-weight:800;font-size:15px;color:#9f2946;letter-spacing:-0.2px;"><span style="color:#e8587a;font-size:9px;margin-right:8px;vertical-align:middle;">●</span>🕐 Cron 표현식 설정</div>
        <button @click="cronPicker.show=false" style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.6);border:none;font-size:13px;line-height:1;cursor:pointer;color:#9f2946;display:inline-flex;align-items:center;justify-content:center;transition:all .15s;" onmouseover="this.style.background='#e8587a';this.style.color='#fff';this.style.transform='rotate(90deg)';" onmouseout="this.style.background='rgba(255,255,255,0.6)';this.style.color='#9f2946';this.style.transform='';">✕</button>
      </div>

      <!-- 본문 -->
      <div style="padding:20px;">

        <!-- 프리셋 7개 -->
        <div style="margin-bottom:18px;">
          <div style="font-size:12px;font-weight:700;color:#444;margin-bottom:8px;">⚡ 프리셋</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            <button v-for="p in CRON_PRESETS" :key="p.value"
              class="btn btn-sm"
              :style="cronPicker.preview===p.value
                ? 'border:1.5px solid #e8587a;color:#e8587a;background:#fff5f7;font-weight:600;'
                : 'border:1px solid #d9d9d9;color:#555;background:#fff;'"
              style="font-size:11px;padding:5px 10px;text-align:left;line-height:1.5;"
              @click="applyCronPreset(p.value)">
              <div>{{ p.label }}</div>
              <code style="font-size:10px;opacity:.65;letter-spacing:.5px;">{{ p.value }}</code>
            </button>
          </div>
        </div>

        <!-- 수동 설정 -->
        <div style="margin-bottom:18px;">
          <div style="font-size:12px;font-weight:700;color:#444;margin-bottom:8px;">🔧 수동 설정</div>
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;">
            <div v-for="f in CRON_FIELDS" :key="f.key" style="text-align:center;">
              <div style="font-size:10px;color:#888;margin-bottom:4px;font-weight:600;">{{ f.label }}</div>
              <input class="form-control"
                style="text-align:center;font-family:monospace;font-size:13px;padding:5px 4px;"
                :placeholder="f.placeholder" :title="f.hint"
                v-model="cronPicker[f.key]" @input="updateCronPreview" />
              <div style="font-size:9px;color:#bbb;margin-top:3px;">{{ f.hint }}</div>
            </div>
          </div>
        </div>

        <!-- 미리보기 -->
        <div style="background:#f0f8ff;border:1px solid #dbeafe;border-radius:6px;padding:10px 16px;display:flex;align-items:center;gap:12px;">
          <span style="font-size:11px;color:#888;flex-shrink:0;">결과</span>
          <code style="font-size:16px;color:#2563eb;font-weight:700;letter-spacing:2px;">{{ cronPicker.preview }}</code>
          <span v-if="cronDesc" style="font-size:11px;color:#e8587a;margin-left:auto;font-weight:600;">{{ cronDesc }}</span>
        </div>
      </div>

      <!-- 푸터 -->
      <div style="padding:12px 20px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:8px;background:#fafafa;">
        <button class="btn btn-secondary" @click="cronPicker.show=false">취소</button>
        <button class="btn btn-primary" @click="applyCron">적용</button>
      </div>
    </div>
  </div>
</div></div>

  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_batch"
    :value="pathPickModal.row ? pathPickModal.row.pathId : null"
    @select="onPathPicked" @close="closePathPick" />
</div>
`,
};
