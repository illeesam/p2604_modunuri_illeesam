/* deploy-dev-synol-gw-ecGateway.js — Synology NAS(dev)의 테스트 전용 게이트웨이(apps/ecGateway)를
 * docker-compose.yml 기준으로 (재)배포한다. 다른 deploy-dev-synol-be-*.js 와 달리 Gradle 빌드가
 * 없다 — 공식 nginx 이미지를 그대로 쓰므로 "빌드해서 전송"할 산출물 자체가 없고, compose+nginx
 * 설정 3종 전송 + 컨테이너 기동이 전부다.
 *
 * ⚠️ 테스트 전용이다(apps/ecGateway/docker-compose.yml 상단 주석 참조) — ecBeBo(22300)/
 * ecBeCdn(22400)이 이 NAS에 이미 떠 있어야(host.docker.internal 경유로 호출) 정상 동작하고,
 * ecFeBo(22000)가 배포해둔 정적 파일 폴더(/volume1/docker/shopjoy/ecFeBo)를 그대로 재사용한다
 * — 즉 이 스크립트를 돌리기 전에 deploy/ 에서 npm run ecBeBo / ecBeCdn / ecFeBo 가
 * 먼저 실행되어 있어야 의미가 있다(순서 강제는 안 함 — 없어도 컨테이너 자체는 뜨지만 502/빈
 * 화면만 보게 된다).
 *
 * 사용법: apps/scripts_deploy_illeesam_synol/deploy/ 에서 npm run ecGateway
 *          (또는 루트에서 npm run ecGateway --workspace=deploy)
 * NAS 접속정보는 apps/scripts_deploy_illeesam_synol/.synology-deploy.env 필요 — 형식은 ../synology-deploy-util.js 상단 주석 참조.
 */
const path = require('path');
const { ROOT, requireCreds, withSsh, hms, LOG_FILE_PATH, checkUrlStatusBadges } = require('../synology-deploy-util');
const { notifyDeployResult } = require('../notify-deploy-result');

requireCreds('deploy-dev-synol-gw-ecGateway.js');

const DOCKER = '/usr/local/bin/docker';
const REMOTE_GW_DIR = '/volume1/docker/shopjoy/ecGateway';
const CONTAINER_NAME = 'shopjoy-ecGateway-22099';
const PUBLIC_PORT = 22099;
const PUBLIC_HOST = 'illeesam.synology.me';
// 2026-09-06: 22099.illeesam.synology.me 도 DSM 리버스프록시+전용 인증서 등록 완료(curl 실측
// 200) — HTTP 포트 방식과 나란히 HTTPS 서브도메인 방식도 같이 보여준다.
const PUBLIC_HTTPS_HOST = `22099.${PUBLIC_HOST}`;

