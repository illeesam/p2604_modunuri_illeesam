/* ShopJoy Admin - 사용자 대시보드 (개인화)
 * cm_dashboard.owner_user_id = 로그인 사용자 인 대시보드를 여러 개 만들고 관리한다.
 *  - 상단 탭: 내 대시보드 목록 + [＋새 대시보드] / 나에게 공유된 대시보드 탭
 *  - 공유범위(share_scope_cd): ALL 전체 / DEPT 부서 / USER 지정사용자 / ME 나만
 *  - 항목 카탈로그(공용 대시보드 항목)에서 [＋] 또는 캔버스로 드래그 → 내 항목으로 복사
 *    (복사 항목은 optionJson._srcItemId 로 원본 데이터를 참조 — 실데이터 즉시 렌더)
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
    const cards     = reactive([]);  /* 현재 선택 대시보드의 항목 카드 */
    const catalog   = reactive([]);  /* 공용 대시보드 항목 카탈로그 */
    const deptList  = reactive([]);  /* 부서 목록 (DEPT 범위 선택용) */
    const userList  = reactive([]);  /* 사용자 목록 (USER 범위 선택용) */
    const uiState = reactive({
      loading: false,
      settingOpen: true,             /* 이름·공유설정 패널 (기본 열림) */ saving: false, dirty: false,
      catalogOpen: true, tab: 'mine', /* 'mine' | 'shared' */
    });
    const codes = reactive({});

    const curId = ref('');            /* 현재 선택된 대시보드ID */
    const dragState = reactive({ type: null, idx: null, overIdx: null, canvasOver: false });
    const simState  = reactive({ loading: false, widgets: {} });

    /* 공유설정 폼 — targets: [{ type:'DEPT'|'USER', id, nm }] 통합 목록 */
    const shareForm = reactive({ dashboardNm: '', shareScopeCd: 'PRIVATE', targets: [] });
    /* 공유대상 선택 모달 (기존 SimpleUserPickModal / DeptTreeModal 재사용) */
    const pickModal = reactive({ user: false, dept: false, vendor: false });

    const cfSiteId = computed(() => window.boCommonFilter?.siteId || '');
    const cfAuthId = computed(() => {
      const s = window.sfGetBoAuthStore ? window.sfGetBoAuthStore() : null;
      return s && s.svAuthUser ? (s.svAuthUser.authId || '') : '';
    });
    const cfCur = computed(() =>
      myDashes.find(d => d.dashboardId === curId.value)
      || sharedDashes.find(d => d.dashboardId === curId.value) || null);
    const cfIsMine   = computed(() => !!(cfCur.value && cfCur.value.ownerUserId === cfAuthId.value));
    /* 좌측메뉴 대시보드 항목을 클릭해 진입하면(dtlId 있음) 보기 전용 — 제목 + 캔버스만 보여준다.
       '내 대시보드 관리' 메뉴로 들어오면 dtlId 가 없어 관리 모드가 된다. */
    const cfViewMode = computed(() => !!props.dtlId);
    /* 편집 가능 = 내 것이면서 관리 모드일 때만 */
    const cfCanEdit  = computed(() => cfIsMine.value && !cfViewMode.value);
    const cfCurTabList = computed(() => uiState.tab === 'mine' ? myDashes : sharedDashes);


    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param) => {
      if (cmd === 'tab-set')          { uiState.tab = param; return fnSelectFirstOfTab(); }
      if (cmd === 'dash-select')      return handleSelectDash(param);
      if (cmd === 'dash-create')      return handleCreateDash();
      if (cmd === 'dash-rename')      return handleRenameDash();
      if (cmd === 'dash-delete')      return handleDeleteDash();
      if (cmd === 'setting-toggle')   { uiState.settingOpen = !uiState.settingOpen; return; }
      if (cmd === 'setting-reset')    { fnInitShareForm(); return showToast('저장 전 값으로 되돌렸습니다.', 'success'); }
      if (cmd === 'setting-save')     return handleSaveShare();
      if (cmd === 'setting-pickUser')     { pickModal.user = true; return; }
      if (cmd === 'setting-pickDept')     { pickModal.dept = true; return; }
      if (cmd === 'setting-pickVendor')   { pickModal.vendor = true; return; }
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


    /* initPage — 화면 로드 시퀀스. 마운트 시 실행한다. */
    const initPage = async () => {
      await handleLoadDashes();
      await handleLoadCatalog();
      fnLoadDeptUser();
      fnFitSoon();
      window.addEventListener('resize', fnFitCanvas);
    };
    onMounted(initPage);
    Vue.onUnmounted(() => window.removeEventListener('resize', fnFitCanvas));

    /* 좌측메뉴에서 다른 대시보드 클릭 시 전환.
       목록을 다시 읽는다 — 공용 대시보드는 "지금 지정된 dtlId 한 건" 만 목록에 통과시키므로
       (handleLoadDashes 필터 참조) 목록을 그대로 두면 새 dtlId 를 찾지 못해 빈 화면이 된다. */
    watch(() => props.dtlId, (v) => { if (v && v !== curId.value) handleLoadDashes(); });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러) #################################### */

    /* handleLoadDashes — 내 대시보드 + 공유받은 대시보드 로드 */
    const handleLoadDashes = async () => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.cmDashboard.getList(
          { siteId: cfSiteId.value, scope: 'accessible' }, '사용자대시보드', '조회');
        /* 개인 대시보드만 관리 대상이다. 다만 좌측 '대시보드' 그룹에서 전용 화면이 없는
           공용 대시보드를 클릭하면 이 화면이 뷰어 역할을 하므로, 그 한 건은 통과시킨다
           (소유자가 아니므로 cfIsMine=false → 보기 전용). */
        const all = (res.data?.data || [])
          .filter(d => d.ownerUserId || (props.dtlId && d.dashboardId === props.dtlId));
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
      fnInitShareForm();   /* 설정 패널이 항상 열려 있으므로 전환 즉시 폼을 새 대시보드로 */
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
        showToast('[' + nm + ']이(가) 생성되었습니다. 항목을 추가해보세요.', 'success');
        uiState.tab = 'mine';
        await handleLoadDashes();
        if (created.dashboardId) await handleSelectDash(created.dashboardId);
        uiState.catalogOpen = true;
        fnNotifyMenuChanged();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '생성 오류', 'error', 0);
      }
    };

    /* handleRenameDash — 대시보드 이름 변경(공유설정 항목의 이름 필드 저장과 동일 경로) */
    const handleRenameDash = () => { uiState.settingOpen = true; fnInitShareForm(); };

    /* handleDeleteDash — 대시보드 삭제 */
    const handleDeleteDash = async () => {
      const cur = cfCur.value;
      if (!cur || !cfIsMine.value) return;
      if (!(await showConfirm('삭제', `[${cur.dashboardNm}] 대시보드를 삭제하시겠습니까? 포함된 항목도 함께 사라집니다.`))) return;
      try {
        await boApiSvc.cmDashboard.remove(cur.dashboardId, '사용자대시보드', '삭제');
        showToast('삭제되었습니다.', 'success');
        curId.value = '';
        await handleLoadDashes();
        fnInitShareForm();   /* 저장된 값으로 폼 갱신 */
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
      fnSplitIds(cur.shareVendorIds).forEach(id => t.push({ type: 'VENDOR', id, nm: fnVendorNm(id) }));
      shareForm.targets = t;
    };

    /* fnAddTarget — 공유대상 추가 (모달 select emit 수신) */
    const fnAddTarget = (type, id, nm) => {
      if (!id) return;
      if (shareForm.targets.some(t => t.type === type && t.id === id)) return;   /* 이미 담긴 대상은 조용히 건너뜀 */
      shareForm.targets.push({ type, id, nm: nm || (type === 'DEPT' ? fnDeptNm(id) : fnUserNm(id)) });
    };
    /* 모달 select 핸들러 — 기존 선택을 프리체크해서 열므로 결과가 "최종 전체 집합" 이다.
       따라서 추가가 아니라 해당 유형 전체를 교체한다(모달에서 해제한 대상은 빠진다). */
    const onPickUser = (rows) => { pickModal.user = false; fnReplaceTargets('USER', rows); };
    const onPickDept = (rows) => { pickModal.dept = false; fnReplaceTargets('DEPT', rows); };
    const onPickVendor = (rows) => { pickModal.vendor = false; fnReplaceTargets('VENDOR', rows); };
    /* fnReplaceTargets — 해당 유형 대상을 모달 결과로 통째 교체 (다른 유형은 유지) */
    const fnReplaceTargets = (type, rows) => {
      const keep = shareForm.targets.filter(t => t.type !== type);
      const next = fnToRows(rows).map(r => ({
        type,
        id: (type === 'DEPT' ? r.deptId : (type === 'VENDOR' ? r.vendorId : r.userId)) || r.id,
        nm: (type === 'DEPT' ? (r.deptNm || r.nm) : (type === 'VENDOR' ? (r.vendorNm || r.nm) : (r.userNm || r.nm))),
      })).filter(t => t.id);
      if (type === 'VENDOR') next.forEach(t => { if (t.nm) vendorNmCache[t.id] = t.nm; });
      shareForm.targets = keep.concat(next);
    };
    /* fnToRows — select 결과를 행 배열로 정규화 */
    const fnToRows = (v) => (v == null ? [] : (Array.isArray(v) ? v : [v]));
    /* fnRemoveTarget — 공유대상 제거 */
    const fnRemoveTarget = (t) => {
      const i = shareForm.targets.findIndex(x => x.type === t.type && x.id === t.id);
      if (i >= 0) shareForm.targets.splice(i, 1);
    };
    /* 유형별 공유대상 — 사용자란/부서란을 따로 보여주기 위해 분리 */
    const cfUserTargets = computed(() => shareForm.targets.filter(t => t.type === 'USER'));
    const cfDeptTargets = computed(() => shareForm.targets.filter(t => t.type === 'DEPT'));
    const cfVendorTargets = computed(() => shareForm.targets.filter(t => t.type === 'VENDOR'));
    /* 한 줄에 표시할 최대 칩 수 — 넘치면 ＋N 으로 접는다 */
    const SHARE_CHIP_MAX = 5;
    /* 공유대상 란 정의 — 사용자/부서를 같은 마크업으로 렌더 (동작 공통) */
    /* fnChipView — 한 줄 표시분(shown) + 접힌 개수(moreCnt) + 접힌 이름들(툴팁용) */
    const fnChipView = (rows) => ({
      rows,
      shown: rows.slice(0, SHARE_CHIP_MAX),
      moreCnt: Math.max(0, rows.length - SHARE_CHIP_MAX),
      moreNms: rows.slice(SHARE_CHIP_MAX).map(t => t.nm).join(', '),
    });
    const cfShareGroups = computed(() => [
      { type: 'USER', label: '공유대상(사용자)', btn: '사용자 추가', icon: '👤', cmd: 'setting-pickUser',
        bg: '#eef2ff', fg: '#4338ca', bd: '#c7d2fe', ...fnChipView(cfUserTargets.value),
        empty: '공유할 사용자가 없습니다.' },
      { type: 'DEPT', label: '공유대상(부서)', btn: '부서 추가', icon: '🏢', cmd: 'setting-pickDept',
        bg: '#ecfdf5', fg: '#047857', bd: '#a7f3d0', ...fnChipView(cfDeptTargets.value),
        empty: '공유할 부서가 없습니다.' },
      { type: 'VENDOR', label: '공유대상(업체)', btn: '업체 추가', icon: '🏭', cmd: 'setting-pickVendor',
        bg: '#fff7ed', fg: '#c2410c', bd: '#fed7aa', ...fnChipView(cfVendorTargets.value),
        empty: '공유할 업체가 없습니다.' },
    ]);

    /* handleSaveShare — 이름 + 공개여부 + 공유대상 저장 */
    const handleSaveShare = async () => {
      const cur = cfCur.value;
      if (!cur || !cfIsMine.value) return;
      if (!shareForm.dashboardNm) return showToast('대시보드명을 입력하세요.', 'error');
      if (!(await showConfirm('저장', '공유 설정을 저장하시겠습니까?'))) return;
      try {
        const deptIds = shareForm.targets.filter(t => t.type === 'DEPT').map(t => t.id);
        const userIds = shareForm.targets.filter(t => t.type === 'USER').map(t => t.id);
        const vendorIds = shareForm.targets.filter(t => t.type === 'VENDOR').map(t => t.id);
        await boApiSvc.cmDashboard.update(cur.dashboardId, {
          dashboardNm:  shareForm.dashboardNm,
          shareScopeCd: shareForm.shareScopeCd,
          shareDeptId:  fnJoinIds(deptIds),
          shareUserIds: fnJoinIds(userIds),
          shareVendorIds: fnJoinIds(vendorIds),
        }, '사용자대시보드', '공유설정저장');
        showToast('저장되었습니다.', 'success');
        await handleLoadDashes();
        fnNotifyMenuChanged();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '저장 오류', 'error', 0);
      }
    };


    /* handleLoadCards — 선택 대시보드의 항목 + 데이터 로드 */
    const handleLoadCards = async () => {
      if (!curId.value) { cards.splice(0, cards.length); return; }
      const res = await boApiSvc.cmDashboard.getItemList(
        { siteId: cfSiteId.value, dashboardId: curId.value }, '사용자대시보드', '항목조회');
      const list = (res.data?.data || []).filter(i => i.dashboardId === curId.value);
      list.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
      cards.splice(0, cards.length, ...list.map(i => ({
        dashboardItemId: i.dashboardItemId, itemKey: i.itemKey, itemNm: i.itemNm,
        itemTypeCd: util.itemTypeOf(i), chartTypeCd: i.chartTypeCd || 'bar', sortOrd: i.sortOrd || 0,
        panelWidth: i.panelWidth || 1, panelHeight: i.panelHeight || 1,
        useYn: i.useYn || 'Y', realtimeYn: i.realtimeYn || 'N',
        series: i.series || [], optionJson: i.optionJson || null,
      })));
      uiState.dirty = false;
      await handleLoadWidgetData();
    };

    /* handleLoadWidgetData — 카드별 실데이터 조회(_srcItemId 우선) + 항목 빌드 */
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

    /* handleLoadCatalog — 공용 대시보드 항목 카탈로그 */
    const handleLoadCatalog = async () => {
      try {
        const dres = await boApiSvc.cmDashboard.getList({ siteId: cfSiteId.value }, '사용자대시보드', '카탈로그조회');
        const pubDashes = (dres.data?.data || []).filter(d => !d.ownerUserId);
        const dashNm = {};
        pubDashes.forEach(d => { dashNm[d.dashboardId] = d.dashboardNm; });
        const ires = await boApiSvc.cmDashboard.getItemList({ siteId: cfSiteId.value }, '사용자대시보드', '카탈로그항목조회');
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
        const ures = await boApiSvc.syUser.getPage({ siteId: cfSiteId.value, pageNo: 1, pageSize: 1000 },
          '사용자대시보드', '사용자조회');
        const d = ures.data?.data || {};
        userList.splice(0, userList.length, ...((d.pageList || []).filter(u => u.userId !== cfAuthId.value)));
      } catch (e) { console.warn('[사용자 조회 오류]', e); }
    };

    /* fnUniqueItemKey 는 제거(2026-08-21) — item_key 가 전역 UNIQUE 조립코드가 되면서
       채번 책임이 서버(chart### 일련번호)로 넘어갔다. 화면이 키를 만들지 않는다. */

    /* handleAddWidget — 카탈로그 항목을 현재 대시보드에 복사 추가 (같은 항목 여러 번 가능) */
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
          /* 레벨은 chart 고정, 위젯유형은 widgetTypeCd 로 분리됐다 (2026-08-21).
             itemKey 는 비워 보내면 서버가 chart### 로 채번한다(전역 UNIQUE). */
          itemKey: null, itemNm: src.itemNm,
          itemTypeCd: 'chart',
          widgetTypeCd: util.itemTypeOf(src),
          axisTypeCd: src.axisTypeCd || 'CATEGORY',
          chartTypeCd: src.chartTypeCd,
          sortOrd: maxOrd + 10, panelWidth: src.panelWidth || 1, panelHeight: src.panelHeight || 1,
          realtimeYn: src.realtimeYn || 'N', useYn: 'Y',
          optionJson: JSON.stringify(optObj),
        }, '사용자대시보드', '항목추가');
        showToast('[' + src.itemNm + '] 항목이 추가되었습니다.', 'success');
        await handleLoadCards();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '항목 추가 오류', 'error', 0);
      }
    };

    /* handleRemoveWidget — 항목 제거 */
    const handleRemoveWidget = async (c) => {
      if (!c) return;
      if (!cfIsMine.value) return showToast('공유받은 대시보드는 수정할 수 없습니다.', 'error');
      if (!(await showConfirm('제거', '[' + c.itemNm + '] 항목을 제거하시겠습니까?'))) return;
      try {
        await boApiSvc.cmDashboard.itemSave('base',
          { dashboardItemId: c.dashboardItemId, rowStatus: 'D' }, '사용자대시보드', '항목제거');
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
    /* 업체명 — 모달 선택 시 받은 이름을 캐시에 넣어두고 재사용 (업체 목록을 따로 안 받는다) */
    const vendorNmCache = reactive({});
    const fnVendorNm = (id) => vendorNmCache[id] || id;
    /* 선택 모달에 미리 체크해 둘 ID — 이미 담긴 대상이 팝업에서 체크 상태로 보인다 */
    const cfPickedUserIds = computed(() =>
      shareForm.targets.filter(t => t.type === 'USER').map(t => t.id).filter(Boolean));
    const cfPickedDeptIds = computed(() =>
      shareForm.targets.filter(t => t.type === 'DEPT').map(t => t.id).filter(Boolean));
    const cfPickedVendorIds = computed(() =>
      shareForm.targets.filter(t => t.type === 'VENDOR').map(t => t.id).filter(Boolean));
    /* 사용자 모달에서 나 자신은 제외 (소유자는 항상 볼 수 있으므로 고를 이유가 없다) */
    const cfExcludeUserIds = computed(() => [cfAuthId.value].filter(Boolean));

    /* ── 우하단 모서리 드래그 리사이즈 ───────────────────────────────
       CSS grid 의 span 은 정수라 픽셀 이동량을 셀 단위로 환산해 span 을 바꾼다.
       셀 폭은 카드 실측폭에서 역산한다 — 컨테이너 폭·gap 을 따로 알 필요가 없다.
         카드폭 = w*셀폭 + (w-1)*gap  →  셀폭 = (카드폭 - (w-1)*gap) / w
       (대시보드 항목배치 화면과 동일 규칙) */
    const GRID_GAP = 12;
    const ROW_H    = 150;
    const KPI_ROW_H = 56;   /* KPI 카드는 내용이 얇아 일반 행 단위(150) 대신 축소 단위 사용 */
    const resizeState = reactive({ idx: null });
    let   _rs = null;   /* 드래그 중 임시값 (반응성 불필요) */

    /* fnIsKpi — KPI 카드는 본문이 스스로 아이콘+라벨+값을 보여주므로 헤더 제목이 중복된다.
       (헤더 숨김/축소 행높이 판단에 함께 쓴다) */
    const fnIsKpi = (c) => { const w = fnWidget(c); return !!(w ? (w.kind === 'kpi') : false); };
    const fnRowH  = (c) => (fnIsKpi(c) ? KPI_ROW_H : ROW_H);
    /* fnShowHead — KPI 카드는 보기모드에서 헤더를 통째로 감춘다.
       편집모드에서는 드래그/크기조절/제거 컨트롤이 필요하므로 헤더는 남기되 제목만 뺀다. */
    const fnShowHead = (c) => (fnIsKpi(c) ? cfCanEdit.value : true);

    const onResizeStart = (idx, ev) => {
      if (!cfCanEdit.value) return;   /* 보기 모드·공유받은 대시보드는 크기 조절 불가 */
      const c = cards[idx];
      if (!c) return;
      ev.preventDefault();
      ev.stopPropagation();
      const card = ev.currentTarget.closest('[data-card]');
      const rect = card ? card.getBoundingClientRect() : { width: 0 };
      const cols = (cfCur.value ? cfCur.value.layoutCols : 4) || 4;
      const w0 = Math.min(c.panelWidth || 1, cols);
      const cellW = w0 > 0 ? (rect.width - (w0 - 1) * GRID_GAP) / w0 : rect.width;
      _rs = { idx, x0: ev.clientX, y0: ev.clientY, w0, h0: c.panelHeight || 1, cellW, cols, rowH: fnRowH(c) };
      resizeState.idx = idx;
      window.addEventListener('mousemove', onResizeMove);
      window.addEventListener('mouseup', onResizeEnd);
      document.body.style.userSelect = 'none';
    };

    const onResizeMove = (ev) => {
      if (!_rs) return;
      const c = cards[_rs.idx];
      if (!c) return;
      const stepW = _rs.cellW + GRID_GAP;
      const stepH = _rs.rowH + GRID_GAP;
      const dw = stepW > 0 ? Math.round((ev.clientX - _rs.x0) / stepW) : 0;
      const dh = stepH > 0 ? Math.round((ev.clientY - _rs.y0) / stepH) : 0;
      const w = Math.min(_rs.cols, Math.max(1, _rs.w0 + dw));
      const h = Math.min(3, Math.max(1, _rs.h0 + dh));
      if (c.panelWidth !== w)  { c.panelWidth = w;  uiState.dirty = true; }
      if (c.panelHeight !== h) { c.panelHeight = h; uiState.dirty = true; }
    };

    const onResizeEnd = () => {
      _rs = null;
      resizeState.idx = null;
      window.removeEventListener('mousemove', onResizeMove);
      window.removeEventListener('mouseup', onResizeEnd);
      document.body.style.userSelect = '';
    };

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
      const rowH = fnRowH(c);
      return {
        gridColumn: 'span ' + w,
        gridRow: 'span ' + h,
        minHeight: (h * rowH + (h - 1) * 12) + 'px',
        outline: dragState.overIdx === idx ? '2px dashed #e8587a'
          : (dragState.type === 'card' && dragState.idx === idx ? '2px solid #c7d2fe' : 'none'),
      };
    };
    const fnChartHeight = (c) => ((c.panelHeight || 1) * 150 + ((c.panelHeight || 1) - 1) * 12 - 44) + 'px';
    const fnWidget = (c) => simState.widgets[c.dashboardItemId] || null;
    const fnGridCols = () => 'repeat(' + ((cfCur.value ? cfCur.value.layoutCols : 4) || 4) + ', 1fr)';

    /* ── 캔버스 높이 맞춤 ─────────────────────────────────────────
       설정 패널을 접거나 펼치면 캔버스 시작 위치가 달라져 고정 높이로는 아래가 비거나 잘린다.
       실제 위치를 재서 화면 아래 끝까지 채운다. */
    const canvasRef = ref(null);
    const canvasH   = ref(640);
    const CANVAS_MIN = 360;
    const fnFitCanvas = () => {
      const el = canvasRef.value;
      if (!el) return;
      /* .bo-main 이 고정 높이 스크롤 컨테이너라 그 하단을 기준으로 재면 스크롤 위치와 무관하다 */
      const sc  = el.closest('.bo-main');
      const end = sc ? sc.getBoundingClientRect().bottom : window.innerHeight;
      const top = el.getBoundingClientRect().top;
      canvasH.value = Math.max(CANVAS_MIN, Math.round(end - top - 16));
    };
    /* 상세 응답이 늦게 도착해 설정 패널이 뒤늦게 그려지면 nextTick 시점의 높이가 틀린다.
       한 박자 뒤에 한 번 더 잰다. */
    const fnFitSoon = () => { Vue.nextTick(fnFitCanvas); setTimeout(fnFitCanvas, 300); };
    /* 레이아웃이 바뀌는 시점마다 다시 잰다 */
    watch(() => [uiState.settingOpen, uiState.tab, curId.value, cards.length, props.dtlId], fnFitSoon);

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      myDashes, sharedDashes, cards, catalog, deptList, userList,
      uiState, codes, curId, dragState, simState, shareForm, util,
      SHARE_SCOPES, fnScopeLabel, fnScopeIcon,
      pickModal, onPickUser, onPickDept, onPickVendor,
      cfExcludeUserIds, cfPickedUserIds, cfPickedDeptIds, cfPickedVendorIds,
      cfUserTargets, cfDeptTargets, cfVendorTargets, cfShareGroups,
      cfCur, cfIsMine, cfCurTabList, cfAuthId, cfViewMode, cfCanEdit,
      canvasRef, canvasH,
      handleBtnAction,
      onCardDragStart, onCatalogDragStart, onCardDragOver, onCardDrop, onCanvasDragOver, onCanvasDrop, fnDragReset,
      fnCardStyle, fnChartHeight, fnWidget, fnGridCols, fnIsKpi, fnShowHead,
      resizeState, onResizeStart,
    };
  },
  template: /* html */`
<bo-page :title="cfViewMode ? ((cfCur ? cfCur.dashboardNm : '대시보드')) : '사용자 대시보드'"
  :desc-summary="cfViewMode ? '' : '나만의 대시보드를 여러 개 만들고, 공개여부(비공개·전체공개)와 공유대상(사용자·부서·업체)을 설정할 수 있습니다.'">
  <!-- ===== ■. 대시보드 탭/툴바 (보기 모드에서는 숨김) ====================== -->
  <bo-container v-if="!cfViewMode">
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
    <bo-container v-if="!cfViewMode">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 12px;">
        <span style="font-size:13px;font-weight:800;color:#444;">{{ fnScopeIcon(cfCur.shareScopeCd) }} {{ cfCur.dashboardNm }}</span>
        <span style="font-size:10.5px;color:#4338ca;background:#eef2ff;padding:2px 8px;border-radius:10px;">
          {{ fnScopeLabel(cfCur.shareScopeCd) }}</span>
        <span v-if="!cfIsMine" style="font-size:10.5px;color:#b45309;background:#fffbeb;padding:2px 8px;border-radius:10px;">읽기 전용(공유받음)</span>
        <span style="font-size:11px;color:#999;">항목 {{ cards.length }}개{{ simState.loading ? ' · 데이터 조회중…' : '' }}</span>
        <span style="flex:1;"></span>
        <template v-if="cfCanEdit">
          <!-- 이름·공유설정 토글 (기본 열림) -->
          <button class="btn" @click="handleBtnAction('setting-toggle')"
            :style="{ background: uiState.settingOpen ? '#4338ca' : '#fff',
                      color: uiState.settingOpen ? '#fff' : '#4338ca',
                      border: '1px solid #4338ca', fontWeight: 700 }">
            {{ uiState.settingOpen ? '▲' : '▼' }} ⚙ 이름·공유설정</button>
          <button class="btn btn_reset" @click="handleBtnAction('layout-reload')">↺ 되돌리기</button>
          <button class="btn btn_save" :disabled="uiState.saving" @click="handleBtnAction('layout-save')">
            {{ uiState.dirty ? '💾 배치 저장 *' : '💾 배치 저장' }}</button>
          <button class="btn btn_delete" @click="handleBtnAction('dash-delete')">🗑 삭제</button>
        </template>
      </div>

      <!-- 이름·공유설정 (펼침 상태 강조: 좌측 컬러바 + 배경) -->
      <div v-if="cfCanEdit && uiState.settingOpen"
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
        <!-- 공유대상 — 사용자란 / 부서란 분리. 버튼 우측에 선택칩을 한 줄로 두고 넘치면 +N (PRIVATE 일 때만) -->
        <template v-if="shareForm.shareScopeCd === 'PRIVATE'">
          <div v-for="g in cfShareGroups" :key="g.type"
            style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-size:11.5px;font-weight:700;color:#555;width:96px;flex-shrink:0;">{{ g.label }}</span>
            <button class="btn" style="height:28px;font-size:11.5px;font-weight:700;flex-shrink:0;"
              :style="{ background: g.bg, color: g.fg, border: '1px solid ' + g.bd }"
              @click="handleBtnAction(g.cmd)">{{ g.icon }} {{ g.btn }}</button>
            <span style="font-size:10.5px;color:#4338ca;background:#eef2ff;padding:2px 8px;border-radius:10px;flex-shrink:0;">{{ g.rows.length }}건</span>
            <!-- 선택칩: 한 줄 고정. 초과분은 +N 으로 접고 클릭하면 팝업에서 전체 확인·정리 -->
            <div style="flex:1;min-width:0;min-height:32px;border:1px solid #e5e7eb;border-radius:6px;padding:4px 7px;background:#fff;
                        display:flex;align-items:center;gap:6px;flex-wrap:nowrap;overflow:hidden;">
              <span v-for="t in g.shown" :key="t.type + t.id"
                :title="t.nm"
                :style="{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 8px 3px 10px', flexShrink:0,
                  maxWidth:'160px', fontSize:'11px', borderRadius:'12px', fontWeight:700,
                  background: g.bg, color: g.fg, border: '1px solid ' + g.bd }">
                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ g.icon }} {{ t.nm }}</span>
                <button title="제거" style="border:none;background:none;cursor:pointer;font-size:12px;color:#dc2626;padding:0 2px;flex-shrink:0;"
                  @click="handleBtnAction('setting-removeTarget', t)">✕</button>
              </span>
              <button v-if="g.moreCnt" :title="g.moreNms"
                @click="handleBtnAction(g.cmd)"
                style="flex-shrink:0;padding:3px 10px;font-size:11px;font-weight:700;border-radius:12px;cursor:pointer;
                       background:#f3f4f6;color:#555;border:1px solid #d1d5db;">＋{{ g.moreCnt }}</button>
              <span v-if="!g.rows.length" style="font-size:11px;color:#aaa;padding:2px;">{{ g.empty }}</span>
            </div>
          </div>
          <div style="font-size:10.5px;color:#aaa;margin:-2px 0 10px 104px;">이미 담은 대상은 팝업에 체크된 상태로 열립니다. ＋N 을 누르면 전체를 확인·정리할 수 있습니다.</div>
        </template>
        <div class="form-actions">
          <button class="btn btn_save" @click="handleBtnAction('setting-save')">저장</button>
          <button class="btn btn_reset" @click="handleBtnAction('setting-reset')">되돌리기</button>
        </div>
      </div>

    </bo-container>

    <!-- 캔버스 -->
    <bo-container title="대시보드 캔버스">
      <!-- 좌: 항목 카탈로그(열기/닫기 · 자체 스크롤) / 우: 캔버스 -->
      <div style="display:flex;align-items:flex-start;gap:0;">
        <!-- 카탈로그 항목 -->
        <div v-if="cfCanEdit" :style="{ width: uiState.catalogOpen ? '260px' : '34px', height: canvasH + 'px' }"
          style="flex-shrink:0;border-right:1px solid #eee;background:#f4fafe;display:flex;flex-direction:column;transition:width .12s;">
          <!-- 헤더(열기/닫기) -->
          <div style="flex-shrink:0;display:flex;align-items:center;gap:6px;padding:8px;border-bottom:1px solid #e3eef6;">
            <button :title="uiState.catalogOpen ? '카탈로그 닫기' : '카탈로그 열기'"
              @click="handleBtnAction('catalog-toggle')"
              style="flex-shrink:0;width:22px;height:22px;border:1px solid #0369a1;background:#fff;color:#0369a1;
                     border-radius:5px;cursor:pointer;font-size:11px;font-weight:800;line-height:1;">
              {{ uiState.catalogOpen ? '◀' : '▶' }}</button>
            <span v-if="uiState.catalogOpen" style="font-size:11.5px;font-weight:800;color:#0369a1;white-space:nowrap;">
              🧩 항목 카탈로그 ({{ catalog.length }})</span>
          </div>
          <!-- 접힘: 세로 라벨만 -->
          <div v-if="!uiState.catalogOpen" @click="handleBtnAction('catalog-toggle')"
            style="flex:1;display:flex;align-items:center;justify-content:center;cursor:pointer;">
            <span style="writing-mode:vertical-rl;font-size:11px;font-weight:800;color:#0369a1;letter-spacing:1px;">
              🧩 항목 카탈로그 {{ catalog.length }}</span>
          </div>
          <!-- 펼침: 목록(남은 높이만 쓰고 넘치면 스크롤) -->
          <template v-else>
            <div style="flex-shrink:0;padding:6px 8px;font-size:10.5px;color:#888;">캔버스로 드래그하거나 [＋]로 추가</div>
            <div style="flex:1;min-height:0;overflow-y:auto;padding:0 8px 8px;">
              <div v-for="(w, idx) in catalog" :key="w.dashboardItemId"
                draggable="true" @dragstart="onCatalogDragStart(idx, )" @dragend="fnDragReset"
                style="display:flex;align-items:center;gap:5px;background:#fff;border:1px solid #e5e7eb;border-radius:7px;
                       padding:5px 7px;cursor:grab;margin-bottom:5px;">
                <span style="font-size:13px;flex-shrink:0;">{{ util.itemTypeIcon(util.itemTypeOf(w)) }}</span>
                <span style="flex:1;min-width:0;">
                  <span style="display:block;font-size:11px;font-weight:700;color:#444;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                    :title="w.itemNm">{{ w.itemNm }}</span>
                  <span style="display:block;font-size:9.5px;color:#aaa;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ w.dashboardNm }}</span>
                </span>
                <button title="이 대시보드에 추가" @click="handleBtnAction('catalog-add', idx)"
                  style="flex-shrink:0;border:none;background:#eef2ff;color:#4338ca;border-radius:5px;font-size:11px;font-weight:800;cursor:pointer;padding:2px 6px;">＋</button>
              </div>
              <div v-if="!catalog.length" style="font-size:11px;color:#aaa;padding:6px;">카탈로그에 표시할 공용 항목이 없습니다.</div>
            </div>
          </template>
        </div>
        <!-- 캔버스 (남은 폭 · 카탈로그와 같은 높이에서 스크롤) -->
        <div ref="canvasRef" :style="{ height: canvasH + 'px' }" style="flex:1;min-width:0;overflow-y:auto;">
      <div v-if="!cards.length"
        :style="{ outline: dragState.canvasOver ? '2px dashed #e8587a' : 'none' }"
        style="padding:48px;text-align:center;color:#aaa;border-radius:8px;margin:12px;"
        @dragover.prevent="onCanvasDragOver" @drop.prevent="onCanvasDrop">
        항목이 없습니다.{{ cfCanEdit ? ' 항목 카탈로그에서 추가하거나 이 영역으로 드래그하세요.' : '' }}
      </div>
      <div v-else
        :style="{ display:'grid', gridTemplateColumns: fnGridCols(), gap:'12px', padding:'12px',
          outline: dragState.canvasOver ? '2px dashed #e8587a' : 'none' }"
        @dragover.prevent="onCanvasDragOver" @drop.prevent="onCanvasDrop">
        <div v-for="(c, idx) in cards" :key="c.dashboardItemId" data-card
          :style="fnCardStyle(c, idx)"
          style="position:relative;background:#fff;border:1px solid #eee;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,.05);display:flex;flex-direction:column;overflow:hidden;"
          @dragover.prevent.stop="onCardDragOver(idx)" @drop.prevent.stop="onCardDrop(idx)">
          <div v-if="fnShowHead(c)" :draggable="cfCanEdit" @dragstart="onCardDragStart(idx, $event)" @dragend="fnDragReset"
            :style="{ cursor: cfCanEdit ? 'grab' : 'default' }"
            style="flex-shrink:0;display:flex;align-items:center;gap:6px;padding:8px 10px;background:#fafbfc;border-bottom:1px solid #f0f0f0;">
            <span v-if="cfCanEdit" style="color:#bbb;font-size:12px;">⠿</span>
            <!-- KPI 카드는 본문이 아이콘+라벨을 이미 보여줘 헤더 제목이 중복 → 생략 -->
            <template v-if="!fnIsKpi(c)">
              <span style="font-size:12px;">{{ util.itemTypeIcon(util.itemTypeOf(c)) }}</span>
              <span style="font-size:12px;font-weight:700;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ c.itemNm }}</span>
            </template>
            <span style="flex:1;"></span>
            <span style="font-size:10px;color:#aaa;font-family:monospace;">{{ c.panelWidth }}×{{ c.panelHeight }}</span>
            <template v-if="cfCanEdit">
              <button title="폭 줄이기"   style="border:none;background:none;cursor:pointer;font-size:11px;color:#888;padding:1px 3px;" @click="handleBtnAction('card-widthDec', idx)">◀</button>
              <button title="폭 늘리기"   style="border:none;background:none;cursor:pointer;font-size:11px;color:#888;padding:1px 3px;" @click="handleBtnAction('card-widthInc', idx)">▶</button>
              <button title="높이 줄이기" style="border:none;background:none;cursor:pointer;font-size:11px;color:#888;padding:1px 3px;" @click="handleBtnAction('card-heightDec', idx)">▲</button>
              <button title="높이 늘리기" style="border:none;background:none;cursor:pointer;font-size:11px;color:#888;padding:1px 3px;" @click="handleBtnAction('card-heightInc', idx)">▼</button>
              <button title="항목 제거" style="border:none;background:none;cursor:pointer;font-size:12px;color:#dc2626;padding:1px 3px;"
                @click="handleBtnAction('card-remove', idx)">✕</button>
            </template>
          </div>
          <!-- 우하단 리사이즈 핸들 (드래그로 폭/높이 조절) -->
          <div v-if="cfCanEdit" :title="'크기 조절 (' + c.panelWidth + '×' + c.panelHeight + ')'"
            @mousedown="onResizeStart(idx, $event)"
            :style="{ background: resizeState.idx === idx ? '#e8587a' : 'transparent' }"
            style="position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:nwse-resize;z-index:2;
                   border-bottom-right-radius:10px;display:flex;align-items:flex-end;justify-content:flex-end;padding:2px;">
            <span :style="{ color: resizeState.idx === idx ? '#fff' : '#c7c7c7' }"
              style="font-size:10px;line-height:1;user-select:none;">◢</span>
          </div>
          <div style="flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;">
            <template v-if="fnWidget(c)">
              <div v-if="fnWidget(c).kind === 'kpi'"
                :style="{ background: util.kpiColorOf(idx).bg }"
                style="display:flex;align-items:center;gap:8px;width:100%;height:100%;padding:10px 12px;box-sizing:border-box;">
                <div style="font-size:18px;width:32px;height:32px;border-radius:7px;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  {{ util.itemTypeIcon(util.itemTypeOf(c)) }}
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:10px;color:#666;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ fnWidget(c).label }}</div>
                  <div :style="{ color: util.kpiColorOf(idx).color }" style="font-size:14px;font-weight:800;margin-top:2px;">
                    {{ fnWidget(c).value }}
                    <span v-if="fnWidget(c).delta !== null" :style="{ fontSize:'10px', marginLeft:'4px', fontWeight:700, color: fnWidget(c).delta >= 0 ? '#10b981' : '#ef4444' }">
                      {{ fnWidget(c).delta >= 0 ? '▲' : '▼' }} {{ Math.abs(fnWidget(c).delta).toLocaleString() }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-else-if="fnWidget(c).kind === 'realtime'" style="text-align:center;color:#aaa;font-size:11px;">
                🔴 실시간 항목<br/>미리보기 미지원
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
          </div>
        </div>
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
        {{ uiState.tab==='mine' ? '대시보드를 만들고 원하는 항목을 골라 나만의 화면을 구성해보세요.' : '다른 사용자가 공유하면 여기에 표시됩니다.' }}</div>
      <button v-if="uiState.tab==='mine'" class="btn btn_new" style="margin-top:16px;" @click="handleBtnAction('dash-create')">+ 새 대시보드 만들기</button>
    </div>
  </bo-container>

  <!-- ===== ■. 공유대상 선택 모달 (기존 공통 모달 재사용) ==================== -->
  <bo-cm-popup-modal v-if="pickModal.user" popup-code="user" title="공유할 사용자 선택"
    :multi="true" result-type="array" :exclude-ids="cfExcludeUserIds" :init-selected-ids="cfPickedUserIds"
    @select="onPickUser" @close="pickModal.user = false" />
  <bo-cm-popup-modal v-if="pickModal.vendor" popup-code="vendor" title="공유할 업체 선택"
    :multi="true" result-type="array" :init-selected-ids="cfPickedVendorIds"
    @select="onPickVendor" @close="pickModal.vendor = false" />
  <bo-cm-popup-modal v-if="pickModal.dept" popup-code="dept" title="공유할 부서 선택"
    :multi="true" result-type="array" :init-selected-ids="cfPickedDeptIds"
    @select="onPickDept" @close="pickModal.dept = false" />
</bo-page>
`,
};
