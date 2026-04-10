/* ShopJoy Admin - 전시관리 상세/등록 */
window.DispDtl = {
  name: 'DispDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, ref, onMounted } = Vue;
    const isNew = computed(() => !props.editId);
    const tab = ref('info');

    const form = reactive({
      area: 'HOME_BANNER', name: '', widgetType: 'image_banner',
      clickAction: 'none', clickTarget: '',
      condition: '항상 표시', authRequired: false, authGrade: '',
      sortOrder: 1, status: '활성',
      /* 이미지 배너 / 팝업 */
      imageUrl: '', linkUrl: '', altText: '',
      /* 상품 슬라이더 / 상품 */
      productIds: '',
      /* 차트 */
      chartTitle: '', chartType: 'bar', chartLabels: '', chartValues: '',
      /* 텍스트 배너 */
      textContent: '', bgColor: '#ffffff', textColor: '#222222',
      /* 정보 카드 */
      infoTitle: '', infoBody: '',
      /* 팝업 */
      popupWidth: 600, popupHeight: 400,
      /* 파일 */
      fileUrl: '', fileLabel: '',
      /* 쿠폰 */
      couponCode: '', couponDesc: '',
      /* HTML 에디터 */
      htmlContent: '',
      /* 이벤트 */
      eventId: '',
      /* 캐쉬 */
      cacheDesc: '', cacheAmount: 0,
      /* 위젯 임베드 */
      embedCode: '',
    });

    const WIDGET_TYPES = [
      { value: 'image_banner',  label: '이미지 배너' },
      { value: 'product_slider',label: '상품 슬라이더' },
      { value: 'product',       label: '상품' },
      { value: 'chart_bar',     label: '차트 (Bar)' },
      { value: 'chart_line',    label: '차트 (Line)' },
      { value: 'chart_pie',     label: '차트 (Pie)' },
      { value: 'text_banner',   label: '텍스트 배너' },
      { value: 'info_card',     label: '정보 카드' },
      { value: 'popup',         label: '팝업' },
      { value: 'file',          label: '파일' },
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

    const isChart        = computed(() => form.widgetType.startsWith('chart_'));
    const isProduct      = computed(() => form.widgetType === 'product_slider' || form.widgetType === 'product');
    const isImage        = computed(() => form.widgetType === 'image_banner');
    const isText         = computed(() => form.widgetType === 'text_banner');
    const isInfo         = computed(() => form.widgetType === 'info_card');
    const isPopup        = computed(() => form.widgetType === 'popup');
    const isFile         = computed(() => form.widgetType === 'file');
    const isCoupon       = computed(() => form.widgetType === 'coupon');
    const isHtmlEditor   = computed(() => form.widgetType === 'html_editor');
    const isEventBanner  = computed(() => form.widgetType === 'event_banner');
    const isCacheBanner  = computed(() => form.widgetType === 'cache_banner');
    const isWidgetEmbed  = computed(() => form.widgetType === 'widget_embed');

    /* 표현설정 목록 행 정의 — 유형별로 다른 rows를 computed로 생성 */
    const displayRows = computed(() => {
      if (isImage.value) return [
        { key: 'imageUrl',  label: '이미지 URL',  type: 'input',  ph: 'https://...' },
        { key: 'altText',   label: 'Alt 텍스트',  type: 'input',  ph: '' },
        { key: 'linkUrl',   label: '링크 URL',    type: 'input',  ph: 'https://...' },
      ];
      if (isProduct.value) return [
        { key: 'productIds', label: '상품 ID 목록', type: 'input', ph: '1, 2, 3, ...' },
      ];
      if (isChart.value) return [
        { key: 'chartTitle',  label: '차트 제목',         type: 'input',  ph: '' },
        { key: 'chartType',   label: '차트 유형',         type: 'select', options: [{v:'bar',l:'Bar'},{v:'line',l:'Line'},{v:'pie',l:'Pie'}] },
        { key: 'chartLabels', label: '라벨 (쉼표 구분)',  type: 'input',  ph: '1월, 2월, 3월' },
        { key: 'chartValues', label: '값 (쉼표 구분)',    type: 'input',  ph: '100, 200, 150' },
      ];
      if (isText.value) return [
        { key: 'textContent', label: '텍스트 내용', type: 'textarea', ph: '' },
        { key: 'bgColor',     label: '배경색',      type: 'color',   ph: '' },
        { key: 'textColor',   label: '글자색',      type: 'color',   ph: '' },
      ];
      if (isInfo.value) return [
        { key: 'infoTitle', label: '카드 제목', type: 'input',    ph: '' },
        { key: 'infoBody',  label: '카드 내용', type: 'textarea', ph: '' },
      ];
      if (isPopup.value) return [
        { key: 'popupWidth',  label: '팝업 너비 (px)', type: 'number', ph: '' },
        { key: 'popupHeight', label: '팝업 높이 (px)', type: 'number', ph: '' },
        { key: 'imageUrl',    label: '팝업 이미지 URL', type: 'input',  ph: 'https://...' },
        { key: 'linkUrl',     label: '링크 URL',        type: 'input',  ph: '' },
      ];
      if (isFile.value) return [
        { key: 'fileUrl',   label: '파일 URL',    type: 'input', ph: 'https://... 또는 /files/...' },
        { key: 'fileLabel', label: '표시 레이블', type: 'input', ph: '다운로드' },
      ];
      if (isCoupon.value) return [
        { key: 'couponCode', label: '쿠폰 코드', type: 'input', ph: 'COUPON_CODE' },
        { key: 'couponDesc', label: '쿠폰 설명', type: 'input', ph: '쿠폰 안내 문구' },
      ];
      if (isHtmlEditor.value) return [
        { key: 'htmlContent', label: 'HTML 내용', type: 'html', ph: '<div>...</div>' },
      ];
      if (isEventBanner.value) return [
        { key: 'eventId', label: '이벤트 ID', type: 'event', ph: '' },
      ];
      if (isCacheBanner.value) return [
        { key: 'cacheDesc',   label: '안내 문구',       type: 'input',  ph: '지금 충전하면 10% 보너스!' },
        { key: 'cacheAmount', label: '기본 충전 금액(원)', type: 'number', ph: '' },
      ];
      if (isWidgetEmbed.value) return [
        { key: 'embedCode', label: '임베드 코드', type: 'code', ph: '<iframe ...></iframe>' },
      ];
      return [];
    });

    /* 관련 이벤트 조회 */
    const relatedEvent = computed(() => {
      if (!form.eventId) return null;
      return (props.adminData.events || []).find(e => String(e.eventId) === String(form.eventId)) || null;
    });

    onMounted(() => {
      if (!isNew.value) {
        const d = props.adminData.displays.find(x => x.dispId === props.editId);
        if (d) Object.assign(form, { ...d });
      }
    });

    const save = async () => {
      if (!form.name || !form.area) { props.showToast('필수 항목을 입력해주세요.', 'error'); return; }
      await window.adminApiCall({
        method: isNew.value ? 'post' : 'put',
        path: `disps/${form.dispId}`,
        data: { ...form },
        confirmTitle: isNew.value ? '등록' : '저장',
        confirmMsg: isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?',
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: isNew.value ? '등록되었습니다.' : '저장되었습니다.',
        onLocal: () => {
          if (isNew.value) {
            props.adminData.displays.push({
              ...form,
              dispId: props.adminData.nextId(props.adminData.displays, 'dispId'),
              sortOrder: Number(form.sortOrder),
              regDate: new Date().toISOString().slice(0, 10),
            });
          } else {
            const idx = props.adminData.displays.findIndex(x => x.dispId === props.editId);
            if (idx !== -1) Object.assign(props.adminData.displays[idx], { ...form, sortOrder: Number(form.sortOrder) });
          }
        },
        navigate: props.navigate,
        navigateTo: 'ecDispMng',
      });
    };

    return { isNew, tab, form, WIDGET_TYPES, AREAS, isChart, isProduct, isImage, isText, isInfo, isPopup, isFile, isCoupon, isHtmlEditor, isEventBanner, isCacheBanner, isWidgetEmbed, displayRows, relatedEvent, save };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '전시 위젯 등록' : (viewMode ? '전시 위젯 상세' : '전시 위젯 수정') }}</div>
  <div class="card">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:tab==='info'}"    @click="tab='info'">기본정보</button>
      <button class="tab-btn" :class="{active:tab==='display'}" @click="tab='display'">표현 설정</button>
      <button class="tab-btn" :class="{active:tab==='action'}"  @click="tab='action'">클릭 동작</button>
      <button class="tab-btn" :class="{active:tab==='auth'}"    @click="tab='auth'">조건 / 인증</button>
    </div>

    <!-- 기본정보 -->
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
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">위젯 유형</label>
          <select class="form-control" v-model="form.widgetType" :disabled="viewMode">
            <option v-for="w in WIDGET_TYPES" :key="w.value" :value="w.value">{{ w.label }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">노출 순서</label>
          <input class="form-control" type="number" v-model.number="form.sortOrder" min="1" :readonly="viewMode" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" style="max-width:200px;" v-model="form.status" :disabled="viewMode">
          <option>활성</option><option>비활성</option>
        </select>
      </div>
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

    <!-- 표현 설정 — 목록 형식 -->
    <div v-show="tab==='display'">
      <div v-if="displayRows.length === 0" style="color:#aaa;text-align:center;padding:40px;font-size:13px;">
        기본정보 탭에서 위젯 유형을 선택하면 표현 설정 항목이 표시됩니다.
      </div>

      <table v-else class="admin-table" style="margin-bottom:16px;">
        <thead>
          <tr>
            <th style="width:180px;">항목</th>
            <th>값</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in displayRows" :key="row.key">
            <td style="font-weight:500;color:#555;vertical-align:middle;">{{ row.label }}</td>
            <td style="padding:6px 8px;">

              <!-- input -->
              <input v-if="row.type==='input'" class="form-control" v-model="form[row.key]" :placeholder="row.ph" style="margin:0;" :readonly="viewMode" />

              <!-- number -->
              <input v-else-if="row.type==='number'" class="form-control" type="number" v-model.number="form[row.key]" style="margin:0;max-width:200px;" :readonly="viewMode" />

              <!-- select -->
              <select v-else-if="row.type==='select'" class="form-control" v-model="form[row.key]" style="margin:0;max-width:200px;" :disabled="viewMode">
                <option v-for="o in row.options" :key="o.v" :value="o.v">{{ o.l }}</option>
              </select>

              <!-- textarea -->
              <textarea v-else-if="row.type==='textarea'" class="form-control" v-model="form[row.key]" rows="3" style="margin:0;" :readonly="viewMode"></textarea>

              <!-- color -->
              <div v-else-if="row.type==='color'" style="display:flex;gap:8px;align-items:center;">
                <input type="color" v-model="form[row.key]" style="width:40px;height:34px;border:1px solid #ddd;border-radius:4px;cursor:pointer;padding:2px;" :disabled="viewMode" />
                <input class="form-control" v-model="form[row.key]" style="margin:0;max-width:140px;" :readonly="viewMode" />
                <span style="display:inline-block;width:60px;height:28px;border-radius:4px;border:1px solid #e8e8e8;" :style="{background:form[row.key]}"></span>
              </div>

              <!-- html editor -->
              <div v-else-if="row.type==='html'">
                <textarea class="form-control" v-model="form[row.key]" rows="6" style="margin:0;font-family:monospace;font-size:12px;" :placeholder="row.ph" :readonly="viewMode"></textarea>
                <div v-if="form[row.key]" style="margin-top:8px;padding:12px;background:#f9f9f9;border-radius:6px;border:1px solid #e8e8e8;font-size:12px;color:#888;">미리보기: <span v-html="form[row.key]"></span></div>
              </div>

              <!-- embed code -->
              <textarea v-else-if="row.type==='code'" class="form-control" v-model="form[row.key]" rows="5" style="margin:0;font-family:monospace;font-size:12px;" :placeholder="row.ph" :readonly="viewMode"></textarea>

              <!-- event picker -->
              <div v-else-if="row.type==='event'">
                <div style="display:flex;gap:8px;align-items:center;">
                  <input class="form-control" v-model="form.eventId" placeholder="이벤트 ID" style="margin:0;max-width:160px;" :readonly="viewMode" />
                  <span v-if="form.eventId" class="ref-link" @click="showRefModal('event', Number(form.eventId))">보기</span>
                </div>
                <div v-if="relatedEvent" style="margin-top:6px;padding:8px 12px;background:#e6f4ff;border-radius:6px;font-size:12px;display:flex;align-items:center;gap:8px;">
                  <b>{{ relatedEvent.title }}</b>
                  <span class="badge badge-green">{{ relatedEvent.status }}</span>
                  <span style="color:#888;">{{ relatedEvent.startDate }} ~ {{ relatedEvent.endDate }}</span>
                </div>
                <div v-else-if="form.eventId" style="margin-top:6px;font-size:12px;color:#aaa;">해당 이벤트를 찾을 수 없습니다.</div>
              </div>

            </td>
          </tr>

          <!-- 텍스트 배너 미리보기 행 -->
          <tr v-if="isText && form.textContent">
            <td style="font-weight:500;color:#555;">미리보기</td>
            <td style="padding:6px 8px;">
              <div style="padding:14px;border-radius:6px;font-size:13px;" :style="{background:form.bgColor,color:form.textColor}">{{ form.textContent }}</div>
            </td>
          </tr>

          <!-- 이미지 배너 미리보기 행 -->
          <tr v-if="isImage && form.imageUrl">
            <td style="font-weight:500;color:#555;">이미지 미리보기</td>
            <td style="padding:6px 8px;">
              <img :src="form.imageUrl" style="max-height:120px;border-radius:6px;border:1px solid #e8e8e8;" @error="$event.target.style.display='none'" />
            </td>
          </tr>

          <!-- 상품 ID 링크 행 -->
          <tr v-if="isProduct && form.productIds">
            <td style="font-weight:500;color:#555;">상품 링크</td>
            <td style="padding:6px 8px;">
              <div style="display:flex;flex-wrap:wrap;gap:6px;">
                <span v-for="pid in form.productIds.split(',').map(s=>s.trim()).filter(Boolean)" :key="pid"
                  class="ref-link" @click="showRefModal('product', Number(pid))"
                  style="padding:2px 10px;background:#e6f4ff;border-radius:12px;font-size:12px;cursor:pointer;">
                  상품 #{{ pid }}
                </span>
              </div>
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

    <!-- 클릭 동작 -->
    <div v-show="tab==='action'">
      <table class="admin-table" style="margin-bottom:16px;">
        <thead><tr><th style="width:180px;">항목</th><th>값</th></tr></thead>
        <tbody>
          <tr>
            <td style="font-weight:500;color:#555;vertical-align:middle;">클릭 시 동작</td>
            <td style="padding:6px 8px;">
              <select class="form-control" v-model="form.clickAction" style="margin:0;max-width:220px;" :disabled="viewMode">
                <option value="none">없음</option>
                <option value="navigate">페이지 이동</option>
                <option value="event">이벤트 호출</option>
                <option value="modal">모달 오픈</option>
                <option value="url">외부 URL</option>
              </select>
            </td>
          </tr>
          <tr v-if="form.clickAction !== 'none'">
            <td style="font-weight:500;color:#555;vertical-align:middle;">대상</td>
            <td style="padding:6px 8px;">
              <input class="form-control" v-model="form.clickTarget" placeholder="/products, showCoupon, https://..." style="margin:0;" :readonly="viewMode" />
              <div style="margin-top:6px;font-size:12px;color:#888;">
                <span v-if="form.clickAction==='navigate'">💡 <code>/home</code>, <code>/products</code>, <code>/detail?pid=1</code> 형식</span>
                <span v-if="form.clickAction==='event'">💡 <code>showCoupon</code>, <code>openEvent</code> 등 이벤트명</span>
                <span v-if="form.clickAction==='url'">💡 외부 URL (http:// 포함)</span>
              </div>
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

    <!-- 조건 / 인증 -->
    <div v-show="tab==='auth'">
      <table class="admin-table" style="margin-bottom:16px;">
        <thead><tr><th style="width:180px;">항목</th><th>값</th></tr></thead>
        <tbody>
          <tr>
            <td style="font-weight:500;color:#555;vertical-align:middle;">노출 조건</td>
            <td style="padding:6px 8px;">
              <select class="form-control" v-model="form.condition" style="margin:0;max-width:260px;" :disabled="viewMode">
                <option>항상 표시</option>
                <option>로그인 필요</option>
                <option>비로그인</option>
                <option>로그인+VIP</option>
                <option>로그인+우수</option>
              </select>
            </td>
          </tr>
          <tr>
            <td style="font-weight:500;color:#555;vertical-align:middle;">인증 필요</td>
            <td style="padding:6px 8px;">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                <input type="checkbox" v-model="form.authRequired" :disabled="viewMode" />
                <span style="font-size:13px;">인증 필요</span>
              </label>
            </td>
          </tr>
          <tr v-if="form.authRequired">
            <td style="font-weight:500;color:#555;vertical-align:middle;">인증 등급 제한</td>
            <td style="padding:6px 8px;">
              <select class="form-control" v-model="form.authGrade" style="margin:0;max-width:200px;" :disabled="viewMode">
                <option value="">등급 제한 없음</option>
                <option>VIP</option><option>우수</option><option>일반</option>
              </select>
            </td>
          </tr>
          <tr>
            <td style="font-weight:500;color:#555;">설정 요약</td>
            <td style="padding:6px 8px;font-size:13px;color:#666;">
              노출: <b>{{ form.condition }}</b>
              &nbsp;·&nbsp; 인증: <b>{{ form.authRequired ? '필요' : '불필요' }}</b>
              <span v-if="form.authRequired && form.authGrade"> ({{ form.authGrade }} 이상)</span>
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
  </div>
</div>
`
};
