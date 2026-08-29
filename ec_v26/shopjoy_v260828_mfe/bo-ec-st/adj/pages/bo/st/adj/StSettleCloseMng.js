/* ShopJoy Admin - 정산마감 */
export default {
  name: 'st-adj-stSettleCloseMng',
  props: {
    navigate:          { type: Function, required: true }, // 페이지 이동
    initSearchValue:   { type: String,   default: null },  // ZdSimul BO상세 자동 조회값
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const uiState = reactive({ error: null, closeStatusFilter: '' });
    const codes = reactive({
      settle_statuses: [],
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ StSettleCloseMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'closeStatusFilter-change') {
        return; // computed(cfFilteredClose) 가 즉시 반영 — 서버조회 없는 로컬 필터
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ StSettleCloseMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'settleCandidates-rowClose') {
        return doClose(param);
      } else if (cmd === 'settleCloses-rowReopen') {
        return doReopen(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드.
       ⚠ close_status_cd 는 실제로 SETTLE_STATUS(OPEN/CLOSED/CANCELLED/CONFIRMED/PAID)
          그룹의 코드값을 그대로 쓴다(reopen() 서비스가 'OPEN' 을 쓴다 — SETTLE_CLOSE_STATUS_KR
          같은 별도 한글 그룹을 쓰면 실 데이터 값과 어긋나 필터가 항상 빈 결과가 된다). */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['SETTLE_STATUS_CD'], {compNm: 'StSettleCloseMng'});
      try {
        codes.settle_statuses = codeStore.sgGetGrpCodes('SETTLE_STATUS_CD');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    const settles = reactive([]);   // 정산마스터(st_settle) 전체
    const closes  = reactive([]);   // 정산마감 이력(st_settle_close)
    const excelModal = reactive({ show: false });   // 엑셀 다운로드 모달 표시 여부

    /* cfCloseCandidates — 마감 대상: 정산확정(CONFIRMED) 상태이면서
       아직 마감이력이 CLOSED 로 남아있지 않은 정산건. */
    const cfClosedSettleIds = computed(() => new Set(
      closes.filter(c => c.closeStatusCd === 'CLOSED').map(c => c.settleId)
    ));
    const cfCloseCandidates = computed(() => settles.filter(s =>
      s.settleStatusCd === 'CONFIRMED' && !cfClosedSettleIds.value.has(s.settleId)
    ));

    /* cfFilteredClose — 마감 이력 로컬 필터 (건수가 적어 서버 페이징 대신 전체 표시 + 클라이언트 필터).
       StSettleCloseDto.Request 는 settleCloseId 만 지원해 상태 필터를 서버에 위임할 수 없다. */
    const cfFilteredClose = computed(() => closes.filter(c =>
      !uiState.closeStatusFilter || c.closeStatusCd === uiState.closeStatusFilter
    ));

    /* handleSearchData — 정산마스터 + 마감이력 동시 로드 */
    const handleSearchData = async () => {
      try {
        const [resS, resC] = await Promise.all([
          boApiSvc.stSettle.getPage({ pageNo: 1, pageSize: 500 }, '정산마감관리', '정산목록조회'),
          boApiSvc.stSettleClose.getPage({ pageNo: 1, pageSize: 500 }, '정산마감관리', '이력조회'),
        ]);
        settles.splice(0, settles.length, ...(resS.data?.data?.pageList || resS.data?.data?.list || []));
        closes.splice(0, closes.length, ...(resC.data?.data?.pageList || resC.data?.data?.list || []));
      } catch (_) { console.error('[catch-info]', _); }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      await handleSearchData();
    };
    onMounted(initPage);

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* fnCurrentUserId — 로그인 관리자 ID (closeBy NOT NULL — 자동입력) */
    const fnCurrentUserId = () => {
      const s = window.sfGetBoAuthStore ? window.sfGetBoAuthStore() : null;
      return s && s.svAuthUser ? (s.svAuthUser.authId || '') : '';
    };

    /* doClose — 마감 실행.
       ⚠ create body 는 StSettleClose 엔티티 자체다. settleId/closeStatusCd/closeBy 는
          NOT NULL — 이전 화면은 이 필드들 대신 closeMon/sales/refund/... 를 보내
          Jackson 이 전부 무시하고 INSERT 가 거부됐다(정책서 st.06). */
    const doClose = async (settle) => {
      const ok = await showConfirm('정산마감', `[${settle.settleId}] (${settle.vendorId} · ${settle.settleYm}) 을(를) 마감하시겠습니까?\n마감 후에는 조정이 제한됩니다.`);
      if (!ok) { return; }
      /* closeDate 는 optional — 형식(LocalDateTime) 리스크를 피하기 위해 보내지 않는다.
         처리시각이 필요하면 백엔드에서 close 시점 기준으로 채우도록 두는 편이 안전하다. */
      const body = {
        settleId: settle.settleId,
        closeStatusCd: 'CLOSED',
        finalSettleAmt: settle.finalSettleAmt,
        closeBy: fnCurrentUserId(),
      };
      try {
        await boApiSvc.stSettleClose.create(body, '정산마감관리', '저장');
        showToast('정산마감이 완료되었습니다.', 'success');
        await handleSearchData();          // 서버 저장 결과로 목록 갱신
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        showToast(errMsg, 'error', 0);
      }
    };

    /* doReopen — 마감취소(재오픈). 서비스가 closeStatusCd 를 'OPEN' 으로 되돌린다. */
    const doReopen = async (r) => {
      const ok = await showConfirm('마감취소', `[${r.settleId}] 정산마감을 취소하시겠습니까?`);
      if (!ok) { return; }
      try {
        await boApiSvc.stSettleClose.reopen(r.settleCloseId, {}, '정산마감관리', '상태변경');
        showToast('마감이 취소되었습니다.', 'success');
        await handleSearchData();
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        showToast(errMsg, 'error', 0);
      }
    };

    /* fnStatusBadge — 마감상태 배지 (SETTLE_STATUS 코드값 기준: CLOSED/OPEN) */
    const fnStatusBadge = s => coUtil.cofCodeBadge('SETTLE_STATUS_CD', s, { CLOSED:'badge-green', OPEN:'badge-blue' }[s] || 'badge-gray');
    const fnSettleStatusBadge = s => coUtil.cofCodeBadge('SETTLE_STATUS_CD', s, { CONFIRMED:'badge-blue', PAID:'badge-green', CLOSED:'badge-gray', CANCELLED:'badge-red', OPEN:'badge-orange' }[s] || 'badge-gray');

    /* fmtW — 포맷 W */
    const fmtW = coUtil.cofWon;

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // --- [컬럼 정의] ---
    const columns = {};

    /* 마감 대상 그리드 — st_settle 정산확정(CONFIRMED) 건 */
    columns.candidateGrid = [
      { key: 'settleId',        label: '정산ID' },
      { key: 'vendorId',        label: '업체', cellStyle: 'font-weight:700' },
      { key: 'settleYm',        label: '정산월' },
      { key: 'totalOrderAmt',   label: '총주문액', fmt: fmtW },
      { key: 'totalReturnAmt',  label: '총환불액', fmt: fmtW, cellStyle: 'color:#e74c3c' },
      { key: 'commissionAmt',   label: '수수료', fmt: fmtW, cellStyle: 'color:#e67e22' },
      { key: 'adjAmt',          label: '조정합계', fmt: fmtW },
      { key: 'etcAdjAmt',       label: '기타조정합계', fmt: fmtW },
      { key: 'finalSettleAmt',  label: '최종정산액', fmt: fmtW, cellStyle: 'color:#27ae60;font-weight:700' },
      { key: 'settleStatusCd',  label: '정산상태', badge: (row) => fnSettleStatusBadge(row.settleStatusCd) },
      { type: 'actions', actions: [
        { label: '마감', cls: 'btn btn-xs btn-primary', onClick: (row) => handleSelectAction('settleCandidates-rowClose', row) },
      ] },
    ];

    /* 마감 이력 그리드
       ⚠ key 는 백엔드 StSettleCloseDto.Item 필드명과 일치해야 값이 표시된다.
          closeMon/sales/refund/net/comm/promo/settle/vendorNm/regUserNm 은 Item 에
          없는 필드라 전부 제거했다(항상 빈 값이었다). 업체·기간이 필요하면 settleId 로
          정산마스터를 조회해야 한다. 상세 → _doc/정책서/ec/st/st.06.정산화면-백엔드불일치.md */
    columns.baseGrid = [
      { key: 'settleCloseId', label: '마감ID' },
      { key: 'settleId',      label: '정산ID', cellStyle: 'color:#666;font-size:11px' },
      { key: 'finalSettleAmt',label: '마감시점 정산액', fmt: fmtW, cellStyle: 'color:#27ae60;font-weight:700' },
      { key: 'closeReason',   label: '사유', fmt: (v) => v || '-' },
      { key: 'closeStatusCd', label: '상태', badge: (row) => fnStatusBadge(row.closeStatusCd),
        fmt: (v) => (v === 'CLOSED' ? '마감완료' : v === 'OPEN' ? '마감취소' : v) },
      { key: 'closeBy',       label: '처리자' },
      { key: 'closeDate',     label: '처리일시', fmt: (v) => coUtil.cofYmd(v) || '-' },
      { type: 'actions', actions: [
        { label: '마감취소', cls: 'btn btn-xs btn-secondary', visible: (row) => row.closeStatusCd === 'CLOSED',
          onClick: (row) => handleSelectAction('settleCloses-rowReopen', row) },
      ] },
    ];

    /* buildExcelParams — 엑셀 다운로드 조건.
       StSettleCloseDto.Request 는 settleCloseId 만 지원해(상태 필터 없음) 서버로 넘길
       조건이 없다 — 화면의 상태 필터(uiState.closeStatusFilter)는 로컬 전용이라 엑셀에는 반영되지 않는다. */
    const buildExcelParams = () => ({});

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, codes, excelModal,
      handleBtnAction, handleSelectAction,
      cfCloseCandidates, cfFilteredClose, buildExcelParams,
    };
  },
  template: /* html */`
<bo-page title="정산마감"
  desc-summary="정산확정(CONFIRMED)된 정산건을 마감 처리합니다. 마감 후에는 조정 입력이 제한됩니다."
  :desc-detail="['• 마감 대상: 정산상태가 [정산확정]이면서 아직 마감되지 않은 정산건입니다.','• 마감 처리 시 그 시점의 최종정산액(수수료·조정·기타조정 반영분)을 스냅샷으로 저장합니다.','• 마감 상태: 마감완료(CLOSED) / 마감취소(OPEN)','• [마감취소] 로 마감을 되돌리고 조정을 다시 입력할 수 있습니다.'].join(String.fromCharCode(10))">
  <!-- ===== ■. 마감 대상 =============================================== -->
  <bo-container title="마감 대상" :count-text="cfCloseCandidates.length + '건'">
    <bo-grid bare
      :columns="columns.candidateGrid" :rows="cfCloseCandidates" row-key="settleId">
      <template #head-actions>
        액션
      </template>
    </bo-grid>
    <div v-if="!cfCloseCandidates.length" style="text-align:center;color:#bbb;font-size:13px;padding:20px 16px;">
      마감 대상 정산건이 없습니다. (정산상태가 [정산확정]인 건만 표시됩니다)
    </div>
  </bo-container>
  <!-- ===== □. 마감 대상 =============================================== -->
  <!-- ===== ■. 목록 영역 ================================================= -->
  <bo-container title="정산마감 이력" :count-text="cfFilteredClose.length + '건'">
    <template #toolbar-actions>
      <button class="btn btn_excel" @click="excelModal.show = true">엑셀</button>
      <select class="form-control" style="width:140px" v-model="uiState.closeStatusFilter" @change="handleBtnAction('closeStatusFilter-change')">
        <option value="">상태 전체</option>
        <option value="CLOSED">마감완료</option>
        <option value="OPEN">마감취소</option>
      </select>
    </template>
    <bo-grid bare
      :columns="columns.baseGrid" :rows="cfFilteredClose" row-key="settleCloseId">
      <template #head-actions>
        액션
      </template>
    </bo-grid>
  </bo-container>
  <!-- ===== □. 목록 영역 ================================================= -->
  <bo-excel-down-modal :show="excelModal.show" domain="stSettleClose" area-nm="정산마감관리"
    ui-nm="정산마감" :columns="columns.baseGrid" :params="buildExcelParams()"
    @close="excelModal.show = false" />
</bo-page>
`,
};
