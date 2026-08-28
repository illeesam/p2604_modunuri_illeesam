/* ShopJoy Admin - 재입고알림관리 */
export default {
  name: 'bo-pd-pd-pdRestockNotiMng',
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
    const uiState = reactive({ loading: false, error: null });
    const codes = reactive({
      PROD_STATUS_CD: [],
      SEND_YN: [],
    });
    const siteOptions = reactive([]);  // 사이트 선택 옵션 (BO 는 강제 필터 없음 — 선택적 검색용)

    /* ===== 검색조건 ===== */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoPdPdPdRestockNotiMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
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
      console.log(' ■■ BoPdPdPdRestockNotiMng.js : handleSelectAction -> ', cmd, param);
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

    const searchParam = reactive({ prodId: '', notiYn: '' });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다.
       리터럴 기본값이 아니라 '화면을 열었을 때의 상태'가 기준이라, initPage 가 채운
       기본 기간·사이트 값도 함께 복원된다. (재대입 금지 — Object.assign 으로만 갱신) */
    const searchParamInit = {};

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
        baseGridPager.pageTotalPage = data?.pageTotalPage || coUtil.cofTotalPage(baseGridPager);
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
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['PROD_STATUS_CD', 'SEND_YN'], {compNm: 'bo-pd-pd-pdRestockNotiMng'});
      try {
        codes.PROD_STATUS_CD = codeStore.sgGetGrpCodes('PROD_STATUS_CD');
        codes.SEND_YN = codeStore.sgGetGrpCodes('SEND_YN');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
            siteOptions.splice(0, siteOptions.length, ...(await window.boUtil.bofLoadSiteOptions()));
    };

    // ★ onMounted
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      /* 공유된 링크(bo-page shareQuery)로 들어온 경우 URL 쿼리의 검색조건을 복원 */
      const _qs = new URLSearchParams(window.location.search);
      const _reserved = ['page','id','orderId','claimId','embed','dtlMode'];
      Object.keys(searchParam).forEach((k) => { if (!_reserved.includes(k) && _qs.has(k)) searchParam[k] = _qs.get(k); });
      await handleSearchList('DEFAULT');
      Object.assign(searchParamInit, searchParam);   // [초기화] 기준값 스냅샷
    };
    onMounted(initPage);

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'prodId', label: '상품ID', type: 'text', placeholder: '상품ID 검색' },
      { key: 'notiYn', label: '알림발송', type: 'select', options: () => codes.SEND_YN, nullLabel: '전체' },
          { key: 'siteId', type: 'select', label: '사이트', options: () => siteOptions, nullLabel: '전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'prodId',   label: '상품명', fmt: (v, row) => getProdNm(row.prodId) },
      { key: 'prodSkuId', label: 'SKU',   style: 'width:100px', cellStyle: 'color:#888', fmt: (v) => v || '-' },
      { key: 'memberId', label: '신청회원', style: 'width:100px', fmt: (v, row) => getMemNm(row.memberId) },
      { key: 'notiYn',   label: '발송여부', style: 'width:80px;text-align:center', align: 'center',
        badge: (row) => fnYnBadge(row.notiYn), fmt: (v, row) => row.notiYn === 'Y' ? '발송완료' : '미발송' },
      { key: 'notiDate', label: '발송일시', style: 'width:140px', cellStyle: 'color:#888', fmt: (v) => v || '-' },
      { key: 'regDate',  label: '신청일',  style: 'width:140px',  fmt: (v) => coUtil.cofYmd(v) || '-' },
          { key: 'siteNm', label: '사이트' },
    ];

    /* excelModal — 엑셀 다운로드 (공용 모달) */
    const excelModal = reactive({ show: false });
    const buildExcelParams = () => ({ ...coUtil.cofOmitEmpty(searchParam) });

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      restockNotis, uiState, searchParam, baseGridPager,       // 상태 / 데이터
      excelModal, buildExcelParams, // 엑셀 다운로드 모달
      handleBtnAction, handleSelectAction, // dispatch
      checkedCount, allChecked, // computed
      fnIsChecked,           // 헬퍼
    };
  },
  template: `
<bo-page title="재입고알림관리" :share-query="searchParam">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 목록 영역 ===================================================== -->
  <bo-container title="재입고알림 목록" :count-text="'총 ' + baseGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <button class="btn btn_excel" @click="excelModal.show = true">엑셀</button>
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
    <bo-excel-down-modal :show="excelModal.show" domain="pdRestockNoti" area-nm="재입고알림"
      :columns="columns.baseGrid" ui-nm="재입고알림관리" :params="buildExcelParams()"
      @close="excelModal.show = false" />
  </bo-container>
</bo-page>
`
};
