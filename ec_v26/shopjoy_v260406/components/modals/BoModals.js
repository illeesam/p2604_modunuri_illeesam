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
     AreaPickModal          — 전시 Area 선택
     PanelPickModal         — 전시 Panel 선택
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

/* ── 공통 모달 디자인 스타일 주입 ────────────────────────────── */
(() => {
  if (document.getElementById('__shopjoy_modal_enh_style__')) return;
  const css = `
    .modal-overlay { background: rgba(18,24,40,0.55) !important; backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); }
    .modal-box { border-radius: 16px !important; box-shadow: 0 24px 60px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.08) !important; border: 1px solid rgba(255,255,255,0.6); overflow: hidden; }
    .modal-header {
      margin: -20px -20px 14px -20px !important; padding: 14px 18px !important;
      background: linear-gradient(135deg,#fff0f4 0%,#ffe4ec 60%,#ffd5e1 100%) !important;
      border-bottom: 1px solid #ffc9d6 !important;
      display:flex !important; align-items:center !important; justify-content:space-between !important;
    }
    .modal-title { font-size: 15px !important; font-weight: 800 !important; color: #9f2946 !important; letter-spacing:-0.2px; }
    .modal-title::before { content:'●'; display:inline-block; color:#e8587a; font-size:9px; margin-right:8px; vertical-align:middle; }
    .modal-close {
      width:28px; height:28px; border-radius:50%; display:inline-flex !important; align-items:center; justify-content:center;
      background:rgba(255,255,255,0.6); color:#9f2946 !important; font-size:13px !important; cursor:pointer; transition:all .15s;
    }
    .modal-close:hover { background:#e8587a !important; color:#fff !important; transform:rotate(90deg); }
    .sel-modal-list { border:1px solid #eef0f3; border-radius:10px; overflow:hidden; background:#fafbfc; }
    .sel-modal-item {
      display:flex; align-items:center; gap:10px; padding:12px 14px !important;
      border-bottom:1px solid #f0f2f5 !important; background:#fff; transition:background .15s;
    }
    .sel-modal-item:last-child { border-bottom:none !important; }
    .sel-modal-item:hover { background:#fff5f8 !important; }
    .sel-modal-item-name { flex:1; font-size:13px; font-weight:600; color:#1a1a2e; }
    .sel-modal-item-id {
      font-size:11px; color:#6b7280; background:#eef2f7; padding:3px 9px; border-radius:12px; font-weight:600; font-family:monospace;
    }
    .sel-modal-item-btn {
      border:none; padding:5px 14px !important; border-radius:8px !important; cursor:pointer; font-size:12px; font-weight:700 !important;
      background: linear-gradient(135deg,#e8587a,#d64669) !important; color:#fff !important;
      box-shadow: 0 2px 6px rgba(232,88,122,0.35); transition:all .15s;
    }
    .sel-modal-item-btn:hover { transform:translateY(-1px); box-shadow:0 4px 10px rgba(232,88,122,0.5); }
    .tree-modal-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:14px 18px !important;
      background: linear-gradient(135deg,#fff0f4 0%,#ffe4ec 60%,#ffd5e1 100%);
      border-bottom:1px solid #ffc9d6 !important; flex-shrink:0;
    }
    .tree-modal-header > div > div:first-child,
    .tree-modal-header > div > div:first-child > div:first-child { color:#9f2946 !important; font-weight:800 !important; }
    .tree-modal-header .modal-close { background:rgba(255,255,255,0.6) !important; color:#9f2946 !important; }
    .tree-modal-header .modal-close:hover { background:#e8587a !important; color:#fff !important; }
    .modal-box .form-control { border-radius:10px; border-color:#e5e7eb; transition:all .15s; }
    .modal-box .form-control:focus { border-color:#e8587a !important; box-shadow:0 0 0 3px rgba(232,88,122,0.12) !important; }
    .modal-box .btn-primary { background:linear-gradient(135deg,#e8587a,#d64669) !important; border:none !important; box-shadow:0 2px 6px rgba(232,88,122,0.35) !important; }
    .modal-box .btn-primary:hover { transform:translateY(-1px); box-shadow:0 4px 10px rgba(232,88,122,0.5) !important; }
    .modal-box .btn-secondary { background:#f3f4f6 !important; color:#4b5563 !important; border:1px solid #e5e7eb !important; }
    .modal-box .btn-secondary:hover { background:#e5e7eb !important; }
  `;
  const style = document.createElement('style');
  style.id = '__shopjoy_modal_enh_style__';
  style.textContent = css;
  document.head.appendChild(style);

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
  props: ['dispDataset', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const pageSize = 10;
    const pager = reactive({ pageNo: 1, pageSize, pageTotalCount: 0, pageTotalPage: 1 });
    const searchParam = reactive({ searchType: '', searchValue: '' });
    const list = reactive([]);
    const loading = ref(false);

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SiteSelectModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        return emit('close');
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
        return emit('select', param);
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
    watch(() => searchParam.searchValue, () => { pager.pageNo = 1; handleSearchListWrap(); });

    /* onSetPage */
    const onSetPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchListWrap(); } };
    return {
      cfSiteNm, searchParam, list, loading, pager,                          // 데이터
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
        title="사이트번호 : 프로그램 작업코드 (01, 02, 03…)&#10;사이트코드 : 라이선스코드 (ST0001 형식)">
        ?
      </span>
    </span>
    <span class="modal-close" @click="handleBtnAction('modal-close')">
      ✕
    </span>
  </div>
  <bo-multi-check-select
    v-model="searchParam.searchType"
    :options="[
    { value: 'siteId',     label: '사이트번호' },
    { value: 'siteCode',   label: '사이트코드' },
    { value: 'siteNm',     label: '사이트명' },
    { value: 'siteDomain', label: '도메인' },
    ]"
    placeholder="검색대상 전체"
    all-label="전체 선택"
    min-width="100%" />
  <input class="form-control" v-model="searchParam.searchValue" placeholder="검색어 입력" style="margin:8px 0 12px 0;" />
  <div style="font-size:11px;color:#aaa;margin-bottom:8px;">
    총 {{ pager.pageTotalCount }}건
  </div>
  <div class="sel-modal-list">
    <div v-if="loading" style="text-align:center;color:#999;padding:20px;font-size:13px;">
      로딩 중...
    </div>
    <div v-else-if="list.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">
      검색 결과가 없습니다.
    </div>
    <div v-for="s in list" :key="s.siteId" class="sel-modal-item">
      <div class="sel-modal-item-name">
        {{ s.siteNm }}
      </div>
      <span class="sel-modal-item-id">
        {{ s.siteCode }}
      </span>
      <span style="font-family:monospace;font-size:12px;color:#e8587a;font-weight:700;min-width:26px;text-align:right;">
        {{ String(s.siteId).padStart(2,'0') }}
      </span>
      <button class="sel-modal-item-btn" @click="handleSelectAction('list-select', s)">
        선택
      </button>
    </div>
  </div>
  <!-- 페이징 -->
  <div style="display:flex;justify-content:center;align-items:center;gap:4px;margin-top:12px;padding-top:10px;border-top:1px solid #f0f0f0;">
    <button class="pager-btn" :disabled="pager.pageNo===1" @click="handleBtnAction('pager-set', 1)">
      «
    </button>
    <button class="pager-btn" :disabled="pager.pageNo===1" @click="handleBtnAction('pager-set', pager.pageNo-1)">
      ‹
    </button>
    <button v-for="n in pager.pageNums" :key="n" class="pager-btn" :class="{active:pager.pageNo===n}" @click="handleBtnAction('pager-set', n)">
      {{ n }}
    </button>
    <button class="pager-btn" :disabled="pager.pageNo===pager.pageTotalPage" @click="handleBtnAction('pager-set', pager.pageNo+1)">
      ›
    </button>
    <button class="pager-btn" :disabled="pager.pageNo===pager.pageTotalPage" @click="handleBtnAction('pager-set', pager.pageTotalPage)">
      »
    </button>
  </div>
</bo-modal>
`,
};

/* ── 판매업체 선택 모달 ── */
window.VendorSelectModal = {
  name: 'VendorSelectModal',
  props: ['dispDataset', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const pageSize = 8;
    const pager = reactive({ pageNo: 1, pageSize, pageTotalCount: 0, pageTotalPage: 1 });
    const searchParam = reactive({ searchType: '', searchValue: '' });
    const list = reactive([]);
    const loading = ref(false);

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ VendorSelectModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        return emit('close');
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
        return emit('select', param);
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
    watch(() => searchParam.searchValue, () => { pager.pageNo = 1; handleSearchListWrap(); });

    /* onSetPage */
    const onSetPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchListWrap(); } };
    return {
      cfSiteNm, searchParam, list, loading, pager,                          // 데이터
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
  <bo-multi-check-select
    v-model="searchParam.searchType"
    :options="[
    { value: 'vendorNm', label: '업체명' },
    { value: 'corpNo',   label: '사업자번호' },
    ]"
    placeholder="검색대상 전체"
    all-label="전체 선택"
    min-width="100%" />
  <input class="form-control" v-model="searchParam.searchValue" placeholder="검색어 입력" style="margin:8px 0 12px 0;" />
  <div style="font-size:11px;color:#aaa;margin-bottom:8px;">
    총 {{ pager.pageTotalCount }}건
  </div>
  <div class="sel-modal-list">
    <div v-if="loading" style="text-align:center;color:#999;padding:20px;font-size:13px;">
      로딩 중...
    </div>
    <div v-else-if="list.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">
      검색 결과가 없습니다.
    </div>
    <div v-for="v in list" :key="v.vendorId" class="sel-modal-item">
      <div class="sel-modal-item-name">
        {{ v.vendorNm }}
      </div>
      <span class="sel-modal-item-id">
        {{ v.vendorId }}
      </span>
      <button class="sel-modal-item-btn" @click="handleSelectAction('list-select', v)">
        선택
      </button>
    </div>
  </div>
  <!-- 페이징 -->
  <div style="display:flex;justify-content:center;align-items:center;gap:4px;margin-top:12px;padding-top:10px;border-top:1px solid #f0f0f0;">
    <button class="pager-btn" :disabled="pager.pageNo===1" @click="handleBtnAction('pager-set', 1)">
      «
    </button>
    <button class="pager-btn" :disabled="pager.pageNo===1" @click="handleBtnAction('pager-set', pager.pageNo-1)">
      ‹
    </button>
    <button v-for="n in pager.pageNums" :key="n" class="pager-btn" :class="{active:pager.pageNo===n}" @click="handleBtnAction('pager-set', n)">
      {{ n }}
    </button>
    <button class="pager-btn" :disabled="pager.pageNo===pager.pageTotalPage" @click="handleBtnAction('pager-set', pager.pageNo+1)">
      ›
    </button>
    <button class="pager-btn" :disabled="pager.pageNo===pager.pageTotalPage" @click="handleBtnAction('pager-set', pager.pageTotalPage)">
      »
    </button>
  </div>
</bo-modal>
`,
};

