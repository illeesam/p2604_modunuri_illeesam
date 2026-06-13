/* ShopJoy - 외부 연동 설정 도움말 모달 (FO/BO 공용)
 * ─────────────────────────────────────────────────────────────────────────
 * SNS 로그인(구글/카카오/네이버)·토스 결제가 실패하면 자동으로 뜨는
 * "초보자용 설정 안내" 팝업. 소스 구매자가 외부 키를 직접 발급/설정할 수
 * 있도록 콘솔 발급 단계 → 키 입력 위치 → 자주 발생하는 오류를 안내한다.
 *
 * 전역 API (window.coExtHelp):
 *   - open({ kind:'social'|'pay', provider:'google'|'kakao'|'naver'|'toss', error, message })
 *       → 팝업 표시 후 true. 사용자 취소(USER_CANCEL/'취소')는 표시하지 않고 false 반환
 *         (호출자는 false 면 기존 toast 로 폴백).
 *   - openManual(tab)  → 실패 없이도 도움말을 직접 열기 (예: '도움말' 버튼).
 *   - close()
 *
 * 셸: BO(bo.html)에선 <bo-modal>, FO(index.html)에선 <fo-modal> — 동적 :is 로 자동 선택.
 * 마운트: foApp/boApp 루트 템플릿에 <co-ext-help-modal /> 1회 (전역 1인스턴스).
 * 키 안내의 기준 문서: lib/utils/coExtSdk.js 상단 "키 발급처 → 저장 위치" 표.
 * ───────────────────────────────────────────────────────────────────────── */
