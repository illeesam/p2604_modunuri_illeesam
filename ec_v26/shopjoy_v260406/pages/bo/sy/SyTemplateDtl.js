/* ShopJoy Admin - 템플릿 상세/등록 */
window.SyTemplateDtl = {
  name: 'SyTemplateDtl',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes', 'editId', 'viewMode'],
  setup(props) {
    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { reactive, computed, onMounted, ref, onBeforeUnmount, watch, nextTick } = Vue;

    const templates = reactive([]);
    
    // onMounted에서 API 로드
    const handleLoadData = async () => {
      uiState.loading = true;
      try {
        const res = await window.boApi.get('/bo/sy/template/page', {
          params: { pageNo: 1, pageSize: 10000 }
        });
        templates = res.data?.data?.list || [];
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('SyTemplate 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };
    const cfIsNew = computed(() => props.editId === null || props.editId === undefined);
    const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());
    const TEMPLATE_TYPES = ['메일템플릿', '문자템플릿', 'MMS템플릿', 'kakao톡템플릿', 'kakao알림톡템플릿', '시스템알림', '회원알림'];
    const form = reactive({
      templateId: null, templateTypeCd: '메일템플릿', templateCode: '', templateNm: '', subject: '', content: '', useYn: 'Y', sampleParams: '{}',
    });
    const errors = reactive({});

    /* ── Quill (메일, 시스템알림) ── */
    const cfUseHtmlEditor = computed(() => ['메일템플릿', '시스템알림'].includes(form.templateTypeCd));
        let _quill = null;

    const initQuill = () => {
      if (!uiState.quillEditorEl || _quill) return;
      _quill = new Quill(uiState.quillEditorEl, {
        theme: 'snow',
        placeholder: '내용을 입력하세요...',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ color: [] }, { background: [] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'blockquote', 'clean'],
          ]
        }
      });
      _quill.root.innerHTML = form.content || '';
      _quill.on('text-change', () => { form.content = _quill.root.innerHTML; });
    };

    const destroyQuill = () => {
      if (_quill) { form.content = _quill.root.innerHTML; _quill = null; }
    };

    /* 타입 변경 시 에디터 전환 — post-flush: DOM 업데이트 후 실행 */
    watch(cfUseHtmlEditor, (isHtml) => {
      if (isHtml && !props.viewMode) initQuill();
      else destroyQuill();
    }, { flush: 'post' });

    const handleInitForm = async () => {
      if (!cfIsNew.value) {
        const t = templates.find(x => x.templateId === props.editId);
        if (t) Object.assign(form, { sampleParams: '{}', ...t });
      }
      if (cfUseHtmlEditor.value && !props.viewMode) { await nextTick(); initQuill(); }
    };
    onMounted(() => {
      handleLoadData();
      handleInitForm();
    });

    onBeforeUnmount(() => destroyQuill());

    const schema = yup.object({
      templateCode: yup.string().required('템플릿코드를 입력해주세요.'),
      templateNm: yup.string().required('템플릿명을 입력해주세요.'),
      content: yup.string().required('내용을 입력해주세요.'),
    });

    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        console.error('[catch-info]', err);
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      if (form.sampleParams) {
        try { JSON.parse(form.sampleParams); }
        catch { props.showToast('파라미터 샘플 JSON 형식이 올바르지 않습니다.', 'error'); return; }
      }
      const ok = await props.showConfirm(cfIsNew.value ? '등록' : '저장', cfIsNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      if (cfIsNew.value) {
        templates.push({ ...form, templateId: nextId.value(templates, 'templateId'), regDate: new Date().toISOString().slice(0, 10) });
      } else {
        const idx = templates.findIndex(x => x.templateId === props.editId);
        if (idx !== -1) Object.assign(templates[idx], { ...form });
      }
      try {
        const res = await (cfIsNew.value ? window.boApi.post(`/bo/sy/template`, { ...form }) : window.boApi.put(`/bo/sy/template/${form.templateId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('syTemplateMng');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const cfNeedSubject = computed(() => ['메일템플릿', 'MMS템플릿', '시스템알림'].includes(form.templateTypeCd));
    const cfIsLongContent = computed(() => ['MMS템플릿'].includes(form.templateTypeCd));

    /* 미리보기 / 발송 모달 */
    const uiState = reactive({ previewOpen: false, sendOpen: false, error: null, isPageCodeLoad: false, loading: false, quillEditorEl: null});
    const codes = reactive({});

    const quillEditorEl = Vue.toRef(uiState, 'quillEditorEl');
    return { templates, loading, uiState, cfIsNew, form, errors, handleSave, TEMPLATE_TYPES, cfNeedSubject, cfIsLongContent,
             cfUseHtmlEditor, quillEditorEl, uiState, cfSiteNm };
  },
  template: /* html */`
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="page-title">{{ cfIsNew ? '템플릿 등록' : (viewMode ? '템플릿 상세' : '템플릿 수정') }}</div><span v-if="!cfIsNew" style="font-size:12px;color:#999;">#{{ form.templateId }}</span></div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ cfSiteNm }}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">템플릿유형 <span v-if="!viewMode" class="req">*</span></label>
        <select class="form-control" v-model="form.templateTypeCd" :disabled="viewMode">
          <option v-for="t in TEMPLATE_TYPES" :key="t">{{ t }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">템플릿코드 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.templateCode" placeholder="예) ORDER_CONFIRM_MAIL"
          @input="form.templateCode=form.templateCode.toUpperCase().replace(/[^A-Z0-9_]/g,'')"
          :readonly="viewMode"
          :class="errors.templateCode ? 'is-invalid' : ''" />
        <span v-if="errors.templateCode" class="field-error">{{ errors.templateCode }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">템플릿명 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.templateNm" placeholder="템플릿명 입력" :readonly="viewMode" :class="errors.templateNm ? 'is-invalid' : ''" />
        <span v-if="errors.templateNm" class="field-error">{{ errors.templateNm }}</span>
      </div>
    </div>
    <div class="form-row" v-if="cfNeedSubject">
      <div class="form-group" style="flex:1">
        <label class="form-label">제목 (Subject)</label>
        <input class="form-control" v-model="form.subject" placeholder="메일/MMS/시스템 제목" :readonly="viewMode" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">내용 <span v-if="!viewMode" class="req">*</span>
          <span style="font-size:11px;color:#888;margin-left:6px;">사용 가능 변수: &#123;&#123;username&#125;&#125;, &#123;&#123;orderId&#125;&#125;, &#123;&#123;prodNm&#125;&#125;, &#123;&#123;trackingNo&#125;&#125; 등</span>
        </label>
        <!-- HTML 에디터 (메일, 시스템알림) -->
        <template v-if="cfUseHtmlEditor">
          <div v-if="viewMode" class="form-control" style="height:260px;line-height:1.6;overflow:auto;" v-html="form.content || '<span style=color:#bbb>-</span>'"></div>
          <div v-else ref="quillEditorEl"
            style="height:260px;background:#fff;border:1px solid #d9d9d9;border-radius:0 0 6px 6px;"></div>
        </template>
        <!-- 텍스트 영역 -->
        <textarea v-else class="form-control" v-model="form.content"
          :rows="cfIsLongContent ? 10 : 5"
          placeholder="템플릿 내용 입력"
          :readonly="viewMode"
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
          :readonly="viewMode"></textarea>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사용여부</label>
        <select class="form-control" v-model="form.useYn" :disabled="viewMode">
          <option value="Y">사용</option><option value="N">미사용</option>
        </select>
      </div>
    </div>
    <div class="form-actions">
      <template v-if="viewMode">
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

  <!-- 미리보기 모달 -->
  <template-preview-modal v-if="uiState.previewOpen"
    :tmpl="form" :sample-params="form.sampleParams"
    @close="uiState.previewOpen=false" />

  <!-- 발송하기 모달 -->
  <template-send-modal v-if="uiState.sendOpen"
    :tmpl="form" :show-toast="showToast" :show-confirm="showConfirm"
    @close="uiState.sendOpen=false" />
</div>
`
};
