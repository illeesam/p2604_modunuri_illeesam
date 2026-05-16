/* ShopJoy BO - 공용 모달 모음
   -----------------------------------------------------------------------
   여기에 등록하는 모달은 어디서든 <bo-xxx-modal /> 태그로 사용 가능.

   현재 등록된 모달:
     - BoRefModal      — 회원/상품/주문/클레임/쿠폰 참조 상세 (showRefModal 헬퍼가 호출)
     - BoCodeGrpModal  — 공통코드 그룹 미리보기 (codeGrp 으로 코드 항목 조회)

   추가 시: 파일 끝에 window.BoXxxModal 등록 + bo.html 에 본 파일이 로드되면 됨.
   -----------------------------------------------------------------------
*/

/* ── BoRefModal ──────────────────────────────────────────────
 * 공통 참조 모달 (회원/상품/주문/클레임/쿠폰).
 *
 * [공통 props: reloadTrigger]
 * 모달이 마운트된 상태에서 부모가 "다시 조회" 신호를 보낼 때:
 *   부모: const modal = reactive({ show:false, reloadTrigger:0 });
 *         refresh() { modal.reloadTrigger++; }
 *   모달 내부: watch(() => props.reloadTrigger, () => handleSearchData());
 * ──────────────────────────────────────────────────────────── */
