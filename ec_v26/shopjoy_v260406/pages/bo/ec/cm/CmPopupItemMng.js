/* ShopJoy Admin - 팝업항목관리 (공통 선택/조회 팝업의 항목 속성)
 * cm_popup_item 관리. 팝업 정의(cm_popup)는 [팝업관리] 화면에서 다룬다.
 *  - 좌측: 팝업 목록 (검색으로 좁힘)
 *  - 우측: 선택한 팝업의 항목 목록 + 인라인 항목 폼
 *  - 항목의 조회항목·목록항목 여부가 곧 팝업 화면의 조회영역·목록컬럼이 된다.
 *  - [미리보기]로 실제 선택 팝업(BoCmPopupModal)을 그대로 띄워 확인
 */
window.CmPopupItemMng = {
  name: 'CmPopupItemMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
    dtlId:    { type: String,   default: null },  // 팝업관리에서 넘어올 때 대상 팝업ID
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, onMounted } = Vue;
    const { showToast, showConfirm } = window.boApp;

    const popups = reactive([]);   /* 좌측 팝업 목록 */
    const items  = reactive([]);   /* 선택 팝업의 항목 */
    const codeGrps = reactive([]); /* CODE 유형 항목의 코드그룹 선택지 */
    const codes = reactive({});
    const uiState = reactive({ loading: false, itemLoading: false });

    const searchParam = reactive({ searchValue: '', popupPattern: '' });
    const popupGridPager = reactive({
      pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1,
      pageSizes: [10, 20, 30, 50],
    });

    /* 선택된 팝업 */
    const popupState = reactive({ selectedId: null, popupCode: '', popupNm: '', popupPattern: 1 });

    /* 항목 상세 */
    const itemDetail = reactive({ selectedId: null, isNew: false, show: false });
    const _initItemForm = () => ({
      popupItemId: null, fieldNm: '', fieldLabel: '', fieldTypeCd: 'TEXT', codeGrp: '',
      selectExpr: '', sessionCondField: '', requiredYn: 'N', searchYn: 'N', searchTypeCd: 'LIKE', listYn: 'Y', treeLabelYn: 'N',
      colWidth: '', colAlign: '', linkYn: 'N', sortOrd: 10, useYn: 'Y',
    });
    const itemForm = reactive(_initItemForm());
    const itemErrors = reactive({});

    /* 미리보기 — 항목 설정이 실제 팝업에 어떻게 반영됐는지 + 호출 정보·응답정보 */
    const previewModal = reactive({ show: false, popupCode: '', multi: false, logs: [], cbArgs: null, resultAt: '' });

    const cfSiteId = computed(() => window.boCommonFilter?.siteId || '');
    const FIELD_TYPES = ['TEXT', 'NUMBER', 'DATE', 'CODE', 'BADGE'];
    const PATTERN_LABELS = { 1: '① 조회+목록', 2: '② 조회+트리+목록', 3: '③ 트리 전용' };
    /* 좁은 칸용 축약 기호 (전체 라벨은 title 로 노출) */
    const PATTERN_MARKS = { 1: '①', 2: '②', 3: '③' };

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param) => {
      if (cmd === 'searchParam-list')  { popupGridPager.pageNo = 1; return handleSearchList(); }
      if (cmd === 'searchParam-reset') { searchParam.searchValue = ''; searchParam.popupPattern = ''; popupGridPager.pageNo = 1; return handleSearchList(); }
      if (cmd === 'popupGrid-setPage')  { popupGridPager.pageNo = param; return handleSearchList(); }
      if (cmd === 'popupGrid-sizeChange') { popupGridPager.pageNo = 1; return handleSearchList(); }
      if (cmd === 'items-add')         return openItemNew();
      if (cmd === 'itemForm-save')     return handleSaveItem();
      if (cmd === 'itemForm-close')    { itemDetail.show = false; itemDetail.selectedId = null; return; }
      if (cmd === 'popup-preview' || cmd === 'popup-previewMulti') {
        /* param 이 있으면 그 행, 없으면(다시 열기) 직전에 보던 팝업 */
        previewModal.popupCode = (param ? param.popupCode : previewModal.popupCode) || popupState.popupCode;
        previewModal.multi = (cmd === 'popup-previewMulti');
        previewModal.logs.splice(0, previewModal.logs.length);
        previewModal.cbArgs = null;
        previewModal.resultAt = '';
        previewModal.show = true;
        return;
      }
      if (cmd === 'preview-apiLog')  { previewModal.logs.unshift(param); if (previewModal.logs.length > 20) previewModal.logs.pop(); return; }
      if (cmd === 'preview-clear')   { previewModal.logs.splice(0, previewModal.logs.length); previewModal.cbArgs = null; return; }
      if (cmd === 'popup-goDefine')    return props.navigate('cmPopupMng', { id: popupState.selectedId });
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'popups-cellClick') {
        if (colKey === 'btn_row_preview')      return handleBtnAction('popup-preview', row);
        if (colKey === 'btn_row_previewMulti') return handleBtnAction('popup-previewMulti', row);
        if ((e.col ? e.col.link : false) || colKey === '__no__') return selectPopup(row);
        return;
      }
      if (cmd === 'items-cellClick') {
        if (colKey === 'btn_row_edit')   return openItemEdit(row);
        if (colKey === 'btn_row_delete') return handleDeleteItem(row);
        if ((e.col ? e.col.link : false) || colKey === '__no__') return openItemEdit(row);
        return;
      }
      console.warn('[handleGridCellAction] unknown cmd:', cmd);
    };

    /* ##### [03] 초기 함수 ######################################################### */


    /* initPage — 화면 로드 시퀀스. 마운트 시 실행한다. */
    const initPage = async () => {
      await handleSearchList();
      await handleSearchCodeGrps();
      /* 팝업관리에서 [항목관리]로 넘어온 경우 해당 팝업을 바로 연다 */
      if (props.dtlId) {
        const hit = popups.find(p => String(p.popupId) === String(props.dtlId));
        if (hit) selectPopup(hit);
      }
    };
    onMounted(initPage);

    /* ##### [04] 내장 사용 함수 #################################################### */

    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.cmPopupPick.getPopupPage({
          siteId: cfSiteId.value,
          searchValue: searchParam.searchValue || undefined,
          popupPattern: searchParam.popupPattern || undefined,
          pageNo: popupGridPager.pageNo, pageSize: popupGridPager.pageSize,
        }, '팝업항목관리', '팝업조회');
        const d = res.data?.data || {};
        popups.splice(0, popups.length, ...(d.pageList || []));
        popupGridPager.pageTotalCount = d.pageTotalCount || 0;
        popupGridPager.pageTotalPage = d.pageTotalPage || 1;
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    const handleSearchCodeGrps = async () => {
      try {
        const res = await boApiSvc.syCodeGrp.getAll({ siteId: cfSiteId.value }, '팝업항목관리', '코드그룹조회');
        codeGrps.splice(0, codeGrps.length, ...(res.data?.data || []));
      } catch (err) {
        codeGrps.splice(0, codeGrps.length);   /* 실패해도 화면은 유지 */
      }
    };

    const selectPopup = (row) => {
      popupState.selectedId = row.popupId;
      popupState.popupCode = row.popupCode;
      popupState.popupNm = row.popupNm;
      popupState.popupPattern = row.popupPattern || 1;
      /* 팝업이 바뀌면 열려 있던 항목 폼은 닫는다 (다른 팝업의 항목이 남지 않도록) */
      itemDetail.show = false;
      itemDetail.selectedId = null;
      handleSearchItems();
    };

    const handleSearchItems = async () => {
      if (!popupState.selectedId) { items.splice(0, items.length); return; }
      uiState.itemLoading = true;
      try {
        const res = await boApiSvc.cmPopupPick.getPopupItems(popupState.selectedId, '팝업항목관리', '항목조회');
        items.splice(0, items.length, ...(res.data?.data || []));
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '항목 조회 오류', 'error', 0);
      } finally {
        uiState.itemLoading = false;
      }
    };

    const openItemNew = () => {
      if (!popupState.selectedId) return showToast('팝업을 먼저 선택하세요.', 'error');
      itemDetail.selectedId = null;
      itemDetail.isNew = true;
      itemDetail.show = true;
      const maxOrd = items.reduce((m, p) => Math.max(m, p.sortOrd || 0), 0);
      Object.assign(itemForm, _initItemForm(), { sortOrd: maxOrd + 10 });
    };

    const openItemEdit = (row) => {
      itemDetail.selectedId = row.popupItemId;
      itemDetail.isNew = false;
      itemDetail.show = true;
      Object.assign(itemForm, {
        popupItemId: row.popupItemId, fieldNm: row.fieldNm, fieldLabel: row.fieldLabel,
        fieldTypeCd: row.fieldTypeCd || 'TEXT', codeGrp: row.codeGrp || '',
        selectExpr: row.selectExpr || '', sessionCondField: row.sessionCondField || '', requiredYn: row.requiredYn || 'N', searchYn: row.searchYn || 'N', searchTypeCd: row.searchTypeCd || 'LIKE',
        listYn: row.listYn || 'Y', treeLabelYn: row.treeLabelYn || 'N',
        colWidth: row.colWidth || '', colAlign: row.colAlign || '',
        linkYn: row.linkYn || 'N', sortOrd: row.sortOrd || 10, useYn: row.useYn || 'Y',
      });
    };

    const handleSaveItem = async () => {
      Object.keys(itemErrors).forEach(k => delete itemErrors[k]);
      if (!itemForm.fieldNm)    { itemErrors.fieldNm = '필드명을 입력하세요.'; return showToast('입력 내용을 확인해주세요.', 'error'); }
      if (!itemForm.fieldLabel) { itemErrors.fieldLabel = '라벨을 입력하세요.'; return showToast('입력 내용을 확인해주세요.', 'error'); }
      /* CODE 유형은 codeGrp 가 있어야 라벨 변환·검색 드롭다운을 만들 수 있다 */
      if (itemForm.fieldTypeCd === 'CODE' && !itemForm.codeGrp) {
        itemErrors.codeGrp = '공통코드 그룹을 선택하세요.';
        return showToast('CODE 유형은 공통코드 그룹이 필요합니다.', 'error');
      }
      try {
        await boApiSvc.cmPopupPick.itemSave({
          popupItemId: itemDetail.isNew ? null : itemForm.popupItemId,
          siteId: cfSiteId.value, popupId: popupState.selectedId,
          fieldNm: itemForm.fieldNm, fieldLabel: itemForm.fieldLabel,
          fieldTypeCd: itemForm.fieldTypeCd, codeGrp: itemForm.codeGrp || null,
          selectExpr: itemForm.selectExpr || null, sessionCondField: itemForm.sessionCondField || null, requiredYn: itemForm.requiredYn, searchYn: itemForm.searchYn, searchTypeCd: itemForm.searchTypeCd,
          listYn: itemForm.listYn, treeLabelYn: itemForm.treeLabelYn,
          colWidth: itemForm.colWidth || null, colAlign: itemForm.colAlign || null,
          linkYn: itemForm.linkYn, sortOrd: Number(itemForm.sortOrd) || 10, useYn: itemForm.useYn,
        }, '팝업항목관리', '항목저장');
        showToast('저장되었습니다.', 'success');
        itemDetail.show = false;
        await handleSearchItems();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '저장 오류', 'error', 0);
      }
    };

    const handleDeleteItem = async (row) => {
      if (!(await showConfirm('삭제', `[${row.fieldLabel}] 항목을 삭제하시겠습니까?`))) return;
      try {
        await boApiSvc.cmPopupPick.itemRemove(row.popupItemId, '팝업항목관리', '항목삭제');
        showToast('삭제되었습니다.', 'success');
        if (itemDetail.selectedId === row.popupItemId) itemDetail.show = false;
        await handleSearchItems();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '삭제 오류', 'error', 0);
      }
    };

    /* 호출 정보 — 화면이 이 팝업을 부를 때 준 값. cmd(params) 형태로 읽힌다.
       URL·쿼리는 popupCode 로 정해지므로 싣지 않는다. */
    const cfPreviewRequest = computed(() => previewModal.logs[0] || null);

    /** 보기 좋게 들여쓴 JSON (미리보기 패널 표시용) */
    const fnPretty = (o) => o == null ? '' : JSON.stringify(o, null, 2);

    /* 미리보기 수신 — 실제 화면과 똑같이 onCallback(popCmd, param, result) 로 받는다.
       닫기 콜백은 (popCmd, null, null) 로 오므로 결과가 실린 호출만 기록한다. */
    const fnPreviewCallback = (popCmd, param, result) => {
      if (param == null) return;
      previewModal.cbArgs = { popCmd, param, result };
      previewModal.resultAt = new Date().toLocaleTimeString();
    };

    /** 이 팝업을 화면에서 쓰는 예제 코드 — 미리보기가 곧 사용법 문서가 되도록.
        multi 여부에 따라 결과를 꺼내는 방법이 달라져 그 부분을 바꿔 보여준다. */
    const cfPreviewSample = computed(() => {
      const h = previewModal.logs[0];
      if (!h) return '';
      const code  = h.params.popupCode;
      const multi = !!h.params.multi;
      /* 호출 식별자는 cmPopup- 접두어를 붙인다 — 화면이 다른 모달과 콜백을 공유해도 구분된다 */
      const name  = 'cmPopup-' + code + '-pick';
      const NL = String.fromCharCode(10);
      const lines = [
        '<!-- template -->',
        '<bo-cm-popup-modal v-if="pickModal.show" popup-cmd="' + name + '" popup-code="' + code + '"'
          + (multi ? ' :multi="true"' : ''),
        '  :on-callback="fnCallbackModal" @close="pickModal.show = false" />',
        '',
        '/* setup */',
        'const fnCallbackModal = (popCmd, param, result) => {',
        "  if (popCmd === '" + name + "') {",
        '    if (result == null) { pickModal.show = false; return; }   // 닫기',
      ];
      if (multi) {
        lines.push('    // 다중 — result 가 행 배열 (param.multi 로도 판별 가능)');
        lines.push('    result.forEach(row => { /* row.' + code + 'Id */ });');
      } else {
        lines.push('    // 단건 — result 가 곧 선택한 행 (엔티티 필드명 그대로)');
        lines.push('    form.' + code + 'Id = result.' + code + 'Id;');
      }
      lines.push('    pickModal.show = false;');
      lines.push('  }');
      lines.push('};');
      return lines.join(NL);
    });

    /** 콜백 인자 3개를 순서대로 — 화면에 하나씩 나눠 보여준다 */
    const cfPreviewArgs = computed(() => {
      const a = previewModal.cbArgs;
      if (!a) return [];
      return [
        { name: 'popCmd', value: a.popCmd },
        { name: 'param',  value: a.param },
        { name: 'result', value: a.result },
      ];
    });


    /* ##### [05] 사용자 함수 (컬럼정의) ############################################ */

    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue', label: '검색어', type: 'text', placeholder: '팝업명/코드/엔티티명 검색' },
      { key: 'popupPattern', label: '화면패턴', type: 'select', nullLabel: '패턴 전체',
        options: () => Object.keys(PATTERN_LABELS).map(k => ({ value: Number(k), label: PATTERN_LABELS[k] })) },
    ];

    /* 좌측 좁은 칸이라 팝업명이 길면 패턴이 밀려 가린다 → 이름은 말줄임, 패턴은 기호만 */
    columns.popups = [
      { key: 'popupCode', label: '코드', style: 'width:110px;', link: true,
        cellStyle: 'font-family:monospace;font-size:11px;color:#4338ca;font-weight:700;' },
      { key: 'popupNm', label: '팝업명', cellTitle: true,
        cellStyle: 'max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
        cellInnerStyle: (v, row) => popupState.selectedId === row.popupId ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'popupPattern', label: '패턴', style: 'width:52px;', align: 'center',
        cellTitle: (v) => PATTERN_LABELS[v] || String(v),
        fmt: (v) => PATTERN_MARKS[v] || v },
    ];

    columns.items = [
      { key: 'fieldNm', label: '필드명', style: 'width:150px;', link: true,
        cellStyle: 'font-family:monospace;font-size:11px;' },
      { key: 'fieldLabel', label: '라벨',
        cellInnerStyle: (v, row) => itemDetail.selectedId === row.popupItemId ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'fieldTypeCd', label: '유형', style: 'width:80px;', align: 'center' },
      { key: 'codeGrp', label: '코드그룹', style: 'width:150px;',
        cellStyle: 'font-family:monospace;font-size:11px;',
        fmt: (v, row) => row.fieldTypeCd === 'CODE' ? (v || '⚠ 미지정') : '-' },
      { key: 'searchYn', label: '조회항목', style: 'width:80px;',
        badge: (row) => row.searchYn === 'Y' ? 'badge-blue' : 'badge-gray',
        fmt: (v) => v === 'Y' ? '조회' : '-' },
      { key: 'searchTypeCd', label: '연산', style: 'width:70px;', align: 'center',
        fmt: (v, row) => row.searchYn === 'Y' ? (v || 'LIKE') : '-' },
      { key: 'listYn', label: '목록항목', style: 'width:80px;',
        badge: (row) => row.listYn === 'Y' ? 'badge-green' : 'badge-gray',
        fmt: (v) => v === 'Y' ? '목록' : '-' },
      { key: 'treeLabelYn', label: '트리라벨', style: 'width:80px;',
        badge: (row) => row.treeLabelYn === 'Y' ? 'badge-orange' : 'badge-gray',
        fmt: (v) => v === 'Y' ? '트리' : '-' },
      { key: 'linkYn', label: '선택', style: 'width:60px;', align: 'center',
        fmt: (v) => v === 'Y' ? '✔' : '-' },
      { key: 'selectExpr', label: '출력식', style: 'width:110px;', align: 'center',
        cellStyle: 'font-family:monospace;font-size:11px;color:#0369a1;',
        cellTitle: (v) => v ? ('조인 컬럼: ' + v) : '',
        fmt: (v) => v || '-' },
      { key: 'sessionCondField', label: '세션조건', style: 'width:100px;', align: 'center',
        badge: (row) => row.sessionCondField ? 'badge-red' : 'badge-gray',
        cellTitle: (v) => v ? ('로그인 정보의 ' + v + ' 로 서버가 강제') : '',
        fmt: (v) => v || '-' },
      { key: 'requiredYn', label: '필수', style: 'width:60px;', align: 'center',
        fmt: (v) => v === 'Y' ? '✔' : '-' },
      { key: 'sortOrd', label: '정렬', style: 'width:60px;', align: 'center' },
    ];

    columns.itemForm = [
      { key: 'fieldNm', label: '엔티티 필드명', type: 'text', required: true, mono: true, placeholder: 'userNm' },
      { key: 'fieldLabel', label: '화면 라벨', type: 'text', required: true },
      { key: 'fieldTypeCd', label: '필드유형', type: 'select',
        options: () => FIELD_TYPES.map(v => ({ value: v, label: v })),
        hint: 'CODE 선택 시 공통코드 그룹 필수' },
      /* CODE 유형만 코드그룹 지정 — 목록은 코드 라벨로 표시되고 검색은 드롭다운이 된다 */
      { key: 'codeGrp', label: '공통코드 그룹', type: 'select', required: true, mono: true,
        visible: (f) => f.fieldTypeCd === 'CODE',
        nullLabel: '(코드그룹 선택)',
        options: () => codeGrps.map(g => ({
          value: g.codeGrp,
          label: g.codeGrp + (g.grpNm ? ' — ' + g.grpNm : ''),
        })) },
      /* 세션 자동값 — 지정하면 서버가 로그인 정보로 조건을 강제한다(클라이언트 조작 불가) */
      /* 조인 컬럼 출력 — cm_popup.join_clause 의 별칭을 써서 다른 테이블 값을 목록에 표시 */
      { key: 'selectExpr', label: '출력식 (조인 컬럼)', type: 'text', mono: true,
        placeholder: 'b.deptNm (비우면 a.필드명)',
        hint: '팝업의 조인절 별칭 사용 · 결과는 위 필드명 키로 내려감' },
      { key: 'sessionCondField', label: '세션조건 (자동 주입)', type: 'select',
        options: () => ['', 'memberId', 'userId', 'vendorId', 'deptId', 'siteId', 'roleId', 'memberGrade'].map(v => ({ value: v, label: v || '(사용 안함)' })),
        hint: '지정 시 필수로 강제 · 미로그인이면 조회 거절 · 조회영역에 표시 안 됨' },
      { key: 'requiredYn', label: '필수 조회조건', type: 'select',
        visible: (fm) => !fm.sessionCondField,
        options: () => [{ value: 'N', label: '선택' }, { value: 'Y', label: '필수 (없으면 조회 거절)' }] },
      { key: 'searchYn', label: '조회항목 여부', type: 'select',
        options: () => [{ value: 'N', label: '미사용' }, { value: 'Y', label: '조회조건으로 사용' }] },
      { key: 'searchTypeCd', label: '검색연산', type: 'select',
        visible: (f) => f.searchYn === 'Y',
        options: () => [{ value: 'LIKE', label: 'LIKE (부분일치)' }, { value: 'EQ', label: 'EQ (정확히·드롭다운)' }, { value: 'RANGE', label: 'RANGE (범위)' }] },
      { key: 'listYn', label: '목록항목 여부', type: 'select',
        options: () => [{ value: 'Y', label: '목록에 표시' }, { value: 'N', label: '표시 안함' }] },
      { key: 'treeLabelYn', label: '트리 라벨', type: 'select',
        options: () => [{ value: 'N', label: '미사용' }, { value: 'Y', label: '트리 노드 라벨로 사용' }] },
      { key: 'linkYn', label: '선택 트리거', type: 'select',
        options: () => [{ value: 'N', label: '일반 컬럼' }, { value: 'Y', label: '클릭 시 선택' }] },
      { key: 'colWidth', label: '컬럼 폭', type: 'text', placeholder: '120px' },
      { key: 'colAlign', label: '정렬', type: 'select',
        options: () => [{ value: '', label: '기본' }, { value: 'left', label: 'left' }, { value: 'center', label: 'center' }, { value: 'right', label: 'right' }] },
      { key: 'sortOrd', label: '정렬순서', type: 'number' },
      { key: 'useYn', label: '사용여부', type: 'select',
        options: () => [{ value: 'Y', label: '사용' }, { value: 'N', label: '미사용' }] },
    ];

    /* ##### [06] return ############################################################ */

    return {
      popups, items, codeGrps, codes, uiState, searchParam, popupGridPager,
      popupState, itemDetail, itemForm, itemErrors, previewModal, cfPreviewRequest, cfPreviewSample, cfPreviewArgs, fnPreviewCallback, columns, fnPretty,
      handleBtnAction, handleGridCellAction,
    };
  },
  template: /* html */`
<bo-page title="팝업항목관리"
  desc-summary="공통 선택/조회 팝업의 항목 속성(cm_popup_item)을 관리합니다. 항목의 조회항목·목록항목 여부가 곧 팝업의 조회영역·목록컬럼이 됩니다.">
  <!-- ===== ■. 검색 =========================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </bo-container>

  <!-- ===== ■. (좌)팝업 목록 + (우)항목 목록 ================================== -->
  <div class="bo-2col" style="display:grid;grid-template-columns:500px 1fr;gap:0 12px;">
    <!-- 좁은 칸이라 .bo-grid-narrow 로 전역 min-width(720px)를 풀어 가로 스크롤을 없앤다 -->
    <bo-container class="bo-grid-narrow" title="팝업 목록"
      :count-text="'총 ' + popupGridPager.pageTotalCount + '건'">
      <bo-grid bare :columns="columns.popups" :rows="popups" row-key="popupId"
        :selected-key="popupState.selectedId"
        :row-class="row => popupState.selectedId === row.popupId ? 'active' : ''"
        empty-text="등록된 팝업이 없습니다."
        grid-id="popups-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" row-actions>
        <template #row-actions="{ row, gridId }">
          <div class="actions" style="white-space:nowrap;flex-wrap:nowrap;">
            <button class="btn btn_preview btn-xs" title="단일선택으로 미리보기"
              @click.stop="handleGridCellAction(gridId, 'btn_row_preview', row)">👁</button>
            <button class="btn btn_preview btn-xs" title="다중선택으로 미리보기"
              @click.stop="handleGridCellAction(gridId, 'btn_row_previewMulti', row)">👁+</button>
          </div>
        </template>
      </bo-grid>
      <bo-pager :pager="popupGridPager"
        :on-set-page="n => handleBtnAction('popupGrid-setPage', n)"
        :on-size-change="() => handleBtnAction('popupGrid-sizeChange')" />
    </bo-container>

    <bo-container :title="popupState.selectedId ? '항목 목록 — ' + popupState.popupNm : '항목 목록'"
      :count-text="popupState.selectedId ? '총 ' + items.length + '개' : ''">
      <template #toolbar-actions>
        <button v-if="popupState.selectedId" class="btn btn_detail btn-sm"
          @click="handleBtnAction('popup-goDefine')">팝업 정의</button>
        <button v-if="popupState.selectedId" class="btn btn_new btn-sm"
          @click="handleBtnAction('items-add')">+ 항목 추가</button>
      </template>
      <bo-grid v-if="popupState.selectedId" bare :columns="columns.items" :rows="items" row-key="popupItemId"
        :selected-key="itemDetail.selectedId"
        :row-class="row => itemDetail.selectedId === row.popupItemId ? 'active' : ''"
        empty-text="항목이 없습니다. [+ 항목 추가]로 등록하세요."
        grid-id="items-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" row-actions>
        <template #row-actions="{ row, gridId }">
          <div class="actions" style="white-space:nowrap;flex-wrap:nowrap;">
            <button class="btn btn_row_edit" @click.stop="handleGridCellAction(gridId, 'btn_row_edit', row)">수정</button>
            <button class="btn btn_row_delete" @click.stop="handleGridCellAction(gridId, 'btn_row_delete', row)">삭제</button>
          </div>
        </template>
      </bo-grid>
      <div v-else style="padding:32px;text-align:center;color:#aaa;">좌측에서 팝업을 선택하세요.</div>
    </bo-container>
  </div>

  <!-- ===== ■. 항목 상세 ====================================================== -->
  <bo-container :title="itemDetail.isNew ? '항목 신규 등록' : '항목 상세 / 수정'"
    :title-id="itemDetail.show ? (itemDetail.isNew ? '' : itemForm.popupItemId) : ''">
    <div v-if="itemDetail.show" style="padding:12px;">
      <bo-form-area :columns="columns.itemForm" :form="itemForm" :errors="itemErrors"
        :cols="3" :show-actions="false" />
      <div class="form-actions">
        <button class="btn btn_save" @click="handleBtnAction('itemForm-save')">저장</button>
        <button class="btn btn_close" @click="handleBtnAction('itemForm-close')">닫기</button>
      </div>
    </div>
    <div v-else style="padding:32px;text-align:center;color:#aaa;">
      항목을 선택하거나 [+ 항목 추가]를 클릭하세요.
    </div>
  </bo-container>

  <!-- ===== ■. 미리보기 (실제 공통 선택 팝업) ================================= -->
  <!-- ===== ■. 미리보기 결과 (호출 정보 / 응답정보) ============================ -->
  <bo-container v-if="previewModal.popupCode" title="미리보기 결과"
    :count-text="previewModal.popupCode + (previewModal.multi ? ' · 다중선택' : ' · 단일선택')">
    <template #toolbar-actions>
      <button class="btn btn_preview btn-sm" @click="handleBtnAction('popup-preview')">👁 다시 열기</button>
      <button class="btn btn_preview btn-sm" @click="handleBtnAction('popup-previewMulti')">👁 멀티로 열기</button>
      <button class="btn btn_reset btn-sm" @click="handleBtnAction('preview-clear')">지우기</button>
    </template>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px;padding:12px;">
      <div>
        <div class="list-title" style="font-size:12px;margin-bottom:6px;">호출 정보</div>
        <div v-if="!previewModal.logs.length" style="padding:14px;color:#aaa;font-size:12px;">
          [👁 미리보기]로 팝업을 열면 호출 설정과 요청 내용이 표시됩니다.
        </div>
        <template v-else>
          <pre style="background:#0f172a;color:#e2e8f0;border-radius:6px;padding:10px;max-height:200px;overflow:auto;font-size:11px;margin:0;">{{ fnPretty(cfPreviewRequest) }}</pre>
          <!-- 미리보기가 곧 사용법 문서 — 화면에 붙여 쓸 수 있는 예제 -->
          <div style="font-family:monospace;font-size:11px;color:#64748b;margin:8px 0 2px;">사용 예제</div>
          <pre style="background:#0f172a;color:#fbbf24;border-radius:6px;padding:10px;max-height:280px;overflow:auto;font-size:11px;margin:0;">{{ cfPreviewSample }}</pre>
        </template>
      </div>
      <div>
        <div class="list-title" style="font-size:12px;margin-bottom:6px;">
          콜백 인자
          <span style="font-size:11px;color:#999;font-weight:400;margin-left:6px;">fnCallbackModal(popCmd, param, result)</span>
          <span v-if="previewModal.resultAt" style="font-size:11px;color:#999;font-weight:400;margin-left:6px;">{{ previewModal.resultAt }}</span>
        </div>
        <div v-if="previewModal.cbArgs == null" style="padding:14px;color:#aaa;font-size:12px;">
          팝업에서 행을 선택하면 화면의 콜백이 받는 인자 3개가 그대로 표시됩니다.
        </div>
        <!-- 좌측(호출정보 200 + 예제 280)과 높이를 맞춰 다중선택 결과가 잘리지 않게 -->
        <div v-else style="display:flex;flex-direction:column;gap:6px;max-height:640px;overflow:auto;">
          <div v-for="(a, i) in cfPreviewArgs" :key="i">
            <div style="font-family:monospace;font-size:11px;color:#64748b;margin-bottom:2px;">{{ i + 1 }}. {{ a.name }}</div>
            <pre style="background:#0f172a;color:#a7f3d0;border-radius:6px;padding:8px;overflow:auto;font-size:11px;margin:0;">{{ fnPretty(a.value) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </bo-container>

  <bo-cm-popup-modal v-if="previewModal.show" :popup-cmd="'preview-' + previewModal.popupCode" :popup-code="previewModal.popupCode" :multi="previewModal.multi ? true : null" debug :on-callback="fnPreviewCallback" @api-log="e => handleBtnAction('preview-apiLog', e)" @close="previewModal.show = false" />
</bo-page>
`,
};
