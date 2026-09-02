/* synologyDeployUtil.js — deployDevSynolBe.js / deployDevSynolFe.js 가 공유하는
 * SSH/SFTP 헬퍼. NAS 접속정보 로드 + SFTP 업로드 + SSH 명령 실행을 여기 한 곳에 모아서
 * 두 스크립트가 똑같은 접속 로직을 중복해서 들고 있지 않게 한다(직접 실행 대상 아님).
 *
 * NAS 접속정보는 scripts/.synology-deploy.env 파일(git 커밋 금지, .gitignore 처리됨)에서 읽는다.
 * 아직 없으면 아래 형식으로 scripts/.synology-deploy.env 를 직접 만들 것:
 *   SYNOLOGY_HOST=illeesam.synology.me
 *   SYNOLOGY_PORT=10022
 *   SYNOLOGY_USER=appuser
 *   SYNOLOGY_PASSWORD=실제비밀번호
 * (이미 환경변수로 SYNOLOGY_* 가 설정돼 있으면 그 값이 우선한다 — CI 등에서 재사용 가능.)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Client } = require('ssh2');

const ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(__dirname, '.synology-deploy.env');

/* [환경변수 로드] scripts/.synology-deploy.env 를 간단히 파싱해서 process.env 에 없는 값만 채운다. */
function loadLocalEnv() {
  if (!fs.existsSync(ENV_FILE)) return;
  const lines = fs.readFileSync(ENV_FILE, 'utf8').split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    const val = t.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadLocalEnv();

const HOST = process.env.SYNOLOGY_HOST;
const PORT = Number(process.env.SYNOLOGY_PORT || 22);
const USER = process.env.SYNOLOGY_USER;
const PASSWORD = process.env.SYNOLOGY_PASSWORD;

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function requireCreds(scriptName) {
  if (!HOST || !USER || !PASSWORD) {
    fail(
      `NAS 접속정보가 없습니다. scripts/.synology-deploy.env 파일을 만들거나 환경변수를 설정하세요.\n` +
      `   필요한 값: SYNOLOGY_HOST, SYNOLOGY_PORT, SYNOLOGY_USER, SYNOLOGY_PASSWORD\n` +
      `   (${scriptName} 상단 주석 참조)`
    );
  }
}

/* SFTP 는 Synology 특성상 /volume1 을 접속 루트(/)로 취급한다 — 실경로에서 /volume1 을 뗀
   경로로 SFTP 를 호출해야 한다(SSH exec 명령은 반대로 실경로 /volume1/... 을 그대로 씀). */
function toSftpPath(realPath) {
  return realPath.replace(/^\/volume1/, '');
}

function run(cmd, cwd) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { cwd: cwd || ROOT, stdio: 'inherit' });
}

/* SSH 연결 하나를 열고, sftpPut(여러 건) → exec(순차 여러 명령) 을 차례로 수행한 뒤 닫는다. */
function withSsh(uploads, commands) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', async () => {
      try {
        if (uploads.length) {
          console.log(`\n[전송] SFTP 로 ${uploads.length}개 파일 업로드`);
          await new Promise((res, rej) => {
            conn.sftp((err, sftp) => {
              if (err) return rej(err);
              const next = (i) => {
                if (i >= uploads.length) return res();
                const { local, remote } = uploads[i];
                const sftpRemote = toSftpPath(remote);
                console.log(`  ㄴ ${path.basename(local)} → ${remote}`);
                sftp.fastPut(local, sftpRemote, (e) => {
                  if (e) return rej(e);
                  next(i + 1);
                });
              };
              next(0);
            });
          });
        }

        for (const cmd of commands) {
          console.log(`\n[NAS 실행] ${cmd.label || cmd.cmd}`);
          await new Promise((res, rej) => {
            conn.exec(cmd.cmd, (err, stream) => {
              if (err) return rej(err);
              let out = '', errOut = '';
              stream.on('data', (d) => { out += d.toString(); process.stdout.write(d); });
              stream.stderr.on('data', (d) => { errOut += d.toString(); process.stderr.write(d); });
              stream.on('close', (code) => {
                if (cmd.allowFail !== true && code !== 0) {
                  return rej(new Error(`NAS 명령 실패(exit ${code}): ${cmd.cmd}`));
                }
                res({ out, errOut, code });
              });
            });
          });
        }

        conn.end();
        resolve();
      } catch (e) {
        conn.end();
        reject(e);
      }
    });
    conn.on('error', reject);
    conn.connect({ host: HOST, port: PORT, username: USER, password: PASSWORD, readyTimeout: 20000 });
  });
}

module.exports = { ROOT, HOST, PORT, USER, PASSWORD, fail, requireCreds, toSftpPath, run, withSsh };
