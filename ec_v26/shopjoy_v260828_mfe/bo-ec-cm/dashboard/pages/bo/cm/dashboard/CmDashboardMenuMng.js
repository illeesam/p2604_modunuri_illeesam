/* ShopJoy - 대시보드 메뉴관리 (좌측메뉴 트리 구성)
 *
 *  scope 로 두 화면을 겸한다 — 구성 방식이 완전히 같고 대상만 다르다.
  *   USER : 개인 대시보드 → 좌측 '사용자 대시보드' 그룹 (내 트리, 나에게만 보임)
  *   SYS  : 공용 대시보드 → 좌측 '대시보드' 그룹      (사이트 공통, 전원에게 같게 보임)
 *
 *  어느 쪽이든 좌측메뉴에 어떤 대시보드를 어떤 순서·계층으로 보일지 구성한다.
 *   - 좌: 내가 볼 수 있는 대시보드 (작성자 · 공개여부 표시)
 *   - 우: 좌측메뉴 트리 (폴더 + 대시보드 항목)
 *   - 좌→우 드래그로 담고, 트리 안에서 끌어 위치를 바꾸고, ✕ 로 뺀다
 *
 *  저장은 cm_dashboard_menu 를 통째 교체한다(해당 범위만). 저장된 트리가 없으면
 *  좌측메뉴는 폴백으로 동작하는데(SYS=기본 2개 / USER=볼 수 있는 전체), 그때 이 화면의
 *  트리를 비워두면 "지금 메뉴가 어떻게 돼 있는지" 를 알 수 없다. 그래서 폴백 상태에서는
 *  지금 메뉴에 보이는 그대로 채워 놓고 배너로 저장 전임을 알린다(fnSeedFromFallback).
 */
