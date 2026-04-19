/* ShopJoy Admin - 위젯라이브러리 상세/등록 */
window.DpDispWidgetLibDtl = {
  name: 'DpDispWidgetLibDtl',
  props: ['navigate', 'dispDataset', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes', 'editId'],
  emits: ['close'],
  setup(props, { emit }) {
    /* ── 표시경로 선택 모달 (sy_path, 다중) ── */
    const pathPickModal = Vue.reactive({ show: false });
    const openPathPick = () => { pathPickModal.show = true; };
    const closePathPick = () => { pathPickModal.show = false; };
    const onPathPicked = (pathId) => { form.pathId = pathId; };
    const pathLabel = (id) => window.adminUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));

    const { reactive, computed, ref, onMounted, watch, nextTick } = Vue;
    const isNew = computed(() => !props.editId);

    const WIDGET_TYPES = [
      { value: 'image_banner',   label: '이미지 배너' },
      { value: 'product_slider', label: '상품 슬라이더' },
      { value: 'product',        label: '상품' },
      { value: 'cond_product',   label: '조건상품' },
      { value: 'chart_bar',      label: '차트 (Bar)' },
      { value: 'chart_line',     label: '차트 (Line)' },
      { value: 'chart_pie',      label: '차트 (Pie)' },
      { value: 'text_banner',    label: '텍스트 배너' },
      { value: 'info_card',      label: '정보 카드' },
      { value: 'popup',          label: '팝업' },
      { value: 'file',           label: '파일' },
      { value: 'file_list',      label: '파일목록' },
      { value: 'coupon',         label: '쿠폰' },
      { value: 'html_editor',    label: 'HTML 에디터' },
      { value: 'textarea',       label: '텍스트 영역' },
      { value: 'markdown',       label: 'Markdown' },
      { value: 'barcode',         label: '바코드' },
      { value: 'qrcode',          label: 'QR코드' },
      { value: 'barcode_qrcode',  label: '바코드+QR' },
      { value: 'video_player',    label: '동영상 플레이어' },
      { value: 'countdown',       label: '카운트다운 타이머' },
      { value: 'payment_widget',  label: '결제위젯' },
      { value: 'approval_widget', label: '전자결재' },
      { value: 'map_widget',      label: '지도맵' },
      { value: 'event_banner',    label: '이벤트' },
      { value: 'cache_banner',   label: '캐쉬' },
      { value: 'widget_embed',   label: '위젯' },
    ];

    /* ── 폼 초기값 ── */
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

    /* ── 기존 데이터 로드 ── */
    onMounted(async () => {
      if (!isNew.value) {
        const src = (props.dispDataset.widgetLibs || []).find(d => d.libId == props.editId);
        if (src) Object.assign(form, src);
      } else {
        /* 신규: Lib코드 자동 생성 DL_YYMMDD_HHMMSS */
        const t = new Date();
        const p = n => String(n).padStart(2, '0');
        form.libCode = `DL_${String(t.getFullYear()).slice(2)}${p(t.getMonth()+1)}${p(t.getDate())}_${p(t.getHours())}${p(t.getMinutes())}${p(t.getSeconds())}`;
      }
      if (form.widgetType === 'html_editor') {
        await nextTick();
        initQuill();
      }
    });

    /* ── 위젯 유형별 표시 여부 ── */
    const isImage       = computed(() => form.widgetType === 'image_banner');
    const isProduct     = computed(() => ['product_slider', 'product'].includes(form.widgetType));
    const isCondProduct = computed(() => form.widgetType === 'cond_product');
    const isChart       = computed(() => form.widgetType.startsWith('chart_'));
    const isText        = computed(() => form.widgetType === 'text_banner');
    const isInfo        = computed(() => form.widgetType === 'info_card');
    const isPopup       = computed(() => form.widgetType === 'popup');
    const isFile        = computed(() => form.widgetType === 'file');
    const isFileList    = computed(() => form.widgetType === 'file_list');
    const isCoupon      = computed(() => form.widgetType === 'coupon');
    const isHtmlEditor  = computed(() => form.widgetType === 'html_editor');
    const isTextarea      = computed(() => form.widgetType === 'textarea');
    const isMarkdown      = computed(() => form.widgetType === 'markdown');
    const isBarcode       = computed(() => form.widgetType === 'barcode');
    const isQrcode        = computed(() => form.widgetType === 'qrcode');
    const isBarcodeQr     = computed(() => form.widgetType === 'barcode_qrcode');
    const isCodeWidget    = computed(() => isBarcode.value || isQrcode.value || isBarcodeQr.value);
    const isVideoPlayer   = computed(() => form.widgetType === 'video_player');
    const isCountdown     = computed(() => form.widgetType === 'countdown');
    const isPayment       = computed(() => form.widgetType === 'payment_widget');
    const isApproval      = computed(() => form.widgetType === 'approval_widget');
    const isMapWidget     = computed(() => form.widgetType === 'map_widget');
    const isEvent         = computed(() => form.widgetType === 'event_banner');
    const isCache       = computed(() => form.widgetType === 'cache_banner');
    const isEmbed       = computed(() => form.widgetType === 'widget_embed');

    /* ── 파일목록 헬퍼 ── */
    const fileListItems = computed(() => {
      try { return JSON.parse(form.fileListJson || '[]'); } catch { return []; }
    });
    const saveFileList   = (items) => { form.fileListJson = JSON.stringify(items); };
    const addFileItem    = () => saveFileList([...fileListItems.value, { name: '', url: '' }]);
    const removeFileItem = (idx) => saveFileList(fileListItems.value.filter((_, i) => i !== idx));
    const updateFileItem = (idx, field, val) =>
      saveFileList(fileListItems.value.map((item, i) => i === idx ? { ...item, [field]: val } : item));

    /* ── 동적 공통 입력 행 정의 ── */
    const displayRows = computed(() => {
      if (isImage.value) return [
        { key: 'imageUrl', label: '이미지 URL',  type: 'input',  ph: 'https://...' },
        { key: 'altText',  label: 'Alt 텍스트',  type: 'input',  ph: '' },
        { key: 'linkUrl',  label: '링크 URL',    type: 'input',  ph: 'https://...' },
      ];
      if (isProduct.value) return [
        { key: 'productIds', label: '상품 ID 목록', type: 'input', ph: '1, 2, 3, ...' },
      ];
      if (isChart.value) return [
        { key: 'chartTitle',  label: '차트 제목',        type: 'input',  ph: '' },
        { key: 'chartLabels', label: '라벨 (쉼표 구분)', type: 'input',  ph: '1월, 2월, 3월' },
        { key: 'chartValues', label: '값 (쉼표 구분)',   type: 'input',  ph: '100, 200, 150' },
      ];
      if (isText.value) return [
        { key: 'textContent', label: '텍스트 내용', type: 'textarea', ph: '' },
        { key: 'bgColor',     label: '배경색',      type: 'color' },
        { key: 'textColor',   label: '글자색',      type: 'color' },
      ];
      if (isInfo.value) return [
        { key: 'infoTitle', label: '카드 제목', type: 'input',    ph: '' },
        { key: 'infoBody',  label: '카드 내용', type: 'textarea', ph: '' },
      ];
      if (isPopup.value) return [
        { key: 'popupWidth',  label: '팝업 너비 (px)',  type: 'number', ph: '' },
        { key: 'popupHeight', label: '팝업 높이 (px)',  type: 'number', ph: '' },
        { key: 'imageUrl',    label: '팝업 이미지 URL', type: 'input',  ph: 'https://...' },
        { key: 'linkUrl',     label: '링크 URL',        type: 'input',  ph: '' },
      ];
      if (isFile.value) return [
        { key: 'fileUrl',   label: '파일 URL',    type: 'input', ph: '' },
        { key: 'fileLabel', label: '표시 레이블', type: 'input', ph: '다운로드' },
      ];
      if (isCoupon.value) return [
        { key: 'couponCode', label: '쿠폰 코드', type: 'input', ph: 'COUPON_CODE' },
        { key: 'couponDesc', label: '쿠폰 설명', type: 'input', ph: '' },
      ];
      if (isTextarea.value) return [
        { key: 'textareaContent', label: '텍스트 내용', type: 'textarea', ph: '텍스트를 입력하세요...' },
      ];
      if (isMarkdown.value) return [
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
        { key: 'payAmount',      label: '결제 금액',            type: 'number', ph: '0' },
        { key: 'payCurrency',    label: '통화',                 type: 'select', options: [{v:'KRW',l:'원 (KRW)'},{v:'USD',l:'달러 (USD)'}] },
        { key: 'payMethods',     label: '결제수단 (쉼표 구분)', type: 'input',  ph: 'card,kakao,naver,toss,bank' },
        { key: 'payButtonLabel', label: '버튼 텍스트',          type: 'input',  ph: '결제하기' },
        { key: 'payButtonColor', label: '버튼 색상',            type: 'color' },
      ];
      if (isApproval.value) return [
        { key: 'approvalDocType', label: '문서 유형',     type: 'select', options: [{v:'구매승인',l:'구매승인'},{v:'지출결의',l:'지출결의'},{v:'휴가신청',l:'휴가신청'},{v:'기안',l:'기안'},{v:'품의서',l:'품의서'}] },
        { key: 'approvalTitle',   label: '결재 제목',     type: 'input', ph: '' },
        { key: 'approvalLine',    label: '결재선 (JSON)', type: 'code',  ph: '[{"role":"담당자","name":"홍길동"},{"role":"팀장","name":""}]' },
      ];
      if (isMapWidget.value) return [
        { key: 'mapType',        label: '지도 유형',  type: 'select', options: [{v:'google',l:'Google Maps'},{v:'kakao',l:'카카오맵'},{v:'naver',l:'네이버지도'}] },
        { key: 'mapAddress',     label: '주소',       type: 'input',  ph: '서울시 강남구 테헤란로 123' },
        { key: 'mapLat',         label: '위도 (lat)', type: 'input',  ph: '37.5005' },
        { key: 'mapLng',         label: '경도 (lng)', type: 'input',  ph: '127.0356' },
        { key: 'mapZoom',        label: '줌 레벨',   type: 'number', ph: '14' },
        { key: 'mapMarkerLabel', label: '마커 라벨', type: 'input',  ph: '우리 매장' },
      ];
      if (isEvent.value) return [
        { key: 'eventId', label: '이벤트 ID', type: 'input', ph: '' },
      ];
      if (isCache.value) return [
        { key: 'cacheDesc',   label: '캐시 설명',  type: 'input',  ph: '' },
        { key: 'cacheAmount', label: '캐시 금액',  type: 'number', ph: '0' },
      ];
      if (isEmbed.value) return [
        { key: 'embedCode', label: '임베드 코드', type: 'textarea', ph: '<script>...</script>' },
      ];
      if (isCondProduct.value) return [
        { key: 'condCategory', label: '카테고리 조건', type: 'input', ph: '' },
        { key: 'condBrand',    label: '브랜드 조건',   type: 'input', ph: '' },
        { key: 'condSort',     label: '정렬 기준',     type: 'select', options: [{v:'newest',l:'최신순'},{v:'popular',l:'인기순'},{v:'price_asc',l:'가격낮은순'},{v:'price_desc',l:'가격높은순'}] },
        { key: 'condLimit',    label: '표시 개수',     type: 'number', ph: '8' },
      ];
      return [];
    });

    /* ── 샘플 JSON ── */
    const sampleJson = computed(() => {
      const obj = { ...form };
      // 유형과 무관한 빈 필드 제거 (가독성)
      Object.keys(obj).forEach(k => {
        if (obj[k] === '' || obj[k] === null) delete obj[k];
      });
      return JSON.stringify(obj, null, 2);
    });
    const jsonCopied = ref(false);
    const copyJson = () => {
      navigator.clipboard?.writeText(sampleJson.value).then(() => {
        jsonCopied.value = true;
        setTimeout(() => { jsonCopied.value = false; }, 1500);
      });
    };

    /* ── 디바이스 모드 + 스플리터 ── */
    const previewMode = ref('default');
    const showComponentTooltip = ref(false);
    const PREVIEW_MODES = [
      { value: 'default', label: '기본',   width: 420  },
      { value: 'pc',      label: 'PC',     width: 1200 },
      { value: 'tablet',  label: '태블릿', width: 768  },
      { value: 'mobile',  label: '모바일', width: 375  },
    ];
    const previewFrameWidth = computed(() => {
      const m = PREVIEW_MODES.find(x => x.value === previewMode.value);
      return (m?.width || 420) + 'px';
    });
    const previewPaneWidth = ref(460);
    Vue.watch(previewMode, (m) => {
      const info = PREVIEW_MODES.find(x => x.value === m);
      previewPaneWidth.value = (info?.width || 420) + 40;
    });
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

    /* ── 위젯Lib미리보기용 위젯 객체 ── */
    const previewWidget = computed(() => ({
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

    /* ── Quill 에디터 (HTML 에디터 유형) ── */
    const htmlContentEl  = ref(null);
    const htmlSourceMode = ref(false);
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
      if (!htmlContentEl.value || quillInst) return;
      quillInst = new Quill(htmlContentEl.value, QUILL_OPTS);
      quillInst.root.innerHTML = form.htmlContent || '';
      quillInst.on('text-change', () => { form.htmlContent = quillInst.root.innerHTML; });
    };

    const toggleHtmlSource = async () => {
      if (!htmlSourceMode.value) {
        /* WYSIWYG → 소스 */
        if (quillInst) form.htmlContent = quillInst.root.innerHTML;
        htmlSourceMode.value = true;
      } else {
        /* 소스 → WYSIWYG */
        htmlSourceMode.value = false;
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

    watch(isHtmlEditor, async (val) => {
      if (!val) return;
      htmlSourceMode.value = false;
      quillInst = null;
      await nextTick();
      initQuill();
    });

    /* ── Yup 유효성 ── */
    const schema = window.yup.object({
      libCode:    window.yup.string().required('Lib코드를 입력하세요.'),
      name:       window.yup.string().required('라이브러리명을 입력하세요.'),
      widgetType: window.yup.string().required('위젯 유형을 선택하세요.'),
    });

    /* ── 저장 ── */
    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try { await schema.validate(form, { abortEarly: false }); }
      catch (err) { err.inner.forEach(e => { errors[e.path] = e.message; }); props.showToast('입력 내용을 확인해주세요.', 'error'); return; }

      const isNewLib = isNew.value;
      const ok = await props.showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;
      const list = props.dispDataset.widgetLibs || (props.dispDataset.widgetLibs = []);
      if (isNewLib) {
        const newId = Math.max(0, ...list.map(d => d.libId)) + 1;
        form.libId = newId;
        list.push({ ...form });
      } else {
        const idx = list.findIndex(d => d.libId == form.libId);
        if (idx >= 0) Object.assign(list[idx], { ...form });
      }
      try {
        const res = await (isNewLib ? window.adminApi.post('widget-libs', { ...form }) : window.adminApi.put(`widget-libs/${form.libId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('저장되었습니다.', 'success');
        if (props.navigate) props.navigate('dpDispWidgetLibMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    /* ── 삭제 ── */
    const remove = async () => {
      if (isNew.value) return;
      const ok = await props.showConfirm('삭제', '이 위젯 Lib를 삭제하시겠습니까?');
      if (!ok) return;
      const list = props.dispDataset.widgetLibs || [];
      const idx  = list.findIndex(d => d.libId == form.libId);
      if (idx >= 0) list.splice(idx, 1);
      try {
        const res = await window.adminApi.delete(`widget-libs/${form.libId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
      props.navigate('dpDispWidgetLibMng');
    };

    /* ── 위젯Lib 내용복사 팝업 ── */
    const libPickOpen = ref(false);
    const openLibPick = () => { libPickOpen.value = true; };
    const onLibPicked = (lib) => {
      libPickOpen.value = false;
      const preserve = { libId: form.libId, libCode: form.libCode, regDate: form.regDate };
      Object.assign(form, { ...lib, ...preserve });
      props.showToast && props.showToast(`[${lib.name}] 내용을 복사했습니다.`, 'info');
    };

    return {
      pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      libPickOpen, openLibPick, onLibPicked,
      isNew, form, errors, WIDGET_TYPES,
      isImage, isProduct, isCondProduct, isChart, isText, isInfo,
      isPopup, isFile, isFileList, isCoupon, isHtmlEditor, isEvent, isCache, isEmbed,
      displayRows, fileListItems, addFileItem, removeFileItem, updateFileItem,
      previewWidget, sampleJson, jsonCopied, copyJson, save, remove,
      previewMode, PREVIEW_MODES, previewFrameWidth, previewPaneWidth, onSplitDrag, showComponentTooltip,
      htmlContentEl, htmlSourceMode, toggleHtmlSource,
    };
  },
  template: /* html */`
<div class="card" style="padding:0;">
  <!-- 헤더 -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f0f0f0;background:#fafafa;border-radius:8px 8px 0 0;">
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="font-size:15px;font-weight:700;color:#222;">
        {{ isNew ? '위젯 Lib 신규등록' : '위젯 Lib 수정' }}
      </span>
      <span v-if="!isNew" style="font-size:11px;background:#eee;color:#666;border-radius:4px;padding:1px 7px;">#{{ String(form.libId).padStart(4,'0') }}</span>
    </div>
    <div class="form-actions" style="margin:0;gap:8px;">
      <button @click="openLibPick" class="btn btn-outline" style="font-size:12px;background:#e3f2fd;color:#1565c0;border-color:#90caf9;">📋 전시위젯Lib 내용복사</button>
      <button @click="save"   class="btn btn-primary" style="font-size:13px;">저장</button>
      <button v-if="!isNew" @click="remove" class="btn btn-outline" style="font-size:13px;color:#e8587a;border-color:#e8587a;">삭제</button>
      <button @click="$emit('close')" class="btn btn-outline" style="font-size:13px;">닫기</button>
    </div>
    <widget-lib-pick-modal v-if="libPickOpen" mode="copy"
      :widget-libs="dispDataset.widgetLibs || []"
      @close="libPickOpen=false"
      @pick="onLibPicked" />
  </div>

  <div style="display:flex;gap:0;">
    <!-- 왼쪽: 폼 -->
    <div style="flex:1;padding:20px;min-width:0;overflow-y:auto;">

      <!-- ■ 설정 -->
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
              <option value="활성">활성</option>
              <option value="비활성">비활성</option>
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
        <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin-bottom:6px;">표시경로 <span style="font-size:10px;font-weight:400;color:#aaa;">이 위젯이 노출되는 경로 (예: FRONT.모바일메인)</span></div>
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
      </div><!-- /설정 -->

      <!-- ■ 제목 -->
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
      </div><!-- /제목 -->

      <!-- ■ 내용 -->
      <div style="margin-bottom:14px;padding:14px;background:#fff8fa;border:1px solid #fce4ec;border-radius:8px;">
        <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
          <span style="display:inline-block;width:4px;height:16px;background:#e8587a;border-radius:2px;flex-shrink:0;"></span>
          내용
          <span style="margin-left:auto;display:inline-flex;align-items:center;gap:6px;flex-shrink:0;">
            <span style="font-size:11px;font-weight:600;color:#888;white-space:nowrap;">위젯유형</span>
            <select v-model="form.widgetType" class="form-control" :class="{'is-invalid':errors.widgetType}"
              style="margin:0;font-size:12px;padding:3px 8px;height:28px;border-radius:5px;min-width:160px;">
              <option v-for="t in WIDGET_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </span>
        </div>
        <div v-if="errors.widgetType" class="field-error" style="margin-bottom:8px;">{{ errors.widgetType }}</div>

        <!-- 클릭동작 -->
        <div v-if="!isHtmlEditor && !isFileList && !isEmbed" style="margin-bottom:14px;">
          <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.3px;margin-bottom:6px;">👆 클릭동작</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div class="form-group" style="margin:0;">
              <label class="form-label">클릭 동작</label>
              <select v-model="form.clickAction" class="form-control" style="margin:0;">
                <option value="none">없음</option>
                <option value="navigate">페이지 이동</option>
                <option value="event">이벤트 실행</option>
                <option value="modal">모달 열기</option>
              </select>
            </div>
            <div class="form-group" style="margin:0;">
              <label class="form-label">클릭 대상</label>
              <input v-model="form.clickTarget" class="form-control" placeholder="/products 또는 이벤트명" style="margin:0;" />
            </div>
          </div>
        </div>

        <!-- 공통 동적 행 -->
        <div v-if="displayRows.length" style="display:flex;flex-direction:column;gap:10px;">
          <div v-for="row in displayRows" :key="row.key" class="form-group" style="margin:0;">
            <label class="form-label">{{ row.label }}</label>
            <input  v-if="row.type==='input'"    v-model="form[row.key]" class="form-control" :placeholder="row.ph||''" style="margin:0;" />
            <input  v-else-if="row.type==='number'"  v-model.number="form[row.key]" type="number" class="form-control" :placeholder="row.ph||''" style="margin:0;" />
            <input  v-else-if="row.type==='color'"   v-model="form[row.key]" type="color" class="form-control" style="margin:0;height:36px;padding:2px 6px;" />
            <textarea v-else-if="row.type==='textarea'" v-model="form[row.key]" class="form-control" :placeholder="row.ph||''" rows="3" style="margin:0;"></textarea>
            <textarea v-else-if="row.type==='code'" v-model="form[row.key]" class="form-control" :placeholder="row.ph||''" rows="6" style="margin:0;font-family:monospace;font-size:12px;background:#1e1e2e;color:#cdd3de;border-color:#444;line-height:1.6;"></textarea>
            <select v-else-if="row.type==='select'" v-model="form[row.key]" class="form-control" style="margin:0;">
              <option v-for="o in row.options" :key="o.v" :value="o.v">{{ o.l }}</option>
            </select>
          </div>
        </div>

        <!-- HTML 에디터 -->
        <div v-else-if="isHtmlEditor" class="form-group" style="margin:0;">
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

        <!-- 파일목록 -->
        <div v-else-if="isFileList">
          <div v-for="(item, idx) in fileListItems" :key="idx"
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
      </div><!-- /내용 -->

    </div>

    <!-- 스플리터 -->
    <div @mousedown="onSplitDrag"
      style="width:6px;cursor:col-resize;background:#e8e8e8;flex-shrink:0;position:relative;"
      title="드래그로 폭 조절">
      <div style="position:absolute;top:50%;left:1px;transform:translateY(-50%);width:4px;height:32px;background:#bbb;border-radius:2px;"></div>
    </div>
    <!-- 오른쪽: 위젯Lib미리보기 -->
    <div :style="{ width: previewPaneWidth + 'px', flexShrink:0, padding:'20px', background:'#f8f8f8', overflowX:'auto', transition:'width .2s' }">
      <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:10px;cursor:help;position:relative;"
        @mouseenter="showComponentTooltip=true" @mouseleave="showComponentTooltip=false">
        👁 위젯Lib미리보기
        <span style="position:absolute;bottom:-28px;left:0;background:#333;color:#fff;padding:4px 8px;border-radius:4px;font-size:9px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s;z-index:1000;" :style="{opacity: showComponentTooltip ? 1 : 0}">
          &lt;disp-x04-widget /&gt;
        </span>
      </div>
      <!-- 디바이스 모드 버튼 -->
      <div style="display:flex;gap:4px;margin-bottom:10px;padding:3px;background:#eef0f3;border-radius:6px;">
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
      <!-- 디바이스 프레임 -->
      <div :style="{ width: previewFrameWidth, margin:'0 auto', background:'#fff', border:'1px solid #e4e4e4', borderRadius:'8px', padding:'12px', minHeight:'100px', transition:'width .2s' }">
        <disp-x04-widget
          :params="{ }"
          :disp-dataset="dispDataset"
          :disp-opt="{ showBadges: true }"
          :widget-item="previewWidget"
        />
      </div>
      <div style="margin-top:12px;font-size:11px;color:#aaa;line-height:1.6;">
        <div>유형: <b>{{ form.widgetType }}</b></div>
        <div v-if="form.tags">태그: {{ form.tags }}</div>
        <div v-if="!isNew">ID: #{{ String(form.libId).padStart(4,'0') }}</div>
      </div>

      <!-- 샘플 JSON -->
      <div style="margin-top:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:12px;font-weight:700;color:#555;">📋 샘플 JSON</span>
          <button @click="copyJson"
            style="font-size:10px;padding:2px 8px;border:1px solid #d0d0d0;border-radius:6px;background:#fff;cursor:pointer;color:#666;transition:all .15s;"
            :style="jsonCopied ? 'background:#e8f5e9;color:#2e7d32;border-color:#a5d6a7;' : ''">
            {{ jsonCopied ? '✓ 복사됨' : '복사' }}
          </button>
        </div>
        <pre style="background:#1e1e2e;color:#cdd9e5;border-radius:8px;padding:10px 12px;font-size:10px;line-height:1.55;overflow:auto;max-height:320px;margin:0;white-space:pre-wrap;word-break:break-all;">{{ sampleJson }}</pre>
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