window.BoRefModal = {
  name: 'BoRefModal',
  props: {
    state:         { type: Object, default: () => ({}) }, // 공유 상태
    reloadTrigger: { type: Number, default: 0 }, // 재조회 트리거
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { reactive, watch } = Vue;

    /* close */
    const close = () => emit('close');
    const s = props.state;

    /* -- 각 타입별 데이터 -- */
    const member = reactive({});
    const product = reactive({});
    const order = reactive({});
    const claim = reactive({});
    const coupon = reactive({});

    const API_MAP = {
      member:  (id) => boApiSvc.mbMember.getById(id, '회원상세', '상세조회'),
      product: (id) => boApiSvc.pdProd.getById(id, '상품상세', '상세조회'),
      order:   (id) => boApiSvc.odOrder.getById(id, '주문상세', '상세조회'),
      claim:   (id) => boApiSvc.odClaim.getById(id, '클레임상세', '상세조회'),
      coupon:  (id) => boApiSvc.pmCoupon.getById(id, '쿠폰상세', '상세조회'),
    };
    const DATA_MAP = { member, product, order, claim, coupon };

    watch(() => [s.type, s.id], async ([type, id]) => {
      Object.values(DATA_MAP).forEach(obj => { Object.keys(obj).forEach(k => delete obj[k]); });
      if (!type || !id || !API_MAP[type]) return;
      try {
        const res = await API_MAP[type](id);
        if (res.data?.data) Object.assign(DATA_MAP[type], res.data.data);
      } catch (_) {}
    }, { immediate: true });

    /* badgeCls */
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

    return { close, member, product, order, claim, coupon, badgeCls, s };
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
      <template v-if="member.userId">
        <div class="detail-row"><span class="detail-label">회원ID</span><span class="detail-value">{{ member.userId }}</span></div>
        <div class="detail-row"><span class="detail-label">이름</span><span class="detail-value">{{ member.memberNm }}</span></div>
        <div class="detail-row"><span class="detail-label">이메일</span><span class="detail-value">{{ member.email }}</span></div>
        <div class="detail-row"><span class="detail-label">연락처</span><span class="detail-value">{{ member.phone }}</span></div>
        <div class="detail-row"><span class="detail-label">등급</span><span class="detail-value"><span class="badge badge-purple">{{ member.gradeCd }}</span></span></div>
        <div class="detail-row"><span class="detail-label">상태</span><span class="detail-value"><span class="badge" :class="badgeCls(member.statusCd)">{{ member.statusCd }}</span></span></div>
        <div class="detail-row"><span class="detail-label">가입일</span><span class="detail-value">{{ member.joinDate }}</span></div>
        <div class="detail-row"><span class="detail-label">최근 로그인</span><span class="detail-value">{{ member.lastLogin }}</span></div>
        <div class="detail-row"><span class="detail-label">주문수</span><span class="detail-value">{{ member.orderCount }}건</span></div>
        <div class="detail-row"><span class="detail-label">총 구매액</span><span class="detail-value">{{ member.totalPurchase.toLocaleString() }}원</span></div>
      </template>
      <div v-else style="color:#999;text-align:center;padding:20px;">회원 정보를 찾을 수 없습니다.</div>
    </template>

    <!-- 상품 -->
    <template v-else-if="s.type==='product'">
      <template v-if="product.productId">
        <div class="detail-row"><span class="detail-label">상품ID</span><span class="detail-value">{{ product.productId }}</span></div>
        <div class="detail-row"><span class="detail-label">상품명</span><span class="detail-value">{{ product.prodNm }}</span></div>
        <div class="detail-row"><span class="detail-label">카테고리</span><span class="detail-value">{{ product.category }}</span></div>
        <div class="detail-row"><span class="detail-label">가격</span><span class="detail-value">{{ product.price.toLocaleString() }}원</span></div>
        <div class="detail-row"><span class="detail-label">재고</span><span class="detail-value">{{ product.stock }}개</span></div>
        <div class="detail-row"><span class="detail-label">브랜드</span><span class="detail-value">{{ product.brand }}</span></div>
        <div class="detail-row"><span class="detail-label">상태</span><span class="detail-value"><span class="badge" :class="badgeCls(product.statusCd)">{{ product.statusCd }}</span></span></div>
        <div class="detail-row"><span class="detail-label">등록일</span><span class="detail-value">{{ product.regDate }}</span></div>
      </template>
      <div v-else style="color:#999;text-align:center;padding:20px;">상품 정보를 찾을 수 없습니다.</div>
    </template>

    <!-- 주문 -->
    <template v-else-if="s.type==='order'">
      <template v-if="order.orderId">
        <div class="detail-row"><span class="detail-label">주문ID</span><span class="detail-value">{{ order.orderId }}</span></div>
        <div class="detail-row"><span class="detail-label">회원</span><span class="detail-value">{{ order.userNm }} (ID: {{ order.userId }})</span></div>
        <div class="detail-row"><span class="detail-label">주문일시</span><span class="detail-value">{{ order.orderDate }}</span></div>
        <div class="detail-row"><span class="detail-label">상품</span><span class="detail-value">{{ order.prodNm }}</span></div>
        <div class="detail-row"><span class="detail-label">결제금액</span><span class="detail-value">{{ order.totalPrice.toLocaleString() }}원</span></div>
        <div class="detail-row"><span class="detail-label">결제수단</span><span class="detail-value">{{ order.payMethodCd }}</span></div>
        <div class="detail-row"><span class="detail-label">상태</span><span class="detail-value"><span class="badge" :class="badgeCls(order.statusCd)">{{ order.statusCd }}</span></span></div>
      </template>
      <div v-else style="color:#999;text-align:center;padding:20px;">주문 정보를 찾을 수 없습니다.</div>
    </template>

    <!-- 클레임 -->
    <template v-else-if="s.type==='claim'">
      <template v-if="claim.claimId">
        <div class="detail-row"><span class="detail-label">클레임ID</span><span class="detail-value">{{ claim.claimId }}</span></div>
        <div class="detail-row"><span class="detail-label">회원</span><span class="detail-value">{{ claim.userNm }}</span></div>
        <div class="detail-row"><span class="detail-label">주문ID</span><span class="detail-value">{{ claim.orderId }}</span></div>
        <div class="detail-row"><span class="detail-label">유형</span><span class="detail-value"><span class="badge badge-orange">{{ claim.type }}</span></span></div>
        <div class="detail-row"><span class="detail-label">상태</span><span class="detail-value"><span class="badge" :class="badgeCls(claim.statusCd)">{{ claim.statusCd }}</span></span></div>
        <div class="detail-row"><span class="detail-label">상품명</span><span class="detail-value">{{ claim.prodNm }}</span></div>
        <div class="detail-row"><span class="detail-label">사유</span><span class="detail-value">{{ claim.reasonCd }}</span></div>
        <div class="detail-row"><span class="detail-label">신청일</span><span class="detail-value">{{ claim.requestDate }}</span></div>
        <div class="detail-row" v-if="claim.refundAmount"><span class="detail-label">환불금액</span><span class="detail-value">{{ claim.refundAmount.toLocaleString() }}원</span></div>
      </template>
      <div v-else style="color:#999;text-align:center;padding:20px;">클레임 정보를 찾을 수 없습니다.</div>
    </template>

    <!-- 쿠폰 -->
    <template v-else-if="s.type==='coupon'">
      <template v-if="coupon.couponId">
        <div class="detail-row"><span class="detail-label">쿠폰ID</span><span class="detail-value">{{ coupon.couponId }}</span></div>
        <div class="detail-row"><span class="detail-label">쿠폰명</span><span class="detail-value">{{ coupon.name }}</span></div>
        <div class="detail-row"><span class="detail-label">코드</span><span class="detail-value">{{ coupon.code }}</span></div>
        <div class="detail-row"><span class="detail-label">할인</span><span class="detail-value">{{ coupon.discountTypeCd==='rate'?coupon.discountValue+'%':coupon.discountTypeCd==='shipping'?'무료배송':coupon.discountValue.toLocaleString()+'원' }}</span></div>
        <div class="detail-row"><span class="detail-label">최소주문</span><span class="detail-value">{{ coupon.minOrder ? coupon.minOrder.toLocaleString()+'원 이상' : '제한없음' }}</span></div>
        <div class="detail-row"><span class="detail-label">발급대상</span><span class="detail-value">{{ coupon.issueTo }}</span></div>
        <div class="detail-row"><span class="detail-label">만료일</span><span class="detail-value">{{ coupon.expiry }}</span></div>
        <div class="detail-row"><span class="detail-label">상태</span><span class="detail-value"><span class="badge" :class="badgeCls(coupon.statusCd)">{{ coupon.statusCd }}</span></span></div>
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

/* ── BoCodeGrpModal ──────────────────────────────────────────
 * 공통코드 그룹 미리보기 모달.
 *
 * Props:
 *   show     (Boolean)  — 모달 노출 여부
 *   codeGrp  (String)   — 조회할 코드 그룹 (예: 'PROD_OPT_CATEGORY')
 *   title    (String)   — 헤더 타이틀 (선택, 미설정 시 codeGrp 사용)
 *
 * Emits:
 *   close             — 닫기 버튼/배경 클릭
 *   select(codeRow)   — 행 더블클릭 시 코드 선택 (선택 사용 시)
 *
 * 사용:
 *   <bo-code-grp-modal :show="codeModal.show" :code-grp="codeModal.grp"
 *                      :title="'옵션 카테고리 코드'"
 *                      @close="codeModal.show=false" @select="onCodePick" />
 * ──────────────────────────────────────────────────────────── */
window.BoCodeGrpModal = {
  name: 'BoCodeGrpModal',
  props: {
    show:    { type: Boolean, default: false },
    codeGrp: { type: String,  default: '' },
    title:   { type: String,  default: '' },
  },
  emits: ['close', 'select'],
  setup(props, { emit }) {
    const { ref, computed, watch } = Vue;
    const codes = ref([]);
    const loading = ref(false);
    const error = ref('');
    const tab = ref('list'); // 'list' | 'tree'

    /* 원본 row 키(codeVal/codeNm/codeSortOrd/codeLevel/parentCodeValue) → 화면용 정규화 */
    const fnNorm = (c) => ({
      codeId:          c.codeId,
      codeValue:       c.codeVal ?? c.codeValue ?? '',
      codeLabel:       c.codeNm  ?? c.codeLabel ?? c.codeVal ?? '',
      codeLevel:       Number(c.codeLevel ?? 1),
      parentCodeValue: c.parentCodeValue ?? null,
      sortOrd:         Number(c.codeSortOrd ?? c.sortOrd ?? 0),
      useYn:           c.useYn ?? 'Y',
      codeRemark:      c.codeRemark ?? '',
    });

    /* fnLoad */
    const fnLoad = async () => {
      if (!props.codeGrp) { codes.value = []; return; }
      loading.value = true;
      error.value = '';
      try {
        /* 1차: 클라이언트 코드 스토어에서 시도 (네트워크 0회) */
        const store = window.sfGetBoCodeStore?.();
        const local = store?.sgGetCodesByGroup?.(props.codeGrp);
        if (Array.isArray(local) && local.length) {
          codes.value = local.map(fnNorm).sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
          return;
        }
        /* 2차: API 직접 조회 */
        const res = await window.coApiSvc.syCode.getGrpCodes(props.codeGrp, '공통코드', '코드그룹조회');
        const list = res?.data?.data?.pageList || res?.data?.data || [];
        codes.value = (Array.isArray(list) ? list : []).map(fnNorm).sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
      } catch (err) {
        console.error('[BoCodeGrpModal:fnLoad]', err);
        error.value = err.message || '코드 조회 실패';
      } finally {
        loading.value = false;
      }
    };

    /* show=true 또는 codeGrp 변경 시 자동 로드 */
    watch(() => [props.show, props.codeGrp], ([show]) => {
      if (show) { tab.value = 'list'; fnLoad(); }
    }, { immediate: true });

    /* 트리 빌드: parentCodeValue 로 부모-자식 연결 */
    const cfTree = computed(() => {
      const all = codes.value || [];
      if (!all.length) return [];
      const byParent = new Map();
      all.forEach(c => {
        const p = c.parentCodeValue || '';
        if (!byParent.has(p)) byParent.set(p, []);
        byParent.get(p).push(c);
      });
      const known = new Set(all.map(c => c.codeValue));

      /* buildChildren */
      const buildChildren = (parentVal) => {
        const list = byParent.get(parentVal) || [];
        return list
          .slice()
          .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
          .map(c => ({ ...c, children: buildChildren(c.codeValue) }));
      };
      // 루트: parentCodeValue 가 없거나, 부모가 같은 그룹 안에 존재하지 않는 항목
      const roots = all.filter(c => !c.parentCodeValue || !known.has(c.parentCodeValue));
      return roots
        .slice()
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(r => ({ ...r, children: buildChildren(r.codeValue) }));
    });

    const cfHasTree = computed(() => codes.value.some(c => Number(c.codeLevel || 1) > 1 || c.parentCodeValue));

    /* onClose */
    const onClose  = () => emit('close');

    /* onSelect */
    const onSelect = (row) => emit('select', row);

    return { codes, loading, error, tab, cfTree, cfHasTree, onClose, onSelect };
  },
  template: /* html */`
<div v-if="show"
  style="position:fixed;inset:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(2px);z-index:1500;display:flex;align-items:center;justify-content:center;"
  @click.self="onClose">
  <div class="modal-box" style="background:#fff;border-radius:16px;width:960px;max-width:94vw;max-height:84vh;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden;">
    <!-- 헤더 -->
    <div class="tree-modal-header" style="padding:14px 20px;border-bottom:1px solid #f0e0e7;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#fff0f4,#ffe4ec,#ffd5e1);">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:14px;font-weight:700;color:#222;">{{ title || '공통코드 미리보기' }}</span>
        <code style="font-size:11px;background:#fff;color:#6a1b9a;padding:2px 8px;border-radius:4px;border:1px solid #e1bee7;font-family:monospace;">{{ codeGrp }}</code>
      </div>
      <button @click="onClose" style="border:none;background:transparent;color:#888;font-size:18px;cursor:pointer;">✕</button>
    </div>

    <!-- 탭 바 -->
    <div style="display:flex;gap:0;border-bottom:1px solid #eee;background:#fafafa;padding:0 14px;">
      <button type="button" @click="tab='list'"
        :style="(tab==='list'
          ? 'border:none;background:#fff;border-top:2px solid #ec4899;color:#222;font-weight:700;'
          : 'border:none;background:transparent;color:#888;font-weight:500;')
          + 'padding:10px 16px;font-size:13px;cursor:pointer;border-radius:6px 6px 0 0;'"
        >📋 일반 코드목록</button>
      <button type="button" @click="tab='tree'"
        :style="(tab==='tree'
          ? 'border:none;background:#fff;border-top:2px solid #ec4899;color:#222;font-weight:700;'
          : 'border:none;background:transparent;color:#888;font-weight:500;')
          + 'padding:10px 16px;font-size:13px;cursor:pointer;border-radius:6px 6px 0 0;'"
        >🌲 트리목록 <span v-if="!cfHasTree" style="font-size:10px;color:#bbb;margin-left:4px;">(단층)</span></button>
    </div>

    <!-- 본문 -->
    <div style="padding:14px 20px;overflow-y:auto;flex:1;">
      <div v-if="loading" style="padding:32px;text-align:center;color:#999;font-size:13px;">불러오는 중...</div>
      <div v-else-if="error" style="padding:24px;text-align:center;color:#d32f2f;font-size:13px;">{{ error }}</div>
      <div v-else-if="!codes.length" style="padding:32px;text-align:center;color:#aaa;font-size:13px;">등록된 코드가 없습니다.</div>

      <!-- ── 일반 코드목록 ── -->
      <table v-else-if="tab==='list'" class="bo-table" style="width:100%;font-size:12px;">
        <thead>
          <tr>
            <th style="width:36px;text-align:center;">번호</th>
            <th style="width:120px;">코드ID</th>
            <th style="width:160px;">코드값</th>
            <th>코드명</th>
            <th style="width:60px;text-align:center;">레벨</th>
            <th style="width:140px;">부모코드값</th>
            <th style="width:60px;text-align:right;">정렬</th>
            <th style="width:50px;text-align:center;">사용</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in codes" :key="(row && (row.codeId || row.codeValue)) || idx"
              @dblclick="onSelect(row)" style="cursor:pointer;"
              title="더블클릭하여 선택">
            <td style="text-align:center;color:#999;">{{ idx + 1 }}</td>
            <td><code style="background:#f3e5f5;padding:2px 6px;border-radius:4px;font-family:monospace;color:#6a1b9a;font-size:11px;">{{ row.codeId }}</code></td>
            <td><code style="background:#f5f5f7;padding:2px 6px;border-radius:4px;font-family:monospace;color:#1565c0;">{{ row.codeValue }}</code></td>
            <td>{{ row.codeLabel }}</td>
            <td style="text-align:center;">
              <span class="badge" :class="row.codeLevel===1?'badge-blue':row.codeLevel===2?'badge-green':'badge-orange'" style="font-size:10px;">L{{ row.codeLevel }}</span>
            </td>
            <td>
              <code v-if="row.parentCodeValue" style="background:#fafafa;padding:2px 6px;border-radius:4px;font-family:monospace;color:#888;font-size:11px;">{{ row.parentCodeValue }}</code>
              <span v-else style="color:#ccc;">-</span>
            </td>
            <td style="text-align:right;color:#666;">{{ row.sortOrd != null ? row.sortOrd : '-' }}</td>
            <td style="text-align:center;">
              <span :class="['badge', row.useYn==='Y' ? 'badge-green' : 'badge-gray']" style="font-size:10px;">{{ row.useYn || '-' }}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- ── 트리목록 ── -->
      <div v-else-if="tab==='tree'" style="font-size:12px;">
        <div v-if="!cfTree.length" style="padding:32px;text-align:center;color:#aaa;">표시할 트리가 없습니다.</div>
        <ul v-else style="list-style:none;padding-left:0;margin:0;">
          <bo-code-grp-tree-node v-for="node in cfTree" :key="node.codeId || node.codeValue"
            :node="node" :depth="0" @select="onSelect" />
        </ul>
      </div>
    </div>

    <!-- 푸터 -->
    <div style="padding:12px 20px;border-top:1px solid #f0f0f0;background:#fafafa;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:11px;color:#888;">총 {{ codes.length }}건 · 행 더블클릭 시 선택</span>
      <button class="btn btn-secondary btn-sm" @click="onClose">닫기</button>
    </div>
  </div>
</div>`
};

/* ── BoCodeGrpTreeNode (재귀 노드 컴포넌트) ───────────────────── */
window.BoCodeGrpTreeNode = {
  name: 'BoCodeGrpTreeNode',
  props: {
    node:  { type: Object, required: true },
    depth: { type: Number, default: 0 },
  },
  emits: ['select'],
  setup(props, { emit }) {
    const { ref } = Vue;
    const open = ref(true);

    /* onSelect */
    const onSelect = (n) => emit('select', n);

    /* toggle */
    const toggle = () => { open.value = !open.value; };
    return { open, toggle, onSelect };
  },
  template: /* html */`
<li :style="'margin:0;padding:0;'">
  <div @dblclick="onSelect(node)"
       :style="'display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:6px;cursor:pointer;'
               + (depth%2===0 ? '' : 'background:#fafbfc;')
               + 'border-left:3px solid '+(node.codeLevel===1?'#1677ff':node.codeLevel===2?'#22c55e':'#f59e0b')+';'
               + 'margin-left:'+(depth*16)+'px;'"
       title="더블클릭하여 선택">
    <button v-if="node.children && node.children.length"
      type="button" @click.stop="toggle"
      style="border:none;background:transparent;cursor:pointer;font-size:11px;color:#666;width:16px;">
      {{ open ? '▼' : '▶' }}
    </button>
    <span v-else style="display:inline-block;width:16px;color:#ddd;font-size:11px;text-align:center;">·</span>
    <span class="badge" :class="node.codeLevel===1?'badge-blue':node.codeLevel===2?'badge-green':'badge-orange'" style="font-size:10px;flex-shrink:0;">L{{ node.codeLevel }}</span>
    <code style="background:#f3e5f5;padding:1px 6px;border-radius:4px;font-family:monospace;color:#6a1b9a;font-size:11px;flex-shrink:0;">{{ node.codeId }}</code>
    <code style="background:#f5f5f7;padding:1px 6px;border-radius:4px;font-family:monospace;color:#1565c0;flex-shrink:0;">{{ node.codeValue }}</code>
    <span style="flex:1;">{{ node.codeLabel }}</span>
    <span style="color:#888;font-size:11px;flex-shrink:0;">정렬 {{ node.sortOrd }}</span>
    <span :class="['badge', node.useYn==='Y' ? 'badge-green' : 'badge-gray']" style="font-size:10px;flex-shrink:0;">{{ node.useYn || '-' }}</span>
  </div>
  <ul v-if="open && node.children && node.children.length" style="list-style:none;padding-left:0;margin:0;">
    <bo-code-grp-tree-node v-for="child in node.children" :key="child.codeId || child.codeValue"
      :node="child" :depth="depth+1" @select="onSelect" />
  </ul>
</li>`
};
