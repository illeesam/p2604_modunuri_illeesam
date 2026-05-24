/* ShopJoy Admin - 주문관리 상세/등록 */
window._odOrderDtlState = window._odOrderDtlState || { activeTab: 'info', tabMode: 'tab' };
window.OdOrderDtl = {
  name: 'OdOrderDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    tabMode:      { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, computed, onMounted, watch, onBeforeUnmount, nextTick } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const vendors = reactive([]);
    const deliveries = reactive([]);
    const claims = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, activeTab: window._odOrderDtlState?.activeTab || 'info', tabMode2: window._odOrderDtlState.tabMode || 'tab' });
    const tab = Vue.toRef(uiState, 'tab');
    const activeTab = Vue.toRef(uiState, 'activeTab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({ claim_statuses: [], order_statuses: [], payment_methods: [], pay_statuses: [] });

    const cfIsNew = computed(() => !props.dtlId);

    // 단건 GET
    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* handleSearchDetail — 처리 */
    const handleSearchDetail = async () => {
      if (cfIsNew.value) return;
      uiState.loading = true;
      try {
        const [orderRes, vendorsRes, deliveriesRes, claimsRes] = await Promise.all([
          boApiSvc.odOrder.getById(props.dtlId, '주문관리', '상세조회'),
          boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 10000 }, '주문관리', '조회'),
          boApiSvc.odDliv.getPage({ pageNo: 1, pageSize: 10000 }, '주문관리', '조회'),
          boApiSvc.odClaim.getPage({ pageNo: 1, pageSize: 10000 }, '주문관리', '조회'),
        ]);
        const o = orderRes.data?.data || orderRes.data || {};
        Object.assign(form, { ...o });
        if (!form.orderId) form.orderId = props.dtlId;
        if (o.orderStatusCd) form.orderStatusCd = o.orderStatusCd;
        if (o.payMethodCd) form.payMethodCd = o.payMethodCd;
        if (o.payStatus) form.payStatusCd = o.payStatus;
        else if (['취소','자동취소'].includes(o.orderStatusCd)) form.payStatusCd = '환불완료';
        else if (['입금대기'].includes(o.orderStatusCd)) form.payStatusCd = '미결제';
        else form.payStatusCd = '결제완료';
        if (!form.payDate) form.payDate = o.orderDate || '';
        if (!form.apprNo)   form.apprNo  = 'APR-' + String(o.orderId||'').slice(-6) + '01';
        if (!form.payIssuer) form.payIssuer = ({'토스페이먼츠':'토스','카카오페이':'카카오','네이버페이':'네이버','무통장입금':'은행','가상계좌':'은행'}[form.payMethodCd] || '-');
        vendors.splice(0, vendors.length, ...(vendorsRes.data?.data?.pageList || vendorsRes.data?.data?.list || []));
        deliveries.splice(0, deliveries.length, ...(deliveriesRes.data?.data?.pageList || deliveriesRes.data?.data?.list || []));
        claims.splice(0, claims.length, ...(claimsRes.data?.data?.pageList || claimsRes.data?.data?.list || []));
        // getById 응답에 임베드된 결제내역(orderPays) 사용
        payments.splice(0, payments.length, ...((o.orderPays || []).map(p => ({
          payMethod: p.payMethodCd || '-',
          payStatus: p.payStatusCd || '-',
          amount: p.payAmt || 0,
          payDate: p.payDate || '-',
          apprNo: p.pgTransactionId || '-',
          issuer: p.refundAmt ? ('환불 ' + p.refundAmt) : '-',
        }))));
        // getById 응답에 임베드된 주문항목(orderItems) 사용
        orderItems.splice(0, orderItems.length, ...((o.orderItems || []).map(it => ({
          ...it,
          prodNm: it.prodNm,
          color: it.optItemId1 || '',
          size: it.optItemId2 || '',
          qty: it.orderQty || 1,
          salePrice: it.normalPrice || it.unitPrice || 0,
          price: it.itemOrderAmt || (it.unitPrice * (it.orderQty || 1)) || 0,
          discAmount: it.discAmount || 0,
          discInfo: it.discInfo || '',
        }))));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.claim_statuses = codeStore.sgGetGrpCodes('CLAIM_STATUS');
      codes.order_statuses = codeStore.sgGetGrpCodes('ORDER_STATUS');
      codes.payment_methods = codeStore.sgGetGrpCodes('PAYMENT_METHOD');
      codes.pay_statuses = codeStore.sgGetGrpCodes('PAY_STATUS');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    const ORDER_STEPS = ['입금대기', '결제완료', '상품준비중', '배송중', '배송완료', '구매확정'];

    const form = reactive({
      orderId: '', memberId: '', memberNm: '', orderDate: '', prodNm: '',
      totalAmt: 0, payMethodCd: '무통장입금', orderStatusCd: '입금대기',
      payStatusCd: '결제완료', payDate: '', apprNo: '', payIssuer: '',
      memo: '',
    });
    const PAY_STATUS_FALLBACK = ['미결제','부분결제','결제완료','결제실패','환불중','부분환불','환불완료'];

    /* 주문 fnPayStatusBadge — 공통코드 PAY_STATUS 우선, 미매칭 시 로컬 fallback */
    const _PAY_STATUS_FB = {
      '미결제':'badge-gray','부분결제':'badge-orange','결제완료':'badge-green',
      '결제실패':'badge-red','환불중':'badge-orange','부분환불':'badge-orange','환불완료':'badge-purple',
    };
    /* fnPayStatusBadge — 유틸 */
    const fnPayStatusBadge = s => coUtil.cofCodeBadge('PAY_STATUS', s, _PAY_STATUS_FB[s] || 'badge-gray');
    const errors = reactive({});

    const schema = yup.object({
      orderId: yup.string().required('주문ID를 입력해주세요.'),
      memberId: yup.string().required('회원ID를 입력해주세요.'),
    });

    const cfCurrentStepIdx = computed(() => {
      const idx = ORDER_STEPS.indexOf(form.orderStatusCd);
      return idx !== -1 ? idx : -1;
    });

    const cfIsCanceled = computed(() => form.orderStatusCd === '취소됨');

    /* handleSave — 저장 */
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
      const isNewOrder = cfIsNew.value;
      const ok = await showConfirm(isNewOrder ? '등록' : '저장', isNewOrder ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      try {
        const res = await (isNewOrder
          ? boApiSvc.odOrder.create({ ...form, totalAmt: Number(form.totalAmt) }, '주문관리', '등록')
          : boApiSvc.odOrder.update(form.orderId, { ...form, totalAmt: Number(form.totalAmt) }, '주문관리', '저장'));
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast(isNewOrder ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('odOrderMng', { reload: true });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

        watch(() => uiState.activeTab, (newVal) => { window._odOrderDtlState.activeTab = newVal; });
    /* 주문 항목 / 결제내역 (getById 임베드) */
    const orderItems = reactive([]);
    const payments = reactive([]);

    /* sampleOrderItems — 샘플 주문 Items */
    const sampleOrderItems = () => {
      const base = form.prodNm || '주문상품';
      const total = Number(form.totalAmt || 0);
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

    /* initItems — 초기화 */
    const initItems = async () => {};

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      await handleSearchDetail();
      await initItems();
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) return;
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleSearchDetail();
    });

    /* fmt — 포맷 */
    const fmt = (n) => Number(n||0).toLocaleString() + '원';

    /* 판매업체 */
    const cfRelatedVendor = computed(() => {
      if (!form.vendorId) return null;
      return vendors.find(v => v.vendorId === form.vendorId) || null;
    });

    /* 배송 정보 (이 주문의 택배사 등) */
    const cfRelatedDelivery = computed(() =>
      (deliveries).find(d => d.orderId === props.dtlId)
    );
    /* 클레임 정보 (이 주문에 연결된 클레임) */
    const cfRelatedClaim = computed(() =>
      (claims).find(c => c.orderId === props.dtlId)
    );
    const _TYPE_CD = { '취소': 'CANCEL', '반품': 'RETURN', '교환': 'EXCHANGE' };
    const cfClaimStatusCodes = computed(() =>
      (codes.claim_statuses || [])
        .filter(c => c.useYn === 'Y')
        .sort((a, b) => a.sortOrd - b.sortOrd)
    );

    /* _claimFlow — 클레임 흐름 */
    const _claimFlow = type => cfClaimStatusCodes.value
      .filter(c => !c.parentCodeValues || c.parentCodeValues.includes('^' + (_TYPE_CD[type] || type) + '^'))
      .map(c => c.codeLabel)
      .filter(l => !['거부','철회'].includes(l));
    const CLAIM_FLOWS = { '취소': _claimFlow('취소'), '반품': _claimFlow('반품'), '교환': _claimFlow('교환') };
    const CLAIM_TYPE_COLOR = { '취소': '#ef4444', '반품': '#FFBB00', '교환': '#3b82f6' };

    /* trackingUrl — 추적 URL */
    const trackingUrl = (courier, no) => {
      if (!no) return '';
      if (courier === 'CJ대한통운') return 'https://trace.cjlogistics.com/next/tracking.html?wblNo=' + no;
      if (courier === '롯데택배')   return 'https://www.lotteglogis.com/open/tracking?invno=' + no;
      if (courier === '한진택배')   return 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnumText2=' + no;
      if (courier === '우체국택배') return 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=' + no;
      if (courier === '로젠택배')   return 'https://www.ilogen.com/web/personal/trace/' + no;
      return '';
    };

    /* openTracking — 열기 */
    const openTracking = (courier, no) => {
      const url = trackingUrl(courier, no);
      if (!url) { showToast && showToast('운송장 정보가 없습니다.', 'error'); return; }
      window.open(url, 'dlivTrack', 'width=900,height=760,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes');
    };

    const cfPaymentList = computed(() => payments.length ? payments : (form.totalAmt ? [{
      payMethod: form.payMethodCd || '-',
      payStatus: form.payStatusCd || '-',
      amount: form.totalAmt, payDate: form.payDate || form.orderDate || '-',
      apprNo: form.apprNo || '-', issuer: form.payIssuer || '-',
    }] : []));
    const cfStatusHistList = computed(() => {
      if (!form.orderId) return [];
      const d = String(form.orderDate || '').slice(0,10) || '-';
      const rows = [
        { date: d+' 09:00', user:'시스템', from:'-', to:'입금대기', memo:'주문 접수' },
        { date: d+' 10:15', user:'bo', from:'입금대기', to:'결제완료', memo:'결제 승인' },
      ];
      if (form.orderStatusCd && !['입금대기','결제완료'].includes(form.orderStatusCd)) {
        rows.push({ date: d+' 14:30', user:'bo', from:'결제완료', to: form.orderStatusCd, memo:'상태 변경' });
      }
      return rows;
    });
     // 'tab' | '2col' | '1col'

    watch(() => uiState.tabMode2, v => { window._odOrderDtlState.tabMode = v; });

    /* showTab — 표시 */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.activeTab === id;
    const expandedItems = reactive(new Set());

    /* toggleExpand — 토글 */
    const toggleExpand = (i) => { const s = new Set(expandedItems); if (s.has(i)) s.delete(i); else s.add(i); expandedItems = s; };

    /* isExpanded — 여부 확인 */
    const isExpanded = (i) => expandedItems.has(i);
    /* fnItemExpanded — 유틸 */
    const fnItemExpanded = (row, i) => isExpanded(i) && !!cfRelatedClaim.value && cfRelatedClaim.value.type === '교환';
    const cfAllExpanded = computed(() => orderItems.length > 0 && window.safeArrayUtils.safeEvery(orderItems, (_,i) => expandedItems.has(i)));

    /* toggleExpandAll — 토글 */
    const toggleExpandAll = () => {
      if (cfAllExpanded.value) expandedItems = new Set();
      else expandedItems = new Set(orderItems.map((_,i) => i));
    };

    watch(orderItems, (list) => { expandedItems = new Set(list.map((_,i) => i)); });

    /* getExchangedItem — 조회 */
    const getExchangedItem = (it) => {
      if (!cfRelatedClaim.value || cfRelatedClaim.value.type !== '교환') return null;
      const swapColor = { '블랙':'네이비','네이비':'차콜','화이트':'아이보리' };

      return {
        prodNm: it.prodNm + ' (교환품)',
        color: swapColor[it.color] || '네이비',
        size: it.size,
        qty: it.qty,
        price: it.price,
        courier: cfRelatedClaim.value.exchangeCourier,
        trackingNo: cfRelatedClaim.value.exchangeTrackingNo,
      };
    };
    const cfEditHistList = computed(() => form.orderId ? [
      { date: String(form.orderDate||'').slice(0,10)+' 11:02', user:'bo', field:'수령인 연락처', before:'010-0000-0000', after: form.phone || '010-1234-5678' },
      { date: String(form.orderDate||'').slice(0,10)+' 13:45', user:'bo', field:'메모',          before:'-',              after:'(수정됨)' },
    ] : []);
    const cfTabs = computed(() => [
      { id:'info',     label:'상세정보',      icon:'📋' },
      { id:'items',    label:'주문항목',      icon:'📦', count: orderItems.length },
      { id:'payment',  label:'결제정보',      icon:'💳', count: cfPaymentList.value.length },
      { id:'hist',     label:'상태변경이력',  icon:'🕒', count: cfStatusHistList.value.length },
      { id:'editHist', label:'정보수정이력',  icon:'📝', count: cfEditHistList.value.length },
    ]);
    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    /* 결제정보 그리드 컬럼 (번호 컬럼은 bo-grid 자동) */
    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================

    // --- [컬럼 정의] ---
    const paymentGridColumns = [
      { key: 'payMethod', label: '결제수단' },
      { key: 'payStatus', label: '결제상태', badge: (row) => fnPayStatusBadge(row.payStatus) },
      { key: 'amount',    label: '결제금액', style: 'text-align:right;',
        align: 'right', fmt: (v) => fmt(v), cellStyle: 'font-weight:700;' },
      { key: 'payDate',   label: '결제일시' },
      { key: 'apprNo',    label: '승인번호' },
      { key: 'issuer',    label: '카드사/계좌' },
    ];

    /* 정보수정이력 그리드 컬럼 (번호 컬럼은 bo-grid 자동) */
    const editHistGridColumns = [
      { key: 'date',   label: '수정일시', style: 'width:140px;' },
      { key: 'user',   label: '수정자',   style: 'width:100px;' },
      { key: 'field',  label: '항목',     style: 'width:120px;' },
      { key: 'before', label: '변경 전', cellStyle: 'color:#888;' },
      { key: 'after',  label: '변경 후', cellStyle: 'color:#e8587a;font-weight:600;' },
    ];

    /* 주문항목 그리드 컬럼 (번호 컬럼은 bo-grid 자동) */
    const orderItemGridColumns = [
      { key: 'prodNm',      label: '상품명' },
      { key: 'color',       label: '색상',       style: 'width:60px;',                fmt: v => v || '-' },
      { key: 'size',        label: '사이즈',     style: 'width:50px;',                fmt: v => v || '-' },
      { key: 'qty',         label: '수량',       style: 'width:44px;text-align:center;',
        align: 'center', fmt: (v) => v || 1, cellStyle: 'font-weight:600;' },
      { key: 'salePrice',   label: '판매금액',   style: 'width:90px;text-align:right;',
        align: 'right', fmt: (v, row) => fmt(row.salePrice || row.price), cellStyle: 'color:#666;' },
      { key: 'discInfo',    label: '할인정보',   style: 'width:80px;', cellStyle: 'font-size:12px;',
        fmt: (v) => v || '-',
        cellInnerStyle: (v) => v ? 'font-size:11px;padding:2px 7px;border-radius:8px;background:#fff3e0;color:#e65100;font-weight:600;' : 'color:#bbb;' },
      { key: 'discAmount',  label: '할인금액',   style: 'width:90px;text-align:right;',
        align: 'right', fmt: (v) => v ? '-' + fmt(v) : '-', cellStyle: 'color:#d84315;font-weight:600;' },
      { key: 'price',       label: '결제금액',   style: 'width:100px;text-align:right;',
        align: 'right', fmt: (v) => fmt(v), cellStyle: 'font-weight:700;color:#1a1a1a;' },
      { key: 'orderStatus', label: '주문상태',   style: 'width:90px;text-align:center;', align: 'center',
        fmt: () => form.orderStatusCd || '-',
        cellInnerStyle: 'font-size:10.5px;padding:2px 7px;border-radius:8px;background:#eef4ff;color:#1e40af;font-weight:600;' },
      { key: 'claimStatus', label: '클레임상태', style: 'width:110px;text-align:center;', align: 'center',
        fmt: () => cfRelatedClaim.value ? `${cfRelatedClaim.value.type} · ${cfRelatedClaim.value.status}` : '-',
        cellInnerStyle: () => cfRelatedClaim.value
          ? `font-size:10px;padding:2px 8px;border-radius:8px;color:#fff;font-weight:700;background:${CLAIM_TYPE_COLOR[cfRelatedClaim.value.type]||'#9ca3af'};`
          : 'color:#ccc;' },
      { key: 'exchInfo',    label: '교환정보',   style: 'width:140px;', cellStyle: 'font-size:12px;',
        trackBoxes: {
          items: () => {
            const c = cfRelatedClaim.value;
            if (!c || c.type !== '교환') return [];
            return [
              ...(c.exchangeCourier ? [{ courier: c.exchangeCourier, trackingNo: c.exchangeTrackingNo, colorVariant: 'blue' }] : []),
              ...(c.courier         ? [{ label: '수거', courier: c.courier, trackingNo: c.trackingNo, colorVariant: 'orange' }] : []),
            ];
          },
          onTrack: openTracking,
        } },
    ];

    // pay_statuses 폴백 옵션 — sy_code 로딩 전엔 PAY_STATUS_FALLBACK 사용
    const cfPayStatusOptions = computed(() => {
      if (codes.pay_statuses && codes.pay_statuses.length) return codes.pay_statuses;
      return PAY_STATUS_FALLBACK.map(v => ({ codeValue: v, codeLabel: v }));
    });
    const baseFormColumns = [
      { key: 'orderId',      label: '주문ID', type: 'text', required: true,
        placeholder: 'ORD-2026-XXX', readonly: !cfIsNew.value },
      { key: 'memberId',     label: '회원ID', type: 'slot', name: 'memberId', required: true },
      { type: 'rowBreak' },
      { key: 'memberNm',     label: '회원명', type: 'text' },
      { key: 'orderDate',    label: '주문일시', type: 'text', placeholder: '2026-04-08 10:00' },
      { type: 'rowBreak' },
      { key: 'prodNm',       label: '상품', type: 'text', placeholder: '상품명', colSpan: 2 },
      { type: 'rowBreak' },
      { key: '_vendor',      label: '판매업체', type: 'slot', name: 'vendor', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'totalAmt',     label: '결제금액', type: 'number' },
      { key: 'payMethodCd',  label: '결제수단', type: 'select', options: () => codes.payment_methods },
      { type: 'rowBreak' },
      { key: 'payStatusCd',  label: '결제상태', type: 'select', options: () => cfPayStatusOptions.value },
      { key: 'payDate',      label: '결제일시', type: 'text', placeholder: '2026-04-05 14:32' },
      { type: 'rowBreak' },
      { key: 'orderStatusCd', label: '상태', type: 'select', options: () => codes.order_statuses },
      { type: 'rowBreak' },
      { key: 'memo',         label: '메모', type: 'slot', name: 'memo', colSpan: 2 },
    ];
    // ===== return (템플릿 노출) ===============================================


    return { cfIsNew, form, errors, handleSave, ORDER_STEPS, cfCurrentStepIdx, cfIsCanceled, activeTab, orderItems, fmt, cfRelatedClaim, cfRelatedDelivery, cfRelatedVendor, CLAIM_FLOWS, CLAIM_TYPE_COLOR, cfTabs, cfEditHistList, cfPaymentList, cfStatusHistList, openTracking, PAY_STATUS_FALLBACK, fnPayStatusBadge, cfDtlMode, tabMode2, showTab, expandedItems, toggleExpand, isExpanded, getExchangedItem, cfAllExpanded, toggleExpandAll, codes, paymentGridColumns, editHistGridColumns, orderItemGridColumns, fnItemExpanded, baseFormColumns, showRefModal };
  },
  template: /* html */`
<div>
  <!-- ===== 페이지 타이틀 ==================================================== -->
  <div class="page-title">
    {{ cfIsNew ? '주문 등록' : (cfDtlMode ? '주문 상세' : '주문 수정') }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.orderId }}</span>
  </div>
  <!-- ===== 탭 ========================================================== -->
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
          }">
          {{ t.count }}
        </span>
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
      <!-- ===== 주문 진행 상태 흐름 ================================================ -->
      <div v-if="!cfIsNew" style="margin-bottom:20px;padding:16px 18px;background:#f6f6f6;border-radius:10px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <span style="font-size:11px;font-weight:800;padding:3px 10px;border-radius:10px;color:#fff;background:#16a34a;">주문</span>
          <span style="font-size:13px;font-weight:700;color:#222;">{{ form.orderId }}</span>
          <span v-if="form.orderDate" style="font-size:11px;color:#888;">{{ form.orderDate }}</span>
        </div>
        <div v-if="cfIsCanceled" style="text-align:center;padding:8px 0;">
          <span style="font-size:14px;font-weight:700;color:#cf1322;letter-spacing:1px;">⊘ 취소됨</span>
        </div>
        <div v-else style="display:flex;align-items:flex-start;overflow-x:auto;">
          <template v-for="(step, idx) in ORDER_STEPS" :key="step">
            <div style="display:flex;flex-direction:column;align-items:center;min-width:80px;flex:1;">
              <div :style="{
                width: idx === cfCurrentStepIdx ? '14px' : '10px',
                height: idx === cfCurrentStepIdx ? '14px' : '10px',
                borderRadius:'50%', marginBottom:'6px', flexShrink:0, transition:'all .15s',
                boxShadow: idx === cfCurrentStepIdx ? '0 0 0 3px rgba(74,222,128,0.3)' : 'none',
                background: idx <= cfCurrentStepIdx ? '#4ade80' : '#bbb',
                }"></div>
              <div :style="{
                fontSize:'11.5px', fontWeight: idx === cfCurrentStepIdx ? 800 : 600,
                color: idx === cfCurrentStepIdx ? '#16a34a' : (idx < cfCurrentStepIdx ? '#444' : '#bbb'),
                whiteSpace:'nowrap',
                }">
                {{ step==='완료' ? '구매확정' : step }}
              </div>
              <span v-if="step==='배송완료' && cfRelatedDelivery && cfRelatedDelivery.trackingNo"
                @click="openTracking(cfRelatedDelivery.courier, cfRelatedDelivery.trackingNo)"
                title="배송조회 창 열기"
                style="margin-top:4px;padding:1px 7px;border:1px solid #86efac;background:#dcfce7;color:#15803d;border-radius:4px;font-size:0.7rem;font-weight:700;cursor:pointer;user-select:none;">
                {{ (cfRelatedDelivery.courier||'').replace('대한통운','').replace('택배','') || 'CJ' }}배송 🔍
              </span>
            </div>
            <div v-if="idx < ORDER_STEPS.length - 1"
              :style="{flex:'1', height:'2px', minWidth:'12px', marginTop:'6px',
              background: idx < cfCurrentStepIdx ? '#4ade80' : '#bbb'}"></div>
          </template>
        </div>
      </div>
      <!-- ===== 클레임 진행 흐름 (있을 때만) ========================================== -->
      <div v-if="!cfIsNew && cfRelatedClaim" style="margin-bottom:20px;padding:16px;border-radius:10px;border:1px dashed #e8e8e8;"
        :style="{
        background: 'linear-gradient(135deg,'+CLAIM_TYPE_COLOR[cfRelatedClaim.type]+'15 0%,#fff 70%)',
        }">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <span :style="{
            fontSize:'11px',padding:'3px 10px',borderRadius:'10px',color:'#fff',fontWeight:800,
            background: CLAIM_TYPE_COLOR[cfRelatedClaim.type],
            }">
            ↩ {{ cfRelatedClaim.type }}
          </span>
          <span style="font-size:13px;font-weight:700;color:#222;">{{ cfRelatedClaim.claimId }}</span>
          <span style="font-size:11px;color:#888;">신청일: {{ cfRelatedClaim.requestDate }}</span>
          <span v-if="cfRelatedClaim.reason" style="font-size:11px;color:#888;margin-left:auto;">사유: {{ cfRelatedClaim.reason }}</span>
        </div>
        <div style="display:flex;align-items:flex-start;overflow-x:auto;">
          <template v-for="(step, idx) in CLAIM_FLOWS[cfRelatedClaim.type]" :key="step">
            <div style="display:flex;flex-direction:column;align-items:center;min-width:64px;flex:1;">
              <div :style="{
                width: cfRelatedClaim.status===step ? '14px' : '10px',
                height: cfRelatedClaim.status===step ? '14px' : '10px',
                borderRadius:'50%', marginBottom:'6px',
                boxShadow: cfRelatedClaim.status===step ? '0 0 0 3px '+CLAIM_TYPE_COLOR[cfRelatedClaim.type]+'40' : 'none',
                background: CLAIM_FLOWS[cfRelatedClaim.type].indexOf(cfRelatedClaim.status) >= idx ? CLAIM_TYPE_COLOR[cfRelatedClaim.type] : '#bbb',
                }"></div>
              <div :style="{
                fontSize:'10.5px', fontWeight: cfRelatedClaim.status===step ? 800 : 500,
                color: cfRelatedClaim.status===step ? CLAIM_TYPE_COLOR[cfRelatedClaim.type] : (CLAIM_FLOWS[cfRelatedClaim.type].indexOf(cfRelatedClaim.status) > idx ? '#444' : '#bbb'),
                whiteSpace:'nowrap',
                }">
                {{ step }}
              </div>
              <span v-if="step==='수거중' && cfRelatedClaim.trackingNo"
                @click="openTracking(cfRelatedClaim.courier, cfRelatedClaim.trackingNo)"
                title="수거 배송조회"
                style="margin-top:4px;padding:1px 7px;border:1px solid #fed7aa;background:#fff7ed;color:#c2410c;border-radius:4px;font-size:0.7rem;font-weight:700;cursor:pointer;user-select:none;">
                {{ (cfRelatedClaim.courier||'').replace('대한통운','').replace('택배','') || 'CJ' }}수거 🔍
              </span>
              <span v-if="step==='완료' && cfRelatedClaim.exchangeTrackingNo"
                @click="openTracking(cfRelatedClaim.exchangeCourier, cfRelatedClaim.exchangeTrackingNo)"
                title="발송 배송조회"
                style="margin-top:4px;padding:1px 7px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;border-radius:4px;font-size:0.7rem;font-weight:700;cursor:pointer;user-select:none;">
                {{ (cfRelatedClaim.exchangeCourier||'').replace('대한통운','').replace('택배','') || 'CJ' }}발송 🔍
              </span>
            </div>
            <div v-if="idx < CLAIM_FLOWS[cfRelatedClaim.type].length - 1"
              :style="{
              flex:1, height:'2px', minWidth:'8px', marginTop:'6px',
              background: CLAIM_FLOWS[cfRelatedClaim.type].indexOf(cfRelatedClaim.status) > idx ? CLAIM_TYPE_COLOR[cfRelatedClaim.type] : '#bbb',
              }"></div>
          </template>
        </div>
      </div>
      <!-- 기본정보 폼 (BoFormArea 자동 렌더) -->
      <!-- ===== 폼 영역 ======================================================= -->
      <bo-form-area :columns="baseFormColumns" :form="form" :errors="errors"
        :readonly="cfDtlMode" :cols="2"
        @save="handleSave"
        @cancel="navigate('odOrderMng')"
        @edit="navigate('__switchToEdit__')"
        @close="navigate('odOrderMng')">
        <!-- 회원ID + 보기 -->
        <template #memberId>
          <div style="display:flex;gap:8px;align-items:center;">
            <input class="form-control" v-model="form.memberId" placeholder="회원 ID" :readonly="cfDtlMode" :class="errors.memberId ? 'is-invalid' : ''" />
            <span v-if="form.memberId" class="ref-link" @click="showRefModal('member', form.memberId)">보기</span>
          </div>
          <span v-if="errors.memberId" class="field-error">{{ errors.memberId }}</span>
        </template>
        <!-- 판매업체 표시 -->
        <template #vendor>
          <div v-if="cfRelatedVendor" style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:13px;font-weight:700;color:#222;">{{ cfRelatedVendor.vendorNm }}</span>
            <span style="font-size:11px;color:#888;">| {{ cfRelatedVendor.ceo }} | {{ cfRelatedVendor.phone }}</span>
            <span class="ref-link" @click="showRefModal('vendor', cfRelatedVendor.vendorId)">보기</span>
          </div>
          <div v-else style="font-size:12px;color:#bbb;">-</div>
        </template>
        <!-- 메모: Quill 또는 view 모드 HTML -->
        <template #memo>
          <div v-if="cfDtlMode" class="form-control" style="min-height:90px;line-height:1.6;" v-html="form.memo || '<span style=color:#bbb>-</span>'"></div>
          <base-html-editor v-else v-model="form.memo" height="180px" />
        </template>
      </bo-form-area>
    </div>
    <!-- ===== 주문항목목록 탭 =================================================== -->
    <div v-if="!cfIsNew && showTab('items')" class="card" style="padding:20px;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📦 주문항목 <span class="tab-count">{{ orderItems.length }}</span></div>
      <div v-if="cfRelatedClaim && cfRelatedClaim.type==='교환'" style="display:flex;justify-content:flex-end;margin-bottom:10px;">
        <button class="btn btn-secondary btn-sm" @click="toggleExpandAll">{{ cfAllExpanded ? '▲ 교환품 모두접기' : '▼ 교환품 모두펼치기' }}</button>
      </div>
      <!-- ===== 목록 영역 ====================================================== -->
      <bo-grid bare :columns="orderItemGridColumns" :rows="orderItems"
        :is-expanded="fnItemExpanded"
        empty-text="주문 항목 정보가 없습니다.">
        <template #cell-prodNm="{ row, idx }">
          <td style="font-size:12px;">
            <span v-if="cfRelatedClaim && cfRelatedClaim.type==='교환'" @click="toggleExpand(idx)" style="cursor:pointer;font-size:11px;color:#3b82f6;font-weight:800;user-select:none;margin-right:6px;" :title="isExpanded(idx)?'교환품 숨기기':'교환품 보기'">
              {{ isExpanded(idx) ? '▼' : '▶' }}
            </span>
            <span style="font-size:18px;margin-right:6px;">{{ row.emoji || '🛍' }}</span>
            {{ row.prodNm }}
          </td>
        </template>
        <template #row-expand="{ row, colspan }">
          <td :colspan="colspan" style="padding:10px 14px;background:#f0f7ff;">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:#3b82f6;color:#fff;font-weight:800;">↔ 교환품</span>
              <span style="font-size:13px;font-weight:700;color:#1e40af;">{{ getExchangedItem(row).prodNm }}</span>
              <span style="font-size:12px;color:#555;">
                색상:
                <b>{{ row.color }}</b>
                →
                <b style="color:#1e40af;">{{ getExchangedItem(row).color }}</b>
              </span>
              <span style="font-size:12px;color:#555;">사이즈: <b>{{ getExchangedItem(row).size }}</b></span>
              <span style="font-size:12px;color:#555;">수량: <b>{{ getExchangedItem(row).qty }}</b></span>
              <span v-if="getExchangedItem(row).courier" @click="openTracking(getExchangedItem(row).courier, getExchangedItem(row).trackingNo)" style="cursor:pointer;margin-left:auto;padding:2px 8px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;border-radius:4px;font-size:11px;font-weight:700;">
                발송 {{ getExchangedItem(row).courier }} · {{ getExchangedItem(row).trackingNo || '-' }} 🔍
              </span>
            </div>
          </td>
        </template>
        <template #tfoot>
          <tr style="background:#fafafa;font-weight:700;">
            <td style="width:36px;"></td>
            <td colspan="4" style="text-align:right;color:#555;">합계</td>
            <td style="width:90px;text-align:right;color:#666;">{{ fmt(orderItems.reduce((s,x)=>s+(x.salePrice||x.price||0),0)) }}</td>
            <td style="width:80px;"></td>
            <td style="width:90px;text-align:right;color:#d84315;">-{{ fmt(orderItems.reduce((s,x)=>s+(x.discAmount||0),0)) }}</td>
            <td style="width:100px;text-align:right;color:#1a1a1a;">{{ fmt(orderItems.reduce((s,x)=>s+(x.price||0),0)) }}</td>
            <td colspan="3"></td>
          </tr>
        </template>
      </bo-grid>
    </div>
    <!-- ===== 결제정보 탭 ===================================================== -->
    <div v-if="!cfIsNew && showTab('payment')" class="card" style="padding:20px;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">💳 결제정보 <span class="tab-count">{{ cfPaymentList.length }}</span></div>
      <!-- ===== 목록 영역 ====================================================== -->
      <bo-grid bare :columns="paymentGridColumns" :rows="cfPaymentList" empty-text="결제정보가 없습니다."></bo-grid>
    </div>
    <!-- ===== 상태변경이력 탭 =================================================== -->
    <div v-if="!cfIsNew && showTab('hist')" class="card">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title" style="margin-bottom:10px;padding:0 0 10px 0;">
        🕒 상태변경이력
        <span class="tab-count">{{ cfStatusHistList.length }}</span>
      </div>
      <od-order-hist :order-id="form.orderId" :navigate="navigate" :show-ref-modal="showRefModal" :show-toast="showToast" />
    </div>
    <!-- ===== 정보수정이력 탭 =================================================== -->
    <div v-if="!cfIsNew && showTab('editHist')" class="card" style="padding:20px;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📝 정보수정이력 <span class="tab-count">{{ cfEditHistList.length }}</span></div>
      <!-- ===== 목록 영역 ====================================================== -->
      <bo-grid bare :columns="editHistGridColumns" :rows="cfEditHistList" empty-text="정보 수정 이력이 없습니다."></bo-grid>
    </div>
  </div>
</div>
`
};
