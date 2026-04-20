'use strict';
/**
 * pd_* 상품 보완 데이터 INSERT SQL 생성기
 *
 * 사용법:
 *   node _doc/generate_sample_sql_prod.js
 *   → _doc/sample_data_prod.sql 생성
 *
 * 전제:
 *   - generate_sample_sql_front.js 먼저 실행 → pd_prod(50), pd_prod_opt, pd_prod_opt_item, pd_prod_sku 이미 삽입
 *
 * 생성 순서:
 *   1. pd_prod UPDATE  — 50개 상품에 누락 컬럼(is_new, is_best, view_count, sale_count, advrt_stmt 등) 보강
 *   2. pd_prod_content — 4가지 컨텐츠 유형 × 50 = 200건
 *   3. pd_prod_img     — 대표(1) + 서브(2) × 50 = 150건, 컬러별 이미지 추가 ~100건
 *   4. pd_review       — 3~5건 × 50 = ~200건
 *   5. pd_review_comment — 관리자 답글 ~60건
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
const dv  = (s) => s || null;

const lines = [];
const section = (title) => {
  lines.push('');
  lines.push('-- ================================================================');
  lines.push(`-- ${title}`);
  lines.push('-- ================================================================');
};
const insert = (table, cols, vals) =>
  lines.push(`INSERT INTO ${SCHEMA}.${table} (${cols.join(', ')}) VALUES (${vals.map(esc).join(', ')}) ON CONFLICT DO NOTHING;`);

// ── api 상품 로드 ────────────────────────────────────
const apiProducts = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../api/products/list.json'), 'utf8')
);

// ── ID 재현 (generate_sample_sql_front.js 와 동일 로직) ──
const apiProdIdMap = {};
for (let i = 1; i <= 50; i++) { apiProdIdMap[i] = mkId('PD', i); }

// optItemMap 재현 (색상 opt_item_id)
const optItemMap = {};   // productId → { colorItems:[{id,name,hex}], sizeItems:[{id,name}] }
let optSeq = 1, optItemSeq = 1;
apiProducts.forEach((p) => {
  const colorOptId = mkId('OG', optSeq++); // eslint-disable-line
  const sizeOptId  = mkId('OG', optSeq++); // eslint-disable-line
  const colorItems = [], sizeItems = [];
  (p.colors || []).forEach((c) => {
    colorItems.push({ id: mkId('OI', optItemSeq++), name: c.name, hex: c.hex });
  });
  (p.sizes || []).forEach((s) => {
    sizeItems.push({ id: mkId('OI', optItemSeq++), name: s });
  });
  optItemMap[p.productId] = { colorItems, sizeItems };
});

// ── 회원 IDs (MB000001..MB000008) ───────────────────
const memberIds = Array.from({ length: D.members.length }, (_, i) => mkId('MB', i + 1));
const memberNms = D.members.map(m => m.memberNm);

// ── 리뷰 텍스트 풀 ──────────────────────────────────
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
  '포근하고 따뜻해요. 겨울 내내 잘 활용하겠습니다. 색상 선택도 다양해서 좋아요.',
  '심플한 디자인으로 다양한 코디에 매칭하기 좋아요. 만족스러운 구매였습니다.',
  '생각보다 훨씬 고급스러워 보여요. 품질도 좋고 착용감도 편안합니다.',
  '재세탁 후에도 색상 변화 없이 유지되어서 좋아요. 오래 입을 수 있을 것 같아요.',
  '선물로 구매했는데 받으신 분이 너무 좋아하셨어요. 포장도 깔끔해서 더 좋았습니다.',
  '처음에 반신반의 했는데 실제로 받아보니 퀄리티에 놀랐어요. 적극 추천합니다.',
  '사이즈가 딱 제 체형에 맞았고 소재도 기대 이상으로 좋았습니다.',
];
const adminReplies = [
  '리뷰 남겨주셔서 감사합니다 😊 앞으로도 더 좋은 상품으로 보답하겠습니다.',
  '소중한 리뷰 감사드립니다! 만족하셨다니 저희도 기쁩니다.',
  '좋은 평가 감사합니다. 또 방문해 주세요! 🙏',
  '리뷰 감사합니다. 고객님의 소중한 의견을 반영해 더 좋은 서비스를 제공하겠습니다.',
  '따뜻한 리뷰 감사드립니다. 앞으로도 품질 관리에 최선을 다하겠습니다.',
  '구매해 주셔서 감사합니다! 다음에도 만족스러운 쇼핑 되시길 바랍니다.',
];

// ────────────────────────────────────────────────────
// 1. pd_prod UPDATE — 상품 보강 (is_new, is_best, view_count, sale_count, advrt_stmt 등)
// ────────────────────────────────────────────────────
section('1. pd_prod UPDATE — 상품 추가 컬럼 보강');
const badges = { 'NEW': true, '인기': false, 'BEST': false, 'SALE': false, '': false };
apiProducts.forEach((p) => {
  const prodId    = apiProdIdMap[p.productId];
  const isNew     = (p.badge === 'NEW') ? 'Y' : 'N';
  const isBest    = (p.badge === '인기' || p.badge === 'BEST') ? 'Y' : 'N';
  const viewCnt   = 200 + ((p.productId * 137) % 800);
  const saleCnt   = 20 + ((p.productId * 73) % 300);
  const weight    = (0.2 + (p.productId % 5) * 0.1).toFixed(1);
  const purchPrice = Math.round((p.price || 0) * 0.55 / 100) * 100;
  const marginRate = 45.00;
  const advrt     = p.badge === 'NEW' ? '신상품 출시! 지금 구매 시 무료배송'
                  : p.badge === '인기' ? '베스트셀러! 지금 가장 인기 있는 상품'
                  : null;

  // UPDATE (SAVEPOINT 패턴에서도 정상 동작)
  lines.push(
    `UPDATE ${SCHEMA}.pd_prod SET ` +
    `is_new=${esc(isNew)}, is_best=${esc(isBest)}, ` +
    `view_count=${viewCnt}, sale_count=${saleCnt}, ` +
    `weight=${weight}, purchase_price=${purchPrice}, margin_rate=${marginRate}, ` +
    `advrt_stmt=${esc(advrt)}, min_buy_qty=1, coupon_use_yn='Y', save_use_yn='Y', discnt_use_yn='Y' ` +
    `WHERE prod_id=${esc(prodId)};`
  );
});

// ────────────────────────────────────────────────────
// 2. pd_prod_content — 상품 컨텐츠 4종 × 50
// ────────────────────────────────────────────────────
section('2. pd_prod_content — 상품 컨텐츠 4종 × 50건 = 200건');
let contentSeq = 1;
const contentTypes = [
  { cd: 'DETAIL',     nm: '상세설명', ord: 1 },
  { cd: 'SIZE_GUIDE', nm: '사이즈안내', ord: 2 },
  { cd: 'NOTICE',     nm: '배송안내', ord: 3 },
  { cd: 'GUIDE',      nm: '반품정책', ord: 4 },
];
apiProducts.forEach((p) => {
  const prodId   = apiProdIdMap[p.productId];
  const colors   = (p.colors || []).map(c => c.name).join(', ');
  const sizes    = (p.sizes  || []).join(', ');

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
            `<li>도서·산간 지역: 추가 배송비 3,000~5,000원 발생</li>` +
            `</ul></div>`,
    GUIDE: `<div class="return-policy"><h4>반품·교환 안내</h4><ul>` +
           `<li>수령 후 7일 이내 반품/교환 가능</li>` +
           `<li>단순 변심 반품 시 왕복 배송비(6,000원) 고객 부담</li>` +
           `<li>불량/오배송 시 무료 반품 처리</li>` +
           `<li>착용/세탁/훼손된 상품은 반품 불가</li>` +
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
// 3. pd_prod_img — 대표(1) + 서브(2) + 컬러별(colors)
// ────────────────────────────────────────────────────
section('3. pd_prod_img — 상품 이미지');
let imgSeq = 1;
apiProducts.forEach((p) => {
  const prodId      = apiProdIdMap[p.productId];
  const baseUrl     = `/api/products/images/${p.productId}`;
  const { colorItems } = optItemMap[p.productId];

  // 대표 이미지
  insert('pd_prod_img',
    ['prod_img_id','site_id','prod_id','cdn_img_url','cdn_thumb_url',
     'img_alt_text','sort_ord','is_thumb','reg_by','reg_date'],
    [mkId('PI', imgSeq++), SITE_ID, prodId,
     `${baseUrl}/main.jpg`, `${baseUrl}/thumb.jpg`,
     p.prodNm, 1, 'Y', REG_BY, REG_DATE]
  );
  // 서브 이미지 2장
  ['back', 'detail'].forEach((view, vi) => {
    insert('pd_prod_img',
      ['prod_img_id','site_id','prod_id','cdn_img_url','cdn_thumb_url',
       'img_alt_text','sort_ord','is_thumb','reg_by','reg_date'],
      [mkId('PI', imgSeq++), SITE_ID, prodId,
       `${baseUrl}/${view}.jpg`, `${baseUrl}/${view}_thumb.jpg`,
       `${p.prodNm} ${vi === 0 ? '후면' : '상세'}`, vi + 2, 'N', REG_BY, REG_DATE]
    );
  });
  // 컬러별 이미지 (최대 4색)
  colorItems.slice(0, 4).forEach((c, ci) => {
    insert('pd_prod_img',
      ['prod_img_id','site_id','prod_id','opt_item_id_1','cdn_img_url','cdn_thumb_url',
       'img_alt_text','sort_ord','is_thumb','reg_by','reg_date'],
      [mkId('PI', imgSeq++), SITE_ID, prodId, c.id,
       `${baseUrl}/color_${c.name}.jpg`, `${baseUrl}/color_${c.name}_thumb.jpg`,
       `${p.prodNm} ${c.name}`, 10 + ci, 'N', REG_BY, REG_DATE]
    );
  });
});

// ────────────────────────────────────────────────────
// 4. pd_review — 상품별 3~5건
// ────────────────────────────────────────────────────
section('4. pd_review — 상품 리뷰 (~200건)');
let reviewSeq = 1;
const reviewDateBase = new Date('2026-01-15');
const reviewIdMap = [];   // { reviewId, prodId, memberId } — for comments

apiProducts.forEach((p) => {
  const prodId = apiProdIdMap[p.productId];
  const count  = 3 + (p.productId % 3);   // 3~5건

  for (let r = 0; r < count; r++) {
    const memberIdx  = (p.productId + r) % memberIds.length;
    const memberId   = memberIds[memberIdx];
    const reviewId   = mkId('RV', reviewSeq++);
    const titleIdx   = (p.productId * 3 + r) % reviewTitles.length;
    const contentIdx = (p.productId * 5 + r) % reviewContents.length;
    const rating     = [4.0, 4.5, 5.0, 4.5, 5.0, 3.5, 4.0][(p.productId + r) % 7];
    const helpfulCnt = (p.productId * r + 3) % 20;
    const regDate    = new Date(reviewDateBase.getTime() + (p.productId * 3 + r) * 86400000 * 2);
    const dateStr    = regDate.toISOString().replace('T', ' ').substring(0, 19);

    insert('pd_review',
      ['review_id','site_id','prod_id','member_id','review_title','review_content',
       'rating','helpful_cnt','review_status_cd','review_date','reg_by','reg_date'],
      [reviewId, SITE_ID, prodId, memberId,
       reviewTitles[titleIdx], reviewContents[contentIdx],
       rating, helpfulCnt, 'ACTIVE', dateStr, REG_BY, dateStr]
    );
    reviewIdMap.push({ reviewId, prodId, memberId });
  }
});

// ────────────────────────────────────────────────────
// 5. pd_review_comment — 관리자 답글 (약 60건 — 리뷰 3개 중 1개)
// ────────────────────────────────────────────────────
section('5. pd_review_comment — 관리자 답글 (~60건)');
let rcSeq = 1;
reviewIdMap.forEach((rv, idx) => {
  if (idx % 3 !== 0) return;   // 약 1/3 에만 답글

  const replyId  = mkId('RC', rcSeq++);
  const replyIdx = idx % adminReplies.length;
  const regDate  = new Date(reviewDateBase.getTime() + idx * 86400000 * 2 + 86400000);
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
  '-- pd_* 상품 보완 샘플 데이터',
  '-- 생성: generate_sample_sql_prod.js',
  '-- 스키마: shopjoy_2604',
  '-- 전제: generate_sample_sql_front.js 실행 완료 (pd_prod 50건 존재)',
  '-- 순서: pd_prod UPDATE → pd_prod_content → pd_prod_img',
  '--        → pd_review → pd_review_comment',
  '-- ================================================================',
  'SET search_path TO shopjoy_2604;',
  '',
].join('\n');

const output = header + lines.join('\n') + '\n';
const outFile = path.resolve(__dirname, 'sample_data_prod.sql');
fs.writeFileSync(outFile, output, 'utf8');

const insertCnt = lines.filter(l => l.startsWith('INSERT')).length;
const updateCnt = lines.filter(l => l.startsWith('UPDATE')).length;
console.log(`완료: INSERT ${insertCnt}건 + UPDATE ${updateCnt}건 → ${outFile}`);
