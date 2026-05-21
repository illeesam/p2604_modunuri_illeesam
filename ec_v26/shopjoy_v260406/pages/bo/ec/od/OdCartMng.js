/* ShopJoy Admin - 장바구니관리 목록 */
window.OdCartMng = {
  name: 'OdCartMng',
  props: {
    navigate:     { type: Function, required: true },                       // 페이지 이동
    showToast:    { type: Function, default: () => {} },                    // 토스트 알림
    showConfirm:  { type: Function, default: () => Promise.resolve(true) }, // 확인 모달
  },
  setup(props) {
    const { ref, reactive, onMounted } = Vue;
    const showToast   = window.boApp?.showToast   || props.showToast;
    const showConfirm = window.boApp?.showConfirm || props.showConfirm;

    /* ── 목록 상태 ── */
    const rows   = reactive([]);
    const pager  = reactive({ pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [10, 20, 50, 100] });
    const search = reactive({ siteId: '', memberId: '', memberNm: '', searchType: '', searchValue: '', dateType: 'reg_date', dateStart: '', dateEnd: '' });
    const uiState = reactive({ loading: false, selectedIds: [] });
    const codes = reactive({ sites: [], cart_date_types: [] });

    /* ── 회원 선택 팝업 (OdMemberPickModal 사용) ── */
    const memberPick = reactive({ open: false });
    const openMemberPick = () => { memberPick.open = true; };
    const onSelectMember = (m) => { search.memberId = m.memberId; search.memberNm = m.memberNm || m.loginId || m.memberId; };
    const onClearMember  = () => { search.memberId = ''; search.memberNm = ''; };

    /* ── 표시 함수 ── */
    const fnCheckedBadge = (v) => v === 'Y' ? 'badge badge-green' : 'badge badge-gray';

    /* 장바구니 fnCheckedBadgeCls (BoGrid badge 컬럼용 bare class) */
    const fnCheckedBadgeCls = (v) => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* 장바구니 fnCheckedNm */
    const fnCheckedNm    = (v) => v === 'Y' ? '선택' : '미선택';

    /* 장바구니 fnPrice */
    const fnPrice        = (v) => v != null ? Number(v).toLocaleString() + '원' : '-';

    /* 장바구니 fnDate */
    const fnDate         = (v) => v ? String(v).substring(0, 16).replace('T', ' ') : '-';

    /* 장바구니 fnAvatar */
    const fnAvatar       = (nm) => nm ? nm.charAt(0) : '?';

    /* ── 목록 조회 ── */
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...(search.siteId    && { siteId:    search.siteId }),
          ...(search.memberId  && { memberId:  search.memberId }),
          ...(search.searchType && { searchType: search.searchType }),
          ...(search.searchValue && { searchValue: search.searchValue }),
          ...(search.dateType    && { dateType:    search.dateType }),
          ...(search.dateStart   && { dateStart:   search.dateStart }),
          ...(search.dateEnd     && { dateEnd:     search.dateEnd }),
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'memberNm,memberId,prodNm';
        }
        const res = await boApiSvc.odCart.getPage(params, '장바구니관리', '조회');
        const d = res.data?.data || {};
        rows.splice(0, rows.length, ...(d.pageList || []));
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

    /* 장바구니 목록조회 */
    const onSearch    = () => {
      if ((search.dateStart || search.dateEnd) && !search.dateType) {
        showToast('기간 검색 시 기간유형을 선택해주세요.', 'error');
        return;
      }
      pager.pageNo = 1; handleSearchList();
    };

    /* 장바구니 onReset */
    const onReset     = () => {
      search.siteId = ''; search.memberId = ''; search.memberNm = '';
      search.searchType = ''; search.searchValue = '';
      search.dateType = 'reg_date'; search.dateStart = ''; search.dateEnd = '';
      onSearch();
    };

    /* 장바구니 setPage / onSizeChange (bo-pager 연동) */
    const setPage = (no) => { if (no >= 1 && no <= pager.pageTotalPage) { pager.pageNo = no; handleSearchList(); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList(); };

    /* ── BoGrid selectable 연동 ── */
    const Vue3 = Vue;
    const isChecked = (id) => uiState.selectedIds.includes(id);
    const cfAllChecked = Vue3.computed(() =>
      rows.length > 0 && uiState.selectedIds.length === rows.length);
    const toggleCheck = (id) => {
      const idx = uiState.selectedIds.indexOf(id);
      if (idx >= 0) uiState.selectedIds.splice(idx, 1);
      else uiState.selectedIds.push(id);
    };
    const toggleCheckAll = () => {
      uiState.selectedIds = cfAllChecked.value ? [] : rows.map(r => r.cartId);
    };
    const fnGridRowStyle = (r) =>
      uiState.selectedIds.includes(r.cartId) ? 'background:#fff5f8;' : '';

    const baseSearchColumns = [
      { type: 'label', label: '사이트' },
      { key: 'siteId', type: 'select',
        options: () => codes.sites.map(s => ({ value: s.siteId, label: s.siteNm })),
        nullLabel: '전체' },
      { type: 'label', label: '회원' },
      { key: 'memberId', type: 'pick', nameKey: 'memberNm',
        display: (p) => p.memberNm || p.memberId, placeholder: '회원 선택', width: '160px',
        onOpen: () => openMemberPick(), onClear: () => onClearMember() },
      { type: 'label', label: '검색' },
      { key: 'searchType', type: 'multiCheck',
        options: [
          { value: 'memberNm', label: '회원명' },
          { value: 'memberId', label: '회원ID' },
          { value: 'prodId',   label: '상품ID' },
          { value: 'prodNm',   label: '상품명' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', placeholder: '검색어 입력', width: '180px' },
      { type: 'label', label: '기간' },
      { key: '_dateRange', type: 'dateRange',
        typeKey: 'dateType', startKey: 'dateStart', endKey: 'dateEnd',
        typeOptions: () => codes.cart_date_types,
        dateWidth: '136px' },
    ];

    /* ── BoGrid 컬럼 정의 ── */
    const listGridColumns = [
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

    /* 회원선택 그리드 컬럼은 OdMemberPickModal 내장 */

    /* ── 삭제 ── */
    const handleDelete = async (cartId) => {
      const ok = await showConfirm('삭제', '장바구니 항목을 삭제하시겠습니까?');
      if (!ok) return;
      try {
        await window.boApi.delete(`/bo/ec/od/cart/${cartId}`, coUtil.cofApiHdr('장바구니관리', '삭제'));
        showToast('삭제되었습니다.', 'success');
        handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || '삭제 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    /* 장바구니 handleBulkDelete */
    const handleBulkDelete = async () => {
      if (!uiState.selectedIds.length) { showToast('삭제할 항목을 선택해주세요.', 'error'); return; }
      const ok = await showConfirm('일괄삭제', `선택한 ${uiState.selectedIds.length}건을 삭제하시겠습니까?`);
      if (!ok) return;
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

    /* ── 초기 로드 ── */
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

    return {
      rows, pager, search, uiState, codes,
      memberPick, openMemberPick, onSelectMember, onClearMember,
      fnCheckedBadge, fnCheckedNm, fnPrice, fnDate, fnAvatar,
      onSearch, onReset, setPage, onSizeChange,
      baseSearchColumns, listGridColumns, isChecked, cfAllChecked, toggleCheck, toggleCheckAll, fnGridRowStyle,
      handleDelete, handleBulkDelete,
    };
  },
  template: `
<div>
  <div class="page-title">장바구니관리</div>

  <!-- 검색 -->
  <div class="card" style="margin-bottom:14px;">
    <bo-search-area :loading="uiState.loading" bar-style="flex-wrap:wrap;gap:8px 16px;"
      :columns="baseSearchColumns" :param="search"
      @search="onSearch" @reset="onReset" />
  </div>

  <!-- 목록 -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">장바구니 목록</span>
      <span class="list-count">총 {{ pager.pageTotalCount.toLocaleString() }}건</span>
      <div style="margin-left:auto;">
        <button v-if="uiState.selectedIds.length" class="btn btn-danger btn-sm" @click="handleBulkDelete">
          🗑 선택삭제 ({{ uiState.selectedIds.length }})
        </button>
      </div>
    </div>

    <div v-if="uiState.loading" style="text-align:center;padding:48px;color:#bbb;">
      <div style="font-size:28px;margin-bottom:8px;">⏳</div>조회 중...
    </div>
    <bo-grid v-else bare selectable :columns="listGridColumns" :rows="rows" :pager="pager" row-key="cartId"
      :is-checked="isChecked" :all-checked="cfAllChecked" :row-style="fnGridRowStyle"
      empty-text="조회 결과가 없습니다."
      @toggle-check="toggleCheck" @toggle-check-all="toggleCheckAll" row-actions>
      <template #row-actions="{ row }">
        <button class="btn btn-danger btn-xs" @click="handleDelete(row.cartId)">삭제</button>
      </template>
    </bo-grid>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>

  <!-- 회원 선택 팝업 -->
  <od-member-pick-modal :show="memberPick.open" ui-nm="장바구니관리"
    subtitle="장바구니를 조회할 회원을 선택해주세요"
    @select="onSelectMember" @close="memberPick.open=false" />
</div>`
};
