/* ShopJoy Admin - 장바구니관리 목록 */
window.OdCartMng = {
  name: 'OdCartMng',
  props: {
    navigate:     { type: Function, required: true },                       // 페이지 이동
    showToast:    { type: Function, default: () => {} },                    // 토스트 알림
    showConfirm:  { type: Function, default: () => Promise.resolve(true) }, // 확인 모달
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, onMounted, computed } = Vue;
    const showToast   = window.boApp?.showToast   || props.showToast;
    const showConfirm = window.boApp?.showConfirm || props.showConfirm;

    /* ── 목록 상태 ── */
    const carts = reactive([]);                                                // 장바구니 목록 (메인 그리드 데이터)
    const pager  = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [5, 10, 20, 30, 50, 100, 200, 500] });
    const uiState = reactive({ loading: false, selectedIds: [] });
    const codes = reactive({ sites: [], cart_date_types: [] });

    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ OdCartMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        if ((searchParam.dateStart || searchParam.dateEnd) && !searchParam.dateType) {
          showToast('기간 검색 시 기간유형을 선택해주세요.', 'error');
          return;
        }
        pager.pageNo = 1;
        return handleSearchList();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        pager.pageNo = 1;
        return handleSearchList();
      // 회원 선택 모달 열기
      } else if (cmd === 'memberPickModal-open') {
        memberPick.open = true;
        return;
      // 회원 선택 모달 닫기
      } else if (cmd === 'memberPickModal-close') {
        memberPick.open = false;
        return;
      // 회원 선택 해제
      } else if (cmd === 'memberPickModal-clear') {
        searchParam.memberId = ''; searchParam.memberNm = '';
        return;
      // 일괄 삭제
      } else if (cmd === 'carts-bulkDelete') {
        return handleBulkDelete();
      // 페이지 번호 클릭
      } else if (cmd === 'carts-pager-setPage') {
        if (param >= 1 && param <= pager.pageTotalPage) { pager.pageNo = param; handleSearchList(); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ OdCartMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'carts-pager-sizeChange') {
        pager.pageNo = 1;
        return handleSearchList();
      // 행 체크 토글
      } else if (cmd === 'carts-rowToggleCheck') {
        const idx = uiState.selectedIds.indexOf(param);
        if (idx >= 0) { uiState.selectedIds.splice(idx, 1); }
        else { uiState.selectedIds.push(param); }
        return;
      // 전체 체크 토글
      } else if (cmd === 'carts-rowToggleCheckAll') {
        uiState.selectedIds = cfAllChecked.value ? [] : carts.map(r => r.cartId);
        return;
      // 행 삭제
      } else if (cmd === 'carts-rowDelete') {
        return handleDelete(param);
      // 회원 선택 모달에서 회원 선택
      } else if (cmd === 'memberPickModal-select') {
        searchParam.memberId = param.memberId;
        searchParam.memberNm = param.memberNm || param.loginId || param.memberId;
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ OdCartMng : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'member-pick') {
        if (result == null) { memberPick.open = false; return; }
        searchParam.memberId = result.memberId;
        searchParam.memberNm = result.memberNm || result.loginId || result.memberId;
        return;
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => ({ siteId: '', memberId: '', memberNm: '', searchType: '', searchValue: '', dateType: 'reg_date', dateStart: '', dateEnd: '' });
    const searchParam = reactive(_initSearchParam());

    /* ── 회원 선택 팝업 (OdMemberPickModal 사용) ── */
    const memberPick = reactive({ open: false });                              // 회원 선택 모달 상태
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* fnCheckedBadgeCls — 선택 여부 배지 클래스 */
    const fnCheckedBadgeCls = (v) => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* fnCheckedNm — 선택 여부 라벨 */
    const fnCheckedNm = (v) => v === 'Y' ? '선택' : '미선택';

    /* fnPrice — 가격 포맷 */
    const fnPrice = (v) => v != null ? Number(v).toLocaleString() + '원' : '-';

    /* fnDate — 일시 포맷 */
    const fnDate = (v) => v ? String(v).substring(0, 16).replace('T', ' ') : '-';

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...(searchParam.siteId    && { siteId:    searchParam.siteId }),
          ...(searchParam.memberId  && { memberId:  searchParam.memberId }),
          ...(searchParam.searchType && { searchType: searchParam.searchType }),
          ...(searchParam.searchValue && { searchValue: searchParam.searchValue }),
          ...(searchParam.dateType    && { dateType:    searchParam.dateType }),
          ...(searchParam.dateStart   && { dateStart:   searchParam.dateStart }),
          ...(searchParam.dateEnd     && { dateEnd:     searchParam.dateEnd }),
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'memberNm,memberId,prodNm';
        }
        const res = await boApiSvc.odCart.getPage(params, '장바구니관리', '조회');
        const d = res.data?.data || {};
        carts.splice(0, carts.length, ...(d.pageList || []));
        pager.pageTotalCount = d.pageTotalCount || 0;
        pager.pageTotalPage  = d.pageTotalPage  || 1;
        const tp = pager.pageTotalPage;
        const cur = pager.pageNo;
        const from = Math.max(1, cur - 4);
        const to = Math.min(tp, from + 9);
        pager.pageNums = Array.from({ length: to - from + 1 }, (_, i) => from + i);
      } catch (err) {
        showToast(err.response?.data?.message || '조회 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    /* ── BoGrid selectable 연동 ── */
    /* isChecked — 여부 확인 */
    const isChecked = (id) => uiState.selectedIds.includes(id);
    const cfAllChecked = computed(() => carts.length > 0 && uiState.selectedIds.length === carts.length);

    /* fnGridRowStyle — 행 스타일 */
    const fnGridRowStyle = (r) => uiState.selectedIds.includes(r.cartId) ? 'background:#fff5f8;' : '';

    /* handleDelete — 삭제 */
    const handleDelete = async (cartId) => {
      const ok = await showConfirm('삭제', '장바구니 항목을 삭제하시겠습니까?');
      if (!ok) { return; }
      try {
        await window.boApi.delete(`/bo/ec/od/cart/${cartId}`, coUtil.cofApiHdr('장바구니관리', '삭제'));
        showToast('삭제되었습니다.', 'success');
        handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || '삭제 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    /* handleBulkDelete — 일괄 삭제 */
    const handleBulkDelete = async () => {
      if (!uiState.selectedIds.length) { showToast('삭제할 항목을 선택해주세요.', 'error'); return; }
      const ok = await showConfirm('일괄삭제', `선택한 ${uiState.selectedIds.length}건을 삭제하시겠습니까?`);
      if (!ok) { return; }
      try {
        await Promise.all(uiState.selectedIds.map(id =>
          window.boApi.delete(`/bo/ec/od/cart/${id}`, coUtil.cofApiHdr('장바구니관리', '일괄삭제'))
        ));
        showToast(`${uiState.selectedIds.length}건 삭제되었습니다.`, 'success');
        uiState.selectedIds = [];
        handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || '삭제 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    /* loadCodes — 공통코드 로드 */
    const loadCodes = async () => {
      try {
        const res = await coApiSvc.sySite.getList({}, '장바구니관리', '사이트목록');
        codes.sites = res.data?.data || [];
      } catch (_) {}
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.cart_date_types = codeStore.sgGetGrpCodes('CART_DATE_TYPE');
      } catch (_) {}
    };

    onMounted(() => { loadCodes(); handleSearchList(); });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'siteId', type: 'select', label: '사이트',
        options: () => codes.sites.map(s => ({ value: s.siteId, label: s.siteNm })),
        nullLabel: '전체' },
      { key: 'memberId', type: 'pick', label: '회원', nameKey: 'memberNm',
        display: (p) => p.memberNm || p.memberId, placeholder: '회원 선택', width: '160px',
        onOpen: () => handleBtnAction('memberPickModal-open'),
        onClear: () => handleBtnAction('memberPickModal-clear') },
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'memberNm', label: '회원명' },
          { value: 'memberId', label: '회원ID' },
          { value: 'prodId',   label: '상품ID' },
          { value: 'prodNm',   label: '상품명' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력', width: '180px' },
      { key: '_dateRange', type: 'dateRange', label: '기간',
        typeKey: 'dateType', startKey: 'dateStart', endKey: 'dateEnd',
        typeOptions: () => codes.cart_date_types,
        dateWidth: '136px' },
    ];

    /* ── BoGrid 컬럼 정의 ── */
    columns.listGrid = [
      { key: 'memberNm', label: '회원',   style: 'min-width:130px;',
        fmt: (v, row) => `${row.memberNm || '-'}  #${row.memberId || row.sessionKey || '-'}` },
      { key: 'prodNm',   label: '상품',   style: 'min-width:180px;',
        fmt: (v, row) => `${row.prodNm || '-'} #${row.prodId}` },
      { key: '_opt',     label: '옵션',   style: 'min-width:120px;',
        fmt: (v, row) => {
          const arr = [row.optNm1, row.optNm2].filter(Boolean);
          return arr.length ? arr.join(' / ') : '-';
        },
        cellInnerStyle: (v, row) => (row.optNm1 || row.optNm2) ? '' : 'color:#ccc;font-size:12px;' },
      { key: 'unitPrice',label: '단가',   style: 'width:90px;text-align:right;',
        align: 'right', fmt: (v) => fnPrice(v), cellStyle: 'font-size:13px;' },
      { key: 'orderQty', label: '수량',   style: 'width:50px;text-align:center;',
        align: 'center', cellStyle: 'font-weight:600;' },
      { key: 'itemPrice',label: '합계금액', style: 'width:100px;text-align:right;',
        align: 'right', fmt: (v) => fnPrice(v), cellStyle: 'font-weight:700;color:#111;' },
      { key: 'isChecked',label: '선택',   style: 'width:66px;text-align:center;',
        align: 'center', fmt: (v) => fnCheckedNm(v), badge: (row) => fnCheckedBadgeCls(row.isChecked) },
      { key: 'regDate',  label: '등록일시', style: 'width:130px;',
        fmt: (v) => fnDate(v), cellStyle: 'font-size:11px;color:#888;' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      carts, pager, searchParam, uiState, codes, memberPick,                   // 상태 / 데이터
      handleBtnAction, handleSelectAction, fnCallbackModal,                      // dispatch + 모달 통합 콜백
      cfAllChecked,                                                            // computed
      isChecked, fnGridRowStyle,                                               // 헬퍼
    };
  },
  template: `
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    장바구니관리
  </div>
  <!-- ===== ■. 검색 ====================================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card" style="margin-bottom:14px;">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" bar-style="flex-wrap:wrap;gap:8px 16px;"
      :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </div>
  <!-- ===== □.□. 검색 영역 ================================================= -->
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 목록 ====================================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">
        장바구니 목록
      </span>
      <span class="list-count">
        총 {{ pager.pageTotalCount.toLocaleString() }}건
      </span>
      <div style="margin-left:auto;">
        <button v-if="uiState.selectedIds.length" class="btn btn-danger btn-sm" @click="handleBtnAction('carts-bulkDelete')">
          🗑 선택삭제 ({{ uiState.selectedIds.length }})
        </button>
      </div>
    </div>
    <div v-if="uiState.loading" style="text-align:center;padding:48px;color:#bbb;">
      <div style="font-size:28px;margin-bottom:8px;">
        ⏳
      </div>
      조회 중...
    </div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid v-else bare selectable :columns="columns.listGrid" :rows="carts" row-key="cartId"
      :is-checked="isChecked" :all-checked="cfAllChecked" :row-style="fnGridRowStyle"
      empty-text="조회 결과가 없습니다."
      @toggle-check="id => handleSelectAction('carts-rowToggleCheck', id)"
      @toggle-check-all="handleSelectAction('carts-rowToggleCheckAll')" row-actions>
      <template #row-actions="{ row }">
        <button class="btn btn-danger btn-xs" @click="handleSelectAction('carts-rowDelete', row.cartId)">
          삭제
        </button>
      </template>
      <template #footer>
        <bo-pager v-if="pager.pageTotalCount > 0" :pager="pager" :on-set-page="n => handleBtnAction('carts-pager-setPage', n)" :on-size-change="() => handleSelectAction('carts-pager-sizeChange')" />
      </template>
    </bo-grid>
  </div>
  <!-- ===== □.□. 목록 영역 ================================================= -->
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 회원 선택 팝업 ================================================ -->
  <!-- ===== ■. 영역 ====================================================== -->
  <od-member-pick-modal :show="memberPick.open" ui-nm="장바구니관리"
    subtitle="장바구니를 조회할 회원을 선택해주세요" modal-name="member-pick" :on-callback="fnCallbackModal" />
</div>
<!-- ===== □. 영역 ====================================================== -->
`
};
