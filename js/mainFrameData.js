/**
 * mainFrame.html — 문서·네비·셀렉트·UI 문자열
 * 목록·경로·앱 매핑을 한곳에서 수정하세요.
 */
(function (global) {
  'use strict';

  /** 상단 앱 value → { mode, docId } (navigateTopbarApp) */
  global.MAIN_FRAME_NAV_BY_APP = {
    home_v260329: { mode: 'home_v260329', docId: 'hm_index' },
    docs_v260329: { mode: 'docs_v260329', docId: 'docs_index' },
    anynuri_v260329: { mode: 'anynuri_v260329', docId: 'any_index' },
    datavisual_v260406: { mode: 'datavisual_v260406', docId: 'dv406_index' },
    dangoeul_v260330: { mode: 'dangoeul_v260330', docId: 'dg330_index' },
    modunuri_v260329: { mode: 'modunuri_v260329', docId: 'md_index' },
    partyroom_v260329: { mode: 'partyroom_v260329', docId: 'pr_index' },
    artLeaseSale_v260330: { mode: 'artLeaseSale_v260330', docId: 'als_index' },
    careMate_v260330: { mode: 'careMate_v260330', docId: 'cm_index' },
    shopjoy_v260406: { mode: 'shopjoy_v260406', docId: 'sj_index' }
  };

  /** 상단 검색 패널 섹션: 앱 키는 MAIN_FRAME_NAV_BY_APP 와 동일 */
  global.MAIN_FRAME_SEARCH_GROUPS = [
    { key: '회사제품', apps: ['docs_v260329', 'home_v260329'] },
    { key: '준비중', apps: ['anynuri_v260329', 'datavisual_v260406'] },
    { key: '작업중', apps: ['dangoeul_v260330', 'modunuri_v260329', 'partyroom_v260329', 'artLeaseSale_v260330', 'careMate_v260330', 'shopjoy_v260406'] },
    { key: '서비스중', apps: [] }
  ];

  /**
   * 상단 bar — 회사제품 / 준비중 / 작업중 / 서비스중 / 종료
   * emptyOnly: 비활성·항목 없음 전용
   * placeholderClass: topbar-app-select--placeholder 부여
   */
  global.MAIN_FRAME_TOP_NAV_SELECTS = [
    {
      id: 'topNavSelectCompany',
      label: '회사제품',
      ariaLabel: '회사제품 앱 선택',
      emptyLabel: '선택…',
      options: [
        { value: 'docs_v260329', label: 'docs_v260329' },
        { value: 'home_v260329', label: 'home_v260329' }
      ]
    },
    {
      id: 'topNavSelectPrep',
      label: '준비중',
      ariaLabel: '준비중 앱 선택',
      emptyLabel: '선택…',
      options: [
        { value: 'anynuri_v260329', label: 'anynuri_v260329' },
        { value: 'datavisual_v260406', label: 'datavisual_v260406' }
      ]
    },
    {
      id: 'topNavSelectWork',
      label: '작업중',
      ariaLabel: '작업중 앱 선택',
      emptyLabel: '선택…',
      options: [
        { value: 'dangoeul_v260330', label: 'dangoeul_v260330' },
        { value: 'modunuri_v260329', label: 'modunuri_v260329' },
        { value: 'partyroom_v260329', label: 'partyroom_v260329' },
        { value: 'artLeaseSale_v260330', label: 'artLeaseSale_v260330' },
        { value: 'careMate_v260330', label: 'careMate_v260330' },
        { value: 'shopjoy_v260406', label: 'shopjoy_v260406' }
      ]
    },
    {
      id: 'topNavSelectService',
      label: '서비스중',
      ariaLabel: '서비스중 (항목 없음)',
      disabled: true,
      emptyOnly: true,
      emptyLabel: '항목 없음',
      placeholderClass: true
    },
    {
      id: 'topNavSelectClosed',
      label: '종료',
      ariaLabel: '종료 (항목 없음)',
      disabled: true,
      emptyOnly: true,
      emptyLabel: '항목 없음',
      placeholderClass: true
    }
  ];

  /** 좌측 하단 «서비스보기» — value는 resolveEmbedHtmlFile 기준 경로 */
  global.MAIN_FRAME_SIDEBAR_SITE_NAV_OPTIONS = [
    { value: 'index.html', label: '루트 :: index.html' },
    { value: 'home_v260329', label: 'home_v260329' },
    { value: 'docs_v260329', label: 'docs_v260329' },
    { value: 'modunuri_v260329', label: 'modunuri_v260329' },
    { value: 'partyroom_v260329', label: 'partyroom_v260329' },
    { value: 'dangoeul_v260330', label: 'dangoeul_v260330' },
    { value: 'anynuri_v260329', label: 'anynuri_v260329' },
    { value: 'dataVisual_v26/datavisual_v260406', label: 'datavisual_v260406' },
    { value: 'artLeaseSale_v260330', label: 'artLeaseSale_v260330' },
    { value: 'careMate_v260330', label: 'careMate_v260330' },
    { value: 'ec_v26/shopjoy_v260406', label: 'shopjoy_v260406' },
    { value: 'mainFrame.html', label: '메인프레임 :: mainFrame.html' }
  ];

  /** 좌측 하단 «유용한 사이트» — value 빈 문자열 = 안내 옵션만 */
  global.MAIN_FRAME_SIDEBAR_USEFUL_SITES = [
    { value: '', label: '사이트 선택…' },
    { value: 'https://github.com', label: '➧ github.com' },
    { value: 'https://github.com/gumez75/p2604_dangoeul', label: '..⤷ gumez75/p2604_dangoeul' },
    { value: '', label: ' --------------- ' },
    { value: 'https://www.netlify.com', label: '➧ www.netlify.com' },
    { value: 'https://illeesam.netlify.app', label: '..⤷ illeesam.netlify.app' },
    { value: '', label: ' --------------- ' },
    { value: 'https://www.youtube.com/watch?v=rd1C-LFz8fU', label: 'GitHub Pages로 웹사이트 무료 호스팅하기' },
    { value: 'https://www.youtube.com/watch?v=zK0Lx4aFOFA', label: 'GitHub Pages에 커스텀 도메인 연결' },
    { value: 'https://www.youtube.com/watch?v=WJtetccrv3o&t=156s', label: 'GitHub 웹사이트 Netlify 배포하기 (1개무료) ' }
  ];

  /** 초기 사이드바 앱 (해시 없을 때와 동일) */
  global.MAIN_FRAME_DEFAULT_SIDEBAR_MODE = 'home_v260329';

  /** 문서 기본 app·사이드바 제목용 (MAIN_FRAME_DEFAULT_SIDEBAR_MODE 와 같을 때가 일반적) */
  global.MAIN_FRAME_HOME_APP_KEY = 'home_v260329';

  global.MAIN_FRAME_UI = {
    topbarTitle: '종합서비스관리 v0406_1109',
    sidebarHomeAppTitle: '문서',
    sidebarFooterService: '서비스보기',
    sidebarFooterUseful: '유용한 사이트',
    sidebarSiteNavTitle: '저장소 루트 HTML 절대 경로를 새 창으로 열기',
    sidebarSiteNavAria: '진입 HTML 파일 절대 경로로 새 창 열기',
    sidebarSiteNavHint: '선택한 파일의 절대 URL을 새 창에서 엽니다 (mainFrame 해시 아님)',
    sidebarUsefulAria: '유용한 사이트 선택 후 새 창 열기',
    sidebarUsefulHint: '유용한 사이트 선택 후 새 창 열기',
    emptyState: '왼쪽 메뉴에서 문서를 선택하세요.'
  };

  /** 사이드바·탭·해시에 쓰이는 문서 정의 */
  global.MAIN_FRAME_DOCS = [
    { id: 'hm_index', file: 'home_v260329', label: 'home_v260329', group: '진입', app: 'home_v260329', groupOrder: 5 },
    {
      id: 'dg330_index',
      file: 'dangoeul_v260330',
      label: 'dangoeul_v260330',
      group: '진입',
      app: 'dangoeul_v260330',
      groupOrder: 5
    },
    { id: 'md_index', file: 'modunuri_v260329', label: 'modunuri_v260329', group: '진입', app: 'modunuri_v260329', groupOrder: 5 },
    { id: 'pr_index', file: 'partyroom_v260329', label: 'partyroom_v260329', group: '진입', app: 'partyroom_v260329', groupOrder: 5 },
    { id: 'als_index', file: 'artLeaseSale_v260330', label: 'artLeaseSale_v260330', group: '진입', app: 'artLeaseSale_v260330', groupOrder: 5 },
    { id: 'cm_index', file: 'careMate_v260330', label: 'careMate_v260330', group: '진입', app: 'careMate_v260330', groupOrder: 5 },
    { id: 'sj_index', file: 'ec_v26/shopjoy_v260406', label: 'shopjoy_v260406', group: '진입', app: 'shopjoy_v260406', groupOrder: 5 },
    { id: 'docs_index', file: 'docs_v260329', label: 'docs_v260329', group: '진입', app: 'docs_v260329', groupOrder: 5 },
    { id: 'any_index', file: 'anynuri_v260329', label: 'anynuri_v260329', group: '진입', app: 'anynuri_v260329', groupOrder: 5 },
    {
      id: 'dv406_index',
      file: 'dataVisual_v26/datavisual_v260406',
      label: 'datavisual_v260406',
      group: '진입',
      app: 'datavisual_v260406',
      groupOrder: 5
    },
    {
      id: 'tmp1',
      label: '임시메뉴1',
      group: null,
      hideFromSidebar: true,
      inlineMd: '# 임시메뉴1\n\n내용은 추후 연결할 수 있습니다.'
    },
    {
      id: 'tmp2',
      label: '임시2',
      group: null,
      hideFromSidebar: true,
      inlineMd: '# 임시2\n\n내용은 추후 연결할 수 있습니다.'
    }
  ];

  /** 예전 해시·북마크 호환 */
  global.MAIN_FRAME_DOC_HASH_LEGACY = {
    hm_idx: 'hm_index',
    dg_idx: 'dg330_index',
    md_idx: 'md_index',
    pr_idx: 'pr_index',
    docs_idx: 'docs_index',
    any_idx: 'any_index',
    docs_p0101: 'docs_index',
    docs_p0102: 'docs_index',
    docs_p0200: 'docs_index',
    docs_p0300: 'docs_index',
    docs_p0400: 'docs_index',
    docs_p0500: 'docs_index',
    tmp21: 'tmp2',
    tmp22: 'tmp2',
    readme: 'hm_index',
    tem01: 'hm_index',
    tem02: 'hm_index',
    tem11: 'hm_index',
    tem12: 'hm_index',
    md_tem01: 'md_index',
    md_tem02: 'md_index',
    md_tem11: 'md_index',
    md_tem12: 'md_index',
    pr_tem01: 'pr_index',
    pr_tem02: 'pr_index',
    pr_tem11: 'pr_index',
    pr_tem12: 'pr_index',
    embedDangoeul: 'dg330_index',
    dg_tem01: 'dg330_index',
    dg_tem02: 'dg330_index',
    dg_tem11: 'dg330_index',
    dg_tem12: 'dg330_index',
    dg_res_log: 'dg330_index',
    dg_res_blog: 'dg330_index',
    dg_res_goods: 'dg330_index',
    dg_res_prod: 'dg330_index',
    embedModunuri: 'md_index',
    embedPartyroom: 'pr_index',
    d01: 'hm_index',
    d02: 'hm_index',
    d03: 'hm_index',
    d04: 'hm_index',
    d05: 'hm_index',
    d06: 'hm_index',
    env11: 'hm_index',
    env12: 'hm_index',
    dg_p0100: 'dg330_index',
    dg_p0200: 'dg330_index',
    dg_p0300: 'dg330_index',
    dg_p0400: 'dg330_index',
    dg_p0500: 'dg330_index',
    dg_p0600: 'dg330_index',
    hm_p0100: 'hm_index',
    hm_p0200: 'hm_index',
    hm_p0300: 'hm_index',
    hm_p0400: 'hm_index',
    hm_p0500: 'hm_index',
    md_p0100: 'md_index',
    md_p0200: 'md_index',
    md_p0300: 'md_index',
    md_p0400: 'md_index',
    md_p0500: 'md_index',
    pr_p0100: 'pr_index',
    pr_p0200: 'pr_index',
    pr_p0300: 'pr_index',
    pr_p0400: 'pr_index',
    pr_p0500: 'pr_index',
    etc93: 'hm_index',
    etc91: 'hm_index',
    etc92: 'hm_index',
    etc94: 'hm_index',
    etc95: 'hm_index',
    etc96: 'hm_index',
    etc97: 'hm_index',
    fig9221: 'hm_index',
    fig9222: 'hm_index',
    files923: 'hm_index',
    files924: 'hm_index'
  };
})(typeof window !== 'undefined' ? window : globalThis);
