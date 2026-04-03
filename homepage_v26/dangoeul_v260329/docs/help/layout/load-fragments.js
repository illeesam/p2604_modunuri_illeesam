(function () {
  "use strict";

  var slots = {
    top: document.querySelector("#slot-top"),
    left: document.querySelector("#slot-left"),
    bottom: document.querySelector("#slot-bottom"),
  };

  var FALLBACK = {
    top:
      '<header class="site-header" role="banner">' +
      '<a href="home.html" class="site-brand">' +
      '<span class="site-brand-mark" aria-hidden="true">?</span>' +
      '<span class="site-brand-text">' +
      '<span class="site-title">도움말</span>' +
      '<span class="site-tagline">단고을 · 문서 뷰어 안내</span>' +
      "</span></a>" +
      '<div class="site-header-cta">' +
      '<a class="btn btn-ghost" href="page01/page0100.html">뷰어 사용법</a>' +
      '<a class="btn btn-primary" href="../../index.html">단고을 홈</a>' +
      '<button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-sidebar-nav" title="메뉴 열기">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<path d="M4 6h16M4 12h16M4 18h16" /></svg></button></div></header>',
    left:
      '<p class="site-nav-label">도움말</p>' +
      '<nav id="site-sidebar-nav" class="site-nav" aria-label="도움말 페이지">' +
      '<a href="home.html" data-nav="index">시작</a>' +
      '<a href="page01/page0100.html" data-nav="0100">문서 뷰어</a>' +
      '<a href="page02/page0200.html" data-nav="0200">단고을 구조</a>' +
      '<a href="page03/page0300.html" data-nav="0300">에셋 폴더</a>' +
      '<a href="page04/page0400.html" data-nav="0400">FAQ</a>' +
      '<a href="page05/page0500.html" data-nav="0500">버전 안내</a>' +
      "</nav>",
    bottom:
      '<footer class="site-footer" role="contentinfo">' +
      '<div class="site-footer-inner">' +
      "<div><strong>단고을 도움말</strong>" +
      '<p style="margin:0;line-height:1.6"><code>dangoeul_v260329/docs/help</code> 안내 페이지입니다.</p></div>' +
      "<div><strong>이동</strong>" +
      '<div class="footer-links">' +
      '<a href="../../index.html">단고을 홈</a>' +
      '<a href="../../../mainFrame.html#dg_plan">기획서(뷰어)</a>' +
      "</div></div>" +
      '<p class="footer-copy">© 단고을 도움말 · 2026</p>' +
      "</div></footer>",
  };

  function setCurrentNav() {
    var page = document.body.getAttribute("data-page") || "";
    var links = document.querySelectorAll(".site-nav a[data-nav]");
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (a.getAttribute("data-nav") === page) {
        a.setAttribute("aria-current", "page");
      } else {
        a.removeAttribute("aria-current");
      }
    }
  }

  function initMobileNav() {
    var btn = document.querySelector(".nav-toggle");
    var sidebar = document.querySelector(".site-sidebar");
    if (!btn || !sidebar) return;
    btn.addEventListener("click", function () {
      var open = !sidebar.classList.contains("is-open");
      sidebar.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function loadOne(base, file, el, key) {
    if (!el) return Promise.resolve();
    return fetch(base + file, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("bad");
        return r.text();
      })
      .then(function (text) {
        el.innerHTML = text.trim();
      })
      .catch(function () {
        el.innerHTML = FALLBACK[key];
      });
  }

  function run() {
    var layoutBase = document.body.getAttribute("data-layout-base") || "layout/";
    Promise.all([
      loadOne(layoutBase, "layoutTop.html", slots.top, "top"),
      loadOne(layoutBase, "layoutLeft.html", slots.left, "left"),
      loadOne(layoutBase, "layoutBottom.html", slots.bottom, "bottom"),
    ]).then(function () {
      setCurrentNav();
      initMobileNav();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
