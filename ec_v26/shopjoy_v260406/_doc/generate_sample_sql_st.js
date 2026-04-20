'use strict';
/**
 * 정산(st_*) 도메인 샘플 데이터 생성기
 *
 * 사용법: node _doc/generate_sample_sql_st.js
 * 출력:   _doc/sample_data_st.sql
 *
 * 대상 테이블 (의존성 순서):
 *  1. st_settle_config   — 정산 기준 설정
 *  2. st_settle          — 정산 마스터 (vendor × ym)
 *  3. st_settle_raw      — 정산 수집원장
 *  4. st_settle_item     — 정산 항목 (주문아이템 기준)
 *  5. st_settle_adj      — 정산 조정
 *  6. st_settle_etc_adj  — 정산 기타조정
 *  7. st_settle_close    — 정산 마감 이력
 *  8. st_settle_pay      — 정산 지급
 *  9. st_erp_voucher     — ERP 전표 마스터
 * 10. st_erp_voucher_line— ERP 전표 라인
 * 11. st_recon           — 정산 대사
 *
 * 기준 데이터:
 *   - sy_vendor: VN000001-VN000004 (판매 업체)
 *   - od_order_item: OI000006-OI000029 (2026-01~03 주문)
 *   - od_claim_item: CLMI000004, CLMI000006, CLMI000009 (반품/취소)
 */

const fs   = require('fs');
const path = require('path');

const SCHEMA   = 'shopjoy_2604';
const SITE     = 'SITE000001';
const REG_BY   = 'SYSTEM';
const REG_DATE = '2026-04-20 00:00:00';

