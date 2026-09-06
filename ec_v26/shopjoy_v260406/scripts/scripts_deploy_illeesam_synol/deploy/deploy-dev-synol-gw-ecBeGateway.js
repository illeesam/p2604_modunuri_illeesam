/* deploy-dev-synol-gw-ecBeGateway.js — Synology NAS(dev)의 테스트 전용 게이트웨이(apps/ecBeGateway)를
 * docker-compose.yml 기준으로 (재)배포한다. 다른 deploy-dev-synol-be-*.js 와 달리 Gradle 빌드가
 * 없다 — 공식 nginx 이미지를 그대로 쓰므로 "빌드해서 전송"할 산출물 자체가 없고, compose+nginx
 * 설정 3종 전송 + 컨테이너 기동이 전부다.
 *
 * ⚠️ 테스트 전용이다(apps/ecBeGateway/docker-compose.yml 상단 주석 참조) — ecBeBo(22300)/
 * ecBeCdn(22400)이 이 NAS에 이미 떠 있어야(host.docker.internal 경유로 호출) 정상 동작하고,
 * ecFeBo(22000)가 배포해둔 정적 파일 폴더(/volume1/docker/shopjoy/apps/ecFeBo)를 그대로 재사용한다
 * — 즉 이 스크립트를 돌리기 전에 deploy/ 에서 npm run ecBeBo / ecBeCdn / ecFeBo 가
 * 먼저 실행되어 있어야 의미가 있다(순서 강제는 안 함 — 없어도 컨테이너 자체는 뜨지만 502/빈
 * 화면만 보게 된다).
 *
 * 사용법: scripts/scripts_deploy_illeesam_synol/deploy/ 에서 npm run ecBeGateway
 *          (또는 루트에서 npm run ecBeGateway --workspace=deploy)
 * NAS 접속정보는 scripts/scripts_deploy_illeesam_synol/.synology-deploy.env 필요 — 형식은 ../synology-deploy-util.js 상단 주석 참조.
 */
const path = require('path');
const { ROOT, requireCreds, withSsh, hms, LOG_FILE_PATH } = require('../synology-deploy-util');
const { notifyDeployResult } = require('../notify-deploy-result');
// 2026-09-06(요청사항: "npm deploy/stop/delete 시 공통 api점검, url점검 항목을 최대한
// 구성하여 별도파일로 만들어 모두가 공통점검하면 좋겠는데") — 이 앱의 완료 로그 배지 +
// 이메일 점검안내 모두 app-health-checks.js 의 단일 목록에서 나온다(stop/delete 때도
// 같은 목록을 반대 기대치로 재사용 — manage-dev-synol.js 참조).
const { runHealthCheck } = require('../app-health-checks');

requireCreds('deploy-dev-synol-gw-ecBeGateway.js');

const DOCKER = '/usr/local/bin/docker';
// 2026-09-06 재구조화(요청사항: "shopjoy 아래 혼재돼 있던 폴더를 apps/storage/data/logs 로 분류")
const REMOTE_GW_DIR = '/volume1/docker/shopjoy/apps/ecBeGateway';
// 2026-09-06(요청사항: "logs 는 안 남기나 — dev 에서는 로그 남겨줘") — docker-compose.yml 이
// /var/log/nginx 를 이 경로에 바인드마운트한다. 다른 앱들과 같은 logs/{앱}Logs 이름규칙.
const REMOTE_GW_LOGS_DIR = '/volume1/docker/shopjoy/logs/ecBeGatewayLogs';
const CONTAINER_NAME = 'shopjoy-ecBeGateway-22099';
const PUBLIC_PORT = 22099;
const PUBLIC_HOST = 'illeesam.synology.me';
// 2026-09-06: 22099.illeesam.synology.me 도 DSM 리버스프록시+전용 인증서 등록 완료(curl 실측
// 200) — 실제 점검 URL 목록은 이제 app-health-checks.js 의 공통목록(runHealthCheck)에서 나온다.

const TAG = { toString() { return `[${hms()}][deploy-dev-synol-gw-ecBeGateway.js][GW]`; } };
const step = (n) => `${TAG}[${String(n).padStart(2, '0')}]`;

