/* ShopJoy Admin - 회원관리 상세/등록 */
window.MemberDtl = {
  name: 'MemberDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { reactive, computed, onMounted } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const form = reactive({
      email: '', name: '', phone: '', grade: '일반', status: '활성',
      joinDate: '', lastLogin: '', orderCount: 0, totalPurchase: 0, memo: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      email: yup.string().required('이메일을 입력해주세요.').email('올바른 이메일 형식이 아닙니다.'),
      name:  yup.string().required('이름을 입력해주세요.'),
    });

    onMounted(() => {
      if (!isNew.value) {
        const m = props.adminData.getMember(props.editId);
        if (m) Object.assign(form, { ...m });
      }
    });

    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      await window.adminApiCall({
        method: isNew.value ? 'post' : 'put',
        path: `members/${form.userId}`,
        data: { ...form },
        confirmTitle: isNew.value ? '등록' : '저장',
        confirmMsg: isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?',
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: isNew.value ? '등록되었습니다.' : '저장되었습니다.',
        onLocal: () => {
          if (isNew.value) {
            props.adminData.members.push({
              ...form, userId: props.adminData.nextId(props.adminData.members, 'userId'),
              joinDate: form.joinDate || new Date().toISOString().slice(0, 10), orderCount: 0, totalPurchase: 0,
            });
          } else {
            const idx = props.adminData.members.findIndex(x => x.userId === props.editId);
            if (idx !== -1) Object.assign(props.adminData.members[idx], { ...form });
          }
        },
        navigate: props.navigate,
        navigateTo: 'ecMemberMng',
      });
    };

    return { isNew, form, errors, save };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '회원 등록' : '회원 수정' }}</div>
  <div class="card">
    <!-- 기본정보 폼 -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">이메일 <span class="req">*</span></label>
        <input class="form-control" v-model="form.email" placeholder="이메일 주소" :class="errors.email ? 'is-invalid' : ''" />
        <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">이름 <span class="req">*</span></label>
        <input class="form-control" v-model="form.name" placeholder="이름" :class="errors.name ? 'is-invalid' : ''" />
        <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
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
      <button class="btn btn-secondary" @click="navigate('ecMemberMng')">취소</button>
    </div>
  </div>

  <!-- 연관 이력 -->
  <div v-if="!isNew" class="card">
    <member-hist
      :navigate="navigate"
      :admin-data="adminData"
      :show-ref-modal="showRefModal"
      :member-id="editId"
    />
  </div>
</div>
`
};
