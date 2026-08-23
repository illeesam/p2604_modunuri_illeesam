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
  },
  setup(props) {
    const { reactive, ref, computed, onMounted, onUnmounted } = Vue;

    const symbols = reactive([]);
    const yarns = reactive([]);
    const patternYarns = reactive([]); // [{ yarnId, usageDesc }] — 이 도안에 사용된 실(재료) 목록
    const uiState = reactive({
      loading: false, activeSymbolId: null, activeColor: '#333333', activeYarnId: null,
      isPainting: false, dragMode: 'paint', thumbUploading: false,
      dtlMode: 'edit', // 'view' | 'edit' — 목록에서 행 클릭=보기, [수정] 클릭=수정모드 (신규 작성은 항상 edit)
    });
    const cfReadonly = computed(() => uiState.dtlMode === 'view');
    const thumbInputRef = ref(null);

    const form = reactive({ patternId: null, patternNm: '', rowCount: 15, maxStitchCount: 20, descText: '', thumbnailUrl: '' });
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
      Object.assign(form, { patternId: null, patternNm: '', rowCount: 15, maxStitchCount: 20, descText: '', thumbnailUrl: '' });
      Object.keys(cellMap).forEach(k => delete cellMap[k]);
      patternYarns.splice(0, patternYarns.length);
      uiState.dtlMode = 'edit';
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
        maxStitchCount: p.maxStitchCount || 20, descText: p.descText || '', thumbnailUrl: p.thumbnailUrl || '' });
      Object.keys(cellMap).forEach(k => delete cellMap[k]);
      const cellRes = await mdCbApiSvc.patternCell.getList(p.patternId, '코바늘도안', '격자조회');
      (cellRes.data?.data || []).forEach(c => {
        cellMap[c.rowNo + '_' + c.colNo] = { symbolId: c.symbolId, colorHex: c.colorHex };
      });
      const yarnRes = await mdCbApiSvc.patternYarn.getList(p.patternId, '코바늘도안', '재료조회');
      patternYarns.splice(0, patternYarns.length, ...(yarnRes.data?.data || []).map(y => ({ yarnId: y.yarnId, usageDesc: y.usageDesc || '' })));
      uiState.dtlMode = 'view'; // 목록에서 들어온 진입은 항상 보기모드로 시작 — [수정] 클릭시에만 편집
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
    const onParseDesc = () => {
      if (!form.descText || !form.descText.trim()) { props.showToast('먼저 도안 설명을 입력해주세요.', 'error'); return; }
      if (!confirm('현재 격자 내용을 지우고 도안 설명으로부터 다시 채우시겠습니까?')) return;
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

    /* onResetForm — 신규 작성 중 입력한 내용을 전부 지우고 처음 상태로("취소"는 기존 레코드 전용이라
       빈 신규 작성에는 대신 이 버튼을 쓴다) */
    const onResetForm = () => {
      if (!confirm('입력한 내용을 모두 초기화하시겠습니까?')) return;
      onNewPattern();
    };

    /* onSave — 도안 저장(메타+격자+재료 일괄) */
    const onSave = async () => {
      if (!form.patternNm) { props.showToast('도안명을 입력해주세요.', 'error'); return; }
      uiState.loading = true;
      try {
        const body = { patternNm: form.patternNm, rowCount: form.rowCount, maxStitchCount: form.maxStitchCount,
          descText: form.descText, thumbnailUrl: form.thumbnailUrl };
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
      if (!confirm(form.patternNm + ' 도안을 삭제하시겠습니까?')) return;
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
      symbols, yarns, patternYarns, uiState, form, cellMap, symbolMap, yarnMap, cfGroupedSymbols, cfRows, cfCols, cfReadonly,
      PRESET_COLORS, GRID_PRESETS, thumbInputRef, fnSymIcon, fnCellDisplay,
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
        <div class="cb-toolbar-actions">
          <template v-if="cfReadonly">
            <button v-if="form.patternId" class="btn btn_delete cb-del-btn" @click="onDeletePattern">삭제</button>
            <button class="btn btn_edit cb-save-btn" @click="onSwitchToEdit">수정</button>
          </template>
          <template v-else>
            <button v-if="!form.patternId" class="btn btn_reset cb-del-btn" @click="onResetForm">초기화</button>
            <button v-if="form.patternId" class="btn btn_cancel cb-del-btn" @click="onCancelEdit">취소</button>
            <button v-if="form.patternId" class="btn btn_delete cb-del-btn" @click="onDeletePattern">삭제</button>
            <button class="btn btn_save cb-save-btn" @click="onSave" :disabled="uiState.loading">저장</button>
          </template>
        </div>
      </div>

      <div class="cb-grid-wrap" :class="{ 'cb-locked': cfReadonly }">
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

      <div class="cb-desc-area">
        <div class="cb-desc-head">
          <span class="cb-desc-title">한글 도안 설명</span>
          <div v-if="!cfReadonly" style="display:flex;gap:6px;">
            <button class="btn btn-sm btn-secondary" @click="onParseDesc">📝→🧩 설명으로 격자 만들기</button>
            <button class="btn btn-sm btn-secondary" @click="onGenDesc">🔄 격자로부터 생성</button>
          </div>
        </div>
        <textarea v-model="form.descText" :readonly="cfReadonly" rows="6" class="form-control cb-desc-textarea"
          placeholder="[격자로부터 생성] 버튼을 누르면 격자 내용을 바탕으로 한글 설명이 자동으로 채워집니다. 반대로 &quot;1단: 사슬뜨기 12코&quot; 같은 설명을 직접 입력하고 [설명으로 격자 만들기]를 누르면 격자가 자동으로 채워집니다."></textarea>
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
