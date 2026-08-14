/* ShopJoy Admin - 팝업관리 (공통 선택/조회 팝업 정의)
 * cm_popup(팝업 정의) 관리. 항목 속성(cm_popup_item)은 [팝업항목관리] 화면에서 다룬다.
 *  - 검색 + 팝업 목록 + 인라인 상세폼(패턴/엔티티/필드/정렬/고정조건)
 *  - [미리보기]로 실제 선택 팝업(BoCmPopupModal)을 그대로 띄워 확인
 *  - [항목관리]로 해당 팝업의 항목 화면으로 이동
 */
window.CmPopupMng = {
  name: 'CmPopupMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, onMounted } = Vue;
    const { showToast, showConfirm } = window.boApp;

    const popups = reactive([]);   /* cm_popup 목록 */
    const uiState = reactive({ loading: false, itemLoading: false, tab: 'info' });
    const codes = reactive({});

    const searchParam = reactive({ searchValue: '', popupPattern: '' });
    /* 정의가 늘어나면 한 화면을 넘기므로 서버 페이징 (클라이언트 슬라이싱 금지 정책) */
    const baseGridPager = reactive({
      pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1,
      pageSizes: [10, 20, 30, 50, 100],
    });

    /* 팝업 상세 */
    const baseDetail = reactive({ selectedId: null, isNew: false });
    const _initBaseForm = () => ({
      popupId: null, popupCode: '', popupNm: '', popupPattern: 1, entityNm: '',
      idField: '', nmField: '', parentField: '', siteField: 'siteId', joinClause: '',
      orderBy: '', baseWhere: '', multiYn: 'N', sysScope: '^BO^', pagingYn: 'Y', pageSize: 10, modalWidth: '900px', applyUiMemo: '',
      useYn: 'Y', sortOrd: 10, remark: '',
    });
    const baseForm = reactive(_initBaseForm());
    const baseErrors = reactive({});

    /* 탭 정의 — 기본정보(cm_popup) / 항목정보(cm_popup_item, 신규 미저장 시 비활성) */
    const tabs = reactive([
      { id: 'info',  label: '기본정보', icon: '📋' },
      { id: 'items', label: '항목정보', icon: '📑', get count() { return items.length; } },
    ]);

    /* 항목정보(cm_popup_item) — 선택한 팝업의 항목 목록 + 인라인 항목 폼 */
    const items    = reactive([]);   /* 선택 팝업의 항목 */
    const codeGrps = reactive([]);   /* CODE 유형 항목의 코드그룹 선택지 */
    const itemDetail = reactive({ selectedId: null, isNew: false, show: false });
    const _initItemForm = () => ({
      popupItemId: null, fieldNm: '', fieldLabel: '', fieldTypeCd: 'TEXT', codeGrp: '',
      selectExpr: '', sessionCondField: '', requiredYn: 'N', searchYn: 'N', searchTypeCd: 'LIKE', listYn: 'Y', treeLabelYn: 'N',
      colWidth: '', colAlign: '', linkYn: 'N', sortOrd: 10, useYn: 'Y',
    });
    const itemForm = reactive(_initItemForm());
    const itemErrors = reactive({});
    const FIELD_TYPES = ['TEXT', 'NUMBER', 'DATE', 'CODE', 'BADGE'];

    /* 미리보기 모달 */
    /* 미리보기 — 실제 팝업을 띄우고, 어떤 파라미터로 조회했는지와 무엇이 선택됐는지 남긴다 */
    const previewModal = reactive({
      show: false, popupCode: '', multi: false,   /* multi=true 면 다중선택으로 미리보기 */
      logs: [],        /* BoCmPopupModal 이 올리는 api-log */
      cbArgs: null,    /* fnCallbackModal 이 받는 인자 3개 그대로 */
      resultAt: '',
    });

    const cfSiteId = computed(() => window.boCommonFilter?.siteId || '');

    /* 화면패턴 — "어떤 영역이 있는가"만 결정한다.
       선택목록(칩) 영역은 다중선택일 때 자동으로 붙으므로 패턴에 넣지 않는다. */
    const PATTERN_OPTS = [
      { value: 1, label: '① 조회+목록',      desc: '조회영역 + 목록 그리드' },
      { value: 2, label: '② 조회+트리+목록', desc: '좌측 트리로 목록을 좁힌다' },
      { value: 3, label: '③ 트리 전용',      desc: '목록 없이 트리 노드 자체를 고른다' },
    ];
    const PATTERN_LABELS = PATTERN_OPTS.reduce((m, o) => { m[o.value] = o.label; return m; }, {});


    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param) => {
      if (cmd === 'searchParam-list')  { baseGridPager.pageNo = 1; return handleSearchList(); }
      if (cmd === 'searchParam-reset') { searchParam.searchValue = ''; searchParam.popupPattern = ''; baseGridPager.pageNo = 1; return handleSearchList(); }
      if (cmd === 'baseGrid-setPage')  { baseGridPager.pageNo = param; return handleSearchList(); }
      if (cmd === 'baseGrid-sizeChange') { baseGridPager.pageNo = 1; return handleSearchList(); }
      if (cmd === 'popups-add')        return openPopupNew();
      if (cmd === 'baseForm-save')     return handleSavePopup();
      if (cmd === 'baseForm-close')    return resetPopupDetail();
      if (cmd === 'tab-select')        { uiState.tab = param; return; }
      if (cmd === 'items-add')         return openItemNew();
      if (cmd === 'itemForm-save')     return handleSaveItem();
      if (cmd === 'itemForm-close')    { itemDetail.show = false; itemDetail.selectedId = null; return; }
      if (cmd === 'popups-preview' || cmd === 'popups-previewMulti') {
        /* param 이 있으면 그 행, 없으면(다시 열기) 직전에 보던 팝업 */
        previewModal.popupCode = (param ? param.popupCode : previewModal.popupCode) || baseForm.popupCode;
        previewModal.multi = (cmd === 'popups-previewMulti');
        previewModal.logs.splice(0, previewModal.logs.length);
        previewModal.cbArgs = null;
        previewModal.resultAt = '';
        previewModal.show = true;
        return;
      }
      if (cmd === 'preview-apiLog')    { previewModal.logs.unshift(param); if (previewModal.logs.length > 20) previewModal.logs.pop(); return; }
      if (cmd === 'preview-clear')     { previewModal.logs.splice(0, previewModal.logs.length); previewModal.cbArgs = null; return; }
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'popups-cellClick') {
        if (colKey === 'btn_row_preview')      return handleBtnAction('popups-preview', row);
        if (colKey === 'btn_row_previewMulti') return handleBtnAction('popups-previewMulti', row);
        if (colKey === 'btn_row_edit')   return openPopupEdit(row);
        if (colKey === 'btn_row_delete') return handleDeletePopup(row);
        if ((e.col ? e.col.link : false) || colKey === '__no__') return openPopupEdit(row);
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
      handleSearchList();
      handleSearchCodeGrps();
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
          pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize,
        }, '팝업관리', '조회');
        const d = res.data?.data || {};
        popups.splice(0, popups.length, ...(d.pageList || []));
        baseGridPager.pageTotalCount = d.pageTotalCount || 0;
        baseGridPager.pageTotalPage = d.pageTotalPage || 1;
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    /* _resetItemsPane — 팝업 선택/해제가 바뀔 때마다 항목 목록·항목 폼·탭을 초기화
       (부모 선택이 바뀌면 자식 선택도 초기화하는 정책 — 다른 팝업의 항목이 남아있지 않도록) */
    const _resetItemsPane = () => {
      items.splice(0, items.length);
      itemDetail.show = false;
      itemDetail.selectedId = null;
      uiState.tab = 'info';
    };

    const openPopupNew = () => {
      baseDetail.selectedId = null;
      baseDetail.isNew = true;
      Object.assign(baseForm, _initBaseForm());
      _resetItemsPane();
    };

    const openPopupEdit = (row) => {
      baseDetail.selectedId = row.popupId;
      baseDetail.isNew = false;
      Object.assign(baseForm, {
        popupId: row.popupId, popupCode: row.popupCode, popupNm: row.popupNm,
        popupPattern: row.popupPattern || 1, entityNm: row.entityNm,
        idField: row.idField, nmField: row.nmField,
        parentField: row.parentField || '', siteField: row.siteField || '', joinClause: row.joinClause || '',
        orderBy: row.orderBy || '', baseWhere: row.baseWhere || '',
        multiYn: row.multiYn || 'N', sysScope: row.sysScope || '^BO^', pagingYn: row.pagingYn || 'Y', pageSize: row.pageSize || 10,
        modalWidth: row.modalWidth || '900px', applyUiMemo: row.applyUiMemo || '', useYn: row.useYn || 'Y',
        sortOrd: row.sortOrd || 10, remark: row.remark || '',
      });
      itemDetail.show = false;
      itemDetail.selectedId = null;
      uiState.tab = 'info';
      handleSearchItems();
    };

    const resetPopupDetail = () => {
      baseDetail.selectedId = null;
      baseDetail.isNew = false;
      Object.assign(baseForm, _initBaseForm());
      _resetItemsPane();
    };

    const handleSavePopup = async () => {
      Object.keys(baseErrors).forEach(k => delete baseErrors[k]);
      if (!baseForm.popupCode) { baseErrors.popupCode = '팝업코드를 입력하세요.'; return showToast('입력 내용을 확인해주세요.', 'error'); }
      if (!baseForm.popupNm)   { baseErrors.popupNm = '팝업명을 입력하세요.'; return showToast('입력 내용을 확인해주세요.', 'error'); }
      if (!baseForm.entityNm)  { baseErrors.entityNm = '엔티티명을 입력하세요.'; return showToast('입력 내용을 확인해주세요.', 'error'); }
      if (!baseForm.idField)   { baseErrors.idField = 'ID 필드를 입력하세요.'; return showToast('입력 내용을 확인해주세요.', 'error'); }
      if (!baseForm.nmField)   { baseErrors.nmField = '표시명 필드를 입력하세요.'; return showToast('입력 내용을 확인해주세요.', 'error'); }
      /* 패턴 2·3 은 트리를 그려야 하므로 부모 필드가 없으면 동작하지 않는다 */
      if (Number(baseForm.popupPattern) >= 2 && !baseForm.parentField) {
        baseErrors.parentField = '트리 패턴은 부모 필드가 필요합니다.';
        return showToast('트리 패턴(②·③)은 트리 부모 필드를 지정해야 합니다.', 'error');
      }
      if (!(await showConfirm('저장', '팝업 정의를 저장하시겠습니까?'))) return;
      try {
        const body = {
          siteId: cfSiteId.value, popupCode: baseForm.popupCode, popupNm: baseForm.popupNm,
          popupPattern: Number(baseForm.popupPattern) || 1, entityNm: baseForm.entityNm,
          idField: baseForm.idField, nmField: baseForm.nmField,
          parentField: baseForm.parentField || '', siteField: baseForm.siteField || '', joinClause: baseForm.joinClause || null,
          orderBy: baseForm.orderBy || '', baseWhere: baseForm.baseWhere || '',
          multiYn: baseForm.multiYn, sysScope: baseForm.sysScope || '^BO^', pagingYn: baseForm.pagingYn, pageSize: Number(baseForm.pageSize) || 10,
          modalWidth: baseForm.modalWidth, applyUiMemo: baseForm.applyUiMemo || null, useYn: baseForm.useYn,
          sortOrd: Number(baseForm.sortOrd) || 10, remark: baseForm.remark,
        };
        if (baseDetail.isNew) {
          const res = await boApiSvc.cmPopupPick.popupCreate(body, '팝업관리', '등록');
          const created = res.data?.data || {};
          baseDetail.selectedId = created.popupId || null;
          baseDetail.isNew = false;
          baseForm.popupId = created.popupId || null;
        } else {
          await boApiSvc.cmPopupPick.popupUpdate(baseForm.popupId, body, '팝업관리', '수정');
        }
        showToast('저장되었습니다.', 'success');
        await handleSearchList();
        await handleSearchItems();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '저장 오류', 'error', 0);
      }
    };

    const handleDeletePopup = async (row) => {
      if (!(await showConfirm('삭제', `[${row.popupNm}] 팝업과 소속 항목을 모두 삭제하시겠습니까?`))) return;
      try {
        await boApiSvc.cmPopupPick.popupRemove(row.popupId, '팝업관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        if (baseDetail.selectedId === row.popupId) resetPopupDetail();
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '삭제 오류', 'error', 0);
      }
    };

    /* ── 항목정보(cm_popup_item) — 선택한 팝업(baseDetail.selectedId)의 항목 목록 + 인라인 폼 ── */

    const handleSearchCodeGrps = async () => {
      try {
        const res = await boApiSvc.syCodeGrp.getAll({ siteId: cfSiteId.value }, '공통팝업관리', '코드그룹조회');
        codeGrps.splice(0, codeGrps.length, ...(res.data?.data || []));
      } catch (err) {
        codeGrps.splice(0, codeGrps.length);   /* 실패해도 화면은 유지 */
      }
    };

    const handleSearchItems = async () => {
      if (!baseDetail.selectedId) { items.splice(0, items.length); return; }
      uiState.itemLoading = true;
      try {
        const res = await boApiSvc.cmPopupPick.getPopupItems(baseDetail.selectedId, '공통팝업관리', '항목조회');
        items.splice(0, items.length, ...(res.data?.data || []));
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '항목 조회 오류', 'error', 0);
      } finally {
        uiState.itemLoading = false;
      }
    };

    const openItemNew = () => {
      if (!baseDetail.selectedId) return showToast('팝업을 먼저 저장하세요.', 'error');
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
      if (!(await showConfirm('저장', '항목을 저장하시겠습니까?'))) return;
      try {
        await boApiSvc.cmPopupPick.itemSave({
          popupItemId: itemDetail.isNew ? null : itemForm.popupItemId,
          siteId: cfSiteId.value, popupId: baseDetail.selectedId,
          fieldNm: itemForm.fieldNm, fieldLabel: itemForm.fieldLabel,
          fieldTypeCd: itemForm.fieldTypeCd, codeGrp: itemForm.codeGrp || null,
          selectExpr: itemForm.selectExpr || null, sessionCondField: itemForm.sessionCondField || null, requiredYn: itemForm.requiredYn, searchYn: itemForm.searchYn, searchTypeCd: itemForm.searchTypeCd,
          listYn: itemForm.listYn, treeLabelYn: itemForm.treeLabelYn,
          colWidth: itemForm.colWidth || null, colAlign: itemForm.colAlign || null,
          linkYn: itemForm.linkYn, sortOrd: Number(itemForm.sortOrd) || 10, useYn: itemForm.useYn,
        }, '공통팝업관리', '항목저장');
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
        await boApiSvc.cmPopupPick.itemRemove(row.popupItemId, '공통팝업관리', '항목삭제');
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

    /** 보기 좋게 들여쓴 JSON (미리보기 결과 표시용) */
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
      /* 상세 폼과 같은 정의를 쓴다 — 라벨이 갈리면 같은 값이 다르게 보인다 */
      { key: 'popupPattern', label: '화면패턴', type: 'select', nullLabel: '패턴 전체',
        options: () => PATTERN_OPTS.map(o => ({ value: o.value, label: o.label })) },
    ];

    columns.popups = [
      { key: 'popupCode', label: '팝업코드', style: 'width:120px;', link: true, mono: true,
        cellStyle: 'font-family:monospace;font-size:11px;color:#4338ca;font-weight:700;' },
      { key: 'popupNm', label: '팝업명',
        cellInnerStyle: (v, row) => baseDetail.selectedId === row.popupId ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'popupPattern', label: '패턴', style: 'width:130px;',
        fmt: (v) => PATTERN_LABELS[v] || v },
      { key: 'entityNm', label: '엔티티', style: 'width:130px;',
        cellStyle: 'font-family:monospace;font-size:11px;' },
      { key: 'multiYn', label: '다중', style: 'width:60px;',
        badge: (row) => row.multiYn === 'Y' ? 'badge-purple' : 'badge-gray',
        fmt: (v) => v === 'Y' ? '다중' : '단일' },
      { key: 'parentField', label: '트리', style: 'width:60px;', align: 'center',
        fmt: (v) => v ? '🌳' : '-' },
      { key: 'sysScope', label: '시스템', style: 'width:90px;', align: 'center',
        fmt: (v) => (v || '^BO^').replace(/\^/g, ' ').trim().replace(/\s+/g, '·') },
      { key: 'pagingYn', label: '페이징', style: 'width:80px;', align: 'center',
        fmt: (v, row) => v === 'N' ? '전체' : ((row.pageSize || 10) + '개') },
      { key: 'applyUiMemo', label: '적용 UI', style: 'min-width:180px;',
        cellStyle: 'font-size:11px;color:#666;',
        cellTitle: (v) => v || '',
        fmt: (v) => !v ? '-' : (v.length > 46 ? v.slice(0, 46) + '…' : v) },
      { key: 'sortOrd', label: '정렬', style: 'width:60px;', align: 'center' },
      { key: 'useYn', label: '사용', style: 'width:70px;',
        badge: (row) => row.useYn === 'Y' ? 'badge-green' : 'badge-gray',
        fmt: (v) => v === 'Y' ? '사용' : '미사용' },
    ];

    columns.baseForm = [
      { key: 'popupCode', label: '팝업코드', type: 'text', required: true, mono: true, placeholder: 'user, dept, prod …' },
      { key: 'popupNm', label: '팝업명(제목)', type: 'text', required: true, colSpan: 2 },
      { key: 'popupPattern', label: '화면패턴', type: 'select',
        options: () => PATTERN_OPTS.map(o => ({ value: o.value, label: o.label })),
        hint: '선택목록은 다중선택 시 자동 표시' },
      { key: 'entityNm', label: 'JPA 엔티티명', type: 'text', required: true, mono: true, placeholder: 'SyUser, PdProd …' },
      /* 다중 여부는 화면(호출부)의 :multi 옵션이 우선 — 여기 값은 미지정 시의 기본값 */
      { key: 'multiYn', label: '다중선택 기본값', type: 'select',
        options: () => [{ value: 'N', label: '단일선택' }, { value: 'Y', label: '다중선택' }],
        hint: '호출부 :multi 가 있으면 그 값이 우선' },
      { key: 'idField', label: 'ID 필드', type: 'text', required: true, mono: true, placeholder: 'userId' },
      { key: 'nmField', label: '표시명 필드', type: 'text', required: true, mono: true, placeholder: 'userNm' },
      { key: 'parentField', label: '트리 부모 필드', type: 'text', mono: true,
        visible: (f) => Number(f.popupPattern) >= 2, placeholder: 'parentDeptId (패턴2·3 필수)' },
      /* 라벨 조인 — 드라이빙 별칭은 항상 a, 조인 별칭은 b~z. to-one 만 허용 */
      { key: 'joinClause', label: '조인절(LEFT JOIN)', type: 'text', mono: true, colSpan: 3,
        placeholder: 'LEFT JOIN SyDept b ON b.deptId = a.deptId',
        hint: '항목의 출력식(b.deptNm)과 함께 사용 · 형태 고정' },
      { key: 'baseWhere', label: '고정조건(JPQL)', type: 'text', mono: true, colSpan: 3, placeholder: "e.useYn = 'Y'" },
      /* 어느 시스템에서 이 팝업을 열 수 있는지. 서버가 이 값으로 BO/FO 접근을 막는다 */
      { key: 'sysScope', label: '사용 시스템', type: 'multiCheck',
        options: [{ value: 'BO', label: '관리자(BO)' }, { value: 'FO', label: '사용자(FO)' }],
        placeholder: '시스템 선택', allLabel: '전체', emptyValue: '^BO^',
        hint: 'FO 미포함 팝업은 사용자 화면에서 차단됨' },
      { key: 'pagingYn', label: '페이징 사용', type: 'select',
        options: () => [{ value: 'Y', label: '사용 (페이저 표시)' }, { value: 'N', label: '미사용 (전체 표시)' }],
        hint: '건수 적은 팝업은 미사용이 고르기 쉬움' },
      /* 페이징 사용 시 = 한 페이지 건수 / 미사용 시 = 한 번에 보여줄 최대 건수 */
      { key: 'pageSize', label: '페이지 크기 / 최대건수', type: 'number',
        hint: '페이징 미사용이면 최대 표시 건수 (상한 500)' },
      { key: 'modalWidth', label: '모달 폭', type: 'text', placeholder: '900px' },
      /* 이 팝업을 쓰는 화면 나열 — 정의를 고치면 여기 적힌 화면 전부에 즉시 반영된다 */
      { key: 'applyUiMemo', label: '적용 UI (화면 파일명)', type: 'textarea', colSpan: 3, rowSpan: 2,
        placeholder: 'PdProdDtl.js, OdOrderDtl.js', hint: '수정 전 영향 범위 확인용' },
      { key: 'sortOrd', label: '정렬순서', type: 'number' },
      { key: 'useYn', label: '사용여부', type: 'select',
        options: () => [{ value: 'Y', label: '사용' }, { value: 'N', label: '미사용' }] },
      { key: 'remark', label: '비고', type: 'textarea', colSpan: 3 },
    ];

    /* 항목정보(cm_popup_item) 그리드 + 인라인 폼 컬럼 */
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
      popups, uiState, codes, searchParam, baseGridPager,
      baseDetail, baseForm, baseErrors, tabs,
      items, codeGrps, itemDetail, itemForm, itemErrors,
      previewModal, cfPreviewRequest, cfPreviewSample, cfPreviewArgs, fnPreviewCallback, columns, PATTERN_LABELS, PATTERN_OPTS, fnPretty,
      handleBtnAction, handleGridCellAction,
    };
  },
  template: /* html */`
<bo-page title="공통팝업관리"
  desc-summary="공통 선택/조회 팝업의 정의(cm_popup)를 관리합니다. 각 팝업의 조회·목록 항목은 [항목관리]에서 설정합니다.">
  <!-- ===== ■. 검색 =========================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </bo-container>

  <!-- ===== ■. 팝업 목록 ====================================================== -->
  <bo-container title="팝업 목록" :count-text="'총 ' + baseGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <button class="btn btn_new" @click="handleBtnAction('popups-add')">+ 신규</button>
    </template>
    <bo-grid bare :columns="columns.popups" :rows="popups" row-key="popupId"
      :selected-key="baseDetail.selectedId"
      :row-class="row => baseDetail.selectedId === row.popupId ? 'active' : ''"
      empty-text="등록된 팝업이 없습니다."
      grid-id="popups-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" row-actions>
      <template #row-actions="{ row, gridId }">
        <div class="actions" style="white-space:nowrap;flex-wrap:nowrap;">
          <button class="btn btn_preview btn-xs" title="단일선택으로 미리보기"
            @click.stop="handleGridCellAction(gridId, 'btn_row_preview', row)">👁 미리보기</button>
          <button class="btn btn_preview btn-xs" title="다중선택으로 미리보기"
            @click.stop="handleGridCellAction(gridId, 'btn_row_previewMulti', row)">👁 멀티</button>
          <button class="btn btn_row_edit" @click.stop="handleGridCellAction(gridId, 'btn_row_edit', row)">수정</button>
          <button class="btn btn_row_delete" @click.stop="handleGridCellAction(gridId, 'btn_row_delete', row)">삭제</button>
        </div>
      </template>
    </bo-grid>
    <bo-pager :pager="baseGridPager"
      :on-set-page="n => handleBtnAction('baseGrid-setPage', n)"
      :on-size-change="() => handleBtnAction('baseGrid-sizeChange')" />
  </bo-container>

  <!-- ===== ■. 팝업 상세 (기본정보/항목정보 탭) ================================= -->
  <bo-container :title="baseDetail.isNew ? '팝업 신규 등록' : '팝업 상세'"
    :title-id="baseDetail.selectedId ? baseDetail.selectedId : ''">
    <div v-if="baseDetail.selectedId || baseDetail.isNew">
      <bo-tab-bar :tabs="tabs" :tab="uiState.tab" :show-modes="false"
        @tab-select="id => handleBtnAction('tab-select', id)" />
      <!-- ===== ■.■. 기본정보 탭 ============================================== -->
      <div v-show="uiState.tab==='info'" style="padding:12px;">
        <bo-form-area :columns="columns.baseForm" :form="baseForm" :errors="baseErrors"
          :cols="3" compact :show-actions="false" />
        <div class="form-actions">
          <button class="btn btn_save" @click="handleBtnAction('baseForm-save')">저장</button>
          <button class="btn btn_close" @click="handleBtnAction('baseForm-close')">닫기</button>
        </div>
      </div>
      <!-- ===== □.□. 기본정보 탭 ============================================== -->
      <!-- ===== ■.■. 항목정보 탭 (cm_popup_item) ============================== -->
      <div v-show="uiState.tab==='items'" style="padding:12px;">
        <div v-if="!baseDetail.selectedId" style="padding:32px;text-align:center;color:#aaa;">
          먼저 [기본정보] 탭에서 저장해야 항목을 추가할 수 있습니다.
        </div>
        <template v-else>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span class="list-title" style="font-size:12px;">
              항목 목록 <span style="color:#e8587a;margin-left:4px;">{{ items.length }}개</span>
            </span>
            <button class="btn btn_new btn-sm" style="margin-left:auto;"
              @click="handleBtnAction('items-add')">+ 항목 추가</button>
          </div>
          <bo-grid bare :columns="columns.items" :rows="items" row-key="popupItemId"
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
          <div style="margin-top:16px;border-top:1px solid #eee;padding-top:12px;">
            <div class="list-title" style="font-size:12px;margin-bottom:8px;">
              {{ itemDetail.show ? (itemDetail.isNew ? '항목 신규 등록' : '항목 상세 / 수정') : '항목 상세' }}
              <span v-if="itemDetail.show && !itemDetail.isNew" style="font-size:11px;color:#999;margin-left:6px;font-weight:400;">
                #{{ itemForm.popupItemId }}
              </span>
            </div>
            <template v-if="itemDetail.show">
              <bo-form-area :columns="columns.itemForm" :form="itemForm" :errors="itemErrors"
                :cols="3" compact :show-actions="false" />
              <div class="form-actions">
                <button class="btn btn_save" @click="handleBtnAction('itemForm-save')">저장</button>
                <button class="btn btn_close" @click="handleBtnAction('itemForm-close')">닫기</button>
              </div>
            </template>
            <div v-else style="padding:20px;text-align:center;color:#aaa;font-size:12px;">
              항목을 선택하거나 [+ 항목 추가]를 클릭하세요.
            </div>
          </div>
        </template>
      </div>
      <!-- ===== □.□. 항목정보 탭 ============================================== -->
    </div>
    <div v-else style="padding:32px;text-align:center;color:#aaa;">목록에서 팝업을 선택하거나 [+ 신규]를 클릭하세요.</div>
  </bo-container>


  <!-- ===== ■. 미리보기 (실제 공통 선택 팝업) ================================= -->
  <!-- ===== ■. 미리보기 결과 (호출 정보 / 응답정보) ============================ -->
  <bo-container v-if="previewModal.popupCode" title="미리보기 결과"
    :title-hint="previewModal.popupCode + (previewModal.multi ? ' · 다중선택' : ' · 단일선택')">
    <template #toolbar-actions>
      <button class="btn btn_preview btn-sm" @click="handleBtnAction('popups-preview')">👁 다시 열기</button>
      <button class="btn btn_preview btn-sm" @click="handleBtnAction('popups-previewMulti')">👁 멀티로 열기</button>
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
