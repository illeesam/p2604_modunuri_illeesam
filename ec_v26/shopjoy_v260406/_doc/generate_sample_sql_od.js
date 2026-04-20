'use strict';
/**
 * generate_sample_sql_od.js
 * 주문 도메인 샘플 데이터 생성
 *
 * 생성 테이블:
 *   od_cart, od_pay, od_pay_method,
 *   od_dliv (신규분), od_dliv_item,
 *   od_claim_item,
 *   od_order_item_discnt, od_order_discnt,
 *   od_refund, od_refund_method
 *
 * 전제:
 *   - od_order      : generate_sample_sql_front.js 에서 ORD-2026-001~025 삽입 완료
 *   - od_order_item : OI000001~OI000029 삽입 완료 (front.js)
 *   - od_claim      : CLM-2026-XXX 삽입 완료 (ec.js)
 *   - od_dliv       : DLIV-016,017,020~025 삽입 완료 (ec.js)
 *   - pm_coupon     : CO000001~CO000015 존재
 *   - pm_coupon_issue: CI000001~CI000012 존재 (front.js)
 */

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────
const mkId  = (p, n) => p + String(n).padStart(6, '0');
const SITE  = 'SITE000001';
const REG   = 'SYSTEM';
const RD    = "'2026-04-20'::timestamp";

const lines = [];
const sec   = (t) => lines.push('', `-- ── ${t} ──`);

function ins(tbl, cols, vals) {
  const vStr = vals.map(v => {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return v;
    const s = String(v);
    if (s === 'NULL' || s.endsWith('::timestamp') || s.endsWith('::date')) return s;
    return `'${s.replace(/'/g, "''")}'`;
  }).join(', ');
  lines.push(
    `INSERT INTO shopjoy_2604.${tbl} (${cols.join(', ')}) VALUES (${vStr}) ON CONFLICT DO NOTHING;`
  );
}

const ts  = (s) => s ? `'${s}'::timestamp` : 'NULL';
const dt  = (s) => s ? `'${s}'::date`      : 'NULL';

// ─────────────────────────────────────────────
// 기준 데이터
// ─────────────────────────────────────────────
const MB = {
  1: 'MB000001', 2: 'MB000002', 3: 'MB000003', 4: 'MB000004',
  5: 'MB000005', 6: 'MB000006', 7: 'MB000007', 8: 'MB000008',
};
const NM = {
  1: '홍길동', 2: '이영희', 3: '박민준', 4: '김수현',
  5: '최지우', 6: '정민호', 7: '강예은', 8: '윤성준',
};
const PH = {
  1: '010-1111-1111', 2: '010-2222-2222', 3: '010-3333-3333', 4: '010-4444-4444',
  5: '010-5555-5555', 6: '010-6666-6666', 7: '010-7777-7777', 8: '010-8888-8888',
};
const ADDR = {
  1: { zip: '06134', addr: '서울 강남구 테헤란로 123', dtl: '102동 1201호' },
  2: { zip: '48058', addr: '부산 해운대구 센텀로 45', dtl: '501호' },
  3: { zip: '34136', addr: '대전 유성구 대학로 78', dtl: 'B동 304호' },
  4: { zip: '21565', addr: '인천 남동구 논현로 89', dtl: '3층' },
  5: { zip: '42000', addr: '대구 수성구 범어로 34', dtl: '204호' },
  6: { zip: '04054', addr: '서울 마포구 홍대입구로 56', dtl: '301호' },
  7: { zip: '16293', addr: '수원 팔달구 매산로 67', dtl: '5층 502호' },
  8: { zip: '61960', addr: '광주 서구 상무대로 89', dtl: '401호' },
};

