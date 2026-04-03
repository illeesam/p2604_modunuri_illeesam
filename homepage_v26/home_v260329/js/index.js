/**
 * api/base/site-config.json 이 있으면 window.SITE_CONFIG 를 덮어씁니다.
 * 실패 시 config.js 값 유지. app.js 에서 await __SITE_CONFIG_READY__ 권장.
 */
(function () {
  if (!window.axiosApi) {
    window.__SITE_CONFIG_READY__ = Promise.resolve();
    return;
  }
  window.__SITE_CONFIG_READY__ = window.axiosApi
    .get('base/site-config.json')
    .then(function (res) {
      window.SITE_CONFIG = res.data;
    })
    .catch(function () {});
})();
