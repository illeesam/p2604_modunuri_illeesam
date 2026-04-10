/* ShopJoy Admin - 업체정보 상세/등록 */
window.VendorDtl = {
  name: 'VendorDtl',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes', 'editId'],
  setup(props) {
    const { reactive, computed, onMounted } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const siteName = computed(() => window.adminCommonFilter?.site?.siteName || 'ShopJoy');
    const form = reactive({
      vendorType: '판매업체', vendorName: '', ceo: '', bizNo: '', phone: '', email: '',
      address: '', contractDate: '', status: '활성', memo: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      vendorName: yup.string().required('업체명을 입력해주세요.'),
      bizNo: yup.string().required('사업자등록번호를 입력해주세요.'),
    });

    onMounted(() => {
      if (!isNew.value) {
        const v = props.adminData.vendors.find(x => x.vendorId === props.editId);
        if (v) Object.assign(form, { ...v });
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
      await window.adminApiCall({
        method: isNew.value ? 'post' : 'put',
        path: `vendors/${form.vendorId}`,
        data: { ...form },
        confirmTitle: isNew.value ? '등록' : '저장',
        confirmMsg: isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?',
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: isNew.value ? '등록되었습니다.' : '저장되었습니다.',
        onLocal: () => {
          if (isNew.value) {
            props.adminData.vendors.push({ ...form, vendorId: props.adminData.nextId(props.adminData.vendors, 'vendorId') });
          } else {
            const idx = props.adminData.vendors.findIndex(x => x.vendorId === props.editId);
            if (idx !== -1) Object.assign(props.adminData.vendors[idx], { ...form });
          }
        },
        navigate: props.navigate,
        navigateTo: 'syVendorMng',
      });
    };

    return { isNew, form, errors, save, siteName };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '업체 등록' : '업체 수정' }}</div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ siteName }}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">업체유형 <span class="req">*</span></label>
        <select class="form-control" v-model="form.vendorType">
          <option>판매업체</option><option>배송업체</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">업체명 <span class="req">*</span></label>
        <input class="form-control" v-model="form.vendorName" placeholder="업체명" :class="errors.vendorName ? 'is-invalid' : ''" />
        <span v-if="errors.vendorName" class="field-error">{{ errors.vendorName }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">대표자명</label>
        <input class="form-control" v-model="form.ceo" />
      </div>
      <div class="form-group">
        <label class="form-label">사업자등록번호 <span class="req">*</span></label>
        <input class="form-control" v-model="form.bizNo" placeholder="000-00-00000" :class="errors.bizNo ? 'is-invalid' : ''" />
        <span v-if="errors.bizNo" class="field-error">{{ errors.bizNo }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">전화번호</label>
        <input class="form-control" v-model="form.phone" />
      </div>
      <div class="form-group">
        <label class="form-label">이메일</label>
        <input class="form-control" v-model="form.email" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">주소</label>
        <input class="form-control" v-model="form.address" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">계약일</label>
        <input class="form-control" type="date" v-model="form.contractDate" />
      </div>
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" v-model="form.status">
          <option>활성</option><option>비활성</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">메모</label>
        <textarea class="form-control" v-model="form.memo" rows="3"></textarea>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('syVendorMng')">취소</button>
    </div>
  </div>
</div>
`
};
