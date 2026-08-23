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
    /* cfPaletteSymbols — 등록된 기호 앞에 "지우개(빈칸)" 브러시를 추가한 팔레트 표시용 목록 */
    const cfPaletteSymbols = computed(() => [{ symbolId: null, symbolChar: '⌫', symbolNm: '지우개(빈칸)' }, ...symbols]);
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
      symbols, yarns, patternYarns, uiState, form, cellMap, symbolMap, yarnMap, cfPaletteSymbols, cfRows, cfCols, cfReadonly,
      PRESET_COLORS, GRID_PRESETS, thumbInputRef,
      onNewPattern, onBackToList, onCellMouseDown, onCellMouseEnter, onGenDesc, onSave, onDeletePattern,
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
              {{ cellMap[r+'_'+c] ? (symbolMap[cellMap[r+'_'+c].symbolId] || {}).symbolChar : '' }}
            </div>
          </div>
        </div>
      </div>

      <div class="cb-desc-area">
        <div class="cb-desc-head">
          <span class="cb-desc-title">한글 도안 설명</span>
          <button v-if="!cfReadonly" class="btn btn-sm btn-secondary" @click="onGenDesc">🔄 격자로부터 생성</button>
        </div>
        <textarea v-model="form.descText" :readonly="cfReadonly" rows="6" class="form-control cb-desc-textarea"
          placeholder="[격자로부터 생성] 버튼을 누르면 격자 내용을 바탕으로 한글 설명이 자동으로 채워집니다. 직접 수정도 가능합니다."></textarea>
      </div>
    </div>

    <!-- 우측: 기호 팔레트 + 배색 + 사용 실 -->
    <div class="cb-panel cb-panel-side" :class="{ 'cb-locked': cfReadonly }">
      <div class="cb-side-title">기호 팔레트</div>
      <div class="cb-symbol-grid">
        <div v-for="s in cfPaletteSymbols" :key="s.symbolId || '__eraser__'"
          class="cb-symbol-btn" :class="{ active: uiState.activeSymbolId===s.symbolId, 'cb-symbol-btn-eraser': s.symbolId===null }"
          :title="s.symbolNm + (s.symbolDesc ? (' — ' + s.symbolDesc) : '')"
          @click="uiState.activeSymbolId = s.symbolId">
          {{ s.symbolChar }}
        </div>
      </div>
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
