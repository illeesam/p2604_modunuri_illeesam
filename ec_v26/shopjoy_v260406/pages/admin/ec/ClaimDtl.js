/* ShopJoy Admin - 클레임관리 상세/등록 */
window.ClaimDtl = {
  name: 'ClaimDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId'],
  setup(props) {
    const { reactive, computed, ref, onMounted } = Vue;
    const isNew = computed(() => !props.editId);
    const botTab = ref('items');

    const form = reactive({
      claimId: '', userId: '', userName: '', orderId: '', productName: '',
      type: '취소', status: '취소요청', reason: '', reasonDetail: '',
      refundAmount: 0, refundMethod: '계좌환불', requestDate: '', memo: '',
    });

    /* 클레임 항목 목록 (구성 상품별 클레임) */
    const claimItems = ref([]);
    let itemIdSeq = 1;

    /* CLAIM_STEPS: 유형별 진행 단계 */
    const CLAIM_STEPS = computed(() => ({
      '취소': ['취소요청', '취소처리중', '취소완료'],
      '반품': ['반품요청', '수거예정', '수거완료', '환불처리중', '환불완료'],
      '교환': ['교환요청', '수거예정', '수거완료', '발송완료', '교환완료'],
    }[form.type] || []));

    const currentStepIdx = computed(() => CLAIM_STEPS.value.indexOf(form.status));

    const statusOptions = computed(() => CLAIM_STEPS.value);

    const relatedOrder = computed(() => props.adminData.getOrder(form.orderId));
    const relatedDliv  = computed(() => props.adminData.deliveries.find(d => d.orderId === form.orderId) || null);

    onMounted(() => {
      if (!isNew.value) {
        const c = props.adminData.getClaim(props.editId);
        if (c) Object.assign(form, { ...c });
        // mock 클레임 항목 생성
        if (c) {
          claimItems.value = [
            {
              _id: itemIdSeq++,
              // 현재 (주문 당시)
              bfProductName: c.productName || '-', bfOptionName: '-',
              bfQty: 1, bfPrice: 0, bfStatus: '결제완료',
              // 변경요청
              chgProductName: '', chgOptionName: '',
              // 결과 (클레임 처리)
              afStatus: c.status, afMemo: '', afAdmin: '', afDate: '',
            },
          ];
        }
      }
    });

    /* 클레임 항목 CRUD */
    const addClaimItem = () => {
      claimItems.value.push({
        _id: itemIdSeq++,
        bfProductName: '', bfOptionName: '', bfQty: 1, bfPrice: 0, bfStatus: '결제완료',
        chgProductName: '', chgOptionName: '',
        afStatus: form.status, afMemo: '', afAdmin: '', afDate: '',
      });
    };
    const removeClaimItem = (id) => {
      const idx = claimItems.value.findIndex(r => r._id === id);
      if (idx !== -1) claimItems.value.splice(idx, 1);
    };

    const save = () => {
      if (!form.claimId || !form.orderId) { props.showToast('필수 항목을 입력해주세요.', 'error'); return; }
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

    return { isNew, botTab, form, statusOptions, CLAIM_STEPS, currentStepIdx, relatedOrder, relatedDliv, save, claimItems, addClaimItem, removeClaimItem };
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
        <input class="form-control" v-model="form.claimId" placeholder="CLM-2026-XXX" :readonly="!isNew" />
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

    <!-- 하단 탭 -->
    <template v-if="!isNew">
      <div class="tab-nav" style="margin-top:28px;">
        <button class="tab-btn" :class="{active:botTab==='items'}"   @click="botTab='items'">
          클레임 항목 <span class="tab-count">{{ claimItems.length }}</span>
        </button>
        <button class="tab-btn" :class="{active:botTab==='process'}" @click="botTab='process'">처리 정보</button>
        <button class="tab-btn" :class="{active:botTab==='order'}"   @click="botTab='order'">
          연관 주문 <span class="tab-count">{{ relatedOrder ? 1 : 0 }}</span>
        </button>
      </div>

      <!-- 클레임 항목 -->
      <div v-show="botTab==='items'">
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
          <button class="btn btn-sm btn-secondary" @click="addClaimItem">+ 항목 추가</button>
        </div>
        <div v-if="claimItems.length" style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:1000px;">
            <thead>
              <!-- 그룹 헤더 -->
              <tr>
                <th rowspan="2" style="border:1px solid #e0e0e0;padding:7px 10px;background:#f5f5f5;color:#888;text-align:center;vertical-align:middle;width:36px;">No</th>
                <!-- 현재 -->
                <th colspan="5" style="border:1px solid #e0e0e0;padding:7px 14px;background:#e6f4ff;color:#0958d9;font-weight:700;text-align:center;letter-spacing:0.5px;">
                  현재
                </th>
                <!-- 변경요청 -->
                <th colspan="2" style="border:1px solid #e0e0e0;padding:7px 14px;background:#f6ffed;color:#389e0d;font-weight:700;text-align:center;letter-spacing:0.5px;">
                  변경요청
                </th>
                <!-- 결과 -->
                <th colspan="4" style="border:1px solid #e0e0e0;padding:7px 14px;background:#fff0f6;color:#c41d7f;font-weight:700;text-align:center;letter-spacing:0.5px;">
                  결과
                </th>
                <th rowspan="2" style="border:1px solid #e0e0e0;padding:7px;background:#f5f5f5;text-align:center;vertical-align:middle;width:50px;">삭제</th>
              </tr>
              <!-- 컬럼 헤더 -->
              <tr>
                <!-- 현재 -->
                <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f0f9ff;color:#1677ff;font-weight:600;white-space:nowrap;">상품명</th>
                <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f0f9ff;color:#1677ff;font-weight:600;white-space:nowrap;">옵션</th>
                <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f0f9ff;color:#1677ff;font-weight:600;white-space:nowrap;width:60px;">수량</th>
                <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f0f9ff;color:#1677ff;font-weight:600;white-space:nowrap;width:90px;">금액</th>
                <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f0f9ff;color:#1677ff;font-weight:600;white-space:nowrap;width:80px;">상태</th>
                <!-- 변경요청 -->
                <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f6ffed;color:#389e0d;font-weight:600;white-space:nowrap;">상품명</th>
                <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f6ffed;color:#389e0d;font-weight:600;white-space:nowrap;">옵션</th>
                <!-- 결과 -->
                <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#fff0f6;color:#9e1068;font-weight:600;white-space:nowrap;width:90px;">처리상태</th>
                <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#fff0f6;color:#9e1068;font-weight:600;white-space:nowrap;">메모</th>
                <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#fff0f6;color:#9e1068;font-weight:600;white-space:nowrap;width:80px;">처리자</th>
                <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#fff0f6;color:#9e1068;font-weight:600;white-space:nowrap;width:130px;">처리일시</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in claimItems" :key="item._id">
                <td style="border:1px solid #e0e0e0;padding:6px;text-align:center;color:#aaa;">{{ idx + 1 }}</td>
                <!-- 현재 -->
                <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#f8fbff;">
                  <input class="form-control" v-model="item.bfProductName" style="font-size:12px;background:transparent;border-color:#91caff;" />
                </td>
                <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#f8fbff;">
                  <input class="form-control" v-model="item.bfOptionName" style="font-size:12px;background:transparent;border-color:#91caff;" />
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
                <!-- 변경요청 -->
                <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#f6ffed;">
                  <input class="form-control" v-model="item.chgProductName" placeholder="변경 후 상품명" style="font-size:12px;background:transparent;border-color:#95de64;" />
                </td>
                <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#f6ffed;">
                  <input class="form-control" v-model="item.chgOptionName" placeholder="변경 후 옵션" style="font-size:12px;background:transparent;border-color:#95de64;" />
                </td>
                <!-- 결과 -->
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
      <div v-show="botTab==='process'">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">환불금액</label>
            <input class="form-control" type="number" v-model.number="form.refundAmount" />
          </div>
          <div class="form-group">
            <label class="form-label">환불방법</label>
            <select class="form-control" v-model="form.refundMethod">
              <option>계좌환불</option><option>카드취소</option><option>캐쉬환불</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">처리 메모</label>
          <textarea class="form-control" v-model="form.memo" rows="4"></textarea>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" @click="save">저장</button>
          <button class="btn btn-secondary" @click="navigate('ecClaimMng')">취소</button>
        </div>
      </div>

      <!-- 연관 주문 -->
      <div v-show="botTab==='order'">
        <template v-if="relatedOrder">
          <div style="margin-bottom:12px;padding:14px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                <div style="font-size:14px;font-weight:700;margin-bottom:6px;">
                  <span class="ref-link" @click="showRefModal('order', relatedOrder.orderId)">{{ relatedOrder.orderId }}</span>
                </div>
                <div style="font-size:13px;color:#555;line-height:2;">
                  <span style="color:#888;">회원</span>
                  <span class="ref-link" style="margin:0 6px;" @click="showRefModal('member', relatedOrder.userId)">{{ relatedOrder.userName }}</span>
                  <span style="color:#888;">주문일</span> <b style="margin-left:4px;">{{ relatedOrder.orderDate }}</b><br/>
                  <span style="color:#888;">상품</span> <b style="margin-left:4px;">{{ relatedOrder.productName }}</b><br/>
                  <span style="color:#888;">금액</span> <b style="margin-left:4px;color:#e8587a;">{{ relatedOrder.totalPrice.toLocaleString() }}원</b>
                  &nbsp;·&nbsp;<span style="color:#888;">결제</span> <b style="margin-left:4px;">{{ relatedOrder.payMethod }}</b><br/>
                  <span style="color:#888;">상태</span> <span class="badge badge-blue" style="margin-left:4px;">{{ relatedOrder.status }}</span>
                </div>
              </div>
              <button class="btn btn-blue btn-sm" @click="navigate('ecOrderDtl',{id:relatedOrder.orderId})">주문 수정</button>
            </div>
          </div>
          <template v-if="relatedDliv">
            <div style="padding:12px 14px;background:#f0f7ff;border-radius:8px;border:1px solid #bae0ff;font-size:13px;">
              <div style="font-weight:600;color:#1677ff;margin-bottom:6px;">배송 정보</div>
              <div style="line-height:2;color:#444;">
                <span style="color:#888;">수령인</span> <b style="margin-left:4px;">{{ relatedDliv.receiver }}</b>
                &nbsp;·&nbsp;<span style="color:#888;">배송지</span> <b style="margin-left:4px;">{{ relatedDliv.address }}</b><br/>
                <span style="color:#888;">택배사</span> <b style="margin-left:4px;">{{ relatedDliv.courier }}</b>
                &nbsp;·&nbsp;<span style="color:#888;">운송장</span> <b style="margin-left:4px;">{{ relatedDliv.trackingNo || '-' }}</b>
                &nbsp;·&nbsp;<span class="badge badge-green">{{ relatedDliv.status }}</span>
              </div>
              <button class="btn btn-secondary btn-sm" style="margin-top:8px;" @click="navigate('ecDlivDtl',{id:relatedDliv.dlivId})">배송 수정</button>
            </div>
          </template>
        </template>
        <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">연관 주문 정보가 없습니다.</div>
      </div>
    </template>

  </div>
</div>
`
};
