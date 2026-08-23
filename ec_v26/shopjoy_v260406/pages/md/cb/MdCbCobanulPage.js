/* ShopJoy FO 모듈 - 코바늘 도안 상세/편집 (격자 편집기 + 한글 도안 설명 생성)
   목록 화면(MdCbPatternListPage)에서 "?view=editor&patternId=xxx" 로 진입 — patternId 없으면 신규 작성. */

/* fnGenDescText — 격자(cells) → 한글 도안 설명 텍스트 생성.
   같은 단(row) 안에서 연속으로 같은 기호가 나오면 "기호명 N코"로 묶는다.
   예: 1단: 사슬뜨기 12코 / 2단: 짧은뜨기 5코, 2코늘리기 1코, 짧은뜨기 6코 */
function fnGenDescText(rowCount, colCount, cellMap, symbolMap) {
  const lines = [];
  for (let r = 1; r <= rowCount; r++) {
    const groups = [];
    for (let c = 1; c <= colCount; c++) {
      const cell = cellMap[r + '_' + c];
      const symbolId = cell ? cell.symbolId : null;
      if (!symbolId) continue;
      const last = groups[groups.length - 1];
      if (last && last.symbolId === symbolId) { last.count++; }
      else { groups.push({ symbolId, count: 1 }); }
    }
    if (groups.length === 0) continue;
    const partText = groups.map(g => {
      const sym = symbolMap[g.symbolId];
      const nm = sym ? sym.symbolNm : '?';
      return nm + ' ' + g.count + '코';
    }).join(', ');
    lines.push(r + '단: ' + partText);
  }
  return lines.join('\n');
}

/* ══════════════════════════ 기호 SVG 아이콘 생성기 ══════════════════════════
   유니코드에는 코바늘 도안 기호(부채꼴, 방울 모양 등)에 대응하는 글자가 없어서, symbol_char
   텍스트 대신 symbol_cd taxonomy 기준으로 24x24 라인아트 SVG를 그때그때 조합해 그린다.
   "사용자 제공 코바늘_기호_확정본_모음 PDF" 의 실제 도안 모양을 최대한 그대로 따른다.
   매칭되는 cd가 없으면 null을 반환해 symbolChar 텍스트로 폴백한다. */
const CB_SVG_STROKE = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';

/* fnPostHead — 세로 기둥 기호(짧은뜨기~네길긴뜨기). ticks=기둥에 그어지는 사선 개수(0=긴뜨기).
   wideBar=true 면 긴뜨기처럼 위쪽에 넓은 가로바, false 면 한길긴뜨기 이상처럼 짧은 캡. */
function fnPostHead(cx, ticks, wideBar) {
  const topY = 6, botY = 20;
  let s = `<line x1="${cx}" y1="${botY}" x2="${cx}" y2="${topY}"/>`;
  s += wideBar ? `<line x1="${cx - 4}" y1="${topY}" x2="${cx + 4}" y2="${topY}"/>`
               : `<line x1="${cx - 2}" y1="${topY}" x2="${cx + 2}" y2="${topY}"/>`;
  for (let i = 0; i < ticks; i++) {
    const y = topY + 4 + i * 3.4;
    s += `<line x1="${cx - 2.6}" y1="${y + 1.6}" x2="${cx + 2.6}" y2="${y - 1.6}"/>`;
  }
  return s;
}

/* fnCross — 교차뜨기(X자). ticks=각 다리 위쪽에 그어지는 사선 개수(짧은뜨기·긴뜨기=0). */
function fnCross(ticks) {
  let s = '<line x1="6" y1="20" x2="18" y2="7"/><line x1="18" y1="20" x2="6" y2="7"/>';
  for (let i = 0; i < ticks; i++) {
    const t = 8 + i * 3;
    s += `<line x1="${9 - i}" y1="${t}" x2="${13 - i}" y2="${t - 3}"/>`;
    s += `<line x1="${15 + i}" y1="${t}" x2="${11 + i}" y2="${t - 3}"/>`;
  }
  return s;
}

/* fnFanUp — 늘려뜨기(1코→N코): 아래 한 점에서 위로 N갈래 부채꼴. legKind: 'x'|'plain'|'tick' */
function fnFanUp(n, legKind) {
  const apex = { x: 12, y: 20 };
  const spread = n === 2 ? 5 : 7;
  let s = '';
  for (let i = 0; i < n; i++) {
    const tx = 12 + (i - (n - 1) / 2) * spread;
    const ty = 7;
    s += `<line x1="${apex.x}" y1="${apex.y}" x2="${tx}" y2="${ty}"/>`;
    if (legKind === 'x') s += `<line x1="${tx - 2}" y1="${ty - 2}" x2="${tx + 2}" y2="${ty + 2}"/><line x1="${tx + 2}" y1="${ty - 2}" x2="${tx - 2}" y2="${ty + 2}"/>`;
    else if (legKind === 'bar') s += `<line x1="${tx - 2.5}" y1="${ty}" x2="${tx + 2.5}" y2="${ty}"/>`;
    else if (legKind === 'tick') { s += `<line x1="${tx - 2.5}" y1="${ty}" x2="${tx + 2.5}" y2="${ty}"/>`; s += `<line x1="${tx - 1.5}" y1="${ty + 4}" x2="${tx + 1.5}" y2="${ty + 1}"/>`; }
  }
  return s;
}

/* fnFanDown — 모아뜨기(N코→1코): 아래 N갈래에서 위 한 점으로 모임 + 위쪽 공유 가로바 */
function fnFanDown(n, legKind) {
  const apex = { x: 12, y: 7 };
  const spread = n >= 4 ? 8 : n === 3 ? 6.5 : 5;
  let s = `<line x1="${apex.x - 4}" y1="${apex.y}" x2="${apex.x + 4}" y2="${apex.y}"/>`;
  for (let i = 0; i < n; i++) {
    const bx = 12 + (i - (n - 1) / 2) * spread;
    s += `<line x1="${bx}" y1="20" x2="${apex.x}" y2="${apex.y}"/>`;
    if (legKind === 'x') s += `<line x1="${bx - 2}" y1="13" x2="${bx + 2}" y2="17"/><line x1="${bx + 2}" y1="13" x2="${bx - 2}" y2="17"/>`;
    else if (legKind === 'tick') s += `<line x1="${bx - 1.8}" y1="15" x2="${bx + 1.8}" y2="12"/>`;
  }
  return s;
}

/* fnHook — 걸어뜨기(앞/뒤걸어뜨기): 세로기둥 + 밑동에 고리(오른쪽/왼쪽으로 여는 갈고리 모양) */
function fnHook(ticks, dir) {
  // 기둥을 y=16까지만 그리고(밑동 4px을 비워), 그 자리에 고리(오른쪽/왼쪽으로 여는 갈고리)를 붙인다
  const s = fnPostHead(12, ticks, ticks === 0).replace('y1="20" x2="12"', 'y1="16" x2="12"');
  const sweep = dir === 'F' ? 1 : 0;
  return s + `<path d="M12 16 A4 4 0 1 ${sweep} ${dir === 'F' ? 15 : 9} 21"/>`;
}

/* fnBobble — 구슬·팝콘뜨기: 뾰족한 타원(잎 모양) + 내부 세로줄 N개 + 위쪽 바. popCap=true 면 팝콘 특유의 작은 캡 타원 추가 */
function fnBobble(n, popCap) {
  let s = `<path d="M12 20 C7 17 7 9 12 6 C17 9 17 17 12 20 Z"/>`;
  for (let i = 0; i < n; i++) {
    const x = 12 + (i - (n - 1) / 2) * (8 / Math.max(n - 1, 1));
    s += `<line x1="${x}" y1="18.5" x2="${x}" y2="7.5"/>`;
  }
  s += popCap ? `<ellipse cx="12" cy="5" rx="2.4" ry="1.3"/>` : `<line x1="9" y1="6" x2="15" y2="6"/>`;
  return s;
}

/* fnRing — 링(원형) 시작점 표시: 밑동에 작은 원 */
function fnRing() { return `<circle cx="12" cy="19" r="2.6"/>`; }

/* fnSymbolSvg — symbolCd → SVG 내부 마크업(<svg> 없이 path/line 만). 매칭 없으면 null */
function fnSymbolSvg(cd) {
  switch (cd) {
    case 'CHAIN': return `<ellipse cx="12" cy="13" rx="7" ry="4"/>`;
    case 'SLIP':  return `<ellipse cx="12" cy="13" rx="5" ry="3" fill="currentColor"/>`;
    case 'SC':    return fnCross(0);
    case 'HDC':   return fnPostHead(12, 0, true);
    case 'DC':    return fnPostHead(12, 1, false);
    case 'TR':    return fnPostHead(12, 2, false);
    case 'DTR':   return fnPostHead(12, 3, false);
    case 'TR4':   return fnPostHead(12, 4, false);
    case 'INC':      return fnFanUp(2, 'plain');
    case 'DEC':      return fnFanDown(2, 'plain');
    case 'SCINC2':   return fnFanUp(2, 'x');
    case 'SCINC3':   return fnFanUp(3, 'x');
    case 'SCDEC2':   return fnFanDown(2, 'x');
    case 'SCDEC3':   return fnFanDown(3, 'x');
    case 'SCFP':     return fnCross(0);
    case 'SCBP':     return fnCross(0);
    case 'HDCINC3':  return fnFanUp(3, 'bar');
    case 'HDCDEC2':  return fnFanDown(2, 'plain');
    case 'HDCDEC3':  return fnFanDown(3, 'plain');
    case 'DCINC2':   return fnFanUp(2, 'tick');
    case 'DCINC3':   return fnFanUp(3, 'tick');
    case 'DCDEC2':   return fnFanDown(2, 'tick');
    case 'DCDEC3':   return fnFanDown(3, 'tick');
    case 'DCDEC4':   return fnFanDown(4, 'tick');
    case 'HDCFP':    return fnHook(0, 'F');
    case 'HDCBP':    return fnHook(0, 'B');
    case 'DCFP':     return fnHook(1, 'F');
    case 'DCBP':     return fnHook(1, 'B');
    case 'HDCCROSS': return fnCross(0);
    case 'DCCROSS':  return fnCross(1);
    case 'DCCROSSR': return fnCross(1);
    case 'DCCROSSL': return fnCross(1);
    case 'TRCROSS':  return fnCross(2);
    case 'DCPUFF3':  return fnBobble(3, false);
    case 'DCPUFF3V': return fnBobble(3, false) + `<circle cx="12" cy="13" r="1" fill="currentColor"/>`;
    case 'TRPUFF5':  return fnBobble(5, false);
    case 'DCPOP5':   return fnBobble(5, true);
    case 'TRPOP6':   return fnBobble(6, true);
    case 'DCFAN5':   return fnFanUp(5, 'bar');
    case 'SHELL':    return fnFanUp(5, 'bar');
    case 'DCXST':    return fnCross(1);
    case 'TRXST':    return fnCross(2);
    case 'BOBBLEDECO': return `<circle cx="12" cy="13" r="3.2"/><line x1="12" y1="6" x2="12" y2="9.5"/><line x1="12" y1="16.5" x2="12" y2="20"/><line x1="6" y1="13" x2="9" y2="13"/><line x1="15" y1="13" x2="18" y2="13"/>`;
    case 'PICOT':    return `<circle cx="12" cy="15" r="3"/><line x1="12" y1="12" x2="12" y2="6"/>`;
    case 'SCRING':   return fnCross(0) + fnRing();
    case 'DCRING':   return fnPostHead(12, 1, false) + fnRing();
    default: return null;
  }
}

