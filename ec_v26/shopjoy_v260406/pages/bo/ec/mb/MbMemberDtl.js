/* ShopJoy Admin - 회원관리 상세/등록 */
window.MbMemberDtl = {
  name: 'MbMemberDtl',
  props: {
    detailModal:  { type: Object, default: () => ({}) }, // 전달값
    handleSave:   { type: Function, default: () => {} }, // 콜백 함수
    handleDelete: { type: Function, default: () => {} }, // 콜백 함수
    closeDetail:  { type: Function, default: () => {} }, // 콜백 함수
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    const { watch, ref, reactive, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const currentId = ref(props.detailModal.dtlId);
    const codes = reactive({ member_grades: [], member_statuses: [] });

    watch(() => props.detailModal.dtlId, (newId) => {
      if (newId) currentId.value = newId;
    }, { immediate: true });

    onMounted(() => {
      const codeStore = window.sfGetBoCodeStore();
      codes.member_grades = codeStore.sgGetGrpCodes('MEMBER_GRADE');
      codes.member_statuses = codeStore.sgGetGrpCodes('MEMBER_STATUS');
    });
    /* policy: parent Mng increments reloadTrigger → 상세 재조회.
       MbMember 은 부모 Mng 의 openDetail() 에서 직접 getById 로 detailModal.form 을
       채우는 패턴이므로, reloadTrigger 신호 수신 시 dtlId 기준으로 재조회한다. */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) return;
      const id = props.detailModal && props.detailModal.dtlId;
      if (!id || id === '__new__') return;
      try {
        const res = await window.boApiSvc.mbMember.getById(id, '회원관리', '상세조회');
        const d = res.data?.data || res.data;
        if (d && props.detailModal && props.detailModal.form) Object.assign(props.detailModal.form, d);
      } catch (err) { console.error('[MbMemberDtl reloadTrigger]', err); }
    });

    // ===== 폼 컬럼 정의 (BoFormArea :columns) ================================
    const baseFormColumns = [
      { key: 'loginId',        label: '이메일',    type: 'text', required: true, placeholder: '이메일 주소' },
      { key: 'memberNm',       label: '이름',      type: 'text', required: true, placeholder: '이름' },
      { key: 'memberPhone',    label: '연락처',    type: 'text', placeholder: '010-0000-0000' },
      { key: 'gradeCd',        label: '등급',      type: 'select', options: () => codes.member_grades },
      { key: 'memberStatusCd', label: '상태',      type: 'select', options: () => codes.member_statuses },
      { key: 'joinDate',       label: '가입일',    type: 'date' },
      { type: 'rowBreak' },
      { key: 'memberMemo',     label: '메모',      type: 'textarea', rows: 6,
        placeholder: '관리자 메모', colSpan: 2 },
    ];

    return { currentId, codes, baseFormColumns };
  },
  template: /* html */`
<div v-if="detailModal.show">
  <!-- 상세/수정 카드 -->
  <div class="card">
    <!-- 상세 툴바: 제목 + 저장/삭제/닫기 -->
    <div class="toolbar">
      <span class="list-title">{{ detailModal.isNew ? '신규 등록' : '상세 / 수정' }}</span>
      <div style="margin-left:auto;display:flex;gap:6px;">
        <button class="btn btn-blue btn-sm" @click="handleSave">저장</button>
        <button v-if="!detailModal.isNew" class="btn btn-danger btn-sm" @click="handleDelete">삭제</button>
        <button class="btn btn-secondary btn-sm" @click="closeDetail">닫기</button>
      </div>
    </div>
    <!-- 폼 영역 (BoFormArea 자동 렌더) - 상단 툴바 버튼 사용으로 :show-actions=false -->
    <div style="padding:12px;">
      <bo-form-area :columns="baseFormColumns" :form="detailModal.form" :errors="{}"
        :readonly="false" :cols="2" :show-actions="false" />
    </div>
  </div>

  <!-- 이력정보 카드 -->
  <div v-if="!detailModal.isNew" class="card">
    <mb-member-hist :member-id="currentId" :key="currentId" />
  </div>
</div>
`
};
