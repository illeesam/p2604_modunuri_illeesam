/* ShopJoy Admin - 판촉사은품 상세/등록 */
window._pmGiftDtlState = window._pmGiftDtlState || { tab: 'info', tabMode: 'tab' };
window.PmGiftDtl = {
  name: 'PmGiftDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    active:       { type: Boolean, default: true }, // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-bo §18)
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const vendors = reactive([]);
    const uiState = reactive({ loading: false, showVendorModal: false, showTargetPicker: false, error: null, isPageCodeLoad: false, tab: window._pmGiftDtlState.tab || 'info', tabMode2: window._pmGiftDtlState.tabMode || 'tab'});
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({ gift_cond_types: [], gift_statuses: [] });

    const _today = new Date();

    /* _pad — 패딩 */
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END   = `${_today.getFullYear()+1}-12-31`;

    const form = reactive({
      giftId: null, giftNm: '', giftTypeCd: '', condVal: '',
      giftStatusCd: '', giftStock: '', startDate: '', endDate: '',
      prodId: null, giftDesc: '', minOrderAmt: '', minOrderQty: '',
      visibilityTargets: '^PUBLIC^',
      vendorId: '', chargeStaff: '',
      targetTypeCd: '상품', issueTargets: [], issueGrades: [],
    });
    /* _applyNewDefaults — 신규 등록 진입 시 기본값 채움 */
    const _applyNewDefaults = () => {
      Object.assign(form, {
        giftTypeCd: '구매조건', condVal: 0, giftStatusCd: '활성', giftStock: 0,
        startDate: DEFAULT_START, endDate: DEFAULT_END, minOrderAmt: 0, minOrderQty: 0,
      });
    };
    const errors = reactive({});

    const schema = yup.object({
      giftNm: yup.string().required('사은품명을 입력해주세요.'),
      giftStock:  yup.number().min(0, '재고는 0 이상이어야 합니다.').required('재고를 입력해주세요.'),
    });

    const cfIsNew = computed(() => !props.dtlId);
    /* ── 현재 작업중인 giftId: props.dtlId 우선, 없으면 신규등록 직후 form.giftId ── */
    const cfCurId       = computed(() => props.dtlId || form.giftId || null);
    const cfHasId       = computed(() => !!cfCurId.value);
    /* info 외 탭의 [저장] 버튼은 ID 없으면 비활성화 (info 탭은 신규등록 위해 항상 활성) */
    const cfSaveDisabled = computed(() => uiState.tab !== 'info' && !cfHasId.value);

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PmGiftDtl.js : handleBtnAction -> ', cmd, param);
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
      // 미리보기 사은품 확인 토스트
      } else if (cmd === 'preview-confirm') {
        showToast('사은품을 확인하였습니다.', 'success');
        return;
      // 발급대상 추가 (피커 모달 오픈)
      } else if (cmd === 'target-add') {
        uiState.showTargetPicker = true;
        return;
      // 발급대상 삭제
      } else if (cmd === 'target-remove') {
        form.issueTargets.splice(param, 1);
        return;
      // 발급대상 피커 닫기
      } else if (cmd === 'target-close') {
        uiState.showTargetPicker = false;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PmGiftDtl.js : handleSelectAction -> ', cmd, param);
      // 판매업체 선택
      if (cmd === 'vendorModal-select') {
        return selectVendor(param.vendorId, param.vendorNm);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };


    /* _addTarget — 발급대상 추가 공통 헬퍼 */
    const _addTarget = (row, idKey, nmKey) => {
      uiState.showTargetPicker = false;
      if (!row) return;
      const id = String(row[idKey] || '');
      if (!id) return;
      if (form.issueTargets.some(t => t.targetId === id)) { showToast('이미 추가된 대상입니다.', 'error'); return; }
      form.issueTargets.push({ targetId: id, targetNm: row[nmKey] || id });
    };

    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ PmGiftDtl : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'vendor-pick') {
        if (result == null) { uiState.showVendorModal = false; return; }
        return selectVendor(result.vendorId, result.vendorNm);
      } else if (cmd === 'target-prod-pick') {
        return _addTarget(result, 'prodId', 'prodNm');
      } else if (cmd === 'target-brand-pick') {
        return _addTarget(result, 'brandId', 'brandNm');
      } else if (cmd === 'target-category-pick') {
        return _addTarget(result, 'categoryId', 'categoryNm');
      } else if (cmd === 'vendor-target-pick') {
        return _addTarget(result, 'vendorId', 'vendorNm');
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
      } catch (e) { console.warn('[PmGiftDtl.js] vendor load failed', e); }
    };

    /* handleSearchDetail — 처리 */
    const handleSearchDetail = async () => {
      await loadVendors();
      if (cfIsNew.value) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.pmGift.getById(props.dtlId, '선물관리', '상세조회');
        const g = res.data?.data || res.data;
        if (g) { Object.assign(form, g); }
        // Entity minOrderAmt/minOrderQty → UI 단일 condVal 매핑
        if (g) {
          if (g.giftTypeCd === '수량조건') { form.condVal = Number(g.minOrderQty) || 0; }
          else { form.condVal = Number(g.minOrderAmt) || 0; }
        }
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    watch(() => uiState.tab, v => { window._pmGiftDtlState.tab = v; });
    watch(() => uiState.tabMode2, v => { window._pmGiftDtlState.tabMode = v; });

    /* showTab — 표시 */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;


    /* tabs — 탭 정의 (BoTabBar 데이터, reactive) */
    const tabs = reactive([
      { id: 'info', label: '기본정보', icon: '📋' },
      { id: 'target', label: '발급대상', icon: '🎯' },
      { id: 'visibility', label: '공개대상', icon: '🔒' },
      { id: 'preview', label: '미리보기', icon: '👁' },
    ]);
    /* 사은품 fnLoadCodes */

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ################################# */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.gift_cond_types = codeStore.sgGetGrpCodes('GIFT_COND_KR');
      codes.gift_statuses = codeStore.sgGetGrpCodes('GIFT_STATUS');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

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

    /* ── 탭별 저장: info=신규/전체저장, visibility=공개대상만 부분 PUT ── */

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

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
          // UI 단일 condVal → Entity minOrderQty / minOrderAmt 매핑
          if (form.giftTypeCd === '수량조건') { payload.minOrderQty = form.condVal; }
          else { payload.minOrderAmt = form.condVal; }
          const res = isCreate
            ? await boApiSvc.pmGift.create(payload, '선물관리', '등록')
            : await boApiSvc.pmGift.update(cfCurId.value, payload, '선물관리', '기본정보저장');
          if (isCreate) {
            const newId = res.data?.data?.giftId || res.data?.giftId || null;
            if (newId) { form.giftId = newId; }
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
        const res = await boApiSvc.pmGift.update(cfCurId.value, payload, '선물관리', `${tabId}저장`);
        _afterApiOk(res, '저장되었습니다.');
      } catch (err) { _afterApiErr(err); }
    };

    const showVendorModal = Vue.toRef(uiState, 'showVendorModal');
    const showTargetPicker = Vue.toRef(uiState, 'showTargetPicker');

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfIsView = computed(() => props.dtlMode === 'view');

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - info 탭 ======================
    // 정보 영역 폼
    const columns = {};
    columns.infoForm = [
      { key: 'giftNm',       label: '사은품명', type: 'text', required: true,
        placeholder: '사은품명 입력' },
      { key: 'giftTypeCd',   label: '조건유형', type: 'select', options: () => codes.gift_cond_types },
      { key: 'condVal',      label: '조건값', type: 'number', placeholder: '0',
        visible: (f) => f.giftTypeCd !== '무조건',
        hint: '조건유형에 따라 단위(수량/금액) 입력' },
      { key: 'giftStock',    label: '재고', type: 'number', required: true, placeholder: '0' },
      { key: 'giftStatusCd', label: '상태', type: 'select', options: () => codes.gift_statuses },
      { key: 'startDate',    label: '시작일', type: 'date' },
      { key: 'endDate',      label: '종료일', type: 'date' },
      { key: 'giftDesc',     label: '비고', type: 'textarea', rows: 2, placeholder: '비고 입력' },
      { key: 'vendorId',     label: '판매업체', type: 'slot', name: 'vendor' },
      { key: 'chargeStaff',  label: '판매담당자', type: 'text', placeholder: '담당자명 입력' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      vendors, form, errors,                // 상태 / 데이터
      handleBtnAction, handleSelectAction, fnCallbackModal,                                            // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfSaveDisabled, cfIsView, cfVisibilityOptions, cfSelectedVendorNm,                         // computed
      tabs, tab, tabMode2, showVendorModal, showTargetPicker, // toRef
      showTab, hasVisibility, coUtil,                                                  // 헬퍼 (coUtil: 템플릿 cofAnd 접근용)
    };
  },
  template: /* html */`
<!-- ===== ■. 상세 카드 (제목 + 탭바 + 탭컨텐츠를 한 영역으로) ===================== -->
<bo-container :title="!active ? '사은품 상세' : (cfIsNew ? '사은품 등록' : '사은품 수정')"
  :title-id="coUtil.cofAnd(active, !cfIsNew) ? form.giftId : ''">
  <!-- ===== ■.■. 카드 헤더 (제목 = list-title) ============================== -->
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
        :readonly="cfIsView" :cols="3" compact :show-actions="false">
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
      <div class="form-actions" v-if="active ? (cfIsView) : false">
        <button class="btn btn_edit" @click="handleBtnAction('form-edit')">수정</button>
        <button class="btn btn_close" @click="handleBtnAction('form-cancel')">닫기</button>
      </div>
      <div class="form-actions" v-if="active ? (!cfIsView) : false">
        <button class="btn btn_save" :disabled="cfSaveDisabled" :title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''" @click="handleBtnAction('form-save')">
          저장
        </button>
        <button class="btn btn_cancel" @click="handleBtnAction('form-cancel')">취소</button>
      </div>
    </div>
    <!-- ===== □.□. 기본정보 탭 (BoFormArea 자동 렌더) ============================= -->
    <!-- ===== ■.■. 발급대상 ================================================== -->
    <div class="dtl-pane" v-show="showTab('target')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🎯 발급대상</div>
      <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #e8e8e8;">
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;">📋 발급대상 종류</h3>
        <div class="form-group">
          <label class="form-label">대상 구분</label>
          <select class="form-control" style="width:200px;" v-model="form.targetTypeCd" :disabled="cfIsView">
            <option value="상품">상품</option>
            <option value="판매업체">판매업체</option>
            <option value="브랜드">브랜드</option>
            <option value="카테고리">카테고리</option>
          </select>
        </div>
        <div style="margin-top:12px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-size:12px;font-weight:700;color:#555;">
              선택 대상 목록
              <span style="color:#e8587a;margin-left:4px;">{{ form.issueTargets.length }}건</span>
            </span>
            <button v-if="!cfIsView" class="btn btn-sm" style="background:#e8587a;color:#fff;border:none;padding:3px 10px;border-radius:4px;font-size:12px;"
              @click="handleBtnAction('target-add')">+ 대상 추가</button>
          </div>
          <div v-if="form.issueTargets.length === 0" style="padding:10px 14px;background:#f9f9f9;border:1px solid #e0e0e0;border-radius:6px;font-size:12px;color:#aaa;">
            [+ 대상 추가] 버튼으로 {{ form.targetTypeCd }}을(를) 선택하세요.
          </div>
          <table v-else class="admin-table" style="margin-top:0;">
            <thead><tr>
              <th style="width:36px;text-align:center;">번호</th>
              <th>대상 ID</th>
              <th>대상명</th>
              <th v-if="!cfIsView" style="width:60px;text-align:center;">삭제</th>
            </tr></thead>
            <tbody>
              <tr v-for="(t, idx) in form.issueTargets" :key="t.targetId">
                <td style="text-align:center;">{{ idx + 1 }}</td>
                <td style="font-family:monospace;font-size:11px;">{{ t.targetId }}</td>
                <td>{{ t.targetNm || '-' }}</td>
                <td v-if="!cfIsView" style="text-align:center;">
                  <button class="btn btn_row_delete" @click="handleBtnAction('target-remove', idx)">✕</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;">👥 적용 회원 등급</h3>
        <div class="form-group">
          <bo-multi-check-select
            v-model="form.issueGrades"
            :options="[{value:'일반',label:'일반'},{value:'실버',label:'실버'},{value:'골드',label:'골드'},{value:'VIP',label:'VIP'}]"
            placeholder="전체 등급 (미선택 시 전체)"
            :disabled="cfIsView" />
          <span style="font-size:12px;color:#aaa;margin-top:4px;display:block;">선택하지 않으면 전체 등급에 적용</span>
        </div>
      </div>
      <div class="form-actions" v-if="coUtil.cofAnd(active, cfIsView)">
        <button class="btn btn_edit" @click="handleBtnAction('form-edit')">수정</button>
        <button class="btn btn_close" @click="handleBtnAction('form-close')">닫기</button>
      </div>
      <div class="form-actions" v-if="active ? (!cfIsView) : false">
        <button class="btn btn_save" :disabled="cfSaveDisabled" @click="handleBtnAction('form-save')">저장</button>
        <button class="btn btn_cancel" @click="handleBtnAction('form-cancel')">취소</button>
      </div>
    </div>
    <!-- ===== □.□. 발급대상 ================================================== -->
    <!-- ===== ■.■. 공개대상 ================================================== -->
    <div class="dtl-pane" v-show="showTab('visibility')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🔒 공개대상</div>
      <div style="font-size:12px;font-weight:700;color:#888;margin-bottom:8px;">하나라도 해당하면 노출</div>
      <bo-multi-check-select v-model="form.visibilityTargets" :options="cfVisibilityOptions"
        separator="^" wrap empty-value="^NONE^" placeholder="전체 공개" all-label="전체 공개"
        :disabled="cfIsView" min-width="320px" />
      <div class="form-actions" v-if="active ? (cfIsView) : false">
        <button class="btn btn_edit" @click="handleBtnAction('form-edit')">수정</button>
        <button class="btn btn_close" @click="handleBtnAction('form-cancel')">닫기</button>
      </div>
      <div class="form-actions" v-if="active ? (!cfIsView) : false">
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
          <div style="font-size:13px;color:#666;">상태: <span style="font-weight:700;"> {{ form.giftStatusCd }} </span></div>
        </div>
        <button class="btn btn-primary" @click="handleBtnAction('preview-confirm')">사은품 확인</button>
      </div>
    </div>
    <!-- ===== □.□. 미리보기 ================================================== -->
  </div>
  <!-- ===== □. 탭 컨텐츠 =================================================== -->
<!-- 발급대상 피커 모달 -->
<bo-prod-cate-pick-modal v-if="coUtil.cofAnd(showTargetPicker, form.targetTypeCd==='상품')"
  :exclude-ids="form.issueTargets.map(t => t.targetId)"
  modal-name="target-prod-pick" :on-callback="fnCallbackModal" />
<pm-category-pick-modal v-if="coUtil.cofAnd(showTargetPicker, form.targetTypeCd==='카테고리')"
  modal-name="target-category-pick" :on-callback="fnCallbackModal" />
<pm-brand-pick-modal v-if="coUtil.cofAnd(showTargetPicker, form.targetTypeCd==='브랜드')"
  modal-name="target-brand-pick" :on-callback="fnCallbackModal" />
<simple-vendor-pick-modal v-if="coUtil.cofAnd(showTargetPicker, form.targetTypeCd==='판매업체')"
  :show="true" :vendors="vendors" modal-name="vendor-target-pick" :on-callback="fnCallbackModal" />
</bo-container>
<!-- ===== □. 상세 카드 (제목 + 탭바 + 탭컨텐츠를 한 영역으로) ===================== -->
`
};
