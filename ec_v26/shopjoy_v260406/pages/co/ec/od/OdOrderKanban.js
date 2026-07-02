/**
 * OdOrderKanban.js — 주문/클레임 칸반 보드 (FO/BO 공용)
 *
 * 주문 진행상태, 클레임(취소/반품/교환) 진행상태를 칸반 보드로 시각화.
 * 카드를 드래그하거나 버튼 클릭으로 상태 이동 (validation 포함).
 *
 * Props:
 *   orderId      — 주문 ID (필수)
 *   orderItemId  — 주문항목 ID (선택). 일치 행 bold/파란 테두리 강조.
 *   claimId      — 클레임 ID (선택). 일치 클레임 행 강조.
 *   mode         — 'bo'(관리자, 기본) | 'fo'(사용자, 읽기전용)
 *   asModal      — true 면 닫기 버튼 노출
 *   onClose      — 닫기 콜백
 *   showToast    — 토스트 함수 (미전달 시 boApp fallback)
 *   showConfirm  — 확인 모달 함수 (미전달 시 boApp fallback)
 *
 * 상태코드 (DB 기준):
 *   ORDER_ITEM_STATUS: ORDERED/PAID/PREPARING/SHIPPING/DELIVERED/CONFIRMED/CANCELLED
 *   CLAIM_TYPE       : CANCEL/RETURN/EXCHANGE
 *   CLAIM_STATUS     : REQUESTED/APPROVED/IN_PICKUP/PROCESSING/REFUND_WAIT/COMPLT/CANCELLED
 */

