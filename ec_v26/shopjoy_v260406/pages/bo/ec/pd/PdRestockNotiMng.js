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
      send_yn_opts: [{codeValue:'Y',codeLabel:'발송완료'},{codeValue:'N',codeLabel:'미발송'}],
    });

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.product_statuses = codeStore.sgGetGrpCodes('PRODUCT_STATUS');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = boUtil.useAppCodeReady(uiState, fnLoadCodes);


    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.pdRestockNoti.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) }, '재입고알림관리', '목록조회');
        const data = res.data?.data;
        restockNotis.splice(0, restockNotis.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    const _initSearchParam = () => ({ prod: '', noti: '' });
    const searchParam = reactive(_initSearchParam());

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      if (isAppReady.value) fnLoadCodes(); handleSearchList('DEFAULT');
    });
    const pager      = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const checkedIds = reactive(new Set());

    const getProdNm = id => { const p = (products||[]).find(p => p.productId === id); return p ? p.productName : ('상품#'+id); };
    const getMemNm  = id => { const m = (members||[]).find(m => m.userId === id); return m ? m.name : ('회원#'+id); };

    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

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
        const res = await boApiSvc.pdRestockNoti.send({ ids: targets.map(r => r.restockNotiId) }, '재입고알림관리', '전송');
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
      Object.assign(searchParam, _initSearchParam());
      pager.pageNo = 1;
      await handleSearchList();
    };

    const setPage  = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const fnYnBadge  = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    // -- return ---------------------------------------------------------------

    return { restockNotis, uiState, searchParam, pager, setPage, onSearch, onReset,
             checkedIds, checkedCount, allChecked, toggleAll, toggleOne, handleSend, fnYnBadge, getProdNm, getMemNm, onSizeChange,
             codes };
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
          <option value="">전체</option><option v-for="o in codes.send_yn_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
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
          <th style="width:36px;text-align:center;">번호</th><th>상품명</th><th style="width:100px">SKU</th><th style="width:100px">신청회원</th>
          <th style="width:80px;text-align:center">발송여부</th>
          <th style="width:140px">발송일시</th>
          <th style="width:140px">신청일</th>
        </tr></thead>
        <tbody>
          <tr v-for="(row, idx) in restockNotis" :key="row?.restockNotiId">
            <td><input type="checkbox" :checked="checkedIds.has(row.restockNotiId)" @change="toggleOne(row.restockNotiId)"></td>
            <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
            <td>{{ getProdNm(row.prodId) }}</td>
            <td style="font-size:12px;color:#888">{{ row.skuId || '-' }}</td>
            <td style="font-size:12px">{{ getMemNm(row.memberId) }}</td>
            <td style="text-align:center"><span :class="['badge',fnYnBadge(row.notiYn)]">{{ row.notiYn==='Y'?'발송완료':'미발송' }}</span></td>
            <td style="font-size:12px;color:#888">{{ row.notiDate || '-' }}</td>
            <td style="font-size:12px">{{ row.regDate }}</td>
          </tr>
          <tr v-if="!restockNotis.length"><td colspan="8" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
    </div>
</div>`
};
