/* ShopJoy Admin - 템플릿 상세/등록 */
window.SyTemplateDtl = {
  name: 'SyTemplateDtl',
  props: {
    navigate:      { type: Function, required: true },        // 페이지 이동
    dtlId:         { type: String, default: null },           // 수정 대상 ID
    dtlMode:       { type: String, default: 'view' },         // 상세 모드 (new/view/edit)
    active:        { type: Boolean, default: true },          // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 },              // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { reactive, computed, onMounted, ref, onBeforeUnmount, watch, nextTick } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달

    const uiState = reactive({ previewOpen: false, sendOpen: false, error: null, isPageCodeLoad: false, loading: false }); // UI 상태 (미리보기/발송 모달 포함)
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
        return props.navigate('__cancelEdit__');
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
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ SyTemplateDtl : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'template-preview') {
        if (result == null) {
            uiState.previewOpen = false;
            return;
        }
        return;
      } else if (cmd === 'template-send') {
        if (result == null) {
          uiState.sendOpen = false;
          return;
        }
        return;
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
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
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('syTemplateMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
        uiState.isPageCodeLoad = true;
      }
    };

    // ★ onMounted — 진입 시 상세 조회
    onMounted(async () => {
      if (!cfIsNew.value) { await handleLoadDetail(); }
      // [+신규] 진입(활성 + 신규)일 때만 기본값 채움. 미선택/초기화(비활성)면 빈 폼 유지.
      if (props.active && cfIsNew.value) { _applyNewDefaults(); }
    });

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
      uiState, codes, form, errors,                                     // 상태 / 데이터
      handleBtnAction, fnCallbackModal,                                   // dispatch + 모달 통합 콜백
      cfIsNew, cfDtlMode, cfUseHtmlEditor, cfIsLongContent,             // computed
      showToast, showConfirm,                                           // 모달 props
    };
  },
  template: /* html */`
<!-- ===== ■. 카드 영역 (제목/라벨/폼 모두 컨테이너 안에) =============================== -->
<bo-container>
  <!-- ===== ■.■. 카드 헤더 (제목 = list-title, 페이지 타이틀 아님 → 폰트 축소) ========= -->
  <template #title>
    {{ !active ? '템플릿 상세' : (cfIsNew ? '템플릿 등록' : (cfDtlMode ? '템플릿 상세' : '템플릿 수정')) }}
    <span v-if="active && !cfIsNew" style="font-size:12px;color:#999;margin-left:8px;font-weight:400;">
      #{{ form.templateId }}
    </span>
    <span v-if="!active" style="font-size:12px;color:#bbb;margin-left:8px;font-weight:400;">
      목록에서 행을 선택하거나 [+신규]를 누르세요
    </span>
  </template>
  <!-- ===== ■.■. 폼 영역 ================================================== -->
  <bo-form-area :columns="columns.baseForm" :form="form" :errors="errors"
    :readonly="cfDtlMode" :cols="3" compact :show-actions="false">
    <!-- ===== ■.■.■. 내용 (Quill 에디터 또는 textarea, view 모드는 HTML) =========== -->
    <template #content>
      <template v-if="cfUseHtmlEditor">
        <div v-if="cfDtlMode" class="form-control" style="height:260px;line-height:1.6;overflow:auto;" v-html="form.templateContent || '<span style=color:#bbb>-</span>'">
        </div>
        <base-html-editor v-else v-model="form.templateContent" height="320px" />
      </template>
      <textarea v-else class="form-control" v-model="form.templateContent"
        :rows="cfIsLongContent ? 10 : 5"
        placeholder="템플릿 내용 입력"
        :readonly="cfDtlMode"
        :class="errors.templateContent ? 'is-invalid' : ''"></textarea>
        <span v-if="errors.templateContent" class="field-error">
          {{ errors.templateContent }}
        </span>
      </template>
    </bo-form-area>
    <!-- ===== □.□. 폼 영역 ================================================== -->
    <!-- ===== ■.■. 폼 액션 버튼 (미리보기/발송하기 포함 커스텀) ============================ -->
    <div class="form-actions" v-if="active && cfDtlMode">
      <button class="btn btn-blue" @click="handleBtnAction('form-edit')">
        수정
      </button>
      <button class="btn btn-secondary" @click="handleBtnAction('form-close')">
        닫기
      </button>
    </div>
    <div class="form-actions" v-if="active && !cfDtlMode">
      <button class="btn btn-secondary" @click="handleBtnAction('previewModal-open')">
        📄 미리보기
      </button>
      <button class="btn btn-primary" style="background:#52c41a;border-color:#52c41a;" @click="handleBtnAction('sendModal-open')">
        📨 발송하기
      </button>
      <button class="btn btn-primary" @click="handleBtnAction('form-save')">
        저장
      </button>
      <button class="btn btn-secondary" @click="handleBtnAction('form-cancel')">
        취소
      </button>
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
