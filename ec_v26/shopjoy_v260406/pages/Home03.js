/* ShopJoy - Home */
window.Home03 = {
  name: 'Home',
  props: ['navigate', 'config', 'products', 'selectProduct', 'toggleLike', 'isLiked'],
  emits: [],
  template: /* html */ `
<div>

  <!-- ══ Site 03 Edition Ribbon ══ -->
  <div style="background:linear-gradient(135deg,#4a148c 0%,#7b1fa2 50%,#9c27b0 100%);color:#fff;padding:14px 24px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;box-shadow:0 2px 8px rgba(80,30,130,0.15);">
    <span style="font-size:10px;letter-spacing:3px;padding:3px 10px;border:1px solid rgba(255,255,255,0.5);border-radius:2px;">👑 LUXE EDITION</span>
    <span style="font-size:13px;font-weight:600;letter-spacing:0.5px;">✨ 로얄 퍼플 프리미엄 컬렉션 — 한정 수량</span>
    <span style="margin-left:auto;font-size:11px;opacity:0.9;">FRONT_SITE_NO=03</span>
  </div>

  <!-- ══ Hero Banner Slider ══ -->
  <section style="position:relative;overflow:hidden;background:#faf7fd;min-height:320px;display:flex;align-items:center;flex-wrap:wrap;">
    <!-- 좌: 텍스트 (슬라이드별) -->
    <div style="position:relative;z-index:2;flex:1 1 260px;padding:clamp(28px,6vw,80px) clamp(20px,5vw,60px) clamp(28px,6vw,80px) clamp(20px,5vw,48px);min-width:0;">
      <h1 style="font-size:clamp(1.4rem,3.5vw,2.6rem);font-weight:300;line-height:1.3;color:#1a1a1a;margin-bottom:16px;letter-spacing:-0.5px;">
        {{ banners[bannerIdx].title }}<br><span style="font-weight:700;">{{ banners[bannerIdx].sub }}</span>
      </h1>
      <p style="font-size:0.85rem;color:#888;line-height:1.8;margin-bottom:28px;max-width:360px;">
        {{ banners[bannerIdx].desc }}
      </p>
      <button @click="navigate('prodList')"
        style="padding:12px 28px;font-size:0.82rem;font-weight:600;letter-spacing:1px;text-transform:uppercase;border:1.5px solid #1a1a1a;background:transparent;color:#1a1a1a;cursor:pointer;transition:all .25s;"
        @mouseenter="$event.target.style.background='#1a1a1a';$event.target.style.color='#fff'"
        @mouseleave="$event.target.style.background='transparent';$event.target.style.color='#1a1a1a'">
        쇼핑 시작하기
      </button>
      <!-- 인디케이터 (클릭 가능) -->
      <div style="display:flex;gap:8px;margin-top:28px;">
        <span v-for="(b, i) in banners" :key="i" @click="setBanner(i)"
          :style="{
            width: '24px', height: '3px', borderRadius: '2px', cursor: 'pointer', transition: 'background .3s',
            background: bannerIdx === i ? '#1a1a1a' : '#ccc',
          }"></span>
      </div>
    </div>
    <!-- 우: 이미지 (페이드 전환) -->
    <div style="flex:1 1 160px;position:relative;min-height:280px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
      <img v-for="(b, i) in banners" :key="i" :src="b.img" :alt="b.title"
        :style="{
          position: i === 0 ? 'relative' : 'absolute',
          maxHeight: '420px', maxWidth: '100%', objectFit: 'contain', zIndex: 1,
          opacity: bannerIdx === i ? '1' : '0',
          transition: 'opacity 0.8s ease',
        }" />
    </div>
  </section>

  <!-- ══ Category Cards (Outstock 스타일) ══ -->
  <div style="padding:0 clamp(12px,3vw,32px);margin:-40px auto 0;max-width:820px;position:relative;z-index:3;">
    <div class="home-cat-grid">
      <div v-for="(cat, ci) in (config.categorys || []).slice(0,3)" :key="cat.categoryId"
        @click="navigate('prodList')"
        style="background:#fff;border-radius:14px;padding:clamp(14px,3vw,24px);cursor:pointer;box-shadow:0 4px 24px rgba(0,0,0,0.09);display:flex;align-items:center;gap:clamp(10px,2vw,20px);transition:transform .2s,box-shadow .2s;"
        @mouseenter="$event.currentTarget.style.transform='translateY(-3px)';$event.currentTarget.style.boxShadow='0 8px 30px rgba(0,0,0,0.14)'"
        @mouseleave="$event.currentTarget.style.transform='';$event.currentTarget.style.boxShadow='0 4px 24px rgba(0,0,0,0.09)'">
        <div style="width:clamp(56px,8vw,88px);height:clamp(56px,8vw,88px);border-radius:50%;overflow:hidden;flex-shrink:0;background:var(--bg-base);">
          <img :src="'assets/cdn/prod/img/shop/product/sm/pro-sm-' + (ci*3+1) + '.jpg'" style="width:100%;height:100%;object-fit:cover;" />
        </div>
        <div>
          <div style="font-size:clamp(0.88rem,2vw,1.05rem);font-weight:700;color:#1a1a1a;margin-bottom:4px;">{{ cat.categoryNm }}</div>
          <div style="font-size:clamp(0.7rem,1.5vw,0.8rem);color:#999;">바로가기 →</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ══ 인기 상품 (8개) ══ -->
  <div style="max-width:1080px;margin:0 auto;padding:48px clamp(12px,3vw,32px) 40px;">
    <div style="text-align:center;margin-bottom:28px;">
      <h2 style="font-size:1.5rem;font-weight:700;color:#1a1a1a;margin-bottom:8px;">인기 상품</h2>
      <p style="font-size:0.85rem;color:#999;">고객들이 사랑하는 트렌디한 아이템을 만나보세요</p>
    </div>
    <div class="home-prod-grid">
      <div v-for="p in allHomeProducts" :key="p.productId"
        style="cursor:pointer;transition:transform .25s,box-shadow .25s;"
        @mouseenter="$event.currentTarget.style.transform='translateY(-6px)';$event.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'"
        @mouseleave="$event.currentTarget.style.transform='';$event.currentTarget.style.boxShadow=''"
        @click="selectProduct(p)">
        <div style="background:#f5f5f5;padding:24px;margin-bottom:14px;overflow:hidden;position:relative;aspect-ratio:1;"
          @mouseenter="$event.currentTarget.querySelector('.prod-hover').style.opacity='1'"
          @mouseleave="$event.currentTarget.querySelector('.prod-hover').style.opacity='0'">
          <img v-if="p.image" :src="p.image" :alt="p.prodNm" style="width:100%;height:100%;object-fit:contain;" />
          <span v-if="p.badge" style="position:absolute;top:10px;left:10px;font-size:0.68rem;font-weight:600;padding:3px 8px;border-radius:2px;"
            :style="{ background: p.badge==='NEW' ? '#1a1a1a' : '#8b7355', color:'#fff' }">{{ p.badge }}</span>
          <!-- 좋아요 (좋아요 상태면 항상 표시) -->
          <button @click.stop="toggleLike(p.productId)"
            :style="{ position:'absolute', right:'12px', top:'12px', width:'32px', height:'32px', borderRadius:'50%', border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }"
            class="prod-like" title="위시리스트">
            <svg width="16" height="16" viewBox="0 0 24 24" :fill="isLiked(p.productId)?'#ef4444':'none'" :stroke="isLiked(p.productId)?'#ef4444':'#555'" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </button>
          <!-- 장바구니 + 빠른보기 (hover 시에만) -->
          <div class="prod-hover" style="opacity:0;transition:opacity .25s;position:absolute;right:12px;top:48px;display:flex;flex-direction:column;gap:6px;">
            <button @click.stop="quickViewProduct=p; cartModalMode=true" style="width:32px;height:32px;border-radius:50%;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;" title="장바구니">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            </button>
            <button @click.stop="quickViewProduct=p; cartModalMode=false" style="width:32px;height:32px;border-radius:50%;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;" title="빠른보기">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </div>
        </div>
        <div style="font-size:0.88rem;font-weight:500;color:#1a1a1a;margin-bottom:4px;">{{ p.prodNm }}</div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-size:0.88rem;font-weight:700;color:#1a1a1a;">{{ p.price }}</span>
          <span v-if="p.originalPrice" style="font-size:0.78rem;color:#bbb;text-decoration:line-through;">{{ p.originalPrice.toLocaleString ? p.originalPrice.toLocaleString() + '원' : p.originalPrice }}</span>
          <span v-if="p.originalPrice && p.priceNum" style="font-size:0.75rem;font-weight:700;color:#ef4444;">{{ Math.round((1 - p.priceNum / p.originalPrice) * 100) }}%</span>
        </div>
      </div>
    </div>
    <div style="text-align:center;margin-top:32px;">
      <button @click="navigate('prodList')"
        style="padding:12px 40px;font-size:0.82rem;font-weight:600;letter-spacing:0.5px;border:1.5px solid #ddd;background:transparent;color:#666;cursor:pointer;transition:all .2s;"
        @mouseenter="$event.target.style.borderColor='#1a1a1a';$event.target.style.color='#1a1a1a'"
        @mouseleave="$event.target.style.borderColor='#ddd';$event.target.style.color='#666'">
        더 보기
      </button>
    </div>
  </div>

  <!-- ══ 2열 프로모션 배너 ══ -->
  <div style="max-width:1100px;margin:0 auto;padding:0 clamp(12px,3vw,32px) 48px;">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:clamp(12px,2vw,24px);">
      <!-- 배너 1 -->
      <div style="position:relative;overflow:hidden;border-radius:4px;display:flex;align-items:flex-end;min-height:300px;">
        <img src="assets/cdn/prod/img/shop/banner/banner-big-1.jpg" alt="프로모션"
          style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />
        <div style="position:relative;z-index:1;padding:40px;background:linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 100%);width:100%;">
          <div style="font-size:0.72rem;color:rgba(255,255,255,0.7);margin-bottom:8px;letter-spacing:1px;text-transform:uppercase;">프리미엄 컬렉션</div>
          <h3 style="font-size:1.5rem;font-weight:700;color:#fff;margin-bottom:10px;line-height:1.3;">핸드메이드<br>프리미엄 아이템</h3>
          <p style="font-size:0.85rem;color:rgba(255,255,255,0.8);margin-bottom:20px;line-height:1.6;">장인의 손길이 담긴<br>특별한 컬렉션을 만나보세요.</p>
          <button @click="navigate('prodList')"
            style="padding:10px 24px;font-size:0.8rem;font-weight:600;border:1.5px solid #fff;background:transparent;color:#fff;cursor:pointer;transition:all .2s;"
            @mouseenter="$event.target.style.background='#fff';$event.target.style.color='#1a1a1a'"
            @mouseleave="$event.target.style.background='transparent';$event.target.style.color='#fff'">
            쇼핑하기 →
          </button>
        </div>
      </div>
      <!-- 배너 2 -->
      <div style="position:relative;overflow:hidden;border-radius:4px;display:flex;align-items:flex-end;min-height:300px;">
        <img src="assets/cdn/prod/img/shop/banner/banner-big-2.jpg" alt="프로모션"
          style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />
        <div style="position:relative;z-index:1;padding:40px;background:linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 100%);width:100%;">
          <div style="font-size:0.72rem;color:rgba(255,255,255,0.7);margin-bottom:8px;letter-spacing:1px;text-transform:uppercase;">시즌 한정 상품</div>
          <h3 style="font-size:1.5rem;font-weight:700;color:#fff;margin-bottom:10px;line-height:1.3;">2026 S/S<br>신상품 컬렉션</h3>
          <p style="font-size:0.85rem;color:rgba(255,255,255,0.8);margin-bottom:20px;line-height:1.6;">올 봄·여름 시즌을 빛낼<br>새로운 아이템이 도착했습니다.</p>
          <button @click="navigate('prodList')"
            style="padding:10px 24px;font-size:0.8rem;font-weight:600;border:1.5px solid #fff;background:transparent;color:#fff;cursor:pointer;transition:all .2s;"
            @mouseenter="$event.target.style.background='#fff';$event.target.style.color='#1a1a1a'"
            @mouseleave="$event.target.style.background='transparent';$event.target.style.color='#fff'">
            쇼핑하기 →
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ══ 할인 상품 (Sale Off) ══ -->
  <div style="max-width:1080px;margin:0 auto;padding:0 clamp(12px,3vw,32px) 40px;">
    <div style="text-align:center;margin-bottom:28px;">
      <h2 style="font-size:1.5rem;font-weight:700;color:#1a1a1a;font-style:italic;margin-bottom:8px;">할인 상품</h2>
      <p style="font-size:0.85rem;color:#999;">특별 할인 중인 인기 상품을 놓치지 마세요</p>
    </div>
    <div class="home-sale-grid">
      <div v-for="p in saleProducts" :key="'sale'+p.productId"
        style="cursor:pointer;text-align:center;transition:transform .25s;"
        @mouseenter="$event.currentTarget.style.transform='translateY(-4px)'"
        @mouseleave="$event.currentTarget.style.transform=''"
        @click="selectProduct(p)">
        <div style="background:#f5f5f5;padding:20px;margin-bottom:12px;position:relative;aspect-ratio:1;overflow:hidden;">
          <img v-if="p.image" :src="p.image" :alt="p.prodNm" style="width:100%;height:100%;object-fit:contain;" />
          <span v-if="p.originalPrice && p.priceNum" style="position:absolute;top:8px;left:8px;font-size:0.68rem;font-weight:700;padding:3px 8px;border-radius:2px;background:#ef4444;color:#fff;">
            -{{ Math.round((1 - p.priceNum / p.originalPrice) * 100) }}%
          </span>
        </div>
        <div style="font-size:0.85rem;font-weight:500;color:#1a1a1a;margin-bottom:4px;">{{ p.prodNm }}</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;">
          <span style="font-size:0.85rem;font-weight:700;color:#1a1a1a;">{{ p.price }}</span>
          <span style="font-size:0.75rem;color:#bbb;text-decoration:line-through;">{{ p.originalPrice.toLocaleString ? p.originalPrice.toLocaleString() + '원' : p.originalPrice }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ══ 브랜드 로고 ══ -->
  <div style="max-width:900px;margin:0 auto;padding:20px clamp(12px,3vw,32px) 40px;border-top:1px solid #eee;border-bottom:1px solid #eee;">
    <div style="display:flex;align-items:center;justify-content:center;gap:clamp(20px,5vw,48px);flex-wrap:wrap;opacity:0.45;">
      <img v-for="i in 5" :key="i" :src="'assets/cdn/prod/img/client/brand-' + i + '.webp'" style="height:30px;object-fit:contain;filter:grayscale(1);" />
    </div>
  </div>

  <!-- ══ 블로그 포스트 ══ -->
  <div style="max-width:1080px;margin:0 auto;padding:40px clamp(12px,3vw,32px) 48px;">
    <div style="text-align:center;margin-bottom:28px;">
      <h2 style="font-size:1.5rem;font-weight:700;color:#1a1a1a;font-style:italic;margin-bottom:8px;">블로그</h2>
      <p style="font-size:0.85rem;color:#999;">스타일링 팁과 패션 트렌드를 확인해보세요</p>
    </div>
    <div class="home-blog-grid">
      <div v-for="i in 3" :key="'blog'+i"
        style="cursor:pointer;transition:transform .25s;"
        @mouseenter="$event.currentTarget.style.transform='translateY(-4px)'"
        @mouseleave="$event.currentTarget.style.transform=''"
        @click="navigate('blog')">
        <div style="aspect-ratio:4/3;overflow:hidden;border-radius:4px;margin-bottom:14px;">
          <img :src="'assets/cdn/prod/img/blog/blog-' + i + '.jpg'" :alt="'블로그 ' + i"
            style="width:100%;height:100%;object-fit:cover;transition:transform .3s;"
            @mouseenter="$event.target.style.transform='scale(1.05)'"
            @mouseleave="$event.target.style.transform=''" />
        </div>
        <div style="font-size:0.72rem;color:#999;margin-bottom:6px;">{{ ['2026.04.10', '2026.04.08', '2026.04.05'][i-1] }}</div>
        <h3 style="font-size:0.95rem;font-weight:600;color:#1a1a1a;margin-bottom:8px;line-height:1.4;">{{ ['봄 시즌 스타일링 가이드', '트렌드 컬러 활용법', '미니멀 옷장 정리법'][i-1] }}</h3>
        <p style="font-size:0.8rem;color:#888;line-height:1.6;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">{{ ['올봄 트렌디한 코디를 완성하는 핵심 아이템과 스타일링 팁을 소개합니다.', '시즌 컬러를 활용한 다양한 코디 방법을 알아봅니다.', '효율적인 옷장 정리법과 캡슐 워드로브 구성 팁을 공개합니다.'][i-1] }}</p>
        <span style="font-size:0.78rem;font-weight:600;color:#1a1a1a;text-decoration:underline;">자세히 보기 →</span>
      </div>
    </div>
  </div>

  <!-- ══ 빠른보기 모달 (ProductModal 컴포넌트) ══ -->
  <product-modal
    :show="!!quickViewProduct"
    :product="quickViewProduct"
    :cart-mode="cartModalMode"
    :navigate="(page, opts) => { if(opts&&opts.instantOrder){ navigate('order',opts); quickViewProduct=null; } else { selectProduct(quickViewProduct); quickViewProduct=null; } }"
    :toggle-like="toggleLike"
    :is-liked="isLiked"
    @close="quickViewProduct=null; cartModalMode=false"
  />


</div>
  `,
  setup(props) {
    const { computed } = Vue;

    function categoryLabel(p) {
      if (!p) return '';
      const cats = (props.config && props.config.categorys) || [];
      const row = cats.find(c => c.categoryId === p.categoryId);
      return row ? row.categoryNm : p.categoryId;
    }

    function catEmoji(id) {
      const map = { tops: '👕', bottoms: '👖', outer: '🧥', dress: '👗', acc: '💍' };
      return map[id] || '🏷️';
    }

    const newProducts = computed(() =>
      (props.products || []).filter(p => p.badge === 'NEW').slice(0, 3)
    );

    const bestProducts = computed(() =>
      (props.products || []).filter(p => p.badge === '인기').slice(0, 3)
    );

    /* ── 할인 상품 ── */
    const saleProducts = computed(() =>
      (props.products || []).filter(p => p.originalPrice && p.priceNum && p.originalPrice > p.priceNum).slice(0, 4)
    );

    /* ── 빠른보기 모달 ── */
    const { ref, onMounted, onBeforeUnmount } = Vue;
    const quickViewProduct = ref(null);
    const cartModalMode = ref(false);

    /* ── 홈 그리드 반응형 CSS 주입 ── */
    /* max-width 컨테이너가 최대 열 수를 자연 제한:
       카테고리 max-width:820px  / minmax(240px) → 최대 3열, 좁아지면 2→1열
       상품     max-width:1080px / minmax(220px) → 최대 4열, 좁아지면 3→2→1열
       블로그   max-width:1080px / minmax(300px) → 최대 3열, 좁아지면 2→1열  */
    onMounted(() => {
      if (!document.getElementById('home-grid-styles')) {
        const s = document.createElement('style');
        s.id = 'home-grid-styles';
        s.textContent = `
          .home-cat-grid  { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; }
          .home-prod-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:20px; }
          .home-sale-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:20px; }
          .home-blog-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:20px; }
        `;
        document.head.appendChild(s);
      }
    });

    /* ── 홈 상품 8개 ── */
    const allHomeProducts = computed(() => {
      const all = props.products || [];
      return all.slice(0, 8);
    });

    /* ── 배너 슬라이더 ── */
    const bannerIdx = ref(0);
    const banners = [
      { img: 'assets/cdn/prod/img/slider/slider-1.jpg', title: '나만의 스타일을', sub: '완성하세요', desc: '트렌디한 의류를 합리적인 가격으로. 색상과 사이즈를 직접 선택해 나만의 스타일을 만들어보세요.' },
      { img: 'assets/cdn/prod/img/slider/slider-2.jpg', title: '2026 S/S', sub: '신상품 컬렉션', desc: '올 봄·여름 시즌을 빛낼 새로운 컬렉션이 도착했습니다. 지금 만나보세요.' },
      { img: 'assets/cdn/prod/img/slider/slider-3.jpg', title: '특별한 혜택', sub: '시즌 세일 진행중', desc: '인기 상품 최대 50% 할인! 한정 수량으로 준비된 특별 혜택을 놓치지 마세요.' },
    ];
    let bannerTimer = null;
    const startBannerTimer = () => { bannerTimer = setInterval(() => { bannerIdx.value = (bannerIdx.value + 1) % banners.length; }, 20000); };
    const setBanner = (i) => { bannerIdx.value = i; clearInterval(bannerTimer); startBannerTimer(); };
    onMounted(startBannerTimer);
    onBeforeUnmount(() => clearInterval(bannerTimer));

    return { categoryLabel, catEmoji, newProducts, bestProducts, allHomeProducts, saleProducts, quickViewProduct, cartModalMode, bannerIdx, banners, setBanner };
  }
};
