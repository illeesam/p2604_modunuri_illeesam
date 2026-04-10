/* ShopJoy Admin - 전시관리 상세/등록 */
window.DispDtl = {
  name: 'DispDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, ref, onMounted, watch, nextTick } = Vue;
    const isNew = computed(() => !props.editId);
    const tab = ref('info');

    /* ── 기본정보 (위젯 공통) ── */
    const form = reactive({
      dispId: null, area: 'HOME_BANNER', name: '', status: '활성',
      htmlDesc: '',
      dispStartDate: '', dispStartTime: '00:00',
      dispEndDate:   '', dispEndTime:   '23:59',
    });

    /* ── 행별 독립 데이터 팩토리 ── */
    const makeRowData = (overrides = {}) => ({
      widgetType: 'image_banner',
      clickAction: 'none', clickTarget: '',
      condition: '항상 표시', authRequired: false, authGrade: '',
      sortOrder: 1,
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
      eventId: '',
      cacheDesc: '', cacheAmount: 0,
      embedCode: '',
      ...overrides,
    });

    const rows = reactive([
      makeRowData({ sortOrder: 1 }),
      makeRowData({ sortOrder: 2 }),
      makeRowData({ sortOrder: 3 }),
      makeRowData({ sortOrder: 4 }),
      makeRowData({ sortOrder: 5 }),
    ]);

    const TAB_LABELS = [
      { key: 'info', label: '기본정보' },
      { key: 'tab1', label: '1행' },
      { key: 'tab2', label: '2행' },
      { key: 'tab3', label: '3행' },
      { key: 'tab4', label: '4행' },
      { key: 'tab5', label: '5행' },
    ];
    const TAB_ROW_MAP  = { tab1: 0, tab2: 1, tab3: 2, tab4: 3, tab5: 4 };
    const ROW_TAB_KEYS = ['tab1', 'tab2', 'tab3', 'tab4', 'tab5'];

    const activeRowIdx = computed(() => TAB_ROW_MAP[tab.value] ?? null);
    const activeRow    = computed(() => activeRowIdx.value !== null ? rows[activeRowIdx.value] : null);

    /* ── 행 위아래 이동 ── */
    const moveRow = (dir) => {
      const idx = activeRowIdx.value;
      if (idx === null) return;
      const target = idx + dir;
      if (target < 0 || target >= rows.length) return;
      const a = { ...rows[idx] };
      const b = { ...rows[target] };
      Object.assign(rows[idx], b);
      Object.assign(rows[target], a);
      tab.value = ROW_TAB_KEYS[target];
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
      { value: 'event_banner',  label: '이벤트' },
      { value: 'cache_banner',  label: '캐쉬' },
      { value: 'widget_embed',  label: '위젯' },
    ];

    const AREAS = [
      'HOME_BANNER', 'HOME_PRODUCT', 'HOME_CHART', 'HOME_EVENT',
      'SIDEBAR_TOP', 'SIDEBAR_MID', 'SIDEBAR_BOT',
      'PRODUCT_TOP', 'PRODUCT_BTM', 'MY_PAGE', 'FOOTER',
    ];

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
    const isEventBanner = computed(() => activeRow.value?.widgetType === 'event_banner');
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
      return (props.adminData.events || []).find(e => String(e.eventId) === String(eid)) || null;
    });

    /* ── Quill 에디터 ── */
    const htmlDescEl    = ref(null);
    const htmlContentEl = ref(null);
    let quillDesc    = null;
    let quillContent = null;

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
        const d = props.adminData.displays.find(x => x.dispId === props.editId);
        if (d) {
          form.dispId        = d.dispId;
          form.area          = d.area          || 'HOME_BANNER';
          form.name          = d.name          || '';
          form.status        = d.status        || '활성';
          form.htmlDesc      = d.htmlDesc      || '';
          form.dispStartDate = d.dispStartDate || '';
          form.dispStartTime = d.dispStartTime || '00:00';
          form.dispEndDate   = d.dispEndDate   || '';
          form.dispEndTime   = d.dispEndTime   || '23:59';
          if (d.rows) {
            d.rows.forEach((r, i) => { if (rows[i]) Object.assign(rows[i], r); });
          } else {
            Object.assign(rows[0], { ...d });
          }
        }
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
      if (!form.name || !form.area) { props.showToast('필수 항목을 입력해주세요.', 'error'); return; }
      await window.adminApiCall({
        method: isNew.value ? 'post' : 'put',
        path: `disps/${form.dispId}`,
        data: { ...form, rows: rows.map(r => ({ ...r })) },
        confirmTitle: isNew.value ? '등록' : '저장',
        confirmMsg:   isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?',
        showConfirm: props.showConfirm,
        showToast:   props.showToast,
        setApiRes:   props.setApiRes,
        successMsg:  isNew.value ? '등록되었습니다.' : '저장되었습니다.',
        onLocal: () => {
          const payload = { ...form, rows: rows.map(r => ({ ...r })), sortOrder: Number(rows[0].sortOrder) };
          if (isNew.value) {
            payload.dispId  = props.adminData.nextId(props.adminData.displays, 'dispId');
            payload.regDate = new Date().toISOString().slice(0, 10);
            props.adminData.displays.push(payload);
          } else {
            const idx = props.adminData.displays.findIndex(x => x.dispId === props.editId);
            if (idx !== -1) Object.assign(props.adminData.displays[idx], payload);
          }
        },
        navigate:   props.navigate,
        navigateTo: 'ecDispMng',
      });
    };

    /* ── 미리보기 모달 ── */
    const preview = reactive({ show: false, tabLabel: '' });
    const openPreview = (tabKey, tabLabel) => { preview.tabLabel = tabLabel; preview.show = true; };
    const closePreview = () => { preview.show = false; };
    const previewWidget = computed(() => ({
      ...form, ...(activeRow.value ? { ...activeRow.value } : {}), status: '활성',
    }));

    return {
      isNew, tab, form, rows, WIDGET_TYPES, AREAS, TAB_LABELS, TAB_ROW_MAP,
      activeRowIdx, activeRow, moveRow,
      isChart, isProduct, isImage, isText, isInfo, isPopup, isFile, isFileList,
      isCoupon, isHtmlEditor, isEventBanner, isCacheBanner, isWidgetEmbed, isCondProduct,
      displayRows, relatedEvent, save,
      fileListItems, addFileItem, removeFileItem, updateFileItem,
      htmlDescEl, htmlContentEl,
      preview, openPreview, closePreview, previewWidget,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '전시 위젯 등록' : (viewMode ? '전시 위젯 상세' : '전시 위젯 수정') }}</div>
  <div class="card">
    <div style="display:flex;gap:0;min-height:400px;">

      <!-- 좌측 탭 메뉴 -->
      <div style="width:116px;min-width:116px;border-right:1px solid #f0f0f0;padding-top:4px;">
        <div v-for="(t, tIdx) in TAB_LABELS" :key="t.key"
          style="display:flex;align-items:stretch;border-right:2px solid transparent;transition:all .15s;"
          :style="tab===t.key ? 'border-right-color:#e8587a;background:#fff8fa;' : ''">
          <button @click="tab=t.key"
            style="flex:1;text-align:center;padding:11px 4px;font-size:12px;font-weight:600;border:none;background:none;cursor:pointer;line-height:1.3;"
            :style="tab===t.key ? 'color:#e8587a;' : 'color:#999;'">
            {{ t.label }}
          </button>
          <div v-if="t.key !== 'info' && tab===t.key"
            style="display:flex;flex-direction:column;justify-content:center;gap:1px;padding-right:3px;">
            <button @click="moveRow(-1)" :disabled="activeRowIdx===0" title="위로"
              style="display:block;font-size:9px;border:1px solid #e0e0e0;border-radius:3px;background:#fff;cursor:pointer;padding:1px 4px;line-height:1.2;color:#888;"
              :style="activeRowIdx===0?'opacity:0.3;cursor:default;':''">▲</button>
            <button @click="moveRow(1)" :disabled="activeRowIdx===4" title="아래로"
              style="display:block;font-size:9px;border:1px solid #e0e0e0;border-radius:3px;background:#fff;cursor:pointer;padding:1px 4px;line-height:1.2;color:#888;"
              :style="activeRowIdx===4?'opacity:0.3;cursor:default;':''">▼</button>
          </div>
          <div v-else-if="t.key !== 'info'" style="width:22px;"></div>
          <button @click.stop="openPreview(t.key, t.label)" title="미리보기"
            style="padding:0 6px 0 2px;font-size:12px;border:none;background:none;cursor:pointer;opacity:0.4;transition:opacity .15s;"
            :style="tab===t.key ? 'opacity:0.65;' : ''"
            @mouseenter="$event.currentTarget.style.opacity='1'"
            @mouseleave="$event.currentTarget.style.opacity=tab===t.key?'0.65':'0.4'">👁</button>
        </div>
      </div>

      <!-- 우측 콘텐츠 -->
      <div style="flex:1;padding-left:20px;padding-top:4px;overflow:hidden;">

        <!-- ── 기본정보 ── -->
        <div v-show="tab==='info'">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">위젯명 <span v-if="!viewMode" class="req">*</span></label>
              <input class="form-control" v-model="form.name" placeholder="위젯 이름" :readonly="viewMode" />
            </div>
            <div class="form-group">
              <label class="form-label">화면 영역 <span v-if="!viewMode" class="req">*</span></label>
              <select class="form-control" v-model="form.area" :disabled="viewMode">
                <option v-for="a in AREAS" :key="a" :value="a">{{ a }}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">상태</label>
            <select class="form-control" style="max-width:200px;" v-model="form.status" :disabled="viewMode">
              <option>활성</option><option>비활성</option>
            </select>
          </div>

          <!-- 전시 기간 -->
          <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin:16px 0 8px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">
            📅 전시 기간
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
            <input type="date" class="form-control" v-model="form.dispStartDate" style="width:150px;margin:0;" :readonly="viewMode" />
            <input type="time" class="form-control" v-model="form.dispStartTime" style="width:110px;margin:0;" :readonly="viewMode" />
            <span style="color:#aaa;font-size:13px;padding:0 4px;">~</span>
            <input type="date" class="form-control" v-model="form.dispEndDate" style="width:150px;margin:0;" :readonly="viewMode" />
            <input type="time" class="form-control" v-model="form.dispEndTime" style="width:110px;margin:0;" :readonly="viewMode" />
          </div>
          <div v-if="form.dispStartDate || form.dispEndDate"
            style="font-size:12px;color:#555;background:#f8faff;border:1px solid #e0e8f8;border-radius:6px;padding:6px 12px;margin-bottom:16px;display:inline-flex;align-items:center;gap:6px;">
            <span>{{ form.dispStartDate || '?' }} {{ form.dispStartTime }}</span>
            <span style="color:#aaa;">~</span>
            <span>{{ form.dispEndDate || '?' }} {{ form.dispEndTime }}</span>
          </div>

          <!-- HTML 설명 (Quill) -->
          <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin:16px 0 8px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">
            📝 HTML 설명
          </div>
          <div v-if="viewMode"
            style="padding:12px 14px;background:#f9f9f9;border:1px solid #e8e8e8;border-radius:6px;font-size:13px;line-height:1.7;min-height:80px;margin-bottom:16px;">
            <span v-if="form.htmlDesc" v-html="form.htmlDesc"></span>
            <span v-else style="color:#bbb;">내용 없음</span>
          </div>
          <div v-else ref="htmlDescEl" style="margin-bottom:16px;"></div>

          <!-- 행 구성 요약 -->
          <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin-top:8px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">
            📋 행 구성 요약
          </div>
          <table class="admin-table" style="font-size:12px;">
            <thead><tr><th style="width:40px;">행</th><th>위젯 유형</th><th>노출 조건</th><th style="width:50px;">인증</th><th style="width:50px;">순서</th></tr></thead>
            <tbody>
              <tr v-for="(r, i) in rows" :key="i" style="cursor:pointer;" @click="tab='tab'+(i+1)">
                <td style="font-weight:700;color:#e8587a;">{{ i+1 }}행</td>
                <td>{{ WIDGET_TYPES.find(w=>w.value===r.widgetType)?.label || r.widgetType }}</td>
                <td>{{ r.condition }}</td>
                <td style="text-align:center;">
                  <span :class="r.authRequired ? 'badge badge-xs badge-orange' : 'badge badge-xs badge-gray'">
                    {{ r.authRequired ? '필요' : '불필요' }}
                  </span>
                </td>
                <td style="text-align:center;">{{ r.sortOrder }}</td>
              </tr>
            </tbody>
          </table>

          <div class="form-actions">
            <template v-if="viewMode">
              <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
              <button class="btn btn-secondary" @click="navigate('ecDispMng')">닫기</button>
            </template>
            <template v-else>
              <button class="btn btn-primary" @click="save">저장</button>
              <button class="btn btn-secondary" @click="navigate('ecDispMng')">취소</button>
            </template>
          </div>
        </div>

        <!-- ── 1~5행 콘텐츠 ── -->
        <div v-if="activeRow">

          <!-- § 위젯 설정 -->
          <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">
            📐 위젯 설정
          </div>
          <div class="form-row" style="margin-bottom:16px;">
            <div class="form-group">
              <label class="form-label">위젯 유형</label>
              <select class="form-control" v-model="activeRow.widgetType" :disabled="viewMode">
                <option v-for="w in WIDGET_TYPES" :key="w.value" :value="w.value">{{ w.label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">노출 순서</label>
              <input class="form-control" type="number" v-model.number="activeRow.sortOrder" min="1" :readonly="viewMode" />
            </div>
          </div>

          <!-- § 표현 설정 -->
          <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">
            🎨 표현 설정
          </div>

          <!-- HTML 에디터 (Quill) -->
          <div v-if="isHtmlEditor" style="margin-bottom:20px;">
            <div v-if="viewMode"
              style="padding:12px 14px;background:#f9f9f9;border:1px solid #e8e8e8;border-radius:6px;font-size:13px;line-height:1.7;min-height:80px;">
              <span v-if="activeRow.htmlContent" v-html="activeRow.htmlContent"></span>
              <span v-else style="color:#bbb;">내용 없음</span>
            </div>
            <div v-else ref="htmlContentEl"></div>
          </div>

          <!-- 파일목록 -->
          <div v-else-if="isFileList" style="margin-bottom:20px;">
            <!-- 보기 모드 -->
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
            <!-- 편집 모드 -->
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

          <!-- § 클릭 동작 -->
          <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">
            👆 클릭 동작
          </div>
          <table class="admin-table" style="margin-bottom:20px;">
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

          <!-- § 조건 / 인증 -->
          <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">
            🔐 조건 / 인증
          </div>
          <table class="admin-table" style="margin-bottom:16px;">
            <thead><tr><th style="width:180px;">항목</th><th>값</th></tr></thead>
            <tbody>
              <tr>
                <td style="font-weight:500;color:#555;vertical-align:middle;">노출 조건</td>
                <td style="padding:6px 8px;">
                  <select class="form-control" v-model="activeRow.condition" style="margin:0;max-width:260px;" :disabled="viewMode">
                    <option>항상 표시</option><option>로그인 필요</option>
                    <option>비로그인</option><option>로그인+VIP</option><option>로그인+우수</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td style="font-weight:500;color:#555;vertical-align:middle;">인증 필요</td>
                <td style="padding:6px 8px;">
                  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                    <input type="checkbox" v-model="activeRow.authRequired" :disabled="viewMode" />
                    <span style="font-size:13px;">인증 필요</span>
                  </label>
                </td>
              </tr>
              <tr v-if="activeRow.authRequired">
                <td style="font-weight:500;color:#555;vertical-align:middle;">인증 등급 제한</td>
                <td style="padding:6px 8px;">
                  <select class="form-control" v-model="activeRow.authGrade" style="margin:0;max-width:200px;" :disabled="viewMode">
                    <option value="">등급 제한 없음</option>
                    <option>VIP</option><option>우수</option><option>일반</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td style="font-weight:500;color:#555;">설정 요약</td>
                <td style="padding:6px 8px;font-size:13px;color:#666;">
                  노출: <b>{{ activeRow.condition }}</b> &nbsp;·&nbsp;
                  인증: <b>{{ activeRow.authRequired ? '필요' : '불필요' }}</b>
                  <span v-if="activeRow.authRequired && activeRow.authGrade"> ({{ activeRow.authGrade }} 이상)</span>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="form-actions">
            <template v-if="viewMode">
              <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
              <button class="btn btn-secondary" @click="navigate('ecDispMng')">닫기</button>
            </template>
            <template v-else>
              <button class="btn btn-primary" @click="save">저장</button>
              <button class="btn btn-secondary" @click="navigate('ecDispMng')">취소</button>
            </template>
          </div>
        </div>

      </div><!-- /우측 콘텐츠 -->
    </div><!-- /flex -->
  </div>

  <!-- 미리보기 모달 -->
  <disp-preview-modal
    :show="preview.show"
    mode="single"
    :tab-label="preview.tabLabel"
    :area="form.area"
    :widgets="adminData.displays"
    :widget="previewWidget"
    @close="closePreview"
  />
</div>
`,
};
