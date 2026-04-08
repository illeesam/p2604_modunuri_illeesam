/* ShopJoy Admin - 배송관리 상세/등록 */
window.DlivDtl = {
  name: 'DlivDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId'],
  setup(props) {
    const { reactive, computed, ref, onMounted } = Vue;
    const isNew = computed(() => !props.editId);
    const tab = ref('info');

    const form = reactive({
      dlivId: '', orderId: '', userId: '', userName: '', receiver: '',
      address: '', phone: '', courier: '', trackingNo: '', status: '배송준비', regDate: '', memo: '',
    });

    onMounted(() => {
      if (!isNew.value) {
        const d = props.adminData.deliveries.find(x => x.dlivId === props.editId);
        if (d) Object.assign(form, { ...d });
      }
    });

    const relatedOrder  = computed(() => props.adminData.getOrder(form.orderId));
    const relatedClaims = computed(() => props.adminData.claims.filter(c => c.orderId === form.orderId));

    const save = () => {
      if (!form.dlivId || !form.orderId) { props.showToast('필수 항목을 입력해주세요.', 'error'); return; }
      if (isNew.value) {
        props.adminData.deliveries.push({ ...form });
        props.showToast('배송 정보가 등록되었습니다.');
      } else {
        const idx = props.adminData.deliveries.findIndex(x => x.dlivId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.deliveries[idx], form);
        props.showToast('저장되었습니다.');
      }
      props.navigate('dlivMng');
    };

    return { isNew, tab, form, relatedOrder, relatedClaims, save };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '배송 등록' : '배송 수정' }}</div>
  <div class="card">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:tab==='info'}" @click="tab='info'">기본정보</button>
      <button class="tab-btn" :class="{active:tab==='tracking'}" @click="tab='tracking'">배송 추적</button>
      <button v-if="!isNew" class="tab-btn" :class="{active:tab==='order'}" @click="tab='order'">
        연관 주문 <span class="tab-count">{{ relatedOrder ? 1 : 0 }}</span>
      </button>
      <button v-if="!isNew" class="tab-btn" :class="{active:tab==='claims'}" @click="tab='claims'">
        연관 클레임 <span class="tab-count">{{ relatedClaims.length }}</span>
      </button>
    </div>

    <!-- 기본정보 -->
    <div v-show="tab==='info'">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">배송ID <span class="req">*</span></label>
          <input class="form-control" v-model="form.dlivId" placeholder="DLIV-XXX" :readonly="!isNew" />
        </div>
        <div class="form-group">
          <label class="form-label">주문ID <span class="req">*</span></label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input class="form-control" v-model="form.orderId" placeholder="ORD-2026-XXX" />
            <span v-if="form.orderId" class="ref-link" @click="showRefModal('order', form.orderId)">보기</span>
          </div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">회원명</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input class="form-control" v-model="form.userName" />
            <span v-if="form.userId" class="ref-link" @click="showRefModal('member', form.userId)">보기</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">수령인</label>
          <input class="form-control" v-model="form.receiver" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">배송지 주소</label>
        <input class="form-control" v-model="form.address" placeholder="주소 입력" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">연락처</label>
          <input class="form-control" v-model="form.phone" placeholder="010-0000-0000" />
        </div>
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" v-model="form.status">
            <option>배송준비</option><option>배송중</option><option>배송완료</option><option>반송</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">메모</label>
        <textarea class="form-control" v-model="form.memo" rows="3"></textarea>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('dlivMng')">취소</button>
      </div>
    </div>

    <!-- 배송 추적 -->
    <div v-show="tab==='tracking'">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">택배사</label>
          <select class="form-control" v-model="form.courier">
            <option value="">선택</option><option>CJ대한통운</option><option>롯데택배</option><option>한진택배</option><option>우체국</option><option>배송예정</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">운송장번호</label>
          <input class="form-control" v-model="form.trackingNo" placeholder="운송장번호" />
        </div>
      </div>
      <div v-if="form.courier && form.trackingNo" style="margin-top:12px;padding:14px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8;">
        <div style="font-size:13px;color:#555;margin-bottom:8px;">택배 추적 링크</div>
        <a v-if="form.courier==='CJ대한통운'" :href="'https://trace.cjlogistics.com/next/tracking.html?wblNo='+form.trackingNo" target="_blank" class="btn btn-blue btn-sm">CJ대한통운 조회</a>
        <a v-else-if="form.courier==='롯데택배'" :href="'https://www.lotteglogis.com/open/tracking?invno='+form.trackingNo" target="_blank" class="btn btn-blue btn-sm">롯데택배 조회</a>
        <a v-else-if="form.courier==='한진택배'" :href="'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnumText2='+form.trackingNo" target="_blank" class="btn btn-blue btn-sm">한진택배 조회</a>
        <span v-else style="font-size:13px;color:#888;">해당 택배사 링크 없음</span>
      </div>
      <div v-else style="color:#aaa;font-size:13px;padding:20px;text-align:center;">택배사와 운송장번호를 입력하면 조회 링크가 표시됩니다.</div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('dlivMng')">취소</button>
      </div>
    </div>

    <!-- 연관 주문 -->
    <div v-show="tab==='order'">
      <template v-if="relatedOrder">
        <div class="detail-row"><span class="detail-label">주문ID</span><span class="detail-value">{{ relatedOrder.orderId }}</span></div>
        <div class="detail-row"><span class="detail-label">회원</span>
          <span class="detail-value"><span class="ref-link" @click="showRefModal('member', relatedOrder.userId)">{{ relatedOrder.userName }}</span></span>
        </div>
        <div class="detail-row"><span class="detail-label">상품</span><span class="detail-value">{{ relatedOrder.productName }}</span></div>
        <div class="detail-row"><span class="detail-label">금액</span><span class="detail-value">{{ relatedOrder.totalPrice.toLocaleString() }}원</span></div>
        <div class="detail-row"><span class="detail-label">상태</span><span class="detail-value">{{ relatedOrder.status }}</span></div>
        <div style="margin-top:14px;"><button class="btn btn-blue btn-sm" @click="navigate('orderDtl',{id:relatedOrder.orderId})">주문 상세 수정</button></div>
      </template>
      <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">연관 주문 정보가 없습니다.</div>
    </div>

    <!-- 연관 클레임 -->
    <div v-show="tab==='claims'">
      <table class="admin-table" v-if="relatedClaims.length">
        <thead><tr><th>클레임ID</th><th>유형</th><th>상태</th><th>사유</th><th>신청일</th><th>관리</th></tr></thead>
        <tbody>
          <tr v-for="c in relatedClaims" :key="c.claimId">
            <td><span class="ref-link" @click="showRefModal('claim', c.claimId)">{{ c.claimId }}</span></td>
            <td>{{ c.type }}</td><td>{{ c.status }}</td><td>{{ c.reason }}</td>
            <td>{{ c.requestDate.slice(0,10) }}</td>
            <td><button class="btn btn-blue btn-sm" @click="navigate('claimDtl',{id:c.claimId})">상세</button></td>
          </tr>
        </tbody>
      </table>
      <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">연관 클레임이 없습니다.</div>
    </div>
  </div>
</div>
`
};