/* fnMagicRingIcon — 원형뜨기 시작점(매직링/MR) 전용 나선 아이콘. 작가마다 소용돌이·"M"·동그라미 등
   여러 표기가 쓰이지만(사용자 제공 참고 이미지), 이 화면은 소용돌이 하나로 통일해 표시한다.
   아르키메데스 나선을 다각선으로 근사 — 사슬 원형 시작(속이 빈 원)과 한눈에 구분되게 한다. */
function fnMagicRingIcon() {
  const cx = 12, cy = 12, turns = 1.6, steps = 30, maxR = 7;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * 2 * Math.PI - Math.PI / 2;
    const r = t * maxR;
    const x = (cx + r * Math.cos(angle)).toFixed(1);
    const y = (cy + r * Math.sin(angle)).toFixed(1);
    d += (i === 0 ? 'M' : 'L') + x + ',' + y + ' ';
  }
  return `<svg viewBox="0 0 24 24" class="cb-sym-svg" ${CB_SVG_STROKE}><path d="${d.trim()}"/></svg>`;
}

/* ══════════════════════ "도안을 대표이미지로 첨부" — 자동 썸네일 생성 ══════════════════════
   업로드된 사진 대신, 지금 그려진 도안 자체(격자 또는 원형)를 순수 SVG로 다시 그려 PNG로
   래스터화한다. 화면에 이미 떠 있는 DOM(HTML div 격자 / 겹쳐진 원형 stitch)을 그대로 캡처하는
   대신 데이터(cellMap/cfRoundChart)로부터 새로 그리는 이유: 라이브 DOM 캡처엔 html2canvas 같은
   외부 라이브러리가 필요한데(로컬 CDN 미보유), 우리가 이미 가진 좌표 데이터로 SVG 문자열을
   직접 조립하면 의존성 없이 훨씬 가볍고 정확하게 재현할 수 있다. */
const CB_THUMB_CELL_PX = 24;

/* fnSizeIconSvg — fnSymIcon()/fnMagicRingIcon() 이 만든 <svg viewBox="0 0 24 24" class="cb-sym-svg">
   는 CSS(.cb-sym-svg)로만 크기를 지정하므로, 페이지 스타일시트가 없는 독립 SVG 문서(썸네일 캡처용)
   안에 그대로 넣으면 크기가 깨진다 — width/height 속성을 직접 박아 넣어 크기를 고정한다. */
function fnSizeIconSvg(svgStr, size) {
  return svgStr.replace('viewBox="0 0 24 24"', `viewBox="0 0 24 24" width="${size}" height="${size}"`);
}

/* fnBuildGridThumbSvg — 기호 격자(cellMap)를 그대로 SVG 문서 하나로 재구성 */
function fnBuildGridThumbSvg(rowCount, colCount, cellMap, symbolMap) {
  const cell = CB_THUMB_CELL_PX;
  const w = colCount * cell, h = rowCount * cell;
  let body = '';
  for (let r = 1; r <= rowCount; r++) {
    for (let c = 1; c <= colCount; c++) {
      const x = (c - 1) * cell, y = (r - 1) * cell;
      const data = cellMap[r + '_' + c];
      const fill = data && data.colorHex ? data.colorHex : '#ffffff';
      body += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${fill}" stroke="#e2e2e2" stroke-width="1"/>`;
      const sym = data && data.symbolId ? symbolMap[data.symbolId] : null;
      const inner = sym && sym.symbolCd ? fnSymbolSvg(sym.symbolCd) : null;
      if (inner) {
        const pad = 2, size = cell - pad * 2;
        body += `<g transform="translate(${x + pad},${y + pad})">${fnSizeIconSvg(`<svg viewBox="0 0 24 24" ${CB_SVG_STROKE}>${inner}</svg>`, size)}</g>`;
      }
    }
  }
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#ffffff"/>${body}</svg>`, w, h };
}

/* fnBuildRoundThumbSvg — cfRoundChart 계산 결과(반지름·좌표·아이콘)를 그대로 SVG 문서로 재구성 */
function fnBuildRoundThumbSvg(chart) {
  const { box, half, rounds, start } = chart;
  let body = '';
  rounds.forEach(rd => {
    body += `<circle cx="${half}" cy="${half}" r="${rd.radius}" fill="none" stroke="#ddd" stroke-width="1" stroke-dasharray="3 3"/>`;
    rd.points.forEach(pt => {
      const x = half + pt.x, y = half + pt.y;
      if (pt.svg) body += `<g transform="translate(${x - 11},${y - 11})">${fnSizeIconSvg(pt.svg, 22)}</g>`;
      else body += `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="13" font-weight="700" fill="#333">${pt.char}</text>`;
    });
  });
  if (start) body += `<circle cx="${half}" cy="${half}" r="10" fill="#c9a96e" opacity="0.3"/>`;
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${box}" height="${box}" viewBox="0 0 ${box} ${box}"><rect width="${box}" height="${box}" fill="#fafafa"/>${body}</svg>`, w: box, h: box };
}

/* fnSvgToPngBlob — 위에서 조립한 SVG 문자열을 오프스크린 <img>+<canvas> 로 PNG Blob 변환 */
function fnSvgToPngBlob(svgString, w, h) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('캔버스 변환 실패')), 'image/png');
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

/* fnParseDescText — 한글 도안 설명 텍스트 → 격자(cells) 역변환(fnGenDescText 의 반대 방향).
   "N단: 기호명 N코, 기호명 N코, ..." 형식의 줄을 파싱해 그 단(row)을 왼쪽부터 순서대로 채운다.
   "N단:" 이 없는 줄은 등장 순서를 단 번호로 사용. 등록된 기호명과 일치하지 않는 조각은 건너뛴다
   (오탈자·미등록 기호를 조용히 무시 — 부분적으로라도 채워지는 편이 전부 실패하는 것보다 낫다). */
function fnParseDescText(text, symbols) {
  const nameToId = {};
  symbols.forEach(s => { nameToId[s.symbolNm] = s.symbolId; });
  const cells = {};
  let rowCount = 0;
  let maxCol = 0;
  let unmatched = 0;
  const lines = (text || '').split('\n').map(l => l.trim()).filter(Boolean);
  lines.forEach((line, idx) => {
    const head = line.match(/^(\d+)\s*단\s*[:：]\s*(.+)$/);
    const rowNo = head ? Number(head[1]) : (idx + 1);
    const body = head ? head[2] : line;
    rowCount = Math.max(rowCount, rowNo);
    let col = 0;
    body.split(',').forEach(seg => {
      seg = seg.trim();
      if (!seg) return;
      const m = seg.match(/^(.+?)\s*(\d+)\s*코$/);
      if (!m) { unmatched++; return; }
      const symbolId = nameToId[m[1].trim()];
      if (!symbolId) { unmatched++; return; }
      const count = Number(m[2]);
      for (let i = 0; i < count; i++) {
        col++;
        cells[rowNo + '_' + col] = { symbolId, colorHex: null };
      }
    });
    maxCol = Math.max(maxCol, col);
  });
  return { cells, rowCount, maxCol, unmatched };
}

/* fnParseRoundText — "원형(라운드) 도안" 입력 텍스트 파싱.
   사각형 격자(cellMap)와는 완전히 별도의 데이터/뷰. 형식:
     시작: 매직링 원형 시작 6   (또는 "사슬 원형 시작 N")
     1: 짧은뜨기 6
     2: 2코늘리기 6
     3: (짧은뜨기, 2코늘리기)*6
   "시작:" 줄은 "매직링"(또는 "MR")이 들어있으면 매직링(나선 아이콘), 아니면 사슬 원형 시작(속이 빈
   원)으로 표시한다 — 실제 뜨개에서 작가마다 표기가 다른 두 시작 기법을 모두 지원. "(A, B)*K" 는
   괄호 안 나열을 K번 반복해 전개한다("A,B,A,B,...", K번). 괄호가 없는 줄은 콤마로 나열된
   "기호명 N코" 조각을 그대로 나열 순서대로 채운다. 등록된 기호명과 일치하지 않으면 symbolId 없이
   이름 텍스트만 남겨 아이콘 대신 첫 글자로 표시한다(입력 오탈자도 조용히 허용 — 미리보기가
   부분적으로라도 나오는 편이 낫다). */
function fnParseRoundText(text, symbols) {
  const nameToId = {};
  symbols.forEach(s => { nameToId[s.symbolNm] = s.symbolId; });
  let start = null;
  const rounds = [];
  const lines = (text || '').split('\n').map(l => l.trim()).filter(Boolean);
  lines.forEach(line => {
    const m = line.match(/^([^:：]+)[:：]\s*(.+)$/);
    if (!m) return;
    const head = m[1].trim();
    const body = m[2].trim();
    if (head === '시작') {
      const nm = body.match(/(\d+)\s*$/);
      const type = /매직\s*링|MR\b/i.test(body) ? 'magicring' : 'chain'; // "매직링 원형 시작 N" | "사슬 원형 시작 N"
      start = { type, total: nm ? Number(nm[1]) : 0 };
      return;
    }
    const roundNo = Number(head.replace(/[^0-9]/g, ''));
    if (!roundNo) return;
    const items = [];
    const pushSeg = (seg) => {
      seg = seg.trim();
      if (!seg) return;
      const cm = seg.match(/^(.+?)\s*(\d+)\s*코?\s*$/);
      const symbolNm = cm ? cm[1].trim() : seg;
      const count = cm ? Number(cm[2]) : 1;
      for (let i = 0; i < count; i++) items.push({ symbolNm, symbolId: nameToId[symbolNm] || null });
    };
    let hasGroup = false;
    body.replace(/\(([^)]+)\)\s*\*\s*(\d+)/g, (whole, inner, repeatStr) => {
      hasGroup = true;
      const repeat = Number(repeatStr);
      const segs = inner.split(',');
      for (let r = 0; r < repeat; r++) segs.forEach(pushSeg);
      return whole;
    });
    if (!hasGroup) body.split(',').forEach(pushSeg);
    if (items.length > 0) rounds.push({ roundNo, items, total: items.length });
  });
  rounds.sort((a, b) => a.roundNo - b.roundNo);
  return { start, rounds };
}

/* 배색 빠른 팔레트 — 4열 x 5행 고정 스와치(직접 배색 입력으로 언제든 덮어쓸 수 있다).
   실 색상은 너무 진하고 쨍한 원색보다 부드러운 톤이 보기 편해서 파스텔 계열로 구성(흑/백만 원색 유지). */
const PRESET_COLORS = [
  '#333333', '#ffffff', '#a8a8a8', '#e2a79c',
  '#f2c199', '#f5e08a', '#a8d8b9', '#8fd9c4',
  '#a8d0e6', '#9fb3c8', '#cbb2d9', '#f4b8d0',
  '#f0b98a', '#c3cbcc', '#e8e9ec', '#e3cfa3',
  '#c9ab8c', '#f7e9c8', '#c9c5fe', '#9be8d4',
];

