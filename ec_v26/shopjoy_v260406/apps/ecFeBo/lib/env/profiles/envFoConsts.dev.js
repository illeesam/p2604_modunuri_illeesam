/* ShopJoy - 외부 연동 상수 모음 (FO / envFoConsts) — dev 프로파일
 * ─────────────────────────────────────────────────────────────────────────
 * ⭐ 이 파일은 원본이 아니라 "빌드용 프로파일"이다. `npm run build:dev` 실행 시
 * scripts/build-minify.js 가 이 파일을 dist/lib/env/envFoConsts.js 자리에 그대로
 * 복사해서 원본(lib/env/envFoConsts.js, local 프로파일)을 덮어쓴다.
 * 원본 파일과 구조가 동일해야 한다 — 필드를 추가/삭제하면 여기도 맞춰 수정할 것.
 * 원본(local)에 있는 각 필드의 설명 주석은 원본 파일 참조, 여기서는 dev 전용 값만 표시.
 *
 * 전역: window.envFoConsts (FO 전용 — index.html 에서 로드)
 * 용도: Synology NAS 등 "nginx가 프론트+백엔드를 같은 origin 에서 서빙"하는 배포
 * ───────────────────────────────────────────────────────────────────────── */
(function () {
  window.envFoConsts = {
    runMode: 'dev',  // local, dev, prod

    appTitle: 'ShopJoy',
    appCiImage: 'assets/img/ci/fo-ci.svg',

    /* 2026-09-06 대개편: "4개 앱(ecBeBo/ecBeCdn/ecFeBo/ecBeRedis)이 각자 다른 호스팅사에
     * 흩어질 수도 있다"는 최악의 경우 기준 설계로 전환 — nginx가 더 이상 /api,/cdn 을
     * 리버스프록시하지 않으므로(완전 분리), 프론트와 백엔드는 서로 다른 origin이다.
     * CORS(CorsOriginPolicy.java 의 "*.illeesam.synology.me" 패턴)로 방어하며 백엔드를
     * 직접 절대 URL로 호출한다. 포트는 443(HTTPS 기본 포트라 안 적어도 자동)이라 비워둔다.
     *
     * 2026-09-06: 한때 이 서브도메인용 인증서가 준비 전이라 "illeesam.synology.me:22300"
     * 처럼 호스트+포트 직접 호출로 임시 우회했었다 — DSM 리버스프록시 규칙 + 전용 인증서
     * (22300.illeesam.synology.me, SAN 단독) 등록 완료 확인(curl 실측 200) 후 원래 설계로
     * 복귀. ⚠ 예전 21000.illeesam.synology.me(같은 origin) 방식과 달리, 지금은 이 값이 곧
     * 백엔드(ecBeBo) 자신의 공개 서브도메인이다 — 값을 바꾸면 그 즉시 다른 백엔드를 호출하게
     * 된다. */
    baseApiHost: '22300.illeesam.synology.me',
    baseApiPort: '',

    /* EcCdnApi(ecBeCdn)도 마찬가지로 완전히 별도 서브도메인/서버 — 나중에 진짜 다른
     * 호스팅사로 옮기면 이 두 값만 그 주소로 바꾸면 됨(코드/배포 구조 변경 불필요). */
    cdnApiHost: '22400.illeesam.synology.me',
    cdnApiPort: '',

    /* ── 토스페이먼츠 ── */
    toss: {
      TEST_CLIENT_KEY: 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm',
      TEST_SECRET_KEY: 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6',
      SDK_V2_URL: 'https://js.tosspayments.com/v2/standard',
    },

    /* ── OAuth / 소셜 ── */
    oauth: {
      GOOGLE_USERINFO_URL: 'https://www.googleapis.com/oauth2/v3/userinfo',
      NAVER_AUTHORIZE_URL: 'https://nid.naver.com/oauth2.0/authorize',
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
