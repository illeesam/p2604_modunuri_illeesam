/* deployDevSynolFe.js — 내 컴퓨터에서 직접 SSH로 프론트(FO/BO 화면)를 Synology NAS(dev)에
 * 빌드+전송까지 한 번에. GitHub Actions 를 거치지 않는다(그쪽은 package.json 의
 * deploy:dev-github-be/-fe/-full 참조 — git push 로 GitHub 서버가 대신 빌드+배포, GitHub Pages 도 같이 됨).
 * 백엔드는 별도 scripts/deployDevSynolBe.js(= npm run deploy:dev-synol-be).
 * 백엔드+프론트 둘 다 한 번에 하려면 npm run deploy:dev-synol-full.
 *
 * 사용법: node scripts/deployDevSynolFe.js   (= npm run deploy:dev-synol-fe)
 * NAS 접속정보는 scripts/.synology-deploy.env 필요 — 형식은 synologyDeployUtil.js 상단 주석 참조.
 *
 * 무엇을 하는지는 _apps_be/EcAdminApi/_doc/12_illeesam_synology_FE_수동배포가이드.md 의
 * STEP 1~4 와 완전히 동일한 절차를 그대로 스크립트로 옮긴 것뿐이다.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const { ROOT, run, withSsh, requireCreds } = require('./synologyDeployUtil');

requireCreds('scripts/deployDevSynolFe.js');

const REMOTE_FRONTEND_DIR = '/volume1/docker/shopjoy/frontend';
const REMOTE_SHOPJOY_DIR = '/volume1/docker/shopjoy';
const PUBLIC_HOST = '21000.illeesam.synology.me';

// 배포 후 헬스체크(외부 HTTPS, 이 컴퓨터 → NAS) — 실제 사용자가 브라우저로 접속하는 경로와
// 동일하게 확인한다. NAS 내부(localhost:21000, withSsh 단계)만 200이고 이 바깥쪽 체크가
// 실패하면 nginx 는 정상인데 DSM 리버스 프록시/인증서 쪽 문제일 가능성이 높다(13번 문서 참조).
function checkUrl(pathname) {
  return new Promise((resolve) => {
    const req = https.get({ hostname: PUBLIC_HOST, path: pathname, timeout: 10000 }, (res) => {
      res.resume(); // 응답 바디는 안 쓰므로 그냥 흘려보내 소켓을 빨리 반환
      resolve(String(res.statusCode));
    });
    req.on('timeout', () => { req.destroy(); resolve('timeout'); });
    req.on('error', (e) => resolve(`error(${e.code || e.message})`));
  });
}

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
    console.log('=== 프론트(FO/BO 화면) 배포 시작 ===\n');

    console.log('[FE-1] dev 프로파일로 빌드');
    run('npm run build:dev', ROOT);

    console.log('\n[FE-2] dist/ 압축');
    const tarPath = path.join(ROOT, 'dist.tar.gz');
    run(`tar -czf dist.tar.gz -C dist .`, ROOT);
    console.log(`  결과: ✅ dist.tar.gz (${(fs.statSync(tarPath).size / 1024 / 1024).toFixed(1)}MB)`);

    await withSsh(
      [{ local: tarPath, remote: `${REMOTE_SHOPJOY_DIR}/dist.tar.gz` }],
      [
        {
          label: '기존 파일 삭제 후 압축 해제',
          cmd:
            `rm -rf ${REMOTE_FRONTEND_DIR}/* && ` +
            `tar -xzf ${REMOTE_SHOPJOY_DIR}/dist.tar.gz -C ${REMOTE_FRONTEND_DIR} && ` +
            `rm -f ${REMOTE_SHOPJOY_DIR}/dist.tar.gz`,
        },
        { label: '결과 확인', cmd: `ls -la ${REMOTE_FRONTEND_DIR} | head -10` },
        {
          label: '헬스체크 1/2 (NAS 내부, nginx가 새 파일을 실제로 서빙하는지 — localhost 기준)',
          cmd:
            `echo "  index.html: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:21000/index.html)"; ` +
            `echo "  bo.html   : $(curl -s -o /dev/null -w '%{http_code}' http://localhost:21000/bo.html)"`,
        },
      ]
    );

    fs.rmSync(tarPath, { force: true });

    console.log('\n[FE-3] 헬스체크 2/2 — 외부 HTTPS 접속 확인 (이 컴퓨터 → https://21000.illeesam.synology.me)');
    const [idxStatus, boStatus, apiStatus] = await Promise.all([
      checkUrl('/index.html'),
      checkUrl('/bo.html'),
      checkUrl('/api/co/sy/code/page?pageNo=1&pageSize=1'),
    ]);
    console.log(`  index.html : ${idxStatus}`);
    console.log(`  bo.html    : ${boStatus}`);
    console.log(`  /api/co/sy/code/page (nginx→백엔드→DB) : ${apiStatus}`);

    const allOk = idxStatus === '200' && boStatus === '200' && apiStatus === '200';
    if (allOk) {
      console.log('  ✅ 헬스체크 통과 — 프론트 정적 파일 + nginx→백엔드→DB 경로까지 전부 정상');
    } else {
      console.log('  ⚠ 200이 아닌 응답이 있습니다 — 배포 자체는 끝났지만 접속 경로에 문제가 있을 수 있습니다.');
      console.log('    index.html/bo.html 이 200이 아니면: 위 [헬스체크 1/2] 로그, 12번 문서 참조');
      console.log('    /api/... 만 200이 아니면: 백엔드가 안 떠 있을 수 있음 → npm run deploy:dev-synol-be, 14번 문서 참조');
    }

    console.log(`\n[FE-완료] 프론트 배포 끝 (총 소요 ${fmtElapsed()})${allOk ? ' (헬스체크 정상)' : ' (헬스체크 이상 있음 — 위 내용 확인)'}`);
    console.log('  HTTP  : http://illeesam.synology.me:21000/index.html , /bo.html');
    console.log('  HTTPS : https://21000.illeesam.synology.me/index.html , /bo.html  (로그인은 이쪽 필수)');
  } catch (e) {
    console.error(`\n[FE-실패] ❌ 배포 실패 (경과 ${fmtElapsed()}): ${e.message}`);
    process.exit(1);
  }
})();
