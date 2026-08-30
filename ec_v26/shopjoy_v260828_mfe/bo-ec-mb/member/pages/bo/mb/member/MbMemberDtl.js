/* ShopJoy Admin - 회원관리 상세/등록 */
export default {
  name: 'MbMemberDtl',
  props: {
    navigate:      { type: Function, required: true },        // 페이지 이동
    dtlId:         { type: String, default: null },           // 수정 대상 ID
    detailModal:   { type: Object, default: () => ({}) },     // 부모 Mng 의 detailPanel 객체
    errors:        { type: Object, default: () => ({}) },     // 부모 Mng 의 저장 검증 오류 (항목 아래 빨간 라벨)
    active:        { type: Boolean, default: true },          // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    handleSave:    { type: Function, default: () => {} },     // 저장 콜백
    handleDelete:  { type: Function, default: () => {} },     // 삭제 콜백
    closeDetail:   { type: Function, default: () => {} },     // 닫기 콜백
    switchToEdit:  { type: Function, default: () => {} },     // 보기→수정 전환 콜백
    dtlMode:       { type: String, default: 'view' },         // 상세 모드 (new/view/edit)
    reloadTrigger: { type: Number, default: 0 },              // 첫 탭 저장 시 상위 Mng 재조회 (UX-bo §18)
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { watch, ref, reactive, computed, onMounted } = Vue;
    const currentId = ref(props.detailModal.dtlId); // 현재 선택된 회원 ID (이력 컴포넌트 key용)
    const codes = reactive({ member_grades: [], member_statuses: [] }); // 공통코드
    const showToast   = window.boApp.showToast;
    const showConfirm = window.boApp.showConfirm;

    /* cfStandalone — 부모 Mng 없이 독립 새창(Ctrl+클릭 등)으로 바로 열린 경우.
       인라인 임베드는 부모가 항상 실제 detailPanel 객체를 :detail-modal 로 넘기고, 독립 진입은
       boAppBase.js 의 공용 prop 세트에 detailModal 이 없어 선언 default({})를 그대로 받는다.
       "detailModal이 비어있다"로 판별해야 신규 등록(dtlId 없음) 독립창도 정확히 잡힌다
       (dtlId 유무만으로 판별하면 신규 등록 독립창이 false 로 오판정되던 버그, 2026-08-22 발견).
       standalone* 은 이 화면 자체 상태다 (부모 콜백 handleSave/closeDetail/switchToEdit 이 전부 기본 no-op 이라 대신 필요). */
    const cfStandalone = computed(() => !props.detailModal || Object.keys(props.detailModal).length === 0);
    const standaloneForm = reactive({});
    const standaloneErrors = reactive({});
    const standaloneEditing = ref(false); // props.dtlMode 는 boAppBase.js standaloneDtlMode 가 관리

    /* fnLoadStandalone — 독립 진입 시 이 화면이 직접 회원 데이터를 조회 (인라인은 부모가 이미 넣어줌) */
    const fnLoadStandalone = async (id) => {
      if (!id) return;
      try {
        const res = await window.boApiSvc.mbMember.getById(id, '회원관리', '상세조회');
        const d = res.data?.data || res.data;
        if (d) Object.assign(standaloneForm, d);
      } catch (err) { console.error('[MbMemberDtl fnLoadStandalone]', err); }
    };
    onMounted(() => { if (cfStandalone.value) fnLoadStandalone(props.dtlId); });
    watch(() => props.dtlId, (id) => { if (cfStandalone.value) fnLoadStandalone(id); });
    /* props.dtlMode('view'/'edit')를 이 화면의 편집 토글로 그대로 반영 */
    watch(() => props.dtlMode, (m) => { standaloneEditing.value = (m === 'edit'); }, { immediate: true });

    const cfForm     = computed(() => cfStandalone.value ? standaloneForm : (props.detailModal.form || {}));
    const cfErrors   = computed(() => cfStandalone.value ? standaloneErrors : props.errors);
    const cfDtlId    = computed(() => cfStandalone.value ? props.dtlId : props.detailModal.dtlId);
    const cfIsNew    = computed(() => cfStandalone.value ? !props.dtlId : !!props.detailModal.isNew);
    const cfActive   = computed(() => cfStandalone.value ? standaloneEditing.value : props.active);

    /* fnShareUrl — 이 회원 상세를 가리키는 독립 새창 딥링크 URL 생성 */
    const fnShareUrl = () => {
      const qs = new URLSearchParams();
      qs.set('page', 'mbMemberDtl');
      qs.set('id', cfDtlId.value);
      qs.set('embed', '1');
      return `${window.location.origin}${window.location.pathname}?${qs.toString()}`;
    };
    /* handleShareKakao — 카카오톡 공유(피드 카드, 상세보기 모드 전용) */
    const handleShareKakao = () => {
      try {
        window.coExtSdk.shareKakao({
          title: `회원 ${cfDtlId.value} - ShopJoy BO`,
          description: cfForm.value.memberNm || '',
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
    /* pdfAreaRef — 회원 상세 카드 캡처 대상. handleExportPdf — PDF 다운로드(항상 노출) */
    const pdfAreaRef = ref(null);
    const pdfExporting = ref(false);
    const handleExportPdf = async () => {
      pdfExporting.value = true;
      try {
        const filename = coUtil.cofBuildExportFilename(`회원상세_${cfDtlId.value || 'new'}.pdf`);
        await window.boUtil.bofExportPdf(pdfAreaRef.value, filename, showToast);
      } finally {
        pdfExporting.value = false;
      }
    };

    /* fnSaveStandalone — 독립 진입 시 자체 저장 (인라인은 부모 handleSave 위임) */
    const fnSaveStandalone = async () => {
      Object.keys(standaloneErrors).forEach(k => delete standaloneErrors[k]);
      if (!standaloneForm.loginId) standaloneErrors.loginId = '로그인ID를 입력해주세요.';
      else if (!coUtil.cofIsValidEmail(standaloneForm.loginId)) standaloneErrors.loginId = '로그인ID는 이메일 형식이어야 합니다.';
      if (!standaloneForm.memberNm) standaloneErrors.memberNm = '이름을 입력해주세요.';
      if (!coUtil.cofIsValidEmail(standaloneForm.memberEmail)) standaloneErrors.memberEmail = '올바른 이메일 형식이 아닙니다.';
      if (!coUtil.cofIsValidMobile(standaloneForm.memberPhone)) standaloneErrors.memberPhone = '올바른 휴대전화 형식이 아닙니다. (예: 010-1234-5678)';
      if (Object.keys(standaloneErrors).length) { showToast('입력 내용을 확인해주세요.', 'error'); return; }
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;
      try {
        await window.boApiSvc.mbMember.update(standaloneForm.memberId, standaloneForm, '회원관리', '저장');
        showToast('저장되었습니다.', 'success');
        props.navigate('__cancelEdit__'); // boAppBase.js standaloneDtlMode 를 view 로 되돌림
        await fnLoadStandalone(props.dtlId); // 서버 기준으로 새로고침
      } catch (err) {
        showToast(coUtil.cofErrMsg(err), 'error', 0);
      }
    };

    /* fnDeleteStandalone — 독립 진입 시 자체 삭제 (삭제 후엔 볼 것이 없으니 창을 닫는다) */
    const fnDeleteStandalone = async () => {
      const ok = await showConfirm('삭제', `[${standaloneForm.memberNm || cfDtlId.value}] 회원을 삭제하시겠습니까?`);
      if (!ok) return;
      try {
        await window.boApiSvc.mbMember.remove(standaloneForm.memberId, '회원관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        try { window.close(); } catch (e) {}
      } catch (err) {
        showToast(coUtil.cofErrMsg(err), 'error', 0);
      }
    };

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ MbMemberDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장 (부모 콜백 — 독립 진입이면 자체 저장)
      if (cmd === 'form-save') {
        return cfStandalone.value ? fnSaveStandalone() : props.handleSave();
      // 폼 삭제 (부모 콜백 — 독립 진입이면 자체 삭제)
      } else if (cmd === 'form-delete') {
        return cfStandalone.value ? fnDeleteStandalone() : props.handleDelete();
      // 폼 취소 (편집 중 되돌리기 — 독립 진입이면 보기 모드로 복귀, 인라인은 닫기와 동일 취급)
      } else if (cmd === 'form-cancel') {
        return cfStandalone.value ? props.navigate('__cancelEdit__') : props.closeDetail();
      // 폼 닫기 (모드 무관 무조건 닫기 — 독립 진입이면 새창을 진짜로 닫는다. 부모 콜백은 기존 그대로)
      } else if (cmd === 'form-close') {
        return cfStandalone.value ? props.navigate('__closeDtl__') : props.closeDetail();
      // 보기→수정 전환 (부모 콜백 — 독립 진입이면 boAppBase.js standaloneDtlMode 전환 신호)
      } else if (cmd === 'form-switch-edit') {
        return cfStandalone.value ? props.navigate('__switchToEdit__') : props.switchToEdit();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* watch — dtlId 변경 시 currentId 갱신 */
    watch(() => props.detailModal.dtlId, (newId) => {
      if (newId) { currentId.value = newId; }
    }, { immediate: true });

    /* initPage — 진입 시 이 화면이 쓰는 코드그룹만 지연 로딩.
       (이전에는 스토어에서 읽기만 했다 — 부팅 일괄적재를 전제한 코드였고,
        지연 로딩 전환 후에는 요청하지 않은 그룹이 스토어에 없어 select 가 비었다) */
    const initPage = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['MEMBER_GRADE', 'MEMBER_STATUS_CD'], {compNm: 'bo-mbMemberDtl'});
      codes.member_grades = codeStore.sgGetGrpCodes('MEMBER_GRADE');
      codes.member_statuses = codeStore.sgGetGrpCodes('MEMBER_STATUS_CD');
    };
    onMounted(initPage);

    /* policy: 상위 Mng 이 reloadTrigger 증가시키면 detailModal.form 재조회 */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      const id = props.detailModal && props.detailModal.dtlId;
      if (!id || id === '__new__') { return; }
      try {
        const res = await window.boApiSvc.mbMember.getById(id, '회원관리', '상세조회');
        const d = res.data?.data || res.data;
        if (d && props.detailModal && props.detailModal.form) { Object.assign(props.detailModal.form, d); }
      } catch (err) { console.error('[MbMemberDtl reloadTrigger]', err); }
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // 기본 폼
    const columns = {};
    columns.baseForm = [
      { type: 'group', label: '기본정보' },
      { key: 'loginId',        label: '로그인ID', type: 'text', required: true, placeholder: '로그인ID (이메일 형식)',
        validate: (v) => v && !coUtil.cofIsValidEmail(v) ? '로그인ID는 이메일 형식이어야 합니다.' : null },
      { key: 'memberEmail',    label: '이메일',   type: 'text', placeholder: '수신용 이메일',
        validate: (v) => !coUtil.cofIsValidEmail(v) ? '올바른 이메일 형식이 아닙니다.' : null },
      { key: 'memberNm',       label: '이름',      type: 'text', required: true, placeholder: '이름' },
      { key: 'memberPhone',    label: '연락처',    type: 'text', placeholder: '010-0000-0000',
        validate: (v) => !coUtil.cofIsValidMobile(v) ? '올바른 휴대전화 형식이 아닙니다. (예: 010-1234-5678)' : null },
      { type: 'group', label: '인증정보' },
      { key: 'gradeCd',        label: '등급',      type: 'select', options: () => codes.member_grades },
      { key: 'memberStatusCd', label: '상태',      type: 'select', options: () => codes.member_statuses },
      { type: 'group', label: '생성정보' },
      { key: 'joinDate',       label: '가입일',    type: 'date' },
      { key: 'memberMemo',     label: '메모',      type: 'textarea', rows: 6,
        placeholder: '관리자 메모' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      currentId,       // 상태 / 데이터
      cfStandalone, cfForm, cfErrors, cfDtlId, cfIsNew, cfActive, // 독립 새창 지원
      handleShareKakao, handleCopyLink, pdfAreaRef, pdfExporting, handleExportPdf, // 링크/카카오공유/PDF
      handleBtnAction,                                                                 // dispatch (모든 이벤트 / 액션 라우팅)
    };
  },
  template: /* html */`
<div ref="pdfAreaRef">
<!-- ===== ■. 상세/수정 카드 (항상 표시) ====================================== -->
<bo-container body-style="padding:12px;"
  :title="!cfActive ? '회원 상세' : (cfIsNew ? '회원 등록' : '회원 수정')"
  :title-id="!cfActive ? '' : (cfIsNew ? '' : (cfForm.memberId || ''))">
  <template #toolbar-actions>
    <button v-if="!cfActive ? !cfIsNew : false" class="btn btn_link" title="링크 공유(URL만)" @click="handleCopyLink">🔗</button>
    <button v-if="!cfActive ? !cfIsNew : false" class="btn btn_kakao" title="카카오톡 공유" @click="handleShareKakao">💬</button>
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
  <!-- ===== ■.■. 폼 영역 (BoFormArea 자동 렌더) ============================== -->
  <!-- cfForm — 인라인은 detailModal.form(부모 제공), 독립 진입은 이 화면이 직접 조회한 standaloneForm -->
  <bo-form-area plain-readonly :columns="columns.baseForm" :form="cfForm" :errors="cfErrors"
    :readonly="!cfActive" :cols="3" compact :show-actions="false" />
  <!-- ===== □.■. 폼 영역 ================================================== -->
  <!-- ===== ■.■. 하단 액션 (Mng 인라인 상세 패널 표준 — 처리버튼은 하단 중앙 정렬) ============== -->
  <div v-if="cfDtlId" class="form-actions">
    <template v-if="!cfActive">
      <button class="btn btn_edit" @click="handleBtnAction('form-switch-edit')">수정</button>
      <!-- 2026-08-30: 정책 표준(보기모드 [수정][삭제][닫기])에 맞춰 누락돼 있던 [삭제] 추가.
           패턴 A 전환으로 편집모드에서 [삭제]를 뺐으니, 보기모드에 없으면 이 화면에서 회원
           삭제 자체가 아예 불가능해지는 회귀라 여기서 같이 채운다. -->
      <button v-if="!cfIsNew" class="btn btn_delete" @click="handleBtnAction('form-delete')">삭제</button>
      <button class="btn btn_close" @click="handleBtnAction('form-close')">닫기</button>
    </template>
    <template v-if="cfActive">
      <button class="btn btn_save" @click="handleBtnAction('form-save')">저장</button>
      <!-- 2026-08-30: 패턴 A — 편집모드 [삭제] 제거(보기모드에만 유지) -->
      <button class="btn btn_cancel" @click="handleBtnAction('form-cancel')">취소</button>
      <button class="btn btn_close" @click="handleBtnAction('form-close')">닫기</button>
    </template>
  </div>
  <!-- ===== □.■. 하단 액션 ================================================= -->
</bo-container>
</div>
<!-- ===== □. 상세/수정 카드 ================================================ -->
<!-- 이력정보는 목록(MbMemberMng) 관리컬럼의 [이력] 버튼으로만 노출된다 — 상세 하단 상시 렌더 폐지(2026-08-16) -->
`,
};
