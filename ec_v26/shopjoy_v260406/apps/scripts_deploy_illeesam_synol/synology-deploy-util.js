/* synology-deploy-util.js — deploy-dev-synol-be-ecAdminApi.js / deploy-dev-synol-fe-vue3cdn.js 가 공유하는
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

// 2026-09-06: 태그 앞에 [HH:MM:SS] 시각을 붙이기 위한 헬퍼 — SSH 원격 실행/SFTP 전송처럼
// 오래 걸리는 단계 사이 실제 경과시간을 로그만 보고 바로 파악하기 위함(요청사항).
function hms() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// 2026-09-05: 이 파일이 직접 찍는 로그(호출자가 자기 TAG를 안 넘겨준 경우)의 기본 태그.
// run()/fail() 은 호출부(deploy-dev-synol-be-ecAdminApi.js 등)가 자기 TAG 를 3번째 인자로 넘겨주면
// 그걸 쓰고, 안 넘겨주면 이 파일 자신의 이름을 쓴다 — "모든 로그 앞에 어느 파일에서 난
// 건지 항상 표시"하되, 실제로 그 동작을 시킨 스크립트가 있으면 그 스크립트 이름이
// 더 유용한 정보이므로 우선한다. toString() 을 커스텀해서 매번 문자열로 보간(${tag})될 때마다
// 그 순간의 시각을 새로 계산해 넣는다 — 호출부(deploy-dev-synol-*.js)의 TAG 도 동일 패턴.
const SELF_TAG = { toString() { return `[${hms()}][synology-deploy-util.js]`; } };

// 2026-09-05: 비밀번호를 콘솔에 그대로 찍지 않기 위한 마스킹 — 앞쪽 절반만 보여주고
// 뒤쪽 절반은 길이와 무관하게 고정 '***' 로 가린다(뒷부분 길이까지 유추되지 않게).
function maskPassword(pw) {
  if (!pw) return '(미설정)';
  const showLen = Math.ceil(pw.length / 2);
  return pw.slice(0, showLen) + '***';
}

function fail(msg, tag = SELF_TAG) {
  console.error(`${tag} ❌ ${msg}`);
  process.exit(1);
}

function requireCreds(scriptName) {
  const tag = { toString() { return `[${hms()}][${scriptName.split('/').pop()}]`; } };
  if (!HOST || !USER || !PASSWORD) {
    fail(
      `NAS 접속정보가 없습니다. scripts/.synology-deploy.env 파일을 만들거나 환경변수를 설정하세요.\n` +
      `   필요한 값: SYNOLOGY_HOST, SYNOLOGY_PORT, SYNOLOGY_USER, SYNOLOGY_PASSWORD\n` +
      `   (${scriptName} 상단 주석 참조)`,
      tag
    );
  }
  // 2026-09-05: 지금 어느 NAS/계정으로 접속하는지 콘솔에서 바로 보이게(비밀번호는 뒤쪽 절반
  // *** 마스킹) — deploy:dev-synol-be-ecAdminApi/fe/full 이 여러 스크립트를 순서대로 실행할 때, 각
  // 단계가 실제로 어떤 host/port/계정을 쓰는지 헷갈리지 않게 하기 위함.
  console.log(`${tag}[접속정보] HOST=${HOST} PORT=${PORT} USER=${USER} PASSWORD=${maskPassword(PASSWORD)}`);
}

/* SFTP 는 Synology 특성상 /volume1 을 접속 루트(/)로 취급한다 — 실경로에서 /volume1 을 뗀
   경로로 SFTP 를 호출해야 한다(SSH exec 명령은 반대로 실경로 /volume1/... 을 그대로 씀). */
function toSftpPath(realPath) {
  return realPath.replace(/^\/volume1/, '');
}

function run(cmd, cwd, tag = SELF_TAG) {
  console.log(`${tag}   $ ${cmd}`);
  execSync(cmd, { cwd: cwd || ROOT, stdio: 'inherit' });
}

/* SSH 연결 하나를 열고, sftpPut(여러 건) → exec(순차 여러 명령) 을 차례로 수행한 뒤 닫는다.
   tag: 호출한 스크립트를 식별하는 접두어(예: "[deploy-dev-synol-be-ecAdminApi.js][BE]") — 이 함수가 찍는
   모든 로그 줄(사전 준비/전송/NAS 실행/Docker 빌드 단계번호) 앞에 그대로 붙는다. 여러 스크립트가
   순서대로 돌 때(deploy:dev-synol-full 등) 지금 이 줄이 어느 스크립트에서 나온 건지 바로
   구분하기 위함(2026-09-05). */
