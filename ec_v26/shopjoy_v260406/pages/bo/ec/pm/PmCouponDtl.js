/* ShopJoy Admin - 쿠폰관리 상세/등록 (다중탭: 기본정보/미리보기/상세정보/발급목록/사용목록) */
window._pmCouponDtlState = window._pmCouponDtlState || { tab: 'info', tabMode: 'tab' };
window.PmCouponDtl = {
  name: 'PmCouponDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    tabMode:      { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    const { ref, reactive, computed, onMounted, watch, onBeforeUnmount, nextTick } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
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

    // 단건 조회
    const handleSearchDetail = async () => {
      if (cfIsNew.value) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.pmCoupon.getById(props.dtlId, '쿠폰관리', '상세조회');
        const c = res.data?.data || res.data;
        if (c) Object.assign(form, { ...c });
        // Entity discountRate/discountAmt → UI 단일 입력 매핑
        if (c) {
          if (c.discountRate != null && c.discountRate !== '') { form.discountType = 'percent'; form.discountVal = Number(c.discountRate) || 0; }
          else { form.discountType = 'amount'; form.discountVal = Number(c.discountAmt) || 0; }
        }
        if (!form.validFrom) form.validFrom = DEFAULT_START;
        if (!form.validTo) form.validTo = DEFAULT_END;
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    const cfIsNew = computed(() => !props.dtlId);

watch(() => uiState.tab, v => { window._pmCouponDtlState.tab = v; });

        watch(() => uiState.tabMode2, v => { window._pmCouponDtlState.tabMode = v; });

    /* 쿠폰 showTab */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;

    /* 쿠폰 fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.coupon_statuses_dtl = codeStore.sgGetGrpCodes('COUPON_STATUS_DTL');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);


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

    /* 쿠폰 _pad */
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END   = `${_today.getFullYear()+1}-12-31`;

    const schema = yup.object({
      couponNm: yup.string().required('쿠폰명을 입력해주세요.'),
      couponCd: yup.string().required('쿠폰코드를 입력해주세요.'),
      discountVal: yup.number().min(0).required('할인값을 입력해주세요.'),
      validTo: yup.string().required('만료일을 입력해주세요.'),
    });

    /* 쿠폰 handleInitForm */
    const handleInitForm = () => {
      if (cfIsNew.value) {
        if (!form.validFrom) form.validFrom = DEFAULT_START;
        if (!form.validTo) form.validTo = DEFAULT_END;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      await handleSearchDetail();
      handleInitForm();
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) return;
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleSearchDetail();
      handleInitForm();
    });

    const cfSelectedVendorNm = computed(() => {
      if (!form.vendorId) return '소속업체 선택';
      const v = vendors.value.find(x => x.vendorId === form.vendorId);
      return v ? v.vendorNm : '소속업체 선택';
    });

    /* 쿠폰 selectVendor */
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

    /* 쿠폰 renderBarcode */
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

    /* 쿠폰 renderQRCode */
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
    const onTabChange = (newTab) => {
      uiState.tab = newTab;
      if (newTab === 'preview') {
        Vue.nextTick(() => {
          renderBarcode();
          renderQRCode();
        });
      }
    };

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

    /* 쿠폰 _afterApiOk */
    const _afterApiOk  = (res, msg) => {
      if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
      if (showToast) showToast(msg, 'success');
    };

    /* 쿠폰 _afterApiErr */
    const _afterApiErr = (err) => {
      console.error('[handleSave]', err);
      const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
      if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
      if (showToast) showToast(errMsg, 'error', 0);
    };

    /* ── 탭별 저장: info/detail 은 form 전체 저장. 그 외 탭은 저장 의미 없음 ── */
    const handleSave = async () => {
      const tabId = uiState.tab;

      if (cfSaveDisabled.value) {
        if (!cfHasId.value && tabId !== 'info') showToast('먼저 기본정보 탭에서 등록해주세요.', 'error');
        return;
      }

      if (tabId !== 'info' && tabId !== 'detail') return;   // 안전장치

      Object.keys(errors).forEach(k => delete errors[k]);
      try { await schema.validate(form, { abortEarly: false }); }
      catch (err) { err.inner.forEach(e => { errors[e.path] = e.message; }); showToast('입력 내용을 확인해주세요.', 'error'); return; }

      const isCreate = !cfHasId.value;
      const ok = await showConfirm(isCreate ? '등록' : '저장', isCreate ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
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
          if (newId) form.couponId = newId;
        }
        _afterApiOk(res, isCreate ? '등록되었습니다. 다른 탭을 저장할 수 있습니다.' : '저장되었습니다.');
      } catch (err) { _afterApiErr(err); }
    };

    const barcodeContainer = Vue.toRef(uiState, 'barcodeContainer');
    const previewTab = Vue.toRef(uiState, 'previewTab');
    const qrcodeContainer = Vue.toRef(uiState, 'qrcodeContainer');
    const showVendorModal = Vue.toRef(uiState, 'showVendorModal');

    // -- return ---------------------------------------------------------------

    return { uiState, codes, cfIsNew, cfHasId, cfSaveDisabled, tab, form, errors, showTab, tabMode2, handleSave, onTabChange,
      cfIssuedList, cfUsedList, previewTab, onPreviewTabChange, barcodeContainer, qrcodeContainer,
      cfSelectedVendorNm, selectVendor,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ cfIsNew ? '쿠폰 등록' : '쿠폰 수정' }}<span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.couponId }}</span></div>
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:tab==='info'}" :disabled="tabMode2!=='tab'" @click="onTabChange('info')">📋 기본정보</button>
      <button class="tab-btn" :class="{active:tab==='detail'}" :disabled="tabMode2!=='tab'" @click="onTabChange('detail')">📋 상세정보</button>
      <button class="tab-btn" :class="{active:tab==='issued'}" :disabled="tabMode2!=='tab'" @click="onTabChange('issued')">📊 발급목록</button>
      <button class="tab-btn" :class="{active:tab==='used'}" :disabled="tabMode2!=='tab'" @click="onTabChange('used')">✅ 사용목록</button>
      <button class="tab-btn" :class="{active:tab==='preview'}" :disabled="tabMode2!=='tab'" @click="onTabChange('preview')">👁 미리보기</button>
    </div>
    <div class="tab-modes">
      <button class="tab-mode-btn" :class="{active:tabMode2==='tab'}" @click="tabMode2='tab'" title="탭">📑</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='1col'}" @click="tabMode2='1col'" title="1열">1▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='2col'}" @click="tabMode2='2col'" title="2열">2▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='3col'}" @click="tabMode2='3col'" title="3열">3▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='4col'}" @click="tabMode2='4col'" title="4열">4▭</button>
    </div>
  </div>
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">

    <!-- -- 기본정보 --------------------------------------------------------- -->
    <div class="card" v-show="showTab('info')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📋 기본정보</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">쿠폰 타입</label>
          <select class="form-control" v-model="form.couponTypeCd">
            <option v-for="t in codes.coupon_types" :key="Math.random()">{{ t }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">쿠폰명 <span class="req">*</span></label>
          <input class="form-control" v-model="form.couponNm" placeholder="쿠폰명 입력" :class="errors.couponNm ? 'is-invalid' : ''" />
          <span v-if="errors.couponNm" class="field-error">{{ errors.couponNm }}</span>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">쿠폰코드 <span class="req">*</span></label>
          <input class="form-control" v-model="form.couponCd" placeholder="코드 자동생성/직접입력" :class="errors.couponCd ? 'is-invalid' : ''" />
          <span v-if="errors.couponCd" class="field-error">{{ errors.couponCd }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" v-model="form.couponStatusCd">
            <option v-for="c in codes.coupon_statuses_dtl" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">할인 유형</label>
          <select class="form-control" v-model="form.discountType">
            <option v-for="o in codes.discount_types" :key="o?.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">할인값 <span class="req">*</span></label>
          <input class="form-control" type="number" v-model.number="form.discountVal" :placeholder="form.discountType==='percent' ? '% 입력' : '원 입력'" :class="errors.discountVal ? 'is-invalid' : ''" />
          <span v-if="errors.discountVal" class="field-error">{{ errors.discountVal }}</span>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">최소주문금액 (원)</label>
          <input class="form-control" type="number" v-model.number="form.minOrderAmt" placeholder="0" />
        </div>
        <div class="form-group">
          <label class="form-label">최대할인금액 (원)</label>
          <input class="form-control" type="number" v-model.number="form.maxDiscountAmt" placeholder="0 = 무제한" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">시작일</label>
          <input class="form-control" type="date" v-model="form.validFrom" />
        </div>
        <div class="form-group">
          <label class="form-label">만료일 <span class="req">*</span></label>
          <input class="form-control" type="date" v-model="form.validTo" :class="errors.validTo ? 'is-invalid' : ''" />
          <span v-if="errors.validTo" class="field-error">{{ errors.validTo }}</span>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">총 발급수량</label>
          <input class="form-control" type="number" v-model.number="form.issueLimit" placeholder="0 = 무제한" />
        </div>
        <div class="form-group">
          <label class="form-label">사용 제한</label>
          <select class="form-control" v-model="form.useLimit">
            <option v-for="o in codes.coupon_use_limit_opts" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
      </div>
      <div style="margin-top:16px;">
        <label class="form-label">메모</label>
        <base-html-editor v-model="form.memo" height="200px" />
      </div>
      <div class="form-row" style="margin-top:20px;padding-top:20px;border-top:1px solid #e8e8e8;">
        <div class="form-group">
          <label class="form-label">판매업체</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <div class="form-control" style="background:#f9f9f9;cursor:pointer;padding:0;display:flex;align-items:center;" @click="showVendorModal=true">
              <span style="padding:8px 12px;flex:1;">{{ cfSelectedVendorNm }}</span>
              <span style="padding:8px 12px;color:#999;font-size:12px;">▼</span>
            </div>
            <button v-if="form.vendorId" class="btn btn-sm" style="padding:0 12px;color:#666;" @click="form.vendorId='';form.chargeStaff=''">초기화</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">판매담당자</label>
          <input class="form-control" v-model="form.chargeStaff" placeholder="담당자명 입력" />
        </div>
      </div>

      <!-- -- 판매업체 선택 모달 ------------------------------------------------- -->
      <div v-if="showVendorModal" class="modal-overlay" @click.self="showVendorModal=false">
        <div class="modal-box" style="width:400px;">
          <div class="modal-header">
            <span class="modal-title">판매업체 선택</span>
            <span class="modal-close" @click="showVendorModal=false">×</span>
          </div>
          <div style="padding:0;max-height:400px;overflow-y:auto;">
            <div v-for="v in ([] || [])" :key="v?.vendorId"
              style="padding:12px 16px;border-bottom:1px solid #f0f0f0;cursor:pointer;display:flex;justify-content:space-between;align-items:center;"
              :style="form.vendorId===v.vendorId?{background:'#f0f4ff',color:'#1565c0'}:{}"
              @click="selectVendor(v.vendorId, v.vendorNm)">
              <span style="font-weight:500;">{{ v.vendorNm }}</span>
              <span v-if="form.vendorId===v.vendorId" style="color:#1565c0;font-weight:700;">✓</span>
            </div>
            <div v-if="![] || [].length===0" style="padding:20px;text-align:center;color:#aaa;font-size:13px;">
              판매업체가 없습니다.
            </div>
          </div>
          <div style="padding:12px 16px;border-top:1px solid #f0f0f0;text-align:right;">
            <button class="btn btn-secondary btn-sm" @click="showVendorModal=false">닫기</button>
          </div>
        </div>
      </div>
    </div>

    <!-- -- 미리보기 --------------------------------------------------------- -->
    <div class="card" v-show="showTab('preview')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">👁 미리보기</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:20px;">
        <!-- -- 좌측 컬럼 ---------------------------------------------------- -->
        <div style="display:flex;flex-direction:column;gap:16px;">
          <!-- -- 바코드 ---------------------------------------------------- -->
          <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;position:relative;background:linear-gradient(to right, #fff 0%, rgba(232,88,122,0.02) 100%);">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-25deg);font-size:80px;font-weight:900;color:#e8587a;opacity:0.08;pointer-events:none;white-space:nowrap;letter-spacing:8px;">ShopJoy</div>
            <div style="position:absolute;top:-20px;right:-20px;font-size:60px;opacity:0.04;transform:rotate(-15deg);pointer-events:none;">🎟️</div>
            <div style="font-size:12px;font-weight:600;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;width:100%;text-align:center;position:relative;z-index:1;">📊 바코드</div>
            <div style="text-align:center;font-size:10px;color:#666;line-height:1.5;width:100%;position:relative;z-index:1;">
              <div style="font-weight:600;margin-bottom:4px;color:#222;">{{ form.couponNm }}</div>
              <div style="font-size:9px;">🏷️ {{ form.couponCd || 'SAMPLE' }}</div>
              <div style="font-weight:600;color:#e8587a;margin:4px 0;">{{ form.discountType==='amount' ? (form.discountVal||0).toLocaleString()+'원' : (form.discountVal||0)+'%' }}</div>
              <div style="font-size:9px;color:#999;">📅 {{ form.validFrom }} ~ {{ form.validTo }}</div>
              <div style="font-size:9px;color:#999;">💳 최소주문: {{ (form.minOrderAmt||0).toLocaleString() }}원</div>
            </div>
            <div ref="barcodeContainer" style="display:flex;align-items:center;justify-content:center;background:#fff;padding:8px;border:1px solid #ddd;border-radius:4px;width:100%;position:relative;z-index:1;">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:45px;font-weight:900;color:#e8587a;opacity:0.05;pointer-events:none;white-space:nowrap;letter-spacing:3px;">ShopJoy</div>
            </div>
          </div>
          <!-- -- SNS전송형태 ------------------------------------------------ -->
          <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;position:relative;overflow:hidden;">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-25deg);font-size:70px;font-weight:900;color:#e8587a;opacity:0.08;pointer-events:none;white-space:nowrap;letter-spacing:6px;z-index:0;">ShopJoy</div>
            <div style="font-size:12px;font-weight:600;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;width:100%;text-align:center;position:relative;z-index:1;">💬 SNS전송형태 (카톡)</div>
            <div style="background:#fff;padding:12px;border:1px solid #e0e0e0;border-radius:6px;text-align:left;font-size:10px;line-height:1.6;color:#333;width:100%;position:relative;z-index:1;">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:40px;font-weight:900;color:#e8587a;opacity:0.05;pointer-events:none;white-space:nowrap;letter-spacing:3px;">ShopJoy</div>
              <div style="font-weight:600;margin-bottom:6px;">🎁 {{ form.couponNm }}</div>
              <div style="color:#666;margin:3px 0;">쿠폰번호: {{ form.couponCd || 'SAMPLE' }}</div>
              <div style="color:#666;margin:3px 0;">할인: {{ form.discountType==='amount' ? (form.discountVal||0).toLocaleString()+'원' : (form.discountVal||0)+'%' }}</div>
              <div style="color:#666;margin:3px 0;">유효기간: {{ form.validFrom }} ~ {{ form.validTo }}</div>
              <div style="color:#666;margin:3px 0;">최소주문: {{ (form.minOrderAmt||0).toLocaleString() }}원</div>
              <div style="color:#999;font-size:9px;margin-top:6px;">ShopJoy에서 확인하기 &gt;</div>
            </div>
          </div>
          <!-- -- 이메일 내용 ------------------------------------------------- -->
          <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;">
            <div style="font-size:12px;font-weight:600;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;width:100%;text-align:center;">📧 이메일 내용</div>
            <div style="background:linear-gradient(180deg, #f9f9f9 0%, #fafbfc 100%);padding:12px;border:1px solid #e8e8e8;border-radius:6px;text-align:left;font-size:9px;line-height:1.6;color:#333;width:100%;position:relative;overflow:hidden;">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-25deg);font-size:70px;font-weight:900;color:#e8587a;opacity:0.07;pointer-events:none;white-space:nowrap;letter-spacing:6px;">ShopJoy</div>
              <div style="position:absolute;top:-10px;right:-10px;font-size:50px;opacity:0.03;transform:rotate(20deg);">📧</div>
              <div style="background:linear-gradient(135deg, #e8587a 0%, #ff7a9a 100%);color:#fff;padding:8px;border-radius:4px;margin:-12px -12px 8px -12px;text-align:center;position:relative;z-index:1;">
                <div style="font-weight:600;font-size:10px;">🛍️ ShopJoy 쿠폰 알림</div>
              </div>
              <div style="position:relative;z-index:1;">
                <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:40px;font-weight:900;color:#e8587a;opacity:0.05;pointer-events:none;white-space:nowrap;letter-spacing:3px;">ShopJoy</div>
                <div style="font-weight:600;margin-bottom:8px;">제목: {{ form.couponNm }}</div>
                <div style="color:#666;margin:4px 0;">보낸 사람: ShopJoy (noreply@shopjoy.com)</div>
                <div style="color:#666;margin:6px 0;">안녕하세요, 송지선 회원님!</div>
                <div style="color:#666;margin:6px 0;">ShopJoy에서 특별한 쿠폰을 준비했습니다.</div>
                <div style="background:#fff;padding:8px;border:2px solid #e8587a;border-radius:4px;margin:8px 0;">
                  <div style="font-weight:600;color:#e8587a;margin-bottom:4px;">🎁 {{ form.couponNm }}</div>
                  <div style="color:#666;font-size:8px;margin:3px 0;">쿠폰번호: {{ form.couponCd || 'SAMPLE' }}</div>
                  <div style="color:#666;font-size:8px;margin:3px 0;">할인: {{ form.discountType==='amount' ? (form.discountVal||0).toLocaleString()+'원' : (form.discountVal||0)+'%' }}</div>
                  <div style="color:#666;font-size:8px;margin:3px 0;">유효기간: {{ form.validFrom }} ~ {{ form.validTo }}</div>
                  <div style="color:#666;font-size:8px;margin:3px 0;">최소주문: {{ (form.minOrderAmt||0).toLocaleString() }}원</div>
                  <div style="color:#666;font-size:8px;margin:3px 0;">쿠폰타입: {{ form.couponTypeCd }}</div>
                </div>
                <div style="color:#666;margin:6px 0;">지금 바로 ShopJoy에서 확인하세요!</div>
                <div style="color:#999;font-size:8px;margin-top:8px;text-align:center;padding-top:8px;border-top:1px solid #e8e8e8;">© 2026 ShopJoy | 문의: 010-1234-5678 | demo@mail.com</div>
              </div>
            </div>
          </div>
        </div>
        <!-- -- 우측 컬럼 ---------------------------------------------------- -->
        <div style="display:flex;flex-direction:column;gap:16px;">
          <!-- -- QR코드 --------------------------------------------------- -->
          <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;position:relative;background:linear-gradient(135deg, #fff 0%, rgba(232,88,122,0.01) 100%);">
            <div style="position:absolute;bottom:-15px;left:-15px;font-size:50px;opacity:0.05;transform:rotate(-20deg);">📱</div>
            <div style="font-size:12px;font-weight:600;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;width:100%;text-align:center;position:relative;z-index:1;">📱 QR코드</div>
            <div style="text-align:center;font-size:10px;color:#666;line-height:1.5;width:100%;position:relative;z-index:1;">
              <div style="font-weight:600;margin-bottom:4px;color:#222;">{{ form.couponNm }}</div>
              <div style="font-family:monospace;font-size:9px;background:#f5f5f5;padding:4px;border-radius:3px;margin:4px 0;">{{ form.couponCd || '---' }}</div>
              <div style="font-size:9px;">🏷️ {{ form.couponTypeCd }}</div>
              <div style="font-size:9px;color:#999;">⏱️ {{ form.useLimit }}</div>
            </div>
            <div ref="qrcodeContainer" style="display:flex;align-items:center;justify-content:center;background:#fff;padding:8px;border:2px solid #e8587a;border-radius:4px;position:relative;z-index:1;">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:40px;font-weight:900;color:#e8587a;opacity:0.05;pointer-events:none;white-space:nowrap;letter-spacing:3px;">ShopJoy</div>
            </div>
          </div>
          <!-- -- 종이형태 --------------------------------------------------- -->
          <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;">
            <div style="font-size:12px;font-weight:600;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;width:100%;text-align:center;">🎟 종이형태</div>
            <div style="width:100%;aspect-ratio:2/1.2;background:linear-gradient(135deg, #fff8f9 0%, #fff0f4 100%);border:2px solid #e8587a;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 2px 8px rgba(232,88,122,0.1);position:relative;overflow:hidden;">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:35px;font-weight:900;color:#e8587a;opacity:0.06;pointer-events:none;white-space:nowrap;letter-spacing:3px;">ShopJoy</div>
              <div style="position:absolute;top:6px;right:6px;font-size:8px;color:#e8587a;opacity:0.3;font-weight:700;letter-spacing:2px;">COUPON</div>
              <div>
                <div style="font-size:9px;color:#999;">🛍️ ShopJoy</div>
                <div style="font-size:11px;font-weight:700;color:#e8587a;margin:2px 0;">{{ form.couponNm }}</div>
              </div>
              <div style="text-align:center;background:rgba(255,255,255,0.5);padding:4px;border-radius:4px;">
                <div style="font-size:13px;color:#333;font-weight:700;">{{ form.discountType==='amount' ? (form.discountVal||0).toLocaleString()+'원' : (form.discountVal||0)+'%' }}</div>
                <div style="font-size:8px;color:#666;">{{ form.validFrom }} ~ {{ form.validTo }}</div>
                <div style="font-size:7px;color:#999;margin-top:2px;">쿠폰번호: {{ form.couponCd || 'SAMPLE' }}</div>
              </div>
              <div style="display:flex;gap:6px;font-size:7px;color:#999;">
                <div style="flex:1;height:20px;background:#fff;border:1px solid #ddd;border-radius:2px;display:flex;align-items:center;justify-content:center;">바코드</div>
                <div style="flex:1;height:20px;background:#fff;border:1px solid #ddd;border-radius:2px;display:flex;align-items:center;justify-content:center;">일련번호</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- -- 상세정보 --------------------------------------------------------- -->
    <div class="card" v-show="showTab('detail')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📋 상세정보</div>

      <!-- -- 발급대상 ------------------------------------------------------- -->
      <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e8e8e8;">
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:16px;">🎁 발급대상</h3>
        <div class="form-group">
          <label class="form-label">발급 대상 종류</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <label v-for="t in codes.issue_targets" :key="Math.random()" style="display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid #ddd;border-radius:6px;cursor:pointer;background:form.targetTypeCd===t?'#e3f2fd':'#fff';">
              <input type="radio" :value="t" v-model="form.targetTypeCd" />
              {{ t }}
            </label>
          </div>
        </div>
        <div style="margin-top:16px;padding:12px;background:#f9f9f9;border-radius:6px;border:1px solid #e0e0e0;">
          <div style="font-size:12px;font-weight:700;color:#666;margin-bottom:8px;">선택된 대상: <span style="color:#e8587a;">{{ form.targetTypeCd }}</span></div>
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

      <!-- -- 지급방법/조건 ---------------------------------------------------- -->
      <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e8e8e8;">
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:16px;">📤 지급방법/조건</h3>
        <div class="form-group">
          <label class="form-label">지급 방법</label>
          <select class="form-control" v-model="form.issueMethods">
            <option v-for="o in codes.coupon_issue_type_opts" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">지급 조건</label>
          <select class="form-control" v-model="form.issueCondition">
            <option v-for="o in codes.coupon_target_opts" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">적용 회원 등급</label>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            <label v-for="g in ['전체', '일반', '실버', '골드', 'VIP']" :key="Math.random()" style="display:flex;align-items:center;gap:4px;padding:4px 10px;border:1px solid #ddd;border-radius:14px;cursor:pointer;">
              <input type="checkbox" :value="g" v-model="form.issueGrades" />
              {{ g }}
            </label>
          </div>
          <span v-if="form.issueGrades.length===0" style="font-size:12px;color:#aaa;">선택하지 않으면 전체 등급에 적용</span>
        </div>
      </div>

      <!-- -- 사용방법 ------------------------------------------------------- -->
      <div>
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:16px;">🔍 사용방법</h3>
        <div class="form-group">
          <label class="form-label">사용 범위</label>
          <select class="form-control" v-model="form.useScope">
            <option v-for="o in codes.coupon_apply_opts" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">제외 상품/카테고리</label>
          <textarea class="form-control" v-model="form.useExclude" rows="3" placeholder="쉼표로 구분하여 입력 (예: 상품ID1, 상품ID2, 카테고리ID3)" style="font-size:12px;"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">사용 제약사항</label>
          <textarea class="form-control" v-model="form.useRemark" rows="3" placeholder="예: 다른 쿠폰과 중복 사용 불가, 배송료 할인 쿠폰은 특정 배송사만 적용 등" style="font-size:12px;"></textarea>
        </div>
      </div>
    </div>

    <!-- -- 발급목록 --------------------------------------------------------- -->
    <div class="card" v-show="showTab('issued')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📊 발급목록 <span class="tab-count">{{ cfIssuedList.length }}</span></div>
      <div v-if="cfIssuedList.length === 0" style="text-align:center;color:#aaa;padding:30px;font-size:13px;">발급된 쿠폰이 없습니다.</div>
      <table v-else class="bo-table" style="font-size:12px;">
        <thead><tr><th>쿠폰코드</th><th>발급대상</th><th>발급일시</th><th>유효기간</th><th>상태</th></tr></thead>
        <tbody>
          <tr v-for="(item, idx) in cfIssuedList.slice(0, 10)" :key="idx">
            <td>{{ item.code || '-' }}</td>
            <td>{{ item.target || '-' }}</td>
            <td>{{ item.issuedDate || '-' }}</td>
            <td>{{ item.expiryDate || '-' }}</td>
            <td><span class="badge" :class="item.status==='사용'?'badge-blue':'badge-green'">{{ item.status || '미사용' }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- -- 사용목록 --------------------------------------------------------- -->
    <div class="card" v-show="showTab('used')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">✅ 사용목록 <span class="tab-count">{{ cfUsedList.length }}</span></div>
      <div v-if="cfUsedList.length === 0" style="text-align:center;color:#aaa;padding:30px;font-size:13px;">사용된 쿠폰이 없습니다.</div>
      <table v-else class="bo-table" style="font-size:12px;">
        <thead><tr><th>쿠폰코드</th><th>사용자</th><th>주문ID</th><th>주문금액</th><th>할인액</th><th>사용일시</th></tr></thead>
        <tbody>
          <tr v-for="(item, idx) in cfUsedList.slice(0, 10)" :key="idx">
            <td>{{ item.code || '-' }}</td>
            <td>{{ item.userId || '-' }}</td>
            <td>{{ item.orderId || '-' }}</td>
            <td>{{ (item.orderAmt||0).toLocaleString() }}원</td>
            <td style="color:#e8587a;font-weight:600;">-{{ (item.discountAmt||0).toLocaleString() }}원</td>
            <td>{{ item.usedDate || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div style="margin-top:16px;text-align:center;gap:8px;display:flex;justify-content:center;">
    <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요. (발급/사용/미리보기 탭은 조회 전용)' : ''" @click="handleSave" style="min-width:120px;">저장</button>
    <button class="btn btn-secondary" @click="navigate('pmCouponMng')" style="min-width:120px;">취소</button>
  </div>
</div>
`
};
