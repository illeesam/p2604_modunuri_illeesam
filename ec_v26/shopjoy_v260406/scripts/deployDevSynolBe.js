/* deployBeDevSynology.js — 내 컴퓨터에서 직접 SSH로 백엔드(EcAdminApi)를 Synology NAS(dev)에
 * 빌드+전송+재기동까지 한 번에. GitHub Actions 를 거치지 않는다(그쪽은 package.json 의
 * deploy:dev-github 참조 — git push 로 GitHub 서버가 대신 빌드+배포).
 * 프론트는 별도 scripts/deployFeDevSynology.js(= npm run deploy:fe-dev-synol).
 *
 * 사용법: node scripts/deployBeDevSynology.js   (= npm run deploy:be-dev-synol)
 * NAS 접속정보는 scripts/.synology-deploy.env 필요 — 형식은 synologyDeployUtil.js 상단 주석 참조.
 *
 * 무엇을 하는지는 _apps_be/EcAdminApi/_doc/11_illeesam_synology_BE_수동배포가이드.md 의
 * STEP 1~5 와 완전히 동일한 절차를 그대로 스크립트로 옮긴 것뿐이다 — 사람이 손으로 치던
 * 명령을 그대로 자동화했다는 점이 중요: 이 스크립트가 뭘 하는지 궁금하면 그 문서를 보면 된다.
 */
const fs = require('fs');
const path = require('path');
const { ROOT, fail, requireCreds, run, withSsh } = require('./synologyDeployUtil');

requireCreds('scripts/deployBeDevSynology.js');

const DOCKER = '/usr/local/bin/docker';
const REMOTE_BE_DIR = '/volume1/docker/shopjoy/backend';

(async () => {
  try {
    console.log('=== 백엔드(EcAdminApi) 배포 시작 ===\n');

    console.log('[1] Gradle 빌드 (clean bootJar -x test)');
    const beDir = path.join(ROOT, '_apps_be', 'EcAdminApi');
    // 상대경로/PATH 탐색에 기대지 않고 절대경로로 직접 지정 — 실행 환경(git-bash/cmd/PowerShell)에
    // 따라 "현재 폴더 실행파일 탐색" 동작이 달라 상대경로(./gradlew, gradlew.bat)가 간헐적으로
    // "찾을 수 없음" 에러를 내는 걸 봐서, 아예 절대경로로 고정한다.
    const gradlew = process.platform === 'win32'
      ? path.join(beDir, 'gradlew.bat')
      : path.join(beDir, 'gradlew');
    run(`"${gradlew}" clean bootJar -x test`, beDir);

    const jarDir = path.join(beDir, 'build', 'libs');
    const jarFile = fs.readdirSync(jarDir).find((f) => f.endsWith('.jar') && !f.includes('plain'));
    if (!jarFile) fail('build/libs 에서 jar 파일을 못 찾았습니다 — 빌드 실패 확인 필요');
    const jarPath = path.join(jarDir, jarFile);
    console.log(`  결과: ✅ ${jarFile} (${(fs.statSync(jarPath).size / 1024 / 1024).toFixed(1)}MB)`);

    // 헬스체크가 "healthy"로 뜨기까지 실측 약 40초 걸림 — docker compose ps 결과에서
    // ecadminapi 줄에 "(healthy)"가 보일 때까지 3초 간격 최대 20회(60초)까지 반복 확인.
    // 재기동 직후엔 항상 "(health: starting)"이 정상이라, 이 폴링이 없으면 사람이 매번
    // 직접 몇 번씩 docker compose ps 를 다시 쳐봐야 했다.
    const waitHealthyCmd =
      `cd ${REMOTE_BE_DIR} && ` +
      `for i in $(seq 1 20); do ` +
      `LINE=$(${DOCKER} compose ps | grep ecadminApi); ` +
      `echo "  [$i/20] $LINE"; ` +
      `if echo "$LINE" | grep -q "(healthy)"; then echo "  ✅ healthy 확인됨"; exit 0; fi; ` +
      `sleep 3; ` +
      `done; ` +
      `echo "  ⚠ 60초 안에 healthy 가 안 됐습니다 — 아래 로그로 원인 확인 필요"; exit 1`;

    await withSsh(
      [{ local: jarPath, remote: `${REMOTE_BE_DIR}/${jarFile}` }],
      [
        { label: 'Docker 이미지 재빌드', cmd: `cd ${REMOTE_BE_DIR} && ${DOCKER} compose build` },
        { label: '컨테이너 재기동', cmd: `cd ${REMOTE_BE_DIR} && ${DOCKER} compose up -d --force-recreate ecadminapi` },
        { label: '헬스체크 대기(healthy 될 때까지 최대 60초)', cmd: waitHealthyCmd, allowFail: true },
        { label: '최근 로그(healthy 안 됐을 때 원인 확인용)', cmd: `cd ${REMOTE_BE_DIR} && ${DOCKER} compose logs --tail 30 ecadminapi`, allowFail: true },
        { label: 'actuator 헬스체크 실제 응답', cmd: `curl -s http://localhost:21080/actuator/health` },
      ]
    );

    console.log('\n[완료] 백엔드 배포 끝');
    console.log('  헬스체크 : http://illeesam.synology.me:21080/actuator/health');
    console.log('  테스트 API(공통코드 페이징, 로그인 불필요):');
    console.log('    http://illeesam.synology.me:21080/api/co/sy/code/page?pageNo=1&pageSize=10');
  } catch (e) {
    console.error(`\n❌ 배포 실패: ${e.message}`);
    process.exit(1);
  }
})();
