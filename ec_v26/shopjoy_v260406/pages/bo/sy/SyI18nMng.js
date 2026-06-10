/* ShopJoy Admin - 다국어관리 */
window.SyI18nMng = {
  name: 'SyI18nMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달

    const i18ns     = reactive([]);             // 다국어 키 그리드 데이터
    const i18nMsgs = reactive([]);             // 다국어 메시지 (i18nId 별 langCd 매핑)
    const uiState  = reactive({ isPageCodeLoad: false, selectedId: null }); // UI 상태
    const codes    = reactive({ lang_code: [], use_yn: [], i18n_scopes: ['COMMON','FO','BO'] });

    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyI18nMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchData();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        baseGridPager.pageNo = 1;
        return handleSearchData();
      // 번역 메시지 저장
      } else if (cmd === 'msgForm-save') {
        return saveMsgs();
      // 번역 편집 패널 닫기
      } else if (cmd === 'msgForm-close') {
        uiState.selectedId = null;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyI18nMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 번호 클릭
      if (cmd === 'i18ns-pager-setPage') {
        if (param >= 1 && param <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = param; handleSearchData(); }
        return;
      // 페이지 크기 변경
      } else if (cmd === 'i18ns-pager-sizeChange') {
        baseGridPager.pageNo = 1;
        return handleSearchData();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터. colKey 기준 분기 (행 액션 버튼·셀 클릭) */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ SyI18nMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'i18ns-cellClick') {
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          return openDetail(row);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      return { searchType: '', searchValue: '', scope: '', use: '' };
    };
    const searchParam = reactive(_initSearchParam()); // 검색조건
    const baseGridPager       = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const LANGS       = ['ko','en','ja','in']; // 지원 언어
    const LANG_LABELS = { ko:'한국어', en:'English', ja:'日本語', in:'Indonesia' };

    const msgForm = reactive({});              // 번역 입력 폼

    const cfSelectedKey = computed(() => (i18ns||[]).find(k => k.i18nId === uiState.selectedId) || null);

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* handleSearchData — 목록 조회 */
    const handleSearchData = async () => {
      try {
        const { searchType, searchValue, scope, use } = searchParam;
        const params = {
          pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize,
          ...(searchValue ? { searchValue: searchValue.trim() } : {}),
          ...(searchType ? { searchType }      : {}),
          ...(scope ? { i18nScopeCd: scope }     : {}),
          ...(use   ? { useYn: use }             : {}),
        };
        if (params.searchValue && !params.searchType) {
          params.searchType = 'i18nKey,i18nDesc';
        }
        const res = await boApiSvc.syI18n.getPage(params, '다국어관리', '조회');
        const d = res.data?.data;
        i18ns.splice(0, i18ns.length, ...(d?.pageList || []));
        baseGridPager.pageTotalCount = d?.pageTotalCount || 0;
        baseGridPager.pageTotalPage  = d?.pageTotalPage  || 1;
        coUtil.cofBuildPagerNums(baseGridPager);
      } catch (err) {
        console.error('[handleSearchData]', err);
        i18ns.splice(0, i18ns.length);
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.lang_code = codeStore.sgGetGrpCodes('LANG_CODE');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* openDetail — 번역 편집 패널 열기 (토글) */
    const openDetail = (key) => {
      if (uiState.selectedId === key.i18nId) { uiState.selectedId = null; return; }
      uiState.selectedId = key.i18nId;
      const msgs = {};
      LANGS.forEach(lang => { msgs[lang] = ''; });
      (i18nMsgs||[]).filter(m => m.i18nId === key.i18nId).forEach(m => { msgs[m.langCd] = m.i18nMsg; });
      Object.assign(msgForm, msgs);
    };

    /* saveMsgs — 번역 메시지 저장 */
    const saveMsgs = async () => {
      if (!cfSelectedKey.value) { return; }
      const ok = await showConfirm('저장', '번역 메시지를 저장하시겠습니까?');
      if (!ok) { return; }
      const src = i18nMsgs;
      LANGS.forEach(lang => {
        const existing = src.find(m => m.i18nId === cfSelectedKey.value.i18nId && m.langCd === lang);
        if (existing) { existing.i18nMsg = msgForm[lang]; }
        else if (msgForm[lang]) { src.push({ i18nMsgId: 'IM' + Date.now() + lang, i18nId: cfSelectedKey.value.i18nId, langCd: lang, i18nMsg: msgForm[lang] }); }
      });
      try {
        const res = await boApiSvc.syI18n.updateMsgs(cfSelectedKey.value.i18nId, { msgs: { ...msgForm } }, '다국어관리', '저장');
        if (showToast) { showToast('저장되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchData();
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    /* fnScopeBadge — 범위 배지 클래스 */
    const fnScopeBadge = s => ({ COMMON:'badge-blue', FO:'badge-green', BO:'badge-orange' }[s] || 'badge-gray');

    /* fnYnBadge — Y/N 배지 클래스 */
    const fnYnBadge = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* getLangMsg — 언어별 메시지 조회 */
    const getLangMsg = (i18nId, lang) => {
      const m = (i18nMsgs||[]).find(m => m.i18nId === i18nId && m.langCd === lang);
      return m ? m.i18nMsg : '';
    };

    /* fnRowStyle — 행 스타일 (선택 행 강조) */
    const fnRowStyle = (row) => uiState.selectedId === row.i18nId ? 'background:#fff8f9;' : '';

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'i18nKey',  label: '키' },
          { value: 'i18nDesc', label: '설명' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'scope', type: 'select', label: '범위', options: () => codes.i18n_scopes, nullLabel: '전체' },
      { key: 'use', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'i18nKey',     label: '키 (i18n_key)',
        cellInnerStyle: 'font-size:12px;color:#7c3aed;font-family:monospace;' },
      { key: 'i18nDesc',    label: '설명', cellStyle: 'color:#666;font-size:12px' },
      { key: 'i18nScopeCd', label: '범위', align: 'center', badge: (row) => fnScopeBadge(row.i18nScopeCd) },
      { key: 'i18nCategory',label: '카테고리', cellStyle: 'font-size:12px;color:#888' },
      { key: 'msgKo',       label: 'ko', align: 'center', cellStyle: 'font-size:11px;color:#555', fmt: (v, row) => getLangMsg(row.i18nId, 'ko') },
      { key: 'msgEn',       label: 'en', align: 'center', cellStyle: 'font-size:11px;color:#555', fmt: (v, row) => getLangMsg(row.i18nId, 'en') },
      { key: 'msgJa',       label: 'ja', align: 'center', cellStyle: 'font-size:11px;color:#555', fmt: (v, row) => getLangMsg(row.i18nId, 'ja') },
      { key: 'useYn',       label: '사용', align: 'center', badge: (row) => fnYnBadge(row.useYn) },
    ];

    const msgFormColumns = LANGS.map(lang => ({
      key: lang,
      label: LANG_LABELS[lang] + ' (' + lang + ')',
      type: 'text',
      placeholder: LANG_LABELS[lang] + ' 번역 입력',
    }));

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, codes, searchParam, baseGridPager, i18ns, msgForm,                         // 상태 / 데이터
      msgFormColumns,                        // 컬럼 정의
      handleBtnAction, handleSelectAction, handleGridCellAction,                 // dispatch (모든 이벤트 / 액션 라우팅)
      cfSelectedKey,                                                             // computed
      fnRowStyle,                                                                // 헬퍼
    };
  },
  template: `
<bo-page title="다국어관리">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <bo-search-area @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-container title="다국어 키 목록" :count-text="'총 ' + baseGridPager.pageTotalCount + '건'">
    <bo-grid bare
      :columns="columns.baseGrid" :rows="i18ns" row-key="i18nId" :selected-key="uiState.selectedId"
      :row-style="fnRowStyle"
      grid-id="i18ns-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
    </bo-grid>
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleSelectAction('i18ns-pager-setPage', n)" :on-size-change="() => handleSelectAction('i18ns-pager-sizeChange')" />
  </bo-container>
  <!-- ===== ■. 번역 편집 패널 (항상 표시) ====================================== -->
  <bo-container>
    <div class="toolbar">
      <span class="list-title">
        번역 편집
        <span v-if="cfSelectedKey && cfSelectedKey.i18nKey" style="font-size:12px;color:#999;margin-left:8px;font-weight:400;">
          #{{ cfSelectedKey.i18nKey }}
        </span>
        <span v-else style="font-size:12px;color:#bbb;margin-left:8px;font-weight:400;">
          목록에서 다국어 키를 선택하세요
        </span>
      </span>
      <div v-if="cfSelectedKey" style="margin-left:auto;display:flex;gap:6px;">
        <button class="btn btn_save" @click="handleBtnAction('msgForm-save')">
          저장
        </button>
        <button class="btn btn_close" @click="handleBtnAction('msgForm-close')">
          닫기
        </button>
      </div>
    </div>
    <!-- ===== ■.■. 언어별 번역 입력 (BoFormArea 자동 렌더) ========================== -->
    <div style="padding:12px">
      <!-- ===== ■.■.■. 폼 영역 ================================================ -->
      <bo-form-area v-if="cfSelectedKey" :columns="msgFormColumns" :form="msgForm" :errors="{}"
        :cols="3" :show-actions="false" />
      <div v-else style="text-align:center;color:#bbb;padding:28px 12px;font-size:13px;">
        목록에서 다국어 키를 선택하면 언어별 번역을 편집할 수 있습니다.
      </div>
    </div>
  </bo-container>
</bo-page>
`,
};
