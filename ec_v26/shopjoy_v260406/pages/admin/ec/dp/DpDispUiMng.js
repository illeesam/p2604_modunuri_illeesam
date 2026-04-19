/* ShopJoy Admin - 전시UI관리 (목록 + 하단 상세 임베드)
 * 구조: UI > 영역 > 패널 > 위젯
 */
window.DpDispUiMng = {
  name: 'DpDispUiMng',
  props: ['navigate', 'dispDataset', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const pathLabel = (id) => window.adminUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));

    const { ref, reactive, computed } = Vue;

    const UI_TYPE_OPTS = [
      { value: 'FRONT',  label: '프론트' },
      { value: 'ADMIN',  label: '관리자' },
      { value: 'MOBILE', label: '모바일' },
      { value: 'KIOSK',  label: '키오스크' },
    ];

    const searchKw        = ref('');
    const searchUiType    = ref('');
    const searchUseYn     = ref('');
    const searchDateStart = ref('');
    const searchDateEnd   = ref('');
    const searchDateRange = ref('');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) {
        const r = window.adminUtil.getDateRange(searchDateRange.value);
        searchDateStart.value = r ? r.from : '';
        searchDateEnd.value   = r ? r.to   : '';
      }
    };
    const siteNm = computed(() => window.adminUtil.getSiteNm());

    const applied = reactive({ kw: '', uiType: '', useYn: '', dateStart: '', dateEnd: '' });
    const onSearch = () => {
      Object.assign(applied, {
        kw: searchKw.value, uiType: searchUiType.value, useYn: searchUseYn.value,
        dateStart: searchDateStart.value, dateEnd: searchDateEnd.value,
      });
      pager.page = 1;
    };
    const onReset = () => {
      searchKw.value = ''; searchUiType.value = ''; searchUseYn.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      Object.assign(applied, { kw: '', uiType: '', useYn: '', dateStart: '', dateEnd: '' });
      pager.page = 1;
    };

    /* UI 목록 (codes DISP_UI) */
    const allUis = computed(() =>
      (props.dispDataset.codes || []).filter(c => c.codeGrp === 'DISP_UI')
    );
    /* 표시경로 (uiType 그룹 > 실제 UI 아이템) */
    const selectedTreeKey = ref('');
    const treeOpen = ref(new Set(['__root__']));
    const toggleTree = (k) => { if (treeOpen.value.has(k)) treeOpen.value.delete(k); else treeOpen.value.add(k); };
    const isTreeOpen = (k) => treeOpen.value.has(k);
    const selectTree = (k) => { selectedTreeKey.value = selectedTreeKey.value === k ? '' : k; pager.page = 1; };
    const uiTree = computed(() => {
      const group = {};
      allUis.value.forEach(u => {
        const t = u.uiType || '(미분류)';
        if (!group[t]) group[t] = [];
        group[t].push(u);
      });
      return Object.keys(group).sort().map(t => ({
        label: t,
        count: group[t].length,
        items: group[t].sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
      }));
    });
    const expandAll   = () => { uiTree.value.forEach(n => { treeOpen.value.add('grp_'+n.label); n.items.forEach(u => treeOpen.value.add('ui_'+u.codeId)); }); treeOpen.value.add('__root__'); };
    const collapseAll = () => { treeOpen.value.clear(); treeOpen.value.add('__root__'); };

    const filtered = computed(() => {
      const kw = applied.kw.trim().toLowerCase();
      return allUis.value.filter(u => {
        if (kw &&
            !(u.codeValue || '').toLowerCase().includes(kw) &&
            !(u.codeLabel || '').toLowerCase().includes(kw) &&
            !(u.remark || '').toLowerCase().includes(kw)) return false;
        if (applied.uiType && u.uiType !== applied.uiType) return false;
        if (applied.useYn && u.useYn !== applied.useYn) return false;
        const _d = String(u.regDate || '').slice(0, 10);
        if (applied.dateStart && _d < applied.dateStart) return false;
        if (applied.dateEnd   && _d > applied.dateEnd)   return false;
        if (selectedTreeKey.value && (u.uiType || '(미분류)') !== selectedTreeKey.value) return false;
        return true;
      }).sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
    });

    const pager      = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const total      = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList   = computed(() =>
      filtered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size)
    );
    const pageNums   = computed(() => {
      const cur = pager.page, last = totalPages.value;
      const start = Math.max(1, cur - 2), end = Math.min(last, start + 4);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const selectedId = ref(null);
    const loadDetail = (id) => { if (selectedId.value === id) { selectedId.value = null; return; } selectedId.value = id; };
    const openNew = () => { selectedId.value = '__new__'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispUiMng') { selectedId.value = null; return; }
      props.navigate(pg, opts);
    };
    const detailEditId = computed(() =>
      selectedId.value === '__new__' ? null : selectedId.value
    );

    const doDelete = async (u) => {
      const ok = await props.showConfirm('삭제', `[${u.codeLabel}] UI를 삭제하시겠습니까?`);
      if (!ok) return;
      const codes = props.dispDataset.codes;
      const idx = codes.findIndex(x => x.codeId === u.codeId);
      if (idx !== -1) codes.splice(idx, 1);
      if (selectedId.value === u.codeId) selectedId.value = null;
      try {
        const res = await window.adminApi.delete(`disp-uis/${u.codeId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => window.adminUtil.exportCsv(
      filtered.value,
      [
        { label: 'ID', key: 'codeId' }, { label: 'UI코드', key: 'codeValue' },
        { label: 'UI명', key: 'codeLabel' }, { label: '유형', key: 'uiType' },
        { label: '순서', key: 'sortOrd' }, { label: '사용', key: 'useYn' },
        { label: '설명', key: 'remark' },
      ],
      '전시UI목록.csv'
    );

    const uiTypeLabel = (v) => (UI_TYPE_OPTS.find(o => o.value === v) || {}).label || '-';
    const statusBadge = s => s === 'Y' ? 'badge-green' : 'badge-gray';

    /* UI 하위 영역 개수 (영역의 uiCode 필드 기준) */
    const areaCountFor = (uiCode) =>
      (props.dispDataset.codes || []).filter(c => c.codeGrp === 'DISP_AREA' && c.uiCode === uiCode).length;

    /* UI 하위 영역 목록 */
    const areasOfUi = (uiCode) =>
      (props.dispDataset.codes || [])
        .filter(c => c.codeGrp === 'DISP_AREA' && c.uiCode === uiCode)
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));

    /* 펼치기 기능 */
    const expandedUIs = ref(new Set());
    const toggleExpandUI = (uiId) => {
      if (expandedUIs.value.has(uiId)) expandedUIs.value.delete(uiId);
      else expandedUIs.value.add(uiId);
    };
    const isUIExpanded = (uiId) => expandedUIs.value.has(uiId);

    return {
      pathLabel,
      searchKw, searchUiType, searchUseYn, searchDateStart, searchDateEnd, searchDateRange,
      DATE_RANGE_OPTIONS, onDateRangeChange, siteNm,
      UI_TYPE_OPTS,
      pager, PAGE_SIZES, total, totalPages, pageList, pageNums, setPage, onSizeChange,
      onSearch, onReset, doDelete, exportExcel,
      selectedId, loadDetail, openNew, closeDetail, inlineNavigate, detailEditId,
      uiTypeLabel, statusBadge, areaCountFor, areasOfUi,
      expandedUIs, toggleExpandUI, isUIExpanded,
      uiTree, selectedTreeKey, toggleTree, isTreeOpen, selectTree, expandAll, collapseAll,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">전시UI관리 <span style="font-size:13px;font-weight:400;color:#888;">화면 UI 등록 · 수정 · 삭제</span></div>

  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="UI코드 / UI명 / 설명 검색" style="min-width:260px;" />
      <select v-model="searchUiType">
        <option value="">UI유형 전체</option>
        <option v-for="o in UI_TYPE_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <select v-model="searchUseYn">
        <option value="">사용여부 전체</option>
        <option value="Y">사용</option>
        <option value="N">미사용</option>
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

  <!-- 본문 -->
  <div style="display:flex;gap:12px;align-items:flex-start;">
    <!-- 좌측 트리 -->
    <div class="card" style="width:220px;flex-shrink:0;padding:12px;max-height:calc(100vh - 260px);overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:8px;border-bottom:1px solid #f0f0f0;margin-bottom:8px;">
        <span style="font-size:12px;font-weight:700;color:#555;">표시경로</span>
        <span style="font-size:10px;color:#aaa;">{{ uiTree.length }}그룹</span>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button @click="expandAll" style="flex:1;padding:4px 6px;font-size:10px;border:1px solid #d0d7de;border-radius:4px;background:#fff;cursor:pointer;color:#555;">▼ 전체펼치기</button>
        <button @click="collapseAll" style="flex:1;padding:4px 6px;font-size:10px;border:1px solid #d0d7de;border-radius:4px;background:#fff;cursor:pointer;color:#555;">▶ 전체닫기</button>
      </div>
      <div @click="selectTree('')"
        :style="{
          display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'7px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'4px',
          background: selectedTreeKey==='' ? '#e3f2fd' : '#f8f9fb',
          color: selectedTreeKey==='' ? '#1565c0' : '#222',
          fontWeight:700, border:'1px solid '+(selectedTreeKey==='' ? '#90caf9' : '#e4e7ec'),
        }">
        <span @click.stop="toggleTree('__root__')" style="cursor:pointer;">{{ isTreeOpen('__root__') ? '▼' : '▶' }} 📂 전체</span>
        <span style="font-size:10px;background:#fff;color:#555;border:1px solid #ddd;border-radius:10px;padding:1px 7px;">{{ total }}</span>
      </div>
      <div v-if="isTreeOpen('__root__')" style="padding-left:12px;">
        <template v-for="node in uiTree" :key="node.label">
          <div @click="selectTree(node.label)"
            :style="{
              display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'6px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'2px',
              background: selectedTreeKey===node.label ? '#e3f2fd' : 'transparent',
              color: selectedTreeKey===node.label ? '#1565c0' : '#333',
              fontWeight: selectedTreeKey===node.label ? 700 : 500,
            }">
            <span @click.stop="toggleTree('grp_'+node.label)" style="cursor:pointer;font-size:9px;transition:transform .2s;display:inline-block;width:12px;flex-shrink:0;"
              :style="isTreeOpen('grp_'+node.label) ? 'transform:rotate(90deg);' : ''">▶</span>
            <span @click.stop="selectTree(node.label)" style="cursor:pointer;flex:1;min-width:0;">{{ node.label }}</span>
            <span @click.stop="selectTree(node.label)" style="cursor:pointer;font-size:10px;background:#f0f2f5;color:#666;border-radius:10px;padding:1px 7px;">{{ node.count }}</span>
          </div>
          <!-- 그룹별 UI 아이템들 -->
          <div v-if="isTreeOpen('grp_'+node.label)" style="padding-left:12px;border-left:1px solid #e0e0e0;margin-left:6px;margin-bottom:4px;">
            <div v-for="u in node.items" :key="u.codeId"
              @click="selectTree(u.codeValue)"
              :style="{
                display:'flex',alignItems:'center',justifyContent:'space-between',
                padding:'5px 8px',borderRadius:'4px',cursor:'pointer',fontSize:'11px',marginBottom:'1px',
                background: selectedTreeKey===u.codeValue ? '#e8f4f8' : 'transparent',
                color: selectedTreeKey===u.codeValue ? '#0277bd' : '#555',
                fontWeight: selectedTreeKey===u.codeValue ? 600 : 400,
              }">
              <span style="display:flex;align-items:center;gap:4px;flex:1;min-width:0;overflow:hidden;">
                <span style="font-size:9px;background:#e8f4f8;color:#0277bd;border-radius:6px;padding:1px 6px;font-weight:600;white-space:nowrap;flex-shrink:0;">(UI)</span>
                <span style="font-size:8px;background:#f0f4ff;color:#1d4ed8;border-radius:3px;padding:0 4px;flex-shrink:0;white-space:nowrap;">{{ u.codeValue }}</span>
                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ u.codeLabel }}</span>
              </span>
              <span style="font-size:9px;background:#e3f2fd;color:#1565c0;border-radius:6px;padding:1px 6px;font-weight:600;flex-shrink:0;margin-left:4px;white-space:nowrap;">
                {{ areaCountFor(u.codeValue) }}
              </span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 우측 목록 -->
    <div style="flex:1;min-width:0;">
    <div class="card">
      <div class="toolbar">
        <span class="list-title">전시 UI목록 <span class="list-count">{{ total }}건</span></span>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
          <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
        </div>
      </div>
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:44px;">ID</th>
            <th>UI 정보</th>
            <th style="width:160px;text-align:right;">관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pageList.length===0">
            <td colspan="3" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
          </tr>
          <template v-for="u in pageList" :key="u.codeId">
            <tr :style="selectedId===u.codeId?'background:#fff8f9;':''">
              <td style="color:#aaa;font-size:12px;vertical-align:top;padding-top:12px;">
                <button @click="toggleExpandUI(u.codeId)" style="background:none;border:none;cursor:pointer;font-size:13px;padding:2px 4px;margin-right:4px;"
                  :title="isUIExpanded(u.codeId)?'축소':'펼치기'">{{ isUIExpanded(u.codeId) ? '▼' : '▶' }}</button>
                {{ u.codeId }}
              </td>
              <td style="padding:10px 12px;">
                <div style="margin-bottom:6px;">
                  <code style="font-size:12px;background:#f0f2f5;padding:2px 8px;border-radius:4px;">{{ u.codeValue }}</code>
                  <span class="title-link" @click="loadDetail(u.codeId)"
                    :style="'font-size:14px;font-weight:700;margin-left:8px;'+(selectedId===u.codeId?'color:#e8587a;':'color:#222;')">
                    {{ u.codeLabel }}
                    <span v-if="selectedId===u.codeId" style="font-size:10px;margin-left:3px;">▼</span>
                  </span>
                  <span class="badge" :class="statusBadge(u.useYn)" style="font-size:11px;margin-left:8px;">{{ u.useYn==='Y'?'사용':'미사용' }}</span>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:11px;color:#555;line-height:1.6;">
                  <span><b style="color:#888;">표시경로:</b>
                    <span style="background:#fff3e0;color:#e65100;border-radius:8px;padding:1px 7px;margin-left:3px;">{{ pathLabel(u.pathId) || u.displayPath || ((u.uiType || '-') + '.' + u.codeLabel) }}</span>
                  </span>
                  <span><b style="color:#888;">유형:</b> {{ uiTypeLabel(u.uiType) }}</span>
                  <span><b style="color:#888;">포함 영역:</b>
                    <span style="background:#e3f2fd;color:#1565c0;border-radius:10px;padding:1px 8px;margin-left:3px;font-weight:700;">{{ areaCountFor(u.codeValue) }}</span>
                  </span>
                  <span><b style="color:#888;">순서:</b> {{ u.sortOrd ?? '-' }}</span>
                  <span><b style="color:#888;">등록일:</b> {{ u.regDate || '-' }}</span>
                  <span><b style="color:#888;">사이트:</b>
                    <span style="background:#e8f0fe;color:#1565c0;border:1px solid #bbdefb;border-radius:8px;padding:0 6px;margin-left:3px;">{{ siteNm }}</span>
                  </span>
                  <span v-if="u.remark" style="flex:1 1 100%;"><b style="color:#888;">설명:</b> {{ u.remark }}</span>
                </div>
              </td>
              <td style="vertical-align:top;padding-top:10px;">
                <div class="actions" style="justify-content:flex-end;">
                  <button class="btn btn-blue btn-sm" @click="loadDetail(u.codeId)">수정</button>
                  <button class="btn btn-danger btn-sm" @click="doDelete(u)">삭제</button>
                </div>
              </td>
            </tr>
            <!-- 펼쳤을 때 영역 목록 표시 -->
            <tr v-if="isUIExpanded(u.codeId)" :key="'expand_'+u.codeId">
              <td colspan="3" style="background:#fafafa;padding:12px 16px;">
                <div style="font-size:12px;font-weight:700;color:#666;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e0e0e0;">
                  📌 연결된 영역 ({{ areasOfUi(u.codeValue).length }}개)
                </div>
                <div v-if="areasOfUi(u.codeValue).length===0" style="color:#bbb;font-size:11px;padding:8px 0;">영역이 없습니다.</div>
                <div v-else style="display:grid;gap:8px;">
                  <div v-for="a in areasOfUi(u.codeValue)" :key="a.codeId"
                    style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid #e0e0e0;border-radius:6px;background:#fff;">
                    <span style="font-size:10px;background:#f3e5f5;color:#6a1b9a;border-radius:8px;padding:2px 8px;font-weight:600;white-space:nowrap;">영역</span>
                    <span style="font-size:12px;color:#333;font-weight:600;flex:1;">{{ a.codeLabel }}</span>
                    <span style="font-size:10px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:2px 8px;font-weight:600;">
                      {{ (dispDataset.displays||[]).filter(d => d.area===a.codeValue).length }}개 패널
                    </span>
                    <span :style="'font-size:10px;border-radius:8px;padding:2px 8px;font-weight:600;'+(a.useYn==='Y'?'background:#c8e6c9;color:#2e7d32;':'background:#f1f1f1;color:#666;')">
                      {{ a.useYn==='Y' ? '사용' : '미사용' }}
                    </span>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
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
    </div>
  </div>

  <!-- 하단 상세 -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <dp-disp-ui-dtl
      :key="selectedId"
      :navigate="inlineNavigate" :disp-dataset="dispDataset"
      :show-ref-modal="showRefModal" :show-toast="showToast"
      :show-confirm="showConfirm" :set-api-res="setApiRes"
      :edit-id="detailEditId" />
  </div>
</div>
  `,
};
