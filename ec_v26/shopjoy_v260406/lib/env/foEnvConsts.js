/* ShopJoy - 외부 연동 상수 모음 (FO / foEnvConsts)
 * ─────────────────────────────────────────────────────────────────────────
 * 코드 곳곳에 흩어지기 쉬운 외부 SDK/서비스의 고정 상수(테스트 키, SDK URL,
 * OAuth 엔드포인트, 택배 추적 URL 등)를 한 곳에 모은다.
 *   · 운영용 비밀키/클라이언트키는 여기에 두지 않는다 → 사이트 설정(AppStore svXxxKey)에서 주입.
 *   · 여기에 두는 것은 "공개 가능한 상수" 만: 토스 공식 문서 테스트 키, 표준 SDK URL, 공개 트래킹 URL.
 *   · 🔑 각 키의 발급처(외부 콘솔) → 저장 위치(AppStore svXxx) → 사용처 표는 lib/utils/coExtSdk.js 상단 참조.
 *
 * 전역: window.foEnvConsts (FO 전용 — index.html 에서 로드)
 * 로드 순서: coExtSdk.js / 각 페이지보다 먼저 (index.html)
 * ───────────────────────────────────────────────────────────────────────── */
(function () {
  window.foEnvConsts = {
    /* ── 실행 모드 ── ('local' | 'dev' | 'prod')
     * 환경별 분기(테스트키 폴백 허용·디버그 로그·API 베이스 등)에 사용. */
    runMode: 'local',  // local, dev, prod

    /* ── 토스페이먼츠 ── */
    toss: {
      /* 공식 문서용 테스트 클라이언트 키 (결제위젯). svTossClientKey 미설정 시 폴백.
       * 실 결제는 사이트 설정의 tossClientKey(운영키)가 있어야 함. */
      TEST_CLIENT_KEY: 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm',
      TEST_SECRET_KEY: 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6',
      /* v2 표준 SDK (index.html 에서 <script> 로드) */
      SDK_V2_URL: 'https://js.tosspayments.com/v2/standard',
    },

    /* ── OAuth / 소셜 ── */
    oauth: {
      GOOGLE_USERINFO_URL: 'https://www.googleapis.com/oauth2/v3/userinfo',
      NAVER_AUTHORIZE_URL: 'https://nid.naver.com/oauth2.0/authorize',
      /* 카카오는 Kakao JS SDK(Kakao.Auth.login) 사용 — 사용자정보 REST 엔드포인트 (SDK 미사용/직접 호출 시 폴백) */
      KAKAO_USERINFO_URL: 'https://kapi.kakao.com/v2/user/me',
    },

    /* ── 지도 SDK (동적 로드) ── */
    map: {
      KAKAO_SDK_URL: 'https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&libraries=services,clusterer&appkey=',
      NAVER_SDK_URL: 'https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=',
    },

    /* ── 택배 배송조회 URL (운송장번호 치환) ── */
    courierTracking: {
      'CJ대한통운':  'https://trace.cjlogistics.com/next/tracking.html?wblNo=',
      '롯데택배':    'https://www.lotteglogis.com/open/tracking?invno=',
      '한진택배':    'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnumText2=',
      '우체국택배':  'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=',
      '로젠택배':    'https://www.ilogen.com/web/personal/trace/',
    },
  };
})();
