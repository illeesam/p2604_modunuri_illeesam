/* ShopJoy Admin - 문의관리 상세/등록 */
window.ContactDtl = {
  name: 'ContactDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes', 'editId', 'viewMode'],
  setup(props) {
    const { reactive, computed, ref, onMounted, onBeforeUnmount, nextTick } = Vue;
    const isNew = computed(() => !props.editId);
    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const tab = ref('content');

    const form = reactive({
      userId: '', userNm: '', date: '', categoryCd: '배송 문의',
      title: '', content: '', statusCd: '요청', answer: '',
    });
    const errors = reactive({});

    const contentEl = ref(null);
    let _qContent = null;
    const answerEl = ref(null);
    let _qAnswer = null;

    const schema = yup.object({
      title: yup.string().required('제목을 입력해주세요.'),
      content: yup.string().required('문의 내용을 입력해주세요.'),
    });

    onMounted(async () => {
      if (!isNew.value) {
        const c = props.adminData.contacts.find(x => x.inquiryId === props.editId);
        if (c) Object.assign(form, { ...c });
        // 답변 있으면 답변 탭 기본 선택
        if (form.answer) tab.value = 'answer';
      }
      await nextTick();
      const fullToolbar = [[{header:[1,2,3,false]}],['bold','italic','underline'],[{color:[]},{background:[]}],[{list:'ordered'},{list:'bullet'}],['link','blockquote','clean']];
      if (contentEl.value) {
        _qContent = new Quill(contentEl.value, {
          theme: 'snow',
          placeholder: '내용을 입력하세요...',
          modules: { toolbar: fullToolbar }
        });
        if (form.content) _qContent.root.innerHTML = form.content;
        _qContent.on('text-change', () => { form.content = _qContent.root.innerHTML; });
      }
      if (answerEl.value) {
        _qAnswer = new Quill(answerEl.value, {
          theme: 'snow',
          placeholder: '고객에게 전달할 답변을 입력하세요.',
          modules: { toolbar: fullToolbar }
        });
        if (form.answer) _qAnswer.root.innerHTML = form.answer;
        _qAnswer.on('text-change', () => { form.answer = _qAnswer.root.innerHTML; });
      }
    });

    onBeforeUnmount(() => {
      if (_qContent) { form.content = _qContent.root.innerHTML; _qContent = null; }
      if (_qAnswer) { form.answer = _qAnswer.root.innerHTML; _qAnswer = null; }
    });

    const onUserIdChange = () => {
      const m = props.adminData.getMember(Number(form.userId));
      if (m) form.userNm = m.memberNm;
    };

    /* 같은 회원의 다른 문의 */
    const memberContacts = computed(() =>
      props.adminData.contacts.filter(c => String(c.userId) === String(form.userId) && c.inquiryId !== props.editId)
    );

    const statusBadge = s => ({
      '요청': 'badge-orange', '처리중': 'badge-blue', '답변완료': 'badge-green', '취소됨': 'badge-gray'
    }[s] || 'badge-gray');

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
        path: `contacts/${form.inquiryId}`,
        data: { ...form },
        confirmTitle: isNew.value ? '등록' : '저장',
        confirmMsg: isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?',
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: isNew.value ? '등록되었습니다.' : '저장되었습니다.',
        onLocal: () => {
          if (isNew.value) {
            props.adminData.contacts.push({ ...form, inquiryId: props.adminData.nextId(props.adminData.contacts, 'inquiryId'), userId: Number(form.userId), date: form.date || new Date().toISOString().slice(0, 16).replace('T', ' ') });
          } else {
            const idx = props.adminData.contacts.findIndex(x => x.inquiryId === props.editId);
            if (idx !== -1) Object.assign(props.adminData.contacts[idx], { ...form });
          }
        },
        navigate: props.navigate,
        navigateTo: 'syContactMng',
      });
    };

    const saveAnswer = () => {
      if (!isNew.value) {
        const idx = props.adminData.contacts.findIndex(x => x.inquiryId === props.editId);
        if (idx !== -1) {
          props.adminData.contacts[idx].answer = form.answer;
          if (form.answer) props.adminData.contacts[idx].statusCd = '답변완료';
        }
      }
      props.showToast('답변이 저장되었습니다.');
    };

    return { isNew, tab, form, errors, memberContacts, statusBadge, save, saveAnswer, onUserIdChange, siteNm, contentEl, answerEl };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '문의 등록' : (viewMode ? '문의 상세' : '문의 수정') }}</div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ siteNm }}</div>
      </div>
    </div>
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:tab==='content'}" @click="tab='content'">문의 내용</button>
      <button class="tab-btn" :class="{active:tab==='answer'}" @click="tab='answer'">답변</button>
      <button v-if="!isNew && form.userId" class="tab-btn" :class="{active:tab==='history'}" @click="tab='history'">
        회원 문의 이력 <span class="tab-count">{{ memberContacts.length }}</span>
      </button>
    </div>

    <!-- 문의 내용 -->
    <div v-show="tab==='content'">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">회원ID</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input class="form-control" v-model="form.userId" placeholder="회원 ID" @change="onUserIdChange" :readonly="viewMode" />
            <span v-if="form.userId" class="ref-link" @click="showRefModal('member', Number(form.userId))">보기</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">회원명</label>
          <div class="readonly-field">{{ form.userNm || '-' }}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">카테고리</label>
          <select class="form-control" v-model="form.categoryCd" :disabled="viewMode">
            <option>배송 문의</option><option>상품 문의</option><option>교환·반품 문의</option>
            <option>주문·결제 문의</option><option>기타 문의</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" v-model="form.statusCd" :disabled="viewMode">
            <option>요청</option><option>처리중</option><option>답변완료</option><option>취소됨</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">제목 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.title" :readonly="viewMode" :class="errors.title ? 'is-invalid' : ''" />
        <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">문의 내용 <span v-if="!viewMode" class="req">*</span></label>
        <div v-if="viewMode" class="form-control" style="min-height:150px;line-height:1.6;" v-html="form.content || '<span style=color:#bbb>-</span>'"></div>
        <div v-else ref="contentEl" style="min-height:150px;background:#fff;" :class="errors.content ? 'is-invalid' : ''"></div>
        <span v-if="errors.content" class="field-error">{{ errors.content }}</span>
      </div>
      <div class="form-actions">
        <template v-if="viewMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('syContactMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" @click="save">저장</button>
          <button class="btn btn-secondary" @click="navigate('syContactMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- 답변 -->
    <div v-show="tab==='answer'">
      <div v-if="!isNew" style="margin-bottom:16px;padding:14px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8;">
        <div style="font-size:12px;color:#888;margin-bottom:6px;">{{ form.categoryCd }} · {{ form.date }}</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:8px;">{{ form.title }}</div>
        <div style="font-size:13px;color:#555;white-space:pre-line;">{{ form.content }}</div>
      </div>
      <div class="form-group">
        <label class="form-label">답변 내용 <span v-if="!form.answer" class="badge badge-orange" style="margin-left:4px;">미답변</span></label>
        <div v-if="viewMode" class="form-control" style="min-height:180px;line-height:1.6;" v-html="form.answer || '<span style=color:#bbb>-</span>'"></div>
        <div v-else ref="answerEl" style="min-height:180px;background:#fff;"></div>
      </div>
      <div class="form-actions">
        <template v-if="viewMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('syContactMng')">닫기</button>
        </template>
        <template v-else>
          <button v-if="!isNew" class="btn btn-primary" @click="saveAnswer">답변 저장</button>
          <button class="btn btn-primary" @click="save">전체 저장</button>
          <button class="btn btn-secondary" @click="navigate('syContactMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- 회원 문의 이력 -->
    <div v-show="tab==='history'">
      <table class="admin-table" v-if="memberContacts.length">
        <thead><tr><th>카테고리</th><th>제목</th><th>상태</th><th>등록일</th><th>관리</th></tr></thead>
        <tbody>
          <tr v-for="c in memberContacts" :key="c.inquiryId">
            <td><span class="tag">{{ c.categoryCd }}</span></td>
            <td>{{ c.title }}</td>
            <td><span class="badge" :class="statusBadge(c.statusCd)">{{ c.statusCd }}</span></td>
            <td>{{ c.date.slice(0,10) }}</td>
            <td><button class="btn btn-blue btn-sm" @click="navigate('syContactDtl',{id:c.inquiryId})">상세</button></td>
          </tr>
        </tbody>
      </table>
      <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">다른 문의 이력이 없습니다.</div>
    </div>
  </div>
</div>
`
};
