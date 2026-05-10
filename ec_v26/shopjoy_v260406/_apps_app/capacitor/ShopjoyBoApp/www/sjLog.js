// ShopjoyBoApp 통합 로그 유틸 (FO 앱과 동일 인터페이스).
//
// 형식: [ENV][파일명:라인:함수명] 메시지 — 변수=값
// ⚠️ 모든 로그는 환경(local/dev/prod) 관계없이 항상 콘솔 출력.
//
// 자세한 주석은 FO 앱의 같은 파일 참조: _apps/capacitor/ShopjoyFoApp/www/sjLog.js
(function (global) {
  'use strict';

  /** 환경 식별자 (env.js 가 자동 생성). */
  var ENV_NAME = (global.__APP_ENV_NAME__ || 'unknown');

  /** Error.stack 에서 호출자 frame 추출 (file:line:fn). */
  function caller(depth) {
    var err = new Error();
    var lines = (err.stack || '').split('\n');
    var line = lines[depth + 2] || lines[lines.length - 1] || '';
    var match = line.match(/(?:at\s+)?(?:(\S+?)\s*\()?([^()\s]+):(\d+):(\d+)\)?$/);
    if (!match) return { file: '?', line: '?', fn: '?' };
    var url = match[2] || '';
    var file = url.split(/[\/\\]/).pop().split('?')[0] || '?';
    return {
      file: file,
      line: match[3] || '?',
      fn: (match[1] || 'anonymous').replace(/^Object\./, '')
    };
  }

  /** 값을 안전한 문자열로 — 200자 절단. */
  function safeStr(v) {
    if (v === null) return 'null';
    if (v === undefined) return 'undefined';
    var s;
    try {
      if (typeof v === 'string') s = v;
      else if (typeof v === 'object') s = JSON.stringify(v);
      else s = String(v);
    } catch (e) {
      s = '[unstringifiable]';
    }
    return s.length > 200 ? s.slice(0, 200) + '...(truncated)' : s;
  }

  /** vars → ` — k=v` 형식 변환. */
  function formatVars(vars) {
    if (!vars) return '';
    var keys = Object.keys(vars);
    if (keys.length === 0) return '';
    return ' — ' + keys.map(function (k) { return k + '=' + safeStr(vars[k]); }).join(', ');
  }

  /** prefix 생성: `[ENV][파일명:라인:함수명]`. */
  function formatPrefix(label) {
    var c = caller(2);
    var fn = label || c.fn;
    return '[' + ENV_NAME + '][' + c.file + ':' + c.line + ':' + fn + ']';
  }

  // ───── 공개 API ─────
  var sjLog = {
    /** 함수 진입. */
    fn: function (label, vars) {
      console.log(formatPrefix(label) + ' ENTER' + formatVars(vars));
    },
    /** 일반 디버그. */
    d: function (msg, vars) {
      console.log(formatPrefix() + ' ' + msg + formatVars(vars));
    },
    /** 정보. */
    i: function (msg, vars) {
      console.info(formatPrefix() + ' ' + msg + formatVars(vars));
    },
    /** 경고. */
    w: function (msg, vars) {
      console.warn(formatPrefix() + ' ⚠️ ' + msg + formatVars(vars));
    },
    /** 에러 — Error 객체도 함께 전달. */
    e: function (msg, err, vars) {
      var errStr = err ? ' — error=' + safeStr(err && err.message ? err.message : err) : '';
      console.error(formatPrefix() + ' ❌ ' + msg + errStr + formatVars(vars), err || '');
    },
    /** WebView URL 추적. */
    webview: function (action, url, vars) {
      console.log(formatPrefix() + ' WEBVIEW.' + action + ' url=' + safeStr(url) + formatVars(vars));
    },
    /** 라이프사이클 이벤트. */
    lifecycle: function (event, vars) {
      console.log(formatPrefix() + ' LIFECYCLE.' + event + formatVars(vars));
    },
    /** 앱 시작 정보 — DevTools Console 에 빌드 정보 명시. */
    appStart: function (extra) {
      console.info('════════════════════════════════════════════════════════════════');
      console.info('[' + ENV_NAME + '] APP START — ShopjoyBoApp');
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
    /** 앱 종료 정보. */
    appEnd: function (reason) {
      console.info('[' + ENV_NAME + '] APP END — reason=' + safeStr(reason));
      console.info('════════════════════════════════════════════════════════════════');
    },
    /** 환경 이름 반환. */
    env: function () { return ENV_NAME; }
  };

  global.sjLog = sjLog;

  // 자동 에러 캐치.
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

  console.info('[' + ENV_NAME + '] sjLog ready');
})(typeof window !== 'undefined' ? window : this);
