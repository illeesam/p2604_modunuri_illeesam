/* ShopJoy Admin - 판촉사은품 상세/등록 */
window._pmGiftDtlState = window._pmGiftDtlState || { tab: 'info', viewMode: 'tab' };
window.PmGiftDtl = {
  name: 'PmGiftDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, ref, onMounted } = Vue;
    const isNew = computed(() => !props.editId);
    const tab = ref(window._pmGiftDtlState.tab || 'info');
    Vue.watch(tab, v => { window._pmGiftDtlState.tab = v; });
    const viewMode2 = ref(window._pmGiftDtlState.viewMode || 'tab');
    Vue.watch(viewMode2, v => { window._pmGiftDtlState.viewMode = v; });
    const showTab = (id) => viewMode2.value !== 'tab' || tab.value === id;

    const _today = new Date();
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END   = `${_today.getFullYear()+1}-12-31`;

    const form = reactive({
      giftId: null, giftNm: '', giftType: '구매조건', condVal: 0,
      giftStatus: '활성', stock: 0, startDate: DEFAULT_START, endDate: DEFAULT_END,
      giftProdId: null, remark: '',
      visibilityTargets: '^PUBLIC^',
      vendorId: '', chargeStaff: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      giftNm: yup.string().required('사은품명을 입력해주세요.'),
      stock:  yup.number().min(0, '재고는 0 이상이어야 합니다.').required('재고를 입력해주세요.'),
    });

    onMounted(() => {
      if (!isNew.value) {
        const g = (props.adminData.giftList || []).find(x => x.giftId === props.editId);
        if (g) Object.assign(form, g);
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

    const showVendorModal = ref(false);
    const selectedVendorNm = computed(() => {
      if (!form.vendorId) return '소속업체 선택';
      const v = props.adminData.vendors.find(x => x.vendorId === form.vendorId);
      return v ? v.vendorNm : '소속업체 선택';
    });
    const selectVendor = (vendorId, vendorNm) => {
      form.vendorId = vendorId;
      showVendorModal.value = false;
    };

    const condValLabel = computed(() => {
      if (form.giftType === '금액조건') return '기준금액 (원 이상)';
      if (form.giftType === '수량조건') return '기준수량 (개 이상)';
      if (form.giftType === '구매조건') return '기준금액 (원 이상)';
      return '조건값';
    });

    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const ok = await props.showConfirm(isNew.value ? '등록' : '저장', isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      if (!props.adminData.giftList) props.adminData.giftList = [];
      if (isNew.value) {
        props.adminData.giftList.push({
          ...form,
          giftId: Date.now(),
          regDate: new Date().toISOString().slice(0, 10),
        });
      } else {
        const idx = props.adminData.giftList.findIndex(x => x.giftId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.giftList[idx], { ...form });
      }
      try {
        const res = await (isNew.value ? window.adminApi.post(`gift/${form.giftId}`, { ...form }) : window.adminApi.put(`gift/${form.giftId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(isNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('pmGiftMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    return { isNew, tab, form, errors, showTab, viewMode2, save, visibilityOptions, hasVisibility, toggleVisibility, condValLabel, showVendorModal, selectedVendorNm, selectVendor };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '사은품 등록' : '사은품 수정' }}<span v-if="!isNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.giftId }}</span></div>
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
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='3col'}" @click="viewMode2='3col'" title="3열">3▭</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='4col'}" @click="viewMode2='4col'" title="4열">4▭</button>
    </div>
  </div>
  <div :class="viewMode2!=='tab' ? 'dtl-tab-grid cols-'+viewMode2.charAt(0) : ''">

    <!-- 기본정보 -->
    <div class="card" v-show="showTab('info')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📋 기본정보</div>
      <div class="form-group">
        <label class="form-label">사은품명 <span class="req">*</span></label>
        <input class="form-control" v-model="form.giftNm" placeholder="사은품명 입력" :class="errors.giftNm ? 'is-invalid' : ''" />
        <span v-if="errors.giftNm" class="field-error">{{ errors.giftNm }}</span>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">조건유형</label>
          <select class="form-control" v-model="form.giftType">
            <option>구매조건</option><option>금액조건</option><option>수량조건</option><option>무조건</option>
          </select>
        </div>
        <div class="form-group" v-if="form.giftType !== '무조건'">
          <label class="form-label">{{ condValLabel }}</label>
          <input class="form-control" type="number" v-model.number="form.condVal" placeholder="0" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">재고 <span class="req">*</span></label>
          <input class="form-control" type="number" v-model.number="form.stock" placeholder="0" :class="errors.stock ? 'is-invalid' : ''" />
          <span v-if="errors.stock" class="field-error">{{ errors.stock }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" v-model="form.giftStatus">
            <option>활성</option><option>비활성</option><option>종료</option><option>품절</option>
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
      <div class="form-row" style="margin-top:20px;padding-top:20px;border-top:1px solid #e8e8e8;">
        <div class="form-group">
          <label class="form-label">판매업체</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <div class="form-control" style="background:#f9f9f9;cursor:pointer;padding:0;display:flex;align-items:center;" @click="showVendorModal=true">
              <span style="padding:8px 12px;flex:1;">{{ selectedVendorNm }}</span>
              <span style="padding:8px 12px;color:#999;font-size:12px;">▼</span>
            </div>
            <button v-if="form.vendorId" class="btn btn-sm" style="padding:0 12px;color:#666;" @click="form.vendorId='';form.chargeStaff=''">초기화</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">판매담당자</label>
          <input class="form-control" v-model="form.chargeStaff" placeholder="담당자명 입력" :readonly="viewMode" />
        </div>
      </div>

      <!-- 판매업체 선택 모달 -->
      <div v-if="showVendorModal" class="modal-overlay" @click.self="showVendorModal=false">
        <div class="modal-box" style="width:400px;">
          <div class="modal-header">
            <span class="modal-title">판매업체 선택</span>
            <span class="modal-close" @click="showVendorModal=false">×</span>
          </div>
          <div style="padding:0;max-height:400px;overflow-y:auto;">
            <div v-for="v in (adminData.vendors || [])" :key="v.vendorId"
              style="padding:12px 16px;border-bottom:1px solid #f0f0f0;cursor:pointer;display:flex;justify-content:space-between;align-items:center;"
              :style="form.vendorId===v.vendorId?{background:'#f0f4ff',color:'#1565c0'}:{}"
              @click="selectVendor(v.vendorId, v.vendorNm)">
              <span style="font-weight:500;">{{ v.vendorNm }}</span>
              <span v-if="form.vendorId===v.vendorId" style="color:#1565c0;font-weight:700;">✓</span>
            </div>
            <div v-if="!adminData.vendors || adminData.vendors.length===0" style="padding:20px;text-align:center;color:#aaa;font-size:13px;">
              판매업체가 없습니다.
            </div>
          </div>
          <div style="padding:12px 16px;border-top:1px solid #f0f0f0;text-align:right;">
            <button class="btn btn-secondary btn-sm" @click="showVendorModal=false">닫기</button>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('pmGiftMng')">취소</button>
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
        <button class="btn btn-secondary" @click="navigate('pmGiftMng')">취소</button>
      </div>
    </div>

    <!-- 미리보기 -->
    <div class="card" v-show="showTab('preview')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">👁 미리보기</div>
      <div style="background:#f9f9f9;border-radius:10px;padding:20px;border:1px solid #e8e8e8;max-width:600px;">
        <div style="font-size:18px;font-weight:700;margin-bottom:12px;color:#1a1a2e;">🎁 {{ form.giftNm || '사은품명' }}</div>
        <div style="font-size:12px;color:#aaa;margin-bottom:16px;">{{ form.startDate }} ~ {{ form.endDate }}</div>
        <div style="background:#fff;padding:12px;border-radius:6px;margin-bottom:12px;border-left:4px solid #f59e0b;">
          <div style="font-size:13px;color:#666;margin-bottom:4px;">조건: <span style="font-weight:700;color:#f59e0b;">{{ form.giftType }}</span></div>
          <div v-if="form.giftType !== '무조건'" style="font-size:13px;color:#666;margin-bottom:4px;">조건값: <span style="font-weight:700;">{{ form.giftType === '금액조건' ? (form.condVal||0).toLocaleString() + '원↑' : form.giftType === '수량조건' ? (form.condVal||0) + '개↑' : form.condVal||0 }}</span></div>
          <div style="font-size:13px;color:#666;margin-bottom:4px;">재고: <span style="font-weight:700;">{{ (form.stock||0).toLocaleString() }}개</span></div>
          <div style="font-size:13px;color:#666;">상태: <span style="font-weight:700;">{{ form.giftStatus }}</span></div>
        </div>
        <button class="btn btn-primary" @click="showToast('사은품을 확인하였습니다.', 'success')">사은품 확인</button>
      </div>
    </div>
  </div>
</div>
`
};
