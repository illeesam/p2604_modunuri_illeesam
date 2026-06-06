/* ShopJoy Admin - 회원관리 상세/등록 */
window.MbMemberDtl = {
  name: 'MbMemberDtl',
  props: {
    navigate:      { type: Function, required: true },        // 페이지 이동
    dtlId:         { type: String, default: null },           // 수정 대상 ID
    detailModal:   { type: Object, default: () => ({}) },     // 부모 Mng 의 detailPanel 객체
    active:        { type: Boolean, default: true },          // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    handleSave:    { type: Function, default: () => {} },     // 저장 콜백
    handleDelete:  { type: Function, default: () => {} },     // 삭제 콜백
    closeDetail:   { type: Function, default: () => {} },     // 닫기 콜백
    dtlMode:       { type: String, default: 'view' },         // 상세 모드 (new/view/edit)
    reloadTrigger: { type: Number, default: 0 },              // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { watch, ref, reactive, onMounted } = Vue;
    const currentId = ref(props.detailModal.dtlId); // 현재 선택된 회원 ID (이력 컴포넌트 key용)
    const codes = reactive({ member_grades: [], member_statuses: [] }); // 공통코드

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ MbMemberDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장 (부모 콜백)
      if (cmd === 'form-save') {
        return props.handleSave();
      // 폼 삭제 (부모 콜백)
      } else if (cmd === 'form-delete') {
        return props.handleDelete();
      // 폼 닫기 (부모 콜백)
      } else if (cmd === 'form-close') {
        return props.closeDetail();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* watch — dtlId 변경 시 currentId 갱신 */
    watch(() => props.detailModal.dtlId, (newId) => {
      if (newId) { currentId.value = newId; }
    }, { immediate: true });

    // ★ onMounted — 진입 시 공통코드 로드
    onMounted(() => {
      const codeStore = window.sfGetBoCodeStore();
      codes.member_grades = codeStore.sgGetGrpCodes('MEMBER_GRADE');
      codes.member_statuses = codeStore.sgGetGrpCodes('MEMBER_STATUS');
    });

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
      { key: 'loginId',        label: '이메일',    type: 'text', required: true, placeholder: '이메일 주소' },
      { key: 'memberNm',       label: '이름',      type: 'text', required: true, placeholder: '이름' },
      { key: 'memberPhone',    label: '연락처',    type: 'text', placeholder: '010-0000-0000' },
      { key: 'gradeCd',        label: '등급',      type: 'select', options: () => codes.member_grades },
      { key: 'memberStatusCd', label: '상태',      type: 'select', options: () => codes.member_statuses },
      { key: 'joinDate',       label: '가입일',    type: 'date' },
      { key: 'memberMemo',     label: '메모',      type: 'textarea', rows: 6,
        placeholder: '관리자 메모' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      currentId, codes,                                                                // 상태 / 데이터
      handleBtnAction,                                                                 // dispatch (모든 이벤트 / 액션 라우팅)
    };
  },
  template: /* html */`
<!-- ===== ■. 상세/수정 카드 (항상 표시) ====================================== -->
<bo-container body-style="padding:12px;"
  :title="!active ? '회원 상세' : (detailModal.isNew ? '신규 등록' : '상세 / 수정')"
  :title-id="!active ? '' : (detailModal.isNew ? '' : (detailModal.form?.memberId || ''))">
  <!-- ===== ■.■. 상세 툴바: 저장/삭제/닫기 (active 시에만 버튼 노출) ============ -->
  <template v-if="active" #toolbar-actions>
    <button class="btn btn-primary btn-sm" @click="handleBtnAction('form-save')">저장</button>
    <button v-if="!detailModal.isNew" class="btn btn-danger btn-sm" @click="handleBtnAction('form-delete')">삭제</button>
    <button class="btn btn-secondary btn-sm" @click="handleBtnAction('form-close')">닫기</button>
  </template>
  <!-- ===== □.■. 상세 툴바 ================================================ -->
  <!-- ===== ■.■. 폼 영역 (BoFormArea 자동 렌더) ============================== -->
  <bo-form-area :columns="columns.baseForm" :form="detailModal.form" :errors="{}"
    :readonly="!active" :cols="3" compact :show-actions="false" />
  <!-- ===== □.■. 폼 영역 ================================================== -->
</bo-container>
<!-- ===== □. 상세/수정 카드 ================================================ -->
<!-- ===== ■. 이력정보 카드 (행 선택 + 기존 회원일 때만) ============================= -->
<bo-container v-if="active && !detailModal.isNew">
  <mb-member-hist :member-id="currentId" :key="currentId" />
</bo-container>
<!-- ===== □. 이력정보 카드 ================================================= -->
`,
};
