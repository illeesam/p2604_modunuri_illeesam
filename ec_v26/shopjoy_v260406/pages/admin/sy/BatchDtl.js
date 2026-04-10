/* ShopJoy Admin - 배치스케즐 상세/등록 */
window.BatchDtl = {
  name: 'BatchDtl',
  props: ['navigate', 'adminData', 'showToast', 'editId'],
  setup(props) {
    const { reactive, computed, onMounted } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const siteName = computed(() => window.adminCommonFilter?.site?.siteName || 'ShopJoy');
    const form = reactive({
      batchName: '', batchCode: '', description: '', cron: '0 0 * * *', status: '활성',
    });

    onMounted(() => {
      if (!isNew.value) {
        const b = props.adminData.batches.find(x => x.batchId === props.editId);
        if (b) Object.assign(form, { batchName: b.batchName, batchCode: b.batchCode, description: b.description, cron: b.cron, status: b.status });
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

    const save = () => {
      if (!form.batchName || !form.batchCode || !form.cron) { props.showToast('필수 항목을 입력해주세요.', 'error'); return; }
      if (isNew.value) {
        props.adminData.batches.push({
          ...form, batchId: props.adminData.nextId(props.adminData.batches, 'batchId'),
          lastRun: '-', nextRun: '-', runStatus: '대기', runCount: 0,
          regDate: new Date().toISOString().slice(0, 10),
        });
        props.showToast('배치가 등록되었습니다.');
      } else {
        const idx = props.adminData.batches.findIndex(x => x.batchId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.batches[idx], { batchName: form.batchName, batchCode: form.batchCode, description: form.description, cron: form.cron, status: form.status });
        props.showToast('저장되었습니다.');
      }
      props.navigate('syBatchMng');
    };

    return { isNew, form, save, CRON_PRESETS, siteName };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '배치 등록' : '배치 수정' }}</div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ siteName }}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">배치명 <span class="req">*</span></label>
        <input class="form-control" v-model="form.batchName" placeholder="배치 이름" />
      </div>
      <div class="form-group">
        <label class="form-label">배치코드 <span class="req">*</span></label>
        <input class="form-control" v-model="form.batchCode" placeholder="ORDER_AUTO_COMPLETE" style="text-transform:uppercase;" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">설명</label>
        <input class="form-control" v-model="form.description" placeholder="배치 처리 내용 설명" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">Cron 표현식 <span class="req">*</span>
          <span style="font-size:11px;color:#888;margin-left:8px;">분 시 일 월 요일</span>
        </label>
        <input class="form-control" v-model="form.cron" placeholder="0 0 * * *" />
      </div>
    </div>
    <div style="margin-bottom:16px;padding:10px 12px;background:#f8f9fa;border-radius:6px;">
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
        <select class="form-control" v-model="form.status">
          <option>활성</option><option>비활성</option>
        </select>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('syBatchMng')">취소</button>
    </div>
  </div>
</div>
`
};
