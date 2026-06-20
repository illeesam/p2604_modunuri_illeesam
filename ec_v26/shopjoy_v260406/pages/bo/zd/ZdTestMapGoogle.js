/**
 * 개발도구 — 구글 지도 API 테스트
 */
window.ZdTestMapGoogle = {
  name: 'ZdTestMapGoogle',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted, onUnmounted } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const cfg = reactive({ apiKey: '' });

    const form = reactive({
      lat:     37.5665,
      lng:     126.9780,
      zoom:    15,
      address: '서울특별시 중구 태평로1가 31',
    });

    const result = reactive({
      sdkStatus:     '',
      geocodeResult: null,
      placeResult:   null,
      error:         '',
    });

    const uiState = reactive({ sdkLoaded: false, mapLoaded: false, loading: false });

    let googleMap = null;
    let gMarker   = null;

    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      try {
        const res = await boApiSvc.syProp?.getList?.({ propKeys: 'app.ext-sdk.google-map-api-key' }, '구글 지도 API 테스트', '키 조회');
        const list = res?.data?.data || [];
        list.forEach(p => {
          if (p.propKey === 'app.ext-sdk.google-map-api-key') cfg.apiKey = p.propValue || '';
        });
      } catch (e) {
        result.error = 'sy_prop 조회 실패: ' + (e.message || e);
      }
      checkSdk();
    });

    onUnmounted(() => { googleMap = null; gMarker = null; });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const checkSdk = () => {
      const ok = !!(window.google?.maps);
      uiState.sdkLoaded = ok;
      result.sdkStatus  = ok ? '✅ Google Maps SDK 로드됨' : '❌ Google Maps SDK 없음 — API 키 설정 후 [SDK 로드] 클릭';
    };

    const loadSdk = () => {
      if (!cfg.apiKey) { showToast('API Key 를 입력하세요.', 'error'); return; }
      if (window.google?.maps) { renderMap(); return; }
      // 이미 로드 중이면 스킵
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        const wait = setInterval(() => {
          if (window.google?.maps) { clearInterval(wait); checkSdk(); renderMap(); }
        }, 200);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=' + cfg.apiKey + '&libraries=places,geocoder&language=ko';
      script.onload = () => { checkSdk(); showToast('Google Maps SDK 로드 완료', 'success'); setTimeout(renderMap, 200); };
      script.onerror = () => { result.sdkStatus = '❌ SDK 로드 실패 — API 키 오류'; showToast('Google Maps SDK 로드 실패', 'error', 0); };
      document.head.appendChild(script);
    };

    const renderMap = () => {
      const container = document.getElementById('zd-google-map');
      if (!container || !window.google?.maps) return;
      googleMap = new google.maps.Map(container, {
        center: { lat: parseFloat(form.lat), lng: parseFloat(form.lng) },
        zoom:   parseInt(form.zoom),
      });
      gMarker = new google.maps.Marker({
        position: { lat: parseFloat(form.lat), lng: parseFloat(form.lng) },
        map:      googleMap,
      });
      uiState.mapLoaded = true;
      showToast('Google 지도 렌더링 완료', 'success');
    };

    const moveMap = () => {
      if (!googleMap) { showToast('지도를 먼저 렌더링하세요.', 'error'); return; }
      const pos = { lat: parseFloat(form.lat), lng: parseFloat(form.lng) };
      googleMap.setCenter(pos);
      googleMap.setZoom(parseInt(form.zoom));
      if (gMarker) gMarker.setPosition(pos);
    };

    const geocode = () => {
      if (!window.google?.maps?.Geocoder) { showToast('Geocoder 가 로드되지 않았습니다.', 'error'); return; }
      if (!form.address) { showToast('주소를 입력하세요.', 'error'); return; }
      uiState.loading = true;
      result.error    = '';
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: form.address, region: 'KR' }, (results, status) => {
        uiState.loading = false;
        if (status !== 'OK' || !results?.length) {
          result.error = '지오코딩 실패: ' + status;
          showToast('지오코딩 실패', 'error', 0);
          return;
        }
        const item = results[0];
        result.geocodeResult = {
          formattedAddress: item.formatted_address,
          lat: item.geometry.location.lat(),
          lng: item.geometry.location.lng(),
          placeId: item.place_id,
        };
        form.lat = result.geocodeResult.lat;
        form.lng = result.geocodeResult.lng;
        showToast('지오코딩 성공', 'success');
        if (googleMap) moveMap();
      });
    };

    const saveKey = async () => {
      if (!cfg.apiKey) { showToast('API Key 를 입력하세요.', 'error'); return; }
      try {
        await boApi.put('/bo/sy/prop/bulk', [
          { propKey: 'app.ext-sdk.google-map-api-key', propValue: cfg.apiKey },
        ], coUtil.cofApiHdr('구글 지도 테스트', '키 저장'));
        showToast('sy_prop 에 저장되었습니다.', 'success');
      } catch (e) {
        showToast(e.response?.data?.message || e.message || '저장 실패', 'error', 0);
      }
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd) => {
      if (cmd === 'sdk-load')   return loadSdk();
      if (cmd === 'map-render') return renderMap();
      if (cmd === 'map-move')   return moveMap();
      if (cmd === 'geocode')    return geocode();
      if (cmd === 'key-save')   return saveKey();
    };

    return { cfg, form, result, uiState, handleBtnAction };
  },

  template: `
<div>
  <div class="page-title">구글 지도 API 테스트</div>

  <!-- 키 설정 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">API 키 설정</span></div>
    <div style="padding:12px">
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:1">
          <label class="form-label">Google Maps API Key <span style="color:#e74c3c">*</span></label>
          <input class="form-control" v-model="cfg.apiKey" placeholder="sy_prop: app.ext-sdk.google-map-api-key" style="font-family:monospace" />
        </div>
        <div style="display:flex;align-items:flex-end;gap:6px;padding-bottom:1px">
          <button class="btn btn_save" @click="handleBtnAction('key-save')">sy_prop 저장</button>
          <button class="btn btn_apply" @click="handleBtnAction('sdk-load')">SDK 로드 + 지도 렌더링</button>
        </div>
      </div>
      <div style="font-size:12px;color:#666;padding:6px 8px;background:#f8f9fa;border-radius:4px">
        SDK 상태: <strong>{{ result.sdkStatus || '확인 중…' }}</strong>
      </div>
    </div>
  </div>

  <!-- 지도 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">지도 미리보기</span>
      <div style="margin-left:auto;display:flex;gap:6px">
        <button class="btn btn_apply" @click="handleBtnAction('map-render')">다시 렌더링</button>
        <button class="btn btn_confirm" @click="handleBtnAction('map-move')">좌표 이동</button>
      </div>
    </div>
    <div style="padding:12px">
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group">
          <label class="form-label">위도 (lat)</label>
          <input class="form-control" type="number" v-model="form.lat" style="width:140px" />
        </div>
        <div class="form-group">
          <label class="form-label">경도 (lng)</label>
          <input class="form-control" type="number" v-model="form.lng" style="width:140px" />
        </div>
        <div class="form-group">
          <label class="form-label">줌</label>
          <input class="form-control" type="number" v-model="form.zoom" style="width:80px" min="1" max="21" />
        </div>
      </div>
      <div id="zd-google-map" style="width:100%;height:360px;border:1px solid #ddd;border-radius:6px;background:#f0f0f0;display:flex;align-items:center;justify-content:center">
        <span v-if="!uiState.mapLoaded" style="color:#999;font-size:13px">SDK 로드 후 지도가 여기 표시됩니다</span>
      </div>
    </div>
  </div>

  <!-- 지오코딩 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">지오코딩 (주소 → 좌표)</span></div>
    <div style="padding:12px">
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:1">
          <label class="form-label">주소</label>
          <input class="form-control" v-model="form.address" @keyup.enter="handleBtnAction('geocode')" />
        </div>
        <div style="display:flex;align-items:flex-end;padding-bottom:1px">
          <button class="btn btn_search" :disabled="uiState.loading" @click="handleBtnAction('geocode')">
            {{ uiState.loading ? '⏳ 조회 중…' : '지오코딩' }}
          </button>
        </div>
      </div>
      <div v-if="result.error" style="padding:8px;background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;font-size:12px;color:#b91c1c">{{ result.error }}</div>
      <div v-if="result.geocodeResult" style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:10px;margin-top:8px">
        <div style="font-weight:600;margin-bottom:6px;color:#15803d">✅ 지오코딩 결과</div>
        <table style="font-size:12px;border-collapse:collapse">
          <tr><td style="padding:2px 8px;color:#555;width:120px">포맷 주소</td><td>{{ result.geocodeResult.formattedAddress }}</td></tr>
          <tr><td style="padding:2px 8px;color:#555">위도</td><td>{{ result.geocodeResult.lat }}</td></tr>
          <tr><td style="padding:2px 8px;color:#555">경도</td><td>{{ result.geocodeResult.lng }}</td></tr>
          <tr><td style="padding:2px 8px;color:#555">Place ID</td><td style="font-family:monospace;font-size:11px">{{ result.geocodeResult.placeId }}</td></tr>
        </table>
      </div>
    </div>
  </div>

  <!-- 안내 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">설정 안내</span></div>
    <div style="padding:12px;font-size:12px;line-height:1.8;color:#444">
      <b>1.</b> Google Cloud Console → Maps JavaScript API + Geocoding API 활성화<br>
      <b>2.</b> API 키 생성 → HTTP 리퍼러 제한: <code>127.0.0.1:*</code>, <code>localhost:*</code><br>
      <b>3.</b> sy_prop <code>app.ext-sdk.google-map-api-key</code> 에 API Key 등록<br>
      <b>4.</b> SDK 로드 → 지도 렌더링 → 지오코딩 순서로 테스트
    </div>
  </div>

  <bo-zd-yml-grid endpoint="/bo/sy/app-config/map" title="application.yml — 지도 API 설정" />
  <bo-zd-sy-prop-grid prop-key-prefixes="app.ext-sdk.,app.map." default-prop-key-filter="app.ext-sdk.google-map" />
</div>`,
};
