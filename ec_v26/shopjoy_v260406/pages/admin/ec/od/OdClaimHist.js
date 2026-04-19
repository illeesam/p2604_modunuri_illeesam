/* ShopJoy Admin - 클레임 이력 (클레임항목 / 처리정보 / 연관주문) */
window._odClaimHistState = window._odClaimHistState || { tab: 'items', viewMode: 'tab' };
window.OdClaimHist = {
  name: 'OdClaimHist',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'claimId'],
  setup(props) {
    const { ref, reactive, computed, onMounted } = Vue;
    const botTab = ref(window._odClaimHistState.tab || 'items');
    Vue.watch(botTab, v => { window._odClaimHistState.tab = v; });
    const viewMode2 = ref('tab');
    
    const showTab = (id) => viewMode2.value !== 'tab' || botTab.value === id;

    /* 클레임 항목 */
    const claimItems = reactive([]);
    let itemIdSeq = 1;

    /* 처리 정보 로컬 폼 */
    const processForm = reactive({ refundAmount: 0, refundMethodCd: '계좌환불', memo: '' });

    /* 클레임 유형별 단계 — parentCodeValues 기반 동적 파생 */
    const claimType = ref('취소');
    const _claimStatusCodes = (props.adminData.codes || [])
      .filter(c => c.codeGrp === 'CLAIM_STATUS' && c.useYn === 'Y')
      .sort((a, b) => a.sortOrd - b.sortOrd);
    const TYPE_CD = { '취소': 'CANCEL', '반품': 'RETURN', '교환': 'EXCHANGE' };
    const CLAIM_STEPS = computed(() => _claimStatusCodes
      .filter(c => !c.parentCodeValues || c.parentCodeValues.includes('^' + (TYPE_CD[claimType.value] || claimType.value) + '^'))
      .map(c => c.codeLabel)
      .filter(l => !['거부','철회'].includes(l)));
    const claimStatus = ref('');
    const statusOptions = computed(() => CLAIM_STEPS.value);

    const relatedOrder = ref(null);
    const relatedDliv  = ref(null);

    onMounted(() => {
      const c = props.adminData.getClaim(props.claimId);
      if (c) {
        claimType.value  = c.type || '취소';
        claimStatus.value = c.statusCd || '';
        Object.assign(processForm, {
          refundAmount: c.refundAmount || 0,
          refundMethodCd: c.refundMethodCd || '계좌환불',
          memo: c.memo || '',
        });
        claimItems.splice(0, claimItems.length, {
            _id: itemIdSeq++,
            bfProdNm: c.prodNm || '-', bfOptionNm: '-',
            bfQty: 1, bfPrice: 0, bfStatus: '결제완료',
            chgProdNm: '', chgOptionNm: '',
            afStatus: c.statusCd, afMemo: '', afAdmin: '', afDate: '',
          });
        relatedOrder.value = props.adminData.getOrder(c.orderId);
        relatedDliv.value  = props.adminData.deliveries.find(d => d.orderId === c.orderId) || null;
      }
    });

    const addClaimItem = () => {
      claimItems.push({
        _id: itemIdSeq++,
        bfProdNm: '', bfOptionNm: '', bfQty: 1, bfPrice: 0, bfStatus: '결제완료',
        chgProdNm: '', chgOptionNm: '',
        afStatus: claimStatus.value, afMemo: '', afAdmin: '', afDate: '',
      });
    };
    const removeClaimItem = (id) => {
      const idx = claimItems.findIndex(r => r._id === id);
      if (idx !== -1) claimItems.splice(idx, 1);
    };

    const saveProcess = () => {
      const idx = props.adminData.claims.findIndex(c => c.claimId === props.claimId);
      if (idx !== -1) Object.assign(props.adminData.claims[idx], {
        refundAmount: Number(processForm.refundAmount),
        refundMethodCd: processForm.refundMethodCd,
        memo: processForm.memo,
      });
      props.showToast('저장되었습니다.');
    };

    return { botTab, claimItems, addClaimItem, removeClaimItem, processForm, saveProcess, statusOptions, relatedOrder, relatedDliv, viewMode2, showTab };
  },
  template: /* html */`
<div>
  <div style="font-size:13px;font-weight:700;color:#555;padding:0 0 12px;"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>이력정보</div>
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:botTab==='items'}"   :disabled="viewMode2!=='tab'" @click="botTab='items'">↩ 클레임 항목 <span class="tab-count">{{ claimItems.length }}</span></button>
      <button class="tab-btn" :class="{active:botTab==='process'}" :disabled="viewMode2!=='tab'" @click="botTab='process'">⚙ 처리 정보</button>
      <button class="tab-btn" :class="{active:botTab==='order'}"   :disabled="viewMode2!=='tab'" @click="botTab='order'">🛒 연관 주문 <span class="tab-count">{{ relatedOrder ? 1 : 0 }}</span></button>
    </div>
    </div>
  <div :class="viewMode2!=='tab' ? 'dtl-tab-grid cols-'+viewMode2.charAt(0) : ''">

  <!-- 클레임 항목 -->
  <div class="card" v-show="showTab('items')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">↩ 클레임 항목 <span class="tab-count">{{ claimItems.length }}</span></div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
      <button class="btn btn-sm btn-secondary" @click="addClaimItem">+ 항목 추가</button>
    </div>
    <div v-if="claimItems.length" style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:1000px;">
        <thead>
          <tr>
            <th rowspan="2" style="border:1px solid #e0e0e0;padding:7px 10px;background:#f5f5f5;color:#888;text-align:center;vertical-align:middle;width:36px;">No</th>
            <th colspan="5" style="border:1px solid #e0e0e0;padding:7px 14px;background:#e6f4ff;color:#0958d9;font-weight:700;text-align:center;letter-spacing:0.5px;">현재</th>
            <th colspan="2" style="border:1px solid #e0e0e0;padding:7px 14px;background:#f6ffed;color:#389e0d;font-weight:700;text-align:center;letter-spacing:0.5px;">변경요청</th>
            <th colspan="4" style="border:1px solid #e0e0e0;padding:7px 14px;background:#fff0f6;color:#c41d7f;font-weight:700;text-align:center;letter-spacing:0.5px;">결과</th>
            <th rowspan="2" style="border:1px solid #e0e0e0;padding:7px;background:#f5f5f5;text-align:center;vertical-align:middle;width:50px;">삭제</th>
          </tr>
          <tr>
            <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f0f9ff;color:#1677ff;font-weight:600;white-space:nowrap;">상품명</th>
            <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f0f9ff;color:#1677ff;font-weight:600;white-space:nowrap;">옵션</th>
            <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f0f9ff;color:#1677ff;font-weight:600;white-space:nowrap;width:60px;">수량</th>
            <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f0f9ff;color:#1677ff;font-weight:600;white-space:nowrap;width:90px;">금액</th>
            <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f0f9ff;color:#1677ff;font-weight:600;white-space:nowrap;width:80px;">상태</th>
            <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f6ffed;color:#389e0d;font-weight:600;white-space:nowrap;">상품명</th>
            <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f6ffed;color:#389e0d;font-weight:600;white-space:nowrap;">옵션</th>
            <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#fff0f6;color:#9e1068;font-weight:600;white-space:nowrap;width:90px;">처리상태</th>
            <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#fff0f6;color:#9e1068;font-weight:600;white-space:nowrap;">메모</th>
            <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#fff0f6;color:#9e1068;font-weight:600;white-space:nowrap;width:80px;">처리자</th>
            <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#fff0f6;color:#9e1068;font-weight:600;white-space:nowrap;width:130px;">처리일시</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in claimItems" :key="item._id">
            <td style="border:1px solid #e0e0e0;padding:6px;text-align:center;color:#aaa;">{{ idx + 1 }}</td>
            <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#f8fbff;">
              <input class="form-control" v-model="item.bfProdNm" style="font-size:12px;background:transparent;border-color:#91caff;" />
            </td>
            <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#f8fbff;">
              <input class="form-control" v-model="item.bfOptionNm" style="font-size:12px;background:transparent;border-color:#91caff;" />
            </td>
            <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#f8fbff;">
              <input class="form-control" type="number" v-model.number="item.bfQty" style="font-size:12px;text-align:right;background:transparent;border-color:#91caff;" />
            </td>
            <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#f8fbff;">
              <input class="form-control" type="number" v-model.number="item.bfPrice" style="font-size:12px;text-align:right;background:transparent;border-color:#91caff;" />
            </td>
            <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#f8fbff;">
              <input class="form-control" v-model="item.bfStatus" style="font-size:12px;background:transparent;border-color:#91caff;" />
            </td>
            <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#f6ffed;">
              <input class="form-control" v-model="item.chgProdNm" placeholder="변경 후 상품명" style="font-size:12px;background:transparent;border-color:#95de64;" />
            </td>
            <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#f6ffed;">
              <input class="form-control" v-model="item.chgOptionNm" placeholder="변경 후 옵션" style="font-size:12px;background:transparent;border-color:#95de64;" />
            </td>
            <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#fff5fb;">
              <select class="form-control" v-model="item.afStatus" style="font-size:12px;background:transparent;border-color:#ffadd2;">
                <option v-for="s in statusOptions" :key="s">{{ s }}</option>
              </select>
            </td>
            <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#fff5fb;">
              <input class="form-control" v-model="item.afMemo" style="font-size:12px;background:transparent;border-color:#ffadd2;" />
            </td>
            <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#fff5fb;">
              <input class="form-control" v-model="item.afAdmin" style="font-size:12px;background:transparent;border-color:#ffadd2;" placeholder="처리자" />
            </td>
            <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#fff5fb;">
              <input class="form-control" v-model="item.afDate" style="font-size:12px;background:transparent;border-color:#ffadd2;" placeholder="2026-04-09 10:00" />
            </td>
            <td style="border:1px solid #e0e0e0;padding:4px;text-align:center;">
              <button class="btn btn-danger btn-sm" @click="removeClaimItem(item._id)">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">클레임 항목이 없습니다.</div>
  </div>

  <!-- 처리 정보 -->
  <div class="card" v-show="showTab('process')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">⚙ 처리 정보</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">환불금액</label>
        <input class="form-control" type="number" v-model.number="processForm.refundAmount" />
      </div>
      <div class="form-group">
        <label class="form-label">환불방법</label>
        <select class="form-control" v-model="processForm.refundMethodCd">
          <option>계좌환불</option><option>카드취소</option><option>캐쉬환불</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">처리 메모</label>
      <textarea class="form-control" v-model="processForm.memo" rows="4"></textarea>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" @click="saveProcess">저장</button>
    </div>
  </div>

  <!-- 연관 주문 -->
  <div class="card" v-show="showTab('order')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">🛒 연관 주문 <span class="tab-count">{{ relatedOrder ? 1 : 0 }}</span></div>
    <template v-if="relatedOrder">
      <div style="margin-bottom:12px;padding:14px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-size:14px;font-weight:700;margin-bottom:6px;">
              <span class="ref-link" @click="showRefModal('order', relatedOrder.orderId)">{{ relatedOrder.orderId }}</span>
            </div>
            <div style="font-size:13px;color:#555;line-height:2;">
              <span style="color:#888;">회원</span>
              <span class="ref-link" style="margin:0 6px;" @click="showRefModal('member', relatedOrder.userId)">{{ relatedOrder.userNm }}</span>
              <span style="color:#888;">주문일</span> <b style="margin-left:4px;">{{ relatedOrder.orderDate }}</b><br/>
              <span style="color:#888;">상품</span> <b style="margin-left:4px;">{{ relatedOrder.prodNm }}</b><br/>
              <span style="color:#888;">금액</span> <b style="margin-left:4px;color:#e8587a;">{{ relatedOrder.totalPrice.toLocaleString() }}원</b>
              &nbsp;·&nbsp;<span style="color:#888;">결제</span> <b style="margin-left:4px;">{{ relatedOrder.payMethodCd }}</b><br/>
              <span style="color:#888;">상태</span> <span class="badge badge-blue" style="margin-left:4px;">{{ relatedOrder.statusCd }}</span>
            </div>
          </div>
          <button class="btn btn-blue btn-sm" @click="navigate('odOrderDtl',{id:relatedOrder.orderId})">주문 수정</button>
        </div>
      </div>
      <template v-if="relatedDliv">
        <div style="padding:12px 14px;background:#f0f7ff;border-radius:8px;border:1px solid #bae0ff;font-size:13px;">
          <div style="font-weight:600;color:#1677ff;margin-bottom:6px;">배송 정보</div>
          <div style="line-height:2;color:#444;">
            <span style="color:#888;">수령인</span> <b style="margin-left:4px;">{{ relatedDliv.receiver }}</b>
            &nbsp;·&nbsp;<span style="color:#888;">배송지</span> <b style="margin-left:4px;">{{ relatedDliv.address }}</b><br/>
            <span style="color:#888;">택배사</span> <b style="margin-left:4px;">{{ relatedDliv.courierCd }}</b>
            &nbsp;·&nbsp;<span style="color:#888;">운송장</span> <b style="margin-left:4px;">{{ relatedDliv.trackingNo || '-' }}</b>
            &nbsp;·&nbsp;<span class="badge badge-green">{{ relatedDliv.statusCd }}</span>
          </div>
          <button class="btn btn-secondary btn-sm" style="margin-top:8px;" @click="navigate('odDlivDtl',{id:relatedDliv.dlivId})">배송 수정</button>
        </div>
      </template>
    </template>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">연관 주문 정보가 없습니다.</div>
  </div>
  </div>
</div>
`,
};
