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
const { ROOT, run, withSsh, requireCreds } = require('./synologyDeployUtil');

requireCreds('scripts/deployDevSynolFe.js');

const REMOTE_FRONTEND_DIR = '/volume1/docker/shopjoy/frontend';
const REMOTE_SHOPJOY_DIR = '/volume1/docker/shopjoy';

(async () => {
  try {
    console.log('=== 프론트(FO/BO 화면) 배포 시작 ===\n');

    console.log('[1] dev 프로파일로 빌드');
    run('npm run build:dev', ROOT);

    console.log('\n[2] dist/ 압축');
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
          label: '기본 접속 확인 (nginx가 새 파일을 실제로 서빙하는지, localhost 기준)',
          cmd:
            `echo "  index.html: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:21000/index.html)"; ` +
            `echo "  bo.html   : $(curl -s -o /dev/null -w '%{http_code}' http://localhost:21000/bo.html)"`,
        },
      ]
    );

    fs.rmSync(tarPath, { force: true });
    console.log('\n[완료] 프론트 배포 끝 (위 두 접속 확인이 둘 다 200이면 정상)');
    console.log('  HTTP  : http://illeesam.synology.me:21000/index.html , /bo.html');
    console.log('  HTTPS : https://21000.illeesam.synology.me/index.html , /bo.html  (로그인은 이쪽 필수)');
  } catch (e) {
    console.error(`\n❌ 배포 실패: ${e.message}`);
    process.exit(1);
  }
})();
