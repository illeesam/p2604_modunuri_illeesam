/* ShopJoy - Home */
window.Home = {
  name: 'Home',
  props: ['navigate', 'config', 'products', 'selectProduct'],
  emits: [],
  template: /* html */ `
<div>

  <!-- ══ Hero Banner Slider ══ -->
  <section style="position:relative;overflow:hidden;background:#f5f3f0;min-height:520px;display:flex;align-items:center;">
    <!-- 좌: 텍스트 (슬라이드별) -->
    <div style="position:relative;z-index:2;flex:1;padding:80px 60px 80px 48px;max-width:480px;">
      <h1 style="font-size:clamp(1.6rem,3.5vw,2.6rem);font-weight:300;line-height:1.3;color:#1a1a1a;margin-bottom:20px;letter-spacing:-0.5px;">
        {{ banners[bannerIdx].title }}<br><span style="font-weight:700;">{{ banners[bannerIdx].sub }}</span>
      </h1>
      <p style="font-size:0.88rem;color:#888;line-height:1.8;margin-bottom:32px;max-width:360px;">
        {{ banners[bannerIdx].desc }}
      </p>
      <button @click="navigate('products')"
        style="padding:14px 36px;font-size:0.85rem;font-weight:600;letter-spacing:1px;text-transform:uppercase;border:1.5px solid #1a1a1a;background:transparent;color:#1a1a1a;cursor:pointer;transition:all .25s;"
        @mouseenter="$event.target.style.background='#1a1a1a';$event.target.style.color='#fff'"
        @mouseleave="$event.target.style.background='transparent';$event.target.style.color='#1a1a1a'">
        쇼핑 시작하기
      </button>
      <!-- 인디케이터 (클릭 가능) -->
      <div style="display:flex;gap:8px;margin-top:36px;">
        <span v-for="(b, i) in banners" :key="i" @click="setBanner(i)"
          :style="{
            width: '24px', height: '3px', borderRadius: '2px', cursor: 'pointer', transition: 'background .3s',
            background: bannerIdx === i ? '#1a1a1a' : '#ccc',
          }"></span>
      </div>
    </div>
    <!-- 우: 이미지 (페이드 전환) -->
    <div style="flex:1;position:relative;min-height:520px;display:flex;align-items:center;justify-content:center;">
      <img v-for="(b, i) in banners" :key="i" :src="b.img" :alt="b.title"
        :style="{
          position: i === 0 ? 'relative' : 'absolute',
          maxHeight: '480px', maxWidth: '100%', objectFit: 'contain', zIndex: 1,
          opacity: bannerIdx === i ? '1' : '0',
          transition: 'opacity 0.8s ease',
        }" />
    </div>
  </section>

  <!-- ══ Category Cards (Outstock 스타일) ══ -->
  <div style="padding:0 32px;margin:-40px auto 0;max-width:960px;position:relative;z-index:3;">
    <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:16px;">
      <div v-for="(cat, ci) in (config.categorys || []).slice(0,3)" :key="cat.categoryId"
        @click="navigate('products')"
        style="background:#fff;border-radius:12px;padding:20px;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,0.08);display:flex;align-items:center;gap:16px;transition:transform .2s,box-shadow .2s;"
        @mouseenter="$event.currentTarget.style.transform='translateY(-3px)';$event.currentTarget.style.boxShadow='0 8px 30px rgba(0,0,0,0.12)'"
        @mouseleave="$event.currentTarget.style.transform='';$event.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.08)'">
        <div style="width:70px;height:70px;border-radius:50%;overflow:hidden;flex-shrink:0;background:var(--bg-base);">
          <img :src="'assets/cdn/prod/img/shop/product/sm/pro-sm-' + (ci*3+1) + '.jpg'" style="width:100%;height:100%;object-fit:cover;" />
        </div>
        <div>
          <div style="font-size:0.92rem;font-weight:700;color:#1a1a1a;margin-bottom:3px;">{{ cat.categoryNm }}</div>
          <div style="font-size:0.75rem;color:#999;">바로가기 →</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ══ Trending Products ══ -->
  <div style="max-width:1100px;margin:0 auto;padding:60px 32px 36px;">
    <div style="text-align:center;margin-bottom:36px;">
      <h2 style="font-size:1.5rem;font-weight:700;color:#1a1a1a;margin-bottom:8px;">인기 상품</h2>
      <p style="font-size:0.85rem;color:#999;">고객들이 사랑하는 트렌디한 아이템을 만나보세요</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:24px;">
      <div v-for="p in newProducts.slice(0,4)" :key="p.productId"
        style="cursor:pointer;text-align:center;" @click="selectProduct(p)">
        <div style="background:var(--bg-base);border-radius:0;padding:24px;margin-bottom:14px;overflow:hidden;position:relative;aspect-ratio:1;"
          @mouseenter="$event.currentTarget.style.background='#f9f9f7'"
          @mouseleave="$event.currentTarget.style.background='#fff'">
          <img v-if="p.image" :src="p.image" :alt="p.prodNm"
            style="width:100%;height:100%;object-fit:contain;transition:transform .3s;"
            @mouseenter="$event.target.style.transform='scale(1.05)'"
            @mouseleave="$event.target.style.transform=''" />
          <span v-if="p.badge" style="position:absolute;top:10px;left:10px;font-size:0.68rem;font-weight:600;padding:3px 8px;border-radius:2px;"
            :style="{ background: p.badge==='NEW' ? '#1a1a1a' : '#e8587a', color:'#fff' }">{{ p.badge }}</span>
        </div>
        <div style="font-size:0.88rem;font-weight:500;color:#1a1a1a;margin-bottom:4px;">{{ p.prodNm }}</div>
        <div style="font-size:0.85rem;color:#888;">{{ p.price }}</div>
      </div>
    </div>
  </div>

  <!-- ══ 하단 4개 (2행) ══ -->
  <div style="max-width:1100px;margin:0 auto;padding:0 32px 48px;">
    <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:24px;">
      <div v-for="p in bestProducts.slice(0,4)" :key="p.productId"
        style="cursor:pointer;text-align:center;" @click="selectProduct(p)">
        <div style="background:#fff;padding:24px;margin-bottom:14px;overflow:hidden;position:relative;aspect-ratio:1;"
          @mouseenter="$event.currentTarget.style.background='#f9f9f7'"
          @mouseleave="$event.currentTarget.style.background='#fff'">
          <img v-if="p.image" :src="p.image" :alt="p.prodNm"
            style="width:100%;height:100%;object-fit:contain;transition:transform .3s;"
            @mouseenter="$event.target.style.transform='scale(1.05)'"
            @mouseleave="$event.target.style.transform=''" />
        </div>
        <div style="font-size:0.88rem;font-weight:500;color:#1a1a1a;margin-bottom:4px;">{{ p.prodNm }}</div>
        <div style="font-size:0.85rem;color:#888;">{{ p.price }}</div>
      </div>
    </div>
    <!-- LOAD MORE -->
    <div style="text-align:center;margin-top:32px;">
      <button @click="navigate('products')"
        style="padding:12px 40px;font-size:0.82rem;font-weight:600;letter-spacing:0.5px;border:1.5px solid #ddd;background:transparent;color:#666;cursor:pointer;transition:all .2s;"
        @mouseenter="$event.target.style.borderColor='#1a1a1a';$event.target.style.color='#1a1a1a'"
        @mouseleave="$event.target.style.borderColor='#ddd';$event.target.style.color='#666'">
        더 보기
      </button>
    </div>
  </div>

  <!-- ══ Banner (중간 배너) ══ -->
  <div style="position:relative;overflow:hidden;height:280px;margin-bottom:48px;">
    <img src="assets/cdn/prod/img/shop/banner/banner-big-1.jpg" alt="Banner"
      style="width:100%;height:100%;object-fit:cover;object-position:center;" />
    <div style="position:absolute;inset:0;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;">
      <h2 style="font-size:1.6rem;font-weight:700;color:#fff;letter-spacing:1px;">시즌 컬렉션</h2>
      <button @click="navigate('products')"
        style="padding:12px 36px;font-size:0.82rem;font-weight:600;letter-spacing:1px;border:1.5px solid #fff;background:transparent;color:#fff;cursor:pointer;transition:all .2s;"
        @mouseenter="$event.target.style.background='#fff';$event.target.style.color='#1a1a1a'"
        @mouseleave="$event.target.style.background='transparent';$event.target.style.color='#fff'">
        지금 쇼핑하기
      </button>
    </div>
  </div>

  <!-- ══ 브랜드 로고 (Outstock 하단 클라이언트) ══ -->
  <div style="max-width:900px;margin:0 auto;padding:24px 32px 60px;">
    <div style="display:flex;align-items:center;justify-content:center;gap:40px;flex-wrap:wrap;opacity:0.5;">
      <img v-for="i in 5" :key="i" :src="'assets/cdn/prod/img/client/brand-' + i + '.webp'" style="height:28px;object-fit:contain;filter:grayscale(1);" />
    </div>
  </div>

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

    /* ── 배너 슬라이더 ── */
    const { ref, onMounted, onBeforeUnmount } = Vue;
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

    return { categoryLabel, catEmoji, newProducts, bestProducts, bannerIdx, banners, setBanner };
  }
};
