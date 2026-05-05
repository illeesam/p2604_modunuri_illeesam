/* ShopJoy Admin - 판촉할인 상세/등록 */
window._pmDiscntDtlState = window._pmDiscntDtlState || { tab: 'info', tabMode: 'tab' };
window.PmDiscntDtl = {
  name: 'PmDiscntDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    tabMode:      { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit)
  },
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;
    const showConfirm  = window.boApp.showConfirm;
    const showRefModal = window.boApp.showRefModal;
    const setApiRes    = window.boApp.setApiRes;
    const uiState = reactive({ loading: false, showVendorModal: false, error: null, isPageCodeLoad: false, tab: window._pmDiscntDtlState.tab || 'info', tabMode2: window._pmDiscntDtlState.tabMode || 'tab'});
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({ discnt_types: [], promo_statuses: [], discnt_apply_targets: [] });

    // 단건 조회
    const handleSearchDetail = async () => {
      if (cfIsNew.value) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.pmDiscnt.getById(props.dtlId, '할인관리', '상세조회');
        const d = res.data?.data || res.data;
        if (d) Object.assign(form, d);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    const cfIsNew = computed(() => !props.dtlId);

watch(() => uiState.tab, v => { window._pmDiscntDtlState.tab = v; });

        watch(() => uiState.tabMode2, v => { window._pmDiscntDtlState.tabMode = v; });
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.discnt_types = codeStore.sgGetGrpCodes('DISCNT_TYPE_KR');
      codes.promo_statuses = codeStore.sgGetGrpCodes('PROMO_STATUS');
      codes.discnt_apply_targets = codeStore.sgGetGrpCodes('DISCNT_APPLY_TARGET');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = boUtil.useAppCodeReady(uiState, fnLoadCodes);


    const _today = new Date();
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END   = `${_today.getFullYear()+1}-12-31`;

    const form = reactive({
      discntId: null, discntNm: '', discntType: '정률', discntVal: 0,
      discntStatus: '활성', startDate: DEFAULT_START, endDate: DEFAULT_END,
      applyTarget: '전체상품', minOrderAmt: 0, maxDiscntAmt: 0, remark: '',
      visibilityTargets: '^PUBLIC^',
      vendorId: '', chargeStaff: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      discntNm: yup.string().required('할인명을 입력해주세요.'),
      discntVal: yup.number().min(0, '할인값은 0 이상이어야 합니다.').required('할인값을 입력해주세요.'),
    });

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
    });

    const cfVisibilityOptions = computed(() => window.visibilityUtil.allOptions());
    const hasVisibility = (code) => window.visibilityUtil.has(form.visibilityTargets, code);
    const toggleVisibility = (code) => {
      const list = window.visibilityUtil.parse(form.visibilityTargets);
      const i = list.indexOf(code);
      if (i >= 0) list.splice(i, 1); else list.push(code);
      form.visibilityTargets = window.visibilityUtil.serialize(list);
    };

    const cfCurId       = computed(() => props.dtlId || form.discntId || null);
    const cfHasId       = computed(() => !!cfCurId.value);
    const cfSaveDisabled = computed(() => uiState.tab !== 'info' && !cfHasId.value);

    const _afterApiOk  = (res, msg) => {
      if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
      if (showToast) showToast(msg, 'success');
    };
    const _afterApiErr = (err) => {
      console.error('[handleSave]', err);
      const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
      if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
      if (showToast) showToast(errMsg, 'error', 0);
    };

    /* ── 탭별 저장: info/detail 은 form 전체, target 은 적용대상/공개대상만 부분 PUT ── */
    const handleSave = async () => {
      const tabId = uiState.tab;

      if (!cfHasId.value && tabId !== 'info') {
        showToast('먼저 기본정보 탭에서 등록해주세요.', 'error');
        return;
      }

      if (tabId === 'info' || tabId === 'detail') {
        Object.keys(errors).forEach(k => delete errors[k]);
        try { await schema.validate(form, { abortEarly: false }); }
        catch (err) { err.inner.forEach(e => { errors[e.path] = e.message; }); showToast('입력 내용을 확인해주세요.', 'error'); return; }

        const isCreate = !cfHasId.value;
        const ok = await showConfirm(isCreate ? '등록' : '저장', isCreate ? '등록하시겠습니까?' : '저장하시겠습니까?');
        if (!ok) return;
        try {
          const payload = { ...form };
          const res = isCreate
            ? await boApiSvc.pmDiscnt.create(payload, '할인관리', '등록')
            : await boApiSvc.pmDiscnt.update(cfCurId.value, payload, '할인관리', tabId === 'info' ? '기본정보저장' : '상세정보저장');
          if (isCreate) {
            const newId = res.data?.data?.discntId || res.data?.discntId || null;
            if (newId) form.discntId = newId;
          }
          _afterApiOk(res, isCreate ? '등록되었습니다. 다른 탭을 저장할 수 있습니다.' : '저장되었습니다.');
        } catch (err) { _afterApiErr(err); }
        return;
      }

      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;
      let payload = null;
      switch (tabId) {
        case 'target':  payload = { applyTarget: form.applyTarget, visibilityTargets: form.visibilityTargets }; break;
        default:        payload = {}; break;
      }
      try {
        const res = await boApiSvc.pmDiscnt.update(cfCurId.value, payload, '할인관리', `${tabId}저장`);
        _afterApiOk(res, '저장되었습니다.');
      } catch (err) { _afterApiErr(err); }
    };

    const cfSelectedVendorNm = computed(() => {
      if (!form.vendorId) return '소속업체 선택';
      const v = vendors.value.find(x => x.vendorId === form.vendorId);
      return v ? v.vendorNm : '소속업체 선택';
    });
    const selectVendor = (vendorId, vendorNm) => {
      form.vendorId = vendorId;
      uiState.showVendorModal = false;
    };

    const showVendorModal = Vue.toRef(uiState, 'showVendorModal');

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    // -- return ---------------------------------------------------------------

    return { uiState, codes, cfIsNew, cfHasId, cfSaveDisabled, tab, form, errors, showTab, cfDtlMode, tabMode2, handleSave, cfVisibilityOptions, hasVisibility, toggleVisibility, cfSelectedVendorNm, selectVendor };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ cfIsNew ? '할인 등록' : '할인 수정' }}<span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.discntId }}</span></div>
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:tab==='info'}" :disabled="tabMode2!=='tab'" @click="tab='info'">📋 기본정보</button>
      <button class="tab-btn" :class="{active:tab==='detail'}" :disabled="tabMode2!=='tab'" @click="tab='detail'">📋 상세정보</button>
      <button class="tab-btn" :class="{active:tab==='target'}" :disabled="tabMode2!=='tab'" @click="tab='target'">🎯 적용대상</button>
      <button class="tab-btn" :class="{active:tab==='preview'}" :disabled="tabMode2!=='tab'" @click="tab='preview'">👁 미리보기</button>
    </div>
    <div class="tab-modes">
      <button class="tab-mode-btn" :class="{active:tabMode2==='tab'}" @click="tabMode2='tab'" title="탭">📑</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='1col'}" @click="tabMode2='1col'" title="1열">1▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='2col'}" @click="tabMode2='2col'" title="2열">2▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='3col'}" @click="tabMode2='3col'" title="3열">3▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='4col'}" @click="tabMode2='4col'" title="4열">4▭</button>
    </div>
  </div>
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">

    <!-- -- 기본정보 --------------------------------------------------------- -->
    <div class="card" v-show="showTab('info')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📋 기본정보</div>
      <div class="form-group">
        <label class="form-label">할인명 <span class="req">*</span></label>
        <input class="form-control" v-model="form.discntNm" placeholder="할인명 입력" :class="errors.discntNm ? 'is-invalid' : ''" />
        <span v-if="errors.discntNm" class="field-error">{{ errors.discntNm }}</span>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">할인유형</label>
          <select class="form-control" v-model="form.discntType">
            <option v-for="c in codes.discnt_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">할인값 <span class="req">*</span></label>
          <input class="form-control" type="number" v-model.number="form.discntVal" :placeholder="form.discntType==='정률' ? '% 입력 (예: 10)' : '원 입력 (예: 5000)'" :class="errors.discntVal ? 'is-invalid' : ''" />
          <span v-if="errors.discntVal" class="field-error">{{ errors.discntVal }}</span>
        </div>
      </div>
      <div class="form-row" style="margin-top:20px;padding-top:20px;border-top:1px solid #e8e8e8;">
        <div class="form-group">
          <label class="form-label">판매업체</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <div class="form-control" style="background:#f9f9f9;cursor:pointer;padding:0;display:flex;align-items:center;" @click="showVendorModal=true">
              <span style="padding:8px 12px;flex:1;">{{ cfSelectedVendorNm }}</span>
              <span style="padding:8px 12px;color:#999;font-size:12px;">▼</span>
            </div>
            <button v-if="form.vendorId" class="btn btn-sm" style="padding:0 12px;color:#666;" @click="form.vendorId='';form.chargeStaff=''">초기화</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">판매담당자</label>
          <input class="form-control" v-model="form.chargeStaff" placeholder="담당자명 입력" />
        </div>
      </div>

      <!-- -- 판매업체 선택 모달 ------------------------------------------------- -->
      <div v-if="showVendorModal" class="modal-overlay" @click.self="showVendorModal=false">
        <div class="modal-box" style="width:400px;">
          <div class="modal-header">
            <span class="modal-title">판매업체 선택</span>
            <span class="modal-close" @click="showVendorModal=false">×</span>
          </div>
          <div style="padding:0;max-height:400px;overflow-y:auto;">
            <div v-for="v in ([] || [])" :key="v?.vendorId"
              style="padding:12px 16px;border-bottom:1px solid #f0f0f0;cursor:pointer;display:flex;justify-content:space-between;align-items:center;"
              :style="form.vendorId===v.vendorId?{background:'#f0f4ff',color:'#1565c0'}:{}"
              @click="selectVendor(v.vendorId, v.vendorNm)">
              <span style="font-weight:500;">{{ v.vendorNm }}</span>
              <span v-if="form.vendorId===v.vendorId" style="color:#1565c0;font-weight:700;">✓</span>
            </div>
            <div v-if="![] || [].length===0" style="padding:20px;text-align:center;color:#aaa;font-size:13px;">
              판매업체가 없습니다.
            </div>
          </div>
          <div style="padding:12px 16px;border-top:1px solid #f0f0f0;text-align:right;">
            <button class="btn btn-secondary btn-sm" @click="showVendorModal=false">닫기</button>
          </div>
        </div>
      </div>

      <div class="form-actions" v-if="!cfDtlMode">
        <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleSave">저장</button>
        <button class="btn btn-secondary" @click="navigate('pmDiscntMng')">취소</button>
      </div>
    </div>

    <!-- -- 상세정보 --------------------------------------------------------- -->
    <div class="card" v-show="showTab('detail')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📋 상세정보</div>

      <!-- -- 공개대상 ------------------------------------------------------- -->
      <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e8e8e8;">
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;">🔒 공개대상</h3>
        <div style="font-size:12px;font-weight:700;color:#888;margin-bottom:8px;">하나라도 해당하면 노출</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          <label v-for="opt in cfVisibilityOptions" :key="opt?.codeValue"
            :style="{display:'inline-flex',alignItems:'center',gap:'6px',padding:'5px 10px',borderRadius:'14px',border:'1px solid '+(hasVisibility(opt.codeValue)?'#1565c0':'#ddd'),background:hasVisibility(opt.codeValue)?'#e3f2fd':'#fafafa',color:hasVisibility(opt.codeValue)?'#1565c0':'#666',fontSize:'12px',fontWeight:hasVisibility(opt.codeValue)?700:500,cursor:'pointer'}">
            <input type="checkbox" :checked="hasVisibility(opt.codeValue)" @change="toggleVisibility(opt.codeValue)" style="accent-color:#1565c0;" />
            {{ opt.codeLabel }}
          </label>
        </div>
      </div>

      <!-- -- 할인적용 ------------------------------------------------------- -->
      <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e8e8e8;">
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;">💰 할인적용</h3>
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
      </div>

      <!-- -- 기간설정 ------------------------------------------------------- -->
      <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e8e8e8;">
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;">📅 기간설정</h3>
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
      </div>

      <!-- -- 상태 및 비고 ---------------------------------------------------- -->
      <div>
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;">⚙️ 상태 및 비고</h3>
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" v-model="form.discntStatus">
            <option v-for="c in codes.promo_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">비고</label>
          <textarea class="form-control" v-model="form.remark" rows="2" placeholder="비고 입력"></textarea>
        </div>
      </div>

      <div class="form-actions" v-if="!cfDtlMode">
        <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleSave">저장</button>
        <button class="btn btn-secondary" @click="navigate('pmDiscntMng')">취소</button>
      </div>
    </div>

    <!-- -- 적용대상 --------------------------------------------------------- -->
    <div class="card" v-show="showTab('target')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🎯 적용대상</div>

      <div class="form-group">
        <label class="form-label">적용 대상 선택</label>
        <select class="form-control" v-model="form.applyTarget">
          <option v-for="c in codes.discnt_apply_targets" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>

      <div style="margin-top:16px;padding:12px;background:#f9f9f9;border-radius:6px;border:1px solid #e0e0e0;margin-bottom:20px;">
        <div style="font-size:12px;font-weight:700;color:#666;margin-bottom:8px;">선택된 대상: <span style="color:#e8587a;">{{ form.applyTarget }}</span></div>
        <div style="font-size:13px;color:#888;">
          <template v-if="form.applyTarget==='전체상품'">
            모든 상품에 이 할인을 적용합니다.
          </template>
          <template v-else-if="form.applyTarget==='선택상품'">
            선택한 상품에만 이 할인을 적용합니다. 아래에서 상품을 추가하세요.
          </template>
          <template v-else-if="form.applyTarget==='카테고리'">
            선택한 카테고리의 상품에만 이 할인을 적용합니다. 아래에서 카테고리를 선택하세요.
          </template>
        </div>
      </div>

      <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e8e8e8;">
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;">📦 상품목록</h3>
        <div v-if="form.applyTarget==='선택상품'" style="border:1px solid #ddd;border-radius:6px;padding:12px;background:#fafafa;min-height:200px;">
          <div style="text-align:center;color:#999;padding:30px;font-size:13px;">
            선택된 상품이 없습니다. 상품 추가 버튼을 클릭하여 상품을 선택하세요.
          </div>
        </div>
        <div v-else-if="form.applyTarget==='카테고리'" style="border:1px solid #ddd;border-radius:6px;padding:12px;background:#fafafa;min-height:200px;">
          <div style="text-align:center;color:#999;padding:30px;font-size:13px;">
            선택된 카테고리가 없습니다. 카테고리 선택 버튼을 클릭하여 카테고리를 선택하세요.
          </div>
        </div>
        <div v-else style="border:1px solid #ddd;border-radius:6px;padding:12px;background:#f0f7ff;min-height:200px;">
          <div style="text-align:center;color:#1565c0;padding:30px;font-size:13px;">
            ✓ 전체 상품이 선택되었습니다.
          </div>
        </div>
      </div>

      <div class="form-actions" v-if="!cfDtlMode">
        <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleSave">저장</button>
        <button class="btn btn-secondary" @click="navigate('pmDiscntMng')">취소</button>
      </div>
    </div>

    <!-- -- 미리보기 --------------------------------------------------------- -->
    <div class="card" v-show="showTab('preview')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">👁 미리보기</div>
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
