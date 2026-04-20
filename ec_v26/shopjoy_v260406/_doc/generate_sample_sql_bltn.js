'use strict';
/**
 * cm_blog / cm_blog_cate / cm_blog_file / cm_blog_good / cm_blog_reply / cm_blog_tag
 * 블로그 샘플 데이터 생성기
 *
 * 사용법:
 *   node _doc/generate_sample_sql_bltn.js
 *   → _doc/sample_data_bltn.sql 생성
 *
 * 이미지 URL 기준: http://localhost:8008/cdn/prod/img/blog/
 */

const fs   = require('fs');
const path = require('path');

const SCHEMA   = 'shopjoy_2604';
const SITE     = 'SITE000001';
const REG_BY   = 'SYSTEM';
const IMG_BASE = 'http://localhost:8008/cdn/prod/img/blog';

const esc = (v) => {
  if (v === null || v === undefined) return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
};

const sqlLines = [];
const sec = (title) => {
  sqlLines.push('');
  sqlLines.push(`-- ── ${title} ${'─'.repeat(Math.max(0,55-title.length))}`);
};
const ins = (table, cols, vals) => {
  const c = cols.map(c => c).join(', ');
  const v = vals.map(esc).join(', ');
  sqlLines.push(`INSERT INTO ${SCHEMA}.${table} (${c}) VALUES (${v}) ON CONFLICT DO NOTHING;`);
};

// ════════════════════════════════════════════════════════════
// 1. cm_blog_cate — 블로그 카테고리
// ════════════════════════════════════════════════════════════
sec('1. cm_blog_cate — 블로그 카테고리');

const CATES = [
  { id: 'BC000001', nm: '패션',         sort: 1 },
  { id: 'BC000002', nm: '라이프스타일', sort: 2 },
  { id: 'BC000003', nm: '트렌드',       sort: 3 },
  { id: 'BC000004', nm: '스타일링 팁',  sort: 4 },
  { id: 'BC000005', nm: '뷰티',         sort: 5 },
  { id: 'BC000006', nm: '여행',         sort: 6 },
];

for (const c of CATES) {
  ins('cm_blog_cate',
    ['blog_cate_id','site_id','blog_cate_nm','sort_ord','use_yn','reg_by','reg_date'],
    [c.id, SITE, c.nm, c.sort, 'Y', REG_BY, '2026-01-10 09:00:00']
  );
}

// ════════════════════════════════════════════════════════════
// 2. cm_blog — 블로그 게시글 (20건)
// ════════════════════════════════════════════════════════════
sec('2. cm_blog — 블로그 게시글');

