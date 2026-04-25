/* ShopJoy Admin - 공통코드 상세/등록 */
window.SyCodeDtl = {
  name: 'SyCodeDtl',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes', 'editId'],
  setup(props) {
    const { reactive, computed, onMounted, ref } = Vue;

    const codes = reactive([]);
    const loading = ref(false);
    const error = ref(null);

    // onMounted에서 API 로드
    const fetchData = async () => {
      loading.value = true;
      try {
        const res = await window.boApi.get('/bo/sy/code/page', {
          params: { pageNo: 1, pageSize: 10000 }
        });
        codes = res.data?.data?.list || [];
        error.value = null;
      } catch (err) {
        error.value = err.message;
        if (props.showToast) props.showToast('SyCode 로드 실패', 'error');
      } finally {
        loading.value = false;
      }
    };
    onMounted(() => { fetchData(); });
    const cfIsNew = computed(() => props.editId === null || props.editId === undefined);
    const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());
    const form = reactive({
      codeId: null, codeGrp: '', codeLabel: '', codeValue: '', sortOrd: 1, useYn: 'Y', remark: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      codeGrp: yup.string().required('코드그룹을 입력해주세요.'),
      codeLabel: yup.string().required('코드라벨을 입력해주세요.'),
      codeValue: yup.string().required('코드값을 입력해주세요.'),
    });

    onMounted(() => {
      if (!cfIsNew.value) {
        const c = codes.find(x => x.codeId === props.editId);
        if (c) Object.assign(form, { ...c });
      }
    });

    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const ok = await props.showConfirm(cfIsNew.value ? '등록' : '저장', cfIsNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      if (cfIsNew.value) {
        codes.push({ ...form, codeId: nextId.value(codes, 'codeId'), sortOrd: Number(form.sortOrd) || 1 });
      } else {
        const idx = codes.findIndex(x => x.codeId === props.editId);
        if (idx !== -1) Object.assign(codes[idx], { ...form, sortOrd: Number(form.sortOrd) || 1 });
      }
      try {
        const res = await (cfIsNew.value ? window.boApi.post(`/bo/sy/code/${form.codeId}`, { ...form }) : window.boApi.put(`/bo/sy/code/${form.codeId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('syCodeMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    return { codes, loading, error, cfIsNew, form, errors, handleSave, cfSiteNm };
  },
  template: /* html */`
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="page-title">{{ cfIsNew ? '공통코드 등록' : '공통코드 수정' }}</div><span v-if="!cfIsNew" style="font-size:12px;color:#999;">#{{ form.codeId }}</span></div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ cfSiteNm }}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">코드그룹 (code_grp) <span class="req">*</span></label>
        <input class="form-control" v-model="form.codeGrp" placeholder="예: ORDER_STATUS" style="text-transform:uppercase;" :class="errors.codeGrp ? 'is-invalid' : ''" />
        <span v-if="errors.codeGrp" class="field-error">{{ errors.codeGrp }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">코드라벨 (code_label) <span class="req">*</span></label>
        <input class="form-control" v-model="form.codeLabel" placeholder="예: 주문완료" :class="errors.codeLabel ? 'is-invalid' : ''" />
        <span v-if="errors.codeLabel" class="field-error">{{ errors.codeLabel }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">코드값 (code_value) <span class="req">*</span></label>
        <input class="form-control" v-model="form.codeValue" placeholder="예: ORDER_COMPLETE" :class="errors.codeValue ? 'is-invalid' : ''" />
        <span v-if="errors.codeValue" class="field-error">{{ errors.codeValue }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">정렬순서</label>
        <input class="form-control" type="number" v-model.number="form.sortOrd" min="1" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사용여부</label>
        <select class="form-control" v-model="form.useYn">
          <option value="Y">사용</option><option value="N">미사용</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">비고</label>
        <input class="form-control" v-model="form.remark" />
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" @click="handleSave">저장</button>
      <button class="btn btn-secondary" @click="navigate('syCodeMng')">취소</button>
    </div>
  </div>
</div>
`
};