// OI000001~29 → 주문 아이템 상세 (api/my/orders.json 기준)
const OI = {
  'OI000001': { orderId:'ORD-2026-025', prodId:'PD000001', prodNm:'오버사이즈 코튼 티셔츠', opt:'화이트/M',       unitPrice:26900,  qty:1 },
  'OI000002': { orderId:'ORD-2026-024', prodId:'PD000002', prodNm:'슬림핏 데님 진',         opt:'인디고/28',      unitPrice:58400,  qty:2 },
  'OI000003': { orderId:'ORD-2026-024', prodId:'PD000009', prodNm:'울 블렌드 롱코트',       opt:'블랙/M',         unitPrice:119000, qty:1 },
  'OI000004': { orderId:'ORD-2026-023', prodId:'PD000004', prodNm:'케이블 니트 스웨터',     opt:'아이보리/M',     unitPrice:46000,  qty:1 },
  'OI000005': { orderId:'ORD-2026-023', prodId:'PD000005', prodNm:'카고 와이드 팬츠',       opt:'카키/M',         unitPrice:55000,  qty:1 },
  'OI000006': { orderId:'ORD-2026-022', prodId:'PD000006', prodNm:'플로럴 미디 드레스',     opt:'블루플로럴/M',   unitPrice:79000,  qty:1 },
  'OI000007': { orderId:'ORD-2026-021', prodId:'PD000005', prodNm:'카고 와이드 팬츠',       opt:'카키/L',         unitPrice:55000,  qty:1 },
  'OI000008': { orderId:'ORD-2026-020', prodId:'PD000003', prodNm:'스트라이프 린넨 셔츠',   opt:'화이트스트라이프/M', unitPrice:45000, qty:1 },
  'OI000009': { orderId:'ORD-2026-019', prodId:'PD000007', prodNm:'퀼티드 숏 점퍼',         opt:'블랙/M',         unitPrice:89000,  qty:1 },
  'OI000010': { orderId:'ORD-2026-018', prodId:'PD000001', prodNm:'오버사이즈 코튼 티셔츠', opt:'블랙/L',         unitPrice:29900,  qty:2 },
  'OI000011': { orderId:'ORD-2026-017', prodId:'PD000004', prodNm:'케이블 니트 스웨터',     opt:'그레이/L',       unitPrice:49000,  qty:1 },
  'OI000012': { orderId:'ORD-2026-016', prodId:'PD000002', prodNm:'슬림핏 데님 진',         opt:'인디고/30',      unitPrice:59900,  qty:1 },
  'OI000013': { orderId:'ORD-2026-015', prodId:'PD000006', prodNm:'플로럴 미디 드레스',     opt:'핑크플로럴/M',   unitPrice:79000,  qty:1 },
  'OI000014': { orderId:'ORD-2026-015', prodId:'PD000001', prodNm:'오버사이즈 코튼 티셔츠', opt:'화이트/S',       unitPrice:29900,  qty:1 },
  'OI000015': { orderId:'ORD-2026-014', prodId:'PD000005', prodNm:'카고 와이드 팬츠',       opt:'블랙/S',         unitPrice:55000,  qty:1 },
  'OI000016': { orderId:'ORD-2026-013', prodId:'PD000001', prodNm:'오버사이즈 코튼 티셔츠', opt:'화이트/M',       unitPrice:29900,  qty:1 },
  'OI000017': { orderId:'ORD-2026-012', prodId:'PD000002', prodNm:'슬림핏 데님 진',         opt:'인디고/30',      unitPrice:59900,  qty:1 },
  'OI000018': { orderId:'ORD-2026-012', prodId:'PD000013', prodNm:'체크 플란넬 셔츠',       opt:'레드체크/M',     unitPrice:35000,  qty:1 },
  'OI000019': { orderId:'ORD-2026-011', prodId:'PD000009', prodNm:'울 블렌드 롱코트',       opt:'카멜/M',         unitPrice:119000, qty:1 },
  'OI000020': { orderId:'ORD-2026-010', prodId:'PD000015', prodNm:'레더룩 라이더 재킷',     opt:'블랙/M',         unitPrice:139000, qty:1 },
  'OI000021': { orderId:'ORD-2026-009', prodId:'PD000007', prodNm:'퀼티드 숏 점퍼',         opt:'네이비/M',       unitPrice:89000,  qty:1 },
  'OI000022': { orderId:'ORD-2026-008', prodId:'PD000012', prodNm:'리넨 오버핏 블레이저',   opt:'베이지/M',       unitPrice:95000,  qty:1 },
  'OI000023': { orderId:'ORD-2026-007', prodId:'PD000006', prodNm:'플로럴 미디 드레스',     opt:'옐로우플로럴/S', unitPrice:79000,  qty:1 },
  'OI000024': { orderId:'ORD-2026-006', prodId:'PD000008', prodNm:'후드 집업 스웨트셔츠',   opt:'그레이/M',       unitPrice:69000,  qty:1 },
  'OI000025': { orderId:'ORD-2026-005', prodId:'PD000010', prodNm:'맥시 롱 원피스',         opt:'화이트/S',       unitPrice:88000,  qty:1 },
  'OI000026': { orderId:'ORD-2026-004', prodId:'PD000004', prodNm:'케이블 니트 스웨터',     opt:'핑크/M',         unitPrice:49000,  qty:1 },
  'OI000027': { orderId:'ORD-2026-003', prodId:'PD000011', prodNm:'조거 스웻 팬츠',         opt:'그레이/M',       unitPrice:38000,  qty:1 },
  'OI000028': { orderId:'ORD-2026-002', prodId:'PD000013', prodNm:'체크 플란넬 셔츠',       opt:'블루체크/L',     unitPrice:52000,  qty:1 },
  'OI000029': { orderId:'ORD-2026-001', prodId:'PD000003', prodNm:'스트라이프 린넨 셔츠',   opt:'블루스트라이프/M', unitPrice:45000, qty:1 },
};

// 주문별 order_item 목록
const ORDER_ITEMS = {};
Object.entries(OI).forEach(([oiId, v]) => {
  if (!ORDER_ITEMS[v.orderId]) ORDER_ITEMS[v.orderId] = [];
  ORDER_ITEMS[v.orderId].push(oiId);
});

