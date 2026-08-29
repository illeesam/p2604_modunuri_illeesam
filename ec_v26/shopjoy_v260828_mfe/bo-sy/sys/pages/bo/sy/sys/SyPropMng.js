/* ShopJoy Admin - 프로퍼티 관리 (좌측 트리 + 우측 CRUD 그리드) */
export default {
  name: 'sy-sys-syPropMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달

    const propCounts = reactive({});                 // 좌 트리 노드별 카운트 (검색조건 동기)

    /* 무한 스크롤 — 141건을 한 번에 받지 않고 PAGE_SIZE 씩 이어 붙인다.
       loading: 중복 요청 가드 / hasMore: 더 받을 게 있는지 / total: 서버 총건수 */
    const PAGE_SIZE = 100;
    const uiState = reactive({ _newId: -1, selectedPath: '', loading: false, hasMore: true, total: 0, pageNo: 1 }); // UI 상태
    const codes   = reactive({ use_yn: [], prop_types: ['STRING','NUMBER','BOOLEAN','JSON'] }); // 공통코드

    const cfSiteId = computed(() => boCommonFilter?.siteId || null);

    /* 검색조건 — 키 이름은 백엔드 파라미터명과 동일하게 둔다(그대로 펼쳐 보내기 위함) */
    const searchParam = reactive({ searchType: '', searchValue: '', useYn: '', propTypeCd: '', propProfile: '' });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 그대로 복사해 둔다.
       리터럴 기본값이 아니라 '화면을 열었을 때의 상태'가 기준이라, initPage 가 채운
       기본 기간·사이트 같은 값도 초기화 시 함께 복원된다.
       ※ 순수 백업 저장소라 reactive 가 아니어도 된다. 재대입(=) 대신 Object.assign 을 쓴다 —
          const 재대입은 TypeError 이고, searchParam 을 재대입하면 반응성이 끊긴다. */
    const searchParamInit = {};

    const propRows  = reactive([]);                // 프로퍼티 그리드 행 (BoGridCrud 규약: _row_status N/I/U/D, _row_check, _row_org)
    const _rawProps = reactive([]);                // 원본 (reload 복원용)
    const EDIT_FIELDS = ['pathId', 'propProfile', 'propKey', 'propValue', 'propLabel', 'propTypeCd', 'sortOrd', 'useYn', 'propRemark'];

    const sortState = reactive({ sortKey: '', sortDir: 'asc' }); // 그리드 헤더 정렬 상태

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyPropMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return fetchData();
      // 검색조건 초기화 + 트리 선택 해제
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        profileFltDisplay.value = '';
        uiState.selectedPath = '';
        return fetchData();   // reload() 는 이전 검색 결과를 다시 그릴 뿐이라 재조회한다
      // 프로퍼티 그리드 행 추가
      } else if (cmd === 'props-add') {
        return addRow();
      // 프로퍼티 그리드 저장
      } else if (cmd === 'props-save') {
        return handleSave();
      // 체크된 행 일괄 삭제 마킹
      } else if (cmd === 'props-deleteChecked') {
        return deleteChecked();
      // 체크된 행 일괄 취소
      } else if (cmd === 'props-cancelChecked') {
        return cancelChecked();
      // CSV 내보내기
      } else if (cmd === 'props-export') {
        return exportCsv();
      // 프로퍼티 런타임 갱신 (Pinia boPropStore → coExtSdk 키 즉시 반영)
      } else if (cmd === 'props-reload') {
        return handleReload();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyPropMng.js : handleSelectAction -> ', cmd, param);
      // 좌측 경로 트리 노드 선택 → 그리드 재조회
      if (cmd === 'pathTree-select') {
        uiState.selectedPath = param;
        return fetchData();
      } else if (cmd === 'props-rowDelete') {
        param._row_status = 'D';
        return;
      // 그리드 행 복원 (D → N/I)
      } else if (cmd === 'props-rowRestore') {
        param._row_status = param._row_org ? 'N' : 'I';
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 변경/클릭 라우터. colKey 기준 분기 (CRUD 셀 변경 등) */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'props-cellChange') {
        return onCellChange(row);
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['USE_YN'], {compNm: 'SyPropMng'});
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
    };

    /* makeRow — 행 생성 */
    const makeRow = (p) => ({
      ...p,
      _row_status: 'N',
      _row_check:  false,
      _row_org: EDIT_FIELDS.reduce((acc, f) => { acc[f] = p[f]; return acc; }, {}),
    });

    /* reload — 원본으로 재로드 */
    const reload = () => {
      propRows.splice(0, propRows.length, ..._rawProps.map(makeRow));
    };

    /* handleLoadPathTreeNodeCounts — 좌 트리 노드별 카운트 (목록과 동일 검색조건 동기) */
    const handleLoadPathTreeNodeCounts = async () => {
      try {
        // ⚠️ 목록(getPage)과 동일한 필터를 적용해야 트리 숫자 ↔ 우측 목록 건수가 일치한다.
        //    pathId 만 제외(트리는 경로별 분해 표시이므로 특정 경로로 고정하지 않음).
        const params = coUtil.cofOmitEmpty({ ...searchParam, siteId: cfSiteId.value });
        if (params.searchValue && !params.searchType) {
          params.searchType = 'pathId,propKey,propValue,propLabel';
        }
        const res = await boApiSvc.syProp.getPathTreeNodeCounts(params, '경로별카운트', '조회');
        const rows = res.data?.data || [];

        Object.keys(propCounts).forEach(k => { delete propCounts[k]; });

        for (const r of rows) { if (r && r.pathId != null) propCounts[r.pathId] = r.cnt; }
      } catch (e) { console.error('[handleLoadPathTreeNodeCounts]', e); }
    };

    /* fetchData — 목록 조회.
       append=false(기본): 1페이지부터 새로 조회 (검색/경로변경/저장 후)
       append=true      : 다음 페이지를 이어 붙임 (스크롤 하단 도달)
       ⚠ 이어붙일 때 propRows 를 통째로 갈아끼우면 편집중(I/U/D) 상태가 날아가므로
         _rawProps 에 push 한 뒤 새로 들어온 만큼만 makeRow 해서 append 한다. */
    const fetchData = async (append = false) => {
      if (uiState.loading) { return; }
      if (append && !uiState.hasMore) { return; }
      uiState.loading = true;
      try {
        if (!append) { uiState.pageNo = 1; uiState.hasMore = true; }
        const params = {
          pageNo: uiState.pageNo, pageSize: PAGE_SIZE,
          ...coUtil.cofOmitEmpty({ ...searchParam, siteId: cfSiteId.value, pathId: uiState.selectedPath }),
        };
        if (params.searchValue && !params.searchType) {
          params.searchType = 'pathId,propKey,propValue,propLabel';
        }
        /* 이어붙이기(스크롤 추가 조회)는 진행 오버레이를 띄우지 않는다 —
           사용자가 스크롤 중인데 화면을 덮으면 오히려 끊겨 보인다. */
        const res = await boApiSvc.syProp.getPage(params, '속성관리', '목록조회',
          append ? { isProgress: false } : undefined);
        const d = res.data?.data || {};
        const list = d.pageList || d.list || [];
        uiState.total = d.pageTotalCount || 0;

        if (append) {
          _rawProps.push(...list);
          propRows.push(...list.map(makeRow));   // 기존 행의 편집 상태 보존
        } else {
          _rawProps.splice(0, _rawProps.length, ...list);
          reload();
        }

        /* 더 받을 게 있는지 — 이번에 받은 수가 PAGE_SIZE 미만이거나 총건수에 도달하면 끝 */
        uiState.hasMore = list.length >= PAGE_SIZE && _rawProps.length < uiState.total;
        if (uiState.hasMore) { uiState.pageNo += 1; }

        /* 좌 트리 카운트 동기 갱신 (첫 조회 때만 — 이어붙이기는 조건이 같아 값이 안 변한다) */
        if (!append) { handleLoadPathTreeNodeCounts(); }
      } catch (err) {
        console.error('[fetchData]', err);
      } finally {
        uiState.loading = false;
      }
    };

    /* onScrollEnd — 그리드 스크롤이 바닥 근처에 오면 다음 페이지 */
    const onScrollEnd = () => { fetchData(true); };

    // ★ onMounted
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      /* 공유된 링크(bo-page shareQuery)로 들어온 경우 URL 쿼리의 검색조건을 복원 */
      const _qs = new URLSearchParams(window.location.search);
      const _reserved = ['page','id','orderId','claimId','embed','dtlMode'];
      Object.keys(searchParam).forEach((k) => { if (!_reserved.includes(k) && _qs.has(k)) searchParam[k] = _qs.get(k); });
      Object.assign(searchParamInit, searchParam);   // [초기화] 기준값 스냅샷
      fetchData();
    };
    onMounted(initPage);

    /* onCellChange — 셀 변경 감지 */
    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') { return; }
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    /* addRow — 행 추가 */
    const addRow = () => {
      propRows.push({
        propId: uiState._newId--,
        siteId: cfSiteId.value || null,
        pathId: uiState.selectedPath || 'new.prop',
        propProfile: '^all^',
        propKey: 'new_key',
        propLabel: '신규 프로퍼티',
        propValue: '',
        propTypeCd: 'STRING',
        sortOrd: 99,
        useYn: 'Y',
        propRemark: '',
        _row_status: 'I', _row_check: false, _row_org: null,
      });
    };

    /* deleteChecked — 체크된 행 일괄 삭제 마킹 */
    const deleteChecked = () => {
      for (let i = propRows.length - 1; i >= 0; i--) {
        if (!propRows[i]._row_check) { continue; }
        if (propRows[i]._row_status === 'I') { propRows.splice(i, 1); }
        else { propRows[i]._row_status = 'D'; }
      }
    };

    /* cancelChecked — 체크된 행 일괄 취소 */
    const cancelChecked = () => {
      const checked = propRows.filter(r => r._row_check);
      if (!checked.length) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = propRows.length - 1; i >= 0; i--) {
        const row = propRows[i];
        if (!row._row_check || row._row_status === 'N') { continue; }
        if (row._row_status === 'I') { propRows.splice(i, 1); }
        else if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; }
      }
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      const dirty = propRows.filter(r => ['I', 'U', 'D'].includes(r._row_status));
      if (dirty.length === 0) { showToast('변경된 행이 없습니다.', 'warning'); return; }
      const ok = await showConfirm('저장', `${dirty.length}건의 변경사항을 저장하시겠습니까?`);
      if (!ok) { return; }
      const saveRows = dirty.map(r => ({ ...r, rowStatus: r._row_status }));
      try {
        await boApiSvc.syProp.saveList('base', saveRows, '속성관리', '저장');
        showToast('저장되었습니다.', 'success');
        await fetchData();
      } catch (err) {
        showToast(coUtil.cofErrMsg(err), 'error', 0);
      }
    };

    /* handleReload — 런타임 프로퍼티 갱신 (DB → Pinia, coExtSdk 즉시 반영)
       syApp 을 함께 받아 boAppStore 에 넣어야 실제로 "즉시 반영" 이 된다.
       coExtSdk._key() 는 AppStore 의 svXxx 를 읽지 PropStore 를 보지 않는다.
       (예전엔 syProps 만 받아 PropStore 에 넣어서, 외부 SDK 키를 바꿔도 반영되지 않았다) */
    const handleReload = async () => {
      try {
        const res = await coApiSvc.cmBoAppStore.getInitData('syProps^syApp', '속성관리', '프로퍼티갱신');
        const data = res?.data?.data;
        if (data?.syProps) { window.useBoPropStore?.()?.saSetProps(data.syProps); }
        if (data?.syApp)   { window.useBoAppStore?.()?.saSetApp(data.syApp); }
        showToast('런타임 프로퍼티가 갱신되었습니다.', 'success');
      } catch (err) {
        showToast(coUtil.cofErrMsg(err, '갱신 중 오류가 발생했습니다.'), 'error', 0);
      }
    };

    /* exportCsv — CSV 내보내기 */
    const exportCsv = () => {
      const header = ['ID','표시경로','키','값','라벨','타입','정렬','사용','비고'];
      const lines = [header.join(',')];
      propRows.filter(r => r._row_status !== 'D').forEach(r => {
        lines.push([r.propId, r.pathId, r.propKey, r.propValue, r.propLabel, r.propTypeCd, r.sortOrd, r.useYn, r.propRemark || '']
          .map(c => '"' + String(c).replace(/"/g,'""') + '"').join(','));
      });
      const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = coUtil.cofBuildExportFilename('프로퍼티.csv'); a.click();
      URL.revokeObjectURL(url);
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    const PROFILE_OPTIONS = [
      { value: 'local', label: 'all; local' },
      { value: 'dev',   label: 'all; dev'   },
      { value: 'prod',  label: 'all; prod'  },
    ];

    /* profileFltDisplay — select/input 표시용 텍스트 (API 전송값과 분리)
       select 선택: value='local' → display='all; local'
       직접입력: 그대로 표시, API 전송값도 그대로                        */
    const profileFltDisplay = ref('');

    const onProfileSelectChange = (e) => {
      const val = e.target.value;
      searchParam.propProfile = val;
      const opt = PROFILE_OPTIONS.find(o => o.value === val);
      profileFltDisplay.value = opt ? opt.label : val;
    };

    const onProfileInputChange = (e) => {
      const display = e.target.value;
      profileFltDisplay.value = display;
      // 표시값이 'all; xxx' 형태면 실제 값 'xxx' 추출, 아니면 그대로
      const m = display.match(/^all;\s*(\S+)$/);
      searchParam.propProfile = m ? m[1] : display;
    };

    /* fnFmtProfile — propProfile 컬럼 표시 변환
       ^local^dev^ → all; local, all; dev
       ^prod^      → all; prod
       ^all^       → all
       (빈값)      → all                                           */
    const fnFmtProfile = (v) => {
      if (!v || v === '') return 'all';
      if (v === '^all^' || v === 'all') return 'all';
      const tokens = v.replace(/^\^|\^$/g, '').split('^').filter(Boolean);
      if (!tokens.length) return 'all';
      return tokens.map(t => (t === 'all' ? 'all' : 'all; ' + t)).join(', ');
    };

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'pathId',    label: '표시경로' },
          { value: 'propKey',   label: '키' },
          { value: 'propValue', label: '값' },
          { value: 'propLabel', label: '라벨' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력', width: '420px' },
      { key: 'propTypeCd',    type: 'select', label: '타입',     options: () => codes.prop_types, nullLabel: '전체 타입' },
      { key: 'propProfile', type: 'slot', name: 'propProfile', label: '프로파일' },
      { key: 'useYn',     type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '사용여부 전체' },
    ];

    columns.baseGrid = [
      { key: 'pathId',      label: '표시경로',  style: 'width:180px;min-width:180px;', pathPick: 'sy_prop' },
      { key: 'propProfile', label: '프로파일',  style: 'width:160px;min-width:160px;', edit: 'text', mono: true, fmt: (v) => fnFmtProfile(v) },
      { key: 'propKey',     label: '키',        style: 'width:200px;min-width:200px;', edit: 'text', mono: true, sortKey: 'propKey' },
      { key: 'propValue',  label: '값',        style: 'width:280px;min-width:280px;', edit: 'text' },
      { key: 'propLabel',  label: '라벨',      style: 'width:160px;min-width:160px;', edit: 'text' },
      { key: 'propTypeCd', label: '타입',      style: 'width:90px;min-width:90px;',  cls: 'col-id', edit: 'select', options: () => codes.prop_types.map(t => ({ value: t, label: t })) },
      { key: 'sortOrd',    label: '정렬',      style: 'width:60px;min-width:60px;',  cls: 'col-ord', edit: 'number' },
      { key: 'useYn',      label: '사용',      style: 'width:80px;min-width:80px;',  cls: 'col-use', edit: 'select', options: () => codes.use_yn },
      { key: 'propRemark', label: '비고',      style: 'width:160px;min-width:160px;', edit: 'text' },
    ];

    const onSort = (key) => {
      if (sortState.sortKey === key) {
        sortState.sortDir = sortState.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortState.sortKey = key;
        sortState.sortDir = 'asc';
      }
      const dir = sortState.sortDir === 'asc' ? 1 : -1;
      propRows.sort((a, b) => {
        const av = (a[key] || '').toString().toLowerCase();
        const bv = (b[key] || '').toString().toLowerCase();
        return av < bv ? -dir : av > bv ? dir : 0;
      });
    };

    /* excelModal — 엑셀 다운로드 (공용 모달) */
    const excelModal = reactive({ show: false });
    const buildExcelParams = () => {
      const p = { ...coUtil.cofOmitEmpty({ ...searchParam, siteId: cfSiteId.value, pathId: uiState.selectedPath }) };
      if (p.searchValue && !p.searchType) { p.searchType = 'pathId,propKey,propValue,propLabel'; }
      return p;
    };

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, propCounts, searchParam, propRows,       // 상태 / 데이터
      excelModal, buildExcelParams, // 엑셀 다운로드 모달
      sortState, onSort,                                // 정렬
      onScrollEnd,                                      // 무한 스크롤 (하단 도달 시 다음 100건)
      fnFmtProfile, profileFltDisplay, onProfileSelectChange, onProfileInputChange, // 프로파일
      handleBtnAction, handleSelectAction, handleGridCellAction,                          // dispatch (모든 이벤트 / 액션 라우팅)
    };
  },
  template: /* html */`
<bo-page title="프로퍼티관리" :share-query="searchParam">
  <template #actions>
    <button class="btn" style="font-size:12px;padding:4px 12px;background:#f0f0f0;border:1px solid #d0d0d0;border-radius:6px;cursor:pointer;color:#444;"
      title="저장된 프로퍼티를 런타임에 즉시 반영합니다 (Pinia store 갱신)"
      @click="handleBtnAction('props-reload')">
      🔄 런타임 갱신
    </button>
  </template>
  <!-- ===== ■. 검색 바 ==================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam">
      <template #propProfile>
        <label class="search-label">프로파일</label>
        <div style="display:flex;gap:4px;align-items:center;">
          <select class="form-control" style="width:130px;"
            :value="searchParam.propProfile"
            @change="onProfileSelectChange"
            @keyup.enter="handleBtnAction('searchParam-list')">
            <option value="">전체 환경</option>
            <option value="local">all; local</option>
            <option value="dev">all; dev</option>
            <option value="prod">all; prod</option>
          </select>
          <input type="text" class="form-control" style="width:100px;font-family:monospace;font-size:12px;" placeholder="직접입력"
            :value="profileFltDisplay"
            @input="onProfileInputChange"
            @keyup.enter="handleBtnAction('searchParam-list')" />
        </div>
      </template>
    </bo-search-area>
  </bo-container>
  <!-- ===== □. 검색 바 ==================================================== -->
  <!-- ===== ■. 좌 트리 + 우 그리드 ============================================ -->
  <div class="bo-2col">
    <!-- ===== ■.■. 트리 ==================================================== -->
    <bo-container bare>
      <bo-path-tree-card biz-cd="sy_prop" title="표시경로" :show-biz-cd="false" :counts="propCounts"
        max-height="calc(100vh - 320px)"
        :selected="uiState.selectedPath" @select="path => handleSelectAction('pathTree-select', path)" />
    </bo-container>
    <!-- ===== ■.■. 그리드 (BoGridCrud) ====================================== -->
    <bo-container bare>
      <bo-grid-crud
        :columns="columns.baseGrid" :rows="propRows" row-key="propId"
        list-title="프로퍼티목록" :draggable="false"
        max-height="calc(100vh - 320px)"
        :total-count="uiState.total" @scroll-end="onScrollEnd"
        :sort-state="sortState" @sort="onSort"
        :show-export="true"
        @add="handleBtnAction('props-add')" @save="handleBtnAction('props-save')"
        @delete-checked="handleBtnAction('props-deleteChecked')" @cancel-checked="handleBtnAction('props-cancelChecked')"
        @export="excelModal.show = true"
        grid-id="props-cellChange" @cell-change="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
        <template #row-actions="{ row }">
          <button v-if="['N','U'].includes(row._row_status)" class="btn btn_row_delete" @click.stop="handleSelectAction('props-rowDelete', row)">
            삭제
          </button>
          <button v-else-if="row._row_status==='D'" class="btn btn-xs btn-secondary" @click.stop="handleSelectAction('props-rowRestore', row)">
            복원
          </button>
        </template>
      </bo-grid-crud>
      <bo-excel-down-modal :show="excelModal.show" domain="syProp" area-nm="프로퍼티"
        :columns="columns.baseGrid" ui-nm="프로퍼티관리" :params="buildExcelParams()"
        @close="excelModal.show = false" />
    </bo-container>
  </div>
  <!-- ===== □.□. 그리드 (BoGridCrud) ====================================== -->
  <!-- ===== □. 좌 트리 + 우 그리드 ============================================ -->
</bo-page>
`,
};

/* BoPropTreeNode (구 PropTreeNode) 는 components/comp/BoComp.js 로 이동. 태그: <bo-prop-tree-node> */
