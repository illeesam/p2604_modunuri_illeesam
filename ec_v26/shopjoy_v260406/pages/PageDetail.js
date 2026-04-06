/* ShopJoy - PageDetail (색상/사이즈 필수 선택) */
window.PageDetail = {
  name: 'PageDetail',
  props: ['navigate', 'config', 'product', 'addToCart', 'showToast', 'showAlert'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <button @click="navigate('products')" style="display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.825rem;margin-bottom:24px;padding:0;transition:color 0.2s;"
    @mouseenter="$event.currentTarget.style.color='var(--blue)'"
    @mouseleave="$event.currentTarget.style.color='var(--text-muted)'">
    ← 상품 목록으로
  </button>

  <template v-if="product">
    <div style="display:grid;grid-template-columns:1fr 360px;gap:32px;align-items:start;" class="detail-grid">

      <!-- 왼쪽: 이미지 + 상품 정보 -->
      <div>
        <!-- 상품 이미지 -->
        <div class="card" style="padding:0;overflow:hidden;margin-bottom:20px;">
          <div :style="{
            height:'320px', display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'9rem',
            background: selectedColor
              ? 'linear-gradient(135deg,' + selectedColor.hex + '33, ' + selectedColor.hex + '11)'
              : 'linear-gradient(135deg,var(--blue-dim),var(--green-dim))',
            position:'relative', transition:'background 0.4s ease'
          }">
            {{ product.emoji }}
            <div v-if="product.badge"
              style="position:absolute;top:16px;left:16px;">
              <span v-if="product.badge==='NEW'" class="badge badge-new" style="font-size:0.8rem;padding:4px 12px;">NEW</span>
              <span v-else-if="product.badge==='인기'" class="badge badge-hot" style="font-size:0.8rem;padding:4px 12px;">인기</span>
            </div>
          </div>
        </div>

        <!-- 상품 설명 -->
        <div class="card" style="padding:28px;margin-bottom:20px;">
          <h2 style="font-size:1rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);">📋 상품 설명</h2>
          <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.8;margin-bottom:16px;">{{ product.desc }}</p>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            <span v-for="t in product.tags" :key="t" class="tag"># {{ t }}</span>
          </div>
        </div>

        <!-- 관리 안내 -->
        <div class="card" style="padding:28px;">
          <h2 style="font-size:1rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);">🧺 세탁 및 관리</h2>
          <div class="info-row">
            <span class="info-icon">💧</span>
            <div><div class="info-label">세탁 방법</div><div class="info-val">찬물 손세탁 또는 세탁기 약세탁 권장</div></div>
          </div>
          <div class="info-row">
            <span class="info-icon">🌡️</span>
            <div><div class="info-label">건조 방법</div><div class="info-val">그늘에서 자연 건조 (드라이기 금지)</div></div>
          </div>
          <div class="info-row">
            <span class="info-icon">👕</span>
            <div><div class="info-label">다림질</div><div class="info-val">낮은 온도로 뒤집어 다림질</div></div>
          </div>
          <div class="info-row">
            <span class="info-icon">🚫</span>
            <div><div class="info-label">주의사항</div><div class="info-val">표백제 사용 금지, 드라이클리닝 권장 안함</div></div>
          </div>
        </div>
      </div>

      <!-- 오른쪽: 구매 옵션 -->
      <div>
        <div class="card" style="padding:28px;position:sticky;top:76px;">
          <!-- 상품명 + 카테고리 -->
          <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px;flex-wrap:wrap;">
            <h1 style="font-size:1.3rem;font-weight:800;color:var(--text-primary);flex:1;min-width:0;">{{ product.productName }}</h1>
            <span class="badge badge-cat" style="flex-shrink:0;margin-top:2px;">{{ categoryLabel(product) }}</span>
          </div>
          <!-- 가격 -->
          <div style="font-size:1.6rem;font-weight:900;color:var(--blue);margin-bottom:24px;">{{ product.price }}</div>

          <!-- ① 색상 선택 (필수) -->
          <div style="margin-bottom:20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <label class="form-label" style="margin:0;">색상 선택<span class="form-required">*</span></label>
              <span v-if="selectedColor" style="font-size:0.8rem;font-weight:600;color:var(--text-primary);">{{ selectedColor.name }}</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
              <button v-for="c in product.colors" :key="c.name"
                class="color-swatch"
                :class="{selected: selectedColor && selectedColor.name===c.name}"
                :style="{ background: c.hex, border: '2px solid ' + (c.hex === '#f5f0eb' || c.hex === '#f5f5f0' || c.hex === '#f5f5f5' || c.hex === '#f5f0e8' || c.hex === '#f5f0e0' ? 'rgba(0,0,0,0.15)' : 'transparent') }"
                :title="c.name"
                @click="selectColor(c)"
                style="width:32px;height:32px;">
              </button>
            </div>
            <div v-if="colorError" class="form-error" style="margin-top:6px;">{{ colorError }}</div>
          </div>

          <!-- ② 사이즈 선택 (필수) -->
          <div style="margin-bottom:20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <label class="form-label" style="margin:0;">사이즈 선택<span class="form-required">*</span></label>
              <button @click="showSizeGuide=true"
                style="background:none;border:none;cursor:pointer;color:var(--blue);font-size:0.75rem;font-weight:600;padding:0;text-decoration:underline;">
                사이즈 가이드
              </button>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              <button v-for="s in product.sizes" :key="s"
                class="size-btn"
                :class="{selected: selectedSize===s}"
                @click="selectSize(s)">{{ s }}</button>
            </div>
            <div v-if="sizeError" class="form-error" style="margin-top:6px;">{{ sizeError }}</div>
          </div>

          <!-- ③ 수량 -->
          <div style="margin-bottom:24px;">
            <label class="form-label">수량</label>
            <div style="display:flex;align-items:center;gap:8px;">
              <button class="qty-btn" @click="qty>1&&qty--">−</button>
              <span class="qty-val">{{ qty }}</span>
              <button class="qty-btn" @click="qty++">+</button>
            </div>
          </div>

          <!-- 선택 요약 -->
          <div v-if="selectedColor || selectedSize" style="background:var(--bg-base);border-radius:10px;padding:12px 14px;margin-bottom:18px;font-size:0.82rem;color:var(--text-secondary);line-height:1.7;">
            <div v-if="selectedColor"><span style="font-weight:600;">색상:</span> {{ selectedColor.name }}</div>
            <div v-if="selectedSize"><span style="font-weight:600;">사이즈:</span> {{ selectedSize }}</div>
            <div><span style="font-weight:600;">수량:</span> {{ qty }}개</div>
          </div>

          <!-- 버튼 -->
          <div style="display:flex;flex-direction:column;gap:10px;">
            <button class="btn-blue" style="width:100%;padding:14px;font-size:0.95rem;" @click="handleAddToCart">
              🛒 장바구니 담기
            </button>
            <button class="btn-outline" style="width:100%;padding:14px;font-size:0.95rem;" @click="handleBuyNow">
              ⚡ 바로 구매하기
            </button>
            <button @click="navigate('contact')"
              style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.8rem;text-decoration:underline;padding:4px 0;">
              상품 문의하기
            </button>
          </div>

          <!-- 배송 안내 -->
          <div style="margin-top:20px;padding-top:18px;border-top:1px solid var(--border);font-size:0.8rem;color:var(--text-secondary);display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;gap:8px;"><span>🚚</span><span>결제 확인 후 <strong>1~2 영업일</strong> 내 출고</span></div>
            <div style="display:flex;gap:8px;"><span>↩️</span><span>수령 후 <strong>7일 이내</strong> 교환·반품 가능</span></div>
            <div style="display:flex;gap:8px;"><span>💳</span><span>결제: <strong>계좌이체</strong></span></div>
          </div>
        </div>
      </div>
    </div>
  </template>

  <!-- 사이즈 가이드 모달 -->
  <div v-if="showSizeGuide" class="modal-overlay" @click.self="showSizeGuide=false">
    <div class="modal-box" style="max-width:480px;text-align:left;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <span style="font-weight:800;font-size:1rem;color:var(--text-primary);">📏 사이즈 가이드</span>
        <button @click="showSizeGuide=false" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--text-muted);padding:0;line-height:1;">✕</button>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
        <thead>
          <tr style="background:var(--blue-dim);">
            <th style="padding:8px 12px;text-align:center;font-weight:700;color:var(--blue);border-radius:6px 0 0 0;">사이즈</th>
            <th style="padding:8px 12px;text-align:center;font-weight:700;color:var(--blue);">어깨 (cm)</th>
            <th style="padding:8px 12px;text-align:center;font-weight:700;color:var(--blue);">가슴 (cm)</th>
            <th style="padding:8px 12px;text-align:center;font-weight:700;color:var(--blue);border-radius:0 6px 0 0;">총장 (cm)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in sizeGuideRows" :key="i" :style="{ background: i%2===0 ? 'transparent' : 'var(--bg-base)' }">
            <td style="padding:8px 12px;text-align:center;font-weight:700;color:var(--text-primary);">{{ row[0] }}</td>
            <td style="padding:8px 12px;text-align:center;color:var(--text-secondary);">{{ row[1] }}</td>
            <td style="padding:8px 12px;text-align:center;color:var(--text-secondary);">{{ row[2] }}</td>
            <td style="padding:8px 12px;text-align:center;color:var(--text-secondary);">{{ row[3] }}</td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top:14px;font-size:0.75rem;color:var(--text-muted);line-height:1.6;">* 측정 방법에 따라 1~2cm 오차가 있을 수 있습니다.</p>
      <button class="btn-blue" @click="showSizeGuide=false" style="width:100%;margin-top:16px;padding:10px;">확인</button>
    </div>
  </div>
