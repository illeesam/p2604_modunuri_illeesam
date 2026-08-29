/* ShopJoy Admin - 게시글관리 상세/등록 */
window.SyBbsDtl = {
  name: 'SyBbsDtl',
  props: {
    navigate:      { type: Function, required: true },        // 페이지 이동
    dtlId:         { type: String, default: null },           // 수정 대상 ID
    dtlMode:       { type: String, default: 'view' },         // 상세 모드 (new/view/edit)
    active:        { type: Boolean, default: true },          // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 },              // 첫 탭 저장 시 상위 Mng 재조회 (UX-bo §18)
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, onMounted, ref, watch } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달

    const uiState = reactive({                     // UI 상태
      loading: false, showBbmDetail: false, error: null, selectedBbm: null, showBbmModal: false,
    });
    const codes = reactive({ bbs_post_statuses: [] });

    const form = reactive({                        // 게시글 폼 데이터
      bbsId: null, bbmId: null, bbsTitle: '', authorNm: '', bbsStatusCd: '',
      contentHtml: '', viewCount: '', commentCount: '',
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
    /* attachGrpRef — pendingChanges(추가/삭제 변경 목록)를 create/update 요청에 attachChanges 로 담아 보내기 위한 template ref.
       실제 sy_attach 반영은 백엔드(SyBbsService.create/update)가 같은 트랜잭션에서 원자적으로 처리한다. */
    const attachGrpRef = ref(null);
    /* refTableNm — sy_attach.ref_table_nm 실제 값. 백엔드 SyAttachRefTableConst.OPTIONS 에서
       key='BBS' 항목을 찾아 채운다(coUtil.cofGetAttachRefTableOptions, initPage 에서 로드). */
    const refTableNm = ref('');
    const fnLoadRefTableNm = async () => {
      const opts = await coUtil.cofGetAttachRefTableOptions();
      refTableNm.value = opts.find(o => o.key === 'BBS')?.value || '';
    };
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
        return props.navigate('__closeDtl__');
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
    const fnCallbackModal = (popCmd, param, result) => {
      console.log(' ■■ SyBbsDtl : fnCallbackModal -> ', popCmd, param, result);
      if (popCmd === 'cmPopup-bbm-select') {
        if (result == null) {
            showBbmModal.value = false;
            return;
        }
        return onBbmSelect(result);
      } else if (popCmd === 'bbm-detail') {
        if (result == null) {
          uiState.showBbmDetail = false;
          return;
        }
        return;
      } else {
        console.warn('[fnCallbackModal] unknown popCmd:', popCmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* onBbmSelect — 게시판 선택 결과 적용 */
    const onBbmSelect = (b) => {
      showBbmModal.value = false;
      if (uiState.selectedBbm && uiState.selectedBbm.bbmId === b.selId) { return; }
      uiState.selectedBbm = b;
      form.bbmId = b.selId;
      // 게시판 변경 시 레이아웃 초기화
      form.bbsTitle    = '';
      form.authorNm    = '';
      form.bbsStatusCd = 'PUBLISH';
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
        coUtil.cofValidationToast(errors, showToast);
        return;
      }
      const ok = await showConfirm(cfIsNew.value ? '등록' : '저장', cfIsNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) { return; }
      try {
        // 첨부파일 추가/삭제 변경 목록을 함께 전송 — 백엔드(SyBbsService.create/update)가
        // bbsId 확정 직후 같은 트랜잭션에서 sy_attach 에 반영한다.
        const attachChanges = attachGrpRef.value?.pendingChanges || [];
        await (cfIsNew.value
          ? boApiSvc.syBbs.create({ ...form, attachFiles: attachChanges }, '게시판관리', '등록')
          : boApiSvc.syBbs.update(form.bbsId, { ...form, attachFiles: attachChanges }, '게시판관리', '저장'));
        if (showToast) { showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('syBbsMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
        await codeStore.saLoadCodes(['BBS_POST_STATUS'], {compNm: 'SyBbsDtl'});
        codes.bbs_post_statuses = codeStore.sgGetGrpCodes('BBS_POST_STATUS');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 상세 조회
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      await fnLoadRefTableNm();
      if (!cfIsNew.value) { await handleLoadDetail(); }
      if (props.active && cfIsNew.value) { _applyNewDefaults(); }
    };
    onMounted(initPage);

    /* policy: 상위 Mng 이 reloadTrigger 증가시키면 상세 API 재조회 */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleLoadDetail();
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    const columns = {};

    // 통합 폼 (cols=3)
    columns.baseForm = [
      { key: '_siteNm',    label: '사이트명', type: 'readonly', fmt: () => cfSiteNm.value },
      { key: 'bbsTitle',   label: '제목',     type: 'text', required: true, colSpan: 2,
        placeholder: '게시글 제목' },
      { key: '_bbmPick',   label: '게시판',   type: 'slot', name: 'bbmPick', colSpan: 3 },
      { key: 'authorNm',    label: '작성자',  type: 'text', placeholder: '작성자명' },
      { key: 'bbsStatusCd', label: '상태',    type: 'select', options: () => codes.bbs_post_statuses },
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
      { key: '_attach', label: '첨부파일', type: 'slot', name: 'attachGrp', colSpan: 3,
        visible: () => !!(uiState.selectedBbm) },
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

    /* fnShareUrl — 이 게시글 상세를 가리키는 독립 새창 딥링크 URL 생성 */
    const fnShareUrl = () => {
      const qs = new URLSearchParams();
      qs.set('page', 'syBbsDtl');
      qs.set('id', form.bbsId);
      qs.set('embed', '1');
      return `${window.location.origin}${window.location.pathname}?${qs.toString()}`;
    };
    /* handleShareKakao — 카카오톡 공유(피드 카드, 상세보기 모드 전용) */
    const handleShareKakao = () => {
      try {
        window.coExtSdk.shareKakao({
          title: `게시글 ${form.bbsId} - ShopJoy BO`,
          description: form.bbsTitle || '',
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
    /* pdfAreaRef — 게시글 상세 카드 캡처 대상. handleExportPdf — PDF 다운로드(상세보기 모드 전용) */
    const pdfAreaRef = ref(null);
    const pdfExporting = ref(false);
    const handleExportPdf = async () => {
      pdfExporting.value = true;
      try {
        const filename = coUtil.cofBuildExportFilename(`게시글상세_${form.bbsId}.pdf`);
        await window.boUtil.bofExportPdf(pdfAreaRef.value, filename, showToast);
      } finally {
        pdfExporting.value = false;
      }
    };

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      handleShareKakao, handleCopyLink,                                    // 카카오톡 공유 / 링크 복사 (상세보기)
      pdfAreaRef, pdfExporting, handleExportPdf,                           // PDF 다운로드 (항상 노출)
      form, errors, showBbmModal, dtlId, attachGrpRef, refTableNm,  // 상태 / 데이터
      handleBtnAction, handleSelectAction, fnCallbackModal,                                           // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfDtlMode, cfAllowAttach, cfAttachMaxCount,                         // computed
      selectedBbm, showBbmDetail,                                                    // computed (ref)
      showToast, coUtil, // 헬퍼 / 의존
    };
  },
  template: /* html */`
<div ref="pdfAreaRef">
<bo-container :title="!active ? '게시글 상세' : (cfIsNew ? '게시글 등록' : (cfDtlMode ? '게시글 상세' : '게시글 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : form.bbsId)">
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
  <!-- ===== ■.■. 기본 정보 + 게시판 선택 ===================================== -->
  <bo-form-area plain-readonly :columns="columns.baseForm" :form="form" :errors="errors"
    :readonly="cfDtlMode" :cols="3" compact :show-actions="false">
    <template #bbmPick>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <template v-if="cfIsNew ? (!cfDtlMode) : false">
          <button class="btn btn-secondary btn-sm" type="button" @click="handleBtnAction('bbmModal-open')">📋 게시판 선택</button>
          <button v-if="selectedBbm" class="btn btn-blue btn-sm" type="button" @click="handleBtnAction('bbmDetail-open')" title="게시판 상세보기">🔍</button>
        </template>
        <template v-else>
          <button class="btn btn-secondary btn-sm" type="button" disabled style="opacity:.5;cursor:not-allowed;">📋 게시판 선택</button>
          <button v-if="selectedBbm" class="btn btn-blue btn-sm" type="button" @click="handleBtnAction('bbmDetail-open')" title="게시판 상세보기">🔍</button>
        </template>
        <span v-if="selectedBbm" style="display:flex;align-items:center;gap:6px;font-size:13px;">
          <b style="color:#1a1a2e;">{{ selectedBbm.bbmNm }}</b>
          <code style="font-size:11px;color:#888;background:#f5f5f5;padding:1px 6px;border-radius:4px;">{{ selectedBbm.bbmCode }}</code>
          <span style="font-size:11px;color:#bbb;">ID: {{ selectedBbm.bbmId }}</span>
        </span>
        <span v-else style="font-size:12px;color:#bbb;">게시판을 선택해주세요.</span>
      </div>
      <span v-if="errors.bbmId" class="field-error">{{ errors.bbmId }}</span>
    </template>
  </bo-form-area>
  <!-- ===== ■.■. 내용 입력 (contentType 에 따라 렌더링) ========================== -->
  <bo-form-area plain-readonly :columns="columns.contentForm" :form="form" :errors="errors"
    :readonly="cfDtlMode" :cols="3" compact :show-actions="false">
    <template #contentNoBbm>
      <div style="color:#bbb;font-size:13px;padding:12px 0;">게시판을 먼저 선택하세요.</div>
    </template>
    <template #contentNotAllow>
      <div style="color:#bbb;font-size:13px;padding:12px 0;">이 게시판은 내용 입력을 지원하지 않습니다.</div>
    </template>
    <template #contentHtmlEditor>
      <div v-if="cfDtlMode" class="readonly-field-plain"
        style="min-height:300px;line-height:1.6;"
        v-html="form.contentHtml || '-'"></div>
      <base-html-editor v-else v-model="form.contentHtml" height="320px" />
    </template>
    <template #attachGrp>
      <div v-if="cfAttachMaxCount > 0">
        <span style="font-size:11px;color:#bbb;margin-bottom:6px;display:block;">({{ cfAllowAttach }})</span>
        <base-attach-grp
          ref="attachGrpRef" :ref-table-nm="refTableNm" :ref-key-id="dtlId"
          :ref-id="dtlId ? 'BBS-'+dtlId : ''" :show-toast="showToast" :readonly="cfDtlMode"
          grp-code="BBS_ATTACH" grp-nm="게시글 첨부파일"
          :max-count="cfAttachMaxCount" :max-size-mb="10" allow-ext="*" />
      </div>
      <div v-else style="color:#bbb;font-size:13px;padding:4px 0;">이 게시판은 첨부파일을 지원하지 않습니다.</div>
    </template>
  </bo-form-area>
  <!-- ===== ■.■. 폼 액션 (보기모드: 수정/닫기 · 수정모드: 저장/취소) ================== -->
  <bo-form-actions v-if="active" :readonly="cfDtlMode" :show-delete="false" :show-cancel="!cfIsNew"
    :edit-click="() => handleBtnAction('form-edit')"
    :save-click="() => handleBtnAction('form-save')"
    :delete-click="() => handleBtnAction('form-delete')"
    :cancel-click="() => handleBtnAction('form-cancel')"
    :close-click="() => handleBtnAction('form-close')" />
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 게시판 선택 팝업 =============================================== -->
  <bo-cm-popup-modal v-if="showBbmModal" popup-cmd="cmPopup-bbm-select" popup-code="bbm" :on-callback="fnCallbackModal" />
  <!-- ===== □. 게시판 선택 팝업 =============================================== -->
  <!-- ===== ■. 게시판 상세보기 팝업 ============================================= -->
  <bo-modal :show="coUtil.cofAnd(showBbmDetail, selectedBbm)" title="게시판 상세"
    width="420px" modal-name="bbm-detail" :on-callback="fnCallbackModal" @close="showBbmDetail = false">
    <bo-form-area plain-readonly v-if="selectedBbm" :columns="columns.bbmDetail" :form="selectedBbm" :errors="{}"
      :cols="1" compact readonly :show-actions="false" />
    <template #footer>
      <button class="btn btn_close" @click="handleBtnAction('bbmDetail-close')">닫기</button>
    </template>
  </bo-modal>
  <!-- ===== □. 게시판 상세보기 팝업 ============================================= -->
</bo-container>
</div>
`,
};
