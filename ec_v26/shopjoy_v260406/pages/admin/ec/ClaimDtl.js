/* ShopJoy Admin - 클레임관리 상세/등록 */
window.ClaimDtl = {
  name: 'ClaimDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId'],
  setup(props) {
    const { reactive, computed, ref, onMounted } = Vue;
    const isNew = computed(() => !props.editId);

    const form = reactive({
      claimId: '', userId: '', userName: '', orderId: '', productName: '',
      type: '취소', status: '취소요청', reason: '', reasonDetail: '',
      refundAmount: 0, refundMethod: '계좌환불', requestDate: '', memo: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      claimId: yup.string().required('클레임ID를 입력해주세요.'),
      orderId: yup.string().required('주문ID를 입력해주세요.'),
    });

    /* CLAIM_STEPS: 유형별 진행 단계 */
    const CLAIM_STEPS = computed(() => ({
      '취소': ['취소요청', '취소처리중', '취소완료'],
      '반품': ['반품요청', '수거예정', '수거완료', '환불처리중', '환불완료'],
      '교환': ['교환요청', '수거예정', '수거완료', '발송완료', '교환완료'],
    }[form.type] || []));

    const currentStepIdx = computed(() => CLAIM_STEPS.value.indexOf(form.status));
    const statusOptions   = computed(() => CLAIM_STEPS.value);

    onMounted(() => {
      if (!isNew.value) {
        const c = props.adminData.getClaim(props.editId);
        if (c) Object.assign(form, { ...c });
      }
    });

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
        props.adminData.claims.push({ ...form, refundAmount: Number(form.refundAmount) });
        props.showToast('클레임이 등록되었습니다.');
      } else {
        const idx = props.adminData.claims.findIndex(c => c.claimId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.claims[idx], { ...form, refundAmount: Number(form.refundAmount) });
        props.showToast('저장되었습니다.');
      }
      props.navigate('ecClaimMng');
    };

    return { isNew, form, errors, statusOptions, CLAIM_STEPS, currentStepIdx, save };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '클레임 등록' : '클레임 수정' }}</div>
  <div class="card">

    <!-- 클레임 진행 상태 흐름 -->
    <div v-if="!isNew" style="margin-bottom:20px;padding:16px;background:#f9f9f9;border-radius:10px;border:1px solid #e8e8e8;">
      <div style="font-size:11px;color:#888;margin-bottom:10px;">{{ form.type }} 처리 흐름</div>
      <div style="display:flex;align-items:center;overflow-x:auto;">
        <template v-for="(step, idx) in CLAIM_STEPS" :key="step">
          <div style="display:flex;flex-direction:column;align-items:center;min-width:80px;flex:1;">
            <div :style="{
              width:'30px', height:'30px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:'700', fontSize:'12px', marginBottom:'5px',
              background: idx < currentStepIdx ? '#e8587a' : idx === currentStepIdx ? '#e8587a' : '#e0e0e0',
              color: idx <= currentStepIdx ? '#fff' : '#999',
              boxShadow: idx === currentStepIdx ? '0 0 0 3px rgba(232,88,122,0.25)' : 'none',
            }">{{ idx + 1 }}</div>
            <div :style="{
              fontSize:'11px', fontWeight: idx === currentStepIdx ? '700' : '400',
              color: idx < currentStepIdx ? '#e8587a' : idx === currentStepIdx ? '#e8587a' : '#bbb',
              whiteSpace:'nowrap', textAlign:'center',
            }">{{ step }}</div>
          </div>
          <div v-if="idx < CLAIM_STEPS.length - 1"
            :style="{flex:'1', height:'2px', background: idx < currentStepIdx ? '#e8587a' : '#e0e0e0', minWidth:'14px', marginBottom:'15px'}"></div>
        </template>
      </div>
    </div>

    <!-- 기본정보 폼 -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">클레임ID <span class="req">*</span></label>
        <input class="form-control" v-model="form.claimId" placeholder="CLM-2026-XXX" :readonly="!isNew" :class="errors.claimId ? 'is-invalid' : ''" />
        <span v-if="errors.claimId" class="field-error">{{ errors.claimId }}</span>
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
        <label class="form-label">회원ID</label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input class="form-control" v-model="form.userId" placeholder="회원 ID" />
          <span v-if="form.userId" class="ref-link" @click="showRefModal('member', Number(form.userId))">보기</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">회원명</label>
        <input class="form-control" v-model="form.userName" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">클레임 유형</label>
        <select class="form-control" v-model="form.type">
          <option>취소</option><option>반품</option><option>교환</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">처리 상태</label>
        <select class="form-control" v-model="form.status">
          <option v-for="s in statusOptions" :key="s">{{ s }}</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">상품명</label>
      <input class="form-control" v-model="form.productName" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사유</label>
        <input class="form-control" v-model="form.reason" />
      </div>
      <div class="form-group">
        <label class="form-label">신청일</label>
        <input class="form-control" v-model="form.requestDate" placeholder="2026-04-08 10:00" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">상세 사유</label>
      <textarea class="form-control" v-model="form.reasonDetail" rows="3"></textarea>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('ecClaimMng')">취소</button>
    </div>

  </div>
  <div v-if="!isNew" class="card">
    <claim-hist :claim-id="form.claimId" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" />
  </div>
</div>
`
};
