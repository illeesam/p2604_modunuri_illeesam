/* ShopJoy Admin - 재입고알림관리 */
window.PdRestockNotiMng = {
  name: 'PdRestockNotiMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const products = reactive([]);
    const members = reactive([]);
    const restockNotis = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({
      product_statuses: [],
      send_yn_opts: [{codeValue:'Y',codeLabel:'발송완료'},{codeValue:'N',codeLabel:'미발송'}],
    });

    /* 재입고 알림 fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.product_statuses = codeStore.sgGetGrpCodes('PRODUCT_STATUS');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

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

    /* 재입고 알림 _initSearchParam */
    const _initSearchParam = () => ({ prod: '', noti: '' });
    const searchParam = reactive(_initSearchParam());

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');    });
    const pager      = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const checkedIds = reactive(new Set());

    /* 재입고 알림 getProdNm */
    const getProdNm = id => { const p = (products||[]).find(p => p.productId === id); return p ? p.productName : ('상품#'+id); };

    /* 재입고 알림 getMemNm */
    const getMemNm  = id => { const m = (members||[]).find(m => m.userId === id); return m ? m.name : ('회원#'+id); };

    /* 재입고 알림 fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    const allChecked    = computed(() => restockNotis.length > 0 && restockNotis.every(r => checkedIds.has(r.restockNotiId)));

    /* 재입고 알림 toggleAll */
    const toggleAll     = () => { if (allChecked.value) restockNotis.forEach(r => checkedIds.delete(r.restockNotiId)); else restockNotis.forEach(r => checkedIds.add(r.restockNotiId)); };

    /* 재입고 알림 toggleOne */
    const toggleOne     = id => { if (checkedIds.has(id)) checkedIds.delete(id); else checkedIds.add(id); };

    /* 재입고 알림 fnIsChecked — BoGrid selectable :is-checked 바인딩용 */
    const fnIsChecked   = id => checkedIds.has(id);
    const checkedCount  = computed(() => checkedIds.size);

    /* 재입고 알림 handleSend */
    const handleSend = async () => {
      const targets = (restockNotis||[]).filter(r => checkedIds.has(r.restockNotiId) && r.notiYn === 'N');
      if (!targets.length) { showToast('발송할 미발송 항목을 선택하세요.', 'info'); return; }
      const ok = await showConfirm('알림발송', `선택한 ${targets.length}건에 재입고 알림을 발송하시겠습니까?`);
      if (!ok) return;
      const now = new Date().toLocaleString('sv').replace('T', ' '); window.safeArrayUtils.safeForEach(targets, r => { r.notiYn = 'Y'; r.notiDate = now; }); checkedIds.clear();
      try {
        const res = await boApiSvc.pdRestockNoti.send({ ids: targets.map(r => r.restockNotiId) }, '재입고알림관리', '전송');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast(`${targets.length}건 알림이 발송되었습니다.`, 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 재입고 알림 목록조회 */
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    /* 재입고 알림 onReset */
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      pager.pageNo = 1;
      await handleSearchList();
    };

    /* 재입고 알림 setPage */
    const setPage  = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* 재입고 알림 onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* 재입고 알림 fnYnBadge */
    const fnYnBadge  = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    // -- return ---------------------------------------------------------------

    /* AG-Grid 식 컬럼 정의 — width/align 등 헤더·셀 속성을 컬럼 객체에 선언.
       체크박스 열은 BoGrid 의 selectable 기능이 자동 렌더하므로 컬럼에서 제외. */
        const baseSearchColumns = [
      { key: 'prod', label: '상품명', type: 'text', placeholder: '상품명 검색' },
      { key: 'noti', label: '알림발송', type: 'select', options: () => codes.send_yn_opts, nullLabel: '전체' },
    ];

    const baseGridColumns = [
      { key: 'prodId',   label: '상품명', fmt: (v, row) => getProdNm(row.prodId) },
      { key: 'skuId',    label: 'SKU',    style: 'width:100px', cellStyle: 'color:#888', fmt: (v) => v || '-' },
      { key: 'memberId', label: '신청회원', style: 'width:100px', fmt: (v, row) => getMemNm(row.memberId) },
      { key: 'notiYn',   label: '발송여부', style: 'width:80px;text-align:center', align: 'center',
        badge: (row) => fnYnBadge(row.notiYn), fmt: (v, row) => row.notiYn === 'Y' ? '발송완료' : '미발송' },
      { key: 'notiDate', label: '발송일시', style: 'width:140px', cellStyle: 'color:#888', fmt: (v) => v || '-' },
      { key: 'regDate',  label: '신청일',  style: 'width:140px' },
    ];

    return { restockNotis, uiState, searchParam, pager, baseSearchColumns, baseGridColumns, setPage, onSearch, onReset,
             checkedIds, checkedCount, allChecked, toggleAll, toggleOne, fnIsChecked, handleSend, fnYnBadge, getProdNm, getMemNm, onSizeChange,
             codes };
  },
  template: `
<div>
  <div class="page-title">재입고알림관리</div>
  <div class="card">
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title">재입고알림 목록</span>
      <span class="list-count">총 {{ pager.pageTotalCount }}건</span>
      <button v-if="checkedCount > 0" class="btn btn-blue btn-sm" style="margin-left:auto" @click="handleSend">
        📣 알림발송 ({{ checkedCount }}건)
      </button>
    </div>
    <bo-grid
      :columns="baseGridColumns" :rows="restockNotis" :pager="pager" row-key="restockNotiId"
      list-title="목록" :count-text="pager.pageTotalCount + '건'"
      selectable checked-key="restockNotiId" :is-checked="fnIsChecked" :all-checked="allChecked"
      @set-page="setPage" @size-change="onSizeChange"
      @toggle-check="toggleOne" @toggle-check-all="toggleAll"></bo-grid>
  </div>
</div>
`
};
