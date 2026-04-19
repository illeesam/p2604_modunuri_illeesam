/* ShopJoy Admin - 회원관리 상세/등록 */
window.MbMemberDtl = {
  name: 'MbMemberDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, onMounted, onBeforeUnmount, ref, nextTick } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const form = reactive({
      userId: null,
      email: '', memberNm: '', phone: '', gradeCd: '일반', statusCd: '활성',
      joinDate: '', lastLogin: '', orderCount: 0, totalPurchase: 0, memo: '',
    });
    const errors = reactive({});

    const memoEl = ref(null);
    let _qMemo = null;

    const schema = yup.object({
      email: yup.string().required('이메일을 입력해주세요.').email('올바른 이메일 형식이 아닙니다.'),
      memberNm:  yup.string().required('이름을 입력해주세요.'),
    });

    onMounted(async () => {
      if (!isNew.value) {
        const m = props.adminData.getMember(props.editId);
        if (m) Object.assign(form, { ...m });
      }
      await nextTick();
      if (memoEl.value) {
        _qMemo = new Quill(memoEl.value, {
          theme: 'snow',
          placeholder: '관리자 메모',
          modules: { toolbar: [['bold','italic','underline'],[{color:[]}],[{list:'ordered'},{list:'bullet'}],['link','clean']] }
        });
        if (form.memo) _qMemo.root.innerHTML = form.memo;
        _qMemo.on('text-change', () => { form.memo = _qMemo.root.innerHTML; });
      }
    });

    onBeforeUnmount(() => { if (_qMemo) { form.memo = _qMemo.root.innerHTML; _qMemo = null; } });

    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const isNewMember = isNew.value;
      const ok = await props.showConfirm(isNewMember ? '등록' : '저장', isNewMember ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      if (isNewMember) {
        props.adminData.members.push({
          ...form, userId: props.adminData.nextId(props.adminData.members, 'userId'),
          joinDate: form.joinDate || new Date().toISOString().slice(0, 10), orderCount: 0, totalPurchase: 0,
        });
      } else {
        const idx = props.adminData.members.findIndex(x => x.userId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.members[idx], { ...form });
      }
      try {
        const res = await (isNewMember ? window.adminApi.post(`members/${form.userId}`, { ...form }) : window.adminApi.put(`members/${form.userId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(isNewMember ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('mbMemberMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    return { isNew, form, errors, save, memoEl };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '회원 등록' : (viewMode ? '회원 상세' : '회원 수정') }}<span v-if="!isNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.userId }}</span></div>
  <div class="card">
    <!-- 기본정보 폼 -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">이메일 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.email" placeholder="이메일 주소" :readonly="viewMode" :class="errors.email ? 'is-invalid' : ''" />
        <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">이름 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.memberNm" placeholder="이름" :readonly="viewMode" :class="errors.memberNm ? 'is-invalid' : ''" />
        <span v-if="errors.memberNm" class="field-error">{{ errors.memberNm }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">연락처</label>
        <input class="form-control" v-model="form.phone" placeholder="010-0000-0000" :readonly="viewMode" />
      </div>
      <div class="form-group">
        <label class="form-label">등급</label>
        <select class="form-control" v-model="form.gradeCd" :disabled="viewMode">
          <option>일반</option><option>우수</option><option>VIP</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" v-model="form.statusCd" :disabled="viewMode">
          <option>활성</option><option>정지</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">가입일</label>
        <input class="form-control" type="date" v-model="form.joinDate" :readonly="viewMode" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">메모</label>
      <div v-if="viewMode" class="form-control" style="min-height:90px;line-height:1.6;" v-html="form.memo || '<span style=color:#bbb>-</span>'"></div>
      <div v-else ref="memoEl" style="min-height:90px;background:#fff;"></div>
    </div>
    <div class="form-actions">
      <template v-if="viewMode">
        <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
        <button class="btn btn-secondary" @click="navigate('mbMemberMng')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('mbMemberMng')">취소</button>
      </template>
    </div>
  </div>

  <!-- 연관 이력 -->
  <div v-if="!isNew" style="margin-top:20px;">
    <mb-member-hist
      :navigate="navigate"
      :admin-data="adminData"
      :show-ref-modal="showRefModal"
      :member-id="editId"
    />
  </div>
</div>
`
};
