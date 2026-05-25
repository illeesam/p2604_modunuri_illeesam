/* ShopJoy Admin - 다국어관리 */
window.SyI18nMng = {
  name: 'SyI18nMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== [01] 초기 변수 정의 ====================================================
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달

    const i18n     = reactive([]);             // 다국어 키 그리드 데이터
    const i18nMsgs = reactive([]);             // 다국어 메시지 (i18nId 별 langCd 매핑)
    const uiState  = reactive({ isPageCodeLoad: false, selectedId: null }); // UI 상태
    const codes    = reactive({ lang_code: [], use_yn: [], i18n_scopes: ['COMMON','FO','BO'] });

    /* _initSearchParam — 초기화 */

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyI18nMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchData();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        pager.pageNo = 1;
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
      // 다국어 키 그리드 행 클릭 → 번역 편집 패널 열기
      if (cmd === 'i18n-row-open') {
        return openDetail(param);
      // 페이지 번호 클릭
      } else if (cmd === 'i18n-set-page') {
        if (param >= 1 && param <= pager.pageTotalPage) { pager.pageNo = param; handleSearchData(); }
        return;
      // 페이지 크기 변경
      } else if (cmd === 'i18n-size-change') {
        pager.pageNo = 1;
        return handleSearchData();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      return { searchType: '', searchValue: '', scope: '', use: '' };
    };
    const searchParam = reactive(_initSearchParam()); // 검색조건
    const pager       = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const LANGS       = ['ko','en','ja','in']; // 지원 언어
    const LANG_LABELS = { ko:'한국어', en:'English', ja:'日本語', in:'Indonesia' };

    const msgForm = reactive({});              // 번역 입력 폼

    const cfSelectedKey = computed(() => (i18n||[]).find(k => k.i18nId === uiState.selectedId) || null);
    const cfSelectedMsgs = computed(() => {
      if (!cfSelectedKey.value) { return {}; }
      const msgs = {};
      LANGS.forEach(lang => { msgs[lang] = ''; });
      (i18nMsgs||[]).filter(m => m.i18nId === uiState.selectedId).forEach(m => { msgs[m.langCd] = m.i18nMsg; });
      return msgs;
    });
    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ============================

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
    const fnBuildPagerNums = () => {
      const c = pager.pageNo, l = pager.pageTotalPage;
      const s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };

    /* handleSearchData — 목록 조회 */
    const handleSearchData = async () => {
      try {
        const { searchType, searchValue, scope, use } = searchParam;
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
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
        i18n.splice(0, i18n.length, ...(d?.pageList || []));
        pager.pageTotalCount = d?.pageTotalCount || 0;
        pager.pageTotalPage  = d?.pageTotalPage  || 1;
        fnBuildPagerNums();
      } catch (err) {
        console.error('[handleSearchData]', err);
        i18n.splice(0, i18n.length);
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
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('저장되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchData();
    });

    // ===== [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ====================

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
    const fnRowStyle = (row) => uiState.selectedId === row.i18nId ? 'background:#fff8f9;cursor:pointer;' : 'cursor:pointer;';

    const baseSearchColumns = [
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

    const baseGridColumns = [
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

    // ===== [06] return (템플릿 노출) ==============================================

    return {
      uiState, codes, searchParam, pager, i18n, msgForm,                         // 상태 / 데이터
      baseSearchColumns, baseGridColumns, msgFormColumns,                        // 컬럼 정의
      handleBtnAction, handleSelectAction,                                       // dispatch (모든 이벤트 / 액션 라우팅)
      cfSelectedKey,                                                             // computed
      fnRowStyle,                                                                // 헬퍼
    };
  },
  template: `
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    다국어관리
  </div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-grid
    :columns="baseGridColumns" :rows="i18n" :pager="pager" row-key="i18nId"
    list-title="다국어 키 목록" :count-text="'총 ' + pager.pageTotalCount + '건'"
    :row-style="fnRowStyle" row-clickable
    @set-page="n => handleSelectAction('i18n-set-page', n)"
    @size-change="handleSelectAction('i18n-size-change')"
    @row-click="row => handleSelectAction('i18n-row-open', row)" />
  <!-- ===== □. 목록 영역 =================================================== -->
  <!-- ===== ■. 번역 편집 패널 ================================================ -->
  <div class="card" v-if="cfSelectedKey">
    <div class="toolbar">
      <span class="list-title">
        번역 편집 —
        <code style="font-size:13px;color:#7c3aed">{{ cfSelectedKey.i18nKey }}</code>
        </span>
        <div style="margin-left:auto;display:flex;gap:6px;">
          <button class="btn btn-blue btn-sm" @click="handleBtnAction('msgForm-save')">
            저장
          </button>
          <button class="btn btn-secondary btn-sm" @click="handleBtnAction('msgForm-close')">
            닫기
          </button>
        </div>
      </div>
      <!-- ===== ■.■. 언어별 번역 입력 (BoFormArea 자동 렌더) ========================== -->
      <div style="padding:12px">
        <!-- ===== ■.■.■. 폼 영역 ================================================ -->
        <bo-form-area :columns="msgFormColumns" :form="msgForm" :errors="{}"
        :cols="2" :show-actions="false" />
      </div>
    </div>
    <!-- ===== □.□. 언어별 번역 입력 (BoFormArea 자동 렌더) ========================== -->
    <!-- ===== □. 번역 편집 패널 ================================================ -->
  </div>
`,
};
