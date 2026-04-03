(function () {
  if (!window.axiosApi) { window.__SITE_CONFIG_READY__ = Promise.resolve(); return; }
  window.__SITE_CONFIG_READY__ = window.axiosApi
    .get('base/site-config.json')
    .then(function (res) { window.SITE_CONFIG = res.data; })
    .catch(function () {});
})();
