/* ShopJoy Admin - 전시관리 상세/등록 */
window.DispDtl = {
  name: 'DispDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId'],
  setup(props) {
    const { reactive, computed, ref, onMounted } = Vue;
    const isNew = computed(() => !props.editId);
    const tab = ref('info');

    const form = reactive({
      area: 'HOME_BANNER', name: '', widgetType: 'image_banner', dispType: '이미지',
      clickAction: 'none', clickTarget: '',
      condition: '항상 표시', authRequired: false, authGrade: '',
      sortOrder: 1, status: '활성',
      imageUrl: '', linkUrl: '', altText: '',
      productIds: '', chartTitle: '', chartType: 'bar',
      popupWidth: 600, popupHeight: 400,
      textContent: '', bgColor: '#ffffff', textColor: '#222222',
      infoTitle: '', infoBody: '',
      chartLabels: '', chartValues: '',
    });

    const WIDGET_TYPES = [
      { value: 'image_banner', label: '이미지 배너' },
      { value: 'product_slider', label: '상품 슬라이더' },
      { value: 'chart_bar', label: '차트 (Bar)' },
      { value: 'chart_line', label: '차트 (Line)' },
      { value: 'chart_pie', label: '차트 (Pie)' },
      { value: 'text_banner', label: '텍스트 배너' },
      { value: 'info_card', label: '정보 카드' },
      { value: 'popup', label: '팝업' },
    ];

    const AREAS = [
      'HOME_BANNER', 'HOME_PRODUCT', 'HOME_CHART', 'HOME_EVENT',
      'SIDEBAR_TOP', 'SIDEBAR_MID', 'SIDEBAR_BOT',
      'PRODUCT_TOP', 'PRODUCT_BTM', 'MY_PAGE', 'FOOTER',
    ];

    const isChart   = computed(() => form.widgetType.startsWith('chart_'));
    const isProduct = computed(() => form.widgetType === 'product_slider');
    const isImage   = computed(() => form.widgetType === 'image_banner');
    const isText    = computed(() => form.widgetType === 'text_banner');
    const isInfo    = computed(() => form.widgetType === 'info_card');
    const isPopup   = computed(() => form.widgetType === 'popup');

    onMounted(() => {
      if (!isNew.value) {
        const d = props.adminData.displays.find(x => x.dispId === props.editId);
        if (d) Object.assign(form, { ...d });
      }
    });

    const save = () => {
      if (!form.name || !form.area) { props.showToast('필수 항목을 입력해주세요.', 'error'); return; }
      if (isNew.value) {
        props.adminData.displays.push({
          ...form,
          dispId: props.adminData.nextId(props.adminData.displays, 'dispId'),
          sortOrder: Number(form.sortOrder),
          regDate: new Date().toISOString().slice(0, 10),
        });
        props.showToast('전시 위젯이 등록되었습니다.');
      } else {
        const idx = props.adminData.displays.findIndex(x => x.dispId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.displays[idx], { ...form, sortOrder: Number(form.sortOrder) });
        props.showToast('저장되었습니다.');
      }
      props.navigate('dispMng');
    };

    return { isNew, tab, form, WIDGET_TYPES, AREAS, isChart, isProduct, isImage, isText, isInfo, isPopup, save };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '전시 위젯 등록' : '전시 위젯 수정' }}</div>
  <div class="card">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:tab==='info'}" @click="tab='info'">기본정보</button>
      <button class="tab-btn" :class="{active:tab==='display'}" @click="tab='display'">표현 설정</button>
      <button class="tab-btn" :class="{active:tab==='action'}" @click="tab='action'">클릭 동작</button>
      <button class="tab-btn" :class="{active:tab==='auth'}" @click="tab='auth'">조건 / 인증</button>
    </div>

    <!-- 기본정보 -->
    <div v-show="tab==='info'">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">위젯명 <span class="req">*</span></label>
          <input class="form-control" v-model="form.name" placeholder="위젯 이름" />
        </div>
        <div class="form-group">
          <label class="form-label">화면 영역 <span class="req">*</span></label>
          <select class="form-control" v-model="form.area">
            <option v-for="a in AREAS" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">위젯 유형</label>
          <select class="form-control" v-model="form.widgetType">
            <option v-for="w in WIDGET_TYPES" :key="w.value" :value="w.value">{{ w.label }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">노출 순서</label>
          <input class="form-control" type="number" v-model.number="form.sortOrder" min="1" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" style="max-width:200px;" v-model="form.status">
          <option>활성</option><option>비활성</option>
        </select>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('dispMng')">취소</button>
      </div>
    </div>

    <!-- 표현 설정 -->
    <div v-show="tab==='display'">
      <!-- 이미지 배너 -->
      <template v-if="isImage">
        <div class="form-group">
          <label class="form-label">이미지 URL</label>
          <input class="form-control" v-model="form.imageUrl" placeholder="https://..." />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Alt 텍스트</label>
            <input class="form-control" v-model="form.altText" />
          </div>
          <div class="form-group">
            <label class="form-label">링크 URL</label>
            <input class="form-control" v-model="form.linkUrl" />
          </div>
        </div>
      </template>
      <!-- 상품 슬라이더 -->
      <template v-if="isProduct">
        <div class="form-group">
          <label class="form-label">상품 ID 목록 (쉼표 구분)</label>
          <input class="form-control" v-model="form.productIds" placeholder="1, 2, 3, ..." />
        </div>
      </template>
      <!-- 차트 -->
      <template v-if="isChart">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">차트 제목</label>
            <input class="form-control" v-model="form.chartTitle" />
          </div>
          <div class="form-group">
            <label class="form-label">차트 유형</label>
            <select class="form-control" v-model="form.chartType">
              <option value="bar">Bar</option><option value="line">Line</option><option value="pie">Pie</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">라벨 (쉼표 구분)</label>
            <input class="form-control" v-model="form.chartLabels" placeholder="1월, 2월, 3월" />
          </div>
          <div class="form-group">
            <label class="form-label">값 (쉼표 구분)</label>
            <input class="form-control" v-model="form.chartValues" placeholder="100, 200, 150" />
          </div>
        </div>
      </template>
      <!-- 텍스트 배너 -->
      <template v-if="isText">
        <div class="form-group">
          <label class="form-label">텍스트 내용</label>
          <textarea class="form-control" v-model="form.textContent" rows="3"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">배경색</label>
            <div style="display:flex;gap:8px;align-items:center;">
              <input type="color" v-model="form.bgColor" style="width:40px;height:36px;border:1px solid #ddd;border-radius:4px;cursor:pointer;" />
              <input class="form-control" v-model="form.bgColor" style="flex:1;" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">글자색</label>
            <div style="display:flex;gap:8px;align-items:center;">
              <input type="color" v-model="form.textColor" style="width:40px;height:36px;border:1px solid #ddd;border-radius:4px;cursor:pointer;" />
              <input class="form-control" v-model="form.textColor" style="flex:1;" />
            </div>
          </div>
        </div>
      </template>
      <!-- 정보 카드 -->
      <template v-if="isInfo">
        <div class="form-group">
          <label class="form-label">카드 제목</label>
          <input class="form-control" v-model="form.infoTitle" />
        </div>
        <div class="form-group">
          <label class="form-label">카드 내용</label>
          <textarea class="form-control" v-model="form.infoBody" rows="4"></textarea>
        </div>
      </template>
      <!-- 팝업 -->
      <template v-if="isPopup">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">팝업 너비 (px)</label>
            <input class="form-control" type="number" v-model.number="form.popupWidth" />
          </div>
          <div class="form-group">
            <label class="form-label">팝업 높이 (px)</label>
            <input class="form-control" type="number" v-model.number="form.popupHeight" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">팝업 이미지 URL</label>
          <input class="form-control" v-model="form.imageUrl" />
        </div>
      </template>
      <div v-if="!isImage && !isProduct && !isChart && !isText && !isInfo && !isPopup"
        style="color:#aaa;text-align:center;padding:30px;font-size:13px;">
        위젯 유형을 선택하면 관련 설정이 표시됩니다.
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('dispMng')">취소</button>
      </div>
    </div>

    <!-- 클릭 동작 -->
    <div v-show="tab==='action'">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">클릭 시 동작</label>
          <select class="form-control" v-model="form.clickAction">
            <option value="none">없음</option>
            <option value="navigate">페이지 이동</option>
            <option value="event">이벤트 호출</option>
            <option value="modal">모달 오픈</option>
            <option value="url">외부 URL</option>
          </select>
        </div>
        <div class="form-group" v-if="form.clickAction !== 'none'">
          <label class="form-label">대상 (경로 / 이벤트명 / URL)</label>
          <input class="form-control" v-model="form.clickTarget" placeholder="/products, showCoupon, https://..." />
        </div>
      </div>
      <div v-if="form.clickAction==='navigate'" style="background:#f9f9f9;border-radius:8px;padding:12px;margin-top:8px;font-size:12px;color:#666;">
        💡 페이지 이동: <code>/home</code>, <code>/products</code>, <code>/detail?pid=1</code> 형식으로 입력
      </div>
      <div v-if="form.clickAction==='event'" style="background:#f9f9f9;border-radius:8px;padding:12px;margin-top:8px;font-size:12px;color:#666;">
        💡 이벤트 호출: <code>showCoupon</code>, <code>openEvent</code> 등 정의된 이벤트명 입력
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('dispMng')">취소</button>
      </div>
    </div>

    <!-- 조건 / 인증 -->
    <div v-show="tab==='auth'">
      <div class="form-group">
        <label class="form-label">노출 조건</label>
        <select class="form-control" style="max-width:280px;" v-model="form.condition">
          <option>항상 표시</option>
          <option>로그인 필요</option>
          <option>비로그인</option>
          <option>로그인+VIP</option>
          <option>로그인+우수</option>
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <input type="checkbox" v-model="form.authRequired" />
          <span style="font-size:13px;font-weight:500;">인증 필요</span>
        </label>
      </div>
      <div v-if="form.authRequired" class="form-group" style="max-width:280px;">
        <label class="form-label">인증 등급 제한</label>
        <select class="form-control" v-model="form.authGrade">
          <option value="">등급 제한 없음</option>
          <option>VIP</option><option>우수</option><option>일반</option>
        </select>
      </div>
      <div style="margin-top:16px;padding:14px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8;">
        <div style="font-size:13px;font-weight:600;margin-bottom:8px;color:#555;">현재 설정 요약</div>
        <div style="font-size:13px;color:#666;line-height:1.8;">
          노출 조건: <b>{{ form.condition }}</b><br/>
          인증 필요: <b>{{ form.authRequired ? '예' : '아니오' }}</b>
          <span v-if="form.authRequired && form.authGrade"> ({{ form.authGrade }} 등급 이상)</span>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('dispMng')">취소</button>
      </div>
    </div>
  </div>
</div>
`
};
