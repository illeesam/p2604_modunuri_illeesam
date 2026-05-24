/* ShopJoy Admin - 상품권관리 상세/등록 (탭: 기본정보/미리보기/상세정보/발급내역/사용내역) */
window._pmVoucherDtlState = window._pmVoucherDtlState || { tab: 'info', tabMode: 'tab' };
window.PmVoucherDtl = {
  name: 'PmVoucherDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    tabMode:      { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const vendors = reactive([]);
    const uiState = reactive({ loading: false, showVendorModal: false, error: null, isPageCodeLoad: false, tab: window._pmVoucherDtlState.tab || 'info', tabMode2: window._pmVoucherDtlState.tabMode || 'tab', previewTab: 'barcode', barcodeContainer: null, qrcodeContainer: null, snsMsg: ''});
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({ promo_statuses: [] });

    // 단건 조회
    /* loadVendors — 로드 */
    const loadVendors = async () => {
      try {
        const _vr = await boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 10000 }, '관리', '조회');
        vendors.splice(0, vendors.length, ...(_vr.data?.data?.pageList || _vr.data?.data?.list || []));
      } catch (e) { console.warn('[PmVoucherDtl.js] vendor load failed', e); }
    };

    /* handleSearchDetail — 처리 */
    const handleSearchDetail = async () => {
      await loadVendors();
      if (cfIsNew.value) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.pmVoucher.getById(props.dtlId, '바우처관리', '상세조회');
        const v = res.data?.data || res.data;
        if (v) Object.assign(form, { ...v });
        if (!form.startDate) form.startDate = DEFAULT_START;
        if (!form.endDate) form.endDate = DEFAULT_END;
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    const cfIsNew = computed(() => !props.dtlId);

watch(() => uiState.tab, v => { window._pmVoucherDtlState.tab = v; });

        watch(() => uiState.tabMode2, v => { window._pmVoucherDtlState.tabMode = v; });

    /* showTab — 표시 */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;

    /* 바우처(상품권) fnLoadCodes */
    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.promo_statuses = codeStore.sgGetGrpCodes('PROMO_STATUS');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    const form = reactive({
      voucherId: null, voucherNm: '', voucherAmt: 0, salePrice: 0,
      issueQty: 0, soldQty: 0, voucherStatus: '활성', startDate: '', endDate: '',
      remark: '',
      vendorId: '', chargeStaff: '',
    });
    const errors = reactive({});

    const _today = new Date();

    /* _pad — 패딩 */
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END = `${_today.getFullYear()+1}-12-31`;

    const schema = yup.object({
      voucherNm: yup.string().required('상품권명을 입력해주세요.'),
      voucherAmt: yup.number().min(1000, '액면가는 1,000원 이상이어야 합니다.').required('액면가를 입력해주세요.'),
      salePrice: yup.number().min(0).required('판매가를 입력해주세요.'),
      issueQty: yup.number().min(1, '발행매수는 1개 이상이어야 합니다.').required('발행매수를 입력해주세요.'),
    });

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      if (cfIsNew.value) {
      if (!form.startDate) form.startDate = DEFAULT_START;
      if (!form.endDate) form.endDate = DEFAULT_END;
      }
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) return;
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleSearchDetail();
    });

    /* 발급내역 */
    const cfIssuedList = computed(() => form.cfIssuedList || []);

    /* 사용내역 */
    const cfUsedList = computed(() => form.cfUsedList || []);

    /* 미리보기 형태 */
                const renderBarcode = () => {
      if (uiState.barcodeContainer && typeof JsBarcode !== 'undefined') {
        try {
          barcodeContainer.value.innerHTML = '';
          JsBarcode(uiState.barcodeContainer, form.voucherId ? `V${form.voucherId}${_pad(form.soldQty || 0)}` : 'SAMPLE', {
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
            text: form.voucherId ? `https://shopjoy.com/voucher/${form.voucherId}` : 'https://shopjoy.com/voucher/sample',
            width: 150,
            height: 150,
            colorDark: '#222222',
            colorLight: '#ffffff',
          });
        } catch(e) {}
      }
    };

    /* 바우처(상품권) onTabChange */
    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

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

    /* onPreviewTabChange — 이벤트 */
    const onPreviewTabChange = (pt) => {
      uiState.previewTab = pt;
    };

    const cfSelectedVendorNm = computed(() => {
      if (!form.vendorId) return '소속업체 선택';
      const v = vendors.find(x => x.vendorId === form.vendorId);
      return v ? v.vendorNm : '소속업체 선택';
    });

    /* selectVendor — 선택 */
    const selectVendor = (vendorId, vendorNm) => {
      form.vendorId = vendorId;
      uiState.showVendorModal = false;
    };

    /* SNS 전송 */
    const snsModal = reactive({ show: false, channel: 'kakao' });
        const openSnsModal = (ch) => {
      uiState.snsMsg = `${form.voucherNm}\n액면가: ${(form.voucherAmt||0).toLocaleString()}원\n판매가: ${(form.salePrice||0).toLocaleString()}원`;
      snsModal.show = true;
      snsModal.channel = ch;
    };

    /* sendSns — 전송 SNS */
    const sendSns = async () => {
      const ok = await showConfirm('SNS전송', `${form.voucherNm}을 ${snsModal.channel}로 전송하시겠습니까?`);
      if (!ok) return;
      snsModal.show = false;
      try {
        const res = await boApiSvc.pmVoucher.sendSns(form.voucherId, { channel: snsModal.channel, message: uiState.snsMsg }, '바우처관리', '전송');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('SNS전송되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    const cfCurId       = computed(() => props.dtlId || form.voucherId || null);
    const cfHasId       = computed(() => !!cfCurId.value);
    /* 신규: info 탭만 활성. 수정: info/detail 만 저장 의미 (issueHist/useHist/preview 는 조회 전용 → 비활성) */
    const cfSaveDisabled = computed(() => {
      const t = uiState.tab;
      if (t === 'info') return false;
      if (!cfHasId.value) return true;
      if (t === 'detail') return false;
      return true;
    });

    /* _afterApiOk — 후 API 성공 */
    const _afterApiOk  = (res, msg) => {
      if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
      if (showToast) showToast(msg, 'success');
    };

    /* _afterApiErr — 후 API 오류 */
    const _afterApiErr = (err) => {
      console.error('[handleSave]', err);
      const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
      if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
      if (showToast) showToast(errMsg, 'error', 0);
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      const tabId = uiState.tab;

      if (cfSaveDisabled.value) {
        if (!cfHasId.value && tabId !== 'info') showToast('먼저 기본정보 탭에서 등록해주세요.', 'error');
        return;
      }

      if (tabId !== 'info' && tabId !== 'detail') return;

      Object.keys(errors).forEach(k => delete errors[k]);
      try { await schema.validate(form, { abortEarly: false }); }
      catch (err) { err.inner.forEach(e => { errors[e.path] = e.message; }); showToast('입력 내용을 확인해주세요.', 'error'); return; }

      const isCreate = !cfHasId.value;
      const ok = await showConfirm(isCreate ? '등록' : '저장', isCreate ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      try {
        const payload = { ...form };
        const res = isCreate
          ? await boApiSvc.pmVoucher.create(payload, '바우처관리', '등록')
          : await boApiSvc.pmVoucher.update(cfCurId.value, payload, '바우처관리', tabId === 'info' ? '기본정보저장' : '상세정보저장');
        if (isCreate) {
          const newId = res.data?.data?.voucherId || res.data?.voucherId || null;
          if (newId) form.voucherId = newId;
        }
        _afterApiOk(res, isCreate ? '등록되었습니다. 다른 탭을 저장할 수 있습니다.' : '저장되었습니다.');
      } catch (err) { _afterApiErr(err); }
    };

    const barcodeContainer = Vue.toRef(uiState, 'barcodeContainer');
    const previewTab = Vue.toRef(uiState, 'previewTab');
    const qrcodeContainer = Vue.toRef(uiState, 'qrcodeContainer');
    const showVendorModal = Vue.toRef(uiState, 'showVendorModal');
    const snsMsg = Vue.toRef(uiState, 'snsMsg');

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    /* BoGrid(bare) 컬럼 정의 — 발급내역 / 사용내역 */
    const issueGridColumns = [
      { key: 'issueNo',     label: '발급번호' },
      { key: 'memberNm',    label: '회원명' },
      { key: 'issueDate',   label: '발급일' },
      { key: 'issuePrice',  label: '발급가격', style: 'text-align:right;', fmt: v => (v||0).toLocaleString() + '원' },
      { key: 'expiryDate',  label: '만료일' },
      { key: 'status',      label: '상태',
        badge: row => row.status === '정상' ? 'badge-green' : row.status === '사용완료' ? 'badge-blue' : row.status === '만료됨' ? 'badge-gray' : 'badge-gray' },
    ];
    const usageGridColumns = [
      { key: 'usageNo',    label: '사용번호' },
      { key: 'issueNo',    label: '발급번호' },
      { key: 'memberNm',   label: '회원명' },
      { key: 'orderId',    label: '주문ID' },
      { key: 'useAmount',  label: '사용금액', style: 'text-align:right;', fmt: v => (v||0).toLocaleString() + '원' },
      { key: 'useDate',    label: '사용일시' },
    ];

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - info 탭 ======================
    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================

    // --- [컬럼 정의] ---
    const infoFormColumns = [
      { key: 'voucherNm',     label: '상품권명', type: 'text', required: true,
        placeholder: '예: ShopJoy 10,000원 상품권' },
      { key: 'voucherAmt',    label: '액면가 (원)', type: 'number', required: true, placeholder: '0' },
      { key: 'salePrice',     label: '판매가 (원)', type: 'number', required: true, placeholder: '0' },
      { key: 'issueQty',      label: '발행매수 (개)', type: 'number', required: true, placeholder: '0' },
      { key: 'soldQty',       label: '판매매수 (개)', type: 'number', placeholder: '0' },
      { key: 'voucherStatus', label: '상태', type: 'select', options: () => codes.promo_statuses },
      { key: 'startDate',     label: '판매 시작일', type: 'date' },
      { key: 'endDate',       label: '판매 종료일', type: 'date' },
      { type: 'rowBreak' },
      { key: 'remark',        label: '비고', type: 'textarea', rows: 4,
        placeholder: '상품권 설명 또는 특이사항 입력', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'vendorId',      label: '판매업체', type: 'slot', name: 'vendor' },
      { key: 'chargeStaff',   label: '판매담당자', type: 'text', placeholder: '담당자명 입력' },
    ];

    // ===== return (템플릿 노출) ===============================================


    return { vendors, showVendorModal, uiState, codes, cfIsNew, cfHasId, cfSaveDisabled, form, errors, handleSave, DEFAULT_START, DEFAULT_END, tab, cfDtlMode, tabMode2, showTab, onTabChange, cfIssuedList, cfUsedList, previewTab, onPreviewTabChange, barcodeContainer, qrcodeContainer, snsModal, snsMsg, openSnsModal, sendSns, cfSelectedVendorNm, selectVendor, issueGridColumns, usageGridColumns, infoFormColumns };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    {{ cfIsNew ? '상품권 등록' : '상품권 수정' }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.voucherId }}</span>
  </div>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;justify-content:flex-end;">
    <div class="tab-modes">
      <button class="tab-mode-btn" :class="{active:tabMode2==='tab'}" @click="tabMode2='tab'" title="탭">📑</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='1col'}" @click="tabMode2='1col'" title="1열">1▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='2col'}" @click="tabMode2='2col'" title="2열">2▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='3col'}" @click="tabMode2='3col'" title="3열">3▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='4col'}" @click="tabMode2='4col'" title="4열">4▭</button>
    </div>
  </div>
  <!-- ===== □. 본문 영역 =================================================== -->
  <!-- ===== ■. 탭 네비게이션 ================================================= -->
  <div class="tab-nav">
    <button v-for="t in ['info','detail','issueHist','useHist','preview']" :key="Math.random()"
      :class="['tab-btn', {active:tab===t}]"
      @click="onTabChange(t)">
      {{ {info:'기본정보',detail:'상세정보',issueHist:'발급내역',useHist:'사용내역',preview:'미리보기'}[t] }}
    </button>
  </div>
  <!-- ===== □. 탭 네비게이션 ================================================= -->
  <!-- ===== ■. 기본정보 탭 (BoFormArea 자동 렌더) =============================== -->
  <!-- ===== ■. 조건부 영역 ================================================== -->
  <div v-if="showTab('info')" :class="['card', 'dtl-tab-grid', {'cols-1':tabMode2==='1col','cols-2':tabMode2==='2col'}]" style="margin-top:8px;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">기본정보</div>
    <!-- ===== ■.■. 폼 영역 ================================================== -->
    <bo-form-area :columns="infoFormColumns" :form="form" :errors="errors"
      :readonly="cfDtlMode" :cols="2" :show-actions="false">
      <!-- ===== ■.■.■. 판매업체 picker ========================================= -->
      <template #vendor>
        <div style="display:flex;gap:8px;align-items:center;">
          <div class="form-control" style="background:#f9f9f9;cursor:pointer;padding:0;display:flex;align-items:center;" @click="showVendorModal=true">
            <span style="padding:8px 12px;flex:1;">{{ cfSelectedVendorNm }}</span>
            <span style="padding:8px 12px;color:#999;font-size:12px;">▼</span>
          </div>
          <button v-if="form.vendorId" class="btn btn-sm" style="padding:0 12px;color:#666;" @click="form.vendorId='';form.chargeStaff=''">
            초기화
          </button>
        </div>
      </template>
    </bo-form-area>
    <!-- ===== □.□. 폼 영역 ================================================== -->
    <!-- ===== ■.■. 판매업체 선택 모달 ============================================ -->
    <simple-vendor-pick-modal :show="showVendorModal" :vendors="vendors" :selected-id="form.vendorId"
      @select="v => selectVendor(v.vendorId, v.vendorNm)" @close="showVendorModal=false" />
    <div class="form-actions" v-if="!cfDtlMode">
      <button @click="handleSave" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요. (발급/사용/미리보기 탭은 조회 전용)' : ''" class="btn btn-primary">
        {{ cfIsNew ? '등록' : '저장' }}
      </button>
      <button @click="navigate('pmVoucherMng')" class="btn btn-secondary">취소</button>
    </div>
  </div>
    <!-- ===== □.□. 판매업체 선택 모달 ============================================ -->
  <!-- ===== □. 조건부 영역 ================================================== -->
  <!-- ===== ■. 미리보기 탭 ================================================== -->
  <div v-if="showTab('preview')" :class="['card', 'dtl-tab-grid', {'cols-1':tabMode2==='1col','cols-2':tabMode2==='2col'}]" style="margin-top:8px;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">미리보기</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:20px;">
      <!-- ===== ■.■.■. 좌측 컬럼 =============================================== -->
      <div style="display:flex;flex-direction:column;gap:16px;">
        <!-- ===== ■.■.■.■. 바코드 =============================================== -->
        <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;position:relative;background:linear-gradient(to right, #fff 0%, rgba(232,88,122,0.02) 100%);">
          <div style="position:absolute;top:-20px;right:-20px;font-size:60px;opacity:0.04;transform:rotate(-15deg);pointer-events:none;">
            💳
          </div>
          <div style="font-size:12px;font-weight:600;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;width:100%;text-align:center;position:relative;z-index:1;">
            📊 바코드
          </div>
          <div style="text-align:center;font-size:10px;color:#666;line-height:1.5;width:100%;position:relative;z-index:1;">
            <div style="font-weight:600;margin-bottom:4px;color:#222;">{{ form.voucherNm }}</div>
            <div style="font-size:9px;">💳 V{{ form.voucherId || 'SAMPLE' }}</div>
            <div style="font-weight:600;color:#e8587a;margin:4px 0;">{{ (form.voucherAmt||0).toLocaleString() }}원</div>
            <div style="font-size:9px;">판매가: {{ (form.salePrice||0).toLocaleString() }}원</div>
            <div style="font-size:9px;color:#999;">📅 {{ form.startDate }} ~ {{ form.endDate }}</div>
          </div>
          <div ref="barcodeContainer" style="display:flex;align-items:center;justify-content:center;background:#fff;padding:8px;border:1px solid #ddd;border-radius:4px;width:100%;position:relative;z-index:1;">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:45px;font-weight:900;color:#e8587a;opacity:0.05;pointer-events:none;white-space:nowrap;letter-spacing:3px;">
              ShopJoy
            </div>
          </div>
        </div>
        <!-- ===== ■.■.■.■. SNS전송형태 =========================================== -->
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
            <div style="font-weight:600;margin-bottom:6px;">🎁 {{ form.voucherNm }}</div>
            <div style="color:#666;margin:3px 0;">상품권번호: V{{ form.voucherId || 'SAMPLE' }}</div>
            <div style="color:#666;margin:3px 0;">액면가: {{ (form.voucherAmt||0).toLocaleString() }}원</div>
            <div style="color:#666;margin:3px 0;">판매가: {{ (form.salePrice||0).toLocaleString() }}원</div>
            <div style="color:#666;margin:3px 0;">유효기간: {{ form.startDate }} ~ {{ form.endDate }}</div>
            <div style="color:#999;font-size:9px;margin-top:6px;">ShopJoy에서 확인하기 &gt;</div>
          </div>
        </div>
        <!-- ===== ■.■.■.■. 이메일 내용 ============================================ -->
        <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;">
          <div style="font-size:12px;font-weight:600;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;width:100%;text-align:center;">
            📧 이메일 내용
          </div>
          <div style="background:linear-gradient(180deg, #f9f9f9 0%, #fafbfc 100%);padding:12px;border:1px solid #e8e8e8;border-radius:6px;text-align:left;font-size:9px;line-height:1.6;color:#333;width:100%;position:relative;overflow:hidden;">
            <div style="position:absolute;top:-10px;right:-10px;font-size:50px;opacity:0.03;transform:rotate(20deg);">📧</div>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:40px;font-weight:900;color:#e8587a;opacity:0.05;pointer-events:none;white-space:nowrap;letter-spacing:3px;">
              ShopJoy
            </div>
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
              <div style="color:#999;font-size:8px;margin-top:8px;text-align:center;padding-top:8px;border-top:1px solid #e8e8e8;">
                © 2026 ShopJoy | 문의: 010-1234-5678 | demo@mail.com
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- ===== ■.■.■. 우측 컬럼 =============================================== -->
      <div style="display:flex;flex-direction:column;gap:16px;">
        <!-- ===== ■.■.■.■. QR코드 ============================================== -->
        <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;position:relative;background:linear-gradient(135deg, #fff 0%, rgba(232,88,122,0.01) 100%);">
          <div style="position:absolute;bottom:-15px;left:-15px;font-size:50px;opacity:0.05;transform:rotate(-20deg);">📱</div>
          <div style="font-size:12px;font-weight:600;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;width:100%;text-align:center;position:relative;z-index:1;">
            📱 QR코드
          </div>
          <div style="text-align:center;font-size:10px;color:#666;line-height:1.5;width:100%;position:relative;z-index:1;">
            <div style="font-weight:600;margin-bottom:4px;color:#222;">{{ form.voucherNm }}</div>
            <div style="font-size:9px;">💳 V{{ form.voucherId || 'SAMPLE' }}</div>
            <div style="font-weight:600;color:#e8587a;margin:4px 0;">{{ (form.voucherAmt||0).toLocaleString() }}원</div>
            <div style="font-size:9px;">판매가: {{ (form.salePrice||0).toLocaleString() }}원</div>
            <div style="font-size:9px;color:#999;">📦 {{ (form.issueQty||0).toLocaleString() }}개</div>
          </div>
          <div ref="qrcodeContainer" style="display:flex;align-items:center;justify-content:center;background:#fff;padding:8px;border:2px solid #e8587a;border-radius:4px;width:100%;position:relative;z-index:1;">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:40px;font-weight:900;color:#e8587a;opacity:0.05;pointer-events:none;white-space:nowrap;letter-spacing:3px;">
              ShopJoy
            </div>
          </div>
        </div>
        <!-- ===== ■.■.■.■. 종이형태 ============================================== -->
        <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;">
          <div style="font-size:12px;font-weight:600;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;width:100%;text-align:center;">
            🎟 종이형태
          </div>
          <div style="width:100%;aspect-ratio:2/1.2;background:linear-gradient(135deg, #fff8f9 0%, #fff0f4 100%);border:2px solid #e8587a;border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 2px 8px rgba(232,88,122,0.1);position:relative;overflow:hidden;">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:35px;font-weight:900;color:#e8587a;opacity:0.06;pointer-events:none;white-space:nowrap;letter-spacing:3px;">
              ShopJoy
            </div>
            <div style="position:absolute;top:4px;right:4px;font-size:7px;color:#e8587a;opacity:0.3;font-weight:700;letter-spacing:1px;">
              VOUCHER
            </div>
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
  <!-- ===== □. 미리보기 탭 ================================================== -->
  <!-- ===== ■. 발급내역 탭 ================================================== -->
  <div v-if="showTab('issueHist')" :class="['card', 'dtl-tab-grid', {'cols-1':tabMode2==='1col','cols-2':tabMode2==='2col'}]" style="margin-top:8px;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">발급내역</div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid bare :columns="issueGridColumns" :rows="cfIssuedList" row-key="issueNo"
      empty-text="발급내역이 없습니다."></bo-grid>
  </div>
    <!-- ===== □.□. 목록 영역 ================================================= -->
  <!-- ===== □. 발급내역 탭 ================================================== -->
  <!-- ===== ■. 사용내역 탭 ================================================== -->
  <div v-if="showTab('useHist')" :class="['card', 'dtl-tab-grid', {'cols-1':tabMode2==='1col','cols-2':tabMode2==='2col'}]" style="margin-top:8px;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">사용내역</div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid bare :columns="usageGridColumns" :rows="cfUsedList" row-key="usageNo"
      empty-text="사용내역이 없습니다."></bo-grid>
  </div>
    <!-- ===== □.□. 목록 영역 ================================================= -->
  <!-- ===== □. 사용내역 탭 ================================================== -->
  <!-- ===== ■. 상세정보 탭 ================================================== -->
  <div v-if="showTab('detail')" :class="['card', 'dtl-tab-grid', {'cols-1':tabMode2==='1col','cols-2':tabMode2==='2col'}]" style="margin-top:8px;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📋 상세정보</div>
    <div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #e8e8e8;">
      <h3 style="font-size:13px;font-weight:700;color:#222;">💬 SNS전송</h3>
    </div>
    <div style="padding:20px;">
      <div style="font-size:12px;color:#666;margin-bottom:16px;">상품권 정보를 SNS 채널로 공유합니다.</div>
      <div style="display:flex;gap:12px;margin-bottom:20px;">
        <button @click="openSnsModal('kakao')" class="btn btn-primary" style="background:#FFE812;color:#381818;border:none;">
          💬 카카오톡
        </button>
        <button @click="openSnsModal('email')" class="btn btn-secondary">📧 이메일</button>
      </div>
    </div>
  </div>
  <!-- ===== □. 상세정보 탭 ================================================== -->
  <!-- ===== ■. SNS 전송 모달 =============================================== -->
  <bo-modal :show="snsModal.show"
    :title="(snsModal.channel==='kakao' ? '💬 카카오톡' : '📧 이메일') + ' 전송'"
    width="500px" @close="snsModal.show=false">
    <div style="margin-bottom:12px;">
      <label class="form-label">전송 메시지</label>
      <textarea v-model="snsMsg" class="form-control" style="height:120px;"></textarea>
    </div>
    <template #footer>
      <button @click="snsModal.show=false" class="btn btn-secondary btn-sm">취소</button>
      <button @click="sendSns" class="btn btn-primary btn-sm">전송</button>
    </template>
  </bo-modal>
</div>

  <!-- ===== □. SNS 전송 모달 =============================================== -->`
};
