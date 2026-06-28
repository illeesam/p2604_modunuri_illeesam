/**
 * 개발도구 — 카카오 지도 API 테스트
 */
window.ZdTestMapKakao = {
  name: 'ZdTestMapKakao',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted, onUnmounted, nextTick } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const cfg = reactive({ jsKey: '' });

    const form = reactive({
      lat:     37.5665,
      lng:     126.9780,
      zoom:    3,
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

    let kakaoMap = null;
    let marker   = null;

    const cfgFormColumns = [
      { key: 'jsKey', label: 'JavaScript 키', type: 'text', required: true,
        placeholder: 'sy_prop: app.ext-sdk.kakao-map-js-key', mono: true, colSpan: 3,
        hint: 'app.ext-sdk.kakao-map-js-key' },
    ];

    const mapFormColumns = [
      { key: 'lat',  label: '위도', type: 'number', hint: 'lat' },
      { key: 'lng',  label: '경도', type: 'number', hint: 'lng' },
      { key: 'zoom', label: '줌 레벨 (1=가까움)', type: 'number', hint: 'zoom' },
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
        // /all 엔드포인트: 현재 active profile 기준으로 resolved 값 반환 (profile-aware)
        const r1 = await boApi.get('/bo/sy/app-config/all', coUtil.cofApiHdr('카카오 지도 테스트', '키 조회'));
        const ymlItems = r1.data?.data?.items || [];
        const kakaoItem = ymlItems.find(it => it.ymlKey === 'app.ext-sdk.kakao-map-js-key' || it.ymlKey === 'app.ext-sdk.kakao-js-key');
        if (kakaoItem?.ymlValue && kakaoItem.ymlValue !== '(미설정)') {
          cfg.jsKey = kakaoItem.ymlValue;
        }
        // /all 에 없으면 sy_prop 직접 조회 (propProfile 포함해 최적값 선택)
        if (!cfg.jsKey) {
          const r2 = await boApiSvc.syProp.getList({ propKeys: 'app.ext-sdk.kakao-map-js-key,app.ext-sdk.kakao-js-key' }, '카카오 지도 테스트', '키 조회');
          const list = r2?.data?.data || [];
          // 값이 있는 행 중 propProfile 에 local 또는 dev 포함한 행 우선, 없으면 아무거나
          const withVal = list.filter(p => p.propValue);
          const preferred = withVal.find(p => (p.propProfile || '').includes('local') || (p.propProfile || '').includes('dev'))
            || withVal[0];
          if (preferred) cfg.jsKey = preferred.propValue;
        }
      } catch (e) {
        result.error = 'sy_prop 조회 실패: ' + (e.message || e);
      }
      // 키가 있으면 자동으로 SDK 로드 + 렌더링
      if (cfg.jsKey) {
        loadSdk();
      } else {
        checkSdk();
      }
    });

    onUnmounted(() => {
      kakaoMap = null;
      marker   = null;
    });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const checkSdk = () => {
      const ok = !!(window.kakao?.maps);
      uiState.sdkLoaded = ok;
      result.sdkUrl     = cfg.jsKey ? 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=...&autoload=false' : '';
      result.sdkStatus  = ok
        ? '✅ Kakao Maps SDK 로드됨'
        : '❌ Kakao Maps SDK 없음 — JavaScript 키 설정 후 [SDK 로드] 버튼 클릭';
      result.initDetail = ok ? ('앱키: ' + (cfg.jsKey || '(미설정)')) : '';
    };

    const loadSdk = () => {
      if (!cfg.jsKey) { showToast('JavaScript 키를 입력하세요.', 'error'); return; }

      // 이미 완전 로드된 경우 — 바로 렌더
      if (window.kakao?.maps) {
        checkSdk();
        renderMap();
        return;
      }

      // 이전에 삽입한 script 태그가 아직 로딩 중 → onload 콜백을 추가로 걸어둠
      const existing = document.querySelector('script[data-kakao-maps]');
      if (existing) {
        result.sdkStatus = '⏳ SDK 로딩 중…';
        // onload 가 이미 발화됐지만 kakao.maps 가 없는 상태 = 키 오류로 실패한 경우
        // 이 경우를 감지해 재시도: 기존 script 제거 후 새로 삽입
        const wasLoaded = existing.dataset.loaded === '1';
        if (wasLoaded) {
          existing.remove();
          // 재귀로 새 script 삽입
          loadSdk();
          return;
        }
        // 진짜 로딩 중 → 콜백만 등록
        const prev = existing.onload;
        existing.onload = () => {
          if (prev) prev();
          if (window.kakao?.maps) {
            kakao.maps.load(() => { checkSdk(); renderMap(); });
          }
        };
        return;
      }

      result.sdkStatus = '⏳ SDK 로딩 중…';
      const script = document.createElement('script');
      script.setAttribute('data-kakao-maps', '1');
      script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=' + cfg.jsKey + '&libraries=services&autoload=false';
      script.onload = () => {
        script.dataset.loaded = '1';
        kakao.maps.load(() => {
          checkSdk();
          showToast('Kakao Maps SDK 로드 완료', 'success');
          renderMap();
        });
      };
      script.onerror = () => {
        script.dataset.loaded = '1'; // 실패도 loaded 마킹 (재시도 감지용)
        result.sdkStatus = '❌ SDK 로드 실패 — JavaScript 키 오류 또는 도메인 미등록 (127.0.0.1:5501 허용 확인)';
        showToast('Kakao Maps SDK 로드 실패', 'error', 0);
      };
      document.head.appendChild(script);
    };

    const renderMap = () => {
      nextTick(() => {
        const container = document.getElementById('zd-kakao-map');
        if (!container || !window.kakao?.maps) return;
        const options = {
          center: new kakao.maps.LatLng(form.lat, form.lng),
          level:  form.zoom,
        };
        kakaoMap = new kakao.maps.Map(container, options);
        if (marker) marker.setMap(null);
        marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(form.lat, form.lng),
          map:      kakaoMap,
        });
        uiState.mapLoaded = true;
        showToast('지도 렌더링 완료', 'success');
      });
    };

    const moveMap = () => {
      if (!kakaoMap) { showToast('지도를 먼저 렌더링하세요.', 'error'); return; }
      const pos = new kakao.maps.LatLng(parseFloat(form.lat), parseFloat(form.lng));
      kakaoMap.setCenter(pos);
      kakaoMap.setLevel(parseInt(form.zoom));
      if (marker) marker.setPosition(pos);
    };

    const geocode = () => {
      if (!window.kakao?.maps?.services) { showToast('services 라이브러리가 로드되지 않았습니다.', 'error'); return; }
      if (!form.address) { showToast('주소를 입력하세요.', 'error'); return; }
      uiState.loading = true;
      result.error    = '';
      result.geocodeResult = null;
      const geocoder = new kakao.maps.services.Geocoder();
      geocoder.addressSearch(form.address, (data, status) => {
        uiState.loading = false;
        if (status !== kakao.maps.services.Status.OK) {
          result.error = '주소 검색 실패: ' + status;
          showToast('주소 검색 실패', 'error', 0);
          return;
        }
        const item = data[0];
        result.geocodeResult = item;
        form.lat = parseFloat(item.y);
        form.lng = parseFloat(item.x);
        showToast('주소 검색 성공', 'success');
        if (kakaoMap) moveMap();
      });
    };

    const saveKey = async () => {
      if (!cfg.jsKey) { showToast('JavaScript 키를 입력하세요.', 'error'); return; }
      try {
        await boApi.put('/bo/sy/prop/bulk', [
          { propKey: 'app.ext-sdk.kakao-map-js-key', propValue: cfg.jsKey },
        ], coUtil.cofApiHdr('카카오 지도 테스트', '키 저장'));
        showToast('sy_prop 에 저장되었습니다.', 'success');
      } catch (e) {
        showToast(e.response?.data?.message || e.message || '저장 실패', 'error', 0);
      }
    };

    const cfGeocodeRows = () => {
      if (!result.geocodeResult) return [];
      const g = result.geocodeResult;
      return [
        { _label: '도로명 주소', _value: g.road_address ? g.road_address.address_name : '-' },
        { _label: '지번 주소',   _value: g.address_name },
        { _label: '위도',        _value: g.y },
        { _label: '경도',        _value: g.x },
      ];
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd) => {
      if (cmd === 'sdk-load')   return loadSdk();
      if (cmd === 'map-render') return renderMap();
      if (cmd === 'map-move')   return moveMap();
      if (cmd === 'geocode')    return geocode();
      if (cmd === 'key-save')   return saveKey();
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
  <div class="page-title">카카오 지도 API 테스트</div>

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
      <div style="position:relative;width:100%;height:360px;">
        <div id="zd-kakao-map" style="width:100%;height:100%;border:1px solid #ddd;border-radius:6px;background:#f0f0f0;"></div>
        <div v-if="!uiState.mapLoaded" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;">
          <span style="color:#999;font-size:13px">SDK 로드 후 지도가 여기 표시됩니다</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 주소 검색 (지오코딩) -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">주소 검색 (지오코딩)</span>
      <div style="margin-left:auto">
        <button class="btn btn_search" :disabled="uiState.loading" @click="handleBtnAction('geocode')">
          {{ uiState.loading ? '⏳ 조회 중…' : '주소 검색' }}
        </button>
      </div>
    </div>
    <div style="padding:12px">
      <bo-form-area :columns="geocodeFormColumns" :form="form" :errors="{}" :cols="3" :show-actions="false" :readonly="false" />
      <div v-if="result.error" style="padding:8px;background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;font-size:12px;color:#b91c1c">{{ result.error }}</div>
      <div v-if="result.geocodeResult" style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:10px;margin-top:8px">
        <div style="font-weight:600;margin-bottom:6px;color:#15803d">✅ 주소 검색 결과</div>
        <bo-grid :columns="geocodeGridColumns" :rows="cfGeocodeRows()" :show-row-num="false" />
      </div>
    </div>
  </div>

  <!-- 안내 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">설정 안내</span></div>
    <div style="padding:12px;font-size:12px;line-height:1.8;color:#444">
      <b>1.</b> Kakao Developers → 앱 생성 → 플랫폼 → Web → 사이트 도메인에 <code>http://127.0.0.1:5501</code> 추가<br>
      <b>2.</b> 제품 설정 → 카카오맵 → 활성화 ON<br>
      <b>3.</b> 앱 키 → JavaScript 키 복사<br>
      <b>4.</b> sy_prop <code>app.ext-sdk.kakao-map-js-key</code> 에 JavaScript 키 등록<br>
      <b>5.</b> Kakao 지도 줌 레벨은 숫자가 클수록 멀어집니다 (Naver/Google 과 반대)
    </div>
  </div>

  <bo-zd-yml-grid endpoint="/bo/sy/app-config/map" title="application.yml — 지도 API 설정" />
  <bo-zd-sy-prop-grid prop-key-prefixes="app.ext-sdk.kakao-map" default-prop-key-filter="app.ext-sdk.kakao-map" />
</div>`,
};
