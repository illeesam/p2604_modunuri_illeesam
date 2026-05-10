/**
 * ShopjoyFoApp 통합 로그 유틸 (React Native, TypeScript).
 *
 * **로그 출력 형식**: `[ENV][파일명:라인:함수명] 메시지 — 변수=값`
 *
 * **방침**: 모든 로그는 환경(local/dev/prod) 관계없이 항상 console 출력.
 *
 * **사용 예**:
 * ```typescript
 * sjLog.fn('loadPage', { url, isCold });          // 함수 진입 + 파라미터
 * sjLog.d('결제 시작', { orderId, amount });       // 일반 디버그
 * sjLog.webview('loadUrl', url);                   // WebView URL 추적
 * sjLog.lifecycle('appReady');                     // 라이프사이클
 * ```
 */
import Config from 'react-native-config';
import { Platform } from 'react-native';

/** 환경 식별자 — `.env.{local|dev|prod}` 의 `APP_ENV`. react-native-config 가 빌드 시 주입. */
const ENV_NAME: string = Config.APP_ENV || 'unknown';

/** 앱 표시 이름 (환경별 다름). */
const APP_NAME: string = Config.APP_NAME || 'ShopjoyFoApp';

/** WebView 가 로드할 URL. */
const BASE_URL: string = Config.BASE_URL || '';

/** 호출자 stacktrace frame 정보. */
interface CallerFrame {
  /** 파일명 (path 마지막 컴포넌트). */
  file: string;
  /** 라인 번호 (정규식 매치 결과 문자열). */
  line: string;
  /** 함수명 — anonymous 함수면 'anonymous'. */
  fn: string;
}

/**
 * Error.stack 에서 호출자 frame 추출.
 *
 * Hermes / V8 / JSC stack 형식:
 *   "    at funcName (.../foo.js:42:10)"
 *   "funcName@.../foo.js:42:10"
 *
 * @param depth - sjLog 메서드 자체 깊이 (보통 2).
 */
function caller(depth: number): CallerFrame {
  const err = new Error();
  const lines = (err.stack || '').split('\n');
  const line = lines[depth + 2] || lines[lines.length - 1] || '';
  const m = line.match(/(?:at\s+)?(?:(\S+?)\s*\()?([^()\s]+):(\d+):(\d+)\)?$/);
  if (!m) return { file: '?', line: '?', fn: '?' };
  const url = m[2] || '';
  // path 마지막 컴포넌트 + query 제거.
  const file = url.split(/[/\\]/).pop()?.split('?')[0] || '?';
  return {
    file,
    line: m[3] || '?',
    fn: (m[1] || 'anonymous').replace(/^Object\./, ''),
  };
}

/** 값을 안전한 문자열로 — 200자 절단. 객체는 JSON.stringify. */
function safeStr(v: unknown): string {
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  let s: string;
  try {
    if (typeof v === 'string') s = v;
    else if (typeof v === 'object') s = JSON.stringify(v);
    else s = String(v);
  } catch (e: any) {
    s = '[unstringifiable: ' + (e?.message || '') + ']';
  }
  return s.length > 200 ? s.slice(0, 200) + '...(truncated)' : s;
}

/** vars → ` — k1=v1, k2=v2` 형식. */
function formatVars(vars?: Record<string, unknown>): string {
  if (!vars) return '';
  const keys = Object.keys(vars);
  if (keys.length === 0) return '';
  return ' — ' + keys.map(k => `${k}=${safeStr(vars[k])}`).join(', ');
}

/** prefix: `[ENV][파일명:라인:함수명]`. */
function formatPrefix(label?: string): string {
  const c = caller(2);
  const fn = label || c.fn;
  return `[${ENV_NAME}][${c.file}:${c.line}:${fn}]`;
}

/**
 * ShopjoyFoApp 의 통합 로그 객체.
 */
export const sjLog = {

  /** 함수 진입 — label 로 함수명 override. */
  fn(label?: string, vars?: Record<string, unknown>) {
    console.log(formatPrefix(label) + ' ENTER' + formatVars(vars));
  },

  /** 일반 디버그 로그. */
  d(msg: string, vars?: Record<string, unknown>) {
    console.log(formatPrefix() + ' ' + msg + formatVars(vars));
  },

  /** 정보 로그. */
  i(msg: string, vars?: Record<string, unknown>) {
    console.info(formatPrefix() + ' ' + msg + formatVars(vars));
  },

  /** 경고 로그. */
  w(msg: string, vars?: Record<string, unknown>) {
    console.warn(formatPrefix() + ' ⚠️ ' + msg + formatVars(vars));
  },

  /**
   * 에러 로그 — Error 객체도 console 에 전달하여 stacktrace 펼침.
   * @param err  Error 또는 임의 값. message 속성 우선 출력.
   */
  e(msg: string, err?: unknown, vars?: Record<string, unknown>) {
    const errStr = err ? ' — error=' + safeStr((err as any)?.message ?? err) : '';
    console.error(formatPrefix() + ' ❌ ' + msg + errStr + formatVars(vars), err || '');
  },

  /** WebView URL 추적 — `WEBVIEW.` prefix grep 가능. */
  webview(action: string, url: string | null | undefined, vars?: Record<string, unknown>) {
    console.log(formatPrefix() + ' WEBVIEW.' + action + ' url=' + safeStr(url) + formatVars(vars));
  },

  /** 라이프사이클 이벤트 (App mount / Component lifecycle). */
  lifecycle(event: string, vars?: Record<string, unknown>) {
    console.log(formatPrefix() + ' LIFECYCLE.' + event + formatVars(vars));
  },

  /** 앱 시작 정보 — Metro Console / logcat / Xcode 에 빌드 정보 명시. */
  appStart(extra?: Record<string, unknown>) {
    console.info('════════════════════════════════════════════════════════════════');
    console.info(`[${ENV_NAME}] APP START — ShopjoyFoApp`);
    const info = {
      APP_ENV: ENV_NAME,
      APP_NAME,
      BASE_URL,
      platform: Platform.OS,         // 'ios' | 'android' | 'web'
      version: Platform.Version,     // OS 버전.
      ...(extra || {}),
    };
    Object.keys(info).forEach(k => {
      console.info(`[${ENV_NAME}]   ${k} = ${safeStr((info as any)[k])}`);
    });
    console.info('════════════════════════════════════════════════════════════════');
  },

  /** 앱 종료 정보. */
  appEnd(reason: string) {
    console.info(`[${ENV_NAME}] APP END — reason=${reason}`);
    console.info('════════════════════════════════════════════════════════════════');
  },

  /** 환경 이름 반환. */
  env(): string {
    return ENV_NAME;
  },
};

export default sjLog;
