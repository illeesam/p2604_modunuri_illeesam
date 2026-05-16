/* ShopJoy Admin - 판촉사은품 상세/등록 */
window._pmGiftDtlState = window._pmGiftDtlState || { tab: 'info', tabMode: 'tab' };
window.PmGiftDtl = {
  name: 'PmGiftDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    tabMode:      { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const uiState = reactive({ loading: false, showVendorModal: false, error: null, isPageCodeLoad: false, tab: window._pmGiftDtlState.tab || 'info', tabMode2: window._pmGiftDtlState.tabMode || 'tab'});
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({ gift_cond_types: [], gift_statuses: [] });

    // 단건 조회
    const handleSearchDetail = async () => {
      if (cfIsNew.value) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.pmGift.getById(props.dtlId, '선물관리', '상세조회');
        const g = res.data?.data || res.data;
        if (g) Object.assign(form, g);
        // Entity minOrderAmt/minOrderQty → UI 단일 condVal 매핑
        if (g) {
          if (g.giftTypeCd === '수량조건') form.condVal = Number(g.minOrderQty) || 0;
          else form.condVal = Number(g.minOrderAmt) || 0;
        }
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    const cfIsNew = computed(() => !props.dtlId);

watch(() => uiState.tab, v => { window._pmGiftDtlState.tab = v; });

        watch(() => uiState.tabMode2, v => { window._pmGiftDtlState.tabMode = v; });

    /* 사은품 showTab */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;

    /* 사은품 fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.gift_cond_types = codeStore.sgGetGrpCodes('GIFT_COND_KR');
      codes.gift_statuses = codeStore.sgGetGrpCodes('GIFT_STATUS');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);


    const _today = new Date();

    /* 사은품 _pad */
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END   = `${_today.getFullYear()+1}-12-31`;

    const form = reactive({
      giftId: null, giftNm: '', giftTypeCd: '구매조건', condVal: 0,
      giftStatusCd: '활성', giftStock: 0, startDate: DEFAULT_START, endDate: DEFAULT_END,
      prodId: null, giftDesc: '', minOrderAmt: 0, minOrderQty: 0,
      visibilityTargets: '^PUBLIC^',
      vendorId: '', chargeStaff: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      giftNm: yup.string().required('사은품명을 입력해주세요.'),
      giftStock:  yup.number().min(0, '재고는 0 이상이어야 합니다.').required('재고를 입력해주세요.'),
    });

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) return;
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      if (typeof handleLoadDetail === 'function') await handleLoadDetail();
      else if (typeof handleSearchDetail === 'function') await handleSearchDetail();
    });

    const cfVisibilityOptions = computed(() => window.visibilityUtil.allOptions());

    /* 사은품 hasVisibility */
    const hasVisibility = (code) => window.visibilityUtil.has(form.visibilityTargets, code);

    /* 사은품 toggleVisibility */
    const toggleVisibility = (code) => {
      const list = window.visibilityUtil.parse(form.visibilityTargets);
      const i = list.indexOf(code);
      if (i >= 0) list.splice(i, 1); else list.push(code);
      form.visibilityTargets = window.visibilityUtil.serialize(list);
    };

    const cfSelectedVendorNm = computed(() => {
      if (!form.vendorId) return '소속업체 선택';
      const v = vendors.value.find(x => x.vendorId === form.vendorId);
      return v ? v.vendorNm : '소속업체 선택';
    });

    /* 사은품 selectVendor */
    const selectVendor = (vendorId, vendorNm) => {
      form.vendorId = vendorId;
      uiState.showVendorModal = false;
    };

    const cfCondValLabel = computed(() => {
      if (form.giftTypeCd === '금액조건') return '기준금액 (원 이상)';
      if (form.giftTypeCd === '수량조건') return '기준수량 (개 이상)';
      if (form.giftTypeCd === '구매조건') return '기준금액 (원 이상)';
      return '조건값';
    });

    /* ── 현재 작업중인 giftId: props.dtlId 우선, 없으면 신규등록 직후 form.giftId ── */
    const cfCurId       = computed(() => props.dtlId || form.giftId || null);
    const cfHasId       = computed(() => !!cfCurId.value);
    /* info 외 탭의 [저장] 버튼은 ID 없으면 비활성화 (info 탭은 신규등록 위해 항상 활성) */
    const cfSaveDisabled = computed(() => uiState.tab !== 'info' && !cfHasId.value);

    /* 사은품 _afterApiOk */
    const _afterApiOk  = (res, msg) => {
      if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
      if (showToast) showToast(msg, 'success');
    };

    /* 사은품 _afterApiErr */
    const _afterApiErr = (err) => {
      console.error('[handleSave]', err);
      const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
      if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
      if (showToast) showToast(errMsg, 'error', 0);
    };

    /* ── 탭별 저장: info=신규/전체저장, visibility=공개대상만 부분 PUT ── */
    const handleSave = async () => {
      const tabId = uiState.tab;

      if (!cfHasId.value && tabId !== 'info') {
        showToast('먼저 기본정보 탭에서 등록해주세요.', 'error');
        return;
      }

      if (tabId === 'info') {
        Object.keys(errors).forEach(k => delete errors[k]);
        try { await schema.validate(form, { abortEarly: false }); }
        catch (err) { err.inner.forEach(e => { errors[e.path] = e.message; }); showToast('입력 내용을 확인해주세요.', 'error'); return; }

        const isCreate = !cfHasId.value;
        const ok = await showConfirm(isCreate ? '등록' : '저장', isCreate ? '등록하시겠습니까?' : '저장하시겠습니까?');
        if (!ok) return;
        try {
          const payload = { ...form };
          // UI 단일 condVal → Entity minOrderQty / minOrderAmt 매핑
          if (form.giftTypeCd === '수량조건') { payload.minOrderQty = form.condVal; }
          else { payload.minOrderAmt = form.condVal; }
          const res = isCreate
            ? await boApiSvc.pmGift.create(payload, '선물관리', '등록')
            : await boApiSvc.pmGift.update(cfCurId.value, payload, '선물관리', '기본정보저장');
          if (isCreate) {
            const newId = res.data?.data?.giftId || res.data?.giftId || null;
            if (newId) form.giftId = newId;
          }
          _afterApiOk(res, isCreate ? '등록되었습니다. 다른 탭을 저장할 수 있습니다.' : '저장되었습니다.');
        } catch (err) { _afterApiErr(err); }
        return;
      }

      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;
      let payload = null;
      switch (tabId) {
        case 'visibility': payload = { visibilityTargets: form.visibilityTargets }; break;
        default:           payload = {}; break;
      }
      try {
        const res = await boApiSvc.pmGift.update(cfCurId.value, payload, '선물관리', `${tabId}저장`);
        _afterApiOk(res, '저장되었습니다.');
      } catch (err) { _afterApiErr(err); }
    };

    const showVendorModal = Vue.toRef(uiState, 'showVendorModal');

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfIsView = computed(() => props.dtlMode === 'view');

    // -- return ---------------------------------------------------------------

    return { uiState, codes, cfIsNew, cfHasId, cfSaveDisabled, tab, form, errors, showTab, cfIsView, tabMode2, handleSave, cfVisibilityOptions, hasVisibility, toggleVisibility, cfCondValLabel, cfSelectedVendorNm, selectVendor };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ cfIsNew ? '사은품 등록' : '사은품 수정' }}<span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.giftId }}</span></div>
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:tab==='info'}" :disabled="tabMode2!=='tab'" @click="tab='info'">📋 기본정보</button>
      <button class="tab-btn" :class="{active:tab==='visibility'}" :disabled="tabMode2!=='tab'" @click="tab='visibility'">🔒 공개대상</button>
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
        <label class="form-label">사은품명 <span class="req">*</span></label>
        <input class="form-control" v-model="form.giftNm" placeholder="사은품명 입력" :class="errors.giftNm ? 'is-invalid' : ''" />
        <span v-if="errors.giftNm" class="field-error">{{ errors.giftNm }}</span>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">조건유형</label>
          <select class="form-control" v-model="form.giftTypeCd">
            <option v-for="c in codes.gift_cond_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
          </select>
        </div>
        <div class="form-group" v-if="form.giftTypeCd !== '무조건'">
          <label class="form-label">{{ cfCondValLabel }}</label>
          <input class="form-control" type="number" v-model.number="form.condVal" placeholder="0" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">재고 <span class="req">*</span></label>
          <input class="form-control" type="number" v-model.number="form.giftStock" placeholder="0" :class="errors.giftStock ? 'is-invalid' : ''" />
          <span v-if="errors.giftStock" class="field-error">{{ errors.giftStock }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" v-model="form.giftStatusCd">
            <option v-for="c in codes.gift_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
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
        <textarea class="form-control" v-model="form.giftDesc" rows="2" placeholder="비고 입력"></textarea>
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
          <input class="form-control" v-model="form.chargeStaff" placeholder="담당자명 입력" :readonly="cfIsView" />
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
      <div class="form-actions" v-if="!cfIsView">
        <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleSave">저장</button>
        <button class="btn btn-secondary" @click="navigate('pmGiftMng')">취소</button>
      </div>
    </div>

    <!-- -- 공개대상 --------------------------------------------------------- -->
    <div class="card" v-show="showTab('visibility')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🔒 공개대상</div>
      <div style="font-size:12px;font-weight:700;color:#888;margin-bottom:8px;">하나라도 해당하면 노출</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        <label v-for="opt in cfVisibilityOptions" :key="opt?.codeValue"
          :style="{display:'inline-flex',alignItems:'center',gap:'6px',padding:'5px 10px',borderRadius:'14px',border:'1px solid '+(hasVisibility(opt.codeValue)?'#1565c0':'#ddd'),background:hasVisibility(opt.codeValue)?'#e3f2fd':'#fafafa',color:hasVisibility(opt.codeValue)?'#1565c0':'#666',fontSize:'12px',fontWeight:hasVisibility(opt.codeValue)?700:500,cursor:'pointer'}">
          <input type="checkbox" :checked="hasVisibility(opt.codeValue)" @change="toggleVisibility(opt.codeValue)" style="accent-color:#1565c0;" />
          {{ opt.codeLabel }}
        </label>
      </div>
      <div class="form-actions" v-if="!cfIsView">
        <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleSave">저장</button>
        <button class="btn btn-secondary" @click="navigate('pmGiftMng')">취소</button>
      </div>
    </div>

    <!-- -- 미리보기 --------------------------------------------------------- -->
    <div class="card" v-show="showTab('preview')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">👁 미리보기</div>
      <div style="background:#f9f9f9;border-radius:10px;padding:20px;border:1px solid #e8e8e8;max-width:600px;">
        <div style="font-size:18px;font-weight:700;margin-bottom:12px;color:#1a1a2e;">🎁 {{ form.giftNm || '사은품명' }}</div>
        <div style="font-size:12px;color:#aaa;margin-bottom:16px;">{{ form.startDate }} ~ {{ form.endDate }}</div>
        <div style="background:#fff;padding:12px;border-radius:6px;margin-bottom:12px;border-left:4px solid #f59e0b;">
          <div style="font-size:13px;color:#666;margin-bottom:4px;">조건: <span style="font-weight:700;color:#f59e0b;">{{ form.giftTypeCd }}</span></div>
          <div v-if="form.giftTypeCd !== '무조건'" style="font-size:13px;color:#666;margin-bottom:4px;">조건값: <span style="font-weight:700;">{{ form.giftTypeCd === '금액조건' ? (form.condVal||0).toLocaleString() + '원↑' : form.giftTypeCd === '수량조건' ? (form.condVal||0) + '개↑' : form.condVal||0 }}</span></div>
          <div style="font-size:13px;color:#666;margin-bottom:4px;">재고: <span style="font-weight:700;">{{ (form.giftStock||0).toLocaleString() }}개</span></div>
          <div style="font-size:13px;color:#666;">상태: <span style="font-weight:700;">{{ form.giftStatusCd }}</span></div>
        </div>
        <button class="btn btn-primary" @click="showToast('사은품을 확인하였습니다.', 'success')">사은품 확인</button>
      </div>
    </div>
  </div>
</div>
`
};
