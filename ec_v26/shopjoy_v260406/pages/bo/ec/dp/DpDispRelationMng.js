/* ShopJoy Admin - 전시관계도 (UI > 영역 > 패널 계층 구조) */
window.DpDispRelationMng = {
  name: 'DpDispRelationMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({});

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ DpDispRelationMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return onSearch();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ DpDispRelationMng.js : handleSelectAction -> ', cmd, param);
      // 트리 노드 토글
      if (cmd === 'relations-toggleNode') {
        return toggleNode(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* 실 데이터 — dp_ui / dp_area / dp_panel (직접 FK 계층) */
    const uis = reactive([]);
    const areas = reactive([]);
    const panels = reactive([]);

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleSearchData — UI/영역/패널 3계층 병렬 조회 (조인은 cfTreeData에서 uiId/areaId 기준) */
    const handleSearchData = async () => {
      uiState.loading = true;
      try {
        const params = { pageNo: 1, pageSize: 10000, ...coUtil.cofOmitEmpty(searchParam) };
        const [uiRes, areaRes, panelRes] = await Promise.all([
          boApiSvc.dpUi.getPage(params, '전시관계도', '조회'),
          boApiSvc.dpArea.getPage(params, '전시관계도', '조회'),
          boApiSvc.dpPanel.getPage(params, '전시관계도', '조회'),
        ]);
        uis.splice(0, uis.length, ...(uiRes.data?.data?.pageList || []));
        areas.splice(0, areas.length, ...(areaRes.data?.data?.pageList || []));
        panels.splice(0, panels.length, ...(panelRes.data?.data?.pageList || []));
        uiState.error = null;
      } catch (err) {
        uiState.error = err.message;
        console.error('[handleSearchData]', err);
      } finally {
        uiState.loading = false;
      }
    };

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchData();
    });

    /* onSearch — 조회 */
    const onSearch = () => handleSearchData();

    /* onReset — 초기화 */
    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      return handleSearchData();
    };

    /* _panelWidgetCount — dp_panel.content_json rows 개수 (위젯 수) — coUtil 위임 */
    const _panelWidgetCount = (p) => coUtil.cofPanelRowCount(p.contentJson);

    const cfTreeData = computed(() =>
      uis.map(ui => {
        const uiAreas = areas.filter(a => a.uiId === ui.uiId);
        return {
          type: 'ui',
          id: ui.uiId,
          code: ui.uiCd,
          name: (ui.uiCd ? '[' + ui.uiCd + '] ' : '') + (ui.uiNm || ''),
          useYn: ui.useYn,
          visibilityTargets: '',
          childCount: uiAreas.length,
          children: uiAreas.map(area => {
            const areaPanels = panels
              .filter(p => p.areaId === area.areaId)
              .sort((a, b) => String(a.panelId).localeCompare(String(b.panelId)));
            return {
              type: 'area',
              id: area.areaId,
              code: area.areaCd,
              name: (area.areaCd ? '[' + area.areaCd + '] ' : '') + (area.areaNm || ''),
              useYn: area.useYn,
              visibilityTargets: '',
              childCount: areaPanels.length,
              children: areaPanels.map(p => ({
                type: 'panel',
                id: p.panelId,
                code: p.panelId,
                name: p.panelNm,
                useYn: p.useYn,
                statusCd: p.dispPanelStatusCd,
                visibilityTargets: p.visibilityTargets || '',
                childCount: _panelWidgetCount(p),
              })),
            };
          }),
        };
      })
    );

    const expandedNodes = reactive(new Set());

    /* toggleNode — 노드 토글 */
    const toggleNode = (key) => { if (expandedNodes.has(key)) expandedNodes.delete(key); else expandedNodes.add(key); };

    /* isNodeExpanded — 여부 확인 */
    const isNodeExpanded = (key) => expandedNodes.has(key);

    /* fnGetVisibilityBadges — 유틸 */
    const fnGetVisibilityBadges = (targets) => {
      if (!targets) { return []; }
      return targets.split('^').filter(Boolean);
    };

    /* fnGetBadgeColor — 유틸 */
    const fnGetBadgeColor = (type) => {
      const colors = {
        ui: { bg: '#e8f4f8', color: '#0277bd' },
        area: { bg: '#e8f0fe', color: '#1a73e8' },
        panel: { bg: '#fff3e0', color: '#e65100' },
      };
      return colors[type] || { bg: '#f0f0f0', color: '#666' };
    };

    /* fnGetUseYnBadge — 유틸 */
    const fnGetUseYnBadge = (useYn) => {
      return useYn === 'Y' ? { bg: '#c8e6c9', color: '#2e7d32', text: '사용' }
                            : { bg: '#f1f1f1', color: '#666', text: '미사용' };
    };

    // --- [컬럼 정의] ---

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'dateStart_range', type: 'dateRange', label: '등록기간', startKey: 'dateStart', endKey: 'dateEnd' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      searchParam, uiState,                      // 상태 / 데이터
      handleBtnAction, handleSelectAction,                                          // dispatch (모든 이벤트 / 액션 라우팅)
      cfTreeData, // computed
      fnGetVisibilityBadges, fnGetBadgeColor, fnGetUseYnBadge, isNodeExpanded, // 헬퍼
    };
  },
  template: /* html */`
<bo-page title="전시관계도" desc-summary="UI · 영역 · 패널 계층 구조">
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" :columns="columns.baseSearch" :param="searchParam" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </bo-container>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 내용 ====================================================== -->
  <bo-container title="전시 계층 구조">
    <div v-if="!cfTreeData.length" style="text-align:center;color:#999;padding:30px;">
      데이터가 없습니다.
    </div>
    <div v-for="ui in cfTreeData" :key="ui?.id" style="margin-bottom:8px;border:1px solid #f0f0f0;border-radius:6px;overflow:hidden;">
      <!-- ===== ■.■.■. UI 행 ================================================ -->
      <div @click="handleSelectAction('relations-toggleNode', 'ui_'+ui.id)"
        style="display:flex;align-items:center;gap:8px;padding:5px 10px;background:#f9f9fb;user-select:none;">
        <span style="font-size:12px;color:#999;width:20px;text-align:center;">
          {{ isNodeExpanded('ui_'+ui.id) ? '▼' : '▶' }}
        </span>
        <span :style="{background: fnGetBadgeColor('ui').bg, color: fnGetBadgeColor('ui').color, fontSize:'10px', borderRadius:'6px', padding:'2px 8px', fontWeight:600}">
          UI
        </span>
        <span style="font-weight:700;color:#222;flex:1;">
          {{ ui.name }}
        </span>
        <template v-if="fnGetVisibilityBadges(ui.visibilityTargets).length">
          <span style="font-size:9px;background:#e0e0e0;color:#666;border-radius:4px;padding:2px 6px;">
            {{ fnGetVisibilityBadges(ui.visibilityTargets).join(', ') }}
          </span>
        </template>
        <span :style="{background: fnGetUseYnBadge(ui.useYn).bg, color: fnGetUseYnBadge(ui.useYn).color, fontSize:'10px', borderRadius:'6px', padding:'2px 8px', fontWeight:600}">
          {{ fnGetUseYnBadge(ui.useYn).text }}
        </span>
        <span style="font-size:10px;color:#aaa;">
          하위: {{ ui.childCount }}
        </span>
      </div>
      <!-- ===== ■.■.■. 영역들 ================================================= -->
      <div v-if="isNodeExpanded('ui_'+ui.id)" style="background:#fafafa;">
        <div v-for="area in ui.children" :key="area?.id" style="border-top:1px solid #f0f0f0;">
          <div @click="handleSelectAction('relations-toggleNode', 'area_'+area.id)"
            style="display:flex;align-items:center;gap:8px;padding:4px 12px 4px 40px;user-select:none;background:#fff;">
            <span style="font-size:12px;color:#999;width:20px;text-align:center;">
              {{ isNodeExpanded('area_'+area.id) ? '▼' : '▶' }}
            </span>
            <span :style="{background: fnGetBadgeColor('area').bg, color: fnGetBadgeColor('area').color, fontSize:'10px', borderRadius:'6px', padding:'2px 8px', fontWeight:600}">
              영역
            </span>
            <span style="font-weight:600;color:#333;flex:1;">
              {{ area.name }}
            </span>
            <template v-if="fnGetVisibilityBadges(area.visibilityTargets).length">
              <span style="font-size:9px;background:#e0e0e0;color:#666;border-radius:4px;padding:2px 6px;">
                {{ fnGetVisibilityBadges(area.visibilityTargets).join(', ') }}
              </span>
            </template>
            <span :style="{background: fnGetUseYnBadge(area.useYn).bg, color: fnGetUseYnBadge(area.useYn).color, fontSize:'10px', borderRadius:'6px', padding:'2px 8px', fontWeight:600}">
              {{ fnGetUseYnBadge(area.useYn).text }}
            </span>
            <span style="font-size:10px;color:#aaa;">
              하위: {{ area.childCount }}
            </span>
          </div>
          <!-- ===== ■.■.■.■.■. 패널들 ============================================= -->
          <div v-if="isNodeExpanded('area_'+area.id)" style="background:#fff;">
            <div v-for="panel in area.children" :key="panel?.id"
              style="display:flex;align-items:center;gap:8px;padding:3px 12px 3px 68px;border-top:1px solid #f5f5f5;font-size:11px;">
              <span :style="{background: fnGetBadgeColor('panel').bg, color: fnGetBadgeColor('panel').color, fontSize:'9px', borderRadius:'6px', padding:'2px 8px', fontWeight:600, flexShrink:0}">
                패널
              </span>
              <span style="color:#333;flex:1;">
                {{ panel.name }}
              </span>
              <template v-if="fnGetVisibilityBadges(panel.visibilityTargets).length">
                <span style="font-size:9px;background:#e0e0e0;color:#666;border-radius:4px;padding:2px 6px;">
                  {{ fnGetVisibilityBadges(panel.visibilityTargets).join(', ') }}
                </span>
              </template>
              <span v-if="panel.statusCd"
                :style="panel.statusCd==='SHOW'
                  ? {background:'#e8f5e9', color:'#2e7d32', fontSize:'10px', borderRadius:'6px', padding:'2px 8px', fontWeight:600, flexShrink:0}
                  : {background:'#f1f1f1', color:'#999', fontSize:'10px', borderRadius:'6px', padding:'2px 8px', fontWeight:600, flexShrink:0}">
                {{ panel.statusCd==='SHOW' ? '노출' : '숨김' }}
              </span>
              <span :style="{background: fnGetUseYnBadge(panel.useYn).bg, color: fnGetUseYnBadge(panel.useYn).color, fontSize:'10px', borderRadius:'6px', padding:'2px 8px', fontWeight:600, flexShrink:0}">
                {{ fnGetUseYnBadge(panel.useYn).text }}
              </span>
              <span style="font-size:10px;color:#aaa;">
                위젯: {{ panel.childCount }}
              </span>
            </div>
            <div v-if="!area.children.length" style="padding:8px 12px;color:#ccc;text-align:center;font-size:11px;">
              패널이 없습니다.
            </div>
          </div>
        </div>
        <div v-if="!ui.children.length" style="padding:8px 12px;color:#ccc;text-align:center;font-size:11px;">
          영역이 없습니다.
        </div>
      </div>
    </div>
  </bo-container>
  <!-- ===== □. 내용 ====================================================== -->
</bo-page>
`
};
