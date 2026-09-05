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
const https = require('https');
const { ROOT, fail, requireCreds, run, withSsh, hms } = require('./synology-deploy-util');
const { notifyDeployResult } = require('./notify-deploy-result');

requireCreds('scripts/deploy-dev-synol-be-ecCdnApi.js');

const DOCKER = '/usr/local/bin/docker';
const REMOTE_CDN_DIR = '/volume1/docker/shopjoy/eccdnapi';
const PUBLIC_HOST = '21000.illeesam.synology.me';

// 2026-09-06: 지금까지는 NAS 내부(localhost:21090, withSsh 단계)만 확인했다 — nginx 라우팅
// (locations.conf 의 /api/cdn/, /cdn-admin/) 이 깨져도 그 체크는 통과해버리므로, FE 배포 스크립트
// (deploy-dev-synol-fe-vue3cdn.js)와 동일하게 이 컴퓨터 → 공개 HTTPS 경로도 별도로 확인한다
// (요청사항: "URL 헬스체크도 한거야? 헬스체크 없으면 api 추가해줘"). actuator 는 공개 라우트가
// 아니라서(의도적으로 nginx 에 안 뚫어둠) 실제 공개된 두 경로로 대신 검증: 관리자 정적 화면(/cdn-admin/)
// + nginx→백엔드→DB 까지 타는 실 API(/api/cdn/client/page).
function checkUrl(pathname) {
  return new Promise((resolve) => {
    const req = https.get({ hostname: PUBLIC_HOST, path: pathname, timeout: 10000 }, (res) => {
      res.resume();
      resolve(String(res.statusCode));
    });
    req.on('timeout', () => { req.destroy(); resolve('timeout'); });
    req.on('error', (e) => resolve(`error(${e.code || e.message})`));
  });
}

