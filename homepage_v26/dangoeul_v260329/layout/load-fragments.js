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
      '<a href="index.html" class="site-brand">' +
      '<img src="docs/logo/logo1.jpg" alt="단고을 로고" width="44" height="44" loading="eager" />' +
      '<span class="site-brand-text">' +
      '<span class="site-title">단고을</span>' +
      '<span class="site-tagline">신선한 농산물 · 직거래 반응형 홈페이지</span>' +
      "</span></a>" +
      '<div class="site-header-cta">' +
      '<a class="btn btn-ghost" href="page0300.html">상품 보기</a>' +
      '<a class="btn btn-primary" href="page0600.html">문의·안내</a>' +
      '<button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-sidebar-nav" title="메뉴 열기">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<path d="M4 6h16M4 12h16M4 18h16" /></svg></button></div></header>',
    left:
      '<p class="site-nav-label">페이지</p>' +
      '<nav id="site-sidebar-nav" class="site-nav" aria-label="주요 페이지">' +
      '<a href="index.html" data-nav="index">홈</a>' +
      '<a href="page0100.html" data-nav="0100">브랜드·목표</a>' +
      '<a href="page0200.html" data-nav="0200">정보 구조</a>' +
      '<a href="page0300.html" data-nav="0300">상품</a>' +
      '<a href="page0400.html" data-nav="0400">생산·신뢰</a>' +
      '<a href="page0500.html" data-nav="0500">소식·블로그</a>' +
      '<a href="page0600.html" data-nav="0600">반응형·구현</a>' +
      "</nav>",
    bottom:
      '<footer class="site-footer" role="contentinfo">' +
      '<div class="site-footer-inner">' +
      "<div><strong>단고을 dangoeul_v260329</strong>" +
      '<p style="margin:0;line-height:1.6">지역 농산물을 소개·판매하는 반응형 웹 구성 예시입니다. 이미지·자료는 <code style="color:#a8a29e">dangoeul_v260329/docs</code> 폴더를 기준으로 합니다.</p></div>' +
      "<div><strong>바로가기</strong>" +
      '<div class="footer-links">' +
      '<a href="page0300.html">상품 갤러리</a>' +
      '<a href="page0400.html">생산 스토리</a>' +
      '<a href="ocs/design_v1.260328.md">기획서 (Markdown)</a>' +
      "</div></div>" +
      '<p class="footer-copy">© 단고을 · 농산물 직거래 데모 · 2026</p>' +
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

  function hydrateApiNotice() {
    var el = document.getElementById("site-api-notice");
    if (!el || !window.axiosApi) return Promise.resolve();
    return window.axiosApi
      .get("base/site-notice.json")
      .then(function (res) {
        var d = res.data;
        if (!d) return;
        if (d.html) el.innerHTML = d.html;
        else if (d.text) el.textContent = d.text;
      })
      .catch(function () {});
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
      return hydrateApiNotice();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