// 주문 정의 (25건)
const ORDERS = [
  { id:'ORD-2026-025', uid:1, dt:'2026-04-05 14:32:00', status:'PENDING',   pay:'KAKAO',         total:26900, ship:3000, payAmt:29900, hasDliv:false },
  { id:'ORD-2026-024', uid:1, dt:'2026-04-04 09:18:00', status:'PAID',      pay:'BANK_TRANSFER',  total:238800,ship:0,   payAmt:238800,hasDliv:false },
  { id:'ORD-2026-023', uid:2, dt:'2026-04-02 21:05:00', status:'PREPARING', pay:'KAKAO',          total:101000,ship:3000,payAmt:104000,hasDliv:true, dliv:{status:'READY'} },
  { id:'ORD-2026-022', uid:3, dt:'2026-03-28 16:44:00', status:'SHIPPED',   pay:'SAVE',           total:79000, ship:3000,payAmt:82000, hasDliv:true, dliv:{status:'IN_TRANSIT', courier:'LOTTE',  trk:'987654321098', shipDt:'2026-03-30 09:00:00'} },
  { id:'ORD-2026-021', uid:1, dt:'2026-03-22 11:27:00', status:'COMPLT',    pay:'BANK_TRANSFER',  total:55000, ship:3000,payAmt:58000, hasDliv:true, dliv:{status:'DELIVERED', courier:'HANJIN', trk:'456789012345', shipDt:'2026-03-24 10:00:00', delivDt:'2026-03-26 14:00:00'} },
  { id:'ORD-2026-020', uid:4, dt:'2026-03-18 08:53:00', status:'COMPLT',    pay:'TOSS',           total:45000, ship:3000,payAmt:48000, hasDliv:true, dliv:{status:'DELIVERED', courier:'CJ',     trk:'321098765432', shipDt:'2026-03-20 11:00:00', delivDt:'2026-03-22 15:00:00'} },
  { id:'ORD-2026-019', uid:2, dt:'2026-03-14 19:01:00', status:'CANCELLED', pay:'BANK_TRANSFER',  total:89000, ship:3000,payAmt:92000, hasDliv:false },
  { id:'ORD-2026-018', uid:1, dt:'2026-03-10 13:22:00', status:'COMPLT',    pay:'BANK_TRANSFER',  total:59800, ship:0,   payAmt:59800, hasDliv:true, dliv:{status:'DELIVERED', courier:'CJ',     trk:'112233445566', shipDt:'2026-03-12 09:00:00', delivDt:'2026-03-14 13:00:00'} },
  { id:'ORD-2026-017', uid:6, dt:'2026-03-07 10:48:00', status:'COMPLT',    pay:'TOSS',           total:49000, ship:3000,payAmt:52000, hasDliv:true, dliv:{status:'DELIVERED', courier:'HANJIN', trk:'234567890123', shipDt:'2026-03-09 10:00:00', delivDt:'2026-03-11 16:00:00'} },
  { id:'ORD-2026-016', uid:3, dt:'2026-02-27 15:36:00', status:'COMPLT',    pay:'BANK_TRANSFER',  total:59900, ship:3000,payAmt:62900, hasDliv:true, dliv:{status:'DELIVERED', courier:'CJ',     trk:'789012345678', shipDt:'2026-03-01 11:00:00', delivDt:'2026-03-03 14:00:00'} },
  { id:'ORD-2026-015', uid:8, dt:'2026-02-22 22:14:00', status:'COMPLT',    pay:'TOSS',           total:108900,ship:0,   payAmt:108900,hasDliv:true, dliv:{status:'DELIVERED', courier:'CJ',     trk:'432109876543', shipDt:'2026-02-24 09:00:00', delivDt:'2026-02-26 14:00:00'} },
  { id:'ORD-2026-014', uid:8, dt:'2026-02-18 07:59:00', status:'COMPLT',    pay:'BANK_TRANSFER',  total:55000, ship:3000,payAmt:58000, hasDliv:true, dliv:{status:'DELIVERED', courier:'LOTTE',  trk:'567890123456', shipDt:'2026-02-20 10:00:00', delivDt:'2026-02-22 15:00:00'} },
  { id:'ORD-2026-013', uid:5, dt:'2026-02-14 12:33:00', status:'PENDING',   pay:'BANK_TRANSFER',  total:29900, ship:3000,payAmt:32900, hasDliv:false },
  { id:'ORD-2026-012', uid:7, dt:'2026-02-10 18:07:00', status:'PAID',      pay:'BANK_TRANSFER',  total:94900, ship:0,   payAmt:94900, hasDliv:false },
  { id:'ORD-2026-011', uid:1, dt:'2026-02-05 09:41:00', status:'CANCELLED', pay:'BANK_TRANSFER',  total:119000,ship:3000,payAmt:122000,hasDliv:false },
  { id:'ORD-2026-010', uid:5, dt:'2026-03-08 14:22:00', status:'COMPLT',    pay:'TOSS',           total:139000,ship:3000,payAmt:142000,hasDliv:true, dliv:{status:'DELIVERED', courier:'CJ',     trk:'678901234567', shipDt:'2026-03-10 09:00:00', delivDt:'2026-03-12 16:00:00'} },
  { id:'ORD-2026-009', uid:1, dt:'2026-03-05 11:32:00', status:'DELIVERED', pay:'BANK_TRANSFER',  total:89000, ship:3000,payAmt:92000, hasDliv:true, dliv:{status:'DELIVERED', courier:'POST',   trk:'345678901234', shipDt:'2026-03-07 10:00:00', delivDt:'2026-03-09 14:00:00'} },
  { id:'ORD-2026-008', uid:6, dt:'2026-03-01 09:15:00', status:'DELIVERED', pay:'TOSS',           total:95000, ship:3000,payAmt:98000, hasDliv:true, dliv:{status:'DELIVERED', courier:'HANJIN', trk:'223344556677', shipDt:'2026-03-03 11:00:00', delivDt:'2026-03-05 15:00:00'} },
  { id:'ORD-2026-007', uid:3, dt:'2026-02-25 16:44:00', status:'DELIVERED', pay:'KAKAO',          total:79000, ship:3000,payAmt:82000, hasDliv:true, dliv:{status:'DELIVERED', courier:'CJ',     trk:'112233445566', shipDt:'2026-02-27 10:00:00', delivDt:'2026-03-01 13:00:00'} },
  { id:'ORD-2026-006', uid:1, dt:'2026-02-20 18:33:00', status:'DELIVERED', pay:'BANK_TRANSFER',  total:69000, ship:3000,payAmt:72000, hasDliv:true, dliv:{status:'DELIVERED', courier:'LOGEN',  trk:'890123456789', shipDt:'2026-02-22 09:00:00', delivDt:'2026-02-24 14:00:00'} },
  { id:'ORD-2026-005', uid:8, dt:'2026-02-15 10:05:00', status:'RETURNED',  pay:'TOSS',           total:88000, ship:3000,payAmt:91000, hasDliv:true, dliv:{status:'DELIVERED', courier:'CJ',     trk:'901234567890', shipDt:'2026-02-17 11:00:00', delivDt:'2026-02-19 16:00:00'} },
  { id:'ORD-2026-004', uid:2, dt:'2026-02-10 13:22:00', status:'PREPARING', pay:'KAKAO',          total:49000, ship:3000,payAmt:52000, hasDliv:true, dliv:{status:'READY'} },
  { id:'ORD-2026-003', uid:4, dt:'2026-02-05 09:18:00', status:'COMPLT',    pay:'TOSS',           total:38000, ship:3000,payAmt:41000, hasDliv:true, dliv:{status:'DELIVERED', courier:'CJ',     trk:'012345678901', shipDt:'2026-02-07 09:00:00', delivDt:'2026-02-09 14:00:00'} },
  { id:'ORD-2026-002', uid:6, dt:'2026-02-01 15:08:00', status:'COMPLT',    pay:'KAKAO',          total:52000, ship:3000,payAmt:55000, hasDliv:true, dliv:{status:'DELIVERED', courier:'LOTTE',  trk:'543210987654', shipDt:'2026-02-03 10:00:00', delivDt:'2026-02-05 15:00:00'} },
  { id:'ORD-2026-001', uid:1, dt:'2026-01-15 12:00:00', status:'COMPLT',    pay:'TOSS',           total:45000, ship:3000,payAmt:48000, hasDliv:true, dliv:{status:'DELIVERED', courier:'CJ',     trk:'654321098765', shipDt:'2026-01-17 10:00:00', delivDt:'2026-01-19 14:00:00'} },
];

