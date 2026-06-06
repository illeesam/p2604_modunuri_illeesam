/* ShopJoy Admin - 이벤트관리 상세/등록 (Toast UI HTML Editor) */
window._ecEventDtlState = window._ecEventDtlState || { tab: 'info', tabMode: 'tab' };
window.PmEventDtl = {
  name: 'PmEventDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    active:       { type: Boolean, default: true }, // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const products = reactive([]);
    const vendors = reactive([]);
    const uiState = reactive({ loading: false, showProdPopup: false, showVendorModal: false, error: null, isPageCodeLoad: false, tab: window._ecEventDtlState.tab || 'info', tabMode2: window._ecEventDtlState.tabMode || 'tab', activeContentTab: 1, prodSearch: ''});
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({ event_statuses: [] });

    const _today = new Date();

    /* _pad — 패딩 */
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END   = `${_today.getFullYear()+3}-12-31`;

    const form = reactive({
      eventTitle: '', eventStatusCd: '', startDate: '', endDate: '',
      authRequired: false, targetProducts: [], visibilityTargets: '^PUBLIC^',
      bannerImage: '', content1: '', content2: '', content3: '', content4: '', content5: '',
      vendorId: '', chargeStaff: '',
    });
    /* _applyNewDefaults — 신규 진입 시에만 비어있지 않던 기본값 채움 (inactive/초기화 상태에선 빈 폼 유지) */
    const _applyNewDefaults = () => {
      Object.assign(form, { eventStatusCd: '진행중', startDate: DEFAULT_START, endDate: DEFAULT_END });
    };
    const errors = reactive({});

    const schema = yup.object({
      eventTitle: yup.string().required('이벤트 제목을 입력해주세요.'),
    });

    const cfIsNew = computed(() => !props.dtlId);
    const cfCurId       = computed(() => props.dtlId || form.eventId || null);
    const cfHasId       = computed(() => !!cfCurId.value);
    /* 신규 등록은 info 탭에서만 가능. 그 외 탭(banner/content/products/preview)은 ID 없으면 비활성 */
    const cfSaveDisabled = computed(() => uiState.tab !== 'info' && !cfHasId.value);

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PmEventDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장
      if (cmd === 'form-save') {
        return handleSave();
      // 폼 취소 → 상세영역 유지 + 빈 신규 폼으로 초기화 (영역 사라지지 않음)
      } else if (cmd === 'form-cancel') {
        return props.navigate('__cancelEdit__');
      // 폼 닫기 → 상세영역 유지 + 빈 신규 폼으로 초기화
      } else if (cmd === 'form-close') {
        return props.navigate('__cancelEdit__');
      // 상세 보기 → 편집 모드 전환
      } else if (cmd === 'form-edit') {
        return props.navigate('__switchToEdit__');
      // 탭 전환
      } else if (cmd === 'tab-select') {
        return onTabChange(param);
      // 뷰모드 변경
      } else if (cmd === 'tab-mode') {
        uiState.tabMode2 = param;
        return;
      // 이벤트 내용 N번 탭 전환
      } else if (cmd === 'content-tab') {
        uiState.activeContentTab = param;
        return;
      // 공개대상 토글
      } else if (cmd === 'form-visibilityToggle') {
        return toggleVisibility(param);
      // 상품 선택 팝업 열기
      } else if (cmd === 'prodPickModal-open') {
        uiState.showProdPopup = true;
        return;
      // 상품 선택 팝업 닫기
      } else if (cmd === 'prodPickModal-close') {
        uiState.showProdPopup = false;
        return;
      // 판매업체 모달 열기
      } else if (cmd === 'vendorModal-open') {
        uiState.showVendorModal = true;
        return;
      // 판매업체 모달 닫기
      } else if (cmd === 'vendorModal-close') {
        uiState.showVendorModal = false;
        return;
      // 판매업체 초기화
      } else if (cmd === 'form-vendorClear') {
        form.vendorId = '';
        form.chargeStaff = '';
        return;
      // 미리보기 이벤트 확인 토스트
      } else if (cmd === 'preview-eventConfirm') {
        return onEventConfirm();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PmEventDtl.js : handleSelectAction -> ', cmd, param);
      // 상품 추가/제거 토글
      if (cmd === 'prodPickModal-toggle') {
        return toggleProduct(param);
      // 상품 제거 (선택 목록에서)
      } else if (cmd === 'items-rowDelete') {
        return removeProduct(param);
      // 참조 모달 열기
      } else if (cmd === 'items-ref') {
        return showRefModal(param.type, param.id);
      // 판매업체 선택
      } else if (cmd === 'vendorModal-select') {
        return selectVendor(param.vendorId, param.vendorNm);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };


    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ PmEventDtl : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'vendor-pick') {
        if (result == null) {
            uiState.showVendorModal = false;
            return;
        }
        return selectVendor(result.vendorId, result.vendorNm);
      } else if (cmd === 'prod-pick') {
        if (result == null) {
            uiState.showProdPopup = false;
            return;
        }
          return toggleProduct(result);
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };
    // 단건 조회 + 상품목록 로드
    /* loadVendors — 로드 */
    const loadVendors = async () => {
      try {
        const _vr = await boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 10000 }, '관리', '조회');
        vendors.splice(0, vendors.length, ...(_vr.data?.data?.pageList || _vr.data?.data?.list || []));
      } catch (e) { console.warn('[PmEventDtl.js] vendor load failed', e); }
    };

    /* handleSearchDetail — 처리 */
    const handleSearchDetail = async () => {
      await loadVendors();
      uiState.loading = true;
      try {
        const calls = [boApiSvc.pdProd.getPage({ pageNo: 1, pageSize: 10000 }, '이벤트관리', '조회')];
        if (!cfIsNew.value) { calls.unshift(boApiSvc.pmEvent.getById(props.dtlId, '이벤트관리', '상세조회')); }
        const results = await Promise.all(calls);
        if (!cfIsNew.value) {
          const e = results[0].data?.data || results[0].data;
          if (e) {
            Object.assign(form, { ...e, targetProducts: [...(e.targetProducts || [])] });
            if (!form.visibilityTargets) {
              form.visibilityTargets = window.visibilityUtil.fromLegacy('항상 표시', e.authRequired, '');
              if (!form.visibilityTargets) { form.visibilityTargets = '^PUBLIC^'; }
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

    watch(() => uiState.tab, v => { window._ecEventDtlState.tab = v; });
    watch(() => uiState.tabMode2, v => { window._ecEventDtlState.tabMode = v; });

    /* showTab — 표시 */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;


    /* tabs — 탭 정의 (BoTabBar 데이터, reactive) */
    const tabs = reactive([
      { id: 'banner', label: '배너이미지', icon: '🎨' },
      { id: 'info', label: '기본정보', icon: '📋' },
      { id: 'content', label: '이벤트 내용', icon: '📝' },
      { id: 'preview', label: '미리보기', icon: '👁' },
    ]);
    /* 이벤트 fnLoadCodes */
    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ################################# */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.event_statuses = codeStore.sgGetGrpCodes('EVENT_STATUS_KR');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* 이벤트 onTabChange */
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* onTabChange — 탭 변경 */
    const onTabChange = (newTab) => {
      uiState.tab = newTab;
    };

    // ★ onMounted
    onMounted(async () => {
      if (isAppReady.value) { fnLoadCodes(); }
      if (props.active && cfIsNew.value) { _applyNewDefaults(); }
      // 마운트 시 상세 조회 — 행 클릭으로 key 변경 시 재마운트되므로 watch(reloadTrigger)만으론 최초 로드 누락됨
      await handleSearchDetail();
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
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
      const idx = form.targetProducts.indexOf(pid);
      if (idx === -1) { form.targetProducts.push(pid); }
      else { form.targetProducts.splice(idx, 1); }
    };

    /* isSelected — 여부 확인 */
    const isSelected = (pid) => form.targetProducts.includes(pid);
    const cfSelectedProducts = computed(() =>
      form.targetProducts.map(pid => products.find(p => p.productId === pid || p.prodId === pid)).filter(Boolean)
    );

    /* removeProduct — 제거 */
    const removeProduct = (pid) => {
      const idx = form.targetProducts.indexOf(pid);
      if (idx !== -1) { form.targetProducts.splice(idx, 1); }
    };

    /* onEventConfirm — 이벤트 */
    const onEventConfirm = () => {
      showToast('이벤트 참여가 완료되었습니다! 감사합니다.', 'success');
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
        if (!ok) { return; }
        try {
          const payload = { ...form };
          const res = isCreate
            ? await boApiSvc.pmEvent.create(payload, '이벤트관리', '등록')
            : await boApiSvc.pmEvent.update(cfCurId.value, payload, '이벤트관리', '기본정보저장');
          if (isCreate) {
            const newId = res.data?.data?.eventId || res.data?.eventId || null;
            if (newId) { form.eventId = newId; }
          }
          _afterApiOk(res, isCreate ? '등록되었습니다. 다른 탭을 저장할 수 있습니다.' : '저장되었습니다.');
        } catch (err) { _afterApiErr(err); }
        return;
      }

      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) { return; }

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

    /* hasVisibility — 여부 확인 */
    const hasVisibility = (code) => window.visibilityUtil.has(form.visibilityTargets, code);

    /* toggleVisibility — 토글 */
    const toggleVisibility = (code) => {
      const list = window.visibilityUtil.parse(form.visibilityTargets);
      const i = list.indexOf(code);
      if (i >= 0) list.splice(i, 1); else list.push(code);
      form.visibilityTargets = window.visibilityUtil.serialize(list);
    };

    const cfSelectedVendorNm = computed(() => {
      if (!form.vendorId) { return '소속업체 선택'; }
      const v = vendors.find(x => x.vendorId === form.vendorId);
      return v ? v.vendorNm : '소속업체 선택';
    });

    /* selectVendor — 선택 */
    const selectVendor = (vendorId, vendorNm) => {
      form.vendorId = vendorId;
      // 판매업체 선택 시 판매담당자(대표자명) 자동 적용
      const v = vendors.find(x => x.vendorId === vendorId);
      if (v) { form.chargeStaff = v.chargeStaff || v.ceoNm || v.vendorNm || ''; }
      uiState.showVendorModal = false;
    };

    const activeContentTab = Vue.toRef(uiState, 'activeContentTab');
    const prodSearch = Vue.toRef(uiState, 'prodSearch');
    const showProdPopup = Vue.toRef(uiState, 'showProdPopup');
    const showVendorModal = Vue.toRef(uiState, 'showVendorModal');

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    /* BoGrid(bare) 컬럼 정의 — 대상 상품 */
    const columns = {};
    columns.productGrid = [
      { key: 'productId', label: 'ID' },
      { key: 'prodNm',    label: '상품명', refLink: 'product', refKey: 'productId' },
      { key: 'category',  label: '카테고리' },
      { key: 'price',     label: '가격', fmt: v => (v||0).toLocaleString() + '원' },
      { key: 'stock',     label: '재고', fmt: v => v + '개' },
      { key: 'status',    label: '상태' },
    ];

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - info 탭 (이벤트 제목/기간/상태) ==
    // 정보 영역 폼
    columns.infoForm = [
      { key: 'eventTitle',   label: '이벤트 제목', type: 'text', required: true,
        placeholder: '이벤트 제목을 입력하세요' },
      { key: 'startDate',    label: '시작일', type: 'date' },
      { key: 'endDate',      label: '종료일', type: 'date' },
      { key: 'eventStatusCd', label: '상태', type: 'select', options: () => codes.event_statuses },
      { key: 'authRequired', label: '로그인 인증 필요', type: 'checkbox',
        checkboxLabel: '로그인 인증 필요', hideLabel: true,
        checkedValue: true, uncheckedValue: false },
    ];
    // 판매업체/판매담당자
    columns.vendorForm = [
      { key: 'vendorId',    label: '판매업체', type: 'slot', name: 'vendor' },
      { key: 'chargeStaff', label: '판매담당자', type: 'text', placeholder: '담당자명 입력' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      coUtil,  // 템플릿 cofAnd 접근용
      columns,
      vendors, products, uiState, codes, form, errors, tabs,                        // 상태 / 데이터
      handleBtnAction, handleSelectAction, fnCallbackModal,                                          // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfHasId, cfSaveDisabled, cfDtlMode, cfFilteredProds, cfSelectedProducts, cfVisibilityOptions, cfSelectedVendorNm, // computed
      tab, tabMode2, activeContentTab, prodSearch, showProdPopup, showVendorModal,  // toRef
      showTab, isSelected, hasVisibility,                                            // 헬퍼
    };
  },
  template: /* html */`
<!-- ===== ■. 상세 카드 (제목 + 탭바 + 탭컨텐츠를 한 영역으로) ===================== -->
<bo-container :title="!active ? '이벤트 상세' : (cfIsNew ? '이벤트 등록' : (cfDtlMode ? '이벤트 상세' : '이벤트 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : form.eventId)">
  <!-- ===== ■.■. 탭바 ==================================================== -->
  <bo-tab-bar :tabs="tabs" :tab="tab" :tab-mode="tabMode2"
    @tab-select="id => handleBtnAction('tab-select', id)"
    @mode-select="m => handleBtnAction('tab-mode', m)" />
  <!-- ===== □.■. 탭바 ==================================================== -->
  <!-- ===== ■. 탭 컨텐츠 =================================================== -->
<div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">
  <!-- ===== ■.■. 배너이미지 ================================================= -->
  <div class="dtl-pane" v-show="showTab('banner')" style="margin:0;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
      🎨 배너이미지
    </div>
    <div style="margin-bottom:12px;">
      <div style="font-size:12px;color:#888;margin-bottom:6px;">
        💡 팁: 이미지 삽입 후 크기 조절 및 배치를 자유롭게 설정할 수 있습니다.
      </div>
      <base-html-editor v-model="form.bannerImage" height="320px" />
    </div>
    <div class="form-actions" v-if="active && cfDtlMode">
      <button class="btn btn-blue" @click="handleBtnAction('form-edit')">
        수정
      </button>
      <button class="btn btn-secondary" @click="handleBtnAction('form-close')">
        닫기
      </button>
    </div>
    <div class="form-actions" v-if="active && !cfDtlMode">
      <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleBtnAction('form-save')">
        저장
      </button>
      <button class="btn btn-secondary" @click="handleBtnAction('form-cancel')">
        취소
      </button>
    </div>
  </div>
  <!-- ===== □.□. 배너이미지 ================================================= -->
  <!-- ===== ■.■. 기본정보 ================================================== -->
  <div class="dtl-pane" v-show="showTab('info')" style="margin:0;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
      📋 기본정보
    </div>
    <!-- ===== ■.■.■. 이벤트 제목/기간/상태 (BoFormArea 자동 렌더) ===================== -->
    <!-- ===== ■.■.■. 폼 영역 ================================================ -->
    <bo-form-area :columns="columns.infoForm" :form="form" :errors="errors"
      :readonly="cfDtlMode" :cols="3" compact :show-actions="false" />
    <div v-if="form.authRequired" style="padding:10px 14px;background:#fff7e6;border-radius:6px;border:1px solid #ffd591;font-size:12px;color:#d46b08;">
      ⚠️ 인증 필요 설정 시, 이벤트 내용 3~5는 로그인 회원에게만 표시됩니다.
    </div>
    <div style="margin-top:14px;">
      <div style="font-size:12px;font-weight:700;color:#888;margin-bottom:8px;">
        🔒 공개 대상 (하나라도 해당하면 노출)
      </div>
      <bo-multi-check-select v-model="form.visibilityTargets" :options="cfVisibilityOptions"
        separator="^" wrap empty-value="^NONE^" placeholder="전체 공개" all-label="전체 공개"
        :disabled="cfDtlMode" min-width="320px" />
    </div>
    <!-- ===== ■.■.■. 판매업체/판매담당자 (BoFormArea 자동 렌더) ======================= -->
    <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e8e8e8;">
      <!-- ===== ■.■.■.■. 폼 영역 ============================================== -->
      <bo-form-area :columns="columns.vendorForm" :form="form" :errors="errors"
        :readonly="cfDtlMode" :cols="3" compact :show-actions="false">
        <template #vendor>
          <div style="display:flex;gap:8px;align-items:center;">
            <div class="form-control" :style="'background:#f9f9f9;padding:0;display:flex;align-items:center;cursor:' + (cfDtlMode ? 'default' : 'pointer')" @click="cfDtlMode ? null : handleBtnAction('vendorModal-open')">
              <span style="padding:4px 10px;flex:1;">
                {{ cfSelectedVendorNm }}
              </span>
              <span style="padding:4px 10px;color:#999;font-size:12px;">
                ▼
              </span>
            </div>
            <button v-if="coUtil.cofAnd(form.vendorId, !cfDtlMode)" type="button" title="선택 해제" @click="handleBtnAction('form-vendorClear')"
              style="background:none;border:none;padding:0 2px 2px;margin-left:-4px;color:#999;cursor:pointer;font-size:13px;line-height:1;flex-shrink:0;align-self:flex-end;">
              x
            </button>
          </div>
        </template>
      </bo-form-area>
    </div>
    <!-- ===== ■.■.■. 판매업체 선택 모달 ========================================== -->
    <simple-vendor-pick-modal :show="showVendorModal" :vendors="vendors" :selected-id="form.vendorId" modal-name="vendor-pick" :on-callback="fnCallbackModal" />
    <div class="form-actions" v-if="active && cfDtlMode">
      <button class="btn btn-blue" @click="handleBtnAction('form-edit')">
        수정
      </button>
      <button class="btn btn-secondary" @click="handleBtnAction('form-close')">
        닫기
      </button>
    </div>
    <div class="form-actions" v-if="active && !cfDtlMode">
      <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleBtnAction('form-save')">
        저장
      </button>
      <button class="btn btn-secondary" @click="handleBtnAction('form-cancel')">
        취소
      </button>
    </div>
  </div>
  <!-- ===== □.□. 기본정보 ================================================== -->
  <!-- ===== ■.■. 이벤트 내용 (HTML 에디터) ===================================== -->
  <div class="dtl-pane" v-show="showTab('content')" style="margin:0;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
      📝 이벤트 내용
    </div>
    <div style="display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap;">
      <button v-for="n in 5" :key="Math.random()" class="btn btn-sm"
        :class="activeContentTab===n ? 'btn-primary' : 'btn-secondary'"
        @click="handleBtnAction('content-tab', n)">
        내용 {{ n }}
        <span v-if="form.authRequired && n >= 3" class="tab-count" style="background:#fde8ee;color:#e8587a;">
        인증
      </span>
    </button>
  </div>
  <div v-for="n in 5" :key="Math.random()" v-show="activeContentTab===n">
    <div v-if="form.authRequired && n >= 3" style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:8px 12px;background:#fff7e6;border-radius:6px;border:1px solid #ffd591;">
    <span class="badge badge-orange">
      인증 후 표시
    </span>
    <span style="font-size:12px;color:#888;">
      로그인 회원에게만 표시됩니다
    </span>
  </div>
  <div v-if="cfDtlMode" class="form-control" style="min-height:160px;line-height:1.6;" v-html="form['content'+n] || '<span style=color:#bbb>-</span>'">
  </div>
  <base-html-editor v-else :model-value="form['content'+n]" @update:model-value="v => form['content'+n] = v" height="220px" />
</div>
<div class="form-actions" v-if="active && cfDtlMode">
  <button class="btn btn-blue" @click="handleBtnAction('form-edit')">
    수정
  </button>
  <button class="btn btn-secondary" @click="handleBtnAction('form-close')">
    닫기
  </button>
</div>
<div class="form-actions" v-if="active && !cfDtlMode">
  <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleBtnAction('form-save')">
    저장
  </button>
  <button class="btn btn-secondary" @click="handleBtnAction('form-cancel')">
    취소
  </button>
</div>
</div>
<!-- ===== □.□. 이벤트 내용 (HTML 에디터) ===================================== -->
<!-- ===== ■.■. 대상 상품 ================================================= -->
<div class="dtl-pane" v-show="showTab('products')" style="margin:0;">
<div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
  🛍 대상 상품
  <span class="tab-count">
    {{ form.targetProducts.length }}
  </span>
</div>
<div style="display:flex;gap:8px;align-items:center;margin-bottom:14px;">
  <button v-if="!cfDtlMode" class="btn btn-secondary" @click="handleBtnAction('prodPickModal-open')">
    + 상품 추가
  </button>
  <span style="font-size:13px;color:#888;">
    {{ form.targetProducts.length }}개 선택됨
  </span>
</div>
<!-- ===== ■.■.■. 목록 영역 =============================================== -->
<bo-grid bare :columns="columns.productGrid" :rows="cfSelectedProducts" row-key="productId"
      empty-text="선택된 상품이 없습니다." @ref-click="({type,id}) => handleSelectAction('items-ref', {type, id})" row-actions>
  <template #row-actions="{ row }">
    <button class="btn btn-danger btn-xs" @click="handleSelectAction('items-rowDelete', row.productId)">
      제거
    </button>
  </template>
</bo-grid>
<div class="form-actions" v-if="active && cfDtlMode">
  <button class="btn btn-blue" @click="handleBtnAction('form-edit')">
    수정
  </button>
  <button class="btn btn-secondary" @click="handleBtnAction('form-close')">
    닫기
  </button>
</div>
<div class="form-actions" v-if="active && !cfDtlMode">
  <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleBtnAction('form-save')">
    저장
  </button>
  <button class="btn btn-secondary" @click="handleBtnAction('form-cancel')">
    취소
  </button>
</div>
</div>
<!-- ===== □.□. 대상 상품 ================================================= -->
<!-- ===== ■.■. 미리보기 ================================================== -->
<div class="dtl-pane" v-show="showTab('preview')" style="margin:0;">
<div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
  👁 미리보기
</div>
<div style="background:#f9f9f9;border-radius:10px;padding:20px;border:1px solid #e8e8e8;max-width:600px;">
  <!-- ===== ■.■.■.■. 배너 미리보기 =========================================== -->
  <div v-if="form.bannerImage" style="margin-bottom:20px;padding:12px;background:#fff;border-radius:6px;border:1px solid #e0e0e0;overflow:hidden;" v-html="form.bannerImage">
  </div>
  <div style="font-size:18px;font-weight:700;margin-bottom:12px;color:#1a1a2e;">
    {{ form.eventTitle || '이벤트 제목' }}
  </div>
  <div style="font-size:12px;color:#aaa;margin-bottom:16px;">
    {{ form.startDate }} ~ {{ form.endDate }}
  </div>
  <div style="font-size:13px;color:#444;margin-bottom:12px;" v-html="form.content1 || '<p style=color:#aaa>이벤트 내용 1이 여기에 표시됩니다.</p>'">
  </div>
  <div style="font-size:13px;color:#444;margin-bottom:12px;" v-html="form.content2">
  </div>
  <template v-if="!form.authRequired">
    <div style="font-size:13px;color:#444;margin-bottom:12px;" v-html="form.content3">
    </div>
    <div style="font-size:13px;color:#444;margin-bottom:12px;" v-html="form.content4">
    </div>
    <div style="font-size:13px;color:#444;margin-bottom:16px;" v-html="form.content5">
    </div>
  </template>
  <div v-else style="padding:12px;background:#f0f0f0;border-radius:6px;font-size:12px;color:#888;margin-bottom:16px;">
    🔒 내용 3~5는 로그인 후 확인 가능합니다.
  </div>
  <div v-if="cfSelectedProducts.length > 0" style="margin-top:20px;padding-top:20px;border-top:1px solid #e0e0e0;">
    <div style="font-size:14px;font-weight:700;color:#333;margin-bottom:12px;">
      🎯 대상 상품 ({{ cfSelectedProducts.length }}개)
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;">
      <div v-for="p in cfSelectedProducts" :key="p?.productId" style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;background:#fff;">
        <div style="height:100px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:32px;border-bottom:1px solid #e8e8e8;">
          📦
        </div>
        <div style="padding:8px;font-size:11px;">
          <div style="font-weight:600;color:#222;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            {{ p.prodNm }}
          </div>
          <div style="color:#e8587a;font-weight:700;">
            {{ (p.price||0).toLocaleString() }}원
          </div>
        </div>
      </div>
    </div>
  </div>
  <button class="btn btn-primary" @click="handleBtnAction('preview-eventConfirm')" style="margin-top:16px;">
    이벤트 확인
  </button>
</div>
</div>
<!-- ===== □.□. 미리보기 ================================================== -->
<!-- ===== □. 탭 컨텐츠 =================================================== -->
</div>
</bo-container>
<!-- ===== □. 상세 카드 (제목 + 탭바 + 탭컨텐츠를 한 영역으로) ===================== -->
<!-- ===== ■. 상품 선택 팝업 ================================================ -->
<simple-prod-pick-modal :show="showProdPopup" :prods="products" :selected-ids="form.targetProducts"
  title="대상 상품 선택" modal-name="prod-pick" :on-callback="fnCallbackModal" />
<!-- ===== □. 상품 선택 팝업 ================================================ -->
`
};
