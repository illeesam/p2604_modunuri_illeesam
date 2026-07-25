/* ShopJoy Admin - 개인화 대시보드
 * 로그인 사용자 전용 대시보드(cm_dashboard, uiCompNm='MY:{authId}' 규약).
 *  - 최초 진입 시 없으면 [내 대시보드 만들기] 로 생성
 *  - 위젯 카탈로그(공용 대시보드의 패널)에서 [＋추가] 또는 캔버스로 드래그 → 내 패널로 복사
 *    (복사 패널은 optionJson._srcItemId 로 원본 데이터를 참조 — 실데이터 즉시 렌더)
 *  - 카드 헤더 드래그&드롭 배치, ◀▶▲▼ 크기 조절, ✕ 제거, [배치 저장]
 * 의존: window.cmDashWidgetUtil (CmDashboardWidgetUtil.js 선행 로드)
 */
window.CmDashboardMyMng = {
  name: 'CmDashboardMyMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, onMounted } = Vue;
    const { showToast, showConfirm } = window.boApp;
    const util = window.cmDashWidgetUtil;

    const myDash  = reactive({ dashboardId: '', dashboardNm: '', layoutCols: 4, loaded: false });
    const cards   = reactive([]);  /* 내 패널 카드 — 배열 순서 = 배치 순서 */
    const catalog = reactive([]);  /* 공용 대시보드 패널 카탈로그 */
    const uiState = reactive({ loading: false, saving: false, isPageCodeLoad: false, dirty: false, catalogOpen: false });
    const codes = reactive({});

    /* 드래그 상태 — type: 'card'(캔버스 재배치) | 'catalog'(카탈로그→캔버스 추가) */
    const dragState = reactive({ type: null, idx: null, overIdx: null, canvasOver: false });

    /* widgets[itemId] = cmDashWidgetUtil.buildWidget 결과 */
    const simState = reactive({ loading: false, widgets: {} });

    const cfSiteId = computed(() => window.boCommonFilter?.siteId || '');
    const cfAuthId = computed(() => {
      const s = window.sfGetBoAuthStore ? window.sfGetBoAuthStore() : null;
      return s && s.svAuthUser ? (s.svAuthUser.authId || '') : '';
    });
    const cfMyCompNm = computed(() => 'MY:' + cfAuthId.value);

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param) => {
      if (cmd === 'myDash-create')     return handleCreateMyDash();
      if (cmd === 'myDash-save')       return handleSaveLayout();
      if (cmd === 'myDash-reload')     return handleLoadMyDash();
      if (cmd === 'catalog-toggle')    { uiState.catalogOpen = !uiState.catalogOpen; return; }
      if (cmd === 'catalog-add')       return handleAddWidget(catalog[param]);
      if (cmd === 'card-remove')       return handleRemoveWidget(cards[param]);
      if (cmd === 'card-widthDec')     return fnAdjustSpan(param, 'panelWidth', -1);
      if (cmd === 'card-widthInc')     return fnAdjustSpan(param, 'panelWidth', 1);
      if (cmd === 'card-heightDec')    return fnAdjustSpan(param, 'panelHeight', -1);
      if (cmd === 'card-heightInc')    return fnAdjustSpan(param, 'panelHeight', 1);
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드) #################################### */

    const fnLoadCodes = () => { uiState.isPageCodeLoad = true; };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      await handleLoadMyDash();
      await handleLoadCatalog();
    });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러) #################################### */

    /* handleLoadMyDash — 내 대시보드 조회 + 패널/데이터 로드
     * 판별: ownerUserId(운영 표준) 우선, 구 규약(uiCompNm='MY:{authId}') fallback */
    const handleLoadMyDash = async () => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.cmDashboard.getList({ siteId: cfSiteId.value }, '개인화대시보드', '조회');
        const mine = (res.data?.data || []).find(d =>
          d.ownerUserId ? d.ownerUserId === cfAuthId.value : d.uiCompNm === cfMyCompNm.value) || null;
        myDash.loaded = true;
        if (!mine) { myDash.dashboardId = ''; cards.splice(0, cards.length); return; }
        myDash.dashboardId = mine.dashboardId;
        myDash.dashboardNm = mine.dashboardNm;
        myDash.layoutCols = mine.layoutCols || 4;
        await handleLoadCards();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    /* handleCreateMyDash — 내 대시보드 생성 */
    const handleCreateMyDash = async () => {
      if (!cfAuthId.value) return showToast('로그인 정보가 없습니다.', 'error');
      try {
        await boApiSvc.cmDashboard.create({
          siteId: cfSiteId.value, dashboardNm: '내 대시보드', uiCompNm: cfMyCompNm.value,
          ownerUserId: cfAuthId.value, /* 운영 표준 소유자 컬럼 (백엔드 재기동 전에는 무시됨) */
          layoutCols: 4, sortOrd: 999, useYn: 'Y', remark: '개인화 대시보드 (' + cfAuthId.value + ')',
        }, '개인화대시보드', '생성');
        showToast('내 대시보드가 생성되었습니다. 위젯을 추가해보세요.', 'success');
        await handleLoadMyDash();
        uiState.catalogOpen = true;
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '생성 오류', 'error', 0);
      }
    };

    /* handleLoadCards — 내 패널 로드 + 데이터 렌더 */
    const handleLoadCards = async () => {
      if (!myDash.dashboardId) return;
      const res = await boApiSvc.cmDashboard.getItemList(
        { siteId: cfSiteId.value, dashboardId: myDash.dashboardId }, '개인화대시보드', '패널조회');
      const list = (res.data?.data || []).filter(i => i.dashboardId === myDash.dashboardId);
      list.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
      cards.splice(0, cards.length, ...list.map(i => ({
        dashboardItemId: i.dashboardItemId, itemKey: i.itemKey, itemNm: i.itemNm,
        chartType: i.chartType || 'bar', sortOrd: i.sortOrd || 0,
        panelWidth: i.panelWidth || 1, panelHeight: i.panelHeight || 1,
        useYn: i.useYn || 'Y', realtimeYn: i.realtimeYn || 'N',
        seriesJson: i.seriesJson || null, optionJson: i.optionJson || null,
      })));
      uiState.dirty = false;
      await handleLoadWidgetData();
    };

    /* handleLoadWidgetData — 카드별 실데이터 조회(_srcItemId 우선) + 위젯 빌드 */
    const handleLoadWidgetData = async () => {
      simState.loading = true;
      try {
        await Promise.all(cards.map(async (c) => {
          if (c.realtimeYn === 'Y') { simState.widgets[c.dashboardItemId] = { kind: 'realtime' }; return; }
          let srcId = c.dashboardItemId;
          try {
            const opt = c.optionJson ? JSON.parse(c.optionJson) : null;
            if (opt && opt._srcItemId) srcId = opt._srcItemId;
          } catch (_) {}
          const res = await boApiSvc.cmDashboard.getItemDataList(
            { siteId: cfSiteId.value, dashboardItemId: srcId }, '개인화대시보드', '데이터조회');
          simState.widgets[c.dashboardItemId] = util.buildWidget(c, res.data?.data || []);
        }));
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '데이터 조회 오류', 'error', 0);
      } finally {
        simState.loading = false;
      }
    };

    /* handleLoadCatalog — 공용 대시보드 패널 카탈로그 로드 (MY: 대시보드 제외) */
    const handleLoadCatalog = async () => {
      try {
        const dres = await boApiSvc.cmDashboard.getList({ siteId: cfSiteId.value }, '개인화대시보드', '카탈로그조회');
        const pubDashes = (dres.data?.data || []).filter(d =>
          !d.ownerUserId && (d.uiCompNm || '').indexOf('MY:') !== 0);
        const dashNm = {};
        pubDashes.forEach(d => { dashNm[d.dashboardId] = d.dashboardNm; });
        const ires = await boApiSvc.cmDashboard.getItemList({ siteId: cfSiteId.value }, '개인화대시보드', '카탈로그패널조회');
        const items = (ires.data?.data || []).filter(i => dashNm[i.dashboardId]);
        items.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
        catalog.splice(0, catalog.length, ...items.map(i => ({ ...i, dashboardNm: dashNm[i.dashboardId] })));
      } catch (err) {
        console.warn('[개인화대시보드] 카탈로그 조회 오류', err);
      }
    };

    /* handleAddWidget — 카탈로그 패널을 내 대시보드에 복사 추가 (_srcItemId 참조 저장) */
    const handleAddWidget = async (src) => {
      if (!src) return;
      if (!myDash.dashboardId) return showToast('먼저 내 대시보드를 만들어주세요.', 'error');
      try {
        let optObj = {};
        try { optObj = src.optionJson ? JSON.parse(src.optionJson) : {}; } catch (_) { optObj = {}; }
        optObj._srcItemId = src.dashboardItemId;
        const maxOrd = cards.reduce((m, p) => Math.max(m, p.sortOrd || 0), 0);
        await boApiSvc.cmDashboard.itemSave('base', {
          rowStatus: 'I', siteId: cfSiteId.value, dashboardId: myDash.dashboardId,
          itemKey: src.itemKey, itemNm: src.itemNm, chartType: src.chartType,
          sortOrd: maxOrd + 10, panelWidth: src.panelWidth || 1, panelHeight: src.panelHeight || 1,
          realtimeYn: src.realtimeYn || 'N', useYn: 'Y',
          seriesJson: src.seriesJson || null, optionJson: JSON.stringify(optObj),
        }, '개인화대시보드', '위젯추가');
        showToast('[' + src.itemNm + '] 위젯이 추가되었습니다.', 'success');
        await handleLoadCards();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '위젯 추가 오류', 'error', 0);
      }
    };

    /* handleRemoveWidget — 내 패널 제거 (즉시 삭제) */
    const handleRemoveWidget = async (c) => {
      if (!c) return;
      if (!(await showConfirm('제거', '[' + c.itemNm + '] 위젯을 내 대시보드에서 제거하시겠습니까?'))) return;
      try {
        await boApiSvc.cmDashboard.itemSave('base',
          { dashboardItemId: c.dashboardItemId, rowStatus: 'D' }, '개인화대시보드', '위젯제거');
        showToast('제거되었습니다.', 'success');
        await handleLoadCards();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '제거 오류', 'error', 0);
      }
    };

    /* handleSaveLayout — 배치 저장 (순서/크기) */
    const handleSaveLayout = async () => {
      if (!myDash.dashboardId || !cards.length) return;
      uiState.saving = true;
      try {
        const rows = cards.map((c, i) => ({
          dashboardItemId: c.dashboardItemId, rowStatus: 'U',
          sortOrd: (i + 1) * 10, panelWidth: c.panelWidth, panelHeight: c.panelHeight, useYn: c.useYn,
        }));
        await boApiSvc.cmDashboard.itemSaveList('base', rows, '개인화대시보드', '배치저장');
        showToast('배치가 저장되었습니다.', 'success');
        uiState.dirty = false;
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '저장 오류', 'error', 0);
      } finally {
        uiState.saving = false;
      }
    };

    /* ── 드래그&드롭 ── */
    const onCardDragStart = (idx, e) => {
      dragState.type = 'card'; dragState.idx = idx;
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', 'card:' + idx); } catch (_) {}
    };
    const onCatalogDragStart = (idx, e) => {
      dragState.type = 'catalog'; dragState.idx = idx;
      e.dataTransfer.effectAllowed = 'copy';
      try { e.dataTransfer.setData('text/plain', 'catalog:' + idx); } catch (_) {}
    };
    const onCardDragOver = (idx) => {
      dragState.overIdx = dragState.type === 'card' && idx !== dragState.idx ? idx : null;
    };
    const onCardDrop = (idx) => {
      if (dragState.type === 'card' && dragState.idx !== null && idx !== dragState.idx) {
        const moved = cards.splice(dragState.idx, 1)[0];
        cards.splice(idx, 0, moved);
        uiState.dirty = true;
        fnDragReset();
        return;
      }
      /* 카탈로그 → 카드 위 드롭도 추가로 처리 */
      if (dragState.type === 'catalog' && dragState.idx !== null) {
        const src = catalog[dragState.idx];
        fnDragReset();
        return handleAddWidget(src);
      }
      fnDragReset();
    };
    const onCanvasDragOver = () => { dragState.canvasOver = dragState.type === 'catalog'; };
    const onCanvasDrop = () => {
      if (dragState.type === 'catalog' && dragState.idx !== null) {
        const src = catalog[dragState.idx];
        fnDragReset();
        return handleAddWidget(src);
      }
      fnDragReset();
    };
    const fnDragReset = () => { dragState.type = null; dragState.idx = null; dragState.overIdx = null; dragState.canvasOver = false; };

    /* ##### [05] 사용자 함수 (헬퍼) ############################################### */

    const fnAdjustSpan = (idx, key, delta) => {
      const c = cards[idx];
      if (!c) return;
      const max = key === 'panelWidth' ? myDash.layoutCols : 3;
      const next = Math.min(max, Math.max(1, (c[key] || 1) + delta));
      if (next !== c[key]) { c[key] = next; uiState.dirty = true; }
    };

    const fnCardStyle = (c, idx) => {
      const w = Math.min(c.panelWidth || 1, myDash.layoutCols);
      const h = c.panelHeight || 1;
      return {
        gridColumn: 'span ' + w,
        gridRow: 'span ' + h,
        minHeight: (h * 150 + (h - 1) * 12) + 'px',
        outline: dragState.overIdx === idx ? '2px dashed #e8587a' : (dragState.type === 'card' && dragState.idx === idx ? '2px solid #c7d2fe' : 'none'),
      };
    };
    const fnChartHeight = (c) => ((c.panelHeight || 1) * 150 + ((c.panelHeight || 1) - 1) * 12 - 44) + 'px';
    const fnWidget = (c) => simState.widgets[c.dashboardItemId] || null;

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      myDash, cards, catalog, uiState, codes, dragState, simState, util,
      handleBtnAction,
      onCardDragStart, onCatalogDragStart, onCardDragOver, onCardDrop, onCanvasDragOver, onCanvasDrop, fnDragReset,
      fnCardStyle, fnChartHeight, fnWidget,
    };
  },
  template: /* html */`
<bo-page title="개인화 대시보드"
  desc-summary="나만의 대시보드를 구성합니다. 위젯 카탈로그에서 추가하고, 카드를 드래그해 배치를 바꾼 뒤 저장하세요.">
  <!-- ===== ■. 미생성 상태 =================================================== -->
  <bo-container v-if="myDash.loaded ? !myDash.dashboardId : false">
    <div style="padding:56px;text-align:center;">
      <div style="font-size:40px;">👤</div>
      <div style="font-size:15px;font-weight:800;color:#444;margin-top:10px;">아직 내 대시보드가 없습니다</div>
      <div style="font-size:12px;color:#888;margin-top:6px;">대시보드를 만들고 원하는 위젯을 골라 나만의 화면을 구성해보세요.</div>
      <button class="btn btn_new" style="margin-top:16px;" @click="handleBtnAction('myDash-create')">+ 내 대시보드 만들기</button>
    </div>
  </bo-container>
  <!-- ===== ■. 내 대시보드 ================================================== -->
  <template v-if="myDash.dashboardId">
    <!-- 도구 영역 -->
    <bo-container>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 12px;">
        <span style="font-size:13px;font-weight:800;color:#444;">👤 {{ myDash.dashboardNm }}</span>
        <span style="font-size:11px;color:#999;">위젯 {{ cards.length }}개{{ simState.loading ? ' · 데이터 조회중…' : '' }}</span>
        <span style="flex:1;"></span>
        <button class="btn btn_preview" @click="handleBtnAction('catalog-toggle')">
          {{ uiState.catalogOpen ? '▲ 위젯 카탈로그 접기' : '▼ 위젯 카탈로그 (' + catalog.length + ')' }}
        </button>
        <button class="btn btn_reset" @click="handleBtnAction('myDash-reload')">↺ 되돌리기</button>
        <button class="btn btn_save" :disabled="uiState.saving" @click="handleBtnAction('myDash-save')">
          {{ uiState.dirty ? '💾 배치 저장 *' : '💾 배치 저장' }}
        </button>
      </div>
      <!-- 위젯 카탈로그 (접이식) -->
      <div v-if="uiState.catalogOpen" style="border-top:1px solid #f0f0f0;padding:10px 12px;background:#fafbfc;">
        <div style="font-size:11px;color:#888;margin-bottom:8px;">카드를 아래 캔버스로 드래그하거나 [＋]를 눌러 추가하세요.</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <div v-for="(w, idx) in catalog" :key="w.dashboardItemId"
            draggable="true" @dragstart="onCatalogDragStart(idx, $event)" @dragend="fnDragReset"
            style="display:flex;align-items:center;gap:6px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:6px 10px;cursor:grab;box-shadow:0 1px 2px rgba(0,0,0,.04);">
            <span style="font-size:14px;">{{ util.chartTypeIcon(w.chartType) }}</span>
            <span style="font-size:11.5px;font-weight:700;color:#444;">{{ w.itemNm }}</span>
            <span style="font-size:9.5px;color:#aaa;">{{ w.dashboardNm }}</span>
            <button title="내 대시보드에 추가"
              style="border:none;background:#eef2ff;color:#4338ca;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;padding:2px 7px;"
              @click="handleBtnAction('catalog-add', idx)">＋</button>
          </div>
          <div v-if="!catalog.length" style="font-size:11px;color:#aaa;padding:6px;">카탈로그에 표시할 공용 패널이 없습니다.</div>
        </div>
      </div>
    </bo-container>
    <!-- 캔버스 -->
    <bo-container title="내 대시보드 캔버스">
      <div v-if="!cards.length"
        :style="{ outline: dragState.canvasOver ? '2px dashed #e8587a' : 'none' }"
        style="padding:48px;text-align:center;color:#aaa;border-radius:8px;margin:12px;"
        @dragover.prevent="onCanvasDragOver" @drop.prevent="onCanvasDrop">
        위젯이 없습니다. 위젯 카탈로그에서 추가하거나 이 영역으로 드래그하세요.
      </div>
      <div v-else
        :style="{ display:'grid', gridTemplateColumns:'repeat(' + myDash.layoutCols + ', 1fr)', gap:'12px', padding:'12px',
          outline: dragState.canvasOver ? '2px dashed #e8587a' : 'none' }"
        @dragover.prevent="onCanvasDragOver" @drop.prevent="onCanvasDrop">
        <div v-for="(c, idx) in cards" :key="c.dashboardItemId"
          :style="fnCardStyle(c, idx)"
          style="background:#fff;border:1px solid #eee;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,.05);display:flex;flex-direction:column;overflow:hidden;"
          @dragover.prevent.stop="onCardDragOver(idx)" @drop.prevent.stop="onCardDrop(idx)">
          <div draggable="true" @dragstart="onCardDragStart(idx, $event)" @dragend="fnDragReset"
            style="flex-shrink:0;display:flex;align-items:center;gap:6px;padding:8px 10px;background:#fafbfc;border-bottom:1px solid #f0f0f0;cursor:grab;">
            <span style="color:#bbb;font-size:12px;">⠿</span>
            <span style="font-size:12px;">{{ util.chartTypeIcon(c.chartType) }}</span>
            <span style="font-size:12px;font-weight:700;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ c.itemNm }}</span>
            <span style="flex:1;"></span>
            <span style="font-size:10px;color:#aaa;font-family:monospace;">{{ c.panelWidth }}×{{ c.panelHeight }}</span>
            <button title="폭 줄이기"   style="border:none;background:none;cursor:pointer;font-size:11px;color:#888;padding:1px 3px;" @click="handleBtnAction('card-widthDec', idx)">◀</button>
            <button title="폭 늘리기"   style="border:none;background:none;cursor:pointer;font-size:11px;color:#888;padding:1px 3px;" @click="handleBtnAction('card-widthInc', idx)">▶</button>
            <button title="높이 줄이기" style="border:none;background:none;cursor:pointer;font-size:11px;color:#888;padding:1px 3px;" @click="handleBtnAction('card-heightDec', idx)">▲</button>
            <button title="높이 늘리기" style="border:none;background:none;cursor:pointer;font-size:11px;color:#888;padding:1px 3px;" @click="handleBtnAction('card-heightInc', idx)">▼</button>
            <button title="위젯 제거" style="border:none;background:none;cursor:pointer;font-size:12px;color:#dc2626;padding:1px 3px;"
              @click="handleBtnAction('card-remove', idx)">✕</button>
          </div>
          <div style="flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;">
            <template v-if="fnWidget(c)">
              <div v-if="fnWidget(c).kind === 'kpi'" style="text-align:center;">
                <div style="font-size:26px;font-weight:800;color:#333;">{{ fnWidget(c).value }}</div>
                <div style="font-size:11px;color:#888;margin-top:4px;">{{ fnWidget(c).label }}</div>
                <div v-if="fnWidget(c).delta !== null" :style="{ fontSize:'11px', marginTop:'2px', color: fnWidget(c).delta >= 0 ? '#10b981' : '#ef4444' }">
                  {{ fnWidget(c).delta >= 0 ? '▲' : '▼' }} {{ Math.abs(fnWidget(c).delta).toLocaleString() }}
                </div>
              </div>
              <div v-else-if="fnWidget(c).kind === 'realtime'" style="text-align:center;color:#aaa;font-size:11px;">
                🔴 실시간 위젯<br/>개인화 미리보기 미지원
              </div>
              <div v-else-if="fnWidget(c).kind === 'empty'" style="text-align:center;color:#ccc;font-size:11px;">데이터 없음</div>
              <co-echart v-else-if="fnWidget(c).kind === 'chart'" :option="fnWidget(c).option" :height="fnChartHeight(c)" style="width:100%;" />
            </template>
            <div v-else style="color:#ccc;font-size:11px;">…</div>
          </div>
        </div>
      </div>
    </bo-container>
  </template>
</bo-page>
`,
};
