/* ShopJoy Admin - 주문관리 상세/등록 */
window.OrderDtl = {
  name: 'OrderDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId'],
  setup(props) {
    const { reactive, computed, ref, onMounted } = Vue;
    const isNew = computed(() => !props.editId);
    const botTab = ref('products');

    const ORDER_STEPS = ['주문완료', '결제완료', '배송준비중', '배송중', '배송완료', '완료'];

    const form = reactive({
      orderId: '', userId: '', userName: '', orderDate: '', productName: '',
      totalPrice: 0, payMethod: '계좌이체', status: '주문완료', memo: '',
    });

    /* mock 구성 상품 목록 */
    const orderItems = ref([]);

    onMounted(() => {
      if (!isNew.value) {
        const o = props.adminData.getOrder(props.editId);
        if (o) Object.assign(form, { ...o });
        // mock 구성상품 생성
        if (o) {
          orderItems.value = [
            { no: 1, productName: o.productName, optionName: '-', qty: 1, unitPrice: o.totalPrice, totalPrice: o.totalPrice, status: o.status },
          ];
        }
      }
    });

    const currentStepIdx = computed(() => {
      const idx = ORDER_STEPS.indexOf(form.status);
      return idx !== -1 ? idx : -1;
    });

    const isCanceled = computed(() => form.status === '취소됨');

    const relatedClaims = computed(() => props.adminData.claims.filter(c => c.orderId === form.orderId));
    const relatedDliv   = computed(() => props.adminData.deliveries.find(d => d.orderId === form.orderId) || null);

    /* mock 배송이력 */
    const dlivHistory = computed(() => {
      if (!relatedDliv.value) return [];
      return [
        { date: form.orderDate ? form.orderDate.slice(0, 10) : '-', status: '배송준비중', location: '물류센터', memo: '상품 포장 완료' },
        { date: relatedDliv.value.shipDate || '-', status: '배송중', location: relatedDliv.value.courier || '-', memo: '출고 완료' },
      ].filter(h => h.date !== '-');
    });

    const save = () => {
      if (!form.orderId || !form.userId) { props.showToast('필수 항목을 입력해주세요.', 'error'); return; }
      if (isNew.value) {
        props.adminData.orders.push({ ...form, totalPrice: Number(form.totalPrice), userId: Number(form.userId) });
        props.showToast('주문이 등록되었습니다.');
      } else {
        const idx = props.adminData.orders.findIndex(o => o.orderId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.orders[idx], { ...form, totalPrice: Number(form.totalPrice) });
        props.showToast('저장되었습니다.');
      }
      props.navigate('ecOrderMng');
    };

    return { isNew, botTab, form, relatedClaims, relatedDliv, save, ORDER_STEPS, currentStepIdx, isCanceled, orderItems, dlivHistory };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '주문 등록' : '주문 수정' }}</div>
  <div class="card">

    <!-- 주문 진행 상태 흐름 -->
    <div v-if="!isNew" style="margin-bottom:20px;padding:16px;background:#f9f9f9;border-radius:10px;border:1px solid #e8e8e8;">
      <div v-if="isCanceled" style="text-align:center;padding:8px 0;">
        <span style="font-size:14px;font-weight:700;color:#cf1322;letter-spacing:1px;">⊘ 취소됨</span>
      </div>
      <div v-else style="display:flex;align-items:center;overflow-x:auto;">
        <template v-for="(step, idx) in ORDER_STEPS" :key="step">
          <div style="display:flex;flex-direction:column;align-items:center;min-width:80px;flex:1;">
            <div :style="{
              width:'32px', height:'32px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:'700', fontSize:'13px', marginBottom:'5px',
              background: idx < currentStepIdx ? '#e8587a' : idx === currentStepIdx ? '#e8587a' : '#e0e0e0',
              color: idx <= currentStepIdx ? '#fff' : '#999',
              boxShadow: idx === currentStepIdx ? '0 0 0 3px rgba(232,88,122,0.25)' : 'none',
            }">{{ idx + 1 }}</div>
            <div :style="{
              fontSize:'11px', fontWeight: idx === currentStepIdx ? '700' : '400',
              color: idx < currentStepIdx ? '#e8587a' : idx === currentStepIdx ? '#e8587a' : '#bbb',
              whiteSpace:'nowrap',
            }">{{ step }}</div>
          </div>
          <div v-if="idx < ORDER_STEPS.length - 1"
            :style="{flex:'1', height:'2px', background: idx < currentStepIdx ? '#e8587a' : '#e0e0e0', minWidth:'16px', marginBottom:'17px'}"></div>
        </template>
      </div>
    </div>

    <!-- 기본정보 폼 -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">주문ID <span class="req">*</span></label>
        <input class="form-control" v-model="form.orderId" placeholder="ORD-2026-XXX" :readonly="!isNew" />
      </div>
      <div class="form-group">
        <label class="form-label">회원ID <span class="req">*</span></label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input class="form-control" v-model="form.userId" placeholder="회원 ID" />
          <span v-if="form.userId" class="ref-link" @click="showRefModal('member', Number(form.userId))">보기</span>
        </div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">회원명</label>
        <input class="form-control" v-model="form.userName" />
      </div>
      <div class="form-group">
        <label class="form-label">주문일시</label>
        <input class="form-control" v-model="form.orderDate" placeholder="2026-04-08 10:00" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">상품</label>
      <input class="form-control" v-model="form.productName" placeholder="상품명" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">결제금액</label>
        <input class="form-control" type="number" v-model.number="form.totalPrice" />
      </div>
      <div class="form-group">
        <label class="form-label">결제수단</label>
        <select class="form-control" v-model="form.payMethod">
          <option>계좌이체</option><option>카드결제</option><option>캐쉬</option><option>혼합결제</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" v-model="form.status">
          <option>주문완료</option><option>결제완료</option><option>배송준비중</option>
          <option>배송중</option><option>배송완료</option><option>완료</option><option>취소됨</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">메모</label>
      <textarea class="form-control" v-model="form.memo" rows="3"></textarea>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('ecOrderMng')">취소</button>
    </div>

    <!-- 하단 탭 (수정 모드에서만) -->
    <template v-if="!isNew">
      <div class="tab-nav" style="margin-top:28px;">
        <button class="tab-btn" :class="{active:botTab==='products'}" @click="botTab='products'">
          구성 상품 <span class="tab-count">{{ orderItems.length }}</span>
        </button>
        <button class="tab-btn" :class="{active:botTab==='dliv'}" @click="botTab='dliv'">
          배송 이력 <span class="tab-count">{{ relatedDliv ? 1 : 0 }}</span>
        </button>
        <button class="tab-btn" :class="{active:botTab==='claims'}" @click="botTab='claims'">
          연관 클레임 <span class="tab-count">{{ relatedClaims.length }}</span>
        </button>
      </div>

      <!-- 구성 상품 -->
      <div v-show="botTab==='products'">
        <table class="admin-table" v-if="orderItems.length">
          <thead><tr><th>No</th><th>상품명</th><th>옵션</th><th>수량</th><th>단가</th><th>금액</th><th>상태</th><th>관리</th></tr></thead>
          <tbody>
            <tr v-for="item in orderItems" :key="item.no">
              <td>{{ item.no }}</td>
              <td>{{ item.productName }}</td>
              <td>{{ item.optionName }}</td>
              <td>{{ item.qty }}</td>
              <td>{{ item.unitPrice.toLocaleString() }}원</td>
              <td style="font-weight:600;">{{ item.totalPrice.toLocaleString() }}원</td>
              <td>{{ item.status }}</td>
              <td><button class="btn btn-secondary btn-sm" @click="showRefModal('order', form.orderId)">보기</button></td>
            </tr>
          </tbody>
        </table>
        <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">구성 상품 정보가 없습니다.</div>
      </div>

      <!-- 배송 이력 -->
      <div v-show="botTab==='dliv'">
        <template v-if="relatedDliv">
          <div style="margin-bottom:14px;padding:12px 16px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8;display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:13px;">
              <span style="color:#888;">수령인</span> <b>{{ relatedDliv.receiver }}</b>
              &nbsp;·&nbsp;<span style="color:#888;">택배사</span> <b>{{ relatedDliv.courier }}</b>
              &nbsp;·&nbsp;<span style="color:#888;">운송장</span> <b>{{ relatedDliv.trackingNo || '-' }}</b>
            </div>
            <button class="btn btn-blue btn-sm" @click="navigate('ecDlivDtl',{id:relatedDliv.dlivId})">배송 수정</button>
          </div>
          <table class="admin-table" v-if="dlivHistory.length">
            <thead><tr><th>일시</th><th>상태</th><th>위치</th><th>메모</th></tr></thead>
            <tbody>
              <tr v-for="(h, i) in dlivHistory" :key="i">
                <td>{{ h.date }}</td>
                <td><span class="badge badge-blue">{{ h.status }}</span></td>
                <td>{{ h.location }}</td>
                <td>{{ h.memo }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else style="text-align:center;color:#aaa;padding:20px;font-size:13px;">배송 이력이 없습니다.</div>
        </template>
        <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">배송 정보가 없습니다.</div>
      </div>

      <!-- 연관 클레임 -->
      <div v-show="botTab==='claims'">
        <table class="admin-table" v-if="relatedClaims.length">
          <thead><tr><th>클레임ID</th><th>회원</th><th>유형</th><th>상태</th><th>사유</th><th>신청일</th><th>관리</th></tr></thead>
          <tbody>
            <tr v-for="c in relatedClaims" :key="c.claimId">
              <td><span class="ref-link" @click="showRefModal('claim', c.claimId)">{{ c.claimId }}</span></td>
              <td><span class="ref-link" @click="showRefModal('member', c.userId)">{{ c.userName }}</span></td>
              <td>{{ c.type }}</td>
              <td>{{ c.status }}</td>
              <td>{{ c.reason }}</td>
              <td>{{ c.requestDate.slice(0,10) }}</td>
              <td><button class="btn btn-blue btn-sm" @click="navigate('ecClaimDtl',{id:c.claimId})">상세</button></td>
            </tr>
          </tbody>
        </table>
        <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">연관 클레임이 없습니다.</div>
      </div>
    </template>

  </div>
</div>
`
};