const POSTS = [
  // ── 패션 (BC000001) ─────────────────────────────────────
  {
    id: 'BL000001', cate: 'BC000001',
    title: '2026 봄 시즌 패션 완전 정복',
    summary: '올봄 반드시 알아야 할 트렌드 아이템과 스타일링 법칙을 총정리했습니다.',
    author: '김민지',
    content: `<p>봄이 성큼 다가왔습니다. 올 시즌 패션 트렌드의 핵심 키워드는 <strong>가볍고 자유로움</strong>입니다.</p>
<p>쉬폰 소재의 블라우스, 와이드 슬랙스, 오버사이즈 트렌치코트가 올봄 필수 아이템으로 꼽힙니다. 특히 파스텔 컬러 팔레트가 강세를 보이며 라벤더, 민트, 피치 톤이 주목받고 있습니다.</p>
<p>코디 포인트: 뉴트럴 베이스에 원색 포인트 아이템 하나. 미니멀하지만 임팩트 있는 스타일을 추구해보세요.</p>
<p>이번 시즌 ShopJoy에서 엄선한 봄 신상을 확인해보세요. 한정 수량이니 서두르세요!</p>`,
    viewCount: 3420, isNotice: 'N', date: '2026-04-10 10:00:00',
    bigImg: 'blog-big.jpg', thumbImg: 'blog-1.jpg', smImg: 'sm/blog-sm-1.jpg',
    prod: 'PD000001',
    tags: ['봄패션', '트렌드', '2026SS', '파스텔', '신상품'],
  },
  {
    id: 'BL000002', cate: 'BC000001',
    title: '봄 아우터 베스트 5 완벽 비교',
    summary: '트렌치코트부터 라이트 재킷까지 올봄 필수 아우터 5가지 심층 비교.',
    author: '강하늘',
    content: `<p>환절기 필수 아이템, 봄 아우터. 올해는 어떤 아우터를 선택해야 할까요?</p>
<h3>1위 - 오버핏 트렌치코트</h3>
<p>클래식의 귀환. 베이지 또는 카키 컬러로 선택하면 어떤 하의와도 잘 어울립니다.</p>
<h3>2위 - 리넨 블레이저</h3>
<p>가볍고 통기성이 좋아 한낮 더위에도 걸치기 편합니다. 캐주얼·포멀 모두 소화 가능.</p>
<h3>3위 - 퀼팅 패딩 조끼</h3>
<p>아침·저녁 쌀쌀한 날씨에 레이어드 핵심 아이템. 셔츠 위에 가볍게 걸치세요.</p>
<h3>4위 - 데님 재킷</h3>
<p>워싱 데님 재킷은 캐주얼 룩의 완성. 청청 코디도 올해는 트렌디합니다.</p>
<h3>5위 - 봄 점퍼</h3>
<p>활동적인 라이프스타일에 최적. 방수 기능이 있으면 더욱 실용적입니다.</p>`,
    viewCount: 2180, isNotice: 'N', date: '2026-04-07 11:30:00',
    bigImg: 'blog-big-2.jpg', thumbImg: 'blog-2.jpg', smImg: 'sm/blog-sm-2.jpg',
    prod: 'PD000005',
    tags: ['아우터', '트렌치코트', '봄패션', '추천', '비교'],
  },
  {
    id: 'BL000003', cate: 'BC000001',
    title: '데님 스타일링 A to Z',
    summary: '계절별 데님 스타일링 팁과 케어 방법. 기본 아이템 데님 200% 활용법.',
    author: '정다운',
    content: `<p>데님은 패션 아이템 중 가장 오래되고, 가장 다양하게 활용할 수 있는 소재입니다.</p>
<p><strong>스키니 vs 와이드</strong>: 올해는 루즈 핏 와이드 데님이 대세. 하이웨이스트 라인으로 다리 라인을 살려보세요.</p>
<p>데님 케어 핵심: 세탁은 찬물 단독, 뒤집어서 세탁기 돌리기, 건조기 사용 금지. 이 세 가지만 지켜도 데님 수명이 2~3배 늘어납니다.</p>
<p>올봄 데님 코디 제안: 화이트 오버핏 티 + 라이트 블루 와이드 진 + 화이트 스니커즈. 심플하지만 세련된 룩!</p>`,
    viewCount: 1560, isNotice: 'N', date: '2026-04-03 14:00:00',
    bigImg: 'blog-big-3.jpg', thumbImg: 'blog-3.jpg', smImg: 'sm/blog-sm-3.jpg',
    prod: 'PD000003',
    tags: ['데님', '스타일링', '청바지', '캐주얼', '케어'],
  },
  {
    id: 'BL000004', cate: 'BC000001',
    title: '미니멀 패션으로 매일 세련되게',
    summary: '적은 아이템으로 다양한 코디를 완성하는 미니멀 패션의 기술.',
    author: '이수진',
    content: `<p>미니멀 패션의 핵심은 <strong>질 좋은 기본 아이템</strong>을 갖추는 것입니다.</p>
<p>추천 기본 아이템: 화이트 셔츠 1벌, 블랙 슬랙스 1벌, 베이지 트렌치코트 1벌, 청바지 1벌, 블랙 미디 드레스 1벌. 이 5가지면 한 달 코디가 가능합니다.</p>
<p>컬러 팔레트를 화이트-베이지-그레이-블랙으로 통일하면 어떤 아이템을 꺼내도 매칭이 됩니다. 포인트 컬러는 한 시즌에 1가지만 선택.</p>
<p>미니멀 라이프는 옷장을 비우는 것이 아닌, 진정으로 나를 표현하는 아이템만 남기는 과정입니다.</p>`,
    viewCount: 987, isNotice: 'N', date: '2026-03-28 09:00:00',
    bigImg: 'blog-big-4.jpg', thumbImg: 'blog-4.jpg', smImg: 'sm/blog-sm-1.jpg',
    prod: null,
    tags: ['미니멀', '기본아이템', '캡슐워드로브', '코디', '패션철학'],
  },
  {
    id: 'BL000005', cate: 'BC000001',
    title: '직장인 오피스룩 완성 가이드',
    summary: '세련된 직장인 스타일, 편하면서도 프로페셔널한 오피스 패션 노하우.',
    author: '박지현',
    content: `<p>매일 아침 "오늘 뭐 입지?" 고민하는 직장인들을 위한 스타일 가이드입니다.</p>
<p><strong>요일별 코디 루틴</strong>을 만들면 아침 시간이 절약됩니다. 월요일은 포멀(블레이저+슬랙스), 화-목은 스마트 캐주얼, 금요일은 캐주얼 데이로 설정해보세요.</p>
<p>오피스룩 핵심 아이템: 핏 좋은 테일러드 재킷, 주름 없는 셔츠, 스트레이트 슬랙스, 심플 플랫 슈즈. 여기에 작은 크로스백 하나면 완성.</p>
<p>컬러는 네이비, 그레이, 블랙, 화이트 위주로. 포인트는 스카프나 작은 액세서리로 표현하세요.</p>`,
    viewCount: 2340, isNotice: 'N', date: '2026-03-20 10:00:00',
    bigImg: 'blog-big-5.jpg', thumbImg: 'blog-5.jpg', smImg: 'sm/blog-sm-2.jpg',
    prod: null,
    tags: ['오피스룩', '직장인패션', '비즈니스캐주얼', '스마트캐주얼'],
  },
  // ── 트렌드 (BC000003) ────────────────────────────────────
  {
    id: 'BL000006', cate: 'BC000003',
    title: '2026 봄 트렌드 컬러 완벽 가이드',
    summary: '올봄 주목해야 할 트렌드 컬러와 컬러 매칭법. 파스텔부터 비비드까지.',
    author: '이수진',
    content: `<p>올 봄·여름 시즌의 핵심 컬러를 소개합니다. Pantone과 각 패션위크 런웨이에서 공통으로 포착된 컬러들입니다.</p>
<p><strong>라벤더 헤이즈</strong>: 올해의 컬러. 부드럽고 몽환적인 라벤더 톤은 캐주얼부터 포멀까지 완벽하게 소화됩니다.</p>
<p><strong>소프트 민트</strong>: 자연에서 영감을 받은 민트 그린. 화이트나 크림과 매칭하면 상쾌한 봄 무드를 완성합니다.</p>
<p><strong>코랄 핑크</strong>: 생동감 넘치는 에너지. 네이비나 카키와 대비를 이루면 세련된 인상을 줍니다.</p>
<p>컬러 믹스 황금 법칙: 파스텔 2가지 + 뉴트럴 1가지. 이 조합이면 실패 없는 봄 코디가 완성됩니다.</p>`,
    viewCount: 4120, isNotice: 'N', date: '2026-04-08 11:00:00',
    bigImg: 'blog-big-6.jpg', thumbImg: 'blog-6.jpg', smImg: 'sm/blog-sm-3.jpg',
    prod: null,
    tags: ['트렌드', '컬러', '2026SS', '라벤더', '파스텔'],
  },
  {
    id: 'BL000007', cate: 'BC000003',
    title: '패션위크 베스트 룩 분석',
    summary: '파리, 밀라노, 뉴욕 패션위크 하이라이트 & 2026 F/W 주목 트렌드.',
    author: '강하늘',
    content: `<p>2026 F/W 시즌 패션위크가 막을 내렸습니다. 런웨이에서 공통으로 보인 키트렌드를 분석합니다.</p>
<p><strong>코쿤 실루엣</strong>: 몸을 감싸는 오버사이즈 코쿤 코트가 강세. 내추럴 소재와 결합해 고급스러운 볼륨감을 표현합니다.</p>
<p><strong>70년대 레트로</strong>: 와이드 플레어 팬츠, 블록힐 부츠, 어스 톤 컬러로 70년대 감성이 돌아왔습니다.</p>
<p><strong>매크라메 & 크로셰</strong>: 수공예 질감의 니트와 크로셰 디테일이 브랜드를 가리지 않고 등장했습니다.</p>
<p>이번 시즌의 공통 키워드는 <em>슬로우 패션</em>과 <em>지속 가능성</em>. 대형 브랜드들도 리사이클 소재 라인을 적극 확장했습니다.</p>`,
    viewCount: 1870, isNotice: 'N', date: '2026-03-15 13:00:00',
    bigImg: 'blog-big-7.jpg', thumbImg: 'blog-7.jpg', smImg: 'sm/blog-sm-1.jpg',
    prod: null,
    tags: ['패션위크', '파리', '밀라노', '런웨이', '트렌드분석'],
  },
  {
    id: 'BL000008', cate: 'BC000003',
    title: 'SNS에서 핫한 스트릿 패션 5가지',
    summary: '인스타그램·피들·틱톡에서 급부상한 스트릿 패션 트렌드 분석.',
    author: '정다운',
    content: `<p>SNS는 이제 패션 트렌드의 발원지입니다. 올해 가장 많이 회자된 스트릿 룩을 정리했습니다.</p>
<p>1. <strong>Y2K 감성</strong>: 2000년대 초반 스타일의 귀환. 로우라이즈 진, 버터플라이 클립, 베이비 티가 핵심 아이템.</p>
<p>2. <strong>고프코어(Gorpcore)</strong>: 아웃도어 기능성 아이템을 패션으로 승화. 플리스, 기능성 조끼, 트레킹 슈즈.</p>
<p>3. <strong>바로크 프린트</strong>: 화려한 바로크 패턴을 현대적으로 재해석. 셔츠나 스카프에 포인트 활용.</p>
<p>4. <strong>모노크롬 레이어링</strong>: 같은 색 계열 아이템을 겹쳐 입는 '토탈 코디'. 베이지 온 베이지, 블랙 온 블랙.</p>
<p>5. <strong>테크웨어</strong>: 기술적 소재와 미래지향적 디자인. 방수 코팅 소재, 유틸리티 포켓이 특징.</p>`,
    viewCount: 3210, isNotice: 'N', date: '2026-03-05 15:00:00',
    bigImg: 'blog-big.jpg', thumbImg: 'blog-1.jpg', smImg: 'sm/blog-sm-2.jpg',
    prod: null,
    tags: ['스트릿패션', 'SNS트렌드', 'Y2K', '고프코어', '인스타'],
  },
  // ── 라이프스타일 (BC000002) ──────────────────────────────
  {
    id: 'BL000009', cate: 'BC000002',
    title: '미니멀 라이프를 위한 옷장 정리법',
    summary: '효율적인 옷장 정리와 캡슐 워드로브 구성. 적은 아이템으로 다양한 코디를.',
    author: '박지현',
    content: `<p>미니멀 라이프의 시작은 옷장 정리입니다. 스웨덴의 '라곰(Lagom)' 철학처럼 딱 적당한 양이 핵심입니다.</p>
<p><strong>3단계 정리법</strong></p>
<p>1단계: 모든 옷을 침대에 쏟아내기. 내가 가진 양을 눈으로 직접 확인합니다.</p>
<p>2단계: "이 옷을 입을 때 기분이 좋은가?" 질문하기. NO라면 기부 박스에.</p>
<p>3단계: 남은 옷을 컬러별로 정리. 한눈에 보이면 코디 고민 시간이 절반으로 줍니다.</p>
<p>캡슐 워드로브 기본 구성: 톱 7벌, 하의 5벌, 아우터 3벌, 슈즈 3켤레. 이 20피스면 한 달이 넘습니다.</p>`,
    viewCount: 2890, isNotice: 'N', date: '2026-04-05 09:30:00',
    bigImg: 'blog-big-2.jpg', thumbImg: 'blog-2.jpg', smImg: 'sm/blog-sm-3.jpg',
    prod: null,
    tags: ['미니멀', '옷장정리', '캡슐워드로브', '라이프스타일', '정리'],
  },
  {
    id: 'BL000010', cate: 'BC000002',
    title: '지속 가능한 패션의 시작',
    summary: '환경을 생각하는 패션 소비, 어디서부터 시작할 수 있을까요?',
    author: '최예린',
    content: `<p>패션 산업은 전 세계 탄소 배출량의 약 10%를 차지합니다. 우리의 소비 습관이 지구에 미치는 영향을 생각해볼 시간입니다.</p>
<p><strong>지속 가능한 패션 실천법</strong></p>
<p>1. <strong>Buy Less, Buy Better</strong>: 저가 아이템 5벌보다 품질 좋은 1벌. 오래 입을 수 있는 아이템에 투자하세요.</p>
<p>2. <strong>소재 확인하기</strong>: 오가닉 코튼, 리사이클 폴리에스터, 텐셀 같은 친환경 소재를 우선합니다.</p>
<p>3. <strong>중고 의류 활용</strong>: 빈티지숍, 중고 플랫폼을 활용하면 유니크한 아이템을 합리적 가격에 구입할 수 있습니다.</p>
<p>4. <strong>옷 수선하기</strong>: 버리기 전에 수선을 먼저 시도. 단추 교체, 기장 수선으로 새 옷처럼 살릴 수 있습니다.</p>
<p>ShopJoy도 이러한 가치에 공감하며 친환경 브랜드 라인업을 확대하고 있습니다.</p>`,
    viewCount: 1430, isNotice: 'N', date: '2026-03-28 14:00:00',
    bigImg: 'blog-big-3.jpg', thumbImg: 'blog-3.jpg', smImg: 'sm/blog-sm-1.jpg',
    prod: null,
    tags: ['지속가능', '친환경', '윤리패션', '에코패션', '슬로우패션'],
  },
  {
    id: 'BL000011', cate: 'BC000002',
    title: '패션으로 자존감을 높이는 방법',
    summary: '내가 입는 옷이 내 기분과 자신감에 미치는 심리학적 영향.',
    author: '김민지',
    content: `<p>'Enclothed Cognition(의복된 인지)' — 입는 옷이 우리의 심리와 행동에 영향을 미친다는 심리학 이론입니다.</p>
<p>실험 결과: 정장을 입은 사람들은 창의적 사고와 추상적 사고 능력이 더 높게 측정되었습니다. 옷이 마음가짐을 만든다는 증거입니다.</p>
<p><strong>자존감을 높이는 스타일링 팁</strong></p>
<p>1. 나에게 잘 맞는 핏 찾기: 완벽한 핏의 옷 하나가 어떤 명품보다 자신감을 줍니다.</p>
<p>2. 내가 좋아하는 컬러 입기: 남들의 시선보다 내 기분이 좋아지는 컬러를 선택하세요.</p>
<p>3. 특별한 날만을 위한 옷 없애기: 매일을 특별하게. 좋은 옷은 지금 입어야 합니다.</p>`,
    viewCount: 1650, isNotice: 'N', date: '2026-03-18 10:00:00',
    bigImg: 'blog-big-4.jpg', thumbImg: 'blog-4.jpg', smImg: 'sm/blog-sm-2.jpg',
    prod: null,
    tags: ['패션심리학', '자존감', '스타일', '마인드셋', '자기표현'],
  },
  {
    id: 'BL000012', cate: 'BC000002',
    title: '사계절 옷장 관리 완벽 가이드',
    summary: '계절 전환기마다 현명하게 옷장을 관리하는 실용 가이드.',
    author: '이수진',
    content: `<p>옷장 관리를 잘하면 아침 시간이 여유로워집니다. 계절 전환기 옷장 정리 루틴을 공유합니다.</p>
<p><strong>계절 전환 정리 루틴 (연 2회)</strong></p>
<p>STEP 1 - 지난 시즌 돌아보기: 한 번도 못 입은 옷은 과감히 처분. 안 입은 이유가 있습니다.</p>
<p>STEP 2 - 세탁 & 보관: 보관 전 반드시 세탁. 울, 캐시미어는 드라이클리닝 후 방충제와 함께 보관.</p>
<p>STEP 3 - 이번 시즌 필요한 것 파악: 비어있는 아이템을 리스트업하고 합리적인 쇼핑 계획 세우기.</p>
<p>STEP 4 - 수납 최적화: 자주 입는 것은 눈높이에, 비시즌은 최상단이나 바닥. 컬러별 정리면 코디가 빨라집니다.</p>`,
    viewCount: 980, isNotice: 'N', date: '2026-03-10 09:00:00',
    bigImg: 'blog-big-5.jpg', thumbImg: 'blog-5.jpg', smImg: 'sm/blog-sm-3.jpg',
    prod: null,
    tags: ['옷장관리', '수납', '계절정리', '생활꿀팁', '홈스타일링'],
  },
  // ── 스타일링 팁 (BC000004) ───────────────────────────────
  {
    id: 'BL000013', cate: 'BC000004',
    title: '체형별 스타일링 완벽 가이드',
    summary: '내 체형에 맞는 스타일링으로 매일 자신 있게. 체형별 추천 아이템.',
    author: '박지현',
    content: `<p>어떤 체형도 스타일링 방법을 알면 매력적으로 표현할 수 있습니다.</p>
<p><strong>애플형(상체 발달)</strong>: V넥 상의로 시선 분산, 하이웨이스트 하의로 허리 강조, 와이드 팬츠로 밸런스.</p>
<p><strong>페어형(하체 발달)</strong>: 볼드한 상의로 시선 위로, 다크 컬러 하의, 에이라인 스커트로 힙라인 커버.</p>
<p><strong>직사각형(직선형)</strong>: 허리를 강조하는 벨트 활용, 레이어드로 볼륨감 연출, 크롭 상의 + 하이웨이스트 조합.</p>
<p><strong>모래시계형</strong>: 핏되는 실루엣으로 균형 있는 바디라인 강조. 랩 드레스, 핏 앤 플레어가 최적.</p>
<p>중요한 것은 트렌드보다 나에게 맞는 핏과 실루엣입니다.</p>`,
    viewCount: 4560, isNotice: 'N', date: '2026-04-12 10:00:00',
    bigImg: 'blog-big-6.jpg', thumbImg: 'blog-6.jpg', smImg: 'sm/blog-sm-1.jpg',
    prod: null,
    tags: ['체형별스타일링', '스타일팁', '코디법', '패션꿀팁'],
  },
  {
    id: 'BL000014', cate: 'BC000004',
    title: '아이템 하나로 3가지 코디 완성',
    summary: '트렌치코트 하나로 캐주얼·오피스·데이트 룩 완성하는 다재다능 스타일링.',
    author: '강하늘',
    content: `<p>한 아이템으로 여러 가지 코디를 만드는 것이 진정한 스타일리스트의 능력입니다.</p>
<p><strong>트렌치코트 3가지 활용법</strong></p>
<p>룩 1 - <strong>캐주얼</strong>: 화이트 후드티 + 슬림 진 + 화이트 스니커즈 위에 트렌치코트 오픈. 가볍고 세련된 데일리 룩.</p>
<p>룩 2 - <strong>오피스</strong>: 블랙 터틀넥 + 그레이 슬랙스 + 로퍼 위에 트렌치코트 버튼 잠금. 단정하고 프로페셔널.</p>
<p>룩 3 - <strong>데이트</strong>: 플로럴 미디 드레스 위에 트렌치코트 벨트로 허리 묶기. 로맨틱하고 세련된 분위기.</p>
<p>하나의 아우터로 전혀 다른 분위기를 연출할 수 있습니다. 투자 가치 있는 아이템을 신중하게 선택하세요.</p>`,
    viewCount: 2100, isNotice: 'N', date: '2026-03-22 11:00:00',
    bigImg: 'blog-big-7.jpg', thumbImg: 'blog-7.jpg', smImg: 'sm/blog-sm-2.jpg',
    prod: 'PD000005',
    tags: ['코디법', '트렌치코트', '원아이템3코디', '스타일팁', '데일리룩'],
  },
  {
    id: 'BL000015', cate: 'BC000004',
    title: '색깔 매칭의 황금 법칙',
    summary: '컬러 휠을 기반으로 한 과학적인 컬러 매칭 방법과 실용 예시.',
    author: '정다운',
    content: `<p>컬러 매칭은 감각만이 아니라 이론적 기반이 있습니다. 컬러 휠의 원리를 알면 누구나 세련된 코디를 할 수 있습니다.</p>
<p><strong>컬러 매칭 5원칙</strong></p>
<p>1. <strong>모노크롬</strong>: 같은 색의 다른 명도·채도. 가장 안전하고 세련된 조합. 예: 네이비 + 라이트 블루.</p>
<p>2. <strong>아날로그</strong>: 컬러 휠에서 인접한 색상. 자연스럽고 조화롭습니다. 예: 초록 + 노랑 + 주황.</p>
<p>3. <strong>보색</strong>: 반대편 색상. 강렬한 대비감. 예: 보라 + 노랑, 레드 + 그린.</p>
<p>4. <strong>60-30-10 법칙</strong>: 메인 60% + 서브 30% + 포인트 10%. 가장 균형 잡힌 배분.</p>
<p>5. <strong>뉴트럴 베이스</strong>: 화이트·베이지·그레이·블랙은 어디에도 잘 어울립니다. 이 4가지가 기본.</p>`,
    viewCount: 1780, isNotice: 'N', date: '2026-03-12 13:00:00',
    bigImg: 'blog-big.jpg', thumbImg: 'blog-1.jpg', smImg: 'sm/blog-sm-3.jpg',
    prod: null,
    tags: ['컬러매칭', '색깔조합', '스타일팁', '코디', '패션이론'],
  },
  // ── 뷰티 (BC000005) ─────────────────────────────────────
  {
    id: 'BL000016', cate: 'BC000005',
    title: '패션과 어울리는 봄 메이크업',
    summary: '봄 패션 트렌드에 맞춘 메이크업 룩. 파스텔 코디에 최적화된 뷰티 팁.',
    author: '최예린',
    content: `<p>패션과 메이크업은 서로를 완성합니다. 올봄 트렌드 컬러 파스텔 패션에 어울리는 메이크업을 소개합니다.</p>
<p><strong>파스텔 패션 메이크업</strong></p>
<p>파스텔 컬러 의상을 입을 때는 베이스를 가볍고 자연스럽게 유지하는 것이 핵심입니다. 과한 컨투어링은 파스텔의 부드러운 분위기를 해칩니다.</p>
<p>포인트는 립 하나로. 코랄 핑크나 테라코타 립으로 화사한 봄 분위기를 연출해보세요.</p>
<p>아이 메이크업은 생략하거나 브라운 쉐도우로 자연스럽게. 마스카라 한 번이면 충분합니다.</p>
<p>볼 터치는 사과 부분에 살짝. 핑크나 피치 계열로 건강하고 생기 있는 인상을 만들어줍니다.</p>`,
    viewCount: 1230, isNotice: 'N', date: '2026-04-01 10:00:00',
    bigImg: 'blog-big-2.jpg', thumbImg: 'blog-2.jpg', smImg: 'sm/blog-sm-1.jpg',
    prod: null,
    tags: ['뷰티', '메이크업', '봄메이크업', '파스텔', '화장법'],
  },
  {
    id: 'BL000017', cate: 'BC000005',
    title: '향수 선택 완벽 가이드',
    summary: '계절별, 상황별 향수 추천. 나만의 시그니처 향기를 찾는 방법.',
    author: '김민지',
    content: `<p>향기는 패션의 마지막 레이어입니다. 나만의 시그니처 향수를 찾으면 스타일이 완성됩니다.</p>
<p><strong>봄·여름에 어울리는 계열</strong>: 플로럴(꽃향기), 후레쉬(시트러스), 아쿠아틱(바다향). 가볍고 청량한 향이 계절과 어우러집니다.</p>
<p><strong>향수 시향 팁</strong>: 절대 즉시 판단하지 않기. 탑노트(첫 향기, 10분)→미들노트(30분)→베이스노트(수 시간) 순서로 향이 변합니다. 미들노트가 나를 위한 향기입니다.</p>
<p><strong>향수 사용 팁</strong>: 손목보다 목 뒤, 귀 뒤, 팔꿈치 안쪽이 더 오래 유지됩니다. 체온이 높은 부위에 뿌리는 것이 핵심.</p>`,
    viewCount: 870, isNotice: 'N', date: '2026-03-25 09:00:00',
    bigImg: 'blog-big-3.jpg', thumbImg: 'blog-3.jpg', smImg: 'sm/blog-sm-2.jpg',
    prod: null,
    tags: ['향수', '뷰티', '시그니처향기', '봄향수', '퍼퓸'],
  },
  // ── 여행 (BC000006) ─────────────────────────────────────
  {
    id: 'BL000018', cate: 'BC000006',
    title: '여행 패킹의 기술 — 캐리어 하나로 2주',
    summary: '스마트한 여행 패킹 노하우. 최소한의 짐으로 최대한의 코디.',
    author: '이수진',
    content: `<p>여행의 즐거움을 반감시키는 것 중 하나가 무거운 짐입니다. 스마트한 패킹으로 여행을 가볍게 만드세요.</p>
<p><strong>패킹의 기본 원칙</strong>: '혹시 필요할지도'는 금물. 필요한 것만, 그것도 최소화.</p>
<p>기본 5일치 의류를 준비하고 여행지 세탁 서비스 활용. 같은 아이템 다르게 코디하는 것이 핵심.</p>
<p><strong>추천 여행 캡슐 워드로브</strong>: 티셔츠 4장(화이트 2, 컬러 2), 바지 2벌(청바지 1, 슬랙스/스커트 1), 아우터 1벌, 드레스 1벌, 슈즈 2켤레(스니커즈 + 샌들).</p>
<p>이 12피스면 2주 여행도 거뜬합니다. 컬러를 통일하면 어떤 조합도 잘 어울립니다.</p>`,
    viewCount: 2670, isNotice: 'N', date: '2026-04-06 11:00:00',
    bigImg: 'blog-big-4.jpg', thumbImg: 'blog-4.jpg', smImg: 'sm/blog-sm-3.jpg',
    prod: null,
    tags: ['여행패킹', '여행패션', '패킹노하우', '미니멀여행', '캐리어'],
  },
  {
    id: 'BL000019', cate: 'BC000006',
    title: '도시별 드레스코드 완벽 정리',
    summary: '파리, 도쿄, 뉴욕, 방콕 등 도시별 패션 문화와 여행 스타일링 팁.',
    author: '박지현',
    content: `<p>여행지의 문화에 맞는 스타일링은 현지인에 대한 존중입니다. 도시별 드레스코드를 알아봅니다.</p>
<p><strong>파리</strong>: 과하지 않은 프렌치 시크. 스트라이프 마린 티, 와이드 팬츠, 트렌치코트의 조합. 절대 과하게 차려입지 않습니다.</p>
<p><strong>도쿄</strong>: 레이어드와 믹스매치의 도시. 아방가르드한 실험적 코디가 환영받습니다. 하라주쿠 스타일부터 미니멀 스타일까지 공존.</p>
<p><strong>뉴욕</strong>: 실용성과 세련됨의 균형. 스니커즈 + 드레스 조합이 뉴요커의 기본. 무채색 베이스에 포인트 액세서리.</p>
<p><strong>방콕</strong>: 더위를 고려한 린넨·코튼 소재. 사원 방문 시 어깨와 무릎을 가리는 것이 예의. 밝은 컬러와 플로럴 패턴이 도시 분위기와 어울립니다.</p>`,
    viewCount: 1540, isNotice: 'N', date: '2026-03-30 14:00:00',
    bigImg: 'blog-big-5.jpg', thumbImg: 'blog-5.jpg', smImg: 'sm/blog-sm-1.jpg',
    prod: null,
    tags: ['여행패션', '도시별드레스코드', '파리', '도쿄', '여행스타일'],
  },
  // ── 공지 (BC000001) ─────────────────────────────────────
  {
    id: 'BL000020', cate: 'BC000001',
    title: '[공지] ShopJoy 블로그 오픈 안내',
    summary: 'ShopJoy 공식 블로그가 오픈되었습니다. 패션 트렌드, 스타일링 팁, 이벤트 소식을 전합니다.',
    author: 'ShopJoy',
    content: `<p>안녕하세요, <strong>ShopJoy</strong>입니다.</p>
<p>오늘 ShopJoy 공식 블로그를 오픈합니다. 앞으로 이 블로그에서 다음과 같은 콘텐츠를 제공할 예정입니다.</p>
<ul>
<li>최신 패션 트렌드 분석</li>
<li>스타일링 팁과 코디 가이드</li>
<li>신상품 소개 및 추천</li>
<li>이벤트 & 프로모션 안내</li>
<li>지속 가능한 패션 이야기</li>
</ul>
<p>구독과 댓글로 많은 응원 부탁드립니다. 여러분과 함께 더 나은 패션 라이프를 만들어가겠습니다.</p>
<p>감사합니다. 🙏</p>`,
    viewCount: 5120, isNotice: 'Y', date: '2026-01-15 09:00:00',
    bigImg: 'blog-big-6.jpg', thumbImg: 'blog-6.jpg', smImg: 'sm/blog-sm-2.jpg',
    prod: null,
    tags: ['공지', '블로그오픈', 'ShopJoy'],
  },
];

