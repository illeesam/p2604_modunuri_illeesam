/* ShopJoy Admin - 주문관리 상세/등록 */
window._odOrderDtlState = window._odOrderDtlState || { activeTab: 'info', tabMode: 'tab' };
export default {
  name: 'OdOrderDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    active:       { type: Boolean, default: true }, // false=행 미선택 빈 폼(저장/취소 등 버튼 숨김)
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-bo §18)
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, watch, onBeforeUnmount, nextTick } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달

    const vendors = reactive([]);                                               // 판매업체 목록
    const deliveries = reactive([]);                                            // 배송 목록
    const claims = reactive([]);                                                // 클레임 목록
    const orderItems = reactive([]);                                            // 주문 항목 목록
    const payments = reactive([]);                                              // 결제 내역 목록
    const uiState = reactive({ loading: false, error: null, activeTab: window._odOrderDtlState?.activeTab || 'info', tabMode2: window._odOrderDtlState.tabMode || 'tab' });
    const activeTab = Vue.toRef(uiState, 'activeTab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({ claim_statuses: [], order_statuses: [], payment_methods: [], pay_statuses: [] });

    const cfIsNew = computed(() => !props.dtlId);

    const ORDER_STEPS = boConsts.ORDER_STEPS.map(function (c) { return c.codeLabel; });

    const form = reactive({
      orderId: '', memberId: '', memberNm: '', orderDate: '', prodNm: '',
      totalAmt: '', payMethodCd: '', orderStatusCd: '',
      payStatusCd: '', payDate: '', apprNo: '', payIssuer: '',
      memo: '',
      dlivFee: 0,                                  // 배송비 (추가 요청 가능)
      extraReqAmt: 0, extraReqReason: '',          // 추가결제 요청 금액/사유
    });
    /* ── MD 대리주문: 모달 상태 ── */
    const odModal = reactive({ member: false, orderCopy: false, prod: false }); // 회원/주문복사/상품 모달 표시
    const payState = reactive({ processing: false }); // 브랜드페이 결제 진행 플래그 (위젯은 공통 컴포넌트가 자체 관리)
    /* _applyNewDefaults — 신규 진입 시에만 비어있지 않던 기본값 채움 (미선택 시 빈 폼 유지) */
    const _applyNewDefaults = () => {
      Object.assign(form, {
        totalAmt: 0, payMethodCd: '무통장입금', orderStatusCd: '입금대기',
        payStatusCd: '결제완료',
      });
    };
    const errors = reactive({});

    /* 신규 주문은 orderId 를 서버가 생성하므로 회원ID만 필수. 기존 주문은 orderId 도 필수. */
    const schemaNew = yup.object({
      memberId: yup.string().required('회원ID를 입력해주세요. (회원선택)'),
    });
    const schemaEdit = yup.object({
      orderId: yup.string().required('주문ID를 입력해주세요.'),
      memberId: yup.string().required('회원ID를 입력해주세요.'),
    });

    const expandedItems = reactive(new Set());                                  // 펼쳐진 주문항목 행 인덱스

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ OdOrderDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장 (신규 등록 또는 수정)
      if (cmd === 'form-save') {
        return handleSave();
      // 폼 편집 취소 → 상세영역 유지 + 빈 신규 폼으로 초기화 (영역 사라지지 않음)
      } else if (cmd === 'form-cancel') {
        return props.navigate('__cancelEdit__');
      // 상세 보기 → 편집 모드 전환
      } else if (cmd === 'form-edit') {
        return props.navigate('__switchToEdit__');
      // 폼 닫기 → 상세영역 유지 + 빈 신규 폼으로 초기화
      } else if (cmd === 'form-close') {
        return props.navigate('__closeDtl__');
      // 회원 참조 모달 열기
      } else if (cmd === 'form-memberRef') {
        return showRefModal('member', form.memberId);
      // 판매업체 참조 모달 열기
      } else if (cmd === 'form-vendorRef') {
        return showRefModal('vendor', param);
      // 탭 전환
      } else if (cmd === 'tab-change') {
        if (uiState.tabMode2 === 'tab') { uiState.activeTab = param; }
        return;
      // 뷰모드 전환
      } else if (cmd === 'viewMode-change') {
        uiState.tabMode2 = param;
        return;
      // 주문항목 전체 펼침 토글
      } else if (cmd === 'orderItems-toggleExpandAll') {
        if (cfAllExpanded.value) { expandedItems.clear(); }
        else { orderItems.forEach((_, i) => expandedItems.add(i)); }
        return;
      // 배송 추적 창 열기
      } else if (cmd === 'tracking-open') {
        return openTracking(param.courier, param.trackingNo);
      // ── MD 대리주문: 모달 열기/닫기 ──
      } else if (cmd === 'memberModal-open') {
        odModal.member = true; return;
      } else if (cmd === 'memberModal-close') {
        odModal.member = false; return;
      } else if (cmd === 'orderCopyModal-open') {
        odModal.orderCopy = true; return;
      } else if (cmd === 'orderCopyModal-close') {
        odModal.orderCopy = false; return;
      } else if (cmd === 'prodModal-open') {
        odModal.prod = true; return;
      } else if (cmd === 'prodModal-close') {
        odModal.prod = false; return;
      // ── 주문항목: 행 삭제 ──
      } else if (cmd === 'orderItems-remove') {
        orderItems.splice(param, 1);
        recalcTotal();
        return;
      // ── 결제: 토스 브랜드페이 결제 (시뮬 기본 + clientKey 있으면 실 SDK) ──
      } else if (cmd === 'pay-request') {
        return handlePayRequest();
      // ── 추가결제 요청 ──
      } else if (cmd === 'extraPay-request') {
        return handleExtraPayRequest();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ OdOrderDtl.js : handleSelectAction -> ', cmd, param);
      // 주문항목 행 펼침 토글
      if (cmd === 'orderItems-rowToggleExpand') {
        if (expandedItems.has(param)) { expandedItems.delete(param); }
        else { expandedItems.add(param); }
        return;
      // 배송비 변경 → 결제금액 재계산
      } else if (cmd === 'dlivFee-change') {
        return recalcTotal();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* fnCallbackModal — 모달 통합 콜백 (회원선택 / 주문복사). cmd=modalName, result=선택값 */
    const fnCallbackModal = (popCmd, param, result) => {
      console.log(' ■■ OdOrderDtl : fnCallbackModal -> ', popCmd, result);
      if (popCmd === 'cmPopup-member-pick') {
        odModal.member = false;
        if (result) { onMemberPicked(result); }
      } else if (popCmd === 'cmPopup-order-copy') {
        odModal.orderCopy = false;
        if (result) { onOrderCopied(result); }
      }
    };

    /* onMemberPicked — 회원 선택 모달 결과 반영 */
    const onMemberPicked = (m) => {
      form.memberId = m.selId || m.userId || '';
      form.memberNm = m.selName || m.memberName || m.name || '';
      showToast('회원이 선택되었습니다.', 'success');
    };

    /* onOrderCopied — 기존 주문 복사(템플릿): 회원·상품·결제수단·배송정보를 신규 폼에 불러옴 */
    const onOrderCopied = (o) => {
      form.memberId   = o.memberId || '';
      form.memberNm   = o.memberNm || '';
      form.prodNm     = o.prodNm || '';
      form.payMethodCd = o.payMethodCd || form.payMethodCd;
      form.dlivFee    = Number(o.dlivFee || 0);
      /* 주문항목 복사 (있으면) */
      const items = o.orderItems || o.items || [];
      orderItems.splice(0, orderItems.length, ...items.map(it => ({ ...it })));
      recalcTotal();
      showToast(`주문 ${o.orderId} 를 복사했습니다.`, 'success');
    };

    /* onProdToggled — 상품 선택 모달 토글: 주문항목에 추가/제거
     * result-type="row" 로 받으므로 row.id=prodId, row.nm=prodNm, row.salePrice 직접 사용 */
    const onProdToggled = (row) => {
      const productId = row.id || row.prodId;
      const idx = orderItems.findIndex(it => it.productId === productId);
      if (idx !== -1) { orderItems.splice(idx, 1); }
      else {
        const price = Number(row.salePrice || 0);
        orderItems.push({
          productId, prodNm: row.nm || row.prodNm, qty: 1,
          salePrice: price, discAmount: 0, price,
        });
      }
      recalcTotal();
    };

    /* recalcTotal — 신규 대리주문 조립 시에만 결제금액 재계산.
     * ⚠️ 기존 주문(cfIsNew=false)의 totalAmt(=total_amt 상품합계)는 서버 값이므로 덮어쓰지 않음(데이터 오염 방지). */
    const recalcTotal = () => {
      if (!cfIsNew.value) { return; }
      const itemSum = orderItems.reduce((s, x) => s + (Number(x.price) || 0), 0);
      form.totalAmt = itemSum + (Number(form.dlivFee) || 0);
      if (!form.prodNm && orderItems.length) {
        form.prodNm = orderItems[0].prodNm + (orderItems.length > 1 ? ` 외 ${orderItems.length - 1}건` : '');
      }
    };

    /* handlePayRequest — 토스 브랜드페이 결제. 결제창이 안 뜨면 이유+해결방법을 오류 toast 로 안내하고 중단 */
    const handlePayRequest = async () => {
      const amount = (Number(form.totalAmt) || 0);
      if (amount <= 0) { showToast('결제금액이 0원입니다. 주문항목/배송비를 확인하세요.', 'error'); return; }
      if (!form.memberId) { showToast('회원을 먼저 선택하세요.', 'error'); return; }
      const ok = await showConfirm('결제 요청', `${amount.toLocaleString()}원을 토스 브랜드페이로 결제하시겠습니까?`);
      if (!ok) { return; }
      payState.processing = true;
      try {
        if (!window.coAuth) {
          showToast('결제 모듈(coAuth)이 로드되지 않았습니다.', 'error', 0);
          return;
        }
        /* co 통합: coAuth.pay('bo', opts). 결제창이 안 뜨면 coAuth/coExtSdk 가 "원인—해결방법" 에러 throw → catch 에서 toast.
         * 개발용 onDebug 로 SDK·키·파라미터를 toast 표시 */
        await window.coAuth.pay('bo', {
          customerKey: form.memberId,
          amount,
          orderId: form.orderId || ('ORD' + Date.now()),
          orderName: form.prodNm || '주문결제',
          onDebug: (label, info) => showToast('[개발] ' + label + '\n' + window.coExtSdk._fmtParams(info), 'info', 0),
        });
        _applyPaySuccess(amount);
      } catch (sdkErr) {
        console.warn('[Toss 브랜드페이 실패]', sdkErr);
        const msg = (sdkErr && sdkErr.message) || '';
        /* 사용자 취소는 오류가 아님 (안내 토스트만), 설정 문제는 실패 토스트에 [결제 설정 방법 보기] 버튼 부착 */
        if (/취소|cancel|USER_CANCEL/i.test(msg)) {
          showToast('결제가 취소되었습니다.', 'info');
        } else {
          const action = window.coExtHelp && window.coExtHelp.toastAction({ kind: 'pay', provider: 'toss', error: sdkErr });
          showToast('결제창 호출에 실패했습니다.\n→ 해결: 팝업 차단 해제·네트워크 상태·토스 키 설정을 확인한 뒤 다시 시도하세요.' + (msg ? ('\n(' + msg + ')') : ''), 'error', 0, '', action);
        }
      } finally {
        payState.processing = false;
      }
    };

    /* _applyPaySuccess — 결제 성공 후 화면 상태 반영 */
    const _applyPaySuccess = (amount) => {
      form.payStatusCd = '결제완료';
      form.payMethodCd = form.payMethodCd || '토스페이먼츠';
      form.payIssuer   = '토스 브랜드페이';
      form.apprNo      = 'BP' + String(Date.now()).slice(-10);
      payments.unshift({
        payMethod: '토스 브랜드페이', payStatus: '결제완료', amount,
        payDate: form.payDate || '', apprNo: form.apprNo, issuer: '토스 브랜드페이',
      });
      showToast(`${amount.toLocaleString()}원 결제가 완료되었습니다.`, 'success');
    };

    /* (토스 간편 위젯 결제는 공통 컴포넌트 <base-toss-pay-widget> 으로 분리됨 — components/comp/BaseComp.js) */

    /* handleExtraPayRequest — 추가결제 요청 */
    const handleExtraPayRequest = async () => {
      const amt = Number(form.extraReqAmt) || 0;
      if (amt <= 0) { showToast('추가결제 요청금액을 입력하세요.', 'error'); return; }
      if (!form.orderId) { showToast('주문을 먼저 저장한 뒤 추가결제를 요청하세요.', 'error'); return; }
      const ok = await showConfirm('추가결제 요청', `${amt.toLocaleString()}원 추가결제를 요청하시겠습니까?`);
      if (!ok) { return; }
      try {
        await boApiSvc.odOrder.requestExtraPay({ orderId: form.orderId, memberId: form.memberId, amount: amt, reason: form.extraReqReason }, '주문관리', '추가결제요청');
        showToast('추가결제 요청이 전송되었습니다.', 'success');
        payments.unshift({ payMethod: '추가결제요청', payStatus: '미결제', amount: amt, payDate: '', apprNo: '-', issuer: form.extraReqReason || '-' });
      } catch (err) {
        showToast(coUtil.cofErrMsg(err, '추가결제 요청 실패'), 'error', 0);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleSearchDetail — 처리 */
    const handleSearchDetail = async () => {
      if (cfIsNew.value) { return; }
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
        /* 배송비: 서버 필드명(outboundShippingFee/shippingFee) → form.dlivFee 시드 (기존 주문 편집 시 0 으로 덮이지 않게) */
        form.dlivFee = Number(o.dlivFee ?? o.outboundShippingFee ?? o.shippingFee ?? 0);
        if (!form.orderId) { form.orderId = props.dtlId; }
        if (o.orderStatusCd) { form.orderStatusCd = o.orderStatusCd; }
        if (o.payMethodCd) { form.payMethodCd = o.payMethodCd; }
        if (o.payStatus) { form.payStatusCd = o.payStatus; }
        else if (['취소','자동취소'].includes(o.orderStatusCd)) { form.payStatusCd = '환불완료'; }
        else if (['입금대기'].includes(o.orderStatusCd)) { form.payStatusCd = '미결제'; }
        else { form.payStatusCd = '결제완료'; }
        if (!form.payDate) { form.payDate = o.orderDate || ''; }
        if (!form.apprNo) { form.apprNo  = 'APR-' + String(o.orderId||'').slice(-6) + '01'; }
        if (!form.payIssuer) { form.payIssuer = ({'토스페이먼츠':'토스','카카오페이':'카카오','네이버페이':'네이버','무통장입금':'은행','가상계좌':'은행'}[form.payMethodCd] || '-'); }
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
          color: it.prodOpt1Id || '',
          size: it.prodOpt2Id || '',
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
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['CLAIM_STATUS_CD', 'ORDER_STATUS_CD', 'PAYMENT_METHOD', 'PAY_STATUS'], {compNm: 'OdOrderDtl'});
      codes.claim_statuses = codeStore.sgGetGrpCodes('CLAIM_STATUS_CD');
      codes.order_statuses = codeStore.sgGetGrpCodes('ORDER_STATUS_CD');
      codes.payment_methods = codeStore.sgGetGrpCodes('PAYMENT_METHOD');
      codes.pay_statuses = codeStore.sgGetGrpCodes('PAY_STATUS');
    };

    /* fnPayStatusBadge — 공통코드 PAY_STATUS 우선, 미매칭 시 boConsts fallback */
    const fnPayStatusBadge = s => coUtil.cofCodeBadge('PAY_STATUS', s, boConsts.PAY_STATUS_FALLBACK_BADGE[s] || 'badge-gray');

    const cfCurrentStepIdx = computed(() => {
      const idx = ORDER_STEPS.indexOf(form.orderStatusCd);
      return idx !== -1 ? idx : -1;
    });

    const cfIsCanceled = computed(() => form.orderStatusCd === 'CANCELED');

    /* handleSave — 저장 */
    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await (cfIsNew.value ? schemaNew : schemaEdit).validate(form, { abortEarly: false });
      } catch (err) {
        console.error('[catch-info]', err);
        err.inner.forEach(e => { errors[e.path] = e.message; });
        showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const isNewOrder = cfIsNew.value;
      const ok = await showConfirm(isNewOrder ? '등록' : '저장', isNewOrder ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) { return; }
      try {
        /* MD 대리주문(주문항목 보유) 은 주문+항목 동시 저장 API(save-proxy) 사용 */
        if (orderItems.length) {
          const itemSum = orderItems.reduce((s, x) => s + (Number(x.price) || 0), 0);
          const proxy = {
            orderId: form.orderId || null,
            memberId: form.memberId, memberNm: form.memberNm,
            orderStatusCd: form.orderStatusCd, payMethodCd: form.payMethodCd,
            totalAmt: itemSum, dlivFee: Number(form.dlivFee || 0), payAmt: itemSum + Number(form.dlivFee || 0),
            memo: form.memo,
            orderItems: orderItems.map(it => ({
              prodId: it.productId || it.prodId, prodSkuId: it.prodSkuId || null, prodNm: it.prodNm,
              unitPrice: Number(it.salePrice || it.unitPrice || it.price || 0), orderQty: Number(it.qty || it.orderQty || 1),
              itemOrderAmt: Number(it.price || it.itemOrderAmt || (it.salePrice * (it.qty || 1)) || 0),
            })),
          };
          await boApiSvc.odOrder.saveProxy(proxy, '주문관리', isNewOrder ? '대리주문등록' : '대리주문수정');
        } else {
          const payload = { ...form, totalAmt: Number(form.totalAmt), dlivFee: Number(form.dlivFee || 0) };
          /* 빈/공백 날짜시각 필드 제거 — LocalDateTime 역직렬화는 빈 문자열을 거부(400). 서버가 now() 할당하도록 미전송 */
          ['orderDate', 'payDate'].forEach(k => { if (!payload[k] || !String(payload[k]).trim()) { delete payload[k]; } });
          await (isNewOrder
            ? boApiSvc.odOrder.create(payload, '주문관리', '등록')
            : boApiSvc.odOrder.update(form.orderId, payload, '주문관리', '저장'));
        }
        if (showToast) { showToast(isNewOrder ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('odOrderMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    watch(() => uiState.activeTab, (newVal) => { window._odOrderDtlState.activeTab = newVal; });

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      await handleSearchDetail();
      if (props.active && cfIsNew.value) { _applyNewDefaults(); }
    };
    onMounted(initPage);

    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleSearchDetail();
    });

    /* fmt — 포맷 */
    const fmt = (n) => NumbercoUtil.cofWon(n);
    const fnAmtShort = (v) => {
      const n = Number(v) || 0;
      if (!n) return '-';
      if (n >= 100000000) return (n / 100000000).toFixed(1).replace(/\.0$/, '') + '억원';
      if (n >= 10000)     return Math.round(n / 10000) + '만원';
      return n.toLocaleString() + '원';
    };

    /* 판매업체 */
    const cfRelatedVendor = computed(() => {
      if (!form.vendorId) { return null; }
      return vendors.find(v => v.vendorId === form.vendorId) || null;
    });

    /* 배송 정보 (이 주문의 택배사 등) */
    const cfRelatedDelivery = computed(() =>
      (deliveries).find(d => d.orderId === props.dtlId)
    );
    /* 클레임 정보 (이 주문에 연결된 클레임) — DB 필드명 → 표시용 필드로 정규화 */
    const CLAIM_TYPE_COLOR  = coConsts.CLAIM_TYPE_COLOR;
    /* CLAIM_FLOWS: 한글 유형키 → 단계 라벨[]. coConsts.CLAIM_STEP_MAP(영문키)에서 파생 */
    const CLAIM_FLOWS = { '취소': coConsts.CLAIM_STEP_MAP.CANCEL, '반품': coConsts.CLAIM_STEP_MAP.RETURN, '교환': coConsts.CLAIM_STEP_MAP.EXCHANGE };
    /* CLAIM_TYPE_LABEL_REV: 영문코드 → 한글. CLAIM_TYPE_CD_MAP의 역방향 */
    const _CLAIM_TYPE_KR = { CANCEL: '취소', RETURN: '반품', EXCHANGE: '교환' };
    const cfRelatedClaim = computed(() => {
      const raw = (claims).find(c => c.orderId === props.dtlId);
      if (!raw) return null;
      return Object.assign({}, raw, {
        type:   _CLAIM_TYPE_KR[raw.claimTypeCd]  || raw.claimTypeCd  || raw.type  || '-',
        status: boConsts.CLAIM_STATUS_LABEL[raw.claimStatusCd] || raw.claimStatusCd || raw.status || '-',
      });
    });
    const cfClaimStatusCodes = computed(() =>
      (codes.claim_statuses || []).filter(c => c.useYn === 'Y').sort((a, b) => a.sortOrd - b.sortOrd)
    );

    /* trackingUrl — 추적 URL */
    const trackingUrl = (courier, no) => {
      if (!no) { return ''; }
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
      if (!form.orderId) { return []; }
      const d = coUtil.cofYmd(form.orderDate) || '-';
      const rows = [
        { date: d+' 09:00', user:'시스템', from:'-', to:'입금대기', memo:'주문 접수' },
        { date: d+' 10:15', user:'bo', from:'입금대기', to:'결제완료', memo:'결제 승인' },
      ];
      if (form.orderStatusCd && !['입금대기','결제완료'].includes(form.orderStatusCd)) {
        rows.push({ date: d+' 14:30', user:'bo', from:'결제완료', to: form.orderStatusCd, memo:'상태 변경' });
      }
      return rows;
    });

    watch(() => uiState.tabMode2, v => { window._odOrderDtlState.tabMode = v; });

    /* showTab — 표시 */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.activeTab === id;

    /* isExpanded — 여부 확인 */
    const isExpanded = (i) => expandedItems.has(i);
    /* fnItemExpanded — 유틸 */
    const fnItemExpanded = (row, i) => isExpanded(i) && !!cfRelatedClaim.value && cfRelatedClaim.value.type === '교환';
    const cfAllExpanded = computed(() => orderItems.length > 0 && window.safeArrayUtils.safeEvery(orderItems, (_,i) => expandedItems.has(i)));

    const STS_PROGRESS  = ['ORDERED', 'PAID', 'PREPARING', 'SHIPPING', 'WAIT_DEPOSIT'];
    const STS_DELIVERED = ['DELIVERED', 'DLIV_COMPLT'];
    const STS_CONFIRMED = ['CONFIRMED', 'COMPLT', 'BUY_CONFIRMED'];
    const STS_CLM_DONE  = ['COMPLT', 'DONE', 'COMPLETE', 'REJECTED'];
    const STS_CLM_TYPE  = { CANCEL: '취소', RETURN: '반품', EXCHANGE: '교환' };

    const cfOrderItemSummary = computed(() => {
      const IN_PROGRESS  = STS_PROGRESS;
      const IN_DELIVERED = STS_DELIVERED;
      const IN_CONFIRMED = STS_CONFIRMED;
      const CLM_DONE     = STS_CLM_DONE;
      const orderSt = form.orderStatusCd || '';
      let inProgress = 0, delivered = 0, confirmed = 0, refund = 0;
      let caTotal = 0, caCancel = 0, caReturn = 0, caExchange = 0;
      let cdTotal = 0, cdCancel = 0, cdReturn = 0, cdExchange = 0;
      let amtProgress = 0, amtDelivered = 0, amtConfirmed = 0;
      let amtClaimActive = 0, amtClaimDone = 0, amtRefund = 0;
      for (const r of orderItems) {
        const st           = r.orderItemStatusCd || orderSt;
        const orderAmt     = Number(r.itemOrderAmt)     || Number(r.price)    || 0;
        const cancelAmt    = Number(r.itemCancelAmt)    || 0;
        const completedAmt = Number(r.itemCompletedAmt) || 0;
        if (IN_PROGRESS.includes(st))       { inProgress++; amtProgress  += orderAmt; }
        else if (IN_DELIVERED.includes(st)) { delivered++;  amtDelivered += orderAmt; }
        else if (IN_CONFIRMED.includes(st)) { confirmed++;  amtConfirmed += completedAmt || orderAmt; }
        if (r.claimYn === 'Y') {
          const done = CLM_DONE.includes(r.claimStatusCd || '');
          const t = r.claimTypeCd || '';
          if (done) { cdTotal++; amtClaimDone   += cancelAmt; if (t === 'CANCEL') cdCancel++; else if (t === 'RETURN') cdReturn++; else if (t === 'EXCHANGE') cdExchange++; }
          else      { caTotal++; amtClaimActive += orderAmt;  if (t === 'CANCEL') caCancel++; else if (t === 'RETURN') caReturn++; else if (t === 'EXCHANGE') caExchange++; }
        }
        if (r.refundCompltYn === 'Y') { refund++; amtRefund += cancelAmt; }
      }
      return {
        inProgress, delivered, confirmed, refund,
        amtProgress, amtDelivered, amtConfirmed,
        amtClaimActive, amtClaimDone, amtRefund,
        claimActive: { total: caTotal, cancel: caCancel, return: caReturn, exchange: caExchange },
        claimDone:   { total: cdTotal, cancel: cdCancel, return: cdReturn, exchange: cdExchange },
      };
    });

    watch(orderItems, (list) => { expandedItems.clear(); list.forEach((_, i) => expandedItems.add(i)); });

    /* getExchangedItem — 조회 */
    const getExchangedItem = (it) => {
      if (!cfRelatedClaim.value || cfRelatedClaim.value.type !== '교환') { return null; }
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
      { date: coUtil.cofYmd(form.orderDate)+' 11:02', user:'bo', field:'수령인 연락처', before:'010-0000-0000', after: form.phone || '010-1234-5678' },
      { date: coUtil.cofYmd(form.orderDate)+' 13:45', user:'bo', field:'메모',          before:'-',              after:'(수정됨)' },
    ] : []);
    /* tabs — 탭 정의 (BoTabBar 데이터, reactive) */
    const tabs = reactive([
      { id:'info',     label:'상세정보',      icon:'📋' },
      { id:'items',    label:'주문항목',      icon:'📦', get count() { return orderItems.length; } },
      { id:'payment',  label:'결제정보',      icon:'💳', get count() { return cfPaymentList.value.length; } },
      { id:'hist',     label:'상태변경이력',  icon:'🕒', get count() { return cfStatusHistList.value.length; } },
      { id:'editHist', label:'정보수정이력',  icon:'📝', get count() { return cfEditHistList.value.length; } },
    ]);
    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    /* 결제정보 그리드 컬럼 (번호 컬럼은 bo-grid 자동) */
    const columns = {};
    columns.paymentGrid = [
      { key: 'payMethod', label: '결제수단' },
      { key: 'payStatus', label: '결제상태', badge: (row) => fnPayStatusBadge(row.payStatus) },
      { key: 'amount',    label: '결제금액', style: 'text-align:right;',
        align: 'right', fmt: (v) => fmt(v), cellStyle: 'font-weight:700;' },
      { key: 'payDate',   label: '결제일시', fmt: (v) => v ? String(v).slice(0, 16) : '-' },
      { key: 'apprNo',    label: '승인번호' },
      { key: 'issuer',    label: '카드사/계좌' },
    ];

    /* 정보수정이력 그리드 컬럼 (번호 컬럼은 bo-grid 자동) */
    columns.editHistGrid = [
      { key: 'date',   label: '수정일시', style: 'width:140px;' },
      { key: 'user',   label: '수정자',   style: 'width:100px;' },
      { key: 'field',  label: '항목',     style: 'width:120px;' },
      { key: 'before', label: '변경 전', cellStyle: 'color:#888;' },
      { key: 'after',  label: '변경 후', cellStyle: 'color:#e8587a;font-weight:600;' },
    ];

    /* 주문항목 그리드 컬럼 (번호 컬럼은 bo-grid 자동) */
    columns.orderItemGrid = [
      { key: 'prodNm',      label: '상품명' },
      { key: 'color',       label: '색상',       style: 'width:60px;',                fmt: v => v || '-' },
      { key: 'size',        label: '사이즈',     style: 'width:50px;',                fmt: v => v || '-' },
      { key: 'qty',         label: '수량',       style: 'width:44px;text-align:center;',
        align: 'center', fmt: (v) => v || 1, cellStyle: 'font-weight:600;' },
      { key: '_sProg', label: '주문중',   style: 'width:44px;', align: 'center',
        fmt: (v, row) => STS_PROGRESS.includes(row.orderItemStatusCd || form.orderStatusCd) ? '1' : '',
        cellStyle: (v, row) => STS_PROGRESS.includes(row.orderItemStatusCd || form.orderStatusCd) ? 'color:#3a6ecf;font-weight:700;' : '' },
      { key: '_sDliv', label: '배송완료', style: 'width:52px;', align: 'center',
        fmt: (v, row) => STS_DELIVERED.includes(row.orderItemStatusCd || form.orderStatusCd) ? '1' : '',
        cellStyle: (v, row) => STS_DELIVERED.includes(row.orderItemStatusCd || form.orderStatusCd) ? 'color:#5a8080;font-weight:700;' : '' },
      { key: '_sConf', label: '주문완료', style: 'width:52px;', align: 'center',
        fmt: (v, row) => STS_CONFIRMED.includes(row.orderItemStatusCd || form.orderStatusCd) ? '1' : '',
        cellStyle: (v, row) => STS_CONFIRMED.includes(row.orderItemStatusCd || form.orderStatusCd) ? 'color:#2a7d52;font-weight:700;' : '' },
      { key: '_sCa', label: '클레임중', style: 'width:54px;', align: 'center',
        fmt: (v, row) => row.claimYn === 'Y' && !STS_CLM_DONE.includes(row.claimStatusCd || '') ? (STS_CLM_TYPE[row.claimTypeCd] || '진행') : '',
        cellStyle: (v, row) => row.claimYn === 'Y' && !STS_CLM_DONE.includes(row.claimStatusCd || '') ? 'color:#c07030;font-size:11px;font-weight:700;' : '' },
      { key: '_sCd', label: '클레임완료', style: 'width:58px;', align: 'center',
        fmt: (v, row) => row.claimYn === 'Y' && STS_CLM_DONE.includes(row.claimStatusCd || '') ? (STS_CLM_TYPE[row.claimTypeCd] || '완료') : '',
        cellStyle: (v, row) => row.claimYn === 'Y' && STS_CLM_DONE.includes(row.claimStatusCd || '') ? 'color:#888;font-size:11px;' : '' },
      { key: '_sRef', label: '환불완료', style: 'width:52px;', align: 'center',
        fmt: (v, row) => row.refundCompltYn === 'Y' ? '1' : '',
        cellStyle: (v, row) => row.refundCompltYn === 'Y' ? 'color:#d95050;font-weight:700;' : '' },
      { key: 'itemCancelAmt',    label: '환불금액', style: 'width:82px;', align: 'right',
        fmt: (v) => v ? fmt(v) : '-',
        cellStyle: (v) => v ? 'color:#d95050;' : 'color:#d0d0d0;' },
      { key: 'itemCompletedAmt', label: '확정금액', style: 'width:82px;', align: 'right',
        fmt: (v) => v ? fmt(v) : '-',
        cellStyle: (v) => v ? 'color:#2a7d52;font-weight:600;' : 'color:#d0d0d0;' },
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
            if (!c || c.type !== '교환') { return []; }
            return [
              ...(c.exchangeCourier ? [{ courier: c.exchangeCourier, trackingNo: c.exchangeTrackingNo, colorVariant: 'blue' }] : []),
              ...(c.courier         ? [{ label: '수거', courier: c.courier, trackingNo: c.trackingNo, colorVariant: 'orange' }] : []),
            ];
          },
          onTrack: openTracking,
        } },
      { type: 'actions', visible: () => !cfDtlMode.value, actions: [
        { label: '삭제', cls: 'btn btn_row_delete', onClick: (row, idx) => handleBtnAction('orderItems-remove', idx) },
      ] },
    ];

    // pay_statuses 폴백 옵션 — sy_code 로딩 전엔 PAY_STATUS_FALLBACK 사용
    const cfPayStatusOptions = computed(() => {
      if (codes.pay_statuses && codes.pay_statuses.length) { return codes.pay_statuses; }
      return boConsts.PAY_STATUS_FALLBACK.map(function (c) { return { codeValue: c.codeValue, codeLabel: c.codeLabel }; });
    });
    // 기본 폼
    columns.baseForm = [
      { key: 'orderId',      label: '주문ID', type: 'text', required: true,
        placeholder: 'ORD-2026-XXX', readonly: !cfIsNew.value },
      { key: 'memberId',     label: '회원ID', type: 'slot', name: 'memberId', required: true },
      { key: 'memberNm',     label: '회원명', type: 'text' },
      { key: 'orderDate',    label: '주문일시', type: 'text', placeholder: '2026-04-08 10:00' },
      { key: 'prodNm',       label: '상품', type: 'text', placeholder: '상품명', colSpan: 2 },
      { key: '_vendor',      label: '판매업체', type: 'slot', name: 'vendor', colSpan: 2 },
      { key: 'totalAmt',     label: '결제금액', type: 'number' },
      { key: 'payMethodCd',  label: '결제수단', type: 'select', options: () => codes.payment_methods },
      { key: 'payStatusCd',  label: '결제상태', type: 'select', options: () => cfPayStatusOptions.value },
      { key: 'payDate',      label: '결제일시', type: 'text', placeholder: '2026-04-05 14:32' },
      { key: 'orderStatusCd', label: '상태', type: 'select', options: () => codes.order_statuses },
      { key: 'memo',         label: '메모', type: 'slot', name: 'memo', colSpan: 2 },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    /* orderItemGridRowDetail — 주문항목 행 펼침 BoFormArea 컬럼 (교환품 정보) */
    columns.orderItemGridRowDetail = [
      { key: '_exchLabel', label: '교환품',  type: 'readonly', html: true, fmt: () => `<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:#3b82f6;color:#fff;font-weight:800;">↔ 교환</span>` },
      { key: '_exchProd',  label: '상품명',  type: 'readonly', html: true, fmt: (v, row) => `<b style="color:#1e40af;">${getExchangedItem(row).prodNm || '-'}</b>` },
      { key: '_exchColor', label: '색상',    type: 'readonly', html: true, fmt: (v, row) => `<b>${row.color || '-'}</b> → <b style="color:#1e40af;">${getExchangedItem(row).color || '-'}</b>` },
      { key: '_exchSize',  label: '사이즈',  type: 'readonly', fmt: (v, row) => getExchangedItem(row).size || '-' },
      { key: '_exchQty',   label: '수량',    type: 'readonly', fmt: (v, row) => getExchangedItem(row).qty || '-' },
      { key: '_tracking',  label: '발송추적', type: 'slot', name: 'tracking', visible: (row) => !!getExchangedItem(row).courier },
    ];

    /* fnShareUrl — 이 주문 상세를 가리키는 독립 새창 딥링크 URL 생성 */
    const fnShareUrl = () => {
      const qs = new URLSearchParams();
      qs.set('page', 'odOrderDtl');
      qs.set('id', form.orderId);
      qs.set('embed', '1');
      return `${window.location.origin}${window.location.pathname}?${qs.toString()}`;
    };
    /* handleShareKakao — 카카오톡 공유(피드 카드, 상세보기 모드 전용) */
    const handleShareKakao = () => {
      try {
        window.coExtSdk.shareKakao({
          title: `주문 ${form.orderId} - ShopJoy BO`,
          description: form.prodNm || '',
          imageUrl: window.location.origin + '/assets/img/shopjoy-share-og.png',
          url: fnShareUrl(),
        });
      } catch (e) {
        showToast(e.message || '카카오톡 공유를 열 수 없습니다.', 'error', 0);
      }
    };
    /* handleCopyLink — 순수 URL만 클립보드에 복사 (카카오톡 카드 없음) */
    const handleCopyLink = async () => {
      try {
        await navigator.clipboard.writeText(fnShareUrl());
        showToast('링크가 복사되었습니다.', 'success');
      } catch (e) {
        showToast(e.message || '링크 복사에 실패했습니다.', 'error', 0);
      }
    };
    /* pdfAreaRef — 주문 상세 카드 캡처 대상. handleExportPdf — PDF 다운로드(상세보기 모드 전용) */
    const pdfAreaRef = ref(null);
    const pdfExporting = ref(false);
    const handleExportPdf = async () => {
      pdfExporting.value = true;
      try {
        const filename = coUtil.cofBuildExportFilename(`주문상세_${form.orderId}.pdf`);
        await window.boUtil.bofExportPdf(pdfAreaRef.value, filename, showToast);
      } finally {
        pdfExporting.value = false;
      }
    };

    return {
      columns,
      handleShareKakao, handleCopyLink,                                    // 카카오톡 공유 / 링크 복사 (상세보기)
      pdfAreaRef, pdfExporting, handleExportPdf,                           // PDF 다운로드 (항상 노출)
      form, errors, orderItems, activeTab, tabMode2,                      // 상태 / 데이터
      odModal, payState,                                                                                   // MD 대리주문: 모달/결제 상태
      handleBtnAction, handleSelectAction, fnCallbackModal, onProdToggled,                                // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfDtlMode, cfCurrentStepIdx, cfIsCanceled, cfRelatedVendor, cfRelatedDelivery, // computed
      cfRelatedClaim, tabs, cfEditHistList, cfPaymentList, cfStatusHistList, cfAllExpanded, cfOrderItemSummary, // computed
      ORDER_STEPS, CLAIM_FLOWS, CLAIM_TYPE_COLOR, // 상수
      fmt, fnAmtShort, showTab, isExpanded, fnItemExpanded, getExchangedItem,        // 헬퍼
      showRefModal, showToast, showConfirm,                                                                // 모달/알림 (template + 공통 컴포넌트 prop 전달)
    };
  },
  template: /* html */`
<div ref="pdfAreaRef">
<!-- ===== ■. 상세 카드 (제목 + 탭바 + 탭컨텐츠를 한 영역으로) ===================== -->
<bo-container :title="!active ? '주문 상세' : (cfIsNew ? '주문 등록' : (cfDtlMode ? '주문 상세' : '주문 수정'))"
  :title-id="!active ? '' : (cfIsNew ? '' : form.orderId)">
  <template #toolbar-actions>
    <button v-if="active ? (cfDtlMode ? !cfIsNew : false) : false" class="btn btn_link" title="링크 공유(URL만)" @click="handleCopyLink">🔗</button>
    <button v-if="active ? (cfDtlMode ? !cfIsNew : false) : false" class="btn btn_kakao" title="카카오톡 공유" @click="handleShareKakao">💬</button>
    <button class="btn btn_pdf" title="PDF 다운로드" :disabled="pdfExporting" @click="handleExportPdf">
      <span v-if="pdfExporting">⏳</span>
      <svg v-else width="18" height="20" viewBox="0 0 32 36" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 2 H20 L28 10 V34 H4 Z" fill="#fff" stroke="#c2410c" stroke-width="1.5"/>
        <path d="M20 2 V10 H28 Z" fill="#f3d4c0"/>
        <rect x="2" y="20" width="28" height="12" rx="2" fill="#e2372c"/>
        <text x="16" y="29" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="#fff" text-anchor="middle">PDF</text>
      </svg>
    </button>
  </template>
  <!-- ===== ■.■. 탭바 (초기/신규에도 항상 표시 — 화면 구성 노출) ==================== -->
  <bo-tab-bar :tabs="tabs" :tab="activeTab" :tab-mode="tabMode2"
    @tab-select="id => handleBtnAction('tab-change', id)"
    @mode-select="m => handleBtnAction('viewMode-change', m)" />
  <!-- ===== □.■. 탭바 ==================================================== -->
  <!-- ===== ■. 탭 컨텐츠 =================================================== -->
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">
    <div v-if="showTab('info')" class="dtl-pane">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📋 상세정보</div>
      <!-- ===== ■.■.■. MD 대리주문 툴바 (주문 복사 — 편집 모드에서만) ==================== -->
      <div v-if="!cfDtlMode" style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding:10px 14px;background:#eef4ff;border:1px solid #c7d9f5;border-radius:8px;">
        <span style="font-size:12px;font-weight:700;color:#1e40af;">🧾 MD 대리주문</span>
        <span style="font-size:11px;color:#5a6b8c;">고객 요청으로 MD가 대신 주문합니다.</span>
        <button type="button" class="btn btn-secondary btn-sm" style="margin-left:auto;" @click="handleBtnAction('orderCopyModal-open')">📋 기존 주문 복사</button>
      </div>
      <!-- ===== ■.■.■. 주문 진행 상태 흐름 (초기/신규에도 표시 — 빈 주문은 회색 스텝) ====== -->
      <div style="margin-bottom:20px;padding:16px 18px;background:#f6f6f6;border-radius:10px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <span style="font-size:11px;font-weight:800;padding:3px 10px;border-radius:10px;color:#fff;background:#16a34a;">주문</span>
          <span style="font-size:13px;font-weight:700;color:#222;">{{ form.orderId || (cfIsNew ? '신규 주문' : '') }}</span>
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
              <span v-if="step==='배송완료' ? (cfRelatedDelivery ? (cfRelatedDelivery.trackingNo) : false) : false" @click="handleBtnAction('tracking-open', { courier: cfRelatedDelivery.courier, trackingNo: cfRelatedDelivery.trackingNo })" title="배송조회 창 열기" style="margin-top:4px;padding:1px 7px;border:1px solid #86efac;background:#dcfce7;color:#15803d;border-radius:4px;font-size:0.7rem;font-weight:700;user-select:none;">
                {{ (cfRelatedDelivery.courier||'').replace('대한통운','').replace('택배','') || 'CJ' }}배송 🔍
              </span>
            </div>
            <div v-if="idx < ORDER_STEPS.length - 1"
              :style="{flex:'1', height:'2px', minWidth:'12px', marginTop:'6px',
              background: idx < cfCurrentStepIdx ? '#4ade80' : '#bbb'}"></div>
          </template>
        </div>
      </div>
      <!-- ===== ■.■.■. 클레임 진행 흐름 (있을 때만) =================================== -->
      <div v-if="!cfIsNew ? (cfRelatedClaim) : false" style="margin-bottom:20px;padding:16px;border-radius:10px;border:1px dashed #e8e8e8;" :style="{ background: 'linear-gradient(135deg,'+CLAIM_TYPE_COLOR[cfRelatedClaim.type]+'15 0%,#fff 70%)', }">
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
              <span v-if="step==='수거중' ? (cfRelatedClaim.trackingNo) : false" @click="handleBtnAction('tracking-open', { courier: cfRelatedClaim.courier, trackingNo: cfRelatedClaim.trackingNo })" title="수거 배송조회" style="margin-top:4px;padding:1px 7px;border:1px solid #fed7aa;background:#fff7ed;color:#c2410c;border-radius:4px;font-size:0.7rem;font-weight:700;user-select:none;">
                {{ (cfRelatedClaim.courier||'').replace('대한통운','').replace('택배','') || 'CJ' }}수거 🔍
              </span>
              <span v-if="step==='완료' ? (cfRelatedClaim.exchangeTrackingNo) : false" @click="handleBtnAction('tracking-open', { courier: cfRelatedClaim.exchangeCourier, trackingNo: cfRelatedClaim.exchangeTrackingNo })" title="발송 배송조회" style="margin-top:4px;padding:1px 7px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;border-radius:4px;font-size:0.7rem;font-weight:700;user-select:none;">
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
      <!-- ===== ■.■.■. 기본정보 폼 (BoFormArea 자동 렌더) =========================== -->
      <!-- ===== ■.■.■. 폼 영역 ================================================ -->
      <bo-form-area plain-readonly :columns="columns.baseForm" :form="form" :errors="errors"
        :readonly="cfDtlMode" :cols="3" compact :show-actions="active" :show-cancel="!cfIsNew" :show-delete="false"
        @save="handleBtnAction('form-save')"
        @cancel="handleBtnAction('form-cancel')"
        @edit="handleBtnAction('form-edit')"
        @close="handleBtnAction('form-close')">
        <!-- ===== ■.■.■.■. 회원ID + 선택/보기 (MD 대리주문: 회원 모달 선택) ============ -->
        <template #memberId>
          <div v-if="cfDtlMode" class="readonly-field-plain" style="display:flex;gap:6px;align-items:center;">
            <span>{{ form.memberId || '-' }}</span>
            <span v-if="form.memberId" class="ref-link" @click="handleBtnAction('form-memberRef')">보기</span>
          </div>
          <template v-else>
            <div style="display:flex;gap:6px;align-items:center;">
              <input class="form-control" v-model="form.memberId" placeholder="회원 ID" :class="errors.memberId ? 'is-invalid' : ''" style="flex:1;min-width:0;"
                @input="form.memberId && errors.memberId ? delete errors.memberId : null" />
              <span style="display:inline-flex;align-items:center;flex-shrink:0;">
                <button type="button" class="btn btn-blue btn-sm" @click="handleBtnAction('memberModal-open')">🔍 회원선택</button>
                <button v-if="form.memberId" type="button" title="선택 해제" style="background:none;border:none;padding:0 4px;color:#bbb;cursor:pointer;font-size:11px;line-height:1;" @click="form.memberId = ''; form.memberNm = '';">x</button>
              </span>
              <span v-if="form.memberId" class="ref-link" @click="handleBtnAction('form-memberRef')">보기</span>
            </div>
            <span v-if="errors.memberId" class="field-error">{{ errors.memberId }}</span>
          </template>
        </template>
        <!-- ===== ■.■.■.■. 판매업체 표시 =========================================== -->
        <template #vendor>
          <div v-if="cfRelatedVendor" style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:13px;font-weight:700;color:#222;">{{ cfRelatedVendor.vendorNm }}</span>
            <span style="font-size:11px;color:#888;">| {{ cfRelatedVendor.ceo }} | {{ cfRelatedVendor.phone }}</span>
            <span class="ref-link" @click="handleBtnAction('form-vendorRef', cfRelatedVendor.vendorId)">보기</span>
          </div>
          <div v-else style="font-size:12px;color:#bbb;">-</div>
        </template>
        <!-- ===== ■.■.■.■. 메모: Quill 또는 view 모드 HTML ========================= -->
        <template #memo>
          <div v-if="cfDtlMode" class="readonly-field-plain" style="min-height:90px;line-height:1.6;" v-html="form.memo || '-'"></div>
          <base-html-editor v-else v-model="form.memo" height="180px" />
        </template>
      </bo-form-area>
    </div>
    <!-- ===== ■.■. 주문항목목록 탭 ============================================== -->
    <div v-if="showTab('items')" class="dtl-pane" style="padding:20px;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📦 주문항목 <span class="tab-count"> {{ orderItems.length }} </span></div>
      <!-- ===== ■.■.■. 상품 선택 툴바 (MD 대리주문 — 편집 모드) ====================== -->
      <div v-if="!cfDtlMode" style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <button type="button" class="btn btn-blue btn-sm" @click="handleBtnAction('prodModal-open')">🛍 상품 선택</button>
        <span style="font-size:11px;color:#888;">상품을 선택하여 주문항목에 추가합니다.</span>
      </div>
      <div v-if="cfRelatedClaim ? (cfRelatedClaim.type==='교환') : false" style="display:flex;justify-content:flex-end;margin-bottom:10px;">
        <button class="btn btn-secondary btn-sm" @click="handleBtnAction('orderItems-toggleExpandAll')">
          {{ cfAllExpanded ? '▲ 교환품 모두접기' : '▼ 교환품 모두펼치기' }}
        </button>
      </div>
      <!-- ===== ■.■.■. 상태 요약 열 ============================================ -->
      <div v-if="orderItems.length" style="display:grid;grid-template-columns:repeat(6,1fr);border:1px solid #ede6e6;border-radius:8px;overflow:hidden;margin-bottom:10px;">
        <div style="padding:9px 12px;text-align:center;background:#f4f8ff;border-right:1px solid #ede6e6;">
          <div style="font-size:10px;color:#8a9bbf;font-weight:600;margin-bottom:4px;">주문중</div>
          <div style="font-size:16px;font-weight:700;color:#3a6ecf;">{{ cfOrderItemSummary.inProgress }}<span style="font-size:11px;font-weight:400;">건</span></div>
          <div style="font-size:11px;color:#8ab0e0;margin-top:2px;">{{ fnAmtShort(cfOrderItemSummary.amtProgress) }}</div>
        </div>
        <div style="padding:9px 12px;text-align:center;background:#f4f8f7;border-right:1px solid #ede6e6;">
          <div style="font-size:10px;color:#7a9595;font-weight:600;margin-bottom:4px;">배송완료</div>
          <div style="font-size:16px;font-weight:700;color:#5a8080;">{{ cfOrderItemSummary.delivered }}<span style="font-size:11px;font-weight:400;">건</span></div>
          <div style="font-size:11px;color:#7aa0a0;margin-top:2px;">{{ fnAmtShort(cfOrderItemSummary.amtDelivered) }}</div>
        </div>
        <div style="padding:9px 12px;text-align:center;background:#f4fbf7;border-right:1px solid #ede6e6;">
          <div style="font-size:10px;color:#6a9580;font-weight:600;margin-bottom:4px;">주문완료</div>
          <div style="font-size:16px;font-weight:700;color:#2a7d52;">{{ cfOrderItemSummary.confirmed }}<span style="font-size:11px;font-weight:400;">건</span></div>
          <div style="font-size:11px;color:#6aaa80;margin-top:2px;">{{ fnAmtShort(cfOrderItemSummary.amtConfirmed) }}</div>
        </div>
        <div style="padding:9px 12px;text-align:center;background:#fff8f0;border-right:1px solid #ede6e6;">
          <div style="font-size:10px;color:#b08050;font-weight:600;margin-bottom:4px;">클레임진행중</div>
          <div style="font-size:16px;font-weight:700;color:#c07030;">{{ cfOrderItemSummary.claimActive.total }}<span style="font-size:11px;font-weight:400;">건</span></div>
          <div style="font-size:11px;color:#c0905a;margin-top:2px;">{{ fnAmtShort(cfOrderItemSummary.amtClaimActive) }}</div>
          <div style="font-size:10px;color:#c0a080;margin-top:2px;">취소:{{ cfOrderItemSummary.claimActive.cancel }} 반품:{{ cfOrderItemSummary.claimActive.return }} 교환:{{ cfOrderItemSummary.claimActive.exchange }}</div>
        </div>
        <div style="padding:9px 12px;text-align:center;background:#f9f9f9;border-right:1px solid #ede6e6;">
          <div style="font-size:10px;color:#909090;font-weight:600;margin-bottom:4px;">클레임완료</div>
          <div style="font-size:16px;font-weight:700;color:#808080;">{{ cfOrderItemSummary.claimDone.total }}<span style="font-size:11px;font-weight:400;">건</span></div>
          <div style="font-size:11px;color:#a0a0a0;margin-top:2px;">{{ fnAmtShort(cfOrderItemSummary.amtClaimDone) }}</div>
          <div style="font-size:10px;color:#b0b0b0;margin-top:2px;">취소:{{ cfOrderItemSummary.claimDone.cancel }} 반품:{{ cfOrderItemSummary.claimDone.return }} 교환:{{ cfOrderItemSummary.claimDone.exchange }}</div>
        </div>
        <div style="padding:9px 12px;text-align:center;background:#fff5f5;">
          <div style="font-size:10px;color:#c08080;font-weight:600;margin-bottom:4px;">환불완료</div>
          <div style="font-size:16px;font-weight:700;color:#d95050;">{{ cfOrderItemSummary.refund }}<span style="font-size:11px;font-weight:400;">건</span></div>
          <div style="font-size:11px;color:#e07070;margin-top:2px;">{{ fnAmtShort(cfOrderItemSummary.amtRefund) }}</div>
        </div>
      </div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="columns.orderItemGrid" :rows="orderItems"
        :is-expanded="fnItemExpanded"
        empty-text="주문 항목 정보가 없습니다.">
        <template #cell-prodNm="{ row, idx }">
          <td style="font-size:12px;">
            <span v-if="cfRelatedClaim ? (cfRelatedClaim.type==='교환') : false" @click="handleSelectAction('orderItems-rowToggleExpand', idx)" style="font-size:11px;color:#3b82f6;font-weight:800;user-select:none;margin-right:6px;" :title="isExpanded(idx)?'교환품 숨기기':'교환품 보기'">
              {{ isExpanded(idx) ? '▼' : '▶' }}
            </span>
            <span style="font-size:18px;margin-right:6px;">{{ row.emoji || '🛍' }}</span>
            {{ row.prodNm }}
          </td>
        </template>
        <template #row-expand="{ row, colspan }">
          <td :colspan="colspan" style="padding:10px 14px;background:#f0f7ff;">
            <bo-form-area plain-readonly :columns="columns.orderItemGridRowDetail" :form="row" :cols="3" compact readonly label-left :show-actions="false">
              <template #tracking>
                <div class="readonly-field" @click="handleBtnAction('tracking-open', { courier: getExchangedItem(row).courier, trackingNo: getExchangedItem(row).trackingNo })" style="padding:2px 8px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;border-radius:4px;font-size:11px;font-weight:700;display:inline-block;">
                  {{ getExchangedItem(row).courier }} · {{ getExchangedItem(row).trackingNo || '-' }} 🔍
                </div>
              </template>
            </bo-form-area>
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
            <td v-if="!cfDtlMode"></td>
          </tr>
        </template>
      </bo-grid>
    </div>
    <!-- ===== □.□. 주문항목목록 탭 ============================================== -->
    <!-- ===== ■.■. 결제정보 탭 ================================================ -->
    <div v-if="showTab('payment')" class="dtl-pane" style="padding:20px;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">💳 결제정보 <span class="tab-count"> {{ cfPaymentList.length }} </span></div>
      <!-- ===== ■.■.■. 결제 요약 + 토스 간편위젯 결제 (편집 모드) ==================== -->
      <div v-if="!cfDtlMode" style="margin-bottom:18px;padding:16px 18px;background:#f9fafb;border:1px solid #e5e8ed;border-radius:10px;">
        <div style="display:flex;gap:24px;align-items:flex-start;">
          <!-- 좌: 금액 요약 -->
          <div style="display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap;flex:1;">
            <div style="margin:0;">
              <label class="form-label">상품 합계</label>
              <div class="form-control" style="background:#fff;text-align:right;font-weight:700;min-width:120px;">{{ fmt(orderItems.reduce((s,x)=>s+(Number(x.price)||0),0)) }}</div>
            </div>
            <div style="font-size:18px;color:#bbb;padding-bottom:6px;">+</div>
            <div style="margin:0;">
              <label class="form-label">배송비 <span style="font-size:10px;color:#e8587a;">(추가요청 가능)</span></label>
              <input class="form-control" type="number" v-model.number="form.dlivFee" style="text-align:right;min-width:120px;" @input="handleSelectAction('dlivFee-change')" />
            </div>
            <div style="font-size:18px;color:#bbb;padding-bottom:6px;">=</div>
            <div style="margin:0;">
              <label class="form-label">결제 금액</label>
              <div class="form-control" style="background:#fff8f9;border-color:#f3c6d4;text-align:right;font-weight:800;color:#e8587a;min-width:140px;">{{ fmt(form.totalAmt) }}</div>
            </div>
          </div>
          <!-- 우: 간편 위젯 결제 (결제위젯 연동 키 사용) -->
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px;flex-shrink:0;min-width:220px;">
            <base-toss-pay-widget :amount="Number(form.totalAmt)||0"
              :order-id="form.orderId" :order-name="form.prodNm || '주문결제'"
              :customer-key="form.memberId" :customer-name="form.memberNm || '고객'"
              success-page="odOrderMng" fail-page="odOrderMng"
              :show-toast="showToast" :show-confirm="showConfirm" />
          </div>
        </div>
      </div>
      <!-- ===== ■.■.■. 추가결제 요청 (편집 모드) ===================================== -->
      <div v-if="!cfDtlMode" style="margin-bottom:18px;padding:14px 18px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;">
        <div style="font-size:12px;font-weight:700;color:#c2410c;margin-bottom:8px;">➕ 추가결제 요청 <span style="font-weight:400;color:#9a6a4a;">— 배송비 등 추가 비용을 고객에게 요청</span></div>
        <div style="display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;">
          <div style="margin:0;">
            <label class="form-label">요청 금액</label>
            <input class="form-control" type="number" v-model.number="form.extraReqAmt" placeholder="0" style="text-align:right;min-width:120px;" />
          </div>
          <div style="margin:0;flex:1;min-width:200px;">
            <label class="form-label">사유</label>
            <input class="form-control" v-model="form.extraReqReason" placeholder="예: 도서산간 추가 배송비" />
          </div>
          <button type="button" class="btn btn_send" style="flex-shrink:0;" @click="handleBtnAction('extraPay-request')">전송</button>
        </div>
      </div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="columns.paymentGrid" :rows="cfPaymentList" empty-text="결제정보가 없습니다."></bo-grid>
    </div>
    <!-- ===== □.□. 결제정보 탭 ================================================ -->
    <!-- ===== ■.■. 상태변경이력 탭 ============================================== -->
    <div v-if="showTab('hist')" class="dtl-pane">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title" style="margin-bottom:10px;padding:0 0 10px 0;">
        🕒 상태변경이력
        <span class="tab-count">{{ cfStatusHistList.length }}</span>
      </div>
      <od-order-hist :order-id="form.orderId" :navigate="navigate" />
    </div>
    <!-- ===== □.□. 상태변경이력 탭 ============================================== -->
    <!-- ===== ■.■. 정보수정이력 탭 ============================================== -->
    <div v-if="showTab('editHist')" class="dtl-pane" style="padding:20px;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📝 정보수정이력 <span class="tab-count"> {{ cfEditHistList.length }} </span></div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="columns.editHistGrid" :rows="cfEditHistList" empty-text="정보 수정 이력이 없습니다."></bo-grid>
    </div>
    <!-- ===== □.□. 정보수정이력 탭 ============================================== -->
  </div>
  <!-- ===== □. 탭 컨텐츠 =================================================== -->
  <!-- ===== ■. MD 대리주문 모달 (회원 선택 / 주문 복사 / 상품 선택) =================== -->
  <!-- v-if 미사용: :show false→true 전환을 모달 내부 watch 가 관찰해야 최초 목록 로드됨 -->
  <bo-cm-popup-modal popup-cmd="cmPopup-member-pick" popup-code="member" :show="odModal.member" :on-callback="fnCallbackModal" @close="handleBtnAction('memberModal-close')" />
  <bo-cm-popup-modal v-if="odModal.orderCopy" popup-cmd="cmPopup-order-copy" popup-code="order" :on-callback="fnCallbackModal" @close="handleBtnAction('orderCopyModal-close')" />
  <bo-cm-popup-modal popup-code="prod" result-type="row" :show="odModal.prod" :selected-ids="orderItems.map(it => it.productId)" @toggle="onProdToggled" @close="handleBtnAction('prodModal-close')" />
  <!-- ===== □. MD 대리주문 모달 ============================================== -->
</bo-container>
<!-- ===== □. 상세 카드 (제목 + 탭바 + 탭컨텐츠를 한 영역으로) ===================== -->
</div>
`
};
