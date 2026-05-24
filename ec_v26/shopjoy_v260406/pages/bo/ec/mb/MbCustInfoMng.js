/* ShopJoy Admin - 고객종합정보 (고객센터 상담용 통합 조회) */
(function () {
  const { ref, reactive, computed, watch, onMounted } = Vue;

  const SEARCH_MODES = [
    { id: 'member', label: '고객 검색' },
    { id: 'order',  label: '주문번호' },
    { id: 'claim',  label: '클레임번호' },
  ];

  const PERIOD_OPTS = [
    { id: '1m',   label: '1개월' },
    { id: '3m',   label: '3개월' },
    { id: '6m',   label: '6개월' },
    { id: '1y',   label: '1년',  default: true },
    { id: 'all',  label: '전체' },
    { id: 'custom', label: '직접입력' },
  ];

  /* fnBadgeCls */
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

  /* fnChannelCls */
  const fnChannelCls = ch => ({ 'SMS': 'badge-orange', '이메일': 'badge-blue', '카카오': 'badge-purple' }[ch] || 'badge-gray');

  /* fnFmtPrice */
  const fnFmtPrice = v => v != null ? Number(v).toLocaleString() + '원' : '-';

  /* 날짜 문자열(YYYY-MM-DD...) → 날짜만 YYYY-MM-DD 추출 */
  const dateStr = v => v ? String(v).slice(0, 10) : '';

  /* today YYYY-MM-DD */
  const today = () => new Date().toISOString().slice(0, 10);

  /* 기간 옵션 → from 날짜 문자열 */
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

  /* dateFrom~dateTo 필터 */
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
    // ===== 초기 변수 정의 =====================================================

    const { reactive, ref, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    const custInfos = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, customer: null, searchMode: 'member', searchInput: '' });
    const tab = Vue.toRef(uiState, 'tab');

    const members    = reactive([]);
    const orders     = reactive([]);
    const claims     = reactive([]);
    const deliveries = reactive([]);
    const cacheList  = reactive([]);
    const contacts   = reactive([]);
    const chats      = reactive([]);
    const codes = reactive({
      member_statuses: [],
      member_grades: [],
    });
    const loginHistory = reactive([]);
    const couponUsage = reactive([]);
    const sendHistory = reactive([]);

    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

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

    // onMounted에서 API 로드
    /* handleSearchData — 처리 */
    const handleSearchData = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        // 기간(period) → 서버 검색 파라미터. period='all' 이면 날짜조건 미전달(전체).
        const from = calcFrom(searchParam.period, searchParam.customFrom);
        const to   = searchParam.period === 'custom' ? searchParam.customTo : today();
        const dateP = (dateType) => from ? { dateType, dateStart: from, dateEnd: to } : {};
        const PG = { pageNo: 1, pageSize: 10000 };
        const [resCust, resLogin, resCoupon, resSend, resMember, resOrder, resClaim, resDliv, resCache, resContact, resChatt] = await Promise.all([
          boApiSvc.mbCustInfo.getPage(PG, '고객종합정보', '조회'),
          boApiSvc.syUserLoginLog.getPage({ ...PG, ...dateP('reg_date') }, '고객종합정보', '조회'),
          boApiSvc.pmCouponUsage.getPage({ ...PG, ...dateP('reg_date') }, '고객종합정보', '조회'),
          boApiSvc.syAlarm.getPage({ ...PG, ...dateP('reg_date') }, '고객종합정보', '조회'),
          boApiSvc.mbMember.getPage(PG, '고객종합정보', '회원조회'),
          boApiSvc.odOrder.getPage({ ...PG, ...dateP('order_date') }, '고객종합정보', '주문조회'),
          boApiSvc.odClaim.getPage({ ...PG, ...dateP('request_date') }, '고객종합정보', '클레임조회'),
          boApiSvc.odDliv.getPage({ ...PG, ...dateP('reg_date') }, '고객종합정보', '배송조회'),
          boApiSvc.pmCache.getPage(PG, '고객종합정보', '캐쉬조회'),
          boApiSvc.syContact.getPage({ ...PG, ...dateP('reg_date') }, '고객종합정보', '문의조회'),
          boApiSvc.cmChatt.getPage({ ...PG, ...dateP('reg_date') }, '고객종합정보', '채팅조회'),
        ]);
        custInfos.splice(0, custInfos.length, ...(resCust.data?.data?.pageList || []));
        loginHistory.splice(0, loginHistory.length, ...(resLogin.data?.data?.pageList || []));
        couponUsage.splice(0, couponUsage.length, ...(resCoupon.data?.data?.pageList || []));
        sendHistory.splice(0, sendHistory.length, ...(resSend.data?.data?.pageList || []));
        members.splice(0, members.length, ...(resMember.data?.data?.pageList || resMember.data?.data?.list || []));
        orders.splice(0, orders.length, ...(resOrder.data?.data?.pageList || resOrder.data?.data?.list || []));
        claims.splice(0, claims.length, ...(resClaim.data?.data?.pageList || resClaim.data?.data?.list || []));
        deliveries.splice(0, deliveries.length, ...(resDliv.data?.data?.pageList || resDliv.data?.data?.list || []));
        cacheList.splice(0, cacheList.length, ...(resCache.data?.data?.pageList || resCache.data?.data?.list || []));
        contacts.splice(0, contacts.length, ...(resContact.data?.data?.pageList || resContact.data?.data?.list || []));
        chats.splice(0, chats.length, ...(resChatt.data?.data?.pageList || resChatt.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      Object.assign(searchParamOrg, searchParam);
      if (isAppReady.value) { fnLoadCodes(); handleSearchData('DEFAULT'); }
    });
      /* -- 검색 상태 -- */
      const memberModal  = reactive({ show: false, searchType: '', keyword: '', list: [] });

      /* -- 기간 필터 (searchParam 통합) -- */
      const searchParam = reactive({ period: '1y', customFrom: '', customTo: today() });
      const searchParamOrg = reactive({ period: '1y', customFrom: '', customTo: today() });

      const cfDateFrom = computed(() => calcFrom(searchParam.period, searchParam.customFrom));
      const cfDateTo   = computed(() => searchParam.period === 'custom' ? searchParam.customTo : today());

      /* -- 탭 / 뷰모드 (영속화) -- */
      const histTab  = Vue.ref(window._mbCustInfoState.tab      || 'orders');
      const tabMode2 = Vue.ref(window._mbCustInfoState.tabMode || '3col');

      watch(histTab,   v => { window._mbCustInfoState.tab      = v; });

      watch(() => uiState.tabMode2, v => { window._mbCustInfoState.tabMode = v; });

      /* showTab — 표시 */
      const showTab = (id) => tabMode2.value !== 'tab' || histTab.value === id;

      /* clearCustomer — 비우기 */
      const clearCustomer = () => { uiState.customer = null; uiState.searchInput = ''; };

      /* period 변경 시 custom 초기값 세팅 */

      watch(() => searchParam.period, v => {
        if (v === 'custom') {
          const d = new Date(); d.setFullYear(d.getFullYear() - 1);
          searchParam.customFrom = d.toISOString().slice(0, 10);
          searchParam.customTo   = today();
        }
      });

      /* -- 현재 고객 -- */

      /* 날짜 필터 헬퍼
         - filtered: 기간 필터는 서버(API)가 처리하므로 클라이언트 재필터 없이 그대로 통과.
         - filteredLocal: 캐쉬는 잔액 정확성 위해 전체 로드 → 목록만 클라이언트 기간 필터. */
      /* filtered — 서버 필터링 통과 (재필터 없음) */
      const filtered = (list /* , dateField */) => list;
      /* filteredLocal — 로컬 기간 필터링 */
      const filteredLocal = (list, dateField) =>
        list.filter(r => inRange(r[dateField], cfDateFrom.value, cfDateTo.value));

      /* -- 파생 데이터 (computed) -- */
      const cfCustOrders = computed(() =>
        !uiState.customer ? [] : filtered(
          orders.filter(o => o.userId === uiState.customer.userId), 'orderDate')
      );
      const cfCustClaims = computed(() =>
        !uiState.customer ? [] : filtered(
          claims.filter(c => c.userId === uiState.customer.userId), 'requestDate')
      );
      const cfCustDeliveries = computed(() =>
        !uiState.customer ? [] : filtered(
          deliveries.filter(d => d.userId === uiState.customer.userId), 'regDate')
      );
      const cfCustCache = computed(() =>
        !uiState.customer ? [] : filteredLocal(
          cacheList.filter(c => c.userId === uiState.customer.userId), 'date')
      );
      const cfCustContacts = computed(() =>
        !uiState.customer ? [] : filtered(
          contacts.filter(c => c.userId === uiState.customer.userId), 'date')
      );
      const cfCustChats = computed(() =>
        !uiState.customer ? [] : filtered(
          chats.filter(c => c.userId === uiState.customer.userId), 'date')
      );
      const cfCustLoginHist = computed(() =>
        !uiState.customer ? [] : filtered(
          (loginHistory || []).filter(l => l.userId === uiState.customer.userId), 'loginDate')
      );
      const cfCustCouponUsage = computed(() =>
        !uiState.customer ? [] : filtered(
          (couponUsage || []).filter(u => u.userId === uiState.customer.userId), 'usedDate')
      );
      const cfCustSendHist = computed(() =>
        !uiState.customer ? [] : filtered(
          (sendHistory || []).filter(s => s.userId === uiState.customer.userId), 'sendDate')
      );

      /* 캐쉬 잔액 = 전체(필터 미적용) 마지막 레코드 */
      const cfCustCacheBalance = computed(() => {
        if (!uiState.customer) { return 0; }
        const all = cacheList.filter(c => c.userId === uiState.customer.userId);
        if (!all.length) { return 0; }
        return all.slice().sort((a, b) => a.cacheId - b.cacheId).at(-1)?.balance ?? 0;
      });

      /* openMemberModal — 열기 */
      const openMemberModal = async () => {
        memberModal.keyword = '';
        await handleSearchData('DEFAULT');
        memberModal.list = [...members];
        memberModal.show = true;
      };

      /* searchMemberModal — 검색 */
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

      /* selectMember — 선택 */
      const selectMember = (m) => {
        uiState.customer = m;
        memberModal.show = false;
        uiState.searchInput = '';
      };

      // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

      /* onSearch — 조회 */
      const onSearch = async () => {
        await handleSearchData('DEFAULT');
      };

      // -- 그리드 컬럼 정의 ----------------------------------------------------
      /* _ellipsis — 말줄임 */
      const _ellipsis = (maxw, extra) => 'max-width:' + maxw + 'px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' + (extra || '');
      const orderGridColumns = [
        { key: 'orderId', label: '주문번호', refLink: 'order' },
        { key: 'orderDate', label: '일시', style: 'white-space:nowrap;', cellStyle: 'color:#888;white-space:nowrap;' },
        { key: 'prodNm', label: '상품명', cellStyle: _ellipsis(150), cellTitle: true },
        { key: 'totalPrice', label: '금액', style: 'text-align:right;', align: 'right', cellStyle: 'font-weight:600;', fmt: (v) => fnFmtPrice(v) },
        { key: 'status', label: '상태', badge: (row) => fnBadgeCls(row.status) },
      ];
      const claimGridColumns = [
        { key: 'claimId', label: '클레임번호', refLink: 'claim' },
        { key: 'type', label: '유형' },
        { key: 'prodNm', label: '상품명', cellStyle: _ellipsis(130), cellTitle: true },
        { key: 'status', label: '상태', badge: (row) => fnBadgeCls(row.status) },
        { key: 'requestDate', label: '신청일', style: 'white-space:nowrap;', fmt: (v) => (v ? v.slice(0, 10) : '') },
      ];
      const dlivGridColumns = [
        { key: 'dlivId', label: '배송번호', cellStyle: 'font-weight:500;' },
        { key: 'orderId', label: '주문번호' },
        { key: 'courier', label: '택배사', fmt: (v) => v || '-' },
        { key: 'trackingNo', label: '운송장번호', cellStyle: 'color:#888;', fmt: (v) => v || '-' },
        { key: 'status', label: '상태', badge: (row) => fnBadgeCls(row.status) },
      ];
      const cacheGridColumns = [
        { key: 'date', label: '일시', style: 'white-space:nowrap;', cellStyle: 'color:#888;white-space:nowrap;' },
        { key: 'type', label: '구분', badge: (row) => (row.type === '충전' ? 'badge-blue' : 'badge-orange') },
        { key: 'amount', label: '금액', style: 'text-align:right;', align: 'right', cellStyle: (v, row) => 'font-weight:600;' + (row.amount > 0 ? 'color:#1565c0;' : 'color:#c62828;'), fmt: (v, row) => (row.amount > 0 ? '+' : '') + row.amount.toLocaleString() + '원' },
        { key: 'balance', label: '잔액', style: 'text-align:right;', align: 'right', cellStyle: 'color:#555;', fmt: (v) => fnFmtPrice(v) },
        { key: 'desc', label: '사유', cellStyle: _ellipsis(150, 'color:#666;'), cellTitle: true },
      ];
      const contactGridColumns = [
        { key: 'date', label: '접수일', style: 'white-space:nowrap;', cellStyle: 'color:#888;white-space:nowrap;', fmt: (v) => (v ? v.slice(0, 10) : '') },
        { key: 'category', label: '분류', cellStyle: 'white-space:nowrap;' },
        { key: 'title', label: '제목', cellStyle: _ellipsis(200), cellTitle: true },
        { key: 'status', label: '상태', badge: (row) => fnBadgeCls(row.status) },
      ];
      const chatGridColumns = [
        { key: 'date', label: '일시', style: 'white-space:nowrap;', cellStyle: 'color:#888;white-space:nowrap;', fmt: (v) => (v ? v.slice(0, 10) : '') },
        { key: 'subject', label: '제목', cellStyle: _ellipsis(130), cellTitle: true },
        { key: 'lastMsg', label: '마지막 메시지', cellStyle: _ellipsis(180, 'color:#666;'), cellTitle: true },
        { key: 'status', label: '상태', badge: (row) => fnBadgeCls(row.status) },
      ];
      // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================

      // --- [컬럼 정의] ---
      const loginGridColumns = [
        { key: 'loginDate', label: '일시', style: 'white-space:nowrap;', cellStyle: 'color:#888;white-space:nowrap;' },
        { key: 'ip', label: 'IP', cellStyle: 'color:#666;font-family:monospace;' },
        { key: 'device', label: '기기/브라우저', cellStyle: 'color:#555;' },
        { key: 'result', label: '결과', badge: (row) => fnBadgeCls(row.result) },
      ];
      const couponGridColumns = [
        { key: 'usedDate', label: '사용일', style: 'white-space:nowrap;', cellStyle: 'color:#888;white-space:nowrap;' },
        { key: 'couponNm', label: '쿠폰명', cellStyle: _ellipsis(150), cellTitle: true },
        { key: 'couponCode', label: '코드', cellStyle: 'font-family:monospace;color:#666;' },
        { key: 'orderId', label: '주문번호', refLink: 'order' },
        { key: 'discountAmt', label: '할인금액', style: 'text-align:right;', align: 'right', cellStyle: 'font-weight:600;color:#e91e63;', fmt: (v, row) => '-' + (row.discountAmt || 0).toLocaleString() + '원' },
      ];
      const sendGridColumns = [
        { key: 'sendDate', label: '발송일시', style: 'white-space:nowrap;', cellStyle: 'color:#888;white-space:nowrap;' },
        { key: 'channelCd', label: '채널', badge: (row) => fnChannelCls(row.channelCd) },
        { key: 'title', label: '제목/내용', cellStyle: _ellipsis(220, 'color:#333;'), cellTitle: true },
        { key: 'statusCd', label: '결과', badge: (row) => fnBadgeCls(row.statusCd) },
      ];
      const memberModalGridColumns = [
        { key: 'userId', label: 'ID', style: 'width:50px;text-align:center;', align: 'center', cellStyle: 'color:#aaa;' },
        { key: 'memberNm', label: '이름', style: 'width:90px;', cellStyle: 'font-weight:600;color:#1a1a2e;' },
        { key: 'email', label: '이메일', cellStyle: 'color:#555;' },
        { key: 'phone', label: '전화', style: 'width:130px;', cellStyle: 'color:#666;font-family:monospace;', fmt: (v) => v || '-' },
        { key: 'grade', label: '등급', style: 'width:60px;text-align:center;', align: 'center', badge: (row) => (row.grade === 'VIP' ? 'badge-purple' : row.grade === '우수' ? 'badge-blue' : 'badge-gray') },
        { key: 'status', label: '상태', style: 'width:60px;text-align:center;', align: 'center', badge: (row) => (row.status === '활성' ? 'badge-green' : 'badge-red') },
      ];

  // ===== return (템플릿 노출) ===============================================


  return { custInfos, uiState, SEARCH_MODES, memberModal,
        orderGridColumns, claimGridColumns, dlivGridColumns, cacheGridColumns, contactGridColumns, chatGridColumns, loginGridColumns, couponGridColumns, sendGridColumns, memberModalGridColumns,
        showRefModal,
        searchParam, searchParamOrg, PERIOD_OPTS, cfDateFrom, cfDateTo,
        cfCustOrders, cfCustClaims, cfCustDeliveries, cfCustCache, cfCustCacheBalance,
        cfCustContacts, cfCustChats, cfCustLoginHist, cfCustCouponUsage, cfCustSendHist,
        openMemberModal, searchMemberModal, selectMember,
        onSearch, clearCustomer,
        fnBadgeCls, fnChannelCls, fnFmtPrice,
        histTab, tabMode2, showTab,
      };
    },

    template: /* html */`
<div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div class="page-header">
    <h2 class="page-title">고객종합정보</h2>
  </div>
  <!-- ===== □. 영역 ====================================================== -->
  <!-- ===== ■. 검색 바 ==================================================== -->
  <div style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;padding:14px 20px;margin-bottom:10px;box-shadow:0 1px 4px rgba(0,0,0,.05);display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
    <!-- ===== ■.■. 모드 세그먼트 =============================================== -->
    <div style="display:flex;background:#f0f2f5;border-radius:8px;padding:3px;gap:2px;flex-shrink:0;">
      <button v-for="m in SEARCH_MODES" :key="m?.id"
        @click="uiState.searchMode=m.id;uiState.searchInput=''"
        :style="uiState.searchMode===m.id
        ? 'background:#1976d2;color:#fff;border:none;border-radius:6px;padding:6px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;'
        : 'background:transparent;color:#666;border:none;border-radius:6px;padding:6px 16px;font-size:13px;cursor:pointer;transition:all .15s;'">
        {{ m.label }}
      </button>
    </div>
    <!-- ===== □.□. 모드 세그먼트 =============================================== -->
    <!-- ===== ■.■. 고객 선택 ================================================= -->
    <template v-if="uiState.searchMode==='member'">
      <button @click="openMemberModal"
        style="display:flex;align-items:center;gap:6px;background:#fff;border:1.5px solid #1976d2;color:#1976d2;border-radius:8px;padding:7px 18px;font-size:13px;font-weight:600;cursor:pointer;">
        🔍 고객 선택
      </button>
      <span style="font-size:12px;color:#aaa;">이름 · 이메일 · 전화번호로 검색</span>
    </template>
    <!-- ===== □.□. 고객 선택 ================================================= -->
    <!-- ===== ■.■. 번호 입력 ================================================= -->
    <template v-else>
      <div style="display:flex;align-items:center;gap:0;background:#f8f9fa;border:1.5px solid #ddd;border-radius:8px;overflow:hidden;flex:1;max-width:360px;">
        <input type="text" v-model="uiState.searchInput"
          :placeholder="uiState.searchMode==='order'?'주문번호  ex) ORD-2026-025':'클레임번호  ex) CLM-2026-013'"
          style="border:none;background:transparent;padding:8px 14px;font-size:13px;outline:none;flex:1;min-width:0;"
          @keyup.enter="() => onSearch?.()" />
        <button @click="onSearch"
          style="background:#1976d2;color:#fff;border:none;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;">
          조회
        </button>
      </div>
    </template>
    <span style="flex:1;"></span>
    <button v-if="uiState.customer" @click="clearCustomer"
      style="background:#f5f5f5;border:1px solid #ddd;color:#666;border-radius:8px;padding:7px 16px;font-size:12px;cursor:pointer;">
      ✕ 초기화
    </button>
  </div>
    <!-- ===== □.□. 번호 입력 ================================================= -->
  <!-- ===== □. 검색 바 ==================================================== -->
  <!-- ===== ■. 기간 필터 바 ================================================= -->
  <div style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;padding:10px 20px;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,.05);display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
    <span style="font-size:12px;color:#888;font-weight:500;white-space:nowrap;">조회기간</span>
    <div style="display:flex;background:#f0f2f5;border-radius:8px;padding:3px;gap:2px;">
      <button v-for="p in PERIOD_OPTS" :key="p?.id"
        @click="searchParam.period=p.id"
        :style="searchParam.period===p.id
        ? 'background:#1976d2;color:#fff;border:none;border-radius:6px;padding:4px 13px;font-size:12px;font-weight:600;cursor:pointer;'
        : 'background:transparent;color:#666;border:none;border-radius:6px;padding:4px 13px;font-size:12px;cursor:pointer;'">
        {{ p.label }}
      </button>
    </div>
    <template v-if="searchParam.period==='custom'">
      <input type="date" v-model="searchParam.customFrom"
        style="border:1px solid #ddd;border-radius:6px;padding:4px 10px;font-size:12px;outline:none;" />
      <span style="font-size:12px;color:#aaa;">~</span>
      <input type="date" v-model="searchParam.customTo"
        style="border:1px solid #ddd;border-radius:6px;padding:4px 10px;font-size:12px;outline:none;" />
    </template>
    <span v-else style="font-size:12px;color:#aaa;">{{ cfDateFrom ? cfDateFrom + ' ~ ' + cfDateTo : '전체 기간' }}</span>
  </div>
  <!-- ===== □. 기간 필터 바 ================================================= -->
  <!-- ===== ■. 고객 없음 안내 ================================================ -->
  <div v-if="!uiState.customer"
    style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 0;color:#ccc;gap:12px;">
    <div style="font-size:48px;line-height:1;">👤</div>
    <div style="font-size:15px;color:#bbb;">고객을 검색하여 선택하면 종합 정보가 표시됩니다.</div>
    <div style="font-size:12px;color:#d0d0d0;">고객 선택 · 주문번호 · 클레임번호 세 가지 방법으로 조회할 수 있습니다.</div>
  </div>
  <!-- ===== □. 고객 없음 안내 ================================================ -->
  <!-- ===== ■. 영역 ====================================================== -->
  <template v-else>
    <!-- ===== ■.■. 1. 고객 프로필 카드 ========================================== -->
    <div style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,.05);overflow:hidden;">
      <!-- ===== ■.■.■. 상단 컬러 배너 ============================================ -->
      <div :style="'height:6px;background:'+(uiState.customer.grade==='VIP'?'linear-gradient(90deg,#9c27b0,#e040fb)':uiState.customer.grade==='우수'?'linear-gradient(90deg,#1976d2,#42a5f5)':'linear-gradient(90deg,#78909c,#b0bec5)')"></div>
      <div style="display:flex;align-items:flex-start;gap:20px;padding:20px 24px;">
        <!-- ===== ■.■.■.■. 아바타 =============================================== -->
        <div :style="'width:58px;height:58px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;flex-shrink:0;'+(uiState.customer.grade==='VIP'?'background:linear-gradient(135deg,#9c27b0,#e040fb);':uiState.customer.grade==='우수'?'background:linear-gradient(135deg,#1976d2,#42a5f5);':'background:linear-gradient(135deg,#78909c,#b0bec5);')">
          {{ uiState.customer.memberNm ? uiState.customer.memberNm[0] : '' }}
        </div>
        <!-- ===== ■.■.■.■. 이름/등급/상태 ========================================== -->
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="font-size:20px;font-weight:700;color:#212121;">{{ uiState.customer.memberNm }}</span>
            <span :class="'badge '+(uiState.customer.grade==='VIP'?'badge-purple':uiState.customer.grade==='우수'?'badge-blue':'badge-gray')" style="font-size:12px;">
              {{ uiState.customer.grade }}
            </span>
            <span :class="'badge '+(uiState.customer.status==='활성'?'badge-green':'badge-red')" style="font-size:12px;">
              {{ uiState.customer.status }}
            </span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:12px 24px;font-size:13px;color:#555;">
            <span>✉ {{ uiState.customer.email }}</span>
            <span>📞 {{ uiState.customer.phone || '-' }}</span>
            <span style="color:#999;">가입 {{ uiState.customer.joinDate }}</span>
            <span style="color:#999;">최근로그인 {{ uiState.customer.lastLogin }}</span>
          </div>
        </div>
        <!-- ===== ■.■.■.■. 핵심 지표 ============================================= -->
        <div style="display:flex;gap:10px;flex-shrink:0;flex-wrap:wrap;">
          <div style="background:#f0f7ff;border:1px solid #bbdefb;border-radius:8px;padding:10px 18px;text-align:center;min-width:88px;">
            <div style="font-size:11px;color:#1976d2;font-weight:600;margin-bottom:2px;">총 주문</div>
            <div style="font-size:20px;font-weight:700;color:#1976d2;">{{ uiState.customer.orderCount }}</div>
            <div style="font-size:10px;color:#90a4ae;">건</div>
          </div>
          <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:10px 18px;text-align:center;min-width:110px;">
            <div style="font-size:11px;color:#f57f17;font-weight:600;margin-bottom:2px;">총 구매액</div>
            <div style="font-size:17px;font-weight:700;color:#f57f17;">{{ (uiState.customer.totalPurchase||0).toLocaleString() }}</div>
            <div style="font-size:10px;color:#90a4ae;">원</div>
          </div>
          <div style="background:#f3e5f5;border:1px solid #ce93d8;border-radius:8px;padding:10px 18px;text-align:center;min-width:100px;">
            <div style="font-size:11px;color:#7b1fa2;font-weight:600;margin-bottom:2px;">캐쉬 잔액</div>
            <div style="font-size:17px;font-weight:700;color:#7b1fa2;">{{ cfCustCacheBalance.toLocaleString() }}</div>
            <div style="font-size:10px;color:#90a4ae;">원</div>
          </div>
        </div>
      </div>
    </div>
    <!-- ===== □.□. 1. 고객 프로필 카드 ========================================== -->
    <!-- ===== ■.■. 이력 탭바 + 뷰모드 =========================================== -->
    <div class="tab-bar-row">
      <div class="tab-nav">
        <button class="tab-btn" :class="{active:histTab==='orders'}"   :disabled="tabMode2!=='tab'" @click="histTab='orders'">
          🛒 주문이력
          <span class="tab-count">{{ cfCustOrders.length }}</span>
        </button>
        <button class="tab-btn" :class="{active:histTab==='claims'}"   :disabled="tabMode2!=='tab'" @click="histTab='claims'">
          ↩ 클레임이력
          <span class="tab-count">{{ cfCustClaims.length }}</span>
        </button>
        <button class="tab-btn" :class="{active:histTab==='dliv'}"     :disabled="tabMode2!=='tab'" @click="histTab='dliv'">
          🚚 배송이력
          <span class="tab-count">{{ cfCustDeliveries.length }}</span>
        </button>
        <button class="tab-btn" :class="{active:histTab==='cache'}"    :disabled="tabMode2!=='tab'" @click="histTab='cache'">
          💰 캐쉬내역
          <span class="tab-count">{{ cfCustCache.length }}</span>
        </button>
        <button class="tab-btn" :class="{active:histTab==='contacts'}" :disabled="tabMode2!=='tab'" @click="histTab='contacts'">
          📋 문의이력
          <span class="tab-count">{{ cfCustContacts.length }}</span>
        </button>
        <button class="tab-btn" :class="{active:histTab==='chats'}"    :disabled="tabMode2!=='tab'" @click="histTab='chats'">
          💬 채팅이력
          <span class="tab-count">{{ cfCustChats.length }}</span>
        </button>
        <button class="tab-btn" :class="{active:histTab==='login'}"    :disabled="tabMode2!=='tab'" @click="histTab='login'">
          🔐 로그인
          <span class="tab-count">{{ cfCustLoginHist.length }}</span>
        </button>
        <button class="tab-btn" :class="{active:histTab==='coupon'}"   :disabled="tabMode2!=='tab'" @click="histTab='coupon'">
          🎟 쿠폰
          <span class="tab-count">{{ cfCustCouponUsage.length }}</span>
        </button>
        <button class="tab-btn" :class="{active:histTab==='send'}"     :disabled="tabMode2!=='tab'" @click="histTab='send'">
          📨 발송
          <span class="tab-count">{{ cfCustSendHist.length }}</span>
        </button>
      </div>
      <div class="tab-modes">
        <button class="tab-mode-btn" :class="{active:tabMode2==='tab'}" @click="tabMode2='tab'" title="탭으로 보기">📑</button>
        <button class="tab-mode-btn" :class="{active:tabMode2==='1col'}" @click="tabMode2='1col'" title="1열로 보기">1▭</button>
        <button class="tab-mode-btn" :class="{active:tabMode2==='2col'}" @click="tabMode2='2col'" title="2열로 보기">2▭</button>
        <button class="tab-mode-btn" :class="{active:tabMode2==='3col'}" @click="tabMode2='3col'" title="3열로 보기">3▭</button>
        <button class="tab-mode-btn" :class="{active:tabMode2==='4col'}" @click="tabMode2='4col'" title="4열로 보기">4▭</button>
      </div>
    </div>
    <!-- ===== □.□. 이력 탭바 + 뷰모드 =========================================== -->
    <!-- ===== ■.■. 이력 패널 ================================================= -->
    <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">
      <!-- ===== ■.■.■. 주문이력 ================================================ -->
      <div v-show="showTab('orders')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#1976d2;border-radius:2px;display:inline-block;"></span>
          <span style="font-weight:600;font-size:13px;color:#333;">주문이력</span>
          <span style="margin-left:2px;background:#e3f2fd;color:#1565c0;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">
            {{ cfCustOrders.length }}건
          </span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <!-- ===== ■.■.■.■.■. 목록 영역 =========================================== -->
          <bo-grid bare :columns="orderGridColumns" :rows="cfCustOrders" row-key="orderId" empty-text="주문 내역이 없습니다."
            @ref-click="({type,id}) => showRefModal(type, id)"></bo-grid>
        </div>
      </div>
      <!-- ===== ■.■.■. 클레임이력 =============================================== -->
      <div v-show="showTab('claims')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#ef5350;border-radius:2px;display:inline-block;"></span>
          <span style="font-weight:600;font-size:13px;color:#333;">클레임이력</span>
          <span style="margin-left:2px;background:#ffebee;color:#c62828;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">
            {{ cfCustClaims.length }}건
          </span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <!-- ===== ■.■.■.■.■. 목록 영역 =========================================== -->
          <bo-grid bare :columns="claimGridColumns" :rows="cfCustClaims" row-key="claimId" empty-text="클레임 내역이 없습니다."
            @ref-click="({type,id}) => showRefModal(type, id)"></bo-grid>
        </div>
      </div>
      <!-- ===== ■.■.■. 배송이력 ================================================ -->
      <div v-show="showTab('dliv')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#00897b;border-radius:2px;display:inline-block;"></span>
          <span style="font-weight:600;font-size:13px;color:#333;">배송이력</span>
          <span style="margin-left:2px;background:#e0f2f1;color:#00695c;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">
            {{ cfCustDeliveries.length }}건
          </span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <!-- ===== ■.■.■.■.■. 목록 영역 =========================================== -->
          <bo-grid bare :columns="dlivGridColumns" :rows="cfCustDeliveries" row-key="dlivId" empty-text="배송 내역이 없습니다."></bo-grid>
        </div>
      </div>
      <!-- ===== ■.■.■. 캐쉬내역 ================================================ -->
      <div v-show="showTab('cache')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#f57c00;border-radius:2px;display:inline-block;"></span>
          <span style="font-weight:600;font-size:13px;color:#333;">캐쉬내역</span>
          <span style="margin-left:2px;background:#fff3e0;color:#e65100;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">
            {{ cfCustCache.length }}건
          </span>
          <span style="margin-left:auto;font-size:12px;color:#7b1fa2;font-weight:600;">잔액 {{ fnFmtPrice(cfCustCacheBalance) }}</span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <!-- ===== ■.■.■.■.■. 목록 영역 =========================================== -->
          <bo-grid bare :columns="cacheGridColumns" :rows="cfCustCache" row-key="cacheId" empty-text="캐쉬 내역이 없습니다."></bo-grid>
        </div>
      </div>
      <!-- ===== ■.■.■. 문의이력 ================================================ -->
      <div v-show="showTab('contacts')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#5c6bc0;border-radius:2px;display:inline-block;"></span>
          <span style="font-weight:600;font-size:13px;color:#333;">문의이력</span>
          <span style="margin-left:2px;background:#e8eaf6;color:#283593;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">
            {{ cfCustContacts.length }}건
          </span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <!-- ===== ■.■.■.■.■. 목록 영역 =========================================== -->
          <bo-grid bare :columns="contactGridColumns" :rows="cfCustContacts" row-key="inquiryId" empty-text="문의 내역이 없습니다."></bo-grid>
        </div>
      </div>
      <!-- ===== ■.■.■. 채팅이력 ================================================ -->
      <div v-show="showTab('chats')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#26a69a;border-radius:2px;display:inline-block;"></span>
          <span style="font-weight:600;font-size:13px;color:#333;">채팅이력</span>
          <span style="margin-left:2px;background:#e0f2f1;color:#004d40;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">
            {{ cfCustChats.length }}건
          </span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <!-- ===== ■.■.■.■.■. 목록 영역 =========================================== -->
          <bo-grid bare :columns="chatGridColumns" :rows="cfCustChats" row-key="chatId" empty-text="채팅 내역이 없습니다."></bo-grid>
        </div>
      </div>
      <!-- ===== ■.■.■. 로그인이력 =============================================== -->
      <div v-show="showTab('login')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#546e7a;border-radius:2px;display:inline-block;"></span>
          <span style="font-weight:600;font-size:13px;color:#333;">로그인이력</span>
          <span style="margin-left:2px;background:#eceff1;color:#37474f;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">
            {{ cfCustLoginHist.length }}건
          </span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <!-- ===== ■.■.■.■.■. 목록 영역 =========================================== -->
          <bo-grid bare :columns="loginGridColumns" :rows="cfCustLoginHist" row-key="loginId" empty-text="로그인 내역이 없습니다."></bo-grid>
        </div>
      </div>
      <!-- ===== ■.■.■. 쿠폰사용이력 ============================================== -->
      <div v-show="showTab('coupon')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#e91e63;border-radius:2px;display:inline-block;"></span>
          <span style="font-weight:600;font-size:13px;color:#333;">쿠폰사용이력</span>
          <span style="margin-left:2px;background:#fce4ec;color:#880e4f;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">
            {{ cfCustCouponUsage.length }}건
          </span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <!-- ===== ■.■.■.■.■. 목록 영역 =========================================== -->
          <bo-grid bare :columns="couponGridColumns" :rows="cfCustCouponUsage" row-key="usageId" empty-text="쿠폰 사용 내역이 없습니다."
            @ref-click="({type,id}) => showRefModal(type, id)"></bo-grid>
        </div>
      </div>
      <!-- ===== ■.■.■. 발송이력 ================================================ -->
      <div v-show="showTab('send')" style="background:#fff;border:1px solid #e5e8ed;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f0f0f0;background:#fafbfc;">
          <span style="width:4px;height:18px;background:#ff7043;border-radius:2px;display:inline-block;"></span>
          <span style="font-weight:600;font-size:13px;color:#333;">발송이력</span>
          <span style="margin-left:2px;background:#fbe9e7;color:#bf360c;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;">
            {{ cfCustSendHist.length }}건
          </span>
        </div>
        <div style="overflow:auto;max-height:340px;">
          <!-- ===== ■.■.■.■.■. 목록 영역 =========================================== -->
          <bo-grid bare :columns="sendGridColumns" :rows="cfCustSendHist" row-key="sendId" empty-text="발송 내역이 없습니다."></bo-grid>
        </div>
      </div>
    </div>
    <!-- ===== /grid ====================================================== -->
  </template>
    <!-- ===== □.□. 이력 패널 ================================================= -->
  <!-- ===== □. 영역 ====================================================== -->
  <!-- ===== ■. 고객 선택 모달 ================================================ -->
  <bo-modal :show="memberModal.show" title="고객 검색" width="760px" max-width="96vw"
    max-height="85vh" @close="memberModal.show=false">
    <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;">
      <bo-multi-check-select
        v-model="memberModal.searchType"
        :options="[
        { value: 'memberNm', label: '이름' },
        { value: 'email',    label: '이메일' },
        { value: 'phone',    label: '전화번호' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input type="text" class="form-control" v-model="memberModal.keyword"
        placeholder="검색어 입력" @keyup.enter="() => searchMemberModal?.()"
        style="flex:1;font-size:13px;" />
      <button class="btn btn-primary btn-sm" @click="searchMemberModal" style="white-space:nowrap;">🔍 검색</button>
    </div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid bare :columns="memberModalGridColumns" :rows="memberModal.list" row-key="userId" row-clickable empty-text="검색 결과가 없습니다." @row-click="selectMember" row-actions>
      <template #row-actions="{ row }">
        <button class="btn btn-primary btn-sm" @click.stop="selectMember(row)">선택</button>
      </template>
    </bo-grid>
  </bo-modal>
</div>

    <!-- ===== □.□. 목록 영역 ================================================= -->
  <!-- ===== □. 고객 선택 모달 ================================================ -->`,
  };
})();
