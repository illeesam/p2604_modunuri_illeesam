/**
 * 사이트 설정 로드 준비 (config.js에서 기본값 사용)
 * 향후 API 연동 예정: /api/fo/config
 */
(function () {
  window.__SITE_CONFIG_READY__ = Promise.resolve();
})();