const COL_BLTN = ['blog_id','site_id','blog_cate_id','blog_title','blog_summary',
                  'blog_content','blog_author','prod_id','view_count','use_yn','is_notice',
                  'reg_by','reg_date'];

for (const p of POSTS) {
  ins('cm_blog', COL_BLTN,
    [p.id, SITE, p.cate, p.title, p.summary,
     p.content, p.author, p.prod, p.viewCount, 'Y', p.isNotice,
     REG_BY, p.date]
  );
}

// ════════════════════════════════════════════════════════════
// 3. cm_blog_file — 블로그 이미지
// ════════════════════════════════════════════════════════════
sec('3. cm_blog_file — 블로그 이미지');

let bfSeq = 1;
const mkBfId = () => `BF${String(bfSeq++).padStart(6,'0')}`;

const COL_FILE = ['blog_img_id','blog_id','img_url','thumb_url','img_alt_text','sort_ord','reg_by','reg_date'];

for (const p of POSTS) {
  // 메인 이미지 (sort_ord=0)
  ins('cm_blog_file', COL_FILE,
    [mkBfId(), p.id,
     `${IMG_BASE}/${p.bigImg}`,
     `${IMG_BASE}/${p.thumbImg}`,
     p.title, 0, REG_BY, p.date]
  );
  // 서브 썸네일 (sort_ord=1)
  ins('cm_blog_file', COL_FILE,
    [mkBfId(), p.id,
     `${IMG_BASE}/${p.smImg}`,
     `${IMG_BASE}/${p.smImg}`,
     `${p.title} - 썸네일`, 1, REG_BY, p.date]
  );
}

