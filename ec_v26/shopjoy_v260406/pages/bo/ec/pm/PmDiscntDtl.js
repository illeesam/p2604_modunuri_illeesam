/* ShopJoy Admin - 판촉할인 상세/등록 */
window._pmDiscntDtlState = window._pmDiscntDtlState || { tab: 'info', tabMode: 'tab' };
window.PmDiscntDtl = {
  name: 'PmDiscntDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const vendors = reactive([]);
    const uiState = reactive({ loading: false, showVendorModal: false, error: null, isPageCodeLoad: false, tab: window._pmDiscntDtlState.tab || 'info', tabMode2: window._pmDiscntDtlState.tabMode || 'tab'});
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({ discnt_types: [], promo_statuses: [], discnt_apply_targets: [] });

    const _today = new Date();

    /* _pad — 패딩 */
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END   = `${_today.getFullYear()+1}-12-31`;

    const form = reactive({
      discntId: null, discntNm: '', discntTypeCd: '정률', discntValue: 0,
      discntStatusCd: '활성', startDate: DEFAULT_START, endDate: DEFAULT_END,
      discntTargetCd: '전체상품', minOrderAmt: 0, maxDiscntAmt: 0, discntDesc: '',
      visibilityTargets: '^PUBLIC^',
      vendorId: '', chargeStaff: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      discntNm: yup.string().required('할인명을 입력해주세요.'),
      discntValue: yup.number().min(0, '할인값은 0 이상이어야 합니다.').required('할인값을 입력해주세요.'),
    });

    const cfIsNew = computed(() => !props.dtlId);
    const cfCurId       = computed(() => props.dtlId || form.discntId || null);
    const cfHasId       = computed(() => !!cfCurId.value);
    const cfSaveDisabled = computed(() => uiState.tab !== 'info' && !cfHasId.value);

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PmDiscntDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장
      if (cmd === 'form-save') {
        return handleSave();
      // 폼 취소 (목록으로)
      } else if (cmd === 'form-cancel') {
        return props.navigate('pmDiscntMng');
      // 탭 전환
      } else if (cmd === 'tab-select') {
        uiState.tab = param;
        return;
      // 뷰모드 변경
      } else if (cmd === 'tab-mode') {
        uiState.tabMode2 = param;
        return;
      // 공개대상 토글
      } else if (cmd === 'form-visibilityToggle') {
        return toggleVisibility(param);
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
      // 미리보기 토스트 (할인 확인)
      } else if (cmd === 'preview-confirm') {
        showToast('할인을 확인하였습니다.', 'success');
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PmDiscntDtl.js : handleSelectAction -> ', cmd, param);
      // 판매업체 선택
      if (cmd === 'vendorModal-select') {
        return selectVendor(param.vendorId, param.vendorNm);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };


    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ PmDiscntDtl : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'vendor-pick') {
        if (result == null) {
            uiState.showVendorModal = false;
            return;
        }
        return selectVendor(result.vendorId, result.vendorNm);
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };
    // 단건 조회
    /* loadVendors — 로드 */
    const loadVendors = async () => {
      try {
        const _vr = await boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 10000 }, '관리', '조회');
        vendors.splice(0, vendors.length, ...(_vr.data?.data?.pageList || _vr.data?.data?.list || []));
      } catch (e) { console.warn('[PmDiscntDtl.js] vendor load failed', e); }
    };

    /* handleSearchDetail — 처리 */
    const handleSearchDetail = async () => {
      await loadVendors();
      if (cfIsNew.value) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.pmDiscnt.getById(props.dtlId, '할인관리', '상세조회');
        const d = res.data?.data || res.data;
        if (d) { Object.assign(form, d); }
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    watch(() => uiState.tab, v => { window._pmDiscntDtlState.tab = v; });
    watch(() => uiState.tabMode2, v => { window._pmDiscntDtlState.tabMode = v; });

    /* showTab — 표시 */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;


    /* tabs — 탭 정의 (BoTabBar 데이터, reactive) */
    const tabs = reactive([
      { id: 'info', label: '기본정보', icon: '📋' },
      { id: 'detail', label: '상세정보', icon: '📋' },
      { id: 'target', label: '적용대상', icon: '🎯' },
      { id: 'preview', label: '미리보기', icon: '👁' },
    ]);
    /* 할인 fnLoadCodes */
    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ################################# */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.discnt_types = codeStore.sgGetGrpCodes('DISCNT_TYPE_KR');
      codes.promo_statuses = codeStore.sgGetGrpCodes('PROMO_STATUS');
      codes.discnt_apply_targets = codeStore.sgGetGrpCodes('DISCNT_APPLY_TARGET');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

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

    /* ── 탭별 저장: info/detail 은 form 전체, target 은 적용대상/공개대상만 부분 PUT ── */
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* handleSave — 저장 */
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
        if (!ok) { return; }
        try {
          const payload = { ...form };
          const res = isCreate
            ? await boApiSvc.pmDiscnt.create(payload, '할인관리', '등록')
            : await boApiSvc.pmDiscnt.update(cfCurId.value, payload, '할인관리', tabId === 'info' ? '기본정보저장' : '상세정보저장');
          if (isCreate) {
            const newId = res.data?.data?.discntId || res.data?.discntId || null;
            if (newId) { form.discntId = newId; }
          }
          _afterApiOk(res, isCreate ? '등록되었습니다. 다른 탭을 저장할 수 있습니다.' : '저장되었습니다.');
        } catch (err) { _afterApiErr(err); }
        return;
      }

      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) { return; }
      let payload = null;
      switch (tabId) {
        case 'target':  payload = { discntTargetCd: form.discntTargetCd, visibilityTargets: form.visibilityTargets }; break;
        default:        payload = {}; break;
      }
      try {
        const res = await boApiSvc.pmDiscnt.update(cfCurId.value, payload, '할인관리', `${tabId}저장`);
        _afterApiOk(res, '저장되었습니다.');
      } catch (err) { _afterApiErr(err); }
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

    const showVendorModal = Vue.toRef(uiState, 'showVendorModal');

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // ===== 폼 컬럼 정의 (BoFormArea :columns) - info 탭 ======================
    // 정보 영역 폼
    const infoFormColumns = [
      { key: 'discntNm',     label: '할인명', type: 'text', required: true,
        placeholder: '할인명 입력' },
      { key: 'discntTypeCd', label: '할인유형', type: 'select', options: () => codes.discnt_types },
      { key: 'discntValue',  label: '할인값', type: 'number', required: true },
      { key: 'vendorId',     label: '판매업체', type: 'slot', name: 'vendor' },
      { key: 'chargeStaff',  label: '판매담당자', type: 'text', placeholder: '담당자명 입력' },
    ];

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - detail 탭 할인적용/기간설정 ===
    // 할인 적용 폼
    const discntApplyFormColumns = [
      { key: 'minOrderAmt',  label: '최소주문금액 (원)', type: 'number', placeholder: '0' },
      { key: 'maxDiscntAmt', label: '최대할인금액 (원)', type: 'number', placeholder: '0 = 무제한' },
    ];
    // 할인 기간 폼
    const discntPeriodFormColumns = [
      { key: 'startDate', label: '시작일', type: 'date' },
      { key: 'endDate',   label: '종료일', type: 'date' },
    ];
    // 상태/비고
    const discntStatusFormColumns = [
      { key: 'discntStatusCd', label: '상태', type: 'select', options: () => codes.promo_statuses },
      { key: 'discntDesc',     label: '비고', type: 'textarea', rows: 2, placeholder: '비고 입력' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      vendors, uiState, codes, form, errors,                                          // 상태 / 데이터
      infoFormColumns, discntApplyFormColumns, discntPeriodFormColumns, discntStatusFormColumns, // 폼 컬럼 정의
      handleBtnAction, handleSelectAction, fnCallbackModal,                                            // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfHasId, cfSaveDisabled, cfDtlMode, cfVisibilityOptions, cfSelectedVendorNm, // computed
      tab, tabMode2, showVendorModal,                                                 // toRef
      showTab, hasVisibility,                                                          // 헬퍼
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    {{ cfIsNew ? '할인 등록' : '할인 수정' }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">
      #{{ form.discntId }}
    </span>
  </div>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 탭 영역 ==================================================== -->
  <bo-tab-bar :tabs="tabs" :tab="tab" :tab-mode="tabMode2"
    @tab-select="id => handleBtnAction('tab-select', id)"
    @mode-select="m => handleBtnAction('tab-mode', m)" />
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
        :readonly="cfDtlMode" :cols="3" :show-actions="false">
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
      <simple-vendor-pick-modal :show="showVendorModal" :vendors="vendors" :selected-id="form.vendorId" modal-name="vendor-pick" :on-callback="fnCallbackModal" />
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
    <!-- ===== ■.■. 상세정보 ================================================== -->
    <div class="card" v-show="showTab('detail')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        📋 상세정보
      </div>
      <!-- ===== ■.■.■. 공개대상 ================================================ -->
      <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e8e8e8;">
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;">
          🔒 공개대상
        </h3>
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
      </div>
      <!-- ===== ■.■.■. 할인적용 (BoFormArea 자동 렌더) ============================= -->
      <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e8e8e8;">
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;">
          💰 할인적용
        </h3>
        <!-- ===== ■.■.■.■. 폼 영역 ============================================== -->
        <bo-form-area :columns="discntApplyFormColumns" :form="form" :errors="errors"
          :cols="3" :show-actions="false" />
      </div>
      <!-- ===== ■.■.■. 기간설정 (BoFormArea 자동 렌더) ============================= -->
      <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e8e8e8;">
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;">
          📅 기간설정
        </h3>
        <!-- ===== ■.■.■.■. 폼 영역 ============================================== -->
        <bo-form-area :columns="discntPeriodFormColumns" :form="form" :errors="errors"
          :cols="3" :show-actions="false" />
      </div>
      <!-- ===== ■.■.■. 상태 및 비고 (BoFormArea 자동 렌더) ========================== -->
      <div>
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;">
          ⚙️ 상태 및 비고
        </h3>
        <!-- ===== ■.■.■.■. 폼 영역 ============================================== -->
        <bo-form-area :columns="discntStatusFormColumns" :form="form" :errors="errors"
          :cols="3" :show-actions="false" />
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
    <!-- ===== □.□. 상세정보 ================================================== -->
    <!-- ===== ■.■. 적용대상 ================================================== -->
    <div class="card" v-show="showTab('target')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        🎯 적용대상
      </div>
      <div class="form-group">
        <label class="form-label">
          적용 대상 선택
        </label>
        <select class="form-control" v-model="form.discntTargetCd">
          <option v-for="c in codes.discnt_apply_targets" :key="c.codeValue" :value="c.codeValue">
            {{ c.codeLabel }}
          </option>
        </select>
      </div>
      <div style="margin-top:16px;padding:12px;background:#f9f9f9;border-radius:6px;border:1px solid #e0e0e0;margin-bottom:20px;">
        <div style="font-size:12px;font-weight:700;color:#666;margin-bottom:8px;">
          선택된 대상:
          <span style="color:#e8587a;">
            {{ form.discntTargetCd }}
          </span>
        </div>
        <div style="font-size:13px;color:#888;">
          <template v-if="form.discntTargetCd==='전체상품'">
            모든 상품에 이 할인을 적용합니다.
          </template>
          <template v-else-if="form.discntTargetCd==='선택상품'">
            선택한 상품에만 이 할인을 적용합니다. 아래에서 상품을 추가하세요.
          </template>
          <template v-else-if="form.discntTargetCd==='카테고리'">
            선택한 카테고리의 상품에만 이 할인을 적용합니다. 아래에서 카테고리를 선택하세요.
          </template>
        </div>
      </div>
      <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e8e8e8;">
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;">
          📦 상품목록
        </h3>
        <div v-if="form.discntTargetCd==='선택상품'" style="border:1px solid #ddd;border-radius:6px;padding:12px;background:#fafafa;min-height:200px;">
          <div style="text-align:center;color:#999;padding:30px;font-size:13px;">
            선택된 상품이 없습니다. 상품 추가 버튼을 클릭하여 상품을 선택하세요.
          </div>
        </div>
        <div v-else-if="form.discntTargetCd==='카테고리'" style="border:1px solid #ddd;border-radius:6px;padding:12px;background:#fafafa;min-height:200px;">
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
        <button class="btn btn-primary" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleBtnAction('form-save')">
          저장
        </button>
        <button class="btn btn-secondary" @click="handleBtnAction('form-cancel')">
          취소
        </button>
      </div>
    </div>
    <!-- ===== □.□. 적용대상 ================================================== -->
    <!-- ===== ■.■. 미리보기 ================================================== -->
    <div class="card" v-show="showTab('preview')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        👁 미리보기
      </div>
      <div style="background:#f9f9f9;border-radius:10px;padding:20px;border:1px solid #e8e8e8;max-width:600px;">
        <div style="font-size:18px;font-weight:700;margin-bottom:12px;color:#1a1a2e;">
          {{ form.discntNm || '할인명' }}
        </div>
        <div style="font-size:12px;color:#aaa;margin-bottom:16px;">
          {{ form.startDate }} ~ {{ form.endDate }}
        </div>
        <div style="background:#fff;padding:12px;border-radius:6px;margin-bottom:12px;border-left:4px solid #e8587a;">
          <div style="font-size:13px;color:#666;margin-bottom:4px;">
            할인유형:
            <span style="font-weight:700;color:#e8587a;">
              {{ form.discntTypeCd }}
            </span>
          </div>
          <div style="font-size:13px;color:#666;margin-bottom:4px;">
            할인값:
            <span style="font-weight:700;color:#e8587a;">
              {{ form.discntTypeCd === '정률' ? (form.discntValue + '%') : (form.discntValue||0).toLocaleString() + '원' }}
            </span>
          </div>
          <div style="font-size:13px;color:#666;">
            최소주문금액:
            <span style="font-weight:700;">
              {{ (form.minOrderAmt||0).toLocaleString() }}원
            </span>
          </div>
        </div>
        <div v-if="form.maxDiscntAmt > 0" style="font-size:12px;color:#888;padding:8px;background:#fff7e6;border-radius:6px;margin-bottom:12px;">
          ⚠️ 최대할인금액: {{ (form.maxDiscntAmt||0).toLocaleString() }}원
        </div>
        <button class="btn btn-primary" @click="handleBtnAction('preview-confirm')">
          할인 확인
        </button>
      </div>
    </div>
  </div>
</div>
<!-- ===== □.□. 미리보기 ================================================== -->
<!-- ===== □. 탭 컨텐츠 =================================================== -->
`
};