const startedAt = Date.now();
function fmtElapsed() {
  const sec = Math.round((Date.now() - startedAt) / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

(async () => {
  try {
    console.log(`${TAG} ▶ 시작 : 테스트 게이트웨이(ecBeGateway) compose 배포 (배포 대상: dev NAS, 빌드 단계 없음)\n`);

    // ROOT(synology-deploy-util.js 기준) = apps/ — 형제 폴더 apps/ecBeGateway 에 설정 파일이 있다.
    const gwDir = path.join(ROOT, 'ecBeGateway');
    const configUploads = ['docker-compose.yml', 'nginx.conf', 'locations.conf', 'security-headers.conf']
      .map((f) => ({ local: path.join(gwDir, f), remote: `${REMOTE_GW_DIR}/${f}` }));

    console.log(`${step(1)} 설정 파일 전송 + 컨테이너 기동`);
    await withSsh(
      configUploads,
      [
        { label: '로그 볼륨 폴더 존재 보장', cmd: `mkdir -p ${REMOTE_GW_LOGS_DIR}` },
        { label: '컨테이너 기동/갱신 (+ 옛 구성 정리)', cmd: `cd ${REMOTE_GW_DIR} && ${DOCKER} compose up -d --force-recreate --remove-orphans` },
        { label: '3초 대기 후 상태 확인', cmd: `sleep 3 && cd ${REMOTE_GW_DIR} && ${DOCKER} compose ps` },
        {
          label: '정적 서빙 + 프록시 확인',
          cmd:
            `echo "  index.html          : $(curl -s -o /dev/null -w '%{http_code}' http://localhost:${PUBLIC_PORT}/index.html)"; ` +
            `echo "  bo.html             : $(curl -s -o /dev/null -w '%{http_code}' http://localhost:${PUBLIC_PORT}/bo.html)"; ` +
            `echo "  /api/co/sy/code(BE) : $(curl -s -o /dev/null -w '%{http_code}' 'http://localhost:${PUBLIC_PORT}/api/co/sy/code/page?pageNo=1&pageSize=1')"; ` +
            `echo "  /home(BE 로그뷰어)   : $(curl -s -o /dev/null -w '%{http_code}' http://localhost:${PUBLIC_PORT}/admin-tools/index.html)"; ` +
            `echo "  /cdn-admin(CDN)     : $(curl -s -o /dev/null -w '%{http_code}' http://localhost:${PUBLIC_PORT}/cdn-admin/index.html)"`,
          allowFail: true,
        },
      ],
      TAG
    );

    // 2026-09-06(요청사항: "npm deploy/stop/delete 시 공통 api점검, url점검 항목을 최대한
    // 구성하여 별도파일로 만들어 모두가 공통점검하면 좋겠는데") — 완료 로그 배지 + 이메일
    // 점검안내 둘 다 app-health-checks.js 의 단일 목록에서 나온다.
    const { ok: healthOk, results: healthResults } = await runHealthCheck('ecBeGateway', { expect: 'up', tag: TAG });
    console.log(`\n${TAG}[완료] 게이트웨이 배포 끝 (총 소요 ${fmtElapsed()})`);
    console.log(`${TAG}   ⚠ ecBeBo(22300)/ecBeCdn(22400)이 이 NAS에 안 떠 있으면 /api,/cdn-admin,/admin-tools 는 502가 정상입니다.`);

    await notifyDeployResult({
      tag: TAG, logFilePath: LOG_FILE_PATH, scriptName: 'ecBeGateway', success: healthOk, elapsed: fmtElapsed(),
      detail: healthOk ? '배포 완료 — 공통점검 전체 정상' : '배포 완료 — 공통점검에서 일부 이상 있음(위 로그 ❌ 항목 참조)',
      serverInfo: [
        { label: 'NAS 호스트', value: `illeesam.synology.me (SSH 10022 / 포트 ${PUBLIC_PORT})` },
        { label: '설치 경로', value: REMOTE_GW_DIR },
        { label: '컨테이너명', value: `${CONTAINER_NAME} (이미지 nginx:1.27-alpine)` },
        { label: '용도', value: '테스트 전용 — ecBeBo/ecBeCdn/ecFeBo 를 한 origin 으로 묶어서 보는 편의 도구' },
        { label: '전제조건', value: 'ecBeBo(22300)/ecBeCdn(22400)이 같은 NAS에 떠 있고, ecFeBo 정적 파일이 배포돼 있어야 함' },
      ],
      checkUrls: healthResults.map((r) => ({ url: r.url, note: r.note })),
      npmScript: 'deploy/ecBeGateway',
    });
    console.log(`${TAG} ◀ 완료`);
  } catch (e) {
    console.error(`\n${TAG}[실패] ❌ 배포 실패 (경과 ${fmtElapsed()}): ${e.message}`);
    await notifyDeployResult({
      tag: TAG, logFilePath: LOG_FILE_PATH, scriptName: 'ecBeGateway', success: false, elapsed: fmtElapsed(),
      detail: `오류: ${e.message}`,
      serverInfo: [], checkUrls: [],
      npmScript: 'deploy/ecBeGateway',
    });
    process.exit(1);
  }
})();
