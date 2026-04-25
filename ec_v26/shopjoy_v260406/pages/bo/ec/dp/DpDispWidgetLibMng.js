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
      codes.disp_widget_types = codeStore.snGetGrpCodes('DISP_WIDGET_TYPE');
      uiState.isPageCodeLoad = true;
    };

    // App 초기화 감시
    watch(isAppReady, (ready) => {
      if (ready) {
        fnLoadCodes();
      }
    });

    // onMounted에서 API 로드
    const handleFetchData = async () => {
      uiState.loading = true;
      try {
        const res = await window.boApi.get('/bo/ec/dp/widget-lib/page', {
          params: { pageNo: 1, pageSize: 10000 }
        });
        widgetLibs.splice(0, widgetLibs.length, ...(res.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('DpDispWidgetLib 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleFetchData();
    });
    const pathLabel = (id) => window.boCmUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));

    const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());
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
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    const applied = reactive({ kw: '', type: '', status: '' });
    const onSearch = () => {
      applied.kw     = searchParam.kw.trim().toLowerCase();
      applied.type   = searchParam.type;
      applied.status = searchParam.status;
      pager.page = 1;
    };
    const onReset = () => {
      Object.assign(searchParam, searchParamOrg);
      Object.assign(applied, { kw: '', type: '', status: '' });
      pager.page = 1;
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
      error: null,
      error: null,
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
        else lib.uwindow.safeArrayUtils.safeForEach(sedPaths, p => addToPath(lib, p));
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
    const selectTree = (key) => { uiState.selectedTreeKey = uiState.selectedTreeKey === key ? '' : key; pager.page = 1; };
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
      const s = (pager.page - 1) * pager.size;
      return cfFiltered.value.slice(s, s + pager.size);
    });
    const cfTotalPages  = computed(() => Math.max(1, Math.ceil(cfTotalCount.value / pager.size)));
    const cfPageNumbers = computed(() => {
      const pages = []; const cur = pager.page; const tot = cfTotalPages.value;
      for (let i = Math.max(1, cur - 2); i <= Math.min(tot, cur + 2); i++) pages.push(i);
      return pages;
    });

    /* ── 하단 인라인 Dtl ── */
