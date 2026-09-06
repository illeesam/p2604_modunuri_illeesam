/* app-health-checks.js — deploy/stop/delete(+ps) 4개 npm 워크스페이스가 전부 같은 API/URL
 * 점검 목록을 쓰도록 한 곳에 모은 공용 모듈이다(요청사항: "npm deploy/stop/delete 시 공통
 * api 점검, url 점검 항목을 최대한 구성하여 별도파일로 만들어 모두가 공통점검하면 좋겠는데").
 *
 * 그동안 각 deploy-dev-synol-*.js 가 자기 나름대로 checkUrls/completionUrls 를 손으로
 * 나열했고(앱마다 항목 수·구성이 제각각), stop/delete(manage-dev-synol.js)는 아예 URL 점검이
 * 없었다(docker compose ps 로 컨테이너 상태만 봤음). 이 파일이 앱별 "최대 점검 목록"의 단일
 * 소스가 되고, runHealthCheck() 가
 *   - deploy 직후(컨테이너가 떠 있어야 함)  → expect:'up'   (200 이어야 정상)
 *   - stop/delete 직후(컨테이너가 없어야 함) → expect:'down' (접속 자체가 안 돼야 정상)
 * 양쪽에서 동일하게 재사용된다. 새 점검 지점이 필요해지면 여기 APP_CHECKS 한 곳만 추가하면
 * deploy/stop/delete 전부에 자동 반영된다.
 *
 * ecBeRedis 는 HTTP 서버가 아니라(레디스 프로토콜) URL 점검 대상이 아니다 — 그쪽은 기존대로
 * redis-cli ping(SSH exec, deploy-dev-synol-be-ecBeRedis.js)으로 확인한다. buildAppChecks()가
 * 빈 배열을 주면 runHealthCheck()가 자동으로 skipped 처리한다.
 */
const { checkUrlStatus } = require('./synology-deploy-util');

const PUBLIC_HOST = 'illeesam.synology.me';
const GW = `${PUBLIC_HOST}:22099`;
const GW_HTTPS = `22099.${PUBLIC_HOST}`;

// 앱별 "최대 점검 목록" — 기존 4개 deploy-dev-synol-*.js(ecBeBo/ecBeCdn/ecFeBo/ecBeGateway)에
// 흩어져 있던 completionUrls/checkUrls 를 전부 모아 통합(2026-09-06).
const APP_CHECKS = {
  ecBeBo: () => [
    { url: `http://${PUBLIC_HOST}:22300/actuator/health`, note: '헬스체크(직접)' },
    { url: `http://${PUBLIC_HOST}:22300/home/index.html`, note: '🪵 로그뷰어(운영 도구, 인증 불필요)' },
    { url: `http://${PUBLIC_HOST}:22300/swagger-ui/index.html`, note: 'API 문서(Swagger UI, 로그인 불필요)' },
    { url: `http://${PUBLIC_HOST}:22300/api/co/sy/code/page?pageNo=1&pageSize=1`, note: '공통코드 페이징(로그인 불필요)' },
    { url: `http://${PUBLIC_HOST}:22300/api/co/sy/site?pageNo=1&pageSize=1`, note: '사이트 목록(로그인 불필요)' },
    { url: `http://${PUBLIC_HOST}:22300/api/co/log/tail?file=app&lines=20`, note: '로그 tail API(최근 20줄, 인증 불필요)' },
    { url: `http://${GW}/api/co/sy/code/page?pageNo=1&pageSize=1`, note: '공통코드 페이징(게이트웨이 22099 경유, HTTP)' },
    { url: `https://${GW_HTTPS}/api/co/sy/code/page?pageNo=1&pageSize=1`, note: '공통코드 페이징(게이트웨이 22099 경유, HTTPS)' },
    { url: `http://${GW}/admin-tools`, note: '🪵 로그뷰어(게이트웨이 22099 경유)' },
  ],
  ecBeCdn: () => [
    { url: `http://${PUBLIC_HOST}:22400/actuator/health`, note: '헬스체크(직접)' },
    { url: `http://${PUBLIC_HOST}:22400/home/index.html`, note: '관리자 화면 기본 진입(cf_file 관리, 로그인 불필요)' },
    { url: `https://22400.${PUBLIC_HOST}/home/index.html`, note: '관리자 화면(HTTPS 서브도메인)' },
    { url: `http://${PUBLIC_HOST}:22400/home/index.html?page=logViewer`, note: '🪵 로그뷰어(인증 불필요)' },
    { url: `http://${PUBLIC_HOST}:22400/home/index.html?page=authTest`, note: '인증 테스트(로그인/재발급/강제폐기)' },
    { url: `http://${PUBLIC_HOST}:22400/home/index.html?page=dbTest`, note: 'DB 연결 테스트(임의 접속정보로 SELECT 확인)' },
    { url: `http://${PUBLIC_HOST}:22400/api/cdn/client/page?pageNo=1&pageSize=1`, note: 'cf_client 목록 API(로그인 불필요, public)' },
    { url: `http://${PUBLIC_HOST}:22400/api/cdn/file/page?pageNo=1&pageSize=1`, note: 'cf_file 목록 API(로그인 불필요, public)' },
    { url: `http://${PUBLIC_HOST}:22400/api/cdn/log/tail?file=app&lines=20`, note: '로그 tail API(최근 20줄)' },
    { url: `http://${GW}/api/cdn/client/page?pageNo=1&pageSize=1`, note: 'cf_client 목록 API(게이트웨이 22099 경유, HTTP)' },
    { url: `https://${GW_HTTPS}/api/cdn/client/page?pageNo=1&pageSize=1`, note: 'cf_client 목록 API(게이트웨이 22099 경유, HTTPS)' },
    { url: `http://${GW}/cdn-admin`, note: '관리자 화면(게이트웨이 22099 경유)' },
  ],
  ecFeBo: () => [
    { url: `https://22000.${PUBLIC_HOST}`, note: '사용자(FO) 메인 화면' },
    { url: `https://22000.${PUBLIC_HOST}/bo.html`, note: '관리자(BO) 메인 화면(로그인 필요)' },
    { url: `http://${PUBLIC_HOST}:22000`, note: '사용자(FO) 메인 화면(HTTP 포트)' },
    { url: `http://${PUBLIC_HOST}:22000/bo.html`, note: '관리자(BO) 메인 화면(HTTP 포트)' },
    { url: `https://22000.${PUBLIC_HOST}/assets/cdn/pkg/vue/3.4.21/vue.global.prod.js`, note: '로컬 CDN 패키지(Vue) 정적서빙 확인' },
    { url: `http://${GW}`, note: '사용자(FO) 메인 화면(게이트웨이 22099 경유, HTTP)' },
    { url: `https://${GW_HTTPS}/bo.html`, note: '관리자(BO) 메인 화면(게이트웨이 22099 경유, HTTPS)' },
  ],
  ecBeGateway: () => [
    { url: `http://${PUBLIC_HOST}:22099`, note: '사용자(FO) 메인 화면(게이트웨이 경유, HTTP)' },
    { url: `https://${GW_HTTPS}`, note: '사용자(FO) 메인 화면(게이트웨이 경유, HTTPS)' },
    { url: `http://${PUBLIC_HOST}:22099/bo.html`, note: '관리자(BO) 메인 화면(게이트웨이 경유, HTTP)' },
    { url: `https://${GW_HTTPS}/bo.html`, note: '관리자(BO) 메인 화면(게이트웨이 경유, HTTPS — 로그인 가능)' },
    { url: `http://${PUBLIC_HOST}:22099/api/co/sy/code/page?pageNo=1&pageSize=1`, note: '공통코드 API(게이트웨이→ecBeBo, HTTP)' },
    { url: `http://${PUBLIC_HOST}:22099/swagger-ui/index.html`, note: 'API 문서(Swagger UI, 게이트웨이→ecBeBo, HTTP)' },
    { url: `https://${GW_HTTPS}/swagger-ui/index.html`, note: 'API 문서(Swagger UI, 게이트웨이→ecBeBo, HTTPS)' },
    { url: `http://${PUBLIC_HOST}:22099/admin-tools`, note: '🪵 ecBeBo 로그뷰어(게이트웨이 경유)' },
    { url: `http://${PUBLIC_HOST}:22099/cdn-admin`, note: 'ecBeCdn 관리자 화면(게이트웨이 경유)' },
  ],
};

