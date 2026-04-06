/* ============================================
   DataVisual - Global Config & Widget Registry
   ============================================ */
window.DV_CONFIG = {
  name: 'DataVisual',
  nameEn: 'DATAVISUAL',
  version: 'v260406',

  /* ── Chart palette ── */
  palette: ['#0099cc','#00c97a','#7c3aed','#f59e0b','#ef4444','#0d9488','#e91e8c','#ff6f3c','#00bcd4','#8bc34a'],

  /* ── Widget type registry ── */
  widgetTypes: [
    { typeId:'kpi',        name:'KPI 카드',          icon:'📊', category:'통계',    defaultW:3,  defaultH:1 },
    { typeId:'line',       name:'라인 차트',          icon:'📈', category:'차트',    defaultW:6,  defaultH:2 },
    { typeId:'bar',        name:'바 차트',            icon:'📊', category:'차트',    defaultW:6,  defaultH:2 },
    { typeId:'pie',        name:'파이 차트',          icon:'🥧', category:'차트',    defaultW:4,  defaultH:2 },
    { typeId:'donut',      name:'도넛 차트',          icon:'🍩', category:'차트',    defaultW:4,  defaultH:2 },
    { typeId:'area',       name:'에어리어 차트',      icon:'🌊', category:'차트',    defaultW:6,  defaultH:2 },
    { typeId:'radar',      name:'레이더 차트',        icon:'🕸️', category:'차트',    defaultW:4,  defaultH:2 },
    { typeId:'scatter',    name:'산점도 차트',        icon:'✨', category:'차트',    defaultW:6,  defaultH:2 },
    { typeId:'bubble',     name:'버블 차트',          icon:'🫧', category:'차트',    defaultW:6,  defaultH:2 },
    { typeId:'heatmap',    name:'히트맵',            icon:'🔥', category:'차트',    defaultW:6,  defaultH:2 },
    { typeId:'gauge',      name:'게이지',            icon:'⏱️', category:'차트',    defaultW:3,  defaultH:2 },
    { typeId:'realtime',   name:'실시간 시계열 산점도', icon:'⚡', category:'실시간', defaultW:8,  defaultH:2 },
    { typeId:'table',      name:'데이터 테이블',      icon:'📋', category:'데이터',  defaultW:6,  defaultH:3 },
    { typeId:'stackedbar', name:'스택 바 차트',       icon:'📊', category:'차트',    defaultW:6,  defaultH:2 },
    { typeId:'horizontalbar', name:'수평 바 차트',    icon:'📊', category:'차트',    defaultW:6,  defaultH:2 },
  ],

  /* ── Default dashboard layout ── */
  defaultLayout: [
    { id:'w1', typeId:'kpi',      colSpan:3, rowSpan:1, title:'총 방문자',  opts:{ value:'128,450', trend:'+12.4%', dir:'up',   icon:'👥', color:'blue'   } },
    { id:'w2', typeId:'kpi',      colSpan:3, rowSpan:1, title:'전환율',     opts:{ value:'4.8%',    trend:'+0.6%',  dir:'up',   icon:'🎯', color:'green'  } },
    { id:'w3', typeId:'kpi',      colSpan:3, rowSpan:1, title:'매출',       opts:{ value:'₩84.2M',  trend:'-2.1%',  dir:'down', icon:'💰', color:'orange' } },
    { id:'w4', typeId:'kpi',      colSpan:3, rowSpan:1, title:'활성 사용자', opts:{ value:'3,241',  trend:'+8.7%',  dir:'up',   icon:'🔥', color:'purple' } },
    { id:'w5', typeId:'line',     colSpan:8, rowSpan:2, title:'월별 방문자 추이' },
    { id:'w6', typeId:'donut',    colSpan:4, rowSpan:2, title:'트래픽 출처' },
    { id:'w7', typeId:'bar',      colSpan:6, rowSpan:2, title:'채널별 매출' },
    { id:'w8', typeId:'area',     colSpan:6, rowSpan:2, title:'누적 수익 추이' },
  ],

  /* ── Navigation ── */
  topMenu: [
    { icon:'🏠',  menuId:'dashboard',   menuName:'대시보드' },
    { icon:'📈',  menuId:'gallery',     menuName:'차트 갤러리' },
    { icon:'⚡',  menuId:'realtime',    menuName:'실시간' },
    { icon:'🔲',  menuId:'panels',      menuName:'패널' },
    { icon:'🧩',  menuId:'manager',     menuName:'위젯 관리' },
    { icon:'🖱️',  menuId:'layout',      menuName:'레이아웃 편집' },
  ],
  sidebarMenu: [
    {
      section: '시각화',
      items: [
        { icon:'🏠',  menuId:'dashboard', menuName:'대시보드' },
        { icon:'📈',  menuId:'gallery',   menuName:'차트 갤러리' },
        { icon:'⚡',  menuId:'realtime',  menuName:'실시간 패널' },
        { icon:'🔲',  menuId:'panels',    menuName:'패널 보기' },
      ]
    },
    {
      section: '관리',
      items: [
        { icon:'🧩',  menuId:'manager',  menuName:'위젯 관리' },
        { icon:'🖱️',  menuId:'layout',   menuName:'레이아웃 편집' },
      ]
    }
  ],
};

/* Sample dataset generators (used by widgets) */
window.DvData = {
  months: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  weekdays: ['월','화','수','목','금','토','일'],
  rand: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  randArr: (n, min, max) => Array.from({ length: n }, () => Math.floor(Math.random() * (max - min + 1)) + min),
  randFloat: (min, max, d=1) => parseFloat((Math.random() * (max - min) + min).toFixed(d)),
  randArrFloat: (n, min, max) => Array.from({ length: n }, () => parseFloat((Math.random() * (max - min) + min).toFixed(1))),
};
