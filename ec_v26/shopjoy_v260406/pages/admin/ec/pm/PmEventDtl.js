/* ShopJoy Admin - 이벤트관리 상세/등록 (Quill HTML Editor) */
window._ecEventDtlState = window._ecEventDtlState || { tab: 'info', viewMode: 'tab' };
window.PmEventDtl = {
  name: 'PmEventDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, ref, onMounted, onUnmounted } = Vue;
    const isNew = computed(() => !props.editId);
    const tab = ref(window._ecEventDtlState.tab || 'info');
    Vue.watch(tab, v => { window._ecEventDtlState.tab = v; });
    const viewMode2 = ref(window._ecEventDtlState.viewMode || 'tab');
    Vue.watch(viewMode2, v => { window._ecEventDtlState.viewMode = v; });
    const showTab = (id) => viewMode2.value !== 'tab' || tab.value === id;

    const _today = new Date();
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END   = `${_today.getFullYear()+3}-12-31`;

    const form = reactive({
      title: '', status: '진행중', startDate: DEFAULT_START, endDate: DEFAULT_END,
      authRequired: false, targetProducts: [], visibilityTargets: '^PUBLIC^',
      bannerImage: '', content1: '', content2: '', content3: '', content4: '', content5: '',
      vendorId: '', chargeStaff: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      title: yup.string().required('이벤트 제목을 입력해주세요.'),
    });

    /* Quill 인스턴스 5개 */
    const quillers = {};
    const activeContentTab = ref(1);

    const initQuill = (id, key) => {
      const el = document.getElementById(id);
      if (!el || typeof Quill === 'undefined') return;
      if (quillers[key]) return;
      quillers[key] = new Quill(el, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ color: [] }, { background: [] }],
            [{ align: [] }],
            ['blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean'],
          ],
        },
      });
      quillers[key].on('text-change', () => { form[key] = quillers[key].root.innerHTML; });
      if (form[key]) quillers[key].root.innerHTML = form[key];
    };

    const syncToQuill = () => {
      for (let i = 1; i <= 5; i++) {
        const key = 'content' + i;
        if (quillers[key]) quillers[key].root.innerHTML = form[key] || '';
      }
    };

    const onTabChange = (newTab) => {
      tab.value = newTab;
      if (newTab === 'banner') {
        setTimeout(() => { initQuill('quill-banner', 'bannerImage'); }, 50);
      } else if (newTab === 'content') {
        setTimeout(() => {
          for (let i = 1; i <= 5; i++) initQuill('quill-content' + i, 'content' + i);
          syncToQuill();
        }, 50);
      }
    };

    onMounted(() => {
      if (!isNew.value) {
        const e = props.adminData.events.find(x => x.eventId === props.editId);
        if (e) {
          Object.assign(form, { ...e, targetProducts: [...(e.targetProducts || [])] });
          if (!form.visibilityTargets) {
            form.visibilityTargets = window.visibilityUtil.fromLegacy('항상 표시', e.authRequired, '');
            if (!form.visibilityTargets) form.visibilityTargets = '^PUBLIC^';
          }
        }
      }
    });

    onUnmounted(() => { Object.keys(quillers).forEach(k => { delete quillers[k]; }); });

    /* 대상 상품 팝업 */
    const showProdPopup = ref(false);
    const prodSearch = ref('');
    const filteredProds = computed(() => props.adminData.products.filter(p => {
      const kw = prodSearch.value.trim().toLowerCase();
      return !kw || p.prodNm.toLowerCase().includes(kw);
    }));
    const toggleProduct = (pid) => {
      const idx = form.targetProducts.indexOf(pid);
      if (idx === -1) form.targetProducts.push(pid);
      else form.targetProducts.splice(idx, 1);
    };
    const isSelected = (pid) => form.targetProducts.includes(pid);
    const selectedProducts = computed(() =>
      form.targetProducts.map(pid => props.adminData.getProduct(pid)).filter(Boolean)
    );
    const removeProduct = (pid) => {
      const idx = form.targetProducts.indexOf(pid);
      if (idx !== -1) form.targetProducts.splice(idx, 1);
    };

    /* 이벤트 확인 버튼 토스트 */
    const onEventConfirm = () => {
      props.showToast('이벤트 참여가 완료되었습니다! 감사합니다.', 'success');
    };

    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const ok = await props.showConfirm(isNew.value ? '등록' : '저장', isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      if (isNew.value) {
        props.adminData.events.push({
          ...form, eventId: props.adminData.nextId(props.adminData.events, 'eventId'),
          targetProducts: [...form.targetProducts],
          regDate: new Date().toISOString().slice(0, 10),
        });
      } else {
        const idx = props.adminData.events.findIndex(x => x.eventId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.events[idx], { ...form, targetProducts: [...form.targetProducts] });
      }
      try {
        const res = await (isNew.value ? window.adminApi.post(`events/${form.eventId}`, { ...form }) : window.adminApi.put(`events/${form.eventId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(isNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('pmEventMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const visibilityOptions = computed(() => window.visibilityUtil.allOptions());
    const hasVisibility = (code) => window.visibilityUtil.has(form.visibilityTargets, code);
    const toggleVisibility = (code) => {
      const list = window.visibilityUtil.parse(form.visibilityTargets);
      const i = list.indexOf(code);
      if (i >= 0) list.splice(i, 1); else list.push(code);
      form.visibilityTargets = window.visibilityUtil.serialize(list);
    };

    const showVendorModal = ref(false);
    const selectedVendorNm = computed(() => {
      if (!form.vendorId) return '소속업체 선택';
      const v = props.adminData.vendors.find(x => x.vendorId === form.vendorId);
      return v ? v.vendorNm : '소속업체 선택';
    });
    const selectVendor = (vendorId, vendorNm) => {
      form.vendorId = vendorId;
      showVendorModal.value = false;
    };

    return { isNew, tab, onTabChange, form, errors, activeContentTab, showProdPopup, prodSearch, filteredProds, toggleProduct, isSelected, selectedProducts, removeProduct, onEventConfirm, save, visibilityOptions, hasVisibility, toggleVisibility, viewMode2, showTab, showVendorModal, selectedVendorNm, selectVendor };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '이벤트 등록' : (viewMode ? '이벤트 상세' : '이벤트 수정') }}<span v-if="!isNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.eventId }}</span></div>
    <div class="tab-bar-row">
      <div class="tab-nav">
        <button class="tab-btn" :class="{active:tab==='banner'}" :disabled="viewMode2!=='tab'" @click="onTabChange('banner')">🎨 배너이미지</button>
        <button class="tab-btn" :class="{active:tab==='info'}" :disabled="viewMode2!=='tab'" @click="onTabChange('info')">📋 기본정보</button>
        <button class="tab-btn" :class="{active:tab==='content'}" :disabled="viewMode2!=='tab'" @click="onTabChange('content')">📝 이벤트 내용</button>
        <button class="tab-btn" :class="{active:tab==='products'}" :disabled="viewMode2!=='tab'" @click="onTabChange('products')">
          🛍 대상 상품 <span class="tab-count">{{ form.targetProducts.length }}</span>
        </button>
        <button class="tab-btn" :class="{active:tab==='preview'}" :disabled="viewMode2!=='tab'" @click="onTabChange('preview')">👁 미리보기</button>
      </div>
      <div class="tab-view-modes">
        <button class="tab-view-mode-btn" :class="{active:viewMode2==='tab'}" @click="viewMode2='tab'" title="탭으로 보기">📑</button>
        <button class="tab-view-mode-btn" :class="{active:viewMode2==='1col'}" @click="viewMode2='1col'" title="1열로 보기">1▭</button>
        <button class="tab-view-mode-btn" :class="{active:viewMode2==='2col'}" @click="viewMode2='2col'" title="2열로 보기">2▭</button>
        <button class="tab-view-mode-btn" :class="{active:viewMode2==='3col'}" @click="viewMode2='3col'" title="3열로 보기">3▭</button>
        <button class="tab-view-mode-btn" :class="{active:viewMode2==='4col'}" @click="viewMode2='4col'" title="4열로 보기">4▭</button>
      </div>
    </div>
    <div :class="viewMode2!=='tab' ? 'dtl-tab-grid cols-'+viewMode2.charAt(0) : ''">

    <!-- 배너이미지 -->
    <div class="card" v-show="showTab('banner')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">🎨 배너이미지</div>
      <div style="margin-bottom:12px;">
        <div style="font-size:12px;color:#888;margin-bottom:6px;">💡 팁: 이미지 삽입 후 크기 조절 및 배치를 자유롭게 설정할 수 있습니다.</div>
        <div id="quill-banner" style="min-height:300px;background:#fff;border:1px solid #e0e0e0;border-radius:6px;"></div>
      </div>
      <div class="form-actions">
        <template v-if="viewMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('pmEventMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" @click="save">저장</button>
          <button class="btn btn-secondary" @click="navigate('pmEventMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- 기본정보 -->
    <div class="card" v-show="showTab('info')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📋 기본정보</div>
      <div class="form-group">
        <label class="form-label">이벤트 제목 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.title" placeholder="이벤트 제목을 입력하세요" :readonly="viewMode" :class="errors.title ? 'is-invalid' : ''" />
        <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">시작일</label>
          <input class="form-control" type="date" v-model="form.startDate" :readonly="viewMode" />
        </div>
        <div class="form-group">
          <label class="form-label">종료일</label>
          <input class="form-control" type="date" v-model="form.endDate" :readonly="viewMode" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" v-model="form.status" :disabled="viewMode">
            <option>진행중</option><option>예정</option><option>종료</option>
          </select>
        </div>
        <div class="form-group" style="display:flex;align-items:flex-end;">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" v-model="form.authRequired" />
            <span style="font-size:13px;font-weight:500;">로그인 인증 필요</span>
          </label>
        </div>
      </div>
      <div v-if="form.authRequired" style="padding:10px 14px;background:#fff7e6;border-radius:6px;border:1px solid #ffd591;font-size:12px;color:#d46b08;">
        ⚠️ 인증 필요 설정 시, 이벤트 내용 3~5는 로그인 회원에게만 표시됩니다.
      </div>
      <div style="margin-top:14px;">
        <div style="font-size:12px;font-weight:700;color:#888;margin-bottom:8px;">🔒 공개 대상 (하나라도 해당하면 노출)</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          <label v-for="opt in visibilityOptions" :key="opt.codeValue"
            :style="{
              display:'inline-flex',alignItems:'center',gap:'6px',padding:'5px 10px',borderRadius:'14px',
              border:'1px solid '+(hasVisibility(opt.codeValue)?'#1565c0':'#ddd'),
              background:hasVisibility(opt.codeValue)?'#e3f2fd':'#fafafa',
              color:hasVisibility(opt.codeValue)?'#1565c0':'#666',
              fontSize:'12px',fontWeight:hasVisibility(opt.codeValue)?700:500,
              cursor: viewMode?'default':'pointer',
            }">
            <input type="checkbox" :checked="hasVisibility(opt.codeValue)" :disabled="viewMode"
              @change="toggleVisibility(opt.codeValue)" style="accent-color:#1565c0;" />
            {{ opt.codeLabel }}
          </label>
        </div>
      </div>
      <div class="form-row" style="margin-top:20px;padding-top:20px;border-top:1px solid #e8e8e8;">
        <div class="form-group">
          <label class="form-label">판매업체</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <div class="form-control" style="background:#f9f9f9;cursor:pointer;padding:0;display:flex;align-items:center;" @click="showVendorModal=true">
              <span style="padding:8px 12px;flex:1;">{{ selectedVendorNm }}</span>
              <span style="padding:8px 12px;color:#999;font-size:12px;">▼</span>
            </div>
            <button v-if="form.vendorId" class="btn btn-sm" style="padding:0 12px;color:#666;" @click="form.vendorId='';form.chargeStaff=''">초기화</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">판매담당자</label>
          <input class="form-control" v-model="form.chargeStaff" placeholder="담당자명 입력" :readonly="viewMode" />
        </div>
      </div>

      <!-- 판매업체 선택 모달 -->
      <div v-if="showVendorModal" class="modal-overlay" @click.self="showVendorModal=false">
        <div class="modal-box" style="width:400px;">
          <div class="modal-header">
            <span class="modal-title">판매업체 선택</span>
            <span class="modal-close" @click="showVendorModal=false">×</span>
          </div>
          <div style="padding:0;max-height:400px;overflow-y:auto;">
            <div v-for="v in (adminData.vendors || [])" :key="v.vendorId"
              style="padding:12px 16px;border-bottom:1px solid #f0f0f0;cursor:pointer;display:flex;justify-content:space-between;align-items:center;"
              :style="form.vendorId===v.vendorId?{background:'#f0f4ff',color:'#1565c0'}:{}"
              @click="selectVendor(v.vendorId, v.vendorNm)">
              <span style="font-weight:500;">{{ v.vendorNm }}</span>
              <span v-if="form.vendorId===v.vendorId" style="color:#1565c0;font-weight:700;">✓</span>
            </div>
            <div v-if="!adminData.vendors || adminData.vendors.length===0" style="padding:20px;text-align:center;color:#aaa;font-size:13px;">
              판매업체가 없습니다.
            </div>
          </div>
          <div style="padding:12px 16px;border-top:1px solid #f0f0f0;text-align:right;">
            <button class="btn btn-secondary btn-sm" @click="showVendorModal=false">닫기</button>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <template v-if="viewMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('pmEventMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" @click="save">저장</button>
          <button class="btn btn-secondary" @click="navigate('pmEventMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- 이벤트 내용 (HTML 에디터) -->
    <div class="card" v-show="showTab('content')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📝 이벤트 내용</div>
      <div style="display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap;">
        <button v-for="n in 5" :key="n" class="btn btn-sm"
          :class="activeContentTab===n ? 'btn-primary' : 'btn-secondary'"
          @click="activeContentTab=n">
          내용 {{ n }}
          <span v-if="form.authRequired && n >= 3" class="tab-count" style="background:#fde8ee;color:#e8587a;">인증</span>
        </button>
      </div>
      <div v-for="n in 5" :key="n" v-show="activeContentTab===n">
        <div v-if="form.authRequired && n >= 3" style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:8px 12px;background:#fff7e6;border-radius:6px;border:1px solid #ffd591;">
          <span class="badge badge-orange">인증 후 표시</span>
          <span style="font-size:12px;color:#888;">로그인 회원에게만 표시됩니다</span>
        </div>
        <div v-if="viewMode" class="form-control" style="min-height:160px;line-height:1.6;" v-html="form['content'+n] || '<span style=color:#bbb>-</span>'"></div>
        <div v-else class="quill-wrap">
          <div :id="'quill-content'+n" style="min-height:160px;"></div>
        </div>
      </div>
      <div class="form-actions" style="margin-top:16px;">
        <template v-if="viewMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('pmEventMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" @click="save">저장</button>
          <button class="btn btn-secondary" @click="navigate('pmEventMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- 대상 상품 -->
    <div class="card" v-show="showTab('products')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">🛍 대상 상품 <span class="tab-count">{{ form.targetProducts.length }}</span></div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:14px;">
        <button v-if="!viewMode" class="btn btn-secondary" @click="showProdPopup=true">+ 상품 추가</button>
        <span style="font-size:13px;color:#888;">{{ form.targetProducts.length }}개 선택됨</span>
      </div>
      <table class="admin-table" v-if="selectedProducts.length">
        <thead><tr><th>ID</th><th>상품명</th><th>카테고리</th><th>가격</th><th>재고</th><th>상태</th><th>제거</th></tr></thead>
        <tbody>
          <tr v-for="p in selectedProducts" :key="p.productId">
            <td>{{ p.productId }}</td>
            <td><span class="ref-link" @click="showRefModal('product', p.productId)">{{ p.prodNm }}</span></td>
            <td>{{ p.category }}</td>
            <td>{{ p.price.toLocaleString() }}원</td>
            <td>{{ p.stock }}개</td>
            <td>{{ p.status }}</td>
            <td><button class="btn btn-danger btn-sm" @click="removeProduct(p.productId)">제거</button></td>
          </tr>
        </tbody>
      </table>
      <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">선택된 상품이 없습니다.</div>
      <div class="form-actions">
        <template v-if="viewMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('pmEventMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" @click="save">저장</button>
          <button class="btn btn-secondary" @click="navigate('pmEventMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- 미리보기 -->
    <div class="card" v-show="showTab('preview')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">👁 미리보기</div>
      <div style="background:#f9f9f9;border-radius:10px;padding:20px;border:1px solid #e8e8e8;max-width:600px;">
        <!-- 배너 미리보기 -->
        <div v-if="form.bannerImage" style="margin-bottom:20px;padding:12px;background:#fff;border-radius:6px;border:1px solid #e0e0e0;overflow:hidden;" v-html="form.bannerImage"></div>

        <div style="font-size:18px;font-weight:700;margin-bottom:12px;color:#1a1a2e;">{{ form.title || '이벤트 제목' }}</div>
        <div style="font-size:12px;color:#aaa;margin-bottom:16px;">{{ form.startDate }} ~ {{ form.endDate }}</div>
        <div style="font-size:13px;color:#444;margin-bottom:12px;" v-html="form.content1 || '<p style=color:#aaa>이벤트 내용 1이 여기에 표시됩니다.</p>'"></div>
        <div style="font-size:13px;color:#444;margin-bottom:12px;" v-html="form.content2"></div>
        <template v-if="!form.authRequired">
          <div style="font-size:13px;color:#444;margin-bottom:12px;" v-html="form.content3"></div>
          <div style="font-size:13px;color:#444;margin-bottom:12px;" v-html="form.content4"></div>
          <div style="font-size:13px;color:#444;margin-bottom:16px;" v-html="form.content5"></div>
        </template>
        <div v-else style="padding:12px;background:#f0f0f0;border-radius:6px;font-size:12px;color:#888;margin-bottom:16px;">
          🔒 내용 3~5는 로그인 후 확인 가능합니다.
        </div>
        <div v-if="selectedProducts.length > 0" style="margin-top:20px;padding-top:20px;border-top:1px solid #e0e0e0;">
          <div style="font-size:14px;font-weight:700;color:#333;margin-bottom:12px;">🎯 대상 상품 ({{ selectedProducts.length }}개)</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;">
            <div v-for="p in selectedProducts" :key="p.productId" style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;background:#fff;">
              <div style="height:100px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:32px;border-bottom:1px solid #e8e8e8;">📦</div>
              <div style="padding:8px;font-size:11px;">
                <div style="font-weight:600;color:#222;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ p.prodNm }}</div>
                <div style="color:#e8587a;font-weight:700;">{{ (p.price||0).toLocaleString() }}원</div>
              </div>
            </div>
          </div>
        </div>
        <button class="btn btn-primary" @click="onEventConfirm" style="margin-top:16px;">이벤트 확인</button>
      </div>
    </div>
  </div>

  <!-- 상품 선택 팝업 -->
  <div v-if="showProdPopup" class="modal-overlay" @click.self="showProdPopup=false">
    <div class="modal-box">
      <div class="modal-header">
        <span class="modal-title">대상 상품 선택</span>
        <span class="modal-close" @click="showProdPopup=false">×</span>
      </div>
      <div style="margin-bottom:10px;">
        <input class="form-control" v-model="prodSearch" placeholder="상품명 검색" />
      </div>
      <div class="popup-prod-list">
        <label v-for="p in filteredProds" :key="p.productId" class="popup-prod-item">
          <input type="checkbox" :checked="isSelected(p.productId)" @change="toggleProduct(p.productId)" />
          <span>{{ p.prodNm }}</span>
          <span style="font-size:12px;color:#888;margin-left:auto;">{{ p.price.toLocaleString() }}원</span>
        </label>
      </div>
      <div style="margin-top:12px;text-align:right;">
        <button class="btn btn-primary" @click="showProdPopup=false">확인 ({{ form.targetProducts.length }}개)</button>
      </div>
    </div>
  </div>
</div>
`
};
