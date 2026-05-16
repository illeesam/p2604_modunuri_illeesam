/* ShopJoy Admin - 클레임관리 상세/등록 */
window._odClaimDtlState = window._odClaimDtlState || { activeTab: 'info', tabMode: 'tab' };
window.OdClaimDtl = {
  name: 'OdClaimDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    tabMode:      { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, activeTab: window._odClaimDtlState.activeTab || 'info', tabMode2: window._odClaimDtlState.tabMode || 'tab'});
    const activeTab = Vue.toRef(uiState, 'activeTab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({ claim_statuses: [], claim_types: [] });

    const cfIsNew = computed(() => !props.dtlId);

    /* 클레임(취소/반품/교환) fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.claim_statuses = codeStore.sgGetGrpCodes('CLAIM_STATUS');
      codes.claim_types = codeStore.sgGetGrpCodes('CLAIM_TYPE');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);


    const form = reactive({
      claimId: '', memberId: '', memberNm: '', orderId: '', prodNm: '',
      claimTypeCd: '취소', claimStatusCd: '신청', reasonCd: '', reasonDetail: '',
      refundAmt: 0, refundMethodCd: '계좌환불', requestDate: '', memo: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      claimId: yup.string().required('클레임ID를 입력해주세요.'),
      orderId: yup.string().required('주문ID를 입력해주세요.'),
    });

    /* CLAIM_STEPS: parentCodeValues 기반 동적 파생 */
    const TYPE_CD = { '취소': 'CANCEL', '반품': 'RETURN', '교환': 'EXCHANGE' };
    const cfClaimStatusCodes = computed(() =>
      (codes.claim_statuses || [])
        .filter(c => c.useYn === 'Y')
        .sort((a, b) => a.sortOrd - b.sortOrd)
    );
    const cfClaimSteps = computed(() => cfClaimStatusCodes.value
      .filter(c => !c.parentCodeValues || c.parentCodeValues.includes('^' + (TYPE_CD[form.claimTypeCd] || form.claimTypeCd) + '^'))
      .map(c => c.codeLabel)
      .filter(l => !['거부','철회'].includes(l)));

    const cfCurrentStepIdx = computed(() => cfClaimSteps.value.indexOf(form.claimStatusCd));
    const cfStatusOptions   = computed(() => cfClaimSteps.value);

    // 단건 GET
    const handleSearchDetail = async () => {
      if (cfIsNew.value) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.odClaim.getById(props.dtlId, '클레임관리', '상세조회');
        const c = res.data?.data || res.data || {};
        Object.assign(form, { ...c });
        if (!form.claimId) form.claimId = props.dtlId;
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      await handleSearchDetail();
      claimItems.splice(0, claimItems.length, ...sampleClaimItems());
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) return;
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleLoadDetail();
    });

    /* 클레임(취소/반품/교환) 저장 */
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
      const isNewClaim = cfIsNew.value;
      const ok = await showConfirm(isNewClaim ? '등록' : '저장', isNewClaim ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      try {
        const res = await (isNewClaim
          ? boApiSvc.odClaim.create({ ...form, refundAmt: Number(form.refundAmt) }, '클레임관리', '등록')
          : boApiSvc.odClaim.update(form.claimId, { ...form, refundAmt: Number(form.refundAmt) }, '클레임관리', '저장'));
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast(isNewClaim ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('odClaimMng', { reload: true });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

        watch(() => uiState.activeTab, v => { window._odClaimDtlState.activeTab = v; });

        watch(() => uiState.tabMode2, v => { window._odClaimDtlState.tabMode = v; });

    /* 클레임(취소/반품/교환) showTab */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.activeTab === id;
    const claimItems = reactive([]);

    /* 클레임(취소/반품/교환) sampleClaimItems */
    const sampleClaimItems = () => {
      const base = form.prodNm || '클레임상품';
      const amount = Number(form.refundAmt || 0) || 30000;
      const shares = [0.60, 0.40];
      const discRates = [0.10, 0.15];
      const discLabels = ['신규10%','쿠폰15%'];
      const defs = [
        { prodNm: base,           color:'블랙', size:'M', qty:1 },
        { prodNm: base+' 동반반품', color:'차콜', size:'L', qty:1 },
      ];
      return defs.map((d,i) => {
        const paid = Math.round(amount * shares[i]);
        const sale = Math.round(paid / (1 - discRates[i]));

    // -- return ---------------------------------------------------------------

        return { ...d, salePrice: sale, discInfo: discLabels[i], discAmount: sale - paid, price: paid };
      });
    };

    /* 클레임(취소/반품/교환) fmt */
    const fmt = (n) => Number(n||0).toLocaleString() + '원';

    const CLAIM_TYPE_COLOR = { '취소':'#ef4444', '반품':'#FFBB00', '교환':'#3b82f6' };

    const expandedItems = reactive(new Set());

    /* 클레임(취소/반품/교환) toggleExpand */
    const toggleExpand = (i) => { if (expandedItems.has(i)) expandedItems.delete(i); else expandedItems.add(i); };

    /* 클레임(취소/반품/교환) isExpanded */
    const isExpanded = (i) => expandedItems.has(i);
    const cfAllExpanded = computed(() => claimItems.length > 0 && window.safeArrayUtils.safeEvery(claimItems, (_,i) => expandedItems.has(i)));

    /* 클레임(취소/반품/교환) toggleExpandAll */
    const toggleExpandAll = () => {
      if (cfAllExpanded.value) expandedItems.clear();
      else { expandedItems.clear(); claimItems.forEach((_,i) => expandedItems.add(i)); }
    };

    watch(claimItems, (list) => { expandedItems.clear(); list.forEach((_,i) => expandedItems.add(i)); });

    /* 클레임(취소/반품/교환) getExchangedItem */
    const getExchangedItem = (it) => {
      if (form.claimTypeCd !== '교환') return null;
      const swapColor = { '블랙':'네이비','네이비':'차콜','화이트':'아이보리','차콜':'블랙' };

    // -- return ---------------------------------------------------------------

      return {
        prodNm: it.prodNm + ' (교환품)',
        color: swapColor[it.color] || '네이비',
        size: it.size, qty: it.qty, price: it.price,
        courier: form.exchangeCourierCd,
        trackingNo: form.exchangeTrackingNo,
      };
    };

    /* 클레임(취소/반품/교환) trackingUrl */
    const trackingUrl = (courier, no) => {
      if (!no) return '';
      if (courier === 'CJ대한통운') return 'https://trace.cjlogistics.com/next/tracking.html?wblNo=' + no;
      if (courier === '롯데택배')   return 'https://www.lotteglogis.com/open/tracking?invno=' + no;
      if (courier === '한진택배')   return 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnumText2=' + no;
      if (courier === '우체국택배') return 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=' + no;
      if (courier === '로젠택배')   return 'https://www.ilogen.com/web/personal/trace/' + no;
      return '';
    };

    /* 클레임(취소/반품/교환) openTracking */
    const openTracking = (courier, no) => {
      const url = trackingUrl(courier, no);
      if (!url) { showToast && showToast('운송장 정보가 없습니다.', 'error'); return; }
      window.open(url, 'dlivTrack', 'width=900,height=760,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes');
    };
    const cfPaymentList = computed(() => form.refundAmt || form.claimId ? [{
      method: form.refundMethodCd || '-', status: form.claimStatusCd || '-',
      amount: form.refundAmt || 0, payDate: form.requestDate || '-',
      account: form.refundAccount || '-', apprNo: form.apprNo || '-',
    }] : []);
    const cfStatusHistList = computed(() => {
      if (!form.claimId) return [];
      const d = String(form.requestDate || '').slice(0,10) || '-';
      return [
        { date: d+' 09:10', user:'회원',   from:'-',           to: form.claimTypeCd+'요청', memo: form.claimTypeCd+' 접수' },
        { date: d+' 11:30', user:'bo',  from: form.claimTypeCd+'요청', to:'처리중',        memo:'검토 후 처리 시작' },
        { date: d+' 15:00', user:'bo',  from:'처리중',      to: form.claimStatusCd,  memo:'상태 갱신' },
      ];
    });
    const cfEditHistList = computed(() => form.claimId ? [
      { date: String(form.requestDate||'').slice(0,10)+' 10:00', user:'bo', field:'사유',      before:'-', after: form.reasonCd || '-' },
      { date: String(form.requestDate||'').slice(0,10)+' 12:20', user:'bo', field:'환불금액',  before:'0', after: (form.refundAmt||0).toLocaleString() },
    ] : []);
    const cfTabs = computed(() => [
      { id:'info',     label:'상세정보',      icon:'📋' },
      { id:'items',    label:'클레임항목',    icon:'↩', count: claimItems.length },
      { id:'payment',  label:'결제정보',      icon:'💳', count: cfPaymentList.value.length },
      { id:'hist',     label:'상태변경이력',  icon:'🕒', count: cfStatusHistList.value.length },
      { id:'editHist', label:'정보수정이력',  icon:'📝', count: cfEditHistList.value.length },
    ]);

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    // -- return ---------------------------------------------------------------

    return { cfIsNew, form, errors, cfStatusOptions, cfClaimSteps, cfCurrentStepIdx, handleSave, activeTab, claimItems, fmt, CLAIM_TYPE_COLOR, cfTabs, cfEditHistList, cfPaymentList, cfStatusHistList, openTracking, expandedItems, toggleExpand, isExpanded, getExchangedItem, cfAllExpanded, toggleExpandAll, cfDtlMode, tabMode2, showTab, codes };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ cfIsNew ? '클레임 등록' : (cfDtlMode ? '클레임 상세' : '클레임 수정') }}<span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.claimId }}</span></div>

  <!-- -- 탭 -------------------------------------------------------------- -->
  <div v-if="!cfIsNew" style="display:flex;gap:8px;margin-bottom:14px;align-items:stretch;">
    <div style="flex:1;display:flex;gap:4px;background:#fff;padding:5px;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
      <button v-for="t in cfTabs" :key="t?.id"
        @click="activeTab=t.id"
        :disabled="tabMode2!=='tab'"
        :style="{
          flex:1, padding:'11px 12px', border:'none', cursor: tabMode2==='tab'?'pointer':'default', fontSize:'12.5px',
          borderRadius:'9px', transition:'all .18s',
          display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px',
          opacity: tabMode2==='tab' ? 1 : 0.55,
          fontWeight: activeTab===t.id ? 800 : 600,
          background: (tabMode2==='tab' && activeTab===t.id) ? 'linear-gradient(135deg,#fff0f4,#ffe4ec)' : 'transparent',
          color: (tabMode2==='tab' && activeTab===t.id) ? '#e8587a' : '#666',
          boxShadow: (tabMode2==='tab' && activeTab===t.id) ? '0 2px 8px rgba(232,88,122,0.18)' : 'none',
          borderBottom: (tabMode2==='tab' && activeTab===t.id) ? '2px solid #e8587a' : '2px solid transparent',
        }">
        <span style="font-size:14px;">{{ t.icon }}</span>
        <span>{{ t.label }}</span>
        <span v-if="t.count !== undefined" :style="{
          fontSize:'10.5px', fontWeight:800, padding:'1px 7px', borderRadius:'10px',
          background: (tabMode2==='tab' && activeTab===t.id) ? '#e8587a' : '#e5e7eb',
          color: (tabMode2==='tab' && activeTab===t.id) ? '#fff' : '#666', minWidth:'18px', textAlign:'center',
        }">{{ t.count }}</span>
      </button>
    </div>
    <div style="display:flex;gap:3px;background:#fff;padding:5px;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
      <button v-for="v in [{id:'tab',label:'탭',icon:'📑'},{id:'1col',label:'1열',icon:'1▭'},{id:'2col',label:'2열',icon:'2▭'},{id:'3col',label:'3열',icon:'3▭'},{id:'4col',label:'4열',icon:'4▭'}]" :key="v?.id"
        @click="tabMode2=v.id" :title="v.label+'로 보기'"
        :style="{
          padding:'8px 12px', border:'none', cursor:'pointer', fontSize:'13px', borderRadius:'8px',
          fontWeight: tabMode2===v.id ? 800 : 600,
          background: tabMode2===v.id ? 'linear-gradient(135deg,#fff0f4,#ffe4ec)' : 'transparent',
          color: tabMode2===v.id ? '#e8587a' : '#888',
          boxShadow: tabMode2===v.id ? '0 2px 6px rgba(232,88,122,0.18)' : 'none',
        }">
        <span style="font-size:15px;">{{ v.icon }}</span>
      </button>
    </div>
  </div>
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">

  <div v-if="cfIsNew || showTab('info')" class="card">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📋 상세정보</div>

    <!-- -- 클레임 진행 상태 흐름 ------------------------------------------------- -->
    <div v-if="!cfIsNew" style="margin-bottom:20px;padding:16px 18px;background:#f6f6f6;border-radius:10px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
        <span :style="{
          fontSize:'11px',padding:'3px 10px',borderRadius:'10px',color:'#fff',fontWeight:800,
          background: CLAIM_TYPE_COLOR[form.claimTypeCd] || '#9ca3af',
        }">↩ {{ form.claimTypeCd }}</span>
        <span style="font-size:13px;font-weight:700;color:#222;">{{ form.claimId }}</span>
        <span v-if="form.requestDate" style="font-size:11px;color:#888;">신청일: {{ form.requestDate }}</span>
        <span v-if="form.reasonDetail" style="font-size:11px;color:#888;margin-left:auto;">사유: {{ form.reasonDetail }}</span>
      </div>
      <div style="display:flex;align-items:flex-start;overflow-x:auto;">
        <template v-for="(step, idx) in cfClaimSteps" :key="step">
          <div style="display:flex;flex-direction:column;align-items:center;min-width:80px;flex:1;">
            <div :style="{
              width: idx === cfCurrentStepIdx ? '14px' : '10px',
              height: idx === cfCurrentStepIdx ? '14px' : '10px',
              borderRadius:'50%', marginBottom:'6px', flexShrink:0, transition:'all .15s',
              boxShadow: idx === cfCurrentStepIdx ? '0 0 0 3px '+(CLAIM_TYPE_COLOR[form.claimTypeCd]||'#9ca3af')+'40' : 'none',
              background: idx <= cfCurrentStepIdx ? (CLAIM_TYPE_COLOR[form.claimTypeCd]||'#9ca3af') : '#bbb',
            }"></div>
            <div :style="{
              fontSize:'11.5px', fontWeight: idx === cfCurrentStepIdx ? 800 : 600,
              color: idx === cfCurrentStepIdx ? (CLAIM_TYPE_COLOR[form.claimTypeCd]||'#9ca3af') : (idx < cfCurrentStepIdx ? '#444' : '#bbb'),
              whiteSpace:'nowrap', textAlign:'center',
            }">{{ step }}</div>
            <span v-if="step==='수거중' && form.returnTrackingNo"
              @click="openTracking(form.returnCourierCd, form.returnTrackingNo)"
              title="수거 배송조회"
              style="margin-top:4px;padding:1px 7px;border:1px solid #fed7aa;background:#fff7ed;color:#c2410c;border-radius:4px;font-size:0.7rem;font-weight:700;cursor:pointer;user-select:none;">
              {{ (form.returnCourierCd||'').replace('대한통운','').replace('택배','') || 'CJ' }}수거 🔍
            </span>
            <span v-if="step==='완료' && form.exchangeTrackingNo"
              @click="openTracking(form.exchangeCourierCd, form.exchangeTrackingNo)"
              title="발송 배송조회"
              style="margin-top:4px;padding:1px 7px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;border-radius:4px;font-size:0.7rem;font-weight:700;cursor:pointer;user-select:none;">
              {{ (form.exchangeCourierCd||'').replace('대한통운','').replace('택배','') || 'CJ' }}발송 🔍
            </span>
          </div>
          <div v-if="idx < cfClaimSteps.length - 1"
            :style="{flex:'1', height:'2px', minWidth:'12px', marginTop:'6px',
              background: idx < cfCurrentStepIdx ? (CLAIM_TYPE_COLOR[form.claimTypeCd]||'#9ca3af') : '#bbb'}"></div>
        </template>
      </div>
    </div>

    <!-- -- 기본정보 폼 ------------------------------------------------------- -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">클레임ID <span v-if="!cfDtlMode" class="req">*</span></label>
        <input class="form-control" v-model="form.claimId" placeholder="CLM-2026-XXX" :readonly="!cfIsNew || cfDtlMode" :class="errors.claimId ? 'is-invalid' : ''" />
        <span v-if="errors.claimId" class="field-error">{{ errors.claimId }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">주문ID <span v-if="!cfDtlMode" class="req">*</span></label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input class="form-control" v-model="form.orderId" placeholder="ORD-2026-XXX" :readonly="cfDtlMode" :class="errors.orderId ? 'is-invalid' : ''" />
          <span v-if="form.orderId" class="ref-link" @click="showRefModal('order', form.orderId)">보기</span>
        </div>
        <span v-if="errors.orderId" class="field-error">{{ errors.orderId }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">회원ID</label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input class="form-control" v-model="form.memberId" placeholder="회원 ID" :readonly="cfDtlMode" />
          <span v-if="form.memberId" class="ref-link" @click="showRefModal('member', form.memberId)">보기</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">회원명</label>
        <input class="form-control" v-model="form.memberNm" :readonly="cfDtlMode" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">클레임 유형</label>
        <select class="form-control" v-model="form.claimTypeCd" :disabled="cfDtlMode">
          <option v-for="c in codes.claim_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">처리 상태</label>
        <select class="form-control" v-model="form.claimStatusCd" :disabled="cfDtlMode">
          <option v-for="s in cfStatusOptions" :key="Math.random()">{{ s }}</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">상품명</label>
      <input class="form-control" v-model="form.prodNm" :readonly="cfDtlMode" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사유</label>
        <input class="form-control" v-model="form.reasonCd" :readonly="cfDtlMode" />
      </div>
      <div class="form-group">
        <label class="form-label">신청일</label>
        <input class="form-control" v-model="form.requestDate" placeholder="2026-04-08 10:00" :readonly="cfDtlMode" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">상세 사유</label>
      <textarea class="form-control" v-model="form.reasonDetail" rows="3" :readonly="cfDtlMode"></textarea>
    </div>
    <div class="form-actions" v-if="!cfDtlMode">
      <template v-if="cfDtlMode">
        <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
        <button class="btn btn-secondary" @click="navigate('odClaimMng')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click="handleSave">저장</button>
        <button class="btn btn-secondary" @click="navigate('odClaimMng')">취소</button>
      </template>
    </div>

  </div>

  <!-- -- 클레임항목목록 탭 ------------------------------------------------------ -->
  <div v-if="!cfIsNew && showTab('items')" class="card" style="padding:20px;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">↩ 클레임항목 <span class="tab-count">{{ claimItems.length }}</span></div>
    <div v-if="form.claimTypeCd==='교환'" style="display:flex;justify-content:flex-end;margin-bottom:10px;">
      <button class="btn btn-secondary btn-sm" @click="toggleExpandAll">
        {{ cfAllExpanded ? '▲ 교환품 모두접기' : '▼ 교환품 모두펼치기' }}
      </button>
    </div>
    <table class="bo-table" v-if="claimItems.length">
      <thead><tr>
        <th style="width:36px;text-align:center;">No.</th>
        <th>상품명</th>
        <th style="width:60px;">색상</th>
        <th style="width:50px;">사이즈</th>
        <th style="width:44px;text-align:center;">수량</th>
        <th style="width:90px;text-align:right;">판매금액</th>
        <th style="width:80px;">할인정보</th>
        <th style="width:90px;text-align:right;">할인금액</th>
        <th style="width:100px;text-align:right;">결제금액</th>
        <th style="width:90px;text-align:center;">주문상태</th>
        <th style="width:110px;text-align:center;">클레임상태</th>
        <th style="width:140px;">교환정보</th>
      </tr></thead>
      <tbody>
        <template v-for="(it,i) in claimItems" :key="Math.random()">
        <tr>
          <td style="text-align:center;color:#aaa;">
            <span v-if="form.claimTypeCd==='교환'" @click="toggleExpand(i)" style="cursor:pointer;font-size:11px;color:#3b82f6;font-weight:800;user-select:none;" :title="isExpanded(i)?'교환품 숨기기':'교환품 보기'">
              {{ isExpanded(i) ? '▼' : '▶' }}
            </span>
            {{ i+1 }}
          </td>
          <td>{{ it.prodNm }}</td>
          <td>{{ it.color || '-' }}</td>
          <td>{{ it.size || '-' }}</td>
          <td style="text-align:center;font-weight:600;">{{ it.qty || 1 }}</td>
          <td style="text-align:right;color:#666;">{{ fmt(it.salePrice || it.price || 0) }}</td>
          <td><span v-if="it.discInfo" style="font-size:11px;padding:2px 7px;border-radius:8px;background:#fff3e0;color:#e65100;font-weight:600;">{{ it.discInfo }}</span><span v-else style="color:#bbb;">-</span></td>
          <td style="text-align:right;color:#d84315;font-weight:600;">{{ it.discAmount ? '-'+fmt(it.discAmount) : '-' }}</td>
          <td style="text-align:right;font-weight:700;color:#1a1a1a;">{{ fmt(it.price || 0) }}</td>
          <td style="text-align:center;">
            <span v-if="form.orderStatusCd" style="font-size:10.5px;padding:2px 7px;border-radius:8px;background:#eef4ff;color:#1e40af;font-weight:600;">
              {{ form.orderStatusCd }}
            </span>
            <span v-else style="color:#ccc;">-</span>
          </td>
          <td style="text-align:center;">
            <span style="display:inline-flex;align-items:center;gap:3px;">
              <span :style="{fontSize:'10px',padding:'1px 6px',borderRadius:'8px',color:'#fff',fontWeight:700,background: CLAIM_TYPE_COLOR[form.claimTypeCd]||'#9ca3af'}">{{ form.claimTypeCd }}</span>
              <span style="font-size:10px;padding:1px 6px;border-radius:8px;background:#f3f4f6;color:#374151;font-weight:600;border:1px solid #e5e7eb;">{{ form.claimStatusCd }}</span>
            </span>
          </td>
          <td>
            <div v-if="form.claimTypeCd==='교환'" style="display:flex;flex-direction:column;gap:2px;font-size:10.5px;">
              <span v-if="form.exchangeCourierCd" @click="openTracking(form.exchangeCourierCd, form.exchangeTrackingNo)" style="cursor:pointer;padding:1px 6px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;border-radius:4px;font-weight:700;">
                발송 {{ form.exchangeCourierCd }} · {{ form.exchangeTrackingNo || '-' }} 🔍
              </span>
              <span v-if="form.returnCourierCd" @click="openTracking(form.returnCourierCd, form.returnTrackingNo)" style="cursor:pointer;padding:1px 6px;border:1px solid #fed7aa;background:#fff7ed;color:#c2410c;border-radius:4px;font-weight:700;">
                수거 {{ form.returnCourierCd }} · {{ form.returnTrackingNo || '-' }} 🔍
              </span>
            </div>
            <span v-else style="color:#ccc;">-</span>
          </td>
        </tr>
        <tr v-if="isExpanded(i) && form.claimTypeCd==='교환'" style="background:#f0f7ff;">
          <td colspan="12" style="padding:10px 14px;">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:#3b82f6;color:#fff;font-weight:800;">↔ 교환품</span>
              <span style="font-size:13px;font-weight:700;color:#1e40af;">{{ getExchangedItem(it).prodNm }}</span>
              <span style="font-size:12px;color:#555;">색상: <b>{{ it.color }}</b> → <b style="color:#1e40af;">{{ getExchangedItem(it).color }}</b></span>
              <span style="font-size:12px;color:#555;">사이즈: <b>{{ getExchangedItem(it).size }}</b></span>
              <span style="font-size:12px;color:#555;">수량: <b>{{ getExchangedItem(it).qty }}</b></span>
              <span v-if="getExchangedItem(it).courier" @click="openTracking(getExchangedItem(it).courier, getExchangedItem(it).trackingNo)" style="cursor:pointer;margin-left:auto;padding:2px 8px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;border-radius:4px;font-size:11px;font-weight:700;">
                발송 {{ getExchangedItem(it).courier }} · {{ getExchangedItem(it).trackingNo || '-' }} 🔍
              </span>
            </div>
          </td>
        </tr>
        </template>
      </tbody>
      <tfoot>
        <tr style="background:#fafafa;font-weight:700;">
          <td colspan="5" style="text-align:right;color:#555;">합계</td>
          <td style="text-align:right;color:#666;">{{ fmt(claimItems.reduce((s,x)=>s+(x.salePrice||x.price||0),0)) }}</td>
          <td></td>
          <td style="text-align:right;color:#d84315;">-{{ fmt(claimItems.reduce((s,x)=>s+(x.discAmount||0),0)) }}</td>
          <td style="text-align:right;color:#1a1a1a;">{{ fmt(claimItems.reduce((s,x)=>s+(x.price||0),0)) }}</td>
          <td colspan="3"></td>
        </tr>
      </tfoot>
    </table>
    <div v-else style="text-align:center;color:#bbb;padding:30px;">클레임 항목 정보가 없습니다.</div>
  </div>

  <!-- -- 결제정보 탭 --------------------------------------------------------- -->
  <div v-if="!cfIsNew && showTab('payment')" class="card" style="padding:20px;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">💳 결제정보 <span class="tab-count">{{ cfPaymentList.length }}</span></div>
    <table class="bo-table" v-if="cfPaymentList.length">
      <thead><tr>
        <th style="width:40px;text-align:center;">No.</th>
        <th>환불수단</th><th>환불상태</th><th style="text-align:right;">환불금액</th>
        <th>처리일시</th><th>계좌/카드</th><th>승인번호</th>
      </tr></thead>
      <tbody>
        <tr v-for="(p,i) in cfPaymentList" :key="Math.random()">
          <td style="text-align:center;color:#aaa;">{{ i+1 }}</td>
          <td>{{ p.method }}</td>
          <td><span class="badge badge-orange">{{ p.status }}</span></td>
          <td style="text-align:right;font-weight:700;">{{ fmt(p.amount) }}</td>
          <td>{{ p.payDate }}</td>
          <td>{{ p.account }}</td>
          <td>{{ p.apprNo }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#bbb;padding:30px;">결제·환불 정보가 없습니다.</div>
  </div>

  <!-- -- 상태변경이력 탭 ------------------------------------------------------- -->
  <div v-if="!cfIsNew && showTab('hist')" class="card">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title" style="margin-bottom:10px;padding:0 0 10px 0;">🕒 상태변경이력 <span class="tab-count">{{ cfStatusHistList.length }}</span></div>
    <od-claim-hist :claim-id="form.claimId" :navigate="navigate" :show-ref-modal="showRefModal" :show-toast="showToast" />
  </div>

  <!-- -- 정보수정이력 탭 ------------------------------------------------------- -->
  <div v-if="!cfIsNew && showTab('editHist')" class="card" style="padding:20px;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📝 정보수정이력 <span class="tab-count">{{ cfEditHistList.length }}</span></div>
    <table class="bo-table" v-if="cfEditHistList.length">
      <thead><tr>
        <th style="width:140px;">수정일시</th><th style="width:100px;">수정자</th><th style="width:120px;">항목</th><th>변경 전</th><th>변경 후</th>
      </tr></thead>
      <tbody>
        <tr v-for="(h,i) in cfEditHistList" :key="Math.random()">
          <td>{{ h.date }}</td><td>{{ h.user }}</td><td>{{ h.field }}</td>
          <td style="color:#888;">{{ h.before }}</td>
          <td style="color:#e8587a;font-weight:600;">{{ h.after }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#bbb;padding:30px;">정보 수정 이력이 없습니다.</div>
  </div>
  </div>
</div>
`
};
