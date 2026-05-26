/* ShopJoy Admin - 공지사항관리 상세/등록 */
window.CmNoticeDtl = {
  name: 'CmNoticeDtl',
  props: {
    navigate:      { type: Function, required: true }, // 페이지 이동
    dtlId:         { type: String, default: null },    // 수정 대상 ID
    dtlMode:       { type: String, default: 'view' },  // 상세 모드 (new/view/edit)
    reloadTrigger: { type: Number, default: 0 },       // 상위 reload signal
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false }); // UI 상태
    const codes = reactive({ noticeTypes: [], noticeStatuses: [] }); // 공통코드

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ CmNoticeDtl.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'form-save') {
        return handleSave();
      } else if (cmd === 'form-cancel') {
        return props.navigate('cmNoticeMng');
      } else if (cmd === 'form-edit') {
        return props.navigate('__switchToEdit__');
      } else if (cmd === 'form-close') {
        return props.navigate('cmNoticeMng');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const fnToday = () => new Date().toISOString().slice(0, 10);

    /* fnDateAfter — N일 후 날짜 */
    const fnDateAfter = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };

    const form = reactive({                        // 공지사항 폼 데이터
      noticeId: null, noticeTitle: '', noticeTypeCd: '', isFixed: 'N',
      startDate: fnToday(), endDate: fnDateAfter(7), noticeStatusCd: '', contentHtml: '',
      attachGrpId: null,
    });
    const errors = reactive({});                   // 폼 검증 에러

    const schema = yup.object({                    // 폼 검증 스키마
      noticeTitle: yup.string().required('제목을 입력해주세요.'),
    });

    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfDtlMode = computed(() => props.dtlMode === 'view'); // dtlMode: 'view' 이면 읽기전용
    const cfAttachRefId = computed(() => props.dtlId ? ('NOTICE-' + props.dtlId) : '');

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* handleSearchDetail — 상세 조회 */
    const handleSearchDetail = async () => {
      if (cfIsNew.value) { return; }
      try {
        const res = await boApiSvc.cmNotice.getById(props.dtlId, '공지사항관리', '상세조회');
        Object.assign(form, res.data?.data || {});
      } catch (err) {
        console.error('[handleSearchDetail]', err);
      }
    };

    /* handleSave — 저장 (신규 등록 / 수정) */
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
      if (!ok) { return; }
      try {
        const res = await (isNewNotice
          ? boApiSvc.cmNotice.create({ ...form }, '공지사항관리', '등록')
          : boApiSvc.cmNotice.update(props.dtlId, { ...form }, '공지사항관리', '저장'));
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast(isNewNotice ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        await new Promise(r => setTimeout(r, 200));
        if (props.navigate) { props.navigate('cmNoticeMng', { reload: true }); }
      } catch (err) {
        console.error('[handleSave] Error:', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.noticeTypes    = codeStore.sgGetGrpCodes('NOTICE_TYPE');
      codes.noticeStatuses = codeStore.sgGetGrpCodes('NOTICE_STATUS');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 진입 시 코드 로드 + 상세 초기 조회
    onMounted(async () => {
      if (isAppReady.value) { fnLoadCodes(); }
      await handleSearchDetail();
    });

    /* policy: 상위 Mng 이 reloadTrigger 증가시키면 상세 API 재조회 */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      if (typeof handleSearchDetail === 'function') { await handleSearchDetail(); }
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // 기본 폼
    const baseFormColumns = [
      { key: 'noticeTitle',    label: '제목', type: 'text', required: true, placeholder: '공지 제목', colSpan: 2 },
      { key: 'noticeTypeCd',   label: '유형', type: 'select', options: () => codes.noticeTypes, nullLabel: '선택' },
      { key: 'noticeStatusCd', label: '상태', type: 'select', options: () => codes.noticeStatuses, nullLabel: '선택' },
      { key: 'startDate',      label: '시작일', type: 'date' },
      { key: 'endDate',        label: '종료일', type: 'date' },
      { key: 'isFixed',        label: '상단고정', type: 'checkbox',
        checkboxLabel: '상단고정', hideLabel: true,
        checkedValue: 'Y', uncheckedValue: 'N' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      uiState, codes, form, errors,                                                    // 상태 / 데이터
      baseFormColumns,                                                                 // 컬럼 정의
      handleBtnAction,                                                                 // dispatch
      cfIsNew, cfDtlMode, cfAttachRefId,                                               // computed
      showToast,                                                                       // 첨부 컴포넌트 prop 전달용
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    {{ cfIsNew ? '공지사항 등록' : (cfDtlMode ? '공지사항 상세' : '공지사항 수정') }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">
      #{{ form.noticeId }}
    </span>
  </div>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 폼 영역 ===================================================== -->
  <div class="card">
    <!-- ===== ■.■. 기본정보 (BoFormArea 자동 렌더) ============================= -->
    <bo-form-area :columns="baseFormColumns" :form="form" :errors="errors"
      :readonly="cfDtlMode" :cols="4" :show-actions="false" />
    <!-- ===== ■.■. 내용 (HtmlEditor 또는 view 모드 HTML) ======================== -->
    <div class="form-group" style="margin-top:12px;">
      <label class="form-label">
        내용
      </label>
      <div v-if="cfDtlMode" class="form-control" style="min-height:200px;line-height:1.6;">
        <div v-if="form.contentHtml" v-html="form.contentHtml"></div>
        <span v-else style="color:#bbb;">-</span>
      </div>
      <base-html-editor v-else v-model="form.contentHtml" height="280px" />
    </div>
    <!-- ===== ■.■. 첨부파일 ================================================== -->
    <div class="form-group" style="margin-top:12px;">
      <label class="form-label">
        첨부파일
      </label>
      <base-attach-grp :model-value="form.attachGrpId"
        @update:model-value="form.attachGrpId = $event"
        :ref-id="cfAttachRefId"
        :show-toast="showToast"
        grp-code="NOTICE_ATTACH"
        grp-nm="공지 첨부파일"
        :max-count="5"
        :max-size-mb="10"
        allow-ext="jpg,png,gif,pdf,xlsx,docx" />
    </div>
    <!-- ===== ■.■. 폼 액션 ================================================== -->
    <div class="form-actions">
      <template v-if="cfDtlMode">
        <button class="btn btn-primary" @click="handleBtnAction('form-edit')">
          수정
        </button>
        <button class="btn btn-secondary" @click="handleBtnAction('form-close')">
          닫기
        </button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click="handleBtnAction('form-save')">
          저장
        </button>
        <button class="btn btn-secondary" @click="handleBtnAction('form-cancel')">
          취소
        </button>
      </template>
    </div>
    <!-- ===== □.□. 폼 액션 ================================================== -->
  </div>
  <!-- ===== □. 폼 영역 ==================================================== -->
</div>
`,
};
