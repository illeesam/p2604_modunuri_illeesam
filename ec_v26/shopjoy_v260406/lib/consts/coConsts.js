/**
 * coConsts.js — FO·BO 공통 상수 (window.coConsts)
 *
 * FO(index.html)·BO(bo.html) 양쪽에서 값이 동일하게 쓰이는 상수만 모은다.
 * (FO 전용 → foConsts.js, BO 전용 → boConsts.js)
 *
 * ⚠️ 이 프로젝트는 빌드 없이 <script src> 로 직접 로드 → ES `export` 사용 불가.
 *    기존 coUtil/services 와 동일하게 window 전역 객체로 노출한다.
 *
 * 선행 로드: 없음 (순수 데이터). stores/pages 보다 먼저 로드.
 */
(function (global) {
  'use strict';

  var coConsts = {};

  /* ── 클레임 유형 (취소/반품/교환) — FO·BO 공통 ──
   * { codeValue, codeLabel } 형식 (sy_code code_grp='CLAIM_TYPE' 과 동일: CANCEL/RETURN/EXCHANGE).
   *   향후 sy_code 이관 시 codes 로 대체, 이 상수는 fallback. 라벨만 필요하면 .map(c=>c.codeLabel). */
  coConsts.CLAIM_TYPES = [
    { codeValue: 'CANCEL',   codeLabel: '취소' },
    { codeValue: 'RETURN',   codeLabel: '반품' },
    { codeValue: 'EXCHANGE', codeLabel: '교환' },
  ];

  /* 클레임 유형 → 대표 hex 색상. FO(foMyStore.CLAIM_TYPE_COLOR) + BO(OdOrderMng/OdClaimMng fnClaimTypeColor) 동일값 */
  coConsts.CLAIM_TYPE_COLOR = { '취소': '#ef4444', '반품': '#FFBB00', '교환': '#3b82f6' };

  /* claimTypeColor — 유형 → hex (미정의 시 회색). 함수형 사용처 호환 */
  coConsts.claimTypeColor = function (t) { return coConsts.CLAIM_TYPE_COLOR[t] || '#9ca3af'; };

  /* ── 택배사 ── */
  /* 택배사명 → 송장조회 URL 생성 함수. FO MyOrder/MyClaim 의 COURIER_URLS 중복 통합 */
  coConsts.COURIER_URLS = {
    'CJ대한통운': function (no) { return 'https://trace.cjlogistics.com/next/tracking.html?wblNo=' + no; },
    '롯데택배':   function (no) { return 'https://www.lotteglogis.com/open/tracking?invno=' + no; },
    '한진택배':   function (no) { return 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=' + no; },
  };

  /* courierTrackUrl — (택배사, 송장번호) → 조회 URL. 미지원 택배사면 '' */
  coConsts.courierTrackUrl = function (courier, trackingNo) {
    var fn = coConsts.COURIER_URLS[courier];
    return fn ? fn(trackingNo) : '';
  };

  /* 택배사 선택 옵션 (드롭다운용) — BO 배송관리 등.
   * { codeValue, codeLabel } 형식 (sy_code code_grp='COURIER' 과 동일: CJ/LOTTE/HANJIN/POST/LOGEN).
   *   codeLabel(한글명)이 COURIER_URLS 키 + 송장조회와 호환. 라벨만 필요하면 .map(c=>c.codeLabel). */
  coConsts.COURIER_NAMES = [
    { codeValue: 'CJ',     codeLabel: 'CJ대한통운' },
    { codeValue: 'LOTTE',  codeLabel: '롯데택배' },
    { codeValue: 'HANJIN', codeLabel: '한진택배' },
    { codeValue: 'POST',   codeLabel: '우체국택배' },
    { codeValue: 'LOGEN',  codeLabel: '로젠택배' },
  ];

  /* 클레임 유형 한글 → 영문 코드. OdClaimDtl/OdClaimHist 중복 */
  coConsts.CLAIM_TYPE_CD_MAP = { '취소': 'CANCEL', '반품': 'RETURN', '교환': 'EXCHANGE' };

  /* 클레임 단계별 상태 라벨(한글). 영문키 기준 — OdClaimDtl CLAIM_STEP_MAP 동일.
   * OdOrderDtl 의 CLAIM_FLOWS(한글키)는 이 맵에서 파생: CLAIM_TYPE_CD_MAP[한글] → 여기 조회 */
  coConsts.CLAIM_STEP_MAP = {
    CANCEL:   ['취소요청', '취소처리중', '취소완료'],
    RETURN:   ['반품요청', '수거예정', '수거중', '검수중', '환불대기', '환불완료'],
    EXCHANGE: ['교환요청', '수거예정', '수거중', '교환완료'],
  };

  /* 외부 SDK / 서비스 연동 키 이름 — AppStore 가 svXxx 로 보관한다.
   * boAppStore.js 와 foAppStore.js 에 26개가 통째로 복제돼 있던 것을 여기로 합쳤다
   * ("키 추가/제거 시 양쪽을 동일하게 유지" 주석에 의존하던 수동 동기화 제거).
   * 값은 로그인 시 서버 init data 로 주입된다 → coApiSvc.cm{Bo,Fo}AppStore.getInitData()
   * 실제 읽기는 coExtSdk._key('svXxx') 가 store[name] 으로 직접 한다. */
  coConsts.EXT_KEYS = [
    // 소셜 로그인
    'googleClientId', 'kakaoJsKey', 'naverClientId', 'naverCallbackUrl', 'facebookAppId', 'appleClientId',
    // 결제
    'tossClientKey', 'kakaoPayCid', 'naverPayClientId', 'inicisMid', 'kcpSiteCd',
    // 지도
    'naverMapClientId', 'kakaoMapJsKey', 'googleMapApiKey',
    // AWS
    'awsRegion', 'awsS3Bucket', 'awsS3PublicUrl', 'awsCognitoIdentityPoolId',
    // 알림/메시징
    'kakaoAlimtalkSenderKey', 'nhnCloudSmsAppKey', 'ncloudSensServiceId',
    // 본인인증
    'niceClientId', 'passClientId',
    // 보안/분석
    'recaptchaSiteKey', 'gaTrackingId', 'naverAnalyticsId', 'facebookPixelId',
    // 채팅/CS
    'channelTalkPluginKey',
    // 기타
    'daumPostcodeUrl',
  ];

  global.coConsts = global.coConsts || coConsts;
})(window);
