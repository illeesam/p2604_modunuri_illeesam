/* ShopJoy - 외부 연동 설정 도움말 모달 (FO/BO 공용)
 * ─────────────────────────────────────────────────────────────────────────
 * SNS 로그인(구글/카카오/네이버)·토스 결제·지도·CDN URL 설정 안내 팝업.
 * 외부 키가 실패하거나 직접 도움말을 열 때 사용한다.
 *
 * 전역 API (window.coExtHelp):
 *   - open({ kind:'social'|'pay', provider:'google'|'kakao'|'naver'|'toss', error, message })
 *   - openManual(tab)  → 실패 없이도 도움말을 직접 열기 (예: '도움말' 버튼).
 *   - close()
 *
 * 탭 목록: google | kakao | naver | toss | kakaomap | navermap | input | prop | cdn
 *
 * 셸: BO(bo.html)에선 <bo-modal>, FO(index.html)에선 <fo-modal> — 동적 :is 로 자동 선택.
 * 마운트: foApp/boApp 루트 템플릿에 <co-ext-help-modal /> 1회 (전역 1인스턴스).
 * ───────────────────────────────────────────────────────────────────────── */
(function () {
  const ORIGIN   = window.location.origin;
  const PAGE_URL = ORIGIN + window.location.pathname;

  /* ── 전역 상태 + open/close API ─────────────────────────────────────── */
  const st = Vue.reactive({ show: false, tab: 'google', kind: 'social', message: '' });

  const _DEMO_RE = /(^|_)demo(_|$)/i;
  const _isDemoVal = (v) => !!v && _DEMO_RE.test(String(v));

  const _isUserCancel = (err) => {
    if (!err) return false;
    const code = String((err && err.code) || '');
    const msg  = String((err && err.message) || err || '');
    return /USER_CANCEL/i.test(code) || /취소|canceled|cancelled|user.?cancel/i.test(msg);
  };

  const _applyOpts = (opts = {}) => {
    st.kind = opts.kind === 'pay' ? 'pay' : 'social';
    const p = String(opts.provider || '').toLowerCase();
    st.tab = (st.kind === 'pay') ? 'toss' : (['google', 'kakao', 'naver'].includes(p) ? p : 'google');
    st.message = String(opts.message || (opts.error && opts.error.message) || '');
  };

  window.coExtHelp = {
    open(opts = {}) {
      if (_isUserCancel(opts.error)) return false;
      _applyOpts(opts);
      st.show = true;
      return true;
    },
    toastAction(opts = {}) {
      if (_isUserCancel(opts.error)) return null;
      return {
        label: opts.label || (opts.kind === 'pay' ? '⚙ 결제 설정 방법 보기' : '⚙ 설정 방법 보기'),
        onClick: () => { _applyOpts(opts); st.show = true; },
      };
    },
    openManual(tab) {
      st.kind = (tab === 'toss') ? 'pay' : 'social';
      st.tab = tab || 'google';
      st.message = '';
      st.show = true;
    },
    close() { st.show = false; },
  };

  /* ── 안내 데이터 ─────────────────────────────────────────────────────── */
  const GUIDES = {
    google: {
      label: '구글 로그인', badge: 'G', badgeBg: '#4285f4',
      summary: 'Google Cloud 에서 "OAuth 클라이언트 ID" 1개만 발급받으면 됩니다. (무료 · 약 10분)',
      propKey: 'ext.sdk.googleClientId',
      consoleNm: 'Google Cloud Console', consoleUrl: 'https://console.cloud.google.com',
      keys: [{ store: 'svGoogleClientId', server: 'syApp.googleClientId', what: 'OAuth 클라이언트 ID',
               sample: '1234567890-abc123.apps.googleusercontent.com' }],
      videos: [
        { t: 'Google 공식 — OAuth 클라이언트 ID 만들기', url: 'https://www.youtube.com/watch?v=Qt3KJZ2kQk4' },
        { t: '영상으로 더 찾아보기 (구글 OAuth 클라이언트 ID 발급)', url: 'https://www.youtube.com/results?search_query=google+oauth+client+id+%EB%B0%9C%EA%B8%89' },
      ],
      steps: [
        { t: 'Google Cloud Console 접속', d: 'console.cloud.google.com 에 접속해 구글 계정으로 로그인합니다.' },
        { t: '프로젝트 만들기', d: '상단의 프로젝트 선택 상자 → [새 프로젝트] → 이름은 자유롭게 입력(예: my-shop) → 만들기.' },
        { t: 'OAuth 동의 화면 설정', d: '좌측 메뉴 [API 및 서비스] → [OAuth 동의 화면] → User Type 은 "외부" 선택 → 앱 이름·지원 이메일만 입력하고 저장.\n게시 전(테스트 모드)이라면 [테스트 사용자]에 본인 구글 이메일을 추가해야 본인 계정으로 로그인됩니다.' },
        { t: 'OAuth 클라이언트 ID 만들기', d: '[API 및 서비스] → [사용자 인증 정보] → [+ 사용자 인증 정보 만들기] → [OAuth 클라이언트 ID] → 애플리케이션 유형 "웹 애플리케이션" 선택.' },
        { t: '승인된 자바스크립트 원본 등록', d: '"승인된 자바스크립트 원본"에 아래 현재 주소를 그대로 추가합니다 (포트 번호까지 정확히).\n→ ' + ORIGIN + '\n운영 도메인이 따로 있으면 그 주소도 함께 추가합니다 (예: https://www.myshop.com).' },
        { t: '클라이언트 ID 복사', d: '[만들기]를 누르면 "클라이언트 ID"(…apps.googleusercontent.com 으로 끝남)가 표시됩니다. 이 값을 복사하세요.\n※ "클라이언트 보안 비밀번호(secret)"는 이 프로젝트에서 사용하지 않습니다 — 절대 프론트 소스에 넣지 마세요.' },
        { t: '키 입력', d: '복사한 클라이언트 ID 를 관리자 → 프로퍼티관리 → ext.sdk.googleClientId 항목에 입력합니다. ([프로퍼티관리 설정] 탭 참고)' },
      ],
      faq: [
        { q: '로그인 창이 아예 안 뜸', a: '브라우저 주소창 오른쪽의 팝업 차단 아이콘을 눌러 이 사이트의 팝업을 허용하세요.' },
        { q: 'origin_mismatch / redirect_uri_mismatch', a: '"승인된 자바스크립트 원본"에 등록한 주소와 현재 접속 주소(' + ORIGIN + ')가 다릅니다. http/https·포트까지 똑같이 등록하세요.' },
        { q: 'access_denied / 테스트 중 앱', a: 'OAuth 동의 화면이 테스트 모드일 때는 [테스트 사용자]에 등록된 계정만 로그인할 수 있습니다.' },
        { q: '키 미설정 안내가 계속 나옴', a: 'ext.sdk.googleClientId 가 프로퍼티관리에 비어 있습니다. 아래 [프로퍼티관리 설정] 탭의 안내대로 키를 넣고 새로고침하세요.' },
      ],
    },
    kakao: {
      label: '카카오 로그인', badge: 'K', badgeBg: '#fee500',
      summary: '카카오 디벨로퍼스에서 앱을 만들고 "JavaScript 키"를 발급받습니다. (무료 · 약 10분)',
      propKey: 'ext.sdk.kakaoJsKey',
      consoleNm: '카카오 디벨로퍼스', consoleUrl: 'https://developers.kakao.com',
      keys: [{ store: 'svKakaoJsKey', server: 'syApp.kakaoJsKey', what: 'JavaScript 키',
               sample: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4' }],
      videos: [
        { t: '카카오 로그인 앱 등록 · JavaScript 키 발급 따라하기', url: 'https://www.youtube.com/results?search_query=%EC%B9%B4%EC%B9%B4%EC%98%A4+%EB%A1%9C%EA%B7%B8%EC%9D%B8+JavaScript+%ED%82%A4+%EB%B0%9C%EA%B8%89' },
        { t: '카카오 로그인 연동(redirect 방식) 구현 영상', url: 'https://www.youtube.com/results?search_query=%EC%B9%B4%EC%B9%B4%EC%98%A4+%EB%A1%9C%EA%B7%B8%EC%9D%B8+%EC%97%B0%EB%8F%99+redirect' },
      ],
      steps: [
        { t: '⚠ 먼저 알아두기 (SDK 버전)', d: '이 소스는 카카오 SDK v2를 로드합니다.\n카카오는 v2부터 보안 정책상 "팝업 로그인"을 제거하고 redirect 방식(인가코드 → 백엔드 토큰 교환)만 지원합니다.\n→ 팝업 방식을 그대로 쓰려면 HTML 의 카카오 SDK 를 v1 으로 교체하거나, redirect 흐름을 구현해야 합니다. 키 발급 절차 자체는 동일합니다.' },
        { t: '카카오 디벨로퍼스 접속', d: 'developers.kakao.com 에 접속해 카카오 계정으로 로그인합니다.' },
        { t: '애플리케이션 추가', d: '[내 애플리케이션] → [애플리케이션 추가하기] → 앱 이름·회사명은 자유롭게 입력 → 저장.' },
        { t: 'JavaScript 키 복사', d: '생성한 앱 클릭 → [앱 설정 > 앱 키] 화면에서 "JavaScript 키"를 복사합니다.\n※ REST API 키·Admin 키가 아니라 반드시 "JavaScript 키"입니다.' },
        { t: 'Web 플랫폼 등록', d: '[앱 설정 > 플랫폼] → [Web 플랫폼 등록] → 사이트 도메인에 아래 현재 주소를 등록합니다.\n→ ' + ORIGIN },
        { t: '카카오 로그인 활성화', d: '[제품 설정 > 카카오 로그인] → "활성화 설정" ON → Redirect URI 에 아래 주소를 등록합니다.\n→ ' + PAGE_URL },
        { t: '동의항목 설정', d: '[제품 설정 > 카카오 로그인 > 동의항목] → 닉네임은 "필수 동의", 카카오계정(이메일)은 "선택 동의"로 설정.' },
        { t: '키 입력', d: '복사한 JavaScript 키를 관리자 → 프로퍼티관리 → ext.sdk.kakaoJsKey 항목에 입력합니다. ([프로퍼티관리 설정] 탭 참고)' },
      ],
      faq: [
        { q: '현재 로드된 Kakao SDK(v2)는 팝업 로그인을 지원하지 않습니다', a: '카카오 v2 는 보안상 팝업식(Kakao.Auth.login)을 제거했습니다. 팝업이 필요하면 HTML 의 카카오 SDK 를 v1 으로 교체하거나, redirect 방식을 구현하세요.' },
        { q: 'KOE101 (앱 관리자 설정 오류)', a: 'JavaScript 키가 잘못되었습니다. 앱 키 화면에서 "JavaScript 키"를 다시 복사해 넣으세요.' },
        { q: 'KOE006 (등록되지 않은 도메인)', a: '[플랫폼 > Web] 의 사이트 도메인에 현재 주소(' + ORIGIN + ')가 등록되어 있는지 확인하세요.' },
        { q: '로그인 창이 안 뜸', a: '브라우저 팝업 차단을 해제하세요.' },
      ],
    },
    naver: {
      label: '네이버 로그인', badge: 'N', badgeBg: '#03c75a',
      summary: '네이버 개발자센터에 애플리케이션을 등록하고 "Client ID"를 발급받습니다. (무료 · 약 10분)',
      propKey: 'ext.sdk.naverClientId',
      consoleNm: '네이버 개발자센터', consoleUrl: 'https://developers.naver.com',
      keys: [
        { store: 'svNaverClientId',    server: 'syApp.naverClientId',    what: 'Client ID',           sample: 'AbC1dEf2GhI3jKl4MnO5' },
        { store: 'svNaverCallbackUrl', server: 'syApp.naverCallbackUrl', what: 'Callback URL (선택)', sample: PAGE_URL },
      ],
      videos: [
        { t: '네이버 로그인 애플리케이션 등록 · Client ID 발급 따라하기', url: 'https://www.youtube.com/results?search_query=%EB%84%A4%EC%9D%B4%EB%B2%84+%EB%A1%9C%EA%B7%B8%EC%9D%B8+%EC%95%A0%ED%94%8C%EB%A6%AC%EC%BC%80%EC%9D%B4%EC%85%98+%EB%93%B1%EB%A1%9D+client+id' },
        { t: '네이버 아이디로 로그인(네아로) 연동 영상', url: 'https://www.youtube.com/results?search_query=%EB%84%A4%EC%9D%B4%EB%B2%84+%EC%95%84%EC%9D%B4%EB%94%94%EB%A1%9C+%EB%A1%9C%EA%B7%B8%EC%9D%B8+%EC%97%B0%EB%8F%99' },
      ],
      steps: [
        { t: '네이버 개발자센터 접속', d: 'developers.naver.com 에 접속해 네이버 계정으로 로그인합니다.' },
        { t: '애플리케이션 등록', d: '상단 [Application] → [애플리케이션 등록] → 애플리케이션 이름 입력.' },
        { t: '사용 API 선택', d: '"사용 API"에서 [네이버 로그인]을 선택하고, 권한(회원이름·이메일 등) 중 필요한 항목을 체크합니다.' },
        { t: '환경 등록 (PC 웹)', d: '"로그인 오픈 API 서비스 환경"에서 [PC 웹] 추가 →\n· 서비스 URL: ' + ORIGIN + '\n· 네이버 로그인 Callback URL: ' + PAGE_URL },
        { t: 'Client ID 복사', d: '등록 완료 후 [내 애플리케이션]에서 "Client ID"를 복사합니다.\n※ Client Secret 은 서버 검증용으로, 프론트 소스에는 넣지 않습니다.' },
        { t: '키 입력', d: '복사한 Client ID 를 관리자 → 프로퍼티관리 → ext.sdk.naverClientId 항목에 입력합니다. Callback URL 을 위와 다르게 등록했다면 ext.sdk.naverCallbackUrl 에도 입력하세요. ([프로퍼티관리 설정] 탭 참고)' },
      ],
      faq: [
        { q: 'invalid_request / 잘못된 Client ID', a: 'ext.sdk.naverClientId 값이 비었거나 오타입니다. [내 애플리케이션]의 Client ID 를 다시 복사하세요.' },
        { q: 'Callback URL 불일치', a: '개발자센터에 등록한 Callback URL 과 실제 주소(' + PAGE_URL + ')가 글자 단위로 같아야 합니다.' },
        { q: '로그인 창이 안 뜸', a: '브라우저 팝업 차단을 해제하세요. Naver Login SDK 스크립트 로드 여부도 확인하세요.' },
      ],
    },
    toss: {
      label: '토스 결제', badge: '₩', badgeBg: '#0064ff',
      summary: '토스페이먼츠 개발자센터에서 "클라이언트 키"를 발급받습니다. 키가 없어도 공용 테스트 키로 테스트 결제창은 열립니다. (테스트 무료 · 약 5분)',
      propKey: 'payment.toss.client_key',
      consoleNm: '토스페이먼츠 개발자센터', consoleUrl: 'https://developers.tosspayments.com',
      keys: [{ store: 'svTossClientKey', server: 'syApp.tossClientKey', what: '클라이언트 키 (결제위젯 연동 키)',
               sample: 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm' }],
      videos: [
        { t: '토스페이먼츠 결제위젯 연동 · 클라이언트 키 발급 따라하기', url: 'https://www.youtube.com/results?search_query=%ED%86%A0%EC%8A%A4%ED%8E%98%EC%9D%B4%EB%A8%BC%EC%B8%A0+%EA%B2%B0%EC%A0%9C%EC%9C%84%EC%A0%AF+%EC%97%B0%EB%8F%99' },
        { t: '토스페이먼츠 공식 개발자 영상 (TossPayments 채널)', url: 'https://www.youtube.com/@tosspayments/videos' },
      ],
      steps: [
        { t: '먼저 알아두기 (테스트 vs 운영)', d: '· 키 미설정 → 공용 테스트 키로 자동 동작 (결제창은 뜨지만 실 결제 안 됨)\n· test_ 로 시작하는 키 → 내 테스트 상점 키 (실 결제 안 됨)\n· live_ 로 시작하는 키 → 운영 키 (토스페이먼츠 입점 계약 후 발급, 실 결제 발생)' },
        { t: '개발자센터 가입', d: 'developers.tosspayments.com 에 접속해 회원가입/로그인합니다. (사업자 없이도 테스트 키는 즉시 발급)' },
        { t: '테스트 클라이언트 키 확인', d: '로그인 후 [내 개발정보]에서 "클라이언트 키"를 복사합니다.\n※ 결제위젯용 키는 test_gck_ 또는 test_ck_ 로 시작합니다.\n※ sk_ 로 시작하는 "시크릿 키"는 서버 전용 — 프론트에 절대 넣지 마세요.' },
        { t: '키 입력', d: '복사한 클라이언트 키를 관리자 → 프로퍼티관리 → payment.toss.client_key 항목에 입력합니다. ([프로퍼티관리 설정] 탭 참고)' },
        { t: '(운영 전환 시)', d: '토스페이먼츠와 입점 계약 후 live_ 키를 발급받아 운영 사이트 설정에 교체 입력합니다.\n※ BO 주문화면의 "브랜드페이" 결제는 토스 브랜드페이 별도 약정이 있어야 동작합니다.' },
      ],
      faq: [
        { q: '결제창이 아예 안 뜸 (SDK 미로드)', a: 'js.tosspayments.com 스크립트가 차단되었습니다. 광고차단 확장프로그램을 끄거나 이 사이트를 예외 처리하고, 네트워크 상태를 확인하세요.' },
        { q: '인증 실패 / 유효하지 않은 키', a: 'payment.toss.client_key 오타이거나 시크릿 키(sk_)를 넣은 경우입니다. "클라이언트 키"(ck/gck)를 다시 복사하세요.' },
        { q: '브랜드페이가 연동되지 않았습니다', a: '브랜드페이는 토스와 별도 약정이 필요한 상품입니다. 약정 전에는 테스트 위젯 결제만 가능합니다.' },
        { q: '결제가 취소되었습니다', a: '사용자가 결제창을 직접 닫은 것으로, 설정 오류가 아닙니다.' },
      ],
    },
    kakaomap: {
      label: '카카오 지도', badge: '🗺', badgeBg: '#fee500',
      summary: '카카오 디벨로퍼스의 "JavaScript 키"를 사용합니다. (로그인용 앱과 같은 키를 써도 됩니다. 무료 · 약 5분)',
      propKey: 'ext.sdk.kakaoMapJsKey',
      consoleNm: '카카오 디벨로퍼스', consoleUrl: 'https://developers.kakao.com',
      keys: [{ store: 'svKakaoMapJsKey', server: 'syApp.kakaoMapJsKey', what: 'JavaScript 키 (지도용)',
               sample: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4' }],
      videos: [
        { t: '카카오맵 API 키 발급 · 웹 지도 띄우기 따라하기', url: 'https://www.youtube.com/results?search_query=%EC%B9%B4%EC%B9%B4%EC%98%A4%EB%A7%B5+api+%ED%82%A4+%EB%B0%9C%EA%B8%89+%EC%A7%80%EB%8F%84' },
        { t: '카카오맵(Kakao Maps) JavaScript SDK 사용법', url: 'https://www.youtube.com/results?search_query=kakao+map+javascript+sdk' },
      ],
      steps: [
        { t: '카카오 디벨로퍼스 접속', d: 'developers.kakao.com 에 로그인합니다. 로그인용 앱이 이미 있으면 그 앱의 JavaScript 키를 그대로 써도 됩니다.' },
        { t: '앱의 JavaScript 키 복사', d: '[내 애플리케이션] → 앱 선택 → [앱 설정 > 앱 키] 에서 "JavaScript 키"를 복사합니다.' },
        { t: 'Web 플랫폼 도메인 등록', d: '[앱 설정 > 플랫폼] → [Web 플랫폼 등록] → 사이트 도메인에 아래 현재 주소를 등록해야 지도가 표시됩니다.\n→ ' + ORIGIN },
        { t: '카카오맵 사용 설정 확인', d: '카카오맵은 별도 활성화 없이 JavaScript 키 + 도메인 등록만으로 동작합니다. (지도 API는 무료 일일 호출 한도 내 사용)' },
        { t: '키 입력', d: '복사한 JavaScript 키를 관리자 → 프로퍼티관리 → ext.sdk.kakaoMapJsKey 항목에 입력합니다. ([프로퍼티관리 설정] 탭 참고)' },
      ],
      faq: [
        { q: '지도가 회색 빈 화면으로만 나옴', a: '[플랫폼 > Web] 사이트 도메인에 현재 주소(' + ORIGIN + ')가 등록되어 있는지 확인하세요. 포트까지 정확히 같아야 합니다.' },
        { q: 'appkey 가 유효하지 않습니다', a: 'ext.sdk.kakaoMapJsKey 가 비었거나 오타입니다. REST API 키가 아니라 "JavaScript 키"인지 확인하세요.' },
        { q: '지도 SDK 로드 실패', a: 'dapi.kakao.com 스크립트가 광고차단/네트워크로 막혔는지 확인하세요.' },
      ],
    },
    navermap: {
      label: '네이버 지도', badge: '🗺', badgeBg: '#03c75a',
      summary: '네이버 클라우드 플랫폼(NCP)에서 Maps Application 을 등록하고 "Client ID"(ncpClientId)를 발급받습니다. (NCP 가입 필요 · 약 10분)',
      propKey: 'ext.sdk.naverMapClientId',
      consoleNm: '네이버 클라우드 플랫폼', consoleUrl: 'https://console.ncloud.com',
      keys: [{ store: 'svNaverMapClientId', server: 'syApp.naverMapClientId', what: 'Client ID (ncpClientId)',
               sample: 'abcd1234ef' }],
      videos: [
        { t: '네이버 지도(NCP Maps) API 신청 · Client ID 발급 따라하기', url: 'https://www.youtube.com/results?search_query=%EB%84%A4%EC%9D%B4%EB%B2%84+%EC%A7%80%EB%8F%84+api+%ED%81%B4%EB%9D%BC%EC%9D%B4%EC%96%B8%ED%8A%B8+id+%EB%B0%9C%EA%B8%89' },
        { t: '네이버 클라우드 플랫폼 Maps 연동 영상', url: 'https://www.youtube.com/results?search_query=ncloud+maps+web+dynamic+map' },
      ],
      steps: [
        { t: '네이버 클라우드 플랫폼 가입', d: 'console.ncloud.com 에 접속해 가입/로그인합니다. (네이버 "개발자센터(developers.naver.com)"가 아니라 "클라우드 플랫폼(NCP)"입니다 — 헷갈리기 쉬움)' },
        { t: 'Maps 서비스 신청', d: 'Services → AI·Application Service → [Maps] → [Application 등록]. Web Dynamic Map 은 일정 호출까지 무료입니다.' },
        { t: 'Web 서비스 URL 등록', d: 'Application 등록 시 "Web 서비스 URL"에 아래 현재 주소를 등록합니다 (등록 도메인에서만 지도가 표시됨).\n→ ' + ORIGIN },
        { t: 'Client ID 복사', d: '등록 완료 후 발급된 "Client ID"(=ncpClientId)를 복사합니다.\n※ Client Secret 은 프론트 지도에는 사용하지 않습니다.' },
        { t: '키 입력', d: '복사한 Client ID 를 관리자 → 프로퍼티관리 → ext.sdk.naverMapClientId 항목에 입력합니다. ([프로퍼티관리 설정] 탭 참고)' },
      ],
      faq: [
        { q: '지도가 안 뜨고 인증 실패(Authentication Failed) 표시', a: 'Application 의 "Web 서비스 URL"에 현재 주소(' + ORIGIN + ')가 등록되어 있는지 확인하세요.' },
        { q: 'ncpClientId 오류', a: 'ext.sdk.naverMapClientId 값이 비었거나 오타입니다. NCP 콘솔의 Maps Application 에서 Client ID 를 다시 복사하세요.' },
        { q: '개발자센터에서 발급한 키를 넣었는데 안 됨', a: '지도는 developers.naver.com(로그인용)이 아니라 console.ncloud.com(클라우드 플랫폼)의 Maps Client ID 를 사용합니다. 발급처가 다릅니다.' },
      ],
    },
  };

  /* ── 프로퍼티관리 등록 항목 전체 목록 ───────────────────────────────── */
  const PROP_ITEMS = [
    { group: 'SNS 로그인', key: 'ext.sdk.googleClientId',  label: 'Google OAuth 클라이언트 ID',   sample: '1234567890-abc123.apps.googleusercontent.com', note: 'Google Cloud → OAuth 클라이언트 ID' },
    { group: 'SNS 로그인', key: 'ext.sdk.kakaoJsKey',      label: 'Kakao JavaScript 키',          sample: 'a1b2c3d4e5f6...', note: '카카오 디벨로퍼스 → 앱 키 → JavaScript 키' },
    { group: 'SNS 로그인', key: 'ext.sdk.naverClientId',   label: 'Naver 로그인 Client ID',       sample: 'AbC1dEf2GhI3', note: '네이버 개발자센터 → 앱 → Client ID' },
    { group: 'SNS 로그인', key: 'ext.sdk.naverCallbackUrl', label: 'Naver Callback URL (선택)',   sample: PAGE_URL, note: '미입력 시 현재 페이지 URL 자동 사용' },
    { group: '결제',       key: 'payment.toss.client_key', label: '토스페이먼츠 클라이언트 키',   sample: 'test_gck_...', note: '토스 개발자센터 → 클라이언트 키 (test_/live_)' },
    { group: '지도',       key: 'ext.sdk.kakaoMapJsKey',   label: 'Kakao 지도 JavaScript 키',    sample: 'a1b2c3d4e5f6...', note: '카카오 디벨로퍼스 → 앱 키 → JavaScript 키' },
    { group: '지도',       key: 'ext.sdk.naverMapClientId', label: 'Naver 지도 Client ID',        sample: 'abcd1234ef', note: '네이버 클라우드 플랫폼(NCP) → Maps → Client ID' },
  ];

  /* ── CDN URL 항목 목록 ───────────────────────────────────────────────── */
  const CDN_ITEMS = [
    { key: 'cdn.url.base',      label: '기본 CDN URL',          sample: 'https://cdn.myshop.com', note: '정적 파일(이미지·JS·CSS)의 기본 CDN 도메인. 비워두면 상대경로 사용.' },
    { key: 'cdn.url.image',     label: '이미지 CDN URL (선택)', sample: 'https://img.myshop.com', note: '상품·블로그 이미지 전용 CDN. 비워두면 기본 CDN URL 사용.' },
    { key: 'cdn.url.upload',    label: '업로드 기본 경로',       sample: '/uploads', note: '파일 업로드 저장 기본 경로 prefix. 기본값 /uploads.' },
    { key: 'cdn.url.static',    label: '정적 파일 기본 경로',    sample: '/static', note: 'assets/ 이하 정적 파일의 서빙 경로 prefix.' },
  ];

  /* ── 키 입력 방법 탭(공통) ─────────────────────────────────────────── */
  const ALL_KEYS = [
    { store: 'svGoogleClientId',   what: '구글 로그인 — OAuth 클라이언트 ID' },
    { store: 'svKakaoJsKey',       what: '카카오 로그인 — JavaScript 키' },
    { store: 'svNaverClientId',    what: '네이버 로그인 — Client ID' },
    { store: 'svNaverCallbackUrl', what: '네이버 로그인 — Callback URL (선택)' },
    { store: 'svTossClientKey',    what: '토스 결제 — 클라이언트 키 (미설정 시 테스트 키 폴백)' },
    { store: 'svKakaoMapJsKey',    what: '카카오 지도 — JavaScript 키' },
    { store: 'svNaverMapClientId', what: '네이버 지도 — Client ID (ncpClientId)' },
  ];

  /* ── 컴포넌트 ──────────────────────────────────────────────────────── */
  window.CoExtHelpModal = {
    name: 'CoExtHelpModal',
    setup() {
      /* ##### [01] 초기 변수 정의 ############################################ */
      const { computed } = Vue;
      const shell = (typeof window.useBoAuthStore === 'function') ? 'bo-modal' : 'fo-modal';

      const tabs = [
        { id: 'google',   label: '구글 로그인' },
        { id: 'kakao',    label: '카카오 로그인' },
        { id: 'naver',    label: '네이버 로그인' },
        { id: 'toss',     label: '토스 결제' },
        { id: 'kakaomap', label: '카카오 지도' },
        { id: 'navermap', label: '네이버 지도' },
        { id: 'prop',     label: '⚙ 프로퍼티관리 설정' },
        { id: 'cdn',      label: '🌐 CDN URL 설정' },
        { id: 'input',    label: '🔑 코드 직접 입력' },
      ];

      /* ##### [02] 액션 모음 (dispatch) ###################################### */
      const handleBtnAction = (cmd, param) => {
        if (cmd === 'modal-close') return window.coExtHelp.close();
        if (cmd === 'tab-select')  { st.tab = param; return; }
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      };

      /* ##### [05] 사용자 함수 (헬퍼) ######################################## */
      const _appStore = () => {
        try { if (typeof window.useFoAppStore === 'function') return window.useFoAppStore(); } catch (e) { /* noop */ }
        try { if (typeof window.useBoAppStore === 'function') return window.useBoAppStore(); } catch (e) { /* noop */ }
        return null;
      };
      const fnKeyState = (name) => {
        const s = _appStore();
        const v = s && s[name];
        if (!v) return 'unset';
        return _isDemoVal(v) ? 'demo' : 'set';
      };
      const fnKeyBadge = (name) => {
        const st2 = fnKeyState(name);
        if (st2 === 'set')  return { text: '✓ 설정됨',        css: 'background:#e8f5e9;color:#2e7d32;border-radius:6px;padding:2px 8px;font-weight:700;' };
        if (st2 === 'demo') return { text: '✕ 데모값(미설정)', css: 'background:#fff7e6;color:#b8860b;border-radius:6px;padding:2px 8px;font-weight:700;' };
        return { text: '✕ 미설정', css: 'background:#fff3f3;color:#c0392b;border-radius:6px;padding:2px 8px;font-weight:700;' };
      };

      const cfGuide = computed(() => GUIDES[st.tab] || null);
      const cfTitle = computed(() => {
        if (st.tab === 'prop')    return '프로퍼티관리 설정 도움말';
        if (st.tab === 'cdn')     return 'CDN URL 설정 도움말';
        if (st.tab === 'input')   return '코드 직접 입력 도움말';
        if (st.tab === 'kakaomap' || st.tab === 'navermap') return '지도 연동 설정 도움말';
        if (st.kind === 'pay')    return '결제 연동 설정 도움말';
        return '외부 연동 설정 도움말';
      });

      /* ##### [06] return (템플릿 노출) ###################################### */

      /* 그리드 컬럼 — 도움말 모달 테이블 */
      const guideKeysColumns = [
        { key: 'what',    label: '무엇',         cellStyle: 'color:#555;' },
        { key: '_propKey',label: '프로퍼티 키',  cellStyle: 'font-family:monospace;color:#1d4ed8;',
          fmt: () => cfGuide.value ? cfGuide.value.propKey : '' },
        { key: '_badge',  label: '상태',         style: 'width:90px;',
          fmt: (v, row) => { const b = fnKeyBadge(row.store); return b.text; },
          cellStyle: (v, row) => { const b = fnKeyBadge(row.store); return b.css; } },
      ];
      const guideFaqColumns = [
        { key: 'q', label: '증상', style: 'width:38%;', cellStyle: 'border:1px solid #eee;color:#c0392b;' },
        { key: 'a', label: '해결', cellStyle: 'border:1px solid #eee;color:#555;' },
      ];
      const propItemsColumns = [
        { key: 'group', label: '분류', style: 'width:80px;',
          badge: row => ({ text: row.group, style: 'background:#eef2ff;color:#1d4ed8;border-radius:4px;padding:1px 6px;font-size:11px;font-weight:700;' }) },
        { key: 'key',   label: '프로퍼티 키 (propKey)', cellStyle: 'font-family:monospace;font-weight:700;color:#1d4ed8;' },
        { key: 'label', label: '라벨' },
        { key: 'note',  label: '비고', cellStyle: 'color:#777;font-size:11px;' },
      ];
      const cdnItemsColumns = [
        { key: 'key',    label: '프로퍼티 키 (propKey)', cellStyle: 'font-family:monospace;font-weight:700;color:#276749;' },
        { key: 'label',  label: '라벨' },
        { key: 'sample', label: '예시 값', cellStyle: 'font-family:monospace;color:#888;' },
        { key: 'note',   label: '설명', cellStyle: 'color:#777;font-size:11px;' },
      ];
      const allKeysColumns = [
        { key: 'store', label: '키 이름', cellStyle: 'font-family:monospace;' },
        { key: 'what',  label: '용도',    cellStyle: 'color:#555;' },
        { key: '_badge',label: '상태',    style: 'width:90px;',
          fmt: (v, row) => fnKeyBadge(row.store).text,
          cellStyle: (v, row) => fnKeyBadge(row.store).css },
      ];

      return { st, shell, tabs, handleBtnAction, fnKeyState, fnKeyBadge, cfGuide, cfTitle,
               ALL_KEYS, PROP_ITEMS, CDN_ITEMS, ORIGIN, PAGE_URL,
               guideKeysColumns, guideFaqColumns, propItemsColumns, cdnItemsColumns, allKeysColumns };
    },
    template: /* html */`
<component :is="shell" :show="st.show" :title="'🛠 ' + cfTitle" width="960px" max-height="88vh"
  body-pad="16px" @close="handleBtnAction('modal-close')">
  <div style="font-size:13px;color:#333;">
    <!-- 실패 배너 -->
    <div v-if="st.message" style="background:#fff5f5;border:1px solid #ffd2d2;border-radius:8px;padding:10px 14px;margin-bottom:12px;">
      <div style="font-weight:700;color:#c0392b;margin-bottom:4px;">⚠ 연동 호출이 실패했습니다</div>
      <div style="white-space:pre-line;color:#7a3b3b;font-size:12px;">{{ st.message }}</div>
      <div style="margin-top:6px;font-size:12px;color:#9a6b6b;">
        대부분 <b>외부 키 미설정</b> 또는 <b>콘솔의 도메인 미등록</b>이 원인입니다. 아래 안내를 순서대로 따라하면 해결됩니다.
      </div>
    </div>
    <!-- 탭 -->
    <div style="display:flex;gap:4px;border-bottom:2px solid #eee;margin-bottom:14px;flex-wrap:wrap;">
      <button v-for="t in tabs" :key="t.id" @click="handleBtnAction('tab-select', t.id)"
        style="padding:7px 14px;border:none;border-radius:8px 8px 0 0;font-size:12px;font-weight:600;cursor:pointer;"
        :style="st.tab===t.id ? 'background:#1d4ed8;color:#fff;' : 'background:#f3f4f6;color:#666;'">
        {{ t.label }}
      </button>
    </div>

    <!-- ===== 발급 안내 탭 (구글/카카오/네이버/토스/kakaomap/navermap) ===== -->
    <template v-if="cfGuide">
      <!-- 요약 카드 -->
      <div style="display:flex;align-items:center;gap:10px;background:#f8fafc;border:1px solid #e8edf3;border-radius:10px;padding:12px 14px;margin-bottom:12px;">
        <span :style="'width:34px;height:34px;border-radius:8px;background:' + cfGuide.badgeBg + ';color:#333;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;flex-shrink:0;'">
          {{ cfGuide.badge }}
        </span>
        <div style="flex:1;">
          <div style="font-weight:700;margin-bottom:2px;">{{ cfGuide.label }} 설정 요약</div>
          <div style="font-size:12px;color:#555;">{{ cfGuide.summary }}</div>
        </div>
        <a :href="cfGuide.consoleUrl" target="_blank" rel="noopener"
          style="flex-shrink:0;background:#1d4ed8;color:#fff;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap;">
          {{ cfGuide.consoleNm }} 열기 ↗
        </a>
      </div>
      <!-- 현재 키 상태 -->
      <div style="margin-bottom:12px;">
        <div style="font-weight:700;margin-bottom:6px;">① 현재 키 설정 상태</div>
        <bo-grid bare :columns="guideKeysColumns" :rows="cfGuide.keys" row-key="store" style="font-size:12px;" />
        <div style="font-size:11px;color:#999;margin-top:4px;">
          예시 형식: <span style="font-family:monospace;">{{ cfGuide.keys[0].sample }}</span>
        </div>
      </div>
      <!-- 발급 단계 -->
      <div style="margin-bottom:12px;">
        <div style="font-weight:700;margin-bottom:6px;">② 키 발급 단계 (처음 하는 분도 그대로 따라하세요)</div>
        <ol style="margin:0;padding-left:0;list-style:none;display:flex;flex-direction:column;gap:8px;">
          <li v-for="(s, i) in cfGuide.steps" :key="i"
            style="display:flex;gap:10px;background:#fff;border:1px solid #f0f0f0;border-radius:8px;padding:10px 12px;">
            <span style="width:22px;height:22px;border-radius:50%;background:#eef2ff;color:#1d4ed8;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              {{ i + 1 }}
            </span>
            <div style="flex:1;">
              <div style="font-weight:700;margin-bottom:3px;">{{ s.t }}</div>
              <div style="white-space:pre-line;font-size:12px;color:#555;line-height:1.7;">{{ s.d }}</div>
            </div>
          </li>
        </ol>
      </div>
      <!-- 참고 영상 -->
      <div v-if="cfGuide.videos" style="margin-bottom:12px;">
        <div style="font-weight:700;margin-bottom:6px;">📺 참고 영상 (YouTube)</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <a v-for="(vd, i) in cfGuide.videos" :key="i" :href="vd.url" target="_blank" rel="noopener"
            style="display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #f0f0f0;border-radius:8px;padding:9px 12px;text-decoration:none;color:#333;">
            <span style="width:26px;height:26px;border-radius:6px;background:#ff0000;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">▶</span>
            <span style="flex:1;font-size:12px;font-weight:600;">{{ vd.t }}</span>
            <span style="flex-shrink:0;font-size:12px;color:#1d4ed8;font-weight:700;">열기 ↗</span>
          </a>
        </div>
        <div style="font-size:11px;color:#999;margin-top:4px;">
          ※ 외부 영상은 게시자 사정으로 변경/삭제될 수 있습니다. 콘솔 화면이 영상과 다르면 위 [발급 단계]를 우선 따르세요.
        </div>
      </div>
      <!-- 키 넣는 곳 바로가기 -->
      <div style="background:#fffbe8;border:1px solid #f5e6a8;border-radius:8px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;flex-shrink:0;">⚙</span>
        <div style="flex:1;font-size:12px;color:#6b5b1e;">
          발급받은 키를 <b>관리자 → 프로퍼티관리</b>에서 바로 입력할 수 있습니다.
          프로퍼티 키: <span style="font-family:monospace;font-weight:700;color:#1d4ed8;">{{ cfGuide.propKey }}</span>
        </div>
        <button @click="handleBtnAction('tab-select', 'prop')"
          style="flex-shrink:0;background:#b8860b;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;">
          프로퍼티관리 설정 방법 →
        </button>
      </div>
      <!-- FAQ -->
      <div>
        <div style="font-weight:700;margin-bottom:6px;">③ 자주 발생하는 오류</div>
        <bo-grid bare :columns="guideFaqColumns" :rows="cfGuide.faq" style="font-size:12px;" />
      </div>
    </template>

    <!-- ===== ⚙ 프로퍼티관리 설정 탭 ======================================= -->
    <template v-else-if="st.tab === 'prop'">
      <!-- 개요 -->
      <div style="background:#f0f7ff;border:1px solid #bcd6f5;border-radius:10px;padding:12px 14px;margin-bottom:14px;">
        <div style="font-weight:700;color:#1d4ed8;margin-bottom:6px;">📋 프로퍼티관리란?</div>
        <div style="font-size:12px;color:#334;line-height:1.8;">
          관리자 화면(BO) 로그인 후 <b>시스템 → 프로퍼티관리</b> 메뉴에서 SNS 로그인·결제·지도 키를 직접 관리할 수 있습니다.<br/>
          DB에 저장되므로 서버 재시작 없이 즉시 적용되며, 소스 코드를 수정하지 않아도 됩니다.
        </div>
      </div>
      <!-- 단계별 안내 -->
      <div style="font-weight:700;margin-bottom:8px;">① 프로퍼티관리 화면 진입 방법</div>
      <ol style="margin:0;padding-left:0;list-style:none;display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
        <li style="display:flex;gap:10px;background:#fff;border:1px solid #f0f0f0;border-radius:8px;padding:10px 12px;">
          <span style="width:22px;height:22px;border-radius:50%;background:#eef2ff;color:#1d4ed8;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</span>
          <div style="flex:1;font-size:12px;color:#555;line-height:1.7;">
            관리자 화면(bo.html)에 로그인합니다.<br/>
            <span style="font-family:monospace;color:#888;">기본 계정: admin / 1111</span>
          </div>
        </li>
        <li style="display:flex;gap:10px;background:#fff;border:1px solid #f0f0f0;border-radius:8px;padding:10px 12px;">
          <span style="width:22px;height:22px;border-radius:50%;background:#eef2ff;color:#1d4ed8;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</span>
          <div style="flex:1;font-size:12px;color:#555;line-height:1.7;">
            좌측 메뉴에서 <b>시스템 → 기준정보 → 프로퍼티관리</b>를 클릭합니다.
          </div>
        </li>
        <li style="display:flex;gap:10px;background:#fff;border:1px solid #f0f0f0;border-radius:8px;padding:10px 12px;">
          <span style="width:22px;height:22px;border-radius:50%;background:#eef2ff;color:#1d4ed8;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</span>
          <div style="flex:1;font-size:12px;color:#555;line-height:1.7;">
            우측 목록에서 설정할 항목의 <b>값(value) 셀을 클릭</b>하면 바로 편집됩니다.<br/>
            키(propKey)로 정렬하면 <span style="font-family:monospace;">ext.sdk.*</span> 항목을 한눈에 볼 수 있습니다.
          </div>
        </li>
        <li style="display:flex;gap:10px;background:#fff;border:1px solid #f0f0f0;border-radius:8px;padding:10px 12px;">
          <span style="width:22px;height:22px;border-radius:50%;background:#eef2ff;color:#1d4ed8;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</span>
          <div style="flex:1;font-size:12px;color:#555;line-height:1.7;">
            값을 입력한 후 상단 <b>[저장] 버튼</b>을 클릭합니다. 저장 즉시 DB에 반영됩니다.
          </div>
        </li>
        <li style="display:flex;gap:10px;background:#fff;border:1px solid #f0f0f0;border-radius:8px;padding:10px 12px;">
          <span style="width:22px;height:22px;border-radius:50%;background:#eef2ff;color:#1d4ed8;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">5</span>
          <div style="flex:1;font-size:12px;color:#555;line-height:1.7;">
            FO(사용자 화면)에 적용하려면 브라우저를 새로고침합니다. (로그인 시 서버에서 최신 설정을 자동으로 가져옴)
          </div>
        </li>
      </ol>
      <!-- 항목 목록 -->
      <div style="font-weight:700;margin-bottom:8px;">② 설정 가능한 항목 전체 목록</div>
      <bo-grid bare :columns="propItemsColumns" :rows="PROP_ITEMS" style="font-size:12px;margin-bottom:14px;" />
      <!-- 팁 박스 -->
      <div style="background:#f8fafc;border:1px solid #e8edf3;border-radius:8px;padding:10px 14px;font-size:12px;color:#555;line-height:1.8;">
        <b>💡 알아두면 편한 점</b><br/>
        · <b>사용여부(useYn) = Y</b> 인 항목만 서버에서 읽어 주입합니다. N 으로 설정하면 해당 기능이 비활성화됩니다.<br/>
        · 새 프로퍼티 추가 시 <b>[+ 행추가]</b> 버튼으로 빈 행을 만들고 키·값을 입력한 뒤 [저장]하면 됩니다.<br/>
        · 토스 <b>시크릿 키(sk_)</b>는 프로퍼티관리에 입력하면 안 됩니다 — 백엔드 환경변수(TOSS_SECRET_KEY)로만 설정하세요.<br/>
        · 값에 민감 정보(API 키 등)가 있으므로 관리자 권한이 있는 계정에서만 접근하도록 역할(Role)을 설정하세요.
      </div>
    </template>

    <!-- ===== 🌐 CDN URL 설정 탭 =========================================== -->
    <template v-else-if="st.tab === 'cdn'">
      <div style="background:#f0fff4;border:1px solid #b2e6c8;border-radius:10px;padding:12px 14px;margin-bottom:14px;">
        <div style="font-weight:700;color:#276749;margin-bottom:6px;">🌐 CDN URL 설정이란?</div>
        <div style="font-size:12px;color:#334;line-height:1.8;">
          CDN(Content Delivery Network)을 사용하면 이미지·정적파일을 빠르게 서빙할 수 있습니다.<br/>
          아래 프로퍼티 키를 <b>프로퍼티관리</b>에 등록하면 소스 수정 없이 CDN 주소를 교체할 수 있습니다.
        </div>
      </div>
      <!-- CDN 항목 목록 -->
      <div style="font-weight:700;margin-bottom:8px;">CDN 관련 프로퍼티 항목</div>
      <bo-grid bare :columns="cdnItemsColumns" :rows="CDN_ITEMS" style="font-size:12px;margin-bottom:14px;" />
      <!-- 등록 방법 -->
      <div style="font-weight:700;margin-bottom:8px;">프로퍼티관리에 CDN URL 등록하는 방법</div>
      <ol style="margin:0;padding-left:0;list-style:none;display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
        <li style="display:flex;gap:10px;background:#fff;border:1px solid #f0f0f0;border-radius:8px;padding:10px 12px;">
          <span style="width:22px;height:22px;border-radius:50%;background:#e8f5e9;color:#276749;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</span>
          <div style="flex:1;font-size:12px;color:#555;line-height:1.7;">
            관리자 → <b>시스템 → 기준정보 → 프로퍼티관리</b>로 이동합니다.
          </div>
        </li>
        <li style="display:flex;gap:10px;background:#fff;border:1px solid #f0f0f0;border-radius:8px;padding:10px 12px;">
          <span style="width:22px;height:22px;border-radius:50%;background:#e8f5e9;color:#276749;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</span>
          <div style="flex:1;font-size:12px;color:#555;line-height:1.7;">
            <b>[+ 행추가]</b> 버튼을 눌러 빈 행을 만듭니다.<br/>
            키(propKey)에 <span style="font-family:monospace;">cdn.url.base</span> 등 위 표의 키를 입력합니다.
          </div>
        </li>
        <li style="display:flex;gap:10px;background:#fff;border:1px solid #f0f0f0;border-radius:8px;padding:10px 12px;">
          <span style="width:22px;height:22px;border-radius:50%;background:#e8f5e9;color:#276749;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</span>
          <div style="flex:1;font-size:12px;color:#555;line-height:1.7;">
            값(propValue)에 CDN 도메인 URL 을 입력합니다.<br/>
            예: <span style="font-family:monospace;">https://cdn.myshop.com</span>  (끝에 / 없이)
          </div>
        </li>
        <li style="display:flex;gap:10px;background:#fff;border:1px solid #f0f0f0;border-radius:8px;padding:10px 12px;">
          <span style="width:22px;height:22px;border-radius:50%;background:#e8f5e9;color:#276749;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</span>
          <div style="flex:1;font-size:12px;color:#555;line-height:1.7;">
            타입은 <b>STRING</b>, 사용여부는 <b>Y</b> 로 설정 후 [저장]합니다.
          </div>
        </li>
      </ol>
      <!-- 주의사항 -->
      <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:10px 14px;font-size:12px;color:#555;line-height:1.8;">
        <b>⚠ 주의사항</b><br/>
        · 현재 이 소스는 <b>CDN 프로퍼티 값을 자동으로 읽는 코드가 아직 연결되어 있지 않습니다.</b><br/>
          프로퍼티 등록 후 해당 값을 사용하는 코드(예: <span style="font-family:monospace;">coUtil.cofImgSrc()</span>) 에서
          <span style="font-family:monospace;">boApiSvc.syProp.get('cdn.url.base')</span> 를 호출해 적용해야 합니다.<br/>
        · CDN 도메인은 <b>HTTPS</b>로 서빙되어야 하며, CORS 설정이 올바르게 되어 있어야 합니다.<br/>
        · 이미지 경로에 이미 절대 URL 이 저장된 경우(<span style="font-family:monospace;">https://...</span> 시작)는 CDN 치환 대상이 아닙니다.
      </div>
    </template>

    <!-- ===== 🔑 코드 직접 입력 탭 (개발 초기 / 소스 수정용) ================== -->
    <template v-else>
      <div style="font-weight:700;margin-bottom:8px;">소스 코드에 직접 키를 입력하는 방법 (개발 초기용)</div>
      <div style="background:#fff3e0;border:1px solid #ffcc80;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#555;line-height:1.7;">
        ⚠ 이 방법은 <b>개발 초기 테스트용</b>입니다. 운영 배포 시에는 반드시 <b>[⚙ 프로퍼티관리 설정] 탭</b>의 방법을 사용하세요.<br/>
        소스 코드에 실키가 들어가면 git push 시 노출될 수 있습니다.
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;">
        <div style="border:1px solid #d9e7ff;border-radius:10px;overflow:hidden;">
          <div style="background:#eef4ff;padding:8px 14px;font-weight:700;color:#1d4ed8;">
            데모/로컬 개발: AppStore 파일에 직접 입력
          </div>
          <div style="padding:10px 14px;font-size:12px;color:#555;line-height:1.8;">
            아래 두 파일을 텍스트 에디터로 엽니다.
            <div style="font-family:monospace;background:#f6f8fa;border:1px solid #eee;border-radius:6px;padding:8px 12px;margin:6px 0;">
              · 사용자 화면(FO): <b>lib/stores/fo/foAppStore.js</b><br/>
              · 관리자 화면(BO): <b>lib/stores/bo/boAppStore.js</b>
            </div>
            <b style="color:#1d4ed8;">정확한 위치</b> — 파일 안의
            <code style="background:#eef;padding:1px 5px;border-radius:4px;">..._emptyExt()</code> 줄 바로 아래에 키를 덮어씁니다.
            <pre style="background:#1e1e2e;color:#cdd9e5;border-radius:6px;padding:10px 14px;margin:6px 0;font-size:12px;line-height:1.7;overflow-x:auto;">  ..._emptyExt(),     <span style="color:#6a9955;">// ← 이 줄은 그대로 둠</span>
  <span style="color:#6a9955;">// ↓ 발급받은 실제 키를 이 아래에</span>
  svGoogleClientId:   '1234567890-abc123.apps.googleusercontent.com',
  svKakaoJsKey:       'a1b2c3d4e5f6...',
  svNaverClientId:    'AbC1dEf2GhI3...',
  svNaverCallbackUrl: '',  <span style="color:#6a9955;">// 비우면 현재 페이지 자동</span>
  svTossClientKey:    'test_gck_...',
  svKakaoMapJsKey:    'a1b2c3d4e5f6...',
  svNaverMapClientId: 'abcd1234ef...',</pre>
          </div>
        </div>
      </div>
      <!-- 전체 키 상태 -->
      <div style="font-weight:700;margin-bottom:6px;">전체 키 설정 상태 (현재 화면 기준)</div>
      <bo-grid bare :columns="allKeysColumns" :rows="ALL_KEYS" row-key="store" style="font-size:12px;margin-bottom:12px;" />
      <!-- 공통 점검 -->
      <div style="background:#f8fafc;border:1px solid #e8edf3;border-radius:8px;padding:10px 14px;font-size:12px;color:#555;line-height:1.8;">
        <b>키와 무관하게 함께 점검할 것</b><br/>
        · <b>팝업 차단</b>: 로그인/결제는 팝업으로 열립니다. 주소창 오른쪽 팝업 차단 아이콘에서 이 사이트를 허용하세요.<br/>
        · <b>도메인 등록</b>: 각 콘솔(구글/카카오/네이버)에 등록한 도메인은 현재 접속 주소
        <span style="font-family:monospace;">{{ ORIGIN }}</span> 와 포트까지 정확히 같아야 합니다.<br/>
        · <b>광고차단 확장</b>: 토스 SDK(js.tosspayments.com)가 차단될 수 있습니다 — 이 사이트를 예외 처리하세요.<br/>
        · <b>새로고침</b>: 키를 파일에 입력한 뒤에는 브라우저를 새로고침해야 적용됩니다.
      </div>
    </template>
  </div>
  <!-- 푸터 -->
  <template #footer>
    <div style="display:flex;justify-content:center;gap:8px;padding-top:4px;">
      <button class="btn btn_close" @click="handleBtnAction('modal-close')">닫기</button>
    </div>
  </template>
</component>
`,
  };
})();
