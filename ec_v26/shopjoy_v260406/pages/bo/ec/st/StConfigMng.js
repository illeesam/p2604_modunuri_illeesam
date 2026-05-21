/* ShopJoy Admin - 정산기준관리 */
window.StConfigMng = {
  name: 'StConfigMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const uiState = reactive({ descOpen: false, isNew: false, error: null, loading: false, selectedId: null });
    const configs = reactive([]);

    /* handleLoadList */
    const handleLoadList = async () => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.stSettleConfig.getPage({ pageNo: 1, pageSize: 100 }, '정산설정관리', '목록조회');
        const pageResult = res.data?.data;
        const pageList = pageResult?.pageList || [];
        configs.splice(0, configs.length, ...pageList);
      } catch (err) {
        console.error('[handleLoadList]', err);
        showToast?.(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleLoadList();
    });

        const form = reactive({});
    const errors = reactive({});

    /* fnMapUiToApi */
    const fnMapUiToApi = (uiForm) => ({
      settleConfigId: uiForm.settleConfigId,
      siteId: uiForm.siteId,
      vendorId: uiForm.vendorId || null,
      categoryId: uiForm.categoryId || null,
      settleCycleCd: uiForm.settleCycleCd,
      settleDay: uiForm.settleDay,
      commissionRate: uiForm.commissionRate,
      minSettleAmt: uiForm.minSettleAmt,
      settleConfigRemark: uiForm.settleConfigRemark,
      useYn: uiForm.useYn
    });

    /* fnMapApiToUi */
    const fnMapApiToUi = (apiData) => ({
      settleConfigId: apiData.settleConfigId,
      siteId: apiData.siteId,
      siteNm: apiData.siteNm || 'ShopJoy 01',
      vendorId: apiData.vendorId || null,
      vendorNm: apiData.vendorNm || '',
      categoryId: apiData.categoryId || null,
      categoryNm: apiData.categoryNm || '',
      settleCycleCd: apiData.settleCycleCd,
      settleCycleNm: apiData.settleCycleNm || apiData.settleCycleCd,
      settleDay: apiData.settleDay,
      commissionRate: apiData.commissionRate,
      minSettleAmt: apiData.minSettleAmt,
      settleConfigRemark: apiData.settleConfigRemark,
      useYn: apiData.useYn
    });

    /* openEdit */
    const openEdit = (c) => {
      Object.assign(form, fnMapApiToUi(c));
      uiState.selectedId = c.settleConfigId;
      uiState.isNew = false;
      Object.keys(errors).forEach(k => delete errors[k]);
    };

    /* openNew */
    const openNew = () => {
      Object.assign(form, { settleConfigId: null, siteId: '01', siteNm: 'ShopJoy 01', settleCycleCd: 'MONTHLY', settleDay: 10, commissionRate: 10, minSettleAmt: 10000, useYn: 'Y', settleConfigRemark: '' });
      uiState.selectedId = '__new__';
      uiState.isNew = true;
      Object.keys(errors).forEach(k => delete errors[k]);
    };

    /* closeForm */
    const closeForm = () => { uiState.selectedId = null; };

    /* validate */
    const validate = () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      if (!form.settleCycleCd) errors.settleCycleCd = '정산주기를 선택하세요.';
      if (form.commissionRate === '' || form.commissionRate === null) errors.commissionRate = '수수료율을 입력하세요.';
      if (!form.settleDay) errors.settleDay = '정산일을 입력하세요.';
      return Object.keys(errors).length === 0;
    };

    /* 저장 */
    const handleSave = async () => {
      if (!validate()) { showToast('입력 내용을 확인해주세요.', 'error'); return; }
      const ok = await showConfirm('저장', '정산기준을 저장하시겠습니까?');
      if (!ok) return;
      closeForm();
      const apiData = fnMapUiToApi(form);
      try {
        const res = await (uiState.isNew ? boApiSvc.stSettleConfig.create(apiData, '정산설정관리', '등록') : boApiSvc.stSettleConfig.update(form.settleConfigId, apiData, '정산설정관리', '저장'));
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('저장되었습니다.', 'success');
        await handleLoadList();
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 삭제 */
    const handleDelete = async (c) => {
      const cycleName = c.settleCycleNm || c.settleCycleCd;
      const ok = await showConfirm('삭제', `[${cycleName}] 정산기준을 삭제하시겠습니까?`);
      if (!ok) return;
      if (uiState.selectedId === c.settleConfigId) closeForm();
      try {
        const res = await boApiSvc.stSettleConfig.remove(c.settleConfigId, '정산설정관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
        await handleLoadList();
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* fnCycleCdToLabel */
    const fnCycleCdToLabel = (cd) => ({ 'DAILY': '일정산', 'WEEKLY': '주정산', 'MONTHLY': '월정산' }[cd] || cd);

    /* fnCycleBadge */
    const fnCycleBadge = (cd) => ({ 'DAILY': 'badge-orange', 'WEEKLY': 'badge-green', 'MONTHLY': 'badge-blue' }[cd] || 'badge-gray');

    // -- 공통코드 -------------------------------------------------------------
    const codes = reactive({ settle_cycles: [], use_yn: [] });

    /* fnLoadCodes */
    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.settle_cycles = codeStore.sgGetGrpCodes('SETTLE_CYCLE');
        codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });

    // -- return ---------------------------------------------------------------

    const baseGridColumns = [
      { key: 'siteNm',             label: '사이트' },
      { key: 'categoryNm',         label: '카테고리', cellStyle: 'font-weight:700',
        fmt: (v, row) => row.categoryNm || row.vendorNm || '-' },
      { key: 'commissionRate',     label: '수수료율', cellStyle: 'font-weight:700',
        fmt: (v) => v + '%' },
      { key: 'settleCycleCd',      label: '정산주기',
        badge: (row) => fnCycleBadge(row.settleCycleCd), fmt: (v) => fnCycleCdToLabel(v) },
      { key: 'settleDay',          label: '정산일', fmt: (v) => '매월 ' + v + '일' },
      { key: 'minSettleAmt',       label: '최소정산금',
        fmt: (v) => Number(v || 0).toLocaleString() + '원' },
      { key: 'useYn',              label: '사용여부',
        badge: (row) => row.useYn === 'Y' ? 'badge-green' : 'badge-gray',
        fmt: (v) => v === 'Y' ? '사용' : '미사용' },
      { key: 'settleConfigRemark', label: '비고', cellStyle: 'color:#888' },
    ];

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - 편집 폼 ========================
    const baseFormColumns = [
      { key: 'categoryNm',     label: '카테고리', type: 'text', placeholder: '카테고리명' },
      { key: 'commissionRate', label: '수수료율(%)', type: 'number', required: true, min: 0, max: 100 },
      { key: 'settleCycleCd',  label: '정산주기', type: 'select', required: true, nullLabel: '선택',
        options: () => codes.settle_cycles },
      { key: 'settleDay',      label: '정산일', type: 'number', required: true, min: 1, max: 31 },
      { type: 'rowBreak' },
      { key: 'minSettleAmt',   label: '최소정산금(원)', type: 'number', min: 0 },
      { key: 'useYn',          label: '사용여부', type: 'select', options: () => codes.use_yn },
      { type: 'rowBreak' },
      { key: 'settleConfigRemark', label: '비고', type: 'text', placeholder: '비고 입력', colSpan: 4 },
    ];

    return { uiState, configs, baseGridColumns, codes, form, errors, openEdit, openNew, closeForm, handleSave, handleDelete, fnCycleBadge, fnCycleCdToLabel, handleLoadList, fnMapUiToApi, fnMapApiToUi, baseFormColumns };
  },
  template: /* html */`
<div>
  <div class="page-title">정산기준관리</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">사이트·업체 유형별 정산 수수료율, 지급 주기, 최소 정산금액 등 정산 기준을 설정합니다.</span>
    <button class="page-desc-toggle" @click="uiState.descOpen=!uiState.descOpen">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" class="page-desc-detail">• 정산 주기: 월정산 / 주정산 / 건별정산
• 수수료율(%)은 매출 기준으로 적용되며, 클레임 환불 시 차감됩니다.
• 자동마감(autoCloseYn=Y) 설정 시 지급일에 자동으로 정산이 마감됩니다.
• 설정 변경은 변경 이후 수집분부터 적용됩니다.</div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title">정산기준 목록</span>
      <span class="list-count">총 {{ configs.length }}건</span>
      <div style="margin-left:auto"><button class="btn btn-primary" @click="openNew">+ 기준 추가</button></div>
    </div>
    <bo-grid
      :columns="baseGridColumns" :rows="configs" row-key="settleConfigId"
      list-title="목록" :count-text="configs.length + '건'" :row-actions="true"
      :row-class="(c) => uiState.selectedId===c.settleConfigId ? 'selected' : ''">
      <template #head-actions>액션</template>
      <template #row-actions="{ row: c }">
        <button class="btn btn-sm btn-primary" @click="openEdit(c)">수정</button>
        <button class="btn btn-sm btn-danger"  @click="handleDelete(c)">삭제</button>
      </template>
    </bo-grid>
  </div>

  <!-- 편집 폼 (BoFormArea 자동 렌더) -->
  <div v-if="uiState.selectedId" class="card" style="margin-top:12px">
    <div class="card-title" style="font-weight:700;margin-bottom:16px">{{ uiState.isNew ? '정산기준 추가' : '정산기준 수정' }}</div>
    <bo-form-area :columns="baseFormColumns" :form="form" :errors="errors"
      :cols="4"
      @save="handleSave" @cancel="closeForm" />
  </div>
</div>
`,
};
