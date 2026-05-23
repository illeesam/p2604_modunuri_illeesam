/* ShopJoy Admin - 다국어관리 */
window.SyI18nMng = {
  name: 'SyI18nMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const i18nKeys = reactive([]);
    const i18nMsgs = reactive([]);
    const uiState = reactive({ isPageCodeLoad: false, selectedId: null});
    const codes = reactive({ lang_code: [], use_yn: [], i18n_scopes: ['COMMON','FO','BO'] });

    /* 다국어 _initSearchParam */
    const _initSearchParam = () => {
      return { searchType: '', searchValue: '', scope: '', use: '' };
    };
    const searchParam = reactive(_initSearchParam());
    const pager       = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* 다국어 fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 다국어 목록조회 */
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
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'i18nKey,i18nDesc';
        }
        const res = await boApiSvc.syI18n.getPage(params, '다국어관리', '조회');
        const d = res.data?.data;
        i18nKeys.splice(0, i18nKeys.length, ...(d?.pageList || []));
        pager.pageTotalCount = d?.pageTotalCount || 0;
        pager.pageTotalPage  = d?.pageTotalPage  || 1;
        fnBuildPagerNums();
      } catch (err) {
        console.error('[handleSearchData]', err);
        i18nKeys.splice(0, i18nKeys.length);
      }
    };

    /* 다국어 fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.lang_code = codeStore.sgGetGrpCodes('LANG_CODE');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    const selectedId  = ref(null);

    const LANGS       = ['ko','en','ja','in'];
    const LANG_LABELS = { ko:'한국어', en:'English', ja:'日本語', in:'Indonesia' };

    /* 다국어 fnScopeBadge */
    const fnScopeBadge  = s => ({ COMMON:'badge-blue', FO:'badge-green', BO:'badge-orange' }[s] || 'badge-gray');

    const cfSelectedKey = computed(() => (i18nKeys||[]).find(k => k.i18nId === uiState.selectedId) || null);
    const cfSelectedMsgs = computed(() => {
      if (!cfSelectedKey.value) return {};
      const msgs = {};
      LANGS.forEach(lang => { msgs[lang] = ''; });
      (i18nMsgs||[]).filter(m => m.i18nId === uiState.selectedId).forEach(m => { msgs[m.langCd] = m.i18nMsg; });
      return msgs;
    });
    const msgForm = reactive({});

    /* 다국어 openDetail */
    const openDetail = (key) => {
      if (uiState.selectedId === key.i18nId) { uiState.selectedId = null; return; }
      uiState.selectedId = key.i18nId;
      const msgs = {};
      LANGS.forEach(lang => { msgs[lang] = ''; });
      (i18nMsgs||[]).filter(m => m.i18nId === key.i18nId).forEach(m => { msgs[m.langCd] = m.i18nMsg; });
      Object.assign(msgForm, msgs);
    };

    /* 다국어 saveMsgs */
    const saveMsgs = async () => {
      if (!cfSelectedKey.value) return;
      const ok = await showConfirm('저장', '번역 메시지를 저장하시겠습니까?');
      if (!ok) return;
      const src = i18nMsgs;
      LANGS.forEach(lang => {
        const existing = src.find(m => m.i18nId === cfSelectedKey.value.i18nId && m.langCd === lang);
        if (existing) existing.i18nMsg = msgForm[lang];
        else if (msgForm[lang]) src.push({ i18nMsgId: 'IM' + Date.now() + lang, i18nId: cfSelectedKey.value.i18nId, langCd: lang, i18nMsg: msgForm[lang] });
      });
      try {
        const res = await boApiSvc.syI18n.updateMsgs(cfSelectedKey.value.i18nId, { msgs: { ...msgForm } }, '다국어관리', '저장');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('저장되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 다국어 getLangMsg */
    const getLangMsg = (i18nId, lang) => {
      const m = (i18nMsgs||[]).find(m => m.i18nId === i18nId && m.langCd === lang);
      return m ? m.i18nMsg : '';
    };

    /* 다국어 목록조회 */
    const onSearch = async () => { pager.pageNo = 1; await handleSearchData('DEFAULT'); };

    /* 다국어 onReset */
    const onReset  = () => { Object.assign(searchParam, _initSearchParam()); pager.pageNo = 1; handleSearchData('DEFAULT'); };

    /* 다국어 setPage */
    const setPage  = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchData(); } };

    /* 다국어 onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchData(); };

    /* 다국어 fnYnBadge */
    const fnYnBadge  = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchData('DEFAULT');
    });

    /* BoGrid 컬럼 정의 (특수셀은 #cell-* 슬롯으로 override) */
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
    const fnRowStyle = (row) => selectedId.value === row.i18nId ? 'background:#fff8f9;cursor:pointer;' : 'cursor:pointer;';

    // -- return ---------------------------------------------------------------

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - 언어별 번역 입력 ==============
    const msgFormColumns = LANGS.map(lang => ({
      key: lang,
      label: LANG_LABELS[lang] + ' (' + lang + ')',
      type: 'text',
      placeholder: LANG_LABELS[lang] + ' 번역 입력',
    }));

    return { uiState, codes, searchParam, pager, setPage, onSearch, onReset,
             i18nKeys, i18nMsgs, selectedId, cfSelectedKey, cfSelectedMsgs, msgForm, openDetail, saveMsgs, getLangMsg,
             LANGS, LANG_LABELS, fnScopeBadge, fnYnBadge, onSizeChange, baseSearchColumns, baseGridColumns, fnRowStyle,
             msgFormColumns };
  },
  template: `
<div>
  <div class="page-title">다국어관리</div>
  <div class="card">
    <bo-search-area @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <bo-grid
    :columns="baseGridColumns" :rows="i18nKeys" :pager="pager" row-key="i18nId"
    list-title="다국어 키 목록" :count-text="'총 ' + pager.pageTotalCount + '건'"
    :row-style="fnRowStyle" row-clickable
    @set-page="setPage" @size-change="onSizeChange" @row-click="openDetail"></bo-grid>
  <!-- -- 번역 편집 패널 ----------------------------------------------------- -->
  <div class="card" v-if="cfSelectedKey">
    <div class="toolbar">
      <span class="list-title">번역 편집 — <code style="font-size:13px;color:#7c3aed">{{ cfSelectedKey.i18nKey }}</code></span>
      <div style="margin-left:auto;display:flex;gap:6px;">
        <button class="btn btn-blue btn-sm" @click="saveMsgs">저장</button>
        <button class="btn btn-secondary btn-sm" @click="selectedId=null">닫기</button>
      </div>
    </div>
    <!-- 언어별 번역 입력 (BoFormArea 자동 렌더) -->
    <div style="padding:12px">
      <bo-form-area :columns="msgFormColumns" :form="msgForm" :errors="{}"
        :cols="2" :show-actions="false" />
    </div>
  </div>
</div>
`
};
