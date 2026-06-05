/* ShopJoy Admin - 정산기준관리 */
window.StConfigMng = {
  name: 'StConfigMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 ################################################## */
    const { ref, reactive, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const uiState = reactive({ isNew: false, error: null, loading: false, selectedId: null });
    const configs = reactive([]);

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ StConfigMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'configs-add') {
        return openNew();
      } else if (cmd === 'form-save') {
        return handleSave();
      } else if (cmd === 'form-cancel') {
        return closeForm();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ StConfigMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'configs-rowEdit') {
        return openEdit(param);
      } else if (cmd === 'configs-rowDelete') {
        return handleDelete(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* handleLoadList — 목록 조회 */
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
      if (isAppReady.value) { fnLoadCodes(); }
      handleLoadList();
    });

        const form = reactive({});
    const errors = reactive({});

    /* fnMapUiToApi — 유틸 */
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

    /* fnMapApiToUi — 유틸 */
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

    /* openEdit — 열기 */
    const openEdit = (c) => {
      Object.assign(form, fnMapApiToUi(c));
      uiState.selectedId = c.settleConfigId;
      uiState.isNew = false;
      Object.keys(errors).forEach(k => delete errors[k]);
    };

    /* openNew — 신규 열기 */
    const openNew = () => {
      Object.assign(form, { settleConfigId: null, siteId: '01', siteNm: 'ShopJoy 01', settleCycleCd: 'MONTHLY', settleDay: 10, commissionRate: 10, minSettleAmt: 10000, useYn: 'Y', settleConfigRemark: '' });
      uiState.selectedId = '__new__';
      uiState.isNew = true;
      Object.keys(errors).forEach(k => delete errors[k]);
    };

    /* closeForm — 닫기 */
    const closeForm = () => { uiState.selectedId = null; };

    /* validate — 검증 */
    const validate = () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      if (!form.settleCycleCd) { errors.settleCycleCd = '정산주기를 선택하세요.'; }
      if (form.commissionRate === '' || form.commissionRate === null) { errors.commissionRate = '수수료율을 입력하세요.'; }
      if (!form.settleDay) { errors.settleDay = '정산일을 입력하세요.'; }
      return Object.keys(errors).length === 0;
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      if (!validate()) { showToast('입력 내용을 확인해주세요.', 'error'); return; }
      const ok = await showConfirm('저장', '정산기준을 저장하시겠습니까?');
      if (!ok) { return; }
      closeForm();
      const apiData = fnMapUiToApi(form);
      try {
        const res = await (uiState.isNew ? boApiSvc.stSettleConfig.create(apiData, '정산설정관리', '등록') : boApiSvc.stSettleConfig.update(form.settleConfigId, apiData, '정산설정관리', '저장'));
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('저장되었습니다.', 'success'); }
        await handleLoadList();
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* handleDelete — 삭제 */
    const handleDelete = async (c) => {
      const cycleName = c.settleCycleNm || c.settleCycleCd;
      const ok = await showConfirm('삭제', `[${cycleName}] 정산기준을 삭제하시겠습니까?`);
      if (!ok) { return; }
      if (uiState.selectedId === c.settleConfigId) { closeForm(); }
      try {
        const res = await boApiSvc.stSettleConfig.remove(c.settleConfigId, '정산설정관리', '삭제');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
        await handleLoadList();
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* fnCycleCdToLabel — 유틸 */
    const fnCycleCdToLabel = (cd) => ({ 'DAILY': '일정산', 'WEEKLY': '주정산', 'MONTHLY': '월정산' }[cd] || cd);

    /* fnCycleBadge — 유틸 */
    const fnCycleBadge = (cd) => ({ 'DAILY': 'badge-orange', 'WEEKLY': 'badge-green', 'MONTHLY': 'badge-blue' }[cd] || 'badge-gray');

    // -- 공통코드 -------------------------------------------------------------
    const codes = reactive({ settle_cycles: [], use_yn: [] });

    /* fnLoadCodes — 공통코드 로드 */
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
    // --- [컬럼 정의] ---
    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // 기본 그리드
    const columns = {};
    columns.baseGrid = [
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

    // 기본 폼
    columns.baseForm = [
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

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      uiState, codes, configs, form, errors,
      handleBtnAction, handleSelectAction,
      fnCycleBadge, fnCycleCdToLabel,
    };
  },
  template: /* html */`
<bo-page title="정산기준관리"
  desc-summary="사이트·업체 유형별 정산 수수료율, 지급 주기, 최소 정산금액 등 정산 기준을 설정합니다."
  desc-detail="• 정산 주기: 월정산 / 주정산 / 건별정산&#10;• 수수료율(%)은 매출 기준으로 적용되며, 클레임 환불 시 차감됩니다.&#10;• 자동마감(autoCloseYn=Y) 설정 시 지급일에 자동으로 정산이 마감됩니다.&#10;• 설정 변경은 변경 이후 수집분부터 적용됩니다.">
  <!-- ===== ■. 목록 영역 ================================================= -->
  <bo-container title="정산기준 목록" :count-text="'총 ' + configs.length + '건'">
    <template #toolbar-actions>
      <button class="btn btn-primary btn-sm" @click="handleBtnAction('configs-add')">
        + 기준 추가
      </button>
    </template>
    <bo-grid bare
      :columns="columns.baseGrid" :rows="configs" row-key="settleConfigId" :selected-key="uiState.selectedId"
      :row-actions="true"
      :row-class="(c) => uiState.selectedId===c.settleConfigId ? 'selected' : ''">
      <template #head-actions>
        <th style="text-align:right">액션</th>
      </template>
      <template #row-actions="{ row: c }">
        <div class="actions">
          <button class="btn btn-xs btn-primary" @click="handleSelectAction('configs-rowEdit', c)">
            수정
          </button>
          <button class="btn btn-xs btn-danger"  @click="handleSelectAction('configs-rowDelete', c)">
            삭제
          </button>
        </div>
      </template>
    </bo-grid>
  </bo-container>
  <!-- ===== ■. 상세 패널 =================================================== -->
  <bo-container bare v-if="uiState.selectedId">
    <div class="card" style="margin-top:12px">
      <div class="card-title" style="font-weight:700;margin-bottom:16px">
        {{ uiState.isNew ? '정산기준 추가' : '정산기준 수정' }}
      </div>
      <bo-form-area :columns="columns.baseForm" :form="form" :errors="errors"
        :cols="3"
        @save="handleBtnAction('form-save')" @cancel="handleBtnAction('form-cancel')" />
    </div>
  </bo-container>
</bo-page>
`,
};
