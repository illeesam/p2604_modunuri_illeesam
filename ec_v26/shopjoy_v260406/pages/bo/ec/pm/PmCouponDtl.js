/* ShopJoy Admin - 쿠폰관리 상세/등록 (다중탭: 기본정보/미리보기/상세정보/발급목록/사용목록) */
window._pmCouponDtlState = window._pmCouponDtlState || { tab: 'info', tabMode: 'tab' };
window.PmCouponDtl = {
  name: 'PmCouponDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    // ===== [01] 초기 변수 정의 ====================================================
    const { ref, reactive, computed, onMounted, watch, onBeforeUnmount, nextTick } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const vendors = reactive([]);
    const uiState = reactive({ loading: false, showVendorModal: false, error: null, isPageCodeLoad: false, tab: window._pmCouponDtlState.tab || 'info', tabMode2: window._pmCouponDtlState.tabMode || 'tab', previewTab: 'barcode', barcodeContainer: null, qrcodeContainer: null });
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({
      coupon_statuses_dtl: [],
      coupon_use_limit_opts: [{value:'unlimited',label:'무제한'},{value:'once',label:'1회만'},{value:'month',label:'월 1회'}],
      coupon_issue_type_opts: [{value:'auto',label:'자동 발급'},{value:'manual',label:'수동 발급'},{value:'event',label:'이벤트 발급'}],
      coupon_target_opts: [{value:'all',label:'전체 회원'},{value:'newMember',label:'신규 회원'},{value:'subscribe',label:'구독자'},{value:'purchase',label:'구매 고객'}],
      coupon_apply_opts: [{value:'all',label:'모든 상품'},{value:'category',label:'카테고리 제한'},{value:'product',label:'특정 상품만'},{value:'exclude',label:'제외 상품'}],
      coupon_types: ['배송비할인쿠폰','회원가입축하쿠폰','상품할인쿠폰','주문할인쿠폰','클레임관리자지급쿠폰','VIP쿠폰'],
      issue_targets: ['상품','판매업체','브랜드','카테고리'],
      discount_types: [{value:'amount',label:'정액'},{value:'percent',label:'정률'}],
    });

    const form = reactive({
      couponId: null, couponTypeCd: '상품할인쿠폰', couponCd: '', couponNm: '',
      discountType: 'amount', discountVal: 0, discountRate: null, discountAmt: null, minOrderAmt: 0, maxDiscountAmt: 0,
      couponStatusCd: '활성', validFrom: '', validTo: '', issueLimit: 0, useLimit: 'unlimited',
      targetTypeCd: '상품', issueTargets: [],
      issueMethods: 'auto', issueCondition: 'all', memGradeCd: '', issueGrades: [],
      useScope: 'all', useExclude: '', useRemark: '',
      memo: '',
      vendorId: '', chargeStaff: '',
    });
    const errors = reactive({});

    const _today = new Date();

    /* _pad — 패딩 */
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END   = `${_today.getFullYear()+1}-12-31`;

    const schema = yup.object({
      couponNm: yup.string().required('쿠폰명을 입력해주세요.'),
      couponCd: yup.string().required('쿠폰코드를 입력해주세요.'),
      discountVal: yup.number().min(0).required('할인값을 입력해주세요.'),
      validTo: yup.string().required('만료일을 입력해주세요.'),
    });

    const cfIsNew = computed(() => !props.dtlId);
    const cfCurId       = computed(() => props.dtlId || form.couponId || null);
    const cfHasId       = computed(() => !!cfCurId.value);
    /* 신규: info 탭만 활성. 수정: info/detail 만 저장 의미 있음 (issued/used/preview 는 조회전용 → 비활성) */
    const cfSaveDisabled = computed(() => {
      const t = uiState.tab;
      if (t === 'info') return false;                       // info 는 항상 활성
      if (!cfHasId.value) return true;                      // info 외 탭은 ID 없으면 비활성
      if (t === 'detail') return false;                     // detail 은 ID 있으면 활성
      return true;                                          // issued / used / preview 는 비활성
    });

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PmCouponDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장
      if (cmd === 'form-save') {
        return handleSave();
      // 폼 취소 (목록으로)
      } else if (cmd === 'form-cancel') {
        return props.navigate('pmCouponMng');
      // 탭 전환 (info/detail/issued/used/preview)
      } else if (cmd === 'tab-select') {
        return onTabChange(param);
      // 뷰모드 변경
      } else if (cmd === 'tab-mode') {
        uiState.tabMode2 = param;
        return;
      // 미리보기 탭 변경
      } else if (cmd === 'previewTab-change') {
        return onPreviewTabChange(param);
      // 판매업체 모달 열기
      } else if (cmd === 'vendorModal-open') {
        uiState.showVendorModal = true;
        return;
      // 판매업체 모달 닫기
      } else if (cmd === 'vendorModal-close') {
        uiState.showVendorModal = false;
        return;
      // 판매업체 초기화
      } else if (cmd === 'form-vendor-clear') {
        form.vendorId = '';
        form.chargeStaff = '';
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PmCouponDtl.js : handleSelectAction -> ', cmd, param);
      // 판매업체 선택
      if (cmd === 'vendorModal-select') {
        return selectVendor(param.vendorId, param.vendorNm);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    // 단건 조회
    /* loadVendors — 로드 */
    const loadVendors = async () => {
      try {
        const vr = await boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 10000 }, '쿠폰관리', '조회');
        vendors.splice(0, vendors.length, ...(vr.data?.data?.pageList || vr.data?.data?.list || []));
      } catch (e) { console.warn('[PmCouponDtl] vendor load failed', e); }
    };

    /* handleSearchDetail — 처리 */
    const handleSearchDetail = async () => {
      await loadVendors();
      if (cfIsNew.value) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.pmCoupon.getById(props.dtlId, '쿠폰관리', '상세조회');
        const c = res.data?.data || res.data;
        if (c) { Object.assign(form, { ...c }); }
        // Entity discountRate/discountAmt → UI 단일 입력 매핑
        if (c) {
          if (c.discountRate != null && c.discountRate !== '') { form.discountType = 'percent'; form.discountVal = Number(c.discountRate) || 0; }
          else { form.discountType = 'amount'; form.discountVal = Number(c.discountAmt) || 0; }
        }
        if (!form.validFrom) { form.validFrom = DEFAULT_START; }
        if (!form.validTo) { form.validTo = DEFAULT_END; }
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    watch(() => uiState.tab, v => { window._pmCouponDtlState.tab = v; });
    watch(() => uiState.tabMode2, v => { window._pmCouponDtlState.tabMode = v; });

    /* showTab — 표시 */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;

    /* 쿠폰 fnLoadCodes */
    // ===== [03] 초기 함수 (마운트 / 코드 로드 / watch) =================================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.coupon_statuses_dtl = codeStore.sgGetGrpCodes('COUPON_STATUS_DTL');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* handleInitForm — 처리 */
    const handleInitForm = () => {
      if (cfIsNew.value) {
        if (!form.validFrom) { form.validFrom = DEFAULT_START; }
        if (!form.validTo) { form.validTo = DEFAULT_END; }
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(async () => {
      if (isAppReady.value) { fnLoadCodes(); }
      await handleSearchDetail();
      handleInitForm();
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleSearchDetail();
      handleInitForm();
    });

    const cfSelectedVendorNm = computed(() => {
      if (!form.vendorId) { return '소속업체 선택'; }
      const v = vendors.find(x => x.vendorId === form.vendorId);
      return v ? v.vendorNm : '소속업체 선택';
    });

    /* selectVendor — 선택 */
    const selectVendor = (vendorId, vendorNm) => {
      form.vendorId = vendorId;
      uiState.showVendorModal = false;
    };

    /* 발급목록 */
    const cfIssuedList = computed(() => form.issuedList || []);

    /* 사용목록 */
    const cfUsedList = computed(() => form.usedList || []);

    /* 미리보기 형태 */
    const onPreviewTabChange = (pt) => {
      uiState.previewTab = pt;
      Vue.nextTick(() => {
        if (pt === 'barcode' && uiState.barcodeContainer && typeof JsBarcode !== 'undefined') {
          try {
            barcodeContainer.value.innerHTML = '';
            JsBarcode(uiState.barcodeContainer, form.couponCd || 'SAMPLE', {
              format: 'CODE128',
              width: 2,
              height: 60,
              displayValue: true,
            });
          } catch(e) {}
        }
        if (pt === 'qrcode' && uiState.qrcodeContainer && typeof QRCode !== 'undefined') {
          qrcodeContainer.value.innerHTML = '';
          try {
            new QRCode(uiState.qrcodeContainer, {
              text: form.couponCd ? `https://shopjoy.com/coupon/${form.couponCd}` : 'https://shopjoy.com/coupon/sample',
              width: 150,
              height: 150,
              colorDark: '#222222',
              colorLight: '#ffffff',
            });
          } catch(e) {}
        }
      });
    };

    /* renderBarcode — 렌더 */
    const renderBarcode = () => {
      if (uiState.barcodeContainer && typeof JsBarcode !== 'undefined') {
        try {
          barcodeContainer.value.innerHTML = '';
          JsBarcode(uiState.barcodeContainer, form.couponCd || 'SAMPLE', {
            format: 'CODE128',
            width: 2,
            height: 60,
            displayValue: true,
          });
        } catch(e) {}
      }
    };

    /* renderQRCode — 렌더 */
    const renderQRCode = () => {
      if (uiState.qrcodeContainer && typeof QRCode !== 'undefined') {
        try {
          qrcodeContainer.value.innerHTML = '';
          new QRCode(uiState.qrcodeContainer, {
            text: form.couponCd ? `https://shopjoy.com/coupon/${form.couponCd}` : 'https://shopjoy.com/coupon/sample',
            width: 150,
            height: 150,
            colorDark: '#222222',
            colorLight: '#ffffff',
          });
        } catch(e) {}
      }
    };

    /* 쿠폰 onTabChange */
    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ============================

    /* onTabChange — 탭 변경 */
    const onTabChange = (newTab) => {
      uiState.tab = newTab;
      if (newTab === 'preview') {
        Vue.nextTick(() => {
          renderBarcode();
          renderQRCode();
        });
      }
    };

    /* _afterApiOk — 후 API 성공 */
    const _afterApiOk  = (res, msg) => {
      if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
      if (showToast) { showToast(msg, 'success'); }
    };

    /* _afterApiErr — 후 API 오류 */
    const _afterApiErr = (err) => {
      console.error('[handleSave]', err);
      const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
      if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
      if (showToast) { showToast(errMsg, 'error', 0); }
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      const tabId = uiState.tab;

      if (cfSaveDisabled.value) {
        if (!cfHasId.value && tabId !== 'info') { showToast('먼저 기본정보 탭에서 등록해주세요.', 'error'); }
        return;
      }

      if (tabId !== 'info' && tabId !== 'detail') return;   // 안전장치

      Object.keys(errors).forEach(k => delete errors[k]);
      try { await schema.validate(form, { abortEarly: false }); }
      catch (err) { err.inner.forEach(e => { errors[e.path] = e.message; }); showToast('입력 내용을 확인해주세요.', 'error'); return; }

      const isCreate = !cfHasId.value;
      const ok = await showConfirm(isCreate ? '등록' : '저장', isCreate ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) { return; }
      try {
        const payload = { ...form };
        // UI 단일 입력 → Entity discountRate / discountAmt 매핑
        if (form.discountType === 'percent') { payload.discountRate = form.discountVal; payload.discountAmt = null; }
        else { payload.discountAmt = form.discountVal; payload.discountRate = null; }
        const res = isCreate
          ? await boApiSvc.pmCoupon.create(payload, '쿠폰관리', '등록')
          : await boApiSvc.pmCoupon.update(cfCurId.value, payload, '쿠폰관리', tabId === 'info' ? '기본정보저장' : '상세정보저장');
        if (isCreate) {
          const newId = res.data?.data?.couponId || res.data?.couponId || null;
          if (newId) { form.couponId = newId; }
        }
        _afterApiOk(res, isCreate ? '등록되었습니다. 다른 탭을 저장할 수 있습니다.' : '저장되었습니다.');
      } catch (err) { _afterApiErr(err); }
    };

    const barcodeContainer = Vue.toRef(uiState, 'barcodeContainer');
    const previewTab = Vue.toRef(uiState, 'previewTab');
    const qrcodeContainer = Vue.toRef(uiState, 'qrcodeContainer');
    const showVendorModal = Vue.toRef(uiState, 'showVendorModal');

    // ===== [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ====================

    /* BoGrid(bare) 컬럼 정의 — 발급목록 / 사용목록 (최대 10건 미리보기) */
    const issuedGridColumns = [
      { key: 'code',       label: '쿠폰코드', fmt: v => v || '-' },
      { key: 'target',     label: '발급대상', fmt: v => v || '-' },
      { key: 'issuedDate', label: '발급일시', fmt: v => v || '-' },
      { key: 'expiryDate', label: '유효기간', fmt: v => v || '-' },
      { key: 'status',     label: '상태',
        badge: row => row.status === '사용' ? 'badge-blue' : 'badge-green',
        fmt: v => v || '미사용' },
    ];
    const usedGridColumns = [
      { key: 'code',        label: '쿠폰코드', fmt: v => v || '-' },
      { key: 'userId',      label: '사용자', fmt: v => v || '-' },
      { key: 'orderId',     label: '주문ID', fmt: v => v || '-' },
      { key: 'orderAmt',    label: '주문금액', fmt: v => (v||0).toLocaleString() + '원' },
      { key: 'discountAmt', label: '할인액',
        cellStyle: 'color:#e8587a;font-weight:600',
        fmt: v => '-' + (v||0).toLocaleString() + '원' },
      { key: 'usedDate',    label: '사용일시', fmt: v => v || '-' },
    ];
    const cfIssuedTop = computed(() => cfIssuedList.value.slice(0, 10));
    const cfUsedTop   = computed(() => cfUsedList.value.slice(0, 10));

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - info 탭 ======================
    const infoFormColumns = [
      { key: 'couponTypeCd',   label: '쿠폰 타입', type: 'select', nullable: false,
        options: () => codes.coupon_types },
      { key: 'couponNm',       label: '쿠폰명', type: 'text', required: true, placeholder: '쿠폰명 입력' },
      { key: 'couponCd',       label: '쿠폰코드', type: 'text', required: true,
        placeholder: '코드 자동생성/직접입력', mono: true },
      { key: 'couponStatusCd', label: '상태', type: 'select', options: () => codes.coupon_statuses_dtl },
      { key: 'discountType',   label: '할인 유형', type: 'select', options: () => codes.discount_types },
      { key: 'discountVal',    label: '할인값', type: 'number', required: true },
      { key: 'minOrderAmt',    label: '최소주문금액 (원)', type: 'number', placeholder: '0' },
      { key: 'maxDiscountAmt', label: '최대할인금액 (원)', type: 'number', placeholder: '0 = 무제한' },
      { key: 'validFrom',      label: '시작일', type: 'date' },
      { key: 'validTo',        label: '만료일', type: 'date', required: true },
      { key: 'issueLimit',     label: '총 발급수량', type: 'number', placeholder: '0 = 무제한' },
      { key: 'useLimit',       label: '사용 제한', type: 'select', nullable: false,
        options: () => codes.coupon_use_limit_opts },
      { type: 'rowBreak' },
      { key: 'memo',           label: '메모', type: 'slot', name: 'memo', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'vendorId',       label: '판매업체', type: 'slot', name: 'vendor' },
      { key: 'chargeStaff',    label: '판매담당자', type: 'text', placeholder: '담당자명 입력' },
    ];

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - detail 탭 일부 =================
    const detailIssueFormColumns = [
      { key: 'issueMethods',   label: '지급 방법', type: 'select', nullable: false,
        options: () => codes.coupon_issue_type_opts },
      { key: 'issueCondition', label: '지급 조건', type: 'select', nullable: false,
        options: () => codes.coupon_target_opts },
    ];
    const detailUseFormColumns = [
      { key: 'useScope',   label: '사용 범위', type: 'select', nullable: false, colSpan: 2,
        options: () => codes.coupon_apply_opts },
      { type: 'rowBreak' },
      { key: 'useExclude', label: '제외 상품/카테고리', type: 'textarea', rows: 3, colSpan: 2,
        placeholder: '쉼표로 구분하여 입력 (예: 상품ID1, 상품ID2, 카테고리ID3)' },
      { type: 'rowBreak' },
      { key: 'useRemark',  label: '사용 제약사항', type: 'textarea', rows: 3, colSpan: 2,
        placeholder: '예: 다른 쿠폰과 중복 사용 불가, 배송료 할인 쿠폰은 특정 배송사만 적용 등' },
    ];

    // ===== [06] return (템플릿 노출) ==============================================

    return {
      uiState, codes, form, errors, vendors,                                          // 상태 / 데이터
      infoFormColumns, detailIssueFormColumns, detailUseFormColumns,                  // 폼 컬럼 정의
      issuedGridColumns, usedGridColumns,                                             // 그리드 컬럼 정의
      handleBtnAction, handleSelectAction,                                            // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfHasId, cfSaveDisabled, cfIssuedList, cfUsedList, cfIssuedTop, cfUsedTop, cfSelectedVendorNm, // computed
      tab, tabMode2, previewTab, barcodeContainer, qrcodeContainer, showVendorModal,  // toRef
      showTab,                                                                        // 헬퍼
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    {{ cfIsNew ? '쿠폰 등록' : '쿠폰 수정' }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">
      #{{ form.couponId }}
    </span>
  </div>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 탭 영역 ==================================================== -->
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:tab==='info'}" :disabled="tabMode2!=='tab'" @click="handleBtnAction('tab-select', 'info')">
        📋 기본정보
      </button>
      <button class="tab-btn" :class="{active:tab==='detail'}" :disabled="tabMode2!=='tab'" @click="handleBtnAction('tab-select', 'detail')">
        📋 상세정보
      </button>
      <button class="tab-btn" :class="{active:tab==='issued'}" :disabled="tabMode2!=='tab'" @click="handleBtnAction('tab-select', 'issued')">
        📊 발급목록
      </button>
      <button class="tab-btn" :class="{active:tab==='used'}" :disabled="tabMode2!=='tab'" @click="handleBtnAction('tab-select', 'used')">
        ✅ 사용목록
      </button>
      <button class="tab-btn" :class="{active:tab==='preview'}" :disabled="tabMode2!=='tab'" @click="handleBtnAction('tab-select', 'preview')">
        👁 미리보기
      </button>
    </div>
    <div class="tab-modes">
      <button class="tab-mode-btn" :class="{active:tabMode2==='tab'}" @click="handleBtnAction('tab-mode', 'tab')" title="탭">
        📑
      </button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='1col'}" @click="handleBtnAction('tab-mode', '1col')" title="1열">
        1▭
      </button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='2col'}" @click="handleBtnAction('tab-mode', '2col')" title="2열">
        2▭
      </button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='3col'}" @click="handleBtnAction('tab-mode', '3col')" title="3열">
        3▭
      </button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='4col'}" @click="handleBtnAction('tab-mode', '4col')" title="4열">
        4▭
      </button>
    </div>
  </div>
  <!-- ===== □. 탭 영역 ==================================================== -->
  <!-- ===== ■. 탭 컨텐츠 =================================================== -->
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">
    <!-- ===== ■.■. 기본정보 탭 (BoFormArea 자동 렌더) ============================= -->
    <div class="card" v-show="showTab('info')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        📋 기본정보
      </div>
      <!-- ===== ■.■.■. 폼 영역 ================================================ -->
      <bo-form-area :columns="infoFormColumns" :form="form" :errors="errors"
        :readonly="false" :cols="2" :show-actions="false">
        <!-- ===== ■.■.■.■. 메모: Quill 에디터 ===================================== -->
        <template #memo>
          <base-html-editor v-model="form.memo" height="200px" />
        </template>
        <!-- ===== ■.■.■.■. 판매업체 picker ======================================= -->
        <template #vendor>
          <div style="display:flex;gap:8px;align-items:center;">
            <div class="form-control" style="background:#f9f9f9;cursor:pointer;padding:0;display:flex;align-items:center;" @click="handleBtnAction('vendorModal-open')">
              <span style="padding:8px 12px;flex:1;">
                {{ cfSelectedVendorNm }}
              </span>
              <span style="padding:8px 12px;color:#999;font-size:12px;">
                ▼
              </span>
            </div>
            <button v-if="form.vendorId" class="btn btn-sm" style="padding:0 12px;color:#666;" @click="handleBtnAction('form-vendor-clear')">
              초기화
            </button>
          </div>
        </template>
      </bo-form-area>
      <!-- ===== ■.■.■. 판매업체 선택 모달 ========================================== -->
      <simple-vendor-pick-modal :show="showVendorModal" :vendors="vendors" :selected-id="form.vendorId"
        @select="v => handleSelectAction('vendorModal-select', v)" @close="handleBtnAction('vendorModal-close')" />
    </div>
    <!-- ===== □.□. 기본정보 탭 (BoFormArea 자동 렌더) ============================= -->
    <!-- ===== ■.■. 미리보기 ================================================== -->
    <div class="card" v-show="showTab('preview')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        👁 미리보기
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:20px;">
        <!-- ===== ■.■.■.■. 좌측 컬럼 ============================================= -->
        <div style="display:flex;flex-direction:column;gap:16px;">
          <!-- ===== ■.■.■.■.■. 바코드 ============================================= -->
          <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;position:relative;background:linear-gradient(to right, #fff 0%, rgba(232,88,122,0.02) 100%);">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-25deg);font-size:80px;font-weight:900;color:#e8587a;opacity:0.08;pointer-events:none;white-space:nowrap;letter-spacing:8px;">
              ShopJoy
            </div>
            <div style="position:absolute;top:-20px;right:-20px;font-size:60px;opacity:0.04;transform:rotate(-15deg);pointer-events:none;">
              🎟️
            </div>
            <div style="font-size:12px;font-weight:600;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;width:100%;text-align:center;position:relative;z-index:1;">
              📊 바코드
            </div>
            <div style="text-align:center;font-size:10px;color:#666;line-height:1.5;width:100%;position:relative;z-index:1;">
              <div style="font-weight:600;margin-bottom:4px;color:#222;">
                {{ form.couponNm }}
              </div>
              <div style="font-size:9px;">
                🏷️ {{ form.couponCd || 'SAMPLE' }}
              </div>
              <div style="font-weight:600;color:#e8587a;margin:4px 0;">
                {{ form.discountType==='amount' ? (form.discountVal||0).toLocaleString()+'원' : (form.discountVal||0)+'%' }}
              </div>
              <div style="font-size:9px;color:#999;">
                📅 {{ form.validFrom }} ~ {{ form.validTo }}
              </div>
              <div style="font-size:9px;color:#999;">
                💳 최소주문: {{ (form.minOrderAmt||0).toLocaleString() }}원
              </div>
            </div>
            <div ref="barcodeContainer" style="display:flex;align-items:center;justify-content:center;background:#fff;padding:8px;border:1px solid #ddd;border-radius:4px;width:100%;position:relative;z-index:1;">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:45px;font-weight:900;color:#e8587a;opacity:0.05;pointer-events:none;white-space:nowrap;letter-spacing:3px;">
                ShopJoy
              </div>
            </div>
          </div>
          <!-- ===== ■.■.■.■.■. SNS전송형태 ========================================= -->
          <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;position:relative;overflow:hidden;">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-25deg);font-size:70px;font-weight:900;color:#e8587a;opacity:0.08;pointer-events:none;white-space:nowrap;letter-spacing:6px;z-index:0;">
              ShopJoy
            </div>
            <div style="font-size:12px;font-weight:600;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;width:100%;text-align:center;position:relative;z-index:1;">
              💬 SNS전송형태 (카톡)
            </div>
            <div style="background:#fff;padding:12px;border:1px solid #e0e0e0;border-radius:6px;text-align:left;font-size:10px;line-height:1.6;color:#333;width:100%;position:relative;z-index:1;">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:40px;font-weight:900;color:#e8587a;opacity:0.05;pointer-events:none;white-space:nowrap;letter-spacing:3px;">
                ShopJoy
              </div>
              <div style="font-weight:600;margin-bottom:6px;">
                🎁 {{ form.couponNm }}
              </div>
              <div style="color:#666;margin:3px 0;">
                쿠폰번호: {{ form.couponCd || 'SAMPLE' }}
              </div>
              <div style="color:#666;margin:3px 0;">
                할인: {{ form.discountType==='amount' ? (form.discountVal||0).toLocaleString()+'원' : (form.discountVal||0)+'%' }}
              </div>
              <div style="color:#666;margin:3px 0;">
                유효기간: {{ form.validFrom }} ~ {{ form.validTo }}
              </div>
              <div style="color:#666;margin:3px 0;">
                최소주문: {{ (form.minOrderAmt||0).toLocaleString() }}원
              </div>
              <div style="color:#999;font-size:9px;margin-top:6px;">
                ShopJoy에서 확인하기 &gt;
              </div>
            </div>
          </div>
          <!-- ===== ■.■.■.■.■. 이메일 내용 ========================================== -->
          <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;">
            <div style="font-size:12px;font-weight:600;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;width:100%;text-align:center;">
              📧 이메일 내용
            </div>
            <div style="background:linear-gradient(180deg, #f9f9f9 0%, #fafbfc 100%);padding:12px;border:1px solid #e8e8e8;border-radius:6px;text-align:left;font-size:9px;line-height:1.6;color:#333;width:100%;position:relative;overflow:hidden;">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-25deg);font-size:70px;font-weight:900;color:#e8587a;opacity:0.07;pointer-events:none;white-space:nowrap;letter-spacing:6px;">
                ShopJoy
              </div>
              <div style="position:absolute;top:-10px;right:-10px;font-size:50px;opacity:0.03;transform:rotate(20deg);">
                📧
              </div>
              <div style="background:linear-gradient(135deg, #e8587a 0%, #ff7a9a 100%);color:#fff;padding:8px;border-radius:4px;margin:-12px -12px 8px -12px;text-align:center;position:relative;z-index:1;">
                <div style="font-weight:600;font-size:10px;">
                  🛍️ ShopJoy 쿠폰 알림
                </div>
              </div>
              <div style="position:relative;z-index:1;">
                <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:40px;font-weight:900;color:#e8587a;opacity:0.05;pointer-events:none;white-space:nowrap;letter-spacing:3px;">
                  ShopJoy
                </div>
                <div style="font-weight:600;margin-bottom:8px;">
                  제목: {{ form.couponNm }}
                </div>
                <div style="color:#666;margin:4px 0;">
                  보낸 사람: ShopJoy (noreply@shopjoy.com)
                </div>
                <div style="color:#666;margin:6px 0;">
                  안녕하세요, 송지선 회원님!
                </div>
                <div style="color:#666;margin:6px 0;">
                  ShopJoy에서 특별한 쿠폰을 준비했습니다.
                </div>
                <div style="background:#fff;padding:8px;border:2px solid #e8587a;border-radius:4px;margin:8px 0;">
                  <div style="font-weight:600;color:#e8587a;margin-bottom:4px;">
                    🎁 {{ form.couponNm }}
                  </div>
                  <div style="color:#666;font-size:8px;margin:3px 0;">
                    쿠폰번호: {{ form.couponCd || 'SAMPLE' }}
                  </div>
                  <div style="color:#666;font-size:8px;margin:3px 0;">
                    할인: {{ form.discountType==='amount' ? (form.discountVal||0).toLocaleString()+'원' : (form.discountVal||0)+'%' }}
                  </div>
                  <div style="color:#666;font-size:8px;margin:3px 0;">
                    유효기간: {{ form.validFrom }} ~ {{ form.validTo }}
                  </div>
                  <div style="color:#666;font-size:8px;margin:3px 0;">
                    최소주문: {{ (form.minOrderAmt||0).toLocaleString() }}원
                  </div>
                  <div style="color:#666;font-size:8px;margin:3px 0;">
                    쿠폰타입: {{ form.couponTypeCd }}
                  </div>
                </div>
                <div style="color:#666;margin:6px 0;">
                  지금 바로 ShopJoy에서 확인하세요!
                </div>
                <div style="color:#999;font-size:8px;margin-top:8px;text-align:center;padding-top:8px;border-top:1px solid #e8e8e8;">
                  © 2026 ShopJoy | 문의: 010-1234-5678 | demo@mail.com
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- ===== ■.■.■.■. 우측 컬럼 ============================================= -->
        <div style="display:flex;flex-direction:column;gap:16px;">
          <!-- ===== ■.■.■.■.■. QR코드 ============================================ -->
          <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;position:relative;background:linear-gradient(135deg, #fff 0%, rgba(232,88,122,0.01) 100%);">
            <div style="position:absolute;bottom:-15px;left:-15px;font-size:50px;opacity:0.05;transform:rotate(-20deg);">
              📱
            </div>
            <div style="font-size:12px;font-weight:600;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;width:100%;text-align:center;position:relative;z-index:1;">
              📱 QR코드
            </div>
            <div style="text-align:center;font-size:10px;color:#666;line-height:1.5;width:100%;position:relative;z-index:1;">
              <div style="font-weight:600;margin-bottom:4px;color:#222;">
                {{ form.couponNm }}
              </div>
              <div style="font-family:monospace;font-size:9px;background:#f5f5f5;padding:4px;border-radius:3px;margin:4px 0;">
                {{ form.couponCd || '---' }}
              </div>
              <div style="font-size:9px;">
                🏷️ {{ form.couponTypeCd }}
              </div>
              <div style="font-size:9px;color:#999;">
                ⏱️ {{ form.useLimit }}
              </div>
            </div>
            <div ref="qrcodeContainer" style="display:flex;align-items:center;justify-content:center;background:#fff;padding:8px;border:2px solid #e8587a;border-radius:4px;position:relative;z-index:1;">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:40px;font-weight:900;color:#e8587a;opacity:0.05;pointer-events:none;white-space:nowrap;letter-spacing:3px;">
                ShopJoy
              </div>
            </div>
          </div>
          <!-- ===== ■.■.■.■.■. 종이형태 ============================================ -->
          <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;">
            <div style="font-size:12px;font-weight:600;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;width:100%;text-align:center;">
              🎟 종이형태
            </div>
            <div style="width:100%;aspect-ratio:2/1.2;background:linear-gradient(135deg, #fff8f9 0%, #fff0f4 100%);border:2px solid #e8587a;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 2px 8px rgba(232,88,122,0.1);position:relative;overflow:hidden;">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:35px;font-weight:900;color:#e8587a;opacity:0.06;pointer-events:none;white-space:nowrap;letter-spacing:3px;">
                ShopJoy
              </div>
              <div style="position:absolute;top:6px;right:6px;font-size:8px;color:#e8587a;opacity:0.3;font-weight:700;letter-spacing:2px;">
                COUPON
              </div>
              <div>
                <div style="font-size:9px;color:#999;">
                  🛍️ ShopJoy
                </div>
                <div style="font-size:11px;font-weight:700;color:#e8587a;margin:2px 0;">
                  {{ form.couponNm }}
                </div>
              </div>
              <div style="text-align:center;background:rgba(255,255,255,0.5);padding:4px;border-radius:4px;">
                <div style="font-size:13px;color:#333;font-weight:700;">
                  {{ form.discountType==='amount' ? (form.discountVal||0).toLocaleString()+'원' : (form.discountVal||0)+'%' }}
                </div>
                <div style="font-size:8px;color:#666;">
                  {{ form.validFrom }} ~ {{ form.validTo }}
                </div>
                <div style="font-size:7px;color:#999;margin-top:2px;">
                  쿠폰번호: {{ form.couponCd || 'SAMPLE' }}
                </div>
              </div>
              <div style="display:flex;gap:6px;font-size:7px;color:#999;">
                <div style="flex:1;height:20px;background:#fff;border:1px solid #ddd;border-radius:2px;display:flex;align-items:center;justify-content:center;">
                  바코드
                </div>
                <div style="flex:1;height:20px;background:#fff;border:1px solid #ddd;border-radius:2px;display:flex;align-items:center;justify-content:center;">
                  일련번호
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- ===== □.□. 미리보기 ================================================== -->
    <!-- ===== ■.■. 상세정보 ================================================== -->
    <div class="card" v-show="showTab('detail')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        📋 상세정보
      </div>
      <!-- ===== ■.■.■. 발급대상 ================================================ -->
      <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e8e8e8;">
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:16px;">
          🎁 발급대상
        </h3>
        <div class="form-group">
          <label class="form-label">
            발급 대상 종류
          </label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <label v-for="t in codes.issue_targets" :key="Math.random()" style="display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid #ddd;border-radius:6px;cursor:pointer;background:form.targetTypeCd===t?'#e3f2fd':'#fff';">
              <input type="radio" :value="t" v-model="form.targetTypeCd" />
              {{ t }}
            </label>
          </div>
        </div>
        <div style="margin-top:16px;padding:12px;background:#f9f9f9;border-radius:6px;border:1px solid #e0e0e0;">
          <div style="font-size:12px;font-weight:700;color:#666;margin-bottom:8px;">
            선택된 대상:
            <span style="color:#e8587a;">
              {{ form.targetTypeCd }}
            </span>
          </div>
          <div style="font-size:13px;color:#888;">
            <template v-if="form.targetTypeCd==='상품'">
              선택한 상품에만 쿠폰을 발급합니다. 상품 추가 버튼으로 대상 상품을 선택하세요.
            </template>
            <template v-else-if="form.targetTypeCd==='판매업체'">
              선택한 판매업체의 상품에만 적용되는 쿠폰입니다.
            </template>
            <template v-else-if="form.targetTypeCd==='브랜드'">
              선택한 브랜드의 상품에만 적용되는 쿠폰입니다.
            </template>
            <template v-else-if="form.targetTypeCd==='카테고리'">
              선택한 카테고리의 상품에만 적용되는 쿠폰입니다.
            </template>
          </div>
        </div>
      </div>
      <!-- ===== ■.■.■. 지급방법/조건 (BoFormArea 자동 렌더) ========================== -->
      <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e8e8e8;">
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:16px;">
          📤 지급방법/조건
        </h3>
        <!-- ===== ■.■.■.■. 폼 영역 ============================================== -->
        <bo-form-area :columns="detailIssueFormColumns" :form="form" :errors="errors"
          :cols="2" :show-actions="false" />
        <!-- ===== ■.■.■.■. 적용 회원 등급 (체크박스 그룹, KEEP) ========================== -->
        <div class="form-group" style="margin-top:12px;">
          <label class="form-label">
            적용 회원 등급
          </label>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            <label v-for="g in ['전체', '일반', '실버', '골드', 'VIP']" :key="Math.random()" style="display:flex;align-items:center;gap:4px;padding:4px 10px;border:1px solid #ddd;border-radius:14px;cursor:pointer;">
              <input type="checkbox" :value="g" v-model="form.issueGrades" />
              {{ g }}
            </label>
          </div>
          <span v-if="form.issueGrades.length===0" style="font-size:12px;color:#aaa;">
            선택하지 않으면 전체 등급에 적용
          </span>
        </div>
      </div>
      <!-- ===== ■.■.■. 사용방법 (BoFormArea 자동 렌더) ============================= -->
      <div>
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:16px;">
          🔍 사용방법
        </h3>
        <!-- ===== ■.■.■.■. 폼 영역 ============================================== -->
        <bo-form-area :columns="detailUseFormColumns" :form="form" :errors="errors"
          :cols="2" :show-actions="false" />
      </div>
    </div>
    <!-- ===== □.□. 상세정보 ================================================== -->
    <!-- ===== ■.■. 발급목록 ================================================== -->
    <div class="card" v-show="showTab('issued')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        📊 발급목록
        <span class="tab-count">
          {{ cfIssuedList.length }}
        </span>
      </div>
      <div v-if="cfIssuedList.length === 0" style="text-align:center;color:#aaa;padding:30px;font-size:13px;">
        발급된 쿠폰이 없습니다.
      </div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid v-else bare :columns="issuedGridColumns" :rows="cfIssuedTop">
      </bo-grid>
    </div>
    <!-- ===== □.□. 발급목록 ================================================== -->
    <!-- ===== ■.■. 사용목록 ================================================== -->
    <div class="card" v-show="showTab('used')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        ✅ 사용목록
        <span class="tab-count">
          {{ cfUsedList.length }}
        </span>
      </div>
      <div v-if="cfUsedList.length === 0" style="text-align:center;color:#aaa;padding:30px;font-size:13px;">
        사용된 쿠폰이 없습니다.
      </div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid v-else bare :columns="usedGridColumns" :rows="cfUsedTop">
      </bo-grid>
    </div>
  </div>
  <!-- ===== □.□. 사용목록 ================================================== -->
  <!-- ===== □. 탭 컨텐츠 =================================================== -->
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="margin-top:16px;text-align:center;gap:8px;display:flex;justify-content:center;">
    <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요. (발급/사용/미리보기 탭은 조회 전용)' : ''" @click="handleBtnAction('form-save')" style="min-width:120px;">
      저장
    </button>
    <button class="btn btn-secondary" @click="handleBtnAction('form-cancel')" style="min-width:120px;">
      취소
    </button>
  </div>
</div>
<!-- ===== □. 본문 영역 =================================================== -->
`
};
