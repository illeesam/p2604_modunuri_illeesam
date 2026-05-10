/**
 * ShopjoyBoApp 통합 로그 유틸 (React Native, FO 와 동일 인터페이스).
 *
 * **방침**: 모든 로그는 환경 관계없이 항상 console 출력.
 *
 * @see ShopjoyFoApp/src/sjLog.ts  FO 의 같은 파일 — 자세한 주석은 거기 참조
 */
import Config from 'react-native-config';
import { Platform } from 'react-native';

/** 환경 식별자 — `.env.{local|dev|prod}` 의 `APP_ENV`. */
const ENV_NAME: string = Config.APP_ENV || 'unknown';

/** 앱 표시 이름. */
const APP_NAME: string = Config.APP_NAME || 'ShopjoyBoApp';

/** WebView 가 로드할 BO URL. */
const BASE_URL: string = Config.BASE_URL || '';

/** 호출자 stacktrace frame 정보. */
interface CallerFrame {
  /** 파일명. */
  file: string;
  /** 라인 번호 (문자열). */
  line: string;
  /** 함수명. */
  fn: string;
}

/** Error.stack 에서 호출자 frame 추출 (Hermes/V8/JSC 포맷 모두 지원). */
function caller(depth: number): CallerFrame {
  const err = new Error();
  const lines = (err.stack || '').split('\n');
  const line = lines[depth + 2] || lines[lines.length - 1] || '';
  const m = line.match(/(?:at\s+)?(?:(\S+?)\s*\()?([^()\s]+):(\d+):(\d+)\)?$/);
  if (!m) return { file: '?', line: '?', fn: '?' };
  const url = m[2] || '';
  const file = url.split(/[/\\]/).pop()?.split('?')[0] || '?';
  return {
    file,
    line: m[3] || '?',
    fn: (m[1] || 'anonymous').replace(/^Object\./, ''),
  };
}

/** 값을 안전한 문자열로 — 200자 절단. */
function safeStr(v: unknown): string {
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  let s: string;
  try {
    if (typeof v === 'string') s = v;
    else if (typeof v === 'object') s = JSON.stringify(v);
    else s = String(v);
  } catch (e: any) {
    s = '[unstringifiable]';
  }
  return s.length > 200 ? s.slice(0, 200) + '...(truncated)' : s;
}

/** vars → ` — k=v` 형식. */
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
 * ShopjoyBoApp 의 통합 로그 객체.
 */
export const sjLog = {
  /** 함수 진입. */
  fn(label?: string, vars?: Record<string, unknown>) {
    console.log(formatPrefix(label) + ' ENTER' + formatVars(vars));
  },
  /** 일반 디버그. */
  d(msg: string, vars?: Record<string, unknown>) {
    console.log(formatPrefix() + ' ' + msg + formatVars(vars));
  },
  /** 정보. */
  i(msg: string, vars?: Record<string, unknown>) {
    console.info(formatPrefix() + ' ' + msg + formatVars(vars));
  },
  /** 경고. */
  w(msg: string, vars?: Record<string, unknown>) {
    console.warn(formatPrefix() + ' ⚠️ ' + msg + formatVars(vars));
  },
  /** 에러 — Error 객체도 함께 console 에 전달. */
  e(msg: string, err?: unknown, vars?: Record<string, unknown>) {
    const errStr = err ? ' — error=' + safeStr((err as any)?.message ?? err) : '';
    console.error(formatPrefix() + ' ❌ ' + msg + errStr + formatVars(vars), err || '');
  },
  /** WebView URL 추적. */
  webview(action: string, url: string | null | undefined, vars?: Record<string, unknown>) {
    console.log(formatPrefix() + ' WEBVIEW.' + action + ' url=' + safeStr(url) + formatVars(vars));
  },
  /** 라이프사이클 이벤트. */
  lifecycle(event: string, vars?: Record<string, unknown>) {
    console.log(formatPrefix() + ' LIFECYCLE.' + event + formatVars(vars));
  },
  /** 앱 시작 정보. */
  appStart(extra?: Record<string, unknown>) {
    console.info('════════════════════════════════════════════════════════════════');
    console.info(`[${ENV_NAME}] APP START — ShopjoyBoApp`);
    const info = {
      APP_ENV: ENV_NAME,
      APP_NAME,
      BASE_URL,
      platform: Platform.OS,
      version: Platform.Version,
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
  /** 환경 이름. */
  env(): string {
    return ENV_NAME;
  },
};

export default sjLog;
