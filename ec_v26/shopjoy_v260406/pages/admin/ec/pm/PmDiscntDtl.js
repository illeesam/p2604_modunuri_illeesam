/* ShopJoy Admin - 판촉할인 상세/등록 */
window._pmDiscntDtlState = window._pmDiscntDtlState || { tab: 'info', viewMode: 'tab' };
window.PmDiscntDtl = {
  name: 'PmDiscntDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, ref, onMounted } = Vue;
    const isNew = computed(() => !props.editId);
    const tab = ref(window._pmDiscntDtlState.tab || 'info');
    Vue.watch(tab, v => { window._pmDiscntDtlState.tab = v; });
    const viewMode2 = ref(window._pmDiscntDtlState.viewMode || 'tab');
    Vue.watch(viewMode2, v => { window._pmDiscntDtlState.viewMode = v; });
    const showTab = (id) => viewMode2.value !== 'tab' || tab.value === id;

    const _today = new Date();
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END   = `${_today.getFullYear()+1}-12-31`;

    const form = reactive({
      discntId: null, discntNm: '', discntType: '정률', discntVal: 0,
      discntStatus: '활성', startDate: DEFAULT_START, endDate: DEFAULT_END,
      applyTarget: '전체상품', minOrderAmt: 0, maxDiscntAmt: 0, remark: '',
      visibilityTargets: '^PUBLIC^',
    });
    const errors = reactive({});

    const schema = yup.object({
      discntNm: yup.string().required('할인명을 입력해주세요.'),
      discntVal: yup.number().min(0, '할인값은 0 이상이어야 합니다.').required('할인값을 입력해주세요.'),
    });

    onMounted(() => {
      if (!isNew.value) {
        const d = (props.adminData.discntList || []).find(x => x.discntId === props.editId);
        if (d) Object.assign(form, d);
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
        path: `discnt/${form.discntId}`,
        data: { ...form },
        confirmTitle: isNew.value ? '등록' : '저장',
        confirmMsg: isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?',
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: isNew.value ? '등록되었습니다.' : '저장되었습니다.',
        onLocal: () => {
          if (!props.adminData.discntList) props.adminData.discntList = [];
          if (isNew.value) {
            props.adminData.discntList.push({
              ...form,
              discntId: Date.now(),
              regDate: new Date().toISOString().slice(0, 10),
            });
          } else {
            const idx = props.adminData.discntList.findIndex(x => x.discntId === props.editId);
            if (idx !== -1) Object.assign(props.adminData.discntList[idx], { ...form });
          }
        },
        navigate: props.navigate,
        navigateTo: 'pmDiscntMng',
      });
    };

    return { isNew, tab, form, errors, showTab, viewMode2, save, visibilityOptions, hasVisibility, toggleVisibility };
  },
  template: /* html */`
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="page-title">{{ isNew ? '판촉할인 등록' : '판촉할인 수정' }}</div><span v-if="!isNew" style="font-size:12px;color:#999;">#{{ form.discntId }}</span></div>
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
        <label class="form-label">할인명 <span class="req">*</span></label>
        <input class="form-control" v-model="form.discntNm" placeholder="할인명 입력" :class="errors.discntNm ? 'is-invalid' : ''" />
        <span v-if="errors.discntNm" class="field-error">{{ errors.discntNm }}</span>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">할인유형</label>
          <select class="form-control" v-model="form.discntType">
            <option>정률</option><option>정액</option><option>장바구니</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">할인값 <span class="req">*</span></label>
          <input class="form-control" type="number" v-model.number="form.discntVal" :placeholder="form.discntType==='정률' ? '% 입력 (예: 10)' : '원 입력 (예: 5000)'" :class="errors.discntVal ? 'is-invalid' : ''" />
          <span v-if="errors.discntVal" class="field-error">{{ errors.discntVal }}</span>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">최소주문금액 (원)</label>
          <input class="form-control" type="number" v-model.number="form.minOrderAmt" placeholder="0" />
        </div>
        <div class="form-group">
          <label class="form-label">최대할인금액 (원)</label>
          <input class="form-control" type="number" v-model.number="form.maxDiscntAmt" placeholder="0 = 무제한" />
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
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">적용대상</label>
          <select class="form-control" v-model="form.applyTarget">
            <option>전체상품</option><option>선택상품</option><option>카테고리</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" v-model="form.discntStatus">
            <option>활성</option><option>비활성</option><option>종료</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">비고</label>
        <textarea class="form-control" v-model="form.remark" rows="2" placeholder="비고 입력"></textarea>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('pmDiscntMng')">취소</button>
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
        <button class="btn btn-secondary" @click="navigate('pmDiscntMng')">취소</button>
      </div>
    </div>

    <!-- 미리보기 -->
    <div class="card" v-show="showTab('preview')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">👁 미리보기</div>
      <div style="background:#f9f9f9;border-radius:10px;padding:20px;border:1px solid #e8e8e8;max-width:600px;">
        <div style="font-size:18px;font-weight:700;margin-bottom:12px;color:#1a1a2e;">{{ form.discntNm || '할인명' }}</div>
        <div style="font-size:12px;color:#aaa;margin-bottom:16px;">{{ form.startDate }} ~ {{ form.endDate }}</div>
        <div style="background:#fff;padding:12px;border-radius:6px;margin-bottom:12px;border-left:4px solid #e8587a;">
          <div style="font-size:13px;color:#666;margin-bottom:4px;">할인유형: <span style="font-weight:700;color:#e8587a;">{{ form.discntType }}</span></div>
          <div style="font-size:13px;color:#666;margin-bottom:4px;">할인값: <span style="font-weight:700;color:#e8587a;">{{ form.discntType === '정률' ? (form.discntVal + '%') : (form.discntVal||0).toLocaleString() + '원' }}</span></div>
          <div style="font-size:13px;color:#666;">최소주문금액: <span style="font-weight:700;">{{ (form.minOrderAmt||0).toLocaleString() }}원</span></div>
        </div>
        <div v-if="form.maxDiscntAmt > 0" style="font-size:12px;color:#888;padding:8px;background:#fff7e6;border-radius:6px;margin-bottom:12px;">
          ⚠️ 최대할인금액: {{ (form.maxDiscntAmt||0).toLocaleString() }}원
        </div>
        <button class="btn btn-primary" @click="showToast('할인을 확인하였습니다.', 'success')">할인 확인</button>
      </div>
    </div>
  </div>
</div>
`
};
