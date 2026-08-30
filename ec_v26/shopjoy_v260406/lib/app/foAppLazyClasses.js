/* ShopJoy FO - lazy-load 대상 클래스 맵 (scripts/generateFoLazyClasses.js 로 자동 생성 — 손으로 고치지 말 것!)
   FO 화면을 추가할 때 사람이 손대는 파일은 scripts/generateFoLazyClasses.js 하나뿐이다:
     1) 화면 소스 작성 (pages/fo/...)
     2) generateFoLazyClasses.js 상단 FO_PAGE_TO_CLASS_STATIC 에 pageId: 'ClassName' 한 줄 추가
        (등록 태그명이 파일 내부 window 전역명과 다르면 FO_REG_TO_GLOBAL 에도 추가)
     3) node scripts/generateFoLazyClasses.js (또는 npm run gen-fo-lazy) 실행
   이 파일(foAppLazyClasses.js) 은 그 결과물이라 재생성될 때마다 전체가 덮어써진다.
   아래 각 블록 위 주석에 무슨 용도인지 설명해뒀다. */

/* FO_LAZY_CLASS_FILES — "등록명(태그 PascalCase 기준) → 스크립트 파일 경로" 매핑.
   foAppBase.js 의 lazy 로더(fnEnsurePageLoaded/fnCollectClasses)가 화면을 처음 열 때
   이 맵을 보고 어떤 파일을 loadModule()(동적 import())로 불러올지 찾는다.
   pages/fo 전체를 스캔해서 100% 자동 생성 — 사람이 직접 추가할 항목 없음. */
window.FO_LAZY_CLASS_FILES = {
  AboutPage: "pages/fo/About.js",
  BlogEdit: "pages/fo/BlogEdit.js",
  BlogPage: "pages/fo/Blog.js",
  BlogView: "pages/fo/BlogView.js",
  Cart: "pages/fo/Cart.js",
  Contact: "pages/fo/Contact.js",
  DispUiPage: "pages/fo/xd/DispUiPage.js",
  EventPage: "pages/fo/Event.js",
  EventView: "pages/fo/EventView.js",
  Faq: "pages/fo/Faq.js",
  LikePage: "pages/fo/Like.js",
  LocationPage: "pages/fo/Location.js",
  Login: "pages/fo/Login.js",
  MyCache: "pages/fo/my/MyCache.js",
  MyChatt: "pages/fo/my/MyChatt.js",
  MyClaim: "pages/fo/my/MyClaim.js",
  MyContact: "pages/fo/my/MyContact.js",
  MyCoupon: "pages/fo/my/MyCoupon.js",
  MyOrder: "pages/fo/my/MyOrder.js",
  Order: "pages/fo/Order.js",
  XdDispUi01: "pages/fo/xd/DispUi01.js",
  XdDispUi02: "pages/fo/xd/DispUi02.js",
  XdDispUi03: "pages/fo/xd/DispUi03.js",
  XdDispUi04: "pages/fo/xd/DispUi04.js",
  XdDispUi05: "pages/fo/xd/DispUi05.js",
  XdDispUi06: "pages/fo/xd/DispUi06.js",
  XsLocalStorage: "pages/fo/xs/XsLocalStorage.js",
  XsSample01: "pages/fo/xs/Sample01.js",
  XsSample02: "pages/fo/xs/Sample02.js",
  XsSample03: "pages/fo/xs/Sample03.js",
  XsSample04: "pages/fo/xs/Sample04.js",
  XsSample05: "pages/fo/xs/Sample05.js",
  XsSample06: "pages/fo/xs/Sample06.js",
  XsSample07: "pages/fo/xs/Sample07.js",
  XsSample11: "pages/fo/xs/Sample11.js",
  XsSample12: "pages/fo/xs/Sample12.js",
  XsSample13: "pages/fo/xs/Sample13.js",
  XsSample14: "pages/fo/xs/Sample14.js",
  XsSample21: "pages/fo/xs/Sample21.js",
  XsSample22: "pages/fo/xs/Sample22.js",
  XsSample23: "pages/fo/xs/Sample23.js",
  XsStore: "pages/fo/xs/XsStore.js",
};

