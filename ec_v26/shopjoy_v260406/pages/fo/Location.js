/* ShopJoy - Location Page (위치안내) */
window.Location = {
  name: 'Location',
  props: {
    navigate: { type: Function, required: true },        // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, onMounted, watch } = Vue;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, mapProvider: 'kakao', mapSrc: '' });
    const codes = reactive({});


    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ Location.js : handleBtnAction -> ', cmd, param);
      // 홈으로 이동
      if (cmd === 'page-goHome') {
        return props.navigate('home');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    const LAT  = 37.4407;
    const LNG  = 127.1468;
    const ADDR = '경기도 성남시 중원구 성남대로 997번길 49-14';
    const ADDR_ENC = encodeURIComponent(ADDR);   // 지도 URL 쿼리용 인코딩 주소


    /* 지도 iframe src — 카카오 → 구글 → OSM 순 */
       // 현재 사용 중인 제공자

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

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* onMapError — 이벤트 */
    const onMapError = () => {
      if (uiState.mapProvider === 'google') {
        uiState.mapProvider = 'osm';
        uiState.mapSrc = PROVIDERS.osm;
      } else {
        uiState.mapError = true;
      }
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      const appKey = (window.SITE_CONFIG && window.SITE_CONFIG.kakaoMapKey) || '';
      if (appKey) {
      const s = document.createElement('script');
      s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
      s.onload = () => {
      kakao.maps.load(() => {
      const el = document.getElementById('shopjoy-map');
      if (!el) { return; }
      const map = new kakao.maps.Map(el, {
      center: new kakao.maps.LatLng(LAT, LNG),
      level: 4,
    });
            new kakao.maps.Marker({
              map,
              position: new kakao.maps.LatLng(LAT, LNG),
              title: 'ShopJoy 본사',
            });
            uiState.mapProvider = 'kakao_sdk';
          });
        };
        s.onerror = () => {
          uiState.mapProvider = 'google';
          uiState.mapSrc = PROVIDERS.google;
        };
        document.head.appendChild(s);
      } else {
        /* API key 없음 → Google embed */
        uiState.mapProvider = 'google';
        uiState.mapSrc = PROVIDERS.google;
      }
    });

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      uiState,       // 상태
      handleBtnAction, // dispatch
      onMapError, // 이벤트
      kakaoLink, naverLink, googleLink, ADDR, // 데이터
    };
  },

  template: /* html */ `
<fo-page title="위치안내" eyebrow="About"
  banner-img="assets/cdn/prod/img/page-title/page-title-1.jpg"
  banner-align="center 40%"
  :crumbs="[{ label:'홈', page:'home' }, { label:'위치안내' }]"
  @nav="() => handleBtnAction('page-goHome')">
  <!-- ===== ■. 지도 영역 =================================================== -->
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:24px;">
    <!-- ===== ■.■. 카카오 SDK 모드: div 컨테이너 ================================== -->
    <div v-if="uiState.mapProvider==='kakao_sdk'"
      id="shopjoy-map"
      style="width:100%;height:clamp(220px,40vw,320px);">
    </div>
    <!-- ===== □.□. 카카오 SDK 모드: div 컨테이너 ================================== -->
    <!-- ===== ■.■. iframe 모드 (Google / OSM) ============================== -->
    <iframe v-else-if="!uiState.mapError ? uiState.mapSrc : false" :src="uiState.mapSrc" width="100%" style="border:0;display:block;height:clamp(220px,40vw,320px);" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade" @error="onMapError">
  </iframe>
  <!-- ===== □.□. iframe 모드 (Google / OSM) ============================== -->
  <!-- ===== ■.■. 로딩 중 (mapSrc 아직 미설정) ================================== -->
  <div v-else-if="!uiState.mapError ? !uiState.mapSrc : false" style="height:clamp(220px,40vw,320px);display:flex;align-items:center;justify-content:center;background:var(--bg-base);color:var(--text-muted);font-size:13px;gap:8px;">
  <span style="animation:spin .8s linear infinite;display:inline-block;">
    ⏳
  </span>
  지도 로딩 중…
</div>
<!-- ===== □.□. 로딩 중 (mapSrc 아직 미설정) ================================== -->
<!-- ===== ■.■. 에러 fallback =========================================== -->
<div v-else
      style="height:clamp(220px,40vw,320px);display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-base);gap:12px;">
  <div style="font-size:2.5rem;">
    🗺️
  </div>
  <div style="font-size:13px;color:var(--text-muted);">
    지도를 불러올 수 없습니다.
  </div>
  <a :href="googleLink" target="_blank"
        style="font-size:12px;padding:7px 18px;border-radius:20px;background:var(--blue);color:#fff;text-decoration:none;font-weight:600;">
    외부 지도에서 보기 →
  </a>
</div>
<!-- ===== □.□. 에러 fallback =========================================== -->
<!-- ===== ■.■. 하단 바: 주소 + 지도앱 링크 ===================================== -->
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
<!-- ===== □.□. 하단 바: 주소 + 지도앱 링크 ===================================== -->
<!-- ===== □. 지도 영역 =================================================== -->
<!-- ===== ■. 상세 정보 =================================================== -->
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:clamp(10px,2vw,16px);margin-bottom:24px;">
  <!-- ===== ■.■. 주소 ==================================================== -->
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
      <div style="width:40px;height:40px;border-radius:10px;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">
        📍
      </div>
      <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">
        주소
      </div>
    </div>
    <div style="font-size:0.88rem;color:var(--text-secondary);line-height:1.8;">
      <div style="font-weight:600;color:var(--text-primary);margin-bottom:4px;">
        경기도 성남시 중원구
      </div>
      <div>
        성남대로 997번길 49-14, 201호
      </div>
      <div style="margin-top:8px;font-size:0.8rem;color:var(--text-muted);">
        우편번호: 13401
      </div>
    </div>
  </div>
  <!-- ===== □.□. 주소 ==================================================== -->
  <!-- ===== ■.■. 영업시간 ================================================== -->
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
      <div style="width:40px;height:40px;border-radius:10px;background:var(--green-dim);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">
        🕐
      </div>
      <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">
        영업시간
      </div>
    </div>
    <div style="font-size:0.87rem;color:var(--text-secondary);line-height:2;">
      <div style="display:flex;justify-content:space-between;">
        <span>
          월요일 ~ 금요일
        </span>
        <span style="font-weight:700;color:var(--text-primary);">
          09:00 – 18:00
        </span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span>
          토요일
        </span>
        <span style="font-weight:700;color:var(--text-primary);">
          10:00 – 15:00
        </span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span>
          일요일 / 공휴일
        </span>
        <span style="font-weight:600;color:#ef4444;">
          휴무
        </span>
      </div>
    </div>
  </div>
  <!-- ===== □.□. 영업시간 ================================================== -->
  <!-- ===== ■.■. 연락처 =================================================== -->
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
      <div style="width:40px;height:40px;border-radius:10px;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">
        📞
      </div>
      <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">
        연락처
      </div>
    </div>
    <div style="font-size:0.87rem;color:var(--text-secondary);line-height:2;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span>
          전화
        </span>
        <a :href="'tel:'+(config?.tel||'010-3805-0206')" style="font-weight:700;color:var(--blue);text-decoration:none;">
        {{ config&&config.tel||'010-3805-0206' }}
      </a>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span>
        이메일
      </span>
      <a :href="'mailto:'+(config?.email||'illeesam@gmail.com')" style="font-weight:700;color:var(--blue);text-decoration:none;font-size:0.82rem;">
      {{ config&&config.email||'illeesam@gmail.com' }}
    </a>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
    <span>
      카카오채널
    </span>
    <span style="font-weight:700;color:var(--text-primary);">
      @shopjoy
    </span>
  </div>
</div>
</div>
</div>
<!-- ===== □.□. 연락처 =================================================== -->
<!-- ===== □. 상세 정보 =================================================== -->
<!-- ===== ■. 교통편 안내 ================================================== -->
<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:clamp(16px,3vw,24px);">
  <div style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:16px;">
    🚌 교통편 안내
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:clamp(8px,1.5vw,12px);">
    <div style="padding:14px;background:var(--bg-base);border-radius:10px;">
      <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">
        🚇 지하철
      </div>
      <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.8;">
        <div>
          8호선 성남역 2번 출구
        </div>
        <div style="color:var(--text-muted);font-size:0.78rem;">
          도보 약 10분
        </div>
      </div>
    </div>
    <div style="padding:14px;background:var(--bg-base);border-radius:10px;">
      <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">
        🚌 버스
      </div>
      <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.8;">
        <div>
          성남대로 정류장 하차
        </div>
        <div style="color:var(--text-muted);font-size:0.78rem;">
          220, 500번 이용
        </div>
      </div>
    </div>
    <div style="padding:14px;background:var(--bg-base);border-radius:10px;">
      <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">
        🚗 자가용
      </div>
      <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.8;">
        <div>
          성남IC에서 약 5분
        </div>
        <div style="color:var(--text-muted);font-size:0.78rem;">
          건물 내 주차 가능 (무료 2시간)
        </div>
      </div>
    </div>
  </div>
</div>
<!-- ===== □. 교통편 안내 ================================================== -->
<!-- ===== ■. 영역 ====================================================== -->
<style>
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</fo-page>
<!-- ===== □. 영역 ====================================================== -->
`,
};
