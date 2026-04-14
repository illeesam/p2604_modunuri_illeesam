/**
 * api/ 하위 JSON·향후 REST 엔드포인트용 axios 래퍼
 * 선행: assets/cdn/pkg/axios/1.7.9/axios.min.js (window.axios)
 */
(function (global) {
  'use strict';
  function ax() {
    if (!global.axios) throw new Error('axiosUtil: load assets/cdn/pkg/axios/1.7.9/axios.min.js first');
    return global.axios;
  }

  /**
   * 앱 베이스 경로 반환
   * - URL에 shopjoy 세그먼트가 있으면 그 경로까지를 베이스로 사용
   *   예) /ec_v26/shopjoy_v260406/admin.html → /ec_v26/shopjoy_v260406
   * - 없으면 빈 문자열 (루트 기준)
   *   예) /admin.html → ''
   */
  function appBase() {
    var m = global.location.pathname.match(/^(.*shopjoy[^/]*)\//i);
    return m ? m[1] : '';
  }

  /**
   * 앱 내 페이지 절대 URL 생성 (window.open, a href 등 용도)
   * pageUrl('pages/xd/disp-ui.html') → origin + base + '/pages/xd/disp-ui.html'
   */
  function pageUrl(path) {
    var p = String(path || '').replace(/^\//, '');
    return global.location.origin + appBase() + '/' + p;
  }

  function apiUrl(path) {
    if (/^https?:\/\//i.test(path)) return path;
    var p = String(path || '').replace(/^\//, '');
    return new URL('api/' + p, global.location.href).href;
  }

  global.appBase  = appBase;
  global.pageUrl  = pageUrl;
  global.axiosApi = {
    get: function (path, config) {
      return ax().get(apiUrl(path), config);
    },
    post: function (path, data, config) {
      return ax().post(apiUrl(path), data, config);
    },
    put: function (path, data, config) {
      return ax().put(apiUrl(path), data, config);
    },
    patch: function (path, data, config) {
      return ax().patch(apiUrl(path), data, config);
    },
    delete: function (path, config) {
      return ax().delete(apiUrl(path), config);
    },
  };
})(typeof window !== 'undefined' ? window : this);
