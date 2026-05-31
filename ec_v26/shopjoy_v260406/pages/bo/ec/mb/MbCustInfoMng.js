/* ShopJoy Admin - 고객종합정보 (고객센터 상담용 통합 조회) */
(function () {
  const { ref, reactive, computed, watch, onMounted } = Vue;

  const SEARCH_MODES = [
    { id: 'member', label: '고객 검색' },
    { id: 'order',  label: '주문번호' },
    { id: 'claim',  label: '클레임번호' },
  ];

  const PERIOD_OPTS = [
    { id: '1m',     label: '1개월' },
    { id: '3m',     label: '3개월' },
    { id: '6m',     label: '6개월' },
    { id: '1y',     label: '1년',  default: true },
    { id: 'all',    label: '전체' },
    { id: 'custom', label: '직접입력' },
  ];

  /* fnBadgeCls — 상태 배지 클래스 */
  const fnBadgeCls = (status) => {
    const map = {
      '활성': 'badge-green', '판매중': 'badge-green', '진행중': 'badge-blue', '처리중': 'badge-blue',
      '완료': 'badge-gray', '종료': 'badge-gray', '배송완료': 'badge-gray', '교환완료': 'badge-gray', '환불완료': 'badge-gray', '취소완료': 'badge-gray', '답변완료': 'badge-gray',
      '취소됨': 'badge-red', '정지': 'badge-red', '품절': 'badge-red', '만료': 'badge-red', '실패': 'badge-red',
      '배송중': 'badge-orange', '배송준비중': 'badge-orange', '결제완료': 'badge-orange', '취소처리중': 'badge-orange', '수거예정': 'badge-orange', '수거완료': 'badge-orange', '환불처리중': 'badge-orange',
      '주문완료': 'badge-blue', '취소요청': 'badge-orange', '반품요청': 'badge-orange', '교환요청': 'badge-orange',
      '요청': 'badge-orange', '예정': 'badge-purple', '발송완료': 'badge-green', '성공': 'badge-green',
    };
    return map[status] || 'badge-gray';
  };

  /* fnChannelCls — 채널 배지 클래스 */
  const fnChannelCls = ch => ({ 'SMS': 'badge-orange', '이메일': 'badge-blue', '카카오': 'badge-purple' }[ch] || 'badge-gray');

  /* fnFmtPrice — 금액 포맷 */
  const fnFmtPrice = v => v != null ? Number(v).toLocaleString() + '원' : '-';

  /* dateStr — 날짜 문자열(YYYY-MM-DD...) → YYYY-MM-DD 추출 */
  const dateStr = v => v ? String(v).slice(0, 10) : '';

  /* today — 오늘 YYYY-MM-DD */
  const today = () => new Date().toISOString().slice(0, 10);

  /* calcFrom — 기간 옵션 → from 날짜 문자열 */
  const calcFrom = (period, customFrom) => {
    if (period === 'all') { return ''; }
    if (period === 'custom') { return customFrom; }
    const d = new Date();
    if (period === '1m') { d.setMonth(d.getMonth() - 1); }
    else if (period === '3m') { d.setMonth(d.getMonth() - 3); }
    else if (period === '6m') { d.setMonth(d.getMonth() - 6); }
    else if (period === '1y') { d.setFullYear(d.getFullYear() - 1); }
    return d.toISOString().slice(0, 10);
  };

  /* inRange — dateFrom~dateTo 필터 */
  const inRange = (dateVal, from, to) => {
    const d = dateStr(dateVal);
    if (!d) { return false; }
    if (from && d < from) { return false; }
    if (to   && d > to) { return false; }
    return true;
  };

  window._mbCustInfoState = window._mbCustInfoState || { tab: 'orders', tabMode: '3col' };
  window.MbCustInfoMng = {
    name: 'MbCustInfoMng',
    props: {
      navigate:     { type: Function, required: true }, // 페이지 이동
    },
    setup(props) {
      /* ##### [01] 초기 변수 정의 ################################################## */
      const { reactive, ref, computed, watch, onMounted } = Vue;
      const showRefModal = window.boApp.showRefModal; // 참조 모달

      const custInfos    = reactive([]);             // 고객종합정보 목록
      const uiState = reactive({                     // UI 상태 (탭/뷰모드 영속화 별도)
        loading: false, error: null, isPageCodeLoad: false,
        customer: null, searchMode: 'member', searchInput: '',
        tab: window._mbCustInfoState.tab || 'orders',
        tabMode2: window._mbCustInfoState.tabMode || '3col',
      });

      const members     = reactive([]);              // 회원 목록 (모달 picker용)
      const orders      = reactive([]);              // 주문 데이터
      const claims      = reactive([]);              // 클레임 데이터
      const deliveries  = reactive([]);              // 배송 데이터
      const caches   = reactive([]);              // 캐쉬 데이터
      const contacts    = reactive([]);              // 문의 데이터
      const chats       = reactive([]);              // 채팅 데이터
      const loginHistories = reactive([]);             // 로그인 이력
      const couponUsages  = reactive([]);             // 쿠폰 사용 이력
      const sendHistories  = reactive([]);             // 발송 이력
      const codes = reactive({                       // 공통코드
        member_statuses: [],
        member_grades: [],
      });

      /* ===== 검색조건 (기간 필터) ===== */
      const searchParam    = reactive({ period: '1y', customFrom: '', customTo: today() });
      const searchParamOrg = reactive({ period: '1y', customFrom: '', customTo: today() });

      /* ===== 페이저 (탭별 + 모달) ===== */
      const PAGE_SIZE = 10;
      const _newPager = () => reactive({ pageNo: 1, pageSize: PAGE_SIZE, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [5, 10, 20, 30, 50, 100, 200, 500] });
      const ordersPager   = _newPager();
      const claimsPager   = _newPager();
      const dlivPager     = _newPager();
      const cachePager    = _newPager();
      const contactsPager = _newPager();
      const chatsPager    = _newPager();
      const loginPager    = _newPager();
      const couponPager   = _newPager();
      const sendPager     = _newPager();
      const modalPager    = _newPager();

      /* ===== 고객 검색 모달 ===== */
      const memberModal = reactive({ show: false, searchType: '', keyword: '', list: [] }); // 고객 검색 모달

      /* ##### [02] 액션 모음 (dispatch) ############################################## */
      /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
      const handleBtnAction = (cmd, param = {}) => {
        console.log(' ■■ MbCustInfoMng.js : handleBtnAction -> ', cmd, param);
        // 검색조건으로 조회 (기간/번호)
        if (cmd === 'searchParam-list') {
          return onSearch();
        // 선택된 고객 초기화
        } else if (cmd === 'searchParam-clearCustomer') {
          return clearCustomer();
        // 검색 모드 변경 (고객/주문/클레임)
        } else if (cmd === 'searchParam-mode') {
          uiState.searchMode = param;
          uiState.searchInput = '';
          return;
        // 기간 옵션 변경
        } else if (cmd === 'searchParam-period') {
          searchParam.period = param;
          return;
        // 고객 검색 모달 열기
        } else if (cmd === 'memberModal-open') {
          return openMemberModal();
        // 고객 검색 모달 닫기
        } else if (cmd === 'memberModal-close') {
          memberModal.show = false;
          return;
        // 고객 검색 모달 내 검색 실행
        } else if (cmd === 'memberModal-search') {
          return searchMemberModal();
        } else {
          console.warn('[handleBtnAction] unknown cmd:', cmd);
        }
      };

      /* handleSelectAction — 그리드 행/탭/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
      const handleSelectAction = (cmd, param = {}) => {
        console.log(' ■■ MbCustInfoMng.js : handleSelectAction -> ', cmd, param);
        // 탭 전환
        if (cmd === 'tab-select') {
          uiState.tab = param;
          return;
        // 뷰모드 변경
        } else if (cmd === 'tab-mode') {
          uiState.tabMode2 = param;
          return;
        // 고객 모달에서 회원 선택
        } else if (cmd === 'memberModal-pick') {
          return selectMember(param);
        // ref-link 클릭 (주문/클레임/쿠폰)
        } else if (cmd === 'row-ref') {
          return showRefModal(param.type, param.id);
        } else {
          console.warn('[handleSelectAction] unknown cmd:', cmd);
        }
      };

      /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

      /* ===== 영역별 메타 정의 (api / dateType / pager / rows / dateField) ===== */
      const HIST_META = {
        orders:   { api: boApiSvc.odOrder,        dateType: 'order_date',   pager: ordersPager,   rows: orders,         label: '주문조회' },
        claims:   { api: boApiSvc.odClaim,        dateType: 'request_date', pager: claimsPager,   rows: claims,         label: '클레임조회' },
        dliv:     { api: boApiSvc.odDliv,         dateType: 'reg_date',     pager: dlivPager,     rows: deliveries,     label: '배송조회' },
        cache:    { api: boApiSvc.pmCache,        dateType: 'reg_date',     pager: cachePager,    rows: caches,         label: '캐쉬조회' },
        contacts: { api: boApiSvc.syContact,      dateType: 'reg_date',     pager: contactsPager, rows: contacts,       label: '문의조회' },
        chats:    { api: boApiSvc.cmChatt,        dateType: 'reg_date',     pager: chatsPager,    rows: chats,          label: '채팅조회' },
        login:    { api: boApiSvc.syUserLoginLog, dateType: 'reg_date',     pager: loginPager,    rows: loginHistories, label: '로그인조회' },
        coupon:   { api: boApiSvc.pmCouponUsage,  dateType: 'reg_date',     pager: couponPager,   rows: couponUsages,   label: '쿠폰조회' },
        send:     { api: boApiSvc.syAlarm,        dateType: 'reg_date',     pager: sendPager,     rows: sendHistories,  label: '발송조회' },
      };

      /* fnPagerOf — which → pager 객체 */
      const fnPagerOf = (which) => HIST_META[which]?.pager || (which === 'modal' ? modalPager : null);

      /* fnDateParams — 기간 검색 파라미터 (period='all' 면 미전달) */
      const fnDateParams = (dateType) => {
        const from = calcFrom(searchParam.period, searchParam.customFrom);
        if (!from) return {};
        const to = searchParam.period === 'custom' ? searchParam.customTo : today();
        return { dateType, dateStart: from, dateEnd: to };
      };

      /* fnLoadHist — 단일 영역 서버사이드 페이지 조회 */
      const fnLoadHist = async (which) => {
        if (!uiState.customer) { return; }
        const meta = HIST_META[which];
        if (!meta) { return; }
        try {
          const params = {
            pageNo: meta.pager.pageNo, pageSize: meta.pager.pageSize,
            userId: uiState.customer.userId,
            ...fnDateParams(meta.dateType),
          };
          const res = await meta.api.getPage(params, '고객종합정보', meta.label);
          const d = res.data?.data || {};
          const list = d.pageList || d.list || [];
          meta.rows.splice(0, meta.rows.length, ...list);
          meta.pager.pageTotalCount = d.pageTotalCount || list.length;
          meta.pager.pageTotalPage  = d.pageTotalPage  || Math.max(1, Math.ceil(meta.pager.pageTotalCount / meta.pager.pageSize));
          const c = meta.pager.pageNo, l = meta.pager.pageTotalPage, s = Math.max(1, c - 2), e = Math.min(l, s + 4);
          meta.pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
        } catch (err) {
          console.error('[fnLoadHist:' + which + ']', err);
        }
      };

      /* handleSearchData — 고객 선택 후 9개 영역 동시 조회 (각 영역 페이지 1) */
      const handleSearchData = async () => {
        if (!uiState.customer) { return; }
        uiState.loading = true;
        try {
          // 각 영역 페이지 1 로 초기화 후 병렬 조회
          Object.values(HIST_META).forEach(m => { m.pager.pageNo = 1; });
          await Promise.all(Object.keys(HIST_META).map(fnLoadHist));
          // 고객종합정보 (캐쉬 잔액용)
          try {
            const resCust = await boApiSvc.mbCustInfo.getPage({ pageNo: 1, pageSize: 1, userId: uiState.customer.userId }, '고객종합정보', '조회');
            custInfos.splice(0, custInfos.length, ...(resCust.data?.data?.pageList || []));
          } catch (_) { /* ignore */ }
          uiState.error = null;
        } catch (err) {
          console.error('[catch-info]', err);
          uiState.error = err.message;
        } finally {
          uiState.loading = false;
        }
      };

      /* onSearch — 검색 (선택 고객 있으면 9개 영역 재조회) */
      const onSearch = async () => {
        if (uiState.customer) { await handleSearchData(); }
        else { await loadMembersForModal(); }
      };

      /* loadMembersForModal — 모달용 회원 전체 로드 (별도 화면, picker 용도) */
      const loadMembersForModal = async () => {
        try {
          const r = await boApiSvc.mbMember.getPage({ pageNo: 1, pageSize: 10000 }, '고객종합정보', '회원조회');
          members.splice(0, members.length, ...(r.data?.data?.pageList || r.data?.data?.list || []));
        } catch (e) { console.error('[loadMembersForModal]', e); }
      };

      /* clearCustomer — 선택 고객 초기화 */
      const clearCustomer = () => {
        uiState.customer = null; uiState.searchInput = '';
        // 9개 영역 데이터 비움
        Object.values(HIST_META).forEach(m => { m.rows.splice(0, m.rows.length); m.pager.pageTotalCount = 0; });
      };

      /* openMemberModal — 고객 검색 모달 열기 (회원 목록 picker) */
      const openMemberModal = async () => {
        memberModal.keyword = '';
        await loadMembersForModal();
        memberModal.list = [...members];
        memberModal.show = true;
      };

      /* searchMemberModal — 모달 내 검색 실행 */
      const searchMemberModal = () => {
        const searchVal = memberModal.keyword.trim().toLowerCase();
        const types = memberModal.searchType || 'memberNm,email,phone';
        memberModal.list = searchVal
          ? members.filter(m => {
              const hits = [];
              if (types.includes('memberNm')) { hits.push((m.memberNm || '').includes(searchVal)); }
              if (types.includes('email')) { hits.push((m.email || '').toLowerCase().includes(searchVal)); }
              if (types.includes('phone')) { hits.push((m.phone || '').includes(searchVal)); }
              return hits.some(Boolean);
            })
          : [...members];
      };

      /* selectMember — 회원 선택 (모달에서) */
      const selectMember = (m) => {
        uiState.customer = m;
        memberModal.show = false;
        uiState.searchInput = '';
      };

      /* fnLoadCodes — 공통코드 로드 */
      const fnLoadCodes = () => {
        const codeStore = window.sfGetBoCodeStore();
        try {
          codes.member_statuses = codeStore.sgGetGrpCodes('MEMBER_STATUS');
          codes.member_grades = codeStore.sgGetGrpCodes('MEMBER_GRADE');
          uiState.isPageCodeLoad = true;
        } catch (err) {
          console.error('[fnLoadCodes]', err);
        }
      };
      const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

      // ★ onMounted — 진입 시 코드 로드 + 회원 목록 (picker 용)
      onMounted(async () => {
        if (isAppReady.value) { fnLoadCodes(); }
        Object.assign(searchParamOrg, searchParam);
        // 진입 시 회원 목록만 로드 (고객 선택 모달 picker 용). 9개 영역은 고객 선택 후 조회.
        await loadMembersForModal();
      });

      /* watch — 고객 선택 시 9개 영역 서버 조회 */
      watch(() => uiState.customer?.userId, async (uid) => {
        if (uid) { await handleSearchData(); }
        else { Object.values(HIST_META).forEach(m => { m.rows.splice(0, m.rows.length); m.pager.pageTotalCount = 0; }); }
      });

      /* watch — 탭/뷰모드 변경 시 window 영속화 */
      watch(() => uiState.tab,      v => { window._mbCustInfoState.tab     = v; });
      watch(() => uiState.tabMode2, v => { window._mbCustInfoState.tabMode = v; });

      /* watch — period 변경 시 custom 초기값 세팅 */
      watch(() => searchParam.period, v => {
        if (v === 'custom') {
          const d = new Date(); d.setFullYear(d.getFullYear() - 1);
          searchParam.customFrom = d.toISOString().slice(0, 10);
          searchParam.customTo   = today();
        }
      });

      /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
      const cfDateFrom = computed(() => calcFrom(searchParam.period, searchParam.customFrom));
      const cfDateTo   = computed(() => searchParam.period === 'custom' ? searchParam.customTo : today());

      /* showTab — 탭 표시 여부 */
      const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;

      /* tabs — 탭 정의 (BoTabBar 데이터). 카운트는 각 영역 pager.pageTotalCount (서버 응답) */
      const tabs = reactive([
        { id: 'orders',   label: '주문이력',  icon: '🛒', get count() { return ordersPager.pageTotalCount; } },
        { id: 'claims',   label: '클레임이력', icon: '↩',  get count() { return claimsPager.pageTotalCount; } },
        { id: 'dliv',     label: '배송이력',  icon: '🚚', get count() { return dlivPager.pageTotalCount; } },
        { id: 'cache',    label: '캐쉬내역',  icon: '💰', get count() { return cachePager.pageTotalCount; } },
        { id: 'contacts', label: '문의이력',  icon: '📋', get count() { return contactsPager.pageTotalCount; } },
        { id: 'chats',    label: '채팅이력',  icon: '💬', get count() { return chatsPager.pageTotalCount; } },
        { id: 'login',    label: '로그인',    icon: '🔐', get count() { return loginPager.pageTotalCount; } },
        { id: 'coupon',   label: '쿠폰',      icon: '🎟', get count() { return couponPager.pageTotalCount; } },
        { id: 'send',     label: '발송',      icon: '📨', get count() { return sendPager.pageTotalCount; } },
      ]);

      /* cfCustCacheBalance — 캐쉬 잔액 (현 페이지 마지막 행 기준 — 서버에서 정렬되어 옴) */
      const cfCustCacheBalance = computed(() => {
        if (!uiState.customer || !caches.length) { return 0; }
        return caches.slice().sort((a, b) => a.cacheId - b.cacheId).at(-1)?.balance ?? 0;
      });

      /* onSetPage / onSizeChange — 그리드 페이저 콜백 (서버사이드: 해당 영역만 재조회) */
      const onSetPage = (which, n) => {
        const p = fnPagerOf(which); if (!p || n < 1 || n > p.pageTotalPage) { return; }
        p.pageNo = n;
        if (which === 'modal') { fnRebuildModalPager(); return; }
        fnLoadHist(which);
      };
      const onSizeChange = (which) => {
        const p = fnPagerOf(which); if (!p) { return; }
        p.pageNo = 1;
        if (which === 'modal') { fnRebuildModalPager(); return; }
        fnLoadHist(which);
      };

      /* fnRebuildModalPager — 모달은 클라이언트 picker 라 슬라이싱 유지 (모달 검색 결과 표시용) */
      const fnRebuildModalPager = () => {
        const list = memberModal.list || [];
        modalPager.pageTotalCount = list.length;
        modalPager.pageTotalPage = Math.max(1, Math.ceil(list.length / modalPager.pageSize));
        if (modalPager.pageNo > modalPager.pageTotalPage) modalPager.pageNo = modalPager.pageTotalPage;
        const c = modalPager.pageNo, l = modalPager.pageTotalPage, s = Math.max(1, c - 2), e = Math.min(l, s + 4);
        modalPager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
      };
      const cfPageModalList = computed(() => {
        fnRebuildModalPager();
        const list = memberModal.list || [];
        return list.slice((modalPager.pageNo - 1) * modalPager.pageSize, modalPager.pageNo * modalPager.pageSize);
      });

      /* _ellipsis — 말줄임 스타일 */
      const _ellipsis = (maxw, extra) => 'max-width:' + maxw + 'px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' + (extra || '');

      // 주문 그리드
      const orderGridColumns = [
        { key: 'orderId', label: '주문번호', refLink: 'order' },
        { key: 'orderDate', label: '일시', style: 'white-space:nowrap;', cellStyle: 'color:#888;white-space:nowrap;' },
        { key: 'prodNm', label: '상품명', cellStyle: _ellipsis(150), cellTitle: true },
        { key: 'totalPrice', label: '금액', style: 'text-align:right;', align: 'right', cellStyle: 'font-weight:600;', fmt: (v) => fnFmtPrice(v) },
        { key: 'status', label: '상태', badge: (row) => fnBadgeCls(row.status) },
      ];
      // 클레임 그리드
      const claimGridColumns = [
        { key: 'claimId', label: '클레임번호', refLink: 'claim' },
        { key: 'type', label: '유형' },
        { key: 'prodNm', label: '상품명', cellStyle: _ellipsis(130), cellTitle: true },
        { key: 'status', label: '상태', badge: (row) => fnBadgeCls(row.status) },
        { key: 'requestDate', label: '신청일', style: 'white-space:nowrap;', fmt: (v) => (v ? v.slice(0, 10) : '') },
      ];
      // 배송 그리드
      const dlivGridColumns = [
        { key: 'dlivId', label: '배송번호', cellStyle: 'font-weight:500;' },
        { key: 'orderId', label: '주문번호' },
        { key: 'courier', label: '택배사', fmt: (v) => v || '-' },
        { key: 'trackingNo', label: '운송장번호', cellStyle: 'color:#888;', fmt: (v) => v || '-' },
        { key: 'status', label: '상태', badge: (row) => fnBadgeCls(row.status) },
      ];
      // 캐쉬 그리드
      const cacheGridColumns = [
        { key: 'date', label: '일시', style: 'white-space:nowrap;', cellStyle: 'color:#888;white-space:nowrap;' },
        { key: 'type', label: '구분', badge: (row) => (row.type === '충전' ? 'badge-blue' : 'badge-orange') },
        { key: 'amount', label: '금액', style: 'text-align:right;', align: 'right', cellStyle: (v, row) => 'font-weight:600;' + (row.amount > 0 ? 'color:#1565c0;' : 'color:#c62828;'), fmt: (v, row) => (row.amount > 0 ? '+' : '') + row.amount.toLocaleString() + '원' },
        { key: 'balance', label: '잔액', style: 'text-align:right;', align: 'right', cellStyle: 'color:#555;', fmt: (v) => fnFmtPrice(v) },
        { key: 'desc', label: '사유', cellStyle: _ellipsis(150, 'color:#666;'), cellTitle: true },
      ];
      // 문의 그리드
      const contactGridColumns = [
        { key: 'date', label: '접수일', style: 'white-space:nowrap;', cellStyle: 'color:#888;white-space:nowrap;', fmt: (v) => (v ? v.slice(0, 10) : '') },
        { key: 'category', label: '분류', cellStyle: 'white-space:nowrap;' },
        { key: 'title', label: '제목', cellStyle: _ellipsis(200), cellTitle: true },
        { key: 'status', label: '상태', badge: (row) => fnBadgeCls(row.status) },
      ];
      // 채팅 그리드
      const chatGridColumns = [
        { key: 'date', label: '일시', style: 'white-space:nowrap;', cellStyle: 'color:#888;white-space:nowrap;', fmt: (v) => (v ? v.slice(0, 10) : '') },
        { key: 'subject', label: '제목', cellStyle: _ellipsis(130), cellTitle: true },
        { key: 'lastMsg', label: '마지막 메시지', cellStyle: _ellipsis(180, 'color:#666;'), cellTitle: true },
        { key: 'status', label: '상태', badge: (row) => fnBadgeCls(row.status) },
      ];
      // 로그인 그리드
      const loginGridColumns = [
        { key: 'loginDate', label: '일시', style: 'white-space:nowrap;', cellStyle: 'color:#888;white-space:nowrap;' },
        { key: 'ip', label: 'IP', cellStyle: 'color:#666;font-family:monospace;' },
        { key: 'device', label: '기기/브라우저', cellStyle: 'color:#555;' },
        { key: 'result', label: '결과', badge: (row) => fnBadgeCls(row.result) },
      ];
      // 쿠폰 그리드
      const couponGridColumns = [
        { key: 'usedDate', label: '사용일', style: 'white-space:nowrap;', cellStyle: 'color:#888;white-space:nowrap;' },
        { key: 'couponNm', label: '쿠폰명', cellStyle: _ellipsis(150), cellTitle: true },
        { key: 'couponCode', label: '코드', cellStyle: 'font-family:monospace;color:#666;' },
        { key: 'orderId', label: '주문번호', refLink: 'order' },
        { key: 'discountAmt', label: '할인금액', style: 'text-align:right;', align: 'right', cellStyle: 'font-weight:600;color:#e91e63;', fmt: (v, row) => '-' + (row.discountAmt || 0).toLocaleString() + '원' },
      ];
      // 발송 그리드
      const sendGridColumns = [
        { key: 'sendDate', label: '발송일시', style: 'white-space:nowrap;', cellStyle: 'color:#888;white-space:nowrap;' },
        { key: 'channelCd', label: '채널', badge: (row) => fnChannelCls(row.channelCd) },
        { key: 'title', label: '제목/내용', cellStyle: _ellipsis(220, 'color:#333;'), cellTitle: true },
        { key: 'statusCd', label: '결과', badge: (row) => fnBadgeCls(row.statusCd) },
      ];
      // 회원 선택 모달 그리드
      const memberModalGridColumns = [
        { key: 'userId', label: 'ID', style: 'width:50px;text-align:center;', align: 'center', cellStyle: 'color:#aaa;' },
        { key: 'memberNm', label: '이름', style: 'width:90px;', cellStyle: 'font-weight:600;color:#1a1a2e;' },
        { key: 'email', label: '이메일', cellStyle: 'color:#555;' },
        { key: 'phone', label: '전화', style: 'width:130px;', cellStyle: 'color:#666;font-family:monospace;', fmt: (v) => v || '-' },
        { key: 'grade', label: '등급', style: 'width:60px;text-align:center;', align: 'center', badge: (row) => (row.grade === 'VIP' ? 'badge-purple' : row.grade === '우수' ? 'badge-blue' : 'badge-gray') },
        { key: 'status', label: '상태', style: 'width:60px;text-align:center;', align: 'center', badge: (row) => (row.status === '활성' ? 'badge-green' : 'badge-red') },
      ];

      /* periodSearchColumns — 기간 필터 BoSearchArea 컬럼 */
      const periodSearchColumns = [
        { key: 'period',     type: 'slot', name: 'period', label: '조회기간' },
        { key: 'customFrom', type: 'date', label: '시작일', visible: (p) => p.period === 'custom' },
        { key: 'customTo',   type: 'date', label: '종료일', visible: (p) => p.period === 'custom' },
      ];

      /* memberModalSearchColumns — 고객 검색 모달 BoSearchArea 컬럼 */
      const memberModalSearchColumns = [
        { key: 'searchType', type: 'multiCheck',
          options: [
            { value: 'memberNm', label: '이름' },
            { value: 'email',    label: '이메일' },
            { value: 'phone',    label: '전화번호' },
          ],
          placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
        { key: 'keyword', type: 'text', placeholder: '검색어 입력' },
      ];

      /* ##### [06] return (템플릿 노출) ############################################## */
      return {
        uiState, codes, searchParam, memberModal,                                                                                   // 상태 / 데이터
        orders, claims, deliveries, caches, contacts, chats, loginHistories, couponUsages, sendHistories,                           // 9개 이력 데이터 (서버사이드 페이지별)
        SEARCH_MODES, PERIOD_OPTS,                                                                                                  // 정적 옵션
        orderGridColumns, claimGridColumns, dlivGridColumns, cacheGridColumns, contactGridColumns, chatGridColumns,                 // 컬럼 정의
        loginGridColumns, couponGridColumns, sendGridColumns, memberModalGridColumns,
        periodSearchColumns, memberModalSearchColumns,                                                                              // BoSearchArea 컬럼
        ordersPager, claimsPager, dlivPager, cachePager, contactsPager, chatsPager, loginPager, couponPager, sendPager, modalPager, // 페이저
        cfPageModalList,                                                                                                            // 모달용 클라이언트 슬라이스 (picker)
        onSetPage, onSizeChange,                                                                                                    // BoGrid pager 콜백
        handleBtnAction, handleSelectAction,                                                                                        // dispatch (모든 이벤트 / 액션 라우팅)
        cfDateFrom, cfDateTo, cfCustCacheBalance, tabs,                                                                             // computed
        showTab, fnFmtPrice,                                                                                                        // 헬퍼
      };
    },

    template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-header">
    <h2 class="page-title">
      고객종합정보
    </h2>
  </div>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 검색 바 ==================================================== -->
  <div style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;padding:14px 20px;margin-bottom:10px;box-shadow:0 1px 4px rgba(0,0,0,.05);display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
    <!-- ===== ■.■. 모드 세그먼트 =============================================== -->
    <div style="display:flex;background:#f0f2f5;border-radius:8px;padding:3px;gap:2px;flex-shrink:0;">
      <button v-for="m in SEARCH_MODES" :key="m?.id"
        @click="handleBtnAction('searchParam-mode', m.id)"
        :style="uiState.searchMode===m.id
        ? 'background:#1976d2;color:#fff;border:none;border-radius:6px;padding:6px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;'
        : 'background:transparent;color:#666;border:none;border-radius:6px;padding:6px 16px;font-size:13px;cursor:pointer;transition:all .15s;'">
        {{ m.label }}
      </button>
    </div>
    <!-- ===== □.■. 모드 세그먼트 =============================================== -->
    <!-- ===== ■.■. 고객 선택 ================================================= -->
    <template v-if="uiState.searchMode==='member'">
      <button @click="handleBtnAction('memberModal-open')"
        style="display:flex;align-items:center;gap:6px;background:#fff;border:1.5px solid #1976d2;color:#1976d2;border-radius:8px;padding:7px 18px;font-size:13px;font-weight:600;cursor:pointer;">
        🔍 고객 선택
      </button>
      <span style="font-size:12px;color:#aaa;">
        이름 · 이메일 · 전화번호로 검색
      </span>
    </template>
    <!-- ===== □.■. 고객 선택 ================================================= -->
    <!-- ===== ■.■. 번호 입력 ================================================= -->
    <template v-else>
      <div style="display:flex;align-items:center;gap:0;background:#f8f9fa;border:1.5px solid #ddd;border-radius:8px;overflow:hidden;flex:1;max-width:360px;">
        <input type="text" v-model="uiState.searchInput"
          :placeholder="uiState.searchMode==='order'?'주문번호  ex) ORD-2026-025':'클레임번호  ex) CLM-2026-013'"
          style="border:none;background:transparent;padding:8px 14px;font-size:13px;outline:none;flex:1;min-width:0;"
          @keyup.enter="handleBtnAction('searchParam-list')" />
        <button @click="handleBtnAction('searchParam-list')"
          style="background:#1976d2;color:#fff;border:none;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;">
          조회
        </button>
      </div>
    </template>
    <span style="flex:1;">
    </span>
    <button v-if="uiState.customer" @click="handleBtnAction('searchParam-clearCustomer')"
      style="background:#f5f5f5;border:1px solid #ddd;color:#666;border-radius:8px;padding:7px 16px;font-size:12px;cursor:pointer;">
      ✕ 초기화
    </button>
    <!-- ===== □.■. 번호 입력 ================================================= -->
  </div>
  <!-- ===== □. 검색 바 ==================================================== -->
  <!-- ===== ■. 기간 필터 바 (BoSearchArea) =================================== -->
  <div style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;padding:10px 20px;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,.05);">
    <bo-search-area :columns="periodSearchColumns" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" :show-reset="false">
      <template #period>
        <div style="display:flex;background:#f0f2f5;border-radius:8px;padding:3px;gap:2px;">
          <button v-for="p in PERIOD_OPTS" :key="p?.id"
            @click="handleBtnAction('searchParam-period', p.id)"
            :style="searchParam.period===p.id
            ? 'background:#1976d2;color:#fff;border:none;border-radius:6px;padding:4px 13px;font-size:12px;font-weight:600;cursor:pointer;'
            : 'background:transparent;color:#666;border:none;border-radius:6px;padding:4px 13px;font-size:12px;cursor:pointer;'">
            {{ p.label }}
          </button>
        </div>
      </template>
    </bo-search-area>
    <span v-if="searchParam.period!=='custom'" style="font-size:12px;color:#aaa;display:block;margin-top:4px;">
      {{ cfDateFrom ? cfDateFrom + ' ~ ' + cfDateTo : '전체 기간' }}
    </span>
  </div>
  <!-- ===== □. 기간 필터 바 ================================================= -->
  <!-- ===== ■. 고객 없음 안내 ================================================ -->
  <div v-if="!uiState.customer"
    style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 0;color:#ccc;gap:12px;">
    <div style="font-size:48px;line-height:1;">
      👤
    </div>
    <div style="font-size:15px;color:#bbb;">
      고객을 검색하여 선택하면 종합 정보가 표시됩니다.
    </div>
    <div style="font-size:12px;color:#d0d0d0;">
      고객 선택 · 주문번호 · 클레임번호 세 가지 방법으로 조회할 수 있습니다.
    </div>
  </div>
  <!-- ===== □. 고객 없음 안내 ================================================ -->
  <!-- ===== ■. 고객 정보 영역 ================================================ -->
  <template v-else>
    <!-- ===== ■.■. 고객 프로필 카드 ============================================ -->
    <div style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,.05);overflow:hidden;">
      <!-- ===== ■.■.■. 상단 컬러 배너 ============================================ -->
      <div :style="'height:6px;background:'+(uiState.customer.grade==='VIP'?'linear-gradient(90deg,#9c27b0,#e040fb)':uiState.customer.grade==='우수'?'linear-gradient(90deg,#1976d2,#42a5f5)':'linear-gradient(90deg,#78909c,#b0bec5)')">
      </div>
      <div style="display:flex;align-items:flex-start;gap:20px;padding:20px 24px;">
        <!-- ===== ■.■.■.■. 아바타 =============================================== -->
        <div :style="'width:58px;height:58px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;flex-shrink:0;'+(uiState.customer.grade==='VIP'?'background:linear-gradient(135deg,#9c27b0,#e040fb);':uiState.customer.grade==='우수'?'background:linear-gradient(135deg,#1976d2,#42a5f5);':'background:linear-gradient(135deg,#78909c,#b0bec5);')">
          {{ uiState.customer.memberNm ? uiState.customer.memberNm[0] : '' }}
        </div>
        <!-- ===== ■.■.■.■. 이름/등급/상태 ========================================== -->
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="font-size:20px;font-weight:700;color:#212121;">
              {{ uiState.customer.memberNm }}
            </span>
            <span :class="'badge '+(uiState.customer.grade==='VIP'?'badge-purple':uiState.customer.grade==='우수'?'badge-blue':'badge-gray')" style="font-size:12px;">
              {{ uiState.customer.grade }}
            </span>
            <span :class="'badge '+(uiState.customer.status==='활성'?'badge-green':'badge-red')" style="font-size:12px;">
              {{ uiState.customer.status }}
            </span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:12px 24px;font-size:13px;color:#555;">
            <span>
              ✉ {{ uiState.customer.email }}
            </span>
            <span>
              📞 {{ uiState.customer.phone || '-' }}
            </span>
            <span style="color:#999;">
              가입 {{ uiState.customer.joinDate }}
            </span>
            <span style="color:#999;">
              최근로그인 {{ uiState.customer.lastLogin }}
            </span>
          </div>
        </div>
        <!-- ===== ■.■.■.■. 핵심 지표 ============================================= -->
        <div style="display:flex;gap:10px;flex-shrink:0;flex-wrap:wrap;">
          <div style="background:#f0f7ff;border:1px solid #bbdefb;border-radius:8px;padding:10px 18px;text-align:center;min-width:88px;">
            <div style="font-size:11px;color:#1976d2;font-weight:600;margin-bottom:2px;">
              총 주문
            </div>
            <div style="font-size:20px;font-weight:700;color:#1976d2;">
              {{ uiState.customer.orderCount }}
            </div>
            <div style="font-size:10px;color:#90a4ae;">
              건
            </div>
          </div>
          <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:10px 18px;text-align:center;min-width:110px;">
            <div style="font-size:11px;color:#f57f17;font-weight:600;margin-bottom:2px;">
              총 구매액
            </div>
            <div style="font-size:17px;font-weight:700;color:#f57f17;">
              {{ (uiState.customer.totalPurchase||0).toLocaleString() }}
            </div>
            <div style="font-size:10px;color:#90a4ae;">
              원
            </div>
          </div>
          <div style="background:#f3e5f5;border:1px solid #ce93d8;border-radius:8px;padding:10px 18px;text-align:center;min-width:100px;">
            <div style="font-size:11px;color:#7b1fa2;font-weight:600;margin-bottom:2px;">
              캐쉬 잔액
            </div>
            <div style="font-size:17px;font-weight:700;color:#7b1fa2;">
              {{ cfCustCacheBalance.toLocaleString() }}
            </div>
            <div style="font-size:10px;color:#90a4ae;">
              원
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- ===== □.■. 고객 프로필 카드 ============================================ -->
    <!-- ===== ■.■. 이력 탭바 + 뷰모드 =========================================== -->
    <bo-tab-bar :tabs="tabs" :tab="uiState.tab" :tab-mode="uiState.tabMode2"
      @tab-select="id => handleSelectAction('tab-select', id)"
      @mode-select="m => handleSelectAction('tab-mode', m)" />
    <!-- ===== □.■. 이력 탭바 + 뷰모드 =========================================== -->
    <!-- ===== ■.■. 이력 패널 ================================================= -->
    <div :class="uiState.tabMode2!=='tab' ? 'dtl-tab-grid cols-'+uiState.tabMode2.charAt(0) : ''">
      <!-- ===== ■.■.■. 주문이력 ================================================ -->
      <div v-show="showTab('orders')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#1976d2;border-radius:2px;display:inline-block;">
          </span>
          <span style="font-weight:600;font-size:13px;color:#333;">
            주문이력
          </span>
          <span style="margin-left:2px;background:#e3f2fd;color:#1565c0;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">
            {{ ordersPager.pageTotalCount }}건
          </span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <bo-grid bare :columns="orderGridColumns" :rows="orders" :pager="ordersPager" row-key="orderId" empty-text="주문 내역이 없습니다."
            @ref-click="ref => handleSelectAction('row-ref', ref)"
            @set-page="n => onSetPage('orders', n)" @size-change="() => onSizeChange('orders')">
          </bo-grid>
        </div>
        <bo-pager v-if="ordersPager.pageTotalCount > 0" :pager="ordersPager" :on-set-page="n => onSetPage('orders', n)" :on-size-change="() => onSizeChange('orders')" />
      </div>
      <!-- ===== ■.■.■. 클레임이력 =============================================== -->
      <div v-show="showTab('claims')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#ef5350;border-radius:2px;display:inline-block;">
          </span>
          <span style="font-weight:600;font-size:13px;color:#333;">
            클레임이력
          </span>
          <span style="margin-left:2px;background:#ffebee;color:#c62828;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">
            {{ claimsPager.pageTotalCount }}건
          </span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <bo-grid bare :columns="claimGridColumns" :rows="claims" :pager="claimsPager" row-key="claimId" empty-text="클레임 내역이 없습니다."
            @ref-click="ref => handleSelectAction('row-ref', ref)"
            @set-page="n => onSetPage('claims', n)" @size-change="() => onSizeChange('claims')">
          </bo-grid>
        </div>
        <bo-pager v-if="claimsPager.pageTotalCount > 0" :pager="claimsPager" :on-set-page="n => onSetPage('claims', n)" :on-size-change="() => onSizeChange('claims')" />
      </div>
      <!-- ===== ■.■.■. 배송이력 ================================================ -->
      <div v-show="showTab('dliv')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#00897b;border-radius:2px;display:inline-block;">
          </span>
          <span style="font-weight:600;font-size:13px;color:#333;">
            배송이력
          </span>
          <span style="margin-left:2px;background:#e0f2f1;color:#00695c;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">
            {{ dlivPager.pageTotalCount }}건
          </span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <bo-grid bare :columns="dlivGridColumns" :rows="deliveries" :pager="dlivPager" row-key="dlivId" empty-text="배송 내역이 없습니다."
            @set-page="n => onSetPage('dliv', n)" @size-change="() => onSizeChange('dliv')">
          </bo-grid>
        </div>
        <bo-pager v-if="dlivPager.pageTotalCount > 0" :pager="dlivPager" :on-set-page="n => onSetPage('dliv', n)" :on-size-change="() => onSizeChange('dliv')" />
      </div>
      <!-- ===== ■.■.■. 캐쉬내역 ================================================ -->
      <div v-show="showTab('cache')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#f57c00;border-radius:2px;display:inline-block;">
          </span>
          <span style="font-weight:600;font-size:13px;color:#333;">
            캐쉬내역
          </span>
          <span style="margin-left:2px;background:#fff3e0;color:#e65100;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">
            {{ cachePager.pageTotalCount }}건
          </span>
          <span style="margin-left:auto;font-size:12px;color:#7b1fa2;font-weight:600;">
            잔액 {{ fnFmtPrice(cfCustCacheBalance) }}
          </span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <bo-grid bare :columns="cacheGridColumns" :rows="caches" :pager="cachePager" row-key="cacheId" empty-text="캐쉬 내역이 없습니다."
            @set-page="n => onSetPage('cache', n)" @size-change="() => onSizeChange('cache')">
          </bo-grid>
        </div>
        <bo-pager v-if="cachePager.pageTotalCount > 0" :pager="cachePager" :on-set-page="n => onSetPage('cache', n)" :on-size-change="() => onSizeChange('cache')" />
      </div>
      <!-- ===== ■.■.■. 문의이력 ================================================ -->
      <div v-show="showTab('contacts')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#5c6bc0;border-radius:2px;display:inline-block;">
          </span>
          <span style="font-weight:600;font-size:13px;color:#333;">
            문의이력
          </span>
          <span style="margin-left:2px;background:#e8eaf6;color:#283593;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">
            {{ contactsPager.pageTotalCount }}건
          </span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <bo-grid bare :columns="contactGridColumns" :rows="contacts" :pager="contactsPager" row-key="inquiryId" empty-text="문의 내역이 없습니다."
            @set-page="n => onSetPage('contacts', n)" @size-change="() => onSizeChange('contacts')">
          </bo-grid>
        </div>
        <bo-pager v-if="contactsPager.pageTotalCount > 0" :pager="contactsPager" :on-set-page="n => onSetPage('contacts', n)" :on-size-change="() => onSizeChange('contacts')" />
      </div>
      <!-- ===== ■.■.■. 채팅이력 ================================================ -->
      <div v-show="showTab('chats')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#26a69a;border-radius:2px;display:inline-block;">
          </span>
          <span style="font-weight:600;font-size:13px;color:#333;">
            채팅이력
          </span>
          <span style="margin-left:2px;background:#e0f2f1;color:#004d40;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">
            {{ chatsPager.pageTotalCount }}건
          </span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <bo-grid bare :columns="chatGridColumns" :rows="chats" :pager="chatsPager" row-key="chatId" empty-text="채팅 내역이 없습니다."
            @set-page="n => onSetPage('chats', n)" @size-change="() => onSizeChange('chats')">
          </bo-grid>
        </div>
        <bo-pager v-if="chatsPager.pageTotalCount > 0" :pager="chatsPager" :on-set-page="n => onSetPage('chats', n)" :on-size-change="() => onSizeChange('chats')" />
      </div>
      <!-- ===== ■.■.■. 로그인이력 =============================================== -->
      <div v-show="showTab('login')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#546e7a;border-radius:2px;display:inline-block;">
          </span>
          <span style="font-weight:600;font-size:13px;color:#333;">
            로그인이력
          </span>
          <span style="margin-left:2px;background:#eceff1;color:#37474f;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">
            {{ loginPager.pageTotalCount }}건
          </span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <bo-grid bare :columns="loginGridColumns" :rows="loginHistories" :pager="loginPager" row-key="loginId" empty-text="로그인 내역이 없습니다."
            @set-page="n => onSetPage('login', n)" @size-change="() => onSizeChange('login')">
          </bo-grid>
        </div>
        <bo-pager v-if="loginPager.pageTotalCount > 0" :pager="loginPager" :on-set-page="n => onSetPage('login', n)" :on-size-change="() => onSizeChange('login')" />
      </div>
      <!-- ===== ■.■.■. 쿠폰사용이력 ============================================== -->
      <div v-show="showTab('coupon')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#e91e63;border-radius:2px;display:inline-block;">
          </span>
          <span style="font-weight:600;font-size:13px;color:#333;">
            쿠폰사용이력
          </span>
          <span style="margin-left:2px;background:#fce4ec;color:#880e4f;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">
            {{ couponPager.pageTotalCount }}건
          </span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <bo-grid bare :columns="couponGridColumns" :rows="couponUsages" :pager="couponPager" row-key="usageId" empty-text="쿠폰 사용 내역이 없습니다."
            @ref-click="ref => handleSelectAction('row-ref', ref)"
            @set-page="n => onSetPage('coupon', n)" @size-change="() => onSizeChange('coupon')">
          </bo-grid>
        </div>
        <bo-pager v-if="couponPager.pageTotalCount > 0" :pager="couponPager" :on-set-page="n => onSetPage('coupon', n)" :on-size-change="() => onSizeChange('coupon')" />
      </div>
      <!-- ===== ■.■.■. 발송이력 ================================================ -->
      <div v-show="showTab('send')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#ff7043;border-radius:2px;display:inline-block;">
          </span>
          <span style="font-weight:600;font-size:13px;color:#333;">
            발송이력
          </span>
          <span style="margin-left:2px;background:#fbe9e7;color:#bf360c;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">
            {{ sendPager.pageTotalCount }}건
          </span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <bo-grid bare :columns="sendGridColumns" :rows="sendHistories" :pager="sendPager" row-key="sendId" empty-text="발송 내역이 없습니다."
            @set-page="n => onSetPage('send', n)" @size-change="() => onSizeChange('send')">
          </bo-grid>
        </div>
        <bo-pager v-if="sendPager.pageTotalCount > 0" :pager="sendPager" :on-set-page="n => onSetPage('send', n)" :on-size-change="() => onSizeChange('send')" />
      </div>
    </div>
    <!-- ===== □.■. 이력 패널 ================================================= -->
  </template>
  <!-- ===== □. 고객 정보 영역 ================================================ -->
  <!-- ===== ■. 고객 선택 모달 ================================================ -->
  <bo-modal :show="memberModal.show" title="고객 검색" width="760px" max-width="96vw"
    max-height="85vh" @close="handleBtnAction('memberModal-close')">
    <bo-search-area :columns="memberModalSearchColumns" :param="memberModal" :show-reset="false"
      @search="handleBtnAction('memberModal-search')" />
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid bare :columns="memberModalGridColumns" :rows="cfPageModalList" :pager="modalPager"
      row-key="userId" row-clickable empty-text="검색 결과가 없습니다."
      @row-click="row => handleSelectAction('memberModal-pick', row)"
      @set-page="n => onSetPage('modal', n)" @size-change="() => onSizeChange('modal')" row-actions>
      <template #row-actions="{ row }">
        <button class="btn btn-primary btn-xs" @click.stop="handleSelectAction('memberModal-pick', row)">
          선택
        </button>
      </template>
    </bo-grid>
    <bo-pager v-if="modalPager.pageTotalCount > 0" :pager="modalPager" :on-set-page="n => onSetPage('modal', n)" :on-size-change="() => onSizeChange('modal')" />
    <!-- ===== □.■. 목록 영역 ================================================= -->
  </bo-modal>
  <!-- ===== □. 고객 선택 모달 ================================================ -->
</div>
`,
  };
})();
