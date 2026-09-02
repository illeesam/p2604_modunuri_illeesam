/* ShopJoy - 외부 연동 상수 모음 (BO / envBoConsts) — dev 프로파일
 * ─────────────────────────────────────────────────────────────────────────
 * ⭐ 이 파일은 원본이 아니라 "빌드용 프로파일"이다. `npm run build:dev` 실행 시
 * scripts/buildMinify.js 가 이 파일을 dist/lib/env/envBoConsts.js 자리에 그대로
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

    /* 2026-09-04: DSM 리버스 프록시(서브도메인 21000.illeesam.synology.me, 443)로 전환.
     * 예전엔 illeesam.synology.me:21000(평문 HTTP)을 직접 가리켰는데, HTTPS(secure context)가
     * 필요해서(crypto.subtle 등) 서브도메인+443 방식으로 옮겼다. 포트는 443(HTTPS 기본 포트라
     * 안 적어도 자동)이라 비워둔다. ⚠ 이 값을 바꾸면 예전 http://illeesam.synology.me:21000
     * 직접 접속으로는 API 가 더 이상 안 붙는다(의도된 트레이드오프 — 이제 정식 진입점은 HTTPS). */
    baseApiHost: '21000.illeesam.synology.me',
    baseApiPort: '',

    /* 첨부파일도 같은 nginx가 /cdn/** 로 서빙 — baseApi와 동일 주소.
     * 나중에 진짜 CDN/S3로 옮기면 이 두 값만 그 주소로 바꾸면 됨. */
    cdnApiHost: '21000.illeesam.synology.me',
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