export default {
  name: 'cm-dashboard-cmDashboardMenuMng',
  props: {
    navigate:  { type: Function, required: true },                       // 페이지 이동
    showToast: { type: Function, default: () => {} },                    // 토스트 알림
    scope:     { type: String,   default: 'USER' },                      // 메뉴범위 (USER 개인 / SYS 공용)
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, onMounted } = Vue;
    const showToast = window.boApp ? window.boApp.showToast : props.showToast;

    /* seeded — 저장된 트리가 없어 현재 좌측메뉴 상태로 채워 넣은 상태 (저장 전) */
    const uiState = reactive({ loading: false, error: null, seeded: false });
    const codes   = reactive({});

    const myDashes     = reactive([]);   /* 내가 만든 대시보드 */
    const sharedDashes = reactive([]);   /* 나에게 공유된 대시보드 */

    /* menuNodes: 평면 배열. 부모는 parentKey 로 가리키고 화면은 depth 로 들여쓴다.
       key 는 클라이언트 임시 ID — 저장 시 서버가 실제 ID 로 바꿔 넣는다. */
    const menuNodes = reactive([]);
    const menuDrag  = reactive({ from: null, overKey: null });   /* from: {src:'left'|'tree', payload} */
    let   menuSeq   = 0;
    const fnNewKey  = () => 'TMP' + (++menuSeq) + '_' + Date.now().toString().slice(-5);

    /* 범위별 문구·동작 — 이 한 덩어리만 보면 두 화면 차이를 알 수 있다 */
    const cfIsSys = computed(() => props.scope === 'SYS');
    const cfMeta  = computed(() => cfIsSys.value
      ? { title: '대시보드 메뉴관리',        group: '대시보드',        icon: '📊',
          listNm: '공용 대시보드',           uiNm:  '대시보드메뉴' }
      : { title: '사용자 대시보드 메뉴관리', group: '사용자 대시보드', icon: '👤',
          listNm: '내가 볼 수 있는 대시보드', uiNm: '사용자대시보드메뉴' });

    const cfSiteId = computed(() => window.boCommonFilter?.siteId || '');
    const cfAuthId = computed(() => {
      const s = window.sfGetBoAuthStore ? window.sfGetBoAuthStore() : null;
      return s && s.svAuthUser ? (s.svAuthUser.authId || '') : '';
    });

    /* 개인화 대시보드 여부 — ownerUserId(운영 표준) 우선, 구 규약(uiCompNm 'MY:' 접두어) fallback.
       CmDashboardMng.fnIsMyDash 과 같은 판정이라야 두 화면의 유형이 어긋나지 않는다 */
    const fnIsMyDash = (d) => !!d.ownerUserId || (d.uiCompNm || '').indexOf('MY:') === 0;

    /* 공개여부 표기 — 레거시 코드(ALL/DEPT/USER/ME) 호환 정규화 */
    const fnNormScope  = (cd) => (cd === 'PUBLIC' || cd === 'ALL') ? 'PUBLIC' : 'PRIVATE';
    const fnScopeLabel = (cd) => fnNormScope(cd) === 'PUBLIC' ? '전체공개' : '비공개';
    const fnScopeIcon  = (cd) => fnNormScope(cd) === 'PUBLIC' ? '🌐' : '🔒';

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param) => {
      console.log(' ■■ CmDashboardMenuMng : handleBtnAction -> ', cmd, param);
      if (cmd === 'menu-addFolder') return fnAddFolder();
      if (cmd === 'menu-remove')    return fnRemoveNode(param);
      if (cmd === 'menu-save')      return handleSaveMenuTree();
      if (cmd === 'menu-reset')     { fnLoadMenuTree(); return showToast('저장 전 값으로 되돌렸습니다.', 'success'); }
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* ##### [03] 초기 함수 (마운트 / 조회) ######################################### */

    /* initPage — 화면 로드 시퀀스. 마운트 시 실행한다. */
    const initPage = async () => {
      await handleLoadDashes();
      await fnLoadMenuTree();
    };
    onMounted(initPage);

    /* handleLoadDashes — 트리에 담을 후보 목록
       SYS  : 공용 대시보드(주인 없음) / USER : 개인 대시보드(내 것 + 공유받은 것) */
    const handleLoadDashes = async () => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.cmDashboard.getList(
          { siteId: cfSiteId.value, scope: 'accessible' }, cfMeta.value.uiNm, '대시보드조회');
        const rows = res.data?.data || [];
        if (cfIsSys.value) {
          myDashes.splice(0, myDashes.length, ...rows.filter(d => !fnIsMyDash(d)));
          sharedDashes.splice(0, sharedDashes.length);
          return;
        }
        const all = rows.filter(fnIsMyDash);
        const me  = cfAuthId.value;
        myDashes.splice(0, myDashes.length, ...all.filter(d => d.ownerUserId === me));
        sharedDashes.splice(0, sharedDashes.length, ...all.filter(d => d.ownerUserId !== me));
      } catch (err) {
        showToast(coUtil.cofErrMsg(err, '조회 오류'), 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    /* fnLoadMenuTree — 저장된 트리를 불러온다. 없으면 지금 좌측메뉴에 보이는 그대로 채운다 */
    const fnLoadMenuTree = async () => {
      try {
        const res = await boApiSvc.cmDashboard.getMenuTree(
          { siteId: cfSiteId.value, scope: props.scope }, cfMeta.value.uiNm, '메뉴트리조회');
        const rows = res.data?.data || [];
        if (!rows.length) { fnSeedFromFallback(); return; }
        uiState.seeded = false;
        const byParent = {};
        rows.forEach(r => { const p = r.parentNodeId || ''; (byParent[p] = byParent[p] || []).push(r); });
        const flat = [];
        const walk = (pid, depth) => (byParent[pid] || []).forEach(r => {
          flat.push({ key: r.dashboardMenuId, parentKey: r.parentNodeId || '', depth,
                      nodeTypeCd: r.nodeTypeCd, nodeNm: r.nodeNm, dashboardId: r.dashboardId });
          walk(r.dashboardMenuId, depth + 1);
        });
        walk('', 0);
        menuNodes.splice(0, menuNodes.length, ...flat);
      } catch (e) { console.warn('[메뉴트리 조회 오류]', e); }
    };

    /* fnSeedFromFallback — 저장된 트리가 없을 때(=폴백 상태) 화면을 비워두지 않는다.
       좌측메뉴에는 폴백 항목이 이미 보이고 있는데 트리만 비어 있으면 "현재 구성"을 알 수 없다.
       지금 메뉴에 나오는 것과 똑같이 채워 넣고, 저장 전임을 배너로 알린다.
       (boApp 의 폴백 규칙과 짝이다 — 한쪽만 바꾸면 화면과 메뉴가 어긋난다) */
    const fnSeedFromFallback = () => {
      const seed = cfIsSys.value
        /* SYS 폴백 = boApp.HOME_FALLBACK_DASH. pageId 로 열리는 공용 대시보드만 메뉴에 있다 */
        ? cfAllDashes.value.filter(d => fnIsSysMenuDash(d))
        /* USER 폴백 = 볼 수 있는 개인 대시보드 전체 */
        : cfAllDashes.value.slice();
      menuNodes.splice(0, menuNodes.length, ...seed.map(d => ({
        key: fnNewKey(), parentKey: '', depth: 0, nodeTypeCd: 'ITEM',
        nodeNm: null, dashboardId: d.dashboardId,
      })));
      uiState.seeded = menuNodes.length > 0;
    };

    /* fnIsSysMenuDash — 좌측 '대시보드' 그룹에 실제로 나오는 공용 대시보드인가.
       boApp.fnSysDashPageId 와 같은 규칙 (EC대시보드는 사이트별 변형이 pageId 하나로 묶여 있다) */
    const fnIsSysMenuDash = (d) => {
      const c = d.uiCompNm || '';
      return c === 'DashboardBoAppMonitor' || c === 'DashboardBoEc' + (window.BO_SITE_NO || '01');
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러) #################################### */

    /* handleSaveMenuTree — 트리 통째 저장. 서버가 내 노드를 지우고 다시 넣는다 */
    const handleSaveMenuTree = async () => {
      try {
        const nodes = menuNodes.map(n => ({
          dashboardMenuId:   n.key,          /* 임시 키 — 서버가 실제 ID 로 매핑 */
          parentNodeId: n.parentKey || null,
          nodeTypeCd:   n.nodeTypeCd,
          nodeNm:       n.nodeTypeCd === 'FOLDER' ? (n.nodeNm || '새 폴더') : null,
          dashboardId:  n.dashboardId || null,
        }));
        await boApiSvc.cmDashboard.saveMenuTree(nodes,
          { siteId: cfSiteId.value, scope: props.scope }, cfMeta.value.uiNm, '메뉴트리저장');
        uiState.seeded = false;
        showToast('좌측메뉴 구성을 저장했습니다.', 'success');
        await fnLoadMenuTree();
        fnNotifyMenuChanged();
      } catch (err) {
        showToast(coUtil.cofErrMsg(err, '저장 오류'), 'error', 0);
      }
    };

    /* fnAddFolder — 폴더 노드 추가 (최상위 끝) */
    const fnAddFolder = () => {
      menuNodes.push({ key: fnNewKey(), parentKey: '', depth: 0, nodeTypeCd: 'FOLDER',
                       nodeNm: '새 폴더', dashboardId: null });
    };

    /* fnRemoveNode — 트리에서 제외. 폴더면 자식들을 한 단계 올려 고아를 만들지 않는다 */
    const fnRemoveNode = (key) => {
      const i = menuNodes.findIndex(n => n.key === key);
      if (i < 0) return;
      const me = menuNodes[i];
      menuNodes.forEach(n => { if (n.parentKey === key) { n.parentKey = me.parentKey; } });
      menuNodes.splice(i, 1);
      fnReflow();
    };

    /* fnReflow — parentKey 기준으로 순서/깊이를 다시 계산 (부모 바로 아래 자식) */
    const fnReflow = () => {
      const byParent = {};
      menuNodes.forEach(n => { (byParent[n.parentKey] = byParent[n.parentKey] || []).push(n); });
      const flat = [];
      const walk = (pk, depth) => (byParent[pk] || []).forEach(n => {
        n.depth = depth; flat.push(n); walk(n.key, depth + 1);
      });
      walk('', 0);
      menuNodes.splice(0, menuNodes.length, ...flat);
    };

    /* ── 드래그 앤 드롭 ────────────────────────────────────────
       좌측 목록 → 트리 : 항목 노드 추가
       트리 → 트리     : 위치 이동 (폴더에 떨어뜨리면 자식, 항목이면 형제) */
    const onMenuDragStart = (src, payload) => { menuDrag.from = { src, payload }; };
    const onMenuDragEnd   = () => { menuDrag.from = null; menuDrag.overKey = null; };
    const onMenuDragOver  = (key) => { menuDrag.overKey = key; };

    /* fnDropOn — key=null 이면 최상위 끝에 놓는다 */
    const fnDropOn = (key) => {
      const from = menuDrag.from;
      menuDrag.overKey = null;
      if (!from) return;
      const target = key ? menuNodes.find(n => n.key === key) : null;
      /* 놓을 자리의 부모 결정 — 폴더 위면 그 자식, 항목 위면 그 형제 */
      const parentKey = !target ? '' : (target.nodeTypeCd === 'FOLDER' ? target.key : target.parentKey);
      if (from.src === 'left') {
        const d = from.payload;
        if (cfMenuDashIds.value.has(d.dashboardId)) { onMenuDragEnd(); return showToast('이미 트리에 있는 대시보드입니다.', 'error'); }
        menuNodes.push({ key: fnNewKey(), parentKey, depth: 0, nodeTypeCd: 'ITEM',
                         nodeNm: null, dashboardId: d.dashboardId });
      } else {
        const me = menuNodes.find(n => n.key === from.payload);
        if (!me) { onMenuDragEnd(); return; }
        if (target && fnIsDescendant(target.key, me.key)) { onMenuDragEnd(); return showToast('자기 하위로는 옮길 수 없습니다.', 'error'); }
        me.parentKey = parentKey;
        /* 형제로 떨어뜨린 경우 그 바로 뒤로 */
        if (target && target.nodeTypeCd !== 'FOLDER') {
          const i = menuNodes.indexOf(me); menuNodes.splice(i, 1);
          menuNodes.splice(menuNodes.indexOf(target) + 1, 0, me);
        }
      }
      fnReflow();
      onMenuDragEnd();
    };

    /* fnIsDescendant — a 가 b 의 하위인가 (자기 안으로 넣는 것 방지) */
    const fnIsDescendant = (a, b) => {
      let cur = menuNodes.find(n => n.key === a);
      while (cur && cur.parentKey) {
        if (cur.parentKey === b) return true;
        cur = menuNodes.find(n => n.key === cur.parentKey);
      }
      return false;
    };

    /* fnNotifyMenuChanged — 좌측메뉴 갱신 신호. boApp 이 받아 해당 그룹을 다시 그린다 */
    const fnNotifyMenuChanged = () => {
      const ev = cfIsSys.value ? 'sys-dashboard-changed' : 'user-dashboard-changed';
      try { window.dispatchEvent(new CustomEvent(ev)); } catch (_) {}
    };

    /* ##### [05] 사용자 함수 (헬퍼) ############################################### */

    /* 좌측 목록 = 내가 볼 수 있는 대시보드 전체 */
    const cfAllDashes = computed(() => myDashes.concat(sharedDashes));
    /* 트리에 이미 담긴 대시보드 — 좌측 목록 표시용 */
    const cfMenuDashIds = computed(() => new Set(menuNodes.filter(n => n.dashboardId).map(n => n.dashboardId)));

    /* fnNodeLabel — 항목은 대시보드명을 따라간다(이름을 바꿔도 메뉴가 자동 반영) */
    const fnNodeLabel = (n) => {
      if (n.nodeTypeCd === 'FOLDER') return n.nodeNm || '(폴더)';
      const d = cfAllDashes.value.find(x => x.dashboardId === n.dashboardId);
      return d ? d.dashboardNm : '(삭제된 대시보드)';
    };

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      uiState, codes, cfAuthId, cfIsSys, cfMeta,
      menuNodes, menuDrag, cfAllDashes, cfMenuDashIds, fnNodeLabel,
      fnScopeIcon, fnScopeLabel,
      onMenuDragStart, onMenuDragEnd, onMenuDragOver, fnDropOn,
      handleBtnAction,
    };
  },
  template: /* html */ `
<bo-page :title="cfMeta.title"
  :desc-summary="'좌측메뉴 ' + cfMeta.group + ' 그룹에 보일 대시보드를 폴더로 묶어 순서·계층으로 구성합니다.'">
  <bo-container>
    <div style="padding:10px 12px;">
      <div style="font-size:11px;color:#888;margin-bottom:8px;">
        좌측 목록에서 <b>우측 트리로 드래그</b>해 좌측메뉴를 구성합니다. 폴더로 묶고, 트리 안에서 끌어 위치를 바꾸고,
        <b>✕</b> 로 메뉴에서 뺄 수 있습니다(대시보드는 삭제되지 않습니다). 트리가 비어 있으면 볼 수 있는 대시보드가 전부 표시됩니다.
        <span v-if="cfIsSys" style="color:#c2410c;font-weight:700;">이 설정은 사이트 공통이라 모든 사용자에게 같게 보입니다.</span></div>
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <!-- 좌: 볼 수 있는 대시보드 -->
        <div style="width:340px;flex-shrink:0;border:1px solid #e5e7eb;border-radius:8px;background:#fff;display:flex;flex-direction:column;height:480px;">
          <div style="flex-shrink:0;padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:11.5px;font-weight:800;color:#444;">
            📋 {{ cfMeta.listNm }} ({{ cfAllDashes.length }})</div>
          <div style="flex:1;min-height:0;overflow-y:auto;padding:8px;">
            <div v-for="d in cfAllDashes" :key="d.dashboardId"
              draggable="true" @dragstart="onMenuDragStart('left', d)" @dragend="onMenuDragEnd"
              :style="{ opacity: cfMenuDashIds.has(d.dashboardId) ? 0.45 : 1 }"
              style="display:flex;align-items:center;gap:6px;border:1px solid #eee;border-radius:6px;padding:6px 8px;margin-bottom:5px;cursor:grab;background:#fafbfc;">
              <span style="font-size:12px;flex-shrink:0;">{{ cfIsSys ? cfMeta.icon : fnScopeIcon(d.shareScopeCd) }}</span>
              <span style="flex:1;min-width:0;">
                <span style="display:block;font-size:11.5px;font-weight:700;color:#444;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ d.dashboardNm }}</span>
                <span style="display:block;font-size:9.5px;color:#aaa;">
                  <template v-if="cfIsSys">공용 · {{ d.uiCompNm || '-' }}</template>
                  <template v-else>작성자 {{ d.ownerUserId === cfAuthId ? '나' : (d.ownerUserId || '-') }} · {{ fnScopeLabel(d.shareScopeCd) }}</template></span>
              </span>
              <span v-if="cfMenuDashIds.has(d.dashboardId)" style="flex-shrink:0;font-size:9.5px;color:#4338ca;background:#eef2ff;padding:1px 6px;border-radius:8px;">담김</span>
            </div>
            <div v-if="!cfAllDashes.length" style="font-size:11px;color:#aaa;padding:6px;">{{ cfMeta.listNm }}가 없습니다.</div>
          </div>
        </div>
        <!-- 우: 좌측메뉴 트리 -->
        <div style="flex:1;min-width:0;border:1px solid #e5e7eb;border-radius:8px;background:#fff;display:flex;flex-direction:column;height:480px;">
          <div style="flex-shrink:0;display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid #f0f0f0;">
            <span style="font-size:11.5px;font-weight:800;color:#444;">
              🗂 좌측메뉴 '{{ cfMeta.group }}' 트리 ({{ menuNodes.length }})</span>
            <button class="btn btn-xs" @click="handleBtnAction('menu-addFolder')"
              style="background:#fffbeb;color:#b45309;border:1px solid #fde68a;font-weight:700;">＋ 폴더 추가</button>
          </div>
          <!-- 저장된 트리가 없어 현재 좌측메뉴 상태를 그대로 불러온 경우 -->
          <div v-if="uiState.seeded" style="flex-shrink:0;padding:6px 10px;background:#fffbeb;border-bottom:1px solid #fde68a;font-size:10.5px;color:#b45309;">
            아직 저장된 구성이 없어 <b>지금 좌측메뉴에 보이는 그대로</b> 불러왔습니다. 원하는 대로 바꾼 뒤 [저장]하세요.</div>
          <!-- 트리 본문 (빈 곳에 놓으면 최상위 끝) -->
          <div style="flex:1;min-height:0;overflow-y:auto;padding:8px;"
            @dragover.prevent="onMenuDragOver(null)" @drop.prevent="fnDropOn(null)"
            :style="{ outline: menuDrag.overKey === null && menuDrag.from ? '2px dashed #6366f1' : 'none' }">
            <div v-for="n in menuNodes" :key="n.key"
              draggable="true" @dragstart.stop="onMenuDragStart('tree', n.key)" @dragend="onMenuDragEnd"
              @dragover.prevent.stop="onMenuDragOver(n.key)" @drop.prevent.stop="fnDropOn(n.key)"
              :style="{ marginLeft: (n.depth * 20) + 'px',
                        background: menuDrag.overKey === n.key ? '#eef2ff' : (n.nodeTypeCd === 'FOLDER' ? '#fffbeb' : '#fff'),
                        border: '1px solid ' + (menuDrag.overKey === n.key ? '#6366f1' : '#eee') }"
              style="display:flex;align-items:center;gap:6px;border-radius:6px;padding:5px 8px;margin-bottom:4px;cursor:grab;">
              <span style="font-size:12px;flex-shrink:0;">
                {{ n.nodeTypeCd === 'FOLDER' ? '📁' : cfMeta.icon }}</span>
              <input v-if="n.nodeTypeCd === 'FOLDER'" v-model="n.nodeNm"
                style="flex:1;min-width:0;font-size:11.5px;font-weight:700;color:#b45309;border:1px solid #fde68a;border-radius:4px;padding:2px 6px;background:#fff;" />
              <span v-else style="flex:1;min-width:0;font-size:11.5px;font-weight:700;color:#444;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ fnNodeLabel(n) }}</span>
              <button title="메뉴에서 빼기" @click.stop="handleBtnAction('menu-remove', n.key)"
                style="flex-shrink:0;border:none;background:none;cursor:pointer;font-size:12px;color:#dc2626;padding:0 3px;">✕</button>
            </div>
            <div v-if="!menuNodes.length" style="font-size:11px;color:#aaa;padding:16px;text-align:center;">
              비어 있습니다 — 좌측에서 끌어다 놓으세요.<br>이대로 저장하면 좌측메뉴에 {{ cfMeta.listNm }}가 전부 표시됩니다.</div>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn_save" @click="handleBtnAction('menu-save')">저장</button>
        <button class="btn btn_reset" @click="handleBtnAction('menu-reset')">되돌리기</button>
      </div>
    </div>
  </bo-container>
</bo-page>
`,
};
