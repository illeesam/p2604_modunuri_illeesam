/* ShopJoy Admin - 템플릿 상세/등록 */
window.TemplateDtl = {
  name: 'TemplateDtl',
  props: ['navigate', 'adminData', 'showToast', 'editId'],
  setup(props) {
    const { reactive, computed, onMounted } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const TEMPLATE_TYPES = ['메일템플릿', '문자템플릿', 'MMS템플릿', 'kakao톡템플릿', 'kakao알림톡템플릿'];
    const form = reactive({
      templateType: '메일템플릿', templateName: '', subject: '', content: '', useYn: 'Y',
    });

    onMounted(() => {
      if (!isNew.value) {
        const t = props.adminData.templates.find(x => x.templateId === props.editId);
        if (t) Object.assign(form, { ...t });
      }
    });

    const save = () => {
      if (!form.templateName || !form.content) { props.showToast('필수 항목을 입력해주세요.', 'error'); return; }
      if (isNew.value) {
        props.adminData.templates.push({
          ...form, templateId: props.adminData.nextId(props.adminData.templates, 'templateId'),
          regDate: new Date().toISOString().slice(0, 10),
        });
        props.showToast('템플릿이 등록되었습니다.');
      } else {
        const idx = props.adminData.templates.findIndex(x => x.templateId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.templates[idx], form);
        props.showToast('저장되었습니다.');
      }
      props.navigate('templateMng');
    };

    const needSubject = computed(() => form.templateType === '메일템플릿' || form.templateType === 'MMS템플릿');
    const isLongContent = computed(() => ['메일템플릿', 'MMS템플릿'].includes(form.templateType));

    return { isNew, form, save, TEMPLATE_TYPES, needSubject, isLongContent };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '템플릿 등록' : '템플릿 수정' }}</div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">템플릿유형 <span class="req">*</span></label>
        <select class="form-control" v-model="form.templateType">
          <option v-for="t in TEMPLATE_TYPES" :key="t">{{ t }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">템플릿명 <span class="req">*</span></label>
        <input class="form-control" v-model="form.templateName" placeholder="템플릿명 입력" />
      </div>
    </div>
    <div class="form-row" v-if="needSubject">
      <div class="form-group" style="flex:1">
        <label class="form-label">제목 (Subject)</label>
        <input class="form-control" v-model="form.subject" placeholder="메일/MMS 제목" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">내용 <span class="req">*</span>
          <span style="font-size:11px;color:#888;margin-left:6px;">사용 가능 변수: {{username}}, {{orderId}}, {{productName}}, {{trackingNo}} 등</span>
        </label>
        <textarea class="form-control" v-model="form.content"
          :rows="isLongContent ? 12 : 5"
          placeholder="템플릿 내용 입력 (HTML 또는 텍스트)"></textarea>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사용여부</label>
        <select class="form-control" v-model="form.useYn">
          <option value="Y">사용</option><option value="N">미사용</option>
        </select>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('templateMng')">취소</button>
    </div>
  </div>
</div>
`
};
