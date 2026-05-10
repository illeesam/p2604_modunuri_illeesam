// ShopjoyFoApp 통합 로그 유틸 (브라우저 WebView 환경, 순수 JavaScript)
//
// 형식: [ENV][파일명:라인:함수명] 메시지 — 변수=값
//
// ⚠️ 모든 로그는 환경(local/dev/prod) 관계없이 항상 콘솔 출력 (사용자 요구사항).
//
// 로드 순서: env.js → sjLog.js → 기타 앱 코드
//   - env.js 가 window.__APP_ENV__ / window.__APP_ENV_NAME__ 을 먼저 정의해야 함
//   - sjLog.js 는 그 값을 읽어 prefix 구성
//
// 사용 예:
//   sjLog.fn('loadPage', { url, isCold });        // 함수 진입 + 파라미터
//   sjLog.d('결제 시작', { orderId, amount });     // 일반 디버그
//   sjLog.webview('loadUrl', url);                 // WebView URL 추적 강조
//   sjLog.lifecycle('appReady');                   // 라이프사이클
//   sjLog.appStart({ extra: 'value' });            // 앱 시작 (빌드 정보 출력)
(function (global) {
  'use strict';

  // ───── 환경 식별자 ─────
  // env.js (set-env.js 가 자동 생성) 가 window.__APP_ENV_NAME__ 설정.
  // 예: 'local', 'dev', 'prod'.
  var ENV_NAME = (global.__APP_ENV_NAME__ || 'unknown');

  /**
   * Error.stack 에서 호출자 frame (file:line:fn) 추출.
   *
   * Chrome/V8 stack: "    at funcName (http://.../foo.js:42:10)"
   * Safari   stack: "funcName@http://.../foo.js:42:10"
   *
   * @param {number} depth - sjLog 메서드 자체의 깊이 (보통 2).
   * @returns {{file: string, line: string, fn: string}}
   */
  function caller(depth) {
    var err = new Error();                         // 호출 시점 stacktrace 캡처.
    var lines = (err.stack || '').split('\n');
    // 0: "Error", 1: caller(), 2: 공개 메서드, 3: 실제 호출자.
    var line = lines[depth + 2] || lines[lines.length - 1] || '';
    var match = line.match(/(?:at\s+)?(?:(\S+?)\s*\()?([^()\s]+):(\d+):(\d+)\)?$/);
    if (!match) return { file: '?', line: '?', fn: '?' };
    var url = match[2] || '';
    // URL 의 마지막 path 컴포넌트만 (= 파일명), query string 제거.
    var file = url.split(/[\/\\]/).pop().split('?')[0] || '?';
    return {
      file: file,
      line: match[3] || '?',
      // "Object.funcName" → "funcName" 정리.
      fn: (match[1] || 'anonymous').replace(/^Object\./, '')
    };
  }

  /**
   * 값을 안전한 문자열로 변환 — 200자 초과 절단, 객체는 JSON.stringify.
   * @param {*} v
   * @returns {string}
   */
  function safeStr(v) {
    if (v === null) return 'null';
    if (v === undefined) return 'undefined';
    var s;
    try {
      if (typeof v === 'string') s = v;
      else if (typeof v === 'object') s = JSON.stringify(v);  // 순환 참조 시 throw.
      else s = String(v);
    } catch (e) {
      s = '[unstringifiable: ' + (e && e.message) + ']';
    }
    return s.length > 200 ? s.slice(0, 200) + '...(truncated)' : s;
  }

  /**
   * vars 객체 → ` — k1=v1, k2=v2` 형식.
   * @param {Object<string, *>} [vars]
   * @returns {string}
   */
  function formatVars(vars) {
    if (!vars) return '';
    var keys = Object.keys(vars);
    if (keys.length === 0) return '';
    return ' — ' + keys.map(function (k) { return k + '=' + safeStr(vars[k]); }).join(', ');
  }

  /**
   * 모든 로그 메서드의 prefix: `[ENV][파일명:라인:함수명]`.
   * @param {string} [label]  함수명 override.
   */
  function formatPrefix(label) {
    var c = caller(2);
    var fn = label || c.fn;
    return '[' + ENV_NAME + '][' + c.file + ':' + c.line + ':' + fn + ']';
  }

  // ───── 공개 API ─────
  var sjLog = {

    /** 함수 진입 로그. label 로 함수명 override 가능. */
    fn: function (label, vars) {
      console.log(formatPrefix(label) + ' ENTER' + formatVars(vars));
    },

    /** 일반 디버그 로그. */
    d: function (msg, vars) {
      console.log(formatPrefix() + ' ' + msg + formatVars(vars));
    },

    /** 정보 로그 (console.info). */
    i: function (msg, vars) {
      console.info(formatPrefix() + ' ' + msg + formatVars(vars));
    },

    /** 경고 로그 (console.warn). */
    w: function (msg, vars) {
      console.warn(formatPrefix() + ' ⚠️ ' + msg + formatVars(vars));
    },

    /**
     * 에러 로그 (console.error) — Error 객체도 함께 전달하여 DevTools 가 stacktrace 펼쳐줌.
     * @param {string} msg
     * @param {Error|*} [err]
     * @param {Object} [vars]
     */
    e: function (msg, err, vars) {
      var errStr = err ? ' — error=' + safeStr(err && err.message ? err.message : err) : '';
      console.error(formatPrefix() + ' ❌ ' + msg + errStr + formatVars(vars), err || '');
    },

    /**
     * WebView URL 추적 — `WEBVIEW.` prefix 로 grep 용이.
     * @param {string} action  동작명 (예: 'loadUrl', 'navigation').
     * @param {string|null} url
     * @param {Object} [vars]
     */
    webview: function (action, url, vars) {
      console.log(formatPrefix() + ' WEBVIEW.' + action + ' url=' + safeStr(url) + formatVars(vars));
    },

    /** 라이프사이클 이벤트 — `LIFECYCLE.` prefix. */
    lifecycle: function (event, vars) {
      console.log(formatPrefix() + ' LIFECYCLE.' + event + formatVars(vars));
    },

    /**
     * 앱 시작 정보 — DevTools Console 에 빌드/환경/디바이스 정보 명시 출력.
     * @param {Object} [extra]  추가 출력할 키-값.
     */
    appStart: function (extra) {
      console.info('════════════════════════════════════════════════════════════════');
      console.info('[' + ENV_NAME + '] APP START — ShopjoyFoApp');
      // 자동 수집 정보 + extra.
      var info = Object.assign({
        APP_ENV: ENV_NAME,
        APP_NAME: (global.__APP_ENV__ && global.__APP_ENV__.APP_NAME) || '',
        BASE_URL: (global.__APP_ENV__ && global.__APP_ENV__.BASE_URL) || '',
        userAgent: (global.navigator && global.navigator.userAgent) || '',
        href: (global.location && global.location.href) || ''
      }, extra || {});
      Object.keys(info).forEach(function (k) {
        console.info('[' + ENV_NAME + ']   ' + k + ' = ' + safeStr(info[k]));
      });
      console.info('════════════════════════════════════════════════════════════════');
    },

    /** 앱 종료 정보 (beforeunload 등에서). */
    appEnd: function (reason) {
      console.info('[' + ENV_NAME + '] APP END — reason=' + safeStr(reason));
      console.info('════════════════════════════════════════════════════════════════');
    },

    /** 환경 이름 반환. */
    env: function () {
      return ENV_NAME;
    }
  };

  // 전역 노출 — WebView 안에서 window.sjLog 로 접근.
  global.sjLog = sjLog;

  // ───── 자동 에러 캐치 ─────
  // unhandled JS error / promise rejection 자동으로 sjLog.e 로 출력.
  if (global.addEventListener) {
    global.addEventListener('error', function (e) {
      sjLog.e('unhandled error', e.error || e.message, {
        filename: e.filename, lineno: e.lineno, colno: e.colno
      });
    });
    global.addEventListener('unhandledrejection', function (e) {
      sjLog.e('unhandled promise rejection', e.reason);
    });
  }

  // 로드 확인용 — DevTools Console 즉시 표시.
  console.info('[' + ENV_NAME + '] sjLog ready');
})(typeof window !== 'undefined' ? window : this);