/* ── 사용자 선택 모달 (부서트리 + 멀티) ── */
window.BoUserSelectModal = {
  name: 'BoUserSelectModal',
  props: ['dispDataset', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { computed, reactive, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    const depts = reactive([]);
    const uiState = reactive({ loading: false, deptSearchValue: '', selectedDeptId: null });
    const pager = reactive({ page: 1, size: 20, pageTotalCount: 0, pageTotalPage: 1, pageList: [], pageNums: [], userSearchValue: '' });
    const selectedIds = reactive(new Set());
    const selectedUsers = reactive([]);

    /* ── 부서 트리 (전체 로드) ── */
    const fnBuildDeptTree = (items, parentId, depth) =>
      items.filter(d => (d.parentId || null) === (parentId || null) && d.useYn === 'Y')
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(d => ({ ...d, _depth: depth, _kids: fnBuildDeptTree(items, d.deptId, depth + 1) }));

    /* fnFlattenDept */
    const fnFlattenDept = (nodes, result = []) => {
      nodes.forEach(n => { result.push(n); fnFlattenDept(n._kids, result); });
      return result;
    };
    const cfFlatDeptTree = computed(() => {
      const searchVal = uiState.deptSearchValue.trim().toLowerCase();
      const base = searchVal
        ? depts.filter(d => d.useYn === 'Y' && d.deptNm.toLowerCase().includes(searchVal))
        : depts;
      return fnFlattenDept(fnBuildDeptTree(base, null, 1));
    });

    /* ── 사용자 페이지 조회 ── */
    const fnBuildPagerNums = () => {
      const c = pager.page, l = pager.pageTotalPage, s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };

    /* handleSearchUsers */
    const handleSearchUsers = async () => {
      uiState.loading = true;
      pager.pageList = [];
      pager.pageTotalCount = 0;
      pager.pageTotalPage = 1;
      try {
        const params = { pageNo: pager.page, pageSize: pager.size };
        if (pager.userSearchValue.trim()) params.searchValue = pager.userSearchValue.trim();
        if (uiState.selectedDeptId != null) params.deptId = uiState.selectedDeptId;
        const res = await boApiSvc.syUser.getPage(params, '사용자선택', '목록조회');
        const d = res.data?.data;
        pager.pageList = d?.pageList || d?.list || [];
        pager.pageTotalCount = d?.pageTotalCount || 0;
        pager.pageTotalPage = d?.pageTotalPage || 1;
        fnBuildPagerNums();
      } catch (e) { pager.pageList = []; } finally { uiState.loading = false; }
    };

    /* 목록조회 */
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const deptRes = await boApiSvc.syDept.getList({ pageSize: 10000 }, '부서관리', '목록조회');
        depts.splice(0, depts.length, ...(deptRes.data?.data || []));
      } catch (e) { depts.splice(0); } finally { uiState.loading = false; }
      await handleSearchUsers();
    };
    onMounted(() => { handleSearchList(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchList(); });

    /* ── 선택 ── */
    const fnIsChecked = (u) => selectedIds.has(u.userId || u.boUserId);

    /* handleToggleUser */
    const handleToggleUser = (u) => {
      const id = u.userId || u.boUserId;
      if (selectedIds.has(id)) {
        selectedIds.delete(id);
        const idx = selectedUsers.findIndex(x => (x.userId || x.boUserId) === id);
        if (idx !== -1) selectedUsers.splice(idx, 1);
      } else {
        selectedIds.add(id);
        selectedUsers.push(u);
      }
    };
    const cfAllChecked = computed(() => pager.pageList.length > 0 && pager.pageList.every(u => selectedIds.has(u.userId || u.boUserId)));

    /* handleToggleAll */
    const handleToggleAll = () => {
      if (cfAllChecked.value) {
        pager.pageList.forEach(u => {
          const id = u.userId || u.boUserId;
          selectedIds.delete(id);
          const idx = selectedUsers.findIndex(x => (x.userId || x.boUserId) === id);
          if (idx !== -1) selectedUsers.splice(idx, 1);
        });
      } else {
        pager.pageList.forEach(u => {
          const id = u.userId || u.boUserId;
          if (!selectedIds.has(id)) { selectedIds.add(id); selectedUsers.push(u); }
        });
      }
    };
    const cfSelectedCount = computed(() => selectedIds.size);

    /* handleConfirm */
    const handleConfirm = () => { emit('select', [...selectedUsers]); };

    /* 목록조회 */
    const onSearch = () => { pager.page = 1; handleSearchUsers(); };

    /* setPage */
    const setPage = (n) => { if (n >= 1 && n <= pager.pageTotalPage) { pager.page = n; handleSearchUsers(); } };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoUserSelectModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        return emit('close');
      // 확인 (선택 확정)
      } else if (cmd === 'modal-confirm') {
        return handleConfirm();
      // 사용자 검색
      } else if (cmd === 'searchParam-search') {
        return onSearch();
      // 전체 선택/해제 토글
      } else if (cmd === 'users-toggle-all') {
        return handleToggleAll();
      // 페이지 이동
      } else if (cmd === 'pager-set') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoUserSelectModal : handleSelectAction -> ', cmd, param);
      // 부서 선택
      if (cmd === 'deptTree-select') {
        uiState.selectedDeptId = param;
        return onSearch();
      // 사용자 토글
      } else if (cmd === 'users-toggle') {
        return handleToggleUser(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };
    return {
      cfSiteNm, depts, uiState, pager, selectedIds, cfFlatDeptTree,        // 데이터
      fnIsChecked, cfAllChecked, cfSelectedCount,                          // 헬퍼/computed
      handleBtnAction, handleSelectAction,                                 // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" max-width="780px" height="82vh" box-pad="0" body-pad="0" @close="handleBtnAction('modal-close')">
  <div style="background:#fff;border-radius:14px;height:100%;display:flex;flex-direction:column;overflow:hidden;">
    <!-- ── 헤더 ── -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:15px 20px 14px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:15px;font-weight:800;color:#1a1a2e;">
          사용자 선택
        </span>
        <span style="font-size:10px;font-weight:600;color:#2563eb;background:#eff6ff;padding:2px 8px;border-radius:20px;letter-spacing:.02em;">
          {{ cfSiteNm }}
        </span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span v-if="cfSelectedCount" style="font-size:12px;color:#e8587a;font-weight:700;background:#fff0f4;padding:3px 10px;border-radius:20px;">
          {{ cfSelectedCount }}명 선택됨
        </span>
        <span style="cursor:pointer;font-size:20px;color:#d1d5db;line-height:1;" @click="handleBtnAction('modal-close')">
          ✕
        </span>
      </div>
    </div>
    <!-- ── 바디 ── -->
    <div style="display:flex;flex:1;min-height:0;overflow:hidden;">
      <!-- 좌: 부서 트리 -->
      <div style="width:216px;flex-shrink:0;border-right:1px solid #f0f0f0;display:flex;flex-direction:column;background:#f8f9fb;">
        <!-- 부서 검색 -->
        <div style="padding:10px 10px 8px;border-bottom:1px solid #ebebeb;">
          <div style="font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px;">
            조직 / 부서
          </div>
          <div style="position:relative;">
            <span style="position:absolute;left:8px;top:50%;transform:translateY(-50%);font-size:11px;color:#bbb;">
              🔍
            </span>
            <input v-model="uiState.deptSearchValue" placeholder="부서 검색"
              style="width:100%;border:1px solid #e5e7eb;border-radius:7px;padding:5px 8px 5px 24px;font-size:12px;outline:none;box-sizing:border-box;background:#fff;color:#374151;" />
          </div>
        </div>
        <!-- 트리 목록 -->
        <div style="flex:1;overflow-y:auto;padding:6px 6px;">
          <!-- 루트: 전체 (1레벨) -->
          <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:2px;transition:all .12s;"
            :style="uiState.selectedDeptId===null?'background:#e8587a;box-shadow:0 2px 8px rgba(232,88,122,0.25);':'background:transparent;'"
            @click="handleSelectAction('deptTree-select', null)">
            <span style="font-size:8px;font-weight:900;flex-shrink:0;line-height:1;"
              :style="{ color: uiState.selectedDeptId===null?'#fff':'#e8587a' }">
              ●
            </span>
            <span style="font-size:13px;font-weight:700;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
              :style="{ color: uiState.selectedDeptId===null?'#fff':'#374151' }">
              전체
            </span>
            <span style="font-size:10px;font-weight:600;flex-shrink:0;"
              :style="{ color: uiState.selectedDeptId===null?'rgba(255,255,255,0.75)':'#bbb' }">
              {{ pager.pageTotalCount }}
            </span>
          </div>
          <!-- 2레벨~: 실 데이터 -->
          <div v-for="d in cfFlatDeptTree" :key="d.deptId"
            style="display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:8px;cursor:pointer;margin-bottom:1px;transition:all .12s;"
            :style="uiState.selectedDeptId===d.deptId?'background:#e8587a;box-shadow:0 2px 8px rgba(232,88,122,0.2);':'background:transparent;'"
            @click="handleSelectAction('deptTree-select', d.deptId)">
            <span style="flex-shrink:0;font-weight:800;line-height:1;"
              :style="{
              marginLeft: ((d._depth-1)*13)+'px',
              fontSize: d._depth===1?'10px':'8px',
              color: uiState.selectedDeptId===d.deptId?'#fff':['#2563eb','#52c41a','#f59e0b'][Math.min(d._depth-1,2)]
              }">
              {{ ['●','◦','·'][Math.min(d._depth-1,2)] }}
            </span>
            <span style="font-size:12px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
              :style="{ fontWeight: d._depth===1?'600':'400', color: uiState.selectedDeptId===d.deptId?'#fff':'#374151' }">
              {{ d.deptNm }}
            </span>
          </div>
          <div v-if="cfFlatDeptTree.length===0" style="padding:20px 0;text-align:center;font-size:12px;color:#bbb;">
            없음
          </div>
        </div>
      </div>
      <!-- 우: 사용자 목록 -->
      <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;background:#fff;">
        <!-- 검색 -->
        <div style="padding:10px 14px 8px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
          <div style="position:relative;">
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:12px;color:#bbb;">
              🔍
            </span>
            <input v-model="pager.userSearchValue" placeholder="이름 / 로그인ID / 이메일 검색" @keyup.enter="handleBtnAction('searchParam-search')"
              style="width:100%;border:1px solid #e5e7eb;border-radius:7px;padding:6px 10px 6px 28px;font-size:12px;outline:none;box-sizing:border-box;color:#374151;" />
            <button @click="handleBtnAction('searchParam-search')" style="margin-top:4px;width:100%;padding:5px 0;border:1px solid #e8587a;border-radius:6px;background:#e8587a;color:#fff;font-size:12px;font-weight:600;cursor:pointer;">
              조회
            </button>
          </div>
        </div>
        <!-- 전체선택 바 -->
        <div style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid #f0f0f0;flex-shrink:0;background:#fafafa;">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:600;color:#374151;user-select:none;">
            <input type="checkbox" :checked="cfAllChecked" @change="handleBtnAction('users-toggle-all')" style="width:14px;height:14px;" />
            전체선택
          </label>
          <span style="margin-left:auto;font-size:12px;color:#9ca3af;">
            총
            <b style="color:#374151;">
              {{ pager.pageTotalCount }}
            </b>
            명
          </span>
        </div>
        <!-- 카드 목록 -->
        <div style="flex:1;overflow-y:auto;">
          <div v-if="uiState.loading" style="text-align:center;color:#bbb;padding:52px 0;font-size:13px;">
            로딩 중...
          </div>
          <div v-else-if="pager.pageList.length===0" style="text-align:center;color:#bbb;padding:52px 0;font-size:13px;">
            <div style="font-size:32px;margin-bottom:8px;">
              🔍
            </div>
            검색 결과가 없습니다.
          </div>
          <div v-for="u in pager.pageList" :key="u.userId || u.boUserId"
            style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid #f5f5f5;cursor:pointer;transition:background .1s;"
            :style="fnIsChecked(u)?'background:#fff5f7;':'' "
            @click="handleSelectAction('users-toggle', u)">
            <input type="checkbox" :checked="fnIsChecked(u)" @click.stop="handleSelectAction('users-toggle', u)"
              style="width:15px;height:15px;flex-shrink:0;accent-color:#e8587a;cursor:pointer;" />
            <!-- 아바타 -->
            <div style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:800;transition:all .1s;"
              :style="fnIsChecked(u)?'background:#e8587a;color:#fff;':'background:#f3f4f6;color:#6b7280;'">
              {{ (u.userNm || u.name || '?').charAt(0) }}
            </div>
            <!-- 텍스트 -->
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:600;color:#1a1a2e;display:flex;align-items:baseline;gap:5px;">
                {{ u.userNm || u.name }}
                <span style="font-size:11px;color:#9ca3af;font-weight:400;">
                  {{ u.loginId }}
                </span>
              </div>
              <div style="font-size:11px;color:#b0b7c3;margin-top:2px;">
                {{ u.deptNm || u.dept || '-' }} · {{ u.roleNm || u.role || '' }}
              </div>
            </div>
            <!-- 상태 뱃지 -->
            <span style="font-size:10px;padding:2px 8px;border-radius:20px;font-weight:700;flex-shrink:0;"
              :style="(u.useYn||u.status)==='Y'||(u.status)==='활성'?'background:#dcfce7;color:#16a34a;':'background:#f3f4f6;color:#9ca3af;'">
              {{ u.useYn === 'Y' ? '활성' : u.useYn === 'N' ? '비활성' : (u.status || '') }}
            </span>
          </div>
          <!-- 페이지네이션 -->
          <div v-if="pager.pageTotalPage > 1" style="display:flex;justify-content:center;align-items:center;gap:3px;padding:8px 0;border-top:1px solid #f0f0f0;flex-shrink:0;">
            <button :disabled="pager.page===1" @click="handleBtnAction('pager-set', 1)" style="padding:3px 7px;border:1px solid #e5e7eb;border-radius:4px;font-size:11px;background:#fff;cursor:pointer;">
              «
            </button>
            <button :disabled="pager.page===1" @click="handleBtnAction('pager-set', pager.page-1)" style="padding:3px 7px;border:1px solid #e5e7eb;border-radius:4px;font-size:11px;background:#fff;cursor:pointer;">
              ‹
            </button>
            <button v-for="n in pager.pageNums" :key="n" @click="handleBtnAction('pager-set', n)"
              style="padding:3px 8px;border-radius:4px;font-size:11px;cursor:pointer;border:1px solid;"
              :style="pager.page===n?'background:#e8587a;color:#fff;border-color:#e8587a;font-weight:700;':'background:#fff;border-color:#e5e7eb;color:#374151;'">
              {{ n }}
            </button>
            <button :disabled="pager.page===pager.pageTotalPage" @click="handleBtnAction('pager-set', pager.page+1)" style="padding:3px 7px;border:1px solid #e5e7eb;border-radius:4px;font-size:11px;background:#fff;cursor:pointer;">
              ›
            </button>
            <button :disabled="pager.page===pager.pageTotalPage" @click="handleBtnAction('pager-set', pager.pageTotalPage)" style="padding:3px 7px;border:1px solid #e5e7eb;border-radius:4px;font-size:11px;background:#fff;cursor:pointer;">
              »
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- ── 푸터 ── -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid #f0f0f0;flex-shrink:0;background:#fff;">
      <span style="font-size:12px;" :style="cfSelectedCount?'color:#e8587a;font-weight:600;':'color:#bbb;'">
        {{ cfSelectedCount ? cfSelectedCount+'명이 선택되었습니다.' : '목록에서 사용자를 선택하세요.' }}
      </span>
      <div style="display:flex;gap:8px;">
        <button style="padding:8px 22px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;font-size:13px;font-weight:600;cursor:pointer;"
          @click="handleBtnAction('modal-close')">
          취소
        </button>
        <button :disabled="!cfSelectedCount"
          style="padding:8px 22px;border-radius:8px;border:none;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;"
          :style="cfSelectedCount?'background:#e8587a;color:#fff;box-shadow:0 2px 8px rgba(232,88,122,0.35);':'background:#f3f4f6;color:#d1d5db;cursor:not-allowed;'"
          @click="handleBtnAction('modal-confirm')">
          확인{{ cfSelectedCount?' ('+cfSelectedCount+'명)':'' }}
        </button>
      </div>
    </div>
  </div>
</bo-modal>
`,
};

/* ── 회원 선택 모달 ── */
window.MemberSelectModal = {
  name: 'MemberSelectModal',
  props: ['dispDataset', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const pageSize = 8;
    const pager = reactive({ pageNo: 1, pageSize, pageTotalCount: 0, pageTotalPage: 1 });
    const searchParam = reactive({ searchType: '', searchValue: '' });
    const list = reactive([]);
    const loading = ref(false);

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ MemberSelectModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        return emit('close');
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
        return emit('select', param);
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
    watch(() => searchParam.searchValue, () => { pager.pageNo = 1; handleSearchListWrap(); });

    /* onSetPage */
    const onSetPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchListWrap(); } };
    return {
      cfSiteNm, searchParam, list, loading, pager,                          // 데이터
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
  <bo-multi-check-select
    v-model="searchParam.searchType"
    :options="[
    { value: 'memberNm',    label: '이름' },
    { value: 'memberEmail', label: '이메일' },
    { value: 'memberId',    label: 'ID' },
    ]"
    placeholder="검색대상 전체"
    all-label="전체 선택"
    min-width="100%" />
  <input class="form-control" v-model="searchParam.searchValue" placeholder="검색어 입력" style="margin:8px 0 12px 0;" />
  <div style="font-size:11px;color:#aaa;margin-bottom:8px;">
    총 {{ pager.pageTotalCount }}건
  </div>
  <div class="sel-modal-list">
    <div v-if="loading" style="text-align:center;color:#999;padding:20px;font-size:13px;">
      로딩 중...
    </div>
    <div v-else-if="list.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">
      검색 결과가 없습니다.
    </div>
    <div v-for="m in list" :key="m.memberId || m.userId" class="sel-modal-item">
      <div class="sel-modal-item-name">
        {{ m.memberNm }}
        <span style="font-size:11px;color:#888;">
          {{ m.memberEmail || m.email }}
        </span>
      </div>
      <span class="sel-modal-item-id">
        {{ m.memberId || m.userId }}
      </span>
      <button class="sel-modal-item-btn" @click="handleSelectAction('list-select', m)">
        선택
      </button>
    </div>
  </div>
  <!-- 페이징 -->
  <div style="display:flex;justify-content:center;align-items:center;gap:4px;margin-top:12px;padding-top:10px;border-top:1px solid #f0f0f0;">
    <button class="pager-btn" :disabled="pager.pageNo===1" @click="handleBtnAction('pager-set', 1)">
      «
    </button>
    <button class="pager-btn" :disabled="pager.pageNo===1" @click="handleBtnAction('pager-set', pager.pageNo-1)">
      ‹
    </button>
    <button v-for="n in pager.pageNums" :key="n" class="pager-btn" :class="{active:pager.pageNo===n}" @click="handleBtnAction('pager-set', n)">
      {{ n }}
    </button>
    <button class="pager-btn" :disabled="pager.pageNo===pager.pageTotalPage" @click="handleBtnAction('pager-set', pager.pageNo+1)">
      ›
    </button>
    <button class="pager-btn" :disabled="pager.pageNo===pager.pageTotalPage" @click="handleBtnAction('pager-set', pager.pageTotalPage)">
      »
    </button>
  </div>
</bo-modal>
`,
};

/* ── 주문 선택 모달 ── */
window.OrderSelectModal = {
  name: 'OrderSelectModal',
  props: ['dispDataset', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const pageSize = 8;
    const pager = reactive({ pageNo: 1, pageSize, pageTotalCount: 0, pageTotalPage: 1 });
    const searchParam = reactive({ searchType: '', searchValue: '' });
    const list = reactive([]);
    const loading = ref(false);

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ OrderSelectModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        return emit('close');
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
        return emit('select', param);
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
    watch(() => searchParam.searchValue, () => { pager.pageNo = 1; handleSearchListWrap(); });

    /* onSetPage */
    const onSetPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchListWrap(); } };
    return {
      cfSiteNm, searchParam, list, loading, pager,                          // 데이터
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
  <bo-multi-check-select
    v-model="searchParam.searchType"
    :options="[
    { value: 'orderId',  label: '주문ID' },
    { value: 'memberNm', label: '회원명' },
    { value: 'prodNm',   label: '상품명' },
    ]"
    placeholder="검색대상 전체"
    all-label="전체 선택"
    min-width="100%" />
  <input class="form-control" v-model="searchParam.searchValue" placeholder="검색어 입력" style="margin:8px 0 12px 0;" />
  <div style="font-size:11px;color:#aaa;margin-bottom:8px;">
    총 {{ pager.pageTotalCount }}건
  </div>
  <div class="sel-modal-list">
    <div v-if="loading" style="text-align:center;color:#999;padding:20px;font-size:13px;">
      로딩 중...
    </div>
    <div v-else-if="list.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">
      검색 결과가 없습니다.
    </div>
    <div v-for="o in list" :key="o.orderId" class="sel-modal-item">
      <div class="sel-modal-item-name">
        {{ o.orderId }}
        <span style="font-size:11px;color:#888;">
          {{ o.memberNm || o.userNm }}
        </span>
      </div>
      <span class="sel-modal-item-id" style="background:#f0fff0;color:#389e0d;">
        {{ (o.totalAmt || o.totalPrice || 0).toLocaleString() }}원
      </span>
      <button class="sel-modal-item-btn" @click="handleSelectAction('list-select', o)">
        선택
      </button>
    </div>
  </div>
  <!-- 페이징 -->
  <div style="display:flex;justify-content:center;align-items:center;gap:4px;margin-top:12px;padding-top:10px;border-top:1px solid #f0f0f0;">
    <button class="pager-btn" :disabled="pager.pageNo===1" @click="handleBtnAction('pager-set', 1)">
      «
    </button>
    <button class="pager-btn" :disabled="pager.pageNo===1" @click="handleBtnAction('pager-set', pager.pageNo-1)">
      ‹
    </button>
    <button v-for="n in pager.pageNums" :key="n" class="pager-btn" :class="{active:pager.pageNo===n}" @click="handleBtnAction('pager-set', n)">
      {{ n }}
    </button>
    <button class="pager-btn" :disabled="pager.pageNo===pager.pageTotalPage" @click="handleBtnAction('pager-set', pager.pageNo+1)">
      ›
    </button>
    <button class="pager-btn" :disabled="pager.pageNo===pager.pageTotalPage" @click="handleBtnAction('pager-set', pager.pageTotalPage)">
      »
    </button>
  </div>
</bo-modal>
`,
};

/* ── 게시판 선택 모달 ── */
window.BbmSelectModal = {
  name: 'BbmSelectModal',
  props: ['dispDataset', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const pageSize = 6;
    const pager = reactive({ pageNo: 1, pageSize, pageTotalCount: 0, pageTotalPage: 1 });
    const searchParam = reactive({ searchType: '', searchValue: '' });
    const list = reactive([]);
    const loading = ref(false);

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BbmSelectModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        return emit('close');
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
        return emit('select', param);
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
    watch(() => searchParam.searchValue, () => { pager.pageNo = 1; handleSearchListWrap(); });

    /* onSetPage */
    const onSetPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchListWrap(); } };

    /* fnTypeBadge */
    const fnTypeBadge = t => ({ '일반': 'badge-gray', '공지': 'badge-blue', '갤러리': 'badge-orange', 'FAQ': 'badge-green', 'QnA': 'badge-red' }[t] || 'badge-gray');

    /* fnScopeBadge */
    const fnScopeBadge = s => ({ '공개': 'badge-green', '개인': 'badge-orange', '회사': 'badge-blue' }[s] || 'badge-gray');
    return {
      cfSiteNm, searchParam, list, loading, pager,                          // 데이터
      fnTypeBadge, fnScopeBadge,                                            // 헬퍼
      handleBtnAction, handleSelectAction,                                  // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" max-width="560px" @close="handleBtnAction('modal-close')">
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
  <bo-multi-check-select
    v-model="searchParam.searchType"
    :options="[
    { value: 'bbmNm',   label: '게시판명' },
    { value: 'bbmCode', label: '코드' },
    { value: 'bbmType', label: '유형' },
    ]"
    placeholder="검색대상 전체"
    all-label="전체 선택"
    min-width="100%" />
  <input class="form-control" v-model="searchParam.searchValue" placeholder="검색어 입력" style="margin:8px 0 10px 0;" />
  <div style="font-size:11px;color:#aaa;margin-bottom:8px;">
    총 {{ pager.pageTotalCount }}건
  </div>
  <div class="sel-modal-list" style="min-height:200px;">
    <div v-if="loading" style="text-align:center;color:#999;padding:30px;font-size:13px;">
      로딩 중...
    </div>
    <div v-else-if="list.length===0" style="text-align:center;color:#999;padding:30px;font-size:13px;">
      검색 결과가 없습니다.
    </div>
    <div v-for="b in list" :key="b.bbmId" class="sel-modal-item" style="gap:6px;">
      <div class="sel-modal-item-name" style="flex:1;min-width:0;">
        <span>
          {{ b.bbmNm }}
        </span>
        <span class="badge" :class="fnTypeBadge(b.bbmType)" style="margin-left:5px;font-size:10px;">
          {{ b.bbmType }}
        </span>
        <span class="badge" :class="fnScopeBadge(b.scopeType)" style="margin-left:3px;font-size:10px;">
          {{ b.scopeType }}
        </span>
      </div>
      <code style="font-size:11px;color:#888;background:#f5f5f5;padding:1px 6px;border-radius:3px;flex-shrink:0;">{{ b.bbmCode }}</code>
        <span class="sel-modal-item-id" style="background:#f0f0f0;color:#888;flex-shrink:0;">
          ID: {{ b.bbmId }}
        </span>
        <button class="sel-modal-item-btn" @click="handleSelectAction('list-select', b)">
          선택
        </button>
      </div>
    </div>
    <!-- 페이징 -->
    <div style="display:flex;justify-content:center;align-items:center;gap:4px;margin-top:12px;padding-top:10px;border-top:1px solid #f0f0f0;">
      <button class="pager-btn" :disabled="pager.pageNo===1" @click="handleBtnAction('pager-set', 1)">
        «
      </button>
      <button class="pager-btn" :disabled="pager.pageNo===1" @click="handleBtnAction('pager-set', pager.pageNo-1)">
        ‹
      </button>
      <button v-for="n in pager.pageNums" :key="n" class="pager-btn" :class="{active:pager.pageNo===n}" @click="handleBtnAction('pager-set', n)">
        {{ n }}
      </button>
      <button class="pager-btn" :disabled="pager.pageNo===pager.pageTotalPage" @click="handleBtnAction('pager-set', pager.pageNo+1)">
        ›
      </button>
      <button class="pager-btn" :disabled="pager.pageNo===pager.pageTotalPage" @click="handleBtnAction('pager-set', pager.pageTotalPage)">
        »
      </button>
    </div>
  </bo-modal>
`,
};

