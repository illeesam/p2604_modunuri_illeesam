'use strict';
/**
 * pd_* 상품 2차 확장 데이터 생성기
 *
 * 사용법:
 *   node _doc/generate_sample_sql_prod2.js
 *   → _doc/sample_data_prod2.sql 생성
 *   → api/products/list.json 업데이트 (51-100번 상품 추가)
 *
 * 전제:
 *   - generate_sample_sql_front.js + generate_sample_sql_prod.js 실행 완료
 *
 * 생성 순서:
 *   1. UPDATE pd_prod thumbnail_url 보정 (1-50번 기존 상품 CDN 경로로 fix)
 *   2. INSERT pd_prod (51-100번 신규 상품)
 *   3. INSERT pd_prod_opt / pd_prod_opt_item / pd_prod_sku (51-100)
 *   4. DELETE pd_prod_img + INSERT pd_prod_img (전체 100개 CDN 경로로 재생성)
 *   5. INSERT pd_prod_content (51-100)
 *   6. UPDATE pd_prod 보강 (51-100, is_new/is_best/view_count 등)
 *   7. INSERT pd_tag + pd_prod_tag (51-100)
 *   8. INSERT pd_category_prod (51-100)
 *   9. INSERT pd_review + pd_review_comment (51-100)
 */

const fs   = require('fs');
const path = require('path');

global.Vue    = { reactive: (x) => x };
global.window = {};
require(path.resolve(__dirname, '../pages/admin/AdminData.js'));
const D = global.window.adminData;

const SCHEMA   = 'shopjoy_2604';
const REG_BY   = 'SYSTEM';
const REG_DATE = '2026-04-20 00:00:00';
const SITE_ID  = 'SITE000001';

const mkId = (prefix, n) => `${prefix}${String(n).padStart(6, '0')}`;