/* ── 스타일 한 번만 주입 ── */
(function () {
  if (document.getElementById('od-kanban-style')) return;
  var s = document.createElement('style');
  s.id = 'od-kanban-style';
  s.textContent = [
    '.od-kanban-wrap{font-family:inherit;color:#1f2937;}',
    '.od-kanban-hdr{display:flex;align-items:center;gap:12px;padding:14px 18px 10px;border-bottom:1px solid #f0f0f0;flex-wrap:wrap;}',
    '.od-kanban-hdr-title{font-size:15px;font-weight:700;color:#111;}',
    '.od-kanban-hdr-id{font-size:12px;color:#6b7280;font-family:monospace;}',
    '.od-kanban-hdr-id.hl-id{color:#1d4ed8;font-weight:800;}',
    '.od-kanban-hdr-close{margin-left:auto;background:none;border:none;font-size:18px;cursor:pointer;color:#9ca3af;padding:4px 8px;}',
    '.od-kanban-hdr-close:hover{color:#ef4444;}',
    '.od-kanban-order-info{display:flex;gap:18px;flex-wrap:wrap;padding:10px 18px 12px;font-size:12px;background:#fafafa;border-bottom:1px solid #f0f0f0;}',
    '.od-kanban-order-info dt{color:#6b7280;margin-bottom:1px;font-size:11px;}',
    '.od-kanban-order-info dd{font-weight:600;color:#111;margin:0;}',
    '.od-kanban-status-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;background:#e0f2fe;color:#0369a1;}',
    '.od-kanban-section{padding:14px 18px 0;}',
    '.od-kanban-section-title{font-size:13px;font-weight:600;color:#374151;margin-bottom:10px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}',
    '.od-kanban-hl-badge{font-size:11px;font-weight:700;background:#3b82f6;color:#fff;padding:2px 7px;border-radius:10px;}',
    /* 칸반 보드 */
    '.od-kanban-board{display:flex;gap:0;overflow-x:auto;padding-bottom:10px;width:100%;}',
    '.od-kanban-col{flex:1 1 100px;min-width:90px;display:flex;flex-direction:column;}',
    '.od-kanban-col-hdr{text-align:center;padding:7px 4px 6px;background:#f9fafb;border-top:3px solid #e5e7eb;border-bottom:1px solid #e5e7eb;font-size:11px;font-weight:600;color:#374151;transition:border-color .15s;line-height:1.3;}',
    '.od-kanban-col-hdr.active-col{border-top-color:#3b82f6;background:#eff6ff;color:#1d4ed8;}',
    '.od-kanban-col-hdr.drag-over-col{background:#fef3c7;border-top-color:#f59e0b;}',
    '.od-kanban-col-body{flex:1;min-height:40px;padding:6px 5px;background:#f9fafb;border-right:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0;transition:background .15s;}',
    '.od-kanban-col-body.drag-over-body{background:#fef9c3;}',
    /* 카드 */
    '.od-kanban-card{background:#fff;border:1.5px solid #e5e7eb;border-radius:8px;padding:8px 9px;margin-bottom:6px;font-size:11px;transition:box-shadow .15s,transform .1s;user-select:none;}',
    '.od-kanban-card.draggable-card{cursor:grab;}',
    '.od-kanban-card.draggable-card:active{cursor:grabbing;transform:scale(1.02);box-shadow:0 4px 16px rgba(0,0,0,.13);}',
    '.od-kanban-card.hl-card{border-color:#3b82f6;background:#eff6ff;font-weight:700;box-shadow:0 0 0 2px rgba(59,130,246,.5);}',
    '.od-kanban-card.dragging-card{opacity:.45;}',
    '.od-kanban-card-id{font-family:monospace;font-size:10px;color:#6b7280;margin-bottom:2px;}',
    '.od-kanban-card-id.hl-id{color:#1d4ed8;font-weight:800;}',
    '.od-kanban-card-nm{font-weight:600;color:#111;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:104px;}',
    '.od-kanban-card-meta{color:#6b7280;font-size:10px;}',
    '.od-kanban-card-dliv{display:flex;align-items:center;gap:3px;font-size:10px;color:#6b7280;margin-top:3px;background:#f0fdf4;border-radius:4px;padding:2px 5px;}',
    '.od-kanban-card-dliv .dliv-no-reg{color:#ef4444;}',
    /* 정산 뱃지 */
    '.od-kanban-settle{display:flex;flex-wrap:wrap;gap:2px;margin-top:4px;}',
    '.od-kanban-settle-badge{display:inline-flex;align-items:center;gap:2px;font-size:10px;font-weight:600;padding:1px 6px;border-radius:8px;white-space:nowrap;}',
    '.od-kanban-settle-badge.settle-locked{background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;}',
    '.od-kanban-settle-badge.settle-closed{background:#f0fdf4;color:#16a34a;border:1px solid #86efac;}',
    '.od-kanban-settle-badge.settle-pending{background:#fffbeb;color:#d97706;border:1px solid #fcd34d;}',
    '.od-kanban-settle-badge.settle-voucher{background:#f5f3ff;color:#7c3aed;border:1px solid #c4b5fd;}',
    '.od-kanban-settle-badge.settle-amt{background:#f0f9ff;color:#0369a1;border:1px solid #7dd3fc;}',
    '.od-kanban-card.locked-card{cursor:not-allowed!important;border-color:#fca5a5;background:#fff7f7;}',
    '.od-kanban-move-btn.btn-locked{opacity:.4;cursor:not-allowed;}',
    '.od-kanban-empty{color:#d1d5db;text-align:center;font-size:11px;padding:16px 0;}',
    '.od-kanban-loading{text-align:center;padding:40px;color:#9ca3af;font-size:13px;}',
    '.od-kanban-divider{border:none;border-top:1px solid #f0f0f0;margin:0 18px;}',
    /* 빠른 이동 버튼 */
    '.od-kanban-move-btn{border:none;border-radius:5px;padding:3px 8px;font-size:10px;font-weight:600;background:#3b82f6;color:#fff;cursor:pointer;flex:0 0 auto;white-space:nowrap;}',
    '.od-kanban-move-btn:hover{background:#1d4ed8;}',
    '.od-kanban-move-btns{display:flex;gap:4px;margin-top:6px;flex-wrap:wrap;padding:0 2px;}',
    /* 검색바 */
    '.od-kanban-search{padding:10px 18px;background:#fff;border-bottom:1px solid #f0f0f0;display:flex;flex-wrap:wrap;gap:6px;align-items:center;}',
    '.od-kanban-search-group{display:flex;align-items:center;gap:5px;flex-wrap:wrap;}',
    '.od-kanban-search-label{font-size:11px;color:#6b7280;font-weight:600;white-space:nowrap;}',
    '.od-kanban-search input,.od-kanban-search select{border:1px solid #d1d5db;border-radius:5px;padding:4px 8px;font-size:12px;background:#fff;color:#111;outline:none;}',
    '.od-kanban-search input:focus,.od-kanban-search select:focus{border-color:#6366f1;box-shadow:0 0 0 2px rgba(99,102,241,.15);}',
    '.od-kanban-search .btn-search{background:#6366f1;color:#fff;border:none;border-radius:5px;padding:4px 12px;font-size:12px;font-weight:600;cursor:pointer;}',
    '.od-kanban-search .btn-search:hover{background:#4f46e5;}',
    '.od-kanban-search .btn-reset{background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:5px;padding:4px 10px;font-size:12px;cursor:pointer;}',
    '.od-kanban-search .btn-reset:hover{background:#e5e7eb;}',
    '.od-kanban-hl-row{padding:6px 18px 8px;background:#fafafa;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}',
    '.od-kanban-hl-row-label{font-size:11px;color:#6b7280;font-weight:600;white-space:nowrap;}',
    '.od-kanban-hl-row input{border:1px solid #d1d5db;border-radius:5px;padding:3px 8px;font-size:12px;background:#fff;color:#111;width:180px;font-family:monospace;outline:none;}',
    '.od-kanban-hl-row input:focus{border-color:#3b82f6;box-shadow:0 0 0 2px rgba(59,130,246,.15);}',
    '.od-kanban-hl-tag{display:inline-flex;align-items:center;gap:4px;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:10px;padding:2px 10px;font-size:11px;font-weight:700;font-family:monospace;}',
    '.od-kanban-hl-tag button{background:none;border:none;color:#93c5fd;cursor:pointer;font-size:12px;padding:0 2px;line-height:1;}',
    '.od-kanban-hl-tag button:hover{color:#1d4ed8;}',
  ].join('');
  document.head.appendChild(s);
}());

