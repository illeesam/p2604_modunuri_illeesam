/* ShopJoy Admin - 기획전관리 상세/등록 (Toast UI HTML Editor + 배너이미지) */
window._ecPlanDtlState = window._ecPlanDtlState || { tab: 'info', tabMode: 'tab' };
window.PmPlanDtl = {
  name: 'PmPlanDtl',
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
    const products = reactive([]);
    const vendors = reactive([]);
    const uiState = reactive({ loading: false, showProdPopup: false, showVendorModal: false, error: null, isPageCodeLoad: false, tab: window._ecPlanDtlState.tab || 'info', tabMode2: window._ecPlanDtlState.tabMode || 'tab', activeContentTab: 1, prodSearch: ''});
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({
      plan_categories: [{value:'패션',label:'패션'},{value:'스포츠',label:'스포츠'},{value:'스타일링',label:'스타일링'},{value:'직원전용',label:'직원전용'},{value:'명품',label:'명품'}],
      plan_statuses: [{value:'활성',label:'활성'},{value:'예정',label:'예정'},{value:'비활성',label:'비활성'},{value:'종료',label:'종료'}],
    });

    // 단건 조회 + 상품목록 로드
    /* loadVendors — 로드 */
    const loadVendors = async () => {
      try {
        const _vr = await boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 10000 }, '관리', '조회');
        vendors.splice(0, vendors.length, ...(_vr.data?.data?.pageList || _vr.data?.data?.list || []));
      } catch (e) { console.warn('[PmPlanDtl.js] vendor load failed', e); }
    };

    /* handleSearchDetail — 처리 */
    const handleSearchDetail = async () => {
      await loadVendors();
      uiState.loading = true;
      try {
        const calls = [boApiSvc.pdProd.getPage({ pageNo: 1, pageSize: 10000 }, '요금제관리', '조회')];
        if (!cfIsNew.value) calls.unshift(boApiSvc.pmPlan.getById(props.dtlId, '요금제관리', '상세조회'));
        const results = await Promise.all(calls);
        if (!cfIsNew.value) {
          const p = results[0].data?.data || results[0].data;
          if (p) {
            Object.assign(form, { ...p, productIds: [...(p.productIds || [])] });
            if (!form.visibilityTargets) form.visibilityTargets = '^PUBLIC^';
          }
          products.splice(0, products.length, ...(results[1].data?.data?.list || []));
        } else {
          products.splice(0, products.length, ...(results[0].data?.data?.list || []));
        }
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    const cfIsNew = computed(() => !props.dtlId);

watch(() => uiState.tab, v => { window._ecPlanDtlState.tab = v; });

        watch(() => uiState.tabMode2, v => { window._ecPlanDtlState.tabMode = v; });

    /* showTab — 표시 */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;

    /* 프로모션 플랜 fnLoadCodes */
    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();

      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    const _today = new Date();

    /* _pad — 패딩 */
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END = `${_today.getFullYear()+1}-12-31`;

    const VISIBILITY_OPTIONS = [
      { value: 'PUBLIC',    label: '전체공개' },
      { value: 'MEMBER',    label: '회원공개' },
      { value: 'VERIFIED',  label: '인증회원' },
      { value: 'PREMIUM',   label: '우수회원↑' },
      { value: 'VIP',       label: 'VIP 전용' },
      { value: 'INVITED',   label: '초대회원' },
      { value: 'STAFF',     label: '직원' },
      { value: 'EXECUTIVE', label: '임직원' },
    ];

    const form = reactive({
      planNm: '', category: '패션', theme: '', status: '활성',
      startDate: DEFAULT_START, endDate: DEFAULT_END,
      productIds: [], visibilityTargets: '^PUBLIC^',
      desc: '', bannerImage: '', content1: '', content2: '', content3: '',
      vendorId: '', chargeStaff: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      planNm: yup.string().required('기획전명을 입력해주세요.'),
      category: yup.string().required('카테고리를 선택해주세요.'),
    });

    /* 프로모션 플랜 onTabChange */
    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* onTabChange — 탭 변경 */
    const onTabChange = (newTab) => {
      uiState.tab = newTab;
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) return;
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleSearchDetail();
    });

    /* 대상 상품 팝업 */
        const cfFilteredProds = computed(() => window.safeArrayUtils.safeFilter(products, p => {
      const searchVal = prodSearch.value.trim().toLowerCase();
      return !searchVal || p.prodNm.toLowerCase().includes(searchVal);
    }));

    /* toggleProduct — 토글 */
    const toggleProduct = (pid) => {
      const idx = form.productIds.indexOf(pid);
      if (idx === -1) form.productIds.push(pid);
      else form.productIds.splice(idx, 1);
    };

    /* isSelected — 여부 확인 */
    const isSelected = (pid) => form.productIds.includes(pid);
    const cfSelectedProducts = computed(() =>
      form.productIds.map(pid => products.find(p => p.productId === pid)).filter(Boolean)
    );

    /* removeProduct — 제거 */
    const removeProduct = (pid) => {
      const idx = form.productIds.indexOf(pid);
      if (idx !== -1) form.productIds.splice(idx, 1);
    };

    /* hasVisibility — 여부 확인 */
    const hasVisibility = (code) => {
      return (form.visibilityTargets || '').includes('^' + code + '^');
    };

    /* toggleVisibility — 토글 */
    const toggleVisibility = (code) => {
      const targets = (form.visibilityTargets || '').split('^').filter(Boolean);
      const idx = targets.indexOf(code);
      if (idx === -1) targets.push(code);
      else targets.splice(idx, 1);
      form.visibilityTargets = '^' + targets.join('^') + '^';
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

    const cfCurId       = computed(() => props.dtlId || form.planId || null);
    const cfHasId       = computed(() => !!cfCurId.value);
    /* 신규 등록은 info 탭에서만 가능. 그 외 탭(banner/content/products/preview)은 ID 없으면 비활성 */
    const cfSaveDisabled = computed(() => uiState.tab !== 'info' && !cfHasId.value);

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

      if (!cfHasId.value && tabId !== 'info') {
        showToast('먼저 기본정보 탭에서 등록해주세요.', 'error');
        return;
      }

      if (tabId === 'info') {
        Object.keys(errors).forEach(k => delete errors[k]);
        try { await schema.validate(form, { abortEarly: false }); }
        catch (err) { err.inner.forEach(e => { errors[e.path] = e.message; }); showToast('입력 내용을 확인해주세요.', 'error'); return; }

        const isCreate = !cfHasId.value;
        const ok = await showConfirm(isCreate ? '등록' : '저장', isCreate ? '등록하시겠습니까?' : '저장하시겠습니까?');
        if (!ok) return;
        try {
          const payload = { ...form };
          const res = isCreate
            ? await boApiSvc.pmPlan.create(payload, '요금제관리', '등록')
            : await boApiSvc.pmPlan.update(cfCurId.value, payload, '요금제관리', '기본정보저장');
          if (isCreate) {
            const newId = res.data?.data?.planId || res.data?.planId || null;
            if (newId) form.planId = newId;
          }
          _afterApiOk(res, isCreate ? '등록되었습니다. 다른 탭을 저장할 수 있습니다.' : '저장되었습니다.');
        } catch (err) { _afterApiErr(err); }
        return;
      }

      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;

      const TAB_LABEL = { banner: '배너이미지', content: '내용입력', products: '대상상품' };
      let payload = null;
      switch (tabId) {
        case 'banner':   payload = { bannerImage: form.bannerImage }; break;
        case 'content':  payload = { content1: form.content1, content2: form.content2, content3: form.content3 }; break;
        case 'products': payload = { productIds: form.productIds, visibilityTargets: form.visibilityTargets }; break;
        default:         payload = {}; break;
      }
      try {
        const res = await boApiSvc.pmPlan.update(cfCurId.value, payload, '요금제관리', `${TAB_LABEL[tabId] || tabId}저장`);
        _afterApiOk(res, `${TAB_LABEL[tabId] || ''} 저장되었습니다.`);
      } catch (err) { _afterApiErr(err); }
    };

    const activeContentTab = Vue.toRef(uiState, 'activeContentTab');
    const prodSearch = Vue.toRef(uiState, 'prodSearch');
    const showProdPopup = Vue.toRef(uiState, 'showProdPopup');
    const showVendorModal = Vue.toRef(uiState, 'showVendorModal');

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - info 탭 (기획전 단순 필드만) ===
    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================

    // --- [컬럼 정의] ---
    const infoFormColumns = [
      { key: 'planNm',    label: '기획전명', type: 'text', required: true,
        placeholder: '기획전명을 입력하세요', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'category',  label: '카테고리', type: 'select', required: true,
        options: () => codes.plan_categories },
      { key: 'theme',     label: '테마', type: 'text', placeholder: '예: 봄맞이, 세일' },
      { type: 'rowBreak' },
      { key: 'status',    label: '상태', type: 'select', options: () => codes.plan_statuses },
      { key: '_visibility', label: '공개대상', type: 'slot', name: 'visibility' },
      { type: 'rowBreak' },
      { key: 'startDate', label: '시작일', type: 'date' },
      { key: 'endDate',   label: '종료일', type: 'date' },
      { type: 'rowBreak' },
      { key: 'desc',      label: '간단설명', type: 'textarea', rows: 3, placeholder: '기획전 설명', colSpan: 2 },
    ];

    // 판매업체/판매담당자
    const vendorFormColumns = [
      { key: 'vendorId',    label: '판매업체', type: 'slot', name: 'vendor' },
      { key: 'chargeStaff', label: '판매담당자', type: 'text', placeholder: '담당자명 입력' },
    ];

    // ===== return (템플릿 노출) ===============================================


    return { vendors, products, showVendorModal, uiState, codes, cfIsNew, cfHasId, cfSaveDisabled, tab, onTabChange, form, errors, activeContentTab, prodSearch,
      cfFilteredProds, toggleProduct, isSelected, cfSelectedProducts, removeProduct, handleSave,
      VISIBILITY_OPTIONS, cfDtlMode, tabMode2, showTab, hasVisibility, toggleVisibility,
      cfSelectedVendorNm, selectVendor, showProdPopup, showVendorModal, infoFormColumns, vendorFormColumns,
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    {{ cfIsNew ? '기획전 등록' : '기획전 상세' }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.planId }}</span>
  </div>
  <!-- ===== ■. 탭 영역 ==================================================== -->
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:tab==='banner'}" :disabled="tabMode2!=='tab'" @click="onTabChange('banner')">🎨 배너이미지</button>
      <button class="tab-btn" :class="{active:tab==='info'}" :disabled="tabMode2!=='tab'" @click="onTabChange('info')">📋 기본정보</button>
      <button class="tab-btn" :class="{active:tab==='content'}" :disabled="tabMode2!=='tab'" @click="onTabChange('content')">
        📝 내용입력
      </button>
      <button class="tab-btn" :class="{active:tab==='products'}" :disabled="tabMode2!=='tab'" @click="onTabChange('products')">
        🛍 대상 상품
        <span class="tab-count">{{ form.productIds.length }}</span>
      </button>
      <button class="tab-btn" :class="{active:tab==='preview'}" :disabled="tabMode2!=='tab'" @click="onTabChange('preview')">
        👁 미리보기
      </button>
    </div>
    <div class="tab-modes">
      <button class="tab-mode-btn" :class="{active:tabMode2==='tab'}" @click="tabMode2='tab'" title="탭으로 보기">📑</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='1col'}" @click="tabMode2='1col'" title="1열로 보기">1▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='2col'}" @click="tabMode2='2col'" title="2열로 보기">2▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='3col'}" @click="tabMode2='3col'" title="3열로 보기">3▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='4col'}" @click="tabMode2='4col'" title="4열로 보기">4▭</button>
    </div>
  </div>
  <!-- ===== ■. 탭 컨텐츠 =================================================== -->
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">
    <!-- ===== ■.■. 배너이미지 ================================================= -->
    <div class="card" v-show="showTab('banner')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🎨 배너이미지</div>
      <div style="margin-bottom:12px;">
        <div style="font-size:12px;color:#888;margin-bottom:6px;">💡 팁: 이미지 삽입 후 크기 조절 및 배치를 자유롭게 설정할 수 있습니다.</div>
        <base-html-editor v-model="form.bannerImage" height="320px" />
      </div>
      <div class="form-actions" v-if="!cfDtlMode">
        <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleSave">
          💾 저장
        </button>
        <button class="btn btn-secondary" @click="navigate('pmPlanMng')">취소</button>
      </div>
    </div>
    <!-- ===== ■.■. 기본정보 ================================================== -->
    <div class="card" v-show="showTab('info')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📋 기본정보</div>
      <!-- 기본정보 폼 (BoFormArea 자동 렌더) -->
      <!-- ===== ■.■.■. 폼 영역 ================================================ -->
      <bo-form-area :columns="infoFormColumns" :form="form" :errors="errors"
        :readonly="false" :cols="2" :show-actions="false">
        <!-- 공개대상 체크박스 그리드 -->
        <template #visibility>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:8px 0;">
            <label v-for="opt in VISIBILITY_OPTIONS" :key="opt?.value" style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;">
              <input type="checkbox" :checked="hasVisibility(opt.value)" @change="toggleVisibility(opt.value)" />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </template>
      </bo-form-area>
      <!-- 판매업체/판매담당자 (BoFormArea 자동 렌더) -->
      <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e8e8e8;">
        <!-- ===== ■.■.■.■. 폼 영역 ============================================== -->
        <bo-form-area :columns="vendorFormColumns" :form="form" :errors="errors"
          :cols="2" :show-actions="false">
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
      </div>
      <!-- ===== ■.■.■. 판매업체 선택 모달 ========================================== -->
      <simple-vendor-pick-modal :show="showVendorModal" :vendors="vendors" :selected-id="form.vendorId"
        @select="v => selectVendor(v.vendorId, v.vendorNm)" @close="showVendorModal=false" />
      <div class="form-actions" v-if="!cfDtlMode">
        <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleSave">
          💾 저장
        </button>
        <button class="btn btn-secondary" @click="navigate('pmPlanMng')">취소</button>
      </div>
    </div>
    <!-- ===== ■.■. 내용입력 (HTML 에디터) ======================================= -->
    <div class="card" v-show="showTab('content')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📝 내용입력</div>
      <div style="margin-bottom:12px;">
        <div style="display:flex;gap:2px;margin-bottom:12px;">
          <button v-for="i in 3" :key="Math.random()" @click="activeContentTab=i"
            class="tab-btn" :class="{active:activeContentTab===i}"
            style="font-size:12px;padding:6px 14px;">
            {{ i===1 ? '🎯 주요내용' : (i===2 ? '✨ 특징' : '🎁 혜택') }}
          </button>
        </div>
      </div>
      <template v-if="activeContentTab===1">
        <base-html-editor v-model="form.content1" height="420px" />
      </template>
      <template v-if="activeContentTab===2">
        <base-html-editor v-model="form.content2" height="420px" />
      </template>
      <template v-if="activeContentTab===3">
        <base-html-editor v-model="form.content3" height="420px" />
      </template>
      <div class="form-actions" v-if="!cfDtlMode" style="margin-top:12px;">
        <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleSave">
          💾 저장
        </button>
        <button class="btn btn-secondary" @click="navigate('pmPlanMng')">취소</button>
      </div>
    </div>
    <!-- ===== ■.■. 대상상품 ================================================== -->
    <div class="card" v-show="showTab('products')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🛍 대상 상품</div>
      <div style="margin-bottom:16px;">
        <button class="btn btn-primary btn-sm" @click="showProdPopup=true" style="float:right;">+ 상품선택</button>
        <div style="clear:both;"></div>
      </div>
      <div v-if="cfSelectedProducts.length > 0" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;">
        <div v-for="p in cfSelectedProducts" :key="p?.productId" style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;background:#fff;">
          <div style="height:100px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:32px;border-bottom:1px solid #e8e8e8;">
            📦
          </div>
          <div style="padding:8px;font-size:11px;">
            <div style="font-weight:600;color:#222;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              {{ p.prodNm }}
            </div>
            <div style="color:#e8587a;font-weight:700;margin-bottom:6px;">{{ (p.price||0).toLocaleString() }}원</div>
            <button style="width:100%;padding:4px;background:#fff;border:1px solid #ddd;border-radius:4px;font-size:10px;cursor:pointer;color:#666;" @click="removeProduct(p.productId)">
              제거
            </button>
          </div>
        </div>
      </div>
      <div v-else style="text-align:center;color:#999;padding:40px;background:#f9f9f9;border-radius:6px;">선택된 상품이 없습니다.</div>
      <div class="form-actions" v-if="!cfDtlMode">
        <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleSave">
          💾 저장
        </button>
        <button class="btn btn-secondary" @click="navigate('pmPlanMng')">취소</button>
      </div>
    </div>
    <!-- ===== ■.■. 미리보기 ================================================== -->
    <div class="card" v-show="showTab('preview')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">👁 미리보기</div>
      <div style="background:#f9f9f9;border-radius:6px;padding:20px;">
        <!-- ===== ■.■.■.■. 배너 미리보기 =========================================== -->
        <div v-if="form.bannerImage" style="margin-bottom:20px;padding:16px;background:#fff;border-radius:6px;border:1px solid #e0e0e0;overflow:hidden;" v-html="form.bannerImage"></div>
        <div style="background:#fff;border-radius:6px;padding:20px;border:1px solid #e0e0e0;">
          <div style="font-size:18px;font-weight:700;color:#222;margin-bottom:12px;">{{ form.planNm }}</div>
          <div style="display:flex;gap:8px;margin-bottom:12px;">
            <span style="display:inline-block;font-size:11px;background:#e8f0fe;color:#1577db;border-radius:4px;padding:4px 8px;font-weight:600;">
              {{ form.category }}
            </span>
            <span style="display:inline-block;font-size:11px;background:#fff3e0;color:#f57c00;border-radius:4px;padding:4px 8px;font-weight:600;">
              {{ form.theme }}
            </span>
            <span style="display:inline-block;font-size:11px;background:#e8f5e9;color:#2e7d32;border-radius:4px;padding:4px 8px;font-weight:600;">
              {{ form.status }}
            </span>
          </div>
          <div style="color:#666;font-size:12px;line-height:1.6;margin-bottom:16px;">
            <div>📅 기간: {{ form.startDate }} ~ {{ form.endDate }}</div>
            <div style="margin-top:4px;">{{ form.desc }}</div>
          </div>
          <!-- ===== ■.■.■.■.■. 컨텐츠 미리보기 ======================================== -->
          <template v-if="form.content1 || form.content2 || form.content3">
            <div style="border-top:1px solid #e0e0e0;padding-top:16px;margin-top:16px;">
              <div v-if="form.content1" style="margin-bottom:20px;">
                <div style="font-size:13px;font-weight:700;color:#333;margin-bottom:8px;">🎯 주요내용</div>
                <div style="font-size:12px;line-height:1.8;color:#555;" v-html="form.content1"></div>
              </div>
              <div v-if="form.content2" style="margin-bottom:20px;">
                <div style="font-size:13px;font-weight:700;color:#333;margin-bottom:8px;">✨ 특징</div>
                <div style="font-size:12px;line-height:1.8;color:#555;" v-html="form.content2"></div>
              </div>
              <div v-if="form.content3">
                <div style="font-size:13px;font-weight:700;color:#333;margin-bottom:8px;">🎁 혜택</div>
                <div style="font-size:12px;line-height:1.8;color:#555;" v-html="form.content3"></div>
              </div>
            </div>
          </template>
          <!-- ===== ■.■.■.■.■. 대상상품 미리보기 ======================================= -->
          <div v-if="cfSelectedProducts.length > 0" style="border-top:1px solid #e0e0e0;padding-top:16px;margin-top:16px;">
            <div style="font-size:13px;font-weight:700;color:#333;margin-bottom:12px;">🛍 대상상품 ({{ cfSelectedProducts.length }}개)</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;">
              <div v-for="p in cfSelectedProducts" :key="p?.productId" style="text-align:center;padding:10px;background:#f9f9f9;border-radius:6px;">
                <div style="font-size:32px;margin-bottom:4px;">📦</div>
                <div style="font-size:11px;font-weight:600;color:#222;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                  {{ p.prodNm }}
                </div>
                <div style="font-size:12px;color:#e8587a;font-weight:700;margin-top:4px;">{{ (p.price||0).toLocaleString() }}원</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="form-actions" v-if="!cfDtlMode">
        <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleSave">
          💾 저장
        </button>
        <button class="btn btn-secondary" @click="navigate('pmPlanMng')">취소</button>
      </div>
    </div>
  </div>
</div>
<!-- ===== ■. 상품선택 모달 ================================================= -->
<simple-prod-pick-modal :show="showProdPopup" :prods="products" :selected-ids="form.productIds"
  title="상품선택" @toggle="toggleProduct" @close="showProdPopup=false" />
`
};
