/* ShopJoy Admin - 위젯라이브러리 상세/등록 */
window.DispWidgetLibDtl = {
  name: 'DispWidgetLibDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes', 'editId'],
  emits: ['close'],
  setup(props, { emit }) {
    const { reactive, computed, ref, onMounted, watch } = Vue;
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
      { value: 'event_banner',   label: '이벤트' },
      { value: 'cache_banner',   label: '캐쉬' },
      { value: 'widget_embed',   label: '위젯' },
    ];

    /* ── 폼 초기값 ── */
    const makeForm = () => ({
      libId: null, name: '', widgetType: 'image_banner', desc: '', tags: '', status: '활성',
      usedPaths: [],
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
    onMounted(() => {
      if (!isNew.value) {
        const src = (props.adminData.widgetLibs || []).find(d => d.libId == props.editId);
        if (src) Object.assign(form, src);
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
    const isEvent       = computed(() => form.widgetType === 'event_banner');
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

    /* ── 미리보기용 위젯 객체 ── */
    const previewWidget = computed(() => ({
      ...form,
      dispId: form.libId || 0,
      name: form.name || '미리보기',
      area: 'PREVIEW',
      status: '활성',
      condition: '항상 표시',
      authRequired: false,
      authGrade: '',
    }));

    /* ── Yup 유효성 ── */
    const schema = window.yup.object({
      name:       window.yup.string().required('라이브러리명을 입력하세요.'),
      widgetType: window.yup.string().required('위젯 유형을 선택하세요.'),
    });

    /* ── 저장 ── */
    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try { await schema.validate(form, { abortEarly: false }); }
      catch (err) { err.inner.forEach(e => { errors[e.path] = e.message; }); props.showToast('입력 내용을 확인해주세요.', 'error'); return; }

      await window.adminApiCall({
        method: isNew.value ? 'post' : 'put',
        path: isNew.value ? 'widget-libs' : `widget-libs/${form.libId}`,
        data: { ...form },
        confirmTitle: '저장',
        confirmMsg: '저장하시겠습니까?',
        showConfirm: props.showConfirm,
        showToast:   props.showToast,
        setApiRes:   props.setApiRes,
        successMsg:  '저장되었습니다.',
        onLocal: () => {
          const list = props.adminData.widgetLibs || (props.adminData.widgetLibs = []);
          if (isNew.value) {
            const newId = Math.max(0, ...list.map(d => d.libId)) + 1;
            form.libId = newId;
            list.push({ ...form });
          } else {
            const idx = list.findIndex(d => d.libId == form.libId);
            if (idx >= 0) Object.assign(list[idx], { ...form });
          }
        },
        navigate:   props.navigate,
        navigateTo: 'ecDispWidgetLibMng',
      });
    };

    /* ── 삭제 ── */
    const remove = async () => {
      if (isNew.value) return;
      await window.adminApiCall({
        method: 'delete',
        path: `widget-libs/${form.libId}`,
        confirmTitle: '삭제',
        confirmMsg: '이 위젯 리소스를 삭제하시겠습니까?',
        showConfirm: props.showConfirm,
        showToast:   props.showToast,
        setApiRes:   props.setApiRes,
        successMsg:  '삭제되었습니다.',
        onLocal: () => {
          const list = props.adminData.widgetLibs || [];
          const idx  = list.findIndex(d => d.libId == form.libId);
          if (idx >= 0) list.splice(idx, 1);
        },
      });
      props.navigate('ecDispWidgetLibMng');
    };

    return {
      isNew, form, errors, WIDGET_TYPES,
      isImage, isProduct, isCondProduct, isChart, isText, isInfo,
      isPopup, isFile, isFileList, isCoupon, isHtmlEditor, isEvent, isCache, isEmbed,
      displayRows, fileListItems, addFileItem, removeFileItem, updateFileItem,
      previewWidget, sampleJson, jsonCopied, copyJson, save, remove,
    };
  },
  template: /* html */`
<div class="card" style="padding:0;">
  <!-- 헤더 -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f0f0f0;background:#fafafa;border-radius:8px 8px 0 0;">
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="font-size:15px;font-weight:700;color:#222;">
        {{ isNew ? '위젯 리소스 신규등록' : '위젯 리소스 수정' }}
      </span>
      <span v-if="!isNew" style="font-size:11px;background:#eee;color:#666;border-radius:4px;padding:1px 7px;">#{{ String(form.libId).padStart(4,'0') }}</span>
    </div>
    <div class="form-actions" style="margin:0;gap:8px;">
      <button @click="save"   class="btn btn-primary" style="font-size:13px;">저장</button>
      <button v-if="!isNew" @click="remove" class="btn btn-outline" style="font-size:13px;color:#e8587a;border-color:#e8587a;">삭제</button>
      <button @click="$emit('close')" class="btn btn-outline" style="font-size:13px;">닫기</button>
    </div>
  </div>

  <div style="display:flex;gap:0;">
    <!-- 왼쪽: 폼 -->
    <div style="flex:1;padding:20px;border-right:1px solid #f0f0f0;">

      <!-- 기본 정보 -->
      <div style="background:#f8f8f8;border-radius:8px;padding:14px 16px;margin-bottom:16px;">
        <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #eee;">기본 정보</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group" style="margin:0;grid-column:1/-1;">
            <label class="form-label">라이브러리명 <span style="color:#e8587a;">*</span></label>
            <input v-model="form.name" class="form-control" :class="{'is-invalid':errors.name}" placeholder="위젯 리소스 이름" style="margin:0;" />
            <div v-if="errors.name" class="field-error">{{ errors.name }}</div>
          </div>
          <div class="form-group" style="margin:0;">
            <label class="form-label">위젯 유형 <span style="color:#e8587a;">*</span></label>
            <select v-model="form.widgetType" class="form-control" :class="{'is-invalid':errors.widgetType}" style="margin:0;">
              <option v-for="t in WIDGET_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
            <div v-if="errors.widgetType" class="field-error">{{ errors.widgetType }}</div>
          </div>
          <div class="form-group" style="margin:0;">
            <label class="form-label">상태</label>
            <select v-model="form.status" class="form-control" style="margin:0;">
              <option value="활성">활성</option>
              <option value="비활성">비활성</option>
            </select>
          </div>
          <div class="form-group" style="margin:0;grid-column:1/-1;">
            <label class="form-label">설명</label>
            <input v-model="form.desc" class="form-control" placeholder="위젯 용도·설명 메모" style="margin:0;" />
          </div>
          <div class="form-group" style="margin:0;grid-column:1/-1;">
            <label class="form-label">태그 <span style="font-size:10px;color:#aaa;">(쉼표 구분)</span></label>
            <input v-model="form.tags" class="form-control" placeholder="봄,배너,시즌" style="margin:0;" />
          </div>
        </div>
      </div>

      <!-- 사용위치경로 -->
      <div style="background:#f8f8f8;border-radius:8px;padding:14px 16px;margin-bottom:16px;">
        <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #eee;">
          사용위치경로 <span style="font-size:10px;font-weight:400;color:#aaa;">이 위젯이 사용되는 경로 (예: 홈 > 메인배너)</span>
        </div>
        <div v-for="(path, pi) in form.usedPaths" :key="pi"
          style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
          <input :value="path" @input="form.usedPaths[pi]=$event.target.value"
            class="form-control" placeholder="홈 > 메인배너" style="margin:0;flex:1;font-size:12px;" />
          <button @click="form.usedPaths.splice(pi,1)"
            style="padding:4px 8px;border:1px solid #fca5a5;background:#fff0f0;color:#dc2626;border-radius:4px;cursor:pointer;font-size:12px;flex-shrink:0;">✕</button>
        </div>
        <button @click="form.usedPaths.push('')"
          style="padding:4px 12px;border:1px solid #d1d5db;background:#fff;color:#555;border-radius:4px;cursor:pointer;font-size:12px;margin-top:2px;">+ 경로 추가</button>
      </div>

      <!-- 클릭 액션 (html_editor·file_list·embed 제외) -->
      <div v-if="!isHtmlEditor && !isFileList && !isEmbed"
        style="background:#f8f8f8;border-radius:8px;padding:14px 16px;margin-bottom:16px;">
        <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #eee;">클릭 액션</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
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

      <!-- 위젯 유형별 동적 입력 -->
      <div style="background:#f8f8f8;border-radius:8px;padding:14px 16px;margin-bottom:16px;">
        <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #eee;">위젯 내용</div>

        <!-- 공통 동적 행 -->
        <div v-if="displayRows.length" style="display:flex;flex-direction:column;gap:10px;">
          <div v-for="row in displayRows" :key="row.key" class="form-group" style="margin:0;">
            <label class="form-label">{{ row.label }}</label>
            <input  v-if="row.type==='input'"    v-model="form[row.key]" class="form-control" :placeholder="row.ph||''" style="margin:0;" />
            <input  v-else-if="row.type==='number'"  v-model.number="form[row.key]" type="number" class="form-control" :placeholder="row.ph||''" style="margin:0;" />
            <input  v-else-if="row.type==='color'"   v-model="form[row.key]" type="color" class="form-control" style="margin:0;height:36px;padding:2px 6px;" />
            <textarea v-else-if="row.type==='textarea'" v-model="form[row.key]" class="form-control" :placeholder="row.ph||''" rows="3" style="margin:0;"></textarea>
            <select v-else-if="row.type==='select'" v-model="form[row.key]" class="form-control" style="margin:0;">
              <option v-for="o in row.options" :key="o.v" :value="o.v">{{ o.l }}</option>
            </select>
          </div>
        </div>

        <!-- HTML 에디터 -->
        <div v-else-if="isHtmlEditor" class="form-group" style="margin:0;">
          <label class="form-label">HTML 내용</label>
          <textarea v-model="form.htmlContent" class="form-control" rows="8" placeholder="<p>HTML 내용을 입력하세요</p>" style="margin:0;font-family:monospace;font-size:12px;"></textarea>
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
      </div>
    </div>

    <!-- 오른쪽: 미리보기 -->
    <div style="width:280px;flex-shrink:0;padding:20px;background:#f8f8f8;">
      <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:12px;">👁 미리보기</div>
      <div style="background:#fff;border:1px solid #e4e4e4;border-radius:8px;padding:12px;min-height:100px;">
        <disp-widget
          :widget="previewWidget"
          :is-logged-in="false"
          user-grade=""
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
</div>
`
};
