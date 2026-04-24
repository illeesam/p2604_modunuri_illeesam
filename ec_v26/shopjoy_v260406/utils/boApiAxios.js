/**
 * BO axios 클라이언트 (window.boApi)
 * - Bearer 토큰 자동 주입 (modu-bo-accessToken)
 * - 401 → /auth/bo/refresh 로 토큰 재갱신 후 원 요청 재시도 (1회)
 * - request / response / error 콘솔 로그
 *
 * 선행: assets/cdn/pkg/axios/1.7.9/axios.min.js
 */
(function (global) {
  'use strict';
  if (!global.axios) throw new Error('boAxios: load axios first');

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
  var TAG              = '[bo]';
  var ACCESS_TOKEN_KEY = 'modu-bo-accessToken';
  var REFRESH_URL      = 'auth/bo/refresh';
  var TIMEOUT          = 15000;

  var inst = global.axios.create({ timeout: TIMEOUT });

  /* ── Request: 토큰 주입 + 기본 헤더 설정 + 로그 ── */
  inst.interceptors.request.use(function (cfg) {
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
      /* X-Site-Type + X-Site-Id + X-Buyer-Id + X-License-Code 헤더 주입 */
      try {
        var lic = global.SHOPJOY_LICENSE_BO;
        if (lic) {
          if (lic.siteType)    cfg.headers['X-Site-Type']    = lic.siteType;
          if (lic.siteId)      cfg.headers['X-Site-Id']      = lic.siteId;
          if (lic.buyerId)     cfg.headers['X-Buyer-Id']     = lic.buyerId;
          if (lic.licenseCode) cfg.headers['X-License-Code'] = lic.licenseCode;
        }
      } catch (_) {}
    } catch (_) {}
    console.log(TAG + ' → ' + (cfg.method || 'get').toUpperCase(), cfg.url, cfg.data || cfg.params || '');
    return cfg;
  }, function (err) {
    console.error(TAG + ' ✗ REQUEST ERROR', err && err.message);
    return Promise.reject(err);
  });

  /* ── Response: 로그 + 401 재갱신 ── */
  var isRefreshing = false;
  var pending = [];
  function subscribe(cb) { pending.push(cb); }
  function flush(tok) { pending.forEach(function (cb) { cb(tok); }); pending = []; }

  inst.interceptors.response.use(function (res) {
    console.log(TAG + ' ← ' + res.status, res.config && res.config.url);
    return res;
  }, function (err) {
    var res = err.response;
    var cfg = err.config || {};
    var status = res && res.status;
    console.error(TAG + ' ✗ ' + (status || 'NETWORK'), cfg.url, err.message);

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
        // URL 정리 (localhost/127로 시작하면 :port/path 형태로 표시)
        var displayUrl = cfg.url;
        if (displayUrl && (displayUrl.includes('localhost') || displayUrl.includes('127'))) {
          var portMatch = displayUrl.match(/:(\d+)(\/.*)?$/);
          if (portMatch) {
            displayUrl = ':' + portMatch[1] + (portMatch[2] || '');
          }
        }
        global.dispatchEvent(new CustomEvent('api-validation-error', {
          detail: { scope: 'bo', method: (cfg.method || 'get').toUpperCase(), url: displayUrl, status: status || 0, message: errMsg, errorDetails: errorDetails },
        }));
      } catch (_) {}
    }

    if ((status === 0 || !status || status >= 500) && !cfg._notified) {
      cfg._notified = true;
      try {
        // URL 정리 (localhost/127로 시작하면 :port/path 형태로 표시)
        var displayUrl = cfg.url;
        if (displayUrl && (displayUrl.includes('localhost') || displayUrl.includes('127'))) {
          var portMatch = displayUrl.match(/:(\d+)(\/.*)?$/);
          if (portMatch) {
            displayUrl = ':' + portMatch[1] + (portMatch[2] || '');
          }
        }
        global.dispatchEvent(new CustomEvent('api-error', {
          detail: { scope: 'bo', status: status || 0, url: displayUrl, message: err.message, method: (cfg.method || 'get').toUpperCase() },
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
            localStorage.removeItem('modu-bo-authUser');
          } catch (_) {}
          try {
            global.dispatchEvent(new CustomEvent('api-error', {
              detail: { scope: 'bo', status: 401, url: cfg.url, message: 'session expired' },
            }));
          } catch (_) {}
          return Promise.reject(err);
        });
    }
    return Promise.reject(err);
  });

  /* ── path → apiUrl 변환 래퍼 ── */
  global.boApi = {
    get:    function (path, cfg) {
      // getInitData에서 names 파라미터가 없으면 ALL로 기본값 설정
      if (path.includes('getInitData')) {
        var sep = path.includes('?') ? '&' : '?';
        if (!path.includes('names=') || path.match(/names=([&]|$)/)) {
          path = path.replace(/names=([&]|$)/, '').replace(/[&]$/, '');
          path += (path.includes('?') ? '&' : '?') + 'names=ALL';
        }
      }
      return inst.get(apiUrl(path), cfg);
    },
    delete: function (path, cfg)       { return inst.delete(apiUrl(path), cfg); },
    post:   function (path, data, cfg) { return inst.post(apiUrl(path), data, cfg); },
    put:    function (path, data, cfg) { return inst.put(apiUrl(path), data, cfg); },
    patch:  function (path, data, cfg) { return inst.patch(apiUrl(path), data, cfg); },
    raw:    inst,
  };
})(typeof window !== 'undefined' ? window : this);
