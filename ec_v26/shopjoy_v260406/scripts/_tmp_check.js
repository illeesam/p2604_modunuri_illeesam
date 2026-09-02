/* _tmp_check.js — 일회성 진단 스크립트. 실행 후 바로 삭제함(리포에 커밋 안 함). */
const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('[연결됨] illeesam@illeesam.synology.me');
  const cmd = [
    'echo "--- id appuser ---"',
    'id appuser',
    'echo "--- pages/fo/xs 폴더 자체 ---"',
    'ls -ld /volume1/docker/shopjoy/frontend/pages/fo/xs',
    'echo "--- pages/fo/xs 안 파일들 ---"',
    'ls -la /volume1/docker/shopjoy/frontend/pages/fo/xs | head -20',
    'echo "--- pages/md/sg 폴더 자체 ---"',
    'ls -ld /volume1/docker/shopjoy/frontend/pages/md/sg',
    'echo "--- frontend 최상위 ---"',
    'ls -ld /volume1/docker/shopjoy/frontend',
  ].join(' && ');
  conn.exec(cmd, (err, stream) => {
    if (err) { console.error('exec 에러:', err); conn.end(); process.exit(1); }
    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', (c) => { console.log(`\n[종료 코드] ${c}`); conn.end(); process.exit(0); });
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
