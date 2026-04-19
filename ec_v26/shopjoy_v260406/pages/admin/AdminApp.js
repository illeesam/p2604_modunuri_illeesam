/* ShopJoy Admin - 메인 앱 (Top + Left Nav + 탭 라우팅 + 로그인) */
(function () {
  const { createApp, ref, reactive, computed, watch, onMounted, onBeforeUnmount } = Vue;

  /* ── 메뉴 구조 ── */
  /* ADMIN_SITE_NO 기준으로 상단 메뉴 필터링
     - 02: 고객센터 제외
     - 03: 프로모션 제외 */
  const _ADMIN_NO = window.ADMIN_SITE_NO || '01';
  const _ALL_TOP_MENUS = [
    { id: 'member',    label: '회원관리' },
    { id: 'product',   label: '상품관리' },
    { id: 'order',     label: '주문관리' },
    { id: 'promotion', label: '프로모션' },
    { id: 'display',   label: '전시관리' },
    { id: 'customer',   label: '고객센터' },
    { id: 'settle',     label: '정산' },
    { id: 'system',     label: '시스템' },
  ];
  const TOP_MENUS = _ALL_TOP_MENUS.filter(m => {
    if (_ADMIN_NO === '02' && m.id === 'customer')  return false;
    if (_ADMIN_NO === '03' && m.id === 'promotion') return false;
    return true;
  });

  const LEFT_MENUS = {
    member:    [
      { group: '회원' },
      { id: 'mbMemberMng',    label: '회원관리' },
      { group: '등급·그룹' },
      { id: 'mbMemGradeMng',  label: '회원등급관리' },
      { id: 'mbMemGroupMng',  label: '회원그룹관리' },
    ],
    product:   [
      { group: '카테고리' },
      { id: 'pdCategoryMng',     label: '카테고리관리' },
      { id: 'pdCategoryProdMng', label: '카테고리상품관리' },
      { group: '상품' },
      { id: 'pdProdMng',         label: '상품관리' },
      { id: 'pdBundleMng',       label: '묶음상품관리' },
      { id: 'pdSetMng',          label: '세트상품관리' },
      { group: '상품템플릿' },
      { id: 'pdDlivTmpltMng',    label: '배송템플릿관리' },
      { group: '상품정보관리' },
      { id: 'pdReviewMng',      label: '상품리뷰관리' },
      { id: 'pdQnaMng',         label: '상품Q&A관리' },
      { id: 'pdRestockNotiMng', label: '재입고알림' },
      { id: 'pdTagMng',         label: '태그관리' },
    ],
    order:     [{ id: 'odOrderMng',    label: '주문관리' }, { id: 'odClaimMng', label: '클레임관리' }, { id: 'odDlivMng', label: '배송관리' }],
    promotion: [
      { group: '판촉' },
      { id: 'pmCouponMng',  label: '쿠폰관리' },
      { id: 'pmCacheMng',   label: '캐쉬관리' },
      { id: 'pmDiscntMng',  label: '할인관리' },
      { id: 'pmSaveMng',    label: '마일리지관리' },
      { id: 'pmGiftMng',    label: '사은품관리' },
      { id: 'pmVoucherMng', label: '상품권관리' },
      { group: '이벤트' },
      { id: 'pmEventMng',   label: '이벤트관리' },
      { id: 'pmPlanMng',    label: '기획전관리' },
    ],
    display:   [
      { group: '미리보기' },
      { id: 'dpDispUiPreview',        label: '전시UI미리보기' },
      { id: 'dpDispAreaPreview',      label: '전시영역미리보기' },
      { id: 'dpDispPanelPreview',     label: '전시패널미리보기' },
      { id: 'dpDispWidgetPreview',    label: '전시위젯미리보기' },
      { id: 'dpDispWidgetLibPreview', label: '전시위젯Lib미리보기' },
      { group: '전시관리' },
      { id: 'dpDispUiMng',            label: '전시UI관리' },
      { id: 'dpDispAreaMng',          label: '전시영역관리' },
      { id: 'dpDispPanelMng',         label: '전시패널관리' },
      { group: '전시위젯관리' },
      { id: 'dpDispWidgetMng',        label: '전시위젯관리' },
      { group: '전시리소스' },
      { id: 'dpDispWidgetLibMng',     label: '전시위젯Lib' },
      { group: '개발지원' },
      { id: 'dpDispUiSimul',          label: '전시UI시뮬레이션' },
      { id: 'dpDispRelationMng',      label: '전시관계도' },
    ],
    customer:  [
      { group: '고객' },
      { id: 'mbCustInfoMng', label: '고객종합정보' },
      { group: '고객센터' },
      { id: 'syContactMng',  label: '문의관리' },
      { id: 'cmChattMng',    label: '채팅관리' },
      { group: '커뮤니티' },
      { id: 'cmBltnMng',     label: '게시판관리' },
    ],
    settle:    [
      { group: '기준정보' },
      { id: 'stConfigMng',              label: '정산기준관리' },
      { group: '수집원장' },
      { id: 'stRawMng',                 label: '정산수집원장' },
      { group: '정산작업' },
      { id: 'stSettleAdjMng',           label: '정산조정' },
      { id: 'stSettleEtcAdjMng',        label: '정산기타조정' },
      { id: 'stSettleCloseMng',         label: '정산마감' },
      { id: 'stSettlePayMng',           label: '정산지급관리' },
      { group: '정산현황' },
      { id: 'stStatusMng',              label: '정산현황' },
      { group: '대사관리' },
      { id: 'stReconOrderMng',          label: '주문-정산 대사' },
      { id: 'stReconPayMng',            label: '결제-정산 대사' },
      { id: 'stReconClaimMng',          label: '클레임-정산 대사' },
      { id: 'stReconVendorMng',         label: '업체-정산 대사' },
      { group: 'ERP 연동' },
      { id: 'stErpGenMng',              label: 'ERP 전표생성' },
      { id: 'stErpViewMng',             label: 'ERP 전표조회' },
      { id: 'stErpReconMng',            label: 'ERP 전표대사' },
    ],
    system:    [
      { group: '기준정보' },
      { id: 'sySiteMng',     label: '사이트관리' },
      { id: 'syCodeMng',     label: '공통코드관리' },
      { id: 'syBrandMng',    label: '브랜드관리' },
      { id: 'syBizMng',      label: '업체' },
      { id: 'syBizUserMng',  label: '업체사용자' },
      { group: '공통업무' },
      { id: 'cmNoticeMng',   label: '공지사항관리' },
      { id: 'syBbmMng',      label: '게시판관리' },
      { id: 'syBbsMng',      label: '게시글관리' },
      { group: '시스템' },
      { id: 'syAttachMng',   label: '첨부관리' },
      { id: 'syTemplateMng', label: '템플릿관리' },
      { id: 'syBatchMng',    label: '배치스케즐관리' },
      { id: 'syAlarmMng',    label: '알림관리' },
      { id: 'syPropMng',     label: '프로퍼티관리' },
      { id: 'syPathMng',     label: '표시경로' },
      { id: 'syI18nMng',     label: '다국어관리' },
      { group: '조직' },
      { id: 'syUserMng',     label: '사용자관리' },
      { id: 'syDeptMng',     label: '부서관리' },
      { group: '메뉴' },
      { id: 'syMenuMng',     label: '메뉴관리' },
      { id: 'syRoleMng',     label: '역할관리' },
      { group: '이력조회' },
      { id: 'syMemberLoginHist', label: '회원로그인이력' },
      { id: 'syUserLoginHist',   label: '사용자로그인이력' },
      { group: '개발도구' },
      { id: 'syPostman',         label: 'postman' },
    ],
  };

  /* 페이지 → 상위메뉴 매핑 */
  const PAGE_TO_TOP = {};
  const PAGE_LABELS  = {};
  Object.entries(LEFT_MENUS).forEach(([top, items]) => {
    items.filter(item => item.id).forEach(item => {
      PAGE_TO_TOP[item.id] = top;
      PAGE_TO_TOP[item.id.replace('Mng', 'Dtl')] = top;
      PAGE_LABELS[item.id] = item.label;
      PAGE_LABELS[item.id.replace('Mng', 'Dtl')] = item.label + ' 상세';
    });
  });

  /* 대시보드는 별도 페이지 */
  PAGE_LABELS['dashboard'] = '대시보드';

  const ALL_PAGES = [
    'dashboard',
    ...Object.values(LEFT_MENUS).flat().filter(p => p.id).map(p => p.id),
    ...Object.values(LEFT_MENUS).flat().filter(p => p.id).map(p => p.id.replace('Mng', 'Dtl')),
  ];

  /* Mng 페이지의 탭 ID 반환 (Dtl → 부모 Mng) */
  const toTabId = pg => pg.endsWith('Dtl') ? pg.replace('Dtl', 'Mng') : pg;

  /* 인증방식 옵션 */
  const AUTH_METHODS = ['메인', 'SMS', 'OTP', 'Authenticator'];

  createApp({
    setup() {
      /* ── 페이지 & 라우팅 ── */
      const page   = ref('dashboard');
      const dashboardComp = computed(() => 'DashboardAdminEc' + (window.ADMIN_SITE_NO || '01'));
      const errorMessage = ref('');
      /* API 에러 → 오류 페이지 전환 (adminAxios 에서 window.dispatchEvent('api-error')) */
      window.addEventListener('api-error', (ev) => {
        const d = ev.detail || {};
        const st = d.status;
        if (st === 401) { errorMessage.value = d.message || ''; page.value = 'error401'; }
        else if (st >= 500 || st === 0) { errorMessage.value = d.message || ''; page.value = 'error500'; }
      });
      const editId = ref(null);

      /* ── 탭 관리 ── */
      const openTabs = reactive([{ id: 'dashboard', label: '대시보드' }]);
      const activeTabId = computed(() => toTabId(page.value));
      const refreshKeys = reactive({});  // pageId → 재마운트 카운터

      /* ── 탭 고정 (keep-alive 시뮬레이션) ── */
      const keptTabIds = reactive(new Set());
      const toggleKeep = (tabId) => {
        if (keptTabIds.has(tabId)) keptTabIds.delete(tabId);
        else keptTabIds.add(tabId);
      };
      const PAGE_COMP_MAP = {
        'dashboard':'dashboard-admin-ec'+(window.ADMIN_SITE_NO||'01'), 'mbMemberMng':'mb-member-mng', 'mbMemberDtl':'mb-member-dtl',
        'mbMemGradeMng':'mb-mem-grade-mng', 'mbMemGroupMng':'mb-mem-group-mng',
        'pdProdMng':'pd-prod-mng', 'pdProdDtl':'pd-prod-dtl',
        'pdDlivTmpltMng':'pd-dliv-tmplt-mng', 'pdBundleMng':'pd-bundle-mng', 'pdSetMng':'pd-set-mng',
        'pdReviewMng':'pd-review-mng', 'pdQnaMng':'pd-qna-mng',
        'pdRestockNotiMng':'pd-restock-noti-mng', 'pdTagMng':'pd-tag-mng',
        'odOrderMng':'od-order-mng', 'odOrderDtl':'od-order-dtl',
        'odClaimMng':'od-claim-mng', 'odClaimDtl':'od-claim-dtl',
        'odDlivMng':'od-dliv-mng', 'odDlivDtl':'od-dliv-dtl',
        'pmCouponMng':'pm-coupon-mng', 'pmCouponDtl':'pm-coupon-dtl',
        'pmCacheMng':'pm-cache-mng', 'pmCacheDtl':'pm-cache-dtl',
        'dpDispPanelMng':'dp-disp-panel-mng', 'dpDispAreaPreview':'dp-disp-area-preview', 'dpDispAreaMng':'dp-disp-area-mng',
        'dpDispUiPreview':'dp-disp-ui-preview', 'dpDispUiSimul':'dp-disp-ui-simul',
        'dpDispPanelPreview':'dp-disp-panel-preview', 'dpDispWidgetPreview':'dp-disp-widget-preview',
        'dpDispAreaDtl':'dp-disp-area-dtl',
        'dpDispUiMng':'dp-disp-ui-mng', 'dpDispUiDtl':'dp-disp-ui-dtl',
        'dpDispWidgetMng':'dp-disp-widget-mng', 'dpDispWidgetDtl':'dp-disp-widget-dtl',
        'dpDispRelationMng':'dp-disp-relation-mng',
        'dpDispPanelDtl':'dp-disp-panel-dtl',
        'dpDispWidgetLibMng':'dp-disp-widget-lib-mng', 'dpDispWidgetLibDtl':'dp-disp-widget-lib-dtl',
        'dpDispWidgetLibPreview':'dp-disp-widget-lib-preview',
        'stConfigMng':'st-config-mng', 'stRawMng':'st-raw-mng',
        'stSettleAdjMng':'st-settle-adj-mng', 'stSettleEtcAdjMng':'st-settle-etc-adj-mng',
        'stSettleCloseMng':'st-settle-close-mng', 'stSettlePayMng':'st-settle-pay-mng',
        'stStatusMng':'st-status-mng',
        'stReconOrderMng':'st-recon-order-mng', 'stReconPayMng':'st-recon-pay-mng',
        'stReconClaimMng':'st-recon-claim-mng', 'stReconVendorMng':'st-recon-vendor-mng',
        'stErpGenMng':'st-erp-gen-mng', 'stErpViewMng':'st-erp-view-mng', 'stErpReconMng':'st-erp-recon-mng',
        'pmEventMng':'pm-event-mng', 'pmEventDtl':'pm-event-dtl',
        'pmPlanMng':'pm-plan-mng', 'pmPlanDtl':'pm-plan-dtl',
        'pmDiscntMng':'pm-discnt-mng', 'pmSaveMng':'pm-save-mng', 'pmGiftMng':'pm-gift-mng',
        'pmVoucherMng':'pm-voucher-mng', 'pmVoucherDtl':'pm-voucher-dtl',
        'mbCustInfoMng':'mb-cust-info-mng',
        'syContactMng':'sy-contact-mng', 'syContactDtl':'sy-contact-dtl',
        'cmChattMng':'cm-chatt-mng', 'cmChattDtl':'cm-chatt-dtl',
        'sySiteMng':'sy-site-mng', 'sySiteDtl':'sy-site-dtl',
        'syCodeMng':'sy-code-mng', 'syCodeDtl':'sy-code-dtl',
        'syBrandMng':'sy-brand-mng', 'syAttachMng':'sy-attach-mng',
        'syTemplateMng':'sy-template-mng', 'syTemplateDtl':'sy-template-dtl',
        'syVendorMng':'sy-vendor-mng', 'syVendorDtl':'sy-vendor-dtl', 'syBizMng':'sy-biz-mng', 'syBizUserMng':'sy-biz-user-mng',
        'pdCategoryMng':'pd-category-mng', 'pdCategoryDtl':'pd-category-dtl', 'pdCategoryProdMng':'pd-category-prod-mng',
        'syUserMng':'sy-user-mng', 'syUserDtl':'sy-user-dtl',
        'syBatchMng':'sy-batch-mng', 'syBatchDtl':'sy-batch-dtl',
        'syDeptMng':'sy-dept-mng', 'syMenuMng':'sy-menu-mng', 'syRoleMng':'sy-role-mng',
        'cmNoticeMng':'cm-notice-mng', 'syAlarmMng':'sy-alarm-mng', 'syPropMng':'sy-prop-mng', 'syPathMng':'sy-path-mng', 'syI18nMng':'sy-i18n-mng',
        'syBbmMng':'sy-bbm-mng', 'syBbsMng':'sy-bbs-mng',
        'cmBltnMng':'cm-bltn-mng',
        'syMemberLoginHist':'sy-member-login-hist',
        'syUserLoginHist':'sy-user-login-hist',
        'syPostman':'sy-postman',
      };

      const addTab = (mngId) => {
        if (!openTabs.find(t => t.id === mngId)) {
          openTabs.push({ id: mngId, label: PAGE_LABELS[mngId] || mngId });
        }
      };

      const closeTab = (tabId, evt) => {
        if (evt) evt.stopPropagation();
        const idx = openTabs.findIndex(t => t.id === tabId);
        if (idx === -1) return;
        keptTabIds.delete(tabId);
        openTabs.splice(idx, 1);
        if (activeTabId.value === tabId) {
          const next = openTabs[Math.min(idx, openTabs.length - 1)];
          if (next) navigate(next.id);
          else { page.value = 'dashboard'; editId.value = null; }
        }
      };

      /* ── 탭 컨텍스트 메뉴 ── */
      const ctxMenu = reactive({ show: false, x: 0, y: 0, tabId: null });
      const showCtxMenu = (evt, tabId) => {
        evt.preventDefault();
        ctxMenu.show = true; ctxMenu.x = evt.clientX; ctxMenu.y = evt.clientY; ctxMenu.tabId = tabId;
      };
      const closeCtxMenu = () => { ctxMenu.show = false; };

      const ctxClose = () => { closeTab(ctxMenu.tabId); closeCtxMenu(); };
      const ctxCloseLeft = () => {
        const idx = openTabs.findIndex(t => t.id === ctxMenu.tabId);
        if (idx > 0) {
          openTabs.splice(0, idx);
          if (!openTabs.find(t => t.id === activeTabId.value)) navigate(openTabs[0].id);
        }
        closeCtxMenu();
      };
      const ctxCloseRight = () => {
        const idx = openTabs.findIndex(t => t.id === ctxMenu.tabId);
        if (idx < openTabs.length - 1) {
          openTabs.splice(idx + 1);
          if (!openTabs.find(t => t.id === activeTabId.value)) navigate(openTabs[idx].id);
        }
        closeCtxMenu();
      };
      const ctxCloseAll = () => {
        const tab = openTabs.find(t => t.id === ctxMenu.tabId);
        keptTabIds.clear();
        openTabs.splice(0);
        if (tab) { openTabs.push(tab); navigate(tab.id); }
        closeCtxMenu();
      };
      const ctxCloseOthers = () => {
        const tab = openTabs.find(t => t.id === ctxMenu.tabId);
        openTabs.forEach(t => { if (t.id !== ctxMenu.tabId) keptTabIds.delete(t.id); });
        openTabs.splice(0);
        if (tab) { openTabs.push(tab); navigate(tab.id); }
        closeCtxMenu();
      };
      const ctxNewWindow = () => {
        window.open(`${location.pathname}${location.search}#page=${ctxMenu.tabId}`, '_blank');
        closeCtxMenu();
      };
      const ctxRefresh = () => {
        const id = ctxMenu.tabId;
        closeCtxMenu();
        if (keptTabIds.has(id)) {
          keptTabIds.delete(id);
          Vue.nextTick(() => keptTabIds.add(id));
        } else {
          refreshKeys[id] = (refreshKeys[id] || 0) + 1;
          if (page.value !== id) navigate(id);
        }
      };

      /* ── 새창 열기 ── */
      const openNewWindow = (pgId) => {
        window.open(`${location.pathname}${location.search}#page=${pgId}`, '_blank');
      };

      /* ── 열린 화면 목록 (가나다순) ── */
      const openTabsWithGroup = computed(() =>
        [...openTabs].map(tab => {
          const topId = PAGE_TO_TOP[tab.id];
          const topLabel = TOP_MENUS.find(t => t.id === topId)?.label || (tab.id === 'dashboard' ? '홈' : '');
          return { ...tab, topLabel };
        }).sort((a, b) => a.label.localeCompare(b.label, 'ko'))
      );

      /* ── 메뉴 상태 ── */
      const activeTop    = ref('member');
      const leftMenuOpen = ref(true);

      const setTopMenu = (topId) => {
        activeTop.value = topId;
        leftMenuOpen.value = true;
        const first = LEFT_MENUS[topId]?.find(p => p.id);
        if (first) navigate(first.id);
      };

      /* ── Hash routing ── */
      const readHash = () => {
        const raw = String(window.location.hash || '').replace(/^#/, '');
        const p   = new URLSearchParams(raw);
        const pg  = p.get('page');
        if (pg && ALL_PAGES.includes(pg)) {
          page.value = pg;
          if (PAGE_TO_TOP[pg]) activeTop.value = PAGE_TO_TOP[pg];
          addTab(toTabId(pg));
        }
        const id = p.get('id');
        editId.value = id !== null ? (isNaN(id) ? id : Number(id)) : null;
      };
      readHash();

      const navigate = (pg, opts = {}) => {
        page.value      = pg;
        editId.value    = opts.id ?? null;
        if (PAGE_TO_TOP[pg]) activeTop.value = PAGE_TO_TOP[pg];
        addTab(toTabId(pg));
        // 즐겨찾기 keep 설정이 있으면 자동으로 탭 고정
        const tabId = toTabId(pg);
        if (favKeepSet.has(tabId)) keptTabIds.add(tabId);
        const p2 = new URLSearchParams();
        p2.set('page', pg);
        if (opts.id != null) p2.set('id', opts.id);
        window.location.hash = p2.toString();
        window.scrollTo(0, 0);
      };

      window.addEventListener('hashchange', readHash);
      onBeforeUnmount(() => window.removeEventListener('hashchange', readHash));

      /* ── Toast (누적 스택) ── */
      const toasts  = reactive([]);
      let _toastId  = 0;
      const TOAST_DURATION = 3500;
      const showToast = (msg, type = 'success', duration = TOAST_DURATION) => {
        const id = ++_toastId;
        toasts.push({ id, msg, type, persistent: duration === 0 });
        if (duration !== 0) {
          setTimeout(() => {
            const idx = toasts.findIndex(t => t.id === id);
            if (idx !== -1) toasts.splice(idx, 1);
          }, duration);
        }
      };
      /* 전역 노출 (BaseModal 등에서 props 없이 호출) */
      window.adminToast = showToast;
      const closeToast = (id) => {
        const idx = toasts.findIndex(t => t.id === id);
        if (idx !== -1) toasts.splice(idx, 1);
      };

      /* ── API 응답 패널 ── */
      const apiResPanel = reactive({ show: false, res: null });
      const setApiRes = (res) => { apiResPanel.res = res; apiResPanel.show = true; };
      const closeApiResPanel = () => { apiResPanel.show = false; };

      /* ── Confirm ── */
      const confirmState = reactive({ show: false, title: '', msg: '', details: null, btnOk: '확인', btnCancel: '취소', resolve: null });
      const showConfirm  = (title, msg, opts = {}) =>
        new Promise(r => Object.assign(confirmState, {
          show: true, title, msg,
          details:   opts.details   || null,
          btnOk:     opts.btnOk     || '확인',
          btnCancel: opts.btnCancel || '취소',
          resolve: r,
        }));
      /* 전역 노출 (BaseModal 등에서 props 없이 호출 가능) */
      window.adminConfirm = showConfirm;
      const closeConfirm = v => { confirmState.show = false; confirmState.resolve?.(v); };

      /* ── 참조 모달 ── */
      const refModal = reactive({ show: false, type: '', id: null });
      const showRefModal = (type, id) => { refModal.type = type; refModal.id = id; refModal.show = true; };
      const closeRefModal = () => { refModal.show = false; };

      /* ── 공통 필터 & 선택 모달 ── */
      const rightPanelOpen = ref(true);
      const commonFilter   = window.adminCommonFilter;
      const selectModal    = reactive({ type: '', show: false });
      const openSelectModal  = (type) => { selectModal.type = type; selectModal.show = true; };
      const closeSelectModal = () => { selectModal.show = false; selectModal.type = ''; };
      const onSelectItem  = (type, item) => {
        if      (type === 'site')      commonFilter.siteId   = item?.siteId   ?? null;
        else if (type === 'vendor')    commonFilter.vendorId = item?.vendorId  ?? null;
        else if (type === 'dlivVendor') commonFilter.dlivVendorId = item?.vendorId ?? null;
        else if (type === 'adminUser') commonFilter.userId   = item?.adminUserId ?? null;
        else if (type === 'member')    commonFilter.memberId = item?.memberId  ?? null;
        else if (type === 'order')     commonFilter.orderId  = item?.orderId   ?? null;
        selectModal.show = false;
      };
      const clearFilter   = (type) => {
        if      (type === 'site')      commonFilter.siteId   = null;
        else if (type === 'vendor')    commonFilter.vendorId = null;
        else if (type === 'dlivVendor') commonFilter.dlivVendorId = null;
        else if (type === 'adminUser') commonFilter.userId   = null;
        else if (type === 'member')    commonFilter.memberId = null;
        else if (type === 'order')     commonFilter.orderId  = null;
      };
      /* 공통 필터 표시용 헬퍼 (adminData에서 조회) */
      const filterSite      = computed(() => adminData.sites?.find(s => s.siteId   === commonFilter.siteId)   || null);
      const filterVendor    = computed(() => adminData.vendors?.find(v => v.vendorId === commonFilter.vendorId) || null);
      const filterDlivVendor = computed(() => adminData.vendors?.find(v => v.vendorId === commonFilter.dlivVendorId) || null);
      const filterAdminUser = computed(() => adminData.adminUsers?.find(u => u.adminUserId === commonFilter.userId) || null);
      const filterMember    = computed(() => adminData.members?.find(m => m.memberId === commonFilter.memberId) || null);
      const filterOrder     = computed(() => adminData.orders?.find(o => o.orderId  === commonFilter.orderId)  || null);

      /* ── 반응형: 화면 크기에 따라 사이드바 자동 열기/닫기 ── */
      const checkWidth = () => { leftMenuOpen.value = window.innerWidth >= 920; };
      onMounted(() => { checkWidth(); window.addEventListener('resize', checkWidth); });
      onBeforeUnmount(() => window.removeEventListener('resize', checkWidth));

      /* ── 탭바 좌우 스크롤 ── */
      const tabBarRef = ref(null);
      const scrollTabs = (dir) => {
        if (tabBarRef.value) tabBarRef.value.scrollBy({ left: dir * 180, behavior: 'smooth' });
      };

      /* ── 로그인 상태 (localStorage 영속화) ── */
      const _mkAdminToken = () => 'sjat_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
      const _restoreAdminUser = () => {
        try {
          const tok = localStorage.getItem('modu-admin-token');
          if (!tok) return null;
          return JSON.parse(localStorage.getItem('modu-admin-user') || 'null');
        } catch(_) { return null; }
      };
      const currentUser = ref(_restoreAdminUser());
      const activeRoleId = ref(null);
      const currentUserRoles = computed(() => {
        if (!currentUser.value) return [];
        const ids = (adminData.roleUsers || [])
          .filter(ru => ru.adminUserId === currentUser.value.adminUserId)
          .map(ru => ru.roleId);
        const roleMap = Object.fromEntries((adminData.roles || []).map(r => [r.roleId, r]));
        return ids.map(id => roleMap[id]).filter(Boolean);
      });
      const rolePath = (r, uid) => {
        if (!r) return '';
        const m = Object.fromEntries((adminData.roles || []).map(x => [x.roleId, x]));
        const seg = []; let cur = r; let root = r;
        while (cur) { seg.unshift(cur.roleNm); root = cur; cur = cur.parentId ? m[cur.parentId] : null; }
        const path = seg.join(' > ');
        const wantType = root.roleCode === 'SITE_MGR_ROOT' ? 'SALES'
                       : root.roleCode === 'DLIV_ROOT'     ? 'DELIVERY' : null;
        if (wantType) {
          const typeLabel = wantType === 'SALES' ? '판매업체' : '배송업체';
          const targetUid = uid != null ? uid : currentUser.value?.adminUserId;
          let names = [];
          if (targetUid != null) {
            const bus = (adminData.bizUsers || []).filter(b => b.userId === targetUid);
            const bm = Object.fromEntries((adminData.bizs || []).map(b => [b.bizId, b]));
            names = bus.map(bu => bm[bu.bizId]).filter(b => b && b.vendorTypeCd === wantType).map(b => b.bizNm);
          }
          const nameStr = names.length ? names.join(', ') : '(소속없음)';
          return '[' + typeLabel + '] ' + nameStr + ' :: ' + path;
        }
        return path;
      };
      const onRoleChange = () => { location.reload(); };
      const rolesOfUser = (uid) => {
        const ids = (adminData.roleUsers || []).filter(ru => ru.adminUserId === uid).map(ru => ru.roleId);
        const m = Object.fromEntries((adminData.roles || []).map(r => [r.roleId, r]));
        return ids.map(id => m[id]).filter(Boolean);
      };
      const bizInfoOfUser = (uid) => {
        const bus = (adminData.bizUsers || []).filter(b => b.userId === uid);
        const bm = Object.fromEntries((adminData.bizs || []).map(b => [b.bizId, b]));
        const typeLabel = { SALES:'판매업체', DELIVERY:'배송업체', PARTNER:'제휴사', INTERNAL:'내부법인' };
        return bus.map(bu => {
          const b = bm[bu.bizId]; if (!b) return '';
          return '[' + (typeLabel[b.vendorTypeCd] || b.vendorTypeCd) + '] ' + b.bizNm;
        }).filter(Boolean).join(' / ');
      };
      watch(currentUser, (u) => {
        if (u) {
          const roles = currentUserRoles.value;
          if (!roles.find(r => r.roleId === activeRoleId.value)) {
            activeRoleId.value = roles[0]?.roleId || null;
          }
        } else { activeRoleId.value = null; }
      }, { immediate: true });
      const loginModal  = reactive({ show: false, tab: 'login' });
      const loginForm   = reactive({ email: 'admin1@demo.com', password: 'demo1234', authMethod: '메인' });
      const regForm     = reactive({ name: '', email: '', password: '', confirmPw: '', phone: '', role: '운영자' });
      const loginError  = ref('');
      const userMenuShow = ref(false);

      /* 프로필 모달 */
      const profileModal = reactive({ show: false });
      const profileForm  = reactive({ name: '', phone: '', dept: '', email: '' });
      const openProfile  = () => {
        if (!currentUser.value) return;
        Object.assign(profileForm, { name: currentUser.value.name, phone: currentUser.value.phone, dept: currentUser.value.dept, email: currentUser.value.email });
        profileModal.show = true; userMenuShow.value = false;
      };
      const saveProfile  = () => {
        if (!profileForm.name) { showToast('이름을 입력하세요.', 'error'); return; }
        currentUser.value.name  = profileForm.name;
        currentUser.value.phone = profileForm.phone;
        currentUser.value.dept  = profileForm.dept;
        profileModal.show = false;
        showToast('프로필이 저장되었습니다.');
      };

      /* 비밀번호 변경 모달 */
      const pwModal  = reactive({ show: false });
      const pwForm   = reactive({ current: '', next: '', confirm: '' });
      const pwError  = ref('');
      const openPwChange = () => {
        Object.assign(pwForm, { current: '', next: '', confirm: '' });
        pwError.value = ''; pwModal.show = true; userMenuShow.value = false;
      };
      const savePwChange = () => {
        pwError.value = '';
        if (!pwForm.current || !pwForm.next || !pwForm.confirm) { pwError.value = '모든 항목을 입력하세요.'; return; }
        if (currentUser.value.password !== pwForm.current) { pwError.value = '현재 비밀번호가 올바르지 않습니다.'; return; }
        if (pwForm.next.length < 6) { pwError.value = '새 비밀번호는 6자 이상이어야 합니다.'; return; }
        if (pwForm.next !== pwForm.confirm) { pwError.value = '새 비밀번호가 일치하지 않습니다.'; return; }
        currentUser.value.password = pwForm.next;
        pwModal.show = false;
        showToast('비밀번호가 변경되었습니다.');
      };

      const openLogin = (tab = 'login') => {
        loginModal.tab = tab; loginModal.show = true; loginError.value = '';
      };
      const closeLogin = () => { loginModal.show = false; loginError.value = ''; };

      const quickLogin = (email) => {
        loginForm.email = email;
        loginForm.password = 'demo1234';
        loginForm.authMethod = '메인';
        doLogin();
      };
      const doLogin = () => {
        loginError.value = '';
        if (!loginForm.email || !loginForm.password) { loginError.value = '이메일과 비밀번호를 입력하세요.'; return; }
        const u = window.adminData.adminUsers.find(x => x.email === loginForm.email && x.password === loginForm.password);
        if (!u) { loginError.value = '이메일 또는 비밀번호가 올바르지 않습니다.'; return; }
        if (u.status === '비활성') { loginError.value = '비활성 계정입니다. 관리자에게 문의하세요.'; return; }
        currentUser.value = u;
        const now = new Date();
        u.lastLogin = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        try {
          localStorage.setItem('modu-admin-token', _mkAdminToken());
          localStorage.setItem('modu-admin-user', JSON.stringify(u));
        } catch(_){}
        /* 모든 탭 닫고 대시보드로 */
        openTabs.splice(0);
        loginForm.email = ''; loginForm.password = '';
        closeLogin();
        navigate('dashboard');
        showToast(`${u.name}님 환영합니다.`);
      };

      const doLogout = () => {
        currentUser.value = null; userMenuShow.value = false;
        try {
          localStorage.removeItem('modu-admin-token');
          localStorage.removeItem('modu-admin-user');
        } catch(_){}
        openTabs.splice(0);
        navigate('dashboard');
        showToast('로그아웃되었습니다.');
      };
      /* 프로필/비번 변경 시 localStorage 갱신 */
      const _persistAdminUser = () => {
        try {
          if (currentUser.value) localStorage.setItem('modu-admin-user', JSON.stringify(currentUser.value));
        } catch(_){}
      };
      watch(currentUser, _persistAdminUser, { deep: true });
      /* 다른 탭에서 로그인/로그아웃 동기화 */
      window.addEventListener('storage', (e) => {
        if (e.key === 'modu-admin-token' || e.key === 'modu-admin-user') {
          const u = _restoreAdminUser();
          currentUser.value = u;
        }
      });

      const doRegister = () => {
        loginError.value = '';
        if (!regForm.name || !regForm.email || !regForm.password) { loginError.value = '필수 항목을 입력하세요.'; return; }
        if (regForm.password !== regForm.confirmPw) { loginError.value = '비밀번호가 일치하지 않습니다.'; return; }
        if (window.adminData.adminUsers.find(x => x.email === regForm.email)) { loginError.value = '이미 사용 중인 이메일입니다.'; return; }
        const maxId = Math.max(...window.adminData.adminUsers.map(u => u.adminUserId), 0);
        const now = new Date().toISOString().slice(0, 10);
        window.adminData.adminUsers.push({
          adminUserId: maxId + 1,
          loginId: regForm.email.split('@')[0],
          name: regForm.name, email: regForm.email, password: regForm.password,
          phone: regForm.phone, role: regForm.role, dept: '', status: '활성',
          lastLogin: '-', regDate: now,
        });
        Object.assign(regForm, { name: '', email: '', password: '', confirmPw: '', phone: '', role: '운영자' });
        loginModal.tab = 'login';
        loginError.value = '';
        showToast('가입이 완료되었습니다. 로그인해주세요.');
      };

      /* ── 연관사이트 레이어 ── */
      const relatedSiteOpen = ref(false);
      const toggleRelatedSite = () => { relatedSiteOpen.value = !relatedSiteOpen.value; };
      const openRelatedLink = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
        relatedSiteOpen.value = false;
      };
      const goFrontSite = (no) => {
        try { localStorage.setItem('modu-front-site_no', no); } catch(_){}
        window.open('index.html?FRONT_SITE_NO=' + no, '_blank');
        relatedSiteOpen.value = false;
      };
      const goAdminSite = (no) => {
        try { localStorage.setItem('modu-admin-site_no', no); } catch(_){}
        window.open('admin.html?ADMIN_SITE_NO=' + no, '_blank');
        relatedSiteOpen.value = false;
      };
      const currentFrontNo = (typeof localStorage !== 'undefined' && localStorage.getItem('modu-front-site_no')) || '01';
      const currentAdminSiteNo = window.ADMIN_SITE_NO || '01';
      const SITE_PAIR_MENU = [
        { front:'01',   admin:'01' },
        { front:'02',   admin:'02' },
        { front:'03',   admin:'03' },
        { front:'9999', admin:'9999' },
      ];
      const DISP_LINKS = [
        { label: '통합 페이지', hash: '#page=dispUiPage', icon:'🌐' },
        { label: 'UI 샘플 01',  hash: '#page=dispUi01',   icon:'1️⃣' },
        { label: 'UI 샘플 02',  hash: '#page=dispUi02',   icon:'2️⃣' },
        { label: 'UI 샘플 03',  hash: '#page=dispUi03',   icon:'3️⃣' },
        { label: 'UI 샘플 04',  hash: '#page=dispUi04',   icon:'4️⃣' },
        { label: 'UI 샘플 05',  hash: '#page=dispUi05',   icon:'5️⃣' },
        { label: 'UI 샘플 06',  hash: '#page=dispUi06',   icon:'6️⃣' },
      ];

      /* ── 즐겨찾기 ── */
      const favorites = reactive([]);
      const favKeepSet = reactive(new Set()); // 즐겨찾기별 keep 설정
      const sidebarTab = ref('open');
      const isFav = (pgId) => favorites.includes(pgId);
      const toggleFav = (pgId) => {
        const idx = favorites.indexOf(pgId);
        if (idx === -1) favorites.push(pgId);
        else { favorites.splice(idx, 1); favKeepSet.delete(pgId); }
      };
      const toggleFavKeep = (pgId) => {
        if (favKeepSet.has(pgId)) favKeepSet.delete(pgId);
        else favKeepSet.add(pgId);
        // 현재 열려있는 탭이면 keptTabIds에도 즉시 반영
        if (openTabs.find(t => t.id === pgId)) {
          if (favKeepSet.has(pgId)) keptTabIds.add(pgId);
          else keptTabIds.delete(pgId);
        }
      };
      const favList = computed(() =>
        favorites.map(pgId => {
          const topId = PAGE_TO_TOP[pgId];
          const topLabel = TOP_MENUS.find(t => t.id === topId)?.label || '';
          return { id: pgId, label: PAGE_LABELS[pgId] || pgId, topLabel };
        })
      );

      /* 루트 클릭 → 컨텍스트 메뉴·유저메뉴 닫기 */
      const onRootClick = () => { closeCtxMenu(); userMenuShow.value = false; };

      return {
        page, editId, navigate, errorMessage, dashboardComp,
        TOP_MENUS, LEFT_MENUS, AUTH_METHODS,
        openTabs, closeTab, activeTabId, refreshKeys, keptTabIds, toggleKeep, PAGE_COMP_MAP,
        ctxMenu, showCtxMenu, closeCtxMenu,
        ctxClose, ctxCloseLeft, ctxCloseRight, ctxCloseOthers, ctxCloseAll, ctxNewWindow, ctxRefresh,
        openNewWindow, openTabsWithGroup,
        activeTop, leftMenuOpen, setTopMenu,
        toasts, showToast, closeToast,
        confirmState, showConfirm, closeConfirm,
        refModal, showRefModal, closeRefModal,
        adminData: window.adminData,
        rightPanelOpen, commonFilter, selectModal, openSelectModal, closeSelectModal, onSelectItem, clearFilter,
        filterSite, filterVendor, filterDlivVendor, filterAdminUser, filterMember, filterOrder,
        tabBarRef, scrollTabs,
        currentUser, currentUserRoles, activeRoleId, rolePath, onRoleChange, rolesOfUser, bizInfoOfUser,
        loginModal, loginForm, regForm, loginError, userMenuShow,
        openLogin, closeLogin, doLogin, quickLogin, doLogout, doRegister,
        profileModal, profileForm, openProfile, saveProfile,
        pwModal, pwForm, pwError, openPwChange, savePwChange,
        favorites, favKeepSet, sidebarTab, isFav, toggleFav, favList, toggleFavKeep,
        apiResPanel, setApiRes, closeApiResPanel,
        onRootClick,
        relatedSiteOpen, toggleRelatedSite, openRelatedLink,
        goFrontSite, goAdminSite, currentFrontNo, currentAdminSiteNo, SITE_PAIR_MENU, DISP_LINKS,
      };
    },

    template: /* html */`
<div @click="onRootClick">
  <!-- ① TOP NAV -->
  <nav class="admin-top-nav">
    <button class="sidebar-toggle-btn" @click.stop="leftMenuOpen=!leftMenuOpen" title="사이드바">☰</button>
    <span class="brand" @click="navigate('dashboard')" style="display:inline-flex;align-items:center;gap:8px;">
      ShopJoy
      <span class="front-site-badge"
        :title="'FRONT_SITE_NO=' + (currentFrontNo || '-') + ' ADMIN_SITE_NO=' + (currentAdminSiteNo || '-') + ' — 클릭: 연관사이트'"
        :data-tip="'FRONT_SITE_NO=' + (currentFrontNo || '-') + ' ADMIN_SITE_NO=' + (currentAdminSiteNo || '-')"
        style="display:inline-flex;gap:4px;font-family:monospace;font-size:11px;cursor:pointer;"
        @click.stop="toggleRelatedSite">
        <span :style="{fontWeight:800,color: currentFrontNo==='03'?'#7b1fa2':currentFrontNo==='02'?'#2e7d6b':currentFrontNo==='9999'?'#bbb':'#ff8aa5'}">{{ currentFrontNo || '-' }}</span>
        <span :style="{fontWeight:800,color: currentAdminSiteNo==='03'?'#7b1fa2':currentAdminSiteNo==='02'?'#2e7d6b':currentAdminSiteNo==='9999'?'#bbb':'#ff8aa5'}">{{ currentAdminSiteNo || '-' }}</span>
      </span>
    </span>
    <div class="top-nav-menus">
      <span v-for="tm in TOP_MENUS" :key="tm.id"
        class="top-nav-item" :class="{active: activeTop===tm.id}"
        @click="setTopMenu(tm.id)">{{ tm.label }}</span>
    </div>

    <!-- 로그인/유저 영역 -->
    <div class="top-nav-user" @click.stop>
      <template v-if="currentUser">
        <select v-if="currentUserRoles.length > 1" class="user-role-select" v-model="activeRoleId" @change="onRoleChange"
          :title="'역할 ' + currentUserRoles.length + '개 보유'"
          style="margin-right:4px;padding:3px 6px;font-size:11px;border:1px solid #d1d5db;border-radius:6px;background:#fff;color:#374151;max-width:480px;min-width:320px;">
          <option v-for="r in currentUserRoles" :key="r.roleId" :value="r.roleId">{{ rolePath(r) }}</option>
        </select>
        <span v-if="currentUserRoles.length >= 2"
          :title="'역할 ' + currentUserRoles.length + '개 보유'"
          style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;margin-right:8px;font-size:10px;font-weight:700;color:#fff;background:linear-gradient(135deg,#ff6b9d,#c44569);border-radius:9px;">{{ currentUserRoles.length }}</span>
        <span v-else-if="currentUserRoles.length === 1" class="user-role-label"
          style="margin-right:8px;font-size:11px;color:#cdb4ff;font-weight:500;">{{ rolePath(currentUserRoles[0]) }}</span>
        <span class="user-name-label">{{ currentUser.name }}</span>
        <button class="user-avatar-btn" @click="userMenuShow=!userMenuShow" :title="currentUser.email">
          {{ currentUser.name[0] }}
        </button>
        <div v-if="userMenuShow" class="user-dropdown">
          <div class="user-dropdown-header">
            <div class="user-dropdown-name">{{ currentUser.name }}</div>
            <div class="user-dropdown-role">{{ currentUser.role }}</div>
            <div class="user-dropdown-email">{{ currentUser.email }}</div>
          </div>
          <div class="user-dropdown-sep"></div>
          <div class="user-dropdown-item" @click="openProfile">🙍 프로필</div>
          <div class="user-dropdown-item" @click="openPwChange">🔑 비밀번호 변경</div>
          <div class="user-dropdown-sep"></div>
          <div class="user-dropdown-item danger" @click="doLogout">↩ 로그아웃</div>
        </div>
      </template>
      <template v-else>
        <button class="login-btn" @click="openLogin('login')">🔐 로그인</button>
      </template>
    </div>
  </nav>

  <!-- ② TAB BAR -->
  <div class="admin-tab-bar-wrap">
    <button class="tab-scroll-btn" @click="scrollTabs(-1)" title="왼쪽">&#8249;</button>
    <div class="admin-tab-bar" ref="tabBarRef">
      <div v-for="tab in openTabs" :key="tab.id"
        class="admin-tab" :class="{active: activeTabId===tab.id}"
        @click="navigate(tab.id)"
        @contextmenu.prevent="showCtxMenu($event, tab.id)">
        <span @click.stop="toggleKeep(tab.id)"
          :title="keptTabIds.has(tab.id) ? '고정 해제' : '고정 (탭 전환 시 상태 유지)'"
          style="font-size:9px;cursor:pointer;margin-right:3px;transition:all .15s;flex-shrink:0;line-height:1;"
          :style="keptTabIds.has(tab.id) ? 'opacity:1;color:#1565c0;' : 'opacity:.2;color:#999;'">📌</span>
        <span class="tab-label">{{ tab.label }}</span>
        <span class="tab-close-btn" @click.stop="closeTab(tab.id, $event)">✕</span>
      </div>
    </div>
    <button class="tab-scroll-btn" @click="scrollTabs(1)" title="오른쪽">&#8250;</button>
  </div>

  <!-- ③ BODY -->
  <div class="admin-body">

    <!-- Left Sidebar -->
    <nav class="admin-left-nav" :class="{closed: !leftMenuOpen}">
      <div class="left-nav-top">
        <div class="left-nav-group-title">{{ TOP_MENUS.find(t=>t.id===activeTop)?.label }}</div>
        <template v-for="item in LEFT_MENUS[activeTop]" :key="item.group || item.id">
          <div v-if="item.group" class="left-nav-group-header">{{ item.group }}</div>
          <div v-else class="left-nav-item left-nav-sub-item" :class="{active: activeTabId===item.id}"
            @click="$event.ctrlKey ? openNewWindow(item.id) : navigate(item.id)"
            :title="'Ctrl+클릭: 새창'">
            {{ item.label }}
            <span class="left-fav-star" :class="{active: isFav(item.id)}"
              @click.stop="toggleFav(item.id)" :title="isFav(item.id)?'즐겨찾기 해제':'즐겨찾기 추가'">★</span>
          </div>
        </template>
      </div>

      <!-- 열린화면 / 즐겨찾기 (하단 고정) -->
      <div class="left-nav-open-section">
        <!-- 목록 (위) -->
        <div class="left-nav-open-list">
          <!-- 즐겨찾기 목록 -->
          <template v-if="sidebarTab==='fav'">
            <div v-if="favList.length===0" class="left-nav-open-empty">즐겨찾기가 없습니다.</div>
            <div v-for="fav in favList" :key="fav.id"
              class="left-nav-open-item" :class="{active: activeTabId===fav.id}"
              @click="navigate(fav.id)">
              <span @click.stop="toggleFavKeep(fav.id)"
                :title="favKeepSet.has(fav.id) ? '고정 해제' : '고정 (열 때 상태 유지)'"
                style="font-size:9px;cursor:pointer;margin-right:4px;flex-shrink:0;transition:all .15s;"
                :style="favKeepSet.has(fav.id) ? 'opacity:1;color:#1565c0;' : 'opacity:.22;color:#999;'">📌</span>
              <span class="left-nav-open-path">
                <span class="left-nav-open-group">{{ fav.topLabel }}</span>
                <span class="left-nav-open-sep"> › </span>
                <span class="left-nav-open-label">{{ fav.label }}</span>
              </span>
              <span class="left-fav-star active" @click.stop="toggleFav(fav.id)" title="즐겨찾기 해제">★</span>
            </div>
          </template>
          <!-- 열린화면 목록 -->
          <template v-if="sidebarTab==='open'">
            <div v-if="openTabsWithGroup.length===0" class="left-nav-open-empty">열린 화면이 없습니다.</div>
            <div v-for="tab in openTabsWithGroup" :key="tab.id"
              class="left-nav-open-item" :class="{active: activeTabId===tab.id}"
              @click="navigate(tab.id)">
              <span class="left-nav-open-path">
                <span class="left-nav-open-group">{{ tab.topLabel }}</span>
                <span class="left-nav-open-sep"> › </span>
                <span class="left-nav-open-label">{{ tab.label }}</span>
              </span>
              <span class="left-fav-star" :class="{active: isFav(tab.id)}"
                @click.stop="toggleFav(tab.id)" :title="isFav(tab.id)?'즐겨찾기 해제':'즐겨찾기 추가'">★</span>
              <span class="left-nav-open-close" @click.stop="closeTab(tab.id, $event)">✕</span>
            </div>
          </template>
        </div>
        <!-- 탭 버튼 (최하단 고정) -->
        <div class="left-nav-section-tabs">
          <button class="left-nav-section-tab" :class="{active: sidebarTab==='fav'}"
            @click="sidebarTab='fav'">★ 즐겨찾기</button>
          <button class="left-nav-section-tab" :class="{active: sidebarTab==='open'}"
            @click="sidebarTab='open'">열린화면</button>
        </div>
        <!-- 연관사이트 (별도 행) -->
        <div style="padding:6px 10px;border-top:1px solid #eef0f3;background:#fafbfc;">
          <button @click.stop="toggleRelatedSite"
            style="width:100%;display:flex;align-items:center;gap:6px;padding:6px 10px;background:#fff;border:1px solid #eee;border-radius:6px;cursor:pointer;font-size:12px;color:#555;"
            title="연관사이트 열기">
            <span>🔗 연관사이트</span>
            <span style="margin-left:auto;display:inline-flex;gap:5px;font-family:monospace;">
              <span :style="{fontWeight:800,color: currentFrontNo==='03'?'#7b1fa2':currentFrontNo==='02'?'#2e7d6b':currentFrontNo==='9999'?'#888':'#9f2946'}">{{ currentFrontNo || '-' }}</span>
              <span :style="{fontWeight:800,color: currentAdminSiteNo==='03'?'#7b1fa2':currentAdminSiteNo==='02'?'#2e7d6b':currentAdminSiteNo==='9999'?'#888':'#9f2946'}">{{ currentAdminSiteNo || '-' }}</span>
            </span>
            <span style="font-size:9px;color:#bbb;">▾</span>
          </button>
        </div>

        <!-- 연관사이트 팝업 레이어 -->
        <div v-if="relatedSiteOpen"
          @click="relatedSiteOpen=false"
          style="position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.25);"></div>
        <div v-if="relatedSiteOpen"
          @click.stop
          style="position:fixed;left:12px;bottom:56px;z-index:9999;width:360px;max-height:75vh;overflow:auto;background:#fff;border:1px solid #ffc9d6;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,0.3);">
          <div style="padding:12px 14px;border-bottom:1px solid #ffc9d6;background:linear-gradient(135deg,#fff0f4,#ffe4ec);display:flex;align-items:center;justify-content:space-between;">
            <span style="font-weight:800;font-size:13px;color:#9f2946;"><span style="color:#e8587a;font-size:9px;margin-right:6px;">●</span>🔗 연관사이트</span>
            <button @click="relatedSiteOpen=false" style="background:none;border:none;font-size:13px;color:#9f2946;cursor:pointer;padding:2px 6px;border-radius:4px;">✕</button>
          </div>
          <div style="padding:12px;">
            <!-- _SITE_NO (FRONT / ADMIN 분리 링크) -->
            <div style="background:#fafbfc;border:1px solid #eef0f3;border-radius:10px;padding:12px;margin-bottom:12px;">
              <div style="font-size:12px;font-weight:800;color:#2e7d6b;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #def0e8;">🌈 _SITE_NO <span style="font-size:10.5px;color:#888;font-weight:600;">(FRONT: {{ currentFrontNo || '-' }}, ADMIN: {{ currentAdminSiteNo || '-' }})</span></div>
              <div style="display:flex;flex-direction:column;gap:4px;">
                <div v-for="p in SITE_PAIR_MENU" :key="p.front+'_'+p.admin"
                  style="display:flex;gap:6px;align-items:center;">
                  <button type="button" @click="goFrontSite(p.front)"
                    :style="{flex:1,display:'inline-flex',alignItems:'center',gap:'6px',padding:'6px 10px',background: currentFrontNo===p.front?'#e0f2ec':'transparent',border:'1px solid '+(currentFrontNo===p.front?'#a3d4be':'#e5eaea'),borderRadius:'6px',cursor:'pointer',fontSize:'11.5px',fontFamily:'monospace',color: currentFrontNo===p.front?'#2e7d6b':'#444',fontWeight: currentFrontNo===p.front?700:500,transition:'all .12s'}"
                    onmouseover="this.style.background='#e0f2ec';this.style.color='#2e7d6b';"
                    onmouseout="if(this.dataset.active!=='1'){this.style.background='transparent';this.style.color='#444';}"
                    :data-active="currentFrontNo===p.front?'1':'0'"
                    title="index.html 새창 오픈">
                    <span>{{ currentFrontNo===p.front?'●':'○' }}</span>
                    <span>FRONT={{ p.front }}</span>
                    <span style="margin-left:auto;font-size:10px;color:#aaa;">↗</span>
                  </button>
                  <button type="button" @click="goAdminSite(p.admin)"
                    :style="{flex:1,display:'inline-flex',alignItems:'center',gap:'6px',padding:'6px 10px',background: currentAdminSiteNo===p.admin?'#f3e5f5':'transparent',border:'1px solid '+(currentAdminSiteNo===p.admin?'#ce93d8':'#e5eaea'),borderRadius:'6px',cursor:'pointer',fontSize:'11.5px',fontFamily:'monospace',color: currentAdminSiteNo===p.admin?'#7b1fa2':'#444',fontWeight: currentAdminSiteNo===p.admin?700:500,transition:'all .12s'}"
                    onmouseover="this.style.background='#f3e5f5';this.style.color='#7b1fa2';"
                    onmouseout="if(this.dataset.active!=='1'){this.style.background='transparent';this.style.color='#444';}"
                    :data-active="currentAdminSiteNo===p.admin?'1':'0'"
                    title="admin.html 새창 오픈">
                    <span>{{ currentAdminSiteNo===p.admin?'●':'○' }}</span>
                    <span>ADMIN={{ p.admin }}</span>
                    <span style="margin-left:auto;font-size:10px;color:#aaa;">↗</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- dispUi -->
            <div style="background:#fafbfc;border:1px solid #eef0f3;border-radius:10px;padding:12px;">
              <div style="font-size:12px;font-weight:800;color:#c2410c;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f5e8de;">🖥 dispUi (샘플)</div>
              <div style="display:flex;flex-direction:column;gap:2px;">
                <div v-for="it in DISP_LINKS" :key="it.hash"
                  style="display:flex;align-items:center;gap:6px;padding:4px 6px;">
                  <span style="width:18px;text-align:center;font-size:12.5px;">{{ it.icon }}</span>
                  <span style="flex:1;font-size:12.5px;color:#333;">{{ it.label }}</span>
                  <button @click="openRelatedLink('disp-front-ui.html' + it.hash)"
                    style="padding:3px 9px;font-size:11px;font-weight:600;background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;border-radius:5px;cursor:pointer;"
                    title="사용자 미리보기">사용자 ↗</button>
                  <button @click="openRelatedLink('disp-admin-ui.html' + it.hash)"
                    style="padding:3px 9px;font-size:11px;font-weight:600;background:#fef3eb;color:#c2410c;border:1px solid #f5e8de;border-radius:5px;cursor:pointer;"
                    title="관리자 미리보기">관리자 ↗</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="admin-main">
      <div class="admin-wrap">
        <!-- 고정된 탭: v-show로 항상 마운트 유지, 전환 시 상태 보존 -->
        <component
          v-for="keptId in keptTabIds" :key="'kept_' + keptId"
          :is="PAGE_COMP_MAP[keptId]"
          v-show="page === keptId"
          :navigate="navigate" :admin-data="adminData"
          :show-ref-modal="showRefModal" :show-toast="showToast"
          :show-confirm="showConfirm" :set-api-res="setApiRes"
          :edit-id="editId"
        />
        <!-- 비고정 현재 탭: 전환 시 재마운트 -->
        <div v-if="!keptTabIds.has(page)" :key="page + '_' + (refreshKeys[page] || 0)" style="display:contents;">
        <component v-if="page==='dashboard'" :is="dashboardComp" :navigate="navigate" :admin-data="adminData" :show-toast="showToast" />
        <mb-member-mng  v-else-if="page==='mbMemberMng'"  :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <mb-member-dtl  v-else-if="page==='mbMemberDtl'"  :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <pd-prod-mng    v-else-if="page==='pdProdMng'"    :navigate="navigate" :disp-dataset="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <pd-prod-dtl    v-else-if="page==='pdProdDtl'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <od-order-mng   v-else-if="page==='odOrderMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <od-order-dtl   v-else-if="page==='odOrderDtl'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <od-claim-mng   v-else-if="page==='odClaimMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <od-claim-dtl   v-else-if="page==='odClaimDtl'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <od-dliv-mng    v-else-if="page==='odDlivMng'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <od-dliv-dtl    v-else-if="page==='odDlivDtl'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <pm-coupon-mng  v-else-if="page==='pmCouponMng'"  :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <pm-coupon-dtl  v-else-if="page==='pmCouponDtl'"  :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <pm-cache-mng   v-else-if="page==='pmCacheMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <pm-discnt-mng v-else-if="page==='pmDiscntMng'" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <pm-save-mng    v-else-if="page==='pmSaveMng'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <pm-gift-mng    v-else-if="page==='pmGiftMng'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <pm-voucher-mng v-else-if="page==='pmVoucherMng'" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <pm-cache-dtl   v-else-if="page==='pmCacheDtl'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <dp-disp-panel-mng  v-else-if="page==='dpDispPanelMng'"  :navigate="navigate" :disp-dataset="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <dp-disp-area-preview  v-else-if="page==='dpDispAreaPreview'"  :navigate="navigate" :disp-dataset="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <dp-disp-ui-preview    v-else-if="page==='dpDispUiPreview'"    :navigate="navigate" :disp-dataset="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <dp-disp-ui-simul     v-else-if="page==='dpDispUiSimul'"     :navigate="navigate" :disp-dataset="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <dp-disp-panel-preview v-else-if="page==='dpDispPanelPreview'" :navigate="navigate" :disp-dataset="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <dp-disp-widget-preview v-else-if="page==='dpDispWidgetPreview'" :navigate="navigate" :disp-dataset="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <dp-disp-area-mng     v-else-if="page==='dpDispAreaMng'"     :navigate="navigate" :disp-dataset="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <dp-disp-ui-mng       v-else-if="page==='dpDispUiMng'"       :navigate="navigate" :disp-dataset="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <dp-disp-widget-mng   v-else-if="page==='dpDispWidgetMng'"   :navigate="navigate" :disp-dataset="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <dp-disp-panel-dtl      v-else-if="page==='dpDispPanelDtl'"      :navigate="navigate" :disp-dataset="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <dp-disp-widget-lib-mng     v-else-if="page==='dpDispWidgetLibMng'"     :navigate="navigate" :disp-dataset="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <dp-disp-widget-lib-dtl     v-else-if="page==='dpDispWidgetLibDtl'"     :navigate="navigate" :disp-dataset="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <dp-disp-widget-lib-preview v-else-if="page==='dpDispWidgetLibPreview'" :navigate="navigate" :disp-dataset="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <dp-disp-relation-mng v-else-if="page==='dpDispRelationMng'" :navigate="navigate" :disp-dataset="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <pm-event-mng   v-else-if="page==='pmEventMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <pm-event-dtl   v-else-if="page==='pmEventDtl'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <pm-plan-mng    v-else-if="page==='pmPlanMng'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <pm-plan-dtl    v-else-if="page==='pmPlanDtl'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <mb-cust-info-mng v-else-if="page==='mbCustInfoMng'" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-contact-mng v-else-if="page==='syContactMng'" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-contact-dtl v-else-if="page==='syContactDtl'" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <cm-chatt-mng   v-else-if="page==='cmChattMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <cm-chatt-dtl   v-else-if="page==='cmChattDtl'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <sy-site-mng    v-else-if="page==='sySiteMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-site-dtl    v-else-if="page==='sySiteDtl'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <sy-code-mng    v-else-if="page==='syCodeMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-code-dtl    v-else-if="page==='syCodeDtl'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <sy-brand-mng   v-else-if="page==='syBrandMng'"   :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-attach-mng  v-else-if="page==='syAttachMng'"  :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-template-mng v-else-if="page==='syTemplateMng'" :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-template-dtl v-else-if="page==='syTemplateDtl'" :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <sy-vendor-mng  v-else-if="page==='syVendorMng'"  :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-biz-mng     v-else-if="page==='syBizMng'"     :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-biz-user-mng v-else-if="page==='syBizUserMng'" :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-vendor-dtl  v-else-if="page==='syVendorDtl'"  :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <pd-category-mng v-else-if="page==='pdCategoryMng'" :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <pd-category-dtl v-else-if="page==='pdCategoryDtl'" :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <pd-category-prod-mng v-else-if="page==='pdCategoryProdMng'" :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-user-mng    v-else-if="page==='syUserMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-user-dtl    v-else-if="page==='syUserDtl'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <sy-batch-mng   v-else-if="page==='syBatchMng'"   :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-batch-dtl   v-else-if="page==='syBatchDtl'"   :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <sy-dept-mng    v-else-if="page==='syDeptMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-menu-mng    v-else-if="page==='syMenuMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-role-mng    v-else-if="page==='syRoleMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <cm-notice-mng  v-else-if="page==='cmNoticeMng'"  :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-alarm-mng   v-else-if="page==='syAlarmMng'"   :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-prop-mng    v-else-if="page==='syPropMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-path-mng    v-else-if="page==='syPathMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-bbm-mng     v-else-if="page==='syBbmMng'"     :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-bbs-mng     v-else-if="page==='syBbsMng'"     :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-i18n-mng    v-else-if="page==='syI18nMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <!-- ── 회원 추가 ── -->
        <mb-mem-grade-mng  v-else-if="page==='mbMemGradeMng'"  :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <mb-mem-group-mng  v-else-if="page==='mbMemGroupMng'"  :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <!-- ── 상품 추가 ── -->
        <pd-dliv-tmplt-mng   v-else-if="page==='pdDlivTmpltMng'"   :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <pd-bundle-mng       v-else-if="page==='pdBundleMng'"       :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <pd-set-mng          v-else-if="page==='pdSetMng'"          :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <pd-review-mng       v-else-if="page==='pdReviewMng'"       :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <pd-qna-mng          v-else-if="page==='pdQnaMng'"          :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <pd-restock-noti-mng v-else-if="page==='pdRestockNotiMng'" :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <pd-tag-mng          v-else-if="page==='pdTagMng'"          :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <!-- ── 고객센터 추가 ── -->
        <cm-bltn-mng    v-else-if="page==='cmBltnMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <!-- ── 정산 ── -->
        <st-config-mng       v-else-if="page==='stConfigMng'"       :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <st-raw-mng          v-else-if="page==='stRawMng'"          :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <st-settle-adj-mng   v-else-if="page==='stSettleAdjMng'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <st-settle-etc-adj-mng v-else-if="page==='stSettleEtcAdjMng'" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <st-settle-close-mng v-else-if="page==='stSettleCloseMng'"  :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <st-settle-pay-mng   v-else-if="page==='stSettlePayMng'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <st-status-mng       v-else-if="page==='stStatusMng'"       :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <st-recon-order-mng  v-else-if="page==='stReconOrderMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <st-recon-pay-mng    v-else-if="page==='stReconPayMng'"     :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <st-recon-claim-mng  v-else-if="page==='stReconClaimMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <st-recon-vendor-mng v-else-if="page==='stReconVendorMng'"  :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <st-erp-gen-mng      v-else-if="page==='stErpGenMng'"       :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <st-erp-view-mng     v-else-if="page==='stErpViewMng'"      :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <st-erp-recon-mng    v-else-if="page==='stErpReconMng'"     :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-member-login-hist v-else-if="page==='syMemberLoginHist'" :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-user-login-hist   v-else-if="page==='syUserLoginHist'"   :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-postman           v-else-if="page==='syPostman'"         :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <admin-error-401 v-else-if="page==='error401'" :navigate="navigate" />
        <admin-error-500 v-else-if="page==='error500'" :navigate="navigate" :message="errorMessage" />
        <admin-error-404 v-else :navigate="navigate" :page-id="page" />
        </div><!-- /비고정 탭 래퍼 -->
      </div>
    </div>

    <!-- Right Panel: 공통 필터 -->
    <div class="admin-right-panel" :class="{collapsed: !rightPanelOpen}">
      <div class="right-panel-header" @click="rightPanelOpen=!rightPanelOpen">
        <span class="right-panel-title">공통 필터</span>
        <span style="font-size:11px;color:#bbb;">{{ rightPanelOpen ? '▶' : '◀' }}</span>
      </div>
      <div v-show="rightPanelOpen" class="right-panel-body">
        <div class="popup-sel">
          <div class="popup-sel-label">사이트 <span style="color:#e8587a;font-size:10px;">필수</span>
            <span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#e5e7eb;color:#555;font-size:10px;text-align:center;line-height:14px;margin-left:4px;cursor:help;font-weight:700;"
              title="사이트번호 : 프로그램 작업코드 (01, 02, 03…)&#10;사이트코드 : 라이선스코드 (ST0001 형식)">?</span>
          </div>
          <div class="popup-sel-row" @click="openSelectModal('site')">
            <span v-if="filterSite" style="font-family:monospace;font-size:11px;color:#e8587a;font-weight:700;margin-right:6px;">{{ String(filterSite.siteId).padStart(2,'0') }}</span>
            <span v-if="filterSite" class="popup-sel-name">{{ filterSite.siteNm }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="filterSite" class="popup-sel-id">{{ filterSite.siteCode }}</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>
        <div class="popup-sel">
          <div class="popup-sel-label">판매업체
            <span v-if="commonFilter.vendorId" class="popup-sel-clear" @click.stop="clearFilter('vendor')">✕</span>
          </div>
          <div class="popup-sel-row" @click="openSelectModal('vendor')">
            <span v-if="filterVendor" class="popup-sel-name">{{ filterVendor.vendorNm }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="filterVendor" class="popup-sel-id">{{ filterVendor.vendorId }}</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>
        <div class="popup-sel">
          <div class="popup-sel-label">판매사용자
            <span v-if="commonFilter.userId" class="popup-sel-clear" @click.stop="clearFilter('adminUser')">✕</span>
          </div>
          <div class="popup-sel-row" @click="openSelectModal('adminUser')">
            <span v-if="filterAdminUser" class="popup-sel-name">{{ filterAdminUser.name }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="filterAdminUser" class="popup-sel-id">{{ filterAdminUser.adminUserId }}</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>
        <div class="popup-sel">
          <div class="popup-sel-label">배송업체
            <span v-if="commonFilter.dlivVendorId" class="popup-sel-clear" @click.stop="clearFilter('dlivVendor')">✕</span>
          </div>
          <div class="popup-sel-row" @click="openSelectModal('dlivVendor')">
            <span v-if="filterDlivVendor" class="popup-sel-name">{{ filterDlivVendor.vendorNm }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="filterDlivVendor" class="popup-sel-id">{{ filterDlivVendor.vendorId }}</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>
        <div class="popup-sel">
          <div class="popup-sel-label">회원
            <span v-if="commonFilter.memberId" class="popup-sel-clear" @click.stop="clearFilter('member')">✕</span>
          </div>
          <div class="popup-sel-row" @click="openSelectModal('member')">
            <span v-if="filterMember" class="popup-sel-name">{{ filterMember.memberNm }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="filterMember" class="popup-sel-id">{{ filterMember.memberId }}</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>
        <div class="popup-sel">
          <div class="popup-sel-label">주문
            <span v-if="commonFilter.orderId" class="popup-sel-clear" @click.stop="clearFilter('order')">✕</span>
          </div>
          <div class="popup-sel-row" @click="openSelectModal('order')">
            <span v-if="filterOrder" class="popup-sel-name">{{ filterOrder.orderId }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="filterOrder" class="popup-sel-id">{{ filterOrder.userNm }}</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>
      </div>
    </div>

  </div><!-- /admin-body -->

  <!-- 선택 모달들 -->
  <site-select-modal v-if="selectModal.show && selectModal.type==='site'" :disp-dataset="adminData" @select="onSelectItem('site', $event)" @close="closeSelectModal" />
  <vendor-select-modal v-if="selectModal.show && selectModal.type==='vendor'" :disp-dataset="adminData" @select="onSelectItem('vendor', $event)" @close="closeSelectModal" />
  <vendor-select-modal v-if="selectModal.show && selectModal.type==='dlivVendor'" :disp-dataset="adminData" @select="onSelectItem('dlivVendor', $event)" @close="closeSelectModal" />
  <admin-user-select-modal v-if="selectModal.show && selectModal.type==='adminUser'" :disp-dataset="adminData" @select="onSelectItem('adminUser', $event)" @close="closeSelectModal" />
  <member-select-modal v-if="selectModal.show && selectModal.type==='member'" :disp-dataset="adminData" @select="onSelectItem('member', $event)" @close="closeSelectModal" />
  <order-select-modal v-if="selectModal.show && selectModal.type==='order'" :disp-dataset="adminData" @select="onSelectItem('order', $event)" @close="closeSelectModal" />

  <!-- 참조 모달 -->
  <admin-ref-modal v-if="refModal && refModal.show" :state="refModal" :admin-data="adminData" @close="closeRefModal" />

  <!-- Confirm -->
  <div v-if="confirmState && confirmState.show" class="modal-overlay" @click.self="closeConfirm(false)">
    <div class="confirm-box">
      <div class="confirm-icon">💾</div>
      <div class="confirm-title">{{ confirmState.title }}</div>
      <div class="confirm-msg">{{ confirmState.msg }}</div>
      <!-- 상세 배지 (details 있을 때만) -->
      <div v-if="confirmState.details && confirmState.details.length" class="confirm-details">
        <span v-for="d in confirmState.details" :key="d.label"
          class="badge confirm-detail-badge" :class="d.cls">{{ d.label }}</span>
      </div>
      <div class="confirm-actions">
        <button class="btn btn-secondary" @click="closeConfirm(false)">{{ confirmState.btnCancel }}</button>
        <button class="btn btn-primary" @click="closeConfirm(true)">{{ confirmState.btnOk }}</button>
      </div>
    </div>
  </div>

  <!-- Toast 누적 스택 -->
  <div class="toast-container">
    <div v-for="t in toasts" :key="t.id"
      class="toast-item" :class="'toast-'+t.type"
      @click="closeToast(t.id)">
      <span class="toast-icon">{{ t.type==='error' ? '✕' : t.type==='warning' ? '⚠' : t.type==='info' ? 'ℹ' : '✓' }}</span>
      <span class="toast-msg">{{ t.msg }}</span>
      <span class="toast-close-x">✕</span>
      <div v-if="!t.persistent" class="toast-progress"></div>
    </div>
  </div>

  <!-- API 응답 패널 -->
  <div v-if="apiResPanel && apiResPanel.show" style="position:fixed;bottom:20px;right:20px;z-index:8900;width:440px;max-height:55vh;background:#1e1e2e;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.4);display:flex;flex-direction:column;overflow:hidden;">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#2a2a3e;flex-shrink:0;">
      <span style="font-size:12px;font-weight:700;color:#fff;display:flex;align-items:center;gap:8px;">
        API 응답
        <span v-if="apiResPanel.res" :style="{padding:'2px 8px',borderRadius:'10px',fontSize:'11px',fontWeight:'600',background:apiResPanel.res.ok?'#166534':'#7f1d1d',color:apiResPanel.res.ok?'#4ade80':'#f87171'}">
          {{ apiResPanel.res.ok ? '✓ 성공' : '✕ 오류' }}
          <template v-if="apiResPanel.res.status"> · HTTP {{ apiResPanel.res.status }}</template>
        </span>
      </span>
      <button @click="closeApiResPanel" style="background:none;border:none;color:#888;cursor:pointer;font-size:16px;line-height:1;padding:2px 4px;" title="닫기">✕</button>
    </div>
    <div style="overflow-y:auto;padding:12px 14px;flex:1;">
      <pre style="margin:0;font-size:11px;color:#e2e8f0;white-space:pre-wrap;word-break:break-all;line-height:1.6;">{{ JSON.stringify(apiResPanel.res, null, 2) }}</pre>
    </div>
  </div>

  <!-- 탭 컨텍스트 메뉴 -->
  <div v-if="ctxMenu && ctxMenu.show"
    class="tab-ctx-menu"
    :style="{left: ctxMenu.x+'px', top: ctxMenu.y+'px'}"
    @click.stop>
    <div class="tab-ctx-item" @click="ctxClose">현재 닫기</div>
    <div class="tab-ctx-item" @click="ctxCloseLeft">왼쪽 닫기</div>
    <div class="tab-ctx-item" @click="ctxCloseRight">오른쪽 닫기</div>
    <div class="tab-ctx-item" @click="ctxCloseOthers">기타 닫기</div>
    <div class="tab-ctx-sep"></div>
    <div class="tab-ctx-item" @click="ctxCloseAll">전체 닫기</div>
    <div class="tab-ctx-sep"></div>
    <div class="tab-ctx-item" @click="ctxNewWindow">↗ 새창</div>
    <div class="tab-ctx-item" @click="ctxRefresh">↺ 새로고침</div>
  </div>

  <!-- 프로필 모달 -->
  <div v-if="profileModal && profileModal.show" class="modal-overlay" @click.self="profileModal.show=false">
    <div class="modal-box" style="max-width:440px;">
      <div class="modal-header">
        <span class="modal-title">🙍 프로필</span>
        <span class="modal-close" @click="profileModal.show=false">✕</span>
      </div>
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding:14px;background:#fff5f7;border-radius:10px;">
        <div style="width:54px;height:54px;border-radius:50%;background:#e8587a;color:#fff;font-size:22px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">{{ currentUser?.name[0] }}</div>
        <div>
          <div style="font-size:15px;font-weight:700;color:#1a1a2e;">{{ currentUser?.name }}</div>
          <div style="font-size:12px;color:#e8587a;font-weight:600;margin-top:3px;">{{ currentUser?.role }}</div>
          <div style="font-size:11px;color:#aaa;margin-top:2px;">가입일: {{ currentUser?.regDate }}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">이름 <span class="req">*</span></label>
          <input class="form-control" v-model="profileForm.name" placeholder="이름" />
        </div>
        <div class="form-group">
          <label class="form-label">연락처</label>
          <input class="form-control" v-model="profileForm.phone" placeholder="010-0000-0000" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">이메일</label>
        <div class="readonly-field">{{ profileForm.email }}</div>
      </div>
      <div class="form-group">
        <label class="form-label">부서</label>
        <input class="form-control" v-model="profileForm.dept" placeholder="부서명" />
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="saveProfile">저장</button>
        <button class="btn btn-secondary" @click="profileModal.show=false">취소</button>
      </div>
    </div>
  </div>

  <!-- 비밀번호 변경 모달 -->
  <div v-if="pwModal && pwModal.show" class="modal-overlay" @click.self="pwModal.show=false">
    <div class="modal-box" style="max-width:380px;">
      <div class="modal-header">
        <span class="modal-title">🔑 비밀번호 변경</span>
        <span class="modal-close" @click="pwModal.show=false">✕</span>
      </div>
      <div class="form-group">
        <label class="form-label">현재 비밀번호 <span class="req">*</span></label>
        <input class="form-control" type="password" v-model="pwForm.current" placeholder="현재 비밀번호" autocomplete="current-password" />
      </div>
      <div class="form-group">
        <label class="form-label">새 비밀번호 <span class="req">*</span></label>
        <input class="form-control" type="password" v-model="pwForm.next" placeholder="새 비밀번호 (6자 이상)" autocomplete="new-password" />
      </div>
      <div class="form-group">
        <label class="form-label">새 비밀번호 확인 <span class="req">*</span></label>
        <input class="form-control" type="password" v-model="pwForm.confirm" placeholder="새 비밀번호 재입력" @keyup.enter="savePwChange" autocomplete="new-password" />
      </div>
      <div v-if="pwError" class="login-error">{{ pwError }}</div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="savePwChange">변경</button>
        <button class="btn btn-secondary" @click="pwModal.show=false">취소</button>
      </div>
    </div>
  </div>

  <!-- 로그인 / 회원가입 모달 -->
  <div v-if="loginModal && loginModal.show" class="modal-overlay" @click.self="closeLogin">
    <div class="login-modal-box">
      <div class="login-modal-header">
        <div class="login-tabs">
          <span :class="{active: loginModal.tab==='login'}"    @click="loginModal.tab='login';    loginError=''">로그인</span>
          <span :class="{active: loginModal.tab==='register'}" @click="loginModal.tab='register'; loginError=''">회원가입</span>
        </div>
        <span class="modal-close" @click="closeLogin">✕</span>
      </div>

      <!-- 로그인 폼 -->
      <div v-if="loginModal.tab==='login'">
        <div class="form-group">
          <label class="form-label">이메일</label>
          <input class="form-control" v-model="loginForm.email" placeholder="이메일 입력" @keyup.enter="doLogin" autocomplete="email" />
        </div>
        <div class="form-group">
          <label class="form-label">비밀번호</label>
          <input class="form-control" type="password" v-model="loginForm.password" placeholder="비밀번호 입력" @keyup.enter="doLogin" autocomplete="current-password" />
        </div>
        <div class="form-group">
          <label class="form-label">인증방식</label>
          <div class="auth-methods">
            <label v-for="m in AUTH_METHODS" :key="m"
              class="auth-method-item" :class="{active: loginForm.authMethod===m}">
              <input type="radio" :value="m" v-model="loginForm.authMethod" style="display:none" />
              {{ m }}
            </label>
          </div>
        </div>
        <div v-if="loginError" class="login-error">{{ loginError }}</div>
        <button class="btn btn-primary" style="width:100%;margin-top:4px;" @click="doLogin">로그인</button>
        <div style="text-align:center;margin-top:12px;font-size:12px;color:#aaa;">
          <span>계정이 없으신가요?</span>
          <span style="color:#e8587a;cursor:pointer;margin-left:6px;font-weight:600;" @click="loginModal.tab='register';loginError=''">회원가입</span>
        </div>
        <div style="margin-top:14px;padding:10px 12px;background:#f8f9fa;border-radius:6px;font-size:11px;color:#888;">
          <div style="font-weight:700;margin-bottom:6px;color:#555;">테스트 계정 <span style="font-weight:400;color:#aaa;">(클릭 시 자동 로그인)</span></div>
          <div style="display:flex;flex-direction:column;gap:4px;max-height:420px;overflow:auto;">
            <button v-for="u in adminData.adminUsers" :key="u.adminUserId" type="button" @click="quickLogin(u.email)"
              style="display:grid;grid-template-columns:200px 32px 1fr;align-items:center;gap:10px;padding:7px 10px;font-size:12px;background:#fff;border:1px solid #e5e7eb;border-radius:6px;cursor:pointer;color:#444;text-align:left;transition:all .12s;"
              onmouseover="this.style.background='#ffe4ec';this.style.borderColor='#e8587a';"
              onmouseout="this.style.background='#fff';this.style.borderColor='#e5e7eb';">
              <span style="font-weight:600;color:#374151;">{{ u.email }}</span>
              <span style="display:inline-block;text-align:center;background:#e8587a;color:#fff;border-radius:10px;padding:1px 6px;font-size:10px;font-weight:700;">{{ rolesOfUser(u.adminUserId).length }}</span>
              <span style="color:#6b7280;font-size:10.5px;line-height:1.5;white-space:normal;display:flex;flex-direction:column;gap:2px;">
                <span v-for="(r, i) in rolesOfUser(u.adminUserId)" :key="i">• {{ rolePath(r, u.adminUserId) }}</span>
                <span v-if="bizInfoOfUser(u.adminUserId)" style="margin-top:2px;color:#2563eb;font-weight:600;">{{ bizInfoOfUser(u.adminUserId) }}</span>
              </span>
            </button>
          </div>
          <div style="margin-top:6px;color:#aaa;">비밀번호는 모두 <code style="background:#eef;padding:1px 4px;border-radius:3px;">demo1234</code></div>
        </div>
      </div>

      <!-- 회원가입 폼 -->
      <div v-if="loginModal.tab==='register'">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">이름 <span class="req">*</span></label>
            <input class="form-control" v-model="regForm.name" placeholder="이름" />
          </div>
          <div class="form-group">
            <label class="form-label">연락처</label>
            <input class="form-control" v-model="regForm.phone" placeholder="010-0000-0000" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">이메일 <span class="req">*</span></label>
          <input class="form-control" v-model="regForm.email" placeholder="이메일 입력" autocomplete="email" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">비밀번호 <span class="req">*</span></label>
            <input class="form-control" type="password" v-model="regForm.password" placeholder="비밀번호" />
          </div>
          <div class="form-group">
            <label class="form-label">비밀번호 확인 <span class="req">*</span></label>
            <input class="form-control" type="password" v-model="regForm.confirmPw" placeholder="재입력" @keyup.enter="doRegister" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">역할</label>
          <select class="form-control" v-model="regForm.role">
            <option>슈퍼관리자</option><option>관리자</option><option>운영자</option><option>영업관리자</option><option>일반사용자</option>
          </select>
        </div>
        <div v-if="loginError" class="login-error">{{ loginError }}</div>
        <button class="btn btn-primary" style="width:100%;margin-top:4px;" @click="doRegister">가입하기</button>
        <div style="text-align:center;margin-top:12px;font-size:12px;color:#aaa;">
          <span>이미 계정이 있으신가요?</span>
          <span style="color:#e8587a;cursor:pointer;margin-left:6px;font-weight:600;" @click="loginModal.tab='login';loginError=''">로그인</span>
        </div>
      </div>
    </div>
  </div>
</div>
`,
  })
  /* ── pages/base/ ── */
  .component('AdminError404',        window.adminError404)
  .component('AdminError401',        window.adminError401)
  .component('AdminError500',        window.adminError500)
  /* ── components/disp/ (전시 핵심 컴포넌트) ── */
  .component('DispX01Ui',        window.DispX01Ui)
  .component('DispX02Area',      window.DispX02Area)
  .component('DispX03Panel',     window.DispX03Panel        || { template: '<div/>' })
  .component('DispX04Widget',    window.DispX04Widget       || { template: '<div/>' })
  .component('BarcodeWidget',   window.BarcodeWidget   || { template: '<div/>' })
  .component('CountdownWidget', window.CountdownWidget || { template: '<div/>' })
  /* ── components/comp/ (공통 컴포넌트) ── */
  .component('BaseAttachGrp',  window.BaseAttachGrp)
  /* ── pages/admin/ (공통) ── */
  .component('AdminRefModal',  window.AdminRefModal)
  /* ── pages/admin/ec/ — 회원 ── */
  .component('MbMemberMng',    window.MbMemberMng)
  .component('MbMemberDtl',    window.MbMemberDtl)
  .component('MbMemberHist',   window.MbMemberHist)
  .component('MbMemGradeMng',  window.MbMemGradeMng)
  .component('MbMemGroupMng',  window.MbMemGroupMng)
  /* ── pages/admin/ec/ — 상품 ── */
  .component('PdProdMng',      window.PdProdMng)
  .component('PdProdDtl',      window.PdProdDtl)
  .component('PdProdHist',     window.PdProdHist)
  .component('PdDlivTmpltMng', window.PdDlivTmpltMng)
  .component('PdBundleMng',    window.PdBundleMng)
  .component('PdSetMng',       window.PdSetMng)
  .component('PdReviewMng',    window.PdReviewMng)
  .component('PdQnaMng',       window.PdQnaMng)
  .component('PdRestockNotiMng', window.PdRestockNotiMng)
  .component('PdTagMng',       window.PdTagMng)
  /* ── pages/admin/ec/ — 주문 ── */
  .component('OdOrderMng',     window.OdOrderMng)
  .component('OdOrderDtl',     window.OdOrderDtl)
  .component('OdOrderHist',    window.OdOrderHist)
  /* ── pages/admin/ec/ — 클레임 ── */
  .component('OdClaimMng',     window.OdClaimMng)
  .component('OdClaimDtl',     window.OdClaimDtl)
  .component('OdClaimHist',    window.OdClaimHist)
  /* ── pages/admin/ec/ — 배송 ── */
  .component('OdDlivMng',      window.OdDlivMng)
  .component('OdDlivDtl',      window.OdDlivDtl)
  .component('OdDlivHist',     window.OdDlivHist)
  /* ── pages/admin/ec/ — 쿠폰/캐쉬 ── */
  .component('PmCouponMng',    window.PmCouponMng)
  .component('PmCouponDtl',    window.PmCouponDtl)
  .component('PmCacheMng',     window.PmCacheMng)
  .component('PmCacheDtl',     window.PmCacheDtl)
  /* ── pages/admin/ec/ — 전시관리 ── */
  .component('DpDispPanelMng',        window.DpDispPanelMng)
  .component('DpDispPanelDtl',        window.DpDispPanelDtl)
  .component('DpDispAreaMng',         window.DpDispAreaMng)
  .component('DpDispAreaDtl',         window.DpDispAreaDtl)
  .component('DpDispUiMng',           window.DpDispUiMng)
  .component('DpDispUiDtl',           window.DpDispUiDtl)
  .component('DpDispWidgetMng',       window.DpDispWidgetMng)
  .component('DpDispWidgetDtl',       window.DpDispWidgetDtl)
  .component('DpDispUiPreview',       window.DpDispUiPreview)
  .component('DpDispUiSimul',         window.DpDispUiSimul)
  .component('DpDispPanelPreview',    window.DpDispPanelPreview)
  .component('DpDispWidgetPreview',   window.DpDispWidgetPreview)
  .component('DpDispAreaPreview',     window.DpDispAreaPreview)
  .component('DpDispWidgetLibMng',    window.DpDispWidgetLibMng)
  .component('DpDispWidgetLibDtl',    window.DpDispWidgetLibDtl)
  .component('DpDispWidgetLibPreview',window.DpDispWidgetLibPreview)
  .component('DpDispRelationMng',      window.DpDispRelationMng)
  /* ── pages/admin/ec/ — 카테고리 ── */
  .component('PdCategoryMng',  window.PdCategoryMng)
  .component('PdCategoryDtl',  window.PdCategoryDtl)
  .component('PdCategoryProdMng', window.PdCategoryProdMng)
  /* ── pages/admin/ec/ — 이벤트/공지 ── */
  .component('PmEventMng',     window.PmEventMng)
  .component('PmEventDtl',     window.PmEventDtl)
  .component('PmPlanMng',      window.PmPlanMng)
  .component('PmPlanDtl',      window.PmPlanDtl)
  .component('PmDiscntMng',    window.PmDiscntMng)
  .component('PmDiscntDtl',    window.PmDiscntDtl)
  .component('PmSaveMng',      window.PmSaveMng)
  .component('PmSaveDtl',      window.PmSaveDtl)
  .component('PmGiftMng',      window.PmGiftMng)
  .component('PmGiftDtl',      window.PmGiftDtl)
  .component('PmVoucherMng',   window.PmVoucherMng)
  .component('PmVoucherDtl',   window.PmVoucherDtl)
  /* ── pages/admin/ec/st/ — 정산관리 ── */
  .component('StConfigMng',       window.StConfigMng)
  .component('StRawMng',          window.StRawMng)
  .component('StSettleAdjMng',    window.StSettleAdjMng)
  .component('StSettleEtcAdjMng', window.StSettleEtcAdjMng)
  .component('StSettleCloseMng',  window.StSettleCloseMng)
  .component('StSettlePayMng',    window.StSettlePayMng)
  .component('StStatusMng',       window.StStatusMng)
  .component('StReconOrderMng',   window.StReconOrderMng)
  .component('StReconPayMng',     window.StReconPayMng)
  .component('StReconClaimMng',   window.StReconClaimMng)
  .component('StReconVendorMng',  window.StReconVendorMng)
  .component('StErpGenMng',       window.StErpGenMng)
  .component('StErpViewMng',      window.StErpViewMng)
  .component('StErpReconMng',     window.StErpReconMng)
  .component('CmNoticeMng',    window.CmNoticeMng)
  .component('CmNoticeDtl',    window.CmNoticeDtl)
  /* ── pages/admin/ec/ — 채팅/고객 ── */
  .component('CmChattMng',     window.CmChattMng)
  .component('CmChattDtl',     window.CmChattDtl)
  .component('MbCustInfoMng',  window.MbCustInfoMng)
  /* ── pages/admin/sy/ — 대시보드 ── */
  .component('SyDashboardMng', window.SyDashboardMng)
  .component('DashboardAdminEc01', window.DashboardAdminEc01)
  .component('DashboardAdminEc02', window.DashboardAdminEc02)
  .component('DashboardAdminEc03', window.DashboardAdminEc03)
  /* ── pages/admin/sy/ — 사용자/권한/조직 ── */
  .component('SyUserMng',      window.SyUserMng)
  .component('SyUserDtl',      window.SyUserDtl)
  .component('SyDeptMng',      window.SyDeptMng)
  .component('SyMenuMng',      window.SyMenuMng)
  .component('SyRoleMng',      window.SyRoleMng)
  /* ── pages/admin/sy/ — 사이트/코드/브랜드 ── */
  .component('SySiteMng',      window.SySiteMng)
  .component('SySiteDtl',      window.SySiteDtl)
  .component('SyCodeMng',      window.SyCodeMng)
  .component('SyCodeDtl',      window.SyCodeDtl)
  .component('SyBrandMng',     window.SyBrandMng)
  /* ── pages/admin/sy/ — 템플릿/업체/첨부 ── */
  .component('SyTemplateMng',  window.SyTemplateMng)
  .component('SyTemplateDtl',  window.SyTemplateDtl)
  .component('SyVendorMng',    window.SyVendorMng)
  .component('SyBizMng',       window.SyBizMng)
  .component('SyBizUserMng',   window.SyBizUserMng)
  .component('SyVendorDtl',    window.SyVendorDtl)
  .component('SyAttachMng',    window.SyAttachMng)
  /* ── pages/admin/sy/ — 배치 ── */
  .component('SyBatchMng',     window.SyBatchMng)
  .component('SyBatchDtl',     window.SyBatchDtl)
  .component('SyBatchHist',    window.SyBatchHist)
  /* ── pages/admin/sy/ — 알림/게시판/문의 ── */
  .component('SyAlarmMng',     window.SyAlarmMng)
  .component('SyPropMng',      window.SyPropMng)
  .component('SyPathMng',      window.SyPathMng)
  .component('SyI18nMng',      window.SyI18nMng)
  .component('PathTreeNode',   window.PathTreeNode)
  .component('PathParentSelector', window.PathParentSelector)
  .component('PathPickModal',  window.PathPickModal)
  .component('BizPickModal',   window.BizPickModal)
  .component('SimpleUserPickModal', window.SimpleUserPickModal)
  .component('PathPickTreeNode', window.PathPickTreeNode)
  .component('PropTreeNode',   window.PropTreeNode)
  .component('SyAlarmDtl',     window.SyAlarmDtl)
  .component('SyBbmMng',       window.SyBbmMng)
  .component('SyBbmDtl',       window.SyBbmDtl)
  .component('SyBbsMng',       window.SyBbsMng)
  .component('SyBbsDtl',       window.SyBbsDtl)
  .component('SyContactMng',   window.SyContactMng)
  .component('SyContactDtl',   window.SyContactDtl)
  .component('CmBltnMng',      window.CmBltnMng)
  /* ── components/modals/ — 선택 모달 ── */
  .component('AdminUserSelectModal', window.AdminUserSelectModal)
  .component('BbmSelectModal',       window.BbmSelectModal)
  .component('MemberSelectModal',    window.MemberSelectModal)
  .component('OrderSelectModal',     window.OrderSelectModal)
  .component('SiteSelectModal',      window.SiteSelectModal)
  .component('VendorSelectModal',    window.VendorSelectModal)
  /* ── components/modals/ — 트리 모달 ── */
  .component('CategoryTreeModal',    window.CategoryTreeModal)
  .component('DeptTreeModal',        window.DeptTreeModal)
  .component('MenuTreeModal',        window.MenuTreeModal)
  .component('RoleTreeModal',        window.RoleTreeModal)
  /* ── components/modals/ — 미리보기/전송 모달 ── */
  .component('DispPreviewModal',     window.DispPreviewModal || { template: '<div/>' })
  .component('DispUiModal',          window.DispUiModal      || { template: '<div/>' })
  .component('WidgetLibPickModal',   window.WidgetLibPickModal || { template: '<div/>' })
  .component('PanelPickModal',       window.PanelPickModal || { template: '<div/>' })
  .component('AreaPickModal',        window.AreaPickModal || { template: '<div/>' })
  .component('RowPickModal',         window.RowPickModal || { template: '<div/>' })
  .component('TemplatePreviewModal',  window.TemplatePreviewModal)
  .component('TemplateSendModal',     window.TemplateSendModal)
  .component('SyMemberLoginHist',     window.SyMemberLoginHist)
  .component('SyUserLoginHist',       window.SyUserLoginHist)
  .component('SyPostman',             window.SyPostman)
  .mount('#app');

  const loadingEl = document.getElementById('_boot_loading');
  if (loadingEl) {
    loadingEl.classList.add('done');
    setTimeout(() => { if (loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl); }, 350);
  }
})();
