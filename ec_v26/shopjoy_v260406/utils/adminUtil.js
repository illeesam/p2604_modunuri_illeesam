/* ShopJoy Admin - 공통 유틸리티 + 공통 필터 전역 상태 */
(function () {
  const { reactive } = Vue;

  /* ── 공통 필터 전역 상태 (window.adminCommonFilter) ── */
  window.adminCommonFilter = reactive({
    siteId:   null,   // sy_site.siteId
    vendorId: null,   // sy_vendor.vendorId (판매업체)
    dlivVendorId: null, // sy_vendor.vendorId (배송업체)
    userId:   null,   // sy_user.userId (관리자)
    memberId: null,   // ec_member.memberId
    orderId:  null,   // ec_order.orderId
  });

  /* 기본값: 첫 번째 사이트(ShopJoy)로 초기화 */
  if (window.adminData && window.adminData.sites && window.adminData.sites.length) {
    window.adminCommonFilter.siteId = window.adminData.sites[0]?.siteId ?? null;
  }

  /* ── 등록기간 옵션 ── */
  const DATE_RANGE_OPTIONS = [
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

  function getDateRange(range) {
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

  /* dateStr 이 range 범위 내에 있으면 true. dateStr 없으면 항상 true */
  function isInRange(dateStr, range) {
    if (!dateStr) return true;
    if (!range || range === 'all') return true;
    const r = getDateRange(range);
    if (!r) return true;
    const d = String(dateStr).slice(0, 10);
    return d >= r.from && d <= r.to;
  }

  window.adminUtil = { DATE_RANGE_OPTIONS, getDateRange, isInRange };

  /* ── 공개 대상(Visibility) 유틸 ──
   * 저장 포맷: '^MEMBER^VIP^' (양끝 ^ 래핑). 공개 안 함=''.
   */
  window.visibilityUtil = {
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
      const c = (window.adminData?.codes || [])
        .find(x => x.codeGrp === 'VISIBILITY_TARGET' && x.codeValue === code);
      return c?.codeLabel || code;
    },
    allOptions() {
      return (window.adminData?.codes || [])
        .filter(x => x.codeGrp === 'VISIBILITY_TARGET' && x.useYn === 'Y')
        .sort((a,b) => (a.sortOrd||0) - (b.sortOrd||0));
    },
  };

  window.adminUtil.getSiteNm = function() {
    if (!window.adminCommonFilter.siteId) return 'ShopJoy';
    const site = window.adminData?.sites?.find(s => s.siteId === window.adminCommonFilter.siteId);
    return site?.siteNm || 'ShopJoy';
  };

  /* ── CSV/엑셀 다운로드 ──
     columns: [{ label:'표시명', key:'필드명' } | { label:'표시명', value: row => ... }]
  ── */
  window.adminUtil.exportCsv = function(rows, columns, filename) {
    const header = columns.map(c => `"${c.label}"`).join(',');
    const body = rows.map(row =>
      columns.map(c => {
        const val = typeof c.value === 'function' ? c.value(row) : (row[c.key] ?? '');
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');
    const bom = '\uFEFF'; // UTF-8 BOM (한글 깨짐 방지)
    const blob = new Blob([bom + header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename || 'export.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  /* ──────────────────────────────────────────────
     sy_path 기반 트리 헬퍼 (공통)
  ────────────────────────────────────────────── */
  window.adminUtil.buildPathTree = function (bizCd) {
    const list = (window.adminData.paths || [])
      .filter(p => p.bizCd === bizCd && p.useYn !== 'N');
    const byParent = {};
    list.forEach(p => {
      const k = p.parentPathId == null ? '__root__' : p.parentPathId;
      (byParent[k] = byParent[k] || []).push(p);
    });
    const build = (parentKey) => (byParent[parentKey] || [])
      .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
      .map(p => ({
        pathId: p.pathId, path: p.pathId,
        name: p.pathLabel, pathLabel: p.pathLabel,
        userAdded: !!p._userAdded,
        children: build(p.pathId), count: 0,
      }));
    const root = {
      pathId: null, path: null, name: '전체', pathLabel: '전체',
      children: build('__root__'), count: list.length,
    };
    const recur = (n) => { n.count = (n.children || []).reduce((s, c) => s + recur(c) + 1, 0); return n.count; };
    recur(root);
    return root;
  };

  window.adminUtil.getPathDescendants = function (bizCd, pathId) {
    if (pathId == null) return null;
    const set = new Set([pathId]);
    const list = (window.adminData.paths || []).filter(p => p.bizCd === bizCd);
    let added = true;
    while (added) {
      added = false;
      list.forEach(p => {
        if (set.has(p.parentPathId) && !set.has(p.pathId)) { set.add(p.pathId); added = true; }
      });
    }
    return set;
  };

  /* 일반 부모-자식 트리 빌더
   * items: 배열, idKey: PK, parentKey: 부모 FK, labelKey: 표시명, sortKey: 정렬 (선택)
   */
  window.adminUtil.buildGenericTree = function (items, idKey, parentKey, labelKey, sortKey) {
    const list = (items || []).filter(x => x.useYn !== 'N');
    const byParent = {};
    list.forEach(x => {
      const k = x[parentKey] == null ? '__root__' : x[parentKey];
      (byParent[k] = byParent[k] || []).push(x);
    });
    const build = (pk) => (byParent[pk] || [])
      .sort((a, b) => (a[sortKey] || 0) - (b[sortKey] || 0))
      .map(x => ({
        pathId: x[idKey], path: x[idKey],
        name: x[labelKey], pathLabel: x[labelKey],
        children: build(x[idKey]), count: 0,
        _raw: x,
      }));
    const root = { pathId: null, path: null, name: '전체', pathLabel: '전체',
                   children: build('__root__'), count: list.length };
    const recur = (n) => { n.count = (n.children || []).reduce((s, c) => s + recur(c) + 1, 0); return n.count; };
    recur(root);
    return root;
  };
  window.adminUtil.buildDeptTree = function () {
    return window.adminUtil.buildGenericTree(window.adminData.depts, 'deptId', 'parentId', 'deptNm', 'sortOrd');
  };
  window.adminUtil.buildMenuTree = function () {
    return window.adminUtil.buildGenericTree(window.adminData.menus, 'menuId', 'parentId', 'menuNm', 'sortOrd');
  };
  window.adminUtil.buildRoleTree = function () {
    return window.adminUtil.buildGenericTree(window.adminData.roles, 'roleId', 'parentId', 'roleNm', 'sortOrd');
  };
  /* 일반 트리 후손 ID Set */
  window.adminUtil.collectDescendantIds = function (items, idKey, parentKey, rootId) {
    if (rootId == null) return null;
    const set = new Set([rootId]);
    let added = true;
    while (added) {
      added = false;
      (items || []).forEach(x => {
        if (set.has(x[parentKey]) && !set.has(x[idKey])) { set.add(x[idKey]); added = true; }
      });
    }
    return set;
  };

  /* 트리에서 N레벨까지 펼친 pathId Set 반환 (root=null 포함) */
  window.adminUtil.collectExpandedToDepth = function (tree, maxDepth) {
    const set = new Set([null]);
    const walk = (n, d) => {
      if (d >= maxDepth) return;
      (n.children || []).forEach(ch => { set.add(ch.pathId); walk(ch, d + 1); });
    };
    walk(tree, 0);
    return set;
  };

  window.adminUtil.getPathLabel = function (pathId) {
    if (pathId == null) return '';
    const list = window.adminData.paths || [];
    const byId = Object.fromEntries(list.map(p => [p.pathId, p]));
    const labels = [];
    let cur = byId[pathId];
    while (cur) { labels.unshift(cur.pathLabel); cur = byId[cur.parentPathId]; }
    return labels.join(' > ');
  };
})();
