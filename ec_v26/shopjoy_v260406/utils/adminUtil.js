/* ShopJoy Admin - 공통 유틸리티 + 공통 필터 전역 상태 */
(function () {
  const { reactive } = Vue;

  /* ── 공통 필터 전역 상태 (window.adminCommonFilter) ── */
  window.adminCommonFilter = reactive({
    site:      null,  // { siteId, siteCode, siteName, ... }
    vendor:    null,  // { vendorId, vendorName, ... }
    adminUser: null,  // { adminUserId, name, loginId, ... }
    member:    null,  // { userId, name, email, ... }
    order:     null,  // { orderId, userName, ... }
  });

  /* 기본값: 첫 번째 사이트(ShopJoy)로 초기화 */
  if (window.adminData && window.adminData.sites && window.adminData.sites.length) {
    window.adminCommonFilter.site = window.adminData.sites[0];
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
})();