(function () {
  const ORIGIN   = window.location.origin;                              // 예: http://127.0.0.1:5501
  const PAGE_URL = ORIGIN + window.location.pathname;                   // 예: http://127.0.0.1:5501/index.html

  /* ── 전역 상태 + open/close API ─────────────────────────────────────── */
  const st = Vue.reactive({ show: false, tab: 'google', kind: 'social', message: '' });

  /* _DEMO_RE — 서버 init data 가 내려주는 데모 플레이스홀더 패턴.
   * 백엔드 getApp() 이 미설정 키에 'DEMO_*' / 'demo_*' / 'test_ck_DEMO_*' 더미를 채워 보내므로,
   * 이 값이 들어 있으면 "실제로는 미설정"으로 본다. (실키 오탐 방지: 토스 실테스트키 test_ck_/test_gck_ 는 DEMO 미포함) */
  const _DEMO_RE = /(^|_)demo(_|$)/i;
  const _isDemoVal = (v) => !!v && _DEMO_RE.test(String(v));

  /* _isUserCancel — 사용자가 직접 창을 닫은 경우는 설정 문제가 아님 → 팝업 제외 */
  const _isUserCancel = (err) => {
    if (!err) return false;
    const code = String((err && err.code) || '');
    const msg  = String((err && err.message) || err || '');
    return /USER_CANCEL/i.test(code) || /취소|canceled|cancelled|user.?cancel/i.test(msg);
  };

  /* _applyOpts — opts 로 모달 상태 세팅 (탭/종류/메시지) */
  const _applyOpts = (opts = {}) => {
    st.kind = opts.kind === 'pay' ? 'pay' : 'social';
    const p = String(opts.provider || '').toLowerCase();
    st.tab = (st.kind === 'pay') ? 'toss' : (['google', 'kakao', 'naver'].includes(p) ? p : 'google');
    st.message = String(opts.message || (opts.error && opts.error.message) || '');
  };

  window.coExtHelp = {
    /* open — 도움말 모달을 즉시 연다 (액션 버튼/도움말 버튼 등 명시적 클릭 전용).
     * 사용자 취소(USER_CANCEL/취소)면 열지 않고 false 반환. */
    open(opts = {}) {
      if (_isUserCancel(opts.error)) return false;
      _applyOpts(opts);
      st.show = true;
      return true;
    },
    /* toastAction — 실패 시 토스트에 붙일 액션 버튼 객체 {label, onClick} 을 반환.
     * 사용자 취소면 null (호출자는 일반 toast 만 표시). 자동으로 모달을 열지 않고,
     * 버튼 클릭 시점의 opts 로 모달을 연다 → "버튼 클릭하자마자 모달" 문제 해결. */
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

  /* ── 안내 데이터 (콘솔 발급 단계 — coExtSdk.js 상단 표와 동기 유지) ──── */
  const GUIDES = {
    google: {
      label: '구글 로그인', badge: 'G', badgeBg: '#4285f4',
      summary: 'Google Cloud 에서 "OAuth 클라이언트 ID" 1개만 발급받으면 됩니다. (무료 · 약 10분)',
      consoleNm: 'Google Cloud Console', consoleUrl: 'https://console.cloud.google.com',
      keys: [{ store: 'svGoogleClientId', server: 'syApp.googleClientId', what: 'OAuth 클라이언트 ID',
               sample: '1234567890-abc123.apps.googleusercontent.com' }],
      videos: [
        { t: 'Google 공식 — OAuth 클라이언트 ID 만들기 (Google for Developers 채널)', url: 'https://www.youtube.com/watch?v=Qt3KJZ2kQk4' },
        { t: '영상으로 더 찾아보기 (구글 OAuth 클라이언트 ID 발급)', url: 'https://www.youtube.com/results?search_query=google+oauth+client+id+%EB%B0%9C%EA%B8%89' },
      ],
      steps: [
        { t: 'Google Cloud Console 접속', d: 'console.cloud.google.com 에 접속해 구글 계정으로 로그인합니다.' },
        { t: '프로젝트 만들기', d: '상단의 프로젝트 선택 상자 → [새 프로젝트] → 이름은 자유롭게 입력(예: my-shop) → 만들기.' },
        { t: 'OAuth 동의 화면 설정', d: '좌측 메뉴 [API 및 서비스] → [OAuth 동의 화면] → User Type 은 "외부" 선택 → 앱 이름·지원 이메일만 입력하고 저장.\n게시 전(테스트 모드)이라면 [테스트 사용자]에 본인 구글 이메일을 추가해야 본인 계정으로 로그인됩니다.' },
        { t: 'OAuth 클라이언트 ID 만들기', d: '[API 및 서비스] → [사용자 인증 정보] → [+ 사용자 인증 정보 만들기] → [OAuth 클라이언트 ID] → 애플리케이션 유형 "웹 애플리케이션" 선택.' },
        { t: '승인된 자바스크립트 원본 등록', d: '"승인된 자바스크립트 원본"에 아래 현재 주소를 그대로 추가합니다 (포트 번호까지 정확히).\n→ ' + ORIGIN + '\n운영 도메인이 따로 있으면 그 주소도 함께 추가합니다 (예: https://www.myshop.com).' },
        { t: '클라이언트 ID 복사', d: '[만들기]를 누르면 "클라이언트 ID"(…apps.googleusercontent.com 으로 끝남)가 표시됩니다. 이 값을 복사하세요.\n※ "클라이언트 보안 비밀번호(secret)"는 이 프로젝트에서 사용하지 않습니다 — 절대 프론트 소스에 넣지 마세요.' },
        { t: '키 입력', d: '복사한 클라이언트 ID 를 svGoogleClientId 에 입력합니다. (입력 위치는 [키 입력 방법] 탭 참고)' },
      ],
      faq: [
        { q: '로그인 창이 아예 안 뜸', a: '브라우저 주소창 오른쪽의 팝업 차단 아이콘을 눌러 이 사이트의 팝업을 허용하세요.' },
        { q: 'origin_mismatch / redirect_uri_mismatch', a: '"승인된 자바스크립트 원본"에 등록한 주소와 현재 접속 주소(' + ORIGIN + ')가 다릅니다. http/https·포트까지 똑같이 등록하세요.' },
        { q: 'access_denied / 테스트 중 앱', a: 'OAuth 동의 화면이 테스트 모드일 때는 [테스트 사용자]에 등록된 계정만 로그인할 수 있습니다.' },
        { q: '키 미설정 안내가 계속 나옴', a: 'svGoogleClientId 가 비어 있습니다. [키 입력 방법] 탭의 안내대로 키를 넣고 새로고침하세요.' },
      ],
    },
    kakao: {
      label: '카카오 로그인', badge: 'K', badgeBg: '#fee500',
      summary: '카카오 디벨로퍼스에서 앱을 만들고 "JavaScript 키"를 발급받습니다. (무료 · 약 10분) ⚠ 카카오 SDK v2는 팝업 로그인을 지원하지 않아 별도 처리가 필요합니다(아래 참고).',
      consoleNm: '카카오 디벨로퍼스', consoleUrl: 'https://developers.kakao.com',
      keys: [{ store: 'svKakaoJsKey', server: 'syApp.kakaoJsKey', what: 'JavaScript 키',
               sample: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4' }],
      videos: [
        { t: '카카오 로그인 앱 등록 · JavaScript 키 발급 따라하기', url: 'https://www.youtube.com/results?search_query=%EC%B9%B4%EC%B9%B4%EC%98%A4+%EB%A1%9C%EA%B7%B8%EC%9D%B8+JavaScript+%ED%82%A4+%EB%B0%9C%EA%B8%89' },
        { t: '카카오 로그인 연동(redirect 방식) 구현 영상', url: 'https://www.youtube.com/results?search_query=%EC%B9%B4%EC%B9%B4%EC%98%A4+%EB%A1%9C%EA%B7%B8%EC%9D%B8+%EC%97%B0%EB%8F%99+redirect' },
      ],
      steps: [
        { t: '⚠ 먼저 알아두기 (SDK 버전)', d: '이 소스는 카카오 SDK v2(t1.kakaocdn.net/kakao_js_sdk/2.7.2)를 로드합니다.\n카카오는 v2부터 보안 정책상 "팝업 로그인"을 제거하고 redirect 방식(인가코드 → 백엔드 토큰 교환)만 지원합니다.\n→ 팝업 방식을 그대로 쓰려면 index.html/bo.html 의 카카오 SDK 를 v1 으로 교체하거나, redirect 흐름을 구현해야 합니다. 키 발급 절차 자체는 동일합니다.' },
        { t: '카카오 디벨로퍼스 접속', d: 'developers.kakao.com 에 접속해 카카오 계정으로 로그인합니다.' },
        { t: '애플리케이션 추가', d: '[내 애플리케이션] → [애플리케이션 추가하기] → 앱 이름·회사명은 자유롭게 입력 → 저장.' },
        { t: 'JavaScript 키 복사', d: '생성한 앱 클릭 → [앱 설정 > 앱 키] 화면에서 "JavaScript 키"를 복사합니다.\n※ REST API 키·Admin 키가 아니라 반드시 "JavaScript 키"입니다.' },
        { t: 'Web 플랫폼 등록', d: '[앱 설정 > 플랫폼] → [Web 플랫폼 등록] → 사이트 도메인에 아래 현재 주소를 등록합니다.\n→ ' + ORIGIN },
        { t: '카카오 로그인 활성화', d: '[제품 설정 > 카카오 로그인] → "활성화 설정" ON → Redirect URI 에 아래 주소를 등록합니다.\n→ ' + PAGE_URL + '\n(v2 redirect 방식은 Redirect URI 가 반드시 필요합니다)' },
        { t: '동의항목 설정', d: '[제품 설정 > 카카오 로그인 > 동의항목] → 닉네임은 "필수 동의", 카카오계정(이메일)은 "선택 동의"로 설정.' },
        { t: '키 입력', d: '복사한 JavaScript 키를 svKakaoJsKey 에 입력합니다. (입력 위치는 [키 입력 방법] 탭 참고)' },
      ],
      faq: [
        { q: '현재 로드된 Kakao SDK(v2)는 팝업 로그인을 지원하지 않습니다', a: '카카오 v2 는 보안상 팝업식(Kakao.Auth.login)을 제거했습니다. 팝업이 필요하면 HTML 의 카카오 SDK 를 v1 으로 교체하거나, redirect 방식(Kakao.Auth.authorize → 백엔드 토큰 교환)을 구현하세요.' },
        { q: 'KOE101 (앱 관리자 설정 오류)', a: 'JavaScript 키가 잘못되었습니다. 앱 키 화면에서 "JavaScript 키"를 다시 복사해 넣으세요.' },
        { q: 'KOE006 (등록되지 않은 도메인)', a: '[플랫폼 > Web] 의 사이트 도메인에 현재 주소(' + ORIGIN + ')가 등록되어 있는지 확인하세요.' },
        { q: '로그인 창이 안 뜸', a: '브라우저 팝업 차단을 해제하세요.' },
      ],
    },
    naver: {
      label: '네이버 로그인', badge: 'N', badgeBg: '#03c75a',
      summary: '네이버 개발자센터에 애플리케이션을 등록하고 "Client ID"를 발급받습니다. (무료 · 약 10분)',
      consoleNm: '네이버 개발자센터', consoleUrl: 'https://developers.naver.com',
      keys: [
        { store: 'svNaverClientId',    server: 'syApp.naverClientId',    what: 'Client ID',                sample: 'AbC1dEf2GhI3jKl4MnO5' },
        { store: 'svNaverCallbackUrl', server: 'syApp.naverCallbackUrl', what: 'Callback URL (선택)',      sample: PAGE_URL },
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
        { t: '키 입력', d: '복사한 Client ID 를 svNaverClientId 에 입력합니다. Callback URL 을 위와 다르게 등록했다면 svNaverCallbackUrl 에도 같은 값을 입력하세요. (미입력 시 현재 페이지 주소를 자동 사용)' },
      ],
      faq: [
        { q: 'invalid_request / 잘못된 Client ID', a: 'svNaverClientId 값이 비었거나 오타입니다. [내 애플리케이션]의 Client ID 를 다시 복사하세요.' },
        { q: 'Callback URL 불일치', a: '개발자센터에 등록한 Callback URL 과 실제 주소(' + PAGE_URL + ')가 글자 단위로 같아야 합니다.' },
        { q: '로그인 창이 안 뜸', a: '브라우저 팝업 차단을 해제하세요. Naver Login SDK 스크립트 로드 여부도 확인하세요.' },
      ],
    },
    toss: {
      label: '토스 결제', badge: '₩', badgeBg: '#0064ff',
      summary: '토스페이먼츠 개발자센터에서 "클라이언트 키"를 발급받습니다. 키가 없어도 공용 테스트 키로 테스트 결제창은 열립니다. (테스트 무료 · 약 5분)',
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
        { t: '테스트 클라이언트 키 확인', d: '로그인 후 [내 개발정보] (또는 상점 선택 → API 키 메뉴)에서 "클라이언트 키"를 복사합니다.\n※ 결제위젯용 키는 test_gck_ 또는 test_ck_ 로 시작합니다.\n※ sk_ 로 시작하는 "시크릿 키"는 서버 전용 — 프론트에 절대 넣지 마세요. (서버 환경변수 TOSS_SECRET_KEY 로 설정)' },
        { t: '키 입력', d: '복사한 클라이언트 키를 svTossClientKey 에 입력합니다. (입력 위치는 [키 입력 방법] 탭 참고)' },
        { t: '(운영 전환 시)', d: '토스페이먼츠와 입점 계약 후 live_ 키를 발급받아 운영 사이트 설정에 교체 입력합니다.\n※ BO 주문화면의 "브랜드페이" 결제는 토스 브랜드페이 별도 약정이 있어야 동작합니다. 약정 전에는 일반 결제위젯을 사용하세요.' },
      ],
      faq: [
        { q: '결제창이 아예 안 뜸 (SDK 미로드)', a: 'js.tosspayments.com 스크립트가 차단되었습니다. 광고차단 확장프로그램(AdBlock 등)을 끄거나 이 사이트를 예외 처리하고, 네트워크 상태를 확인하세요.' },
        { q: '인증 실패 / 유효하지 않은 키', a: 'svTossClientKey 오타이거나 시크릿 키(sk_)를 넣은 경우입니다. "클라이언트 키"(ck/gck)를 다시 복사하세요.' },
        { q: '브랜드페이가 연동되지 않았습니다', a: '브랜드페이는 토스와 별도 약정이 필요한 상품입니다. 약정 전에는 테스트 위젯 결제만 가능합니다.' },
        { q: '결제가 취소되었습니다', a: '사용자가 결제창을 직접 닫은 것으로, 설정 오류가 아닙니다.' },
      ],
    },
    kakaomap: {
      label: '카카오 지도', badge: '🗺', badgeBg: '#fee500',
      summary: '카카오 디벨로퍼스의 "JavaScript 키"를 사용합니다. (로그인용 앱과 같은 키를 써도 되고, 지도 전용 앱을 따로 만들어도 됩니다. 무료 · 약 5분)',
      consoleNm: '카카오 디벨로퍼스', consoleUrl: 'https://developers.kakao.com',
      keys: [{ store: 'svKakaoMapJsKey', server: 'syApp.kakaoMapJsKey', what: 'JavaScript 키 (지도용)',
               sample: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4' }],
      videos: [
        { t: '카카오맵 API 키 발급 · 웹 지도 띄우기 따라하기', url: 'https://www.youtube.com/results?search_query=%EC%B9%B4%EC%B9%B4%EC%98%A4%EB%A7%B5+api+%ED%82%A4+%EB%B0%9C%EA%B8%89+%EC%A7%80%EB%8F%84' },
        { t: '카카오맵(Kakao Maps) JavaScript SDK 사용법', url: 'https://www.youtube.com/results?search_query=kakao+map+javascript+sdk' },
      ],
      steps: [
        { t: '카카오 디벨로퍼스 접속', d: 'developers.kakao.com 에 로그인합니다. 로그인용 앱이 이미 있으면 그 앱의 JavaScript 키를 그대로 써도 됩니다.' },
        { t: '앱의 JavaScript 키 복사', d: '[내 애플리케이션] → 앱 선택 → [앱 설정 > 앱 키] 에서 "JavaScript 키"를 복사합니다. (지도도 로그인과 동일한 JavaScript 키를 사용)' },
        { t: 'Web 플랫폼 도메인 등록', d: '[앱 설정 > 플랫폼] → [Web 플랫폼 등록] → 사이트 도메인에 아래 현재 주소를 등록해야 지도가 표시됩니다.\n→ ' + ORIGIN },
        { t: '카카오맵 사용 설정 확인', d: '카카오맵은 별도 활성화 없이 JavaScript 키 + 도메인 등록만으로 동작합니다. (지도 API는 무료 일일 호출 한도 내 사용)' },
        { t: '키 입력', d: '복사한 JavaScript 키를 svKakaoMapJsKey 에 입력합니다. (입력 위치는 [키 입력 방법] 탭 참고)' },
      ],
      faq: [
        { q: '지도가 회색 빈 화면으로만 나옴', a: '[플랫폼 > Web] 사이트 도메인에 현재 주소(' + ORIGIN + ')가 등록되어 있는지 확인하세요. 포트까지 정확히 같아야 합니다.' },
        { q: 'appkey 가 유효하지 않습니다', a: 'svKakaoMapJsKey 가 비었거나 오타입니다. REST API 키가 아니라 "JavaScript 키"인지 확인하세요.' },
        { q: '지도 SDK 로드 실패', a: 'dapi.kakao.com 스크립트가 광고차단/네트워크로 막혔는지 확인하세요.' },
      ],
    },
    navermap: {
      label: '네이버 지도', badge: '🗺', badgeBg: '#03c75a',
      summary: '네이버 클라우드 플랫폼(NCP)에서 Maps Application 을 등록하고 "Client ID"(ncpClientId)를 발급받습니다. (NCP 가입 필요 · 약 10분)',
      consoleNm: '네이버 클라우드 플랫폼', consoleUrl: 'https://console.ncloud.com',
      keys: [{ store: 'svNaverMapClientId', server: 'syApp.naverMapClientId', what: 'Client ID (ncpClientId)',
               sample: 'abcd1234ef' }],
      videos: [
        { t: '네이버 지도(NCP Maps) API 신청 · Client ID 발급 따라하기', url: 'https://www.youtube.com/results?search_query=%EB%84%A4%EC%9D%B4%EB%B2%84+%EC%A7%80%EB%8F%84+api+%ED%81%B4%EB%9D%BC%EC%9D%B4%EC%96%B8%ED%8A%B8+id+%EB%B0%9C%EA%B8%89' },
        { t: '네이버 클라우드 플랫폼 Maps 연동 영상', url: 'https://www.youtube.com/results?search_query=ncloud+maps+web+dynamic+map' },
      ],
      steps: [
        { t: '네이버 클라우드 플랫폼 가입', d: 'console.ncloud.com 에 접속해 가입/로그인합니다. (네이버 "개발자센터(developers.naver.com)"가 아니라 "클라우드 플랫폼(NCP)"입니다 — 헷갈리기 쉬움)' },
        { t: 'Maps 서비스 신청', d: 'Services → AI·Application Service → [Maps] → [Application 등록]. 결제수단 등록이 요구될 수 있으나 Web Dynamic Map 은 일정 호출까지 무료입니다.' },
        { t: 'Web 서비스 URL 등록', d: 'Application 등록 시 "Web 서비스 URL"에 아래 현재 주소를 등록합니다 (등록 도메인에서만 지도가 표시됨).\n→ ' + ORIGIN },
        { t: 'Client ID 복사', d: '등록 완료 후 발급된 "Client ID"(=ncpClientId)를 복사합니다.\n※ Client Secret 은 프론트 지도에는 사용하지 않습니다.' },
        { t: '키 입력', d: '복사한 Client ID 를 svNaverMapClientId 에 입력합니다. (입력 위치는 [키 입력 방법] 탭 참고)' },
      ],
      faq: [
        { q: '지도가 안 뜨고 인증 실패(Authentication Failed) 표시', a: 'Application 의 "Web 서비스 URL"에 현재 주소(' + ORIGIN + ')가 등록되어 있는지 확인하세요. http/https·포트까지 같아야 합니다.' },
        { q: 'ncpClientId 오류', a: 'svNaverMapClientId 값이 비었거나 오타입니다. NCP 콘솔의 Maps Application 에서 Client ID 를 다시 복사하세요.' },
        { q: '개발자센터에서 발급한 키를 넣었는데 안 됨', a: '지도는 developers.naver.com(로그인용)이 아니라 console.ncloud.com(클라우드 플랫폼)의 Maps Client ID 를 사용합니다. 발급처가 다릅니다.' },
      ],
    },
  };

  /* ── 키 입력 방법(공통) 탭 데이터 ──────────────────────────────────── */
  const ALL_KEYS = [
    { store: 'svGoogleClientId',  what: '구글 로그인 — OAuth 클라이언트 ID' },
    { store: 'svKakaoJsKey',      what: '카카오 로그인 — JavaScript 키' },
    { store: 'svNaverClientId',   what: '네이버 로그인 — Client ID' },
    { store: 'svNaverCallbackUrl', what: '네이버 로그인 — Callback URL (선택)' },
    { store: 'svTossClientKey',   what: '토스 결제 — 클라이언트 키 (미설정 시 테스트 키 폴백)' },
    { store: 'svKakaoMapJsKey',   what: '카카오 지도 — JavaScript 키' },
    { store: 'svNaverMapClientId', what: '네이버 지도 — Client ID (ncpClientId)' },
  ];

  /* ── 컴포넌트 ──────────────────────────────────────────────────────── */
  window.CoExtHelpModal = {
    name: 'CoExtHelpModal',
    setup() {
      /* ##### [01] 초기 변수 정의 ############################################ */
      const { computed } = Vue;
      /* 셸 자동 선택: bo.html 에는 boAuthStore 가, index.html 에는 foAuthStore 가 로드됨 */
      const shell = (typeof window.useBoAuthStore === 'function') ? 'bo-modal' : 'fo-modal';

      const tabs = [
        { id: 'google',   label: '구글 로그인' },
        { id: 'kakao',    label: '카카오 로그인' },
        { id: 'naver',    label: '네이버 로그인' },
        { id: 'toss',     label: '토스 결제' },
        { id: 'kakaomap', label: '카카오 지도' },
        { id: 'navermap', label: '네이버 지도' },
        { id: 'input',    label: '🔑 키 입력 방법' },
      ];

      /* ##### [02] 액션 모음 (dispatch) ###################################### */
      const handleBtnAction = (cmd, param) => {
        if (cmd === 'modal-close')  return window.coExtHelp.close();
        if (cmd === 'tab-select')   { st.tab = param; return; }
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      };

      /* ##### [05] 사용자 함수 (헬퍼) ######################################## */
      /* fnKeySet — AppStore(svXxx) 키 설정 여부 (FO/BO 자동 판별) */
      const _appStore = () => {
        try { if (typeof window.useFoAppStore === 'function') return window.useFoAppStore(); } catch (e) { /* 미로드 무시 */ }
        try { if (typeof window.useBoAppStore === 'function') return window.useBoAppStore(); } catch (e) { /* 미로드 무시 */ }
        return null;
      };
      /* fnKeyState — 키 상태 3분류: 'set'(실키) | 'demo'(서버 데모 더미) | 'unset'(빈값) */
      const fnKeyState = (name) => {
        const s = _appStore();
        const v = s && s[name];
        if (!v) return 'unset';
        return _isDemoVal(v) ? 'demo' : 'set';
      };
      /* fnKeyBadge — 상태표 뱃지 스타일/문구 */
      const fnKeyBadge = (name) => {
        const st2 = fnKeyState(name);
        if (st2 === 'set')  return { text: '✓ 설정됨',       css: 'background:#e8f5e9;color:#2e7d32;border-radius:6px;padding:2px 8px;font-weight:700;' };
        if (st2 === 'demo') return { text: '✕ 데모값(미설정)', css: 'background:#fff7e6;color:#b8860b;border-radius:6px;padding:2px 8px;font-weight:700;' };
        return { text: '✕ 미설정', css: 'background:#fff3f3;color:#c0392b;border-radius:6px;padding:2px 8px;font-weight:700;' };
      };

      const cfGuide = computed(() => GUIDES[st.tab] || null);
      const cfTitle = computed(() => {
        if (st.tab === 'kakaomap' || st.tab === 'navermap') return '지도 연동 설정 도움말';
        if (st.kind === 'pay') return '결제 연동 설정 도움말';
        return 'SNS 로그인 설정 도움말';
      });

      /* ##### [06] return (템플릿 노출) ###################################### */
      return { st, shell, tabs, handleBtnAction, fnKeyState, fnKeyBadge, cfGuide, cfTitle,
               ALL_KEYS, ORIGIN, PAGE_URL };
    },
    template: /* html */`
<component :is="shell" :show="st.show" :title="'🛠 ' + cfTitle" width="900px" max-height="86vh"
  body-pad="16px" @close="handleBtnAction('modal-close')">
  <div style="font-size:13px;color:#333;">
    <!-- ===== ■. 실패 안내 배너 (에러 메시지가 있을 때) ======================== -->
    <div v-if="st.message" style="background:#fff5f5;border:1px solid #ffd2d2;border-radius:8px;padding:10px 14px;margin-bottom:12px;">
      <div style="font-weight:700;color:#c0392b;margin-bottom:4px;">
        ⚠ 연동 호출이 실패했습니다
      </div>
      <div style="white-space:pre-line;color:#7a3b3b;font-size:12px;">
        {{ st.message }}
      </div>
      <div style="margin-top:6px;font-size:12px;color:#9a6b6b;">
        대부분 <b>외부 키 미설정</b> 또는 <b>콘솔의 도메인 미등록</b>이 원인입니다. 아래 안내를 순서대로 따라하면 해결됩니다.
      </div>
    </div>
    <!-- ===== ■. 탭 ======================================================== -->
    <div style="display:flex;gap:4px;border-bottom:2px solid #eee;margin-bottom:14px;flex-wrap:wrap;">
      <button v-for="t in tabs" :key="t.id" @click="handleBtnAction('tab-select', t.id)"
        style="padding:7px 14px;border:none;border-radius:8px 8px 0 0;font-size:13px;font-weight:600;"
        :style="st.tab===t.id ? 'background:#1d4ed8;color:#fff;' : 'background:#f3f4f6;color:#666;'">
        {{ t.label }}
      </button>
    </div>
    <!-- ===== ■. 발급 안내 탭 (구글/카카오/네이버/토스) ========================= -->
    <template v-if="cfGuide">
      <!-- ===== ■.■. 요약 카드 ============================================== -->
      <div style="display:flex;align-items:center;gap:10px;background:#f8fafc;border:1px solid #e8edf3;border-radius:10px;padding:12px 14px;margin-bottom:12px;">
        <span :style="'width:34px;height:34px;border-radius:8px;background:' + cfGuide.badgeBg + ';color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;flex-shrink:0;'">
          {{ cfGuide.badge }}
        </span>
        <div style="flex:1;">
          <div style="font-weight:700;margin-bottom:2px;">
            {{ cfGuide.label }} 설정 요약
          </div>
          <div style="font-size:12px;color:#555;">
            {{ cfGuide.summary }}
          </div>
        </div>
        <a :href="cfGuide.consoleUrl" target="_blank" rel="noopener"
          style="flex-shrink:0;background:#1d4ed8;color:#fff;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap;">
          {{ cfGuide.consoleNm }} 열기 ↗
        </a>
      </div>
      <!-- ===== ■.■. 현재 키 상태 =========================================== -->
      <div style="margin-bottom:12px;">
        <div style="font-weight:700;margin-bottom:6px;">
          ① 현재 키 설정 상태
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:#f8f9fa;">
              <th style="border:1px solid #eee;padding:6px 10px;text-align:left;">무엇</th>
              <th style="border:1px solid #eee;padding:6px 10px;text-align:left;">키 이름 (이 소스 기준)</th>
              <th style="border:1px solid #eee;padding:6px 10px;text-align:left;width:90px;">상태</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="k in cfGuide.keys" :key="k.store">
              <td style="border:1px solid #eee;padding:6px 10px;">{{ k.what }}</td>
              <td style="border:1px solid #eee;padding:6px 10px;font-family:monospace;">{{ k.store }}</td>
              <td style="border:1px solid #eee;padding:6px 10px;">
                <span :style="fnKeyBadge(k.store).css">
                  {{ fnKeyBadge(k.store).text }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div style="font-size:11px;color:#999;margin-top:4px;">
          예시 형식: <span style="font-family:monospace;">{{ cfGuide.keys[0].sample }}</span>
        </div>
      </div>
      <!-- ===== ■.■. 발급 단계 ============================================== -->
      <div style="margin-bottom:12px;">
        <div style="font-weight:700;margin-bottom:6px;">
          ② 키 발급 단계 (처음 하는 분도 그대로 따라하세요)
        </div>
        <ol style="margin:0;padding-left:0;list-style:none;display:flex;flex-direction:column;gap:8px;">
          <li v-for="(s, i) in cfGuide.steps" :key="i"
            style="display:flex;gap:10px;background:#fff;border:1px solid #f0f0f0;border-radius:8px;padding:10px 12px;">
            <span style="width:22px;height:22px;border-radius:50%;background:#eef2ff;color:#1d4ed8;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              {{ i + 1 }}
            </span>
            <div style="flex:1;">
              <div style="font-weight:700;margin-bottom:3px;">
                {{ s.t }}
              </div>
              <div style="white-space:pre-line;font-size:12px;color:#555;line-height:1.7;">
                {{ s.d }}
              </div>
            </div>
          </li>
        </ol>
      </div>
      <!-- ===== ■.■. 참고 영상 (YouTube) ==================================== -->
      <div v-if="cfGuide.videos" style="margin-bottom:12px;">
        <div style="font-weight:700;margin-bottom:6px;">
          📺 참고 영상 (YouTube)
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <a v-for="(vd, i) in cfGuide.videos" :key="i" :href="vd.url" target="_blank" rel="noopener"
            style="display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #f0f0f0;border-radius:8px;padding:9px 12px;text-decoration:none;color:#333;">
            <span style="width:26px;height:26px;border-radius:6px;background:#ff0000;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">
              ▶
            </span>
            <span style="flex:1;font-size:12px;font-weight:600;">
              {{ vd.t }}
            </span>
            <span style="flex-shrink:0;font-size:12px;color:#1d4ed8;font-weight:700;">
              열기 ↗
            </span>
          </a>
        </div>
        <div style="font-size:11px;color:#999;margin-top:4px;">
          ※ 외부 영상은 게시자 사정으로 변경/삭제될 수 있습니다. 콘솔 화면이 영상과 다르면 위 [발급 단계]를 우선 따르세요.
        </div>
      </div>
      <!-- ===== ■.■. 키 넣는 곳 바로가기 ===================================== -->
      <div style="background:#fffbe8;border:1px solid #f5e6a8;border-radius:8px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;flex-shrink:0;">🔑</span>
        <div style="flex:1;font-size:12px;color:#6b5b1e;">
          발급받은 키를 <b>어디에 입력하는지</b>는 [키 입력 방법] 탭에 정리되어 있습니다. (데모는 파일 1곳 수정, 운영은 관리자 사이트 설정)
        </div>
        <button @click="handleBtnAction('tab-select', 'input')"
          style="flex-shrink:0;background:#b8860b;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;">
          키 입력 방법 보기 →
        </button>
      </div>
      <!-- ===== ■.■. 자주 발생하는 오류 ====================================== -->
      <div>
        <div style="font-weight:700;margin-bottom:6px;">
          ③ 자주 발생하는 오류
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:#f8f9fa;">
              <th style="border:1px solid #eee;padding:6px 10px;text-align:left;width:38%;">증상</th>
              <th style="border:1px solid #eee;padding:6px 10px;text-align:left;">해결</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(f, i) in cfGuide.faq" :key="i">
              <td style="border:1px solid #eee;padding:6px 10px;color:#c0392b;">{{ f.q }}</td>
              <td style="border:1px solid #eee;padding:6px 10px;color:#555;">{{ f.a }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
    <!-- ===== ■. 키 입력 방법 탭 (공통) ====================================== -->
    <template v-else>
      <div style="font-weight:700;margin-bottom:6px;">
        발급받은 키를 넣는 두 가지 방법
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;">
        <!-- 방법 A: 데모/로컬 -->
        <div style="border:1px solid #d9e7ff;border-radius:10px;overflow:hidden;">
          <div style="background:#eef4ff;padding:8px 14px;font-weight:700;color:#1d4ed8;">
            방법 A — 데모/로컬: 파일에 직접 입력 (가장 간단, 추천 시작점)
          </div>
          <div style="padding:10px 14px;font-size:12px;color:#555;line-height:1.8;">
            아래 두 파일을 텍스트 에디터로 엽니다. (FO·BO 둘 다 같은 키를 넣어야 양쪽 화면에서 동작)
            <div style="font-family:monospace;background:#f6f8fa;border:1px solid #eee;border-radius:6px;padding:8px 12px;margin:6px 0;">
              · 사용자 화면(FO): <b>lib/stores/fo/foAppStore.js</b><br/>
              · 관리자 화면(BO): <b>lib/stores/bo/boAppStore.js</b>
            </div>
            <b style="color:#1d4ed8;">정확한 위치</b> — 파일 안의 <code style="background:#eef;padding:1px 5px;border-radius:4px;">state: () =&gt; ({ ... })</code> 블록에서
            <code style="background:#eef;padding:1px 5px;border-radius:4px;">..._emptyExt()</code> 라고 적힌 줄을 찾으세요.
            이 줄이 모든 키를 빈 값('')으로 깔기 때문에, 발급키는 <b>반드시 <code style="background:#eef;padding:1px 5px;border-radius:4px;">..._emptyExt()</code> 바로 아래 줄</b>에 적어 덮어써야 합니다(순서 중요).
            <pre style="background:#1e1e2e;color:#cdd9e5;border-radius:6px;padding:10px 14px;margin:6px 0;font-size:12px;line-height:1.7;overflow-x:auto;">  state: () =&gt; ({
    svFoSiteNo: '01',
    svAppVersion: '2.6.0',
    svLastUpdateDate: '',
    svActive: '-',
    ..._emptyExt(),          <span style="color:#6a9955;">// ← 모든 키를 '' 로 초기화 (이 줄은 그대로 둠)</span>

    <span style="color:#6a9955;">// ↓↓↓ 발급받은 실제 키를 이 아래에 적어 위 빈 값을 덮어씁니다 ↓↓↓</span>
    svGoogleClientId:   '1234567890-abc123.apps.googleusercontent.com',
    svKakaoJsKey:       'a1b2c3d4e5f6...(로그인용 JavaScript 키)',
    svNaverClientId:    'AbC1dEf2GhI3...(로그인 Client ID)',
    svNaverCallbackUrl: '',  <span style="color:#6a9955;">// 비우면 현재 페이지 주소 자동 사용</span>
    svTossClientKey:    'test_gck_...(토스 클라이언트 키)',
    svKakaoMapJsKey:    'a1b2c3d4e5f6...(지도용 JavaScript 키)',
    svNaverMapClientId: 'abcd1234ef...(NCP Maps Client ID)',
  }),</pre>
            ※ 카카오는 <b>로그인용(svKakaoJsKey)</b>과 <b>지도용(svKakaoMapJsKey)</b>을 따로 둡니다(같은 JavaScript 키를 양쪽에 넣어도 됨).
            네이버는 <b>로그인(svNaverClientId, developers.naver.com)</b>과 <b>지도(svNaverMapClientId, console.ncloud.com)</b>의 <b>발급처가 다릅니다</b>.<br/>
            ※ 로그인하면 서버 설정값이 우선 적용되지만, 서버가 비어 있거나 <b>데모(DEMO_…) 값</b>이면 위에서 넣은 키가 그대로 유지됩니다. 운영 배포 시에는 방법 B 를 사용하세요.
          </div>
        </div>
        <!-- 방법 B: 운영 -->
        <div style="border:1px solid #e3d9ff;border-radius:10px;overflow:hidden;">
          <div style="background:#f4efff;padding:8px 14px;font-weight:700;color:#6a1b9a;">
            방법 B — 운영: 관리자 사이트 설정에 저장 (서버 주입)
          </div>
          <div style="padding:10px 14px;font-size:12px;color:#555;line-height:1.8;">
            관리자 화면(bo.html) 로그인 → 사이트 설정에서 키를 저장하면, 로그인 시 서버 초기화 데이터(syApp.googleClientId 등)로
            모든 화면에 자동 주입됩니다.<br/>
            ※ 서버 측 보관 항목: syApp.googleClientId / kakaoJsKey / naverClientId / naverCallbackUrl / tossClientKey / kakaoMapJsKey / naverMapClientId 등.<br/>
            ※ 토스 <b>시크릿 키(sk_)</b>는 화면이 아니라 백엔드 환경변수(TOSS_SECRET_KEY)로만 설정합니다 — 프론트에 넣으면 유출됩니다.
          </div>
        </div>
      </div>
      <!-- 전체 키 상태 -->
      <div style="font-weight:700;margin-bottom:6px;">
        전체 키 설정 상태 (현재 화면 기준)
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:12px;">
        <thead>
          <tr style="background:#f8f9fa;">
            <th style="border:1px solid #eee;padding:6px 10px;text-align:left;">키 이름</th>
            <th style="border:1px solid #eee;padding:6px 10px;text-align:left;">용도</th>
            <th style="border:1px solid #eee;padding:6px 10px;text-align:left;width:90px;">상태</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="k in ALL_KEYS" :key="k.store">
            <td style="border:1px solid #eee;padding:6px 10px;font-family:monospace;">{{ k.store }}</td>
            <td style="border:1px solid #eee;padding:6px 10px;">{{ k.what }}</td>
            <td style="border:1px solid #eee;padding:6px 10px;">
              <span :style="fnKeyBadge(k.store).css">
                {{ fnKeyBadge(k.store).text }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
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
  <!-- ===== ■. 푸터 ======================================================== -->
  <template #footer>
    <div style="display:flex;justify-content:center;gap:8px;padding-top:4px;">
      <button class="btn btn_close" @click="handleBtnAction('modal-close')">닫기</button>
    </div>
  </template>
</component>
`,
  };
})();
