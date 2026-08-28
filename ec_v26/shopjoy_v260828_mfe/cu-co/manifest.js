/* manifest.js — "고객센터 > 공통업무" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식은 ab-home/manifest.js 주석 참조.
 * cu-ba(고객) 와 같은 대메뉴(cu) 아래 다른 소그룹(group)으로 기여하는 별도 레포다
 * (2026-08-28) — 요청대로 cu-ba 와 같은 화면(공지사항관리/FAQ관리)을 이 레포도
 * 독립적으로 갖고 있다(각자 다른 물리 파일로 복사돼 있음 — 같은 소스, 다른 레포).
 * id 는 cu-ba 쪽과 겹치지 않게 접미어(_co)를 붙였다 — 두 레포가 같은 화면을 각자
 * 등록해도 사이드바/탭에서 :key 충돌이 안 나게 하려는 것뿐, 내용은 완전히 동일하다. */
(function () {
  var base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  document.write('<script src="' + base + 'pages/CmNoticeDtl.js"><\/script>');
  document.write('<script src="' + base + 'pages/CmNoticeMng.js"><\/script>');
  document.write('<script src="' + base + 'pages/CmFaqDtl.js"><\/script>');
  document.write('<script src="' + base + 'pages/CmFaqMng.js"><\/script>');
  document.write(
    '<script>' +
      'window.MFE_REGISTRY.register("cu", [' +
      '{ id: "cmNoticeMng_co", label: "공지사항관리", group: "공통업무", comp: window.CmNoticeMng },' +
      '{ id: "cmFaqMng_co", label: "FAQ관리", group: "공통업무", comp: window.CmFaqMng }' +
      ']);' +
      'window.MFE_REGISTRY.registerComponents([' +
      '{ tag: "CmNoticeDtl", comp: window.CmNoticeDtl },' +
      '{ tag: "CmFaqDtl", comp: window.CmFaqDtl }' +
      ']);' +
      '<\/script>'
  );
})();
