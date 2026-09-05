/* crypto-cli.js — JasyptCli.java(실제 jasypt 1.9.3 라이브러리) 를 그대로 실행하는 얇은 Node 래퍼.
 * npm run encrypt / npm run decrypt 가 이 파일을 호출한다.
 *
 * 마스터키는 두 가지 방식으로 줄 수 있다:
 *   1) 환경변수 JASYPT_MASTER_KEY (권장 — 셸 히스토리에 평문이 안 남는다)
 *   2) 첫 번째 인자로 직접 (간편하지만 셸 히스토리에 남을 수 있음)
 *
 * 사용법 (apps/scripts_crypto/ 안에서):
 *   JASYPT_MASTER_KEY=마스터키 npm run encrypt -- "평문값"
 *   JASYPT_MASTER_KEY=마스터키 npm run decrypt -- "ENC(암호문)"
 *   또는
 *   npm run encrypt -- 마스터키 "평문값"
 *   npm run decrypt -- 마스터키 "ENC(암호문)"
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 2026-09-06: 이 머신의 Gradle 캐시에서 실제 찾은 jasypt-1.9.3.jar 경로 — ecBeBo 의
// build.gradle.kts 가 쓰는 것과 같은 버전(jasypt-spring-boot-starter:3.0.5 의 내부 엔진).
// 다른 머신에서 경로가 다르면 JASYPT_JAR 환경변수로 오버라이드 가능.
const DEFAULT_JAR = 'C:/Users/illee/.gradle/caches/modules-2/files-2.1/org.jasypt/jasypt/1.9.3/d99ef9540f51c617f2a293b460f025d2ee563dd/jasypt-1.9.3.jar';
const JASYPT_JAR = process.env.JASYPT_JAR || DEFAULT_JAR;
const DIR = __dirname;
const SRC_FILE = path.join(DIR, 'JasyptCli.java');
const CLASS_FILE = path.join(DIR, 'JasyptCli.class');

function usageAndExit() {
  console.error('사용법:');
  console.error('  JASYPT_MASTER_KEY=마스터키 node crypto-cli.js <encrypt|decrypt> "<값>"');
  console.error('  또는: node crypto-cli.js <encrypt|decrypt> 마스터키 "<값>"');
  process.exit(1);
}

function ensureCompiled() {
  if (!fs.existsSync(JASYPT_JAR)) {
    console.error(`jasypt jar 를 찾을 수 없습니다: ${JASYPT_JAR}`);
    console.error('한 번이라도 ecBeBo 를 ./gradlew 로 빌드했는지 확인하거나, JASYPT_JAR 환경변수로 직접 경로를 지정하세요.');
    process.exit(1);
  }
  const needsCompile = !fs.existsSync(CLASS_FILE)
    || fs.statSync(SRC_FILE).mtimeMs > fs.statSync(CLASS_FILE).mtimeMs;
  if (!needsCompile) return;
  console.log('[crypto-cli] JasyptCli.java 컴파일 중...');
  // -encoding UTF-8 필수 — 이 파일의 한글 주석이 UTF-8인데, 이 머신의 javac 기본 인코딩이
  // x-windows-949(콘솔 코드페이지)라 지정 안 하면 "unmappable character" 로 컴파일이 깨진다.
  const r = spawnSync('javac', ['-encoding', 'UTF-8', '-cp', JASYPT_JAR, '-d', DIR, SRC_FILE], { stdio: 'inherit' });
  if (r.status !== 0) { console.error('컴파일 실패'); process.exit(1); }
}

(() => {
  const argv = process.argv.slice(2);
  const mode = argv[0];
  if (!mode || (mode !== 'encrypt' && mode !== 'decrypt')) usageAndExit();

  let masterKey = process.env.JASYPT_MASTER_KEY;
  let value;
  if (masterKey) {
    value = argv[1];
  } else {
    masterKey = argv[1];
    value = argv[2];
  }
  if (!masterKey || !value) usageAndExit();

  ensureCompiled();

  const classpath = `${JASYPT_JAR}${path.delimiter}${DIR}`;
  // -Dfile.encoding=UTF-8 필수 — 안 주면 한글이 섞인 에러 메시지 등이 이 머신의 기본 코드페이지
  // (x-windows-949)로 깨져 나온다(이 프로젝트에서 Java 러너 실행 시 반복 확인된 규칙).
  const r = spawnSync('java', ['-Dfile.encoding=UTF-8', '-cp', classpath, 'JasyptCli', mode, masterKey, value], { encoding: 'utf8' });
  if (r.error) { console.error('java 실행 실패:', r.error.message); process.exit(1); }
  if (r.stderr) process.stderr.write(r.stderr);
  process.stdout.write(r.stdout);
  process.exit(r.status || 0);
})();
