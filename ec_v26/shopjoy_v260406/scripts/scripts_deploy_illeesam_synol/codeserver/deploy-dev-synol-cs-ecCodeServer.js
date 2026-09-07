/* deploy-dev-synol-cs-ecCodeServer.js — Synology DS920+ NAS(dev)에 브라우저용 VS Code
 * (linuxserver/code-server) 인스턴스를 1~5번 중 원하는 번호로 (재)배포한다.
 * 같은 폴더의 docker-compose.yml 은 __CS_INSTANCE__/__CS_PORT_UI__/__CS_PORT_HTTP__/
 * __CS_PORT_DEV__ 자리표시자가 있는 템플릿이고, 이 스크립트가 실행 시 받은 인스턴스 번호로
 * 실제 값을 치환한 사본을 NAS의 인스턴스 전용 폴더(/volume1/docker/shopjoy/apps/
 * ecCodeServer{N}/)에 올린다 — ecBeGateway/ecBeRedis 와 같은 패턴(공식 이미지 그대로 pull,
 * Gradle/npm 빌드 없음).
 * ⚠️ 이 템플릿은 apps/ 밑에 두지 않는다(요청사항: "apps 는 순수 앱 모음이라") — apps/ 는
 * shopjoy 5개 실제 앱(ecBeBo/ecBeCdn/ecFeBo/ecBeRedis/ecBeGateway) 전용, code-server는
 * 그 앱들과 무관한 개발도구라 이 배포 스크립트와 같은 codeserver/ 폴더에 같이 둔다.
 *
 * 2026-09-07 신설 → 같은 날 여러 차례 개편:
 *   1) "codeserver 1,2,3,4,5 5개를 만들수 있게 구성해줘 중지도 삭제도" — 1~5번 독립 인스턴스 체계.
 *   2) "codeserver 폴더로 만들어줘" — deploy/stop/delete/ps 워크스페이스와 분리.
 *   3) "포트는 25100/25200/25300/25400/25500, 25100 기준으로 443은 25100 80은 25180
 *      3000은 25130" — 인스턴스당 포트 1개(22910+N)에서 인스턴스당 포트 3개(UI/HTTP/DEV)로
 *      확장. 기준포트 = 25000 + 100×인스턴스번호.
 *   4) "codeserver 들의 비밀번호는 1 로 해줄수 있어?" — 인스턴스별 강한 난수 생성을 폐기하고
 *      5개 전부 고정값 "1" 사용. ⚠️ 이 저장소는 Public이라(CLAUDE.md 참조) 그 값조차 git
 *      추적 파일엔 절대 하드코딩하지 않고, 매 배포 시 이 스크립트가 NAS의 env/ecCodeServer
 *      {N}.env(git 미추적)에 직접 써넣는다 — docker-compose.yml 은 여전히 ${CODE_SERVER_
 *      PASSWORD} 참조만 가짐. (참고: 비밀번호가 "1"이고 포트가 공개돼 있으면 사실상 이
 *      NAS 전체에 대한 원격 셸 접근권이 거의 누구나 열람 가능한 수준이 된다 — 방화벽/공유기
 *      단에서 외부 접근을 막아두는 걸 권장.)
 *
 * 사용법: scripts/scripts_deploy_illeesam_synol/codeserver/ 에서 npm run "codeserver DEPLOY deploy1-25100 (codeserver)" (~deploy5-25500)
 *          (또는 루트에서 npm run "codeserver DEPLOY deploy1-25100 (codeserver)" --workspace=codeserver)
 * NAS 접속정보는 scripts/scripts_deploy_illeesam_synol/.synology-deploy.env 필요 — 형식은 ../synology-deploy-util.js 상단 주석 참조.
 *
 * ⚠️ 의도적으로 zmulti 류 일괄 명령을 두지 않는다 — 지금 어느 인스턴스 안에서 작업 중일 때
 * 자기 자신의 컨테이너를 재기동시키면 그 순간 자기 터미널/에디터 세션이 끊긴다. 항상 단독
 * 실행할 것(예: npm run "codeserver DEPLOY deploy3-25300 (codeserver)").
 */
