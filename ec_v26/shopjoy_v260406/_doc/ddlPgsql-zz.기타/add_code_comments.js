/**
 * DDL 파일 하단에 _cd 컬럼 코드값 주석 추가
 * 실행: node _doc/add_code_comments.js
 */
const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');
const ADMIN_DATA = path.join(BASE, 'pages/admin/AdminData.js');

// ── 1. adminData.js에서 코드값 파싱 ──────────────────────────
function buildCodeMap() {
  const src = fs.readFileSync(ADMIN_DATA, 'utf8');
  const map = {}; // { GROUP: [ {val, label}, ... ] }

  // grpNm 맵 (그룹명 한글)
  const grpNmMap = {};
  const grpPattern = /codeGrp:\s*'([^']+)'[^}]*?grpNm:\s*'([^']+)'/g;
  let m;
  while ((m = grpPattern.exec(src)) !== null) {
    if (!grpNmMap[m[1]]) grpNmMap[m[1]] = m[2];
  }

  // codeId 라인에서 codeGrp + codeValue + codeLabel 추출
  const linePattern = /codeId\s*:\s*\d+[^}]*?codeGrp\s*:\s*'([^']+)'[^}]*?codeLabel\s*:\s*'([^']+)'[^}]*?codeValue\s*:\s*'([^']+)'/g;
  while ((m = linePattern.exec(src)) !== null) {
    const [, grp, label, val] = m;
    if (!map[grp]) map[grp] = [];
    map[grp].push({ val, label });
  }
  return { map, grpNmMap };
}

// ── 2. DDL 파일 파싱: COMMENT ON COLUMN에서 코드그룹 추출 ──────
function extractCdColumns(sqlContent) {
  const result = []; // [ {tbl, col, comment, codeGrp} ]

  // COMMENT ON COLUMN tbl.col IS '...(코드: GRP)...'
  const re = /COMMENT\s+ON\s+COLUMN\s+(\w+)\.(\w+)\s+IS\s+'([^']+)'/g;
  let m;
  while ((m = re.exec(sqlContent)) !== null) {
    const [, tbl, col, comment] = m;
    if (!col.endsWith('_cd')) continue;
    // 코드그룹 추출: (코드: GRP) 또는 코드그룹: GRP
    const codeMatch = comment.match(/[（(]코드[：:]\s*([A-Z_]+)/);
    if (!codeMatch) continue;
    result.push({ tbl, col, comment: comment.replace(/\s*[（(]코드[：:][^）)]+[）)]/g, '').trim(), codeGrp: codeMatch[1] });
  }
  return result;
}

// ── 3. 주석 블록 생성 ─────────────────────────────────────────
function buildCommentBlock(cdCols, codeMap, grpNmMap) {
  if (cdCols.length === 0) return '';

  const lines = ['', '-- ============================================================'];
  lines.push('-- 코드값 참조');
  lines.push('-- ============================================================');

  for (const { tbl, col, comment, codeGrp } of cdCols) {
    const codes = codeMap[codeGrp];
    const grpNm = grpNmMap[codeGrp] || codeGrp;
    if (!codes || codes.length === 0) {
      lines.push(`-- [CODES] ${tbl}.${col} (${comment || col}) : ${grpNm}(${codeGrp}) { 코드값 미정의 }`);
      continue;
    }
    const vals = codes.map(c => `${c.val}:${c.label}`).join(', ');
    lines.push(`-- [CODES] ${tbl}.${col} (${comment || col}) : ${grpNm} { ${vals} }`);
  }
  return lines.join('\n') + '\n';
}

// ── 4. 대상 폴더 처리 ────────────────────────────────────────
const TARGET_DIRS = [
  'ddlPgsql-ec-cm', 'ddlPgsql-ec-dp', 'ddlPgsql-ec-mb',
  'ddlPgsql-ec-od', 'ddlPgsql-ec-pd', 'ddlPgsql-ec-pm',
  'ddlPgsql-ec-st', 'ddlPgsql-sy',
];

const MARKER = '-- 코드값 참조';

function processDir(dirPath, codeMap, grpNmMap) {
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.sql'));
  let count = 0;
  for (const file of files) {
    const fp = path.join(dirPath, file);
    let content = fs.readFileSync(fp, 'utf8');

    // 기존 코드값 주석 제거 (재실행 안전)
    const markerIdx = content.indexOf('\n-- ============================================================\n-- ' + MARKER.slice(3));
    if (markerIdx !== -1) content = content.slice(0, markerIdx);

    const cdCols = extractCdColumns(content);
    if (cdCols.length === 0) continue;

    const block = buildCommentBlock(cdCols, codeMap, grpNmMap);
    fs.writeFileSync(fp, content.trimEnd() + '\n' + block);
    console.log(`✓ ${file} (${cdCols.length}개 _cd 컬럼)`);
    count++;
  }
  return count;
}

// ── 실행 ─────────────────────────────────────────────────────
const { map: codeMap, grpNmMap } = buildCodeMap();
console.log(`코드그룹 ${Object.keys(codeMap).length}개 로드`);

let total = 0;
for (const dir of TARGET_DIRS) {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) continue;
  console.log(`\n── ${dir} ──`);
  total += processDir(dirPath, codeMap, grpNmMap);
}
console.log(`\n완료: ${total}개 파일 업데이트`);
