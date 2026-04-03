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
      '<span class="site-brand-mark" aria-hidden="true">D</span>' +
      '<span class="site-brand-text">' +
      '<span class="site-title">문서모음</span>' +
      '<span class="site-tagline">루트 docs_v260329 · 안내 페이지</span>' +
      "</span></a>" +
      '<div class="site-header-cta">' +
      '<button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-sidebar-nav" title="메뉴 열기">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<path d="M4 6h16M4 12h16M4 18h16" /></svg></button></div></header>',
    left:
      '<p class="site-nav-label">메뉴</p>' +
      '<nav id="site-sidebar-nav" class="site-nav" aria-label="주요 페이지">' +
      '<a href="index.html" data-nav="index">홈</a>' +
      "</nav>",
    bottom:
      '<footer class="site-footer" role="contentinfo">' +
      '<div class="site-footer-inner">' +
      "<div><strong>문서모음</strong>" +
      '<p style="margin:0;line-height:1.6">저장소 루트 <code>docs_v260329/</code> 데모입니다.</p></div>' +
      "<div><strong>이동</strong>" +
      '<div class="footer-links">' +
      '<a href="../mainFrame.html#docs_index">문서 뷰어(docs_v260329)</a>' +
      '<a href="../home_v260329/index.html">home_v260329</a>' +
      '<a href="../dangoeul_v260329/index.html">단고을</a>' +
      '<a href="../modunuri_v260329/index.html">모두누리</a>' +
      '<a href="../partyroom_v260329/index.html">파티룸</a>' +
      "</div></div>" +
      '<p class="footer-copy">© 문서모음 · docs_v260329 · 2026</p>' +
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
    var menuPushed = false;
    function closeSidebar() {
      sidebar.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      menuPushed = false;
    }
    window.addEventListener("popstate", function () {
      if (sidebar.classList.contains("is-open")) closeSidebar();
    });
    btn.addEventListener("click", function () {
      if (sidebar.classList.contains("is-open")) {
        if (menuPushed) {
          try {
            history.back();
          } catch (e) {
            closeSidebar();
          }
        } else {
          closeSidebar();
        }
      } else {
        sidebar.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
        try {
          history.pushState({ __docsMobileNav: 1 }, "", window.location.href);
          menuPushed = true;
        } catch (e) {}
      }
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
        if (d.html) {
          el.innerHTML = d.html;
          return;
        }
        el.textContent = "";
        if (d.text) {
          var p = document.createElement("p");
          p.className = "lead";
          p.style.marginTop = "0";
          p.textContent = d.text;
          el.appendChild(p);
        }
        var list =
          window.cmUtil && window.cmUtil.codesByGroup
            ? window.cmUtil.codesByGroup({ codes: d.codes || [] }, "docs_view_filter")
            : [];
        if (!list.length) return;
        var wrap = document.createElement("div");
        wrap.style.marginTop = "0.75rem";
        var lab = document.createElement("label");
        lab.style.display = "inline-flex";
        lab.style.alignItems = "center";
        lab.style.gap = "0.5rem";
        lab.style.flexWrap = "wrap";
        var span = document.createElement("span");
        span.textContent = "문서 분류";
        var sel = document.createElement("select");
        sel.className = "form-select";
        sel.style.maxWidth = "220px";
        sel.style.padding = "6px 10px";
        sel.style.borderRadius = "6px";
        sel.style.border = "1px solid #ccc";
        sel.setAttribute("aria-label", "문서 분류");
        list.forEach(function (c) {
          var opt = document.createElement("option");
          opt.value = c.codeValue;
          opt.textContent = c.codeLabel;
          sel.appendChild(opt);
        });
        lab.appendChild(span);
        lab.appendChild(sel);
        wrap.appendChild(lab);
        el.appendChild(wrap);
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
    var leftFile = document.body.getAttribute("data-layout-left") || "layoutLeft.html";
    Promise.all([
      loadOne(layoutBase, "layoutTop.html", slots.top, "top"),
      loadOne(layoutBase, leftFile, slots.left, "left"),
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
