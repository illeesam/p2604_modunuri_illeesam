/* synology-deploy-util.js — deploy-dev-synol-be-ecBeBo.js / deploy-dev-synol-fe-ecFeBo.js 가 공유하는
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
const { spawn } = require('child_process');
const { Client } = require('ssh2');

const ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(__dirname, '.synology-deploy.env');

// ═══════════════════════════════════════════════════════════════════════
//  콘솔 출력 → 파일 로그 (2026-09-06 신설, 요청사항: "스크립트 실행하면 콘솔출력정보
//  로그로 기록 가능하나?")
//
//  apps/scripts_logs/{YYYYMMDD}_{HHmmss}_{npm 스크립트명}.log 에 그대로 기록한다. 이 파일이
//  synology-deploy-util.js 를 require 하는 모든 스크립트(deploy/deploy-dev-synol-*.js,
//  manage-dev-synol.js)가 로드되는 시점에 자동으로 켜진다 — 개별 스크립트가 따로 뭘 더
//  안 해도 된다. 파일명의 스크립트명은 process.env.npm_lifecycle_event(= npm 이 "npm run
//  <이름>" 실행 시 자동으로 심어주는 그 <이름> 자체 — 워크스페이스에서 실행해도 워크스페이스
//  쪽 스크립트명이 그대로 들어온다, 예: "ecBeRedis")를 쓰고, ':' 는 파일명에 못 쓰는 문자라
//  '-' 로 바꾼다 — node 로 직접 실행해서 이 값이 없으면 실행 파일명(확장자 제외)으로 대체한다.
//
//  process.stdout.write/process.stderr.write 를 직접 후킹한다(console.log/error 도 내부적으로
//  이 두 함수를 거치므로 자동 포함) — withSsh() 가 SSH 원격 명령 출력을 process.stdout.write로
//  직접 흘려보내는 부분(Docker 빌드 진행률 등)까지 전부 로그 파일에 남기기 위해서다. 단,
//  run()(Gradle/npm 빌드처럼 로컬에서 도는 명령)은 이 후킹 이후로도 계속 잡히도록 execSync
//  의 stdio:'inherit'(OS 파일디스크립터 직접 상속 — JS 후킹을 건너뜀) 대신 spawn 으로 받아
//  수동으로 process.stdout/stderr 에 다시 흘려보내는 방식으로 바꿨다(아래 run() 참조).
// ═══════════════════════════════════════════════════════════════════════
const LOG_DIR = path.join(ROOT, 'scripts_logs');

function initFileLog() {
  try {
    const d = new Date();
    const p2 = (n) => String(n).padStart(2, '0');
    const dateStr = `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}`;
    const stamp = `${dateStr}_${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;
    // 날짜별 하위 폴더(apps/scripts_logs/YYYYMMDD/)로 묶는다 — 파일이 계속 쌓여도 스크립트
    // 여러 개 x 날짜 여러 날치가 한 폴더에 뒤섞이지 않게(요청사항).
    const dayDir = path.join(LOG_DIR, dateStr);
    if (!fs.existsSync(dayDir)) fs.mkdirSync(dayDir, { recursive: true });
    // 2026-09-06: npm_lifecycle_event 단독 의존 폐기 — deploy/stop/delete/ps 4개 워크스페이스가
    // 전부 같은 짧은 스크립트명(예: "ecGateway")을 쓰게 되면서 npm_lifecycle_event 만으로는
    // 로그 파일명에서 "이게 stop 인지 ps 인지"가 안 드러나는 문제가 생겼다(요청사항: "ps 는
    // 로그파일 안남기네" — 실제로는 남지만 파일명만 보고 구분이 안 됐던 것). 실행 파일 자체
    // (process.argv[1] — manage-dev-synol.js 는 항상 이 이름 그대로) + 실제 전달된 인자
    // (action/app 등, "-"로 시작하는 플래그는 제외)를 조합해서 파일명을 만든다 — npm 워크스페이스
    // 경유든 node 직접 실행이든 process.argv 는 동일하므로 어느 경로로 실행해도 같은 결과.
    const argExtras = process.argv.slice(2).filter((a) => a && !a.startsWith('-'));
    const baseName = path.basename(process.argv[1] || 'unknown', '.js');
    const scriptName = (argExtras.length ? `${baseName}-${argExtras.join('-')}` : baseName).replace(/:/g, '-');
    const logPath = path.join(dayDir, `${stamp}_${scriptName}.log`);
    const stream = fs.createWriteStream(logPath, { flags: 'a' });

    // 터미널 색상 코드(ANSI escape)는 콘솔에만 의미가 있고 텍스트 에디터로 로그를 열어볼 땐
    // 깨진 문자로만 보이므로 파일 기록 전에 제거한다(콘솔 출력 자체는 원본 그대로 유지).
    const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');

    const origStdoutWrite = process.stdout.write.bind(process.stdout);
    const origStderrWrite = process.stderr.write.bind(process.stderr);
    process.stdout.write = (chunk, ...args) => {
      stream.write(stripAnsi(chunk.toString()));
      return origStdoutWrite(chunk, ...args);
    };
    process.stderr.write = (chunk, ...args) => {
      stream.write(stripAnsi(chunk.toString()));
      return origStderrWrite(chunk, ...args);
    };
    process.on('exit', () => { try { stream.end(); } catch (e) { /* 종료 직전이라 실패해도 무해 */ } });

    origStdoutWrite(`[로그파일] ${logPath}\n`);
    return logPath;
  } catch (e) {
    // 로그 파일 기록에 실패해도(디스크 권한 등) 배포 자체는 계속 진행돼야 하므로 콘솔에만 경고.
    console.error(`[synology-deploy-util.js] ⚠ 파일 로그 초기화 실패(배포는 계속 진행): ${e.message}`);
    return null;
  }
}
const LOG_FILE_PATH = initFileLog();

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
// run()/fail() 은 호출부(deploy-dev-synol-be-ecBeBo.js 등)가 자기 TAG 를 3번째 인자로 넘겨주면
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
  // *** 마스킹) — deploy/ 워크스페이스의 zmulti-* 처럼 여러 스크립트가 순서대로 실행될 때, 각
  // 단계가 실제로 어떤 host/port/계정을 쓰는지 헷갈리지 않게 하기 위함.
  console.log(`${tag}[접속정보] HOST=${HOST} PORT=${PORT} USER=${USER} PASSWORD=${maskPassword(PASSWORD)}`);
}

