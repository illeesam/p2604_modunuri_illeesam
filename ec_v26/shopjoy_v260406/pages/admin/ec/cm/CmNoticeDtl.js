/* ShopJoy Admin - 공지사항관리 상세/등록 */
window.CmNoticeDtl = {
  name: 'CmNoticeDtl',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'editId', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, onMounted, onBeforeUnmount } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const form = reactive({
      noticeId: null, title: '', noticeType: '일반', isFixed: false,
      startDate: '', endDate: '', statusCd: '게시', contentHtml: '',
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
      const isNewNotice = isNew.value;
      const ok = await props.showConfirm(isNewNotice ? '등록' : '저장', isNewNotice ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      if (isNewNotice) {
        props.adminData.notices.unshift({
          ...form,
          noticeId: props.adminData.nextId(props.adminData.notices, 'noticeId'),
          regDate: new Date().toISOString().slice(0, 10),
        });
      } else {
        const idx = props.adminData.notices.findIndex(x => x.noticeId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.notices[idx], form);
      }
      try {
        const res = await (isNewNotice ? window.adminApi.post(`notices/${form.noticeId}`, { ...form }) : window.adminApi.put(`notices/${form.noticeId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(isNewNotice ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('cmNoticeMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    return { isNew, form, errors, save };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '공지사항 등록' : (viewMode ? '공지사항 상세' : '공지사항 수정') }}<span v-if="!isNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.noticeId }}</span></div>
  <div class="card">
    <div class="form-row">
      <div class="form-group" style="flex:2">
        <label class="form-label">제목 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.title" placeholder="공지 제목" :readonly="viewMode" :class="errors.title ? 'is-invalid' : ''" />
        <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">유형</label>
        <select class="form-control" v-model="form.noticeType" :disabled="viewMode">
          <option>일반</option><option>긴급</option><option>이벤트</option><option>시스템</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" v-model="form.statusCd" :disabled="viewMode">
          <option>게시</option><option>예약</option><option>종료</option><option>임시</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">시작일</label>
        <input class="form-control" type="date" v-model="form.startDate" :readonly="viewMode" />
      </div>
      <div class="form-group">
        <label class="form-label">종료일</label>
        <input class="form-control" type="date" v-model="form.endDate" :readonly="viewMode" />
      </div>
      <div class="form-group" style="display:flex;align-items:flex-end;gap:8px;">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin-bottom:4px;">
          <input type="checkbox" v-model="form.isFixed" /> <span class="form-label" style="margin:0;">상단고정</span>
        </label>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">내용</label>
      <div v-if="viewMode" class="form-control" style="min-height:200px;line-height:1.6;" v-html="form.contentHtml || '<span style=color:#bbb>-</span>'"></div>
      <div v-else id="notice-editor" style="min-height:200px;background:#fff;"></div>
    </div>
    <div class="form-group">
      <label class="form-label">첨부파일 <span v-if="form.attachGrpId" style="font-size:11px;font-weight:400;color:#aaa;margin-left:6px;">첨부그룹ID: {{ form.attachGrpId }}</span></label>
      <base-attach-grp
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
      <template v-if="viewMode">
        <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
        <button class="btn btn-secondary" @click="navigate('cmNoticeMng')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('cmNoticeMng')">취소</button>
      </template>
    </div>
  </div>
</div>
`
};