const fs = require('fs');
const path = require('path');
const { requireCreds, withSsh, hms, LOG_FILE_PATH, checkUrlStatus, checkUrlStatusBadges, NPM_SCRIPT_NAME } = require('../synology-deploy-util');
const { notifyDeployResult } = require('../notify-deploy-result');

const INSTANCE = Number(process.argv[2]);
if (!Number.isInteger(INSTANCE) || INSTANCE < 1 || INSTANCE > 5) {
  console.error('사용법: node deploy-dev-synol-cs-ecCodeServer.js <1~5>  (codeserver/ 에서 npm run "codeserver DEPLOY deploy1-25100 (codeserver)" ~ "codeserver DEPLOY deploy5-25500 (codeserver)" 로 실행할 것)');
  process.exit(1);
}

requireCreds('deploy-dev-synol-cs-ecCodeServer.js');

const DOCKER = '/usr/local/bin/docker';
// 포트 규칙(요청사항: "포트는 25100/25200/25300/25400/25500, 25100 예로 443은 25100
// 80은 25180 3000은 25130") — 기준포트 = 25000 + 100×인스턴스번호.
//   기준포트+0  → 컨테이너 8443 (code-server 웹 UI 본체, 사용자가 말한 "443")
//   기준포트+80 → 컨테이너 80   (인스턴스 안에서 띄운 로컬 웹서버 미리보기)
//   기준포트+30 → 컨테이너 3000(인스턴스 안에서 띄운 Node/Vite 등 dev 서버 미리보기)
const BASE_PORT = 25000 + INSTANCE * 100;
const PORT_UI = BASE_PORT;
const PORT_HTTP = BASE_PORT + 80;
const PORT_DEV = BASE_PORT + 30;
const REMOTE_CS_DIR = `/volume1/docker/shopjoy/apps/ecCodeServer${INSTANCE}`;
const REMOTE_CS_DATA_DIR = `/volume1/docker/shopjoy/data/ecCodeServer${INSTANCE}Config`;
const REMOTE_CS_ENV_FILE = `/volume1/docker/shopjoy/env/ecCodeServer${INSTANCE}.env`;
const CONTAINER_NAME = `shopjoy-ecCodeServer${INSTANCE}-${PORT_UI}`;
const PUBLIC_HOST = 'illeesam.synology.me';
// 요청사항: "codeserver 들의 비밀번호는 1 로 해줄수 있어?" — 5개 인스턴스 전부 동일 고정값.
const FIXED_PASSWORD = '1';

const TAG = { toString() { return `[${hms()}][deploy-dev-synol-cs-ecCodeServer.js][CS${INSTANCE}]`; } };
const step = (n) => `${TAG}[${String(n).padStart(2, '0')}]`;

const startedAt = Date.now();
function fmtElapsed() {
  const sec = Math.round((Date.now() - startedAt) / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// 2026-09-07(요청사항: 배포 직후 UI 점검이 "❌ error(ECONNRESET)"로 잘못 표시되던 문제 —
// 원인은 5초 대기만 하고 바로 점검해서, 컨테이너는 떴어도 code-server 내부 HTTPS 리스너가
// 아직 준비 전이었던 것) — 200/300번대가 나올 때까지 짧은 간격으로 최대 maxWaitMs 동안
// 재시도한다. HTTP/DEV 미리보기 포트는 원래 비어있는 게 정상이라 이 재시도 대상이 아니다.
async function waitForUp(url, maxWaitMs = 30000, intervalMs = 2000) {
  const deadline = Date.now() + maxWaitMs;
  let status = await checkUrlStatus(url);
  while (!/^[23]\d\d$/.test(status) && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));
    status = await checkUrlStatus(url);
  }
  return status;
}

