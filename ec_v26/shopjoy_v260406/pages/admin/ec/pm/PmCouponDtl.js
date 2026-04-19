/* ShopJoy Admin - 쿠폰관리 상세/등록 (다중탭: 기본정보/미리보기/상세정보/발급목록/사용목록) */
window._pmCouponDtlState = window._pmCouponDtlState || { tab: 'info', viewMode: 'tab' };
window.PmCouponDtl = {
  name: 'PmCouponDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, ref, onMounted, onBeforeUnmount, nextTick } = Vue;
    const isNew = computed(() => !props.editId);
    const tab = ref(window._pmCouponDtlState.tab || 'info');
    Vue.watch(tab, v => { window._pmCouponDtlState.tab = v; });
    const viewMode2 = ref(window._pmCouponDtlState.viewMode || 'tab');
    Vue.watch(viewMode2, v => { window._pmCouponDtlState.viewMode = v; });
    const showTab = (id) => viewMode2.value !== 'tab' || tab.value === id;

    const COUPON_TYPES = ['배송비할인쿠폰', '회원가입축하쿠폰', '상품할인쿠폰', '주문할인쿠폰', '클레임관리자지급쿠폰', 'VIP쿠폰'];
    const ISSUE_TARGETS = ['상품', '판매업체', '브랜드', '카테고리'];
    const DISCOUNT_TYPES = [{ value: 'amount', label: '정액' }, { value: 'percent', label: '정률' }];

    const form = reactive({
      couponId: null, couponType: '상품할인쿠폰', couponCode: '', couponNm: '',
      discountType: 'amount', discountVal: 0, minOrderAmt: 0, maxDiscountAmt: 0,
      status: '활성', startDate: '', endDate: '', totalIssue: 0, useLimit: 'unlimited',
      issueTo: '상품', issueTargets: [],
      issueMethods: 'auto', issueCondition: 'all', issueGrades: [],
      useScope: 'all', useExclude: '', useRemark: '',
      memo: '',
      vendorId: '', chargeStaff: '',
    });
    const errors = reactive({});

    const memoEl = ref(null);
    let _qMemo = null;

    const _today = new Date();
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END   = `${_today.getFullYear()+1}-12-31`;

    const schema = yup.object({
      couponNm: yup.string().required('쿠폰명을 입력해주세요.'),
      couponCode: yup.string().required('쿠폰코드를 입력해주세요.'),
      discountVal: yup.number().min(0).required('할인값을 입력해주세요.'),
      endDate: yup.string().required('만료일을 입력해주세요.'),
    });

    onMounted(async () => {
      if (!isNew.value) {
        const c = props.adminData.getCoupon(props.editId);
        if (c) Object.assign(form, { ...c });
      }
      if (!form.startDate) form.startDate = DEFAULT_START;
      if (!form.endDate) form.endDate = DEFAULT_END;
      await nextTick();
      if (memoEl.value && typeof Quill !== 'undefined') {
        _qMemo = new Quill(memoEl.value, {
          theme: 'snow',
          placeholder: '쿠폰 관련 메모를 입력하세요...',
          modules: { toolbar: [['bold','italic','underline'],[{color:[]}],[{list:'ordered'},{list:'bullet'}],['link','clean']] }
        });
        if (form.memo) _qMemo.root.innerHTML = form.memo;
        _qMemo.on('text-change', () => { form.memo = _qMemo.root.innerHTML; });
      }
    });

    onBeforeUnmount(() => { if (_qMemo) { form.memo = _qMemo.root.innerHTML; _qMemo = null; } });

    const showVendorModal = ref(false);
    const selectedVendorNm = computed(() => {
      if (!form.vendorId) return '소속업체 선택';
      const v = props.adminData.vendors.find(x => x.vendorId === form.vendorId);
      return v ? v.vendorNm : '소속업체 선택';
    });
    const selectVendor = (vendorId, vendorNm) => {
      form.vendorId = vendorId;
      showVendorModal.value = false;
    };

    /* 발급목록 */
    const issuedList = computed(() => {
      if (!props.adminData.coupons) return [];
      const c = props.adminData.coupons.find(x => x.couponId === props.editId);
      return c ? (c.issuedList || []) : [];
    });

    /* 사용목록 */
    const usedList = computed(() => {
      if (!props.adminData.coupons) return [];
      const c = props.adminData.coupons.find(x => x.couponId === props.editId);
      return c ? (c.usedList || []) : [];
    });

    /* 미리보기 형태 */
    const previewTab = ref('barcode');
    const barcodeContainer = ref(null);
    const qrcodeContainer = ref(null);
    const onPreviewTabChange = (pt) => {
      previewTab.value = pt;
      Vue.nextTick(() => {
        if (pt === 'barcode' && barcodeContainer.value && typeof JsBarcode !== 'undefined') {
          try {
            barcodeContainer.value.innerHTML = '';
            JsBarcode(barcodeContainer.value, form.couponCode || 'SAMPLE', {
              format: 'CODE128',
              width: 2,
              height: 60,
              displayValue: true,
            });
          } catch(e) {}
        }
        if (pt === 'qrcode' && qrcodeContainer.value && typeof QRCode !== 'undefined') {
          qrcodeContainer.value.innerHTML = '';
          try {
            new QRCode(qrcodeContainer.value, {
              text: form.couponCode ? `https://shopjoy.com/coupon/${form.couponCode}` : 'https://shopjoy.com/coupon/sample',
              width: 150,
              height: 150,
              colorDark: '#222222',
              colorLight: '#ffffff',
            });
          } catch(e) {}
        }
      });
    };

    const renderBarcode = () => {
      if (barcodeContainer.value && typeof JsBarcode !== 'undefined') {
        try {
          barcodeContainer.value.innerHTML = '';
          JsBarcode(barcodeContainer.value, form.couponCode || 'SAMPLE', {
            format: 'CODE128',
            width: 2,
            height: 60,
            displayValue: true,
          });
        } catch(e) {}
      }
    };
    const renderQRCode = () => {
      if (qrcodeContainer.value && typeof QRCode !== 'undefined') {
        try {
          qrcodeContainer.value.innerHTML = '';
          new QRCode(qrcodeContainer.value, {
            text: form.couponCode ? `https://shopjoy.com/coupon/${form.couponCode}` : 'https://shopjoy.com/coupon/sample',
            width: 150,
            height: 150,
            colorDark: '#222222',
            colorLight: '#ffffff',
          });
        } catch(e) {}
      }
    };
    const onTabChange = (newTab) => {
      tab.value = newTab;
      if (newTab === 'preview') {
        Vue.nextTick(() => {
          renderBarcode();
          renderQRCode();
        });
      }
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
      if (!props.adminData.coupons) props.adminData.coupons = [];
      if (isNew.value) {
        props.adminData.coupons.push({
          ...form,
          couponId: Date.now(),
          regDate: new Date().toISOString().slice(0, 10),
          issuedList: [],
          usedList: [],
        });
      } else {
        const idx = props.adminData.coupons.findIndex(x => x.couponId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.coupons[idx], { ...form });
      }
      try {
        const res = await (isNew.value ? window.adminApi.post(`coupons/${form.couponId}`, { ...form }) : window.adminApi.put(`coupons/${form.couponId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(isNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('pmCouponMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    return {
      isNew, tab, form, errors, showTab, viewMode2, save, memoEl, onTabChange,
      COUPON_TYPES, ISSUE_TARGETS, DISCOUNT_TYPES,
      issuedList, usedList, previewTab, onPreviewTabChange, barcodeContainer, qrcodeContainer,
      showVendorModal, selectedVendorNm, selectVendor,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '쿠폰 등록' : '쿠폰 수정' }}<span v-if="!isNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.couponId }}</span></div>
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:tab==='info'}" :disabled="viewMode2!=='tab'" @click="onTabChange('info')">📋 기본정보</button>
      <button class="tab-btn" :class="{active:tab==='detail'}" :disabled="viewMode2!=='tab'" @click="onTabChange('detail')">📋 상세정보</button>
      <button class="tab-btn" :class="{active:tab==='issued'}" :disabled="viewMode2!=='tab'" @click="onTabChange('issued')">📊 발급목록</button>
      <button class="tab-btn" :class="{active:tab==='used'}" :disabled="viewMode2!=='tab'" @click="onTabChange('used')">✅ 사용목록</button>
      <button class="tab-btn" :class="{active:tab==='preview'}" :disabled="viewMode2!=='tab'" @click="onTabChange('preview')">👁 미리보기</button>
    </div>
    <div class="tab-view-modes">
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='tab'}" @click="viewMode2='tab'" title="탭">📑</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='1col'}" @click="viewMode2='1col'" title="1열">1▭</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='2col'}" @click="viewMode2='2col'" title="2열">2▭</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='3col'}" @click="viewMode2='3col'" title="3열">3▭</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='4col'}" @click="viewMode2='4col'" title="4열">4▭</button>
    </div>
  </div>
  <div :class="viewMode2!=='tab' ? 'dtl-tab-grid cols-'+viewMode2.charAt(0) : ''">

    <!-- 기본정보 -->
    <div class="card" v-show="showTab('info')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📋 기본정보</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">쿠폰 타입</label>
          <select class="form-control" v-model="form.couponType">
            <option v-for="t in COUPON_TYPES" :key="t">{{ t }}</option>
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
          <input class="form-control" v-model="form.couponCode" placeholder="코드 자동생성/직접입력" :class="errors.couponCode ? 'is-invalid' : ''" />
          <span v-if="errors.couponCode" class="field-error">{{ errors.couponCode }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" v-model="form.status">
            <option>활성</option><option>비활성</option><option>중지</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">할인 유형</label>
          <select class="form-control" v-model="form.discountType">
            <option v-for="o in DISCOUNT_TYPES" :key="o.value" :value="o.value">{{ o.label }}</option>
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
          <input class="form-control" type="date" v-model="form.startDate" />
        </div>
        <div class="form-group">
          <label class="form-label">만료일 <span class="req">*</span></label>
          <input class="form-control" type="date" v-model="form.endDate" :class="errors.endDate ? 'is-invalid' : ''" />
          <span v-if="errors.endDate" class="field-error">{{ errors.endDate }}</span>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">총 발급수량</label>
          <input class="form-control" type="number" v-model.number="form.totalIssue" placeholder="0 = 무제한" />
        </div>
        <div class="form-group">
          <label class="form-label">사용 제한</label>
          <select class="form-control" v-model="form.useLimit">
            <option value="unlimited">무제한</option><option value="once">1회만</option><option value="month">월 1회</option>
          </select>
        </div>
      </div>
      <div style="margin-top:16px;">
        <label class="form-label">메모</label>
        <div ref="memoEl" style="min-height:120px;"></div>
      </div>
      <div class="form-row" style="margin-top:20px;padding-top:20px;border-top:1px solid #e8e8e8;">
        <div class="form-group">
          <label class="form-label">판매업체</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <div class="form-control" style="background:#f9f9f9;cursor:pointer;padding:0;display:flex;align-items:center;" @click="showVendorModal=true">
              <span style="padding:8px 12px;flex:1;">{{ selectedVendorNm }}</span>
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

      <!-- 판매업체 선택 모달 -->
      <div v-if="showVendorModal" class="modal-overlay" @click.self="showVendorModal=false">
        <div class="modal-box" style="width:400px;">
          <div class="modal-header">
            <span class="modal-title">판매업체 선택</span>
            <span class="modal-close" @click="showVendorModal=false">×</span>
          </div>
          <div style="padding:0;max-height:400px;overflow-y:auto;">
            <div v-for="v in (adminData.vendors || [])" :key="v.vendorId"
              style="padding:12px 16px;border-bottom:1px solid #f0f0f0;cursor:pointer;display:flex;justify-content:space-between;align-items:center;"
              :style="form.vendorId===v.vendorId?{background:'#f0f4ff',color:'#1565c0'}:{}"
              @click="selectVendor(v.vendorId, v.vendorNm)">
              <span style="font-weight:500;">{{ v.vendorNm }}</span>
              <span v-if="form.vendorId===v.vendorId" style="color:#1565c0;font-weight:700;">✓</span>
            </div>
            <div v-if="!adminData.vendors || adminData.vendors.length===0" style="padding:20px;text-align:center;color:#aaa;font-size:13px;">
              판매업체가 없습니다.
            </div>
          </div>
          <div style="padding:12px 16px;border-top:1px solid #f0f0f0;text-align:right;">
            <button class="btn btn-secondary btn-sm" @click="showVendorModal=false">닫기</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 미리보기 -->
    <div class="card" v-show="showTab('preview')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">👁 미리보기</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:20px;">
        <!-- 좌측 컬럼 -->
        <div style="display:flex;flex-direction:column;gap:16px;">
          <!-- 바코드 -->
          <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;position:relative;background:linear-gradient(to right, #fff 0%, rgba(232,88,122,0.02) 100%);">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-25deg);font-size:80px;font-weight:900;color:#e8587a;opacity:0.08;pointer-events:none;white-space:nowrap;letter-spacing:8px;">ShopJoy</div>
            <div style="position:absolute;top:-20px;right:-20px;font-size:60px;opacity:0.04;transform:rotate(-15deg);pointer-events:none;">🎟️</div>
            <div style="font-size:12px;font-weight:600;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;width:100%;text-align:center;position:relative;z-index:1;">📊 바코드</div>
            <div style="text-align:center;font-size:10px;color:#666;line-height:1.5;width:100%;position:relative;z-index:1;">
              <div style="font-weight:600;margin-bottom:4px;color:#222;">{{ form.couponNm }}</div>
              <div style="font-size:9px;">🏷️ {{ form.couponCode || 'SAMPLE' }}</div>
              <div style="font-weight:600;color:#e8587a;margin:4px 0;">{{ form.discountType==='amount' ? (form.discountVal||0).toLocaleString()+'원' : (form.discountVal||0)+'%' }}</div>
              <div style="font-size:9px;color:#999;">📅 {{ form.startDate }} ~ {{ form.endDate }}</div>
              <div style="font-size:9px;color:#999;">💳 최소주문: {{ (form.minOrderAmt||0).toLocaleString() }}원</div>
            </div>
            <div ref="barcodeContainer" style="display:flex;align-items:center;justify-content:center;background:#fff;padding:8px;border:1px solid #ddd;border-radius:4px;width:100%;position:relative;z-index:1;">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:45px;font-weight:900;color:#e8587a;opacity:0.05;pointer-events:none;white-space:nowrap;letter-spacing:3px;">ShopJoy</div>
            </div>
          </div>
          <!-- SNS전송형태 -->
          <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;position:relative;overflow:hidden;">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-25deg);font-size:70px;font-weight:900;color:#e8587a;opacity:0.08;pointer-events:none;white-space:nowrap;letter-spacing:6px;z-index:0;">ShopJoy</div>
            <div style="font-size:12px;font-weight:600;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;width:100%;text-align:center;position:relative;z-index:1;">💬 SNS전송형태 (카톡)</div>
            <div style="background:#fff;padding:12px;border:1px solid #e0e0e0;border-radius:6px;text-align:left;font-size:10px;line-height:1.6;color:#333;width:100%;position:relative;z-index:1;">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:40px;font-weight:900;color:#e8587a;opacity:0.05;pointer-events:none;white-space:nowrap;letter-spacing:3px;">ShopJoy</div>
              <div style="font-weight:600;margin-bottom:6px;">🎁 {{ form.couponNm }}</div>
              <div style="color:#666;margin:3px 0;">쿠폰번호: {{ form.couponCode || 'SAMPLE' }}</div>
              <div style="color:#666;margin:3px 0;">할인: {{ form.discountType==='amount' ? (form.discountVal||0).toLocaleString()+'원' : (form.discountVal||0)+'%' }}</div>
              <div style="color:#666;margin:3px 0;">유효기간: {{ form.startDate }} ~ {{ form.endDate }}</div>
              <div style="color:#666;margin:3px 0;">최소주문: {{ (form.minOrderAmt||0).toLocaleString() }}원</div>
              <div style="color:#999;font-size:9px;margin-top:6px;">ShopJoy에서 확인하기 &gt;</div>
            </div>
          </div>
          <!-- 이메일 내용 -->
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
                  <div style="color:#666;font-size:8px;margin:3px 0;">쿠폰번호: {{ form.couponCode || 'SAMPLE' }}</div>
                  <div style="color:#666;font-size:8px;margin:3px 0;">할인: {{ form.discountType==='amount' ? (form.discountVal||0).toLocaleString()+'원' : (form.discountVal||0)+'%' }}</div>
                  <div style="color:#666;font-size:8px;margin:3px 0;">유효기간: {{ form.startDate }} ~ {{ form.endDate }}</div>
                  <div style="color:#666;font-size:8px;margin:3px 0;">최소주문: {{ (form.minOrderAmt||0).toLocaleString() }}원</div>
                  <div style="color:#666;font-size:8px;margin:3px 0;">쿠폰타입: {{ form.couponType }}</div>
                </div>
                <div style="color:#666;margin:6px 0;">지금 바로 ShopJoy에서 확인하세요!</div>
                <div style="color:#999;font-size:8px;margin-top:8px;text-align:center;padding-top:8px;border-top:1px solid #e8e8e8;">© 2026 ShopJoy | 문의: 010-1234-5678 | demo@mail.com</div>
              </div>
            </div>
          </div>
        </div>
        <!-- 우측 컬럼 -->
        <div style="display:flex;flex-direction:column;gap:16px;">
          <!-- QR코드 -->
          <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;position:relative;background:linear-gradient(135deg, #fff 0%, rgba(232,88,122,0.01) 100%);">
            <div style="position:absolute;bottom:-15px;left:-15px;font-size:50px;opacity:0.05;transform:rotate(-20deg);">📱</div>
            <div style="font-size:12px;font-weight:600;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;width:100%;text-align:center;position:relative;z-index:1;">📱 QR코드</div>
            <div style="text-align:center;font-size:10px;color:#666;line-height:1.5;width:100%;position:relative;z-index:1;">
              <div style="font-weight:600;margin-bottom:4px;color:#222;">{{ form.couponNm }}</div>
              <div style="font-family:monospace;font-size:9px;background:#f5f5f5;padding:4px;border-radius:3px;margin:4px 0;">{{ form.couponCode || '---' }}</div>
              <div style="font-size:9px;">🏷️ {{ form.couponType }}</div>
              <div style="font-size:9px;color:#999;">⏱️ {{ form.useLimit }}</div>
            </div>
            <div ref="qrcodeContainer" style="display:flex;align-items:center;justify-content:center;background:#fff;padding:8px;border:2px solid #e8587a;border-radius:4px;position:relative;z-index:1;">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:40px;font-weight:900;color:#e8587a;opacity:0.05;pointer-events:none;white-space:nowrap;letter-spacing:3px;">ShopJoy</div>
            </div>
          </div>
          <!-- 종이형태 -->
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
                <div style="font-size:8px;color:#666;">{{ form.startDate }} ~ {{ form.endDate }}</div>
                <div style="font-size:7px;color:#999;margin-top:2px;">쿠폰번호: {{ form.couponCode || 'SAMPLE' }}</div>
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

    <!-- 상세정보 -->
    <div class="card" v-show="showTab('detail')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📋 상세정보</div>

      <!-- 발급대상 -->
      <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e8e8e8;">
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:16px;">🎁 발급대상</h3>
        <div class="form-group">
          <label class="form-label">발급 대상 종류</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <label v-for="t in ISSUE_TARGETS" :key="t" style="display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid #ddd;border-radius:6px;cursor:pointer;background:form.issueTo===t?'#e3f2fd':'#fff';">
              <input type="radio" :value="t" v-model="form.issueTo" />
              {{ t }}
            </label>
          </div>
        </div>
        <div style="margin-top:16px;padding:12px;background:#f9f9f9;border-radius:6px;border:1px solid #e0e0e0;">
          <div style="font-size:12px;font-weight:700;color:#666;margin-bottom:8px;">선택된 대상: <span style="color:#e8587a;">{{ form.issueTo }}</span></div>
          <div style="font-size:13px;color:#888;">
            <template v-if="form.issueTo==='상품'">
              선택한 상품에만 쿠폰을 발급합니다. 상품 추가 버튼으로 대상 상품을 선택하세요.
            </template>
            <template v-else-if="form.issueTo==='판매업체'">
              선택한 판매업체의 상품에만 적용되는 쿠폰입니다.
            </template>
            <template v-else-if="form.issueTo==='브랜드'">
              선택한 브랜드의 상품에만 적용되는 쿠폰입니다.
            </template>
            <template v-else-if="form.issueTo==='카테고리'">
              선택한 카테고리의 상품에만 적용되는 쿠폰입니다.
            </template>
          </div>
        </div>
      </div>

      <!-- 지급방법/조건 -->
      <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e8e8e8;">
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:16px;">📤 지급방법/조건</h3>
        <div class="form-group">
          <label class="form-label">지급 방법</label>
          <select class="form-control" v-model="form.issueMethods">
            <option value="auto">자동 발급</option><option value="manual">수동 발급</option><option value="event">이벤트 발급</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">지급 조건</label>
          <select class="form-control" v-model="form.issueCondition">
            <option value="all">전체 회원</option><option value="newMember">신규 회원</option><option value="subscribe">구독자</option><option value="purchase">구매 고객</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">적용 회원 등급</label>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            <label v-for="g in ['전체', '일반', '실버', '골드', 'VIP']" :key="g" style="display:flex;align-items:center;gap:4px;padding:4px 10px;border:1px solid #ddd;border-radius:14px;cursor:pointer;">
              <input type="checkbox" :value="g" v-model="form.issueGrades" />
              {{ g }}
            </label>
          </div>
          <span v-if="form.issueGrades.length===0" style="font-size:12px;color:#aaa;">선택하지 않으면 전체 등급에 적용</span>
        </div>
      </div>

      <!-- 사용방법 -->
      <div>
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:16px;">🔍 사용방법</h3>
        <div class="form-group">
          <label class="form-label">사용 범위</label>
          <select class="form-control" v-model="form.useScope">
            <option value="all">모든 상품</option><option value="category">카테고리 제한</option><option value="product">특정 상품만</option><option value="exclude">제외 상품</option>
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

    <!-- 발급목록 -->
    <div class="card" v-show="showTab('issued')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📊 발급목록 <span class="tab-count">{{ issuedList.length }}</span></div>
      <div v-if="issuedList.length === 0" style="text-align:center;color:#aaa;padding:30px;font-size:13px;">발급된 쿠폰이 없습니다.</div>
      <table v-else class="admin-table" style="font-size:12px;">
        <thead><tr><th>쿠폰코드</th><th>발급대상</th><th>발급일시</th><th>유효기간</th><th>상태</th></tr></thead>
        <tbody>
          <tr v-for="(item, idx) in issuedList.slice(0, 10)" :key="idx">
            <td>{{ item.code || '-' }}</td>
            <td>{{ item.target || '-' }}</td>
            <td>{{ item.issuedDate || '-' }}</td>
            <td>{{ item.expiryDate || '-' }}</td>
            <td><span class="badge" :class="item.status==='사용'?'badge-blue':'badge-green'">{{ item.status || '미사용' }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 사용목록 -->
    <div class="card" v-show="showTab('used')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">✅ 사용목록 <span class="tab-count">{{ usedList.length }}</span></div>
      <div v-if="usedList.length === 0" style="text-align:center;color:#aaa;padding:30px;font-size:13px;">사용된 쿠폰이 없습니다.</div>
      <table v-else class="admin-table" style="font-size:12px;">
        <thead><tr><th>쿠폰코드</th><th>사용자</th><th>주문ID</th><th>주문금액</th><th>할인액</th><th>사용일시</th></tr></thead>
        <tbody>
          <tr v-for="(item, idx) in usedList.slice(0, 10)" :key="idx">
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
    <button class="btn btn-primary" @click="save" style="min-width:120px;">저장</button>
    <button class="btn btn-secondary" @click="navigate('pmCouponMng')" style="min-width:120px;">취소</button>
  </div>
</div>
`
};
