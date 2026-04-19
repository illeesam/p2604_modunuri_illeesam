/* ShopJoy Admin - 클레임관리 상세/등록 */
window._odClaimDtlState = window._odClaimDtlState || { activeTab: 'info', viewMode: 'tab' };
window.OdClaimDtl = {
  name: 'OdClaimDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, ref, onMounted } = Vue;
    const isNew = computed(() => !props.editId);

    const form = reactive({
      claimId: '', userId: '', userNm: '', orderId: '', prodNm: '',
      type: '취소', statusCd: '신청', reasonCd: '', reasonDetail: '',
      refundAmount: 0, refundMethodCd: '계좌환불', requestDate: '', memo: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      claimId: yup.string().required('클레임ID를 입력해주세요.'),
      orderId: yup.string().required('주문ID를 입력해주세요.'),
    });

    /* CLAIM_STEPS: parentCodeValues 기반 동적 파생 */
    const _claimStatusCodes = (props.adminData.codes || [])
      .filter(c => c.codeGrp === 'CLAIM_STATUS' && c.useYn === 'Y')
      .sort((a, b) => a.sortOrd - b.sortOrd);
    const TYPE_CD = { '취소': 'CANCEL', '반품': 'RETURN', '교환': 'EXCHANGE' };
    const CLAIM_STEPS = computed(() => _claimStatusCodes
      .filter(c => !c.parentCodeValues || c.parentCodeValues.includes('^' + (TYPE_CD[form.type] || form.type) + '^'))
      .map(c => c.codeLabel)
      .filter(l => !['거부','철회'].includes(l)));

    const currentStepIdx = computed(() => CLAIM_STEPS.value.indexOf(form.statusCd));
    const statusOptions   = computed(() => CLAIM_STEPS.value);

    onMounted(() => {
      if (!isNew.value) {
        const c = props.adminData.getClaim(props.editId);
        if (c) {
          Object.assign(form, { ...c });
          if (!form.claimId) form.claimId = props.editId;
        }
      }
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
      const isNewClaim = isNew.value;
      const ok = await props.showConfirm(isNewClaim ? '등록' : '저장', isNewClaim ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      if (isNewClaim) {
        props.adminData.claims.push({ ...form, refundAmount: Number(form.refundAmount) });
      } else {
        const idx = props.adminData.claims.findIndex(x => x.claimId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.claims[idx], { ...form, refundAmount: Number(form.refundAmount) });
      }
      try {
        const res = await (isNewClaim ? window.adminApi.post(`claims/${form.claimId}`, { ...form }) : window.adminApi.put(`claims/${form.claimId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(isNewClaim ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('odClaimMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const activeTab = ref(window._odClaimDtlState.activeTab || 'info');
    Vue.watch(activeTab, v => { window._odClaimDtlState.activeTab = v; });
    const viewMode2 = ref(window._odClaimDtlState.viewMode || 'tab');
    Vue.watch(viewMode2, v => { window._odClaimDtlState.viewMode = v; });
    const showTab = (id) => viewMode2.value !== 'tab' || activeTab.value === id;
    const claimItems = reactive([]);
    const sampleClaimItems = () => {
      const base = form.prodNm || '클레임상품';
      const amount = Number(form.refundAmount || 0) || 30000;
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
        return { ...d, salePrice: sale, discInfo: discLabels[i], discAmount: sale - paid, price: paid };
      });
    };
    onMounted(async () => {
      try {
        const res = await window.adminApi.get('my/claims.json');
        const c = (res.data || []).find(x => x.claimId === props.editId);
        if (c && c.items && c.items.length) claimItems.splice(0, claimItems.length, ...c.items);
        else if (c && c.prodNm) claimItems.splice(0, claimItems.length, { prodNm: c.prodNm, qty: 1, price: c.refundAmount || 0 });
        else claimItems.splice(0, claimItems.length, ...sampleClaimItems());
      } catch (_) { claimItems.splice(0, claimItems.length, ...sampleClaimItems()); }
    });
    const fmt = (n) => Number(n||0).toLocaleString() + '원';

    const CLAIM_TYPE_COLOR = { '취소':'#ef4444', '반품':'#FFBB00', '교환':'#3b82f6' };

    const expandedItems = ref(new Set());
    const toggleExpand = (i) => { const s = new Set(expandedItems.value); if (s.has(i)) s.delete(i); else s.add(i); expandedItems.value = s; };
    const isExpanded = (i) => expandedItems.value.has(i);
    const allExpanded = computed(() => claimItems.length > 0 && claimItems.every((_,i) => expandedItems.value.has(i)));
    const toggleExpandAll = () => {
      if (allExpanded.value) expandedItems.value = new Set();
      else expandedItems.value = new Set(claimItems.map((_,i) => i));
    };
    Vue.watch(claimItems, (list) => { expandedItems.value = new Set(list.map((_,i) => i)); });
    const getExchangedItem = (it) => {
      if (form.type !== '교환') return null;
      const swapColor = { '블랙':'네이비','네이비':'차콜','화이트':'아이보리','차콜':'블랙' };
      return {
        prodNm: it.prodNm + ' (교환품)',
        color: swapColor[it.color] || '네이비',
        size: it.size, qty: it.qty, price: it.price,
        courier: form.exchangeCourier,
        trackingNo: form.exchangeTrackingNo,
      };
    };

    const trackingUrl = (courier, no) => {
      if (!no) return '';
      if (courier === 'CJ대한통운') return 'https://trace.cjlogistics.com/next/tracking.html?wblNo=' + no;
      if (courier === '롯데택배')   return 'https://www.lotteglogis.com/open/tracking?invno=' + no;
      if (courier === '한진택배')   return 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnumText2=' + no;
      if (courier === '우체국택배') return 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=' + no;
      if (courier === '로젠택배')   return 'https://www.ilogen.com/web/personal/trace/' + no;
      return '';
    };
    const openTracking = (courier, no) => {
      const url = trackingUrl(courier, no);
      if (!url) { props.showToast && props.showToast('운송장 정보가 없습니다.', 'error'); return; }
      window.open(url, 'dlivTrack', 'width=900,height=760,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes');
    };
    const paymentList = computed(() => form.refundAmount || form.claimId ? [{
      method: form.refundMethodCd || '-', status: form.statusCd || '-',
      amount: form.refundAmount || 0, payDate: form.requestDate || '-',
      account: form.refundAccount || '-', apprNo: form.apprNo || '-',
    }] : []);
    const statusHistList = computed(() => {
      if (!form.claimId) return [];
      const d = String(form.requestDate || '').slice(0,10) || '-';
      return [
        { date: d+' 09:10', user:'회원',   from:'-',           to: form.type+'요청', memo: form.type+' 접수' },
        { date: d+' 11:30', user:'admin',  from: form.type+'요청', to:'처리중',        memo:'검토 후 처리 시작' },
        { date: d+' 15:00', user:'admin',  from:'처리중',      to: form.statusCd,  memo:'상태 갱신' },
      ];
    });
    const editHistList = computed(() => form.claimId ? [
      { date: String(form.requestDate||'').slice(0,10)+' 10:00', user:'admin', field:'사유',      before:'-', after: form.reasonCd || '-' },
      { date: String(form.requestDate||'').slice(0,10)+' 12:20', user:'admin', field:'환불금액',  before:'0', after: (form.refundAmount||0).toLocaleString() },
    ] : []);
    const tabs = computed(() => [
      { id:'info',     label:'상세정보',      icon:'📋' },
      { id:'items',    label:'클레임항목',    icon:'↩', count: claimItems.length },
      { id:'payment',  label:'결제정보',      icon:'💳', count: paymentList.value.length },
      { id:'hist',     label:'상태변경이력',  icon:'🕒', count: statusHistList.value.length },
      { id:'editHist', label:'정보수정이력',  icon:'📝', count: editHistList.value.length },
    ]);
    return { isNew, form, errors, statusOptions, CLAIM_STEPS, currentStepIdx, save, activeTab, claimItems, fmt, CLAIM_TYPE_COLOR, tabs, editHistList, paymentList, statusHistList, openTracking, expandedItems, toggleExpand, isExpanded, getExchangedItem, allExpanded, toggleExpandAll, viewMode2, showTab };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '클레임 등록' : (viewMode ? '클레임 상세' : '클레임 수정') }}<span v-if="!isNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.claimId }}</span></div>

  <!-- 탭 -->
  <div v-if="!isNew" style="display:flex;gap:8px;margin-bottom:14px;align-items:stretch;">
    <div style="flex:1;display:flex;gap:4px;background:#fff;padding:5px;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
      <button v-for="t in tabs" :key="t.id"
        @click="activeTab=t.id"
        :disabled="viewMode2!=='tab'"
        :style="{
          flex:1, padding:'11px 12px', border:'none', cursor: viewMode2==='tab'?'pointer':'default', fontSize:'12.5px',
          borderRadius:'9px', transition:'all .18s',
          display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px',
          opacity: viewMode2==='tab' ? 1 : 0.55,
          fontWeight: activeTab===t.id ? 800 : 600,
          background: (viewMode2==='tab' && activeTab===t.id) ? 'linear-gradient(135deg,#fff0f4,#ffe4ec)' : 'transparent',
          color: (viewMode2==='tab' && activeTab===t.id) ? '#e8587a' : '#666',
          boxShadow: (viewMode2==='tab' && activeTab===t.id) ? '0 2px 8px rgba(232,88,122,0.18)' : 'none',
          borderBottom: (viewMode2==='tab' && activeTab===t.id) ? '2px solid #e8587a' : '2px solid transparent',
        }">
        <span style="font-size:14px;">{{ t.icon }}</span>
        <span>{{ t.label }}</span>
        <span v-if="t.count !== undefined" :style="{
          fontSize:'10.5px', fontWeight:800, padding:'1px 7px', borderRadius:'10px',
          background: (viewMode2==='tab' && activeTab===t.id) ? '#e8587a' : '#e5e7eb',
          color: (viewMode2==='tab' && activeTab===t.id) ? '#fff' : '#666', minWidth:'18px', textAlign:'center',
        }">{{ t.count }}</span>
      </button>
    </div>
    <div style="display:flex;gap:3px;background:#fff;padding:5px;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
      <button v-for="v in [{id:'tab',label:'탭',icon:'📑'},{id:'1col',label:'1열',icon:'1▭'},{id:'2col',label:'2열',icon:'2▭'},{id:'3col',label:'3열',icon:'3▭'},{id:'4col',label:'4열',icon:'4▭'}]" :key="v.id"
        @click="viewMode2=v.id" :title="v.label+'로 보기'"
        :style="{
          padding:'8px 12px', border:'none', cursor:'pointer', fontSize:'13px', borderRadius:'8px',
          fontWeight: viewMode2===v.id ? 800 : 600,
          background: viewMode2===v.id ? 'linear-gradient(135deg,#fff0f4,#ffe4ec)' : 'transparent',
          color: viewMode2===v.id ? '#e8587a' : '#888',
          boxShadow: viewMode2===v.id ? '0 2px 6px rgba(232,88,122,0.18)' : 'none',
        }">
        <span style="font-size:15px;">{{ v.icon }}</span>
      </button>
    </div>
  </div>
  <div :class="viewMode2!=='tab' ? 'dtl-tab-grid cols-'+viewMode2.charAt(0) : ''">

  <div v-if="isNew || showTab('info')" class="card">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📋 상세정보</div>

    <!-- 클레임 진행 상태 흐름 -->
    <div v-if="!isNew" style="margin-bottom:20px;padding:16px 18px;background:#f6f6f6;border-radius:10px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
        <span :style="{
          fontSize:'11px',padding:'3px 10px',borderRadius:'10px',color:'#fff',fontWeight:800,
          background: CLAIM_TYPE_COLOR[form.type] || '#9ca3af',
        }">↩ {{ form.type }}</span>
        <span style="font-size:13px;font-weight:700;color:#222;">{{ form.claimId }}</span>
        <span v-if="form.requestDate" style="font-size:11px;color:#888;">신청일: {{ form.requestDate }}</span>
        <span v-if="form.reason" style="font-size:11px;color:#888;margin-left:auto;">사유: {{ form.reason }}</span>
      </div>
      <div style="display:flex;align-items:flex-start;overflow-x:auto;">
        <template v-for="(step, idx) in CLAIM_STEPS" :key="step">
          <div style="display:flex;flex-direction:column;align-items:center;min-width:80px;flex:1;">
            <div :style="{
              width: idx === currentStepIdx ? '14px' : '10px',
              height: idx === currentStepIdx ? '14px' : '10px',
              borderRadius:'50%', marginBottom:'6px', flexShrink:0, transition:'all .15s',
              boxShadow: idx === currentStepIdx ? '0 0 0 3px '+(CLAIM_TYPE_COLOR[form.type]||'#9ca3af')+'40' : 'none',
              background: idx <= currentStepIdx ? (CLAIM_TYPE_COLOR[form.type]||'#9ca3af') : '#bbb',
            }"></div>
            <div :style="{
              fontSize:'11.5px', fontWeight: idx === currentStepIdx ? 800 : 600,
              color: idx === currentStepIdx ? (CLAIM_TYPE_COLOR[form.type]||'#9ca3af') : (idx < currentStepIdx ? '#444' : '#bbb'),
              whiteSpace:'nowrap', textAlign:'center',
            }">{{ step }}</div>
            <span v-if="step==='수거중' && form.trackingNo"
              @click="openTracking(form.courier, form.trackingNo)"
              title="수거 배송조회"
              style="margin-top:4px;padding:1px 7px;border:1px solid #fed7aa;background:#fff7ed;color:#c2410c;border-radius:4px;font-size:0.7rem;font-weight:700;cursor:pointer;user-select:none;">
              {{ (form.courier||'').replace('대한통운','').replace('택배','') || 'CJ' }}수거 🔍
            </span>
            <span v-if="step==='완료' && form.exchangeTrackingNo"
              @click="openTracking(form.exchangeCourier, form.exchangeTrackingNo)"
              title="발송 배송조회"
              style="margin-top:4px;padding:1px 7px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;border-radius:4px;font-size:0.7rem;font-weight:700;cursor:pointer;user-select:none;">
              {{ (form.exchangeCourier||'').replace('대한통운','').replace('택배','') || 'CJ' }}발송 🔍
            </span>
          </div>
          <div v-if="idx < CLAIM_STEPS.length - 1"
            :style="{flex:'1', height:'2px', minWidth:'12px', marginTop:'6px',
              background: idx < currentStepIdx ? (CLAIM_TYPE_COLOR[form.type]||'#9ca3af') : '#bbb'}"></div>
        </template>
      </div>
    </div>

    <!-- 기본정보 폼 -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">클레임ID <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.claimId" placeholder="CLM-2026-XXX" :readonly="!isNew || viewMode" :class="errors.claimId ? 'is-invalid' : ''" />
        <span v-if="errors.claimId" class="field-error">{{ errors.claimId }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">주문ID <span v-if="!viewMode" class="req">*</span></label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input class="form-control" v-model="form.orderId" placeholder="ORD-2026-XXX" :readonly="viewMode" :class="errors.orderId ? 'is-invalid' : ''" />
          <span v-if="form.orderId" class="ref-link" @click="showRefModal('order', form.orderId)">보기</span>
        </div>
        <span v-if="errors.orderId" class="field-error">{{ errors.orderId }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">회원ID</label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input class="form-control" v-model="form.userId" placeholder="회원 ID" :readonly="viewMode" />
          <span v-if="form.userId" class="ref-link" @click="showRefModal('member', Number(form.userId))">보기</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">회원명</label>
        <input class="form-control" v-model="form.userNm" :readonly="viewMode" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">클레임 유형</label>
        <select class="form-control" v-model="form.type" :disabled="viewMode">
          <option>취소</option><option>반품</option><option>교환</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">처리 상태</label>
        <select class="form-control" v-model="form.statusCd" :disabled="viewMode">
          <option v-for="s in statusOptions" :key="s">{{ s }}</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">상품명</label>
      <input class="form-control" v-model="form.prodNm" :readonly="viewMode" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사유</label>
        <input class="form-control" v-model="form.reasonCd" :readonly="viewMode" />
      </div>
      <div class="form-group">
        <label class="form-label">신청일</label>
        <input class="form-control" v-model="form.requestDate" placeholder="2026-04-08 10:00" :readonly="viewMode" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">상세 사유</label>
      <textarea class="form-control" v-model="form.reasonDetail" rows="3" :readonly="viewMode"></textarea>
    </div>
    <div class="form-actions">
      <template v-if="viewMode">
        <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
        <button class="btn btn-secondary" @click="navigate('odClaimMng')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('odClaimMng')">취소</button>
      </template>
    </div>

  </div>

  <!-- 클레임항목목록 탭 -->
  <div v-if="!isNew && showTab('items')" class="card" style="padding:20px;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">↩ 클레임항목 <span class="tab-count">{{ claimItems.length }}</span></div>
    <div v-if="form.type==='교환'" style="display:flex;justify-content:flex-end;margin-bottom:10px;">
      <button class="btn btn-secondary btn-sm" @click="toggleExpandAll">
        {{ allExpanded ? '▲ 교환품 모두접기' : '▼ 교환품 모두펼치기' }}
      </button>
    </div>
    <table class="admin-table" v-if="claimItems.length">
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
        <template v-for="(it,i) in claimItems" :key="i">
        <tr>
          <td style="text-align:center;color:#aaa;">
            <span v-if="form.type==='교환'" @click="toggleExpand(i)" style="cursor:pointer;font-size:11px;color:#3b82f6;font-weight:800;user-select:none;" :title="isExpanded(i)?'교환품 숨기기':'교환품 보기'">
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
            <span v-if="adminData.getOrder && adminData.getOrder(form.orderId)" style="font-size:10.5px;padding:2px 7px;border-radius:8px;background:#eef4ff;color:#1e40af;font-weight:600;">
              {{ adminData.getOrder(form.orderId).status }}
            </span>
            <span v-else style="color:#ccc;">-</span>
          </td>
          <td style="text-align:center;">
            <span style="display:inline-flex;align-items:center;gap:3px;">
              <span :style="{fontSize:'10px',padding:'1px 6px',borderRadius:'8px',color:'#fff',fontWeight:700,background: CLAIM_TYPE_COLOR[form.type]||'#9ca3af'}">{{ form.type }}</span>
              <span style="font-size:10px;padding:1px 6px;border-radius:8px;background:#f3f4f6;color:#374151;font-weight:600;border:1px solid #e5e7eb;">{{ form.statusCd }}</span>
            </span>
          </td>
          <td>
            <div v-if="form.type==='교환'" style="display:flex;flex-direction:column;gap:2px;font-size:10.5px;">
              <span v-if="form.exchangeCourier" @click="openTracking(form.exchangeCourier, form.exchangeTrackingNo)" style="cursor:pointer;padding:1px 6px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;border-radius:4px;font-weight:700;">
                발송 {{ form.exchangeCourier }} · {{ form.exchangeTrackingNo || '-' }} 🔍
              </span>
              <span v-if="form.courier" @click="openTracking(form.courier, form.trackingNo)" style="cursor:pointer;padding:1px 6px;border:1px solid #fed7aa;background:#fff7ed;color:#c2410c;border-radius:4px;font-weight:700;">
                수거 {{ form.courier }} · {{ form.trackingNo || '-' }} 🔍
              </span>
            </div>
            <span v-else style="color:#ccc;">-</span>
          </td>
        </tr>
        <tr v-if="isExpanded(i) && form.type==='교환'" style="background:#f0f7ff;">
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

  <!-- 결제정보 탭 -->
  <div v-if="!isNew && showTab('payment')" class="card" style="padding:20px;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">💳 결제정보 <span class="tab-count">{{ paymentList.length }}</span></div>
    <table class="admin-table" v-if="paymentList.length">
      <thead><tr>
        <th style="width:40px;text-align:center;">No.</th>
        <th>환불수단</th><th>환불상태</th><th style="text-align:right;">환불금액</th>
        <th>처리일시</th><th>계좌/카드</th><th>승인번호</th>
      </tr></thead>
      <tbody>
        <tr v-for="(p,i) in paymentList" :key="i">
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

  <!-- 상태변경이력 탭 -->
  <div v-if="!isNew && showTab('hist')" class="card">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title" style="margin-bottom:10px;padding:0 0 10px 0;">🕒 상태변경이력 <span class="tab-count">{{ statusHistList.length }}</span></div>
    <od-claim-hist :claim-id="form.claimId" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" />
  </div>

  <!-- 정보수정이력 탭 -->
  <div v-if="!isNew && showTab('editHist')" class="card" style="padding:20px;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📝 정보수정이력 <span class="tab-count">{{ editHistList.length }}</span></div>
    <table class="admin-table" v-if="editHistList.length">
      <thead><tr>
        <th style="width:140px;">수정일시</th><th style="width:100px;">수정자</th><th style="width:120px;">항목</th><th>변경 전</th><th>변경 후</th>
      </tr></thead>
      <tbody>
        <tr v-for="(h,i) in editHistList" :key="i">
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
