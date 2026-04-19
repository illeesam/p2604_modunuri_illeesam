/* ShopJoy Admin - 전시관리 상세/등록 */
window.DpDispPanelDtl = {
  name: 'DpDispPanelDtl',
  props: ['navigate', 'dispDataset', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    /* ── 표시경로 선택 모달 (sy_path) ── */
    const pathPickModal = Vue.reactive({ show: false, target: null });
    const openPathPick = (target) => { pathPickModal.target = target; pathPickModal.show = true; };
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.target = null; };
    const onPathPicked = (pathId) => { if (pathPickModal.target === 'form') form.pathId = pathId; };
    const pathLabel = (id) => window.adminUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));

    const { reactive, computed, ref, onMounted, watch, nextTick } = Vue;
    const isNew = computed(() => !props.editId);
    const tab = ref('info');
    const showComponentTooltip = ref(false);
    const previewMode = ref('default');
    const PREVIEW_MODES = [
      { value: 'default', label: '기본',   width: 480  },
      { value: 'pc',      label: 'PC',     width: 1200 },
      { value: 'tablet',  label: '태블릿', width: 768  },
      { value: 'mobile',  label: '모바일', width: 375  },
    ];
    const previewFrameWidth = computed(() => {
      const m = PREVIEW_MODES.find(x => x.value === previewMode.value);
      return (m?.width || 480) + 'px';
    });
    /* 패널 폭(스플리터 드래그 반영). 모드 변경 시 자동 갱신 */
    const previewPaneWidth = ref(520);
    Vue.watch(previewMode, (m) => {
      const info = PREVIEW_MODES.find(x => x.value === m);
      previewPaneWidth.value = (info?.width || 480) + 40;
    });
    /* 스플리터 드래그 */
    const onSplitDrag = (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = previewPaneWidth.value;
      const onMove = (ev) => {
        previewPaneWidth.value = Math.max(260, Math.min(1600, startW + (startX - ev.clientX)));
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };

    /* ── 패널정보 (패널 공통) ── */
    const LAYOUT_TYPE_OPTS = [
      { value: 'grid',      label: '그리드' },
      { value: 'dashboard', label: '대시보드' },
    ];
    /* ── 기본 기간: 오늘 ~ +10년 ── */
    const _today = new Date();
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

    /* ── 행별 독립 데이터 팩토리 ── */
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
      dispStartDate: DEFAULT_START_DATE, dispStartTime: '00:00', dispEndDate: DEFAULT_END_DATE, dispEndTime: '23:59',
      /* 위젯 전시 환경 */
      dispEnv: '^DEV^',
      ...overrides,
    });

    const rows = reactive([
      makeRowData({ sortOrder: 1 }),
    ]);
    const MAX_WIDGETS = 10;

    const TAB_LABELS   = computed(() => [
      { key: 'info', label: '패널기본정보' },
      ...rows.map((_, i) => ({ key: 'tab'+(i+1), label: '전시항목 '+(i+1) })),
    ]);
    const TAB_ROW_MAP  = computed(() => { const m = {}; rows.forEach((_, i) => { m['tab'+(i+1)] = i; }); return m; });
    const ROW_TAB_KEYS = computed(() => rows.map((_, i) => 'tab'+(i+1)));

    const activeRowIdx = computed(() => { const idx = TAB_ROW_MAP.value[tab.value]; return idx !== undefined ? idx : null; });
    const activeRow    = computed(() => (activeRowIdx.value !== null && activeRowIdx.value !== undefined) ? rows[activeRowIdx.value] : null);

    /* ── 위젯 위아래 이동 (탭순서 = 노출순서 sortOrder 자동 갱신) ── */
    const moveRow = (dir) => {
      const idx = activeRowIdx.value;
      if (idx === null) return;
      const target = idx + dir;
      if (target < 0 || target >= rows.length) return;
      const a = { ...rows[idx] };
      const b = { ...rows[target] };
      Object.assign(rows[idx], b);
      Object.assign(rows[target], a);
      /* 탭 순서(1~5)를 sortOrder에 반영 */
      rows.forEach((r, i) => { r.sortOrder = i + 1; });
      tab.value = ROW_TAB_KEYS.value[target];
    };

    const WIDGET_TYPES = [
      { value: 'image_banner',  label: '이미지 배너' },
      { value: 'product_slider',label: '상품 슬라이더' },
      { value: 'product',       label: '상품' },
      { value: 'cond_product',  label: '조건상품' },
      { value: 'chart_bar',     label: '차트 (Bar)' },
      { value: 'chart_line',    label: '차트 (Line)' },
      { value: 'chart_pie',     label: '차트 (Pie)' },
      { value: 'text_banner',   label: '텍스트 배너' },
      { value: 'info_card',     label: '정보 카드' },
      { value: 'popup',         label: '팝업' },
      { value: 'file',          label: '파일' },
      { value: 'file_list',     label: '파일목록' },
      { value: 'coupon',        label: '쿠폰' },
      { value: 'html_editor',   label: 'HTML 에디터' },
      { value: 'textarea',      label: '텍스트 영역' },
      { value: 'markdown',      label: 'Markdown' },
      { value: 'barcode',        label: '바코드' },
      { value: 'qrcode',         label: 'QR코드' },
      { value: 'barcode_qrcode', label: '바코드+QR' },
      { value: 'video_player',   label: '동영상 플레이어' },
      { value: 'countdown',      label: '카운트다운 타이머' },
      { value: 'payment_widget', label: '결제위젯' },
      { value: 'approval_widget',label: '전자결재' },
      { value: 'map_widget',     label: '지도맵' },
      { value: 'event_banner',   label: '이벤트' },
      { value: 'cache_banner',  label: '캐쉬' },
      { value: 'widget_embed',  label: '위젯' },
    ];

    const AREAS = computed(() =>
      (props.dispDataset.codes || [])
        .filter(c => c.codeGrp === 'DISP_AREA' && c.useYn === 'Y')
        .sort((a, b) => a.sortOrd - b.sortOrd)
    );

    const isChart       = computed(() => activeRow.value?.widgetType?.startsWith('chart_'));
    const isProduct     = computed(() => ['product_slider','product'].includes(activeRow.value?.widgetType));
    const isImage       = computed(() => activeRow.value?.widgetType === 'image_banner');
    const isText        = computed(() => activeRow.value?.widgetType === 'text_banner');
    const isInfo        = computed(() => activeRow.value?.widgetType === 'info_card');
    const isPopup       = computed(() => activeRow.value?.widgetType === 'popup');
    const isFile        = computed(() => activeRow.value?.widgetType === 'file');
    const isFileList    = computed(() => activeRow.value?.widgetType === 'file_list');
    const isCoupon      = computed(() => activeRow.value?.widgetType === 'coupon');
    const isHtmlEditor  = computed(() => activeRow.value?.widgetType === 'html_editor');
    const isTextarea      = computed(() => activeRow.value?.widgetType === 'textarea');
    const isMarkdown      = computed(() => activeRow.value?.widgetType === 'markdown');
    const isBarcode       = computed(() => activeRow.value?.widgetType === 'barcode');
    const isQrcode        = computed(() => activeRow.value?.widgetType === 'qrcode');
    const isBarcodeQr     = computed(() => activeRow.value?.widgetType === 'barcode_qrcode');
    const isCodeWidget    = computed(() => isBarcode.value || isQrcode.value || isBarcodeQr.value);
    const isVideoPlayer   = computed(() => activeRow.value?.widgetType === 'video_player');
    const isCountdown     = computed(() => activeRow.value?.widgetType === 'countdown');
    const isPayment       = computed(() => activeRow.value?.widgetType === 'payment_widget');
    const isApproval      = computed(() => activeRow.value?.widgetType === 'approval_widget');
    const isMapWidget     = computed(() => activeRow.value?.widgetType === 'map_widget');
    const isEventBanner   = computed(() => activeRow.value?.widgetType === 'event_banner');
    const isCacheBanner = computed(() => activeRow.value?.widgetType === 'cache_banner');
    const isWidgetEmbed = computed(() => activeRow.value?.widgetType === 'widget_embed');
    const isCondProduct = computed(() => activeRow.value?.widgetType === 'cond_product');

    /* ── 파일목록 헬퍼 ── */
    const fileListItems = computed(() => {
      try { return JSON.parse(activeRow.value?.fileListJson || '[]'); }
      catch { return []; }
    });
    const _saveFileList = (items) => {
      if (activeRow.value) activeRow.value.fileListJson = JSON.stringify(items);
    };
    const addFileItem    = () => _saveFileList([...fileListItems.value, { name: '', url: '' }]);
    const removeFileItem = (idx) => _saveFileList(fileListItems.value.filter((_, i) => i !== idx));
    const updateFileItem = (idx, field, val) =>
      _saveFileList(fileListItems.value.map((item, i) => i === idx ? { ...item, [field]: val } : item));

    /* displayRows — html_editor는 Quill로 별도 렌더하므로 제외 */
    const displayRows = computed(() => {
      if (!activeRow.value) return [];
      if (isImage.value)       return [
        { key: 'imageUrl', label: '이미지 URL',  type: 'input', ph: 'https://...' },
        { key: 'altText',  label: 'Alt 텍스트',  type: 'input', ph: '' },
        { key: 'linkUrl',  label: '링크 URL',    type: 'input', ph: 'https://...' },
      ];
      if (isProduct.value)     return [
        { key: 'productIds', label: '상품 ID 목록', type: 'input', ph: '1, 2, 3, ...' },
      ];
      if (isChart.value)       return [
        { key: 'chartTitle',  label: '차트 제목',        type: 'input',  ph: '' },
        { key: 'chartType',   label: '차트 유형',        type: 'select', options: [{v:'bar',l:'Bar'},{v:'line',l:'Line'},{v:'pie',l:'Pie'}] },
        { key: 'chartLabels', label: '라벨 (쉼표 구분)', type: 'input',  ph: '1월, 2월, 3월' },
        { key: 'chartValues', label: '값 (쉼표 구분)',   type: 'input',  ph: '100, 200, 150' },
      ];
      if (isText.value)        return [
        { key: 'textContent', label: '텍스트 내용', type: 'textarea', ph: '' },
        { key: 'bgColor',     label: '배경색',      type: 'color',   ph: '' },
        { key: 'textColor',   label: '글자색',      type: 'color',   ph: '' },
      ];
      if (isInfo.value)        return [
        { key: 'infoTitle', label: '카드 제목', type: 'input',    ph: '' },
        { key: 'infoBody',  label: '카드 내용', type: 'textarea', ph: '' },
      ];
      if (isPopup.value)       return [
        { key: 'popupWidth',  label: '팝업 너비 (px)',  type: 'number', ph: '' },
        { key: 'popupHeight', label: '팝업 높이 (px)',  type: 'number', ph: '' },
        { key: 'imageUrl',    label: '팝업 이미지 URL', type: 'input',  ph: 'https://...' },
        { key: 'linkUrl',     label: '링크 URL',        type: 'input',  ph: '' },
      ];
      if (isFile.value)        return [
        { key: 'fileUrl',   label: '파일 URL',    type: 'input', ph: 'https://... 또는 /files/...' },
        { key: 'fileLabel', label: '표시 레이블', type: 'input', ph: '다운로드' },
      ];
      if (isCoupon.value)      return [
        { key: 'couponCode', label: '쿠폰 코드', type: 'input', ph: 'COUPON_CODE' },
        { key: 'couponDesc', label: '쿠폰 설명', type: 'input', ph: '쿠폰 안내 문구' },
      ];
      if (isHtmlEditor.value)  return [];   /* Quill로 별도 처리 */
      if (isTextarea.value)    return [
        { key: 'textareaContent', label: '텍스트 내용', type: 'textarea', ph: '텍스트를 입력하세요...' },
      ];
      if (isMarkdown.value)    return [
        { key: 'markdownContent', label: 'Markdown 내용', type: 'code', ph: '# 제목\n\n내용을 입력하세요...' },
      ];
      if (isCodeWidget.value) {
        const rows = [
          { key: 'codeValue', label: '코드 값', type: 'input', ph: 'COUPON-2026-001234' },
        ];
        if (isBarcode.value || isBarcodeQr.value) rows.push(
          { key: 'codeFormat', label: '바코드 형식', type: 'select', options: [
            {v:'CODE128',l:'CODE128 (범용)'},{v:'EAN13',l:'EAN-13'},{v:'EAN8',l:'EAN-8'},
            {v:'UPC',l:'UPC-A'},{v:'CODE39',l:'CODE39'},{v:'ITF14',l:'ITF-14'},
          ]},
          { key: 'codeHeight', label: '바코드 높이 (px)', type: 'number', ph: '60' },
          { key: 'showCodeLabel', label: '코드값 텍스트', type: 'select', options: [{v:true,l:'표시'},{v:false,l:'숨김'}] },
        );
        if (isQrcode.value || isBarcodeQr.value) rows.push(
          { key: 'qrSize', label: 'QR 크기 (px)', type: 'number', ph: '120' },
          { key: 'qrErrorLevel', label: '오류 정정 수준', type: 'select', options: [
            {v:'L',l:'L – 7%'},{v:'M',l:'M – 15%'},{v:'Q',l:'Q – 25%'},{v:'H',l:'H – 30%'},
          ]},
        );
        return rows;
      }
      if (isFileList.value)    return [];   /* 파일목록 별도 처리 */
      if (isCondProduct.value) return [
        { key: 'condSite',     label: '사이트 조건',   type: 'input',  ph: '사이트 코드 (비워두면 전체)' },
        { key: 'condUser',     label: '사용자 조건',   type: 'select',
          options: [{v:'',l:'전체'},{v:'login',l:'로그인'},{v:'nologin',l:'비로그인'},{v:'VIP',l:'VIP'},{v:'우수',l:'우수'},{v:'일반',l:'일반'}] },
        { key: 'condCategory', label: '카테고리 조건', type: 'input',  ph: '카테고리 ID (쉼표 구분)' },
        { key: 'condBrand',    label: '브랜드 조건',   type: 'input',  ph: '브랜드명 (쉼표 구분)' },
        { key: 'condSort',     label: '정렬 기준',     type: 'select',
          options: [{v:'newest',l:'최신순'},{v:'popular',l:'인기순'},{v:'price_asc',l:'가격 낮은순'},{v:'price_desc',l:'가격 높은순'},{v:'discount',l:'할인율순'}] },
        { key: 'condLimit',    label: '표시 개수',     type: 'number', ph: '8' },
      ];
      if (isVideoPlayer.value) return [
        { key: 'videoUrl',      label: '동영상 URL',  type: 'input',  ph: 'https://youtube.com/watch?v=...' },
        { key: 'videoType',     label: '동영상 유형', type: 'select', options: [{v:'youtube',l:'YouTube'},{v:'vimeo',l:'Vimeo'},{v:'direct',l:'직접 URL (mp4)'}] },
        { key: 'videoAutoplay', label: '자동재생',    type: 'select', options: [{v:false,l:'사용 안 함'},{v:true,l:'사용 (음소거 필요)'}] },
        { key: 'videoControls', label: '컨트롤바',    type: 'select', options: [{v:true,l:'표시'},{v:false,l:'숨김'}] },
      ];
      if (isCountdown.value) return [
        { key: 'countdownTarget',     label: '목표 일시',    type: 'input', ph: '2026-12-31 23:59:59' },
        { key: 'countdownTitle',      label: '타이틀',       type: 'input', ph: '이벤트 종료까지' },
        { key: 'countdownExpiredMsg', label: '종료 메시지',  type: 'input', ph: '이벤트가 종료되었습니다.' },
        { key: 'countdownBgColor',    label: '배경색',       type: 'color' },
        { key: 'countdownTextColor',  label: '글자색',       type: 'color' },
      ];
      if (isPayment.value) return [
        { key: 'payAmount',      label: '결제 금액',          type: 'number', ph: '0' },
        { key: 'payCurrency',    label: '통화',               type: 'select', options: [{v:'KRW',l:'원 (KRW)'},{v:'USD',l:'달러 (USD)'}] },
        { key: 'payMethods',     label: '결제수단 (쉼표 구분)', type: 'input', ph: 'card,kakao,naver,toss,bank' },
        { key: 'payButtonLabel', label: '버튼 텍스트',         type: 'input', ph: '결제하기' },
        { key: 'payButtonColor', label: '버튼 색상',           type: 'color' },
      ];
      if (isApproval.value) return [
        { key: 'approvalDocType', label: '문서 유형', type: 'select', options: [{v:'구매승인',l:'구매승인'},{v:'지출결의',l:'지출결의'},{v:'휴가신청',l:'휴가신청'},{v:'기안',l:'기안'},{v:'품의서',l:'품의서'}] },
        { key: 'approvalTitle',   label: '결재 제목',    type: 'input', ph: '' },
        { key: 'approvalLine',    label: '결재선 (JSON)', type: 'code',  ph: '[{"role":"담당자","name":"홍길동"},{"role":"팀장","name":""}]' },
      ];
      if (isMapWidget.value) return [
        { key: 'mapType',        label: '지도 유형', type: 'select', options: [{v:'google',l:'Google Maps'},{v:'kakao',l:'카카오맵'},{v:'naver',l:'네이버지도'}] },
        { key: 'mapAddress',     label: '주소',      type: 'input',  ph: '서울시 강남구 테헤란로 123' },
        { key: 'mapLat',         label: '위도 (lat)', type: 'input', ph: '37.5005' },
        { key: 'mapLng',         label: '경도 (lng)', type: 'input', ph: '127.0356' },
        { key: 'mapZoom',        label: '줌 레벨',   type: 'number', ph: '14' },
        { key: 'mapMarkerLabel', label: '마커 라벨', type: 'input',  ph: '우리 매장' },
      ];
      if (isEventBanner.value) return [
        { key: 'eventId', label: '이벤트 ID', type: 'event', ph: '' },
      ];
      if (isCacheBanner.value) return [
        { key: 'cacheDesc',   label: '안내 문구',          type: 'input',  ph: '지금 충전하면 10% 보너스!' },
        { key: 'cacheAmount', label: '기본 충전 금액(원)', type: 'number', ph: '' },
      ];
      if (isWidgetEmbed.value) return [
        { key: 'embedCode', label: '임베드 코드', type: 'code', ph: '<iframe ...></iframe>' },
      ];
      return [];
    });

    const relatedEvent = computed(() => {
      const eid = activeRow.value?.eventId;
      if (!eid) return null;
      return (props.dispDataset.events || []).find(e => String(e.eventId) === String(eid)) || null;
    });

    /* ── Quill 에디터 ── */
    const htmlDescEl    = ref(null);
    const htmlContentEl = ref(null);
    let quillDesc    = null;
    let quillContent = null;
    const htmlSourceMode = ref(false);  // WYSIWYG ↔ 소스 토글

    const toggleHtmlSource = async () => {
      if (!activeRow.value) return;
      if (!htmlSourceMode.value) {
        /* WYSIWYG → 소스: Quill 최신값 저장 후 소스 모드 ON */
        if (quillContent) activeRow.value.htmlContent = quillContent.root.innerHTML;
        htmlSourceMode.value = true;
      } else {
        /* 소스 → WYSIWYG: quillContent 재생성 없이 내용만 동기화 */
        htmlSourceMode.value = false;
        await nextTick();
        if (quillContent) {
          bindQuillContent();   // 기존 인스턴스에 textarea 값 반영
        } else {
          initQuillContent();   // 최초 1회만 생성
        }
      }
    };

    const QUILL_OPTS = {
      theme: 'snow',
      modules: { toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ]},
    };

    const initQuillDesc = () => {
      if (props.viewMode || !htmlDescEl.value || quillDesc) return;
      quillDesc = new Quill(htmlDescEl.value, QUILL_OPTS);
      quillDesc.root.innerHTML = form.htmlDesc || '';
      quillDesc.on('text-change', () => { form.htmlDesc = quillDesc.root.innerHTML; });
    };

    const bindQuillContent = () => {
      if (!quillContent || !activeRow.value) return;
      quillContent.off('text-change');
      const html = activeRow.value.htmlContent || '';
      if (quillContent.root.innerHTML !== html) quillContent.root.innerHTML = html;
      quillContent.on('text-change', () => {
        if (activeRow.value) activeRow.value.htmlContent = quillContent.root.innerHTML;
      });
    };

    const initQuillContent = () => {
      if (props.viewMode || !htmlContentEl.value) return;
      if (!quillContent) {
        quillContent = new Quill(htmlContentEl.value, QUILL_OPTS);
      }
      bindQuillContent();
    };

    onMounted(async () => {
      await nextTick();
      /* 기존 데이터 로드 */
      if (!isNew.value) {
        const d = props.dispDataset.displays.find(x => x.dispId === props.editId);
        if (d) {
          form.dispId        = d.dispId;
          form.dispCode      = d.dispCode      || '';
          form.area          = d.area          || 'HOME_BANNER';
          form.name          = d.name          || '';
          form.status        = d.status        || '활성';
          form.htmlDesc      = d.htmlDesc      || '';
          form.condition     = d.condition     || '항상 표시';
          form.authRequired  = d.authRequired  || false;
          form.authGrade     = d.authGrade     || '';
          form.layoutType    = d.layoutType    || 'grid';
          form.gridCols      = d.gridCols      || 1;
          form.titleYn       = d.titleYn       || 'N';
          form.title         = d.title         || '';
          form.panelDispYn           = d.panelDispYn           || 'Y';
          form.panelDispStartDate    = d.panelDispStartDate    || '';
          form.panelDispEndDate      = d.panelDispEndDate      || '';
          form.panelDispEnv          = d.panelDispEnv          || '^PROD^';
          form.panelVisibilityTargets= d.panelVisibilityTargets|| '^PUBLIC^';
          if (d.rows && d.rows.length) {
            rows.splice(0, rows.length, ...d.rows.map((r, i) => makeRowData({ sortOrder: i+1, ...r })));
            d.rows.forEach((_, i) => expandedSections.add('tab'+(i+1)));
          } else {
            Object.assign(rows[0], { ...d });
          }
        }
      } else {
        /* 신규: 패널코드 자동 생성 DP_YYMMDD_HHMMSS */
        const t = new Date();
        const p = n => String(n).padStart(2, '0');
        form.dispCode = `DP_${String(t.getFullYear()).slice(2)}${p(t.getMonth()+1)}${p(t.getDate())}_${p(t.getHours())}${p(t.getMinutes())}${p(t.getSeconds())}`;
      }
      /* Quill 초기화 (기본정보 탭이 기본) */
      initQuillDesc();
    });

    /* 탭 전환 시 Quill 초기화/싱크 */
    watch(tab, async (newTab) => {
      await nextTick();
      if (newTab === 'info') {
        initQuillDesc();
      } else if (isHtmlEditor.value) {
        initQuillContent();
      }
    });

    /* 위젯 유형이 html_editor로 바뀔 때 */
    watch(isHtmlEditor, async (val) => {
      if (!val) return;
      await nextTick();
      initQuillContent();
    });

    /* 행 전환 시 Quill 내용 싱크 */
    watch(activeRowIdx, async () => {
      if (!isHtmlEditor.value) return;
      await nextTick();
      if (quillContent) bindQuillContent();
      else initQuillContent();
    });

    const save = async () => {
      if (!form.name || !form.area || !form.dispCode) { props.showToast('필수 항목을 입력해주세요. (패널코드·패널명·화면영역)', 'error'); return; }
      const isNewPanel = isNew.value;
      const ok = await props.showConfirm(isNewPanel ? '등록' : '저장', isNewPanel ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      const payload = { ...form, rows: rows.map(r => ({ ...r })), sortOrder: Number(rows[0].sortOrder) };
      if (isNewPanel) {
        payload.dispId  = props.dispDataset.nextId(props.dispDataset.displays, 'dispId');
        payload.regDate = new Date().toISOString().slice(0, 10);
        props.dispDataset.displays.push(payload);
      } else {
        const idx = props.dispDataset.displays.findIndex(x => x.dispId === props.editId);
        if (idx !== -1) Object.assign(props.dispDataset.displays[idx], payload);
      }
      try {
        const res = await (isNewPanel ? window.adminApi.post(`disps/${form.dispId}`, { ...form, rows: rows.map(r => ({ ...r })) }) : window.adminApi.put(`disps/${form.dispId}`, { ...form, rows: rows.map(r => ({ ...r })) }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(isNewPanel ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('dpDispPanelMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    /* ── 위젯미리보기 모달 ── */
    const preview = reactive({ show: false, tabLabel: '' });
    const openPreview = (tabKey, tabLabel) => { preview.tabLabel = tabLabel; preview.show = true; };
    const closePreview = () => { preview.show = false; };
    const previewWidget = computed(() => ({
      ...form, ...(activeRow.value ? { ...activeRow.value } : {}), status: '활성',
    }));

    /* ── 패널미리보기 (카드) ── */
    const cardPreview = reactive({ show: false });
    const openCardPreview = () => { cardPreview.show = true; };
    const closeCardPreview = () => { cardPreview.show = false; };
    const currentAreaLabel = computed(() => {
      const found = (props.dispDataset.codes || []).find(c => c.codeGrp === 'DISP_AREA' && c.codeValue === form.area);
      return found ? found.codeLabel : form.area;
    });
    const wLabel = (t) => WIDGET_TYPES.find(w => w.value === t)?.label || t || '-';

    /* ── 펼치기 / 탭 모드 토글 ── */
    const viewAll = ref(false);

    /* 아코디언 다중 펼치기 */
    const expandedSections = reactive(new Set(['info', 'tab1']));
    const toggleSection = (key) => { if (expandedSections.has(key)) expandedSections.delete(key); else expandedSections.add(key); };
    const isSectionExpanded = (key) => expandedSections.has(key);

    /* row 파라미터 기반 유형 체크 (아코디언 다중 펼치기용) */
    const rowIsHtmlEditor  = (r) => r?.widgetType === 'html_editor';
    const rowIsFileList    = (r) => r?.widgetType === 'file_list';
    const rowIsImage       = (r) => r?.widgetType === 'image_banner';
    const rowIsText        = (r) => r?.widgetType === 'text_banner';
    const rowIsProduct     = (r) => ['product_slider','product'].includes(r?.widgetType);
    const getDisplayRows = (r) => {
      if (!r) return [];
      const wt = r.widgetType;
      if (wt === 'image_banner')   return [{ key:'imageUrl', label:'이미지 URL', type:'input', ph:'https://...' },{ key:'altText', label:'Alt 텍스트', type:'input', ph:'' },{ key:'linkUrl', label:'링크 URL', type:'input', ph:'https://...' }];
      if (['product_slider','product'].includes(wt)) return [{ key:'productIds', label:'상품 ID 목록', type:'input', ph:'1, 2, 3, ...' }];
      if (wt?.startsWith('chart_')) return [{ key:'chartTitle', label:'차트 제목', type:'input', ph:'' },{ key:'chartType', label:'차트 유형', type:'select', options:[{v:'bar',l:'Bar'},{v:'line',l:'Line'},{v:'pie',l:'Pie'}] },{ key:'chartLabels', label:'라벨 (쉼표 구분)', type:'input', ph:'1월, 2월, 3월' },{ key:'chartValues', label:'값 (쉼표 구분)', type:'input', ph:'100, 200, 150' }];
      if (wt === 'text_banner')    return [{ key:'textContent', label:'텍스트 내용', type:'textarea', ph:'' },{ key:'bgColor', label:'배경색', type:'color', ph:'' },{ key:'textColor', label:'글자색', type:'color', ph:'' }];
      if (wt === 'info_card')      return [{ key:'infoTitle', label:'카드 제목', type:'input', ph:'' },{ key:'infoBody', label:'카드 내용', type:'textarea', ph:'' }];
      if (wt === 'popup')          return [{ key:'popupWidth', label:'팝업 너비(px)', type:'number', ph:'' },{ key:'popupHeight', label:'팝업 높이(px)', type:'number', ph:'' },{ key:'imageUrl', label:'팝업 이미지 URL', type:'input', ph:'https://...' },{ key:'linkUrl', label:'링크 URL', type:'input', ph:'' }];
      if (wt === 'file')           return [{ key:'fileUrl', label:'파일 URL', type:'input', ph:'https://...' },{ key:'fileLabel', label:'표시 레이블', type:'input', ph:'다운로드' }];
      if (wt === 'coupon')         return [{ key:'couponCode', label:'쿠폰 코드', type:'input', ph:'COUPON_CODE' },{ key:'couponDesc', label:'쿠폰 설명', type:'input', ph:'쿠폰 안내 문구' }];
      if (wt === 'html_editor' || wt === 'file_list') return [];
      if (wt === 'cond_product')   return [{ key:'condSite', label:'사이트 조건', type:'input', ph:'사이트 코드 (비워두면 전체)' },{ key:'condUser', label:'사용자 조건', type:'select', options:[{v:'',l:'전체'},{v:'login',l:'로그인'},{v:'nologin',l:'비로그인'},{v:'VIP',l:'VIP'},{v:'우수',l:'우수'},{v:'일반',l:'일반'}] },{ key:'condCategory', label:'카테고리 조건', type:'input', ph:'카테고리 ID (쉼표 구분)' },{ key:'condBrand', label:'브랜드 조건', type:'input', ph:'브랜드명 (쉼표 구분)' },{ key:'condSort', label:'정렬 기준', type:'select', options:[{v:'newest',l:'최신순'},{v:'popular',l:'인기순'},{v:'price_asc',l:'가격 낮은순'},{v:'price_desc',l:'가격 높은순'},{v:'discount',l:'할인율순'}] },{ key:'condLimit', label:'표시 개수', type:'number', ph:'8' }];
      if (wt === 'event_banner')   return [{ key:'eventId', label:'이벤트 ID', type:'event', ph:'' }];
      if (wt === 'cache_banner')   return [{ key:'cacheDesc', label:'안내 문구', type:'input', ph:'지금 충전하면 10% 보너스!' },{ key:'cacheAmount', label:'기본 충전 금액(원)', type:'number', ph:'' }];
      if (wt === 'widget_embed')   return [{ key:'embedCode', label:'임베드 코드', type:'code', ph:'<iframe ...></iframe>' }];
      return [];
    };
    const getRelatedEvent  = (r) => { const eid = r?.eventId; if (!eid) return null; return (props.dispDataset.events || []).find(e => String(e.eventId) === String(eid)) || null; };
    const getFileListItems = (r) => { try { return JSON.parse(r?.fileListJson || '[]'); } catch { return []; } };
    const addFileItemAt    = (r) => { r.fileListJson = JSON.stringify([...getFileListItems(r), { name: '', url: '' }]); };
    const removeFileItemAt = (r, idx) => { r.fileListJson = JSON.stringify(getFileListItems(r).filter((_, i) => i !== idx)); };
    const setFileItem      = (r, idx, field, val) => { const items = getFileListItems(r); items[idx] = { ...items[idx], [field]: val }; r.fileListJson = JSON.stringify(items); };
    /* 위젯 이동 (아코디언 모드 — tab 변경 없이) */
    const moveRowAt = (rowIdx, dir) => {
      const target = rowIdx + dir;
      if (target < 0 || target >= rows.length) return;
      const a = { ...rows[rowIdx] };
      const b = { ...rows[target] };
      Object.assign(rows[rowIdx], b);
      Object.assign(rows[target], a);
      rows.forEach((r, i) => { r.sortOrder = i + 1; });
    };

    /* ── 위젯 추가 / 삭제 ── */
    const addWidget = () => {
      if (rows.length >= MAX_WIDGETS) { props.showToast(`위젯은 최대 ${MAX_WIDGETS}개까지 추가할 수 있습니다.`, 'error'); return; }
      rows.push(makeRowData({ sortOrder: rows.length + 1 }));
      const newKey = 'tab' + rows.length;
      tab.value = newKey;
      expandedSections.add(newKey);
    };
    const removeWidget = (idx) => {
      if (idx === 0 || rows.length <= 1) return;
      const currentIdx = activeRowIdx.value;
      rows.splice(idx, 1);
      rows.forEach((r, i) => { r.sortOrder = i + 1; });
      expandedSections.delete('tab' + (rows.length + 1));
      if (currentIdx !== null && currentIdx >= rows.length) {
        tab.value = 'tab' + rows.length;
      }
    };

    /* ── 공개 대상 멀티체크 토글 (전시항목별) ── */
    const visibilityOptions = computed(() => window.visibilityUtil.allOptions());
    const hasVisibility = (code) => {
      if (!activeRow.value) return false;
      return window.visibilityUtil.has(activeRow.value.visibilityTargets, code);
    };
    const toggleVisibility = (code) => {
      if (!activeRow.value) return;
      const list = window.visibilityUtil.parse(activeRow.value.visibilityTargets);
      const i = list.indexOf(code);
      if (i >= 0) list.splice(i, 1); else list.push(code);
      if (code === 'PUBLIC' && i < 0) {
        activeRow.value.visibilityTargets = '^PUBLIC^';
        return;
      }
      const filtered = list.filter(c => c !== 'PUBLIC' || code === 'PUBLIC');
      activeRow.value.visibilityTargets = window.visibilityUtil.serialize(filtered);
    };

    /* ── 전시 환경 멀티체크 토글 (PLAN/DEV/TEST/PROD) ── */
    const dispEnvOptions = [
      { code: 'PLAN', label: '준비/계획' },
      { code: 'DEV', label: 'DEV' },
      { code: 'TEST', label: 'TEST' },
      { code: 'PROD', label: 'PROD' },
    ];
    const hasDispEnv = (code) => {
      if (!activeRow.value) return false;
      return activeRow.value.dispEnv.includes('^' + code + '^');
    };
    const toggleDispEnv = (code) => {
      if (!activeRow.value) return;
      const envList = activeRow.value.dispEnv.split('^').filter(e => e && e !== 'NONE');
      const i = envList.indexOf(code);
      if (i >= 0) envList.splice(i, 1); else envList.push(code);
      activeRow.value.dispEnv = envList.length > 0 ? '^' + envList.join('^') + '^' : '^NONE^';
    };

    /* ── 패널 레벨 전시환경/공개대상 토글 ── */
    const hasPanelDispEnv = (code) => form.panelDispEnv.includes('^' + code + '^');
    const togglePanelDispEnv = (code) => {
      const envList = form.panelDispEnv.split('^').filter(e => e && e !== 'NONE');
      const i = envList.indexOf(code);
      if (i >= 0) envList.splice(i, 1); else envList.push(code);
      form.panelDispEnv = envList.length > 0 ? '^' + envList.join('^') + '^' : '^NONE^';
    };
    const hasPanelVisibility = (code) => window.visibilityUtil.has(form.panelVisibilityTargets, code);
    const togglePanelVisibility = (code) => {
      const list = window.visibilityUtil.parse(form.panelVisibilityTargets);
      const i = list.indexOf(code);
      if (i >= 0) list.splice(i, 1); else list.push(code);
      if (code === 'PUBLIC' && i < 0) { form.panelVisibilityTargets = '^PUBLIC^'; return; }
      const filtered = list.filter(c => c !== 'PUBLIC' || code === 'PUBLIC');
      form.panelVisibilityTargets = window.visibilityUtil.serialize(filtered);
    };

    /* ── 전시항목 복사 팝업 ── */
    const rowCopyOpen = ref(false);
    const onRowCopy = (pickedRows) => {
      if (!Array.isArray(pickedRows) || !pickedRows.length) return;
      pickedRows.forEach(r => {
        if (rows.length >= MAX_WIDGETS) return;
        rows.push({ ...makeRowData(), ...r, sortOrder: rows.length + 1 });
      });
      props.showToast && props.showToast(`${pickedRows.length}개 전시항목을 복사했습니다.`, 'info');
      rowCopyOpen.value = false;
    };

    /* ── 위젯Lib 선택 팝업 (활성 row에 복사/참조) ── */
    const libPickOpen = ref(false);
    const libPickMode = ref('copy');
    const openLibPick = (mode) => {
      if (!activeRow.value) return;
      libPickMode.value = mode; libPickOpen.value = true;
    };
    const onLibPicked = (lib) => {
      libPickOpen.value = false;
      if (!activeRow.value) return;
      if (libPickMode.value === 'copy') {
        const r = activeRow.value;
        const preserve = { widgetNm: r.widgetNm, sortOrder: r.sortOrder };
        Object.assign(r, { ...lib, ...preserve });
        props.showToast && props.showToast(`[${lib.name}] 내용을 복사했습니다.`, 'info');
      } else {
        activeRow.value.refLibId   = lib.libId;
        activeRow.value.refLibCode = lib.libCode || '';
        activeRow.value.refLibName = lib.name || '';
        props.showToast && props.showToast(`[${lib.name}] 참조로 설정되었습니다.`, 'info');
      }
    };

    return {
      pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      libPickOpen, libPickMode, openLibPick, onLibPicked,
      rowCopyOpen, onRowCopy,
      visibilityOptions, hasVisibility, toggleVisibility,
      dispEnvOptions, hasDispEnv, toggleDispEnv,
      hasPanelDispEnv, togglePanelDispEnv, hasPanelVisibility, togglePanelVisibility,
      previewMode, PREVIEW_MODES, previewFrameWidth, previewPaneWidth, onSplitDrag, showComponentTooltip,
      isNew, tab, form, rows, WIDGET_TYPES, AREAS, LAYOUT_TYPE_OPTS, TAB_LABELS, TAB_ROW_MAP,
      MAX_WIDGETS, addWidget, removeWidget,
      activeRowIdx, activeRow, moveRow,
      isChart, isProduct, isImage, isText, isInfo, isPopup, isFile, isFileList,
      isCoupon, isHtmlEditor, isEventBanner, isCacheBanner, isWidgetEmbed, isCondProduct,
      displayRows, relatedEvent, save,
      fileListItems, addFileItem, removeFileItem, updateFileItem,
      htmlDescEl, htmlContentEl, htmlSourceMode, toggleHtmlSource,
      preview, openPreview, closePreview, previewWidget,
      cardPreview, openCardPreview, closeCardPreview, currentAreaLabel, wLabel,
      viewAll,
      expandedSections, toggleSection, isSectionExpanded,
      rowIsHtmlEditor, rowIsFileList, rowIsImage, rowIsText, rowIsProduct,
      getDisplayRows, getRelatedEvent,
      getFileListItems, addFileItemAt, removeFileItemAt, setFileItem,
      moveRowAt,
    };
  },
  template: /* html */`
<div>
  <div class="page-title" style="display:flex;align-items:center;justify-content:space-between;">
    <span>
      {{ isNew ? '전시패널 등록' : (viewMode ? '전시패널 상세' : '전시패널 수정') }}
      <span v-if="!isNew" style="font-size:13px;color:#888;font-weight:400;margin-left:6px;">#{{ form.dispId }}</span>
    </span>
    <div style="display:flex;align-items:center;gap:6px;">
      <button @click="viewAll = !viewAll"
        style="font-size:11px;padding:4px 12px;border:1px solid #d0d0d0;border-radius:14px;background:#fff;cursor:pointer;color:#666;display:flex;align-items:center;gap:5px;transition:all .15s;"
        :style="viewAll ? 'background:#f5f0ff;border-color:#b39ddb;color:#6a1b9a;' : ''"
        title="탭 보기 / 전체 펼치기 전환">
        <span>{{ viewAll ? '☰' : '⊞' }}</span>
        {{ viewAll ? '탭 보기' : '펼치기' }}
      </button>
      <button v-if="!viewMode" class="btn btn-sm" :disabled="isNew"
        :style="isNew ? 'background:#f5f5f5;border:1px solid #ddd;color:#bbb;cursor:not-allowed;' : 'background:#e3f2fd;border:1px solid #90caf9;color:#1565c0;font-weight:600;'"
        :title="isNew ? '저장 후 전시항목을 복사할 수 있습니다.' : ''"
        @click="!isNew && (rowCopyOpen = true)">
        📄 전시항목 복사
      </button>
      <button v-if="!viewMode" class="btn btn-primary btn-sm" @click="save" style="font-weight:700;">💾 저장</button>
    </div>
  </div>
  <div class="card">

    <!-- ═══════════════════ 탭 모드 ═══════════════════ -->
    <div v-if="!viewAll" style="display:flex;gap:0;flex-direction:column;min-height:400px;">

      <!-- 안내 배너 -->
      <div style="background:linear-gradient(135deg,#e3f2fd 0%,#f3e5f5 100%);border-bottom:1px solid #90caf9;padding:12px 14px;font-size:11px;color:#444;line-height:1.6;">
        <div style="font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
          <span>ℹ️ 여부 및 기간 관리 안내</span>
        </div>
        <ul style="margin:0;padding-left:18px;">
          <li>배치로 매시 55분에 <b>전시여부, 사용여부</b> 정보가 자동 반영됩니다</li>
          <li>전시관리정보 수정 후 저장하면 <b>전시여부, 사용여부</b> 정보가 즉시 반영됩니다</li>
        </ul>
      </div>

      <div style="display:flex;gap:0;flex:1;overflow:hidden;">

      <!-- 좌측 탭 메뉴 (UI 스타일) -->
      <div style="width:160px;min-width:160px;background:#f4f5f8;border-right:1px solid #e8ebef;padding:12px 8px;flex-shrink:0;">
        <div v-for="(t, tIdx) in TAB_LABELS" :key="t.key"
          @click="tab=t.key"
          :style="{
            display:'flex',alignItems:'center',justifyContent:'space-between',
            padding:'9px 12px',borderRadius:'8px',cursor:'pointer',marginBottom:'6px',
            fontSize:'12px',fontWeight: tab===t.key ? 700 : 500,
            background: tab===t.key ? '#fff' : 'transparent',
            color: tab===t.key ? '#e8587a' : '#555',
            border: '1px solid '+(tab===t.key ? '#e8587a' : 'transparent'),
            transition:'all .15s',
          }">
          <span v-if="t.key==='info'">📋 <b>패널기본정보</b></span>
          <span v-else>{{ t.label }}</span>
          <span v-if="t.key !== 'info' && tab===t.key" style="display:flex;gap:2px;">
            <button @click.stop="moveRow(-1)" :disabled="activeRowIdx===0" title="위로"
              style="font-size:9px;border:1px solid #e0e0e0;border-radius:3px;background:#fff;cursor:pointer;padding:1px 4px;line-height:1.2;color:#888;"
              :style="activeRowIdx===0?'opacity:0.3;cursor:default;':''">▲</button>
            <button @click.stop="moveRow(1)" :disabled="activeRowIdx===rows.length-1" title="아래로"
              style="font-size:9px;border:1px solid #e0e0e0;border-radius:3px;background:#fff;cursor:pointer;padding:1px 4px;line-height:1.2;color:#888;"
              :style="activeRowIdx===rows.length-1?'opacity:0.3;cursor:default;':''">▼</button>
          </span>
          <button v-if="tIdx >= 2 && tab!==t.key" @click.stop="removeWidget(tIdx-1)" title="전시항목 삭제"
            style="font-size:11px;border:none;background:none;cursor:pointer;color:#bbb;line-height:1;padding:0 2px;"
            @mouseenter="$event.currentTarget.style.color='#e8587a'"
            @mouseleave="$event.currentTarget.style.color='#bbb'">✕</button>
        </div>
        <!-- 추가 버튼 -->
        <div v-if="rows.length < MAX_WIDGETS" style="margin-top:8px;">
          <button @click="!isNew && addWidget()" :disabled="isNew"
            :title="isNew ? '저장 후 전시항목을 추가할 수 있습니다.' : ''"
            :style="isNew ? 'width:100%;padding:8px;border:1px solid #e0e0e0;background:#f5f5f5;color:#bbb;border-radius:8px;font-size:11px;font-weight:600;cursor:not-allowed;' : 'width:100%;padding:8px;border:1px solid #90caf9;background:#e3f2fd;color:#1565c0;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;'">
            ✚ 전시항목 추가
          </button>
        </div>
      </div>

      <!-- 우측 콘텐츠 + 미리보기 -->
      <div style="flex:1;display:flex;overflow:hidden;min-width:0;">

      <!-- 폼 영역 (75%) -->
      <div style="flex:3;padding-left:20px;padding-top:4px;overflow-y:auto;min-width:0;">

        <!-- ── 기본정보 ── -->
        <div v-show="tab==='info'">

          <!-- ■ 설정 -->
          <div style="margin-bottom:14px;padding:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
            <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:4px;height:16px;background:#1d4ed8;border-radius:2px;"></span>
              설정
            </div>
            <div class="form-row" style="margin-bottom:8px;">
              <div class="form-group">
                <label class="form-label">패널코드 <span v-if="!viewMode" class="req">*</span></label>
                <input class="form-control" v-model="form.dispCode" placeholder="DP_YYMMDD_HHMMSS" :readonly="viewMode" style="font-family:monospace;" />
              </div>
              <div class="form-group">
                <label class="form-label">패널명 <span v-if="!viewMode" class="req">*</span></label>
                <input class="form-control" v-model="form.name" placeholder="패널 이름" :readonly="viewMode" />
              </div>
              <div class="form-group">
                <label class="form-label">상태</label>
                <select class="form-control" v-model="form.status" :disabled="viewMode">
                  <option>활성</option><option>비활성</option>
                </select>
              </div>
            </div>
            <div class="form-row" style="margin-bottom:8px;">
              <div class="form-group" style="grid-column:1 / -1;">
                <label class="form-label">표시경로 <span style="font-size:10px;color:#888;font-weight:400;margin-left:4px;">(예: FRONT.모바일메인)</span></label>
                <div :style="{padding:'7px 10px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'12px',background:'#f5f5f7',color:form.pathId!=null?'#374151':'#9ca3af',fontWeight:form.pathId!=null?600:400,display:'flex',alignItems:'center',gap:'8px',fontFamily:'monospace'}">
                  <span style="flex:1;">{{ pathLabel(form.pathId) || '경로 선택...' }}</span>
                  <button type="button" @click="openPathPick('form')" title="표시경로 선택"
                    :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'24px',height:'24px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'12px',color:'#6b7280',padding:'0'}"
                    @mouseover="$event.currentTarget.style.background='#eef2ff'"
                    @mouseout="$event.currentTarget.style.background='#fff'">🔍</button>
                </div>
              </div>
            </div>
            <div class="form-row" style="margin-bottom:8px;">
              <div class="form-group" style="grid-column:1 / -1;">
                <label class="form-label">포함된 화면영역 <span style="font-size:10px;color:#888;font-weight:400;margin-left:4px;">(전시영역관리에서 편집)</span></label>
                <div style="padding:8px 10px;border:1px solid #e4e4e4;border-radius:6px;background:#fafbfc;min-height:34px;display:flex;flex-wrap:wrap;gap:4px;align-items:center;">
                  <span v-if="form.area" style="font-size:11px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:10px;padding:2px 10px;">
                    <code style="font-size:10px;background:transparent;">{{ form.area }}</code>
                    &nbsp;{{ currentAreaLabel }}
                  </span>
                  <span v-else style="font-size:11px;color:#bbb;">영역에 포함되지 않음</span>
                </div>
              </div>
            </div>
            <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin-bottom:6px;">🔲 위젯 레이아웃</div>
            <div class="form-row" style="align-items:flex-end;margin-bottom:8px;">
              <div class="form-group" style="flex:0 0 auto;">
                <label class="form-label">표시방식</label>
                <div style="display:flex;border:1px solid #d1d5db;border-radius:6px;overflow:hidden;max-width:200px;">
                  <button v-for="o in LAYOUT_TYPE_OPTS" :key="o.value"
                    @click="!viewMode && (form.layoutType = o.value)"
                    type="button"
                    style="flex:1;padding:6px 0;font-size:12px;border:none;border-left:1px solid #d1d5db;cursor:pointer;transition:all .15s;"
                    :style="[o.value==='grid'?'border-left:none;':'', form.layoutType===o.value ? 'background:#1d4ed8;color:#fff;font-weight:700;' : 'background:#fff;color:#6b7280;', viewMode?'cursor:default;opacity:.6;':'']">
                    {{ o.value==='grid' ? '🔲 ' : '🧩 ' }}{{ o.label }}
                  </button>
                </div>
              </div>
              <div class="form-group" style="flex:0 0 auto;" v-if="form.layoutType==='grid'">
                <label class="form-label">열수 <span style="font-size:10px;color:#aaa;">(위젯 배치 열 개수)</span></label>
                <div style="display:flex;align-items:center;gap:6px;">
                  <div style="display:flex;border:1px solid #d1d5db;border-radius:6px;overflow:hidden;">
                    <button v-for="n in [1,2,3,4]" :key="n" type="button"
                      @click="!viewMode && (form.gridCols = n)"
                      style="padding:6px 12px;font-size:12px;border:none;border-left:1px solid #d1d5db;cursor:pointer;transition:all .15s;"
                      :style="[n===1?'border-left:none;':'', form.gridCols===n ? 'background:#1d4ed8;color:#fff;font-weight:700;' : 'background:#fff;color:#6b7280;', viewMode?'cursor:default;opacity:.6;':'']">
                      {{ n }}
                    </button>
                  </div>
                  <input type="number" v-model.number="form.gridCols" min="1" max="32"
                    :readonly="viewMode"
                    style="width:64px;font-size:13px;padding:5px 8px;border:1px solid #d1d5db;border-radius:6px;text-align:center;" />
                  <span style="font-size:12px;color:#aaa;">열</span>
                </div>
              </div>
              <div class="form-group" style="flex:0 0 auto;" v-else>
                <label class="form-label">배치</label>
                <span style="font-size:12px;color:#6b7280;padding:6px 0;display:block;">자유 배치 (열수 없음)</span>
              </div>
            </div>
            <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin-bottom:6px;">📅 사용기간</div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <input type="date" class="form-control" v-model="form.useStartDate" style="width:150px;margin:0;" :readonly="viewMode" />
              <span style="color:#aaa;font-size:13px;padding:0 4px;">~</span>
              <input type="date" class="form-control" v-model="form.useEndDate" style="width:150px;margin:0;" :readonly="viewMode" />
            </div>
          </div><!-- /설정 -->

          <!-- ■ 제목 -->
          <div style="margin-bottom:14px;padding:14px;background:#faf8ff;border:1px solid #e9d5ff;border-radius:8px;">
            <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:4px;height:16px;background:#7c3aed;border-radius:2px;"></span>
              제목
              <span style="margin-left:auto;display:flex;align-items:center;gap:8px;">
                <span style="font-size:11px;font-weight:600;color:#888;">타이틀 표시</span>
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;font-weight:500;color:#444;">
                  <input type="radio" v-model="form.titleYn" value="Y" :disabled="viewMode" /> 표시
                </label>
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;font-weight:500;color:#444;">
                  <input type="radio" v-model="form.titleYn" value="N" :disabled="viewMode" /> 미표시
                </label>
              </span>
            </div>
            <div v-if="form.titleYn==='Y'" style="display:flex;align-items:center;gap:10px;">
              <label style="font-size:12px;font-weight:600;color:#555;width:50px;flex-shrink:0;">타이틀</label>
              <input v-model="form.title" type="text" placeholder="타이틀 텍스트 입력" :readonly="viewMode"
                style="flex:1;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;" />
            </div>
          </div><!-- /제목 -->

          <!-- ■ 내용 (HTML 설명) -->
          <div style="margin-bottom:14px;padding:14px;background:#fff8fa;border:1px solid #fce4ec;border-radius:8px;">
            <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:4px;height:16px;background:#e8587a;border-radius:2px;"></span>
              내용
            </div>
            <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin-bottom:6px;">📝 패널코멘트</div>
            <div v-if="viewMode"
              style="padding:12px 14px;background:#f9f9f9;border:1px solid #e8e8e8;border-radius:6px;font-size:13px;line-height:1.7;min-height:80px;">
              <span v-if="form.htmlDesc" v-html="form.htmlDesc"></span>
              <span v-else style="color:#bbb;">내용 없음</span>
            </div>
            <div v-else ref="htmlDescEl"></div>
          </div><!-- /내용 -->

          <div class="form-actions">
            <template v-if="viewMode">
              <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
              <button class="btn btn-secondary" @click="navigate('dpDispPanelMng')">닫기</button>
            </template>
            <template v-else>
              <button class="btn btn-secondary" @click="navigate('dpDispPanelMng')">취소</button>
            </template>
          </div>
        </div>

        <!-- ── 1~5행 콘텐츠 ── -->
        <div v-if="activeRow">

          <!-- ■ 섹션 1: 설정 -->
          <div style="margin-bottom:14px;padding:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
            <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:4px;height:16px;background:#1d4ed8;border-radius:2px;"></span>
              설정
              <span v-if="!viewMode" style="margin-left:auto;display:flex;gap:6px;">
                <button @click="!isNew && openLibPick('copy')" :disabled="isNew"
                  :title="isNew ? '저장 후 사용할 수 있습니다.' : ''"
                  :style="isNew ? 'font-size:11px;padding:4px 10px;border:1px solid #e0e0e0;background:#f5f5f5;color:#bbb;border-radius:6px;cursor:not-allowed;font-weight:600;' : 'font-size:11px;padding:4px 10px;border:1px solid #90caf9;background:#e3f2fd;color:#1565c0;border-radius:6px;cursor:pointer;font-weight:600;'">📋 위젯Lib내용복사</button>
                <button @click="!isNew && openLibPick('ref')" :disabled="isNew"
                  :title="isNew ? '저장 후 사용할 수 있습니다.' : ''"
                  :style="isNew ? 'font-size:11px;padding:4px 10px;border:1px solid #e0e0e0;background:#f5f5f5;color:#bbb;border-radius:6px;cursor:not-allowed;font-weight:600;' : 'font-size:11px;padding:4px 10px;border:1px solid #ce93d8;background:#f3e5f5;color:#6a1b9a;border-radius:6px;cursor:pointer;font-weight:600;'">🔗 위젯Lib참조</button>
              </span>
            </div>

            <!-- 🔗 참조 정보 -->
            <div v-if="activeRow.refLibId"
              style="background:linear-gradient(135deg,#f3e5f5 0%,#fff 100%);border:1px dashed #ce93d8;border-radius:10px;padding:12px 14px;margin-bottom:14px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span style="font-size:12px;font-weight:700;color:#6a1b9a;">🔗 전시위젯Lib 참조 중</span>
                <button v-if="!viewMode" @click="activeRow.refLibId=null; activeRow.refLibCode=''; activeRow.refLibName=''"
                  style="font-size:10px;padding:2px 8px;border:1px solid #ce93d8;background:#fff;color:#6a1b9a;border-radius:4px;cursor:pointer;">참조 해제</button>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:11px;color:#555;line-height:1.6;margin-bottom:10px;">
                <span><b style="color:#888;">참조구분:</b>
                  <span style="background:#f3e5f5;color:#6a1b9a;border-radius:8px;padding:1px 7px;margin-left:3px;font-weight:700;">위젯Lib</span>
                </span>
                <span v-if="activeRow.refLibCode"><b style="color:#888;">참조항목Code:</b>
                  <code style="background:#fff;color:#6a1b9a;padding:1px 6px;border-radius:3px;margin-left:3px;border:1px solid #e1bee7;">{{ activeRow.refLibCode }}</code>
                </span>
                <span><b style="color:#888;">참조항목ID:</b>
                  <code style="background:#fff;color:#6a1b9a;padding:1px 6px;border-radius:3px;margin-left:3px;border:1px solid #e1bee7;">#{{ String(activeRow.refLibId).padStart(4,'0') }}</code>
                </span>
                <span v-if="activeRow.refLibName"><b style="color:#888;">참조명:</b> {{ activeRow.refLibName }}</span>
              </div>
              <div style="background:#fff;border:1px solid #e1bee7;border-radius:8px;padding:10px;">
                <div style="font-size:10px;color:#888;font-weight:600;margin-bottom:6px;letter-spacing:.3px;">▸ 참조 내용 미리보기</div>
                <disp-x04-widget
                  :params="{ }"
                  :disp-dataset="dispDataset"
                  :disp-opt="{ showBadges: true }"
                  :widget-item="(dispDataset.widgetLibs||[]).find(l => l.libId===activeRow.refLibId) || {}" />
              </div>
            </div>

            <!-- 노출순서 + 전시여부 -->
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap;">
              <div style="display:flex;align-items:center;gap:8px;">
                <label style="font-size:12px;font-weight:600;color:#555;white-space:nowrap;">노출 순서</label>
                <input class="form-control" type="number" v-model.number="activeRow.sortOrder" min="1" :readonly="viewMode"
                  style="width:80px;margin:0;" />
              </div>
              <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#555;padding:5px 10px;background:#f0f0f0;border-radius:6px;cursor:pointer;">
                <span>전시여부</span>
                <input type="checkbox" v-model="activeRow.dispYn" :true-value="'Y'" :false-value="'N'" :disabled="viewMode" style="accent-color:#e8587a;" />
                <span>{{ activeRow.dispYn === 'Y' ? '전시' : '숨김' }}</span>
              </label>
              <span style="font-size:10px;color:#aaa;">(배치로 자동 관리됨)</span>
            </div>

            <!-- 전시기간 -->
            <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin-bottom:6px;">
              📅 전시기간 <span style="font-size:10px;color:#aaa;font-weight:400;">(미설정 시 패널 기간 사용)</span>
            </div>
            <div style="display:grid;grid-template-columns:auto 1fr auto 1fr;align-items:center;gap:6px;margin-bottom:12px;background:#f9fafb;padding:10px 12px;border-radius:6px;border:1px solid #e5e7eb;">
              <span style="font-size:11px;color:#888;white-space:nowrap;">시작</span>
              <div style="display:flex;gap:6px;">
                <input type="date" class="form-control" v-model="activeRow.dispStartDate" style="flex:1;min-width:0;margin:0;" :readonly="viewMode" />
                <input type="time" class="form-control" v-model="activeRow.dispStartTime" style="width:100px;flex-shrink:0;margin:0;" :readonly="viewMode" />
              </div>
              <span style="font-size:11px;color:#888;white-space:nowrap;padding:0 2px;">종료</span>
              <div style="display:flex;gap:6px;">
                <input type="date" class="form-control" v-model="activeRow.dispEndDate" style="flex:1;min-width:0;margin:0;" :readonly="viewMode" />
                <input type="time" class="form-control" v-model="activeRow.dispEndTime" style="width:100px;flex-shrink:0;margin:0;" :readonly="viewMode" />
              </div>
            </div>

            <!-- 전시환경 -->
            <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin:10px 0 6px;">🌍 전시환경</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
              <label v-for="opt in dispEnvOptions" :key="opt.code"
                :style="{
                  display:'inline-flex',alignItems:'center',gap:'6px',padding:'6px 12px',borderRadius:'6px',
                  border:'1px solid '+(hasDispEnv(opt.code)?'#7c3aed':'#ddd'),
                  background:hasDispEnv(opt.code)?'#f3e8ff':'#fafafa',
                  color:hasDispEnv(opt.code)?'#7c3aed':'#666',
                  fontSize:'12px',fontWeight:hasDispEnv(opt.code)?700:500,
                  cursor: viewMode?'default':'pointer',opacity: viewMode?0.8:1,
                }">
                <input type="checkbox" :checked="hasDispEnv(opt.code)"
                  :disabled="viewMode"
                  @change="toggleDispEnv(opt.code)"
                  style="accent-color:#7c3aed;" />
                {{ opt.label }}
              </label>
            </div>

            <!-- 공개대상 -->
            <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin:10px 0 6px;">🔒 공개대상 (하나라도 해당하면 노출)</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
              <label v-for="opt in visibilityOptions" :key="opt.codeValue"
                :style="{
                  display:'inline-flex',alignItems:'center',gap:'6px',padding:'6px 12px',borderRadius:'16px',
                  border:'1px solid '+(hasVisibility(opt.codeValue)?'#1565c0':'#ddd'),
                  background:hasVisibility(opt.codeValue)?'#e3f2fd':'#fafafa',
                  color:hasVisibility(opt.codeValue)?'#1565c0':'#666',
                  fontSize:'12px',fontWeight:hasVisibility(opt.codeValue)?700:500,
                  cursor: viewMode?'default':'pointer',opacity: viewMode?0.8:1,
                }">
                <input type="checkbox" :checked="hasVisibility(opt.codeValue)"
                  :disabled="viewMode"
                  @change="toggleVisibility(opt.codeValue)"
                  style="accent-color:#1565c0;" />
                {{ opt.codeLabel }}
              </label>
            </div>
            <div v-if="!activeRow.visibilityTargets" style="font-size:11px;color:#d32f2f;margin-bottom:4px;">⚠ 선택 없음 — 아무에게도 노출되지 않습니다.</div>
          </div><!-- /설정 영역 -->

          <!-- ■ 섹션 2: 제목 -->
          <div style="margin-bottom:14px;padding:14px;background:#faf8ff;border:1px solid #e9d5ff;border-radius:8px;">
            <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:4px;height:16px;background:#7c3aed;border-radius:2px;"></span>
              제목
              <span style="margin-left:auto;display:flex;align-items:center;gap:8px;">
                <span style="font-size:11px;font-weight:600;color:#888;">타이틀 표시</span>
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;font-weight:500;color:#444;">
                  <input type="radio" v-model="activeRow.titleYn" value="Y" :disabled="viewMode" /> 표시
                </label>
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;font-weight:500;color:#444;">
                  <input type="radio" v-model="activeRow.titleYn" value="N" :disabled="viewMode" /> 미표시
                </label>
              </span>
            </div>
            <div v-if="activeRow.titleYn==='Y'" style="display:flex;align-items:center;gap:10px;">
              <label style="font-size:12px;font-weight:600;color:#555;width:50px;flex-shrink:0;">타이틀</label>
              <input v-model="activeRow.title" type="text" placeholder="타이틀 텍스트 입력" :readonly="viewMode"
                style="flex:1;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;" />
            </div>
          </div><!-- /제목 영역 -->

          <!-- ■ 섹션 3: 내용 -->
          <div style="margin-bottom:14px;padding:14px;background:#fff8fa;border:1px solid #fce4ec;border-radius:8px;">
            <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:4px;height:16px;background:#e8587a;border-radius:2px;flex-shrink:0;"></span>
              내용
              <span style="margin-left:auto;display:inline-flex;align-items:center;gap:6px;flex-shrink:0;">
                <span style="font-size:11px;font-weight:600;color:#888;white-space:nowrap;">위젯유형</span>
                <select class="form-control" v-model="activeRow.widgetType" :disabled="viewMode"
                  style="margin:0;font-size:12px;padding:3px 8px;height:28px;border-radius:5px;min-width:160px;">
                  <option v-for="w in WIDGET_TYPES" :key="w.value" :value="w.value">{{ w.label }}</option>
                </select>
              </span>
            </div>

            <!-- HTML 에디터 (Quill) -->
            <div v-if="isHtmlEditor" style="margin-bottom:20px;">
              <div v-if="viewMode"
                style="padding:12px 14px;background:#f9f9f9;border:1px solid #e8e8e8;border-radius:6px;font-size:13px;line-height:1.7;min-height:80px;">
                <span v-if="activeRow.htmlContent" v-html="activeRow.htmlContent"></span>
                <span v-else style="color:#bbb;">내용 없음</span>
              </div>
              <template v-else>
                <div style="display:flex;justify-content:flex-end;margin-bottom:4px;">
                  <button @click="toggleHtmlSource"
                    :style="htmlSourceMode ? 'background:#1e1e2e;color:#7ec8e3;border-color:#7ec8e3;' : 'background:#f5f5f5;color:#555;border-color:#d0d0d0;'"
                    style="font-size:11px;padding:3px 10px;border:1px solid;border-radius:4px;cursor:pointer;font-family:monospace;transition:all .15s;">
                    {{ htmlSourceMode ? '&#x2713; 디자인' : '&lt;/&gt; HTML' }}
                  </button>
                </div>
                <div v-show="!htmlSourceMode" ref="htmlContentEl"></div>
                <textarea v-if="htmlSourceMode" v-model="activeRow.htmlContent"
                  style="width:100%;min-height:180px;padding:10px 12px;border:1px solid #d0d0d0;border-radius:6px;font-family:'Consolas','D2Coding',monospace;font-size:12px;line-height:1.7;color:#333;resize:vertical;box-sizing:border-box;"></textarea>
              </template>
            </div>

            <!-- 파일목록 -->
            <div v-else-if="isFileList" style="margin-bottom:20px;">
              <div v-if="viewMode">
                <div v-if="fileListItems.length===0" style="color:#bbb;padding:12px 0;font-size:13px;">첨부파일 없음</div>
                <div v-for="(f, i) in fileListItems" :key="i"
                  style="display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid #e8e8e8;border-radius:6px;margin-bottom:6px;background:#fafafa;">
                  <span style="font-size:16px;">📎</span>
                  <a v-if="f.url" :href="f.url" target="_blank"
                    style="font-size:13px;color:#2563eb;text-decoration:none;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                    {{ f.name || f.url }}
                  </a>
                  <span v-else style="font-size:13px;color:#555;flex:1;">{{ f.name }}</span>
                </div>
              </div>
              <div v-else>
                <table class="admin-table" style="margin-bottom:8px;">
                  <thead>
                    <tr>
                      <th style="width:36px;text-align:center;">#</th>
                      <th style="width:200px;">파일명</th>
                      <th>URL / 경로</th>
                      <th style="width:36px;"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="fileListItems.length===0">
                      <td colspan="4" style="text-align:center;color:#bbb;padding:16px;font-size:13px;">
                        첨부파일이 없습니다. 아래 [+ 파일 추가] 버튼을 클릭하세요.
                      </td>
                    </tr>
                    <tr v-for="(f, i) in fileListItems" :key="i">
                      <td style="text-align:center;color:#aaa;font-size:12px;">{{ i+1 }}</td>
                      <td style="padding:4px 6px;">
                        <input class="form-control" :value="f.name"
                          @input="updateFileItem(i,'name',$event.target.value)"
                          placeholder="파일명.pdf" style="margin:0;" />
                      </td>
                      <td style="padding:4px 6px;">
                        <input class="form-control" :value="f.url"
                          @input="updateFileItem(i,'url',$event.target.value)"
                          placeholder="https://... 또는 /files/sample.pdf" style="margin:0;" />
                      </td>
                      <td style="text-align:center;padding:4px;">
                        <button @click="removeFileItem(i)"
                          style="background:none;border:1px solid #fca5a5;border-radius:4px;color:#ef4444;cursor:pointer;padding:2px 7px;font-size:12px;line-height:1.4;">✕</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <button @click="addFileItem"
                  style="font-size:12px;padding:5px 12px;border:1px dashed #aaa;border-radius:5px;background:#fafafa;cursor:pointer;color:#555;">
                  + 파일 추가
                </button>
              </div>
            </div>

            <!-- 일반 표현 설정 테이블 (조건상품 포함) -->
            <div v-else-if="displayRows.length===0" style="color:#bbb;text-align:center;padding:20px 0 24px;font-size:13px;">
              위젯 유형을 선택하면 표현 설정 항목이 표시됩니다.
            </div>
            <table v-else class="admin-table" style="margin-bottom:20px;">
              <thead><tr><th style="width:180px;">항목</th><th>값</th></tr></thead>
              <tbody>
                <tr v-for="row in displayRows" :key="row.key">
                  <td style="font-weight:500;color:#555;vertical-align:middle;">{{ row.label }}</td>
                  <td style="padding:6px 8px;">
                    <input v-if="row.type==='input'" class="form-control" v-model="activeRow[row.key]" :placeholder="row.ph" style="margin:0;" :readonly="viewMode" />
                    <input v-else-if="row.type==='number'" class="form-control" type="number" v-model.number="activeRow[row.key]" style="margin:0;max-width:200px;" :readonly="viewMode" />
                    <select v-else-if="row.type==='select'" class="form-control" v-model="activeRow[row.key]" style="margin:0;max-width:200px;" :disabled="viewMode">
                      <option v-for="o in row.options" :key="o.v" :value="o.v">{{ o.l }}</option>
                    </select>
                    <textarea v-else-if="row.type==='textarea'" class="form-control" v-model="activeRow[row.key]" rows="3" style="margin:0;" :readonly="viewMode"></textarea>
                    <textarea v-else-if="row.type==='code'" class="form-control" v-model="activeRow[row.key]" rows="6" style="margin:0;font-family:monospace;font-size:12px;background:#1e1e2e;color:#cdd3de;border-color:#444;line-height:1.6;" :readonly="viewMode"></textarea>
                    <div v-else-if="row.type==='color'" style="display:flex;gap:8px;align-items:center;">
                      <input type="color" v-model="activeRow[row.key]" style="width:40px;height:34px;border:1px solid #ddd;border-radius:4px;cursor:pointer;padding:2px;" :disabled="viewMode" />
                      <input class="form-control" v-model="activeRow[row.key]" style="margin:0;max-width:140px;" :readonly="viewMode" />
                      <span style="display:inline-block;width:60px;height:28px;border-radius:4px;border:1px solid #e8e8e8;" :style="{background:activeRow[row.key]}"></span>
                    </div>
                    <textarea v-else-if="row.type==='code'" class="form-control" v-model="activeRow[row.key]" rows="5" style="margin:0;font-family:monospace;font-size:12px;" :placeholder="row.ph" :readonly="viewMode"></textarea>
                    <div v-else-if="row.type==='event'">
                      <div style="display:flex;gap:8px;align-items:center;">
                        <input class="form-control" v-model="activeRow.eventId" placeholder="이벤트 ID" style="margin:0;max-width:160px;" :readonly="viewMode" />
                        <span v-if="activeRow.eventId" class="ref-link" @click="showRefModal('event', Number(activeRow.eventId))">보기</span>
                      </div>
                      <div v-if="relatedEvent" style="margin-top:6px;padding:8px 12px;background:#e6f4ff;border-radius:6px;font-size:12px;display:flex;align-items:center;gap:8px;">
                        <b>{{ relatedEvent.title }}</b>
                        <span class="badge badge-green">{{ relatedEvent.status }}</span>
                        <span style="color:#888;">{{ relatedEvent.startDate }} ~ {{ relatedEvent.endDate }}</span>
                      </div>
                      <div v-else-if="activeRow.eventId" style="margin-top:6px;font-size:12px;color:#aaa;">해당 이벤트를 찾을 수 없습니다.</div>
                    </div>
                  </td>
                </tr>
                <tr v-if="isText && activeRow.textContent">
                  <td style="font-weight:500;color:#555;">미리보기</td>
                  <td style="padding:6px 8px;"><div style="padding:14px;border-radius:6px;font-size:13px;" :style="{background:activeRow.bgColor,color:activeRow.textColor}">{{ activeRow.textContent }}</div></td>
                </tr>
                <tr v-if="isImage && activeRow.imageUrl">
                  <td style="font-weight:500;color:#555;">이미지 미리보기</td>
                  <td style="padding:6px 8px;"><img :src="activeRow.imageUrl" style="max-height:120px;border-radius:6px;border:1px solid #e8e8e8;" @error="$event.target.style.display='none'" /></td>
                </tr>
                <tr v-if="isProduct && activeRow.productIds">
                  <td style="font-weight:500;color:#555;">상품 링크</td>
                  <td style="padding:6px 8px;">
                    <div style="display:flex;flex-wrap:wrap;gap:6px;">
                      <span v-for="pid in activeRow.productIds.split(',').map(s=>s.trim()).filter(Boolean)" :key="pid"
                        class="ref-link" @click="showRefModal('product', Number(pid))"
                        style="padding:2px 10px;background:#e6f4ff;border-radius:12px;font-size:12px;cursor:pointer;">상품 #{{ pid }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 클릭동작 -->
            <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin-bottom:8px;">👆 클릭동작</div>
            <table class="admin-table" style="margin-bottom:8px;">
              <thead><tr><th style="width:180px;">항목</th><th>값</th></tr></thead>
              <tbody>
                <tr>
                  <td style="font-weight:500;color:#555;vertical-align:middle;">클릭 시 동작</td>
                  <td style="padding:6px 8px;">
                    <select class="form-control" v-model="activeRow.clickAction" style="margin:0;max-width:220px;" :disabled="viewMode">
                      <option value="none">없음</option>
                      <option value="navigate">페이지 이동</option>
                      <option value="event">이벤트 호출</option>
                      <option value="modal">모달 오픈</option>
                      <option value="url">외부 URL</option>
                    </select>
                  </td>
                </tr>
                <tr v-if="activeRow.clickAction !== 'none'">
                  <td style="font-weight:500;color:#555;vertical-align:middle;">대상</td>
                  <td style="padding:6px 8px;">
                    <input class="form-control" v-model="activeRow.clickTarget" placeholder="/products, showCoupon, https://..." style="margin:0;" :readonly="viewMode" />
                    <div style="margin-top:6px;font-size:12px;color:#888;">
                      <span v-if="activeRow.clickAction==='navigate'">💡 <code>/home</code>, <code>/products</code>, <code>/detail?pid=1</code> 형식</span>
                      <span v-if="activeRow.clickAction==='event'">💡 <code>showCoupon</code>, <code>openEvent</code> 등 이벤트명</span>
                      <span v-if="activeRow.clickAction==='url'">💡 외부 URL (http:// 포함)</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div><!-- /내용 영역 -->

          <div class="form-actions">
            <template v-if="viewMode">
              <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
              <button class="btn btn-secondary" @click="navigate('dpDispPanelMng')">닫기</button>
            </template>
            <template v-else>
              <button class="btn btn-secondary" @click="navigate('dpDispPanelMng')">취소</button>
            </template>
          </div>
        </div>

      </div><!-- /폼 영역 -->

      <!-- 스플리터 -->
      <div @mousedown="onSplitDrag"
        style="width:6px;cursor:col-resize;background:#e8e8e8;flex-shrink:0;position:relative;"
        title="드래그로 폭 조절">
        <div style="position:absolute;top:50%;left:1px;transform:translateY(-50%);width:4px;height:32px;background:#bbb;border-radius:2px;"></div>
      </div>
      <!-- 위젯미리보기 패널 -->
      <div :style="{
        width: previewPaneWidth + 'px', flexShrink:0,
        borderLeft:'1px solid #e8e8e8', background:'#f7f8fb',
        display:'flex', flexDirection:'column', overflow:'hidden',
      }">
        <!-- 위젯미리보기 타이틀 -->
        <div style="padding:10px 14px;border-bottom:1px solid #e0e0e0;background:#f0f2f7;flex-shrink:0;display:flex;align-items:center;gap:6px;">
          <span style="font-size:11px;font-weight:700;color:#555;letter-spacing:.5px;cursor:help;position:relative;"
            @mouseenter="showComponentTooltip=true" @mouseleave="showComponentTooltip=false">
            👁 {{ tab==='info' ? '패널' : '전시항목' }}미리보기
            <span style="position:absolute;bottom:-28px;left:0;background:#333;color:#fff;padding:4px 8px;border-radius:4px;font-size:9px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s;z-index:1000;" :style="{opacity: showComponentTooltip ? 1 : 0}">
              {{ tab==='info' ? '&lt;disp-x03-panel /&gt;' : '&lt;disp-x04-widget /&gt;' }}
            </span>
          </span>
          <span style="font-size:10px;color:#aaa;margin-left:auto;">
            {{ tab==='info' ? '전체 전시항목' : (TAB_LABELS.find(t=>t.key===tab)||{}).label }}
          </span>
        </div>
        <!-- 디바이스 모드 버튼 -->
        <div style="padding:8px 10px 0;">
          <div style="display:flex;gap:4px;padding:3px;background:#eef0f3;border-radius:6px;">
            <button v-for="m in PREVIEW_MODES" :key="m.value"
              @click="previewMode = m.value"
              :style="{
                flex:'1',padding:'5px 0',fontSize:'11px',border:'none',borderRadius:'4px',cursor:'pointer',
                background: previewMode===m.value ? '#fff' : 'transparent',
                color: previewMode===m.value ? '#1565c0' : '#666',
                fontWeight: previewMode===m.value ? 700 : 500,
                boxShadow: previewMode===m.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }">{{ m.label }}</button>
          </div>
        </div>
        <!-- 위젯미리보기 내용 (디바이스 프레임) -->
        <div style="flex:1;overflow:auto;padding:10px;">
        <div :style="{
          width: previewFrameWidth, margin:'0 auto', border:'1px solid #d0d7de', borderRadius:'8px',
          background:'#fff', padding:'8px', transition:'width .2s',
          display:'flex', flexDirection:'column', gap:'10px',
        }">
          <!-- 패널기본정보: 패널 전체 렌더 -->
          <template v-if="tab==='info'">
            <disp-x03-panel
              :params="{ }"
              :disp-dataset="dispDataset"
              :disp-opt="{ layout:'vertical', showBadges:true }"
              :panel-item="{...form, rows: rows, status:'활성', condition: form.condition||'항상 표시'}"
              :show-header="true"
            />
          </template>
          <!-- 위젯1~5: 해당 위젯만 -->
          <template v-else-if="activeRow">
            <disp-x04-widget
              :params="{ }"
              :disp-dataset="dispDataset"
              :disp-opt="{ showBadges: true }"
              :widget-item="{...activeRow, widgetNm: activeRow.widgetNm||(TAB_LABELS.find(t=>t.key===tab)||{}).label||'위젯', status:'활성', condition:'항상 표시'}"
            />
          </template>
        </div><!-- /device frame -->
        </div>
      </div><!-- /위젯미리보기 패널 -->

      </div><!-- /우측 콘텐츠 -->
    </div><!-- /탭 모드 flex -->
    </div><!-- /내부 flex -->

    <!-- ═══════════════════ 펼치기(아코디언) 모드 ═══════════════════ -->
    <div v-else>
      <div v-for="(t, tIdx) in TAB_LABELS" :key="'va_'+t.key" style="margin-bottom:4px;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">

        <!-- 섹션 헤더 -->
        <div @click="toggleSection(t.key)"
          style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;cursor:pointer;user-select:none;transition:background .15s;"
          :style="isSectionExpanded(t.key) ? 'background:#fff0f4;' : 'background:#f2f2f2;'">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:13px;font-weight:700;" :style="isSectionExpanded(t.key) ? 'color:#e8587a;' : 'color:#555;'">
              {{ t.label }}
            </span>
            <!-- 위젯 이동 버튼: 위젯 섹션이 열려 있을 때만 표시 -->
            <template v-if="t.key !== 'info' && isSectionExpanded(t.key)">
              <button @click.stop="moveRowAt(TAB_ROW_MAP[t.key], -1)" :disabled="TAB_ROW_MAP[t.key]===0"
                style="font-size:10px;border:1px solid #e0e0e0;border-radius:3px;background:#fff;cursor:pointer;padding:1px 6px;color:#888;"
                :style="TAB_ROW_MAP[t.key]===0?'opacity:0.3;cursor:default;':''">▲</button>
              <button @click.stop="moveRowAt(TAB_ROW_MAP[t.key], 1)" :disabled="TAB_ROW_MAP[t.key]===rows.length-1"
                style="font-size:10px;border:1px solid #e0e0e0;border-radius:3px;background:#fff;cursor:pointer;padding:1px 6px;color:#888;"
                :style="TAB_ROW_MAP[t.key]===rows.length-1?'opacity:0.3;cursor:default;':''">▼</button>
              <!-- 삭제 버튼 (위젯2부터) -->
              <button v-if="tIdx >= 2" @click.stop="removeWidget(TAB_ROW_MAP[t.key])"
                style="font-size:11px;padding:1px 7px;border:1px solid #fca5a5;border-radius:4px;background:#fff0f0;color:#dc2626;cursor:pointer;">✕</button>
            </template>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button v-if="t.key === 'info'" @click.stop="openCardPreview()"
              style="font-size:11px;padding:2px 8px;border:1px solid #b39ddb;border-radius:10px;background:#f5f0ff;cursor:pointer;color:#6a1b9a;">🖼 카드</button>
            <button v-else @click.stop="openPreview(t.key, t.label)"
              style="font-size:12px;border:none;background:none;cursor:pointer;opacity:0.5;">👁</button>
            <span style="font-size:12px;font-weight:700;" :style="isSectionExpanded(t.key) ? 'color:#e8587a;' : 'color:#bbb;'">
              {{ isSectionExpanded(t.key) ? '▲' : '▼' }}
            </span>
          </div>
        </div>

        <!-- 섹션 콘텐츠 -->
        <div v-show="isSectionExpanded(t.key)" style="padding:20px 24px;background:#fff;border-top:1px solid #f0f0f0;">

          <!-- ── 패널정보 ── -->
          <div v-if="t.key === 'info'">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">패널코드 <span v-if="!viewMode" class="req">*</span></label>
                <input class="form-control" v-model="form.dispCode" placeholder="DP_YYMMDD_HHMMSS" :readonly="viewMode" style="font-family:monospace;" />
              </div>
              <div class="form-group">
                <label class="form-label">패널명 <span v-if="!viewMode" class="req">*</span></label>
                <input class="form-control" v-model="form.name" placeholder="패널 이름" :readonly="viewMode" />
              </div>
              <div class="form-group">
                <label class="form-label">표시경로 <span style="font-size:10px;color:#888;font-weight:400;margin-left:4px;">(예: FRONT.모바일메인)</span></label>
                <div :style="{padding:'7px 10px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'12px',background:'#f5f5f7',color:form.pathId!=null?'#374151':'#9ca3af',fontWeight:form.pathId!=null?600:400,display:'flex',alignItems:'center',gap:'8px',fontFamily:'monospace'}">
                  <span style="flex:1;">{{ pathLabel(form.pathId) || '경로 선택...' }}</span>
                  <button type="button" v-if="!viewMode" @click="openPathPick('form')" title="표시경로 선택"
                    :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'24px',height:'24px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'12px',color:'#6b7280',padding:'0'}"
                    @mouseover="$event.currentTarget.style.background='#eef2ff'"
                    @mouseout="$event.currentTarget.style.background='#fff'">🔍</button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">포함된 화면영역
                  <span style="font-size:10px;color:#888;font-weight:400;margin-left:4px;">(전시영역관리에서 편집)</span>
                </label>
                <div style="padding:8px 10px;border:1px solid #e4e4e4;border-radius:6px;background:#fafbfc;min-height:34px;display:flex;flex-wrap:wrap;gap:4px;align-items:center;">
                  <span v-if="form.area" style="font-size:11px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:10px;padding:2px 10px;">
                    <code style="font-size:10px;background:transparent;">{{ form.area }}</code>
                    &nbsp;{{ currentAreaLabel }}
                  </span>
                  <span v-else style="font-size:11px;color:#bbb;">영역에 포함되지 않음</span>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">상태</label>
              <select class="form-control" style="max-width:200px;" v-model="form.status" :disabled="viewMode">
                <option>활성</option><option>비활성</option>
              </select>
            </div>
            <!-- 타이틀 설정 -->
            <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin:16px 0 8px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">🏷 타이틀 설정</div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
              <label style="font-size:12px;font-weight:600;color:#555;width:90px;flex-shrink:0;">타이틀 표시</label>
              <label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer;">
                <input type="radio" v-model="form.titleYn" value="Y" :disabled="viewMode" /> 표시
              </label>
              <label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer;">
                <input type="radio" v-model="form.titleYn" value="N" :disabled="viewMode" /> 미표시
              </label>
            </div>
            <div v-if="form.titleYn==='Y'" style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
              <label style="font-size:12px;font-weight:600;color:#555;width:90px;flex-shrink:0;">타이틀</label>
              <input v-model="form.title" type="text" placeholder="타이틀 텍스트 입력" :readonly="viewMode"
                style="flex:1;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;" />
            </div>
            <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin:16px 0 8px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">📝 HTML 설명</div>
            <div v-if="viewMode" style="padding:12px 14px;background:#f9f9f9;border:1px solid #e8e8e8;border-radius:6px;font-size:13px;line-height:1.7;min-height:80px;margin-bottom:16px;">
              <span v-if="form.htmlDesc" v-html="form.htmlDesc"></span>
              <span v-else style="color:#bbb;">내용 없음</span>
            </div>
            <div v-else ref="htmlDescEl" style="margin-bottom:16px;"></div>
            <div class="form-actions">
              <template v-if="viewMode">
                <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
                <button class="btn btn-secondary" @click="navigate('dpDispPanelMng')">닫기</button>
              </template>
              <template v-else>
                <button class="btn btn-secondary" @click="navigate('dpDispPanelMng')">취소</button>
              </template>
            </div>
          </div>

          <!-- ── 위젯 1~5: 각 섹션이 독립 row 바인딩 ── -->
          <!-- v-for 단일 아이템 트릭으로 r 로컬 변수 생성 -->
          <template v-else-if="t.key !== 'info'" v-for="r in [rows[TAB_ROW_MAP[t.key]]]" :key="'r_'+t.key">
            <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">📐 위젯 설정</div>
            <div class="form-row" style="margin-bottom:16px;">
              <div class="form-group">
                <label class="form-label">위젯 유형</label>
                <select class="form-control" v-model="r.widgetType" :disabled="viewMode">
                  <option v-for="w in WIDGET_TYPES" :key="w.value" :value="w.value">{{ w.label }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">노출 순서</label>
                <input class="form-control" type="number" v-model.number="r.sortOrder" min="1" :readonly="viewMode" />
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
              <label style="font-size:12px;font-weight:600;color:#555;width:90px;flex-shrink:0;">타이틀 표시</label>
              <label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer;">
                <input type="radio" v-model="r.titleYn" value="Y" :disabled="viewMode" /> 표시
              </label>
              <label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer;">
                <input type="radio" v-model="r.titleYn" value="N" :disabled="viewMode" /> 미표시
              </label>
            </div>
            <div v-if="r.titleYn==='Y'" style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
              <label style="font-size:12px;font-weight:600;color:#555;width:90px;flex-shrink:0;">타이틀</label>
              <input v-model="r.title" type="text" placeholder="타이틀 텍스트 입력" :readonly="viewMode"
                style="flex:1;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;" />
            </div>

            <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">🎨 표현 설정</div>
            <!-- HTML 에디터: 펼치기 모드에서는 textarea로 표시 -->
            <div v-if="rowIsHtmlEditor(r)" style="margin-bottom:20px;">
              <div v-if="viewMode" style="padding:12px 14px;background:#f9f9f9;border:1px solid #e8e8e8;border-radius:6px;font-size:13px;line-height:1.7;min-height:80px;">
                <span v-if="r.htmlContent" v-html="r.htmlContent"></span>
                <span v-else style="color:#bbb;">내용 없음</span>
              </div>
              <textarea v-else class="form-control" v-model="r.htmlContent" rows="6" style="font-family:monospace;font-size:12px;" placeholder="HTML 코드를 입력하세요 (탭 모드에서 Quill 에디터 사용 가능)"></textarea>
            </div>
            <!-- 파일목록 -->
            <div v-else-if="rowIsFileList(r)" style="margin-bottom:20px;">
              <div v-if="viewMode">
                <div v-if="getFileListItems(r).length===0" style="color:#bbb;padding:12px 0;font-size:13px;">첨부파일 없음</div>
                <div v-for="(f, fi) in getFileListItems(r)" :key="fi" style="display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid #e8e8e8;border-radius:6px;margin-bottom:6px;background:#fafafa;">
                  <span>📎</span>
                  <a v-if="f.url" :href="f.url" target="_blank" style="font-size:13px;color:#2563eb;text-decoration:none;flex:1;">{{ f.name || f.url }}</a>
                  <span v-else style="font-size:13px;color:#555;flex:1;">{{ f.name }}</span>
                </div>
              </div>
              <div v-else>
                <table class="admin-table" style="margin-bottom:8px;">
                  <thead><tr><th style="width:36px;text-align:center;">#</th><th style="width:200px;">파일명</th><th>URL / 경로</th><th style="width:36px;"></th></tr></thead>
                  <tbody>
                    <tr v-if="getFileListItems(r).length===0"><td colspan="4" style="text-align:center;color:#bbb;padding:16px;font-size:13px;">첨부파일이 없습니다.</td></tr>
                    <tr v-for="(f, fi) in getFileListItems(r)" :key="fi">
                      <td style="text-align:center;color:#aaa;font-size:12px;">{{ fi+1 }}</td>
                      <td style="padding:4px 6px;"><input class="form-control" :value="f.name" @input="setFileItem(r,fi,'name',$event.target.value)" placeholder="파일명.pdf" style="margin:0;" /></td>
                      <td style="padding:4px 6px;"><input class="form-control" :value="f.url" @input="setFileItem(r,fi,'url',$event.target.value)" placeholder="https://..." style="margin:0;" /></td>
                      <td style="text-align:center;padding:4px;"><button @click="removeFileItemAt(r,fi)" style="background:none;border:1px solid #fca5a5;border-radius:4px;color:#ef4444;cursor:pointer;padding:2px 7px;font-size:12px;line-height:1.4;">✕</button></td>
                    </tr>
                  </tbody>
                </table>
                <button @click="addFileItemAt(r)" style="font-size:12px;padding:5px 12px;border:1px dashed #aaa;border-radius:5px;background:#fafafa;cursor:pointer;color:#555;">+ 파일 추가</button>
              </div>
            </div>
            <!-- 일반 표현 설정 -->
            <div v-else-if="getDisplayRows(r).length===0" style="color:#bbb;text-align:center;padding:20px 0 24px;font-size:13px;">위젯 유형을 선택하면 표현 설정 항목이 표시됩니다.</div>
            <table v-else class="admin-table" style="margin-bottom:20px;">
              <thead><tr><th style="width:180px;">항목</th><th>값</th></tr></thead>
              <tbody>
                <tr v-for="drow in getDisplayRows(r)" :key="drow.key">
                  <td style="font-weight:500;color:#555;vertical-align:middle;">{{ drow.label }}</td>
                  <td style="padding:6px 8px;">
                    <input v-if="drow.type==='input'" class="form-control" v-model="r[drow.key]" :placeholder="drow.ph" style="margin:0;" :readonly="viewMode" />
                    <input v-else-if="drow.type==='number'" class="form-control" type="number" v-model.number="r[drow.key]" style="margin:0;max-width:200px;" :readonly="viewMode" />
                    <select v-else-if="drow.type==='select'" class="form-control" v-model="r[drow.key]" style="margin:0;max-width:200px;" :disabled="viewMode">
                      <option v-for="o in drow.options" :key="o.v" :value="o.v">{{ o.l }}</option>
                    </select>
                    <textarea v-else-if="drow.type==='textarea'" class="form-control" v-model="r[drow.key]" rows="3" style="margin:0;" :readonly="viewMode"></textarea>
                    <textarea v-else-if="drow.type==='code'" class="form-control" v-model="r[drow.key]" rows="6" style="margin:0;font-family:monospace;font-size:12px;background:#1e1e2e;color:#cdd3de;border-color:#444;line-height:1.6;" :readonly="viewMode"></textarea>
                    <div v-else-if="drow.type==='color'" style="display:flex;gap:8px;align-items:center;">
                      <input type="color" v-model="r[drow.key]" style="width:40px;height:34px;border:1px solid #ddd;border-radius:4px;cursor:pointer;padding:2px;" :disabled="viewMode" />
                      <input class="form-control" v-model="r[drow.key]" style="margin:0;max-width:140px;" :readonly="viewMode" />
                      <span style="display:inline-block;width:60px;height:28px;border-radius:4px;border:1px solid #e8e8e8;" :style="{background:r[drow.key]}"></span>
                    </div>
                    <textarea v-else-if="drow.type==='code'" class="form-control" v-model="r[drow.key]" rows="5" style="margin:0;font-family:monospace;font-size:12px;" :placeholder="drow.ph" :readonly="viewMode"></textarea>
                    <div v-else-if="drow.type==='event'">
                      <div style="display:flex;gap:8px;align-items:center;">
                        <input class="form-control" v-model="r.eventId" placeholder="이벤트 ID" style="margin:0;max-width:160px;" :readonly="viewMode" />
                        <span v-if="r.eventId" class="ref-link" @click="showRefModal('event', Number(r.eventId))">보기</span>
                      </div>
                      <div v-if="getRelatedEvent(r)" style="margin-top:6px;padding:8px 12px;background:#e6f4ff;border-radius:6px;font-size:12px;display:flex;align-items:center;gap:8px;">
                        <b>{{ getRelatedEvent(r).title }}</b>
                        <span class="badge badge-green">{{ getRelatedEvent(r).status }}</span>
                        <span style="color:#888;">{{ getRelatedEvent(r).startDate }} ~ {{ getRelatedEvent(r).endDate }}</span>
                      </div>
                      <div v-else-if="r.eventId" style="margin-top:6px;font-size:12px;color:#aaa;">해당 이벤트를 찾을 수 없습니다.</div>
                    </div>
                  </td>
                </tr>
                <tr v-if="rowIsText(r) && r.textContent">
                  <td style="font-weight:500;color:#555;">미리보기</td>
                  <td style="padding:6px 8px;"><div style="padding:14px;border-radius:6px;font-size:13px;" :style="{background:r.bgColor,color:r.textColor}">{{ r.textContent }}</div></td>
                </tr>
                <tr v-if="rowIsImage(r) && r.imageUrl">
                  <td style="font-weight:500;color:#555;">이미지 미리보기</td>
                  <td style="padding:6px 8px;"><img :src="r.imageUrl" style="max-height:120px;border-radius:6px;border:1px solid #e8e8e8;" @error="$event.target.style.display='none'" /></td>
                </tr>
                <tr v-if="rowIsProduct(r) && r.productIds">
                  <td style="font-weight:500;color:#555;">상품 링크</td>
                  <td style="padding:6px 8px;">
                    <div style="display:flex;flex-wrap:wrap;gap:6px;">
                      <span v-for="pid in r.productIds.split(',').map(s=>s.trim()).filter(Boolean)" :key="pid"
                        class="ref-link" @click="showRefModal('product', Number(pid))"
                        style="padding:2px 10px;background:#e6f4ff;border-radius:12px;font-size:12px;cursor:pointer;">상품 #{{ pid }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">👆 클릭 동작</div>
            <table class="admin-table" style="margin-bottom:20px;">
              <thead><tr><th style="width:180px;">항목</th><th>값</th></tr></thead>
              <tbody>
                <tr>
                  <td style="font-weight:500;color:#555;vertical-align:middle;">클릭 시 동작</td>
                  <td style="padding:6px 8px;">
                    <select class="form-control" v-model="r.clickAction" style="margin:0;max-width:220px;" :disabled="viewMode">
                      <option value="none">없음</option><option value="navigate">페이지 이동</option>
                      <option value="event">이벤트 호출</option><option value="modal">모달 오픈</option><option value="url">외부 URL</option>
                    </select>
                  </td>
                </tr>
                <tr v-if="r.clickAction !== 'none'">
                  <td style="font-weight:500;color:#555;vertical-align:middle;">대상</td>
                  <td style="padding:6px 8px;">
                    <input class="form-control" v-model="r.clickTarget" placeholder="/products, showCoupon, https://..." style="margin:0;" :readonly="viewMode" />
                    <div style="margin-top:6px;font-size:12px;color:#888;">
                      <span v-if="r.clickAction==='navigate'">💡 <code>/home</code>, <code>/products</code> 형식</span>
                      <span v-if="r.clickAction==='event'">💡 <code>showCoupon</code>, <code>openEvent</code> 등</span>
                      <span v-if="r.clickAction==='url'">💡 외부 URL (http:// 포함)</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="form-actions">
              <template v-if="viewMode">
                <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
                <button class="btn btn-secondary" @click="navigate('dpDispPanelMng')">닫기</button>
              </template>
              <template v-else>
                <button class="btn btn-secondary" @click="navigate('dpDispPanelMng')">취소</button>
              </template>
            </div>
          </template>

        </div><!-- /섹션 콘텐츠 -->
      </div><!-- /v-for 섹션 -->
      <!-- 위젯 추가 버튼 (펼치기 모드) -->
      <div v-if="rows.length < MAX_WIDGETS" style="margin-top:6px;">
        <button @click="!isNew && addWidget()" :disabled="isNew"
          :title="isNew ? '저장 후 전시항목을 추가할 수 있습니다.' : ''"
          :style="isNew ? 'width:100%;padding:9px 0;border:1.5px dashed #e0e0e0;border-radius:8px;background:#f5f5f5;cursor:not-allowed;font-size:13px;color:#bbb;' : 'width:100%;padding:9px 0;border:1.5px dashed #d0d0d0;border-radius:8px;background:#fafafa;cursor:pointer;font-size:13px;color:#888;'">
          + 위젯 추가
        </button>
      </div>
    </div><!-- /펼치기 아코디언 모드 -->

  </div>

  <!-- 위젯미리보기 모달 -->
  <disp-preview-modal
    :show="preview.show"
    mode="single"
    :tab-label="preview.tabLabel"
    :area="form.area"
    :widgets="dispDataset.displays"
    :widget="previewWidget"
    @close="closePreview"
  />

  <!-- 패널미리보기 오버레이 -->
  <div v-if="cardPreview && cardPreview.show"
    @click.self="closeCardPreview"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;">
    <div style="background:#fff;border-radius:14px;width:520px;max-width:92vw;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.35);">
      <!-- 헤더 -->
      <div style="background:linear-gradient(135deg,#e8587a,#c0395e);color:#fff;padding:15px 20px;border-radius:14px 14px 0 0;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:14px;font-weight:700;">🖼 패널미리보기</span>
        <button @click="closeCardPreview" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;opacity:0.85;line-height:1;padding:0;">×</button>
      </div>
      <!-- 카드 본문 -->
      <div style="padding:24px;">
        <!-- 영역 + 상태 배지 -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center;">
          <code style="font-size:11px;background:#f0f2f5;color:#555;padding:3px 8px;border-radius:4px;letter-spacing:.3px;">{{ form.area }}</code>
          <span style="font-size:12px;background:#e8f4fd;color:#1565c0;border-radius:10px;padding:2px 10px;">{{ currentAreaLabel }}</span>
          <span class="badge" :class="form.status==='활성'?'badge-green':'badge-gray'" style="font-size:12px;">{{ form.status }}</span>
        </div>
        <!-- 패널명 -->
        <div style="font-size:22px;font-weight:800;color:#222;margin-bottom:16px;line-height:1.3;">{{ form.name || '(패널명 없음)' }}</div>
        <!-- 위젯 구성 -->
        <div style="border-top:1px solid #f0f0f0;padding-top:14px;">
          <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:10px;">📐 위젯 구성</div>
          <div v-for="(r, i) in rows" :key="i"
            style="display:flex;align-items:center;gap:10px;padding:9px 14px;border:1px solid #f0f0f0;border-radius:8px;margin-bottom:6px;background:#fafafa;">
            <span style="font-size:11px;color:#bbb;font-weight:700;min-width:16px;text-align:center;">{{ i+1 }}</span>
            <span style="font-size:13px;font-weight:600;color:#333;flex:1;">{{ wLabel(r.widgetType) }}</span>
            <span style="font-size:10px;background:#e8f0fe;color:#1a73e8;border-radius:8px;padding:2px 8px;">순서 {{ r.sortOrder }}</span>
            <span v-if="r.clickAction && r.clickAction !== 'none'"
              style="font-size:10px;color:#888;background:#f0f0f0;border-radius:8px;padding:2px 8px;">{{ r.clickAction }}</span>
          </div>
        </div>
      </div>
      <!-- 푸터 -->
      <div style="padding:12px 20px;background:#f8f8f8;border-top:1px solid #f0f0f0;border-radius:0 0 14px 14px;text-align:right;">
        <button @click="closeCardPreview" class="btn btn-secondary btn-sm">닫기</button>
      </div>
    </div>
  </div>

  <!-- 전시위젯Lib 선택 팝업 -->
  <widget-lib-pick-modal v-if="libPickOpen" :mode="libPickMode"
    :widget-libs="dispDataset.widgetLibs || []"
    @close="libPickOpen=false"
    @pick="onLibPicked" />

  <!-- 전시항목 복사 팝업 -->
  <row-pick-modal v-if="rowCopyOpen"
    :title="'전시항목 복사 [' + (form.name || '현재 패널') + ']'"
    :displays="dispDataset.displays || []"
    :areas="(dispDataset.codes||[]).filter(c => c.codeGrp==='DISP_AREA')"
    :exclude-panel-id="form.dispId"
    @close="rowCopyOpen=false"
    @pick-multi="onRowCopy" />

  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="ec_disp_panel"
    :value="form.pathId"
    title="표시경로 선택"
    @select="onPathPicked" @close="closePathPick" />
</div>
`,
};
