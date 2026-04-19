/* ShopJoy Admin - 기획전관리 상세/등록 (Quill HTML Editor + 배너이미지) */
window._ecPlanDtlState = window._ecPlanDtlState || { tab: 'info', viewMode: 'tab' };
window.PmPlanDtl = {
  name: 'PmPlanDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, ref, onMounted, onUnmounted } = Vue;
    const isNew = computed(() => !props.editId);
    const tab = ref(window._ecPlanDtlState.tab || 'info');
    Vue.watch(tab, v => { window._ecPlanDtlState.tab = v; });
    const viewMode2 = ref(window._ecPlanDtlState.viewMode || 'tab');
    Vue.watch(viewMode2, v => { window._ecPlanDtlState.viewMode = v; });
    const showTab = (id) => viewMode2.value !== 'tab' || tab.value === id;

    const _today = new Date();
    const _pad = n => String(n).padStart(2, '0');
    const DEFAULT_START = `${_today.getFullYear()}-${_pad(_today.getMonth()+1)}-${_pad(_today.getDate())}`;
    const DEFAULT_END = `${_today.getFullYear()+1}-12-31`;

    const CATEGORIES = [
      { value: '패션', label: '패션' },
      { value: '스포츠', label: '스포츠' },
      { value: '스타일링', label: '스타일링' },
      { value: '직원전용', label: '직원전용' },
      { value: '명품', label: '명품' },
    ];

    const STATUS_OPTIONS = [
      { value: '활성', label: '활성' },
      { value: '예정', label: '예정' },
      { value: '비활성', label: '비활성' },
      { value: '종료', label: '종료' },
    ];

    const VISIBILITY_OPTIONS = [
      { value: 'PUBLIC',    label: '전체공개' },
      { value: 'MEMBER',    label: '회원공개' },
      { value: 'VERIFIED',  label: '인증회원' },
      { value: 'PREMIUM',   label: '우수회원↑' },
      { value: 'VIP',       label: 'VIP 전용' },
      { value: 'INVITED',   label: '초대회원' },
      { value: 'STAFF',     label: '직원' },
      { value: 'EXECUTIVE', label: '임직원' },
    ];

    const form = reactive({
      planNm: '', category: '패션', theme: '', status: '활성',
      startDate: DEFAULT_START, endDate: DEFAULT_END,
      productIds: [], visibilityTargets: '^PUBLIC^',
      desc: '', bannerImage: '', content1: '', content2: '', content3: '',
      vendorId: '', chargeStaff: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      planNm: yup.string().required('기획전명을 입력해주세요.'),
      category: yup.string().required('카테고리를 선택해주세요.'),
    });

    /* Quill 인스턴스 4개 (배너+콘텐츠3) */
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
      for (let i = 1; i <= 3; i++) {
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
          for (let i = 1; i <= 3; i++) initQuill('quill-content' + i, 'content' + i);
          syncToQuill();
        }, 50);
      }
    };

    onMounted(() => {
      if (!isNew.value) {
        const p = (props.adminData.plans || []).find(x => x.planId === props.editId);
        if (p) {
          Object.assign(form, { ...p, productIds: [...(p.productIds || [])] });
          if (!form.visibilityTargets) form.visibilityTargets = '^PUBLIC^';
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
      const idx = form.productIds.indexOf(pid);
      if (idx === -1) form.productIds.push(pid);
      else form.productIds.splice(idx, 1);
    };
    const isSelected = (pid) => form.productIds.includes(pid);
    const selectedProducts = computed(() =>
      form.productIds.map(pid => props.adminData.products.find(p => p.productId === pid)).filter(Boolean)
    );
    const removeProduct = (pid) => {
      const idx = form.productIds.indexOf(pid);
      if (idx !== -1) form.productIds.splice(idx, 1);
    };

    const hasVisibility = (code) => {
      return (form.visibilityTargets || '').includes('^' + code + '^');
    };
    const toggleVisibility = (code) => {
      const targets = (form.visibilityTargets || '').split('^').filter(Boolean);
      const idx = targets.indexOf(code);
      if (idx === -1) targets.push(code);
      else targets.splice(idx, 1);
      form.visibilityTargets = '^' + targets.join('^') + '^';
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
        const newId = Math.max(...(props.adminData.plans || []).map(p => p.planId), 0) + 1;
        props.adminData.plans.push({
          ...form, planId: newId,
          productIds: [...form.productIds],
          regDate: new Date().toISOString().slice(0, 10),
          viewCount: 0, thumbUrl: '🎯',
        });
      } else {
        const idx = props.adminData.plans.findIndex(x => x.planId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.plans[idx], { ...form, productIds: [...form.productIds] });
      }
      try {
        const res = await (isNew.value ? window.adminApi.post(`plans`, form) : window.adminApi.put(`plans/${props.editId}`, form));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(isNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('pmPlanMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    return {
      isNew, tab, onTabChange, form, errors, activeContentTab, showProdPopup, prodSearch,
      filteredProds, toggleProduct, isSelected, selectedProducts, removeProduct, save,
      CATEGORIES, STATUS_OPTIONS, VISIBILITY_OPTIONS, viewMode2, showTab, hasVisibility, toggleVisibility,
      showVendorModal, selectedVendorNm, selectVendor,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '기획전 등록' : '기획전 상세' }}<span v-if="!isNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.planId }}</span></div>
    <div class="tab-bar-row">
      <div class="tab-nav">
        <button class="tab-btn" :class="{active:tab==='banner'}" :disabled="viewMode2!=='tab'" @click="onTabChange('banner')">🎨 배너이미지</button>
        <button class="tab-btn" :class="{active:tab==='info'}" :disabled="viewMode2!=='tab'" @click="onTabChange('info')">📋 기본정보</button>
        <button class="tab-btn" :class="{active:tab==='content'}" :disabled="viewMode2!=='tab'" @click="onTabChange('content')">📝 내용입력</button>
        <button class="tab-btn" :class="{active:tab==='products'}" :disabled="viewMode2!=='tab'" @click="onTabChange('products')">
          🛍 대상 상품 <span class="tab-count">{{ form.productIds.length }}</span>
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
        <button class="btn btn-primary" @click="save">💾 저장</button>
        <button class="btn btn-secondary" @click="navigate('pmPlanMng')">취소</button>
      </div>
    </div>

    <!-- 기본정보 -->
    <div class="card" v-show="showTab('info')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📋 기본정보</div>
      <div class="form-group">
        <label class="form-label">기획전명 <span class="req">*</span></label>
        <input class="form-control" v-model="form.planNm" placeholder="기획전명을 입력하세요" :class="errors.planNm ? 'is-invalid' : ''" />
        <span v-if="errors.planNm" class="field-error">{{ errors.planNm }}</span>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">카테고리 <span class="req">*</span></label>
          <select class="form-control" v-model="form.category" :class="errors.category ? 'is-invalid' : ''">
            <option v-for="c in CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
          <span v-if="errors.category" class="field-error">{{ errors.category }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">테마</label>
          <input class="form-control" v-model="form.theme" placeholder="예: 봄맞이, 세일" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" v-model="form.status">
            <option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">공개대상</label>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:8px 0;">
            <label v-for="opt in VISIBILITY_OPTIONS" :key="opt.value" style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;">
              <input type="checkbox" :checked="hasVisibility(opt.value)" @change="toggleVisibility(opt.value)" />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">시작일</label>
          <input class="form-control" type="date" v-model="form.startDate" />
        </div>
        <div class="form-group">
          <label class="form-label">종료일</label>
          <input class="form-control" type="date" v-model="form.endDate" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">간단설명</label>
        <textarea class="form-control" v-model="form.desc" placeholder="기획전 설명" style="min-height:60px;"></textarea>
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
          <input class="form-control" v-model="form.chargeStaff" placeholder="담당자명 입력" />
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
        <button class="btn btn-primary" @click="save">💾 저장</button>
        <button class="btn btn-secondary" @click="navigate('pmPlanMng')">취소</button>
      </div>
    </div>

    <!-- 내용입력 (HTML 에디터) -->
    <div class="card" v-show="showTab('content')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📝 내용입력</div>
      <div style="margin-bottom:12px;">
        <div style="display:flex;gap:2px;margin-bottom:12px;">
          <button v-for="i in 3" :key="i" @click="activeContentTab=i"
            class="tab-btn" :class="{active:activeContentTab===i}"
            style="font-size:12px;padding:6px 14px;">
            {{ i===1 ? '🎯 주요내용' : (i===2 ? '✨ 특징' : '🎁 혜택') }}
          </button>
        </div>
      </div>

      <template v-if="activeContentTab===1">
        <div id="quill-content1" style="min-height:400px;background:#fff;border:1px solid #e0e0e0;border-radius:6px;"></div>
      </template>
      <template v-if="activeContentTab===2">
        <div id="quill-content2" style="min-height:400px;background:#fff;border:1px solid #e0e0e0;border-radius:6px;"></div>
      </template>
      <template v-if="activeContentTab===3">
        <div id="quill-content3" style="min-height:400px;background:#fff;border:1px solid #e0e0e0;border-radius:6px;"></div>
      </template>

      <div class="form-actions" style="margin-top:12px;">
        <button class="btn btn-primary" @click="save">💾 저장</button>
        <button class="btn btn-secondary" @click="navigate('pmPlanMng')">취소</button>
      </div>
    </div>

    <!-- 대상상품 -->
    <div class="card" v-show="showTab('products')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">🛍 대상 상품</div>
      <div style="margin-bottom:16px;">
        <button class="btn btn-primary btn-sm" @click="showProdPopup=true" style="float:right;">+ 상품선택</button>
        <div style="clear:both;"></div>
      </div>

      <div v-if="selectedProducts.length > 0" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;">
        <div v-for="p in selectedProducts" :key="p.productId" style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;background:#fff;">
          <div style="height:100px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:32px;border-bottom:1px solid #e8e8e8;">📦</div>
          <div style="padding:8px;font-size:11px;">
            <div style="font-weight:600;color:#222;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ p.prodNm }}</div>
            <div style="color:#e8587a;font-weight:700;margin-bottom:6px;">{{ (p.price||0).toLocaleString() }}원</div>
            <button style="width:100%;padding:4px;background:#fff;border:1px solid #ddd;border-radius:4px;font-size:10px;cursor:pointer;color:#666;" @click="removeProduct(p.productId)">제거</button>
          </div>
        </div>
      </div>
      <div v-else style="text-align:center;color:#999;padding:40px;background:#f9f9f9;border-radius:6px;">선택된 상품이 없습니다.</div>

      <div class="form-actions">
        <button class="btn btn-primary" @click="save">💾 저장</button>
        <button class="btn btn-secondary" @click="navigate('pmPlanMng')">취소</button>
      </div>
    </div>

    <!-- 미리보기 -->
    <div class="card" v-show="showTab('preview')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">👁 미리보기</div>
      <div style="background:#f9f9f9;border-radius:6px;padding:20px;">
        <!-- 배너 미리보기 -->
        <div v-if="form.bannerImage" style="margin-bottom:20px;padding:16px;background:#fff;border-radius:6px;border:1px solid #e0e0e0;overflow:hidden;" v-html="form.bannerImage"></div>

        <div style="background:#fff;border-radius:6px;padding:20px;border:1px solid #e0e0e0;">
          <div style="font-size:18px;font-weight:700;color:#222;margin-bottom:12px;">{{ form.planNm }}</div>
          <div style="display:flex;gap:8px;margin-bottom:12px;">
            <span style="display:inline-block;font-size:11px;background:#e8f0fe;color:#1577db;border-radius:4px;padding:4px 8px;font-weight:600;">{{ form.category }}</span>
            <span style="display:inline-block;font-size:11px;background:#fff3e0;color:#f57c00;border-radius:4px;padding:4px 8px;font-weight:600;">{{ form.theme }}</span>
            <span style="display:inline-block;font-size:11px;background:#e8f5e9;color:#2e7d32;border-radius:4px;padding:4px 8px;font-weight:600;">{{ form.status }}</span>
          </div>
          <div style="color:#666;font-size:12px;line-height:1.6;margin-bottom:16px;">
            <div>📅 기간: {{ form.startDate }} ~ {{ form.endDate }}</div>
            <div style="margin-top:4px;">{{ form.desc }}</div>
          </div>

          <!-- 컨텐츠 미리보기 -->
          <template v-if="form.content1 || form.content2 || form.content3">
            <div style="border-top:1px solid #e0e0e0;padding-top:16px;margin-top:16px;">
              <div v-if="form.content1" style="margin-bottom:20px;">
                <div style="font-size:13px;font-weight:700;color:#333;margin-bottom:8px;">🎯 주요내용</div>
                <div style="font-size:12px;line-height:1.8;color:#555;" v-html="form.content1"></div>
              </div>
              <div v-if="form.content2" style="margin-bottom:20px;">
                <div style="font-size:13px;font-weight:700;color:#333;margin-bottom:8px;">✨ 특징</div>
                <div style="font-size:12px;line-height:1.8;color:#555;" v-html="form.content2"></div>
              </div>
              <div v-if="form.content3">
                <div style="font-size:13px;font-weight:700;color:#333;margin-bottom:8px;">🎁 혜택</div>
                <div style="font-size:12px;line-height:1.8;color:#555;" v-html="form.content3"></div>
              </div>
            </div>
          </template>

          <!-- 대상상품 미리보기 -->
          <div v-if="selectedProducts.length > 0" style="border-top:1px solid #e0e0e0;padding-top:16px;margin-top:16px;">
            <div style="font-size:13px;font-weight:700;color:#333;margin-bottom:12px;">🛍 대상상품 ({{ selectedProducts.length }}개)</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;">
              <div v-for="p in selectedProducts" :key="p.productId" style="text-align:center;padding:10px;background:#f9f9f9;border-radius:6px;">
                <div style="font-size:32px;margin-bottom:4px;">📦</div>
                <div style="font-size:11px;font-weight:600;color:#222;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ p.prodNm }}</div>
                <div style="font-size:12px;color:#e8587a;font-weight:700;margin-top:4px;">{{ (p.price||0).toLocaleString() }}원</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-primary" @click="save">💾 저장</button>
        <button class="btn btn-secondary" @click="navigate('pmPlanMng')">취소</button>
      </div>
    </div>

    </div>
</div>

<!-- 상품선택 모달 -->
<div v-if="showProdPopup" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
  <div style="background:#fff;border-radius:8px;width:90%;max-width:600px;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;">
    <div style="padding:16px;border-bottom:1px solid #e0e0e0;display:flex;justify-content:space-between;align-items:center;">
      <h3 style="margin:0;font-size:14px;font-weight:700;">상품선택</h3>
      <button @click="showProdPopup=false" style="background:none;border:none;font-size:20px;cursor:pointer;color:#999;">✕</button>
    </div>
    <div style="padding:12px;border-bottom:1px solid #f0f0f0;">
      <input v-model="prodSearch" type="text" placeholder="상품명 검색" class="form-control" style="width:100%;" />
    </div>
    <div style="flex:1;overflow-y:auto;">
      <div v-if="filteredProds.length === 0" style="text-align:center;color:#999;padding:40px;">상품이 없습니다.</div>
      <div v-for="p in filteredProds" :key="p.productId"
        @click="toggleProduct(p.productId)"
        style="padding:12px 16px;border-bottom:1px solid #f0f0f0;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:background .1s;"
        :style="isSelected(p.productId) ? 'background:#ede7f6;' : ''"
        @mouseenter="$event.target.parentElement.style.background='#f9f9f9'"
        @mouseleave="$event.target.parentElement.style.background=isSelected(p.productId) ? '#ede7f6' : 'white'">
        <div style="flex:1;">
          <div style="font-weight:600;font-size:12px;color:#222;">{{ p.prodNm }}</div>
          <div style="font-size:11px;color:#999;margin-top:2px;">{{ (p.price||0).toLocaleString() }}원</div>
        </div>
        <div v-if="isSelected(p.productId)" style="color:#6a1b9a;font-weight:700;font-size:18px;">✓</div>
      </div>
    </div>
    <div style="padding:12px 16px;border-top:1px solid #e0e0e0;display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-secondary" @click="showProdPopup=false">완료</button>
    </div>
  </div>
</div>
`
};