(async () => {
  try {
    console.log(`${TAG} ▶ 시작 : code-server(브라우저용 VS Code) #${INSTANCE}번 인스턴스 compose 배포 (UI:${PORT_UI} HTTP:${PORT_HTTP} DEV:${PORT_DEV}, 배포 대상: DS920+ dev NAS, 빌드 단계 없음)\n`);

    // 템플릿 원본이 apps/ 가 아니라 이 스크립트와 같은 폴더(codeserver/)에 있다 — apps/ 는
    // shopjoy 실제 앱 전용이라 이 개발도구는 거기 안 둠(요청사항).
    const csDir = __dirname;
    const templatePath = path.join(csDir, 'docker-compose.yml');
    const template = fs.readFileSync(templatePath, 'utf8');
    // 자리표시자 치환 — 여러 곳에 나오므로 replaceAll.
    const rendered = template
      .replaceAll('__CS_INSTANCE__', String(INSTANCE))
      .replaceAll('__CS_PORT_UI__', String(PORT_UI))
      .replaceAll('__CS_PORT_HTTP__', String(PORT_HTTP))
      .replaceAll('__CS_PORT_DEV__', String(PORT_DEV));
    // 렌더링 결과를 임시 파일로 저장했다가 업로드 — withSsh() 업로드 목록은 local 파일 경로가
    // 필요해서, 원본 템플릿을 그대로 올릴 수 없다(치환 전 자리표시자 문자 그대로 올라가면
    // compose가 그 리터럴 문자열을 컨테이너/포트 이름으로 그대로 써버린다).
    const renderedPath = path.join(csDir, `.docker-compose.rendered.${INSTANCE}.yml`);
    fs.writeFileSync(renderedPath, rendered, 'utf8');

    // 2026-09-07(요청사항: "코드서버 삭제후 새로 만들어볼게 그럼 개발메뉴얼.md 새로
    // 추가되는거지?") — 이전엔 최초 1회 수동 SFTP로만 올려서, data 폴더 자체를 지우고
    // 완전히 새로 만들면 매뉴얼이 안 딸려왔다. 매 배포마다 자동으로 최신 버전을 workspace
    // root에 덮어써서, 어떤 방식으로 지우고 다시 만들어도 항상 있게 한다(사용자 작업물이
    // 아니라 참고 문서라 매번 덮어써도 무해 — 오히려 최신으로 갱신되는 게 맞음).
    const manualLocalPath = path.join(csDir, '개발메뉴얼.md');

    console.log(`${step(1)} 설정 파일 전송(#${INSTANCE}번 인스턴스 렌더링본) + 개발메뉴얼 갱신 + 볼륨/비밀번호 준비 + 컨테이너 기동`);
    try {
      await withSsh(
        [
          { local: renderedPath, remote: `${REMOTE_CS_DIR}/docker-compose.yml` },
          { local: manualLocalPath, remote: `${REMOTE_CS_DATA_DIR}/workspace/개발메뉴얼.md` },
        ],
        [
          { label: '데이터 폴더 존재 보장(/config 영구 보존)', cmd: `mkdir -p ${REMOTE_CS_DATA_DIR}` },
          {
            // 요청사항으로 난수 생성을 폐기하고 고정값(1)을 쓰지만, "존재 보장 + 없으면만
            // 기록" 원칙은 그대로 유지 — 이미 배포된 인스턴스를 재배포할 때 값을 다시 쓰지
            // 않아도 되게(어차피 같은 값이라 상관은 없지만 파일 mtime 등 불필요한 변경 방지).
            label: `.env 존재 보장 (+ 없으면 CODE_SERVER_PASSWORD=${FIXED_PASSWORD} 기록, 있으면 그대로 유지)`,
            cmd: `mkdir -p $(dirname ${REMOTE_CS_ENV_FILE}) && ` +
              `if [ ! -f ${REMOTE_CS_ENV_FILE} ]; then ` +
              `echo "CODE_SERVER_PASSWORD=${FIXED_PASSWORD}" > ${REMOTE_CS_ENV_FILE}; ` +
              `echo '  ↪ .env 신규 생성 — 비밀번호: ${FIXED_PASSWORD} (요청사항에 따른 고정값)'; ` +
              `else echo '  ↪ 기존 .env 유지'; fi`,
          },
          {
            // 2026-09-06 재구조화(ecBeRedis)와 같은 이유·같은 우회 — 이 NAS의 Docker 24.0.2는
            // `docker compose --env-file` 플래그를 모른다("unknown flag", 실측 확인). env/ 파일을
            // 가리키는 심볼릭 링크로 compose 의 "같은 폴더 .env 자동탐색"을 그대로 속인다.
            label: `.env 심볼릭 링크 생성 (env/ecCodeServer${INSTANCE}.env → 이 폴더의 .env)`,
            cmd: `ln -sf ${REMOTE_CS_ENV_FILE} ${REMOTE_CS_DIR}/.env && ls -la ${REMOTE_CS_DIR}/.env`,
          },
          { label: 'code-server 이미지 pull(최초 1회만 실제로 받아옴)', cmd: `cd ${REMOTE_CS_DIR} && ${DOCKER} compose pull` },
          { label: '컨테이너 기동/갱신 (+ 옛 구성 정리)', cmd: `cd ${REMOTE_CS_DIR} && ${DOCKER} compose up -d --force-recreate --remove-orphans` },
          { label: '5초 대기 후 상태 확인', cmd: `sleep 5 && cd ${REMOTE_CS_DIR} && ${DOCKER} compose ps` },
        ],
        TAG
      );
    } finally {
      fs.rmSync(renderedPath, { force: true });
    }

    // ⚠️ 2026-09-07 정정 — 애초에 "code-server 8443은 자체서명 HTTPS로 서빙한다"고 가정하고
    // 짰던 게 틀렸다. 실측(컨테이너 로그 직접 확인): linuxserver/code-server 4.135.0은
    // "Not serving HTTPS" 로 명시하고 순수 HTTP로 서빙한다 — https:// 로 접속하면
    // TLS ClientHello를 일반 HTTP 서버가 받아 "SSL routines::wrong version number"로
    // 깨진다(사용자가 겪은 ERR_SSL_PROTOCOL_ERROR 의 원인). UI/HTTP/DEV 전부 http:// 가 맞다
    // (다른 5개 shopjoy 앱과 동일한 형태 — 이 프로젝트에 순수 HTTPS-only 백엔드는 없다).
    const directUrl = `http://${PUBLIC_HOST}:${PORT_UI}`;
    const subdomainUrl = `https://${PORT_UI}.${PUBLIC_HOST}`;
    const httpPreviewUrl = `http://${PUBLIC_HOST}:${PORT_HTTP}`;
    const devPreviewUrl = `http://${PUBLIC_HOST}:${PORT_DEV}`;
    // UI는 컨테이너가 막 뜬 직후엔 아직 리스너 초기화 전일 수 있어(실측: 5초 후 점검 시
    // ECONNRESET) 200/300번대가 나올 때까지 최대 30초 재시도. HTTP/DEV 미리보기 포트는
    // 원래 비어있는 게 정상이라 즉시 1회만 점검한다.
    const directStatus = await waitForUp(directUrl);
    const directBadge = /^[23]\d\d$/.test(directStatus) ? `✅ ${directStatus}` : `❌ ${directStatus}`;
    const [httpBadge, devBadge] = await checkUrlStatusBadges([httpPreviewUrl, devPreviewUrl]);

    // 2026-09-07(요청사항: "완료 메시지 전에 접속 http, https url 정보 제시해줘") — URL 정보를
    // [완료] 배너보다 먼저 보여준다.
    console.log(`${TAG}   UI 접속(직접 포트, http — 지금 바로 됨) : ${directUrl}  ${directBadge}`);
    console.log(`${TAG}   UI 접속(DSM 서브도메인, https — 경고 없이 깔끔하게 쓰려면 별도 1회 등록 필요) : ${subdomainUrl}`);
    console.log(`${TAG}     ↪ DSM 제어판 > 로그인 포털 > 고급 > 역방향 프록시에서 소스(HTTPS, ${PORT_UI}.${PUBLIC_HOST}) →`);
    console.log(`${TAG}       대상(HTTP, localhost:${PORT_UI}) 규칙 추가 — 다른 5개 앱과 동일하게 백엔드는 HTTP.`);
    console.log(`${TAG}   HTTP 미리보기(인스턴스 안에서 80번으로 뭔가 띄웠을 때) : ${httpPreviewUrl}  ${httpBadge}  ← 아무것도 안 띄웠으면 ❌가 정상`);
    console.log(`${TAG}   DEV서버 미리보기(인스턴스 안에서 3000번으로 뭔가 띄웠을 때) : ${devPreviewUrl}  ${devBadge}  ← 아무것도 안 띄웠으면 ❌가 정상`);
    console.log(`${TAG}   비밀번호: ${FIXED_PASSWORD} (요청사항에 따른 고정값 — 5개 인스턴스 공통)`);
    console.log(`${TAG}   ⚠ 비밀번호가 "1"이고 포트가 외부에 열려있으면 이 NAS 전체에 대한 원격 셸 접근권이나 마찬가지입니다 — 공유기/방화벽에서 외부 접근을 막아두는 걸 권장합니다.`);
    console.log(`${TAG}   ⚠ 이 인스턴스 안에서 작업 중일 땐 절대 이 스크립트를 다시 돌리지 마세요(자기 세션이 끊깁니다).`);
    console.log(`\n${TAG}[완료] code-server #${INSTANCE}번 배포 끝 (총 소요 ${fmtElapsed()})`);

    await notifyDeployResult({
      tag: TAG, logFilePath: LOG_FILE_PATH, scriptName: `ecCodeServer${INSTANCE}`, success: true, elapsed: fmtElapsed(),
      detail: `배포 완료 — 비밀번호는 고정값(${FIXED_PASSWORD}). 외부 노출 시 위험하니 방화벽으로 접근 제한 권장`,
      serverInfo: [
        { label: 'NAS 호스트', value: `illeesam.synology.me (Synology DS920+, SSH 10022)` },
        { label: '인스턴스 번호', value: `#${INSTANCE} (1~5 중)` },
        { label: '설치 경로', value: REMOTE_CS_DIR },
        { label: '영구 데이터 경로', value: `${REMOTE_CS_DATA_DIR} (git workspace + VS Code 설정/확장 보존, 인스턴스별 완전 격리)` },
        { label: '컨테이너명', value: `${CONTAINER_NAME} (이미지 lscr.io/linuxserver/code-server:latest)` },
        { label: '비밀번호', value: `${FIXED_PASSWORD} (고정값 — env/ecCodeServer${INSTANCE}.env 에 저장, 저장소엔 커밋 안 됨)` },
        { label: '주의', value: `이 도구는 zmulti 대상 아님 — codeserver/ 에서 항상 npm run deploy${INSTANCE} 단독 실행` },
      ],
      checkUrls: [
        { url: directUrl, note: `UI 접속(code-server 본체) #${INSTANCE}번 — 직접 포트(http)` },
        { url: subdomainUrl, note: `UI 접속 — DSM 서브도메인(별도 1회 등록 전까지는 접속 안 됨, 위 로그 등록 방법 참조)` },
        { url: httpPreviewUrl, note: `HTTP 미리보기 — 인스턴스 안에서 80번 포트로 뭔가 띄웠을 때만 응답(평소엔 무응답이 정상)` },
        { url: devPreviewUrl, note: `DEV서버 미리보기 — 인스턴스 안에서 3000번 포트로 뭔가 띄웠을 때만 응답(평소엔 무응답이 정상)` },
      ],
      npmScript: NPM_SCRIPT_NAME,
    });
    console.log(`${TAG} ◀ 완료`);
  } catch (e) {
    console.error(`\n${TAG}[실패] ❌ 배포 실패 (경과 ${fmtElapsed()}): ${e.message}`);
    await notifyDeployResult({
      tag: TAG, logFilePath: LOG_FILE_PATH, scriptName: `ecCodeServer${INSTANCE}`, success: false, elapsed: fmtElapsed(),
      detail: `오류: ${e.message}`,
      serverInfo: [], checkUrls: [],
      npmScript: NPM_SCRIPT_NAME,
    });
    process.exit(1);
  }
})();