window.OdOrderKanban = {
  name: 'OdOrderKanban',
  props: {
    orderId:     { type: String,   default: null },
    orderItemId: { type: String,   default: null },
    claimId:     { type: String,   default: null },
    mode:        { type: String,   default: 'bo' },   // 'bo' | 'fo'
    asModal:     { type: Boolean,  default: false },
    onClose:     { type: Function, default: null },
    showToast:   { type: Function, default: null },
    showConfirm: { type: Function, default: null },
    navigate:    { type: Function, default: null },   // 페이지 이동
  },

  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted } = Vue;

    /* orderItemId / claimId / orderId:
     *   props 우선, 없으면 window._odKanbanParams 에서 읽음 (boApp navigate 우회).
     *   사용법: window._odKanbanParams = { orderItemId, claimId }; navigate('odOrderKanban', { id: orderId }); */
    var _kp = window._odKanbanParams || {};
    var _oi = ref(props.orderItemId || _kp.orderItemId || null);
    var _ci = ref(props.claimId     || _kp.claimId     || null);
    /* 현재 조회 중인 orderId (검색으로 변경 가능) */
    var currentOrderId = ref(props.orderId || _kp.orderId || null);
    window._odKanbanParams = null; // 소비 후 초기화

    /* 검색 파라미터 */
    const searchParam = reactive({
      orderId:   currentOrderId.value || '',
      claimId:   _ci.value || '',
      memberNm:  '',
    });

    /* 검색 실행 */
    const handleSearch = async () => {
      const sid = (searchParam.orderId || '').trim();
      const cid = (searchParam.claimId || '').trim();

      /* claimId 로 검색 시 → claimId 기준으로 orderId 조회 */
      if (!sid && cid) {
        if (!window.boApiSvc) { toast('BO 모드에서만 클레임 번호 조회가 가능합니다.', 'error'); return; }
        try {
          const cr = await boApiSvc.odClaim.getById(cid, '주문칸반', '클레임조회');
          const cd = (cr.data && cr.data.data) || {};
          const oid = cd.orderId || cd.order_id;
          if (!oid) { toast('해당 클레임의 주문을 찾을 수 없습니다.', 'error'); return; }
          searchParam.orderId = oid;
          currentOrderId.value = oid;
        } catch (e) {
          toast('클레임 조회 중 오류가 발생했습니다.', 'error');
          return;
        }
      } else if (sid) {
        currentOrderId.value = sid;
      } else {
        toast('주문번호 또는 클레임번호를 입력해주세요.', 'error');
        return;
      }

      /* 강조 ID 갱신 */
      _ci.value = cid || null;
      _oi.value = null;

      await handleLoadOrder();
    };

    /* 검색 초기화 */
    const handleSearchReset = () => {
      searchParam.orderId  = '';
      searchParam.claimId  = '';
      searchParam.memberNm = '';
      currentOrderId.value = null;
      _ci.value = null;
      _oi.value = null;
      Object.keys(order).forEach(function (k) { delete order[k]; });
      orderItems.splice(0, orderItems.length);
      claims.splice(0, claims.length);
      settleRaws.splice(0, settleRaws.length);
    };

    /* toast / confirm fallback */
    const toast = (msg, type, dur) => {
      if (props.showToast) return props.showToast(msg, type, dur);
      if (window.boApp && window.boApp.showToast) return window.boApp.showToast(msg, type, dur);
      alert(msg);
    };
    const doConfirm = async (title, msg) => {
      if (props.showConfirm) return props.showConfirm(title, msg);
      if (window.boApp && window.boApp.showConfirm) return window.boApp.showConfirm(title, msg);
      return window.confirm(msg);
    };

    /* 읽기전용 여부 */
    const cfReadonly = computed(() => props.mode === 'fo');

    /* API 인스턴스 */
    const apiInst = computed(() => props.mode === 'fo' ? window.foApi : window.boApi);

    /* ── 주문항목 진행 단계 (DB 코드값 ORDER_ITEM_STATUS 기준) ── */
    const ORDER_STEPS = [
      { key: 'ORDERED',   label: '주문완료',   icon: '🛒', color: '#f97316' },
      { key: 'PAID',      label: '결제완료',   icon: '✅', color: '#3b82f6' },
      { key: 'PREPARING', label: '준비중',     icon: '📦', color: '#f59e0b' },
      { key: 'SHIPPING',  label: '배송중',     icon: '🚚', color: '#8b5cf6' },
      { key: 'DELIVERED', label: '배송완료',   icon: '📬', color: '#22c55e' },
      { key: 'CONFIRMED', label: '구매확정',   icon: '🏁', color: '#6b7280' },
      { key: 'CANCELLED', label: '취소',       icon: '❌', color: '#ef4444' },
    ];

    /* 배송 필수 검증 대상 / 배송 아이콘 표시 대상 */
    const DLIV_REQ_STEPS  = new Set(['SHIPPING', 'DELIVERED', 'CONFIRMED']);
    const DLIV_SHOW_STEPS = new Set(['PREPARING', 'SHIPPING', 'DELIVERED', 'CONFIRMED']);

    /* ── 클레임 유형별 흐름 (DB CLAIM_STATUS 기준) ── */
    const CLAIM_FLOWS = {
      /* CANCEL: REQUESTED → PROCESSING → COMPLT (철회: CANCELLED) */
      CANCEL: [
        { key: 'REQUESTED',  label: '취소요청',   icon: '📋', color: '#ef4444' },
        { key: 'PROCESSING', label: '취소처리중', icon: '⏳', color: '#f97316' },
        { key: 'COMPLT',     label: '취소완료',   icon: '✅', color: '#9ca3af' },
        { key: 'CANCELLED',  label: '철회',       icon: '↩️', color: '#d1d5db' },
      ],
      /* RETURN: REQUESTED → APPROVED → IN_PICKUP → PROCESSING → REFUND_WAIT → COMPLT */
      RETURN: [
        { key: 'REQUESTED',   label: '반품요청',   icon: '📋', color: '#ef4444' },
        { key: 'APPROVED',    label: '수거예정',   icon: '🗓️', color: '#f59e0b' },
        { key: 'IN_PICKUP',   label: '수거중',     icon: '🚚', color: '#8b5cf6' },
        { key: 'PROCESSING',  label: '검품중',     icon: '📦', color: '#3b82f6' },
        { key: 'REFUND_WAIT', label: '환불대기',   icon: '💳', color: '#f97316' },
        { key: 'COMPLT',      label: '환불완료',   icon: '✅', color: '#9ca3af' },
        { key: 'CANCELLED',   label: '철회',       icon: '↩️', color: '#d1d5db' },
      ],
      /* EXCHANGE: REQUESTED → APPROVED → IN_PICKUP → PROCESSING → REFUND_WAIT → COMPLT */
      EXCHANGE: [
        { key: 'REQUESTED',   label: '교환요청',   icon: '📋', color: '#3b82f6' },
        { key: 'APPROVED',    label: '수거예정',   icon: '🗓️', color: '#f59e0b' },
        { key: 'IN_PICKUP',   label: '수거중',     icon: '🚚', color: '#8b5cf6' },
        { key: 'PROCESSING',  label: '재고확인',   icon: '📦', color: '#22c55e' },
        { key: 'REFUND_WAIT', label: '발송대기',   icon: '🚀', color: '#f97316' },
        { key: 'COMPLT',      label: '교환완료',   icon: '🏁', color: '#9ca3af' },
        { key: 'CANCELLED',   label: '철회',       icon: '↩️', color: '#d1d5db' },
      ],
    };

    /* 데이터 */
    const order      = reactive({});
    const orderItems = reactive([]);
    const claims     = reactive([]);
    const settleRaws = reactive([]);   // st_settle_raw 원장 목록 (orderId 기준)
    const uiState    = reactive({ loading: false });

    /* 드래그 상태 — 현재 드래그 중인 아이템 정보 */
    const dragState = reactive({
      id: null,       // 드래그 중인 아이디 (orderItemId or claimId)
      type: null,     // 'orderItem' | 'claim'
      fromStep: null, // 출발 step key
      overCol: null,  // 현재 hover 중인 열 key (드래그오버 하이라이트용)
      overType: null, // 'orderItem' | 'claim_<claimId>'
    });

    /* ##### [02] 데이터 로드 ####################################################### */

    const handleLoadOrder = async () => {
      if (!currentOrderId.value) return;
      uiState.loading = true;
      /* 이전 데이터 초기화 */
      Object.keys(order).forEach(function (k) { delete order[k]; });
      orderItems.splice(0, orderItems.length);
      claims.splice(0, claims.length);
      settleRaws.splice(0, settleRaws.length);
      try {
        const isBo = props.mode !== 'fo';
        const orderUrl = isBo
          ? '/bo/ec/od/order/' + currentOrderId.value
          : '/fo/ec/od/order/' + currentOrderId.value;
        const res = await apiInst.value.get(orderUrl, isBo ? coUtil.cofApiHdr('주문칸반', '주문조회') : undefined);
        const d   = (res.data && res.data.data) || res.data || {};
        Object.assign(order, d);
        const items = d.orderItems || d.items || [];
        orderItems.splice(0, orderItems.length, ...items);

        /* 클레임 — BO: boApiSvc.odClaim.getPage로 별도 조회 */
        if (isBo && window.boApiSvc) {
          try {
            const cr = await boApiSvc.odClaim.getPage({ orderId: currentOrderId.value, pageSize: 50 }, '주문칸반', '클레임조회');
            const cd = (cr.data && cr.data.data) || {};
            claims.splice(0, claims.length, ...(cd.pageList || cd.list || []));
          } catch (_) { /* 클레임 조회 실패 무시 */ }

          /* 정산 원장 — orderId 기준 조회 (BO 전용) */
          try {
            const sr = await boApiSvc.stSettleRaw.getByOrderId(currentOrderId.value, '주문칸반', '정산조회');
            const sd = (sr.data && sr.data.data) || {};
            settleRaws.splice(0, settleRaws.length, ...(sd.pageList || sd.list || []));
          } catch (_) { /* 정산 조회 실패 무시 (권한 없을 수도 있음) */ }
        } else {
          claims.splice(0, claims.length, ...(d.claims || []));
        }
      } catch (e) {
        toast('주문 정보를 불러오는 중 오류가 발생했습니다.', 'error');
      } finally {
        uiState.loading = false;
      }
    };

    /* ##### [03] 상태 변경 ######################################################### */

    /* ── 정산 잠금 검증 헬퍼 ──
     *  closeYn='Y' (마감됨) 또는 erpVoucherId 존재 (전표 발행) 이면 이동 차단.
     *  rawStatusCd='PENDING' 이면 정산 진행중 경고 (이동 가능하나 confirm 추가).
     *
     *  반환:
     *    'blocked'  — 이동 불가 (마감/전표)
     *    'warn'     — 정산 집계 중 (confirm 필요)
     *    'ok'       — 이동 가능
     */
    const fnSettleLockState = function (orderItemId) {
      var rows = settleRaws.filter(function (r) {
        return (r.orderItemId || r.order_item_id) === orderItemId;
      });
      if (!rows.length) return 'ok';
      /* 마감 혹은 전표 발행 → 차단 */
      var blocked = rows.some(function (r) {
        return r.closeYn === 'Y' || r.erpVoucherId;
      });
      if (blocked) return 'blocked';
      /* 정산 수집 중 (PENDING) → 경고 */
      var pending = rows.some(function (r) {
        return (r.rawStatusCd || r.raw_status_cd) === 'PENDING';
      });
      return pending ? 'warn' : 'ok';
    };

    /* 주문항목별 정산원장 목록 */
    const fnSettleRawsForItem = function (orderItemId) {
      return settleRaws.filter(function (r) {
        return (r.orderItemId || r.order_item_id) === orderItemId;
      });
    };

    /* 배송 정보 필수 검증 */
    const handleValidateDliv = (item) => {
      const courier    = item.dlivCourierCd  || item.dliv_courier_cd  || '';
      const trackingNo = item.dlivTrackingNo || item.dliv_tracking_no || '';
      if (!courier)    { toast('배송 상태로 이동하려면 택배사를 먼저 등록해주세요.', 'error', 0); return false; }
      if (!trackingNo) { toast('배송 상태로 이동하려면 송장번호를 먼저 등록해주세요.', 'error', 0); return false; }
      return true;
    };

    /* 주문항목 상태 변경 */
    const handleChangeOrderItemStatus = async (item, toKey) => {
      if (cfReadonly.value) return;
      if (DLIV_REQ_STEPS.has(toKey) && !handleValidateDliv(item)) return;
      const fromKey = item.orderItemStatusCd || item.order_item_status_cd || '';
      if (fromKey === toKey) return;

      /* 정산 잠금 체크 */
      const itemId   = item.orderItemId || item.order_item_id;
      const lockSt   = fnSettleLockState(itemId);
      if (lockSt === 'blocked') {
        toast('정산이 마감되었거나 ERP 전표가 발행된 항목입니다. 상태를 변경할 수 없습니다.', 'error', 0);
        return;
      }
      if (lockSt === 'warn') {
        const proceed = await doConfirm('정산 진행 중', '이 항목은 현재 정산 집계 중입니다. 상태를 변경하면 정산 금액이 변동될 수 있습니다. 계속하시겠습니까?');
        if (!proceed) return;
      }

      const fromLabel = fnStepLabel(ORDER_STEPS, fromKey);
      const toLabel   = fnStepLabel(ORDER_STEPS, toKey);
      const ok = await doConfirm('상태 변경', '"' + fromLabel + '" → "' + toLabel + '" 으로 변경하시겠습니까?');
      if (!ok) return;
      try {
        const itemId = item.orderItemId || item.order_item_id;
        await apiInst.value.post(
          '/base/ec/od/order-item/save/base',
          { orderItemId: itemId, orderItemStatusCd: toKey, rowStatus: 'U' },
          coUtil.cofApiHdr('주문칸반', '상태변경')
        );
        /* 로컬 상태 즉시 반영 */
        if (Object.prototype.hasOwnProperty.call(item, 'orderItemStatusCd')) item.orderItemStatusCd = toKey;
        else item.order_item_status_cd = toKey;
        toast(toLabel + '으로 변경되었습니다.', 'success');
      } catch (e) {
        toast((e.response && e.response.data && e.response.data.message) || e.message || '상태 변경 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    /* 클레임 상태 변경 */
    const handleChangeClaimStatus = async (claim, toKey) => {
      if (cfReadonly.value) return;
      const fromKey = claim.claimStatusCd || claim.claim_status_cd || '';
      if (fromKey === toKey) return;
      const flow     = fnClaimFlow(claim);
      const fromLabel = fnStepLabel(flow, fromKey);
      const toLabel   = fnStepLabel(flow, toKey);
      const ok = await doConfirm('클레임 상태 변경', '"' + fromLabel + '" → "' + toLabel + '" 으로 변경하시겠습니까?');
      if (!ok) return;
      try {
        const cid = claim.claimId || claim.claim_id;
        await apiInst.value.post(
          '/bo/ec/od/claim/save/status',
          { claimId: cid, claimStatusCd: toKey, rowStatus: 'U' },
          coUtil.cofApiHdr('주문칸반', '클레임상태변경')
        );
        if (Object.prototype.hasOwnProperty.call(claim, 'claimStatusCd')) claim.claimStatusCd = toKey;
        else claim.claim_status_cd = toKey;
        toast(toLabel + '으로 변경되었습니다.', 'success');
      } catch (e) {
        toast((e.response && e.response.data && e.response.data.message) || e.message || '클레임 상태 변경 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    /* ##### [04] 드래그 앤 드롭 ################################################### */

    /* dragstart: 카드 드래그 시작 */
    const handleDragStart = (e, id, type, fromStep) => {
      if (cfReadonly.value) { e.preventDefault(); return; }
      dragState.id = id;
      dragState.type = type;
      dragState.fromStep = fromStep;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
    };

    /* dragend: 드래그 종료 (드롭 성공/실패 무관하게 상태 초기화) */
    const handleDragEnd = () => {
      dragState.id = null; dragState.type = null;
      dragState.fromStep = null; dragState.overCol = null; dragState.overType = null;
    };

    /* dragover: 열 위에 올라왔을 때 — e.preventDefault() 필수(드롭 허용) */
    const handleDragOver = (e, stepKey, overType) => {
      if (cfReadonly.value || !dragState.id) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      dragState.overCol  = stepKey;
      dragState.overType = overType;
    };

    /* dragleave: 열을 벗어날 때 — 자식 요소 이동 시 깜빡임 방지를 위해 relatedTarget 체크 */
    const handleDragLeave = (e, stepKey, overType) => {
      /* relatedTarget 이 같은 열의 자식이면 무시 */
      if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) return;
      if (dragState.overCol === stepKey && dragState.overType === overType) {
        dragState.overCol = null; dragState.overType = null;
      }
    };

    /* drop: 주문항목 열에 드롭 */
    const handleDropOrderItem = async (e, toStep) => {
      e.preventDefault();
      const id       = dragState.id;
      const type     = dragState.type;
      const fromStep = dragState.fromStep;
      handleDragEnd(); // 상태 초기화 먼저
      if (cfReadonly.value || type !== 'orderItem' || fromStep === toStep || !id) return;
      const item = orderItems.find(function (i) {
        return (i.orderItemId || i.order_item_id) === id;
      });
      if (item) await handleChangeOrderItemStatus(item, toStep);
    };

    /* drop: 클레임 열에 드롭 */
    const handleDropClaim = async (e, claim, toStep) => {
      e.preventDefault();
      const id       = dragState.id;
      const type     = dragState.type;
      const fromStep = dragState.fromStep;
      const cid      = claim.claimId || claim.claim_id;
      handleDragEnd(); // 상태 초기화 먼저
      if (cfReadonly.value || type !== 'claim' || id !== cid || fromStep === toStep) return;
      await handleChangeClaimStatus(claim, toStep);
    };

    /* 닫기 */
    const handleClose = () => { if (props.onClose) props.onClose(); };

    /* 강조 ID 클리어 */
    const handleClearHlClaim     = () => { _ci.value = null; };
    const handleClearHlOrderItem = () => { _oi.value = null; };

    /* ##### [05] computed / helpers ################################################ */

    const cfOrderId     = computed(() => order.orderId    || order.order_id    || currentOrderId.value || '-');
    const cfMemberNm    = computed(() => order.memberNm   || order.member_nm   || '-');
    const cfOrderDate   = computed(() => {
      var d = order.orderDate || order.order_date || '';
      return d ? d.slice(0, 16).replace('T', ' ') : '-';
    });
    const cfTotalAmt = computed(() => {
      var v = order.totalAmt || order.total_amt || order.payAmt || order.pay_amt || 0;
      return (window.coUtil && coUtil.cofWon) ? coUtil.cofWon(v) : Number(v).toLocaleString() + '원';
    });
    const cfPayMethod   = computed(() => order.payMethodCd  || order.pay_method_cd  || '-');
    const cfOrderStatus = computed(() => order.orderStatusCd || order.order_status_cd || '-');

    /* step 배열에서 key로 label 조회 */
    const fnStepLabel = function (steps, key) {
      var s = steps.find(function (x) { return x.key === key; });
      return s ? s.label : key;
    };

    /* 클레임 유형 코드 (CANCEL/RETURN/EXCHANGE) */
    const fnClaimTypeKey = function (c) {
      var t = c.claimTypeCd || c.claim_type_cd || '';
      /* 한글로 저장된 경우도 매핑 */
      var MAP = { '취소': 'CANCEL', '반품': 'RETURN', '교환': 'EXCHANGE' };
      return MAP[t] || t || 'CANCEL';
    };

    /* 클레임 유형 한글 라벨 */
    const fnClaimTypeLabel = function (c) {
      var MAP = { CANCEL: '취소', RETURN: '반품', EXCHANGE: '교환' };
      return MAP[fnClaimTypeKey(c)] || fnClaimTypeKey(c);
    };

    /* 클레임 유형에 맞는 흐름 배열 */
    const fnClaimFlow = function (c) {
      return CLAIM_FLOWS[fnClaimTypeKey(c)] || CLAIM_FLOWS.CANCEL;
    };

    /* 배송 정보 */
    const fnDlivInfo = function (item) {
      return {
        courier:    item.dlivCourierCd  || item.dliv_courier_cd  || '',
        trackingNo: item.dlivTrackingNo || item.dliv_tracking_no || '',
      };
    };

    /* 현재 step 여부 */
    const fnIsOrderItemStep = function (item, stepKey) {
      return (item.orderItemStatusCd || item.order_item_status_cd || '') === stepKey;
    };
    const fnIsClaimStep = function (claim, stepKey) {
      return (claim.claimStatusCd || claim.claim_status_cd || '') === stepKey;
    };

    /* 강조 여부 */
    const fnIsHlOrderItem = function (item) {
      return !!_oi.value && (item.orderItemId || item.order_item_id) === _oi.value;
    };
    const fnIsHlClaim = function (claim) {
      return !!_ci.value && (claim.claimId || claim.claim_id) === _ci.value;
    };

    /* 열 dragover 하이라이트 — 주문항목 */
    const fnIsDragOverOrderItemCol = function (stepKey) {
      return dragState.overType === 'orderItem' && dragState.overCol === stepKey;
    };
    /* 열 dragover 하이라이트 — 클레임 (클레임ID 포함 식별) */
    const fnIsDragOverClaimCol = function (claim, stepKey) {
      var cid = claim.claimId || claim.claim_id;
      return dragState.overType === ('claim_' + cid) && dragState.overCol === stepKey;
    };

    /* ##### [06] 라이프사이클 ###################################################### */

    onMounted(function () { handleLoadOrder(); });

    /* ##### [07] return ############################################################ */

    return {
      order, orderItems, claims, settleRaws, uiState, dragState,
      searchParam, currentOrderId,
      cfReadonly, cfOrderId, cfMemberNm, cfOrderDate, cfTotalAmt, cfPayMethod, cfOrderStatus,
      hlOrderItemId: _oi, hlClaimId: _ci,
      ORDER_STEPS, DLIV_SHOW_STEPS,
      fnStepLabel, fnClaimTypeLabel, fnClaimFlow, fnDlivInfo,
      fnIsOrderItemStep, fnIsClaimStep,
      fnIsHlOrderItem, fnIsHlClaim,
      fnIsDragOverOrderItemCol, fnIsDragOverClaimCol,
      fnSettleLockState, fnSettleRawsForItem,
      handleSearch, handleSearchReset, handleClearHlClaim, handleClearHlOrderItem,
      handleDragStart, handleDragEnd, handleDragOver, handleDragLeave,
      handleDropOrderItem, handleDropClaim,
      handleChangeOrderItemStatus, handleChangeClaimStatus,
      handleClose,
    };
  },

  template: `
<div class="od-kanban-wrap">

  <!-- ① 헤더 (항상 표시) -->
  <div class="od-kanban-hdr">
    <span class="od-kanban-hdr-title">📋 주문 칸반 보드</span>
    <span class="od-kanban-hdr-id">{{ cfOrderId }}</span>
    <button v-if="asModal" class="od-kanban-hdr-close" @click="handleClose">✕</button>
  </div>

  <!-- ② 검색바 (항상 표시) -->
  <div class="od-kanban-search">
    <div class="od-kanban-search-group">
      <span class="od-kanban-search-label">주문번호</span>
      <input v-model="searchParam.orderId" placeholder="주문번호 입력" style="width:160px;"
        @keyup.enter="handleSearch" />
    </div>
    <div class="od-kanban-search-group">
      <span class="od-kanban-search-label">클레임번호</span>
      <input v-model="searchParam.claimId" placeholder="클레임번호 입력" style="width:180px;font-family:monospace;"
        @keyup.enter="handleSearch" />
    </div>
    <button class="btn-search" @click="handleSearch">🔍 조회</button>
    <button class="btn-reset" @click="handleSearchReset">초기화</button>
  </div>

  <!-- ③ 강조표시란 (항상 표시) -->
  <div class="od-kanban-hl-row">
    <span class="od-kanban-hl-row-label">강조 표시</span>
    <span v-if="hlClaimId" class="od-kanban-hl-tag">
      🔵 {{ hlClaimId }}
      <button @click="handleClearHlClaim">✕</button>
    </span>
    <span v-else-if="hlOrderItemId" class="od-kanban-hl-tag">
      🔵 {{ hlOrderItemId }}
      <button @click="handleClearHlOrderItem">✕</button>
    </span>
    <span v-else style="font-size:11px;color:#d1d5db;">없음 — 클레임번호로 조회하면 자동 설정됩니다</span>
  </div>

  <!-- 로딩 -->
  <div v-if="uiState.loading" class="od-kanban-loading">⏳ 불러오는 중...</div>

  <!-- 조회 전 안내 -->
  <div v-else-if="!currentOrderId" class="od-kanban-empty" style="padding:40px;font-size:13px;color:#9ca3af;">
    주문번호 또는 클레임번호를 입력하고 조회하세요.
  </div>

  <template v-else>

    <!-- ④ 주문정보 -->
    <dl class="od-kanban-order-info">
      <div><dt>회원</dt><dd>{{ cfMemberNm }}</dd></div>
      <div><dt>주문일시</dt><dd>{{ cfOrderDate }}</dd></div>
      <div><dt>결제금액</dt><dd>{{ cfTotalAmt }}</dd></div>
      <div><dt>결제수단</dt><dd>{{ cfPayMethod }}</dd></div>
      <div><dt>주문상태</dt><dd><span class="od-kanban-status-badge">{{ cfOrderStatus }}</span></dd></div>
    </dl>

    <!-- ③ 주문항목 칸반 -->
    <div class="od-kanban-section">
      <div class="od-kanban-section-title">
        📦 주문항목
        <span v-if="hlOrderItemId" class="od-kanban-hl-badge">ID 강조 중</span>
      </div>

      <div v-if="!orderItems.length" class="od-kanban-empty">주문항목이 없습니다.</div>

      <div v-for="(item, idx) in orderItems" :key="item.orderItemId || item.order_item_id || idx" style="margin-bottom:20px;">

        <!-- 항목 행 제목 -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="font-size:11px;font-weight:700;color:#374151;">항목 {{ idx + 1 }}</span>
          <span :class="['od-kanban-hdr-id', fnIsHlOrderItem(item) ? 'hl-id' : '']">
            {{ item.orderItemId || item.order_item_id || '' }}
          </span>
          <span style="font-size:11px;color:#6b7280;">{{ item.prodNm || item.prod_nm || '' }}</span>
        </div>

        <!-- 칸반 보드 -->
        <div class="od-kanban-board">
          <div v-for="step in ORDER_STEPS" :key="step.key" class="od-kanban-col">

            <!-- 열 헤더 -->
            <div
              :class="['od-kanban-col-hdr', fnIsOrderItemStep(item, step.key) ? 'active-col' : '', fnIsDragOverOrderItemCol(step.key) ? 'drag-over-col' : '']"
              :style="fnIsOrderItemStep(item, step.key) ? ('border-top-color:' + step.color) : ''"
            ><span style="display:inline-flex;align-items:center;justify-content:center;gap:4px;width:100%;">{{ step.icon }} {{ step.label }}</span></div>

            <!-- 열 바디 (드롭 영역) -->
            <div
              :class="['od-kanban-col-body', fnIsDragOverOrderItemCol(step.key) ? 'drag-over-body' : '']"
              :style="!fnIsOrderItemStep(item, step.key) &amp;&amp; !fnIsDragOverOrderItemCol(step.key) ? 'min-height:0;padding:0;' : ''"
              @dragover="handleDragOver($event, step.key, 'orderItem')"
              @dragleave="handleDragLeave($event, step.key, 'orderItem')"
              @drop="handleDropOrderItem($event, step.key)"
            >
              <!-- 현재 상태 카드 -->
              <div
                v-if="fnIsOrderItemStep(item, step.key)"
                :class="['od-kanban-card', !cfReadonly &amp;&amp; fnSettleLockState(item.orderItemId || item.order_item_id) !== 'blocked' ? 'draggable-card' : '', fnIsHlOrderItem(item) ? 'hl-card' : '', fnSettleLockState(item.orderItemId || item.order_item_id) === 'blocked' ? 'locked-card' : '', dragState.id === (item.orderItemId || item.order_item_id) ? 'dragging-card' : '']"
                :draggable="!cfReadonly &amp;&amp; fnSettleLockState(item.orderItemId || item.order_item_id) !== 'blocked'"
                @dragstart="handleDragStart($event, item.orderItemId || item.order_item_id, 'orderItem', step.key)"
                @dragend="handleDragEnd"
              >
                <div :class="['od-kanban-card-id', fnIsHlOrderItem(item) ? 'hl-id' : '']">
                  {{ item.orderItemId || item.order_item_id || '' }}
                </div>
                <div class="od-kanban-card-nm">
                  {{ item.prodNm || item.prod_nm || '—' }}
                  <span v-if="item.orderQty || item.order_qty" class="od-kanban-card-qty">{{ item.orderQty || item.order_qty }}</span>
                </div>
                <div v-if="item.optItemNm1 || item.opt_item_nm1" class="od-kanban-card-meta">
                  {{ [item.optItemNm1 || item.opt_item_nm1, item.optItemNm2 || item.opt_item_nm2].filter(Boolean).join(' / ') }}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ④ 클레임 칸반 -->
    <template v-if="claims.length">
      <hr class="od-kanban-divider" style="margin-top:16px;" />

      <template v-for="(claim, cidx) in claims" :key="claim.claimId || claim.claim_id || cidx">
      <div
        v-if="fnClaimFlow(claim).some(function(s){ return s.key === (claim.claimStatusCd || claim.claim_status_cd); })"
        class="od-kanban-section"
        style="margin-top:14px;"
      >
        <!-- 클레임 섹션 제목 -->
        <div class="od-kanban-section-title">
          <span>↩️ <strong>{{ fnClaimTypeLabel(claim) }}</strong></span>
          <span :class="['od-kanban-hdr-id', fnIsHlClaim(claim) ? 'hl-id' : '']">{{ claim.claimId || claim.claim_id || '' }}</span>
          <span v-if="fnIsHlClaim(claim)" class="od-kanban-hl-badge">강조</span>
          <span style="font-size:11px;color:#6b7280;margin-left:4px;">{{ claim.prodNm || claim.prod_nm || '' }}</span>
          <span style="font-size:11px;color:#9ca3af;">{{ (claim.requestDate || claim.request_date || claim.regDate || claim.reg_date || '').slice(0, 10) }}</span>
        </div>

        <!-- 클레임 칸반 보드 -->
        <div class="od-kanban-board">
          <div v-for="step in fnClaimFlow(claim)" :key="step.key" class="od-kanban-col">

            <div
              :class="['od-kanban-col-hdr', fnIsClaimStep(claim, step.key) ? 'active-col' : '', fnIsDragOverClaimCol(claim, step.key) ? 'drag-over-col' : '']"
              :style="fnIsClaimStep(claim, step.key) ? ('border-top-color:' + step.color) : ''"
            ><span style="display:inline-flex;align-items:center;justify-content:center;gap:4px;width:100%;">{{ step.icon }} {{ step.label }}</span></div>

            <div
              :class="['od-kanban-col-body', fnIsDragOverClaimCol(claim, step.key) ? 'drag-over-body' : '']"
              :style="!fnIsClaimStep(claim, step.key) &amp;&amp; !fnIsDragOverClaimCol(claim, step.key) ? 'min-height:0;padding:0;' : ''"
              @dragover="handleDragOver($event, step.key, 'claim_' + (claim.claimId || claim.claim_id))"
              @dragleave="handleDragLeave($event, step.key, 'claim_' + (claim.claimId || claim.claim_id))"
              @drop="handleDropClaim($event, claim, step.key)"
            >
              <div
                v-if="fnIsClaimStep(claim, step.key)"
                :class="['od-kanban-card', !cfReadonly ? 'draggable-card' : '', fnIsHlClaim(claim) ? 'hl-card' : '', dragState.id === (claim.claimId || claim.claim_id) ? 'dragging-card' : '']"
                :draggable="!cfReadonly"
                @dragstart="handleDragStart($event, claim.claimId || claim.claim_id, 'claim', step.key)"
                @dragend="handleDragEnd"
              >
                <div :class="['od-kanban-card-id', fnIsHlClaim(claim) ? 'hl-id' : '']">
                  {{ claim.claimId || claim.claim_id || '' }}
                </div>
                <div v-if="claim.prodNm || claim.prod_nm" class="od-kanban-card-nm">
                  {{ claim.prodNm || claim.prod_nm }}
                  <span v-if="claim.claimQty || claim.claim_qty" class="od-kanban-card-qty">{{ claim.claimQty || claim.claim_qty }}</span>
                </div>
                <div v-if="claim.prodOption || claim.prod_option" class="od-kanban-card-meta">
                  {{ claim.prodOption || claim.prod_option }}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
      </template>
    </template>

  </template>
</div>
`,
};
