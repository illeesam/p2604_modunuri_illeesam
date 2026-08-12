/* ShopJoy Admin - 대시보드 항목배치
 * 선택한 대시보드의 항목(cm_dashboard_item)을 CSS Grid 캔버스에 카드로 표시하고
 *  - 카드 헤더 드래그&드롭 → 배치 순서 변경 (sortOrd 재계산)
 *  - ◀▶▲▼ 버튼 → 항목 폭/높이(span) 조절, 👁 → 표시/숨김(useYn)
 *  - 조건(기간) + [시뮬레이션] → cm_dashboard_item_data 실데이터로 차트 미리보기
 *  - [저장] → item/save-list(base) 일괄 반영
 * 의존: window.cmDashWidgetUtil (CmDashboardWidgetUtil.js 선행 로드)
 */
window.CmDashboardLayoutMng = {
  name: 'CmDashboardLayoutMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
    dtlId:    { type: String,   default: null },  // 진입 시 선택할 대시보드ID
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, onMounted } = Vue;
    const { showToast, showConfirm } = window.boApp;
    const util = window.cmDashWidgetUtil;

    const dashboards = reactive([]);  /* 대시보드 select 옵션 */
    const cards      = reactive([]);  /* 캔버스 카드(항목 편집 사본) — 배열 순서 = 배치 순서 */
    const uiState = reactive({ loading: false, saving: false, dirty: false });
    const codes = reactive({});

    /* 조회/조건 상태 */
    const layout = reactive({ dashboardId: '', layoutCols: 4 });
    const cond = reactive({ dateRangeStart: '', dateRangeEnd: '' }); /* 시뮬레이션 기간 조건 (YYYY-MM-DD) */

    /* 드래그 상태 */
    const dragState = reactive({ idx: null, overIdx: null });

    /* 시뮬레이션 상태 — widgets[itemId] = buildWidget 결과 */
    const simState = reactive({ on: false, loading: false, widgets: {} });

    const cfSiteId = computed(() => window.boCommonFilter?.siteId || '');
    const cfSelectedDash = computed(() => dashboards.find(d => d.dashboardId === layout.dashboardId) || null);

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param) => {
      if (cmd === 'layout-dashChange')  return handleSelectDash(param);
      if (cmd === 'layout-colsChange')  { layout.layoutCols = Number(param) || 4; uiState.dirty = true; return; }
      if (cmd === 'layout-save')        return handleSaveLayout();
      if (cmd === 'layout-reload')      return handleLoadCards();
      if (cmd === 'sim-toggle')         return handleSimToggle();
      if (cmd === 'sim-apply')          { if (simState.on) return handleLoadSimData(); return; }
      if (cmd === 'card-widthDec')      return fnAdjustSpan(param, 'panelWidth', -1);
      if (cmd === 'card-widthInc')      return fnAdjustSpan(param, 'panelWidth', 1);
      if (cmd === 'card-heightDec')     return fnAdjustSpan(param, 'panelHeight', -1);
      if (cmd === 'card-heightInc')     return fnAdjustSpan(param, 'panelHeight', 1);
      if (cmd === 'card-toggleUse')     { const c = cards[param]; if (c) { c.useYn = c.useYn === 'Y' ? 'N' : 'Y'; uiState.dirty = true; } return; }
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드) #################################### */


    /* initPage — 화면 로드 시퀀스. 마운트 시 실행한다. */
    const initPage = async () => {
      await handleLoadDashboards();
      const first = props.dtlId && dashboards.some(d => d.dashboardId === props.dtlId)
        ? props.dtlId
        : (dashboards[0] ? dashboards[0].dashboardId : '');
      if (first) await handleSelectDash(first);
    };
    onMounted(initPage);

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러) #################################### */

    /* handleLoadDashboards — 대시보드 select 옵션 로드 */
    const handleLoadDashboards = async () => {
      try {
        const res = await boApiSvc.cmDashboard.getList({ siteId: cfSiteId.value }, '대시보드항목배치', '대시보드조회');
        const list = res.data?.data || [];
        dashboards.splice(0, dashboards.length, ...list);
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0);
      }
    };

    /* handleSelectDash — 대시보드 선택 → 항목 카드 로드 */
    const handleSelectDash = async (dashboardId) => {
      layout.dashboardId = dashboardId;
      const dash = cfSelectedDash.value;
      layout.layoutCols = (dash ? dash.layoutCols : 4) || 4;
      await handleLoadCards();
    };

    /* handleLoadCards — 선택 대시보드의 항목을 카드 사본으로 로드 (되돌리기 겸용) */
    const handleLoadCards = async () => {
      if (!layout.dashboardId) { cards.splice(0, cards.length); return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.cmDashboard.getItemList(
          { siteId: cfSiteId.value, dashboardId: layout.dashboardId }, '대시보드항목배치', '항목조회');
        const list = (res.data?.data || []).filter(i => i.dashboardId === layout.dashboardId);
        list.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
        cards.splice(0, cards.length, ...list.map(i => ({
          dashboardItemId: i.dashboardItemId, itemKey: i.itemKey, itemNm: i.itemNm,
          itemTypeCd: util.itemTypeOf(i), chartTypeCd: i.chartTypeCd || 'bar', sortOrd: i.sortOrd || 0,
          panelWidth: i.panelWidth || 1, panelHeight: i.panelHeight || 1,
          useYn: i.useYn || 'Y', realtimeYn: i.realtimeYn || 'N',
          seriesJson: i.seriesJson || null, optionJson: i.optionJson || null,
        })));
        uiState.dirty = false;
        Object.keys(simState.widgets).forEach(k => delete simState.widgets[k]);
        if (simState.on) await handleLoadSimData();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '항목 조회 오류', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    /* handleSimToggle — 시뮬레이션 on/off */
    const handleSimToggle = async () => {
      simState.on = !simState.on;
      if (simState.on) await handleLoadSimData();
    };

    /* handleLoadSimData — 항목별 실데이터 조회 + 항목 빌드 (기간 조건 클라이언트 필터) */
    const handleLoadSimData = async () => {
      simState.loading = true;
      const startYmd = (cond.dateRangeStart || '').replace(/-/g, '');
      const endYmd   = (cond.dateRangeEnd   || '').replace(/-/g, '');
      try {
        await Promise.all(cards.map(async (c) => {
          if (c.realtimeYn === 'Y') { simState.widgets[c.dashboardItemId] = { kind: 'realtime' }; return; }
          /* 개인화 복사 항목은 optionJson._srcItemId 로 원본 데이터 참조 */
          let srcId = c.dashboardItemId;
          try {
            const opt = c.optionJson ? JSON.parse(c.optionJson) : null;
            if (opt && opt._srcItemId) srcId = opt._srcItemId;
          } catch (_) {}
          /* 기간조건은 서버 필터(startYmd/endYmd) 우선 — 구버전 백엔드 대비 클라이언트 필터 병행 */
          const params = { siteId: cfSiteId.value, dashboardItemId: srcId };
          if (startYmd) params.startYmd = startYmd;
          if (endYmd)   params.endYmd = endYmd;
          if (startYmd ? !endYmd : endYmd) { /* 한쪽만 입력 시 서버필터 미적용(BETWEEN 불가) */
            delete params.startYmd; delete params.endYmd;
          }
          const res = await boApiSvc.cmDashboard.getItemDataList(params, '대시보드항목배치', '데이터조회');
          const rows = util.filterRows(res.data?.data || [], startYmd, endYmd);
          simState.widgets[c.dashboardItemId] = util.buildWidget(c, rows);
        }));
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '시뮬레이션 데이터 조회 오류', 'error', 0);
      } finally {
        simState.loading = false;
      }
    };

    /* handleSaveLayout — 배치 저장 (순서→sortOrd 재계산 + span/useYn + 열수) */
    const handleSaveLayout = async () => {
      if (!layout.dashboardId) return;
      if (!(await showConfirm('저장', '현재 배치를 저장하시겠습니까?'))) return;
      uiState.saving = true;
      try {
        const rows = cards.map((c, i) => ({
          dashboardItemId: c.dashboardItemId, rowStatus: 'U',
          sortOrd: (i + 1) * 10,
          panelWidth: c.panelWidth, panelHeight: c.panelHeight, useYn: c.useYn,
        }));
        if (rows.length) await boApiSvc.cmDashboard.itemSaveList('base', rows, '대시보드항목배치', '배치저장');
        const dash = cfSelectedDash.value;
        if (dash ? dash.layoutCols !== layout.layoutCols : false) {
          await boApiSvc.cmDashboard.update(layout.dashboardId, { layoutCols: layout.layoutCols }, '대시보드항목배치', '열수저장');
          dash.layoutCols = layout.layoutCols;
        }
        showToast('배치가 저장되었습니다.', 'success');
        await handleLoadCards();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '저장 오류', 'error', 0);
      } finally {
        uiState.saving = false;
      }
    };

    /* ── 드래그&드롭 (카드 헤더 드래그 → 카드 위 드롭 = 순서 이동) ── */
    const onCardDragStart = (idx, e) => {
      dragState.idx = idx;
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', String(idx)); } catch (_) {}
    };
    const onCardDragOver = (idx) => {
      dragState.overIdx = dragState.idx !== null && idx !== dragState.idx ? idx : null;
    };
    const onCardDrop = (idx) => {
      if (dragState.idx !== null && idx !== dragState.idx) {
        const moved = cards.splice(dragState.idx, 1)[0];
        cards.splice(idx, 0, moved);
        uiState.dirty = true;
      }
      onCardDragEnd();
    };
    const onCardDragEnd = () => { dragState.idx = null; dragState.overIdx = null; };

    /* ##### [05] 사용자 함수 (헬퍼) ############################################### */

    /* ── 우하단 모서리 드래그 리사이즈 ───────────────────────────────
       CSS grid 의 span 은 정수라 픽셀 이동량을 셀 단위로 환산해 span 을 바꾼다.
       셀 폭은 카드 실측폭에서 역산한다 — 컨테이너 폭·gap 을 따로 알 필요가 없다.
         카드폭 = w*셀폭 + (w-1)*gap  →  셀폭 = (카드폭 - (w-1)*gap) / w
       높이는 fnCardStyle 의 minHeight 규칙(행당 150 + gap 12)을 그대로 쓴다. */
    const GRID_GAP = 12;
    const ROW_H    = 150;
    const resizeState = reactive({ idx: null });
    let   _rs = null;   /* 드래그 중 임시값 (반응성 불필요) */

    /* onResizeStart — 핸들 mousedown */
    const onResizeStart = (idx, ev) => {
      const c = cards[idx];
      if (!c) return;
      ev.preventDefault();
      ev.stopPropagation();
      const card = ev.currentTarget.closest('[data-card]');
      const rect = card ? card.getBoundingClientRect() : { width: 0 };
      const w0 = Math.min(c.panelWidth || 1, layout.layoutCols);
      const cellW = w0 > 0 ? (rect.width - (w0 - 1) * GRID_GAP) / w0 : rect.width;
      _rs = { idx, x0: ev.clientX, y0: ev.clientY, w0, h0: c.panelHeight || 1, cellW };
      resizeState.idx = idx;
      window.addEventListener('mousemove', onResizeMove);
      window.addEventListener('mouseup', onResizeEnd);
      document.body.style.userSelect = 'none';   /* 드래그 중 텍스트 선택 방지 */
    };

    /* onResizeMove — 이동량을 셀 수로 환산해 span 갱신 */
    const onResizeMove = (ev) => {
      if (!_rs) return;
      const c = cards[_rs.idx];
      if (!c) return;
      const stepW = _rs.cellW + GRID_GAP;
      const stepH = ROW_H + GRID_GAP;
      const dw = stepW > 0 ? Math.round((ev.clientX - _rs.x0) / stepW) : 0;
      const dh = stepH > 0 ? Math.round((ev.clientY - _rs.y0) / stepH) : 0;
      const w = Math.min(layout.layoutCols, Math.max(1, _rs.w0 + dw));
      const h = Math.min(3, Math.max(1, _rs.h0 + dh));
      if (c.panelWidth !== w)  { c.panelWidth = w;  uiState.dirty = true; }
      if (c.panelHeight !== h) { c.panelHeight = h; uiState.dirty = true; }
    };

    /* onResizeEnd — 정리 */
    const onResizeEnd = () => {
      _rs = null;
      resizeState.idx = null;
      window.removeEventListener('mousemove', onResizeMove);
      window.removeEventListener('mouseup', onResizeEnd);
      document.body.style.userSelect = '';
    };

    /* fnAdjustSpan — 카드 폭/높이 span 조절 (폭 1~layoutCols, 높이 1~3) */
    const fnAdjustSpan = (idx, key, delta) => {
      const c = cards[idx];
      if (!c) return;
      const max = key === 'panelWidth' ? layout.layoutCols : 3;
      const next = Math.min(max, Math.max(1, (c[key] || 1) + delta));
      if (next !== c[key]) { c[key] = next; uiState.dirty = true; }
    };

    /* fnCardStyle — CSS grid 배치 스타일 */
    const fnCardStyle = (c, idx) => {
      const w = Math.min(c.panelWidth || 1, layout.layoutCols);
      const h = c.panelHeight || 1;
      return {
        gridColumn: 'span ' + w,
        gridRow: 'span ' + h,
        minHeight: (h * 150 + (h - 1) * 12) + 'px',
        opacity: c.useYn === 'Y' ? 1 : 0.45,
        outline: dragState.overIdx === idx ? '2px dashed #e8587a' : (dragState.idx === idx ? '2px solid #c7d2fe' : 'none'),
      };
    };
    const fnChartHeight = (c) => ((c.panelHeight || 1) * 150 + ((c.panelHeight || 1) - 1) * 12 - 44) + 'px';
    const fnWidget = (c) => simState.widgets[c.dashboardItemId] || null;

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      dashboards, cards, uiState, codes, layout, cond, dragState, simState,
      cfSelectedDash, util,
      handleBtnAction, onCardDragStart, onCardDragOver, onCardDrop, onCardDragEnd,
      fnCardStyle, fnChartHeight, fnWidget,
      resizeState, onResizeStart,
    };
  },
  template: /* html */`
<bo-page title="대시보드 항목배치"
  desc-summary="항목 카드를 드래그해 배치 순서를 바꾸고, 폭/높이/표시 여부를 조정합니다. 시뮬레이션으로 실데이터 미리보기를 확인한 뒤 저장하세요.">
  <!-- ===== ■. 조건/도구 영역 =============================================== -->
  <bo-container>
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 12px;">
      <span style="font-size:12px;font-weight:700;color:#555;">대시보드</span>
      <select :value="layout.dashboardId" class="form-control" style="width:auto;min-width:220px;font-size:12px;height:30px;"
        @change="handleBtnAction('layout-dashChange', $event.target.value)">
        <option v-for="d in dashboards" :key="d.dashboardId" :value="d.dashboardId">
          {{ (d.uiCompNm || '').indexOf('MY:') === 0 ? '👤 ' : '' }}{{ d.dashboardNm }} ({{ d.uiCompNm }})
        </option>
      </select>
      <span style="font-size:12px;font-weight:700;color:#555;margin-left:8px;">열수</span>
      <select :value="layout.layoutCols" class="form-control" style="width:auto;font-size:12px;height:30px;"
        @change="handleBtnAction('layout-colsChange', $event.target.value)">
        <option v-for="n in [2,3,4,5,6]" :key="n" :value="n">{{ n }}열</option>
      </select>
      <span style="font-size:12px;font-weight:700;color:#555;margin-left:8px;">기간조건</span>
      <input type="date" v-model="cond.dateRangeStart" class="form-control" style="width:135px;font-size:12px;height:30px;" />
      <span style="color:#999;">~</span>
      <input type="date" v-model="cond.dateRangeEnd" class="form-control" style="width:135px;font-size:12px;height:30px;" />
      <button class="btn btn_apply" @click="handleBtnAction('sim-apply')">조건 적용</button>
      <span style="flex:1;"></span>
      <button class="btn" :class="simState.on ? 'btn_confirm' : 'btn_preview'" @click="handleBtnAction('sim-toggle')">
        {{ simState.on ? '⏹ 시뮬레이션 끄기' : '▶ 시뮬레이션' }}
      </button>
      <button class="btn btn_reset" @click="handleBtnAction('layout-reload')">↺ 되돌리기</button>
      <button class="btn btn_save" :disabled="uiState.saving" @click="handleBtnAction('layout-save')">
        {{ uiState.dirty ? '💾 저장 *' : '💾 저장' }}
      </button>
    </div>
  </bo-container>
  <!-- ===== ■. 배치 캔버스 ================================================== -->
  <bo-container :title="'배치 캔버스' + (cfSelectedDash ? ' — ' + cfSelectedDash.dashboardNm : '')"
    :count-text="'항목 ' + cards.length + '개' + (simState.loading ? ' · 데이터 조회중…' : '')">
    <div v-if="!cards.length" style="padding:48px;text-align:center;color:#aaa;">
      {{ uiState.loading ? '불러오는 중...' : '항목이 없습니다. 대시보드 항목관리에서 항목을 등록하세요.' }}
    </div>
    <div v-else :style="{ display:'grid', gridTemplateColumns:'repeat(' + layout.layoutCols + ', 1fr)', gap:'12px', padding:'12px' }">
      <div v-for="(c, idx) in cards" :key="c.dashboardItemId" data-card
        :style="fnCardStyle(c, idx)"
        style="position:relative;background:#fff;border:1px solid #eee;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,.05);display:flex;flex-direction:column;overflow:hidden;"
        @dragover.prevent="onCardDragOver(idx)" @drop.prevent="onCardDrop(idx)">
        <!-- 카드 헤더 (드래그 핸들) -->
        <div draggable="true" @dragstart="onCardDragStart(idx, $event)" @dragend="onCardDragEnd"
          style="flex-shrink:0;display:flex;align-items:center;gap:6px;padding:8px 10px;background:#fafbfc;border-bottom:1px solid #f0f0f0;cursor:grab;">
          <span style="color:#bbb;font-size:12px;">⠿</span>
          <span style="font-size:12px;">{{ util.itemTypeIcon(util.itemTypeOf(c)) }}</span>
          <span style="font-size:12px;font-weight:700;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ c.itemNm }}</span>
          <span v-if="c.realtimeYn === 'Y'" class="badge badge-red" style="font-size:9px;">실시간</span>
          <span style="flex:1;"></span>
          <span style="font-size:10px;color:#aaa;font-family:monospace;">{{ c.panelWidth }}×{{ c.panelHeight }}</span>
          <button title="폭 줄이기"   style="border:none;background:none;cursor:pointer;font-size:11px;color:#888;padding:1px 3px;" @click="handleBtnAction('card-widthDec', idx)">◀</button>
          <button title="폭 늘리기"   style="border:none;background:none;cursor:pointer;font-size:11px;color:#888;padding:1px 3px;" @click="handleBtnAction('card-widthInc', idx)">▶</button>
          <button title="높이 줄이기" style="border:none;background:none;cursor:pointer;font-size:11px;color:#888;padding:1px 3px;" @click="handleBtnAction('card-heightDec', idx)">▲</button>
          <button title="높이 늘리기" style="border:none;background:none;cursor:pointer;font-size:11px;color:#888;padding:1px 3px;" @click="handleBtnAction('card-heightInc', idx)">▼</button>
          <button :title="c.useYn === 'Y' ? '숨기기' : '표시하기'" style="border:none;background:none;cursor:pointer;font-size:12px;padding:1px 3px;"
            @click="handleBtnAction('card-toggleUse', idx)">{{ c.useYn === 'Y' ? '👁' : '🚫' }}</button>
        </div>
        <!-- 우하단 리사이즈 핸들 (드래그로 폭/높이 조절) -->
        <div :title="'크기 조절 (' + c.panelWidth + '×' + c.panelHeight + ')'"
          @mousedown="onResizeStart(idx, $event)"
          :style="{ background: resizeState.idx === idx ? '#e8587a' : 'transparent' }"
          style="position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:nwse-resize;z-index:2;
                 border-bottom-right-radius:10px;display:flex;align-items:flex-end;justify-content:flex-end;padding:2px;">
          <span :style="{ color: resizeState.idx === idx ? '#fff' : '#c7c7c7' }"
            style="font-size:10px;line-height:1;user-select:none;">◢</span>
        </div>
        <!-- 카드 본문 -->
        <div style="flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;">
          <template v-if="simState.on">
            <template v-if="fnWidget(c)">
              <div v-if="fnWidget(c).kind === 'kpi'" style="text-align:center;">
                <div style="font-size:26px;font-weight:800;color:#333;">{{ fnWidget(c).value }}</div>
                <div style="font-size:11px;color:#888;margin-top:4px;">{{ fnWidget(c).label }}</div>
                <div v-if="fnWidget(c).delta !== null" :style="{ fontSize:'11px', marginTop:'2px', color: fnWidget(c).delta >= 0 ? '#10b981' : '#ef4444' }">
                  {{ fnWidget(c).delta >= 0 ? '▲' : '▼' }} {{ Math.abs(fnWidget(c).delta).toLocaleString() }}
                </div>
              </div>
              <div v-else-if="fnWidget(c).kind === 'realtime'" style="text-align:center;color:#aaa;font-size:11px;">
                🔴 실시간 항목<br/>시뮬레이션 미지원
              </div>
              <div v-else-if="fnWidget(c).kind === 'empty'" style="text-align:center;color:#ccc;font-size:11px;">데이터 없음</div>
              <div v-else-if="fnWidget(c).kind === 'table'"
                style="width:100%;height:100%;overflow:auto;align-self:stretch;">
                <table class="bo-table bo-table-narrow" style="font-size:11px;">
                  <thead><tr>
                    <th v-for="col in fnWidget(c).columns" :key="col.key"
                      :style="{ textAlign: col.align }" style="padding:4px 6px;">{{ col.label }}</th>
                  </tr></thead>
                  <tbody>
                    <tr v-for="(r, ri) in fnWidget(c).rows" :key="ri">
                      <td v-for="(cell, ci) in r" :key="ci"
                        :style="{ textAlign: fnWidget(c).columns[ci].align }"
                        style="padding:3px 6px;white-space:nowrap;">{{ cell }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <co-echart v-else-if="fnWidget(c).kind === 'chart'" :option="fnWidget(c).option" :height="fnChartHeight(c)" style="width:100%;" />
            </template>
            <div v-else style="color:#ccc;font-size:11px;">…</div>
          </template>
          <div v-else style="text-align:center;color:#d5d9e0;">
            <div style="font-size:30px;">{{ util.itemTypeIcon(util.itemTypeOf(c)) }}</div>
            <div style="font-size:10px;margin-top:4px;">{{ util.itemTypeLabel(util.itemTypeOf(c)) }} · {{ c.itemKey }}</div>
          </div>
        </div>
      </div>
    </div>
  </bo-container>
</bo-page>
`,
};
