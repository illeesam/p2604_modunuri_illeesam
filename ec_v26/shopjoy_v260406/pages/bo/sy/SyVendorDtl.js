/* ShopJoy Admin - 업체정보 상세/등록 */
window.SyVendorDtl = {
  name: 'SyVendorDtl',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes', 'editId', 'viewMode'],
  setup(props) {
    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { reactive, computed, watch, onMounted, ref, onBeforeUnmount, nextTick } = Vue;

    const vendors = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, memoEl: null });
    const codes = reactive({ active_statuses: [], vendor_type_kr: [] });

    // onMounted에서 API 로드
    const handleLoadData = async () => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 10000 }, '판매자관리', '상세조회');
        vendors = res.data?.data?.pageList || res.data?.data?.list || [];
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore?.();
        if (codeStore?.snGetGrpCodes) {
          codes.active_statuses = codeStore.snGetGrpCodes('ACTIVE_STATUS') || [];
          codes.vendor_type_kr = codeStore.snGetGrpCodes('VENDOR_TYPE_KR') || [];
        }
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
      uiState.isPageCodeLoad = true;
      handleLoadData();
    };

    // ── watch ────────────────────────────────────────────────────────────────

    watch(isAppReady, (newVal) => { if (newVal) fnLoadCodes(); });

    const cfIsNew = computed(() => props.editId === null || props.editId === undefined);
    const cfSiteNm = computed(() => boUtil.getSiteNm());

    const form = reactive({
      vendorId: null, vendorType: '판매업체', vendorNm: '', ceo: '', bizNo: '', phone: '', email: '',
      zipcode: '', address: '', addressDetail: '',
      contractDate: '', statusCd: '활성', memo: '',
    });
    const errors = reactive({});
    const addrDetailRef = ref(null);

        let _qMemo = null;

    const schema = yup.object({
      vendorNm: yup.string().required('업체명을 입력해주세요.'),
      bizNo: yup.string().required('사업자등록번호를 입력해주세요.'),
    });

    const handleInitForm = async () => {
      if (!cfIsNew.value) {
        const v = vendors.find(x => x.vendorId === props.editId);
        if (v) Object.assign(form, { ...v });
      }
      await nextTick();
      if (uiState.memoEl) {
        _qMemo = new Quill(uiState.memoEl, {
          theme: 'snow',
          placeholder: '내용을 입력하세요...',
          modules: { toolbar: [['bold','italic','underline'],[{color:[]}],[{list:'ordered'},{list:'bullet'}],['link','clean']] }
        });
        if (form.memo) _qMemo.root.innerHTML = form.memo;
        _qMemo.on('text-change', () => { form.memo = _qMemo.root.innerHTML; });
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleInitForm();
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
      if (cfIsNew.value) {
        vendors.push({ ...form, vendorId: nextId.value(vendors, 'vendorId') });
      } else {
        const idx = vendors.findIndex(x => x.vendorId === props.editId);
        if (idx !== -1) Object.assign(vendors[idx], { ...form });
      }
      try {
        const res = await (cfIsNew.value ? boApi.post(`/bo/sy/vendor`, { ...form }, coUtil.apiHdr('판매자관리', '등록')) : boApi.put(`/bo/sy/vendor/${form.vendorId}`, { ...form }, coUtil.apiHdr('판매자관리', '저장')));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('syVendorMng');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const memoEl = Vue.ref(null);
    Vue.watch(memoEl, (el) => { if (uiState) uiState.memoEl = el; });

    // ── return ───────────────────────────────────────────────────────────────

    return { vendors, uiState, codes, cfIsNew, form, errors, handleSave, cfSiteNm, addrDetailRef, openKakaoPostcode, memoEl };
  },
  template: /* html */`
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="page-title">{{ cfIsNew ? '업체 등록' : (viewMode ? '업체 상세' : '업체 수정') }}</div><span v-if="!cfIsNew" style="font-size:12px;color:#999;">#{{ form.vendorId }}</span></div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ cfSiteNm }}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">업체유형 <span v-if="!viewMode" class="req">*</span></label>
        <select class="form-control" v-model="form.vendorType" :disabled="viewMode">
          <option v-for="c in codes.vendor_type_kr" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
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

    <!-- ── 주소 영역 ──────────────────────────────────────────────────────── -->
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
          <option v-for="c in codes.active_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
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
        <button class="btn btn-primary" @click="handleSave">저장</button>
        <button class="btn btn-secondary" @click="navigate('syVendorMng')">취소</button>
      </template>
    </div>
  </div>
</div>
`
};
