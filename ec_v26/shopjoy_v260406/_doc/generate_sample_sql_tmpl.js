'use strict';
/**
 * sy_template EMAIL 발송 템플릿 샘플 데이터 생성기
 *
 * 소스: _doc/zz참고ec2/sy_mail_tmpl@.txt
 * 형식: CODE<TAB>SUBJECT<TAB>"<HTML...>"  (멀티라인)
 *
 * 사용법:
 *   node _doc/generate_sample_sql_tmpl.js
 *   → _doc/sample_data_tmpl.sql 생성
 *
 * ID 시작: TP000100 (generate_sample_sql_sy.js의 TP000001~010 과 충돌 방지)
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
  return `'${String(v).replace(/'/g, "''")}'`;
};

// ── 파일 파싱 ─────────────────────────────────────────────────
// 형식: CODE\tSUBJECT\t"<HTML...>"\n  (멀티라인, 마지막 행 끝이 " 로 닫힘)
const raw  = fs.readFileSync(
  path.resolve(__dirname, 'zz참고ec2/sy_mail_tmpl@.txt'), 'utf8'
);
const rawLines = raw.split('\n');

const templates = [];
let cur = null;

for (const line of rawLines) {
  const parts = line.split('\t');
  if (parts.length >= 2 && /^[A-Z][A-Z0-9_]+$/.test(parts[0].trim())) {
    if (cur) templates.push(cur);
    const code    = parts[0].trim();
    const subject = parts[1].trim();
    let contentStart = parts.slice(2).join('\t');
    if (contentStart.startsWith('"')) contentStart = contentStart.slice(1);
    cur = { code, subject, buf: [contentStart] };
  } else if (cur) {
    cur.buf.push(line);
  }
}
if (cur) templates.push(cur);

// content 조합 + 후행 " 제거 + 줄바꿈 제거 (SQL 파서 오파싱 방지)
for (const t of templates) {
  let c = t.buf.join('\n');
  if (c.trimEnd().endsWith('"')) c = c.trimEnd().slice(0, -1);
  // HTML은 개행 무관하게 렌더링되므로 단일행으로 압축
  c = c.replace(/\r?\n/g, ' ').replace(/  +/g, ' ').trim();
  t.content = c;
  delete t.buf;
}

// ── 중복 제거 (template_code 첫 번째 우선) ────────────────────
const seen   = new Set();
const unique = [];
for (const t of templates) {
  if (!seen.has(t.code)) {
    seen.add(t.code);
    unique.push(t);
  }
}

// ── 치환변수 추출 → sample_params JSON ─────────────────────────
// [[${varName}]] 패턴 (Thymeleaf 스타일)
function extractParams(content) {
  const vars = new Set();
  for (const m of content.matchAll(/\[\[\$\{(\w+)\}\]\]/g)) vars.add(m[1]);
  if (!vars.size) return null;
  return JSON.stringify(Object.fromEntries([...vars].map(v => [v, `{${v}}`])));
}

// ── 템플릿명 한글 매핑 ────────────────────────────────────────
const NM = {
  BO_TEMPORARY_PASSWORD:      'BO 임시비밀번호 발급',
  WELCOME_BNFT:               '웰컴 혜택 지급',
  BIRTHDAY_BNFT:              '생일 축하 혜택 지급',
  ORD_COMPLETE:               '주문완료',
  SAVE_POINT_EXPR_PLAN:       '마일리지 소멸 예정 안내',
  MEM_WITHDRAW:               '회원탈퇴',
  APPLY_STORE_REJECT:         '업체 입점 보류',
  APPLY_STORE_APPROVED:       '업체 입점 승인',
  ORD_CNSL_REQ:               '렌탈/상담 신청 내역',
  PRD_QNA_ANSW:               '상품 Q&A 답변 등록',
  CS_QNA_ANSW:                '1:1 문의 답변 등록',
  MEM_DMNT_CHG_SCHD:          '휴면회원 전환 예정',
  RTN_CLAIM_REQUEST_AUTO:     '반품신청 (수거요청)',
  RTN_CLAIM_REQUEST_DIRECT:   '반품신청 (직접발송)',
  PRD_QNA_CREATE:             '상품 Q&A 등록',
  MKT_RCV_INFO:               '개인정보 이용 내역 안내',
  MKT_RCV_INFO_REAGREE:       '마케팅 정보 수신동의',
  CS_QNA_CREATE:              '1:1 문의 등록',
  MEM_JOIN:                   '회원가입 환영',
  AUTH_TRANSITION:            '인증회원 전환',
  EMAIL_AUTH:                 '이메일 계정 인증',
  TEMPORARY_PASSWORD:         '임시비밀번호 발급',
  EXCHG_CLAIM_REQUEST_DIRECT: '교환신청 (직접발송)',
  EXCHG_CLAIM_REQUEST:        '교환신청 (수거요청)',
  MEM_JOIN_BNFT:              '회원가입 혜택 지급',
  BUY_CONFIRM:                '구매확정',
  ORD_NON_DEPOSIT:            '주문취소 (미입금)',
  ORD_COMPLETE_DEPOSIT:       '주문완료 (입금확인)',
  STAFF_TEMPORARY_PASSWORD:   '임직원 임시비밀번호 발급',
};

// ── disp_path 분류 ───────────────────────────────────────────
function dispPath(code) {
  if (/^(MEM_|AUTH_|EMAIL_|TEMPORARY_PASSWORD|BO_|STAFF_)/.test(code)) return '회원.이메일';
  if (/^ORD_/.test(code)) return '주문.이메일';
  if (/^(RTN_|EXCHG_|ORD_CNSL_)/.test(code)) return '클레임.이메일';
  if (/^PRD_/.test(code)) return '상품.이메일';
  if (/^CS_/.test(code)) return '고객센터.이메일';
  if (/^(MKT_|SAVE_|BIRTHDAY_|WELCOME_|.*BNFT)/.test(code)) return '프로모션.이메일';
  if (/^APPLY_/.test(code)) return '업체.이메일';
  return '공통.이메일';
}

// ── SQL 생성 ─────────────────────────────────────────────────
const sqlLines = [];
sqlLines.push('');
sqlLines.push('-- ================================================================');
sqlLines.push('-- sy_template — EMAIL 발송 템플릿 (sy_mail_tmpl@.txt)');
sqlLines.push('-- ================================================================');

// '아이디룩몰' → 'ShopJoy' 치환 함수
const brandify = (s) => s ? s.replace(/아이디룩몰/g, 'ShopJoy').replace(/아이디룩/g, 'ShopJoy') : s;

let seq = 100; // TP000100 부터 (sy 생성기의 TP000001~010 과 분리)
for (const t of unique) {
  const id      = mkId('TP', seq++);
  const nm      = NM[t.code] || t.code;
  const subject = brandify(t.subject);
  const content = brandify(t.content);
  const params  = extractParams(content);
  sqlLines.push(
    `INSERT INTO ${SCHEMA}.sy_template ` +
    `(template_id, site_id, template_type_cd, template_code, template_nm, template_subject, template_content, sample_params, use_yn, disp_path, reg_by, reg_date) ` +
    `VALUES (${esc(id)}, ${esc(SITE)}, 'EMAIL', ${esc(t.code)}, ${esc(nm)}, ${esc(subject)}, ${esc(content)}, ${esc(params)}, 'Y', ${esc(dispPath(t.code))}, ${esc(REG_BY)}, ${esc(REG_DATE)}) ` +
    `ON CONFLICT (template_type_cd, template_code) DO UPDATE ` +
    `SET template_subject = EXCLUDED.template_subject, template_content = EXCLUDED.template_content, ` +
    `sample_params = EXCLUDED.sample_params, upd_by = '${REG_BY}', upd_date = '${REG_DATE}';`
  );
}

// ── 출력 ────────────────────────────────────────────────────
const header = [
  '-- ================================================================',
  '-- sy_template EMAIL 발송 템플릿 샘플 데이터',
  '-- 생성: generate_sample_sql_tmpl.js',
  '-- 소스: zz참고ec2/sy_mail_tmpl@.txt',
  '-- 스키마: shopjoy_2604',
  '-- ================================================================',
  'SET search_path TO shopjoy_2604;',
  '',
];

const output = header.join('\n') + sqlLines.join('\n') + '\n';
const outFile = path.resolve(__dirname, 'sample_data_tmpl.sql');
fs.writeFileSync(outFile, output, 'utf8');

console.log(`완료: 고유 템플릿 ${unique.length}개 → ${outFile}`);
unique.forEach(t => console.log(`  ${t.code.padEnd(35)} | ${t.subject}`));
