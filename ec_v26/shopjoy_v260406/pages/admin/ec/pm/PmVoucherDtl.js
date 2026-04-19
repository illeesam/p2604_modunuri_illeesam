/* ShopJoy Admin - 상품권관리 상세/등록 (탭: 기본정보/미리보기/상세정보/발급내역/사용내역) */
window._pmVoucherDtlState = window._pmVoucherDtlState || { tab: 'info', viewMode: 'tab' };
window.PmVoucherDtl = {
  name: 'PmVoucherDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, ref, onMounted } = Vue;
    const isNew = computed(() => !props.editId);
    const tab = ref(window._pmVoucherDtlState.tab || 'info');
    Vue.watch(tab, v => { window._pmVoucherDtlState.tab = v; });
    const viewMode2 = ref(window._pmVoucherDtlState.viewMode || 'tab');
    Vue.watch(viewMode2, v => { window._pmVoucherDtlState.viewMode = v; });
    const showTab = (id) => viewMode2.value !== 'tab' || tab.value === id;

    const form = reactive({
      voucherId: null, voucherNm: '', voucherAmt: 0, salePrice: 0,
      issueQty: 0, soldQty: 0, voucherStatus: '활성', startDate: '', endDate: '',
      remark: '',
      vendorId: '', chargeStaff: '',
    });
    const errors = reactive({});

    const _today = new Date();
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END = `${_today.getFullYear()+1}-12-31`;

    const schema = yup.object({
      voucherNm: yup.string().required('상품권명을 입력해주세요.'),
      voucherAmt: yup.number().min(1000, '액면가는 1,000원 이상이어야 합니다.').required('액면가를 입력해주세요.'),
      salePrice: yup.number().min(0).required('판매가를 입력해주세요.'),
      issueQty: yup.number().min(1, '발행매수는 1개 이상이어야 합니다.').required('발행매수를 입력해주세요.'),
    });

    onMounted(() => {
      if (!isNew.value) {
        const v = (props.adminData.voucherList || []).find(x => x.voucherId === props.editId);
        if (v) Object.assign(form, { ...v });
      }
      if (!form.startDate) form.startDate = DEFAULT_START;
      if (!form.endDate) form.endDate = DEFAULT_END;
    });

    /* 발급내역 */
    const issuedList = computed(() => {
      if (!props.adminData.voucherList) return [];
      const v = props.adminData.voucherList.find(x => x.voucherId === props.editId);
      return v ? (v.issuedList || []) : [];
    });

    /* 사용내역 */
    const usedList = computed(() => {
      if (!props.adminData.voucherList) return [];
      const v = props.adminData.voucherList.find(x => x.voucherId === props.editId);
      return v ? (v.usedList || []) : [];
    });

    /* 미리보기 형태 */
    const previewTab = ref('barcode');
    const barcodeContainer = ref(null);
    const qrcodeContainer = ref(null);
    const renderBarcode = () => {
      if (barcodeContainer.value && typeof JsBarcode !== 'undefined') {
        try {
          barcodeContainer.value.innerHTML = '';
          JsBarcode(barcodeContainer.value, form.voucherId ? `V${form.voucherId}${_pad(form.soldQty || 0)}` : 'SAMPLE', {
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
            text: form.voucherId ? `https://shopjoy.com/voucher/${form.voucherId}` : 'https://shopjoy.com/voucher/sample',
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
    const onPreviewTabChange = (pt) => {
      previewTab.value = pt;
    };

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

    /* SNS 전송 */
    const snsModal = ref({ show: false, channel: 'kakao' });
    const snsMsg = ref('');
    const openSnsModal = (ch) => {
      snsMsg.value = `${form.voucherNm}\n액면가: ${(form.voucherAmt||0).toLocaleString()}원\n판매가: ${(form.salePrice||0).toLocaleString()}원`;
      snsModal.value = { show: true, channel: ch };
    };
    const sendSns = async () => {
      const ok = await props.showConfirm('SNS전송', `${form.voucherNm}을 ${snsModal.value.channel}로 전송하시겠습니까?`);
      if (!ok) return;
      snsModal.value.show = false;
      try {
        const res = await window.adminApi.post(`vouchers/${form.voucherId}/send-sns`, { channel: snsModal.value.channel, message: snsMsg.value });
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('SNS전송되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
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
      if (!props.adminData.voucherList) props.adminData.voucherList = [];
      if (isNew.value) {
        props.adminData.voucherList.push({
          ...form,
          voucherId: Date.now(),
          issuedList: [],
          usedList: [],
        });
      } else {
        const idx = props.adminData.voucherList.findIndex(x => x.voucherId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.voucherList[idx], { ...form });
      }
      try {
        const res = await (isNew.value ? window.adminApi.post(`vouchers/${form.voucherId}`, { ...form }) : window.adminApi.put(`vouchers/${form.voucherId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(isNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('pmVoucherMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    return { isNew, form, errors, save, DEFAULT_START, DEFAULT_END, tab, viewMode2, showTab, onTabChange, issuedList, usedList, previewTab, onPreviewTabChange, barcodeContainer, qrcodeContainer, snsModal, snsMsg, openSnsModal, sendSns, showVendorModal, selectedVendorNm, selectVendor };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '상품권 등록' : '상품권 수정' }}<span v-if="!isNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.voucherId }}</span></div>

  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;justify-content:flex-end;">
    <div class="tab-view-modes">
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='tab'}" @click="viewMode2='tab'" title="탭">📑</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='1col'}" @click="viewMode2='1col'" title="1열">1▭</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='2col'}" @click="viewMode2='2col'" title="2열">2▭</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='3col'}" @click="viewMode2='3col'" title="3열">3▭</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='4col'}" @click="viewMode2='4col'" title="4열">4▭</button>
    </div>
  </div>

  <!-- 탭 네비게이션 -->
  <div class="tab-nav">
    <button v-for="t in ['info','detail','issueHist','useHist','preview']" :key="t"
      :class="['tab-btn', {active:tab===t}]"
      @click="onTabChange(t)">
      {{ {info:'기본정보',detail:'상세정보',issueHist:'발급내역',useHist:'사용내역',preview:'미리보기'}[t] }}
    </button>
  </div>

  <!-- 기본정보 탭 -->
  <div v-if="showTab('info')" :class="['card', 'dtl-tab-grid', {'cols-1':viewMode2==='1col','cols-2':viewMode2==='2col'}]" style="margin-top:8px;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">기본정보</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">상품권명 *</label>
        <input v-model="form.voucherNm" class="form-control" placeholder="예: ShopJoy 10,000원 상품권" />
        <span v-if="errors.voucherNm" class="field-error">{{ errors.voucherNm }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">액면가 (원) *</label>
        <input v-model.number="form.voucherAmt" type="number" class="form-control" placeholder="0" />
        <span v-if="errors.voucherAmt" class="field-error">{{ errors.voucherAmt }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">판매가 (원) *</label>
        <input v-model.number="form.salePrice" type="number" class="form-control" placeholder="0" />
        <span v-if="errors.salePrice" class="field-error">{{ errors.salePrice }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">발행매수 (개) *</label>
        <input v-model.number="form.issueQty" type="number" class="form-control" placeholder="0" />
        <span v-if="errors.issueQty" class="field-error">{{ errors.issueQty }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">판매매수 (개)</label>
        <input v-model.number="form.soldQty" type="number" class="form-control" placeholder="0" />
      </div>
      <div class="form-group">
        <label class="form-label">상태</label>
        <select v-model="form.voucherStatus" class="form-control">
          <option>활성</option>
          <option>비활성</option>
          <option>종료</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">판매 시작일</label>
        <input v-model="form.startDate" type="date" class="form-control" />
      </div>
      <div class="form-group">
        <label class="form-label">판매 종료일</label>
        <input v-model="form.endDate" type="date" class="form-control" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">비고</label>
        <textarea v-model="form.remark" class="form-control" placeholder="상품권 설명 또는 특이사항 입력" style="height:80px;"></textarea>
      </div>
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
        <input v-model="form.chargeStaff" class="form-control" placeholder="담당자명 입력" />
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
    <div class="form-actions">
      <button @click="save" class="btn btn-primary">{{ isNew ? '등록' : '저장' }}</button>
      <button @click="navigate('pmVoucherMng')" class="btn btn-secondary">취소</button>
    </div>
  </div>

  <!-- 미리보기 탭 -->
  <div v-if="showTab('preview')" :class="['card', 'dtl-tab-grid', {'cols-1':viewMode2==='1col','cols-2':viewMode2==='2col'}]" style="margin-top:8px;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">미리보기</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:20px;">
      <!-- 좌측 컬럼 -->
      <div style="display:flex;flex-direction:column;gap:16px;">
        <!-- 바코드 -->
        <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;position:relative;background:linear-gradient(to right, #fff 0%, rgba(232,88,122,0.02) 100%);">
          <div style="position:absolute;top:-20px;right:-20px;font-size:60px;opacity:0.04;transform:rotate(-15deg);pointer-events:none;">💳</div>
          <div style="font-size:12px;font-weight:600;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;width:100%;text-align:center;position:relative;z-index:1;">📊 바코드</div>
          <div style="text-align:center;font-size:10px;color:#666;line-height:1.5;width:100%;position:relative;z-index:1;">
            <div style="font-weight:600;margin-bottom:4px;color:#222;">{{ form.voucherNm }}</div>
            <div style="font-size:9px;">💳 V{{ form.voucherId || 'SAMPLE' }}</div>
            <div style="font-weight:600;color:#e8587a;margin:4px 0;">{{ (form.voucherAmt||0).toLocaleString() }}원</div>
            <div style="font-size:9px;">판매가: {{ (form.salePrice||0).toLocaleString() }}원</div>
            <div style="font-size:9px;color:#999;">📅 {{ form.startDate }} ~ {{ form.endDate }}</div>
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
            <div style="font-weight:600;margin-bottom:6px;">🎁 {{ form.voucherNm }}</div>
            <div style="color:#666;margin:3px 0;">상품권번호: V{{ form.voucherId || 'SAMPLE' }}</div>
            <div style="color:#666;margin:3px 0;">액면가: {{ (form.voucherAmt||0).toLocaleString() }}원</div>
            <div style="color:#666;margin:3px 0;">판매가: {{ (form.salePrice||0).toLocaleString() }}원</div>
            <div style="color:#666;margin:3px 0;">유효기간: {{ form.startDate }} ~ {{ form.endDate }}</div>
            <div style="color:#999;font-size:9px;margin-top:6px;">ShopJoy에서 확인하기 &gt;</div>
          </div>
        </div>
        <!-- 이메일 내용 -->
        <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;">
          <div style="font-size:12px;font-weight:600;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;width:100%;text-align:center;">📧 이메일 내용</div>
          <div style="background:linear-gradient(180deg, #f9f9f9 0%, #fafbfc 100%);padding:12px;border:1px solid #e8e8e8;border-radius:6px;text-align:left;font-size:9px;line-height:1.6;color:#333;width:100%;position:relative;overflow:hidden;">
            <div style="position:absolute;top:-10px;right:-10px;font-size:50px;opacity:0.03;transform:rotate(20deg);">📧</div>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:40px;font-weight:900;color:#e8587a;opacity:0.05;pointer-events:none;white-space:nowrap;letter-spacing:3px;">ShopJoy</div>
            <div style="background:linear-gradient(135deg, #e8587a 0%, #ff7a9a 100%);color:#fff;padding:8px;border-radius:4px;margin:-12px -12px 8px -12px;text-align:center;position:relative;z-index:1;">
              <div style="font-weight:600;font-size:10px;">🛍️ ShopJoy 상품권 알림</div>
            </div>
            <div style="position:relative;z-index:1;">
              <div style="font-weight:600;margin-bottom:8px;">제목: {{ form.voucherNm }}</div>
              <div style="color:#666;margin:4px 0;">보낸 사람: ShopJoy (noreply@shopjoy.com)</div>
              <div style="color:#666;margin:6px 0;">안녕하세요, 송지선 회원님!</div>
              <div style="color:#666;margin:6px 0;">ShopJoy에서 특별한 상품권을 준비했습니다.</div>
              <div style="background:#fff;padding:8px;border:2px solid #e8587a;border-radius:4px;margin:8px 0;">
                <div style="font-weight:600;color:#e8587a;margin-bottom:4px;">🎁 {{ form.voucherNm }}</div>
                <div style="color:#666;font-size:8px;margin:3px 0;">상품권번호: V{{ form.voucherId || 'SAMPLE' }}</div>
                <div style="color:#666;font-size:8px;margin:3px 0;">액면가: {{ (form.voucherAmt||0).toLocaleString() }}원</div>
                <div style="color:#666;font-size:8px;margin:3px 0;">판매가: {{ (form.salePrice||0).toLocaleString() }}원</div>
                <div style="color:#666;font-size:8px;margin:3px 0;">유효기간: {{ form.startDate }} ~ {{ form.endDate }}</div>
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
            <div style="font-weight:600;margin-bottom:4px;color:#222;">{{ form.voucherNm }}</div>
            <div style="font-size:9px;">💳 V{{ form.voucherId || 'SAMPLE' }}</div>
            <div style="font-weight:600;color:#e8587a;margin:4px 0;">{{ (form.voucherAmt||0).toLocaleString() }}원</div>
            <div style="font-size:9px;">판매가: {{ (form.salePrice||0).toLocaleString() }}원</div>
            <div style="font-size:9px;color:#999;">📦 {{ (form.issueQty||0).toLocaleString() }}개</div>
          </div>
          <div ref="qrcodeContainer" style="display:flex;align-items:center;justify-content:center;background:#fff;padding:8px;border:2px solid #e8587a;border-radius:4px;width:100%;position:relative;z-index:1;">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:40px;font-weight:900;color:#e8587a;opacity:0.05;pointer-events:none;white-space:nowrap;letter-spacing:3px;">ShopJoy</div>
          </div>
        </div>
        <!-- 종이형태 -->
        <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;">
          <div style="font-size:12px;font-weight:600;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;width:100%;text-align:center;">🎟 종이형태</div>
          <div style="width:100%;aspect-ratio:2/1.2;background:linear-gradient(135deg, #fff8f9 0%, #fff0f4 100%);border:2px solid #e8587a;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 2px 8px rgba(232,88,122,0.1);position:relative;overflow:hidden;">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:35px;font-weight:900;color:#e8587a;opacity:0.06;pointer-events:none;white-space:nowrap;letter-spacing:3px;">ShopJoy</div>
            <div style="position:absolute;top:4px;right:4px;font-size:7px;color:#e8587a;opacity:0.3;font-weight:700;letter-spacing:1px;">VOUCHER</div>
            <div>
              <div style="font-size:8px;color:#999;">💳 ShopJoy</div>
              <div style="font-size:11px;font-weight:700;color:#e8587a;margin:2px 0;">{{ form.voucherNm }}</div>
            </div>
            <div style="text-align:center;background:rgba(255,255,255,0.5);padding:4px;border-radius:4px;">
              <div style="font-size:13px;font-weight:600;color:#222;">{{ (form.voucherAmt||0).toLocaleString() }}원</div>
              <div style="font-size:8px;color:#666;">{{ form.startDate }} ~ {{ form.endDate }}</div>
              <div style="font-size:7px;color:#999;margin-top:2px;">번호: V{{ form.voucherId || 'SAMPLE' }}</div>
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

  <!-- 발급내역 탭 -->
  <div v-if="showTab('issueHist')" :class="['card', 'dtl-tab-grid', {'cols-1':viewMode2==='1col','cols-2':viewMode2==='2col'}]" style="margin-top:8px;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">발급내역</div>
    <table class="admin-table" style="margin:0;">
      <thead><tr><th>발급번호</th><th>회원명</th><th>발급일</th><th>발급가격</th><th>만료일</th><th>상태</th></tr></thead>
      <tbody>
        <tr v-if="issuedList.length===0"><td colspan="6" style="text-align:center;padding:20px;color:#999;">발급내역이 없습니다.</td></tr>
        <tr v-for="item in issuedList" :key="item.issueNo">
          <td>{{ item.issueNo }}</td>
          <td>{{ item.memberNm }}</td>
          <td>{{ item.issueDate }}</td>
          <td style="text-align:right;">{{ (item.issuePrice||0).toLocaleString() }}원</td>
          <td>{{ item.expiryDate }}</td>
          <td><span class="badge" :class="{'badge-green':item.status==='정상','badge-blue':item.status==='사용완료','badge-gray':item.status==='만료됨'}">{{ item.status }}</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 사용내역 탭 -->
  <div v-if="showTab('useHist')" :class="['card', 'dtl-tab-grid', {'cols-1':viewMode2==='1col','cols-2':viewMode2==='2col'}]" style="margin-top:8px;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">사용내역</div>
    <table class="admin-table" style="margin:0;">
      <thead><tr><th>사용번호</th><th>발급번호</th><th>회원명</th><th>주문ID</th><th>사용금액</th><th>사용일시</th></tr></thead>
      <tbody>
        <tr v-if="usedList.length===0"><td colspan="6" style="text-align:center;padding:20px;color:#999;">사용내역이 없습니다.</td></tr>
        <tr v-for="item in usedList" :key="item.usageNo">
          <td>{{ item.usageNo }}</td>
          <td>{{ item.issueNo }}</td>
          <td>{{ item.memberNm }}</td>
          <td>{{ item.orderId }}</td>
          <td style="text-align:right;">{{ (item.useAmount||0).toLocaleString() }}원</td>
          <td>{{ item.useDate }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 상세정보 탭 -->
  <div v-if="showTab('detail')" :class="['card', 'dtl-tab-grid', {'cols-1':viewMode2==='1col','cols-2':viewMode2==='2col'}]" style="margin-top:8px;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📋 상세정보</div>
    <div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #e8e8e8;">
      <h3 style="font-size:13px;font-weight:700;color:#222;">💬 SNS전송</h3>
    </div>
    <div style="padding:20px;">
      <div style="font-size:12px;color:#666;margin-bottom:16px;">상품권 정보를 SNS 채널로 공유합니다.</div>
      <div style="display:flex;gap:12px;margin-bottom:20px;">
        <button @click="openSnsModal('kakao')" class="btn btn-primary" style="background:#FFE812;color:#381818;border:none;">💬 카카오톡</button>
        <button @click="openSnsModal('email')" class="btn btn-secondary">📧 이메일</button>
      </div>
    </div>
  </div>

  <!-- SNS 전송 모달 -->
  <div v-if="snsModal.show" class="modal-overlay" @click.self="snsModal.show=false">
    <div class="modal-box" style="max-width:500px;">
      <div class="modal-header">
        <span class="modal-title">{{ snsModal.channel==='kakao' ? '💬 카카오톡' : '📧 이메일' }} 전송</span>
        <span class="modal-close" @click="snsModal.show=false">✕</span>
      </div>
      <div style="padding:16px;">
        <div style="margin-bottom:12px;">
          <label class="form-label">전송 메시지</label>
          <textarea v-model="snsMsg" class="form-control" style="height:120px;"></textarea>
        </div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding:12px;border-top:1px solid #eee;">
        <button @click="snsModal.show=false" class="btn btn-secondary btn-sm">취소</button>
        <button @click="sendSns" class="btn btn-primary btn-sm">전송</button>
      </div>
    </div>
  </div>
</div>
`
};