// 클레임 정의 (ec.js 삽입 완료된 클레임 아이템 생성용)
const CLAIMS = [
  { id:'CLM-2026-025', orderId:'ORD-2026-025', type:'EXCHANGE', status:'REQUESTED',  uid:1, oiIds:['OI000001'],             prices:[26900],           qtys:[1] },
  { id:'CLM-2026-024', orderId:'ORD-2026-024', type:'CANCEL',   status:'REQUESTED',  uid:1, oiIds:['OI000002','OI000003'],   prices:[116800,119000],   qtys:[1,1] },
  { id:'CLM-2026-022', orderId:'ORD-2026-022', type:'RETURN',   status:'IN_PICKUP',  uid:3, oiIds:['OI000006'],             prices:[79000],           qtys:[1] },
  { id:'CLM-2026-021', orderId:'ORD-2026-021', type:'RETURN',   status:'COMPLT',     uid:1, oiIds:['OI000007'],             prices:[55000],           qtys:[1], refundAmt:55000 },
  { id:'CLM-2026-013', orderId:'ORD-2026-013', type:'CANCEL',   status:'REQUESTED',  uid:5, oiIds:['OI000016'],             prices:[29900],           qtys:[1] },
  { id:'CLM-2026-012', orderId:'ORD-2026-012', type:'CANCEL',   status:'PROCESSING', uid:7, oiIds:['OI000017','OI000018'],   prices:[59900,35000],     qtys:[1,1] },
  { id:'CLM-2026-011', orderId:'ORD-2026-011', type:'CANCEL',   status:'COMPLT',     uid:1, oiIds:['OI000019'],             prices:[119000],          qtys:[1], refundAmt:119000 },
  { id:'CLM-2026-009', orderId:'ORD-2026-009', type:'RETURN',   status:'REQUESTED',  uid:1, oiIds:['OI000021'],             prices:[89000],           qtys:[1] },
  { id:'CLM-2026-008', orderId:'ORD-2026-008', type:'RETURN',   status:'APPROVED',   uid:6, oiIds:['OI000022'],             prices:[95000],           qtys:[1] },
  { id:'CLM-2026-007', orderId:'ORD-2026-007', type:'RETURN',   status:'PROCESSING', uid:3, oiIds:['OI000023'],             prices:[79000],           qtys:[1] },
  { id:'CLM-2026-006', orderId:'ORD-2026-006', type:'RETURN',   status:'PROCESSING', uid:1, oiIds:['OI000024'],             prices:[69000],           qtys:[1] },
  { id:'CLM-2026-005', orderId:'ORD-2026-005', type:'RETURN',   status:'COMPLT',     uid:8, oiIds:['OI000025'],             prices:[88000],           qtys:[1], refundAmt:88000 },
  { id:'CLM-2026-004', orderId:'ORD-2026-004', type:'EXCHANGE', status:'REQUESTED',  uid:2, oiIds:['OI000026'],             prices:[49000],           qtys:[1] },
  { id:'CLM-2026-003', orderId:'ORD-2026-003', type:'EXCHANGE', status:'APPROVED',   uid:4, oiIds:['OI000027'],             prices:[38000],           qtys:[1] },
  { id:'CLM-2026-002', orderId:'ORD-2026-002', type:'EXCHANGE', status:'COMPLT',     uid:6, oiIds:['OI000028'],             prices:[52000],           qtys:[1] },
  { id:'CLM-2026-001', orderId:'ORD-2026-001', type:'EXCHANGE', status:'COMPLT',     uid:1, oiIds:['OI000029'],             prices:[45000],           qtys:[1] },
];

