/* ShopJoy FO - 순수 유틸 함수 모음 (foAppBase.js 에서 분리)
 *   노출: window.foAppFunc = {
 *     fmtXHeaders, instantOrderToParams,
 *     logStatusClass, logIsRecent, fmtSec, logMethodStyle, fmtJson, logBadgeStyle
 *   }
 */
(function () {
  'use strict';

  /* X-헤더 배열 → 다중 행 압축 텍스트 */
  const fmtXHeaders = (headers) => {
    if (!headers || headers.length === 0) return '';
    const map = {};
    headers.forEach(h => {
      const idx = h.indexOf(': ');
      if (idx > -1) map[h.slice(0, idx).toLowerCase()] = h.slice(idx + 2);
    });
    const truncate = (v) => v && v.length > 10 ? v.slice(0, 5) + '...' + v.slice(-5) : (v || '');
    const NO_TRUNCATE = ['x-trace-id', 'x-line-no', 'x-site-type', 'x-site-id', 'x-site-no', 'x-func-nm', 'x-file-nm', 'authorization'];
    const fmtVal = (k, v) => k === 'x-func-nm' ? v + '()' : NO_TRUNCATE.includes(k) ? v : truncate(v);
    const row = (keys) => keys.filter(k => map[k]).map(k => `${k}: ${fmtVal(k, map[k])}`).join(' | ');
    const lines = [
      row(['x-site-type', 'x-ui-nm', 'x-cmd-nm']),
      row(['x-file-nm', 'x-func-nm', 'x-line-no']),
      row(['x-trace-id', 'x-site-id', 'x-buyer-id', 'x-license-code', 'x-user-agent', 'authorization']),
    ].filter(Boolean);
    const known = ['x-site-type','x-ui-nm','x-cmd-nm','x-file-nm','x-func-nm','x-line-no','x-trace-id','x-site-id','x-buyer-id','x-license-code','x-user-agent','authorization'];
    const rest = Object.entries(map).filter(([k]) => !known.includes(k)).map(([k,v]) => `${k}: ${truncate(v)}`).join(' | ');
    if (rest) lines.push(rest);
    return lines.join('\n');
  };

  /* 즉시주문 객체 → URL 해시 파라미터 */
  const instantOrderToParams = (io) => {
    if (!io) return {};
    return {
      prodId: io.prod?.prodId ?? '',
      opt1Nm: io.color?.name  ?? '',
      opt2Id: io.size         ?? '',
      qty:    io.qty          ?? 1,
    };
  };

  /* API 로그 — HTTP 상태코드 → CSS 색상 style */
  const logStatusClass = (status) => {
    if (!status) return 'color:#999;';
    if (status >= 500) return 'color:#e74c3c;font-weight:700;';
    if (status >= 400) return 'color:#e67e22;font-weight:700;';
    return 'color:#27ae60;font-weight:700;';
  };

  /* API 로그 — ts(YYYY-MM-DD HH:MM:SS)가 현재 기준 1분 이내면 true */
  const logIsRecent = (ts) => {
    try {
      const t = new Date(String(ts).replace(' ', 'T')).getTime();
      return !isNaN(t) && (Date.now() - t) <= 60000;
    } catch (_) { return false; }
  };

  /* 밀리초 → 초(소수1자리) 문자열. 1581ms → '1.5' */
  const fmtSec = (ms) => {
    const n = Number(ms);
    if (!n || isNaN(n)) return '';
    return (n / 1000).toFixed(1);
  };

  /* HTTP 메서드 → CSS style(배경+색상) */
  const logMethodStyle = (method) => {
    const m = (method || '').toUpperCase();
    if (m === 'GET')    return 'background:#e8f5e9;color:#388e3c;';
    if (m === 'POST')   return 'background:#e3f2fd;color:#1565c0;';
    if (m === 'PUT')    return 'background:#fff3e0;color:#e65100;';
    if (m === 'PATCH')  return 'background:#f3e5f5;color:#6a1b9a;';
    if (m === 'DELETE') return 'background:#fce4ec;color:#c62828;';
    return 'background:#f5f5f5;color:#555;';
  };

  /* JSON / 객체 → 들여쓰기 문자열 */
  const fmtJson = (data) => {
    try {
      if (data == null) return 'N/A';
      if (typeof data === 'string') return JSON.stringify(JSON.parse(data), null, 2);
      if (typeof data === 'object') return JSON.stringify(data, null, 2);
      return String(data);
    } catch (e) { return String(data); }
  };

  /* API 로그 — 상태코드 배지 인라인 style(2xx 초록 / 그 외 빨강) */
  const logBadgeStyle = (status) => {
    const ok = status >= 200 && status < 300;
    const c  = ok ? '#10b981' : '#ef4444';
    const bg = ok ? '#ecfdf5' : '#fef2f2';
    return `display:inline-block;padding:4px 8px;border-radius:2px;font-weight:700;font-size:11px;margin-left:4px;border:1px solid ${c};background:${bg};color:${c};`;
  };

  window.foAppFunc = {
    fmtXHeaders,
    instantOrderToParams,
    logStatusClass,
    logIsRecent,
    fmtSec,
    logMethodStyle,
    fmtJson,
    logBadgeStyle,
  };
})();
