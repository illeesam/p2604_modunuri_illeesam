/* ShopJoy Admin - 위젯라이브러리 상세/등록 */
window.DpDispWidgetLibDtl = {
  name: 'DpDispWidgetLibDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} }, // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { reactive, computed, ref, onMounted, watch, nextTick } = Vue;
    const showToast    = window.boApp.showToast;
    const showConfirm  = window.boApp.showConfirm;
    const setApiRes    = window.boApp.setApiRes;
    const codes = reactive({ disp_widget_types: [], active_statuses: [], click_action_opts: [{value:'none',label:'없음'},{value:'navigate',label:'페이지 이동'},{value:'event',label:'이벤트 실행'},{value:'modal',label:'모달 열기'}] });
    const uiState = reactive({ isPageCodeLoad: false, loading: false, error: null, previewMode: 'default', previewPaneWidth: 460, htmlContentEl: null, libPickOpen: false, htmlSourceMode: false, showComponentTooltip: false, jsonCopied: false });
    const previewMode = Vue.toRef(uiState, 'previewMode');

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.disp_widget_types = codeStore.sgGetGrpCodes('DISP_WIDGET_TYPE');
      codes.active_statuses = codeStore.sgGetGrpCodes('ACTIVE_STATUS');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);

    // 코드 주입

    /* -- 표시경로 선택 모달 (sy_path, 다중) -- */
    const pathPickModal = reactive({ show: false });
    const openPathPick = () => { pathPickModal.show = true; };
    const closePathPick = () => { pathPickModal.show = false; };
    const onPathPicked = (pathId) => { form.pathId = pathId; };
    const pathLabel = (id) => boUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));
    const cfIsNew = computed(() => !props.dtlId);

    /* -- 폼 초기값 -- */
    const makeForm = () => ({
      libId: null, libCode: '', name: '', widgetType: 'image_banner', desc: '', tags: '', status: '활성',
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

    /* -- 기존 데이터 로드 -- */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.dpWidgetLib.getById(props.dtlId, '전시위젯라이브러리', '상세조회');
        const data = res.data?.data;
        if (data) Object.assign(form, data);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
      if (form.widgetType === 'html_editor') {
        await nextTick();
        initQuill();
      }
    };

    const handleInitNewForm = () => {
      if (!cfIsNew.value) return;
      /* 신규: Lib코드 자동 생성 DL_YYMMDD_HHMMSS */
      const t = new Date();
      const p = n => String(n).padStart(2, '0');
      form.libCode = `DL_${String(t.getFullYear()).slice(2)}${p(t.getMonth()+1)}${p(t.getDate())}_${p(t.getHours())}${p(t.getMinutes())}${p(t.getSeconds())}`;
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
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
    const saveFileList   = (items) => { form.fileListJson = JSON.stringify(items); };
    const addFileItem    = () => saveFileList([...cfFileListItems.value, { name: '', url: '' }]);
    const removeFileItem = (idx) => saveFileList(window.safeArrayUtils.safeFilter(cfFileListItems, (_, i) => i !== idx));
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
        if (obj[k] === '' || obj[k] === null) delete obj[k];
      });
      return JSON.stringify(obj, null, 2);
    });
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
    const onSplitDrag = (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = uiState.previewPaneWidth;
      const onMove = (ev) => {
        uiState.previewPaneWidth = Math.max(260, Math.min(1600, startW + (startX - ev.clientX)));
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };

    /* -- 위젯Lib미리보기용 위젯 객체 -- */
    const cfPreviewWidget = computed(() => ({
      ...form,
      dispId: form.libId || 0,
      name: form.name || '미리보기',
      area: 'PREVIEW',
      status: '활성',
      useYn: 'Y',
      dispYn: 'Y',
      condition: '항상 표시',
      authRequired: false,
      authGrade: '',
    }));

    /* -- Quill 에디터 (HTML 에디터 유형) -- */
    const htmlContentEl  = ref(null);
    let quillInst = null;

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

    const initQuill = () => {
      if (!uiState.htmlContentEl || quillInst) return;
      quillInst = new Quill(uiState.htmlContentEl, QUILL_OPTS);
      quillInst.root.innerHTML = form.htmlContent || '';
      quillInst.on('text-change', () => { form.htmlContent = quillInst.root.innerHTML; });
    };

    const toggleHtmlSource = async () => {
      if (!uiState.htmlSourceMode) {
        /* WYSIWYG → 소스 */
        if (quillInst) form.htmlContent = quillInst.root.innerHTML;
        uiState.htmlSourceMode = true;
      } else {
        /* 소스 → WYSIWYG */
        uiState.htmlSourceMode = false;
        await nextTick();
        if (quillInst) {
          quillInst.off('text-change');
          quillInst.root.innerHTML = form.htmlContent || '';
          quillInst.on('text-change', () => { form.htmlContent = quillInst.root.innerHTML; });
        } else {
          initQuill();
        }
      }
    };

    watch(cfIsHtmlEditor, async (val) => {
      if (!val) return;
      uiState.htmlSourceMode = false;
      quillInst = null;
      await nextTick();
      initQuill();
    });

    /* -- Yup 유효성 -- */
    const schema = window.yup.object({
      libCode:    window.yup.string().required('Lib코드를 입력하세요.'),
      name:       window.yup.string().required('라이브러리명을 입력하세요.'),
      widgetType: window.yup.string().required('위젯 유형을 선택하세요.'),
    });

    /* -- 저장 -- */
    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try { await schema.validate(form, { abortEarly: false }); }
      catch (err) { err.inner.forEach(e => { errors[e.path] = e.message; }); showToast('입력 내용을 확인해주세요.', 'error'); return; }

      const isNewLib = cfIsNew.value;
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;
      try {
        const res = await (isNewLib ? boApiSvc.dpWidgetLib.create({ ...form }, '전시위젯라이브러리', '등록') : boApiSvc.dpWidgetLib.update(form.libId, { ...form }, '전시위젯라이브러리', '저장'));
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('저장되었습니다.', 'success');
        if (props.navigate) props.navigate('dpDispWidgetLibMng', { reload: true });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* -- 삭제 -- */
    const handleDelete = async () => {
      if (cfIsNew.value) return;
      const ok = await showConfirm('삭제', '이 위젯 Lib를 삭제하시겠습니까?');
      if (!ok) return;
      try {
        const res = await boApiSvc.dpWidgetLib.remove(form.libId, '전시위젯라이브러리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
      props.navigate('dpDispWidgetLibMng', { reload: true });
    };

    /* -- 위젯Lib 내용복사 팝업 -- */
    const openLibPick = () => { uiState.libPickOpen = true; };
    const onLibPicked = (lib) => {
      uiState.libPickOpen = false;
      const preserve = { libId: form.libId, libCode: form.libCode, regDate: form.regDate };
      Object.assign(form, { ...lib, ...preserve });
      showToast && showToast(`[${lib.name}] 내용을 복사했습니다.`, 'info');
    };

    const previewPaneWidth = Vue.toRef(uiState, 'previewPaneWidth');
    const libPickOpen = Vue.toRef(uiState, 'libPickOpen');
    const htmlSourceMode = Vue.toRef(uiState, 'htmlSourceMode');
    const showComponentTooltip = Vue.toRef(uiState, 'showComponentTooltip');
    const jsonCopied = Vue.toRef(uiState, 'jsonCopied');

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    // -- return ---------------------------------------------------------------

    return {
      pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      uiState, libPickOpen, htmlSourceMode, showComponentTooltip, jsonCopied,
      openLibPick, onLibPicked,
      cfDtlMode, cfIsNew, form, errors, codes,
      cfIsImage, cfIsProduct, cfIsCondProduct, cfIsChart, cfIsText, cfIsInfo,
      cfIsPopup, cfIsFile, cfIsFileList, cfIsCoupon, cfIsHtmlEditor, cfIsEvent, cfIsCache, cfIsEmbed,
      cfDisplayRows, cfFileListItems, addFileItem, removeFileItem, updateFileItem,
      cfPreviewWidget, cfSampleJson, copyJson, handleSave, handleDelete,
      previewMode, PREVIEW_MODES, cfPreviewFrameWidth, previewPaneWidth, onSplitDrag,
      htmlContentEl, toggleHtmlSource,
    };
  },
  template: /* html */`
<div class="card" style="padding:0;">
  <!-- -- 헤더 ------------------------------------------------------------- -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f0f0f0;background:#fafafa;border-radius:8px 8px 0 0;">
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="font-size:15px;font-weight:700;color:#222;">
        {{ cfIsNew ? '위젯 Lib 신규등록' : '위젯 Lib 수정' }}
      </span>
      <span v-if="!cfIsNew" style="font-size:11px;background:#eee;color:#666;border-radius:4px;padding:1px 7px;">#{{ String(form.libId).padStart(4,'0') }}</span>
    </div>
    <div class="form-actions" v-if="!cfDtlMode" style="margin:0;gap:8px;">
      <button @click="openLibPick" class="btn btn-outline" style="font-size:12px;background:#e3f2fd;color:#1565c0;border-color:#90caf9;">📋 전시위젯Lib 내용복사</button>
      <button @click="handleSave"   class="btn btn-primary" style="font-size:13px;">저장</button>
      <button v-if="!cfIsNew" @click="handleDelete" class="btn btn-outline" style="font-size:13px;color:#e8587a;border-color:#e8587a;">삭제</button>
      <button @click="$emit('close')" class="btn btn-outline" style="font-size:13px;">닫기</button>
    </div>
    <widget-lib-pick-modal v-if="libPickOpen" mode="copy"
      :widget-libs="[] || []"
      @close="libPickOpen=false"
      @pick="onLibPicked" />
  </div>

  <div style="display:flex;gap:0;">
    <!-- -- 왼쪽: 폼 -------------------------------------------------------- -->
    <div style="flex:1;padding:20px;min-width:0;overflow-y:auto;">

      <!-- -- ■ 설정 ------------------------------------------------------- -->
      <div style="margin-bottom:14px;padding:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
        <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
          <span style="display:inline-block;width:4px;height:16px;background:#1d4ed8;border-radius:2px;"></span>
          설정
        </div>
        <div class="form-row" style="margin-bottom:8px;">
          <div class="form-group">
            <label class="form-label">Lib코드 <span style="color:#e8587a;">*</span></label>
            <input v-model="form.libCode" class="form-control" :class="{'is-invalid':errors.libCode}" placeholder="DL_YYMMDD_HHMMSS" style="margin:0;font-family:monospace;" />
            <div v-if="errors.libCode" class="field-error">{{ errors.libCode }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">라이브러리명 <span style="color:#e8587a;">*</span></label>
            <input v-model="form.name" class="form-control" :class="{'is-invalid':errors.name}" placeholder="위젯 Lib 이름" style="margin:0;" />
            <div v-if="errors.name" class="field-error">{{ errors.name }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">상태</label>
            <select v-model="form.status" class="form-control" style="margin:0;">
              <option v-for="c in codes.active_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
            </select>
          </div>
        </div>
        <div class="form-row" style="margin-bottom:8px;">
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">설명</label>
            <input v-model="form.desc" class="form-control" placeholder="위젯 용도·설명 메모" style="margin:0;" />
          </div>
        </div>
        <div class="form-row" style="margin-bottom:12px;">
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">태그 <span style="font-size:10px;color:#aaa;">(쉼표 구분)</span></label>
            <input v-model="form.tags" class="form-control" placeholder="봄,배너,시즌" style="margin:0;" />
          </div>
        </div>
        <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin-bottom:6px;">표시경로 <span style="font-size:10px;font-weight:400;color:#aaa;">이 위젯이 노출되는 경로 (예: FO.모바일메인)</span></div>
        <div v-for="(_id, pi) in (form.usedPathIds || [])" :key="pi"
          style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
          <div :style="{flex:1,padding:'6px 10px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'12px',background:'#f5f5f7',color:_id!=null?'#374151':'#9ca3af',fontWeight:_id!=null?600:400,display:'flex',alignItems:'center',gap:'8px',fontFamily:'monospace'}">
            <span style="flex:1;">{{ pathLabel(_id) || '경로 선택...' }}</span>
            <button type="button" @click="openPathPick(pi)" title="표시경로 선택"
              :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'22px',height:'22px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'11px',color:'#6b7280',padding:'0'}">🔍</button>
          </div>
          <button @click="form.usedPathIds.splice(pi,1)"
            style="padding:4px 8px;border:1px solid #fca5a5;background:#fff0f0;color:#dc2626;border-radius:4px;cursor:pointer;font-size:12px;flex-shrink:0;">✕</button>
        </div>
        <button @click="(form.usedPathIds = form.usedPathIds || []).push(null); openPathPick(form.usedPathIds.length-1);"
          style="padding:4px 12px;border:1px solid #d1d5db;background:#fff;color:#555;border-radius:4px;cursor:pointer;font-size:12px;">+ 경로 추가</button>
      </div><!-- -- /설정 -------------------------------------------------------------- -->

      <!-- -- ■ 제목 ------------------------------------------------------- -->
      <div style="margin-bottom:14px;padding:14px;background:#faf8ff;border:1px solid #e9d5ff;border-radius:8px;">
        <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
          <span style="display:inline-block;width:4px;height:16px;background:#7c3aed;border-radius:2px;"></span>
          제목
          <span style="margin-left:auto;display:flex;align-items:center;gap:8px;">
            <span style="font-size:11px;font-weight:600;color:#888;">타이틀 표시</span>
            <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;font-weight:500;color:#444;">
              <input type="radio" v-model="form.titleYn" value="Y" /> 표시
            </label>
            <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;font-weight:500;color:#444;">
              <input type="radio" v-model="form.titleYn" value="N" /> 미표시
            </label>
          </span>
        </div>
        <div v-if="form.titleYn==='Y'" style="display:flex;align-items:center;gap:10px;">
          <label style="font-size:12px;font-weight:600;color:#555;width:50px;flex-shrink:0;">타이틀</label>
          <input v-model="form.title" type="text" placeholder="타이틀 텍스트 입력" class="form-control" style="margin:0;flex:1;" />
        </div>
      </div><!-- -- /제목 -------------------------------------------------------------- -->

      <!-- -- ■ 내용 ------------------------------------------------------- -->
      <div style="margin-bottom:14px;padding:14px;background:#fff8fa;border:1px solid #fce4ec;border-radius:8px;">
        <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
          <span style="display:inline-block;width:4px;height:16px;background:#e8587a;border-radius:2px;flex-shrink:0;"></span>
          내용
          <span style="margin-left:auto;display:inline-flex;align-items:center;gap:6px;flex-shrink:0;">
            <span style="font-size:11px;font-weight:600;color:#888;white-space:nowrap;">위젯유형</span>
            <select v-model="form.widgetType" class="form-control" :class="{'is-invalid':errors.widgetType}"
              style="margin:0;font-size:12px;padding:3px 8px;height:28px;border-radius:5px;min-width:160px;">
              <option v-for="t in codes.disp_widget_types" :key="t?.codeValue" :value="t.codeValue">{{ t.codeLabel }}</option>
            </select>
          </span>
        </div>
        <div v-if="errors.widgetType" class="field-error" style="margin-bottom:8px;">{{ errors.widgetType }}</div>

        <!-- -- 클릭동작 ----------------------------------------------------- -->
        <div v-if="!cfIsHtmlEditor && !cfIsFileList && !cfIsEmbed" style="margin-bottom:14px;">
          <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin-bottom:6px;">👆 클릭동작</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div class="form-group" style="margin:0;">
              <label class="form-label">클릭 동작</label>
              <select v-model="form.clickAction" class="form-control" style="margin:0;">
                <option v-for="o in codes.click_action_opts" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </div>
            <div class="form-group" style="margin:0;">
              <label class="form-label">클릭 대상</label>
              <input v-model="form.clickTarget" class="form-control" placeholder="/products 또는 이벤트명" style="margin:0;" />
            </div>
          </div>
        </div>

        <!-- -- 공통 동적 행 -------------------------------------------------- -->
        <div v-if="cfDisplayRows.length" style="display:flex;flex-direction:column;gap:10px;">
          <div v-for="row in cfDisplayRows" :key="row?.key" class="form-group" style="margin:0;">
            <label class="form-label">{{ row.label }}</label>
            <input  v-if="row.type==='input'"    v-model="form[row.key]" class="form-control" :placeholder="row.ph||''" style="margin:0;" />
            <input  v-else-if="row.type==='number'"  v-model.number="form[row.key]" type="number" class="form-control" :placeholder="row.ph||''" style="margin:0;" />
            <input  v-else-if="row.type==='color'"   v-model="form[row.key]" type="color" class="form-control" style="margin:0;height:36px;padding:2px 6px;" />
            <textarea v-else-if="row.type==='textarea'" v-model="form[row.key]" class="form-control" :placeholder="row.ph||''" rows="3" style="margin:0;"></textarea>
            <textarea v-else-if="row.type==='code'" v-model="form[row.key]" class="form-control" :placeholder="row.ph||''" rows="6" style="margin:0;font-family:monospace;font-size:12px;background:#1e1e2e;color:#cdd3de;border-color:#444;line-height:1.6;"></textarea>
            <select v-else-if="row.type==='select'" v-model="form[row.key]" class="form-control" style="margin:0;">
              <option v-for="o in row.options" :key="o?.v" :value="o.v">{{ o.l }}</option>
            </select>
          </div>
        </div>

        <!-- -- HTML 에디터 ------------------------------------------------- -->
        <div v-else-if="cfIsHtmlEditor" class="form-group" style="margin:0;">
          <div style="display:flex;justify-content:flex-end;margin-bottom:4px;">
            <button @click="toggleHtmlSource"
              :style="htmlSourceMode ? 'background:#1e1e2e;color:#7ec8e3;border-color:#7ec8e3;' : 'background:#f5f5f5;color:#555;border-color:#d0d0d0;'"
              style="font-size:11px;padding:3px 10px;border:1px solid;border-radius:4px;cursor:pointer;font-family:monospace;transition:all .15s;">
              {{ htmlSourceMode ? '✓ 디자인' : '</> HTML' }}
            </button>
          </div>
          <div style="background:#fff;border:1px solid #d9d9d9;border-radius:6px;overflow:hidden;">
            <div v-show="!htmlSourceMode" ref="htmlContentEl"></div>
            <textarea v-if="htmlSourceMode" v-model="form.htmlContent"
              style="width:100%;min-height:180px;padding:10px 12px;border:none;font-family:'Consolas','D2Coding',monospace;font-size:12px;line-height:1.7;color:#333;resize:vertical;box-sizing:border-box;margin:0;background:#fff;outline:none;"></textarea>
          </div>
        </div>

        <!-- -- 파일목록 ----------------------------------------------------- -->
        <div v-else-if="cfIsFileList">
          <div v-for="(item, idx) in cfFileListItems" :key="Math.random()"
            style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
            <input :value="item.name" @input="updateFileItem(idx,'name',$event.target.value)"
              class="form-control" placeholder="파일명" style="margin:0;flex:1;" />
            <input :value="item.url" @input="updateFileItem(idx,'url',$event.target.value)"
              class="form-control" placeholder="파일 URL" style="margin:0;flex:2;" />
            <button @click="removeFileItem(idx)" style="flex-shrink:0;background:none;border:none;color:#e8587a;cursor:pointer;font-size:16px;">×</button>
          </div>
          <button @click="addFileItem" class="btn btn-outline" style="font-size:12px;padding:4px 14px;">+ 파일 추가</button>
        </div>

        <div v-else style="font-size:12px;color:#aaa;text-align:center;padding:10px;">
          위젯 유형을 선택하면 입력 필드가 표시됩니다.
        </div>
      </div><!-- -- /내용 -------------------------------------------------------------- -->

    </div>

    <!-- -- 스플리터 --------------------------------------------------------- -->
    <div @mousedown="onSplitDrag"
      style="width:6px;cursor:col-resize;background:#e8e8e8;flex-shrink:0;position:relative;"
      title="드래그로 폭 조절">
      <div style="position:absolute;top:50%;left:1px;transform:translateY(-50%);width:4px;height:32px;background:#bbb;border-radius:2px;"></div>
    </div>
    <!-- -- 오른쪽: 위젯Lib미리보기 ----------------------------------------------- -->
    <div :style="{ width: previewPaneWidth + 'px', flexShrink:0, padding:'20px', background:'#f8f8f8', overflowX:'auto', transition:'width .2s' }">
      <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:10px;cursor:help;position:relative;"
        @mouseenter="showComponentTooltip=true" @mouseleave="showComponentTooltip=false">
        👁 위젯Lib미리보기
        <span style="position:absolute;bottom:-28px;left:0;background:#333;color:#fff;padding:4px 8px;border-radius:4px;font-size:9px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s;z-index:1000;" :style="{opacity: showComponentTooltip ? 1 : 0}">
          &lt;disp-x04-widget /&gt;
        </span>
      </div>
      <!-- -- 디바이스 모드 버튼 ------------------------------------------------- -->
      <div style="display:flex;gap:4px;margin-bottom:10px;padding:3px;background:#eef0f3;border-radius:6px;">
        <button v-for="m in PREVIEW_MODES" :key="m?.value"
          @click="previewMode = m.value"
          :style="{
            flex:'1',padding:'5px 0',fontSize:'11px',border:'none',borderRadius:'4px',cursor:'pointer',
            background: previewMode===m.value ? '#fff' : 'transparent',
            color: previewMode===m.value ? '#1565c0' : '#666',
            fontWeight: previewMode===m.value ? 700 : 500,
            boxShadow: previewMode===m.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }">{{ m.label }}</button>
      </div>
      <!-- -- 디바이스 프레임 --------------------------------------------------- -->
      <div :style="{ width: cfPreviewFrameWidth, margin:'0 auto', background:'#fff', border:'1px solid #e4e4e4', borderRadius:'8px', padding:'12px', minHeight:'100px', transition:'width .2s' }">
        <disp-x04-widget
          :params="{ }"
          :disp-opt="{ showBadges: true }"
          :widget-item="cfPreviewWidget"
        />
      </div>
      <div style="margin-top:12px;font-size:11px;color:#aaa;line-height:1.6;">
        <div>유형: <b>{{ form.widgetType }}</b></div>
        <div v-if="form.tags">태그: {{ form.tags }}</div>
        <div v-if="!cfIsNew">ID: #{{ String(form.libId).padStart(4,'0') }}</div>
      </div>

      <!-- -- 샘플 JSON ---------------------------------------------------- -->
      <div style="margin-top:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:12px;font-weight:700;color:#555;">📋 샘플 JSON</span>
          <button @click="copyJson"
            style="font-size:10px;padding:2px 8px;border:1px solid #d0d0d0;border-radius:6px;background:#fff;cursor:pointer;color:#666;transition:all .15s;"
            :style="jsonCopied ? 'background:#e8f5e9;color:#2e7d32;border-color:#a5d6a7;' : ''">
            {{ jsonCopied ? '✓ 복사됨' : '복사' }}
          </button>
        </div>
        <pre style="background:#1e1e2e;color:#cdd9e5;border-radius:8px;padding:10px 12px;font-size:10px;line-height:1.55;overflow:auto;max-height:320px;margin:0;white-space:pre-wrap;word-break:break-all;">{{ cfSampleJson }}</pre>
      </div>
    </div>
  </div>

  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="ec_disp_widget_lib"
    :value="form.pathId"
    title="위젯 표시경로 선택"
    @select="onPathPicked" @close="closePathPick" />
</div>
`
};
