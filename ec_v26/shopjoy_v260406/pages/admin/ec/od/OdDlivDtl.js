/* ShopJoy Admin - 배송관리 상세/등록 */
window._odDlivDtlState = window._odDlivDtlState || { tab: 'info', viewMode: 'tab' };
window.OdDlivDtl = {
  name: 'OdDlivDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, ref, onMounted, onBeforeUnmount, nextTick } = Vue;
    const isNew = computed(() => !props.editId);
    const tab = ref(window._odDlivDtlState.tab || 'info');
    Vue.watch(tab, v => { window._odDlivDtlState.tab = v; });
    const viewMode2 = ref(window._odDlivDtlState.viewMode || 'tab');
    Vue.watch(viewMode2, v => { window._odDlivDtlState.viewMode = v; });
    const showTab = (id) => viewMode2.value !== 'tab' || tab.value === id;

    const form = reactive({
      dlivId: '', orderId: '', userId: '', userNm: '', receiver: '',
      address: '', phone: '', courierCd: '', trackingNo: '', statusCd: '준비중', regDate: '', memo: '',
    });
    const errors = reactive({});

    const memoEl = ref(null);
    let _qMemo = null;

    const schema = yup.object({
      dlivId: yup.string().required('배송ID를 입력해주세요.'),
      orderId: yup.string().required('주문ID를 입력해주세요.'),
    });

    onMounted(async () => {
      if (!isNew.value) {
        const d = props.adminData.deliveries.find(x => x.dlivId === props.editId);
        if (d) {
          Object.assign(form, { ...d });
          if (!form.dlivId) form.dlivId = props.editId;
          if (d.status) form.statusCd = d.status;
          if (d.courier) form.courierCd = d.courier;
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

    const relatedOrder  = computed(() => props.adminData.getOrder(form.orderId));
    const relatedClaims = computed(() => props.adminData.claims.filter(c => c.orderId === form.orderId));
    const CLAIM_TYPE_COLOR = { '취소':'#ef4444','반품':'#FFBB00','교환':'#3b82f6' };
    const firstClaim = computed(() => relatedClaims.value[0] || null);

    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const isNewDliv = isNew.value;
      const ok = await props.showConfirm(isNewDliv ? '등록' : '저장', isNewDliv ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      if (isNewDliv) {
        props.adminData.deliveries.push({ ...form });
      } else {
        const idx = props.adminData.deliveries.findIndex(x => x.dlivId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.deliveries[idx], { ...form });
      }
      try {
        const res = await (isNewDliv ? window.adminApi.post(`deliveries/${form.dlivId}`, { ...form }) : window.adminApi.put(`deliveries/${form.dlivId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(isNewDliv ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('odDlivMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const dlivItems = reactive([]);
    const sampleDlivItems = () => {
      const rel = props.adminData.orders.find(x => x.orderId === form.orderId);
      const base = rel ? rel.prodNm : (form.receiver || '배송상품');
      const total = rel ? Number(rel.totalPrice || 0) : 30000;
      const shares = [0.50, 0.30, 0.20];
      const discRates = [0.10, 0.08, 0.00];
      const discLabels = ['신규10%','멤버8%','사은품'];
      const defs = [
        { emoji:'📦', prodNm: base,           color:'블랙',    size:'M',   qty:1 },
        { emoji:'👟', prodNm: base+' 세트품', color:'아이보리',size:'260', qty:1 },
        { emoji:'🎁', prodNm: '사은품',        color:'-',       size:'-',   qty:1 },
      ];
      return defs.map((d,i) => {
        const paid = Math.round(total * shares[i]);
        if (paid <= 0) return null;
        const sale = discRates[i] > 0 ? Math.round(paid / (1 - discRates[i])) : paid;
        return { ...d, salePrice: sale, discInfo: discLabels[i], discAmount: sale - paid, price: paid };
      }).filter(Boolean);
    };
    onMounted(async () => {
      try {
        const res = await window.adminApi.get('my/orders.json');
        const oid = props.editId && props.adminData.deliveries.find(d=>d.dlivId===props.editId)?.orderId;
        const o = (res.data || []).find(x => x.orderId === oid);
        if (o && o.items && o.items.length) dlivItems.splice(0, dlivItems.length, ...o.items);
        else dlivItems.splice(0, dlivItems.length, ...sampleDlivItems());
      } catch (_) { dlivItems.splice(0, dlivItems.length, ...sampleDlivItems()); }
    });
    const fmt = (n) => Number(n||0).toLocaleString() + '원';

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
    const DLIV_STEPS = ['준비중', '출고완료', '배송중', '배송완료'];
    const currentStepIdx = computed(() => {
      const i = DLIV_STEPS.indexOf(form.statusCd);
      return i;
    });
    const paymentList = computed(() => form.orderId ? [{
      orderId: form.orderId, dlivFee: form.dlivFee || 0,
      payMethod: form.payMethod || '-', payStatus: form.payStatus || '-',
      payDate: form.regDate || '-',
    }] : []);
    const statusHistList = computed(() => {
      if (!form.dlivId) return [];
      const d = String(form.regDate || '').slice(0,10) || '-';
      const rows = [
        { date: d+' 09:00', user:'시스템', from:'-',     to:'준비중',   memo:'배송 등록' },
      ];
      if (['출고완료','배송중','배송완료'].includes(form.statusCd)) rows.push({ date:d+' 10:00', user:'admin', from:'준비중', to:'출고완료', memo:(form.courierCd||'-')+' 출고' });
      if (['배송중','배송완료'].includes(form.statusCd)) rows.push({ date:d+' 11:30', user:'시스템', from:'출고완료', to:'배송중', memo:'배송 중' });
      if (form.statusCd === '배송완료') rows.push({ date:d+' 15:20', user:'시스템', from:'배송중', to:'배송완료', memo:'수령 완료' });
      return rows;
    });
    const editHistList = computed(() => form.dlivId ? [
      { date: String(form.regDate||'').slice(0,10)+' 10:05', user:'admin', field:'운송장번호', before:'-', after: form.trackingNo || '-' },
      { date: String(form.regDate||'').slice(0,10)+' 10:08', user:'admin', field:'택배사',     before:'-', after: form.courierCd || '-' },
    ] : []);
    const tabs = computed(() => [
      { id:'info',     label:'상세정보',      icon:'📋' },
      { id:'items',    label:'배송항목',      icon:'📦', count: dlivItems.length },
      { id:'payment',  label:'결제정보',      icon:'💳', count: paymentList.value.length },
      { id:'hist',     label:'상태변경이력',  icon:'🕒', count: statusHistList.value.length },
      { id:'editHist', label:'정보수정이력',  icon:'📝', count: editHistList.value.length },
    ]);
    return { isNew, tab, form, errors, save, memoEl, dlivItems, fmt, DLIV_STEPS, currentStepIdx, tabs, editHistList, paymentList, statusHistList, openTracking, relatedOrder, firstClaim, CLAIM_TYPE_COLOR, viewMode2, showTab };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '배송 등록' : (viewMode ? '배송 상세' : '배송 수정') }}<span v-if="!isNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.dlivId }}</span></div>

  <!-- 탭 -->
  <div v-if="!isNew" style="display:flex;gap:8px;margin-bottom:14px;align-items:stretch;">
    <div style="flex:1;display:flex;gap:4px;background:#fff;padding:5px;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
      <button v-for="t in tabs" :key="t.id"
        @click="tab=t.id"
        :disabled="viewMode2!=='tab'"
        :style="{
          flex:1, padding:'11px 12px', border:'none', cursor: viewMode2==='tab'?'pointer':'default', fontSize:'12.5px',
          borderRadius:'9px', transition:'all .18s',
          display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px',
          opacity: viewMode2==='tab' ? 1 : 0.55,
          fontWeight: tab===t.id ? 800 : 600,
          background: (viewMode2==='tab' && tab===t.id) ? 'linear-gradient(135deg,#fff0f4,#ffe4ec)' : 'transparent',
          color: (viewMode2==='tab' && tab===t.id) ? '#e8587a' : '#666',
          boxShadow: (viewMode2==='tab' && tab===t.id) ? '0 2px 8px rgba(232,88,122,0.18)' : 'none',
          borderBottom: (viewMode2==='tab' && tab===t.id) ? '2px solid #e8587a' : '2px solid transparent',
        }">
        <span style="font-size:14px;">{{ t.icon }}</span>
        <span>{{ t.label }}</span>
        <span v-if="t.count !== undefined" :style="{
          fontSize:'10.5px', fontWeight:800, padding:'1px 7px', borderRadius:'10px',
          background: (viewMode2==='tab' && tab===t.id) ? '#e8587a' : '#e5e7eb',
          color: (viewMode2==='tab' && tab===t.id) ? '#fff' : '#666', minWidth:'18px', textAlign:'center',
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
    <!-- 배송 진행 상태 흐름 -->
    <div v-if="!isNew" style="margin-bottom:20px;padding:16px 18px;background:#f6f6f6;border-radius:10px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
        <span style="font-size:11px;font-weight:800;padding:3px 10px;border-radius:10px;color:#fff;background:#0ea5e9;">🚚 배송</span>
        <span style="font-size:13px;font-weight:700;color:#222;">{{ form.dlivId }}</span>
        <span v-if="form.orderId" style="font-size:11px;color:#888;">주문: {{ form.orderId }}</span>
        <span v-if="form.courierCd && form.trackingNo" style="font-size:11px;color:#888;margin-left:auto;">{{ form.courierCd }} · {{ form.trackingNo }}</span>
      </div>
      <div style="display:flex;align-items:flex-start;overflow-x:auto;">
        <template v-for="(step, idx) in DLIV_STEPS" :key="step">
          <div style="display:flex;flex-direction:column;align-items:center;min-width:80px;flex:1;">
            <div :style="{
              width: idx === currentStepIdx ? '14px' : '10px',
              height: idx === currentStepIdx ? '14px' : '10px',
              borderRadius:'50%', marginBottom:'6px', flexShrink:0, transition:'all .15s',
              boxShadow: idx === currentStepIdx ? '0 0 0 3px rgba(14,165,233,0.3)' : 'none',
              background: idx <= currentStepIdx ? '#0ea5e9' : '#bbb',
            }"></div>
            <div :style="{
              fontSize:'11.5px', fontWeight: idx === currentStepIdx ? 800 : 600,
              color: idx === currentStepIdx ? '#0284c7' : (idx < currentStepIdx ? '#444' : '#bbb'),
              whiteSpace:'nowrap',
            }">{{ step }}</div>
            <span v-if="step==='배송완료' && form.trackingNo"
              @click="openTracking(form.courierCd, form.trackingNo)"
              title="배송조회 창 열기"
              style="margin-top:4px;padding:1px 7px;border:1px solid #86efac;background:#dcfce7;color:#15803d;border-radius:4px;font-size:0.7rem;font-weight:700;cursor:pointer;user-select:none;">
              {{ (form.courierCd||'').replace('대한통운','').replace('택배','') || 'CJ' }}배송 🔍
            </span>
            <span v-else-if="step==='배송중' && form.trackingNo && currentStepIdx < 2"
              @click="openTracking(form.courierCd, form.trackingNo)"
              title="배송조회 창 열기"
              style="margin-top:4px;padding:1px 7px;border:1px solid #fed7aa;background:#fff7ed;color:#c2410c;border-radius:4px;font-size:0.7rem;font-weight:700;cursor:pointer;user-select:none;">
              {{ (form.courierCd||'').replace('대한통운','').replace('택배','') || 'CJ' }}배송중 🔍
            </span>
          </div>
          <div v-if="idx < DLIV_STEPS.length - 1"
            :style="{flex:'1', height:'2px', minWidth:'12px', marginTop:'6px',
              background: idx < currentStepIdx ? '#0ea5e9' : '#bbb'}"></div>
        </template>
      </div>
    </div>

    <!-- 기본정보 -->
    <div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">배송ID <span v-if="!viewMode" class="req">*</span></label>
          <input class="form-control" v-model="form.dlivId" placeholder="DLIV-XXX" :readonly="!isNew || viewMode" :class="errors.dlivId ? 'is-invalid' : ''" />
          <span v-if="errors.dlivId" class="field-error">{{ errors.dlivId }}</span>
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
          <label class="form-label">회원명</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input class="form-control" v-model="form.userNm" :readonly="viewMode" />
            <span v-if="form.userId" class="ref-link" @click="showRefModal('member', form.userId)">보기</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">수령인</label>
          <input class="form-control" v-model="form.receiver" :readonly="viewMode" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">배송지 주소</label>
        <input class="form-control" v-model="form.address" placeholder="주소 입력" :readonly="viewMode" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">연락처</label>
          <input class="form-control" v-model="form.phone" placeholder="010-0000-0000" :readonly="viewMode" />
        </div>
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" v-model="form.statusCd" :disabled="viewMode">
            <option>준비중</option><option>출고완료</option><option>배송중</option><option>배송완료</option><option>배송실패</option>
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
          <button class="btn btn-secondary" @click="navigate('odDlivMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" @click="save">저장</button>
          <button class="btn btn-secondary" @click="navigate('odDlivMng')">취소</button>
        </template>
      </div>
    </div>

  </div>

  <!-- 배송항목목록 탭 -->
  <div v-if="!isNew && showTab('items')" class="card" style="padding:20px;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📦 배송항목 <span class="tab-count">{{ dlivItems.length }}</span></div>
    <div style="background:#f9fafb;padding:10px 14px;border-radius:8px;margin-bottom:12px;display:flex;flex-wrap:wrap;gap:14px;font-size:12px;">
      <span><b style="color:#888;">택배사:</b> {{ form.courier || '미지정' }}</span>
      <span><b style="color:#888;">운송장번호:</b> {{ form.trackingNo || '-' }}</span>
      <a v-if="form.courier==='CJ대한통운' && form.trackingNo" :href="'https://trace.cjlogistics.com/next/tracking.html?wblNo='+form.trackingNo" target="_blank" style="color:#1565c0;">조회 →</a>
      <a v-else-if="form.courier==='롯데택배' && form.trackingNo" :href="'https://www.lotteglogis.com/open/tracking?invno='+form.trackingNo" target="_blank" style="color:#1565c0;">조회 →</a>
      <a v-else-if="form.courier==='한진택배' && form.trackingNo" :href="'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnumText2='+form.trackingNo" target="_blank" style="color:#1565c0;">조회 →</a>
    </div>
    <table class="admin-table" v-if="dlivItems.length">
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
        <tr v-for="(it,i) in dlivItems" :key="i">
          <td style="text-align:center;color:#aaa;">{{ i+1 }}</td>
          <td><span style="font-size:18px;margin-right:6px;">{{ it.emoji || '🛍' }}</span>{{ it.prodNm }}</td>
          <td>{{ it.color || '-' }}</td>
          <td>{{ it.size || '-' }}</td>
          <td style="text-align:center;font-weight:600;">{{ it.qty || 1 }}</td>
          <td style="text-align:right;color:#666;">{{ fmt(it.salePrice || it.price) }}</td>
          <td><span v-if="it.discInfo" style="font-size:11px;padding:2px 7px;border-radius:8px;background:#fff3e0;color:#e65100;font-weight:600;">{{ it.discInfo }}</span><span v-else style="color:#bbb;">-</span></td>
          <td style="text-align:right;color:#d84315;font-weight:600;">{{ it.discAmount ? '-'+fmt(it.discAmount) : '-' }}</td>
          <td style="text-align:right;font-weight:700;color:#1a1a1a;">{{ fmt(it.price) }}</td>
          <td style="text-align:center;">
            <span v-if="relatedOrder" style="font-size:10.5px;padding:2px 7px;border-radius:8px;background:#eef4ff;color:#1e40af;font-weight:600;">{{ relatedOrder.status }}</span>
            <span v-else style="color:#ccc;">-</span>
          </td>
          <td style="text-align:center;">
            <span v-if="firstClaim" style="display:inline-flex;align-items:center;gap:3px;">
              <span :style="{fontSize:'10px',padding:'1px 6px',borderRadius:'8px',color:'#fff',fontWeight:700,background: CLAIM_TYPE_COLOR[firstClaim.type]||'#9ca3af'}">{{ firstClaim.type }}</span>
              <span style="font-size:10px;padding:1px 6px;border-radius:8px;background:#f3f4f6;color:#374151;font-weight:600;border:1px solid #e5e7eb;">{{ firstClaim.status }}</span>
            </span>
            <span v-else style="color:#ccc;">-</span>
          </td>
          <td>
            <div v-if="firstClaim && firstClaim.type==='교환'" style="display:flex;flex-direction:column;gap:2px;font-size:10.5px;">
              <span v-if="firstClaim.exchangeCourier" @click="openTracking(firstClaim.exchangeCourier, firstClaim.exchangeTrackingNo)" style="cursor:pointer;padding:1px 6px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;border-radius:4px;font-weight:700;">
                발송 {{ firstClaim.exchangeCourier }} · {{ firstClaim.exchangeTrackingNo || '-' }} 🔍
              </span>
              <span v-if="firstClaim.courier" @click="openTracking(firstClaim.courier, firstClaim.trackingNo)" style="cursor:pointer;padding:1px 6px;border:1px solid #fed7aa;background:#fff7ed;color:#c2410c;border-radius:4px;font-weight:700;">
                수거 {{ firstClaim.courier }} · {{ firstClaim.trackingNo || '-' }} 🔍
              </span>
            </div>
            <span v-else style="color:#ccc;">-</span>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr style="background:#fafafa;font-weight:700;">
          <td colspan="5" style="text-align:right;color:#555;">합계</td>
          <td style="text-align:right;color:#666;">{{ fmt(dlivItems.reduce((s,x)=>s+(x.salePrice||x.price||0),0)) }}</td>
          <td></td>
          <td style="text-align:right;color:#d84315;">-{{ fmt(dlivItems.reduce((s,x)=>s+(x.discAmount||0),0)) }}</td>
          <td style="text-align:right;color:#1a1a1a;">{{ fmt(dlivItems.reduce((s,x)=>s+(x.price||0),0)) }}</td>
          <td colspan="3"></td>
        </tr>
      </tfoot>
    </table>
    <div v-else style="text-align:center;color:#bbb;padding:30px;">배송 항목 정보가 없습니다.</div>
  </div>

  <!-- 결제정보 탭 -->
  <div v-if="!isNew && showTab('payment')" class="card" style="padding:20px;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">💳 결제정보 <span class="tab-count">{{ paymentList.length }}</span></div>
    <table class="admin-table" v-if="paymentList.length">
      <thead><tr>
        <th style="width:40px;text-align:center;">No.</th>
        <th>주문ID</th><th style="text-align:right;">배송비</th><th>결제수단</th><th>결제상태</th><th>결제일시</th>
      </tr></thead>
      <tbody>
        <tr v-for="(p,i) in paymentList" :key="i">
          <td style="text-align:center;color:#aaa;">{{ i+1 }}</td>
          <td><span class="ref-link" @click="showRefModal('order', p.orderId)">{{ p.orderId }}</span></td>
          <td style="text-align:right;font-weight:700;">{{ fmt(p.dlivFee) }}</td>
          <td>{{ p.payMethod }}</td>
          <td><span class="badge badge-blue">{{ p.payStatus }}</span></td>
          <td>{{ p.payDate }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#bbb;padding:30px;">결제정보가 없습니다.</div>
  </div>

  <!-- 배송상태변경이력 탭 -->
  <div v-if="!isNew && showTab('hist')" class="card">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title" style="margin-bottom:10px;padding:0 0 10px 0;">🕒 상태변경이력 <span class="tab-count">{{ statusHistList.length }}</span></div>
    <od-dliv-hist :order-id="form.orderId" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" />
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
