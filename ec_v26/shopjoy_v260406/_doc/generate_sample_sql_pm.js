'use strict';
/**
 * pm_* 프로모션 샘플 데이터 생성기
 *
 * 사용법:
 *   node _doc/generate_sample_sql_pm.js
 *   → _doc/sample_data_pm.sql 생성
 *
 * 전제:
 *   - generate_sample_sql_ec.js 완료: pm_coupon CO000001..8, pm_cache CC000001..12, pm_event EV000001..6
 *   - generate_sample_sql_front.js 완료: pm_coupon_issue CI000001..12
 *
 * 생성:
 *   1.  pm_coupon       신규 CO000009..CO000015 (7건)
 *   2.  pm_coupon_item  쿠폰 적용 대상 (~20건)
 *   3.  pm_coupon_issue 추가 발급 CI000013+ (~35건)
 *   4.  pm_coupon_usage 사용 이력 (~20건)
 *   5.  pm_discnt       DI000001..5 (D.discntList)
 *   6.  pm_discnt_item  (~8건)
 *   7.  pm_discnt_usage (~12건)
 *   8.  pm_event        신규 EV000007..10 (4건)
 *   9.  pm_event_benefit 전체 10이벤트 혜택 (~22건)
 *  10.  pm_event_item   전체 10이벤트 대상상품 (~30건)
 *  11.  pm_gift         GT000001..5 (D.giftList)
 *  12.  pm_gift_cond    (~8건)
 *  13.  pm_gift_issue   (~15건)
 *  14.  pm_plan         PL000001..8 (D.plans)
 *  15.  pm_plan_item    (~35건)
 *  16.  pm_save         마일리지 원장 (~60건)
 *  17.  pm_save_issue   지급 이력 (~35건)
 *  18.  pm_save_usage   사용 이력 (~15건)
 *  19.  pm_voucher      VC000001..5 (D.voucherList)
 *  20.  pm_voucher_issue VC 발급 이력 (~14건)
 *  21.  pm_cache        추가 충전금 CC000200+ (~24건)
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
const esc  = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number')  return String(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  return `'${String(v).replace(/'/g, "''")}'`;
};
const dv  = (s) => s || null;
const ts  = (s) => s ? s + ' 00:00:00' : null;
const tsv = (s) => s ? String(s).replace('T', ' ') : null;

// ── ID 맵 (ec.js 와 동일 로직) ─────────────────────────────────
const siteIdMap = {};
D.sites.forEach((s, i) => { siteIdMap[s.siteId] = mkId('SITE', i + 1); });
const siteId1 = siteIdMap[1];

const memberIdMap = {};
D.members.forEach((m, i) => { memberIdMap[m.userId] = mkId('MB', i + 1); });

const couponIdMap = {};
D.coupons.forEach((c, i) => { couponIdMap[c.couponId] = mkId('CO', i + 1); });

const eventIdMap = {};
D.events.forEach((e, i) => { eventIdMap[e.eventId] = mkId('EV', i + 1); });

// product ID 직접 맵핑 (adminData.products, front api products)
const apiProdIdMap = {};
for (let i = 1; i <= 100; i++) { apiProdIdMap[i] = mkId('PD', i); }

// ── 시퀀스 카운터 ────────────────────────────────────────────────
let couponSeq   = D.coupons.length + 1;     // 9
let cItemSeq    = 1;   // pm_coupon_item
let cIssueSeq   = 13;  // pm_coupon_issue (front.js가 1..12 사용)
let cUsageSeq   = 1;   // pm_coupon_usage
let discntSeq   = 1;   // pm_discnt
let dItemSeq    = 1;   // pm_discnt_item
let dUsageSeq   = 1;   // pm_discnt_usage
let eventSeq    = D.events.length + 1;      // 7
let eBenSeq     = 1;   // pm_event_benefit
let eItemSeq    = 1;   // pm_event_item
let giftSeq     = 1;   // pm_gift
let gCondSeq    = 1;   // pm_gift_cond
let gIssueSeq   = 1;   // pm_gift_issue
let planSeq     = 1;   // pm_plan
let pItemSeq    = 1;   // pm_plan_item
let saveSeq     = 1;   // pm_save
let sIssueSeq   = 1;   // pm_save_issue
let sUsageSeq   = 1;   // pm_save_usage
let voucherSeq  = 1;   // pm_voucher
let vIssueSeq   = 1;   // pm_voucher_issue
let cacheSeq    = 200; // pm_cache 추가 (ec.js가 1..12, front.js가 100..121 사용)

// ── SQL 빌더 ───────────────────────────────────────────────────
const lines = [];
const section = (t) => {
  lines.push('');
  lines.push('-- ================================================================');
  lines.push(`-- ${t}`);
  lines.push('-- ================================================================');
};
const ins = (table, cols, vals) =>
  lines.push(`INSERT INTO ${SCHEMA}.${table} (${cols.join(', ')}) VALUES (${vals.map(esc).join(', ')}) ON CONFLICT DO NOTHING;`);

// ════════════════════════════════════════════════════════════════
// 1. pm_coupon — 신규 7건 (CO000009..CO000015)
// ════════════════════════════════════════════════════════════════
section('1. pm_coupon — 신규 쿠폰 7건');
const newCoupons = [
  { couponId:9,  code:'BOTTOMS05',  nm:'하의류 5% 할인',        type:'RATE', rate:5,  amt:0,     minOrder:30000,  maxDisc:10000, limit:300, validFrom:'2026-04-01', validTo:'2026-09-30', status:'ACTIVE' },
  { couponId:10, code:'OUTER3000',  nm:'아우터 3,000원 할인',    type:'AMT',  rate:0,  amt:3000,  minOrder:80000,  maxDisc:null,  limit:200, validFrom:'2026-03-01', validTo:'2026-08-31', status:'ACTIVE' },
  { couponId:11, code:'BDAY10',     nm:'생일 축하 10% 할인',     type:'RATE', rate:10, amt:0,     minOrder:0,      maxDisc:20000, limit:999, validFrom:'2026-01-01', validTo:'2026-12-31', status:'ACTIVE' },
  { couponId:12, code:'NEWMEM',     nm:'신규 무료배송 쿠폰',      type:'FREE', rate:0,  amt:0,     minOrder:0,      maxDisc:null,  limit:999, validFrom:'2026-01-01', validTo:'2026-12-31', status:'ACTIVE' },
  { couponId:13, code:'REVIEW2000', nm:'리뷰 작성 2,000원 보상',  type:'AMT',  rate:0,  amt:2000,  minOrder:20000,  maxDisc:null,  limit:999, validFrom:'2026-01-01', validTo:'2026-12-31', status:'ACTIVE' },
  { couponId:14, code:'APP1000',    nm:'앱 전용 1,000원 할인',    type:'AMT',  rate:0,  amt:1000,  minOrder:15000,  maxDisc:null,  limit:999, validFrom:'2026-01-01', validTo:'2026-12-31', status:'ACTIVE' },
  { couponId:15, code:'VIP15',      nm:'VIP 연간 15% 할인',       type:'RATE', rate:15, amt:0,     minOrder:100000, maxDisc:30000, limit:50,  validFrom:'2026-01-01', validTo:'2026-12-31', status:'ACTIVE' },
];
newCoupons.forEach((c) => {
  const id = mkId('CO', couponSeq++);
  couponIdMap[c.couponId] = id;
  ins('pm_coupon',
    ['coupon_id','site_id','coupon_cd','coupon_nm','coupon_type_cd',
     'discount_rate','discount_amt','min_order_amt','max_discount_amt',
     'issue_limit','valid_from','valid_to','coupon_status_cd','use_yn','reg_by','reg_date'],
    [id, SITE_ID, c.code, c.nm, c.type,
     c.rate, c.amt, c.minOrder, dv(c.maxDisc),
     c.limit, ts(c.validFrom), ts(c.validTo), c.status, 'Y', REG_BY, REG_DATE]
  );
});

// ════════════════════════════════════════════════════════════════
// 2. pm_coupon_item — 쿠폰 적용 대상
// ════════════════════════════════════════════════════════════════
section('2. pm_coupon_item — 쿠폰 적용 대상');
// CO000003 여름시즌 → 상의/하의 카테고리 상품 5종
[1, 2, 3, 11, 12].forEach((pid) => {
  ins('pm_coupon_item',
    ['coupon_item_id','coupon_id','site_id','target_type_cd','target_id','reg_by','reg_date'],
    [mkId('CPIT', cItemSeq++), couponIdMap[3], SITE_ID, 'PRODUCT', apiProdIdMap[pid], REG_BY, REG_DATE]
  );
});
// CO000009 하의류 → 하의 상품 5종 (PD000011-20)
[11, 12, 13, 14, 15].forEach((pid) => {
  ins('pm_coupon_item',
    ['coupon_item_id','coupon_id','site_id','target_type_cd','target_id','reg_by','reg_date'],
    [mkId('CPIT', cItemSeq++), couponIdMap[9], SITE_ID, 'PRODUCT', apiProdIdMap[pid], REG_BY, REG_DATE]
  );
});
// CO000010 아우터 → 아우터 상품 (PD000021-30)
[21, 22, 23, 24, 25].forEach((pid) => {
  ins('pm_coupon_item',
    ['coupon_item_id','coupon_id','site_id','target_type_cd','target_id','reg_by','reg_date'],
    [mkId('CPIT', cItemSeq++), couponIdMap[10], SITE_ID, 'PRODUCT', apiProdIdMap[pid], REG_BY, REG_DATE]
  );
});
// CO000015 VIP 연간 → 전 상품 (item 없으면 ALL 적용 가정, 샘플로 몇 개만)
[31, 33, 35, 47, 49].forEach((pid) => {
  ins('pm_coupon_item',
    ['coupon_item_id','coupon_id','site_id','target_type_cd','target_id','reg_by','reg_date'],
    [mkId('CPIT', cItemSeq++), couponIdMap[15], SITE_ID, 'PRODUCT', apiProdIdMap[pid], REG_BY, REG_DATE]
  );
});

// ════════════════════════════════════════════════════════════════
// 3. pm_coupon_issue — 추가 발급 (CI000013+, 다양한 회원)
// ════════════════════════════════════════════════════════════════
section('3. pm_coupon_issue — 추가 발급 (~35건)');
// 회원별 쿠폰 발급 데이터
const couponIssueData = [
  // 홍길동 (MB000001, VIP): VIP쿠폰, 추가20%, 무료배송
  { cpId:4,  mbId:1, issueDate:'2026-04-01 10:00:00', useYn:'N', useDate:null, orderId:null },
  { cpId:6,  mbId:1, issueDate:'2026-03-15 09:00:00', useYn:'Y', useDate:'2026-03-22 11:27:00', orderId:'ORD-2026-021' },
  { cpId:15, mbId:1, issueDate:'2026-01-01 00:00:00', useYn:'N', useDate:null, orderId:null },
  // 이영희 (MB000002, 일반): 신규가입, 무료배송, 봄맞이
  { cpId:1,  mbId:2, issueDate:'2026-01-15 15:00:00', useYn:'Y', useDate:'2026-04-02 21:05:00', orderId:'ORD-2026-023' },
  { cpId:5,  mbId:2, issueDate:'2026-03-10 10:00:00', useYn:'N', useDate:null, orderId:null },
  { cpId:12, mbId:2, issueDate:'2026-01-15 15:00:00', useYn:'Y', useDate:'2026-02-20 14:00:00', orderId:'ORD-2026-019' },
  // 박민준 (MB000003, 우수): 봄맞이, 추가할인, 리뷰보상
  { cpId:2,  mbId:3, issueDate:'2026-04-01 10:00:00', useYn:'N', useDate:null, orderId:null },
  { cpId:13, mbId:3, issueDate:'2026-03-05 09:00:00', useYn:'Y', useDate:'2026-03-28 16:44:00', orderId:'ORD-2026-022' },
  { cpId:13, mbId:3, issueDate:'2026-04-05 09:00:00', useYn:'N', useDate:null, orderId:null },
  // 김수현 (MB000004): 신규가입, 봄맞이
  { cpId:1,  mbId:4, issueDate:'2026-03-01 15:30:00', useYn:'Y', useDate:'2026-03-18 08:53:00', orderId:'ORD-2026-020' },
  { cpId:2,  mbId:4, issueDate:'2026-04-01 10:00:00', useYn:'N', useDate:null, orderId:null },
  { cpId:12, mbId:4, issueDate:'2026-03-01 15:30:00', useYn:'N', useDate:null, orderId:null },
  // 최지우 (MB000005): 신규가입, 무료배송
  { cpId:1,  mbId:5, issueDate:'2025-12-10 11:00:00', useYn:'N', useDate:null, orderId:null },
  { cpId:5,  mbId:5, issueDate:'2026-01-05 10:00:00', useYn:'N', useDate:null, orderId:null },
  // 정민호 (MB000006, 우수): 봄맞이, 여름, 아우터, 하의류
  { cpId:2,  mbId:6, issueDate:'2026-04-01 10:00:00', useYn:'N', useDate:null, orderId:null },
  { cpId:3,  mbId:6, issueDate:'2026-04-15 10:00:00', useYn:'N', useDate:null, orderId:null },
  { cpId:9,  mbId:6, issueDate:'2026-04-10 10:00:00', useYn:'N', useDate:null, orderId:null },
  { cpId:10, mbId:6, issueDate:'2026-04-10 10:00:00', useYn:'N', useDate:null, orderId:null },
  // 강예은 (MB000007): 신규가입, 봄맞이, 리뷰보상
  { cpId:1,  mbId:7, issueDate:'2026-02-14 13:00:00', useYn:'N', useDate:null, orderId:null },
  { cpId:2,  mbId:7, issueDate:'2026-04-01 10:00:00', useYn:'N', useDate:null, orderId:null },
  { cpId:13, mbId:7, issueDate:'2026-03-20 09:00:00', useYn:'N', useDate:null, orderId:null },
  // 윤성준 (MB000008, VIP): VIP쿠폰, 추가20%, VIP연간
  { cpId:4,  mbId:8, issueDate:'2026-01-01 00:00:00', useYn:'Y', useDate:'2026-02-22 22:14:00', orderId:'ORD-2026-015' },
  { cpId:6,  mbId:8, issueDate:'2026-04-01 09:00:00', useYn:'N', useDate:null, orderId:null },
  { cpId:15, mbId:8, issueDate:'2026-01-01 00:00:00', useYn:'N', useDate:null, orderId:null },
  // 신규가입 쿠폰 자동 발급 (전 회원)
  { cpId:12, mbId:1, issueDate:'2025-11-01 00:00:00', useYn:'Y', useDate:'2025-11-15 14:00:00', orderId:null },
  { cpId:11, mbId:1, issueDate:'2026-04-01 00:00:00', useYn:'N', useDate:null, orderId:null },
  { cpId:11, mbId:8, issueDate:'2025-10-20 00:00:00', useYn:'N', useDate:null, orderId:null },
  // 여름 시즌 쿠폰 발급
  { cpId:3,  mbId:1, issueDate:'2026-04-15 10:00:00', useYn:'N', useDate:null, orderId:null },
  { cpId:3,  mbId:3, issueDate:'2026-04-15 10:00:00', useYn:'N', useDate:null, orderId:null },
  // 앱 전용 쿠폰
  { cpId:8,  mbId:2, issueDate:'2026-04-01 10:00:00', useYn:'N', useDate:null, orderId:null },
  { cpId:8,  mbId:3, issueDate:'2026-04-01 10:00:00', useYn:'N', useDate:null, orderId:null },
  { cpId:14, mbId:1, issueDate:'2026-04-01 10:00:00', useYn:'N', useDate:null, orderId:null },
  { cpId:14, mbId:6, issueDate:'2026-04-01 10:00:00', useYn:'N', useDate:null, orderId:null },
];
couponIssueData.forEach((d) => {
  const cols = ['issue_id','site_id','coupon_id','member_id','issue_date','use_yn','reg_by','reg_date'];
  const vals = [mkId('CI', cIssueSeq++), SITE_ID,
    couponIdMap[d.cpId], memberIdMap[d.mbId], d.issueDate, d.useYn, REG_BY, REG_DATE];
  if (d.useDate) {
    cols.push('use_date');
    vals.push(d.useDate);
  }
  if (d.orderId) {
    cols.push('order_id');
    vals.push(d.orderId);
  }
  ins('pm_coupon_issue', cols, vals);
});

// ════════════════════════════════════════════════════════════════
// 4. pm_coupon_usage — 쿠폰 사용 이력 (used_yn='Y' 건 대상)
// ════════════════════════════════════════════════════════════════
section('4. pm_coupon_usage — 쿠폰 사용 이력 (~20건)');
const couponUsageData = [
  // (couponId, memberId, orderId, discountType, discountValue, discountAmt, usedDate)
  { cpId:6,  mbId:1, orderId:'ORD-2026-021', type:'RATE',  val:20, amt:11000, date:'2026-03-22 11:27:00' },
  { cpId:4,  mbId:8, orderId:'ORD-2026-015', type:'AMT',   val:10000, amt:10000, date:'2026-02-22 22:14:00' },
  { cpId:1,  mbId:2, orderId:'ORD-2026-023', type:'RATE',  val:10, amt:10400, date:'2026-04-02 21:05:00' },
  { cpId:13, mbId:3, orderId:'ORD-2026-022', type:'AMT',   val:2000, amt:2000, date:'2026-03-28 16:44:00' },
  { cpId:1,  mbId:4, orderId:'ORD-2026-020', type:'RATE',  val:10, amt:4500, date:'2026-03-18 08:53:00' },
  { cpId:12, mbId:2, orderId:'ORD-2026-019', type:'FREE',  val:0,  amt:3000, date:'2026-02-20 14:00:00' },
  // 기존 쿠폰 사용이력 (D.coupons 의 useCount 반영)
  { cpId:2,  mbId:1, orderId:'ORD-2026-018', type:'AMT',   val:5000, amt:5000, date:'2026-03-10 13:22:00' },
  { cpId:5,  mbId:1, orderId:'ORD-2026-024', type:'FREE',  val:0,  amt:3000, date:'2026-04-04 09:18:00' },
  { cpId:7,  mbId:3, orderId:'ORD-2026-016', type:'AMT',   val:3000, amt:3000, date:'2026-02-27 15:36:00' },
  { cpId:8,  mbId:6, orderId:'ORD-2026-017', type:'AMT',   val:2000, amt:2000, date:'2026-03-07 10:48:00' },
  { cpId:3,  mbId:8, orderId:'ORD-2026-014', type:'RATE',  val:15, amt:8250, date:'2026-02-18 07:59:00' },
];
couponUsageData.forEach((d) => {
  ins('pm_coupon_usage',
    ['usage_id','site_id','coupon_id','coupon_code','coupon_nm',
     'member_id','order_id','discount_type_cd','discount_value','discount_amt','used_date','reg_by','reg_date'],
    [mkId('COUS', cUsageSeq++), SITE_ID,
     couponIdMap[d.cpId], D.coupons.find(c=>c.couponId===d.cpId)?.code || null,
     D.coupons.find(c=>c.couponId===d.cpId)?.name || null,
     memberIdMap[d.mbId], d.orderId, d.type, d.val, d.amt, d.date, REG_BY, REG_DATE]
  );
});

// ════════════════════════════════════════════════════════════════
// 5. pm_discnt — 할인 정책 (D.discntList 5건)
// ════════════════════════════════════════════════════════════════
section('5. pm_discnt — 할인 정책 5건');
const discntTypeMap = { '정률':'RATE', '정액':'FIXED', '장바구니':'CART' };
const discntStMap   = { '활성':'ACTIVE', '비활성':'INACTIVE', '만료':'EXPIRED' };
const discntIds     = {};
D.discntList.forEach((d) => {
  const id = mkId('DI', discntSeq++);
  discntIds[d.discntId] = id;
  ins('pm_discnt',
    ['discnt_id','site_id','discnt_nm','discnt_type_cd','discnt_target_cd',
     'discnt_value','min_order_amt','discnt_status_cd',
     'start_date','end_date','discnt_desc','use_yn','reg_by','reg_date'],
    [id, SITE_ID, d.discntNm,
     discntTypeMap[d.discntType] || 'RATE', 'ALL',
     d.discntVal || 0, d.minOrderAmt || 0,
     discntStMap[d.discntStatus] || 'ACTIVE',
     ts(d.startDate), ts(d.endDate),
     d.remark || null, 'Y', REG_BY, REG_DATE]
  );
});

// ════════════════════════════════════════════════════════════════
// 6. pm_discnt_item — 할인 대상 항목
// ════════════════════════════════════════════════════════════════
section('6. pm_discnt_item — 할인 대상 항목 (~8건)');
// DI000001 (정률10%) → 상의 상품
[1, 2, 3, 4, 5].forEach((pid) => {
  ins('pm_discnt_item',
    ['discnt_item_id','discnt_id','site_id','target_type_cd','target_id','reg_by','reg_date'],
    [mkId('DITI', dItemSeq++), discntIds[1], SITE_ID, 'PRODUCT', apiProdIdMap[pid], REG_BY, REG_DATE]
  );
});
// DI000002 (정액5000) → 원피스/드레스 상품
[31, 32, 33, 34].forEach((pid) => {
  ins('pm_discnt_item',
    ['discnt_item_id','discnt_id','site_id','target_type_cd','target_id','reg_by','reg_date'],
    [mkId('DITI', dItemSeq++), discntIds[2], SITE_ID, 'PRODUCT', apiProdIdMap[pid], REG_BY, REG_DATE]
  );
});

// ════════════════════════════════════════════════════════════════
// 7. pm_discnt_usage — 할인 적용 이력 (~12건)
// ════════════════════════════════════════════════════════════════
section('7. pm_discnt_usage — 할인 적용 이력 (~12건)');
const discntUsageData = [
  { dId:1, mbId:1, orderId:'ORD-2026-024', type:'RATE', val:10, amt:23880, date:'2026-04-04 09:18:00' },
  { dId:1, mbId:3, orderId:'ORD-2026-016', type:'RATE', val:10, amt:5990,  date:'2026-02-27 15:36:00' },
  { dId:2, mbId:2, orderId:'ORD-2026-023', type:'FIXED', val:5000, amt:5000, date:'2026-04-02 21:05:00' },
  { dId:3, mbId:1, orderId:'ORD-2026-021', type:'RATE', val:10, amt:5500,  date:'2026-03-22 11:27:00' },
  { dId:3, mbId:8, orderId:'ORD-2026-015', type:'RATE', val:10, amt:10890, date:'2026-02-22 22:14:00' },
  { dId:3, mbId:6, orderId:'ORD-2026-017', type:'RATE', val:10, amt:4900,  date:'2026-03-07 10:48:00' },
  { dId:5, mbId:4, orderId:'ORD-2026-020', type:'FIXED', val:3000, amt:3000, date:'2026-03-18 08:53:00' },
  { dId:5, mbId:7, orderId:'ORD-2026-012', type:'FIXED', val:3000, amt:3000, date:'2026-02-10 18:07:00' },
];
discntUsageData.forEach((d) => {
  ins('pm_discnt_usage',
    ['discnt_usage_id','site_id','discnt_id','discnt_nm',
     'member_id','order_id','discnt_type_cd','discnt_value','discnt_amt','used_date','reg_by','reg_date'],
    [mkId('DIUS', dUsageSeq++), SITE_ID,
     discntIds[d.dId], D.discntList.find(x=>x.discntId===d.dId)?.discntNm || null,
     memberIdMap[d.mbId], d.orderId, d.type, d.val, d.amt, d.date, REG_BY, REG_DATE]
  );
});

// ════════════════════════════════════════════════════════════════
// 8. pm_event — 신규 4건 (EV000007..EV000010)
// ════════════════════════════════════════════════════════════════
section('8. pm_event — 신규 이벤트 4건');
const newEvents = [
  { id:7, nm:'리뷰 이벤트 - 포토리뷰 적립금 2배',  type:'CAMPAIGN',  title:'포토리뷰 작성하고 적립금 2배 받자!',
    content:'<p>포토리뷰 작성 시 기본 적립금 2배 지급! 솔직한 후기를 남겨주세요.</p>',
    start:'2026-04-01', end:'2026-12-31', status:'ACTIVE', targetProds:[1,2,3] },
  { id:8, nm:'5월 골든위크 세일',                   type:'FLASH',     title:'5월 1주 골든위크 최대 50% 할인!',
    content:'<p style="color:#e8587a;font-weight:700;">⏰ 5월 1~7일 한정! 최대 50% 할인 + 무료배송</p><p>기간 한정 특가 상품을 지금 바로 만나보세요.</p>',
    start:'2026-05-01', end:'2026-05-07', status:'DRAFT', targetProds:[21,22,23,73,74] },
  { id:9, nm:'여름 준비 카테고리 세일',              type:'PROMOTION', title:'2026 썸머 컬렉션 얼리버드 세일',
    content:'<p>여름을 준비하세요! 썸머 의류 전품목 30% 할인. 선착순 500명 추가 5% 쿠폰 증정.</p>',
    start:'2026-05-15', end:'2026-07-15', status:'DRAFT', targetProds:[15,16,17,18,32,34] },
  { id:10, nm:'친구 초대 이벤트',                    type:'CAMPAIGN',  title:'친구 초대하고 10,000원 적립금 받자!',
    content:'<p>친구를 초대할 때마다 10,000원 적립금 지급! 친구도 가입 혜택 5,000원 쿠폰 제공.</p>',
    start:'2026-04-01', end:'2026-12-31', status:'ACTIVE', targetProds:[] },
];
newEvents.forEach((e) => {
  const id = mkId('EV', eventSeq++);
  eventIdMap[e.id] = id;
  ins('pm_event',
    ['event_id','site_id','event_nm','event_type_cd','event_title',
     'event_content','start_date','end_date','event_status_cd','use_yn','reg_by','reg_date'],
    [id, SITE_ID, e.nm, e.type, e.title,
     e.content, ts(e.start), ts(e.end), e.status, 'Y', REG_BY, REG_DATE]
  );
});

// ════════════════════════════════════════════════════════════════
// 9. pm_event_benefit — 이벤트 혜택 (전체 10개 이벤트)
// ════════════════════════════════════════════════════════════════
section('9. pm_event_benefit — 이벤트 혜택 (~22건)');
const eventBenefits = [
  // EV1 봄맞이신상품
  { evId:1, nm:'봄 신규회원 15% 추가할인 쿠폰', type:'COUPON', desc:'첫 구매 시 15% 추가할인', val:'15%', cpId:couponIdMap[1], ord:1 },
  { evId:1, nm:'5만원 이상 무료배송', type:'FREE_SHIP', desc:'5만원 이상 구매 시', val:'3000', cpId:null, ord:2 },
  // EV2 VIP전용
  { evId:2, nm:'VIP 전품목 20% 할인', type:'DISCOUNT', desc:'모든 상품 20% 할인', val:'20%', cpId:null, ord:1 },
  { evId:2, nm:'전 상품 무료배송', type:'FREE_SHIP', desc:'배송비 100% 지원', val:'전액', cpId:null, ord:2 },
  { evId:2, nm:'VIP 전용 쿠폰 증정', type:'COUPON', desc:'VIP 전용 10,000원 쿠폰', val:'10000원', cpId:couponIdMap[4], ord:3 },
  // EV3 설날특별
  { evId:3, nm:'의류 최대 50% 할인', type:'DISCOUNT', desc:'의류 카테고리 30~50% 할인', val:'최대50%', cpId:null, ord:1 },
  { evId:3, nm:'봄 시즌 쿠폰', type:'COUPON', desc:'봄맞이 5,000원 할인 쿠폰', val:'5000원', cpId:couponIdMap[2], ord:2 },
  // EV4 여름프리뷰
  { evId:4, nm:'얼리버드 45% 할인', type:'DISCOUNT', desc:'프리뷰 상품 45% 할인', val:'45%', cpId:null, ord:1 },
  { evId:4, nm:'10만원 이상 쿠폰 증정', type:'COUPON', desc:'봄맞이 5,000원 쿠폰', val:'5000원', cpId:couponIdMap[2], ord:2 },
  { evId:4, nm:'30만원 이상 선물 세트', type:'GIFT', desc:'VIP 업그레이드 신청 + 선물', val:'선물세트', cpId:null, ord:3 },
  // EV5 신규회원
  { evId:5, nm:'신규가입 쿠폰 10,000원', type:'COUPON', desc:'가입 즉시 지급', val:'10000원', cpId:couponIdMap[1], ord:1 },
  { evId:5, nm:'첫 구매 추가 15% 할인', type:'DISCOUNT', desc:'첫 구매 주문 한정', val:'15%', cpId:null, ord:2 },
  { evId:5, nm:'무료배송 쿠폰', type:'FREE_SHIP', desc:'첫 구매 무료배송', val:'3000원', cpId:couponIdMap[12], ord:3 },
  // EV6 브랜드콜라보
  { evId:6, nm:'브랜드별 20~40% 할인', type:'DISCOUNT', desc:'참여 브랜드 상품 할인', val:'최대40%', cpId:null, ord:1 },
  { evId:6, nm:'번들 추가 15% 할인 쿠폰', type:'COUPON', desc:'2개 이상 구매 시', val:'15%', cpId:couponIdMap[6], ord:2 },
  // EV7 리뷰이벤트
  { evId:7, nm:'포토리뷰 적립금 2배', type:'POINT', desc:'포토리뷰 작성 시 2,000원', val:'2000원', cpId:null, ord:1 },
  { evId:7, nm:'우수리뷰 쿠폰 증정', type:'COUPON', desc:'베스트리뷰 선정 시 쿠폰', val:'2000원', cpId:couponIdMap[13], ord:2 },
  // EV8 골든위크
  { evId:8, nm:'골든위크 최대 50% 할인', type:'DISCOUNT', desc:'기간 내 전품목 50% 할인', val:'50%', cpId:null, ord:1 },
  { evId:8, nm:'무료배송 + 쿠폰 증정', type:'FREE_SHIP', desc:'기간 중 모든 주문 무료배송', val:'전액', cpId:null, ord:2 },
  // EV9 썸머컬렉션
  { evId:9, nm:'얼리버드 30% 할인', type:'DISCOUNT', desc:'썸머 카테고리 30% 할인', val:'30%', cpId:null, ord:1 },
  { evId:9, nm:'선착순 5% 추가 쿠폰', type:'COUPON', desc:'선착순 500명 추가 5% 쿠폰', val:'5%', cpId:couponIdMap[3], ord:2 },
  // EV10 친구초대
  { evId:10, nm:'초대인 10,000원 적립금', type:'POINT', desc:'친구 초대 성공 시 지급', val:'10000원', cpId:null, ord:1 },
  { evId:10, nm:'피초대인 신규가입 쿠폰', type:'COUPON', desc:'초대받은 신규 회원', val:'5000원', cpId:couponIdMap[12], ord:2 },
];
eventBenefits.forEach((b) => {
  ins('pm_event_benefit',
    ['benefit_id','site_id','event_id','benefit_nm','benefit_type_cd',
     'condition_desc','benefit_value','coupon_id','sort_ord','reg_by','reg_date'],
    [mkId('EVBT', eBenSeq++), SITE_ID, eventIdMap[b.evId],
     b.nm, b.type, b.desc, b.val, dv(b.cpId), b.ord, REG_BY, REG_DATE]
  );
});

// ════════════════════════════════════════════════════════════════
// 10. pm_event_item — 이벤트 적용 대상 상품
// ════════════════════════════════════════════════════════════════
section('10. pm_event_item — 이벤트 대상 상품 (~30건)');
const evTargetMap = {
  1: [1,2,3],       // 봄맞이
  2: [6,9,14],      // VIP
  3: [3,6,7],       // 설날
  4: [4,5,11],      // 여름프리뷰
  5: [1,2,5,8],     // 신규회원
  6: [2,6,9,12],    // 브랜드콜라보
  7: [1,2,3],       // 리뷰이벤트 (from newEvents[0].targetProds)
  8: [21,22,23,73,74], // 골든위크
  9: [15,16,17,18,32,34], // 썸머컬렉션
  // EV10 친구초대는 특정 상품 없음
};
Object.entries(evTargetMap).forEach(([evId, prods]) => {
  prods.forEach((pid, si) => {
    ins('pm_event_item',
      ['event_item_id','event_id','site_id','target_type_cd','target_id','sort_no','reg_by','reg_date'],
      [mkId('EVIT', eItemSeq++), eventIdMap[parseInt(evId)], SITE_ID,
       'PRODUCT', apiProdIdMap[pid], si + 1, REG_BY, REG_DATE]
    );
  });
});

// ════════════════════════════════════════════════════════════════
// 11. pm_gift — 사은품 (D.giftList 5건)
// ════════════════════════════════════════════════════════════════
section('11. pm_gift — 사은품 5건');
const giftTypeMap = { '구매조건':'ORDER_AMT', '금액조건':'ORDER_AMT', '수량조건':'ORDER_QTY', '무조건':'FREE' };
const giftStMap   = { '활성':'ACTIVE', '비활성':'INACTIVE' };
const giftIds     = {};
D.giftList.forEach((g) => {
  const id = mkId('GT', giftSeq++);
  giftIds[g.giftId] = id;
  ins('pm_gift',
    ['gift_id','site_id','gift_nm','gift_type_cd','gift_stock',
     'gift_desc','start_date','end_date','min_order_amt','min_order_qty',
     'gift_status_cd','use_yn','reg_by','reg_date'],
    [id, SITE_ID, g.giftNm,
     giftTypeMap[g.giftType] || 'ORDER_AMT', g.stock || 0,
     g.remark || null, ts(g.startDate), ts(g.endDate),
     g.giftType !== '수량조건' ? (g.condVal || 0) : 0,
     g.giftType === '수량조건' ? (g.condVal || 0) : null,
     giftStMap[g.giftStatus] || 'ACTIVE', 'Y', REG_BY, REG_DATE]
  );
});

// ════════════════════════════════════════════════════════════════
// 12. pm_gift_cond — 사은품 지급 조건
// ════════════════════════════════════════════════════════════════
section('12. pm_gift_cond — 사은품 지급 조건 (~8건)');
[
  { giftId:1, type:'ORDER_AMT', minAmt:50000 },
  { giftId:2, type:'ORDER_AMT', minAmt:100000 },
  { giftId:3, type:'ORDER_QTY', minAmt:0 },
  { giftId:4, type:'ORDER_AMT', minAmt:200000 },
  { giftId:5, type:'ORDER_AMT', minAmt:0 },
].forEach((g) => {
  ins('pm_gift_cond',
    ['gift_cond_id','gift_id','site_id','cond_type_cd','min_order_amt','reg_by','reg_date'],
    [mkId('GCND', gCondSeq++), giftIds[g.giftId], SITE_ID, g.type, g.minAmt, REG_BY, REG_DATE]
  );
});

// ════════════════════════════════════════════════════════════════
// 13. pm_gift_issue — 사은품 발급 (~15건)
// ════════════════════════════════════════════════════════════════
section('13. pm_gift_issue — 사은품 발급 (~15건)');
const giftIssueData = [
  { giftId:1, mbId:1, orderId:'ORD-2026-015', status:'DELIVERED', date:'2026-02-23 12:00:00' },
  { giftId:1, mbId:1, orderId:'ORD-2026-018', status:'DELIVERED', date:'2026-03-11 10:00:00' },
  { giftId:1, mbId:8, orderId:'ORD-2026-014', status:'DELIVERED', date:'2026-02-19 09:00:00' },
  { giftId:1, mbId:3, orderId:'ORD-2026-016', status:'ISSUED',    date:'2026-02-28 09:00:00' },
  { giftId:2, mbId:1, orderId:'ORD-2026-024', status:'ISSUED',    date:'2026-04-05 09:00:00' },
  { giftId:2, mbId:8, orderId:'ORD-2026-015', status:'DELIVERED', date:'2026-02-23 12:00:00' },
  { giftId:3, mbId:8, orderId:'ORD-2026-015', status:'DELIVERED', date:'2026-02-23 12:00:00' },
  { giftId:3, mbId:1, orderId:'ORD-2026-024', status:'ISSUED',    date:'2026-04-05 09:00:00' },
  { giftId:4, mbId:8, orderId:'ORD-2026-015', status:'DELIVERED', date:'2026-02-23 12:00:00' },
  { giftId:1, mbId:6, orderId:'ORD-2026-017', status:'DELIVERED', date:'2026-03-08 10:00:00' },
  { giftId:1, mbId:3, orderId:'ORD-2026-022', status:'CANCELLED', date:'2026-03-29 09:00:00', memo:'반품으로 취소' },
  { giftId:2, mbId:3, orderId:'ORD-2026-022', status:'CANCELLED', date:'2026-03-29 09:00:00', memo:'반품으로 취소' },
];
giftIssueData.forEach((g) => {
  ins('pm_gift_issue',
    ['gift_issue_id','gift_id','site_id','member_id','order_id',
     'issue_date','gift_issue_status_cd','gift_issue_memo','reg_by','reg_date'],
    [mkId('GFIS', gIssueSeq++), giftIds[g.giftId], SITE_ID,
     memberIdMap[g.mbId], g.orderId, g.date, g.status,
     dv(g.memo), REG_BY, REG_DATE]
  );
});

// ════════════════════════════════════════════════════════════════
// 14. pm_plan — 기획전 (D.plans 8건)
// ════════════════════════════════════════════════════════════════
section('14. pm_plan — 기획전 8건');
const planTypeMap = (theme) => {
  if (['봄맞이','여름','신상','겨울'].includes(theme)) return 'SEASON';
  if (['브랜드'].includes(theme)) return 'BRAND';
  if (['콜라보','협업'].includes(theme)) return 'COLLAB';
  return 'THEME';
};
const planStMap  = { '활성':'ACTIVE', '예정':'DRAFT', '종료':'ENDED' };
const planIds    = {};
D.plans.forEach((p) => {
  const id = mkId('PL', planSeq++);
  planIds[p.planId] = id;
  ins('pm_plan',
    ['plan_id','site_id','plan_nm','plan_title','plan_type_cd',
     'plan_desc','thumbnail_url','start_date','end_date',
     'plan_status_cd','sort_ord','use_yn','reg_by','reg_date'],
    [id, SITE_ID, p.planNm, p.planNm, planTypeMap(p.theme),
     p.theme || null, p.thumbUrl || null,
     ts(p.startDate), ts(p.endDate),
     planStMap[p.status] || 'DRAFT',
     p.planId, 'Y', REG_BY, REG_DATE]
  );
});

// ════════════════════════════════════════════════════════════════
// 15. pm_plan_item — 기획전 상품 (~35건)
// ════════════════════════════════════════════════════════════════
section('15. pm_plan_item — 기획전 상품 (~35건)');
D.plans.forEach((p) => {
  (p.productIds || []).forEach((pid, si) => {
    // adminData의 productId와 api productId는 동일하게 1-based
    const prodDbId = apiProdIdMap[pid] || null;
    if (!prodDbId) return;
    ins('pm_plan_item',
      ['plan_item_id','plan_id','site_id','prod_id','sort_ord','reg_by','reg_date'],
      [mkId('PLIT', pItemSeq++), planIds[p.planId], SITE_ID, prodDbId, si + 1, REG_BY, REG_DATE]
    );
  });
});

// ════════════════════════════════════════════════════════════════
// 16. pm_save — 마일리지 원장 (~60건)
// ════════════════════════════════════════════════════════════════
section('16. pm_save — 마일리지 원장 (~60건)');
// 회원별 잔액 추적
const saveBalance = {};
D.members.forEach((m) => { saveBalance[m.userId] = 0; });

const addSave = (mbId, type, amt, refType, refId, expDate, memo) => {
  saveBalance[mbId] = (saveBalance[mbId] || 0) + amt;
  ins('pm_save',
    ['save_id','site_id','member_id','save_type_cd','save_amt','balance_amt',
     'ref_type_cd','ref_id','expire_date','save_memo','reg_by','reg_date'],
    [mkId('SV', saveSeq++), SITE_ID, memberIdMap[mbId], type, amt, saveBalance[mbId],
     dv(refType), dv(refId), dv(expDate), dv(memo), REG_BY, REG_DATE]
  );
};

// 회원가입 축하 적립금 (각 5,000원, 730일 유효)
D.members.forEach((m) => {
  addSave(m.userId, 'EARN', 5000, 'EVENT', 'EV000005',
    '2028-12-31 00:00:00', '신규 회원가입 축하 적립금');
});

// 구매 적립금 (완료된 주문 기준, 주문금액의 1%)
const earnOrders = [
  { mbId:1, orderId:'ORD-2026-018', amt:Math.round(59800*0.01), date:'2026-03-10' },
  { mbId:1, orderId:'ORD-2026-021', amt:Math.round(55000*0.01), date:'2026-03-22' },
  { mbId:8, orderId:'ORD-2026-014', amt:Math.round(55000*0.01), date:'2026-02-18' },
  { mbId:8, orderId:'ORD-2026-015', amt:Math.round(108900*0.01), date:'2026-02-22' },
  { mbId:3, orderId:'ORD-2026-016', amt:Math.round(59900*0.01), date:'2026-02-27' },
  { mbId:4, orderId:'ORD-2026-020', amt:Math.round(45000*0.01), date:'2026-03-18' },
  { mbId:6, orderId:'ORD-2026-017', amt:Math.round(49000*0.01), date:'2026-03-07' },
  { mbId:7, orderId:'ORD-2026-012', amt:Math.round(94900*0.01), date:'2026-02-10' },
  { mbId:2, orderId:'ORD-2026-023', amt:Math.round(104000*0.01), date:'2026-04-02' },
  { mbId:1, orderId:'ORD-2026-024', amt:Math.round(238800*0.01), date:'2026-04-04' },
];
earnOrders.forEach((o) => {
  addSave(o.mbId, 'EARN', o.amt, 'ORDER', o.orderId,
    '2027-03-31 00:00:00', `구매 적립금 (${o.orderId})`);
});

// 리뷰 작성 적립금 (1,000원)
[1,3,6,8].forEach((mbId) => {
  addSave(mbId, 'EARN', 1000, 'EVENT', null,
    '2027-04-20 00:00:00', '리뷰 작성 감사 적립금');
});

// 이벤트 참여 적립금
addSave(1, 'EARN', 10000, 'EVENT', 'EV000010', '2027-04-20 00:00:00', '친구 초대 이벤트 적립금');
addSave(8, 'EARN', 5000, 'EVENT', 'EV000001',  '2027-03-31 00:00:00', '봄맞이 이벤트 참여 적립금');

// 적립금 사용 (주문 결제 차감)
const useOrders = [
  { mbId:1, orderId:'ORD-2026-021', amt:3000 },
  { mbId:8, orderId:'ORD-2026-014', amt:1000 },
  { mbId:3, orderId:'ORD-2026-022', amt:500  },
];
useOrders.forEach((o) => {
  addSave(o.mbId, 'USE', -o.amt, 'ORDER', o.orderId, null, `적립금 사용 (${o.orderId})`);
});

// 만료 처리 (일부 회원)
addSave(5, 'EXPIRE', -3000, null, null, null, '유효기간 만료 적립금');
saveBalance[5] = Math.max(0, saveBalance[5]);

// ════════════════════════════════════════════════════════════════
// 17. pm_save_issue — 적립금 지급 이력 (~35건)
// ════════════════════════════════════════════════════════════════
section('17. pm_save_issue — 적립금 지급 이력 (~35건)');
// 회원가입 축하 지급
D.members.forEach((m) => {
  ins('pm_save_issue',
    ['save_issue_id','site_id','member_id','save_issue_type_cd',
     'save_amt','save_rate','ref_type_cd','ref_id',
     'expire_date','issue_status_cd','save_memo','reg_by','reg_date'],
    [mkId('SVIS', sIssueSeq++), SITE_ID, memberIdMap[m.userId], 'EVENT',
     5000, null, 'EVENT', 'EV000005',
     '2028-12-31 00:00:00', 'CONFIRMED', '신규 회원가입 축하 적립금', REG_BY,
     m.joinDate + ' 00:00:00']
  );
});
// 구매 적립금 지급 (1%)
earnOrders.forEach((o) => {
  ins('pm_save_issue',
    ['save_issue_id','site_id','member_id','save_issue_type_cd',
     'save_amt','save_rate','ref_type_cd','ref_id','order_id',
     'expire_date','issue_status_cd','save_memo','reg_by','reg_date'],
    [mkId('SVIS', sIssueSeq++), SITE_ID, memberIdMap[o.mbId], 'ORDER',
     o.amt, 1.00, 'ORDER', o.orderId, o.orderId,
     '2027-03-31 00:00:00', 'CONFIRMED',
     `구매 적립금 1% (${o.orderId})`, REG_BY, REG_DATE]
  );
});
// 리뷰 적립금 지급
[1,3,6,8].forEach((mbId) => {
  ins('pm_save_issue',
    ['save_issue_id','site_id','member_id','save_issue_type_cd',
     'save_amt','save_rate','ref_type_cd',
     'expire_date','issue_status_cd','save_memo','reg_by','reg_date'],
    [mkId('SVIS', sIssueSeq++), SITE_ID, memberIdMap[mbId], 'REVIEW',
     1000, null, 'EVENT',
     '2027-04-20 00:00:00', 'CONFIRMED', '리뷰 작성 감사 적립금', REG_BY, REG_DATE]
  );
});
// 이벤트 적립금 지급
[{ mbId:1, ref:'EV000010', amt:10000, memo:'친구 초대 이벤트' },
 { mbId:8, ref:'EV000001', amt:5000,  memo:'봄맞이 이벤트 참여' }].forEach((e) => {
  ins('pm_save_issue',
    ['save_issue_id','site_id','member_id','save_issue_type_cd',
     'save_amt','save_rate','ref_type_cd','ref_id',
     'expire_date','issue_status_cd','save_memo','reg_by','reg_date'],
    [mkId('SVIS', sIssueSeq++), SITE_ID, memberIdMap[e.mbId], 'EVENT',
     e.amt, null, 'EVENT', e.ref,
     '2027-04-20 00:00:00', 'CONFIRMED', e.memo, REG_BY, REG_DATE]
  );
});
// 취소 처리 (반품된 주문 적립금 취소)
ins('pm_save_issue',
  ['save_issue_id','site_id','member_id','save_issue_type_cd',
   'save_amt','save_rate','ref_type_cd','ref_id','order_id',
   'expire_date','issue_status_cd','save_memo','reg_by','reg_date'],
  [mkId('SVIS', sIssueSeq++), SITE_ID, memberIdMap[3], 'ORDER',
   Math.round(79000*0.01), 1.00, 'ORDER', 'ORD-2026-022', 'ORD-2026-022',
   '2027-03-31 00:00:00', 'CANCELED', '반품으로 인한 적립금 취소 (ORD-2026-022)', REG_BY, REG_DATE]
);

// ════════════════════════════════════════════════════════════════
// 18. pm_save_usage — 적립금 사용 이력 (~15건)
// ════════════════════════════════════════════════════════════════
section('18. pm_save_usage — 적립금 사용 이력 (~15건)');
useOrders.forEach((o) => {
  ins('pm_save_usage',
    ['save_usage_id','site_id','member_id','order_id','use_amt','balance_amt','used_date','reg_by','reg_date'],
    [mkId('SVUS', sUsageSeq++), SITE_ID,
     memberIdMap[o.mbId], o.orderId, o.amt,
     saveBalance[o.mbId] + o.amt,  // 사용 전 잔액 근사
     REG_DATE, REG_BY, REG_DATE]
  );
});

// ════════════════════════════════════════════════════════════════
// 19. pm_voucher — 상품권 (D.voucherList 5건)
// ════════════════════════════════════════════════════════════════
section('19. pm_voucher — 상품권 5건');
const voucherStMap = { '활성':'ACTIVE', '비활성':'INACTIVE', '만료':'EXPIRED' };
const voucherIds   = {};
D.voucherList.forEach((v) => {
  const id = mkId('VC', voucherSeq++);
  voucherIds[v.voucherId] = id;
  ins('pm_voucher',
    ['voucher_id','site_id','voucher_nm','voucher_type_cd',
     'voucher_value','min_order_amt','expire_month',
     'voucher_status_cd','voucher_desc','use_yn','reg_by','reg_date'],
    [id, SITE_ID, v.voucherNm, 'AMOUNT',
     v.voucherAmt, 0, 12,
     voucherStMap[v.voucherStatus] || 'ACTIVE',
     v.remark || null, 'Y', REG_BY, REG_DATE]
  );
});

// ════════════════════════════════════════════════════════════════
// 20. pm_voucher_issue — 상품권 발급 이력 (D.voucherList issuedList)
// ════════════════════════════════════════════════════════════════
section('20. pm_voucher_issue — 상품권 발급 이력 (~14건)');
const vIssueStMap = { '정상':'ISSUED', '사용완료':'USED', '만료됨':'EXPIRED', '취소':'CANCELLED' };
D.voucherList.forEach((v) => {
  (v.issuedList || []).forEach((is) => {
    const mbId = memberIdMap[is.memberId] || null;
    // 사용된 건: usedList에서 매핑
    const usedRec = (v.usedList || []).find(u => u.issueNo === is.issueNo);
    ins('pm_voucher_issue',
      ['voucher_issue_id','voucher_id','site_id','member_id','voucher_code',
       'issue_date','expire_date','use_date','order_id','use_amt',
       'voucher_issue_status_cd','reg_by','reg_date'],
      [mkId('VCIS', vIssueSeq++), voucherIds[v.voucherId], SITE_ID, mbId,
       is.issueNo,
       is.issueDate + ' 00:00:00',
       is.expiryDate + ' 00:00:00',
       usedRec ? usedRec.useDate + ' 00:00:00' : null,
       usedRec ? usedRec.orderId : null,
       usedRec ? usedRec.useAmount : null,
       vIssueStMap[is.status] || 'ISSUED',
       REG_BY, REG_DATE]
    );
  });
});

// ════════════════════════════════════════════════════════════════
// 21. pm_cache — 추가 충전금 이력 (CC000200+, 다양한 회원)
// ════════════════════════════════════════════════════════════════
section('21. pm_cache — 추가 충전금 이력 (CC000200+, ~24건)');
const addCache = (mbId, mbNm, type, amt, bal, desc, date) => {
  ins('pm_cache',
    ['cache_id','site_id','member_id','member_nm','cache_type_cd',
     'cache_amt','balance_amt','cache_desc','cache_date','reg_by','reg_date'],
    [mkId('CC', cacheSeq++), SITE_ID, memberIdMap[mbId], mbNm,
     type, amt, bal, desc, date, REG_BY, REG_DATE]
  );
};
// 이영희
addCache(2,'이영희','CHARGE', 20000, 20000, '직접 충전',                  '2026-04-10 10:00:00');
addCache(2,'이영희','USE',    -8000,  12000, 'ORD-2026-023 결제 사용',     '2026-04-02 21:05:00');
addCache(2,'이영희','CHARGE',  5000,  17000, '이벤트 참여 적립',            '2026-03-20 09:00:00');
// 박민준
addCache(3,'박민준','CHARGE', 30000, 30000, '직접 충전',                  '2026-04-01 09:00:00');
addCache(3,'박민준','USE',    -5000,  25000, 'ORD-2026-022 결제 사용',     '2026-03-28 16:44:00');
addCache(3,'박민준','EARN_EVENT',1000, 26000, '리뷰 작성 보상',             '2026-03-10 09:00:00');
// 김수현
addCache(4,'김수현','CHARGE', 10000, 10000, '회원가입 웰컴 충전',          '2026-03-01 15:30:00');
addCache(4,'김수현','USE',    -5000,  5000,  'ORD-2026-020 결제 사용',     '2026-03-18 08:53:00');
// 최지우
addCache(5,'최지우','CHARGE',  5000,  5000, '직접 충전',                  '2025-12-10 11:00:00');
addCache(5,'최지우','EXPIRE', -2000,  3000, '유효기간 만료',               '2026-03-10 00:00:00');
// 정민호
addCache(6,'정민호','CHARGE', 50000, 50000, '직접 충전',                  '2026-04-05 10:00:00');
addCache(6,'정민호','USE',   -10000, 40000, 'ORD-2026-017 결제 사용',     '2026-03-07 10:48:00');
addCache(6,'정민호','EARN_EVENT',2000, 42000, '이벤트 참여 적립',          '2026-03-15 10:00:00');
// 강예은
addCache(7,'강예은','CHARGE', 15000, 15000, '직접 충전',                  '2026-02-14 13:00:00');
addCache(7,'강예은','USE',    -5000,  10000, 'ORD-2026-012 결제 사용',     '2026-02-10 18:07:00');
// 윤성준 추가
addCache(8,'윤성준','CHARGE',100000,100000, 'VIP 연간 충전',              '2026-01-01 00:00:00');
addCache(8,'윤성준','USE',   -50000,  50000, 'ORD-2026-015 결제 사용',    '2026-02-22 22:14:00');
addCache(8,'윤성준','USE',   -15000,  35000, 'ORD-2026-014 결제 사용',    '2026-02-18 07:59:00');
addCache(8,'윤성준','EARN_EVENT',5000, 40000, '연말 VIP 이벤트 적립',      '2026-01-10 00:00:00');
// 홍길동 추가
addCache(1,'홍길동','CHARGE', 50000, 50000, '직접 충전',                  '2026-04-08 09:00:00');
addCache(1,'홍길동','EARN_EVENT',3000, 53000, '친구 초대 이벤트 적립',     '2026-04-10 10:00:00');
addCache(1,'홍길동','USE',    -10000, 43000, 'ORD-2026-024 결제 사용',     '2026-04-04 09:18:00');

// ════════════════════════════════════════════════════════════════
// 출력
// ════════════════════════════════════════════════════════════════
const header = [
  '-- ================================================================',
  '-- pm_* 프로모션 샘플 데이터',
  '-- 생성: generate_sample_sql_pm.js',
  '-- 스키마: shopjoy_2604',
  '-- 전제: generate_sample_sql_ec.js + generate_sample_sql_front.js 완료',
  '-- ================================================================',
  'SET search_path TO shopjoy_2604;',
  '',
].join('\n');

const output = header + lines.join('\n') + '\n';
const outFile = path.resolve(__dirname, 'sample_data_pm.sql');
fs.writeFileSync(outFile, output, 'utf8');

const insertCnt = lines.filter(l => l.startsWith('INSERT')).length;
console.log(`완료: INSERT ${insertCnt}건 → ${outFile}`);
