/* ShopJoy Admin - 사용자관리(관리자) 상세/등록 */
window.UserDtl = {
  name: 'UserDtl',
  props: ['navigate', 'adminData', 'showToast', 'editId'],
  setup(props) {
    const { reactive, computed, onMounted } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const form = reactive({
      loginId: '', name: '', email: '', phone: '', role: '운영자', dept: '', status: '활성', password: '',
    });

    onMounted(() => {
      if (!isNew.value) {
        const u = props.adminData.adminUsers.find(x => x.adminUserId === props.editId);
        if (u) Object.assign(form, { ...u, password: '' });
      }
    });

    const save = () => {
      if (!form.loginId || !form.name || !form.email) { props.showToast('필수 항목을 입력해주세요.', 'error'); return; }
      if (isNew.value && !form.password) { props.showToast('신규 등록 시 비밀번호는 필수입니다.', 'error'); return; }
      if (isNew.value) {
        const { password, ...rest } = form;
        props.adminData.adminUsers.push({
          ...rest, adminUserId: props.adminData.nextId(props.adminData.adminUsers, 'adminUserId'),
          lastLogin: '-', regDate: new Date().toISOString().slice(0, 10),
        });
        props.showToast('사용자가 등록되었습니다.');
      } else {
        const idx = props.adminData.adminUsers.findIndex(x => x.adminUserId === props.editId);
        if (idx !== -1) {
          const { password, ...rest } = form;
          Object.assign(props.adminData.adminUsers[idx], rest);
        }
        props.showToast('저장되었습니다.');
      }
      props.navigate('userMng');
    };

    return { isNew, form, save };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '사용자 등록' : '사용자 수정' }}</div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">로그인ID <span class="req">*</span></label>
        <input class="form-control" v-model="form.loginId" placeholder="로그인 아이디" :readonly="!isNew" :style="!isNew?'background:#f5f5f5;':''" />
      </div>
      <div class="form-group">
        <label class="form-label">비밀번호 {{ isNew ? '' : '(변경 시 입력)' }} <span v-if="isNew" class="req">*</span></label>
        <input class="form-control" type="password" v-model="form.password" placeholder="비밀번호" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">이름 <span class="req">*</span></label>
        <input class="form-control" v-model="form.name" placeholder="이름" />
      </div>
      <div class="form-group">
        <label class="form-label">이메일 <span class="req">*</span></label>
        <input class="form-control" v-model="form.email" placeholder="이메일" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">연락처</label>
        <input class="form-control" v-model="form.phone" placeholder="010-0000-0000" />
      </div>
      <div class="form-group">
        <label class="form-label">부서</label>
        <input class="form-control" v-model="form.dept" placeholder="IT팀, 운영팀 등" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">권한</label>
        <select class="form-control" v-model="form.role">
          <option>슈퍼관리자</option><option>관리자</option><option>운영자</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" v-model="form.status">
          <option>활성</option><option>비활성</option>
        </select>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('userMng')">취소</button>
    </div>
  </div>
</div>
`
};
