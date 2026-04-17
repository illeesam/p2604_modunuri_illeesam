/* ShopJoy Admin - 판촉마일리지 상세/등록 */
window._pmSaveDtlState = window._pmSaveDtlState || { tab: 'info', viewMode: 'tab' };
window.PmSaveDtl = {
  name: 'PmSaveDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, ref, onMounted } = Vue;
    const isNew = computed(() => !props.editId);
    const tab = ref(window._pmSaveDtlState.tab || 'info');
    Vue.watch(tab, v => { window._pmSaveDtlState.tab = v; });
    const viewMode2 = ref(window._pmSaveDtlState.viewMode || 'tab');
    Vue.watch(viewMode2, v => { window._pmSaveDtlState.viewMode = v; });
    const showTab = (id) => viewMode2.value !== 'tab' || tab.value === id;

    const _today = new Date();
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END   = `${_today.getFullYear()+1}-12-31`;

    const form = reactive({
      saveId: null, saveNm: '', saveType: '구매적립', saveVal: 0, saveUnit: '원',
      saveStatus: '활성', startDate: DEFAULT_START, endDate: DEFAULT_END,
      expireDay: 365, minOrderAmt: 0, remark: '',
      visibilityTargets: '^PUBLIC^',
    });
    const errors = reactive({});

    const schema = yup.object({
      saveNm: yup.string().required('마일리지명을 입력해주세요.'),
      saveVal: yup.number().min(0, '적립값은 0 이상이어야 합니다.').required('적립값을 입력해주세요.'),
    });

    onMounted(() => {
      if (!isNew.value) {
        const s = (props.adminData.saveList || []).find(x => x.saveId === props.editId);
        if (s) Object.assign(form, s);
      }
    });

    const visibilityOptions = computed(() => window.visibilityUtil.allOptions());
    const hasVisibility = (code) => window.visibilityUtil.has(form.visibilityTargets, code);
    const toggleVisibility = (code) => {
      const list = window.visibilityUtil.parse(form.visibilityTargets);
      const i = list.indexOf(code);
      if (i >= 0) list.splice(i, 1); else list.push(code);
      form.visibilityTargets = window.visibilityUtil.serialize(list);
    };

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
        path: `save/${form.saveId}`,
        data: { ...form },
        confirmTitle: isNew.value ? '등록' : '저장',
        confirmMsg: isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?',
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: isNew.value ? '등록되었습니다.' : '저장되었습니다.',
        onLocal: () => {
          if (!props.adminData.saveList) props.adminData.saveList = [];
          if (isNew.value) {
            props.adminData.saveList.push({
              ...form,
              saveId: Date.now(),
              regDate: new Date().toISOString().slice(0, 10),
            });
          } else {
            const idx = props.adminData.saveList.findIndex(x => x.saveId === props.editId);
            if (idx !== -1) Object.assign(props.adminData.saveList[idx], { ...form });
          }
        },
        navigate: props.navigate,
        navigateTo: 'pmSaveMng',
      });
    };

    return { isNew, tab, form, errors, showTab, viewMode2, save, visibilityOptions, hasVisibility, toggleVisibility };
  },
  template: /* html */`
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="page-title">{{ isNew ? '판촉마일리지 등록' : '판촉마일리지 수정' }}</div><span v-if="!isNew" style="font-size:12px;color:#999;">#{{ form.saveId }}</span></div>
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:tab==='info'}" :disabled="viewMode2!=='tab'" @click="tab='info'">📋 기본정보</button>
      <button class="tab-btn" :class="{active:tab==='visibility'}" :disabled="viewMode2!=='tab'" @click="tab='visibility'">🔒 공개대상</button>
      <button class="tab-btn" :class="{active:tab==='preview'}" :disabled="viewMode2!=='tab'" @click="tab='preview'">👁 미리보기</button>
    </div>
    <div class="tab-view-modes">
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='tab'}" @click="viewMode2='tab'" title="탭">📑</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='1col'}" @click="viewMode2='1col'" title="1열">1▭</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='2col'}" @click="viewMode2='2col'" title="2열">2▭</button>
    </div>
  </div>
  <div :class="viewMode2!=='tab' ? 'dtl-tab-grid cols-'+viewMode2.charAt(0) : ''">

    <!-- 기본정보 -->
    <div class="card" v-show="showTab('info')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📋 기본정보</div>
      <div class="form-group">
        <label class="form-label">마일리지명 <span class="req">*</span></label>
        <input class="form-control" v-model="form.saveNm" placeholder="마일리지명 입력" :class="errors.saveNm ? 'is-invalid' : ''" />
        <span v-if="errors.saveNm" class="field-error">{{ errors.saveNm }}</span>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">적립유형</label>
          <select class="form-control" v-model="form.saveType">
            <option>구매적립</option><option>회원가입</option><option>리뷰적립</option><option>출석체크</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">적립값 <span class="req">*</span></label>
          <input class="form-control" type="number" v-model.number="form.saveVal" placeholder="적립값 입력" :class="errors.saveVal ? 'is-invalid' : ''" />
          <span v-if="errors.saveVal" class="field-error">{{ errors.saveVal }}</span>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">적립단위</label>
          <select class="form-control" v-model="form.saveUnit">
            <option>원</option><option>%</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">유효기간 (일)</label>
          <input class="form-control" type="number" v-model.number="form.expireDay" placeholder="365" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">최소주문금액 (원)</label>
          <input class="form-control" type="number" v-model.number="form.minOrderAmt" placeholder="0" />
        </div>
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" v-model="form.saveStatus">
            <option>활성</option><option>비활성</option><option>종료</option>
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
      </div>
      <div class="form-group">
        <label class="form-label">비고</label>
        <textarea class="form-control" v-model="form.remark" rows="2" placeholder="비고 입력"></textarea>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('pmSaveMng')">취소</button>
      </div>
    </div>

    <!-- 공개대상 -->
    <div class="card" v-show="showTab('visibility')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">🔒 공개대상</div>
      <div style="font-size:12px;font-weight:700;color:#888;margin-bottom:8px;">하나라도 해당하면 노출</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        <label v-for="opt in visibilityOptions" :key="opt.codeValue"
          :style="{display:'inline-flex',alignItems:'center',gap:'6px',padding:'5px 10px',borderRadius:'14px',border:'1px solid '+(hasVisibility(opt.codeValue)?'#1565c0':'#ddd'),background:hasVisibility(opt.codeValue)?'#e3f2fd':'#fafafa',color:hasVisibility(opt.codeValue)?'#1565c0':'#666',fontSize:'12px',fontWeight:hasVisibility(opt.codeValue)?700:500,cursor:'pointer'}">
          <input type="checkbox" :checked="hasVisibility(opt.codeValue)" @change="toggleVisibility(opt.codeValue)" style="accent-color:#1565c0;" />
          {{ opt.codeLabel }}
        </label>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('pmSaveMng')">취소</button>
      </div>
    </div>

    <!-- 미리보기 -->
    <div class="card" v-show="showTab('preview')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">👁 미리보기</div>
      <div style="background:#f9f9f9;border-radius:10px;padding:20px;border:1px solid #e8e8e8;max-width:600px;">
        <div style="font-size:18px;font-weight:700;margin-bottom:12px;color:#1a1a2e;">{{ form.saveNm || '마일리지명' }}</div>
        <div style="font-size:12px;color:#aaa;margin-bottom:16px;">{{ form.startDate }} ~ {{ form.endDate }}</div>
        <div style="background:#fff;padding:12px;border-radius:6px;margin-bottom:12px;border-left:4px solid #10b981;">
          <div style="font-size:13px;color:#666;margin-bottom:4px;">적립유형: <span style="font-weight:700;color:#10b981;">{{ form.saveType }}</span></div>
          <div style="font-size:13px;color:#666;margin-bottom:4px;">적립값: <span style="font-weight:700;color:#10b981;">{{ (form.saveVal||0).toLocaleString() }} {{ form.saveUnit || '원' }}</span></div>
          <div style="font-size:13px;color:#666;margin-bottom:4px;">유효기간: <span style="font-weight:700;">{{ form.expireDay || 365 }}일</span></div>
          <div style="font-size:13px;color:#666;">최소주문금액: <span style="font-weight:700;">{{ (form.minOrderAmt||0).toLocaleString() }}원</span></div>
        </div>
        <button class="btn btn-primary" @click="showToast('마일리지를 확인하였습니다.', 'success')">마일리지 확인</button>
      </div>
    </div>
  </div>
</div>
`
};