/* 단수x코수 빠른 옵션 — 매번 숫자 두 개를 직접 입력하지 않도록 자주 쓰는 크기를 버튼으로 */
const GRID_PRESETS = [
  { label: '10×12', row: 10, col: 12 },
  { label: '15×20', row: 15, col: 20 },
  { label: '20×30', row: 20, col: 30 },
  { label: '30×40', row: 30, col: 40 },
];

/* "설명으로 격자 만들기" 예제 — 등록된 기호명 그대로 사용한 "N단: 기호명 N코, ..." 형식 샘플.
   각각 [이 예제 넣기]로 한글 도안 설명에 바로 채워 넣고 바로 테스트해볼 수 있다. */
const DESC_EXAMPLES = [
  { id: 'basic', label: '기본 사각형', text: '1단: 사슬뜨기 10코\n2단: 짧은뜨기 10코\n3단: 짧은뜨기 10코\n4단: 짧은뜨기 10코' },
  { id: 'incdec', label: '늘림·모아뜨기', text: '1단: 사슬뜨기 8코\n2단: 짧은뜨기 2코 늘려뜨기 8코\n3단: 짧은뜨기 8코, 짧은뜨기 2코 모아뜨기 4코' },
  { id: 'stripe', label: '줄무늬', text: '1단: 사슬뜨기 12코\n2단: 한길긴뜨기 12코\n3단: 짧은뜨기 12코' },
  { id: 'widen', label: '점점 넓어지는 사각형', text: '1단: 사슬뜨기 6코\n2단: 짧은뜨기 6코\n3단: 짧은뜨기 3코, 2코늘리기 3코\n4단: 짧은뜨기 6코, 2코늘리기 3코' },
  { id: 'narrow', label: '점점 좁아지는 사각형', text: '1단: 사슬뜨기 12코\n2단: 짧은뜨기 12코\n3단: 2코모아뜨기 6코\n4단: 2코모아뜨기 3코' },
  { id: 'hdcbasic', label: '긴뜨기 기본', text: '1단: 사슬뜨기 10코\n2단: 긴뜨기 10코\n3단: 긴뜨기 10코' },
  { id: 'dcbasic', label: '한길긴뜨기 기본', text: '1단: 사슬뜨기 10코\n2단: 한길긴뜨기 10코\n3단: 한길긴뜨기 10코' },
  { id: 'trmix', label: '두길긴뜨기 혼합', text: '1단: 사슬뜨기 12코\n2단: 두길긴뜨기 6코, 한길긴뜨기 6코\n3단: 짧은뜨기 12코' },
  { id: 'rib', label: '리브(앞뒤 걸어뜨기)', text: '1단: 사슬뜨기 10코\n2단: 짧은뜨기 10코\n3단: 짧은뜨기 앞걸어뜨기 5코, 짧은뜨기 뒤걸어뜨기 5코' },
  { id: 'scinc3', label: '짧은뜨기 3코 늘림·모아뜨기', text: '1단: 사슬뜨기 9코\n2단: 짧은뜨기 3코 늘려뜨기 9코\n3단: 짧은뜨기 9코, 짧은뜨기 3코 모아뜨기 3코' },
  { id: 'hdcgrow', label: '긴뜨기 늘림·모아뜨기', text: '1단: 사슬뜨기 9코\n2단: 긴뜨기 3코 늘려뜨기 9코\n3단: 긴뜨기 9코, 긴뜨기 2코 모아뜨기 4코' },
  { id: 'dcgrow', label: '한길긴뜨기 늘림·모아뜨기', text: '1단: 사슬뜨기 8코\n2단: 한길긴뜨기 2코 늘려뜨기 8코\n3단: 한길긴뜨기 8코, 한길긴뜨기 2코 모아뜨기 4코' },
  { id: 'dcdec4', label: '4코모아뜨기 마무리', text: '1단: 사슬뜨기 16코\n2단: 한길긴뜨기 16코\n3단: 한길긴뜨기 4코 모아뜨기 4코' },
  { id: 'crossrow', label: '교차무늬 줄', text: '1단: 사슬뜨기 12코\n2단: 긴뜨기 12코\n3단: 긴뜨기 1코 교차뜨기 6코' },
  { id: 'crossrl', label: '오른쪽·왼쪽 교차 리듬', text: '1단: 사슬뜨기 12코\n2단: 한길긴뜨기 12코\n3단: 한길긴뜨기 오른쪽 위 교차뜨기 3코, 한길긴뜨기 왼쪽 위 교차뜨기 3코' },
  { id: 'trcross', label: '두길긴뜨기 교차', text: '1단: 사슬뜨기 10코\n2단: 두길긴뜨기 10코\n3단: 두길긴뜨기 1코 교차뜨기 5코' },
  { id: 'puffrow', label: '구슬뜨기 줄무늬', text: '1단: 사슬뜨기 10코\n2단: 한길긴뜨기 10코\n3단: 한길긴뜨기 3코 구슬뜨기 5코, 사슬뜨기 5코' },
  { id: 'puffv', label: '변형구슬 강조', text: '1단: 사슬뜨기 8코\n2단: 한길긴뜨기 8코\n3단: 한길긴뜨기 3코 변형구슬뜨기 4코, 짧은뜨기 4코' },
  { id: 'popcornrow', label: '팝콘무늬 줄', text: '1단: 사슬뜨기 10코\n2단: 한길긴뜨기 10코\n3단: 한길긴뜨기 5코 팝콘뜨기 5코, 사슬뜨기 5코' },
  { id: 'fanshell', label: '솔잎·조개무늬 혼합', text: '1단: 사슬뜨기 16코\n2단: 한길긴뜨기 5잎 솔잎뜨기 4코, 조개무늬뜨기 4코' },
];

/* "원형(라운드) 도안 입력" 예제 — 등록된 기호명을 그대로 사용한 다양한 원형뜨기 샘플.
   각각 [이 예제 넣기]로 원형 도안 입력란에 바로 채워 넣고 미리보기로 바로 확인해볼 수 있다.
   group 은 SYMBOL_GROUPS 와 동일한 라벨(PDF 목차 1~6장)을 그대로 사용 — 예제 탭도 팔레트와
   같은 분류 기준으로 묶어서 보여준다(cfGroupedRoundExamples). */
