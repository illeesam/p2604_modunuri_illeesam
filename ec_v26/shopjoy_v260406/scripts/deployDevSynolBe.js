/* deployDevSynolBe.js — 내 컴퓨터에서 직접 SSH로 백엔드(EcAdminApi)를 Synology NAS(dev)에
 * 빌드+전송+재기동까지 한 번에. GitHub Actions 를 거치지 않는다(그쪽은 package.json 의
 * deploy:dev-github-be/-fe/-full 참조 — git push 로 GitHub 서버가 대신 빌드+배포).
 * 프론트는 별도 scripts/deployDevSynolFe.js(= npm run deploy:dev-synol-fe).
 * 백엔드+프론트 둘 다 한 번에 하려면 npm run deploy:dev-synol-full.
 *
 * 사용법: node scripts/deployDevSynolBe.js   (= npm run deploy:dev-synol-be)
 * NAS 접속정보는 scripts/.synology-deploy.env 필요 — 형식은 synologyDeployUtil.js 상단 주석 참조.
 *
 * 무엇을 하는지는 _apps_be/EcAdminApi/_doc/11_illeesam_synology_BE_수동배포가이드(synology).md 의
 * STEP 1~5 와 완전히 동일한 절차를 그대로 스크립트로 옮긴 것뿐이다 — 사람이 손으로 치던
 * 명령을 그대로 자동화했다는 점이 중요: 이 스크립트가 뭘 하는지 궁금하면 그 문서를 보면 된다.
 */
const fs = require('fs');
const path = require('path');
const { ROOT, fail, requireCreds, run, withSsh } = require('./synologyDeployUtil');

requireCreds('scripts/deployDevSynolBe.js');

const DOCKER = '/usr/local/bin/docker';
const REMOTE_BE_DIR = '/volume1/docker/shopjoy/backend';

// 2026-09-05: 스크립트 전체(빌드~헬스체크까지) 소요시간을 마지막에 보여주기 위한 시작시각.
// NAS 안에서의 healthy 대기 경과시간(waitHealthyCmd, 위 TS)과는 별개 — 이건 "내 컴퓨터 기준
// 전체 배포 명령이 끝나기까지" 걸린 총 시간(Gradle 빌드 시간 포함)이다.
const startedAt = Date.now();
function fmtElapsed() {
  const sec = Math.round((Date.now() - startedAt) / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

(async () => {
  try {
    console.log('=== 백엔드(EcAdminApi) 배포 시작 ===\n');

    console.log('[BE-1] Gradle 빌드 (clean bootJar -x test)');
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

    // 헬스체크가 "healthy"로 뜨기까지 실측 40초~2분 넘게 걸릴 때도 있음(NAS CPU가 약해서
    // 편차가 큼) — docker compose ps 결과에서 ecadminapi 줄에 "(healthy)"가 보일 때까지
    // 3초 간격 최대 100회(총 5분)까지 반복 확인. 재기동 직후엔 항상 "(health: starting)"이
    // 정상이라, 이 폴링이 없으면 사람이 매번 직접 몇 번씩 docker compose ps 를 다시 쳐봐야 했다.
    // 2026-09-05: docker compose ps 자체의 STATUS 컬럼("Up 44 seconds" → 1분 넘어가면
    // "Up About a minute" 같은 뭉뚱그린 표현으로 바뀜)에 기대지 않고, 우리가 반복 횟수(i)로
    // 정확한 경과시간(MM:SS)을 직접 계산해서 각 줄 앞에 붙여준다 — 매 반복 3초 간격이라
    // (i-1)*3초가 곧 경과시간. printf(셸 내장)만 쓰므로 별도 도구 설치 불필요.
    const waitHealthyCmd =
      `cd ${REMOTE_BE_DIR} && ` +
      `for i in $(seq 1 100); do ` +
      `ELAPSED=$(( (i-1)*3 )); ` +
      `TS=$(printf '%02d:%02d' $((ELAPSED/60)) $((ELAPSED%60))); ` +
      `LINE=$(${DOCKER} compose ps | grep ecadminApi); ` +
      `echo "  [$i/100 | $TS 경과] $LINE"; ` +
      `if echo "$LINE" | grep -q "(healthy)"; then echo "  ✅ healthy 확인됨 (경과 $TS)"; exit 0; fi; ` +
      `sleep 3; ` +
      `done; ` +
      `echo "  ⚠ 5분 안에 healthy 가 안 됐습니다 — 아래 로그로 원인 확인 필요"; exit 1`;

    await withSsh(
      [{ local: jarPath, remote: `${REMOTE_BE_DIR}/${jarFile}` }],
      [
        { label: 'Docker 이미지 재빌드', cmd: `cd ${REMOTE_BE_DIR} && ${DOCKER} compose build` },
        { label: '컨테이너 재기동', cmd: `cd ${REMOTE_BE_DIR} && ${DOCKER} compose up -d --force-recreate ecadminapi` },
        { label: '헬스체크 대기(healthy 될 때까지 최대 5분)', cmd: waitHealthyCmd, allowFail: true },
        {
          label: 'actuator 헬스체크 실제 응답',
          cmd: `curl -s -o /tmp/health.txt -w '  HTTP %{http_code}\\n' http://localhost:21080/actuator/health; cat /tmp/health.txt; echo`,
          allowFail: true,
        },
        {
          label: '최근 로그(위 응답이 이상하면 원인 확인용)',
          cmd: `cd ${REMOTE_BE_DIR} && ${DOCKER} compose logs --tail 30 ecadminapi`,
          allowFail: true,
        },
      ]
    );

    console.log(`\n[BE-완료] 백엔드 배포 끝 (총 소요 ${fmtElapsed()})`);
    console.log('  헬스체크 : http://illeesam.synology.me:21080/actuator/health');
    console.log('  테스트 API(공통코드 페이징, 로그인 불필요):');
    console.log('    http://illeesam.synology.me:21080/api/co/sy/code/page?pageNo=1&pageSize=10');
  } catch (e) {
    console.error(`\n[BE-실패] ❌ 배포 실패 (경과 ${fmtElapsed()}): ${e.message}`);
    process.exit(1);
  }
})();