// 2026-09-06: toString() 을 커스텀해서 `${TAG}` 로 보간될 때마다 그 순간의 [HH:MM:SS] 시각을
// 새로 계산해 넣는다(요청사항).
const TAG = { toString() { return `[${hms()}][deploy-dev-synol-be-ecCdnApi.js][CDN]`; } };
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

    console.log(`\n${step(2)} 헬스체크 2/2 — 외부 HTTPS 접속 확인 (이 컴퓨터 → https://${PUBLIC_HOST})`);
    const [adminStatus, apiStatus] = await Promise.all([
      checkUrl('/cdn-admin/index.html'),
      checkUrl('/api/cdn/client/page?pageNo=1&pageSize=1'),
    ]);
    console.log(`${TAG}   /cdn-admin/index.html (정적 관리자 화면) : ${adminStatus}`);
    console.log(`${TAG}   /api/cdn/client/page (nginx→백엔드→DB)   : ${apiStatus}`);
    const publicOk = adminStatus === '200' && apiStatus === '200';
    if (publicOk) {
      console.log(`${TAG}   ✅ 외부 헬스체크 통과 — nginx→EcCdnApi→DB 경로까지 전부 정상`);
    } else {
      console.log(`${TAG}   ⚠ 200이 아닌 응답이 있습니다 — NAS 내부는 정상이어도 nginx 라우팅(locations.conf)/DSM 리버스 프록시 쪽 문제일 수 있음`);
    }

    console.log(`\n${TAG}[완료] EcCdnApi 배포 끝 (총 소요 ${fmtElapsed()})${publicOk ? ' (외부 헬스체크 정상)' : ' (외부 헬스체크 이상 있음 — 위 내용 확인)'}`);
    console.log(`${TAG}   헬스체크(디버그 직접, NAS 내부): http://illeesam.synology.me:21090/actuator/health`);
    console.log(`${TAG}   공개 경로(nginx 경유): https://${PUBLIC_HOST}/cdn-admin/index.html , https://${PUBLIC_HOST}/api/cdn/client/page`);
    // 점검 안내(요청사항) — 정적화면(로그뷰어 포함) + API + NAS 내부 디버그, 다양하게 골라 나열.
    // 로그뷰어 URL 은 배포 후 바로 클릭해서 볼 수 있게 항상 포함(요청사항: "배포 후 로그화면보는
    // url 도 보내줘 이건 인증없이 누구나 보는거야").
    const checkUrls = [
      { url: `https://${PUBLIC_HOST}/cdn-admin/index.html`, note: '관리자 화면 기본 진입(cf_file 관리, 로그인 불필요)' },
      { url: `https://${PUBLIC_HOST}/cdn-admin/index.html?page=logViewer`, note: '🪵 로그뷰어(인증 불필요)' },
      { url: `https://${PUBLIC_HOST}/cdn-admin/index.html?page=authTest`, note: '인증 테스트(로그인/재발급/강제폐기)' },
      { url: `https://${PUBLIC_HOST}/cdn-admin/index.html?page=dbTest`, note: 'DB 연결 테스트(임의 접속정보로 SELECT 확인)' },
      { url: `https://${PUBLIC_HOST}/api/cdn/client/page?pageNo=1&pageSize=1`, note: 'cf_client 목록 API — nginx→EcCdnApi→DB 확인용' },
      { url: `https://${PUBLIC_HOST}/api/cdn/log/tail?file=app&lines=20`, note: '로그 tail API(최근 20줄)' },
      { url: 'http://illeesam.synology.me:21090/actuator/health', note: 'NAS 내부 디버그용(공개 라우트 아님, 21090 직접 접속)' },
    ];
    // 서버/설치경로/환경 정보(요청사항: "서버정보 및 설치 경로정보도 추가해줘" / "주요 환경정보도 있으면 좋겠어").
    const serverInfo = [
      { label: 'NAS 호스트', value: 'illeesam.synology.me (SSH 10022 / 앱 포트 21090 / 공개 HTTPS 21000)' },
      { label: '설치 경로', value: REMOTE_CDN_DIR },
      { label: '컨테이너명', value: '230-shopjoy-eccdnapi (docker compose 서비스명: eccdnapi)' },
      { label: 'Docker 네트워크', value: 'shopjoy-net (EcAdminApi nginx 컨테이너와 공유)' },
      { label: '활성 프로파일', value: 'dev (application-dev.yml)' },
      { label: 'DB 접속', value: 'illeesam.synology.me:17632 / shopjoy_2604 (PostgreSQL, p6spy 경유)' },
      { label: '파일 저장 볼륨', value: '/volume1/docker/shopjoy/cdn-storage → 컨테이너 /app/storage' },
      { label: '로그 경로', value: '/volume1/docker/eccdnapi/logs → 컨테이너 /app/logs' },
    ];
    await notifyDeployResult({
      tag: TAG, scriptName: 'EcCdnApi', success: publicOk, elapsed: fmtElapsed(),
      detail: publicOk ? '외부 헬스체크 정상' : `외부 헬스체크 이상 있음: /cdn-admin/index.html=${adminStatus} /api/cdn/client/page=${apiStatus}`,
      serverInfo,
      checkUrls,
      npmScript: 'deploy:dev-synol-be-ecCdnApi',
    });
    console.log(`${TAG} ◀ 완료`);
  } catch (e) {
    console.error(`\n${TAG}[실패] ❌ 배포 실패 (경과 ${fmtElapsed()}): ${e.message}`);
    await notifyDeployResult({
      tag: TAG, scriptName: 'EcCdnApi', success: false, elapsed: fmtElapsed(),
      detail: `오류: ${e.message}`,
      checkUrls: [
        { url: `https://${PUBLIC_HOST}/cdn-admin/index.html`, note: '관리자 화면(정상화 후 재확인)' },
        { url: `https://${PUBLIC_HOST}/api/cdn/client/page?pageNo=1&pageSize=1`, note: 'cf_client 목록 API(정상화 후 재확인)' },
        { url: 'http://illeesam.synology.me:21090/actuator/health', note: 'NAS 내부 디버그용' },
      ],
      npmScript: 'deploy:dev-synol-be-ecCdnApi',
    });
    process.exit(1);
  }
})();
