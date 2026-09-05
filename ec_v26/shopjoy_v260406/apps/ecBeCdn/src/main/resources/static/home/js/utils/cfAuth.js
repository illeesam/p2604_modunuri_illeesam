/* cfAuth.js — cf_client.html / cf_file.html(현재는 index.html 안의 CfClientMng/CfFileMng) 공용 fetch
 * 래퍼 + 토스트.
 *
 * 2026-09-06: 관리 화면은 로그인 없이 쓴다(요청사항) — SecurityConfig 가 /api/cdn/** 를 permitAll 로
 * 열어뒀으므로 이 화면은 토큰을 아예 안 붙여도 된다. accessToken 로그인 체계(POST /api/cdn/auth/login 등)
 * 자체는 EcAdminApi 쪽 서버-서버 연동을 위해 백엔드에 그대로 남아있지만, 이 화면에서는 안 씀 —
 * 이름은 과거 로그인 버전과의 호환을 위해 cfAuth 로 유지.
 */
(function (global) {
  /** cfFetch — 그냥 fetch 그대로(인증 헤더 없음). 나중에 다시 인증이 필요해지면 여기 한 곳만 고치면 됨. */
  async function cfFetch(url, options = {}) {
    return fetch(url, options);
  }

  /** cfApi — JSON body 를 파싱해서 반환. ApiResponse.ok=false 면 예외를 던진다(message 포함). */
  async function cfApi(url, options = {}) {
    const res = await cfFetch(url, options);
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.ok === false) {
      throw new Error(body.message || ('요청 실패 (HTTP ' + res.status + ')'));
    }
    return body.data;
  }

  function showToast(msg, isError) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = isError ? 'error show' : 'show';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.className = el.className.replace('show', ''); }, 3000);
  }

  global.cfAuth = { cfFetch, cfApi, showToast };
})(window);
