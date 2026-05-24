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
    // ===== 초기 변수 정의 =====================================================

    const { reactive, computed, watch, onMounted, ref, onBeforeUnmount, nextTick } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ active_statuses: [], vendor_type_kr: [] });

    /* 업체(판매자) fnLoadCodes */
    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================


    /* fnLoadCodes — 공통코드 로드 */
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
    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================


    /* handleLoadDetail — 상세 조회 */
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

    /* openKakaoPostcode — 열기 */
    const openKakaoPostcode = () => {
      /* run — 실행 */
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

    /* handleSave — 저장 */
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

    // ===== 폼 컬럼 정의 (BoFormArea :columns) ================================
    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================


    // --- [컬럼 정의] ---

    const baseFormColumns = [
      { key: 'siteNm',         label: '사이트명', type: 'readonly', fmt: () => cfSiteNm.value, colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'vendorType',     label: '업체유형', type: 'select', nullable: false, required: true,
        options: () => codes.vendor_type_kr },
      { key: 'vendorNm',       label: '업체명', type: 'text', required: true, placeholder: '업체명' },
      { key: 'ceoNm',          label: '대표자명', type: 'text' },
      { key: 'vendorNo',       label: '사업자등록번호', type: 'text', required: true, placeholder: '000-00-00000' },
      { key: 'vendorPhone',    label: '전화번호', type: 'text' },
      { key: 'vendorEmail',    label: '이메일', type: 'text' },
      { type: 'rowBreak' },
      { key: '_addr',          label: '주소', type: 'slot', name: 'addr', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'contractDate',   label: '계약일', type: 'date' },
      { key: 'vendorStatusCd', label: '상태', type: 'select', options: () => codes.active_statuses },
      { type: 'rowBreak' },
      { key: 'vendorRemark',   label: '메모', type: 'slot', name: 'remark', colSpan: 2 },
    ];

    // ===== setup() return ===================================================
    // ===== return (템플릿 노출) ===============================================


    return { uiState, codes, cfIsNew, form, errors, handleSave, cfSiteNm, cfDtlMode, addrDetailRef, openKakaoPostcode, baseFormColumns };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    {{ cfIsNew ? '업체 등록' : (cfDtlMode ? '업체 상세' : '업체 수정') }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.vendorId }}</span>
  </div>
  <!-- 폼 영역 (BoFormArea 자동 렌더) -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 폼 영역 ================================================== -->
    <bo-form-area :columns="baseFormColumns" :form="form" :errors="errors"
      :readonly="cfDtlMode" :cols="2"
      @save="handleSave"
      @cancel="navigate('syVendorMng')"
      @edit="navigate('__switchToEdit__')"
      @close="navigate('syVendorMng')">
      <!-- 주소: 우편번호+검색버튼+기본주소+상세주소 -->
      <template #addr>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
          <input class="form-control" v-model="form.vendorZipCode" placeholder="우편번호"
            style="width:110px;flex-shrink:0;" readonly />
          <button v-if="!cfDtlMode" type="button" class="btn btn-blue btn-sm" @click="openKakaoPostcode"
            style="white-space:nowrap;">
            🔍 주소 검색
          </button>
        </div>
        <input class="form-control" v-model="form.vendorAddr" placeholder="기본주소 (주소 검색 후 자동 입력)"
          style="margin-bottom:6px;" readonly />
        <input class="form-control" v-model="form.vendorAddrDetail" ref="addrDetailRef"
          placeholder="상세주소 (동/호수 등)" :readonly="cfDtlMode" />
      </template>
      <!-- 메모: Quill 또는 view 모드 HTML -->
      <template #remark>
        <div v-if="cfDtlMode" class="form-control" style="min-height:90px;line-height:1.6;" v-html="form.vendorRemark || '<span style=color:#bbb>-</span>'"></div>
        <base-html-editor v-else v-model="form.vendorRemark" height="180px" />
      </template>
    </bo-form-area>
  </div>
</div>
`
};