const esc = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number')  return String(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  return `'${String(v).replace(/'/g, "''")}'`;
};
const dv = (s) => s || null;

const lines = [];
const section = (title) => {
  lines.push('');
  lines.push('-- ================================================================');
  lines.push(`-- ${title}`);
  lines.push('-- ================================================================');
};
const insert = (table, cols, vals) =>
  lines.push(`INSERT INTO ${SCHEMA}.${table} (${cols.join(', ')}) VALUES (${vals.map(esc).join(', ')}) ON CONFLICT DO NOTHING;`);

// ── CDN 이미지 URL 헬퍼 ──────────────────────────────────────────
const mainImg = (pid) => pid <= 12
  ? `/cdn/prod/img/shop/product/fashion/fashion-${pid}.webp`
  : `/cdn/prod/img/shop/product/product_${((pid - 13) % 23) + 1}.png`;

const thumbImg = (pid) => pid <= 12
  ? `/cdn/prod/img/shop/product/fashion/fashion-${pid}.webp`
  : `/cdn/prod/img/shop/product/sm/pro-sm-${((pid - 13) % 20) + 1}.jpg`;

const detailImg = (n) => `/cdn/prod/img/shop/product/details/details-big-${n}.jpg`;
const bigImg    = (n) => `/cdn/prod/img/shop/product/product-big-${n}.jpg`;

// ── AdminData 기존 ID 맵 ──────────────────────────────────────────
const siteIdMap = {};
D.sites.forEach((s, i) => { siteIdMap[s.siteId] = mkId('SITE', i + 1); });
const siteId1 = siteIdMap[1];

const brandNmMap = {};
D.brands.forEach((b, i) => { brandNmMap[b.brandNm] = mkId('BR', i + 1); });

const catNmMap = {};
D.categories.forEach((c, i) => { catNmMap[c.categoryNm] = mkId('CT', i + 1); });

const memberIds = Array.from({ length: D.members.length }, (_, i) => mkId('MB', i + 1));

// ── 기존 상품 50개 로드 ───────────────────────────────────────────
const origProducts = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../api/products/list.json'), 'utf8')
);

// ── 기존 50개의 시퀀스 재현 (ID 연속성 유지) ─────────────────────
let optSeq = 1, optItemSeq = 1, skuSeq = 1;
const origOptItemMap = {};  // productId → { colorItems, sizeItems }

origProducts.forEach((p) => {
  const colorOptId = mkId('OG', optSeq++); // eslint-disable-line
  const sizeOptId  = mkId('OG', optSeq++); // eslint-disable-line
  const colorItems = [], sizeItems = [];
  (p.colors || []).forEach((c) => {
    colorItems.push({ id: mkId('OI', optItemSeq++), name: c.name, hex: c.hex });
  });
  (p.sizes || []).forEach((s) => {
    sizeItems.push({ id: mkId('OI', optItemSeq++), name: s });
  });
  origOptItemMap[p.productId] = { colorItems, sizeItems };

  // sku 시퀀스 소진
  colorItems.forEach(() => {
    sizeItems.forEach(() => { skuSeq++; });
  });
  if (colorItems.length > 0 && sizeItems.length === 0) {
    colorItems.forEach(() => { skuSeq++; });
  }
});

// review/content 시퀀스 재현
let reviewSeq = 1;
origProducts.forEach((p) => {
  const count = 3 + (p.productId % 3);
  for (let r = 0; r < count; r++) { reviewSeq++; }
});
let rcSeq = 1;
let fakeIdxCount = 0;
origProducts.forEach((p) => {
  const count = 3 + (p.productId % 3);
  for (let r = 0; r < count; r++) {
    if (fakeIdxCount % 3 === 0) rcSeq++;
    fakeIdxCount++;
  }
});

let contentSeq   = origProducts.length * 4 + 1;  // 200건 이후
let tagSeq       = 1;
let prodTagSeq   = 1;
let catProdSeq   = origProducts.length + 1;

// 기존 태그 누적
const allTagsSet = new Map();
origProducts.forEach((p) => {
  (p.tags || []).forEach(t => {
    if (!allTagsSet.has(t)) { allTagsSet.set(t, mkId('TG', tagSeq++)); }
  });
});
prodTagSeq = origProducts.reduce((acc, p) => acc + (p.tags || []).length, 0) + 1;

// ── 51-100 신규 상품 정의 ─────────────────────────────────────────
const newProducts = [
  // ── tops 51-62
  {"productId":51,"prodNm":"스트라이프 오버핏 티셔츠","categoryId":"tops","price":32000,"originalPrice":42000,"desc":"트렌디한 스트라이프 패턴의 오버핏 티. 여유로운 핏으로 편안하게 입을 수 있는 베이직 아이템.","emoji":"👕","badge":"NEW","colors":[{"name":"블루스트라이프","hex":"#a0b8d8"},{"name":"그린스트라이프","hex":"#a0c8a0"},{"name":"블랙스트라이프","hex":"#2a2a2a"}],"sizes":["S","M","L","XL"],"tags":["스트라이프","오버핏","베이직"]},
  {"productId":52,"prodNm":"컬러블록 니트 탑","categoryId":"tops","price":38000,"desc":"세련된 컬러블록 디자인의 크롭 니트 탑. 하이웨이스트 하의와 매칭하면 완벽한 룩을 완성합니다.","emoji":"🧶","badge":"","colors":[{"name":"크림블랙","hex":"#f0efe8"},{"name":"핑크네이비","hex":"#e8a0b4"},{"name":"화이트레드","hex":"#f5f0eb"}],"sizes":["XS","S","M","L"],"tags":["컬러블록","니트","크롭"]},
  {"productId":53,"prodNm":"린넨 루즈핏 셔츠","categoryId":"tops","price":48000,"originalPrice":60000,"desc":"고급 린넨 소재의 루즈핏 셔츠. 통기성이 뛰어나 여름철 시원하게 입을 수 있습니다.","emoji":"👔","badge":"인기","colors":[{"name":"화이트","hex":"#f5f0eb"},{"name":"베이지","hex":"#d4b896"},{"name":"블루","hex":"#5a8abf"},{"name":"그린","hex":"#5a8a5a"}],"sizes":["S","M","L","XL","XXL"],"tags":["린넨","루즈핏","여름"]},
  {"productId":54,"prodNm":"스퀘어넥 리브 탑","categoryId":"tops","price":22000,"desc":"여성스러운 스퀘어넥 디자인의 리브 탑. 다양한 아우터와 레이어드하기 좋은 베이직 아이템.","emoji":"👕","badge":"","colors":[{"name":"블랙","hex":"#1a1a1a"},{"name":"화이트","hex":"#f5f0eb"},{"name":"아이보리","hex":"#f5f0e0"},{"name":"핑크","hex":"#e8a0b4"},{"name":"라벤더","hex":"#c8b0d8"}],"sizes":["XS","S","M","L"],"tags":["스퀘어넥","리브","베이직"]},
  {"productId":55,"prodNm":"집업 후드 티셔츠","categoryId":"tops","price":55000,"originalPrice":70000,"desc":"가볍고 편안한 집업 후드 티셔츠. 스포티한 감성과 캐주얼함을 동시에 연출할 수 있습니다.","emoji":"🧥","badge":"","colors":[{"name":"그레이","hex":"#8a8a8a"},{"name":"블랙","hex":"#1a1a1a"},{"name":"네이비","hex":"#1e3a5f"}],"sizes":["S","M","L","XL","XXL"],"tags":["집업","후드","스포티"]},
  {"productId":56,"prodNm":"프린트 그래픽 티셔츠","categoryId":"tops","price":28000,"desc":"트렌디한 그래픽 프린트의 반팔 티셔츠. 독특한 디자인으로 개성 있는 스타일을 연출하세요.","emoji":"👕","badge":"NEW","colors":[{"name":"화이트","hex":"#f5f0eb"},{"name":"블랙","hex":"#1a1a1a"},{"name":"그레이","hex":"#8a8a8a"}],"sizes":["S","M","L","XL"],"tags":["그래픽","프린트","캐주얼"]},
  {"productId":57,"prodNm":"오프숄더 니트 탑","categoryId":"tops","price":42000,"originalPrice":55000,"desc":"어깨를 살짝 드러낸 오프숄더 니트 탑. 여성스러운 실루엣으로 특별한 날에 어울립니다.","emoji":"🧶","badge":"","colors":[{"name":"아이보리","hex":"#f5f0e0"},{"name":"베이지","hex":"#d4b896"},{"name":"와인","hex":"#722f37"}],"sizes":["XS","S","M","L"],"tags":["오프숄더","니트","여성스러움"]},
  {"productId":58,"prodNm":"터틀넥 슬림 스웨터","categoryId":"tops","price":52000,"desc":"목을 따뜻하게 감싸주는 터틀넥 스웨터. 슬림한 핏으로 날씬한 실루엣을 완성합니다.","emoji":"🧶","badge":"인기","colors":[{"name":"블랙","hex":"#1a1a1a"},{"name":"아이보리","hex":"#f5f0e0"},{"name":"그레이","hex":"#8a8a8a"},{"name":"카멜","hex":"#c19a6b"}],"sizes":["XS","S","M","L","XL"],"tags":["터틀넥","슬림핏","겨울"]},
  {"productId":59,"prodNm":"레이스 트림 블라우스","categoryId":"tops","price":45000,"originalPrice":58000,"desc":"섬세한 레이스 트림 디테일의 여성스러운 블라우스. 오피스룩과 데이트룩으로 모두 완벽합니다.","emoji":"👔","badge":"","colors":[{"name":"화이트","hex":"#f5f0eb"},{"name":"크림","hex":"#f5f0e8"},{"name":"라이트블루","hex":"#b0c8e0"}],"sizes":["S","M","L","XL"],"tags":["레이스","블라우스","여성스러움"]},
  {"productId":60,"prodNm":"보더 스트라이프 티","categoryId":"tops","price":24000,"desc":"클래식한 보더 스트라이프 패턴의 반팔 티셔츠. 심플하면서도 스타일리시한 데일리 아이템.","emoji":"👕","badge":"","colors":[{"name":"화이트네이비","hex":"#e8eef5"},{"name":"화이트레드","hex":"#f0e0e0"},{"name":"화이트블랙","hex":"#f0f0f0"}],"sizes":["XS","S","M","L","XL"],"tags":["보더","스트라이프","데일리"]},
  {"productId":61,"prodNm":"크롭 데님 재킷 셔츠","categoryId":"tops","price":68000,"originalPrice":85000,"desc":"데님 소재로 제작된 크롭 길이의 재킷형 셔츠. 다양한 하의와 매칭하기 좋은 트렌디 아이템.","emoji":"👔","badge":"NEW","colors":[{"name":"라이트데님","hex":"#7bafd4"},{"name":"미드데님","hex":"#3f6fa8"},{"name":"블랙","hex":"#1a1a1a"}],"sizes":["S","M","L","XL"],"tags":["데님","크롭","재킷"]},
  {"productId":62,"prodNm":"슬리브리스 니트 베스트","categoryId":"tops","price":35000,"desc":"트렌디한 슬리브리스 니트 베스트. 셔츠나 블라우스 위에 레이어드해서 스타일리시하게 활용하세요.","emoji":"🧶","badge":"인기","colors":[{"name":"아이보리","hex":"#f5f0e0"},{"name":"카키","hex":"#6b7c4a"},{"name":"블랙","hex":"#1a1a1a"},{"name":"그레이","hex":"#8a8a8a"}],"sizes":["S","M","L","XL"],"tags":["슬리브리스","베스트","레이어드"]},

  // ── bottoms 63-72
  {"productId":63,"prodNm":"와이드 데님 진","categoryId":"bottoms","price":65000,"originalPrice":82000,"desc":"트렌디한 와이드 핏 데님 진. 넉넉하고 편안한 착용감으로 일상에서 활용도가 높습니다.","emoji":"👖","badge":"인기","colors":[{"name":"라이트블루","hex":"#7bafd4"},{"name":"미드블루","hex":"#3f6fa8"},{"name":"블랙","hex":"#1a1a1a"}],"sizes":["XS","S","M","L","XL"],"tags":["와이드","데님","편안함"]},
  {"productId":64,"prodNm":"테이퍼드 슬랙스","categoryId":"bottoms","price":55000,"desc":"스마트한 테이퍼드 핏의 오피스 슬랙스. 세련된 실루엣으로 다양한 상의와 잘 어울립니다.","emoji":"👖","badge":"","colors":[{"name":"블랙","hex":"#1a1a1a"},{"name":"차콜","hex":"#3a3a3a"},{"name":"네이비","hex":"#1e3a5f"},{"name":"베이지","hex":"#d4b896"}],"sizes":["S","M","L","XL","XXL"],"tags":["테이퍼드","슬랙스","오피스"]},
  {"productId":65,"prodNm":"미디 A라인 스커트","categoryId":"bottoms","price":42000,"originalPrice":54000,"desc":"우아한 A라인 실루엣의 미디 스커트. 다양한 체형에 잘 어울리며 여성스러운 룩을 완성합니다.","emoji":"👗","badge":"NEW","colors":[{"name":"블랙","hex":"#1a1a1a"},{"name":"베이지","hex":"#d4b896"},{"name":"카키","hex":"#6b7c4a"},{"name":"핑크","hex":"#e8a0b4"}],"sizes":["XS","S","M","L"],"tags":["A라인","미디","스커트"]},
  {"productId":66,"prodNm":"핀턱 와이드 팬츠","categoryId":"bottoms","price":58000,"desc":"고급스러운 핀턱 디테일의 와이드 팬츠. 드레시하면서도 편안한 착용감이 특징입니다.","emoji":"👖","badge":"","colors":[{"name":"아이보리","hex":"#f5f0e0"},{"name":"블랙","hex":"#1a1a1a"},{"name":"베이지","hex":"#d4b896"}],"sizes":["S","M","L","XL"],"tags":["핀턱","와이드","드레시"]},
  {"productId":67,"prodNm":"레이스 롱 스커트","categoryId":"bottoms","price":52000,"originalPrice":65000,"desc":"섬세한 레이스 소재의 로맨틱 롱 스커트. 여성스러운 실루엣으로 특별한 날 더 빛납니다.","emoji":"👗","badge":"","colors":[{"name":"화이트","hex":"#f5f0eb"},{"name":"블랙","hex":"#1a1a1a"},{"name":"아이보리","hex":"#f5f0e0"}],"sizes":["XS","S","M","L"],"tags":["레이스","롱스커트","로맨틱"]},
  {"productId":68,"prodNm":"데님 미니 스커트","categoryId":"bottoms","price":35000,"desc":"클래식한 데님 소재의 미니 스커트. 캐주얼하면서도 세련된 데일리 룩을 완성해드립니다.","emoji":"👗","badge":"인기","colors":[{"name":"라이트블루","hex":"#7bafd4"},{"name":"미드블루","hex":"#3f6fa8"},{"name":"블랙","hex":"#1a1a1a"}],"sizes":["XS","S","M","L"],"tags":["데님","미니","캐주얼"]},
  {"productId":69,"prodNm":"코르셋 웨이스트 팬츠","categoryId":"bottoms","price":62000,"originalPrice":78000,"desc":"허리를 강조하는 코르셋 디테일의 팬츠. 페미닌한 실루엣으로 특별한 룩을 연출합니다.","emoji":"👖","badge":"NEW","colors":[{"name":"블랙","hex":"#1a1a1a"},{"name":"화이트","hex":"#f5f0eb"},{"name":"와인","hex":"#722f37"}],"sizes":["XS","S","M","L","XL"],"tags":["코르셋","웨이스트","페미닌"]},
  {"productId":70,"prodNm":"플로럴 롱 스커트","categoryId":"bottoms","price":48000,"desc":"화사한 플로럴 패턴의 로맨틱 롱 스커트. 봄여름 나들이에 완벽한 여성스러운 아이템.","emoji":"👗","badge":"","colors":[{"name":"핑크플로럴","hex":"#e8a0b4"},{"name":"블루플로럴","hex":"#a0b8e8"},{"name":"화이트플로럴","hex":"#f5f5f0"}],"sizes":["XS","S","M","L"],"tags":["플로럴","롱스커트","봄"]},
  {"productId":71,"prodNm":"버뮤다 쇼츠","categoryId":"bottoms","price":38000,"originalPrice":48000,"desc":"무릎 위 기장의 버뮤다 쇼츠. 캐주얼하면서도 시크한 여름 하의 필수 아이템입니다.","emoji":"🩳","badge":"","colors":[{"name":"카키","hex":"#6b7c4a"},{"name":"베이지","hex":"#d4b896"},{"name":"블랙","hex":"#1a1a1a"},{"name":"네이비","hex":"#1e3a5f"}],"sizes":["S","M","L","XL"],"tags":["버뮤다","쇼츠","여름"]},
  {"productId":72,"prodNm":"실크 와이드 팬츠","categoryId":"bottoms","price":78000,"desc":"고급스러운 실크 감촉의 와이드 팬츠. 드레시하면서도 편안한 착용감으로 특별한 자리에 어울립니다.","emoji":"👖","badge":"인기","colors":[{"name":"블랙","hex":"#1a1a1a"},{"name":"아이보리","hex":"#f5f0e0"},{"name":"샴페인","hex":"#f0e8d0"}],"sizes":["S","M","L","XL"],"tags":["실크","와이드","드레시"]},

  // ── outer 73-80
  {"productId":73,"prodNm":"싱글 버튼 롱코트","categoryId":"outer","price":149000,"originalPrice":189000,"desc":"클래식한 싱글 버튼 디자인의 미들 롱코트. 세련된 실루엣으로 가을겨울 코디를 완성합니다.","emoji":"🧥","badge":"NEW","colors":[{"name":"카멜","hex":"#c19a6b"},{"name":"블랙","hex":"#1a1a1a"},{"name":"그레이","hex":"#8a8a8a"}],"sizes":["S","M","L","XL"],"tags":["롱코트","싱글버튼","클래식"]},
  {"productId":74,"prodNm":"오버사이즈 트렌치코트","categoryId":"outer","price":135000,"desc":"여유로운 오버사이즈 핏의 클래식 트렌치코트. 어떤 코디에도 완성도를 높여주는 시즌리스 아우터.","emoji":"🧥","badge":"인기","colors":[{"name":"베이지","hex":"#d4b896"},{"name":"블랙","hex":"#1a1a1a"},{"name":"카키","hex":"#6b7c4a"}],"sizes":["S","M","L","XL","XXL"],"tags":["트렌치코트","오버사이즈","시즌리스"]},
  {"productId":75,"prodNm":"숏 울 코트","categoryId":"outer","price":125000,"originalPrice":158000,"desc":"고급 울 소재의 숏 기장 코트. 깔끔한 디자인으로 캐주얼부터 오피스룩까지 활용 가능합니다.","emoji":"🧥","badge":"","colors":[{"name":"블랙","hex":"#1a1a1a"},{"name":"그레이","hex":"#8a8a8a"},{"name":"카멜","hex":"#c19a6b"},{"name":"와인","hex":"#722f37"}],"sizes":["S","M","L","XL"],"tags":["울코트","숏","겨울"]},
  {"productId":76,"prodNm":"스타디움 점퍼","categoryId":"outer","price":92000,"desc":"클래식한 스타디움 점퍼. 스포티한 감성과 캐주얼한 스타일을 동시에 연출하는 트렌디 아우터.","emoji":"🧥","badge":"NEW","colors":[{"name":"블랙화이트","hex":"#1a1a1a"},{"name":"네이비화이트","hex":"#1e3a5f"},{"name":"버건디화이트","hex":"#7a1a2a"}],"sizes":["S","M","L","XL","XXL"],"tags":["스타디움","점퍼","스포티"]},
  {"productId":77,"prodNm":"벨트 미들 코트","categoryId":"outer","price":168000,"originalPrice":210000,"desc":"우아한 벨트 디테일의 미들 기장 코트. 허리를 강조하는 실루엣으로 날씬하고 세련된 룩을 완성합니다.","emoji":"🧥","badge":"인기","colors":[{"name":"카멜","hex":"#c19a6b"},{"name":"블랙","hex":"#1a1a1a"},{"name":"아이보리","hex":"#f5f0e0"}],"sizes":["S","M","L","XL"],"tags":["벨트코트","미들","우아함"]},
  {"productId":78,"prodNm":"청 오버핏 재킷","categoryId":"outer","price":75000,"originalPrice":95000,"desc":"트렌디한 오버핏 청 재킷. 다양한 코디에 포인트가 되는 데일리 아우터 필수 아이템.","emoji":"🧥","badge":"","colors":[{"name":"라이트블루","hex":"#7bafd4"},{"name":"미드블루","hex":"#3f6fa8"},{"name":"블랙","hex":"#1a1a1a"}],"sizes":["S","M","L","XL","XXL"],"tags":["청재킷","오버핏","데일리"]},
  {"productId":79,"prodNm":"패딩 더플 코트","categoryId":"outer","price":185000,"desc":"따뜻하고 실용적인 패딩 더플 코트. 클래식한 토글 버튼 디자인으로 개성 있는 겨울 룩을 완성합니다.","emoji":"🧥","badge":"","colors":[{"name":"카멜","hex":"#c19a6b"},{"name":"네이비","hex":"#1e3a5f"},{"name":"블랙","hex":"#1a1a1a"}],"sizes":["S","M","L","XL"],"tags":["더플코트","패딩","겨울"]},
  {"productId":80,"prodNm":"숏 가죽 재킷","categoryId":"outer","price":158000,"originalPrice":198000,"desc":"세련된 숏 기장의 인조 가죽 재킷. 강렬한 인상을 주는 트렌디한 아우터로 다양한 코디에 활용하세요.","emoji":"🧥","badge":"NEW","colors":[{"name":"블랙","hex":"#1a1a1a"},{"name":"브라운","hex":"#8b5a2b"}],"sizes":["S","M","L","XL"],"tags":["가죽재킷","숏","트렌디"]},

  // ── dress 81-88
  {"productId":81,"prodNm":"스모크 맥시 드레스","categoryId":"dress","price":89000,"originalPrice":115000,"desc":"낭만적인 스모크 디테일의 맥시 기장 드레스. 여름 리조트룩이나 야외 파티에 완벽한 아이템.","emoji":"👗","badge":"인기","colors":[{"name":"화이트","hex":"#f5f0eb"},{"name":"블루","hex":"#87b8d8"},{"name":"로즈","hex":"#d8a0a8"}],"sizes":["XS","S","M","L"],"tags":["스모크","맥시","로맨틱"]},
  {"productId":82,"prodNm":"A라인 미니 드레스","categoryId":"dress","price":62000,"desc":"사랑스러운 A라인 실루엣의 미니 드레스. 귀엽고 발랄한 룩을 완성해주는 여름 필수 아이템.","emoji":"👗","badge":"NEW","colors":[{"name":"화이트","hex":"#f5f0eb"},{"name":"핑크","hex":"#e8a0b4"},{"name":"민트","hex":"#7ed8c4"},{"name":"블루","hex":"#87ceeb"}],"sizes":["XS","S","M","L"],"tags":["A라인","미니드레스","발랄함"]},
  {"productId":83,"prodNm":"리넨 셔츠 드레스","categoryId":"dress","price":75000,"originalPrice":92000,"desc":"시원한 리넨 소재의 셔츠 드레스. 캐주얼하면서도 세련된 여름 데이트룩으로 완벽합니다.","emoji":"👗","badge":"","colors":[{"name":"화이트","hex":"#f5f0eb"},{"name":"베이지","hex":"#d4b896"},{"name":"스트라이프","hex":"#e8eef5"}],"sizes":["S","M","L","XL"],"tags":["린넨","셔츠드레스","캐주얼"]},
  {"productId":84,"prodNm":"벨벳 이브닝 드레스","categoryId":"dress","price":135000,"desc":"고급스러운 벨벳 소재의 이브닝 드레스. 파티나 특별한 행사에 화려하고 우아한 룩을 완성합니다.","emoji":"👗","badge":"","colors":[{"name":"와인","hex":"#722f37"},{"name":"블랙","hex":"#1a1a1a"},{"name":"네이비","hex":"#1e3a5f"}],"sizes":["XS","S","M","L"],"tags":["벨벳","이브닝","파티룩"]},
  {"productId":85,"prodNm":"자카드 미디 드레스","categoryId":"dress","price":98000,"originalPrice":125000,"desc":"화려한 자카드 패턴의 미디 기장 드레스. 고급스러운 소재감으로 특별한 날 완벽한 선택입니다.","emoji":"👗","badge":"인기","colors":[{"name":"블랙","hex":"#1a1a1a"},{"name":"와인","hex":"#722f37"},{"name":"네이비","hex":"#1e3a5f"}],"sizes":["XS","S","M","L","XL"],"tags":["자카드","미디","고급스러움"]},
  {"productId":86,"prodNm":"레이어드 튤 드레스","categoryId":"dress","price":88000,"desc":"몽환적인 튤 레이어드 디자인의 드레스. 파티나 특별한 날을 더욱 빛나게 해주는 로맨틱 아이템.","emoji":"👗","badge":"NEW","colors":[{"name":"핑크","hex":"#e8a0b4"},{"name":"화이트","hex":"#f5f0eb"},{"name":"라벤더","hex":"#c8b0d8"}],"sizes":["XS","S","M","L"],"tags":["튤","레이어드","로맨틱"]},
  {"productId":87,"prodNm":"집업 니트 드레스","categoryId":"dress","price":69000,"originalPrice":88000,"desc":"실용적인 집업 디테일의 니트 드레스. 편안하면서도 스타일리시한 가을겨울 원피스 아이템.","emoji":"👗","badge":"","colors":[{"name":"블랙","hex":"#1a1a1a"},{"name":"그레이","hex":"#8a8a8a"},{"name":"카멜","hex":"#c19a6b"}],"sizes":["S","M","L","XL"],"tags":["집업","니트드레스","가을겨울"]},
  {"productId":88,"prodNm":"도트 프릴 드레스","categoryId":"dress","price":72000,"desc":"러블리한 도트 패턴과 프릴 디테일의 미니 드레스. 귀엽고 사랑스러운 룩을 완성해드립니다.","emoji":"👗","badge":"인기","colors":[{"name":"블랙도트","hex":"#2a2a2a"},{"name":"핑크도트","hex":"#e8a0b4"},{"name":"네이비도트","hex":"#1e3a5f"}],"sizes":["XS","S","M","L"],"tags":["도트","프릴","러블리"]},

  // ── bags 89-93
  {"productId":89,"prodNm":"레더 숄더백","categoryId":"acc","price":89000,"originalPrice":112000,"desc":"클래식한 디자인의 인조 레더 숄더백. 넉넉한 수납공간과 실용적인 구조로 데일리 백으로 최적입니다.","emoji":"👜","badge":"인기","colors":[{"name":"블랙","hex":"#1a1a1a"},{"name":"브라운","hex":"#8b5a2b"},{"name":"베이지","hex":"#d4b896"}],"sizes":["FREE"],"tags":["레더","숄더백","데일리"]},
  {"productId":90,"prodNm":"캐주얼 백팩","categoryId":"acc","price":65000,"desc":"가볍고 실용적인 캐주얼 백팩. 넉넉한 수납 공간과 내구성 있는 소재로 일상에서 활용하기 좋습니다.","emoji":"🎒","badge":"NEW","colors":[{"name":"블랙","hex":"#1a1a1a"},{"name":"그레이","hex":"#8a8a8a"},{"name":"네이비","hex":"#1e3a5f"},{"name":"카키","hex":"#6b7c4a"}],"sizes":["FREE"],"tags":["백팩","캐주얼","실용적"]},
  {"productId":91,"prodNm":"이브닝 클러치백","categoryId":"acc","price":45000,"originalPrice":58000,"desc":"세련된 디자인의 이브닝 클러치백. 파티나 특별한 자리에 완벽하게 어울리는 액세서리 백.","emoji":"👛","badge":"","colors":[{"name":"골드","hex":"#c9a227"},{"name":"실버","hex":"#c0c0c0"},{"name":"블랙","hex":"#1a1a1a"}],"sizes":["FREE"],"tags":["클러치","이브닝","파티"]},
  {"productId":92,"prodNm":"버킷백","categoryId":"acc","price":72000,"desc":"트렌디한 버킷 형태의 패션백. 넉넉한 수납과 스타일리시한 디자인으로 코디 포인트를 더합니다.","emoji":"👜","badge":"인기","colors":[{"name":"블랙","hex":"#1a1a1a"},{"name":"브라운","hex":"#8b5a2b"},{"name":"카키","hex":"#6b7c4a"},{"name":"베이지","hex":"#d4b896"}],"sizes":["FREE"],"tags":["버킷백","트렌디","패션"]},
  {"productId":93,"prodNm":"체인 미니백","categoryId":"acc","price":55000,"originalPrice":69000,"desc":"체인 스트랩이 포인트인 미니 크로스백. 컴팩트한 사이즈로 가볍게 들기 좋으며 코디 완성도를 높입니다.","emoji":"👛","badge":"NEW","colors":[{"name":"블랙","hex":"#1a1a1a"},{"name":"화이트","hex":"#f5f0eb"},{"name":"골드","hex":"#c9a227"}],"sizes":["FREE"],"tags":["체인백","미니백","크로스"]},

  // ── acc 94-100
  {"productId":94,"prodNm":"링 이어링 세트","categoryId":"acc","price":18000,"desc":"다양한 크기의 링 이어링 3쌍 세트. 레이어드해서 착용하기 좋은 트렌디한 귀걸이 세트.","emoji":"💍","badge":"NEW","colors":[{"name":"골드","hex":"#c9a227"},{"name":"실버","hex":"#c0c0c0"},{"name":"로즈골드","hex":"#e8b4b8"}],"sizes":["FREE"],"tags":["이어링","링","레이어드"]},
  {"productId":95,"prodNm":"스카프","categoryId":"acc","price":32000,"originalPrice":42000,"desc":"부드러운 소재의 다용도 스카프. 목에 두르거나 헤어밴드로 활용하는 등 다양하게 코디할 수 있습니다.","emoji":"🧣","badge":"","colors":[{"name":"플로럴핑크","hex":"#e8a0b4"},{"name":"체크베이지","hex":"#d4b896"},{"name":"스트라이프블루","hex":"#7bafd4"}],"sizes":["FREE"],"tags":["스카프","다용도","코디"]},
  {"productId":96,"prodNm":"페도라 햇","categoryId":"acc","price":38000,"desc":"클래식한 페도라 햇. 다양한 패션 스타일에 포인트를 더해주는 트렌디한 모자 아이템.","emoji":"🎩","badge":"인기","colors":[{"name":"베이지","hex":"#d4b896"},{"name":"블랙","hex":"#1a1a1a"},{"name":"브라운","hex":"#8b5a2b"}],"sizes":["FREE"],"tags":["페도라","햇","포인트"]},
  {"productId":97,"prodNm":"체인 목걸이","categoryId":"acc","price":22000,"originalPrice":29000,"desc":"심플하면서도 세련된 체인 목걸이. 어떤 의상과도 잘 어울리는 기본 주얼리 아이템.","emoji":"📿","badge":"","colors":[{"name":"골드","hex":"#c9a227"},{"name":"실버","hex":"#c0c0c0"}],"sizes":["FREE"],"tags":["목걸이","체인","주얼리"]},
  {"productId":98,"prodNm":"레더 카드 홀더","categoryId":"acc","price":25000,"desc":"슬림하고 실용적인 인조 레더 카드 홀더. 카드 4~6장을 수납할 수 있어 미니멀한 생활에 완벽합니다.","emoji":"🧳","badge":"NEW","colors":[{"name":"블랙","hex":"#1a1a1a"},{"name":"브라운","hex":"#8b5a2b"},{"name":"네이비","hex":"#1e3a5f"}],"sizes":["FREE"],"tags":["카드홀더","레더","미니멀"]},
  {"productId":99,"prodNm":"헤어밴드 세트","categoryId":"acc","price":15000,"originalPrice":20000,"desc":"다양한 디자인의 헤어밴드 3개 세트. 매일 다른 스타일로 헤어를 꾸밀 수 있는 실용적인 아이템.","emoji":"🎀","badge":"","colors":[{"name":"블랙세트","hex":"#1a1a1a"},{"name":"파스텔세트","hex":"#e8d8f0"},{"name":"베이지세트","hex":"#d4b896"}],"sizes":["FREE"],"tags":["헤어밴드","세트","헤어액세서리"]},
  {"productId":100,"prodNm":"니트 핸드폰 케이스","categoryId":"acc","price":19000,"desc":"트렌디한 니트 텍스처의 핸드폰 케이스. 다양한 기종에 맞는 사이즈로 개성 있는 스타일을 연출하세요.","emoji":"📱","badge":"인기","colors":[{"name":"아이보리","hex":"#f5f0e0"},{"name":"블랙","hex":"#1a1a1a"},{"name":"핑크","hex":"#e8a0b4"},{"name":"민트","hex":"#7ed8c4"}],"sizes":["FREE"],"tags":["핸드폰케이스","니트","트렌디"]},
];

// ── api/products/list.json 업데이트 ─────────────────────────────
const allProducts = [...origProducts, ...newProducts];
fs.writeFileSync(
  path.resolve(__dirname, '../api/products/list.json'),
  JSON.stringify(allProducts, null, 2),
  'utf8'
);
console.log(`api/products/list.json 업데이트: ${allProducts.length}개 상품`);

// ── SQL 생성 ────────────────────────────────────────────────────
lines.push('SET search_path TO shopjoy_2604;');

// ────────────────────────────────────────────────────
// 1. pd_prod UPDATE — 기존 50개 thumbnail_url CDN 경로로 보정
// ────────────────────────────────────────────────────
section('1. UPDATE pd_prod thumbnail_url — 기존 50개 CDN 경로 보정');
origProducts.forEach((p) => {
  const prodId = mkId('PD', p.productId);
  lines.push(
    `UPDATE ${SCHEMA}.pd_prod SET thumbnail_url=${esc(thumbImg(p.productId))} ` +
    `WHERE prod_id=${esc(prodId)};`
  );
});

// ────────────────────────────────────────────────────
// 2. pd_prod INSERT — 신규 51-100
// ────────────────────────────────────────────────────
section('2. INSERT pd_prod — 신규 상품 51-100 (50건)');
const apiCatMap = { 'tops': '상의', 'bottoms': '하의', 'dress': '원피스', 'outer': '아우터' };

newProducts.forEach((p) => {
  const prodId  = mkId('PD', p.productId);
  const catNm   = apiCatMap[p.categoryId] || null;
  const catId   = catNm ? (catNmMap[catNm] || null) : null;
  const brandId = brandNmMap['ShopJoy'] || null;
  insert('pd_prod',
    ['prod_id','site_id','category_id','brand_id','prod_nm','sale_price','list_price',
     'thumbnail_url','prod_stock','prod_status_cd','reg_by','reg_date'],
    [prodId, SITE_ID, catId, brandId,
     p.prodNm, p.price || 0, p.originalPrice || p.price || 0,
     thumbImg(p.productId), p.stock || 100, 'ACTIVE', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────
// 3. pd_prod UPDATE — 신규 51-100 보강
// ────────────────────────────────────────────────────
section('3. UPDATE pd_prod — 신규 상품 보강 (51-100)');
newProducts.forEach((p) => {
  const prodId    = mkId('PD', p.productId);
  const isNew     = p.badge === 'NEW' ? 'Y' : 'N';
  const isBest    = (p.badge === '인기' || p.badge === 'BEST') ? 'Y' : 'N';
  const viewCnt   = 200 + ((p.productId * 137) % 800);
  const saleCnt   = 20  + ((p.productId * 73)  % 300);
  const weight    = (0.2 + (p.productId % 5) * 0.1).toFixed(1);
  const purchPrice = Math.round((p.price || 0) * 0.55 / 100) * 100;
  const advrt     = p.badge === 'NEW'  ? '신상품 출시! 지금 구매 시 무료배송'
                  : p.badge === '인기' ? '베스트셀러! 지금 가장 인기 있는 상품'
                  : null;
  lines.push(
    `UPDATE ${SCHEMA}.pd_prod SET ` +
    `is_new=${esc(isNew)}, is_best=${esc(isBest)}, ` +
    `view_count=${viewCnt}, sale_count=${saleCnt}, ` +
    `weight=${weight}, purchase_price=${purchPrice}, margin_rate=45.00, ` +
    `advrt_stmt=${esc(advrt)}, min_buy_qty=1, coupon_use_yn='Y', save_use_yn='Y', discnt_use_yn='Y' ` +
    `WHERE prod_id=${esc(prodId)};`
  );
});

// ────────────────────────────────────────────────────
// 4. pd_prod_opt + pd_prod_opt_item + pd_prod_sku — 51-100
// ────────────────────────────────────────────────────
section('4. pd_prod_opt — 옵션 그룹 (51-100)');
const newOptIdMap     = {};
const newOptItemMap   = {};

newProducts.forEach((p) => {
  const prodId = mkId('PD', p.productId);
  const colorOptId = mkId('OG', optSeq++);
  const sizeOptId  = mkId('OG', optSeq++);
  newOptIdMap[p.productId] = { colorOptId, sizeOptId };

  if (p.colors && p.colors.length > 0) {
    insert('pd_prod_opt',
      ['opt_id','site_id','prod_id','opt_grp_nm','opt_level','opt_type_cd','sort_ord','reg_by','reg_date'],
      [colorOptId, SITE_ID, prodId, '색상', 1, 'COLOR', 1, REG_BY, REG_DATE]
    );
  }
  if (p.sizes && p.sizes.length > 0) {
    insert('pd_prod_opt',
      ['opt_id','site_id','prod_id','opt_grp_nm','opt_level','opt_type_cd','sort_ord','reg_by','reg_date'],
      [sizeOptId, SITE_ID, prodId, '사이즈', 2, 'SIZE', 2, REG_BY, REG_DATE]
    );
  }
});

section('5. pd_prod_opt_item — 옵션 아이템 (51-100)');
newProducts.forEach((p) => {
  const { colorOptId, sizeOptId } = newOptIdMap[p.productId];
  const colorItems = [], sizeItems = [];

  (p.colors || []).forEach((c, i) => {
    const id = mkId('OI', optItemSeq++);
    colorItems.push({ id, name: c.name, hex: c.hex });
    insert('pd_prod_opt_item',
      ['opt_item_id','site_id','opt_id','opt_type_cd','opt_nm','opt_val','sort_ord','use_yn','reg_by','reg_date'],
      [id, SITE_ID, colorOptId, 'COLOR', c.name, c.hex || c.name, i + 1, 'Y', REG_BY, REG_DATE]
    );
  });
  (p.sizes || []).forEach((s, i) => {
    const id = mkId('OI', optItemSeq++);
    sizeItems.push({ id, name: s });
    insert('pd_prod_opt_item',
      ['opt_item_id','site_id','opt_id','opt_type_cd','opt_nm','opt_val','sort_ord','use_yn','reg_by','reg_date'],
      [id, SITE_ID, sizeOptId, 'SIZE', s, s, i + 1, 'Y', REG_BY, REG_DATE]
    );
  });
  newOptItemMap[p.productId] = { colorItems, sizeItems };
});

section('6. pd_prod_sku — SKU (51-100)');
newProducts.forEach((p) => {
  const prodId = mkId('PD', p.productId);
  const { colorItems, sizeItems } = newOptItemMap[p.productId];

  colorItems.forEach((c) => {
    sizeItems.forEach((s) => {
      const skuId = mkId('SK', skuSeq++);
      insert('pd_prod_sku',
        ['sku_id','site_id','prod_id','opt_item_id_1','opt_item_id_2',
         'sku_code','add_price','prod_opt_stock','use_yn','reg_by','reg_date'],
        [skuId, SITE_ID, prodId, c.id, s.id,
         `${p.productId}-${c.name.substring(0,2)}-${s.name}`,
         0, 20, 'Y', REG_BY, REG_DATE]
      );
    });
  });
  if (colorItems.length > 0 && sizeItems.length === 0) {
    colorItems.forEach((c) => {
      const skuId = mkId('SK', skuSeq++);
      insert('pd_prod_sku',
        ['sku_id','site_id','prod_id','opt_item_id_1','sku_code','add_price','prod_opt_stock','use_yn','reg_by','reg_date'],
        [skuId, SITE_ID, prodId, c.id,
         `${p.productId}-${c.name.substring(0,2)}`,
         0, 20, 'Y', REG_BY, REG_DATE]
      );
    });
  }
});

// ────────────────────────────────────────────────────
// 7. pd_prod_img — 전체 100개 재생성 (DELETE 후 INSERT)
// ────────────────────────────────────────────────────
section('7. pd_prod_img — 기존 삭제 후 전체 100개 CDN 경로로 재생성');
lines.push(`DELETE FROM ${SCHEMA}.pd_prod_img WHERE site_id = ${esc(SITE_ID)};`);

let imgSeq = 1;
const combinedOptItemMap = { ...origOptItemMap, ...newOptItemMap };
allProducts.forEach((p) => {
  const prodId = mkId('PD', p.productId);
  const { colorItems } = combinedOptItemMap[p.productId];
  const pid = p.productId;

  // 대표 이미지 (썸네일)
  insert('pd_prod_img',
    ['prod_img_id','site_id','prod_id','cdn_img_url','cdn_thumb_url',
     'img_alt_text','sort_ord','is_thumb','reg_by','reg_date'],
    [mkId('PI', imgSeq++), SITE_ID, prodId,
     mainImg(pid), thumbImg(pid),
     p.prodNm, 1, 'Y', REG_BY, REG_DATE]
  );
  // 상세 서브 이미지 2장
  [1, 2].forEach((n, vi) => {
    insert('pd_prod_img',
      ['prod_img_id','site_id','prod_id','cdn_img_url','cdn_thumb_url',
       'img_alt_text','sort_ord','is_thumb','reg_by','reg_date'],
      [mkId('PI', imgSeq++), SITE_ID, prodId,
       detailImg(n), thumbImg(pid),
       `${p.prodNm} 상세${n}`, vi + 2, 'N', REG_BY, REG_DATE]
    );
  });
  // 확대 이미지 1장
  insert('pd_prod_img',
    ['prod_img_id','site_id','prod_id','cdn_img_url','cdn_thumb_url',
     'img_alt_text','sort_ord','is_thumb','reg_by','reg_date'],
    [mkId('PI', imgSeq++), SITE_ID, prodId,
     bigImg((pid % 3) + 1), thumbImg(pid),
     `${p.prodNm} 확대`, 4, 'N', REG_BY, REG_DATE]
  );
  // 컬러별 이미지 (최대 4색)
  colorItems.slice(0, 4).forEach((c, ci) => {
    insert('pd_prod_img',
      ['prod_img_id','site_id','prod_id','opt_item_id_1','cdn_img_url','cdn_thumb_url',
       'img_alt_text','sort_ord','is_thumb','reg_by','reg_date'],
      [mkId('PI', imgSeq++), SITE_ID, prodId, c.id,
       mainImg(pid), thumbImg(pid),
       `${p.prodNm} ${c.name}`, 10 + ci, 'N', REG_BY, REG_DATE]
    );
  });
});

// ────────────────────────────────────────────────────
// 8. pd_prod_content — 51-100
// ────────────────────────────────────────────────────
section('8. pd_prod_content — 상품 컨텐츠 4종 × 50건 (51-100) = 200건');
const contentTypes = [
  { cd: 'DETAIL',     nm: '상세설명',  ord: 1 },
  { cd: 'SIZE_GUIDE', nm: '사이즈안내', ord: 2 },
  { cd: 'NOTICE',     nm: '배송안내',  ord: 3 },
  { cd: 'GUIDE',      nm: '반품정책',  ord: 4 },
];
newProducts.forEach((p) => {
  const prodId = mkId('PD', p.productId);
  const colors = (p.colors || []).map(c => c.name).join(', ');
  const sizes  = (p.sizes  || []).join(', ');

  const htmlByType = {
    DETAIL: `<div class="prod-detail"><h3>${p.prodNm}</h3><p>${p.desc || ''}</p>` +
            `<ul><li>컬러: ${colors || '-'}</li><li>사이즈: ${sizes || '-'}</li></ul></div>`,
    SIZE_GUIDE: `<div class="size-guide"><h4>사이즈 안내</h4><table border="1" style="border-collapse:collapse;width:100%;">` +
                `<tr><th>사이즈</th><th>총장</th><th>가슴둘레</th><th>어깨너비</th></tr>` +
                (p.sizes || ['FREE']).map(s => {
                  const tbl = { XS:'60/90/38', S:'62/94/40', M:'64/98/42', L:'66/102/44', XL:'68/106/46', XXL:'70/110/48', FREE:'FREE' };
                  const v = (tbl[s] || '62/94/40').split('/');
                  return `<tr><td>${s}</td><td>${v[0]}cm</td><td>${v[1]}cm</td><td>${v[2]}cm</td></tr>`;
                }).join('') +
                `</table></div>`,
    NOTICE: `<div class="dliv-info"><h4>배송 안내</h4><ul>` +
            `<li>배송사: CJ대한통운 / 한진택배</li>` +
            `<li>배송기간: 결제 확인 후 1~3 영업일 이내 출고</li>` +
            `<li>배송비: 3,000원 (50,000원 이상 구매 시 무료)</li>` +
            `</ul></div>`,
    GUIDE: `<div class="return-policy"><h4>반품·교환 안내</h4><ul>` +
           `<li>수령 후 7일 이내 반품/교환 가능</li>` +
           `<li>단순 변심 반품 시 왕복 배송비(6,000원) 고객 부담</li>` +
           `<li>불량/오배송 시 무료 반품 처리</li>` +
           `</ul></div>`,
  };

  contentTypes.forEach((ct) => {
    insert('pd_prod_content',
      ['prod_content_id','site_id','prod_id','content_type_cd','content_html','sort_ord','use_yn','reg_by','reg_date'],
      [mkId('PC', contentSeq++), SITE_ID, prodId, ct.cd, htmlByType[ct.cd], ct.ord, 'Y', REG_BY, REG_DATE]
    );
  });
});

// ────────────────────────────────────────────────────
// 9. pd_tag + pd_prod_tag — 51-100 신규 태그만
// ────────────────────────────────────────────────────
section('9. pd_tag + pd_prod_tag — 신규 태그 (51-100)');
newProducts.forEach((p) => {
  (p.tags || []).forEach(t => {
    if (!allTagsSet.has(t)) { allTagsSet.set(t, mkId('TG', tagSeq++)); }
  });
});
// 기존 태그 이후의 신규 태그만 INSERT (기존 것은 front.js가 이미 삽입)
const origTagCount = origProducts.reduce((a, p) => a + new Set(p.tags || []).size, 0);
let newTagInsertCount = 0;
allTagsSet.forEach((tagId, tagNm) => {
  // 기존 50개 상품 태그에 없는 것만
  const isOrigTag = origProducts.some(p => (p.tags || []).includes(tagNm));
  if (!isOrigTag) {
    insert('pd_tag',
      ['tag_id','site_id','tag_nm','use_count','use_yn','reg_by','reg_date'],
      [tagId, SITE_ID, tagNm, 1, 'Y', REG_BY, REG_DATE]
    );
    newTagInsertCount++;
  }
});

newProducts.forEach((p) => {
  const prodId = mkId('PD', p.productId);
  (p.tags || []).forEach((t) => {
    const tagId = allTagsSet.get(t);
    if (tagId) {
      insert('pd_prod_tag',
        ['prod_tag_id','site_id','prod_id','tag_id','reg_by','reg_date'],
        [mkId('PT', prodTagSeq++), SITE_ID, prodId, tagId, REG_BY, REG_DATE]
      );
    }
  });
});

// ────────────────────────────────────────────────────
// 10. pd_category_prod — 51-100
// ────────────────────────────────────────────────────
section('10. pd_category_prod — 카테고리-상품 매핑 (51-100)');
newProducts.forEach((p) => {
  const catNm = apiCatMap[p.categoryId] || null;
  const catId = catNm ? (catNmMap[catNm] || null) : null;
  if (!catId) return;
  insert('pd_category_prod',
    ['category_prod_id','site_id','category_id','prod_id','category_prod_type_cd',
     'sort_ord','disp_yn','reg_by','reg_date'],
    [mkId('CP', catProdSeq), SITE_ID, catId, mkId('PD', p.productId),
     'NORMAL', catProdSeq, 'Y', REG_BY, REG_DATE]
  );
  catProdSeq++;
});

// ────────────────────────────────────────────────────
// 11. pd_review — 51-100 상품 리뷰
// ────────────────────────────────────────────────────
section('11. pd_review — 신규 상품 리뷰 (51-100)');
const reviewTitles = [
  '정말 만족스러운 제품이에요!', '가성비 최고입니다', '재구매 의사 있어요',
  '퀄리티가 기대 이상이에요', '배송도 빠르고 상품도 좋아요', '사이즈가 딱 맞아요',
  '색감이 실제로 더 예쁘네요', '친구 선물로도 좋을 것 같아요', '소재가 정말 좋아요',
  '착용감이 편안해요', '디자인이 너무 예쁘네요', '가격 대비 품질 훌륭해요',
  '오래 사용할 수 있을 것 같아요', '세탁 후에도 형태 유지됩니다', '주변에 추천하고 싶어요',
  '포장도 꼼꼼하게 잘 되어있었어요', '기대보다 훨씬 좋네요', '핏이 아주 잘 맞아요',
  '다음에 또 구매할게요', '색상이 사진과 동일해요',
];
const reviewContents = [
  '소재가 부드럽고 착용감이 정말 좋습니다. 세탁 후에도 변형이 없어서 만족해요.',
  '가격 대비 퀄리티가 너무 좋아서 깜짝 놀랐어요. 주변 지인들에게도 추천했습니다.',
  '배송이 빠르고 포장도 꼼꼼해서 좋았어요. 상품도 사진과 동일하고 만족합니다.',
  '핏이 정말 잘 맞아요. 다양한 코디에 활용하기 좋은 아이템입니다.',
  '색감이 실물로 보면 더 예뻐요. 사진보다 훨씬 좋은 품질이에요.',
  '디자인이 세련되고 일상에서 다양하게 활용하고 있어요. 재구매 예정입니다.',
  '사이즈 표가 정확해서 딱 맞게 구매했어요. 착용감도 편안하고 좋습니다.',
  '소재 질이 좋고 마감도 깔끔해요. 가격이 합리적이라 만족스럽습니다.',
];
const adminReplies = [
  '리뷰 남겨주셔서 감사합니다 😊 앞으로도 더 좋은 상품으로 보답하겠습니다.',
  '소중한 리뷰 감사드립니다! 만족하셨다니 저희도 기쁩니다.',
  '좋은 평가 감사합니다. 또 방문해 주세요! 🙏',
  '리뷰 감사합니다. 고객님의 소중한 의견을 반영해 더 좋은 서비스를 제공하겠습니다.',
  '따뜻한 리뷰 감사드립니다. 앞으로도 품질 관리에 최선을 다하겠습니다.',
];
const reviewDateBase = new Date('2026-02-01');
const reviewIdMap = [];

newProducts.forEach((p) => {
  const prodId = mkId('PD', p.productId);
  const count  = 3 + (p.productId % 3);

  for (let r = 0; r < count; r++) {
    const memberIdx = (p.productId + r) % memberIds.length;
    const memberId  = memberIds[memberIdx];
    const reviewId  = mkId('RV', reviewSeq++);
    const titleIdx  = (p.productId * 3 + r) % reviewTitles.length;
    const contIdx   = (p.productId * 5 + r) % reviewContents.length;
    const rating    = [4.0, 4.5, 5.0, 4.5, 5.0, 3.5, 4.0][(p.productId + r) % 7];
    const helpCnt   = (p.productId * r + 3) % 20;
    const regDate   = new Date(reviewDateBase.getTime() + (p.productId * 3 + r) * 86400000);
    const dateStr   = regDate.toISOString().replace('T', ' ').substring(0, 19);

    insert('pd_review',
      ['review_id','site_id','prod_id','member_id','review_title','review_content',
       'rating','helpful_cnt','review_status_cd','review_date','reg_by','reg_date'],
      [reviewId, SITE_ID, prodId, memberId,
       reviewTitles[titleIdx], reviewContents[contIdx],
       rating, helpCnt, 'ACTIVE', dateStr, REG_BY, dateStr]
    );
    reviewIdMap.push({ reviewId, prodId, memberId });
  }
});

// ────────────────────────────────────────────────────
// 12. pd_review_comment — 51-100 리뷰 답글
// ────────────────────────────────────────────────────
section('12. pd_review_comment — 신규 리뷰 관리자 답글');
reviewIdMap.forEach((rv, idx) => {
  if (idx % 3 !== 0) return;
  const replyId  = mkId('RC', rcSeq++);
  const replyIdx = idx % adminReplies.length;
  const regDate  = new Date(reviewDateBase.getTime() + idx * 86400000 + 86400000);
  const dateStr  = regDate.toISOString().replace('T', ' ').substring(0, 19);

  insert('pd_review_comment',
    ['review_comment_id','site_id','review_id','writer_type_cd',
     'writer_id','writer_nm','review_reply_content','reply_status_cd','reg_by','reg_date'],
    [replyId, SITE_ID, rv.reviewId, 'ADMIN',
     'US000001', 'ShopJoy 관리자',
     adminReplies[replyIdx], 'ACTIVE', REG_BY, dateStr]
  );
});

// ────────────────────────────────────────────────────
// 출력
// ────────────────────────────────────────────────────
const header = [
  '-- ================================================================',
  '-- pd_* 상품 2차 확장 샘플 데이터',
  '-- 생성: generate_sample_sql_prod2.js',
  '-- 스키마: shopjoy_2604',
  '-- 전제: generate_sample_sql_front.js + generate_sample_sql_prod.js 완료',
  '-- 포함:',
  '--   1. UPDATE pd_prod thumbnail_url (1-50번 CDN 경로 보정)',
  '--   2. INSERT pd_prod (51-100번 신규)',
  '--   3. pd_prod_opt/opt_item/sku (51-100)',
  '--   4. DELETE+INSERT pd_prod_img (전체 100개 CDN 경로)',
  '--   5. pd_prod_content (51-100)',
  '--   6. pd_tag + pd_prod_tag (51-100)',
  '--   7. pd_category_prod (51-100)',
  '--   8. pd_review + pd_review_comment (51-100)',
  '-- ================================================================',
  '',
].join('\n');

const output = header + lines.join('\n') + '\n';
const outFile = path.resolve(__dirname, 'sample_data_prod2.sql');
fs.writeFileSync(outFile, output, 'utf8');

const insertCnt = lines.filter(l => l.startsWith('INSERT')).length;
const updateCnt = lines.filter(l => l.startsWith('UPDATE')).length;
const deleteCnt = lines.filter(l => l.startsWith('DELETE')).length;
console.log(`완료: INSERT ${insertCnt}건 + UPDATE ${updateCnt}건 + DELETE ${deleteCnt}건 → ${outFile}`);