/* ── 템플릿 미리보기 모달 ── */
window.TemplatePreviewModal = {
  name: 'TemplatePreviewModal',
  props: ['tmpl', 'sampleParams', 'reloadTrigger'],
  emits: ['close'],
  setup(props, { emit }) {
    const { computed } = Vue;

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ TemplatePreviewModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        return emit('close');
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
      <button class="btn btn-secondary" @click="handleBtnAction('modal-close')">
        닫기
      </button>
    </div>
  </bo-modal>
`,
};

/* ── 템플릿 발송하기 모달 ── */
window.TemplateSendModal = {
  name: 'TemplateSendModal',
  props: ['tmpl', 'dispDataset', 'showToast', 'showConfirm', 'reloadTrigger'],
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
      items.filter(d => (d.parentId || null) === (parentId || null) && d.useYn === 'Y')
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
        allDepts.filter(x => x.parentId === id).forEach(c => queue.push(c.deptId));
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
    };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ TemplateSendModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        return emit('close');
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
      selectedDeptId, selectedGrade, cfFlatDeptTree, MEMBER_GRADES,          // computed/상수
      tmpl: computed(() => props.tmpl),                                      // 템플릿 객체
      handleBtnAction, handleSelectAction,                                   // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" max-width="800px" height="84vh" box-pad="0" body-pad="0" @close="handleBtnAction('modal-close')">
  <div style="background:#fff;border-radius:14px;height:100%;display:flex;flex-direction:column;overflow:hidden;">
    <!-- ── 헤더 ── -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:15px;font-weight:800;color:#1a1a2e;">
          📨 발송하기
        </span>
        <span style="font-size:10px;font-weight:600;color:#2563eb;background:#eff6ff;padding:2px 8px;border-radius:20px;">
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
    <!-- ── 템플릿 정보 바 ── -->
    <div style="display:flex;align-items:center;gap:8px;padding:9px 20px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <span class="badge" :class="cfTypeBadge" style="flex-shrink:0;">
        {{ tmpl?.templateType }}
      </span>
      <span style="font-weight:700;font-size:13px;color:#1a1a2e;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
        {{ tmpl?.templateNm }}
      </span>
      <code v-if="tmpl?.templateCode" style="font-size:11px;color:#888;background:#efefef;padding:1px 8px;border-radius:4px;flex-shrink:0;">
        {{ tmpl.templateCode }}
      </code>
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
      <div style="display:flex;flex:1;min-height:0;overflow:hidden;">
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
            <div v-for="item in cfList" :key="item.userId||item.boUserId"
            style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid #f5f5f5;cursor:pointer;transition:background .1s;"
            :style="fnIsSelected(item)?'background:#f0fff4;':''"
            @click="handleSelectAction('list-toggle', item)">
              <input type="checkbox" :checked="fnIsSelected(item)" @click.stop="handleSelectAction('list-toggle', item)"
              style="width:15px;height:15px;flex-shrink:0;accent-color:#52c41a;cursor:pointer;" />
              <div style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:800;transition:all .1s;"
              :style="fnIsSelected(item)?'background:#52c41a;color:#fff;':'background:#f3f4f6;color:#6b7280;'">
                {{ (searchParam.type==='member' ? item.memberNm : item.name).charAt(0) }}
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:600;color:#1a1a2e;display:flex;align-items:baseline;gap:5px;">
                  {{ searchParam.type==='member' ? item.memberNm : item.name }}
                  <span style="font-size:11px;color:#9ca3af;font-weight:400;">
                    {{ item.loginId || item.email }}
                  </span>
                </div>
                <div style="font-size:11px;color:#b0b7c3;margin-top:2px;">
                  <template v-if="searchParam.type==='user'">
                    {{ item.dept || '-' }} · {{ item.role }}
                  </template>
                  <template v-else>
                    {{ item.email }}
                  </template>
                </div>
              </div>
              <span style="font-size:10px;padding:2px 8px;border-radius:20px;font-weight:700;flex-shrink:0;"
              :style="searchParam.type==='user'
              ? (item.status==='활성'?'background:#dcfce7;color:#16a34a;':'background:#f3f4f6;color:#9ca3af;')
              : (item.grade==='VIP'?'background:#fef3c7;color:#d97706;':item.grade==='우수'?'background:#dbeafe;color:#1d4ed8;':'background:#f3f4f6;color:#6b7280;')">
                {{ searchParam.type==='user' ? item.status : item.grade }}
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
  props: ['dispDataset', 'excludeId', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const uiState = reactive({ searchValue: '', hoverId: null });
    const allRoles = reactive([]);

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
        .filter(r => (r.parentId || null) === (parentId || null))
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
        const mark = (id) => { excSet.add(id); allRoles.filter(r => r.parentId === id).forEach(r => mark(r.roleId)); };
        mark(props.excludeId);
      }
      const base = allRoles.filter(r => !excSet.has(r.roleId) && r.useYn === 'Y');
      const kwVal = uiState.searchValue.trim().toLowerCase();
      const list  = kwVal ? base.filter(r => r.roleNm.toLowerCase().includes(kwVal) || r.roleCode.toLowerCase().includes(kwVal)) : base;
      return fnFlatten(fnBuildTree(list, null, 0));
    });

    /* onSelect */
    const onSelect = (role) => emit('select', { roleId: role.roleId, roleNm: role.roleNm });

    /* onSelectNone */
    const onSelectNone = () => emit('select', { roleId: null, roleNm: '' });
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ RoleTreeModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        return emit('close');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ RoleTreeModal : handleSelectAction -> ', cmd, param);
      // 역할 선택
      if (cmd === 'rolesTree-select') {
        return onSelect(param);
      // 상위없음 선택
      } else if (cmd === 'rolesTree-select-none') {
        return onSelectNone();
      // hover
      } else if (cmd === 'rolesTree-hover') {
        uiState.hoverId = param;
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };
    return {
      cfSiteNm, uiState, cfFlatTree,                                          // 데이터
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" max-width="440px" max-height="80vh" box-pad="0" body-pad="0" @close="handleBtnAction('modal-close')">
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
    <div style="padding:10px 14px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="position:relative;">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:#bbb;">
          🔍
        </span>
        <input class="form-control" v-model="uiState.searchValue" placeholder="역할명 또는 역할코드 검색"
          style="padding-left:30px;font-size:13px;border-radius:20px;border-color:#e8e8e8;background:#fff;" />
      </div>
    </div>
    <div style="flex:1;overflow-y:auto;">
      <div style="display:flex;align-items:center;gap:0;padding:11px 16px;cursor:pointer;border-bottom:2px solid #f0f0f0;transition:background .12s;"
        :style="{ background: uiState.hoverId==='__none__' ? '#fff5f7' : '#fafafa' }"
        @mouseenter="handleSelectAction('rolesTree-hover', '__none__')" @mouseleave="handleSelectAction('rolesTree-hover', null)" @click="handleSelectAction('rolesTree-select-none')">
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
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .12s;" :style="{ opacity: uiState.hoverId==='__none__' ? 1 : 0 }">
          ›
        </span>
      </div>
      <div v-for="r in cfFlatTree" :key="r.roleId"
        style="display:flex;align-items:center;gap:0;padding:9px 16px;cursor:pointer;border-bottom:1px solid #f5f5f5;transition:background .1s;"
        :style="{ background: uiState.hoverId===r.roleId ? '#fff5f7' : '' }"
        @mouseenter="handleSelectAction('rolesTree-hover', r.roleId)" @mouseleave="handleSelectAction('rolesTree-hover', null)" @click="handleSelectAction('rolesTree-select', r)">
        <span :style="{ marginLeft:(r._depth*14)+'px', marginRight:'7px', fontWeight:'700',
          fontSize: r._depth===0?'7px':'12px', flexShrink:0,
          color:['#e8587a','#2563eb','#52c41a','#f59e0b'][Math.min(r._depth,3)] }">
          {{ ['●','◦','·','-'][Math.min(r._depth,3)] }}
        </span>
        <div style="flex:1;min-width:0;overflow:hidden;">
          <span style="font-size:13px;font-weight:600;color:#1a1a2e;">
            {{ r.roleNm }}
          </span>
          <code style="font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 5px;border-radius:3px;margin-left:6px;letter-spacing:.3px;">
            {{ r.roleCode }}
          </code>
          </div>
          <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .1s;" :style="{ opacity: uiState.hoverId===r.roleId ? 1 : 0 }">
            ›
          </span>
        </div>
        <div v-if="cfFlatTree.length===0" style="text-align:center;color:#bbb;padding:36px 0;font-size:13px;">
          {{ uiState.searchValue ? '검색 결과가 없습니다.' : '선택 가능한 권한이 없습니다.' }}
        </div>
      </div>
      <div style="padding:11px 16px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;background:#fafafa;">
        <button class="btn btn-secondary" @click="handleBtnAction('modal-close')">
          취소
        </button>
      </div>
    </div>
  </bo-modal>
`,
};

window.MenuTreeModal = {
  name: 'MenuTreeModal',
  props: ['dispDataset', 'excludeId', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const uiState = reactive({ searchValue: '', hoverId: null });
    const allMenus = reactive([]);

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
        .filter(m => (m.parentId || null) === (parentId || null))
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
          allMenus.filter(m => m.parentId === id).forEach(m => markExclude(m.menuId));
        };
        markExclude(props.excludeId);
      }
      const base = allMenus.filter(m => !excSet.has(m.menuId) && m.useYn === 'Y');
      const kwVal = uiState.searchValue.trim().toLowerCase();
      const list  = kwVal
        ? base.filter(m => m.menuNm.toLowerCase().includes(kwVal) || m.menuCode.toLowerCase().includes(kwVal))
        : base;
      return fnFlatten(fnBuildTree(list, null, 0));
    });

    /* onSelect */
    const onSelect = (menu) => emit('select', { menuId: menu.menuId, menuNm: menu.menuNm });

    /* onSelectNone */
    const onSelectNone = () => emit('select', { menuId: null, menuNm: '' });
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ MenuTreeModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        return emit('close');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ MenuTreeModal : handleSelectAction -> ', cmd, param);
      // 메뉴 선택
      if (cmd === 'menuTree-select') {
        return onSelect(param);
      // 상위없음 선택
      } else if (cmd === 'menuTree-select-none') {
        return onSelectNone();
      // hover
      } else if (cmd === 'menuTree-hover') {
        uiState.hoverId = param;
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    return {
      cfSiteNm, uiState, cfFlatTree,                                          // 데이터
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" max-width="440px" max-height="80vh" box-pad="0" body-pad="0" @close="handleBtnAction('modal-close')">
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
      <div style="position:relative;">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:#bbb;">
          🔍
        </span>
        <input class="form-control" v-model="uiState.searchValue"
          placeholder="메뉴명 또는 메뉴코드 검색"
          style="padding-left:30px;font-size:13px;border-radius:20px;border-color:#e8e8e8;background:#fff;" />
      </div>
    </div>
    <!-- ── 트리 목록 ── -->
    <div style="flex:1;overflow-y:auto;">
      <!-- 최상위 선택 -->
      <div style="display:flex;align-items:center;gap:0;padding:11px 16px;cursor:pointer;
        border-bottom:2px solid #f0f0f0;transition:background .12s;"
        :style="{ background: uiState.hoverId==='__none__' ? '#fff5f7' : '#fafafa' }"
        @mouseenter="handleSelectAction('menuTree-hover', '__none__')" @mouseleave="handleSelectAction('menuTree-hover', null)"
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
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .12s;"
          :style="{ opacity: uiState.hoverId==='__none__' ? 1 : 0 }">
          ›
        </span>
      </div>
      <!-- 메뉴 트리 항목들 -->
      <div v-for="m in cfFlatTree" :key="m.menuId"
        style="display:flex;align-items:center;gap:0;padding:9px 16px;cursor:pointer;
        border-bottom:1px solid #f5f5f5;transition:background .1s;"
        :style="{ background: uiState.hoverId===m.menuId ? '#fff5f7' : '' }"
        @mouseenter="handleSelectAction('menuTree-hover', m.menuId)" @mouseleave="handleSelectAction('menuTree-hover', null)"
        @click="handleSelectAction('menuTree-select', m)">
        <!-- 블릿 들여쓰기 -->
        <span :style="{ marginLeft:(m._depth*14)+'px', marginRight:'7px', fontWeight:'700',
          fontSize: m._depth===0?'7px':'12px', flexShrink:0,
          color:['#e8587a','#2563eb','#52c41a','#f59e0b'][Math.min(m._depth,3)] }">
          {{ ['●','◦','·','-'][Math.min(m._depth,3)] }}
        </span>
        <!-- 메뉴명 + 코드 -->
        <div style="flex:1;min-width:0;overflow:hidden;">
          <span style="font-size:13px;font-weight:600;color:#1a1a2e;">
            {{ m.menuNm }}
          </span>
          <code style="font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 5px;border-radius:3px;margin-left:6px;letter-spacing:.3px;">
            {{ m.menuCode }}
          </code>
          </div>
          <!-- hover 화살표 -->
          <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .1s;"
          :style="{ opacity: uiState.hoverId===m.menuId ? 1 : 0 }">
            ›
          </span>
        </div>
        <!-- 빈 상태 -->
        <div v-if="cfFlatTree.length===0"
        style="text-align:center;color:#bbb;padding:36px 0;font-size:13px;">
          {{ uiState.searchValue ? '검색 결과가 없습니다.' : '선택 가능한 메뉴가 없습니다.' }}
        </div>
      </div>
      <!-- ── 푸터 ── -->
      <div style="padding:11px 16px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;background:#fafafa;">
        <button class="btn btn-secondary" @click="handleBtnAction('modal-close')">
          취소
        </button>
      </div>
    </div>
  </bo-modal>
`,
};

window.DeptTreeModal = {
  name: 'DeptTreeModal',
  props: ['dispDataset', 'excludeId', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const uiState = reactive({ searchValue: '', hoverId: null });
    const allDepts = reactive([]);

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
        .filter(d => (d.parentId || null) === (parentId || null))
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
          allDepts.filter(d => d.parentId === id).forEach(d => markExclude(d.deptId));
        };
        markExclude(props.excludeId);
      }
      const base = allDepts.filter(d => !excSet.has(d.deptId) && d.useYn === 'Y');
      const kwVal = uiState.searchValue.trim().toLowerCase();
      const list  = kwVal
        ? base.filter(d => d.deptNm.toLowerCase().includes(kwVal) || d.deptCode.toLowerCase().includes(kwVal))
        : base;
      return flatten(buildTree(list, null, 0));
    });

    /* select */
    const select = (dept) => emit('select', { deptId: dept.deptId, deptNm: dept.deptNm });

    /* selectNone */
    const selectNone = () => emit('select', { deptId: null, deptNm: '' });
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ DeptTreeModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        return emit('close');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ DeptTreeModal : handleSelectAction -> ', cmd, param);
      // 부서 선택
      if (cmd === 'deptTree-select') {
        return select(param);
      // 상위없음 선택
      } else if (cmd === 'deptTree-select-none') {
        return selectNone();
      // hover
      } else if (cmd === 'deptTree-hover') {
        uiState.hoverId = param;
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    return {
      cfSiteNm, uiState, cfFlatTree,                                          // 데이터
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" max-width="440px" max-height="80vh" box-pad="0" body-pad="0" @close="handleBtnAction('modal-close')">
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
      <div style="position:relative;">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:#bbb;">
          🔍
        </span>
        <input class="form-control" v-model="uiState.searchValue"
          placeholder="부서명 또는 부서코드 검색"
          style="padding-left:30px;font-size:13px;border-radius:20px;border-color:#e8e8e8;background:#fff;" />
      </div>
    </div>
    <!-- ── 트리 목록 ── -->
    <div style="flex:1;overflow-y:auto;">
      <!-- 최상위 선택 (고정 첫 항목) -->
      <div style="display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;
        border-bottom:2px solid #f0f0f0;transition:background .12s;"
        :style="{ background: uiState.hoverId==='__none__' ? '#fff5f7' : '#fafafa' }"
        @mouseenter="handleSelectAction('deptTree-hover', '__none__')" @mouseleave="handleSelectAction('deptTree-hover', null)"
        @click="handleSelectAction('deptTree-select-none')">
        <!-- accent bar -->
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
        <span style="font-size:16px;color:#e8587a;font-weight:700;transition:opacity .12s;"
          :style="{ opacity: uiState.hoverId==='__none__' ? 1 : 0 }">
          ›
        </span>
      </div>
      <!-- 부서 트리 항목들 -->
      <div v-for="d in cfFlatTree" :key="d.deptId"
        style="display:flex;align-items:center;gap:0;padding:9px 16px;cursor:pointer;
        border-bottom:1px solid #f5f5f5;transition:background .1s;"
        :style="{ background: uiState.hoverId===d.deptId ? '#fff5f7' : '' }"
        @mouseenter="handleSelectAction('deptTree-hover', d.deptId)" @mouseleave="handleSelectAction('deptTree-hover', null)"
        @click="handleSelectAction('deptTree-select', d)">
        <!-- 블릿 들여쓰기 -->
        <span :style="{ marginLeft:(d._depth*14)+'px', marginRight:'7px', fontWeight:'700',
          fontSize: d._depth===0?'7px':'12px', flexShrink:0,
          color:['#e8587a','#2563eb','#52c41a','#f59e0b'][Math.min(d._depth,3)] }">
          {{ ['●','◦','·','-'][Math.min(d._depth,3)] }}
        </span>
        <!-- 부서명 + 코드 -->
        <div style="flex:1;min-width:0;overflow:hidden;">
          <span style="font-size:13px;font-weight:600;color:#1a1a2e;">
            {{ d.deptNm }}
          </span>
          <code style="font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 5px;border-radius:3px;margin-left:6px;letter-spacing:.3px;">
            {{ d.deptCode }}
          </code>
          </div>
          <!-- hover 화살표 -->
          <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .1s;"
          :style="{ opacity: uiState.hoverId===d.deptId ? 1 : 0 }">
            ›
          </span>
        </div>
        <!-- 빈 상태 -->
        <div v-if="cfFlatTree.length===0"
        style="text-align:center;color:#bbb;padding:36px 0;font-size:13px;">
          <div style="font-size:32px;margin-bottom:8px;">
            🔍
          </div>
          {{ uiState.searchValue ? '검색 결과가 없습니다.' : '선택 가능한 부서가 없습니다.' }}
        </div>
      </div>
      <!-- ── 푸터 ── -->
      <div style="padding:11px 16px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;background:#fafafa;">
        <button class="btn btn-secondary" @click="handleBtnAction('modal-close')">
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
  props: ['dispDataset', 'excludeId', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const uiState = reactive({ searchValue: '', hoverId: null });
    const allCategories = reactive([]);

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
        .filter(c => (c.parentId || null) === (parentId || null))
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
        const mark = (id) => { excSet.add(id); allCategories.filter(c => c.parentId === id).forEach(c => mark(c.categoryId)); };
        mark(props.excludeId);
      }
      const base   = allCategories.filter(c => !excSet.has(c.categoryId) && (c.useYn === 'Y' || c.status === '활성'));
      const kwVal  = uiState.searchValue.trim().toLowerCase();
      const list   = kwVal ? base.filter(c => c.categoryNm.toLowerCase().includes(kwVal)) : base;
      return flatten(buildTree(list, null, 0));
    });

    /* select */
    const select     = (cat) => emit('select', { categoryId: cat.categoryId, categoryNm: cat.categoryNm });

    /* selectNone */
    const selectNone = () => emit('select', { categoryId: null, categoryNm: '' });
    const cfSiteNm   = computed(() => boUtil.bofGetSiteNm());

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ CategoryTreeModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        return emit('close');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ CategoryTreeModal : handleSelectAction -> ', cmd, param);
      // 카테고리 선택
      if (cmd === 'categoryTree-select') {
        return select(param);
      // 상위없음 선택
      } else if (cmd === 'categoryTree-select-none') {
        return selectNone();
      // hover
      } else if (cmd === 'categoryTree-hover') {
        uiState.hoverId = param;
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };
    return {
      cfSiteNm, uiState, cfFlatTree,                                          // 데이터
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="true" max-width="440px" max-height="80vh" box-pad="0" body-pad="0" @close="handleBtnAction('modal-close')">
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
    <div style="padding:10px 14px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="position:relative;">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:#bbb;">
          🔍
        </span>
        <input class="form-control" v-model="uiState.searchValue" placeholder="카테고리명 검색"
          style="padding-left:30px;font-size:13px;border-radius:20px;border-color:#e8e8e8;background:#fff;" />
      </div>
    </div>
    <div style="flex:1;overflow-y:auto;">
      <!-- 최상위 선택 -->
      <div style="display:flex;align-items:center;gap:0;padding:11px 16px;cursor:pointer;border-bottom:2px solid #f0f0f0;transition:background .12s;"
        :style="{ background: uiState.hoverId==='__none__' ? '#fff5f7' : '#fafafa' }"
        @mouseenter="handleSelectAction('categoryTree-hover', '__none__')" @mouseleave="handleSelectAction('categoryTree-hover', null)" @click="handleSelectAction('categoryTree-select-none')">
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
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .12s;" :style="{ opacity: uiState.hoverId==='__none__' ? 1 : 0 }">
          ›
        </span>
      </div>
      <!-- 카테고리 트리 -->
      <div v-for="c in cfFlatTree" :key="c.categoryId"
        style="display:flex;align-items:center;gap:0;padding:9px 16px;cursor:pointer;border-bottom:1px solid #f5f5f5;transition:background .1s;"
        :style="{ background: uiState.hoverId===c.categoryId ? '#fff5f7' : '' }"
        @mouseenter="handleSelectAction('categoryTree-hover', c.categoryId)" @mouseleave="handleSelectAction('categoryTree-hover', null)" @click="handleSelectAction('categoryTree-select', c)">
        <span :style="{ marginLeft:(c._depth*14)+'px', marginRight:'7px', fontWeight:'700',
          fontSize: c._depth===0?'7px':'12px', flexShrink:0,
          color:['#e8587a','#2563eb','#52c41a','#f59e0b'][Math.min(c._depth,3)] }">
          {{ ['●','◦','·','-'][Math.min(c._depth,3)] }}
        </span>
        <div style="flex:1;min-width:0;overflow:hidden;">
          <span style="font-size:13px;font-weight:600;color:#1a1a2e;">
            {{ c.categoryNm }}
          </span>
          <span style="font-size:11px;color:#aaa;margin-left:6px;">
            {{ c.depth }}단계
          </span>
        </div>
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .1s;" :style="{ opacity: hoverId===c.categoryId ? 1 : 0 }">
          ›
        </span>
      </div>
      <div v-if="cfFlatTree.length===0" style="text-align:center;color:#bbb;padding:36px 0;font-size:13px;">
        <div style="font-size:32px;margin-bottom:8px;">
          🔍
        </div>
        {{ uiState.searchValue ? '검색 결과가 없습니다.' : '선택 가능한 카테고리가 없습니다.' }}
      </div>
    </div>
    <div style="padding:11px 16px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;background:#fafafa;">
      <button class="btn btn-secondary" @click="handleBtnAction('modal-close')">
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
  props: {
    show:     { type: Boolean, default: false, reloadTrigger: { type: Number, default: 0 } },
    mode:     { type: String,  default: 'single' },   /* 'all' | 'single' */
    tabLabel: { type: String,  default: '위젯미리보기' },
    area:     { type: String,  default: '' },
    widgets:  { type: Array,   default: () => [] },
    widget:   { type: Object,  default: () => ({}) },
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
        return emit('close');
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
        <span v-if="mode==='single' && cfWidgetLabel" style="margin-left:6px;font-size:11px;color:#aaa;">
        ({{ cfWidgetLabel }})
      </span>
      <span v-if="mode==='all' && area" style="margin-left:6px;font-size:11px;color:#aaa;">
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
  <button class="btn btn-secondary" @click="handleBtnAction('modal-close')">
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
  props: {
    show:      { type: Boolean, default: false, reloadTrigger: { type: Number, default: 0 } },
    params:    { type: Object,  default: () => ({
      areas: [], date: '', time: '', status: '', condition: '',
      authRequired: '', authGrade: '', siteId: '', memberId: '', viewOpts: '',
    }) },
    dispDataset: { type: Object,  default: () => window.dispDataset || { displays: [], codes: [] } },
    title:     { type: String,  default: 'DispUi미리보기' },
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
        return emit('close');
      // 팝업으로 열기
      } else if (cmd === 'modal-open-popup') {
        return emit('open-popup');
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
      <button class="btn btn-secondary btn-sm" @click="handleBtnAction('modal-close')">
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
  props: {
    show:        { type: Boolean, default: false, reloadTrigger: { type: Number, default: 0 } },
    selectedIds: { type: Array,   default: () => [] },
  },
  emits: ['close', 'apply'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, watchEffect } = Vue;

    const searchParam = reactive({ searchValue: '' });

    const cfAllCats = computed(() =>
      ((window.dispDataset || {}).categories || [])
        .filter(c => c.status === '활성')
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
    );

    /* 루트/자식 */
    const cfRoots = computed(() => {
      const kwv = searchParam.searchValue.trim().toLowerCase();
      let list = cfAllCats.value;
      if (kwv) {
        const matchIds = new Set(list.filter(c => c.categoryNm.toLowerCase().includes(kwv)).map(c => c.categoryId));
        list = list.filter(c => matchIds.has(c.categoryId) || matchIds.has(c.parentId));
      }
      return list.filter(c => !c.parentId);
    });

    /* childrenOf */
    const childrenOf = (parentId) => {
      const kwv = searchParam.searchValue.trim().toLowerCase();
      let list = cfAllCats.value.filter(c => c.parentId === parentId);
      if (kwv) list = list.filter(c => c.categoryNm.toLowerCase().includes(kwv));
      return list;
    };

    /* 펼침 상태 — 루트는 기본 펼침 */
    const expanded = reactive(new Set());

    /* toggleExpand */
    const toggleExpand = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    watchEffect(() => { cfRoots.value.forEach(r => expanded.add(r.categoryId)); });

    /* 선택 상태 (로컬 복사) */
    const localSel = reactive(new Set());
    watch(() => props.show, (v) => {
      if (v) { localSel.clear(); props.selectedIds.forEach(id => localSel.add(id)); }
    }, { immediate: true });

    /* 전체 선택 */
    const cfAllIds = computed(() => {
      const ids = [];
      cfRoots.value.forEach(r => { ids.push(r.categoryId); childrenOf(r.categoryId).forEach(c => ids.push(c.categoryId)); });
      return ids;
    });
    const isAllOn  = computed(() => cfAllIds.value.length > 0 && cfAllIds.value.every(id => localSel.has(id)));
    const cfIsSomeOn = computed(() => !isAllOn.value && cfAllIds.value.some(id => localSel.has(id)));

    /* toggleAll */
    const toggleAll = () => { if (isAllOn.value) cfAllIds.value.forEach(id => localSel.delete(id)); else cfAllIds.value.forEach(id => localSel.add(id)); };

    /* 루트 선택 (자식 포함) */
    const toggleRoot = (root) => {
      const ch = childrenOf(root.categoryId);
      const allOn = localSel.has(root.categoryId) && ch.every(c => localSel.has(c.categoryId));
      if (allOn) { localSel.delete(root.categoryId); ch.forEach(c => localSel.delete(c.categoryId)); }
      else       { localSel.add(root.categoryId);    ch.forEach(c => localSel.add(c.categoryId)); }
    };

    /* isRootFull */
    const isRootFull = (root) => localSel.has(root.categoryId) && childrenOf(root.categoryId).every(c => localSel.has(c.categoryId));

    /* isRootPart */
    const isRootPart = (root) => !isRootFull(root) && (localSel.has(root.categoryId) || childrenOf(root.categoryId).some(c => localSel.has(c.categoryId)));

    /* 자식 선택 */
    const toggleChild = (id) => { if (localSel.has(id)) localSel.delete(id); else localSel.add(id); };

    /* onReset */
    const onReset = () => localSel.clear();

    /* apply */
    const apply = () => { emit('apply', [...localSel]); emit('close'); };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ CategorySelectModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        return emit('close');
      // 초기화
      } else if (cmd === 'modal-reset') {
        return onReset();
      // 적용 (선택 확정)
      } else if (cmd === 'modal-apply') {
        return apply();
      // 전체 토글
      } else if (cmd === 'categoryTree-toggle-all') {
        return toggleAll();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ CategorySelectModal : handleSelectAction -> ', cmd, param);
      // 펼침/접힘 토글
      if (cmd === 'categoryTree-expand') {
        return toggleExpand(param);
      // 루트 토글
      } else if (cmd === 'categoryTree-toggle-root') {
        return toggleRoot(param);
      // 자식 토글
      } else if (cmd === 'categoryTree-toggle-child') {
        return toggleChild(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    return {
      searchParam, cfRoots, childrenOf, expanded, localSel,                   // 데이터
      isRootFull, isRootPart, isAllOn, cfIsSomeOn,                            // 헬퍼/computed
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="show" width="340px" max-height="80vh" box-pad="0" body-pad="0" :z-index="500" @close="handleBtnAction('modal-close')">
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
    <div style="padding:7px 12px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <input v-model="searchParam.searchValue" type="text" placeholder="카테고리명 검색" style="width:100%;box-sizing:border-box;font-size:12px;padding:4px 9px;border:1px solid #ddd;border-radius:5px;outline:none;" />
    </div>
    <!-- 트리 목록 -->
    <div style="flex:1;overflow-y:auto;padding:4px 0;">
      <div v-if="cfRoots.length===0" style="text-align:center;padding:30px;font-size:12px;color:#bbb;">
        검색 결과 없음
      </div>
      <!-- ① 전체 노드 -->
      <div @click="handleBtnAction('categoryTree-toggle-all')"
        style="display:flex;align-items:center;gap:6px;padding:6px 12px;cursor:pointer;user-select:none;"
        :style="isAllOn?'background:#fff4f6;':''">
        <div style="width:14px;height:14px;border-radius:3px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
          :style="isAllOn?'border-color:#e8587a;background:#e8587a;':cfIsSomeOn?'border-color:#e8587a;background:#fce4ec;':'border-color:#aaa;background:#fff;'">
          <span v-if="isAllOn"  style="color:#fff;font-size:9px;line-height:1;">
            ✓
          </span>
          <span v-else-if="cfIsSomeOn" style="color:#e8587a;font-size:11px;font-weight:900;line-height:1;margin-top:-1px;">
            −
          </span>
        </div>
        <span style="font-size:12px;font-weight:700;color:#333;">
          전체
        </span>
      </div>
      <!-- ② 루트 + 자식 트리 -->
      <div style="position:relative;padding-left:12px;">
        <!-- 레벨1 세로선 (전체 → 루트들) -->
        <div style="position:absolute;left:19px;top:0;bottom:14px;width:1px;background:#d0d0d0;">
        </div>
        <div v-for="root in cfRoots" :key="root.categoryId">
          <!-- 루트 행 -->
          <div style="display:flex;align-items:center;gap:4px;padding:5px 8px;cursor:pointer;user-select:none;"
            :style="isRootFull(root)?'background:#fff4f6;':isRootPart(root)?'background:#fffbf4;':''">
            <!-- 수평 연결선 -->
            <div style="width:12px;height:1px;background:#d0d0d0;flex-shrink:0;">
            </div>
            <!-- [+]/[-] 펼침 버튼 -->
            <span @click.stop="handleSelectAction('categoryTree-expand', root.categoryId)"
              style="width:13px;height:13px;border:1px solid #bbb;border-radius:2px;background:#f5f5f5;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#666;cursor:pointer;flex-shrink:0;line-height:1;">
              {{ expanded.has(root.categoryId) ? '−' : '+' }}
            </span>
            <!-- 체크박스 -->
            <div @click.stop="handleSelectAction('categoryTree-toggle-root', root)"
              style="width:13px;height:13px;border-radius:3px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
              :style="isRootFull(root)?'border-color:#e8587a;background:#e8587a;':isRootPart(root)?'border-color:#e8587a;background:#fce4ec;':'border-color:#aaa;background:#fff;'">
              <span v-if="isRootFull(root)" style="color:#fff;font-size:8px;line-height:1;">
                ✓
              </span>
              <span v-else-if="isRootPart(root)" style="color:#e8587a;font-size:10px;font-weight:900;line-height:1;margin-top:-1px;">
                −
              </span>
            </div>
            <!-- 라벨 -->
            <span @click.stop="handleSelectAction('categoryTree-toggle-root', root)" style="font-size:12px;font-weight:700;color:#222;flex:1;">
              {{ root.categoryNm }}
            </span>
          </div>
          <!-- 자식 행들 -->
          <template v-if="expanded.has(root.categoryId)">
            <div style="position:relative;padding-left:26px;">
              <!-- 레벨2 세로선 (루트 → 자식들) -->
              <div style="position:absolute;left:33px;top:0;bottom:14px;width:1px;background:#d0d0d0;">
              </div>
              <div v-for="child in childrenOf(root.categoryId)" :key="child.categoryId"
                @click="handleSelectAction('categoryTree-toggle-child', child.categoryId)"
                style="display:flex;align-items:center;gap:4px;padding:4px 8px;cursor:pointer;user-select:none;"
                :style="localSel.has(child.categoryId)?'background:#fff4f6;':''">
                <!-- 수평 연결선 -->
                <div style="width:12px;height:1px;background:#d0d0d0;flex-shrink:0;">
                </div>
                <!-- 리프 공간 (expand 버튼 자리) -->
                <span style="width:13px;flex-shrink:0;">
                </span>
                <!-- 체크박스 -->
                <div style="width:13px;height:13px;border-radius:3px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
                  :style="localSel.has(child.categoryId)?'border-color:#e8587a;background:#e8587a;':'border-color:#aaa;background:#fff;'">
                  <span v-if="localSel.has(child.categoryId)" style="color:#fff;font-size:8px;line-height:1;">
                    ✓
                  </span>
                </div>
                <!-- 라벨 -->
                <span style="font-size:12px;color:#333;flex:1;">
                  {{ child.categoryNm }}
                </span>
              </div>
            </div>
          </template>
        </div>
      </div>
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
  props: {
    title: { type: String, default: '전시항목 복사', reloadTrigger: { type: Number, default: 0 } },
    displays: { type: Array, default: () => [] },   /* 전체 패널(dispDataset.displays) */
    areas:    { type: Array, default: () => [] },   /* DISP_AREA codes */
    excludePanelId: { type: Number, default: null },/* 현재 패널 제외 */
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

    /* toggleCheck */
    const toggleCheck = (id) => {
      const s = new Set(checked);
      if (s.has(id)) s.delete(id); else s.add(id);
      checked = s;
    };
    const cfAllChecked = computed(() => (pager.pageList||[]).length > 0 && (pager.pageList||[]).every(o => checked.has(o.__rowId)));

    /* toggleCheckAll */
    const toggleCheckAll = () => {
      const s = new Set(checked);
      if (cfAllChecked.value) (pager.pageList||[]).forEach(o => s.delete(o.__rowId));
      else (pager.pageList||[]).forEach(o => s.add(o.__rowId));
      checked = s;
    };

    /* pickMulti */
    const pickMulti = () => {
      const picks = cfAllRows.value.filter(o => checked.has(o.__rowId));
      if (!picks.length) return;
      emit('pick-multi', picks.map(o => ({ ...o.row })));
      checked = new Set();
    };

    /* pickOne */
    const pickOne = (o) => emit('pick-multi', [{ ...o.row }]);

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
      const codeStore = window.sfGetBoCodeStore?.();
      if (codeStore?.sgGetGrpCodes) activeStatuses.splice(0, activeStatuses.length, ...(codeStore.sgGetGrpCodes('ACTIVE_STATUS') || []));
    });

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ RowPickModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        return emit('close');
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
                    <span v-if="o.row.clickAction && o.row.clickAction !== 'none'" style="margin-left:10px;">
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
 * AreaPickModal — 전시영역 선택 팝업 (UI에 영역 추가)
 * ═══════════════════════════════════════════════════════════════════ */
window.AreaPickModal = {
  name: 'AreaPickModal',
  props: {
    title: { type: String, default: '전시영역 추가', reloadTrigger: { type: Number, default: 0 } },
    areas:    { type: Array, default: () => [] },   /* DISP_AREA codes */
    excludeUi: { type: String, default: '' },        /* 제외할 UI 코드 (이미 포함된 영역 제외) */
  },
  emits: ['close', 'pick'],
  setup(props, { emit }) {
    const { ref, reactive, computed, onMounted } = Vue;
    const searchParam = reactive({ searchType: '', searchValue: '', useYn: '' });
    const pager = reactive({ page: 1, size: 5 });
    const useYnOpts = reactive([]);
    onMounted(() => {
      try {
        const s = window.sfGetBoCodeStore?.();
        if (s?.sgGetGrpCodes) useYnOpts.splice(0, useYnOpts.length, ...(s.sgGetGrpCodes('USE_YN') || []));
      } catch(e) {}
    });
    const PAGE_SIZES = [2, 3, 4, 5, 10, 20, 50, 100];
    const selectedTreeKey = ref('');
    const treeOpen = reactive(new Set(['__root__']));

    /* toggleTree */
    const toggleTree = k => { if (treeOpen.has(k)) treeOpen.delete(k); else treeOpen.add(k); };

    /* isTreeOpen */
    const isTreeOpen = k => treeOpen.has(k);

    /* selectTree */
    const selectTree = k => { selectedTreeKey.value = selectedTreeKey.value === k ? '' : k; pager.page = 1; };

    const cfFiltered = computed(() => (props.areas || []).filter(a => {
      if (props.excludeUi && a.uiCode === props.excludeUi) return false;
      const searchVal = searchParam.searchValue.trim().toLowerCase();
      if (searchVal) {
        const types = searchParam.searchType || 'areaCd,areaNm';
        const hits = [];
        if (types.includes('areaCd')) hits.push((a.codeValue || '').toLowerCase().includes(searchVal));
        if (types.includes('areaNm')) hits.push((a.codeLabel || '').toLowerCase().includes(searchVal));
        if (!hits.some(Boolean)) return false;
      }
      if (searchParam.useYn && a.useYn !== searchParam.useYn) return false;
      if (selectedTreeKey.value) {
        const top = (a.codeValue || '').split('_')[0];
        if (top !== selectedTreeKey.value) return false;
      }
      return true;
    }).sort((a,b) => (a.codeLabel||'').localeCompare(b.codeLabel||'')));

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
      (props.areas || []).forEach(a => {
        if (props.excludeUi && a.uiCode === props.excludeUi) return;
        const top = (a.codeValue || '(기타)').split('_')[0];
        g[top] = (g[top] || 0) + 1;
      });
      return Object.keys(g).sort().map(top => ({ label: top, count: g[top] }));
    });

    /* statusCls */
    const statusCls = (y) => y === 'Y' ? 'badge-green' : 'badge-gray';

    /* onPick */
    const onPick = (a) => emit('pick', a);

    /* 멀티선택 */
    const checked = reactive(new Set());

    /* isChecked */
    const isChecked = (id) => checked.has(id);

    /* toggleCheck */
    const toggleCheck = (id) => {
      const s = new Set(checked);
      if (s.has(id)) s.delete(id); else s.add(id);
      checked = s;
    };
    const cfAllChecked = computed(() => (pager.pageList||[]).length > 0 && (pager.pageList||[]).every(a => checked.has(a.codeId)));

    /* toggleCheckAll */
    const toggleCheckAll = () => {
      const s = new Set(checked);
      if (cfAllChecked.value) (pager.pageList||[]).forEach(a => s.delete(a.codeId));
      else (pager.pageList||[]).forEach(a => s.add(a.codeId));
      checked = s;
    };

    /* pickMulti */
    const pickMulti = () => {
      const ids = Array.from(checked);
      if (!ids.length) return;
      ids.forEach(id => {
        const a = (props.areas || []).find(x => x.codeId === id);
        if (a) emit('pick', a);
      });
      checked = new Set();
    };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ AreaPickModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        return emit('close');
      // 다중 추가
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
      console.log(' ■■ AreaPickModal : handleSelectAction -> ', cmd, param);
      // 트리 펼침 토글
      if (cmd === 'tree-toggle') {
        return toggleTree(param);
      // 트리 노드 선택
      } else if (cmd === 'tree-select') {
        return selectTree(param);
      // 행 체크 토글
      } else if (cmd === 'list-toggle') {
        return toggleCheck(param);
      // 행 추가
      } else if (cmd === 'list-pick') {
        return onPick(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    return {
      searchParam, pager, PAGE_SIZES, useYnOpts,                              // 데이터
      selectedTreeKey, isTreeOpen, cfTree,                                    // 트리
      statusCls, checked, isChecked, cfAllChecked,                            // 헬퍼
      handleBtnAction, handleSelectAction,                                    // dispatch
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
        v-model="searchParam.searchType"
        :options="[
        { value: 'areaCd', label: '영역코드' },
        { value: 'areaNm', label: '영역명' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="searchParam.searchValue" placeholder="검색어 입력" style="flex:1;min-width:200px;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;" />
      <select v-model="searchParam.useYn" style="padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;">
        <option value="">
          사용 전체
        </option>
        <template v-if="useYnOpts.length">
          <option v-for="o in useYnOpts" :key="o.codeValue" :value="o.codeValue">
            {{ o.codeLabel }}
          </option>
        </template>
        <template v-else>
          <option value="Y">
            사용
          </option>
          <option value="N">
            미사용
          </option>
        </template>
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
            선택한 {{ checked.size }}개 일괄 추가
          </button>
        </div>
        <div style="flex:1;overflow-y:auto;">
          <table class="bo-table" style="margin:0;">
            <thead>
              <tr>
                <th style="width:36px;text-align:center;">
                  <input type="checkbox" :checked="cfAllChecked" @change="handleBtnAction('list-toggle-all')" />
                </th>
                <th style="width:56px;">
                  ID
                </th>
                <th>
                  영역 정보
                </th>
                <th style="width:140px;text-align:left;">
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
                  표시할 영역이 없습니다.
                </td>
              </tr>
              <tr v-for="a in pager.pageList" :key="a.codeId"
                :style="isChecked(a.codeId)?'background:#eef6fd;':''">
                <td style="text-align:center;vertical-align:top;padding-top:14px;">
                  <input type="checkbox" :checked="isChecked(a.codeId)" @change="handleSelectAction('list-toggle', a.codeId)" />
                </td>
                <td style="color:#aaa;font-size:12px;vertical-align:top;padding-top:12px;">
                  {{ a.codeId }}
                </td>
                <td style="padding:10px 12px;">
                  <div style="margin-bottom:4px;">
                    <code style="background:#f0f2f5;color:#555;padding:1px 6px;border-radius:3px;font-size:10px;">{{ a.codeValue }}</code>
                      <span style="font-size:14px;font-weight:700;color:#222;margin-left:8px;">
                        {{ a.codeLabel }}
                      </span>
                      <span class="badge" :class="statusCls(a.useYn)" style="font-size:11px;margin-left:8px;">
                        {{ a.useYn==='Y'?'사용':'미사용' }}
                      </span>
                    </div>
                    <div style="font-size:11px;color:#555;line-height:1.5;">
                      <span>
                        <b style="color:#888;">
                          유형:
                        </b>
                        {{ a.areaType || '-' }}
                      </span>
                      <span style="margin-left:10px;">
                        <b style="color:#888;">
                          표시:
                        </b>
                        {{ a.layoutType==='dashboard' ? '🧩 대시보드' : '🔲 그리드 '+(a.gridCols||1)+'열' }}
                      </span>
                      <span v-if="a.uiCode" style="margin-left:10px;">
                        <b style="color:#888;">
                          현재UI:
                        </b>
                        {{ a.uiCode }}
                      </span>
                    </div>
                  </td>
                  <td style="vertical-align:top;padding-top:12px;">
                    <span style="background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:8px;padding:1px 7px;font-size:11px;">
                      {{ (a.codeValue||'').split('_')[0] || '-' }} &gt; {{ a.codeLabel }}
                    </span>
                  </td>
                  <td style="vertical-align:top;padding-top:10px;text-align:right;">
                    <button @click="handleSelectAction('list-pick', a)" class="btn btn-primary btn-sm" style="font-size:11px;">
                      선택
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
 * PanelPickModal — 전시패널 선택 팝업 (영역에 패널 추가)
 * ═══════════════════════════════════════════════════════════════════ */
window.PanelPickModal = {
  name: 'PanelPickModal',
  props: {
    title: { type: String, default: '전시패널 추가', reloadTrigger: { type: Number, default: 0 } },
    displays: { type: Array, default: () => [] },
    areas:    { type: Array, default: () => [] },   /* DISP_AREA codes */
    excludeArea: { type: String, default: '' },     /* 제외할 영역코드 (이미 포함) */
  },
  emits: ['close', 'pick'],
  setup(props, { emit }) {
    const { ref, reactive, computed } = Vue;
    const searchParam = reactive({ searchType: '', searchValue: '', status: '' });
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

    const cfFiltered = computed(() => (props.displays || []).filter(p => {
      if (props.excludeArea && p.area === props.excludeArea) return false;
      const searchVal = searchParam.searchValue.trim().toLowerCase();
      if (searchVal) {
        const types = searchParam.searchType || 'panelNm,areaCd';
        const hits = [];
        if (types.includes('panelNm')) hits.push((p.name || '').toLowerCase().includes(searchVal));
        if (types.includes('areaCd'))  hits.push((p.area || '').toLowerCase().includes(searchVal));
        if (!hits.some(Boolean)) return false;
      }
      if (searchParam.status && p.status !== searchParam.status) return false;
      if (selectedTreeKey.value) {
        const top = (p.area || '').split('_')[0];
        if (top !== selectedTreeKey.value) return false;
      }
      return true;
    }).sort((a,b) => (a.name||'').localeCompare(b.name||'')));

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
      (props.displays || []).forEach(p => {
        if (props.excludeArea && p.area === props.excludeArea) return;
        const top = (p.area || '(미등록)').split('_')[0];
        g[top] = (g[top] || 0) + 1;
      });
      return Object.keys(g).sort().map(top => ({ label: top, count: g[top] }));
    });

    /* statusCls */
    const statusCls = (s) => s === '활성' ? 'badge-green' : 'badge-gray';

    /* onPick */
    const onPick = (p) => emit('pick', p);

    /* 멀티선택 */
    const checked = reactive(new Set());

    /* isChecked */
    const isChecked = (id) => checked.has(id);

    /* toggleCheck */
    const toggleCheck = (id) => {
      const s = new Set(checked);
      if (s.has(id)) s.delete(id); else s.add(id);
      checked = s;
    };
    const cfAllChecked = computed(() => (pager.pageList||[]).length > 0 && (pager.pageList||[]).every(p => checked.has(p.dispId)));

    /* toggleCheckAll */
    const toggleCheckAll = () => {
      const s = new Set(checked);
      if (cfAllChecked.value) (pager.pageList||[]).forEach(p => s.delete(p.dispId));
      else (pager.pageList||[]).forEach(p => s.add(p.dispId));
      checked = s;
    };

    /* pickMulti */
    const pickMulti = () => {
      const ids = Array.from(checked);
      if (!ids.length) return;
      ids.forEach(id => {
        const p = (props.displays || []).find(x => x.dispId === id);
        if (p) emit('pick', p);
      });
      checked = new Set();
    };

    Vue.onMounted(() => {
      const codeStore = window.sfGetBoCodeStore?.();
      if (codeStore?.sgGetGrpCodes) activeStatuses.splice(0, activeStatuses.length, ...(codeStore.sgGetGrpCodes('ACTIVE_STATUS') || []));
    });

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PanelPickModal : handleBtnAction -> ', cmd, param);
      // 모달 닫기
      if (cmd === 'modal-close') {
        return emit('close');
      // 다중 추가
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
      console.log(' ■■ PanelPickModal : handleSelectAction -> ', cmd, param);
      if (cmd === 'tree-toggle') {
        return toggleTree(param);
      } else if (cmd === 'tree-select') {
        return selectTree(param);
      } else if (cmd === 'list-toggle') {
        return toggleCheck(param);
      } else if (cmd === 'list-pick') {
        return onPick(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    return {
      searchParam, activeStatuses, pager, PAGE_SIZES,                         // 데이터
      selectedTreeKey, isTreeOpen, cfTree,                                    // 트리
      statusCls, areaNm, checked, isChecked, cfAllChecked,                    // 헬퍼
      handleBtnAction, handleSelectAction,                                    // dispatch
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
        v-model="searchParam.searchType"
        :options="[
        { value: 'panelNm', label: '패널명' },
        { value: 'areaCd',  label: '영역코드' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="searchParam.searchValue" placeholder="검색어 입력" style="flex:1;min-width:200px;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;" />
      <select v-model="searchParam.status" style="padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;">
        <option value="">
          상태 전체
        </option>
        <option v-for="c in activeStatuses" :key="c.codeValue" :value="c.codeValue">
          {{ c.codeLabel }}
        </option>
      </select>
    </div>
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
      <!-- 목록 -->
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
            선택한 {{ checked.size }}개 일괄 추가
          </button>
        </div>
        <div style="flex:1;overflow-y:auto;">
          <table class="bo-table" style="margin:0;">
            <thead>
              <tr>
                <th style="width:36px;text-align:center;">
                  <input type="checkbox" :checked="cfAllChecked" @change="handleBtnAction('list-toggle-all')" />
                </th>
                <th style="width:56px;">
                  ID
                </th>
                <th>
                  패널 정보
                </th>
                <th style="width:140px;text-align:left;">
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
                  표시할 패널이 없습니다.
                </td>
              </tr>
              <tr v-for="p in pager.pageList" :key="p.dispId"
                :style="isChecked(p.dispId)?'background:#eef6fd;':''">
                <td style="text-align:center;vertical-align:top;padding-top:14px;">
                  <input type="checkbox" :checked="isChecked(p.dispId)" @change="handleSelectAction('list-toggle', p.dispId)" />
                </td>
                <td style="color:#aaa;font-size:12px;vertical-align:top;padding-top:12px;">
                  #{{ p.dispId }}
                </td>
                <td style="padding:10px 12px;">
                  <div style="margin-bottom:4px;">
                    <code style="background:#f0f2f5;color:#555;padding:1px 6px;border-radius:3px;font-size:10px;">
                      {{ p.area || '(미등록)' }}
                    </code>
                      <span style="font-size:14px;font-weight:700;color:#222;margin-left:8px;">
                        {{ p.name }}
                      </span>
                      <span class="badge" :class="statusCls(p.status)" style="font-size:11px;margin-left:8px;">
                        {{ p.status }}
                      </span>
                    </div>
                    <div style="font-size:11px;color:#555;line-height:1.5;">
                      <span>
                        <b style="color:#888;">
                          영역명:
                        </b>
                        {{ areaNm(p.area) }}
                      </span>
                      <span style="margin-left:10px;">
                        <b style="color:#888;">
                          위젯:
                        </b>
                        {{ (p.rows||[]).length }}개
                      </span>
                    </div>
                  </td>
                  <td style="vertical-align:top;padding-top:12px;">
                    <span style="background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:8px;padding:1px 7px;font-size:11px;">
                      {{ (p.area||'').split('_')[0] || '-' }} &gt; {{ areaNm(p.area) }}
                    </span>
                  </td>
                  <td style="vertical-align:top;padding-top:10px;text-align:right;">
                    <button @click="handleSelectAction('list-pick', p)" class="btn btn-primary btn-sm" style="font-size:11px;">
                      선택
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
  props: {
    mode: { type: String, default: 'copy', reloadTrigger: { type: Number, default: 0 } },     /* 'copy' | 'ref' */
    widgetLibs: { type: Array, default: () => [] },
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
    const onPick = (lib) => emit('pick', lib);
    const activeStatuses = reactive([]);
    Vue.onMounted(() => {
      const codeStore = window.sfGetBoCodeStore?.();
      if (codeStore?.sgGetGrpCodes) activeStatuses.splice(0, activeStatuses.length, ...(codeStore.sgGetGrpCodes('ACTIVE_STATUS') || []));
    });

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ WidgetLibPickModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        return emit('close');
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
                    <span v-if="d.usedPaths && d.usedPaths.length">
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
  props: ['bizCd', 'value', 'title', 'reloadTrigger'],
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
    const confirm = () => { emit('select', selectedId.value); emit('close'); };
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
        return emit('close');
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
  props: ['node', 'expanded', 'selected', 'addParent', 'editingId', 'editLabel',
          'onToggle', 'onSelect', 'onSetParent', 'onConfirm',
          'onStartEdit', 'onSaveEdit', 'onCancelEdit', 'onUpdateLabel', 'onDelete', 'depth', 'reloadTrigger'],
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
      background: selected===ch.pathId ? '#fef2f4' : (addParent===ch.pathId ? '#ecfdf5' : 'transparent'),
      color:      selected===ch.pathId ? '#e8587a' : '#374151',
      fontWeight: selected===ch.pathId ? 700 : 500, fontSize:'13px',
      borderLeft: selected===ch.pathId ? '3px solid #e8587a' : '3px solid transparent'}"
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
    <div v-if="expanded.has(ch.pathId) && (ch.children||[]).length>0" :style="{position:'relative'}">
    <span :style="{position:'absolute',left:(depth*20 + 16)+'px',top:'0',bottom: (ci===node.children.length-1) ? '50%' : '0',width:'1px',borderLeft:'1px dotted #cbd5e1',pointerEvents:'none'}">
    </span>
    <path-pick-tree-node :node="ch" :expanded="expanded" :selected="selected" :add-parent="addParent"
        :editing-id="editingId" :edit-label="editLabel"
        :on-toggle="onToggle" :on-select="onSelect" :on-set-parent="onSetParent" :on-confirm="onConfirm"
        :on-start-edit="onStartEdit" :on-save-edit="onSaveEdit" :on-cancel-edit="onCancelEdit"
        :on-update-label="onUpdateLabel" :on-delete="onDelete" :depth="depth+1" />
  </div>
  <span v-if="depth > 0 && ci < node.children.length - 1" :style="{position:'absolute',left:(depth*20 + 16 - 20)+'px',top:'0',bottom:'0',width:'1px',borderLeft:'1px dotted #cbd5e1',pointerEvents:'none'}">
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
  props: ['value', 'title', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed } = Vue;
    const searchParam = reactive({ searchType: '', searchValue: '', type: '' });
    const searchParamOrg = reactive({ searchType: '', searchValue: '', type: '' });
    const bizs = reactive([]);

    /* 목록조회 */
    const handleSearchList = async () => {
      try {
        const res = await boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 10000 }, '판매자관리', '목록조회');
        bizs.splice(0, bizs.length, ...(res.data?.data?.list || []));
      } catch (_) {}
    };

    /* 목록조회 */
    const onSearch = () => { handleSearchList(); };

    /* onReset */
    const onReset = () => { Object.assign(searchParam, searchParamOrg); handleSearchList(); };
    Vue.onMounted(() => { handleSearchList(); });
    Vue.watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchList(); });
    const VENDOR_TYPES = [['SALES','판매업체'],['DELIVERY','배송업체'],['PARTNER','제휴사'],['INTERNAL','내부법인']];

    /* vtLabel */
    const vtLabel = (cd) => (VENDOR_TYPES.find(v=>v[0]===cd) || [,cd])[1];

    /* vtBadge */
    const vtBadge = (cd) => ({ SALES:'badge-blue', DELIVERY:'badge-purple', PARTNER:'badge-teal', INTERNAL:'badge-gray' }[cd] || 'badge-gray');

    /* 좌측 표시경로 트리 (sy_biz) */
    const selectedPathId = ref(null);
    const expanded = reactive(new Set([null]));
    const cfTree = computed(() => boUtil.bofBuildPathTree('sy_biz'));

    /* toggleNode */
    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };

    /* selectNode */
    const selectNode = (id) => { selectedPathId.value = id; };
    Vue.onMounted(() => {
      const initSet = coUtil.cofCollectExpandedToDepth(cfTree.value, 2);
      expanded.clear(); initSet.forEach(v => expanded.add(v));
    });
    const cfAllowedPathIds = computed(() => selectedPathId.value == null ? null : boUtil.bofGetPathDescendants('sy_biz', selectedPathId.value));

    const cfFiltered = computed(() => bizs.filter(b => {
      const k = searchParam.searchValue.trim().toLowerCase();
      if (k) {
        const types = searchParam.searchType || 'bizNo,bizNm,ceoNm';
        const hits = [];
        if (types.includes('bizNo')) hits.push((b.bizNo || '').includes(k));
        if (types.includes('bizNm')) hits.push((b.bizNm || '').toLowerCase().includes(k));
        if (types.includes('ceoNm')) hits.push((b.ceoNm || '').toLowerCase().includes(k));
        if (!hits.some(Boolean)) return false;
      }
      if (searchParam.type && b.vendorTypeCd !== searchParam.type) return false;
      if (cfAllowedPathIds.value && !cfAllowedPathIds.value.has(b.pathId)) return false;
      return true;
    }));

    /* pickAndClose */
    const pickAndClose = (b) => { emit('select', b); emit('close'); };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BizPickModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        return emit('close');
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

    return {
      searchParam, VENDOR_TYPES, vtLabel, vtBadge, cfFiltered,                // 데이터
      selectedPathId, expanded, cfTree,                                       // 트리
      toggleNode, selectNode,                                                 // 트리 헬퍼 (자식 컴포넌트 props 전달용)
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
      <div style="display:flex;gap:6px;margin-top:12px;">
        <bo-multi-check-select
          v-model="searchParam.searchType"
          :options="[
          { value: 'bizNo', label: '사업자번호' },
          { value: 'bizNm', label: '상호' },
          { value: 'ceoNm', label: '대표자' },
          ]"
          placeholder="검색대상 전체"
          all-label="전체 선택"
          min-width="160px" />
        <input class="form-control" v-model="searchParam.searchValue" placeholder="검색어 입력" style="flex:1;height:32px;font-size:12px;" @keyup.enter="handleBtnAction('searchParam-search')" />
        <select class="form-control" v-model="searchParam.type" style="width:140px;height:32px;font-size:12px;">
          <option value="">
            업체유형 전체
          </option>
          <option v-for="v in VENDOR_TYPES" :key="v[0]" :value="v[0]">
            {{ v[1] }}
          </option>
        </select>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('searchParam-search')">
          조회
        </button>
        <button class="btn btn-secondary btn-sm" @click="handleBtnAction('searchParam-reset')">
          초기화
        </button>
      </div>
    </div>
    <div style="background:#fafbfc;display:grid;grid-template-columns:200px 1fr;max-height:50vh;">
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
        <table class="bo-table" style="background:#fff;">
          <thead>
            <tr>
              <th>
                업체유형
              </th>
              <th>
                사업자번호
              </th>
              <th>
                상호
              </th>
              <th>
                대표자
              </th>
              <th>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cfFiltered.length===0">
              <td colspan="5" style="text-align:center;color:#999;padding:30px;">
                검색 결과가 없습니다.
              </td>
            </tr>
            <tr v-for="b in cfFiltered" :key="b.bizId" @dblclick="handleSelectAction('list-pick', b)" style="cursor:pointer;">
              <td>
                <span class="badge" :class="vtBadge(b.vendorTypeCd)" style="font-size:10px;">
                  {{ vtLabel(b.vendorTypeCd) }}
                </span>
              </td>
              <td>
                <code style="font-size:11px;background:#f0f4ff;padding:2px 6px;border-radius:3px;color:#2563eb;">{{ b.bizNo }}</code>
                </td>
                <td style="font-weight:600;">
                  {{ b.bizNm }}
                </td>
                <td>
                  {{ b.ceoNm }}
                </td>
                <td style="text-align:right;">
                  <button class="btn btn-primary btn-xs" @click="handleSelectAction('list-pick', b)">
                    선택
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div style="padding:14px 22px;display:flex;justify-content:flex-end;background:#fff;border-top:1px solid #eef0f3;">
        <button class="btn btn-secondary" @click="handleBtnAction('modal-close')">
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
  props: ['title', 'excludeIds', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed } = Vue;
    const searchParam = reactive({ searchType: '', searchValue: '' });
    const boUsers = reactive([]);

    /* 목록조회 */
    const handleSearchList = async () => {
      try {
        const res = await boApiSvc.syUser.getPage({ pageNo: 1, pageSize: 1000 }, '사용자관리', '목록조회');
        boUsers.splice(0, boUsers.length, ...(res.data?.data?.list || []));
      } catch (_) {}
    };

    /* 목록조회 */
    const onSearch = () => { handleSearchList(); };

    /* onReset */
    const onReset = () => { searchParam.searchType = ''; searchParam.searchValue = ''; handleSearchList(); };
    Vue.onMounted(() => { handleSearchList(); });
    Vue.watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchList(); });
    const cfExcl = computed(() => new Set(props.excludeIds || []));
    const cfFiltered = computed(() => boUsers.filter(u => {
      if (cfExcl.value.has(u.boUserId)) return false;
      const k = searchParam.searchValue.trim().toLowerCase();
      if (k) {
        const types = searchParam.searchType || 'nm,loginId,email';
        const hits = [];
        if (types.includes('nm'))      hits.push((u.name    || '').toLowerCase().includes(k));
        if (types.includes('loginId')) hits.push((u.loginId || '').toLowerCase().includes(k));
        if (types.includes('email'))   hits.push((u.email   || '').toLowerCase().includes(k));
        if (!hits.some(Boolean)) return false;
      }
      return true;
    }));

    /* pick */
    const pick = (u) => { emit('select', u); emit('close'); };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SimpleUserPickModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        return emit('close');
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
    return {
      searchParam, cfFiltered,                                                // 데이터
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
      <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap;">
        <bo-multi-check-select
          v-model="searchParam.searchType"
          :options="[
          { value: 'nm',      label: '이름' },
          { value: 'loginId', label: '로그인ID' },
          { value: 'email',   label: '이메일' },
          ]"
          placeholder="검색대상 전체"
          all-label="전체 선택"
          min-width="140px" />
        <input class="form-control" v-model="searchParam.searchValue" placeholder="검색어 입력" style="flex:1;min-width:200px;height:32px;font-size:12px;" @keyup.enter="handleBtnAction('searchParam-search')" />
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('searchParam-search')">
          조회
        </button>
        <button class="btn btn-secondary btn-sm" @click="handleBtnAction('searchParam-reset')">
          초기화
        </button>
      </div>
    </div>
    <div style="background:#fafbfc;max-height:50vh;overflow:auto;">
      <table class="bo-table" style="background:#fff;">
        <thead>
          <tr>
            <th>
              이름
            </th>
            <th>
              로그인ID
            </th>
            <th>
              이메일
            </th>
            <th>
              부서
            </th>
            <th>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cfFiltered.length===0">
            <td colspan="5" style="text-align:center;color:#999;padding:30px;">
              결과가 없습니다.
            </td>
          </tr>
          <tr v-for="u in cfFiltered" :key="u.boUserId" @dblclick="handleSelectAction('list-pick', u)" style="cursor:pointer;">
            <td style="font-weight:600;">
              {{ u.name }}
            </td>
            <td>
              <code style="font-size:11px;color:#2563eb;">{{ u.loginId }}</code>
              </td>
              <td style="font-size:11.5px;color:#0369a1;">
                {{ u.email }}
              </td>
              <td style="font-size:11.5px;color:#666;">
                {{ u.dept }}
              </td>
              <td style="text-align:right;">
                <button class="btn btn-primary btn-xs" @click="handleSelectAction('list-pick', u)">
                  선택
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="padding:14px 22px;display:flex;justify-content:flex-end;background:#fff;border-top:1px solid #eef0f3;">
        <button class="btn btn-secondary" @click="handleBtnAction('modal-close')">
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
  props: {
    show:       { type: Boolean, default: false },
    vendors:    { type: Array,   default: () => [] },
    selectedId: { type: [String, Number], default: '' },
    title:      { type: String,  default: '판매업체 선택' },
    width:      { type: String,  default: '400px' },
  },
  emits: ['select', 'close'],
  setup(_, { emit }) {
    const onPick = (v) => { emit('select', v); emit('close'); };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SimpleVendorPickModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        return emit('close');
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
    return {
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="show" :title="title" :width="width" body-pad="0" @close="handleBtnAction('modal-close')">
  <div style="max-height:400px;overflow-y:auto;">
    <div v-for="v in vendors" :key="v && v.vendorId" style="padding:12px 16px;border-bottom:1px solid #f0f0f0;cursor:pointer;display:flex;justify-content:space-between;align-items:center;" :style="selectedId===v.vendorId?{background:'#f0f4ff',color:'#1565c0'}:{}" @click="handleSelectAction('vendors-pick', v)">
    <span style="font-weight:500;">
      {{ v.vendorNm }}
    </span>
    <span v-if="selectedId===v.vendorId" style="color:#1565c0;font-weight:700;">
      ✓
    </span>
  </div>
  <div v-if="!vendors.length" style="padding:20px;text-align:center;color:#aaa;font-size:13px;">
    판매업체가 없습니다.
  </div>
</div>
<template #footer>
  <button class="btn btn-secondary btn-sm" @click="handleBtnAction('modal-close')">
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
  props: {
    show:     { type: Boolean, default: false },
    title:    { type: String,  default: '회원 선택' },
    subtitle: { type: String,  default: '회원을 선택해주세요' },
    uiNm:     { type: String,  default: '주문관리' },
    pageSize: { type: Number,  default: 20 },
    reloadTrigger: { type: Number, default: 0 },
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { reactive, watch } = Vue;
    const state = reactive({
      searchType: '', searchValue: '',
      rows: [], pageNo: 1, total: 0, totalPage: 1, loading: false,
    });

    /* handleSearch */
    const handleSearch = async () => {
      state.loading = true;
      try {
        const params = { pageNo: state.pageNo, pageSize: props.pageSize,
          searchValue: state.searchValue || undefined,
          searchType: state.searchType || undefined };
        if (params.searchValue && !params.searchType) params.searchType = 'memberNm,loginId';
        const res = await boApiSvc.mbMember.getPage(params, props.uiNm, '회원검색');
        const d = res.data?.data || {};
        state.rows = d.pageList || [];
        state.total = d.pageTotalCount || 0;
        state.totalPage = d.pageTotalPage || 1;
      } catch (_) { state.rows = []; state.total = 0; state.totalPage = 1; }
      finally { state.loading = false; }
    };
    const onPickSearch = () => { state.pageNo = 1; handleSearch(); };
    const onPickPage   = (n) => { state.pageNo = n; handleSearch(); };
    const onSelect     = (m) => { emit('select', m); emit('close'); };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ OdMemberPickModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        return emit('close');
      } else if (cmd === 'searchParam-search') {
        return onPickSearch();
      } else if (cmd === 'pager-set') {
        return onPickPage(param);
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
    const reset = () => { state.searchType=''; state.searchValue=''; state.rows=[]; state.pageNo=1; handleSearch(); };
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

    return {
      state, memberPickGridColumns,                                          // 데이터
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
      <div style="display:flex;gap:8px;margin-top:12px;">
        <div style="position:relative;flex:1;">
          <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:14px;z-index:1;">
            🔍
          </span>
          <bo-multi-check-select
            v-model="state.searchType"
            :options="[
            { value: 'memberNm', label: '이름' },
            { value: 'loginId',  label: '아이디' },
            ]"
            placeholder="검색대상 전체"
            all-label="전체 선택"
            min-width="140px" />
          <input v-model="state.searchValue" @keyup.enter="handleBtnAction('searchParam-search')" class="form-control" placeholder="검색어 입력" style="padding-left:32px;border-radius:8px;" />
        </div>
        <button class="btn btn-primary" @click="handleBtnAction('searchParam-search')" style="border-radius:8px;">
          검색
        </button>
      </div>
    </div>
    <div style="padding:8px 24px;background:#fafafa;border-bottom:1px solid #f0f0f0;font-size:12px;color:#6b7280;flex-shrink:0;">
      총
      <strong style="color:#e11d48;">
        {{ state.total.toLocaleString() }}
      </strong>
      명
    </div>
    <div style="flex:1;overflow-y:auto;">
      <div v-if="state.loading" style="text-align:center;padding:40px;color:#aaa;">
        조회 중...
      </div>
      <bo-grid v-else bare row-clickable :columns="memberPickGridColumns" :rows="state.rows" row-key="memberId"
        :row-style="() => 'cursor:pointer;'" empty-text="조회 결과가 없습니다."
        @row-click="(row) => handleSelectAction('members-pick', row)" row-actions>
        <template #row-actions="{ row }">
          <button class="btn btn-primary btn-xs" @click.stop="handleSelectAction('members-pick', row)" style="border-radius:6px;font-size:11px;">
            선택
          </button>
        </template>
      </bo-grid>
    </div>
    <div style="padding:10px 24px;border-top:1px solid #f0f0f0;background:#fafafa;flex-shrink:0;display:flex;justify-content:center;">
      <div class="pager" v-if="state.totalPage > 1">
        <button class="btn btn-secondary btn-sm" :disabled="state.pageNo <= 1" @click="handleBtnAction('pager-set', state.pageNo - 1)">
          이전
        </button>
        <template v-for="n in state.totalPage" :key="n">
          <button v-if="Math.abs(n - state.pageNo) <= 3" :class="['btn btn-sm', n === state.pageNo ? 'btn-primary' : 'btn-secondary']" @click="handleBtnAction('pager-set', n)">
            {{ n }}
          </button>
        </template>
        <button class="btn btn-secondary btn-sm" :disabled="state.pageNo >= state.totalPage" @click="handleBtnAction('pager-set', state.pageNo + 1)">
          다음
        </button>
      </div>
      <span v-else style="font-size:12px;color:#aaa;line-height:32px;">
        총 {{ state.total }}명
      </span>
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
  props: {
    show:        { type: Boolean, default: false },
    prods:       { type: Array,   default: () => [] },
    selectedIds: { type: Array,   default: () => [] },
    title:       { type: String,  default: '상품 선택' },
    width:       { type: String,  default: '600px' },
  },
  emits: ['toggle', 'close'],
  setup(props, { emit }) {
    const { ref, computed } = Vue;
    const search = ref('');
    const cfFiltered = computed(() => {
      const k = (search.value || '').trim().toLowerCase();
      if (!k) return props.prods;
      return props.prods.filter(p => (p.prodNm || '').toLowerCase().includes(k));
    });
    const isSelected = (id) => (props.selectedIds || []).includes(id);
    const onToggle = (p) => emit('toggle', p.productId);

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SimpleProdPickModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        return emit('close');
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
    return {
      search, cfFiltered, isSelected,                                         // 데이터
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="show" :title="title" :width="width" body-pad="0" @close="handleBtnAction('modal-close')">
  <div style="padding:12px;border-bottom:1px solid #f0f0f0;">
    <input v-model="search" type="text" placeholder="상품명 검색" class="form-control" style="width:100%;" />
  </div>
  <div style="max-height:50vh;overflow-y:auto;">
    <div v-if="cfFiltered.length===0" style="text-align:center;color:#999;padding:40px;">
      상품이 없습니다.
    </div>
    <label v-for="p in cfFiltered" :key="p && p.productId" style="display:flex;align-items:center;padding:10px 16px;border-bottom:1px solid #f0f0f0;cursor:pointer;gap:10px;" :style="isSelected(p.productId)?'background:#ede7f6;':''">
    <input type="checkbox" :checked="isSelected(p.productId)" @change="handleSelectAction('prods-toggle', p)" />
    <span style="flex:1;font-weight:600;font-size:12px;color:#222;">
      {{ p.prodNm }}
    </span>
    <span style="font-size:11px;color:#888;">
      {{ (p.price||0).toLocaleString() }}원
    </span>
  </label>
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
  props: {
    state:         { type: Object, default: () => ({}) }, // 공유 상태
    reloadTrigger: { type: Number, default: 0 }, // 재조회 트리거
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { reactive, watch } = Vue;

    /* close */
    const close = () => emit('close');
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

    return {
      member, product, order, claim, coupon, badgeCls, s,                     // 데이터
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
    <template v-if="member.userId">
      <div class="detail-row">
        <span class="detail-label">
          회원ID
        </span>
        <span class="detail-value">
          {{ member.userId }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          이름
        </span>
        <span class="detail-value">
          {{ member.memberNm }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          이메일
        </span>
        <span class="detail-value">
          {{ member.email }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          연락처
        </span>
        <span class="detail-value">
          {{ member.phone }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          등급
        </span>
        <span class="detail-value">
          <span class="badge badge-purple">
            {{ member.gradeCd }}
          </span>
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          상태
        </span>
        <span class="detail-value">
          <span class="badge" :class="badgeCls(member.statusCd)">
            {{ member.statusCd }}
          </span>
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          가입일
        </span>
        <span class="detail-value">
          {{ member.joinDate }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          최근 로그인
        </span>
        <span class="detail-value">
          {{ member.lastLogin }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          주문수
        </span>
        <span class="detail-value">
          {{ member.orderCount }}건
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          총 구매액
        </span>
        <span class="detail-value">
          {{ member.totalPurchase.toLocaleString() }}원
        </span>
      </div>
    </template>
    <div v-else style="color:#999;text-align:center;padding:20px;">
      회원 정보를 찾을 수 없습니다.
    </div>
  </template>
  <!-- 상품 -->
  <template v-else-if="s.type==='product'">
    <template v-if="product.productId">
      <div class="detail-row">
        <span class="detail-label">
          상품ID
        </span>
        <span class="detail-value">
          {{ product.productId }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          상품명
        </span>
        <span class="detail-value">
          {{ product.prodNm }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          카테고리
        </span>
        <span class="detail-value">
          {{ product.category }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          가격
        </span>
        <span class="detail-value">
          {{ product.price.toLocaleString() }}원
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          재고
        </span>
        <span class="detail-value">
          {{ product.stock }}개
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          브랜드
        </span>
        <span class="detail-value">
          {{ product.brand }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          상태
        </span>
        <span class="detail-value">
          <span class="badge" :class="badgeCls(product.statusCd)">
            {{ product.statusCd }}
          </span>
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          등록일
        </span>
        <span class="detail-value">
          {{ product.regDate }}
        </span>
      </div>
    </template>
    <div v-else style="color:#999;text-align:center;padding:20px;">
      상품 정보를 찾을 수 없습니다.
    </div>
  </template>
  <!-- 주문 -->
  <template v-else-if="s.type==='order'">
    <template v-if="order.orderId">
      <div class="detail-row">
        <span class="detail-label">
          주문ID
        </span>
        <span class="detail-value">
          {{ order.orderId }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          회원
        </span>
        <span class="detail-value">
          {{ order.userNm }} (ID: {{ order.userId }})
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          주문일시
        </span>
        <span class="detail-value">
          {{ order.orderDate }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          상품
        </span>
        <span class="detail-value">
          {{ order.prodNm }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          결제금액
        </span>
        <span class="detail-value">
          {{ order.totalPrice.toLocaleString() }}원
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          결제수단
        </span>
        <span class="detail-value">
          {{ order.payMethodCd }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          상태
        </span>
        <span class="detail-value">
          <span class="badge" :class="badgeCls(order.statusCd)">
            {{ order.statusCd }}
          </span>
        </span>
      </div>
    </template>
    <div v-else style="color:#999;text-align:center;padding:20px;">
      주문 정보를 찾을 수 없습니다.
    </div>
  </template>
  <!-- 클레임 -->
  <template v-else-if="s.type==='claim'">
    <template v-if="claim.claimId">
      <div class="detail-row">
        <span class="detail-label">
          클레임ID
        </span>
        <span class="detail-value">
          {{ claim.claimId }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          회원
        </span>
        <span class="detail-value">
          {{ claim.userNm }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          주문ID
        </span>
        <span class="detail-value">
          {{ claim.orderId }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          유형
        </span>
        <span class="detail-value">
          <span class="badge badge-orange">
            {{ claim.type }}
          </span>
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          상태
        </span>
        <span class="detail-value">
          <span class="badge" :class="badgeCls(claim.statusCd)">
            {{ claim.statusCd }}
          </span>
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          상품명
        </span>
        <span class="detail-value">
          {{ claim.prodNm }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          사유
        </span>
        <span class="detail-value">
          {{ claim.reasonCd }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          신청일
        </span>
        <span class="detail-value">
          {{ claim.requestDate }}
        </span>
      </div>
      <div class="detail-row" v-if="claim.refundAmount">
        <span class="detail-label">
          환불금액
        </span>
        <span class="detail-value">
          {{ claim.refundAmount.toLocaleString() }}원
        </span>
      </div>
    </template>
    <div v-else style="color:#999;text-align:center;padding:20px;">
      클레임 정보를 찾을 수 없습니다.
    </div>
  </template>
  <!-- 쿠폰 -->
  <template v-else-if="s.type==='coupon'">
    <template v-if="coupon.couponId">
      <div class="detail-row">
        <span class="detail-label">
          쿠폰ID
        </span>
        <span class="detail-value">
          {{ coupon.couponId }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          쿠폰명
        </span>
        <span class="detail-value">
          {{ coupon.name }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          코드
        </span>
        <span class="detail-value">
          {{ coupon.code }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          할인
        </span>
        <span class="detail-value">
          {{ coupon.discountTypeCd==='rate'?coupon.discountValue+'%':coupon.discountTypeCd==='shipping'?'무료배송':coupon.discountValue.toLocaleString()+'원' }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          최소주문
        </span>
        <span class="detail-value">
          {{ coupon.minOrder ? coupon.minOrder.toLocaleString()+'원 이상' : '제한없음' }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          발급대상
        </span>
        <span class="detail-value">
          {{ coupon.issueTo }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          만료일
        </span>
        <span class="detail-value">
          {{ coupon.expiry }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">
          상태
        </span>
        <span class="detail-value">
          <span class="badge" :class="badgeCls(coupon.statusCd)">
            {{ coupon.statusCd }}
          </span>
        </span>
      </div>
    </template>
    <div v-else style="color:#999;text-align:center;padding:20px;">
      쿠폰 정보를 찾을 수 없습니다.
    </div>
  </template>
  <div style="margin-top:16px;text-align:right;">
    <button class="btn btn-secondary" @click="handleBtnAction('modal-close')">
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
  props: {
    show:    { type: Boolean, default: false },
    codeGrp: { type: String,  default: '' },
    title:   { type: String,  default: '' },
  },
  emits: ['close', 'select'],
  setup(props, { emit }) {
    const { ref, computed, watch } = Vue;
    const codes = ref([]);
    const loading = ref(false);
    const error = ref('');
    const tab = ref('list'); // 'list' | 'tree'

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

    /* onClose */
    const onClose  = () => emit('close');

    /* onSelect */
    const onSelect = (row) => emit('select', row);

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

    return {
      codes, loading, error, tab, cfTree, cfHasTree, onSelect,                 // 데이터
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
        <table v-else-if="tab==='list'" class="bo-table" style="width:100%;font-size:12px;">
          <thead>
            <tr>
              <th style="width:36px;text-align:center;">
                번호
              </th>
              <th style="width:120px;">
                코드ID
              </th>
              <th style="width:160px;">
                코드값
              </th>
              <th>
                코드명
              </th>
              <th style="width:60px;text-align:center;">
                레벨
              </th>
              <th style="width:140px;">
                부모코드값
              </th>
              <th style="width:60px;text-align:right;">
                정렬
              </th>
              <th style="width:50px;text-align:center;">
                사용
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in codes" :key="(row && (row.codeId || row.codeValue)) || idx" @dblclick="handleSelectAction('codes-pick', row)" style="cursor:pointer;" title="더블클릭하여 선택">
            <td style="text-align:center;color:#999;">
              {{ idx + 1 }}
            </td>
            <td>
              <code style="background:#f3e5f5;padding:2px 6px;border-radius:4px;font-family:monospace;color:#6a1b9a;font-size:11px;">
                {{ row.codeId }}
              </code>
              </td>
              <td>
                <code style="background:#f5f5f7;padding:2px 6px;border-radius:4px;font-family:monospace;color:#1565c0;">
                {{ row.codeValue }}
              </code>
                </td>
                <td>
                  {{ row.codeLabel }}
                </td>
                <td style="text-align:center;">
                  <span class="badge" :class="row.codeLevel===1?'badge-blue':row.codeLevel===2?'badge-green':'badge-orange'" style="font-size:10px;">
                    L{{ row.codeLevel }}
                  </span>
                </td>
                <td>
                  <code v-if="row.parentCodeValue" style="background:#fafafa;padding:2px 6px;border-radius:4px;font-family:monospace;color:#888;font-size:11px;">
                {{ row.parentCodeValue }}
              </code>
                    <span v-else style="color:#ccc;">
                      -
                    </span>
                  </td>
                  <td style="text-align:right;color:#666;">
                    {{ row.sortOrd != null ? row.sortOrd : '-' }}
                  </td>
                  <td style="text-align:center;">
                    <span :class="['badge', row.useYn==='Y' ? 'badge-green' : 'badge-gray']" style="font-size:10px;">
                      {{ row.useYn || '-' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
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
              총 {{ codes.length }}건 · 행 더블클릭 시 선택
            </span>
            <button class="btn btn-secondary btn-sm" @click="handleBtnAction('modal-close')">
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
  props: {
    node:  { type: Object, required: true },
    depth: { type: Number, default: 0 },
  },
  emits: ['select'],
  setup(props, { emit }) {
    const { ref } = Vue;
    const open = ref(true);

    /* onSelect */
    const onSelect = (n) => emit('select', n);

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
    <button v-if="node.children && node.children.length" type="button" @click.stop="handleBtnAction('codes-toggle')" style="border:none;background:transparent;cursor:pointer;font-size:11px;color:#666;width:16px;">
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
    <ul v-if="open && node.children && node.children.length" style="list-style:none;padding-left:0;margin:0;">
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
  props: {
    show:       { type: Boolean, default: false },
    form:       { type: Object,  required: true },          // profileForm reactive (name/phone/email/dept)
    img:        { type: Object,  default: () => ({}) },      // profileImg reactive (cdnImgUrl)
    uploading:  { type: Boolean, default: false },           // profileImgUploading
    authUser:   { type: Object,  default: () => ({}) },      // currentAuthUser
  },
  emits: ['save', 'img-change', 'img-remove', 'close'],
  setup(props, { emit }) {
    const fnInitial = () => ((props.authUser?.authNm || props.authUser?.name || '').charAt(0)) || '?';

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ AuthProfileModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        return emit('close');
      } else if (cmd === 'modal-save') {
        return emit('save');
      } else if (cmd === 'form-img-change') {
        return emit('img-change', param);
      } else if (cmd === 'form-img-remove') {
        return emit('img-remove');
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
    <button class="btn btn-secondary" @click="handleBtnAction('modal-close')">
      취소
    </button>
    <button class="btn btn-primary" @click="handleBtnAction('modal-save')">
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
  props: {
    modal:     { type: Object, required: true },  // userPickModal reactive (show/searchValue/pageNo/loading)
    rows:      { type: Array,  default: () => [] },   // cfPickRows
    total:     { type: Number, default: 0 },          // cfPickTotal
    totalPage: { type: Number, default: 1 },          // cfPickTotalPage
    loginId:   { type: String, default: '' },         // loginForm.loginId (선택 행 강조용)
    pageSize:  { type: Number, default: 20 },
  },
  emits: ['search', 'go-page', 'pick', 'close'],
  setup(_, { emit }) {
    const fnPageVisible = (p, cur, last) => Math.abs(p - cur) <= 2 || p === 1 || p === last;

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ AuthUserPickModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        return emit('close');
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
        return emit('pick', param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };
    return {
      fnPageVisible,                                                           // 헬퍼
      handleBtnAction, handleSelectAction,                                     // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="modal.show" width="820px" max-width="96vw" box-pad="0" body-pad="0"
  z-index="1100" @close="handleBtnAction('modal-close')">
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
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        <div style="position:relative;flex:1;">
          <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#ccc;font-size:13px;">
            🔍
          </span>
          <input class="form-control" v-model="modal.searchValue" placeholder="이름 / 로그인ID / 이메일 검색..."
            @keyup.enter="handleBtnAction('searchParam-search')" style="padding-left:32px;height:34px;" />
        </div>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('searchParam-search')" style="padding:0 16px;font-weight:700;">
          조회
        </button>
      </div>
      <!-- 건수 -->
      <div style="font-size:11px;color:#aaa;margin-bottom:8px;">
        총
        <b style="color:#e8587a;">
          {{ total }}
        </b>
        명
      </div>
      <!-- 테이블 -->
      <div style="overflow-x:auto;border-radius:8px;border:1px solid #f0e0e8;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:linear-gradient(90deg,#fdf0f4,#fce8ef);">
              <th style="padding:6px 8px;text-align:center;width:32px;font-weight:700;color:#c04070;border-bottom:2px solid #f5c0d0;white-space:nowrap;">
                번호
              </th>
              <th style="padding:6px 8px;text-align:left;font-weight:700;color:#c04070;border-bottom:2px solid #f5c0d0;">
                이름
              </th>
              <th style="padding:6px 8px;text-align:left;font-weight:700;color:#c04070;border-bottom:2px solid #f5c0d0;">
                로그인ID
              </th>
              <th style="padding:6px 8px;text-align:left;font-weight:700;color:#c04070;border-bottom:2px solid #f5c0d0;">
                사이트
              </th>
              <th style="padding:6px 8px;text-align:left;font-weight:700;color:#c04070;border-bottom:2px solid #f5c0d0;">
                부서
              </th>
              <th style="padding:6px 8px;text-align:left;font-weight:700;color:#c04070;border-bottom:2px solid #f5c0d0;">
                권한
              </th>
              <th style="padding:6px 8px;text-align:center;font-weight:700;color:#c04070;border-bottom:2px solid #f5c0d0;">
                상태
              </th>
              <th style="padding:6px 8px;text-align:left;font-weight:700;color:#c04070;border-bottom:2px solid #f5c0d0;">
                이메일
              </th>
              <th style="padding:6px 8px;text-align:center;width:44px;border-bottom:2px solid #f5c0d0;">
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="modal.loading">
              <td colspan="9" style="text-align:center;color:#ccc;padding:24px;font-size:12px;">
                ⏳ 조회 중...
              </td>
            </tr>
            <tr v-else-if="!rows.length">
              <td colspan="9" style="text-align:center;color:#ccc;padding:24px;font-size:12px;">
                🔍 검색 결과가 없습니다.
              </td>
            </tr>
            <template v-else>
              <tr v-for="(u, idx) in rows" :key="u.loginId || u.userId"
                @click="handleSelectAction('users-pick', u)"
                :style="loginId===(u.loginId||u.userId)
                ? 'background:#fff0f4;cursor:pointer;'
                : 'background:'+(idx%2===0?'#fff':'#fdfafe')+';cursor:pointer;'"
                onmouseover="this.style.background='#fff5f8'" onmouseout="this.style.background=''">
                <td style="padding:5px 8px;text-align:center;color:#ccc;font-size:11px;border-bottom:1px solid #f5eef2;">
                  {{ (modal.pageNo-1)*pageSize+idx+1 }}
                </td>
                <td style="padding:5px 8px;border-bottom:1px solid #f5eef2;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#f9a8c9,#e8587a);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                      {{ (u.userNm||u.label||'?').charAt(0) }}
                    </div>
                    <span style="font-weight:700;color:#1a1a2e;white-space:nowrap;">
                      {{ u.userNm || u.label || '-' }}
                    </span>
                  </div>
                </td>
                <td style="padding:5px 8px;color:#888;border-bottom:1px solid #f5eef2;font-family:monospace;font-size:11px;">
                  {{ u.loginId }}
                </td>
                <td style="padding:5px 8px;color:#777;border-bottom:1px solid #f5eef2;white-space:nowrap;">
                  {{ u.siteNm || '-' }}
                </td>
                <td style="padding:5px 8px;color:#777;border-bottom:1px solid #f5eef2;white-space:nowrap;">
                  {{ u.deptNm || '-' }}
                </td>
                <td style="padding:5px 8px;border-bottom:1px solid #f5eef2;">
                  <span v-if="u.roleNm" style="display:inline-block;padding:1px 7px;border-radius:9px;background:#ede9fe;color:#7c3aed;font-size:10px;font-weight:700;white-space:nowrap;">
                    {{ u.roleNm }}
                  </span>
                  <span v-else style="color:#ddd;">
                    —
                  </span>
                </td>
                <td style="padding:5px 8px;text-align:center;border-bottom:1px solid #f5eef2;">
                  <span v-if="u.userStatusCd==='ACTIVE'" style="display:inline-block;padding:1px 8px;border-radius:9px;background:#dcfce7;color:#16a34a;font-size:10px;font-weight:700;">
                    활성
                  </span>
                  <span v-else style="display:inline-block;padding:1px 8px;border-radius:9px;background:#fee2e2;color:#dc2626;font-size:10px;font-weight:700;">
                    {{ u.userStatusCdNm || '비활성' }}
                  </span>
                </td>
                <td style="padding:5px 8px;color:#999;font-size:11px;border-bottom:1px solid #f5eef2;">
                  {{ u.userEmail || '-' }}
                </td>
                <td style="padding:5px 8px;text-align:center;border-bottom:1px solid #f5eef2;">
                  <button @click.stop="handleSelectAction('users-pick', u)" style="background:linear-gradient(135deg,#f9a8c9,#e8587a);color:#fff;border:none;border-radius:6px;padding:3px 10px;font-size:10px;font-weight:700;cursor:pointer;" onmouseover="this.style.opacity='.82'" onmouseout="this.style.opacity='1'">
                    선택
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
    <!-- 페이지네이션 (스크롤 밖 고정) -->
    <div v-if="totalPage > 1" style="display:flex;justify-content:center;align-items:center;gap:4px;padding:10px 18px;border-top:1px solid #f5eef2;flex-shrink:0;flex-wrap:wrap;">
      <button @click="handleBtnAction('pager-set', 1)" :disabled="modal.pageNo===1"
        style="border:1px solid #f0c0d0;background:#fff;color:#e8587a;border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;" :style="modal.pageNo===1?'opacity:.35;cursor:default;':''">
        «
      </button>
      <button @click="handleBtnAction('pager-set', modal.pageNo-1)" :disabled="modal.pageNo===1"
        style="border:1px solid #f0c0d0;background:#fff;color:#e8587a;border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;" :style="modal.pageNo===1?'opacity:.35;cursor:default;':''">
        ‹
      </button>
      <template v-for="p in totalPage" :key="p">
        <button v-if="fnPageVisible(p, modal.pageNo, totalPage)"
          @click="handleBtnAction('pager-set', p)"
          :style="modal.pageNo===p
          ? 'background:linear-gradient(135deg,#f9a8c9,#e8587a);color:#fff;border:none;font-weight:700;'
          : 'background:#fff;color:#888;border:1px solid #eee;'"
          style="min-width:28px;height:28px;border-radius:6px;font-size:11px;cursor:pointer;">
          {{ p }}
        </button>
      </template>
      <button @click="handleBtnAction('pager-set', modal.pageNo+1)" :disabled="modal.pageNo===totalPage"
        style="border:1px solid #f0c0d0;background:#fff;color:#e8587a;border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;" :style="modal.pageNo===totalPage?'opacity:.35;cursor:default;':''">
        ›
      </button>
      <button @click="handleBtnAction('pager-set', totalPage)" :disabled="modal.pageNo===totalPage"
        style="border:1px solid #f0c0d0;background:#fff;color:#e8587a;border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;" :style="modal.pageNo===totalPage?'opacity:.35;cursor:default;':''">
        »
      </button>
    </div>
  </div>
</bo-modal>
`,
};