// ─────────────────────────────────────────────
// 1. od_pay_method — 회원별 저장 결제수단
// ─────────────────────────────────────────────
sec('1. od_pay_method — 회원별 저장 결제수단');
const payMethods = [
  { n:1,  uid:1, type:'TOSS',         nm:'토스페이먼츠',   alias:'주 결제수단', main:'Y' },
  { n:2,  uid:1, type:'BANK_TRANSFER',nm:'국민은행',       alias:'무통장 입금', main:'N' },
  { n:3,  uid:2, type:'KAKAO',        nm:'카카오페이',     alias:'카카오페이', main:'Y' },
  { n:4,  uid:3, type:'BANK_TRANSFER',nm:'신한은행',       alias:'신한 무통장', main:'Y' },
  { n:5,  uid:4, type:'TOSS',         nm:'토스페이먼츠',   alias:'토스',       main:'Y' },
  { n:6,  uid:5, type:'TOSS',         nm:'토스페이먼츠',   alias:'주 카드',    main:'Y' },
  { n:7,  uid:6, type:'KAKAO',        nm:'카카오페이',     alias:'카카오',     main:'Y' },
  { n:8,  uid:6, type:'TOSS',         nm:'토스페이먼츠',   alias:'토스 보조',  main:'N' },
  { n:9,  uid:7, type:'BANK_TRANSFER',nm:'우리은행',       alias:'우리 무통장',main:'Y' },
  { n:10, uid:8, type:'TOSS',         nm:'토스페이먼츠',   alias:'토스',       main:'Y' },
  { n:11, uid:8, type:'NAVER',        nm:'네이버페이',     alias:'네이버',     main:'N' },
];
payMethods.forEach(m => {
  ins('od_pay_method',
    ['pay_method_id','member_id','pay_method_type_cd','pay_method_nm',
     'pay_method_alias','main_method_yn','reg_by','reg_date'],
    [mkId('PM', m.n), MB[m.uid], m.type, m.nm, m.alias, m.main, REG, RD]
  );
});

// ─────────────────────────────────────────────
// 2. od_cart — 장바구니 (회원별 현재 담긴 상품)
// ─────────────────────────────────────────────
sec('2. od_cart — 회원별 장바구니');
const carts = [
  { n:1,  uid:1, prodId:'PD000051', unitPrice:39000,  qty:1, checked:'Y' },
  { n:2,  uid:1, prodId:'PD000063', unitPrice:55000,  qty:2, checked:'Y' },
  { n:3,  uid:2, prodId:'PD000074', unitPrice:85000,  qty:1, checked:'Y' },
  { n:4,  uid:2, prodId:'PD000082', unitPrice:72000,  qty:1, checked:'N' },
  { n:5,  uid:3, prodId:'PD000055', unitPrice:48000,  qty:1, checked:'Y' },
  { n:6,  uid:4, prodId:'PD000090', unitPrice:32000,  qty:3, checked:'Y' },
  { n:7,  uid:5, prodId:'PD000067', unitPrice:62000,  qty:1, checked:'Y' },
  { n:8,  uid:5, prodId:'PD000079', unitPrice:95000,  qty:1, checked:'Y' },
  { n:9,  uid:6, prodId:'PD000054', unitPrice:41000,  qty:2, checked:'Y' },
  { n:10, uid:7, prodId:'PD000085', unitPrice:68000,  qty:1, checked:'Y' },
  { n:11, uid:7, prodId:'PD000092', unitPrice:28000,  qty:1, checked:'N' },
  { n:12, uid:8, prodId:'PD000058', unitPrice:53000,  qty:1, checked:'Y' },
];
carts.forEach(c => {
  ins('od_cart',
    ['cart_id','site_id','member_id','prod_id','unit_price',
     'order_qty','item_price','is_checked','reg_by','reg_date'],
    [mkId('CA', c.n), SITE, MB[c.uid], c.prodId, c.unitPrice,
     c.qty, c.unitPrice * c.qty, c.checked, REG, RD]
  );
});

// ─────────────────────────────────────────────
// 3. od_pay — 결제 (주문당 1건)
// ─────────────────────────────────────────────
sec('3. od_pay — 주문별 결제');

const payStatusMap = {
  PENDING:   'PENDING',
  PAID:      'COMPLT',
  PREPARING: 'COMPLT',
  SHIPPED:   'COMPLT',
  DELIVERED: 'COMPLT',
  COMPLT:    'COMPLT',
  CANCELLED: 'REFUNDED',
  RETURNED:  'REFUNDED',
};

ORDERS.forEach((o, i) => {
  const payStatus = payStatusMap[o.status] || 'COMPLT';
  const isPending = o.status === 'PENDING';
  const isRefunded = ['CANCELLED','RETURNED'].includes(o.status);

  const extraCols = [];
  const extraVals = [];

  if (o.pay === 'BANK_TRANSFER' && isPending) {
    // 무통장 입금 대기
    extraCols.push('vbank_bank_code','vbank_bank_nm','vbank_holder_nm','vbank_due_date');
    extraVals.push('KB', '국민은행', '(주)쇼핑조이', "'2026-04-25'::date");
  }
  if (o.pay === 'TOSS') {
    const seq = String(i+1).padStart(3,'0');
    extraCols.push('pg_company_cd','pg_transaction_id');
    extraVals.push('TOSS', 'toss_' + seq);
  }
  if (o.pay === 'KAKAO') {
    const seq = String(i+1).padStart(3,'0');
    extraCols.push('pg_company_cd','pg_transaction_id');
    extraVals.push('KAKAO', 'kakao_' + seq);
  }
  if (isRefunded) {
    extraCols.push('refund_amt','refund_status_cd','refund_date');
    extraVals.push(o.payAmt, 'COMPLT', ts('2026-04-10 10:00:00'));
  }
  const payDate = isPending ? null : ts(o.dt.replace('00:00','30:00').replace(':00:00',':05:00'));

  ins('od_pay',
    ['pay_id','site_id','order_id','pay_div_cd','pay_dir_cd',
     'pay_occur_type_cd','pay_method_cd','pay_amt','pay_status_cd',
     'pay_date', ...extraCols, 'reg_by','reg_date'],
    [mkId('PY', i+1), SITE, o.id, 'ORDER', 'DEPOSIT',
     'ORDER', o.pay, o.payAmt, payStatus,
     payDate, ...extraVals, REG, RD]
  );
});

