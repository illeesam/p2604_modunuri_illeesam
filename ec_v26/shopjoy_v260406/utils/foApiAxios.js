/**
 * FO axios 클라이언트 (foApi)
 * - Bearer 토큰 자동 주입 (modu-fo-accessToken)
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
  var ACCESS_TOKEN_KEY = 'modu-fo-accessToken';
  var REFRESH_URL      = 'co/fo-auth/token-refresh';
  var TIMEOUT          = 15000;

  var inst = global.axios.create({ timeout: TIMEOUT });

  /* ── Request: 토큰 주입 + 기본 헤더 설정 + 로그 ── */
  inst.interceptors.request.use(function (cfg) {
    try { if (typeof global._showProgress === 'function') global._showProgress(true); } catch (_) {}
    try {
      cfg.headers = cfg.headers || {};
      /* Content-Type 기본값 설정 (이미 설정되어 있으면 유지) */
      if (!cfg.headers['Content-Type']) {
        cfg.headers['Content-Type'] = 'application/json';
      }
      /* Bearer 토큰 주입 */
      var t = localStorage.getItem(ACCESS_TOKEN_KEY);
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
      /* coUtil.apiHdr 미사용 호출 대비 — X-Trace-Id / X-File-Nm / X-Func-Nm / X-Line-No 자동 보충 */
      try {
        if (!cfg.headers['X-Trace-Id'] && !cfg.headers['x-trace-id']) {
          var now = new Date();
          var pad = function(n){ return String(n).padStart(2,'0'); };
          var rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
          cfg.headers['X-Trace-Id'] = now.getFullYear() + pad(now.getMonth()+1) + pad(now.getDate()) +
            '_' + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds()) + '_' + rand;
          /* 호출 위치 정보도 보충 */
          try {
            var stack = new Error().stack.split('\n');
            for (var si = 1; si < stack.length; si++) {
              if (!stack[si].includes('foApiAxios.js') && !stack[si].includes('axios.min.js') && !stack[si].includes('coApiSvc.js') && !stack[si].includes('foApiSvc.js')) {
                var fm = stack[si].match(/([a-zA-Z0-9_-]+\.js)/);
                var fnm = stack[si].match(/at\s+(?:Object\.)?([a-zA-Z0-9_$.<>]+)\s+/);
                var lm = stack[si].match(/:(\d+):\d+[\)$]/);
                if (fm) cfg.headers['X-File-Nm'] = fm[1];
                if (fnm && fnm[1] !== '<anonymous>') cfg.headers['X-Func-Nm'] = fnm[1];
                if (lm) cfg.headers['X-Line-No'] = lm[1];
                break;
              }
            }
          } catch (_) {}
        }
      } catch (_) {}
    } catch (_) {}
    /* X-UI-Nm / X-Cmd-Nm: 필수 헤더 검증 */
    var uiNm  = (cfg.headers && (cfg.headers['X-UI-Nm']  || cfg.headers['x-ui-nm']))  || '';
    var cmdNm = (cfg.headers && (cfg.headers['X-Cmd-Nm'] || cfg.headers['x-cmd-nm'])) || '';
    if (!uiNm || !cmdNm) {
      var missingHeaders = [];
      if (!uiNm) missingHeaders.push('X-UI-Nm');
      if (!cmdNm) missingHeaders.push('X-Cmd-Nm');
      var errMsg = '[FO API] 필수 헤더 누락: ' + missingHeaders.join(', ') + '\n\n' +
                   'Method: ' + (cfg.method || 'GET').toUpperCase() + '\n' +
                   'URL: ' + (cfg.url || '') + '\n' +
                   'X-UI-Nm: ' + (uiNm || '(미설정)') + '\n' +
                   'X-Cmd-Nm: ' + (cmdNm || '(미설정)');
      try { if (typeof global.alert === 'function') global.alert(errMsg); } catch (_) {}
      console.error(TAG + ' ✗ REQUIRED HEADERS MISSING', { method: cfg.method, url: cfg.url, uiNm: uiNm, cmdNm: cmdNm });
      return Promise.reject(new Error('[FO API] 필수 헤더 누락: X-UI-Nm, X-Cmd-Nm'));
    }
    /* X-UI-Nm / X-Cmd-Nm: 한글은 ISO-8859-1 불가 → encodeURIComponent로 인코딩 후 전송, 로그는 디코딩 */
    try {
      if (cfg.headers['X-UI-Nm'])  cfg.headers['X-UI-Nm']  = encodeURIComponent(cfg.headers['X-UI-Nm']);
      if (cfg.headers['X-Cmd-Nm']) cfg.headers['X-Cmd-Nm'] = encodeURIComponent(cfg.headers['X-Cmd-Nm']);
    } catch (_) {}
    try { uiNm  = uiNm  ? decodeURIComponent(uiNm)  : ''; } catch (_) {}
    try { cmdNm = cmdNm ? decodeURIComponent(cmdNm) : ''; } catch (_) {}
    var uiTag = uiNm ? (' [' + uiNm + (cmdNm ? ' > ' + cmdNm : '') + ']') : '';
    var displayUrl = cfg.url;
    if (displayUrl && (displayUrl.includes('localhost') || displayUrl.includes('127'))) {
      var pathMatch = displayUrl.match(/\/api(\/.*)?$/);
      if (pathMatch) displayUrl = pathMatch[0];
    }
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

  /* ── AxiosHeaders 호환 헤더 읽기 (axios 1.x는 키를 소문자로 정규화) + URL 디코딩 ── */
  function getHdr(headers, key) {
    if (!headers) return '';
    var v = (typeof headers.get === 'function') ? (headers.get(key) || '') : (headers[key] || headers[key.toLowerCase()] || '');
    try { return v ? decodeURIComponent(v) : ''; } catch (_) { return v; }
  }

  /* ── Response: 로그 + 401 재갱신 ── */
  var isRefreshing = false;
  var pending = [];
  function subscribe(cb) { pending.push(cb); }
  function flush(tok) { pending.forEach(function (cb) { cb(tok); }); pending = []; }

  inst.interceptors.response.use(function (res) {
    try { if (typeof global._showProgress === 'function') global._showProgress(false); } catch (_) {}
    var resCfg = res.config || {};
    var resUiNm  = (resCfg.headers && (resCfg.headers['X-UI-Nm']  || resCfg.headers['x-ui-nm']))  || '';
    var resCmdNm = (resCfg.headers && (resCfg.headers['X-Cmd-Nm'] || resCfg.headers['x-cmd-nm'])) || '';
    try { resUiNm  = resUiNm  ? decodeURIComponent(resUiNm)  : ''; } catch (_) {}
    try { resCmdNm = resCmdNm ? decodeURIComponent(resCmdNm) : ''; } catch (_) {}
    var resUiTag = resUiNm ? (' [' + resUiNm + (resCmdNm ? ' > ' + resCmdNm : '') + ']') : '';
    var resDisplayUrl = resCfg.url || '';
    if (resDisplayUrl && (resDisplayUrl.includes('localhost') || resDisplayUrl.includes('127'))) {
      var resPathMatch = resDisplayUrl.match(/\/api(\/.*)?$/);
      if (resPathMatch) resDisplayUrl = resPathMatch[0];
    }
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
      var displayUrl = cfg.url || '';
      if (displayUrl && (displayUrl.includes('localhost') || displayUrl.includes('127'))) {
        var pathMatch = displayUrl.match(/\/api(\/.*)?$/);
        if (pathMatch) displayUrl = pathMatch[0];
      }
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

      // 응답 헤더에서 X- 정보 수집 (받은 정보)
      var resHeaders = res.headers || {};
      var resHeaderInfo = [];
      resHeaders.forEach(function (val, key) {
        if (key.toLowerCase().startsWith('x-')) {
          resHeaderInfo.push(key + ': ' + val);
        }
      });

      global.dispatchEvent(new CustomEvent('api-success', {
        detail: { scope: 'fo', method: method, url: displayUrl, status: res.status, detail: detail, uiLabel: uiLabel, reqHeaders: reqHeaderInfo, resHeaders: resHeaderInfo },
      }));
    } catch (_) {}
    return res;
  }, function (err) {
    try { if (typeof global._showProgress === 'function') global._showProgress(false); } catch (_) {}
    var res = err.response;
    var cfg = err.config || {};
    var status = res && res.status;
    var errDisplayUrl = cfg.url;
    if (errDisplayUrl && (errDisplayUrl.includes('localhost') || errDisplayUrl.includes('127'))) {
      var errPathMatch = errDisplayUrl.match(/\/api(\/.*)?$/);
      if (errPathMatch) errDisplayUrl = errPathMatch[0];
    }
    console.error(TAG + ' ✗ ' + (status || 'NETWORK'), errDisplayUrl, err.message);

    /* 200-299 범위가 아닌 모든 응답 → toast 출력 */
    if ((status && (status < 200 || status >= 300)) || !status) {
      cfg._notified = true;
      var errMsg = (res && res.data && res.data.message) || err.message || '오류가 발생했습니다.';
      var errorDetails = '';
      try {
        // 상세 오류 정보 수집
        if (res && res.data) {
          var details = [];
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
        var displayUrl = cfg.url;
        if (displayUrl && (displayUrl.includes('localhost') || displayUrl.includes('127'))) {
          var pathMatch = displayUrl.match(/\/api(\/.*)?$/);
          if (pathMatch) {
            displayUrl = pathMatch[0];
          }
        }
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

        global.dispatchEvent(new CustomEvent('api-validation-error', {
          detail: { scope: 'fo', method: (cfg.method || 'get').toUpperCase(), url: displayUrl, status: status || 0, message: errMsg, errorDetails: errorDetails, uiLabel: uiLabel, reqHeaders: errReqHeaderInfo, resHeaders: errResHeaderInfo },
        }));
      } catch (_) {}
    }

    /* 5xx / 네트워크 오류는 즉시 오류 페이지 알림 (401 은 refresh 시도 후 실패 시 onLogout 에서 처리) */
    if ((status === 0 || !status || status >= 500) && !cfg._notified) {
      cfg._notified = true;
      try {
        var errorUrl = cfg.url;
        if (errorUrl && (errorUrl.includes('localhost') || errorUrl.includes('127'))) {
          var errorPathMatch = errorUrl.match(/\/api(\/.*)?$/);
          if (errorPathMatch) {
            errorUrl = errorPathMatch[0];
          }
        }
        var uiLabelE = getHdr(cfg.headers, 'x-ui-nm') + (getHdr(cfg.headers, 'x-cmd-nm') ? ' > ' + getHdr(cfg.headers, 'x-cmd-nm') : '');

        // 요청 헤더에서 X- 정보 수집
        var errReqHeadersE = cfg.headers || {};
        var errReqHeaderInfoE = [];
        (function collectReqHeaders(h) {
          var keys = [];
          try { keys = Object.keys(h); } catch (_) {}
          keys.forEach(function (k) {
            if (k.toLowerCase().startsWith('x-')) {
              var v = getHdr(h, k);
              if (v) errReqHeaderInfoE.push(k.toLowerCase() + ': ' + v);
            }
          });
          var auth = getHdr(h, 'Authorization') || getHdr(h, 'authorization');
          if (auth) errReqHeaderInfoE.push('authorization: ' + auth.slice(0, 7) + auth.slice(7, 12) + '...(' + auth.length + ')');
        })(errReqHeadersE);

        // 응답 헤더에서 X- 정보 수집
        var errResHeadersE = (res && res.headers) || {};
        var errResHeaderInfoE = [];
        if (errResHeadersE && typeof errResHeadersE.forEach === 'function') {
          errResHeadersE.forEach(function (val, key) {
            if (key.toLowerCase().startsWith('x-')) {
              errResHeaderInfoE.push(key + ': ' + val);
            }
          });
        }

        global.dispatchEvent(new CustomEvent('api-error', {
          detail: { scope: 'fo', status: status || 0, url: errorUrl, message: err.message, method: (cfg.method || 'get').toUpperCase(), uiLabel: uiLabelE, reqHeaders: errReqHeaderInfoE, resHeaders: errResHeaderInfoE },
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
      try { expiredToken = localStorage.getItem(ACCESS_TOKEN_KEY); } catch (_) {}
      return global.axios.post(apiUrl(REFRESH_URL), null, {
          headers: { Authorization: expiredToken ? 'Bearer ' + expiredToken : '' }
        })
        .then(function (r) {
          var d = r && r.data && r.data.data || r && r.data;
          var newTok = d && (d.accessToken || d.token);
          if (!newTok) throw new Error('no token in refresh response');
          try { localStorage.setItem(ACCESS_TOKEN_KEY, newTok); } catch (_) {}
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
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem('modu-fo-authUser');
          } catch (_) {}
          if (global.foAuth && typeof global.foAuth.logout === 'function') {
            try { global.foAuth.logout(); } catch (_) {}
          }
          try {
            global.dispatchEvent(new CustomEvent('api-error', {
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
