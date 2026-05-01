/* ShopJoy Admin - 회원관리 상세/등록 */
window.MbMemberDtl = {
  name: 'MbMemberDtl',
  props: ['detailModal', 'handleSave', 'handleDelete', 'closeDetail'],
  setup(props) {
    const { watch, ref, reactive, onMounted } = Vue;
    const currentId = ref(props.detailModal.editId);
    const codes = reactive({ member_grades: [], member_statuses: [] });

    watch(() => props.detailModal.editId, (newId) => {
      if (newId) currentId.value = newId;
    }, { immediate: true });

    onMounted(() => {
      const codeStore = window.sfGetBoCodeStore?.();
      if (codeStore?.snGetGrpCodes) {
        codes.member_grades = codeStore.snGetGrpCodes('MEMBER_GRADE') || [];
        codes.member_statuses = codeStore.snGetGrpCodes('MEMBER_STATUS') || [];
      }
    });

    return { currentId, codes };
  },
  template: /* html */`
<div v-if="detailModal.show">
  <!-- ── 상세/수정 카드 ───────────────────────────────────────────────────── -->
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

  <!-- ── 이력정보 카드 ─────────────────────────────────────────────────────── -->
  <div v-if="!detailModal.isNew" class="card">
    <mb-member-hist :member-id="currentId" :key="currentId" />
  </div>
</div>
`
};