// ─────────────────────────────────────────────
// 4. od_dliv — 배송 (ec.js 미삽입분 신규 추가)
// ec.js 기삽입: DLIV-016, 017, 020, 021, 022, 023, 024, 025
// ─────────────────────────────────────────────
sec('4. od_dliv — 배송 (미삽입분 신규)');

const skipDlivs = new Set(['DLIV-016','DLIV-017','DLIV-020','DLIV-021','DLIV-022','DLIV-023','DLIV-024','DLIV-025']);

ORDERS.filter(o => o.hasDliv).forEach(o => {
  const num  = parseInt(o.id.split('-')[2]);
  const dId  = 'DLIV-' + String(num).padStart(3, '0');
  const d    = o.dliv;
  const a    = ADDR[o.uid];

  const extraCols = [];
  const extraVals = [];
  if (d.courier) {
    extraCols.push('outbound_courier_cd','outbound_tracking_no','dliv_ship_date');
    extraVals.push(d.courier, d.trk, ts(d.shipDt));
  }
  if (d.delivDt) {
    extraCols.push('dliv_date');
    extraVals.push(ts(d.delivDt));
  }

  ins('od_dliv',
    ['dliv_id','site_id','order_id','member_id','member_nm',
     'recv_nm','recv_phone','recv_zip','recv_addr','recv_addr_detail',
     'dliv_div_cd','dliv_type_cd','dliv_pay_type_cd',
     'dliv_status_cd','shipping_fee','reg_by','reg_date', ...extraCols],
    [dId, SITE, o.id, MB[o.uid], NM[o.uid],
     NM[o.uid], PH[o.uid], a.zip, a.addr, a.dtl,
     'OUTBOUND','NORMAL','PREPAY',
     d.status, o.ship, REG, RD, ...extraVals]
  );
});

// ─────────────────────────────────────────────
// 5. od_dliv_item — 배송 항목
// ─────────────────────────────────────────────
sec('5. od_dliv_item — 배송 항목');
let dlviSeq = 1;

ORDERS.filter(o => o.hasDliv).forEach(o => {
  const num  = parseInt(o.id.split('-')[2]);
  const dId  = 'DLIV-' + String(num).padStart(3, '0');
  const oiIds = ORDER_ITEMS[o.id] || [];

  oiIds.forEach(oiId => {
    const it = OI[oiId];
    ins('od_dliv_item',
      ['dliv_item_id','site_id','dliv_id','order_item_id','prod_id',
       'dliv_type_cd','unit_price','dliv_qty',
       'dliv_item_status_cd','reg_by','reg_date'],
      [mkId('DLVI', dlviSeq++), SITE, dId, oiId, it.prodId,
       'OUT', it.unitPrice, it.qty,
       o.dliv.status, REG, RD]
    );
  });
});

// ─────────────────────────────────────────────
// 6. od_claim_item — 클레임 항목
// ─────────────────────────────────────────────
sec('6. od_claim_item — 클레임 항목');
let clmiSeq = 1;

CLAIMS.forEach(c => {
  c.oiIds.forEach((oiId, idx) => {
    const it   = OI[oiId];
    const up   = c.prices[idx];
    const qty  = c.qtys[idx];
    const itemAmt  = up * qty;
    const refAmt   = c.status === 'COMPLT' ? itemAmt : 0;

    // 클레임항목상태: CANCEL → 클레임 타입별 매핑
    const statusMap = {
      REQUESTED: 'REQUESTED', APPROVED: 'APPROVED', IN_PICKUP: 'IN_PICKUP',
      PROCESSING: 'PROCESSING', COMPLT: 'COMPLT', REJECTED: 'REJECTED', CANCELLED: 'CANCELLED',
    };

    ins('od_claim_item',
      ['claim_item_id','site_id','claim_id','order_item_id','prod_id',
       'prod_nm','prod_option','unit_price','claim_qty','item_amt','refund_amt',
       'claim_item_status_cd','reg_by','reg_date'],
      [mkId('CLMI', clmiSeq++), SITE, c.id, oiId, it.prodId,
       it.prodNm, it.opt, up, qty, itemAmt, refAmt,
       statusMap[c.status] || 'REQUESTED', REG, RD]
    );
  });
});

// ─────────────────────────────────────────────
// 7. od_order_item_discnt — 주문상품 할인 내역
// 상품 즉시할인 / 상품쿠폰 적용 건
// ─────────────────────────────────────────────
sec('7. od_order_item_discnt — 상품별 즉시할인 / 상품쿠폰');
let oidiSeq = 1;

