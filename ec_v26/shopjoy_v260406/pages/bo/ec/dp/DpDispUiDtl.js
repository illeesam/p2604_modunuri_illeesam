/* ShopJoy Admin - 전시UI 상세/등록 (탭 + 우측 미리보기) */
window.DpDispUiDtl = {
  name: 'DpDispUiDtl',
  props: {
    navigate:      { type: Function, required: true }, // 페이지 이동
    dtlId:         { type: String, default: null }, // 수정 대상 ID
    dtlMode:       { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    active:        { type: Boolean, default: true }, // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 }, // 부모 Mng 가 ++ 로 신호 보내면 상세 API 재조회 (정책: 행상세/행수정 클릭 시 항상 호출)
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, onMounted, watch, nextTick } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달
    const codes = reactive({ disp_ui_types: [], use_yn: [] });
    const uis = reactive([]);                      // UI 목록 (조회 결과)
    const areas = reactive([]);                    // 영역 목록 (조회 결과)
    const uiState = reactive({ expanded: false, loading: false, pickOpen: false, showComponentTooltip: false, isPageCodeLoad: false, error: null, activeTab: 'base', previewMode: 'default', previewPaneWidth: 520, pickSearchValue: '' });
    const activeTab = Vue.toRef(uiState, 'activeTab');
    const previewMode = Vue.toRef(uiState, 'previewMode');
    const expanded = Vue.toRef(uiState, 'expanded');
    const pickOpen = Vue.toRef(uiState, 'pickOpen');
    const previewPaneWidth = Vue.toRef(uiState, 'previewPaneWidth');
    const showComponentTooltip = Vue.toRef(uiState, 'showComponentTooltip');

    /* ===== 표시경로 선택 모달 ===== */
    const pathPickModal = reactive({ show: false, target: null });

    /* -- 기본 기간: 오늘 ~ +10년 -- */
    const _today = new Date();
    /* _pad — 패딩 */
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START_DATE = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END_DATE   = `${_today.getFullYear()+10}-12-31`;

    const form = reactive({
      codeId: null, codeGrp: 'DISP_UI',
      codeValue: '', codeLabel: '',
      uiType: 'FO',
      remark: '', sortOrd: 1, useYn: 'Y', useStartDate: DEFAULT_START_DATE, useEndDate: DEFAULT_END_DATE, regDate: '', displayPath: '', pathId: null,
      titleYn: 'N', title: '', htmlDesc: '',
    });

    const errors = reactive({});
    const schema = yup.object({
      codeValue: yup.string().required('UI코드를 입력해주세요.'),
      codeLabel: yup.string().required('UI명을 입력해주세요.'),
    });

    const cfIsNew = computed(() => !props.dtlId);

    /* 디바이스 모드 + 스플리터 */
    const PREVIEW_MODES = [
      { value: 'default', label: '기본',   width: 480  },
      { value: 'pc',      label: 'PC',     width: 1200 },
      { value: 'tablet',  label: '태블릿', width: 768  },
      { value: 'mobile',  label: '모바일', width: 375  },
    ];

    /* -- UI-영역 전시 환경 멀티체크 토글 -- */
    const uiDispEnvOptions = [
      { code: 'PROD', label: 'PROD' },
      { code: 'DEV',  label: 'DEV' },
      { code: 'TEST', label: 'TEST' },
    ];

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ DpDispUiDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장 (신규 등록 또는 수정)
      if (cmd === 'form-save') {
        return handleSave();
      // 폼 편집 취소 → 상세영역 유지 + 빈 신규 폼으로 초기화 (영역 사라지지 않음)
      } else if (cmd === 'form-cancel') {
        return props.navigate('__cancelEdit__');
      // 폼 닫기 → 상세영역 유지 + 빈 신규 폼으로 초기화
      } else if (cmd === 'form-close') {
        return props.navigate('__cancelEdit__');
      // 헤더 영역 펼치기/접기 토글
      } else if (cmd === 'form-toggleExpand') {
        uiState.expanded = !uiState.expanded;
        return;
      // UI 미리보기 새 창
      } else if (cmd === 'preview-uiOpen') {
        return openUiPreview();
      // 영역 미리보기 새 창 (FO/BO)
      } else if (cmd === 'preview-areaOpen') {
        return openAreaPreview(param);
      // 영역 추가 픽 모달 열기
      } else if (cmd === 'pickModal-open') {
        if (cfIsNew.value) { return; }
        return openPick();
      // 영역 추가 픽 모달 닫기
      } else if (cmd === 'pickModal-close') {
        return closePick();
      // 표시경로 선택 모달 열기
      } else if (cmd === 'pathModal-open') {
        return openPathPick(param);
      // 표시경로 선택 모달 닫기
      } else if (cmd === 'pathModal-close') {
        return closePathPick();
      // 영역 편집 페이지로 이동
      } else if (cmd === 'areas-editPage') {
        return props.navigate('dpDispAreaMng');
      // 활성 영역을 UI에서 제거
      } else if (cmd === 'areas-removeActive') {
        if (cfActiveArea.value) { return removeArea(cfActiveArea.value); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ DpDispUiDtl.js : handleSelectAction -> ', cmd, param);
      // 좌측 탭 선택 (base 또는 area_{id})
      if (cmd === 'tab-select') {
        uiState.activeTab = param;
        return;
      // 영역 순서 위/아래 이동
      } else if (cmd === 'areas-move') {
        return moveArea(param.idx, param.dir);
      // 디바이스 미리보기 모드 변경
      } else if (cmd === 'preview-mode') {
        uiState.previewMode = param;
        return;
      // 스플리터 드래그
      } else if (cmd === 'preview-split') {
        return onSplitDrag(param);
      // 공개대상 토글
      } else if (cmd === 'areaVisibility-toggle') {
        return toggleAreaVisibility(param);
      // 전시환경 토글
      } else if (cmd === 'uiDispEnv-toggle') {
        return toggleUiDispEnv(param);
      // 영역 픽 모달에서 영역 선택
      } else if (cmd === 'pickModal-select') {
        return onAreaPicked(param);
      // 표시경로 모달에서 경로 선택
      } else if (cmd === 'pathModal-pick') {
        return onPathPicked(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };


    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ DpDispUiDtl : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'area-pick') {
        if (result == null) {
            return closePick();
        }
          return onAreaPicked(result);
      } else if (cmd === 'path-pick') {
        if (result == null) {
            return closePathPick();
        }
        return onPathPicked(result);
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.disp_ui_types = codeStore.sgGetGrpCodes('DISP_UI_TYPE');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* handleLoadData — UI/영역 로드 */
    const handleLoadData = async () => {
      uiState.loading = true;
      try {
        const [resUi, resArea] = await Promise.all([
          boApiSvc.dpUi.getPage({ pageNo: 1, pageSize: 10000 }, '전시UI관리', '상세조회'),
          boApiSvc.dpArea.getPage({ pageNo: 1, pageSize: 10000 }, '전시UI관리', '영역조회'),
        ]);
        uis.splice(0, uis.length, ...(resUi.data?.data?.pageList || resUi.data?.data?.list || []));
        areas.splice(0, areas.length, ...(resArea.data?.data?.pageList || resArea.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* openPathPick — 경로 선택 열기 */
    const openPathPick = (target) => { pathPickModal.target = target; pathPickModal.show = true; };

    /* closePathPick — 경로 선택 닫기 */
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.target = null; };

    /* onPathPicked — 경로 선택 이벤트 */
    const onPathPicked = (pathId) => { if (pathPickModal.target === 'form') form.pathId = pathId; };

    /* pathLabel — 경로 라벨 */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    /* handleInitForm — 폼 초기화 */
    const handleInitForm = async () => {
      if (!cfIsNew.value) {
        const findInUis = () => uis.find(d => String(d.uiId || d.dispId || d.codeId) === String(props.dtlId));
        let u = findInUis();
        if (u) {
          Object.assign(form, { ...u });
          /* DpUiDto.Item → form 별칭 매핑 (Entity 기준) */
          form.codeId       = u.uiId         ?? form.codeId;
          form.codeValue    = u.uiCd         ?? form.codeValue;
          form.codeLabel    = u.uiNm         ?? form.codeLabel;
          form.uiType       = u.deviceTypeCd ?? form.uiType;
          form.remark       = u.uiDesc       ?? form.remark;
          form.sortOrd      = u.sortOrd      ?? form.sortOrd;
          form.useYn        = u.useYn        ?? form.useYn;
          form.useStartDate = u.useStartDate ?? form.useStartDate;
          form.useEndDate   = u.useEndDate   ?? form.useEndDate;
          form.pathId       = u.pathId       ?? form.pathId;
        }
      } else {
        form.sortOrd = uis.length ? Math.max(...uis.map(c => c.sortOrd || 0)) + 1 : 1;
        const t = new Date();
        const p = n => String(n).padStart(2, '0');
        form.regDate = `${t.getFullYear()}-${p(t.getMonth()+1)}-${p(t.getDate())}`;
        /* 자동 코드: DU_YYMMDD_HHMMSS */
        form.codeValue = `DU_${String(t.getFullYear()).slice(2)}${p(t.getMonth()+1)}${p(t.getDate())}_${p(t.getHours())}${p(t.getMinutes())}${p(t.getSeconds())}`;
      }
    };

    // ★ onMounted
    onMounted(async () => {
      if (isAppReady.value) { fnLoadCodes(); }
      await handleLoadData();
      handleInitForm();
    });

    /* policy: 부모 Mng 의 reloadTrigger 가 변할 때마다 (행상세/행수정 클릭) 상세 API 재호출 */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      Object.keys(errors).forEach(k => delete errors[k]);
      await handleLoadData();
      handleInitForm();
    });

    const cfRelatedAreas = computed(() =>
      areas.filter(c => c.codeGrp === 'DISP_AREA' && c.uiCode === form.codeValue)
           .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
    );

    const cfActiveArea = computed(() => {
      if (!activeTab.value.startsWith('area_')) { return null; }
      const id = Number(activeTab.value.replace('area_', ''));
      return cfRelatedAreas.value.find(a => a.codeId === id) || null;
    });

    /* panelsOfArea — 영역의 패널들 */
    const panelsOfArea = (areaCode) =>
      (uis || [])
        .filter(p => p.area === areaCode)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const cfPreviewFrameWidth = computed(() => {
      const m = window.safeArrayUtils.safeFind(PREVIEW_MODES, x => x.value === uiState.previewMode);
      return (m?.width || 480) + 'px';
    });

    watch(previewMode, (m) => {
      const info = window.safeArrayUtils.safeFind(PREVIEW_MODES, x => x.value === m);
      uiState.previewPaneWidth = (info?.width || 480) + 40;
    });

    /* onSplitDrag — 스플리터 드래그 */
    const onSplitDrag = (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = uiState.previewPaneWidth;
      /* onMove — 이벤트 */
      const onMove = (ev) => {
        uiState.previewPaneWidth = Math.max(260, Math.min(1600, startW + (startX - ev.clientX)));
      };
      /* onUp — 이벤트 */
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };

    /* 영역 선택 팝업 */
    const cfAvailableAreas = computed(() => {
      const all = areas.filter(c => c.codeGrp === 'DISP_AREA');
      const searchVal  = uiState.pickSearchValue.trim().toLowerCase();
      return window.safeArrayUtils.safeFilter(all, a => {
        if (a.uiCode === form.codeValue) { return false; }
        if (searchVal && !(a.codeLabel||'').toLowerCase().includes(searchVal) && !(a.codeValue||'').toLowerCase().includes(searchVal)) { return false; }
        return true;
      }).sort((a, b) => (a.codeLabel||'').localeCompare(b.codeLabel||''));
    });

    /* openPick — 픽 모달 열기 */
    const openPick  = () => { uiState.pickOpen = true; uiState.pickSearchValue = ''; };

    /* onAreaPicked — 영역 선택 */
    const onAreaPicked = (a) => {
      if (!form.codeValue) { showToast && showToast('UI코드를 먼저 입력하세요.', 'error'); return; }
      a.uiCode = form.codeValue;
      showToast && showToast(`[${a.codeLabel}] 영역을 추가했습니다.`, 'info');
      uiState.pickOpen = false;
    };

    /* closePick — 픽 모달 닫기 */
    const closePick = () => { uiState.pickOpen = false; };

    /* moveArea — 영역 이동 */
    const moveArea = (idx, dir) => {
      const arr = cfRelatedAreas.value;
      const target = idx + dir;
      if (target < 0 || target >= arr.length) { return; }
      /* sortOrd 스왑 */
      const a = arr[idx], b = arr[target];
      const tmp = a.sortOrd; a.sortOrd = b.sortOrd; b.sortOrd = tmp;
      showToast && showToast(`[${a.codeLabel}] 순서가 ${dir < 0 ? '위로' : '아래로'} 이동되었습니다.`, 'info');
    };

    /* removeArea — 영역 제거 */
    const removeArea = (a) => {
      showConfirm && showConfirm({
        title: 'UI에서 제거',
        message: `[${a.codeLabel}] 영역을 이 UI에서 제거하시겠습니까?`,
        onOk: () => {
          a.uiCode = '';
          showToast && showToast('제거되었습니다.', 'info');
        },
      });
    };

    /* -- 공개 대상 (UI-Area 매핑) -- */
    const cfVisibilityOptions = computed(() => window.visibilityUtil.allOptions());

    /* hasAreaVisibility — 공개대상 포함 여부 */
    const hasAreaVisibility = (code) => {
      if (!cfActiveArea.value) { return false; }
      if (!cfActiveArea.value.visibilityTargets) { cfActiveArea.value.visibilityTargets = '^PUBLIC^'; }
      return window.visibilityUtil.has(cfActiveArea.value.visibilityTargets, code);
    };

    /* toggleAreaVisibility — 공개대상 토글 */
    const toggleAreaVisibility = (code) => {
      if (!cfActiveArea.value) { return; }
      if (!cfActiveArea.value.visibilityTargets) { cfActiveArea.value.visibilityTargets = '^PUBLIC^'; }
      const list = window.visibilityUtil.parse(cfActiveArea.value.visibilityTargets);
      const i = list.indexOf(code);
      if (i >= 0) list.splice(i, 1); else list.push(code);
      if (code === 'PUBLIC' && i < 0) {
        cfActiveArea.value.visibilityTargets = '^PUBLIC^';
        return;
      }
      const filtered = window.safeArrayUtils.safeFilter(list, c => c !== 'PUBLIC' || code === 'PUBLIC');
      cfActiveArea.value.visibilityTargets = window.visibilityUtil.serialize(filtered);
    };

    /* hasUiDispEnv — 전시환경 포함 여부 */
    const hasUiDispEnv = (code) => {
      if (!cfActiveArea.value) { return false; }
      if (!cfActiveArea.value.uiDispEnv) { cfActiveArea.value.uiDispEnv = '^PROD^'; }
      return cfActiveArea.value.uiDispEnv.includes('^' + code + '^');
    };

    /* toggleUiDispEnv — 전시환경 토글 */
    const toggleUiDispEnv = (code) => {
      if (!cfActiveArea.value) { return; }
      if (!cfActiveArea.value.uiDispEnv) { cfActiveArea.value.uiDispEnv = '^PROD^'; }
      const envList = cfActiveArea.value.uiDispEnv.split('^').filter(e => e && e !== 'NONE');
      const i = envList.indexOf(code);
      if (i >= 0) envList.splice(i, 1); else envList.push(code);
      cfActiveArea.value.uiDispEnv = envList.length > 0 ? '^' + envList.join('^') + '^' : '^NONE^';
    };

    /* openUiPreview — UI 미리보기 새 창 */
    const openUiPreview = () => {
      if (!form.codeValue) { return showToast && showToast('UI코드를 먼저 입력하세요.', 'error'); }
      window.open(`${window.pageUrl('index.html')}`, '_blank', 'width=1280,height=900');
    };

    /* openAreaPreview — 영역 미리보기 새 창 */
    const openAreaPreview = (scope) => {
      if (!cfActiveArea.value) { return showToast && showToast('미리볼 영역을 선택하세요.', 'error'); }
      const file = scope === 'bo' ? 'disp-bo-ui.html' : 'disp-fo-ui.html';
      window.open(`${window.pageUrl(file)}?areas=${cfActiveArea.value.codeValue}&date=${form.regDate}&time=00:00`,
        '_blank', 'width=1280,height=900');
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      form.codeValue = (form.codeValue || '').toUpperCase();
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        (err.inner || []).forEach(e => { errors[e.path] = e.message; });
        showToast && showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      if (!/^[A-Z0-9_]+$/.test(form.codeValue || '')) {
        errors.codeValue = '영문 대문자·숫자·_ 만 가능합니다.';
        showToast && showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const isNewUi = cfIsNew.value;
      const ok = await showConfirm('저장', isNewUi ? '신규 UI를 등록하시겠습니까?' : 'UI 정보를 수정하시겠습니까?');
      if (!ok) { return; }
      /* form 별칭 → DpUi Entity 필드 매핑 */
      const body = { ...form };
      body.uiId         = form.codeId    || form.uiId || null;
      body.uiCd         = form.codeValue || form.uiCd;
      body.uiNm         = form.codeLabel || form.uiNm;
      body.deviceTypeCd = form.uiType    || form.deviceTypeCd;
      body.uiDesc       = form.remark    || form.uiDesc;
      body.sortOrd      = form.sortOrd;
      body.useYn        = form.useYn;
      body.useStartDate = form.useStartDate;
      body.useEndDate   = form.useEndDate;
      body.pathId       = form.pathId;
      try {
        const res = await (isNewUi ? boApiSvc.dpUi.create(body, '전시UI관리', '등록') : boApiSvc.dpUi.update(body.uiId, body, '전시UI관리', '저장'));
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('dpDispUiMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // 폼 컬럼 정의 (BoFormArea :columns) - UI코드/UI명/UI유형
    const baseUiFormColumns = [
      { key: 'codeValue', label: 'UI코드', type: 'text', required: true,
        placeholder: 'FRONT_MAIN', mono: true,
        onChange: (v, f) => { f.codeValue = (f.codeValue || '').toUpperCase(); } },
      { key: 'codeLabel', label: 'UI명', type: 'text', required: true, placeholder: '프론트 메인' },
      { key: 'uiType',    label: 'UI유형', type: 'select', nullable: false,
        options: () => codes.disp_ui_types },
    ];
    // 정렬/사용여부/설명
    const settingUiFormColumns = [
      { key: 'sortOrd',  label: '정렬 순서', type: 'number' },
      { key: 'useYn',    label: '사용 여부', type: 'select', options: () => codes.use_yn },
      { key: 'remark',   label: '설명', type: 'text', placeholder: 'UI 설명', colSpan: 2 },
    ];
    // 표시경로 picker
    const pathPickFormColumns = [
      { key: 'pathId', label: '표시경로', type: 'slot', name: 'pathPick', colSpan: 3,
        hint: 'UI가 노출되는 경로 (예: FO.모바일메인)' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      codes, uis, areas, uiState, pathPickModal, form, errors,                       // 상태 / 데이터
      baseUiFormColumns, settingUiFormColumns, pathPickFormColumns,                  // 컬럼 정의
      handleBtnAction, handleSelectAction, fnCallbackModal,                            // dispatch + 모달 통합 콜백
      cfIsNew, cfRelatedAreas, cfActiveArea, cfPreviewFrameWidth,                    // computed
      cfAvailableAreas, cfVisibilityOptions,                                         // computed
      activeTab, previewMode, expanded, pickOpen, previewPaneWidth,                  // toRef
      showComponentTooltip,                                                          // toRef
      PREVIEW_MODES, uiDispEnvOptions,                                               // 상수
      panelsOfArea, pathLabel,                                                       // 헬퍼
      hasAreaVisibility, hasUiDispEnv,                                               // 헬퍼
    };
  },
  template: /* html */`
<div class="card" style="padding:0;overflow:hidden;">
  <!-- ===== ■. 헤더 ====================================================== -->
  <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #eee;background:#fafafa;">
    <div style="font-size:16px;font-weight:700;color:#222;">
      전시
      <span style="color:#e8587a;">
        UI
      </span>
      {{ !active ? '상세' : (cfIsNew ? '등록' : '수정') }}
      <span v-if="active && !cfIsNew" style="font-size:12px;color:#888;font-weight:400;margin-left:6px;">
        #{{ form.codeId }}
      </span>
      <span v-if="!active" style="font-size:12px;color:#bbb;margin-left:8px;font-weight:400;">
        목록에서 행을 선택하거나 [✚ 신규등록]을 누르세요
      </span>
    </div>
    <div v-if="active" style="display:flex;gap:8px;align-items:center;">
      <button class="btn btn-sm" :disabled="cfIsNew"
        :style="cfIsNew ? 'background:#f5f5f5;border:1px solid #ddd;color:#bbb;cursor:not-allowed;' : 'background:#e3f2fd;border:1px solid #90caf9;color:#1565c0;font-weight:600;'"
        :title="cfIsNew ? '저장 후 영역을 추가할 수 있습니다.' : ''"
        @click="handleBtnAction('pickModal-open')">
        ✚ 전시영역추가
      </button>
      <span style="font-size:12px;color:#888;margin-right:10px;">
        연결된 영역:
        <span style="background:#e3f2fd;color:#1565c0;border-radius:10px;padding:1px 8px;font-weight:700;margin-left:4px;">
          {{ cfRelatedAreas.length }}개
        </span>
      </span>
      <button class="btn btn-sm" style="background:#f5f0ff;border:1px solid #b39ddb;color:#6a1b9a;" @click="handleBtnAction('preview-uiOpen')">
        🖼 UI미리보기
      </button>
      <button class="btn btn-sm" style="background:#e0f2fe;border:1px solid #bae6fd;color:#0369a1;" @click="handleBtnAction('preview-areaOpen', 'fo')">
        👁 사용자 미리보기
      </button>
      <button class="btn btn-sm" style="background:#fef3eb;border:1px solid #f5e8de;color:#c2410c;" @click="handleBtnAction('preview-areaOpen', 'bo')">
        👁 관리자 미리보기
      </button>
      <button class="btn btn-secondary btn-sm" @click="handleBtnAction('form-toggleExpand')">
        {{ expanded ? '📥 접기' : '📤 펼치기' }}
      </button>
      <button class="btn btn-primary btn-sm" @click="handleBtnAction('form-save')" style="font-weight:700;">
        💾 저장
      </button>
    </div>
  </div>
  <!-- ===== □. 헤더 ====================================================== -->
  <!-- ===== ■. 안내 배너 =================================================== -->
  <div style="background:linear-gradient(135deg,#e3f2fd 0%,#f3e5f5 100%);border:1px solid #90caf9;border-radius:8px;padding:12px 14px;margin:12px 20px;font-size:11px;color:#444;line-height:1.6;">
    <div style="font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
      <span>
        ℹ️ 여부 및 기간 관리 안내
      </span>
    </div>
    <ul style="margin:0;padding-left:18px;">
      <li>
        배치로 매시 55분에
        <b>
          전시여부, 사용여부
        </b>
        정보가 자동 반영됩니다
      </li>
      <li>
        전시관리정보 수정 후 저장하면
        <b>
          전시여부, 사용여부
        </b>
        정보가 즉시 반영됩니다
      </li>
    </ul>
  </div>
  <!-- ===== □. 안내 배너 =================================================== -->
  <!-- ===== ■. 본문 ====================================================== -->
  <div style="display:flex;min-height:520px;">
    <!-- ===== ■.■. 좌측 탭 ================================================== -->
    <div style="width:160px;background:#f4f5f8;border-right:1px solid #e8ebef;padding:12px 8px;flex-shrink:0;">
      <div @click="handleSelectAction('tab-select', 'base')"
        :style="{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'9px 12px',borderRadius:'8px',cursor:'pointer',marginBottom:'6px',
        fontSize:'12px',fontWeight: activeTab==='base'?'700':'500',
        background: activeTab==='base' ? '#fff' : 'transparent',
        color: activeTab==='base' ? '#e8587a' : '#555',
        border: '1px solid '+(activeTab==='base' ? '#e8587a' : 'transparent'),
        }">
        <span>
          📋 UI
          <b>
            기본정보
          </b>
        </span>
      </div>
      <div v-for="(a, i) in cfRelatedAreas" :key="a?.codeId"
        @click="handleSelectAction('tab-select', 'area_'+a.codeId)"
        :style="{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'8px 12px',borderRadius:'8px',cursor:'pointer',marginBottom:'4px',
        fontSize:'12px',
        background: activeTab==='area_'+a.codeId ? '#fff' : 'transparent',
        color: activeTab==='area_'+a.codeId ? '#1565c0' : '#666',
        border: '1px solid '+(activeTab==='area_'+a.codeId ? '#1565c0' : 'transparent'),
        }">
        <span>
          영역 {{ i+1 }}. {{ a.codeLabel }}
        </span>
        <span v-if="activeTab==='area_'+a.codeId" style="display:flex;gap:2px;">
          <button @click.stop="handleSelectAction('areas-move', { idx: i, dir: -1 })" :disabled="i===0" title="위로"
            style="font-size:9px;border:1px solid #e0e0e0;border-radius:3px;background:#fff;cursor:pointer;padding:1px 4px;line-height:1.2;color:#888;"
            :style="i===0?'opacity:0.3;cursor:default;':''">
            ▲
          </button>
          <button @click.stop="handleSelectAction('areas-move', { idx: i, dir: 1 })" :disabled="i===cfRelatedAreas.length-1" title="아래로"
            style="font-size:9px;border:1px solid #e0e0e0;border-radius:3px;background:#fff;cursor:pointer;padding:1px 4px;line-height:1.2;color:#888;"
            :style="i===cfRelatedAreas.length-1?'opacity:0.3;cursor:default;':''">
            ▼
          </button>
        </span>
      </div>
      <div style="margin-top:8px;display:flex;flex-direction:column;gap:4px;">
        <button @click="handleBtnAction('pickModal-open')" :disabled="cfIsNew"
          :title="cfIsNew ? '저장 후 영역을 추가할 수 있습니다.' : ''"
          :style="cfIsNew ? 'padding:7px;border:1px solid #e0e0e0;background:#f5f5f5;color:#bbb;border-radius:8px;font-size:11px;font-weight:600;cursor:not-allowed;' : 'padding:7px;border:1px solid #90caf9;background:#e3f2fd;color:#1565c0;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;'">
          ✚ 기존 영역 추가
        </button>
      </div>
    </div>
    <!-- ===== □.□. 좌측 탭 ================================================== -->
    <!-- ===== ■.■. 중앙 본문 ================================================= -->
    <div style="flex:1;padding:20px;min-width:0;overflow-y:auto;">
      <!-- ===== ■.■.■. 기본정보 탭 ============================================== -->
      <div v-if="activeTab==='base'">
        <!-- ===== ■.■.■.■. 설정 ================================================ -->
        <div style="margin-bottom:14px;padding:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
          <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
            <span style="display:inline-block;width:4px;height:16px;background:#1d4ed8;border-radius:2px;">
            </span>
            설정
          </div>
          <!-- ===== ■.■.■.■.■. UI코드/UI명/UI유형 (BoFormArea 자동 렌더) ================ -->
          <bo-form-area :columns="baseUiFormColumns" :form="form" :errors="errors"
            :readonly="false" :cols="3" compact :show-actions="false" />
          <!-- ===== ■.■.■.■.■. 표시경로 (BoFormArea 자동 렌더) ========================= -->
          <bo-form-area :columns="pathPickFormColumns" :form="form" :errors="{}"
            :cols="3" compact :show-actions="false">
            <template #pathPick>
              <div :style="{padding:'7px 10px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'12px',background:'#f5f5f7',color:form.pathId!=null?'#374151':'#9ca3af',fontWeight:form.pathId!=null?600:400,display:'flex',alignItems:'center',gap:'8px',fontFamily:'monospace'}">
                <span style="flex:1;">
                  {{ pathLabel(form.pathId) || '경로 선택...' }}
                </span>
                <button type="button" @click="handleBtnAction('pathModal-open', 'form')" title="표시경로 선택"
                  :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'24px',height:'24px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'12px',color:'#6b7280',padding:'0'}"
                  @mouseover="$event.currentTarget.style.background='#eef2ff'"
                  @mouseout="$event.currentTarget.style.background='#fff'">
                  🔍
                </button>
              </div>
            </template>
          </bo-form-area>
          <!-- ===== ■.■.■.■.■. 정렬순서/사용여부/설명 (BoFormArea 자동 렌더) ================= -->
          <bo-form-area :columns="settingUiFormColumns" :form="form" :errors="errors"
            :readonly="false" :cols="3" compact :show-actions="false" />
          <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin-bottom:6px;">
            📅 사용기간
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <input type="date" class="form-control" v-model="form.useStartDate" style="width:150px;margin:0;" />
            <span style="color:#aaa;font-size:13px;padding:0 4px;">
              ~
            </span>
            <input type="date" class="form-control" v-model="form.useEndDate" style="width:150px;margin:0;" />
          </div>
        </div>
        <!-- ===== ■.■.■.■. 제목 ================================================ -->
        <div style="margin-bottom:14px;padding:14px;background:#faf8ff;border:1px solid #e9d5ff;border-radius:8px;">
          <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
            <span style="display:inline-block;width:4px;height:16px;background:#7c3aed;border-radius:2px;">
            </span>
            제목
            <span style="margin-left:auto;display:flex;align-items:center;gap:8px;">
              <span style="font-size:11px;font-weight:600;color:#888;">
                타이틀 표시
              </span>
              <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;font-weight:500;color:#444;">
                <input type="radio" v-model="form.titleYn" value="Y" />
                표시
              </label>
              <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;font-weight:500;color:#444;">
                <input type="radio" v-model="form.titleYn" value="N" />
                미표시
              </label>
            </span>
          </div>
          <div v-if="form.titleYn==='Y'" style="display:flex;align-items:center;gap:10px;">
            <label style="font-size:12px;font-weight:600;color:#555;width:50px;flex-shrink:0;">
              타이틀
            </label>
            <input class="form-control" v-model="form.title" placeholder="타이틀 텍스트" style="margin:0;flex:1;" />
          </div>
        </div>
        <!-- ===== /제목 ======================================================== -->
        <!-- ===== ■.■.■.■. 내용 ================================================ -->
        <div style="margin-bottom:14px;padding:14px;background:#fff8fa;border:1px solid #fce4ec;border-radius:8px;">
          <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
            <span style="display:inline-block;width:4px;height:16px;background:#e8587a;border-radius:2px;">
            </span>
            내용
          </div>
          <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin-bottom:6px;">
            📝 UI코멘트
          </div>
          <base-html-editor v-model="form.htmlDesc" height="280px" />
        </div>
        <!-- ===== /내용 ======================================================== -->
      </div>
      <!-- ===== ■.■.■. 영역 탭 ================================================ -->
      <div v-else-if="cfActiveArea">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div>
            <code style="font-size:11px;background:#f0f2f5;padding:2px 8px;border-radius:4px;">{{ cfActiveArea.codeValue }}</code>
              <span style="font-size:15px;font-weight:700;color:#222;margin-left:8px;">
                {{ cfActiveArea.codeLabel }}
              </span>
            </div>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-blue btn-sm" @click="handleBtnAction('areas-editPage')">
                영역 편집
              </button>
              <button class="btn btn-danger btn-sm" @click="handleBtnAction('areas-removeActive')">
                UI에서 제거
              </button>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12px;color:#555;margin-bottom:12px;">
            <span>
              <b style="color:#888;">
                유형:
              </b>
              {{ cfActiveArea.areaType || '-' }}
            </span>
            <span>
              <b style="color:#888;">
                표시:
              </b>
              {{ cfActiveArea.layoutType==='dashboard' ? '🧩 대시보드' : '🔲 그리드 '+(cfActiveArea.gridCols||1)+'열' }}
            </span>
            <span>
              <b style="color:#888;">
                순서:
              </b>
              {{ cfActiveArea.sortOrd != null ? cfActiveArea.sortOrd : '-' }}
            </span>
            <span>
              <b style="color:#888;">
                포함 패널:
              </b>
              {{ panelsOfArea(cfActiveArea.codeValue).length }}개
            </span>
            <span v-if="cfActiveArea.remark" style="flex:1 1 100%;">
              <b style="color:#888;">
                설명:
              </b>
              {{ cfActiveArea.remark }}
            </span>
          </div>
          <!-- ===== ■.■.■.■. 설정 ================================================ -->
          <div style="margin-bottom:14px;padding:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
            <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:4px;height:16px;background:#1d4ed8;border-radius:2px;">
              </span>
              설정
            </div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap;">
              <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#555;padding:5px 10px;background:#f0f0f0;border-radius:6px;cursor:pointer;">
                <span>
                  전시여부
                </span>
                <input type="checkbox" v-model="cfActiveArea.uiDispYn" :true-value="'Y'" :false-value="'N'" style="accent-color:#e8587a;" />
                <span>
                  {{ cfActiveArea.uiDispYn === 'Y' ? '전시' : '숨김' }}
                </span>
              </label>
              <span style="font-size:10px;color:#aaa;">
                (배치로 자동 관리됨)
              </span>
            </div>
            <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin-bottom:6px;">
              📅 전시기간
              <span style="font-size:10px;color:#aaa;font-weight:400;">
                (미설정 시 영역 기간 사용)
              </span>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;background:#f9fafb;padding:10px 12px;border-radius:6px;border:1px solid #e5e7eb;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:11px;color:#888;white-space:nowrap;width:28px;">
                  시작
                </span>
                <bo-date-time-picker v-model:date="cfActiveArea.uiDispStartDate" v-model:time="cfActiveArea.uiDispStartTime" />
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:11px;color:#888;white-space:nowrap;width:28px;">
                  종료
                </span>
                <bo-date-time-picker v-model:date="cfActiveArea.uiDispEndDate" v-model:time="cfActiveArea.uiDispEndTime" />
              </div>
            </div>
            <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin:10px 0 6px;">
              🌍 전시환경
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
              <label v-for="opt in uiDispEnvOptions" :key="opt?.code"
              :style="{
              display:'inline-flex',alignItems:'center',gap:'6px',padding:'6px 12px',borderRadius:'6px',
              border:'1px solid '+(hasUiDispEnv(opt.code)?'#7c3aed':'#ddd'),
              background:hasUiDispEnv(opt.code)?'#f3e8ff':'#fafafa',
              color:hasUiDispEnv(opt.code)?'#7c3aed':'#666',
              fontSize:'12px',fontWeight:hasUiDispEnv(opt.code)?700:500,
              cursor:'pointer',
              }">
                <input type="checkbox" :checked="hasUiDispEnv(opt.code)"
                @change="handleSelectAction('uiDispEnv-toggle', opt.code)"
                style="accent-color:#7c3aed;" />
                {{ opt.label }}
              </label>
            </div>
            <!-- ===== ■.■.■.■.■.■. 헤더 영역 =========================================== -->
            <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin:10px 0 6px;">
              🔒 공개대상 (하나라도 해당하면 노출)
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:4px;">
              <label v-for="opt in cfVisibilityOptions" :key="opt?.codeValue"
              :style="{
              display:'inline-flex',alignItems:'center',gap:'6px',padding:'6px 12px',borderRadius:'16px',
              border:'1px solid '+(hasAreaVisibility(opt.codeValue)?'#1565c0':'#ddd'),
              background:hasAreaVisibility(opt.codeValue)?'#e3f2fd':'#fafafa',
              color:hasAreaVisibility(opt.codeValue)?'#1565c0':'#666',
              fontSize:'12px',fontWeight:hasAreaVisibility(opt.codeValue)?700:500,
              cursor:'pointer',
              }">
                <input type="checkbox" :checked="hasAreaVisibility(opt.codeValue)"
                @change="handleSelectAction('areaVisibility-toggle', opt.codeValue)"
                style="accent-color:#1565c0;" />
                {{ opt.codeLabel }}
              </label>
            </div>
            <div v-if="!cfActiveArea.visibilityTargets" style="font-size:11px;color:#d32f2f;">
              ⚠ 선택 없음 — 아무에게도 노출되지 않습니다.
            </div>
          </div>
          <!-- ===== /설정 ======================================================== -->
          <!-- ===== ■.■.■.■. 내용 ================================================ -->
          <div style="margin-bottom:14px;padding:14px;background:#fff8fa;border:1px solid #fce4ec;border-radius:8px;">
            <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:4px;height:16px;background:#e8587a;border-radius:2px;">
              </span>
              내용
              <span style="margin-left:auto;font-size:12px;color:#888;font-weight:500;">
                패널 {{ panelsOfArea(cfActiveArea.codeValue).length }}개
              </span>
            </div>
            <div v-if="panelsOfArea(cfActiveArea.codeValue).length" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">
              <div v-for="(p, pi) in panelsOfArea(cfActiveArea.codeValue)" :key="pi"
              style="padding:10px 12px;border:1px solid #e0e4ea;border-radius:8px;background:#fafbfc;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                  <span style="font-size:11px;color:#aaa;">
                    #{{ p.sortOrder || (pi+1) }}
                  </span>
                  <span class="badge" :class="p.status==='활성'?'badge-green':'badge-gray'" style="font-size:10px;">
                    {{ p.status }}
                  </span>
                </div>
                <div style="font-size:12px;color:#333;font-weight:600;margin-bottom:2px;">
                  {{ p.name }}
                </div>
                <div style="font-size:10px;color:#aaa;">
                  위젯 {{ (p.rows||[]).length }}개
                </div>
              </div>
            </div>
            <div v-else style="padding:16px;text-align:center;color:#bbb;font-size:12px;border:1px dashed #e0e4ea;border-radius:8px;">
              연결된 패널이 없습니다.
            </div>
          </div>
          <!-- ===== /내용 ======================================================== -->
        </div>
      </div>
      <!-- ===== □.□. 중앙 본문 ================================================= -->
      <!-- ===== ■.■. 스플리터 ================================================== -->
      <div @mousedown="e => handleSelectAction('preview-split', e)"
      style="width:6px;cursor:col-resize;background:#e8e8e8;flex-shrink:0;position:relative;"
      title="드래그로 폭 조절">
        <div style="position:absolute;top:50%;left:1px;transform:translateY(-50%);width:4px;height:32px;background:#bbb;border-radius:2px;">
        </div>
      </div>
      <!-- ===== □.□. 스플리터 ================================================== -->
      <!-- ===== ■.■. 우측 미리보기 =============================================== -->
      <div :style="{
      width: previewPaneWidth + 'px',
      background:'#fafafa',borderLeft:'1px solid #e8ebef',padding:'14px',flexShrink:0,
      transition:'width .2s', overflowX:'auto',
      }">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-size:12px;font-weight:700;color:#555;cursor:help;position:relative;"
          @mouseenter="uiState.showComponentTooltip=true" @mouseleave="uiState.showComponentTooltip=false">
            👁 {{ activeTab==='base' ? 'UI' : '영역' }} 미리보기
            <span style="position:absolute;bottom:-28px;left:0;background:#333;color:#fff;padding:4px 8px;border-radius:4px;font-size:9px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s;z-index:1000;" :style="{opacity: showComponentTooltip ? 1 : 0}">
              {{ activeTab==='base' ? '&lt;disp-x01-ui /&gt;' : '&lt;disp-x02-area /&gt;' }}
            </span>
          </span>
          <span style="font-size:10px;color:#aaa;">
            {{ cfRelatedAreas.length }}개 영역
          </span>
        </div>
        <!-- ===== ■.■.■. 디바이스 모드 ============================================= -->
        <div style="display:flex;gap:4px;margin-bottom:10px;padding:3px;background:#eef0f3;border-radius:6px;">
          <button v-for="m in PREVIEW_MODES" :key="m?.value"
          @click="handleSelectAction('preview-mode', m.value)"
          :style="{
          flex:'1',padding:'5px 0',fontSize:'11px',border:'none',borderRadius:'4px',cursor:'pointer',
          background: previewMode===m.value ? '#fff' : 'transparent',
          color: previewMode===m.value ? '#1565c0' : '#666',
          fontWeight: previewMode===m.value ? 700 : 500,
          boxShadow: previewMode===m.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }">
            {{ m.label }}
          </button>
        </div>
        <!-- ===== ■.■.■. 디바이스 프레임 ============================================ -->
        <div :style="{
        width: cfPreviewFrameWidth, margin:'0 auto', border:'1px solid #d0d7de', borderRadius:'8px',
        background:'#fff', padding:'8px', transition:'width .2s',
        }">
          <!-- ===== ■.■.■.■. UI 기본정보: 모든 영역 렌더 ================================= -->
          <div v-if="activeTab==='base'" style="max-height:560px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;">
            <div v-if="!cfRelatedAreas.length" style="padding:20px 8px;text-align:center;color:#bbb;font-size:11px;">
              연결된 영역이 없습니다.
            </div>
            <div v-for="a in cfRelatedAreas" :key="a?.codeId">
              <div style="font-size:10px;background:#222;color:#fff;padding:3px 8px;border-radius:4px 4px 0 0;display:flex;justify-content:space-between;">
                <code style="background:transparent;color:#fff;">{{ a.codeValue }}</code>
                  <span>
                    {{ a.codeLabel }} · {{ panelsOfArea(a.codeValue).length }}패널
                  </span>
                </div>
                <div style="border:1px solid #222;border-top:none;border-radius:0 0 6px 6px;padding:4px;background:#fafafa;">
                  <disp-x02-area
                :params="{ date: form.regDate || '', time: '00:00', status: '활성' }"
                :disp-opt="{ layout:'auto', showHeader:false, showBadges:false, mode:'area_detail', showDesc:false }"
                :area-item="{ code: a.codeValue, label: a.codeLabel, info: a, panels: panelsOfArea(a.codeValue) }" />
                </div>
              </div>
            </div>
            <!-- ===== ■.■.■.■. 영역 탭: 선택 영역만 렌더 =================================== -->
            <div v-else-if="cfActiveArea" style="max-height:560px;overflow-y:auto;">
              <disp-x02-area
            :params="{ date: form.regDate || '', time: '00:00', status: '활성' }"
            :disp-opt="{ layout:'auto', showHeader:true, showBadges:false, mode:'area_detail', showDesc:false }"
            :area-item="{ code: cfActiveArea.codeValue, label: cfActiveArea.codeLabel, info: cfActiveArea, panels: panelsOfArea(cfActiveArea.codeValue) }" />
            </div>
          </div>
        </div>
      </div>
      <!-- ===== □.□. 우측 미리보기 =============================================== -->
      <!-- ===== □. 본문 ====================================================== -->
      <!-- ===== ■. 영역 선택 팝업 ================================================ -->
      <area-pick-modal v-if="pickOpen"
    :title="'전시영역 추가 [' + form.codeValue + ']'"
    :areas="cfAvailableAreas"
    :exclude-ui="form.codeValue" modal-name="area-pick" :on-callback="fnCallbackModal" />
      <!-- ===== □. 영역 선택 팝업 ================================================ -->
      <!-- ===== ■. 조건부 영역 ================================================== -->
      <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="ec_disp_ui" :value="form.pathId" title="UI 표시경로 선택" modal-name="path-pick" :on-callback="fnCallbackModal" />
      <!-- ===== □. 조건부 영역 ================================================== -->
    </div>
`,
};
