/* deploy-dev-synol-cs-ecCodeServer.js — Synology DS920+ NAS(dev)에 브라우저용 VS Code
 * (linuxserver/code-server) 인스턴스를 1~5번 중 원하는 번호로 (재)배포한다.
 * 같은 폴더의 docker-compose.yml 은 __CS_INSTANCE__/__CS_PORT__ 자리표시자가 있는 템플릿이고,
 * 이 스크립트가 실행 시 받은 인스턴스 번호로 실제 값을 치환한 사본을 NAS의 인스턴스 전용
 * 폴더(/volume1/docker/shopjoy/apps/ecCodeServer{N}/)에 올린다 — ecBeGateway/ecBeRedis 와
 * 같은 패턴(공식 이미지 그대로 pull, Gradle/npm 빌드 없음).
 * ⚠️ 이 템플릿은 apps/ 밑에 두지 않는다(요청사항: "apps 는 순수 앱 모음이라") — apps/ 는
 * shopjoy 5개 실제 앱(ecBeBo/ecBeCdn/ecFeBo/ecBeRedis/ecBeGateway) 전용, code-server는
 * 그 앱들과 무관한 개발도구라 이 배포 스크립트와 같은 codeserver/ 폴더에 같이 둔다.
 *
 * 2026-09-07 신설 → 같은 날 개편(요청사항: "codeserver 1,2,3,4,5 5개를 만들수 있게 구성해줘
 * 중지도 삭제도" + "포트는 22911 22912 22913 22914 22915") — 인스턴스 1개 고정에서
 * 1~5번 독립 인스턴스 체계로 전환. 포트 규칙: 22910 + 인스턴스번호.
 *
 * ⚠️ 최초 배포 시에만 이 스크립트가 NAS에서 강한 난수 비밀번호를 직접 생성해
 * env/ecCodeServer{N}.env 에 저장한다(이미 있으면 절대 덮어쓰지 않음 — 매 배포마다
 * 비밀번호가 바뀌면 로그인이 끊기므로). 그 비밀번호는 배포 로그/이메일에 한 번 그대로
 * 표시되니, 최초 배포 직후 반드시 어딘가에 옮겨 적어둘 것 — 다시 보여주지 않는다.
 *
 * 2026-09-07 재배치 — deploy/stop/delete/ps(5개 shopjoy 앱 전용) 워크스페이스와 섞이지 않게
 * 이 파일 전용 워크스페이스 codeserver/ 로 분리(요청사항: "codeserver 폴더로 만들어줘").
 *
 * 사용법: scripts/scripts_deploy_illeesam_synol/codeserver/ 에서 npm run deploy1 (~deploy5)
 *          (또는 루트에서 npm run deploy1 --workspace=codeserver)
 * NAS 접속정보는 scripts/scripts_deploy_illeesam_synol/.synology-deploy.env 필요 — 형식은 ../synology-deploy-util.js 상단 주석 참조.
 *
 * ⚠️ 의도적으로 zmulti 류 일괄 명령을 두지 않는다 — 지금 어느 인스턴스 안에서 작업 중일 때
 * 자기 자신의 컨테이너를 재기동시키면 그 순간 자기 터미널/에디터 세션이 끊긴다. 항상 단독
 * 실행할 것(예: npm run deploy3).
 */
const fs = require('fs');
const path = require('path');
const { requireCreds, withSsh, hms, LOG_FILE_PATH, checkUrlStatusBadges } = require('../synology-deploy-util');
const { notifyDeployResult } = require('../notify-deploy-result');

const INSTANCE = Number(process.argv[2]);
if (!Number.isInteger(INSTANCE) || INSTANCE < 1 || INSTANCE > 5) {
  console.error('사용법: node deploy-dev-synol-cs-ecCodeServer.js <1~5>  (codeserver/ 에서 npm run deploy1 ~ deploy5 로 실행할 것)');
  process.exit(1);
}

requireCreds('deploy-dev-synol-cs-ecCodeServer.js');

const DOCKER = '/usr/local/bin/docker';
// 포트 규칙(요청사항: "포트는 22911 22912 22913 22914 22915") — 22910 + 인스턴스번호
// → 1번=22911 ... 5번=22915.
const PUBLIC_PORT = 22910 + INSTANCE;
const REMOTE_CS_DIR = `/volume1/docker/shopjoy/apps/ecCodeServer${INSTANCE}`;
const REMOTE_CS_DATA_DIR = `/volume1/docker/shopjoy/data/ecCodeServer${INSTANCE}Config`;
const REMOTE_CS_ENV_FILE = `/volume1/docker/shopjoy/env/ecCodeServer${INSTANCE}.env`;
const CONTAINER_NAME = `shopjoy-ecCodeServer${INSTANCE}-${PUBLIC_PORT}`;
const PUBLIC_HOST = 'illeesam.synology.me';