const mkId = (p, n) => p + String(n).padStart(6, '0');
const esc  = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number')  return String(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  return `'${String(v).replace(/'/g, "''")}'`;
};

const lines = [];
const sec = (t) => {
  lines.push('');
  lines.push('-- ================================================================');
  lines.push(`-- ${t}`);
  lines.push('-- ================================================================');
};
const ins = (table, cols, vals) =>
  lines.push(
    `INSERT INTO ${SCHEMA}.${table} (${cols.join(', ')}) VALUES (${vals.map(esc).join(', ')}) ON CONFLICT DO NOTHING;`
  );

// ── 기준 데이터 ───────────────────────────────────────────────
const VENDORS = [
  { id: 'VN000001', nm: '패션스타일',  rate: 5.0, bank: '국민은행', acct: '123-456-789012', holder: '패션스타일' },
  { id: 'VN000002', nm: '트렌드웨어',  rate: 7.0, bank: '신한은행', acct: '234-567-890123', holder: '트렌드웨어' },
  { id: 'VN000003', nm: '에코패션',    rate: 6.0, bank: '하나은행', acct: '345-678-901234', holder: '에코패션' },
  { id: 'VN000004', nm: '럭셔리브랜드',rate: 8.0, bank: '우리은행', acct: '456-789-012345', holder: '럭셔리브랜드' },
];

// vendor_id → config (rate map)
const VRATE = Object.fromEntries(VENDORS.map(v => [v.id, v.rate]));

// settle_ym: CHAR(6) = 'YYYYMM' (DB 컬럼), 내부 키는 '2026-01' 형식 유지
// ymChar: DB 컬럼 값, ymDash(=내부 키): 집계·참조용
const toChar6 = (ymDash) => ymDash.replace('-', ''); // '2026-01' → '202601'

const PERIODS = [
  { ymChar: '202601', ymDash: '2026-01', start: '2026-01-01', end: '2026-01-31', status: 'PAID'      },
  { ymChar: '202602', ymDash: '2026-02', start: '2026-02-01', end: '2026-02-28', status: 'CLOSED'    },
  { ymChar: '202603', ymDash: '2026-03', start: '2026-03-01', end: '2026-03-31', status: 'CONFIRMED' },
];

// 주문항목 데이터 (oi | order_id | vendor_id | unit_price | qty | item_amt | ym)
const ORDER_ITEMS = [
  // ── 2026-01 ──────────────────────────────────────────────
  { oi:'OI000029', ord:'ORD-2026-001', vn:'VN000001', pd:'PD000002', price:45000,  qty:1, amt:45000,  ym:'2026-01' },
  { oi:'OI000028', ord:'ORD-2026-002', vn:'VN000001', pd:'PD000005', price:52000,  qty:1, amt:52000,  ym:'2026-01' },
  { oi:'OI000027', ord:'ORD-2026-003', vn:'VN000002', pd:'PD000014', price:38000,  qty:1, amt:38000,  ym:'2026-01' },
  { oi:'OI000026', ord:'ORD-2026-004', vn:'VN000001', pd:'PD000003', price:49000,  qty:1, amt:49000,  ym:'2026-01' },
  { oi:'OI000025', ord:'ORD-2026-005', vn:'VN000004', pd:'PD000033', price:88000,  qty:1, amt:88000,  ym:'2026-01' },
  { oi:'OI000024', ord:'ORD-2026-006', vn:'VN000001', pd:'PD000009', price:69000,  qty:1, amt:69000,  ym:'2026-01' },
  { oi:'OI000023', ord:'ORD-2026-007', vn:'VN000004', pd:'PD000031', price:79000,  qty:1, amt:79000,  ym:'2026-01' },
  { oi:'OI000022', ord:'ORD-2026-008', vn:'VN000003', pd:'PD000025', price:95000,  qty:1, amt:95000,  ym:'2026-01' },
  { oi:'OI000021', ord:'ORD-2026-009', vn:'VN000003', pd:'PD000022', price:89000,  qty:1, amt:89000,  ym:'2026-01' },
  { oi:'OI000020', ord:'ORD-2026-010', vn:'VN000003', pd:'PD000024', price:139000, qty:1, amt:139000, ym:'2026-01' },
  // ── 2026-02 ──────────────────────────────────────────────
  { oi:'OI000019', ord:'ORD-2026-011', vn:'VN000003', pd:'PD000021', price:119000, qty:1, amt:119000, ym:'2026-02' },
  { oi:'OI000018', ord:'ORD-2026-012', vn:'VN000004', pd:'PD000041', price:35000,  qty:1, amt:35000,  ym:'2026-02' },
  { oi:'OI000017', ord:'ORD-2026-012', vn:'VN000002', pd:'PD000011', price:59900,  qty:1, amt:59900,  ym:'2026-02' },
  { oi:'OI000016', ord:'ORD-2026-013', vn:'VN000001', pd:'PD000001', price:29900,  qty:1, amt:29900,  ym:'2026-02' },
  { oi:'OI000015', ord:'ORD-2026-014', vn:'VN000002', pd:'PD000012', price:55000,  qty:1, amt:55000,  ym:'2026-02' },
  { oi:'OI000014', ord:'ORD-2026-015', vn:'VN000001', pd:'PD000001', price:29900,  qty:1, amt:29900,  ym:'2026-02' },
  { oi:'OI000013', ord:'ORD-2026-015', vn:'VN000004', pd:'PD000031', price:79000,  qty:1, amt:79000,  ym:'2026-02' },
  { oi:'OI000012', ord:'ORD-2026-016', vn:'VN000002', pd:'PD000011', price:59900,  qty:1, amt:59900,  ym:'2026-02' },
  // ── 2026-03 ──────────────────────────────────────────────
  { oi:'OI000011', ord:'ORD-2026-017', vn:'VN000001', pd:'PD000003', price:49000,  qty:1, amt:49000,  ym:'2026-03' },
  { oi:'OI000010', ord:'ORD-2026-018', vn:'VN000001', pd:'PD000001', price:59800,  qty:2, amt:119600, ym:'2026-03' },
  { oi:'OI000009', ord:'ORD-2026-019', vn:'VN000003', pd:'PD000022', price:89000,  qty:1, amt:89000,  ym:'2026-03' },
  { oi:'OI000008', ord:'ORD-2026-020', vn:'VN000001', pd:'PD000002', price:45000,  qty:1, amt:45000,  ym:'2026-03' },
  { oi:'OI000007', ord:'ORD-2026-021', vn:'VN000002', pd:'PD000012', price:55000,  qty:1, amt:55000,  ym:'2026-03' },
  { oi:'OI000006', ord:'ORD-2026-022', vn:'VN000004', pd:'PD000031', price:79000,  qty:1, amt:79000,  ym:'2026-03' },
];

// 클레임 항목 (차감: 확정 시점 기준 해당 월 정산에서 차감)
const CLAIM_ITEMS = [
  // CLMI000006: 2월 OI000016 반품확정 → 2월 정산 차감 (VN000001)
  { cli:'CLMI000006', oi:'OI000016', ord:'ORD-2026-013', vn:'VN000001', amt:29900, ym:'2026-02', type:'RETURN' },
  // CLMI000009: 2월 OI000019 반품확정 → 2월 정산 차감 (VN000003)
  { cli:'CLMI000009', oi:'OI000019', ord:'ORD-2026-011', vn:'VN000003', amt:119000, ym:'2026-02', type:'RETURN' },
  // CLMI000004: 3월 OI000006 취소 → 3월 정산 차감 (VN000004)
  { cli:'CLMI000004', oi:'OI000006', ord:'ORD-2026-022', vn:'VN000004', amt:79000, ym:'2026-03', type:'CANCEL' },
];

// ── 집계 계산 ─────────────────────────────────────────────────
// settle key: vn_id + ym
function buildSettleMap() {
  const m = {};
  for (const item of ORDER_ITEMS) {
    const k = `${item.vn}__${item.ym}`;
    if (!m[k]) m[k] = { vn: item.vn, ym: item.ym, orderAmt: 0, returnAmt: 0, claimCnt: 0 };
    m[k].orderAmt += item.amt;
  }
  for (const ci of CLAIM_ITEMS) {
    const k = `${ci.vn}__${ci.ym}`;
    if (!m[k]) m[k] = { vn: ci.vn, ym: ci.ym, orderAmt: 0, returnAmt: 0, claimCnt: 0 };
    m[k].returnAmt += ci.amt;
    m[k].claimCnt++;
  }
  return m;
}

const settleMap   = buildSettleMap();
const settleIdMap = {};   // vn+ym → settle_id
let stSeq = 1;

// 모든 필요한 settle (vendor×period) 생성 — 내부 키는 ymDash
for (const p of PERIODS) {
  for (const v of VENDORS) {
    const k = `${v.id}__${p.ymDash}`;
    if (!settleMap[k]) settleMap[k] = { vn: v.id, ym: p.ymDash, orderAmt: 0, returnAmt: 0, claimCnt: 0 };
    settleIdMap[k] = mkId('STL', stSeq++);
  }
}

// ════════════════════════════════════════════════════════════
// 1. st_settle_config — 정산 기준 설정
// ════════════════════════════════════════════════════════════
sec('1. st_settle_config — 정산 기준 설정');
let sfSeq = 1;
// 전체 사이트 기본 설정
ins('st_settle_config',
  ['settle_config_id','site_id','vendor_id','category_id','settle_cycle_cd','settle_day','commission_rate','min_settle_amt','use_yn','reg_by','reg_date'],
  [mkId('SCF',sfSeq++), SITE, null, null, 'MONTHLY', 25, 5.0, 10000, 'Y', REG_BY, REG_DATE]
);
// 업체별 개별 설정
for (const v of VENDORS) {
  ins('st_settle_config',
    ['settle_config_id','site_id','vendor_id','category_id','settle_cycle_cd','settle_day','commission_rate','min_settle_amt','use_yn','reg_by','reg_date'],
    [mkId('SCF',sfSeq++), SITE, v.id, null, 'MONTHLY', 25, v.rate, 10000, 'Y', REG_BY, REG_DATE]
  );
}

// ════════════════════════════════════════════════════════════
// 2. st_settle — 정산 마스터
// ════════════════════════════════════════════════════════════
sec('2. st_settle — 정산 마스터');

// adj_amt, etc_adj_amt 사전 정의 (섹션 5,6에서도 동일 금액 사용)
const ADJ_MAP = {
  // k → { adj: 조정금액합계, etcAdj: 기타조정합계 }
  'VN000001__2026-01': { adj: 5000,  etcAdj: -3000 },
  'VN000002__2026-01': { adj: 0,     etcAdj: -2000 },
  'VN000003__2026-01': { adj: 10000, etcAdj: 0     },
  'VN000004__2026-01': { adj: 0,     etcAdj: -5000 },
  'VN000001__2026-02': { adj: -3000, etcAdj: 2000  },
  'VN000002__2026-02': { adj: 5000,  etcAdj: 0     },
  'VN000003__2026-02': { adj: 0,     etcAdj: 0     },
  'VN000004__2026-02': { adj: 0,     etcAdj: -3000 },
  'VN000001__2026-03': { adj: 0,     etcAdj: 0     },
  'VN000002__2026-03': { adj: 2000,  etcAdj: 0     },
  'VN000003__2026-03': { adj: 0,     etcAdj: 0     },
  'VN000004__2026-03': { adj: 0,     etcAdj: 0     },
};

const periodStatus = Object.fromEntries(PERIODS.map(p => [p.ymDash, p.status]));

for (const p of PERIODS) {
  for (const v of VENDORS) {
    const k = `${v.id}__${p.ymDash}`;
    const sid    = settleIdMap[k];
    const data   = settleMap[k];
    const rate   = v.rate;
    const net    = data.orderAmt - data.returnAmt;
    const comm   = Math.round(net * rate / 100);
    const settAmt= net - comm;
    const adj    = (ADJ_MAP[k] || {}).adj    || 0;
    const etcAdj = (ADJ_MAP[k] || {}).etcAdj || 0;
    const finalAmt = settAmt + adj + etcAdj;
    const status = p.status;

    ins('st_settle',
      ['settle_id','site_id','vendor_id','settle_ym','settle_start_date','settle_end_date',
       'total_order_amt','total_return_amt','total_claim_cnt','total_discnt_amt',
       'commission_rate','commission_amt','settle_amt','adj_amt','etc_adj_amt','final_settle_amt',
       'settle_status_cd','settle_status_cd_before','settle_memo','reg_by','reg_date'],
      [sid, SITE, v.id, p.ymChar, p.start, p.end,
       data.orderAmt, data.returnAmt, data.claimCnt, 0,
       rate, comm, settAmt, adj, etcAdj, finalAmt,
       status, status === 'DRAFT' ? null : 'DRAFT',
       `${p.ymDash} ${v.nm} 정산`, REG_BY, REG_DATE]
    );
  }
}

// ════════════════════════════════════════════════════════════
// 3. st_settle_raw — 정산 수집원장
// ════════════════════════════════════════════════════════════
sec('3. st_settle_raw — 정산 수집원장');
let srSeq = 1;

for (const item of ORDER_ITEMS) {
  const k   = `${item.vn}__${item.ym}`;
  const sid = settleIdMap[k];
  const p   = PERIODS.find(x => x.ymDash === item.ym);
  const rawStatus = p.status === 'DRAFT' ? 'COLLECTED' : 'SETTLED';
  const closeYn   = (p.status === 'CLOSED' || p.status === 'PAID') ? 'Y' : 'N';

  ins('st_settle_raw',
    ['settle_raw_id','site_id','raw_type_cd','raw_status_cd','raw_status_cd_before',
     'order_id','order_item_id','vendor_id','prod_id',
     'unit_price','order_qty','item_price','discnt_amt',
     'settle_fee_rate','settle_fee_amt','settle_amt','settle_period','settle_id',
     'close_yn','buy_confirm_yn','reg_by','reg_date'],
    [mkId('SRW',srSeq++), SITE, 'ORDER', rawStatus, 'PENDING',
     item.ord, item.oi, item.vn, item.pd,
     item.price, item.qty, item.amt, 0,
     VRATE[item.vn], Math.round(item.amt * VRATE[item.vn] / 100),
     item.amt - Math.round(item.amt * VRATE[item.vn] / 100),
     item.ym, sid, closeYn, 'Y', REG_BY, REG_DATE]
  );
}

// 클레임 수집원장 (차감)
for (const ci of CLAIM_ITEMS) {
  const k   = `${ci.vn}__${ci.ym}`;
  const sid = settleIdMap[k];
  const p   = PERIODS.find(x => x.ymDash === ci.ym);
  const rawStatus = p.status === 'DRAFT' ? 'COLLECTED' : 'SETTLED';
  const closeYn   = (p.status === 'CLOSED' || p.status === 'PAID') ? 'Y' : 'N';

  ins('st_settle_raw',
    ['settle_raw_id','site_id','raw_type_cd','raw_status_cd','raw_status_cd_before',
     'order_id','order_item_id','claim_item_id','vendor_id',
     'unit_price','order_qty','item_price','discnt_amt',
     'settle_fee_rate','settle_fee_amt','settle_amt','settle_period','settle_id',
     'close_yn','buy_confirm_yn','reg_by','reg_date'],
    [mkId('SRW',srSeq++), SITE, 'CLAIM', rawStatus, 'PENDING',
     ci.ord, ci.oi, ci.cli, ci.vn,
     ci.amt, 1, -ci.amt, 0,
     VRATE[ci.vn], -Math.round(ci.amt * VRATE[ci.vn] / 100),
     -(ci.amt - Math.round(ci.amt * VRATE[ci.vn] / 100)),
     ci.ym, sid, closeYn, 'N', REG_BY, REG_DATE]
  );
}

// ════════════════════════════════════════════════════════════
// 4. st_settle_item — 정산 항목 (주문 기준)
// ════════════════════════════════════════════════════════════
sec('4. st_settle_item — 정산 항목');
let siSeq = 1;

for (const item of ORDER_ITEMS) {
  const k    = `${item.vn}__${item.ym}`;
  const sid  = settleIdMap[k];
  const rate = VRATE[item.vn];
  const comm = Math.round(item.amt * rate / 100);

  ins('st_settle_item',
    ['settle_item_id','settle_id','site_id','order_id','order_item_id','vendor_id','prod_id',
     'settle_item_type_cd','order_qty','unit_price','item_price','discnt_amt',
     'commission_rate','commission_amt','settle_item_amt','reg_by','reg_date'],
    [mkId('SIT',siSeq++), sid, SITE, item.ord, item.oi, item.vn, item.pd,
     'SALE', item.qty, item.price, item.amt, 0,
     rate, comm, item.amt - comm, REG_BY, REG_DATE]
  );
}

// 클레임 차감 항목
for (const ci of CLAIM_ITEMS) {
  const k    = `${ci.vn}__${ci.ym}`;
  const sid  = settleIdMap[k];
  const rate = VRATE[ci.vn];
  const comm = Math.round(ci.amt * rate / 100);

  ins('st_settle_item',
    ['settle_item_id','settle_id','site_id','order_id','order_item_id','vendor_id',
     'settle_item_type_cd','order_qty','unit_price','item_price','discnt_amt',
     'commission_rate','commission_amt','settle_item_amt','reg_by','reg_date'],
    [mkId('SIT',siSeq++), sid, SITE, ci.ord, ci.oi, ci.vn,
     ci.type === 'RETURN' ? 'RETURN' : 'CANCEL', 1, ci.amt, -ci.amt, 0,
     rate, -comm, -(ci.amt - comm), REG_BY, REG_DATE]
  );
}

// ════════════════════════════════════════════════════════════
// 5. st_settle_adj — 정산 조정
// ════════════════════════════════════════════════════════════
sec('5. st_settle_adj — 정산 조정');
let saSeq = 1;

const ADJ_DETAILS = [
  { k:'VN000001__2026-01', type:'BONUS',    amt:5000,  reason:'1월 판매장려금' },
  { k:'VN000001__2026-02', type:'PENALTY',  amt:-3000, reason:'상품정보 오류 패널티' },
  { k:'VN000002__2026-02', type:'BONUS',    amt:5000,  reason:'우수판매 장려금' },
  { k:'VN000002__2026-03', type:'ERROR_FIX',amt:2000,  reason:'1월 정산 오류 수정' },
  { k:'VN000003__2026-01', type:'BONUS',    amt:10000, reason:'월간 최다 판매 보너스' },
];

for (const a of ADJ_DETAILS) {
  const sid = settleIdMap[a.k];
  if (!sid) continue;
  ins('st_settle_adj',
    ['settle_adj_id','settle_id','site_id','adj_type_cd','adj_amt','adj_reason','settle_adj_memo','reg_by','reg_date'],
    [mkId('SAJ',saSeq++), sid, SITE, a.type, a.amt, a.reason, null, REG_BY, REG_DATE]
  );
}

// ════════════════════════════════════════════════════════════
// 6. st_settle_etc_adj — 정산 기타조정
// ════════════════════════════════════════════════════════════
sec('6. st_settle_etc_adj — 정산 기타조정');
let seaSeq = 1;

const ETC_ADJ_DETAILS = [
  { k:'VN000001__2026-01', type:'SHIP',        dir:'DEDUCT', amt:3000,  reason:'배송비 분담' },
  { k:'VN000002__2026-01', type:'RETURN_SHIP', dir:'DEDUCT', amt:2000,  reason:'반품배송비 청구' },
  { k:'VN000004__2026-01', type:'PENALTY',     dir:'DEDUCT', amt:5000,  reason:'지연배송 위약금' },
  { k:'VN000001__2026-02', type:'SHIP',        dir:'ADD',    amt:2000,  reason:'배송비 환급' },
  { k:'VN000004__2026-02', type:'RETURN_SHIP', dir:'DEDUCT', amt:3000,  reason:'반품배송비 청구' },
];

for (const e of ETC_ADJ_DETAILS) {
  const sid = settleIdMap[e.k];
  if (!sid) continue;
  ins('st_settle_etc_adj',
    ['settle_etc_adj_id','settle_id','site_id','etc_adj_type_cd','etc_adj_dir_cd',
     'etc_adj_amt','etc_adj_reason','settle_etc_adj_memo','reg_by','reg_date'],
    [mkId('SEA',seaSeq++), sid, SITE, e.type, e.dir, e.amt, e.reason, null, REG_BY, REG_DATE]
  );
}

// ════════════════════════════════════════════════════════════
// 7. st_settle_close — 정산 마감 이력
// ════════════════════════════════════════════════════════════
sec('7. st_settle_close — 정산 마감 이력');
let sclSeq = 1;
const closeIdMap = {}; // settle_id → close_id (최신)

for (const p of PERIODS) {
  if (p.status === 'CONFIRMED') continue; // 마감 전
  for (const v of VENDORS) {
    const k   = `${v.id}__${p.ymDash}`;
    const sid = settleIdMap[k];
    const data = settleMap[k];
    const net  = data.orderAmt - data.returnAmt;
    const comm = Math.round(net * VRATE[v.id] / 100);
    const adj    = (ADJ_MAP[k] || {}).adj    || 0;
    const etcAdj = (ADJ_MAP[k] || {}).etcAdj || 0;
    const finalAmt = (net - comm) + adj + etcAdj;
    const cid  = mkId('SCL', sclSeq++);
    closeIdMap[sid] = cid;

    ins('st_settle_close',
      ['settle_close_id','settle_id','site_id','close_status_cd','close_reason',
       'final_settle_amt','close_by','close_date','reg_by','reg_date'],
      [cid, sid, SITE, 'CLOSED', `${p.ymDash} 정산 마감 처리`,
       finalAmt, 'US000001', p.ymDash === '2026-01' ? '2026-02-05 10:00:00' : '2026-03-05 10:00:00',
       REG_BY, REG_DATE]
    );
  }
}

// ════════════════════════════════════════════════════════════
// 8. st_settle_pay — 정산 지급
// ════════════════════════════════════════════════════════════
sec('8. st_settle_pay — 정산 지급');
let spSeq = 1;

for (const v of VENDORS) {
  // 1월 정산 지급 (PAID)
  const k1  = `${v.id}__2026-01`;
  const sid1 = settleIdMap[k1];
  const data1 = settleMap[k1];
  const net1  = data1.orderAmt - data1.returnAmt;
  const comm1 = Math.round(net1 * v.rate / 100);
  const adj1    = (ADJ_MAP[k1] || {}).adj    || 0;
  const etcAdj1 = (ADJ_MAP[k1] || {}).etcAdj || 0;
  const pay1Amt = (net1 - comm1) + adj1 + etcAdj1;

  if (pay1Amt > 0) {
    ins('st_settle_pay',
      ['settle_pay_id','settle_id','site_id','vendor_id',
       'pay_amt','pay_method_cd','bank_nm','bank_account','bank_holder',
       'pay_status_cd','pay_status_cd_before','pay_date','pay_by',
       'settle_pay_memo','reg_by','reg_date'],
      [mkId('SPY',spSeq++), sid1, SITE, v.id,
       pay1Amt, 'BANK_TRANSFER', v.bank, v.acct, v.holder,
       'COMPLT', 'PENDING', '2026-02-07 14:30:00', 'US000001',
       `2026-01 ${v.nm} 정산금 지급`, REG_BY, REG_DATE]
    );
  }

  // 2월 정산 지급 대기 (CLOSED → PENDING)
  const k2   = `${v.id}__2026-02`;
  const sid2 = settleIdMap[k2];
  const data2 = settleMap[k2];
  const net2  = data2.orderAmt - data2.returnAmt;
  const comm2 = Math.round(net2 * v.rate / 100);
  const adj2    = (ADJ_MAP[k2] || {}).adj    || 0;
  const etcAdj2 = (ADJ_MAP[k2] || {}).etcAdj || 0;
  const pay2Amt = (net2 - comm2) + adj2 + etcAdj2;

  if (pay2Amt > 0) {
    ins('st_settle_pay',
      ['settle_pay_id','settle_id','site_id','vendor_id',
       'pay_amt','pay_method_cd','bank_nm','bank_account','bank_holder',
       'pay_status_cd','pay_status_cd_before','pay_date','pay_by',
       'settle_pay_memo','reg_by','reg_date'],
      [mkId('SPY',spSeq++), sid2, SITE, v.id,
       pay2Amt, 'BANK_TRANSFER', v.bank, v.acct, v.holder,
       'PENDING', null, null, null,
       `2026-02 ${v.nm} 정산금 지급 예정`, REG_BY, REG_DATE]
    );
  }
}

// ════════════════════════════════════════════════════════════
// 9. st_erp_voucher — ERP 전표 마스터
// ════════════════════════════════════════════════════════════
sec('9. st_erp_voucher — ERP 전표 마스터');
let evSeq = 1;
const erpVoucherIdMap = {}; // vendor_ym_type → erp_voucher_id

for (const v of VENDORS) {
  // 1월 정산 전표 (SENT/MATCHED)
  for (const [vtype, vstatus, vnote] of [
    ['SETTLE','MATCHED','정산 전표'],
    ['PAY',   'SENT',   '지급 전표'],
  ]) {
    const k1  = `${v.id}__2026-01`;
    const sid = settleIdMap[k1];
    const data = settleMap[k1];
    const net  = data.orderAmt - data.returnAmt;
    const comm = Math.round(net * v.rate / 100);
    const adj    = (ADJ_MAP[k1] || {}).adj    || 0;
    const etcAdj = (ADJ_MAP[k1] || {}).etcAdj || 0;
    const finalAmt = (net - comm) + adj + etcAdj;
    const evId = mkId('EVH', evSeq++);
    erpVoucherIdMap[`${v.id}__2026-01__${vtype}`] = evId;

    ins('st_erp_voucher',
      ['erp_voucher_id','site_id','vendor_id','settle_id','settle_ym',
       'erp_voucher_type_cd','erp_voucher_status_cd','erp_voucher_status_cd_before',
       'voucher_date','erp_voucher_desc',
       'total_debit_amt','total_credit_amt',
       'erp_send_date','erp_voucher_no','reg_by','reg_date'],
      [evId, SITE, v.id, sid, '202601',
       vtype, vstatus, 'CONFIRMED',
       vtype === 'SETTLE' ? '2026-02-01' : '2026-02-07',
       `2026-01 ${v.nm} ${vnote}`,
       finalAmt > 0 ? finalAmt : 0,
       finalAmt > 0 ? finalAmt : 0,
       vtype === 'SETTLE' ? '2026-02-03 09:00:00' : '2026-02-07 15:00:00',
       `EVN-2026-01-${v.id.replace('VN', '')}-${vtype}`,
       REG_BY, REG_DATE]
    );
  }

  // 2월 정산 전표 (CONFIRMED)
  const k2  = `${v.id}__2026-02`;
  const sid2 = settleIdMap[k2];
  const data2 = settleMap[k2];
  const net2  = data2.orderAmt - data2.returnAmt;
  const comm2 = Math.round(net2 * v.rate / 100);
  const adj2    = (ADJ_MAP[k2] || {}).adj    || 0;
  const etcAdj2 = (ADJ_MAP[k2] || {}).etcAdj || 0;
  const final2  = (net2 - comm2) + adj2 + etcAdj2;
  const evId2 = mkId('EVH', evSeq++);
  erpVoucherIdMap[`${v.id}__2026-02__SETTLE`] = evId2;

  ins('st_erp_voucher',
    ['erp_voucher_id','site_id','vendor_id','settle_id','settle_ym',
     'erp_voucher_type_cd','erp_voucher_status_cd','erp_voucher_status_cd_before',
     'voucher_date','erp_voucher_desc',
     'total_debit_amt','total_credit_amt',
     'erp_send_date','erp_voucher_no','reg_by','reg_date'],
    [evId2, SITE, v.id, sid2, '202602',
     'SETTLE', 'CONFIRMED', 'DRAFT',
     '2026-03-01',
     `2026-02 ${v.nm} 정산 전표`,
     final2 > 0 ? final2 : 0,
     final2 > 0 ? final2 : 0,
     null, null,
     REG_BY, REG_DATE]
  );
}

// ════════════════════════════════════════════════════════════
// 10. st_erp_voucher_line — ERP 전표 라인
// ════════════════════════════════════════════════════════════
sec('10. st_erp_voucher_line — ERP 전표 라인');
let evlSeq = 1;

function addVoucherLines(evId, settleAmt, commAmt, adjAmt) {
  // 차변: 지급채무 (매입채무), 대변: 매출원가, 수수료수익
  if (settleAmt <= 0) return;
  ins('st_erp_voucher_line',
    ['erp_voucher_line_id','erp_voucher_id','line_no','account_cd','account_nm',
     'cost_center_cd','debit_amt','credit_amt','ref_type_cd','line_memo','reg_by','reg_date'],
    [mkId('EVL',evlSeq++), evId, 1, '2100', '매입채무(미지급금)',
     'CC001', settleAmt + commAmt, 0, 'SETTLE', '정산 지급채무 계상', REG_BY, REG_DATE]
  );
  ins('st_erp_voucher_line',
    ['erp_voucher_line_id','erp_voucher_id','line_no','account_cd','account_nm',
     'cost_center_cd','debit_amt','credit_amt','ref_type_cd','line_memo','reg_by','reg_date'],
    [mkId('EVL',evlSeq++), evId, 2, '4100', '매출원가',
     'CC001', 0, settleAmt, 'SETTLE', '정산 원가 인식', REG_BY, REG_DATE]
  );
  ins('st_erp_voucher_line',
    ['erp_voucher_line_id','erp_voucher_id','line_no','account_cd','account_nm',
     'cost_center_cd','debit_amt','credit_amt','ref_type_cd','line_memo','reg_by','reg_date'],
    [mkId('EVL',evlSeq++), evId, 3, '7200', '수수료수익(플랫폼)',
     'CC002', 0, commAmt, 'SETTLE', '플랫폼 수수료 수익', REG_BY, REG_DATE]
  );
}

for (const v of VENDORS) {
  for (const ym of ['2026-01', '2026-02']) {
    const k    = `${v.id}__${ym}`;
    const evId = erpVoucherIdMap[`${k}__SETTLE`];
    if (!evId) continue;
    const data = settleMap[k];
    const net  = data.orderAmt - data.returnAmt;
    const comm = Math.round(net * v.rate / 100);
    const adj    = (ADJ_MAP[k] || {}).adj    || 0;
    const etcAdj = (ADJ_MAP[k] || {}).etcAdj || 0;
    const finalAmt = (net - comm) + adj + etcAdj;
    if (finalAmt > 0) addVoucherLines(evId, finalAmt, comm, Math.abs(adj + etcAdj));
  }
}

// ════════════════════════════════════════════════════════════
// 11. st_recon — 정산 대사
// ════════════════════════════════════════════════════════════
sec('11. st_recon — 정산 대사');
let rcSeq = 1;

// 1월 완료된 정산 대사 (MATCHED)
for (const v of VENDORS) {
  const k   = `${v.id}__2026-01`;
  const sid = settleIdMap[k];
  const data = settleMap[k];
  ins('st_recon',
    ['recon_id','site_id','vendor_id','recon_type_cd','recon_status_cd','recon_status_cd_before',
     'settle_id','settle_period','expected_amt','actual_amt','diff_amt',
     'recon_note','resolved_by','resolved_date','reg_by','reg_date'],
    [mkId('RCN',rcSeq++), SITE, v.id, 'ORDER', 'MATCHED', 'MISMATCH',
     sid, '2026-01', data.orderAmt, data.orderAmt, 0,
     '자동 대사 완료', 'US000001', '2026-02-03 10:00:00', REG_BY, REG_DATE]
  );
}

// 2월 정산 대사 (일부 MISMATCH)
const recon02 = [
  { vn:'VN000001', status:'MATCHED',  diff:0,    note:'정산 일치' },
  { vn:'VN000002', status:'MATCHED',  diff:0,    note:'정산 일치' },
  { vn:'VN000003', status:'MISMATCH', diff:-2000, note:'환불 처리 지연으로 차이 발생 - 검토 필요' },
  { vn:'VN000004', status:'MATCHED',  diff:0,    note:'정산 일치' },
];
for (const r of recon02) {
  const k   = `${r.vn}__2026-02`;
  const sid = settleIdMap[k];
  const data = settleMap[k];
  ins('st_recon',
    ['recon_id','site_id','vendor_id','recon_type_cd','recon_status_cd','recon_status_cd_before',
     'settle_id','settle_period','expected_amt','actual_amt','diff_amt',
     'recon_note','resolved_by','resolved_date','reg_by','reg_date'],
    [mkId('RCN',rcSeq++), SITE, r.vn, 'ORDER', r.status, 'PENDING',
     sid, '2026-02', data.orderAmt - data.returnAmt,
     (data.orderAmt - data.returnAmt) + r.diff, r.diff,
     r.note,
     r.status === 'MATCHED' ? 'US000001' : null,
     r.status === 'MATCHED' ? '2026-03-03 11:00:00' : null,
     REG_BY, REG_DATE]
  );
}

// ── 출력 ─────────────────────────────────────────────────────
const header = [
  '-- ================================================================',
  '-- st_* 정산 도메인 샘플 데이터',
  '-- 생성: generate_sample_sql_st.js',
  '-- 스키마: shopjoy_2604',
  '-- 정산 기간: 2026-01(PAID) / 2026-02(CLOSED) / 2026-03(CONFIRMED)',
  '-- 판매업체: VN000001-VN000004',
  '-- ================================================================',
  'SET search_path TO shopjoy_2604;',
  '',
];

const output = header.join('\n') + lines.join('\n') + '\n';
const outFile = path.resolve(__dirname, 'sample_data_st.sql');
fs.writeFileSync(outFile, output, 'utf8');

const cnt = lines.filter(l => l.startsWith('INSERT')).length;
console.log(`완료: ${cnt}개 INSERT → ${outFile}`);
console.log('\n[정산 마스터 요약]');
for (const p of PERIODS) {
  console.log(`\n  ${p.ymDash} (${p.status})`);
  for (const v of VENDORS) {
    const k = `${v.id}__${p.ymDash}`;
    const d = settleMap[k];
    const net  = d.orderAmt - d.returnAmt;
    const comm = Math.round(net * v.rate / 100);
    const adj    = (ADJ_MAP[k] || {}).adj    || 0;
    const etcAdj = (ADJ_MAP[k] || {}).etcAdj || 0;
    const final  = (net - comm) + adj + etcAdj;
    console.log(`    ${v.id} ${v.nm.padEnd(8)}: 주문${d.orderAmt.toLocaleString()} - 반품${d.returnAmt.toLocaleString()} - 수수료${comm.toLocaleString()} ± 조정${(adj+etcAdj).toLocaleString()} = 최종${final.toLocaleString()}원`);
  }
}
