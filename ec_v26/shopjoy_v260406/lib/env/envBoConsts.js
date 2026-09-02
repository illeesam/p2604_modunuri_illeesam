/* ShopJoy - 외부 연동 상수 모음 (BO / envBoConsts)
 * ─────────────────────────────────────────────────────────────────────────
 * 코드 곳곳에 흩어지기 쉬운 외부 SDK/서비스의 고정 상수(테스트 키, SDK URL,
 * OAuth 엔드포인트, 택배 추적 URL 등)를 한 곳에 모은다.
 *   · 운영용 비밀키/클라이언트키는 여기에 두지 않는다 → 사이트 설정(AppStore svXxxKey)에서 주입.
 *   · 여기에 두는 것은 "공개 가능한 상수" 만: 토스 공식 문서 테스트 키, 표준 SDK URL, 공개 트래킹 URL.
 *   · 🔑 각 키의 발급처(외부 콘솔) → 저장 위치(AppStore svXxx) → 사용처 표는 lib/utils/coExtSdk.js 상단 참조.
 *
 * 전역: window.envBoConsts (BO 전용 — bo.html 에서 로드)
 * 로드 순서: coExtSdk.js / 각 페이지보다 먼저 (bo.html)
 *
 * ⭐ 프로파일별 파일 교체 (2026-09-03) ─────────────────────────────────────
 * 이 파일(=local 프로파일, Live Server가 원본을 그대로 로드) 외에 dev/prod 버전이
 * lib/env/profiles/envBoConsts.{dev,prod}.js 에 따로 있다. 배포 빌드 시
 * `npm run build:dev`(또는 build:prod)를 돌리면 scripts/buildMinify.js 가 그
 * 프로파일 파일을 dist/lib/env/envBoConsts.js 자리에 덮어써서 만든다 — 즉
 * "런타임에 지금이 무슨 환경인지 감지"하는 게 아니라 "빌드할 때 이미 정해서 넣는다."
 * local(Live Server)은 이 빌드 과정을 안 거치고 이 파일을 원본 그대로 쓰므로,
 * 이 파일 자체가 곧 local 프로파일이다.
 * ───────────────────────────────────────────────────────────────────────── */
(function () {
  window.envBoConsts = {
    /* ── 실행 모드 ── ('local' | 'dev' | 'prod')
     * 환경별 분기(테스트키 폴백 허용·디버그 로그·API 베이스 등)에 사용. */
    runMode: 'local',  // local, dev, prod

    /* ── 앱 표시 정보 ── (2026-09-03 추가) — 화면 타이틀/CI(로고) 등 프로파일별로 달라질 수 있는
     * 표시용 값. 지금은 소비하는 화면이 아직 없어도, 여기 한 곳만 보면 프로파일별 값을 바로
     * 알 수 있도록 미리 자리를 잡아둔다(하드코딩된 문자열이 화면 곳곳에 흩어지는 것 방지). */
    appTitle: 'ShopJoy BO',
    /* CI(로고) 이미지 경로 — 프론트 assets 기준 상대경로. 실제 이미지 파일은 준비되는 대로
     * assets/img/ci/ 아래 채워 넣을 것(현재는 자리만 예약). */
    appCiImage: 'assets/img/ci/bo-ci.svg',

    /* ── API 서버 host/port ── (2026-09-03 추가, 09-04 host+port 분리)
     * boApiAxios.js 의 apiUrl()/seoUrl() 이 이 값들로 절대(또는 상대) URL을 만든다.
     *   - baseApiHost '' (빈 문자열) = 상대경로. 지금 이 화면을 서빙한 origin(프로토콜+호스트+포트)
     *     그대로 요청 — nginx가 같은 origin 위에서 /api,/foui,/cdn 을 백엔드로 프록시해주는
     *     배포(NAS 등)에 맞음. 이땐 baseApiPort 는 읽지 않는다(무시됨).
     *   - baseApiHost 에 값이 있으면 그 호스트로 절대 URL 조립. baseApiPort 가 비어있으면
     *     포트 생략(80/443 기본 포트), 있으면 ':포트' 로 붙인다. 프로토콜은 지금 페이지와
     *     동일하게(http/https) 맞춘다(window.location.protocol) — 별도 필드 불필요.
     * local(이 파일)은 Live Server 기준으로 호스트명 + 포트 3000을 그대로 조립한다. */
    baseApiHost: window.location.hostname,
    baseApiPort: '3000',

    /* ── CDN(첨부파일 등 정적 리소스, /cdn/**) host/port ── (2026-09-03 추가, 09-04 host+port 분리)
     * boApiAxios.js 의 cdnUrl() 이 이 값들로 URL을 만든다. 지금은 백엔드가 /cdn/** 도 같이
     * 서빙하므로 baseApiHost/baseApiPort 와 동일한 값. 나중에 첨부파일을 진짜 CDN/S3 같은
     * 별도 host로 옮기면 여기만 그 주소로 바꾸면 된다. */
    cdnApiHost: window.location.hostname,
    cdnApiPort: '3000',

    /* ── 토스페이먼츠 ── */
    toss: {
      /* 공식 문서용 테스트 클라이언트 키 (결제위젯). svTossClientKey 미설정 시 폴백.
       * 실 결제는 사이트 설정의 tossClientKey(운영키)가 있어야 함. */
      TEST_CLIENT_KEY: 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm',
      TEST_SECRET_KEY: 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6',
      /* v2 표준 SDK (bo.html 에서 <script> 로드) */
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
