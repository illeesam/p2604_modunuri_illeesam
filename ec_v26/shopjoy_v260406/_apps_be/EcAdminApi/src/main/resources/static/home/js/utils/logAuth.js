/* logAuth.js — EcAdminApi 운영 화면(로그뷰어 등) 공용 fetch 래퍼 + 토스트. EcCdnApi 의
 * js/utils/cfAuth.js 를 그대로 참고해 포팅했다(요청사항: "EcCdnApi 프로그램 참고해줘").
 * 이 화면들은 로그인 없이 쓴다(요청사항: "인증없이 누구나 보는거야") — SecurityConfig 가
 * /api/co/** 를 permitAll 로 열어두므로 토큰을 아예 안 붙여도 된다.
 */
(function (global) {
  async function logFetch(url, options = {}) {
    return fetch(url, options);
  }

  /** logApi — JSON body 를 파싱해서 반환. ApiResponse.ok=false 면 예외를 던진다(message 포함). */
  async function logApi(url, options = {}) {
    const res = await logFetch(url, options);
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

  global.logAuth = { logFetch, logApi, showToast };
})(window);
