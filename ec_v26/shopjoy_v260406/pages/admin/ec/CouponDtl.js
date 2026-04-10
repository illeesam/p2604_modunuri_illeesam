/* ShopJoy Admin - 쿠폰관리 상세/등록 */
window.CouponDtl = {
  name: 'CouponDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId'],
  setup(props) {
    const { reactive, computed, ref, onMounted } = Vue;
    const isNew = computed(() => !props.editId);
    const tab = ref('info');

    const form = reactive({
      code: '', name: '', discountType: 'amount', discountValue: 0,
      minOrder: 0, expiry: '', issueTo: '전체', issueCount: 0, useCount: 0,
      status: '활성', applicableTo: '전체 상품', memo: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      code: yup.string().required('쿠폰코드를 입력해주세요.'),
      name: yup.string().required('쿠폰명을 입력해주세요.'),
      expiry: yup.string().required('만료일을 입력해주세요.'),
    });

    onMounted(() => {
      if (!isNew.value) {
        const c = props.adminData.getCoupon(props.editId);
        if (c) Object.assign(form, { ...c });
      }
    });

    /* 이 쿠폰을 사용한 주문들 (mock: orderId로 확인 불가, userId별 쿠폰 사용 내역 근사치) */
    const useRate = computed(() => form.issueCount > 0 ? Math.round((form.useCount / form.issueCount) * 100) : 0);

    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      if (isNew.value) {
        props.adminData.coupons.push({
          ...form,
          couponId: props.adminData.nextId(props.adminData.coupons, 'couponId'),
          discountValue: Number(form.discountValue), minOrder: Number(form.minOrder),
          issueCount: Number(form.issueCount), useCount: 0,
        });
        props.showToast('쿠폰이 등록되었습니다.');
      } else {
        const idx = props.adminData.coupons.findIndex(c => c.couponId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.coupons[idx], { ...form, discountValue: Number(form.discountValue), minOrder: Number(form.minOrder) });
        props.showToast('저장되었습니다.');
      }
      props.navigate('ecCouponMng');
    };

    return { isNew, tab, form, errors, useRate, save };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '쿠폰 등록' : '쿠폰 수정' }}</div>
  <div class="card">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:tab==='info'}" @click="tab='info'">기본정보</button>
      <button class="tab-btn" :class="{active:tab==='issue'}" @click="tab='issue'">발급 정보</button>
      <button v-if="!isNew" class="tab-btn" :class="{active:tab==='stats'}" @click="tab='stats'">사용 통계</button>
    </div>

    <!-- 기본정보 -->
    <div v-show="tab==='info'">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">쿠폰코드 <span class="req">*</span></label>
          <input class="form-control" v-model="form.code" placeholder="COUPON_CODE" :class="errors.code ? 'is-invalid' : ''" />
          <span v-if="errors.code" class="field-error">{{ errors.code }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">쿠폰명 <span class="req">*</span></label>
          <input class="form-control" v-model="form.name" placeholder="쿠폰명" :class="errors.name ? 'is-invalid' : ''" />
          <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">할인유형</label>
          <select class="form-control" v-model="form.discountType">
            <option value="amount">금액 할인</option><option value="rate">% 할인</option><option value="shipping">무료배송</option>
          </select>
        </div>
        <div class="form-group" v-if="form.discountType!=='shipping'">
          <label class="form-label">할인값</label>
          <input class="form-control" type="number" v-model.number="form.discountValue" placeholder="0" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">최소 주문금액</label>
          <input class="form-control" type="number" v-model.number="form.minOrder" placeholder="0" />
        </div>
        <div class="form-group">
          <label class="form-label">적용상품</label>
          <input class="form-control" v-model="form.applicableTo" placeholder="전체 상품, 의류, ..." />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">만료일 <span class="req">*</span></label>
          <input class="form-control" type="date" v-model="form.expiry" :class="errors.expiry ? 'is-invalid' : ''" />
          <span v-if="errors.expiry" class="field-error">{{ errors.expiry }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" v-model="form.status">
            <option>활성</option><option>비활성</option><option>만료</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('ecCouponMng')">취소</button>
      </div>
    </div>

    <!-- 발급 정보 -->
    <div v-show="tab==='issue'">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">발급대상</label>
          <input class="form-control" v-model="form.issueTo" placeholder="전체, VIP 회원, ..." />
        </div>
        <div class="form-group">
          <label class="form-label">발급수량</label>
          <input class="form-control" type="number" v-model.number="form.issueCount" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">메모</label>
        <textarea class="form-control" v-model="form.memo" rows="4"></textarea>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('ecCouponMng')">취소</button>
      </div>
    </div>

    <!-- 사용 통계 -->
    <div v-show="tab==='stats'">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
        <div style="text-align:center;padding:20px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8;">
          <div style="font-size:28px;font-weight:700;color:#e8587a;">{{ form.issueCount }}</div>
          <div style="font-size:12px;color:#888;margin-top:4px;">총 발급 수량</div>
        </div>
        <div style="text-align:center;padding:20px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8;">
          <div style="font-size:28px;font-weight:700;color:#52c41a;">{{ form.useCount }}</div>
          <div style="font-size:12px;color:#888;margin-top:4px;">사용 건수</div>
        </div>
        <div style="text-align:center;padding:20px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8;">
          <div style="font-size:28px;font-weight:700;color:#1677ff;">{{ useRate }}%</div>
          <div style="font-size:12px;color:#888;margin-top:4px;">사용률</div>
        </div>
      </div>
      <div style="background:#fff;border:1px solid #e8e8e8;border-radius:8px;padding:14px;">
        <div style="font-size:13px;font-weight:600;margin-bottom:10px;color:#555;">사용률 현황</div>
        <div style="background:#f0f0f0;border-radius:4px;height:12px;overflow:hidden;">
          <div :style="{width: useRate+'%', background:'#e8587a', height:'100%', borderRadius:'4px', transition:'width .5s'}" ></div>
        </div>
        <div style="font-size:12px;color:#888;margin-top:6px;">{{ form.useCount }} / {{ form.issueCount }}개 사용</div>
      </div>
    </div>
  </div>
</div>
`
};
