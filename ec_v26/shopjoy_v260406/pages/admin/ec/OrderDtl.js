/* ShopJoy Admin - 주문관리 상세/등록 */
window.OrderDtl = {
  name: 'OrderDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, onMounted, onBeforeUnmount, ref, nextTick } = Vue;
    const isNew = computed(() => !props.editId);

    const ORDER_STEPS = ['주문완료', '결제완료', '배송준비중', '배송중', '배송완료', '완료'];

    const form = reactive({
      orderId: '', userId: '', userNm: '', orderDate: '', prodNm: '',
      totalPrice: 0, payMethodCd: '계좌이체', statusCd: '주문완료', memo: '',
    });
    const errors = reactive({});

    const memoEl = ref(null);
    let _qMemo = null;

    const schema = yup.object({
      orderId: yup.string().required('주문ID를 입력해주세요.'),
      userId: yup.string().required('회원ID를 입력해주세요.'),
    });

    onMounted(async () => {
      if (!isNew.value) {
        const o = props.adminData.getOrder(props.editId);
        if (o) Object.assign(form, { ...o });
      }
      await nextTick();
      if (memoEl.value) {
        _qMemo = new Quill(memoEl.value, {
          theme: 'snow',
          placeholder: '내용을 입력하세요...',
          modules: { toolbar: [['bold','italic','underline'],[{color:[]}],[{list:'ordered'},{list:'bullet'}],['link','clean']] }
        });
        if (form.memo) _qMemo.root.innerHTML = form.memo;
        _qMemo.on('text-change', () => { form.memo = _qMemo.root.innerHTML; });
      }
    });

    onBeforeUnmount(() => { if (_qMemo) { form.memo = _qMemo.root.innerHTML; _qMemo = null; } });

    const currentStepIdx = computed(() => {
      const idx = ORDER_STEPS.indexOf(form.statusCd);
      return idx !== -1 ? idx : -1;
    });

    const isCanceled = computed(() => form.statusCd === '취소됨');

    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      await window.adminApiCall({
        method: isNew.value ? 'post' : 'put',
        path: `orders/${form.orderId}`,
        data: { ...form },
        confirmTitle: isNew.value ? '등록' : '저장',
        confirmMsg: isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?',
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: isNew.value ? '등록되었습니다.' : '저장되었습니다.',
        onLocal: () => {
          if (isNew.value) {
            props.adminData.orders.push({ ...form, totalPrice: Number(form.totalPrice), userId: Number(form.userId) });
          } else {
            const idx = props.adminData.orders.findIndex(x => x.orderId === props.editId);
            if (idx !== -1) Object.assign(props.adminData.orders[idx], { ...form, totalPrice: Number(form.totalPrice) });
          }
        },
        navigate: props.navigate,
        navigateTo: 'ecOrderMng',
      });
    };

    return { isNew, form, errors, save, ORDER_STEPS, currentStepIdx, isCanceled, memoEl };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '주문 등록' : (viewMode ? '주문 상세' : '주문 수정') }}</div>
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
        <label class="form-label">주문ID <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.orderId" placeholder="ORD-2026-XXX" :readonly="!isNew || viewMode" :class="errors.orderId ? 'is-invalid' : ''" />
        <span v-if="errors.orderId" class="field-error">{{ errors.orderId }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">회원ID <span v-if="!viewMode" class="req">*</span></label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input class="form-control" v-model="form.userId" placeholder="회원 ID" :readonly="viewMode" :class="errors.userId ? 'is-invalid' : ''" />
          <span v-if="form.userId" class="ref-link" @click="showRefModal('member', Number(form.userId))">보기</span>
        </div>
        <span v-if="errors.userId" class="field-error">{{ errors.userId }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">회원명</label>
        <input class="form-control" v-model="form.userNm" :readonly="viewMode" />
      </div>
      <div class="form-group">
        <label class="form-label">주문일시</label>
        <input class="form-control" v-model="form.orderDate" placeholder="2026-04-08 10:00" :readonly="viewMode" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">상품</label>
      <input class="form-control" v-model="form.prodNm" placeholder="상품명" :readonly="viewMode" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">결제금액</label>
        <input class="form-control" type="number" v-model.number="form.totalPrice" :readonly="viewMode" />
      </div>
      <div class="form-group">
        <label class="form-label">결제수단</label>
        <select class="form-control" v-model="form.payMethodCd" :disabled="viewMode">
          <option>계좌이체</option><option>카드결제</option><option>캐쉬</option><option>혼합결제</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" v-model="form.statusCd" :disabled="viewMode">
          <option>주문완료</option><option>결제완료</option><option>배송준비중</option>
          <option>배송중</option><option>배송완료</option><option>완료</option><option>취소됨</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">메모</label>
      <div v-if="viewMode" class="form-control" style="min-height:90px;line-height:1.6;" v-html="form.memo || '<span style=color:#bbb>-</span>'"></div>
      <div v-else ref="memoEl" style="min-height:90px;background:#fff;"></div>
    </div>
    <div class="form-actions">
      <template v-if="viewMode">
        <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
        <button class="btn btn-secondary" @click="navigate('ecOrderMng')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('ecOrderMng')">취소</button>
      </template>
    </div>

  </div>
  <div v-if="!isNew" class="card">
    <order-hist :order-id="form.orderId" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" />
  </div>
</div>
`
};
