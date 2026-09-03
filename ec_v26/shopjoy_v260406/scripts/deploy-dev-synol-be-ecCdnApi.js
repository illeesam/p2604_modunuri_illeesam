/* deploy-dev-synol-be-ecCdnApi.js — 내 컴퓨터에서 직접 SSH로 EcCdnApi(동영상/이미지 CDN 서버)를
 * Synology NAS(dev)에 빌드+전송+재기동까지 한 번에. deploy-dev-synol-be-ecAdminApi.js 와 완전히
 * 같은 패턴이지만 대상이 다른 앱(_apps_be/EcCdnApi)·다른 NAS 디렉터리·다른 compose 파일이다.
 * GitHub Actions 는 아직 EcCdnApi 용으로 없음(필요해지면 shopjoy-be-illeesam-synol-deploy.yml
 * 패턴을 그대로 복제해서 추가할 것).
 *
 * ⚠️ 최초 1회는 반드시 NAS에 아래를 수동으로 먼저 준비해야 한다(EcAdminApi/_doc/11번 문서의
 *    "수동배포가이드"와 동일한 절차 — EcCdnApi/_doc/01_EcCdnApi_개요및배포가이드.md 참조):
 *      1) /volume1/docker/shopjoy/eccdnapi/ 폴더에 Dockerfile, docker-compose.yml, .env 배치
 *      2) EcAdminApi 쪽 compose(nginx 포함)가 먼저 떠서 "shopjoy-net" 네트워크가 만들어져 있을 것
 *         (docker-compose.yml 이 external: true 로 이 네트워크를 공유하기 때문)
 *      3) _doc/ddl_pgsql/ec/cf_client.sql, cf_file.sql 을 DB에 적용 + cf_client 계정 시딩
 *    이 스크립트는 그 이후 "jar만 갱신"하는 반복 배포용이다 — Dockerfile/compose/.env 는 안 건드림.
 *
 * 사용법: node scripts/deploy-dev-synol-be-ecCdnApi.js   (= npm run deploy:dev-synol-be-ecCdnApi)
 * NAS 접속정보는 scripts/.synology-deploy.env 필요 — 형식은 synology-deploy-util.js 상단 주석 참조.
 */
const fs = require('fs');
const path = require('path');
const { ROOT, fail, requireCreds, run, withSsh } = require('./synology-deploy-util');
const { notifyDeployResult } = require('./notify-deploy-result');

requireCreds('scripts/deploy-dev-synol-be-ecCdnApi.js');

const DOCKER = '/usr/local/bin/docker';
const REMOTE_CDN_DIR = '/volume1/docker/shopjoy/eccdnapi';

const TAG = '[deploy-dev-synol-be-ecCdnApi.js][CDN]';
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
    console.log(`${TAG} ▶ 시작 : EcCdnApi(동영상/이미지 CDN 서버) Gradle 빌드 + NAS 전송 + Docker 재기동 (배포 대상: dev NAS)\n`);

    console.log(`${step(1)} Gradle 빌드 (clean bootJar -x test)`);
    const cdnDir = path.join(ROOT, '_apps_be', 'EcCdnApi');
    const gradlew = process.platform === 'win32'
      ? path.join(cdnDir, 'gradlew.bat')
      : path.join(cdnDir, 'gradlew');
    run(`"${gradlew}" clean bootJar -x test`, cdnDir, TAG);

    const jarDir = path.join(cdnDir, 'build', 'libs');
    const jarFile = fs.readdirSync(jarDir).find((f) => f.endsWith('.jar') && !f.includes('plain'));
    if (!jarFile) fail('build/libs 에서 jar 파일을 못 찾았습니다 — 빌드 실패 확인 필요', TAG);
    const jarPath = path.join(jarDir, jarFile);
    console.log(`${TAG}   결과: ✅ ${jarFile} (${(fs.statSync(jarPath).size / 1024 / 1024).toFixed(1)}MB)`);

    const waitHealthyCmd =
      `cd ${REMOTE_CDN_DIR} && ` +
      `for i in $(seq 1 100); do ` +
      `ELAPSED=$(( (i-1)*3 )); ` +
      `TS=$(printf '%02d:%02d' $((ELAPSED/60)) $((ELAPSED%60))); ` +
      `LINE=$(${DOCKER} compose ps | grep eccdnapi); ` +
      `echo "  [$i/100 | $TS 경과] $LINE"; ` +
      `if echo "$LINE" | grep -q "(healthy)"; then echo "  ✅ healthy 확인됨 (경과 $TS)"; exit 0; fi; ` +
      `sleep 3; ` +
      `done; ` +
      `echo "  ⚠ 5분 안에 healthy 가 안 됐습니다 — 아래 로그로 원인 확인 필요"; exit 1`;

    await withSsh(
      [{ local: jarPath, remote: `${REMOTE_CDN_DIR}/${jarFile}` }],
      [
        {
          // EcAdminApi 배포 스크립트와 같은 이유(로그 볼륨) + 여기는 실제 미디어 저장 볼륨도 있음.
          label: '로그·저장소 볼륨 폴더 존재 보장',
          cmd: 'mkdir -p /volume1/docker/eccdnapi/logs /volume1/docker/shopjoy/cdn-storage',
        },
        { label: 'Docker 이미지 재빌드', cmd: `cd ${REMOTE_CDN_DIR} && ${DOCKER} compose build` },
        { label: '컨테이너 재기동', cmd: `cd ${REMOTE_CDN_DIR} && ${DOCKER} compose up -d --force-recreate eccdnapi` },
        { label: '헬스체크 대기(healthy 될 때까지 최대 5분)', cmd: waitHealthyCmd, allowFail: true },
        {
          label: 'actuator 헬스체크 실제 응답',
          cmd: `curl -s -o /tmp/cdn_health.txt -w '  HTTP %{http_code}\\n' http://localhost:21090/actuator/health; cat /tmp/cdn_health.txt; echo`,
          allowFail: true,
        },
        {
          label: '최근 로그(위 응답이 이상하면 원인 확인용)',
          cmd: `cd ${REMOTE_CDN_DIR} && ${DOCKER} compose logs --tail 30 eccdnapi`,
          allowFail: true,
        },
      ],
      TAG
    );

    console.log(`\n${TAG}[완료] EcCdnApi 배포 끝 (총 소요 ${fmtElapsed()})`);
    console.log(`${TAG}   헬스체크(디버그 직접): http://illeesam.synology.me:21090/actuator/health`);
    console.log(`${TAG}   공개 경로(nginx 경유): https://21000.illeesam.synology.me/cf/file/{fileId}`);
    await notifyDeployResult({
      tag: TAG, scriptName: 'EcCdnApi', success: true, elapsed: fmtElapsed(),
      detail: `헬스체크: http://illeesam.synology.me:21090/actuator/health`,
      npmScript: 'deploy:dev-synol-be-ecCdnApi',
    });
    console.log(`${TAG} ◀ 완료`);
  } catch (e) {
    console.error(`\n${TAG}[실패] ❌ 배포 실패 (경과 ${fmtElapsed()}): ${e.message}`);
    await notifyDeployResult({
      tag: TAG, scriptName: 'EcCdnApi', success: false, elapsed: fmtElapsed(),
      detail: `오류: ${e.message}`,
      npmScript: 'deploy:dev-synol-be-ecCdnApi',
    });
    process.exit(1);
  }
})();
