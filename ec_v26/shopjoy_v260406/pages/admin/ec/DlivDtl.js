/* ShopJoy Admin - 배송관리 상세/등록 */
window.DlivDtl = {
  name: 'DlivDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { reactive, computed, ref, onMounted } = Vue;
    const isNew = computed(() => !props.editId);
    const tab = ref('info');

    const form = reactive({
      dlivId: '', orderId: '', userId: '', userName: '', receiver: '',
      address: '', phone: '', courier: '', trackingNo: '', status: '배송준비', regDate: '', memo: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      dlivId: yup.string().required('배송ID를 입력해주세요.'),
      orderId: yup.string().required('주문ID를 입력해주세요.'),
    });

    onMounted(() => {
      if (!isNew.value) {
        const d = props.adminData.deliveries.find(x => x.dlivId === props.editId);
        if (d) Object.assign(form, { ...d });
      }
    });

    const relatedOrder  = computed(() => props.adminData.getOrder(form.orderId));
    const relatedClaims = computed(() => props.adminData.claims.filter(c => c.orderId === form.orderId));

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
        path: `deliveries/${form.dlivId}`,
        data: { ...form },
        confirmTitle: isNew.value ? '등록' : '저장',
        confirmMsg: isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?',
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: isNew.value ? '등록되었습니다.' : '저장되었습니다.',
        onLocal: () => {
          if (isNew.value) {
            props.adminData.deliveries.push({ ...form });
          } else {
            const idx = props.adminData.deliveries.findIndex(x => x.dlivId === props.editId);
            if (idx !== -1) Object.assign(props.adminData.deliveries[idx], { ...form });
          }
        },
        navigate: props.navigate,
        navigateTo: 'ecDlivMng',
      });
    };

    return { isNew, tab, form, errors, save };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '배송 등록' : '배송 수정' }}</div>
  <div class="card">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:tab==='info'}" @click="tab='info'">기본정보</button>
      <button class="tab-btn" :class="{active:tab==='tracking'}" @click="tab='tracking'">배송 추적</button>
    </div>

    <!-- 기본정보 -->
    <div v-show="tab==='info'">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">배송ID <span class="req">*</span></label>
          <input class="form-control" v-model="form.dlivId" placeholder="DLIV-XXX" :readonly="!isNew" :class="errors.dlivId ? 'is-invalid' : ''" />
          <span v-if="errors.dlivId" class="field-error">{{ errors.dlivId }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">주문ID <span class="req">*</span></label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input class="form-control" v-model="form.orderId" placeholder="ORD-2026-XXX" :class="errors.orderId ? 'is-invalid' : ''" />
            <span v-if="form.orderId" class="ref-link" @click="showRefModal('order', form.orderId)">보기</span>
          </div>
          <span v-if="errors.orderId" class="field-error">{{ errors.orderId }}</span>
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
        <button class="btn btn-secondary" @click="navigate('ecDlivMng')">취소</button>
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
        <button class="btn btn-secondary" @click="navigate('ecDlivMng')">취소</button>
      </div>
    </div>

  </div>
  <div v-if="!isNew" class="card">
    <dliv-hist :order-id="form.orderId" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" />
  </div>
</div>
`
};
