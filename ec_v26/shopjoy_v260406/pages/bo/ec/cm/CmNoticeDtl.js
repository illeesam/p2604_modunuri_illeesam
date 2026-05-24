/* ShopJoy Admin - 공지사항관리 상세/등록 */
window.CmNoticeDtl = {
  name: 'CmNoticeDtl',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
    dtlId:       { type: String, default: null }, // 수정 대상 ID
    tabMode:     { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:     { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ noticeTypes: [], noticeStatuses: [] });

    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.noticeTypes    = codeStore.sgGetGrpCodes('NOTICE_TYPE');
      codes.noticeStatuses = codeStore.sgGetGrpCodes('NOTICE_STATUS');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);

    /* fnToday — 유틸 */
    const fnToday = () => new Date().toISOString().slice(0, 10);

    /* fnDateAfter — 유틸 */
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

    /* handleSearchDetail — 처리 */
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
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) return;
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      if (typeof handleSearchDetail === 'function') await handleSearchDetail();
    });

    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* handleSave — 저장 */
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

    // ===== 폼 컬럼 정의 (BoFormArea :columns) ================================
    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================

    // --- [컬럼 정의] ---
    const baseFormColumns = [
      { key: 'noticeTitle',    label: '제목', type: 'text', required: true, placeholder: '공지 제목', colSpan: 2 },
      { key: 'noticeTypeCd',   label: '유형', type: 'select', options: () => codes.noticeTypes, nullLabel: '선택' },
      { key: 'noticeStatusCd', label: '상태', type: 'select', options: () => codes.noticeStatuses, nullLabel: '선택' },
      { type: 'rowBreak' },
      { key: 'startDate',      label: '시작일', type: 'date' },
      { key: 'endDate',        label: '종료일', type: 'date' },
      { key: 'isFixed',        label: '상단고정', type: 'checkbox',
        checkboxLabel: '상단고정', hideLabel: true,
        checkedValue: 'Y', uncheckedValue: 'N' },
      { type: 'rowBreak' },
      { key: 'contentHtml',    label: '내용', type: 'slot', name: 'contentHtml', colSpan: 4 },
      { type: 'rowBreak' },
      { key: 'attachGrpId',    label: '첨부파일', type: 'slot', name: 'attachGrp', colSpan: 4 },
    ];

    // ===== setup() return ===================================================
    const dtlId = Vue.computed(() => props.dtlId);
    // ===== return (템플릿 노출) ===============================================

    return { cfIsNew, dtlId, form, errors, handleSave, codes, navigate: props.navigate, cfDtlMode, baseFormColumns, showToast };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 + ID 표시 ========================================= -->
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    {{ cfIsNew ? '공지사항 등록' : (cfDtlMode ? '공지사항 상세' : '공지사항 수정') }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.noticeId }}</span>
  </div>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 폼 영역 (BoFormArea 자동 렌더) ================================= -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 폼 영역 ================================================== -->
    <bo-form-area :columns="baseFormColumns" :form="form" :errors="errors"
      :readonly="cfDtlMode" :cols="4"
      @save="handleSave"
      @cancel="navigate('cmNoticeMng')"
      @edit="navigate('__switchToEdit__')"
      @close="navigate('cmNoticeMng')">
      <!-- ===== ■.■.■. 내용 (Quill 또는 view 모드 HTML) ========================== -->
      <template #contentHtml>
        <div v-if="cfDtlMode" class="form-control" style="min-height:200px;line-height:1.6;" v-html="form.contentHtml || '<span style=color:#bbb>-</span>'"></div>
        <base-html-editor v-else v-model="form.contentHtml" height="280px" />
      </template>
      <!-- ===== ■.■.■. 첨부파일 ================================================ -->
      <template #attachGrp>
        <div style="font-size:11px;font-weight:400;color:#aaa;margin-bottom:4px;">
          #NOTICE_ATTACH
          <span v-if="form.attachGrpId" style="margin-left:4px;">#{{ form.attachGrpId }}</span>
        </div>
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
      </template>
    </bo-form-area>
  </div>
</div>

    <!-- ===== □.□. 폼 영역 ================================================== -->
  <!-- ===== □. 카드 영역 =================================================== -->`
};
