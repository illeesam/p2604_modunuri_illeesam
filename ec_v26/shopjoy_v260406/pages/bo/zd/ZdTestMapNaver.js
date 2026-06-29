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
      sdkUrl:       '',
      initDetail:   '',
      geocodeResult: null,
      error:        '',
    });

    const uiState = reactive({ sdkLoaded: false, mapLoaded: false, loading: false });

    let naverMap = null;
    let marker   = null;

    const cfgFormColumns = [
      { key: 'clientId', label: 'NCP Client ID', type: 'text', required: true,
        placeholder: 'sy_prop: app.map.naver-map-client-id', mono: true, colSpan: 3,
        hint: 'app.map.naver-map-client-id' },
    ];

    const mapFormColumns = [
      { key: 'lat',  label: '위도', type: 'number', hint: 'lat' },
      { key: 'lng',  label: '경도', type: 'number', hint: 'lng' },
      { key: 'zoom', label: '줌',   type: 'number', hint: 'zoom' },
    ];

    const geocodeFormColumns = [
      { key: 'address', label: '주소', type: 'text', colSpan: 3, hint: 'address' },
    ];

    const geocodeGridColumns = [
      { key: '_label', label: '항목',  cellStyle: 'color:#555;width:100px' },
      { key: '_value', label: '값' },
    ];

    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      try {
        const res = await boApiSvc.syProp?.getList?.({ propKeys: 'app.map.naver-map-client-id' }, '네이버 지도 API 테스트', '키 조회');
        const list = res?.data?.data || [];
        // 동일 propKey가 여러 프로파일 행으로 올 수 있음 → local/dev 우선, 없으면 값 있는 행
        const pickVal = (key) => {
          const rows = list.filter(p => p.propKey === key && p.propValue);
          const preferred = rows.find(p => /local|dev/.test(p.propProfile || '')) || rows[0];
          return preferred?.propValue || '';
        };
        cfg.clientId = pickVal('app.map.naver-map-client-id');
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
      result.sdkUrl     = 'https://openapi.map.naver.com/openapi/v3/maps.js';
      result.sdkStatus  = ok
        ? '✅ Naver Maps SDK 로드됨'
        : '❌ Naver Maps SDK 없음 — clientId 설정 후 [SDK 로드] 버튼 클릭';
      result.initDetail = ok ? ('Client ID: ' + (cfg.clientId || '(미설정)')) : '';
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
          { propKey: 'app.map.naver-map-client-id', propValue: cfg.clientId },
        ], coUtil.cofApiHdr('네이버 지도 테스트', '키 저장'));
        showToast('sy_prop 에 저장되었습니다.', 'success');
      } catch (e) {
        showToast(e.response?.data?.message || e.message || '저장 실패', 'error', 0);
      }
    };

    const cfGeocodeRows = () => {
      if (!result.geocodeResult) return [];
      const g = result.geocodeResult;
      return [
        { _label: '도로명 주소', _value: g.roadAddress },
        { _label: '지번 주소',   _value: g.jibunAddress },
        { _label: '위도',        _value: g.y },
        { _label: '경도',        _value: g.x },
      ];
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd) => {
      if (cmd === 'sdk-load')    return loadSdk();
      if (cmd === 'map-render')  return renderMap();
      if (cmd === 'map-move')    return moveMap();
      if (cmd === 'geocode')     return geocode();
      if (cmd === 'key-save')    return saveKey();
    };

    return {
      cfg, form, result, uiState,
      cfgFormColumns, mapFormColumns, geocodeFormColumns, geocodeGridColumns,
      cfGeocodeRows,
      handleBtnAction,
    };
  },

  template: `
<div>
  <div class="page-title">네이버 지도 API 테스트</div>

  <!-- 키 설정 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">API 키 설정</span>
      <div style="margin-left:auto;display:flex;gap:6px">
        <button class="btn btn_save" @click="handleBtnAction('key-save')">sy_prop 저장</button>
        <button class="btn btn_apply" @click="handleBtnAction('sdk-load')">SDK 로드 + 지도 렌더링</button>
      </div>
    </div>
    <div style="padding:12px">
      <bo-form-area :columns="cfgFormColumns" :form="cfg" :errors="{}" :cols="3" :show-actions="false" :readonly="false" />
      <div style="font-size:12px;color:#666;padding:6px 8px;background:#f8f9fa;border-radius:4px;line-height:2">
        <div>SDK 상태: <strong>{{ result.sdkStatus || '확인 중…' }}</strong><span v-if="result.sdkUrl" style="margin-left:8px;color:#aaa;font-family:monospace;font-size:11px;">{{ result.sdkUrl }}</span></div>
        <div>초기화 상태: <strong>{{ result.initDetail || (uiState.sdkLoaded ? '초기화 완료' : '미초기화') }}</strong></div>
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
      <bo-form-area :columns="mapFormColumns" :form="form" :errors="{}" :cols="3" :show-actions="false" :readonly="false" />
      <div id="zd-naver-map" style="width:100%;height:360px;border:1px solid #ddd;border-radius:6px;background:#f0f0f0;display:flex;align-items:center;justify-content:center">
        <span v-if="!uiState.mapLoaded" style="color:#999;font-size:13px">SDK 로드 후 지도가 여기 표시됩니다</span>
      </div>
    </div>
  </div>

  <!-- 지오코딩 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">지오코딩 (주소 → 좌표)</span>
      <div style="margin-left:auto">
        <button class="btn btn_search" :disabled="uiState.loading" @click="handleBtnAction('geocode')">
          {{ uiState.loading ? '⏳ 조회 중…' : '지오코딩' }}
        </button>
      </div>
    </div>
    <div style="padding:12px">
      <bo-form-area :columns="geocodeFormColumns" :form="form" :errors="{}" :cols="3" :show-actions="false" :readonly="false" />
      <div v-if="result.error" style="padding:8px;background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;font-size:12px;color:#b91c1c">{{ result.error }}</div>
      <div v-if="result.geocodeResult" style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:10px;margin-top:8px">
        <div style="font-weight:600;margin-bottom:6px;color:#15803d">✅ 지오코딩 결과</div>
        <bo-grid :columns="geocodeGridColumns" :rows="cfGeocodeRows()" :show-row-num="false" />
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
      <b>4.</b> sy_prop <code>app.map.naver-map-client-id</code> 에 Client ID 등록<br>
      <b>5.</b> FO 매장 위치 페이지(Location.js)에서 실제 렌더링 확인
    </div>
  </div>

  <bo-zd-sy-prop-grid prop-key-prefixes="app.map." default-prop-key-filter="app.map.naver" />
  <bo-zd-yml-grid endpoint="/bo/sy/app-config/map" default-key-filter="app.map.naver" />
</div>`,
};