</div>
  `,
  setup(props) {
    const { ref } = Vue;

    const selectedColor = ref(null);
    const selectedSize  = ref(null);
    const qty = ref(1);
    const colorError = ref('');
    const sizeError  = ref('');
    const showSizeGuide = ref(false);

    const sizeGuideRows = [
      ['XS', '36', '82', '60'],
      ['S',  '38', '86', '62'],
      ['M',  '40', '90', '64'],
      ['L',  '42', '96', '66'],
      ['XL', '44', '102','68'],
      ['XXL','46', '108','70'],
    ];

    function categoryLabel(p) {
      if (!p) return '';
      const cats = (props.config && props.config.categorys) || [];
      const row = cats.find(c => c.categoryId === p.categoryId);
      return row ? row.categoryName : p.categoryId;
    }

    const selectColor = c => {
      selectedColor.value = c;
      colorError.value = '';
    };

    const selectSize = s => {
      selectedSize.value = s;
      sizeError.value = '';
    };

    const validate = () => {
      let ok = true;
      if (!selectedColor.value) { colorError.value = '색상을 선택해주세요.'; ok = false; }
      if (!selectedSize.value)  { sizeError.value  = '사이즈를 선택해주세요.'; ok = false; }
      return ok;
    };

    const handleAddToCart = () => {
      if (!validate()) return;
      props.addToCart(props.product, selectedColor.value, selectedSize.value, qty.value);
      // reset
      selectedColor.value = null;
      selectedSize.value  = null;
      qty.value = 1;
    };

    const handleBuyNow = () => {
      if (!validate()) return;
      props.addToCart(props.product, selectedColor.value, selectedSize.value, qty.value);
      props.navigate('cart');
    };

    return {
      selectedColor, selectedSize, qty, colorError, sizeError, showSizeGuide,
      sizeGuideRows, categoryLabel, selectColor, selectSize,
      handleAddToCart, handleBuyNow,
    };
  }
};
