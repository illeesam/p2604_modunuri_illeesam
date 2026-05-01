/* ShopJoy Admin - 전시위젯 목록 (UI용 배치 위젯) */
window.DpDispWidgetMng = {
  name: 'DpDispWidgetMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const codes = reactive({ disp_widget_types: [], active_statuses: [] });
    const uiState = reactive({ loading: false, isPageCodeLoad: false, selectedPath: null });
    const widgetLibs = reactive([]);
    const widgets = reactive([]);

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
    const handleSearchData = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const [res, resLibs] = await Promise.all([
          boApiSvc.dpWidget.getPage({ pageNo: 1, pageSize: 10000 }, '전시위젯관리', '조회'),
          boApiSvc.dpWidgetLib.getPage({ pageNo: 1, pageSize: 10000 }, '전시위젯관리', '조회'),
        ]);
        widgets.splice(0, widgets.length, ...(res.data?.data?.pageList || res.data?.data?.list || []));
        widgetLibs.splice(0, widgetLibs.length, ...(resLibs.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    const searchParam = reactive({ kw: '', type: '', status: '' });
    const searchParamOrg = reactive({ kw: '', type: '', status: '' });

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleSearchData('DEFAULT');
    Object.assign(searchParamOrg, searchParam); });
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
    const wTypeLabel = (v) => codes.disp_widget_types.find(t => t.codeValue === v)?.codeLabel || v;
    const wIcon      = (v) => WIDGET_ICONS[v] || '▪';

    /* ── 검색 ── */
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const applied = reactive({ kw: '', type: '', status: '' });
    const onSearch = async () => {
    try {
      Object.assign(applied, searchParam);
      pager.pageNo = 1;
      await handleSearchData('DEFAULT');
    } catch (err) {
      console.error('[catch-info]', err);
    }
  };

    const onReset = () => {
    Object.assign(searchParam, searchParamOrg);
    Object.assign(applied, { kw: '', type: '', status: '' });
    pager.pageNo = 1;
    handleSearchData('DEFAULT');
  };
  

    const uiStateDetail = reactive({ selectedId: null, openMode: 'view' });
    const handleLoadDetail = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'edit') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; };
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; };
    const closeDetail = () => { uiStateDetail.selectedId = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispWidgetMng') { uiStateDetail.selectedId = null; return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    const cfFiltered = computed(() => (widgetLibs || []).filter(d => {
      const kw = (applied.kw || '').toLowerCase();
      if (kw && !(d.name || '').toLowerCase().includes(kw)) return false;
      if (applied.type && d.widgetType !== applied.type) return false;
      if (applied.status && d.status !== applied.status) return false;
      return true;
    }));
    const cfTotalCount = computed(() => cfFiltered.value.length);
    const cfTotalPages = computed(() => Math.max(1, Math.ceil(cfTotalCount.value / pager.pageSize)));
    const cfPageList = computed(() => cfFiltered.value.slice((pager.pageNo - 1) * pager.pageSize, pager.pageNo * pager.pageSize));
    const cfPageNums = computed(() => { const c=pager.pageNo,l=cfTotalPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });
    const fnStatusCls = (v) => ({ '활성':'badge-green', '비활성':'badge-gray' }[v] || 'badge-gray');
    const contentSummary = (d) => d?.contents || d?.desc || '';

    const setPage = n => { if (n >= 1 && n <= cfTotalPages.value) pager.pageNo = n; };
    const onSizeChange = () => { pager.pageNo = 1; };

    /* ── 표시경로 트리 ── */
    const expanded = reactive(new Set([null]));
    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    const selectNode = (id) => { uiState.selectedPath = id; pager.pageNo = 1; };
    const cfTree = computed(() => boUtil.buildPathTree('ec_disp_widget'));
    const expandAll = () => { const walk = (n) => { expanded.add(n.pathId); n.children.forEach(walk); }; walk(cfTree.value); };
    const collapseAll = () => { expanded.clear(); expanded.add(null); };
    onMounted(() => {
      const initSet = boUtil.collectExpandedToDepth(cfTree.value, 2);
      expanded.clear(); initSet.forEach(v => expanded.add(v));
    });
    const handleDelete = async (d) => {
      const ok = await props.showConfirm('삭제', '삭제하시겠습니까?');
      if (!ok) return;
      try {
        await boApi.delete(`/bo/ec/dp/widget/${d.libId}`, { ...coUtil.apiHdr('전시위젯관리', '삭제') });
        props.showToast('삭제되었습니다.', 'success');
        handleSearchData();
      } catch (err) {
        props.showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    // ── return ───────────────────────────────────────────────────────────────

    return { widgets, widgetLibs, uiState, pathLabel,
      codes, wTypeLabel, wIcon,
      searchParam, searchParamOrg, pager,
      applied, onSearch, onReset,
      cfSiteNm,
      setPage, onSizeChange,
      uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId),
      handleLoadDetail, openNew, closeDetail, inlineNavigate,
      cfDetailEditId, cfDetailKey,
      cfFiltered, cfTotalCount, cfTotalPages, cfPageList, cfPageNums,
      cfTree, expanded, toggleNode, selectNode, expandAll, collapseAll,
      fnStatusCls, contentSummary, handleDelete,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">
    <span style="font-size:14px;font-weight:600;color:#333;">전시위젯관리</span>
    <span style="font-size:13px;font-weight:400;color:#999;margin:0 8px;">&gt;</span>
    <span style="font-size:14px;font-weight:600;color:#666;">전시위젯관리</span>
    <span style="font-size:13px;font-weight:400;color:#888;display:block;margin-top:4px;">위젯 유형별 리소스 등록·재활용</span>
  </div>

  <!-- ── 검색 필터 ────────────────────────────────────────────────────────── -->
  <div class="card" style="padding:14px 18px;margin-bottom:14px;">
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
      <div class="form-group" style="margin:0;min-width:180px;flex:1;">
        <label class="form-label">검색어</label>
        <input v-model="searchParam.kw" class="form-control" placeholder="이름·설명·태그" @keyup.enter="() => onSearch?.()" style="margin:0;" />
      </div>
      <div class="form-group" style="margin:0;width:160px;">
        <label class="form-label">위젯 유형</label>
        <select v-model="searchParam.type" class="form-control" style="margin:0;">
          <option value="">전체</option>
          <option v-for="t in codes.disp_widget_types" :key="t?.codeValue" :value="t.codeValue">{{ t.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group" style="margin:0;width:110px;">
        <label class="form-label">상태</label>
        <select v-model="searchParam.status" class="form-control" style="margin:0;">
          <option value="">전체</option>
          <option v-for="c in codes.active_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
      <button @click="onSearch" class="btn btn-primary" style="height:36px;padding:0 20px;">조회</button>
      <button @click="onReset"  class="btn btn-outline" style="height:36px;padding:0 16px;">초기화</button>
      <button @click="openNew"  class="btn btn-primary" style="height:36px;padding:0 18px;margin-left:auto;">+ 신규등록</button>
    </div>
  </div>

  <!-- ── 본문: 좌측 트리 + 우측 목록 ────────────────────────────────────────────── -->
  <div style="display:flex;gap:12px;align-items:flex-start;">

  <!-- ── 좌측 표시경로 ──────────────────────────────────────────────────────── -->
  <div class="card" style="width:240px;min-width:180px;flex-shrink:0;padding:12px;max-height:calc(100vh - 260px);overflow-y:auto;">
    <div class="toolbar" style="margin-bottom:8px;"><span class="list-title" style="font-size:13px;">📂 표시경로</span></div>
    <div style="display:flex;gap:4px;margin-bottom:8px;">
      <button class="btn btn-sm" @click="expandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
      <button class="btn btn-sm" @click="collapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
    </div>
    <div style="max-height:65vh;overflow:auto;">
      <path-tree-node :node="cfTree" :expanded="expanded" :selected="uiState.selectedPath" :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
    </div>
  </div>

  <!-- ── 우측 목록 ────────────────────────────────────────────────────────── -->
  <div style="flex:1;min-width:0;">
  <!-- ── 목록 ───────────────────────────────────────────────────────────── -->
  <div class="card" style="padding:0;">
    <div style="padding:12px 18px;border-bottom:1px solid #f0f0f0;">
      <span style="font-size:13px;color:#555;">총 <b>{{ cfTotalCount }}</b>건</span>
    </div>

    <table class="bo-table">
      <thead>
        <tr>
          <th style="width:56px;">ID</th>
          <th>위젯 정보</th>
          <th style="width:120px;text-align:right;">관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="cfPageList.length===0">
          <td colspan="3" style="text-align:center;padding:30px;color:#ccc;">등록된 위젯 리소스가 없습니다.</td>
        </tr>
        <tr v-for="(d, idx) in cfPageList" :key="d?.libId"
          :style="selectedId===d.libId ? 'background:#fff8f8;' : ''">
          <td style="color:#aaa;font-size:12px;vertical-align:top;padding-top:12px;">#{{ String(d.libId).padStart(4,'0') }}</td>
          <td style="padding:10px 12px;">
            <div style="margin-bottom:6px;">
              <span style="font-size:15px;margin-right:4px;">{{ wIcon(d.widgetType) }}</span>
              <span style="background:#f5f5f5;border:1px solid #e8e8e8;border-radius:6px;padding:1px 7px;font-size:11px;color:#555;">{{ wTypeLabel(d.widgetType) }}</span>
              <span class="title-link" @click="handleLoadDetail(d.libId)"
                :style="'font-size:14px;font-weight:700;margin-left:8px;'+(selectedId===d.libId?'color:#e8587a;':'color:#222;')">{{ d.name }}</span>
              <span class="badge" :class="fnStatusCls(d.status)" style="font-size:11px;margin-left:8px;">{{ d.status }}</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:11px;color:#555;line-height:1.6;">
              <span><b style="color:#888;">내용:</b> {{ contentSummary(d) || '-' }}</span>
              <span><b style="color:#888;">타이틀:</b>
                {{ d.titleYn==='Y' ? (d.title || '표시') : '미표시' }}
              </span>
              <span><b style="color:#888;">표시경로:</b>
                <span v-if="d.displayPath" style="display:inline-block;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:8px;padding:1px 7px;margin-left:3px;font-family:monospace;">{{ d.displayPath }}</span>
                <template v-else-if="d.usedPaths && d.usedPaths.length">
                  <span v-for="(p,pi) in d.usedPaths" :key="pi"
                    style="display:inline-block;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:8px;padding:1px 7px;margin-left:3px;">{{ p }}</span>
                </template>
                <span v-else style="color:#ccc;">미등록</span>
              </span>
              <span><b style="color:#888;">적용수:</b>
                <span style="background:#dbeafe;color:#1d4ed8;border-radius:10px;padding:1px 8px;font-weight:700;margin-left:3px;">{{ (d.usedPaths||[]).length }}</span>
              </span>
              <span v-if="d.tags"><b style="color:#888;">태그:</b> {{ d.tags }}</span>
              <span><b style="color:#888;">등록일:</b> {{ d.regDate || '-' }}</span>
              <span><b style="color:#888;">사이트:</b>
                <span style="background:#e8f0fe;color:#1565c0;border:1px solid #bbdefb;border-radius:8px;padding:0 6px;margin-left:3px;">{{ cfSiteNm }}</span>
              </span>
            </div>
          </td>
          <td style="vertical-align:top;padding-top:10px;">
            <div class="actions" style="justify-content:flex-end;">
              <button @click.stop="handleLoadDetail(d.libId)" class="btn btn-blue btn-sm">수정</button>
              <button @click.stop="handleDelete(d)" class="btn btn-danger btn-sm">삭제</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ── 페이저 ────────────────────────────────────────────────────────── -->
    <div class="pagination">
      <div class="pager">
        <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
        <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
        <button v-for="n in cfPageNums" :key="n" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
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

  </div><!-- ── /우측 목록 ─────────────────────────────────────────────────────────── -->
  </div><!-- ── /본문 flex ───────────────────────────────────────────────────────── -->

  <!-- ── 인라인 상세 ───────────────────────────────────────────────────────── -->
  <div v-if="selectedId !== null" style="margin-top:16px;">
    <dp-disp-widget-dtl
      :key="cfDetailKey"
      :navigate="inlineNavigate"
      :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :edit-id="cfDetailEditId"
      @close="closeDetail"
    />
  </div>
</div>
`
};