/* ── 비밀번호 변경 모달 ───────────────────────────────────────────────────────
   form(=pwForm reactive) 을 ref 로 받아 v-model 직접 바인딩. 저장 로직은 parent emit. ── */
window.AuthPwChangeModal = {
  name: 'AuthPwChangeModal',
  props: {
    show:  { type: Boolean, default: false },
    form:  { type: Object,  required: true },  // pwForm reactive (current/next/confirm)
    error: { type: String,  default: '' },     // pwError
  },
  emits: ['save', 'close'],
  setup(_, { emit }) {
    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ AuthPwChangeModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        return emit('close');
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
    return {
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="show" title="🔑 비밀번호 변경" width="380px" @close="handleBtnAction('modal-close')">
  <div class="form-group">
    <label class="form-label">
      현재 비밀번호
      <span class="req">
        *
      </span>
    </label>
    <input class="form-control" type="password" v-model="form.current" placeholder="현재 비밀번호" autocomplete="current-password" />
  </div>
  <div class="form-group">
    <label class="form-label">
      새 비밀번호
      <span class="req">
        *
      </span>
    </label>
    <input class="form-control" type="password" v-model="form.next" placeholder="새 비밀번호 (6자 이상)" autocomplete="new-password" />
  </div>
  <div class="form-group">
    <label class="form-label">
      새 비밀번호 확인
      <span class="req">
        *
      </span>
    </label>
    <input class="form-control" type="password" v-model="form.confirm" placeholder="새 비밀번호 재입력" @keyup.enter="handleBtnAction('modal-save')" autocomplete="new-password" />
  </div>
  <div v-if="error" class="login-error">
    {{ error }}
  </div>
  <template #footer>
    <button class="btn btn-secondary" @click="handleBtnAction('modal-close')">
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
  props: {
    modal:       { type: Object, required: true },  // loginModal reactive (show/tab)
    loginForm:   { type: Object, required: true },  // loginForm reactive
    regForm:     { type: Object, required: true },  // regForm reactive
    error:       { type: String, default: '' },     // loginError
    authMethods: { type: Array,  default: () => [] },// AUTH_METHODS
    userRoles:   { type: Array,  default: () => [] },// userRoles
  },
  emits: ['do-login', 'do-register', 'open-user-pick', 'close', 'clear-error'],
  setup(props, { emit }) {
    const setTab = (t) => { props.modal.tab = t; emit('clear-error'); };

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ AuthLoginModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        return emit('close');
      } else if (cmd === 'modal-login') {
        return emit('do-login');
      } else if (cmd === 'modal-register') {
        return emit('do-register');
      } else if (cmd === 'modal-open-user-pick') {
        return emit('open-user-pick');
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

    return {
      baseRegFormColumns,                                                     // 컬럼 정의
      handleBtnAction, handleSelectAction,                                    // dispatch
    };
  },
  template: /* html */`
<bo-modal :show="!!modal.show" box-pad="0" body-pad="0" @close="handleBtnAction('modal-close')">
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
      <span class="modal-close" @click="handleBtnAction('modal-close')">
        ✕
      </span>
    </div>
    <!-- 로그인 폼 -->
    <div v-if="modal.tab==='login'">
      <div class="form-group">
        <label class="form-label">
          로그인 ID
        </label>
        <input class="form-control" v-model="loginForm.loginId" placeholder="로그인 ID 입력" @keyup.enter="handleBtnAction('modal-login')" autocomplete="username" />
      </div>
      <div class="form-group">
        <label class="form-label">
          비밀번호
        </label>
        <input class="form-control" type="password" v-model="loginForm.loginPwd" placeholder="비밀번호 입력" @keyup.enter="handleBtnAction('modal-login')" autocomplete="current-password" />
      </div>
      <div class="form-group">
        <label class="form-label">
          인증방식
        </label>
        <div class="auth-methods">
          <label v-for="m in authMethods" :key="m"
            class="auth-method-item" :class="{active: loginForm.authMethod===m}">
            <input type="radio" :value="m" v-model="loginForm.authMethod" style="display:none" />
            {{ m }}
          </label>
        </div>
      </div>
      <div v-if="error" class="login-error">
        {{ error }}
      </div>
      <button class="btn btn-primary" style="width:100%;margin-top:4px;" @click="handleBtnAction('modal-login')">
        로그인
      </button>
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
