/* ShopJoy Admin - 정산기준관리 */
window.StConfigMng = {
  name: 'StConfigMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const uiState = reactive({ descOpen: false, isNew: false, error: null, loading: false, selectedId: null });
    const configs = reactive([]);

    const handleLoadList = async () => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.stSettleConfig.getPage({ pageNo: 1, pageSize: 100 }, '정산설정관리', '목록조회');
        const pageResult = res.data?.data;
        const pageList = pageResult?.pageList || [];
        configs.splice(0, configs.length, ...pageList);
      } catch (err) {
        console.error('[handleLoadList]', err);
        props.showToast?.(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 목록 초기 조회
    onMounted(() => {
      handleLoadList();
    });

        const form = reactive({});
    const errors = reactive({});

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

    const openEdit = (c) => {
      Object.assign(form, fnMapApiToUi(c));
      uiState.selectedId = c.settleConfigId;
      uiState.isNew = false;
      Object.keys(errors).forEach(k => delete errors[k]);
    };
    const openNew = () => {
      Object.assign(form, { settleConfigId: null, siteId: '01', siteNm: 'ShopJoy 01', settleCycleCd: 'MONTHLY', settleDay: 10, commissionRate: 10, minSettleAmt: 10000, useYn: 'Y', settleConfigRemark: '' });
      uiState.selectedId = '__new__';
      uiState.isNew = true;
      Object.keys(errors).forEach(k => delete errors[k]);
    };
    const closeForm = () => { uiState.selectedId = null; };

    const validate = () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      if (!form.settleCycleCd) errors.settleCycleCd = '정산주기를 선택하세요.';
      if (form.commissionRate === '' || form.commissionRate === null) errors.commissionRate = '수수료율을 입력하세요.';
      if (!form.settleDay) errors.settleDay = '정산일을 입력하세요.';
      return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
      if (!validate()) { props.showToast('입력 내용을 확인해주세요.', 'error'); return; }
      const ok = await props.showConfirm('저장', '정산기준을 저장하시겠습니까?');
      if (!ok) return;
      closeForm();
      const apiData = fnMapUiToApi(form);
      try {
        const res = await (uiState.isNew ? boApi.post('/bo/ec/st/config', apiData, coUtil.apiHdr('정산설정관리', '등록')) : boApi.put(`/bo/ec/st/config/${form.settleConfigId}`, apiData, coUtil.apiHdr('정산설정관리', '저장')));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('저장되었습니다.', 'success');
        await handleLoadList();
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const handleDelete = async (c) => {
      const cycleName = c.settleCycleNm || c.settleCycleCd;
      const ok = await props.showConfirm('삭제', `[${cycleName}] 정산기준을 삭제하시겠습니까?`);
      if (!ok) return;
      if (uiState.selectedId === c.settleConfigId) closeForm();
      try {
        const res = await boApi.delete(`/bo/ec/st/config/${c.settleConfigId}`, coUtil.apiHdr('정산설정관리', '삭제'));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
        await handleLoadList();
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const fnCycleCdToLabel = (cd) => ({ 'DAILY': '일정산', 'WEEKLY': '주정산', 'MONTHLY': '월정산' }[cd] || cd);
    const fnCycleBadge = (cd) => ({ 'DAILY': 'badge-orange', 'WEEKLY': 'badge-green', 'MONTHLY': 'badge-blue' }[cd] || 'badge-gray');

    // ── 공통코드 ─────────────────────────────────────────────────────────────
    const codes = reactive({ settle_cycles: [], use_yn: [] });

    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.settle_cycles = codeStore.snGetGrpCodes('SETTLE_CYCLE') || [];
        codes.use_yn = codeStore.snGetGrpCodes('USE_YN') || [];
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0;
    });

    watch(isAppReady, (newVal) => { if (newVal) fnLoadCodes(); });

    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });

    // ── return ───────────────────────────────────────────────────────────────

    return { uiState, configs, codes, form, errors, openEdit, openNew, closeForm, handleSave, handleDelete, fnCycleBadge, fnCycleCdToLabel, handleLoadList, fnMapUiToApi, fnMapApiToUi };
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
    <table class="bo-table">
      <thead><tr><th style="width:36px;text-align:center;">번호</th><th>사이트</th><th>카테고리</th><th>수수료율</th><th>정산주기</th><th>정산일</th><th>최소정산금</th><th>사용여부</th><th>비고</th><th>액션</th></tr></thead>
      <tbody>
        <tr v-for="(c, idx) in configs" :key="c?.settleConfigId" :class="{selected: uiState.selectedId===c.settleConfigId}">
          <td style="text-align:center;font-size:11px;color:#999;">{{ idx + 1 }}</td>
          <td>{{ c.siteNm }}</td>
          <td><strong>{{ c.categoryNm || c.vendorNm || '-' }}</strong></td>
          <td><strong>{{ c.commissionRate }}%</strong></td>
          <td><span class="badge" :class="fnCycleBadge(c.settleCycleCd)">{{ fnCycleCdToLabel(c.settleCycleCd) }}</span></td>
          <td>매월 {{ c.settleDay }}일</td>
          <td>{{ Number(c.minSettleAmt || 0).toLocaleString() }}원</td>
          <td><span class="badge" :class="c.useYn==='Y'?'badge-green':'badge-gray'">{{ c.useYn==='Y'?'사용':'미사용' }}</span></td>
          <td style="color:#888;font-size:12px">{{ c.settleConfigRemark }}</td>
          <td class="actions">
            <button class="btn btn-sm btn-primary" @click="openEdit(c)">수정</button>
            <button class="btn btn-sm btn-danger"  @click="handleDelete(c)">삭제</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ── 편집 폼 ─────────────────────────────────────────────────────────── -->
  <div v-if="uiState.selectedId" class="card" style="margin-top:12px">
    <div class="card-title" style="font-weight:700;margin-bottom:16px">{{ uiState.isNew ? '정산기준 추가' : '정산기준 수정' }}</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">카테고리</label>
        <input class="form-control" v-model="form.categoryNm" placeholder="카테고리명" />
      </div>
      <div class="form-group">
        <label class="form-label">수수료율(%) <span style="color:red">*</span></label>
        <input class="form-control" :class="{'is-invalid':errors.commissionRate}" v-model.number="form.commissionRate" type="number" min="0" max="100" step="0.01" />
        <div v-if="errors.commissionRate" class="field-error">{{ errors.commissionRate }}</div>
      </div>
      <div class="form-group">
        <label class="form-label">정산주기 <span style="color:red">*</span></label>
        <select class="form-control" :class="{'is-invalid':errors.settleCycleCd}" v-model="form.settleCycleCd">
          <option value="">선택</option><option v-for="c in codes.settle_cycles" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
        <div v-if="errors.settleCycleCd" class="field-error">{{ errors.settleCycleCd }}</div>
      </div>
      <div class="form-group">
        <label class="form-label">정산일 <span style="color:red">*</span></label>
        <input class="form-control" :class="{'is-invalid':errors.settleDay}" v-model.number="form.settleDay" type="number" min="1" max="31" />
        <div v-if="errors.settleDay" class="field-error">{{ errors.settleDay }}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">최소정산금(원)</label>
        <input class="form-control" v-model.number="form.minSettleAmt" type="number" min="0" />
      </div>
      <div class="form-group">
        <label class="form-label">사용여부</label>
        <select class="form-control" v-model="form.useYn">
          <option v-for="c in codes.use_yn" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">비고</label>
      <input class="form-control" v-model="form.settleConfigRemark" placeholder="비고 입력" />
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" @click="handleSave">저장</button>
      <button class="btn btn-secondary" @click="closeForm">취소</button>
    </div>
  </div>
</div>
`,
};
