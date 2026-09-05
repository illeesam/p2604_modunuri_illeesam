/* deploy-dev-synol-be-ecBeBo.js — 내 컴퓨터에서 직접 SSH로 백엔드(EcAdminApi)를 Synology NAS(dev)에
 * 빌드+전송+재기동까지 한 번에. GitHub Actions 를 거치지 않는다(그쪽은 package.json 의
 * deploy:dev-github-ecBeBo/-fe/-full 참조 — git push 로 GitHub 서버가 대신 빌드+배포).
 * 프론트는 별도 scripts/deploy-dev-synol-fe-ecFeBo.js(= npm run deploy:dev-synol-ecFeBo).
 * 백엔드+CDN서버 둘 다 한 번에 하려면 npm run deploy:dev-synol-zmulti-ecBeBo-ecBeCdn.
 *
 * 사용법: node scripts/deploy-dev-synol-be-ecBeBo.js   (= npm run deploy:dev-synol-ecBeBo)
 * NAS 접속정보는 scripts/.synology-deploy.env 필요 — 형식은 synology-deploy-util.js 상단 주석 참조.
 *
 * 무엇을 하는지는 apps/ecBeBo/_doc/11_illeesam_synology_BE_수동배포가이드(synology).md 의
 * STEP 1~5 와 완전히 동일한 절차를 그대로 스크립트로 옮긴 것뿐이다 — 사람이 손으로 치던
 * 명령을 그대로 자동화했다는 점이 중요: 이 스크립트가 뭘 하는지 궁금하면 그 문서를 보면 된다.
 */
const fs = require('fs');
const path = require('path');
const { ROOT, fail, requireCreds, run, withSsh, hms } = require('./synology-deploy-util');
const { notifyDeployResult } = require('./notify-deploy-result');

requireCreds('scripts/deploy-dev-synol-be-ecBeBo.js');

const DOCKER = '/usr/local/bin/docker';
const REMOTE_BE_DIR = '/volume1/docker/shopjoy/ecBeBo';

