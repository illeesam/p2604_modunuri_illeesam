/* manifest.js — "콘텐츠/고객센터성 페이지" 마이크로 도메인의 유일한 진입점(FO).
 * shopjoy_v260406(실제 프로덕션)의 pages/fo/{About,Blog,BlogEdit,BlogView,Contact,
 * Event,EventView,Faq,Like,Location}.js 10개를 그대로 복사해왔다(원본은 전혀
 * 수정하지 않음). 원본 소스는 pages/fo/ 바로 밑(서브패키지 구분 없음)이지만, 이
 * 데모에서는 BO의 cm(공지/블로그/FAQ 등 콘텐츠 성격) 도메인과 같은 결로 묶어서
 * fo-ec-cm 레포 하나로 관리한다. 화면 파일은 export default(ES 모듈, 2026-08-29
 * BO와 동일하게 통일). */
(function () {
  const R = window.FO_MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/fo/content/';

  Promise.all([
    R.loadModule(P + 'About.js'),
    R.loadModule(P + 'Blog.js'),
    R.loadModule(P + 'BlogEdit.js'),
    R.loadModule(P + 'BlogView.js'),
    R.loadModule(P + 'Contact.js'),
    R.loadModule(P + 'Event.js'),
    R.loadModule(P + 'EventView.js'),
    R.loadModule(P + 'Faq.js'),
    R.loadModule(P + 'Like.js'),
    R.loadModule(P + 'Location.js'),
  ]).then(function (m) {
    R.register([
      { id: 'about', comp: m[0].default },
      { id: 'blog', comp: m[1].default },
      { id: 'blogEdit', comp: m[2].default },
      { id: 'blogView', comp: m[3].default },
      { id: 'contact', comp: m[4].default },
      { id: 'event', comp: m[5].default },
      { id: 'eventView', comp: m[6].default },
      { id: 'faq', comp: m[7].default },
      { id: 'like', comp: m[8].default },
      { id: 'location', comp: m[9].default },
    ]);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[fo-ec-cm/content manifest] 로드 실패:', err);
  });
})();
