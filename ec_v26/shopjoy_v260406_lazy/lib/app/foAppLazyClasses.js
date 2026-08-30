/* ShopJoy FO - lazy-load 대상 클래스 맵 (2026-08-30, BO(boAppLazyClasses.js)와 동일 원리)
   foAppBase.js 의 fnEnsurePageLoaded/fnEnsureClassLoaded 가 이 3개 맵만 참조한다.
   "누가 누구를 임베드하는지"는 여기서 관리하지 않는다 — 진입 파일의 소스 텍스트를 fetch 로 읽어
   <kebab-tag> 를 재귀적으로 스캔해서 필요한 파일을 자동 발견한다 (foAppBase.js 참조).

   FO_LAZY_CLASS_FILES: "등록명(태그 PascalCase 기준)" -> 스크립트 경로
   FO_REG_TO_GLOBAL:    등록명과 window 전역명이 다른 경우만 명시(예: BlogPage 태그인데 파일은 window.Blog)
                        — 없으면 등록명 == window 전역명으로 간주
   FO_PAGE_TO_CLASS:    page(id) -> 진입 등록명. home/prodList/prodView/error401~500 은
                        foHomeComp 등 구조적 제약(§ 정책서 참조)으로 항상 eager 라 여기 없음.
                        Sample08~10 은 index.html 에서 <script> 자체가 주석 처리되어 있어(기존
                        운영 상태) 이 맵에도 넣지 않는다 — 넣으면 죽어있던 페이지가 살아나버림 */
window.FO_LAZY_CLASS_FILES = {
  Cart: 'pages/fo/Cart.js',
  Order: 'pages/fo/Order.js',
  Contact: 'pages/fo/Contact.js',
  Faq: 'pages/fo/Faq.js',
  Login: 'pages/fo/Login.js',
  EventPage: 'pages/fo/Event.js',
  EventView: 'pages/fo/EventView.js',
  BlogPage: 'pages/fo/Blog.js',
  BlogView: 'pages/fo/BlogView.js',
  BlogEdit: 'pages/fo/BlogEdit.js',
  LikePage: 'pages/fo/Like.js',
  LocationPage: 'pages/fo/Location.js',
  AboutPage: 'pages/fo/About.js',

  MyOrder: 'pages/fo/my/MyOrder.js',
  MyClaim: 'pages/fo/my/MyClaim.js',
  MyCoupon: 'pages/fo/my/MyCoupon.js',
  MyCache: 'pages/fo/my/MyCache.js',
  MyContact: 'pages/fo/my/MyContact.js',
  MyChatt: 'pages/fo/my/MyChatt.js',

  XdDispUi01: 'pages/fo/xd/DispUi01.js',
  XdDispUi02: 'pages/fo/xd/DispUi02.js',
  XdDispUi03: 'pages/fo/xd/DispUi03.js',
  XdDispUi04: 'pages/fo/xd/DispUi04.js',
  XdDispUi05: 'pages/fo/xd/DispUi05.js',
  XdDispUi06: 'pages/fo/xd/DispUi06.js',

  XsSample01: 'pages/fo/xs/Sample01.js',
  XsSample02: 'pages/fo/xs/Sample02.js',
  XsSample03: 'pages/fo/xs/Sample03.js',
  XsSample04: 'pages/fo/xs/Sample04.js',
  XsSample05: 'pages/fo/xs/Sample05.js',
  XsSample06: 'pages/fo/xs/Sample06.js',
  XsSample07: 'pages/fo/xs/Sample07.js',
  XsSample11: 'pages/fo/xs/Sample11.js',
  XsSample12: 'pages/fo/xs/Sample12.js',
  XsSample13: 'pages/fo/xs/Sample13.js',
  XsSample14: 'pages/fo/xs/Sample14.js',
  XsSample21: 'pages/fo/xs/Sample21.js',
  XsSample22: 'pages/fo/xs/Sample22.js',
  XsSample23: 'pages/fo/xs/Sample23.js',
  XsStore: 'pages/fo/xs/XsStore.js',
  XsLocalStorage: 'pages/fo/xs/XsLocalStorage.js',
};

window.FO_REG_TO_GLOBAL = {
  BlogPage: 'Blog',
  LikePage: 'Like',
  LocationPage: 'Location',
  AboutPage: 'About',
  XdDispUi01: 'DispUi01',
  XdDispUi02: 'DispUi02',
  XdDispUi03: 'DispUi03',
  XdDispUi04: 'DispUi04',
  XdDispUi05: 'DispUi05',
  XdDispUi06: 'DispUi06',
};

window.FO_PAGE_TO_CLASS = {
  cart: 'Cart',
  order: 'Order',
  contact: 'Contact',
  faq: 'Faq',
  event: 'EventPage',
  eventView: 'EventView',
  blog: 'BlogPage',
  blogView: 'BlogView',
  blogEdit: 'BlogEdit',
  like: 'LikePage',
  location: 'LocationPage',
  about: 'AboutPage',

  myOrder: 'MyOrder',
  myClaim: 'MyClaim',
  myCoupon: 'MyCoupon',
  myCache: 'MyCache',
  myContact: 'MyContact',
  myChatt: 'MyChatt',

  dispUi01: 'XdDispUi01',
  dispUi02: 'XdDispUi02',
  dispUi03: 'XdDispUi03',
  dispUi04: 'XdDispUi04',
  dispUi05: 'XdDispUi05',
  dispUi06: 'XdDispUi06',

  sample01: 'XsSample01',
  sample02: 'XsSample02',
  sample03: 'XsSample03',
  sample04: 'XsSample04',
  sample05: 'XsSample05',
  sample06: 'XsSample06',
  sample07: 'XsSample07',
  sample11: 'XsSample11',
  sample12: 'XsSample12',
  sample13: 'XsSample13',
  sample14: 'XsSample14',
  sample21: 'XsSample21',
  sample22: 'XsSample22',
  sample23: 'XsSample23',
  xsStore: 'XsStore',
  xsLocalStorage: 'XsLocalStorage',
};