// 2026-09-05: 모든 로그 줄 앞에 "이 스크립트+대상(BE)"을 밝히는 태그 — deploy:dev-synol-zmulti-ecBeBo-ecBeCdn
// 처럼 여러 스크립트가 순서대로 도는 경우 지금 이 줄이 어디서 나온 건지 바로 구분하기 위함.
// 2026-09-06: toString() 을 커스텀해서 `${TAG}` 로 보간될 때마다 그 순간의 [HH:MM:SS] 시각을
// 새로 계산해 넣는다 — Gradle 빌드/NAS 전송처럼 오래 걸리는 단계 사이 실제 경과시간을 로그만
// 보고 바로 파악하기 위함(요청사항).
const TAG = { toString() { return `[${hms()}][deploy-dev-synol-be-ecBeBo.js][BE]`; } };
const step = (n) => `${TAG}[${String(n).padStart(2, '0')}]`;

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
    console.log(`${TAG} ▶ 시작 : 백엔드(EcAdminApi) Gradle 빌드 + NAS 전송 + Docker 재기동 (배포 대상: dev NAS)\n`);

    console.log(`${step(1)} Gradle 빌드 (clean bootJar -x test)`);
    // ROOT(synology-deploy-util.js 기준) = apps/ (2026-09-06: 이 스크립트가 apps/ecFeBo/scripts/
    // 에서 apps/scripts_deploy_illeesam_synol/ 로 독립 — 배포 스크립트가 프론트 앱 폴더 밑에 있는 게 어색하다는 지적).
    // 백엔드는 그 바로 아래 형제 폴더 apps/ecBeBo 에 있다.
    const beDir = path.join(ROOT, 'ecBeBo');
    // 상대경로/PATH 탐색에 기대지 않고 절대경로로 직접 지정 — 실행 환경(git-bash/cmd/PowerShell)에
    // 따라 "현재 폴더 실행파일 탐색" 동작이 달라 상대경로(./gradlew, gradlew.bat)가 간헐적으로
    // "찾을 수 없음" 에러를 내는 걸 봐서, 아예 절대경로로 고정한다.
    const gradlew = process.platform === 'win32'
      ? path.join(beDir, 'gradlew.bat')
      : path.join(beDir, 'gradlew');
    await run(`"${gradlew}" clean bootJar -x test`, beDir, TAG);

    const jarDir = path.join(beDir, 'build', 'libs');
    const jarFile = fs.readdirSync(jarDir).find((f) => f.endsWith('.jar') && !f.includes('plain'));
    if (!jarFile) fail('build/libs 에서 jar 파일을 못 찾았습니다 — 빌드 실패 확인 필요', TAG);
    const jarPath = path.join(jarDir, jarFile);
    console.log(`${TAG}   결과: ✅ ${jarFile} (${(fs.statSync(jarPath).size / 1024 / 1024).toFixed(1)}MB)`);

    // 헬스체크가 "healthy"로 뜨기까지 실측 40초~2분 넘게 걸릴 때도 있음(NAS CPU가 약해서
    // 편차가 큼) — docker compose ps 결과에서 ecBeBo 줄(컨테이너명 210-ecBeBo)에 "(healthy)"가
    // 보일 때까지 3초 간격 최대 100회(총 5분)까지 반복 확인. 재기동 직후엔 항상
    // "(health: starting)"이 정상이라, 이 폴링이 없으면 사람이 매번 직접 몇 번씩
    // docker compose ps 를 다시 쳐봐야 했다.
    // 2026-09-06: grep 대상을 ecadminApi → ecBeBo 로 변경(컨테이너명 210-ecadminApi → 210-ecBeBo,
    // 이미지 shopjoy/ecadminapi:latest → shopjoy/ecbebo:latest, compose 서비스명 ecadminapi → ecbebo).
    // 2026-09-05: docker compose ps 자체의 STATUS 컬럼("Up 44 seconds" → 1분 넘어가면
    // "Up About a minute" 같은 뭉뚱그린 표현으로 바뀜)에 기대지 않고, 우리가 반복 횟수(i)로
    // 정확한 경과시간(MM:SS)을 직접 계산해서 각 줄 앞에 붙여준다 — 매 반복 3초 간격이라
    // (i-1)*3초가 곧 경과시간. printf(셸 내장)만 쓰므로 별도 도구 설치 불필요.
    const waitHealthyCmd =
      `cd ${REMOTE_BE_DIR} && ` +
      `for i in $(seq 1 100); do ` +
      `ELAPSED=$(( (i-1)*3 )); ` +
      `TS=$(printf '%02d:%02d' $((ELAPSED/60)) $((ELAPSED%60))); ` +
      `LINE=$(${DOCKER} compose ps | grep ecBeBo); ` +
      `echo "  [$i/100 | $TS 경과] $LINE"; ` +
      `if echo "$LINE" | grep -q "(healthy)"; then echo "  ✅ healthy 확인됨 (경과 $TS)"; exit 0; fi; ` +
      `sleep 3; ` +
      `done; ` +
      `echo "  ⚠ 5분 안에 healthy 가 안 됐습니다 — 아래 로그로 원인 확인 필요"; exit 1`;

    // 2026-09-06: 지금까지 이 스크립트는 jar 파일만 올리고 docker-compose.yml 은 손대지 않았다
    // — GitHub Actions(shopjoy-be-illeesam-synol-deploy.yml)만 SCP 로 갱신해서, 이 직접-SSH
    // 경로로만 배포해온 경우 리포의 compose 변경(예: 컨테이너/이미지 이름 변경)이 NAS 에 절대
    // 반영되지 않는 구멍이 있었다. 매번 최신 compose 파일을 함께 올려 리포=NAS 상태를 항상
    // 일치시킨다(내용이 같으면 덮어써도 무해).
    // 2026-09-06 추가 개편: nginx.conf/locations.conf/security-headers.conf 는 apps/ecFeBo 로
    // 이동(완전 분리 설계 — 이 백엔드는 이제 nginx 없이 단독 배포된다). deploy-dev-synol-fe-ecFeBo.js
    // 가 그쪽을 담당하므로 여기서는 더 이상 안 올린다.
    const configUploads = ['docker-compose.yml']
      .map((f) => ({ local: path.join(beDir, f), remote: `${REMOTE_BE_DIR}/${f}` }));

    await withSsh(
      [{ local: jarPath, remote: `${REMOTE_BE_DIR}/${jarFile}` }, ...configUploads],
      [
        {
          // 2026-09-05: docker-compose.yml 의 로그 볼륨 마운트 소스가 수동 삭제 등으로 없으면
          // "Bind mount failed: ... does not exist"로 컨테이너 기동 자체가 실패한다(Docker가
          // 자동으로 안 만들어줌) — 매번 미리 보장해서 재발 방지.
          // 2026-09-06: /volume1/docker/ecadminapi/logs → /volume1/docker/shopjoy/ecBeBoLogs 로
          // 경로 변경(다른 앱들의 ecBeCdnStorage 등과 명명 원칙 통일). 기존 로그가 있으면 새
          // 경로로 1회 이관(mv, 이미 이관됐거나 기존 폴더가 없으면 조용히 건너뜀).
          label: '로그 볼륨 폴더 존재 보장 (+ 구경로 1회 이관)',
          cmd: 'mkdir -p /volume1/docker/shopjoy/ecBeBoLogs && ' +
            'if [ -d /volume1/docker/ecadminapi/logs ] && [ -z "$(ls -A /volume1/docker/shopjoy/ecBeBoLogs 2>/dev/null)" ]; then ' +
            'mv /volume1/docker/ecadminapi/logs/* /volume1/docker/shopjoy/ecBeBoLogs/ 2>/dev/null; ' +
            'echo "  ↪ 구 로그 경로(/volume1/docker/ecadminapi/logs)에서 이관 완료"; ' +
            'else echo "  (이관 대상 없음 — 스킵)"; fi',
          allowFail: true,
        },
        {
          // 2026-09-06: 이 스크립트는 jar만 올리고 .env 는 건드리지 않는다 — 즉 컨테이너가
          // 실제로 어떤 Spring 프로파일(local/dev/prod)로 뜨는지는 NAS에 이미 있는 .env 가
          // 결정한다. 매 배포마다 지금 그 값이 뭔지 콘솔에서 바로 보이게 확인만 해둔다.
          label: '적용 중인 Spring 프로파일 확인 (.env 의 SPRING_PROFILES_ACTIVE)',
          cmd: `grep '^SPRING_PROFILES_ACTIVE=' ${REMOTE_BE_DIR}/.env || echo '  ⚠ SPRING_PROFILES_ACTIVE 미설정 — ${REMOTE_BE_DIR}/.env 확인 필요'`,
          allowFail: true,
        },
        { label: 'Docker 이미지 재빌드', cmd: `cd ${REMOTE_BE_DIR} && ${DOCKER} compose build` },
        {
          // 2026-09-06: --remove-orphans — compose 파일의 서비스/컨테이너명이 바뀌면 옛 이름으로
          // 뜬 컨테이너는 새 compose 파일 기준으로는 "orphan"이 되어 up -d 만으로는 안 지워지고
          // 그대로 남아 포트를 계속 점유한다 — --force-recreate 는 "지금 compose 파일에 있는
          // 서비스"만 재생성할 뿐, 파일에서 아예 없어진 옛 서비스는 건드리지 않기 때문.
          // --remove-orphans 를 같이 줘야 옛 컨테이너가 정리되고 새 서비스가 포트를 정상적으로
          // 넘겨받는다. 2026-09-06 추가 개편: nginx 서비스는 apps/ecFeBo 로 완전히 분리 이동해서
          // 이 compose 파일엔 이제 ecbebo 하나뿐 — 재기동 대상에서 nginx 제거.
          label: '컨테이너 재기동 (+ 이름 바뀐/사라진 옛 서비스 정리)',
          cmd: `cd ${REMOTE_BE_DIR} && ${DOCKER} compose up -d --force-recreate --remove-orphans ecbebo`,
        },
        { label: '헬스체크 대기(healthy 될 때까지 최대 5분)', cmd: waitHealthyCmd, allowFail: true },
        {
          label: 'actuator 헬스체크 실제 응답',
          cmd: `curl -s -o /tmp/health.txt -w '  HTTP %{http_code}\\n' http://localhost:22300/actuator/health; cat /tmp/health.txt; echo`,
          allowFail: true,
        },
        {
          label: '최근 로그(위 응답이 이상하면 원인 확인용)',
          cmd: `cd ${REMOTE_BE_DIR} && ${DOCKER} compose logs --tail 30 ecbebo`,
          allowFail: true,
        },
      ],
      TAG
    );

    console.log(`\n${TAG}[완료] 백엔드 배포 끝 (총 소요 ${fmtElapsed()})`);
    console.log(`${TAG}   헬스체크 : http://illeesam.synology.me:22300/actuator/health`);
    console.log(`${TAG}   테스트 API(공통코드 페이징, 로그인 불필요):`);
    console.log(`${TAG}     http://illeesam.synology.me:22300/api/co/sy/code/page?pageNo=1&pageSize=10`);

    // 점검 안내 + 서버/환경 정보(요청사항: "배포메일 보낼때 내용에 점검 안내도 같이 보내줘" /
    // "서버정보 및 설치 경로정보도 추가해줘" / "주요 환경정보도 있으면 좋겠어" / "배포 후
    // 로그화면보는 url 도 보내줘 이건 인증없이 누구나 보는거야"). 프레임워크 표준 경로
    // (actuator/swagger) + 서로 다른 도메인 API + 신규 운영 도구(로그뷰어)로 다양화.
    // 2026-09-06: 완전 분리 설계로 nginx 리버스프록시가 사라져서 전부 이 백엔드 자체 포트(22300)
    // 직접 URL로 변경 — /admin-tools/ 도 더 이상 nginx 경유가 아니라 이 앱이 자기 static/home
    // 리소스를 직접 서빙하는 /home/index.html 로 접근한다(경로 충돌 상대가 없어져 rewrite 불필요).
    const checkUrls = [
      { url: 'http://illeesam.synology.me:22300/actuator/health', note: '헬스체크' },
      { url: 'http://illeesam.synology.me:22300/home/index.html', note: '🪵 로그뷰어(운영 도구, 인증 불필요)' },
      { url: 'http://illeesam.synology.me:22300/swagger-ui/index.html', note: 'API 문서(Swagger UI, 로그인 불필요)' },
      { url: 'http://illeesam.synology.me:22300/api/co/sy/code/page?pageNo=1&pageSize=1', note: '공통코드 페이징(로그인 불필요)' },
      { url: 'http://illeesam.synology.me:22300/api/co/sy/site?pageNo=1&pageSize=1', note: '사이트 목록(로그인 불필요)' },
      { url: 'http://illeesam.synology.me:22300/api/co/log/tail?file=app&lines=20', note: '로그 tail API(최근 20줄, 인증 불필요)' },
    ];
    const serverInfo = [
      { label: 'NAS 호스트', value: 'illeesam.synology.me (SSH 10022 / 앱 포트 22300 — 이제 정식 공개 포트)' },
      { label: '설치 경로', value: REMOTE_BE_DIR },
      { label: '컨테이너명', value: 'shopjoy-ecBeBo-22300 (docker compose 서비스명: ecbebo, 이미지: shopjoy/ecbebo:latest)' },
      { label: 'Docker 네트워크', value: '완전 분리 설계(2026-09-06) — 다른 컨테이너와 네트워크 비공유, 단독 기동' },
      { label: '활성 프로파일', value: `${REMOTE_BE_DIR}/.env 의 SPRING_PROFILES_ACTIVE 값 (위 로그 참조)` },
      { label: 'DB 접속', value: 'illeesam.synology.me:17632 / shopjoy_2604 (PostgreSQL, p6spy 경유)' },
      { label: '로그 경로', value: '/volume1/docker/shopjoy/ecBeBoLogs → 컨테이너 내부 logs' },
    ];
    await notifyDeployResult({
      tag: TAG, scriptName: '백엔드(EcAdminApi)', success: true, elapsed: fmtElapsed(),
      detail: `헬스체크: http://illeesam.synology.me:21080/actuator/health`,
      serverInfo,
      checkUrls,
      npmScript: 'deploy:dev-synol-ecBeBo',
    });
    console.log(`${TAG} ◀ 완료`);
  } catch (e) {
    console.error(`\n${TAG}[실패] ❌ 배포 실패 (경과 ${fmtElapsed()}): ${e.message}`);
    await notifyDeployResult({
      tag: TAG, scriptName: '백엔드(EcAdminApi)', success: false, elapsed: fmtElapsed(),
      detail: `오류: ${e.message}`,
      serverInfo: [
        { label: 'NAS 호스트', value: 'illeesam.synology.me (SSH 10022 / 앱 포트 21080)' },
        { label: '설치 경로', value: REMOTE_BE_DIR },
      ],
      npmScript: 'deploy:dev-synol-ecBeBo',
    });
    process.exit(1);
  }
})();
