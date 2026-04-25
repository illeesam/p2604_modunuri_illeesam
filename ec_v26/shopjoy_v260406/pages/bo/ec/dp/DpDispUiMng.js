/* ShopJoy Admin - 전시UI관리 (목록 + 하단 상세 임베드)
 * 구조: UI > 영역 > 패널 > 위젯
 */
window.DpDispUiMng = {
  name: 'DpDispUiMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, onMounted } = Vue;
    const codes = Vue.computed(() => window.getBoCodeStore().svCodes);
    const displays = reactive([]);
    const loading = ref(false);
    const error = ref(null);

    // onMounted에서 API 로드
    const handleFetchData = async () => {
      loading.value = true;
      try {
        const res = await window.boApi.get('/bo/ec/dp/ui/page', {
          params: { pageNo: 1, pageSize: 10000 }
        });
        displays.splice(0, displays.length, ...(res.data?.data?.list || []));
        error.value = null;
      } catch (err) {
        console.error('[catch-info]', err);
        error.value = err.message;
        if (props.showToast) props.showToast('DpDispUi 로드 실패', 'error');
      } finally {
        loading.value = false;
      }
    };
    onMounted(() => { handleFetchData();
    Object.assign(searchParamOrg, searchParam); });
    const pathLabel = (id) => window.boCmUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));


    const UI_TYPE_OPTS = [
      { value: 'FO',     label: '프론트(FO)' },
      { value: 'BO',     label: '관리자(BO)' },
      { value: 'MOBILE', label: '모바일' },
      { value: 'KIOSK',  label: '키오스크' },
    ];

    const DATE_RANGE_OPTIONS = window.boCmUtil.DATE_RANGE_OPTIONS;
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = window.boCmUtil.getDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd   = r ? r.to   : '';
      }
    };
    const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());

    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    const selectedId = ref(null);
  const searchParam = reactive({
    kw: '',
    uiType: '',
    useYn: '',
    dateStart: '',
    dateEnd: '',
    dateRange: ''
  });
  const searchParamOrg = reactive({
    kw: '',
    uiType: '',
    useYn: '',
    dateStart: '',
    dateEnd: '',
    dateRange: ''
  });

    const onSearch = async () => {
    try {
      const params = { pageNo: 1, pageSize: 100000, ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v)) };
      const res = await window.boApi.get('/bo/ec/resource/page', { params });
      // TODO: Update items array based on response
      pager.page = 1;
    } catch (err) {
      console.error('[catch-info]', err);
      if (props.showToast) props.showToast('조회 실패', 'error');
    }
  };

    const onReset = () => {
    Object.assign(searchParam, searchParamOrg);
    onSearch();
  };

    const setPage = n => { if (n >= 1 && n <= cfTotalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const handleLoadDetail = (id) => { if (selectedId.value === id) { selectedId.value = null; return; } selectedId.value = id; };
    const openNew = () => { selectedId.value = '__new__'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispUiMng') { selectedId.value = null; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() =>
      selectedId.value === '__new__' ? null : selectedId.value
    );

    const handleDelete = async (u) => {
      const ok = await props.showConfirm('삭제', `[${u.codeLabel}] UI를 삭제하시겠습니까?`);
      if (!ok) return;
      const codesData = codes;
      const idx = codes.findIndex(x => x.codeId === u.codeId);
      if (idx !== -1) codes.splice(idx, 1);
      if (selectedId.value === u.codeId) selectedId.value = null;
      try {
        const res = await window.boApi.delete(`/bo/ec/dp/ui/${u.codeId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => window.boCmUtil.exportCsv(
      cfFiltered.value,
      [
        { label: 'ID', key: 'codeId' }, { label: 'UI코드', key: 'codeValue' },
        { label: 'UI명', key: 'codeLabel' }, { label: '유형', key: 'uiType' },
        { label: '순서', key: 'sortOrd' }, { label: '사용', key: 'useYn' },
        { label: '설명', key: 'remark' },
      ],
      '전시UI목록.csv'
    );

    const uiTypeLabel = (v) => (window.safeArrayUtils.safeFind(UI_TYPE_OPTS, o => o.value === v) || {}).label || '-';
    const fnStatusBadge = s => s === 'Y' ? 'badge-green' : 'badge-gray';

    /* UI 하위 영역 개수 (영역의 uiCode 필드 기준) */
    const areaCountFor = (uiCode) =>
      (codes || []).filter(c => c.codeGrp === 'DISP_AREA' && c.uiCode === uiCode).length;

    /* UI 하위 영역 목록 */
    const areasOfUi = (uiCode) =>
      (codes || [])
        .filter(c => c.codeGrp === 'DISP_AREA' && c.uiCode === uiCode)
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));

    /* 펼치기 기능 */
    const expandedUIs = reactive(new Set());
    const toggleExpandUI = (uiId) => {
      if (expandedUIs.has(uiId)) expandedUIs.delete(uiId);
      else expandedUIs.add(uiId);
    };
    const isUIExpanded = (uiId) => expandedUIs.has(uiId);

    return { codes, displays, loading, error, pathLabel,
      searchKw, searchUiType, searchUseYn, searchDateStart, searchDateEnd, searchDateRange,
      DATE_RANGE_OPTIONS, onDateRangeChange, cfSiteNm,
      UI_TYPE_OPTS,
      pager, PAGE_SIZES, cfTotal, cfTotalPages, cfPageList, cfPageNums, setPage, onSizeChange,
      onSearch, onReset, handleDelete, exportExcel,
      selectedId, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfDetailEditId,
      uiTypeLabel, fnStatusBadge, areaCountFor, areasOfUi,
      expandedUIs, toggleExpandUI, isUIExpanded,
      cfAllUis, cfFiltered, cfUiTree, selectedTreeKey, toggleTree, isTreeOpen, selectTree, expandAll, collapseAll,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">전시UI관리 <span style="font-size:13px;font-weight:400;color:#888;">화면 UI 등록 · 수정 · 삭제</span></div>

  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="UI코드 / UI명 / 설명 검색" style="min-width:260px;" />
      <select v-model="searchParam.uiType">
        <option value="">UI유형 전체</option>
        <option v-for="o in UI_TYPE_OPTS" :key="o?.value" :value="o.value">{{ o.label }}</option>
      </select>
      <select v-model="searchParam.useYn">
        <option value="">사용여부 전체</option>
        <option value="Y">사용</option>
        <option value="N">미사용</option>
      </select>
      <span class="search-label">등록일</span>
      <input type="date" v-model="searchParam.dateStart" class="date-range-input" />
      <span class="date-range-sep">~</span>
      <input type="date" v-model="searchParam.dateEnd" class="date-range-input" />
      <select v-model="searchParam.dateRange" @change="onDateRangeChange">
        <option value="">옵션선택</option>
        <option v-for="o in DATE_RANGE_OPTIONS" :key="o?.value" :value="o.value">{{ o.label }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
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
        <span style="font-size:10px;color:#aaa;">{{ cfUiTree.length }}그룹</span>
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
        <span style="font-size:10px;background:#fff;color:#555;border:1px solid #ddd;border-radius:10px;padding:1px 7px;">{{ cfTotal }}</span>
      </div>
      <div v-if="isTreeOpen('__root__')" style="padding-left:12px;">
        <template v-for="node in cfUiTree" :key="node?.label">
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
            <div v-for="u in node.items" :key="u?.codeId"
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
        <span class="list-title">전시 UI목록 <span class="list-count">{{ cfTotal }}건</span></span>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
          <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
        </div>
      </div>
      <table class="bo-table">
        <thead>
          <tr>
            <th style="width:44px;">ID</th>
            <th>UI 정보</th>
            <th style="width:160px;text-align:right;">관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cfPageList.length===0">
            <td colspan="3" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
          </tr>
          <template v-for="u in cfPageList" :key="u?.codeId">
            <tr :style="selectedId===u.codeId?'background:#fff8f9;':''">
              <td style="color:#aaa;font-size:12px;vertical-align:top;padding-top:12px;">
                <button @click="toggleExpandUI(u.codeId)" style="background:none;border:none;cursor:pointer;font-size:13px;padding:2px 4px;margin-right:4px;"
                  :title="isUIExpanded(u.codeId)?'축소':'펼치기'">{{ isUIExpanded(u.codeId) ? '▼' : '▶' }}</button>
                {{ u.codeId }}
              </td>
              <td style="padding:10px 12px;">
                <div style="margin-bottom:6px;">
                  <code style="font-size:12px;background:#f0f2f5;padding:2px 8px;border-radius:4px;">{{ u.codeValue }}</code>
                  <span class="title-link" @click="handleLoadDetail(u.codeId)"
                    :style="'font-size:14px;font-weight:700;margin-left:8px;'+(selectedId===u.codeId?'color:#e8587a;':'color:#222;')">
                    {{ u.codeLabel }}
                    <span v-if="selectedId===u.codeId" style="font-size:10px;margin-left:3px;">▼</span>
                  </span>
                  <span class="badge" :class="fnStatusBadge(u.useYn)" style="font-size:11px;margin-left:8px;">{{ u.useYn==='Y'?'사용':'미사용' }}</span>
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
                    <span style="background:#e8f0fe;color:#1565c0;border:1px solid #bbdefb;border-radius:8px;padding:0 6px;margin-left:3px;">{{ cfSiteNm }}</span>
                  </span>
                  <span v-if="u.remark" style="flex:1 1 100%;"><b style="color:#888;">설명:</b> {{ u.remark }}</span>
                </div>
              </td>
              <td style="vertical-align:top;padding-top:10px;">
                <div class="actions" style="justify-content:flex-end;">
                  <button class="btn btn-blue btn-sm" @click="handleLoadDetail(u.codeId)">수정</button>
                  <button class="btn btn-danger btn-sm" @click="handleDelete(u)">삭제</button>
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
                  <div v-for="a in areasOfUi(u.codeValue)" :key="a?.codeId"
                    style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid #e0e0e0;border-radius:6px;background:#fff;">
                    <span style="font-size:10px;background:#f3e5f5;color:#6a1b9a;border-radius:8px;padding:2px 8px;font-weight:600;white-space:nowrap;">영역</span>
                    <span style="font-size:12px;color:#333;font-weight:600;flex:1;">{{ a.codeLabel }}</span>
                    <span style="font-size:10px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:2px 8px;font-weight:600;">
                      {{ ([]||[]).filter(d => d.area===a.codeValue).length }}개 패널
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
  </div>

  <!-- 하단 상세 -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <dp-disp-ui-dtl
      :key="selectedId"
      :navigate="inlineNavigate"
      :show-ref-modal="showRefModal" :show-toast="showToast"
      :show-confirm="showConfirm" :set-api-res="setApiRes"
      :edit-id="cfDetailEditId" />
  </div>
</div>
  `,
};
