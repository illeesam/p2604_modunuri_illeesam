/* manage-dev-synol.js — 5개 앱(ecBeBo/ecBeCdn/ecFeBo/ecBeRedis/ecGateway) 공용 컨테이너
 * 중지/삭제/상태확인 도구. deploy-dev-synol-*.js 는 "빌드+전송+기동"까지 하지만, 이 스크립트는
 * 그 반대 방향(멈추기/치우기/들여다보기)만 담당한다 — 둘을 분리해서 한 파일에 다 넣지 않음.
 *
 * 사용법: node manage-dev-synol.js <action> <app>
 *   action: stop(정지만, 컨테이너/설정 남음) | start(정지된 걸 다시 시작) |
 *           delete(컨테이너+네트워크 제거, docker compose down — 볼륨/데이터는 안 지움) |
 *           ps(상태 확인) | logs(최근 로그 30줄)
 *   app   : ecBeBo | ecBeCdn | ecFeBo | ecBeRedis | ecGateway
 *
 * npm 스크립트로는 stop/, delete/, ps/ 워크스페이스(각자 package.json)에 {app} 이름으로 등록돼
 * 있다 — 예: cd stop && npm run ecBeBo, cd delete && npm run ecGateway, cd ps && npm run ecFeBo
 * (또는 루트에서 npm run ecBeBo --workspace=stop 처럼 --workspace 지정).
 *
 * ⚠️ delete(docker compose down)는 컨테이너/compose가 만든 네트워크만 지운다 — 볼륨(DB 데이터,
 * Redis 데이터, 로그, CDN 저장소 등 호스트 바인드마운트)은 전혀 건드리지 않는다. 이미지도 안
 * 지운다(다음 배포 시 재사용). 완전히 처음부터 다시 시작하고 싶을 때만 쓰는 명령이 아니라,
 * "지금 이 컨테이너를 치우고 싶다"는 가벼운 의도에 맞춘 것 — 데이터까지 지우려면 NAS에 직접
 * SSH 로 들어가서 해당 볼륨 경로를 손으로 지울 것(실수 방지를 위해 이 스크립트에 안 넣음).
 */
const { requireCreds, withSsh, hms } = require('./synology-deploy-util');

const DOCKER = '/usr/local/bin/docker';

// app 이름 → NAS 상 compose 파일 위치. ecFeBo만 예외적으로 ecFeBoApp(compose 전용 폴더)를
// 쓴다 — ecFeBo 자체는 정적 파일(dist/)만 담는 폴더라 compose 를 거기 두면 매 프론트 배포마다
// 통째로 rm -rf 돼서 지워진다(apps/ecFeBo/docker-compose.yml 상단 주석 참조).
// 2026-09-06 재구조화(요청사항: "shopjoy 아래 혼재돼 있던 폴더를 apps/storage/data/logs 로
// 분류") — 5개 앱 모두 컨테이너 실행 폴더는 apps/ 아래로 이동.
const APP_DIRS = {
  ecBeBo: '/volume1/docker/shopjoy/apps/ecBeBo',
  ecBeCdn: '/volume1/docker/shopjoy/apps/ecBeCdn',
  ecFeBo: '/volume1/docker/shopjoy/apps/ecFeBoApp',
  ecBeRedis: '/volume1/docker/shopjoy/apps/ecBeRedis',
  ecGateway: '/volume1/docker/shopjoy/apps/ecGateway',
};

const ACTIONS = {
  stop: { label: '컨테이너 정지(compose stop — 설정/컨테이너는 남음, 다음 start로 바로 재개 가능)', cmd: 'compose stop' },
  start: { label: '정지된 컨테이너 다시 시작(compose start)', cmd: 'compose start' },
  delete: { label: '컨테이너+네트워크 제거(compose down — 볼륨/데이터/이미지는 안 지움)', cmd: 'compose down' },
  ps: { label: '컨테이너 상태 확인(compose ps)', cmd: 'compose ps' },
  logs: { label: '최근 로그 30줄(compose logs --tail 30)', cmd: 'compose logs --tail 30' },
};

const [, , action, app] = process.argv;

const TAG = { toString() { return `[${hms()}][manage-dev-synol.js][${action || '?'}:${app || '?'}]`; } };

function usageAndExit() {
  console.error(`${TAG} 사용법: node manage-dev-synol.js <${Object.keys(ACTIONS).join('|')}> <${Object.keys(APP_DIRS).join('|')}>`);
  process.exit(1);
}

if (!action || !ACTIONS[action]) usageAndExit();
if (!app || !APP_DIRS[app]) usageAndExit();

requireCreds('manage-dev-synol.js');

(async () => {
  const dir = APP_DIRS[app];
  const { label, cmd } = ACTIONS[action];
  try {
    console.log(`${TAG} ▶ ${label}`);
    console.log(`${TAG}   대상 디렉터리: ${dir}`);
    await withSsh(
      [],
      [{ label, cmd: `cd ${dir} && ${DOCKER} ${cmd}` }],
      TAG
    );
    console.log(`${TAG} ◀ 완료`);
  } catch (e) {
    console.error(`${TAG}[실패] ❌ ${e.message}`);
    process.exit(1);
  }
})();
