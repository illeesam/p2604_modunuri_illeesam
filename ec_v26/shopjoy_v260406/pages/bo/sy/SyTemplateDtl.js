/* ShopJoy Admin - 템플릿 상세/등록 */
window.SyTemplateDtl = {
  name: 'SyTemplateDtl',
  props: {
    navigate:      { type: Function, required: true },        // 페이지 이동
    dtlId:         { type: String, default: null },           // 수정 대상 ID
    dtlMode:       { type: String, default: 'view' },         // 상세 모드 (new/view/edit)
    active:        { type: Boolean, default: true },          // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 },              // 첫 탭 저장 시 상위 Mng 재조회 (UX-bo §18)
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, onMounted, ref, onBeforeUnmount, watch, nextTick } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달

    const uiState = reactive({ previewOpen: false, sendOpen: false, error: null, loading: false }); // UI 상태 (미리보기/발송 모달 포함)
    const codes   = reactive({ use_yn: [], template_types: ['메일템플릿','문자템플릿','MMS템플릿','kakao톡템플릿','kakao알림톡템플릿','시스템알림','회원알림'] }); // 공통코드

    const form = reactive({                                   // 템플릿 폼 데이터
      templateId: null, templateTypeCd: '', templateCode: '', templateNm: '', templateSubject: '', templateContent: '', useYn: '', sampleParams: '',
    });
    /* _applyNewDefaults — 신규 등록 진입 시에만 기본값 채움 (미선택/초기화 상태는 빈 폼 유지) */
    const _applyNewDefaults = () => {
      Object.assign(form, {
        templateTypeCd: '메일템플릿', useYn: 'Y', sampleParams: '{}',
      });
    };
    const errors = reactive({});                              // 폼 검증 에러

    const schema = yup.object({                               // 폼 검증 스키마
      templateCode: yup.string().required('템플릿코드를 입력해주세요.'),
      templateNm: yup.string().required('템플릿명을 입력해주세요.'),
      templateContent: yup.string().required('내용을 입력해주세요.'),
    });

    /* content 는 slot(html 에디터/textarea 겸용)이라 BoFormArea 의 field-change 를 안 타서
       값이 채워져도 오류 라벨이 자동으로 안 지워진다 — 여기서 직접 클리어 */
    watch(() => form.templateContent, (v) => { if (errors.templateContent && v) { delete errors.templateContent; } });

    const cfIsNew         = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfSiteNm        = computed(() => boUtil.bofGetSiteNm());
    const cfDtlMode       = computed(() => props.dtlMode === 'view'); // dtlMode: 'view' 이면 읽기전용
    /* cfUseHtmlEditor — 메일/시스템알림 유형 + 본문이 HTML 태그를 포함하면 htmlEditor */
    const cfUseHtmlEditor = computed(() => {
      if (['메일템플릿', '시스템알림'].includes(form.templateTypeCd)) return true;
      const c = form.templateContent || '';
      return /<\s*\w+[^>]*>/.test(c); // HTML 태그 패턴 자동 감지
    });
    const cfIsLongContent = computed(() => ['MMS템플릿'].includes(form.templateTypeCd));

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyTemplateDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장 (신규 등록 또는 수정)
      if (cmd === 'form-save') {
        return handleSave();
      // 폼 취소 → 상세영역 유지 + 빈 신규 폼으로 초기화 (영역 사라지지 않음)
      } else if (cmd === 'form-cancel') {
        return props.navigate('__cancelEdit__');
      // 보기모드 → 수정모드 전환
      } else if (cmd === 'form-edit') {
        return props.navigate('__switchToEdit__');
      // 보기모드 닫기 → 빈 신규 폼으로 초기화
      } else if (cmd === 'form-close') {
        return props.navigate('__closeDtl__');
      // 보기모드에서 바로 삭제 (2026-08-22 정책: 보기모드 표준 버튼 = [수정][삭제][닫기])
      } else if (cmd === 'form-delete') {
        return handleDelete();
      // 미리보기 모달 열기
      } else if (cmd === 'previewModal-open') {
        uiState.previewOpen = true;
        return;
      // 미리보기 모달 닫기
      } else if (cmd === 'previewModal-close') {
        uiState.previewOpen = false;
        return;
      // 발송 모달 열기
      } else if (cmd === 'sendModal-open') {
        uiState.sendOpen = true;
        return;
      // 발송 모달 닫기
      } else if (cmd === 'sendModal-close') {
        uiState.sendOpen = false;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (popCmd, param, result) => {
      console.log(' ■■ SyTemplateDtl : fnCallbackModal -> ', popCmd, param, result);
      if (popCmd === 'template-preview') {
        if (result == null) {
            uiState.previewOpen = false;
            return;
        }
        return;
      } else if (popCmd === 'template-send') {
        if (result == null) {
          uiState.sendOpen = false;
          return;
        }
        return;
      } else {
        console.warn('[fnCallbackModal] unknown popCmd:', popCmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.syTemplate.getById(props.dtlId, '템플릿관리', '상세조회');
        const data = res.data?.data;
        if (data) { Object.assign(form, { sampleParams: '{}', ...data }); }
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
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
      if (form.sampleParams) {
        try { JSON.parse(form.sampleParams); }
        catch { showToast('파라미터 샘플 JSON 형식이 올바르지 않습니다.', 'error'); return; }
      }
      const ok = await showConfirm(cfIsNew.value ? '등록' : '저장', cfIsNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) { return; }
      try {
        const res = await (cfIsNew.value
          ? boApiSvc.syTemplate.create({ ...form }, '템플릿관리', '등록')
          : boApiSvc.syTemplate.update(form.templateId, { ...form }, '템플릿관리', '저장'));
        if (showToast) { showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('syTemplateMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* handleDelete — 보기모드 [삭제] (2026-08-22 정책: 보기모드 표준 버튼 = [수정][삭제][닫기]) */
    const handleDelete = async () => {
      if (cfIsNew.value || !form.templateId) { return; }
      const ok = await showConfirm('삭제', `[${form.templateNm}] 템플릿을 삭제하시겠습니까?`);
      if (!ok) { return; }
      try {
        await boApiSvc.syTemplate.remove(form.templateId, '템플릿관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        props.navigate('syTemplateMng', { reload: true });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
        await codeStore.saLoadCodes(['USE_YN'], {compNm: 'SyTemplateDtl'});
        codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 상세 조회를 시작한다.
       (fnLoadCodes 가 어디서도 호출되지 않아 '사용여부' select 가 빈 상태였다 — 2026-07-30 수정) */
    const initPage = async () => {
      await fnLoadCodes();
      if (!cfIsNew.value) { await handleLoadDetail(); }
      // [+신규] 진입(활성 + 신규)일 때만 기본값 채움. 미선택/초기화(비활성)면 빈 폼 유지.
      if (props.active && cfIsNew.value) { _applyNewDefaults(); }
    };
    onMounted(initPage);

    /* policy: 상위 Mng 이 reloadTrigger 증가시키면 상세 API 재조회 */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleLoadDetail();
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // 기본 폼
    const columns = {};
    columns.baseForm = [
      { key: '_siteNm',        label: '사이트명', type: 'readonly', fmt: () => cfSiteNm.value, colSpan: 3 },
      { key: 'templateTypeCd', label: '템플릿유형', type: 'select', nullable: false, required: true,
        options: () => codes.template_types },
      { key: 'templateCode',   label: '템플릿코드', type: 'text', required: true,
        placeholder: '예) ORDER_CONFIRM_MAIL', mono: true,
        onChange: (v, f) => { f.templateCode = (f.templateCode || '').toUpperCase().replace(/[^A-Z0-9_]/g, ''); } },
      { key: 'templateNm',     label: '템플릿명', type: 'text', required: true, placeholder: '템플릿명 입력' },
      { key: 'templateSubject', label: '제목 (Subject)', type: 'text', colSpan: 3,
        placeholder: '메일/MMS/시스템 제목' },
      { key: 'templateContent', label: '내용', required: true, type: 'slot', name: 'content', colSpan: 3,
        hint: '사용 가능 변수: {{username}}, {{orderId}}, {{prodNm}}, {{trackingNo}} 등' },
      { key: 'sampleParams',   label: '파라미터 샘플 (JSON)', type: 'textarea', rows: 3, mono: true, colSpan: 3,
        placeholder: '{"username":"홍길동","orderId":"ORD-20260410-001"}',
        hint: '미리보기에 사용되는 샘플 변수값' },
      { key: 'useYn',          label: '사용여부', type: 'select', options: () => codes.use_yn },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, form, errors,       // 상태 / 데이터
      handleBtnAction, fnCallbackModal, // dispatch + 모달 통합 콜백
      cfIsNew, cfDtlMode, cfUseHtmlEditor, cfIsLongContent, // computed
      showToast, showConfirm, // 모달 props
    };
  },
  template: /* html */`
<!-- ===== ■. 카드 영역 (제목/라벨/폼 모두 컨테이너 안에) =============================== -->
<bo-container :title="!active ? '템플릿 상세' : (cfIsNew ? '템플릿 등록' : (cfDtlMode ? '템플릿 상세' : '템플릿 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : form.templateId)">
  <!-- ===== ■.■. 폼 영역 ================================================== -->
  <bo-form-area plain-readonly :columns="columns.baseForm" :form="form" :errors="errors"
    :readonly="cfDtlMode" :cols="3" compact :show-actions="false">
    <!-- ===== ■.■.■. 내용 (Quill 에디터 또는 textarea, view 모드는 HTML) =========== -->
    <template #content>
      <template v-if="cfUseHtmlEditor">
        <div v-if="cfDtlMode" class="readonly-field-plain" style="min-height:260px;line-height:1.6;overflow:auto;" v-html="form.templateContent || '-'"></div>
        <base-html-editor v-else v-model="form.templateContent" height="320px" />
      </template>
      <template v-else>
        <div v-if="cfDtlMode" class="readonly-field-plain" style="min-height:90px;line-height:1.6;white-space:pre-wrap;">{{ form.templateContent || '-' }}</div>
        <textarea v-else class="form-control" v-model="form.templateContent"
          :rows="cfIsLongContent ? 10 : 5"
          placeholder="템플릿 내용 입력"
          :class="errors.templateContent ? 'is-invalid' : ''"></textarea>
      </template>
      <span v-if="errors.templateContent" class="field-error">{{ errors.templateContent }}</span>
    </template>
  </bo-form-area>
  <!-- ===== □.□. 폼 영역 ================================================== -->
  <!-- ===== ■.■. 폼 액션 버튼 (미리보기/발송하기 포함 커스텀) ============================ -->
  <div class="form-actions" v-if="active ? (cfDtlMode) : false">
    <button class="btn btn_edit" @click="handleBtnAction('form-edit')">수정</button>
    <button v-if="!cfIsNew" class="btn btn_delete" @click="handleBtnAction('form-delete')">삭제</button>
    <button class="btn btn_close" @click="handleBtnAction('form-close')">닫기</button>
  </div>
  <div class="form-actions" v-if="active ? (!cfDtlMode) : false">
    <button class="btn btn-secondary" @click="handleBtnAction('previewModal-open')">📄 미리보기</button>
    <button class="btn btn-primary" style="background:#52c41a;border-color:#52c41a;" @click="handleBtnAction('sendModal-open')">
      📨 발송하기
    </button>
    <button class="btn btn_save" @click="handleBtnAction('form-save')">저장</button>
    <button v-if="!cfIsNew" class="btn btn_delete" @click="handleBtnAction('form-delete')">삭제</button>
    <button v-if="!cfIsNew" class="btn btn_cancel" @click="handleBtnAction('form-cancel')">취소</button>
  </div>
  <!-- ===== □.□. 폼 액션 버튼 (미리보기/발송하기 포함 커스텀) ============================ -->
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 미리보기 모달 ================================================= -->
  <template-preview-modal v-if="uiState.previewOpen"
    :tmpl="form" :sample-params="form.sampleParams" modal-name="template-preview" :on-callback="fnCallbackModal" />
  <!-- ===== □. 미리보기 모달 ================================================= -->
  <!-- ===== ■. 발송하기 모달 ================================================= -->
  <template-send-modal v-if="uiState.sendOpen"
    :tmpl="form" :show-toast="showToast" :show-confirm="showConfirm" modal-name="template-send" :on-callback="fnCallbackModal" />
  <!-- ===== □. 발송하기 모달 ================================================= -->
</bo-container>
`,
};
