/* ShopJoy Admin - 이벤트관리 상세/등록 (Toast UI HTML Editor) */
window._ecEventDtlState = window._ecEventDtlState || { tab: 'info', tabMode: 'tab' };
window.PmEventDtl = {
  name: 'PmEventDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    tabMode:      { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const products = reactive([]);
    const uiState = reactive({ loading: false, showProdPopup: false, showVendorModal: false, error: null, isPageCodeLoad: false, tab: window._ecEventDtlState.tab || 'info', tabMode2: window._ecEventDtlState.tabMode || 'tab', activeContentTab: 1, prodSearch: ''});
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({ event_statuses: [] });

    // 단건 조회 + 상품목록 로드
    const handleSearchDetail = async () => {
      uiState.loading = true;
      try {
        const calls = [boApiSvc.pdProd.getPage({ pageNo: 1, pageSize: 10000 }, '이벤트관리', '조회')];
        if (!cfIsNew.value) calls.unshift(boApiSvc.pmEvent.getById(props.dtlId, '이벤트관리', '상세조회'));
        const results = await Promise.all(calls);
        if (!cfIsNew.value) {
          const e = results[0].data?.data || results[0].data;
          if (e) {
            Object.assign(form, { ...e, targetProducts: [...(e.targetProducts || [])] });
            if (!form.visibilityTargets) {
              form.visibilityTargets = window.visibilityUtil.fromLegacy('항상 표시', e.authRequired, '');
              if (!form.visibilityTargets) form.visibilityTargets = '^PUBLIC^';
            }
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

watch(() => uiState.tab, v => { window._ecEventDtlState.tab = v; });

        watch(() => uiState.tabMode2, v => { window._ecEventDtlState.tabMode = v; });

    /* 이벤트 showTab */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;

    /* 이벤트 fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.event_statuses = codeStore.sgGetGrpCodes('EVENT_STATUS_KR');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);


    const _today = new Date();

    /* 이벤트 _pad */
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END   = `${_today.getFullYear()+3}-12-31`;

    const form = reactive({
      title: '', status: '진행중', startDate: DEFAULT_START, endDate: DEFAULT_END,
      authRequired: false, targetProducts: [], visibilityTargets: '^PUBLIC^',
      bannerImage: '', content1: '', content2: '', content3: '', content4: '', content5: '',
      vendorId: '', chargeStaff: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      title: yup.string().required('이벤트 제목을 입력해주세요.'),
    });

    /* 이벤트 onTabChange */
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
      if (typeof handleLoadDetail === 'function') await handleLoadDetail();
      else if (typeof handleSearchDetail === 'function') await handleSearchDetail();
    });

    /* 대상 상품 팝업 */
        const cfFilteredProds = computed(() => window.safeArrayUtils.safeFilter(products, p => {
      const searchVal = prodSearch.value.trim().toLowerCase();
      return !searchVal || p.prodNm.toLowerCase().includes(searchVal);
    }));

    /* 이벤트 toggleProduct */
    const toggleProduct = (pid) => {
      const idx = form.targetProducts.indexOf(pid);
      if (idx === -1) form.targetProducts.push(pid);
      else form.targetProducts.splice(idx, 1);
    };

    /* 이벤트 isSelected */
    const isSelected = (pid) => form.targetProducts.includes(pid);
    const cfSelectedProducts = computed(() =>
      form.targetProducts.map(pid => products.find(p => p.productId === pid || p.prodId === pid)).filter(Boolean)
    );

    /* 이벤트 removeProduct */
    const removeProduct = (pid) => {
      const idx = form.targetProducts.indexOf(pid);
      if (idx !== -1) form.targetProducts.splice(idx, 1);
    };

    /* 이벤트 확인 버튼 토스트 */
    const onEventConfirm = () => {
      showToast('이벤트 참여가 완료되었습니다! 감사합니다.', 'success');
    };

    const cfCurId       = computed(() => props.dtlId || form.eventId || null);
    const cfHasId       = computed(() => !!cfCurId.value);
    /* 신규 등록은 info 탭에서만 가능. 그 외 탭(banner/content/products/preview)은 ID 없으면 비활성 */
    const cfSaveDisabled = computed(() => uiState.tab !== 'info' && !cfHasId.value);

    /* 이벤트 _afterApiOk */
    const _afterApiOk  = (res, msg) => {
      if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
      if (showToast) showToast(msg, 'success');
    };

    /* 이벤트 _afterApiErr */
    const _afterApiErr = (err) => {
      console.error('[handleSave]', err);
      const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
      if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
      if (showToast) showToast(errMsg, 'error', 0);
    };

    /* ── 탭별 저장: info=본체, banner=배너이미지, content=콘텐츠5개, products=대상상품, preview=저장없음 ── */
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
            ? await boApiSvc.pmEvent.create(payload, '이벤트관리', '등록')
            : await boApiSvc.pmEvent.update(cfCurId.value, payload, '이벤트관리', '기본정보저장');
          if (isCreate) {
            const newId = res.data?.data?.eventId || res.data?.eventId || null;
            if (newId) form.eventId = newId;
          }
          _afterApiOk(res, isCreate ? '등록되었습니다. 다른 탭을 저장할 수 있습니다.' : '저장되었습니다.');
        } catch (err) { _afterApiErr(err); }
        return;
      }

      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;

      const TAB_LABEL = { banner: '배너이미지', content: '이벤트내용', products: '대상상품' };
      let payload = null;
      switch (tabId) {
        case 'banner':   payload = { bannerImage: form.bannerImage }; break;
        case 'content':  payload = { content1: form.content1, content2: form.content2, content3: form.content3, content4: form.content4, content5: form.content5 }; break;
        case 'products': payload = { targetProducts: form.targetProducts, visibilityTargets: form.visibilityTargets }; break;
        default:         payload = {}; break;
      }
      try {
        const res = await boApiSvc.pmEvent.update(cfCurId.value, payload, '이벤트관리', `${TAB_LABEL[tabId] || tabId}저장`);
        _afterApiOk(res, `${TAB_LABEL[tabId] || ''} 저장되었습니다.`);
      } catch (err) { _afterApiErr(err); }
    };

    const cfVisibilityOptions = computed(() => window.visibilityUtil.allOptions());

    /* 이벤트 hasVisibility */
    const hasVisibility = (code) => window.visibilityUtil.has(form.visibilityTargets, code);

    /* 이벤트 toggleVisibility */
    const toggleVisibility = (code) => {
      const list = window.visibilityUtil.parse(form.visibilityTargets);
      const i = list.indexOf(code);
      if (i >= 0) list.splice(i, 1); else list.push(code);
      form.visibilityTargets = window.visibilityUtil.serialize(list);
    };

    const cfSelectedVendorNm = computed(() => {
      if (!form.vendorId) return '소속업체 선택';
      const v = vendors.value.find(x => x.vendorId === form.vendorId);
      return v ? v.vendorNm : '소속업체 선택';
    });

    /* 이벤트 selectVendor */
    const selectVendor = (vendorId, vendorNm) => {
      form.vendorId = vendorId;
      uiState.showVendorModal = false;
    };

    const activeContentTab = Vue.toRef(uiState, 'activeContentTab');
    const prodSearch = Vue.toRef(uiState, 'prodSearch');
    const showProdPopup = Vue.toRef(uiState, 'showProdPopup');
    const showVendorModal = Vue.toRef(uiState, 'showVendorModal');

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    // -- return ---------------------------------------------------------------

    return { events, uiState, codes, cfIsNew, cfHasId, cfSaveDisabled, tab, onTabChange, form, errors, activeContentTab, prodSearch, cfFilteredProds, toggleProduct, isSelected, cfSelectedProducts, removeProduct, onEventConfirm, handleSave, cfVisibilityOptions, hasVisibility, toggleVisibility, cfDtlMode, tabMode2, showTab, cfSelectedVendorNm, selectVendor };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ cfIsNew ? '이벤트 등록' : (cfDtlMode ? '이벤트 상세' : '이벤트 수정') }}<span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.eventId }}</span></div>
    <div class="tab-bar-row">
      <div class="tab-nav">
        <button class="tab-btn" :class="{active:tab==='banner'}" :disabled="tabMode2!=='tab'" @click="onTabChange('banner')">🎨 배너이미지</button>
        <button class="tab-btn" :class="{active:tab==='info'}" :disabled="tabMode2!=='tab'" @click="onTabChange('info')">📋 기본정보</button>
        <button class="tab-btn" :class="{active:tab==='content'}" :disabled="tabMode2!=='tab'" @click="onTabChange('content')">📝 이벤트 내용</button>
        <button class="tab-btn" :class="{active:tab==='products'}" :disabled="tabMode2!=='tab'" @click="onTabChange('products')">
          🛍 대상 상품 <span class="tab-count">{{ form.targetProducts.length }}</span>
        </button>
        <button class="tab-btn" :class="{active:tab==='preview'}" :disabled="tabMode2!=='tab'" @click="onTabChange('preview')">👁 미리보기</button>
      </div>
      <div class="tab-modes">
        <button class="tab-mode-btn" :class="{active:tabMode2==='tab'}" @click="tabMode2='tab'" title="탭으로 보기">📑</button>
        <button class="tab-mode-btn" :class="{active:tabMode2==='1col'}" @click="tabMode2='1col'" title="1열로 보기">1▭</button>
        <button class="tab-mode-btn" :class="{active:tabMode2==='2col'}" @click="tabMode2='2col'" title="2열로 보기">2▭</button>
        <button class="tab-mode-btn" :class="{active:tabMode2==='3col'}" @click="tabMode2='3col'" title="3열로 보기">3▭</button>
        <button class="tab-mode-btn" :class="{active:tabMode2==='4col'}" @click="tabMode2='4col'" title="4열로 보기">4▭</button>
      </div>
    </div>
    <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">

    <!-- -- 배너이미지 -------------------------------------------------------- -->
    <div class="card" v-show="showTab('banner')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🎨 배너이미지</div>
      <div style="margin-bottom:12px;">
        <div style="font-size:12px;color:#888;margin-bottom:6px;">💡 팁: 이미지 삽입 후 크기 조절 및 배치를 자유롭게 설정할 수 있습니다.</div>
        <base-html-editor v-model="form.bannerImage" height="320px" />
      </div>
      <div class="form-actions" v-if="!cfDtlMode">
        <template v-if="cfDtlMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('pmEventMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleSave">저장</button>
          <button class="btn btn-secondary" @click="navigate('pmEventMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- -- 기본정보 --------------------------------------------------------- -->
    <div class="card" v-show="showTab('info')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📋 기본정보</div>
      <div class="form-group">
        <label class="form-label">이벤트 제목 <span v-if="!cfDtlMode" class="req">*</span></label>
        <input class="form-control" v-model="form.title" placeholder="이벤트 제목을 입력하세요" :readonly="cfDtlMode" :class="errors.title ? 'is-invalid' : ''" />
        <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">시작일</label>
          <input class="form-control" type="date" v-model="form.startDate" :readonly="cfDtlMode" />
        </div>
        <div class="form-group">
          <label class="form-label">종료일</label>
          <input class="form-control" type="date" v-model="form.endDate" :readonly="cfDtlMode" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" v-model="form.status" :disabled="cfDtlMode">
            <option v-for="c in codes.event_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
          </select>
        </div>
        <div class="form-group" style="display:flex;align-items:flex-end;">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" v-model="form.authRequired" />
            <span style="font-size:13px;font-weight:500;">로그인 인증 필요</span>
          </label>
        </div>
      </div>
      <div v-if="form.authRequired" style="padding:10px 14px;background:#fff7e6;border-radius:6px;border:1px solid #ffd591;font-size:12px;color:#d46b08;">
        ⚠️ 인증 필요 설정 시, 이벤트 내용 3~5는 로그인 회원에게만 표시됩니다.
      </div>
      <div style="margin-top:14px;">
        <div style="font-size:12px;font-weight:700;color:#888;margin-bottom:8px;">🔒 공개 대상 (하나라도 해당하면 노출)</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          <label v-for="opt in cfVisibilityOptions" :key="opt?.codeValue"
            :style="{
              display:'inline-flex',alignItems:'center',gap:'6px',padding:'5px 10px',borderRadius:'14px',
              border:'1px solid '+(hasVisibility(opt.codeValue)?'#1565c0':'#ddd'),
              background:hasVisibility(opt.codeValue)?'#e3f2fd':'#fafafa',
              color:hasVisibility(opt.codeValue)?'#1565c0':'#666',
              fontSize:'12px',fontWeight:hasVisibility(opt.codeValue)?700:500,
              cursor: cfDtlMode?'default':'pointer',
            }">
            <input type="checkbox" :checked="hasVisibility(opt.codeValue)" :disabled="cfDtlMode"
              @change="toggleVisibility(opt.codeValue)" style="accent-color:#1565c0;" />
            {{ opt.codeLabel }}
          </label>
        </div>
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
          <input class="form-control" v-model="form.chargeStaff" placeholder="담당자명 입력" :readonly="cfDtlMode" />
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

      <div class="form-actions" v-if="!cfDtlMode">
        <template v-if="cfDtlMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('pmEventMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleSave">저장</button>
          <button class="btn btn-secondary" @click="navigate('pmEventMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- -- 이벤트 내용 (HTML 에디터) -------------------------------------------- -->
    <div class="card" v-show="showTab('content')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📝 이벤트 내용</div>
      <div style="display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap;">
        <button v-for="n in 5" :key="Math.random()" class="btn btn-sm"
          :class="activeContentTab===n ? 'btn-primary' : 'btn-secondary'"
          @click="activeContentTab=n">
          내용 {{ n }}
          <span v-if="form.authRequired && n >= 3" class="tab-count" style="background:#fde8ee;color:#e8587a;">인증</span>
        </button>
      </div>
      <div v-for="n in 5" :key="Math.random()" v-show="activeContentTab===n">
        <div v-if="form.authRequired && n >= 3" style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:8px 12px;background:#fff7e6;border-radius:6px;border:1px solid #ffd591;">
          <span class="badge badge-orange">인증 후 표시</span>
          <span style="font-size:12px;color:#888;">로그인 회원에게만 표시됩니다</span>
        </div>
        <div v-if="cfDtlMode" class="form-control" style="min-height:160px;line-height:1.6;" v-html="form['content'+n] || '<span style=color:#bbb>-</span>'"></div>
        <base-html-editor v-else :model-value="form['content'+n]" @update:model-value="v => form['content'+n] = v" height="220px" />
      </div>
      <div class="form-actions" v-if="!cfDtlMode" style="margin-top:16px;">
        <template v-if="cfDtlMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('pmEventMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleSave">저장</button>
          <button class="btn btn-secondary" @click="navigate('pmEventMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- -- 대상 상품 -------------------------------------------------------- -->
    <div class="card" v-show="showTab('products')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🛍 대상 상품 <span class="tab-count">{{ form.targetProducts.length }}</span></div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:14px;">
        <button v-if="!cfDtlMode" class="btn btn-secondary" @click="showProdPopup=true">+ 상품 추가</button>
        <span style="font-size:13px;color:#888;">{{ form.targetProducts.length }}개 선택됨</span>
      </div>
      <table class="bo-table" v-if="cfSelectedProducts.length">
        <thead><tr><th>ID</th><th>상품명</th><th>카테고리</th><th>가격</th><th>재고</th><th>상태</th><th>제거</th></tr></thead>
        <tbody>
          <tr v-for="p in cfSelectedProducts" :key="p?.productId">
            <td>{{ p.productId }}</td>
            <td><span class="ref-link" @click="showRefModal('product', p.productId)">{{ p.prodNm }}</span></td>
            <td>{{ p.category }}</td>
            <td>{{ (p.price||0).toLocaleString() }}원</td>
            <td>{{ p.stock }}개</td>
            <td>{{ p.status }}</td>
            <td><button class="btn btn-danger btn-sm" @click="removeProduct(p.productId)">제거</button></td>
          </tr>
        </tbody>
      </table>
      <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">선택된 상품이 없습니다.</div>
      <div class="form-actions" v-if="!cfDtlMode">
        <template v-if="cfDtlMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('pmEventMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleSave">저장</button>
          <button class="btn btn-secondary" @click="navigate('pmEventMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- -- 미리보기 --------------------------------------------------------- -->
    <div class="card" v-show="showTab('preview')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">👁 미리보기</div>
      <div style="background:#f9f9f9;border-radius:10px;padding:20px;border:1px solid #e8e8e8;max-width:600px;">
        <!-- -- 배너 미리보기 -------------------------------------------------- -->
        <div v-if="form.bannerImage" style="margin-bottom:20px;padding:12px;background:#fff;border-radius:6px;border:1px solid #e0e0e0;overflow:hidden;" v-html="form.bannerImage"></div>

        <div style="font-size:18px;font-weight:700;margin-bottom:12px;color:#1a1a2e;">{{ form.title || '이벤트 제목' }}</div>
        <div style="font-size:12px;color:#aaa;margin-bottom:16px;">{{ form.startDate }} ~ {{ form.endDate }}</div>
        <div style="font-size:13px;color:#444;margin-bottom:12px;" v-html="form.content1 || '<p style=color:#aaa>이벤트 내용 1이 여기에 표시됩니다.</p>'"></div>
        <div style="font-size:13px;color:#444;margin-bottom:12px;" v-html="form.content2"></div>
        <template v-if="!form.authRequired">
          <div style="font-size:13px;color:#444;margin-bottom:12px;" v-html="form.content3"></div>
          <div style="font-size:13px;color:#444;margin-bottom:12px;" v-html="form.content4"></div>
          <div style="font-size:13px;color:#444;margin-bottom:16px;" v-html="form.content5"></div>
        </template>
        <div v-else style="padding:12px;background:#f0f0f0;border-radius:6px;font-size:12px;color:#888;margin-bottom:16px;">
          🔒 내용 3~5는 로그인 후 확인 가능합니다.
        </div>
        <div v-if="cfSelectedProducts.length > 0" style="margin-top:20px;padding-top:20px;border-top:1px solid #e0e0e0;">
          <div style="font-size:14px;font-weight:700;color:#333;margin-bottom:12px;">🎯 대상 상품 ({{ cfSelectedProducts.length }}개)</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;">
            <div v-for="p in cfSelectedProducts" :key="p?.productId" style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;background:#fff;">
              <div style="height:100px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:32px;border-bottom:1px solid #e8e8e8;">📦</div>
              <div style="padding:8px;font-size:11px;">
                <div style="font-weight:600;color:#222;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ p.prodNm }}</div>
                <div style="color:#e8587a;font-weight:700;">{{ (p.price||0).toLocaleString() }}원</div>
              </div>
            </div>
          </div>
        </div>
        <button class="btn btn-primary" @click="onEventConfirm" style="margin-top:16px;">이벤트 확인</button>
      </div>
    </div>
  </div>

  <!-- -- 상품 선택 팝업 ------------------------------------------------------- -->
  <div v-if="showProdPopup" class="modal-overlay" @click.self="showProdPopup=false">
    <div class="modal-box">
      <div class="modal-header">
        <span class="modal-title">대상 상품 선택</span>
        <span class="modal-close" @click="showProdPopup=false">×</span>
      </div>
      <div style="margin-bottom:10px;">
        <input class="form-control" v-model="prodSearch" placeholder="상품명 검색" />
      </div>
      <div class="popup-prod-list">
        <label v-for="p in cfFilteredProds" :key="p?.productId" class="popup-prod-item">
          <input type="checkbox" :checked="isSelected(p.productId)" @change="toggleProduct(p.productId)" />
          <span>{{ p.prodNm }}</span>
          <span style="font-size:12px;color:#888;margin-left:auto;">{{ (p.price||0).toLocaleString() }}원</span>
        </label>
      </div>
      <div style="margin-top:12px;text-align:right;">
        <button class="btn btn-primary" @click="showProdPopup=false">확인 ({{ form.targetProducts.length }}개)</button>
      </div>
    </div>
  </div>
</div>
`
};
