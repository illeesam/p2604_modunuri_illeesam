/**
 * 프론트 페이지 + API JSON → PostgreSQL INSERT SQL 생성기
 *
 * 사용법:
 *   node _doc/generate_sample_sql.js       (선행)
 *   node _doc/generate_sample_sql_ec.js    (선행)
 *   node _doc/generate_sample_sql_front.js (이 스크립트)
 *   → _doc/sample_data_front.sql 생성
 *
 * 소스:
 *   pages/Blog.js, pages/BlogView.js  → cm_bltn_cate, cm_bltn, cm_bltn_reply, cm_bltn_tag
 *   api/products/list.json            → pd_prod(50), pd_prod_opt, pd_prod_opt_item, pd_prod_sku
 *                                        pd_tag, pd_prod_tag, pd_category_prod
 *   api/my/orders.json                → od_order(25), od_order_item, mb_member_addr
 *   api/my/coupons.json               → pm_coupon_issue
 *   api/my/cash.json                  → pm_cache(22)
 *   api/my/inquiries.json             → sy_contact(15)
 *   api/my/claims.json + after-sales  → od_claim
 *   api/my/chats.json                 → cm_chatt_room, cm_chatt_msg
 *   api/base/site-config.json         → sy_bbs (FAQ)
 *
 * 스키마: shopjoy_2604
 */

'use strict';
const fs   = require('fs');
const path = require('path');

global.Vue    = { reactive: (x) => x };
global.window = {};
require(path.resolve(__dirname, '../pages/admin/AdminData.js'));
const D = global.window.adminData;

// ── 상수 ────────────────────────────────────────────────────────
const SCHEMA   = 'shopjoy_2604';
const REG_BY   = 'SYSTEM';
const REG_DATE = '2026-04-20 00:00:00';

const mkId = (prefix, n) => `${prefix}${String(n).padStart(6, '0')}`;

// ── 기존 ID 맵 재구성 ────────────────────────────────────────────
const siteIdMap = {};
D.sites.forEach((s, i) => { siteIdMap[s.siteId] = mkId('SITE', i + 1); });
const siteId1 = siteIdMap[1];

const brandNmMap = {};
D.brands.forEach((b, i) => { brandNmMap[b.brandNm] = mkId('BR', i + 1); });

const memberIdMap = {};
D.members.forEach((m, i) => { memberIdMap[m.userId] = mkId('MB', i + 1); });
const member1 = memberIdMap[1]; // 홍길동 MB000001

const prodIdMap = {};
D.products.forEach((p, i) => { prodIdMap[p.productId] = mkId('PD', i + 1); });

const couponIdMap = {};
D.coupons.forEach((c, i) => { couponIdMap[c.couponId] = mkId('CO', i + 1); });

const deptIdMap = {};
D.depts.forEach((d, i) => { deptIdMap[d.deptId] = mkId('DP', i + 1); });

// bbmIdMap from adminData.bbms (for FAQ board)
const bbmIdMap = {};
D.bbms.forEach((b, i) => { bbmIdMap[b.bbmId] = mkId('BM', i + 1); });
const faqBbmId = Object.values(bbmIdMap)[0]; // first bbm (공지사항)
// FAQ bbm은 bbmCode='FAQ'인 것 찾기
const faqBbm = D.bbms.find(b => b.bbmCode === 'FAQ');
const faqBbmDbId = faqBbm ? bbmIdMap[faqBbm.bbmId] : Object.values(bbmIdMap)[0];

// category map by name
const catNmMap = {};
D.categories.forEach((c, i) => { catNmMap[c.categoryNm] = mkId('CT', i + 1); });

// pd_prod IDs for 50 api products (productId 1-50)
const apiProdIdMap = {};
for (let i = 1; i <= 50; i++) { apiProdIdMap[i] = mkId('PD', i); }

