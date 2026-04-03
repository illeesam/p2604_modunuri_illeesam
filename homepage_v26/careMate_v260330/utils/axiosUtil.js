(function (global) {
  'use strict';
  function ax() {
    if (!global.axios) throw new Error('axiosUtil: load assets/cdn/axios.js first');
    return global.axios;
  }
  function apiUrl(path) {
    if (/^https?:\/\//i.test(path)) return path;
    var p = String(path || '').replace(/^\//, '');
    return new URL('api/' + p, global.location.href).href;
  }
  global.axiosApi = {
    get: function (path, config) { return ax().get(apiUrl(path), config); },
    post: function (path, data, config) { return ax().post(apiUrl(path), data, config); },
    put: function (path, data, config) { return ax().put(apiUrl(path), data, config); },
    patch: function (path, data, config) { return ax().patch(apiUrl(path), data, config); },
    delete: function (path, config) { return ax().delete(apiUrl(path), config); },
  };
})(typeof window !== 'undefined' ? window : this);
