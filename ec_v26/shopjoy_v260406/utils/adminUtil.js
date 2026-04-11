/* ShopJoy Admin - 공통 유틸리티 + 공통 필터 전역 상태 */
(function () {
  const { reactive } = Vue;

  /* ── 공통 필터 전역 상태 (window.adminCommonFilter) ── */
  window.adminCommonFilter = reactive({
    site:      null,  // { siteId, siteCode, siteName, ... }
    vendor:    null,  // { vendorId, vendorName, ... }
    adminUser: null,  // { adminUserId, name, loginId, ... }
    member:    null,  // { userId, member_nm, email, ... }
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

  /* ── API 호출 공통 헬퍼 ── */
  window.adminApiCall = async function(opts) {
    const {
      method = 'post', path, data,
      confirmTitle, confirmMsg,
      showConfirm, showToast, setApiRes,
      successMsg = '처리되었습니다.',
      onLocal,       /* 로컬 데이터 변경 콜백 (항상 실행) */
      navigate, navigateTo,
    } = opts;

    /* 1. 확인 다이얼로그 */
    if (confirmTitle && showConfirm) {
      const ok = await showConfirm(confirmTitle, confirmMsg || '진행하시겠습니까?');
      if (!ok) return false;
    }

    /* 2. 로컬 데이터 즉시 반영 (낙관적 업데이트) */
    if (onLocal) onLocal();

    /* 3. API 호출 */
    try {
      let res;
      const api = window.axiosApi;
      if (method === 'get')    res = await api.get(path);
      else if (method === 'post')   res = await api.post(path, data);
      else if (method === 'put')    res = await api.put(path, data);
      else if (method === 'patch')  res = await api.patch(path, data);
      else if (method === 'delete') res = await api.delete(path);
      const resData = { ok: true, status: res.status, data: res.data };
      if (setApiRes) setApiRes(resData);
      if (showToast) showToast(successMsg, 'success');
    } catch (err) {
      const errData = err.response
        ? { ok: false, status: err.response.status, data: err.response.data, message: err.message }
        : { ok: false, message: err.message };
      if (setApiRes) setApiRes(errData);
      const errMsg = (err.response && err.response.data && err.response.data.message)
        || err.message || '오류가 발생했습니다.';
      if (showToast) showToast(errMsg, 'error', 0); /* persistent */
    }

    /* 4. 화면 이동 */
    if (navigate && navigateTo) navigate(navigateTo);

    return true;
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
})();
