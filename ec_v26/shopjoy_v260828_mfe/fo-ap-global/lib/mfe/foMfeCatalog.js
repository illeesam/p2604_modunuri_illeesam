/* foMfeCatalog.js — FO 지연로드용 "가벼운 목차". 실제 페이지 코드는 전혀 안 싣고,
 * 어떤 pageId(=?page= 쿼리값)를 어떤 도메인 폴더가 담당하는지만 미리 선언한다.
 * BO 쪽 mfeCatalog.js와 같은 역할이지만, FO는 menuKey/group 이 없어서(대메뉴·탭
 * 구조가 아니라 페이지 라우팅) `registerCatalog(pageId, folder)` 하나면 충분하다.
 *
 * fo-mfe.html 이 이 파일 하나만 부팅 시 로드하면, 나머지 도메인의 실제 코드는
 * 사용자가 그 페이지로 처음 이동(navigate)할 때 window.FO_MFE_REGISTRY.ensurePageLoaded()
 * 가 그때 가서 그 폴더 하나만 동적으로 불러온다.
 *
 * ══════════════ 새 도메인(마이크로 레포) 추가 시 체크리스트 ══════════════
 * 1. 형제 폴더 생성 — fo-ap-global/과 같은 레벨(중첩 금지)
 * 2. 그 폴더 안에 소그룹 하위 디렉터리 + manifest.js 작성 — 기존 레포(예: fo-ec-cm/content/
 *    manifest.js) 그대로 베껴서 시작. R.loadScript() 로 자기 페이지 파일들을 병렬로
 *    불러온 뒤 R.register([{id, comp}, ...]) 호출, 마지막에 R._domainReady(base) 필수
 * 3. 그 레포 루트에 dev.html 작성 — 다른 도메인 없이 ../fo-ap-global/ 공용 런타임 +
 *    자기 manifest.js 들만 정적 로드해서 단독 실행 확인
 * 4. 여기(foMfeCatalog.js)에 R.registerCatalog(pageId, folder) 한 줄(또는 여러 줄,
 *    한 폴더가 여러 pageId를 담당하면 pageId 개수만큼) 추가
 * 5. `_git_shopjoy-mfe-domain-fo-{도메인명}.txt` 마커 파일 추가
 * 6. `fo-ap-global/README.md`에 새 행 추가 (없으면 bo-ap-global/README.md 참고해서 작성)
 * ════════════════════════════════════════════════════════════════════════ */
(function () {
  const R = window.FO_MFE_REGISTRY;

  /* fo-ap-home — 홈. FO_SITE_NO 사이트 하나(01)로 범위 고정(fo-ap-home/home/manifest.js
     주석 참고). */
  R.registerCatalog('home', '../fo-ap-home/home/');

  /* fo-ec-pd — 상품(목록/상세). */
  R.registerCatalog('prodList', '../fo-ec-pd/pd/');
  R.registerCatalog('prodView', '../fo-ec-pd/pd/');

  /* fo-ec-od — 장바구니/주문. */
  R.registerCatalog('cart', '../fo-ec-od/order/');
  R.registerCatalog('order', '../fo-ec-od/order/');

  /* fo-ec-my — 마이페이지(로그인 필요 6개). */
  R.registerCatalog('myOrder', '../fo-ec-my/my/');
  R.registerCatalog('myClaim', '../fo-ec-my/my/');
  R.registerCatalog('myCoupon', '../fo-ec-my/my/');
  R.registerCatalog('myCache', '../fo-ec-my/my/');
  R.registerCatalog('myContact', '../fo-ec-my/my/');
  R.registerCatalog('myChatt', '../fo-ec-my/my/');

  /* fo-ec-cm — 콘텐츠/고객센터성 페이지 10개(원본 소스는 pages/fo/ 바로 밑이지만
     BO의 cm 도메인과 같은 결로 묶었다 — fo-ec-cm/content/manifest.js 주석 참고). */
  R.registerCatalog('about', '../fo-ec-cm/content/');
  R.registerCatalog('blog', '../fo-ec-cm/content/');
  R.registerCatalog('blogEdit', '../fo-ec-cm/content/');
  R.registerCatalog('blogView', '../fo-ec-cm/content/');
  R.registerCatalog('contact', '../fo-ec-cm/content/');
  R.registerCatalog('event', '../fo-ec-cm/content/');
  R.registerCatalog('eventView', '../fo-ec-cm/content/');
  R.registerCatalog('faq', '../fo-ec-cm/content/');
  R.registerCatalog('like', '../fo-ec-cm/content/');
  R.registerCatalog('location', '../fo-ec-cm/content/');

  /* fo-zd — 전시 UI 샘플(xd) + 개발자용 샘플/도구(xs). BO의 bo-zd(개발도구/시뮬레이션)와
     같은 취지로 레포 하나에 소그룹 폴더 2개. */
  R.registerCatalog('dispUi01', '../fo-zd/xd/');
  R.registerCatalog('dispUi02', '../fo-zd/xd/');
  R.registerCatalog('dispUi03', '../fo-zd/xd/');
  R.registerCatalog('dispUi04', '../fo-zd/xd/');
  R.registerCatalog('dispUi05', '../fo-zd/xd/');
  R.registerCatalog('dispUi06', '../fo-zd/xd/');
  R.registerCatalog('sample01', '../fo-zd/xs/');
  R.registerCatalog('sample02', '../fo-zd/xs/');
  R.registerCatalog('sample03', '../fo-zd/xs/');
  R.registerCatalog('sample04', '../fo-zd/xs/');
  R.registerCatalog('sample05', '../fo-zd/xs/');
  R.registerCatalog('sample06', '../fo-zd/xs/');
  R.registerCatalog('sample07', '../fo-zd/xs/');
  R.registerCatalog('sample11', '../fo-zd/xs/');
  R.registerCatalog('sample12', '../fo-zd/xs/');
  R.registerCatalog('sample13', '../fo-zd/xs/');
  R.registerCatalog('sample14', '../fo-zd/xs/');
  R.registerCatalog('sample21', '../fo-zd/xs/');
  R.registerCatalog('sample22', '../fo-zd/xs/');
  R.registerCatalog('sample23', '../fo-zd/xs/');
  R.registerCatalog('xsStore', '../fo-zd/xs/');
  R.registerCatalog('xsLocalStorage', '../fo-zd/xs/');
})();
