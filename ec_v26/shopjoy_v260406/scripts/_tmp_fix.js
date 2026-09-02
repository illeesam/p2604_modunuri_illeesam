/* _tmp_fix.js — 일회성 수정 스크립트(사용자 명시 승인 후 실행). 실행 후 바로 삭제함.
 * illeesam(관리자 계정)으로 SSH 접속해서 frontend/backend 폴더 소유권을 appuser:docker 로
 * 재귀 이전한다. 진단 결과 현재 illeesam:users 소유(그룹 쓰기권한 없음)로 남아있어서
 * appuser 가 파일을 못 지우는 게 확인됨. */
const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('[연결됨] illeesam@illeesam.synology.me');
  const cmd = [
    'sudo chown -R appuser:docker /volume1/docker/shopjoy/frontend /volume1/docker/shopjoy/backend',
    'echo "--- 완료 후 확인 ---"',
    'ls -ld /volume1/docker/shopjoy/frontend /volume1/docker/shopjoy/backend',
    'ls -la /volume1/docker/shopjoy/frontend/pages/fo/xs | head -8',
  ].join(' && ');
  conn.exec(cmd, { pty: true }, (err, stream) => {
    if (err) { console.error('exec 에러:', err); conn.end(); process.exit(1); }
    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', (c) => { console.log(`\n[종료 코드] ${c}`); conn.end(); process.exit(c); });
  });
});
conn.on('error', (e) => { console.error('연결 에러:', e); process.exit(1); });
conn.connect({
  host: 'illeesam.synology.me',
  port: 10022,
  username: 'illeesam',
  password: 'song5549!!',
  readyTimeout: 20000,
});
