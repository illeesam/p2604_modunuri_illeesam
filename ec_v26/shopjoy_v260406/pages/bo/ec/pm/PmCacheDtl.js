/* ShopJoy Admin - 캐쉬관리 상세/등록 */
// ===== 탭/뷰모드 영속화 상태 (window 레벨) =================================
window._pmCacheDtlState = window._pmCacheDtlState || { tab: 'info', tabMode: 'tab' };
window.PmCacheDtl = {
  name: 'PmCacheDtl',
  // ===== Props 정의 ========================================================
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* ##### [01] 초기 변수 정의 ################################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PmCacheDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장
      if (cmd === 'form-save') {
        return handleSave();
      // 폼 취소 (목록으로)
      } else if (cmd === 'form-cancel') {
        return props.navigate('pmCacheMng');
      // 폼 닫기 (목록으로)
      } else if (cmd === 'form-close') {
        return props.navigate('pmCacheMng');
      // 상세 보기 → 편집 모드 전환
      } else if (cmd === 'form-edit') {
        return props.navigate('__switchToEdit__');
      // 탭 전환
      } else if (cmd === 'tab-select') {
        uiState.tab = param;
        return;
      // 뷰모드 변경
      } else if (cmd === 'tab-mode') {
        uiState.tabMode2 = param;
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
      // 회원ID 변경
      } else if (cmd === 'form-memberChange') {
        return onUserIdChange();
      // 회원 참조 모달 열기
      } else if (cmd === 'form-memberRef') {
        return showRefModal('member', Number(form.memberId));
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PmCacheDtl.js : handleSelectAction -> ', cmd, param);
      // 판매업체 선택
      if (cmd === 'vendorModal-select') {
        return selectVendor(param.vendorId, param.vendorNm);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    // ===== Vue Composition API / boApp 전역 의존 ===========================
    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    // ===== 상태(reactive) 선언 =============================================
    const vendors = reactive([]);
    const uiState = reactive({ loading: false, showVendorModal: false, error: null, isPageCodeLoad: false, tab: window._pmCacheDtlState.tab || 'info', tabMode2: window._pmCacheDtlState.tabMode || 'tab'});
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({ cache_trans_types: [] });

    // ===== 업체 목록 로드 / 단건 상세 조회 =================================
    /* loadVendors — 로드 */
    const loadVendors = async () => {
      try {
        const _vr = await boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 10000 }, '관리', '조회');
        vendors.splice(0, vendors.length, ...(_vr.data?.data?.pageList || _vr.data?.data?.list || []));
      } catch (e) { console.warn('[PmCacheDtl.js] vendor load failed', e); }
    };

    /* handleSearchDetail — 처리 */
    const handleSearchDetail = async () => {
      await loadVendors();
      if (cfIsNew.value) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.pmCache.getById(props.dtlId, '캐시관리', '상세조회');
        const c = res.data?.data || res.data;
        if (c) { Object.assign(form, { ...c }); }
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    const cfIsNew = computed(() => !props.dtlId);

    // ===== 탭/뷰모드 영속화 watch ==========================================
    watch(() => uiState.tab, v => { window._pmCacheDtlState.tab = v; });

        watch(() => uiState.tabMode2, v => { window._pmCacheDtlState.tabMode = v; });

    /* showTab — 표시 */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;

    // ===== 공통코드 로딩 ===================================================
    /* 캐시(충전금) fnLoadCodes */
    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.cache_trans_types = codeStore.sgGetGrpCodes('CACHE_TRANS_TYPE');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ===== 폼 / 에러 / Yup 스키마 ==========================================
    const form = reactive({
      cacheId: null, memberId: '', memberNm: '', cacheDate: '', cacheTypeCd: '충전', cacheAmt: 0, balanceAmt: 0, cacheDesc: '',
      refId: '', procUserId: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      memberId: yup.string().required('회원ID를 입력해주세요.'),
      cacheDesc: yup.string().required('내용을 입력해주세요.'),
    });
    // ===== 라이프사이클 / 부모 reloadTrigger 동기화 =========================
    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleSearchDetail();
    });

    // ===== 파생 computed (회원 캐쉬 내역 / 잔액) ============================
    /* 같은 회원의 캐쉬 내역 */
    const cfMemberCacheHistory = computed(() => form.memberCacheHistory || []);

    const cfTotalBalance = computed(() => form.balanceAmt || 0);

    // ===== 저장 (등록/수정) ================================================
    /* 캐시(충전금) 저장 */
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* handleSave — 저장 */
    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        console.error('[catch-info]', err);
        err.inner.forEach(e => { errors[e.path] = e.message; });
        showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const ok = await showConfirm(cfIsNew.value ? '등록' : '저장', cfIsNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) { return; }
      try {
        const res = await (cfIsNew.value ? boApiSvc.pmCache.create({ ...form }, '캐시관리', '등록') : boApiSvc.pmCache.update(form.cacheId, { ...form }, '캐시관리', '저장'));
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('pmCacheMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    // ===== 회원/업체 선택 핸들러 ===========================================
    /* onUserIdChange — 이벤트 */
    const onUserIdChange = () => {
      const m = getMember.value(Number(form.memberId));
      if (m) { form.memberNm = m.memberNm; }
    };

    const cfSelectedVendorNm = computed(() => {
      if (!form.vendorId) { return '소속업체 선택'; }
      const v = vendors.find(x => x.vendorId === form.vendorId);
      return v ? v.vendorNm : '소속업체 선택';
    });

    /* selectVendor — 선택 */
    const selectVendor = (vendorId, vendorNm) => {
      form.vendorId = vendorId;
      uiState.showVendorModal = false;
    };

    // ===== 배지(badge) 헬퍼 ================================================
    /* 캐시(충전금) fnTypeBadge — sy_code CACHE_TYPE_KR code_opt1 우선, 없으면 FB */
    const _CACHE_TYPE_FB = { '충전': 'badge-green', '사용': 'badge-orange', '환불': 'badge-blue', '소멸': 'badge-red' };
    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge = t => coUtil.cofCodeBadge('CACHE_TYPE_KR', t, _CACHE_TYPE_FB[t] || 'badge-gray');

    // ===== 모달 토글 / 읽기전용 판정 =======================================
    const showVendorModal = Vue.toRef(uiState, 'showVendorModal');

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    // ===== 그리드 컬럼 정의 (회원 캐쉬 내역) ===============================
    /* BoGrid(bare) 컬럼 정의 — 회원 캐쉬 내역 */
    const cacheHistGridColumns = [
      { key: 'cacheDate',  label: '일시' },
      { key: 'cacheTypeCd', label: '유형', badge: row => fnTypeBadge(row.cacheTypeCd) },
      { key: 'cacheAmt',   label: '금액',
        cellStyle: (v, row) => row.cacheAmt > 0 ? 'color:#389e0d;font-weight:600' : 'color:#cf1322;font-weight:600',
        fmt: (v, row) => (row.cacheAmt > 0 ? '+' : '') + (row.cacheAmt||0).toLocaleString() + '원' },
      { key: 'balanceAmt', label: '잔액', fmt: v => (v||0).toLocaleString() + '원' },
      { key: 'cacheDesc',  label: '내용' },
    ];

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - 기본정보 영역 ================
    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // --- [컬럼 정의] ---
    const baseFormColumns = [
      { key: 'memberId',    label: '회원ID', type: 'slot', name: 'memberId', required: true },
      { key: 'memberNm',    label: '회원명', type: 'readonly' },
      { type: 'rowBreak' },
      { key: 'cacheTypeCd', label: '유형', type: 'select', options: () => codes.cache_trans_types },
      { key: 'cacheDate',   label: '일시', type: 'text', placeholder: '2026-04-08 10:00' },
      { type: 'rowBreak' },
      { key: 'cacheAmt',    label: '금액', type: 'number', required: true,
        hint: '사용/소멸은 음수' },
      { key: 'balanceAmt',  label: '처리 후 잔액', type: 'number' },
      { type: 'rowBreak' },
      { key: 'cacheDesc',   label: '내용', type: 'text', required: true,
        placeholder: '내용 입력', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'vendorId',    label: '판매업체', type: 'slot', name: 'vendor' },
      { key: 'chargeStaff', label: '판매담당자', type: 'text', placeholder: '담당자명 입력' },
    ];

    // ===== setup() return =================================================
    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      vendors, uiState, codes, form, errors,                                        // 상태 / 데이터
      baseFormColumns, cacheHistGridColumns,                                         // 컬럼 정의
      handleBtnAction, handleSelectAction,                                           // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfDtlMode, cfMemberCacheHistory, cfTotalBalance, cfSelectedVendorNm, // computed
      tab, tabMode2, showVendorModal,                                                // toRef
      showTab, fnTypeBadge,                                                          // 헬퍼
    };
  },
  // ===== 템플릿 ===========================================================
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 + ID 표시 ========================================= -->
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    {{ cfIsNew ? '캐쉬 등록' : (cfDtlMode ? '캐쉬 상세' : '캐쉬 수정') }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">
      #{{ form.cacheId }}
    </span>
  </div>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 탭바 + 뷰모드 아이콘 ============================================ -->
  <!-- ===== ■. 탭 영역 ==================================================== -->
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:tab==='info'}" :disabled="tabMode2!=='tab'" @click="handleBtnAction('tab-select', 'info')">
        📋 기본정보
      </button>
      <button v-if="form.memberId" class="tab-btn" :class="{active:tab==='history'}" :disabled="tabMode2!=='tab'" @click="handleBtnAction('tab-select', 'history')">
        🕒 회원 캐쉬 내역
        <span class="tab-count">
          {{ cfMemberCacheHistory.length }}
        </span>
      </button>
    </div>
    <div class="tab-modes">
      <button class="tab-mode-btn" :class="{active:tabMode2==='tab'}" @click="handleBtnAction('tab-mode', 'tab')" title="탭으로 보기">
        📑
      </button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='1col'}" @click="handleBtnAction('tab-mode', '1col')" title="1열로 보기">
        1▭
      </button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='2col'}" @click="handleBtnAction('tab-mode', '2col')" title="2열로 보기">
        2▭
      </button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='3col'}" @click="handleBtnAction('tab-mode', '3col')" title="3열로 보기">
        3▭
      </button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='4col'}" @click="handleBtnAction('tab-mode', '4col')" title="4열로 보기">
        4▭
      </button>
    </div>
  </div>
  <!-- ===== □. 탭 영역 ==================================================== -->
  <!-- ===== ■. 탭 콘텐츠 컨테이너 (1/2/3/4열 그리드 자동 적용) ========================= -->
  <!-- ===== ■. 탭 컨텐츠 =================================================== -->
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">
    <!-- ===== ■.■. 기본정보 탭 (BoFormArea 자동 렌더) ============================= -->
    <div class="card" v-show="showTab('info')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        📋 기본정보
      </div>
      <!-- ===== ■.■.■. 폼 영역 ================================================ -->
      <bo-form-area :columns="baseFormColumns" :form="form" :errors="errors"
        :readonly="cfDtlMode" :cols="3" :show-actions="false">
        <!-- ===== ■.■.■.■. 회원ID + 보기 ========================================= -->
        <template #memberId>
          <div style="display:flex;gap:8px;align-items:center;">
            <input class="form-control" v-model="form.memberId" placeholder="회원 ID" @change="handleBtnAction('form-memberChange')" :readonly="cfDtlMode" :class="errors.memberId ? 'is-invalid' : ''" />
            <span v-if="form.memberId" class="ref-link" @click="handleBtnAction('form-memberRef')">
              보기
            </span>
          </div>
        </template>
        <!-- ===== ■.■.■.■. 판매업체 picker ======================================= -->
        <template #vendor>
          <div style="display:flex;gap:8px;align-items:center;">
            <div class="form-control" style="background:#f9f9f9;cursor:pointer;padding:0;display:flex;align-items:center;" @click="handleBtnAction('vendorModal-open')">
              <span style="padding:8px 12px;flex:1;">
                {{ cfSelectedVendorNm }}
              </span>
              <span style="padding:8px 12px;color:#999;font-size:12px;">
                ▼
              </span>
            </div>
            <button v-if="form.vendorId" class="btn btn-sm" style="padding:0 12px;color:#666;" @click="handleBtnAction('form-vendorClear')">
              초기화
            </button>
          </div>
        </template>
      </bo-form-area>
      <!-- ===== ■.■.■. 판매업체 선택 모달 ========================================== -->
      <simple-vendor-pick-modal :show="showVendorModal" :vendors="vendors" :selected-id="form.vendorId"
        @select="v => handleSelectAction('vendorModal-select', v)" @close="handleBtnAction('vendorModal-close')" />
      <!-- ===== ■.■.■. 폼 액션 버튼 (수정/저장/취소/닫기) =============================== -->
      <div class="form-actions" v-if="!cfDtlMode">
        <template v-if="cfDtlMode">
          <button class="btn btn-primary" @click="handleBtnAction('form-edit')">
            수정
          </button>
          <button class="btn btn-secondary" @click="handleBtnAction('form-close')">
            닫기
          </button>
        </template>
        <template v-else>
          <button class="btn btn-primary" @click="handleBtnAction('form-save')">
            저장
          </button>
          <button class="btn btn-secondary" @click="handleBtnAction('form-cancel')">
            취소
          </button>
        </template>
      </div>
    </div>
    <!-- ===== □.□. 기본정보 탭 (BoFormArea 자동 렌더) ============================= -->
    <!-- ===== ■.■. 회원 캐쉬 내역 탭 ============================================ -->
    <div class="card" v-show="showTab('history')" style="margin:0;">
      <!-- ===== ■.■.■. 조건부 영역 ============================================== -->
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        🕒 회원 캐쉬 내역
        <span class="tab-count">
          {{ cfMemberCacheHistory.length }}
        </span>
      </div>
      <div style="margin-bottom:12px;padding:12px;background:#f9f9f9;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:13px;color:#555;">
          <span class="ref-link" @click="handleBtnAction('form-memberRef')">
            {{ form.memberNm }}
          </span>
          현재 잔액
        </span>
        <span style="font-size:20px;font-weight:700;color:#e8587a;">
          {{ cfTotalBalance.toLocaleString() }}원
        </span>
      </div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="cacheHistGridColumns" :rows="cfMemberCacheHistory" row-key="cacheId"
        empty-text="캐쉬 내역이 없습니다.">
      </bo-grid>
    </div>
  </div>
</div>
<!-- ===== □.□. 회원 캐쉬 내역 탭 ============================================ -->
<!-- ===== □. 탭 컨텐츠 =================================================== -->
`
};
