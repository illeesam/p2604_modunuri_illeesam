/**
 * AdminData.js → PostgreSQL INSERT SQL 생성기
 *
 * 사용법:
 *   node _doc/generate_sample_sql.js
 *   → _doc/sample_data.sql 생성
 *
 * 생성 대상 테이블 (의존성 순서):
 *   1. sy_site       (sites)
 *   2. sy_brand      (brands)
 *   3. sy_code_grp   (codeGroups)
 *   4. sy_code       (codes)
 *   5. sy_dept       (depts)
 *   6. sy_role       (roles)
 *   7. sy_user       (adminUsers)  — password: 'demo1234' (BCrypt)
 *   8. mb_member     (members)     — password: 'demo1234' (BCrypt)
 *   9. sy_vendor     (vendors)
 *  10. sy_batch      (batches)
 *
 * ID 규칙: PREFIX + 6자리 순번 (예: SITE000001, BR000001)
 * 비밀번호: BCrypt($2a$10$) — 'demo1234' 공통
 *
 * 스키마: shopjoy_2604
 */

'use strict';
const fs   = require('fs');
const path = require('path');

// ── AdminData.js 로드 ────────────────────────────────────────────
global.Vue    = { reactive: (x) => x };
global.window = {};
require(path.resolve(__dirname, '../pages/admin/AdminData.js'));
const D = global.window.adminData;

// ── 상수 ────────────────────────────────────────────────────────
const SCHEMA       = 'shopjoy_2604';
const DEMO_PW_HASH = '$2a$10$FEUkwiSIpauYmAIXDdnS2un0sWBYixg9Q7CZ3e7eOpmi8ng9FQOoO';
const REG_BY       = 'SYSTEM';
const REG_DATE     = '2026-04-20 00:00:00';

// ── ID 생성 헬퍼 ────────────────────────────────────────────────
const siteIdMap   = {};
const brandIdMap  = {};
const codeGrpMap  = {};  // codeGrp string → DB id
const deptIdMap   = {};
const roleIdMap   = {};
const userIdMap   = {};
const vendorIdMap = {};

const mkId = (prefix, n) => `${prefix}${String(n).padStart(6, '0')}`;

