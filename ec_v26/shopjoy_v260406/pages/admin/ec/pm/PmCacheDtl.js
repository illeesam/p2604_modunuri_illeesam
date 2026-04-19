/* ShopJoy Admin - 캐쉬관리 상세/등록 */
window._pmCacheDtlState = window._pmCacheDtlState || { tab: 'info', viewMode: 'tab' };
window.PmCacheDtl = {
  name: 'PmCacheDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, ref, onMounted } = Vue;
    const isNew = computed(() => !props.editId);
    const tab = ref(window._pmCacheDtlState.tab || 'info');
    Vue.watch(tab, v => { window._pmCacheDtlState.tab = v; });
    const viewMode2 = ref(window._pmCacheDtlState.viewMode || 'tab');
    Vue.watch(viewMode2, v => { window._pmCacheDtlState.viewMode = v; });
    const showTab = (id) => viewMode2.value !== 'tab' || tab.value === id;

    const form = reactive({
      cacheId: null, userId: '', userNm: '', date: '', type: '충전', amount: 0, balance: 0, desc: '',
      vendorId: '', chargeStaff: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      userId: yup.string().required('회원ID를 입력해주세요.'),
      desc: yup.string().required('내용을 입력해주세요.'),
    });

    onMounted(() => {
      if (!isNew.value) {
        const c = props.adminData.cacheList.find(x => x.cacheId === props.editId);
        if (c) Object.assign(form, { ...c });
      }
    });

    /* 같은 회원의 캐쉬 내역 */
    const memberCacheHistory = computed(() =>
      props.adminData.cacheList.filter(c => String(c.userId) === String(form.userId) && c.cacheId !== props.editId)
        .slice(0, 20)
    );

    const totalBalance = computed(() => {
      const list = props.adminData.cacheList.filter(c => String(c.userId) === String(form.userId));
      if (!list.length) return 0;
      return list.sort((a, b) => b.date.localeCompare(a.date))[0]?.balance || 0;
    });

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
        props.adminData.cacheList.unshift({
          ...form,
          cacheId: props.adminData.nextId(props.adminData.cacheList, 'cacheId'),
          amount: Number(form.amount), balance: Number(form.balance),
          userId: Number(form.userId),
          date: form.date || new Date().toISOString().slice(0, 16).replace('T', ' '),
        });
      } else {
        const idx = props.adminData.cacheList.findIndex(x => x.cacheId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.cacheList[idx], { ...form, amount: Number(form.amount), balance: Number(form.balance) });
      }
      try {
        const res = await (isNew.value ? window.adminApi.post(`cache/${form.cacheId}`, { ...form }) : window.adminApi.put(`cache/${form.cacheId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(isNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('pmCacheMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const onUserIdChange = () => {
      const m = props.adminData.getMember(Number(form.userId));
      if (m) form.userNm = m.memberNm;
    };

    const typeBadge = t => ({ '충전': 'badge-green', '사용': 'badge-orange', '환불': 'badge-blue', '소멸': 'badge-red' }[t] || 'badge-gray');

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

    return { isNew, tab, form, errors, memberCacheHistory, totalBalance, save, onUserIdChange, typeBadge, viewMode2, showTab, showVendorModal, selectedVendorNm, selectVendor };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '캐쉬 등록' : (viewMode ? '캐쉬 상세' : '캐쉬 수정') }}<span v-if="!isNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.cacheId }}</span></div>
    <div class="tab-bar-row">
      <div class="tab-nav">
        <button class="tab-btn" :class="{active:tab==='info'}" :disabled="viewMode2!=='tab'" @click="tab='info'">📋 기본정보</button>
        <button v-if="form.userId" class="tab-btn" :class="{active:tab==='history'}" :disabled="viewMode2!=='tab'" @click="tab='history'">
          🕒 회원 캐쉬 내역 <span class="tab-count">{{ memberCacheHistory.length }}</span>
        </button>
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

    <!-- 기본정보 -->
    <div class="card" v-show="showTab('info')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📋 기본정보</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">회원ID <span v-if="!viewMode" class="req">*</span></label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input class="form-control" v-model="form.userId" placeholder="회원 ID" @change="onUserIdChange" :readonly="viewMode" :class="errors.userId ? 'is-invalid' : ''" />
            <span v-if="form.userId" class="ref-link" @click="showRefModal('member', Number(form.userId))">보기</span>
          </div>
          <span v-if="errors.userId" class="field-error">{{ errors.userId }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">회원명</label>
          <div class="readonly-field">{{ form.userNm || '-' }}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">유형</label>
          <select class="form-control" v-model="form.type" :disabled="viewMode">
            <option>충전</option><option>사용</option><option>환불</option><option>소멸</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">일시</label>
          <input class="form-control" v-model="form.date" placeholder="2026-04-08 10:00" :readonly="viewMode" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">금액 <span v-if="!viewMode" class="req">*</span> <span style="font-size:11px;color:#888;">(사용/소멸은 음수)</span></label>
          <input class="form-control" type="number" v-model.number="form.amount" :readonly="viewMode" />
        </div>
        <div class="form-group">
          <label class="form-label">처리 후 잔액</label>
          <input class="form-control" type="number" v-model.number="form.balance" :readonly="viewMode" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">내용 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.desc" placeholder="내용 입력" :readonly="viewMode" :class="errors.desc ? 'is-invalid' : ''" />
        <span v-if="errors.desc" class="field-error">{{ errors.desc }}</span>
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
          <button class="btn btn-secondary" @click="navigate('pmCacheMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" @click="save">저장</button>
          <button class="btn btn-secondary" @click="navigate('pmCacheMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- 회원 캐쉬 내역 -->
    <div class="card" v-show="showTab('history')" style="margin:0;">
      <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">🕒 회원 캐쉬 내역 <span class="tab-count">{{ memberCacheHistory.length }}</span></div>
      <div style="margin-bottom:12px;padding:12px;background:#f9f9f9;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:13px;color:#555;">
          <span class="ref-link" @click="showRefModal('member', Number(form.userId))">{{ form.userNm }}</span> 현재 잔액
        </span>
        <span style="font-size:20px;font-weight:700;color:#e8587a;">{{ totalBalance.toLocaleString() }}원</span>
      </div>
      <table class="admin-table" v-if="memberCacheHistory.length">
        <thead><tr><th>일시</th><th>유형</th><th>금액</th><th>잔액</th><th>내용</th></tr></thead>
        <tbody>
          <tr v-for="c in memberCacheHistory" :key="c.cacheId">
            <td>{{ c.date }}</td>
            <td><span class="badge" :class="typeBadge(c.type)">{{ c.type }}</span></td>
            <td :style="c.amount>0?'color:#389e0d;font-weight:600':'color:#cf1322;font-weight:600'">
              {{ c.amount > 0 ? '+' : '' }}{{ c.amount.toLocaleString() }}원
            </td>
            <td>{{ c.balance.toLocaleString() }}원</td>
            <td>{{ c.desc }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">캐쉬 내역이 없습니다.</div>
    </div>
  </div>
</div>
`
};
