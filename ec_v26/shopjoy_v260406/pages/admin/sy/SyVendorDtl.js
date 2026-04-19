/* ShopJoy Admin - 업체정보 상세/등록 */
window.SyVendorDtl = {
  name: 'SyVendorDtl',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes', 'editId', 'viewMode'],
  setup(props) {
    const { reactive, computed, onMounted, onBeforeUnmount, ref, nextTick } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const siteNm = computed(() => window.adminUtil.getSiteNm());

    const form = reactive({
      vendorId: null, vendorType: '판매업체', vendorNm: '', ceo: '', bizNo: '', phone: '', email: '',
      zipcode: '', address: '', addressDetail: '',
      contractDate: '', statusCd: '활성', memo: '',
    });
    const errors = reactive({});
    const addrDetailRef = ref(null);

    const memoEl = ref(null);
    let _qMemo = null;

    const schema = yup.object({
      vendorNm: yup.string().required('업체명을 입력해주세요.'),
      bizNo: yup.string().required('사업자등록번호를 입력해주세요.'),
    });

    onMounted(async () => {
      if (!isNew.value) {
        const v = props.adminData.vendors.find(x => x.vendorId === props.editId);
        if (v) Object.assign(form, { ...v });
      }
      await nextTick();
      if (memoEl.value) {
        _qMemo = new Quill(memoEl.value, {
          theme: 'snow',
          placeholder: '내용을 입력하세요...',
          modules: { toolbar: [['bold','italic','underline'],[{color:[]}],[{list:'ordered'},{list:'bullet'}],['link','clean']] }
        });
        if (form.memo) _qMemo.root.innerHTML = form.memo;
        _qMemo.on('text-change', () => { form.memo = _qMemo.root.innerHTML; });
      }
    });

    onBeforeUnmount(() => { if (_qMemo) { form.memo = _qMemo.root.innerHTML; _qMemo = null; } });

    /* ── 카카오 주소 검색 ── */
    const openKakaoPostcode = () => {
      const run = () => {
        new window.daum.Postcode({
          oncomplete(data) {
            form.zipcode = data.zonecode;
            form.address = data.roadAddress || data.jibunAddress;
            if (addrDetailRef.value) addrDetailRef.value.focus();
          },
        }).open();
      };
      if (window.daum && window.daum.Postcode) { run(); return; }
      const s = document.createElement('script');
      s.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      s.onload = run;
      document.head.appendChild(s);
    };

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
        props.adminData.vendors.push({ ...form, vendorId: props.adminData.nextId(props.adminData.vendors, 'vendorId') });
      } else {
        const idx = props.adminData.vendors.findIndex(x => x.vendorId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.vendors[idx], { ...form });
      }
      try {
        const res = await (isNew.value ? window.adminApi.post(`vendors/${form.vendorId}`, { ...form }) : window.adminApi.put(`vendors/${form.vendorId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(isNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('syVendorMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    return { isNew, form, errors, save, siteNm, addrDetailRef, openKakaoPostcode, memoEl };
  },
  template: /* html */`
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="page-title">{{ isNew ? '업체 등록' : (viewMode ? '업체 상세' : '업체 수정') }}</div><span v-if="!isNew" style="font-size:12px;color:#999;">#{{ form.vendorId }}</span></div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ siteNm }}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">업체유형 <span v-if="!viewMode" class="req">*</span></label>
        <select class="form-control" v-model="form.vendorType" :disabled="viewMode">
          <option>판매업체</option><option>배송업체</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">업체명 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.vendorNm" placeholder="업체명" :readonly="viewMode" :class="errors.vendorNm ? 'is-invalid' : ''" />
        <span v-if="errors.vendorNm" class="field-error">{{ errors.vendorNm }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">대표자명</label>
        <input class="form-control" v-model="form.ceo" :readonly="viewMode" />
      </div>
      <div class="form-group">
        <label class="form-label">사업자등록번호 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.bizNo" placeholder="000-00-00000" :readonly="viewMode" :class="errors.bizNo ? 'is-invalid' : ''" />
        <span v-if="errors.bizNo" class="field-error">{{ errors.bizNo }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">전화번호</label>
        <input class="form-control" v-model="form.phone" :readonly="viewMode" />
      </div>
      <div class="form-group">
        <label class="form-label">이메일</label>
        <input class="form-control" v-model="form.email" :readonly="viewMode" />
      </div>
    </div>

    <!-- 주소 영역 -->
    <div class="form-group">
      <label class="form-label">주소</label>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
        <input class="form-control" v-model="form.zipcode" placeholder="우편번호"
          style="width:110px;flex-shrink:0;" readonly />
        <button v-if="!viewMode" type="button" class="btn btn-blue btn-sm" @click="openKakaoPostcode"
          style="white-space:nowrap;">🔍 주소 검색</button>
      </div>
      <input class="form-control" v-model="form.address" placeholder="기본주소 (주소 검색 후 자동 입력)"
        style="margin-bottom:6px;" readonly />
      <input class="form-control" v-model="form.addressDetail" ref="addrDetailRef"
        placeholder="상세주소 (동/호수 등)" :readonly="viewMode" />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">계약일</label>
        <input class="form-control" type="date" v-model="form.contractDate" :readonly="viewMode" />
      </div>
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" v-model="form.statusCd" :disabled="viewMode">
          <option>활성</option><option>비활성</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">메모</label>
        <div v-if="viewMode" class="form-control" style="min-height:90px;line-height:1.6;" v-html="form.memo || '<span style=color:#bbb>-</span>'"></div>
        <div v-else ref="memoEl" style="min-height:90px;background:#fff;"></div>
      </div>
    </div>
    <div class="form-actions">
      <template v-if="viewMode">
        <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
        <button class="btn btn-secondary" @click="navigate('syVendorMng')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('syVendorMng')">취소</button>
      </template>
    </div>
  </div>
</div>
`
};
