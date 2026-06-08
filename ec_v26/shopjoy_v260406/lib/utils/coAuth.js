/* ShopJoy - 인증 흐름 통합 모듈 (co / coAuth)
 * ─────────────────────────────────────────────────────────────────────────
 * 소셜 로그인 + 결제 호출을 FO/BO 공통 진입점으로 모으고, 첫 인자 ctx('fo'|'bo')
 * 구분자로 분기한다. SDK 창 띄우기는 coExtSdk 에 위임하고, 본 모듈은
 * "로그인 흐름 + 세션 발급" (앱 레이어) 을 담당한다.
 *
 * 전역: window.coAuth
 * 의존: lib/utils/coExtSdk.js (SDK 창), foAuthStore / boAuthStore (세션)
 *
 * 사용:
 *   await coAuth.socialLogin('fo', 'google');   // FO 소셜 로그인 + FO 세션 발급
 *   await coAuth.socialLogin('bo', 'kakao');     // BO 소셜 로그인 + BO 세션 발급
 *   await coAuth.pay('bo', { ... });             // 결제 (ctx 별 키/흐름)
 *
 * 프로토타입 단계: 백엔드 소셜/결제 엔드포인트 미연동 → 데모 세션 발급.
 *   실 연동 시 _resolveSocialUser 를 coExtSdk.loginXxx() 실제 호출 + 백엔드 검증으로 교체.
 * ───────────────────────────────────────────────────────────────────────── */
(function () {
  /* ── ctx 정규화 ── */
  const _ctx = (ctx) => (String(ctx || '').toLowerCase() === 'bo') ? 'bo' : 'fo';

  /* ── 데모 토큰 생성 (ctx 별 prefix) ── */
  const _mkToken = (ctx) =>
    'sjt_' + (ctx === 'bo' ? 'bo_' : '') + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);

  /* ── ctx 별 데모 사용자 (실 연동 시 coExtSdk 응답 profile + 백엔드 매칭으로 교체) ── */
  const _demoUser = (ctx, provider) => {
    const labels = { google: 'Google', kakao: 'Kakao', naver: 'Naver' };
    const label = labels[provider];
    if (!label) return null;
    if (ctx === 'bo') {
      return {
        authId: 'bo_' + provider[0] + '1', userId: 'bo_' + provider[0] + '1',
        name: label + '관리자', email: provider + '.admin@' + provider + '.com',
        role: 'ADMIN', loginId: provider + '.admin@' + provider + '.com',
      };
    }
    return {
      authId: provider[0] + '1', memberId: provider[0] + '1', userId: null,
      AppTypeCd: 'FO', loginId: provider + '.user@' + provider + '.com',
      memberNm: label + '유저', siteId: '',
    };
  };

  /* ── ctx 별 세션 발급 ── */
  const _setSession = (ctx, user, token) => {
    if (ctx === 'bo') {
      const store = (typeof window.useBoAuthStore === 'function') ? window.useBoAuthStore() : null;
      if (!store) return false;
      store.saSetAuth({ accessToken: token, refreshToken: token, authUser: user });
      return true;
    }
    const store = (typeof window.useFoAuthStore === 'function') ? window.useFoAuthStore() : null;
    if (!store) return false;
    store.saSetSession(user, token);
    return true;
  };

  /* socialLogin(ctx, provider, opts) — 소셜 로그인 흐름 통합.
   * opts.openSdk(기본 true): SDK 로그인 창을 실제로 띄움(개발 중 창 확인).
   * opts.onDebug: (label, info) => {} 창 띄울 때 URL·파라미터 노출 (toast 연결용).
   * 프로토타입: SDK 창은 띄우되 세션은 데모 발급. 실 연동 시 _resolveSocialUser 의 SDK 결과 + 백엔드 검증으로 교체. */
  const socialLogin = async (ctx, provider, opts = {}) => {
    const c = _ctx(ctx);
    const user = await _resolveSocialUser(c, provider, opts);
    if (!user) return { ok: false, msg: '알 수 없는 provider: ' + provider };
    const ok = _setSession(c, user, _mkToken(c));
    if (!ok) return { ok: false, msg: (c.toUpperCase() + ' 인증 스토어를 찾을 수 없습니다.') };
    return { ok: true, ctx: c, provider, user };
  };

  const _cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* _resolveSocialUser — 소셜 사용자 확정.
   * SDK 로그인 창을 실제로 띄운다(opts.openSdk!==false). 프로토타입이라 SDK 결과는
   * 로그/디버그로만 쓰고 세션은 데모 사용자로 발급한다.
   * [실 연동] SDK profile + 백엔드 검증으로 교체:
   *   const verified = await coApiSvc[ctx+'Auth'].socialLogin({ provider, accessToken: res.accessToken, profile: res.profile });
   *   return verified.data.data.authUser; */
  const _resolveSocialUser = async (ctx, provider, opts = {}) => {
    if (!_demoUser(ctx, provider)) return null;  // 알 수 없는 provider 조기 차단
    if (opts.openSdk !== false && window.coExtSdk && typeof window.coExtSdk['login' + _cap(provider)] === 'function') {
      if (opts.onDebug && window.coExtSdk.setDebugHook) window.coExtSdk.setDebugHook(opts.onDebug);
      /* SDK 창 띄움 — 창이 안 뜨면 coExtSdk 가 "원인—해결방법" 에러 throw (호출자가 toast) */
      const res = await window.coExtSdk['login' + _cap(provider)]();
      console.log('[coAuth] SDK 응답(' + ctx + '/' + provider + '):', res);
      /* 실 연동 시 여기서 res.profile/res.accessToken 을 백엔드로 검증 후 그 결과를 반환 */
    }
    return _demoUser(ctx, provider);
  };

  /* pay(ctx, opts) — 결제 흐름 통합 (ctx 별 키/흐름).
   * 결제창이 안 뜨면 "원인—해결방법" 에러를 throw → 호출자가 toast 로 표시.
   * opts: { customerKey, amount, orderId, orderName, onDebug } */
  const pay = async (ctx, opts = {}) => {
    const c = _ctx(ctx);
    if (!window.coExtSdk) throw new Error('coExtSdk 헬퍼가 로드되지 않았습니다.');
    if (!window.TossPayments) {
      throw new Error('결제창을 열 수 없습니다 — 토스 SDK 가 로드되지 않았습니다.\n→ 해결: index.html/bo.html 의 js.tosspayments.com/v2/standard 스크립트 로드와 네트워크/광고차단 확장을 확인하세요.');
    }
    const { customerKey, amount, orderId, orderName, onDebug } = opts;
    if (onDebug && window.coExtSdk.setDebugHook) window.coExtSdk.setDebugHook(onDebug);
    const toss = await window.coExtSdk.getTossPayments();
    const bp = await toss.brandpay?.({ customerKey });
    if (!bp || !bp.requestPayment) {
      throw new Error('결제창을 열 수 없습니다 — 토스 브랜드페이가 연동되지 않았습니다.\n→ 해결: 사이트 설정의 svTossClientKey(운영키) 등록과 토스 브랜드페이 약정/연동을 확인하세요.');
    }
    await bp.requestPayment({ amount, orderId: orderId || ('ORD' + Date.now()), orderName: orderName || '주문결제' });
    return { ok: true, ctx: c, amount };
  };

  window.coAuth = {
    socialLogin,   // (ctx, provider)
    pay,           // (ctx, opts)
  };
})();
