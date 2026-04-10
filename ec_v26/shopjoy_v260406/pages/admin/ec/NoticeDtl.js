/* ShopJoy Admin - 공지사항관리 상세/등록 */
window.NoticeDtl = {
  name: 'NoticeDtl',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'editId', 'setApiRes'],
  setup(props) {
    const { reactive, computed, onMounted, onBeforeUnmount } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const form = reactive({
      title: '', noticeType: '일반', isFixed: false,
      startDate: '', endDate: '', status: '게시', contentHtml: '',
      attachGrpId: null,
    });
    const errors = reactive({});

    const schema = yup.object({
      title: yup.string().required('제목을 입력해주세요.'),
    });
    let quill = null;

    onMounted(() => {
      if (!isNew.value) {
        const n = props.adminData.notices.find(x => x.noticeId === props.editId);
        if (n) Object.assign(form, { ...n });
      }
      if (typeof Quill !== 'undefined') {
        quill = new Quill('#notice-editor', { theme: 'snow', placeholder: '공지 내용을 입력하세요.' });
        if (form.contentHtml) quill.root.innerHTML = form.contentHtml;
        quill.on('text-change', () => { form.contentHtml = quill.root.innerHTML; });
      }
    });
    onBeforeUnmount(() => { quill = null; });

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
        path: `notices/${form.noticeId}`,
        data: { ...form },
        confirmTitle: isNew.value ? '등록' : '저장',
        confirmMsg: isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?',
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: isNew.value ? '등록되었습니다.' : '저장되었습니다.',
        onLocal: () => {
          if (isNew.value) {
            props.adminData.notices.unshift({
              ...form,
              noticeId: props.adminData.nextId(props.adminData.notices, 'noticeId'),
              regDate: new Date().toISOString().slice(0, 10),
            });
          } else {
            const idx = props.adminData.notices.findIndex(x => x.noticeId === props.editId);
            if (idx !== -1) Object.assign(props.adminData.notices[idx], form);
          }
        },
        navigate: props.navigate,
        navigateTo: 'ecNoticeMng',
      });
    };

    return { isNew, form, errors, save };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '공지사항 등록' : '공지사항 수정' }}</div>
  <div class="card">
    <div class="form-row">
      <div class="form-group" style="flex:2">
        <label class="form-label">제목 <span class="req">*</span></label>
        <input class="form-control" v-model="form.title" placeholder="공지 제목" :class="errors.title ? 'is-invalid' : ''" />
        <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">유형</label>
        <select class="form-control" v-model="form.noticeType">
          <option>일반</option><option>긴급</option><option>이벤트</option><option>시스템</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" v-model="form.status">
          <option>게시</option><option>예약</option><option>종료</option><option>임시</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">시작일</label>
        <input class="form-control" type="date" v-model="form.startDate" />
      </div>
      <div class="form-group">
        <label class="form-label">종료일</label>
        <input class="form-control" type="date" v-model="form.endDate" />
      </div>
      <div class="form-group" style="display:flex;align-items:flex-end;gap:8px;">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin-bottom:4px;">
          <input type="checkbox" v-model="form.isFixed" /> <span class="form-label" style="margin:0;">상단고정</span>
        </label>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">내용</label>
      <div id="notice-editor" style="min-height:200px;background:#fff;"></div>
    </div>
    <div class="form-group">
      <label class="form-label">첨부파일 <span v-if="form.attachGrpId" style="font-size:11px;font-weight:400;color:#aaa;margin-left:6px;">첨부그룹ID: {{ form.attachGrpId }}</span></label>
      <comn-attach-grp
        :model-value="form.attachGrpId"
        @update:model-value="form.attachGrpId = $event"
        :admin-data="adminData"
        :ref-id="editId ? 'NOTICE-'+editId : ''"
        :show-toast="showToast"
        grp-code="NOTICE_ATTACH"
        grp-name="공지 첨부파일"
        :max-count="5"
        :max-size-mb="10"
        allow-ext="jpg,png,gif,pdf,xlsx,docx"
      />
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('ecNoticeMng')">취소</button>
    </div>
  </div>
</div>
`
};
