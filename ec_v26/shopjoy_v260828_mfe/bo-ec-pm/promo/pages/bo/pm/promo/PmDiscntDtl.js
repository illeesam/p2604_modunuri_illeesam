/* ShopJoy Admin - 판촉할인 상세/등록 */
window._pmDiscntDtlState = window._pmDiscntDtlState || { tab: 'info', tabMode: 'tab' };
export default {
  name: 'PmDiscntDtl',
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
    const uiState = reactive({ loading: false, showVendorModal: false, showMdModal: false, showTargetPicker: false, error: null, tab: window._pmDiscntDtlState.tab || 'info', tabMode2: window._pmDiscntDtlState.tabMode || 'tab'});
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const showTargetPicker = Vue.toRef(uiState, 'showTargetPicker');
    const codes = reactive({ discnt_types: [], discnt_val_types: [], promo_statuses: [], discnt_apply_targets: [], discnt_prod_targets: [] });

    const _today = new Date();

    /* _pad — 패딩 */
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END   = `${_today.getFullYear()+1}-12-31`;

    /* 폼 초기값 = 빈 폼 (미선택/초기화 상태에서는 모든 필드 비움).
     *   신규 등록 기본값(정률/활성/전체상품/날짜)은 [+신규] 진입 시에만 _applyNewDefaults() 로 채움. */
    const form = reactive({
      discntId: null, discntNm: '', discntTypeCd: '', discntValTypeCd: '', discntValue: '',
      discntStatusCd: '', startDate: '', endDate: '',
      discntTargetCd: '', minOrderAmt: '', maxDiscntAmt: '', discntDesc: '',
      visibilityTargets: '^PUBLIC^',
      vendorId: '', chargeStaff: '', mdUserId: '', mdUserNm: '',
      issueTargets: [], issueGrades: [],
    });
    /* _applyNewDefaults — 신규 등록 진입 시 기본값 채움
       2026-08-29 버그수정: '활성'/'전체상품' 은 실제 codeValue(ACTIVE, ALL_PROD 등)가
       아니라 select 가 빈 값으로 보이던 값이었다. 코드그룹 첫 번째 값으로 대체. */
    const _applyNewDefaults = () => {
      Object.assign(form, {
        discntTypeCd: 'PROD', discntValTypeCd: 'RATE', discntValue: 0,
        discntStatusCd: codes.promo_statuses[0]?.codeValue || '',
        startDate: DEFAULT_START, endDate: DEFAULT_END,
        discntTargetCd: codes.discnt_prod_targets[0]?.codeValue || '', minOrderAmt: 0, maxDiscntAmt: 0,
      });
    };
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
      // 탭별 분기 대상(4개 탭). 저장/삭제는 탭별로 별도 분기 준비, 취소/닫기/수정전환은 탭 무관 공통
      // 동작이라 같은 탭 목록에서 cmd 접미어만 바꿔 파생시킨다(TAB_IDS 하나만 관리하면 됨).
      const TAB_IDS = ['info', 'detail', 'target', 'preview'];
      // 폼 저장/삭제 — 탭별 분기 자리(현재는 배열에 있는 탭 전부 handleSave()/handleDelete() 공용.
      // 특정 탭만 다른 로직이 필요해지면 그 탭만 배열에서 빼고 별도 분기로 추가하면 됨)
      if (TAB_IDS.map(t => t + '-form-save').includes(cmd)) {
        return handleSave();
      } else if (TAB_IDS.map(t => t + '-form-delete').includes(cmd)) {
        return handleDelete();
      // 폼 취소/닫기/수정전환 — 탭 무관 공통 동작(순수 네비게이션이라 탭별 분기 불필요)
      } else if (TAB_IDS.map(t => t + '-form-cancel').includes(cmd)) {
        return props.navigate('__cancelEdit__');
      } else if (TAB_IDS.map(t => t + '-form-close').includes(cmd)) {
        return props.navigate('__closeDtl__');
      } else if (TAB_IDS.map(t => t + '-form-edit').includes(cmd)) {
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
      // 담당MD 모달 열기
      } else if (cmd === 'mdModal-open') {
        uiState.showMdModal = true;
        return;
      // 담당MD 초기화
      } else if (cmd === 'form-mdClear') {
        form.mdUserId = '';
        form.mdUserNm = '';
        return;
      // 미리보기 토스트 (할인 확인)
      } else if (cmd === 'preview-confirm') {
        showToast('할인을 확인하였습니다.', 'success');
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
      console.log(' ■■ PmDiscntDtl.js : handleSelectAction -> ', cmd, param);
      // 판매업체 선택
      if (cmd === 'vendorModal-select') {
        return selectVendor(param.vendorId, param.vendorNm);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터 */
    const handleGridCellAction = (gcmd, colKey, row, e = {}) => {
      if (colKey === '_del') { return handleBtnAction('target-remove', e.rowIndex); }
    };


    /* _addTarget — 발급대상 추가 공통 헬퍼 */
    const _addTarget = (row) => {
      uiState.showTargetPicker = false;
      if (!row) return;
      const id = String(row.selId || '');
      if (!id) return;
      if (form.issueTargets.some(t => t.targetId === id)) { showToast('이미 추가된 대상입니다.', 'error'); return; }
      form.issueTargets.push({ targetId: id, targetNm: row.selName || id });
    };

    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (popCmd, param, result) => {
      console.log(' ■■ PmDiscntDtl : fnCallbackModal -> ', popCmd, param, result);
      if (popCmd === 'cmPopup-vendor-pick') {
        if (result == null) { uiState.showVendorModal = false; return; }
        return selectVendor(result.selId, result.selName);
      } else if (popCmd === 'cmPopup-userMd-pick') {
        if (result == null) { uiState.showMdModal = false; return; }
        form.mdUserId = result.selId || '';
        form.mdUserNm = result.selName || '';
        uiState.showMdModal = false;
        return;
      } else if (popCmd === 'cmPopup-target-prod-pick') {
        return _addTarget(result);
      } else if (popCmd === 'cmPopup-target-brand-pick') {
        return _addTarget(result);
      } else if (popCmd === 'cmPopup-target-category-pick') {
        return _addTarget(result);
      } else if (popCmd === 'cmPopup-vendor-target-pick') {
        return _addTarget(result);
      } else {
        console.warn('[fnCallbackModal] unknown popCmd:', popCmd);
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
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['DISCNT_TYPE', 'DISCNT_VAL_TYPE_CD', 'PROMO_STATUS', 'DISCNT_APPLY_TARGET', 'DISCNT_PROD_TARGET'], {compNm: 'PmDiscntDtl'});
      codes.discnt_types = codeStore.sgGetGrpCodes('DISCNT_TYPE');
      codes.discnt_val_types = codeStore.sgGetGrpCodes('DISCNT_VAL_TYPE_CD');
      codes.promo_statuses = codeStore.sgGetGrpCodes('PROMO_STATUS');
      codes.discnt_apply_targets = codeStore.sgGetGrpCodes('DISCNT_APPLY_TARGET');
      codes.discnt_prod_targets = codeStore.sgGetGrpCodes('DISCNT_PROD_TARGET');
    };

    // ★ onMounted
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      // [+신규] 진입(활성 + 신규)일 때만 기본값 채움. 미선택/초기화(비활성)면 빈 폼 유지.
      if (props.active && cfIsNew.value) { _applyNewDefaults(); }
      // 마운트 시 상세 조회 — 행 클릭으로 key 변경 시 재마운트되므로 watch(reloadTrigger)만으론 최초 로드 누락됨
      await handleSearchDetail();
    };
    onMounted(initPage);
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleSearchDetail();
    });

    const cfVisibilityOptions = computed(() => window.visibilityUtil.allOptions());


    /* toggleVisibility — 토글 */
    const toggleVisibility = (code) => {
      const list = window.visibilityUtil.parse(form.visibilityTargets);
      const i = list.indexOf(code);
      if (i >= 0) list.splice(i, 1); else list.push(code);
      form.visibilityTargets = window.visibilityUtil.serialize(list);
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

    /* handleDelete — 삭제 (2026-08-22 정책: 보기모드 표준 버튼 = [수정][삭제][닫기]) */
    const handleDelete = async () => {
      if (cfIsNew.value || !cfCurId.value) { return; }
      const ok = await showConfirm('삭제', `[${form.discntNm}] 할인을 삭제하시겠습니까?`);
      if (!ok) { return; }
      try {
        await boApiSvc.pmDiscnt.remove(cfCurId.value, '할인관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        props.navigate('pmDiscntMng', { reload: true });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
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

    const showVendorModal = Vue.toRef(uiState, 'showVendorModal');
    const showMdModal = Vue.toRef(uiState, 'showMdModal');

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    /* fnShareUrl — 이 할인 상세를 가리키는 독립 새창 딥링크 URL 생성 */
    const fnShareUrl = () => {
      const qs = new URLSearchParams();
      qs.set('page', 'pmDiscntDtl');
      qs.set('id', form.discntId);
      qs.set('embed', '1');
      return `${window.location.origin}${window.location.pathname}?${qs.toString()}`;
    };
    /* handleShareKakao — 카카오톡 공유(피드 카드, 상세보기 모드 전용) */
    const handleShareKakao = () => {
      try {
        window.coExtSdk.shareKakao({
          title: `할인 ${form.discntId} - ShopJoy BO`,
          description: form.discntNm || '',
          imageUrl: window.location.origin + '/assets/img/shopjoy-share-og.png',
          url: fnShareUrl(),
        });
      } catch (e) {
        showToast(e.message || '카카오톡 공유를 열 수 없습니다.', 'error', 0);
      }
    };
    /* handleCopyLink — 순수 URL만 클립보드에 복사 (카카오톡 카드 없음) */
    const handleCopyLink = async () => {
      try {
        await navigator.clipboard.writeText(fnShareUrl());
        showToast('링크가 복사되었습니다.', 'success');
      } catch (e) {
        showToast(e.message || '링크 복사에 실패했습니다.', 'error', 0);
      }
    };
    /* pdfAreaRef — 할인 상세 카드 캡처 대상. handleExportPdf — PDF 다운로드(상세보기 모드 전용) */
    const pdfAreaRef = ref(null);
    const pdfExporting = ref(false);
    const handleExportPdf = async () => {
      pdfExporting.value = true;
      try {
        const filename = coUtil.cofBuildExportFilename(`할인상세_${form.discntId}.pdf`);
        await window.boUtil.bofExportPdf(pdfAreaRef.value, filename, showToast);
      } finally {
        pdfExporting.value = false;
      }
    };

    const cfIssueTargetsColumns = computed(() => [
      { key: 'targetId', label: '대상 ID', mono: true, cellStyle: 'font-size:11px;' },
      { key: 'targetNm', label: '대상명', fmt: v => v || '-' },
      ...(!cfDtlMode.value ? [{ key: '_del', label: '삭제', style: 'width:60px;', align: 'center',
        fmt: () => '✕', link: true, cellStyle: 'color:#e8587a;cursor:pointer;font-weight:700;' }] : []),
    ]);

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - info 탭 ======================
    // 정보 영역 폼
    const columns = {};
    columns.infoForm = [
      { key: 'discntNm',       label: '할인명', type: 'text', required: true, colSpan: 2,
        placeholder: '할인명 입력' },
      { key: 'discntTypeCd',   label: '할인유형', type: 'select', options: () => codes.discnt_types },
      { key: 'discntValTypeCd', label: '할인방식', type: 'select', options: () => codes.discnt_val_types,
        visible: (f) => f.discntTypeCd !== 'SHIP_FREE' },
      { key: 'discntValue',    label: '할인값', type: 'number', required: true,
        visible: (f) => f.discntTypeCd !== 'SHIP_FREE' },
      { key: 'vendorId',       label: '판매업체', type: 'pick', placeholder: '업체 선택',
        display: (f) => { const v = vendors.find(x => x.vendorId === f.vendorId); return v ? v.vendorNm : ''; },
        onOpen: () => handleBtnAction('vendorModal-open'),
        onClear: () => { form.chargeStaff = ''; } },
      { key: 'chargeStaff',    label: '판매담당자', type: 'text', placeholder: '담당자명 입력' },
      { key: 'mdUserId', label: '담당MD', type: 'pick', display: (f) => f.mdUserNm, placeholder: 'MD 선택', nameKey: 'mdUserNm',
        onOpen: () => handleBtnAction('mdModal-open'), onClear: () => handleBtnAction('form-mdClear') },
    ];

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - detail 탭 할인적용/기간설정 ===
    // 할인 적용 폼
    columns.discntApplyForm = [
      { key: 'minOrderAmt',    label: '최소주문금액 (원)', type: 'number', placeholder: '0' },
      { key: 'maxDiscntAmt',   label: '최대할인금액 (원)', type: 'number', placeholder: '0 = 무제한' },
      { key: 'discntTargetCd', label: '발급대상 종류', type: 'select',
        options: () => codes.discnt_prod_targets, nullLabel: null },
      { key: 'issueGrades', label: '적용 회원 등급', type: 'slot', name: 'issueGrades', colSpan: 3 },
    ];
    // 할인 기간 폼
    columns.discntPeriodForm = [
      { key: 'startDate', label: '시작일', type: 'date' },
      { key: 'endDate',   label: '종료일', type: 'date' },
    ];
    // 상태/비고
    columns.discntStatusForm = [
      { key: 'discntStatusCd', label: '상태', type: 'select', options: () => codes.promo_statuses },
      { key: 'discntDesc',     label: '비고', type: 'textarea', rows: 2, placeholder: '비고 입력' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      coUtil, // 템플릿 cofAnd 접근용
      columns,
      vendors, codes, form, errors,         // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction, fnCallbackModal,                                            // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfSaveDisabled, cfDtlMode, cfVisibilityOptions, cfSelectedVendorNm, cfIssueTargetsColumns,         // computed
      tabs, tab, tabMode2, showVendorModal, showMdModal, showTargetPicker, // toRef
      showTab, coUtil,               // 헬퍼
      handleShareKakao, handleCopyLink,                                    // 카카오톡 공유 / 링크 복사 (상세보기)
      pdfAreaRef, pdfExporting, handleExportPdf,                           // PDF 다운로드 (항상 노출)
    };
  },
  template: /* html */`
<div ref="pdfAreaRef">
<!-- ===== ■. 상세 카드 (제목 + 탭바 + 탭컨텐츠를 한 영역으로) ===================== -->
<bo-container :title="!active ? '할인 상세' : (cfIsNew ? '할인 등록' : (cfDtlMode ? '할인 상세' : '할인 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : form.discntId)">
  <!-- ===== ■.■. 컨테이너 헤더 (제목 = list-title) ============================= -->
  <template #toolbar-actions>
    <button v-if="active ? (cfDtlMode ? !cfIsNew : false) : false" class="btn btn_link" title="링크 공유(URL만)" @click="handleCopyLink">🔗</button>
    <button v-if="active ? (cfDtlMode ? !cfIsNew : false) : false" class="btn btn_kakao" title="카카오톡 공유" @click="handleShareKakao">💬</button>
    <button class="btn btn_pdf" title="PDF 다운로드" :disabled="pdfExporting" @click="handleExportPdf">
      <span v-if="pdfExporting">⏳</span>
      <svg v-else width="18" height="20" viewBox="0 0 32 36" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 2 H20 L28 10 V34 H4 Z" fill="#fff" stroke="#c2410c" stroke-width="1.5"/>
        <path d="M20 2 V10 H28 Z" fill="#f3d4c0"/>
        <rect x="2" y="20" width="28" height="12" rx="2" fill="#e2372c"/>
        <text x="16" y="29" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="#fff" text-anchor="middle">PDF</text>
      </svg>
    </button>
  </template>
  <!-- ===== ■.■. 탭 영역 ==================================================== -->
  <bo-tab-bar :tabs="tabs" :tab="tab" :tab-mode="tabMode2"
    @tab-select="id => handleBtnAction('tab-select', id)"
    @mode-select="m => handleBtnAction('tab-mode', m)" />
  <!-- ===== □.■. 탭 영역 ==================================================== -->
  <!-- ===== ■.■. 탭 컨텐츠 =================================================== -->
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">
    <!-- ===== ■.■. 기본정보 탭 (BoFormArea 자동 렌더) ============================= -->
    <div class="dtl-pane" v-show="showTab('info')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📋 기본정보</div>
      <!-- ===== ■.■.■. 폼 영역 ================================================ -->
      <bo-form-area plain-readonly :columns="columns.infoForm" :form="form" :errors="errors"
        :readonly="cfDtlMode" :cols="3" compact :show-actions="false" />
      <!-- ===== ■.■.■. 판매업체 선택 모달 ========================================== -->
      <bo-cm-popup-modal popup-cmd="cmPopup-vendor-pick" popup-code="vendor" :show="showVendorModal" :on-callback="fnCallbackModal" />
      <bo-form-actions v-if="active" :readonly="cfDtlMode" :show-delete="!cfIsNew"
        :save-disabled="cfSaveDisabled" :save-title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''"
        :edit-click="() => handleBtnAction('info-form-edit')"
        :save-click="() => handleBtnAction('info-form-save')"
        :delete-click="() => handleBtnAction('info-form-delete')"
        :cancel-click="() => handleBtnAction('info-form-cancel')"
        :close-click="() => handleBtnAction('info-form-close')" />
    </div>
    <!-- ===== □.□. 기본정보 탭 (BoFormArea 자동 렌더) ============================= -->
    <!-- ===== ■.■. 상세정보 ================================================== -->
    <div class="dtl-pane" v-show="showTab('detail')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📋 상세정보</div>
      <!-- ===== ■.■.■. 공개대상 ================================================ -->
      <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e8e8e8;">
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;">🔒 공개대상</h3>
        <div style="font-size:12px;font-weight:700;color:#888;margin-bottom:8px;">하나라도 해당하면 노출</div>
        <bo-multi-check-select v-model="form.visibilityTargets" :options="cfVisibilityOptions"
          separator="^" wrap empty-value="^NONE^" placeholder="전체 공개" all-label="전체 공개"
          :disabled="cfDtlMode" min-width="320px" />
      </div>
      <!-- ===== ■.■.■. 할인적용 (BoFormArea 자동 렌더) ============================= -->
      <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e8e8e8;">
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;">💰 할인적용</h3>
        <!-- ===== ■.■.■.■. 폼 영역 ============================================== -->
        <bo-form-area :columns="columns.discntApplyForm" :form="form" :errors="errors"
          :cols="3" compact :show-actions="false" />
      </div>
      <!-- ===== ■.■.■. 기간설정 (BoFormArea 자동 렌더) ============================= -->
      <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e8e8e8;">
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;">📅 기간설정</h3>
        <!-- ===== ■.■.■.■. 폼 영역 ============================================== -->
        <bo-form-area :columns="columns.discntPeriodForm" :form="form" :errors="errors"
          :cols="3" compact :show-actions="false" />
      </div>
      <!-- ===== ■.■.■. 상태 및 비고 (BoFormArea 자동 렌더) ========================== -->
      <div>
        <h3 style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;">⚙️ 상태 및 비고</h3>
        <!-- ===== ■.■.■.■. 폼 영역 ============================================== -->
        <bo-form-area :columns="columns.discntStatusForm" :form="form" :errors="errors"
          :cols="3" compact :show-actions="false" />
      </div>
      <bo-form-actions v-if="active" :readonly="cfDtlMode" :show-delete="!cfIsNew"
        :save-disabled="cfSaveDisabled" :save-title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''"
        :edit-click="() => handleBtnAction('detail-form-edit')"
        :save-click="() => handleBtnAction('detail-form-save')"
        :delete-click="() => handleBtnAction('detail-form-delete')"
        :cancel-click="() => handleBtnAction('detail-form-cancel')"
        :close-click="() => handleBtnAction('detail-form-close')" />
    </div>
    <!-- ===== □.□. 상세정보 ================================================== -->
    <!-- ===== ■.■. 적용대상 ================================================== -->
    <div class="dtl-pane" v-show="showTab('target')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🎯 적용대상</div>
      <bo-form-area plain-readonly :columns="columns.discntApplyForm" :form="form" :errors="errors" :cols="3" compact
        :show-actions="false" :readonly="cfDtlMode">
        <template #issueGrades>
          <bo-multi-check-select
            v-model="form.issueGrades"
            :options="[{value:'일반',label:'일반'},{value:'실버',label:'실버'},{value:'골드',label:'골드'},{value:'VIP',label:'VIP'}]"
            placeholder="전체 등급 (미선택 시 전체)"
            :disabled="cfDtlMode" />
          <span style="font-size:12px;color:#aaa;margin-top:4px;display:block;">선택하지 않으면 전체 등급에 적용</span>
        </template>
      </bo-form-area>
      <!-- 발급대상 목록 추가/삭제 -->
      <div style="margin-top:12px;" v-if="form.discntTargetCd !== 'ALL_PROD'">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="font-size:12px;font-weight:700;color:#555;">
            선택 대상 목록
            <span style="color:#e8587a;margin-left:4px;">{{ form.issueTargets.length }}건</span>
          </span>
          <button v-if="!cfDtlMode" class="btn btn-sm" style="background:#e8587a;color:#fff;border:none;padding:3px 10px;border-radius:4px;font-size:12px;"
            @click="handleBtnAction('target-add')">+ 대상 추가</button>
        </div>
        <bo-grid bare :columns="cfIssueTargetsColumns" :rows="form.issueTargets" row-key="targetId"
          empty-text="[+ 대상 추가] 버튼으로 대상을 선택하세요."
          @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" />
      </div>
      <div v-else style="margin-top:12px;padding:10px 14px;background:#f0f7ff;border:1px solid #c5d9f1;border-radius:6px;font-size:12px;color:#1565c0;">
        ✓ 전체 상품에 이 할인이 적용됩니다.
      </div>
      <bo-form-actions v-if="active" :readonly="cfDtlMode" :show-delete="!cfIsNew"
        :save-disabled="cfSaveDisabled" :save-title="cfSaveDisabled ? '먼저 기본정보 탭에서 등록해주세요.' : ''"
        :edit-click="() => handleBtnAction('target-form-edit')"
        :save-click="() => handleBtnAction('target-form-save')"
        :delete-click="() => handleBtnAction('target-form-delete')"
        :cancel-click="() => handleBtnAction('target-form-cancel')"
        :close-click="() => handleBtnAction('target-form-close')" />
    </div>
    <!-- ===== □.□. 적용대상 ================================================== -->
    <!-- ===== ■.■. 미리보기 ================================================== -->
    <div class="dtl-pane" v-show="showTab('preview')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">👁 미리보기</div>
      <div style="background:#f9f9f9;border-radius:10px;padding:20px;border:1px solid #e8e8e8;max-width:600px;">
        <div style="font-size:18px;font-weight:700;margin-bottom:12px;color:#1a1a2e;">{{ form.discntNm || '할인명' }}</div>
        <div style="font-size:12px;color:#aaa;margin-bottom:16px;">{{ form.startDate }} ~ {{ form.endDate }}</div>
        <div style="background:#fff;padding:12px;border-radius:6px;margin-bottom:12px;border-left:4px solid #e8587a;">
          <div style="font-size:13px;color:#666;margin-bottom:4px;">
            할인유형:
            <span style="font-weight:700;color:#e8587a;">{{ form.discntTypeCd }}</span>
            <span v-if="form.discntValTypeCd" style="font-weight:700;color:#e8587a;margin-left:4px;">({{ form.discntValTypeCd }})</span>
          </div>
          <div v-if="form.discntTypeCd !== 'SHIP_FREE'" style="font-size:13px;color:#666;margin-bottom:4px;">
            할인값:
            <span style="font-weight:700;color:#e8587a;">
              {{ form.discntValTypeCd === 'RATE' ? (form.discntValue + '%') : coUtil.cofWon(form.discntValue) }}
            </span>
          </div>
          <div style="font-size:13px;color:#666;">
            최소주문금액:
            <span style="font-weight:700;">{{ (form.minOrderAmt||0).toLocaleString() }}원</span>
          </div>
        </div>
        <div v-if="form.maxDiscntAmt > 0" style="font-size:12px;color:#888;padding:8px;background:#fff7e6;border-radius:6px;margin-bottom:12px;">
          ⚠️ 최대할인금액: {{ (form.maxDiscntAmt||0).toLocaleString() }}원
        </div>
        <button class="btn btn-primary" @click="handleBtnAction('preview-confirm')">할인 확인</button>
      </div>
      <bo-form-actions v-if="active && cfDtlMode" :readonly="true" :show-delete="!cfIsNew"
        :edit-click="() => handleBtnAction('preview-form-edit')"
        :save-click="() => handleBtnAction('preview-form-save')"
        :delete-click="() => handleBtnAction('preview-form-delete')"
        :cancel-click="() => handleBtnAction('preview-form-cancel')"
        :close-click="() => handleBtnAction('preview-form-close')" />
    </div>
    <!-- ===== □.□. 미리보기 ================================================== -->
  </div>
  <!-- ===== □.■. 탭 컨텐츠 =================================================== -->
<!-- 발급대상 피커 모달 -->
<bo-cm-popup-modal v-if="coUtil.cofAnd(showTargetPicker, form.discntTargetCd==='SELECTED_PROD')" popup-cmd="cmPopup-target-prod-pick" popup-code="prodByCategory" :init-selected-ids="form.issueTargets.map(t => t.targetId)" :on-callback="fnCallbackModal" />
<bo-cm-popup-modal v-if="coUtil.cofAnd(showTargetPicker, form.discntTargetCd==='CATEGORY')" popup-cmd="cmPopup-target-category-pick" popup-code="category" :on-callback="fnCallbackModal" />
<bo-cm-popup-modal v-if="coUtil.cofAnd(showTargetPicker, form.discntTargetCd==='BRAND')" popup-cmd="cmPopup-target-brand-pick" popup-code="brand" :on-callback="fnCallbackModal" />
<bo-cm-popup-modal v-if="coUtil.cofAnd(showTargetPicker, form.discntTargetCd==='VENDOR')" popup-cmd="cmPopup-vendor-target-pick" popup-code="vendor" :show="true" :on-callback="fnCallbackModal" />
</bo-container>
<!-- ===== □. 상세 카드 (제목 + 탭바 + 탭컨텐츠) =============================== -->
</div>
`
};
