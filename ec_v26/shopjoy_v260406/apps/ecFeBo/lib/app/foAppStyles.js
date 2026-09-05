/* ShopJoy FO - 이미지 폴백 & 앱 애니메이션 CSS (foAppBase.js 에서 분리) */
(function () {
  /* ── 전역 이미지 로드 실패 폴백 (noimage 표시) ──────────────────────
     모든 <img> 에 일괄 적용. error 이벤트는 버블링하지 않으므로
     document 캡처 단계로 위임. 무한루프 방지 플래그(_noimg) 사용. */
  (function () {
    const NO_IMAGE =
      'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">' +
        '<rect width="200" height="200" fill="#f2f3f5"/>' +
        '<g fill="none" stroke="#c4c8cf" stroke-width="4">' +
        '<rect x="48" y="56" width="104" height="78" rx="6"/>' +
        '<circle cx="76" cy="84" r="11"/>' +
        '<path d="M58 128 L92 96 L114 116 L132 102 L142 128 Z" fill="#c4c8cf" stroke="none"/>' +
        '</g>' +
        '<text x="100" y="162" font-family="sans-serif" font-size="15" fill="#9aa0a8" text-anchor="middle">No Image</text>' +
        '</svg>'
      );
    window.NO_IMAGE = NO_IMAGE;
    document.addEventListener('error', function (e) {
      const t = e.target;
      if (!t || t.tagName !== 'IMG' || t.dataset._noimg === '1') return;
      t.dataset._noimg = '1';
      t.src = NO_IMAGE;
    }, true);
  })();

  const _s = document.createElement('style');
  _s.id = 'fo-app-styles';
  _s.textContent = `
  @keyframes fo-toast-progress {
    from { transform: scaleX(1); transform-origin: left; }
    to   { transform: scaleX(0); transform-origin: left; }
  }
  .fo-dim-enter-active { transition: opacity 0.15s ease; }
  .fo-dim-leave-active { transition: opacity 0.3s ease; }
  .fo-dim-enter-from, .fo-dim-leave-to { opacity: 0; }
  .fo-dot {
    width: 12px; height: 12px; border-radius: 50%;
    background: var(--accent, #c9a96e);
    display: inline-block;
    animation: fo-dot-wave 1.0s ease-in-out infinite;
  }
  @keyframes fo-dot-wave {
    0%, 100% { transform: translateY(0) scale(0.7); opacity: 0.2; }
    40%      { transform: translateY(-13px) scale(1.25); opacity: 1; }
    65%      { transform: translateY(-5px) scale(0.95); opacity: 0.55; }
  }
  @keyframes fo-progress-slide {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  `;
  document.head.appendChild(_s);
})();
