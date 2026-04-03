(function () {
  "use strict";

  var PRODUCTS = {
    main: {
      title: "대표 상품",
      lead: "히어로·메인 배너와 연계하기 좋은 대표 컷입니다.",
      price: "가격 문의",
      origin: "국내산 (상세 지역은 출하 시 안내)",
      storage: "냉장 보관 권장",
      image: "docs/prod/prod.jpg",
      gallery: ["docs/prod/prod.jpg"],
      bullets: [
        "단고을 로컬 농가와 연계한 샘플 상품입니다.",
        "실제 판매 시 품목명·등급·중량을 명시하세요.",
      ],
    },
    g1: {
      title: "상품 1 · 제철 세트",
      lead: "카드형 그리드에 맞춘 기본 상품 상세 예시입니다.",
      price: "24,000원 / 박스",
      origin: "경기 안성",
      storage: "서늘한 곳, 직사광선 피하기",
      image: "docs/prod/prod1.jpg",
      gallery: ["docs/prod/prod1.jpg", "docs/prod/prod.jpg"],
      bullets: ["당일·익일 출고 가능(샘플 문구)", "산지 직송 포장 기준 안내"],
    },
    g2: {
      title: "상품 2 · 특선 채소",
      lead: "가격·원산지는 CMS나 스프레드시트와 매핑하면 관리가 쉽습니다.",
      price: "18,500원",
      origin: "충북 제천",
      storage: "냉장 0~4℃",
      image: "docs/prod/prod2.jpg",
      gallery: ["docs/prod/prod2.jpg"],
      bullets: ["친환경 재배(표기 시 인증 번호 병기)", "문의 시 잔여 수량 확인"],
    },
    g3: {
      title: "상품 3 · 가공 라인",
      lead: "가공품·선물 세트 등 확장 가능한 상세 템플릿입니다.",
      price: "32,000원~",
      origin: "국내산 원료",
      storage: "미개봉 실온, 개봉 후 냉장",
      image: "docs/prod/prod3.jpg",
      gallery: ["docs/prod/prod3.jpg", "docs/prod/prod2.jpg"],
      bullets: ["알레르기 표기는 실제 성분에 맞게 수정", "단체·기업 선물 문의 환영"],
    },
    s11: {
      title: "시리즈 11",
      lead: "시리즈 번호별 상품 상세 페이지로 연결된 예시입니다.",
      price: "문의",
      origin: "국내산",
      storage: "상품별 상이",
      image: "docs/prod/prod11.jpg",
      gallery: ["docs/prod/prod11.jpg"],
      bullets: ["갤러리 이미지는 동일 폴더 에셋을 재사용했습니다."],
    },
    s12: {
      title: "시리즈 12",
      lead: "",
      price: "문의",
      origin: "국내산",
      storage: "상품별 상이",
      image: "docs/prod/prod12.jpg",
      gallery: ["docs/prod/prod12.jpg"],
      bullets: [],
    },
    s13: {
      title: "시리즈 13",
      lead: "",
      price: "문의",
      origin: "국내산",
      storage: "상품별 상이",
      image: "docs/prod/prod13.jpg",
      gallery: ["docs/prod/prod13.jpg"],
      bullets: [],
    },
    s21: {
      title: "시리즈 21",
      lead: "",
      price: "문의",
      origin: "국내산",
      storage: "상품별 상이",
      image: "docs/prod/prod21.jpg",
      gallery: ["docs/prod/prod21.jpg"],
      bullets: [],
    },
    s22: {
      title: "시리즈 22",
      lead: "",
      price: "문의",
      origin: "국내산",
      storage: "상품별 상이",
      image: "docs/prod/prod22.jpg",
      gallery: ["docs/prod/prod22.jpg"],
      bullets: [],
    },
    s25: {
      title: "시리즈 25",
      lead: "",
      price: "문의",
      origin: "국내산",
      storage: "상품별 상이",
      image: "docs/prod/prod25.jpg",
      gallery: ["docs/prod/prod25.jpg"],
      bullets: [],
    },
  };

  function el(id) {
    return document.getElementById(id);
  }

  function run() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get("id") || "main";
    var p = PRODUCTS[id];
    if (!p) {
      id = "main";
      p = PRODUCTS.main;
    }

    document.title = p.title + " — 단고을";

    el("pd-title").textContent = p.title;
    el("pd-lead").textContent = p.lead || "로컬 농산물 직거래 샘플 상세입니다.";
    el("pd-price").textContent = p.price;
    el("pd-origin").textContent = p.origin;
    el("pd-storage").textContent = p.storage;

    var mainImg = el("pd-main-img");
    mainImg.src = p.image;
    mainImg.alt = p.title;

    var thumbs = el("pd-thumbs");
    thumbs.innerHTML = "";
    var gallery = p.gallery && p.gallery.length ? p.gallery : [p.image];
    if (gallery.length > 1) {
      thumbs.hidden = false;
      gallery.forEach(function (src, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "pd-thumb";
        if (i === 0) b.classList.add("is-active");
        b.setAttribute("aria-label", "이미지 " + (i + 1));
        var im = document.createElement("img");
        im.src = src;
        im.alt = "";
        b.appendChild(im);
        b.addEventListener("click", function () {
          mainImg.src = src;
          thumbs.querySelectorAll(".pd-thumb").forEach(function (x) {
            x.classList.remove("is-active");
          });
          b.classList.add("is-active");
        });
        thumbs.appendChild(b);
      });
    } else {
      thumbs.hidden = true;
    }

    var list = el("pd-bullets");
    list.innerHTML = "";
    (p.bullets || []).forEach(function (text) {
      var li = document.createElement("li");
      li.textContent = text;
      list.appendChild(li);
    });
    var wrap = el("pd-bullets-wrap");
    if (wrap) wrap.style.display = p.bullets && p.bullets.length ? "block" : "none";
  }

  function setupShare() {
    var btn = document.getElementById("pd-share-btn");
    if (!btn) return;

    // 공유 모달 생성
    var modal = document.createElement("div");
    modal.id = "pd-share-modal";
    modal.style.cssText = "display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;align-items:flex-end;justify-content:center;";
    modal.innerHTML =
      '<div style="background:#fff;border-radius:20px 20px 0 0;padding:28px 24px 44px;width:100%;max-width:480px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">' +
          '<span style="font-weight:700;font-size:1rem;">공유하기</span>' +
          '<button id="pd-modal-close" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:#888;padding:0;line-height:1;">✕</button>' +
        '</div>' +
        '<div style="display:flex;gap:24px;justify-content:center;">' +
          '<button id="pd-share-kakao" style="display:flex;flex-direction:column;align-items:center;gap:8px;background:none;border:none;cursor:pointer;">' +
            '<div style="width:60px;height:60px;border-radius:16px;background:#FEE500;display:flex;align-items:center;justify-content:center;font-size:2rem;">💬</div>' +
            '<span style="font-size:0.78rem;color:#666;font-weight:500;">카카오톡</span>' +
          '</button>' +
          '<button id="pd-share-copy" style="display:flex;flex-direction:column;align-items:center;gap:8px;background:none;border:none;cursor:pointer;">' +
            '<div style="width:60px;height:60px;border-radius:16px;background:#f5f5f5;border:1.5px solid #e0e0e0;display:flex;align-items:center;justify-content:center;font-size:2rem;">🔗</div>' +
            '<span style="font-size:0.78rem;color:#666;font-weight:500;">링크 복사</span>' +
          '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    var shareTitle = "", shareText = "", shareUrl = "";

    function openModal() { modal.style.display = "flex"; }
    function closeModal() { modal.style.display = "none"; }

    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    document.getElementById("pd-modal-close").addEventListener("click", closeModal);

    document.getElementById("pd-share-kakao").addEventListener("click", function () {
      var fullText = shareText + "\n🔗 " + shareUrl;
      window.location.href = "kakaotalk://msg/send?text=" + encodeURIComponent(fullText);
      setTimeout(closeModal, 300);
    });

    document.getElementById("pd-share-copy").addEventListener("click", function () {
      var fullText = shareText + "\n🔗 " + shareUrl;
      navigator.clipboard.writeText(fullText).then(function () {
        closeModal();
        var toast = document.getElementById("pd-share-toast");
        if (toast) {
          toast.style.display = "block";
          setTimeout(function () { toast.style.display = "none"; }, 3000);
        }
      }).catch(function () {
        prompt("아래 내용을 복사하세요:", fullText);
        closeModal();
      });
    });

    btn.addEventListener("click", function () {
      var title = el("pd-title") ? el("pd-title").textContent : "단고을 상품";
      var price = el("pd-price") ? el("pd-price").textContent : "";
      var lead = el("pd-lead") ? el("pd-lead").textContent : "";
      var siteName = "단고을";
      shareTitle = siteName + " - " + title;
      shareText = "[" + siteName + "] " + title + "\n💰 " + price + "\n" + lead;
      shareUrl = window.location.href;

      if (window.isSecureContext && navigator.share) {
        navigator.share({ title: shareTitle, text: shareText, url: shareUrl })
          .catch(function () { openModal(); });
      } else {
        openModal();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { run(); setupShare(); });
  } else {
    run();
    setupShare();
  }
})();
