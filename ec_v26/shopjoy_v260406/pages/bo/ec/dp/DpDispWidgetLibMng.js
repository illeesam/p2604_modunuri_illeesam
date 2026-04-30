/* ShopJoy Admin - 위젯라이브러리 목록 */
window.DpDispWidgetLibMng = {
  name: 'DpDispWidgetLibMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const widgetLibs = reactive([]);
    const uiState = reactive({ loading: false, isPageCodeLoad: false, selectedTreeKey: ''});
    const codes = reactive({ disp_widget_types: [] });

    // App 초기화 준비 상태
    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading
          && codeStore?.svCodes?.length > 0
          && !uiState.isPageCodeLoad;
    });

    // 코드 주입
    const fnLoadCodes = () => {
      const codeStore = window.getBoCodeStore();
      codes.disp_widget_types = codeStore.snGetGrpCodes('DISP_WIDGET_TYPE') || [];
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
        const res = await boApi.get('/bo/ec/dp/widget-lib/page', {
          params: { pageNo: 1, pageSize: 10000 },
          ...coUtil.apiHdr('전시위젯라이브러리', '조회')
        });
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

    /* ── 표시경로 ── */
       /* '' = 전체, 'top' or 'top>sub' */
    const cfTree = computed(() => {
      const map = {};
      const addToPath = (lib, pathStr) => {
        const parts = pathStr.split('>').map(s => s.trim()).filter(Boolean);
        if (!parts.length) return;
        const top = window.safeArrayUtils.safeGet(parts, 0);
        const rest = parts.slice(1).join(' > ') || '(루트)';
        if (!map[top]) map[top] = {};
        if (!map[top][rest]) map[top][rest] = [];
        map[top][rest].push(lib);
      };
      window.safeArrayUtils.safeForEach(cfSearchedLibs, lib => {
        if (!lib.usedPaths || !lib.usedPaths.length) addToPath(lib, '(미등록) > (미등록)');
        else lib.usedPaths.forEach(p => addToPath(lib, p));
      });
      return Object.keys(map).sort().map(top => ({
        label: top,
        count: Object.values(map[top]).reduce((n, arr) => n + arr.length, 0),
        children: Object.keys(map[top]).sort().map(sub => ({
          label: sub,
          libs: map[top][sub],
          count: map[top][sub].length,
        })),
      }));
    });
    const openNodes = reactive(new Set(['__root__']));
    const toggleNode = (key) => {
      if (openNodes.has(key)) openNodes.delete(key);
      else openNodes.add(key);
    };
    const isOpen = (key) => openNodes.has(key);
    const selectTree = (key) => { uiState.selectedTreeKey = uiState.selectedTreeKey === key ? '' : key; pager.pageNo = 1; };
    const expandAll = () => {
      window.safeArrayUtils.safeForEach(cfTree, n => { openNodes.add(n.label); });
    };
    const collapseAll = () => { openNodes.clear(); };

    /* 트리 선택까지 반영한 최종 리스트 */
    const cfFiltered = computed(() => {
      const key = uiState.selectedTreeKey;
      let list = cfSearchedLibs.value;
      if (key) {
        const [top, sub] = key.split('>').map(s => s.trim());
        list = window.safeArrayUtils.safeFilter(list, lib => {
          const paths = lib.usedPaths && lib.usedPaths.length
            ? lib.usedPaths
            : ['(미등록) > (미등록)'];
          return window.safeArrayUtils.safeSome(paths, p => {
            const parts = p.split('>').map(s => s.trim()).filter(Boolean);
            if (window.safeArrayUtils.safeFirst(parts) !== top) return false;
            if (!sub) return true;
            const rest = parts.slice(1).join(' > ') || '(루트)';
            return rest === sub;
          });
        });
      }
      return [...list].sort((a, b) => b.libId - a.libId);
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
      cfTree, openNodes, toggleNode, isOpen, selectTree, expandAll, collapseAll,
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
        <option>활성</option><option>비활성</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title">위젯라이브러리 <span class="list-count">{{ cfTotalCount }}건</span></span>
      <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
    </div>
    <table class="bo-table">
      <thead><tr><th style="width:36px;text-align:center;">번호</th><th>ID</th><th>이름</th><th>타입</th><th>상태</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="cfPageList.length===0"><td colspan="6" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="(lib, idx) in cfPageList" :key="lib.libId">
          <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
          <td>{{ lib.libId }}</td>
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
