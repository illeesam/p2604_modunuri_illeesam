/* ShopJoy Admin - 게시글관리 상세/등록 */
window.SyBbsDtl = {
  name: 'SyBbsDtl',
  props: {
    navigate:      { type: Function, required: true },        // 페이지 이동
    dtlId:         { type: String, default: null },           // 수정 대상 ID
    dtlMode:       { type: String, default: 'view' },         // 상세 모드 (new/view/edit)
    active:        { type: Boolean, default: true },          // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 },              // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { reactive, computed, onMounted, ref, watch } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달

    const uiState = reactive({                     // UI 상태
      loading: false, showBbmDetail: false, error: null, isPageCodeLoad: false,
      selectedBbm: null, showBbmModal: false,
    });
    const codes = reactive({ bbs_post_statuses: [] });

    const form = reactive({                        // 게시글 폼 데이터
      bbsId: null, bbmId: null, bbsTitle: '', authorNm: '', bbsStatusCd: '',
      attachGrpId: null, contentHtml: '', viewCount: '', commentCount: '',
    });
    // 신규 진입 시에만 채울 기본값 (미선택/inactive 시 빈 폼 유지)
    const _applyNewDefaults = () => {
      Object.assign(form, { bbsStatusCd: 'PUBLISH', viewCount: 0, commentCount: 0 });
    };
    const errors = reactive({});                   // 폼 검증 에러

    const schema = yup.object({                    // 폼 검증 스키마
      bbmId: yup.number().required('게시판을 선택해주세요.').min(1, '게시판을 선택해주세요.'),
      bbsTitle: yup.string().required('제목을 입력해주세요.'),
    });

    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDtlMode = computed(() => props.dtlMode === 'view'); // dtlMode: 'view' 이면 읽기전용, 'new'/'edit' 이면 편집
    const cfContentType = computed(() => uiState.selectedBbm?.contentTypeCd || 'textarea');
    const cfAllowAttach = computed(() => uiState.selectedBbm?.allowAttach || '불가');
    const cfAttachMaxCount = computed(() => {
      const map = { '불가': 0, '1개': 1, '2개': 2, '3개': 3, '목록': 10 };
      return map[cfAllowAttach.value] ?? 0;
    });
    const selectedBbm = computed(() => uiState.selectedBbm);
    const dtlId = computed(() => props.dtlId);
    const showBbmDetail = Vue.toRef(uiState, 'showBbmDetail');
    const showBbmModal = ref(false);

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyBbsDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장 (신규 등록 또는 수정)
      if (cmd === 'form-save') {
        return handleSave();
      // 폼 편집 취소 → 상세영역 유지 + 빈 신규 폼으로 초기화 (영역 사라지지 않음)
      } else if (cmd === 'form-cancel') {
        return props.navigate('__cancelEdit__');
      // 폼 닫기 → 상세영역 유지 + 빈 신규 폼으로 초기화
      } else if (cmd === 'form-close') {
        return props.navigate('__cancelEdit__');
      // 보기모드 → 수정모드 전환 (수정 버튼)
      } else if (cmd === 'form-edit') {
        return props.navigate('__switchToEdit__');
      // 게시판 선택 모달 열기
      } else if (cmd === 'bbmModal-open') {
        showBbmModal.value = true;
        return;
      // 게시판 선택 모달 닫기
      } else if (cmd === 'bbmModal-close') {
        showBbmModal.value = false;
        return;
      // 게시판 상세보기 모달 열기
      } else if (cmd === 'bbmDetail-open') {
        uiState.showBbmDetail = true;
        return;
      // 게시판 상세보기 모달 닫기
      } else if (cmd === 'bbmDetail-close') {
        uiState.showBbmDetail = false;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyBbsDtl.js : handleSelectAction -> ', cmd, param);
      // 게시판 선택 모달에서 선택
      if (cmd === 'bbmModal-select') {
        return onBbmSelect(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };


    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ SyBbsDtl : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'bbm-select') {
        if (result == null) {
            showBbmModal.value = false;
            return;
        }
        return onBbmSelect(result);
      } else if (cmd === 'bbm-detail') {
        if (result == null) {
          uiState.showBbmDetail = false;
          return;
        }
        return;
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* onBbmSelect — 게시판 선택 결과 적용 */
    const onBbmSelect = (b) => {
      showBbmModal.value = false;
      if (uiState.selectedBbm && uiState.selectedBbm.bbmId === b.bbmId) { return; }
      uiState.selectedBbm = b;
      form.bbmId = b.bbmId;
      // 게시판 변경 시 레이아웃 초기화
      form.bbsTitle    = '';
      form.authorNm    = '';
      form.bbsStatusCd = 'PUBLISH';
      form.attachGrpId = null;
      form.contentHtml = '';
    };

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.syBbs.getById(props.dtlId, '게시판관리', '상세조회');
        const data = res.data?.data;
        if (data) {
          Object.assign(form, data);
          uiState.selectedBbm = null;
        }
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* handleSave — 저장 (신규 등록 / 수정) */
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
        const res = await (cfIsNew.value
          ? boApiSvc.syBbs.create({ ...form }, '게시판관리', '등록')
          : boApiSvc.syBbs.update(form.bbsId, { ...form }, '게시판관리', '저장'));
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('syBbsMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.bbs_post_statuses = codeStore.sgGetGrpCodes('BBS_POST_STATUS');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 진입 시 코드 로드 + 상세 조회
    onMounted(async () => {
      if (isAppReady.value) { fnLoadCodes(); }
      if (!cfIsNew.value) { await handleLoadDetail(); }
      if (props.active && cfIsNew.value) { _applyNewDefaults(); }
    });

    /* policy: 상위 Mng 이 reloadTrigger 증가시키면 상세 API 재조회 */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleLoadDetail();
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // 사이트명 폼 (cols=3, 1열만 차지 — 다른 필드와 동일 폭)
    const columns = {};
    columns.siteForm = [
      { key: '_siteNm', label: '사이트명', type: 'readonly', fmt: () => cfSiteNm.value },
    ];

    // 기본 폼 (cols=3, 1열씩)
    columns.baseForm = [
      { key: 'bbsTitle',    label: '제목', type: 'text', required: true,
        placeholder: '게시글 제목' },
      { key: 'authorNm',    label: '작성자', type: 'text', placeholder: '작성자명' },
      { key: 'bbsStatusCd', label: '상태', type: 'select', options: () => codes.bbs_post_statuses },
    ];

    // 내용 입력 폼 (한 줄 전체 폭, colSpan=3)
    columns.contentForm = [
      { key: '_noBbm', label: '내용', type: 'slot', name: 'contentNoBbm', colSpan: 3,
        visible: () => !uiState.selectedBbm },
      { key: '_notAllow', label: '내용', type: 'slot', name: 'contentNotAllow', colSpan: 3,
        visible: () => uiState.selectedBbm && cfContentType.value === '불가' },
      { key: 'contentHtml', label: '내용', type: 'textarea', placeholder: '게시글 내용을 입력하세요.',
        colSpan: 3, rows: 8,
        visible: () => uiState.selectedBbm && cfContentType.value === 'textarea' },
      { key: '_htmlEditor', label: '내용', type: 'slot', name: 'contentHtmlEditor', colSpan: 3,
        visible: () => uiState.selectedBbm && cfContentType.value === 'htmleditor' },
    ];

    // 게시판 상세보기 모달
    columns.bbmDetail = [
      { key: 'bbmId',         label: '게시판ID',   type: 'readonly' },
      { key: 'bbmCode',       label: '게시판코드', type: 'readonly', mono: true },
      { key: 'bbmNm',         label: '게시판명',   type: 'readonly' },
      { key: 'bbmTypeCd',     label: '유형',       type: 'readonly' },
      { key: 'allowComment',  label: '댓글허용',   type: 'readonly' },
      { key: 'allowAttach',   label: '첨부허용',   type: 'readonly' },
      { key: 'contentTypeCd', label: '내용입력',   type: 'readonly' },
      { key: 'scopeTypeCd',   label: '공개범위',   type: 'readonly' },
      { key: 'allowLike',     label: '좋아요허용', type: 'readonly',
        fmt: (v) => v === 'Y' ? '허용' : '불가' },
      { key: 'useYn',         label: '사용여부',   type: 'readonly',
        fmt: (v) => v === 'Y' ? '사용' : '미사용' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      uiState, codes, form, errors, showBbmModal, dtlId,                            // 상태 / 데이터
      handleBtnAction, handleSelectAction, fnCallbackModal,                                           // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfSiteNm, cfDtlMode, cfContentType, cfAllowAttach, cfAttachMaxCount,  // computed
      selectedBbm, showBbmDetail,                                                    // computed (ref)
      showToast, coUtil,                                                             // 헬퍼 / 의존
    };
  },
  template: /* html */`
<bo-container :title="!active ? '게시글 상세' : (cfIsNew ? '게시글 등록' : (cfDtlMode ? '게시글 상세' : '게시글 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : form.bbsId)">
  <!-- ===== ■.■. 사이트명 (BoFormArea 자동 렌더, 1열 폭) ========================= -->
  <bo-form-area :columns="columns.siteForm" :form="form" :errors="{}"
    :cols="3" compact :show-actions="false" />
  <!-- ===== ■.■. 게시판 선택 ================================================ -->
  <div class="form-group">
    <label class="form-label">게시판 <span v-if="!cfDtlMode" class="req"> * </span></label>
    <div style="display:flex;align-items:center;gap:8px;">
      <!-- ===== ■.■.■. 신규: 선택 버튼 =========================================== -->
      <template v-if="cfIsNew && !cfDtlMode">
        <button class="btn btn-secondary btn-sm" type="button" @click="handleBtnAction('bbmModal-open')">📋 게시판 선택</button>
        <button v-if="selectedBbm" class="btn btn-blue btn-sm" type="button" @click="handleBtnAction('bbmDetail-open')" title="게시판 상세보기">
          🔍
        </button>
      </template>
      <!-- ===== ■.■.■. 수정 또는 cfDtlMode: 변경 불가 ============================== -->
      <template v-else>
        <button class="btn btn-secondary btn-sm" type="button" disabled style="opacity:.5;cursor:not-allowed;">📋 게시판 선택</button>
        <button v-if="selectedBbm" class="btn btn-blue btn-sm" type="button" @click="handleBtnAction('bbmDetail-open')" title="게시판 상세보기">
          🔍
        </button>
      </template>
      <!-- ===== ■.■.■. 선택된 게시판 표시 ========================================= -->
      <span v-if="selectedBbm" style="display:flex;align-items:center;gap:6px;font-size:13px;">
        <b style="color:#1a1a2e;">{{ selectedBbm.bbmNm }}</b>
        <code style="font-size:11px;color:#888;background:#f5f5f5;padding:1px 6px;border-radius:4px;">{{ selectedBbm.bbmCode }}</code>
        <span style="font-size:11px;color:#bbb;">ID: {{ selectedBbm.bbmId }}</span>
      </span>
      <span v-else style="font-size:12px;color:#bbb;">게시판을 선택해주세요.</span>
    </div>
    <span v-if="errors.bbmId" class="field-error">{{ errors.bbmId }}</span>
  </div>
  <!-- ===== □.□. 게시판 선택 ================================================ -->
  <!-- ===== ■.■. 기본 정보 (BoFormArea 자동 렌더) ============================== -->
  <bo-form-area :columns="columns.baseForm" :form="form" :errors="errors"
    :readonly="cfDtlMode" :cols="3" compact :show-actions="false" />
  <!-- ===== ■.■. 내용 입력 (contentType 에 따라 렌더링) ========================== -->
  <bo-form-area :columns="columns.contentForm" :form="form" :errors="errors"
    :readonly="cfDtlMode" :cols="3" compact :show-actions="false">
    <template #contentNoBbm>
      <div style="color:#bbb;font-size:13px;padding:12px 0;">게시판을 먼저 선택하세요.</div>
    </template>
    <template #contentNotAllow>
      <div style="color:#bbb;font-size:13px;padding:12px 0;">이 게시판은 내용 입력을 지원하지 않습니다.</div>
    </template>
    <template #contentHtmlEditor>
      <div v-if="cfDtlMode" class="form-control"
        style="min-height:300px;line-height:1.6;"
        v-html="form.contentHtml || '<span style=color:#bbb>-</span>'"></div>
      <base-html-editor v-else v-model="form.contentHtml" height="320px" />
    </template>
  </bo-form-area>
  <!-- ===== □.□. 내용 입력 (contentType 에 따라 렌더링) ========================== -->
  <!-- ===== ■.■. 첨부파일 ================================================== -->
  <div v-if="selectedBbm && cfAttachMaxCount > 0" class="form-group">
    <label class="form-label">
      첨부파일
      <span style="font-size:11px;font-weight:400;color:#bbb;margin-left:4px;">({{ cfAllowAttach }})</span>
      <span v-if="form.attachGrpId" style="font-size:11px;font-weight:400;color:#aaa;margin-left:6px;">첨부그룹ID: {{ form.attachGrpId }}</span>
    </label>
    <base-attach-grp
      :model-value="form.attachGrpId"
      @update:model-value="form.attachGrpId = $event" :ref-id="dtlId ? 'BBS-'+dtlId : ''"
      :show-toast="showToast"
      grp-code="BBS_ATTACH"
      grp-nm="게시글 첨부파일"
      :max-count="cfAttachMaxCount"
      :max-size-mb="10"
      allow-ext="*" />
  </div>
  <div v-else-if="selectedBbm && cfAllowAttach==='불가'" class="form-group">
    <label class="form-label">첨부파일</label>
    <div style="color:#bbb;font-size:13px;padding:4px 0;">이 게시판은 첨부파일을 지원하지 않습니다.</div>
  </div>
  <!-- ===== □.□. 첨부파일 ================================================== -->
  <!-- ===== ■.■. 폼 액션 (보기모드: 수정/닫기 · 수정모드: 저장/취소) ================== -->
  <div class="form-actions" v-if="active && cfDtlMode">
    <button class="btn btn-blue" @click="handleBtnAction('form-edit')">수정</button>
    <button class="btn btn-secondary" @click="handleBtnAction('form-close')">닫기</button>
  </div>
  <div class="form-actions" v-if="active && !cfDtlMode">
    <button class="btn btn-primary" @click="handleBtnAction('form-save')">저장</button>
    <button class="btn btn-secondary" @click="handleBtnAction('form-cancel')">취소</button>
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 게시판 선택 팝업 =============================================== -->
  <bbm-select-modal
    v-if="showBbmModal" modal-name="bbm-select" :on-callback="fnCallbackModal" />
  <!-- ===== □. 게시판 선택 팝업 =============================================== -->
  <!-- ===== ■. 게시판 상세보기 팝업 ============================================= -->
  <bo-modal :show="coUtil.cofAnd(showBbmDetail, selectedBbm)" title="게시판 상세"
    width="420px" modal-name="bbm-detail" :on-callback="fnCallbackModal" @close="showBbmDetail = false">
    <bo-form-area v-if="selectedBbm" :columns="columns.bbmDetail" :form="selectedBbm" :errors="{}"
      :cols="1" :show-actions="false" />
    <template #footer>
      <button class="btn btn-secondary" @click="handleBtnAction('bbmDetail-close')">닫기</button>
    </template>
  </bo-modal>
  <!-- ===== □. 게시판 상세보기 팝업 ============================================= -->
</bo-container>
`,
};
