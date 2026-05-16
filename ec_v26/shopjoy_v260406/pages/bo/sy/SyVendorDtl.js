/* ShopJoy Admin - 업체정보 상세/등록 */
window.SyVendorDtl = {
  name: 'SyVendorDtl',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
    dtlId:       { type: String, default: null }, // 수정 대상 ID
    tabMode:     { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:     { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    const { reactive, computed, watch, onMounted, ref, onBeforeUnmount, nextTick } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ active_statuses: [], vendor_type_kr: [] });

    /* 업체(판매자) fnLoadCodes */
    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.active_statuses = codeStore.sgGetGrpCodes('ACTIVE_STATUS');
        codes.vendor_type_kr = codeStore.sgGetGrpCodes('VENDOR_TYPE_KR');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
      uiState.isPageCodeLoad = true;
    };

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ── watch ────────────────────────────────────────────────────────────────


    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    const form = reactive({
      vendorId: null, vendorType: '판매업체', vendorNm: '', ceoNm: '', vendorNo: '', vendorPhone: '', vendorEmail: '',
      vendorZipCode: '', vendorAddr: '', vendorAddrDetail: '',
      contractDate: '', vendorStatusCd: '활성', vendorRemark: '',
    });
    const errors = reactive({});
    const addrDetailRef = ref(null);

    const schema = yup.object({
      vendorNm: yup.string().required('업체명을 입력해주세요.'),
      vendorNo: yup.string().required('사업자등록번호를 입력해주세요.'),
    });

    /* 업체(판매자) 상세조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.syVendor.getById(props.dtlId, '판매자관리', '상세조회');
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
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) return;
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleLoadDetail();
    });

    /* ── 카카오 주소 검색 ── */
    const openKakaoPostcode = () => {
      /* 업체(판매자) run */
      const run = () => {
        new window.daum.Postcode({
          oncomplete(data) {
            form.vendorZipCode = data.zonecode;
            form.vendorAddr = data.roadAddress || data.jibunAddress;
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

    /* 업체(판매자) 저장 */
    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        console.error('[catch-info]', err);
        err.inner.forEach(e => { errors[e.path] = e.message; });
        showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const ok = await showConfirm(cfIsNew.value ? '등록' : '저장', cfIsNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      try {
        const res = await (cfIsNew.value ? boApiSvc.syVendor.create({ ...form }, '판매자관리', '등록') : boApiSvc.syVendor.update(form.vendorId, { ...form }, '판매자관리', '저장'));
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('syVendorMng', { reload: true });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    // ── return ───────────────────────────────────────────────────────────────

    return { uiState, codes, cfIsNew, form, errors, handleSave, cfSiteNm, cfDtlMode, addrDetailRef, openKakaoPostcode };
  },
  template: /* html */`
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="page-title">{{ cfIsNew ? '업체 등록' : (cfDtlMode ? '업체 상세' : '업체 수정') }}</div><span v-if="!cfIsNew" style="font-size:12px;color:#999;">#{{ form.vendorId }}</span></div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ cfSiteNm }}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">업체유형 <span v-if="!cfDtlMode" class="req">*</span></label>
        <select class="form-control" v-model="form.vendorType" :disabled="cfDtlMode">
          <option v-for="c in codes.vendor_type_kr" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">업체명 <span v-if="!cfDtlMode" class="req">*</span></label>
        <input class="form-control" v-model="form.vendorNm" placeholder="업체명" :readonly="cfDtlMode" :class="errors.vendorNm ? 'is-invalid' : ''" />
        <span v-if="errors.vendorNm" class="field-error">{{ errors.vendorNm }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">대표자명</label>
        <input class="form-control" v-model="form.ceoNm" :readonly="cfDtlMode" />
      </div>
      <div class="form-group">
        <label class="form-label">사업자등록번호 <span v-if="!cfDtlMode" class="req">*</span></label>
        <input class="form-control" v-model="form.vendorNo" placeholder="000-00-00000" :readonly="cfDtlMode" :class="errors.vendorNo ? 'is-invalid' : ''" />
        <span v-if="errors.vendorNo" class="field-error">{{ errors.vendorNo }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">전화번호</label>
        <input class="form-control" v-model="form.vendorPhone" :readonly="cfDtlMode" />
      </div>
      <div class="form-group">
        <label class="form-label">이메일</label>
        <input class="form-control" v-model="form.vendorEmail" :readonly="cfDtlMode" />
      </div>
    </div>

    <!-- ── 주소 영역 ──────────────────────────────────────────────────────── -->
    <div class="form-group">
      <label class="form-label">주소</label>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
        <input class="form-control" v-model="form.vendorZipCode" placeholder="우편번호"
          style="width:110px;flex-shrink:0;" readonly />
        <button v-if="!cfDtlMode" type="button" class="btn btn-blue btn-sm" @click="openKakaoPostcode"
          style="white-space:nowrap;">🔍 주소 검색</button>
      </div>
      <input class="form-control" v-model="form.vendorAddr" placeholder="기본주소 (주소 검색 후 자동 입력)"
        style="margin-bottom:6px;" readonly />
      <input class="form-control" v-model="form.vendorAddrDetail" ref="addrDetailRef"
        placeholder="상세주소 (동/호수 등)" :readonly="cfDtlMode" />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">계약일</label>
        <input class="form-control" type="date" v-model="form.contractDate" :readonly="cfDtlMode" />
      </div>
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" v-model="form.vendorStatusCd" :disabled="cfDtlMode">
          <option v-for="c in codes.active_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">메모</label>
        <div v-if="cfDtlMode" class="form-control" style="min-height:90px;line-height:1.6;" v-html="form.vendorRemark || '<span style=color:#bbb>-</span>'"></div>
        <base-html-editor v-else v-model="form.vendorRemark" height="180px" />
      </div>
    </div>
    <div class="form-actions" v-if="!cfDtlMode">
      <template v-if="cfDtlMode">
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