// ── SQL 유틸 ────────────────────────────────────────────────────
const esc = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number')  return String(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  return `'${String(v).replace(/'/g, "''")}'`;
};
const dv  = (s) => s || null;
const tsv = (s) => s ? String(s).replace('T', ' ') : null;

const lines = [];
const section = (title) => {
  lines.push('');
  lines.push('-- ================================================================');
  lines.push(`-- ${title}`);
  lines.push('-- ================================================================');
};
const insert = (table, cols, vals) =>
  lines.push(`INSERT INTO ${SCHEMA}.${table} (${cols.join(', ')}) VALUES (${vals.map(esc).join(', ')}) ON CONFLICT DO NOTHING;`);

// ────────────────────────────────────────────────────────────────
// 1. cm_bltn_cate — 블로그 카테고리 (Blog.js)
// ────────────────────────────────────────────────────────────────
section('1. cm_bltn_cate — 블로그 카테고리');
const blogCates = [
  { id: 'BC000001', code: 'fashion',   nm: '패션',         sort: 1 },
  { id: 'BC000002', code: 'trend',     nm: '트렌드',       sort: 2 },
  { id: 'BC000003', code: 'lifestyle', nm: '라이프스타일', sort: 3 },
  { id: 'BC000004', code: 'howto',     nm: '스타일링 팁',  sort: 4 },
];
const blogCateMap = {};
blogCates.forEach(c => {
  blogCateMap[c.code] = c.id;
  insert('cm_bltn_cate',
    ['blog_cate_id','site_id','blog_cate_nm','sort_ord','use_yn','reg_by','reg_date'],
    [c.id, siteId1, c.nm, c.sort, 'Y', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 2. cm_bltn — 블로그 게시글 (Blog.js + BlogView.js body)
// ────────────────────────────────────────────────────────────────
section('2. cm_bltn — 블로그 게시글');
const blogPosts = [
  { id: 1, title: 'Anteposuerit litterarum formas.', category: 'fashion',   author: '김민지', date: '2026-04-10',
    summary: '고급 코튼 소재로 제작된 프리미엄 티셔츠. 통기성이 우수하고 세탁 후에도 형태가 유지됩니다.',
    body: 'Elga Ksenia shall Tirza use these kitchen utensils designed for Élinka, a new design-oriented brand for consumers introduced at the Ambiente show in February 2016. Lightweight anodized aluminum, bright colors, stainless steel and matte plastic shapes.\n\nAnd round tips on the cutting feature of these products designed for the kitchen.',
    tags: ['패션','신상품','코튼100%'], viewCount: 1240 },
  { id: 2, title: '2026 봄 트렌드 컬러 가이드', category: 'trend',     author: '이수진', date: '2026-04-08',
    summary: '올 봄 주목해야 할 트렌드 컬러와 컬러 매칭 방법을 알아봅니다.',
    body: '올 봄 주목해야 할 트렌드 컬러는 파스텔 라벤더, 소프트 민트, 코랄 핑크입니다.\n\n파스텔 컬러는 부드러운 분위기를 연출하면서도 세련된 느낌을 줍니다.',
    tags: ['트렌드','컬러','2026SS'], viewCount: 890 },
  { id: 3, title: '미니멀 라이프를 위한 옷장 정리법', category: 'lifestyle', author: '박지현', date: '2026-04-05',
    summary: '효율적인 옷장 정리 방법과 캡슐 워드로브 구성 팁.',
    body: '효율적인 옷장 정리를 위한 캡슐 워드로브 구성 팁을 소개합니다.\n\n우선, 자신의 스타일에 맞는 기본 컬러 팔레트를 정합니다.',
    tags: ['미니멀','정리','캡슐워드로브'], viewCount: 2100 },
  { id: 4, title: '데님 스타일링 A to Z', category: 'howto',     author: '정다운', date: '2026-04-03',
    summary: '계절별 데님 스타일링 팁과 데님 케어 방법까지.',
    body: '데님은 가장 기본적이면서도 활용도 높은 아이템입니다.\n\n계절별로 적합한 데님 소재와 핏을 선택하는 것이 중요합니다.',
    tags: ['데님','스타일링','가이드'], viewCount: 1560 },
  { id: 5, title: '지속 가능한 패션의 시작', category: 'lifestyle', author: '최예린', date: '2026-03-28',
    summary: '환경을 생각하는 패션 소비, 어디서부터 시작할 수 있을까요?',
    body: '지속 가능한 패션은 환경 보호와 윤리적 소비를 위한 선택입니다.\n\n오가닉 코튼, 재활용 소재, 공정무역 인증 제품을 선택해 보세요.',
    tags: ['지속가능','친환경','윤리패션'], viewCount: 780 },
  { id: 6, title: '봄 아우터 베스트 5', category: 'fashion',   author: '강하늘', date: '2026-03-25',
    summary: '환절기 필수 아우터 추천! 트렌치코트부터 라이트 재킷까지.',
    body: '봄철 아우터 선택 시 소재와 두께가 가장 중요합니다.\n\n트렌치코트는 클래식하면서도 다양한 스타일링이 가능한 봄 필수 아이템입니다.',
    tags: ['아우터','추천','봄패션'], viewCount: 1890 },
];
blogPosts.forEach((p) => {
  insert('cm_bltn',
    ['blog_id','site_id','blog_cate_id','blog_title','blog_summary',
     'blog_content','blog_author','view_count','use_yn','reg_by','reg_date'],
    [mkId('BL', p.id), siteId1, blogCateMap[p.category] || null,
     p.title, p.summary, p.body || null, p.author,
     p.viewCount || 0, 'Y', REG_BY, dv(p.date) ? p.date + ' 00:00:00' : REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 3. cm_bltn_tag — 블로그 태그
// ────────────────────────────────────────────────────────────────
section('3. cm_bltn_tag — 블로그 태그');
let bltnTagSeq = 1;
blogPosts.forEach((p) => {
  (p.tags || []).forEach((tag, i) => {
    insert('cm_bltn_tag',
      ['blog_tag_id','site_id','blog_id','tag_nm','sort_ord','reg_by','reg_date'],
      [mkId('BTG', bltnTagSeq++), siteId1, mkId('BL', p.id), tag, i + 1, REG_BY, REG_DATE]
    );
  });
});

// ────────────────────────────────────────────────────────────────
// 4. cm_bltn_reply — 블로그 댓글 (BlogView.js)
// ────────────────────────────────────────────────────────────────
section('4. cm_bltn_reply — 블로그 댓글');
const bltnComments = [
  { postId: 1, id: 1, author: '이수진', date: '2026-04-11', text: '정말 유용한 정보네요! 다음 시즌 스타일링에 참고하겠습니다.' },
  { postId: 1, id: 2, author: '박지현', date: '2026-04-11', text: '사진도 예쁘고 설명도 자세해서 좋아요.' },
  { postId: 1, id: 3, author: '정다운', date: '2026-04-12', text: '이런 글 더 많이 올려주세요!' },
  { postId: 2, id: 1, author: '강하늘', date: '2026-04-09', text: '라벤더 컬러 너무 예뻐요!' },
];
let replySeq = 1;
bltnComments.forEach((c) => {
  insert('cm_bltn_reply',
    ['comment_id','site_id','blog_id','writer_nm','blog_comment_content',
     'comment_status_cd','reg_by','reg_date'],
    [mkId('BR', replySeq++), siteId1, mkId('BL', c.postId),
     c.author, c.text, 'PUBLISH', REG_BY, c.date + ' 00:00:00']
  );
});

// ────────────────────────────────────────────────────────────────
// 5. sy_bbs — FAQ (api/base/site-config.json)
// ────────────────────────────────────────────────────────────────
section('5. sy_bbs — FAQ 게시물');
const siteConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../api/base/site-config.json'), 'utf8'));
(siteConfig.faqs || []).forEach((faq, i) => {
  insert('sy_bbs',
    ['bbs_id','site_id','bbm_id','author_nm','bbs_title',
     'content_html','view_count','like_count','comment_count',
     'is_fixed','bbs_status_cd','reg_by','reg_date'],
    [mkId('BSFQ', i + 1), siteId1, faqBbmDbId,
     'SYSTEM', faq.q, faq.a,
     0, 0, 0, 'N', 'PUBLISH', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 6. pd_prod — 상품 50개 (api/products/list.json)
// ────────────────────────────────────────────────────────────────
section('6. pd_prod — 상품 50개 (api/products/list.json)');
const apiProducts = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../api/products/list.json'), 'utf8'));
const apiCatMap = { 'tops': '상의', 'bottoms': '하의', 'dresses': '원피스', 'outerwear': '아우터', 'bags': '가방' };
const prodStMap = { '판매중':'SALE', '판매중지':'STOP', '품절':'SOLDOUT' };

apiProducts.forEach((p) => {
  const prodId   = apiProdIdMap[p.productId];
  const catNm    = apiCatMap[p.categoryId] || p.categoryId;
  const catId    = catNmMap[catNm] || null;
  const brandId  = brandNmMap['ShopJoy'] || null;
  insert('pd_prod',
    ['prod_id','site_id','category_id','brand_id','prod_nm','sale_price','list_price',
     'prod_stock','prod_status_cd','reg_by','reg_date'],
    [prodId, siteId1, catId, brandId,
     p.prodNm, p.price || 0, p.originalPrice || p.price || 0,
     p.stock || 100, prodStMap[p.status] || 'SALE', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 7. pd_prod_opt — 상품 옵션 그룹 (색상/사이즈)
// ────────────────────────────────────────────────────────────────
section('7. pd_prod_opt — 상품 옵션 그룹');
const optIdMap  = {};  // prodId → { colorOptId, sizeOptId }
let optSeq = 1;
apiProducts.forEach((p) => {
  const prodId = apiProdIdMap[p.productId];
  const colorOptId = mkId('OG', optSeq++);
  const sizeOptId  = mkId('OG', optSeq++);
  optIdMap[p.productId] = { colorOptId, sizeOptId };

  if (p.colors && p.colors.length > 0) {
    insert('pd_prod_opt',
      ['opt_id','site_id','prod_id','opt_grp_nm','opt_level','opt_type_cd','sort_ord','reg_by','reg_date'],
      [colorOptId, siteId1, prodId, '색상', 1, 'COLOR', 1, REG_BY, REG_DATE]
    );
  }
  if (p.sizes && p.sizes.length > 0) {
    insert('pd_prod_opt',
      ['opt_id','site_id','prod_id','opt_grp_nm','opt_level','opt_type_cd','sort_ord','reg_by','reg_date'],
      [sizeOptId, siteId1, prodId, '사이즈', 2, 'SIZE', 2, REG_BY, REG_DATE]
    );
  }
});

// ────────────────────────────────────────────────────────────────
// 8. pd_prod_opt_item — 옵션 아이템 (색상값/사이즈값)
// ────────────────────────────────────────────────────────────────
section('8. pd_prod_opt_item — 옵션 아이템');
const optItemMap = {};  // prodId → { colorItems:[{id,name}], sizeItems:[{id,name}] }
let optItemSeq = 1;
apiProducts.forEach((p) => {
  const { colorOptId, sizeOptId } = optIdMap[p.productId];
  const colorItems = [], sizeItems = [];

  (p.colors || []).forEach((c, i) => {
    const id = mkId('OI', optItemSeq++);
    colorItems.push({ id, name: c.name, hex: c.hex });
    insert('pd_prod_opt_item',
      ['opt_item_id','site_id','opt_id','opt_type_cd','opt_nm','opt_val','sort_ord','use_yn','reg_by','reg_date'],
      [id, siteId1, colorOptId, 'COLOR', c.name, c.hex || c.name, i + 1, 'Y', REG_BY, REG_DATE]
    );
  });
  (p.sizes || []).forEach((s, i) => {
    const id = mkId('OI', optItemSeq++);
    sizeItems.push({ id, name: s });
    insert('pd_prod_opt_item',
      ['opt_item_id','site_id','opt_id','opt_type_cd','opt_nm','opt_val','sort_ord','use_yn','reg_by','reg_date'],
      [id, siteId1, sizeOptId, 'SIZE', s, s, i + 1, 'Y', REG_BY, REG_DATE]
    );
  });
  optItemMap[p.productId] = { colorItems, sizeItems };
});

// ────────────────────────────────────────────────────────────────
// 9. pd_prod_sku — SKU (색상 × 사이즈)
// ────────────────────────────────────────────────────────────────
section('9. pd_prod_sku — SKU');
const skuIdMap = {};  // prodId → Map(colorName+'-'+sizeName → skuId)
let skuSeq = 1;
apiProducts.forEach((p) => {
  const prodId = apiProdIdMap[p.productId];
  const { colorItems, sizeItems } = optItemMap[p.productId];
  const prodSkuMap = {};
  skuIdMap[p.productId] = prodSkuMap;

  colorItems.forEach((c) => {
    sizeItems.forEach((s) => {
      const skuId = mkId('SK', skuSeq++);
      prodSkuMap[`${c.name}-${s.name}`] = skuId;
      insert('pd_prod_sku',
        ['sku_id','site_id','prod_id','opt_item_id_1','opt_item_id_2',
         'sku_code','add_price','prod_opt_stock','use_yn','reg_by','reg_date'],
        [skuId, siteId1, prodId, c.id, s.id,
         `${p.productId}-${c.name.substring(0,2)}-${s.name}`,
         0, 20, 'Y', REG_BY, REG_DATE]
      );
    });
  });
  // 색상만 있고 사이즈 없는 경우
  if (colorItems.length > 0 && sizeItems.length === 0) {
    colorItems.forEach((c) => {
      const skuId = mkId('SK', skuSeq++);
      prodSkuMap[c.name] = skuId;
      insert('pd_prod_sku',
        ['sku_id','site_id','prod_id','opt_item_id_1','sku_code','add_price','prod_opt_stock','use_yn','reg_by','reg_date'],
        [skuId, siteId1, prodId, c.id,
         `${p.productId}-${c.name.substring(0,2)}`,
         0, 20, 'Y', REG_BY, REG_DATE]
      );
    });
  }
});

// ────────────────────────────────────────────────────────────────
// 10. pd_tag + pd_prod_tag — 상품 태그
// ────────────────────────────────────────────────────────────────
section('10. pd_tag + pd_prod_tag — 상품 태그');
const allTagsSet = new Map();  // tagNm → tagId
let tagSeq = 1;
apiProducts.forEach((p) => {
  (p.tags || []).forEach(t => {
    if (!allTagsSet.has(t)) { allTagsSet.set(t, mkId('TG', tagSeq++)); }
  });
});
allTagsSet.forEach((tagId, tagNm) => {
  insert('pd_tag',
    ['tag_id','site_id','tag_nm','use_count','use_yn','reg_by','reg_date'],
    [tagId, siteId1, tagNm, 1, 'Y', REG_BY, REG_DATE]
  );
});
let prodTagSeq = 1;
apiProducts.forEach((p) => {
  const prodId = apiProdIdMap[p.productId];
  (p.tags || []).forEach((t) => {
    const tagId = allTagsSet.get(t);
    if (tagId) {
      insert('pd_prod_tag',
        ['prod_tag_id','site_id','prod_id','tag_id','reg_by','reg_date'],
        [mkId('PT', prodTagSeq++), siteId1, prodId, tagId, REG_BY, REG_DATE]
      );
    }
  });
});

// ────────────────────────────────────────────────────────────────
// 11. pd_category_prod — 카테고리-상품 매핑
// ────────────────────────────────────────────────────────────────
section('11. pd_category_prod — 카테고리-상품 매핑');
let catProdSeq = 1;
apiProducts.forEach((p) => {
  const catNm = apiCatMap[p.categoryId];
  const catId = catNm ? catNmMap[catNm] : null;
  if (!catId) return;
  insert('pd_category_prod',
    ['category_prod_id','site_id','category_id','prod_id','category_prod_type_cd',
     'sort_ord','disp_yn','reg_by','reg_date'],
    [mkId('CP', catProdSeq++), siteId1, catId, apiProdIdMap[p.productId],
     'NORMAL', catProdSeq, 'Y', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 12. od_order — 주문 25건 (api/my/orders.json)
// ────────────────────────────────────────────────────────────────
section('12. od_order — 주문 25건 (api/my/orders.json)');
const apiOrders = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../api/my/orders.json'), 'utf8'));
const orderStMap = {
  '주문완료':'PAID','주문확인':'PAID','배송준비중':'PREPARING','배송중':'SHIPPING',
  '배송완료':'DELIVERED','구매확정':'COMPLETE','취소':'CANCEL','반품완료':'RETURNED',
  '입금대기':'WAIT_PAY','결제완료':'PAID',
};
const payMethodMap = {
  '카카오페이':'KAKAO','무통장입금':'TRANSFER','카드결제':'CARD',
  '네이버페이':'NAVER','토스페이':'TOSS','핸드폰결제':'PHONE','신용카드':'CARD',
};
apiOrders.forEach((o) => {
  const totalAmt = o.totalPrice || (o.items || []).reduce((s,i) => s + (i.price||0)*( i.qty||1), 0);
  insert('od_order',
    ['order_id','site_id','member_id','member_nm','order_date',
     'total_amt','pay_amt','pay_method_cd','order_status_cd','reg_by','reg_date'],
    [o.orderId, siteId1, member1, o.memberNm || '홍길동',
     tsv(o.orderDate), totalAmt, totalAmt,
     payMethodMap[o.payMethod] || 'TRANSFER',
     orderStMap[o.status] || 'PAID', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 13. od_order_item — 주문 상품 아이템
// ────────────────────────────────────────────────────────────────
section('13. od_order_item — 주문 상품 아이템');
const orderItemStMap = {
  '주문완료':'ORDER_COMPLETE','배송준비중':'PREPARING','배송중':'SHIPPING',
  '배송완료':'DELIVERED','구매확정':'BUY_CONFIRM','취소':'CANCEL',
};
let orderItemSeq = 1;
apiOrders.forEach((o) => {
  (o.items || []).forEach((item) => {
    // try to find prod_id by name matching
    const matchProd = apiProducts.find(p => p.prodNm === item.prodNm);
    const prodId = matchProd ? apiProdIdMap[matchProd.productId] : null;
    insert('od_order_item',
      ['order_item_id','site_id','order_id','prod_id','prod_nm',
       'unit_price','order_qty','item_order_amt','order_item_status_cd','reg_by','reg_date'],
      [mkId('OI', orderItemSeq++), siteId1, o.orderId, prodId,
       item.prodNm, item.price || 0, item.qty || 1,
       (item.price || 0) * (item.qty || 1),
       orderItemStMap[o.status] || 'ORDER_COMPLETE', REG_BY, REG_DATE]
    );
  });
});

// ────────────────────────────────────────────────────────────────
// 14. mb_member_addr — 회원 주소 (주문 수령인 주소)
// ────────────────────────────────────────────────────────────────
section('14. mb_member_addr — 회원 배송 주소');
const addrSet = new Set();
let addrSeq = 1;
apiOrders.forEach((o) => {
  if (o.shippingAddr && !addrSet.has(o.shippingAddr)) {
    addrSet.add(o.shippingAddr);
    insert('mb_member_addr',
      ['addr_id','site_id','member_id','addr_nm','recv_nm','recv_phone',
       'addr','is_default','reg_by','reg_date'],
      [mkId('MA', addrSeq++), siteId1, member1,
       '배송지' + addrSeq, o.receiverNm || '홍길동',
       o.receiverPhone || '010-1111-1111',
       o.shippingAddr, addrSeq === 1 ? 'Y' : 'N',
       REG_BY, REG_DATE]
    );
  }
});
// 기본 주소 1개는 항상 추가
if (addrSeq === 1) {
  insert('mb_member_addr',
    ['addr_id','site_id','member_id','addr_nm','recv_nm','recv_phone',
     'addr','is_default','reg_by','reg_date'],
    [mkId('MA', 1), siteId1, member1, '기본배송지', '홍길동',
     '010-1111-1111', '서울 강남구 테헤란로 123', 'Y', REG_BY, REG_DATE]
  );
}

// ────────────────────────────────────────────────────────────────
// 15. pm_coupon_issue — 쿠폰 발급 (api/my/coupons.json)
// ────────────────────────────────────────────────────────────────
section('15. pm_coupon_issue — 쿠폰 발급 이력');
const apiCoupons = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../api/my/coupons.json'), 'utf8'));
apiCoupons.forEach((c, i) => {
  // coupon_id: api couponId 1-12 → couponIdMap or generate new CO ID
  const couponId = couponIdMap[c.couponId] || mkId('CO', 100 + i);
  insert('pm_coupon_issue',
    ['issue_id','site_id','coupon_id','member_id','issue_date','use_yn','reg_by','reg_date'],
    [mkId('CI', i + 1), siteId1, couponId, member1,
     dv(c.regDate) || REG_DATE,
     c.used ? 'Y' : 'N', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 16. pm_cache — 캐시 이력 (api/my/cash.json)
// ────────────────────────────────────────────────────────────────
section('16. pm_cache — 캐시 이력 (api/my/cash.json)');
const cashData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../api/my/cash.json'), 'utf8'));
const cashHistory = cashData.history || cashData;
const cacheTypeMap = { '충전':'CHARGE','사용':'USE','환불':'REFUND','만료소멸':'EXPIRE','관리자지급':'ADMIN_GRANT' };
(Array.isArray(cashHistory) ? cashHistory : []).forEach((c, i) => {
  insert('pm_cache',
    ['cache_id','site_id','member_id','member_nm','cache_type_cd',
     'cache_amt','balance_amt','cache_desc','cache_date','reg_by','reg_date'],
    [mkId('CC', 100 + i), siteId1, member1, '홍길동',
     cacheTypeMap[c.type] || 'CHARGE',
     c.amount || 0, c.balance || 0,
     c.desc || null, tsv(c.date), REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 17. sy_contact — 문의 (api/my/inquiries.json)
// ────────────────────────────────────────────────────────────────
section('17. sy_contact — 문의 이력 (api/my/inquiries.json)');
const apiInquiries = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../api/my/inquiries.json'), 'utf8'));
const contactStMap = { '요청':'REQUEST','처리중':'PROCESSING','답변완료':'ANSWERED','종료':'CLOSED' };
apiInquiries.forEach((c, i) => {
  insert('sy_contact',
    ['contact_id','site_id','member_id','member_nm','category_cd',
     'contact_title','contact_content','contact_status_cd',
     'contact_answer','contact_date','reg_by','reg_date'],
    [mkId('CQ', 100 + i), siteId1, member1, '홍길동',
     c.category || null, c.title, c.content || null,
     contactStMap[c.status] || 'REQUEST',
     c.answer || null, tsv(c.date), REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 18. od_claim — 클레임 (api/my/claims.json + after-sales.json)
// ────────────────────────────────────────────────────────────────
section('18. od_claim — 클레임 (api/my/claims + after-sales)');
const apiClaims = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../api/my/claims.json'), 'utf8'));
const afterSales = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../api/my/after-sales.json'), 'utf8'));
const claimTypeMap = { '취소':'CANCEL','반품':'RETURN','교환':'EXCHANGE' };
const claimStMap = {
  '취소요청':'REQUEST','반품요청':'REQUEST','교환요청':'REQUEST',
  '취소완료':'COMPLETE','반품완료':'COMPLETE','교환완료':'COMPLETE',
  '처리중':'PROCESSING','승인대기':'APPROVED',
};
const allClaims = [
  ...apiClaims.map(c => ({ ...c, type: c.type, status: c.status })),
  ...afterSales.map(c => ({ ...c, type: c.kind, status: c.status })),
];
allClaims.forEach((c) => {
  insert('od_claim',
    ['claim_id','site_id','order_id','member_id','member_nm',
     'claim_type_cd','claim_status_cd','reason_detail',
     'refund_amt','request_date','reg_by','reg_date'],
    [c.claimId, siteId1, c.orderId, member1, '홍길동',
     claimTypeMap[c.type] || 'CANCEL',
     claimStMap[c.status] || 'REQUEST',
     c.reason || c.reasonDetail || null,
     c.refundAmount || 0,
     tsv(c.requestDate || c.requestedAt), REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 19. cm_chatt_room + cm_chatt_msg — 채팅 (api/my/chats.json)
// ────────────────────────────────────────────────────────────────
section('19. cm_chatt_room + cm_chatt_msg — 채팅');
const apiChats = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../api/my/chats.json'), 'utf8'));
const chattStMap = { '진행중':'OPEN','종료':'CLOSED','대기':'WAITING' };
const senderMap  = { 'user':'MEMBER','cs':'ADMIN','admin':'ADMIN' };
let msgSeq = 1;
apiChats.forEach((c, i) => {
  const roomId = mkId('CR', 100 + i);
  insert('cm_chatt_room',
    ['chatt_room_id','site_id','member_id','member_nm',
     'subject','chatt_status_cd','last_msg_date',
     'member_unread_cnt','admin_unread_cnt','reg_by','reg_date'],
    [roomId, siteId1, member1, '홍길동',
     c.subject || null, chattStMap[c.status] || 'OPEN',
     tsv(c.date), c.unread || 0, 0, REG_BY, REG_DATE]
  );
  (c.messages || []).forEach((msg) => {
    insert('cm_chatt_msg',
      ['msg_id','site_id','chatt_id','sender_cd','msg_text',
       'send_date','read_yn','reg_by','reg_date'],
      [mkId('MSG', msgSeq++), siteId1, roomId,
       senderMap[msg.from] || 'MEMBER',
       msg.text || null,
       tsv(c.date), 'Y', REG_BY, REG_DATE]
    );
  });
});

// ────────────────────────────────────────────────────────────────
// 출력
// ────────────────────────────────────────────────────────────────
const header = [
  '-- ================================================================',
  '-- 프론트 페이지 + API JSON → PostgreSQL 샘플 데이터',
  '-- 생성: generate_sample_sql_front.js',
  '-- 스키마: shopjoy_2604',
  '-- 전제: generate_sample_sql.js + generate_sample_sql_ec.js 먼저 실행',
  '-- ================================================================',
  'SET search_path TO shopjoy_2604;',
  '',
];

const output = header.join('\n') + lines.join('\n') + '\n';
const outFile = path.resolve(__dirname, 'sample_data_front.sql');
fs.writeFileSync(outFile, output, 'utf8');

const cnt = lines.filter(l => l.startsWith('INSERT')).length;
console.log(`완료: ${cnt}개 INSERT → ${outFile}`);
