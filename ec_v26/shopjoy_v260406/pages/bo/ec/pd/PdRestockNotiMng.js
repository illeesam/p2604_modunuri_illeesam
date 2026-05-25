/* ShopJoy Admin - 재입고알림관리 */
window.PdRestockNotiMng = {
  name: 'PdRestockNotiMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== [01] 초기 변수 정의 ====================================================
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const products = reactive([]);
    const members = reactive([]);
    const restockNotis = reactive([]);             // 재입고알림 목록 (메인 그리드)
    const checkedIds = reactive(new Set());        // 선택된 알림 ID Set
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({
      product_statuses: [],
      send_yn_opts: [{codeValue:'Y',codeLabel:'발송완료'},{codeValue:'N',codeLabel:'미발송'}],
    });

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PdRestockNotiMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        pager.pageNo = 1;
        return handleSearchList();
      // 선택된 항목 알림 발송
      } else if (cmd === 'restockNotis-send') {
        return handleSend();
      // 선택된 항목 전체 토글
      } else if (cmd === 'restockNotis-toggle-all') {
        if (allChecked.value) { restockNotis.forEach(r => checkedIds.delete(r.restockNotiId)); }
        else { restockNotis.forEach(r => checkedIds.add(r.restockNotiId)); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PdRestockNotiMng.js : handleSelectAction -> ', cmd, param);
      // 단일 행 체크 토글
      if (cmd === 'restockNotis-row-toggle') {
        if (checkedIds.has(param)) { checkedIds.delete(param); } else { checkedIds.add(param); }
        return;
      // 페이지 번호 변경
      } else if (cmd === 'restockNotis-set-page') {
        if (param >= 1 && param <= pager.pageTotalPage) { pager.pageNo = param; handleSearchList('PAGE_CLICK'); }
        return;
      // 페이지 크기 변경
      } else if (cmd === 'restockNotis-size-change') {
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => ({ prod: '', noti: '' });
    const searchParam = reactive(_initSearchParam());

    /* ===== 페이지네이션 ===== */
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ============================

    /* handleSearchList — 목록 조회 */
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

    /* handleSend — 알림 발송 */
    const handleSend = async () => {
      const targets = (restockNotis||[]).filter(r => checkedIds.has(r.restockNotiId) && r.notiYn === 'N');
      if (!targets.length) { showToast('발송할 미발송 항목을 선택하세요.', 'info'); return; }
      const ok = await showConfirm('알림발송', `선택한 ${targets.length}건에 재입고 알림을 발송하시겠습니까?`);
      if (!ok) { return; }
      const now = new Date().toLocaleString('sv').replace('T', ' '); window.safeArrayUtils.safeForEach(targets, r => { r.notiYn = 'Y'; r.notiDate = now; }); checkedIds.clear();
      try {
        const res = await boApiSvc.pdRestockNoti.send({ ids: targets.map(r => r.restockNotiId) }, '재입고알림관리', '전송');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast(`${targets.length}건 알림이 발송되었습니다.`, 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* getProdNm — 상품명 조회 */
    const getProdNm = id => { const p = (products||[]).find(p => p.productId === id); return p ? p.productName : ('상품#'+id); };

    /* getMemNm — 회원명 조회 */
    const getMemNm = id => { const m = (members||[]).find(m => m.userId === id); return m ? m.name : ('회원#'+id); };

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* fnIsChecked — 체크 여부 */
    const fnIsChecked = id => checkedIds.has(id);

    /* fnYnBadge — 사용여부 배지 */
    const fnYnBadge = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    const allChecked = computed(() => restockNotis.length > 0 && restockNotis.every(r => checkedIds.has(r.restockNotiId)));
    const checkedCount = computed(() => checkedIds.size);

    /* fnLoadCodes — 공통코드 로드 */
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

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    // ===== [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ====================

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

    // ===== [06] return (템플릿 노출) ==============================================

    return {
      restockNotis, uiState, codes, searchParam, pager,                                 // 상태 / 데이터
      baseSearchColumns, baseGridColumns,                                                // 컬럼 정의
      handleBtnAction, handleSelectAction,                                               // dispatch
      checkedCount, allChecked,                                                          // computed
      fnIsChecked, fnYnBadge,                                                            // 헬퍼
    };
  },
  template: `
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    재입고알림관리
  </div>
  <!-- ===== ■. 검색 ====================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 목록 그리드 =================================================== -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">
        재입고알림 목록
      </span>
      <span class="list-count">
        총 {{ pager.pageTotalCount }}건
      </span>
      <button v-if="checkedCount > 0" class="btn btn-blue btn-sm" style="margin-left:auto" @click="handleBtnAction('restockNotis-send')">
        📣 알림발송 ({{ checkedCount }}건)
      </button>
    </div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid
      :columns="baseGridColumns" :rows="restockNotis" :pager="pager" row-key="restockNotiId"
      list-title="목록" :count-text="pager.pageTotalCount + '건'"
      selectable checked-key="restockNotiId" :is-checked="fnIsChecked" :all-checked="allChecked"
      @set-page="n => handleSelectAction('restockNotis-set-page', n)" @size-change="handleSelectAction('restockNotis-size-change')"
      @toggle-check="id => handleSelectAction('restockNotis-row-toggle', id)" @toggle-check-all="handleBtnAction('restockNotis-toggle-all')">
    </bo-grid>
  </div>
  <!-- ===== □. 목록 그리드 =================================================== -->
</div>
`
};
