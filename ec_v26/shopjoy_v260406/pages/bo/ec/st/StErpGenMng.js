/* ShopJoy Admin - ERP 전표생성 */
window.StErpGenMng = {
  name: 'StErpGenMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== [01] 초기 변수 정의 ==================================================
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false });
    const codes = reactive({
      erp_statuses: [],
      erp_voucher_types: [],
    });

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ StErpGenMng.js : handleBtnAction -> ', cmd, param);
      // 대상월/유형 기반 데이터 조회 (미리보기)
      if (cmd === 'preview-search') {
        return handleSearchData('DEFAULT');
      // ERP 전표 생성 실행
      } else if (cmd === 'preview-generate') {
        return doGenerate();
      // 안내 설명 토글
      } else if (cmd === 'desc-toggle') {
        uiState.descOpen = !uiState.descOpen;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    // ===== [03] 초기 함수 (마운트 / 코드 로드 / watch) ==============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.erp_statuses = codeStore.sgGetGrpCodes('ERP_STATUS');
        codes.erp_voucher_types = codeStore.sgGetGrpCodes('ERP_VOUCHER_TYPE_KR');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);
    const targetMon = ref(new Date().toISOString().slice(0, 7));
    const slipType  = ref('정산');

    const orderList = reactive([]);
    const vendorList = reactive([]);
    const cfVendors = computed(() => vendorList.filter(v => v.vendorType === '판매업체'));

    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ====================

    /* handleSearchData — 처리 */
    const handleSearchData = async (searchType = 'DEFAULT') => {
      try {
        const [resO, resV, resH] = await Promise.all([
          boApiSvc.odOrder.getPage({ pageNo: 1, pageSize: 10000 }, 'ERP전표생성', '목록조회'),
          boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 10000 }, 'ERP전표생성', '목록조회'),
          boApiSvc.stErp.getGenPage({ targetMon: targetMon.value, pageNo: 1, pageSize: 100 }, 'ERP전표생성', '이력조회'),
        ]);
        orderList.splice(0, orderList.length, ...(resO.data?.data?.pageList || resO.data?.data?.list || []));
        vendorList.splice(0, vendorList.length, ...(resV.data?.data?.pageList || resV.data?.data?.list || []));
        genHistory.splice(0, genHistory.length, ...(resH.data?.data?.pageList || resH.data?.data?.list || []));
      } catch (_) { console.error('[catch-info]', _); }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleSearchData('DEFAULT'); });

    const cfPreviewRows = computed(() => {
      return cfVendors.value.map(v => {
        const vOrders = orderList.filter(o => o.vendorId === v.vendorId && o.status !== '취소됨' && o.orderDate.startsWith(targetMon.value));
        const sales   = vOrders.reduce((s, o) => s + o.totalPrice, 0);
        const comm    = Math.round(sales * 0.10);
        const settle  = sales - comm;

        return { vendorNm: v.vendorNm, debit: '미지급금', credit: '현금', debitAmt: settle, creditAmt: settle, description: `${uiState.targetMon} ${v.vendorNm} 정산지급` };
      }).filter(r => r.debitAmt > 0);
    });

    const genHistory = reactive([]);

    /* doGenerate — 실행 */
    const doGenerate = async () => {
      if (!cfPreviewRows.value.length) { showToast('생성할 전표 데이터가 없습니다.', 'error'); return; }
      const ok = await showConfirm('ERP 전표생성', `${targetMon.value} ${slipType.value} 전표를 생성하시겠습니까?`);
      if (!ok) { return; }
      genHistory.unshift({
        genId: 'GEN-' + targetMon.value, genMon: targetMon.value, slipType: slipType.value,
        slipCnt: cfPreviewRows.value.length,
        totalAmt: cfPreviewRows.value.reduce((s, r) => s + r.debitAmt, 0),
        genDate: new Date().toISOString().slice(0,10), status: '생성완료', regUserNm: '관리자',
      });
      try {
        const res = await boApiSvc.stErp.gen({ targetMon: targetMon.value, slipType: slipType.value, rows: cfPreviewRows.value }, '정산ERP생성', '저장');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('ERP 전표가 생성되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* fnStatusBadge */
    const _ERP_STATUS_FB = { '전송완료':'badge-green', '생성완료':'badge-blue', '오류':'badge-red' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('ERP_STATUS', s, _ERP_STATUS_FB[s] || 'badge-gray');

    /* fmtW — 포맷 W */
    const fmtW = n => Number(n||0).toLocaleString() + '원';

    /* onSearch — 조회 */
    const onSearch = async () => { await handleSearchData('DEFAULT'); };

    // ===== [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ====================

    const previewGridColumns = [
      { key: 'debit',       label: '차변계정' },
      { key: 'credit',      label: '대변계정' },
      { key: 'debitAmt',    label: '차변금액', fmt: fmtW, cellStyle: 'font-weight:700;color:#3498db' },
      { key: 'creditAmt',   label: '대변금액', fmt: fmtW, cellStyle: 'font-weight:700;color:#27ae60' },
      { key: 'description', label: '적요', cellStyle: 'color:#666' },
    ];
    // --- [컬럼 정의] ---
    const histGridColumns = [
      { key: 'genMon',    label: '정산월', cellStyle: 'font-weight:700' },
      { key: 'slipType',  label: '전표유형', badge: () => 'badge-blue' },
      { key: 'slipCnt',   label: '전표수', fmt: (v) => v + '건' },
      { key: 'totalAmt',  label: '총금액', fmt: fmtW, cellStyle: 'font-weight:700' },
      { key: 'genDate',   label: '생성일' },
      { key: 'status',    label: '상태', badge: (row) => fnStatusBadge(row.status) },
      { key: 'regUserNm', label: '담당자' },
    ];

    // ===== 생성 설정 폼 (BoFormArea) =======================================
    // input[type=month]는 BoFormArea가 미지원 → slot 으로 처리
    const baseFormColumns = [
      { key: 'targetMon', label: '정산월', type: 'slot', name: 'targetMon' },
      { key: 'slipType',  label: '전표유형', type: 'select', width: '160px',
        options: () => codes.erp_voucher_types },
      { key: '_actions', label: ' ', type: 'slot', name: 'actions', hideLabel: true },
    ];
    const settingForm = reactive({ slipType: slipType.value });
    watch(() => settingForm.slipType, (v) => { slipType.value = v; });
    // ===== [06] return (템플릿 노출) ==============================================

    return {
      uiState, codes, targetMon, slipType, genHistory, settingForm,                  // 상태 / 데이터
      previewGridColumns, histGridColumns, baseFormColumns,                           // 컬럼 정의
      handleBtnAction,                                                                // dispatch
      cfPreviewRows,                                                                  // computed
      fnStatusBadge, fmtW,                                                            // 헬퍼
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    ERP 전표생성
  </div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div class="page-desc-bar">
    <span class="page-desc-summary">
      마감된 정산 데이터를 ERP 연동용 분개 전표 형식으로 변환·생성합니다.
    </span>
    <button class="page-desc-toggle" @click="handleBtnAction('desc-toggle')">
      {{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}
    </button>
    <div v-if="uiState.descOpen" class="page-desc-detail">
      • 대상 월과 전표 유형(정산지급/수수료 등)을 선택 후 [전표생성]을 실행합니다. • 생성된 전표는 차변(미지급금) / 대변(현금) 구조로 자동 분개됩니다. • 생성 이력은 하단 목록에서 확인하며, ERP 전송 상태를 추적합니다. • 전표 내용 확인은 ERP 전표조회(StErpViewMng)에서 합니다.
    </div>
  </div>
  <!-- ===== □. 영역 ====================================================== -->
  <!-- ===== ■. 생성 설정 =================================================== -->
  <div class="card">
    <div style="font-weight:700;margin-bottom:12px">
      전표 생성 설정
    </div>
    <!-- ===== ■.■. 폼 영역 ================================================== -->
    <bo-form-area :columns="baseFormColumns" :form="settingForm" :cols="3" :show-actions="false">
      <template #targetMon>
        <input class="form-control" v-model="targetMon" type="month" style="width:160px" />
      </template>
      <template #actions>
        <div style="display:flex;align-items:center;gap:8px;min-height:34px;">
          <button class="btn btn-secondary" @click="handleBtnAction('preview-search')">
            조회
          </button>
          <button class="btn btn-primary" @click="handleBtnAction('preview-generate')">
            📋 ERP 전표생성
          </button>
        </div>
      </template>
    </bo-form-area>
    <!-- ===== □.□. 폼 영역 ================================================== -->
    <!-- ===== ■.■. 미리보기 ================================================== -->
    <div v-if="cfPreviewRows.length" style="margin-top:16px">
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid
        :columns="previewGridColumns" :rows="cfPreviewRows"
        :list-title="'전표 미리보기'" :count-text="cfPreviewRows.length + '건'">
      </bo-grid>
    </div>
    <div v-else style="color:#999;margin-top:12px">
      해당 월의 생성 대상 전표가 없습니다.
    </div>
  </div>
  <!-- ===== □.□. 미리보기 ================================================== -->
  <!-- ===== □. 생성 설정 =================================================== -->
  <!-- ===== ■. 생성 이력 =================================================== -->
  <div class="card" style="margin-top:12px">
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid
      :columns="histGridColumns" :rows="genHistory" row-key="genId"
      list-title="전표생성 이력" :count-text="genHistory.length + '건'">
    </bo-grid>
  </div>
</div>
<!-- ===== □.□. 목록 영역 ================================================= -->
<!-- ===== □. 생성 이력 =================================================== -->
`,
};