/* FO_REG_TO_GLOBAL — "등록명(태그 기준) → 실제 window 전역 변수명" 매핑.
   대부분은 등록명과 파일 내부 window 전역명이 같아서(예: Cart → window.Cart) 필요 없지만,
   극소수(예: <blog-page> 태그인데 파일은 window.Blog) 는 다를 수 있어 여기서 보정한다.
   자동 계산 불가 — 새로 이런 케이스가 생기면 generateFoLazyClasses.js 상단에 직접 추가. */
window.FO_REG_TO_GLOBAL = {
  AboutPage: "About",
  BlogPage: "Blog",
  LikePage: "Like",
  LocationPage: "Location",
  XdDispUi01: "DispUi01",
  XdDispUi02: "DispUi02",
  XdDispUi03: "DispUi03",
  XdDispUi04: "DispUi04",
  XdDispUi05: "DispUi05",
  XdDispUi06: "DispUi06",
};

/* FO_PAGE_TO_CLASS — "pageId(화면 식별자) → 진입 등록명" 매핑.
   foAppBase.js 가 navigate()/URL 복원 시 이 값으로 어떤 클래스를 로드해야 할지 찾는다.
   BO 의 BO_APP_COMP_PAGE 와 같은 역할이지만, FO 는 kebab 태그 매핑 테이블이 따로 없어서
   pageId 가 바로 등록명으로 연결된다. 새 "최상위 페이지" 추가 시 사람이 결정해서 넣는
   유일한 정보 — 이 파일 말고 scripts/generateFoLazyClasses.js 상단의
   FO_PAGE_TO_CLASS_STATIC 에 추가할 것(하위 임베드 컴포넌트는 여기 안 넣어도 자동탐지됨). */
window.FO_PAGE_TO_CLASS = {
  about: "AboutPage",
  blog: "BlogPage",
  blogEdit: "BlogEdit",
  blogView: "BlogView",
  cart: "Cart",
  contact: "Contact",
  dispUi01: "XdDispUi01",
  dispUi02: "XdDispUi02",
  dispUi03: "XdDispUi03",
  dispUi04: "XdDispUi04",
  dispUi05: "XdDispUi05",
  dispUi06: "XdDispUi06",
  event: "EventPage",
  eventView: "EventView",
  faq: "Faq",
  like: "LikePage",
  location: "LocationPage",
  myCache: "MyCache",
  myChatt: "MyChatt",
  myClaim: "MyClaim",
  myContact: "MyContact",
  myCoupon: "MyCoupon",
  myOrder: "MyOrder",
  order: "Order",
  sample01: "XsSample01",
  sample02: "XsSample02",
  sample03: "XsSample03",
  sample04: "XsSample04",
  sample05: "XsSample05",
  sample06: "XsSample06",
  sample07: "XsSample07",
  sample11: "XsSample11",
  sample12: "XsSample12",
  sample13: "XsSample13",
  sample14: "XsSample14",
  sample21: "XsSample21",
  sample22: "XsSample22",
  sample23: "XsSample23",
  xsLocalStorage: "XsLocalStorage",
  xsStore: "XsStore",
};

/* home/prodList/prodView — FO_SITE_NO 별 동적 이름(Home01/Prod01List/Prod01View 등)이라
   위 정적 객체엔 못 적어서 부팅 시점의 window.FO_SITE_NO 를 읽어 여기서 직접 추가한다. */
(function () {
  var N = window.FO_SITE_NO || '01';
  window.FO_LAZY_CLASS_FILES['Home' + N]          = 'pages/fo/Home' + N + '.js';
  window.FO_LAZY_CLASS_FILES['Prod' + N + 'List'] = 'pages/fo/Prod' + N + 'List.js';
  window.FO_LAZY_CLASS_FILES['Prod' + N + 'View'] = 'pages/fo/Prod' + N + 'View.js';
  window.FO_PAGE_TO_CLASS.home     = 'Home' + N;
  window.FO_PAGE_TO_CLASS.prodList = 'Prod' + N + 'List';
  window.FO_PAGE_TO_CLASS.prodView = 'Prod' + N + 'View';
})();
