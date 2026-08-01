/* ShopJoy BO - 순수 유틸 함수 모음 (boAppBase.js 에서 분리)
 *   노출: window.boAppFunc = {
 *     fmtXHeaders, fmtJson,
 *     isWithin60Seconds, fmtSec, shortUrl, hmsToMs, relativeTime, apiStatusColor
 *   }
 */
(function () {
  'use strict';

  /* X-헤더 배열 → 다중 행 압축 텍스트 */
  const fmtXHeaders = (headers) => {
    if (!headers || headers.length === 0) return '';
    const map = {};
    headers.forEach((h) => {
      const idx = h.indexOf(': ');
      if (idx > -1) map[h.slice(0, idx).toLowerCase()] = h.slice(idx + 2);
    });
    const truncate = (v) => (v && v.length > 10 ? v.slice(0, 5) + '...' + v.slice(-5) : v || '');
    const NO_TRUNCATE = [
      'x-trace-id', 'x-line-no', 'x-site-type', 'x-site-id', 'x-site-no',
      'x-func-nm', 'x-file-nm', 'authorization',
    ];
    const fmtVal = (k, v) => (k === 'x-func-nm' ? v + '()' : NO_TRUNCATE.includes(k) ? v : truncate(v));
    const row = (keys) =>
      keys.filter((k) => map[k]).map((k) => `${k}: ${fmtVal(k, map[k])}`).join(' | ');
    const lines = [
      row(['x-site-type', 'x-ui-nm', 'x-cmd-nm']),
      row(['x-file-nm', 'x-func-nm', 'x-line-no']),
      row(['x-trace-id', 'x-site-id', 'x-buyer-id', 'x-license-code', 'x-user-agent', 'authorization']),
    ].filter(Boolean);
    const known = [
      'x-site-type', 'x-ui-nm', 'x-cmd-nm', 'x-file-nm', 'x-func-nm', 'x-line-no',
      'x-trace-id', 'x-site-id', 'x-buyer-id', 'x-license-code', 'x-user-agent', 'authorization',
    ];
    const rest = Object.entries(map)
      .filter(([k]) => !known.includes(k))
      .map(([k, v]) => `${k}: ${truncate(v)}`)
      .join(' | ');
    if (rest) lines.push(rest);
    return lines.join('\n');
  };

  /* JSON / 객체 → 들여쓰기 문자열 */
  const fmtJson = (data) => {
    try {
      if (!data) return 'N/A';
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        return JSON.stringify(parsed, null, 2);
      } else if (typeof data === 'object') {
        return JSON.stringify(data, null, 2);
      }
      return String(data);
    } catch (e) {
      return String(data);
    }
  };

  /* HH:MM:SS 형식 타임스탬프가 현재 시각 기준 60초 이내인지 */
  const isWithin60Seconds = (timeStr) => {
    try {
      const [hh, mm, ss] = timeStr.replace('s', '').split(':').map(Number);
      const logTime = hh * 3600 + mm * 60 + ss;
      const now = new Date();
      const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const diff = Math.abs(currentTime - logTime);
      return diff <= 60 || (diff > 86400 - 60 && diff < 86400);
    } catch (_) {
      return false;
    }
  };

  /* 밀리초 → 초(소수1자리) 문자열. 1581ms → '1.5' */
  const fmtSec = (ms) => {
    const n = Number(ms);
    if (!n || isNaN(n)) return '';
    return (n / 1000).toFixed(1);
  };

  /* URL 단축 (coUtil.cofShortApiUrl 위임) */
  const shortUrl = (url) => {
    try { return window.coUtil && coUtil.cofShortApiUrl ? coUtil.cofShortApiUrl(url || '') : (url || ''); }
    catch (_) { return url || ''; }
  };

  /* 'HH:MM:SSs' → 'MM:SS' 문자열 */
  const hmsToMs = (t) => {
    if (!t) return '';
    const c = String(t).replace('s', '').split(':');
    return c.length >= 3 ? (c[1] + ':' + c[2]) : String(t).replace('s', '');
  };

  /* HH:MM:SS → "N분N초전" 상대 시간 텍스트 */
  const relativeTime = (timeStr) => {
    try {
      const [hh, mm, ss] = timeStr.replace('s', '').split(':').map(Number);
      const logTime = hh * 3600 + mm * 60 + ss;
      const now = new Date();
      const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      let diff = currentTime - logTime;
      if (diff < 0) { diff += 86400; }
      if (diff < 60) { return `${diff}초전`; }
      else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        return `${minutes}분${seconds}초전`;
      }
      return timeStr;
    } catch (_) {
      return timeStr;
    }
  };

  /* HTTP 상태코드 → hex 색상 */
  const apiStatusColor = (status) => {
    if (status >= 200 && status < 300) return '#10b981';
    if (status >= 300 && status < 400) return '#3b82f6';
    if (status >= 400 && status < 500) return '#f59e0b';
    if (status >= 500) return '#ef4444';
    return '#6b7280';
  };

  window.boAppFunc = {
    fmtXHeaders,
    fmtJson,
    isWithin60Seconds,
    fmtSec,
    shortUrl,
    hmsToMs,
    relativeTime,
    apiStatusColor,
  };
})();
