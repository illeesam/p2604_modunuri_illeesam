/* ShopJoy Admin - 위젯라이브러리 목록 */
window.DpDispWidgetLibMng = {
  name: 'DpDispWidgetLibMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const widgetLibs = reactive([]);
    const uiState = reactive({ loading: false, isPageCodeLoad: false, selectedPath: null });
    const codes = reactive({ disp_widget_types: [], active_statuses: [] });

    // App 초기화 준비 상태
    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading
          && codeStore?.svCodes?.length > 0
          && !uiState.isPageCodeLoad;
    });

    // 코드 주입
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.disp_widget_types = codeStore.snGetGrpCodes('DISP_WIDGET_TYPE') || [];
      codes.active_statuses = codeStore.snGetGrpCodes('ACTIVE_STATUS') || [];
      uiState.isPageCodeLoad = true;
    };

    // App 초기화 감시

    // ── watch ────────────────────────────────────────────────────────────────

    watch(isAppReady, (ready) => {
      if (ready) {
        fnLoadCodes();
      }
    });

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.dpWidgetLib.getPage({ pageNo: 1, pageSize: 10000 }, '전시위젯라이브러리', '조회');
        widgetLibs.splice(0, widgetLibs.length, ...(res.data?.data?.pageList || res.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });
    const pathLabel = (id) => boUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));

    const cfSiteNm = computed(() => boUtil.getSiteNm());
    const WIDGET_ICONS = {
      'image_banner':'🖼', 'product_slider':'🛒', 'product':'📦',
      'cond_product':'🔍', 'chart_bar':'📊',      'chart_line':'📈',
      'chart_pie':'🥧',   'text_banner':'📝',     'info_card':'ℹ️',
      'popup':'💬',        'file':'📎',            'file_list':'📁',
      'coupon':'🎟',       'html_editor':'📄',     'event_banner':'🎉',
      'cache_banner':'💰', 'widget_embed':'🧩',    'textarea':'📋',
      'markdown':'📑',       'barcode':'🔖',           'qrcode':'📱',
      'barcode_qrcode':'🔖', 'video_player':'▶️',      'countdown':'⏱',
      'payment_widget':'💳', 'approval_widget':'✅',   'map_widget':'🗺',
    };
    const wTypeLabel = (v) => window.safeArrayUtils.safeFind(codes.disp_widget_types, t => t.codeValue === v)?.codeLabel || v;
    const wIcon      = (v) => WIDGET_ICONS[v] || '▪';

    /* ── 검색 ── */
    const searchParam = reactive({ kw: '', type: '', status: '' });
    const searchParamOrg = reactive({ kw: '', type: '', status: '' });
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const applied = reactive({ kw: '', type: '', status: '' });
    const onSearch = async () => {
      applied.kw     = searchParam.kw.trim().toLowerCase();
      applied.type   = searchParam.type;
      applied.status = searchParam.status;
      pager.pageNo = 1;
      await Object.assign(pager.pageCond, searchParam); handleSearchList('DEFAULT');
    };
    const onReset = () => {
      Object.assign(searchParam, searchParamOrg);
      Object.assign(applied, { kw: '', type: '', status: '' });
      pager.pageNo = 1;
      handleSearchList('DEFAULT');
    };

    /* 검색 필터만 적용한 리스트 (트리 그룹화용) */
    const cfSearchedLibs = computed(() => {
      if (!Array.isArray(widgetLibs)) return [];
      return widgetLibs.filter(d => {
        if (applied.kw && !d.name.toLowerCase().includes(applied.kw) && !(d.desc||'').toLowerCase().includes(applied.kw) && !(d.tags||'').toLowerCase().includes(applied.kw)) return false;
        if (applied.type   && d.widgetType !== applied.type)   return false;
        if (applied.status && d.status     !== applied.status) return false;
        return true;
      });
    });

    /* ── 표시경로 트리 ── */
    const expanded = reactive(new Set([null]));
    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    const selectNode = (id) => { uiState.selectedPath = id; pager.pageNo = 1; };
    const cfTree = computed(() => boUtil.buildPathTree('ec_disp_widget_lib'));
    const expandAll = () => { const walk = (n) => { expanded.add(n.pathId); n.children.forEach(walk); }; walk(cfTree.value); };
    const collapseAll = () => { expanded.clear(); expanded.add(null); };
    onMounted(() => {
      const initSet = boUtil.collectExpandedToDepth(cfTree.value, 2);
      expanded.clear(); initSet.forEach(v => expanded.add(v));
    });

    /* 최종 리스트 */
    const cfFiltered = computed(() => {
      return [...cfSearchedLibs.value].sort((a, b) => b.libId - a.libId);
    });

    const cfTotalCount  = computed(() => cfFiltered.value.length);
    const cfPageList    = computed(() => {
      const s = (pager.pageNo - 1) * pager.pageSize;
      return cfFiltered.value.slice(s, s + pager.pageSize);
    });
    const cfTotalPages  = computed(() => Math.max(1, Math.ceil(cfTotalCount.value / pager.pageSize)));
    const cfPageNumbers = computed(() => {
      const pages = []; const cur = pager.pageNo; const tot = pager.pageTotalPage;
      for (let i = Math.max(1, cur - 2); i <= Math.min(tot, cur + 2); i++) pages.push(i);
      return pages;
    });

    /* ── 하단 인라인 Dtl ── */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view' });
    const handleLoadDetail = (id) => { if (uiStateDetail.selectedId === id) { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; };
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; };
    const closeDetail = () => { uiStateDetail.selectedId = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispWidgetLibMng') { uiStateDetail.selectedId = null; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const setPage = (n) => { if (n >= 1 && n <= pager.pageTotalPage) pager.pageNo = n; };
    const onSizeChange = () => { pager.pageNo = 1; };
    const handleDelete = async (lib) => {
      const ok = await props.showConfirm('삭제', `[${lib.name}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = widgetLibs.findIndex(x => x.libId === lib.libId);
      if (idx !== -1) widgetLibs.splice(idx, 1);
      if (uiStateDetail.selectedId === lib.libId) { uiStateDetail.selectedId = null; }
      try {
        const res = await boApi.delete(`/bo/ec/widget-lib/${lib.libId}`, { ...coUtil.apiHdr('전시위젯라이브러리', '삭제') });
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        if (props.showToast) props.showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    // ── return ───────────────────────────────────────────────────────────────

    return { widgetLibs, uiState, codes, searchParam, pager,
      applied, onSearch, onReset, setPage, onSizeChange,
      cfTree, expanded, toggleNode, selectNode, expandAll, collapseAll,
      cfFiltered, cfTotalCount, cfPageList, cfTotalPages, cfPageNumbers,
      wIcon, wTypeLabel,
      uiStateDetail, cfDetailEditId, handleLoadDetail, openNew, closeDetail, inlineNavigate,
      cfSiteNm, handleDelete };
  },
  template: /* html */`
<div>
  <div class="page-title">위젯라이브러리관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="이름/설명/태그 검색" />
      <select v-model="searchParam.type">
        <option value="">타입 전체</option>
        <option v-for="t in codes.disp_widget_types" :key="t.codeValue" :value="t.codeValue">{{ t.codeLabel }}</option>
      </select>
      <select v-model="searchParam.status">
        <option value="">상태 전체</option>
        <option v-for="c in codes.active_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:minmax(180px,22fr) 78fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;min-width:180px;">
      <div class="toolbar" style="margin-bottom:8px;"><span class="list-title" style="font-size:13px;">📂 표시경로</span></div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="expandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
        <button class="btn btn-sm" @click="collapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <path-tree-node :node="cfTree" :expanded="expanded" :selected="uiState.selectedPath" :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
    </div>
    <div>
      <div class="card">
        <div class="toolbar">
          <span class="list-title">위젯라이브러리 <span class="list-count">{{ cfTotalCount }}건</span></span>
          <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
        </div>
        <table class="bo-table">
          <thead><tr><th style="width:36px;text-align:center;">번호</th><th>이름</th><th>타입</th><th>상태</th><th style="text-align:right">관리</th></tr></thead>
          <tbody>
            <tr v-if="cfPageList.length===0"><td colspan="5" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
            <tr v-for="(lib, idx) in cfPageList" :key="lib.libId">
              <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
              <td><span class="title-link" @click="handleLoadDetail(lib.libId)">{{ wIcon(lib.widgetType) }} {{ lib.name }}</span></td>
              <td><span class="tag">{{ wTypeLabel(lib.widgetType) }}</span></td>
              <td><span class="badge" :class="lib.status==='활성'?'badge-green':'badge-gray'">{{ lib.status }}</span></td>
              <td><div class="actions">
                <button class="btn btn-blue btn-sm" @click="handleLoadDetail(lib.libId)">수정</button>
                <button class="btn btn-danger btn-sm" @click="handleDelete(lib)">삭제</button>
              </div></td>
            </tr>
          </tbody>
        </table>
        <div class="pagination">
          <div></div>
          <div class="pager">
            <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
            <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
            <button v-for="n in cfPageNumbers" :key="n" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
            <button :disabled="pager.pageNo===cfTotalPages" @click="setPage(pager.pageNo+1)">›</button>
            <button :disabled="pager.pageNo===cfTotalPages" @click="setPage(cfTotalPages)">»</button>
          </div>
          <div class="pager-right">
            <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
              <option v-for="s in pager.pageSizes" :key="s" :value="s">{{ s }}개</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-if="uiStateDetail.selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <dp-disp-widget-lib-dtl
      :key="uiStateDetail.selectedId"
      :navigate="inlineNavigate" :show-ref-modal="showRefModal"
      :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes"
      :edit-id="cfDetailEditId"
    />
  </div>
</div>
`
};