// 즉시할인 (상품 판매가 직접 할인)
const itemDiscnts = [
  // orderId, oiId, type, couponId, couponIssueId, rate, unitAmt, qty
  { oi:'OI000004', type:'ITEM_DISCNT',  couponId:null, issueId:null, rate:5.00,  unitAmt:2300 },  // 케이블 니트 5% 즉시할인
  { oi:'OI000006', type:'ITEM_DISCNT',  couponId:null, issueId:null, rate:10.00, unitAmt:7900 },  // 플로럴 드레스 10% 즉시할인
  { oi:'OI000011', type:'ITEM_DISCNT',  couponId:null, issueId:null, rate:5.00,  unitAmt:2450 },  // 케이블 니트 5%
  { oi:'OI000008', type:'ITEM_COUPON',  couponId:'CO000003', issueId:'CI000003', rate:15.00, unitAmt:6750 }, // 여름 15% 쿠폰
  { oi:'OI000013', type:'ITEM_COUPON',  couponId:'CO000003', issueId:'CI000004', rate:15.00, unitAmt:11850 }, // 플로럴 드레스 15%
  { oi:'OI000015', type:'ITEM_DISCNT',  couponId:null, issueId:null, rate:5.00,  unitAmt:2750 },  // 카고 팬츠 5%
];
itemDiscnts.forEach(d => {
  const it  = OI[d.oi];
  const totalAmt = d.unitAmt * it.qty;
  ins('od_order_item_discnt',
    ['item_discnt_id','site_id','order_id','order_item_id',
     'discnt_type_cd','coupon_id','coupon_issue_id',
     'discnt_rate','unit_discnt_amt','total_discnt_amt','order_qty',
     'reg_by','reg_date'],
    [mkId('OIDI', oidiSeq++), SITE, it.orderId, d.oi,
     d.type, d.couponId, d.issueId,
     d.rate, d.unitAmt, totalAmt, it.qty, REG, RD]
  );
});

// ─────────────────────────────────────────────
// 8. od_order_discnt — 주문 할인·차감 내역
// 주문쿠폰 / 적립금 차감 / 캐쉬 차감
// ─────────────────────────────────────────────
sec('8. od_order_discnt — 주문 쿠폰·적립금·캐쉬 차감');
let odscSeq = 1;

// [orderId, discntType, couponId, couponIssueId, amt, restoreYn]
const orderDiscnts = [
  // 주문쿠폰 (ORDER_COUPON)
  { ordId:'ORD-2026-020', type:'ORDER_COUPON', cId:'CO000001', ciId:'CI000001', amt:4500,  restoreYn:'N' }, // 신규 10% -4500
  { ordId:'ORD-2026-017', type:'ORDER_COUPON', cId:'CO000002', ciId:'CI000002', amt:5000,  restoreYn:'N' }, // 봄맞이 -5000
  { ordId:'ORD-2026-015', type:'ORDER_COUPON', cId:'CO000004', ciId:'CI000005', amt:10000, restoreYn:'N' }, // VIP -10000
  { ordId:'ORD-2026-010', type:'ORDER_COUPON', cId:'CO000008', ciId:'CI000008', amt:2000,  restoreYn:'N' }, // 앱전용 -2000
  // 적립금 차감 (SAVE_USE)
  { ordId:'ORD-2026-022', type:'SAVE_USE', cId:null, ciId:null, amt:3000, restoreYn:'N' },
  { ordId:'ORD-2026-018', type:'SAVE_USE', cId:null, ciId:null, amt:2000, restoreYn:'N' },
  { ordId:'ORD-2026-016', type:'SAVE_USE', cId:null, ciId:null, amt:1000, restoreYn:'N' },
  // 캐쉬 차감 (CACHE_USE)
  { ordId:'ORD-2026-023', type:'CACHE_USE', cId:null, ciId:null, amt:3000, restoreYn:'N' },
  { ordId:'ORD-2026-014', type:'CACHE_USE', cId:null, ciId:null, amt:2000, restoreYn:'N' },
  // 취소된 주문의 적립금/캐쉬는 복원됨
  { ordId:'ORD-2026-011', type:'SAVE_USE', cId:null, ciId:null, amt:2000, restoreYn:'Y', restoreAmt:2000, restoreDt:'2026-04-01 16:00:00' },
  { ordId:'ORD-2026-019', type:'CACHE_USE', cId:null, ciId:null, amt:3000, restoreYn:'Y', restoreAmt:3000, restoreDt:'2026-03-15 10:00:00' },
];

orderDiscnts.forEach(d => {
  const extraCols = [];
  const extraVals = [];
  if (d.restoreYn === 'Y') {
    extraCols.push('restore_amt','restore_date');
    extraVals.push(d.restoreAmt, ts(d.restoreDt));
  }
  ins('od_order_discnt',
    ['order_discnt_id','site_id','order_id',
     'discnt_type_cd','coupon_id','coupon_issue_id',
     'discnt_amt','restore_yn', ...extraCols, 'reg_by','reg_date'],
    [mkId('ODSC', odscSeq++), SITE, d.ordId,
     d.type, d.cId, d.ciId,
     d.amt, d.restoreYn || 'N', ...extraVals, REG, RD]
  );
});

// ─────────────────────────────────────────────
// 9. od_refund — 환불 마스터
// ─────────────────────────────────────────────
sec('9. od_refund — 환불 마스터');
let rfSeq = 1;

// 클레임 완료 or 처리중 환불
const refunds = [
  // claimId, orderId, type, prodAmt, shipAmt, saveAmt, totalAmt, status, fault, reqDt, compltDt
  { cId:'CLM-2026-021', oId:'ORD-2026-021', type:'RETURN',  prodAmt:55000, shipAmt:0,    saveAmt:0, totalAmt:55000, status:'COMPLT',  fault:'VENDOR',   reqDt:'2026-03-25 11:12:00', compltDt:'2026-03-27 14:00:00' },
  { cId:'CLM-2026-011', oId:'ORD-2026-011', type:'CANCEL',  prodAmt:119000,shipAmt:3000, saveAmt:2000,totalAmt:119000,status:'COMPLT', fault:'CUST',     reqDt:'2026-02-05 15:08:00', compltDt:'2026-02-06 10:00:00' },
  { cId:'CLM-2026-005', oId:'ORD-2026-005', type:'RETURN',  prodAmt:88000, shipAmt:0,    saveAmt:0, totalAmt:88000, status:'COMPLT',  fault:'CUST',     reqDt:'2026-03-18 10:17:00', compltDt:'2026-03-22 15:00:00' },
  { cId:'CLM-2026-006', oId:'ORD-2026-006', type:'RETURN',  prodAmt:69000, shipAmt:0,    saveAmt:0, totalAmt:69000, status:'PENDING', fault:'VENDOR',   reqDt:'2026-03-25 16:44:00', compltDt:null },
  { cId:'CLM-2026-012', oId:'ORD-2026-012', type:'CANCEL',  prodAmt:94900, shipAmt:0,    saveAmt:0, totalAmt:94900, status:'PENDING', fault:'CUST',     reqDt:'2026-04-04 09:47:00', compltDt:null },
  { cId:null,           oId:'ORD-2026-019', type:'CANCEL',  prodAmt:89000, shipAmt:3000, saveAmt:3000,totalAmt:89000,status:'COMPLT', fault:'CUST',     reqDt:'2026-03-14 20:00:00', compltDt:'2026-03-15 10:00:00' },
];

