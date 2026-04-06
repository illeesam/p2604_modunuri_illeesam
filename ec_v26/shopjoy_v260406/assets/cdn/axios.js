/**
 * JSON API용 최소 HTTP 클라이언트 (axios 호환 get/post 응답 형태 { data, status })
 * 전체 axios UMD로 바꿔도 axiosUtil 동작 동일.
 */
(function (g) {
  'use strict';
  function parseBody(res) {
    var ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.indexOf('application/json') !== -1) return res.json();
    return res.text();
  }
  function wrap(res, body) {
    return { data: body, status: res.status, statusText: res.statusText };
  }
  function req(method, url, data, config) {
    config = config || {};
    var headers = Object.assign({ Accept: 'application/json' }, config.headers || {});
    var opts = { method: method, headers: headers };
    if (data != null && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      opts.body = typeof data === 'string' ? data : JSON.stringify(data);
      if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
    }
    return fetch(url, opts).then(function (res) {
      return parseBody(res).then(function (body) {
        var ok = res.status >= 200 && res.status < 300;
        if (config.validateStatus && !config.validateStatus(res.status)) ok = false;
        if (!ok) {
          var err = new Error('Request failed: ' + res.status);
          err.response = wrap(res, body);
          throw err;
        }
        return wrap(res, body);
      });
    });
  }
  g.axios = {
    get: function (url, config) {
      return req('GET', url, null, config);
    },
    post: function (url, data, config) {
      return req('POST', url, data, config);
    },
    put: function (url, data, config) {
      return req('PUT', url, data, config);
    },
    patch: function (url, data, config) {
      return req('PATCH', url, data, config);
    },
    delete: function (url, config) {
      return req('DELETE', url, null, config);
    },
  };
})(typeof window !== 'undefined' ? window : this);
