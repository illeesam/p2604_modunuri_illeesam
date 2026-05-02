/* ShopJoy Admin - 전시관계도 (UI > 영역 > 패널 계층 구조) */
window.DpDispRelationMng = {
  name: 'DpDispRelationMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({
      disp_relation_types: [],
      date_range_opts: [],
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.disp_relation_types = codeStore.snGetGrpCodes('DISP_RELATION_TYPE') || [];
        codes.date_range_opts = codeStore.snGetGrpCodes('DATE_RANGE_OPT') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    // ── watch ────────────────────────────────────────────────────────────────

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });

    const displays = reactive([]);

    const handleSearchData = async (searchType = 'DEFAULT') => {
      try {
        const res = await boApiSvc.dpUi.getPage({ pageNo: 1, pageSize: 10000 }, '전시연관관리', '조회');
        displays.splice(0, displays.length, ...(res.data?.data?.pageList || res.data?.data?.list || []));
      } catch (_) {
      console.error('[catch-info]', _);}
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleSearchData('DEFAULT');
    });

    /* 검색 */
  const searchParam = reactive(_initSearchParam());
    const onSearch = async () => {
    try {
      const params = { pageNo: 1, pageSize: 100000, ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v)) };
      const res = await boApiSvc.dpResource.getPage(params, '전시연관관리', '조회');
      // TODO: Update items array based on response
      pager.pageNo = 1;
      await handleSearchData();
    } catch (err) {
      console.error('[catch-info]', err);
    }
  };
  
    const onReset = () => {
    Object.assign(searchParam, _initSearchParam());
    onSearch();
  };

    const cfTreeData = computed(() => {
      const uis = displays || [];
      return uis.map(ui => ({
        type: 'ui',
        id: ui.dispId,
        code: ui.dispId,
        name: ui.name,
        useYn: ui.useYn,
        visibilityTargets: ui.visibilityTargets || '',
        childCount: (ui.areas || []).length,
        children: (ui.areas || []).map(area => {
          const areaPanels = (area.panels || []);

    // ── return ───────────────────────────────────────────────────────────────

          return {
            type: 'area',
            id: area.codeId,
            code: area.codeValue,
            name: area.codeLabel,
            useYn: area.useYn,
            visibilityTargets: area.visibilityTargets || '',
            childCount: areaPanels.length,
            children: areaPanels
              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
              .map(p => ({
                type: 'panel',
                id: p.dispId,
                code: p.dispId,
                name: p.name,
                useYn: p.useYn,
                visibilityTargets: p.visibilityTargets || '',
                childCount: (p.rows || []).length,
              })),
          };
        }),
      }));
    });

    const expandedNodes = reactive(new Set());
    const toggleNode = (key) => { if (expandedNodes.has(key)) expandedNodes.delete(key); else expandedNodes.add(key); };
    const isNodeExpanded = (key) => expandedNodes.has(key);

    /* 공개범위 표시 */
    const fnGetVisibilityBadges = (targets) => {
      if (!targets) return [];
      return targets.split('^').filter(Boolean);
    };

    /* 뱃지 색상 */
    const fnGetBadgeColor = (type) => {
      const colors = {
        ui: { bg: '#e8f4f8', color: '#0277bd' },
        area: { bg: '#e8f0fe', color: '#1a73e8' },
        panel: { bg: '#fff3e0', color: '#e65100' },
      };
      return colors[type] || { bg: '#f0f0f0', color: '#666' };
    };

    /* 사용여부 배지 */
    const fnGetUseYnBadge = (useYn) => {
      return useYn === 'Y' ? { bg: '#c8e6c9', color: '#2e7d32', text: '사용' }
                            : { bg: '#f1f1f1', color: '#666', text: '미사용' };
    };

    // ── return ───────────────────────────────────────────────────────────────

    return {
      codes, searchParam,
      onSearch, onReset,
      expandedNodes, toggleNode, isNodeExpanded,
      cfTreeData, fnGetVisibilityBadges, fnGetBadgeColor, fnGetUseYnBadge,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">전시관계도 <span style="font-size:13px;font-weight:400;color:#888;">UI · 영역 · 패널 계층 구조</span></div>

  <!-- ── 검색 ───────────────────────────────────────────────────────────── -->
  <div class="card">
    <div class="search-bar">
      <span class="search-label">등록기간</span>
      <input type="date" v-model="searchParam.dateStart" class="date-range-input" />
      <span class="date-range-sep">~</span>
      <input type="date" v-model="searchParam.dateEnd" class="date-range-input" />
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <!-- ── 내용 ───────────────────────────────────────────────────────────── -->
  <div class="card" style="padding:12px;">
    <div v-if="!cfTreeData.length" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</div>

    <div v-for="ui in cfTreeData" :key="ui?.id" style="margin-bottom:12px;border:1px solid #f0f0f0;border-radius:6px;overflow:hidden;">
      <!-- ── UI 행 ─────────────────────────────────────────────────────── -->
      <div @click="toggleNode('ui_'+ui.id)"
        style="display:flex;align-items:center;gap:8px;padding:10px;background:#f9f9fb;cursor:pointer;user-select:none;">
        <span style="font-size:12px;color:#999;width:20px;text-align:center;">{{ isNodeExpanded('ui_'+ui.id) ? '▼' : '▶' }}</span>
        <span :style="{background: fnGetBadgeColor('ui').bg, color: fnGetBadgeColor('ui').color, fontSize:'10px', borderRadius:'6px', padding:'2px 8px', fontWeight:600}">UI</span>
        <span style="font-weight:700;color:#222;flex:1;">{{ ui.name }}</span>
        <template v-if="fnGetVisibilityBadges(ui.visibilityTargets).length">
          <span style="font-size:9px;background:#e0e0e0;color:#666;border-radius:4px;padding:2px 6px;">{{ fnGetVisibilityBadges(ui.visibilityTargets).join(', ') }}</span>
        </template>
        <span :style="{background: fnGetUseYnBadge(ui.useYn).bg, color: fnGetUseYnBadge(ui.useYn).color, fontSize:'10px', borderRadius:'6px', padding:'2px 8px', fontWeight:600}">{{ fnGetUseYnBadge(ui.useYn).text }}</span>
        <span style="font-size:10px;color:#aaa;">하위: {{ ui.childCount }}</span>
      </div>

      <!-- ── 영역들 ──────────────────────────────────────────────────────── -->
      <div v-if="isNodeExpanded('ui_'+ui.id)" style="background:#fafafa;">
        <div v-for="area in ui.children" :key="area?.id" style="border-top:1px solid #f0f0f0;">
          <div @click="toggleNode('area_'+area.id)"
            style="display:flex;align-items:center;gap:8px;padding:8px 12px 8px 40px;cursor:pointer;user-select:none;background:#fff;">
            <span style="font-size:12px;color:#999;width:20px;text-align:center;">{{ isNodeExpanded('area_'+area.id) ? '▼' : '▶' }}</span>
            <span :style="{background: fnGetBadgeColor('area').bg, color: fnGetBadgeColor('area').color, fontSize:'10px', borderRadius:'6px', padding:'2px 8px', fontWeight:600}">영역</span>
            <span style="font-weight:600;color:#333;flex:1;">{{ area.name }}</span>
            <template v-if="fnGetVisibilityBadges(area.visibilityTargets).length">
              <span style="font-size:9px;background:#e0e0e0;color:#666;border-radius:4px;padding:2px 6px;">{{ fnGetVisibilityBadges(area.visibilityTargets).join(', ') }}</span>
            </template>
            <span :style="{background: fnGetUseYnBadge(area.useYn).bg, color: fnGetUseYnBadge(area.useYn).color, fontSize:'10px', borderRadius:'6px', padding:'2px 8px', fontWeight:600}">{{ fnGetUseYnBadge(area.useYn).text }}</span>
            <span style="font-size:10px;color:#aaa;">하위: {{ area.childCount }}</span>
          </div>

          <!-- ── 패널들 ──────────────────────────────────────────────────── -->
          <div v-if="isNodeExpanded('area_'+area.id)" style="background:#fff;">
            <div v-for="panel in area.children" :key="panel?.id"
              style="display:flex;align-items:center;gap:8px;padding:6px 12px 6px 68px;border-top:1px solid #f5f5f5;font-size:11px;">
              <span :style="{background: fnGetBadgeColor('panel').bg, color: fnGetBadgeColor('panel').color, fontSize:'9px', borderRadius:'6px', padding:'2px 8px', fontWeight:600, flexShrink:0}">패널</span>
              <span style="color:#333;flex:1;">{{ panel.name }}</span>
              <template v-if="fnGetVisibilityBadges(panel.visibilityTargets).length">
                <span style="font-size:9px;background:#e0e0e0;color:#666;border-radius:4px;padding:2px 6px;">{{ fnGetVisibilityBadges(panel.visibilityTargets).join(', ') }}</span>
              </template>
              <span :style="{background: fnGetUseYnBadge(panel.useYn).bg, color: fnGetUseYnBadge(panel.useYn).color, fontSize:'10px', borderRadius:'6px', padding:'2px 8px', fontWeight:600, flexShrink:0}">{{ fnGetUseYnBadge(panel.useYn).text }}</span>
              <span style="font-size:10px;color:#aaa;">위젯: {{ panel.childCount }}</span>
            </div>
            <div v-if="!area.children.length" style="padding:8px 12px;color:#ccc;text-align:center;font-size:11px;">패널이 없습니다.</div>
          </div>
        </div>
        <div v-if="!ui.children.length" style="padding:8px 12px;color:#ccc;text-align:center;font-size:11px;">영역이 없습니다.</div>
      </div>
    </div>
  </div>
</div>
  `
};
