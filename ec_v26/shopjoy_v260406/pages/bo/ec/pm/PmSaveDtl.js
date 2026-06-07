/* ShopJoy Admin - 판촉마일리지 상세/등록 */
window._pmSaveDtlState = window._pmSaveDtlState || { tab: 'info', tabMode: 'tab' };
window.PmSaveDtl = {
  name: 'PmSaveDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    active:       { type: Boolean, default: true }, // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
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
      // 폼 취소 → 상세영역 유지 + 빈 신규 폼으로 초기화 (영역 사라지지 않음)
      } else if (cmd === 'form-cancel') {
        return props.navigate('__cancelEdit__');
      // 보기모드 → 수정모드 전환
      } else if (cmd === 'form-edit') {
        return props.navigate('__switchToEdit__');
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


    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ PmSaveDtl : fnCallbackModal -> ', cmd, param, result);
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


    /* tabs — 탭 정의 (BoTabBar 데이터, reactive) */
    const tabs = reactive([
      { id: 'info', label: '기본정보', icon: '📋' },
      { id: 'visibility', label: '공개대상', icon: '🔒' },
      { id: 'preview', label: '미리보기', icon: '👁' },
    ]);
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

    /* 폼 초기값 = 빈 폼 (미선택/초기화 상태에서는 모든 필드 비움).
     *   신규 등록 기본값(구매적립/365/활성/날짜)은 [+신규] 진입 시에만 _applyNewDefaults() 로 채움. */
    const form = reactive({
      saveId: null, saveNm: '', saveType: '', saveVal: '', saveUnit: '',
      saveStatus: '', startDate: '', endDate: '',
      expireDay: '', minOrderAmt: '', remark: '',
      visibilityTargets: '^PUBLIC^',
      vendorId: '', chargeStaff: '',
    });
    /* _applyNewDefaults — 신규 등록 진입 시 기본값 채움 */
    const _applyNewDefaults = () => {
      Object.assign(form, {
        saveType: '구매적립', saveVal: 0, saveUnit: '원', saveStatus: '활성',
        startDate: DEFAULT_START, endDate: DEFAULT_END, expireDay: 365, minOrderAmt: 0,
      });
    };
    const errors = reactive({});

    const schema = yup.object({
      saveNm: yup.string().required('마일리지명을 입력해주세요.'),
      saveVal: yup.number().min(0, '적립값은 0 이상이어야 합니다.').required('적립값을 입력해주세요.'),
    });

    // ★ onMounted
    onMounted(async () => {
      if (isAppReady.value) { fnLoadCodes(); }
      // [+신규] 진입(활성 + 신규)일 때만 기본값 채움. 미선택/초기화(비활성)면 빈 폼 유지.
      if (props.active && cfIsNew.value) { _applyNewDefaults(); }
      // 마운트 시 상세 조회 — 행 클릭으로 key 변경 시 재마운트되므로 watch(reloadTrigger)만으론 최초 로드 누락됨
      await handleSearchDetail();
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
      // 판매업체 선택 시 판매담당자(대표자명) 자동 적용
      const v = vendors.find(x => x.vendorId === vendorId);
      if (v) { form.chargeStaff = v.chargeStaff || v.ceoNm || v.vendorNm || ''; }
      uiState.showVendorModal = false;
    };

    const cfCurId       = computed(() => props.dtlId || form.saveId || null);
    const cfHasId       = computed(() => !!cfCurId.value);
    const cfSaveDisabled = computed(() => uiState.tab !== 'info' && !cfHasId.value);

    /* _afterApiOk — 후 API 성공 */
    const _afterApiOk  = (res, msg) => {
      if (showToast) { showToast(msg, 'success'); }
    };

    /* _afterApiErr — 후 API 오류 */
    const _afterApiErr = (err) => {
      console.error('[handleSave]', err);
      const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
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
    const columns = {};
    columns.infoForm = [
      { key: 'saveNm',      label: '마일리지명', type: 'text', required: true,
        placeholder: '마일리지명 입력' },
      { key: 'saveType',    label: '적립유형', type: 'select', options: () => codes.save_issue_types },
      { key: 'saveVal',     label: '적립값', type: 'number', required: true, placeholder: '적립값 입력' },
      { key: 'saveUnit',    label: '적립단위', type: 'select', options: () => codes.save_units },
      { key: 'expireDay',   label: '유효기간 (일)', type: 'number', placeholder: '365' },
      { key: 'minOrderAmt', label: '최소주문금액 (원)', type: 'number', placeholder: '0' },
      { key: 'saveStatus',  label: '상태', type: 'select', options: () => codes.promo_statuses },
      { key: 'startDate',   label: '시작일', type: 'date' },
      { key: 'endDate',     label: '종료일', type: 'date' },
      { key: 'remark',      label: '비고', type: 'textarea', rows: 2, placeholder: '비고 입력' },
      { key: 'vendorId',    label: '판매업체', type: 'slot', name: 'vendor' },
      { key: 'chargeStaff', label: '판매담당자', type: 'text', placeholder: '담당자명 입력' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      coUtil,  // 템플릿 cofAnd 접근용
      columns,
      vendors, showVendorModal, uiState, codes, form, errors,                       // 상태 / 데이터
      handleBtnAction, handleSelectAction, fnCallbackModal,                                          // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfHasId, cfSaveDisabled, cfDtlMode, cfVisibilityOptions, cfSelectedVendorNm, // computed
      tabs, tab, tabMode2,                                                                // toRef
      showTab, hasVisibility,                                                       // 헬퍼
      coUtil,                                                                       // 의존 (템플릿 cofAnd)
    };
  },
  template: /* html */`
<!-- ===== ■. 상세 카드 (제목 + 탭바 + 탭컨텐츠를 한 영역으로) ===================== -->
<bo-container :title="!active ? '마일리지 상세' : (cfIsNew ? '마일리지 등록' : (cfDtlMode ? '마일리지 상세' : '마일리지 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : form.saveId)">
  <!-- ===== ■.■. 탭바 ==================================================== -->
  <bo-tab-bar :tabs="tabs" :tab="tab" :tab-mode="tabMode2"
    @tab-select="id => handleBtnAction('tab-select', id)"
    @mode-select="m => handleBtnAction('tab-mode', m)" />
  <!-- ===== □. 탭바 ====================================================== -->
  <!-- ===== ■. 탭 컨텐츠 =================================================== -->
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">
    <!-- ===== ■.■. 기본정보 탭 (BoFormArea 자동 렌더) ============================= -->
    <div class="dtl-pane" v-show="showTab('info')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📋 기본정보</div>
      <!-- ===== ■.■.■. 폼 영역 ================================================ -->
      <bo-form-area :columns="columns.infoForm" :form="form" :errors="errors"
        :readonly="cfDtlMode" :cols="3" compact :show-actions="false">
        <!-- ===== ■.■.■.■. 판매업체 picker ======================================= -->
        <template #vendor>
          <div style="display:flex;gap:8px;align-items:center;">
            <div class="form-control" :style="'background:#f9f9f9;padding:0;display:flex;align-items:center;cursor:' + (cfDtlMode ? 'default' : 'pointer')" @click="cfDtlMode ? null : handleBtnAction('vendorModal-open')">
              <span style="padding:4px 10px;flex:1;">{{ cfSelectedVendorNm }}</span>
              <span style="padding:4px 10px;color:#999;font-size:12px;">▼</span>
            </div>
            <button v-if="coUtil.cofAnd(form.vendorId, !cfDtlMode)" type="button" title="선택 해제" @click="handleBtnAction('form-vendorClear')"
              style="background:none;border:none;padding:0 2px 2px;margin-left:-4px;color:#999;cursor:pointer;font-size:13px;line-height:1;flex-shrink:0;align-self:flex-end;">
              x
            </button>
          </div>
        </template>
      </bo-form-area>
      <!-- ===== ■.■.■. 판매업체 선택 모달 ========================================== -->
      <simple-vendor-pick-modal :show="showVendorModal" :vendors="vendors" :selected-id="form.vendorId" modal-name="vendor-pick" :on-callback="fnCallbackModal" />
      <div class="form-actions" v-if="coUtil.cofAnd(active, cfDtlMode)">
        <button class="btn btn_edit" @click="handleBtnAction('form-edit')">수정</button>
        <button class="btn btn_close" @click="handleBtnAction('form-cancel')">닫기</button>
      </div>
      <div class="form-actions" v-if="coUtil.cofAnd(active, !cfDtlMode)">
        <button class="btn btn_save" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleBtnAction('form-save')">
          저장
        </button>
        <button class="btn btn_cancel" @click="handleBtnAction('form-cancel')">취소</button>
      </div>
    </div>
    <!-- ===== □.□. 기본정보 탭 (BoFormArea 자동 렌더) ============================= -->
    <!-- ===== ■.■. 공개대상 ================================================== -->
    <div class="dtl-pane" v-show="showTab('visibility')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🔒 공개대상</div>
      <div style="font-size:12px;font-weight:700;color:#888;margin-bottom:8px;">하나라도 해당하면 노출</div>
      <bo-multi-check-select v-model="form.visibilityTargets" :options="cfVisibilityOptions"
        separator="^" wrap empty-value="^NONE^" placeholder="전체 공개" all-label="전체 공개"
        :disabled="cfDtlMode" min-width="320px" />
      <div class="form-actions" v-if="coUtil.cofAnd(active, cfDtlMode)">
        <button class="btn btn_edit" @click="handleBtnAction('form-edit')">수정</button>
        <button class="btn btn_close" @click="handleBtnAction('form-cancel')">닫기</button>
      </div>
      <div class="form-actions" v-if="coUtil.cofAnd(active, !cfDtlMode)">
        <button class="btn btn_save" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleBtnAction('form-save')">
          저장
        </button>
        <button class="btn btn_cancel" @click="handleBtnAction('form-cancel')">취소</button>
      </div>
    </div>
    <!-- ===== □.□. 공개대상 ================================================== -->
    <!-- ===== ■.■. 미리보기 ================================================== -->
    <div class="dtl-pane" v-show="showTab('preview')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">👁 미리보기</div>
      <div style="background:#f9f9f9;border-radius:10px;padding:20px;border:1px solid #e8e8e8;max-width:600px;">
        <div style="font-size:18px;font-weight:700;margin-bottom:12px;color:#1a1a2e;">{{ form.saveNm || '마일리지명' }}</div>
        <div style="font-size:12px;color:#aaa;margin-bottom:16px;">{{ form.startDate }} ~ {{ form.endDate }}</div>
        <div style="background:#fff;padding:12px;border-radius:6px;margin-bottom:12px;border-left:4px solid #10b981;">
          <div style="font-size:13px;color:#666;margin-bottom:4px;">
            적립유형:
            <span style="font-weight:700;color:#10b981;">{{ form.saveType }}</span>
          </div>
          <div style="font-size:13px;color:#666;margin-bottom:4px;">
            적립값:
            <span style="font-weight:700;color:#10b981;">{{ (form.saveVal||0).toLocaleString() }} {{ form.saveUnit || '원' }}</span>
          </div>
          <div style="font-size:13px;color:#666;margin-bottom:4px;">
            유효기간:
            <span style="font-weight:700;">{{ form.expireDay || 365 }}일</span>
          </div>
          <div style="font-size:13px;color:#666;">
            최소주문금액:
            <span style="font-weight:700;">{{ (form.minOrderAmt||0).toLocaleString() }}원</span>
          </div>
        </div>
        <button class="btn btn-primary" @click="handleBtnAction('form-previewConfirm')">마일리지 확인</button>
      </div>
    </div>
    <!-- ===== □.□. 미리보기 ================================================== -->
  </div>
  <!-- ===== □. 탭 컨텐츠 =================================================== -->
</bo-container>
<!-- ===== □. 상세 카드 (제목 + 탭바 + 탭컨텐츠를 한 영역으로) ===================== -->
`
};
