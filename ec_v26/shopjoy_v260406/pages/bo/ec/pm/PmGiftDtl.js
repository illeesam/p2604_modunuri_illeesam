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
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const vendors = reactive([]);
    const uiState = reactive({ loading: false, showVendorModal: false, error: null, isPageCodeLoad: false, tab: window._pmGiftDtlState.tab || 'info', tabMode2: window._pmGiftDtlState.tabMode || 'tab'});
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({ gift_cond_types: [], gift_statuses: [] });

    // 단건 조회
    /* loadVendors — 로드 */
    const loadVendors = async () => {
      try {
        const _vr = await boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 10000 }, '관리', '조회');
        vendors.splice(0, vendors.length, ...(_vr.data?.data?.pageList || _vr.data?.data?.list || []));
      } catch (e) { console.warn('[PmGiftDtl.js] vendor load failed', e); }
    };

    /* handleSearchDetail — 처리 */
    const handleSearchDetail = async () => {
      await loadVendors();
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

    /* showTab — 표시 */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;

    /* 사은품 fnLoadCodes */
    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.gift_cond_types = codeStore.sgGetGrpCodes('GIFT_COND_KR');
      codes.gift_statuses = codeStore.sgGetGrpCodes('GIFT_STATUS');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    const _today = new Date();

    /* _pad — 패딩 */
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
      await handleSearchDetail();
    });

    const cfVisibilityOptions = computed(() => window.visibilityUtil.allOptions());

    /* hasVisibility — 여부 확인 */
    const hasVisibility = (code) => window.visibilityUtil.has(form.visibilityTargets, code);

    /* toggleVisibility — 토글 */
    const toggleVisibility = (code) => {
      const list = window.visibilityUtil.parse(form.visibilityTargets);
      const i = list.indexOf(code);
      if (i >= 0) list.splice(i, 1); else list.push(code);
      form.visibilityTargets = window.visibilityUtil.serialize(list);
    };

    const cfSelectedVendorNm = computed(() => {
      if (!form.vendorId) return '소속업체 선택';
      const v = vendors.find(x => x.vendorId === form.vendorId);
      return v ? v.vendorNm : '소속업체 선택';
    });

    /* selectVendor — 선택 */
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

    /* _afterApiOk — 후 API 성공 */
    const _afterApiOk  = (res, msg) => {
      if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
      if (showToast) showToast(msg, 'success');
    };

    /* _afterApiErr — 후 API 오류 */
    const _afterApiErr = (err) => {
      console.error('[handleSave]', err);
      const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
      if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
      if (showToast) showToast(errMsg, 'error', 0);
    };

    /* ── 탭별 저장: info=신규/전체저장, visibility=공개대상만 부분 PUT ── */
    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* handleSave — 저장 */
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

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - info 탭 ======================
    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================

    // --- [컬럼 정의] ---
    const infoFormColumns = [
      { key: 'giftNm',       label: '사은품명', type: 'text', required: true,
        placeholder: '사은품명 입력', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'giftTypeCd',   label: '조건유형', type: 'select', options: () => codes.gift_cond_types },
      { key: 'condVal',      label: '조건값', type: 'number', placeholder: '0',
        visible: (f) => f.giftTypeCd !== '무조건',
        hint: '조건유형에 따라 단위(수량/금액) 입력' },
      { type: 'rowBreak' },
      { key: 'giftStock',    label: '재고', type: 'number', required: true, placeholder: '0' },
      { key: 'giftStatusCd', label: '상태', type: 'select', options: () => codes.gift_statuses },
      { type: 'rowBreak' },
      { key: 'startDate',    label: '시작일', type: 'date' },
      { key: 'endDate',      label: '종료일', type: 'date' },
      { type: 'rowBreak' },
      { key: 'giftDesc',     label: '비고', type: 'textarea', rows: 2, placeholder: '비고 입력', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'vendorId',     label: '판매업체', type: 'slot', name: 'vendor' },
      { key: 'chargeStaff',  label: '판매담당자', type: 'text', placeholder: '담당자명 입력' },
    ];

    // ===== return (템플릿 노출) ===============================================


    return { vendors, showVendorModal, uiState, codes, cfIsNew, cfHasId, cfSaveDisabled, tab, form, errors, showTab, cfIsView, tabMode2, handleSave, cfVisibilityOptions, hasVisibility, toggleVisibility, cfCondValLabel, cfSelectedVendorNm, selectVendor, infoFormColumns };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    {{ cfIsNew ? '사은품 등록' : '사은품 수정' }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.giftId }}</span>
  </div>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 탭 영역 ==================================================== -->
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
  <!-- ===== □. 탭 영역 ==================================================== -->
  <!-- ===== ■. 탭 컨텐츠 =================================================== -->
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">
    <!-- ===== ■.■. 기본정보 탭 (BoFormArea 자동 렌더) ============================= -->
    <div class="card" v-show="showTab('info')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📋 기본정보</div>
      <!-- ===== ■.■.■. 폼 영역 ================================================ -->
      <bo-form-area :columns="infoFormColumns" :form="form" :errors="errors"
        :readonly="cfIsView" :cols="2" :show-actions="false">
        <!-- ===== ■.■.■.■. 판매업체 picker ======================================= -->
        <template #vendor>
          <div style="display:flex;gap:8px;align-items:center;">
            <div class="form-control" style="background:#f9f9f9;cursor:pointer;padding:0;display:flex;align-items:center;" @click="showVendorModal=true">
              <span style="padding:8px 12px;flex:1;">{{ cfSelectedVendorNm }}</span>
              <span style="padding:8px 12px;color:#999;font-size:12px;">▼</span>
            </div>
            <button v-if="form.vendorId" class="btn btn-sm" style="padding:0 12px;color:#666;" @click="form.vendorId='';form.chargeStaff=''">
              초기화
            </button>
          </div>
        </template>
      </bo-form-area>
      <!-- ===== ■.■.■. 판매업체 선택 모달 ========================================== -->
      <simple-vendor-pick-modal :show="showVendorModal" :vendors="vendors" :selected-id="form.vendorId"
        @select="v => selectVendor(v.vendorId, v.vendorNm)" @close="showVendorModal=false" />
      <div class="form-actions" v-if="!cfIsView">
        <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleSave">
          저장
        </button>
        <button class="btn btn-secondary" @click="navigate('pmGiftMng')">취소</button>
      </div>
    </div>
    <!-- ===== □.□. 기본정보 탭 (BoFormArea 자동 렌더) ============================= -->
    <!-- ===== ■.■. 공개대상 ================================================== -->
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
        <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleSave">
          저장
        </button>
        <button class="btn btn-secondary" @click="navigate('pmGiftMng')">취소</button>
      </div>
    </div>
    <!-- ===== □.□. 공개대상 ================================================== -->
    <!-- ===== ■.■. 미리보기 ================================================== -->
    <div class="card" v-show="showTab('preview')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">👁 미리보기</div>
      <div style="background:#f9f9f9;border-radius:10px;padding:20px;border:1px solid #e8e8e8;max-width:600px;">
        <div style="font-size:18px;font-weight:700;margin-bottom:12px;color:#1a1a2e;">🎁 {{ form.giftNm || '사은품명' }}</div>
        <div style="font-size:12px;color:#aaa;margin-bottom:16px;">{{ form.startDate }} ~ {{ form.endDate }}</div>
        <div style="background:#fff;padding:12px;border-radius:6px;margin-bottom:12px;border-left:4px solid #f59e0b;">
          <div style="font-size:13px;color:#666;margin-bottom:4px;">
            조건:
            <span style="font-weight:700;color:#f59e0b;">{{ form.giftTypeCd }}</span>
          </div>
          <div v-if="form.giftTypeCd !== '무조건'" style="font-size:13px;color:#666;margin-bottom:4px;">
            조건값:
            <span style="font-weight:700;">
              {{ form.giftTypeCd === '금액조건' ? (form.condVal||0).toLocaleString() + '원↑' : form.giftTypeCd === '수량조건' ? (form.condVal||0) + '개↑' : form.condVal||0 }}
            </span>
          </div>
          <div style="font-size:13px;color:#666;margin-bottom:4px;">
            재고:
            <span style="font-weight:700;">{{ (form.giftStock||0).toLocaleString() }}개</span>
          </div>
          <div style="font-size:13px;color:#666;">상태: <span style="font-weight:700;">{{ form.giftStatusCd }}</span></div>
        </div>
        <button class="btn btn-primary" @click="showToast('사은품을 확인하였습니다.', 'success')">사은품 확인</button>
      </div>
    </div>
  </div>
</div>

    <!-- ===== □.□. 미리보기 ================================================== -->
  <!-- ===== □. 탭 컨텐츠 =================================================== -->`
};
