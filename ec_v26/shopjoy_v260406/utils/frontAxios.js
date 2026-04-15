/**
 * Front axios 클라이언트 (window.frontApi)
 * - Bearer 토큰 자동 주입 (modu-front-token)
 * - 401 → /auth/front/refresh 로 토큰 재갱신 후 원 요청 재시도 (1회)
 * - request / response / error 콘솔 로그
 *
 * 선행: assets/cdn/pkg/axios/1.7.9/axios.min.js
 */
(function (global) {
  'use strict';
  if (!global.axios) throw new Error('frontAxios: load axios first');

  /* ── URL 헬퍼 (admin/front 공통) ──────────────────────────────── */
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
    return new URL('api/' + p, global.location.href).href;
  }
  global.appBase = global.appBase || appBase;
  global.pageUrl = global.pageUrl || pageUrl;
  global.apiUrl  = global.apiUrl  || apiUrl;

  /* ── 설정 ────────────────────────────────────────────────────── */
  var TAG         = '[front]';
  var TOKEN_KEY   = 'modu-front-token';
  var REFRESH_KEY = 'modu-front-refresh';
  var REFRESH_URL = 'auth/front/refresh';
  var TIMEOUT     = 15000;

  var inst = global.axios.create({ timeout: TIMEOUT });

  /* ── Request: 토큰 주입 + 로그 ── */
  inst.interceptors.request.use(function (cfg) {
    try {
      var t = localStorage.getItem(TOKEN_KEY);
      if (t) {
        cfg.headers = cfg.headers || {};
        cfg.headers.Authorization = 'Bearer ' + t;
      }
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

    /* 5xx / 네트워크 오류는 즉시 오류 페이지 알림 (401 은 refresh 시도 후 실패 시 onLogout 에서 처리) */
    if ((status === 0 || !status || status >= 500) && !cfg._notified) {
      cfg._notified = true;
      try {
        global.dispatchEvent(new CustomEvent('api-error', {
          detail: { scope: 'front', status: status || 0, url: cfg.url, message: err.message },
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
      var refresh = null;
      try { refresh = localStorage.getItem(REFRESH_KEY); } catch (_) {}
      return global.axios.post(apiUrl(REFRESH_URL), { refresh: refresh })
        .then(function (r) {
          var newTok = r && r.data && (r.data.token || r.data.accessToken);
          if (!newTok) throw new Error('no token in refresh response');
          try { localStorage.setItem(TOKEN_KEY, newTok); } catch (_) {}
          var newRefresh = r.data.refresh || r.data.refreshToken;
          if (newRefresh) { try { localStorage.setItem(REFRESH_KEY, newRefresh); } catch (_) {} }
          console.log(TAG + ' ↻ token refreshed');
          flush(newTok);
          isRefreshing = false;
          cfg.headers = cfg.headers || {};
          cfg.headers.Authorization = 'Bearer ' + newTok;
          return inst(cfg);
        })
        .catch(function (e) {
          console.error(TAG + ' ✗ token refresh failed', e && e.message);
          flush(null);
          isRefreshing = false;
          try {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_KEY);
            localStorage.removeItem('modu-front-user');
          } catch (_) {}
          if (global.frontAuth && typeof global.frontAuth.logout === 'function') {
            try { global.frontAuth.logout(); } catch (_) {}
          }
          try {
            global.dispatchEvent(new CustomEvent('api-error', {
              detail: { scope: 'front', status: 401, url: cfg.url, message: 'session expired' },
            }));
          } catch (_) {}
          return Promise.reject(err);
        });
    }
    return Promise.reject(err);
  });

  /* ── path → apiUrl 변환 래퍼 ── */
  global.frontApi = {
    get:    function (path, cfg)       { return inst.get(apiUrl(path), cfg); },
    delete: function (path, cfg)       { return inst.delete(apiUrl(path), cfg); },
    post:   function (path, data, cfg) { return inst.post(apiUrl(path), data, cfg); },
    put:    function (path, data, cfg) { return inst.put(apiUrl(path), data, cfg); },
    patch:  function (path, data, cfg) { return inst.patch(apiUrl(path), data, cfg); },
    raw:    inst,
  };
})(typeof window !== 'undefined' ? window : this);
