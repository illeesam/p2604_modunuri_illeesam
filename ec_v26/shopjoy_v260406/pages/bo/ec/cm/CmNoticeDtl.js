/* ShopJoy Admin - 공지사항관리 상세/등록 */
window.CmNoticeDtl = {
  name: 'CmNoticeDtl',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
    dtlId:       { type: String, default: null }, // 수정 대상 ID
    tabMode:     { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:     { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} }, // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    const { ref, reactive, computed, onMounted, onBeforeUnmount, watch } = Vue;
    const showToast    = window.boApp.showToast;
    const showConfirm  = window.boApp.showConfirm;
    const showRefModal = window.boApp.showRefModal;
    const setApiRes    = window.boApp.setApiRes;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ noticeTypes: [], noticeStatuses: [] });

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.noticeTypes    = codeStore.sgGetGrpCodes('NOTICE_TYPE');
      codes.noticeStatuses = codeStore.sgGetGrpCodes('NOTICE_STATUS');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = boUtil.useAppCodeReady(uiState, fnLoadCodes);


    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const fnToday = () => new Date().toISOString().slice(0, 10);
    const fnDateAfter = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };
    const form = reactive({
      noticeId: null, noticeTitle: '', noticeTypeCd: '', isFixed: 'N',
      startDate: fnToday(), endDate: fnDateAfter(7), noticeStatusCd: '', contentHtml: '',
      attachGrpId: null,
    });
    const errors = reactive({});

    const schema = yup.object({
      noticeTitle: yup.string().required('제목을 입력해주세요.'),
    });
    let quill = null;

    const handleSearchDetail = async () => {
      if (cfIsNew.value) return;
      try {
        const res = await boApiSvc.cmNotice.getById(props.dtlId, '공지사항관리', '상세조회');
        Object.assign(form, res.data?.data || {});
      } catch (err) {
        console.error('[handleSearchDetail]', err);
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      await handleSearchDetail();
      if (typeof Quill !== 'undefined' && !props.tabMode && document.getElementById('notice-editor')) {
      try {
      quill = new Quill('#notice-editor', { theme: 'snow', placeholder: '공지 내용을 입력하세요.' });
      if (form.contentHtml) quill.root.innerHTML = form.contentHtml;
      quill.on('text-change', () => { form.contentHtml = quill.root.innerHTML; });
      } catch (e) { console.warn('[Quill init]', e); }
      }
    });
    onBeforeUnmount(() => { quill = null; });

    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        console.error('[catch-info]', err);
        err.inner.forEach(e => { errors[e.path] = e.message; });
        showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const isNewNotice = cfIsNew.value;
      const ok = await showConfirm(isNewNotice ? '등록' : '저장', isNewNotice ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      try {
        const res = await (isNewNotice
          ? boApiSvc.cmNotice.create({ ...form }, '공지사항관리', '등록')
          : boApiSvc.cmNotice.update(props.dtlId, { ...form }, '공지사항관리', '저장'));
        console.log('[handleSave] API Response:', res);
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast(isNewNotice ? '등록되었습니다.' : '저장되었습니다.', 'success');
        // 200ms 딜레이 후 목록으로 복귀 (서버 반영 대기)
        await new Promise(r => setTimeout(r, 200));
        if (props.navigate) props.navigate('cmNoticeMng', { reload: true });
      } catch (err) {
        console.error('[handleSave] Error:', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    // -- return ---------------------------------------------------------------

    const dtlId = Vue.computed(() => props.dtlId);
    return { cfIsNew, dtlId, form, errors, handleSave, codes, navigate: props.navigate, cfDtlMode };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ cfIsNew ? '공지사항 등록' : (cfDtlMode ? '공지사항 상세' : '공지사항 수정') }}<span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.noticeId }}</span></div>
  <div class="card">
    <div class="form-row">
      <div class="form-group" style="flex:2">
        <label class="form-label">제목 <span v-if="!cfDtlMode" class="req">*</span></label>
        <input class="form-control" v-model="form.noticeTitle" placeholder="공지 제목" :readonly="cfDtlMode" :class="errors.noticeTitle ? 'is-invalid' : ''" />
        <span v-if="errors.noticeTitle" class="field-error">{{ errors.noticeTitle }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">유형</label>
        <select class="form-control" v-model="form.noticeTypeCd" :disabled="cfDtlMode">
          <option value="">선택</option>
          <option v-for="c in codes.noticeTypes" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" v-model="form.noticeStatusCd" :disabled="cfDtlMode">
          <option value="">선택</option>
          <option v-for="c in codes.noticeStatuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">시작일</label>
        <input class="form-control" type="date" v-model="form.startDate" :readonly="cfDtlMode" />
      </div>
      <div class="form-group">
        <label class="form-label">종료일</label>
        <input class="form-control" type="date" v-model="form.endDate" :readonly="cfDtlMode" />
      </div>
      <div class="form-group" style="display:flex;align-items:flex-end;gap:8px;">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin-bottom:4px;">
          <input type="checkbox" :checked="form.isFixed === 'Y'" @change="form.isFixed = $event.target.checked ? 'Y' : 'N'" :disabled="cfDtlMode" /> <span class="form-label" style="margin:0;">상단고정</span>
        </label>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">내용</label>
      <div v-if="cfDtlMode" class="form-control" style="min-height:200px;line-height:1.6;" v-html="form.contentHtml || '<span style=color:#bbb>-</span>'"></div>
      <div v-else id="notice-editor" style="min-height:200px;background:#fff;"></div>
    </div>
    <div class="form-group">
      <label class="form-label">첨부파일
        <span style="font-size:11px;font-weight:400;color:#aaa;margin-left:6px;">#NOTICE_ATTACH</span>
        <span v-if="form.attachGrpId" style="font-size:11px;font-weight:400;color:#aaa;margin-left:4px;">#{{ form.attachGrpId }}</span>
      </label>
      <base-attach-grp
        :model-value="form.attachGrpId"
        @update:model-value="form.attachGrpId = $event" :ref-id="dtlId ? 'NOTICE-'+dtlId : ''"
        :show-toast="showToast"
        grp-code="NOTICE_ATTACH"
        grp-name="공지 첨부파일"
        :max-count="5"
        :max-size-mb="10"
        allow-ext="jpg,png,gif,pdf,xlsx,docx"
      />
    </div>
    <div class="form-actions" v-if="!cfDtlMode">
      <template v-if="cfDtlMode">
        <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
        <button class="btn btn-secondary" @click="navigate('cmNoticeMng')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click="handleSave">저장</button>
        <button class="btn btn-secondary" @click="navigate('cmNoticeMng')">취소</button>
      </template>
    </div>
  </div>
</div>
`
};
