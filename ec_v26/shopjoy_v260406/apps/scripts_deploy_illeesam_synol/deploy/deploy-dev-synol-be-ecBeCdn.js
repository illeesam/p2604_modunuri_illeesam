/* deploy-dev-synol-be-ecBeCdn.js — 내 컴퓨터에서 직접 SSH로 EcCdnApi(동영상/이미지 CDN 서버)를
 * Synology NAS(dev)에 빌드+전송+재기동까지 한 번에. deploy-dev-synol-be-ecBeBo.js 와 완전히
 * 같은 패턴이지만 대상이 다른 앱(apps/ecBeCdn)·다른 NAS 디렉터리·다른 compose 파일이다.
 * GitHub Actions 는 아직 EcCdnApi 용으로 없음(필요해지면 shopjoy-be-illeesam-synol-deploy.yml
 * 패턴을 그대로 복제해서 추가할 것).
 *
 * 2026-09-06 개편(요청사항: "4개 앱이 각자 다른 호스팅사에 흩어질 수도 있다"는 최악의 경우
 * 기준 설계) — shopjoy-net 공유 폐기, 포트 21090→22400(정식 공개 포트로 승격), 컨테이너명
 * 230-shopjoy-eccdnapi→shopjoy-ecBeCdn-22400, 공개 경로가 더 이상 EcAdminApi 쪽 nginx
 * (/cdn-admin/, /api/cdn/) 를 거치지 않고 이 컨테이너 자신의 포트로 직접 노출된다.
 *
 * ⚠️ 최초 1회는 반드시 NAS에 아래를 수동으로 먼저 준비해야 한다(ecBeCdn/_doc/01_EcCdnApi_개요및배포가이드.md 참조):
 *      1) /volume1/docker/shopjoy/ecBeCdn/ 폴더에 Dockerfile, docker-compose.yml, .env 배치
 *      2) _doc/ddl_pgsql/ec/cf_client.sql, cf_file.sql 을 DB에 적용 + cf_client 계정 시딩
 *    이 스크립트는 그 이후 "jar만 갱신"하는 반복 배포용이다 — Dockerfile/compose/.env 는 안 건드림.
 *
 * 사용법: apps/scripts_deploy_illeesam_synol/deploy/ 에서 npm run ecBeCdn
 *          (또는 루트에서 npm run ecBeCdn --workspace=deploy)
 * NAS 접속정보는 apps/scripts_deploy_illeesam_synol/.synology-deploy.env 필요 — 형식은 ../synology-deploy-util.js 상단 주석 참조.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { ROOT, fail, requireCreds, run, withSsh, hms, LOG_FILE_PATH } = require('../synology-deploy-util');
const { notifyDeployResult } = require('../notify-deploy-result');

requireCreds('scripts/deploy-dev-synol-be-ecBeCdn.js');

const DOCKER = '/usr/local/bin/docker';
const REMOTE_CDN_DIR = '/volume1/docker/shopjoy/ecBeCdn';
// 2026-09-06: 이 컨테이너가 이제 자기 포트(22400)로 직접 공개된다 — EcAdminApi 쪽 nginx(21000/
// 22000)를 더 이상 거치지 않는다. DSM 리버스 프록시에 22400.illeesam.synology.me(HTTPS) 서브
// 도메인을 이 포트로 연결해두면(CorsOriginPolicy.java 의 "*.illeesam.synology.me" 패턴이 이미
// 지원) 아래 HTTPS 외부 헬스체크가 그 경로로 동작한다 — 등록 전까지는 HTTP 직접 포트로 확인.
const PUBLIC_HOST = 'illeesam.synology.me';
const PUBLIC_PORT = 22400;

// 2026-09-06: 완전 분리 설계 전환 후에도 "NAS 내부만 정상이고 외부 공개 경로는 막혀있다"는
// 사고를 놓치지 않기 위해 이 컴퓨터 → 실제 공개 포트로 별도 확인한다(요청사항: "URL 헬스체크도
// 한거야? 헬스체크 없으면 api 추가해줘"). actuator 는 공개 라우트가 아니므로(의도적으로 미공개)
// 실제 공개된 두 경로로 대신 검증: 관리자 정적 화면(/home/index.html) + 실 API(/api/cdn/client/page).
function checkUrl(pathname) {
  return new Promise((resolve) => {
    const req = http.get({ hostname: PUBLIC_HOST, port: PUBLIC_PORT, path: pathname, timeout: 10000 }, (res) => {
      res.resume();
      resolve(String(res.statusCode));
    });
    req.on('timeout', () => { req.destroy(); resolve('timeout'); });
    req.on('error', (e) => resolve(`error(${e.code || e.message})`));
  });
}

// 2026-09-06: toString() 을 커스텀해서 `${TAG}` 로 보간될 때마다 그 순간의 [HH:MM:SS] 시각을
// 새로 계산해 넣는다(요청사항).
const TAG = { toString() { return `[${hms()}][deploy-dev-synol-be-ecBeCdn.js][CDN]`; } };
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
    // ROOT(synology-deploy-util.js 기준) = apps/ (2026-09-06: apps/ecFeBo/scripts/ 에서
    // apps/scripts_deploy_illeesam_synol/ 로 독립). CDN 서버는 그 바로 아래 형제 폴더 apps/ecBeCdn 에 있다.
    const cdnDir = path.join(ROOT, 'ecBeCdn');
    const gradlew = process.platform === 'win32'
      ? path.join(cdnDir, 'gradlew.bat')
      : path.join(cdnDir, 'gradlew');
    await run(`"${gradlew}" clean bootJar -x test`, cdnDir, TAG);

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
      `LINE=$(${DOCKER} compose ps | grep ecBeCdn); ` +
      `echo "  [$i/100 | $TS 경과] $LINE"; ` +
      `if echo "$LINE" | grep -q "(healthy)"; then echo "  ✅ healthy 확인됨 (경과 $TS)"; exit 0; fi; ` +
      `sleep 3; ` +
      `done; ` +
      `echo "  ⚠ 5분 안에 healthy 가 안 됐습니다 — 아래 로그로 원인 확인 필요"; exit 1`;

    // 2026-09-06: 이 스크립트도 BE 스크립트와 같은 이유로 매번 최신 docker-compose.yml 을 함께
    // 올려 리포=NAS 상태를 일치시킨다(오늘의 포트/컨테이너명/네트워크 변경 등).
    const composePath = path.join(cdnDir, 'docker-compose.yml');

    await withSsh(
      [
        { local: jarPath, remote: `${REMOTE_CDN_DIR}/${jarFile}` },
        { local: composePath, remote: `${REMOTE_CDN_DIR}/docker-compose.yml` },
      ],
      [
        {
          // EcAdminApi 배포 스크립트와 같은 이유(로그 볼륨) + 여기는 실제 미디어 저장 볼륨도 있음.
          // 2026-09-06: /volume1/docker/eccdnapi/logs → /volume1/docker/shopjoy/ecBeCdnLogs 로
          // 경로 변경(다른 앱들과 명명 원칙 통일). 기존 로그가 있으면 새 경로로 1회 이관.
          label: '로그·저장소 볼륨 폴더 존재 보장 (+ 로그 구경로 1회 이관)',
          cmd: 'mkdir -p /volume1/docker/shopjoy/ecBeCdnLogs /volume1/docker/shopjoy/ecBeCdnStorage && ' +
            'if [ -d /volume1/docker/eccdnapi/logs ] && [ -z "$(ls -A /volume1/docker/shopjoy/ecBeCdnLogs 2>/dev/null)" ]; then ' +
            'mv /volume1/docker/eccdnapi/logs/* /volume1/docker/shopjoy/ecBeCdnLogs/ 2>/dev/null; ' +
            'echo "  ↪ 구 로그 경로(/volume1/docker/eccdnapi/logs)에서 이관 완료"; ' +
            'else echo "  (이관 대상 없음 — 스킵)"; fi',
          allowFail: true,
        },
        { label: 'Docker 이미지 재빌드', cmd: `cd ${REMOTE_CDN_DIR} && ${DOCKER} compose build` },
        {
          // 2026-09-06: --remove-orphans — shopjoy-net 공유를 폐기하면서 네트워크 구성이
          // 바뀌었으므로, 옛 방식으로 뜬 컨테이너가 있으면 같이 정리한다.
          label: '컨테이너 재기동 (+ 옛 구성 정리)',
          cmd: `cd ${REMOTE_CDN_DIR} && ${DOCKER} compose up -d --force-recreate --remove-orphans eccdnapi`,
        },
        { label: '헬스체크 대기(healthy 될 때까지 최대 5분)', cmd: waitHealthyCmd, allowFail: true },
        {
          label: 'actuator 헬스체크 실제 응답',
          cmd: `curl -s -o /tmp/cdn_health.txt -w '  HTTP %{http_code}\\n' http://localhost:${PUBLIC_PORT}/actuator/health; cat /tmp/cdn_health.txt; echo`,
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

    console.log(`\n${step(2)} 헬스체크 2/2 — 외부 접속 확인 (이 컴퓨터 → http://${PUBLIC_HOST}:${PUBLIC_PORT})`);
    const [adminStatus, apiStatus] = await Promise.all([
      checkUrl('/home/index.html'),
      checkUrl('/api/cdn/client/page?pageNo=1&pageSize=1'),
    ]);
    console.log(`${TAG}   /home/index.html (정적 관리자 화면) : ${adminStatus}`);
    console.log(`${TAG}   /api/cdn/client/page (백엔드→DB)     : ${apiStatus}`);
    const publicOk = adminStatus === '200' && apiStatus === '200';
    if (publicOk) {
      console.log(`${TAG}   ✅ 외부 헬스체크 통과 — EcCdnApi→DB 경로까지 전부 정상`);
    } else {
      console.log(`${TAG}   ⚠ 200이 아닌 응답이 있습니다 — 방화벽/공유기 포트포워딩(${PUBLIC_PORT})이 안 열려있을 수 있음`);
    }

    console.log(`\n${TAG}[완료] EcCdnApi 배포 끝 (총 소요 ${fmtElapsed()})${publicOk ? ' (외부 헬스체크 정상)' : ' (외부 헬스체크 이상 있음 — 위 내용 확인)'}`);
    console.log(`${TAG}   헬스체크(직접): http://${PUBLIC_HOST}:${PUBLIC_PORT}/actuator/health`);
    console.log(`${TAG}   공개 경로: http://${PUBLIC_HOST}:${PUBLIC_PORT}/home/index.html , http://${PUBLIC_HOST}:${PUBLIC_PORT}/api/cdn/client/page`);
    // 점검 안내(요청사항) — 정적화면(로그뷰어 포함) + API + NAS 내부 디버그, 다양하게 골라 나열.
    const checkUrls = [
      { url: `http://${PUBLIC_HOST}:${PUBLIC_PORT}/home/index.html`, note: '관리자 화면 기본 진입(cf_file 관리, 로그인 불필요)' },
      { url: `http://${PUBLIC_HOST}:${PUBLIC_PORT}/home/index.html?page=logViewer`, note: '🪵 로그뷰어(인증 불필요)' },
      { url: `http://${PUBLIC_HOST}:${PUBLIC_PORT}/home/index.html?page=authTest`, note: '인증 테스트(로그인/재발급/강제폐기)' },
      { url: `http://${PUBLIC_HOST}:${PUBLIC_PORT}/home/index.html?page=dbTest`, note: 'DB 연결 테스트(임의 접속정보로 SELECT 확인)' },
      { url: `http://${PUBLIC_HOST}:${PUBLIC_PORT}/api/cdn/client/page?pageNo=1&pageSize=1`, note: 'cf_client 목록 API — 확인용' },
      { url: `http://${PUBLIC_HOST}:${PUBLIC_PORT}/api/cdn/log/tail?file=app&lines=20`, note: '로그 tail API(최근 20줄)' },
      { url: `http://${PUBLIC_HOST}:${PUBLIC_PORT}/actuator/health`, note: '헬스체크(직접)' },
    ];
    // 서버/설치경로/환경 정보(요청사항: "서버정보 및 설치 경로정보도 추가해줘" / "주요 환경정보도 있으면 좋겠어").
    const serverInfo = [
      { label: 'NAS 호스트', value: `illeesam.synology.me (SSH 10022 / 앱 포트 ${PUBLIC_PORT} — 이제 정식 공개 포트)` },
      { label: '설치 경로', value: REMOTE_CDN_DIR },
      { label: '컨테이너명', value: 'shopjoy-ecBeCdn-22400 (docker compose 서비스명: eccdnapi)' },
      { label: 'Docker 네트워크', value: '완전 분리 설계(2026-09-06) — 다른 컨테이너와 네트워크 비공유, 단독 기동' },
      { label: '활성 프로파일', value: 'dev (application-dev.yml)' },
      { label: 'DB 접속', value: 'illeesam.synology.me:17632 / shopjoy_2604 (PostgreSQL, p6spy 경유)' },
      { label: '파일 저장 볼륨', value: '/volume1/docker/shopjoy/ecBeCdnStorage → 컨테이너 /app/storage' },
      { label: '로그 경로', value: '/volume1/docker/shopjoy/ecBeCdnLogs → 컨테이너 /app/logs' },
    ];
    await notifyDeployResult({
      tag: TAG, logFilePath: LOG_FILE_PATH, scriptName: 'EcCdnApi', success: publicOk, elapsed: fmtElapsed(),
      detail: publicOk ? '외부 헬스체크 정상' : `외부 헬스체크 이상 있음: /home/index.html=${adminStatus} /api/cdn/client/page=${apiStatus}`,
      serverInfo,
      checkUrls,
      npmScript: 'deploy/ecBeCdn',
    });
    console.log(`${TAG} ◀ 완료`);
  } catch (e) {
    console.error(`\n${TAG}[실패] ❌ 배포 실패 (경과 ${fmtElapsed()}): ${e.message}`);
    await notifyDeployResult({
      tag: TAG, logFilePath: LOG_FILE_PATH, scriptName: 'EcCdnApi', success: false, elapsed: fmtElapsed(),
      detail: `오류: ${e.message}`,
      checkUrls: [
        { url: `http://${PUBLIC_HOST}:${PUBLIC_PORT}/home/index.html`, note: '관리자 화면(정상화 후 재확인)' },
        { url: `http://${PUBLIC_HOST}:${PUBLIC_PORT}/api/cdn/client/page?pageNo=1&pageSize=1`, note: 'cf_client 목록 API(정상화 후 재확인)' },
        { url: `http://${PUBLIC_HOST}:${PUBLIC_PORT}/actuator/health`, note: '헬스체크(직접)' },
      ],
      npmScript: 'deploy/ecBeCdn',
    });
    process.exit(1);
  }
})();
