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
    { value: '1day',      label: '1일' },
    { value: '3days',     label: '3일' },
    { value: '1week',     label: '1주일' },
    { value: '1month',    label: '1달' },
    { value: '3months',   label: '3달' },
    { value: '6months',   label: '6달' },
    { value: '1year',     label: '1년' },
    { value: 'thismonth', label: '이번달' },
    { value: 'thisyear',  label: '이번년' },
    { value: 'lastyear',  label: '작년' },
  ];

  /* ── 날짜 헬퍼 ──
     _addDays/_addMonths 의 toISOString 은 그대로 둔다.
     base 가 'YYYY-MM-DD' 문자열이면 new Date(base) 가 UTC 자정으로 파싱되므로
     toISOString 으로 되돌릴 때 짝이 맞아 왕복이 정확하다.
     여기만 coUtil.cofToYmd(로컬 기준)로 바꾸면 오히려 하루 어긋난다.
     반면 아래 bofGetDateRange 의 today 는 new Date()(현재시각) 기반이라
     toISOString 을 쓰면 KST 00~08시에 전날이 나와 cofToYmd 를 쓴다. */
  function _addDays(base, days) {
    const d = new Date(base); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10);
  }
  function _addMonths(base, m) {
    const d = new Date(base); d.setMonth(d.getMonth() + m); return d.toISOString().slice(0, 10);
  }

  function bofGetDateRange(range) {
    const today = coUtil.cofToYmd(new Date());
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
      case 'thismonth': {
        const [y, m] = today.split('-');
        const lastDay = String(new Date(Number(y), Number(m), 0).getDate()).padStart(2, '0');
        return { from: `${y}-${m}-01`, to: `${y}-${m}-${lastDay}` };
      }
      case 'thisyear':   return { from: `${year}-01-01`,        to: `${year}-12-31` };
      case 'lastyear':   return { from: `${year-1}-01-01`,      to: `${year-1}-12-31` };
      case 'yearbefore': return { from: `${year-2}-01-01`,      to: `${year-2}-12-31` };
      default:           return { from: _addMonths(today, -3),  to: today };
    }
  }

  /* bofApplyDateRange — range 옵션(예: '1month','이번달')을 obj 의 시작/종료 키에 적용.
   *   각 화면의 `if(p.dateRange){const r=bofGetDateRange(...);p.dateRangeStart=r?r.from:'';...}` 복붙 대체.
   *   range 인자 생략 시 obj[rangeKey](기본 'dateRange') 값을 사용.
   *   range 가 빈값이면 시작/종료를 비우지 않고 그대로 둔다(직접 입력 보존).
   *   사용:
   *     boUtil.bofApplyDateRange(searchParam);                       // obj.dateRange → dateRangeStart/dateRangeEnd
   *     boUtil.bofApplyDateRange(uiState, '이번달', 'dateRangeStart', 'dateRangeEnd'); */
  function bofApplyDateRange(obj, range, startKey, endKey, rangeKey) {
    if (!obj) return;
    const sk = startKey || 'dateRangeStart', ek = endKey || 'dateRangeEnd';
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
        .find(x => x.codeGrp === 'VISIBILITY_TARGETS' && x.codeValue === code);
      return c?.codeLabel || code;
    },
    allOptions() {
      return (window.sfGetBoCodeStore?.()?.svCodes || [])
        .filter(x => x.codeGrp === 'VISIBILITY_TARGETS' && x.useYn === 'Y')
        .sort((a,b) => (a.sortOrd||0) - (b.sortOrd||0));
    },
  };

  /**
   * bofOpenKanbanPopup — 주문/클레임 칸반 보드를 별도 창으로 연다.
   *
   * 목록 화면의 [칸반] 은 탭으로 열어 목록을 가리므로, 목록을 보면서 상태를 옮기고 싶을 때
   * 쓰는 별도 진입점이다(주문관리·클레임관리의 [⧉] 버튼). 탭 진입은 그대로 남아 있다.
   * 같은 출처라 팝업이 localStorage 의 토큰을 그대로 쓴다 — 재로그인 불필요.
   * 창 이름을 주문ID 로 구분해 다른 주문은 새 창, 같은 주문은 기존 창을 재사용한다.
   *
   * @param {string} orderId   주문 ID (필수)
   * @param {string} [claimId] 강조할 클레임 ID
   * @param {Function} [showToast] 팝업 차단 시 안내용
   * @param {string} [orderItemId] 강조할 주문항목 ID (주문항목관리 등 항목 단위 화면에서 사용)
   */
  boUtil.bofOpenKanbanPopup = function (orderId, claimId, showToast, orderItemId) {
    if (!orderId) { return null; }
    let url = 'bo-od-order-kanban-pop.html?orderId=' + encodeURIComponent(orderId);
    if (claimId)     { url += '&claimId=' + encodeURIComponent(claimId); }
    if (orderItemId) { url += '&orderItemId=' + encodeURIComponent(orderItemId); }
    const win = window.open(window.pageUrl(url), 'odKanbanBoard',
      'width=1480,height=900,resizable=yes,scrollbars=yes');
    if (!win) {
      if (showToast) { showToast('팝업이 차단되었습니다. 브라우저의 팝업 차단을 해제해주세요.', 'error', 0); }
      return null;
    }
    win.focus();
    return win;
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

  boUtil.bofGetPathLabel = function (pathId) {
    if (pathId == null) return '';
    const list = window._boCmPaths || [];
    const byId = Object.fromEntries(list.map(p => [p.pathId, p]));
    const labels = [];
    let cur = byId[pathId];
    while (cur) { labels.unshift(cur.pathLabel); cur = byId[cur.parentPathId]; }
    return labels.join(' > ');
  };

  /* useAppCodeReady 는 폐기(2026-07-30). 코드 적재는 화면의 fnLoadCodes 안에서
     codeStore.saLoadCodes([...], {compNm: 'boUtil'}) 로 하고, 호출 시점은 initPage 가 정한다. */

  /* bofLoadSiteOptions — BO 검색조건 사이트 select 옵션 (sy_site 전체, 세션 내 1회만 조회 캐시)
     그리드 컬럼 정의의 options: () => siteOptions 형태로 재사용 */
  let _siteOptionsCache = null;
  boUtil.bofLoadSiteOptions = async function () {
    if (_siteOptionsCache) return _siteOptionsCache;
    try {
      const res = await coApiSvc.sySite.getSiteList({}, '공통', '사이트목록조회');
      _siteOptionsCache = (res.data?.data || []).map(s => ({ value: s.siteId, label: s.siteNm }));
    } catch (e) {
      console.warn('[boUtil.bofLoadSiteOptions] 사이트 목록 조회 실패:', e);
      _siteOptionsCache = [];
    }
    return _siteOptionsCache;
  };

  global.boUtil = boUtil;
  global.boCommonFilter = boCommonFilter;
})(typeof window !== 'undefined' ? window : globalThis);
