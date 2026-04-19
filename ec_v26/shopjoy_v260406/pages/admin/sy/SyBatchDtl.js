/* ShopJoy Admin - 배치스케즐 상세/등록 */
window.SyBatchDtl = {
  name: 'SyBatchDtl',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes', 'editId', 'viewMode'],
  setup(props) {
    const { reactive, computed, onMounted } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const form = reactive({
      batchId: null, batchNm: '', batchCode: '', description: '', cron: '0 0 * * *', statusCd: '활성',
    });
    const errors = reactive({});

    const schema = yup.object({
      batchNm: yup.string().required('배치명을 입력해주세요.'),
      batchCode: yup.string().required('배치코드를 입력해주세요.'),
      cron: yup.string().required('Cron 표현식을 입력해주세요.'),
    });

    onMounted(() => {
      if (!isNew.value) {
        const b = props.adminData.batches.find(x => x.batchId === props.editId);
        if (b) Object.assign(form, { batchNm: b.batchNm, batchCode: b.batchCode, description: b.description, cron: b.cron, statusCd: b.statusCd });
      }
    });

    const CRON_PRESETS = [
      { label: '매일 자정 (0 0 * * *)', value: '0 0 * * *' },
      { label: '매일 오전 1시 (0 1 * * *)', value: '0 1 * * *' },
      { label: '매일 오전 2시 (0 2 * * *)', value: '0 2 * * *' },
      { label: '매시간 (0 * * * *)', value: '0 * * * *' },
      { label: '2시간마다 (0 */2 * * *)', value: '0 */2 * * *' },
      { label: '매주 일요일 자정 (0 0 * * 0)', value: '0 0 * * 0' },
      { label: '매월 1일 오전 8시 (0 8 1 * *)', value: '0 8 1 * *' },
    ];

    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const ok = await props.showConfirm(isNew.value ? '등록' : '저장', isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      if (isNew.value) {
        props.adminData.batches.push({ ...form, batchId: props.adminData.nextId(props.adminData.batches, 'batchId'), lastRun: '-', nextRun: '-', runStatus: '대기', runCount: 0, regDate: new Date().toISOString().slice(0, 10) });
      } else {
        const idx = props.adminData.batches.findIndex(x => x.batchId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.batches[idx], { batchNm: form.batchNm, batchCode: form.batchCode, description: form.description, cron: form.cron, statusCd: form.statusCd });
      }
      try {
        const res = await (isNew.value ? window.adminApi.post(`batches/${form.batchId}`, { ...form }) : window.adminApi.put(`batches/${form.batchId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(isNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('syBatchMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    return { isNew, form, errors, save, CRON_PRESETS, siteNm };
  },
  template: /* html */`
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="page-title">{{ isNew ? '배치 등록' : (viewMode ? '배치 상세' : '배치 수정') }}</div><span v-if="!isNew" style="font-size:12px;color:#999;">#{{ form.batchId }}</span></div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ siteNm }}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">배치명 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.batchNm" placeholder="배치 이름" :readonly="viewMode" :class="errors.batchNm ? 'is-invalid' : ''" />
        <span v-if="errors.batchNm" class="field-error">{{ errors.batchNm }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">배치코드 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.batchCode" placeholder="ORDER_AUTO_COMPLETE" style="text-transform:uppercase;" :readonly="viewMode" :class="errors.batchCode ? 'is-invalid' : ''" />
        <span v-if="errors.batchCode" class="field-error">{{ errors.batchCode }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">설명</label>
        <input class="form-control" v-model="form.description" placeholder="배치 처리 내용 설명" :readonly="viewMode" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">Cron 표현식 <span v-if="!viewMode" class="req">*</span>
          <span style="font-size:11px;color:#888;margin-left:8px;">분 시 일 월 요일</span>
        </label>
        <input class="form-control" v-model="form.cron" placeholder="0 0 * * *" :readonly="viewMode" :class="errors.cron ? 'is-invalid' : ''" />
        <span v-if="errors.cron" class="field-error">{{ errors.cron }}</span>
      </div>
    </div>
    <div v-if="!viewMode" style="margin-bottom:16px;padding:10px 12px;background:#f8f9fa;border-radius:6px;">
      <div style="font-size:12px;color:#666;margin-bottom:8px;font-weight:600;">Cron 프리셋</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        <button v-for="p in CRON_PRESETS" :key="p.value"
          class="btn btn-secondary btn-sm"
          style="font-size:11px;"
          @click="form.cron = p.value">{{ p.label }}</button>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">활성여부</label>
        <select class="form-control" v-model="form.statusCd" :disabled="viewMode">
          <option>활성</option><option>비활성</option>
        </select>
      </div>
    </div>
    <div class="form-actions">
      <template v-if="viewMode">
        <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
        <button class="btn btn-secondary" @click="navigate('syBatchMng')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('syBatchMng')">취소</button>
      </template>
    </div>
  </div>
</div>
`
};
