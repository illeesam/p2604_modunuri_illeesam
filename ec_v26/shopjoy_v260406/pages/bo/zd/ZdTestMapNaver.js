/**
 * 개발도구 — 네이버 지도 API 테스트
 */
window.ZdTestMapNaver = {
  name: 'ZdTestMapNaver',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted, onUnmounted } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const cfg = reactive({ clientId: '' });

    const form = reactive({
      lat:     37.5665,
      lng:     126.9780,
      zoom:    15,
      address: '서울특별시 중구 태평로1가 31',
    });

    const result = reactive({
      sdkStatus:    '',
      geocodeResult: null,
      error:        '',
    });

    const uiState = reactive({ sdkLoaded: false, mapLoaded: false, loading: false });

    let naverMap = null;
    let marker   = null;

    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      try {
        const res = await boApiSvc.syProp?.getList?.({ propKeys: 'ext.sdk.naverMapClientId' }, '네이버 지도 API 테스트', '키 조회');
        const list = res?.data?.data || [];
        list.forEach(p => {
          if (p.propKey === 'ext.sdk.naverMapClientId') cfg.clientId = p.propValue || '';
        });
      } catch (e) {
        result.error = 'sy_prop 조회 실패: ' + (e.message || e);
      }
      checkSdk();
    });

    onUnmounted(() => {
      if (naverMap) { naverMap.destroy?.(); naverMap = null; }
    });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const checkSdk = () => {
      const ok = !!(window.naver?.maps);
      uiState.sdkLoaded = ok;
      result.sdkStatus  = ok
        ? '✅ Naver Maps SDK 로드됨'
        : '❌ Naver Maps SDK 없음 — clientId 설정 후 [SDK 로드] 버튼 클릭';
    };

    const loadSdk = () => {
      if (!cfg.clientId) { showToast('Client ID 를 입력하세요.', 'error'); return; }
      if (window.naver?.maps) { renderMap(); return; }
      const script = document.createElement('script');
      script.src = 'https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=' + cfg.clientId + '&submodules=geocoder';
      script.onload = () => {
        checkSdk();
        showToast('Naver Maps SDK 로드 완료', 'success');
        setTimeout(renderMap, 300);
      };
      script.onerror = () => {
        result.sdkStatus = '❌ SDK 로드 실패 — Client ID 오류 또는 네트워크 문제';
        showToast('Naver Maps SDK 로드 실패', 'error', 0);
      };
      document.head.appendChild(script);
    };

    const renderMap = () => {
      const container = document.getElementById('zd-naver-map');
      if (!container || !window.naver?.maps) return;
      if (naverMap) naverMap.destroy?.();
      naverMap = new naver.maps.Map(container, {
        center: new naver.maps.LatLng(form.lat, form.lng),
        zoom:   form.zoom,
      });
      marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(form.lat, form.lng),
        map:      naverMap,
      });
      uiState.mapLoaded = true;
      showToast('지도 렌더링 완료', 'success');
    };

    const moveMap = () => {
      if (!naverMap) { showToast('지도를 먼저 렌더링하세요.', 'error'); return; }
      const pos = new naver.maps.LatLng(parseFloat(form.lat), parseFloat(form.lng));
      naverMap.setCenter(pos);
      naverMap.setZoom(parseInt(form.zoom));
      if (marker) marker.setPosition(pos);
    };

    const geocode = () => {
      if (!window.naver?.maps?.Service) { showToast('Geocoder 서브모듈이 로드되지 않았습니다.', 'error'); return; }
      if (!form.address) { showToast('주소를 입력하세요.', 'error'); return; }
      uiState.loading = true;
      result.error    = '';
      naver.maps.Service.geocode({ query: form.address }, (status, response) => {
        uiState.loading = false;
        if (status !== naver.maps.Service.Status.OK) {
          result.error = '지오코딩 실패: ' + status;
          showToast('지오코딩 실패', 'error', 0);
          return;
        }
        const item = response.v2.addresses[0];
        if (!item) { result.error = '주소 검색 결과 없음'; return; }
        result.geocodeResult = item;
        form.lat = parseFloat(item.y);
        form.lng = parseFloat(item.x);
        showToast('지오코딩 성공', 'success');
        if (naverMap) moveMap();
      });
    };

    const saveKey = async () => {
      if (!cfg.clientId) { showToast('Client ID 를 입력하세요.', 'error'); return; }
      try {
        await boApi.put('/bo/sy/prop/bulk', [
          { propKey: 'ext.sdk.naverMapClientId', propValue: cfg.clientId },
        ], coUtil.apiHdr('네이버 지도 테스트', '키 저장'));
        showToast('sy_prop 에 저장되었습니다.', 'success');
      } catch (e) {
        showToast(e.response?.data?.message || e.message || '저장 실패', 'error', 0);
      }
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd) => {
      if (cmd === 'sdk-load')    return loadSdk();
      if (cmd === 'map-render')  return renderMap();
      if (cmd === 'map-move')    return moveMap();
      if (cmd === 'geocode')     return geocode();
      if (cmd === 'key-save')    return saveKey();
    };

    return { cfg, form, result, uiState, handleBtnAction };
  },

  template: `
<div>
  <div class="page-title">네이버 지도 API 테스트</div>

  <!-- 키 설정 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">API 키 설정</span></div>
    <div style="padding:12px">
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:1">
          <label class="form-label">NCP Client ID <span style="color:#e74c3c">*</span></label>
          <input class="form-control" v-model="cfg.clientId" placeholder="sy_prop: ext.sdk.naverMapClientId" style="font-family:monospace" />
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

  <!-- 지도 + 좌표 이동 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">지도 미리보기</span>
      <div style="margin-left:auto;display:flex;gap:6px">
        <button class="btn btn_apply" @click="handleBtnAction('map-render')">지도 다시 렌더링</button>
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
      <div id="zd-naver-map" style="width:100%;height:360px;border:1px solid #ddd;border-radius:6px;background:#f0f0f0;display:flex;align-items:center;justify-content:center">
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
          <tr><td style="padding:2px 8px;color:#555;width:100px">도로명 주소</td><td>{{ result.geocodeResult.roadAddress }}</td></tr>
          <tr><td style="padding:2px 8px;color:#555">지번 주소</td><td>{{ result.geocodeResult.jibunAddress }}</td></tr>
          <tr><td style="padding:2px 8px;color:#555">위도</td><td>{{ result.geocodeResult.y }}</td></tr>
          <tr><td style="padding:2px 8px;color:#555">경도</td><td>{{ result.geocodeResult.x }}</td></tr>
        </table>
      </div>
    </div>
  </div>

  <!-- 안내 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">설정 안내</span></div>
    <div style="padding:12px;font-size:12px;line-height:1.8;color:#444">
      <b>1.</b> Naver Cloud Platform → Application → Maps 서비스 등록<br>
      <b>2.</b> Web Dynamic Map + Geocoding API 활성화<br>
      <b>3.</b> 허용 도메인에 <code>127.0.0.1</code>, <code>localhost</code> 추가<br>
      <b>4.</b> sy_prop <code>ext.sdk.naverMapClientId</code> 에 Client ID 등록<br>
      <b>5.</b> FO 매장 위치 페이지(Location.js)에서 실제 렌더링 확인
    </div>
  </div>

  <bo-zd-yml-grid />
  <bo-zd-sy-prop-grid prop-key-prefixes="ext.sdk.naverMapClientId" default-prop-key-filter="ext.sdk.naverMap" />
</div>`,
};
