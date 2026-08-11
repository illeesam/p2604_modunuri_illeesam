/* ShopJoy Admin - 정산마감 */
window.StSettleCloseMng = {
  name: 'StSettleCloseMng',
  props: {
    navigate:          { type: Function, required: true }, // 페이지 이동
    initSearchValue:   { type: String,   default: null },  // ZdSimul BO상세 자동 조회값
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const uiState = reactive({ error: null });
    const codes = reactive({
      settle_statuses: [],
      settle_close_statuses: [],
    });

    /* 정산 마감 fnLoadCodes */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ StSettleCloseMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'searchParam-list') {
        return onSearch();
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      } else if (cmd === 'settleCloses-doClose') {
        return doClose();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ StSettleCloseMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'settleCloses-rowReopen') {
        return doReopen(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['SETTLE_STATUS', 'SETTLE_CLOSE_STATUS_KR'], {compNm: 'StSettleCloseMng'});
      try {
        codes.settle_statuses = codeStore.sgGetGrpCodes('SETTLE_STATUS');
        codes.settle_close_statuses = codeStore.sgGetGrpCodes('SETTLE_CLOSE_STATUS_KR');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const orders  = reactive([]);
    const claims  = reactive([]);
    const vendors = reactive([]);

    /* handleSearchData — 처리 */
    const handleSearchData = async () => {
      try {
        const [resO, resC, resV, resCL] = await Promise.all([
          boApiSvc.odOrder.getPage({ pageNo: 1, pageSize: 10000 }, '정산마감관리', '목록조회'),
          boApiSvc.odClaim.getPage({ pageNo: 1, pageSize: 10000 }, '정산마감관리', '목록조회'),
          boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 10000 }, '정산마감관리', '목록조회'),
          boApiSvc.stSettleClose.getPage({
            searchValue: searchParam.searchValue, status: searchParam.searchStatus, pageNo: 1, pageSize: 100
          }, '정산마감관리', '이력조회'),
        ]);
        orders.splice(0, orders.length, ...(resO.data?.data?.pageList || resO.data?.data?.list || []));
        claims.splice(0, claims.length, ...(resC.data?.data?.pageList || resC.data?.data?.list || []));
        vendors.splice(0, vendors.length, ...(resV.data?.data?.pageList || resV.data?.data?.list || []));
        closes.splice(0, closes.length, ...(resCL.data?.data?.pageList || resCL.data?.data?.list || []));
      } catch (_) { console.error('[catch-info]', _); }
    };

    const searchParam = reactive({ searchType: '', searchValue: '', searchStatus: '' });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다.
       리터럴 기본값이 아니라 '화면을 열었을 때의 상태'가 기준이라, initPage 가 채운
       기본 기간·사이트 값도 함께 복원된다. (재대입 금지 — Object.assign 으로만 갱신) */
    const searchParamInit = {};

    /* 적용된 검색조건 스냅샷 — 입력 즉시 filter 금지, [조회] 시점에만 반영 (UI/UX 검색 방식 정책) */
    const applied = reactive({ searchType: '', searchValue: '', searchStatus: '' });

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      if (props.initSearchValue) {
        searchParam.searchValue = props.initSearchValue;
      }
      await handleSearchData('DEFAULT');
      Object.assign(searchParamInit, searchParam);   // [초기화] 기준값 스냅샷
    };
    onMounted(initPage);

    /* 정산 마감 목록조회 — [조회] 클릭/Enter 시점에만 검색조건 적용 */

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* onSearch — 조회 */
    const onSearch = async () => {
      applied.searchType   = searchParam.searchType;
      applied.searchValue  = searchParam.searchValue;
      applied.searchStatus = searchParam.searchStatus;
      await handleSearchData('DEFAULT');
    };

    /* onReset — 초기화 */
    const onReset = () => {
      Object.assign(searchParam, searchParamInit);
      onSearch();
    };

    /* 검색바 :columns 자동 렌더 정의 */

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // --- [컬럼 정의] ---
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', label: '검색대상', type: 'multiCheck',
        options: [
          { value: 'closeMon',  label: '정산월' },
          { value: 'regUserNm', label: '담당자' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', label: '검색어', type: 'text', placeholder: '검색어 입력', width: '180px' },
      { key: 'searchStatus', label: '상태', type: 'select', options: () => codes.settle_close_statuses, nullLabel: '상태 전체' },
    ];

    const closes = reactive([]);

    // 이번달 집계
    const thisMonth = coUtil.cofToYm(new Date());
    const cfThisMonthOrders = computed(() => window.safeArrayUtils.safeFilter(orders, o => o.orderDate.startsWith(thisMonth) && o.status !== '취소됨'));
    const cfThisMonthSales  = computed(() => cfThisMonthOrders.value.reduce((s, o) => s + o.totalPrice, 0));
    const cfThisMonthRefund = computed(() => window.safeArrayUtils.safeFilter(claims, c => c.requestDate.startsWith(thisMonth) && ['환불완료','취소완료'].includes(c.status)).reduce((s, c) => s + c.refundAmount, 0));
    const cfThisMonthNet    = computed(() => cfThisMonthSales.value - cfThisMonthRefund.value);
    const cfThisMonthComm   = computed(() => Math.round(cfThisMonthNet.value * 0.10));
    const cfThisMonthPromo  = computed(() => Math.round(cfThisMonthNet.value * 0.03));
    const cfThisMonthSettle = computed(() => cfThisMonthNet.value - cfThisMonthComm.value - cfThisMonthPromo.value);

    const cfAlreadyClosed = computed(() => window.safeArrayUtils.safeSome(closes, c => c.closeMon === thisMonth));

    /* doClose — 실행 */
    const doClose = async () => {
      if (cfAlreadyClosed.value) { showToast('이미 마감된 월입니다.', 'error'); return; }
      const ok = await showConfirm('정산마감', `${thisMonth} 정산을 마감하시겠습니까?\n마감 후에는 수정이 제한됩니다.`);
      if (!ok) { return; }
      /* ⚠ 이전에는 API 호출 '전' 에 closes.unshift(...) 로 목록에 먼저 넣고 실패해도 되돌리지 않아,
         저장이 안 됐는데도 화면에는 '마감완료' 행이 남아 성공한 것처럼 보였다.
         저장 성공 이후에만 목록을 갱신하도록 바꿨다(성공 시 서버 기준으로 재조회).

         ⚠⚠ 현재 이 저장은 백엔드와 계약이 맞지 않아 실패한다.
            보내는 필드(closeMon/sales/refund/net/comm/promo/settle)가
            StSettleClose 엔티티에 없어 Jackson 이 전부 버리고,
            settle_id / close_status_cd / close_by 는 NOT NULL 이라 INSERT 가 거부된다.
            → 이제 실패가 토스트로 드러난다(조용한 가짜 성공 제거).
            근본 해결은 _doc/정책서/ec/st/st.06.정산화면-백엔드불일치.md 참조. */
      try {
        await boApiSvc.stSettleClose.create({ closeMon: thisMonth, sales: cfThisMonthSales.value, refund: cfThisMonthRefund.value, net: cfThisMonthNet.value, comm: cfThisMonthComm.value, promo: cfThisMonthPromo.value, settle: cfThisMonthSettle.value }, '정산마감관리', '저장');
        if (showToast) { showToast('정산마감이 완료되었습니다.', 'success'); }
        await handleSearchData();          // 서버 저장 결과로 목록 갱신
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* doReopen — 실행 */
    const doReopen = async (r) => {
      const ok = await showConfirm('마감취소', `${r.closeMon} 정산마감을 취소하시겠습니까?`);
      if (!ok) { return; }
      r.status = '마감취소';
      try {
        const res = await boApiSvc.stSettleClose.reopen(r.settleCloseId || r.closeId, {}, '정산마감관리', '상태변경');
        if (showToast) { showToast('마감이 취소되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => ({ '마감완료':'badge-green', '마감예정':'badge-blue', '마감취소':'badge-red' }[s] || 'badge-gray');

    /* fmtW — 포맷 W */
    const fmtW = coUtil.cofWon;

    const cfFilteredClose = computed(() => closes.filter(r => {
      if (applied.searchValue) {
        const types = applied.searchType || 'closeMon,regUserNm';
        const hits = [];
        if (types.includes('closeMon')) { hits.push(r.closeMon && r.closeMon.includes(applied.searchValue)); }
        if (types.includes('regUserNm')) { hits.push(r.regUserNm && r.regUserNm.includes(applied.searchValue)); }
        if (!hits.some(Boolean)) { return false; }
      }
      if (applied.searchStatus && r.status !== applied.searchStatus) { return false; }
      return true;
    }));

    /* thisMonthFormColumns — 이번달 마감 대상 6 카드 (BoFormArea readonly, cols=6, labelLeft) */
    columns.thisMonthForm = [
      { key: '_sales',  label: '매출액',     type: 'readonly', html: true, fmt: () => `<b style="color:#3498db;font-size:15px;">${fmtW(cfThisMonthSales.value)}</b>` },
      { key: '_refund', label: '환불액',     type: 'readonly', html: true, fmt: () => `<b style="color:#e74c3c;font-size:15px;">${fmtW(cfThisMonthRefund.value)}</b>` },
      { key: '_net',    label: '순매출',     type: 'readonly', html: true, fmt: () => `<b style="color:#333;font-size:15px;">${fmtW(cfThisMonthNet.value)}</b>` },
      { key: '_comm',   label: '수수료(10%)', type: 'readonly', html: true, fmt: () => `<b style="color:#e67e22;font-size:15px;">${fmtW(cfThisMonthComm.value)}</b>` },
      { key: '_promo',  label: '프로모션(3%)',type: 'readonly', html: true, fmt: () => `<b style="color:#9b59b6;font-size:15px;">${fmtW(cfThisMonthPromo.value)}</b>` },
      { key: '_settle', label: '정산예정액', type: 'readonly', html: true, fmt: () => `<b style="color:#27ae60;font-size:15px;">${fmtW(cfThisMonthSettle.value)}</b>` },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'closeMon',  label: '정산월', cellStyle: 'font-weight:700' },
      { key: 'sales',     label: '매출액', fmt: fmtW },
      { key: 'refund',    label: '환불액', fmt: fmtW, cellStyle: 'color:#e74c3c' },
      { key: 'net',       label: '순매출', fmt: fmtW },
      { key: 'comm',      label: '수수료', fmt: fmtW, cellStyle: 'color:#e67e22' },
      { key: 'promo',     label: '프로모션비', fmt: fmtW, cellStyle: 'color:#9b59b6' },
      { key: 'settle',    label: '정산액', fmt: fmtW, cellStyle: 'color:#27ae60;font-weight:700' },
      { key: 'closeDate', label: '마감일',  fmt: (v) => coUtil.cofYmd(v) || '-' },
      { key: 'status',    label: '상태', badge: (row) => fnStatusBadge(row.status) },
      { key: 'regUserNm', label: '담당자' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, searchParam, thisMonth,
      handleBtnAction, handleSelectAction,
      cfFilteredClose, cfAlreadyClosed,
    };
  },
  template: /* html */`
<bo-page title="정산마감"
  desc-summary="월별 업체 정산을 확정하는 마감 처리를 수행합니다. 마감 후 원장·조정 데이터 수정이 불가합니다."
  :desc-detail="['• 마감 처리 시 해당 월의 수집원장 + 조정 + 기타조정 금액을 최종 집계합니다.','• 마감 상태: 미마감 / 마감완료 / 지급완료','• [재오픈] 기능으로 마감을 취소하고 수정 후 재마감할 수 있습니다.','• 자동마감 설정(StConfigMng) 시 지급일에 자동 마감됩니다.'].join(String.fromCharCode(10))">
  <!-- ===== ■. 이번달 마감 대상 =============================================== -->
  <bo-container>
    <div style="font-weight:700;font-size:15px;margin-bottom:12px">
      {{ thisMonth }} 정산마감 대상
    </div>
    <bo-form-area :columns="columns.thisMonthForm" :form="{}" :cols="6" readonly label-left compact :show-actions="false" label-width="100px" />
    <div style="text-align:right">
      <button v-if="!cfAlreadyClosed" class="btn btn-primary" @click="handleBtnAction('settleCloses-doClose')">
        📋 {{ thisMonth }} 정산마감 실행
      </button>
      <span v-else class="badge badge-green" style="font-size:13px;padding:8px 16px">
        ✓ 마감완료
      </span>
    </div>
  </bo-container>
  <!-- ===== □. 이번달 마감 대상 =============================================== -->
  <!-- ===== ■. 검색 영역 ================================================= -->
  <bo-container>
    <bo-search-area :loading="uiState.loading"
      :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </bo-container>
  <!-- ===== □. 검색 영역 ================================================= -->
  <!-- ===== ■. 목록 영역 ================================================= -->
  <bo-container title="정산마감 이력" :count-text="cfFilteredClose.length + '건'">
    <bo-grid bare
      :columns="columns.baseGrid" :rows="cfFilteredClose" row-key="closeId"
      :row-actions="true">
      <template #head-actions>
        액션
      </template>
      <template #row-actions="{ row: r }">
        <button v-if="r.status==='마감완료'" class="btn btn-xs btn-secondary" @click="handleSelectAction('settleCloses-rowReopen', r)">
          마감취소
        </button>
      </template>
    </bo-grid>
  </bo-container>
  <!-- ===== □. 목록 영역 ================================================= -->
</bo-page>
`,
};
