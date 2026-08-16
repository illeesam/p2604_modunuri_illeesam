/* ShopJoy Admin - 게시판관리 상세/등록 */
window.SyBbmDtl = {
  name: 'SyBbmDtl',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
    dtlId:       { type: String, default: null }, // 수정 대상 ID
    dtlMode:     { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    active:      { type: Boolean, default: true }, // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-bo §18)
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, watch, onMounted, ref } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달

    const modals = reactive({ isPathPickModal: false });
    const uiState = reactive({ loading: false, error: null });
    const codes = reactive({ BBM_TYPE: [], BBM_COMMENT_TYPE: [], BBM_ATTACH_TYPE: [], BBM_CONTENT_TYPE: [], BBM_SCOPE_TYPE: [], USE_YN: [],
      ALLOW_YN: [],
    });

    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDtlMode = computed(() => props.dtlMode === 'view'); // dtlMode: 'view'이면 읽기전용

    const form = reactive({
      bbmId: null, bbmCode: '', bbmNm: '', bbmTypeCd: '',
      allowComment: '', allowAttach: '', allowLike: '',
      contentTypeCd: '', scopeTypeCd: '',
      sortOrd: '', useYn: '', bbmRemark: '', pathId: null,
    });
    // 신규 진입 시에만 채울 기본값 (미선택/검색초기화 inactive 상태에서는 빈 폼 유지)
    const _applyNewDefaults = () => {
      Object.assign(form, {
        bbmTypeCd: '일반',
        allowComment: '불가', allowAttach: '불가', allowLike: 'N',
        contentTypeCd: 'textarea', scopeTypeCd: '공개',
        sortOrd: 1, useYn: 'Y',
      });
    };
    const errors = reactive({});

    /* ── 표시경로 모달 ── */

    const schema = yup.object({
      bbmCode: yup.string().required('게시판코드를 입력해주세요.'),
      bbmNm: yup.string().required('게시판명을 입력해주세요.'),
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyBbmDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장 (신규 등록 또는 수정)
      if (cmd === 'form-save') {
        return handleSave();
      // 폼 편집 취소 → 상세영역 유지 + 빈 신규 폼으로 초기화 (영역 사라지지 않음)
      } else if (cmd === 'form-cancel') {
        return props.navigate('__cancelEdit__');
      // 상세 보기 → 편집 모드 전환
      } else if (cmd === 'form-edit') {
        return props.navigate('__switchToEdit__');
      // 폼 닫기 → 상세영역 유지 + 빈 신규 폼으로 초기화
      } else if (cmd === 'form-close') {
        return props.navigate('__cancelEdit__');
      // 표시경로 picker 열기
      } else if (cmd === 'pathModal-open') {
        modals.isPathPickModal = true;
        return;
      // 표시경로 picker 닫기
      } else if (cmd === 'pathModal-close') {
        modals.isPathPickModal = false;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyBbmDtl.js : handleSelectAction -> ', cmd, param);
      // 표시경로 모달에서 경로 선택 → form.pathId 갱신
      if (cmd === 'pathModal-pick') {
        form.pathId = param;
        modals.isPathPickModal = false;
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };


    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (popCmd, param, result) => {
      console.log(' ■■ SyBbmDtl : fnCallbackModal -> ', popCmd, param, result);
      if (popCmd === 'cmPopup-path-pick') {
        if (result == null) {
          modals.isPathPickModal = false;
          return;
        }
        form.pathId = result;
        modals.isPathPickModal = false;
        return;
      } else {
        console.warn('[fnCallbackModal] unknown popCmd:', popCmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* pathLabel — 경로 라벨 */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
        await codeStore.saLoadCodes(['BBM_TYPE_CD', 'BBM_COMMENT_TYPE', 'BBM_ATTACH_TYPE', 'BBM_CONTENT_TYPE', 'SCOPE_TYPE_CD', 'USE_YN', 'ALLOW_YN'], {compNm: 'SyBbmDtl'});
        codes.BBM_TYPE = codeStore.sgGetGrpCodes('BBM_TYPE_CD');
        codes.BBM_COMMENT_TYPE = codeStore.sgGetGrpCodes('BBM_COMMENT_TYPE');
        codes.BBM_ATTACH_TYPE = codeStore.sgGetGrpCodes('BBM_ATTACH_TYPE');
        codes.BBM_CONTENT_TYPE = codeStore.sgGetGrpCodes('BBM_CONTENT_TYPE');
        codes.BBM_SCOPE_TYPE = codeStore.sgGetGrpCodes('SCOPE_TYPE_CD');
        codes.USE_YN       = codeStore.sgGetGrpCodes('USE_YN');
        codes.ALLOW_YN = codeStore.sgGetGrpCodes('ALLOW_YN');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };


    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.syBbm.getById(props.dtlId, '게시판모드관리', '상세조회');
        const data = res.data?.data;
        if (data) { Object.assign(form, data); }
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 상세 조회
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      if (!cfIsNew.value) { await handleLoadDetail(); }
      if (props.active && cfIsNew.value) { _applyNewDefaults(); }
    };
    onMounted(initPage);
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleLoadDetail();
    });

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
        const res = await (cfIsNew.value ? boApiSvc.syBbm.create({ ...form }, '게시판모드관리', '등록') : boApiSvc.syBbm.update(form.bbmId, { ...form }, '게시판모드관리', '저장'));
        if (showToast) { showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('syBbmMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // 기본 폼
    const columns = {};
    columns.baseForm = [
      { type: 'group', label: '게시판 설정' },
      { key: '_siteNm',       label: '사이트명',    type: 'readonly', fmt: () => cfSiteNm.value, colSpan: 3 },
      { key: 'bbmCode',       label: '게시판코드',  type: 'text', required: true, mono: true, placeholder: 'BOARD_CODE' },
      { key: 'bbmNm',         label: '게시판명',    type: 'text', required: true, placeholder: '게시판명' },
      { key: 'bbmTypeCd',     label: '유형',        type: 'select', options: () => codes.BBM_TYPE },
      { key: 'allowComment',  label: '댓글허용',    type: 'select', options: () => codes.BBM_COMMENT_TYPE },
      { key: 'allowAttach',   label: '첨부허용',    type: 'select', options: () => codes.BBM_ATTACH_TYPE },
      { key: 'allowLike',     label: '좋아요허용',  type: 'select', options: () => codes.ALLOW_YN },
      { key: 'contentTypeCd', label: '내용입력',    type: 'select', options: () => codes.BBM_CONTENT_TYPE },
      { key: 'scopeTypeCd',   label: '공개범위',    type: 'select', options: () => codes.BBM_SCOPE_TYPE },
      { key: 'pathId',        label: '표시경로',    type: 'pathPick',
        pathLabel: (id) => pathLabel(id),
        onOpen: () => handleBtnAction('pathModal-open') },
      { key: 'sortOrd',       label: '정렬순서',    type: 'number', min: 1 },
      { key: 'useYn',         label: '사용여부',    type: 'select', options: () => codes.USE_YN },
      { key: 'bbmRemark',     label: '비고',        type: 'text', placeholder: '비고' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {

      modals,   // 모달 표시 상태 모음
      columns,
      form, errors, // 상태 / 데이터
      handleBtnAction, handleSelectAction, fnCallbackModal,                 // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfDtlMode,          // computed
    };
  },
  template: /* html */`
<bo-container :title="!active ? '게시판 상세' : (cfIsNew ? '게시판 등록' : (cfDtlMode ? '게시판 상세' : '게시판 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : form.bbmId)">
  <!-- ===== ■.■. 폼 영역 ================================================== -->
  <bo-form-area plain-readonly :columns="columns.baseForm" :form="form" :errors="errors"
    :readonly="cfDtlMode" :cols="3" compact :show-actions="active"
    @save="handleBtnAction('form-save')"
    @cancel="handleBtnAction('form-cancel')"
    @edit="handleBtnAction('form-edit')"
    @close="handleBtnAction('form-close')" />
  <!-- ===== □.□. 폼 영역 ================================================== -->
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 표시경로 선택 모달 ============================================== -->
  <!-- ===== ■. 조건부 영역 ================================================== -->
  <bo-cm-popup-modal v-if="modals.isPathPickModal" popup-cmd="cmPopup-path-pick" popup-code="path" result-type="id" :init-param="{ bizCd: 'sy_bbm' }" title="게시판 표시경로 선택" :on-callback="fnCallbackModal" />
</bo-container>
<!-- ===== □. 조건부 영역 ================================================== -->
`
};