// ════════════════════════════════════════════════════════════
// 4. cm_blog_tag — 블로그 태그
// ════════════════════════════════════════════════════════════
sec('4. cm_blog_tag — 블로그 태그');

let btSeq = 1;
const COL_TAG = ['blog_tag_id','site_id','blog_id','tag_nm','sort_ord','reg_by','reg_date'];

for (const p of POSTS) {
  (p.tags || []).forEach((tag, i) => {
    ins('cm_blog_tag', COL_TAG,
      [`BT${String(btSeq++).padStart(6,'0')}`, SITE, p.id, tag, i, REG_BY, p.date]
    );
  });
}

// ════════════════════════════════════════════════════════════
// 5. cm_blog_reply — 댓글 & 대댓글
// ════════════════════════════════════════════════════════════
sec('5. cm_blog_reply — 댓글');

let brSeq = 1;
const mkCmId = () => `CM${String(brSeq++).padStart(6,'0')}`;
const COL_RPL = ['comment_id','site_id','blog_id','parent_comment_id','writer_id','writer_nm',
                 'blog_comment_content','comment_status_cd','comment_status_cd_before','reg_by','reg_date'];

const REPLIES_DATA = [
  { blogId:'BL000001', comments:[
    { id:'CM000001', pid:null, wId:'MB000001', wNm:'이수진', txt:'정말 유용한 정보네요! 다음 시즌 스타일링에 꼭 참고하겠습니다 😊', date:'2026-04-10 12:30:00' },
    { id:'CM000002', pid:null, wId:'MB000002', wNm:'박지현', txt:'사진도 예쁘고 설명도 자세해서 좋아요. 트렌치코트 어디서 구매했나요?', date:'2026-04-10 14:00:00' },
    { id:'CM000003', pid:'CM000002', wId:'MB000003', wNm:'정다운', txt:'저도 궁금해요! ShopJoy에서 파는 것 같던데요~', date:'2026-04-10 15:20:00' },
    { id:'CM000004', pid:null, wId:'MB000004', wNm:'최예린', txt:'이런 글 더 많이 올려주세요! 매번 기다리고 있습니다.', date:'2026-04-11 09:00:00' },
    { id:'CM000005', pid:'CM000001', wId:'MB000005', wNm:'강하늘', txt:'맞아요, 저도 따라해봤는데 완전 좋았어요!', date:'2026-04-11 10:30:00' },
  ]},
  { blogId:'BL000002', comments:[
    { id:'CM000006', pid:null, wId:'MB000002', wNm:'박지현', txt:'트렌치코트 진짜 필수템이죠. 올봄엔 꼭 사야겠어요!', date:'2026-04-07 14:00:00' },
    { id:'CM000007', pid:null, wId:'MB000006', wNm:'김서연', txt:'데님 재킷도 있어서 좋네요. 봄 아우터 고르는 데 도움이 많이 됐어요.', date:'2026-04-08 09:00:00' },
    { id:'CM000008', pid:'CM000006', wId:'MB000001', wNm:'이수진', txt:'저도 트렌치코트로 결정했어요! ShopJoy꺼 예쁘더라고요 ㅎㅎ', date:'2026-04-08 10:00:00' },
  ]},
  { blogId:'BL000003', comments:[
    { id:'CM000009', pid:null, wId:'MB000003', wNm:'정다운', txt:'데님 케어 방법 몰랐는데 이제 알겠어요. 뒤집어서 세탁하는 거 꼭 실천해야겠어요!', date:'2026-04-03 16:00:00' },
    { id:'CM000010', pid:null, wId:'MB000007', wNm:'오민준', txt:'와이드 데님 어디 거 추천하시나요?', date:'2026-04-04 10:00:00' },
    { id:'CM000011', pid:'CM000010', wId:'MB000001', wNm:'이수진', txt:'ShopJoy 신상 와이드 진 완전 추천! 핏이 진짜 좋아요', date:'2026-04-04 11:30:00' },
    { id:'CM000012', pid:null, wId:'MB000004', wNm:'최예린', txt:'청청코디도 트렌디하다니! 해봐야겠어요 ㅎㅎ', date:'2026-04-05 09:00:00' },
  ]},
  { blogId:'BL000006', comments:[
    { id:'CM000013', pid:null, wId:'MB000001', wNm:'이수진', txt:'라벤더 컬러 너무 예뻐요! 올봄 완전 입고 싶은 색상이에요 💜', date:'2026-04-08 12:00:00' },
    { id:'CM000014', pid:null, wId:'MB000008', wNm:'한지수', txt:'파스텔 컬러 믹스하기가 항상 어려웠는데 60-30-10 법칙 적용해봐야겠어요!', date:'2026-04-09 09:30:00' },
    { id:'CM000015', pid:'CM000013', wId:'MB000005', wNm:'강하늘', txt:'저도 라벤더 원피스 샀는데 진짜 너무 예뻐요~', date:'2026-04-09 11:00:00' },
    { id:'CM000016', pid:null, wId:'MB000009', wNm:'윤서준', txt:'코랄 핑크도 예쁘죠! 올봄 컬러는 정말 다 예쁜 것 같아요', date:'2026-04-10 14:00:00' },
    { id:'CM000017', pid:null, wId:'MB000002', wNm:'박지현', txt:'컬러 가이드 덕분에 쇼핑이 쉬워질 것 같아요 감사합니다!', date:'2026-04-10 16:00:00' },
  ]},
  { blogId:'BL000009', comments:[
    { id:'CM000018', pid:null, wId:'MB000006', wNm:'김서연', txt:'캡슐 워드로브 진짜 해보고 싶었는데 이 글 보고 드디어 시작했어요!', date:'2026-04-05 11:00:00' },
    { id:'CM000019', pid:null, wId:'MB000003', wNm:'정다운', txt:'침대에 옷 다 쏟아내기... 저도 해봤는데 충격적이었어요 ㅋㅋㅋ', date:'2026-04-05 13:00:00' },
    { id:'CM000020', pid:'CM000018', wId:'MB000007', wNm:'오민준', txt:'저도 캡슐 워드로브 1달째 실천 중인데 정말 아침이 편해졌어요!', date:'2026-04-06 09:00:00' },
    { id:'CM000021', pid:null, wId:'MB000010', wNm:'임채원', txt:'미니멀 라이프 지향하는 분들 꼭 읽어보세요. 강추!', date:'2026-04-06 15:00:00' },
  ]},
  { blogId:'BL000010', comments:[
    { id:'CM000022', pid:null, wId:'MB000004', wNm:'최예린', txt:'지속 가능한 패션 진짜 중요한 것 같아요. 중고 의류 플랫폼 자주 이용하게 됐어요!', date:'2026-03-29 10:00:00' },
    { id:'CM000023', pid:null, wId:'MB000008', wNm:'한지수', txt:'옷 수선하기 꼭 실천해봐야겠어요. 단추 떨어진 옷이 몇 개 있는데...', date:'2026-03-29 14:00:00' },
    { id:'CM000024', pid:'CM000022', wId:'MB000005', wNm:'강하늘', txt:'저도 올해부터 중고 플랫폼 애용하고 있어요! 빈티지 좋은 거 많더라고요', date:'2026-03-30 09:00:00' },
  ]},
  { blogId:'BL000013', comments:[
    { id:'CM000025', pid:null, wId:'MB000001', wNm:'이수진', txt:'페어형 스타일링 항상 고민이었는데 에이라인 스커트 도전해봐야겠어요!', date:'2026-04-12 12:00:00' },
    { id:'CM000026', pid:null, wId:'MB000009', wNm:'윤서준', txt:'직사각형 체형인데 크롭 + 하이웨이스트 조합 정말 효과 있던데요!', date:'2026-04-12 14:00:00' },
    { id:'CM000027', pid:null, wId:'MB000002', wNm:'박지현', txt:'체형별로 딱 맞는 스타일링 알려주셔서 감사해요. 자신감이 생겼어요!', date:'2026-04-13 09:00:00' },
    { id:'CM000028', pid:'CM000025', wId:'MB000006', wNm:'김서연', txt:'저도 에이라인 스커트 진짜 잘 어울려요! 한 번 도전해보세요 😊', date:'2026-04-13 11:00:00' },
    { id:'CM000029', pid:null, wId:'MB000010', wNm:'임채원', txt:'트렌드보다 나에게 맞는 핏이 중요하다는 말이 너무 공감돼요', date:'2026-04-13 15:00:00' },
  ]},
  { blogId:'BL000018', comments:[
    { id:'CM000030', pid:null, wId:'MB000003', wNm:'정다운', txt:'캐리어 하나로 2주 여행 진짜 가능한가요? ㅎㅎ 도전해봐야겠어요!', date:'2026-04-06 13:00:00' },
    { id:'CM000031', pid:null, wId:'MB000007', wNm:'오민준', txt:'여행 패킹 항상 너무 많이 싸는 편인데 이 방법 써봐야겠어요', date:'2026-04-07 10:00:00' },
    { id:'CM000032', pid:'CM000030', wId:'MB000004', wNm:'최예린', txt:'저 지난번에 10일 여행 캐리어 하나로 다녀왔어요! 진짜 됩니다 ㅎㅎ', date:'2026-04-07 12:00:00' },
  ]},
  { blogId:'BL000020', comments:[
    { id:'CM000033', pid:null, wId:'MB000001', wNm:'이수진', txt:'블로그 오픈 축하드려요! 앞으로 좋은 글 많이 부탁드립니다 💕', date:'2026-01-15 10:00:00' },
    { id:'CM000034', pid:null, wId:'MB000002', wNm:'박지현', txt:'기대됩니다! 구독 완료 ✓', date:'2026-01-15 11:00:00' },
    { id:'CM000035', pid:null, wId:'MB000005', wNm:'강하늘', txt:'드디어 ShopJoy 블로그가 생겼군요! 패션 트렌드 글 많이 올려주세요~', date:'2026-01-15 14:00:00' },
  ]},
];

