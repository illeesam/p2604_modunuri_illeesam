/* test-urls.js — test-urls.data.js 에 정리된 점검용 URL을 실제로 찔러보고 상태코드를 보여준다.
 * 배포 스크립트(deploy-dev-synol-*.js)의 checkUrl() 과 같은 원리를 재사용 — 이 컴퓨터에서 NAS로
 * 직접 GET 을 날리므로 SSH 접속정보(.synology-deploy.env)는 필요 없다(공개 URL만 다룸).
 *
 * 사용법:
 *   node test-urls.js               (= npm run test:all)      — 5개 서비스 전부
 *   node test-urls.js ecBeBo        (= npm run test:ecBeBo)   — 서비스 하나만
 *   node test-urls.js ecBeCdn ecFeBo                          — 여러 개 지정
 *
 * expect 필드(선택, test-urls.data.js): 특정 상태코드가 "정상"인 URL(예: 존재하지 않는 fileId로
 * 라우팅만 확인하는 404 케이스) — 없으면 200 을 기대치로 본다.
 */
const http = require('http');
const https = require('https');
const { services } = require('./test-urls.data');

const TIMEOUT_MS = 10000;

function checkUrl(target) {
  const lib = target.startsWith('https://') ? https : http;
  const startedAt = Date.now();
  return new Promise((resolve) => {
    const req = lib.get(target, { timeout: TIMEOUT_MS }, (res) => {
      res.resume(); // 바디는 안 쓰므로 흘려보내 소켓을 빨리 반환
      resolve({ status: res.statusCode, ms: Date.now() - startedAt });
    });
    req.on('timeout', () => { req.destroy(); resolve({ status: 'timeout', ms: Date.now() - startedAt }); });
    req.on('error', (e) => resolve({ status: `error(${e.code || e.message})`, ms: Date.now() - startedAt }));
  });
}

function pad(s, n) { return String(s).padEnd(n); }

async function runService(key, svc) {
  console.log(`\n■ ${svc.label}`);
  let ok = 0;
  for (const item of svc.urls) {
    const expect = item.expect || 200;
    const { status, ms } = await checkUrl(item.url);
    const pass = status === expect;
    if (pass) ok++;
    const mark = pass ? '✅' : '❌';
    console.log(`  ${mark} [${pad(status, 12)}] (${String(ms).padStart(5)}ms) ${item.url}`);
    console.log(`       └ ${item.note}${expect !== 200 ? ` (기대값: ${expect})` : ''}`);
  }
  console.log(`  ── ${ok}/${svc.urls.length} 통과`);
  return { ok, total: svc.urls.length };
}

(async () => {
  const args = process.argv.slice(2);
  const targets = args.length ? args : Object.keys(services);
  const unknown = targets.filter((t) => !services[t]);
  if (unknown.length) {
    console.error(`❌ 알 수 없는 서비스: ${unknown.join(', ')} (사용 가능: ${Object.keys(services).join(', ')})`);
    process.exit(1);
  }

  console.log(`▶ 점검 URL 확인 시작 — 대상: ${targets.join(', ')}`);
  let totalOk = 0, totalAll = 0;
  for (const key of targets) {
    const { ok, total } = await runService(key, services[key]);
    totalOk += ok; totalAll += total;
  }
  console.log(`\n[전체 결과] ${totalOk}/${totalAll} 통과${totalOk === totalAll ? ' — ✅ 전부 정상' : ' — ⚠ 위 ❌ 항목 확인 필요'}`);
  process.exit(totalOk === totalAll ? 0 : 1);
})();
