/* deploy-dev-synol-be-ecBeRedis.js — Synology NAS(dev)의 Redis 를 apps/ecBeRedis/docker-compose.yml
 * 기준으로 (재)배포한다. 다른 deploy-dev-synol-be-*.js 와 달리 Gradle 빌드가 없다 — Redis 는
 * 공식 이미지(redis:7.0-rc1)를 그대로 쓰므로 "빌드해서 전송"할 산출물 자체가 없고, compose 파일
 * 전송 + 컨테이너 재기동이 전부다.
 *
 * 2026-09-06 개편(요청사항: "4개 앱이 각자 다른 호스팅사에 흩어질 수도 있다"는 최악의 경우
 * 기준 설계) — 컨테이너명 240-shopjoy-redis → shopjoy-ecBeRedis-22379(이름규칙 통일),
 * 포트 12379 → 22379(재번호), 비밀번호(REDIS_PASSWORD) 추가. 포트가 기존 DSM 직접생성
 * 컨테이너(123-redis.70rc1, 12379, 무암호)와 겹치지 않으므로 더 이상 그 컨테이너를 정지·삭제할
 * 필요가 없다 — 둘 다 동시에 떠 있을 수 있다(옛 컨테이너는 준비되는 대로 수동 정리할 것).
 *
 * 사용법: node deploy-dev-synol-be-ecBeRedis.js   (= npm run deploy:dev-synol-ecBeRedis, apps/scripts_deploy_illeesam_synol/ 안에서)
 * NAS 접속정보는 .synology-deploy.env 필요 — 형식은 synology-deploy-util.js 상단 주석 참조.
 */
const path = require('path');
const { ROOT, requireCreds, withSsh, hms } = require('./synology-deploy-util');
const { notifyDeployResult } = require('./notify-deploy-result');

requireCreds('deploy-dev-synol-be-ecBeRedis.js');

const DOCKER = '/usr/local/bin/docker';
const REMOTE_REDIS_DIR = '/volume1/docker/shopjoy/ecBeRedis';
const CONTAINER_NAME = 'shopjoy-ecBeRedis-22379';
const DEFAULT_PASSWORD = 'redis123'; // .env 미준비 시 최초 1회 자동 생성해 넣는 기본값(요청사항)

const TAG = { toString() { return `[${hms()}][deploy-dev-synol-be-ecBeRedis.js][REDIS]`; } };
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
    console.log(`${TAG} ▶ 시작 : Redis compose 배포 (배포 대상: dev NAS, 빌드 단계 없음)\n`);

    // ROOT(synology-deploy-util.js 기준) = apps/ — 형제 폴더 apps/ecBeRedis 에 compose 파일이 있다.
    const redisDir = path.join(ROOT, 'ecBeRedis');
    const composePath = path.join(redisDir, 'docker-compose.yml');

    console.log(`${step(1)} compose 배포 + 컨테이너 기동`);
    await withSsh(
      [{ local: composePath, remote: `${REMOTE_REDIS_DIR}/docker-compose.yml` }],
      [
        { label: '데이터 폴더 존재 보장', cmd: 'mkdir -p /volume1/docker/shopjoy/ecBeRedisData' },
        {
          // 2026-09-06: .env 가 없으면(최초 1회) REDIS_PASSWORD 를 기본값으로 생성해둔다 —
          // docker-compose.yml 의 ${REDIS_PASSWORD:-redis123} 는 "환경변수가 아예 없을 때"만
          // 기본값을 쓰므로, .env 파일 자체가 없어도 사실 동작은 하지만(compose 기본값 적용),
          // 나중에 값을 바꿔야 할 때 어디를 고쳐야 하는지 명확하게 하려고 파일로 만들어둔다.
          // 이미 .env 가 있으면(운영자가 직접 값을 바꿔둔 경우) 절대 덮어쓰지 않는다.
          label: '.env 존재 보장 (+ 없으면 REDIS_PASSWORD 기본값 생성, 있으면 그대로 유지)',
          cmd: `if [ ! -f ${REMOTE_REDIS_DIR}/.env ]; then ` +
            `echo 'REDIS_PASSWORD=${DEFAULT_PASSWORD}' > ${REMOTE_REDIS_DIR}/.env; ` +
            `echo '  ↪ .env 신규 생성 (REDIS_PASSWORD=${DEFAULT_PASSWORD})'; ` +
            `else echo '  ↪ 기존 .env 유지 (내용 변경 없음)'; fi`,
          allowFail: true,
        },
        { label: 'Redis 이미지 pull(최초 1회만 실제로 받아옴)', cmd: `cd ${REMOTE_REDIS_DIR} && ${DOCKER} compose pull` },
        { label: 'Redis 컨테이너 기동', cmd: `cd ${REMOTE_REDIS_DIR} && ${DOCKER} compose up -d` },
        { label: '5초 대기 후 상태 확인', cmd: `sleep 5 && cd ${REMOTE_REDIS_DIR} && ${DOCKER} compose ps` },
        {
          label: 'redis-cli ping (컨테이너 안에서 직접 확인, 인증 포함)',
          cmd: `${DOCKER} exec ${CONTAINER_NAME} sh -c 'redis-cli -a "$REDIS_PASSWORD" --no-auth-warning ping'`,
          allowFail: true,
        },
      ],
      TAG
    );

    console.log(`\n${TAG}[완료] Redis 배포 끝 (총 소요 ${fmtElapsed()})`);
    console.log(`${TAG}   접속: illeesam.synology.me:22379 (host.docker.internal:22379 — EcAdminApi/EcCdnApi 컨테이너 안에서)`);
    console.log(`${TAG}   ⚠ 이 Redis 를 EcAdminApi/EcCdnApi 가 실제로 쓰려면 그쪽 .env 에도 REDIS_PORT=22379,`);
    console.log(`${TAG}     REDIS_PASSWORD=(위와 동일 값)을 맞춰 넣어야 한다(비밀번호가 걸렸으므로 필수).`);

    await notifyDeployResult({
      tag: TAG, scriptName: 'Redis', success: true, elapsed: fmtElapsed(),
      detail: '배포 완료 — redis-cli ping 결과는 위 로그 참조',
      serverInfo: [
        { label: 'NAS 호스트', value: 'illeesam.synology.me (SSH 10022 / Redis 포트 22379)' },
        { label: '설치 경로', value: REMOTE_REDIS_DIR },
        { label: '데이터 경로', value: '/volume1/docker/shopjoy/ecBeRedisData' },
        { label: '컨테이너명', value: `${CONTAINER_NAME} (이미지 redis:7.0-rc1)` },
        { label: '비밀번호', value: `있음(REDIS_PASSWORD, ${REMOTE_REDIS_DIR}/.env — 미준비 시 기본값 ${DEFAULT_PASSWORD} 자동생성)` },
        { label: '기존 무암호 컨테이너', value: '123-redis.70rc1(12379)은 포트가 달라 그대로 남아있음 — 준비되면 수동 정리' },
      ],
      checkUrls: [],
      npmScript: 'deploy:dev-synol-ecBeRedis',
    });
    console.log(`${TAG} ◀ 완료`);
  } catch (e) {
    console.error(`\n${TAG}[실패] ❌ 배포 실패 (경과 ${fmtElapsed()}): ${e.message}`);
    await notifyDeployResult({
      tag: TAG, scriptName: 'Redis', success: false, elapsed: fmtElapsed(),
      detail: `오류: ${e.message}`,
      serverInfo: [], checkUrls: [],
      npmScript: 'deploy:dev-synol-ecBeRedis',
    });
    process.exit(1);
  }
})();
