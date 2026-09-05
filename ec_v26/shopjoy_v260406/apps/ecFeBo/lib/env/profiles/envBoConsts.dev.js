/* ShopJoy - 외부 연동 상수 모음 (BO / envBoConsts) — dev 프로파일
 * ─────────────────────────────────────────────────────────────────────────
 * ⭐ 이 파일은 원본이 아니라 "빌드용 프로파일"이다. `npm run build:dev` 실행 시
 * scripts/build-minify.js 가 이 파일을 dist/lib/env/envBoConsts.js 자리에 그대로
 * 복사해서 원본(lib/env/envBoConsts.js, local 프로파일)을 덮어쓴다.
 * 원본 파일과 구조가 동일해야 한다 — 필드를 추가/삭제하면 여기도 맞춰 수정할 것.
 * 원본(local)에 있는 각 필드의 설명 주석은 원본 파일 참조, 여기서는 dev 전용 값만 표시.
 *
 * 전역: window.envBoConsts (BO 전용 — bo.html 에서 로드)
 * 용도: Synology NAS 등 "nginx가 프론트+백엔드를 같은 origin 에서 서빙"하는 배포
 * ───────────────────────────────────────────────────────────────────────── */
(function () {
  window.envBoConsts = {
    runMode: 'dev',  // local, dev, prod

    appTitle: 'ShopJoy BO',
    appCiImage: 'assets/img/ci/bo-ci.svg',

    /* 2026-09-06 대개편: "4개 앱(ecBeBo/ecBeCdn/ecFeBo/ecBeRedis)이 각자 다른 호스팅사에
     * 흩어질 수도 있다"는 최악의 경우 기준 설계로 전환 — nginx가 더 이상 /api,/cdn 을
     * 리버스프록시하지 않으므로(완전 분리), 프론트와 백엔드는 서로 다른 origin이다.
     * CORS(CorsOriginPolicy.java 의 "*.illeesam.synology.me" 패턴)로 방어하며 백엔드를
     * 직접 절대 URL로 호출한다.
     *
     * 2026-09-06(추가 수정) — 원래 설계는 `22300.illeesam.synology.me`(HTTPS 서브도메인,
     * 포트는 443 기본이라 생략) 였으나, 그 서브도메인용 DSM 리버스프록시 등록 + 그 이름을
     * 커버하는 인증서가 아직 준비되지 않아(22000 프론트 서브도메인도 같은 상태 —
     * ERR_TLS_CERT_ALTNAME_INVALID 로 실측 확인) 실제로 붙지 않았다. 그 인프라가 준비될
     * 때까지는 배포스크립트/헬스체크가 실제로 쓰는 방식과 동일하게 "NAS 호스트 + 실제
     * 공개 포트"로 직접 호출한다(originFrom 이 location.protocol 을 그대로 붙이므로,
     * 이 페이지 자체도 http://illeesam.synology.me:22000 처럼 HTTP로 열어야 http 로
     * 맞물린다 — HTTPS 프론트에서 이 host:port 조합을 그대로 쓰면 백엔드가 TLS를 안 하므로
     * mixed-content 로 막힌다. 서브도메인 인증서가 준비되면 위 원래 설계로 되돌릴 것). */
    baseApiHost: 'illeesam.synology.me',
    baseApiPort: '22300',

    /* EcCdnApi(ecBeCdn)도 완전히 별도 서버 — 위와 같은 이유로 서브도메인 대신 실제 포트
     * 직접 지정. 나중에 진짜 다른 호스팅사로 옮기면 이 두 값만 그 주소로 바꾸면 됨. */
    cdnApiHost: 'illeesam.synology.me',
    cdnApiPort: '22400',

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
