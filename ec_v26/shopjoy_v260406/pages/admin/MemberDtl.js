/* ShopJoy Admin - 회원관리 상세/등록 */
window.MemberDtl = {
  name: 'MemberDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId'],
  setup(props) {
    const { reactive, computed, onMounted } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const form = reactive({
      email: '', name: '', phone: '', grade: '일반', status: '활성',
      joinDate: '', lastLogin: '', orderCount: 0, totalPurchase: 0, memo: '',
    });

    onMounted(() => {
      if (!isNew.value) {
        const m = props.adminData.getMember(props.editId);
        if (m) Object.assign(form, { ...m });
      }
    });

    const save = () => {
      if (!form.email || !form.name) { props.showToast('필수 항목을 입력해주세요.', 'error'); return; }
      if (isNew.value) {
        props.adminData.members.push({
          ...form, userId: props.adminData.nextId(props.adminData.members, 'userId'),
          joinDate: form.joinDate || new Date().toISOString().slice(0, 10), orderCount: 0, totalPurchase: 0,
        });
        props.showToast('회원이 등록되었습니다.');
      } else {
        const idx = props.adminData.members.findIndex(m => m.userId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.members[idx], form);
        props.showToast('저장되었습니다.');
      }
      props.navigate('memberMng');
    };

    return { isNew, form, save };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '회원 등록' : '회원 수정' }}</div>
  <div class="card">
    <!-- 기본정보 폼 -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">이메일 <span class="req">*</span></label>
        <input class="form-control" v-model="form.email" placeholder="이메일 주소" />
      </div>
      <div class="form-group">
        <label class="form-label">이름 <span class="req">*</span></label>
        <input class="form-control" v-model="form.name" placeholder="이름" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">연락처</label>
        <input class="form-control" v-model="form.phone" placeholder="010-0000-0000" />
      </div>
      <div class="form-group">
        <label class="form-label">등급</label>
        <select class="form-control" v-model="form.grade">
          <option>일반</option><option>우수</option><option>VIP</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" v-model="form.status">
          <option>활성</option><option>정지</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">가입일</label>
        <input class="form-control" type="date" v-model="form.joinDate" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">메모</label>
      <textarea class="form-control" v-model="form.memo" rows="3" placeholder="관리자 메모"></textarea>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('memberMng')">취소</button>
    </div>

    <!-- 연관 이력 -->
    <member-hist
      v-if="!isNew"
      :navigate="navigate"
      :admin-data="adminData"
      :show-ref-modal="showRefModal"
      :member-id="editId"
    />
  </div>
</div>
`
};