const idMap = {};  // 원본 id → 실제 시퀀스 ID 매핑
for (const g of REPLIES_DATA) {
  for (const c of g.comments) { idMap[c.id] = c.id; }
}

for (const g of REPLIES_DATA) {
  for (const c of g.comments) {
    ins('cm_blog_reply', COL_RPL,
      [c.id, SITE, g.blogId, c.pid, c.wId, c.wNm,
       c.txt, 'ACTIVE', null, REG_BY, c.date]
    );
  }
}

// ════════════════════════════════════════════════════════════
// 6. cm_blog_good — 좋아요
// ════════════════════════════════════════════════════════════
sec('6. cm_blog_good — 좋아요');

let bgSeq = 1;
const COL_GOOD = ['like_id','blog_id','user_id','reg_by','reg_date'];

const GOODS = [
  // BL000001 — 많은 좋아요
  ['BL000001','MB000001'], ['BL000001','MB000002'], ['BL000001','MB000003'],
  ['BL000001','MB000004'], ['BL000001','MB000005'], ['BL000001','MB000006'],
  ['BL000001','MB000007'], ['BL000001','MB000008'],
  // BL000006 — 트렌드 컬러 인기
  ['BL000006','MB000001'], ['BL000006','MB000002'], ['BL000006','MB000003'],
  ['BL000006','MB000004'], ['BL000006','MB000009'], ['BL000006','MB000010'],
  // BL000013 — 체형별 스타일링 인기
  ['BL000013','MB000001'], ['BL000013','MB000002'], ['BL000013','MB000005'],
  ['BL000013','MB000006'], ['BL000013','MB000007'], ['BL000013','MB000008'],
  ['BL000013','MB000009'], ['BL000013','MB000010'],
  // BL000009 — 미니멀 옷장
  ['BL000009','MB000003'], ['BL000009','MB000004'], ['BL000009','MB000005'],
  ['BL000009','MB000006'], ['BL000009','MB000007'],
  // BL000020 — 공지
  ['BL000020','MB000001'], ['BL000020','MB000002'], ['BL000020','MB000003'],
  ['BL000020','MB000004'], ['BL000020','MB000005'],
  // 나머지 글들
  ['BL000002','MB000001'], ['BL000002','MB000003'], ['BL000002','MB000008'],
  ['BL000003','MB000002'], ['BL000003','MB000004'], ['BL000003','MB000005'],
  ['BL000004','MB000006'], ['BL000004','MB000007'],
  ['BL000005','MB000001'], ['BL000005','MB000002'], ['BL000005','MB000009'],
  ['BL000007','MB000003'], ['BL000007','MB000010'],
  ['BL000008','MB000004'], ['BL000008','MB000005'], ['BL000008','MB000006'],
  ['BL000010','MB000007'], ['BL000010','MB000008'],
  ['BL000011','MB000001'], ['BL000011','MB000009'],
  ['BL000012','MB000002'], ['BL000012','MB000010'],
  ['BL000014','MB000003'], ['BL000014','MB000004'], ['BL000014','MB000005'],
  ['BL000015','MB000006'], ['BL000015','MB000007'],
  ['BL000016','MB000001'], ['BL000016','MB000008'],
  ['BL000017','MB000002'], ['BL000017','MB000009'],
  ['BL000018','MB000003'], ['BL000018','MB000004'], ['BL000018','MB000010'],
  ['BL000019','MB000005'], ['BL000019','MB000006'],
];

