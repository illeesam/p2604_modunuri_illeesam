/**
 * FO axios 클라이언트 (foApi)
 * - Bearer 토큰 자동 주입 (modu-fo-auth-accessToken)
 * - 401 → /auth/fo/refresh 로 토큰 재갱신 후 원 요청 재시도 (1회)
 * - request / response / error 콘솔 로그
 *
 * 선행: assets/cdn/pkg/axios/1.7.9/axios.min.js
 */
(function (global) {
  'use strict';
  if (!global.axios) throw new Error('foAxios: load axios first');

  /* ── URL 헬퍼 (bo/fo 공통) ──────────────────────────────── */
  function appBase() {
    var m = global.location.pathname.match(/^(.*shopjoy[^/]*)\//i);
    return m ? m[1] : '';
  }
  function pageUrl(path) {
    var p = String(path || '').replace(/^\//, '');
    return global.location.origin + appBase() + '/' + p;
  }
  function apiUrl(path) {
    if (/^https?:\/\//i.test(path)) return path;
    var p = String(path || '').replace(/^\//, '');
    var host = global.location.hostname || 'localhost';
    return 'http://' + host + ':3000/api/' + p;
  }
  global.appBase = global.appBase || appBase;
  global.pageUrl = global.pageUrl || pageUrl;
  global.apiUrl  = global.apiUrl  || apiUrl;

  /* ── 설정 ────────────────────────────────────────────────────── */
  var TAG              = '[fo]';
  var TIMEOUT          = 15000;

  var inst = global.axios.create({ timeout: TIMEOUT });

  /* ── Request: 토큰 주입 + 기본 헤더 설정 + 로그 ── */
  inst.interceptors.request.use(function (cfg) {
    try { if (typeof global._showProgress === 'function') global._showProgress(true); } catch (_) {}
    try { cfg._startAt = Date.now(); } catch (_) {}  /* 소요시간(duration) 계산용 시작시각 */
    try {
      cfg.headers = cfg.headers || {};
      /* Content-Type 기본값 설정 (이미 설정되어 있으면 유지) */
      if (!cfg.headers['Content-Type']) {
        cfg.headers['Content-Type'] = 'application/json';
      }
      /* Bearer 토큰 주입 */
      var t = localStorage.getItem('modu-fo-auth-accessToken');
      if (t) {
        cfg.headers.Authorization = 'Bearer ' + t;
      }
      /* X-App-Type-Cd — 호출 컨텍스트의 사용자 타입 (BO/FO/EXT).
         로그인 후에는 JWT claims 와 동일한 값. 비로그인 시에도 호출 출처 추적용으로 유지. */
      cfg.headers['X-App-Type-Cd'] = 'FO';
      /* X-Site-Type + X-Site-Id + X-Buyer-Id + X-License-Code 헤더 주입 */
      try {
        var lic = global.SHOPJOY_LICENSE_FO;
        if (lic) {
          if (lic.siteType)    cfg.headers['X-Site-Type']    = lic.siteType;
          if (lic.siteId)      cfg.headers['X-Site-Id']      = lic.siteId;
          if (lic.buyerId)     cfg.headers['X-Buyer-Id']     = lic.buyerId;
          if (lic.licenseCode) cfg.headers['X-License-Code'] = lic.licenseCode;
        }
      } catch (_) {}
      /* coUtil.cofApiHdr 미사용 호출 대비 — X-Trace-Id / X-File-Nm / X-Func-Nm / X-Line-No 자동 보충 */
      coUtil.cofFillTraceHeaders(cfg.headers);
    } catch (_) {}
    /* X-UI-Nm / X-Cmd-Nm: 필수 헤더 검증 */
    var chk = coUtil.cofCheckNmHeaders(cfg.headers, 'FO API');
    if (!chk.ok) {
      var errMsg = chk.errMsg + '\n\n' +
                   'Method: ' + (cfg.method || 'GET').toUpperCase() + '\n' +
                   'URL: ' + (cfg.url || '');
      try { if (typeof global.alert === 'function') global.alert(errMsg); } catch (_) {}
      console.error(TAG + ' ✗ REQUIRED HEADERS MISSING', { method: cfg.method, url: cfg.url });
      return Promise.reject(new Error('[FO API] 필수 헤더 누락: X-UI-Nm, X-Cmd-Nm'));
    }
    var uiNm = chk.uiNm, cmdNm = chk.cmdNm;
    /* X-UI-Nm / X-Cmd-Nm: 한글은 ISO-8859-1 불가 → encodeURIComponent로 인코딩 후 전송, 로그는 디코딩 */
    coUtil.cofEncodeNmHeaders(cfg.headers);
    var uiTag = coUtil.cofUiTag(uiNm, cmdNm);
    var displayUrl = coUtil.cofShortApiUrl(cfg.url);
    var fileNm  = cfg.headers['X-File-Nm']  || cfg.headers['x-file-nm']  || '';
    var funcNm  = cfg.headers['X-Func-Nm']  || cfg.headers['x-func-nm']  || '';
    var lineNo  = cfg.headers['X-Line-No']  || cfg.headers['x-line-no']  || '';
    var callerTag = fileNm ? (' | ' + fileNm + (funcNm ? ' ' + funcNm + (lineNo ? '(' + lineNo + ')' : '') : (lineNo ? '(' + lineNo + ')' : ''))) : '';
    console.log(TAG + ' ▣▶ ' + (cfg.method || 'GET').toUpperCase() + uiTag, displayUrl + callerTag, cfg.data || cfg.params || '');
    return cfg;
  }, function (err) {
    console.error(TAG + ' ✗ REQUEST ERROR', err && err.message);
    return Promise.reject(err);
  });

  /* ── AxiosHeaders 호환 헤더 읽기 — coUtil.cofReadHdr 위임 (로컬 별칭) ── */
  function getHdr(headers, key) { return coUtil.cofReadHdr(headers, key); }

  /* ── Response: 로그 + 401 재갱신 ── */
  var isRefreshing = false;
  var pending = [];
  function subscribe(cb) { pending.push(cb); }
  function flush(tok) { pending.forEach(function (cb) { cb(tok); }); pending = []; }

  inst.interceptors.response.use(function (res) {
    try { if (typeof global._showProgress === 'function') global._showProgress(false); } catch (_) {}
    var resCfg = res.config || {};
    var resUiTag = coUtil.cofUiTag(
      (resCfg.headers && (resCfg.headers['X-UI-Nm']  || resCfg.headers['x-ui-nm']))  || '',
      (resCfg.headers && (resCfg.headers['X-Cmd-Nm'] || resCfg.headers['x-cmd-nm'])) || ''
    );
    var resDisplayUrl = coUtil.cofShortApiUrl(resCfg.url || '');
    var resLogData = (function(d) {
      try {
        var inner = d?.data?.data ?? d?.data ?? d;
        var tot = function(x){ return x.pageTotalCount ?? x.totalCount ?? x.total ?? '?'; };
        if (inner == null) return null;
        if (Array.isArray(inner)) return { count: inner.length, list: inner };
        if (inner.pageList) return { count: inner.pageList.length, total: tot(inner), list: inner.pageList };
        if (inner.list)     return { count: inner.list.length,     total: tot(inner), list: inner.list };
        return inner;
      } catch(_){ return null; }
    })(res.data);
    if (resLogData) console.log(TAG + ' ◀▣ ' + res.status + resUiTag, resDisplayUrl, resLogData);
    else            console.log(TAG + ' ◀▣ ' + res.status + resUiTag, resDisplayUrl);
    try {
      var cfg = res.config || {};
      var method = (cfg.method || 'get').toUpperCase();
      var displayUrl = coUtil.cofShortApiUrl(cfg.url || '');
      var paramStr = cfg.params ? JSON.stringify(cfg.params) : '';
      var dataStr  = cfg.data  ? (typeof cfg.data === 'string' ? cfg.data : JSON.stringify(cfg.data)) : '';
      var detail   = [paramStr && ('params: ' + paramStr), dataStr && ('data: ' + dataStr)].filter(Boolean).join('\n');
      var uiLabel  = getHdr(cfg.headers, 'x-ui-nm') + (getHdr(cfg.headers, 'x-cmd-nm') ? ' > ' + getHdr(cfg.headers, 'x-cmd-nm') : '');

      // 요청 헤더에서 X- 정보 수집 (보냈던 정보)
      var reqHeaders = cfg.headers || {};
      var reqHeaderInfo = [];
      (function collectReqHeaders(h) {
        var keys = [];
        try { keys = Object.keys(h); } catch (_) {}
        keys.forEach(function (k) {
          if (k.toLowerCase().startsWith('x-')) {
            var v = getHdr(h, k);
            if (v) reqHeaderInfo.push(k.toLowerCase() + ': ' + v);
          }
        });
        var auth = getHdr(h, 'Authorization') || getHdr(h, 'authorization');
        if (auth) reqHeaderInfo.push('authorization: ' + auth.slice(0, 7) + auth.slice(7, 12) + '...(' + auth.length + ')');
      })(reqHeaders);

      // 응답 헤더에서 X- 정보 수집 (받은 정보) — AxiosHeaders/plain object 모두 안전 처리
      var resHeaders = res.headers || {};
      var resHeaderInfo = [];
      if (resHeaders && typeof resHeaders.forEach === 'function') {
        resHeaders.forEach(function (val, key) {
          if (key.toLowerCase().startsWith('x-')) { resHeaderInfo.push(key + ': ' + val); }
        });
      } else {
        Object.keys(resHeaders).forEach(function (key) {
          if (key.toLowerCase().startsWith('x-')) { resHeaderInfo.push(key + ': ' + resHeaders[key]); }
        });
      }

      var sDuration = resCfg._startAt ? (Date.now() - resCfg._startAt) : null;       /* 소요시간(ms) */
      var sReqData = (resCfg.data != null ? resCfg.data : (resCfg.params != null ? resCfg.params : null)); /* 요청 본문/파라미터 */
      global.dispatchEvent(new CustomEvent('api-response-success', {
        detail: { scope: 'fo', method: method, url: displayUrl, status: res.status, data: res.data, reqData: sReqData, duration: sDuration, detail: detail, uiLabel: uiLabel, reqHeaders: reqHeaderInfo, resHeaders: resHeaderInfo },
      }));
    } catch (_) {}
    return res;
  }, function (err) {
    try { if (typeof global._showProgress === 'function') global._showProgress(false); } catch (_) {}
    var res = err.response;
    var cfg = err.config || {};
    var status = res && res.status;
    var errDisplayUrl = coUtil.cofShortApiUrl(cfg.url);
    console.error(TAG + ' ✗ ' + (status || 'NETWORK'), errDisplayUrl, err.message);

    /* 200-299 범위가 아닌 모든 응답 → toast 출력 */
    if ((status && (status < 200 || status >= 300)) || !status) {
      cfg._notified = true;
      var errMsg = (res && res.data && res.data.message) || err.message || '오류가 발생했습니다.';
      var errorDetails = '';
      try {
        // 상세 오류 정보 수집 — details 영역 맨 위에 message 우선 표시
        if (res && res.data) {
          var details = [];
          if (res.data.message) details.push('━━ 메시지 ━━\n' + res.data.message);
          if (res.data.descErrStack) details.push(res.data.descErrStack);
          if (res.data.stackTrace) details.push('Stack Trace:\n' + res.data.stackTrace);
          if (res.data.details) details.push('Details:\n' + JSON.stringify(res.data.details, null, 2));
          if (res.data.errors) details.push('Errors:\n' + JSON.stringify(res.data.errors, null, 2));
          errorDetails = details.join('\n\n');
        }
        if (!errorDetails && err.message) errorDetails = err.message;
      } catch (_) {}
      try {
        // URL 정리 (localhost/127로 시작하면 /api/... 형태로 표시)
        var displayUrl = coUtil.cofShortApiUrl(cfg.url);
        var uiLabel = getHdr(cfg.headers, 'x-ui-nm') + (getHdr(cfg.headers, 'x-cmd-nm') ? ' > ' + getHdr(cfg.headers, 'x-cmd-nm') : '');

        // 요청 헤더에서 X- 정보 수집
        var errReqHeaders = cfg.headers || {};
        var errReqHeaderInfo = [];
        (function collectReqHeaders(h) {
          var keys = [];
          try { keys = Object.keys(h); } catch (_) {}
          keys.forEach(function (k) {
            if (k.toLowerCase().startsWith('x-')) {
              var v = getHdr(h, k);
              if (v) errReqHeaderInfo.push(k.toLowerCase() + ': ' + v);
            }
          });
          var auth = getHdr(h, 'Authorization') || getHdr(h, 'authorization');
          if (auth) errReqHeaderInfo.push('authorization: ' + auth.slice(0, 7) + auth.slice(7, 12) + '...(' + auth.length + ')');
        })(errReqHeaders);

        // 응답 헤더에서 X- 정보 수집
        var errResHeaders = (res && res.headers) || {};
        var errResHeaderInfo = [];
        if (errResHeaders && typeof errResHeaders.forEach === 'function') {
          errResHeaders.forEach(function (val, key) {
            if (key.toLowerCase().startsWith('x-')) {
              errResHeaderInfo.push(key + ': ' + val);
            }
          });
        }

        var eDuration = cfg._startAt ? (Date.now() - cfg._startAt) : null;            /* 소요시간(ms) */
        var eReqData = (cfg.data != null ? cfg.data : (cfg.params != null ? cfg.params : null)); /* 요청 본문/파라미터 */
        global.dispatchEvent(new CustomEvent('api-response-error', {
          detail: { scope: 'fo', method: (cfg.method || 'get').toUpperCase(), url: displayUrl, status: status || 0, message: errMsg, data: res && res.data, reqData: eReqData, duration: eDuration, errorDetails: errorDetails, uiLabel: uiLabel, reqHeaders: errReqHeaderInfo, resHeaders: errResHeaderInfo },
        }));
      } catch (_) {}
    }

    if (status === 401 && !cfg._retry) {
      cfg._retry = true;
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          subscribe(function (newTok) {
            if (!newTok) return reject(err);
            cfg.headers = cfg.headers || {};
            cfg.headers.Authorization = 'Bearer ' + newTok;
            resolve(inst(cfg));
          });
        });
      }
      isRefreshing = true;
      var expiredToken = null;
      try { expiredToken = localStorage.getItem('modu-fo-auth-accessToken'); } catch (_) {}
      return global.axios.post(apiUrl('co/fo-auth/token-refresh'), null, {
          headers: { Authorization: expiredToken ? 'Bearer ' + expiredToken : '' }
        })
        .then(function (r) {
          var d = r && r.data && r.data.data || r && r.data;
          var newTok = d && (d.accessToken || d.token);
          if (!newTok) throw new Error('no token in refresh response');
          try { localStorage.setItem('modu-fo-auth-accessToken', newTok); } catch (_) {}
          flush(newTok);
          isRefreshing = false;
          cfg.headers = cfg.headers || {};
          cfg.headers.Authorization = 'Bearer ' + newTok;
          return inst(cfg);
        })
        .catch(function (e) {
          flush(null);
          isRefreshing = false;
          try {
            localStorage.removeItem('modu-fo-auth-accessToken');
            localStorage.removeItem('modu-fo-auth-authUser');
          } catch (_) {}
          if (global.foAuth && typeof global.foAuth.logout === 'function') {
            try { global.foAuth.logout(); } catch (_) {}
          }
          try {
            global.dispatchEvent(new CustomEvent('api-response-error', {
              detail: { scope: 'fo', status: 401, url: cfg.url, message: 'session expired' },
            }));
          } catch (_) {}
          return Promise.reject(err);
        });
    }
    return Promise.reject(err);
  });

  /* ── path → apiUrl 변환 래퍼 ── */
  global.foApi = {
    get:    function (path, cfg) {
      return inst.get(apiUrl(path), cfg);
    },
    delete: function (path, cfg)       { return inst.delete(apiUrl(path), cfg); },
    post:   function (path, data, cfg) { return inst.post(apiUrl(path), data, cfg); },
    put:    function (path, data, cfg) { return inst.put(apiUrl(path), data, cfg); },
    patch:  function (path, data, cfg) { return inst.patch(apiUrl(path), data, cfg); },
    raw:    inst,
  };
})(typeof window !== 'undefined' ? window : this);
