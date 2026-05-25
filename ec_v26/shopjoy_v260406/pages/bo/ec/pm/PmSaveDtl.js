/* ShopJoy Admin - 판촉마일리지 상세/등록 */
window._pmSaveDtlState = window._pmSaveDtlState || { tab: 'info', tabMode: 'tab' };
window.PmSaveDtl = {
  name: 'PmSaveDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 ################################################## */
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const vendors = reactive([]);
    const uiState = reactive({ loading: false, showVendorModal: false, error: null, isPageCodeLoad: false, tab: window._pmSaveDtlState.tab || 'info', tabMode2: window._pmSaveDtlState.tabMode || 'tab'});
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({ save_issue_types: [], save_units: [], promo_statuses: [] });

    // 단건 조회
    /* loadVendors — 로드 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PmSaveDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장
      if (cmd === 'form-save') {
        return handleSave();
      // 폼 취소 (목록으로)
      } else if (cmd === 'form-cancel') {
        return props.navigate('pmSaveMng');
      // 탭 전환
      } else if (cmd === 'tab-select') {
        uiState.tab = param;
        return;
      // 뷰모드 변경
      } else if (cmd === 'tab-mode') {
        uiState.tabMode2 = param;
        return;
      // 판매업체 모달 열기
      } else if (cmd === 'vendorModal-open') {
        uiState.showVendorModal = true;
        return;
      // 판매업체 모달 닫기
      } else if (cmd === 'vendorModal-close') {
        uiState.showVendorModal = false;
        return;
      // 판매업체 초기화
      } else if (cmd === 'form-vendorClear') {
        form.vendorId = '';
        form.chargeStaff = '';
        return;
      // 공개대상 토글
      } else if (cmd === 'form-visibilityToggle') {
        return toggleVisibility(param);
      // 미리보기 확인 토스트
      } else if (cmd === 'form-previewConfirm') {
        showToast('마일리지를 확인하였습니다.', 'success');
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PmSaveDtl.js : handleSelectAction -> ', cmd, param);
      // 판매업체 선택
      if (cmd === 'vendorModal-select') {
        return selectVendor(param.vendorId, param.vendorNm);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const loadVendors = async () => {
      try {
        const _vr = await boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 10000 }, '관리', '조회');
        vendors.splice(0, vendors.length, ...(_vr.data?.data?.pageList || _vr.data?.data?.list || []));
      } catch (e) { console.warn('[PmSaveDtl.js] vendor load failed', e); }
    };

    /* handleSearchDetail — 처리 */
    const handleSearchDetail = async () => {
      await loadVendors();
      if (cfIsNew.value) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.pmSave.getById(props.dtlId, '적립금관리', '상세조회');
        const s = res.data?.data || res.data;
        if (s) { Object.assign(form, s); }
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    const cfIsNew = computed(() => !props.dtlId);

watch(() => uiState.tab, v => { window._pmSaveDtlState.tab = v; });

        watch(() => uiState.tabMode2, v => { window._pmSaveDtlState.tabMode = v; });

    /* showTab — 표시 */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;

    /* 적립금 fnLoadCodes */
    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.save_issue_types = codeStore.sgGetGrpCodes('SAVE_ISSUE_TYPE');
      codes.save_units = codeStore.sgGetGrpCodes('SAVE_UNIT');
      codes.promo_statuses = codeStore.sgGetGrpCodes('PROMO_STATUS');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    const _today = new Date();

    /* _pad — 패딩 */
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END   = `${_today.getFullYear()+1}-12-31`;

    const form = reactive({
      saveId: null, saveNm: '', saveType: '구매적립', saveVal: 0, saveUnit: '원',
      saveStatus: '활성', startDate: DEFAULT_START, endDate: DEFAULT_END,
      expireDay: 365, minOrderAmt: 0, remark: '',
      visibilityTargets: '^PUBLIC^',
      vendorId: '', chargeStaff: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      saveNm: yup.string().required('마일리지명을 입력해주세요.'),
      saveVal: yup.number().min(0, '적립값은 0 이상이어야 합니다.').required('적립값을 입력해주세요.'),
    });

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
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
      if (!form.vendorId) { return '소속업체 선택'; }
      const v = vendors.find(x => x.vendorId === form.vendorId);
      return v ? v.vendorNm : '소속업체 선택';
    });

    /* selectVendor — 선택 */
    const selectVendor = (vendorId, vendorNm) => {
      form.vendorId = vendorId;
      uiState.showVendorModal = false;
    };

    const cfCurId       = computed(() => props.dtlId || form.saveId || null);
    const cfHasId       = computed(() => !!cfCurId.value);
    const cfSaveDisabled = computed(() => uiState.tab !== 'info' && !cfHasId.value);

    /* _afterApiOk — 후 API 성공 */
    const _afterApiOk  = (res, msg) => {
      if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
      if (showToast) { showToast(msg, 'success'); }
    };

    /* _afterApiErr — 후 API 오류 */
    const _afterApiErr = (err) => {
      console.error('[handleSave]', err);
      const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
      if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
      if (showToast) { showToast(errMsg, 'error', 0); }
    };

    /* 적립금 저장 */
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
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
        if (!ok) { return; }
        try {
          const payload = { ...form };
          const res = isCreate
            ? await boApiSvc.pmSave.create(payload, '적립금관리', '등록')
            : await boApiSvc.pmSave.update(cfCurId.value, payload, '적립금관리', '기본정보저장');
          if (isCreate) {
            const newId = res.data?.data?.saveId || res.data?.saveId || null;
            if (newId) { form.saveId = newId; }
          }
          _afterApiOk(res, isCreate ? '등록되었습니다. 다른 탭을 저장할 수 있습니다.' : '저장되었습니다.');
        } catch (err) { _afterApiErr(err); }
        return;
      }

      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) { return; }
      let payload = null;
      switch (tabId) {
        case 'visibility': payload = { visibilityTargets: form.visibilityTargets }; break;
        default:           payload = {}; break;
      }
      try {
        const res = await boApiSvc.pmSave.update(cfCurId.value, payload, '적립금관리', `${tabId}저장`);
        _afterApiOk(res, '저장되었습니다.');
      } catch (err) { _afterApiErr(err); }
    };

    const showVendorModal = Vue.toRef(uiState, 'showVendorModal');

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');
    // ===== 폼 컬럼 정의 (BoFormArea :columns) - info 탭 ======================
    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // --- [컬럼 정의] ---
    const infoFormColumns = [
      { key: 'saveNm',      label: '마일리지명', type: 'text', required: true,
        placeholder: '마일리지명 입력', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'saveType',    label: '적립유형', type: 'select', options: () => codes.save_issue_types },
      { key: 'saveVal',     label: '적립값', type: 'number', required: true, placeholder: '적립값 입력' },
      { type: 'rowBreak' },
      { key: 'saveUnit',    label: '적립단위', type: 'select', options: () => codes.save_units },
      { key: 'expireDay',   label: '유효기간 (일)', type: 'number', placeholder: '365' },
      { type: 'rowBreak' },
      { key: 'minOrderAmt', label: '최소주문금액 (원)', type: 'number', placeholder: '0' },
      { key: 'saveStatus',  label: '상태', type: 'select', options: () => codes.promo_statuses },
      { type: 'rowBreak' },
      { key: 'startDate',   label: '시작일', type: 'date' },
      { key: 'endDate',     label: '종료일', type: 'date' },
      { type: 'rowBreak' },
      { key: 'remark',      label: '비고', type: 'textarea', rows: 2, placeholder: '비고 입력', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'vendorId',    label: '판매업체', type: 'slot', name: 'vendor' },
      { key: 'chargeStaff', label: '판매담당자', type: 'text', placeholder: '담당자명 입력' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      vendors, showVendorModal, uiState, codes, form, errors,                       // 상태 / 데이터
      infoFormColumns,                                                              // 컬럼 정의
      handleBtnAction, handleSelectAction,                                          // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfHasId, cfSaveDisabled, cfDtlMode, cfVisibilityOptions, cfSelectedVendorNm, // computed
      tab, tabMode2,                                                                // toRef
      showTab, hasVisibility,                                                       // 헬퍼
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    {{ cfIsNew ? '마일리지 등록' : '마일리지 수정' }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">
      #{{ form.saveId }}
    </span>
  </div>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 탭 영역 ==================================================== -->
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:tab==='info'}" :disabled="tabMode2!=='tab'" @click="handleBtnAction('tab-select', 'info')">
        📋 기본정보
      </button>
      <button class="tab-btn" :class="{active:tab==='visibility'}" :disabled="tabMode2!=='tab'" @click="handleBtnAction('tab-select', 'visibility')">
        🔒 공개대상
      </button>
      <button class="tab-btn" :class="{active:tab==='preview'}" :disabled="tabMode2!=='tab'" @click="handleBtnAction('tab-select', 'preview')">
        👁 미리보기
      </button>
    </div>
    <div class="tab-modes">
      <button class="tab-mode-btn" :class="{active:tabMode2==='tab'}" @click="handleBtnAction('tab-mode', 'tab')" title="탭">
        📑
      </button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='1col'}" @click="handleBtnAction('tab-mode', '1col')" title="1열">
        1▭
      </button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='2col'}" @click="handleBtnAction('tab-mode', '2col')" title="2열">
        2▭
      </button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='3col'}" @click="handleBtnAction('tab-mode', '3col')" title="3열">
        3▭
      </button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='4col'}" @click="handleBtnAction('tab-mode', '4col')" title="4열">
        4▭
      </button>
    </div>
  </div>
  <!-- ===== □. 탭 영역 ==================================================== -->
  <!-- ===== ■. 탭 컨텐츠 =================================================== -->
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">
    <!-- ===== ■.■. 기본정보 탭 (BoFormArea 자동 렌더) ============================= -->
    <div class="card" v-show="showTab('info')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        📋 기본정보
      </div>
      <!-- ===== ■.■.■. 폼 영역 ================================================ -->
      <bo-form-area :columns="infoFormColumns" :form="form" :errors="errors"
        :readonly="cfDtlMode" :cols="2" :show-actions="false">
        <!-- ===== ■.■.■.■. 판매업체 picker ======================================= -->
        <template #vendor>
          <div style="display:flex;gap:8px;align-items:center;">
            <div class="form-control" style="background:#f9f9f9;cursor:pointer;padding:0;display:flex;align-items:center;" @click="handleBtnAction('vendorModal-open')">
              <span style="padding:8px 12px;flex:1;">
                {{ cfSelectedVendorNm }}
              </span>
              <span style="padding:8px 12px;color:#999;font-size:12px;">
                ▼
              </span>
            </div>
            <button v-if="form.vendorId" class="btn btn-sm" style="padding:0 12px;color:#666;" @click="handleBtnAction('form-vendorClear')">
              초기화
            </button>
          </div>
        </template>
      </bo-form-area>
      <!-- ===== ■.■.■. 판매업체 선택 모달 ========================================== -->
      <simple-vendor-pick-modal :show="showVendorModal" :vendors="vendors" :selected-id="form.vendorId"
        @select="v => handleSelectAction('vendorModal-select', v)" @close="handleBtnAction('vendorModal-close')" />
      <div class="form-actions" v-if="!cfDtlMode">
        <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleBtnAction('form-save')">
          저장
        </button>
        <button class="btn btn-secondary" @click="handleBtnAction('form-cancel')">
          취소
        </button>
      </div>
    </div>
    <!-- ===== □.□. 기본정보 탭 (BoFormArea 자동 렌더) ============================= -->
    <!-- ===== ■.■. 공개대상 ================================================== -->
    <div class="card" v-show="showTab('visibility')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        🔒 공개대상
      </div>
      <div style="font-size:12px;font-weight:700;color:#888;margin-bottom:8px;">
        하나라도 해당하면 노출
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        <label v-for="opt in cfVisibilityOptions" :key="opt?.codeValue"
          :style="{display:'inline-flex',alignItems:'center',gap:'6px',padding:'5px 10px',borderRadius:'14px',border:'1px solid '+(hasVisibility(opt.codeValue)?'#1565c0':'#ddd'),background:hasVisibility(opt.codeValue)?'#e3f2fd':'#fafafa',color:hasVisibility(opt.codeValue)?'#1565c0':'#666',fontSize:'12px',fontWeight:hasVisibility(opt.codeValue)?700:500,cursor:'pointer'}">
          <input type="checkbox" :checked="hasVisibility(opt.codeValue)" @change="handleBtnAction('form-visibilityToggle', opt.codeValue)" style="accent-color:#1565c0;" />
          {{ opt.codeLabel }}
        </label>
      </div>
      <div class="form-actions" v-if="!cfDtlMode">
        <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleBtnAction('form-save')">
          저장
        </button>
        <button class="btn btn-secondary" @click="handleBtnAction('form-cancel')">
          취소
        </button>
      </div>
    </div>
    <!-- ===== □.□. 공개대상 ================================================== -->
    <!-- ===== ■.■. 미리보기 ================================================== -->
    <div class="card" v-show="showTab('preview')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        👁 미리보기
      </div>
      <div style="background:#f9f9f9;border-radius:10px;padding:20px;border:1px solid #e8e8e8;max-width:600px;">
        <div style="font-size:18px;font-weight:700;margin-bottom:12px;color:#1a1a2e;">
          {{ form.saveNm || '마일리지명' }}
        </div>
        <div style="font-size:12px;color:#aaa;margin-bottom:16px;">
          {{ form.startDate }} ~ {{ form.endDate }}
        </div>
        <div style="background:#fff;padding:12px;border-radius:6px;margin-bottom:12px;border-left:4px solid #10b981;">
          <div style="font-size:13px;color:#666;margin-bottom:4px;">
            적립유형:
            <span style="font-weight:700;color:#10b981;">
              {{ form.saveType }}
            </span>
          </div>
          <div style="font-size:13px;color:#666;margin-bottom:4px;">
            적립값:
            <span style="font-weight:700;color:#10b981;">
              {{ (form.saveVal||0).toLocaleString() }} {{ form.saveUnit || '원' }}
            </span>
          </div>
          <div style="font-size:13px;color:#666;margin-bottom:4px;">
            유효기간:
            <span style="font-weight:700;">
              {{ form.expireDay || 365 }}일
            </span>
          </div>
          <div style="font-size:13px;color:#666;">
            최소주문금액:
            <span style="font-weight:700;">
              {{ (form.minOrderAmt||0).toLocaleString() }}원
            </span>
          </div>
        </div>
        <button class="btn btn-primary" @click="handleBtnAction('form-previewConfirm')">
          마일리지 확인
        </button>
      </div>
    </div>
  </div>
</div>
<!-- ===== □.□. 미리보기 ================================================== -->
<!-- ===== □. 탭 컨텐츠 =================================================== -->
`
};