/* SFTP 는 Synology 특성상 /volume1 을 접속 루트(/)로 취급한다 — 실경로에서 /volume1 을 뗀
   경로로 SFTP 를 호출해야 한다(SSH exec 명령은 반대로 실경로 /volume1/... 을 그대로 씀). */
function toSftpPath(realPath) {
  return realPath.replace(/^\/volume1/, '');
}

// 2026-09-06: execSync(stdio:'inherit') → spawn(stdio:'pipe') + 수동 재출력으로 변경.
// 'inherit'는 OS 파일디스크립터를 자식 프로세스에 직접 물려줘서 위 initFileLog() 의
// process.stdout/stderr.write 후킹을 건너뛴다 — 그래서 Gradle/npm 빌드 출력이 파일 로그에
// 하나도 안 남는 문제가 있었다. spawn 으로 받아 우리가 process.stdout/stderr 에 다시 써주면
// 그 후킹을 그대로 통과하면서(=파일에도 자동 기록) 화면에는 기존과 동일하게 실시간으로 보인다.
// Promise 를 반환하므로 호출부는 반드시 await 할 것(순서 보장 + 실패 시 예외 전파).
function run(cmd, cwd, tag = SELF_TAG) {
  console.log(`${tag}   $ ${cmd}`);
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, { cwd: cwd || ROOT, shell: true, stdio: ['inherit', 'pipe', 'pipe'] });
    child.stdout.on('data', (d) => process.stdout.write(d));
    child.stderr.on('data', (d) => process.stderr.write(d));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error(`명령 실패(exit ${code}): ${cmd}`));
      resolve();
    });
  });
}

/* SSH 연결 하나를 열고, sftpPut(여러 건) → exec(순차 여러 명령) 을 차례로 수행한 뒤 닫는다.
   tag: 호출한 스크립트를 식별하는 접두어(예: "[deploy-dev-synol-be-ecBeBo.js][BE]") — 이 함수가 찍는
   모든 로그 줄(사전 준비/전송/NAS 실행/Docker 빌드 단계번호) 앞에 그대로 붙는다. 여러 스크립트가
   순서대로 돌 때(deploy/ 워크스페이스의 npm run zmulti-ecBeBo-ecBeCdn 등) 지금 이 줄이 어느 스크립트에서 나온 건지 바로
   구분하기 위함(2026-09-05). */
function withSsh(uploads, commands, tag = SELF_TAG) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    console.log(`${tag}[접속 시도] ssh://${USER}:${maskPassword(PASSWORD)}@${HOST}:${PORT}`);
    // 2026-09-06: 실제로 이 컴퓨터가 (ssh2 라이브러리로 프로그래밍 방식으로) 맺는 접속과 동등한
    // OpenSSH 커맨드라인을 한 줄 더 남긴다(요청사항: "ssh 명령들도 다 남겨야해") — 사람이 문제
    // 재현/직접 접속해서 확인하고 싶을 때 그대로 복붙 가능하게. 비밀번호는 이 라이브러리가 코드로
    // 직접 넘기므로 커맨드라인에 실릴 필요 자체가 없다 — 그래서 아예 표시 대상에서 뺀다(마스킹이
    // 아니라 "이 자리엔 원래 없다"는 것). 아래 "▶️" 접두는 [NAS 실행] 블록의 실제 명령 표기와
    // 통일된 표기.
    console.log(`${tag} ▶️  ssh -p ${PORT} ${USER}@${HOST}  (비밀번호는 코드로 직접 전달 — 커맨드라인에 없음)`);
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
          // 2026-09-06: 지금까지 label 이 있으면 실제 실행된 명령(cmd.cmd) 자체는 로그에 전혀
          // 안 남았다 — "어떤 명령을 수행한 건지 파악하고 싶다"는 요청사항. label 유무와 무관하게
          // 항상 실제 명령을 "▶️ " 접두로 한 줄 더 남긴다(label 없을 때는 위 줄과 같아 중복이라 생략).
          if (cmd.label) console.log(`${tag} ▶️  ${cmd.cmd}`);
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
