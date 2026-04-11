/* ShopJoy Admin - 공통 참조 모달 (회원/상품/주문/클레임/쿠폰) */
window.AdminRefModal = {
  name: 'AdminRefModal',
  props: ['state', 'adminData'],
  emits: ['close'],
  setup(props, { emit }) {
    const { computed } = Vue;

    const close = () => emit('close');
    const s = props.state;

    /* ── 각 타입별 데이터 ── */
    const memberData = computed(() => {
      if (s.type !== 'member' || !s.id) return null;
      return props.adminData.getMember(s.id);
    });
    const productData = computed(() => {
      if (s.type !== 'product' || !s.id) return null;
      return props.adminData.getProduct(s.id);
    });
    const orderData = computed(() => {
      if (s.type !== 'order' || !s.id) return null;
      return props.adminData.getOrder(s.id);
    });
    const claimData = computed(() => {
      if (s.type !== 'claim' || !s.id) return null;
      return props.adminData.getClaim(s.id);
    });
    const couponData = computed(() => {
      if (s.type !== 'coupon' || !s.id) return null;
      return props.adminData.getCoupon(s.id);
    });

    const badgeCls = (status) => {
      const map = {
        '활성': 'badge-green', '판매중': 'badge-green', '진행중': 'badge-blue',
        '완료': 'badge-gray', '종료': 'badge-gray', '배송완료': 'badge-gray',
        '취소됨': 'badge-red', '정지': 'badge-red', '품절': 'badge-red',
        '배송중': 'badge-orange', '배송준비중': 'badge-orange', '결제완료': 'badge-orange',
        '만료': 'badge-red', '예정': 'badge-purple',
      };
      return map[status] || 'badge-gray';
    };

    return { close, memberData, productData, orderData, claimData, couponData, badgeCls, s };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="close">
  <div class="modal-box">
    <div class="modal-header">
      <span class="modal-title">
        {{ s.type==='member'?'회원 상세':s.type==='product'?'상품 상세':s.type==='order'?'주문 상세':s.type==='claim'?'클레임 상세':'쿠폰 상세' }}
      </span>
      <span class="modal-close" @click="close">×</span>
    </div>

    <!-- 회원 -->
    <template v-if="s.type==='member'">
      <template v-if="memberData">
        <div class="detail-row"><span class="detail-label">회원ID</span><span class="detail-value">{{ memberData.userId }}</span></div>
        <div class="detail-row"><span class="detail-label">이름</span><span class="detail-value">{{ memberData.memberNm }}</span></div>
        <div class="detail-row"><span class="detail-label">이메일</span><span class="detail-value">{{ memberData.email }}</span></div>
        <div class="detail-row"><span class="detail-label">연락처</span><span class="detail-value">{{ memberData.phone }}</span></div>
        <div class="detail-row"><span class="detail-label">등급</span><span class="detail-value"><span class="badge badge-purple">{{ memberData.gradeCd }}</span></span></div>
        <div class="detail-row"><span class="detail-label">상태</span><span class="detail-value"><span class="badge" :class="badgeCls(memberData.statusCd)">{{ memberData.statusCd }}</span></span></div>
        <div class="detail-row"><span class="detail-label">가입일</span><span class="detail-value">{{ memberData.joinDate }}</span></div>
        <div class="detail-row"><span class="detail-label">최근 로그인</span><span class="detail-value">{{ memberData.lastLogin }}</span></div>
        <div class="detail-row"><span class="detail-label">주문수</span><span class="detail-value">{{ memberData.orderCount }}건</span></div>
        <div class="detail-row"><span class="detail-label">총 구매액</span><span class="detail-value">{{ memberData.totalPurchase.toLocaleString() }}원</span></div>
      </template>
      <div v-else style="color:#999;text-align:center;padding:20px;">회원 정보를 찾을 수 없습니다.</div>
    </template>

    <!-- 상품 -->
    <template v-else-if="s.type==='product'">
      <template v-if="productData">
        <div class="detail-row"><span class="detail-label">상품ID</span><span class="detail-value">{{ productData.productId }}</span></div>
        <div class="detail-row"><span class="detail-label">상품명</span><span class="detail-value">{{ productData.prodNm }}</span></div>
        <div class="detail-row"><span class="detail-label">카테고리</span><span class="detail-value">{{ productData.category }}</span></div>
        <div class="detail-row"><span class="detail-label">가격</span><span class="detail-value">{{ productData.price.toLocaleString() }}원</span></div>
        <div class="detail-row"><span class="detail-label">재고</span><span class="detail-value">{{ productData.stock }}개</span></div>
        <div class="detail-row"><span class="detail-label">브랜드</span><span class="detail-value">{{ productData.brand }}</span></div>
        <div class="detail-row"><span class="detail-label">상태</span><span class="detail-value"><span class="badge" :class="badgeCls(productData.statusCd)">{{ productData.statusCd }}</span></span></div>
        <div class="detail-row"><span class="detail-label">등록일</span><span class="detail-value">{{ productData.regDate }}</span></div>
      </template>
      <div v-else style="color:#999;text-align:center;padding:20px;">상품 정보를 찾을 수 없습니다.</div>
    </template>

    <!-- 주문 -->
    <template v-else-if="s.type==='order'">
      <template v-if="orderData">
        <div class="detail-row"><span class="detail-label">주문ID</span><span class="detail-value">{{ orderData.orderId }}</span></div>
        <div class="detail-row"><span class="detail-label">회원</span><span class="detail-value">{{ orderData.userNm }} (ID: {{ orderData.userId }})</span></div>
        <div class="detail-row"><span class="detail-label">주문일시</span><span class="detail-value">{{ orderData.orderDate }}</span></div>
        <div class="detail-row"><span class="detail-label">상품</span><span class="detail-value">{{ orderData.prodNm }}</span></div>
        <div class="detail-row"><span class="detail-label">결제금액</span><span class="detail-value">{{ orderData.totalPrice.toLocaleString() }}원</span></div>
        <div class="detail-row"><span class="detail-label">결제수단</span><span class="detail-value">{{ orderData.payMethodCd }}</span></div>
        <div class="detail-row"><span class="detail-label">상태</span><span class="detail-value"><span class="badge" :class="badgeCls(orderData.statusCd)">{{ orderData.statusCd }}</span></span></div>
      </template>
      <div v-else style="color:#999;text-align:center;padding:20px;">주문 정보를 찾을 수 없습니다.</div>
    </template>

    <!-- 클레임 -->
    <template v-else-if="s.type==='claim'">
      <template v-if="claimData">
        <div class="detail-row"><span class="detail-label">클레임ID</span><span class="detail-value">{{ claimData.claimId }}</span></div>
        <div class="detail-row"><span class="detail-label">회원</span><span class="detail-value">{{ claimData.userNm }}</span></div>
        <div class="detail-row"><span class="detail-label">주문ID</span><span class="detail-value">{{ claimData.orderId }}</span></div>
        <div class="detail-row"><span class="detail-label">유형</span><span class="detail-value"><span class="badge badge-orange">{{ claimData.type }}</span></span></div>
        <div class="detail-row"><span class="detail-label">상태</span><span class="detail-value"><span class="badge" :class="badgeCls(claimData.statusCd)">{{ claimData.statusCd }}</span></span></div>
        <div class="detail-row"><span class="detail-label">상품명</span><span class="detail-value">{{ claimData.prodNm }}</span></div>
        <div class="detail-row"><span class="detail-label">사유</span><span class="detail-value">{{ claimData.reasonCd }}</span></div>
        <div class="detail-row"><span class="detail-label">신청일</span><span class="detail-value">{{ claimData.requestDate }}</span></div>
        <div class="detail-row" v-if="claimData.refundAmount"><span class="detail-label">환불금액</span><span class="detail-value">{{ claimData.refundAmount.toLocaleString() }}원</span></div>
      </template>
      <div v-else style="color:#999;text-align:center;padding:20px;">클레임 정보를 찾을 수 없습니다.</div>
    </template>

    <!-- 쿠폰 -->
    <template v-else-if="s.type==='coupon'">
      <template v-if="couponData">
        <div class="detail-row"><span class="detail-label">쿠폰ID</span><span class="detail-value">{{ couponData.couponId }}</span></div>
        <div class="detail-row"><span class="detail-label">쿠폰명</span><span class="detail-value">{{ couponData.name }}</span></div>
        <div class="detail-row"><span class="detail-label">코드</span><span class="detail-value">{{ couponData.code }}</span></div>
        <div class="detail-row"><span class="detail-label">할인</span><span class="detail-value">{{ couponData.discountTypeCd==='rate'?couponData.discountValue+'%':couponData.discountTypeCd==='shipping'?'무료배송':couponData.discountValue.toLocaleString()+'원' }}</span></div>
        <div class="detail-row"><span class="detail-label">최소주문</span><span class="detail-value">{{ couponData.minOrder ? couponData.minOrder.toLocaleString()+'원 이상' : '제한없음' }}</span></div>
        <div class="detail-row"><span class="detail-label">발급대상</span><span class="detail-value">{{ couponData.issueTo }}</span></div>
        <div class="detail-row"><span class="detail-label">만료일</span><span class="detail-value">{{ couponData.expiry }}</span></div>
        <div class="detail-row"><span class="detail-label">상태</span><span class="detail-value"><span class="badge" :class="badgeCls(couponData.statusCd)">{{ couponData.statusCd }}</span></span></div>
      </template>
      <div v-else style="color:#999;text-align:center;padding:20px;">쿠폰 정보를 찾을 수 없습니다.</div>
    </template>

    <div style="margin-top:16px;text-align:right;">
      <button class="btn btn-secondary" @click="close">닫기</button>
    </div>
  </div>
</div>
`
};