const TAG = { toString() { return `[${hms()}][deploy-dev-synol-cs-ecCodeServer.js][CS${INSTANCE}]`; } };
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
    console.log(`${TAG} ▶ 시작 : code-server(브라우저용 VS Code) #${INSTANCE}번 인스턴스 compose 배포 (포트 ${PUBLIC_PORT}, 배포 대상: DS920+ dev NAS, 빌드 단계 없음)\n`);

    // 템플릿 원본이 apps/ 가 아니라 이 스크립트와 같은 폴더(codeserver/)에 있다 — apps/ 는
    // shopjoy 실제 앱 전용이라 이 개발도구는 거기 안 둠(요청사항).
    const csDir = __dirname;
    const templatePath = path.join(csDir, 'docker-compose.yml');
    const template = fs.readFileSync(templatePath, 'utf8');
    // 자리표시자 치환 — 여러 번 나오므로 replaceAll(compose 안에 __CS_INSTANCE__/__CS_PORT__
    // 가 각각 2곳씩 있음: container_name/volumes, environment 코멘트/ports).
    const rendered = template
      .replaceAll('__CS_INSTANCE__', String(INSTANCE))
      .replaceAll('__CS_PORT__', String(PUBLIC_PORT));
    // 렌더링 결과를 임시 파일로 저장했다가 업로드 — withSsh() 업로드 목록은 local 파일 경로가
    // 필요해서, 원본 템플릿을 그대로 올릴 수 없다(치환 전 __CS_INSTANCE__ 문자 그대로 올라가면
    // compose가 그 리터럴 문자열을 컨테이너/포트 이름으로 그대로 써버린다).
    const renderedPath = path.join(csDir, `.docker-compose.rendered.${INSTANCE}.yml`);
    fs.writeFileSync(renderedPath, rendered, 'utf8');

    console.log(`${step(1)} 설정 파일 전송(#${INSTANCE}번 인스턴스 렌더링본) + 볼륨/비밀번호 준비 + 컨테이너 기동`);
    try {
      await withSsh(
        [{ local: renderedPath, remote: `${REMOTE_CS_DIR}/docker-compose.yml` }],
        [
          { label: '데이터 폴더 존재 보장(/config 영구 보존)', cmd: `mkdir -p ${REMOTE_CS_DATA_DIR}` },
          {
            // ecBeRedis와 같은 "존재 보장 + 없으면만 생성" 원칙이되, 이 도구는 셸 접근권 자체라
            // 고정 기본값(redis123 같은) 대신 매번 새로 강한 난수를 생성한다. openssl 이 NAS에
            // 기본 설치돼 있어 별도 패키지 설치 없이 바로 쓸 수 있다.
            label: '.env 존재 보장 (+ 없으면 CODE_SERVER_PASSWORD 난수 생성, 있으면 그대로 유지)',
            cmd: `mkdir -p $(dirname ${REMOTE_CS_ENV_FILE}) && ` +
              `if [ ! -f ${REMOTE_CS_ENV_FILE} ]; then ` +
              `NEWPW=$(openssl rand -base64 18); ` +
              `echo "CODE_SERVER_PASSWORD=$NEWPW" > ${REMOTE_CS_ENV_FILE}; ` +
              `echo "  ↪ .env 신규 생성 — #${INSTANCE}번 최초 비밀번호: $NEWPW  (반드시 지금 옮겨 적어두세요! 다시 안 보여줍니다)"; ` +
              `else echo '  ↪ 기존 .env 유지 (비밀번호 변경 없음)'; fi`,
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

    // 2026-09-07(요청사항: "codeserver deploy 하면 http, https url 정보 제시해줘") — code-server는
    // 다른 5개 앱과 달리 컨테이너 자체가 8443을 HTTPS(자체서명 인증서)로만 서빙한다 — 이
    // 포트로 평범한 http:// 요청을 보내면 TLS 핸드셰이크가 아니라서 접속 자체가 실패한다
    // (실측: curl 로 http/https 둘 다 시도해 확인). 그래서 "http URL"은 존재하지 않는 게
    // 맞고, 대신 두 가지 HTTPS 형태를 보여준다: 지금 바로 되는 직접 포트(자체서명 경고 있음)
    // + DSM에 서브도메인을 등록하면 되는 깔끔한 형태(경고 없음, 별도 1회 등록 필요).
    const directUrl = `https://${PUBLIC_HOST}:${PUBLIC_PORT}`;
    const subdomainUrl = `https://${PUBLIC_PORT}.${PUBLIC_HOST}`;
    const [directBadge] = await checkUrlStatusBadges([directUrl]);

    console.log(`\n${TAG}[완료] code-server #${INSTANCE}번 배포 끝 (총 소요 ${fmtElapsed()})`);
    console.log(`${TAG}   접속(직접 포트, 지금 바로 됨 — 자체서명 인증서 경고는 무시) : ${directUrl}  ${directBadge}`);
    console.log(`${TAG}   접속(DSM 서브도메인, 경고 없이 깔끔하게 쓰려면 별도 1회 등록 필요) : ${subdomainUrl}`);
    console.log(`${TAG}     ↪ DSM 제어판 > 로그인 포털 > 고급 > 역방향 프록시에서 소스(HTTPS, ${PUBLIC_PORT}.${PUBLIC_HOST}) →`);
    console.log(`${TAG}       대상(HTTPS, localhost:${PUBLIC_PORT}) 규칙 추가 + "인증서 신뢰 안 함 허용" 체크 필요(다른 앱들과 달리 백엔드 자체가 HTTPS라 프로토콜을 HTTP가 아닌 HTTPS로 잡아야 함).`);
    console.log(`${TAG}   ⚠ 이 컨테이너는 http:// 를 지원하지 않는다 — https:// 로만 접속할 것.`);
    console.log(`${TAG}   ⚠ 최초 배포였다면 위 로그의 "최초 비밀번호" 줄을 지금 옮겨 적어두세요 — 다시 표시되지 않습니다.`);
    console.log(`${TAG}   ⚠ 이 인스턴스 안에서 작업 중일 땐 절대 이 스크립트를 다시 돌리지 마세요(자기 세션이 끊깁니다).`);

    await notifyDeployResult({
      tag: TAG, logFilePath: LOG_FILE_PATH, scriptName: `ecCodeServer${INSTANCE}`, success: true, elapsed: fmtElapsed(),
      detail: '배포 완료 — 최초 배포였다면 콘솔 로그의 임시 비밀번호를 반드시 확인/보관할 것(재표시 안 됨)',
      serverInfo: [
        { label: 'NAS 호스트', value: `illeesam.synology.me (Synology DS920+, SSH 10022 / 포트 ${PUBLIC_PORT})` },
        { label: '인스턴스 번호', value: `#${INSTANCE} (1~5 중)` },
        { label: '설치 경로', value: REMOTE_CS_DIR },
        { label: '영구 데이터 경로', value: `${REMOTE_CS_DATA_DIR} (git workspace + VS Code 설정/확장 보존, 인스턴스별 완전 격리)` },
        { label: '컨테이너명', value: `${CONTAINER_NAME} (이미지 lscr.io/linuxserver/code-server:latest)` },
        { label: '비밀번호 파일(NAS 전용)', value: `${REMOTE_CS_ENV_FILE} — 저장소엔 절대 커밋 안 됨, SSH로 직접 확인` },
        { label: '주의', value: `이 도구는 zmulti 대상 아님 — codeserver/ 에서 항상 npm run deploy${INSTANCE} 단독 실행` },
      ],
      checkUrls: [
        { url: directUrl, note: `브라우저용 VS Code(code-server) #${INSTANCE}번 — 직접 포트, 자체서명 인증서 경고는 무시하고 진행` },
        { url: subdomainUrl, note: `동일 인스턴스 — DSM 서브도메인(별도 1회 등록 전까지는 접속 안 됨, 위 로그 등록 방법 참조)` },
      ],
      npmScript: `codeserver/deploy${INSTANCE}`,
    });
    console.log(`${TAG} ◀ 완료`);
  } catch (e) {
    console.error(`\n${TAG}[실패] ❌ 배포 실패 (경과 ${fmtElapsed()}): ${e.message}`);
    await notifyDeployResult({
      tag: TAG, logFilePath: LOG_FILE_PATH, scriptName: `ecCodeServer${INSTANCE}`, success: false, elapsed: fmtElapsed(),
      detail: `오류: ${e.message}`,
      serverInfo: [], checkUrls: [],
      npmScript: `codeserver/deploy${INSTANCE}`,
    });
    process.exit(1);
  }
})();
