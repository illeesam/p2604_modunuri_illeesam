/* ShopJoy Admin - 전시위젯 상세/등록 */
window.DpDispWidgetDtl = {
  name: 'DpDispWidgetDtl',
  props: {
    navigate:      { type: Function, required: true }, // 페이지 이동
    dtlId:         { type: String, default: null }, // 수정 대상 ID
    dtlMode:       { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload:  { type: Function, default: () => {} }, // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
    reloadTrigger: { type: Number, default: 0 }, // 부모 Mng 가 ++ 로 신호 보내면 상세 API 재조회 (정책: 수정 클릭 시 항상 호출)
  },
  emits: ['close'],
  setup(props, { emit }) {
    // ===== [01] 초기 변수 정의 ==================================================
    const { reactive, computed, ref, onMounted, watch, nextTick } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const codes = reactive({ disp_widget_types: [], active_statuses: [], click_action_opts: [{value:'none',label:'없음'},{value:'navigate',label:'페이지 이동'},{value:'event',label:'이벤트 실행'},{value:'modal',label:'모달 열기'}] });
    const uiState = reactive({ isPageCodeLoad: false, loading: false, error: null, previewMode: 'default', previewPaneWidth: 460, libPickMode: 'copy', libPickOpen: false, showComponentTooltip: false, jsonCopied: false });
    const previewMode = Vue.toRef(uiState, 'previewMode');

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ DpDispWidgetDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장
      if (cmd === 'form-save') {
        return handleSave();
      // 폼 삭제
      } else if (cmd === 'form-delete') {
        return handleDelete();
      // 패널 닫기
      } else if (cmd === 'form-close') {
        return emit('close');
      // 위젯Lib 선택 팝업 열기 (param: 'copy' 또는 'ref')
      } else if (cmd === 'libPickModal-open') {
        return openLibPick(param);
      // 위젯Lib 선택 팝업 닫기
      } else if (cmd === 'libPickModal-close') {
        uiState.libPickOpen = false;
        return;
      // 표시경로 선택 모달 열기
      } else if (cmd === 'pathModal-open') {
        return openPathPick();
      // 표시경로 선택 모달 닫기
      } else if (cmd === 'pathModal-close') {
        return closePathPick();
      // 표시경로 초기화
      } else if (cmd === 'form-path-clear') {
        form.pathId = null;
        return;
      // 참조 해제
      } else if (cmd === 'form-ref-clear') {
        form.refLibId = null; form.refLibCode = ''; form.refLibName = '';
        return;
      // 파일목록 - 항목 추가
      } else if (cmd === 'fileList-add') {
        return addFileItem();
      // 파일목록 - 항목 제거 (param: idx)
      } else if (cmd === 'fileList-remove') {
        return removeFileItem(param);
      // JSON 복사
      } else if (cmd === 'jsonView-copy') {
        return copyJson();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ DpDispWidgetDtl.js : handleSelectAction -> ', cmd, param);
      // 미리보기 디바이스 모드 변경
      if (cmd === 'preview-mode') {
        uiState.previewMode = param;
        return;
      // 스플리터 드래그
      } else if (cmd === 'preview-split') {
        return onSplitDrag(param);
      // 위젯Lib 픽 모달에서 라이브러리 선택
      } else if (cmd === 'libPickModal-select') {
        return onLibPicked(param);
      // 표시경로 모달에서 경로 선택
      } else if (cmd === 'pathModal-pick') {
        return onPathPicked(param);
      // 전시환경 토글 (param: code)
      } else if (cmd === 'dispEnv-toggle') {
        return toggleDispEnv(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    // ===== [03] 초기 함수 (마운트 / 코드 로드 / watch) ==============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.disp_widget_types = codeStore.sgGetGrpCodes('DISP_WIDGET_TYPE');
      codes.active_statuses = codeStore.sgGetGrpCodes('ACTIVE_STATUS');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // 코드 주입

    /* -- 표시경로 선택 모달 (sy_path, 다중) -- */
    const pathPickModal = reactive({ show: false });

    /* openPathPick — 경로 선택 열기 */
    const openPathPick = () => { pathPickModal.show = true; };

    /* closePathPick — 경로 선택 닫기 */
    const closePathPick = () => { pathPickModal.show = false; };

    /* onPathPicked — 이벤트 */
    const onPathPicked = (pathId) => { form.pathId = pathId; };

    /* pathLabel — 경로 라벨 */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));
    const cfIsNew = computed(() => !props.dtlId);

    /* makeForm — 생성 */
    const makeForm = () => ({
      widgetLibId: null, /* 백엔드 DTO 필드 (PK) */
      widgetCode: '', widgetNm: '', widgetTypeCd: 'image_banner', widgetLibDesc: '',
      siteId: null, useYn: 'Y', sortOrd: 0, thumbnailUrl: '', widgetConfigJson: '',
      /* ── UI 호환용 별칭 (기존 화면 코드 호환) ── */
      libId: null, libCode: '', name: '', widgetType: 'image_banner', desc: '', tags: '', status: '활성',
      dispEnv: '^DEV^',
      titleYn: 'N', title: '',
      pathId: null,
      regDate: new Date().toISOString().slice(0, 10),
      /* 위젯 공통 */
      clickAction: 'none', clickTarget: '',
      /* 이미지 배너 / 팝업 */
      imageUrl: '', altText: '', linkUrl: '',
      /* 상품 */
      productIds: '',
      /* 차트 */
      chartTitle: '', chartLabels: '', chartValues: '',
      /* 텍스트 배너 */
      textContent: '', bgColor: '#ffffff', textColor: '#222222',
      /* 정보 카드 */
      infoTitle: '', infoBody: '',
      /* 팝업 */
      popupWidth: 600, popupHeight: 400,
      /* 파일 */
      fileUrl: '', fileLabel: '',
      /* 파일목록 */
      fileListJson: '[]',
      /* 쿠폰 */
      couponCode: '', couponDesc: '',
      /* HTML 에디터 */
      htmlContent: '',
      /* 텍스트 영역 */
      textareaContent: '',
      /* Markdown */
      markdownContent: '',
      /* 바코드 / QR */
      codeValue: '', codeFormat: 'CODE128', codeWidth: 2, codeHeight: 60,
      showCodeLabel: true, qrSize: 120, qrErrorLevel: 'M',
      /* 동영상 */
      videoUrl: '', videoType: 'youtube', videoAutoplay: false, videoControls: true,
      /* 카운트다운 */
      countdownTarget: '', countdownTitle: '이벤트 종료까지', countdownExpiredMsg: '이벤트가 종료되었습니다.',
      countdownBgColor: '#1a237e', countdownTextColor: '#ffffff',
      /* 결제위젯 */
      payAmount: 0, payCurrency: 'KRW', payMethods: 'card,kakao,naver,toss',
      payButtonLabel: '결제하기', payButtonColor: '#1677ff',
      /* 전자결재 */
      approvalDocType: '구매승인', approvalTitle: '', approvalLine: '[{"role":"담당자","name":""},{"role":"팀장","name":""},{"role":"부서장","name":""}]',
      /* 지도맵 */
      mapType: 'google', mapAddress: '', mapLat: '', mapLng: '', mapZoom: 14, mapMarkerLabel: '',
      /* 이벤트 */
      eventId: '',
      /* 캐시 */
      cacheDesc: '', cacheAmount: 0,
      /* 위젯임베드 */
      embedCode: '',
      /* 조건상품 */
      condSite: '', condUser: '', condCategory: '', condBrand: '', condSort: 'newest', condLimit: 8,
    });

    const form   = reactive(makeForm());
    const errors = reactive({});

    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ====================

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.dpWidget.getById(props.dtlId, '전시위젯관리', '상세조회');
        const data = res.data?.data;
        if (data) {
          /* 1) form 초기화 후 백엔드 데이터 적용 (이전 행의 잔여값 제거) */
          Object.assign(form, makeForm(), data);

          /* 2) 백엔드 DTO 필드 → 폼 UI 별칭 동기화 (dp_widget 기준)
           * dp_widget: widgetId(PK) / widgetLibId(라이브러리 참조 FK) / widgetNm / widgetTypeCd /
           *           widgetTitle / widgetDesc / widgetContent / widgetConfigJson / titleShowYn / useYn */
          form.libId       = data.widgetId      ?? form.libId;     /* UI 호환: PK 는 widgetId */
          form.name        = data.widgetNm      ?? form.name;
          form.widgetType  = data.widgetTypeCd  ?? form.widgetType;
          form.desc        = data.widgetDesc    ?? form.desc;
          form.title       = data.widgetTitle   ?? form.title;
          form.titleYn     = data.titleShowYn   ?? form.titleYn;
          form.status      = data.useYn === 'Y' ? '활성' : (data.useYn === 'N' ? '비활성' : form.status);

          /* 3) widgetConfigJson 의 값 → 폼 콘텐츠 필드 채우기 (dp_widget 의 실데이터) */
          let cfg = null;
          try { cfg = JSON.parse(data.widgetConfigJson || '{}') || {}; }
          catch (_) { cfg = {}; }
          if (cfg) {
            const pick = (k1, k2) => cfg[k1] != null ? cfg[k1] : (k2 != null ? cfg[k2] : undefined);
            const setVal = (key, val) => { if (val !== undefined) form[key] = val; };
            setVal('imageUrl',        pick('img_url', 'imageUrl'));
            setVal('linkUrl',         pick('link_url', 'linkUrl'));
            setVal('altText',         pick('alt'));
            setVal('textContent',     pick('text'));
            setVal('bgColor',         pick('bg_color', 'bgColor'));
            setVal('textColor',       pick('text_color', 'textColor'));
            setVal('infoTitle',       pick('title'));
            setVal('infoBody',        pick('content'));
            setVal('couponCode',      pick('coupon_id'));
            setVal('couponDesc',      pick('btn_label'));
            setVal('htmlContent',     pick('html'));
            setVal('textareaContent', pick('text'));
            setVal('markdownContent', pick('markdown'));
            setVal('codeValue',       pick('value'));
            setVal('videoUrl',        pick('video_url', 'videoUrl'));
            setVal('countdownTitle',  pick('label'));
            setVal('countdownTarget', pick('target_datetime', 'targetDatetime'));
            setVal('fileUrl',         pick('file_url'));
            setVal('fileLabel',       pick('btn_label'));
            setVal('chartTitle',      pick('title'));
            setVal('chartLabels',     Array.isArray(cfg.labels) ? cfg.labels.join(',') : undefined);
            setVal('chartValues',     Array.isArray(cfg.values) ? cfg.values.join(',') : undefined);
            setVal('payAmount',       pick('amount'));
          }
          /* 4) html_editor 콘텐츠: dp_widget 의 widget_content 컬럼이 저장처
           * 폴백 우선순위: widgetContent(인스턴스 직접 작성) > config.html(설정 default) */
          if (form.widgetType === 'html_editor') {
            const wContent  = data.widgetContent || '';
            const cfgHtml   = (cfg && typeof cfg.html === 'string') ? cfg.html : '';
            form.htmlContent = wContent || cfgHtml || form.htmlContent || '';
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

    /* fnGenWidgetCode — 유틸 */
    const fnGenWidgetCode = () => {
      const t = new Date();

      /* p — p */
      const p = n => String(n).padStart(2, '0');
      return `DW_${String(t.getFullYear()).slice(2)}${p(t.getMonth()+1)}${p(t.getDate())}_${p(t.getHours())}${p(t.getMinutes())}${p(t.getSeconds())}`;
    };

    /* handleInitNewForm — 처리 */
    const handleInitNewForm = () => {
      if (!cfIsNew.value) { return; }
      form.libCode = fnGenWidgetCode();
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(async () => {
      if (isAppReady.value) { fnLoadCodes(); }
      await handleLoadDetail();
      handleInitNewForm();
    });

    /* 정책: 수정 클릭 시 항상 상세 API 호출.
     * 부모 Mng 가 reloadTrigger 를 ++ 하면 (같은 id 재클릭 / 다른 id 클릭 모두 포함) form 초기화 후 새 데이터 로드 */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      Object.keys(errors).forEach(k => delete errors[k]);
      Object.assign(form, makeForm());
      await handleLoadDetail();
      handleInitNewForm();
    });

    /* -- 위젯 유형별 표시 여부 -- */
    const cfIsImage       = computed(() => form.widgetType === 'image_banner');
    const cfIsProduct     = computed(() => ['product_slider', 'product'].includes(form.widgetType));
    const cfIsCondProduct = computed(() => form.widgetType === 'cond_product');
    const cfIsChart       = computed(() => form.widgetType.startsWith('chart_'));
    const cfIsText        = computed(() => form.widgetType === 'text_banner');
    const cfIsInfo        = computed(() => form.widgetType === 'info_card');
    const cfIsPopup       = computed(() => form.widgetType === 'popup');
    const cfIsFile        = computed(() => form.widgetType === 'file');
    const cfIsFileList    = computed(() => form.widgetType === 'file_list');
    const cfIsCoupon      = computed(() => form.widgetType === 'coupon');
    const cfIsHtmlEditor  = computed(() => form.widgetType === 'html_editor');
    const cfIsTextarea    = computed(() => form.widgetType === 'textarea');
    const cfIsMarkdown    = computed(() => form.widgetType === 'markdown');
    const cfIsBarcode     = computed(() => form.widgetType === 'barcode');
    const cfIsQrcode      = computed(() => form.widgetType === 'qrcode');
    const cfIsBarcodeQr   = computed(() => form.widgetType === 'barcode_qrcode');
    const cfIsCodeWidget  = computed(() => cfIsBarcode.value || cfIsQrcode.value || cfIsBarcodeQr.value);
    const cfIsVideoPlayer = computed(() => form.widgetType === 'video_player');
    const cfIsCountdown   = computed(() => form.widgetType === 'countdown');
    const cfIsPayment     = computed(() => form.widgetType === 'payment_widget');
    const cfIsApproval    = computed(() => form.widgetType === 'approval_widget');
    const cfIsMapWidget   = computed(() => form.widgetType === 'map_widget');
    const cfIsEvent       = computed(() => form.widgetType === 'event_banner');
    const cfIsCache       = computed(() => form.widgetType === 'cache_banner');
    const cfIsEmbed       = computed(() => form.widgetType === 'widget_embed');

    /* -- 파일목록 헬퍼 -- */
    const cfFileListItems = computed(() => {
      try { return JSON.parse(form.fileListJson || '[]'); } catch { return []; }
    });

    /* saveFileList — 저장 */
    const saveFileList   = (items) => { form.fileListJson = JSON.stringify(items); };

    /* addFileItem — 추가 */
    const addFileItem    = () => saveFileList([...cfFileListItems.value, { name: '', url: '' }]);

    /* removeFileItem — 제거 */
    const removeFileItem = (idx) => saveFileList(window.safeArrayUtils.safeFilter(cfFileListItems, (_, i) => i !== idx));

    /* updateFileItem — 갱신 */
    const updateFileItem = (idx, field, val) =>
      saveFileList(cfFileListItems.value.map((item, i) => i === idx ? { ...item, [field]: val } : item));

    /* -- 동적 공통 입력 행 정의 -- */
    const cfDisplayRows = computed(() => {
      if (cfIsImage.value) return [
        { key: 'imageUrl', label: '이미지 URL',  type: 'input',  ph: 'https://...' },
        { key: 'altText',  label: 'Alt 텍스트',  type: 'input',  ph: '' },
        { key: 'linkUrl',  label: '링크 URL',    type: 'input',  ph: 'https://...' },
      ];
      if (cfIsProduct.value) return [
        { key: 'productIds', label: '상품 ID 목록', type: 'input', ph: '1, 2, 3, ...' },
      ];
      if (cfIsChart.value) return [
        { key: 'chartTitle',  label: '차트 제목',        type: 'input',  ph: '' },
        { key: 'chartLabels', label: '라벨 (쉼표 구분)', type: 'input',  ph: '1월, 2월, 3월' },
        { key: 'chartValues', label: '값 (쉼표 구분)',   type: 'input',  ph: '100, 200, 150' },
      ];
      if (cfIsText.value) return [
        { key: 'textContent', label: '텍스트 내용', type: 'textarea', ph: '' },
        { key: 'bgColor',     label: '배경색',      type: 'color' },
        { key: 'textColor',   label: '글자색',      type: 'color' },
      ];
      if (cfIsInfo.value) return [
        { key: 'infoTitle', label: '카드 제목', type: 'input',    ph: '' },
        { key: 'infoBody',  label: '카드 내용', type: 'textarea', ph: '' },
      ];
      if (cfIsPopup.value) return [
        { key: 'popupWidth',  label: '팝업 너비 (px)',  type: 'number', ph: '' },
        { key: 'popupHeight', label: '팝업 높이 (px)',  type: 'number', ph: '' },
        { key: 'imageUrl',    label: '팝업 이미지 URL', type: 'input',  ph: 'https://...' },
        { key: 'linkUrl',     label: '링크 URL',        type: 'input',  ph: '' },
      ];
      if (cfIsFile.value) return [
        { key: 'fileUrl',   label: '파일 URL',    type: 'input', ph: '' },
        { key: 'fileLabel', label: '표시 레이블', type: 'input', ph: '다운로드' },
      ];
      if (cfIsCoupon.value) return [
        { key: 'couponCode', label: '쿠폰 코드', type: 'input', ph: 'COUPON_CODE' },
        { key: 'couponDesc', label: '쿠폰 설명', type: 'input', ph: '' },
      ];
      if (cfIsTextarea.value) return [
        { key: 'textareaContent', label: '텍스트 내용', type: 'textarea', ph: '텍스트를 입력하세요...' },
      ];
      if (cfIsMarkdown.value) return [
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
        { key: 'payAmount',      label: '결제 금액',            type: 'number', ph: '0' },
        { key: 'payCurrency',    label: '통화',                 type: 'select', options: [{v:'KRW',l:'원 (KRW)'},{v:'USD',l:'달러 (USD)'}] },
        { key: 'payMethods',     label: '결제수단 (쉼표 구분)', type: 'input',  ph: 'card,kakao,naver,toss,bank' },
        { key: 'payButtonLabel', label: '버튼 텍스트',          type: 'input',  ph: '결제하기' },
        { key: 'payButtonColor', label: '버튼 색상',            type: 'color' },
      ];
      if (cfIsApproval.value) return [
        { key: 'approvalDocType', label: '문서 유형',     type: 'select', options: [{v:'구매승인',l:'구매승인'},{v:'지출결의',l:'지출결의'},{v:'휴가신청',l:'휴가신청'},{v:'기안',l:'기안'},{v:'품의서',l:'품의서'}] },
        { key: 'approvalTitle',   label: '결재 제목',     type: 'input', ph: '' },
        { key: 'approvalLine',    label: '결재선 (JSON)', type: 'code',  ph: '[{"role":"담당자","name":"홍길동"},{"role":"팀장","name":""}]' },
      ];
      if (cfIsMapWidget.value) return [
        { key: 'mapType',        label: '지도 유형',  type: 'select', options: [{v:'google',l:'Google Maps'},{v:'kakao',l:'카카오맵'},{v:'naver',l:'네이버지도'}] },
        { key: 'mapAddress',     label: '주소',       type: 'input',  ph: '서울시 강남구 테헤란로 123' },
        { key: 'mapLat',         label: '위도 (lat)', type: 'input',  ph: '37.5005' },
        { key: 'mapLng',         label: '경도 (lng)', type: 'input',  ph: '127.0356' },
        { key: 'mapZoom',        label: '줌 레벨',   type: 'number', ph: '14' },
        { key: 'mapMarkerLabel', label: '마커 라벨', type: 'input',  ph: '우리 매장' },
      ];
      if (cfIsEvent.value) return [
        { key: 'eventId', label: '이벤트 ID', type: 'input', ph: '' },
      ];
      if (cfIsCache.value) return [
        { key: 'cacheDesc',   label: '캐시 설명',  type: 'input',  ph: '' },
        { key: 'cacheAmount', label: '캐시 금액',  type: 'number', ph: '0' },
      ];
      if (cfIsEmbed.value) return [
        { key: 'embedCode', label: '임베드 코드', type: 'textarea', ph: '<script>...</script>' },
      ];
      if (cfIsCondProduct.value) return [
        { key: 'condCategory', label: '카테고리 조건', type: 'input', ph: '' },
        { key: 'condBrand',    label: '브랜드 조건',   type: 'input', ph: '' },
        { key: 'condSort',     label: '정렬 기준',     type: 'select', options: [{v:'newest',l:'최신순'},{v:'popular',l:'인기순'},{v:'price_asc',l:'가격낮은순'},{v:'price_desc',l:'가격높은순'}] },
        { key: 'condLimit',    label: '표시 개수',     type: 'number', ph: '8' },
      ];
      return [];
    });

    /* -- 샘플 JSON -- */
    const cfSampleJson = computed(() => {
      const obj = { ...form };
      // 유형과 무관한 빈 필드 제거 (가독성)
      Object.keys(obj).forEach(k => {
        if (obj[k] === '' || obj[k] === null) { delete obj[k]; }
      });
      return JSON.stringify(obj, null, 2);
    });

    /* copyJson — 복사 */
    const copyJson = () => {
      navigator.clipboard?.writeText(cfSampleJson.value).then(() => {
        uiState.jsonCopied = true;
        setTimeout(() => { uiState.jsonCopied = false; }, 1500);
      });
    };

    /* -- 디바이스 모드 + 스플리터 -- */
        const PREVIEW_MODES = [
      { value: 'default', label: '기본',   width: 420  },
      { value: 'pc',      label: 'PC',     width: 1200 },
      { value: 'tablet',  label: '태블릿', width: 768  },
      { value: 'mobile',  label: '모바일', width: 375  },
    ];
    const cfPreviewFrameWidth = computed(() => {
      const m = window.safeArrayUtils.safeFind(PREVIEW_MODES, x => x.value === uiState.previewMode);
      return (m?.width || 420) + 'px';
    });

        watch(previewMode, (m) => {
      const info = window.safeArrayUtils.safeFind(PREVIEW_MODES, x => x.value === m);
      uiState.previewPaneWidth = (info?.width || 420) + 40;
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

    /* -- 위젯미리보기용 위젯 객체 -- */
    const cfPreviewWidget = computed(() => ({
      ...form,
      dispId: form.widgetLibId || 0,
      name: form.name || '미리보기',
      area: 'PREVIEW',
      status: '활성',
      useYn: 'Y',
      dispYn: 'Y',
      condition: '항상 표시',
      authRequired: false,
      authGrade: '',
    }));

    /* HTML 에디터는 공통 <base-html-editor> 컴포넌트가 처리 (Toast UI Editor) */

    /* -- Yup 유효성 -- */
    const schema = window.yup.object({
      libCode:    window.yup.string().required('위젯코드를 입력하세요.'),
      name:       window.yup.string().required('라이브러리명을 입력하세요.'),
      widgetType: window.yup.string().required('위젯 유형을 선택하세요.'),
    });

    /* form (UI 별칭 포함) → 백엔드 DTO 필드 매핑 */

    /* _toApiBody — → API 본문 */
    const _toApiBody = () => {
      const body = { ...form };
      body.widgetId     = form.widgetId    || form.libId;   /* dp_widget PK */
      body.widgetLibId  = form.widgetLibId || null;          /* 라이브러리 참조 (선택) */
      body.widgetNm     = form.widgetNm    || form.name;
      body.widgetTypeCd = form.widgetTypeCd || form.widgetType;
      body.widgetDesc   = form.widgetDesc  || form.desc;
      body.widgetTitle  = form.widgetTitle || form.title;
      body.titleShowYn  = form.titleShowYn || form.titleYn || 'N';
      body.useYn        = form.status === '활성' ? 'Y' : (form.status === '비활성' ? 'N' : (form.useYn || 'Y'));
      /* html_editor 콘텐츠는 dp_widget 의 widget_content 컬럼에 저장 */
      if (form.widgetType === 'html_editor' || form.widgetTypeCd === 'html_editor') {
        body.widgetContent = form.htmlContent || '';
      }
      return body;
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      /* 위젯코드 비어있거나 placeholder 그대로면 자동 생성 (검증 전) */
      if (!form.libCode || form.libCode.trim() === '' || form.libCode === 'DW_YYMMDD_HHMMSS') {
        form.libCode = fnGenWidgetCode();
      }
      try { await schema.validate(form, { abortEarly: false }); }
      catch (err) { err.inner.forEach(e => { errors[e.path] = e.message; }); showToast('입력 내용을 확인해주세요.', 'error'); return; }

      const isNewWidget = cfIsNew.value;
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) { return; }
      try {
        const body = _toApiBody();
        const id = body.widgetId;
        const res = await (isNewWidget
          ? boApiSvc.dpWidget.create(body, '전시위젯관리', '등록')
          : boApiSvc.dpWidget.update(id, body, '전시위젯관리', '저장'));
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('dpDispWidgetMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* handleDelete — 삭제 */
    const handleDelete = async () => {
      if (cfIsNew.value) { return; }
      const ok = await showConfirm('삭제', '이 위젯를 삭제하시겠습니까?');
      if (!ok) { return; }
      try {
        const res = await boApiSvc.dpWidget.remove(form.widgetId || form.libId, '전시위젯관리', '삭제');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
      props.navigate('dpDispWidgetMng', { reload: true });
    };

    /* -- 위젯Lib 선택 팝업 -- */

    /* openLibPick — 열기 */
    const openLibPick = (mode) => { uiState.libPickMode = mode; uiState.libPickOpen = true; };

    /* onLibPicked — 이벤트 */
    const onLibPicked = (lib) => {
      uiState.libPickOpen = false;
      if (uiState.libPickMode === 'copy') {
        const preserve = { libId: form.widgetLibId, libCode: form.libCode, regDate: form.regDate };
        Object.assign(form, { ...lib, ...preserve });
        showToast && showToast(`[${lib.name}] 내용을 복사했습니다.`, 'info');
      } else {
        form.refLibId = lib.libId;
        form.refLibCode = lib.libCode || '';
        form.refLibName = lib.name || '';
        showToast && showToast(`[${lib.name}] 참조로 설정되었습니다.`, 'info');
      }
    };

    /* -- 위젯 전시 환경 멀티체크 토글 -- */
    const dispEnvOptions = [
      { code: 'PLAN', label: '준비/계획' },
      { code: 'DEV', label: 'DEV' },
      { code: 'TEST', label: 'TEST' },
      { code: 'PROD', label: 'PROD' },
    ];

    /* hasDispEnv — 여부 확인 */
    const hasDispEnv = (code) => {
      return form.dispEnv.includes('^' + code + '^');
    };

    /* toggleDispEnv — 토글 */
    const toggleDispEnv = (code) => {
      const envList = form.dispEnv.split('^').filter(e => e && e !== 'NONE');
      const i = envList.indexOf(code);
      if (i >= 0) envList.splice(i, 1); else envList.push(code);
      form.dispEnv = envList.length > 0 ? '^' + envList.join('^') + '^' : '^NONE^';
    };

    const libPickMode = Vue.toRef(uiState, 'libPickMode');
    const libPickOpen = Vue.toRef(uiState, 'libPickOpen');
    const showComponentTooltip = Vue.toRef(uiState, 'showComponentTooltip');
    const jsonCopied = Vue.toRef(uiState, 'jsonCopied');
    const previewPaneWidth = Vue.toRef(uiState, 'previewPaneWidth');

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - 위젯 기본 설정 ================
    // ===== [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ====================

    const baseWidgetFormColumns = [
      { key: 'libCode', label: '위젯코드', type: 'text', required: true,
        placeholder: '비워두면 자동 생성 (예: DW_260508_191415)', mono: true },
      { key: 'name',    label: '라이브러리명', type: 'text', required: true, placeholder: '위젯 이름' },
      { key: 'status',  label: '상태', type: 'select', options: () => codes.active_statuses },
      { type: 'rowBreak' },
      { key: 'desc',    label: '설명', type: 'text', placeholder: '위젯 용도·설명 메모', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'tags',    label: '태그', type: 'text', placeholder: '봄,배너,시즌',
        hint: '쉼표 구분', colSpan: 2 },
    ];
    // 클릭 액션 (클릭 동작 / 클릭 대상)
    const clickActionFormColumns = [
      { key: 'clickAction', label: '클릭 동작', type: 'select', options: () => codes.click_action_opts },
      { key: 'clickTarget', label: '클릭 대상', type: 'text', placeholder: '/products 또는 이벤트명' },
    ];

    // ===== [06] return (템플릿 노출) ==============================================

    return {
      pathPickModal, uiState, codes, form, errors,                                   // 상태 / 데이터
      baseWidgetFormColumns, clickActionFormColumns,                                 // 컬럼 정의
      handleBtnAction, handleSelectAction,                                           // dispatch (모든 이벤트 / 액션 라우팅)
      cfDtlMode, cfIsNew, cfDisplayRows, cfFileListItems,                            // computed
      cfPreviewWidget, cfSampleJson, cfPreviewFrameWidth,                            // computed
      cfIsImage, cfIsProduct, cfIsCondProduct, cfIsChart, cfIsText, cfIsInfo,        // computed (위젯 유형 분기)
      cfIsPopup, cfIsFile, cfIsFileList, cfIsCoupon, cfIsHtmlEditor,                 // computed
      cfIsEvent, cfIsCache, cfIsEmbed,                                               // computed
      previewMode, libPickMode, libPickOpen, showComponentTooltip,                   // toRef
      jsonCopied, previewPaneWidth,                                                  // toRef
      PREVIEW_MODES, dispEnvOptions,                                                 // 상수
      pathLabel, hasDispEnv, updateFileItem,                                         // 헬퍼 (template 직접 호출 유지)
    };
  },
  template: /* html */`
<div class="card" style="padding:0;">
  <!-- ===== ■. 헤더 ====================================================== -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f0f0f0;background:#fafafa;border-radius:8px 8px 0 0;">
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="font-size:15px;font-weight:700;color:#222;">
        {{ cfIsNew ? '위젯 신규등록' : '위젯 수정' }}
      </span>
      <span v-if="!cfIsNew" style="font-size:11px;background:#eee;color:#666;border-radius:4px;padding:1px 7px;">
        #{{ String(form.widgetLibId).padStart(4,'0') }}
      </span>
    </div>
    <div class="form-actions" v-if="!cfDtlMode" style="margin:0;gap:8px;">
      <button @click="handleBtnAction('libPickModal-open', 'copy')" class="btn btn-outline" style="font-size:12px;background:#e3f2fd;color:#1565c0;border-color:#90caf9;">
        📋 전시위젯Lib 내용복사
      </button>
      <button @click="handleBtnAction('libPickModal-open', 'ref')"  class="btn btn-outline" style="font-size:12px;background:#f3e5f5;color:#6a1b9a;border-color:#ce93d8;">
        🔗 전시위젯Lib 참조
      </button>
      <button @click="handleBtnAction('form-save')"   class="btn btn-primary" style="font-size:13px;">
        저장
      </button>
      <button v-if="!cfIsNew" @click="handleBtnAction('form-delete')" class="btn btn-outline" style="font-size:13px;color:#e8587a;border-color:#e8587a;">
        삭제
      </button>
      <button @click="handleBtnAction('form-close')" class="btn btn-outline" style="font-size:13px;">
        닫기
      </button>
    </div>
    <!-- ===== ■.■. 위젯Lib 선택 팝업 =========================================== -->
    <widget-lib-pick-modal v-if="libPickOpen" :mode="libPickMode"
      :widget-libs="[] || []"
      @close="handleBtnAction('libPickModal-close')"
      @pick="lib => handleSelectAction('libPickModal-select', lib)" />
  </div>
  <!-- ===== □.□. 위젯Lib 선택 팝업 =========================================== -->
  <!-- ===== □. 헤더 ====================================================== -->
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="display:flex;gap:0;">
    <!-- ===== ■.■. 왼쪽: 폼 ================================================= -->
    <div style="flex:1;padding:20px;min-width:0;overflow-y:auto;">
      <!-- ===== ■.■.■. 🔗 참조 정보 ============================================ -->
      <div v-if="form.refLibId"
        style="background:linear-gradient(135deg,#f3e5f5 0%,#fff 100%);border:1px dashed #ce93d8;border-radius:10px;padding:12px 14px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:12px;font-weight:700;color:#6a1b9a;">
            🔗 전시위젯Lib 참조 중
          </span>
          <button @click="handleBtnAction('form-ref-clear')"
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
          <span v-if="form.refLibCode">
            <b style="color:#888;">
              참조항목Code:
            </b>
            <code style="background:#fff;color:#6a1b9a;padding:1px 6px;border-radius:3px;margin-left:3px;border:1px solid #e1bee7;">
              {{ form.refLibCode }}
            </code>
            </span>
            <span>
              <b style="color:#888;">
                참조항목ID:
              </b>
              <code style="background:#fff;color:#6a1b9a;padding:1px 6px;border-radius:3px;margin-left:3px;border:1px solid #e1bee7;">
              #{{ String(form.refLibId).padStart(4,'0') }}
            </code>
              </span>
              <span v-if="form.refLibName">
                <b style="color:#888;">
                  참조명:
                </b>
                {{ form.refLibName }}
              </span>
            </div>
            <div style="background:#fff;border:1px solid #e1bee7;border-radius:8px;padding:10px;">
              <div style="font-size:10px;color:#888;font-weight:600;margin-bottom:6px;letter-spacing:.3px;">
                ▸ 참조 내용 미리보기
              </div>
              <disp-x04-widget
            :params="{ }"
            :disp-opt="{ showBadges: true }"
            :widget-item="([]||[]).find(l => l.libId===form.refLibId) || {}" />
            </div>
          </div>
          <!-- ===== ■.■.■. 설정 ================================================== -->
          <div style="margin-bottom:14px;padding:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
            <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:4px;height:16px;background:#1d4ed8;border-radius:2px;">
              </span>
              설정
            </div>
            <!-- ===== ■.■.■.■. 위젯코드/라이브러리명/상태/설명/태그 (BoFormArea 자동 렌더) =========== -->
            <!-- ===== ■.■.■.■. 폼 영역 ============================================== -->
            <bo-form-area :columns="baseWidgetFormColumns" :form="form" :errors="errors"
          :readonly="cfDtlMode" :cols="2" :show-actions="false" />
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
            cursor:'pointer',
            }">
                <input type="checkbox" :checked="hasDispEnv(opt.code)"
              @change="handleSelectAction('dispEnv-toggle', opt.code)"
              style="accent-color:#7c3aed;" />
                {{ opt.label }}
              </label>
            </div>
            <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin-bottom:6px;">
              표시경로
              <span style="font-size:10px;font-weight:400;color:#aaa;">
                이 위젯이 노출되는 경로
              </span>
            </div>
            <div :style="{padding:'7px 10px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'12px',background:'#f5f5f7',color:form.pathId!=null?'#374151':'#9ca3af',fontWeight:form.pathId!=null?600:400,display:'flex',alignItems:'center',gap:'8px',fontFamily:'monospace'}">
              <span style="flex:1;">
                {{ pathLabel(form.pathId) || '경로 선택...' }}
              </span>
              <button type="button" @click="handleBtnAction('pathModal-open')" title="표시경로 선택"
            :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'24px',height:'24px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'12px',color:'#6b7280',padding:'0'}"
            @mouseover="$event.currentTarget.style.background='#eef2ff'"
            @mouseout="$event.currentTarget.style.background='#fff'">
                🔍
              </button>
              <button v-if="form.pathId != null" type="button" @click="handleBtnAction('form-path-clear')"
            style="padding:4px 8px;border:1px solid #fca5a5;background:#fff0f0;color:#dc2626;border-radius:4px;cursor:pointer;font-size:11px;">
                ✕
              </button>
            </div>
          </div>
          <!-- ===== /설정 ======================================================== -->
          <!-- ===== ■.■.■. 제목 ================================================== -->
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
              <input v-model="form.title" type="text" placeholder="타이틀 텍스트 입력" class="form-control" style="margin:0;flex:1;" />
            </div>
          </div>
          <!-- ===== /제목 ======================================================== -->
          <!-- ===== ■.■.■. 내용 ================================================== -->
          <div style="margin-bottom:14px;padding:14px;background:#fff8fa;border:1px solid #fce4ec;border-radius:8px;">
            <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:4px;height:16px;background:#e8587a;border-radius:2px;flex-shrink:0;">
              </span>
              내용
              <span style="margin-left:auto;display:inline-flex;align-items:center;gap:6px;flex-shrink:0;">
                <span style="font-size:11px;font-weight:600;color:#888;white-space:nowrap;">
                  위젯유형
                </span>
                <select v-model="form.widgetType" class="form-control" :class="{'is-invalid':errors.widgetType}"
              style="margin:0;font-size:12px;padding:3px 8px;height:28px;border-radius:5px;min-width:160px;">
                  <option v-for="t in codes.disp_widget_types" :key="t?.codeValue" :value="t.codeValue">
                    {{ t.codeLabel }}
                  </option>
                </select>
              </span>
            </div>
            <div v-if="errors.widgetType" class="field-error" style="margin-bottom:8px;">
              {{ errors.widgetType }}
            </div>
            <!-- ===== ■.■.■.■. 클릭 액션 (html_editor·file_list·embed 제외) - BoFormArea 자동 렌더 ===== -->
            <div v-if="!cfIsHtmlEditor && !cfIsFileList && !cfIsEmbed" style="margin-bottom:12px;">
            <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin-bottom:8px;">
              👆 클릭동작
            </div>
            <!-- ===== ■.■.■.■.■. 폼 영역 ============================================ -->
            <bo-form-area :columns="clickActionFormColumns" :form="form" :errors="errors"
            :readonly="cfDtlMode" :cols="2" :show-actions="false" />
          </div>
          <!-- ===== ■.■.■.■. 공통 동적 행 =========================================== -->
          <div v-if="cfDisplayRows.length" style="display:flex;flex-direction:column;gap:10px;">
            <div v-for="row in cfDisplayRows" :key="row?.key" class="form-group" style="margin:0;">
              <label class="form-label">
                {{ row.label }}
              </label>
              <input  v-if="row.type==='input'"    v-model="form[row.key]" class="form-control" :placeholder="row.ph||''" style="margin:0;" />
              <input  v-else-if="row.type==='number'"  v-model.number="form[row.key]" type="number" class="form-control" :placeholder="row.ph||''" style="margin:0;" />
              <input  v-else-if="row.type==='color'"   v-model="form[row.key]" type="color" class="form-control" style="margin:0;height:36px;padding:2px 6px;" />
              <textarea v-else-if="row.type==='textarea'" v-model="form[row.key]" class="form-control" :placeholder="row.ph||''" rows="3" style="margin:0;"></textarea>
                <textarea v-else-if="row.type==='code'" v-model="form[row.key]" class="form-control" :placeholder="row.ph||''" rows="6" style="margin:0;font-family:monospace;font-size:12px;background:#1e1e2e;color:#cdd3de;border-color:#444;line-height:1.6;"></textarea>
                  <select v-else-if="row.type==='select'" v-model="form[row.key]" class="form-control" style="margin:0;">
                    <option v-for="o in row.options" :key="o?.v" :value="o.v">
                      {{ o.l }}
                    </option>
                  </select>
                </div>
              </div>
              <!-- ===== ■.■.■.■. HTML 에디터 (공통 BaseHtmlEditor — Toast UI Editor) ===== -->
              <div v-else-if="cfIsHtmlEditor" class="form-group" style="margin:0;">
                <base-html-editor v-model="form.htmlContent" height="320px" />
              </div>
              <!-- ===== ■.■.■.■. 파일목록 ============================================== -->
              <div v-else-if="cfIsFileList">
                <div v-for="(item, idx) in cfFileListItems" :key="Math.random()"
            style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
                  <input :value="item.name" @input="updateFileItem(idx,'name',$event.target.value)"
              class="form-control" placeholder="파일명" style="margin:0;flex:1;" />
                  <input :value="item.url" @input="updateFileItem(idx,'url',$event.target.value)"
              class="form-control" placeholder="파일 URL" style="margin:0;flex:2;" />
                  <button @click="handleBtnAction('fileList-remove', idx)" style="flex-shrink:0;background:none;border:none;color:#e8587a;cursor:pointer;font-size:16px;">
                    ×
                  </button>
                </div>
                <button @click="handleBtnAction('fileList-add')" class="btn btn-outline" style="font-size:12px;padding:4px 14px;">
                  + 파일 추가
                </button>
              </div>
              <div v-else style="font-size:12px;color:#aaa;text-align:center;padding:10px;">
                위젯 유형을 선택하면 입력 필드가 표시됩니다.
              </div>
            </div>
            <!-- ===== /내용 ======================================================== -->
          </div>
          <!-- ===== □.□. 왼쪽: 폼 ================================================= -->
          <!-- ===== ■.■. 스플리터 ================================================== -->
          <div @mousedown="e => handleSelectAction('preview-split', e)"
      style="width:6px;cursor:col-resize;background:#e8e8e8;flex-shrink:0;position:relative;"
      title="드래그로 폭 조절">
            <div style="position:absolute;top:50%;left:1px;transform:translateY(-50%);width:4px;height:32px;background:#bbb;border-radius:2px;">
            </div>
          </div>
          <!-- ===== □.□. 스플리터 ================================================== -->
          <!-- ===== ■.■. 오른쪽: 위젯미리보기 =========================================== -->
          <div :style="{ width: previewPaneWidth + 'px', flexShrink:0, padding:'20px', background:'#f8f8f8', overflowX:'auto', transition:'width .2s' }">
            <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:10px;cursor:help;position:relative;"
        @mouseenter="showComponentTooltip=true" @mouseleave="showComponentTooltip=false">
              👁 위젯미리보기
              <span style="position:absolute;bottom:-28px;left:0;background:#333;color:#fff;padding:4px 8px;border-radius:4px;font-size:9px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s;z-index:1000;" :style="{opacity: showComponentTooltip ? 1 : 0}">
                &lt;disp-x04-widget /&gt;
              </span>
            </div>
            <!-- ===== ■.■.■. 디바이스 모드 버튼 ========================================== -->
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
            <div :style="{ width: cfPreviewFrameWidth, margin:'0 auto', background:'#fff', border:'1px solid #e4e4e4', borderRadius:'8px', padding:'12px', minHeight:'100px', transition:'width .2s' }">
              <disp-x04-widget
          :params="{ }"
          :disp-opt="{ showBadges: true }"
          :widget-item="cfPreviewWidget"
          />
            </div>
            <div style="margin-top:12px;font-size:11px;color:#aaa;line-height:1.6;">
              <div>
                유형:
                <b>
                  {{ form.widgetType }}
                </b>
              </div>
              <div v-if="form.tags">
                태그: {{ form.tags }}
              </div>
              <div v-if="!cfIsNew">
                ID: #{{ String(form.widgetLibId).padStart(4,'0') }}
              </div>
            </div>
            <!-- ===== ■.■.■. 샘플 JSON ============================================= -->
            <div style="margin-top:16px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                <span style="font-size:12px;font-weight:700;color:#555;">
                  📋 샘플 JSON
                </span>
                <button @click="handleBtnAction('jsonView-copy')"
            style="font-size:10px;padding:2px 8px;border:1px solid #d0d0d0;border-radius:6px;background:#fff;cursor:pointer;color:#666;transition:all .15s;"
            :style="jsonCopied ? 'background:#e8f5e9;color:#2e7d32;border-color:#a5d6a7;' : ''">
                  {{ jsonCopied ? '✓ 복사됨' : '복사' }}
                </button>
              </div>
              <pre style="background:#1e1e2e;color:#cdd9e5;border-radius:8px;padding:10px 12px;font-size:10px;line-height:1.55;overflow:auto;max-height:320px;margin:0;white-space:pre-wrap;word-break:break-all;">{{ cfSampleJson }}</pre>
              </div>
            </div>
          </div>
          <!-- ===== □.□. 오른쪽: 위젯미리보기 =========================================== -->
          <!-- ===== □. 본문 영역 =================================================== -->
          <!-- ===== ■. 조건부 영역 ================================================== -->
          <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="ec_disp_widget" :value="form.pathId" title="위젯 표시경로 선택" @select="pathId => handleSelectAction('pathModal-pick', pathId)" @close="handleBtnAction('pathModal-close')" />
        </div>
        <!-- ===== □. 조건부 영역 ================================================== -->
`
};
