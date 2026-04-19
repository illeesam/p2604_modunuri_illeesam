/* ShopJoy Admin - 다국어관리 */
window.SyI18nMng = {
  name: 'SyI18nMng',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const searchKw    = ref('');
    const searchScope = ref('');
    const searchUse   = ref('');
    const applied     = reactive({ kw: '', scope: '', use: '' });
    const pager       = reactive({ page: 1, size: 20 });
    const selectedId  = ref(null);

    const SCOPES      = ['COMMON','FO','BO'];
    const LANGS       = ['ko','en','ja','in'];
    const LANG_LABELS = { ko:'한국어', en:'English', ja:'日本語', in:'Indonesia' };
    const scopeBadge  = s => ({ COMMON:'badge-blue', FO:'badge-green', BO:'badge-orange' }[s] || 'badge-gray');

    const filtered = computed(() => {
      const kw = applied.kw.toLowerCase();
      return (props.adminData.i18nKeys || []).filter(k => {
        if (kw && !k.i18nKey.toLowerCase().includes(kw) && !(k.i18nDesc||'').toLowerCase().includes(kw)) return false;
        if (applied.scope && k.i18nScopeCd !== applied.scope) return false;
        if (applied.use && k.useYn !== applied.use) return false;
        return true;
      });
    });
    const total      = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList   = computed(() => filtered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums   = computed(() => { const c=pager.page,l=totalPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const selectedKey = computed(() => (props.adminData.i18nKeys||[]).find(k => k.i18nId === selectedId.value) || null);
    const selectedMsgs = computed(() => {
      if (!selectedKey.value) return {};
      const msgs = {};
      LANGS.forEach(lang => { msgs[lang] = ''; });
      (props.adminData.i18nMsgs||[]).filter(m => m.i18nId === selectedId.value).forEach(m => { msgs[m.langCd] = m.i18nMsg; });
      return msgs;
    });
    const msgForm = reactive({});

    const openDetail = (key) => {
      if (selectedId.value === key.i18nId) { selectedId.value = null; return; }
      selectedId.value = key.i18nId;
      const msgs = {};
      LANGS.forEach(lang => { msgs[lang] = ''; });
      (props.adminData.i18nMsgs||[]).filter(m => m.i18nId === key.i18nId).forEach(m => { msgs[m.langCd] = m.i18nMsg; });
      Object.assign(msgForm, msgs);
    };
    const saveMsgs = async () => {
      if (!selectedKey.value) return;
      const ok = await props.showConfirm('저장', '번역 메시지를 저장하시겠습니까?');
      if (!ok) return;
      const src = props.adminData.i18nMsgs;
      LANGS.forEach(lang => {
        const existing = src.find(m => m.i18nId === selectedKey.value.i18nId && m.langCd === lang);
        if (existing) existing.i18nMsg = msgForm[lang];
        else if (msgForm[lang]) src.push({ i18nMsgId: 'IM' + Date.now() + lang, i18nId: selectedKey.value.i18nId, langCd: lang, i18nMsg: msgForm[lang] });
      });
      try {
        const res = await window.adminApi.put(`sy/i18n/${selectedKey.value.i18nId}/msgs`, { msgs: { ...msgForm } });
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('저장되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const getLangMsg = (i18nId, lang) => {
      const m = (props.adminData.i18nMsgs||[]).find(m => m.i18nId === i18nId && m.langCd === lang);
      return m ? m.i18nMsg : '';
    };
    const onSearch = () => { Object.assign(applied, { kw: searchKw.value, scope: searchScope.value, use: searchUse.value }); pager.page = 1; };
    const onReset  = () => { searchKw.value = ''; searchScope.value = ''; searchUse.value = ''; Object.assign(applied, { kw: '', scope: '', use: '' }); pager.page = 1; };
    const setPage  = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const ynBadge  = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    return { searchKw, searchScope, searchUse, pager, pageNums, totalPages, setPage, total, pageList, onSearch, onReset,
             selectedId, selectedKey, msgForm, openDetail, saveMsgs, getLangMsg,
             SCOPES, LANGS, LANG_LABELS, scopeBadge, ynBadge , PAGE_SIZES , onSizeChange };
  },
  template: `
<div>
  <div class="page-title">다국어관리</div>
    <div class="card">
      <div class="search-bar">
        <label class="search-label">키/설명</label>
        <input class="form-control" v-model="searchKw" @keyup.enter="onSearch" placeholder="키 또는 설명 검색">
        <label class="search-label">범위</label>
        <select class="form-control" v-model="searchScope">
          <option value="">전체</option><option v-for="s in SCOPES" :key="s" :value="s">{{ s }}</option>
        </select>
        <label class="search-label">사용여부</label>
        <select class="form-control" v-model="searchUse"><option value="">전체</option><option value="Y">Y</option><option value="N">N</option></select>
        <div class="search-actions">
          <button class="btn btn-primary btn-sm" @click="onSearch">검색</button>
          <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="toolbar">
        <span class="list-title">다국어 키 목록</span>
        <span class="list-count">총 {{ total }}건</span>
      </div>
      <table class="admin-table">
        <thead><tr>
          <th>키 (i18n_key)</th><th>설명</th>
          <th style="width:80px;text-align:center">범위</th>
          <th style="width:80px">카테고리</th>
          <th style="width:70px;text-align:center">ko</th>
          <th style="width:70px;text-align:center">en</th>
          <th style="width:70px;text-align:center">ja</th>
          <th style="width:60px;text-align:center">사용</th>
        </tr></thead>
        <tbody>
          <tr v-for="row in pageList" :key="row.i18nId" :class="{active:selectedId===row.i18nId}" @click="openDetail(row)" style="cursor:pointer">
            <td><code style="font-size:12px;color:#7c3aed">{{ row.i18nKey }}</code></td>
            <td style="color:#666;font-size:12px">{{ row.i18nDesc }}</td>
            <td style="text-align:center"><span :class="['badge',scopeBadge(row.i18nScopeCd)]">{{ row.i18nScopeCd }}</span></td>
            <td style="font-size:12px;color:#888">{{ row.i18nCategory }}</td>
            <td style="text-align:center;font-size:11px;color:#555">{{ getLangMsg(row.i18nId,'ko') }}</td>
            <td style="text-align:center;font-size:11px;color:#555">{{ getLangMsg(row.i18nId,'en') }}</td>
            <td style="text-align:center;font-size:11px;color:#555">{{ getLangMsg(row.i18nId,'ja') }}</td>
            <td style="text-align:center"><span :class="['badge',ynBadge(row.useYn)]">{{ row.useYn }}</span></td>
          </tr>
          <tr v-if="!pageList.length"><td colspan="8" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
      <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="pager.page===1" @click="setPage(1)">«</button>
           <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
           <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
           <button :disabled="pager.page===totalPages" @click="setPage(pager.page+1)">›</button>
           <button :disabled="pager.page===totalPages" @click="setPage(totalPages)">»</button>
         </div>
         <div class="pager-right">
           <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
             <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
           </select>
         </div>
       </div>
    </div>
    <!-- 번역 편집 패널 -->
    <div class="card" v-if="selectedKey">
      <div class="toolbar">
        <span class="list-title">번역 편집 — <code style="font-size:13px;color:#7c3aed">{{ selectedKey.i18nKey }}</code></span>
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
