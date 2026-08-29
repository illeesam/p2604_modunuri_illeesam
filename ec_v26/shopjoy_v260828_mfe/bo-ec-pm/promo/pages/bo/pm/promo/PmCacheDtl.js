/* ShopJoy Admin - 캐쉬관리 상세/등록 */
// ===== 탭/뷰모드 영속화 상태 (window 레벨) =================================
window._pmCacheDtlState = window._pmCacheDtlState || { tab: 'info', tabMode: 'tab' };
export default {
  name: 'PmCacheDtl',
  // ===== Props 정의 ========================================================
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    active:       { type: Boolean, default: true }, // 행 선택/신규 시 true → 액션 버튼 노출
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-bo §18)
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
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    // ===== Vue Composition API / boApp 전역 의존 ===========================
    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달

    // ===== 상태(reactive) 선언 =============================================
    const uiState = reactive({ loading: false, error: null, tab: window._pmCacheDtlState.tab || 'info', tabMode2: window._pmCacheDtlState.tabMode || 'tab'});
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({ cache_trans_types: [] });

    /* handleSearchDetail — 처리 */
    const handleSearchDetail = async () => {
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


    /* tabs — 탭 정의 (BoTabBar 데이터, reactive) */
    const tabs = reactive([
      { id: 'info',   label: '기본정보', icon: '📋' },
    ]);
    // ===== 공통코드 로딩 ===================================================
    /* 캐시(충전금) fnLoadCodes */

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['CACHE_TRANS_TYPE'], {compNm: 'PmCacheDtl'});
      codes.cache_trans_types = codeStore.sgGetGrpCodes('CACHE_TRANS_TYPE');
    };

    // ===== 폼 / 에러 / Yup 스키마 ==========================================
    /* 폼 초기값 = 빈 폼 (미선택/초기화 상태에서는 모든 필드 비움).
     *   신규 등록 기본값(유형/금액/잔액)은 [+신규] 진입 시에만 _applyNewDefaults() 로 채움. */
    const form = reactive({
      cacheId: null, memberId: '', memberNm: '', cacheDate: '', cacheTypeCd: '', cacheAmt: '', balanceAmt: '', cacheDesc: '',
      refId: '', procUserId: '',
    });
    /* _applyNewDefaults — 신규 등록 진입 시 기본값 채움
       2026-08-29 버그수정: '충전' 은 실제 codeValue 가 아니라 select 가 빈 값으로
       보이던 값이었다. 코드그룹 첫 번째 값으로 대체. */
    const _applyNewDefaults = () => {
      Object.assign(form, {
        cacheTypeCd: codes.cache_trans_types[0]?.codeValue || '', cacheAmt: 0, balanceAmt: 0,
      });
    };
    const errors = reactive({});

    const schema = yup.object({
      memberId: yup.string().required('회원ID를 입력해주세요.'),
      cacheDesc: yup.string().required('내용을 입력해주세요.'),
    });
    // ===== 라이프사이클 / 부모 reloadTrigger 동기화 =========================
    // ★ onMounted
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      // [+신규] 진입(활성 + 신규)일 때만 기본값 채움. 미선택/초기화(비활성)면 빈 폼 유지.
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
        if (showToast) { showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('pmCacheMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    // ===== 회원/업체 선택 핸들러 ===========================================
    /* onUserIdChange — 이벤트 */
    const onUserIdChange = () => {
      const m = getMember.value(Number(form.memberId));
      if (m) { form.memberNm = m.memberNm; }
    };

    // ===== 배지(badge) 헬퍼 ================================================
    /* fnTypeBadge — CACHE_TRANS_TYPE code_opt1 배지클래스 우선, 없으면 한글 값 기반 fallback */
    const _CACHE_TYPE_FB = { '충전': 'badge-green', '사용': 'badge-orange', '환불': 'badge-blue', '소멸': 'badge-red' };
    const fnTypeBadge = t => coUtil.cofCodeBadge('CACHE_TRANS_TYPE', t, _CACHE_TYPE_FB[t] || 'badge-gray');

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    /* fnShareUrl — 이 캐쉬 상세를 가리키는 독립 새창 딥링크 URL 생성 */
    const fnShareUrl = () => {
      const qs = new URLSearchParams();
      qs.set('page', 'pmCacheDtl');
      qs.set('id', form.cacheId);
      qs.set('embed', '1');
      return `${window.location.origin}${window.location.pathname}?${qs.toString()}`;
    };
    /* handleShareKakao — 카카오톡 공유(피드 카드, 상세보기 모드 전용) */
    const handleShareKakao = () => {
      try {
        window.coExtSdk.shareKakao({
          title: `캐쉬 ${form.cacheId} - ShopJoy BO`,
          description: form.cacheDesc || '',
          imageUrl: window.location.origin + '/assets/img/shopjoy-share-og.png',
          url: fnShareUrl(),
        });
      } catch (e) {
        showToast(e.message || '카카오톡 공유를 열 수 없습니다.', 'error', 0);
      }
    };
    /* handleCopyLink — 순수 URL만 클립보드에 복사 (카카오톡 카드 없음) */
    const handleCopyLink = async () => {
      try {
        await navigator.clipboard.writeText(fnShareUrl());
        showToast('링크가 복사되었습니다.', 'success');
      } catch (e) {
        showToast(e.message || '링크 복사에 실패했습니다.', 'error', 0);
      }
    };
    /* pdfAreaRef — 캐쉬 상세 카드 캡처 대상. handleExportPdf — PDF 다운로드(상세보기 모드 전용) */
    const pdfAreaRef = ref(null);
    const pdfExporting = ref(false);
    const handleExportPdf = async () => {
      pdfExporting.value = true;
      try {
        const filename = coUtil.cofBuildExportFilename(`캐쉬상세_${form.cacheId}.pdf`);
        await window.boUtil.bofExportPdf(pdfAreaRef.value, filename, showToast);
      } finally {
        pdfExporting.value = false;
      }
    };

    // ===== 그리드 컬럼 정의 (회원 캐쉬 내역) ===============================
    /* BoGrid(bare) 컬럼 정의 — 회원 캐쉬 내역 */
    const columns = {};
    columns.cacheHistGrid = [
      { key: 'cacheDate',  label: '일시', fmt: (v) => v ? String(v).slice(0, 16) : '-' },
      { key: 'cacheTypeCd', label: '유형', badge: row => fnTypeBadge(row.cacheTypeCd) },
      { key: 'cacheAmt',   label: '금액',
        cellStyle: (v, row) => row.cacheAmt > 0 ? 'color:#389e0d;font-weight:600' : 'color:#cf1322;font-weight:600',
        fmt: (v, row) => (row.cacheAmt > 0 ? '+' : '') + coUtil.cofWon(row.cacheAmt) },
      { key: 'balanceAmt', label: '잔액', fmt: v => coUtil.cofWon(v) },
      { key: 'cacheDesc',  label: '내용' },
    ];

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - 기본정보 영역 ================

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // --- [컬럼 정의] ---
    columns.baseForm = [
      { key: 'memberId',    label: '회원ID', type: 'slot', name: 'memberId', required: true },
      { key: 'memberNm',    label: '회원명', type: 'readonly' },
      { key: 'cacheTypeCd', label: '유형', type: 'select', options: () => codes.cache_trans_types },
      { key: 'cacheDate',   label: '일시', type: 'text', placeholder: '2026-04-08 10:00' },
      { key: 'cacheAmt',    label: '금액', type: 'number', required: true,
        hint: '사용/소멸은 음수' },
      { key: 'balanceAmt',  label: '처리 후 잔액', type: 'number' },
      { key: 'cacheDesc',   label: '내용', type: 'text', required: true,
        placeholder: '내용 입력', colSpan: 2 },
    ];

    // ===== setup() return =================================================

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      coUtil,  // 템플릿 cofAnd 접근용
      columns,
      uiState, codes, form, errors,                                        // 상태 / 데이터
      handleBtnAction, handleSelectAction,                                           // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfDtlMode, cfMemberCacheHistory, cfTotalBalance, // computed
      tabs, tab, tabMode2,                          // toRef
      showTab, fnTypeBadge,                                                          // 헬퍼
      coUtil,                                                                        // 템플릿 내 cofAnd 사용
      handleShareKakao, handleCopyLink,                                    // 카카오톡 공유 / 링크 복사 (상세보기)
      pdfAreaRef, pdfExporting, handleExportPdf,                           // PDF 다운로드 (항상 노출)
    };
  },
  // ===== 템플릿 ===========================================================
  template: /* html */`
<div ref="pdfAreaRef">
<!-- ===== ■. 상세 카드 (제목 + 탭바 + 탭컨텐츠를 한 영역으로) ===================== -->
<bo-container>
  <!-- ===== ■.■. 카드 헤더 (제목 = list-title, page-title 아님 → 폰트 축소) ========= -->
  <template #title>
    {{ cfIsNew ? '캐쉬 등록' : (cfDtlMode ? '캐쉬 상세' : '캐쉬 수정') }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;font-weight:400;">
      #{{ form.cacheId }}
    </span>
  </template>
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
  <!-- ===== □. 탭바 ====================================================== -->
  <!-- ===== ■. 탭 컨텐츠 =================================================== -->
<div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">
  <!-- ===== ■.■. 기본정보 탭 (BoFormArea 자동 렌더) ============================= -->
  <div class="dtl-pane" v-show="showTab('info')" style="margin:0;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
      📋 기본정보
    </div>
    <!-- ===== ■.■.■. 폼 영역 ================================================ -->
    <bo-form-area plain-readonly :columns="columns.baseForm" :form="form" :errors="errors"
      :readonly="cfDtlMode" :cols="3" compact :show-actions="false" :show-cancel="!cfIsNew">
      <!-- ===== ■.■.■.■. 회원ID + 보기 ========================================= -->
      <template #memberId>
        <div style="display:flex;gap:8px;align-items:center;">
          <input class="form-control" v-model="form.memberId" placeholder="회원 ID" @change="handleBtnAction('form-memberChange')" :readonly="cfDtlMode" :class="errors.memberId ? 'is-invalid' : ''"
            @input="form.memberId && errors.memberId ? delete errors.memberId : null" />
          <span v-if="form.memberId" class="ref-link" @click="handleBtnAction('form-memberRef')">
            보기
          </span>
        </div>
        <span v-if="errors.memberId" class="field-error">{{ errors.memberId }}</span>
      </template>
    </bo-form-area>
    <!-- ===== ■.■.■. 폼 액션 버튼 (보기모드: 수정/닫기) =============================== -->
    <bo-form-actions v-if="active" :readonly="cfDtlMode" :show-delete="false"
      :edit-click="() => handleBtnAction('form-edit')"
      :save-click="() => handleBtnAction('form-save')"
      :cancel-click="() => handleBtnAction('form-cancel')"
      :close-click="() => handleBtnAction('form-close')" />
  </div>
  <!-- ===== □.□. 기본정보 탭 (BoFormArea 자동 렌더) ============================= -->
  <!-- ===== ■.■. 회원 캐쉬 내역 탭 ============================================ -->
  <div class="dtl-pane" v-show="showTab('history')" style="margin:0;">
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
    <bo-grid bare :columns="columns.cacheHistGrid" :rows="cfMemberCacheHistory" row-key="cacheId"
      empty-text="캐쉬 내역이 없습니다.">
    </bo-grid>
  </div>
</div>
<!-- ===== □. 탭 컨텐츠 =================================================== -->
</bo-container>
<!-- ===== □. 상세 카드 (제목 + 탭바 + 탭컨텐츠) =============================== -->
</div>
`
};
