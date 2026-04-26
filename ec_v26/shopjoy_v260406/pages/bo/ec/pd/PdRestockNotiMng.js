/* ShopJoy Admin - 재입고알림관리 */
window.PdRestockNotiMng = {
  name: 'PdRestockNotiMng',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const products = reactive([]);
    const members = reactive([]);
    const restockNotis = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({
      product_statuses: [],
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => {
      const codeStore = window.getBoCodeStore();
      try {
        codes.product_statuses = codeStore.snGetGrpCodes('PRODUCT_STATUS') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await window.boApi.get('/bo/ec/pd/restock-noti/page', {
          params: { pageNo: pager.pageNo, pageSize: pager.pageSize, ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) },
          headers: { 'X-UI-Nm': '재입고알림관리', 'X-Cmd-Nm': '조회' }
        });
        const data = res.data?.data;
        restockNotis.splice(0, restockNotis.length, ...(data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('PdRestockNoti 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleSearchList('DEFAULT');
    Object.assign(searchParamOrg, searchParam); });
const searchParam = reactive({
    prod: '',
    noti: ''
  });
  const searchParamOrg = reactive({
    prod: '',
    noti: ''
  });
    const applied    = reactive({ prod: '', noti: '' });
    const pager      = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const checkedIds = reactive(new Set());

    const getProdNm = id => { const p = (products||[]).find(p => p.productId === id); return p ? p.productName : ('상품#'+id); };
    const getMemNm  = id => { const m = (members||[]).find(m => m.userId === id); return m ? m.name : ('회원#'+id); };

    const cfPageNums   = computed(() => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const allChecked    = computed(() => restockNotis.length > 0 && restockNotis.every(r => checkedIds.has(r.restockNotiId)));
    const toggleAll     = () => { if (allChecked.value) restockNotis.forEach(r => checkedIds.delete(r.restockNotiId)); else restockNotis.forEach(r => checkedIds.add(r.restockNotiId)); };
    const toggleOne     = id => { if (checkedIds.has(id)) checkedIds.delete(id); else checkedIds.add(id); };
    const checkedCount  = computed(() => checkedIds.size);

    const handleSend = async () => {
      const targets = (restockNotis||[]).filter(r => checkedIds.has(r.restockNotiId) && r.notiYn === 'N');
      if (!targets.length) { props.showToast('발송할 미발송 항목을 선택하세요.', 'info'); return; }
      const ok = await props.showConfirm('알림발송', `선택한 ${targets.length}건에 재입고 알림을 발송하시겠습니까?`);
      if (!ok) return;
      const now = new Date().toLocaleString('sv').replace('T', ' '); window.safeArrayUtils.safeForEach(targets, r => { r.notiYn = 'Y'; r.notiDate = now; }); checkedIds.clear();
      try {
        const res = await window.boApi.post('/bo/ec/pd/restock-noti/send', { ids: targets.map(r => r.restockNotiId) }, { headers: { 'X-UI-Nm': '재입고알림관리', 'X-Cmd-Nm': '전송' } });
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(`${targets.length}건 알림이 발송되었습니다.`, 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    const onReset = async () => {
      Object.assign(searchParam, searchParamOrg);
      pager.pageNo = 1;
      await handleSearchList();
    };

    const setPage  = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const fnYnBadge  = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    return { restockNotis, uiState, searchParam, searchParamOrg, pager, cfPageNums, setPage, onSearch, onReset,
             checkedIds, checkedCount, allChecked, toggleAll, toggleOne, handleSend, fnYnBadge, getProdNm, getMemNm  , onSizeChange };
  },
  template: `
<div>
  <div class="page-title">재입고알림관리</div>
    <div class="card">
      <div class="search-bar">
        <label class="search-label">상품명</label>
        <input class="form-control" v-model="searchParam.prod" @keyup.enter="() => onSearch?.()" placeholder="상품명 검색">
        <label class="search-label">알림발송</label>
        <select class="form-control" v-model="searchParam.noti">
          <option value="">전체</option><option value="N">미발송</option><option value="Y">발송완료</option>
        </select>
        <div class="search-actions">
          <button class="btn btn-primary btn-sm" @click="onSearch">조회</button>
          <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="toolbar">
        <span class="list-title">재입고알림 목록</span>
        <span class="list-count">총 {{ pager.pageTotalCount }}건</span>
        <button v-if="checkedCount > 0" class="btn btn-blue btn-sm" style="margin-left:auto" @click="handleSend">
          📣 알림발송 ({{ checkedCount }}건)
        </button>
      </div>
      <table class="bo-table">
        <thead><tr>
          <th style="width:36px"><input type="checkbox" :checked="allChecked" @change="toggleAll"></th>
          <th>상품명</th><th style="width:100px">SKU</th><th style="width:100px">신청회원</th>
          <th style="width:80px;text-align:center">발송여부</th>
          <th style="width:140px">발송일시</th>
          <th style="width:140px">신청일</th>
        </tr></thead>
        <tbody>
          <tr v-for="row in restockNotis" :key="row?.restockNotiId">
            <td><input type="checkbox" :checked="checkedIds.has(row.restockNotiId)" @change="toggleOne(row.restockNotiId)"></td>
            <td>{{ getProdNm(row.prodId) }}</td>
            <td style="font-size:12px;color:#888">{{ row.skuId || '-' }}</td>
            <td style="font-size:12px">{{ getMemNm(row.memberId) }}</td>
            <td style="text-align:center"><span :class="['badge',fnYnBadge(row.notiYn)]">{{ row.notiYn==='Y'?'발송완료':'미발송' }}</span></td>
            <td style="font-size:12px;color:#888">{{ row.notiDate || '-' }}</td>
            <td style="font-size:12px">{{ row.regDate }}</td>
          </tr>
          <tr v-if="!restockNotis.length"><td colspan="7" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
      <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
           <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
           <button v-for="n in cfPageNums" :key="Math.random()" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
           <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageNo+1)">›</button>
           <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageTotalPage)">»</button>
         </div>
         <div class="pager-right">
           <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
             <option v-for="s in pager.pageSizes" :key="Math.random()" :value="s">{{ s }}개</option>
           </select>
         </div>
       </div>
    </div>
</div>`
};
