/**
 * 순서: axios → util → config → (api/base/site-config.json) → seo → Vue → 컴포넌트 → app
 */
(function () {
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }
  function dismissVueLoading() {
    var el = document.getElementById('vue-app-loading');
    if (!el) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.classList.add('vue-app-loading--done');
        el.setAttribute('aria-busy', 'false');
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 450);
      });
    });
  }
  (async function () {
    try {
      await loadScript('assets/cdn/axios.js');
      await loadScript('utils/axiosUtil.js');
      await loadScript('base/config.js');
      try {
        var r = await axiosApi.get('base/site-config.json');
        window.SITE_CONFIG = r.data;
      } catch (e) {}
      await loadScript('utils/seo.js');
      await loadScript('utils/imageThumb.js');
      await loadScript('utils/cmUtil.js');
      await loadScript('https://unpkg.com/vue@3/dist/vue.global.prod.js');
      var chain = [
        'layout/LayoutHeader.js',
        'layout/LayoutSidebar.js',
        'layout/LayoutFooter.js',
        'pages/Home.js',
        'pages/About.js',
        'pages/Solution.js',
        'pages/Products.js',
        'pages/Detail.js',
        'pages/Blog.js',
        'pages/Location.js',
        'pages/Contact.js',
        'pages/Order.js',
        'pages/Faq.js',
        'base/app.js',
      ];
      for (var i = 0; i < chain.length; i++) {
        await loadScript(chain[i]);
      }
      dismissVueLoading();
    } catch (err) {
      console.error('dangoeul-boot:', err);
      dismissVueLoading();
    }
  })();
})();
