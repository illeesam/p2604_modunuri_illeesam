/* ShopJoy BO - 공통 유틸리티 + 공통 필터 전역 상태 */
(function (global) {
  const { reactive } = Vue;

  /* ── 공통 필터 전역 상태 (boCommonFilter) ── */
  const boCommonFilter = reactive({
    siteId:   '2604010000000001',  // sy_site.siteId — default: ShopJoy 메인몰
    vendorId: null,   // sy_vendor.vendorId (판매업체)
    dlivVendorId: null, // sy_vendor.vendorId (배송업체)
    userId:   null,   // sy_user.userId (관리자)
    memberId: null,   // ec_member.memberId
    orderId:  null,   // ec_order.orderId
  });

  /* 기본값: siteId 는 hard-coded default ('2604010000000001'). 로그인 후 boAppInitStore 가 실제 첫 사이트로 갱신 */

  /* ── 등록기간 옵션 ── */
  const bofDateRangeOptions = [
    { value: '1day',       label: '최근 1일' },
    { value: '3days',      label: '최근 3일' },
    { value: '1week',      label: '최근 1주' },
    { value: '2weeks',     label: '최근 2주' },
    { value: '1month',     label: '최근 1달' },
    { value: '3months',    label: '최근 3달' },
    { value: '6months',    label: '최근 6달' },
    { value: '1year',      label: '최근 1년' },
    { value: 'lastyear',   label: '전년' },
    { value: 'yearbefore', label: '전전년' },
    { value: 'all',        label: '전체' },
  ];

  /* ── 날짜 헬퍼 ── */
  function _addDays(base, days) {
    const d = new Date(base); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10);
  }
  function _addMonths(base, m) {
    const d = new Date(base); d.setMonth(d.getMonth() + m); return d.toISOString().slice(0, 10);
  }

  function bofGetDateRange(range) {
    const today = new Date().toISOString().slice(0, 10);
    const year  = new Date(today).getFullYear();
    if (range === 'all') return null;
    switch (range) {
      case '1day':       return { from: _addDays(today, -1),    to: today };
      case '3days':      return { from: _addDays(today, -3),    to: today };
      case '1week':      return { from: _addDays(today, -7),    to: today };
      case '2weeks':     return { from: _addDays(today, -14),   to: today };
      case '1month':     return { from: _addMonths(today, -1),  to: today };
      case '3months':    return { from: _addMonths(today, -3),  to: today };
      case '6months':    return { from: _addMonths(today, -6),  to: today };
      case '1year':      return { from: _addMonths(today, -12), to: today };
      case 'lastyear':   return { from: `${year-1}-01-01`,      to: `${year-1}-12-31` };
      case 'yearbefore': return { from: `${year-2}-01-01`,      to: `${year-2}-12-31` };
      default:           return { from: _addMonths(today, -3),  to: today };
    }
  }

  /* bofApplyDateRange — range 옵션(예: '1month','이번달')을 obj 의 시작/종료 키에 적용.
   *   각 화면의 `if(p.dateRange){const r=bofGetDateRange(...);p.dateStart=r?r.from:'';...}` 복붙 대체.
   *   range 인자 생략 시 obj[rangeKey](기본 'dateRange') 값을 사용.
   *   range 가 빈값이면 시작/종료를 비우지 않고 그대로 둔다(직접 입력 보존).
   *   사용:
   *     boUtil.bofApplyDateRange(searchParam);                       // obj.dateRange → dateStart/dateEnd
   *     boUtil.bofApplyDateRange(uiState, '이번달', 'dateStart', 'dateEnd'); */
  function bofApplyDateRange(obj, range, startKey, endKey, rangeKey) {
    if (!obj) return;
    const sk = startKey || 'dateStart', ek = endKey || 'dateEnd';
    const rg = range !== undefined ? range : obj[rangeKey || 'dateRange'];
    if (!rg) return;
    const r = bofGetDateRange(rg);
    obj[sk] = r ? r.from : '';
    obj[ek] = r ? r.to : '';
  }

  /* dateStr 이 range 범위 내에 있으면 true. dateStr 없으면 항상 true */
  function bofIsInRange(dateStr, range) {
    if (!dateStr) return true;
    if (!range || range === 'all') return true;
    const r = bofGetDateRange(range);
    if (!r) return true;
    const d = String(dateStr).slice(0, 10);
    return d >= r.from && d <= r.to;
  }

  /* nextId(arr, key): 배열에서 key 컬럼의 최대 숫자 +1 반환 (신규 ID 채번용 임시 헬퍼) */
  function nextIdFn(arr, key) {
    const list = Array.isArray(arr) ? arr : ((arr && arr.value) || []);
    const max = list.reduce((m, x) => Math.max(m, Number(x?.[key]) || 0), 0);
    return max + 1;
  }

  const boUtil = { bofDateRangeOptions, bofGetDateRange, bofApplyDateRange, bofIsInRange, bofNextId: nextIdFn };

  /* ── 공개 대상(Visibility) 유틸 ──
   * 저장 포맷: '^MEMBER^VIP^' (양끝 ^ 래핑). 공개 안 함=''.
   */
  global.visibilityUtil = {
    TARGETS: ['PUBLIC','MEMBER','VERIFIED','PREMIUM','VIP','INVITED','STAFF','EXECUTIVE'],
    serialize(codes) {
      const arr = Array.isArray(codes) ? codes.filter(Boolean) : [];
      return arr.length ? '^' + arr.join('^') + '^' : '';
    },
    parse(str) {
      if (!str) return [];
      return str.replace(/^\^|\^$/g, '').split('^').filter(Boolean);
    },
    has(str, code) {
      return !!str && str.indexOf('^' + code + '^') !== -1;
    },
    /* 사용자가 해당 콘텐츠를 볼 수 있는지 판정
     * targetStr: '^MEMBER^VIP^'
     * userCodes: 해당 사용자의 자격 코드 배열 ['MEMBER','VIP']
     */
    matches(targetStr, userCodes) {
      if (!targetStr) return false;
      if (targetStr.indexOf('^PUBLIC^') !== -1) return true;
      const codes = Array.isArray(userCodes) ? userCodes : [];
      return codes.some(c => targetStr.indexOf('^' + c + '^') !== -1);
    },
    /* 기존 필드(condition/authRequired/authGrade) → 신규 visibilityTargets 마이그레이션 */
    fromLegacy(condition, authRequired, authGrade) {
      const out = new Set();
      const cond = (condition || '').trim();
      if (cond === '항상 표시' || cond === '') out.add('PUBLIC');
      else if (cond === '로그인 필요') out.add('MEMBER');
      else if (cond === '비로그인만') {/* 신규 스키마에서 제거: 미체크로 둠 */}
      else if (cond === '로그인+등급') {
        if (authGrade === 'VIP') out.add('VIP');
        else if (authGrade === 'GOLD') out.add('PREMIUM');
        else out.add('MEMBER');
      }
      if (authRequired === true || authRequired === 'Y') out.add('VERIFIED');
      return this.serialize(Array.from(out));
    },
    /* 라벨 조회용 */
    label(code) {
      const c = (window.sfGetBoCodeStore?.()?.svCodes || [])
        .find(x => x.codeGrp === 'VISIBILITY_TARGET' && x.codeValue === code);
      return c?.codeLabel || code;
    },
    allOptions() {
      return (window.sfGetBoCodeStore?.()?.svCodes || [])
        .filter(x => x.codeGrp === 'VISIBILITY_TARGET' && x.useYn === 'Y')
        .sort((a,b) => (a.sortOrd||0) - (b.sortOrd||0));
    },
  };

  boUtil.bofGetSiteNm = function() {
    if (!boCommonFilter.siteId) return 'ShopJoy';
    const sites = window._boCmSites || [];
    const site = sites.find(s => s.siteId === boCommonFilter.siteId);
    return site?.siteNm || 'ShopJoy';
  };

  /* ── 업체/토큰 배지·라벨 (여러 화면 중복 맵 통합) ──
   * 주의: sy_code.code_opt1 이 채워지면 coUtil.cofCodeBadge 로 이관 권장(현재 미채움이라 하드맵 유지).
   * 사용: 화면에서 `const fnTypeBadge = boUtil.bofVendorTypeBadge;` 별칭으로 두면 기존 badge: 컬럼 참조 무수정. */
  boUtil.bofVendorTypeBadge   = (t) => ({ '판매업체': 'badge-blue', '배송업체': 'badge-orange' })[t] || 'badge-gray';   // SyVendorMng/SyVendorInfoMng 공통
  boUtil.bofVendorStatusBadge = (s) => ({ '활성': 'badge-green', '비활성': 'badge-gray' })[s] || 'badge-gray';          // SyVendorMng/SyVendorInfoMng 공통
  boUtil.bofTokenActionBadge  = (a) => ({ 'ISSUE': 'badge-blue', 'REFRESH': 'badge-green', 'REVOKE': 'badge-red', 'EXPIRE': 'badge-orange', 'LOGOUT': 'badge-gray' })[a] || 'badge-gray'; // SyMemberLoginHist/SyUserLoginHist 공통
  boUtil.bofTokenActionLabel  = (a) => ({ 'ISSUE': '발급', 'REFRESH': '갱신', 'REVOKE': '폐기', 'EXPIRE': '만료', 'LOGOUT': '로그아웃' })[a] || (a || '-');                              // SyMemberLoginHist/SyUserLoginHist 공통
  boUtil.bofTokenTypeBadge    = (t) => ({ 'ACCESS': 'badge-purple', 'REFRESH': 'badge-blue' })[t] || 'badge-gray';     // SyMemberLoginHist/SyUserLoginHist 공통

  /* exportCsv → coUtil.cofExportCsv 로 통합. 호출처에서 coUtil.cofExportCsv 사용. */

  /* ──────────────────────────────────────────────
     sy_path 기반 트리 헬퍼 (공통)
  ────────────────────────────────────────────── */
  boUtil.bofBuildPathTree = function (bizCd) {
    const list = (window._boCmPaths || [])
      .filter(p => p.bizCd === bizCd && p.useYn !== 'N');
    const byParent = {};
    list.forEach(p => {
      const k = p.parentPathId == null ? '__root__' : p.parentPathId;
      (byParent[k] = byParent[k] || []).push(p);
    });

    /* build */
    const build = (parentKey) => (byParent[parentKey] || [])
      .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
      .map(p => ({
        pathId: p.pathId, path: p.pathId,
        name: p.pathLabel, pathLabel: p.pathLabel,
        bizCd: p.bizCd || '',
        userAdded: !!p._userAdded,
        children: build(p.pathId), count: 0,
      }));
    const root = {
      pathId: null, path: null, name: '전체', pathLabel: '전체',
      children: build('__root__'), count: list.length,
    };

    /* recur */
    const recur = (n) => { n.count = (n.children || []).reduce((s, c) => s + recur(c) + 1, 0); return n.count; };
    recur(root);
    return root;
  };

  boUtil.bofGetPathDescendants = function (bizCd, pathId) {
    if (pathId == null) return null;
    const set = new Set([pathId]);
    const list = (window._boCmPaths || []).filter(p => p.bizCd === bizCd);
    let added = true;
    while (added) {
      added = false;
      list.forEach(p => {
        if (set.has(p.parentPathId) && !set.has(p.pathId)) { set.add(p.pathId); added = true; }
      });
    }
    return set;
  };

  /* buildGenericTree / collectDescendantIds / collectExpandedToDepth → coUtil 로 통합.
   * BO 전용 트리(buildDeptTree/MenuTree/RoleTree)는 BO store 의존이므로 boUtil 에 유지하되 coUtil 호출. */
  boUtil.bofBuildDeptTree = function () {
    const depts = window.useBoDeptStore?.()?.depts || window._boCmDepts || [];
    return window.coUtil.cofBuildGenericTree(depts, 'deptId', 'parentDeptId', 'deptNm', 'sortOrd');
  };
  boUtil.bofBuildMenuTree = function () {
    const menus = window.useBoMenuStore?.()?.svMenus || window._boCmMenus || [];
    return window.coUtil.cofBuildGenericTree(menus, 'menuId', 'parentMenuId', 'menuNm', 'sortOrd');
  };
  boUtil.bofBuildRoleTree = function () {
    const roles = window.sfGetBoRoleStore?.()?.svRoles || [];
    return window.coUtil.cofBuildGenericTree(roles, 'roleId', 'parentRoleId', 'roleNm', 'sortOrd');
  };

  boUtil.bofGetPathLabel = function (pathId) {
    if (pathId == null) return '';
    const list = window._boCmPaths || [];
    const byId = Object.fromEntries(list.map(p => [p.pathId, p]));
    const labels = [];
    let cur = byId[pathId];
    while (cur) { labels.unshift(cur.pathLabel); cur = byId[cur.parentPathId]; }
    return labels.join(' > ');
  };

  /* useAppCodeReady → coUtil.cofUseAppCodeReady 로 통합. 호출처에서 coUtil 직접 호출 사용. */

  global.boUtil = boUtil;
  global.boCommonFilter = boCommonFilter;
})(typeof window !== 'undefined' ? window : globalThis);
