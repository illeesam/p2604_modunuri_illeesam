/* ShopJoy Admin - 주문관리 상세/등록 */
window._odOrderDtlState = window._odOrderDtlState || { activeTab: 'info', viewMode: 'tab' };
window.OdOrderDtl = {
  name: 'OdOrderDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, onMounted, onBeforeUnmount, ref, nextTick } = Vue;
    const isNew = computed(() => !props.editId);

    const ORDER_STEPS = ['입금대기', '결제완료', '상품준비중', '배송중', '배송완료', '구매확정'];

    const form = reactive({
      orderId: '', userId: '', userNm: '', orderDate: '', prodNm: '',
      totalPrice: 0, payMethodCd: '무통장입금', statusCd: '입금대기',
      payStatusCd: '결제완료', payDate: '', apprNo: '', payIssuer: '',
      memo: '',
    });
    const PAY_STATUS_OPTIONS = ['미결제','부분결제','결제완료','결제실패','환불중','부분환불','환불완료'];
    const payStatusBadge = (s) => ({
      '미결제':'badge-gray','부분결제':'badge-orange','결제완료':'badge-green',
      '결제실패':'badge-red','환불중':'badge-orange','부분환불':'badge-orange','환불완료':'badge-purple',
    }[s] || 'badge-gray');
    const errors = reactive({});

    const memoEl = ref(null);
    let _qMemo = null;

    const schema = yup.object({
      orderId: yup.string().required('주문ID를 입력해주세요.'),
      userId: yup.string().required('회원ID를 입력해주세요.'),
    });

    onMounted(async () => {
      if (!isNew.value) {
        const o = props.adminData.getOrder(props.editId);
        if (o) {
          Object.assign(form, { ...o });
          if (!form.orderId) form.orderId = props.editId;
          if (o.status) form.statusCd = o.status;
          if (o.payMethod) form.payMethodCd = o.payMethod;
          if (o.payStatus) form.payStatusCd = o.payStatus;
          else if (['취소','자동취소'].includes(o.status)) form.payStatusCd = '환불완료';
          else if (['입금대기'].includes(o.status)) form.payStatusCd = '미결제';
          else form.payStatusCd = '결제완료';
          if (!form.payDate) form.payDate = o.orderDate || '';
          if (!form.apprNo)   form.apprNo  = 'APR-' + String(o.orderId||'').slice(-6) + '01';
          if (!form.payIssuer) form.payIssuer = ({'토스페이먼츠':'토스','카카오페이':'카카오','네이버페이':'네이버','무통장입금':'은행','가상계좌':'은행'}[form.payMethodCd] || '-');
        }
      }
      await nextTick();
      if (memoEl.value) {
        _qMemo = new Quill(memoEl.value, {
          theme: 'snow',
          placeholder: '내용을 입력하세요...',
          modules: { toolbar: [['bold','italic','underline'],[{color:[]}],[{list:'ordered'},{list:'bullet'}],['link','clean']] }
        });
        if (form.memo) _qMemo.root.innerHTML = form.memo;
        _qMemo.on('text-change', () => { form.memo = _qMemo.root.innerHTML; });
      }
    });

    onBeforeUnmount(() => { if (_qMemo) { form.memo = _qMemo.root.innerHTML; _qMemo = null; } });

    const currentStepIdx = computed(() => {
      const idx = ORDER_STEPS.indexOf(form.statusCd);
      return idx !== -1 ? idx : -1;
    });

    const isCanceled = computed(() => form.statusCd === '취소됨');

    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const isNewOrder = isNew.value;
      const ok = await props.showConfirm(isNewOrder ? '등록' : '저장', isNewOrder ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      if (isNewOrder) {
        props.adminData.orders.push({ ...form, totalPrice: Number(form.totalPrice), userId: Number(form.userId) });
      } else {
        const idx = props.adminData.orders.findIndex(x => x.orderId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.orders[idx], { ...form, totalPrice: Number(form.totalPrice) });
      }
      try {
        const res = await (isNewOrder ? window.adminApi.post(`orders/${form.orderId}`, { ...form }) : window.adminApi.put(`orders/${form.orderId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(isNewOrder ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('odOrderMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const activeTab = ref(window._odOrderDtlState.activeTab || 'info');
    Vue.watch(activeTab, v => { window._odOrderDtlState.activeTab = v; });
    /* 주문 항목 (frontoffice orders.json 데이터에서 로드) */
    const orderItems = reactive([]);
    const sampleOrderItems = () => {
      const base = form.prodNm || '주문상품';
      const total = Number(form.totalPrice || 0);
      const shares = [0.55, 0.30, 0.15];
      const discRates = [0.10, 0.05, 0.20];
      const discLabels = ['신규10%', '쿠폰5%', '시즌20%'];
      const defs = [
        { emoji:'👕', prodNm: base,          color:'블랙',   size:'M',    qty:1 },
        { emoji:'👖', prodNm: base+' 추가1', color:'네이비', size:'L',    qty:1 },
        { emoji:'🧦', prodNm: base+' 추가2', color:'화이트', size:'FREE', qty:2 },
      ];
      return defs.map((d,i) => {
        const paid = Math.round(total * shares[i]);
        if (paid <= 0) return null;
        const sale = Math.round(paid / (1 - discRates[i]));
        const disc = sale - paid;
        return { ...d, salePrice: sale, discInfo: discLabels[i], discAmount: disc, price: paid };
      }).filter(Boolean);
    };
    onMounted(async () => {
      try {
        const res = await window.adminApi.get('my/orders.json');
        const o = (res.data || []).find(x => x.orderId === props.editId);
        if (o && o.items && o.items.length) orderItems.splice(0, orderItems.length, ...o.items);
        else orderItems.splice(0, orderItems.length, ...sampleOrderItems());
      } catch (_) { orderItems.splice(0, orderItems.length, ...sampleOrderItems()); }
    });
    const fmt = (n) => Number(n||0).toLocaleString() + '원';

    /* 판매업체 */
    const relatedVendor = computed(() => {
      const o = (props.adminData.orders || []).find(x => x.orderId === props.editId);
      if (!o || !o.vendorId) return null;
      return (props.adminData.vendors || []).find(v => v.vendorId === o.vendorId) || null;
    });

    /* 배송 정보 (이 주문의 택배사 등) */
    const relatedDelivery = computed(() =>
      (props.adminData.deliveries || []).find(d => d.orderId === props.editId)
    );
    /* 클레임 정보 (이 주문에 연결된 클레임) */
    const relatedClaim = computed(() =>
      (props.adminData.claims || []).find(c => c.orderId === props.editId)
    );
    const _claimStatusCodes = (props.adminData.codes || [])
      .filter(c => c.codeGrp === 'CLAIM_STATUS' && c.useYn === 'Y')
      .sort((a, b) => a.sortOrd - b.sortOrd);
    const _TYPE_CD = { '취소': 'CANCEL', '반품': 'RETURN', '교환': 'EXCHANGE' };
    const _claimFlow = type => _claimStatusCodes
      .filter(c => !c.parentCodeValues || c.parentCodeValues.includes('^' + (_TYPE_CD[type] || type) + '^'))
      .map(c => c.codeLabel)
      .filter(l => !['거부','철회'].includes(l));
    const CLAIM_FLOWS = { '취소': _claimFlow('취소'), '반품': _claimFlow('반품'), '교환': _claimFlow('교환') };
    const CLAIM_TYPE_COLOR = { '취소': '#ef4444', '반품': '#FFBB00', '교환': '#3b82f6' };

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

    const paymentList = computed(() => form.totalPrice ? [{
      payMethod: form.payMethodCd || form.payMethod || '-',
      payStatus: form.payStatusCd || '-',
      amount: form.totalPrice, payDate: form.payDate || form.orderDate || '-',
      apprNo: form.apprNo || '-', issuer: form.payIssuer || '-',
    }] : []);
    const statusHistList = computed(() => {
      if (!form.orderId) return [];
      const d = String(form.orderDate || '').slice(0,10) || '-';
      const rows = [
        { date: d+' 09:00', user:'시스템', from:'-', to:'입금대기', memo:'주문 접수' },
        { date: d+' 10:15', user:'admin', from:'입금대기', to:'결제완료', memo:'결제 승인' },
      ];
      if (form.status && !['입금대기','결제완료'].includes(form.status)) {
        rows.push({ date: d+' 14:30', user:'admin', from:'결제완료', to: form.status, memo:'상태 변경' });
      }
      return rows;
    });
    const viewMode2 = ref(window._odOrderDtlState.viewMode || 'tab'); // 'tab' | '2col' | '1col'
    Vue.watch(viewMode2, v => { window._odOrderDtlState.viewMode = v; });
    const showTab = (id) => viewMode2.value !== 'tab' || activeTab.value === id;
    const expandedItems = ref(new Set());
    const toggleExpand = (i) => { const s = new Set(expandedItems.value); if (s.has(i)) s.delete(i); else s.add(i); expandedItems.value = s; };
    const isExpanded = (i) => expandedItems.value.has(i);
    const allExpanded = computed(() => orderItems.length > 0 && orderItems.every((_,i) => expandedItems.value.has(i)));
    const toggleExpandAll = () => {
      if (allExpanded.value) expandedItems.value = new Set();
      else expandedItems.value = new Set(orderItems.map((_,i) => i));
    };
    Vue.watch(orderItems, (list) => { expandedItems.value = new Set(list.map((_,i) => i)); });
    const getExchangedItem = (it) => {
      if (!relatedClaim.value || relatedClaim.value.type !== '교환') return null;
      const swapColor = { '블랙':'네이비','네이비':'차콜','화이트':'아이보리' };
      return {
        prodNm: it.prodNm + ' (교환품)',
        color: swapColor[it.color] || '네이비',
        size: it.size,
        qty: it.qty,
        price: it.price,
        courier: relatedClaim.value.exchangeCourier,
        trackingNo: relatedClaim.value.exchangeTrackingNo,
      };
    };
    const editHistList = computed(() => form.orderId ? [
      { date: String(form.orderDate||'').slice(0,10)+' 11:02', user:'admin', field:'수령인 연락처', before:'010-0000-0000', after: form.phone || '010-1234-5678' },
      { date: String(form.orderDate||'').slice(0,10)+' 13:45', user:'admin', field:'메모',          before:'-',              after:'(수정됨)' },
    ] : []);
    const tabs = computed(() => [
      { id:'info',     label:'상세정보',      icon:'📋' },
      { id:'items',    label:'주문항목',      icon:'📦', count: orderItems.length },
      { id:'payment',  label:'결제정보',      icon:'💳', count: paymentList.value.length },
      { id:'hist',     label:'상태변경이력',  icon:'🕒', count: statusHistList.value.length },
      { id:'editHist', label:'정보수정이력',  icon:'📝', count: editHistList.value.length },
    ]);
    return { isNew, form, errors, save, ORDER_STEPS, currentStepIdx, isCanceled, memoEl, activeTab, orderItems, fmt, relatedClaim, relatedDelivery, relatedVendor, CLAIM_FLOWS, CLAIM_TYPE_COLOR, tabs, editHistList, paymentList, statusHistList, openTracking, PAY_STATUS_OPTIONS, payStatusBadge, viewMode2, showTab, expandedItems, toggleExpand, isExpanded, getExchangedItem, allExpanded, toggleExpandAll };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '주문 등록' : (viewMode ? '주문 상세' : '주문 수정') }}<span v-if="!isNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.orderId }}</span></div>

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

    <!-- 주문 진행 상태 흐름 -->
    <div v-if="!isNew" style="margin-bottom:20px;padding:16px 18px;background:#f6f6f6;border-radius:10px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <span style="font-size:11px;font-weight:800;padding:3px 10px;border-radius:10px;color:#fff;background:#16a34a;">주문</span>
        <span style="font-size:13px;font-weight:700;color:#222;">{{ form.orderId }}</span>
        <span v-if="form.orderDate" style="font-size:11px;color:#888;">{{ form.orderDate }}</span>
      </div>
      <div v-if="isCanceled" style="text-align:center;padding:8px 0;">
        <span style="font-size:14px;font-weight:700;color:#cf1322;letter-spacing:1px;">⊘ 취소됨</span>
      </div>
      <div v-else style="display:flex;align-items:flex-start;overflow-x:auto;">
        <template v-for="(step, idx) in ORDER_STEPS" :key="step">
          <div style="display:flex;flex-direction:column;align-items:center;min-width:80px;flex:1;">
            <div :style="{
              width: idx === currentStepIdx ? '14px' : '10px',
              height: idx === currentStepIdx ? '14px' : '10px',
              borderRadius:'50%', marginBottom:'6px', flexShrink:0, transition:'all .15s',
              boxShadow: idx === currentStepIdx ? '0 0 0 3px rgba(74,222,128,0.3)' : 'none',
              background: idx <= currentStepIdx ? '#4ade80' : '#bbb',
            }"></div>
            <div :style="{
              fontSize:'11.5px', fontWeight: idx === currentStepIdx ? 800 : 600,
              color: idx === currentStepIdx ? '#16a34a' : (idx < currentStepIdx ? '#444' : '#bbb'),
              whiteSpace:'nowrap',
            }">{{ step==='완료' ? '구매확정' : step }}</div>
            <span v-if="step==='배송완료' && relatedDelivery && relatedDelivery.trackingNo"
              @click="openTracking(relatedDelivery.courier, relatedDelivery.trackingNo)"
              title="배송조회 창 열기"
              style="margin-top:4px;padding:1px 7px;border:1px solid #86efac;background:#dcfce7;color:#15803d;border-radius:4px;font-size:0.7rem;font-weight:700;cursor:pointer;user-select:none;">
              {{ (relatedDelivery.courier||'').replace('대한통운','').replace('택배','') || 'CJ' }}배송 🔍
            </span>
          </div>
          <div v-if="idx < ORDER_STEPS.length - 1"
            :style="{flex:'1', height:'2px', minWidth:'12px', marginTop:'6px',
              background: idx < currentStepIdx ? '#4ade80' : '#bbb'}"></div>
        </template>
      </div>
    </div>

    <!-- 클레임 진행 흐름 (있을 때만) -->
    <div v-if="!isNew && relatedClaim" style="margin-bottom:20px;padding:16px;border-radius:10px;border:1px dashed #e8e8e8;"
      :style="{
        background: 'linear-gradient(135deg,'+CLAIM_TYPE_COLOR[relatedClaim.type]+'15 0%,#fff 70%)',
      }">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span :style="{
          fontSize:'11px',padding:'3px 10px',borderRadius:'10px',color:'#fff',fontWeight:800,
          background: CLAIM_TYPE_COLOR[relatedClaim.type],
        }">↩ {{ relatedClaim.type }}</span>
        <span style="font-size:13px;font-weight:700;color:#222;">{{ relatedClaim.claimId }}</span>
        <span style="font-size:11px;color:#888;">신청일: {{ relatedClaim.requestDate }}</span>
        <span v-if="relatedClaim.reason" style="font-size:11px;color:#888;margin-left:auto;">사유: {{ relatedClaim.reason }}</span>
      </div>
      <div style="display:flex;align-items:flex-start;overflow-x:auto;">
        <template v-for="(step, idx) in CLAIM_FLOWS[relatedClaim.type]" :key="step">
          <div style="display:flex;flex-direction:column;align-items:center;min-width:64px;flex:1;">
            <div :style="{
              width: relatedClaim.status===step ? '14px' : '10px',
              height: relatedClaim.status===step ? '14px' : '10px',
              borderRadius:'50%', marginBottom:'6px',
              boxShadow: relatedClaim.status===step ? '0 0 0 3px '+CLAIM_TYPE_COLOR[relatedClaim.type]+'40' : 'none',
              background: CLAIM_FLOWS[relatedClaim.type].indexOf(relatedClaim.status) >= idx ? CLAIM_TYPE_COLOR[relatedClaim.type] : '#bbb',
            }"></div>
            <div :style="{
              fontSize:'10.5px', fontWeight: relatedClaim.status===step ? 800 : 500,
              color: relatedClaim.status===step ? CLAIM_TYPE_COLOR[relatedClaim.type] : (CLAIM_FLOWS[relatedClaim.type].indexOf(relatedClaim.status) > idx ? '#444' : '#bbb'),
              whiteSpace:'nowrap',
            }">{{ step }}</div>
            <span v-if="step==='수거중' && relatedClaim.trackingNo"
              @click="openTracking(relatedClaim.courier, relatedClaim.trackingNo)"
              title="수거 배송조회"
              style="margin-top:4px;padding:1px 7px;border:1px solid #fed7aa;background:#fff7ed;color:#c2410c;border-radius:4px;font-size:0.7rem;font-weight:700;cursor:pointer;user-select:none;">
              {{ (relatedClaim.courier||'').replace('대한통운','').replace('택배','') || 'CJ' }}수거 🔍
            </span>
            <span v-if="step==='완료' && relatedClaim.exchangeTrackingNo"
              @click="openTracking(relatedClaim.exchangeCourier, relatedClaim.exchangeTrackingNo)"
              title="발송 배송조회"
              style="margin-top:4px;padding:1px 7px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;border-radius:4px;font-size:0.7rem;font-weight:700;cursor:pointer;user-select:none;">
              {{ (relatedClaim.exchangeCourier||'').replace('대한통운','').replace('택배','') || 'CJ' }}발송 🔍
            </span>
          </div>
          <div v-if="idx < CLAIM_FLOWS[relatedClaim.type].length - 1"
            :style="{
              flex:1, height:'2px', minWidth:'8px', marginTop:'6px',
              background: CLAIM_FLOWS[relatedClaim.type].indexOf(relatedClaim.status) > idx ? CLAIM_TYPE_COLOR[relatedClaim.type] : '#bbb',
            }"></div>
        </template>
      </div>
    </div>

    <!-- 기본정보 폼 -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">주문ID <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.orderId" placeholder="ORD-2026-XXX" :readonly="!isNew || viewMode" :class="errors.orderId ? 'is-invalid' : ''" />
        <span v-if="errors.orderId" class="field-error">{{ errors.orderId }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">회원ID <span v-if="!viewMode" class="req">*</span></label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input class="form-control" v-model="form.userId" placeholder="회원 ID" :readonly="viewMode" :class="errors.userId ? 'is-invalid' : ''" />
          <span v-if="form.userId" class="ref-link" @click="showRefModal('member', Number(form.userId))">보기</span>
        </div>
        <span v-if="errors.userId" class="field-error">{{ errors.userId }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">회원명</label>
        <input class="form-control" v-model="form.userNm" :readonly="viewMode" />
      </div>
      <div class="form-group">
        <label class="form-label">주문일시</label>
        <input class="form-control" v-model="form.orderDate" placeholder="2026-04-08 10:00" :readonly="viewMode" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">상품</label>
      <input class="form-control" v-model="form.prodNm" placeholder="상품명" :readonly="viewMode" />
    </div>
    <div class="form-group">
      <label class="form-label">판매업체</label>
      <div v-if="relatedVendor" style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:13px;font-weight:700;color:#222;">{{ relatedVendor.vendorNm }}</span>
        <span style="font-size:11px;color:#888;">| {{ relatedVendor.ceo }} | {{ relatedVendor.phone }}</span>
        <span class="ref-link" @click="showRefModal('vendor', relatedVendor.vendorId)">보기</span>
      </div>
      <div v-else style="font-size:12px;color:#bbb;">-</div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">결제금액</label>
        <input class="form-control" type="number" v-model.number="form.totalPrice" :readonly="viewMode" />
      </div>
      <div class="form-group">
        <label class="form-label">결제수단</label>
        <select class="form-control" v-model="form.payMethodCd" :disabled="viewMode">
          <option>계좌이체</option><option>카드결제</option><option>캐쉬</option><option>혼합결제</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">결제상태</label>
        <select class="form-control" v-model="form.payStatusCd" :disabled="viewMode">
          <option v-for="s in PAY_STATUS_OPTIONS" :key="s">{{ s }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">결제일시</label>
        <input class="form-control" v-model="form.payDate" :readonly="viewMode" placeholder="2026-04-05 14:32" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" v-model="form.statusCd" :disabled="viewMode">
          <option>입금대기</option><option>결제완료</option><option>상품준비중</option>
          <option>배송중</option><option>배송완료</option><option>구매확정</option><option>취소</option><option>자동취소</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">메모</label>
      <div v-if="viewMode" class="form-control" style="min-height:90px;line-height:1.6;" v-html="form.memo || '<span style=color:#bbb>-</span>'"></div>
      <div v-else ref="memoEl" style="min-height:90px;background:#fff;"></div>
    </div>
    <div class="form-actions">
      <template v-if="viewMode">
        <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
        <button class="btn btn-secondary" @click="navigate('odOrderMng')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('odOrderMng')">취소</button>
      </template>
    </div>

  </div>

  <!-- 주문항목목록 탭 -->
  <div v-if="!isNew && showTab('items')" class="card" style="padding:20px;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📦 주문항목 <span class="tab-count">{{ orderItems.length }}</span></div>
    <div v-if="relatedClaim && relatedClaim.type==='교환'" style="display:flex;justify-content:flex-end;margin-bottom:10px;">
      <button class="btn btn-secondary btn-sm" @click="toggleExpandAll">
        {{ allExpanded ? '▲ 교환품 모두접기' : '▼ 교환품 모두펼치기' }}
      </button>
    </div>
    <table class="admin-table" v-if="orderItems.length">
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
        <template v-for="(it,i) in orderItems" :key="i">
        <tr>
          <td style="text-align:center;color:#aaa;">
            <span v-if="relatedClaim && relatedClaim.type==='교환'" @click="toggleExpand(i)" style="cursor:pointer;font-size:11px;color:#3b82f6;font-weight:800;user-select:none;" :title="isExpanded(i)?'교환품 숨기기':'교환품 보기'">
              {{ isExpanded(i) ? '▼' : '▶' }}
            </span>
            {{ i+1 }}
          </td>
          <td><span style="font-size:18px;margin-right:6px;">{{ it.emoji || '🛍' }}</span>{{ it.prodNm }}</td>
          <td>{{ it.color || '-' }}</td>
          <td>{{ it.size || '-' }}</td>
          <td style="text-align:center;font-weight:600;">{{ it.qty || 1 }}</td>
          <td style="text-align:right;color:#666;">{{ fmt(it.salePrice || it.price) }}</td>
          <td><span v-if="it.discInfo" style="font-size:11px;padding:2px 7px;border-radius:8px;background:#fff3e0;color:#e65100;font-weight:600;">{{ it.discInfo }}</span><span v-else style="color:#bbb;">-</span></td>
          <td style="text-align:right;color:#d84315;font-weight:600;">{{ it.discAmount ? '-'+fmt(it.discAmount) : '-' }}</td>
          <td style="text-align:right;font-weight:700;color:#1a1a1a;">{{ fmt(it.price) }}</td>
          <td style="text-align:center;"><span style="font-size:10.5px;padding:2px 7px;border-radius:8px;background:#eef4ff;color:#1e40af;font-weight:600;">{{ form.statusCd || form.status || '-' }}</span></td>
          <td style="text-align:center;">
            <span v-if="relatedClaim" style="display:inline-flex;align-items:center;gap:3px;">
              <span :style="{fontSize:'10px',padding:'1px 6px',borderRadius:'8px',color:'#fff',fontWeight:700,background: CLAIM_TYPE_COLOR[relatedClaim.type]||'#9ca3af'}">{{ relatedClaim.type }}</span>
              <span style="font-size:10px;padding:1px 6px;border-radius:8px;background:#f3f4f6;color:#374151;font-weight:600;border:1px solid #e5e7eb;">{{ relatedClaim.status }}</span>
            </span>
            <span v-else style="color:#ccc;">-</span>
          </td>
          <td>
            <div v-if="relatedClaim && relatedClaim.type==='교환'" style="display:flex;flex-direction:column;gap:2px;font-size:10.5px;">
              <span v-if="relatedClaim.exchangeCourier" @click="openTracking(relatedClaim.exchangeCourier, relatedClaim.exchangeTrackingNo)" style="cursor:pointer;padding:1px 6px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;border-radius:4px;font-weight:700;">
                {{ relatedClaim.exchangeCourier }} · {{ relatedClaim.exchangeTrackingNo || '-' }} 🔍
              </span>
              <span v-if="relatedClaim.courier" @click="openTracking(relatedClaim.courier, relatedClaim.trackingNo)" style="cursor:pointer;padding:1px 6px;border:1px solid #fed7aa;background:#fff7ed;color:#c2410c;border-radius:4px;font-weight:700;">
                수거 {{ relatedClaim.courier }} · {{ relatedClaim.trackingNo || '-' }} 🔍
              </span>
            </div>
            <span v-else style="color:#ccc;">-</span>
          </td>
        </tr>
        <tr v-if="isExpanded(i) && relatedClaim && relatedClaim.type==='교환'" style="background:#f0f7ff;">
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
          <td style="text-align:right;color:#666;">{{ fmt(orderItems.reduce((s,x)=>s+(x.salePrice||x.price||0),0)) }}</td>
          <td></td>
          <td style="text-align:right;color:#d84315;">-{{ fmt(orderItems.reduce((s,x)=>s+(x.discAmount||0),0)) }}</td>
          <td style="text-align:right;color:#1a1a1a;">{{ fmt(orderItems.reduce((s,x)=>s+(x.price||0),0)) }}</td>
          <td colspan="3"></td>
        </tr>
      </tfoot>
    </table>
    <div v-else style="text-align:center;color:#bbb;padding:30px;">주문 항목 정보가 없습니다.</div>
  </div>

  <!-- 결제정보 탭 -->
  <div v-if="!isNew && showTab('payment')" class="card" style="padding:20px;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">💳 결제정보 <span class="tab-count">{{ paymentList.length }}</span></div>
    <table class="admin-table" v-if="paymentList.length">
      <thead><tr>
        <th style="width:40px;text-align:center;">No.</th>
        <th>결제수단</th><th>결제상태</th><th style="text-align:right;">결제금액</th>
        <th>결제일시</th><th>승인번호</th><th>카드사/계좌</th>
      </tr></thead>
      <tbody>
        <tr v-for="(p,i) in paymentList" :key="i">
          <td style="text-align:center;color:#aaa;">{{ i+1 }}</td>
          <td>{{ p.payMethod }}</td>
          <td><span class="badge" :class="payStatusBadge(p.payStatus)">{{ p.payStatus }}</span></td>
          <td style="text-align:right;font-weight:700;">{{ fmt(p.amount) }}</td>
          <td>{{ p.payDate }}</td>
          <td>{{ p.apprNo }}</td>
          <td>{{ p.issuer }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#bbb;padding:30px;">결제정보가 없습니다.</div>
  </div>

  <!-- 상태변경이력 탭 -->
  <div v-if="!isNew && showTab('hist')" class="card">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title" style="margin-bottom:10px;padding:0 0 10px 0;">🕒 상태변경이력 <span class="tab-count">{{ statusHistList.length }}</span></div>
    <od-order-hist :order-id="form.orderId" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" />
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