// ── SQL 유틸 ────────────────────────────────────────────────────
const esc  = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number')  return String(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  return `'${String(v).replace(/'/g, "''")}'`;
};
const ts   = (s) => s ? `'${s.replace('T', ' ')}'` : 'NULL';
const date = (s) => s ? `'${s}'` : 'NULL';

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
// 1. sy_site
// ────────────────────────────────────────────────────────────────
section('1. sy_site — 사이트');
const statusMap = { '운영중': 'ACTIVE', '점검중': 'MAINTENANCE', '비활성': 'INACTIVE' };
const siteTypeMap = {
  '이커머스':'EC','숙박공유':'EC','전문가연결':'EC','IT매칭':'EC','부동산':'EC',
  '교육':'EC','중고거래':'EC','영화예매':'EC','음식배달':'EC','가격비교':'EC',
  '시각화':'EC','홈페이지':'EC',
};
D.sites.forEach((s, i) => {
  const id = mkId('SITE', i + 1);
  siteIdMap[s.siteId] = id;
  insert('sy_site',
    ['site_id','site_code','site_type_cd','site_nm','site_domain','site_email','site_phone',
     'site_address','site_business_no','site_ceo','site_status_cd','reg_by','reg_date'],
    [id, s.siteCode, siteTypeMap[s.siteType] || 'EC', s.siteNm, s.domain,
     s.email, s.phone, s.address, s.businessNo, s.ceo,
     statusMap[s.status] || 'ACTIVE', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 2. sy_brand
// ────────────────────────────────────────────────────────────────
section('2. sy_brand — 브랜드');
D.brands.forEach((b, i) => {
  const id = mkId('BR', i + 1);
  brandIdMap[b.brandId] = id;
  insert('sy_brand',
    ['brand_id','brand_code','brand_nm','brand_en_nm','sort_ord','use_yn','brand_remark','reg_by','reg_date'],
    [id, b.brandCode, b.brandNm, b.brandEnNm || b.brandNm, b.sortOrd || i+1,
     b.useYn || 'Y', b.remark || null, REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 3. sy_code_grp
// ────────────────────────────────────────────────────────────────
section('3. sy_code_grp — 코드 그룹');
const siteId1 = siteIdMap[1]; // ShopJoy 사이트
D.codeGroups.forEach((g, i) => {
  const id = mkId('CG', i + 1);
  codeGrpMap[g.codeGrp] = id;
  insert('sy_code_grp',
    ['code_grp_id','site_id','code_grp','grp_nm','disp_path','code_grp_desc','use_yn','reg_by','reg_date'],
    [id, siteId1, g.codeGrp, g.grpNm, g.dispPath || null, g.description || null,
     g.useYn || 'Y', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 4. sy_code
// ────────────────────────────────────────────────────────────────
section('4. sy_code — 공통 코드');
let codeSeq = 1;
D.codes.forEach((c) => {
  const id = mkId('CD', codeSeq++);
  insert('sy_code',
    ['code_id','site_id','code_grp','code_value','code_label','sort_ord','use_yn','code_remark','reg_by','reg_date'],
    [id, siteId1, c.codeGrp, c.codeValue || c.value, c.codeLabel || c.label || c.codeValue,
     c.sortOrd || 0, c.useYn || 'Y', c.remark || null, REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 5. sy_dept (자기참조 — 2패스)
// ────────────────────────────────────────────────────────────────
section('5. sy_dept — 부서');
const deptTypeMap = { '경영':'MGT','기술':'TECH','마케팅':'MKT','운영':'OPS','CS':'CS','물류':'LOGISTICS','재무':'FINANCE','인사':'HR','법무':'LEGAL' };
// 1패스: 등록
D.depts.forEach((d, i) => {
  const id = mkId('DP', i + 1);
  deptIdMap[d.deptId] = id;
});
// 2패스: INSERT
D.depts.forEach((d) => {
  const id      = deptIdMap[d.deptId];
  const parentId = d.parentId ? deptIdMap[d.parentId] : null;
  insert('sy_dept',
    ['dept_id','dept_code','dept_nm','parent_dept_id','sort_ord','use_yn','dept_remark','reg_by','reg_date'],
    [id, d.deptCode, d.deptNm, parentId, d.sortOrd || 0, d.useYn || 'Y',
     d.remark || null, REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 6. sy_role (자기참조 — 2패스)
// ────────────────────────────────────────────────────────────────
section('6. sy_role — 역할');
// 1패스: ID 등록
D.roles.forEach((r) => {
  roleIdMap[r.roleId] = mkId('RL', r.roleId);
});
// 2패스: INSERT (정렬 후)
const sortedRoles = [...D.roles].sort((a, b) => {
  if (a.parentId === null && b.parentId !== null) return -1;
  if (a.parentId !== null && b.parentId === null) return  1;
  return (a.sortOrd || 0) - (b.sortOrd || 0);
});
sortedRoles.forEach((r) => {
  const id       = roleIdMap[r.roleId];
  const parentId = r.parentId ? roleIdMap[r.parentId] : null;
  insert('sy_role',
    ['role_id','role_code','role_nm','parent_role_id','sort_ord','use_yn','role_remark','disp_path','reg_by','reg_date'],
    [id, r.roleCode, r.roleNm, parentId, Math.round(r.sortOrd || 0),
     r.useYn || 'Y', r.remark || null, r.dispPath || null, REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 7. sy_user
// ────────────────────────────────────────────────────────────────
section('7. sy_user — 관리자 사용자 (비밀번호: demo1234)');
// 역할명 → roleId 역맵
const roleNmMap = {};
D.roles.forEach(r => { roleNmMap[r.roleNm] = roleIdMap[r.roleId]; });
const deptNmMap = {};
D.depts.forEach(d => { deptNmMap[d.deptNm] = deptIdMap[d.deptId]; });
// 한글 역할명 매핑 보강
const roleAliasMap = {
  '슈퍼관리자':'슈퍼관리자 역할','관리자':'시스템관리자','운영자':'사이트운영자',
  '영업관리자':'상품관리자','일반사용자':'읽기전용','매니저':'관리자',
  '뷰어':'읽기전용','차단':'차단전용','대표자':'대표자','경영':'경영담당자',
  '담당자':'사이트담당자','콜센터':'콜센터','CS관리자':'고객지원관리자',
  'CS시니어':'수석 상담사','상담사':'상담사','기술총괄':'기술 총괄',
  '개발자':'개발자','기술지원':'기술지원 담당','감리':'보안 감리','마케팅':'마케팅관리자',
  '상품관리자':'상품관리자','주문관리자':'주문관리자','CS관리자':'고객지원관리자',
};
const userStatusMap = { '활성':'ACTIVE','비활성':'INACTIVE','정지':'SUSPENDED' };
D.adminUsers.forEach((u, i) => {
  const id     = mkId('US', i + 1);
  userIdMap[u.adminUserId] = id;
  const roleNm = roleAliasMap[u.role] || u.role;
  const roleId = roleNmMap[roleNm] || roleNmMap[u.role] || null;
  const deptId = deptNmMap[u.dept] || null;
  insert('sy_user',
    ['user_id','site_id','login_id','user_password','user_nm','user_email','user_phone',
     'dept_id','role_id','user_status_cd','reg_by','reg_date'],
    [id, siteId1, u.loginId, DEMO_PW_HASH, u.name, u.email, u.phone,
     deptId, roleId, userStatusMap[u.status] || 'ACTIVE', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 8. mb_member
// ────────────────────────────────────────────────────────────────
section('8. mb_member — 회원 (비밀번호: demo1234)');
const gradeMap  = { 'VIP':'VIP','우수':'SILVER','일반':'BASIC' };
const memStMap  = { '활성':'ACTIVE','정지':'SUSPENDED','탈퇴':'WITHDRAWN' };
D.members.forEach((m, i) => {
  const id = mkId('MB', i + 1);
  insert('mb_member',
    ['member_id','site_id','member_email','member_password','member_nm','member_phone',
     'grade_cd','member_status_cd','order_count','total_purchase_amt','reg_by','reg_date'],
    [id, siteId1, m.email, DEMO_PW_HASH, m.memberNm, m.phone,
     gradeMap[m.grade] || 'BASIC', memStMap[m.status] || 'ACTIVE',
     m.orderCount || 0, m.totalPurchase || 0, REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 9. sy_vendor
// ────────────────────────────────────────────────────────────────
section('9. sy_vendor — 업체');
if (D.vendors && D.vendors.length > 0) {
  const vendorStMap = { '활성':'ACTIVE','비활성':'INACTIVE','계약중':'ACTIVE','계약종료':'INACTIVE' };
  D.vendors.forEach((v, i) => {
    const id = mkId('VN', i + 1);
    vendorIdMap[v.vendorId] = id;
    insert('sy_vendor',
      ['vendor_id','site_id','vendor_no','vendor_nm','ceo_nm','vendor_phone','vendor_email',
       'vendor_addr','contract_date','vendor_status_cd','reg_by','reg_date'],
      [id, siteId1, v.bizNo || `${String(i+1).padStart(3,'0')}-00-00000`,
       v.vendorNm || v.name, v.ceo || null, v.phone || null, v.email || null,
       v.address || null, date(v.contractDate), vendorStMap[v.status] || 'ACTIVE', REG_BY, REG_DATE]
    );
  });
}

// ────────────────────────────────────────────────────────────────
// 10. sy_batch
// ────────────────────────────────────────────────────────────────
section('10. sy_batch — 배치');
const batchStMap   = { '활성':'ACTIVE','비활성':'INACTIVE' };
const batchRunStMap = { '성공':'SUCCESS','실패':'FAIL','실행중':'RUNNING','대기':'PENDING' };
D.batches.forEach((b, i) => {
  const id = mkId('BT', i + 1);
  insert('sy_batch',
    ['batch_id','site_id','batch_code','batch_nm','batch_desc','cron_expr',
     'batch_status_cd','batch_run_status','batch_run_count','reg_by','reg_date'],
    [id, siteId1, b.batchCode, b.batchNm, b.description || null, b.cron,
     batchStMap[b.status] || 'ACTIVE',
     batchRunStMap[b.runStatus] || 'PENDING',
     b.runCount || 0, REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────────────────
// 출력
// ────────────────────────────────────────────────────────────────
const header = [
  '-- ================================================================',
  '-- AdminData.js → PostgreSQL 샘플 데이터',
  '-- 생성: generate_sample_sql.js',
  '-- 스키마: shopjoy_2604',
  '-- 비밀번호: demo1234 (BCrypt 해시)',
  '-- 실행 순서: sy_site → sy_brand → sy_code_grp → sy_code',
  '--            → sy_dept → sy_role → sy_user',
  '--            → mb_member → sy_vendor → sy_batch',
  '-- ================================================================',
  'SET search_path TO shopjoy_2604;',
  '',
];

const output = header.join('\n') + lines.join('\n') + '\n';
const outFile = path.resolve(__dirname, 'sample_data.sql');
fs.writeFileSync(outFile, output, 'utf8');

const cnt = lines.filter(l => l.startsWith('INSERT')).length;
console.log(`완료: ${cnt}개 INSERT → ${outFile}`);
