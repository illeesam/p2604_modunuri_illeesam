/* ShopJoy - Cart */
window.Cart = {
  name: 'Cart',
  props: {
    navigate:       { type: Function, required: true },                    // 페이지 이동
  },
  emits: [],
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { computed, reactive, onMounted } = Vue;
    const showConfirm    = window.foApp.showConfirm;     // 확인 모달
    const clearCart      = window.foApp.clearCart;       // 장바구니 비우기
    const removeFromCart = window.foApp.removeFromCart;  // 장바구니 삭제
    const updateCartQty  = window.foApp.updateCartQty;   // 장바구니 수량변경
    const cart           = window.foApp.cart;            // 장바구니 목록 (전역)

    const uiState = reactive({                           // UI 상태
      loading: false, error: null, isPageCodeLoad: false,
      checkedIdxs: new Set(), sortKey: '', sortDir: 'asc',
    });


    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ Cart.js : handleBtnAction -> ', cmd, param);
      // 전체 선택/해제 토글
      if (cmd === 'cart-toggleAll') {
        return toggleAll();
      // 장바구니 전체 비우기
      } else if (cmd === 'cart-clearAll') {
        return handleClearAll();
      // 정렬 (상품명/가격)
      } else if (cmd === 'cart-sort') {
        return onCartSort(param);
      // 주문하기 (체크된 항목 또는 전체)
      } else if (cmd === 'summary-goOrder') {
        return goOrder();
      // 홈으로 이동
      } else if (cmd === 'page-goHome') {
        return props.navigate('home');
      // 상품목록으로 이동
      } else if (cmd === 'page-goProdList') {
        return props.navigate('prodList');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ Cart.js : handleSelectAction -> ', cmd, param);
      // 행 체크 토글
      if (cmd === 'cart-rowToggle') {
        return toggleCheck(param);
      // 행 수량 증감 ({ idx, delta })
      } else if (cmd === 'cart-rowQty') {
        return updateCartQty(param.idx, param.delta);
      // 행 삭제
      } else if (cmd === 'cart-rowRemove') {
        return removeItem(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, () => { uiState.isPageCodeLoad = true; });

    // ★ onMounted
    onMounted(() => { if (isAppReady.value) { uiState.isPageCodeLoad = true; } });

    /* onCartSort — 정렬 토글 */
    const onCartSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') { uiState.sortDir = 'desc'; }
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
    };

    /* isChecked — 체크 여부 확인 */
    const isChecked = (idx) => uiState.checkedIdxs.has(idx);

    /* toggleCheck — 행 체크 토글 */
    const toggleCheck = (idx) => {
      if (uiState.checkedIdxs.has(idx)) { uiState.checkedIdxs.delete(idx); }
      else { uiState.checkedIdxs.add(idx); }
    };

    /* toggleAll — 전체 체크 토글 */
    const toggleAll = () => {
      if (cfAllChecked.value) {
        uiState.checkedIdxs.clear();
      } else {
        uiState.checkedIdxs.clear();
        cart.forEach((_, i) => uiState.checkedIdxs.add(i));
      }
    };

    /* removeItem — 행 제거 (체크된 인덱스 정합 유지) */
    const removeItem = (idx) => {
      removeFromCart(idx);
      const newSet = new Set();
      uiState.checkedIdxs.forEach(i => {
        if (i < idx) { newSet.add(i); }
        else if (i > idx) { newSet.add(i - 1); }
      });
      uiState.checkedIdxs.clear();
      newSet.forEach(i => uiState.checkedIdxs.add(i));
    };

    /* goOrder — 주문 페이지로 이동 */
    const goOrder = () => {
      if (uiState.checkedIdxs.size === 0) {
        props.navigate('order');
      } else {
        const ids = [...uiState.checkedIdxs].sort().map(i => cart[i].cartId);
        props.navigate('order', { cartIds: ids });
      }
    };

    /* handleClearAll — 장바구니 비우기 */
    const handleClearAll = async () => {
      const ok = await showConfirm('장바구니 비우기', '장바구니의 모든 상품을 삭제하시겠습니까?', 'warning');
      if (ok) { clearCart(); uiState.checkedIdxs.clear(); }
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    /* parsePrice — 가격 문자열 → 숫자 */
    function parsePrice(priceStr) {
      if (!priceStr) { return 0; }
      const m = priceStr.replace(/[^0-9]/g, '');
      return m ? parseInt(m, 10) : 0;
    }

    /* formatPrice — 가격 × 수량 포맷팅 */
    function formatPrice(priceStr, qty) {
      const base = parsePrice(priceStr);
      if (!base) { return priceStr; }
      return (base * (qty || 1)).toLocaleString('ko-KR') + '원';
    }

    /* cartSortIcon — 정렬 아이콘 */
    const cartSortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    const cfSortedCart = computed(() => {
      const list = [...(cart || [])].map((item, i) => ({ ...item, _origIdx: i }));
      if (!uiState.sortKey) { return list; }
      return list.sort((a, b) => {
        let va, vb;
        if (uiState.sortKey === 'nm') {
          va = a.prod?.prodNm || ''; vb = b.prod?.prodNm || '';
          return uiState.sortDir === 'asc' ? va.localeCompare(vb, 'ko') : vb.localeCompare(va, 'ko');
        }
        if (uiState.sortKey === 'price') {
          va = parsePrice(a.prod?.price) * a.qty; vb = parsePrice(b.prod?.price) * b.qty;
          return uiState.sortDir === 'asc' ? va - vb : vb - va;
        }
        return 0;
      });
    });

    const cfAllChecked = computed(() => cart.length > 0 && uiState.checkedIdxs.size === cart.length);
    const cfSomeChecked = computed(() => uiState.checkedIdxs.size > 0 && uiState.checkedIdxs.size < cart.length);

    /* 요약 패널: 체크된 항목(없으면 전체) 기준 */
    const cfSummaryItems = computed(() =>
      uiState.checkedIdxs.size > 0
        ? [...uiState.checkedIdxs].sort().map(i => cart[i])
        : (cart || [])
    );

    const cfTotalPrice = computed(() =>
      cfSummaryItems.value.reduce((s, item) => s + parsePrice(item.prod?.price) * item.qty, 0)
    );

    const cfTotalPriceStr = computed(() =>
      cfTotalPrice.value ? cfTotalPrice.value.toLocaleString('ko-KR') + '원' : '-'
    );

    const cfOrderCount = computed(() =>
      uiState.checkedIdxs.size > 0 ? uiState.checkedIdxs.size : cart.length
    );

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      uiState, cart,       // 상태 / 데이터
      handleBtnAction, handleSelectAction, // dispatch
      cfSortedCart, cfAllChecked, cfSomeChecked, // computed - 목록
      cfSummaryItems, cfTotalPriceStr, cfOrderCount, // computed - 요약
      isChecked, cartSortIcon, formatPrice, // 헬퍼
    };
  },
  template: /* html */ `
<fo-page title="Cart" eyebrow="Shopping"
  banner-img="assets/cdn/prod/img/page-title/page-title-1.jpg"
  banner-align="center 60%"
  :crumbs="[{ label: '홈', page: 'home' }, { label: '장바구니' }]"
  @nav="() => handleBtnAction('page-goHome')">
  <!-- ===== ■. 빈 장바구니 ================================================== -->
  <div v-if="cart.length===0" style="text-align:center;padding:80px 20px;">
    <div style="font-size:4rem;margin-bottom:20px;">
      🛒
    </div>
    <p style="color:var(--text-muted);font-size:1rem;margin-bottom:24px;">
      장바구니가 비어 있어요
    </p>
    <button class="btn-blue" @click="handleBtnAction('page-goProdList')" style="padding:12px 28px;">
      쇼핑하러 가기
    </button>
  </div>
  <!-- ===== □. 빈 장바구니 ================================================== -->
  <!-- ===== ■. 장바구니 목록 ================================================= -->
  <template v-else>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:clamp(12px,2vw,24px);align-items:start;" class="order-grid">
      <!-- ===== ■.■.■. 왼쪽: 상품 목록 =========================================== -->
      <div>
        <fo-container card-style="padding:0;overflow:hidden;margin-bottom:16px;">
          <!-- ===== ■.■.■.■.■. 전체 선택/삭제 + 정렬 헤더 ================================ -->
          <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;">
              <input type="checkbox" :checked="cfAllChecked" :indeterminate.prop="cfSomeChecked"
                @change="handleBtnAction('cart-toggleAll')"
                style="width:17px;height:17px;cursor:pointer;accent-color:var(--blue);" />
              <span style="font-weight:700;font-size:0.9rem;color:var(--text-primary);">
                전체 선택
                <span v-if="uiState.checkedIdxs.size>0" style="font-weight:400;color:var(--blue);font-size:0.82rem;">
                  ({{ uiState.checkedIdxs.size }}개 선택됨)
                </span>
                <span v-else style="font-weight:400;color:var(--text-muted);font-size:0.82rem;">
                  (총 {{ cart.length }}개)
                </span>
              </span>
            </label>
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-size:0.75rem;color:var(--text-muted);">
                정렬:
              </span>
              <button @click="handleBtnAction('cart-sort', 'nm')"
                :style="uiState.sortKey==='nm' ? 'background:var(--blue);color:#fff;border:none;border-radius:12px;padding:3px 10px;font-size:0.75rem;cursor:pointer;font-weight:700;' : 'background:var(--bg-base);color:var(--text-muted);border:1px solid var(--border);border-radius:12px;padding:3px 10px;font-size:0.75rem;cursor:pointer;'">
                상품명 {{ cartSortIcon('nm') }}
              </button>
              <button @click="handleBtnAction('cart-sort', 'price')"
                :style="uiState.sortKey==='price' ? 'background:var(--blue);color:#fff;border:none;border-radius:12px;padding:3px 10px;font-size:0.75rem;cursor:pointer;font-weight:700;' : 'background:var(--bg-base);color:var(--text-muted);border:1px solid var(--border);border-radius:12px;padding:3px 10px;font-size:0.75rem;cursor:pointer;'">
                가격 {{ cartSortIcon('price') }}
              </button>
              <button @click="handleBtnAction('cart-clearAll')"
                style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.8rem;text-decoration:underline;padding:0;margin-left:4px;">
                전체 삭제
              </button>
            </div>
          </div>
          <!-- ===== ■.■.■.■.■. 각 상품 ============================================ -->
          <div v-for="(item, idx) in cfSortedCart" :key="item._origIdx"
            style="padding:20px;display:flex;gap:12px;align-items:flex-start;"
            :style="{ borderBottom: idx===cfSortedCart.length-1 ? 'none' : '1px solid var(--border)',
            background: isChecked(item._origIdx) ? 'var(--blue-dim)' : '' }">
            <!-- ===== ■.■.■.■.■.■. 체크박스 ========================================== -->
            <div style="padding-top:4px;flex-shrink:0;">
              <input type="checkbox" :checked="isChecked(item._origIdx)" @change="handleSelectAction('cart-rowToggle', item._origIdx)"
                style="width:17px;height:17px;cursor:pointer;accent-color:var(--blue);" />
            </div>
            <!-- ===== ■.■.■.■.■.■. 상품 이미지 ======================================== -->
            <div style="width:80px;height:80px;border-radius:12px;flex-shrink:0;overflow:hidden;background:var(--bg-base);">
              <img v-if="item.prod.image" :src="item.prod.image" :alt="item.prod.prodNm" style="width:100%;height:100%;object-fit:cover;" />
            </div>
            <!-- ===== ■.■.■.■.■.■. 상품 정보 ========================================= -->
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;color:var(--text-primary);font-size:0.95rem;margin-bottom:4px;">
                {{ item.prod.prodNm }}
              </div>
              <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">
                <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:12px;background:var(--blue-dim);color:var(--blue);font-size:0.75rem;font-weight:600;">
                  <span :style="{ display:'inline-block', width:'10px', height:'10px', borderRadius:'50%', background:item.color.hex, border:'1px solid rgba(0,0,0,0.1)', flexShrink:0 }">
                  </span>
                  {{ item.color.name }}
                </span>
                <span style="padding:2px 10px;border-radius:12px;background:var(--purple-dim);color:var(--purple);font-size:0.75rem;font-weight:600;">
                  {{ item.size }}
                </span>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <button class="qty-btn" @click="handleSelectAction('cart-rowQty', { idx: item._origIdx, delta: -1 })">
                    −
                  </button>
                  <span class="qty-val">
                    {{ item.qty }}
                  </span>
                  <button class="qty-btn" @click="handleSelectAction('cart-rowQty', { idx: item._origIdx, delta: 1 })">
                    +
                  </button>
                </div>
                <div style="font-size:0.95rem;font-weight:800;color:var(--blue);">
                  {{ formatPrice(item.prod.price, item.qty) }}
                </div>
              </div>
            </div>
            <!-- ===== ■.■.■.■.■.■. 삭제 버튼 ========================================= -->
            <button @click="handleSelectAction('cart-rowRemove', item._origIdx)"
              style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:1.2rem;padding:0;flex-shrink:0;transition:color 0.2s;"
              @mouseenter="$event.currentTarget.style.color='#e53e3e'"
              @mouseleave="$event.currentTarget.style.color='var(--text-muted)'"
              title="삭제">
              ✕
            </button>
          </div>
        </fo-container>
        <button class="btn-outline" @click="handleBtnAction('page-goProdList')" style="padding:10px 20px;">
          ← 계속 쇼핑하기
        </button>
      </div>
      <!-- ===== ■.■.■. 오른쪽: 주문 요약 ========================================== -->
      <div>
        <fo-container title="📋 주문 요약" card-style="padding:clamp(12px,3vw,24px);position:sticky;top:76px;">
          <div v-if="uiState.checkedIdxs.size>0" style="margin-bottom:8px;padding:6px 10px;border-radius:6px;background:var(--blue-dim);color:var(--blue);font-size:0.78rem;font-weight:600;">
            ✔ 선택 {{ uiState.checkedIdxs.size }}개 상품만 주문합니다
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:18px;font-size:0.875rem;">
            <div v-for="(item, idx) in cfSummaryItems" :key="idx"
              style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
              <span style="color:var(--text-secondary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                {{ item.prod.prodNm }} ({{ item.color.name }}/{{ item.size }}) × {{ item.qty }}
              </span>
              <span style="font-weight:600;flex-shrink:0;color:var(--text-primary);">
                {{ formatPrice(item.prod.price, item.qty) }}
              </span>
            </div>
          </div>
          <div style="border-top:1px solid var(--border);padding-top:14px;margin-bottom:18px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:0.875rem;">
              <span style="color:var(--text-secondary);">
                상품금액
              </span>
              <span style="font-weight:600;">
                {{ cfTotalPriceStr }}
              </span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:0.875rem;">
              <span style="color:var(--text-secondary);">
                배송비
              </span>
              <span style="color:var(--blue);font-weight:600;">
                무료
              </span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:800;color:var(--text-primary);margin-top:10px;">
              <span>
                총 결제금액
              </span>
              <span style="color:var(--blue);">
                {{ cfTotalPriceStr }}
              </span>
            </div>
          </div>
          <button class="btn-blue" @click="handleBtnAction('summary-goOrder')" style="width:100%;padding:14px;font-size:0.95rem;">
            주문하기 ({{ cfOrderCount }}개)
          </button>
          <p style="text-align:center;font-size:0.75rem;color:var(--text-muted);margin-top:10px;">
            계좌이체로 안전하게 결제
          </p>
        </fo-container>
      </div>
    </div>
  </template>
  <!-- ===== □. 장바구니 목록 ================================================= -->
</fo-page>
`,
};