const ROUND_EXAMPLES = [
  // 1. 기본 뜨기
  { id: 'basic', group: '1. 기본 뜨기', label: '기본 원형(도넛)', text: '시작: 사슬 원형 시작 6\n1: 짧은뜨기 6\n2: 짧은뜨기 6\n3: 짧은뜨기 6' },
  { id: 'inc', group: '1. 기본 뜨기', label: '표준 증편(모티브)', text: '시작: 매직링 원형 시작 6\n1: 짧은뜨기 6\n2: 2코늘리기 6\n3: (짧은뜨기, 2코늘리기)*6\n4: (짧은뜨기 2코, 2코늘리기)*6' },
  { id: 'tube', group: '1. 기본 뜨기', label: '통 원형(모자 옆면)', text: '시작: 매직링 원형 시작 8\n1: 짧은뜨기 8\n2: 짧은뜨기 8\n3: 짧은뜨기 8\n4: 짧은뜨기 8\n5: 짧은뜨기 8' },
  { id: 'crownclose', group: '1. 기본 뜨기', label: '정수리 마무리(모아뜨기)', text: '시작: 매직링 원형 시작 6\n1: 짧은뜨기 6\n2: 2코늘리기 6\n3: (짧은뜨기, 2코늘리기)*6\n4: 짧은뜨기 18\n5: 2코모아뜨기 9' },
  { id: 'chainstart', group: '1. 기본 뜨기', label: '사슬 시작 기본', text: '시작: 사슬 원형 시작 6\n1: 짧은뜨기 6\n2: 짧은뜨기 6' },
  { id: 'slipjoin', group: '1. 기본 뜨기', label: '빼뜨기 마무리', text: '시작: 매직링 원형 시작 6\n1: 짧은뜨기 6\n2: 빼뜨기 6' },
  { id: 'hdcbasic2', group: '1. 기본 뜨기', label: '긴뜨기 원형(매직링)', text: '시작: 매직링 원형 시작 8\n1: 긴뜨기 8\n2: 긴뜨기 8' },
  { id: 'dcbasic2', group: '1. 기본 뜨기', label: '한길긴뜨기 원형(매직링)', text: '시작: 매직링 원형 시작 8\n1: 한길긴뜨기 8\n2: 한길긴뜨기 8' },
  { id: 'trbasic', group: '1. 기본 뜨기', label: '두길긴뜨기 원형', text: '시작: 사슬 원형 시작 8\n1: 두길긴뜨기 8\n2: 두길긴뜨기 8' },

  // 2. 짧은뜨기 응용
  { id: 'rib', group: '2. 짧은뜨기 응용', label: '리브 원형', text: '시작: 매직링 원형 시작 8\n1: 짧은뜨기 8\n2: (짧은뜨기 앞걸어뜨기, 짧은뜨기 뒤걸어뜨기)*4' },
  { id: 'scinc2motif', group: '2. 짧은뜨기 응용', label: '짧은뜨기 2코 늘림 모티브', text: '시작: 매직링 원형 시작 6\n1: 짧은뜨기 2코 늘려뜨기 6\n2: (짧은뜨기, 짧은뜨기 2코 늘려뜨기)*6' },
  { id: 'scinc3motif', group: '2. 짧은뜨기 응용', label: '짧은뜨기 3코 늘림 모티브', text: '시작: 매직링 원형 시작 4\n1: 짧은뜨기 3코 늘려뜨기 4\n2: (짧은뜨기 2코, 짧은뜨기 3코 늘려뜨기)*4' },
  { id: 'scdec2close', group: '2. 짧은뜨기 응용', label: '짧은뜨기 2코모아 마무리', text: '시작: 매직링 원형 시작 12\n1: 짧은뜨기 12\n2: 짧은뜨기 2코 모아뜨기 6' },
  { id: 'scdec3close2', group: '2. 짧은뜨기 응용', label: '짧은뜨기 3코모아 마무리', text: '시작: 매직링 원형 시작 12\n1: 짧은뜨기 12\n2: 짧은뜨기 3코 모아뜨기 4' },
  { id: 'scfpring', group: '2. 짧은뜨기 응용', label: '짧은뜨기 앞걸어뜨기 원형', text: '시작: 매직링 원형 시작 8\n1: 짧은뜨기 8\n2: 짧은뜨기 앞걸어뜨기 8' },
  { id: 'scbpring', group: '2. 짧은뜨기 응용', label: '짧은뜨기 뒤걸어뜨기 원형', text: '시작: 매직링 원형 시작 8\n1: 짧은뜨기 8\n2: 짧은뜨기 뒤걸어뜨기 8' },
  { id: 'ribwide', group: '2. 짧은뜨기 응용', label: '넓은 리브 원형', text: '시작: 매직링 원형 시작 12\n1: 짧은뜨기 12\n2: (짧은뜨기 앞걸어뜨기 3코, 짧은뜨기 뒤걸어뜨기 3코)*2' },

  // 3. 긴뜨기·한길긴뜨기 늘림/모아뜨기
  { id: 'hdcinc3motif', group: '3. 긴뜨기·한길긴뜨기 늘림/모아뜨기', label: '긴뜨기 3코 늘림 모티브', text: '시작: 매직링 원형 시작 4\n1: 긴뜨기 3코 늘려뜨기 4\n2: (긴뜨기 2코, 긴뜨기 3코 늘려뜨기)*4' },
  { id: 'hdcdec2close', group: '3. 긴뜨기·한길긴뜨기 늘림/모아뜨기', label: '긴뜨기 2코모아 마무리', text: '시작: 매직링 원형 시작 10\n1: 긴뜨기 10\n2: 긴뜨기 2코 모아뜨기 5' },
  { id: 'hdcdec3close2', group: '3. 긴뜨기·한길긴뜨기 늘림/모아뜨기', label: '긴뜨기 3코모아 마무리', text: '시작: 매직링 원형 시작 9\n1: 긴뜨기 9\n2: 긴뜨기 3코 모아뜨기 3' },
  { id: 'dcinc2motif', group: '3. 긴뜨기·한길긴뜨기 늘림/모아뜨기', label: '한길긴뜨기 2코 늘림 모티브', text: '시작: 매직링 원형 시작 6\n1: 한길긴뜨기 2코 늘려뜨기 6\n2: (한길긴뜨기, 한길긴뜨기 2코 늘려뜨기)*6' },
  { id: 'dcinc3motif', group: '3. 긴뜨기·한길긴뜨기 늘림/모아뜨기', label: '한길긴뜨기 3코 늘림 모티브', text: '시작: 매직링 원형 시작 4\n1: 한길긴뜨기 3코 늘려뜨기 4\n2: (한길긴뜨기 2코, 한길긴뜨기 3코 늘려뜨기)*4' },
  { id: 'dcdec2close', group: '3. 긴뜨기·한길긴뜨기 늘림/모아뜨기', label: '한길긴뜨기 2코모아 마무리', text: '시작: 매직링 원형 시작 10\n1: 한길긴뜨기 10\n2: 한길긴뜨기 2코 모아뜨기 5' },
  { id: 'dcdec3close2', group: '3. 긴뜨기·한길긴뜨기 늘림/모아뜨기', label: '한길긴뜨기 3코모아 마무리', text: '시작: 매직링 원형 시작 9\n1: 한길긴뜨기 9\n2: 한길긴뜨기 3코 모아뜨기 3' },
  { id: 'dcdec4close', group: '3. 긴뜨기·한길긴뜨기 늘림/모아뜨기', label: '한길긴뜨기 4코모아 마무리', text: '시작: 매직링 원형 시작 8\n1: 한길긴뜨기 8\n2: 한길긴뜨기 4코 모아뜨기 2' },
  { id: 'dcgrowmotif2', group: '3. 긴뜨기·한길긴뜨기 늘림/모아뜨기', label: '한길긴뜨기 증편 모티브', text: '시작: 매직링 원형 시작 6\n1: 한길긴뜨기 2코 늘려뜨기 6\n2: (한길긴뜨기, 한길긴뜨기 2코 늘려뜨기)*6\n3: (한길긴뜨기 2코, 한길긴뜨기 2코 늘려뜨기)*6' },

  // 4. 걸어뜨기·교차뜨기
  { id: 'cross', group: '4. 걸어뜨기·교차뜨기', label: '교차무늬 원형', text: '시작: 사슬 원형 시작 8\n1: 한길긴뜨기 8\n2: (한길긴뜨기 1코 교차뜨기, 사슬뜨기 1코)*4' },
  { id: 'crossr', group: '4. 걸어뜨기·교차뜨기', label: '오른쪽 위 교차 원형', text: '시작: 사슬 원형 시작 8\n1: 한길긴뜨기 8\n2: (한길긴뜨기 오른쪽 위 교차뜨기, 사슬뜨기 1코)*4' },
  { id: 'crossl', group: '4. 걸어뜨기·교차뜨기', label: '왼쪽 위 교차 원형', text: '시작: 사슬 원형 시작 8\n1: 한길긴뜨기 8\n2: (한길긴뜨기 왼쪽 위 교차뜨기, 사슬뜨기 1코)*4' },
  { id: 'hdcfpring', group: '4. 걸어뜨기·교차뜨기', label: '긴뜨기 앞걸어뜨기 원형', text: '시작: 매직링 원형 시작 8\n1: 긴뜨기 8\n2: 긴뜨기 앞걸어뜨기 8' },
  { id: 'hdcbpring', group: '4. 걸어뜨기·교차뜨기', label: '긴뜨기 뒤걸어뜨기 원형', text: '시작: 매직링 원형 시작 8\n1: 긴뜨기 8\n2: 긴뜨기 뒤걸어뜨기 8' },
  { id: 'dcfpring', group: '4. 걸어뜨기·교차뜨기', label: '한길긴뜨기 앞걸어뜨기 원형', text: '시작: 매직링 원형 시작 8\n1: 한길긴뜨기 8\n2: 한길긴뜨기 앞걸어뜨기 8' },
  { id: 'dcbpring', group: '4. 걸어뜨기·교차뜨기', label: '한길긴뜨기 뒤걸어뜨기 원형', text: '시작: 매직링 원형 시작 8\n1: 한길긴뜨기 8\n2: 한길긴뜨기 뒤걸어뜨기 8' },
  { id: 'hdccrossmotif', group: '4. 걸어뜨기·교차뜨기', label: '긴뜨기 교차 모티브', text: '시작: 사슬 원형 시작 8\n1: 긴뜨기 8\n2: (긴뜨기 1코 교차뜨기, 사슬뜨기 1코)*4' },

  // 5. 구슬·팝콘·무늬뜨기
  { id: 'shell', group: '5. 구슬·팝콘·무늬뜨기', label: '조개무늬 원형', text: '시작: 사슬 원형 시작 8\n1: 조개무늬뜨기 8\n2: (사슬뜨기 2코, 조개무늬뜨기)*8' },
  { id: 'popcorn', group: '5. 구슬·팝콘·무늬뜨기', label: '팝콘무늬 원형', text: '시작: 사슬 원형 시작 6\n1: (한길긴뜨기 5코 팝콘뜨기, 사슬뜨기 2코)*6\n2: (사슬뜨기 3코, 짧은뜨기)*6' },
  { id: 'puff', group: '5. 구슬·팝콘·무늬뜨기', label: '구슬무늬 원형', text: '시작: 매직링 원형 시작 6\n1: (한길긴뜨기 3코 구슬뜨기, 사슬뜨기 1코)*6' },
  { id: 'puffv', group: '5. 구슬·팝콘·무늬뜨기', label: '변형구슬 원형', text: '시작: 매직링 원형 시작 6\n1: (한길긴뜨기 3코 변형구슬뜨기, 사슬뜨기 1코)*6' },
  { id: 'trpuff', group: '5. 구슬·팝콘·무늬뜨기', label: '두길구슬 원형', text: '시작: 매직링 원형 시작 6\n1: (두길긴뜨기 5코 구슬뜨기, 사슬뜨기 2코)*6' },
  { id: 'trpop', group: '5. 구슬·팝콘·무늬뜨기', label: '두길팝콘 원형', text: '시작: 매직링 원형 시작 6\n1: (두길긴뜨기 6코 팝콘뜨기, 사슬뜨기 2코)*6' },
  { id: 'fan', group: '5. 구슬·팝콘·무늬뜨기', label: '솔잎무늬 원형', text: '시작: 매직링 원형 시작 8\n1: 짧은뜨기 8\n2: (한길긴뜨기 5잎 솔잎뜨기, 짧은뜨기)*4' },
  { id: 'shellring2', group: '5. 구슬·팝콘·무늬뜨기', label: '조개무늬 겹단 원형', text: '시작: 매직링 원형 시작 6\n1: 조개무늬뜨기 6\n2: (사슬뜨기 1코, 조개무늬뜨기)*6\n3: (사슬뜨기 2코, 조개무늬뜨기)*6' },
  { id: 'trpopchain', group: '5. 구슬·팝콘·무늬뜨기', label: '두길팝콘 확장 무늬', text: '시작: 매직링 원형 시작 6\n1: (두길긴뜨기 6코 팝콘뜨기, 사슬뜨기 3코)*6' },

  // 6. 특수 무늬 기호
  { id: 'xst', group: '6. 특수 무늬 기호', label: 'X자뜨기 원형', text: '시작: 사슬 원형 시작 8\n1: 한길긴뜨기 8\n2: (1길긴뜨기 X자뜨기, 사슬뜨기 1코)*4' },
  { id: 'trxst', group: '6. 특수 무늬 기호', label: '두길X자 원형', text: '시작: 사슬 원형 시작 8\n1: 두길긴뜨기 8\n2: (2길긴뜨기 X자뜨기, 사슬뜨기 1코)*4' },
  { id: 'bobble', group: '6. 특수 무늬 기호', label: '칠보무늬 원형', text: '시작: 매직링 원형 시작 6\n1: (칠보뜨기, 사슬뜨기 2코)*6' },
  { id: 'picot', group: '6. 특수 무늬 기호', label: '피코장식 원형', text: '시작: 매직링 원형 시작 6\n1: 짧은뜨기 6\n2: (짧은뜨기, 피코뜨기)*6' },
  { id: 'ring', group: '6. 특수 무늬 기호', label: '링뜨기 원형', text: '시작: 매직링 원형 시작 6\n1: (짧은뜨기 링뜨기, 사슬뜨기 2코)*6' },
  { id: 'trxstring', group: '6. 특수 무늬 기호', label: '두길X자 확장 원형', text: '시작: 사슬 원형 시작 10\n1: 두길긴뜨기 10\n2: (2길긴뜨기 X자뜨기, 사슬뜨기 1코)*5' },
  { id: 'bobblering2', group: '6. 특수 무늬 기호', label: '칠보무늬 겹단 원형', text: '시작: 매직링 원형 시작 6\n1: (칠보뜨기, 사슬뜨기 2코)*6\n2: (사슬뜨기 3코, 짧은뜨기)*6' },
];

/* 기호 팔레트 그룹 — "코바늘_기호_확정본_모음" PDF 의 목차(1~6장)와 동일한 분류.
   symbol_cd 로 소속을 판정하고, 어느 그룹에도 없는 기호(향후 추가분 포함)는 "기타"로 폴백한다. */
