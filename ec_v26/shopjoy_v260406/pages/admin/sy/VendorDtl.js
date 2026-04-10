/* ShopJoy Admin - 업체정보 상세/등록 */
window.VendorDtl = {
  name: 'VendorDtl',
  props: ['navigate', 'adminData', 'showToast', 'editId'],
  setup(props) {
    const { reactive, computed, onMounted } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const form = reactive({
      vendorType: '판매업체', vendorName: '', ceo: '', bizNo: '', phone: '', email: '',
      address: '', contractDate: '', status: '활성', memo: '',
    });

    onMounted(() => {
      if (!isNew.value) {
        const v = props.adminData.vendors.find(x => x.vendorId === props.editId);
        if (v) Object.assign(form, { ...v });
      }
    });

    const save = () => {
      if (!form.vendorName || !form.bizNo) { props.showToast('필수 항목을 입력해주세요.', 'error'); return; }
      if (isNew.value) {
        props.adminData.vendors.push({
          ...form, vendorId: props.adminData.nextId(props.adminData.vendors, 'vendorId'),
        });
        props.showToast('업체가 등록되었습니다.');
      } else {
        const idx = props.adminData.vendors.findIndex(x => x.vendorId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.vendors[idx], form);
        props.showToast('저장되었습니다.');
      }
      props.navigate('syVendorMng');
    };

    return { isNew, form, save };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '업체 등록' : '업체 수정' }}</div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">업체유형 <span class="req">*</span></label>
        <select class="form-control" v-model="form.vendorType">
          <option>판매업체</option><option>배송업체</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">업체명 <span class="req">*</span></label>
        <input class="form-control" v-model="form.vendorName" placeholder="업체명" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">대표자명</label>
        <input class="form-control" v-model="form.ceo" />
      </div>
      <div class="form-group">
        <label class="form-label">사업자등록번호 <span class="req">*</span></label>
        <input class="form-control" v-model="form.bizNo" placeholder="000-00-00000" />
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