for (const [blogId, userId] of GOODS) {
  ins('cm_blog_good', COL_GOOD,
    [`BG${String(bgSeq++).padStart(6,'0')}`, blogId, userId, REG_BY, '2026-04-15 12:00:00']
  );
}

// ════════════════════════════════════════════════════════════
// 출력
// ════════════════════════════════════════════════════════════
const header = [
  '-- ================================================================',
  '-- cm_blog / cm_blog_cate / cm_blog_file / cm_blog_good',
  '-- cm_blog_reply / cm_blog_tag 블로그 샘플 데이터',
  '-- 생성: generate_sample_sql_bltn.js',
  '-- 이미지 URL 기준: http://localhost:8008/cdn/prod/img/blog/',
  '-- ================================================================',
  'SET search_path TO shopjoy_2604;',
  '',
];

const output = header.join('\n') + sqlLines.join('\n') + '\n';
const outFile = path.resolve(__dirname, 'sample_data_bltn.sql');
fs.writeFileSync(outFile, output, 'utf8');

const totalInserts = sqlLines.filter(l => l.startsWith('INSERT')).length;
console.log(`완료: ${totalInserts}개 INSERT → ${outFile}`);
console.log(`  카테고리: ${CATES.length}건`);
console.log(`  게시글:   ${POSTS.length}건`);
console.log(`  이미지:   ${POSTS.length * 2}건`);
console.log(`  태그:     ${POSTS.reduce((s,p)=>s+(p.tags||[]).length,0)}건`);
console.log(`  댓글:     ${REPLIES_DATA.reduce((s,g)=>s+g.comments.length,0)}건`);
console.log(`  좋아요:   ${GOODS.length}건`);
