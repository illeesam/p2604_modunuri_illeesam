/* ShopJoy – components/modals/BoModals.js
   BO(Back Office, 관리자) 전용 모달 모음. bo.html 에서만 로드.
   FO 모달은 components/modals/FoModals.js 참조.

   ───────────────────────────────────────────────────────────────────────
   정의된 컴포넌트 (33개) — 태그는 kebab-case (예: <site-select-modal>)
   ※ 모든 모달의 template 최상위는 <bo-modal> 사용 (BoAreaComp.js)

   [인증 모달] — boApp.js 로그인/마이 화면용. 상태/액션은 parent(boApp.js) 소유, 모달은 dumb-view
     AuthLoginModal         — 로그인 / 회원가입 (loginModal/loginForm/regForm props, do-login/do-register emit)
     AuthPwChangeModal      — 비밀번호 변경 (pwForm props, save emit)
     AuthUserPickModal      — 사용자 선택 로그인(개발용) (userPickModal props, pick emit)
     AuthProfileModal       — 프로필 (profileForm/profileImg props, save/img-change/img-remove emit)

   [선택/피커 모달]
     SiteSelectModal        — 사이트 선택
     VendorSelectModal      — 판매업체 선택 (서버 페이지 + 검색)
     BoUserSelectModal      — 사용자 선택 (부서트리 + 멀티)
     MemberSelectModal      — 회원 선택
     OrderSelectModal       — 주문 선택
     BbmSelectModal         — 게시판 선택
     CategorySelectModal    — 카테고리 선택
     RowPickModal           — 위젯 행(row) 선택
     WidgetLibPickModal     — 위젯 라이브러리 선택
     PathPickModal          — 표시경로 선택  (+ PathPickTreeNode 재귀 노드)
     BizPickModal           — 업체 선택
     SimpleUserPickModal    — 간단 사용자 선택
     SimpleVendorPickModal  — 간단 판매업체 선택 (prop vendors 배열, 단건 라디오)
     SimpleProdPickModal    — 간단 상품 선택 (prop prods 배열, 다중 체크박스)
     OdMemberPickModal      — 주문/클레임/배송/장바구니 회원 선택 (서버 페이지 + multiCheck)

   [트리 모달]
     RoleTreeModal          — 역할 트리
     MenuTreeModal          — 메뉴 트리
     DeptTreeModal          — 부서 트리
     CategoryTreeModal      — 카테고리 트리

   [템플릿]
     TemplatePreviewModal   — 템플릿 미리보기
     TemplateSendModal      — 템플릿 발송

   [전시 미리보기]
     DispPreviewModal       — 전시 미리보기
     DispUiModal            — 전시 UI 미리보기

   [참조/공통코드]
     BoRefModal             — 회원/상품/주문/클레임/쿠폰 참조 상세 (showRefModal 헬퍼)
     BoCodeGrpModal         — 공통코드 그룹 미리보기 (+ BoCodeGrpTreeNode 재귀 노드)

   (재귀 노드: PathPickTreeNode — PathPickModal 내부 + 직접 사용 가능)
                BoCodeGrpTreeNode — BoCodeGrpModal 내부에서 사용)
   ───────────────────────────────────────────────────────────────────────

   ───────────────────────────────────────────────────────────────────────
   [공통 props: reloadTrigger]
   ───────────────────────────────────────────────────────────────────────
   목적: 모달이 열려있는 상태에서 부모가 외부 변화에 따라
         "지금 다시 조회하라"는 신호를 보내고 싶을 때 사용한다.
         (모달이 keep-alive 되거나, 재마운트 없이 prop만 바뀔 때
          onMounted 가 다시 호출되지 않으므로 별도 트리거가 필요)

   동작: 모달 내부에서 watch(() => props.reloadTrigger, ...) 로 변화를
         감지해 fetch 함수(handleSearchList 등)를 자동 호출한다.

   사용법 (부모):
     const modal = reactive({ show: false, kind: '', reloadTrigger: 0 });

     // openA
     const openA = () => { modal.kind = 'a'; modal.reloadTrigger++; modal.show = true; };

     // openB
     const openB = () => { modal.kind = 'b'; modal.reloadTrigger++; modal.show = true; };

     // refresh
     const refresh = () => { modal.reloadTrigger++; };

   템플릿:
     <some-modal v-if="modal.show"
                 :kind="modal.kind"
                 :reload-trigger="modal.reloadTrigger"
                 @select="..." @close="modal.show=false" />

   주의:
     - 0 → 1 같이 값이 바뀌어야 watch 가 발동한다. ++ 사용 권장.
     - 처음 마운트(onMounted)에서도 fetch 가 한 번 실행되므로,
       reloadTrigger 는 부모가 "다시" 조회시키고 싶을 때만 증가시킨다.
   ───────────────────────────────────────────────────────────────────────
*/

/* ── 공통 모달 ESC 키 핸들러 ───────────────────────────────────
 * 모달 디자인 CSS 는 assets/css/boGlobalStyle{01,02,03}.css 로 이동(2026-05-28).
 * 이 블록에는 키 이벤트(JS) 만 남긴다. */
(() => {
  if (window.__shopjoy_modal_esc_attached__) return;
  window.__shopjoy_modal_esc_attached__ = true;
  /* ESC 키로 최상단 모달 닫기 — overlay 클릭과 동일 효과 */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.click();
  });
})();

/* ══════════════════════════════════════════════════════
   어드민 공통필터 팝업 선택 모달 (5종)
   Props: dispDataset  Emits: select(item), close
   ══════════════════════════════════════════════════════ */

/* ── 사이트 선택 모달 ── */
window.SiteSelectModal = {
  name: 'SiteSelectModal',
  inheritAttrs: false,
  props: {
    dispDataset:   { type: Object,    default: () => ({}) },              // 디스플레이 데이터셋
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const pageSize = 10;
    const pager = reactive({ pageNo: 1, pageSize, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [5, 10, 20, 30, 50]});
    const searchParam = reactive({ searchType: '', searchValue: '' });
    const list = reactive([]);
    const loading = ref(false);

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SiteSelectModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      // 페이지 이동
      } else if (cmd === 'pager-set') {
        return onSetPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SiteSelectModal : handleSelectAction -> ', cmd, param);
      // 사이트 선택
      if (cmd === 'list-select') {
        emit('select', param);
        if (props.onCallback) props.onCallback(props.modalName, null, param);
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* 목록조회 */
    const handleSearchList = async () => {
      loading.value = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, searchValue: searchParam.searchValue || undefined, searchType: searchParam.searchType || undefined };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'siteId,siteCode,siteNm,siteDomain';
        }
        const res = await boApiSvc.sySite.getPage(params, '사이트관리', '목록조회');
        const data = res.data?.data;
        list.splice(0, list.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
      } catch (e) { list.splice(0, list.length); } finally { loading.value = false; }
    };

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => { const s=Math.max(1,pager.pageNo-2),e=Math.min(pager.pageTotalPage,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* handleSearchListWrap */
    const handleSearchListWrap = async () => { await handleSearchList(); fnBuildPagerNums(); };
    onMounted(() => { handleSearchListWrap(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchListWrap(); });

    /* onSetPage */
    const onSetPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchListWrap(); } };

    /* onSizeChange — 페이지사이즈 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchListWrap(); };
    /* pageSizes 보강 (BoPager 가 요구) */
    if (!pager.pageSizes) pager.pageSizes = [5, 10, 20, 30, 50];

    /* baseSearchColumns — 검색 영역 컬럼 */
    const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck',
        options: [
          { value: 'siteId',     label: '사이트번호' },
          { value: 'siteCode',   label: '사이트코드' },
          { value: 'siteNm',     label: '사이트명' },
          { value: 'siteDomain', label: '도메인' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', placeholder: '검색어 입력' },
    ];

    /* listGridColumns — BoGrid 컬럼 정의 */
    const listGridColumns = [
      { key: 'siteNm',   label: '사이트명', cellStyle: 'font-weight:600;color:#1a1a2e;', fmt: (v) => v || '-' },
      { key: 'siteCode', label: '사이트코드', mono: true, cellStyle: 'color:#888;font-size:11px;', fmt: (v) => v || '-' },
      { key: 'siteId',   label: '사이트번호', align: 'right', cellStyle: 'font-family:monospace;font-weight:700;color:#e8587a;', fmt: (v) => String(v).padStart(2, '0') },
    ];

    return {
      cfSiteNm, searchParam, list, loading, pager,                          // 데이터
      baseSearchColumns, listGridColumns,                                    // 컬럼 정의
      onSetPage, onSizeChange,                                               // BoPager 콜백
      handleBtnAction, handleSelectAction,                                  // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" @close="handleBtnAction('modal-close')">
  <div class="modal-header" style="margin:-20px -20px 14px -20px;">
    <span class="modal-title">
      사이트 선택
      <span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">
        {{ cfSiteNm }}
      </span>
      <span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:#e5e7eb;color:#555;font-size:11px;text-align:center;line-height:16px;margin-left:8px;cursor:help;font-weight:700;"
        :title="['사이트번호 : 프로그램 작업코드 (01, 02, 03…)','사이트코드 : 라이선스코드 (ST0001 형식)'].join(String.fromCharCode(10))">
        ?
      </span>
    </span>
    <span class="modal-close" @click="handleBtnAction('modal-close')">
      ✕
    </span>
  </div>
  <bo-search-area :columns="baseSearchColumns" :param="searchParam"
    @search="handleBtnAction('pager-set', 1)" />
  <bo-grid :columns="listGridColumns" :rows="list" :pager="pager" row-key="siteId"
    :list-title="'총 ' + pager.pageTotalCount + '건'" row-clickable :row-actions="true"
    :empty-text="loading ? '로딩 중...' : '검색 결과가 없습니다.'"
    @row-click="row => handleSelectAction('list-select', row)">
    <template #row-actions="{ row }">
      <button class="btn btn_select" @click.stop="handleSelectAction('list-select', row)">
        선택
      </button>
    </template>
  </bo-grid>
  <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChange" />
</bo-modal>
`,
};

/* ── 판매업체 선택 모달 ── */
window.VendorSelectModal = {
  name: 'VendorSelectModal',
  inheritAttrs: false,
  props: {
    dispDataset:   { type: Object,    default: () => ({}) },              // 디스플레이 데이터셋
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const pageSize = 8;
    const pager = reactive({ pageNo: 1, pageSize, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [5, 10, 20, 30, 50]});
    const searchParam = reactive({ searchType: '', searchValue: '' });
    const list = reactive([]);
    const loading = ref(false);

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ VendorSelectModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      // 페이지 이동
      } else if (cmd === 'pager-set') {
        return onSetPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ VendorSelectModal : handleSelectAction -> ', cmd, param);
      // 업체 선택
      if (cmd === 'list-select') {
        emit('select', param);
        if (props.onCallback) props.onCallback(props.modalName, null, param);
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* 목록조회 */
    const handleSearchList = async () => {
      loading.value = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, searchValue: searchParam.searchValue || undefined, searchType: searchParam.searchType || undefined };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'vendorNm,corpNo';
        }
        const res = await boApiSvc.syVendor.getPage(params, '판매자관리', '목록조회');
        const data = res.data?.data;
        list.splice(0, list.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
      } catch (e) { list.splice(0, list.length); } finally { loading.value = false; }
    };

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => { const s=Math.max(1,pager.pageNo-2),e=Math.min(pager.pageTotalPage,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* handleSearchListWrap */
    const handleSearchListWrap = async () => { await handleSearchList(); fnBuildPagerNums(); };
    onMounted(() => { handleSearchListWrap(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchListWrap(); });

    /* onSetPage */
    const onSetPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchListWrap(); } };

    /* baseSearchColumns — 검색 영역 컬럼 */
    const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck',
        options: [
          { value: 'vendorNm', label: '업체명' },
          { value: 'corpNo',   label: '사업자번호' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', placeholder: '검색어 입력' },
    ];

    /* listGridColumns — BoGrid 컬럼 정의 */
    const listGridColumns = [
      { key: 'vendorNm', label: '업체명', cellStyle: 'font-weight:600;color:#1a1a2e;', fmt: (v) => v || '-' },
      { key: 'vendorId', label: 'ID', mono: true, cellStyle: 'color:#888;font-size:11px;', fmt: (v) => v || '-' },
    ];

    return {
      cfSiteNm, searchParam, list, loading, pager,                          // 데이터
      baseSearchColumns, listGridColumns,                                    // 컬럼 정의
      onSetPage,                                                             // BoGrid pager 콜백
      handleBtnAction, handleSelectAction,                                  // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" @close="handleBtnAction('modal-close')">
  <div class="modal-header" style="margin:-20px -20px 14px -20px;">
    <span class="modal-title">
      판매업체 선택
      <span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">
        {{ cfSiteNm }}
      </span>
    </span>
    <span class="modal-close" @click="handleBtnAction('modal-close')">
      ✕
    </span>
  </div>
  <bo-search-area :columns="baseSearchColumns" :param="searchParam"
    @search="handleBtnAction('pager-set', 1)" />
  <bo-grid :columns="listGridColumns" :rows="list" :pager="pager" row-key="vendorId"
    :list-title="'총 ' + pager.pageTotalCount + '건'" row-clickable :row-actions="true"
    :empty-text="loading ? '로딩 중...' : '검색 결과가 없습니다.'"
    @row-click="row => handleSelectAction('list-select', row)">
    <template #row-actions="{ row }">
      <button class="btn btn_select" @click.stop="handleSelectAction('list-select', row)">
        선택
      </button>
    </template>
  </bo-grid>
  <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="() => onSetPage(1)" />
</bo-modal>
`,
};

/* ── 브랜드 선택 모달 (단건 선택, VendorSelectModal 패턴) ── */
window.BrandSelectModal = {
  name: 'BrandSelectModal',
  inheritAttrs: false,
  props: {
    dispDataset:   { type: Object,    default: () => ({}) },              // 디스플레이 데이터셋
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const pageSize = 8;
    const pager = reactive({ pageNo: 1, pageSize, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [5, 10, 20, 30, 50]});
    const searchParam = reactive({ searchType: '', searchValue: '' });
    const list = reactive([]);
    const loading = ref(false);

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BrandSelectModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      // 페이지 이동
      } else if (cmd === 'pager-set') {
        return onSetPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BrandSelectModal : handleSelectAction -> ', cmd, param);
      // 브랜드 선택
      if (cmd === 'list-select') {
        emit('select', param);
        if (props.onCallback) props.onCallback(props.modalName, null, param);
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* 목록조회 */
    const handleSearchList = async () => {
      loading.value = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, searchValue: searchParam.searchValue || undefined, searchType: searchParam.searchType || undefined };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'brandCode,brandNm,brandEnNm';
        }
        const res = await boApiSvc.syBrand.getPage(params, '브랜드관리', '목록조회');
        const data = res.data?.data;
        list.splice(0, list.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
      } catch (e) { list.splice(0, list.length); } finally { loading.value = false; }
    };

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => { const s=Math.max(1,pager.pageNo-2),e=Math.min(pager.pageTotalPage,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* handleSearchListWrap */
    const handleSearchListWrap = async () => { await handleSearchList(); fnBuildPagerNums(); };
    onMounted(() => { handleSearchListWrap(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchListWrap(); });

    /* onSetPage */
    const onSetPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchListWrap(); } };

    /* baseSearchColumns — 검색 영역 컬럼 */
    const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck',
        options: [
          { value: 'brandNm',   label: '브랜드명' },
          { value: 'brandCode', label: '브랜드코드' },
          { value: 'brandEnNm', label: '영문명' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', placeholder: '검색어 입력' },
    ];

    /* listGridColumns — BoGrid 컬럼 정의 */
    const listGridColumns = [
      { key: 'brandNm',   label: '브랜드명', cellStyle: 'font-weight:600;color:#1a1a2e;', fmt: (v) => v || '-' },
      { key: 'brandCode', label: '코드', mono: true, cellStyle: 'color:#888;font-size:11px;', fmt: (v) => v || '-' },
      { key: 'brandId',   label: 'ID', mono: true, cellStyle: 'color:#aaa;font-size:11px;', fmt: (v) => v || '-' },
    ];

    return {
      cfSiteNm, searchParam, list, loading, pager,                          // 데이터
      baseSearchColumns, listGridColumns,                                    // 컬럼 정의
      onSetPage,                                                             // BoGrid pager 콜백
      handleBtnAction, handleSelectAction,                                  // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" @close="handleBtnAction('modal-close')">
  <div class="modal-header" style="margin:-20px -20px 14px -20px;">
    <span class="modal-title">
      브랜드 선택
      <span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">
        {{ cfSiteNm }}
      </span>
    </span>
    <span class="modal-close" @click="handleBtnAction('modal-close')">
      ✕
    </span>
  </div>
  <bo-search-area :columns="baseSearchColumns" :param="searchParam"
    @search="handleBtnAction('pager-set', 1)" />
  <bo-grid :columns="listGridColumns" :rows="list" :pager="pager" row-key="brandId"
    :list-title="'총 ' + pager.pageTotalCount + '건'" row-clickable :row-actions="true"
    :empty-text="loading ? '로딩 중...' : '검색 결과가 없습니다.'"
    @row-click="row => handleSelectAction('list-select', row)">
    <template #row-actions="{ row }">
      <button class="btn btn_select" @click.stop="handleSelectAction('list-select', row)">
        선택
      </button>
    </template>
  </bo-grid>
  <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="() => onSetPage(1)" />
</bo-modal>
`,
};

/* ── 사용자 선택 모달 (부서트리 + 멀티) ── */
window.BoUserSelectModal = {
  name: 'BoUserSelectModal',
  inheritAttrs: false,
  props: {
    dispDataset:   { type: Object,    default: () => ({}) },              // 디스플레이 데이터셋
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { computed, reactive, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* ##### [01] 초기 변수 정의 #################################################### */

    const depts = reactive([]);                          // 부서 전체
    const deptCounts = reactive({});                     // 부서별 사용자 카운트
    const expanded = reactive(new Set());                // 트리 펼침 상태
    const uiState = reactive({
      loading: false,
      deptSearchValue: '',
      selectedDeptId: null,
    });
    const searchParam = reactive({ searchValue: '' });
    const pager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageNums: [], pageSizes: [5, 10, 20, 30, 50] });
    const userList = reactive([]);                       // 현재 페이지 사용자 목록

    /* ##### [02] 부서 트리 (재귀 빌드) ############################################## */

    /* cfTree — BoDeptTreeNode 가 받는 단일 루트 노드 ("전체") */
    const cfTree = computed(() => {
      const searchVal = uiState.deptSearchValue.trim().toLowerCase();
      const base = searchVal
        ? depts.filter(d => d.useYn === 'Y' && (d.deptNm || '').toLowerCase().includes(searchVal))
        : depts.filter(d => d.useYn === 'Y');

      const build = (parentId) =>
        base.filter(d => (d.parentDeptId || null) === (parentId || null))
          .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
          .map(d => ({ ...d, children: build(d.deptId) }));

      return { deptId: null, deptNm: '전체', children: build(null) };
    });

    /* ##### [03] 데이터 조회 ######################################################## */

    /* fnBuildPagerNums — 페이지 번호 배열 생성 */
    const fnBuildPagerNums = () => {
      const c = pager.pageNo, l = pager.pageTotalPage, s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };

    /* fnLoadDepts — 부서 전체 로드 + 트리 자동 펼침 */
    const fnLoadDepts = async () => {
      try {
        const deptRes = await boApiSvc.syDept.getList({ pageSize: 10000 }, '사용자선택', '부서조회');
        depts.splice(0, depts.length, ...(deptRes.data?.data || []));
        /* 트리 기본 펼침 — 모든 부서 노드 + 루트 ("전체") */
        expanded.clear();
        expanded.add(null);
        depts.forEach(d => expanded.add(d.deptId));
      } catch (e) { depts.splice(0); }
    };

    /* fnLoadDeptCounts — 부서별 사용자 카운트 (ACTIVE 고정) */
    const fnLoadDeptCounts = async () => {
      try {
        const params = { userStatusCd: 'ACTIVE' };
        if (searchParam.searchValue.trim()) params.searchValue = searchParam.searchValue.trim();
        const res = await boApiSvc.syUser.getDeptTreeNodeCounts(params, '사용자선택', '부서별카운트');
        const rows = res.data?.data || [];
        Object.keys(deptCounts).forEach(k => { delete deptCounts[k]; });
        for (const r of rows) { if (r && r.deptId != null) deptCounts[r.deptId] = r.cnt; }
      } catch (e) { /* silent */ }
    };

    /* handleSearchUsers — 사용자 페이지 조회 (ACTIVE 고정) */
    const handleSearchUsers = async () => {
      uiState.loading = true;
      userList.splice(0, userList.length);
      pager.pageTotalCount = 0;
      pager.pageTotalPage = 1;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, userStatusCd: 'ACTIVE' };
        if (searchParam.searchValue.trim()) params.searchValue = searchParam.searchValue.trim();
        if (uiState.selectedDeptId != null) params.deptId = uiState.selectedDeptId;
        const res = await boApiSvc.syUser.getPage(params, '사용자선택', '목록조회');
        const d = res.data?.data;
        userList.splice(0, userList.length, ...(d?.pageList || d?.list || []));
        pager.pageTotalCount = d?.pageTotalCount || 0;
        pager.pageTotalPage = d?.pageTotalPage || 1;
        fnBuildPagerNums();
      } catch (e) { userList.splice(0, userList.length); } finally { uiState.loading = false; }
    };

    /* handleSearchList — 초기/전체 조회 (부서 + 카운트 + 사용자) */
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        await Promise.all([fnLoadDepts(), fnLoadDeptCounts()]);
      } finally { uiState.loading = false; }
      await handleSearchUsers();
    };
    onMounted(() => { handleSearchList(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchList(); });

    /* ##### [04] 선택 처리 ######################################################### */

    /* handlePickUser — 단건 선택 → 즉시 emit + 모달 닫기 */
    const handlePickUser = (u) => {
      emit('select', [u]);
      if (props.onCallback) props.onCallback(props.modalName, null, [u]);
      emit('close');
      if (props.onCallback) props.onCallback(props.modalName, null, null);
    };

    /* onSearch — 검색 (페이지 1 부터) */
    const onSearch = async () => {
      pager.pageNo = 1;
      await fnLoadDeptCounts();
      await handleSearchUsers();
    };

    /* onReset — 초기화 */
    const onReset = async () => {
      searchParam.searchValue = '';
      uiState.selectedDeptId = null;
      pager.pageNo = 1;
      await fnLoadDeptCounts();
      await handleSearchUsers();
    };

    /* setPage — 페이지 이동 */
    const setPage = (n) => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchUsers(); } };
    /* onSizeChange — 사이즈 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchUsers(); };

    /* ##### [05] dispatch ########################################################## */

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoUserSelectModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'searchParam-search') {
        return onSearch();
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      } else if (cmd === 'deptTree-expandAll') {
        depts.forEach(d => expanded.add(d.deptId));
        return;
      } else if (cmd === 'deptTree-collapseAll') {
        expanded.clear();
        return;
      } else if (cmd === 'deptTree-toggle') {
        if (expanded.has(param)) expanded.delete(param); else expanded.add(param);
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoUserSelectModal : handleSelectAction -> ', cmd, param);
      if (cmd === 'deptTree-select') {
        uiState.selectedDeptId = param;
        pager.pageNo = 1;
        return handleSearchUsers();
      } else if (cmd === 'users-pick') {
        return handlePickUser(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [06] 컬럼 정의 ######################################################### */

    /* baseSearchColumns — 검색 영역 컬럼 */
    const baseSearchColumns = [
      { key: 'searchValue', label: '검색어', type: 'text', placeholder: '이름 / 로그인ID / 이메일 검색' },
    ];

    /* userGridColumns — 사용자 목록 그리드 컬럼 (SyUserMng 패턴 준용) */
    const userGridColumns = [
      { key: 'userNm',       label: '이름',
        cellInnerStyle: 'font-weight:600;color:#1a1a2e;' },
      { key: 'userEmail',    label: '이메일' },
      { key: 'userPhone',    label: '연락처' },
      { key: 'deptNm',       label: '부서', cellStyle: 'color:#666;' },
      { key: '_act',         label: '선택', style: 'width:80px;text-align:center;', html: true,
        fmt: () => `<button class="btn btn-primary btn-xs" data-act="pick" style="font-weight:600;">선택</button>` },
    ];

    return {
      cfSiteNm, depts, deptCounts, expanded, uiState, searchParam, pager, userList, cfTree,  // 데이터
      baseSearchColumns, userGridColumns,                                  // 컬럼 정의
      setPage, onSizeChange,                                                // BoGrid pager 콜백
      handleBtnAction, handleSelectAction,                                 // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" width="1000px" max-width="95vw" height="auto" max-height="86vh" box-pad="0" body-pad="0" @close="handleBtnAction('modal-close')">
  <div style="background:#fff;border-radius:14px;width:100%;display:flex;flex-direction:column;overflow:hidden;">
    <!-- ===== ■. 헤더 ===================================================== -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f0f0f0;flex-shrink:0;background:linear-gradient(135deg,#fff0f4 0%,#ffe4ec 50%,#ffd5e1 100%);">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:16px;font-weight:800;color:#1a1a2e;">
          👤 사용자 선택
        </span>
        <span style="font-size:11px;font-weight:600;color:#2563eb;background:#fff;padding:2px 10px;border-radius:20px;">
          {{ cfSiteNm }}
        </span>
      </div>
      <span style="cursor:pointer;font-size:22px;color:#888;line-height:1;" @click="handleBtnAction('modal-close')">
        ✕
      </span>
    </div>
    <!-- ===== ■. 검색 영역 ================================================== -->
    <div style="padding:10px 16px;border-bottom:1px solid #f0f0f0;background:#fafafa;flex-shrink:0;">
      <bo-search-area :columns="baseSearchColumns" :param="searchParam" :loading="uiState.loading"
        @search="handleBtnAction('searchParam-search')" @reset="handleBtnAction('searchParam-reset')" />
    </div>
    <!-- ===== ■. 바디 (좌:부서트리 / 우:사용자목록) ============================= -->
    <div style="display:flex;min-height:0;overflow:hidden;">
      <!-- ===== ■.■. 좌: 부서 트리 ========================================== -->
      <div style="width:240px;flex-shrink:0;border-right:1px solid #f0f0f0;display:flex;flex-direction:column;background:#fafbfc;">
        <div style="padding:10px 10px 8px;border-bottom:1px solid #ebebeb;">
          <div style="font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px;">
            📁 부서
          </div>
          <input v-model="uiState.deptSearchValue" placeholder="🔍 부서 검색"
            style="width:100%;border:1px solid #e5e7eb;border-radius:6px;padding:5px 8px;font-size:12px;outline:none;box-sizing:border-box;background:#fff;color:#374151;" />
        </div>
        <div style="display:flex;gap:4px;padding:6px 10px;border-bottom:1px solid #ebebeb;">
          <button class="btn btn_expand_all" @click="handleBtnAction('deptTree-expandAll')" style="flex:1;font-size:11px;padding:3px 4px;">
            ▼ 전체펼치기
          </button>
          <button class="btn btn_collapse_all" @click="handleBtnAction('deptTree-collapseAll')" style="flex:1;font-size:11px;padding:3px 4px;">
            ▶ 전체닫기
          </button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:6px;max-height:560px;">
          <bo-dept-tree-node :node="cfTree" :expanded="expanded" :selected="uiState.selectedDeptId"
            :on-toggle="id => handleBtnAction('deptTree-toggle', id)"
            :on-select="id => handleSelectAction('deptTree-select', id)"
            :depth="0" :counts="deptCounts" />
        </div>
      </div>
      <!-- ===== ■.■. 우: 사용자 목록 ======================================== -->
      <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;background:#fff;">
        <!-- ===== ■.■.■. 카운트 바 =========================================== -->
        <div style="display:flex;align-items:center;padding:8px 14px;border-bottom:1px solid #f0f0f0;flex-shrink:0;background:#fafafa;">
          <span style="margin-left:auto;font-size:12px;color:#9ca3af;">
            사용자목록
            <b style="color:#e8587a;margin:0 2px;">
              {{ pager.pageTotalCount }}
            </b>
            건
          </span>
        </div>
        <!-- ===== ■.■.■. 그리드 + 페이저 (BoGrid 내장) ======================= -->
        <div style="display:flex;flex-direction:column;">
          <bo-grid :columns="userGridColumns" :rows="userList" :pager="pager" row-key="userId"
            row-clickable
            :empty-text="uiState.loading ? '로딩 중...' : '🔍 검색 결과가 없습니다.'"
            @row-click="row => handleSelectAction('users-pick', row)"
 />
          <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
        </div>
      </div>
    </div>
  </div>
</bo-modal>
`,
};

/* ── 회원 선택 모달 ── */
window.MemberSelectModal = {
  name: 'MemberSelectModal',
  inheritAttrs: false,
  props: {
    dispDataset:   { type: Object,    default: () => ({}) },              // 디스플레이 데이터셋
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const pageSize = 8;
    const pager = reactive({ pageNo: 1, pageSize, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [5, 10, 20, 30, 50]});
    const searchParam = reactive({ searchType: '', searchValue: '' });
    const list = reactive([]);
    const loading = ref(false);

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ MemberSelectModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      // 페이지 이동
      } else if (cmd === 'pager-set') {
        return onSetPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ MemberSelectModal : handleSelectAction -> ', cmd, param);
      // 회원 선택
      if (cmd === 'list-select') {
        emit('select', param);
        if (props.onCallback) props.onCallback(props.modalName, null, param);
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* 목록조회 */
    const handleSearchList = async () => {
      loading.value = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, searchValue: searchParam.searchValue || undefined, searchType: searchParam.searchType || undefined };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'memberNm,memberEmail,memberId';
        }
        const res = await boApiSvc.mbMember.getPage(params, '회원관리', '목록조회');
        const data = res.data?.data;
        list.splice(0, list.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
      } catch (e) { list.splice(0, list.length); } finally { loading.value = false; }
    };

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => { const s=Math.max(1,pager.pageNo-2),e=Math.min(pager.pageTotalPage,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* handleSearchListWrap */
    const handleSearchListWrap = async () => { await handleSearchList(); fnBuildPagerNums(); };
    onMounted(() => { handleSearchListWrap(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchListWrap(); });

    /* onSetPage */
    const onSetPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchListWrap(); } };

    /* baseSearchColumns — 검색 영역 컬럼 */
    const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck',
        options: [
          { value: 'memberNm',    label: '이름' },
          { value: 'memberEmail', label: '이메일' },
          { value: 'memberId',    label: 'ID' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', placeholder: '검색어 입력' },
    ];

    /* listGridColumns — BoGrid 컬럼 정의 */
    const listGridColumns = [
      { key: 'memberNm',    label: '이름', cellStyle: 'font-weight:600;color:#1a1a2e;', fmt: (v) => v || '-' },
      { key: 'memberEmail', label: '이메일', cellStyle: 'color:#888;font-size:11px;', fmt: (v, row) => row.memberEmail || row.email || '-' },
      { key: '_id',         label: 'ID', mono: true, cellStyle: 'color:#888;font-size:11px;', fmt: (v, row) => row.memberId || row.userId || '-' },
    ];

    return {
      cfSiteNm, searchParam, list, loading, pager,                          // 데이터
      baseSearchColumns, listGridColumns,                                    // 컬럼 정의
      onSetPage,                                                             // BoGrid pager 콜백
      handleBtnAction, handleSelectAction,                                  // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" @close="handleBtnAction('modal-close')">
  <div class="modal-header" style="margin:-20px -20px 14px -20px;">
    <span class="modal-title">
      회원 선택
      <span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">
        {{ cfSiteNm }}
      </span>
    </span>
    <span class="modal-close" @click="handleBtnAction('modal-close')">
      ✕
    </span>
  </div>
  <bo-search-area :columns="baseSearchColumns" :param="searchParam"
    @search="handleBtnAction('pager-set', 1)" />
  <bo-grid :columns="listGridColumns" :rows="list" :pager="pager" row-key="memberId"
    :list-title="'총 ' + pager.pageTotalCount + '건'" row-clickable :row-actions="true"
    :empty-text="loading ? '로딩 중...' : '검색 결과가 없습니다.'"
    @row-click="row => handleSelectAction('list-select', row)">
    <template #row-actions="{ row }">
      <button class="btn btn_select" @click.stop="handleSelectAction('list-select', row)">
        선택
      </button>
    </template>
  </bo-grid>
  <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="() => onSetPage(1)" />
</bo-modal>
`,
};

/* ── 주문 선택 모달 ── */
window.OrderSelectModal = {
  name: 'OrderSelectModal',
  inheritAttrs: false,
  props: {
    dispDataset:   { type: Object,    default: () => ({}) },              // 디스플레이 데이터셋
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const pageSize = 8;
    const pager = reactive({ pageNo: 1, pageSize, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [5, 10, 20, 30, 50]});
    const searchParam = reactive({ searchType: '', searchValue: '' });
    const list = reactive([]);
    const loading = ref(false);

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ OrderSelectModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      // 페이지 이동
      } else if (cmd === 'pager-set') {
        return onSetPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ OrderSelectModal : handleSelectAction -> ', cmd, param);
      // 주문 선택
      if (cmd === 'list-select') {
        emit('select', param);
        if (props.onCallback) props.onCallback(props.modalName, null, param);
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* 목록조회 */
    const handleSearchList = async () => {
      loading.value = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, searchValue: searchParam.searchValue || undefined, searchType: searchParam.searchType || undefined };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'orderId,memberNm,prodNm';
        }
        const res = await boApiSvc.odOrder.getPage(params, '주문관리', '목록조회');
        const data = res.data?.data;
        list.splice(0, list.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
      } catch (e) { list.splice(0, list.length); } finally { loading.value = false; }
    };

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => { const s=Math.max(1,pager.pageNo-2),e=Math.min(pager.pageTotalPage,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* handleSearchListWrap */
    const handleSearchListWrap = async () => { await handleSearchList(); fnBuildPagerNums(); };
    onMounted(() => { handleSearchListWrap(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchListWrap(); });

    /* onSetPage */
    const onSetPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchListWrap(); } };

    /* baseSearchColumns — 검색 영역 컬럼 */
    const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck',
        options: [
          { value: 'orderId',  label: '주문ID' },
          { value: 'memberNm', label: '회원명' },
          { value: 'prodNm',   label: '상품명' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', placeholder: '검색어 입력' },
    ];

    /* listGridColumns — BoGrid 컬럼 정의 */
    const listGridColumns = [
      { key: 'orderId',  label: '주문ID', mono: true, cellStyle: 'font-weight:600;color:#1a1a2e;', fmt: (v) => v || '-' },
      { key: '_member',  label: '회원', cellStyle: 'color:#888;font-size:11px;', fmt: (v, row) => row.memberNm || row.userNm || '-' },
      { key: '_total',   label: '결제금액', align: 'right', cellStyle: 'color:#389e0d;font-weight:700;', fmt: (v, row) => (row.totalAmt || row.totalPrice || 0).toLocaleString() + '원' },
    ];

    return {
      cfSiteNm, searchParam, list, loading, pager,                          // 데이터
      baseSearchColumns, listGridColumns,                                    // 컬럼 정의
      onSetPage,                                                             // BoGrid pager 콜백
      handleBtnAction, handleSelectAction,                                  // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" @close="handleBtnAction('modal-close')">
  <div class="modal-header" style="margin:-20px -20px 14px -20px;">
    <span class="modal-title">
      주문 선택
      <span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">
        {{ cfSiteNm }}
      </span>
    </span>
    <span class="modal-close" @click="handleBtnAction('modal-close')">
      ✕
    </span>
  </div>
  <bo-search-area :columns="baseSearchColumns" :param="searchParam"
    @search="handleBtnAction('pager-set', 1)" />
  <bo-grid :columns="listGridColumns" :rows="list" :pager="pager" row-key="orderId"
    :list-title="'총 ' + pager.pageTotalCount + '건'" row-clickable :row-actions="true"
    :empty-text="loading ? '로딩 중...' : '검색 결과가 없습니다.'"
    @row-click="row => handleSelectAction('list-select', row)">
    <template #row-actions="{ row }">
      <button class="btn btn_select" @click.stop="handleSelectAction('list-select', row)">
        선택
      </button>
    </template>
  </bo-grid>
  <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="() => onSetPage(1)" />
</bo-modal>
`,
};

/* ── 게시판 선택 모달 ── */
window.BbmSelectModal = {
  name: 'BbmSelectModal',
  inheritAttrs: false,
  props: {
    dispDataset:   { type: Object,    default: () => ({}) },              // 디스플레이 데이터셋
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const pageSize = 6;
    const pager = reactive({ pageNo: 1, pageSize, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [5, 10, 20, 30, 50]});
    const searchParam = reactive({ searchType: '', searchValue: '' });
    const list = reactive([]);
    const loading = ref(false);

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BbmSelectModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      // 페이지 이동
      } else if (cmd === 'pager-set') {
        return onSetPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BbmSelectModal : handleSelectAction -> ', cmd, param);
      // 게시판 선택
      if (cmd === 'list-select') {
        emit('select', param);
        if (props.onCallback) props.onCallback(props.modalName, null, param);
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* 목록조회 */
    const handleSearchList = async () => {
      loading.value = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, searchValue: searchParam.searchValue || undefined, searchType: searchParam.searchType || undefined };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'bbmNm,bbmCode,bbmType';
        }
        const res = await boApiSvc.syBbm.getPage(params, '게시판모드관리', '목록조회');
        const data = res.data?.data;
        list.splice(0, list.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
      } catch (e) { list.splice(0, list.length); } finally { loading.value = false; }
    };

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => { const s=Math.max(1,pager.pageNo-2),e=Math.min(pager.pageTotalPage,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* handleSearchListWrap */
    const handleSearchListWrap = async () => { await handleSearchList(); fnBuildPagerNums(); };
    onMounted(() => { handleSearchListWrap(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchListWrap(); });

    /* onSetPage */
    const onSetPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchListWrap(); } };

    /* fnTypeBadge */
    const fnTypeBadge = t => ({ '일반': 'badge-gray', '공지': 'badge-blue', '갤러리': 'badge-orange', 'FAQ': 'badge-green', 'QnA': 'badge-red' }[t] || 'badge-gray');

    /* fnScopeBadge */
    const fnScopeBadge = s => ({ '공개': 'badge-green', '개인': 'badge-orange', '회사': 'badge-blue' }[s] || 'badge-gray');

    /* baseSearchColumns — 검색 영역 컬럼 */
    const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck',
        options: [
          { value: 'bbmNm',   label: '게시판명' },
          { value: 'bbmCode', label: '코드' },
          { value: 'bbmType', label: '유형' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', placeholder: '검색어 입력' },
    ];

    /* listGridColumns — BoGrid 컬럼 정의 */
    const listGridColumns = [
      { key: 'bbmNm',     label: '게시판명', cellStyle: 'font-weight:600;color:#1a1a2e;', fmt: (v) => v || '-' },
      { key: 'bbmType',   label: '유형',     badge: (row) => fnTypeBadge(row.bbmType), fmt: (v) => v || '-' },
      { key: 'scopeType', label: '공개범위', badge: (row) => fnScopeBadge(row.scopeType), fmt: (v) => v || '-' },
      { key: 'bbmCode',   label: '코드',     mono: true, cellStyle: 'color:#888;font-size:11px;', fmt: (v) => v || '-' },
      { key: 'bbmId',     label: 'ID',       cellStyle: 'color:#888;font-size:11px;', fmt: (v) => v || '-' },
    ];

    return {
      cfSiteNm, searchParam, list, loading, pager,                          // 데이터
      baseSearchColumns, listGridColumns,                                    // 컬럼 정의
      onSetPage,                                                             // BoGrid pager 콜백
      fnTypeBadge, fnScopeBadge,                                            // 헬퍼
      handleBtnAction, handleSelectAction,                                  // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" max-width="640px" @close="handleBtnAction('modal-close')">
  <div class="modal-header" style="margin:-20px -20px 14px -20px;">
    <span class="modal-title">
      게시판 선택
      <span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">
        {{ cfSiteNm }}
      </span>
    </span>
    <span class="modal-close" @click="handleBtnAction('modal-close')">
      ✕
    </span>
  </div>
  <bo-search-area :columns="baseSearchColumns" :param="searchParam"
    @search="handleBtnAction('pager-set', 1)" />
  <bo-grid :columns="listGridColumns" :rows="list" :pager="pager" row-key="bbmId"
    :list-title="'총 ' + pager.pageTotalCount + '건'" row-clickable :row-actions="true"
    :empty-text="loading ? '로딩 중...' : '검색 결과가 없습니다.'"
    @row-click="row => handleSelectAction('list-select', row)">
    <template #row-actions="{ row }">
      <button class="btn btn_select" @click.stop="handleSelectAction('list-select', row)">
        선택
      </button>
    </template>
  </bo-grid>
  <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="() => onSetPage(1)" />
</bo-modal>
`,
};

/* ── 템플릿 미리보기 모달 ── */
window.TemplatePreviewModal = {
  name: 'TemplatePreviewModal',
  inheritAttrs: false,
  props: {
    tmpl:          { type: Object,    default: () => ({}) },              // 템플릿 데이터
    sampleParams:  { type: String,    default: '{}' },                    // 샘플 파라미터 (JSON 문자열)
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { computed } = Vue;

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ TemplatePreviewModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (해당 모달은 선택 동작 없음) */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ TemplatePreviewModal : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    const cfParams = computed(() => {
      try { return JSON.parse(props.sampleParams || '{}'); }
      catch { return {}; }
    });

    const cfIsHtml = computed(() =>
      ['메일템플릿', 'MMS템플릿'].includes(props.tmpl?.templateType)
    );

    /* 텍스트에 파라미터 치환 → HTML 반환 (미치환 변수는 빨간색 표시) */
    const handleApplyAndRender = (text) => {
      if (!text) return '';
      let base = text;
      if (!cfIsHtml.value) {
        /* 텍스트 계열: HTML 이스케이프 후 파라미터 치환 */
        base = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      return base.replace(/\{\{(\w+)\}\}/g, (_, k) =>
        cfParams.value[k] !== undefined
          ? `<span style="background:#fff3cd;color:#856404;border-radius:3px;padding:0 2px;font-weight:600;">${String(cfParams.value[k])}</span>`
          : `<span style="color:#dc3545;font-weight:600;">{{${k}}}</span>`
      );
    };

    const cfRenderedSubject = computed(() => handleApplyAndRender(props.tmpl?.subject || ''));
    const cfRenderedContent = computed(() => handleApplyAndRender(props.tmpl?.content || ''));

    const cfTypeBadge = computed(() => ({
      '메일템플릿': 'badge-blue', '문자템플릿': 'badge-green', 'MMS템플릿': 'badge-orange',
      'kakao톡템플릿': 'badge-purple', 'kakao알림톡템플릿': 'badge-purple',
    }[props.tmpl?.templateType] || 'badge-gray'));

    const cfParamList = computed(() => Object.entries(cfParams.value).map(([k, v]) => ({ k, v })));

    /* setup에서 tmpl을 반환해 템플릿에서 직접 접근 가능하게 */
    const fmtKey = k => '{{' + k + '}}';
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    return {
      cfSiteNm, tmpl: computed(() => props.tmpl),                            // 데이터
      cfRenderedSubject, cfRenderedContent, cfIsHtml, cfTypeBadge,           // computed
      cfParamList, fmtKey,                                                   // computed/헬퍼
      handleBtnAction, handleSelectAction,                                   // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" max-width="700px" @close="handleBtnAction('modal-close')">
  <div class="modal-header" style="margin:-20px -20px 14px -20px;">
    <span class="modal-title">
      📄 템플릿 미리보기
      <span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">
        {{ cfSiteNm }}
      </span>
    </span>
    <span class="modal-close" @click="handleBtnAction('modal-close')">
      ✕
    </span>
  </div>
  <!-- 템플릿 기본정보 -->
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding:10px 14px;background:#f8f9fa;border-radius:8px;">
    <span class="badge" :class="cfTypeBadge">
      {{ tmpl?.templateType }}
    </span>
    <span style="font-weight:700;font-size:14px;color:#1a1a2e;">
      {{ tmpl?.templateNm }}
    </span>
  </div>
  <!-- 파라미터 샘플 뱃지 -->
  <div v-if="cfParamList.length" style="margin-bottom:12px;">
    <div style="font-size:11px;color:#888;font-weight:600;margin-bottom:5px;">
      파라미터 샘플값
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;">
      <span v-for="p in cfParamList" :key="p.k"
        style="display:inline-flex;align-items:center;gap:3px;font-size:11px;background:#f0f4ff;border:1px solid #d0d9ff;border-radius:4px;padding:2px 8px;color:#2563eb;">
        <b>
          {{ fmtKey(p.k) }}
        </b>
        <span style="color:#aaa;margin:0 2px;">
          =
        </span>
        <span style="color:#856404;background:#fff3cd;border-radius:2px;padding:0 3px;">
          {{ p.v }}
        </span>
      </span>
    </div>
  </div>
  <div v-else style="margin-bottom:12px;font-size:12px;color:#aaa;">
    파라미터 샘플값 없음
  </div>
  <!-- 제목 -->
  <div v-if="tmpl?.subject" style="margin-bottom:12px;">
    <div style="font-size:11px;color:#888;font-weight:600;margin-bottom:4px;">
      제목 (Subject)
    </div>
    <div style="padding:9px 13px;background:#fff;border:1px solid #e8e8e8;border-radius:7px;font-size:13px;color:#333;"
      v-html="cfRenderedSubject">
    </div>
  </div>
  <!-- 내용 미리보기 -->
  <div>
    <div style="font-size:11px;color:#888;font-weight:600;margin-bottom:5px;">
      내용 미리보기
    </div>
    <!-- HTML 타입 -->
    <div v-if="cfIsHtml"
      style="padding:18px;background:#fff;border:1px solid #e0e0e0;border-radius:8px;min-height:120px;max-height:380px;overflow-y:auto;font-size:13px;line-height:1.8;"
      v-html="cfRenderedContent">
    </div>
    <!-- 텍스트 타입 -->
    <pre v-else
      style="padding:14px 16px;background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px;min-height:80px;max-height:280px;overflow-y:auto;font-size:13px;line-height:1.8;white-space:pre-wrap;word-break:break-all;margin:0;color:#333;"
      v-html="cfRenderedContent"></pre>
    </div>
    <div style="margin-top:18px;display:flex;justify-content:flex-end;">
      <button class="btn btn_close" @click="handleBtnAction('modal-close')">
        닫기
      </button>
    </div>
  </bo-modal>
`,
};

/* ── 템플릿 발송하기 모달 ── */
window.TemplateSendModal = {
  name: 'TemplateSendModal',
  inheritAttrs: false,
  props: {
    tmpl:          { type: Object,    default: () => ({}) },              // 템플릿 데이터
    dispDataset:   { type: Object,    default: () => ({}) },              // 디스플레이 데이터셋
    showToast:     { type: Function,  default: () => {} },                // 토스트 알림
    showConfirm:   { type: Function,  default: () => Promise.resolve(true) },  // 확인 모달
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    const searchParam = reactive({ type: 'member', searchValue: '' });
    const selected = reactive([]);

    /* getId */
    const getId = (item) => item.memberId || item.userId || item.boUserId;

    /* ── API 데이터 ── */
    const allDepts = reactive([]);
    const allMembers = reactive([]);
    const allBoUsers = reactive([]);

    /* 목록조회 */
    const handleSearchList = async () => {
      try {
        const [deptRes, memberRes, userRes] = await Promise.all([
          boApiSvc.syDept.getList({ pageSize: 10000 }, '부서관리', '목록조회'),
          boApiSvc.mbMember.getList({ pageSize: 10000 }, '회원관리', '목록조회'),
          boApiSvc.syUser.getList({ pageSize: 10000 }, '사용자관리', '목록조회'),
        ]);
        allDepts.splice(0, allDepts.length, ...(deptRes.data?.data || []));
        allMembers.splice(0, allMembers.length, ...(memberRes.data?.data || []));
        allBoUsers.splice(0, allBoUsers.length, ...(userRes.data?.data || []));
      } catch (e) {}
    };
    onMounted(() => { handleSearchList(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchList(); });

    /* ── 부서 트리 (관리자 탭) ── */
    const uiState = reactive({ selectedDeptId: null, selectedGrade: null, deptSearchValue: '' });
    const selectedDeptId = computed(() => uiState.selectedDeptId);
    const selectedGrade = computed(() => uiState.selectedGrade);

    /* fnBuildDeptTree */
    const fnBuildDeptTree = (items, parentId, depth) =>
      items.filter(d => (d.parentDeptId || null) === (parentId || null) && d.useYn === 'Y')
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(d => ({ ...d, _depth: depth, _kids: fnBuildDeptTree(items, d.deptId, depth + 1) }));

    /* fnFlattenDept */
    const fnFlattenDept = (nodes, result = []) => { nodes.forEach(n => { result.push(n); fnFlattenDept(n._kids, result); }); return result; };
    const cfFlatDeptTree = computed(() => {
      const k = uiState.deptSearchValue.trim().toLowerCase();
      const base = k ? allDepts.filter(d => d.useYn === 'Y' && d.deptNm.toLowerCase().includes(k)) : allDepts;
      return fnFlattenDept(fnBuildDeptTree(base, null, 1));
    });

    /* fnGetDescDeptIds */
    const fnGetDescDeptIds = (deptId) => {
      const ids = new Set();
      const queue = [deptId];
      while (queue.length) {
        const id = queue.shift();
        ids.add(id);
        allDepts.filter(x => x.parentDeptId === id).forEach(c => queue.push(c.deptId));
      }
      return ids;
    };

    /* ── 등급 필터 (회원 탭) ── */
    const MEMBER_GRADES = ['VIP', '우수', '일반'];

    /* ── 목록 ── */
    const cfMemberList = computed(() => {
      const k = searchParam.searchValue.trim().toLowerCase();
      let list = allMembers;
      if (selectedGrade.value) list = list.filter(m => m.memberGrade === selectedGrade.value || m.grade === selectedGrade.value);
      if (k) list = list.filter(m => (m.memberNm || '').toLowerCase().includes(k) || (m.memberEmail || m.email || '').toLowerCase().includes(k) || String(m.memberId || m.userId || '').includes(k));
      return list;
    });
    const cfUserList = computed(() => {
      const k = searchParam.searchValue.trim().toLowerCase();
      let list = allBoUsers;
      if (selectedDeptId.value !== null) {
        const ids = fnGetDescDeptIds(selectedDeptId.value);
        list = list.filter(u => ids.has(u.deptId));
      }
      if (k) list = list.filter(u => (u.userNm || u.name || '').toLowerCase().includes(k) || (u.userEmail || u.email || '').toLowerCase().includes(k) || String(u.userId || u.boUserId || '').includes(k));
      return list;
    });
    const cfList = computed(() => searchParam.type === 'member' ? cfMemberList.value : cfUserList.value);

    /* fnIsSelected */
    const fnIsSelected = (item) => selected.includes(getId(item));

    /* handleToggleSelect */
    const handleToggleSelect = (item) => {
      const id = getId(item);
      const idx = selected.indexOf(id);
      if (idx === -1) selected.push(id); else selected.splice(idx, 1);
    };
    const cfAllChecked = computed(() => cfList.value.length > 0 && cfList.value.every(x => selected.includes(getId(x))));

    /* handleToggleAll */
    const handleToggleAll = () => {
      if (cfAllChecked.value) { selected.splice(0); }
      else { cfList.value.forEach(x => { const id = getId(x); if (!selected.includes(id)) selected.push(id); }); }
    };

    watch(() => searchParam.type, () => { selected.splice(0); searchParam.searchValue = ''; uiState.selectedDeptId = null; uiState.selectedGrade = null; });

    const cfTypeBadge = computed(() => ({
      '메일템플릿': 'badge-blue', '문자템플릿': 'badge-green', 'MMS템플릿': 'badge-orange',
      'kakao톡템플릿': 'badge-purple', 'kakao알림톡템플릿': 'badge-purple',
      '시스템알림': 'badge-red', '회원알림': 'badge-teal',
    }[props.tmpl?.templateType] || 'badge-gray'));

    /* fnGradeBadgeColor */
    const fnGradeBadgeColor = g => ({ 'VIP': '#f59e0b', '우수': '#2563eb', '일반': '#6b7280' }[g] || '#6b7280');

    /* fnDisplayNm — 회원/관리자 공통 이름 (널 안전) */
    const fnDisplayNm = (item) => (searchParam.type === 'member'
      ? (item.memberNm || item.memberEmail || '')
      : (item.userNm || item.loginId || '')) || '';

    /* fnDisplayLogin — loginId 또는 email 보조 표기 */
    const fnDisplayLogin = (item) => (searchParam.type === 'member'
      ? (item.memberEmail || item.email || '')
      : (item.loginId || item.userEmail || '')) || '';

    /* fnDisplaySub — 두 번째 줄 보조 정보 */
    const fnDisplaySub = (item) => {
      if (searchParam.type === 'member') return item.memberEmail || item.email || item.memberPhone || '';
      const dept = (allDepts.find(d => d.deptId === item.deptId) || {}).deptNm || '';
      return [dept, item.userEmail || ''].filter(Boolean).join(' · ') || '-';
    };

    /* fnDisplayBadge — 우측 배지 텍스트 */
    const fnDisplayBadge = (item) => searchParam.type === 'member'
      ? (item.memberGrade || item.grade || '')
      : (item.userStatusCd || '');

    /* fnBadgeStyle — 배지 색상 */
    const fnBadgeStyle = (item) => {
      if (searchParam.type === 'user') {
        return item.userStatusCd === 'ACTIVE'
          ? 'background:#dcfce7;color:#16a34a;'
          : 'background:#f3f4f6;color:#9ca3af;';
      }
      const g = item.memberGrade || item.grade;
      return g === 'VIP' ? 'background:#fef3c7;color:#d97706;'
        : g === '우수' ? 'background:#dbeafe;color:#1d4ed8;'
        : 'background:#f3f4f6;color:#6b7280;';
    };

    /* handleSend */
    const handleSend = async () => {
      if (!selected.length) { props.showToast('발송할 수신자를 선택하세요.', 'info'); return; }
      const typeLabel = searchParam.type === 'member' ? '회원' : '관리자';
      const ok = await props.showConfirm('템플릿 발송',
        `[${props.tmpl?.templateNm}] 템플릿을 선택된 ${typeLabel} ${selected.length}명에게 발송하시겠습니까?`,
        { btnOk: '발송', btnCancel: '취소' });
      if (!ok) return;
      props.showToast(`${typeLabel} ${selected.length}명에게 발송 요청이 완료되었습니다.`);
      emit('close');
      if (props.onCallback) props.onCallback(props.modalName, null, null);
    };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ TemplateSendModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      // 발송
      } else if (cmd === 'modal-send') {
        return handleSend();
      // 탭 변경 (member/user)
      } else if (cmd === 'searchParam-type') {
        searchParam.type = param;
        return;
      // 전체 선택/해제 토글
      } else if (cmd === 'list-toggle-all') {
        return handleToggleAll();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ TemplateSendModal : handleSelectAction -> ', cmd, param);
      // 부서 선택
      if (cmd === 'deptTree-select') {
        uiState.selectedDeptId = param;
        return;
      // 등급 선택
      } else if (cmd === 'grade-select') {
        uiState.selectedGrade = param;
        return;
      // 수신자 토글
      } else if (cmd === 'list-toggle') {
        return handleToggleSelect(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    return {
      cfSiteNm, searchParam, uiState, cfList, selected,                      // 데이터
      fnIsSelected, cfAllChecked, cfTypeBadge, fnGradeBadgeColor,            // 헬퍼/computed
      fnDisplayNm, fnDisplayLogin, fnDisplaySub, fnDisplayBadge, fnBadgeStyle, getId, // list 렌더 헬퍼
      selectedDeptId, selectedGrade, cfFlatDeptTree, MEMBER_GRADES,          // computed/상수
      tmpl: computed(() => props.tmpl),                                      // 템플릿 객체
      handleBtnAction, handleSelectAction,                                   // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" max-width="800px" max-height="84vh" box-pad="0" body-pad="0" @close="handleBtnAction('modal-close')">
  <div style="background:#fff;border-radius:14px;display:flex;flex-direction:column;overflow:hidden;">
    <!-- ── 헤더 ── -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:10px;min-width:0;">
        <span style="font-size:15px;font-weight:800;color:#1a1a2e;flex-shrink:0;">
          📨 {{ tmpl?.templateNm || '발송하기' }}
        </span>
        <code v-if="tmpl?.templateCode" style="font-size:11px;color:#888;background:#efefef;padding:1px 8px;border-radius:4px;flex-shrink:0;">
          {{ tmpl.templateCode }}
        </code>
        <span style="font-size:10px;font-weight:600;color:#2563eb;background:#eff6ff;padding:2px 8px;border-radius:20px;flex-shrink:0;">
          {{ cfSiteNm }}
        </span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span v-if="selected.length" style="font-size:12px;color:#52c41a;font-weight:700;background:#f6ffed;padding:3px 10px;border-radius:20px;">
          {{ selected.length }}명 선택됨
        </span>
        <span style="cursor:pointer;font-size:20px;color:#d1d5db;line-height:1;" @click="handleBtnAction('modal-close')">
          ✕
        </span>
      </div>
    </div>
    <!-- ── 탭 ── -->
      <div style="display:flex;border-bottom:2px solid #f0f0f0;flex-shrink:0;background:#fff;">
        <button @click="handleBtnAction('searchParam-type', 'member')"
        style="padding:9px 24px;background:none;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all .12s;"
        :style="searchParam.type==='member'?'border-bottom:2px solid #e8587a;color:#e8587a;margin-bottom:-2px;':'color:#9ca3af;'">
          👥 회원
        </button>
        <button @click="handleBtnAction('searchParam-type', 'user')"
        style="padding:9px 24px;background:none;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all .12s;"
        :style="searchParam.type==='user'?'border-bottom:2px solid #e8587a;color:#e8587a;margin-bottom:-2px;':'color:#9ca3af;'">
          👤 관리자
        </button>
      </div>
      <!-- ── 바디: 좌(필터) + 우(목록) ── -->
      <div style="display:flex;min-height:420px;max-height:60vh;overflow:hidden;">
        <!-- 좌: 필터 패널 -->
        <div style="width:200px;flex-shrink:0;border-right:1px solid #f0f0f0;display:flex;flex-direction:column;background:#f8f9fb;">
          <!-- 관리자 탭: 부서 트리 -->
          <template v-if="searchParam.type==='user'">
            <div style="padding:10px 10px 8px;border-bottom:1px solid #ebebeb;">
              <div style="font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px;">
                조직 / 부서
              </div>
              <div style="position:relative;">
                <span style="position:absolute;left:8px;top:50%;transform:translateY(-50%);font-size:11px;color:#bbb;">
                  🔍
                </span>
                <input v-model="uiState.deptSearchValue" placeholder="부서 검색"
                style="width:100%;border:1px solid #e5e7eb;border-radius:7px;padding:5px 8px 5px 24px;font-size:12px;outline:none;box-sizing:border-box;background:#fff;" />
              </div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:6px 6px;">
              <!-- 전체 루트 -->
              <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:2px;transition:all .12s;"
              :style="selectedDeptId===null?'background:#e8587a;box-shadow:0 2px 8px rgba(232,88,122,0.25);':''"
              @click="handleSelectAction('deptTree-select', null)">
                <span style="font-size:8px;font-weight:900;flex-shrink:0;" :style="{ color: selectedDeptId===null?'#fff':'#e8587a' }">
                  ●
                </span>
                <span style="font-size:13px;font-weight:700;flex:1;" :style="{ color: selectedDeptId===null?'#fff':'#374151' }">
                  전체
                </span>
              </div>
              <!-- 부서 트리 -->
              <div v-for="d in cfFlatDeptTree" :key="d.deptId"
              style="display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:8px;cursor:pointer;margin-bottom:1px;transition:all .12s;"
              :style="selectedDeptId===d.deptId?'background:#e8587a;box-shadow:0 2px 6px rgba(232,88,122,0.2);':''"
              @click="handleSelectAction('deptTree-select', d.deptId)">
                <span style="flex-shrink:0;font-weight:800;"
                :style="{ marginLeft:((d._depth-1)*13)+'px', fontSize:d._depth===1?'10px':'8px',
                color:selectedDeptId===d.deptId?'#fff':['#2563eb','#52c41a','#f59e0b'][Math.min(d._depth-1,2)] }">
                  {{ ['●','◦','·'][Math.min(d._depth-1,2)] }}
                </span>
                <span style="font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                :style="{ fontWeight:d._depth===1?'600':'400', color:selectedDeptId===d.deptId?'#fff':'#374151' }">
                  {{ d.deptNm }}
                </span>
              </div>
            </div>
          </template>
          <!-- 회원 탭: 등급 필터 -->
          <template v-else>
            <div style="padding:10px 10px 8px;border-bottom:1px solid #ebebeb;">
              <div style="font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:.07em;text-transform:uppercase;">
                회원 등급
              </div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:6px 6px;">
              <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:2px;transition:all .12s;"
              :style="selectedGrade===null?'background:#e8587a;box-shadow:0 2px 8px rgba(232,88,122,0.25);':''"
              @click="handleSelectAction('grade-select', null)">
                <span style="font-size:8px;font-weight:900;flex-shrink:0;" :style="{ color: selectedGrade===null?'#fff':'#e8587a' }">
                  ●
                </span>
                <span style="font-size:13px;font-weight:700;" :style="{ color: selectedGrade===null?'#fff':'#374151' }">
                  전체
                </span>
              </div>
              <div v-for="g in MEMBER_GRADES" :key="g"
              style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:1px;transition:all .12s;"
              :style="selectedGrade===g?'background:#e8587a;box-shadow:0 2px 6px rgba(232,88,122,0.2);':''"
              @click="handleSelectAction('grade-select', g)">
                <span style="width:8px;height:8px;border-radius:50%;flex-shrink:0;"
                :style="{ background: selectedGrade===g?'#fff':fnGradeBadgeColor(g) }">
                </span>
                <span style="font-size:13px;font-weight:600;" :style="{ color: selectedGrade===g?'#fff':'#374151' }">
                  {{ g }}
                </span>
              </div>
            </div>
          </template>
        </div>
        <!-- 우: 사용자 목록 -->
        <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;background:#fff;">
          <div style="padding:10px 14px 8px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
            <div style="position:relative;">
              <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:12px;color:#bbb;">
                🔍
              </span>
              <input v-model="searchParam.searchValue" :placeholder="searchParam.type==='member'?'이름 / 이메일 / ID 검색':'이름 / 이메일 / ID 검색'"
              style="width:100%;border:1px solid #e5e7eb;border-radius:7px;padding:6px 10px 6px 28px;font-size:12px;outline:none;box-sizing:border-box;" />
            </div>
          </div>
          <div style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid #f0f0f0;flex-shrink:0;background:#fafafa;">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:600;color:#374151;user-select:none;">
              <input type="checkbox" :checked="cfAllChecked" @change="handleBtnAction('list-toggle-all')" style="width:14px;height:14px;" />
              전체선택
            </label>
            <span style="margin-left:auto;font-size:12px;color:#9ca3af;">
              총
              <b style="color:#374151;">
                {{ cfList.length }}
              </b>
              명
            </span>
          </div>
          <div style="flex:1;overflow-y:auto;">
            <div v-if="cfList.length===0" style="text-align:center;color:#bbb;padding:52px 0;font-size:13px;">
              <div style="font-size:32px;margin-bottom:8px;">
                🔍
              </div>
              검색 결과가 없습니다.
            </div>
            <div v-for="item in cfList" :key="getId(item)"
            style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid #f5f5f5;cursor:pointer;transition:background .1s;"
            :style="fnIsSelected(item)?'background:#f0fff4;':''"
            @click="handleSelectAction('list-toggle', item)">
              <input type="checkbox" :checked="fnIsSelected(item)" @click.stop="handleSelectAction('list-toggle', item)"
              style="width:15px;height:15px;flex-shrink:0;accent-color:#52c41a;cursor:pointer;" />
              <div style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:800;transition:all .1s;"
              :style="fnIsSelected(item)?'background:#52c41a;color:#fff;':'background:#f3f4f6;color:#6b7280;'">
                {{ fnDisplayNm(item).charAt(0) || '·' }}
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:600;color:#1a1a2e;display:flex;align-items:baseline;gap:5px;">
                  {{ fnDisplayNm(item) }}
                  <span style="font-size:11px;color:#9ca3af;font-weight:400;">
                    {{ fnDisplayLogin(item) }}
                  </span>
                </div>
                <div style="font-size:11px;color:#b0b7c3;margin-top:2px;">
                  {{ fnDisplaySub(item) }}
                </div>
              </div>
              <span v-if="fnDisplayBadge(item)" style="font-size:10px;padding:2px 8px;border-radius:20px;font-weight:700;flex-shrink:0;"
              :style="fnBadgeStyle(item)">
                {{ fnDisplayBadge(item) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <!-- ── 푸터 ── -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid #f0f0f0;flex-shrink:0;background:#fff;">
        <span style="font-size:12px;" :style="selected.length?'color:#52c41a;font-weight:600;':'color:#bbb;'">
          {{ selected.length ? selected.length+'명이 선택되었습니다.' : '목록에서 수신자를 선택하세요.' }}
        </span>
        <div style="display:flex;gap:8px;">
          <button style="padding:8px 22px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;font-size:13px;font-weight:600;cursor:pointer;"
          @click="handleBtnAction('modal-close')">
            취소
          </button>
          <button :disabled="!selected.length"
          style="padding:8px 22px;border-radius:8px;border:none;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;"
          :style="selected.length?'background:#52c41a;color:#fff;box-shadow:0 2px 8px rgba(82,196,26,0.35);':'background:#f3f4f6;color:#d1d5db;cursor:not-allowed;'"
          @click="handleBtnAction('modal-send')">
            📨 발송{{ selected.length?' ('+selected.length+'명)':'' }}
          </button>
        </div>
      </div>
    </div>
  </bo-modal>
`,
};

/* ── 부서 트리 선택 모달 ──────────────────────────────────
   Props: dispDataset, excludeId (선택 불가 부서 ID, 보통 자기 자신)
   Emits: select({ deptId, deptNm }), close
   ─────────────────────────────────────────────────── */
/* ── 메뉴 트리 선택 모달 ──────────────────────────────
   Props: dispDataset, excludeId
   Emits: select({ menuId, menuNm }), close
   ─────────────────────────────────────────────────── */
/* ── 권한 트리 선택 모달 ──────────────────────────────
   Props: dispDataset, excludeId
   Emits: select({ roleId, roleNm }), close
   ─────────────────────────────────────────────────── */
window.RoleTreeModal = {
  name: 'RoleTreeModal',
  inheritAttrs: false,
  props: {
    dispDataset:   { type: Object,    default: () => ({}) },              // 디스플레이 데이터셋
    excludeId:     { type: String,    default: null },                    // 제외할 ID
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { reactive, computed, onMounted, watch } = Vue;
    const searchParam = reactive({ searchValue: '' });
    const allRoles = reactive([]);
    const pager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [5, 10, 20, 30, 50] });

    /* 목록조회 */
    const handleSearchList = async () => {
      try {
        const res = await boApiSvc.syRole.getList({ pageSize: 10000 }, '역할관리', '목록조회');
        allRoles.splice(0, allRoles.length, ...(res.data?.data || []));
      } catch (e) { allRoles.splice(0, allRoles.length); }
    };
    onMounted(() => { handleSearchList(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchList(); });

    /* fnBuildTree */
    const fnBuildTree = (items, parentId, depth) => {
      return items
        .filter(r => (r.parentRoleId || null) === (parentId || null))
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(r => ({ ...r, _depth: depth, _kids: fnBuildTree(items, r.roleId, depth + 1) }));
    };

    /* fnFlatten */
    const fnFlatten = (nodes, result = []) => {
      nodes.forEach(n => { result.push(n); fnFlatten(n._kids, result); });
      return result;
    };

    const cfFlatTree = computed(() => {
      const excSet = new Set();
      if (props.excludeId) {
        const mark = (id) => { excSet.add(id); allRoles.filter(r => r.parentRoleId === id).forEach(r => mark(r.roleId)); };
        mark(props.excludeId);
      }
      const base = allRoles.filter(r => !excSet.has(r.roleId) && r.useYn === 'Y');
      const kwVal = searchParam.searchValue.trim().toLowerCase();
      const list  = kwVal ? base.filter(r => (r.roleNm || '').toLowerCase().includes(kwVal) || (r.roleCode || '').toLowerCase().includes(kwVal)) : base;
      return fnFlatten(fnBuildTree(list, null, 0));
    });

    /* fnBuildPagerNums + cfPageRows (클라이언트 페이징) */
    const fnBuildPagerNums = () => {
      pager.pageTotalCount = cfFlatTree.value.length;
      pager.pageTotalPage = Math.max(1, Math.ceil(pager.pageTotalCount / pager.pageSize));
      const s = Math.max(1, pager.pageNo - 2), e = Math.min(pager.pageTotalPage, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };
    const cfPageRows = computed(() => {
      fnBuildPagerNums();
      const start = (pager.pageNo - 1) * pager.pageSize;
      return cfFlatTree.value.slice(start, start + pager.pageSize);
    });
    watch(() => searchParam.searchValue, () => { pager.pageNo = 1; });

    /* onSearch / onReset */
    const onSearch    = () => { pager.pageNo = 1; };
    const onReset     = () => { searchParam.searchValue = ''; pager.pageNo = 1; };

    /* onSetPage / onSizeChange */
    const onSetPage    = (n) => { if (n >= 1 && n <= pager.pageTotalPage) pager.pageNo = n; };
    const onSizeChange = ()  => { pager.pageNo = 1; };

    /* onSelect */
    const onSelect = (role) => {
      emit('select', { roleId: role.roleId, roleNm: role.roleNm });
      if (props.onCallback) props.onCallback(props.modalName, null, { roleId: role.roleId, roleNm: role.roleNm });
    };

    /* onSelectNone */
    const onSelectNone = () => {
      emit('select', { roleId: null, roleNm: '' });
      if (props.onCallback) props.onCallback(props.modalName, null, { roleId: null, roleNm: '' });
    };
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ RoleTreeModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'searchParam-search') {
        return onSearch();
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ RoleTreeModal : handleSelectAction -> ', cmd, param);
      if (cmd === 'rolesTree-select') {
        return onSelect(param);
      } else if (cmd === 'rolesTree-select-none') {
        return onSelectNone();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* baseSearchColumns — 검색 영역 컬럼 */
    const baseSearchColumns = [
      { key: 'searchValue', type: 'text', placeholder: '역할명 또는 역할코드 검색' },
    ];

    /* listGridColumns — BoGrid 컬럼 정의 (트리 들여쓰기 + 코드) */
    const _MARKERS = ['●', '◦', '·', '-'];
    const _MARKER_COLORS = ['#e8587a', '#2563eb', '#52c41a', '#f59e0b'];
    const listGridColumns = [
      { key: '_role', label: '역할', html: true, fmt: (v, row) => {
        const d = row._depth || 0;
        const m = _MARKERS[Math.min(d, 3)];
        const c = _MARKER_COLORS[Math.min(d, 3)];
        const sz = d === 0 ? '7px' : '12px';
        return `<span style="display:inline-block;margin-left:${d*14}px;margin-right:7px;font-weight:700;font-size:${sz};color:${c};">${m}</span>`
             + `<span style="font-size:13px;font-weight:600;color:#1a1a2e;">${row.roleNm || '-'}</span>`
             + `<code style="font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 5px;border-radius:3px;margin-left:6px;letter-spacing:.3px;">${row.roleCode || ''}</code>`;
      } },
    ];

    return {
      cfSiteNm, searchParam, cfPageRows, pager,                               // 데이터
      baseSearchColumns, listGridColumns,                                      // 컬럼 정의
      onSetPage, onSizeChange,                                                // 페이저 콜백
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" max-width="560px" max-height="80vh" box-pad="0" body-pad="0" @close="handleBtnAction('modal-close')">
  <div style="height:100%;display:flex;flex-direction:column;overflow:hidden;">
    <div class="tree-modal-header">
      <div>
        <div style="font-size:15px;font-weight:700;color:#1a1a2e;">
          상위역할 선택
          <span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">
            {{ cfSiteNm }}
          </span>
        </div>
        <div style="font-size:11px;color:#aaa;margin-top:1px;">
          역할을 클릭하면 상위역할로 지정됩니다
        </div>
      </div>
      <span class="modal-close" @click="handleBtnAction('modal-close')">
        ✕
      </span>
    </div>
    <!-- 검색 영역 -->
    <div style="padding:10px 14px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <bo-search-area :columns="baseSearchColumns" :param="searchParam"
        @search="handleBtnAction('searchParam-search')" @reset="handleBtnAction('searchParam-reset')" />
    </div>
    <!-- 상위없음 옵션 (고정 행) -->
    <div style="display:flex;align-items:center;gap:0;padding:11px 16px;cursor:pointer;border-bottom:2px solid #f0f0f0;background:#fafafa;flex-shrink:0;"
      @click="handleSelectAction('rolesTree-select-none')">
      <span style="font-size:7px;font-weight:700;color:#e8587a;margin-right:8px;flex-shrink:0;">
        ●
      </span>
      <div style="flex:1;">
        <span style="font-size:13px;font-weight:700;color:#1a1a2e;">
          상위없음
        </span>
        <span style="font-size:11px;color:#aaa;margin-left:6px;">
          최상위 권한으로 등록
        </span>
      </div>
    </div>
    <!-- 목록 + 페이저 (BoGrid 내장) -->
    <div style="flex:1;overflow-y:auto;">
      <bo-grid :columns="listGridColumns" :rows="cfPageRows" :pager="pager" row-key="roleId" row-clickable
        :list-title="'총 ' + pager.pageTotalCount + '건'"
        :empty-text="searchParam.searchValue ? '검색 결과가 없습니다.' : '선택 가능한 권한이 없습니다.'"
        @row-click="row => handleSelectAction('rolesTree-select', row)"
 />
      <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChange" />
    </div>
    <div style="padding:11px 16px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;background:#fafafa;">
      <button class="btn btn_cancel" @click="handleBtnAction('modal-close')">
        취소
      </button>
    </div>
  </div>
</bo-modal>
`,
};

window.MenuTreeModal = {
  name: 'MenuTreeModal',
  inheritAttrs: false,
  props: {
    dispDataset:   { type: Object,    default: () => ({}) },              // 디스플레이 데이터셋
    excludeId:     { type: String,    default: null },                    // 제외할 ID
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { reactive, computed, onMounted, watch } = Vue;
    const searchParam = reactive({ searchValue: '' });
    const allMenus = reactive([]);
    const pager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [5, 10, 20, 30, 50] });

    /* 목록조회 */
    const handleSearchList = async () => {
      try {
        const res = await boApiSvc.syMenu.getList({ pageSize: 10000 }, '메뉴관리', '목록조회');
        allMenus.splice(0, allMenus.length, ...(res.data?.data || []));
      } catch (e) { allMenus.splice(0, allMenus.length); }
    };
    onMounted(() => { handleSearchList(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchList(); });

    /* fnBuildTree */
    const fnBuildTree = (items, parentId, depth) => {
      return items
        .filter(m => (m.parentMenuId || null) === (parentId || null))
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(m => ({ ...m, _depth: depth, _kids: fnBuildTree(items, m.menuId, depth + 1) }));
    };

    /* fnFlatten */
    const fnFlatten = (nodes, result = []) => {
      nodes.forEach(n => { result.push(n); fnFlatten(n._kids, result); });
      return result;
    };

    const cfFlatTree = computed(() => {
      const excSet = new Set();
      if (props.excludeId) {
        const markExclude = (id) => {
          excSet.add(id);
          allMenus.filter(m => m.parentMenuId === id).forEach(m => markExclude(m.menuId));
        };
        markExclude(props.excludeId);
      }
      const base = allMenus.filter(m => !excSet.has(m.menuId) && m.useYn === 'Y');
      const kwVal = searchParam.searchValue.trim().toLowerCase();
      const list  = kwVal
        ? base.filter(m => (m.menuNm || '').toLowerCase().includes(kwVal) || (m.menuCode || '').toLowerCase().includes(kwVal))
        : base;
      return fnFlatten(fnBuildTree(list, null, 0));
    });

    /* fnBuildPagerNums + cfPageRows */
    const fnBuildPagerNums = () => {
      pager.pageTotalCount = cfFlatTree.value.length;
      pager.pageTotalPage = Math.max(1, Math.ceil(pager.pageTotalCount / pager.pageSize));
      const s = Math.max(1, pager.pageNo - 2), e = Math.min(pager.pageTotalPage, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };
    const cfPageRows = computed(() => {
      fnBuildPagerNums();
      const start = (pager.pageNo - 1) * pager.pageSize;
      return cfFlatTree.value.slice(start, start + pager.pageSize);
    });
    watch(() => searchParam.searchValue, () => { pager.pageNo = 1; });

    /* onSetPage / onSizeChange */
    const onSetPage    = (n) => { if (n >= 1 && n <= pager.pageTotalPage) pager.pageNo = n; };
    const onSizeChange = ()  => { pager.pageNo = 1; };

    /* onSelect */
    const onSelect = (menu) => {
      emit('select', { menuId: menu.menuId, menuNm: menu.menuNm });
      if (props.onCallback) props.onCallback(props.modalName, null, { menuId: menu.menuId, menuNm: menu.menuNm });
    };

    /* onSelectNone */
    const onSelectNone = () => {
      emit('select', { menuId: null, menuNm: '' });
      if (props.onCallback) props.onCallback(props.modalName, null, { menuId: null, menuNm: '' });
    };
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ MenuTreeModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'searchParam-search') {
        pager.pageNo = 1;
      } else if (cmd === 'searchParam-reset') {
        searchParam.searchValue = ''; pager.pageNo = 1;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ MenuTreeModal : handleSelectAction -> ', cmd, param);
      if (cmd === 'menuTree-select') {
        return onSelect(param);
      } else if (cmd === 'menuTree-select-none') {
        return onSelectNone();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* baseSearchColumns — 검색 영역 컬럼 */
    const baseSearchColumns = [
      { key: 'searchValue', type: 'text', placeholder: '메뉴명 또는 메뉴코드 검색' },
    ];

    /* listGridColumns — BoGrid 컬럼 정의 (트리 들여쓰기 + 코드) */
    const _MARKERS = ['●', '◦', '·', '-'];
    const _MARKER_COLORS = ['#e8587a', '#2563eb', '#52c41a', '#f59e0b'];
    const listGridColumns = [
      { key: '_menu', label: '메뉴', html: true, fmt: (v, row) => {
        const d = row._depth || 0;
        const m = _MARKERS[Math.min(d, 3)];
        const c = _MARKER_COLORS[Math.min(d, 3)];
        const sz = d === 0 ? '7px' : '12px';
        return `<span style="display:inline-block;margin-left:${d*14}px;margin-right:7px;font-weight:700;font-size:${sz};color:${c};">${m}</span>`
             + `<span style="font-size:13px;font-weight:600;color:#1a1a2e;">${row.menuNm || '-'}</span>`
             + `<code style="font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 5px;border-radius:3px;margin-left:6px;letter-spacing:.3px;">${row.menuCode || ''}</code>`;
      } },
    ];

    return {
      cfSiteNm, searchParam, cfPageRows, pager,                               // 데이터
      baseSearchColumns, listGridColumns,                                      // 컬럼 정의
      onSetPage, onSizeChange,                                                // 페이저 콜백
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" max-width="560px" max-height="80vh" box-pad="0" body-pad="0" @close="handleBtnAction('modal-close')">
  <div style="height:100%;display:flex;flex-direction:column;overflow:hidden;">
    <!-- ── 헤더 ── -->
    <div class="tree-modal-header">
      <div>
        <div style="font-size:15px;font-weight:700;color:#1a1a2e;">
          상위메뉴 선택
          <span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">
            {{ cfSiteNm }}
          </span>
        </div>
        <div style="font-size:11px;color:#aaa;margin-top:1px;">
          메뉴를 클릭하면 상위메뉴로 지정됩니다
        </div>
      </div>
      <span class="modal-close" @click="handleBtnAction('modal-close')">
        ✕
      </span>
    </div>
    <!-- ── 검색 ── -->
    <div style="padding:10px 14px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <bo-search-area :columns="baseSearchColumns" :param="searchParam"
        @search="handleBtnAction('searchParam-search')" @reset="handleBtnAction('searchParam-reset')" />
    </div>
    <!-- ── 상위없음 옵션 (고정 행) ── -->
    <div style="display:flex;align-items:center;gap:0;padding:11px 16px;cursor:pointer;border-bottom:2px solid #f0f0f0;background:#fafafa;flex-shrink:0;"
      @click="handleSelectAction('menuTree-select-none')">
      <span style="font-size:7px;font-weight:700;color:#e8587a;margin-right:8px;flex-shrink:0;">
        ●
      </span>
      <div style="flex:1;">
        <span style="font-size:13px;font-weight:700;color:#1a1a2e;">
          상위없음
        </span>
        <span style="font-size:11px;color:#aaa;margin-left:6px;">
          최상위 메뉴로 등록
        </span>
      </div>
    </div>
    <!-- ── 목록 + 페이저 ── -->
    <div style="flex:1;overflow-y:auto;">
      <bo-grid :columns="listGridColumns" :rows="cfPageRows" :pager="pager" row-key="menuId" row-clickable
        :list-title="'총 ' + pager.pageTotalCount + '건'"
        :empty-text="searchParam.searchValue ? '검색 결과가 없습니다.' : '선택 가능한 메뉴가 없습니다.'"
        @row-click="row => handleSelectAction('menuTree-select', row)"
 />
      <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChange" />
    </div>
    <!-- ── 푸터 ── -->
    <div style="padding:11px 16px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;background:#fafafa;">
      <button class="btn btn_cancel" @click="handleBtnAction('modal-close')">
        취소
      </button>
    </div>
  </div>
</bo-modal>
`,
};

window.DeptTreeModal = {
  name: 'DeptTreeModal',
  inheritAttrs: false,
  props: {
    dispDataset:   { type: Object,    default: () => ({}) },              // 디스플레이 데이터셋
    excludeId:     { type: String,    default: null },                    // 제외할 ID
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { reactive, computed, onMounted, watch } = Vue;
    const searchParam = reactive({ searchValue: '' });
    const allDepts = reactive([]);
    const pager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [5, 10, 20, 30, 50] });

    /* 목록조회 */
    const handleSearchList = async () => {
      try {
        const res = await boApiSvc.syDept.getList({ pageSize: 10000 }, '부서관리', '목록조회');
        allDepts.splice(0, allDepts.length, ...(res.data?.data || []));
      } catch (e) { allDepts.splice(0, allDepts.length); }
    };
    onMounted(() => { handleSearchList(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchList(); });

    /* ── 트리 구성 ── */
    const buildTree = (items, parentId, depth) => {
      return items
        .filter(d => (d.parentDeptId || null) === (parentId || null))
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(d => ({ ...d, _depth: depth, _kids: buildTree(items, d.deptId, depth + 1) }));
    };

    /* flatten */
    const flatten = (nodes, result = []) => {
      nodes.forEach(n => { result.push(n); flatten(n._kids, result); });
      return result;
    };

    const cfFlatTree = computed(() => {
      const excSet = new Set();
      if (props.excludeId) {
        const markExclude = (id) => {
          excSet.add(id);
          allDepts.filter(d => d.parentDeptId === id).forEach(d => markExclude(d.deptId));
        };
        markExclude(props.excludeId);
      }
      const base = allDepts.filter(d => !excSet.has(d.deptId) && d.useYn === 'Y');
      const kwVal = searchParam.searchValue.trim().toLowerCase();
      const list  = kwVal
        ? base.filter(d => (d.deptNm || '').toLowerCase().includes(kwVal) || (d.deptCode || '').toLowerCase().includes(kwVal))
        : base;
      return flatten(buildTree(list, null, 0));
    });

    /* fnBuildPagerNums + cfPageRows */
    const fnBuildPagerNums = () => {
      pager.pageTotalCount = cfFlatTree.value.length;
      pager.pageTotalPage = Math.max(1, Math.ceil(pager.pageTotalCount / pager.pageSize));
      const s = Math.max(1, pager.pageNo - 2), e = Math.min(pager.pageTotalPage, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };
    const cfPageRows = computed(() => {
      fnBuildPagerNums();
      const start = (pager.pageNo - 1) * pager.pageSize;
      return cfFlatTree.value.slice(start, start + pager.pageSize);
    });
    watch(() => searchParam.searchValue, () => { pager.pageNo = 1; });

    /* onSetPage / onSizeChange */
    const onSetPage    = (n) => { if (n >= 1 && n <= pager.pageTotalPage) pager.pageNo = n; };
    const onSizeChange = ()  => { pager.pageNo = 1; };

    /* select */
    const select = (dept) => {
      emit('select', { deptId: dept.deptId, deptNm: dept.deptNm });
      if (props.onCallback) props.onCallback(props.modalName, null, { deptId: dept.deptId, deptNm: dept.deptNm });
    };

    /* selectNone */
    const selectNone = () => {
      emit('select', { deptId: null, deptNm: '' });
      if (props.onCallback) props.onCallback(props.modalName, null, { deptId: null, deptNm: '' });
    };
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ DeptTreeModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'searchParam-search') {
        pager.pageNo = 1;
      } else if (cmd === 'searchParam-reset') {
        searchParam.searchValue = ''; pager.pageNo = 1;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ DeptTreeModal : handleSelectAction -> ', cmd, param);
      if (cmd === 'deptTree-select') {
        return select(param);
      } else if (cmd === 'deptTree-select-none') {
        return selectNone();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* baseSearchColumns — 검색 영역 컬럼 */
    const baseSearchColumns = [
      { key: 'searchValue', type: 'text', placeholder: '부서명 또는 부서코드 검색' },
    ];

    /* listGridColumns — BoGrid 컬럼 정의 (트리 들여쓰기 + 코드) */
    const _MARKERS = ['●', '◦', '·', '-'];
    const _MARKER_COLORS = ['#e8587a', '#2563eb', '#52c41a', '#f59e0b'];
    const listGridColumns = [
      { key: '_dept', label: '부서', html: true, fmt: (v, row) => {
        const d = row._depth || 0;
        const m = _MARKERS[Math.min(d, 3)];
        const c = _MARKER_COLORS[Math.min(d, 3)];
        const sz = d === 0 ? '7px' : '12px';
        return `<span style="display:inline-block;margin-left:${d*14}px;margin-right:7px;font-weight:700;font-size:${sz};color:${c};">${m}</span>`
             + `<span style="font-size:13px;font-weight:600;color:#1a1a2e;">${row.deptNm || '-'}</span>`
             + `<code style="font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 5px;border-radius:3px;margin-left:6px;letter-spacing:.3px;">${row.deptCode || ''}</code>`;
      } },
    ];

    return {
      cfSiteNm, searchParam, cfPageRows, pager,                               // 데이터
      baseSearchColumns, listGridColumns,                                      // 컬럼 정의
      onSetPage, onSizeChange,                                                // 페이저 콜백
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" max-width="560px" max-height="80vh" box-pad="0" body-pad="0" @close="handleBtnAction('modal-close')">
  <div style="height:100%;display:flex;flex-direction:column;overflow:hidden;">
    <!-- ── 헤더 ── -->
    <div class="tree-modal-header">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:18px;line-height:1;">
          🌳
        </span>
        <div>
          <div style="font-size:15px;font-weight:700;color:#1a1a2e;">
            상위부서 선택
            <span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">
              {{ cfSiteNm }}
            </span>
          </div>
          <div style="font-size:11px;color:#aaa;margin-top:1px;">
            부서를 클릭하면 상위부서로 지정됩니다
          </div>
        </div>
      </div>
      <span class="modal-close" @click="handleBtnAction('modal-close')">
        ✕
      </span>
    </div>
    <!-- ── 검색 ── -->
    <div style="padding:10px 14px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <bo-search-area :columns="baseSearchColumns" :param="searchParam"
        @search="handleBtnAction('searchParam-search')" @reset="handleBtnAction('searchParam-reset')" />
    </div>
    <!-- ── 상위없음 옵션 (고정 행) ── -->
    <div style="display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;border-bottom:2px solid #f0f0f0;background:#fafafa;flex-shrink:0;"
      @click="handleSelectAction('deptTree-select-none')">
      <div style="width:4px;align-self:stretch;border-radius:3px;background:#e8587a;flex-shrink:0;opacity:0.7;">
      </div>
      <span style="font-size:20px;flex-shrink:0;line-height:1;">
        🏢
      </span>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:700;color:#1a1a2e;">
          상위없음
        </div>
        <div style="font-size:11px;color:#aaa;margin-top:2px;">
          최상위 부서로 등록
        </div>
      </div>
    </div>
    <!-- ── 목록 + 페이저 ── -->
    <div style="flex:1;overflow-y:auto;">
      <bo-grid :columns="listGridColumns" :rows="cfPageRows" :pager="pager" row-key="deptId" row-clickable
        :list-title="'총 ' + pager.pageTotalCount + '건'"
        :empty-text="searchParam.searchValue ? '검색 결과가 없습니다.' : '선택 가능한 부서가 없습니다.'"
        @row-click="row => handleSelectAction('deptTree-select', row)"
 />
      <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChange" />
    </div>
    <!-- ── 푸터 ── -->
    <div style="padding:11px 16px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;background:#fafafa;">
      <button class="btn btn_cancel" @click="handleBtnAction('modal-close')">
        취소
      </button>
    </div>
  </div>
</bo-modal>
`,
};

/* ─────────────────────────────────────────────
   CategoryTreeModal  상위카테고리 선택 팝업
───────────────────────────────────────────── */
window.CategoryTreeModal = {
  name: 'CategoryTreeModal',
  inheritAttrs: false,
  props: {
    dispDataset:   { type: Object,    default: () => ({}) },              // 디스플레이 데이터셋
    excludeId:     { type: String,    default: null },                    // 제외할 ID
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { reactive, computed, onMounted, watch } = Vue;
    const searchParam = reactive({ searchValue: '' });
    const allCategories = reactive([]);
    const pager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [5, 10, 20, 30, 50] });

    /* 목록조회 */
    const handleSearchList = async () => {
      try {
        const res = await boApiSvc.pdCategory.getList({ pageSize: 10000 }, '카테고리관리', '목록조회');
        allCategories.splice(0, allCategories.length, ...(res.data?.data || []));
      } catch (e) { allCategories.splice(0, allCategories.length); }
    };
    onMounted(() => { handleSearchList(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchList(); });

    /* buildTree */
    const buildTree = (items, parentId, depth) => {
      return items
        .filter(c => (c.parentCategoryId || null) === (parentId || null))
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(c => ({ ...c, _depth: depth, _kids: buildTree(items, c.categoryId, depth + 1) }));
    };

    /* flatten */
    const flatten = (nodes, result = []) => {
      nodes.forEach(n => { result.push(n); flatten(n._kids, result); });
      return result;
    };

    const cfFlatTree = computed(() => {
      const excSet = new Set();
      if (props.excludeId) {
        const mark = (id) => { excSet.add(id); allCategories.filter(c => c.parentCategoryId === id).forEach(c => mark(c.categoryId)); };
        mark(props.excludeId);
      }
      const base   = allCategories.filter(c => !excSet.has(c.categoryId) && (c.useYn === 'Y' || c.status === '활성'));
      const kwVal  = searchParam.searchValue.trim().toLowerCase();
      const list   = kwVal ? base.filter(c => (c.categoryNm || '').toLowerCase().includes(kwVal)) : base;
      return flatten(buildTree(list, null, 0));
    });

    /* fnBuildPagerNums + cfPageRows */
    const fnBuildPagerNums = () => {
      pager.pageTotalCount = cfFlatTree.value.length;
      pager.pageTotalPage = Math.max(1, Math.ceil(pager.pageTotalCount / pager.pageSize));
      const s = Math.max(1, pager.pageNo - 2), e = Math.min(pager.pageTotalPage, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };
    const cfPageRows = computed(() => {
      fnBuildPagerNums();
      const start = (pager.pageNo - 1) * pager.pageSize;
      return cfFlatTree.value.slice(start, start + pager.pageSize);
    });
    watch(() => searchParam.searchValue, () => { pager.pageNo = 1; });

    /* onSetPage / onSizeChange */
    const onSetPage    = (n) => { if (n >= 1 && n <= pager.pageTotalPage) pager.pageNo = n; };
    const onSizeChange = ()  => { pager.pageNo = 1; };

    /* select */
    const select     = (cat) => {
      emit('select', { categoryId: cat.categoryId, categoryNm: cat.categoryNm });
      if (props.onCallback) props.onCallback(props.modalName, null, { categoryId: cat.categoryId, categoryNm: cat.categoryNm });
    };

    /* selectNone */
    const selectNone = () => {
      emit('select', { categoryId: null, categoryNm: '' });
      if (props.onCallback) props.onCallback(props.modalName, null, { categoryId: null, categoryNm: '' });
    };
    const cfSiteNm   = computed(() => boUtil.bofGetSiteNm());

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ CategoryTreeModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'searchParam-search') {
        pager.pageNo = 1;
      } else if (cmd === 'searchParam-reset') {
        searchParam.searchValue = ''; pager.pageNo = 1;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ CategoryTreeModal : handleSelectAction -> ', cmd, param);
      if (cmd === 'categoryTree-select') {
        return select(param);
      } else if (cmd === 'categoryTree-select-none') {
        return selectNone();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* baseSearchColumns — 검색 영역 컬럼 */
    const baseSearchColumns = [
      { key: 'searchValue', type: 'text', placeholder: '카테고리명 검색' },
    ];

    /* listGridColumns — BoGrid 컬럼 정의 (트리 들여쓰기 + 단계) */
    const _MARKERS = ['●', '◦', '·', '-'];
    const _MARKER_COLORS = ['#e8587a', '#2563eb', '#52c41a', '#f59e0b'];
    const listGridColumns = [
      { key: '_cat', label: '카테고리', html: true, fmt: (v, row) => {
        const d = row._depth || 0;
        const m = _MARKERS[Math.min(d, 3)];
        const c = _MARKER_COLORS[Math.min(d, 3)];
        const sz = d === 0 ? '7px' : '12px';
        return `<span style="display:inline-block;margin-left:${d*14}px;margin-right:7px;font-weight:700;font-size:${sz};color:${c};">${m}</span>`
             + `<span style="font-size:13px;font-weight:600;color:#1a1a2e;">${row.categoryNm || '-'}</span>`
             + `<span style="font-size:11px;color:#aaa;margin-left:6px;">${row.depth || ''}단계</span>`;
      } },
    ];

    return {
      cfSiteNm, searchParam, cfPageRows, pager,                               // 데이터
      baseSearchColumns, listGridColumns,                                      // 컬럼 정의
      onSetPage, onSizeChange,                                                // 페이저 콜백
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" max-width="560px" max-height="80vh" box-pad="0" body-pad="0" @close="handleBtnAction('modal-close')">
  <div style="height:100%;display:flex;flex-direction:column;overflow:hidden;">
    <div class="tree-modal-header">
      <div>
        <div style="font-size:15px;font-weight:700;color:#1a1a2e;">
          상위카테고리 선택
          <span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">
            {{ cfSiteNm }}
          </span>
        </div>
        <div style="font-size:11px;color:#aaa;margin-top:1px;">
          카테고리를 클릭하면 상위카테고리로 지정됩니다
        </div>
      </div>
      <span class="modal-close" @click="handleBtnAction('modal-close')">
        ✕
      </span>
    </div>
    <!-- ── 검색 ── -->
    <div style="padding:10px 14px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <bo-search-area :columns="baseSearchColumns" :param="searchParam"
        @search="handleBtnAction('searchParam-search')" @reset="handleBtnAction('searchParam-reset')" />
    </div>
    <!-- ── 상위없음 옵션 (고정 행) ── -->
    <div style="display:flex;align-items:center;gap:0;padding:11px 16px;cursor:pointer;border-bottom:2px solid #f0f0f0;background:#fafafa;flex-shrink:0;"
      @click="handleSelectAction('categoryTree-select-none')">
      <span style="font-size:7px;font-weight:700;color:#e8587a;margin-right:8px;flex-shrink:0;">
        ●
      </span>
      <div style="flex:1;">
        <span style="font-size:13px;font-weight:700;color:#1a1a2e;">
          상위없음
        </span>
        <span style="font-size:11px;color:#aaa;margin-left:6px;">
          최상위 카테고리로 등록
        </span>
      </div>
    </div>
    <!-- ── 목록 + 페이저 ── -->
    <div style="flex:1;overflow-y:auto;">
      <bo-grid :columns="listGridColumns" :rows="cfPageRows" :pager="pager" row-key="categoryId" row-clickable
        :list-title="'총 ' + pager.pageTotalCount + '건'"
        :empty-text="searchParam.searchValue ? '검색 결과가 없습니다.' : '선택 가능한 카테고리가 없습니다.'"
        @row-click="row => handleSelectAction('categoryTree-select', row)"
 />
      <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChange" />
    </div>
    <div style="padding:11px 16px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;background:#fafafa;">
      <button class="btn btn_cancel" @click="handleBtnAction('modal-close')">
        취소
      </button>
    </div>
  </div>
</bo-modal>
`,
};

/* ── 위젯미리보기 모달 ─────────────────────────────────
   Props:
     show       Boolean   표시 여부
     mode       String    'all' | 'single'
                          all    → area 전체 위젯 (DispPanel)
                          single → 현재 form 단일 위젯 (DispWidget)
     tabLabel   String    탭 이름 (모달 제목용)
     area       String    mode=all 시 사용할 영역코드
     widgets    Array     mode=all 시 dispDataset.displays 배열
     widget     Object    mode=single 시 미리볼 위젯 데이터 (form 스냅샷)
   Emits: close
   ─────────────────────────────────────────────────────────── */
window.DispPreviewModal = {
  name: 'DispPreviewModal',
  inheritAttrs: false,
  props: {
    show:     { type: Boolean, default: false, reloadTrigger: { type: Number, default: 0 } },
    mode:     { type: String,  default: 'single' },   /* 'all' | 'single' */
    tabLabel: { type: String,  default: '위젯미리보기' },
    area:     { type: String,  default: '' },
    widgets:  { type: Array,   default: () => [] },
    widget:   { type: Object,  default: () => ({}) },
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { computed } = Vue;

    /* mode=all: 해당 area의 활성 위젯 목록 */
    const cfAreaWidgets = computed(() =>
      props.widgets
        .filter(w => w.area === props.area && w.status === '활성')
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    );

    /* mode=single: form 스냅샷에 status='활성' 강제 적용하여 렌더 */
    const cfPreviewWidget = computed(() => ({ ...props.widget, status: '활성' }));

    const WIDGET_LABEL = {
      image_banner: '이미지 배너', product_slider: '상품 슬라이더', product: '상품',
      chart_bar: '차트(Bar)', chart_line: '차트(Line)', chart_pie: '차트(Pie)',
      text_banner: '텍스트 배너', info_card: '정보 카드', popup: '팝업',
      file: '파일', coupon: '쿠폰', html_editor: 'HTML 에디터',
      event_banner: '이벤트', cache_banner: '캐쉬', widget_embed: '위젯 임베드',
    };
    const cfWidgetLabel = computed(() => WIDGET_LABEL[props.widget?.widgetType] || props.widget?.widgetType || '');

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ DispPreviewModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (미사용) */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ DispPreviewModal : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    return {
      cfAreaWidgets, cfPreviewWidget, cfWidgetLabel,                          // 데이터
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="show" max-width="560px" max-height="88vh" box-pad="0" body-pad="0" :z-index="500" @close="handleBtnAction('modal-close')">
  <div style="background:#fff;border-radius:12px;height:100%;display:flex;flex-direction:column;overflow:hidden;">
    <!-- 헤더 -->
    <div style="padding:14px 18px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:#fafafa;">
      <div>
        <span style="font-size:14px;font-weight:700;color:#333;">
          👁 위젯미리보기
        </span>
        <span style="margin-left:8px;font-size:12px;color:#e8587a;font-weight:600;">
          {{ tabLabel }}
        </span>
        <span v-if="mode==='single' ? (cfWidgetLabel) : false" style="margin-left:6px;font-size:11px;color:#aaa;">
        ({{ cfWidgetLabel }})
      </span>
      <span v-if="mode==='all' ? (area) : false" style="margin-left:6px;font-size:11px;color:#aaa;">
      영역: {{ area }}
    </span>
  </div>
  <button @click="handleBtnAction('modal-close')"
        style="background:none;border:none;cursor:pointer;font-size:18px;color:#aaa;line-height:1;padding:2px 6px;">
    ✕
  </button>
</div>
<!-- 콘텐츠 -->
<div style="flex:1;overflow-y:auto;padding:20px;">
  <!-- mode=all: 해당 area 전체 위젯 -->
  <template v-if="mode==='all'">
    <div v-if="cfAreaWidgets.length===0"
          style="text-align:center;color:#bbb;padding:40px 0;font-size:13px;">
      <div style="font-size:32px;margin-bottom:8px;">
        📭
      </div>
      [{{ area }}] 영역에 활성 위젯이 없습니다.
    </div>
    <div v-else style="display:flex;flex-direction:column;gap:12px;">
      <div v-for="w in cfAreaWidgets" :key="w.dispId">
        <div style="font-size:10px;color:#bbb;margin-bottom:4px;font-family:monospace;">
          #{{ w.dispId }} {{ w.name }} · 순서{{ w.sortOrder }}
        </div>
        <disp-x04-widget
              :params="{ isLoggedIn: false, userGrade: '' }"
              :disp-dataset="{ displays: [], codes: [] }"
              :disp-opt="{ showBadges: true }"
              :widget-item="w"
              />
      </div>
    </div>
  </template>
  <!-- mode=single: 현재 form 단일 위젯 -->
  <template v-else>
    <div style="font-size:10px;color:#bbb;margin-bottom:8px;font-family:monospace;">
      현재 입력값 기준 실시간 위젯미리보기
    </div>
    <!-- widgetType 없으면 DispWidget 렌더 금지 (widgetType.startsWith 오류 방지) -->
    <div v-if="cfPreviewWidget.widgetType"
          style="border:1px dashed #e0e0e0;border-radius:8px;padding:16px;background:#fafbff;">
      <disp-x04-widget
            :params="{ isLoggedIn: false, userGrade: '' }"
            :disp-dataset="{ displays: [], codes: [] }"
            :disp-opt="{ showBadges: true }"
            :widget-item="cfPreviewWidget"
            />
    </div>
    <div v-else
          style="text-align:center;color:#bbb;padding:40px 0;font-size:13px;">
      <div style="font-size:28px;margin-bottom:8px;">
        🎨
      </div>
      행(1~5행)에서 위젯 유형을 선택하면
      <br>
      위젯미리보기가 표시됩니다.
    </div>
  </template>
</div>
<!-- 푸터 -->
<div style="padding:10px 18px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;background:#fafafa;">
  <button class="btn btn_close" @click="handleBtnAction('modal-close')">
    닫기
  </button>
</div>
</div>
</bo-modal>
`,
};

/* ── 전시 DispUi 모달 ──────────────────────────────────────────
   Props:
     show      (Boolean)  — 표시 여부
     params    (Object)   — { areas[], date, time, status, condition,
                              authRequired, authGrade, siteId, memberId, viewOpts }
     dispDataset (Object)   — dispDataset 객체
     title     (String)   — 모달 헤더 제목
   Emits: close, open-popup
   ── DispUiPage.js와 동일한 DispX01Ui를 모달 안에서 렌더링
      파라미터 요약 바는 DispX01Ui 내부에서 viewOpts 있을 때 표시 ── */
window.DispUiModal = {
  name: 'DispUiModal',
  inheritAttrs: false,
  props: {
    show:      { type: Boolean, default: false, reloadTrigger: { type: Number, default: 0 } },
    params:    { type: Object,  default: () => ({
      areas: [], date: '', time: '', status: '', condition: '',
      authRequired: '', authGrade: '', siteId: '', memberId: '', viewOpts: '',
    }) },
    dispDataset: { type: Object,  default: () => window.dispDataset || { displays: [], codes: [] } },
    title:     { type: String,  default: 'DispUi미리보기' },
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['close', 'open-popup'],
  components: { DispX01Ui: window.DispX01Ui },
  setup(_, { emit }) {
    const innerKey = Vue.ref(0);

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ DispUiModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      // 팝업으로 열기
      } else if (cmd === 'modal-open-popup') {
        emit('open-popup');
        if (props.onCallback) props.onCallback(props.modalName, null, true);
        return;
      // 재조회 (innerKey 증가)
      } else if (cmd === 'modal-reload') {
        innerKey.value++;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (미사용) */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ DispUiModal : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };
    return {
      innerKey,                                                               // 데이터
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="show" width="1200px" max-width="96vw" max-height="90vh"
  box-pad="0" body-pad="0" :z-index="9999" @close="handleBtnAction('modal-close')">
  <div style="border-radius:14px;display:flex;flex-direction:column;height:100%;overflow:hidden;">
    <!-- 헤더 -->
    <div style="background:linear-gradient(135deg,#6a1b9a,#4a148c);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:2;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:15px;font-weight:700;">
          🖥 {{ title }}
        </span>
        <span style="font-size:11px;opacity:.6;">
          파라미터 기준 렌더링
        </span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <button @click="handleBtnAction('modal-reload')"
          style="font-size:11px;padding:4px 12px;border-radius:7px;border:1px solid rgba(255,255,255,0.4);background:rgba(255,255,255,0.15);color:#fff;cursor:pointer;font-weight:600;">
          🔄 재조회
        </button>
        <button @click="handleBtnAction('modal-close')"
          style="background:none;border:none;color:#fff;font-size:24px;cursor:pointer;opacity:.8;line-height:1;padding:0;">
          ×
        </button>
      </div>
    </div>
    <!-- 본문: DispX01Ui (파라미터 요약 바는 viewOpts 있을 때 내부 표시) -->
    <div style="flex:1;overflow-y:auto;">
      <disp-x01-ui :key="innerKey" :params="params" :disp-dataset="dispDataset" />
    </div>
    <!-- 푸터 -->
    <div style="padding:10px 20px;background:#f8f8f8;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:8px;flex-shrink:0;">
      <button @click="handleBtnAction('modal-open-popup')"
        style="font-size:12px;padding:5px 16px;border-radius:8px;border:1px solid #a5d6a7;background:#e8f5e9;color:#2e7d32;cursor:pointer;font-weight:600;">
        🔗 팝업으로 열기
      </button>
      <button class="btn btn_close" @click="handleBtnAction('modal-close')">
        닫기
      </button>
    </div>
  </div>
</bo-modal>
`,
};

/* ── 카테고리 멀티선택 모달 (사용자 페이스 Sample용) ────────────
   Props: show (Boolean), selectedIds (Array of categoryId)
   Emits: close, apply (Array of categoryId)
   window.dispDataset.categories 직접 참조 (props 없음)
   트리 구조: 전체(root) > 루트노드(체크+[+/-]) > 자식노드(체크)
   ─────────────────────────────────────────────────────────── */
window.CategorySelectModal = {
  name: 'CategorySelectModal',
  inheritAttrs: false,
  props: {
    show:        { type: Boolean, default: false, reloadTrigger: { type: Number, default: 0 } },
    selectedIds: { type: Array,   default: () => [] },
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['close', 'apply'],
  setup(props, { emit }) {
    const { reactive, computed, watch } = Vue;

    const searchParam = reactive({ searchValue: '' });
    const pager = reactive({ pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageNums: [], pageSizes: [5, 10, 20, 30, 50, 100, 200, 500] });

    /* cfAllCats — 활성 카테고리 (parent-child 평탄화, _depth 부여) */
    const cfAllCats = computed(() => {
      const all = ((window.dispDataset || {}).categories || [])
        .filter(c => c.status === '활성')
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
      const roots = all.filter(c => !c.parentCategoryId);
      const out = [];
      roots.forEach(r => {
        out.push({ ...r, _depth: 0 });
        all.filter(c => c.parentCategoryId === r.categoryId).forEach(c => out.push({ ...c, _depth: 1 }));
      });
      return out;
    });

    /* cfFiltered — 검색어 필터링 (자식이 매치하면 부모도 함께 노출) */
    const cfFiltered = computed(() => {
      const kwv = searchParam.searchValue.trim().toLowerCase();
      if (!kwv) return cfAllCats.value;
      const matches = cfAllCats.value.filter(c => c.categoryNm.toLowerCase().includes(kwv));
      const ids = new Set(matches.map(c => c.categoryId));
      const parentIds = new Set(matches.map(c => c.parentCategoryId).filter(Boolean));
      return cfAllCats.value.filter(c => ids.has(c.categoryId) || parentIds.has(c.categoryId));
    });

    /* fnBuildPagerNums + cfPageRows */
    const fnBuildPagerNums = () => {
      const total = cfFiltered.value.length;
      pager.pageTotalCount = total;
      pager.pageTotalPage = Math.max(1, Math.ceil(total / pager.pageSize));
      const c = pager.pageNo, l = pager.pageTotalPage, s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };
    const cfPageRows = computed(() => {
      fnBuildPagerNums();
      const start = (pager.pageNo - 1) * pager.pageSize;
      return cfFiltered.value.slice(start, start + pager.pageSize);
    });
    watch(() => searchParam.searchValue, () => { pager.pageNo = 1; });

    /* onSetPage / onSizeChange */
    const onSetPage    = (n) => { if (n >= 1 && n <= pager.pageTotalPage) pager.pageNo = n; };
    const onSizeChange = () => { pager.pageNo = 1; };

    /* 선택 상태 (로컬 복사) */
    const localSel = reactive(new Set());
    watch(() => props.show, (v) => {
      if (v) { localSel.clear(); props.selectedIds.forEach(id => localSel.add(id)); }
    }, { immediate: true });

    /* 전체 선택 (현재 필터된 전체 토글) */
    const isAllOn = computed(() => cfFiltered.value.length > 0 && cfFiltered.value.every(c => localSel.has(c.categoryId)));
    const cfIsSomeOn = computed(() => !isAllOn.value && cfFiltered.value.some(c => localSel.has(c.categoryId)));
    const toggleAll = () => {
      if (isAllOn.value) cfFiltered.value.forEach(c => localSel.delete(c.categoryId));
      else cfFiltered.value.forEach(c => localSel.add(c.categoryId));
    };

    /* 행 토글 */
    const toggleRow = (row) => { if (localSel.has(row.categoryId)) localSel.delete(row.categoryId); else localSel.add(row.categoryId); };

    /* onReset / apply */
    const onReset = () => localSel.clear();
    const apply = () => {
      emit('apply', [...localSel]);
      if (props.onCallback) props.onCallback(props.modalName, null, [...localSel]);
      emit('close');
      if (props.onCallback) props.onCallback(props.modalName, null, null);
    };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ CategorySelectModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'modal-reset') {
        return onReset();
      } else if (cmd === 'modal-apply') {
        return apply();
      } else if (cmd === 'category-toggle-all') {
        return toggleAll();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ CategorySelectModal : handleSelectAction -> ', cmd, param);
      if (cmd === 'category-toggle-row') {
        return toggleRow(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* baseSearchColumns — 검색 영역 컬럼 */
    const baseSearchColumns = [
      { key: 'searchValue', type: 'text', placeholder: '카테고리명 검색' },
    ];

    /* listGridColumns — BoGrid 컬럼 정의 (체크박스 + 카테고리명 들여쓰기) */
    const listGridColumns = [
      { key: '_check', label: '', style: 'width:32px;text-align:center;', html: true, fmt: (v, row) => {
        return localSel.has(row.categoryId)
          ? `<span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#e8587a;color:#fff;font-size:9px;line-height:14px;font-weight:700;">✓</span>`
          : `<span style="display:inline-block;width:14px;height:14px;border-radius:3px;border:1.5px solid #d1d5db;background:#fff;"></span>`;
      } },
      { key: '_cat', label: '카테고리', html: true, fmt: (v, row) => {
        const d = row._depth || 0;
        const indent = d * 16;
        const weight = d === 0 ? 700 : 400;
        const color  = d === 0 ? '#222' : '#555';
        const marker = d === 0 ? '●' : '◦';
        const mc     = d === 0 ? '#e8587a' : '#2563eb';
        return `<span style="display:inline-block;margin-left:${indent}px;margin-right:6px;color:${mc};font-weight:700;">${marker}</span>`
             + `<span style="font-size:12px;font-weight:${weight};color:${color};">${row.categoryNm || '-'}</span>`;
      } },
    ];

    /* fnRowStyle — 선택된 행 강조 */
    const fnRowStyle = (row) => localSel.has(row.categoryId) ? 'background:#fff4f6;cursor:pointer;' : 'cursor:pointer;';

    return {
      searchParam, pager, cfFiltered, cfPageRows, localSel,                   // 데이터
      isAllOn, cfIsSomeOn,                                                    // computed
      baseSearchColumns, listGridColumns, fnRowStyle,                         // 컬럼 정의
      onSetPage, onSizeChange,                                                // BoGrid pager 콜백
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="show" width="460px" max-height="80vh" box-pad="0" body-pad="0" :z-index="500" @close="handleBtnAction('modal-close')">
  <div style="background:#fff;border-radius:10px;height:100%;display:flex;flex-direction:column;overflow:hidden;">
    <!-- 헤더 -->
    <div style="padding:11px 16px;border-bottom:1px solid #e0e0e0;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
      <span style="font-size:13px;font-weight:700;color:#222;">
        📂 카테고리 선택
      </span>
      <button @click="handleBtnAction('modal-close')" style="background:none;border:none;cursor:pointer;font-size:15px;color:#aaa;padding:2px 5px;line-height:1;">
        ✕
      </button>
    </div>
    <!-- 검색 -->
    <div style="padding:8px 12px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <bo-search-area :columns="baseSearchColumns" :param="searchParam" :show-actions="false" />
    </div>
    <!-- 전체선택 바 -->
    <div style="display:flex;align-items:center;gap:6px;padding:6px 14px;border-bottom:1px solid #f0f0f0;background:#fafafa;flex-shrink:0;cursor:pointer;"
      @click="handleBtnAction('category-toggle-all')">
      <div style="width:14px;height:14px;border-radius:3px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
        :style="isAllOn?'border-color:#e8587a;background:#e8587a;':cfIsSomeOn?'border-color:#e8587a;background:#fce4ec;':'border-color:#aaa;background:#fff;'">
        <span v-if="isAllOn" style="color:#fff;font-size:9px;line-height:1;">
          ✓
        </span>
        <span v-else-if="cfIsSomeOn" style="color:#e8587a;font-size:11px;font-weight:900;line-height:1;margin-top:-1px;">
          −
        </span>
      </div>
      <span style="font-size:12px;font-weight:700;color:#333;">
        전체선택
      </span>
      <span style="margin-left:auto;font-size:11px;color:#aaa;">
        총 <b style="color:#374151;">{{ pager.pageTotalCount }}</b>건
      </span>
    </div>
    <!-- 목록 + 페이저 (BoGrid 내장) -->
    <div style="flex:1;overflow-y:auto;">
      <bo-grid :columns="listGridColumns" :rows="cfPageRows" :pager="pager" row-key="categoryId"
        row-clickable :row-style="fnRowStyle"
        empty-text="검색 결과가 없습니다."
        @row-click="row => handleSelectAction('category-toggle-row', row)"
 />
      <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChange" />
    </div>
    <!-- 하단 버튼 -->
    <div style="padding:9px 12px;border-top:1px solid #e0e0e0;display:flex;align-items:center;gap:8px;flex-shrink:0;">
      <span style="font-size:11px;color:#aaa;flex:1;">
        {{ localSel.size }}개 선택
      </span>
      <button @click="handleBtnAction('modal-reset')" style="font-size:12px;padding:4px 12px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#666;cursor:pointer;">
        초기화
      </button>
      <button @click="handleBtnAction('modal-apply')" style="font-size:12px;padding:4px 16px;border:none;border-radius:6px;background:#e8587a;color:#fff;font-weight:700;cursor:pointer;">
        적용
      </button>
    </div>
  </div>
</bo-modal>
`,
};

/* ═══════════════════════════════════════════════════════════════════
 * RowPickModal — 전시항목(위젯 행) 선택 팝업 (패널에 전시항목 복사)
 * ═══════════════════════════════════════════════════════════════════ */
window.RowPickModal = {
  name: 'RowPickModal',
  inheritAttrs: false,
  props: {
    title:          { type: String,   default: '전시항목 복사' },
    reloadTrigger:  { type: Number,   default: 0 },                     // 재조회 트리거
    displays:       { type: Array,    default: () => [] },              // 전체 패널(dispDataset.displays)
    areas:          { type: Array,    default: () => [] },              // DISP_AREA codes
    excludePanelId: { type: Number,   default: null },                  // 현재 패널 제외
    modalName:      { type: String,   default: '' },                    // 모달 식별자
    onCallback:     { type: Function, default: null },                  // 통합 콜백
  },
  emits: ['close', 'pick-multi'],
  setup(props, { emit }) {
    const { ref, reactive, computed } = Vue;
    const searchType = ref('');
    const searchValue = ref('');
    const searchStatus = ref('');
    const activeStatuses = reactive([]);
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [2, 3, 4, 5, 10, 20, 50, 100];
    const selectedTreeKey = ref('');
    const treeOpen = reactive(new Set(['__root__']));

    /* toggleTree */
    const toggleTree = k => { if (treeOpen.has(k)) treeOpen.delete(k); else treeOpen.add(k); };

    /* isTreeOpen */
    const isTreeOpen = k => treeOpen.has(k);

    /* selectTree */
    const selectTree = k => { selectedTreeKey.value = selectedTreeKey.value === k ? '' : k; pager.page = 1; };

    /* areaNm */
    const areaNm = (code) => {
      const a = props.areas.find(x => x.codeValue === code);
      return a ? a.codeLabel : code;
    };

    /* 모든 위젯을 flatten (panel 정보 포함) */
    const cfAllRows = computed(() => {
      const out = [];
      (props.displays || []).forEach(p => {
        if (props.excludePanelId && p.dispId === props.excludePanelId) return;
        (p.rows || []).forEach((r, i) => {
          out.push({
            __rowId: p.dispId + '_' + i,
            __panelId: p.dispId,
            __panelName: p.name,
            __area: p.area,
            __status: p.status,
            row: r,
            sortIdx: i,
          });
        });
      });
      return out;
    });

    const cfFiltered = computed(() => cfAllRows.value.filter(o => {
      const searchVal = searchValue.value.trim().toLowerCase();
      if (searchVal) {
        const types = searchType.value || 'widgetNm,panelNm,widgetType';
        const hits = [];
        if (types.includes('widgetNm')) hits.push((o.row.widgetNm   || '').toLowerCase().includes(searchVal));
        if (types.includes('panelNm'))  hits.push((o.__panelName    || '').toLowerCase().includes(searchVal));
        if (types.includes('widgetType'))     hits.push((o.row.widgetType || '').toLowerCase().includes(searchVal));
        if (!hits.some(Boolean)) return false;
      }
      if (searchStatus.value && o.__status !== searchStatus.value) return false;
      if (selectedTreeKey.value) {
        const top = (o.__area || '').split('_')[0];
        if (top !== selectedTreeKey.value) return false;
      }
      return true;
    }));

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => {
      const total = cfFiltered.value.length;
      pager.pageTotalCount = total;
      pager.pageTotalPage = Math.max(1, Math.ceil(total / pager.size));
      pager.pageList = cfFiltered.value.slice((pager.page-1)*pager.size, pager.page*pager.size);
      const cur=pager.page, last=pager.pageTotalPage, s=Math.max(1,cur-2), e=Math.min(last,s+4);
      pager.pageNums = Array.from({length:e-s+1},(_,i)=>s+i);
    };
    Vue.watch(cfFiltered, () => { pager.page = 1; fnBuildPagerNums(); }, { immediate: true });
    const cfTree = computed(() => {
      const g = {};
      cfAllRows.value.forEach(o => {
        const top = (o.__area || '(미등록)').split('_')[0];
        g[top] = (g[top] || 0) + 1;
      });
      return Object.keys(g).sort().map(top => ({ label: top, count: g[top] }));
    });

    const checked = reactive(new Set());

    /* isChecked */
    const isChecked = (id) => checked.has(id);

    /* toggleCheck — reactive Set 직접 변이 (const 재할당 금지) */
    const toggleCheck = (id) => {
      if (checked.has(id)) checked.delete(id); else checked.add(id);
    };
    const cfAllChecked = computed(() => (pager.pageList||[]).length > 0 && (pager.pageList||[]).every(o => checked.has(o.__rowId)));

    /* toggleCheckAll */
    const toggleCheckAll = () => {
      if (cfAllChecked.value) (pager.pageList||[]).forEach(o => checked.delete(o.__rowId));
      else (pager.pageList||[]).forEach(o => checked.add(o.__rowId));
    };

    /* pickMulti */
    const pickMulti = () => {
      const picks = cfAllRows.value.filter(o => checked.has(o.__rowId));
      if (!picks.length) return;
      emit('pick-multi', picks.map(o => ({ ...o.row })));
      if (props.onCallback) props.onCallback(props.modalName, null, picks.map(o => ({ ...o.row })));
      checked.clear();
    };

    /* pickOne */
    const pickOne = (o) => {
      emit('pick-multi', [{ ...o.row }]);
      if (props.onCallback) props.onCallback(props.modalName, null, [{ ...o.row }]);
    };

    /* statusCls */
    const statusCls = (s) => s === '활성' ? 'badge-green' : 'badge-gray';

    const WIDGET_LABEL = {
      image_banner:'이미지배너', product_slider:'상품슬라이더', product:'상품',
      chart_bar:'차트', chart_line:'차트', chart_pie:'차트', text_banner:'텍스트',
      info_card:'정보카드', popup:'팝업', file:'파일', coupon:'쿠폰',
      html_editor:'HTML', event_banner:'이벤트', cache_banner:'캐쉬', widget_embed:'위젯',
    };

    /* wLabel */
    const wLabel = (t) => WIDGET_LABEL[t] || t || '-';

    Vue.onMounted(() => {
      /* 상태 = 어댑터 '활성'/'비활성' 값 (구 ACTIVE_STATUS 코드그룹 미사용) */
      activeStatuses.splice(0, activeStatuses.length,
        { codeValue: '활성', codeLabel: '활성' }, { codeValue: '비활성', codeLabel: '비활성' });
    });

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ RowPickModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      // 다중 복사
      } else if (cmd === 'modal-pick-multi') {
        return pickMulti();
      // 전체 토글
      } else if (cmd === 'list-toggle-all') {
        return toggleCheckAll();
      // 페이지 이동
      } else if (cmd === 'pager-set') {
        pager.page = param;
        return;
      // 페이지 크기 변경
      } else if (cmd === 'pager-size') {
        pager.size = param;
        pager.page = 1;
        return fnBuildPagerNums();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ RowPickModal : handleSelectAction -> ', cmd, param);
      // 트리 펼침 토글
      if (cmd === 'tree-toggle') {
        return toggleTree(param);
      // 트리 노드 선택
      } else if (cmd === 'tree-select') {
        return selectTree(param);
      // 행 체크 토글
      } else if (cmd === 'list-toggle') {
        return toggleCheck(param);
      // 행 복사
      } else if (cmd === 'list-pick') {
        return pickOne(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    return {
      searchType, searchValue, searchStatus, activeStatuses, pager, PAGE_SIZES,  // 데이터
      selectedTreeKey, isTreeOpen, cfTree,                                       // 트리
      statusCls, areaNm, wLabel,                                                 // 헬퍼
      checked, isChecked, cfAllChecked,                                          // 선택
      handleBtnAction, handleSelectAction,                                       // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" width="1100px" max-width="98vw" max-height="92vh"
  box-pad="0" body-pad="0" :z-index="9999" @close="handleBtnAction('modal-close')">
  <div style="background:#fafafa;border-radius:14px;display:flex;flex-direction:column;height:100%;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#1565c0,#42a5f5);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:14px;font-weight:700;">
        🔗 {{ title }}
      </span>
      <button @click="handleBtnAction('modal-close')" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1;padding:0;opacity:.85;">
        ×
      </button>
    </div>
    <div style="padding:12px 16px;background:#fff;border-bottom:1px solid #eee;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <bo-multi-check-select
        v-model="searchType"
        :options="[
        { value: 'widgetNm', label: '위젯명' },
        { value: 'panelNm',  label: '패널명' },
        { value: 'widgetType',     label: '유형' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="searchValue" placeholder="검색어 입력" style="flex:1;min-width:200px;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;" />
      <select v-model="searchStatus" style="padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;">
        <option value="">
          패널상태 전체
        </option>
        <option v-for="c in activeStatuses" :key="c.codeValue" :value="c.codeValue">
          {{ c.codeLabel }}
        </option>
      </select>
    </div>
    <div style="flex:1;overflow:hidden;display:flex;gap:12px;padding:12px;background:#f4f5f8;">
      <div style="width:220px;flex-shrink:0;background:#fff;border-radius:8px;padding:12px;overflow-y:auto;">
        <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:8px;">
          사용위치 트리
        </div>
        <div @click="handleSelectAction('tree-toggle', '__root__'); handleSelectAction('tree-select', '')"
          :style="{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'4px',background: selectedTreeKey==='' ? '#e3f2fd' : '#f8f9fb',color: selectedTreeKey==='' ? '#1565c0' : '#222',fontWeight:700,border:'1px solid '+(selectedTreeKey==='' ? '#90caf9' : '#e4e7ec') }">
          <span>
            {{ isTreeOpen('__root__') ? '▼' : '▶' }} 📂 전체
          </span>
          <span style="font-size:10px;background:#fff;color:#555;border:1px solid #ddd;border-radius:10px;padding:1px 7px;">
            {{ pager.pageTotalCount }}
          </span>
        </div>
        <div v-if="isTreeOpen('__root__')" style="padding-left:12px;">
          <div v-for="node in cfTree" :key="node.label"
            @click="handleSelectAction('tree-select', node.label)"
            :style="{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'2px',background: selectedTreeKey===node.label ? '#e3f2fd' : 'transparent',color: selectedTreeKey===node.label ? '#1565c0' : '#333',fontWeight: selectedTreeKey===node.label ? 700 : 500 }">
            <span>
              ▸ {{ node.label }}
            </span>
            <span style="font-size:10px;background:#f0f2f5;color:#666;border-radius:10px;padding:1px 7px;">
              {{ node.count }}
            </span>
          </div>
        </div>
      </div>
      <div style="flex:1;background:#fff;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;">
        <div style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#555;display:flex;justify-content:space-between;align-items:center;">
          <span>
            총
            <b>
              {{ pager.pageTotalCount }}
            </b>
            건
            <span v-if="checked.size" style="color:#1565c0;margin-left:8px;">
              선택 {{ checked.size }}개
            </span>
          </span>
          <button v-if="checked.size" @click="handleBtnAction('modal-pick-multi')" class="btn btn-primary btn-sm" style="font-size:11px;">
            선택한 {{ checked.size }}개 일괄 복사
          </button>
        </div>
        <div style="flex:1;overflow-y:auto;">
          <table class="bo-table" style="margin:0;">
            <thead>
              <tr>
                <th style="width:36px;text-align:center;">
                  <input type="checkbox" :checked="cfAllChecked" @change="handleBtnAction('list-toggle-all')" />
                </th>
                <th style="width:110px;">
                  위젯 유형
                </th>
                <th>
                  전시항목 정보
                </th>
                <th style="width:160px;text-align:left;">
                  사용위치경로
                </th>
                <th style="width:90px;text-align:right;">
                  선택
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!(pager.pageList||[]).length">
                <td colspan="5" style="text-align:center;padding:30px;color:#bbb;font-size:12px;">
                  표시할 전시항목이 없습니다.
                </td>
              </tr>
              <tr v-for="o in pager.pageList" :key="o.__rowId"
                :style="isChecked(o.__rowId)?'background:#eef6fd;':''">
                <td style="text-align:center;vertical-align:top;padding-top:14px;">
                  <input type="checkbox" :checked="isChecked(o.__rowId)" @change="handleSelectAction('list-toggle', o.__rowId)" />
                </td>
                <td style="vertical-align:top;padding-top:12px;">
                  <span style="background:#f5f5f5;border:1px solid #e8e8e8;border-radius:6px;padding:1px 7px;font-size:11px;color:#555;">
                    {{ wLabel(o.row.widgetType) }}
                  </span>
                </td>
                <td style="padding:10px 12px;">
                  <div style="margin-bottom:4px;">
                    <span style="font-size:14px;font-weight:700;color:#222;">
                      {{ o.row.widgetNm || ('위젯 '+(o.sortIdx+1)) }}
                    </span>
                    <span class="badge" :class="statusCls(o.__status)" style="font-size:11px;margin-left:8px;">
                      {{ o.__status }}
                    </span>
                  </div>
                  <div style="font-size:11px;color:#555;line-height:1.5;">
                    <span>
                      <b style="color:#888;">
                        소속 패널:
                      </b>
                      {{ o.__panelName }} (#{{ o.__panelId }})
                    </span>
                    <span v-if="o.row.clickAction ? (o.row.clickAction !== 'none') : false" style="margin-left:10px;">
                    <b style="color:#888;">
                      클릭:
                    </b>
                    {{ o.row.clickAction }}
                  </span>
                </div>
              </td>
              <td style="vertical-align:top;padding-top:12px;">
                <span style="background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:8px;padding:1px 7px;font-size:11px;">
                  {{ (o.__area||'').split('_')[0] || '-' }} &gt; {{ areaNm(o.__area) }}
                </span>
              </td>
              <td style="vertical-align:top;padding-top:10px;text-align:right;">
                <button @click="handleSelectAction('list-pick', o)" class="btn btn-primary btn-sm" style="font-size:11px;">
                  복사
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination" style="padding:10px 16px;border-top:1px solid #f0f0f0;margin-top:0;">
        <div>
        </div>
        <div class="pager">
          <button :disabled="pager.page===1" @click="handleBtnAction('pager-set', 1)">
            «
          </button>
          <button :disabled="pager.page===1" @click="handleBtnAction('pager-set', pager.page-1)">
            ‹
          </button>
          <button v-for="n in pager.pageNums" :key="n" :class="{active:pager.page===n}" @click="handleBtnAction('pager-set', n)">
            {{ n }}
          </button>
          <button :disabled="pager.page===pager.pageTotalPage" @click="handleBtnAction('pager-set', pager.page+1)">
            ›
          </button>
          <button :disabled="pager.page===pager.pageTotalPage" @click="handleBtnAction('pager-set', pager.pageTotalPage)">
            »
          </button>
        </div>
        <div class="pager-right">
          <select class="size-select" :value="pager.size" @change="handleBtnAction('pager-size', Number($event.target.value))">
            <option v-for="s in PAGE_SIZES" :key="s" :value="s">
              {{ s }}개
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</div>
</bo-modal>
`,
};

/* ═══════════════════════════════════════════════════════════════════
 * WidgetLibPickModal — 전시위젯Lib 선택 팝업 (내용복사 / 참조)
 * ═══════════════════════════════════════════════════════════════════ */
window.WidgetLibPickModal = {
  name: 'WidgetLibPickModal',
  inheritAttrs: false,
  props: {
    mode: { type: String, default: 'copy', reloadTrigger: { type: Number, default: 0 } },     /* 'copy' | 'ref' */
    widgetLibs: { type: Array, default: () => [] },
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['close', 'pick'],
  setup(props, { emit }) {
    const { ref, reactive, computed } = Vue;
    const searchParam = reactive({ searchType: '', searchValue: '', type: '', status: '' });
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [2, 3, 4, 5, 10, 20, 50, 100];

    const cfFiltered = computed(() => (props.widgetLibs || []).filter(d => {
      const searchVal = searchParam.searchValue.trim().toLowerCase();
      if (searchVal) {
        const types = searchParam.searchType || 'nm,desc,tag';
        const hits = [];
        if (types.includes('nm'))   hits.push((d.name || '').toLowerCase().includes(searchVal));
        if (types.includes('desc')) hits.push((d.desc || '').toLowerCase().includes(searchVal));
        if (types.includes('tag'))  hits.push((d.tags || '').toLowerCase().includes(searchVal));
        if (!hits.some(Boolean)) return false;
      }
      if (searchParam.type && d.widgetType !== searchParam.type) return false;
      if (searchParam.status && d.status !== searchParam.status) return false;
      return true;
    }).sort((a,b) => b.libId - a.libId));

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => {
      const total = cfFiltered.value.length;
      pager.pageTotalCount = total;
      pager.pageTotalPage = Math.max(1, Math.ceil(total / pager.size));
      pager.pageList = cfFiltered.value.slice((pager.page-1)*pager.size, pager.page*pager.size);
      const cur=pager.page, last=pager.pageTotalPage, s=Math.max(1,cur-2), e=Math.min(last,s+4);
      pager.pageNums = Array.from({length:e-s+1},(_,i)=>s+i);
    };
    Vue.watch(cfFiltered, () => { pager.page = 1; fnBuildPagerNums(); }, { immediate: true });

    /* 사용위치 트리 */
    const selectedTreeKey = ref('');
    const treeOpen = reactive(new Set(['__root__']));

    /* toggleTree */
    const toggleTree = k => { if (treeOpen.has(k)) treeOpen.delete(k); else treeOpen.add(k); };

    /* isTreeOpen */
    const isTreeOpen = k => treeOpen.has(k);

    /* selectTree */
    const selectTree = k => { selectedTreeKey.value = selectedTreeKey.value === k ? '' : k; pager.page = 1; };
    const cfTree = computed(() => {
      const map = {};

      /* add */
      const add = (lib, p) => {
        const parts = p.split('>').map(x => x.trim()).filter(Boolean);
        if (!parts.length) return;
        const top = parts[0], rest = parts.slice(1).join(' > ') || '(루트)';
        if (!map[top]) map[top] = {};
        if (!map[top][rest]) map[top][rest] = [];
        map[top][rest].push(lib);
      };
      cfFiltered.value.forEach(lib => {
        if (!lib.usedPaths || !lib.usedPaths.length) add(lib, '(미등록) > (미등록)');
        else lib.usedPaths.forEach(p => add(lib, p));
      });
      return Object.keys(map).sort().map(top => ({
        label: top,
        count: Object.values(map[top]).reduce((a,b) => a+b.length, 0),
        children: Object.keys(map[top]).sort().map(sub => ({ label: sub, count: map[top][sub].length })),
      }));
    });

    const WIDGET_TYPES = [
      { value:'', label:'전체 유형' },
      { value:'image_banner', label:'이미지 배너' }, { value:'product_slider', label:'상품 슬라이더' },
      { value:'product', label:'상품' }, { value:'text_banner', label:'텍스트 배너' },
      { value:'info_card', label:'정보카드' }, { value:'popup', label:'팝업' },
      { value:'file', label:'파일' }, { value:'coupon', label:'쿠폰' },
      { value:'html_editor', label:'HTML 에디터' }, { value:'widget_embed', label:'위젯' },
    ];

    /* statusCls */
    const statusCls = (s) => s === '활성' ? 'badge-green' : 'badge-gray';

    /* onPick */
    const onPick = (lib) => {
      emit('pick', lib);
      if (props.onCallback) props.onCallback(props.modalName, null, lib);
    };
    const activeStatuses = reactive([]);
    Vue.onMounted(() => {
      /* 상태 = 어댑터 '활성'/'비활성' 값 (구 ACTIVE_STATUS 코드그룹 미사용) */
      activeStatuses.splice(0, activeStatuses.length,
        { codeValue: '활성', codeLabel: '활성' }, { codeValue: '비활성', codeLabel: '비활성' });
    });

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ WidgetLibPickModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'pager-set') {
        pager.page = param;
        return;
      } else if (cmd === 'pager-size') {
        pager.size = param;
        pager.page = 1;
        return fnBuildPagerNums();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ WidgetLibPickModal : handleSelectAction -> ', cmd, param);
      if (cmd === 'tree-toggle') {
        return toggleTree(param);
      } else if (cmd === 'tree-select') {
        return selectTree(param);
      } else if (cmd === 'tree-toggle-select') {
        toggleTree(param);
        return selectTree(param);
      } else if (cmd === 'list-pick') {
        return onPick(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    return {
      searchParam, WIDGET_TYPES, activeStatuses,                              // 데이터
      pager, PAGE_SIZES,                                                      // 페이저
      cfTree, selectedTreeKey, isTreeOpen, statusCls,                         // 헬퍼
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" width="1100px" max-width="98vw" max-height="92vh"
  box-pad="0" body-pad="0" :z-index="9999" @close="handleBtnAction('modal-close')">
  <div style="background:#fafafa;border-radius:14px;display:flex;flex-direction:column;height:100%;overflow:hidden;">
    <!-- 헤더 -->
    <div style="background:linear-gradient(135deg,#1565c0,#42a5f5);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:14px;font-weight:700;">
        {{ mode==='copy' ? '📋 전시위젯Lib 내용복사' : '🔗 전시위젯Lib 참조' }}
      </span>
      <button @click="handleBtnAction('modal-close')" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1;padding:0;opacity:.85;">
        ×
      </button>
    </div>
    <!-- 검색 -->
    <div style="padding:12px 16px;background:#fff;border-bottom:1px solid #eee;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <bo-multi-check-select
        v-model="searchParam.searchType"
        :options="[
        { value: 'nm',   label: '이름' },
        { value: 'desc', label: '설명' },
        { value: 'tag',  label: '태그' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="searchParam.searchValue" placeholder="검색어 입력" style="flex:1;min-width:200px;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;" />
      <select v-model="searchParam.type" style="padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;">
        <option v-for="t in WIDGET_TYPES" :key="t.value" :value="t.value">
          {{ t.label }}
        </option>
      </select>
      <select v-model="searchParam.status" style="padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;">
        <option value="">
          상태 전체
        </option>
        <option v-for="c in activeStatuses" :key="c.codeValue" :value="c.codeValue">
          {{ c.codeLabel }}
        </option>
      </select>
    </div>
    <!-- 본문: 좌측 트리 + 우측 목록 -->
    <div style="flex:1;overflow:hidden;display:flex;gap:12px;padding:12px;background:#f4f5f8;">
      <!-- 트리 -->
      <div style="width:220px;flex-shrink:0;background:#fff;border-radius:8px;padding:12px;overflow-y:auto;">
        <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:8px;">
          사용위치 트리
        </div>
        <div @click="handleSelectAction('tree-toggle', '__root__'); handleSelectAction('tree-select', '')"
          :style="{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'4px',background: selectedTreeKey==='' ? '#e3f2fd' : '#f8f9fb',color: selectedTreeKey==='' ? '#1565c0' : '#222',fontWeight:700,border:'1px solid '+(selectedTreeKey==='' ? '#90caf9' : '#e4e7ec') }">
          <span>
            {{ isTreeOpen('__root__') ? '▼' : '▶' }} 📂 전체
          </span>
          <span style="font-size:10px;background:#fff;color:#555;border:1px solid #ddd;border-radius:10px;padding:1px 7px;">
            {{ pager.pageTotalCount }}
          </span>
        </div>
        <div v-if="isTreeOpen('__root__')" style="padding-left:12px;">
          <div v-for="node in cfTree" :key="node.label">
            <div @click="handleSelectAction('tree-toggle-select', node.label)"
              :style="{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'2px',background: selectedTreeKey===node.label ? '#e3f2fd' : 'transparent',color: selectedTreeKey===node.label ? '#1565c0' : '#333',fontWeight: selectedTreeKey===node.label ? 700 : 500 }">
              <span>
                {{ isTreeOpen(node.label) ? '▼' : '▶' }} {{ node.label }}
              </span>
              <span style="font-size:10px;background:#f0f2f5;color:#666;border-radius:10px;padding:1px 7px;">
                {{ node.count }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <!-- 목록 -->
      <div style="flex:1;background:#fff;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;">
        <div style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#555;">
          총
          <b>
            {{ pager.pageTotalCount }}
          </b>
          건
        </div>
        <div style="flex:1;overflow-y:auto;">
          <table class="bo-table" style="margin:0;">
            <thead>
              <tr>
                <th style="width:56px;">
                  ID
                </th>
                <th>
                  위젯 정보
                </th>
                <th style="width:90px;text-align:right;">
                  선택
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!(pager.pageList||[]).length">
                <td colspan="3" style="text-align:center;padding:30px;color:#bbb;font-size:12px;">
                  표시할 데이터가 없습니다.
                </td>
              </tr>
              <tr v-for="d in pager.pageList" :key="d.libId">
                <td style="color:#aaa;font-size:12px;vertical-align:top;padding-top:12px;">
                  #{{ String(d.libId).padStart(4,'0') }}
                </td>
                <td style="padding:10px 12px;">
                  <div style="margin-bottom:4px;">
                    <span style="background:#f5f5f5;border:1px solid #e8e8e8;border-radius:6px;padding:1px 7px;font-size:11px;color:#555;">
                      {{ d.widgetType }}
                    </span>
                    <span style="font-size:14px;font-weight:700;color:#222;margin-left:8px;">
                      {{ d.name }}
                    </span>
                    <span class="badge" :class="statusCls(d.status)" style="font-size:11px;margin-left:8px;">
                      {{ d.status }}
                    </span>
                  </div>
                  <div style="font-size:11px;color:#555;line-height:1.5;">
                    <span v-if="d.usedPaths ? (d.usedPaths.length) : false">
                    <b style="color:#888;">
                      사용위치:
                    </b>
                    <span v-for="(p,pi) in d.usedPaths" :key="pi"
                        style="background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:8px;padding:1px 7px;margin-left:3px;">
                      {{ p }}
                    </span>
                  </span>
                  <span v-if="d.tags" style="margin-left:8px;">
                    <b style="color:#888;">
                      태그:
                    </b>
                    {{ d.tags }}
                  </span>
                </div>
              </td>
              <td style="vertical-align:top;padding-top:10px;text-align:right;">
                <button @click="handleSelectAction('list-pick', d)" class="btn btn-primary btn-sm" style="font-size:11px;">
                  {{ mode==='copy' ? '복사' : '참조' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- 페이저 -->
      <div class="pagination" style="padding:10px 16px;border-top:1px solid #f0f0f0;margin-top:0;">
        <div>
        </div>
        <div class="pager">
          <button :disabled="pager.page===1" @click="handleBtnAction('pager-set', 1)">
            «
          </button>
          <button :disabled="pager.page===1" @click="handleBtnAction('pager-set', pager.page-1)">
            ‹
          </button>
          <button v-for="n in pager.pageNums" :key="n" :class="{active:pager.page===n}" @click="handleBtnAction('pager-set', n)">
            {{ n }}
          </button>
          <button :disabled="pager.page===pager.pageTotalPage" @click="handleBtnAction('pager-set', pager.page+1)">
            ›
          </button>
          <button :disabled="pager.page===pager.pageTotalPage" @click="handleBtnAction('pager-set', pager.pageTotalPage)">
            »
          </button>
        </div>
        <div class="pager-right">
          <select class="size-select" :value="pager.size" @change="handleBtnAction('pager-size', Number($event.target.value))">
            <option v-for="s in PAGE_SIZES" :key="s" :value="s">
              {{ s }}개
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</div>
</bo-modal>
`,
};

/* ─────────────────────────────────────────────────────────────
   PathPickModal — sy_path 표시경로 선택 (트리 + 추가)
   props: bizCd (필수), value (현재 path_id), title
   emits: select(pathId), close
───────────────────────────────────────────────────────────── */
window.PathPickModal = {
  name: 'PathPickModal',
  inheritAttrs: false,
  props: {
    bizCd:         { type: String,    default: '' },                      // 비즈 코드 (분류)
    value:         { type: String,    default: '' },                      // 값
    title:         { type: String,    default: '' },                      // 제목
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed } = Vue;
    const cfTree = computed(() => boUtil.bofBuildPathTree(props.bizCd));
    const expanded = reactive(new Set([null]));

    /* toggle */
    const toggle = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };

    /* expandAll */
    const expandAll = () => { expanded.clear(); expanded.add(null); const walk = (n) => { expanded.add(n.pathId); (n.children||[]).forEach(walk); }; walk(cfTree.value); };

    /* collapseAll */
    const collapseAll = () => { expanded.clear(); expanded.add(null); };

    /* 3레벨 자동 펼침 (모달 오픈 시) */
    const expandLevels = (maxDepth) => {
      expanded.clear(); expanded.add(null);

      /* walk */
      const walk = (n, d) => {
        if (d >= maxDepth) return;
        (n.children || []).forEach(ch => { expanded.add(ch.pathId); walk(ch, d + 1); });
      };
      walk(cfTree.value, 0);
    };
    /* 모달 마운트 시 최신 경로 목록 API 재조회 → window._boCmPaths 갱신 */
    Vue.onMounted(async () => {
      try {
        const res = await boApiSvc.syPath.getPage({ pageNo: 1, pageSize: 10000 }, '표시경로', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        if (list.length > 0) window._boCmPaths = list;
      } catch (e) {
        console.error('[PathPickModal] 경로 조회 실패', e);
      }
      expandLevels(2);
    });

    const selectedId = ref(props.value || null);

    /* select */
    const select = (id) => { selectedId.value = id; };

    /* confirm */
    const confirm = () => {
      emit('select', selectedId.value);
      if (props.onCallback) props.onCallback(props.modalName, null, selectedId.value);
      emit('close');
      if (props.onCallback) props.onCallback(props.modalName, null, null);
    };
    const addParent = ref(null);
    const addLabel = ref('');

    /* setAddParent */
    const setAddParent = (id) => { addParent.value = id; };

    /* doAdd */
    const doAdd = () => {
      const txt = addLabel.value.trim();
      if (!txt) {
        if (window.boToast) window.boToast('새 경로명을 입력해주세요.', 'warning');
        else alert('새 경로명을 입력해주세요.');
        return;
      }
      window._boCmPaths = window._boCmPaths || [];
      const list = window._boCmPaths;
      /* 동일 부모 + 동일 라벨 중복 체크 */
      const dup = list.find(p => p.bizCd === props.bizCd && p.parentPathId === addParent.value && p.pathLabel === txt);
      if (dup) {
        if (window.boToast) window.boToast(`'${txt}' 경로가 이미 존재합니다.`, 'error');
        else alert('이미 존재하는 경로입니다: ' + txt);
        return;
      }

      /* newId */
      const newId = (list.reduce((m,x) => Math.max(m, x.pathId), 0) || 0) + 1;
      list.push({ pathId: newId, bizCd: props.bizCd, parentPathId: addParent.value,
        pathLabel: txt, sortOrd: 99, useYn: 'Y', remark: '', _userAdded: true });
      addLabel.value = '';
      expanded.add(addParent.value);
      selectedId.value = newId;
      if (window.boToast) window.boToast(`'${txt}' 경로가 추가되었습니다.`, 'success');
    };

    /* 인라인 수정 */
    const editingId = ref(null);
    const editLabel = ref('');

    /* startEdit */
    const startEdit = (node) => { editingId.value = node.pathId; editLabel.value = node.pathLabel; };

    /* saveEdit */
    const saveEdit = () => {
      const id = editingId.value;
      if (id != null && editLabel.value.trim()) {
        const item = (window._boCmPaths || []).find(p => p.pathId === id);
        if (item) item.pathLabel = editLabel.value.trim();
      }
      editingId.value = null;
    };

    /* cancelEdit */
    const cancelEdit = () => { editingId.value = null; };

    /* 삭제 (자식 없는 경우만) — boConfirm 디자인 다이얼로그 사용 */
    const deleteNode = async (node) => {
      if ((node.children || []).length > 0) {
        if (window.boConfirm) await window.boConfirm('삭제 불가', '하위 경로가 있어 삭제할 수 없습니다.', { btnCancel: '' });
        else alert('하위 경로가 있어 삭제할 수 없습니다.');
        return;
      }
      const ok = window.boConfirm
        ? await window.boConfirm('표시경로 삭제', '이 경로를 삭제하시겠습니까?', { details: node.pathLabel })
        : window.confirm('이 경로를 삭제하시겠습니까?\n\n' + node.pathLabel);
      if (!ok) return;
      const idx = (window._boCmPaths || []).findIndex(p => p.pathId === node.pathId);
      if (idx >= 0) window._boCmPaths.splice(idx, 1);
      if (selectedId.value === node.pathId) selectedId.value = null;
      if (addParent.value === node.pathId) addParent.value = null;
    };

    /* labelOf */
    const labelOf = (id) => boUtil.bofGetPathLabel(id);

    /* hover 효과 헬퍼 — 인라인 표현식 SyntaxError 회피 */
    const onRootHover = (evt) => {
      if (selectedId.value !== null && addParent.value !== null && evt && evt.currentTarget) {
        evt.currentTarget.style.background = '#f9fafb';
      }
    };

    /* onRootLeave */
    const onRootLeave = (evt) => {
      if (selectedId.value !== null && addParent.value !== null && evt && evt.currentTarget) {
        evt.currentTarget.style.background = 'transparent';
      }
    };

    /* onCloseHover */
    const onCloseHover = (evt) => {
      if (!evt || !evt.currentTarget) return;
      evt.currentTarget.style.background = '#f3f4f6';
      evt.currentTarget.style.color = '#374151';
    };

    /* onCloseLeave */
    const onCloseLeave = (evt) => {
      if (!evt || !evt.currentTarget) return;
      evt.currentTarget.style.background = 'transparent';
      evt.currentTarget.style.color = '#9ca3af';
    };

    /* onAddHover */
    const onAddHover = (evt) => { if (evt && evt.currentTarget) evt.currentTarget.style.background = '#059669'; };

    /* onAddLeave */
    const onAddLeave = (evt) => { if (evt && evt.currentTarget) evt.currentTarget.style.background = '#10b981'; };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PathPickModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      // 확인 (선택 적용)
      } else if (cmd === 'modal-confirm') {
        return confirm();
      // 전체 펼치기
      } else if (cmd === 'pathTree-expand-all') {
        return expandAll();
      // 전체 접기
      } else if (cmd === 'pathTree-collapse-all') {
        return collapseAll();
      // 경로 추가
      } else if (cmd === 'pathTree-add') {
        return doAdd();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PathPickModal : handleSelectAction -> ', cmd, param);
      // 경로 선택 + 부모설정 (루트)
      if (cmd === 'pathTree-select-root') {
        select(null);
        return setAddParent(null);
      // 더블클릭으로 확정 (루트)
      } else if (cmd === 'pathTree-confirm-root') {
        select(null);
        return confirm();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    return {
      cfTree, expanded, selectedId,                                            // 데이터
      addParent, addLabel, labelOf,                                            // 추가
      editingId, editLabel,                                                    // 편집
      toggle, select, setAddParent, confirm,                                   // 트리 헬퍼 (자식 컴포넌트 props로 전달)
      startEdit, saveEdit, cancelEdit, deleteNode,                             // 편집 헬퍼
      onRootHover, onRootLeave, onCloseHover, onCloseLeave, onAddHover, onAddLeave,  // hover 헬퍼
      handleBtnAction, handleSelectAction,                                     // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" max-width="640px" box-pad="0" body-pad="0" @close="handleBtnAction('modal-close')">
  <div style="overflow:hidden;border-radius:14px;display:flex;flex-direction:column;height:100%;">
    <!-- 헤더 -->
    <div style="background:#ffffff;border-bottom:1px solid #eef0f3;padding:18px 22px 14px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:#eef2ff;color:#6366f1;font-size:16px;">
          📂
        </span>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;color:#1f2937;letter-spacing:-0.2px;">
            {{ title || '표시경로 선택' }}
          </div>
          <div style="font-size:10.5px;color:#9ca3af;font-family:monospace;margin-top:1px;">
            biz_cd · {{ bizCd }}
          </div>
        </div>
        <span class="modal-close" style="color:#9ca3af;cursor:pointer;font-size:20px;line-height:1;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:all .15s;"
          @click="handleBtnAction('modal-close')"
          @mouseover="onCloseHover($event)"
          @mouseout="onCloseLeave($event)">
          ✕
        </span>
      </div>
      <!-- 선택 경로 미리보기 -->
      <div style="margin-top:12px;padding:10px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:10.5px;color:#6b7280;font-weight:600;">
          현재 선택
        </span>
        <span style="flex:1;font-size:13px;font-weight:600;color:selectedId==null?'#9ca3af':'#1f2937';">
          <span v-if="selectedId == null" style="color:#9ca3af;font-weight:400;">
            — 선택된 경로가 없습니다 —
          </span>
          <span v-else style="color:#e8587a;">
            {{ labelOf(selectedId) || ('#'+selectedId) }}
          </span>
        </span>
      </div>
    </div>
    <!-- 본문 -->
    <div style="padding:14px 22px 18px;background:#fafbfc;">
      <!-- 트리 도구 -->
      <div style="display:flex;gap:6px;margin-bottom:8px;align-items:center;">
        <span style="font-size:11.5px;font-weight:700;color:#374151;">
          경로 트리
        </span>
        <span style="font-size:10px;color:#9ca3af;background:#fff;border:1px solid #e5e7eb;padding:2px 8px;border-radius:10px;">
          클릭: 선택 · 더블클릭: 즉시 적용
        </span>
        <span style="flex:1;">
        </span>
        <button @click="handleBtnAction('pathTree-expand-all')" style="font-size:10.5px;padding:4px 9px;border:1px solid #e5e7eb;background:#fff;border-radius:5px;cursor:pointer;color:#6b7280;">
          ▼ 펼치기
        </button>
        <button @click="handleBtnAction('pathTree-collapse-all')" style="font-size:10.5px;padding:4px 9px;border:1px solid #e5e7eb;background:#fff;border-radius:5px;cursor:pointer;color:#6b7280;">
          ▶ 접기
        </button>
      </div>
      <div style="height:340px;overflow:auto;border:1px solid #e5e7eb;border-radius:10px;background:#fff;padding:8px;margin-bottom:14px;">
        <div @click="handleSelectAction('pathTree-select-root')"
          @dblclick="handleSelectAction('pathTree-confirm-root')"
          :style="{padding:'8px 12px',cursor:'pointer',borderRadius:'8px',transition:'all .12s',marginBottom:'2px',
          background: selectedId===null ? '#fef2f4' : (addParent===null ? '#ecfdf5' : 'transparent'),
          color:      selectedId===null ? '#e8587a' : '#374151',
          fontWeight: selectedId===null ? 700 : 500, fontSize:'13px',
          border:     selectedId===null ? '1px solid #fecdd3' : (addParent===null ? '1px solid #a7f3d0' : '1px solid transparent')}"
          @mouseover="onRootHover($event)"
          @mouseout="onRootLeave($event)">
          <span style="margin-right:8px;">
            📁
          </span>
          (루트)
          <span style="font-size:10px;color:#6b7280;background:#fff;padding:1px 8px;border-radius:10px;border:1px solid #e5e7eb;margin-left:8px;font-weight:500;">
            {{ cfTree.count }}
          </span>
        </div>
        <path-pick-tree-node :node="cfTree" :expanded="expanded" :selected="selectedId" :add-parent="addParent"
          :editing-id="editingId" :edit-label="editLabel"
          :on-toggle="toggle" :on-select="select" :on-set-parent="setAddParent" :on-confirm="confirm"
          :on-start-edit="startEdit" :on-save-edit="saveEdit" :on-cancel-edit="cancelEdit"
          :on-update-label="(v) => editLabel = v" :on-delete="deleteNode" :depth="0" />
      </div>
      <!-- 추가 입력 -->
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;margin-bottom:16px;">
        <div style="display:flex;gap:8px;align-items:center;font-size:11px;color:#6b7280;margin-bottom:8px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#10b981;color:#fff;font-size:11px;font-weight:700;">
            +
          </span>
          <span style="font-weight:600;">
            하위 추가 위치:
          </span>
          <span style="background:#ecfdf5;color:#059669;padding:2px 10px;border-radius:6px;font-weight:700;font-size:11px;">
            {{ addParent == null ? '(루트)' : (labelOf(addParent) || ('#'+addParent)) }}
          </span>
        </div>
        <div style="display:flex;gap:6px;">
          <input class="form-control" v-model="addLabel" placeholder="새 경로명 입력 후 Enter" style="flex:1;height:34px;font-size:12.5px;" @keyup.enter="handleBtnAction('pathTree-add')" />
          <button @click="handleBtnAction('pathTree-add')"
            style="padding:0 16px;font-size:12px;font-weight:700;background:#10b981;color:#fff;border:none;border-radius:6px;cursor:pointer;white-space:nowrap;"
            @mouseover="onAddHover($event)"
            @mouseout="onAddLeave($event)">
            + 추가
          </button>
        </div>
      </div>
      <!-- 액션 -->
      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <button @click="handleBtnAction('modal-close')"
          style="padding:9px 20px;font-size:12.5px;font-weight:600;background:#fff;color:#6b7280;border:1px solid #d1d5db;border-radius:7px;cursor:pointer;">
          취소
        </button>
        <button @click="handleBtnAction('modal-confirm')"
          style="padding:9px 22px;font-size:12.5px;font-weight:700;background:linear-gradient(135deg,#e8587a,#d14165);color:#fff;border:none;border-radius:7px;cursor:pointer;box-shadow:0 2px 6px rgba(232,88,122,.25);">
          ✓ 선택
        </button>
      </div>
    </div>
  </div>
</bo-modal>
`,
};

window.PathPickTreeNode = {
  name: 'PathPickTreeNode',
  inheritAttrs: false,
  props: {
    node:          { type: Object,    default: () => ({}) },              // 트리 노드
    expanded:      { type: Object,    default: () => null },              // 펼침 상태 (Set)
    selected:      { type: String,    default: null },                    // 선택된 ID
    addParent:     { type: Function,  default: () => {} },                // 상위 추가 콜백
    editingId:     { type: String,    default: null },                    // 편집 중 ID
    editLabel:     { type: String,    default: '' },                      // 편집 라벨
    onToggle:      { type: Function,  default: () => {} },                // (자동 추론)
    onSelect:      { type: Function,  default: () => {} },                // (자동 추론)
    onSetParent:   { type: Function,  default: () => {} },                // (자동 추론)
    onConfirm:     { type: Function,  default: () => {} },                // (자동 추론)
    onStartEdit:   { type: Function,  default: () => {} },                // (자동 추론)
    onSaveEdit:    { type: Function,  default: () => {} },                // (자동 추론)
    onCancelEdit:  { type: Function,  default: () => {} },                // (자동 추론)
    onUpdateLabel: { type: Function,  default: () => {} },                // (자동 추론)
    onDelete:      { type: Function,  default: () => {} },                // (자동 추론)
    depth:         { type: String,    default: '' },                      // (자동 추론)
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  methods: {
    /* handleBtnAction — 버튼 액션 dispatch (재귀 노드 컴포넌트) */
    handleBtnAction(cmd, param = {}) {
      console.log(' ■■ PathPickTreeNode : handleBtnAction -> ', cmd, param);
      // 토글
      if (cmd === 'pathTree-toggle') {
        return this.onToggle && this.onToggle(param);
      // 인라인 수정 시작
      } else if (cmd === 'pathTree-edit-start') {
        return this.onStartEdit && this.onStartEdit(param);
      // 인라인 수정 저장
      } else if (cmd === 'pathTree-edit-save') {
        return this.onSaveEdit && this.onSaveEdit();
      // 인라인 수정 취소
      } else if (cmd === 'pathTree-edit-cancel') {
        return this.onCancelEdit && this.onCancelEdit();
      // 라벨 업데이트
      } else if (cmd === 'pathTree-update-label') {
        return this.onUpdateLabel && this.onUpdateLabel(param);
      // 노드 삭제
      } else if (cmd === 'pathTree-delete') {
        return this.onDelete && this.onDelete(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    },
    /* handleSelectAction — 행/선택 액션 dispatch */
    handleSelectAction(cmd, param = {}) {
      console.log(' ■■ PathPickTreeNode : handleSelectAction -> ', cmd, param);
      // 노드 클릭 (선택 + 부모설정)
      if (cmd === 'pathTree-click') {
        return this.onPathNodeClick(param);
      // 노드 더블클릭 (확정)
      } else if (cmd === 'pathTree-dblclick') {
        return this.onPathNodeDblClick(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    },
    onPathNodeClick(ch) {
      if (this.editingId === ch.pathId) return;
      this.onSelect && this.onSelect(ch.pathId);
      this.onSetParent && this.onSetParent(ch.pathId);
    },
    onPathNodeDblClick(ch) {
      if (this.editingId === ch.pathId) return;
      this.onSelect && this.onSelect(ch.pathId);
      if (this.onConfirm) this.onConfirm();
    },
    onPathNodeHover(ch, evt) {
      if (this.selected !== ch.pathId && evt && evt.currentTarget) {
        evt.currentTarget.style.background = '#f3f4f6';
      }
    },
    onPathNodeLeave(ch, evt) {
      if (this.selected !== ch.pathId && evt && evt.currentTarget) {
        evt.currentTarget.style.background = (this.addParent === ch.pathId ? '#ecfdf5' : 'transparent');
      }
    },
  },
  template: /* html */`
<div v-if="(node.children||[]).length > 0" style="position:relative;">
  <div v-for="(ch, ci) in node.children" :key="ch.pathId" style="position:relative;">
    <!-- 노드 행 -->
    <div @click="handleSelectAction('pathTree-click', ch)" @dblclick="handleSelectAction('pathTree-dblclick', ch)"
      :style="{position:'relative',display:'flex',alignItems:'center',padding:'4px 8px 4px 0',cursor: editingId===ch.pathId ? 'default' : 'pointer',transition:'background .12s',
      paddingLeft: (depth*20 + 8) + 'px',
      background: selected===ch.pathId ? '#eff6ff' : (addParent===ch.pathId ? '#ecfdf5' : 'transparent'),
      color:      selected===ch.pathId ? '#1d4ed8' : '#374151',
      fontWeight: selected===ch.pathId ? 700 : 500, fontSize:'13px',
      outline:       selected===ch.pathId ? '2px solid #2563eb' : 'none',
      outlineOffset: selected===ch.pathId ? '-2px' : '0',
      zIndex: selected===ch.pathId ? 1 : 'auto'}"
      @mouseover="onPathNodeHover(ch, $event)"
      @mouseout="onPathNodeLeave(ch, $event)">
      <span :style="{position:'absolute',left:(depth*20 + 11)+'px',top:'50%',width:'10px',height:'1px',borderTop:'1px dotted #cbd5e1',pointerEvents:'none'}">
      </span>
      <span v-if="(ch.children||[]).length>0" @click.stop="handleBtnAction('pathTree-toggle', ch.pathId)"
        style="position:relative;z-index:1;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border:1px solid #94a3b8;background:#fff;font-size:10px;line-height:1;color:#475569;cursor:pointer;user-select:none;flex-shrink:0;font-family:monospace;font-weight:700;border-radius:2px;">
        {{ expanded.has(ch.pathId) ? '−' : '+' }}
      </span>
      <span v-else style="display:inline-block;width:16px;height:16px;flex-shrink:0;">
      </span>
      <span style="margin:0 6px 0 4px;font-size:13px;flex-shrink:0;">
        {{ (ch.children||[]).length>0 ? (expanded.has(ch.pathId) ? '📂' : '📁') : '📄' }}
      </span>
      <!-- 인라인 수정 모드 -->
      <template v-if="editingId === ch.pathId">
        <input type="text" :value="editLabel" @input="handleBtnAction('pathTree-update-label', $event.target.value)"
          @keyup.enter="handleBtnAction('pathTree-edit-save')" @keyup.esc="handleBtnAction('pathTree-edit-cancel')" @click.stop
          style="flex:1;padding:3px 8px;font-size:12px;border:1px solid #6366f1;border-radius:4px;outline:none;" />
        <button @click.stop="handleBtnAction('pathTree-edit-save')" title="저장"
          style="margin-left:4px;width:22px;height:22px;border:none;background:#10b981;color:#fff;border-radius:4px;cursor:pointer;font-size:11px;">
          ✓
        </button>
        <button @click.stop="handleBtnAction('pathTree-edit-cancel')" title="취소"
          style="margin-left:2px;width:22px;height:22px;border:none;background:#9ca3af;color:#fff;border-radius:4px;cursor:pointer;font-size:11px;">
          ✕
        </button>
      </template>
      <template v-else>
        <span style="flex:1;">
          {{ ch.pathLabel }}
        </span>
        <span v-if="ch.count>0" style="font-size:10px;color:#6b7280;background:#fff;padding:1px 7px;border-radius:10px;border:1px solid #e5e7eb;font-weight:500;margin-right:4px;">
          {{ ch.count }}
        </span>
        <!-- 사용자 추가 항목만 수정/삭제 노출 -->
        <template v-if="ch.userAdded">
          <button @click.stop="handleBtnAction('pathTree-edit-start', ch)" title="수정"
            style="width:22px;height:22px;border:1px solid #c7d2fe;background:#eef2ff;color:#4f46e5;border-radius:4px;cursor:pointer;font-size:10px;margin-right:2px;">
            ✏
          </button>
          <button @click.stop="handleBtnAction('pathTree-delete', ch)" title="삭제"
            :disabled="(ch.children||[]).length>0"
            :style="{width:'22px',height:'22px',border:'1px solid '+((ch.children||[]).length>0?'#e5e7eb':'#fecaca'),background:(ch.children||[]).length>0?'#f3f4f6':'#fee2e2',color:(ch.children||[]).length>0?'#9ca3af':'#dc2626',borderRadius:'4px',cursor:(ch.children||[]).length>0?'not-allowed':'pointer',fontSize:'10px',marginRight:'4px'}">
            🗑
          </button>
        </template>
      </template>
    </div>
    <div v-if="expanded.has(ch.pathId) ? ((ch.children||[]).length>0) : false" :style="{position:'relative'}">
    <span :style="{position:'absolute',left:(depth*20 + 16)+'px',top:'0',bottom: (ci===node.children.length-1) ? '50%' : '0',width:'1px',borderLeft:'1px dotted #cbd5e1',pointerEvents:'none'}">
    </span>
    <path-pick-tree-node :node="ch" :expanded="expanded" :selected="selected" :add-parent="addParent"
        :editing-id="editingId" :edit-label="editLabel"
        :on-toggle="onToggle" :on-select="onSelect" :on-set-parent="onSetParent" :on-confirm="onConfirm"
        :on-start-edit="onStartEdit" :on-save-edit="onSaveEdit" :on-cancel-edit="onCancelEdit"
        :on-update-label="onUpdateLabel" :on-delete="onDelete" :depth="depth+1" />
  </div>
  <span v-if="depth > 0 ? (ci < node.children.length - 1) : false" :style="{position:'absolute',left:(depth*20 + 16 - 20)+'px',top:'0',bottom:'0',width:'1px',borderLeft:'1px dotted #cbd5e1',pointerEvents:'none'}">
</span>
</div>
</div>
`,
};

/* ─────────────────────────────────────────────────────────────
   BizPickModal — 사업자 선택 (sy_biz)
───────────────────────────────────────────────────────────── */
window.BizPickModal = {
  name: 'BizPickModal',
  inheritAttrs: false,
  props: {
    value:         { type: String,    default: '' },                      // 값
    title:         { type: String,    default: '' },                      // 제목
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const searchParam = reactive({ searchType: '', searchValue: '', type: '' });
    const bizs = reactive([]);
    const loading = ref(false);
    const pager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [5, 10, 20, 30, 50] });

    /* 좌측 표시경로 트리 (sy_biz) */
    const selectedPathId = ref(null);
    const expanded = reactive(new Set([null]));
    const cfTree = computed(() => boUtil.bofBuildPathTree('sy_biz'));

    /* toggleNode */
    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };

    /* selectNode */
    const selectNode = (id) => { selectedPathId.value = id; pager.pageNo = 1; handleSearchListWrap(); };

    /* 목록조회 (서버사이드 페이징) */
    const handleSearchList = async () => {
      loading.value = true;
      try {
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          searchValue: searchParam.searchValue || undefined,
          searchType: searchParam.searchType || undefined,
          type: searchParam.type || undefined,
          pathId: selectedPathId.value || undefined,
        };
        if (params.searchValue && !params.searchType) { params.searchType = 'bizNo,bizNm,ceoNm'; }
        const res = await boApiSvc.syVendor.getPage(params, '판매자관리', '목록조회');
        const data = res.data?.data;
        bizs.splice(0, bizs.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
      } catch (_) { bizs.splice(0, bizs.length); } finally { loading.value = false; }
    };

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => { const s = Math.max(1, pager.pageNo - 2), e = Math.min(pager.pageTotalPage, s + 4); pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i); };

    /* handleSearchListWrap */
    const handleSearchListWrap = async () => { await handleSearchList(); fnBuildPagerNums(); };

    /* onSearch / onReset */
    const onSearch = () => { pager.pageNo = 1; handleSearchListWrap(); };
    const onReset  = () => { Object.assign(searchParam, { searchType: '', searchValue: '', type: '' }); pager.pageNo = 1; handleSearchListWrap(); };

    /* onSetPage / onSizeChange */
    const onSetPage    = (n) => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchListWrap(); } };
    const onSizeChange = ()  => { pager.pageNo = 1; handleSearchListWrap(); };

    onMounted(() => {
      const initSet = coUtil.cofCollectExpandedToDepth(cfTree.value, 2);
      expanded.clear(); initSet.forEach(v => expanded.add(v));
      handleSearchListWrap();
    });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchListWrap(); });

    const VENDOR_TYPES = [['SALES','판매업체'],['DELIVERY','배송업체'],['PARTNER','제휴사'],['INTERNAL','내부법인']];

    /* vtLabel */
    const vtLabel = (cd) => (VENDOR_TYPES.find(v=>v[0]===cd) || [,cd])[1];

    /* vtBadge */
    const vtBadge = (cd) => ({ SALES:'badge-blue', DELIVERY:'badge-purple', PARTNER:'badge-teal', INTERNAL:'badge-gray' }[cd] || 'badge-gray');

    /* pickAndClose */
    const pickAndClose = (b) => {
      emit('select', b);
      if (props.onCallback) props.onCallback(props.modalName, null, b);
      emit('close');
      if (props.onCallback) props.onCallback(props.modalName, null, null);
    };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BizPickModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'searchParam-search') {
        return onSearch();
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BizPickModal : handleSelectAction -> ', cmd, param);
      if (cmd === 'pathTree-toggle') {
        return toggleNode(param);
      } else if (cmd === 'pathTree-select') {
        return selectNode(param);
      } else if (cmd === 'list-pick') {
        return pickAndClose(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* bizGridColumns — BoGrid 컬럼 정의 */
    const bizGridColumns = [
      { key: 'vendorTypeCd', label: '업체유형', badge: (row) => vtBadge(row.vendorTypeCd), fmt: (v) => vtLabel(v) },
      { key: 'bizNo',        label: '사업자번호', cellInnerStyle: 'font-size:11px;background:#f0f4ff;padding:2px 6px;border-radius:3px;color:#2563eb;font-family:monospace;', fmt: (v) => v || '-' },
      { key: 'bizNm',        label: '상호', cellStyle: 'font-weight:600;', fmt: (v) => v || '-' },
      { key: 'ceoNm',        label: '대표자', fmt: (v) => v || '-' },
    ];

    /* baseSearchColumns — 검색 영역 컬럼 */
    const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck',
        options: [
          { value: 'bizNo', label: '사업자번호' },
          { value: 'bizNm', label: '상호' },
          { value: 'ceoNm', label: '대표자' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', placeholder: '검색어 입력' },
      { key: 'type',        type: 'select',
        options: () => VENDOR_TYPES.map(v => ({ value: v[0], label: v[1] })),
        nullLabel: '업체유형 전체', width: '140px' },
    ];

    return {
      searchParam, VENDOR_TYPES, vtLabel, vtBadge, bizs, pager, loading,      // 데이터
      bizGridColumns, baseSearchColumns,                                       // 컬럼 정의
      selectedPathId, expanded, cfTree,                                       // 트리
      toggleNode, selectNode,                                                 // 트리 헬퍼 (자식 컴포넌트 props 전달용)
      onSetPage, onSizeChange,                                                // 페이저 콜백
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" max-width="820px" box-pad="0" body-pad="0" @close="handleBtnAction('modal-close')">
  <div style="overflow:hidden;border-radius:14px;display:flex;flex-direction:column;height:100%;">
    <div style="background:#fff;border-bottom:1px solid #eef0f3;padding:18px 22px 14px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:#fff0f4;color:#e8587a;font-size:16px;">
          🏢
        </span>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;color:#1f2937;">
            {{ title || '사업자 선택' }}
          </div>
          <div style="font-size:10.5px;color:#9ca3af;font-family:monospace;margin-top:1px;">
            sy_biz
          </div>
        </div>
        <span style="color:#9ca3af;cursor:pointer;font-size:20px;" @click="handleBtnAction('modal-close')">
          ✕
        </span>
      </div>
      <div style="margin-top:12px;">
        <bo-search-area :columns="baseSearchColumns" :param="searchParam" :loading="loading"
          @search="handleBtnAction('searchParam-search')" @reset="handleBtnAction('searchParam-reset')" />
      </div>
    </div>
    <div style="background:#fafbfc;display:grid;grid-template-columns:200px 1fr;max-height:55vh;">
      <!-- 좌측 표시경로 트리 -->
      <div style="border-right:1px solid #eef0f3;background:#fff;overflow:auto;padding:8px;">
        <div style="font-size:11px;font-weight:700;color:#666;margin-bottom:6px;padding:0 4px;">
          📂 표시경로
        </div>
        <bo-prop-tree-node :node="cfTree" :expanded="expanded" :selected="selectedPathId"
          :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
      <!-- 우측 사업자 목록 -->
      <div style="overflow:auto;">
        <bo-grid :columns="bizGridColumns" :rows="bizs" :pager="pager" row-key="bizId"
          :list-title="'총 ' + pager.pageTotalCount + '건'"
          :empty-text="loading ? '로딩 중...' : '검색 결과가 없습니다.'"
          row-clickable :row-actions="true"
          @row-click="row => handleSelectAction('list-pick', row)">
          <template #row-actions="{ row }">
            <button class="btn btn_select" @click.stop="handleSelectAction('list-pick', row)">
              선택
            </button>
          </template>
        </bo-grid>
        <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChange" />
      </div>
    </div>
    <div style="padding:14px 22px;display:flex;justify-content:flex-end;background:#fff;border-top:1px solid #eef0f3;">
      <button class="btn btn_cancel" @click="handleBtnAction('modal-close')">
        취소
      </button>
    </div>
  </div>
</bo-modal>
`,
};

/* ─────────────────────────────────────────────────────────────
   SimpleUserPickModal — 단일 사용자 선택 (sy_user / boUsers)
───────────────────────────────────────────────────────────── */
window.SimpleUserPickModal = {
  name: 'SimpleUserPickModal',
  inheritAttrs: false,
  props: {
    title:         { type: String,    default: '' },                      // 제목
    excludeIds:    { type: Array,     default: () => [] },                // 제외할 ID 목록
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const searchParam = reactive({ searchType: '', searchValue: '' });
    const boUsers = reactive([]);
    const loading = ref(false);
    const pager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [5, 10, 20, 30, 50] });

    /* 목록조회 (서버사이드 페이징) */
    const handleSearchList = async () => {
      loading.value = true;
      try {
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          searchValue: searchParam.searchValue || undefined,
          searchType: searchParam.searchType || undefined,
        };
        if (params.searchValue && !params.searchType) { params.searchType = 'name,loginId,email'; }
        const res = await boApiSvc.syUser.getPage(params, '사용자관리', '목록조회');
        const data = res.data?.data;
        let list = data?.pageList || data?.list || [];
        // 제외 ID 적용 (클라이언트 측 필터링은 어쩔 수 없음 - 서버에 excludeIds 파라미터 없는 경우)
        const excl = new Set(props.excludeIds || []);
        if (excl.size > 0) { list = list.filter(u => !excl.has(u.boUserId) && !excl.has(u.userId)); }
        boUsers.splice(0, boUsers.length, ...list);
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
      } catch (_) { boUsers.splice(0, boUsers.length); } finally { loading.value = false; }
    };

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => { const s = Math.max(1, pager.pageNo - 2), e = Math.min(pager.pageTotalPage, s + 4); pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i); };

    /* handleSearchListWrap */
    const handleSearchListWrap = async () => { await handleSearchList(); fnBuildPagerNums(); };

    /* onSearch / onReset */
    const onSearch = () => { pager.pageNo = 1; handleSearchListWrap(); };
    const onReset = () => { searchParam.searchType = ''; searchParam.searchValue = ''; pager.pageNo = 1; handleSearchListWrap(); };

    /* onSetPage / onSizeChange */
    const onSetPage    = (n) => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchListWrap(); } };
    const onSizeChange = ()  => { pager.pageNo = 1; handleSearchListWrap(); };

    onMounted(() => { handleSearchListWrap(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchListWrap(); });

    /* pick */
    const pick = (u) => {
      emit('select', u);
      if (props.onCallback) props.onCallback(props.modalName, null, u);
      emit('close');
      if (props.onCallback) props.onCallback(props.modalName, null, null);
    };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SimpleUserPickModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'searchParam-search') {
        return onSearch();
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SimpleUserPickModal : handleSelectAction -> ', cmd, param);
      if (cmd === 'list-pick') {
        return pick(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };
    /* userGridColumns — BoGrid 컬럼 정의 */
    const userGridColumns = [
      { key: 'name',    label: '이름',     cellStyle: 'font-weight:600;', fmt: (v) => v || '-' },
      { key: 'loginId', label: '로그인ID', mono: true, cellStyle: 'color:#2563eb;font-size:11px;', fmt: (v) => v || '-' },
      { key: 'email',   label: '이메일',   cellStyle: 'color:#0369a1;font-size:11.5px;', fmt: (v) => v || '-' },
      { key: 'dept',    label: '부서',     cellStyle: 'color:#666;font-size:11.5px;', fmt: (v) => v || '-' },
    ];

    /* baseSearchColumns — 검색 영역 컬럼 */
    const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck',
        options: [
          { value: 'nm',      label: '이름' },
          { value: 'loginId', label: '로그인ID' },
          { value: 'email',   label: '이메일' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '140px' },
      { key: 'searchValue', type: 'text', placeholder: '검색어 입력' },
    ];

    return {
      searchParam, boUsers, pager, loading,                                   // 데이터
      userGridColumns, baseSearchColumns,                                      // 컬럼 정의
      onSetPage, onSizeChange,                                                // 페이저 콜백
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" max-width="600px" box-pad="0" body-pad="0" @close="handleBtnAction('modal-close')">
  <div style="overflow:hidden;border-radius:14px;display:flex;flex-direction:column;height:100%;">
    <div style="background:#fff;border-bottom:1px solid #eef0f3;padding:18px 22px 14px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:#eef2ff;color:#6366f1;font-size:16px;">
          👤
        </span>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;color:#1f2937;">
            {{ title || '사용자 선택' }}
          </div>
          <div style="font-size:10.5px;color:#9ca3af;font-family:monospace;margin-top:1px;">
            sy_user
          </div>
        </div>
        <span style="color:#9ca3af;cursor:pointer;font-size:20px;" @click="handleBtnAction('modal-close')">
          ✕
        </span>
      </div>
      <div style="margin-top:12px;">
        <bo-search-area :columns="baseSearchColumns" :param="searchParam" :loading="loading"
          @search="handleBtnAction('searchParam-search')" @reset="handleBtnAction('searchParam-reset')" />
      </div>
    </div>
    <div style="background:#fafbfc;max-height:55vh;overflow:auto;">
      <bo-grid :columns="userGridColumns" :rows="boUsers" :pager="pager" row-key="boUserId"
        :list-title="'총 ' + pager.pageTotalCount + '건'"
        :empty-text="loading ? '로딩 중...' : '결과가 없습니다.'"
        row-clickable :row-actions="true"
        @row-click="row => handleSelectAction('list-pick', row)">
        <template #row-actions="{ row }">
          <button class="btn btn_select" @click.stop="handleSelectAction('list-pick', row)">
            선택
          </button>
        </template>
      </bo-grid>
      <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChange" />
    </div>
    <div style="padding:14px 22px;display:flex;justify-content:flex-end;background:#fff;border-top:1px solid #eef0f3;">
      <button class="btn btn_cancel" @click="handleBtnAction('modal-close')">
        취소
      </button>
    </div>
  </div>
</bo-modal>
`,
};

/* ── 간단 판매업체 선택 모달 (Pm Dtl 8종 공통 패턴) ──
   부모에서 이미 로드한 vendors 배열을 prop 으로 받아 단건 선택. */
window.SimpleVendorPickModal = {
  name: 'SimpleVendorPickModal',
  inheritAttrs: false,
  props: {
    show:       { type: Boolean, default: false },
    vendors:    { type: Array,   default: () => [] },
    selectedId: { type: [String, Number], default: '' },
    title:      { type: String,  default: '판매업체 선택' },
    width:      { type: String,  default: '460px' },
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { reactive, computed, watch } = Vue;
    const searchParam = reactive({ searchValue: '' });
    const pager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [5, 10, 20, 30, 50] });

    const cfFiltered = computed(() => {
      const k = (searchParam.searchValue || '').trim().toLowerCase();
      if (!k) return props.vendors || [];
      return (props.vendors || []).filter(v => (v.vendorNm || '').toLowerCase().includes(k) || String(v.vendorId || '').toLowerCase().includes(k));
    });

    const fnBuildPagerNums = () => {
      pager.pageTotalCount = cfFiltered.value.length;
      pager.pageTotalPage = Math.max(1, Math.ceil(pager.pageTotalCount / pager.pageSize));
      const s = Math.max(1, pager.pageNo - 2), e = Math.min(pager.pageTotalPage, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };

    const cfPageRows = computed(() => {
      fnBuildPagerNums();
      const start = (pager.pageNo - 1) * pager.pageSize;
      return cfFiltered.value.slice(start, start + pager.pageSize);
    });

    watch(() => searchParam.searchValue, () => { pager.pageNo = 1; });
    watch(() => props.vendors, () => { pager.pageNo = 1; }, { deep: true });

    const onSearch = () => { pager.pageNo = 1; };
    const onReset = () => { searchParam.searchValue = ''; pager.pageNo = 1; };
    const onSetPage = (n) => { if (n >= 1 && n <= pager.pageTotalPage) pager.pageNo = n; };
    const onSizeChange = () => { pager.pageNo = 1; };

    const onPick = (v) => {
      emit('select', v);
      if (props.onCallback) props.onCallback(props.modalName, null, v);
      emit('close');
      if (props.onCallback) props.onCallback(props.modalName, null, null);
    };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SimpleVendorPickModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'searchParam-search') {
        return onSearch();
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SimpleVendorPickModal : handleSelectAction -> ', cmd, param);
      if (cmd === 'vendors-pick') {
        return onPick(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const baseSearchColumns = [
      { key: 'searchValue', type: 'text', placeholder: '판매업체명 검색' },
    ];

    const listGridColumns = [
      { key: 'vendorNm', label: '판매업체명', cellStyle: 'font-weight:600;', fmt: (v) => v || '-' },
      { key: 'vendorId', label: 'ID', mono: true, cellStyle: 'color:#888;font-size:11px;', fmt: (v) => v || '-' },
    ];

    const fnRowStyle = (row) => props.selectedId === row.vendorId ? 'background:#f0f4ff;color:#1565c0;font-weight:700;cursor:pointer;' : 'cursor:pointer;';

    return {
      searchParam, cfPageRows, pager,                                         // 데이터
      baseSearchColumns, listGridColumns, fnRowStyle,                         // 컬럼 정의
      onSetPage, onSizeChange,                                                // 페이저 콜백
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="show" :title="title" :width="width" body-pad="0" @close="handleBtnAction('modal-close')">
  <div style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">
    <bo-search-area :columns="baseSearchColumns" :param="searchParam"
      @search="handleBtnAction('searchParam-search')" @reset="handleBtnAction('searchParam-reset')" />
  </div>
  <div style="max-height:55vh;overflow-y:auto;">
    <bo-grid :columns="listGridColumns" :rows="cfPageRows" :pager="pager" row-key="vendorId"
      :list-title="'총 ' + pager.pageTotalCount + '건'" :row-style="fnRowStyle"
      empty-text="판매업체가 없습니다." row-clickable
      @row-click="row => handleSelectAction('vendors-pick', row)"
 />
    <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChange" />
  </div>
  <template #footer>
    <button class="btn btn_close" @click="handleBtnAction('modal-close')">
      닫기
    </button>
  </template>
</bo-modal>
`,
};

/* ── Od* 회원 선택 모달 (Cart/Order/Claim/Dliv 공통 패턴) ──
   서버 페이징 + multiCheck 검색 + bo-grid 행 선택.
   props.subtitle 로 부제 변경, props.uiNm 으로 API 헤더 화면명 지정.
   부모는 selectedId 표시는 모달 외부에서 처리(검색바 pick 영역). */
window.OdMemberPickModal = {
  name: 'OdMemberPickModal',
  inheritAttrs: false,
  props: {
    show:     { type: Boolean, default: false },
    title:    { type: String,  default: '회원 선택' },
    subtitle: { type: String,  default: '회원을 선택해주세요' },
    uiNm:     { type: String,  default: '주문관리' },
    pageSize: { type: Number,  default: 20 },
    reloadTrigger: { type: Number, default: 0 },
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { reactive, watch } = Vue;
    const searchParam = reactive({ searchType: '', searchValue: '' });
    const state = reactive({ loading: false });
    const rows = reactive([]);
    const pager = reactive({ pageNo: 1, pageSize: props.pageSize, pageTotalCount: 0, pageTotalPage: 1, pageNums: [], pageSizes: [5, 10, 20, 30, 50]});

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* handleSearch */
    const handleSearch = async () => {
      state.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize,
          searchValue: searchParam.searchValue || undefined,
          searchType: searchParam.searchType || undefined };
        if (params.searchValue && !params.searchType) params.searchType = 'memberNm,loginId';
        const res = await boApiSvc.mbMember.getPage(params, props.uiNm, '회원검색');
        const d = res.data?.data || {};
        rows.splice(0, rows.length, ...(d.pageList || []));
        pager.pageTotalCount = d.pageTotalCount || 0;
        pager.pageTotalPage = d.pageTotalPage || 1;
        fnBuildPagerNums();
      } catch (_) { rows.splice(0, rows.length); pager.pageTotalCount = 0; pager.pageTotalPage = 1; }
      finally { state.loading = false; }
    };
    const onPickSearch = () => { pager.pageNo = 1; handleSearch(); };
    const onPickPage   = (n) => { pager.pageNo = n; handleSearch(); };
    const onSizeChange = () => { pager.pageNo = 1; handleSearch(); };
    const onSelect     = (m) => {
      emit('select', m);
      if (props.onCallback) props.onCallback(props.modalName, null, m);
      emit('close');
      if (props.onCallback) props.onCallback(props.modalName, null, null);
    };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ OdMemberPickModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'searchParam-search') {
        return onPickSearch();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ OdMemberPickModal : handleSelectAction -> ', cmd, param);
      if (cmd === 'members-pick') {
        return onSelect(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* show=true 또는 reloadTrigger 증가 시 초기화 + 재조회 */
    const reset = () => { searchParam.searchType=''; searchParam.searchValue=''; rows.splice(0, rows.length); pager.pageNo=1; handleSearch(); };
    watch(() => props.show, v => { if (v) reset(); });
    watch(() => props.reloadTrigger, () => { if (props.show) handleSearch(); });

    const memberPickGridColumns = [
      { key: 'memberNm',       label: '이름',
        fmt: (v, row) => `${row.memberNm || '-'}  #${row.memberId || row.sessionKey || '-'}` },
      { key: 'loginId',        label: '로그인ID', mono: true, cellStyle: 'font-size:12px;' },
      { key: 'gradeCdNm',      label: '등급', style: 'width:80px;text-align:center;',
        fmt: (v) => v || '-',
        cellInnerStyle: 'background:#f3e8ff;color:#7c3aed;border-radius:10px;padding:2px 8px;font-size:11px;font-weight:600;' },
      { key: 'memberStatusCd', label: '상태', style: 'width:80px;text-align:center;',
        fmt: (v, row) => row.memberStatusCdNm || v || '-',
        cellInnerStyle: (v) => (v==='ACTIVE'?'background:#d1fae5;color:#065f46;':'background:#fee2e2;color:#991b1b;') + 'border-radius:10px;padding:2px 8px;font-size:11px;font-weight:600;' },
      { key: 'memberPhone',    label: '연락처', style: 'width:110px;', cellStyle: 'color:#6b7280;', fmt: (v) => v || '-' },
    ];

    /* baseSearchColumns — 검색 영역 컬럼 */
    const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck',
        options: [
          { value: 'memberNm', label: '이름' },
          { value: 'loginId',  label: '아이디' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', placeholder: '검색어 입력' },
    ];

    return {
      state, searchParam, rows, pager,                                       // 데이터
      memberPickGridColumns, baseSearchColumns,                              // 컬럼 정의
      onPickPage, onSizeChange,                                              // BoGrid pager 콜백
      handleBtnAction, handleSelectAction,                                   // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="show" width="820px" max-height="90vh" box-pad="0" body-pad="0" @close="handleBtnAction('modal-close')">
  <div style="border-radius:16px;display:flex;flex-direction:column;height:100%;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#fff0f4,#ffe4ec,#ffd5e1);padding:18px 24px 14px;border-bottom:1px solid #fce7f3;flex-shrink:0;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:17px;font-weight:700;color:#1e293b;">
            {{ title }}
          </div>
          <div style="font-size:12px;color:#9ca3af;margin-top:2px;">
            {{ subtitle }}
          </div>
        </div>
        <button @click="handleBtnAction('modal-close')" style="width:32px;height:32px;border-radius:50%;border:none;background:#fff;cursor:pointer;font-size:16px;color:#6b7280;display:flex;align-items:center;justify-content:center;" onmouseover="this.style.background='#fce7f3';this.style.color='#e11d48'" onmouseout="this.style.background='#fff';this.style.color='#6b7280'">
          ✕
        </button>
      </div>
      <div style="margin-top:12px;">
        <bo-search-area :columns="baseSearchColumns" :param="searchParam"
          @search="handleBtnAction('searchParam-search')" />
      </div>
    </div>
    <div style="padding:8px 24px;background:#fafafa;border-bottom:1px solid #f0f0f0;font-size:12px;color:#6b7280;flex-shrink:0;">
      총
      <strong style="color:#e11d48;">
        {{ pager.pageTotalCount.toLocaleString() }}
      </strong>
      명
    </div>
    <div style="flex:1;overflow-y:auto;">
      <bo-grid row-clickable :columns="memberPickGridColumns" :rows="rows" :pager="pager" row-key="memberId"
        :row-style="() => 'cursor:pointer;'"
        :empty-text="state.loading ? '조회 중...' : '조회 결과가 없습니다.'"
        @row-click="(row) => handleSelectAction('members-pick', row)"
 row-actions>
        <template #row-actions="{ row }">
          <button class="btn btn_select" @click.stop="handleSelectAction('members-pick', row)" style="border-radius:6px;font-size:11px;">
            선택
          </button>
        </template>
      </bo-grid>
      <bo-pager :pager="pager" :on-set-page="onPickPage" :on-size-change="onSizeChange" />
    </div>
  </div>
</bo-modal>
`,
};

/* ── 간단 상품 선택 모달 (PmPlanDtl / PmEventDtl 공통 패턴) ──
   부모에서 이미 로드한 prods 배열을 prop 으로 받아 다중 토글.
   부모는 selectedIds(productId 배열)와 toggle(productId) emit 으로 동기화. */
window.SimpleProdPickModal = {
  name: 'SimpleProdPickModal',
  inheritAttrs: false,
  props: {
    show:        { type: Boolean, default: false },
    prods:       { type: Array,   default: () => [] },
    selectedIds: { type: Array,   default: () => [] },
    title:       { type: String,  default: '상품 선택' },
    width:       { type: String,  default: '600px' },
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['toggle', 'close'],
  setup(props, { emit }) {
    const { reactive, computed, watch } = Vue;
    const searchParam = reactive({ searchValue: '' });
    const pager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [5, 10, 20, 30, 50] });

    const cfFiltered = computed(() => {
      const k = (searchParam.searchValue || '').trim().toLowerCase();
      if (!k) return props.prods || [];
      return (props.prods || []).filter(p => (p.prodNm || '').toLowerCase().includes(k));
    });

    const fnBuildPagerNums = () => {
      pager.pageTotalCount = cfFiltered.value.length;
      pager.pageTotalPage = Math.max(1, Math.ceil(pager.pageTotalCount / pager.pageSize));
      const s = Math.max(1, pager.pageNo - 2), e = Math.min(pager.pageTotalPage, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };

    const cfPageRows = computed(() => {
      fnBuildPagerNums();
      const start = (pager.pageNo - 1) * pager.pageSize;
      return cfFiltered.value.slice(start, start + pager.pageSize);
    });

    watch(() => searchParam.searchValue, () => { pager.pageNo = 1; });
    watch(() => props.prods, () => { pager.pageNo = 1; }, { deep: true });

    const onSearch = () => { pager.pageNo = 1; };
    const onReset = () => { searchParam.searchValue = ''; pager.pageNo = 1; };
    const onSetPage = (n) => { if (n >= 1 && n <= pager.pageTotalPage) pager.pageNo = n; };
    const onSizeChange = () => { pager.pageNo = 1; };

    const isSelected = (id) => (props.selectedIds || []).includes(id);
    const onToggle = (p) => {
      emit('toggle', p.productId);
      if (props.onCallback) props.onCallback(props.modalName, null, p.productId);
    };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SimpleProdPickModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'searchParam-search') {
        return onSearch();
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SimpleProdPickModal : handleSelectAction -> ', cmd, param);
      if (cmd === 'prods-toggle') {
        return onToggle(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const baseSearchColumns = [
      { key: 'searchValue', type: 'text', placeholder: '상품명 검색' },
    ];

    const listGridColumns = [
      { key: '_check', label: '', style: 'width:32px;text-align:center;', html: true, fmt: (v, row) => {
        return isSelected(row.productId)
          ? `<span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#7e57c2;color:#fff;font-size:9px;line-height:14px;font-weight:700;">✓</span>`
          : `<span style="display:inline-block;width:14px;height:14px;border-radius:3px;border:1.5px solid #d1d5db;background:#fff;"></span>`;
      } },
      { key: 'prodNm', label: '상품명', cellStyle: 'font-weight:600;font-size:12px;color:#222;', fmt: (v) => v || '-' },
      { key: 'price',  label: '가격', align: 'right', cellStyle: 'font-size:11px;color:#888;', fmt: (v) => (v || 0).toLocaleString() + '원' },
    ];

    const fnRowStyle = (row) => isSelected(row.productId) ? 'background:#ede7f6;cursor:pointer;' : 'cursor:pointer;';

    return {
      searchParam, cfPageRows, pager, isSelected,                             // 데이터
      baseSearchColumns, listGridColumns, fnRowStyle,                         // 컬럼 정의
      onSetPage, onSizeChange,                                                // 페이저 콜백
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="show" :title="title" :width="width" body-pad="0" @close="handleBtnAction('modal-close')">
  <div style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">
    <bo-search-area :columns="baseSearchColumns" :param="searchParam"
      @search="handleBtnAction('searchParam-search')" @reset="handleBtnAction('searchParam-reset')" />
  </div>
  <div style="max-height:55vh;overflow-y:auto;">
    <bo-grid :columns="listGridColumns" :rows="cfPageRows" :pager="pager" row-key="productId"
      :list-title="'총 ' + pager.pageTotalCount + '건'" :row-style="fnRowStyle"
      empty-text="상품이 없습니다." row-clickable
      @row-click="row => handleSelectAction('prods-toggle', row)"
 />
    <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChange" />
  </div>
  <template #footer>
    <button class="btn btn-primary" @click="handleBtnAction('modal-close')">
      확인 ({{ (selectedIds||[]).length }}개)
    </button>
  </template>
</bo-modal>
`,
};

/* ─────────────────────────────────────────────────────────────────────── */
/* ── 이하 BoRefModal / BoCodeGrpModal — 구 BoModals.js 에서 통합 ────── */
/* ─────────────────────────────────────────────────────────────────────── */

window.BoRefModal = {
  name: 'BoRefModal',
  inheritAttrs: false,
  props: {
    state:         { type: Object, default: () => ({}) }, // 공유 상태
    reloadTrigger: { type: Number, default: 0 }, // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { reactive, watch } = Vue;

    /* close */
    const close = () => {
      emit('close');
      if (props.onCallback) props.onCallback(props.modalName, null, null);
    };
    const s = props.state;

    /* -- 각 타입별 데이터 -- */
    const member = reactive({});
    const product = reactive({});
    const order = reactive({});
    const claim = reactive({});
    const coupon = reactive({});

    const API_MAP = {
      member:  (id) => boApiSvc.mbMember.getById(id, '회원상세', '상세조회'),
      product: (id) => boApiSvc.pdProd.getById(id, '상품상세', '상세조회'),
      order:   (id) => boApiSvc.odOrder.getById(id, '주문상세', '상세조회'),
      claim:   (id) => boApiSvc.odClaim.getById(id, '클레임상세', '상세조회'),
      coupon:  (id) => boApiSvc.pmCoupon.getById(id, '쿠폰상세', '상세조회'),
    };
    const DATA_MAP = { member, product, order, claim, coupon };

    watch(() => [s.type, s.id], async ([type, id]) => {
      Object.values(DATA_MAP).forEach(obj => { Object.keys(obj).forEach(k => delete obj[k]); });
      if (!type || !id || !API_MAP[type]) return;
      try {
        const res = await API_MAP[type](id);
        if (res.data?.data) Object.assign(DATA_MAP[type], res.data.data);
      } catch (_) {}
    }, { immediate: true });

    /* badgeCls */
    const badgeCls = (status) => {
      const map = {
        '활성': 'badge-green', '판매중': 'badge-green', '진행중': 'badge-blue',
        '완료': 'badge-gray', '종료': 'badge-gray', '배송완료': 'badge-gray',
        '취소됨': 'badge-red', '정지': 'badge-red', '품절': 'badge-red',
        '배송중': 'badge-orange', '배송준비중': 'badge-orange', '결제완료': 'badge-orange',
        '만료': 'badge-red', '예정': 'badge-purple',
      };
      return map[status] || 'badge-gray';
    };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoRefModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        return close();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (미사용) */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoRefModal : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* memberFormColumns — 회원 상세 (BoFormArea readonly, cols=2, labelLeft) */
    const memberFormColumns = [
      { key: 'memberId',          label: '회원ID',      type: 'readonly' },
      { key: 'memberNm',          label: '이름',        type: 'readonly' },
      { key: 'loginId',           label: '이메일(ID)',  type: 'readonly' },
      { key: 'memberPhone',       label: '연락처',      type: 'readonly', fmt: (v) => v || '-' },
      { key: 'gradeCd',           label: '등급',        type: 'readonly', html: true, fmt: (v) => v ? `<span class="badge badge-purple">${v}</span>` : '-' },
      { key: 'memberStatusCd',    label: '상태',        type: 'readonly', html: true, fmt: (v) => v ? `<span class="badge ${badgeCls(v)}">${v}</span>` : '-' },
      { key: 'joinDate',          label: '가입일',      type: 'readonly', fmt: (v) => v ? String(v).slice(0, 10) : '-' },
      { key: 'lastLogin',         label: '최근 로그인', type: 'readonly', fmt: (v) => v ? String(v).slice(0, 16) : '-' },
      { key: 'orderCount',        label: '주문수',      type: 'readonly', fmt: (v) => (v != null ? v + '건' : '-') },
      { key: 'totalPurchaseAmt',  label: '총 구매액',   type: 'readonly', fmt: (v) => (v != null ? v.toLocaleString() + '원' : '-') },
    ];

    /* productFormColumns — 상품 상세 */
    const productFormColumns = [
      { key: 'productId', label: '상품ID',   type: 'readonly' },
      { key: 'prodNm',    label: '상품명',   type: 'readonly' },
      { key: 'category',  label: '카테고리', type: 'readonly' },
      { key: 'price',     label: '가격',     type: 'readonly', fmt: (v) => (v != null ? v.toLocaleString() + '원' : '-') },
      { key: 'stock',     label: '재고',     type: 'readonly', fmt: (v) => (v != null ? v + '개' : '-') },
      { key: 'brand',     label: '브랜드',   type: 'readonly' },
      { key: 'statusCd',  label: '상태',     type: 'readonly', html: true, fmt: (v) => v ? `<span class="badge ${badgeCls(v)}">${v}</span>` : '-' },
      { key: 'regDate',   label: '등록일',   type: 'readonly' },
    ];

    /* orderFormColumns — 주문 상세 */
    const orderFormColumns = [
      { key: 'orderId',     label: '주문ID',   type: 'readonly' },
      { key: '_member',     label: '회원',     type: 'readonly', fmt: (v, row) => `${row.userNm || '-'} (ID: ${row.userId || '-'})` },
      { key: 'orderDate',   label: '주문일시', type: 'readonly' },
      { key: 'prodNm',      label: '상품',     type: 'readonly' },
      { key: 'totalPrice',  label: '결제금액', type: 'readonly', fmt: (v) => (v != null ? v.toLocaleString() + '원' : '-') },
      { key: 'payMethodCd', label: '결제수단', type: 'readonly' },
      { key: 'statusCd',    label: '상태',     type: 'readonly', html: true, fmt: (v) => v ? `<span class="badge ${badgeCls(v)}">${v}</span>` : '-' },
    ];

    /* claimFormColumns — 클레임 상세 */
    const claimFormColumns = [
      { key: 'claimId',      label: '클레임ID', type: 'readonly' },
      { key: 'userNm',       label: '회원',     type: 'readonly' },
      { key: 'orderId',      label: '주문ID',   type: 'readonly' },
      { key: 'type',         label: '유형',     type: 'readonly', html: true, fmt: (v) => v ? `<span class="badge badge-orange">${v}</span>` : '-' },
      { key: 'statusCd',     label: '상태',     type: 'readonly', html: true, fmt: (v) => v ? `<span class="badge ${badgeCls(v)}">${v}</span>` : '-' },
      { key: 'prodNm',       label: '상품명',   type: 'readonly' },
      { key: 'reasonCd',     label: '사유',     type: 'readonly' },
      { key: 'requestDate',  label: '신청일',   type: 'readonly' },
      { key: 'refundAmount', label: '환불금액', type: 'readonly', visible: (row) => !!row.refundAmount, fmt: (v) => (v != null ? v.toLocaleString() + '원' : '-') },
    ];

    /* couponFormColumns — 쿠폰 상세 */
    const couponFormColumns = [
      { key: 'couponId',  label: '쿠폰ID',   type: 'readonly' },
      { key: 'name',      label: '쿠폰명',   type: 'readonly' },
      { key: 'code',      label: '코드',     type: 'readonly' },
      { key: '_discount', label: '할인',     type: 'readonly', fmt: (v, row) => row.discountTypeCd === 'rate' ? (row.discountValue + '%') : row.discountTypeCd === 'shipping' ? '무료배송' : (row.discountValue != null ? row.discountValue.toLocaleString() + '원' : '-') },
      { key: '_minOrder', label: '최소주문', type: 'readonly', fmt: (v, row) => row.minOrder ? row.minOrder.toLocaleString() + '원 이상' : '제한없음' },
      { key: 'issueTo',   label: '발급대상', type: 'readonly' },
      { key: 'expiry',    label: '만료일',   type: 'readonly' },
      { key: 'statusCd',  label: '상태',     type: 'readonly', html: true, fmt: (v) => v ? `<span class="badge ${badgeCls(v)}">${v}</span>` : '-' },
    ];

    return {
      member, product, order, claim, coupon, badgeCls, s,                     // 데이터
      memberFormColumns, productFormColumns, orderFormColumns, claimFormColumns, couponFormColumns,  // 컬럼 정의
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" @close="handleBtnAction('modal-close')">
  <div class="modal-header" style="margin:-20px -20px 14px -20px;">
    <span class="modal-title">
      {{ s.type==='member'?'회원 상세':s.type==='product'?'상품 상세':s.type==='order'?'주문 상세':s.type==='claim'?'클레임 상세':'쿠폰 상세' }}
    </span>
    <span class="modal-close" @click="handleBtnAction('modal-close')">
      ×
    </span>
  </div>
  <!-- 회원 -->
  <template v-if="s.type==='member'">
    <bo-form-area v-if="member.userId" :columns="memberFormColumns" :form="member" :cols="2" readonly label-left :show-actions="false" label-width="100px" />
    <div v-else style="color:#999;text-align:center;padding:20px;">
      회원 정보를 찾을 수 없습니다.
    </div>
  </template>
  <!-- 상품 -->
  <template v-else-if="s.type==='product'">
    <bo-form-area v-if="product.productId" :columns="productFormColumns" :form="product" :cols="2" readonly label-left :show-actions="false" label-width="100px" />
    <div v-else style="color:#999;text-align:center;padding:20px;">
      상품 정보를 찾을 수 없습니다.
    </div>
  </template>
  <!-- 주문 -->
  <template v-else-if="s.type==='order'">
    <bo-form-area v-if="order.orderId" :columns="orderFormColumns" :form="order" :cols="2" readonly label-left :show-actions="false" label-width="100px" />
    <div v-else style="color:#999;text-align:center;padding:20px;">
      주문 정보를 찾을 수 없습니다.
    </div>
  </template>
  <!-- 클레임 -->
  <template v-else-if="s.type==='claim'">
    <bo-form-area v-if="claim.claimId" :columns="claimFormColumns" :form="claim" :cols="2" readonly label-left :show-actions="false" label-width="100px" />
    <div v-else style="color:#999;text-align:center;padding:20px;">
      클레임 정보를 찾을 수 없습니다.
    </div>
  </template>
  <!-- 쿠폰 -->
  <template v-else-if="s.type==='coupon'">
    <bo-form-area v-if="coupon.couponId" :columns="couponFormColumns" :form="coupon" :cols="2" readonly label-left :show-actions="false" label-width="100px" />
    <div v-else style="color:#999;text-align:center;padding:20px;">
      쿠폰 정보를 찾을 수 없습니다.
    </div>
  </template>
  <div style="margin-top:16px;text-align:right;">
    <button class="btn btn_close" @click="handleBtnAction('modal-close')">
      닫기
    </button>
  </div>
</bo-modal>
`
};

/* ── BoCodeGrpModal ──────────────────────────────────────────
 * 공통코드 그룹 미리보기 모달.
 *
 * Props:
 *   show     (Boolean)  — 모달 노출 여부
 *   codeGrp  (String)   — 조회할 코드 그룹 (예: 'PROD_OPT_CATEGORY')
 *   title    (String)   — 헤더 타이틀 (선택, 미설정 시 codeGrp 사용)
 *
 * Emits:
 *   close             — 닫기 버튼/배경 클릭
 *   select(codeRow)   — 행 더블클릭 시 코드 선택 (선택 사용 시)
 *
 * 사용:
 *   <bo-code-grp-modal :show="codeModal.show" :code-grp="codeModal.grp"
 *                      :title="'옵션 카테고리 코드'"
 *                      @close="codeModal.show=false" @select="onCodePick" />
 * ──────────────────────────────────────────────────────────── */
window.BoCodeGrpModal = {
  name: 'BoCodeGrpModal',
  inheritAttrs: false,
  props: {
    show:    { type: Boolean, default: false },
    codeGrp: { type: String,  default: '' },
    title:   { type: String,  default: '' },
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['close', 'select'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch } = Vue;
    const codes = ref([]);
    const loading = ref(false);
    const error = ref('');
    const tab = ref('list'); // 'list' | 'tree'
    const searchParam = reactive({ searchValue: '' });
    const pager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageNums: [], pageSizes: [5, 10, 20, 30, 50, 100, 200, 500] });

    /* 원본 row 키(codeVal/codeNm/codeSortOrd/codeLevel/parentCodeValue) → 화면용 정규화 */
    const fnNorm = (c) => ({
      codeId:          c.codeId,
      codeValue:       c.codeVal ?? c.codeValue ?? '',
      codeLabel:       c.codeNm  ?? c.codeLabel ?? c.codeVal ?? '',
      codeLevel:       Number(c.codeLevel ?? 1),
      parentCodeValue: c.parentCodeValue ?? null,
      sortOrd:         Number(c.codeSortOrd ?? c.sortOrd ?? 0),
      useYn:           c.useYn ?? 'Y',
      codeRemark:      c.codeRemark ?? '',
    });

    /* fnLoad */
    const fnLoad = async () => {
      if (!props.codeGrp) { codes.value = []; return; }
      loading.value = true;
      error.value = '';
      try {
        /* 1차: 클라이언트 코드 스토어에서 시도 (네트워크 0회) */
        const store = window.sfGetBoCodeStore?.();
        const local = store?.sgGetCodesByGroup?.(props.codeGrp);
        if (Array.isArray(local) && local.length) {
          codes.value = local.map(fnNorm).sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
          return;
        }
        /* 2차: API 직접 조회 */
        const res = await window.coApiSvc.syCode.getGrpCodes(props.codeGrp, '공통코드', '코드그룹조회');
        const list = res?.data?.data?.pageList || res?.data?.data || [];
        codes.value = (Array.isArray(list) ? list : []).map(fnNorm).sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
      } catch (err) {
        console.error('[BoCodeGrpModal:fnLoad]', err);
        error.value = err.message || '코드 조회 실패';
      } finally {
        loading.value = false;
      }
    };

    /* show=true 또는 codeGrp 변경 시 자동 로드 */
    watch(() => [props.show, props.codeGrp], ([show]) => {
      if (show) { tab.value = 'list'; fnLoad(); }
    }, { immediate: true });

    /* 트리 빌드: parentCodeValue 로 부모-자식 연결 */
    const cfTree = computed(() => {
      const all = codes.value || [];
      if (!all.length) return [];
      const byParent = new Map();
      all.forEach(c => {
        const p = c.parentCodeValue || '';
        if (!byParent.has(p)) byParent.set(p, []);
        byParent.get(p).push(c);
      });
      const known = new Set(all.map(c => c.codeValue));

      /* buildChildren */
      const buildChildren = (parentVal) => {
        const list = byParent.get(parentVal) || [];
        return list
          .slice()
          .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
          .map(c => ({ ...c, children: buildChildren(c.codeValue) }));
      };
      // 루트: parentCodeValue 가 없거나, 부모가 같은 그룹 안에 존재하지 않는 항목
      const roots = all.filter(c => !c.parentCodeValue || !known.has(c.parentCodeValue));
      return roots
        .slice()
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(r => ({ ...r, children: buildChildren(r.codeValue) }));
    });

    const cfHasTree = computed(() => codes.value.some(c => Number(c.codeLevel || 1) > 1 || c.parentCodeValue));

    /* cfFilteredCodes — 검색어로 필터링된 코드 목록 */
    const cfFilteredCodes = computed(() => {
      const k = (searchParam.searchValue || '').trim().toLowerCase();
      if (!k) return codes.value;
      return codes.value.filter(c =>
        (c.codeId || '').toLowerCase().includes(k) ||
        (c.codeValue || '').toLowerCase().includes(k) ||
        (c.codeLabel || '').toLowerCase().includes(k)
      );
    });

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => {
      const total = cfFilteredCodes.value.length;
      pager.pageTotalCount = total;
      pager.pageTotalPage = Math.max(1, Math.ceil(total / pager.pageSize));
      const c = pager.pageNo, l = pager.pageTotalPage, s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };

    /* cfPageCodes — 페이지에 해당하는 코드 슬라이스 */
    const cfPageCodes = computed(() => {
      fnBuildPagerNums();
      const start = (pager.pageNo - 1) * pager.pageSize;
      return cfFilteredCodes.value.slice(start, start + pager.pageSize);
    });

    watch(() => searchParam.searchValue, () => { pager.pageNo = 1; });

    /* onSetPage / onSizeChange */
    const onSetPage    = (n) => { if (n >= 1 && n <= pager.pageTotalPage) pager.pageNo = n; };
    const onSizeChange = () => { pager.pageNo = 1; };

    /* onClose */
    const onClose  = () => {
      emit('close');
      if (props.onCallback) props.onCallback(props.modalName, null, null);
    };

    /* onSelect */
    const onSelect = (row) => {
      emit('select', row);
      if (props.onCallback) props.onCallback(props.modalName, null, row);
    };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoCodeGrpModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        return onClose();
      } else if (cmd === 'tab-change') {
        tab.value = param;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoCodeGrpModal : handleSelectAction -> ', cmd, param);
      if (cmd === 'codes-pick') {
        return onSelect(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* codeGridColumns — BoGrid 컬럼 정의 */
    const codeGridColumns = [
      { key: 'codeId',          label: '코드ID',     style: 'width:120px;', cellInnerStyle: 'background:#f3e5f5;padding:2px 6px;border-radius:4px;font-family:monospace;color:#6a1b9a;font-size:11px;', fmt: (v) => v || '-' },
      { key: 'codeValue',       label: '코드값',     style: 'width:160px;', cellInnerStyle: 'background:#f5f5f7;padding:2px 6px;border-radius:4px;font-family:monospace;color:#1565c0;', fmt: (v) => v || '-' },
      { key: 'codeLabel',       label: '코드명',     fmt: (v) => v || '-' },
      { key: 'codeLevel',       label: '레벨',       style: 'width:60px;', align: 'center', badge: (row) => row.codeLevel === 1 ? 'badge-blue' : row.codeLevel === 2 ? 'badge-green' : 'badge-orange', fmt: (v) => 'L' + (v || '-') },
      { key: 'parentCodeValue', label: '부모코드값', style: 'width:140px;', html: true, fmt: (v) => v ? `<code style="background:#fafafa;padding:2px 6px;border-radius:4px;font-family:monospace;color:#888;font-size:11px;">${v}</code>` : '<span style="color:#ccc;">-</span>' },
      { key: 'sortOrd',         label: '정렬',       style: 'width:60px;', align: 'right', cellStyle: 'color:#666;', fmt: (v) => v != null ? v : '-' },
      { key: 'useYn',           label: '사용',       style: 'width:50px;', align: 'center', badge: (row) => row.useYn === 'Y' ? 'badge-green' : 'badge-gray', fmt: (v) => v || '-' },
    ];

    /* baseSearchColumns — 검색 영역 컬럼 */
    const baseSearchColumns = [
      { key: 'searchValue', type: 'text', placeholder: '코드ID / 코드값 / 코드명 검색' },
    ];

    return {
      codes, loading, error, tab, cfTree, cfHasTree, onSelect,                 // 데이터
      searchParam, pager, cfFilteredCodes, cfPageCodes,                        // 검색 / 페이저
      onSetPage, onSizeChange,                                                 // BoGrid pager 콜백
      codeGridColumns, baseSearchColumns,                                      // 컬럼 정의
      handleBtnAction, handleSelectAction,                                     // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="show" width="960px" max-width="94vw" max-height="84vh" box-pad="0" body-pad="0" :z-index="1500" @close="handleBtnAction('modal-close')">
  <div style="background:#fff;border-radius:16px;height:100%;display:flex;flex-direction:column;overflow:hidden;">
    <!-- 헤더 -->
    <div class="tree-modal-header" style="padding:14px 20px;border-bottom:1px solid #f0e0e7;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#fff0f4,#ffe4ec,#ffd5e1);">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:14px;font-weight:700;color:#222;">
          {{ title || '공통코드 미리보기' }}
        </span>
        <code style="font-size:11px;background:#fff;color:#6a1b9a;padding:2px 8px;border-radius:4px;border:1px solid #e1bee7;font-family:monospace;">
          {{ codeGrp }}
        </code>
        </div>
        <button @click="handleBtnAction('modal-close')" style="border:none;background:transparent;color:#888;font-size:18px;cursor:pointer;">
          ✕
        </button>
      </div>
      <!-- 탭 바 -->
      <div style="display:flex;gap:0;border-bottom:1px solid #eee;background:#fafafa;padding:0 14px;">
        <button type="button" @click="handleBtnAction('tab-change', 'list')"
        :style="(tab==='list'
        ? 'border:none;background:#fff;border-top:2px solid #ec4899;color:#222;font-weight:700;'
        : 'border:none;background:transparent;color:#888;font-weight:500;')
        + 'padding:10px 16px;font-size:13px;cursor:pointer;border-radius:6px 6px 0 0;'"
        >
          📋 일반 코드목록
        </button>
        <button type="button" @click="handleBtnAction('tab-change', 'tree')"
        :style="(tab==='tree'
        ? 'border:none;background:#fff;border-top:2px solid #ec4899;color:#222;font-weight:700;'
        : 'border:none;background:transparent;color:#888;font-weight:500;')
        + 'padding:10px 16px;font-size:13px;cursor:pointer;border-radius:6px 6px 0 0;'"
        >
          🌲 트리목록
          <span v-if="!cfHasTree" style="font-size:10px;color:#bbb;margin-left:4px;">
            (단층)
          </span>
        </button>
      </div>
      <!-- 본문 -->
      <div style="padding:14px 20px;overflow-y:auto;flex:1;">
        <!-- 검색 (list 탭에서만) -->
        <div v-if="tab==='list' ? (codes.length) : false" style="margin-bottom:10px;">
          <bo-search-area :columns="baseSearchColumns" :param="searchParam" :show-actions="false" />
        </div>
        <div v-if="loading" style="padding:32px;text-align:center;color:#999;font-size:13px;">
          불러오는 중...
        </div>
        <div v-else-if="error" style="padding:24px;text-align:center;color:#d32f2f;font-size:13px;">
          {{ error }}
        </div>
        <div v-else-if="!codes.length" style="padding:32px;text-align:center;color:#aaa;font-size:13px;">
          등록된 코드가 없습니다.
        </div>
        <!-- ── 일반 코드목록 ── -->
        <template v-else-if="tab==='list'">
          <bo-grid :columns="codeGridColumns" :rows="cfPageCodes" :pager="pager"
            row-key="codeId" row-clickable
            empty-text="검색 결과가 없습니다."
            @row-click="row => handleSelectAction('codes-pick', row)"
 />
          <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChange" />
        </template>
        <!-- ── 트리목록 ── -->
        <div v-else-if="tab==='tree'" style="font-size:12px;">
          <div v-if="!cfTree.length" style="padding:32px;text-align:center;color:#aaa;">
            표시할 트리가 없습니다.
          </div>
          <ul v-else style="list-style:none;padding-left:0;margin:0;">
            <bo-code-grp-tree-node v-for="node in cfTree" :key="node.codeId || node.codeValue"
              :node="node" :depth="0" @select="(row) => handleSelectAction('codes-pick', row)" />
          </ul>
        </div>
      </div>
      <!-- 푸터 -->
      <div style="padding:12px 20px;border-top:1px solid #f0f0f0;background:#fafafa;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:11px;color:#888;">
          총 {{ codes.length }}건 · 행 클릭 시 선택
        </span>
        <button class="btn btn_close" @click="handleBtnAction('modal-close')">
          닫기
        </button>
      </div>
    </div>
  </bo-modal>
`
};

/* ── BoCodeGrpTreeNode (재귀 노드 컴포넌트) ───────────────────── */
window.BoCodeGrpTreeNode = {
  name: 'BoCodeGrpTreeNode',
  inheritAttrs: false,
  props: {
    node:  { type: Object, required: true },
    depth: { type: Number, default: 0 },
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['select'],
  setup(props, { emit }) {
    const { ref } = Vue;
    const open = ref(true);

    /* onSelect */
    const onSelect = (n) => {
      emit('select', n);
      if (props.onCallback) props.onCallback(props.modalName, null, n);
    };

    /* toggle */
    const toggle = () => { open.value = !open.value; };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoCodeGrpTreeNode : handleBtnAction -> ', cmd, param);
      if (cmd === 'codes-toggle') {
        return toggle();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoCodeGrpTreeNode : handleSelectAction -> ', cmd, param);
      if (cmd === 'codes-pick') {
        return onSelect(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };
    return {
      open, onSelect,                                                          // 데이터/헬퍼 (자식 노드 emit 전달용)
      handleBtnAction, handleSelectAction,                                     // dispatch
    };
  },
  template: /* html */`
<li :style="'margin:0;padding:0;'">
  <div @dblclick="handleSelectAction('codes-pick', node)"
    :style="'display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:6px;cursor:pointer;'
    + (depth%2===0 ? '' : 'background:#fafbfc;')
    + 'border-left:3px solid '+(node.codeLevel===1?'#1677ff':node.codeLevel===2?'#22c55e':'#f59e0b')+';'
    + 'margin-left:'+(depth*16)+'px;'"
    title="더블클릭하여 선택">
    <button v-if="node.children ? (node.children.length) : false" type="button" @click.stop="handleBtnAction('codes-toggle')" style="border:none;background:transparent;cursor:pointer;font-size:11px;color:#666;width:16px;">
    {{ open ? '▼' : '▶' }}
  </button>
  <span v-else style="display:inline-block;width:16px;color:#ddd;font-size:11px;text-align:center;">
    ·
  </span>
  <span class="badge" :class="node.codeLevel===1?'badge-blue':node.codeLevel===2?'badge-green':'badge-orange'" style="font-size:10px;flex-shrink:0;">
    L{{ node.codeLevel }}
  </span>
  <code style="background:#f3e5f5;padding:1px 6px;border-radius:4px;font-family:monospace;color:#6a1b9a;font-size:11px;flex-shrink:0;">
      {{ node.codeId }}
    </code>
    <code style="background:#f5f5f7;padding:1px 6px;border-radius:4px;font-family:monospace;color:#1565c0;flex-shrink:0;">
      {{ node.codeValue }}
    </code>
      <span style="flex:1;">
        {{ node.codeLabel }}
      </span>
      <span style="color:#888;font-size:11px;flex-shrink:0;">
        정렬 {{ node.sortOrd }}
      </span>
      <span :class="['badge', node.useYn==='Y' ? 'badge-green' : 'badge-gray']" style="font-size:10px;flex-shrink:0;">
        {{ node.useYn || '-' }}
      </span>
    </div>
    <ul v-if="open ? (node.children ? (node.children.length) : false) : false" style="list-style:none;padding-left:0;margin:0;">
    <bo-code-grp-tree-node v-for="child in node.children" :key="child.codeId || child.codeValue"
      :node="child" :depth="depth+1" @select="onSelect" />
  </ul>
</li>
`
};

/* ── 프로필 모달 ─────────────────────────────────────────────────────────────
   profileForm/profileImg reactive 를 ref 로 받아 v-model·표시 직접 바인딩.
   저장·이미지 변경/삭제 로직은 parent(boApp.js) emit. ── */
window.AuthProfileModal = {
  name: 'AuthProfileModal',
  inheritAttrs: false,
  props: {
    show:       { type: Boolean, default: false },
    form:       { type: Object,  required: true },          // profileForm reactive (name/phone/email/dept)
    img:        { type: Object,  default: () => ({}) },      // profileImg reactive (cdnImgUrl)
    uploading:  { type: Boolean, default: false },           // profileImgUploading
    authUser:   { type: Object,  default: () => ({}) },      // currentAuthUser,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['save', 'img-change', 'img-remove', 'close'],
  setup(props, { emit }) {
    const fnInitial = () => ((props.authUser?.authNm || props.authUser?.name || '').charAt(0)) || '?';

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ AuthProfileModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'modal-save') {
        return emit('save');
      } else if (cmd === 'form-img-change') {
        emit('img-change', param);
        if (props.onCallback) props.onCallback(props.modalName, null, param);
        return;
      } else if (cmd === 'form-img-remove') {
        emit('img-remove');
        if (props.onCallback) props.onCallback(props.modalName, null, true);
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (미사용) */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ AuthProfileModal : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* BoFormArea 컬럼 정의 */
    const baseFormColumns = [
      { key: 'name',  label: '이름',   type: 'text', required: true, placeholder: '이름' },
      { key: 'phone', label: '연락처', type: 'text', placeholder: '010-0000-0000' },
      { type: 'rowBreak' },
      { key: 'email', label: '이메일', type: 'readonly', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'dept',  label: '부서',   type: 'text', placeholder: '부서명', colSpan: 2 },
    ];

    return {
      baseFormColumns,                                                        // 컬럼 정의
      fnInitial,                                                              // 헬퍼
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="show" title="🙍 프로필" width="440px" @close="handleBtnAction('modal-close')">
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding:14px;background:#fff5f7;border-radius:10px;">
    <!-- 프로필 사진 -->
    <label style="position:relative;cursor:pointer;flex-shrink:0;" :title="uploading ? '업로드 중...' : '클릭하여 사진 변경'">
      <img v-if="img.cdnImgUrl"
        :src="img.cdnImgUrl"
        style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid #e8587a;" />
      <div v-else style="width:64px;height:64px;border-radius:50%;background:#e8587a;color:#fff;font-size:24px;font-weight:700;display:flex;align-items:center;justify-content:center;">
        {{ fnInitial() }}
      </div>
      <div style="position:absolute;bottom:0;right:0;width:20px;height:20px;border-radius:50%;background:#e8587a;color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;">
        <span v-if="uploading">
          ⏳
        </span>
        <span v-else>
          📷
        </span>
      </div>
      <input type="file" accept="image/*" style="display:none;" :disabled="uploading" @change="handleBtnAction('form-img-change', $event)" />
    </label>
    <div>
      <div style="font-size:15px;font-weight:700;color:#1a1a2e;">
        {{ authUser?.authNm || authUser?.name || '' }}
      </div>
      <div style="font-size:12px;color:#e8587a;font-weight:600;margin-top:3px;">
        {{ authUser?.role || '' }}
      </div>
      <div style="font-size:11px;color:#aaa;margin-top:2px;">
        가입일: {{ authUser?.regDate || '' }}
      </div>
      <div v-if="img.cdnImgUrl" style="font-size:11px;color:#bbb;margin-top:2px;">
        <span style="cursor:pointer;color:#e8587a;" @click.prevent="handleBtnAction('form-img-remove')">
          ✕ 사진 삭제
        </span>
      </div>
    </div>
  </div>
  <bo-form-area :columns="baseFormColumns" :form="form" :cols="2" :show-actions="false" />
  <template #footer>
    <button class="btn btn_cancel" @click="handleBtnAction('modal-close')">
      취소
    </button>
    <button class="btn btn_save" @click="handleBtnAction('modal-save')">
      저장
    </button>
  </template>
</bo-modal>
`,
};

/* ── 사용자 선택 모달 (로그인 화면 개발용 picker) ──────────────────────────────
   boApp.js 인증 setup 의 상태/조회를 그대로 사용하는 dumb-view 모달.
   modal(=userPickModal reactive) 을 ref 로 받아 v-model 직접 바인딩, 액션은 emit.
   ※ BoUserSelectModal / SimpleUserPickModal 과 용도가 달라 Auth* 접두어로 구분 ── */
window.AuthUserPickModal = {
  name: 'AuthUserPickModal',
  inheritAttrs: false,
  props: {
    modal:     { type: Object, required: true },  // userPickModal reactive (show/searchValue/pageNo/loading)
    rows:      { type: Array,  default: () => [] },   // cfPickRows
    total:     { type: Number, default: 0 },          // cfPickTotal
    totalPage: { type: Number, default: 1 },          // cfPickTotalPage
    loginId:   { type: String, default: '' },         // loginForm.loginId (선택 행 강조용)
    pageSize:  { type: Number, default: 20 },
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['search', 'go-page', 'pick', 'close'],
  setup(props, { emit }) {
    const { computed } = Vue;

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ AuthUserPickModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'searchParam-search') {
        return emit('search');
      } else if (cmd === 'pager-set') {
        return emit('go-page', param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ AuthUserPickModal : handleSelectAction -> ', cmd, param);
      if (cmd === 'users-pick') {
        emit('pick', param);
        if (props.onCallback) props.onCallback(props.modalName, null, param);
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* cfPager — BoGrid 호환 pager 객체 (부모 props로부터 합성) */
    const cfPager = computed(() => {
      const c = props.modal.pageNo, l = props.totalPage, s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      return {
        pageNo: props.modal.pageNo,
        pageSize: props.pageSize,
        pageTotalCount: props.total,
        pageTotalPage: props.totalPage,
        pageNums: Array.from({ length: e - s + 1 }, (_, i) => s + i),
      };
    });

    /* userGridColumns — BoGrid 컬럼 정의 */
    const userGridColumns = [
      { key: 'userNm',       label: '이름', cellStyle: 'font-weight:700;color:#1a1a2e;', fmt: (v, row) => v || row.label || '-' },
      { key: 'loginId',      label: '로그인ID', mono: true, cellStyle: 'color:#888;font-size:11px;', fmt: (v) => v || '-' },
      { key: 'siteNm',       label: '사이트', cellStyle: 'color:#777;', fmt: (v) => v || '-' },
      { key: 'deptNm',       label: '부서', cellStyle: 'color:#777;', fmt: (v) => v || '-' },
      { key: 'roleNm',       label: '권한', html: true, fmt: (v) => v ? `<span style="display:inline-block;padding:1px 7px;border-radius:9px;background:#ede9fe;color:#7c3aed;font-size:10px;font-weight:700;">${v}</span>` : '<span style="color:#ddd;">—</span>' },
      { key: 'userStatusCd', label: '상태', align: 'center', html: true, fmt: (v, row) => v === 'ACTIVE'
        ? `<span style="display:inline-block;padding:1px 8px;border-radius:9px;background:#dcfce7;color:#16a34a;font-size:10px;font-weight:700;">활성</span>`
        : `<span style="display:inline-block;padding:1px 8px;border-radius:9px;background:#fee2e2;color:#dc2626;font-size:10px;font-weight:700;">${row.userStatusCdNm || '비활성'}</span>` },
      { key: 'userEmail',    label: '이메일', cellStyle: 'color:#999;font-size:11px;', fmt: (v) => v || '-' },
    ];

    /* baseSearchColumns — 검색 영역 컬럼 */
    const baseSearchColumns = [
      { key: 'searchValue', type: 'text', placeholder: '이름 / 로그인ID / 이메일 검색...' },
    ];

    return {
      cfPager, userGridColumns, baseSearchColumns,                             // 헬퍼 / 컬럼
      handleBtnAction, handleSelectAction,                                     // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="modal.show" width="820px" max-width="96vw" box-pad="0" body-pad="0"
  :z-index="9100" @close="handleBtnAction('modal-close')">
  <div style="display:flex;flex-direction:column;max-height:90vh;">
    <!-- 모달 헤더 -->
    <div style="background:linear-gradient(135deg,#fff0f4,#ffe4ec,#ffd5e1);padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffc8d6;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">
          👥
        </span>
        <div>
          <div style="font-size:14px;font-weight:800;color:#1a1a2e;">
            사용자 선택
          </div>
          <div style="font-size:10px;color:#e8587a;margin-top:1px;">
            선택 시 마스터 패스워드(1111)로 자동 로그인
          </div>
        </div>
      </div>
      <button @click="handleBtnAction('modal-close')" style="background:none;border:none;cursor:pointer;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;color:#e8587a;" onmouseover="this.style.background='#ffd5e1'" onmouseout="this.style.background='none'">
        ✕
      </button>
    </div>
    <!-- 본문 (스크롤 영역) -->
    <div style="padding:14px 18px;overflow-y:auto;flex:1;">
      <!-- 검색바 -->
      <bo-search-area :columns="baseSearchColumns" :param="modal" :show-reset="false"
        @search="handleBtnAction('searchParam-search')" />
      <!-- 건수 -->
      <div style="font-size:11px;color:#aaa;margin:8px 0;">
        총
        <b style="color:#e8587a;">
          {{ total }}
        </b>
        명
      </div>
      <!-- 테이블 + 페이저 (BoGrid 내장) -->
      <div style="overflow-x:auto;border-radius:8px;border:1px solid #f0e0e8;">
        <bo-grid :columns="userGridColumns" :rows="modal.loading ? [] : rows" :pager="cfPager" row-key="loginId"
          :empty-text="modal.loading ? '⏳ 조회 중...' : '🔍 검색 결과가 없습니다.'"
          row-clickable :row-actions="true"
          :row-style="row => loginId===(row.loginId||row.userId) ? 'background:#fff0f4;' : ''"
          @row-click="row => handleSelectAction('users-pick', row)">
          <template #row-actions="{ row }">
            <button @click.stop="handleSelectAction('users-pick', row)" style="background:linear-gradient(135deg,#f9a8c9,#e8587a);color:#fff;border:none;border-radius:6px;padding:3px 10px;font-size:10px;font-weight:700;cursor:pointer;">
              선택
            </button>
          </template>
        </bo-grid>
        <bo-pager :pager="cfPager" :on-set-page="n => handleBtnAction('pager-set', n)" :on-size-change="() => handleBtnAction('pager-set', 1)" />
      </div>
    </div>
  </div>
</bo-modal>
`,
};

/* ── 비밀번호 변경 모달 ───────────────────────────────────────────────────────
   form(=pwForm reactive) 을 ref 로 받아 v-model 직접 바인딩. 저장 로직은 parent emit. ── */
window.AuthPwChangeModal = {
  name: 'AuthPwChangeModal',
  inheritAttrs: false,
  props: {
    show:  { type: Boolean, default: false },
    form:  { type: Object,  required: true },  // pwForm reactive (current/next/confirm)
    error: { type: String,  default: '' },     // pwError,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['save', 'close'],
  setup(_, { emit }) {
    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ AuthPwChangeModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'modal-save') {
        return emit('save');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (미사용) */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ AuthPwChangeModal : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* BoFormArea 컬럼 정의 — 비밀번호 변경 폼 */
    const basePwFormColumns = [
      { key: 'current', label: '현재 비밀번호',    type: 'password', required: true, placeholder: '현재 비밀번호' },
      { key: 'next',    label: '새 비밀번호',      type: 'password', required: true, placeholder: '새 비밀번호 (6자 이상)' },
      { key: 'confirm', label: '새 비밀번호 확인', type: 'password', required: true, placeholder: '새 비밀번호 재입력' },
    ];

    return {
      basePwFormColumns,                                                      // 컬럼 정의
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="show" title="🔑 비밀번호 변경" width="380px" @close="handleBtnAction('modal-close')">
  <bo-form-area :columns="basePwFormColumns" :form="form" :cols="1" :show-actions="false" />
  <div v-if="error" class="login-error">
    {{ error }}
  </div>
  <template #footer>
    <button class="btn btn_cancel" @click="handleBtnAction('modal-close')">
      취소
    </button>
    <button class="btn btn-primary" @click="handleBtnAction('modal-save')">
      변경
    </button>
  </template>
</bo-modal>
`,
};

/* ── 로그인 / 회원가입 모달 ──────────────────────────────────────────────────
   modal(=loginModal) / loginForm / regForm 등 reactive 를 ref 로 받아 직접 바인딩.
   doLogin/doRegister/openUserPick 등 인증 액션은 모두 parent emit. ── */
window.AuthLoginModal = {
  name: 'AuthLoginModal',
  inheritAttrs: false,
  props: {
    modal:       { type: Object, required: true },  // loginModal reactive (show/tab)
    loginForm:   { type: Object, required: true },  // loginForm reactive
    regForm:     { type: Object, required: true },  // regForm reactive
    error:       { type: String, default: '' },     // loginError
    authMethods: { type: Array,  default: () => [] },// AUTH_METHODS
    userRoles:   { type: Array,  default: () => [] },// userRoles,
    mode:        { type: String,  default: 'modal' },// 'modal'(세션만료 재인증, 배경 비침) | 'page'(최초 미인증 진입, 전용 화면)
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['do-login', 'do-register', 'do-social', 'open-user-pick', 'close', 'clear-error'],
  setup(props, { emit }) {
    const setTab = (t) => { props.modal.tab = t; emit('clear-error'); };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ AuthLoginModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'modal-login') {
        return emit('do-login');
      } else if (cmd === 'modal-register') {
        return emit('do-register');
      } else if (cmd === 'modal-open-user-pick') {
        return emit('open-user-pick');
      } else if (cmd === 'modal-social') {
        return emit('do-social', param);
      } else if (cmd === 'tab-change') {
        return setTab(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (미사용) */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ AuthLoginModal : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* BoFormArea 컬럼 정의 — 회원가입 폼 */
    const baseRegFormColumns = [
      { key: 'name',      label: '이름',     type: 'text',     required: true, placeholder: '이름' },
      { key: 'phone',     label: '연락처',   type: 'text',     placeholder: '010-0000-0000' },
      { type: 'rowBreak' },
      { key: 'email',     label: '이메일',   type: 'text',     required: true, placeholder: '이메일 입력', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'password',  label: '비밀번호', type: 'password', required: true, placeholder: '비밀번호' },
      { key: 'confirmPw', label: '비밀번호 확인', type: 'password', required: true, placeholder: '재입력' },
      { type: 'rowBreak' },
      { key: 'role',      label: '역할',     type: 'select',   colSpan: 2,
        options: () => (props.userRoles || []).map(c => ({ value: c.codeValue, label: c.codeLabel })) },
    ];

    /* BoFormArea 컬럼 정의 — 로그인 폼 (ID/PWD만, 인증방식은 slot) */
    const baseLoginFormColumns = [
      { key: 'loginId',    label: '로그인 ID', type: 'text',     placeholder: '로그인 ID 입력' },
      { key: 'loginPwd',   label: '비밀번호',  type: 'password', placeholder: '비밀번호 입력' },
      { key: 'authMethod', label: '인증방식',  type: 'slot', name: 'authMethod' },
    ];

    /* page 모드 = 최초 미인증 전용 화면 (불투명 배경 + 배경클릭/닫기 비활성) */
    const cfIsPage = Vue.computed(() => props.mode === 'page');

    return {
      baseRegFormColumns, baseLoginFormColumns,                               // 컬럼 정의
      cfIsPage,                                                              // 전용 화면 여부
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="cfIsPage ? true : !!modal.show" width="420px" box-pad="0" body-pad="0"
  :overlay-bg="cfIsPage ? '#f3f4f6' : 'rgba(18,24,40,0.55)'"
  :close-on-backdrop="!cfIsPage" @close="handleBtnAction('modal-close')">
  <div class="login-modal-box">
    <div class="login-modal-header">
      <div class="login-tabs">
        <span :class="{active: modal.tab==='login'}" @click="handleBtnAction('tab-change', 'login')">
          로그인
        </span>
        <span :class="{active: modal.tab==='register'}" @click="handleBtnAction('tab-change', 'register')">
          회원가입
        </span>
      </div>
      <span v-if="!cfIsPage" class="modal-close" @click="handleBtnAction('modal-close')">
        ✕
      </span>
    </div>
    <!-- 로그인 폼 -->
    <div v-if="modal.tab==='login'">
      <bo-form-area :columns="baseLoginFormColumns" :form="loginForm" :cols="1" :show-actions="false">
        <template #authMethod>
          <div class="auth-methods">
            <label v-for="m in authMethods" :key="m"
              class="auth-method-item" :class="{active: loginForm.authMethod===m}">
              <input type="radio" :value="m" v-model="loginForm.authMethod" style="display:none" />
              {{ m }}
            </label>
          </div>
        </template>
      </bo-form-area>
      <div v-if="error" class="login-error">
        {{ error }}
      </div>
      <button class="btn btn-primary" style="width:100%;margin-top:4px;" @click="handleBtnAction('modal-login')">
        로그인
      </button>
      <!-- 소셜 로그인 (구글 / 카카오 / 네이버) -->
      <div style="display:flex;align-items:center;gap:10px;margin:16px 0 12px;color:#bbb;font-size:0.78rem;">
        <div style="flex:1;height:1px;background:#eee;">
        </div>
        소셜 로그인
        <div style="flex:1;height:1px;background:#eee;">
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button @click="handleBtnAction('modal-social', 'google')"
          style="width:100%;padding:10px;border:1.5px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-size:0.85rem;color:#333;font-weight:600;">
          <span style="font-size:1.05rem;">
            🌐
          </span>
          Google로 로그인
        </button>
        <button @click="handleBtnAction('modal-social', 'kakao')"
          style="width:100%;padding:10px;border:none;border-radius:8px;background:#FEE500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-size:0.85rem;color:#3C1E1E;font-weight:700;">
          <span style="font-size:1.05rem;">
            💬
          </span>
          카카오로 로그인
        </button>
        <button @click="handleBtnAction('modal-social', 'naver')"
          style="width:100%;padding:10px;border:none;border-radius:8px;background:#03C75A;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-size:0.85rem;color:#fff;font-weight:700;">
          <span style="font-size:1.05rem;font-weight:900;">
            N
          </span>
          네이버로 로그인
        </button>
      </div>
      <div style="text-align:center;margin-top:12px;font-size:12px;color:#aaa;">
        <span>
          계정이 없으신가요?
        </span>
        <span style="color:#e8587a;cursor:pointer;margin-left:6px;font-weight:600;" @click="handleBtnAction('tab-change', 'register')">
          회원가입
        </span>
      </div>
      <div style="text-align:center;margin-top:14px;">
        <button @click="handleBtnAction('modal-open-user-pick')" style="background:none;border:none;cursor:pointer;font-size:0.72rem;color:#aaa;text-decoration:underline;padding:0;">
          사용자 선택하여 로그인 (개발)
        </button>
      </div>
    </div>
    <!-- 회원가입 폼 -->
    <div v-if="modal.tab==='register'">
      <bo-form-area :columns="baseRegFormColumns" :form="regForm" :cols="2" :show-actions="false" />
      <div v-if="error" class="login-error">
        {{ error }}
      </div>
      <button class="btn btn-primary" style="width:100%;margin-top:4px;" @click="handleBtnAction('modal-register')">
        가입하기
      </button>
      <div style="text-align:center;margin-top:12px;font-size:12px;color:#aaa;">
        <span>
          이미 계정이 있으신가요?
        </span>
        <span style="color:#e8587a;cursor:pointer;margin-left:6px;font-weight:600;" @click="handleBtnAction('tab-change', 'login')">
          로그인
        </span>
      </div>
    </div>
  </div>
</bo-modal>
`,
};

/* ══════════════════════════════════════════════════════════════════════
   엑셀 업로드 공통 모달 (BoExcelUploadModal)
   ─────────────────────────────────────────────────────────────────────
   탭: ① 업로드  ② 설명
   기능: 샘플 다운로드 / 조건데이타 다운로드 / 파일선택 → 미리보기 → 저장
   ─────────────────────────────────────────────────────────────────────
   props:
     title         — 모달 제목 (예: '사용자 엑셀업로드')
     uiNm          — apiHdr 용 UI 명 (예: '사용자관리')
     keyField      — 키 컬럼 필드명 (예: 'userId'). 키 값 있으면 UPDATE, 없으면 INSERT
     columns       — [{ field, label, required, codeGrp, readOnly, width, desc }]
                     codeGrp 주면 select 로 표시 + 검증, desc 는 설명탭 비고
     sampleUrl     — 샘플 다운로드 엔드포인트 (백엔드. 없으면 클라이언트가 빈 행으로 생성)
     allDataUrl    — 조건데이타 다운로드 엔드포인트 (필수, GET, 검색조건 없이 전체)
     existsCheckUrl— 키 존재체크 배치 엔드포인트 (POST, body: { keys: [] } → { existsMap })
     uploadUrl     — 업로드(upsert) 엔드포인트 (POST, body: { rows: [...] })
   emits: close, saved (업로드 완료 시 부모가 목록 재조회)
   ══════════════════════════════════════════════════════════════════════ */
window.BoExcelUploadModal = {
  name: 'BoExcelUploadModal',
  inheritAttrs: false,
  props: {
    /* 사용법:
     *   <bo-excel-upload-modal v-if="show" default-domain="role"
     *     @close="show=false" @saved="reload" />
     *
     * 모든 메타(URL/title/keyField/columns/codeGrp 등)는 자동:
     *   - URL: config/excelDomains.js 의 baseUrl + 컨벤션 (/excel, /exists-check, /upsert-list)
     *   - title/uiNm/areaNm: 선택된 도메인 라벨
     *   - keyField/columns: 다운로드 파일 3행 헤더에서 자동 추출
     *
     * default-domain 미지정 시 사용자가 모달 안 select 로 직접 선택. */
    defaultDomain: { type: String, default: '' },                          // config 키 (예: 'role', 'user'),
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const { ref, reactive, computed } = Vue;

    /* ##### [01] 초기 변수 정의 #################################################### */

    const tab = ref('upload');               // 'upload' | 'desc'
    const rows = ref([]);                    // 미리보기 행 [{ ...col, _exists, _err }]
    const fileName = ref('');                // 선택된 파일명
    const loading = ref(false);              // 업로드/체크 진행중
    const codesMap = reactive({});           // { codeGrp: [{value,label}] }
    const summary = reactive({ total: 0, insert: 0, update: 0, errors: 0 });

    /* 다운로드 시 함께 전달할 검색조건 — 모달 공통 영역에 노출.
     *   dateType : 백엔드 BaseRequest 가 받는 기간 컬럼 토큰 (기본 reg_date)
     *   useYn    : USE_YN 코드값 (ACTIVE/INACTIVE/Y/N 등). 도메인별로 매핑되는 컬럼이 다르므로
     *              상태/사용여부 어느 쪽이든 매핑되도록 status 와 useYn 양쪽으로 전송.
     * 도메인이 받지 않는 필드는 Spring @ModelAttribute 가 자동으로 무시한다. */
    const _today = new Date();
    const _thisYear = _today.getFullYear();
    const searchParam = reactive({
      dateType:  'reg_date',
      dateStart: `${_thisYear - 3}-01-01`,
      dateEnd:   `${_thisYear}-12-31`,
      useYn:     '',
    });
    const useYnOptions = ref([]);    // [{value,label}] — USE_YN 코드 그룹

    /* 원본 파일 보관 — [엑셀업로드] 시 multipart 로 그대로 전송하기 위함 */
    const selectedFile = ref(null);
    /** 파일에서 자동 추출되는 메타 정보 (3행 헤더 파싱 결과) */
    const detectedColumns = ref([]);     // [{ field, label, isKey, codeGrp }]
    const detectedKeyField = ref('');    // (key) 마커가 붙은 필드명
    const detectedTableLabel = ref('');  // Row 1 의 테이블 라벨

    /** 백엔드에서 받아온 도메인 메타 (도메인 변경 시 자동 fetch)
     *  { tableLabel, keyField, columns: [{fieldName, label, codeGrp, isKey, readOnly}, ...] } */
    const domainMeta = ref(null);
    const domainMetaLoading = ref(false);
    const domainMetaCache = new Map(); // domain key → meta 캐시 (모달 세션 동안)

    /** fnLoadDomainMeta — 선택된 도메인의 컬럼 메타를 백엔드에서 가져옴 (캐시 사용) */
    const fnLoadDomainMeta = async () => {
      const key = selectedDomainKey.value;
      if (!key) { domainMeta.value = null; return; }
      if (domainMetaCache.has(key)) {
        domainMeta.value = domainMetaCache.get(key);
        return;
      }
      const url = '/bo/excel/' + key + '/meta';
      domainMetaLoading.value = true;
      try {
        const res = await window.boApi.get(url, window.coUtil.cofApiHdr(cfUiNm.value, '도메인메타조회'));
        const meta = res.data?.data || null;
        domainMetaCache.set(key, meta);
        domainMeta.value = meta;
        /* 백엔드 메타가 들어왔으니 codeGrp 컬럼 코드도 미리 로드 */
        if (meta && Array.isArray(meta.columns)) {
          const store = window.sfGetBoCodeStore?.();
          if (store) {
            meta.columns.forEach(c => {
              if (c.codeGrp && !codesMap[c.codeGrp]) {
                const list = store.sgGetGrpCodes?.(c.codeGrp) || [];
                codesMap[c.codeGrp] = list.map(x => ({
                  value: x.codeValue ?? x.codeVal,
                  label: x.codeLabel ?? x.codeNm
                }));
              }
            });
          }
        }
      } catch (err) {
        console.warn('[BoExcelUploadModal] 도메인 메타 조회 실패:', err);
        domainMeta.value = null;
      } finally { domainMetaLoading.value = false; }
    };

    /** 업로드 점검 결과 — [업로드 점검하기] 클릭 후 채워짐.
     *  { ok, summary, items: [{level, label, detail, count?}], ranAt } */
    const inspect = reactive({ ran: false, ok: true, items: [], ranAt: '' });

    /* 도메인 select 상태 — defaultDomain prop 으로 초기값 결정. 모달 안에서 전환 가능. */
    const cfDomains = computed(() => window.BO_EXCEL_DOMAINS || []);
    const selectedDomainKey = ref(props.defaultDomain || (cfDomains.value[0]?.key || ''));
    /** 현재 선택된 도메인 메타 (key/label/baseUrl) */
    const cfDomain = computed(() => {
      if (!selectedDomainKey.value) return null;
      return cfDomains.value.find(d => d.key === selectedDomainKey.value) || null;
    });
    /* URL/라벨 자동 도출 — 선택된 도메인 baseUrl 에서 3개 URL + 화면명 컨벤션으로 도출 */
    const cfBaseUrl = computed(() => cfDomain.value?.baseUrl || '');
    const cfAllDataUrl     = computed(() => cfBaseUrl.value ? cfBaseUrl.value + '/excel'        : '');
    const cfExistsCheckUrl = computed(() => cfBaseUrl.value ? cfBaseUrl.value + '/exists-check' : '');
    const cfUploadUrl      = computed(() => cfBaseUrl.value ? cfBaseUrl.value + '/upsert-list'  : '');
    /* 라벨 — 도메인 라벨 > 파일에서 추출한 tableLabel > 기본값 */
    const cfLabel  = computed(() => cfDomain.value?.label || detectedTableLabel.value || '');
    const cfUiNm   = computed(() => cfLabel.value || '엑셀업로드');
    const cfAreaNm = computed(() => cfLabel.value || '데이터');
    const cfTitle  = computed(() => cfLabel.value ? cfLabel.value + ' 엑셀 업로드' : '엑셀 업로드');
    /* boApp 직접 호출 */
    const fnShowToast   = (msg, type, dur) => (window.boApp?.showToast   || (() => {}))(msg, type, dur);
    const fnShowConfirm = (t, m)           => (window.boApp?.showConfirm || (() => Promise.resolve(true)))(t, m);

    /* 컬럼/키 computed — 파일 3행 헤더의 (key), (gcd:XXX) 마커에서 자동 추출 */
    const cfCols = computed(() => detectedColumns.value);
    const cfKeyField = computed(() => detectedKeyField.value);
    const cfHasRows = computed(() => rows.value.length > 0);
    const cfValidRows = computed(() => rows.value.filter(r => !r._err));

    /** cfDescCols — [설명] 탭 전용 컬럼 목록.
     *   우선순위: 1) 파일에서 인식된 cfCols (파일 첨부된 경우)
     *             2) 백엔드 domainMeta.columns (파일 미첨부 시 도메인 선택만으로도 표시)
     *   양쪽 키 명을 {field, label, codeGrp, isKey, required, desc} 로 정규화. */
    const cfDescCols = computed(() => {
      if (cfCols.value.length) return cfCols.value;
      const meta = domainMeta.value;
      if (!meta || !Array.isArray(meta.columns)) return [];
      return meta.columns.map(c => ({
        field:    c.fieldName || c.field,
        label:    c.label || c.fieldName || c.field,
        codeGrp:  c.codeGrp || '',
        isKey:    !!c.isKey || (meta.keyField && (c.fieldName || c.field) === meta.keyField),
        required: !!c.required,
        readOnly: !!c.readOnly,
        desc:     c.desc || c.remark || '',
      }));
    });
    /** cfDescKeyField — [설명] 탭에서 사용할 키 필드명 (파일 우선, 없으면 도메인 메타). */
    const cfDescKeyField = computed(() => cfKeyField.value || domainMeta.value?.keyField || '');

    /* fnRecalcSummary — 요약 재계산 */
    const fnRecalcSummary = () => {
      summary.total = rows.value.length;
      summary.insert = rows.value.filter(r => !r._err && !r._exists).length;
      summary.update = rows.value.filter(r => !r._err && r._exists).length;
      summary.errors = rows.value.filter(r => r._err).length;
    };

    /* fnLoadCodes — codeGrp 가 지정된 컬럼들의 코드 목록 로드.
     *   빈 배열은 캐시하지 않음 (codeStore 가 아직 준비 안 된 경우 다음 호출 시 재시도).
     *   파일 인식 컬럼(cfCols) + 도메인 메타 컬럼(domainMeta.columns) 양쪽 모두 대상. */
    const fnLoadCodes = () => {
      const store = window.sfGetBoCodeStore?.();
      if (!store) return;
      const sources = [];
      cfCols.value.forEach(c => sources.push({ codeGrp: c.codeGrp }));
      (domainMeta.value?.columns || []).forEach(c => sources.push({ codeGrp: c.codeGrp }));
      const seen = new Set();
      sources.forEach(c => {
        if (!c.codeGrp || seen.has(c.codeGrp)) return;
        seen.add(c.codeGrp);
        if (codesMap[c.codeGrp] && codesMap[c.codeGrp].length) return; // 정상 로드된 경우만 캐시 유지
        const list = store.sgGetGrpCodes?.(c.codeGrp) || [];
        if (!list.length) return;                                      // 빈 결과는 캐시 안 함 → 재시도 가능
        codesMap[c.codeGrp] = list.map(x => ({ value: x.codeValue ?? x.codeVal, label: x.codeLabel ?? x.codeNm }));
      });
    };

    /* fnLoadSearchCodes — 검색조건 select 용 코드 로드 (USE_YN) */
    const fnLoadSearchCodes = () => {
      const store = window.sfGetBoCodeStore?.();
      if (!store || useYnOptions.value.length) return;
      const list = store.sgGetGrpCodes?.('USE_YN') || [];
      useYnOptions.value = list.map(x => ({ value: x.codeValue ?? x.codeVal, label: x.codeLabel ?? x.codeNm }));
    };
    fnLoadSearchCodes();

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼/액션 dispatch (cmd: '{영역}-{기능}'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = async (cmd, param = {}) => {
      console.log(' ■■ BoExcelUploadModal : handleBtnAction -> ', cmd, param);
      // 탭 전환 (업로드 / 설명) — 설명 탭 진입 시 도메인 메타/코드 미리 로드
      if (cmd === 'tab-change') {
        tab.value = param;
        if (param === 'desc') {
          if (!domainMeta.value) await fnLoadDomainMeta();
          fnLoadCodes();
        }
        return;
      // 샘플 csv 다운로드
      } else if (cmd === 'download-sample') {
        return onDownloadSample();
      // 전체 데이터 다운로드 (백엔드 chunk streaming xlsx)
      } else if (cmd === 'download-all') {
        return onDownloadAll();
      // 파일 선택 다이얼로그 열기
      } else if (cmd === 'choose-file') {
        document.getElementById('__bo_excel_upload_file__')?.click();
        return;
      // 미리보기 초기화
      } else if (cmd === 'clear-rows') {
        rows.value = []; fileName.value = '';
        fnRecalcSummary(); fnResetInspect();
        return;
      // 미리보기 한 행 제거
      } else if (cmd === 'remove-row') {
        rows.value.splice(param, 1); fnRecalcSummary();
        return;
      // 검증 정보 지우기 — 점검 결과 패널 닫기 + 행별 _err 도 함께 초기화
      } else if (cmd === 'clear-inspect') {
        fnResetInspect();
        rows.value.forEach(r => { r._err = ''; });
        fnRecalcSummary();
        return;
      // UI 점검 — 클라이언트 데이터만으로 키중복/필수/코드값 검증 (서버 미호출)
      } else if (cmd === 'ui-inspect') {
        return fnInspectClient();
      // 업로드 점검 — 도메인 메타 호환성 + DB 존재체크 (서버 호출)
      } else if (cmd === 'inspect') {
        return fnInspect();
      // 그리드 다운로드 — 현재 미리보기 그리드의 행을 xlsx 로 저장 (SheetJS)
      } else if (cmd === 'grid-download') {
        return onGridDownload();
      // 엑셀업로드 — 원본 파일을 multipart 로 백엔드에 전송 (백엔드가 직접 파싱+upsert)
      } else if (cmd === 'excel-upload') {
        return onExcelUpload();
      // 그리드업로드 — 미리보기 그리드의 행(JSON)을 upsert (기존 save 동작)
      } else if (cmd === 'grid-upload' || cmd === 'save') {
        return onSave();
      // 닫기
      } else if (cmd === 'close') {
        emit('close'); return;
        if (props.onCallback) props.onCallback(props.modalName, null, null);
      } else {
        console.warn('[BoExcelUploadModal:handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — select/드롭다운/그리드 선택 dispatch */
    const handleSelectAction = async (cmd, param = {}) => {
      console.log(' ■■ BoExcelUploadModal : handleSelectAction -> ', cmd, param);
      // 대상 도메인 변경 (상단 select)
      if (cmd === 'domain-change') {
        selectedDomainKey.value = param;
        /* 도메인이 바뀌면 해당 도메인의 메타/코드를 다시 로드 — 설명 탭이 즉시 갱신됨 */
        domainMeta.value = null;
        await fnLoadDomainMeta();
        fnLoadCodes();
        return;
      } else {
        console.warn('[BoExcelUploadModal:handleSelectAction] unknown cmd:', cmd);
      }
    };

    /** 점검 결과 초기화 — 파일 변경/초기화 시 */
    const fnResetInspect = () => {
      inspect.ran = false; inspect.ok = true; inspect.items = []; inspect.ranAt = '';
    };

    /**
     * fnInspect — [업로드점검]: 백엔드 testRun 호출로 실제 upsert 흐름을 수행하되 DB 미반영.
     *   - POST {baseUrl}/upsert-list  body: { rows, testRun: true }
     *   - 응답 { inserted, updated, errors: [{rowIndex, message}], testRun: true }
     *   - 응답의 errors 를 행별 _err 에 매핑 → 그리드 [오류] 뱃지/_row_status=E 즉시 반영
     *   - 클라이언트 사전 검증은 모두 제거 (서버가 모두 검증).
     */
    const fnInspect = async () => {
      fnResetInspect();
      const items = [];
      const push = (level, label, detail) => items.push({ level, label, detail });

      if (!cfHasRows.value) {
        push('error', '데이터 없음', '미리보기 그리드에 행이 없습니다.');
        Object.assign(inspect, { ran: true, ok: false, items, ranAt: new Date().toLocaleTimeString() });
        return;
      }
      if (!cfUploadUrl.value) {
        push('error', '대상 도메인 미선택', '상단 [대상] select 에서 도메인을 선택하세요.');
        Object.assign(inspect, { ran: true, ok: false, items, ranAt: new Date().toLocaleTimeString() });
        return;
      }

      /* 행별 _err 초기화 — 서버 응답으로 다시 채움 */
      rows.value.forEach(r => { r._err = ''; });

      push('info', '점검 모드', '서버 testRun (DB 미반영, 행마다 검증)');
      push('info', '대상 도메인', `${cfDomain.value?.label || ''} (${cfBaseUrl.value})`);

      loading.value = true;
      let res;
      try {
        /* upsert-list 에 보낼 body 는 onSave 와 동일 형태 + testRun:true */
        const body = {
          testRun: true,
          rows: rows.value.map(r => {
            const o = {};
            cfCols.value.forEach(c => { const k = c.field || c.fieldName; o[k] = r[k]; });
            o._row_status = r._rowStatus || 'I';
            return o;
          }),
        };
        res = await window.boApi.post(cfUploadUrl.value, body,
          window.coUtil.cofApiHdr(cfUiNm.value, '업로드점검'));
      } catch (err) {
        const msg = err.response?.data?.message || err.message || '서버 점검 호출 실패';
        push('error', '서버 호출 실패', msg);
        Object.assign(inspect, { ran: true, ok: false, items, ranAt: new Date().toLocaleTimeString() });
        loading.value = false;
        return;
      }
      loading.value = false;

      const data = res.data?.data || {};
      const errors = Array.isArray(data.errors) ? data.errors : [];
      const inserted = data.inserted ?? 0;
      const updated  = data.updated  ?? 0;
      const total    = rows.value.length;

      /* 행별 _err 매핑 — rowIndex 는 1-base (서버 규약) */
      errors.forEach(e => {
        const idx = (e.rowIndex || 0) - 1;
        if (idx >= 0 && idx < rows.value.length) {
          const prev = rows.value[idx]._err;
          rows.value[idx]._err = (prev ? prev + ' / ' : '') + (e.message || '오류');
        }
      });
      fnRecalcSummary();

      /* 점검 결과 패널 — 요약 */
      push('ok', '행수', `${total.toLocaleString()}건 / 상한 ${window.coUtil.EXCEL_UPLOAD_MAX_ROWS.toLocaleString()}건`);
      if (errors.length === 0) {
        push('ok', '검증 통과', `정상 ${total}건 (예상 — 신규 ${inserted} / 수정 ${updated})`);
      } else {
        push('error', '오류 행', `${errors.length}건 — 그리드의 오류 행에서 메시지를 확인하세요.`);
        const sample = errors.slice(0, 3).map(e => `${e.rowIndex}행: ${e.message}`).join(' / ');
        push('info', '오류 샘플', sample + (errors.length > 3 ? ' …' : ''));
        push('ok', '정상 행', `${total - errors.length}건 (예상 — 신규 ${inserted} / 수정 ${updated})`);
      }
      push('info', 'DB 반영 여부', '미반영 (testRun) — 검증만 수행');

      const hasError = items.some(i => i.level === 'error');
      Object.assign(inspect, {
        ran: true,
        ok: !hasError,
        items,
        ranAt: new Date().toLocaleTimeString(),
      });
    };

    /**
     * fnInspectClient — UI 점검 (클라이언트 단독). 서버 호출 없이 그리드 행만 검증.
     *   1. 행수 상한
     *   2. 키 컬럼 필수 / 중복
     *   3. codeGrp 컬럼의 코드값 유효성
     *   각 행의 _err 도 갱신 → 미리보기 그리드의 [오류] 뱃지가 즉시 반영됨.
     */
    const fnInspectClient = () => {
      fnResetInspect();
      const items = [];
      const push = (level, label, detail) => items.push({ level, label, detail });

      if (!cfHasRows.value) {
        push('error', '데이터 없음', '미리보기 그리드에 행이 없습니다.');
        Object.assign(inspect, { ran: true, ok: false, items, ranAt: new Date().toLocaleTimeString() });
        return;
      }
      const cols = cfCols.value;
      const kf = cfKeyField.value;
      push('info', '점검 모드', 'UI 점검 (클라이언트 단독 검증)');
      push('ok', '컬럼 인식', `${cols.length}개 컬럼`);

      /* 1. 행수 상한 */
      const total = rows.value.length;
      const limit = window.coUtil.EXCEL_UPLOAD_MAX_ROWS;
      if (total > limit) {
        push('error', '행수 상한 초과', `${total.toLocaleString()}건 > 상한 ${limit.toLocaleString()}건`);
      } else {
        push('ok', '행수', `${total.toLocaleString()}건 / 상한 ${limit.toLocaleString()}건`);
      }

      /* 행별 _err 초기화 */
      rows.value.forEach(r => { r._err = ''; });

      /* 2. 키 중복 (파일 내) */
      if (kf) {
        const seen = new Map();
        const dupes = [];
        rows.value.forEach((r, idx) => {
          const v = r[kf];
          if (v == null || v === '') return;
          if (seen.has(v)) {
            dupes.push({ key: v, first: seen.get(v) + 1, second: idx + 1 });
            r._err = (r._err ? r._err + ' / ' : '') + `키중복(${v})`;
          } else seen.set(v, idx);
        });
        if (dupes.length) {
          const sample = dupes.slice(0, 3).map(d => `${d.key}(${d.first}↔${d.second})`).join(', ');
          push('error', '키 중복', `${dupes.length}건 — ${sample}${dupes.length > 3 ? ' ...' : ''}`);
        } else {
          push('ok', '키 중복 없음', `${kf} 값 모두 유일`);
        }
      } else {
        push('warn', '키 필드 미인식', '키 컬럼이 없어 중복 검사 생략');
      }

      /* 3. codeGrp 코드값 유효성 */
      const codeCols = cols.filter(c => c.codeGrp);
      if (codeCols.length) {
        let totalBad = 0;
        const samples = [];
        for (const c of codeCols) {
          const opts = codesMap[c.codeGrp] || [];
          if (opts.length === 0) { samples.push(`${c.label}: 코드그룹(${c.codeGrp}) 로드 실패`); continue; }
          const validSet = new Set(opts.map(o => String(o.value)));
          let bad = 0;
          rows.value.forEach((r, idx) => {
            const v = r[c.field];
            if (v == null || v === '') return;
            if (!validSet.has(String(v))) {
              bad++; totalBad++;
              r._err = (r._err ? r._err + ' / ' : '') + `${c.label}:${v}`;
            }
          });
          if (bad) samples.push(`${c.label}(${c.codeGrp}): ${bad}건`);
        }
        if (totalBad) push('error', '코드값 오류', samples.join(' / '));
        else push('ok', '코드값 검증', `${codeCols.length}개 코드 컬럼 모두 유효`);
      }

      fnRecalcSummary();
      const hasError = items.some(i => i.level === 'error');
      Object.assign(inspect, { ran: true, ok: !hasError, items, ranAt: new Date().toLocaleTimeString() });
    };

    /* ##### [03] 내장 사용 함수 (다운로드 / 업로드 / 점검 핸들러) ##################### */

    /* onDownloadSample — 빈 헤더 템플릿 csv 생성 (클라이언트 사이드, 파일에서 메타 추출 후 사용 가능) */
    const onDownloadSample = () => {
      if (!cfCols.value.length) {
        fnShowToast('먼저 [조건데이타 다운로드] 받은 파일을 한 번 선택하면 컬럼 정보가 인식됩니다.', 'info');
        return;
      }
      const kf = cfKeyField.value;
      const headers = cfCols.value.map(c => c.label + ((c.field || c.fieldName) === kf ? '[키]' : ''));
      const rows1 = [headers];
      window.coUtil.cofExportCsv(rows1, headers.map((h, i) => ({ label: h, key: i })), cfAreaNm.value + '_샘플.csv');
    };

    /* onDownloadAll — 검색조건(등록기간/사용여부) 적용해서 다운로드.
     *   - 빈 값은 제외하여 백엔드 ModelAttribute 가 받지 않는 필드의 false-match 방지.
     *   - useYn 은 도메인에 따라 status/useYn 두 가지 매핑이 있으므로 동시에 전달. */
    const onDownloadAll = async () => {
      if (!cfAllDataUrl.value) { fnShowToast('대상 도메인을 먼저 선택하세요.', 'error'); return; }
      const params = {};
      if (searchParam.dateType)  params.dateType  = searchParam.dateType;
      if (searchParam.dateStart) params.dateStart = searchParam.dateStart;
      if (searchParam.dateEnd)   params.dateEnd   = searchParam.dateEnd;
      if (searchParam.useYn)     { params.useYn = searchParam.useYn; params.status = searchParam.useYn; }
      loading.value = true;
      try {
        await window.coUtil.cofDownloadExcel(cfAllDataUrl.value, params, cfAreaNm.value + '_전체', cfUiNm.value, '전체다운로드');
      } catch (err) {
        fnShowToast(err.response?.data?.message || err.message || '전체 다운로드 실패', 'error', 0);
      } finally { loading.value = false; }
    };

    /**
     * onGridDownload — 현재 미리보기 그리드의 행을 xlsx 로 저장 (SheetJS).
     *   - Row 1: 테이블 라벨
     *   - Row 2: 한글 라벨 (key 표시 포함)
     *   - Row 3: 필드명 ((key), (gcd:XXX) 마커 포함) ← 재업로드 시 메타 자동 인식
     *   - Row 4~: 데이터
     */
    const onGridDownload = () => {
      if (!cfHasRows.value) { fnShowToast('다운로드할 데이타가 없습니다.', 'error'); return; }
      if (typeof window.XLSX === 'undefined') { fnShowToast('xlsx 라이브러리(SheetJS)가 로드되지 않았습니다.', 'error', 0); return; }
      const cols = cfCols.value;
      const kf = cfKeyField.value;
      const aoa = [];
      /* Row 1 — 테이블 라벨 (남는 열은 빈칸) */
      aoa.push([detectedTableLabel.value || cfLabel.value, ...Array(Math.max(cols.length - 1, 0)).fill('')]);
      /* Row 2 — 한글 라벨 */
      aoa.push(cols.map(c => c.label + (c.field === kf ? '(key)' : '') + (c.codeGrp ? `(코드:${c.codeGrp})` : '')));
      /* Row 3 — 필드명 + 마커 */
      aoa.push(cols.map(c => c.field + (c.field === kf ? '(key)' : '') + (c.codeGrp ? `(gcd:${c.codeGrp})` : '')));
      /* Row 4+ — 데이터 */
      rows.value.forEach(r => {
        aoa.push(cols.map(c => r[c.field] != null ? r[c.field] : ''));
      });
      const ws = window.XLSX.utils.aoa_to_sheet(aoa);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, cfAreaNm.value.substring(0, 31) || 'Sheet1');
      const fname = window.coUtil.cofBuildExportFilename(cfAreaNm.value + '_그리드.xlsx');
      window.XLSX.writeFile(wb, fname);
    };

    /**
     * onExcelUpload — 원본 파일을 multipart 로 백엔드에 그대로 전송.
     *   백엔드가 직접 파싱 + upsert (대용량/서버측 처리). 엔드포인트: {baseUrl}/upsert-file
     *   엔드포인트 미구현이면 자동으로 그리드업로드(onSave)로 fallback.
     */
    const onExcelUpload = async () => {
      if (!selectedFile.value) { fnShowToast('업로드할 파일이 없습니다. [파일 선택] 하세요.', 'error'); return; }
      if (!cfBaseUrl.value) { fnShowToast('대상 도메인을 먼저 선택하세요.', 'error'); return; }
      const ok = await fnShowConfirm('엑셀업로드',
        `원본 파일 [${selectedFile.value.name}]을 그대로 서버에 업로드합니다.\n` +
        `(서버에서 직접 파싱 후 upsert. 그리드 수정사항은 반영되지 않습니다.)`);
      if (!ok) return;
      const url = cfBaseUrl.value + '/upsert-file';
      const fd = new FormData();
      fd.append('file', selectedFile.value);
      loading.value = true;
      try {
        const res = await window.boApi.post(url, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          ...window.coUtil.cofApiHdr(cfUiNm.value, '엑셀업로드'),
        });
        const data = res.data?.data || {};
        fnShowToast(`엑셀업로드 완료 - 신규 ${data.inserted ?? '?'} / 수정 ${data.updated ?? '?'}`, 'success');
        emit('saved', data); emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, data);
      } catch (err) {
        const status = err.response?.status;
        if (status === 404 || status === 405) {
          fnShowToast('서버에 [엑셀업로드] 엔드포인트가 없어 그리드업로드로 진행합니다.', 'info');
          loading.value = false;
          return onSave();
        }
        fnShowToast(err.response?.data?.message || err.message || '엑셀업로드 실패', 'error', 0);
      } finally { loading.value = false; }
    };

    /* onFileChange — 파일 선택 → 파싱 → 존재체크 → 미리보기 */
    const onFileChange = async (ev) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      selectedFile.value = file;
      fileName.value = file.name;
      ev.target.value = '';
      fnResetInspect();
      loading.value = true;
      try {
        const parsed = await fnParseExcelOrCsv(file);
        if (parsed.length === 0) {
          fnShowToast('파일에 데이타가 없습니다.', 'error');
          rows.value = []; fnRecalcSummary(); return;
        }
        if (parsed.length > window.coUtil.EXCEL_UPLOAD_MAX_ROWS) {
          fnShowToast(`업로드 행수가 상한(${window.coUtil.EXCEL_UPLOAD_MAX_ROWS.toLocaleString()})을 초과합니다. 현재 ${parsed.length.toLocaleString()}건.`, 'error', 0);
          return;
        }
        /* 컬럼 매핑 + 검증 */
        const mapped = parsed.map(p => fnMapAndValidate(p));
        rows.value = mapped;
        fnRecalcSummary();
        /* 키 존재체크 (배치 API 1회) */
        if (cfExistsCheckUrl.value) await fnCheckExists();
        fnRecalcSummary();
      } catch (err) {
        console.error('[BoExcelUploadModal:onFileChange]', err);
        fnShowToast(err.message || '파일 파싱 실패', 'error', 0);
      } finally { loading.value = false; }
    };

    /* fnParseExcelOrCsv — File 객체에서 행 배열 추출.
     *
     *  메타 인식 파일(3행 헤더) 자동 감지:
     *    Row 1: tableLabel + comment (병합)
     *    Row 2: 한글 라벨 (key 면 "이름(key)")
     *    Row 3: 필드명 (key 면 "fieldName(key)")  ← 이 행을 진짜 헤더로 사용
     *    Row 4~: 데이터
     *
     *  레거시 1행 헤더 (한글명만) 도 fallback 으로 지원.
     */
    const fnParseExcelOrCsv = async (file) => {
      const name = (file.name || '').toLowerCase();
      if (name.endsWith('.csv') || name.endsWith('.txt')) {
        const text = await file.text();
        return fnParseCsvWithMetaDetect(text);
      }
      if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        if (typeof window.XLSX === 'undefined') {
          throw new Error('xlsx 파서(SheetJS)가 로드되지 않았습니다. 페이지를 새로고침 후 다시 시도해 주세요.');
        }
        const buf = await file.arrayBuffer();
        const wb = window.XLSX.read(buf, { type: 'array' });
        const sheetName = wb.SheetNames[0];
        if (!sheetName) throw new Error('엑셀 파일에 시트가 없습니다.');
        const csvText = window.XLSX.utils.sheet_to_csv(wb.Sheets[sheetName], { blankrows: false });
        return fnParseCsvWithMetaDetect(csvText);
      }
      throw new Error('지원하지 않는 파일 형식입니다. (.csv / .xlsx / .xls 만 지원)');
    };

    /** 3행 헤더 메타 자동인식 csv 파서.
     *  - 첫 행의 첫 셀이 "ID(key)" 패턴이거나, 모든 셀이 camelCase 필드명이면 메타 파일로 인식
     *  - 메타 파일: Row 3 의 필드명을 헤더로 사용 + Row 1/2 를 detectedTableLabel/detectedColumns 로 저장
     *  - 일반 csv: Row 1 을 헤더로 사용 (기존 동작) */
    const fnParseCsvWithMetaDetect = (text) => {
      /* coUtil 의 raw 토큰 파서 호출 — 행/셀 2차원 배열 */
      const allRows = fnParseCsvRaw(text);
      if (allRows.length === 0) return [];

      /* 메타 파일 감지 — Row 2 또는 Row 3 의 셀에 (key) 마커가 있고
       * Row 3 의 셀들이 camelCase 필드명처럼 보이면 메타 파일로 판정 */
      const looksLikeMeta = allRows.length >= 4 && fnIsMetaHeader(allRows);

      if (looksLikeMeta) {
        const row1 = allRows[0];                  // 테이블 라벨 + 코멘트 (첫 셀에)
        const row2 = allRows[1];                  // 한글 라벨
        const row3 = allRows[2];                  // 필드명 — 진짜 헤더
        detectedTableLabel.value = (row1[0] || '').trim();

        /* 컬럼 자동 구성 — (key), 공통코드 그룹 마커 인식.
         *   Row 3 예시: "userId(key)", "userStatusCd(gcd:USER_STATUS)", "roleId(key)(gcd:ROLE_TYPE)"
         *   Row 2 에도 legacy 표기 "(코드: XXX)" 가 있을 수 있어 함께 파싱. */
        const KEY_RE      = /\(\s*key\s*\)/i;
        /* 한글 "코드" / 영문 "code" / 축약 "gcd" 모두 허용. 콜론 뒤 공백/추가설명도 허용 */
        const CODE_GRP_RE = /\(\s*(?:코드|code|gcd)\s*[:：]\s*([A-Za-z][A-Za-z0-9_]*)\b[^)]*\)/i;
        const cols = [];
        let keyFieldFound = '';
        row3.forEach((cell, idx) => {
          const fieldRaw = (cell || '').trim();
          if (!fieldRaw) return;
          const isKey = KEY_RE.test(fieldRaw);
          /* codeGrp 는 Row 3 우선 → Row 2 (legacy "(코드: XXX)") 까지 fallback */
          const row2Cell = (row2[idx] || '').trim();
          const grpMatch = fieldRaw.match(CODE_GRP_RE) || row2Cell.match(CODE_GRP_RE);
          const codeGrp = grpMatch ? grpMatch[1].toUpperCase() : '';
          /* 마커 모두 제거하여 순수 필드명 추출 */
          const field = fieldRaw.replace(KEY_RE, '').replace(CODE_GRP_RE, '').trim();
          /* Row 2 라벨에서도 (key)/(gcd:)/(코드:) 마커 제거 → 사람용 한글만 */
          const labelRaw = row2Cell || field;
          const label = labelRaw.replace(KEY_RE, '').replace(CODE_GRP_RE, '').replace(/\s+/g, ' ').trim();
          cols.push({ field, label, isKey, codeGrp });
          if (isKey) keyFieldFound = field;
        });
        detectedColumns.value = cols;
        detectedKeyField.value = keyFieldFound;
        /* 감지된 codeGrp 들의 코드 목록 자동 로드 → 미리보기 select 자동 렌더 */
        fnLoadCodes();

        /* Row 4 ~ 를 데이터로 변환 (필드명 키 기반) */
        const headers = cols.map(c => c.field);
        const dataRows = [];
        for (let i = 3; i < allRows.length; i++) {
          const row = allRows[i];
          if (row.every(v => v === '' || v == null)) continue;
          const obj = {};
          headers.forEach((h, idx) => { obj[h] = row[idx] != null ? row[idx] : ''; });
          dataRows.push(obj);
        }
        return dataRows;
      }

      /* 일반 1행 헤더 csv (legacy) — coUtil.cofParseCsv 와 동일 동작 */
      const headers = allRows[0].map(h => (h || '').trim());
      const out = [];
      for (let r = 1; r < allRows.length; r++) {
        const row = allRows[r];
        if (row.every(v => v === '' || v == null)) continue;
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = row[idx] != null ? row[idx] : ''; });
        out.push(obj);
      }
      return out;
    };

    /** csv 텍스트 → 2차원 raw 배열 (헤더 인식 없이 순수 토큰) */
    const fnParseCsvRaw = (text) => {
      if (!text) return [];
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      const rows = [];
      let cur = []; let field = ''; let inQuote = false;
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuote) {
          if (c === '"') {
            if (text[i + 1] === '"') { field += '"'; i++; }
            else inQuote = false;
          } else field += c;
        } else {
          if (c === '"') inQuote = true;
          else if (c === ',') { cur.push(field); field = ''; }
          else if (c === '\r') {}
          else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; }
          else field += c;
        }
      }
      if (field !== '' || cur.length) { cur.push(field); rows.push(cur); }
      return rows;
    };

    /** 3행 메타 헤더 패턴 감지 — Row 2/3 에 (key) 또는 코드그룹 마커가 있거나
     *  Row 3 셀들이 모두 camelCase 식별자 형태이면 true */
    const fnIsMetaHeader = (allRows) => {
      if (allRows.length < 4) return false;
      const row2 = allRows[1] || [];
      const row3 = allRows[2] || [];
      const MARKER_RE = /\(\s*(?:key|코드|code|gcd)\b/i;
      const hasMarker = row2.some(c => MARKER_RE.test(c || ''))
                     || row3.some(c => MARKER_RE.test(c || ''));
      if (hasMarker) return true;
      /* 마커 없는 경우 Row 3 셀이 모두 식별자 형태인지 검사 */
      const allLookLikeFields = row3.length > 0 && row3.every(c => {
        const t = (c || '').replace(/\(\s*key\s*\)/i, '').replace(/\(\s*(?:코드|code|gcd)\s*[:：][^)]*\)/i, '').trim();
        return t === '' || /^[a-z][a-zA-Z0-9_]*$/.test(t);
      });
      return allLookLikeFields;
    };

    /* fnMapAndValidate — 한 행 검증 + 정규화. _err 에 오류 메시지 누적 */
    /* 파일 첨부 시점에는 값 정규화(trim) 만 수행 — _err 는 비워둠.
     * _rowStatus 기본 'I' (INSERT) · DB 존재체크 후 U 로 자동 전환 가능. 사용자가 직접 변경 가능. */
    const fnMapAndValidate = (raw) => {
      const out = { _err: '', _exists: false, _rowStatus: 'I' };
      cfCols.value.forEach(c => {
        const fieldKey = c.field || c.fieldName;     // 자동인식/명시정의 둘 다 지원
        let v = raw[fieldKey] ?? raw[c.label] ?? '';
        if (typeof v === 'string') v = v.trim();
        out[fieldKey] = v;
      });
      return out;
    };

    /* fnCheckExists — 키 값 배치로 보내서 존재 여부 매핑 */
    const fnCheckExists = async () => {
      const kf = cfKeyField.value;
      if (!kf || !cfExistsCheckUrl.value) return;
      const keys = rows.value.map(r => r[kf]).filter(v => v != null && v !== '');
      if (!keys.length) return;
      try {
        const res = await window.boApi.post(cfExistsCheckUrl.value, { keys }, window.coUtil.cofApiHdr(cfUiNm.value, '키존재체크'));
        const existsMap = res.data?.data?.existsMap || res.data?.existsMap || {};
        /* 사용자가 직접 D/M 등으로 바꿔놓은 행은 유지. I→U 자동 전환만 수행 (반대 방향도). */
        rows.value.forEach(r => {
          r._exists = !!existsMap[r[kf]];
          if (r._rowStatus === 'I' && r._exists) r._rowStatus = 'U';
          else if (r._rowStatus === 'U' && !r._exists) r._rowStatus = 'I';
        });
      } catch (err) {
        console.warn('[BoExcelUploadModal:fnCheckExists]', err);
      }
    };

    /* onSave — 유효 행만 upload */
    const onSave = async () => {
      if (!cfHasRows.value) { fnShowToast('업로드할 데이타가 없습니다.', 'error'); return; }
      if (!cfUploadUrl.value) { fnShowToast('대상 도메인을 먼저 선택하세요.', 'error'); return; }
      if (summary.errors > 0) {
        const ok = await fnShowConfirm('업로드', `오류 ${summary.errors}건은 제외하고 ${summary.total - summary.errors}건만 저장합니다. 계속할까요?`);
        if (!ok) return;
      } else {
        const ok = await fnShowConfirm('업로드', `${summary.total}건 (신규 ${summary.insert} / 수정 ${summary.update})을 저장합니다.`);
        if (!ok) return;
      }
      loading.value = true;
      try {
        const body = { rows: cfValidRows.value.map(r => {
          const o = {};
          cfCols.value.forEach(c => { const k = c.field || c.fieldName; o[k] = r[k]; });
          /* _row_status — 사용자가 그리드에서 선택한 값 그대로 전송.
           *   I=INSERT · U=UPDATE · D=DELETE · M=MERGE(키 존재 시 UPDATE, 없으면 INSERT) */
          o._row_status = r._rowStatus || 'I';
          return o;
        }) };
        const res = await window.boApi.post(cfUploadUrl.value, body, window.coUtil.cofApiHdr(cfUiNm.value, '엑셀업로드'));
        const data = res.data?.data || {};
        fnShowToast(`저장 완료 - 신규 ${data.inserted ?? summary.insert} / 수정 ${data.updated ?? summary.update}`, 'success');
        emit('saved', data);
        if (props.onCallback) props.onCallback(props.modalName, null, data);
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
      } catch (err) {
        const msg = err.response?.data?.message || err.message || '업로드 실패';
        fnShowToast(msg, 'error', 0);
      } finally { loading.value = false; }
    };

    /* ##### [04] 라이프사이클 ##################################################### */

    Vue.onMounted(() => {
      fnLoadCodes();
      fnLoadDomainMeta(); // 마운트 시 기본 도메인 메타 로드
    });

    /* 도메인 변경 시 파일/rows 자동 초기화 + 새 도메인 메타 로드 */
    Vue.watch(selectedDomainKey, () => {
      rows.value = [];
      fileName.value = '';
      detectedColumns.value = [];
      detectedKeyField.value = '';
      detectedTableLabel.value = '';
      fnRecalcSummary();
      fnResetInspect();
      fnLoadCodes();
      fnLoadDomainMeta();
    });

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      tab, rows, fileName, loading, codesMap, summary, inspect,            // 상태 / 데이터
      cfCols, cfKeyField, cfHasRows, cfValidRows, cfTitle, cfLabel,        // computed
      cfDescCols, cfDescKeyField, domainMetaLoading,                       // 설명 탭 전용
      cfDomains, cfDomain, selectedDomainKey,                              // 도메인 select
      searchParam, useYnOptions,                                           // 다운로드 검색조건
      selectedFile,                                                        // 원본 파일 보관 (엑셀업로드 버튼 활성 판단)
      handleBtnAction, handleSelectAction, onFileChange,                   // dispatch + 파일 입력 핸들러
    };
  },
  template: `
<bo-modal :title="cfTitle" width="1100px" height="auto" max-height="95vh" body-pad="0" @close="$emit('close')">
if (props.onCallback) props.onCallback(props.modalName, null, null);
  <!-- bodyPad=0 → BoModal body 의 padding 제거 → wrapper 가 body 영역을 정확히 100% 채움.
        wrapper 내부 padding 은 직접 관리. 모달 body 자체 스크롤은 절대 활성화되지 않도록
        모든 자식이 wrapper 안에서 flex 로 줄어들도록 구성. -->
  <div style="display:flex;flex-direction:column;height:100%;min-height:0;padding:20px;box-sizing:border-box;">

  <!-- ═══ 상단 영역 (자연 높이, flex:0 0 auto) ═══ -->
  <div style="flex:0 0 auto;">

  <!-- 도메인 select (lib/config/excelDomains.js 기반) -->
  <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px;padding:10px 12px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;">
    <label style="font-size:12px;color:#475569;font-weight:600;min-width:48px;">대상</label>
    <select :value="selectedDomainKey" @change="e => handleSelectAction('domain-change', e.target.value)"
            class="form-control" style="flex:1;max-width:280px;font-size:13px;" :disabled="cfDomains.length === 0">
      <option v-for="d in cfDomains" :key="d.key" :value="d.key">{{ d.group ? '[' + d.group + '] ' : '' }}{{ d.label }}</option>
    </select>
    <span v-if="cfDomain" style="font-size:11px;color:#94a3b8;font-family:monospace;">
      {{ cfDomain.baseUrl }}
    </span>
  </div>

  <!-- 다운로드 검색조건 (등록기간 + 사용여부). [조건데이타 다운로드] 시 백엔드로 함께 전달 -->
  <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;padding:8px 12px;background:#fffaf3;border:1px solid #fde6c4;border-radius:8px;">
    <label style="font-size:12px;color:#92400e;font-weight:600;min-width:48px;">조건</label>
    <select v-model="searchParam.dateType" class="form-control" style="font-size:12px;width:110px;">
      <option value="reg_date">등록일</option>
      <option value="upd_date">수정일</option>
    </select>
    <input type="date" v-model="searchParam.dateStart" class="form-control" style="font-size:12px;width:140px;" />
    <span style="color:#94a3b8;">~</span>
    <input type="date" v-model="searchParam.dateEnd" class="form-control" style="font-size:12px;width:140px;" />
    <label style="font-size:12px;color:#92400e;font-weight:600;margin-left:8px;">사용여부</label>
    <select v-model="searchParam.useYn" class="form-control" style="font-size:12px;width:120px;">
      <option value="">전체</option>
      <option v-for="o in useYnOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <span style="font-size:11px;color:#94a3b8;margin-left:auto;">※ [조건데이타 다운로드]에만 적용</span>
  </div>

  <!-- 탭 헤더 -->
  <div class="tab-nav" style="margin-bottom:12px;">
    <button class="tab-btn" :class="{active: tab==='upload'}" @click="handleBtnAction('tab-change','upload')">업로드</button>
    <button class="tab-btn" :class="{active: tab==='desc'}"   @click="handleBtnAction('tab-change','desc')">설명</button>
  </div>

  <!-- 업로드 탭의 액션 바 (상단 고정 영역에 포함) -->
  <div v-show="tab==='upload'" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px;">
    <button class="btn btn-secondary btn-sm" :disabled="loading" @click="handleBtnAction('download-sample')">📄 샘플 다운로드</button>
    <button class="btn btn-secondary btn-sm" :disabled="loading" @click="handleBtnAction('download-all')">📥 조건데이타 다운로드</button>
    <span style="flex:1;"></span>
    <input type="file" id="__bo_excel_upload_file__" accept=".csv,.txt,.xlsx,.xls" style="display:none;" @change="onFileChange" />
    <button class="btn btn-blue btn-sm" :disabled="loading" @click="handleBtnAction('choose-file')">📁 파일 선택</button>
    <button v-if="cfHasRows" class="btn btn-secondary btn-sm" :disabled="loading" @click="handleBtnAction('ui-inspect')">🔍 UI점검</button>
    <button v-if="cfHasRows" class="btn btn-secondary btn-sm" :disabled="loading" @click="handleBtnAction('inspect')">📋 업로드점검</button>
    <button v-if="cfHasRows" class="btn btn-secondary btn-sm" :disabled="loading" @click="handleBtnAction('grid-download')">📤 그리드다운로드</button>
    <button v-if="cfHasRows" class="btn btn-secondary btn-sm" @click="handleBtnAction('clear-rows')">초기화</button>
  </div>

  </div>
  <!-- ═══ /상단 영역 ═══ -->

  <!-- ───── 탭1: 업로드 컨텐츠 (남는 영역 flex:1) ───── -->
  <div v-show="tab==='upload'" style="flex:1 1 auto;min-height:0;display:flex;flex-direction:column;">

    <!-- 점검 결과 패널 -->
    <div v-if="inspect.ran"
         :style="(inspect.ok ? 'border:1px solid #86efac;background:#f0fdf4;' : 'border:1px solid #fca5a5;background:#fef2f2;') + 'border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:12px;'">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-weight:700;" :style="inspect.ok ? 'color:#15803d;' : 'color:#b91c1c;'">
          {{ inspect.ok ? '✔ 업로드 가능' : '✖ 업로드 불가 — 오류 항목 확인' }}
        </span>
        <span style="flex:1;"></span>
        <span style="font-size:11px;color:#94a3b8;">점검 {{ inspect.ranAt }}</span>
        <button class="btn btn-secondary btn-xs" @click="handleBtnAction('clear-inspect')" title="검증 정보 지우기">✕ 지우기</button>
      </div>
      <table style="width:100%;font-size:11px;border-collapse:collapse;">
        <colgroup>
          <col style="width:24px;" />
          <col style="width:130px;" />
          <col />
        </colgroup>
        <tbody>
          <tr v-for="(it, i) in inspect.items" :key="i" style="border-top:1px solid rgba(0,0,0,0.05);">
            <td style="text-align:center;padding:3px 4px;">
              <span v-if="it.level==='ok'"   style="color:#16a34a;">●</span>
              <span v-else-if="it.level==='warn'"  style="color:#f59e0b;">▲</span>
              <span v-else-if="it.level==='error'" style="color:#dc2626;">✖</span>
              <span v-else style="color:#64748b;">·</span>
            </td>
            <td style="padding:3px 6px;font-weight:600;color:#334155;">{{ it.label }}</td>
            <td style="padding:3px 6px;color:#475569;">{{ it.detail }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 파일 안내 -->
    <div v-if="fileName" style="font-size:12px;color:#666;margin-bottom:8px;">
      선택: <strong>{{ fileName }}</strong>
      <span style="margin-left:12px;">전체 {{ summary.total }}건</span>
      <span style="margin-left:8px;color:#2563eb;">신규 {{ summary.insert }}</span>
      <span style="margin-left:8px;color:#16a34a;">수정 {{ summary.update }}</span>
      <span v-if="summary.errors" style="margin-left:8px;color:#dc2626;">오류 {{ summary.errors }}</span>
    </div>

    <!-- 미리보기 그리드 — 화면 안에서 가로 스크롤바까지 함께 보이도록 높이 제한.
         max-height: 95vh - 모달 상단/하단/패딩 합산(약 320px) → 화면 안에 가로 스크롤바도 함께 노출. -->
    <div v-if="cfHasRows" style="height:calc(95vh - 320px);min-height:280px;max-height:680px;overflow:auto;border:1px solid #e5e7eb;border-radius:8px;">
      <table class="admin-table" style="font-size:12px;margin:0;">
        <thead style="position:sticky;top:0;background:#f9fafb;z-index:1;">
          <tr>
            <th rowspan="2" style="width:36px;text-align:center;vertical-align:middle;">#</th>
            <th rowspan="2" style="width:60px;text-align:center;vertical-align:middle;">상태</th>
            <th rowspan="2" style="width:74px;text-align:center;vertical-align:middle;background:#fff7ed;color:#9a3412;font-family:Consolas,Menlo,monospace;font-size:11px;">
              _row_status
            </th>
            <th v-for="c in cfCols" :key="'lbl-'+c.field"
                :style="(c.field===cfKeyField ? 'background:#fff3d6;color:#92400e;' : '') + (c.width ? 'width:' + c.width + ';' : '') + 'min-width:130px;text-align:center;'">
              {{ c.label }}
              <span v-if="c.required" style="color:#dc2626;"> *</span>
            </th>
            <th rowspan="2" style="width:40px;"></th>
          </tr>
          <tr>
            <th v-for="c in cfCols" :key="'fld-'+c.field"
                :style="(c.field===cfKeyField ? 'background:#fff3d6;color:#92400e;' : 'background:#f3f4f6;color:#6b7280;') + 'min-width:130px;font-weight:400;font-size:11px;text-align:center;font-family:Consolas,Menlo,monospace;'">
              {{ c.field }}<span v-if="c.field===cfKeyField" style="color:#92400e;">(key)</span><span v-if="c.codeGrp" style="color:#7c3aed;">(gcd:{{ c.codeGrp }})</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, idx) in rows" :key="idx" :style="r._err ? 'background:#fef2f2;' : ''">
            <td style="text-align:center;color:#999;">{{ idx + 1 }}</td>
            <td style="text-align:center;">
              <span v-if="r._err" class="badge" style="background:#fee2e2;color:#dc2626;" :title="r._err">오류</span>
              <span v-else-if="r._exists" class="badge" style="background:#dcfce7;color:#16a34a;">수정</span>
              <span v-else class="badge" style="background:#dbeafe;color:#2563eb;">신규</span>
            </td>
            <td style="padding:2px 4px;"
                :style="r._err ? 'background:#fef2f2;' : (r._rowStatus==='D' ? 'background:#fef2f2;' : (r._rowStatus==='M' ? 'background:#fefce8;' : (r._exists ? 'background:#f0fdf4;' : 'background:#eff6ff;')))">
              <select v-model="r._rowStatus" class="form-control"
                      style="font-size:11px;padding:2px 4px;width:100%;font-family:Consolas,Menlo,monospace;font-weight:600;text-align:center;"
                      :title="'I=INSERT(신규) · U=UPDATE(수정) · D=DELETE(삭제) · M=MERGE(키 있으면 수정, 없으면 신규)'">
                <option value="I">I</option>
                <option value="U">U</option>
                <option value="D">D</option>
                <option value="M">M</option>
              </select>
            </td>
            <td v-for="c in cfCols" :key="c.field"
                :style="(c.field===cfKeyField ? 'background:#fffbeb;font-weight:600;' : '') + 'min-width:130px;'">
              <select v-if="c.codeGrp" v-model="r[c.field]" class="form-control" style="font-size:11px;padding:2px 4px;width:100%;">
                <option value="">선택</option>
                <option v-for="o in (codesMap[c.codeGrp] || [])" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
              <input v-else-if="!c.readOnly" type="text" v-model="r[c.field]" class="form-control" style="font-size:11px;padding:2px 4px;width:100%;" />
              <span v-else>{{ r[c.field] }}</span>
            </td>
            <td style="text-align:center;">
              <button class="btn btn-secondary btn-xs" @click="handleBtnAction('remove-row', idx)">✕</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 안내 (파일 미선택 시) -->
    <div v-else style="padding:40px;text-align:center;color:#999;border:2px dashed #e5e7eb;border-radius:8px;">
      <div style="font-size:14px;margin-bottom:6px;">파일을 선택하면 미리보기가 표시됩니다.</div>
      <div style="font-size:11px;">키 컬럼(노란색)에 값이 있으면 <strong>수정</strong>, 없으면 <strong>신규</strong>로 처리됩니다.</div>
    </div>
  </div>
  <!-- ───── /탭1: 업로드 컨텐츠 ───── -->

  <!-- ───── 탭2: 설명 컨텐츠 (남는 영역 flex:1, 내부 스크롤) ───── -->
  <div v-show="tab==='desc'" style="flex:1 1 auto;min-height:0;display:flex;flex-direction:column;">
    <div style="flex:0 0 auto;display:flex;align-items:center;gap:8px;font-size:12px;color:#666;margin-bottom:8px;">
      <span style="font-weight:600;color:#334155;">{{ cfLabel || '대상 미선택' }}</span>
      <span style="color:#94a3b8;">컬럼 정의 및 코드 설명</span>
      <span v-if="cfDescCols.length" style="margin-left:auto;font-size:11px;color:#94a3b8;">{{ cfDescCols.length }}개 컬럼</span>
    </div>

    <div v-if="!cfDescCols.length" style="flex:0 0 auto;padding:24px;text-align:center;color:#999;border:2px dashed #e5e7eb;border-radius:8px;">
      <div v-if="domainMetaLoading" style="font-size:13px;">메타 정보를 불러오는 중입니다...</div>
      <div v-else style="font-size:13px;">대상 도메인의 컬럼 정보가 없습니다. 상단에서 도메인을 선택해 주세요.</div>
    </div>

    <!-- 컬럼 정의 + 코드 그룹별 값 — 내부에서만 스크롤 -->
    <div v-if="cfDescCols.length" style="flex:1 1 auto;min-height:0;overflow:auto;">
    <table class="admin-table" style="font-size:12px;">
      <thead>
        <tr>
          <th style="width:36px;text-align:center;">#</th>
          <th>필드명</th>
          <th>한글명</th>
          <th style="width:60px;text-align:center;">필수</th>
          <th style="width:80px;text-align:center;">키컬럼</th>
          <th style="width:140px;">코드그룹</th>
          <th style="width:220px;">코드정보</th>
          <th>비고</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(c, idx) in cfDescCols" :key="c.field"
            :style="c.field===cfDescKeyField ? 'background:#fffbeb;' : ''">
          <td style="text-align:center;color:#999;">{{ idx + 1 }}</td>
          <td><code>{{ c.field }}</code></td>
          <td>{{ c.label }}</td>
          <td style="text-align:center;">
            <span v-if="c.required" style="color:#dc2626;">●</span>
          </td>
          <td style="text-align:center;">
            <span v-if="c.field===cfDescKeyField" class="badge" style="background:#fef3c7;color:#92400e;">키</span>
          </td>
          <td>
            <span v-if="c.codeGrp"><code>{{ c.codeGrp }}</code></span>
          </td>
          <td>
            <select v-if="c.codeGrp" class="form-control" style="font-size:11px;padding:2px 4px;width:100%;"
                    :title="(codesMap[c.codeGrp] || []).length + '개 코드 — 표시 전용'">
              <option v-if="!(codesMap[c.codeGrp] || []).length" value="">코드 그룹({{ c.codeGrp }}) 로드 안 됨</option>
              <option v-for="o in (codesMap[c.codeGrp] || [])" :key="o.value" :value="o.value">{{ o.label }} ({{ o.value }})</option>
            </select>
          </td>
          <td>{{ c.desc || '' }}</td>
        </tr>
      </tbody>
    </table>

    <!-- 코드 그룹별 값 목록 -->
    <div v-for="c in cfDescCols.filter(x => x.codeGrp)" :key="'code-' + c.codeGrp" style="margin-top:16px;">
      <div style="font-size:12px;font-weight:600;margin-bottom:6px;">
        📋 {{ c.label }} 코드값 (<code>{{ c.codeGrp }}</code>)
      </div>
      <table class="admin-table" style="font-size:11px;">
        <thead>
          <tr><th style="width:120px;">코드값</th><th>코드명</th></tr>
        </thead>
        <tbody>
          <tr v-for="o in (codesMap[c.codeGrp] || [])" :key="o.value">
            <td><code>{{ o.value }}</code></td>
            <td>{{ o.label }}</td>
          </tr>
          <tr v-if="!(codesMap[c.codeGrp] || []).length">
            <td colspan="2" style="text-align:center;color:#94a3b8;">코드 그룹({{ c.codeGrp }}) 로드 안 됨</td>
          </tr>
        </tbody>
      </table>
    </div>

    </div>
    <!-- /설명 내부 스크롤 영역 -->

  </div>
  <!-- ───── /탭2: 설명 컨텐츠 ───── -->

  </div>
  <!-- /flex column wrapper -->

  <!-- ═══ 하단 고정 영역 — BoModal #footer 슬롯 사용 (모달 박스 하단에 고정, body 스크롤과 분리) ═══ -->
  <template #footer>
    <!-- 업로드 탭: [취소] [엑셀업로드] [그리드업로드] -->
    <template v-if="tab==='upload'">
      <button class="btn btn-secondary" :disabled="loading" @click="handleBtnAction('close')">취소</button>
      <button class="btn btn_excel_upload" :disabled="loading || !selectedFile"
              @click="handleBtnAction('excel-upload')"
              title="원본 파일을 서버에 그대로 전송 — 그리드 수정사항은 반영되지 않음">
        📤 엑셀업로드
      </button>
      <button class="btn"
              :class="(inspect.ran ? !inspect.ok : false) ? 'btn-danger' : 'btn-primary'"
              :disabled="loading || !cfHasRows" @click="handleBtnAction('grid-upload')"
              :title="(inspect.ran ? !inspect.ok : false) ? '점검 결과 오류가 있습니다. 강행 시 일부 행만 저장될 수 있어요.' : '그리드에 표시된 행(편집 후 상태)을 upsert'">
        {{ (inspect.ran ? !inspect.ok : false) ? '⚠ 강행 그리드업로드' : '📋 그리드업로드' }}
      </button>
    </template>

    <!-- 설명 탭: [닫기] -->
    <template v-else-if="tab==='desc'">
      <button class="btn btn-secondary" @click="handleBtnAction('close')">닫기</button>
    </template>
  </template>
  <!-- ═══ /하단 고정 영역 ═══ -->
</bo-modal>
`,
};

/* ═══════════════════════════════════════════════════════════════════
 * BoProdCatePickModal — 좌측 카테고리 트리 + 우측 상품 목록 (페이지) 픽 모달
 *   사용처: PdProdDtl (연관상품/코디상품 추가 등)
 *   props: excludeIds(이미 선택된 prodId 제외), modalName, onCallback
 *   emit / callback: 행 클릭 시 선택된 상품 객체 전달
 * ═══════════════════════════════════════════════════════════════════ */
window.BoProdCatePickModal = {
  name: 'BoProdCatePickModal',
  inheritAttrs: false,
  props: {
    excludeIds: { type: Array,    default: () => [] },                  // 제외할 prodId 목록
    title:      { type: String,   default: '상품 선택' },               // 모달 타이틀
    modalName:  { type: String,   default: '' },                        // 모달 식별자
    onCallback: { type: Function, default: null },                      // 통합 콜백
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { reactive, computed, onMounted, watch } = Vue;
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* ── 상태 ───────────────────────────────────────────── */
    const categories = reactive([]);                          // 전체 카테고리
    const expanded   = reactive(new Set());                   // 트리 펼침
    const uiState    = reactive({ loading: false, catSearchValue: '', selectedCategoryId: null });
    const searchParam = reactive({ searchValue: '' });
    const pager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageNums: [], pageSizes: [5, 10, 20, 30, 50] });
    const prodList = reactive([]);

    /* ── 좌측 카테고리 트리 ─────────────────────────────── */
    const cfTree = computed(() => {
      const k = uiState.catSearchValue.trim().toLowerCase();
      const base = k
        ? categories.filter(c => (c.categoryNm || '').toLowerCase().includes(k))
        : categories.filter(c => c.useYn !== 'N');
      const build = (parentId) =>
        base.filter(c => (c.parentCategoryId || null) === (parentId || null))
          .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
          .map(c => ({ ...c, children: build(c.categoryId) }));
      return { categoryId: null, categoryNm: '전체', children: build(null) };
    });

    /* ── API ────────────────────────────────────────────── */
    const fnLoadCategories = async () => {
      try {
        const res = await boApiSvc.pdCategory.getList({ pageSize: 10000 }, '상품선택', '카테고리조회');
        categories.splice(0, categories.length, ...(res.data?.data || []));
        /* 카테고리 트리 기본 펼침 */
        expanded.clear();
        expanded.add(null);
        categories.forEach(c => expanded.add(c.categoryId));
      } catch (e) { categories.splice(0); }
    };

    const fnBuildPagerNums = () => {
      const c = pager.pageNo, l = pager.pageTotalPage, s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };

    const handleSearchProds = async () => {
      uiState.loading = true;
      prodList.splice(0, prodList.length);
      pager.pageTotalCount = 0; pager.pageTotalPage = 1;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize };
        if (searchParam.searchValue.trim()) params.searchValue = searchParam.searchValue.trim();
        if (uiState.selectedCategoryId != null) params.categoryId = uiState.selectedCategoryId;
        const res = await boApiSvc.pdProd.getPage(params, '상품선택', '상품조회');
        const d = res.data?.data;
        prodList.splice(0, prodList.length, ...(d?.pageList || d?.list || []));
        pager.pageTotalCount = d?.pageTotalCount || 0;
        pager.pageTotalPage = d?.pageTotalPage || 1;
        fnBuildPagerNums();
      } catch (e) { prodList.splice(0); } finally { uiState.loading = false; }
    };

    onMounted(async () => {
      await fnLoadCategories();
      await handleSearchProds();
    });

    /* ── 행 클릭 → 선택 ────────────────────────────────── */
    const onPick = (row) => {
      if ((props.excludeIds || []).includes(row.prodId)) { return; }
      emit('select', row);
      if (props.onCallback) props.onCallback(props.modalName, null, row);
    };

    const onSearch = () => { pager.pageNo = 1; handleSearchProds(); };
    const onReset  = () => {
      searchParam.searchValue = '';
      uiState.selectedCategoryId = null;
      pager.pageNo = 1;
      handleSearchProds();
    };
    const setPage = (n) => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchProds(); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchProds(); };

    /* ── dispatch ───────────────────────────────────────── */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoProdCatePickModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'searchParam-search') {
        return onSearch();
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      } else if (cmd === 'catTree-expandAll') {
        categories.forEach(c => expanded.add(c.categoryId));
        return;
      } else if (cmd === 'catTree-collapseAll') {
        expanded.clear();
        return;
      } else if (cmd === 'catTree-toggle') {
        if (expanded.has(param)) expanded.delete(param); else expanded.add(param);
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoProdCatePickModal : handleSelectAction -> ', cmd, param);
      if (cmd === 'catTree-select') {
        uiState.selectedCategoryId = param;
        pager.pageNo = 1;
        return handleSearchProds();
      } else if (cmd === 'prods-pick') {
        return onPick(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ── 컬럼 정의 ──────────────────────────────────────── */
    const baseSearchColumns = [
      { key: 'searchValue', label: '검색어', type: 'text', placeholder: '상품명 검색' },
    ];

    const prodGridColumns = [
      { key: 'prodId',        label: 'ID',     style: 'width:100px;',
        cellInnerStyle: 'background:#f5f5f5;padding:1px 5px;border-radius:3px;font-size:11px;font-family:monospace;' },
      { key: 'prodNm',        label: '상품명', cellInnerStyle: 'font-weight:600;color:#1a1a2e;' },
      { key: 'categoryNm',    label: '카테고리', cellStyle: 'color:#666;' },
      { key: 'price',         label: '가격',   align: 'right',
        fmt: (v) => v != null ? Number(v).toLocaleString() + '원' : '-' },
      { key: '_act',          label: '선택',   style: 'width:80px;text-align:center;', html: true,
        fmt: (v, row) => (props.excludeIds || []).includes(row.prodId)
          ? `<button class="btn btn-secondary btn-xs" disabled>이미 선택됨</button>`
          : `<button class="btn btn-primary btn-xs" data-act="pick">선택</button>` },
    ];

    return {
      cfSiteNm, categories, expanded, uiState, searchParam, pager, prodList, cfTree,
      baseSearchColumns, prodGridColumns,
      setPage, onSizeChange,
      handleBtnAction, handleSelectAction,
    };
  },
  template: /* html */`
<bo-modal :show="true" width="1100px" max-width="95vw" height="auto" max-height="86vh" box-pad="0" body-pad="0" @close="handleBtnAction('modal-close')">
  <div style="background:#fff;border-radius:14px;width:100%;display:flex;flex-direction:column;overflow:hidden;">
    <!-- 헤더 -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f0f0f0;flex-shrink:0;background:linear-gradient(135deg,#fff0f4 0%,#ffe4ec 50%,#ffd5e1 100%);">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:16px;font-weight:800;color:#1a1a2e;">
          🛍 {{ title }}
        </span>
        <span style="font-size:11px;font-weight:600;color:#2563eb;background:#fff;padding:2px 10px;border-radius:20px;">
          {{ cfSiteNm }}
        </span>
      </div>
      <span style="cursor:pointer;font-size:22px;color:#888;line-height:1;" @click="handleBtnAction('modal-close')">
        ✕
      </span>
    </div>
    <!-- 검색 -->
    <div style="padding:10px 16px;border-bottom:1px solid #f0f0f0;background:#fafafa;flex-shrink:0;">
      <bo-search-area :columns="baseSearchColumns" :param="searchParam" :loading="uiState.loading"
        @search="handleBtnAction('searchParam-search')" @reset="handleBtnAction('searchParam-reset')" />
    </div>
    <!-- 바디 -->
    <div style="display:flex;min-height:0;overflow:hidden;">
      <!-- 좌: 카테고리 트리 -->
      <div style="width:240px;flex-shrink:0;border-right:1px solid #f0f0f0;display:flex;flex-direction:column;background:#fafbfc;">
        <div style="padding:10px 10px 8px;border-bottom:1px solid #ebebeb;">
          <div style="font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px;">
            📁 카테고리
          </div>
          <input v-model="uiState.catSearchValue" placeholder="🔍 카테고리 검색"
            style="width:100%;border:1px solid #e5e7eb;border-radius:6px;padding:5px 8px;font-size:12px;outline:none;box-sizing:border-box;background:#fff;color:#374151;" />
        </div>
        <div style="display:flex;gap:4px;padding:6px 10px;border-bottom:1px solid #ebebeb;">
          <button class="btn btn_expand_all" @click="handleBtnAction('catTree-expandAll')" style="flex:1;font-size:11px;padding:3px 4px;">
            ▼ 전체펼치기
          </button>
          <button class="btn btn_collapse_all" @click="handleBtnAction('catTree-collapseAll')" style="flex:1;font-size:11px;padding:3px 4px;">
            ▶ 전체닫기
          </button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:6px;max-height:560px;">
          <!-- 전체 -->
          <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:2px;"
            :style="uiState.selectedCategoryId===null?'background:#e8587a;color:#fff;':''"
            @click="handleSelectAction('catTree-select', null)">
            <span style="font-size:8px;font-weight:900;flex-shrink:0;"
              :style="{ color: uiState.selectedCategoryId===null?'#fff':'#e8587a' }">●</span>
            <span style="font-size:13px;font-weight:700;flex:1;"
              :style="{ color: uiState.selectedCategoryId===null?'#fff':'#374151' }">전체</span>
          </div>
          <!-- 카테고리 트리 (재귀 노드 단순 평면 표시) -->
          <div v-for="c in cfTree.children" :key="c.categoryId" style="margin-left:8px;">
            <div style="display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:6px;cursor:pointer;"
              :style="uiState.selectedCategoryId===c.categoryId?'background:#e8587a;color:#fff;':''"
              @click="handleSelectAction('catTree-select', c.categoryId)">
              <span style="font-size:10px;color:#2563eb;flex-shrink:0;"
                :style="{ color: uiState.selectedCategoryId===c.categoryId?'#fff':'#2563eb' }">●</span>
              <span style="font-size:12px;flex:1;"
                :style="{ color: uiState.selectedCategoryId===c.categoryId?'#fff':'#374151' }">
                {{ c.categoryNm }}
              </span>
            </div>
            <div v-for="c2 in c.children" :key="c2.categoryId" style="margin-left:14px;">
              <div style="display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:6px;cursor:pointer;font-size:11px;"
                :style="uiState.selectedCategoryId===c2.categoryId?'background:#e8587a;color:#fff;':''"
                @click="handleSelectAction('catTree-select', c2.categoryId)">
                <span style="font-size:8px;color:#52c41a;flex-shrink:0;"
                  :style="{ color: uiState.selectedCategoryId===c2.categoryId?'#fff':'#52c41a' }">◦</span>
                <span :style="{ color: uiState.selectedCategoryId===c2.categoryId?'#fff':'#374151' }">
                  {{ c2.categoryNm }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 우: 상품 목록 -->
      <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;background:#fff;">
        <div style="display:flex;align-items:center;padding:8px 14px;border-bottom:1px solid #f0f0f0;flex-shrink:0;background:#fafafa;">
          <span style="margin-left:auto;font-size:12px;color:#9ca3af;">
            상품목록 <b style="color:#e8587a;margin:0 2px;">{{ pager.pageTotalCount }}</b> 건
          </span>
        </div>
        <div style="display:flex;flex-direction:column;">
          <bo-grid :columns="prodGridColumns" :rows="prodList" :pager="pager" row-key="prodId"
            row-clickable
            :empty-text="uiState.loading ? '로딩 중...' : '🔍 검색 결과가 없습니다.'"
            @row-click="row => handleSelectAction('prods-pick', row)"
 />
          <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
        </div>
      </div>
    </div>
  </div>
</bo-modal>
`,
};

/* ── 프로모션 픽커 모달 4종 — 쿠폰/적립금/할인/사은품 ─────────────────────
 * 각 모달이 <bo-modal>을 루트로 직접 포함 → 부모(PdProdDtl)는 v-if로 마운트.
 * bo-modal 자체 teleport(body) 가 오버레이 처리하므로 부모 bo-modal 래퍼 불필요.
 * ─────────────────────────────────────────────────────────────────────────── */

/* ── PmCouponPickModal — 쿠폰 선택 모달 ────────────────────────────────── */
window.PmCouponPickModal = {
  name: 'PmCouponPickModal',
  inheritAttrs: false,
  props: {
    showToast: { type: Function, default: () => {} },
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { reactive, ref, onMounted } = Vue;
    const searchParam = reactive({ searchValue: '' });
    const pager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1 });
    const rows = ref([]);
    const loading = ref(false);
    const selectedRow = ref(null);
    const columns = [
      { key: 'couponId', label: '쿠폰 ID', style: 'width:160px;', cellStyle: 'font-family:monospace;font-size:11px;' },
      { key: 'couponNm', label: '쿠폰명' },
      { key: 'useYn',    label: '사용', style: 'width:60px;', align: 'center',
        badge: r => r.useYn === 'Y' ? 'badge-green' : 'badge-gray',
        fmt: v => v === 'Y' ? '사용' : '미사용' },
    ];
    const fnLoad = async () => {
      loading.value = true; selectedRow.value = null;
      try {
        const res = await boApiSvc.pmCoupon.getPage({ ...searchParam, pageNo: pager.pageNo, pageSize: pager.pageSize }, '쿠폰피커', '조회');
        const d = res.data?.data || {};
        rows.value = d.pageList || [];
        pager.pageTotalCount = d.pageTotalCount || 0;
        pager.pageTotalPage  = d.pageTotalPage  || 1;
      } catch (err) {
        props.showToast(err.response?.data?.message || '조회 실패', 'error', 0);
      } finally { loading.value = false; }
    };
    const setPage = (n) => { pager.pageNo = n; fnLoad(); };
    const onSizeChange = () => { pager.pageNo = 1; fnLoad(); };
    const onRowClick = (row) => { selectedRow.value = row; };
    const onDblClick = (row) => { emit('select', row); };
    const onSelect = () => { if (selectedRow.value) emit('select', selectedRow.value); };
    const onClose = () => emit('close');
    onMounted(fnLoad);
    return { searchParam, pager, rows, loading, columns, selectedRow, fnLoad, setPage, onSizeChange, onRowClick, onDblClick, onSelect, onClose };
  },
  template: `
<bo-modal :show="true" title="쿠폰 선택" width="600px" @close="onClose">
  <div style="display:flex;gap:8px;margin-bottom:12px;">
    <input class="form-control" v-model="searchParam.searchValue" placeholder="쿠폰명/ID 검색" @keyup.enter="fnLoad" style="flex:1;" />
    <button class="btn btn_search btn-sm" @click="fnLoad">조회</button>
  </div>
  <bo-grid :columns="columns" :rows="rows" :pager="pager" row-key="couponId"
    row-clickable selected-key="couponId" :selected-value="selectedRow ? selectedRow.couponId : null"
    :empty-text="loading ? '로딩 중...' : '검색 결과가 없습니다.'"
    @row-click="onRowClick" @row-dblclick="onDblClick" />
  <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" :page-sizes="[5,10,20,50]" style="margin-top:8px;" />
  <div style="display:flex;justify-content:center;gap:8px;margin-top:12px;">
    <button class="btn btn_select" :disabled="!selectedRow" @click="onSelect">선택</button>
    <button class="btn btn-secondary btn-sm" @click="onClose">닫기</button>
  </div>
</bo-modal>
`,
};

/* ── PmSavePickModal — 적립금 선택 모달 ─────────────────────────────────── */
window.PmSavePickModal = {
  name: 'PmSavePickModal',
  inheritAttrs: false,
  props: {
    showToast: { type: Function, default: () => {} },
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { reactive, ref, onMounted } = Vue;
    const searchParam = reactive({ searchValue: '' });
    const pager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1 });
    const rows = ref([]);
    const loading = ref(false);
    const selectedRow = ref(null);
    const columns = [
      { key: 'saveId', label: '적립금 ID', style: 'width:160px;', cellStyle: 'font-family:monospace;font-size:11px;' },
      { key: 'saveNm', label: '적립금명' },
      { key: 'useYn',  label: '사용', style: 'width:60px;', align: 'center',
        badge: r => r.useYn === 'Y' ? 'badge-green' : 'badge-gray',
        fmt: v => v === 'Y' ? '사용' : '미사용' },
    ];
    const fnLoad = async () => {
      loading.value = true; selectedRow.value = null;
      try {
        const res = await boApiSvc.pmSave.getPage({ ...searchParam, pageNo: pager.pageNo, pageSize: pager.pageSize }, '적립금피커', '조회');
        const d = res.data?.data || {};
        rows.value = d.pageList || [];
        pager.pageTotalCount = d.pageTotalCount || 0;
        pager.pageTotalPage  = d.pageTotalPage  || 1;
      } catch (err) {
        props.showToast(err.response?.data?.message || '조회 실패', 'error', 0);
      } finally { loading.value = false; }
    };
    const setPage = (n) => { pager.pageNo = n; fnLoad(); };
    const onSizeChange = () => { pager.pageNo = 1; fnLoad(); };
    const onRowClick = (row) => { selectedRow.value = row; };
    const onDblClick = (row) => { emit('select', row); };
    const onSelect = () => { if (selectedRow.value) emit('select', selectedRow.value); };
    const onClose = () => emit('close');
    onMounted(fnLoad);
    return { searchParam, pager, rows, loading, columns, selectedRow, fnLoad, setPage, onSizeChange, onRowClick, onDblClick, onSelect, onClose };
  },
  template: `
<bo-modal :show="true" title="적립금 선택" width="600px" @close="onClose">
  <div style="display:flex;gap:8px;margin-bottom:12px;">
    <input class="form-control" v-model="searchParam.searchValue" placeholder="적립금명/ID 검색" @keyup.enter="fnLoad" style="flex:1;" />
    <button class="btn btn_search btn-sm" @click="fnLoad">조회</button>
  </div>
  <bo-grid :columns="columns" :rows="rows" :pager="pager" row-key="saveId"
    row-clickable selected-key="saveId" :selected-value="selectedRow ? selectedRow.saveId : null"
    :empty-text="loading ? '로딩 중...' : '검색 결과가 없습니다.'"
    @row-click="onRowClick" @row-dblclick="onDblClick" />
  <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" :page-sizes="[5,10,20,50]" style="margin-top:8px;" />
  <div style="display:flex;justify-content:center;gap:8px;margin-top:12px;">
    <button class="btn btn_select" :disabled="!selectedRow" @click="onSelect">선택</button>
    <button class="btn btn-secondary btn-sm" @click="onClose">닫기</button>
  </div>
</bo-modal>
`,
};

/* ── PmDiscntPickModal — 할인 선택 모달 ─────────────────────────────────── */
window.PmDiscntPickModal = {
  name: 'PmDiscntPickModal',
  inheritAttrs: false,
  props: {
    showToast: { type: Function, default: () => {} },
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { reactive, ref, onMounted } = Vue;
    const searchParam = reactive({ searchValue: '' });
    const pager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1 });
    const rows = ref([]);
    const loading = ref(false);
    const selectedRow = ref(null);
    const columns = [
      { key: 'discntId', label: '할인 ID', style: 'width:160px;', cellStyle: 'font-family:monospace;font-size:11px;' },
      { key: 'discntNm', label: '할인명' },
      { key: 'useYn',    label: '사용', style: 'width:60px;', align: 'center',
        badge: r => r.useYn === 'Y' ? 'badge-green' : 'badge-gray',
        fmt: v => v === 'Y' ? '사용' : '미사용' },
    ];
    const fnLoad = async () => {
      loading.value = true; selectedRow.value = null;
      try {
        const res = await boApiSvc.pmDiscnt.getPage({ ...searchParam, pageNo: pager.pageNo, pageSize: pager.pageSize }, '할인피커', '조회');
        const d = res.data?.data || {};
        rows.value = d.pageList || [];
        pager.pageTotalCount = d.pageTotalCount || 0;
        pager.pageTotalPage  = d.pageTotalPage  || 1;
      } catch (err) {
        props.showToast(err.response?.data?.message || '조회 실패', 'error', 0);
      } finally { loading.value = false; }
    };
    const setPage = (n) => { pager.pageNo = n; fnLoad(); };
    const onSizeChange = () => { pager.pageNo = 1; fnLoad(); };
    const onRowClick = (row) => { selectedRow.value = row; };
    const onDblClick = (row) => { emit('select', row); };
    const onSelect = () => { if (selectedRow.value) emit('select', selectedRow.value); };
    const onClose = () => emit('close');
    onMounted(fnLoad);
    return { searchParam, pager, rows, loading, columns, selectedRow, fnLoad, setPage, onSizeChange, onRowClick, onDblClick, onSelect, onClose };
  },
  template: `
<bo-modal :show="true" title="할인 선택" width="600px" @close="onClose">
  <div style="display:flex;gap:8px;margin-bottom:12px;">
    <input class="form-control" v-model="searchParam.searchValue" placeholder="할인명/ID 검색" @keyup.enter="fnLoad" style="flex:1;" />
    <button class="btn btn_search btn-sm" @click="fnLoad">조회</button>
  </div>
  <bo-grid :columns="columns" :rows="rows" :pager="pager" row-key="discntId"
    row-clickable selected-key="discntId" :selected-value="selectedRow ? selectedRow.discntId : null"
    :empty-text="loading ? '로딩 중...' : '검색 결과가 없습니다.'"
    @row-click="onRowClick" @row-dblclick="onDblClick" />
  <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" :page-sizes="[5,10,20,50]" style="margin-top:8px;" />
  <div style="display:flex;justify-content:center;gap:8px;margin-top:12px;">
    <button class="btn btn_select" :disabled="!selectedRow" @click="onSelect">선택</button>
    <button class="btn btn-secondary btn-sm" @click="onClose">닫기</button>
  </div>
</bo-modal>
`,
};

/* ── PmGiftPickModal — 사은품 선택 모달 ─────────────────────────────────── */
window.PmGiftPickModal = {
  name: 'PmGiftPickModal',
  inheritAttrs: false,
  props: {
    showToast: { type: Function, default: () => {} },
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { reactive, ref, onMounted } = Vue;
    const searchParam = reactive({ searchValue: '' });
    const pager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1 });
    const rows = ref([]);
    const loading = ref(false);
    const selectedRow = ref(null);
    const columns = [
      { key: 'giftId', label: '사은품 ID', style: 'width:160px;', cellStyle: 'font-family:monospace;font-size:11px;' },
      { key: 'giftNm', label: '사은품명' },
      { key: 'useYn',  label: '사용', style: 'width:60px;', align: 'center',
        badge: r => r.useYn === 'Y' ? 'badge-green' : 'badge-gray',
        fmt: v => v === 'Y' ? '사용' : '미사용' },
    ];
    const fnLoad = async () => {
      loading.value = true; selectedRow.value = null;
      try {
        const res = await boApiSvc.pmGift.getPage({ ...searchParam, pageNo: pager.pageNo, pageSize: pager.pageSize }, '사은품피커', '조회');
        const d = res.data?.data || {};
        rows.value = d.pageList || [];
        pager.pageTotalCount = d.pageTotalCount || 0;
        pager.pageTotalPage  = d.pageTotalPage  || 1;
      } catch (err) {
        props.showToast(err.response?.data?.message || '조회 실패', 'error', 0);
      } finally { loading.value = false; }
    };
    const setPage = (n) => { pager.pageNo = n; fnLoad(); };
    const onSizeChange = () => { pager.pageNo = 1; fnLoad(); };
    const onRowClick = (row) => { selectedRow.value = row; };
    const onDblClick = (row) => { emit('select', row); };
    const onSelect = () => { if (selectedRow.value) emit('select', selectedRow.value); };
    const onClose = () => emit('close');
    onMounted(fnLoad);
    return { searchParam, pager, rows, loading, columns, selectedRow, fnLoad, setPage, onSizeChange, onRowClick, onDblClick, onSelect, onClose };
  },
  template: `
<bo-modal :show="true" title="사은품 선택" width="600px" @close="onClose">
  <div style="display:flex;gap:8px;margin-bottom:12px;">
    <input class="form-control" v-model="searchParam.searchValue" placeholder="사은품명/ID 검색" @keyup.enter="fnLoad" style="flex:1;" />
    <button class="btn btn_search btn-sm" @click="fnLoad">조회</button>
  </div>
  <bo-grid :columns="columns" :rows="rows" :pager="pager" row-key="giftId"
    row-clickable selected-key="giftId" :selected-value="selectedRow ? selectedRow.giftId : null"
    :empty-text="loading ? '로딩 중...' : '검색 결과가 없습니다.'"
    @row-click="onRowClick" @row-dblclick="onDblClick" />
  <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" :page-sizes="[5,10,20,50]" style="margin-top:8px;" />
  <div style="display:flex;justify-content:center;gap:8px;margin-top:12px;">
    <button class="btn btn_select" :disabled="!selectedRow" @click="onSelect">선택</button>
    <button class="btn btn-secondary btn-sm" @click="onClose">닫기</button>
  </div>
</bo-modal>
`,
};
