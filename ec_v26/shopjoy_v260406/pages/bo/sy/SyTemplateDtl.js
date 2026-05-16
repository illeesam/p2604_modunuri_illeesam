/* ShopJoy Admin - 템플릿 상세/등록 */
window.SyTemplateDtl = {
  name: 'SyTemplateDtl',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
    dtlId:       { type: String, default: null }, // 수정 대상 ID
    tabMode:     { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:     { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    const { reactive, computed, onMounted, ref, onBeforeUnmount, watch, nextTick } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    /* 미리보기 / 발송 모달 */
    const uiState = reactive({ previewOpen: false, sendOpen: false, error: null, isPageCodeLoad: false, loading: false });
    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfSiteNm = computed(() => boUtil.getSiteNm());
    const form = reactive({
      templateId: null, templateTypeCd: '메일템플릿', templateCode: '', templateNm: '', subject: '', content: '', useYn: 'Y', sampleParams: '{}',
    });
    const errors = reactive({});

    /* -- HTML 에디터 사용 여부 (메일, 시스템알림) -- */
    const cfUseHtmlEditor = computed(() => ['메일템플릿', '시스템알림'].includes(form.templateTypeCd));

    /* 템플릿 상세조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.syTemplate.getById(props.dtlId, '템플릿관리', '상세조회');
        const data = res.data?.data;
        if (data) Object.assign(form, { sampleParams: '{}', ...data });
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 상세 조회
    onMounted(async () => {
      if (!cfIsNew.value) { await handleLoadDetail(); } else { await handleInitForm(); }
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) return;
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleLoadDetail();
    });

    const schema = yup.object({
      templateCode: yup.string().required('템플릿코드를 입력해주세요.'),
      templateNm: yup.string().required('템플릿명을 입력해주세요.'),
      content: yup.string().required('내용을 입력해주세요.'),
    });

    /* 템플릿 저장 */
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
      if (!ok) return;
      try {
        const res = await (cfIsNew.value ? boApiSvc.syTemplate.create({ ...form }, '템플릿관리', '등록') : boApiSvc.syTemplate.update(form.templateId, { ...form }, '템플릿관리', '저장'));
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('syTemplateMng', { reload: true });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    const cfNeedSubject = computed(() => ['메일템플릿', 'MMS템플릿', '시스템알림'].includes(form.templateTypeCd));
    const cfIsLongContent = computed(() => ['MMS템플릿'].includes(form.templateTypeCd));

    const codes = reactive({ use_yn: [], template_types: ['메일템플릿','문자템플릿','MMS템플릿','kakao톡템플릿','kakao알림톡템플릿','시스템알림','회원알림'] });

    /* 템플릿 fnLoadCodes */
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

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    // -- return ---------------------------------------------------------------

    return { uiState, cfIsNew, form, errors, codes, handleSave, cfNeedSubject, cfIsLongContent,
             cfUseHtmlEditor, cfSiteNm, cfDtlMode };
  },
  template: /* html */`
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="page-title">{{ cfIsNew ? '템플릿 등록' : (cfDtlMode ? '템플릿 상세' : '템플릿 수정') }}</div><span v-if="!cfIsNew" style="font-size:12px;color:#999;">#{{ form.templateId }}</span></div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ cfSiteNm }}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">템플릿유형 <span v-if="!cfDtlMode" class="req">*</span></label>
        <select class="form-control" v-model="form.templateTypeCd" :disabled="cfDtlMode">
          <option v-for="t in codes.template_types" :key="t">{{ t }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">템플릿코드 <span v-if="!cfDtlMode" class="req">*</span></label>
        <input class="form-control" v-model="form.templateCode" placeholder="예) ORDER_CONFIRM_MAIL"
          @input="form.templateCode=form.templateCode.toUpperCase().replace(/[^A-Z0-9_]/g,'')"
          :readonly="cfDtlMode"
          :class="errors.templateCode ? 'is-invalid' : ''" />
        <span v-if="errors.templateCode" class="field-error">{{ errors.templateCode }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">템플릿명 <span v-if="!cfDtlMode" class="req">*</span></label>
        <input class="form-control" v-model="form.templateNm" placeholder="템플릿명 입력" :readonly="cfDtlMode" :class="errors.templateNm ? 'is-invalid' : ''" />
        <span v-if="errors.templateNm" class="field-error">{{ errors.templateNm }}</span>
      </div>
    </div>
    <div class="form-row" v-if="cfNeedSubject">
      <div class="form-group" style="flex:1">
        <label class="form-label">제목 (Subject)</label>
        <input class="form-control" v-model="form.subject" placeholder="메일/MMS/시스템 제목" :readonly="cfDtlMode" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">내용 <span v-if="!cfDtlMode" class="req">*</span>
          <span style="font-size:11px;color:#888;margin-left:6px;">사용 가능 변수: &#123;&#123;username&#125;&#125;, &#123;&#123;orderId&#125;&#125;, &#123;&#123;prodNm&#125;&#125;, &#123;&#123;trackingNo&#125;&#125; 등</span>
        </label>
        <!-- -- HTML 에디터 (메일, 시스템알림) ------------------------------------- -->
        <template v-if="cfUseHtmlEditor">
          <div v-if="cfDtlMode" class="form-control" style="height:260px;line-height:1.6;overflow:auto;" v-html="form.content || '<span style=color:#bbb>-</span>'"></div>
          <base-html-editor v-else v-model="form.content" height="320px" />
        </template>
        <!-- -- 텍스트 영역 --------------------------------------------------- -->
        <textarea v-else class="form-control" v-model="form.content"
          :rows="cfIsLongContent ? 10 : 5"
          placeholder="템플릿 내용 입력"
          :readonly="cfDtlMode"
          :class="errors.content ? 'is-invalid' : ''"></textarea>
        <span v-if="errors.content" class="field-error">{{ errors.content }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">파라미터 샘플 (JSON)
          <span style="font-size:11px;color:#888;margin-left:6px;">미리보기에 사용되는 샘플 변수값 — 예) {"username":"홍길동","orderId":"ORD-001"}</span>
        </label>
        <textarea class="form-control" v-model="form.sampleParams" rows="3"
          style="font-family:monospace;font-size:12px;"
          placeholder='{"username":"홍길동","orderId":"ORD-20260410-001"}'
          :readonly="cfDtlMode"></textarea>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사용여부</label>
        <select class="form-control" v-model="form.useYn" :disabled="cfDtlMode">
          <option v-for="o in codes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
        </select>
      </div>
    </div>
    <div class="form-actions" v-if="!cfDtlMode">
      <template v-if="cfDtlMode">
        <button class="btn btn-secondary" @click="uiState.previewOpen=true">📄 미리보기</button>
        <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
        <button class="btn btn-secondary" @click="navigate('syTemplateMng')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-secondary" @click="uiState.previewOpen=true">📄 미리보기</button>
        <button class="btn btn-primary" style="background:#52c41a;border-color:#52c41a;" @click="uiState.sendOpen=true">📨 발송하기</button>
        <button class="btn btn-primary" @click="handleSave">저장</button>
        <button class="btn btn-secondary" @click="navigate('syTemplateMng')">취소</button>
      </template>
    </div>
  </div>

  <!-- -- 미리보기 모달 -------------------------------------------------------- -->
  <template-preview-modal v-if="uiState.previewOpen"
    :tmpl="form" :sample-params="form.sampleParams"
    @close="uiState.previewOpen=false" />

  <!-- -- 발송하기 모달 -------------------------------------------------------- -->
  <template-send-modal v-if="uiState.sendOpen"
    :tmpl="form" :show-toast="showToast" :show-confirm="showConfirm"
    @close="uiState.sendOpen=false" />
</div>
`
};
