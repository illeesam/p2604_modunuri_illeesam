/**
 * OdClaimCalcModal.js — 클레임 계산 (예정) 공용 모달 (취소/반품/교환)
 *
 * 클레임관리(OdClaimMng), 클레임상세(OdClaimDtl), 칸반보드(OdOrderKanban) 공용.
 *
 * Props:
 *   show          — Boolean  모달 표시 여부
 *   claimId       — String   최초 조회할 클레임 ID
 *   orderId       — String   (선택) 주문 ID (없으면 claimId로 API 조회 시 획득)
 *
 * Emits:
 *   close         — 닫기
 *
 * 사용 예:
 *   <od-claim-calc-modal :show="calcModal.show" :claim-id="calcModal.claimId" @close="calcModal.show=false" />
 */
window.OdClaimCalcModal = {
  name: 'OdClaimCalcModal',
  props: {
    show:    { type: Boolean, default: false },
    claimId: { type: String,  default: '' },
    orderId: { type: String,  default: '' },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { ref, reactive, watch, onMounted } = Vue;

    /* ##### [01] 상태 ########################################################## */

    const state = reactive({
      loading:      false,
      switchLoading: false,
      claimId:      '',
      claimType:    '',
      data:         null,   // { claim, order, calc, statusHist }
      orderClaims:  [],
    });

    /* ##### [02] 계산 헬퍼 ##################################################### */

    const fnCalcAmt = function (claimData, orderData) {
      var items    = claimData.claimItems || [];
      var itemAmt  = items.reduce(function (s, it) {
        return s + (it.itemAmt || it.item_amt || (it.unitPrice || it.unit_price || 0) * (it.claimQty || it.claim_qty || 1));
      }, 0);
      var orderTotalAmt = orderData.payAmt || orderData.pay_amt || orderData.totalAmt || orderData.total_amt || 0;
      var orderItemAmt  = (orderData.orderItems || []).reduce(function (s, it) {
        return s + (it.itemOrderAmt || it.item_order_amt || (it.unitPrice || it.unit_price || it.salePrice || 0) * (it.orderQty || it.order_qty || 1));
      }, 0);
      var ratio = orderItemAmt > 0 ? itemAmt / orderItemAmt : (orderTotalAmt > 0 ? itemAmt / orderTotalAmt : 0);
      if (ratio > 1) ratio = 1;
      var couponDiscAmt = Math.round((orderData.couponDiscntAmt || orderData.couponDiscAmt || 0) * ratio);
      var saveUsedAmt   = Math.round((orderData.saveUseAmt || orderData.saveUsedAmt || 0) * ratio);
      var cacheUsedAmt  = Math.round((orderData.cacheUsedAmt || 0) * ratio);
      var totalClaimQty = items.reduce(function (s, it) { return s + (it.claimQty || it.claim_qty || 1); }, 0);
      var totalOrderQty = (orderData.orderItems || []).reduce(function (s, it) { return s + (it.orderQty || it.order_qty || 1); }, 0);
      var isFullCancel  = totalOrderQty > 0 && totalClaimQty >= totalOrderQty;
      var dlivFeeRefund = isFullCancel ? (orderData.shippingFee || orderData.dlivFee || 0) : 0;
      var refundBase    = Math.max(0, itemAmt - couponDiscAmt - saveUsedAmt - cacheUsedAmt + dlivFeeRefund);
      return { itemAmt, couponDiscAmt, saveUsedAmt, cacheUsedAmt, dlivFeeRefund, refundBase, isFullCancel, ratio,
               orderTotalAmt, couponNm: orderData.couponNm || '', saveGradePct: orderData.saveGradePct || 0 };
    };

    const fnLoadData = async function (claimId, orderId) {
      var cr = await boApiSvc.odClaim.getById(claimId, '클레임계산', '조회');
      var claimData = (cr.data && cr.data.data) || cr.data || {};
      var resolvedOrderId = orderId || claimData.orderId || '';
      var orderData = {};
      if (resolvedOrderId) {
        var or = await boApiSvc.odOrder.getById(resolvedOrderId, '클레임계산', '주문조회');
        orderData = (or.data && or.data.data) || or.data || {};
      }
      var hr = await boApiSvc.odClaim.getStatusHist(claimId, '클레임계산', '상태이력');
      var statusHist = (hr.data && hr.data.data) || [];
      return { claimData, orderData, statusHist, resolvedOrderId };
    };

    /* ##### [03] 최초 로드 ##################################################### */

    const fnDoLoad = async function (newId, newOrderId) {
      if (!newId) return;
      state.loading     = true;
      state.data        = null;
      state.orderClaims = [];
      state.claimId     = newId;
      state.claimType   = '';
      try {
        var { claimData, orderData, statusHist, resolvedOrderId } = await fnLoadData(newId, newOrderId || '');
        state.claimType = claimData.claimTypeCd || '';
        state.data      = { claim: claimData, order: orderData, calc: fnCalcAmt(claimData, orderData), statusHist };
        if (resolvedOrderId) {
          var lor = await boApiSvc.odClaim.getPage({ orderId: resolvedOrderId, pageNo: 1, pageSize: 100 }, '클레임계산', '주문클레임목록').catch(function () { return null; });
          var allClaims = (lor && (lor.data?.data?.pageList || lor.data?.data?.list || [])) || [];
          state.orderClaims = allClaims.length ? allClaims : [claimData];
        }
      } catch (e) {
        console.error('[OdClaimCalcModal] load error', e);
      } finally {
        state.loading = false;
      }
    };

    /* show/claimId 변경 감지 (Mng/Dtl: v-if 없이 show 토글 방식) */
    watch([() => props.show, () => props.claimId], async function ([newShow, newId]) {
      if (!newShow || !newId) return;
      await fnDoLoad(newId, props.orderId);
    }, { immediate: false });

    /* 마운트 시점에 이미 show=true인 경우 (Kanban: v-if로 새로 마운트) */
    onMounted(function () {
      if (props.show && props.claimId) { fnDoLoad(props.claimId, props.orderId); }
    });

    /* ##### [04] 클레임 전환 ################################################### */

    const handleSwitch = async function (claimId) {
      if (!claimId || claimId === state.claimId) return;
      state.switchLoading = true;
      try {
        var target = state.orderClaims.find(function (c) { return c.claimId === claimId; }) || {};
        var { claimData, orderData, statusHist } = await fnLoadData(claimId, target.orderId || (state.data && state.data.claim && state.data.claim.orderId) || '');
        state.claimId   = claimId;
        state.claimType = claimData.claimTypeCd || '';
        state.data      = { claim: claimData, order: orderData, calc: fnCalcAmt(claimData, orderData), statusHist };
      } catch (e) {
        console.error('[OdClaimCalcModal] switch error', e);
      } finally {
        state.switchLoading = false;
      }
    };

    const handleClose = function () { emit('close'); };

    return { state, handleSwitch, handleClose };
  },
  template: /* html */`
<bo-modal :show="show" :title="state.claimType==='CANCEL'?'취소 클레임 계산 (예정)':state.claimType==='RETURN'?'반품 클레임 계산 (예정)':state.claimType==='EXCHANGE'?'교환 클레임 계산 (예정)':'클레임 계산 (예정)'" width="760px" @close="handleClose">
  <template #default>
    <div v-if="state.loading" style="text-align:center;padding:40px;color:#94a3b8;">⏳ 계산 중...</div>
    <template v-else-if="state.data">
      <!-- ① 메타 바: 회원·주문·클레임·신청일·상태 한 줄 -->
      <div style="display:grid;grid-template-columns:auto auto 1fr auto auto;gap:0;align-items:stretch;margin-bottom:14px;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;font-size:11px;">
        <div style="padding:8px 14px;background:#f1f5f9;border-right:1px solid #e2e8f0;">
          <div style="color:#94a3b8;margin-bottom:2px;">회원</div>
          <div style="font-weight:700;color:#111;white-space:nowrap;">{{ state.data.claim.memberNm || state.data.claim.member_nm || '-' }}</div>
        </div>
        <div style="padding:8px 14px;background:#f1f5f9;border-right:1px solid #e2e8f0;">
          <div style="color:#94a3b8;margin-bottom:2px;">주문번호</div>
          <div style="font-weight:700;color:#1d4ed8;font-family:monospace;white-space:nowrap;">{{ state.data.claim.orderId || state.data.order.orderId || '-' }}</div>
        </div>
        <div style="padding:8px 14px;background:#f1f5f9;border-right:1px solid #e2e8f0;">
          <div style="color:#94a3b8;margin-bottom:2px;">클레임번호</div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-weight:700;font-family:monospace;color:#111;">{{ state.claimId }}</span>
            <span style="padding:1px 8px;border-radius:8px;font-size:10px;font-weight:700;"
              :style="state.claimType==='CANCEL'?'background:#fee2e2;color:#b91c1c':state.claimType==='RETURN'?'background:#fff7ed;color:#9a3412':'background:#dbeafe;color:#1d4ed8'">
              {{ state.claimType==='CANCEL'?'취소':state.claimType==='RETURN'?'반품':'교환' }}
            </span>
          </div>
        </div>
        <div style="padding:8px 14px;background:#f1f5f9;border-right:1px solid #e2e8f0;">
          <div style="color:#94a3b8;margin-bottom:2px;">신청일</div>
          <div style="font-weight:600;color:#111;white-space:nowrap;">{{ (state.data.claim.requestDate || state.data.claim.request_date || '').replace('T',' ').slice(0,10) || '-' }}</div>
        </div>
        <div style="padding:8px 14px;background:#f1f5f9;">
          <div style="color:#94a3b8;margin-bottom:2px;">상태</div>
          <div style="font-weight:700;">
            <span style="padding:2px 8px;border-radius:6px;font-size:10px;"
              :style="(state.data.claim.claimStatusCd||'').includes('COMPLT')?'background:#dcfce7;color:#15803d':(state.data.claim.claimStatusCd||'').includes('CANCEL')?'background:#fee2e2;color:#b91c1c':'background:#fef9c3;color:#92400e'">
              {{ {'REQUEST':'접수','PROCESS':'처리중','COMPLT':'완료','CANCEL':'취소'}[state.data.claim.claimStatusCd] || state.data.claim.claimStatusCd || '-' }}
            </span>
          </div>
        </div>
      </div>
      <!-- ② 클레임 전환 선택바 -->
      <div v-if="state.orderClaims.length >= 1" style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:8px 12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;font-size:11px;">
        <span style="color:#6b7280;white-space:nowrap;">이 주문의 클레임</span>
        <span style="font-weight:700;color:#1d4ed8;">{{ state.orderClaims.length }}건</span>
        <select :value="state.claimId" @change="handleSwitch($event.target.value)" :disabled="state.switchLoading"
          style="flex:1;padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:11px;background:#fff;cursor:pointer;">
          <option v-for="c in state.orderClaims" :key="c.claimId" :value="c.claimId">
            {{ c.claimId }} — {{ c.claimTypeCd==='CANCEL'?'취소':c.claimTypeCd==='RETURN'?'반품':'교환' }} / {{ c.claimStatusCd==='REQUEST'?'접수':c.claimStatusCd==='PROCESS'?'처리중':c.claimStatusCd==='COMPLT'?'완료':c.claimStatusCd==='CANCEL'?'취소':c.claimStatusCd }}
          </option>
        </select>
        <span v-if="state.switchLoading" style="color:#94a3b8;">⏳</span>
      </div>
      <!-- ③ 상품 정보 카드 (3열) -->
      <div style="border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;">
        <div style="padding:8px 12px;background:#f1f5f9;font-size:11px;font-weight:800;color:#374151;border-bottom:1px solid #e2e8f0;">🛍 상품 정보</div>
        <div style="padding:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;align-items:start;">
          <!-- 1열: 현재 주문상품 정보 -->
          <div style="border-radius:8px;border:1px solid #e2e8f0;overflow:hidden;">
            <div style="padding:7px 10px;background:#f8fafc;font-size:11px;font-weight:700;color:#374151;border-bottom:1px solid #e2e8f0;">🛒 현재 주문상품 정보</div>
            <div style="padding:10px 12px;">
              <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px;">
                <thead><tr style="background:#f8fafc;">
                  <th style="padding:4px 6px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">상품명</th>
                  <th style="padding:4px 6px;text-align:center;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;white-space:nowrap;">수량</th>
                  <th style="padding:4px 6px;text-align:right;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;white-space:nowrap;">금액</th>
                </tr></thead>
                <tbody>
                  <tr v-for="(it, i) in (state.data.order.orderItems || state.data.claim.claimItems || [])" :key="i">
                    <td style="padding:4px 6px;border-bottom:1px solid #f1f5f9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100px;" :title="it.prodNm || it.prod_nm">{{ it.prodNm || it.prod_nm || '-' }}</td>
                    <td style="padding:4px 6px;border-bottom:1px solid #f1f5f9;text-align:center;">{{ it.orderQty || it.order_qty || it.claimQty || 1 }}</td>
                    <td style="padding:4px 6px;border-bottom:1px solid #f1f5f9;text-align:right;font-family:monospace;">{{ ((it.itemAmt || it.item_amt || (it.salePrice || it.sale_price || 0) * (it.orderQty || it.order_qty || 1)) || 0).toLocaleString() }}원</td>
                  </tr>
                  <tr v-if="!(state.data.order.orderItems || state.data.claim.claimItems || []).length">
                    <td colspan="3" style="text-align:center;padding:8px;color:#94a3b8;">-</td>
                  </tr>
                </tbody>
              </table>
              <div style="border-top:1px solid #e5e7eb;padding-top:6px;font-size:11px;">
                <div style="display:flex;justify-content:space-between;padding:2px 0;color:#6b7280;">
                  <span>상품 합계</span><span style="font-family:monospace;">{{ (state.data.calc.orderTotalAmt || 0).toLocaleString() }}원</span>
                </div>
                <div v-if="state.data.order.shippingFee || state.data.order.dlivFee" style="display:flex;justify-content:space-between;padding:2px 0;color:#6b7280;">
                  <span>배송비</span><span style="font-family:monospace;">{{ (state.data.order.shippingFee || state.data.order.dlivFee || 0).toLocaleString() }}원</span>
                </div>
                <div v-if="state.data.order.couponDiscntAmt || state.data.order.couponDiscAmt" style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626;">
                  <span>쿠폰 할인</span><span style="font-family:monospace;">- {{ (state.data.order.couponDiscntAmt || state.data.order.couponDiscAmt || 0).toLocaleString() }}원</span>
                </div>
                <div v-if="state.data.order.saveUseAmt || state.data.order.saveUsedAmt" style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626;">
                  <span>적립금 사용</span><span style="font-family:monospace;">- {{ (state.data.order.saveUseAmt || state.data.order.saveUsedAmt || 0).toLocaleString() }}원</span>
                </div>
                <div v-if="state.data.order.cacheUsedAmt" style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626;">
                  <span>충전금 사용</span><span style="font-family:monospace;">- {{ (state.data.order.cacheUsedAmt || 0).toLocaleString() }}원</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:5px 0 1px;font-weight:800;border-top:1px solid #e2e8f0;margin-top:3px;">
                  <span>실 결제액</span>
                  <span style="font-family:monospace;color:#1d4ed8;">{{ (state.data.order.payAmt || state.data.calc.orderTotalAmt || 0).toLocaleString() }}원</span>
                </div>
              </div>
            </div>
          </div>
          <!-- 2열: 클레임 신청 후 (환불 예정) -->
          <div style="border-radius:8px;border:1px solid #bbf7d0;overflow:hidden;">
            <div style="padding:7px 10px;background:#f0fdf4;font-size:11px;font-weight:700;color:#14532d;border-bottom:1px solid #bbf7d0;">♻️ 클레임 신청 후 (환불 예정)</div>
            <div style="padding:10px 12px;">
              <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px;">
                <thead><tr style="background:#f0fdf4;">
                  <th style="padding:4px 6px;text-align:left;color:#15803d;font-weight:600;border-bottom:1px solid #bbf7d0;">상품명</th>
                  <th style="padding:4px 6px;text-align:center;color:#15803d;font-weight:600;border-bottom:1px solid #bbf7d0;white-space:nowrap;">수량</th>
                  <th style="padding:4px 6px;text-align:right;color:#15803d;font-weight:600;border-bottom:1px solid #bbf7d0;white-space:nowrap;">항목금액</th>
                </tr></thead>
                <tbody>
                  <tr v-for="(it, i) in (state.data.claim.claimItems || [])" :key="i">
                    <td style="padding:4px 6px;border-bottom:1px solid #f0fdf4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100px;" :title="it.prodNm || it.prod_nm">{{ it.prodNm || it.prod_nm || '-' }}</td>
                    <td style="padding:4px 6px;border-bottom:1px solid #f0fdf4;text-align:center;">{{ it.claimQty || it.claim_qty || 1 }}</td>
                    <td style="padding:4px 6px;border-bottom:1px solid #f0fdf4;text-align:right;font-family:monospace;">{{ (it.itemAmt || it.item_amt || 0).toLocaleString() }}원</td>
                  </tr>
                  <tr v-if="!(state.data.claim.claimItems || []).length">
                    <td colspan="3" style="text-align:center;padding:8px;color:#94a3b8;">항목 없음</td>
                  </tr>
                </tbody>
              </table>
              <div style="border-top:1px solid #bbf7d0;padding-top:6px;font-size:11px;">
                <div style="display:flex;justify-content:space-between;padding:2px 0;color:#6b7280;">
                  <span>클레임 항목 금액</span><span style="font-family:monospace;">{{ (state.data.calc.itemAmt || 0).toLocaleString() }}원</span>
                </div>
                <div v-if="state.data.calc.dlivFeeRefund > 0" style="display:flex;justify-content:space-between;padding:2px 0;color:#059669;">
                  <span>배송비 환불 (전체취소)</span><span style="font-family:monospace;">+ {{ state.data.calc.dlivFeeRefund.toLocaleString() }}원</span>
                </div>
                <div v-if="state.data.calc.couponDiscAmt > 0" style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626;">
                  <span>쿠폰 차감 (비례)</span><span style="font-family:monospace;">- {{ state.data.calc.couponDiscAmt.toLocaleString() }}원</span>
                </div>
                <div v-if="state.data.calc.saveUsedAmt > 0" style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626;">
                  <span>적립금 차감 (비례)</span><span style="font-family:monospace;">- {{ state.data.calc.saveUsedAmt.toLocaleString() }}원</span>
                </div>
                <div v-if="state.data.calc.cacheUsedAmt > 0" style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626;">
                  <span>충전금 차감 (비례)</span><span style="font-family:monospace;">- {{ state.data.calc.cacheUsedAmt.toLocaleString() }}원</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:5px 0 1px;font-size:13px;font-weight:800;border-top:1px solid #bbf7d0;margin-top:3px;">
                  <span>환불 예정액</span>
                  <span style="font-family:monospace;color:#059669;">{{ (state.data.calc.refundBase || 0).toLocaleString() }}원</span>
                </div>
              </div>
            </div>
          </div>
          <!-- 3열: 최종 정보 -->
          <div style="border-radius:8px;border:1px solid #a5b4fc;overflow:hidden;">
            <div style="padding:7px 10px;background:#eef2ff;font-size:11px;font-weight:700;color:#3730a3;border-bottom:1px solid #a5b4fc;">✅ 최종 정보</div>
            <div style="padding:10px 12px;font-size:11px;">
              <div style="font-size:10px;font-weight:700;color:#4f46e5;margin-bottom:4px;">유지되는 주문상품</div>
              <div style="background:#f5f3ff;border-radius:6px;padding:6px 8px;margin-bottom:8px;">
                <template v-if="(state.data.order.orderItems || []).length > (state.data.claim.claimItems || []).length">
                  <div v-for="(it, i) in (state.data.order.orderItems || [])" :key="i"
                    style="display:flex;justify-content:space-between;padding:2px 0;color:#374151;">
                    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px;" :title="it.prodNm || it.prod_nm">{{ it.prodNm || it.prod_nm || '-' }}</span>
                    <span style="font-family:monospace;white-space:nowrap;margin-left:4px;">{{ it.orderQty || it.order_qty || 1 }}개</span>
                  </div>
                </template>
                <div v-else style="color:#94a3b8;font-size:11px;text-align:center;padding:4px 0;">전량 클레임 처리</div>
              </div>
              <div style="font-size:10px;font-weight:700;color:#4f46e5;margin-bottom:4px;">최종 금액 요약</div>
              <div style="display:flex;flex-direction:column;gap:3px;">
                <div style="display:flex;justify-content:space-between;padding:2px 0;color:#6b7280;">
                  <span>원 결제액</span>
                  <span style="font-family:monospace;">{{ (state.data.order.payAmt || state.data.calc.orderTotalAmt || 0).toLocaleString() }}원</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:2px 0;color:#059669;">
                  <span>환불 예정액 (현재 클레임)</span>
                  <span style="font-family:monospace;font-weight:700;">- {{ (state.data.calc.refundBase || 0).toLocaleString() }}원</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626;">
                  <span>클레임 환불합계 (전체)</span>
                  <span style="font-family:monospace;">- {{ state.orderClaims.reduce(function(s,c){return s+(c.refundAmt||0);},0).toLocaleString() }}원</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:5px 0 2px;font-weight:800;border-top:1px solid #a5b4fc;margin-top:2px;">
                  <span style="color:#3730a3;">최종 결제잔액</span>
                  <span style="font-family:monospace;color:#1d4ed8;">{{ ((state.data.order.payAmt || state.data.calc.orderTotalAmt || 0) - state.orderClaims.reduce(function(s,c){return s+(c.refundAmt||0);},0)).toLocaleString() }}원</span>
                </div>
                <div style="margin-top:6px;padding:5px 8px;background:#e0e7ff;border-radius:6px;text-align:center;font-size:10px;color:#4338ca;font-weight:700;">
                  비례율 {{ Math.round((state.data.calc.ratio || 0) * 100) }}% 적용
                </div>
              </div>
            </div>
          </div>
        </div><!-- /grid -->
      </div><!-- /상품 정보 카드 -->
      <!-- ④ 결제 정보 카드 (3열) -->
      <div style="margin-top:12px;border-radius:10px;border:1px solid #bfdbfe;overflow:hidden;">
        <div style="padding:8px 12px;background:#eff6ff;font-size:11px;font-weight:800;color:#1e40af;border-bottom:1px solid #bfdbfe;">💳 결제 정보</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;">
          <div style="padding:10px 14px;border-right:1px solid #bfdbfe;">
            <div style="font-size:10px;font-weight:700;color:#1d4ed8;margin-bottom:6px;">📌 결제 상세</div>
            <template v-if="(state.data.order.orderPays || []).length">
              <div v-for="(pay, pi) in (state.data.order.orderPays || [])" :key="pi"
                style="font-size:11px;padding:5px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #dbeafe;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="color:#374151;font-weight:700;">{{ pay.payMethodCdNm || pay.payMethodCd || '-' }}</span>
                  <span style="font-family:monospace;color:#1d4ed8;font-weight:700;">{{ (pay.payAmt || 0).toLocaleString() }}원</span>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:3px;color:#94a3b8;font-size:10px;">
                  <span>{{ pay.payStatusCdNm || pay.payStatusCd || '' }}</span>
                  <span>{{ (pay.payDate || '').replace('T',' ').slice(0,16) }}</span>
                  <span v-if="pay.cardNo">카드 {{ pay.cardNo }}</span>
                  <span v-if="pay.pgTransactionId" style="font-family:monospace;">PG {{ pay.pgTransactionId }}</span>
                </div>
              </div>
            </template>
            <div v-else style="font-size:11px;color:#94a3b8;padding:6px 8px;background:#f8fafc;border-radius:6px;text-align:center;">결제 데이터 없음</div>
          </div>
          <div style="padding:10px 14px;border-right:1px solid #bfdbfe;">
            <div style="font-size:10px;font-weight:700;color:#059669;margin-bottom:6px;">♻️ 환불 예정 결제수단</div>
            <template v-if="(state.data.order.orderPays || []).length">
              <div v-for="(pay, pi) in (state.data.order.orderPays || [])" :key="pi"
                style="font-size:11px;padding:5px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #bbf7d0;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="color:#374151;font-weight:700;">{{ pay.payMethodCdNm || pay.payMethodCd || '-' }}</span>
                  <span style="font-family:monospace;color:#059669;font-weight:700;">{{ Math.round((pay.payAmt || 0) * (state.data.calc.ratio || 0)).toLocaleString() }}원 예정</span>
                </div>
                <div style="font-size:10px;color:#6b9b7a;margin-top:2px;">원결제 {{ (pay.payAmt || 0).toLocaleString() }}원의 {{ Math.round((state.data.calc.ratio || 0) * 100) }}%</div>
              </div>
            </template>
            <div v-else style="font-size:11px;color:#94a3b8;padding:6px 8px;background:#f0fdf4;border-radius:6px;text-align:center;">결제 데이터 없음</div>
          </div>
          <div style="padding:10px 14px;background:#f8faff;">
            <div style="font-size:10px;font-weight:700;color:#6366f1;margin-bottom:6px;">✅ 최종 결제 요약</div>
            <div style="font-size:11px;display:flex;flex-direction:column;gap:4px;">
              <div style="display:flex;justify-content:space-between;padding:3px 0;color:#6b7280;">
                <span>원 결제액</span>
                <span style="font-family:monospace;">{{ (state.data.order.payAmt || state.data.calc.orderTotalAmt || 0).toLocaleString() }}원</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:3px 0;color:#059669;">
                <span>환불 예정액 (현재 클레임)</span>
                <span style="font-family:monospace;font-weight:700;">{{ (state.data.calc.refundBase || 0).toLocaleString() }}원</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:3px 0;color:#dc2626;">
                <span>클레임 환불합계 (전체)</span>
                <span style="font-family:monospace;">{{ state.orderClaims.reduce(function(s,c){return s+(c.refundAmt||0);},0).toLocaleString() }}원</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:3px 0;border-top:1px solid #e2e8f0;margin-top:2px;font-weight:800;">
                <span style="color:#374151;">최종 결제잔액</span>
                <span style="font-family:monospace;color:#1d4ed8;">{{ ((state.data.order.payAmt || state.data.calc.orderTotalAmt || 0) - state.orderClaims.reduce(function(s,c){return s+(c.refundAmt||0);},0)).toLocaleString() }}원</span>
              </div>
              <div style="margin-top:6px;padding:5px 8px;background:#e0e7ff;border-radius:6px;text-align:center;font-size:10px;color:#4338ca;font-weight:700;">
                비례율 {{ Math.round((state.data.calc.ratio || 0) * 100) }}% 적용
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- ⑤ 프로모션 정보 카드 (3열) -->
      <div style="margin-top:12px;border-radius:10px;border:1px solid #e9d5ff;overflow:hidden;">
        <div style="padding:8px 12px;background:#f5f3ff;font-size:11px;font-weight:800;color:#6d28d9;border-bottom:1px solid #e9d5ff;">🎁 프로모션 정보 (할인, 쿠폰)</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;">
          <div style="padding:10px 14px;border-right:1px solid #e9d5ff;">
            <div style="font-size:10px;font-weight:700;color:#7c3aed;margin-bottom:8px;">📌 사용된 프로모션 (주문 시)</div>
            <div v-if="!(state.data.order.couponDiscntAmt || state.data.order.couponDiscAmt) &amp;&amp; !(state.data.order.saveUseAmt || state.data.order.saveUsedAmt) &amp;&amp; !state.data.order.cacheUsedAmt"
              style="font-size:11px;color:#94a3b8;padding:4px 0;">사용된 프로모션 없음</div>
            <template v-else>
              <div v-if="state.data.order.couponDiscntAmt || state.data.order.couponDiscAmt"
                style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #e9d5ff;font-size:11px;">
                <div>
                  <span style="color:#7c3aed;font-weight:700;">🎟 쿠폰 할인</span>
                  <span v-if="state.data.calc.couponNm" style="color:#94a3b8;font-size:10px;margin-left:4px;">{{ state.data.calc.couponNm }}</span>
                </div>
                <span style="font-family:monospace;color:#dc2626;font-weight:700;">-{{ (state.data.order.couponDiscntAmt || state.data.order.couponDiscAmt || 0).toLocaleString() }}원</span>
              </div>
              <div v-if="state.data.order.saveUseAmt || state.data.order.saveUsedAmt"
                style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #e9d5ff;font-size:11px;">
                <span style="color:#7c3aed;font-weight:700;">⭐ 적립금 사용</span>
                <span style="font-family:monospace;color:#dc2626;font-weight:700;">-{{ (state.data.order.saveUseAmt || state.data.order.saveUsedAmt || 0).toLocaleString() }}원</span>
              </div>
              <div v-if="state.data.order.cacheUsedAmt"
                style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #e9d5ff;font-size:11px;">
                <span style="color:#7c3aed;font-weight:700;">💰 충전금 사용</span>
                <span style="font-family:monospace;color:#dc2626;font-weight:700;">-{{ (state.data.order.cacheUsedAmt || 0).toLocaleString() }}원</span>
              </div>
            </template>
          </div>
          <div style="padding:10px 14px;border-right:1px solid #e9d5ff;">
            <div style="font-size:10px;font-weight:700;color:#059669;margin-bottom:8px;">♻️ 복구되는 프로모션 (클레임 완료 후)</div>
            <div v-if="!(state.data.calc.couponDiscAmt > 0) &amp;&amp; !(state.data.calc.saveUsedAmt > 0) &amp;&amp; !(state.data.calc.cacheUsedAmt > 0)"
              style="font-size:11px;color:#94a3b8;padding:4px 0;">복구되는 프로모션 없음</div>
            <template v-else>
              <div v-if="state.data.calc.couponDiscAmt > 0"
                style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #bbf7d0;font-size:11px;">
                <div>
                  <span style="color:#059669;font-weight:700;">🎟 쿠폰</span>
                  <span v-if="state.data.calc.couponNm" style="color:#94a3b8;font-size:10px;margin-left:4px;">{{ state.data.calc.couponNm }}</span>
                </div>
                <span style="background:#ffedd5;color:#c2410c;padding:1px 8px;border-radius:8px;font-size:10px;font-weight:700;">재발급 필요</span>
              </div>
              <div v-if="state.data.calc.saveUsedAmt > 0"
                style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #bbf7d0;font-size:11px;">
                <span style="color:#059669;font-weight:700;">⭐ 적립금 복구</span>
                <span style="font-family:monospace;color:#059669;font-weight:700;">+{{ state.data.calc.saveUsedAmt.toLocaleString() }}원</span>
              </div>
              <div v-if="state.data.calc.cacheUsedAmt > 0"
                style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #bbf7d0;font-size:11px;">
                <span style="color:#059669;font-weight:700;">💰 충전금 복구</span>
                <span style="font-family:monospace;color:#1d4ed8;font-weight:700;">+{{ state.data.calc.cacheUsedAmt.toLocaleString() }}원</span>
              </div>
            </template>
          </div>
          <div style="padding:10px 14px;background:#faf5ff;">
            <div style="font-size:10px;font-weight:700;color:#6d28d9;margin-bottom:8px;">✅ 최종 프로모션 현황</div>
            <div style="font-size:11px;display:flex;flex-direction:column;gap:4px;">
              <div v-if="state.data.order.couponDiscntAmt || state.data.order.couponDiscAmt"
                style="padding:4px 8px;background:#fff;border-radius:6px;border:1px solid #e9d5ff;font-size:11px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="color:#6b7280;">🎟 쿠폰 잔여</span>
                  <span v-if="state.data.calc.couponDiscAmt > 0" style="background:#ffedd5;color:#c2410c;padding:1px 6px;border-radius:6px;font-size:10px;font-weight:700;">재발급 필요</span>
                  <span v-else style="color:#94a3b8;font-size:10px;">해당없음</span>
                </div>
              </div>
              <div v-if="state.data.order.saveUseAmt || state.data.order.saveUsedAmt"
                style="padding:4px 8px;background:#fff;border-radius:6px;border:1px solid #e9d5ff;font-size:11px;">
                <div style="display:flex;justify-content:space-between;color:#6b7280;">
                  <span>⭐ 적립금</span>
                  <div style="text-align:right;">
                    <div style="color:#dc2626;">사용 -{{ (state.data.order.saveUseAmt || state.data.order.saveUsedAmt || 0).toLocaleString() }}원</div>
                    <div v-if="state.data.calc.saveUsedAmt > 0" style="color:#059669;">복구 +{{ state.data.calc.saveUsedAmt.toLocaleString() }}원</div>
                    <div style="font-weight:700;color:#374151;border-top:1px solid #e9d5ff;margin-top:2px;padding-top:2px;">
                      순차감 {{ ((state.data.order.saveUseAmt || state.data.order.saveUsedAmt || 0) - (state.data.calc.saveUsedAmt || 0)).toLocaleString() }}원
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="state.data.order.cacheUsedAmt"
                style="padding:4px 8px;background:#fff;border-radius:6px;border:1px solid #e9d5ff;font-size:11px;">
                <div style="display:flex;justify-content:space-between;color:#6b7280;">
                  <span>💰 충전금</span>
                  <div style="text-align:right;">
                    <div style="color:#dc2626;">사용 -{{ (state.data.order.cacheUsedAmt || 0).toLocaleString() }}원</div>
                    <div v-if="state.data.calc.cacheUsedAmt > 0" style="color:#059669;">복구 +{{ state.data.calc.cacheUsedAmt.toLocaleString() }}원</div>
                    <div style="font-weight:700;color:#374151;border-top:1px solid #e9d5ff;margin-top:2px;padding-top:2px;">
                      순차감 {{ ((state.data.order.cacheUsedAmt || 0) - (state.data.calc.cacheUsedAmt || 0)).toLocaleString() }}원
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="!(state.data.order.couponDiscntAmt || state.data.order.couponDiscAmt) &amp;&amp; !(state.data.order.saveUseAmt || state.data.order.saveUsedAmt) &amp;&amp; !state.data.order.cacheUsedAmt"
                style="font-size:11px;color:#94a3b8;padding:4px 0;">프로모션 없음</div>
            </div>
          </div>
        </div>
      </div>
      <!-- ⑥ 상세 사유 -->
      <div v-if="state.data.claim.reasonDetail || state.data.claim.reason_detail"
        style="margin-top:10px;padding:8px 12px;background:#fafafa;border-radius:8px;border:1px solid #e5e7eb;font-size:11px;">
        <span style="color:#9ca3af;margin-right:8px;">상세 사유</span>
        <span style="color:#374151;">{{ state.data.claim.reasonDetail || state.data.claim.reason_detail }}</span>
      </div>
      <!-- ⑦ 진행 이력 타임라인 -->
      <div v-if="(state.data.statusHist || []).length"
        style="margin-top:10px;padding:10px 14px;background:#fafafa;border-radius:8px;border:1px solid #e5e7eb;">
        <div style="font-size:10px;color:#6b7280;font-weight:700;margin-bottom:10px;">📋 진행 이력</div>
        <div style="display:flex;align-items:flex-start;gap:0;overflow-x:auto;padding-bottom:4px;">
          <template v-for="(h, i) in (state.data.statusHist || [])" :key="i">
            <div style="display:flex;flex-direction:column;align-items:center;min-width:90px;max-width:110px;">
              <div style="padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;white-space:nowrap;margin-bottom:4px;"
                :style="(h.claimStatusCd||'').indexOf('COMPLT')>=0?'background:#dcfce7;color:#15803d':(h.claimStatusCd||'').indexOf('CANCEL')>=0?'background:#fee2e2;color:#b91c1c':'background:#dbeafe;color:#1d4ed8'">
                {{ {'REQUEST':'접수','RECEIPT':'접수','PROCESS':'처리중','INSPECT':'검수중','COMPLT':'완료','CANCEL':'취소','REJECT':'반려','HOLD':'보류'}[h.claimStatusCd] || h.claimStatusCd }}
              </div>
              <div style="font-size:9px;color:#9ca3af;text-align:center;">{{ (h.chgDate||'').replace('T',' ').slice(0,16) }}</div>
              <div v-if="h.chgUserId" style="font-size:9px;color:#cbd5e1;text-align:center;margin-top:1px;">{{ h.chgUserId }}</div>
            </div>
            <div v-if="i < (state.data.statusHist||[]).length - 1"
              style="flex-shrink:0;padding:0 4px;color:#d1d5db;font-size:14px;margin-top:6px;">›</div>
          </template>
        </div>
      </div>
      <!-- ⑧ 안내 -->
      <div style="margin-top:8px;font-size:10px;color:#9ca3af;padding:5px 10px;background:#f9fafb;border-radius:6px;border-left:3px solid #e5e7eb;">
        ※ 실제 환불액은 결제 수단별 환불 정책에 따라 달라질 수 있습니다. 비례율 {{ Math.round(state.data.calc.ratio * 100) }}% 적용
      </div>
    </template>
  </template>
</bo-modal>
`,
};
