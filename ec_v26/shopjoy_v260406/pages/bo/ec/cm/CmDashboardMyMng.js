/* ShopJoy Admin - 사용자 대시보드 (개인화)
 * cm_dashboard.owner_user_id = 로그인 사용자 인 대시보드를 여러 개 만들고 관리한다.
 *  - 상단 탭: 내 대시보드 목록 + [＋새 대시보드] / 나에게 공유된 대시보드 탭
 *  - 공유범위(share_scope_cd): ALL 전체 / DEPT 부서 / USER 지정사용자 / ME 나만
 *  - 위젯 카탈로그(공용 대시보드 패널)에서 [＋] 또는 캔버스로 드래그 → 내 패널로 복사
 *    (복사 패널은 optionJson._srcItemId 로 원본 데이터를 참조 — 실데이터 즉시 렌더)
 *  - 카드 헤더 드래그&드롭 배치, ◀▶▲▼ 크기 조절, ✕ 제거, [배치 저장]
 * 의존: window.cmDashWidgetUtil (CmDashboardWidgetUtil.js 선행 로드)
 */
window.CmDashboardMyMng = {
  name: 'CmDashboardMyMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
    dtlId:    { type: String,   default: null },  // 좌측메뉴에서 특정 대시보드 지정 진입
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const { showToast, showConfirm } = window.boApp;
    const util = window.cmDashWidgetUtil;

    /* 공개여부 — PUBLIC(전체공개) / PRIVATE(비공개: 소유자 + 공유대상)
     * 소유자는 항상 접근 가능하므로 '나만' 옵션은 없음(PRIVATE + 대상 0건 = 나만 보기) */
    const SHARE_SCOPES = [
      { value: 'PRIVATE', label: '비공개', icon: '🔒', desc: '나와 아래 공유대상만 볼 수 있습니다. 대상이 없으면 나만 봅니다.' },
      { value: 'PUBLIC',  label: '전체공개', icon: '🌐', desc: '모든 사용자가 볼 수 있습니다.' },
    ];
    /* 레거시 코드(ALL/DEPT/USER/ME) 호환 정규화 */
    const fnNormScope = (cd) => (cd === 'PUBLIC' || cd === 'ALL') ? 'PUBLIC' : 'PRIVATE';
    const fnScopeLabel = (cd) => fnNormScope(cd) === 'PUBLIC' ? '전체공개' : '비공개';
    const fnScopeIcon  = (cd) => fnNormScope(cd) === 'PUBLIC' ? '🌐' : '🔒';

    /* ^구분 다중값 ↔ 배열 */
    const fnSplitIds = (s) => (s || '').split('^').filter(Boolean);
    const fnJoinIds  = (arr) => arr.length ? '^' + arr.join('^') + '^' : '';

    const myDashes  = reactive([]);  /* 내가 소유한 대시보드 목록 */
    const sharedDashes = reactive([]); /* 나에게 공유된 대시보드 목록 */
    const cards     = reactive([]);  /* 현재 선택 대시보드의 패널 카드 */
    const catalog   = reactive([]);  /* 공용 대시보드 패널 카탈로그 */
    const deptList  = reactive([]);  /* 부서 목록 (DEPT 범위 선택용) */
    const userList  = reactive([]);  /* 사용자 목록 (USER 범위 선택용) */
    const uiState = reactive({
      loading: false, saving: false, isPageCodeLoad: false, dirty: false,
      catalogOpen: false, tab: 'mine', /* 'mine' | 'shared' */
      settingOpen: false,             /* 공유설정 패널 열림 */
    });
    const codes = reactive({});

    const curId = ref('');            /* 현재 선택된 대시보드ID */
    const dragState = reactive({ type: null, idx: null, overIdx: null, canvasOver: false });
    const simState  = reactive({ loading: false, widgets: {} });

    /* 공유설정 폼 — targets: [{ type:'DEPT'|'USER', id, nm }] 통합 목록 */
    const shareForm = reactive({ dashboardNm: '', shareScopeCd: 'PRIVATE', targets: [] });
    /* 공유대상 선택 모달 (기존 SimpleUserPickModal / DeptTreeModal 재사용) */
    const pickModal = reactive({ user: false, dept: false });

    const cfSiteId = computed(() => window.boCommonFilter?.siteId || '');
    const cfAuthId = computed(() => {
      const s = window.sfGetBoAuthStore ? window.sfGetBoAuthStore() : null;
      return s && s.svAuthUser ? (s.svAuthUser.authId || '') : '';
    });
    const cfCur = computed(() =>
      myDashes.find(d => d.dashboardId === curId.value)
      || sharedDashes.find(d => d.dashboardId === curId.value) || null);
    const cfIsMine   = computed(() => !!(cfCur.value && cfCur.value.ownerUserId === cfAuthId.value));
    const cfCurTabList = computed(() => uiState.tab === 'mine' ? myDashes : sharedDashes);

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param) => {
      if (cmd === 'tab-set')          { uiState.tab = param; return fnSelectFirstOfTab(); }
      if (cmd === 'dash-select')      return handleSelectDash(param);
      if (cmd === 'dash-create')      return handleCreateDash();
      if (cmd === 'dash-rename')      return handleRenameDash();
      if (cmd === 'dash-delete')      return handleDeleteDash();
      if (cmd === 'setting-toggle')   { uiState.settingOpen = !uiState.settingOpen; if (uiState.settingOpen) fnInitShareForm(); return; }
      if (cmd === 'setting-save')     return handleSaveShare();
      if (cmd === 'setting-pickUser')     { pickModal.user = true; return; }
      if (cmd === 'setting-pickDept')     { pickModal.dept = true; return; }
      if (cmd === 'setting-removeTarget') return fnRemoveTarget(param);
      if (cmd === 'layout-save')      return handleSaveLayout();
      if (cmd === 'layout-reload')    return handleLoadCards();
      if (cmd === 'catalog-toggle')   { uiState.catalogOpen = !uiState.catalogOpen; return; }
      if (cmd === 'catalog-add')      return handleAddWidget(catalog[param]);
      if (cmd === 'card-remove')      return handleRemoveWidget(cards[param]);
      if (cmd === 'card-widthDec')    return fnAdjustSpan(param, 'panelWidth', -1);
      if (cmd === 'card-widthInc')    return fnAdjustSpan(param, 'panelWidth', 1);
      if (cmd === 'card-heightDec')   return fnAdjustSpan(param, 'panelHeight', -1);
      if (cmd === 'card-heightInc')   return fnAdjustSpan(param, 'panelHeight', 1);
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    const fnLoadCodes = () => { uiState.isPageCodeLoad = true; };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      await handleLoadDashes();
      await handleLoadCatalog();
      fnLoadDeptUser();
    });

    /* 좌측메뉴에서 다른 대시보드 클릭 시 전환 */
    watch(() => props.dtlId, (v) => { if (v && v !== curId.value) handleSelectDash(v); });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러) #################################### */

    /* handleLoadDashes — 내 대시보드 + 공유받은 대시보드 로드 */
    const handleLoadDashes = async () => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.cmDashboard.getList(
          { siteId: cfSiteId.value, scope: 'accessible' }, '사용자대시보드', '조회');
        const all = (res.data?.data || []).filter(d => d.ownerUserId);
        const mine   = all.filter(d => d.ownerUserId === cfAuthId.value);
        const shared = all.filter(d => d.ownerUserId !== cfAuthId.value);
        myDashes.splice(0, myDashes.length, ...mine);
        sharedDashes.splice(0, sharedDashes.length, ...shared);

        /* 진입 시 선택 대상: props.dtlId → 기존 선택 → 첫 항목 */
        const want = props.dtlId || curId.value;
        const found = all.find(d => d.dashboardId === want);
        if (found) {
          uiState.tab = found.ownerUserId === cfAuthId.value ? 'mine' : 'shared';
          await handleSelectDash(found.dashboardId);
        } else {
          await fnSelectFirstOfTab();
        }
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    const fnSelectFirstOfTab = async () => {
      const list = cfCurTabList.value;
      if (list.length) return handleSelectDash(list[0].dashboardId);
      curId.value = '';
      cards.splice(0, cards.length);
    };

    const handleSelectDash = async (id) => {
      curId.value = id;
      uiState.settingOpen = false;
      await handleLoadCards();
    };

    /* handleCreateDash — 새 대시보드 생성 (여러 개 가능) */
    const handleCreateDash = async () => {
      if (!cfAuthId.value) return showToast('로그인 정보가 없습니다.', 'error');
      const nm = '내 대시보드 ' + (myDashes.length + 1);
      try {
        const res = await boApiSvc.cmDashboard.create({
          siteId: cfSiteId.value, dashboardNm: nm,
          uiCompNm: 'MY:' + cfAuthId.value, ownerUserId: cfAuthId.value,
          shareScopeCd: 'ME', layoutCols: 4, sortOrd: 900 + myDashes.length, useYn: 'Y',
          remark: '개인화 대시보드 (' + cfAuthId.value + ')',
        }, '사용자대시보드', '생성');
        const created = res.data?.data || {};
        showToast('[' + nm + ']이(가) 생성되었습니다. 위젯을 추가해보세요.', 'success');
        uiState.tab = 'mine';
        await handleLoadDashes();
        if (created.dashboardId) await handleSelectDash(created.dashboardId);
        uiState.catalogOpen = true;
        fnNotifyMenuChanged();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '생성 오류', 'error', 0);
      }
    };

    /* handleRenameDash — 대시보드 이름 변경(공유설정 패널의 이름 필드 저장과 동일 경로) */
    const handleRenameDash = () => { uiState.settingOpen = true; fnInitShareForm(); };

    /* handleDeleteDash — 대시보드 삭제 */
    const handleDeleteDash = async () => {
      const cur = cfCur.value;
      if (!cur || !cfIsMine.value) return;
      if (!(await showConfirm('삭제', `[${cur.dashboardNm}] 대시보드를 삭제하시겠습니까? 포함된 위젯도 함께 사라집니다.`))) return;
      try {
        await boApiSvc.cmDashboard.remove(cur.dashboardId, '사용자대시보드', '삭제');
        showToast('삭제되었습니다.', 'success');
        curId.value = '';
        await handleLoadDashes();
        fnNotifyMenuChanged();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '삭제 오류', 'error', 0);
      }
    };

    /* fnInitShareForm — 공유설정 폼 초기화 (부서/사용자를 통합 targets 로 로드) */
    const fnInitShareForm = () => {
      const cur = cfCur.value;
      if (!cur) return;
      shareForm.dashboardNm  = cur.dashboardNm || '';
      shareForm.shareScopeCd = fnNormScope(cur.shareScopeCd);
      const t = [];
      fnSplitIds(cur.shareDeptId).forEach(id => t.push({ type: 'DEPT', id, nm: fnDeptNm(id) }));
      fnSplitIds(cur.shareUserIds).forEach(id => t.push({ type: 'USER', id, nm: fnUserNm(id) }));
      shareForm.targets = t;
    };

    /* fnAddTarget — 공유대상 추가 (모달 select emit 수신) */
    const fnAddTarget = (type, id, nm) => {
      if (!id) return;
      if (shareForm.targets.some(t => t.type === type && t.id === id))
        return showToast('이미 추가된 대상입니다.', 'error');
      shareForm.targets.push({ type, id, nm: nm || (type === 'DEPT' ? fnDeptNm(id) : fnUserNm(id)) });
    };
    /* 모달 select 핸들러 */
    const onPickUser = (u) => {
      pickModal.user = false;
      if (u) fnAddTarget('USER', u.userId, u.userNm || u.name);
    };
    const onPickDept = (d) => {
      pickModal.dept = false;
      if (d && d.deptId) fnAddTarget('DEPT', d.deptId, d.deptNm);
    };
    /* fnRemoveTarget — 공유대상 제거 */
    const fnRemoveTarget = (idx) => { shareForm.targets.splice(idx, 1); };

    /* handleSaveShare — 이름 + 공개여부 + 공유대상 저장 */
    const handleSaveShare = async () => {
      const cur = cfCur.value;
      if (!cur || !cfIsMine.value) return;
      if (!shareForm.dashboardNm) return showToast('대시보드명을 입력하세요.', 'error');
      try {
        const deptIds = shareForm.targets.filter(t => t.type === 'DEPT').map(t => t.id);
        const userIds = shareForm.targets.filter(t => t.type === 'USER').map(t => t.id);
        await boApiSvc.cmDashboard.update(cur.dashboardId, {
          dashboardNm:  shareForm.dashboardNm,
          shareScopeCd: shareForm.shareScopeCd,
          shareDeptId:  fnJoinIds(deptIds),
          shareUserIds: fnJoinIds(userIds),
        }, '사용자대시보드', '공유설정저장');
        showToast('저장되었습니다.', 'success');
        uiState.settingOpen = false;
        await handleLoadDashes();
        fnNotifyMenuChanged();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '저장 오류', 'error', 0);
      }
    };

    /* handleLoadCards — 선택 대시보드의 패널 + 데이터 로드 */
    const handleLoadCards = async () => {
      if (!curId.value) { cards.splice(0, cards.length); return; }
      const res = await boApiSvc.cmDashboard.getItemList(
        { siteId: cfSiteId.value, dashboardId: curId.value }, '사용자대시보드', '패널조회');
      const list = (res.data?.data || []).filter(i => i.dashboardId === curId.value);
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
            { siteId: cfSiteId.value, dashboardItemId: srcId }, '사용자대시보드', '데이터조회');
          simState.widgets[c.dashboardItemId] = util.buildWidget(c, res.data?.data || []);
        }));
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '데이터 조회 오류', 'error', 0);
      } finally {
        simState.loading = false;
      }
    };

    /* handleLoadCatalog — 공용 대시보드 패널 카탈로그 */
    const handleLoadCatalog = async () => {
      try {
        const dres = await boApiSvc.cmDashboard.getList({ siteId: cfSiteId.value }, '사용자대시보드', '카탈로그조회');
        const pubDashes = (dres.data?.data || []).filter(d => !d.ownerUserId);
        const dashNm = {};
        pubDashes.forEach(d => { dashNm[d.dashboardId] = d.dashboardNm; });
        const ires = await boApiSvc.cmDashboard.getItemList({ siteId: cfSiteId.value }, '사용자대시보드', '카탈로그패널조회');
        const items = (ires.data?.data || []).filter(i => dashNm[i.dashboardId]);
        items.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
        catalog.splice(0, catalog.length, ...items.map(i => ({ ...i, dashboardNm: dashNm[i.dashboardId] })));
      } catch (err) {
        console.warn('[사용자대시보드] 카탈로그 조회 오류', err);
      }
    };

    /* fnLoadDeptUser — 공유 대상 선택용 부서/사용자 목록 */
    const fnLoadDeptUser = async () => {
      try {
        const dres = await boApiSvc.syDept.getList({ siteId: cfSiteId.value }, '사용자대시보드', '부서조회');
        deptList.splice(0, deptList.length, ...(dres.data?.data || []));
      } catch (e) { console.warn('[부서 조회 오류]', e); }
      try {
        const ures = await boApiSvc.syUser.getPage({ siteId: cfSiteId.value, pageNo: 1, pageSize: 200 },
          '사용자대시보드', '사용자조회');
        const d = ures.data?.data || {};
        userList.splice(0, userList.length, ...((d.pageList || []).filter(u => u.userId !== cfAuthId.value)));
      } catch (e) { console.warn('[사용자 조회 오류]', e); }
    };

    /* handleAddWidget — 카탈로그 패널을 현재 대시보드에 복사 추가 */
    const handleAddWidget = async (src) => {
      if (!src) return;
      if (!curId.value) return showToast('먼저 대시보드를 만들어주세요.', 'error');
      if (!cfIsMine.value) return showToast('공유받은 대시보드는 수정할 수 없습니다.', 'error');
      try {
        let optObj = {};
        try { optObj = src.optionJson ? JSON.parse(src.optionJson) : {}; } catch (_) { optObj = {}; }
        optObj._srcItemId = src.dashboardItemId;
        const maxOrd = cards.reduce((m, p) => Math.max(m, p.sortOrd || 0), 0);
        await boApiSvc.cmDashboard.itemSave('base', {
          rowStatus: 'I', siteId: cfSiteId.value, dashboardId: curId.value,
          itemKey: src.itemKey, itemNm: src.itemNm, chartType: src.chartType,
          sortOrd: maxOrd + 10, panelWidth: src.panelWidth || 1, panelHeight: src.panelHeight || 1,
          realtimeYn: src.realtimeYn || 'N', useYn: 'Y',
          seriesJson: src.seriesJson || null, optionJson: JSON.stringify(optObj),
        }, '사용자대시보드', '위젯추가');
        showToast('[' + src.itemNm + '] 위젯이 추가되었습니다.', 'success');
        await handleLoadCards();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '위젯 추가 오류', 'error', 0);
      }
    };

    /* handleRemoveWidget — 패널 제거 */
    const handleRemoveWidget = async (c) => {
      if (!c) return;
      if (!cfIsMine.value) return showToast('공유받은 대시보드는 수정할 수 없습니다.', 'error');
      if (!(await showConfirm('제거', '[' + c.itemNm + '] 위젯을 제거하시겠습니까?'))) return;
      try {
        await boApiSvc.cmDashboard.itemSave('base',
          { dashboardItemId: c.dashboardItemId, rowStatus: 'D' }, '사용자대시보드', '위젯제거');
        showToast('제거되었습니다.', 'success');
        await handleLoadCards();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '제거 오류', 'error', 0);
      }
    };

    /* handleSaveLayout — 배치 저장 */
    const handleSaveLayout = async () => {
      if (!curId.value || !cards.length) return;
      if (!cfIsMine.value) return showToast('공유받은 대시보드는 수정할 수 없습니다.', 'error');
      uiState.saving = true;
      try {
        const rows = cards.map((c, i) => ({
          dashboardItemId: c.dashboardItemId, rowStatus: 'U',
          sortOrd: (i + 1) * 10, panelWidth: c.panelWidth, panelHeight: c.panelHeight, useYn: c.useYn,
        }));
        await boApiSvc.cmDashboard.itemSaveList('base', rows, '사용자대시보드', '배치저장');
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
      if (!cfIsMine.value) return;
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

    /* fnNotifyMenuChanged — 좌측메뉴(사용자대시보드) 갱신 신호 */
    const fnNotifyMenuChanged = () => {
      try { window.dispatchEvent(new CustomEvent('user-dashboard-changed')); } catch (_) {}
    };

    /* 부서/사용자 ID → 이름 (미로드 시 ID 그대로) */
    const fnDeptNm = (id) => (deptList.find(d => d.deptId === id) || {}).deptNm || id;
    const fnUserNm = (id) => (userList.find(u => u.userId === id) || {}).userNm || id;
    /* 사용자 선택 모달에 넘길 제외 ID (이미 추가된 사용자 + 나 자신) */
    const cfExcludeUserIds = computed(() =>
      [cfAuthId.value, ...shareForm.targets.filter(t => t.type === 'USER').map(t => t.id)].filter(Boolean));

    const fnAdjustSpan = (idx, key, delta) => {
      if (!cfIsMine.value) return;
      const c = cards[idx];
      if (!c) return;
      const cols = (cfCur.value ? cfCur.value.layoutCols : 4) || 4;
      const max = key === 'panelWidth' ? cols : 3;
      const next = Math.min(max, Math.max(1, (c[key] || 1) + delta));
      if (next !== c[key]) { c[key] = next; uiState.dirty = true; }
    };

    const fnCardStyle = (c, idx) => {
      const cols = (cfCur.value ? cfCur.value.layoutCols : 4) || 4;
      const w = Math.min(c.panelWidth || 1, cols);
      const h = c.panelHeight || 1;
      return {
        gridColumn: 'span ' + w,
        gridRow: 'span ' + h,
        minHeight: (h * 150 + (h - 1) * 12) + 'px',
        outline: dragState.overIdx === idx ? '2px dashed #e8587a'
          : (dragState.type === 'card' && dragState.idx === idx ? '2px solid #c7d2fe' : 'none'),
      };
    };
    const fnChartHeight = (c) => ((c.panelHeight || 1) * 150 + ((c.panelHeight || 1) - 1) * 12 - 44) + 'px';
    const fnWidget = (c) => simState.widgets[c.dashboardItemId] || null;
    const fnGridCols = () => 'repeat(' + ((cfCur.value ? cfCur.value.layoutCols : 4) || 4) + ', 1fr)';

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      myDashes, sharedDashes, cards, catalog, deptList, userList,
      uiState, codes, curId, dragState, simState, shareForm, util,
      SHARE_SCOPES, fnScopeLabel, fnScopeIcon,
      pickModal, onPickUser, onPickDept, cfExcludeUserIds,
      cfCur, cfIsMine, cfCurTabList,
      handleBtnAction,
      onCardDragStart, onCatalogDragStart, onCardDragOver, onCardDrop, onCanvasDragOver, onCanvasDrop, fnDragReset,
      fnCardStyle, fnChartHeight, fnWidget, fnGridCols,
    };
  },
  template: /* html */`
<bo-page title="사용자 대시보드"
  desc-summary="나만의 대시보드를 여러 개 만들고, 공개여부(비공개·전체공개)와 공유대상(부서·사용자)을 설정할 수 있습니다.">
  <!-- ===== ■. 대시보드 탭/툴바 ============================================ -->
  <bo-container>
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:10px 12px;border-bottom:1px solid #f0f0f0;">
      <div style="display:flex;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
        <button @click="handleBtnAction('tab-set','mine')"
          :style="{ padding:'4px 12px', fontSize:'11.5px', fontWeight:700, border:'none', cursor:'pointer',
            background: uiState.tab==='mine' ? '#e8587a' : '#fafbfc', color: uiState.tab==='mine' ? '#fff' : '#666' }">
          👤 내 대시보드 ({{ myDashes.length }})</button>
        <button @click="handleBtnAction('tab-set','shared')"
          :style="{ padding:'4px 12px', fontSize:'11.5px', fontWeight:700, border:'none', cursor:'pointer',
            background: uiState.tab==='shared' ? '#e8587a' : '#fafbfc', color: uiState.tab==='shared' ? '#fff' : '#666' }">
          🔗 공유받은 대시보드 ({{ sharedDashes.length }})</button>
      </div>
      <span style="flex:1;"></span>
      <button v-if="uiState.tab==='mine'" class="btn btn_new" @click="handleBtnAction('dash-create')">+ 새 대시보드</button>
    </div>
    <!-- 대시보드 선택 칩 -->
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:10px 12px;">
      <template v-if="cfCurTabList.length">
        <button v-for="d in cfCurTabList" :key="d.dashboardId"
          @click="handleBtnAction('dash-select', d.dashboardId)"
          :style="{ padding:'5px 12px', fontSize:'11.5px', fontWeight:700, borderRadius:'14px', cursor:'pointer',
            border: curId===d.dashboardId ? '1px solid #6366f1' : '1px solid #e5e7eb',
            background: curId===d.dashboardId ? '#eef2ff' : '#fafbfc',
            color: curId===d.dashboardId ? '#4338ca' : '#666' }">
          {{ fnScopeIcon(d.shareScopeCd) }} {{ d.dashboardNm }}
        </button>
      </template>
      <span v-else style="font-size:11.5px;color:#aaa;padding:4px;">
        {{ uiState.tab==='mine' ? '만든 대시보드가 없습니다. [+ 새 대시보드]로 시작하세요.' : '나에게 공유된 대시보드가 없습니다.' }}
      </span>
    </div>
  </bo-container>

  <!-- ===== ■. 선택된 대시보드 ============================================= -->
  <template v-if="cfCur">
    <bo-container>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 12px;">
        <span style="font-size:13px;font-weight:800;color:#444;">{{ fnScopeIcon(cfCur.shareScopeCd) }} {{ cfCur.dashboardNm }}</span>
        <span style="font-size:10.5px;color:#4338ca;background:#eef2ff;padding:2px 8px;border-radius:10px;">
          {{ fnScopeLabel(cfCur.shareScopeCd) }}</span>
        <span v-if="!cfIsMine" style="font-size:10.5px;color:#b45309;background:#fffbeb;padding:2px 8px;border-radius:10px;">읽기 전용(공유받음)</span>
        <span style="font-size:11px;color:#999;">위젯 {{ cards.length }}개{{ simState.loading ? ' · 데이터 조회중…' : '' }}</span>
        <span style="flex:1;"></span>
        <template v-if="cfIsMine">
          <!-- 토글 버튼: 펼침 상태를 배경/테두리/화살표로 명확히 구분 -->
          <button class="btn" @click="handleBtnAction('setting-toggle')"
            :style="{ background: uiState.settingOpen ? '#4338ca' : '#fff',
                      color: uiState.settingOpen ? '#fff' : '#4338ca',
                      border: '1px solid #4338ca', fontWeight: 700 }">
            {{ uiState.settingOpen ? '▲' : '▼' }} ⚙ 이름·공유설정</button>
          <button class="btn" @click="handleBtnAction('catalog-toggle')"
            :style="{ background: uiState.catalogOpen ? '#0369a1' : '#fff',
                      color: uiState.catalogOpen ? '#fff' : '#0369a1',
                      border: '1px solid #0369a1', fontWeight: 700 }">
            {{ uiState.catalogOpen ? '▲' : '▼' }} 🧩 위젯 카탈로그 ({{ catalog.length }})</button>
          <button class="btn btn_reset" @click="handleBtnAction('layout-reload')">↺ 되돌리기</button>
          <button class="btn btn_save" :disabled="uiState.saving" @click="handleBtnAction('layout-save')">
            {{ uiState.dirty ? '💾 배치 저장 *' : '💾 배치 저장' }}</button>
          <button class="btn btn_delete" @click="handleBtnAction('dash-delete')">🗑 삭제</button>
        </template>
      </div>

      <!-- 이름·공유설정 (펼침 상태 강조: 좌측 컬러바 + 배경) -->
      <div v-if="uiState.settingOpen"
        style="border-top:1px solid #f0f0f0;border-left:3px solid #4338ca;padding:14px;background:#f8f9ff;">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
          <span style="font-size:11.5px;font-weight:700;color:#555;width:76px;">대시보드명</span>
          <input v-model="shareForm.dashboardNm" class="form-control" style="width:260px;font-size:12px;height:28px;" />
        </div>
        <!-- 공개여부 (private / public) -->
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
          <span style="font-size:11.5px;font-weight:700;color:#555;width:76px;">공개여부</span>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button v-for="s in SHARE_SCOPES" :key="s.value" @click="shareForm.shareScopeCd = s.value"
              :title="s.desc"
              :style="{ padding:'5px 14px', fontSize:'11.5px', fontWeight:700, borderRadius:'6px', cursor:'pointer',
                border: shareForm.shareScopeCd===s.value ? '1px solid #6366f1' : '1px solid #e5e7eb',
                background: shareForm.shareScopeCd===s.value ? '#eef2ff' : '#fff',
                color: shareForm.shareScopeCd===s.value ? '#4338ca' : '#666' }">
              {{ s.icon }} {{ s.label }}</button>
          </div>
          <span style="font-size:10.5px;color:#888;">
            {{ shareForm.shareScopeCd === 'PUBLIC'
              ? '모든 사용자가 볼 수 있습니다.'
              : (shareForm.targets.length ? '나와 아래 공유대상만 볼 수 있습니다.' : '지금은 나만 볼 수 있습니다.') }}
          </span>
        </div>
        <!-- 공유대상 (부서/사용자 통합 · 추가/제거) — PRIVATE 일 때만 -->
        <div v-if="shareForm.shareScopeCd === 'PRIVATE'" style="display:flex;align-items:flex-start;gap:8px;margin-bottom:12px;">
          <span style="font-size:11.5px;font-weight:700;color:#555;width:76px;padding-top:5px;">공유대상</span>
          <div style="flex:1;">
            <!-- 추가 버튼: 사용자 / 부서 각각 선택 모달 -->
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
              <button class="btn" style="height:28px;font-size:11.5px;font-weight:700;background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;"
                @click="handleBtnAction('setting-pickUser')">👤 사용자 추가</button>
              <button class="btn" style="height:28px;font-size:11.5px;font-weight:700;background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;"
                @click="handleBtnAction('setting-pickDept')">🏢 부서 추가</button>
              <span style="font-size:10.5px;color:#aaa;">버튼을 눌러 대상을 검색·선택하세요.</span>
            </div>
            <!-- 선택된 대상 목록 -->
            <div style="min-height:38px;border:1px solid #e5e7eb;border-radius:6px;padding:8px;background:#fff;display:flex;gap:6px;flex-wrap:wrap;">
              <span v-for="(t, idx) in shareForm.targets" :key="t.type + t.id"
                :style="{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 8px 3px 10px',
                  fontSize:'11px', borderRadius:'12px', fontWeight:700,
                  background: t.type === 'DEPT' ? '#ecfdf5' : '#eef2ff',
                  color: t.type === 'DEPT' ? '#047857' : '#4338ca',
                  border: t.type === 'DEPT' ? '1px solid #a7f3d0' : '1px solid #c7d2fe' }">
                {{ t.type === 'DEPT' ? '🏢' : '👤' }} {{ t.nm }}
                <button title="제거" style="border:none;background:none;cursor:pointer;font-size:12px;color:#dc2626;padding:0 2px;"
                  @click="handleBtnAction('setting-removeTarget', idx)">✕</button>
              </span>
              <span v-if="!shareForm.targets.length" style="font-size:11px;color:#aaa;padding:2px;">
                공유대상이 없습니다 — 나만 볼 수 있습니다.</span>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn_save" @click="handleBtnAction('setting-save')">저장</button>
          <button class="btn btn_close" @click="handleBtnAction('setting-toggle')">닫기</button>
        </div>
      </div>

      <!-- 위젯 카탈로그 (펼침 상태 강조: 좌측 컬러바 + 배경) -->
      <div v-if="uiState.catalogOpen && cfIsMine"
        style="border-top:1px solid #f0f0f0;border-left:3px solid #0369a1;padding:12px;background:#f4fafe;">
        <div style="font-size:11px;color:#888;margin-bottom:8px;">카드를 아래 캔버스로 드래그하거나 [＋]를 눌러 추가하세요.</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <div v-for="(w, idx) in catalog" :key="w.dashboardItemId"
            draggable="true" @dragstart="onCatalogDragStart(idx, $event)" @dragend="fnDragReset"
            style="display:flex;align-items:center;gap:6px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:6px 10px;cursor:grab;box-shadow:0 1px 2px rgba(0,0,0,.04);">
            <span style="font-size:14px;">{{ util.chartTypeIcon(w.chartType) }}</span>
            <span style="font-size:11.5px;font-weight:700;color:#444;">{{ w.itemNm }}</span>
            <span style="font-size:9.5px;color:#aaa;">{{ w.dashboardNm }}</span>
            <button title="이 대시보드에 추가"
              style="border:none;background:#eef2ff;color:#4338ca;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;padding:2px 7px;"
              @click="handleBtnAction('catalog-add', idx)">＋</button>
          </div>
          <div v-if="!catalog.length" style="font-size:11px;color:#aaa;padding:6px;">카탈로그에 표시할 공용 패널이 없습니다.</div>
        </div>
      </div>
    </bo-container>

    <!-- 캔버스 -->
    <bo-container title="대시보드 캔버스">
      <div v-if="!cards.length"
        :style="{ outline: dragState.canvasOver ? '2px dashed #e8587a' : 'none' }"
        style="padding:48px;text-align:center;color:#aaa;border-radius:8px;margin:12px;"
        @dragover.prevent="onCanvasDragOver" @drop.prevent="onCanvasDrop">
        위젯이 없습니다.{{ cfIsMine ? ' 위젯 카탈로그에서 추가하거나 이 영역으로 드래그하세요.' : '' }}
      </div>
      <div v-else
        :style="{ display:'grid', gridTemplateColumns: fnGridCols(), gap:'12px', padding:'12px',
          outline: dragState.canvasOver ? '2px dashed #e8587a' : 'none' }"
        @dragover.prevent="onCanvasDragOver" @drop.prevent="onCanvasDrop">
        <div v-for="(c, idx) in cards" :key="c.dashboardItemId"
          :style="fnCardStyle(c, idx)"
          style="background:#fff;border:1px solid #eee;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,.05);display:flex;flex-direction:column;overflow:hidden;"
          @dragover.prevent.stop="onCardDragOver(idx)" @drop.prevent.stop="onCardDrop(idx)">
          <div :draggable="cfIsMine" @dragstart="onCardDragStart(idx, $event)" @dragend="fnDragReset"
            :style="{ cursor: cfIsMine ? 'grab' : 'default' }"
            style="flex-shrink:0;display:flex;align-items:center;gap:6px;padding:8px 10px;background:#fafbfc;border-bottom:1px solid #f0f0f0;">
            <span v-if="cfIsMine" style="color:#bbb;font-size:12px;">⠿</span>
            <span style="font-size:12px;">{{ util.chartTypeIcon(c.chartType) }}</span>
            <span style="font-size:12px;font-weight:700;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ c.itemNm }}</span>
            <span style="flex:1;"></span>
            <span style="font-size:10px;color:#aaa;font-family:monospace;">{{ c.panelWidth }}×{{ c.panelHeight }}</span>
            <template v-if="cfIsMine">
              <button title="폭 줄이기"   style="border:none;background:none;cursor:pointer;font-size:11px;color:#888;padding:1px 3px;" @click="handleBtnAction('card-widthDec', idx)">◀</button>
              <button title="폭 늘리기"   style="border:none;background:none;cursor:pointer;font-size:11px;color:#888;padding:1px 3px;" @click="handleBtnAction('card-widthInc', idx)">▶</button>
              <button title="높이 줄이기" style="border:none;background:none;cursor:pointer;font-size:11px;color:#888;padding:1px 3px;" @click="handleBtnAction('card-heightDec', idx)">▲</button>
              <button title="높이 늘리기" style="border:none;background:none;cursor:pointer;font-size:11px;color:#888;padding:1px 3px;" @click="handleBtnAction('card-heightInc', idx)">▼</button>
              <button title="위젯 제거" style="border:none;background:none;cursor:pointer;font-size:12px;color:#dc2626;padding:1px 3px;"
                @click="handleBtnAction('card-remove', idx)">✕</button>
            </template>
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
                🔴 실시간 위젯<br/>미리보기 미지원
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

  <!-- ===== ■. 미선택/미생성 안내 ========================================== -->
  <bo-container v-else>
    <div style="padding:56px;text-align:center;">
      <div style="font-size:40px;">{{ uiState.tab==='mine' ? '👤' : '🔗' }}</div>
      <div style="font-size:15px;font-weight:800;color:#444;margin-top:10px;">
        {{ uiState.tab==='mine' ? '아직 만든 대시보드가 없습니다' : '나에게 공유된 대시보드가 없습니다' }}</div>
      <div style="font-size:12px;color:#888;margin-top:6px;">
        {{ uiState.tab==='mine' ? '대시보드를 만들고 원하는 위젯을 골라 나만의 화면을 구성해보세요.' : '다른 사용자가 공유하면 여기에 표시됩니다.' }}</div>
      <button v-if="uiState.tab==='mine'" class="btn btn_new" style="margin-top:16px;" @click="handleBtnAction('dash-create')">+ 새 대시보드 만들기</button>
    </div>
  </bo-container>

  <!-- ===== ■. 공유대상 선택 모달 (기존 공통 모달 재사용) ==================== -->
  <bo-cm-popup-modal v-if="pickModal.user" popup-code="user" title="공유할 사용자 선택" :exclude-ids="cfExcludeUserIds" @select="onPickUser" @close="pickModal.user = false" />
  <bo-cm-popup-modal v-if="pickModal.dept" popup-code="dept" clearable @select="onPickDept" @close="pickModal.dept = false" />
</bo-page>
`,
};