const SYMBOL_GROUPS = [
  { label: '1. 기본 뜨기', cds: ['CHAIN', 'SLIP', 'SC', 'HDC', 'DC', 'TR', 'DTR', 'TR4', 'INC', 'DEC'] },
  { label: '2. 짧은뜨기 응용', cds: ['SCINC2', 'SCINC3', 'SCDEC2', 'SCDEC3', 'SCFP', 'SCBP'] },
  { label: '3. 긴뜨기·한길긴뜨기 늘림/모아뜨기', cds: ['HDCINC3', 'HDCDEC2', 'HDCDEC3', 'DCINC2', 'DCINC3', 'DCDEC2', 'DCDEC3', 'DCDEC4'] },
  { label: '4. 걸어뜨기·교차뜨기', cds: ['HDCFP', 'HDCBP', 'DCFP', 'DCBP', 'HDCCROSS', 'DCCROSS', 'DCCROSSR', 'DCCROSSL', 'TRCROSS'] },
  { label: '5. 구슬·팝콘·무늬뜨기', cds: ['DCPUFF3', 'DCPUFF3V', 'TRPUFF5', 'DCPOP5', 'TRPOP6', 'DCFAN5', 'SHELL'] },
  { label: '6. 특수 무늬 기호', cds: ['DCXST', 'TRXST', 'BOBBLEDECO', 'PICOT', 'SCRING', 'DCRING'] },
];