/** app 이름 → 점검 목록(배열). 등록 안 된 앱(예: ecBeRedis)이면 빈 배열. */
function buildAppChecks(app) {
  const factory = APP_CHECKS[app];
  return factory ? factory() : [];
}

/**
 * 공통 점검 실행 — deploy(expect:'up')/stop·delete(expect:'down') 양쪽에서 재사용.
 * @param {string} app 'ecBeBo'|'ecBeCdn'|'ecFeBo'|'ecBeGateway'
 * @param {{expect?: 'up'|'down', tag?: any, silent?: boolean}} [opts]
 *   expect 'up'   — 200 이어야 정상(배포 직후 기본값)
 *   expect 'down' — 접속 자체가 안 돼야(timeout/ECONNREFUSED 등) 정상(정지·삭제 직후)
 * @returns {Promise<{ok: boolean, results: Array<{url,note,status,ok}>, skipped?: boolean}>}
 */
async function runHealthCheck(app, { expect = 'up', tag, silent = false } = {}) {
  const checks = buildAppChecks(app);
  if (!checks.length) return { ok: true, results: [], skipped: true };

  const statuses = await Promise.all(checks.map((c) => checkUrlStatus(c.url)));
  const isReachable = (s) => /^[1-5]\d\d$/.test(s); // HTTP 상태코드가 뭐든 응답이 왔다 = 살아있음
  // 2xx/3xx 는 둘 다 "정상 응답"으로 취급 — /admin-tools, /cdn-admin 처럼 게이트웨이가
  // 의도적으로 301 리다이렉트하는 항목(locations.conf 의 exact-match 리다이렉트)이 실제로는
  // 정상인데 200 만 기대하면 오탐(❌)이 뜬다(실측 확인, 2026-09-06). 4xx/5xx 만 실패로 본다.
  const isUpOk = (s) => /^[23]\d\d$/.test(s);
  const results = checks.map((c, i) => {
    const status = statuses[i];
    const reachable = isReachable(status);
    const rowOk = expect === 'up' ? isUpOk(status) : !reachable;
    return { url: c.url, note: c.note, status, ok: rowOk };
  });
  const ok = results.every((r) => r.ok);

  if (!silent) {
    const t = tag ? String(tag) : '';
    const width = Math.max(...results.map((r) => r.url.length));
    const label = expect === 'up' ? '기동 확인 — 200 기대' : '중지 확인 — 무응답 기대';
    console.log(`${t} 🔍 공통점검(${app}) ${label}`);
    results.forEach((r) => {
      const badge = r.ok ? '✅' : '❌';
      console.log(`${t}   ${r.url.padEnd(width)}  ${badge} ${r.status.padEnd(6)} ${r.note}`);
    });
    console.log(`${t}   ${ok ? '✅ 전체 정상' : '⚠ 일부 이상 있음 — 위 ❌ 항목 확인 필요'}`);
  }
  return { ok, results };
}

module.exports = { PUBLIC_HOST, GW, GW_HTTPS, buildAppChecks, runHealthCheck };