function withSsh(uploads, commands, tag = SELF_TAG) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    console.log(`${tag}[접속 시도] ssh://${USER}:${maskPassword(PASSWORD)}@${HOST}:${PORT}`);
    conn.on('ready', async () => {
      console.log(`${tag}[접속 성공] SSH 연결 완료 (${USER}@${HOST}:${PORT})`);
      try {
        if (uploads.length) {
          // 2026-09-05: 원격 대상 폴더가 수동 삭제 등으로 없어져 있을 수 있음 — SFTP 는
          // 자기가 알아서 폴더를 안 만들어주므로(없으면 "No such file"), 업로드 시도 전에
          // 항상 실경로 기준으로 mkdir -p 를 먼저 실행해서 보장해둔다. 이미 있으면 무해.
          const dirs = [...new Set(uploads.map((u) => path.posix.dirname(u.remote.replace(/\\/g, '/'))))];
          console.log(`\n${tag}[사전 준비] 업로드 대상 폴더 존재 보장 (mkdir -p)`);
          await new Promise((res, rej) => {
            conn.exec(`mkdir -p ${dirs.map((d) => `"${d}"`).join(' ')}`, (err, stream) => {
              if (err) return rej(err);
              let errOut = '';
              stream.on('data', () => {});
              stream.stderr.on('data', (d) => { errOut += d.toString(); process.stderr.write(d); });
              stream.on('close', (code) => {
                if (code !== 0) return rej(new Error(`mkdir -p 실패 (exit ${code}): ${errOut}`));
                res();
              });
            });
          });

          console.log(`\n${tag}[전송] SFTP 로 ${uploads.length}개 파일 업로드`);
          await new Promise((res, rej) => {
            conn.sftp((err, sftp) => {
              if (err) return rej(err);
              const next = (i) => {
                if (i >= uploads.length) return res();
                const { local, remote } = uploads[i];
                const sftpRemote = toSftpPath(remote);
                const sftpParent = path.posix.dirname(sftpRemote);
                console.log(`${tag}  ㄴ ${path.basename(local)} → ${remote}`);
                sftp.fastPut(local, sftpRemote, (e) => {
                  if (e) {
                    // 2026-09-05: "No such file" 같은 원문 메시지만으론 어디가 문제인지 알 수
                    // 없어서, 실제 시도한 경로(로컬/원격 실경로/SFTP 상대경로) + 에러 코드를
                    // 전부 보여주고, 그 상위 폴더가 이 SFTP 세션에서 실제로 보이는지까지
                    // readdir 로 한 번 더 확인해서 같이 붙여준다(권한/홈폴더제한 진단용).
                    sftp.readdir(sftpParent, (dirErr, list) => {
                      const parentInfo = dirErr
                        ? `  상위 폴더(${sftpParent}) 조회 실패: ${dirErr.message} (code: ${dirErr.code})\n` +
                          `    → 이 SFTP 세션에서 그 폴더 자체가 안 보입니다. DSM에서 이 계정의\n` +
                          `      "SFTP 사용자 홈 폴더로 제한" 옵션이 켜져 있거나(→ 꺼야 함),\n` +
                          `      해당 공유폴더에 대한 읽기/쓰기 권한이 없는 경우일 가능성이 큽니다.`
                        : `  상위 폴더(${sftpParent}) 안 실제 파일 목록: ${list.map((f) => f.filename).join(', ') || '(비어있음)'}\n` +
                          `    → 폴더는 보이는데 업로드만 실패 — 이 계정의 그 폴더 쓰기 권한을 확인하세요.`;
                      rej(new Error(
                        `SFTP 업로드 실패: ${e.message} (code: ${e.code})\n` +
                        `  로컬 파일:        ${local}\n` +
                        `  원격 실경로:      ${remote}\n` +
                        `  SFTP 상대경로:    ${sftpRemote}  (Synology SFTP는 /volume1 을 접속 루트로 취급 — 위 실경로에서 /volume1 을 뗀 경로)\n` +
                        parentInfo
                      ));
                    });
                    return;
                  }
                  next(i + 1);
                });
              };
              next(0);
            });
          });
        }

        for (const cmd of commands) {
          console.log(`\n${tag}[NAS 실행] ${cmd.label || cmd.cmd}`);
          await new Promise((res, rej) => {
            conn.exec(cmd.cmd, (err, stream) => {
              if (err) return rej(err);
              let out = '', errOut = '';
              // 2026-09-05: docker buildkit 진행 로그(#1, #2, ... #8 같은 빌드 단계 번호)가
              // 어느 스크립트/서비스에서 나온 건지 한눈에 안 보여서, 줄 단위로 버퍼링해 "#N"으로
              // 시작하는 줄만 "tag[#N] 나머지"로 다시 태그를 붙여준다. 나머지 줄(일반 출력)은 그대로.
              let lineBuf = '';
              const writeTagged = (dest, text) => {
                lineBuf += text;
                let idx;
                while ((idx = lineBuf.indexOf('\n')) !== -1) {
                  const line = lineBuf.slice(0, idx);
                  lineBuf = lineBuf.slice(idx + 1);
                  const m = line.match(/^(#\d+)\b(.*)$/);
                  dest.write(m ? `${tag}[${m[1]}]${m[2]}\n` : `${line}\n`);
                }
              };
              stream.on('data', (d) => { const s = d.toString(); out += s; writeTagged(process.stdout, s); });
              stream.stderr.on('data', (d) => { errOut += d.toString(); process.stderr.write(d); });
              stream.on('close', (code) => {
                if (lineBuf) { process.stdout.write(lineBuf); lineBuf = ''; } // 개행 없이 끝난 마지막 줄도 흘려보냄
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

module.exports = { ROOT, HOST, PORT, USER, PASSWORD, maskPassword, fail, requireCreds, toSftpPath, run, withSsh, hms };