window.MdCbCobanulPage = {
  name: 'MdCbCobanulPage',
  props: {
    showToast: { type: Function, default: () => {} }, // 토스트 알림
    showConfirm: { type: Function, default: () => Promise.resolve(true) }, // 확인 모달
  },
  setup(props) {
    const { reactive, ref, computed, watch, onMounted, onUnmounted } = Vue;

    const symbols = reactive([]);
    const yarns = reactive([]);
    const patternYarns = reactive([]); // [{ yarnId, usageDesc }] — 이 도안에 사용된 실(재료) 목록
    const uiState = reactive({
      loading: false, activeSymbolId: null,
      activeColor: localStorage.getItem('modu-md-cb-active-color') || '#333333', // 마지막으로 고른 배색을 다음에도 기본값으로
      activeYarnId: null,
      isPainting: false, dragMode: 'paint', thumbUploading: false,
      autoThumb: true, // "도안을 대표이미지로 첨부하기" 체크(기본 ON) — 저장 시 도안 자체를 이미지로 만들어 대표이미지로 사용
      dtlMode: 'edit', // 'view' | 'edit' — 목록에서 행 클릭=보기, [수정] 클릭=수정모드 (신규 작성은 항상 edit)
      chartMode: 'symbol', // 'symbol'(기호 도안, 편집 가능) | 'color'(배색 도안 — 색상 칸+구간 개수, 읽기전용 미리보기)
      descExampleTab: DESC_EXAMPLES[0].id,
      roundExampleTab: ROUND_EXAMPLES[0].id,
    });
    const descExampleTabs = reactive(DESC_EXAMPLES.map(e => ({ id: e.id, label: e.label })));
    const cfCurrentDescExample = computed(() => DESC_EXAMPLES.find(e => e.id === uiState.descExampleTab) || DESC_EXAMPLES[0]);
    const onUseDescExample = () => {
      form.descText = cfCurrentDescExample.value.text;
    };
    /* cfGroupedRoundExamples — 원형 예제 탭을 SYMBOL_GROUPS 와 동일한 분류(PDF 1~6장)로 묶는다.
       팔레트(cfGroupedSymbols)와 같은 라벨을 재사용해, 팔레트에서 본 분류 그대로 예제도 찾을 수 있게 한다. */
    const cfGroupedRoundExamples = computed(() => {
      const order = SYMBOL_GROUPS.map(g => g.label);
      return order
        .map(label => ({ label, tabs: ROUND_EXAMPLES.filter(e => e.group === label).map(e => ({ id: e.id, label: e.label })) }))
        .filter(g => g.tabs.length);
    });
    const cfCurrentRoundExample = computed(() => ROUND_EXAMPLES.find(e => e.id === uiState.roundExampleTab) || ROUND_EXAMPLES[0]);
    const onUseRoundExample = () => {
      form.roundDescText = cfCurrentRoundExample.value.text;
    };
    const cfReadonly = computed(() => uiState.dtlMode === 'view');
    /* cfPatternType — 목록(MdCbPatternListPage.fnPatternType)과 같은 3가지 분류.
       격자에 칠해진 내용이 있으면 색 종류 수로 "배색 도안"/"기호 도안" 구분(단색·색없음=기호),
       격자가 비어있고 원형 텍스트만 있으면 "원형 도안". 둘 다 비어있으면(신규 작성 등) 배지 없음. */
    const cfPatternType = computed(() => {
      if (Object.keys(cellMap).length > 0) {
        const colors = new Set(Object.values(cellMap).map(c => c.colorHex).filter(Boolean));
        return colors.size >= 2 ? { icon: '🎨', label: '배색 도안' } : { icon: '🧩', label: '기호 도안' };
      }
      if (form.roundDescText && form.roundDescText.trim()) return { icon: '🌀', label: '원형 도안' };
      return null;
    });
    const thumbInputRef = ref(null);
    /* 배색을 고를 때마다 다음 세션의 기본값으로 영속화(직접 색상 입력 v-model 도 포함해야 해서 watch 사용) */
    watch(() => uiState.activeColor, (v) => { try { localStorage.setItem('modu-md-cb-active-color', v); } catch (_) {} });

    const form = reactive({ patternId: null, patternNm: '', rowCount: 15, maxStitchCount: 20, descText: '', roundDescText: '', thumbnailUrl: '' });
    /* cells: { "row_col": { symbolId, colorHex } } */
    const cellMap = reactive({});

    const symbolMap = computed(() => {
      const m = { null: { symbolId: null, symbolChar: '⌫', symbolNm: '지우개(빈칸)' } }; // 팔레트의 "없음" 브러시
      symbols.forEach(s => { m[s.symbolId] = s; });
      return m;
    });
    /* cfGroupedSymbols — 기호 팔레트를 PDF 목차(1~6장) 순서로 묶는다. 어느 그룹에도 없는 기호는 "기타"로 폴백 */
    const cfGroupedSymbols = computed(() => {
      const used = new Set();
      const groups = SYMBOL_GROUPS.map(g => {
        const items = g.cds.map(cd => symbols.find(s => s.symbolCd === cd)).filter(Boolean);
        items.forEach(s => used.add(s.symbolId));
        return { label: g.label, items };
      }).filter(g => g.items.length);
      const rest = symbols.filter(s => !used.has(s.symbolId));
      if (rest.length) groups.push({ label: '기타', items: rest });
      return groups;
    });

    /* fnSymIcon — symbolCd 기반 SVG 마크업(<svg>...) 반환. 매칭 없으면 null(symbolChar 텍스트로 폴백) */
    const fnSymIcon = (sym) => {
      const inner = sym && sym.symbolCd ? fnSymbolSvg(sym.symbolCd) : null;
      // fill/stroke 는 svg 루트에 지정해 자식 line/ellipse/circle 이 상속받게 한다
      // (line 등은 stroke 속성이 없으면 기본값 none 이라 아무것도 안 그려짐 — 실제로 겪은 버그)
      return inner ? `<svg viewBox="0 0 24 24" class="cb-sym-svg" ${CB_SVG_STROKE}>${inner}</svg>` : null;
    };
    /* fnCellDisplay — 격자 셀 하나의 표시용 { svg, char } 조회 */
    const fnCellDisplay = (r, c) => {
      const cell = cellMap[r + '_' + c];
      if (!cell) return null;
      const sym = symbolMap.value[cell.symbolId];
      if (!sym) return null;
      return { svg: fnSymIcon(sym), char: sym.symbolChar };
    };

    /* fnColorRunStart — "배색 도안" 보기 전용. (r,c)가 같은 색이 연속되는 구간의 시작 칸이면
       그 구간 길이를 반환(구간 중간 칸이면 null) — 시작 칸에만 "몇 코"인지 숫자를 겹쳐 보여주기 위함 */
    const fnColorRunStart = (r, c) => {
      const cell = cellMap[r + '_' + c];
      if (!cell || !cell.colorHex) return null;
      const prev = cellMap[r + '_' + (c - 1)];
      if (prev && prev.colorHex === cell.colorHex) return null;
      let count = 1;
      let cc = c + 1;
      while (cellMap[r + '_' + cc] && cellMap[r + '_' + cc].colorHex === cell.colorHex) { count++; cc++; }
      return count;
    };

    /* cfRoundChart — 원형(라운드) 도안 미리보기 계산. 각 단(round)을 동심원으로 배치하고
       각 코(stitch)를 12시 방향에서 시계방향으로 균등 배분한다(rd.items.length 개 각도). */
    const cfRoundChart = computed(() => {
      const { start, rounds } = fnParseRoundText(form.roundDescText, symbols);
      const baseR = 46, gap = 34;
      const list = rounds.map((rd, idx) => {
        const radius = baseR + idx * gap;
        const n = rd.items.length || 1;
        let total = 0;
        const points = rd.items.map((it, i) => {
          const angle = (-90 + (360 / n) * i) * Math.PI / 180;
          const sym = it.symbolId ? symbolMap.value[it.symbolId] : null;
          total += (sym && sym.stitchProduce) || 1; // 링 라벨은 "작업한 기호 개수"가 아니라 실제 뜨개 관례대로 "그 단이 끝난 뒤의 총 코수"
          return {
            x: Math.round(radius * Math.cos(angle) * 10) / 10,
            y: Math.round(radius * Math.sin(angle) * 10) / 10,
            svg: sym ? fnSymIcon(sym) : null,
            char: sym ? sym.symbolChar : (it.symbolNm ? it.symbolNm[0] : '?'),
          };
        });
        return { roundNo: rd.roundNo, total, radius, points };
      });
      const maxRadius = list.length ? list[list.length - 1].radius : baseR;
      const box = Math.ceil((maxRadius + 40) * 2);
      return { start, rounds: list, box, half: box / 2 };
    });

    const yarnMap = computed(() => {
      const m = {};
      yarns.forEach(y => { m[y.yarnId] = y; });
      return m;
    });

    /* fnLoadSymbols — 기호 사전 로드 */
    const fnLoadSymbols = async () => {
      const res = await mdCbApiSvc.symbol.getList({}, '코바늘도안', '기호조회');
      symbols.splice(0, symbols.length, ...(res.data?.data || []));
      if (symbols.length) uiState.activeSymbolId = symbols[0].symbolId;
    };

    /* fnLoadYarns — 실 마스터 로드(코바늘실관리 화면에서 등록한 실) */
    const fnLoadYarns = async () => {
      const res = await mdCbApiSvc.yarn.getList({ useYn: 'Y' }, '코바늘도안', '실조회');
      yarns.splice(0, yarns.length, ...(res.data?.data || []));
    };

    /* onNewPattern — 신규 도안으로 초기화(같은 화면 안에서, URL도 patternId 없이 되돌림) */
    const onNewPattern = () => {
      Object.assign(form, { patternId: null, patternNm: '', rowCount: 15, maxStitchCount: 20, descText: '', roundDescText: '', thumbnailUrl: '' });
      Object.keys(cellMap).forEach(k => delete cellMap[k]);
      patternYarns.splice(0, patternYarns.length);
      uiState.dtlMode = 'edit';
      uiState.chartMode = 'symbol';
      history.replaceState(null, '', 'mdCbCobanul.html?view=editor');
    };

    /* onSwitchToEdit / onCancelEdit — 보기 ↔ 수정 모드 전환. 취소는 서버 값으로 되돌린다(편집 중 변경분 폐기) */
    const onSwitchToEdit = () => { uiState.dtlMode = 'edit'; };
    const onCancelEdit = async () => {
      if (form.patternId) await fnLoadPatternById(form.patternId);
      uiState.dtlMode = 'view';
    };

    /* onBackToList — 목록 화면으로 이동 */
    const onBackToList = () => { location.href = 'mdCbCobanul.html'; };

    /* fnLoadPatternById — patternId 로 기존 도안(메타+격자+재료) 불러오기 */
    const fnLoadPatternById = async (patternId) => {
      const res = await mdCbApiSvc.pattern.getById(patternId, '코바늘도안', '상세조회');
      const p = res.data?.data;
      if (!p) { props.showToast('존재하지 않는 도안입니다.', 'error'); return; }
      Object.assign(form, { patternId: p.patternId, patternNm: p.patternNm, rowCount: p.rowCount || 15,
        maxStitchCount: p.maxStitchCount || 20, descText: p.descText || '', roundDescText: p.roundDescText || '', thumbnailUrl: p.thumbnailUrl || '' });
      Object.keys(cellMap).forEach(k => delete cellMap[k]);
      const cellRes = await mdCbApiSvc.patternCell.getList(p.patternId, '코바늘도안', '격자조회');
      (cellRes.data?.data || []).forEach(c => {
        cellMap[c.rowNo + '_' + c.colNo] = { symbolId: c.symbolId, colorHex: c.colorHex };
      });
      const yarnRes = await mdCbApiSvc.patternYarn.getList(p.patternId, '코바늘도안', '재료조회');
      patternYarns.splice(0, patternYarns.length, ...(yarnRes.data?.data || []).map(y => ({ yarnId: y.yarnId, usageDesc: y.usageDesc || '' })));
      uiState.dtlMode = 'view'; // 목록에서 들어온 진입은 항상 보기모드로 시작 — [수정] 클릭시에만 편집
      /* 격자가 비어있고 원형 도안 텍스트만 있으면(원형 전용으로 만든 도안) 진입 시 바로 원형 도안
         모드로 보여준다 — 기호 도안(빈 격자)이 먼저 뜨면 "아무것도 없다"로 오해하기 쉽다. */
      uiState.chartMode = (Object.keys(cellMap).length === 0 && form.roundDescText.trim()) ? 'round' : 'symbol';
    };

    /* ── 셀 페인팅(클릭 1회 또는 드래그로 여러 칸 연속 칠하기) ──────────────
       mousedown 시 현재 칸 상태로 이번 드래그 전체의 동작(칠하기/지우기)을 정하고,
       같은 드래그 동안 mouseenter 되는 칸에는 매번 판정 없이 같은 동작을 반복 적용한다. */
    const fnPaintCell = (r, c) => { cellMap[r + '_' + c] = { symbolId: uiState.activeSymbolId, colorHex: uiState.activeColor }; };
    const fnEraseCell = (r, c) => { delete cellMap[r + '_' + c]; };

    const onCellMouseDown = (r, c) => {
      if (cfReadonly.value) return;
      if (uiState.activeSymbolId === null) { // "지우개(빈칸)" 브러시 — 토글 판정 없이 항상 지우기
        uiState.dragMode = 'erase';
        uiState.isPainting = true;
        return fnEraseCell(r, c);
      }
      const cur = cellMap[r + '_' + c];
      const isSame = cur && cur.symbolId === uiState.activeSymbolId && cur.colorHex === uiState.activeColor;
      uiState.dragMode = isSame ? 'erase' : 'paint';
      uiState.isPainting = true;
      if (uiState.dragMode === 'erase') fnEraseCell(r, c); else fnPaintCell(r, c);
    };
    const onCellMouseEnter = (r, c) => {
      if (!uiState.isPainting) return;
      if (uiState.dragMode === 'erase') fnEraseCell(r, c); else fnPaintCell(r, c);
    };
    const onGlobalMouseUp = () => { uiState.isPainting = false; };

    /* ── 배색: 프리셋/등록된 실 스와치 클릭 시 활성 색상으로 반영 ── */
    const onPickPresetColor = (hex) => { uiState.activeColor = hex; uiState.activeYarnId = null; };
    const onPickYarnColor = (yarn) => {
      uiState.activeColor = yarn.colorHex;
      uiState.activeYarnId = yarn.yarnId;
      onAddPatternYarn(yarn.yarnId);
    };

    /* ── 사용 실(재료) 목록 — 도안에 어떤 실이 쓰였는지 별도로 관리(md_cb_pattern_yarn) ── */
    const onAddPatternYarn = (yarnId) => {
      if (patternYarns.some(y => y.yarnId === yarnId)) return;
      patternYarns.push({ yarnId, usageDesc: '' });
    };
    const onRemovePatternYarn = (yarnId) => {
      const i = patternYarns.findIndex(y => y.yarnId === yarnId);
      if (i >= 0) patternYarns.splice(i, 1);
    };

    /* ── 단수x코수 빠른 옵션 + 모서리 늘리기 ── */
    const onApplyGridPreset = (preset) => { form.rowCount = preset.row; form.maxStitchCount = preset.col; };

    const fnShiftRows = (delta) => {
      const moved = {};
      Object.keys(cellMap).forEach(k => {
        const [r, c] = k.split('_').map(Number);
        moved[(r + delta) + '_' + c] = cellMap[k];
      });
      Object.keys(cellMap).forEach(k => delete cellMap[k]);
      Object.assign(cellMap, moved);
    };
    const fnShiftCols = (delta) => {
      const moved = {};
      Object.keys(cellMap).forEach(k => {
        const [r, c] = k.split('_').map(Number);
        moved[r + '_' + (c + delta)] = cellMap[k];
      });
      Object.keys(cellMap).forEach(k => delete cellMap[k]);
      Object.assign(cellMap, moved);
    };
    const onAddRowTop = () => { fnShiftRows(1); form.rowCount++; };
    const onAddRowBottom = () => { form.rowCount++; };
    const onAddColLeft = () => { fnShiftCols(1); form.maxStitchCount++; };
    const onAddColRight = () => { form.maxStitchCount++; };

    /* onRemoveRow/Col* — 모서리에서 한 단/코 줄이기(그 줄에 있던 셀은 함께 삭제) */
    const onRemoveRowTop = () => {
      if (form.rowCount <= 1) return;
      Object.keys(cellMap).forEach(k => { if (k.split('_')[0] === '1') delete cellMap[k]; });
      fnShiftRows(-1);
      form.rowCount--;
    };
    const onRemoveRowBottom = () => {
      if (form.rowCount <= 1) return;
      const lastRow = form.rowCount;
      Object.keys(cellMap).forEach(k => { if (Number(k.split('_')[0]) === lastRow) delete cellMap[k]; });
      form.rowCount--;
    };
    const onRemoveColLeft = () => {
      if (form.maxStitchCount <= 1) return;
      Object.keys(cellMap).forEach(k => { if (k.split('_')[1] === '1') delete cellMap[k]; });
      fnShiftCols(-1);
      form.maxStitchCount--;
    };
    const onRemoveColRight = () => {
      if (form.maxStitchCount <= 1) return;
      const lastCol = form.maxStitchCount;
      Object.keys(cellMap).forEach(k => { if (Number(k.split('_')[1]) === lastCol) delete cellMap[k]; });
      form.maxStitchCount--;
    };

    /* onGenDesc — 한글 도안 설명 생성(클라이언트 계산, 저장 전 미리보기/수정 가능) */
    const onGenDesc = () => {
      form.descText = fnGenDescText(form.rowCount, form.maxStitchCount, cellMap, symbolMap.value);
    };

    /* onParseDesc — 반대 방향: 설명 텍스트를 파싱해 격자를 채운다(기존 격자 내용은 지워짐) */
    const onParseDesc = async () => {
      if (!form.descText || !form.descText.trim()) { props.showToast('먼저 도안 설명을 입력해주세요.', 'error'); return; }
      if (!await props.showConfirm('격자 다시 채우기', '현재 격자 내용을 지우고 도안 설명으로부터 다시 채우시겠습니까?')) return;
      const { cells, rowCount, maxCol, unmatched } = fnParseDescText(form.descText, symbols);
      if (Object.keys(cells).length === 0) {
        props.showToast('인식할 수 있는 기호를 찾지 못했습니다. "N단: 기호명 N코, 기호명 N코, ..." 형식으로 입력해주세요.', 'error');
        return;
      }
      Object.keys(cellMap).forEach(k => delete cellMap[k]);
      Object.assign(cellMap, cells);
      form.rowCount = Math.max(form.rowCount, rowCount);
      form.maxStitchCount = Math.max(form.maxStitchCount, maxCol);
      props.showToast(unmatched > 0 ? `격자에 반영했습니다. (인식하지 못한 구간 ${unmatched}개는 건너뜀)` : '격자에 반영되었습니다.', unmatched > 0 ? 'info' : 'success');
    };

    /* ── 대표이미지(썸네일) — 목록 화면 카드에 표시될 이미지. 공통 업로드 API로 CDN URL만 저장 ── */
    const onOpenThumbPicker = () => { if (cfReadonly.value || uiState.thumbUploading) return; thumbInputRef.value?.click(); };
    const onThumbFileChange = async (e) => {
      const f = e.target.files?.[0]; e.target.value = '';
      if (!f) return;
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) { props.showToast('이미지 파일만 업로드할 수 있습니다.', 'error'); return; }
      if (f.size > 5 * 1024 * 1024) { props.showToast('5MB 이하 이미지만 업로드할 수 있습니다.', 'error'); return; }
      uiState.thumbUploading = true;
      try {
        const fd = new FormData();
        fd.append('files', f);
        fd.append('businessCode', 'md_cb_pattern');
        const res = await coApiSvc.cmUpload.uploadMulti(fd, '코바늘도안', '대표이미지업로드');
        const uploaded = (res.data?.data?.files || [])[0];
        if (uploaded) {
          form.thumbnailUrl = uploaded.cdnImgUrl || '';
          props.showToast('대표이미지가 등록되었습니다.', 'success');
        }
      } catch (err) {
        props.showToast(err.response?.data?.message || err.message || '이미지 업로드 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        uiState.thumbUploading = false;
      }
    };
    const onRemoveThumb = () => { form.thumbnailUrl = ''; };

    /* fnGenerateAutoThumb — "도안을 대표이미지로 첨부하기" 체크 시 저장 직전 호출.
       격자에 칠해진 내용이 있으면 기호 격자를, 없고 원형 도안만 있으면 원형 차트를 이미지로 만들어
       업로드하고 form.thumbnailUrl 을 그 결과로 덮어쓴다. 실패해도 저장 자체는 계속 진행한다
       (throw 하지 않고 조용히 넘어감 — 자동 썸네일은 부가 기능이지 저장을 막을 이유가 아니다). */
    const fnGenerateAutoThumb = async () => {
      const hasGrid = Object.keys(cellMap).length > 0;
      const chart = cfRoundChart.value;
      const hasRound = !hasGrid && chart.rounds.length > 0;
      if (!hasGrid && !hasRound) return;
      try {
        const built = hasGrid
          ? fnBuildGridThumbSvg(form.rowCount, form.maxStitchCount, cellMap, symbolMap.value)
          : fnBuildRoundThumbSvg(chart);
        const blob = await fnSvgToPngBlob(built.svg, built.w, built.h);
        const fd = new FormData();
        fd.append('files', blob, 'pattern-thumb.png');
        fd.append('businessCode', 'md_cb_pattern');
        const res = await coApiSvc.cmUpload.uploadMulti(fd, '코바늘도안', '대표이미지자동생성');
        const uploaded = (res.data?.data?.files || [])[0];
        if (uploaded) form.thumbnailUrl = uploaded.cdnImgUrl || form.thumbnailUrl;
      } catch (e) { /* 자동 생성 실패 시 기존 썸네일 유지하고 저장은 계속 진행 */ }
    };

    /* onResetForm — 신규 작성 중 입력한 내용을 전부 지우고 처음 상태로("취소"는 기존 레코드 전용이라
       빈 신규 작성에는 대신 이 버튼을 쓴다) */
    const onResetForm = async () => {
      if (!await props.showConfirm('초기화', '입력한 내용을 모두 초기화하시겠습니까?')) return;
      onNewPattern();
    };

    /* onSave — 도안 저장(메타+격자+재료 일괄) */
    const onSave = async () => {
      if (!form.patternNm) { props.showToast('도안명을 입력해주세요.', 'error'); return; }
      uiState.loading = true;
      try {
        if (uiState.autoThumb) await fnGenerateAutoThumb();
        const body = { patternNm: form.patternNm, rowCount: form.rowCount, maxStitchCount: form.maxStitchCount,
          descText: form.descText, roundDescText: form.roundDescText, thumbnailUrl: form.thumbnailUrl };
        let patternId = form.patternId;
        if (!patternId) {
          const res = await mdCbApiSvc.pattern.create(body, '코바늘도안', '등록');
          patternId = res.data?.data?.patternId;
          form.patternId = patternId;
          history.replaceState(null, '', 'mdCbCobanul.html?view=editor&patternId=' + encodeURIComponent(patternId));
        } else {
          await mdCbApiSvc.pattern.update(patternId, body, '코바늘도안', '수정');
        }
        const rows = Object.keys(cellMap)
          .map(key => {
            const [rowNo, colNo] = key.split('_').map(Number);
            return { rowNo, colNo, symbolId: cellMap[key].symbolId, colorHex: cellMap[key].colorHex };
          })
          .filter(row => row.rowNo <= form.rowCount && row.colNo <= form.maxStitchCount); // 프리셋 축소 등으로 범위 밖에 남은 셀 제외
        await mdCbApiSvc.patternCell.saveList(patternId, rows, '코바늘도안', '격자저장');
        await mdCbApiSvc.patternYarn.saveList(patternId, patternYarns.map(y => ({ yarnId: y.yarnId, usageDesc: y.usageDesc })), '코바늘도안', '재료저장');
        props.showToast('저장되었습니다.', 'success');
      } catch (err) {
        props.showToast(err.response?.data?.message || err.message || '저장 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    /* onDeletePattern — 도안 삭제 후 목록으로 이동 */
    const onDeletePattern = async () => {
      if (!form.patternId) return;
      if (!await props.showConfirm('삭제', form.patternNm + ' 도안을 삭제하시겠습니까?')) return;
      await mdCbApiSvc.pattern.remove(form.patternId, '코바늘도안', '삭제');
      onBackToList();
    };

    const cfRows = computed(() => Array.from({ length: form.rowCount }, (_, i) => i + 1));
    const cfCols = computed(() => Array.from({ length: form.maxStitchCount }, (_, i) => i + 1));

    onMounted(async () => {
      window.addEventListener('mouseup', onGlobalMouseUp);
      await fnLoadSymbols();
      await fnLoadYarns();
      /* ?patternId=xxx 로 진입하면 해당 도안을 바로 불러온다(목록 화면의 "열기" 클릭 진입) */
      const qs = new URLSearchParams(location.search);
      const openId = qs.get('patternId');
      if (openId) await fnLoadPatternById(openId);
    });
    onUnmounted(() => { window.removeEventListener('mouseup', onGlobalMouseUp); });

    return {
      symbols, yarns, patternYarns, uiState, form, cellMap, symbolMap, yarnMap, cfGroupedSymbols, cfRows, cfCols, cfReadonly, cfPatternType, cfRoundChart,
      PRESET_COLORS, GRID_PRESETS, thumbInputRef, fnSymIcon, fnCellDisplay, fnColorRunStart,
      descExampleTabs, cfCurrentDescExample, onUseDescExample,
      cfGroupedRoundExamples, cfCurrentRoundExample, onUseRoundExample, fnMagicRingIcon,
      onNewPattern, onBackToList, onCellMouseDown, onCellMouseEnter, onGenDesc, onParseDesc, onSave, onDeletePattern,
      onSwitchToEdit, onCancelEdit, onOpenThumbPicker, onThumbFileChange, onRemoveThumb, onResetForm,
      onPickPresetColor, onPickYarnColor, onAddPatternYarn, onRemovePatternYarn,
      onApplyGridPreset, onAddRowTop, onAddRowBottom, onAddColLeft, onAddColRight,
      onRemoveRowTop, onRemoveRowBottom, onRemoveColLeft, onRemoveColRight,
    };
  },
  template: /* html */`
<div class="cb-page">
  <div class="cb-hero">
    <div class="cb-hero-eyebrow">CROCHET PATTERN</div>
    <h1 class="cb-hero-title">
      🧶 {{ !form.patternId ? '새 도안 만들기' : (cfReadonly ? '도안 상세보기' : '도안 편집') }}
      <span v-if="form.patternId" class="cb-detail-id">#{{ form.patternId }}</span>
      <span v-if="cfPatternType" class="cb-pattern-type-badge">{{ cfPatternType.icon }} {{ cfPatternType.label }}</span>
    </h1>
    <div class="cb-hero-sub">
      {{ !form.patternId ? '기호와 배색으로 나만의 도안을 만들어보세요'
        : (cfReadonly ? '저장된 도안입니다. 수정하려면 아래 [수정] 버튼을 눌러주세요' : '격자를 다시 살펴보고 이어서 완성해보세요') }}
    </div>
  </div>

  <div class="cb-detail-head">
    <button class="btn btn_list cb-back-btn" @click="onBackToList">← 목록으로</button>
    <button class="btn btn_new cb-back-btn" @click="onNewPattern" style="margin-left:auto;">+ 신규 도안</button>
  </div>

  <div class="cb-layout cb-layout-2col">
    <!-- 좌측: 격자 편집기 -->
    <div class="cb-panel cb-panel-editor">
      <div class="cb-editor-toolbar">
        <div class="cb-toolbar-fields">
          <div class="cb-name-field">
            <span class="cb-field-label">도안명</span>
            <input v-model="form.patternNm" :readonly="cfReadonly" placeholder="도안명을 입력하세요" class="form-control cb-name-input" />
          </div>
          <div class="cb-thumb-field">
            <span class="cb-field-label">대표이미지</span>
            <div class="cb-thumb-box" :class="{ 'cb-locked': cfReadonly }" @click="onOpenThumbPicker" title="목록에 표시될 이미지">
              <img v-if="form.thumbnailUrl" :src="form.thumbnailUrl" class="cb-thumb-img" />
              <span v-else class="cb-thumb-placeholder">{{ uiState.thumbUploading ? '⏳' : '＋' }}</span>
              <span v-if="form.thumbnailUrl && !cfReadonly" class="cb-thumb-remove" @click.stop="onRemoveThumb" title="제거">✕</span>
            </div>
            <input ref="thumbInputRef" type="file" accept="image/*" style="display:none" @change="onThumbFileChange" />
            <label v-if="!cfReadonly" class="cb-thumb-auto-toggle" title="저장 시 지금 그린 도안(격자 또는 원형)을 이미지로 만들어 대표이미지로 사용합니다.">
              <input type="checkbox" v-model="uiState.autoThumb" /> 도안을 대표이미지로 첨부하기
            </label>
          </div>
          <div class="cb-size-field">
            <span class="cb-field-label">단수</span>
            <input type="number" v-model.number="form.rowCount" :readonly="cfReadonly" min="1" max="80" class="cb-size-input" />
          </div>
          <div class="cb-size-field">
            <span class="cb-field-label">코수</span>
            <input type="number" v-model.number="form.maxStitchCount" :readonly="cfReadonly" min="1" max="60" class="cb-size-input" />
          </div>
          <div v-if="!cfReadonly" class="cb-preset-field">
            <span class="cb-field-label">빠른 크기</span>
            <div class="cb-grid-presets">
              <button v-for="gp in GRID_PRESETS" :key="gp.label" class="cb-preset-btn"
                :class="{ active: form.rowCount===gp.row && form.maxStitchCount===gp.col }"
                @click="onApplyGridPreset(gp)">{{ gp.label }}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="cb-chart-mode-toggle">
        <button :class="{ active: uiState.chartMode==='symbol' }" @click="uiState.chartMode='symbol'">🧩 기호 도안</button>
        <button :class="{ active: uiState.chartMode==='color' }" @click="uiState.chartMode='color'">🎨 배색 도안</button>
        <button :class="{ active: uiState.chartMode==='round' }" @click="uiState.chartMode='round'">🌀 원형 도안</button>
      </div>

      <!-- 기호 도안(편집 가능) -->
      <div v-if="uiState.chartMode==='symbol'" class="cb-grid-wrap" :class="{ 'cb-locked': cfReadonly }">
        <div class="cb-edge-group cb-edge-top">
          <button class="cb-edge-btn" title="윗단 줄이기" @click="onRemoveRowTop">－</button>
          <button class="cb-edge-btn" title="윗단 늘리기" @click="onAddRowTop">＋</button>
        </div>
        <div class="cb-edge-group cb-edge-bottom">
          <button class="cb-edge-btn" title="아랫단 줄이기" @click="onRemoveRowBottom">－</button>
          <button class="cb-edge-btn" title="아랫단 늘리기" @click="onAddRowBottom">＋</button>
        </div>
        <div class="cb-edge-group cb-edge-left">
          <button class="cb-edge-btn" title="왼쪽 코 줄이기" @click="onRemoveColLeft">－</button>
          <button class="cb-edge-btn" title="왼쪽 코 늘리기" @click="onAddColLeft">＋</button>
        </div>
        <div class="cb-edge-group cb-edge-right">
          <button class="cb-edge-btn" title="오른쪽 코 줄이기" @click="onRemoveColRight">－</button>
          <button class="cb-edge-btn" title="오른쪽 코 늘리기" @click="onAddColRight">＋</button>
        </div>

        <div class="cb-grid-scroll" @mouseleave="uiState.isPainting=false">
          <div v-for="r in cfRows" :key="r" class="cb-grid-row">
            <div v-for="c in cfCols" :key="c" class="cb-cell"
              :style="cellMap[r+'_'+c] ? ('background:' + (cellMap[r+'_'+c].colorHex || '#fff') + ';') : ''"
              @mousedown.prevent="onCellMouseDown(r, c)"
              @mouseenter="onCellMouseEnter(r, c)">
              <span v-if="fnCellDisplay(r,c) && fnCellDisplay(r,c).svg" v-html="fnCellDisplay(r,c).svg"></span>
              <template v-else>{{ fnCellDisplay(r,c) ? fnCellDisplay(r,c).char : '' }}</template>
            </div>
          </div>
        </div>
      </div>

      <!-- 배색 도안(읽기전용 미리보기) — 색상 칸 + 같은 색 연속 구간마다 개수 표시 + 단/코 눈금 -->
      <div v-else-if="uiState.chartMode==='color'" class="cb-chart-wrap">
        <div class="cb-chart-row cb-chart-axis-row">
          <div class="cb-chart-corner"></div>
          <div v-for="c in cfCols" :key="c" class="cb-chart-axis-cell">{{ c }}</div>
        </div>
        <div v-for="r in cfRows" :key="r" class="cb-chart-row">
          <div class="cb-chart-axis-cell">{{ r }}</div>
          <div v-for="c in cfCols" :key="c" class="cb-chart-cell"
            :style="cellMap[r+'_'+c] && cellMap[r+'_'+c].colorHex ? ('background:' + cellMap[r+'_'+c].colorHex + ';') : ''">
            <span v-if="fnColorRunStart(r,c)" class="cb-chart-count">{{ fnColorRunStart(r,c) }}</span>
          </div>
        </div>
        <div v-if="!Object.keys(cellMap).length" class="cb-empty-hint">기호 도안에서 칸을 칠하면 여기에 배색 도안이 자동으로 만들어집니다.</div>
      </div>

      <!-- 원형(라운드) 도안 — 사각형 격자와 독립된 별도 입력. 원형뜨기(도넛/코스터/모티브 등) 전용 -->
      <div v-else class="cb-round-wrap">
        <div class="cb-round-preview" :style="{ width: cfRoundChart.box + 'px', height: cfRoundChart.box + 'px' }">
          <svg class="cb-round-guide-svg" :viewBox="'0 0 ' + cfRoundChart.box + ' ' + cfRoundChart.box">
            <circle v-for="rd in cfRoundChart.rounds" :key="'g'+rd.roundNo"
              :cx="cfRoundChart.half" :cy="cfRoundChart.half" :r="rd.radius" class="cb-round-guide" />
            <text v-for="rd in cfRoundChart.rounds" :key="'l'+rd.roundNo"
              :x="cfRoundChart.half" :y="cfRoundChart.half - rd.radius - 8" text-anchor="middle" class="cb-round-label">{{ rd.roundNo }}({{ rd.total }})</text>
            <circle v-if="cfRoundChart.start && cfRoundChart.start.type!=='magicring'" :cx="cfRoundChart.half" :cy="cfRoundChart.half" r="10" class="cb-round-center" />
          </svg>
          <div v-if="cfRoundChart.start && cfRoundChart.start.type==='magicring'" class="cb-round-center-icon"
            :style="{ left: cfRoundChart.half + 'px', top: cfRoundChart.half + 'px' }" title="매직링(MR) — 원형뜨기 시작" v-html="fnMagicRingIcon()"></div>
          <div v-if="cfRoundChart.start" class="cb-round-center-label"
            :style="{ left: cfRoundChart.half + 'px', top: (cfRoundChart.half + (cfRoundChart.start.type==='magicring' ? 15 : 0)) + 'px' }">{{ cfRoundChart.start.total }}</div>
          <template v-for="rd in cfRoundChart.rounds" :key="rd.roundNo">
            <div v-for="(pt, i) in rd.points" :key="rd.roundNo + '_' + i" class="cb-round-stitch"
              :style="{ left: (cfRoundChart.half + pt.x) + 'px', top: (cfRoundChart.half + pt.y) + 'px' }">
              <span v-if="pt.svg" v-html="pt.svg"></span>
              <span v-else class="cb-round-stitch-char">{{ pt.char }}</span>
            </div>
          </template>
          <div v-if="!cfRoundChart.rounds.length" class="cb-round-empty">아래에 원형 도안을 입력하면<br>여기에 미리보기가 표시됩니다.</div>
        </div>
        <div class="cb-round-input">
          <div class="cb-desc-head">
            <span class="cb-desc-title">원형(라운드) 도안 입력</span>
          </div>
          <textarea v-if="!cfReadonly" v-model="form.roundDescText" rows="7" class="form-control cb-desc-textarea"
            placeholder="시작: 매직링 원형 시작 6&#10;1: 짧은뜨기 6&#10;2: 2코늘리기 6&#10;3: (짧은뜨기, 2코늘리기)*6"></textarea>
          <pre v-else class="cb-desc-example-pre">{{ form.roundDescText || '입력된 원형 도안 설명이 없습니다.' }}</pre>
          <div class="cb-round-hint">시작 줄은 "매직링 원형 시작 N" 또는 "사슬 원형 시작 N" 두 가지를 지원합니다(매직링은 🌀 나선 아이콘으로 표시). 각 단은 "기호명 N코" 를 콤마로 나열하거나 "(기호명, 기호명)*K" 형식으로 반복 구간을 표기할 수 있습니다. 등록된 기호명과 정확히 일치해야 아이콘으로 표시됩니다.</div>

          <div v-if="!cfReadonly" class="cb-desc-examples">
            <template v-for="grp in cfGroupedRoundExamples" :key="grp.label">
              <div class="cb-symbol-group-title">{{ grp.label }}</div>
              <fo-tab-bar :tabs="grp.tabs" :tab="uiState.roundExampleTab" dense
                @tab-select="id => uiState.roundExampleTab = id" />
            </template>
            <div class="cb-desc-example-body">
              <pre class="cb-desc-example-pre">{{ cfCurrentRoundExample.text }}</pre>
              <button class="btn btn-sm btn-secondary" @click="onUseRoundExample">이 예제 넣기</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="uiState.chartMode!=='round'" class="cb-desc-area">
        <div class="cb-desc-head">
          <span class="cb-desc-title">한글 도안 설명</span>
          <div v-if="!cfReadonly" style="display:flex;gap:6px;">
            <button class="btn btn-sm btn-secondary" @click="onParseDesc">📝→🧩 설명으로 격자 만들기</button>
            <button class="btn btn-sm btn-secondary" @click="onGenDesc">🔄 격자로부터 생성</button>
          </div>
        </div>
        <textarea v-model="form.descText" :readonly="cfReadonly" rows="6" class="form-control cb-desc-textarea"
          placeholder="[격자로부터 생성] 버튼을 누르면 격자 내용을 바탕으로 한글 설명이 자동으로 채워집니다. 반대로 &quot;1단: 사슬뜨기 12코&quot; 같은 설명을 직접 입력하고 [설명으로 격자 만들기]를 누르면 격자가 자동으로 채워집니다."></textarea>

        <div v-if="!cfReadonly" class="cb-desc-examples">
          <fo-tab-bar :tabs="descExampleTabs" :tab="uiState.descExampleTab" dense
            @tab-select="id => uiState.descExampleTab = id" />
          <div class="cb-desc-example-body">
            <pre class="cb-desc-example-pre">{{ cfCurrentDescExample.text }}</pre>
            <button class="btn btn-sm btn-secondary" @click="onUseDescExample">이 예제 넣기</button>
          </div>
        </div>
      </div>

      <div class="cb-detail-bottom-actions">
        <template v-if="cfReadonly">
          <button class="btn btn_edit cb-save-btn" @click="onSwitchToEdit">수정</button>
          <button v-if="form.patternId" class="btn btn_delete cb-del-btn" @click="onDeletePattern">삭제</button>
        </template>
        <template v-else>
          <button class="btn btn_save cb-save-btn" @click="onSave" :disabled="uiState.loading">저장</button>
          <button v-if="form.patternId" class="btn btn_delete cb-del-btn" @click="onDeletePattern">삭제</button>
          <button v-if="form.patternId" class="btn btn_cancel cb-del-btn" @click="onCancelEdit">취소</button>
          <button v-if="!form.patternId" class="btn btn_reset cb-del-btn" @click="onResetForm">초기화</button>
        </template>
      </div>
    </div>

    <!-- 우측: 기호 팔레트 + 배색 + 사용 실 -->
    <div class="cb-panel cb-panel-side" :class="{ 'cb-locked': cfReadonly }">
      <div class="cb-side-title">기호 팔레트</div>
      <div class="cb-symbol-grid">
        <div class="cb-symbol-btn cb-symbol-btn-eraser" :class="{ active: uiState.activeSymbolId===null }"
          title="지우개(빈칸)" @click="uiState.activeSymbolId = null">⌫</div>
      </div>
      <template v-for="grp in cfGroupedSymbols" :key="grp.label">
        <div class="cb-symbol-group-title">{{ grp.label }}</div>
        <div class="cb-symbol-grid">
          <div v-for="s in grp.items" :key="s.symbolId"
            class="cb-symbol-btn" :class="{ active: uiState.activeSymbolId===s.symbolId }"
            :title="s.symbolNm + (s.symbolDesc ? (' — ' + s.symbolDesc) : '')"
            @click="uiState.activeSymbolId = s.symbolId">
            <span v-if="fnSymIcon(s)" v-html="fnSymIcon(s)"></span>
            <template v-else>{{ s.symbolChar }}</template>
          </div>
        </div>
      </template>
      <div class="cb-symbol-name">{{ (symbolMap[uiState.activeSymbolId] || {}).symbolNm || '' }}</div>

      <div class="cb-side-title">배색</div>
      <div class="cb-color-grid">
        <div v-for="hex in PRESET_COLORS" :key="hex" class="cb-color-swatch"
          :class="{ active: uiState.activeColor===hex }" :style="'background:'+hex" :title="hex"
          @click="onPickPresetColor(hex)"></div>
      </div>
      <input type="color" v-model="uiState.activeColor" class="cb-color-custom" title="직접 배색 선택" />

      <div v-if="yarns.length" class="cb-side-title">등록된 실</div>
      <div v-if="yarns.length" class="cb-yarn-grid">
        <div v-for="y in yarns" :key="y.yarnId" class="cb-yarn-swatch"
          :class="{ active: uiState.activeYarnId===y.yarnId }" :style="'background:'+y.colorHex"
          :title="y.yarnNm + (y.brandNm ? (' — ' + y.brandNm) : '')"
          @click="onPickYarnColor(y)"></div>
      </div>

      <div class="cb-side-title">이 도안에 사용된 실</div>
      <div class="cb-yarn-chips">
        <div v-for="py in patternYarns" :key="py.yarnId" class="cb-yarn-chip">
          <span class="cb-yarn-chip-dot" :style="'background:'+((yarnMap[py.yarnId]||{}).colorHex||'#ccc')"></span>
          <span class="cb-yarn-chip-nm">{{ (yarnMap[py.yarnId]||{}).yarnNm || py.yarnId }}</span>
          <input v-model="py.usageDesc" :readonly="cfReadonly" class="cb-yarn-chip-desc" placeholder="예: 메인 색상" />
          <span v-if="!cfReadonly" class="cb-yarn-chip-del" @click="onRemovePatternYarn(py.yarnId)">✕</span>
        </div>
        <div v-if="!patternYarns.length" class="cb-empty-hint">위 "등록된 실"에서 클릭하면 재료로 추가됩니다.</div>
      </div>
    </div>
  </div>
</div>
`,
};
