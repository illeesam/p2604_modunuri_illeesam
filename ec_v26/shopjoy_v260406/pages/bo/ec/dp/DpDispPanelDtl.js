/* ShopJoy Admin - 전시관리 상세/등록 */
window.DpDispPanelDtl = {
  name: 'DpDispPanelDtl',
  props: {
    navigate:      { type: Function, required: true }, // 페이지 이동
    dtlId:         { type: String, default: null }, // 수정 대상 ID
    dtlMode:       { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    active:        { type: Boolean, default: true }, // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 }, // 부모 Mng 가 ++ 로 신호 보내면 상세 API 재조회 (정책: 행상세/행수정 클릭 시 항상 호출)
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 ################################################## */
    const { ref, reactive, computed, onMounted, watch, nextTick } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const panels = reactive([]);
    const uiState = reactive({ libPickOpen: false, loading: false, rowCopyOpen: false, showComponentTooltip: false, viewAll: false, isPageCodeLoad: false, error: null, tab: 'info', previewMode: 'default', previewPaneWidth: 520, libPickMode: 'copy' });
    const tab = Vue.toRef(uiState, 'tab');
    const previewMode = Vue.toRef(uiState, 'previewMode');
    const codes = reactive({ layout_types: [], disp_widget_types: [], active_statuses: [], disp_areas: [], click_action_opts: [{value:'none',label:'없음'},{value:'navigate',label:'페이지 이동'},{value:'event',label:'이벤트 호출'},{value:'modal',label:'모달 오픈'},{value:'url',label:'외부 URL'}] });
    const events = reactive([]);

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ DpDispPanelDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장
      if (cmd === 'form-save') {
        return handleSave();
      // 폼 편집 모드 전환
      } else if (cmd === 'form-edit') {
        return props.navigate('__switchToEdit__');
      // 폼 닫기/취소 → 상세영역 유지 + 빈 신규 폼으로 초기화 (영역 사라지지 않음)
      } else if (cmd === 'form-close') {
        return props.navigate('__cancelEdit__');
      // 전체 펼치기/탭 보기 토글
      } else if (cmd === 'form-toggleViewAll') {
        viewAll.value = !viewAll.value;
        return;
      // 전시항목 복사 모달 열기
      } else if (cmd === 'rowCopyModal-open') {
        if (cfIsNew.value) { return; }
        uiState.rowCopyOpen = true;
        return;
      // 위젯 추가
      } else if (cmd === 'panelItems-add') {
        if (cfIsNew.value) { return; }
        return addWidget();
      // 표시경로 선택 모달 열기
      } else if (cmd === 'pathModal-open') {
        return openPathPick(param);
      // 위젯Lib 픽 모달 열기
      } else if (cmd === 'libPick-open') {
        if (cfIsNew.value) { return; }
        return openLibPick(param);
      // 참조 해제
      } else if (cmd === 'libPick-refClear') {
        if (cfActiveRow.value) {
          cfActiveRow.value.refLibId = null;
          cfActiveRow.value.refLibCode = '';
          cfActiveRow.value.refLibName = '';
        }
        return;
      // 미리보기 열기
      } else if (cmd === 'preview-open') {
        return openPreview(param.tabKey, param.tabLabel);
      // 미리보기 닫기
      } else if (cmd === 'preview-close') {
        return closePreview();
      // 카드 미리보기 열기
      } else if (cmd === 'cardPreview-open') {
        return openCardPreview();
      // 카드 미리보기 닫기
      } else if (cmd === 'cardPreview-close') {
        return closeCardPreview();
      // 참조 모달
      } else if (cmd === 'refModal-open') {
        return showRefModal(param.type, param.id);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ DpDispPanelDtl.js : handleSelectAction -> ', cmd, param);
      // 탭 선택
      if (cmd === 'tab-select') {
        uiState.tab = param;
        return;
      // 탭 위/아래 이동
      } else if (cmd === 'tab-move') {
        return moveRow(param);
      // 위젯 삭제 (특정 인덱스)
      } else if (cmd === 'panelItems-remove') {
        return removeWidget(param);
      // 디바이스 미리보기 모드 변경
      } else if (cmd === 'preview-mode') {
        uiState.previewMode = param;
        return;
      // 스플리터 드래그
      } else if (cmd === 'preview-split') {
        return onSplitDrag(param);
      // 전시환경 토글
      } else if (cmd === 'dispEnv-toggle') {
        return toggleDispEnv(param);
      // 패널 전시환경 토글
      } else if (cmd === 'panelDispEnv-toggle') {
        return togglePanelDispEnv(param);
      // 공개대상 토글
      } else if (cmd === 'visibility-toggle') {
        return toggleVisibility(param);
      // 패널 공개대상 토글
      } else if (cmd === 'panelVisibility-toggle') {
        return togglePanelVisibility(param);
      // 라이브러리 선택
      } else if (cmd === 'libPick-select') {
        return onLibPicked(param);
      // 전시항목 행 복사 결과
      } else if (cmd === 'rowCopyModal-copy') {
        return onRowCopy(param);
      // 표시경로 모달 선택
      } else if (cmd === 'pathModal-pick') {
        return onPathPicked(param);
      // 섹션 토글 (펼치기 모드)
      } else if (cmd === 'section-toggle') {
        return toggleSection(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };


    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ DpDispPanelDtl : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'widget-lib-pick') {
        if (result == null) { uiState.libPickOpen = false; return; }
          return onLibPicked(result);
      } else if (cmd === 'row-pick') {
        if (result == null) { uiState.rowCopyOpen = false; return; }
          return onRowCopy(result);
      } else if (cmd === 'path-pick') {
        if (result == null) { pathPickModal.show = false; return; }
          return onPathPicked(result);
      } else if (cmd === 'disp-preview') {
        if (result == null) return closePreview();
        return;
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };
    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.layout_types = codeStore.sgGetGrpCodes('LAYOUT_TYPE');
      codes.disp_widget_types = codeStore.sgGetGrpCodes('DISP_WIDGET_TYPE');
      codes.active_statuses = codeStore.sgGetGrpCodes('ACTIVE_STATUS');
      codes.disp_areas = codeStore.sgGetGrpCodes('DISP_AREA');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // 코드 주입

    // onMounted에서 API 로드
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.dpPanel.getById(props.dtlId, '전시패널관리', '상세조회');
        const data = res.data?.data;
        if (data) {
          Object.assign(form, data);
          /* DpPanelDto.Item → form 별칭 매핑 (Entity 기준) */
          form.dispId                 = data.panelId            ?? form.dispId;
          form.name                   = data.panelNm            ?? form.name;
          form.layoutType             = data.panelTypeCd        ?? form.layoutType;
          form.status                 = data.dispPanelStatusCd  ?? form.status;
          form.panelVisibilityTargets = data.visibilityTargets  ?? form.panelVisibilityTargets;
          form.useStartDate           = data.useStartDate       ?? form.useStartDate;
          form.useEndDate             = data.useEndDate         ?? form.useEndDate;
          form.pathId                 = data.pathId             ?? form.pathId;
          /* 위젯 목록: 임베드된 panelItems 가 있으면 우선 사용, 없으면 content_json 파싱 폴백 */
          if (Array.isArray(data.panelItems) && data.panelItems.length) {
            /* DpPanelItemDto.Item → row 별칭 매핑 (Entity 기준) */
            const mapped = data.panelItems
              .slice()
              .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
              .map(it => makeRowData({
                widgetType:      it.widgetTypeCd,
                widgetTitle:     it.widgetTitle,
                title:           it.widgetTitle,
                titleYn:         it.titleShowYn || 'N',
                contentTypeCd:   it.contentTypeCd,
                widgetConfigJson: it.widgetConfigJson,
                sortOrder:       it.sortOrd,
                dispYn:          it.dispYn || 'Y',
              }));
            rows.splice(0, rows.length, ...mapped);
          } else if (data.contentJson) {
            /* 위젯 목록은 content_json 에 직렬화되어 저장됨 */
            try {
              const parsed = JSON.parse(data.contentJson);
              if (Array.isArray(parsed?.rows)) { rows.splice(0, rows.length, ...parsed.rows); }
            } catch (e) { /* contentJson 파싱 실패 무시 */ }
          }
        }
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* handleLoadData — 처리 */
    const handleLoadData = async () => {
      uiState.loading = true;
      try {
        const [eventsRes] = await Promise.all([
          boApiSvc.pmEvent.getPage({ pageNo: 1, pageSize: 10000 }, '전시패널관리', '조회'),
        ]);
        events.splice(0, events.length, ...(eventsRes.data?.data?.pageList || eventsRes.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    /* -- 표시경로 선택 모달 (sy_path) -- */
    const pathPickModal = reactive({ show: false, target: null });

    /* openPathPick — 경로 선택 열기 */
    const openPathPick = (target) => { pathPickModal.target = target; pathPickModal.show = true; };

    /* closePathPick — 경로 선택 닫기 */
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.target = null; };

    /* onPathPicked — 이벤트 */
    const onPathPicked = (pathId) => { if (pathPickModal.target === 'form') form.pathId = pathId; };

    /* fnPathLabel — 유틸 */
    const fnPathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    const cfIsNew = computed(() => !props.dtlId);
            const PREVIEW_MODES = [
      { value: 'default', label: '기본',   width: 480  },
      { value: 'pc',      label: 'PC',     width: 1200 },
      { value: 'tablet',  label: '태블릿', width: 768  },
      { value: 'mobile',  label: '모바일', width: 375  },
    ];
    const cfPreviewFrameWidth = computed(() => {
      const m = window.safeArrayUtils.safeFind(PREVIEW_MODES, x => x.value === uiState.previewMode);
      return (m?.width || 480) + 'px';
    });
    /* 패널 폭(스플리터 드래그 반영). 모드 변경 시 자동 갱신 */

        watch(previewMode, (m) => {
      const info = window.safeArrayUtils.safeFind(PREVIEW_MODES, x => x.value === m);
      uiState.previewPaneWidth = (info?.width || 480) + 40;
    });

    /* onSplitDrag — 이벤트 */
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

    /* -- 기본 기간: 오늘 ~ +10년 -- */
    const _today = new Date();

    /* _pad — 패딩 */
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START_DATE = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END_DATE   = `${_today.getFullYear()+10}-12-31`;

    const form = reactive({
      dispId: null, dispCode: '', area: 'HOME_BANNER', name: '', status: '활성',
      layoutType: 'grid', gridCols: 1,
      titleYn: 'N', title: '',
      htmlDesc: '',
      useStartDate: '', useEndDate: '',
      /* 패널 레벨 노출조건 (레거시 유지) */
      condition: '항상 표시', authRequired: false, authGrade: '',
      displayPath: '', pathId: null,
      /* 패널 레벨 전시 설정 */
      panelDispYn: 'Y',
      panelDispStartDate: '', panelDispEndDate: '',
      panelDispEnv: '^PROD^',
      panelVisibilityTargets: '^PUBLIC^',
    });

    /* makeRowData — 행 생성 */
    const makeRowData = (overrides = {}) => ({
      widgetType: 'image_banner',
      clickAction: 'none', clickTarget: '',
      sortOrder: 1,
      titleYn: 'N', title: '',
      imageUrl: '', linkUrl: '', altText: '',
      productIds: '',
      /* 조건상품 */
      condSite: '', condUser: '', condCategory: '', condBrand: '',
      condSort: 'newest', condLimit: 8,
      /* 파일목록 */
      fileListJson: '[]',
      chartTitle: '', chartType: 'bar', chartLabels: '', chartValues: '',
      textContent: '', bgColor: '#ffffff', textColor: '#222222',
      infoTitle: '', infoBody: '',
      popupWidth: 600, popupHeight: 400,
      fileUrl: '', fileLabel: '',
      couponCode: '', couponDesc: '',
      htmlContent: '',
      textareaContent: '',
      markdownContent: '',
      codeValue: '', codeFormat: 'CODE128', codeWidth: 2, codeHeight: 60,
      showCodeLabel: true, qrSize: 120, qrErrorLevel: 'M',
      videoUrl: '', videoType: 'youtube', videoAutoplay: false, videoControls: true,
      countdownTarget: '', countdownTitle: '이벤트 종료까지', countdownExpiredMsg: '이벤트가 종료되었습니다.',
      countdownBgColor: '#1a237e', countdownTextColor: '#ffffff',
      payAmount: 0, payCurrency: 'KRW', payMethods: 'card,kakao,naver,toss',
      payButtonLabel: '결제하기', payButtonColor: '#1677ff',
      approvalDocType: '구매승인', approvalTitle: '', approvalLine: '[{"role":"담당자","name":""},{"role":"팀장","name":""},{"role":"부서장","name":""}]',
      mapType: 'google', mapAddress: '', mapLat: '', mapLng: '', mapZoom: 14, mapMarkerLabel: '',
      eventId: '',
      cacheDesc: '', cacheAmount: 0,
      embedCode: '',
      /* 공개대상 (기본 전체공개) */
      visibilityTargets: '^PUBLIC^',
      /* 위젯 사용 여부 및 기간 */
      useYn: 'Y',
      useStartDate: DEFAULT_START_DATE, useEndDate: DEFAULT_END_DATE,
      /* 위젯별 전시기간 (미설정 시 패널 기간 사용) */
      dispYn: 'Y',
      dispStartDt: DEFAULT_START_DATE + 'T00:00', dispEndDt: DEFAULT_END_DATE + 'T23:59',
      /* 위젯 전시 환경 */
      dispEnv: '^DEV^',
      ...overrides,
    });

    const rows = reactive([
      makeRowData({ sortOrder: 1 }),
    ]);
    const MAX_WIDGETS = 10;

    const cfTabLabels   = computed(() => [
      { key: 'info', label: '패널기본정보' },
      ...rows.map((_, i) => ({ key: 'tab'+(i+1), label: '전시항목 '+(i+1) })),
    ]);
    const cfTabRowMap  = computed(() => { const m = {}; window.safeArrayUtils.safeForEach(rows, (_, i) => { m['tab'+(i+1)] = i; }); return m; });
    const cfRowTabKeys = computed(() => rows.map((_, i) => 'tab'+(i+1)));

    const cfActiveRowIdx = computed(() => { const idx = cfTabRowMap.value[uiState.tab]; return idx !== undefined ? idx : null; });
    const cfActiveRow    = computed(() => (cfActiveRowIdx.value !== null && cfActiveRowIdx.value !== undefined) ? rows[cfActiveRowIdx.value] : null);

    /* moveRow — 이동 */
    const moveRow = (dir) => {
      const idx = cfActiveRowIdx.value;
      if (idx === null) { return; }
      const target = idx + dir;
      if (target < 0 || target >= rows.length) { return; }
      const a = { ...rows[idx] };
      const b = { ...rows[target] };
      Object.assign(rows[idx], b);
      Object.assign(rows[target], a);
      /* 탭 순서(1~5)를 sortOrder에 반영 */
      window.safeArrayUtils.safeForEach(rows, (r, i) => { r.sortOrder = i + 1; });
      uiState.tab = cfRowTabKeys.value[target];
    };

    const cfAreas = computed(() =>
      codes.disp_areas
        .filter(c => c.useYn === 'Y')
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
    );

    const cfIsChart       = computed(() => cfActiveRow.value?.widgetType?.startsWith('chart_'));
    const cfIsProduct     = computed(() => ['product_slider','product'].includes(cfActiveRow.value?.widgetType));
    const cfIsImage       = computed(() => cfActiveRow.value?.widgetType === 'image_banner');
    const cfIsText        = computed(() => cfActiveRow.value?.widgetType === 'text_banner');
    const cfIsInfo        = computed(() => cfActiveRow.value?.widgetType === 'info_card');
    const cfIsPopup       = computed(() => cfActiveRow.value?.widgetType === 'popup');
    const cfIsFile        = computed(() => cfActiveRow.value?.widgetType === 'file');
    const cfIsFileList    = computed(() => cfActiveRow.value?.widgetType === 'file_list');
    const cfIsCoupon      = computed(() => cfActiveRow.value?.widgetType === 'coupon');
    const cfIsHtmlEditor  = computed(() => cfActiveRow.value?.widgetType === 'html_editor');
    const cfIsTextarea      = computed(() => cfActiveRow.value?.widgetType === 'textarea');
    const cfIsMarkdown      = computed(() => cfActiveRow.value?.widgetType === 'markdown');
    const cfIsBarcode       = computed(() => cfActiveRow.value?.widgetType === 'barcode');
    const cfIsQrcode        = computed(() => cfActiveRow.value?.widgetType === 'qrcode');
    const cfIsBarcodeQr     = computed(() => cfActiveRow.value?.widgetType === 'barcode_qrcode');
    const cfIsCodeWidget    = computed(() => cfIsBarcode.value || cfIsQrcode.value || cfIsBarcodeQr.value);
    const cfIsVideoPlayer   = computed(() => cfActiveRow.value?.widgetType === 'video_player');
    const cfIsCountdown     = computed(() => cfActiveRow.value?.widgetType === 'countdown');
    const cfIsPayment       = computed(() => cfActiveRow.value?.widgetType === 'payment_widget');
    const cfIsApproval      = computed(() => cfActiveRow.value?.widgetType === 'approval_widget');
    const cfIsMapWidget     = computed(() => cfActiveRow.value?.widgetType === 'map_widget');
    const cfIsEventBanner   = computed(() => cfActiveRow.value?.widgetType === 'event_banner');
    const cfIsCacheBanner = computed(() => cfActiveRow.value?.widgetType === 'cache_banner');
    const cfIsWidgetEmbed = computed(() => cfActiveRow.value?.widgetType === 'widget_embed');
    const cfIsCondProduct = computed(() => cfActiveRow.value?.widgetType === 'cond_product');

    /* -- 파일목록 헬퍼 -- */
    const cfFileListItems = computed(() => {
      try { return JSON.parse(cfActiveRow.value?.fileListJson || '[]'); }
      catch { return []; }
    });

    /* _saveFileList — 저장 */
    const _saveFileList = (items) => {
      if (cfActiveRow.value) { cfActiveRow.value.fileListJson = JSON.stringify(items); }
    };

    /* addFileItem — 추가 */
    const addFileItem    = () => _saveFileList([...cfFileListItems.value, { name: '', url: '' }]);

    /* removeFileItem — 제거 */
    const removeFileItem = (idx) => _saveFileList(window.safeArrayUtils.safeFilter(cfFileListItems, (_, i) => i !== idx));

    /* updateFileItem — 갱신 */
    const updateFileItem = (idx, field, val) =>
      _saveFileList(cfFileListItems.value.map((item, i) => i === idx ? { ...item, [field]: val } : item));

    /* cfDisplayRows — html_editor는 Toast UI로 별도 렌더하므로 제외 */
    const cfDisplayRows = computed(() => {
      if (!cfActiveRow.value) { return []; }
      if (cfIsImage.value)       return [
        { key: 'imageUrl', label: '이미지 URL',  type: 'input', ph: 'https://...' },
        { key: 'altText',  label: 'Alt 텍스트',  type: 'input', ph: '' },
        { key: 'linkUrl',  label: '링크 URL',    type: 'input', ph: 'https://...' },
      ];
      if (cfIsProduct.value)     return [
        { key: 'productIds', label: '상품 ID 목록', type: 'input', ph: '1, 2, 3, ...' },
      ];
      if (cfIsChart.value)       return [
        { key: 'chartTitle',  label: '차트 제목',        type: 'input',  ph: '' },
        { key: 'chartType',   label: '차트 유형',        type: 'select', options: [{v:'bar',l:'Bar'},{v:'line',l:'Line'},{v:'pie',l:'Pie'}] },
        { key: 'chartLabels', label: '라벨 (쉼표 구분)', type: 'input',  ph: '1월, 2월, 3월' },
        { key: 'chartValues', label: '값 (쉼표 구분)',   type: 'input',  ph: '100, 200, 150' },
      ];
      if (cfIsText.value)        return [
        { key: 'textContent', label: '텍스트 내용', type: 'textarea', ph: '' },
        { key: 'bgColor',     label: '배경색',      type: 'color',   ph: '' },
        { key: 'textColor',   label: '글자색',      type: 'color',   ph: '' },
      ];
      if (cfIsInfo.value)        return [
        { key: 'infoTitle', label: '카드 제목', type: 'input',    ph: '' },
        { key: 'infoBody',  label: '카드 내용', type: 'textarea', ph: '' },
      ];
      if (cfIsPopup.value)       return [
        { key: 'popupWidth',  label: '팝업 너비 (px)',  type: 'number', ph: '' },
        { key: 'popupHeight', label: '팝업 높이 (px)',  type: 'number', ph: '' },
        { key: 'imageUrl',    label: '팝업 이미지 URL', type: 'input',  ph: 'https://...' },
        { key: 'linkUrl',     label: '링크 URL',        type: 'input',  ph: '' },
      ];
      if (cfIsFile.value)        return [
        { key: 'fileUrl',   label: '파일 URL',    type: 'input', ph: 'https://... 또는 /files/...' },
        { key: 'fileLabel', label: '표시 레이블', type: 'input', ph: '다운로드' },
      ];
      if (cfIsCoupon.value)      return [
        { key: 'couponCode', label: '쿠폰 코드', type: 'input', ph: 'COUPON_CODE' },
        { key: 'couponDesc', label: '쿠폰 설명', type: 'input', ph: '쿠폰 안내 문구' },
      ];
      if (cfIsHtmlEditor.value)  return [];   /* Toast UI로 별도 처리 */
      if (cfIsTextarea.value)    return [
        { key: 'textareaContent', label: '텍스트 내용', type: 'textarea', ph: '텍스트를 입력하세요...' },
      ];
      if (cfIsMarkdown.value)    return [
        { key: 'markdownContent', label: 'Markdown 내용', type: 'code', ph: '# 제목\n\n내용을 입력하세요...' },
      ];
      if (cfIsCodeWidget.value) {
        const rows = [
          { key: 'codeValue', label: '코드 값', type: 'input', ph: 'COUPON-2026-001234' },
        ];
        if (cfIsBarcode.value || cfIsBarcodeQr.value) rows.push(
          { key: 'codeFormat', label: '바코드 형식', type: 'select', options: [
            {v:'CODE128',l:'CODE128 (범용)'},{v:'EAN13',l:'EAN-13'},{v:'EAN8',l:'EAN-8'},
            {v:'UPC',l:'UPC-A'},{v:'CODE39',l:'CODE39'},{v:'ITF14',l:'ITF-14'},
          ]},
          { key: 'codeHeight', label: '바코드 높이 (px)', type: 'number', ph: '60' },
          { key: 'showCodeLabel', label: '코드값 텍스트', type: 'select', options: [{v:true,l:'표시'},{v:false,l:'숨김'}] },
        );
        if (cfIsQrcode.value || cfIsBarcodeQr.value) rows.push(
          { key: 'qrSize', label: 'QR 크기 (px)', type: 'number', ph: '120' },
          { key: 'qrErrorLevel', label: '오류 정정 수준', type: 'select', options: [
            {v:'L',l:'L – 7%'},{v:'M',l:'M – 15%'},{v:'Q',l:'Q – 25%'},{v:'H',l:'H – 30%'},
          ]},
        );
        return rows;
      }
      if (cfIsFileList.value)    return [];   /* 파일목록 별도 처리 */
      if (cfIsCondProduct.value) return [
        { key: 'condSite',     label: '사이트 조건',   type: 'input',  ph: '사이트 코드 (비워두면 전체)' },
        { key: 'condUser',     label: '사용자 조건',   type: 'select',
          options: [{v:'',l:'전체'},{v:'login',l:'로그인'},{v:'nologin',l:'비로그인'},{v:'VIP',l:'VIP'},{v:'우수',l:'우수'},{v:'일반',l:'일반'}] },
        { key: 'condCategory', label: '카테고리 조건', type: 'input',  ph: '카테고리 ID (쉼표 구분)' },
        { key: 'condBrand',    label: '브랜드 조건',   type: 'input',  ph: '브랜드명 (쉼표 구분)' },
        { key: 'condSort',     label: '정렬 기준',     type: 'select',
          options: [{v:'newest',l:'최신순'},{v:'popular',l:'인기순'},{v:'price_asc',l:'가격 낮은순'},{v:'price_desc',l:'가격 높은순'},{v:'discount',l:'할인율순'}] },
        { key: 'condLimit',    label: '표시 개수',     type: 'number', ph: '8' },
      ];
      if (cfIsVideoPlayer.value) return [
        { key: 'videoUrl',      label: '동영상 URL',  type: 'input',  ph: 'https://youtube.com/watch?v=...' },
        { key: 'videoType',     label: '동영상 유형', type: 'select', options: [{v:'youtube',l:'YouTube'},{v:'vimeo',l:'Vimeo'},{v:'direct',l:'직접 URL (mp4)'}] },
        { key: 'videoAutoplay', label: '자동재생',    type: 'select', options: [{v:false,l:'사용 안 함'},{v:true,l:'사용 (음소거 필요)'}] },
        { key: 'videoControls', label: '컨트롤바',    type: 'select', options: [{v:true,l:'표시'},{v:false,l:'숨김'}] },
      ];
      if (cfIsCountdown.value) return [
        { key: 'countdownTarget',     label: '목표 일시',    type: 'input', ph: '2026-12-31 23:59:59' },
        { key: 'countdownTitle',      label: '타이틀',       type: 'input', ph: '이벤트 종료까지' },
        { key: 'countdownExpiredMsg', label: '종료 메시지',  type: 'input', ph: '이벤트가 종료되었습니다.' },
        { key: 'countdownBgColor',    label: '배경색',       type: 'color' },
        { key: 'countdownTextColor',  label: '글자색',       type: 'color' },
      ];
      if (cfIsPayment.value) return [
        { key: 'payAmount',      label: '결제 금액',          type: 'number', ph: '0' },
        { key: 'payCurrency',    label: '통화',               type: 'select', options: [{v:'KRW',l:'원 (KRW)'},{v:'USD',l:'달러 (USD)'}] },
        { key: 'payMethods',     label: '결제수단 (쉼표 구분)', type: 'input', ph: 'card,kakao,naver,toss,bank' },
        { key: 'payButtonLabel', label: '버튼 텍스트',         type: 'input', ph: '결제하기' },
        { key: 'payButtonColor', label: '버튼 색상',           type: 'color' },
      ];
      if (cfIsApproval.value) return [
        { key: 'approvalDocType', label: '문서 유형', type: 'select', options: [{v:'구매승인',l:'구매승인'},{v:'지출결의',l:'지출결의'},{v:'휴가신청',l:'휴가신청'},{v:'기안',l:'기안'},{v:'품의서',l:'품의서'}] },
        { key: 'approvalTitle',   label: '결재 제목',    type: 'input', ph: '' },
        { key: 'approvalLine',    label: '결재선 (JSON)', type: 'code',  ph: '[{"role":"담당자","name":"홍길동"},{"role":"팀장","name":""}]' },
      ];
      if (cfIsMapWidget.value) return [
        { key: 'mapType',        label: '지도 유형', type: 'select', options: [{v:'google',l:'Google Maps'},{v:'kakao',l:'카카오맵'},{v:'naver',l:'네이버지도'}] },
        { key: 'mapAddress',     label: '주소',      type: 'input',  ph: '서울시 강남구 테헤란로 123' },
        { key: 'mapLat',         label: '위도 (lat)', type: 'input', ph: '37.5005' },
        { key: 'mapLng',         label: '경도 (lng)', type: 'input', ph: '127.0356' },
        { key: 'mapZoom',        label: '줌 레벨',   type: 'number', ph: '14' },
        { key: 'mapMarkerLabel', label: '마커 라벨', type: 'input',  ph: '우리 매장' },
      ];
      if (cfIsEventBanner.value) return [
        { key: 'eventId', label: '이벤트 ID', type: 'event', ph: '' },
      ];
      if (cfIsCacheBanner.value) return [
        { key: 'cacheDesc',   label: '안내 문구',          type: 'input',  ph: '지금 충전하면 10% 보너스!' },
        { key: 'cacheAmount', label: '기본 충전 금액(원)', type: 'number', ph: '' },
      ];
      if (cfIsWidgetEmbed.value) return [
        { key: 'embedCode', label: '임베드 코드', type: 'code', ph: '<iframe ...></iframe>' },
      ];
      return [];
    });

    const cfRelatedEvent = computed(() => {
      const eid = cfActiveRow.value?.eventId;
      if (!eid) { return null; }
      return (Array.isArray(events) ? events : []).find(e => String(e.eventId) === String(eid)) || null;
    });

    /* handleInitForm — 처리 */
    const handleInitForm = async () => {
      await nextTick();
      if (cfIsNew.value) {
        /* 신규: 패널코드 자동 생성 DP_YYMMDD_HHMMSS */
        const t = new Date();
        const p = n => String(n).padStart(2, '0');
        form.dispCode = `DP_${String(t.getFullYear()).slice(2)}${p(t.getMonth()+1)}${p(t.getDate())}_${p(t.getHours())}${p(t.getMinutes())}${p(t.getSeconds())}`;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(async () => {
      if (isAppReady.value) { fnLoadCodes(); }
      await handleLoadDetail();
      handleLoadData();
      handleInitForm();
    });

    /* 정책: 부모 Mng 의 reloadTrigger 가 변할 때마다 (행상세/행수정 클릭) 상세 API 재호출 */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      await handleLoadDetail();
      handleInitForm();
    });

    /* handleSave — 저장 */
    const handleSave = async () => {
      if (!form.name || !form.area || !form.dispCode) { showToast('필수 항목을 입력해주세요. (패널코드·패널명·화면영역)', 'error'); return; }
      const isNewPanel = cfIsNew.value;
      const ok = await showConfirm(isNewPanel ? '등록' : '저장', isNewPanel ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) { return; }
      try {
        /* form 별칭 → DpPanel Entity 필드 매핑 (위젯 목록은 content_json 직렬화) */
        const _rows = rows.map(r => ({ ...r }));
        const body = { ...form, rows: _rows };
        body.panelId            = form.dispId || form.panelId || null;
        body.panelNm            = form.name || form.panelNm;
        body.panelTypeCd        = form.layoutType || form.panelTypeCd;
        body.dispPanelStatusCd  = form.status || form.dispPanelStatusCd;
        body.visibilityTargets  = form.panelVisibilityTargets || form.visibilityTargets;
        body.useStartDate       = form.useStartDate;
        body.useEndDate         = form.useEndDate;
        body.pathId             = form.pathId;
        body.contentJson        = JSON.stringify({ rows: _rows });
        const res = await (isNewPanel ? boApiSvc.dpPanel.create(body, '전시패널관리', '등록') : boApiSvc.dpPanel.update(body.panelId, body, '전시패널관리', '저장'));
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast(isNewPanel ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('dpDispPanelMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* -- 위젯미리보기 모달 -- */
    const preview = reactive({ show: false, tabLabel: '' });

    /* openPreview — 열기 */
    const openPreview = (tabKey, tabLabel) => { preview.tabLabel = tabLabel; preview.show = true; };

    /* closePreview — 미리보기 닫기 */
    const closePreview = () => { preview.show = false; };
    const cfPreviewWidget = computed(() => ({
      ...form, ...(cfActiveRow.value ? { ...cfActiveRow.value } : {}), status: '활성',
    }));

    /* -- 패널미리보기 (카드) -- */
    const cardPreview = reactive({ show: false });

    /* openCardPreview — 열기 */
    const openCardPreview = () => { cardPreview.show = true; };

    /* closeCardPreview — 닫기 */
    const closeCardPreview = () => { cardPreview.show = false; };
    const cfCurrentAreaLabel = computed(() => {
      const found = (Array.isArray(codes) ? codes : []).find(c => c.codeGrp === 'DISP_AREA' && c.codeValue === form.area);
      return found ? found.codeLabel : form.area;
    });

    /* fnWLabel — 유틸 */
    const fnWLabel = (t) => codes.disp_widget_types.find(w => w.codeValue === t)?.codeLabel || t || '-';

    /* -- 펼치기 / 탭 모드 토글 -- */

    /* 아코디언 다중 펼치기 */
    const expandedSections = reactive(new Set(['info', 'tab1']));

    /* toggleSection — 토글 */
    const toggleSection = (key) => { if (expandedSections.has(key)) expandedSections.delete(key); else expandedSections.add(key); };

    /* isSectionExpanded — 여부 확인 */
    const isSectionExpanded = (key) => expandedSections.has(key);

    /* fnRowIsHtmlEditor — 유틸 */
    const fnRowIsHtmlEditor  = (r) => r?.widgetType === 'html_editor';

    /* fnRowIsFileList — 유틸 */
    const fnRowIsFileList    = (r) => r?.widgetType === 'file_list';

    /* fnRowIsImage — 유틸 */
    const fnRowIsImage       = (r) => r?.widgetType === 'image_banner';

    /* fnRowIsText — 유틸 */
    const fnRowIsText        = (r) => r?.widgetType === 'text_banner';

    /* fnRowIsProduct — 유틸 */
    const fnRowIsProduct     = (r) => ['product_slider','product'].includes(r?.widgetType);

    /* fnGetDisplayRows — 유틸 */
    const fnGetDisplayRows = (r) => {
      if (!r) { return []; }
      const wt = r.widgetType;
      if (wt === 'image_banner')   return [{ key:'imageUrl', label:'이미지 URL', type:'input', ph:'https://...' },{ key:'altText', label:'Alt 텍스트', type:'input', ph:'' },{ key:'linkUrl', label:'링크 URL', type:'input', ph:'https://...' }];
      if (['product_slider','product'].includes(wt)) { return [{ key:'productIds', label:'상품 ID 목록', type:'input', ph:'1, 2, 3, ...' }]; }
      if (wt?.startsWith('chart_')) { return [{ key:'chartTitle', label:'차트 제목', type:'input', ph:'' },{ key:'chartType', label:'차트 유형', type:'select', options:[{v:'bar',l:'Bar'},{v:'line',l:'Line'},{v:'pie',l:'Pie'}] },{ key:'chartLabels', label:'라벨 (쉼표 구분)', type:'input', ph:'1월, 2월, 3월' },{ key:'chartValues', label:'값 (쉼표 구분)', type:'input', ph:'100, 200, 150' }]; }
      if (wt === 'text_banner') { return [{ key:'textContent', label:'텍스트 내용', type:'textarea', ph:'' },{ key:'bgColor', label:'배경색', type:'color', ph:'' },{ key:'textColor', label:'글자색', type:'color', ph:'' }]; }
      if (wt === 'info_card') { return [{ key:'infoTitle', label:'카드 제목', type:'input', ph:'' },{ key:'infoBody', label:'카드 내용', type:'textarea', ph:'' }]; }
      if (wt === 'popup')          return [{ key:'popupWidth', label:'팝업 너비(px)', type:'number', ph:'' },{ key:'popupHeight', label:'팝업 높이(px)', type:'number', ph:'' },{ key:'imageUrl', label:'팝업 이미지 URL', type:'input', ph:'https://...' },{ key:'linkUrl', label:'링크 URL', type:'input', ph:'' }];
      if (wt === 'file')           return [{ key:'fileUrl', label:'파일 URL', type:'input', ph:'https://...' },{ key:'fileLabel', label:'표시 레이블', type:'input', ph:'다운로드' }];
      if (wt === 'coupon') { return [{ key:'couponCode', label:'쿠폰 코드', type:'input', ph:'COUPON_CODE' },{ key:'couponDesc', label:'쿠폰 설명', type:'input', ph:'쿠폰 안내 문구' }]; }
      if (wt === 'html_editor' || wt === 'file_list') { return []; }
      if (wt === 'cond_product') { return [{ key:'condSite', label:'사이트 조건', type:'input', ph:'사이트 코드 (비워두면 전체)' },{ key:'condUser', label:'사용자 조건', type:'select', options:[{v:'',l:'전체'},{v:'login',l:'로그인'},{v:'nologin',l:'비로그인'},{v:'VIP',l:'VIP'},{v:'우수',l:'우수'},{v:'일반',l:'일반'}] },{ key:'condCategory', label:'카테고리 조건', type:'input', ph:'카테고리 ID (쉼표 구분)' },{ key:'condBrand', label:'브랜드 조건', type:'input', ph:'브랜드명 (쉼표 구분)' },{ key:'condSort', label:'정렬 기준', type:'select', options:[{v:'newest',l:'최신순'},{v:'popular',l:'인기순'},{v:'price_asc',l:'가격 낮은순'},{v:'price_desc',l:'가격 높은순'},{v:'discount',l:'할인율순'}] },{ key:'condLimit', label:'표시 개수', type:'number', ph:'8' }]; }
      if (wt === 'event_banner') { return [{ key:'eventId', label:'이벤트 ID', type:'event', ph:'' }]; }
      if (wt === 'cache_banner') { return [{ key:'cacheDesc', label:'안내 문구', type:'input', ph:'지금 충전하면 10% 보너스!' },{ key:'cacheAmount', label:'기본 충전 금액(원)', type:'number', ph:'' }]; }
      if (wt === 'widget_embed') { return [{ key:'embedCode', label:'임베드 코드', type:'code', ph:'<iframe ...></iframe>' }]; }
      return [];
    };

    /* fnGetRelatedEvent — 유틸 */
    const fnGetRelatedEvent  = (r) => { const eid = r?.eventId; if (!eid) return null; return (Array.isArray(events) ? events : []).find(e => String(e.eventId) === String(eid)) || null; };

    /* fnGetFileListItems — 유틸 */
    const fnGetFileListItems = (r) => { try { return JSON.parse(r?.fileListJson || '[]'); } catch { return []; } };

    /* fnAddFileItemAt — 유틸 */
    const fnAddFileItemAt    = (r) => { r.fileListJson = JSON.stringify([...fnGetFileListItems(r), { name: '', url: '' }]); };

    /* fnRemoveFileItemAt — 유틸 */
    const fnRemoveFileItemAt = (r, idx) => { r.fileListJson = JSON.stringify(fnGetFileListItems(r).filter((_, i) => i !== idx)); };

    /* fnSetFileItem — 유틸 */
    const fnSetFileItem      = (r, idx, field, val) => { const items = fnGetFileListItems(r); items[idx] = { ...items[idx], [field]: val }; r.fileListJson = JSON.stringify(items); };

    /* moveRowAt — 이동 */
    const moveRowAt = (rowIdx, dir) => {
      const target = rowIdx + dir;
      if (target < 0 || target >= rows.length) { return; }
      const a = { ...rows[rowIdx] };
      const b = { ...rows[target] };
      Object.assign(rows[rowIdx], b);
      Object.assign(rows[target], a);
      window.safeArrayUtils.safeForEach(rows, (r, i) => { r.sortOrder = i + 1; });
    };

    /* addWidget — 추가 */
    const addWidget = () => {
      if (rows.length >= MAX_WIDGETS) { showToast(`위젯은 최대 ${MAX_WIDGETS}개까지 추가할 수 있습니다.`, 'error'); return; }
      rows.push(makeRowData({ sortOrder: rows.length + 1 }));
      const newKey = 'tab' + rows.length;
      uiState.tab = newKey;
      expandedSections.add(newKey);
    };

    /* removeWidget — 제거 */
    const removeWidget = (idx) => {
      if (idx === 0 || rows.length <= 1) { return; }
      const currentIdx = cfActiveRowIdx.value;
      rows.splice(idx, 1);
      window.safeArrayUtils.safeForEach(rows, (r, i) => { r.sortOrder = i + 1; });
      expandedSections.delete('tab' + (rows.length + 1));
      if (currentIdx !== null && currentIdx >= rows.length) {
        uiState.tab = 'tab' + rows.length;
      }
    };

    /* -- 공개 대상 멀티체크 토글 (전시항목별) -- */
    const cfVisibilityOptions = computed(() => window.visibilityUtil.allOptions());

    /* hasVisibility — 여부 확인 */
    const hasVisibility = (code) => {
      if (!cfActiveRow.value) { return false; }
      return window.visibilityUtil.has(cfActiveRow.value.visibilityTargets, code);
    };

    /* toggleVisibility — 토글 */
    const toggleVisibility = (code) => {
      if (!cfActiveRow.value) { return; }
      const list = window.visibilityUtil.parse(cfActiveRow.value.visibilityTargets);
      const i = list.indexOf(code);
      if (i >= 0) list.splice(i, 1); else list.push(code);
      if (code === 'PUBLIC' && i < 0) {
        cfActiveRow.value.visibilityTargets = '^PUBLIC^';
        return;
      }
      const filtered = window.safeArrayUtils.safeFilter(list, c => c !== 'PUBLIC' || code === 'PUBLIC');
      cfActiveRow.value.visibilityTargets = window.visibilityUtil.serialize(filtered);
    };

    /* -- 전시 환경 멀티체크 토글 (PLAN/DEV/TEST/PROD) -- */
    const dispEnvOptions = [
      { code: 'PLAN', label: '준비/계획' },
      { code: 'DEV', label: 'DEV' },
      { code: 'TEST', label: 'TEST' },
      { code: 'PROD', label: 'PROD' },
    ];

    /* hasDispEnv — 여부 확인 */
    const hasDispEnv = (code) => {
      if (!cfActiveRow.value) { return false; }
      return cfActiveRow.value.dispEnv.includes('^' + code + '^');
    };

    /* toggleDispEnv — 토글 */
    const toggleDispEnv = (code) => {
      if (!cfActiveRow.value) { return; }
      const envList = cfActiveRow.value.dispEnv.split('^').filter(e => e && e !== 'NONE');
      const i = envList.indexOf(code);
      if (i >= 0) envList.splice(i, 1); else envList.push(code);
      cfActiveRow.value.dispEnv = envList.length > 0 ? '^' + envList.join('^') + '^' : '^NONE^';
    };

    /* hasPanelDispEnv — 여부 확인 */
    const hasPanelDispEnv = (code) => form.panelDispEnv.includes('^' + code + '^');

    /* togglePanelDispEnv — 패널 토글 */
    const togglePanelDispEnv = (code) => {
      const envList = form.panelDispEnv.split('^').filter(e => e && e !== 'NONE');
      const i = envList.indexOf(code);
      if (i >= 0) envList.splice(i, 1); else envList.push(code);
      form.panelDispEnv = envList.length > 0 ? '^' + envList.join('^') + '^' : '^NONE^';
    };

    /* hasPanelVisibility — 여부 확인 */
    const hasPanelVisibility = (code) => window.visibilityUtil.has(form.panelVisibilityTargets, code);

    /* togglePanelVisibility — 패널 토글 */
    const togglePanelVisibility = (code) => {
      const list = window.visibilityUtil.parse(form.panelVisibilityTargets);
      const i = list.indexOf(code);
      if (i >= 0) list.splice(i, 1); else list.push(code);
      if (code === 'PUBLIC' && i < 0) { form.panelVisibilityTargets = '^PUBLIC^'; return; }
      const filtered = window.safeArrayUtils.safeFilter(list, c => c !== 'PUBLIC' || code === 'PUBLIC');
      form.panelVisibilityTargets = window.visibilityUtil.serialize(filtered);
    };

    /* onRowCopy — 이벤트 */
    const onRowCopy = (pickedRows) => {
      if (!Array.isArray(pickedRows) || !pickedRows.length) { return; }
      window.safeArrayUtils.safeForEach(pickedRows, r => {
        if (rows.length >= MAX_WIDGETS) { return; }
        rows.push({ ...makeRowData(), ...r, sortOrder: rows.length + 1 });
      });
      showToast && showToast(`${pickedRows.length}개 전시항목을 복사했습니다.`, 'info');
      uiState.rowCopyOpen = false;
    };

    /* -- 위젯Lib 선택 팝업 (활성 row에 복사/참조) -- */
        const openLibPick = (mode) => {
      if (!cfActiveRow.value) { return; }
      uiState.libPickMode = mode; uiState.libPickOpen = true;
    };

    /* onLibPicked — 이벤트 */
    const onLibPicked = (lib) => {
      uiState.libPickOpen = false;
      if (!cfActiveRow.value) { return; }
      if (uiState.libPickMode === 'copy') {
        const r = cfActiveRow.value;
        const preserve = { widgetNm: r.widgetNm, sortOrder: r.sortOrder };
        Object.assign(r, { ...lib, ...preserve });
        showToast && showToast(`[${lib.name}] 내용을 복사했습니다.`, 'info');
      } else {
        cfActiveRow.value.refLibId   = lib.libId;
        cfActiveRow.value.refLibCode = lib.libCode || '';
        cfActiveRow.value.refLibName = lib.name || '';
        showToast && showToast(`[${lib.name}] 참조로 설정되었습니다.`, 'info');
      }
    };

    const libPickMode = Vue.toRef(uiState, 'libPickMode');
    const libPickOpen = Vue.toRef(uiState, 'libPickOpen');
    const previewPaneWidth = Vue.toRef(uiState, 'previewPaneWidth');
    const rowCopyOpen = Vue.toRef(uiState, 'rowCopyOpen');
    const showComponentTooltip = Vue.toRef(uiState, 'showComponentTooltip');
    const viewAll = Vue.toRef(uiState, 'viewAll');

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    /* BoGrid 컬럼 — 파일목록 (#/파일명/URL) 인라인 편집 */
    /* file_list 위젯용 (cfFileListItems) — updateFileItem(idx, field, value) */
    const fileListGridColumns = [
      { key: 'name', label: '파일명',     style: 'width:200px;',
        editIntercept: { placeholder: '파일명.pdf',
          onInput: (row, val, idx) => updateFileItem(idx, 'name', val) } },
      { key: 'url',  label: 'URL / 경로',
        editIntercept: { placeholder: 'https://... 또는 /files/sample.pdf',
          onInput: (row, val, idx) => updateFileItem(idx, 'url', val) } },
    ];
    /* fnFileListColsForRow — 유틸 */
    const fnFileListColsForRow = (r) => [
      { key: 'name', label: '파일명',     style: 'width:200px;',
        editIntercept: { placeholder: '파일명.pdf',
          onInput: (row, val, idx) => fnSetFileItem(r, idx, 'name', val) } },
      { key: 'url',  label: 'URL / 경로',
        editIntercept: { placeholder: 'https://...',
          onInput: (row, val, idx) => fnSetFileItem(r, idx, 'url', val) } },
    ];

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - 패널코드/패널명/상태 ==========
    // 기본 패널 폼
    const basePanelFormColumns = [
      { key: 'dispCode', label: '패널코드', type: 'text', required: true,
        placeholder: 'DP_YYMMDD_HHMMSS', mono: true },
      { key: 'name',     label: '패널명', type: 'text', required: true, placeholder: '패널 이름' },
      { key: 'status',   label: '상태', type: 'select', options: () => codes.active_statuses },
    ];
    // 표시경로 (picker) / 포함된 화면영역 (readonly 표시)
    const pathAreaFormColumns = [
      { key: 'pathId', label: '표시경로', type: 'slot', name: 'pathPick', colSpan: 3,
        hint: '예: FO.모바일메인' },
      { key: 'area',   label: '포함된 화면영역', type: 'slot', name: 'areaDisp', colSpan: 3,
        hint: '전시영역관리에서 편집' },
    ];
    // 위젯 행: 위젯 유형/노출 순서 (각 row 객체에 바인딩)
    const widgetRowFormColumns = [
      { key: 'widgetType', label: '위젯 유형', type: 'select', options: () => codes.disp_widget_types },
      { key: 'sortOrder',  label: '노출 순서', type: 'number', min: 1 },
    ];
    // 섹션 콘텐츠 - 패널정보 4컬럼 (코드/이름/경로/영역)
    const sectionInfoFormColumns = [
      { key: 'dispCode', label: '패널코드', type: 'text', required: true,
        placeholder: 'DP_YYMMDD_HHMMSS', mono: true },
      { key: 'name',     label: '패널명', type: 'text', required: true, placeholder: '패널 이름' },
      { key: 'pathId',   label: '표시경로', type: 'slot', name: 'pathPick2',
        hint: '예: FO.모바일메인' },
      { key: 'area',     label: '포함된 화면영역', type: 'slot', name: 'areaDisp2',
        hint: '전시영역관리에서 편집' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      uiState, pathPickModal, form, rows, codes, preview, cardPreview,              // 상태 / 데이터
      basePanelFormColumns, pathAreaFormColumns, widgetRowFormColumns,                // 컬럼 정의
      sectionInfoFormColumns, fileListGridColumns,                                    // 컬럼 정의
      handleBtnAction, handleSelectAction, fnCallbackModal,                             // dispatch + 모달 통합 콜백
      cfIsNew, cfAreas, cfTabLabels, cfTabRowMap, cfActiveRowIdx, cfActiveRow,        // computed
      cfDisplayRows, cfRelatedEvent, cfFileListItems, cfPreviewWidget,                // computed
      cfCurrentAreaLabel, cfDtlMode, cfPreviewFrameWidth, cfVisibilityOptions,        // computed
      tab, previewMode, libPickMode, libPickOpen, previewPaneWidth,                   // toRef
      rowCopyOpen, viewAll, showComponentTooltip,                                     // toRef
      MAX_WIDGETS, PREVIEW_MODES, dispEnvOptions,                                     // 상수
      fnPathLabel, fnWLabel,                                                          // 헬퍼
      fnRowIsHtmlEditor, fnRowIsFileList, fnRowIsImage, fnRowIsText, fnRowIsProduct,  // 헬퍼
      fnGetDisplayRows, fnGetRelatedEvent, fnGetFileListItems, fnFileListColsForRow,  // 헬퍼
      fnAddFileItemAt, fnRemoveFileItemAt, fnSetFileItem,                             // 헬퍼
      hasVisibility, hasDispEnv, hasPanelDispEnv, hasPanelVisibility,                 // 헬퍼
      isSectionExpanded,                                                              // 헬퍼
      cfIsChart, cfIsProduct, cfIsImage, cfIsText, cfIsInfo, cfIsPopup, cfIsFile,     // 위젯타입 computed
      cfIsFileList, cfIsCoupon, cfIsHtmlEditor, cfIsEventBanner, cfIsCacheBanner,     // 위젯타입 computed
      cfIsWidgetEmbed, cfIsCondProduct,                                               // 위젯타입 computed
      addFileItem, removeFileItem, updateFileItem, moveRowAt,                         // 파일/행 조작 (인자 인라인)
      fnAddFileItemAt, fnRemoveFileItemAt,                                            // file_list row 조작 (인자 인라인)
      closePreview, closeCardPreview,                                                 // 모달 닫기 (인자 없음)
      showRefModal,                                                                   // 공통
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title" style="display:flex;align-items:center;justify-content:space-between;">
    <span>
      {{ !active ? '전시패널 상세' : (cfIsNew ? '전시패널 등록' : (cfDtlMode ? '전시패널 상세' : '전시패널 수정')) }}
      <span v-if="active && !cfIsNew" style="font-size:13px;color:#888;font-weight:400;margin-left:6px;">
        #{{ form.dispId }}
      </span>
      <span v-if="!active" style="font-size:12px;color:#bbb;margin-left:8px;font-weight:400;">
        목록에서 행을 선택하거나 [+신규]를 누르세요
      </span>
    </span>
    <div style="display:flex;align-items:center;gap:6px;">
      <button @click="handleBtnAction('form-toggleViewAll')"
        style="font-size:11px;padding:4px 12px;border:1px solid #d0d0d0;border-radius:14px;background:#fff;cursor:pointer;color:#666;display:flex;align-items:center;gap:5px;transition:all .15s;"
        :style="viewAll ? 'background:#f5f0ff;border-color:#b39ddb;color:#6a1b9a;' : ''"
        title="탭 보기 / 전체 펼치기 전환">
        <span>
          {{ viewAll ? '☰' : '⊞' }}
        </span>
        {{ viewAll ? '탭 보기' : '펼치기' }}
      </button>
      <button v-if="!cfDtlMode" class="btn btn-sm" :disabled="cfIsNew"
        :style="cfIsNew ? 'background:#f5f5f5;border:1px solid #ddd;color:#bbb;cursor:not-allowed;' : 'background:#e3f2fd;border:1px solid #90caf9;color:#1565c0;font-weight:600;'"
        :title="cfIsNew ? '저장 후 전시항목을 복사할 수 있습니다.' : ''"
        @click="handleBtnAction('rowCopyModal-open')">
        📄 전시항목 복사
      </button>
      <button v-if="active && !cfDtlMode" class="btn btn-primary btn-sm" @click="handleBtnAction('form-save')" style="font-weight:700;">
        💾 저장
      </button>
    </div>
  </div>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. ═══════════════════ 탭 모드 ═══════════════════ ========== -->
    <div v-if="!viewAll" style="display:flex;gap:0;flex-direction:column;min-height:400px;">
      <!-- ===== ■.■.■. 안내 배너 =============================================== -->
      <div style="background:linear-gradient(135deg,#e3f2fd 0%,#f3e5f5 100%);border-bottom:1px solid #90caf9;padding:12px 14px;font-size:11px;color:#444;line-height:1.6;">
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
      <div style="display:flex;gap:0;flex:1;overflow:hidden;">
        <!-- ===== ■.■.■.■. 좌측 탭 메뉴 (UI 스타일) ================================== -->
        <div style="width:160px;min-width:160px;background:#f4f5f8;border-right:1px solid #e8ebef;padding:12px 8px;flex-shrink:0;">
          <div v-for="(t, tIdx) in cfTabLabels" :key="t?.key"
            @click="handleSelectAction('tab-select', t.key)"
            :style="{
            display:'flex',alignItems:'center',justifyContent:'space-between',
            padding:'9px 12px',borderRadius:'8px',cursor:'pointer',marginBottom:'6px',
            fontSize:'12px',fontWeight: tab===t.key ? 700 : 500,
            background: tab===t.key ? '#fff' : 'transparent',
            color: tab===t.key ? '#e8587a' : '#555',
            border: '1px solid '+(tab===t.key ? '#e8587a' : 'transparent'),
            transition:'all .15s',
            }">
            <span v-if="t.key==='info'">
              📋
              <b>
                패널기본정보
              </b>
            </span>
            <span v-else>
              {{ t.label }}
            </span>
            <span v-if="t.key !== 'info' && tab===t.key" style="display:flex;gap:2px;">
            <button @click.stop="handleSelectAction('tab-move', -1)" :disabled="cfActiveRowIdx===0" title="위로"
                style="font-size:9px;border:1px solid #e0e0e0;border-radius:3px;background:#fff;cursor:pointer;padding:1px 4px;line-height:1.2;color:#888;"
                :style="cfActiveRowIdx===0?'opacity:0.3;cursor:default;':''">
              ▲
            </button>
            <button @click.stop="handleSelectAction('tab-move', 1)" :disabled="cfActiveRowIdx===rows.length-1" title="아래로"
                style="font-size:9px;border:1px solid #e0e0e0;border-radius:3px;background:#fff;cursor:pointer;padding:1px 4px;line-height:1.2;color:#888;"
                :style="cfActiveRowIdx===rows.length-1?'opacity:0.3;cursor:default;':''">
              ▼
            </button>
          </span>
          <button v-if="tIdx >= 2 && tab!==t.key" @click.stop="handleSelectAction('panelItems-remove', tIdx-1)" title="전시항목 삭제" style="font-size:11px;border:none;background:none;cursor:pointer;color:#bbb;line-height:1;padding:0 2px;" @mouseenter="$event.currentTarget.style.color='#e8587a'" @mouseleave="$event.currentTarget.style.color='#bbb'">
          ✕
        </button>
      </div>
      <!-- ===== ■.■.■.■.■. 추가 버튼 =========================================== -->
      <div v-if="rows.length < MAX_WIDGETS" style="margin-top:8px;">
        <button @click="handleBtnAction('panelItems-add')" :disabled="cfIsNew"
              :title="cfIsNew ? '저장 후 전시항목을 추가할 수 있습니다.' : ''"
              :style="cfIsNew ? 'width:100%;padding:8px;border:1px solid #e0e0e0;background:#f5f5f5;color:#bbb;border-radius:8px;font-size:11px;font-weight:600;cursor:not-allowed;' : 'width:100%;padding:8px;border:1px solid #90caf9;background:#e3f2fd;color:#1565c0;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;'">
          ✚ 전시항목 추가
        </button>
      </div>
    </div>
    <!-- ===== ■.■.■.■. 우측 콘텐츠 + 미리보기 ===================================== -->
    <div style="flex:1;display:flex;overflow:hidden;min-width:0;">
      <!-- ===== ■.■.■.■.■. 폼 영역 (75%) ====================================== -->
      <div style="flex:3;padding-left:20px;padding-top:4px;overflow-y:auto;min-width:0;">
        <!-- ===== ■.■.■.■.■.■. 기본정보 ========================================== -->
        <div v-show="tab==='info'">
          <!-- ===== ■.■.■.■.■.■.■. 설정 ========================================== -->
          <div style="margin-bottom:14px;padding:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
            <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:4px;height:16px;background:#1d4ed8;border-radius:2px;">
              </span>
              설정
            </div>
            <!-- ===== ■.■.■.■.■.■.■.■. 패널코드/패널명/상태 (BoFormArea 자동 렌더) ============ -->
            <!-- ===== ■.■.■.■.■.■.■.■. 폼 영역 ====================================== -->
            <bo-form-area :columns="basePanelFormColumns" :form="form" :errors="{}"
                  :readonly="cfDtlMode" :cols="3" compact :show-actions="false" />
            <!-- ===== ■.■.■.■.■.■.■.■. 표시경로 + 포함된 화면영역 (BoFormArea 자동 렌더) ======== -->
            <!-- ===== ■.■.■.■.■.■.■.■. 폼 영역 ====================================== -->
            <bo-form-area :columns="pathAreaFormColumns" :form="form" :errors="{}"
                  :readonly="cfDtlMode" :cols="3" compact :show-actions="false">
              <template #pathPick>
                <div :style="{padding:'7px 10px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'12px',background:'#f5f5f7',color:form.pathId!=null?'#374151':'#9ca3af',fontWeight:form.pathId!=null?600:400,display:'flex',alignItems:'center',gap:'8px',fontFamily:'monospace'}">
                  <span style="flex:1;">
                    {{ fnPathLabel(form.pathId) || '경로 선택...' }}
                  </span>
                  <button type="button" @click="handleBtnAction('pathModal-open', 'form')" title="표시경로 선택"
                        :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'24px',height:'24px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'12px',color:'#6b7280',padding:'0'}"
                        @mouseover="$event.currentTarget.style.background='#eef2ff'"
                        @mouseout="$event.currentTarget.style.background='#fff'">
                    🔍
                  </button>
                </div>
              </template>
              <template #areaDisp>
                <div style="padding:8px 10px;border:1px solid #e4e4e4;border-radius:6px;background:#fafbfc;min-height:34px;display:flex;flex-wrap:wrap;gap:4px;align-items:center;">
                  <span v-if="form.area" style="font-size:11px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:10px;padding:2px 10px;">
                    <code style="font-size:10px;background:transparent;">{{ form.area }}</code>
                      &nbsp;{{ cfCurrentAreaLabel }}
                    </span>
                    <span v-else style="font-size:11px;color:#bbb;">
                      영역에 포함되지 않음
                    </span>
                  </div>
                </template>
              </bo-form-area>
              <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin-bottom:6px;">
                🔲 위젯 레이아웃
              </div>
              <div class="form-row" style="align-items:flex-end;margin-bottom:8px;">
                <div class="form-group" style="flex:0 0 auto;">
                  <label class="form-label">
                    표시방식
                  </label>
                  <div style="display:flex;border:1px solid #d1d5db;border-radius:6px;overflow:hidden;max-width:200px;">
                    <button v-for="o in codes.layout_types" :key="o?.codeValue"
                        @click="!cfDtlMode ? (form.layoutType = o.codeValue) : null"
                        type="button"
                        style="flex:1;padding:6px 0;font-size:12px;border:none;border-left:1px solid #d1d5db;cursor:pointer;transition:all .15s;"
                        :style="[o.codeValue==='grid'?'border-left:none;':'', form.layoutType===o.codeValue ? 'background:#1d4ed8;color:#fff;font-weight:700;' : 'background:#fff;color:#6b7280;', cfDtlMode?'cursor:default;opacity:.6;':'']">
                      {{ o.codeValue==='grid' ? '🔲 ' : '🧩 ' }}{{ o.codeLabel }}
                    </button>
                  </div>
                </div>
                <!-- ===== ■.■.■.■.■.■.■.■.■. 조건부 영역 ================================== -->
                <div class="form-group" style="flex:0 0 auto;" v-if="form.layoutType==='grid'">
                  <label class="form-label">
                    열수
                    <span style="font-size:10px;color:#aaa;">
                      (위젯 배치 열 개수)
                    </span>
                  </label>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <div style="display:flex;border:1px solid #d1d5db;border-radius:6px;overflow:hidden;">
                      <button v-for="n in [1,2,3,4]" :key="Math.random()" type="button"
                          @click="!cfDtlMode ? (form.gridCols = n) : null"
                          style="padding:6px 12px;font-size:12px;border:none;border-left:1px solid #d1d5db;cursor:pointer;transition:all .15s;"
                          :style="[n===1?'border-left:none;':'', form.gridCols===n ? 'background:#1d4ed8;color:#fff;font-weight:700;' : 'background:#fff;color:#6b7280;', cfDtlMode?'cursor:default;opacity:.6;':'']">
                        {{ n }}
                      </button>
                    </div>
                    <input type="number" v-model.number="form.gridCols" min="1" max="32"
                        :readonly="cfDtlMode"
                        style="width:64px;font-size:13px;padding:5px 8px;border:1px solid #d1d5db;border-radius:6px;text-align:center;" />
                    <span style="font-size:12px;color:#aaa;">
                      열
                    </span>
                  </div>
                </div>
                <!-- ===== ■.■.■.■.■.■.■.■.■. 영역 ====================================== -->
                <div class="form-group" style="flex:0 0 auto;" v-else>
                  <label class="form-label">
                    배치
                  </label>
                  <span style="font-size:12px;color:#6b7280;padding:6px 0;display:block;">
                    자유 배치 (열수 없음)
                  </span>
                </div>
              </div>
              <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin-bottom:6px;">
                📅 사용기간
              </div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <input type="date" class="form-control" v-model="form.useStartDate" style="width:150px;margin:0;" :readonly="cfDtlMode" />
                <span style="color:#aaa;font-size:13px;padding:0 4px;">
                  ~
                </span>
                <input type="date" class="form-control" v-model="form.useEndDate" style="width:150px;margin:0;" :readonly="cfDtlMode" />
              </div>
            </div>
            <!-- ===== /설정 ======================================================== -->
            <!-- ===== ■.■.■.■.■.■.■. 제목 ========================================== -->
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
                    <input type="radio" v-model="form.titleYn" value="Y" :disabled="cfDtlMode" />
                    표시
                  </label>
                  <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;font-weight:500;color:#444;">
                    <input type="radio" v-model="form.titleYn" value="N" :disabled="cfDtlMode" />
                    미표시
                  </label>
                </span>
              </div>
              <div v-if="form.titleYn==='Y'" style="display:flex;align-items:center;gap:10px;">
                <label style="font-size:12px;font-weight:600;color:#555;width:50px;flex-shrink:0;">
                  타이틀
                </label>
                <input v-model="form.title" type="text" placeholder="타이틀 텍스트 입력" :readonly="cfDtlMode"
                    style="flex:1;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;" />
              </div>
            </div>
            <!-- ===== /제목 ======================================================== -->
            <!-- ===== ■.■.■.■.■.■.■. 내용 (HTML 설명) ================================ -->
            <div style="margin-bottom:14px;padding:14px;background:#fff8fa;border:1px solid #fce4ec;border-radius:8px;">
              <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
                <span style="display:inline-block;width:4px;height:16px;background:#e8587a;border-radius:2px;">
                </span>
                내용
              </div>
              <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin-bottom:6px;">
                📝 패널코멘트
              </div>
              <div v-if="cfDtlMode"
                  style="padding:12px 14px;background:#f9f9f9;border:1px solid #e8e8e8;border-radius:6px;font-size:13px;line-height:1.7;min-height:80px;">
                <span v-if="form.htmlDesc" v-html="form.htmlDesc">
                </span>
                <span v-else style="color:#bbb;">
                  내용 없음
                </span>
              </div>
              <base-html-editor v-else v-model="form.htmlDesc" height="280px" />
            </div>
            <!-- ===== /내용 ======================================================== -->
            <div class="form-actions" v-if="active && !cfDtlMode">
              <template v-if="cfDtlMode">
                <button class="btn btn-primary" @click="handleBtnAction('form-edit')">
                  수정
                </button>
                <button class="btn btn-secondary" @click="handleBtnAction('form-close')">
                  닫기
                </button>
              </template>
              <template v-else>
                <button class="btn btn-secondary" @click="handleBtnAction('form-close')">
                  취소
                </button>
              </template>
            </div>
          </div>
          <!-- ===== ■.■.■.■.■.■. 1~5행 콘텐츠 ====================================== -->
          <div v-if="cfActiveRow">
            <!-- ===== ■.■.■.■.■.■.■. 섹션 1: 설정 ==================================== -->
            <div style="margin-bottom:14px;padding:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
              <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
                <span style="display:inline-block;width:4px;height:16px;background:#1d4ed8;border-radius:2px;">
                </span>
                설정
                <span v-if="!cfDtlMode" style="margin-left:auto;display:flex;gap:6px;">
                  <button @click="handleBtnAction('libPick-open', 'copy')" :disabled="cfIsNew"
                      :title="cfIsNew ? '저장 후 사용할 수 있습니다.' : ''"
                      :style="cfIsNew ? 'font-size:11px;padding:4px 10px;border:1px solid #e0e0e0;background:#f5f5f5;color:#bbb;border-radius:6px;cursor:not-allowed;font-weight:600;' : 'font-size:11px;padding:4px 10px;border:1px solid #90caf9;background:#e3f2fd;color:#1565c0;border-radius:6px;cursor:pointer;font-weight:600;'">
                    📋 위젯Lib내용복사
                  </button>
                  <button @click="handleBtnAction('libPick-open', 'ref')" :disabled="cfIsNew"
                      :title="cfIsNew ? '저장 후 사용할 수 있습니다.' : ''"
                      :style="cfIsNew ? 'font-size:11px;padding:4px 10px;border:1px solid #e0e0e0;background:#f5f5f5;color:#bbb;border-radius:6px;cursor:not-allowed;font-weight:600;' : 'font-size:11px;padding:4px 10px;border:1px solid #ce93d8;background:#f3e5f5;color:#6a1b9a;border-radius:6px;cursor:pointer;font-weight:600;'">
                    🔗 위젯Lib참조
                  </button>
                </span>
              </div>
              <!-- ===== ■.■.■.■.■.■.■.■. 🔗 참조 정보 ================================== -->
              <div v-if="cfActiveRow.refLibId"
                  style="background:linear-gradient(135deg,#f3e5f5 0%,#fff 100%);border:1px dashed #ce93d8;border-radius:10px;padding:12px 14px;margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                  <span style="font-size:12px;font-weight:700;color:#6a1b9a;">
                    🔗 전시위젯Lib 참조 중
                  </span>
                  <button v-if="!cfDtlMode" @click="handleBtnAction('libPick-refClear')"
                      style="font-size:10px;padding:2px 8px;border:1px solid #ce93d8;background:#fff;color:#6a1b9a;border-radius:4px;cursor:pointer;">
                    참조 해제
                  </button>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:11px;color:#555;line-height:1.6;margin-bottom:10px;">
                  <span>
                    <b style="color:#888;">
                      참조구분:
                    </b>
                    <span style="background:#f3e5f5;color:#6a1b9a;border-radius:8px;padding:1px 7px;margin-left:3px;font-weight:700;">
                      위젯Lib
                    </span>
                  </span>
                  <span v-if="cfActiveRow.refLibCode">
                    <b style="color:#888;">
                      참조항목Code:
                    </b>
                    <code style="background:#fff;color:#6a1b9a;padding:1px 6px;border-radius:3px;margin-left:3px;border:1px solid #e1bee7;">
                        {{ cfActiveRow.refLibCode }}
                      </code>
                    </span>
                    <span>
                      <b style="color:#888;">
                        참조항목ID:
                      </b>
                      <code style="background:#fff;color:#6a1b9a;padding:1px 6px;border-radius:3px;margin-left:3px;border:1px solid #e1bee7;">
                        #{{ String(cfActiveRow.refLibId).padStart(4,'0') }}
                      </code>
                      </span>
                      <span v-if="cfActiveRow.refLibName">
                        <b style="color:#888;">
                          참조명:
                        </b>
                        {{ cfActiveRow.refLibName }}
                      </span>
                    </div>
                    <div style="background:#fff;border:1px solid #e1bee7;border-radius:8px;padding:10px;">
                      <div style="font-size:10px;color:#888;font-weight:600;margin-bottom:6px;letter-spacing:.3px;">
                        ▸ 참조 내용 미리보기
                      </div>
                      <disp-x04-widget
                      :params="{ }"
                      :disp-opt="{ showBadges: true }"
                      :widget-item="([]||[]).find(l => l.libId===cfActiveRow.refLibId) || {}" />
                    </div>
                  </div>
                  <!-- ===== ■.■.■.■.■.■.■.■. 노출순서 + 전시여부 =============================== -->
                  <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap;">
                    <div style="display:flex;align-items:center;gap:8px;">
                      <label style="font-size:12px;font-weight:600;color:#555;white-space:nowrap;">
                        노출 순서
                      </label>
                      <input class="form-control" type="number" v-model.number="cfActiveRow.sortOrder" min="1" :readonly="cfDtlMode"
                      style="width:80px;margin:0;" />
                    </div>
                    <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#555;padding:5px 10px;background:#f0f0f0;border-radius:6px;cursor:pointer;">
                      <span>
                        전시여부
                      </span>
                      <input type="checkbox" v-model="cfActiveRow.dispYn" :true-value="'Y'" :false-value="'N'" :disabled="cfDtlMode" style="accent-color:#e8587a;" />
                      <span>
                        {{ cfActiveRow.dispYn === 'Y' ? '전시' : '숨김' }}
                      </span>
                    </label>
                    <span style="font-size:10px;color:#aaa;">
                      (배치로 자동 관리됨)
                    </span>
                  </div>
                  <!-- ===== ■.■.■.■.■.■.■.■. 전시기간 ====================================== -->
                  <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin-bottom:6px;">
                    📅 전시기간
                    <span style="font-size:10px;color:#aaa;font-weight:400;">
                      (미설정 시 패널 기간 사용)
                    </span>
                  </div>
                  <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;background:#f9fafb;padding:10px 12px;border-radius:6px;border:1px solid #e5e7eb;">
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="font-size:11px;color:#888;white-space:nowrap;width:28px;">
                        시작
                      </span>
                      <bo-date-time-picker v-model="cfActiveRow.dispStartDt" :readonly="cfDtlMode" />
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="font-size:11px;color:#888;white-space:nowrap;width:28px;">
                        종료
                      </span>
                      <bo-date-time-picker v-model="cfActiveRow.dispEndDt" :readonly="cfDtlMode" />
                    </div>
                  </div>
                  <!-- ===== ■.■.■.■.■.■.■.■. 전시환경 ====================================== -->
                  <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin:10px 0 6px;">
                    🌍 전시환경
                  </div>
                  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
                    <label v-for="opt in dispEnvOptions" :key="opt?.code"
                    :style="{
                    display:'inline-flex',alignItems:'center',gap:'6px',padding:'6px 12px',borderRadius:'6px',
                    border:'1px solid '+(hasDispEnv(opt.code)?'#7c3aed':'#ddd'),
                    background:hasDispEnv(opt.code)?'#f3e8ff':'#fafafa',
                    color:hasDispEnv(opt.code)?'#7c3aed':'#666',
                    fontSize:'12px',fontWeight:hasDispEnv(opt.code)?700:500,
                    cursor: cfDtlMode?'default':'pointer',opacity: cfDtlMode?0.8:1,
                    }">
                      <input type="checkbox" :checked="hasDispEnv(opt.code)"
                      :disabled="cfDtlMode"
                      @change="handleSelectAction('dispEnv-toggle', opt.code)"
                      style="accent-color:#7c3aed;" />
                      {{ opt.label }}
                    </label>
                  </div>
                  <!-- ===== ■.■.■.■.■.■.■.■. 공개대상 ====================================== -->
                  <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin:10px 0 6px;">
                    🔒 공개대상 (하나라도 해당하면 노출)
                  </div>
                  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
                    <label v-for="opt in cfVisibilityOptions" :key="opt?.codeValue"
                    :style="{
                    display:'inline-flex',alignItems:'center',gap:'6px',padding:'6px 12px',borderRadius:'16px',
                    border:'1px solid '+(hasVisibility(opt.codeValue)?'#1565c0':'#ddd'),
                    background:hasVisibility(opt.codeValue)?'#e3f2fd':'#fafafa',
                    color:hasVisibility(opt.codeValue)?'#1565c0':'#666',
                    fontSize:'12px',fontWeight:hasVisibility(opt.codeValue)?700:500,
                    cursor: cfDtlMode?'default':'pointer',opacity: cfDtlMode?0.8:1,
                    }">
                      <input type="checkbox" :checked="hasVisibility(opt.codeValue)"
                      :disabled="cfDtlMode"
                      @change="handleSelectAction('visibility-toggle', opt.codeValue)"
                      style="accent-color:#1565c0;" />
                      {{ opt.codeLabel }}
                    </label>
                  </div>
                  <div v-if="!cfActiveRow.visibilityTargets" style="font-size:11px;color:#d32f2f;margin-bottom:4px;">
                    ⚠ 선택 없음 — 아무에게도 노출되지 않습니다.
                  </div>
                </div>
                <!-- ===== /설정 영역 ===================================================== -->
                <!-- ===== ■.■.■.■.■.■.■. 섹션 2: 제목 ==================================== -->
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
                        <input type="radio" v-model="cfActiveRow.titleYn" value="Y" :disabled="cfDtlMode" />
                        표시
                      </label>
                      <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;font-weight:500;color:#444;">
                        <input type="radio" v-model="cfActiveRow.titleYn" value="N" :disabled="cfDtlMode" />
                        미표시
                      </label>
                    </span>
                  </div>
                  <div v-if="cfActiveRow.titleYn==='Y'" style="display:flex;align-items:center;gap:10px;">
                    <label style="font-size:12px;font-weight:600;color:#555;width:50px;flex-shrink:0;">
                      타이틀
                    </label>
                    <input v-model="cfActiveRow.title" type="text" placeholder="타이틀 텍스트 입력" :readonly="cfDtlMode"
                    style="flex:1;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;" />
                  </div>
                </div>
                <!-- ===== /제목 영역 ===================================================== -->
                <!-- ===== ■.■.■.■.■.■.■. 섹션 3: 내용 ==================================== -->
                <div style="margin-bottom:14px;padding:14px;background:#fff8fa;border:1px solid #fce4ec;border-radius:8px;">
                  <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
                    <span style="display:inline-block;width:4px;height:16px;background:#e8587a;border-radius:2px;flex-shrink:0;">
                    </span>
                    내용
                    <span style="margin-left:auto;display:inline-flex;align-items:center;gap:6px;flex-shrink:0;">
                      <span style="font-size:11px;font-weight:600;color:#888;white-space:nowrap;">
                        위젯유형
                      </span>
                      <select class="form-control" v-model="cfActiveRow.widgetType" :disabled="cfDtlMode"
                      style="margin:0;font-size:12px;padding:3px 8px;height:28px;border-radius:5px;min-width:160px;">
                        <option v-for="w in codes.disp_widget_types" :key="w?.codeValue" :value="w.codeValue">
                          {{ w.codeLabel }}
                        </option>
                      </select>
                    </span>
                  </div>
                  <!-- ===== ■.■.■.■.■.■.■.■. HTML 에디터 (Toast UI) ======================= -->
                  <div v-if="cfIsHtmlEditor" style="margin-bottom:20px;">
                    <div v-if="cfDtlMode"
                    style="padding:12px 14px;background:#f9f9f9;border:1px solid #e8e8e8;border-radius:6px;font-size:13px;line-height:1.7;min-height:80px;">
                      <span v-if="cfActiveRow.htmlContent" v-html="cfActiveRow.htmlContent">
                      </span>
                      <span v-else style="color:#bbb;">
                        내용 없음
                      </span>
                    </div>
                    <base-html-editor v-else v-model="cfActiveRow.htmlContent" height="280px" />
                  </div>
                  <!-- ===== ■.■.■.■.■.■.■.■. 파일목록 ====================================== -->
                  <div v-else-if="cfIsFileList" style="margin-bottom:20px;">
                    <div v-if="cfDtlMode">
                      <div v-if="cfFileListItems.length===0" style="color:#bbb;padding:12px 0;font-size:13px;">
                        첨부파일 없음
                      </div>
                      <div v-for="(f, i) in cfFileListItems" :key="Math.random()"
                      style="display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid #e8e8e8;border-radius:6px;margin-bottom:6px;background:#fafafa;">
                        <span style="font-size:16px;">
                          📎
                        </span>
                        <a v-if="f.url" :href="f.url" target="_blank"
                        style="font-size:13px;color:#2563eb;text-decoration:none;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                          {{ f.name || f.url }}
                        </a>
                        <span v-else style="font-size:13px;color:#555;flex:1;">
                          {{ f.name }}
                        </span>
                      </div>
                    </div>
                    <div v-else>
                      <!-- ===== ■.■.■.■.■.■.■.■.■.■. 목록 영역 ================================= -->
                      <bo-grid bare :columns="fileListGridColumns" :rows="cfFileListItems" row-actions
                      empty-text="첨부파일이 없습니다. 아래 [+ 파일 추가] 버튼을 클릭하세요."
                      style="margin-bottom:8px;">
                        <template #row-actions="{ idx }">
                          <button @click="removeFileItem(idx)"
                          style="background:none;border:1px solid #fca5a5;border-radius:4px;color:#ef4444;cursor:pointer;padding:2px 7px;font-size:12px;line-height:1.4;">
                            ✕
                          </button>
                        </template>
                      </bo-grid>
                      <button @click="addFileItem"
                      style="font-size:12px;padding:5px 12px;border:1px dashed #aaa;border-radius:5px;background:#fafafa;cursor:pointer;color:#555;">
                        + 파일 추가
                      </button>
                    </div>
                  </div>
                  <!-- ===== ■.■.■.■.■.■.■.■. 일반 표현 설정 테이블 (조건상품 포함) ==================== -->
                  <div v-else-if="cfDisplayRows.length===0" style="color:#bbb;text-align:center;padding:20px 0 24px;font-size:13px;">
                    위젯 유형을 선택하면 표현 설정 항목이 표시됩니다.
                  </div>
                  <!-- ===== ■.■.■.■.■.■.■.■. 테이블 ======================================= -->
                  <table v-else class="bo-table" style="margin-bottom:20px;">
                    <thead>
                      <tr>
                        <th style="width:180px;">
                          항목
                        </th>
                        <th>
                          값
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in cfDisplayRows" :key="row?.key">
                        <td style="font-weight:500;color:#555;vertical-align:middle;">
                          {{ row.label }}
                        </td>
                        <td style="padding:6px 8px;">
                          <input v-if="row.type==='input'" class="form-control" v-model="cfActiveRow[row.key]" :placeholder="row.ph" style="margin:0;" :readonly="cfDtlMode" />
                          <input v-else-if="row.type==='number'" class="form-control" type="number" v-model.number="cfActiveRow[row.key]" style="margin:0;max-width:200px;" :readonly="cfDtlMode" />
                          <select v-else-if="row.type==='select'" class="form-control" v-model="cfActiveRow[row.key]" style="margin:0;max-width:200px;" :disabled="cfDtlMode">
                            <option v-for="o in row.options" :key="o?.v" :value="o.v">
                              {{ o.l }}
                            </option>
                          </select>
                          <textarea v-else-if="row.type==='textarea'" class="form-control" v-model="cfActiveRow[row.key]" rows="3" style="margin:0;" :readonly="cfDtlMode"></textarea>
                            <textarea v-else-if="row.type==='code'" class="form-control" v-model="cfActiveRow[row.key]" rows="6" style="margin:0;font-family:monospace;font-size:12px;background:#1e1e2e;color:#cdd3de;border-color:#444;line-height:1.6;" :readonly="cfDtlMode"></textarea>
                              <div v-else-if="row.type==='color'" style="display:flex;gap:8px;align-items:center;">
                                <input type="color" v-model="cfActiveRow[row.key]" style="width:40px;height:34px;border:1px solid #ddd;border-radius:4px;cursor:pointer;padding:2px;" :disabled="cfDtlMode" />
                                <input class="form-control" v-model="cfActiveRow[row.key]" style="margin:0;max-width:140px;" :readonly="cfDtlMode" />
                                <span style="display:inline-block;width:60px;height:28px;border-radius:4px;border:1px solid #e8e8e8;" :style="{background:cfActiveRow[row.key]}">
                                </span>
                              </div>
                              <textarea v-else-if="row.type==='code'" class="form-control" v-model="cfActiveRow[row.key]" rows="5" style="margin:0;font-family:monospace;font-size:12px;" :placeholder="row.ph" :readonly="cfDtlMode"></textarea>
                                <div v-else-if="row.type==='event'">
                                  <div style="display:flex;gap:8px;align-items:center;">
                                    <input class="form-control" v-model="cfActiveRow.eventId" placeholder="이벤트 ID" style="margin:0;max-width:160px;" :readonly="cfDtlMode" />
                                    <span v-if="cfActiveRow.eventId" class="ref-link" @click="showRefModal('event', Number(cfActiveRow.eventId))">
                                      보기
                                    </span>
                                  </div>
                                  <div v-if="cfRelatedEvent" style="margin-top:6px;padding:8px 12px;background:#e6f4ff;border-radius:6px;font-size:12px;display:flex;align-items:center;gap:8px;">
                                    <b>
                                      {{ cfRelatedEvent.title }}
                                    </b>
                                    <span class="badge badge-green">
                                      {{ cfRelatedEvent.status }}
                                    </span>
                                    <span style="color:#888;">
                                      {{ cfRelatedEvent.startDate }} ~ {{ cfRelatedEvent.endDate }}
                                    </span>
                                  </div>
                                  <div v-else-if="cfActiveRow.eventId" style="margin-top:6px;font-size:12px;color:#aaa;">
                                    해당 이벤트를 찾을 수 없습니다.
                                  </div>
                                </div>
                              </td>
                            </tr>
                            <!-- ===== ■.■.■.■.■.■.■.■.■.■. 조건부 영역 ================================ -->
                            <tr v-if="cfIsText && cfActiveRow.textContent">
                            <td style="font-weight:500;color:#555;">
                              미리보기
                            </td>
                            <td style="padding:6px 8px;">
                              <div style="padding:14px;border-radius:6px;font-size:13px;" :style="{background:cfActiveRow.bgColor,color:cfActiveRow.textColor}">
                                {{ cfActiveRow.textContent }}
                              </div>
                            </td>
                          </tr>
                          <tr v-if="cfIsImage && cfActiveRow.imageUrl">
                          <td style="font-weight:500;color:#555;">
                            이미지 미리보기
                          </td>
                          <td style="padding:6px 8px;">
                            <img :src="cfActiveRow.imageUrl" style="max-height:120px;border-radius:6px;border:1px solid #e8e8e8;" @error="$event.target.style.display='none'" />
                          </td>
                        </tr>
                        <tr v-if="cfIsProduct && cfActiveRow.productIds">
                        <td style="font-weight:500;color:#555;">
                          상품 링크
                        </td>
                        <td style="padding:6px 8px;">
                          <div style="display:flex;flex-wrap:wrap;gap:6px;">
                            <span v-for="pid in cfActiveRow.productIds.split(',').map(s=>s.trim()).filter(Boolean)" :key="pid"
                            class="ref-link" @click="showRefModal('product', Number(pid))"
                            style="padding:2px 10px;background:#e6f4ff;border-radius:12px;font-size:12px;cursor:pointer;">
                              상품 #{{ pid }}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <!-- ===== ■.■.■.■.■.■.■.■. 클릭동작 ====================================== -->
                  <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin-bottom:8px;">
                    👆 클릭동작
                  </div>
                  <!-- ===== ■.■.■.■.■.■.■.■. 테이블 ======================================= -->
                  <table class="bo-table" style="margin-bottom:8px;">
                    <thead>
                      <tr>
                        <th style="width:180px;">
                          항목
                        </th>
                        <th>
                          값
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style="font-weight:500;color:#555;vertical-align:middle;">
                          클릭 시 동작
                        </td>
                        <td style="padding:6px 8px;">
                          <select class="form-control" v-model="cfActiveRow.clickAction" style="margin:0;max-width:220px;" :disabled="cfDtlMode">
                            <option v-for="o in codes.click_action_opts" :key="o.value" :value="o.value">
                              {{ o.label }}
                            </option>
                          </select>
                        </td>
                      </tr>
                      <tr v-if="cfActiveRow.clickAction !== 'none'">
                        <td style="font-weight:500;color:#555;vertical-align:middle;">
                          대상
                        </td>
                        <td style="padding:6px 8px;">
                          <input class="form-control" v-model="cfActiveRow.clickTarget" placeholder="/products, showCoupon, https://..." style="margin:0;" :readonly="cfDtlMode" />
                          <div style="margin-top:6px;font-size:12px;color:#888;">
                            <span v-if="cfActiveRow.clickAction==='navigate'">
                              💡
                              <code>/home</code>
                                ,
                                <code>/products</code>
                                  ,
                                  <code>/detail?pid=1</code>
                                    형식
                                  </span>
                                  <span v-if="cfActiveRow.clickAction==='event'">
                                    💡
                                    <code>showCoupon</code>
                                      ,
                                      <code>openEvent</code>
                                        등 이벤트명
                                      </span>
                                      <span v-if="cfActiveRow.clickAction==='url'">
                                        💡 외부 URL (http:// 포함)
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <!-- ===== /내용 영역 ===================================================== -->
                          <div class="form-actions" v-if="active && !cfDtlMode">
                            <template v-if="cfDtlMode">
                              <button class="btn btn-primary" @click="handleBtnAction('form-edit')">
                                수정
                              </button>
                              <button class="btn btn-secondary" @click="handleBtnAction('form-close')">
                                닫기
                              </button>
                            </template>
                            <template v-else>
                              <button class="btn btn-secondary" @click="handleBtnAction('form-close')">
                                취소
                              </button>
                            </template>
                          </div>
                        </div>
                      </div>
                      <!-- ===== /폼 영역 ====================================================== -->
                      <!-- ===== ■.■.■.■.■. 스플리터 ============================================ -->
                      <div @mousedown="e => handleSelectAction('preview-split', e)"
            style="width:6px;cursor:col-resize;background:#e8e8e8;flex-shrink:0;position:relative;"
            title="드래그로 폭 조절">
                        <div style="position:absolute;top:50%;left:1px;transform:translateY(-50%);width:4px;height:32px;background:#bbb;border-radius:2px;">
                        </div>
                      </div>
                      <!-- ===== ■.■.■.■.■. 위젯미리보기 패널 ======================================= -->
                      <div :style="{
            width: previewPaneWidth + 'px', flexShrink:0,
            borderLeft:'1px solid #e8e8e8', background:'#f7f8fb',
            display:'flex', flexDirection:'column', overflow:'hidden',
            }">
                        <!-- ===== ■.■.■.■.■.■. 위젯미리보기 타이틀 ==================================== -->
                        <div style="padding:10px 14px;border-bottom:1px solid #e0e0e0;background:#f0f2f7;flex-shrink:0;display:flex;align-items:center;gap:6px;">
                          <span style="font-size:11px;font-weight:700;color:#555;letter-spacing:.5px;cursor:help;position:relative;"
                @mouseenter="showComponentTooltip=true" @mouseleave="showComponentTooltip=false">
                            👁 {{ tab==='info' ? '패널' : '전시항목' }}미리보기
                            <span style="position:absolute;bottom:-28px;left:0;background:#333;color:#fff;padding:4px 8px;border-radius:4px;font-size:9px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s;z-index:1000;" :style="{opacity: showComponentTooltip ? 1 : 0}">
                              {{ tab==='info' ? '&lt;disp-x03-panel /&gt;' : '&lt;disp-x04-widget /&gt;' }}
                            </span>
                          </span>
                          <span style="font-size:10px;color:#aaa;margin-left:auto;">
                            {{ tab==='info' ? '전체 전시항목' : (window.safeArrayUtils.safeFind(cfTabLabels, t=>t.key===tab)||{}).label }}
                          </span>
                        </div>
                        <!-- ===== ■.■.■.■.■.■. 디바이스 모드 버튼 ==================================== -->
                        <div style="padding:8px 10px 0;">
                          <div style="display:flex;gap:4px;padding:3px;background:#eef0f3;border-radius:6px;">
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
                        </div>
                        <!-- ===== ■.■.■.■.■.■. 위젯미리보기 내용 (디바이스 프레임) ========================== -->
                        <div style="flex:1;overflow:auto;padding:10px;">
                          <div :style="{
                width: cfPreviewFrameWidth, margin:'0 auto', border:'1px solid #d0d7de', borderRadius:'8px',
                background:'#fff', padding:'8px', transition:'width .2s',
                display:'flex', flexDirection:'column', gap:'10px',
                }">
                            <!-- ===== ■.■.■.■.■.■.■.■. 패널기본정보: 패널 전체 렌더 ========================== -->
                            <template v-if="tab==='info'">
                              <disp-x03-panel
                    :params="{ }"
                    :disp-opt="{ layout:'vertical', showBadges:true }"
                    :panel-item="{...form, rows: rows, status:'활성', condition: form.condition||'항상 표시'}"
                    :show-header="true"
                    />
                            </template>
                            <!-- ===== ■.■.■.■.■.■.■.■. 위젯1~5: 해당 위젯만 ============================= -->
                            <template v-else-if="cfActiveRow">
                              <disp-x04-widget
                    :params="{ }"
                    :disp-opt="{ showBadges: true }"
                    :widget-item="{...cfActiveRow, widgetNm: cfActiveRow.widgetNm||(window.safeArrayUtils.safeFind(cfTabLabels, t=>t.key===tab)||{}).label||'위젯', status:'활성', condition:'항상 표시'}"
                    />
                            </template>
                          </div>
                          <!-- ===== /device frame ============================================== -->
                        </div>
                      </div>
                      <!-- ===== /위젯미리보기 패널 ================================================= -->
                    </div>
                    <!-- ===== /우측 콘텐츠 ==================================================== -->
                  </div>
                  <!-- ===== /탭 모드 flex ================================================= -->
                </div>
                <!-- ===== /내부 flex =================================================== -->
                <!-- ===== □.□. ═══════════════════ 탭 모드 ═══════════════════ ========== -->
                <!-- ===== ■.■. ═══════════════════ 펼치기(아코디언) 모드 ═══════════════════ ===== -->
                <div v-else>
                  <div v-for="(t, tIdx) in cfTabLabels" :key="'va_'+t.key" style="margin-bottom:4px;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
                    <!-- ===== ■.■.■.■. 섹션 헤더 ============================================= -->
                    <div @click="handleSelectAction('section-toggle', t.key)"
          style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;cursor:pointer;user-select:none;transition:background .15s;"
          :style="isSectionExpanded(t.key) ? 'background:#fff0f4;' : 'background:#f2f2f2;'">
                      <div style="display:flex;align-items:center;gap:10px;">
                        <span style="font-size:13px;font-weight:700;" :style="isSectionExpanded(t.key) ? 'color:#e8587a;' : 'color:#555;'">
                          {{ t.label }}
                        </span>
                        <!-- ===== ■.■.■.■.■.■. 위젯 이동 버튼: 위젯 섹션이 열려 있을 때만 표시 ================== -->
                        <template v-if="t.key !== 'info' && isSectionExpanded(t.key)">
                        <button @click.stop="moveRowAt(cfTabRowMap[t.key], -1)" :disabled="cfTabRowMap[t.key]===0"
                style="font-size:10px;border:1px solid #e0e0e0;border-radius:3px;background:#fff;cursor:pointer;padding:1px 6px;color:#888;"
                :style="cfTabRowMap[t.key]===0?'opacity:0.3;cursor:default;':''">
                          ▲
                        </button>
                        <button @click.stop="moveRowAt(cfTabRowMap[t.key], 1)" :disabled="cfTabRowMap[t.key]===rows.length-1"
                style="font-size:10px;border:1px solid #e0e0e0;border-radius:3px;background:#fff;cursor:pointer;padding:1px 6px;color:#888;"
                :style="cfTabRowMap[t.key]===rows.length-1?'opacity:0.3;cursor:default;':''">
                          ▼
                        </button>
                        <!-- ===== ■.■.■.■.■.■.■. 삭제 버튼 (위젯2부터) =============================== -->
                        <button v-if="tIdx >= 2" @click.stop="removeWidget(cfTabRowMap[t.key])"
                style="font-size:11px;padding:1px 7px;border:1px solid #fca5a5;border-radius:4px;background:#fff0f0;color:#dc2626;cursor:pointer;">
                          ✕
                        </button>
                      </template>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <button v-if="t.key === 'info'" @click.stop="openCardPreview()"
              style="font-size:11px;padding:2px 8px;border:1px solid #b39ddb;border-radius:10px;background:#f5f0ff;cursor:pointer;color:#6a1b9a;">
                        🖼 카드
                      </button>
                      <button v-else @click.stop="openPreview(t.key, t.label)"
              style="font-size:12px;border:none;background:none;cursor:pointer;opacity:0.5;">
                        👁
                      </button>
                      <span style="font-size:12px;font-weight:700;" :style="isSectionExpanded(t.key) ? 'color:#e8587a;' : 'color:#bbb;'">
                        {{ isSectionExpanded(t.key) ? '▲' : '▼' }}
                      </span>
                    </div>
                  </div>
                  <!-- ===== ■.■.■.■. 섹션 콘텐츠 ============================================ -->
                  <div v-show="isSectionExpanded(t.key)" style="padding:20px 24px;background:#fff;border-top:1px solid #f0f0f0;">
                    <!-- ===== ■.■.■.■.■. 패널정보 ============================================ -->
                    <div v-if="t.key === 'info'">
                      <!-- ===== ■.■.■.■.■.■. 패널코드/패널명/표시경로/포함영역 (BoFormArea 자동 렌더) ========= -->
                      <!-- ===== ■.■.■.■.■.■. 폼 영역 ========================================== -->
                      <bo-form-area :columns="sectionInfoFormColumns" :form="form" :errors="{}"
              :readonly="cfDtlMode" :cols="3" compact :show-actions="false">
                        <template #pathPick2>
                          <div :style="{padding:'7px 10px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'12px',background:'#f5f5f7',color:form.pathId!=null?'#374151':'#9ca3af',fontWeight:form.pathId!=null?600:400,display:'flex',alignItems:'center',gap:'8px',fontFamily:'monospace'}">
                            <span style="flex:1;">
                              {{ fnPathLabel(form.pathId) || '경로 선택...' }}
                            </span>
                            <button type="button" v-if="!cfDtlMode" @click="openPathPick('form')" title="표시경로 선택"
                    :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'24px',height:'24px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'12px',color:'#6b7280',padding:'0'}"
                    @mouseover="$event.currentTarget.style.background='#eef2ff'"
                    @mouseout="$event.currentTarget.style.background='#fff'">
                              🔍
                            </button>
                          </div>
                        </template>
                        <template #areaDisp2>
                          <div style="padding:8px 10px;border:1px solid #e4e4e4;border-radius:6px;background:#fafbfc;min-height:34px;display:flex;flex-wrap:wrap;gap:4px;align-items:center;">
                            <span v-if="form.area" style="font-size:11px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:10px;padding:2px 10px;">
                              <code style="font-size:10px;background:transparent;">{{ form.area }}</code>
                                &nbsp;{{ cfCurrentAreaLabel }}
                              </span>
                              <span v-else style="font-size:11px;color:#bbb;">
                                영역에 포함되지 않음
                              </span>
                            </div>
                          </template>
                        </bo-form-area>
                        <div class="form-group">
                          <label class="form-label">
                            상태
                          </label>
                          <select class="form-control" style="max-width:200px;" v-model="form.status" :disabled="cfDtlMode">
                            <option v-for="c in codes.active_statuses" :key="c.codeValue" :value="c.codeValue">
                              {{ c.codeLabel }}
                            </option>
                          </select>
                        </div>
                        <!-- ===== ■.■.■.■.■.■. 타이틀 설정 ======================================== -->
                        <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin:16px 0 8px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">
                          🏷 타이틀 설정
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                          <label style="font-size:12px;font-weight:600;color:#555;width:90px;flex-shrink:0;">
                            타이틀 표시
                          </label>
                          <label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer;">
                            <input type="radio" v-model="form.titleYn" value="Y" :disabled="cfDtlMode" />
                            표시
                          </label>
                          <label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer;">
                            <input type="radio" v-model="form.titleYn" value="N" :disabled="cfDtlMode" />
                            미표시
                          </label>
                        </div>
                        <div v-if="form.titleYn==='Y'" style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                          <label style="font-size:12px;font-weight:600;color:#555;width:90px;flex-shrink:0;">
                            타이틀
                          </label>
                          <input v-model="form.title" type="text" placeholder="타이틀 텍스트 입력" :readonly="cfDtlMode"
                style="flex:1;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;" />
                        </div>
                        <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin:16px 0 8px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">
                          📝 HTML 설명
                        </div>
                        <div v-if="cfDtlMode" style="padding:12px 14px;background:#f9f9f9;border:1px solid #e8e8e8;border-radius:6px;font-size:13px;line-height:1.7;min-height:80px;margin-bottom:16px;">
                          <span v-if="form.htmlDesc" v-html="form.htmlDesc">
                          </span>
                          <span v-else style="color:#bbb;">
                            내용 없음
                          </span>
                        </div>
                        <div v-else v-model="form.htmlDesc" is="base-html-editor" height="280px" style="margin-bottom:16px;">
                        </div>
                        <div class="form-actions" v-if="active && !cfDtlMode">
                          <template v-if="cfDtlMode">
                            <button class="btn btn-primary" @click="handleBtnAction('form-edit')">
                              수정
                            </button>
                            <button class="btn btn-secondary" @click="handleBtnAction('form-close')">
                              닫기
                            </button>
                          </template>
                          <template v-else>
                            <button class="btn btn-secondary" @click="handleBtnAction('form-close')">
                              취소
                            </button>
                          </template>
                        </div>
                      </div>
                      <!-- ===== ■.■.■.■.■. 위젯 1~5: 각 섹션이 독립 row 바인딩 ======================== -->
                      <!-- ===== ■.■.■.■.■. v-for 단일 아이템 트릭으로 r 로컬 변수 생성 ==================== -->
                      <template v-else-if="t.key !== 'info'" v-for="r in [rows[cfTabRowMap[t.key]]]" :key="'r_'+t.key">
                        <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">
                          📐 위젯 설정
                        </div>
                        <!-- ===== ■.■.■.■.■.■. 위젯 유형/노출 순서 (BoFormArea 자동 렌더, r 로컬 변수에 바인딩) ===== -->
                        <!-- ===== ■.■.■.■.■.■. 폼 영역 ========================================== -->
                        <bo-form-area :columns="widgetRowFormColumns" :form="r" :errors="{}"
              :readonly="cfDtlMode" :cols="3" compact :show-actions="false" />
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                          <label style="font-size:12px;font-weight:600;color:#555;width:90px;flex-shrink:0;">
                            타이틀 표시
                          </label>
                          <label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer;">
                            <input type="radio" v-model="r.titleYn" value="Y" :disabled="cfDtlMode" />
                            표시
                          </label>
                          <label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer;">
                            <input type="radio" v-model="r.titleYn" value="N" :disabled="cfDtlMode" />
                            미표시
                          </label>
                        </div>
                        <div v-if="r.titleYn==='Y'" style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
                          <label style="font-size:12px;font-weight:600;color:#555;width:90px;flex-shrink:0;">
                            타이틀
                          </label>
                          <input v-model="r.title" type="text" placeholder="타이틀 텍스트 입력" :readonly="cfDtlMode"
                style="flex:1;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;" />
                        </div>
                        <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">
                          🎨 표현 설정
                        </div>
                        <!-- ===== ■.■.■.■.■.■. HTML 에디터: 펼치기 모드에서는 textarea로 표시 ============== -->
                        <div v-if="fnRowIsHtmlEditor(r)" style="margin-bottom:20px;">
                          <div v-if="cfDtlMode" style="padding:12px 14px;background:#f9f9f9;border:1px solid #e8e8e8;border-radius:6px;font-size:13px;line-height:1.7;min-height:80px;">
                            <span v-if="r.htmlContent" v-html="r.htmlContent">
                            </span>
                            <span v-else style="color:#bbb;">
                              내용 없음
                            </span>
                          </div>
                          <textarea v-else class="form-control" v-model="r.htmlContent" rows="6" style="font-family:monospace;font-size:12px;" placeholder="HTML 코드를 입력하세요 (탭 모드에서 HTML 에디터 사용 가능)"></textarea>
                          </div>
                          <!-- ===== ■.■.■.■.■.■. 파일목록 ========================================== -->
                          <div v-else-if="fnRowIsFileList(r)" style="margin-bottom:20px;">
                            <div v-if="cfDtlMode">
                              <div v-if="fnGetFileListItems(r).length===0" style="color:#bbb;padding:12px 0;font-size:13px;">
                                첨부파일 없음
                              </div>
                              <div v-for="(f, fi) in fnGetFileListItems(r)" :key="fi" style="display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid #e8e8e8;border-radius:6px;margin-bottom:6px;background:#fafafa;">
                                <span>
                                  📎
                                </span>
                                <a v-if="f.url" :href="f.url" target="_blank" style="font-size:13px;color:#2563eb;text-decoration:none;flex:1;">
                                  {{ f.name || f.url }}
                                </a>
                                <span v-else style="font-size:13px;color:#555;flex:1;">
                                  {{ f.name }}
                                </span>
                              </div>
                            </div>
                            <div v-else>
                              <!-- ===== ■.■.■.■.■.■.■.■. 목록 영역 ===================================== -->
                              <bo-grid bare :columns="fnFileListColsForRow(r)" :rows="fnGetFileListItems(r)" row-actions
                  empty-text="첨부파일이 없습니다." style="margin-bottom:8px;">
                                <template #row-actions="{ idx }">
                                  <button @click="fnRemoveFileItemAt(r,idx)" style="background:none;border:1px solid #fca5a5;border-radius:4px;color:#ef4444;cursor:pointer;padding:2px 7px;font-size:12px;line-height:1.4;">
                                    ✕
                                  </button>
                                </template>
                              </bo-grid>
                              <button @click="fnAddFileItemAt(r)" style="font-size:12px;padding:5px 12px;border:1px dashed #aaa;border-radius:5px;background:#fafafa;cursor:pointer;color:#555;">
                                + 파일 추가
                              </button>
                            </div>
                          </div>
                          <!-- ===== ■.■.■.■.■.■. 일반 표현 설정 ====================================== -->
                          <div v-else-if="fnGetDisplayRows(r).length===0" style="color:#bbb;text-align:center;padding:20px 0 24px;font-size:13px;">
                            위젯 유형을 선택하면 표현 설정 항목이 표시됩니다.
                          </div>
                          <!-- ===== ■.■.■.■.■.■. 테이블 =========================================== -->
                          <table v-else class="bo-table" style="margin-bottom:20px;">
                            <thead>
                              <tr>
                                <th style="width:180px;">
                                  항목
                                </th>
                                <th>
                                  값
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="drow in fnGetDisplayRows(r)" :key="drow?.key">
                                <td style="font-weight:500;color:#555;vertical-align:middle;">
                                  {{ drow.label }}
                                </td>
                                <td style="padding:6px 8px;">
                                  <input v-if="drow.type==='input'" class="form-control" v-model="r[drow.key]" :placeholder="drow.ph" style="margin:0;" :readonly="cfDtlMode" />
                                  <input v-else-if="drow.type==='number'" class="form-control" type="number" v-model.number="r[drow.key]" style="margin:0;max-width:200px;" :readonly="cfDtlMode" />
                                  <select v-else-if="drow.type==='select'" class="form-control" v-model="r[drow.key]" style="margin:0;max-width:200px;" :disabled="cfDtlMode">
                                    <option v-for="o in drow.options" :key="o?.v" :value="o.v">
                                      {{ o.l }}
                                    </option>
                                  </select>
                                  <textarea v-else-if="drow.type==='textarea'" class="form-control" v-model="r[drow.key]" rows="3" style="margin:0;" :readonly="cfDtlMode"></textarea>
                                    <textarea v-else-if="drow.type==='code'" class="form-control" v-model="r[drow.key]" rows="6" style="margin:0;font-family:monospace;font-size:12px;background:#1e1e2e;color:#cdd3de;border-color:#444;line-height:1.6;" :readonly="cfDtlMode"></textarea>
                                      <div v-else-if="drow.type==='color'" style="display:flex;gap:8px;align-items:center;">
                                        <input type="color" v-model="r[drow.key]" style="width:40px;height:34px;border:1px solid #ddd;border-radius:4px;cursor:pointer;padding:2px;" :disabled="cfDtlMode" />
                                        <input class="form-control" v-model="r[drow.key]" style="margin:0;max-width:140px;" :readonly="cfDtlMode" />
                                        <span style="display:inline-block;width:60px;height:28px;border-radius:4px;border:1px solid #e8e8e8;" :style="{background:r[drow.key]}">
                                        </span>
                                      </div>
                                      <textarea v-else-if="drow.type==='code'" class="form-control" v-model="r[drow.key]" rows="5" style="margin:0;font-family:monospace;font-size:12px;" :placeholder="drow.ph" :readonly="cfDtlMode"></textarea>
                                        <div v-else-if="drow.type==='event'">
                                          <div style="display:flex;gap:8px;align-items:center;">
                                            <input class="form-control" v-model="r.eventId" placeholder="이벤트 ID" style="margin:0;max-width:160px;" :readonly="cfDtlMode" />
                                            <span v-if="r.eventId" class="ref-link" @click="showRefModal('event', Number(r.eventId))">
                                              보기
                                            </span>
                                          </div>
                                          <div v-if="fnGetRelatedEvent(r)" style="margin-top:6px;padding:8px 12px;background:#e6f4ff;border-radius:6px;font-size:12px;display:flex;align-items:center;gap:8px;">
                                            <b>
                                              {{ fnGetRelatedEvent(r).title }}
                                            </b>
                                            <span class="badge badge-green">
                                              {{ fnGetRelatedEvent(r).status }}
                                            </span>
                                            <span style="color:#888;">
                                              {{ fnGetRelatedEvent(r).startDate }} ~ {{ fnGetRelatedEvent(r).endDate }}
                                            </span>
                                          </div>
                                          <div v-else-if="r.eventId" style="margin-top:6px;font-size:12px;color:#aaa;">
                                            해당 이벤트를 찾을 수 없습니다.
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                    <!-- ===== ■.■.■.■.■.■.■.■. 조건부 영역 ==================================== -->
                                    <tr v-if="fnRowIsText(r) && r.textContent">
                                    <td style="font-weight:500;color:#555;">
                                      미리보기
                                    </td>
                                    <td style="padding:6px 8px;">
                                      <div style="padding:14px;border-radius:6px;font-size:13px;" :style="{background:r.bgColor,color:r.textColor}">
                                        {{ r.textContent }}
                                      </div>
                                    </td>
                                  </tr>
                                  <tr v-if="fnRowIsImage(r) && r.imageUrl">
                                  <td style="font-weight:500;color:#555;">
                                    이미지 미리보기
                                  </td>
                                  <td style="padding:6px 8px;">
                                    <img :src="r.imageUrl" style="max-height:120px;border-radius:6px;border:1px solid #e8e8e8;" @error="$event.target.style.display='none'" />
                                  </td>
                                </tr>
                                <tr v-if="fnRowIsProduct(r) && r.productIds">
                                <td style="font-weight:500;color:#555;">
                                  상품 링크
                                </td>
                                <td style="padding:6px 8px;">
                                  <div style="display:flex;flex-wrap:wrap;gap:6px;">
                                    <span v-for="pid in r.productIds.split(',').map(s=>s.trim()).filter(Boolean)" :key="pid"
                        class="ref-link" @click="showRefModal('product', Number(pid))"
                        style="padding:2px 10px;background:#e6f4ff;border-radius:12px;font-size:12px;cursor:pointer;">
                                      상품 #{{ pid }}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">
                            👆 클릭 동작
                          </div>
                          <!-- ===== ■.■.■.■.■.■. 테이블 =========================================== -->
                          <table class="bo-table" style="margin-bottom:20px;">
                            <thead>
                              <tr>
                                <th style="width:180px;">
                                  항목
                                </th>
                                <th>
                                  값
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style="font-weight:500;color:#555;vertical-align:middle;">
                                  클릭 시 동작
                                </td>
                                <td style="padding:6px 8px;">
                                  <select class="form-control" v-model="r.clickAction" style="margin:0;max-width:220px;" :disabled="cfDtlMode">
                                    <option v-for="o in codes.click_action_opts" :key="o.value" :value="o.value">
                                      {{ o.label }}
                                    </option>
                                  </select>
                                </td>
                              </tr>
                              <tr v-if="r.clickAction !== 'none'">
                                <td style="font-weight:500;color:#555;vertical-align:middle;">
                                  대상
                                </td>
                                <td style="padding:6px 8px;">
                                  <input class="form-control" v-model="r.clickTarget" placeholder="/products, showCoupon, https://..." style="margin:0;" :readonly="cfDtlMode" />
                                  <div style="margin-top:6px;font-size:12px;color:#888;">
                                    <span v-if="r.clickAction==='navigate'">
                                      💡
                                      <code>/home</code>
                                        ,
                                        <code>/products</code>
                                          형식
                                        </span>
                                        <span v-if="r.clickAction==='event'">
                                          💡
                                          <code>showCoupon</code>
                                            ,
                                            <code>openEvent</code>
                                              등
                                            </span>
                                            <span v-if="r.clickAction==='url'">
                                              💡 외부 URL (http:// 포함)
                                            </span>
                                          </div>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                  <div class="form-actions" v-if="active && !cfDtlMode">
                                    <template v-if="cfDtlMode">
                                      <button class="btn btn-primary" @click="handleBtnAction('form-edit')">
                                        수정
                                      </button>
                                      <button class="btn btn-secondary" @click="handleBtnAction('form-close')">
                                        닫기
                                      </button>
                                    </template>
                                    <template v-else>
                                      <button class="btn btn-secondary" @click="handleBtnAction('form-close')">
                                        취소
                                      </button>
                                    </template>
                                  </div>
                                </template>
                              </div>
                              <!-- ===== /섹션 콘텐츠 ==================================================== -->
                            </div>
                            <!-- ===== /v-for 섹션 ================================================== -->
                            <!-- ===== ■.■.■. 위젯 추가 버튼 (펼치기 모드) =================================== -->
                            <div v-if="rows.length < MAX_WIDGETS" style="margin-top:6px;">
                              <button @click="!cfIsNew && addWidget()" :disabled="cfIsNew" :title="cfIsNew ? '저장 후 전시항목을 추가할 수 있습니다.' : ''" :style="cfIsNew ? 'width:100%;padding:9px 0;border:1.5px dashed #e0e0e0;border-radius:8px;background:#f5f5f5;cursor:not-allowed;font-size:13px;color:#bbb;' : 'width:100%;padding:9px 0;border:1.5px dashed #d0d0d0;border-radius:8px;background:#fafafa;cursor:pointer;font-size:13px;color:#888;'">
                              + 위젯 추가
                            </button>
                          </div>
                        </div>
                        <!-- ===== /펼치기 아코디언 모드 =============================================== -->
                      </div>
                      <!-- ===== □.□. ═══════════════════ 펼치기(아코디언) 모드 ═══════════════════ ===== -->
                      <!-- ===== □. 카드 영역 =================================================== -->
                      <!-- ===== ■. 위젯미리보기 모달 =============================================== -->
                      <disp-preview-modal
    :show="preview.show"
    mode="single"
    :tab-label="preview.tabLabel"
    :area="form.area"
    :widgets="[]"
    :widget="cfPreviewWidget" modal-name="disp-preview" :on-callback="fnCallbackModal" />
                      <!-- ===== □. 위젯미리보기 모달 =============================================== -->
                      <!-- ===== ■. 패널미리보기 오버레이 ============================================= -->
                      <div v-if="cardPreview && cardPreview.show" @click.self="closeCardPreview" style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;">
                      <div style="background:#fff;border-radius:14px;width:520px;max-width:92vw;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.35);">
                        <!-- ===== ■.■.■. 헤더 ================================================== -->
                        <div style="background:linear-gradient(135deg,#e8587a,#c0395e);color:#fff;padding:15px 20px;border-radius:14px 14px 0 0;display:flex;justify-content:space-between;align-items:center;">
                          <span style="font-size:14px;font-weight:700;">
                            🖼 패널미리보기
                          </span>
                          <button @click="closeCardPreview" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;opacity:0.85;line-height:1;padding:0;">
                            ×
                          </button>
                        </div>
                        <!-- ===== ■.■.■. 카드 본문 =============================================== -->
                        <div style="padding:24px;">
                          <!-- ===== ■.■.■.■. 영역 + 상태 배지 ======================================== -->
                          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center;">
                            <code style="font-size:11px;background:#f0f2f5;color:#555;padding:3px 8px;border-radius:4px;letter-spacing:.3px;">
            {{ form.area }}
          </code>
                              <span style="font-size:12px;background:#e8f4fd;color:#1565c0;border-radius:10px;padding:2px 10px;">
                                {{ cfCurrentAreaLabel }}
                              </span>
                              <span class="badge" :class="form.status==='활성'?'badge-green':'badge-gray'" style="font-size:12px;">
                                {{ form.status }}
                              </span>
                            </div>
                            <!-- ===== ■.■.■.■. 패널명 =============================================== -->
                            <div style="font-size:22px;font-weight:800;color:#222;margin-bottom:16px;line-height:1.3;">
                              {{ form.name || '(패널명 없음)' }}
                            </div>
                            <!-- ===== ■.■.■.■. 위젯 구성 ============================================= -->
                            <div style="border-top:1px solid #f0f0f0;padding-top:14px;">
                              <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:10px;">
                                📐 위젯 구성
                              </div>
                              <div v-for="(r, i) in rows" :key="Math.random()"
            style="display:flex;align-items:center;gap:10px;padding:9px 14px;border:1px solid #f0f0f0;border-radius:8px;margin-bottom:6px;background:#fafafa;">
                                <span style="font-size:11px;color:#bbb;font-weight:700;min-width:16px;text-align:center;">
                                  {{ i+1 }}
                                </span>
                                <span style="font-size:13px;font-weight:600;color:#333;flex:1;">
                                  {{ fnWLabel(r.widgetType) }}
                                </span>
                                <span style="font-size:10px;background:#e8f0fe;color:#1a73e8;border-radius:8px;padding:2px 8px;">
                                  순서 {{ r.sortOrder }}
                                </span>
                                <span v-if="r.clickAction && r.clickAction !== 'none'" style="font-size:10px;color:#888;background:#f0f0f0;border-radius:8px;padding:2px 8px;">
                                {{ r.clickAction }}
                              </span>
                            </div>
                          </div>
                        </div>
                        <!-- ===== ■.■.■. 푸터 ================================================== -->
                        <div style="padding:12px 20px;background:#f8f8f8;border-top:1px solid #f0f0f0;border-radius:0 0 14px 14px;text-align:right;">
                          <button @click="closeCardPreview" class="btn btn-secondary btn-sm">
                            닫기
                          </button>
                        </div>
                      </div>
                    </div>
                    <!-- ===== □. 패널미리보기 오버레이 ============================================= -->
                    <!-- ===== ■. 전시위젯Lib 선택 팝업 =========================================== -->
                    <widget-lib-pick-modal v-if="libPickOpen" :mode="libPickMode"
    :widget-libs="[] || []" modal-name="widget-lib-pick" :on-callback="fnCallbackModal" />
                    <!-- ===== □. 전시위젯Lib 선택 팝업 =========================================== -->
                    <!-- ===== ■. 전시항목 복사 팝업 ============================================== -->
                    <row-pick-modal v-if="rowCopyOpen"
    :title="'전시항목 복사 [' + (form.name || '현재 패널') + ']'"
    :displays="[] || []"
    :areas="([]||[]).filter(c => c.codeGrp==='DISP_AREA')"
    :exclude-panel-id="form.dispId" modal-name="row-pick" :on-callback="fnCallbackModal" />
                    <!-- ===== □. 전시항목 복사 팝업 ============================================== -->
                    <!-- ===== ■. 조건부 영역 ================================================== -->
                    <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="ec_disp_panel" :value="form.pathId" title="표시경로 선택" modal-name="path-pick" :on-callback="fnCallbackModal" />
                  </div>
                  <!-- ===== □. 조건부 영역 ================================================== -->
`,
};
