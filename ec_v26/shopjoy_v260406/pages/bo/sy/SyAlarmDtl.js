/* ShopJoy Admin - 알림관리 상세/등록 */
window.SyAlarmDtl = {
  name: 'SyAlarmDtl',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes', 'editId', 'viewMode'],
  setup(props) {
    const { reactive, computed, watch, onMounted, ref } = Vue;

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ alarm_types: [], alarm_statuses: [], alarm_target_types: [] });

    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.alarm_types = codeStore.sgGetGrpCodes('ALARM_TYPE');
        codes.alarm_statuses = codeStore.sgGetGrpCodes('ALARM_STATUS');
        codes.alarm_target_types = codeStore.sgGetGrpCodes('ALARM_TARGET_TYPE');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
      uiState.isPageCodeLoad = true;
    };

    const isAppReady = boUtil.useAppCodeReady(uiState, fnLoadCodes);

    // ── watch ────────────────────────────────────────────────────────────────


    const cfIsNew = computed(() => props.editId === null || props.editId === undefined);
    const cfSiteNm = computed(() => boUtil.getSiteNm());
    const form = reactive({
      alarmId: null, title: '', alarmTypeCd: '푸시', targetTypeCd: '전체', targetId: '',
      message: '', sendDate: '', statusCd: '임시',
    });
    const errors = reactive({});

    const schema = yup.object({
      title: yup.string().required('제목을 입력해주세요.'),
      message: yup.string().required('메시지를 입력해주세요.'),
    });

    const handleLoadDetail = async () => {
      if (cfIsNew.value) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.syAlarm.getById(props.editId, '알람관리', '상세조회');
        const data = res.data?.data;
        if (data) Object.assign(form, data);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 상세 조회
    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      if (!cfIsNew.value) { await handleLoadDetail(); }
    });

    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        console.error('[catch-info]', err);
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const ok = await props.showConfirm(cfIsNew.value ? '등록' : '저장', cfIsNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      try {
        const res = await (cfIsNew.value ? boApiSvc.syAlarm.create({ ...form }, '알람관리', '등록') : boApiSvc.syAlarm.update(form.alarmId, { ...form }, '알람관리', '저장'));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('syAlarmMng', { reload: true });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    // ── return ───────────────────────────────────────────────────────────────

    return { uiState, codes, cfIsNew, form, errors, handleSave, cfSiteNm };
  },
  template: /* html */`
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="page-title">{{ cfIsNew ? '알림 등록' : (viewMode ? '알림 상세' : '알림 수정') }}</div><span v-if="!cfIsNew" style="font-size:12px;color:#999;">#{{ form.alarmId }}</span></div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ cfSiteNm }}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:2">
        <label class="form-label">제목 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.title" placeholder="알림 제목" :readonly="viewMode" :class="errors.title ? 'is-invalid' : ''" />
        <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">유형</label>
        <select class="form-control" v-model="form.alarmTypeCd" :disabled="viewMode">
          <option v-for="c in codes.alarm_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" v-model="form.statusCd" :disabled="viewMode">
          <option v-for="c in codes.alarm_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">대상 유형</label>
        <select class="form-control" v-model="form.targetTypeCd" :disabled="viewMode">
          <option v-for="c in codes.alarm_target_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">대상 ID</label>
        <input class="form-control" v-model="form.targetId" placeholder="특정회원 ID (선택)" :readonly="viewMode" />
      </div>
      <div class="form-group">
        <label class="form-label">발송일시</label>
        <input class="form-control" type="datetime-local" v-model="form.sendDate" :readonly="viewMode" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">메시지 <span v-if="!viewMode" class="req">*</span></label>
      <textarea class="form-control" v-model="form.message" rows="4" placeholder="알림 메시지 내용" :readonly="viewMode" :class="errors.message ? 'is-invalid' : ''"></textarea>
      <span v-if="errors.message" class="field-error">{{ errors.message }}</span>
    </div>
    <div class="form-actions">
      <template v-if="viewMode">
        <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
        <button class="btn btn-secondary" @click="navigate('syAlarmMng')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click="handleSave">저장</button>
        <button class="btn btn-secondary" @click="navigate('syAlarmMng')">취소</button>
      </template>
    </div>
  </div>
</div>
`
};
