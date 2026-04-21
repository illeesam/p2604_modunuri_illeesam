/* ShopJoy - Location Page (위치안내) */
window.Location = {
  name: 'Location',
  props: ['navigate', 'config'],
  setup() {
    const { ref, onMounted } = Vue;

    const LAT  = 37.4407;
    const LNG  = 127.1468;
    const ADDR = '경기도 성남시 중원구 성남대로 997번길 49-14';
    const ADDR_ENC = encodeURIComponent(ADDR);

    /* 지도 iframe src — 카카오 → 구글 → OSM 순 */
    const mapProvider = ref('kakao');   // 현재 사용 중인 제공자
    const mapSrc      = ref('');
    const mapError    = ref(false);

    /* 제공자별 embed URL */
    const PROVIDERS = {
      kakao:  `https://map.kakao.com/link/map/ShopJoy,${LAT},${LNG}`,          // 카카오 (링크 방식)
      google: `https://maps.google.com/maps?q=${ADDR_ENC}&output=embed&hl=ko&z=17`,
      osm:    `https://www.openstreetmap.org/export/embed.html?bbox=${LNG-0.008}%2C${LAT-0.005}%2C${LNG+0.008}%2C${LAT+0.005}&layer=mapnik&marker=${LAT}%2C${LNG}`,
    };

    /* 외부 앱으로 열기 링크 */
    const kakaoLink  = `https://map.kakao.com/link/map/ShopJoy,${LAT},${LNG}`;
    const naverLink  = `https://map.naver.com/v5/search/${ADDR_ENC}`;
    const googleLink = `https://maps.google.com/maps?q=${ADDR_ENC}`;

    /* iframe 에러 → 다음 제공자로 fallback */
    const onMapError = () => {
      if (mapProvider.value === 'google') {
        mapProvider.value = 'osm';
        mapSrc.value = PROVIDERS.osm;
      } else {
        mapError.value = true;
      }
    };

    onMounted(() => {
      /* 카카오 MAP SDK 동적 로드 시도 — appkey 없으면 Google로 fallback */
      const appKey = (window.SITE_CONFIG && window.SITE_CONFIG.kakaoMapKey) || '';
      if (appKey) {
        const s = document.createElement('script');
        s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
        s.onload = () => {
          kakao.maps.load(() => {
            const el = document.getElementById('shopjoy-map');
            if (!el) return;
            const map = new kakao.maps.Map(el, {
              center: new kakao.maps.LatLng(LAT, LNG),
              level: 4,
            });
            new kakao.maps.Marker({
              map,
              position: new kakao.maps.LatLng(LAT, LNG),
              title: 'ShopJoy 본사',
            });
            mapProvider.value = 'kakao_sdk';
          });
        };
        s.onerror = () => {
          mapProvider.value = 'google';
          mapSrc.value = PROVIDERS.google;
        };
        document.head.appendChild(s);
      } else {
        /* API key 없음 → Google embed */
        mapProvider.value = 'google';
        mapSrc.value = PROVIDERS.google;
      }
    });

    return {
      mapProvider, mapSrc, mapError, onMapError,
      kakaoLink, naverLink, googleLink,
      ADDR,
    };
  },

  template: /* html */ `
<div class="page-wrap">
  <!-- 페이지 타이틀 배너 -->
  <div class="page-banner-full" style="position:relative;overflow:hidden;height:220px;margin-bottom:36px;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;width:100vw;display:flex;align-items:center;justify-content:center;">
    <img src="assets/cdn/prod/img/page-title/page-title-1.jpg" alt="위치안내"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;" />
    <div style="position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,255,255,0.72) 0%,rgba(240,245,255,0.55) 45%,rgba(220,232,255,0.38) 100%);"></div>
    <div style="position:relative;z-index:1;text-align:center;">
      <div style="font-size:0.75rem;color:rgba(0,0,0,0.55);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">About</div>
      <h1 style="font-size:2.2rem;font-weight:700;color:#111;letter-spacing:-0.5px;margin-bottom:8px;">위치안내</h1>
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:0.8rem;color:rgba(0,0,0,0.55);">
        <span style="cursor:pointer;" @click="navigate('home')">홈</span>
        <span>/</span><span style="color:#333;">위치안내</span>
      </div>
    </div>
  </div>

  <!-- 지도 영역 -->
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:24px;">

    <!-- 카카오 SDK 모드: div 컨테이너 -->
    <div v-if="mapProvider==='kakao_sdk'"
      id="shopjoy-map"
      style="width:100%;height:clamp(220px,40vw,320px);">
    </div>

    <!-- iframe 모드 (Google / OSM) -->
    <iframe v-else-if="!mapError && mapSrc"
      :src="mapSrc"
      width="100%"
      style="border:0;display:block;height:clamp(220px,40vw,320px);"
      allowfullscreen loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      @error="onMapError">
    </iframe>

    <!-- 로딩 중 (mapSrc 아직 미설정) -->
    <div v-else-if="!mapError && !mapSrc"
      style="height:clamp(220px,40vw,320px);display:flex;align-items:center;justify-content:center;background:var(--bg-base);color:var(--text-muted);font-size:13px;gap:8px;">
      <span style="animation:spin .8s linear infinite;display:inline-block;">⏳</span> 지도 로딩 중…
    </div>

    <!-- 에러 fallback -->
    <div v-else
      style="height:clamp(220px,40vw,320px);display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-base);gap:12px;">
      <div style="font-size:2.5rem;">🗺️</div>
      <div style="font-size:13px;color:var(--text-muted);">지도를 불러올 수 없습니다.</div>
      <a :href="googleLink" target="_blank"
        style="font-size:12px;padding:7px 18px;border-radius:20px;background:var(--blue);color:#fff;text-decoration:none;font-weight:600;">
        외부 지도에서 보기 →
      </a>
    </div>

    <!-- 하단 바: 주소 + 지도앱 링크 -->
    <div style="padding:12px 20px;background:var(--bg-card);border-top:1px solid var(--border);display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <span style="font-size:0.83rem;color:var(--text-secondary);flex:1;min-width:0;">
        📍 {{ ADDR }} 201호
      </span>
      <div style="display:flex;gap:6px;flex-shrink:0;">
        <a :href="kakaoLink" target="_blank" rel="noopener"
          style="padding:5px 12px;background:#FEE500;color:#3c1e1e;border-radius:6px;font-size:0.78rem;font-weight:700;text-decoration:none;display:flex;align-items:center;gap:4px;white-space:nowrap;">
          🗺 카카오맵
        </a>
        <a :href="naverLink" target="_blank" rel="noopener"
          style="padding:5px 12px;background:#03C75A;color:#fff;border-radius:6px;font-size:0.78rem;font-weight:700;text-decoration:none;display:flex;align-items:center;gap:4px;white-space:nowrap;">
          🗺 네이버지도
        </a>
        <a :href="googleLink" target="_blank" rel="noopener"
          style="padding:5px 12px;background:#4285F4;color:#fff;border-radius:6px;font-size:0.78rem;font-weight:700;text-decoration:none;display:flex;align-items:center;gap:4px;white-space:nowrap;">
          🗺 구글지도
        </a>
      </div>
    </div>
  </div>

  <!-- 상세 정보 -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:clamp(10px,2vw,16px);margin-bottom:24px;">

    <!-- 주소 -->
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <div style="width:40px;height:40px;border-radius:10px;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">📍</div>
        <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">주소</div>
      </div>
      <div style="font-size:0.88rem;color:var(--text-secondary);line-height:1.8;">
        <div style="font-weight:600;color:var(--text-primary);margin-bottom:4px;">경기도 성남시 중원구</div>
        <div>성남대로 997번길 49-14, 201호</div>
        <div style="margin-top:8px;font-size:0.8rem;color:var(--text-muted);">우편번호: 13401</div>
      </div>
    </div>

    <!-- 영업시간 -->
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <div style="width:40px;height:40px;border-radius:10px;background:var(--green-dim);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">🕐</div>
        <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">영업시간</div>
      </div>
      <div style="font-size:0.87rem;color:var(--text-secondary);line-height:2;">
        <div style="display:flex;justify-content:space-between;">
          <span>월요일 ~ 금요일</span><span style="font-weight:700;color:var(--text-primary);">09:00 – 18:00</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span>토요일</span><span style="font-weight:700;color:var(--text-primary);">10:00 – 15:00</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span>일요일 / 공휴일</span><span style="font-weight:600;color:#ef4444;">휴무</span>
        </div>
      </div>
    </div>

    <!-- 연락처 -->
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <div style="width:40px;height:40px;border-radius:10px;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">📞</div>
        <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">연락처</div>
      </div>
      <div style="font-size:0.87rem;color:var(--text-secondary);line-height:2;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span>전화</span>
          <a :href="'tel:'+(config&&config.tel||'010-3805-0206')"
            style="font-weight:700;color:var(--blue);text-decoration:none;">{{ config&&config.tel||'010-3805-0206' }}</a>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span>이메일</span>
          <a :href="'mailto:'+(config&&config.email||'illeesam@gmail.com')"
            style="font-weight:700;color:var(--blue);text-decoration:none;font-size:0.82rem;">{{ config&&config.email||'illeesam@gmail.com' }}</a>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
          <span>카카오채널</span>
          <span style="font-weight:700;color:var(--text-primary);">@shopjoy</span>
        </div>
      </div>
    </div>

  </div>

  <!-- 교통편 안내 -->
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:clamp(16px,3vw,24px);">
    <div style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:16px;">🚌 교통편 안내</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:clamp(8px,1.5vw,12px);">
      <div style="padding:14px;background:var(--bg-base);border-radius:10px;">
        <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">🚇 지하철</div>
        <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.8;">
          <div>8호선 성남역 2번 출구</div>
          <div style="color:var(--text-muted);font-size:0.78rem;">도보 약 10분</div>
        </div>
      </div>
      <div style="padding:14px;background:var(--bg-base);border-radius:10px;">
        <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">🚌 버스</div>
        <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.8;">
          <div>성남대로 정류장 하차</div>
          <div style="color:var(--text-muted);font-size:0.78rem;">220, 500번 이용</div>
        </div>
      </div>
      <div style="padding:14px;background:var(--bg-base);border-radius:10px;">
        <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">🚗 자가용</div>
        <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.8;">
          <div>성남IC에서 약 5분</div>
          <div style="color:var(--text-muted);font-size:0.78rem;">건물 내 주차 가능 (무료 2시간)</div>
        </div>
      </div>
    </div>
  </div>

  <style>
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>

</div>
  `,
};
