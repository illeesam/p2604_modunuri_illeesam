/* ShopJoy Admin - 전시관계도 (UI > 영역 > 패널 계층 구조) */
window.DpDispRelationMng = {
  name: 'DpDispRelationMng',
  props: ['navigate', 'dispDataset', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;

    /* 검색 */
    const searchDateStart = ref('');
    const searchDateEnd = ref('');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;

    /* 트리 상태 */
    const expandedNodes = ref(new Set());
    const toggleNode = (key) => {
      if (expandedNodes.value.has(key)) expandedNodes.value.delete(key);
      else expandedNodes.value.add(key);
    };
    const isNodeExpanded = (key) => expandedNodes.value.has(key);

    /* 트리 데이터 구성 */
    const treeData = computed(() => {
      const uiCodes = (props.dispDataset.codes || [])
        .filter(c => c.codeGrp === 'DISP_UI')
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));

      const areaCodes = (props.dispDataset.codes || [])
        .filter(c => c.codeGrp === 'DISP_AREA')
        .reduce((map, a) => {
          map[a.codeValue] = a;
          return map;
        }, {});

      const panels = (props.dispDataset.displays || [])
        .reduce((map, p) => {
          if (!map[p.area]) map[p.area] = [];
          map[p.area].push(p);
          return map;
        }, {});

      return uiCodes.map(ui => ({
        type: 'ui',
        id: ui.codeId,
        code: ui.codeValue,
        name: ui.codeLabel,
        useYn: ui.useYn,
        visibilityTargets: ui.visibilityTargets || '',
        childCount: Object.keys(areaCodes).filter(a => (a || '').startsWith(ui.codeValue + '_')).length,
        children: Object.keys(areaCodes)
          .filter(a => (a || '').startsWith(ui.codeValue + '_'))
          .sort()
          .map(areaCode => {
            const area = areaCodes[areaCode];
            const areaPanels = panels[areaCode] || [];
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

    /* 공개범위 표시 */
    const getVisibilityBadges = (targets) => {
      if (!targets) return [];
      return targets.split('^').filter(Boolean);
    };

    /* 뱃지 색상 */
    const getBadgeColor = (type) => {
      const colors = {
        ui: { bg: '#e8f4f8', color: '#0277bd' },
        area: { bg: '#e8f0fe', color: '#1a73e8' },
        panel: { bg: '#fff3e0', color: '#e65100' },
      };
      return colors[type] || { bg: '#f0f0f0', color: '#666' };
    };

    /* 사용여부 배지 */
    const getUseYnBadge = (useYn) => {
      return useYn === 'Y' ? { bg: '#c8e6c9', color: '#2e7d32', text: '사용' }
                            : { bg: '#f1f1f1', color: '#666', text: '미사용' };
    };

    return {
      searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS,
      expandedNodes, toggleNode, isNodeExpanded,
      treeData, getVisibilityBadges, getBadgeColor, getUseYnBadge,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">전시관계도 <span style="font-size:13px;font-weight:400;color:#888;">UI · 영역 · 패널 계층 구조</span></div>

  <!-- 검색 -->
  <div class="card">
    <div class="search-bar">
      <span class="search-label">등록기간</span>
      <input type="date" v-model="searchDateStart" class="date-range-input" />
      <span class="date-range-sep">~</span>
      <input type="date" v-model="searchDateEnd" class="date-range-input" />
      <div class="search-actions">
        <button class="btn btn-primary" @click="">검색</button>
        <button class="btn btn-secondary btn-sm" @click="">초기화</button>
      </div>
    </div>
  </div>

  <!-- 내용 -->
  <div class="card" style="padding:12px;">
    <div v-if="!treeData.length" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</div>

    <div v-for="ui in treeData" :key="ui.id" style="margin-bottom:12px;border:1px solid #f0f0f0;border-radius:6px;overflow:hidden;">
      <!-- UI 행 -->
      <div @click="toggleNode('ui_'+ui.id)"
        style="display:flex;align-items:center;gap:8px;padding:10px;background:#f9f9fb;cursor:pointer;user-select:none;">
        <span style="font-size:12px;color:#999;width:20px;text-align:center;">{{ isNodeExpanded('ui_'+ui.id) ? '▼' : '▶' }}</span>
        <span :style="{background: getBadgeColor('ui').bg, color: getBadgeColor('ui').color, fontSize:'10px', borderRadius:'6px', padding:'2px 8px', fontWeight:600}">UI</span>
        <span style="font-weight:700;color:#222;flex:1;">{{ ui.name }}</span>
        <template v-if="getVisibilityBadges(ui.visibilityTargets).length">
          <span style="font-size:9px;background:#e0e0e0;color:#666;border-radius:4px;padding:2px 6px;">{{ getVisibilityBadges(ui.visibilityTargets).join(', ') }}</span>
        </template>
        <span :style="{background: getUseYnBadge(ui.useYn).bg, color: getUseYnBadge(ui.useYn).color, fontSize:'10px', borderRadius:'6px', padding:'2px 8px', fontWeight:600}">{{ getUseYnBadge(ui.useYn).text }}</span>
        <span style="font-size:10px;color:#aaa;">하위: {{ ui.childCount }}</span>
      </div>

      <!-- 영역들 -->
      <div v-if="isNodeExpanded('ui_'+ui.id)" style="background:#fafafa;">
        <div v-for="area in ui.children" :key="area.id" style="border-top:1px solid #f0f0f0;">
          <div @click="toggleNode('area_'+area.id)"
            style="display:flex;align-items:center;gap:8px;padding:8px 12px 8px 40px;cursor:pointer;user-select:none;background:#fff;">
            <span style="font-size:12px;color:#999;width:20px;text-align:center;">{{ isNodeExpanded('area_'+area.id) ? '▼' : '▶' }}</span>
            <span :style="{background: getBadgeColor('area').bg, color: getBadgeColor('area').color, fontSize:'10px', borderRadius:'6px', padding:'2px 8px', fontWeight:600}">영역</span>
            <span style="font-weight:600;color:#333;flex:1;">{{ area.name }}</span>
            <template v-if="getVisibilityBadges(area.visibilityTargets).length">
              <span style="font-size:9px;background:#e0e0e0;color:#666;border-radius:4px;padding:2px 6px;">{{ getVisibilityBadges(area.visibilityTargets).join(', ') }}</span>
            </template>
            <span :style="{background: getUseYnBadge(area.useYn).bg, color: getUseYnBadge(area.useYn).color, fontSize:'10px', borderRadius:'6px', padding:'2px 8px', fontWeight:600}">{{ getUseYnBadge(area.useYn).text }}</span>
            <span style="font-size:10px;color:#aaa;">하위: {{ area.childCount }}</span>
          </div>

          <!-- 패널들 -->
          <div v-if="isNodeExpanded('area_'+area.id)" style="background:#fff;">
            <div v-for="panel in area.children" :key="panel.id"
              style="display:flex;align-items:center;gap:8px;padding:6px 12px 6px 68px;border-top:1px solid #f5f5f5;font-size:11px;">
              <span :style="{background: getBadgeColor('panel').bg, color: getBadgeColor('panel').color, fontSize:'9px', borderRadius:'6px', padding:'2px 8px', fontWeight:600, flexShrink:0}">패널</span>
              <span style="color:#333;flex:1;">{{ panel.name }}</span>
              <template v-if="getVisibilityBadges(panel.visibilityTargets).length">
                <span style="font-size:9px;background:#e0e0e0;color:#666;border-radius:4px;padding:2px 6px;">{{ getVisibilityBadges(panel.visibilityTargets).join(', ') }}</span>
              </template>
              <span :style="{background: getUseYnBadge(panel.useYn).bg, color: getUseYnBadge(panel.useYn).color, fontSize:'10px', borderRadius:'6px', padding:'2px 8px', fontWeight:600, flexShrink:0}">{{ getUseYnBadge(panel.useYn).text }}</span>
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
