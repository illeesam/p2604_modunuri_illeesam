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
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) return;
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      if (typeof handleLoadDetail === 'function') await handleLoadDetail();
      else if (typeof handleSearchDetail === 'function') await handleSearchDetail();
    });

    return { currentId, codes };
  },
  template: /* html */`
<div v-if="detailModal.show">
  <!-- -- 상세/수정 카드 ----------------------------------------------------- -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">{{ detailModal.isNew ? '신규 등록' : '상세 / 수정' }}</span>
      <div style="margin-left:auto;display:flex;gap:6px;">
        <button class="btn btn-blue btn-sm" @click="handleSave">저장</button>
        <button v-if="!detailModal.isNew" class="btn btn-danger btn-sm" @click="handleDelete">삭제</button>
        <button class="btn btn-secondary btn-sm" @click="closeDetail">닫기</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px">
      <div class="form-group"><label class="form-label">이메일 <span style="color:red">*</span></label><input class="form-control" v-model="detailModal.form.email" placeholder="이메일 주소"></div>
      <div class="form-group"><label class="form-label">이름 <span style="color:red">*</span></label><input class="form-control" v-model="detailModal.form.memberNm" placeholder="이름"></div>
      <div class="form-group"><label class="form-label">연락처</label><input class="form-control" v-model="detailModal.form.phone" placeholder="010-0000-0000"></div>
      <div class="form-group"><label class="form-label">등급</label>
        <select class="form-control" v-model="detailModal.form.gradeCd">
          <option v-for="c in codes.member_grades" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">상태</label>
        <select class="form-control" v-model="detailModal.form.statusCd">
          <option v-for="c in codes.member_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">가입일</label><input class="form-control" type="date" v-model="detailModal.form.joinDate"></div>
      <div class="form-group" style="grid-column:1/-1"><label class="form-label">메모</label><textarea class="form-control" rows="6" v-model="detailModal.form.memo" placeholder="관리자 메모"></textarea></div>
    </div>
  </div>

  <!-- -- 이력정보 카드 ------------------------------------------------------- -->
  <div v-if="!detailModal.isNew" class="card">
    <mb-member-hist :member-id="currentId" :key="currentId" />
  </div>
</div>
`
};