const refundIds = {};
refunds.forEach(r => {
  const rfId = mkId('RF', rfSeq);
  refundIds[r.oId + (r.cId || '')] = rfId;

  const extraCols = [];
  const extraVals = [];
  if (r.cId) { extraCols.push('claim_id'); extraVals.push(r.cId); }
  if (r.compltDt) { extraCols.push('refund_complt_date'); extraVals.push(ts(r.compltDt)); }

  ins('od_refund',
    ['refund_id','site_id','order_id',
     'refund_type_cd','refund_prod_amt','refund_ship_amt','refund_save_amt','total_refund_amt',
     'refund_status_cd','refund_req_date','fault_type_cd',
     ...extraCols, 'reg_by','reg_date'],
    [rfId, SITE, r.oId,
     r.type, r.prodAmt, r.shipAmt, r.saveAmt, r.totalAmt,
     r.status, ts(r.reqDt), r.fault,
     ...extraVals, REG, RD]
  );
  rfSeq++;
});

// ─────────────────────────────────────────────
// 10. od_refund_method — 환불 수단 내역
// ─────────────────────────────────────────────
sec('10. od_refund_method — 환불 수단');
let rfmSeq = 1;

const refundMethods = [
  // rfKey(orderId+claimId), payMethod, priority, amt, status, payId, reqDt, compltDt
  { rfKey:'ORD-2026-021CLM-2026-021', payMethod:'BANK_TRANSFER', priority:1, amt:55000,  status:'COMPLT', payId:mkId('PY',5),  compltDt:'2026-03-27 14:00:00' },
  { rfKey:'ORD-2026-011CLM-2026-011', payMethod:'BANK_TRANSFER', priority:1, amt:119000, status:'COMPLT', payId:mkId('PY',15), compltDt:'2026-02-06 10:00:00' },
  { rfKey:'ORD-2026-005CLM-2026-005', payMethod:'TOSS',          priority:1, amt:88000,  status:'COMPLT', payId:mkId('PY',21), compltDt:'2026-03-22 15:00:00' },
  { rfKey:'ORD-2026-006CLM-2026-006', payMethod:'BANK_TRANSFER', priority:1, amt:69000,  status:'PENDING',payId:mkId('PY',20), compltDt:null },
  { rfKey:'ORD-2026-012CLM-2026-012', payMethod:'BANK_TRANSFER', priority:1, amt:94900,  status:'PENDING',payId:mkId('PY',14), compltDt:null },
  { rfKey:'ORD-2026-019',             payMethod:'BANK_TRANSFER', priority:1, amt:89000,  status:'COMPLT', payId:mkId('PY',7),  compltDt:'2026-03-15 10:00:00' },
];

refundMethods.forEach(r => {
  const rfId = refundIds[r.rfKey];
  if (!rfId) return;

  // orderId 역추출
  const ordId = Object.keys(refundIds).find(k => refundIds[k] === rfId);
  const oId   = r.rfKey.substring(0, 14); // 'ORD-2026-XXX'

  const extraCols = [];
  const extraVals = [];
  if (r.compltDt) { extraCols.push('refund_date'); extraVals.push(ts(r.compltDt)); }
  if (r.payId)    { extraCols.push('pay_id');       extraVals.push(r.payId); }

  ins('od_refund_method',
    ['refund_method_id','site_id','refund_id','order_id',
     'pay_method_cd','refund_priority','refund_amt','refund_avail_amt',
     'refund_status_cd', ...extraCols, 'reg_by','reg_date'],
    [mkId('RFM', rfmSeq++), SITE, rfId, oId,
     r.payMethod, r.priority, r.amt, r.amt,
     r.status, ...extraVals, REG, RD]
  );
});

// ─────────────────────────────────────────────
// 출력
// ─────────────────────────────────────────────
const header = [
  '-- ================================================================',
  '-- od_* 주문 도메인 샘플 데이터',
  '-- 생성일: 2026-04-20',
  '--',
  '-- 포함 테이블:',
  '--   od_cart, od_pay, od_pay_method,',
  '--   od_dliv(신규), od_dliv_item,',
  '--   od_claim_item,',
  '--   od_order_item_discnt, od_order_discnt,',
  '--   od_refund, od_refund_method',
  '-- ================================================================',
  "SET search_path TO shopjoy_2604, public;",
];

const all = [...header, ...lines];
const outFile = path.resolve(__dirname, 'sample_data_od.sql');
fs.writeFileSync(outFile, all.join('\n'), 'utf8');

const insertCount = all.filter(l => l.startsWith('INSERT')).length;
console.log(`완료: INSERT ${insertCount}건 → ${outFile}`);
