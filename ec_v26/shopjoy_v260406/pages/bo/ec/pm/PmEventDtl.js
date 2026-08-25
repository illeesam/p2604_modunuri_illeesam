/* ShopJoy Admin - 이벤트관리 상세/등록 (Toast UI HTML Editor) */
window._ecEventDtlState = window._ecEventDtlState || { tab: 'info', tabMode: 'tab' };
window.PmEventDtl = {
  name: 'PmEventDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    active:       { type: Boolean, default: true }, // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-bo §18)
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const products = reactive([]);
    const vendors = reactive([]);
    const uiState = reactive({ loading: false, showProdPopup: false, showVendorModal: false, error: null, tab: window._ecEventDtlState.tab || 'info', tabMode2: window._ecEventDtlState.tabMode || 'tab', activeContentTab: 1, prodSearch: ''});
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
      // 폼 저장/삭제 — 탭별 분기 자리(현재는 배열에 있는 탭 전부 handleSave()/handleDelete() 공용.
      // 특정 탭만 다른 로직이 필요해지면 그 탭만 배열에서 빼고 별도 분기로 추가하면 됨)
      if (['banner-form-save', 'info-form-save', 'content-form-save', 'products-form-save'].includes(cmd)) {
        return handleSave();
      } else if (['banner-form-delete', 'info-form-delete', 'content-form-delete', 'products-form-delete'].includes(cmd)) {
        return handleDelete();
      // 폼 취소/닫기/수정전환 — 탭 무관 공통 동작(순수 네비게이션이라 탭별 분기 불필요)
      } else if (['banner-form-cancel', 'info-form-cancel', 'content-form-cancel', 'products-form-cancel'].includes(cmd)) {
        return props.navigate('__cancelEdit__');
      } else if (['banner-form-close', 'info-form-close', 'content-form-close', 'products-form-close'].includes(cmd)) {
        return props.navigate('__closeDtl__');
      } else if (['banner-form-edit', 'info-form-edit', 'content-form-edit', 'products-form-edit'].includes(cmd)) {
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
    const fnCallbackModal = (popCmd, param, result) => {
      console.log(' ■■ PmEventDtl : fnCallbackModal -> ', popCmd, param, result);
      if (popCmd === 'cmPopup-vendor-pick') {
        if (result == null) {
            uiState.showVendorModal = false;
            return;
        }
        return selectVendor(result.selId, result.selName);
      } else if (popCmd === 'cmPopup-prod-pick') {
        if (result == null) {
            uiState.showProdPopup = false;
            return;
        }
          return toggleProduct(result);
      } else {
        console.warn('[fnCallbackModal] unknown popCmd:', popCmd);
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
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['EVENT_STATUS_KR'], {compNm: 'PmEventDtl'});
      codes.event_statuses = codeStore.sgGetGrpCodes('EVENT_STATUS_KR');
    };

    /* 이벤트 onTabChange */

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* onTabChange — 탭 변경 */
    const onTabChange = (newTab) => {
      uiState.tab = newTab;
    };

    // ★ onMounted
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      if (props.active && cfIsNew.value) { _applyNewDefaults(); }
      // 마운트 시 상세 조회 — 행 클릭으로 key 변경 시 재마운트되므로 watch(reloadTrigger)만으론 최초 로드 누락됨
      await handleSearchDetail();
    };
    onMounted(initPage);
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleSearchDetail();
    });

    /* 대상 상품 팝업 */

    /* toggleProduct — 토글 */
    const toggleProduct = (pid) => {
      const idx = form.targetProducts.indexOf(pid);
      if (idx === -1) { form.targetProducts.push(pid); }
      else { form.targetProducts.splice(idx, 1); }
    };

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
      if (showToast) { showToast(msg, 'success'); }
    };

    /* _afterApiErr — 후 API 오류 */
    const _afterApiErr = (err) => {
      console.error('[handleSave]', err);
      const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
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

    /* handleDelete — 보기모드 [삭제] (2026-08-22 정책: 보기모드 표준 버튼 = [수정][삭제][닫기]) */
    const handleDelete = async () => {
      if (cfIsNew.value || !form.eventId) { return; }
      const ok = await showConfirm('삭제', `[${form.eventTitle}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      try {
        await boApiSvc.pmEvent.remove(form.eventId, '이벤트관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        props.navigate('pmEventMng', { reload: true });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    const activeContentTab = Vue.toRef(uiState, 'activeContentTab');
    const prodSearch = Vue.toRef(uiState, 'prodSearch');
    const showProdPopup = Vue.toRef(uiState, 'showProdPopup');
    const showVendorModal = Vue.toRef(uiState, 'showVendorModal');

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    /* fnShareUrl — 이 이벤트 상세를 가리키는 독립 새창 딥링크 URL 생성 */
    const fnShareUrl = () => {
      const qs = new URLSearchParams();
      qs.set('page', 'pmEventDtl');
      qs.set('id', form.eventId);
      qs.set('embed', '1');
      return `${window.location.origin}${window.location.pathname}?${qs.toString()}`;
    };
    const handleShareKakao = () => {
      try {
        window.coExtSdk.shareKakao({
          title: `이벤트 ${form.eventId} - ShopJoy BO`,
          description: form.eventTitle || '',
          imageUrl: window.location.origin + '/assets/img/shopjoy-share-og.png',
          url: fnShareUrl(),
        });
      } catch (e) {
        showToast(e.message || '카카오톡 공유를 열 수 없습니다.', 'error', 0);
      }
    };
    const handleCopyLink = async () => {
      try {
        await navigator.clipboard.writeText(fnShareUrl());
        showToast('링크가 복사되었습니다.', 'success');
      } catch (e) {
        showToast(e.message || '링크 복사에 실패했습니다.', 'error', 0);
      }
    };
    const pdfAreaRef = ref(null);
    const pdfExporting = ref(false);
    const handleExportPdf = async () => {
      pdfExporting.value = true;
      try {
        const filename = coUtil.cofBuildExportFilename(`이벤트상세_${form.eventId}.pdf`);
        await window.boUtil.bofExportPdf(pdfAreaRef.value, filename, showToast);
      } finally {
        pdfExporting.value = false;
      }
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    /* BoGrid(bare) 컬럼 정의 — 대상 상품 */
    const columns = {};
    columns.productGrid = [
      { key: 'productId', label: 'ID' },
      { key: 'prodNm',    label: '상품명', refLink: 'product', refKey: 'productId' },
      { key: 'category',  label: '카테고리' },
      { key: 'price',     label: '가격', fmt: v => coUtil.cofWon(v) },
      { key: 'stock',     label: '재고', fmt: v => v + '개' },
      { key: 'status',    label: '상태' },
      { type: 'actions', actions: [
        { label: '제거', cls: 'btn btn-danger btn-xs', onClick: (row) => handleSelectAction('items-rowDelete', row.productId) },
      ] },
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
      { key: 'vendorId',    label: '판매업체', type: 'pick', placeholder: '업체 선택',
        display: (f) => { const v = vendors.find(x => x.vendorId === f.vendorId); return v ? v.vendorNm : ''; },
        onOpen: () => handleBtnAction('vendorModal-open'),
        onClear: () => { form.chargeStaff = ''; } },
      { key: 'chargeStaff', label: '판매담당자', type: 'text', placeholder: '담당자명 입력' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      coUtil, // 템플릿 cofAnd 접근용
      columns,
      vendors, products, form, errors, tabs,                // 상태 / 데이터
      handleShareKakao, handleCopyLink,                                    // 카카오톡 공유 / 링크 복사 (상세보기)
      pdfAreaRef, pdfExporting, handleExportPdf,                           // PDF 다운로드 (항상 노출)
      handleBtnAction, handleSelectAction, fnCallbackModal,                                          // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfSaveDisabled, cfDtlMode, cfSelectedProducts, cfVisibilityOptions, cfSelectedVendorNm,                          // computed
      tab, tabMode2, activeContentTab, showProdPopup, showVendorModal,            // toRef
      showTab,                           // 헬퍼
    };
  },
  template: /* html */`
<div ref="pdfAreaRef">
<!-- ===== ■. 상세 카드 (제목 + 탭바 + 탭컨텐츠를 한 영역으로) ===================== -->
<bo-container :title="!active ? '이벤트 상세' : (cfIsNew ? '이벤트 등록' : (cfDtlMode ? '이벤트 상세' : '이벤트 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : form.eventId)">
  <template #toolbar-actions>
    <button v-if="active ? (cfDtlMode ? !cfIsNew : false) : false" class="btn btn_link" title="링크 공유(URL만)" @click="handleCopyLink">🔗</button>
    <button v-if="active ? (cfDtlMode ? !cfIsNew : false) : false" class="btn btn_kakao" title="카카오톡 공유" @click="handleShareKakao">💬</button>
    <button class="btn btn_pdf" title="PDF 다운로드" :disabled="pdfExporting" @click="handleExportPdf">
      <span v-if="pdfExporting">⏳</span>
      <svg v-else width="18" height="20" viewBox="0 0 32 36" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 2 H20 L28 10 V34 H4 Z" fill="#fff" stroke="#c2410c" stroke-width="1.5"/>
        <path d="M20 2 V10 H28 Z" fill="#f3d4c0"/>
        <rect x="2" y="20" width="28" height="12" rx="2" fill="#e2372c"/>
        <text x="16" y="29" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="#fff" text-anchor="middle">PDF</text>
      </svg>
    </button>
  </template>
  <!-- ===== ■.■. 탭바 ==================================================== -->
  <bo-tab-bar :tabs="tabs" :tab="tab" :tab-mode="tabMode2"
    @tab-select="id => handleBtnAction('tab-select', id)"
    @mode-select="m => handleBtnAction('tab-mode', m)" />
  <!-- ===== □.■. 탭바 ==================================================== -->
  <!-- ===== ■. 탭 컨텐츠 =================================================== -->
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">
    <!-- ===== ■.■. 배너이미지 ================================================= -->
    <div class="dtl-pane" v-show="showTab('banner')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🎨 배너이미지</div>
      <div style="margin-bottom:12px;">
        <div v-if="!cfDtlMode" style="font-size:12px;color:#888;margin-bottom:6px;">💡 팁: 이미지 삽입 후 크기 조절 및 배치를 자유롭게 설정할 수 있습니다.</div>
        <div v-if="cfDtlMode" class="readonly-field-plain" style="min-height:300px;line-height:1.6;overflow:auto;" v-html="form.bannerImage || '-'"></div>
        <base-html-editor v-else v-model="form.bannerImage" height="320px" />
      </div>
      <bo-form-actions v-if="active" :readonly="cfDtlMode" :is-new="cfIsNew"
        :save-disabled="cfSaveDisabled" :save-title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''"
        :edit-click="() => handleBtnAction('banner-form-edit')"
        :save-click="() => handleBtnAction('banner-form-save')"
        :delete-click="() => handleBtnAction('banner-form-delete')"
        :cancel-click="() => handleBtnAction('banner-form-cancel')"
        :close-click="() => handleBtnAction('banner-form-close')" />
    </div>
    <!-- ===== □.□. 배너이미지 ================================================= -->
    <!-- ===== ■.■. 기본정보 ================================================== -->
    <div class="dtl-pane" v-show="showTab('info')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📋 기본정보</div>
      <!-- ===== ■.■.■. 이벤트 제목/기간/상태 (BoFormArea 자동 렌더) ===================== -->
      <!-- ===== ■.■.■. 폼 영역 ================================================ -->
      <bo-form-area plain-readonly :columns="columns.infoForm" :form="form" :errors="errors"
        :readonly="cfDtlMode" :cols="3" compact :show-actions="false" />
      <div v-if="form.authRequired" style="padding:10px 14px;background:#fff7e6;border-radius:6px;border:1px solid #ffd591;font-size:12px;color:#d46b08;">
        ⚠️ 인증 필요 설정 시, 이벤트 내용 3~5는 로그인 회원에게만 표시됩니다.
      </div>
      <div style="margin-top:14px;">
        <div style="font-size:12px;font-weight:700;color:#888;margin-bottom:8px;">🔒 공개 대상 (하나라도 해당하면 노출)</div>
        <bo-multi-check-select v-model="form.visibilityTargets" :options="cfVisibilityOptions"
          separator="^" wrap empty-value="^NONE^" placeholder="전체 공개" all-label="전체 공개"
          :disabled="cfDtlMode" min-width="320px" />
      </div>
      <!-- ===== ■.■.■. 판매업체/판매담당자 (BoFormArea 자동 렌더) ======================= -->
      <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e8e8e8;">
        <!-- ===== ■.■.■.■. 폼 영역 ============================================== -->
        <bo-form-area plain-readonly :columns="columns.vendorForm" :form="form" :errors="errors"
          :readonly="cfDtlMode" :cols="3" compact :show-actions="false" />
      </div>
      <!-- ===== ■.■.■. 판매업체 선택 모달 ========================================== -->
      <bo-cm-popup-modal popup-cmd="cmPopup-vendor-pick" popup-code="vendor" :show="showVendorModal" :on-callback="fnCallbackModal" />
      <bo-form-actions v-if="active" :readonly="cfDtlMode" :is-new="cfIsNew"
        :save-disabled="cfSaveDisabled" :save-title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''"
        :edit-click="() => handleBtnAction('info-form-edit')"
        :save-click="() => handleBtnAction('info-form-save')"
        :delete-click="() => handleBtnAction('info-form-delete')"
        :cancel-click="() => handleBtnAction('info-form-cancel')"
        :close-click="() => handleBtnAction('info-form-close')" />
    </div>
    <!-- ===== □.□. 기본정보 ================================================== -->
    <!-- ===== ■.■. 이벤트 내용 (HTML 에디터) ===================================== -->
    <div class="dtl-pane" v-show="showTab('content')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📝 이벤트 내용</div>
      <div style="display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap;">
        <button v-for="n in 5" :key="Math.random()" class="btn btn-sm"
          :class="activeContentTab===n ? 'btn-primary' : 'btn-secondary'"
          @click="handleBtnAction('content-tab', n)">
          내용 {{ n }}
          <span v-if="form.authRequired ? (n >= 3) : false" class="tab-count" style="background:#fde8ee;color:#e8587a;">
            인증
          </span>
        </button>
      </div>
      <div v-for="n in 5" :key="Math.random()" v-show="activeContentTab===n">
        <div v-if="form.authRequired ? (n >= 3) : false" style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:8px 12px;background:#fff7e6;border-radius:6px;border:1px solid #ffd591;">
          <span class="badge badge-orange">인증 후 표시</span>
          <span style="font-size:12px;color:#888;">로그인 회원에게만 표시됩니다</span>
        </div>
        <div v-if="cfDtlMode" class="readonly-field-plain" style="min-height:160px;line-height:1.6;" v-html="form['content'+n] || '-'"></div>
        <base-html-editor v-else :model-value="form['content'+n]" @update:model-value="v => form['content'+n] = v" height="220px" />
      </div>
      <bo-form-actions v-if="active" :readonly="cfDtlMode" :is-new="cfIsNew"
        :save-disabled="cfSaveDisabled" :save-title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''"
        :edit-click="() => handleBtnAction('content-form-edit')"
        :save-click="() => handleBtnAction('content-form-save')"
        :delete-click="() => handleBtnAction('content-form-delete')"
        :cancel-click="() => handleBtnAction('content-form-cancel')"
        :close-click="() => handleBtnAction('content-form-close')" />
    </div>
    <!-- ===== □.□. 이벤트 내용 (HTML 에디터) ===================================== -->
    <!-- ===== ■.■. 대상 상품 ================================================= -->
    <div class="dtl-pane" v-show="showTab('products')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        🛍 대상 상품
        <span class="tab-count">{{ form.targetProducts.length }}</span>
      </div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:14px;">
        <button v-if="!cfDtlMode" class="btn btn-secondary" @click="handleBtnAction('prodPickModal-open')">+ 상품 추가</button>
        <span style="font-size:13px;color:#888;">{{ form.targetProducts.length }}개 선택됨</span>
      </div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="columns.productGrid" :rows="cfSelectedProducts" row-key="productId"
        empty-text="선택된 상품이 없습니다." @ref-click="({type,id}) => handleSelectAction('items-ref', {type, id})" />
      <bo-form-actions v-if="active" :readonly="cfDtlMode" :is-new="cfIsNew"
        :save-disabled="cfSaveDisabled" :save-title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''"
        :edit-click="() => handleBtnAction('products-form-edit')"
        :save-click="() => handleBtnAction('products-form-save')"
        :delete-click="() => handleBtnAction('products-form-delete')"
        :cancel-click="() => handleBtnAction('products-form-cancel')"
        :close-click="() => handleBtnAction('products-form-close')" />
    </div>
    <!-- ===== □.□. 대상 상품 ================================================= -->
    <!-- ===== ■.■. 미리보기 ================================================== -->
    <div class="dtl-pane" v-show="showTab('preview')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">👁 미리보기</div>
      <div style="background:#f9f9f9;border-radius:10px;padding:20px;border:1px solid #e8e8e8;max-width:600px;">
        <!-- ===== ■.■.■.■. 배너 미리보기 =========================================== -->
        <div v-if="form.bannerImage" style="margin-bottom:20px;padding:12px;background:#fff;border-radius:6px;border:1px solid #e0e0e0;overflow:hidden;" v-html="form.bannerImage"></div>
        <div style="font-size:18px;font-weight:700;margin-bottom:12px;color:#1a1a2e;">{{ form.eventTitle || '이벤트 제목' }}</div>
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
              <div style="height:100px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:32px;border-bottom:1px solid #e8e8e8;">
                📦
              </div>
              <div style="padding:8px;font-size:11px;">
                <div style="font-weight:600;color:#222;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                  {{ p.prodNm }}
                </div>
                <div style="color:#e8587a;font-weight:700;">{{ (p.price||0).toLocaleString() }}원</div>
              </div>
            </div>
          </div>
        </div>
        <button class="btn btn-primary" @click="handleBtnAction('preview-eventConfirm')" style="margin-top:16px;">이벤트 확인</button>
      </div>
    </div>
    <!-- ===== □.□. 미리보기 ================================================== -->
    <!-- ===== □. 탭 컨텐츠 =================================================== -->
  </div>
</bo-container>
</div>
<!-- ===== □. 상세 카드 (제목 + 탭바 + 탭컨텐츠를 한 영역으로) ===================== -->
<!-- ===== ■. 상품 선택 팝업 ================================================ -->
<bo-cm-popup-modal popup-cmd="cmPopup-prod-pick" popup-code="prod" result-type="id" :show="showProdPopup" :selected-ids="form.targetProducts" title="대상 상품 선택" :on-callback="fnCallbackModal" />
<!-- ===== □. 상품 선택 팝업 ================================================ -->
`
};
