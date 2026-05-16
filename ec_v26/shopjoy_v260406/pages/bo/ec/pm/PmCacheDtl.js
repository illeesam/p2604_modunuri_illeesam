/* ShopJoy Admin - 캐쉬관리 상세/등록 */
window._pmCacheDtlState = window._pmCacheDtlState || { tab: 'info', tabMode: 'tab' };
window.PmCacheDtl = {
  name: 'PmCacheDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    tabMode:      { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const uiState = reactive({ loading: false, showVendorModal: false, error: null, isPageCodeLoad: false, tab: window._pmCacheDtlState.tab || 'info', tabMode2: window._pmCacheDtlState.tabMode || 'tab'});
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({ cache_trans_types: [] });

    // 단건 조회
    const handleSearchDetail = async () => {
      if (cfIsNew.value) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.pmCache.getById(props.dtlId, '캐시관리', '상세조회');
        const c = res.data?.data || res.data;
        if (c) Object.assign(form, { ...c });
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    const cfIsNew = computed(() => !props.dtlId);

watch(() => uiState.tab, v => { window._pmCacheDtlState.tab = v; });

        watch(() => uiState.tabMode2, v => { window._pmCacheDtlState.tabMode = v; });

    /* 캐시(충전금) showTab */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;

    /* 캐시(충전금) fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.cache_trans_types = codeStore.sgGetGrpCodes('CACHE_TRANS_TYPE');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);


    const form = reactive({
      cacheId: null, memberId: '', memberNm: '', cacheDate: '', cacheTypeCd: '충전', cacheAmt: 0, balanceAmt: 0, cacheDesc: '',
      refId: '', procUserId: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      memberId: yup.string().required('회원ID를 입력해주세요.'),
      cacheDesc: yup.string().required('내용을 입력해주세요.'),
    });

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) return;
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      if (typeof handleLoadDetail === 'function') await handleLoadDetail();
      else if (typeof handleSearchDetail === 'function') await handleSearchDetail();
    });

    /* 같은 회원의 캐쉬 내역 */
    const cfMemberCacheHistory = computed(() => form.memberCacheHistory || []);

    const cfTotalBalance = computed(() => form.balanceAmt || 0);

    /* 캐시(충전금) 저장 */
    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        console.error('[catch-info]', err);
        err.inner.forEach(e => { errors[e.path] = e.message; });
        showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const ok = await showConfirm(cfIsNew.value ? '등록' : '저장', cfIsNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      try {
        const res = await (cfIsNew.value ? boApiSvc.pmCache.create({ ...form }, '캐시관리', '등록') : boApiSvc.pmCache.update(form.cacheId, { ...form }, '캐시관리', '저장'));
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('pmCacheMng', { reload: true });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 캐시(충전금) onUserIdChange */
    const onUserIdChange = () => {
      const m = getMember.value(Number(form.memberId));
      if (m) form.memberNm = m.memberNm;
    };

    const cfSelectedVendorNm = computed(() => {
      if (!form.vendorId) return '소속업체 선택';
      const v = vendors.value.find(x => x.vendorId === form.vendorId);
      return v ? v.vendorNm : '소속업체 선택';
    });

    /* 캐시(충전금) selectVendor */
    const selectVendor = (vendorId, vendorNm) => {
      form.vendorId = vendorId;
      uiState.showVendorModal = false;
    };

    /* 캐시(충전금) fnTypeBadge */
    const fnTypeBadge = t => ({ '충전': 'badge-green', '사용': 'badge-orange', '환불': 'badge-blue', '소멸': 'badge-red' }[t] || 'badge-gray');

    const showVendorModal = Vue.toRef(uiState, 'showVendorModal');

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    // -- return ---------------------------------------------------------------

    return { uiState, codes, cfIsNew, tab, form, errors, cfMemberCacheHistory, cfTotalBalance, handleSave, onUserIdChange, fnTypeBadge, cfDtlMode, tabMode2, showTab, cfSelectedVendorNm, selectVendor, showVendorModal };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ cfIsNew ? '캐쉬 등록' : (cfDtlMode ? '캐쉬 상세' : '캐쉬 수정') }}<span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.cacheId }}</span></div>
    <div class="tab-bar-row">
      <div class="tab-nav">
        <button class="tab-btn" :class="{active:tab==='info'}" :disabled="tabMode2!=='tab'" @click="tab='info'">📋 기본정보</button>
        <button v-if="form.memberId" class="tab-btn" :class="{active:tab==='history'}" :disabled="tabMode2!=='tab'" @click="tab='history'">
          🕒 회원 캐쉬 내역 <span class="tab-count">{{ cfMemberCacheHistory.length }}</span>
        </button>
      </div>
      <div class="tab-modes">
        <button class="tab-mode-btn" :class="{active:tabMode2==='tab'}" @click="tabMode2='tab'" title="탭으로 보기">📑</button>
        <button class="tab-mode-btn" :class="{active:tabMode2==='1col'}" @click="tabMode2='1col'" title="1열로 보기">1▭</button>
        <button class="tab-mode-btn" :class="{active:tabMode2==='2col'}" @click="tabMode2='2col'" title="2열로 보기">2▭</button>
        <button class="tab-mode-btn" :class="{active:tabMode2==='3col'}" @click="tabMode2='3col'" title="3열로 보기">3▭</button>
        <button class="tab-mode-btn" :class="{active:tabMode2==='4col'}" @click="tabMode2='4col'" title="4열로 보기">4▭</button>
      </div>
    </div>
    <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">

    <!-- -- 기본정보 --------------------------------------------------------- -->
    <div class="card" v-show="showTab('info')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📋 기본정보</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">회원ID <span v-if="!cfDtlMode" class="req">*</span></label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input class="form-control" v-model="form.memberId" placeholder="회원 ID" @change="onUserIdChange" :readonly="cfDtlMode" :class="errors.memberId ? 'is-invalid' : ''" />
            <span v-if="form.memberId" class="ref-link" @click="showRefModal('member', Number(form.memberId))">보기</span>
          </div>
          <span v-if="errors.memberId" class="field-error">{{ errors.memberId }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">회원명</label>
          <div class="readonly-field">{{ form.memberNm || '-' }}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">유형</label>
          <select class="form-control" v-model="form.cacheTypeCd" :disabled="cfDtlMode">
            <option v-for="c in codes.cache_trans_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">일시</label>
          <input class="form-control" v-model="form.cacheDate" placeholder="2026-04-08 10:00" :readonly="cfDtlMode" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">금액 <span v-if="!cfDtlMode" class="req">*</span> <span style="font-size:11px;color:#888;">(사용/소멸은 음수)</span></label>
          <input class="form-control" type="number" v-model.number="form.cacheAmt" :readonly="cfDtlMode" />
        </div>
        <div class="form-group">
          <label class="form-label">처리 후 잔액</label>
          <input class="form-control" type="number" v-model.number="form.balanceAmt" :readonly="cfDtlMode" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">내용 <span v-if="!cfDtlMode" class="req">*</span></label>
        <input class="form-control" v-model="form.cacheDesc" placeholder="내용 입력" :readonly="cfDtlMode" :class="errors.cacheDesc ? 'is-invalid' : ''" />
        <span v-if="errors.cacheDesc" class="field-error">{{ errors.cacheDesc }}</span>
      </div>
      <div class="form-row" style="margin-top:20px;padding-top:20px;border-top:1px solid #e8e8e8;">
        <div class="form-group">
          <label class="form-label">판매업체</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <div class="form-control" style="background:#f9f9f9;cursor:pointer;padding:0;display:flex;align-items:center;" @click="showVendorModal=true">
              <span style="padding:8px 12px;flex:1;">{{ cfSelectedVendorNm }}</span>
              <span style="padding:8px 12px;color:#999;font-size:12px;">▼</span>
            </div>
            <button v-if="form.vendorId" class="btn btn-sm" style="padding:0 12px;color:#666;" @click="form.vendorId='';form.chargeStaff=''">초기화</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">판매담당자</label>
          <input class="form-control" v-model="form.chargeStaff" placeholder="담당자명 입력" :readonly="cfDtlMode" />
        </div>
      </div>

      <!-- -- 판매업체 선택 모달 ------------------------------------------------- -->
      <div v-if="showVendorModal" class="modal-overlay" @click.self="showVendorModal=false">
        <div class="modal-box" style="width:400px;">
          <div class="modal-header">
            <span class="modal-title">판매업체 선택</span>
            <span class="modal-close" @click="showVendorModal=false">×</span>
          </div>
          <div style="padding:0;max-height:400px;overflow-y:auto;">
            <div v-for="v in ([] || [])" :key="v?.vendorId"
              style="padding:12px 16px;border-bottom:1px solid #f0f0f0;cursor:pointer;display:flex;justify-content:space-between;align-items:center;"
              :style="form.vendorId===v.vendorId?{background:'#f0f4ff',color:'#1565c0'}:{}"
              @click="selectVendor(v.vendorId, v.vendorNm)">
              <span style="font-weight:500;">{{ v.vendorNm }}</span>
              <span v-if="form.vendorId===v.vendorId" style="color:#1565c0;font-weight:700;">✓</span>
            </div>
            <div v-if="![] || [].length===0" style="padding:20px;text-align:center;color:#aaa;font-size:13px;">
              판매업체가 없습니다.
            </div>
          </div>
          <div style="padding:12px 16px;border-top:1px solid #f0f0f0;text-align:right;">
            <button class="btn btn-secondary btn-sm" @click="showVendorModal=false">닫기</button>
          </div>
        </div>
      </div>

      <div class="form-actions" v-if="!cfDtlMode">
        <template v-if="cfDtlMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('pmCacheMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" @click="handleSave">저장</button>
          <button class="btn btn-secondary" @click="navigate('pmCacheMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- -- 회원 캐쉬 내역 ----------------------------------------------------- -->
    <div class="card" v-show="showTab('history')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🕒 회원 캐쉬 내역 <span class="tab-count">{{ cfMemberCacheHistory.length }}</span></div>
      <div style="margin-bottom:12px;padding:12px;background:#f9f9f9;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:13px;color:#555;">
          <span class="ref-link" @click="showRefModal('member', Number(form.memberId))">{{ form.memberNm }}</span> 현재 잔액
        </span>
        <span style="font-size:20px;font-weight:700;color:#e8587a;">{{ cfTotalBalance.toLocaleString() }}원</span>
      </div>
      <table class="bo-table" v-if="cfMemberCacheHistory.length">
        <thead><tr><th>일시</th><th>유형</th><th>금액</th><th>잔액</th><th>내용</th></tr></thead>
        <tbody>
          <tr v-for="c in cfMemberCacheHistory" :key="c?.cacheId">
            <td>{{ c.cacheDate }}</td>
            <td><span class="badge" :class="fnTypeBadge(c.cacheTypeCd)">{{ c.cacheTypeCd }}</span></td>
            <td :style="c.cacheAmt>0?'color:#389e0d;font-weight:600':'color:#cf1322;font-weight:600'">
              {{ c.cacheAmt > 0 ? '+' : '' }}{{ (c.cacheAmt||0).toLocaleString() }}원
            </td>
            <td>{{ (c.balanceAmt||0).toLocaleString() }}원</td>
            <td>{{ c.cacheDesc }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">캐쉬 내역이 없습니다.</div>
    </div>
  </div>
</div>
`
};
