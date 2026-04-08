/* ShopJoy Admin - 회원관리 상세/등록 */
window.MemberDtl = {
  name: 'MemberDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId'],
  setup(props) {
    const { reactive, computed, ref, onMounted } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const tab = ref('orders');

    const form = reactive({
      email: '', name: '', phone: '', grade: '일반', status: '활성',
      joinDate: '', lastLogin: '', orderCount: 0, totalPurchase: 0, memo: '',
    });

    onMounted(() => {
      if (!isNew.value) {
        const m = props.adminData.getMember(props.editId);
        if (m) Object.assign(form, { ...m });
      }
    });

    const save = () => {
      if (!form.email || !form.name) { props.showToast('필수 항목을 입력해주세요.', 'error'); return; }
      if (isNew.value) {
        props.adminData.members.push({
          ...form, userId: props.adminData.nextId(props.adminData.members, 'userId'),
          joinDate: form.joinDate || new Date().toISOString().slice(0, 10), orderCount: 0, totalPurchase: 0,
        });
        props.showToast('회원이 등록되었습니다.');
      } else {
        const idx = props.adminData.members.findIndex(m => m.userId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.members[idx], form);
        props.showToast('저장되었습니다.');
      }
      props.navigate('memberMng');
    };

    const memberOrders = computed(() => props.adminData.orders.filter(o => o.userId === props.editId));
    const memberClaims = computed(() => props.adminData.claims.filter(c => c.userId === props.editId));

    return { isNew, tab, form, save, memberOrders, memberClaims };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '회원 등록' : '회원 수정' }}</div>
  <div class="card">
    <!-- 기본정보 폼 -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">이메일 <span class="req">*</span></label>
        <input class="form-control" v-model="form.email" placeholder="이메일 주소" />
      </div>
      <div class="form-group">
        <label class="form-label">이름 <span class="req">*</span></label>
        <input class="form-control" v-model="form.name" placeholder="이름" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">연락처</label>
        <input class="form-control" v-model="form.phone" placeholder="010-0000-0000" />
      </div>
      <div class="form-group">
        <label class="form-label">등급</label>
        <select class="form-control" v-model="form.grade">
          <option>일반</option><option>우수</option><option>VIP</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" v-model="form.status">
          <option>활성</option><option>정지</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">가입일</label>
        <input class="form-control" type="date" v-model="form.joinDate" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">메모</label>
      <textarea class="form-control" v-model="form.memo" rows="3" placeholder="관리자 메모"></textarea>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('memberMng')">취소</button>
    </div>

    <!-- 연관 데이터 (저장 하단) -->
    <template v-if="!isNew">
      <div class="tab-nav" style="margin-top:28px;">
        <button class="tab-btn" :class="{active:tab==='orders'}" @click="tab='orders'">
          연관 주문 <span class="tab-count">{{ memberOrders.length }}</span>
        </button>
        <button class="tab-btn" :class="{active:tab==='claims'}" @click="tab='claims'">
          연관 클레임 <span class="tab-count">{{ memberClaims.length }}</span>
        </button>
      </div>

      <!-- 연관 주문 -->
      <div v-show="tab==='orders'">
        <table class="admin-table" v-if="memberOrders.length">
          <thead><tr><th>주문ID</th><th>주문일</th><th>상품</th><th>금액</th><th>상태</th><th>관리</th></tr></thead>
          <tbody>
            <tr v-for="o in memberOrders" :key="o.orderId">
              <td><span class="ref-link" @click="showRefModal('order', o.orderId)">{{ o.orderId }}</span></td>
              <td>{{ o.orderDate }}</td>
              <td>{{ o.productName }}</td>
              <td>{{ o.totalPrice.toLocaleString() }}원</td>
              <td>{{ o.status }}</td>
              <td><button class="btn btn-blue btn-sm" @click="navigate('orderDtl',{id:o.orderId})">상세</button></td>
            </tr>
          </tbody>
        </table>
        <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">주문 내역이 없습니다.</div>
      </div>

      <!-- 연관 클레임 -->
      <div v-show="tab==='claims'">
        <table class="admin-table" v-if="memberClaims.length">
          <thead><tr><th>클레임ID</th><th>주문ID</th><th>유형</th><th>상태</th><th>사유</th><th>신청일</th><th>관리</th></tr></thead>
          <tbody>
            <tr v-for="c in memberClaims" :key="c.claimId">
              <td><span class="ref-link" @click="showRefModal('claim', c.claimId)">{{ c.claimId }}</span></td>
              <td><span class="ref-link" @click="showRefModal('order', c.orderId)">{{ c.orderId }}</span></td>
              <td>{{ c.type }}</td>
              <td>{{ c.status }}</td>
              <td>{{ c.reason }}</td>
              <td>{{ c.requestDate.slice(0,10) }}</td>
              <td><button class="btn btn-blue btn-sm" @click="navigate('claimDtl',{id:c.claimId})">상세</button></td>
            </tr>
          </tbody>
        </table>
        <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">클레임 내역이 없습니다.</div>
      </div>
    </template>
  </div>
</div>
`
};
