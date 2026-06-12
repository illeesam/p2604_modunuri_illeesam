/* ShopJoy Admin - 재입고알림관리 */
window.PdRestockNotiMng = {
  name: 'PdRestockNotiMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
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

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PdRestockNotiMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        baseGridPager.pageNo = 1;
        return handleSearchList();
      // 선택된 항목 알림 발송
      } else if (cmd === 'restockNotis-send') {
        return handleSend();
      // 선택된 항목 전체 토글
      } else if (cmd === 'restockNotis-toggleAll') {
        if (allChecked.value) { restockNotis.forEach(r => checkedIds.delete(r.restockNotiId)); }
        else { restockNotis.forEach(r => checkedIds.add(r.restockNotiId)); }
        return;
      // 페이지 번호 변경
      } else if (cmd === 'restockNotis-pager-setPage') {
        if (param >= 1 && param <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = param; handleSearchList('PAGE_CLICK'); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PdRestockNotiMng.js : handleSelectAction -> ', cmd, param);
      // 단일 행 체크 토글
      if (cmd === 'restockNotis-rowToggle') {
        if (checkedIds.has(param)) { checkedIds.delete(param); } else { checkedIds.add(param); }
        return;
      // 페이지 크기 변경
      } else if (cmd === 'restockNotis-pager-sizeChange') {
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => ({ prodId: '', notiYn: '' });
    const searchParam = reactive(_initSearchParam());

    /* ===== 페이지네이션 ===== */
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.pdRestockNoti.getPage({ pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize, ...coUtil.cofOmitEmpty(searchParam) }, '재입고알림관리', '목록조회');
        const data = res.data?.data;
        restockNotis.splice(0, restockNotis.length, ...(data?.pageList || []));
        baseGridPager.pageTotalCount = data?.pageTotalCount || 0;
        baseGridPager.pageTotalPage = data?.pageTotalPage || Math.ceil(baseGridPager.pageTotalCount / baseGridPager.pageSize) || 1;
        coUtil.cofBuildPagerNums(baseGridPager);
        Object.assign(baseGridPager.pageCond, data?.pageCond || baseGridPager.pageCond);
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
        if (showToast) { showToast(`${targets.length}건 알림이 발송되었습니다.`, 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* getProdNm — 상품명 조회 */
    const getProdNm = id => { const p = (products||[]).find(p => p.productId === id); return p ? p.productName : ('상품#'+id); };

    /* getMemNm — 회원명 조회 */
    const getMemNm = id => { const m = (members||[]).find(m => m.userId === id); return m ? m.name : ('회원#'+id); };


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

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'prodId', label: '상품ID', type: 'text', placeholder: '상품ID 검색' },
      { key: 'notiYn', label: '알림발송', type: 'select', options: () => codes.send_yn_opts, nullLabel: '전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'prodId',   label: '상품명', fmt: (v, row) => getProdNm(row.prodId) },
      { key: 'skuId',    label: 'SKU',    style: 'width:100px', cellStyle: 'color:#888', fmt: (v) => v || '-' },
      { key: 'memberId', label: '신청회원', style: 'width:100px', fmt: (v, row) => getMemNm(row.memberId) },
      { key: 'notiYn',   label: '발송여부', style: 'width:80px;text-align:center', align: 'center',
        badge: (row) => fnYnBadge(row.notiYn), fmt: (v, row) => row.notiYn === 'Y' ? '발송완료' : '미발송' },
      { key: 'notiDate', label: '발송일시', style: 'width:140px', cellStyle: 'color:#888', fmt: (v) => v || '-' },
      { key: 'regDate',  label: '신청일',  style: 'width:140px',  fmt: (v) => coUtil.cofYmd(v) || '-' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      restockNotis, uiState, searchParam, baseGridPager,       // 상태 / 데이터
      handleBtnAction, handleSelectAction, // dispatch
      checkedCount, allChecked, // computed
      fnIsChecked,           // 헬퍼
    };
  },
  template: `
<bo-page title="재입고알림관리">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 목록 영역 ===================================================== -->
  <bo-container title="재입고알림 목록" :count-text="'총 ' + baseGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <button v-if="checkedCount > 0" class="btn btn-blue btn-sm" @click="handleBtnAction('restockNotis-send')">
        📣 알림발송 ({{ checkedCount }}건)
      </button>
    </template>
    <bo-grid bare
      :columns="columns.baseGrid" :rows="restockNotis" row-key="restockNotiId"
      selectable checked-key="restockNotiId" :is-checked="fnIsChecked" :all-checked="allChecked"
      @toggle-check="id => handleSelectAction('restockNotis-rowToggle', id)" @toggle-check-all="handleBtnAction('restockNotis-toggleAll')">
    </bo-grid>
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('restockNotis-pager-setPage', n)" :on-size-change="() => handleSelectAction('restockNotis-pager-sizeChange')" />
  </bo-container>
</bo-page>
`
};
