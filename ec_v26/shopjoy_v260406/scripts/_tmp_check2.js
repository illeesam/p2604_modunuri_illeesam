const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "--- /volume1/docker/shopjoy 전체 ---"',
    'ls -la /volume1/docker/shopjoy/',
    'echo "--- backend 폴더 ---"',
    'ls -la /volume1/docker/shopjoy/backend/ 2>&1',
    'echo "--- frontend 폴더 ---"',
    'ls -la /volume1/docker/shopjoy/frontend/ 2>&1',
    'echo "--- 컨테이너 상태 ---"',
    '/usr/local/bin/docker compose -f /volume1/docker/shopjoy/backend/docker-compose.yml ps 2>&1',
    'echo "--- docker ps 전체 ---"',
    '/usr/local/bin/docker ps -a',
  ].join(' && ');
  conn.exec(cmd, (err, stream) => {
    if (err) { console.error(err); conn.end(); process.exit(1); }
    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', (c) => { console.log(`\n[종료 코드] ${c}`); conn.end(); process.exit(0); });
  });
});
conn.on('error', (e) => { console.error(e); process.exit(1); });
conn.connect({ host: 'illeesam.synology.me', port: 10022, username: 'illeesam', password: 'song5549!!', readyTimeout: 20000 });
