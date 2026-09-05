/* deploy-dev-synol-fe-ecFeBo.js — 내 컴퓨터에서 직접 SSH로 프론트(FO/BO 화면)를 Synology NAS(dev)에
 * 빌드+전송까지 한 번에. GitHub Actions 를 거치지 않는다(그쪽은 package.json 의
 * deploy:dev-github-ecBeBo/-fe/-full 참조 — git push 로 GitHub 서버가 대신 빌드+배포, GitHub Pages 도 같이 됨).
 * 백엔드는 별도 deploy-dev-synol-be-ecBeBo.js(= cd deploy && npm run ecBeBo).
 * (2026-09-06: 예전엔 deploy:dev-synol-full 이 백엔드+프론트를 묶었으나, npm run zmulti-ecBeBo-ecBeCdn
 * 로 이름/조합이 바뀌면서 프론트는 이제 어떤 조합 명령에도 안 묶여있다 — 필요하면 이 스크립트를 따로 실행할 것.)
 *
 * 2026-09-06 추가 개편(요청사항: "4개 앱이 각자 다른 호스팅사에 흩어질 수도 있다"는 최악의 경우
 * 기준 설계) — 이 nginx(ecFeBo)는 apps/ecBeBo/docker-compose.yml 에 얹혀있던 것에서 완전히
 * 독립된 자체 compose 스택(apps/ecFeBo/docker-compose.yml)이 되었다. 지금까지 이 스크립트는
 * dist/ 정적 파일만 올렸는데, 이제 그 nginx 컨테이너 자체의 기동/갱신까지 이 스크립트가
 * 책임진다(compose/nginx 설정 3종 업로드 + docker compose up). 포트도 21000 → 22000.
 * nginx가 더 이상 /api,/cdn-admin 을 리버스프록시하지 않으므로 그 헬스체크도 제거 — 이제
 * index.html/bo.html 정적 서빙만 확인한다.
 *
 * 사용법: apps/scripts_deploy_illeesam_synol/deploy/ 에서 npm run ecFeBo
 *          (또는 루트에서 npm run ecFeBo --workspace=deploy)
 * NAS 접속정보는 apps/scripts_deploy_illeesam_synol/.synology-deploy.env 필요 — 형식은 ../synology-deploy-util.js 상단 주석 참조.
 *
 * 무엇을 하는지는 apps/ecBeBo/_doc/12_illeesam_synology_FE_수동배포가이드(synology).md 의
 * STEP 1~4 와 완전히 동일한 절차를 그대로 스크립트로 옮긴 것뿐이다.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { ROOT, run, withSsh, requireCreds, hms, LOG_FILE_PATH, checkUrlStatusBadges } = require('../synology-deploy-util');
const { notifyDeployResult } = require('../notify-deploy-result');

requireCreds('scripts/deploy-dev-synol-fe-ecFeBo.js');

// ROOT(synology-deploy-util.js 기준) = apps/ (2026-09-06: apps/ecFeBo/scripts/ 에서 apps/scripts_deploy_illeesam_synol/
// 로 독립). 실제 빌드(npm run build/package.json/dist)는 형제 폴더 apps/ecFeBo 안에서 돌아가야
// 하므로 npm/tar 명령의 cwd 는 항상 feDir 로 지정한다(ROOT 를 그대로 쓰면 apps/ 에서 실행돼
// package.json 을 못 찾는다).
const feDir = path.join(ROOT, 'ecFeBo');
const DOCKER = '/usr/local/bin/docker';
// 2026-09-06: 정적 파일(dist/) 배포 폴더와 compose/nginx 설정 폴더를 분리 — 전자는 매 배포마다
// 통째로 rm -rf 되므로, 같이 두면 docker-compose.yml 자체가 다음 배포 때 지워진다
// (apps/ecFeBo/docker-compose.yml 상단 주석 참조).
const REMOTE_FRONTEND_DIR = '/volume1/docker/shopjoy/ecFeBo';           // 정적 파일(dist/)만
const REMOTE_FRONTEND_APP_DIR = '/volume1/docker/shopjoy/ecFeBoApp';    // docker-compose.yml + nginx 설정
const REMOTE_SHOPJOY_DIR = '/volume1/docker/shopjoy';
const CONTAINER_NAME = 'shopjoy-ecFeBo-22000';
const PUBLIC_PORT = 22000;
const PUBLIC_HOST = 'illeesam.synology.me';
// 2026-09-06: DSM 리버스 프록시 서브도메인(HTTPS) — 21000.illeesam.synology.me 와 같은 방식으로
// 22000.illeesam.synology.me 를 DSM 콘솔에 등록 완료(13번 문서 절차, curl 실측 200 확인).
// CorsOriginPolicy.java 의 "*.illeesam.synology.me" 패턴은 신규 서브도메인도 자동 허용.
const PUBLIC_HTTPS_HOST = '22000.illeesam.synology.me';
// ecGateway(22099, 테스트 전용) 경유 예시도 같이 보여준다(요청사항: "각로그에는 gateway 접속
// URL 예제도 제시해줘") — 이 정적 파일들은 ecGateway 자기 root 에서도 그대로 서빙된다.
const GW = `${PUBLIC_HOST}:22099`;
const GW_HTTPS = `22099.${PUBLIC_HOST}`;
// 이 스크립트는 항상 dev NAS 대상 + dev 프로파일로 빌드한다(build-minify.js 의 --profile=dev,
// npm run build:dev 와 동일) — local/prod 빌드가 필요하면 npm run build:local/build:prod 를
// 직접 쓰거나(로컬 확인용) GitHub Actions 배포(deploy:dev-github-*)를 사용할 것.
const BUILD_PROFILE = 'dev';

// 배포 후 헬스체크(외부 HTTPS, 이 컴퓨터 → NAS) — 실제 사용자가 브라우저로 접속하는 경로와
// 동일하게 확인한다. NAS 내부(localhost:22000, withSsh 단계)만 200이고 이 바깥쪽 체크가
// 실패하면 nginx 는 정상인데 DSM 리버스 프록시/인증서 쪽 문제일 가능성이 높다(13번 문서 참조).
function checkUrl(pathname) {
  return new Promise((resolve) => {
    const req = require('https').get({ hostname: PUBLIC_HTTPS_HOST, path: pathname, timeout: 10000 }, (res) => {
      res.resume(); // 응답 바디는 안 쓰므로 그냥 흘려보내 소켓을 빨리 반환
      resolve(String(res.statusCode));
    });
    req.on('timeout', () => { req.destroy(); resolve('timeout'); });
    req.on('error', (e) => resolve(`error(${e.code || e.message})`));
  });
}

// 2026-09-05: 모든 로그 줄 앞에 "이 스크립트+대상(FE)"을 밝히는 태그 — 여러 스크립트가
// (예: npm run zmulti-* 류) 순서대로 도는 경우 지금 이 줄이 어디서 나온 건지 바로 구분하기 위함.
// 2026-09-06: toString() 을 커스텀해서 `${TAG}` 로 보간될 때마다 그 순간의 [HH:MM:SS] 시각을
// 새로 계산해 넣는다(요청사항).
const TAG = { toString() { return `[${hms()}][deploy-dev-synol-fe-ecFeBo.js][FE]`; } };
const step = (n) => `${TAG}[${String(n).padStart(2, '0')}]`;

// 2026-09-05: 스크립트 전체(빌드~헬스체크까지) 소요시간을 마지막에 보여주기 위한 시작시각.
const startedAt = Date.now();
function fmtElapsed() {
  const sec = Math.round((Date.now() - startedAt) / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

(async () => {
  try {
    console.log(`${TAG} ▶ 시작 : 프론트(FO/BO 화면) ${BUILD_PROFILE} 프로파일 빌드 + NAS 전송 + nginx 재기동 (배포 대상: dev NAS)\n`);

    console.log(`${step(1)} ${BUILD_PROFILE} 프로파일로 빌드`);
    await run(`npm run build:${BUILD_PROFILE}`, feDir, TAG);

    console.log(`\n${step(2)} dist/ 압축`);
    const tarPath = path.join(feDir, 'dist.tar.gz');
    await run(`tar -czf dist.tar.gz -C dist .`, feDir, TAG);
    console.log(`${TAG}   결과: ✅ dist.tar.gz (${(fs.statSync(tarPath).size / 1024 / 1024).toFixed(1)}MB)`);

    // 2026-09-06: nginx 설정 3종(compose 파일이 있는 ecFeBoApp/ 로 업로드 — dist/ 와 분리)도
    // 매번 함께 올려 리포=NAS 상태를 일치시킨다(내용이 같으면 덮어써도 무해).
    const configUploads = ['docker-compose.yml', 'nginx.conf', 'locations.conf', 'security-headers.conf']
      .map((f) => ({ local: path.join(feDir, f), remote: `${REMOTE_FRONTEND_APP_DIR}/${f}` }));

    await withSsh(
      [{ local: tarPath, remote: `${REMOTE_SHOPJOY_DIR}/dist.tar.gz` }, ...configUploads],
      [
        {
          label: '기존 정적 파일 삭제 후 압축 해제',
          cmd:
            // 2026-09-05: frontend/ 폴더가 수동 삭제 등으로 아예 없어져 있으면 "rm -rf .../*"가
            // glob 매칭 실패로 에러 나므로, mkdir -p 로 폴더 존재부터 보장(이미 있으면 무해).
            `mkdir -p ${REMOTE_FRONTEND_DIR} && ` +
            `rm -rf ${REMOTE_FRONTEND_DIR}/* && ` +
            `tar -xzf ${REMOTE_SHOPJOY_DIR}/dist.tar.gz -C ${REMOTE_FRONTEND_DIR} && ` +
            `rm -f ${REMOTE_SHOPJOY_DIR}/dist.tar.gz`,
        },
        { label: '결과 확인', cmd: `ls -la ${REMOTE_FRONTEND_DIR} | head -10` },
        {
          // 2026-09-06: nginx가 이제 완전히 독립된 컴포즈 스택 — 매 배포마다 up -d 로 기동/갱신.
          // 설정 파일(nginx.conf 등) 내용이 바뀌었으면 --force-recreate 가 자동으로 컨테이너를
          // 다시 만든다(compose 가 서비스 정의 변경을 감지).
          label: 'nginx(ecFeBo) 컨테이너 기동/갱신',
          cmd: `cd ${REMOTE_FRONTEND_APP_DIR} && ${DOCKER} compose up -d --force-recreate --remove-orphans`,
        },
        {
          label: '헬스체크 1/2 (NAS 내부, nginx가 새 파일을 실제로 서빙하는지 — localhost 기준)',
          cmd:
            `echo "  index.html: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:${PUBLIC_PORT}/index.html)"; ` +
            `echo "  bo.html   : $(curl -s -o /dev/null -w '%{http_code}' http://localhost:${PUBLIC_PORT}/bo.html)"`,
        },
        { label: '컨테이너 상태 확인', cmd: `${DOCKER} ps --filter name=${CONTAINER_NAME}` },
      ],
      TAG
    );

    fs.rmSync(tarPath, { force: true });

    console.log(`\n${step(3)} 헬스체크 2/2 — 외부 HTTPS 접속 확인 (이 컴퓨터 → https://${PUBLIC_HTTPS_HOST})`);
    // 2026-09-06: nginx가 더 이상 /api 를 리버스프록시하지 않으므로(완전 분리 설계) 백엔드
    // API 헬스체크는 여기서 뺀다 — 백엔드 자체 헬스체크는 deploy/ 의 npm run ecBeBo 가 담당.
    const [idxStatus, boStatus] = await Promise.all([
      checkUrl('/index.html'),
      checkUrl('/bo.html'),
    ]);
    console.log(`${TAG}   index.html : ${idxStatus}`);
    console.log(`${TAG}   bo.html    : ${boStatus}`);

    const allOk = idxStatus === '200' && boStatus === '200';
    if (allOk) {
      console.log(`${TAG}   ✅ 헬스체크 통과 — 프론트 정적 파일 서빙 정상`);
    } else {
      console.log(`${TAG}   ⚠ 200이 아닌 응답이 있습니다 — 배포 자체는 끝났지만 접속 경로에 문제가 있을 수 있습니다.`);
      console.log(`${TAG}     위 [헬스체크 1/2] 로그, DSM 리버스 프록시(22000 서브도메인 등록 여부) 확인 — 12번 문서 참조`);
    }

    // 2026-09-06(요청사항: "우측에 결과정보 표시해줄수 있어? ✅ 200 이런식이지") — 아래 나열할
    // URL들을 실제로 curl 체크해서 오른쪽에 상태 배지를 붙인다.
    const completionUrls = [
      `http://${PUBLIC_HOST}:${PUBLIC_PORT}/index.html`,
      `http://${PUBLIC_HOST}:${PUBLIC_PORT}/bo.html`,
      `https://${PUBLIC_HTTPS_HOST}/index.html`,
      `https://${PUBLIC_HTTPS_HOST}/bo.html`,
      `http://${GW}/index.html`,
      `http://${GW}/bo.html`,
      `https://${GW_HTTPS}/index.html`,
      `https://${GW_HTTPS}/bo.html`,
    ];
    const completionBadges = await checkUrlStatusBadges(completionUrls);
    const completionWidth = Math.max(...completionUrls.map((u) => u.length));
    const withBadge = (i) => `${completionUrls[i].padEnd(completionWidth)}  ${completionBadges[i]}`;

    console.log(`\n${TAG}[완료] 프론트 배포 끝 (총 소요 ${fmtElapsed()})${allOk ? ' (헬스체크 정상)' : ' (헬스체크 이상 있음 — 위 내용 확인)'}`);
    console.log(`${TAG}   HTTP  : ${withBadge(0)}`);
    console.log(`${TAG}   HTTP  : ${withBadge(1)}`);
    console.log(`${TAG}   HTTPS : ${withBadge(2)}`);
    console.log(`${TAG}   HTTPS : ${withBadge(3)}  (로그인은 이쪽 필수)`);
    console.log(`${TAG}   게이트웨이(22099) 경유 예시 — ecBeBo/ecBeCdn/ecFeBo 가 이 NAS에 같이 떠 있을 때만:`);
    console.log(`${TAG}     ${withBadge(4)}`);
    console.log(`${TAG}     ${withBadge(5)}`);
    console.log(`${TAG}     ${withBadge(6)}`);
    console.log(`${TAG}     ${withBadge(7)}`);
    console.log(`${TAG}   ⚠ 백엔드/CDN API 호출은 이제 이 nginx를 안 거치고 각자의 절대 URL로 직접 나간다 —`);
    console.log(`${TAG}     apps/ecFeBo/lib/env/profiles/{bo,fo}EnvConsts.dev.js 의 baseApiHost/cdnApiHost 참조.`);
    // 점검 안내 + 서버/환경 정보(요청사항: "배포메일 보낼때 내용에 점검 안내도 같이 보내줘" /
    // "서버정보 및 설치 경로정보도 추가해줘" / "주요 환경정보도 있으면 좋겠어"). 완전 분리
    // 설계 전환 후엔 이 nginx가 정적 파일만 다루므로 점검 URL 도 그에 맞춰 축소.
    const checkUrls = [
      { url: `https://${PUBLIC_HTTPS_HOST}/index.html`, note: '사용자(FO) 메인 화면' },
      { url: `https://${PUBLIC_HTTPS_HOST}/bo.html`, note: '관리자(BO) 메인 화면(로그인 필요)' },
      { url: `https://${PUBLIC_HTTPS_HOST}/assets/cdn/pkg/vue/3.4.21/vue.global.prod.js`, note: '로컬 CDN 패키지(Vue) 정적서빙 확인' },
      { url: `http://${GW}/index.html`, note: '사용자(FO) 메인 화면(게이트웨이 22099 경유, HTTP)' },
      { url: `https://${GW_HTTPS}/bo.html`, note: '관리자(BO) 메인 화면(게이트웨이 22099 경유, HTTPS)' },
    ];
    const serverInfo = [
      { label: 'NAS 호스트', value: `illeesam.synology.me (SSH 10022 / 공개 포트 ${PUBLIC_PORT})` },
      { label: '정적 파일 경로', value: REMOTE_FRONTEND_DIR },
      { label: 'compose/설정 경로', value: REMOTE_FRONTEND_APP_DIR },
      { label: '서빙 방식', value: `${CONTAINER_NAME} 컨테이너가 정적 파일만 직접 서빙 (2026-09-06 완전 분리 설계 — 백엔드/CDN 프록시 없음)` },
      { label: '빌드 프로파일', value: `${BUILD_PROFILE} (npm run build:${BUILD_PROFILE})` },
      { label: '공개 도메인', value: `https://${PUBLIC_HTTPS_HOST}` },
    ];
    await notifyDeployResult({
      tag: TAG, logFilePath: LOG_FILE_PATH, scriptName: 'ecFeBo', success: allOk, elapsed: fmtElapsed(),
      detail: allOk ? '헬스체크 정상' : `헬스체크 이상 있음: index.html=${idxStatus} bo.html=${boStatus}`,
      serverInfo,
      checkUrls,
      npmScript: 'deploy/ecFeBo',
    });
    console.log(`${TAG} ◀ 완료`);
  } catch (e) {
    console.error(`\n${TAG}[실패] ❌ 배포 실패 (경과 ${fmtElapsed()}): ${e.message}`);
    await notifyDeployResult({
      tag: TAG, logFilePath: LOG_FILE_PATH, scriptName: 'ecFeBo', success: false, elapsed: fmtElapsed(),
      detail: `오류: ${e.message}`,
      serverInfo: [
        { label: 'NAS 호스트', value: `illeesam.synology.me (SSH 10022 / 공개 포트 ${PUBLIC_PORT})` },
        { label: '정적 파일 경로', value: REMOTE_FRONTEND_DIR },
        { label: 'compose/설정 경로', value: REMOTE_FRONTEND_APP_DIR },
      ],
      checkUrls: [
        { url: `https://${PUBLIC_HTTPS_HOST}/index.html`, note: '사용자(FO) 메인 화면(정상화 후 재확인)' },
        { url: `https://${PUBLIC_HTTPS_HOST}/bo.html`, note: '관리자(BO) 메인 화면(정상화 후 재확인)' },
      ],
      npmScript: 'deploy/ecFeBo',
    });
    process.exit(1);
  }
})();
