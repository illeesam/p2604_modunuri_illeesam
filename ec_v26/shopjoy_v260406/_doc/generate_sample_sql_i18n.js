'use strict';
/**
 * sy_i18n + sy_i18n_msg 샘플 데이터 생성기
 *
 * 소스:
 *   _doc/zz참고ec2/sy_i18n_dtl@.txt     → BO/COMMON 키
 *   _doc/zz참고ec2/sy_i18n_fo_dtl@.txt  → FO/COMMON 키
 *
 * 사용법:
 *   node _doc/generate_sample_sql_i18n.js
 *   → _doc/sample_data_i18n.sql 생성
 */

const fs   = require('fs');
const path = require('path');

const SCHEMA   = 'shopjoy_2604';
const REG_BY   = 'SYSTEM';
const REG_DATE = '2026-04-20 00:00:00';

const mkId = (p, n) => p + String(n).padStart(6, '0');
const esc  = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number')  return String(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  return `'${String(v).replace(/'/g, "''")}'`;
};

// ── 파일 파싱 ──────────────────────────────────────────────────
// 형식: key<TAB>lang<TAB>message
function parseFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const rows = [];
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const parts = t.split('\t');
    if (parts.length < 3) continue;
    rows.push({ key: parts[0].trim(), lang: parts[1].trim(), msg: parts.slice(2).join('\t').trim() });
  }
  return rows;
}

const docDir = path.resolve(__dirname);
const boRows = parseFile(path.join(docDir, 'zz참고ec2/sy_i18n_dtl@.txt'));
const foRows = parseFile(path.join(docDir, 'zz참고ec2/sy_i18n_fo_dtl@.txt'));

// ── 범위(scope) 결정 ──────────────────────────────────────────
function getScope(key, fromFo) {
  if (key.startsWith('commerce.bo')) return 'BO';
  if (key.startsWith('commerce.fo')) return 'FO';
  // FO 파일 전용 키: 인증/로그인 관련
  const foOnly = [
    'AbstractUserDetailsAuthenticationProvider.',
    'common.bt.login', 'common.bt.logout', 'error.common',
  ];
  if (fromFo && foOnly.some(p => key.startsWith(p))) return 'FO';
  return 'COMMON';
}

const getCategory = (key) => key.split('.')[0];

// ── 키맵 구축: key → { scope, category, langs: Map(lang → msg) } ─
const keyMap = new Map();

function mergeRow(key, lang, msg, fromFo) {
  if (!keyMap.has(key)) {
    keyMap.set(key, { scope: getScope(key, fromFo), category: getCategory(key), langs: new Map() });
  }
  keyMap.get(key).langs.set(lang, msg);
}

for (const r of boRows) mergeRow(r.key, r.lang, r.msg, false);
for (const r of foRows) mergeRow(r.key, r.lang, r.msg, true);

// ── SQL 생성 ──────────────────────────────────────────────────
const lines = [];
const section = (t) => {
  lines.push('');
  lines.push('-- ================================================================');
  lines.push(`-- ${t}`);
  lines.push('-- ================================================================');
};

section('sy_i18n — 다국어 키 마스터');
let i18nSeq = 1;
const i18nIdMap = new Map();

for (const [key, { scope, category }] of keyMap) {
  const id = mkId('I8', i18nSeq++);
  i18nIdMap.set(key, id);
  lines.push(
    `INSERT INTO ${SCHEMA}.sy_i18n ` +
    `(i18n_id, site_id, i18n_key, i18n_scope_cd, i18n_category, sort_ord, use_yn, reg_by, reg_date) ` +
    `VALUES (${esc(id)}, NULL, ${esc(key)}, ${esc(scope)}, ${esc(category)}, 0, 'Y', ${esc(REG_BY)}, ${esc(REG_DATE)}) ` +
    `ON CONFLICT DO NOTHING;`
  );
}

section('sy_i18n_msg — 언어별 번역 메시지');
let msgSeq = 1;

for (const [key, { langs }] of keyMap) {
  const i18nId = i18nIdMap.get(key);
  for (const [lang, msg] of langs) {
    const id = mkId('IM', msgSeq++);
    lines.push(
      `INSERT INTO ${SCHEMA}.sy_i18n_msg ` +
      `(i18n_msg_id, i18n_id, lang_cd, i18n_msg, reg_by, reg_date) ` +
      `VALUES (${esc(id)}, ${esc(i18nId)}, ${esc(lang)}, ${esc(msg)}, ${esc(REG_BY)}, ${esc(REG_DATE)}) ` +
      `ON CONFLICT DO NOTHING;`
    );
  }
}

// ── 출력 ──────────────────────────────────────────────────────
const header = [
  '-- ================================================================',
  '-- sy_i18n + sy_i18n_msg 샘플 데이터',
  '-- 생성: generate_sample_sql_i18n.js',
  '-- 소스: zz참고ec2/sy_i18n_dtl@.txt',
  '--       zz참고ec2/sy_i18n_fo_dtl@.txt',
  '-- 스키마: shopjoy_2604',
  '-- ================================================================',
  'SET search_path TO shopjoy_2604;',
  '',
];

const output = header.join('\n') + lines.join('\n') + '\n';
const outFile = path.resolve(__dirname, 'sample_data_i18n.sql');
fs.writeFileSync(outFile, output, 'utf8');

const insCount = lines.filter(l => l.startsWith('INSERT')).length;
const keyCount = keyMap.size;
const msgCount = [...keyMap.values()].reduce((s, v) => s + v.langs.size, 0);
console.log(`완료: i18n 키 ${keyCount}개, 메시지 ${msgCount}개, 총 ${insCount}개 INSERT → ${outFile}`);