const TAG = { toString() { return `[${hms()}][deploy-dev-synol-gw-ecGateway.js][GW]`; } };
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
    console.log(`${TAG} ▶ 시작 : 테스트 게이트웨이(ecGateway) compose 배포 (배포 대상: dev NAS, 빌드 단계 없음)\n`);

    // ROOT(synology-deploy-util.js 기준) = apps/ — 형제 폴더 apps/ecGateway 에 설정 파일이 있다.
    const gwDir = path.join(ROOT, 'ecGateway');
    const configUploads = ['docker-compose.yml', 'nginx.conf', 'locations.conf', 'security-headers.conf']
      .map((f) => ({ local: path.join(gwDir, f), remote: `${REMOTE_GW_DIR}/${f}` }));

    console.log(`${step(1)} 설정 파일 전송 + 컨테이너 기동`);
    await withSsh(
      configUploads,
      [
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

    // 2026-09-06(요청사항: "우측에 결과정보 표시해줄수 있어? ✅ 200 이런식이지") — 아래 나열할
    // URL들을 실제로 curl 체크해서 오른쪽에 상태 배지를 붙인다.
    const completionUrls = [
      `http://${PUBLIC_HOST}:${PUBLIC_PORT}/index.html`,
      `http://${PUBLIC_HOST}:${PUBLIC_PORT}/bo.html`,
      `https://${PUBLIC_HTTPS_HOST}/index.html`,
      `https://${PUBLIC_HTTPS_HOST}/bo.html`,
      // 2026-09-06(요청사항: "swagger 도 추가해주고") — locations.conf 에 /swagger-ui/, /v3/api-docs
      // 전용 라우팅을 추가한 뒤 실측 200 확인.
      `http://${PUBLIC_HOST}:${PUBLIC_PORT}/swagger-ui/index.html`,
      `https://${PUBLIC_HTTPS_HOST}/swagger-ui/index.html`,
    ];
    const completionBadges = await checkUrlStatusBadges(completionUrls);
    const completionWidth = Math.max(...completionUrls.map((u) => u.length));
    const withBadge = (i) => `${completionUrls[i].padEnd(completionWidth)}  ${completionBadges[i]}`;

    console.log(`\n${TAG}[완료] 게이트웨이 배포 끝 (총 소요 ${fmtElapsed()})`);
    console.log(`${TAG}   접속(HTTP)  : ${withBadge(0)}`);
    console.log(`${TAG}   접속(HTTP)  : ${withBadge(1)}`);
    console.log(`${TAG}   접속(HTTPS) : ${withBadge(2)}`);
    console.log(`${TAG}   접속(HTTPS) : ${withBadge(3)}`);
    console.log(`${TAG}   Swagger(HTTP)  : ${withBadge(4)}`);
    console.log(`${TAG}   Swagger(HTTPS) : ${withBadge(5)}`);
    console.log(`${TAG}   ⚠ ecBeBo(22300)/ecBeCdn(22400)이 이 NAS에 안 떠 있으면 /api,/cdn-admin,/admin-tools 는 502가 정상입니다.`);

    await notifyDeployResult({
      tag: TAG, logFilePath: LOG_FILE_PATH, scriptName: 'ecGateway', success: true, elapsed: fmtElapsed(),
      detail: '배포 완료 — 위 로그의 각 경로별 HTTP 상태 참조',
      serverInfo: [
        { label: 'NAS 호스트', value: `illeesam.synology.me (SSH 10022 / 포트 ${PUBLIC_PORT})` },
        { label: '설치 경로', value: REMOTE_GW_DIR },
        { label: '컨테이너명', value: `${CONTAINER_NAME} (이미지 nginx:1.27-alpine)` },
        { label: '용도', value: '테스트 전용 — ecBeBo/ecBeCdn/ecFeBo 를 한 origin 으로 묶어서 보는 편의 도구' },
        { label: '전제조건', value: 'ecBeBo(22300)/ecBeCdn(22400)이 같은 NAS에 떠 있고, ecFeBo 정적 파일이 배포돼 있어야 함' },
      ],
      checkUrls: [
        { url: `http://${PUBLIC_HOST}:${PUBLIC_PORT}/index.html`, note: '사용자(FO) 메인 화면(게이트웨이 경유, HTTP)' },
        { url: `https://${PUBLIC_HTTPS_HOST}/index.html`, note: '사용자(FO) 메인 화면(게이트웨이 경유, HTTPS)' },
        { url: `http://${PUBLIC_HOST}:${PUBLIC_PORT}/bo.html`, note: '관리자(BO) 메인 화면(게이트웨이 경유, HTTP)' },
        { url: `https://${PUBLIC_HTTPS_HOST}/bo.html`, note: '관리자(BO) 메인 화면(게이트웨이 경유, HTTPS — 로그인 가능)' },
        { url: `http://${PUBLIC_HOST}:${PUBLIC_PORT}/api/co/sy/code/page?pageNo=1&pageSize=1`, note: '공통코드 API(게이트웨이→ecBeBo, HTTP)' },
        // 2026-09-06(요청사항: "swagger 도 추가해주고") — /swagger-ui/** 는 locations.conf 의
        // 어느 location 에도 안 걸려 맨 아래 location / → @backend 폴백으로 ecBeBo(ec_admin_api)에
        // 그대로 넘어간다(직접 확인 필요 없이 이미 라우팅됨).
        { url: `http://${PUBLIC_HOST}:${PUBLIC_PORT}/swagger-ui/index.html`, note: 'API 문서(Swagger UI, 게이트웨이→ecBeBo, HTTP)' },
        { url: `https://${PUBLIC_HTTPS_HOST}/swagger-ui/index.html`, note: 'API 문서(Swagger UI, 게이트웨이→ecBeBo, HTTPS)' },
      ],
      npmScript: 'deploy/ecGateway',
    });
    console.log(`${TAG} ◀ 완료`);
  } catch (e) {
    console.error(`\n${TAG}[실패] ❌ 배포 실패 (경과 ${fmtElapsed()}): ${e.message}`);
    await notifyDeployResult({
      tag: TAG, logFilePath: LOG_FILE_PATH, scriptName: 'ecGateway', success: false, elapsed: fmtElapsed(),
      detail: `오류: ${e.message}`,
      serverInfo: [], checkUrls: [],
      npmScript: 'deploy/ecGateway',
    });
    process.exit(1);
  }
})();
