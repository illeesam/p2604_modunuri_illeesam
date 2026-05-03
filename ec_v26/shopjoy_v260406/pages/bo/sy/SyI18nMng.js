/* ShopJoy Admin - 다국어관리 */
window.SyI18nMng = {
  name: 'SyI18nMng',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const i18nKeys = reactive([]);
    const i18nMsgs = reactive([]);
    const uiState = reactive({ isPageCodeLoad: false, selectedId: null});
    const codes = reactive({ lang_code: [], use_yn: [], i18n_scopes: ['COMMON','FO','BO'] });

    const _initSearchParam = () => {
      return { kw: '', scope: '', use: '' };
    };
    const searchParam = reactive(_initSearchParam());
    const pager       = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    const handleSearchData = async (searchType = 'DEFAULT') => {
      try {
        const { kw, scope, use } = searchParam;
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...(kw    ? { kw: kw.trim() }         : {}),
          ...(scope ? { i18nScopeCd: scope }     : {}),
          ...(use   ? { useYn: use }             : {}),
        };
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

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.lang_code = codeStore.sgGetGrpCodes('LANG_CODE');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = boUtil.useAppCodeReady(uiState, fnLoadCodes);


    const selectedId  = ref(null);

    const LANGS       = ['ko','en','ja','in'];
    const LANG_LABELS = { ko:'한국어', en:'English', ja:'日本語', in:'Indonesia' };
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

    const openDetail = (key) => {
      if (uiState.selectedId === key.i18nId) { uiState.selectedId = null; return; }
      uiState.selectedId = key.i18nId;
      const msgs = {};
      LANGS.forEach(lang => { msgs[lang] = ''; });
      (i18nMsgs||[]).filter(m => m.i18nId === key.i18nId).forEach(m => { msgs[m.langCd] = m.i18nMsg; });
      Object.assign(msgForm, msgs);
    };
    const saveMsgs = async () => {
      if (!cfSelectedKey.value) return;
      const ok = await props.showConfirm('저장', '번역 메시지를 저장하시겠습니까?');
      if (!ok) return;
      const src = i18nMsgs;
      LANGS.forEach(lang => {
        const existing = src.find(m => m.i18nId === cfSelectedKey.value.i18nId && m.langCd === lang);
        if (existing) existing.i18nMsg = msgForm[lang];
        else if (msgForm[lang]) src.push({ i18nMsgId: 'IM' + Date.now() + lang, i18nId: cfSelectedKey.value.i18nId, langCd: lang, i18nMsg: msgForm[lang] });
      });
      try {
        const res = await boApiSvc.syI18n.updateMsgs(cfSelectedKey.value.i18nId, { msgs: { ...msgForm } }, '다국어관리', '저장');
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('저장되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const getLangMsg = (i18nId, lang) => {
      const m = (i18nMsgs||[]).find(m => m.i18nId === i18nId && m.langCd === lang);
      return m ? m.i18nMsg : '';
    };
    const onSearch = async () => { pager.pageNo = 1; await handleSearchData('DEFAULT'); };
    const onReset  = () => { Object.assign(searchParam, _initSearchParam()); pager.pageNo = 1; handleSearchData('DEFAULT'); };
    const setPage  = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchData(); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchData(); };
    const fnYnBadge  = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchData('DEFAULT');
    });

    // -- return ---------------------------------------------------------------

    return { uiState, codes, searchParam, pager, setPage, onSearch, onReset,
             selectedId, cfSelectedKey, cfSelectedMsgs, msgForm, openDetail, saveMsgs, getLangMsg,
             LANGS, LANG_LABELS, fnScopeBadge, fnYnBadge, onSizeChange };
  },
  template: `
<div>
  <div class="page-title">다국어관리</div>
    <div class="card">
      <div class="search-bar">
        <label class="search-label">키/설명</label>
        <input class="form-control" v-model="searchParam.kw" @keyup.enter="onSearch" placeholder="키 또는 설명 검색">
        <label class="search-label">범위</label>
        <select class="form-control" v-model="searchParam.scope">
          <option value="">전체</option><option v-for="s in codes.i18n_scopes" :key="s" :value="s">{{ s }}</option>
        </select>
        <label class="search-label">사용여부</label>
        <select class="form-control" v-model="searchParam.use"><option value="">전체</option><option v-for="o in codes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option></select>
        <div class="search-actions">
          <button class="btn btn-primary btn-sm" @click="onSearch">조회</button>
          <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="toolbar">
        <span class="list-title">다국어 키 목록</span>
        <span class="list-count">총 {{ pager.pageTotalCount }}건</span>
      </div>
      <table class="bo-table">
        <thead><tr>
          <th style="width:36px;text-align:center;">번호</th><th>키 (i18n_key)</th><th>설명</th>
          <th style="width:80px;text-align:center">범위</th>
          <th style="width:80px">카테고리</th>
          <th style="width:70px;text-align:center">ko</th>
          <th style="width:70px;text-align:center">en</th>
          <th style="width:70px;text-align:center">ja</th>
          <th style="width:60px;text-align:center">사용</th>
        </tr></thead>
        <tbody>
          <tr v-for="(row, idx) in i18nKeys" :key="row.i18nId" :class="{active:selectedId===row.i18nId}" @click="openDetail(row)" style="cursor:pointer">
            <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
            <td><code style="font-size:12px;color:#7c3aed">{{ row.i18nKey }}</code></td>
            <td style="color:#666;font-size:12px">{{ row.i18nDesc }}</td>
            <td style="text-align:center"><span :class="['badge',fnScopeBadge(row.i18nScopeCd)]">{{ row.i18nScopeCd }}</span></td>
            <td style="font-size:12px;color:#888">{{ row.i18nCategory }}</td>
            <td style="text-align:center;font-size:11px;color:#555">{{ getLangMsg(row.i18nId,'ko') }}</td>
            <td style="text-align:center;font-size:11px;color:#555">{{ getLangMsg(row.i18nId,'en') }}</td>
            <td style="text-align:center;font-size:11px;color:#555">{{ getLangMsg(row.i18nId,'ja') }}</td>
            <td style="text-align:center"><span :class="['badge',fnYnBadge(row.useYn)]">{{ row.useYn }}</span></td>
          </tr>
          <tr v-if="!i18nKeys.length"><td colspan="9" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
    </div>
    <!-- -- 번역 편집 패널 ----------------------------------------------------- -->
    <div class="card" v-if="cfSelectedKey">
      <div class="toolbar">
        <span class="list-title">번역 편집 — <code style="font-size:13px;color:#7c3aed">{{ cfSelectedKey.i18nKey }}</code></span>
        <div style="margin-left:auto;display:flex;gap:6px;">
          <button class="btn btn-blue btn-sm" @click="saveMsgs">저장</button>
          <button class="btn btn-secondary btn-sm" @click="selectedId=null">닫기</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px">
        <div class="form-group" v-for="lang in LANGS" :key="lang">
          <label class="form-label">{{ LANG_LABELS[lang] }} ({{ lang }})</label>
          <input class="form-control" v-model="msgForm[lang]" :placeholder="LANG_LABELS[lang]+' 번역 입력'">
        </div>
      </div>
    </div>
</div>`
};
