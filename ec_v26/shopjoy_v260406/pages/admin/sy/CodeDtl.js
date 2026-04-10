/* ShopJoy Admin - 공통코드 상세/등록 */
window.CodeDtl = {
  name: 'CodeDtl',
  props: ['navigate', 'adminData', 'showToast', 'editId'],
  setup(props) {
    const { reactive, computed, onMounted } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const siteName = computed(() => window.adminCommonFilter?.site?.siteName || 'ShopJoy');
    const form = reactive({
      codeGrp: '', codeLabel: '', codeValue: '', sortOrd: 1, useYn: 'Y', remark: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      codeGrp: yup.string().required('코드그룹을 입력해주세요.'),
      codeLabel: yup.string().required('코드라벨을 입력해주세요.'),
      codeValue: yup.string().required('코드값을 입력해주세요.'),
    });

    onMounted(() => {
      if (!isNew.value) {
        const c = props.adminData.codes.find(x => x.codeId === props.editId);
        if (c) Object.assign(form, { ...c });
      }
    });

    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      if (isNew.value) {
        props.adminData.codes.push({
          ...form, codeId: props.adminData.nextId(props.adminData.codes, 'codeId'),
          sortOrd: Number(form.sortOrd) || 1,
        });
        props.showToast('코드가 등록되었습니다.');
      } else {
        const idx = props.adminData.codes.findIndex(x => x.codeId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.codes[idx], { ...form, sortOrd: Number(form.sortOrd) || 1 });
        props.showToast('저장되었습니다.');
      }
      props.navigate('syCodeMng');
    };

    return { isNew, form, errors, save, siteName };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '공통코드 등록' : '공통코드 수정' }}</div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ siteName }}</div>
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
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('syCodeMng')">취소</button>
    </div>
  </div>
</div>
`
};
