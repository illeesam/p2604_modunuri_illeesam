/* reset-ecBeRedis-data.js — shopjoy-ecBeRedis-22379(apps/ecBeRedis/docker-compose.yml 로
 * 관리되는 Redis)에 저장된 데이터를 전부 비운다.
 *
 * 2026-09-06 신설(요청사항: "ecBeRedisData/dump.rdb 를 초기화 또는 삭제하는 npm script").
 *
 * ⚠️ 구현 방식에 대한 설명 — 왜 dump.rdb 파일을 직접 지우지 않는가:
 *   컨테이너가 떠 있는 상태에서 그 파일을 SSH로 rm 해봐야, Redis 프로세스는 이미 그 파일을
 *   열어(또는 다음 저장 시점에 새로 만들어) 쓰고 있어서 "메모리 안의 데이터"는 전혀 안 지워진다.
 *   오히려 다음 자동 저장 시점(docker-compose.yml 의 기본 save 규칙: 3600s/1건, 300s/100건,
 *   60s/10000건)에 지운 파일 자리에 "지우기 전과 똑같은 내용"으로 새 dump.rdb 가 다시 생겨서
 *   지운 게 무의미해진다. 그래서 파일을 건드리는 대신 Redis 프로토콜로 직접
 *     1) FLUSHALL — 메모리 안의 모든 키 즉시 삭제 (컨테이너 재시작 불필요, 다운타임 없음)
 *     2) SAVE     — 그 "비어있는 상태"를 즉시 dump.rdb 에 기록 (자동 저장 시점까지 기다리지 않음)
 *   순서로 진짜 초기화한다 — 이러면 지금 붙어있는 클라이언트도 즉시 빈 상태를 보고, 파일도
 *   실제로 비어있는 내용으로 갱신되어 다음에 컨테이너를 재시작해도 다시 비어있는 채로 뜬다.
 *
 * ⚠️ 로그인 세션/블랙리스트(auth:session:*, auth:blacklist:*)도 전부 같이 지워진다 — 단,
 * JWT 자체는 자체 서명검증(stateless)이라 사용자가 강제 로그아웃되지는 않는다. 유일한 영향은
 * "로그아웃 처리해둔 토큰이 자연만료 전이면 블랙리스트가 사라져 다시 쓰일 수 있게 됨"(영향
 * 범위: 액세스토큰 만료시간 이내, dev/prod 기준 15분) — 2026-09-06 대화에서 확인한 내용.
 *
 * 사용법: scripts/scripts_deploy_illeesam_synol/ 에서 npm run reset-ecBeRedis-data
 * NAS 접속정보는 .synology-deploy.env 필요 — 형식은 synology-deploy-util.js 상단 주석 참조.
 */
const { requireCreds, withSsh, hms } = require('./synology-deploy-util');

requireCreds('reset-ecBeRedis-data.js');

const DOCKER = '/usr/local/bin/docker';
const REMOTE_REDIS_DATA_DIR = '/volume1/docker/shopjoy/data/ecBeRedisData';
const REMOTE_REDIS_ENV_FILE = '/volume1/docker/shopjoy/env/ecBeRedis.env';
const CONTAINER_NAME = 'shopjoy-ecBeRedis-22379';

const TAG = { toString() { return `[${hms()}][reset-ecBeRedis-data.js][REDIS]`; } };
const step = (n) => `${TAG}[${String(n).padStart(2, '0')}]`;

// REMOTE_REDIS_ENV_FILE 의 REDIS_PASSWORD 를 셸에서 읽어 redis-cli -a 에 넘긴다(.env 미준비
// 시 배포 스크립트와 동일한 기본값 redis123 으로 폴백 — docker-compose.yml 의 ${REDIS_PASSWORD:-redis123}
// 와 같은 기본값이라야 실제 컨테이너 비밀번호와 어긋나지 않는다).
const redisCli = (args) =>
  `source ${REMOTE_REDIS_ENV_FILE} 2>/dev/null; ` +
  `${DOCKER} exec ${CONTAINER_NAME} sh -c 'redis-cli -a "\${REDIS_PASSWORD:-redis123}" --no-auth-warning ${args}'`;

(async () => {
  try {
    console.log(`${TAG} ▶ 시작 : ${CONTAINER_NAME} 데이터 초기화 (FLUSHALL + SAVE)\n`);

    await withSsh(
      [],
      [
        { label: '초기화 전 — 현재 키 개수(DBSIZE)', cmd: redisCli('DBSIZE') },
        { label: '초기화 전 — dump.rdb 파일 정보', cmd: `ls -la ${REMOTE_REDIS_DATA_DIR}/dump.rdb` , allowFail: true },
        { label: 'FLUSHALL — 메모리 안의 모든 키 즉시 삭제', cmd: redisCli('FLUSHALL') },
        { label: 'SAVE — 비어있는 상태를 즉시 dump.rdb 에 기록', cmd: redisCli('SAVE') },
        { label: '초기화 후 — 키 개수(DBSIZE, 0이어야 정상)', cmd: redisCli('DBSIZE') },
        { label: '초기화 후 — dump.rdb 파일 정보(크기/시각 갱신 확인)', cmd: `ls -la ${REMOTE_REDIS_DATA_DIR}/dump.rdb` },
      ],
      TAG
    );

    console.log(`\n${TAG}[완료] ${CONTAINER_NAME} 데이터 초기화 끝 — DBSIZE 0 확인, dump.rdb 도 즉시 갱신됨`);
    console.log(`${TAG} ◀ 완료`);
  } catch (e) {
    console.error(`\n${TAG}[실패] ❌ ${e.message}`);
    process.exit(1);
  }
})();
