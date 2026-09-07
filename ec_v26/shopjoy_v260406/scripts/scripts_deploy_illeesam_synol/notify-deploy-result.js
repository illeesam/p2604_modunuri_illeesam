/* notify-deploy-result.js — deploy-dev-synol-*.js 가 성공/실패 결과를 이메일+Slack 으로 통지할 때
 * 공유하는 모듈(직접 실행 대상 아님). 자격정보가 하나라도 없는 채널은 그 채널만 조용히 스킵하고,
 * 발송 자체가 실패해도(네트워크 오류 등) 절대 예외를 던지지 않는다 — 알림 실패가 배포 실패로
 * 이어지면 안 되기 때문에 모든 오류를 여기서 삼키고 경고만 남긴다.
 *
 * scripts/.synology-deploy.env(git 커밋 금지, .gitignore 처리됨)에 아래 값을 추가해야 실제로 발송된다:
 *   NOTIFY_EMAIL_TO           — 받는 사람 이메일(예: illeesam@gmail.com)
 *   NOTIFY_EMAIL_FROM         — 보내는 Gmail 주소(SMTP 인증 계정 — 받는 사람과 같아도/달라도 무방)
 *   NOTIFY_EMAIL_APP_PASSWORD — 그 Gmail 계정의 "앱 비밀번호"(일반 로그인 비밀번호 아님!) —
 *                                 https://myaccount.google.com/apppasswords 에서 발급(2단계 인증 필수)
 *   NOTIFY_SLACK_WEBHOOK_URL  — Slack Incoming Webhook URL
 *                                 (Slack 워크스페이스 → Apps → Incoming Webhooks 추가 → 채널 선택 → URL 복사)
 * (이미 환경변수로 NOTIFY_* 가 설정돼 있으면 그 값이 우선한다 — CI 등에서 재사용 가능.)
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ENV_FILE = path.join(__dirname, '.synology-deploy.env');

/* synology-deploy-util.js 의 loadLocalEnv() 와 동일 로직 — 이 파일은 그쪽을 require 하지 않고
   독립적으로 두어서(순환 의존 없음) deploy 스크립트가 어느 순서로 require 하든 안전하다. */
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

/* [이메일] nodemailer 는 devDependencies 에 있어야 함(package.json). Gmail SMTP + 앱 비밀번호 방식 —
   일반 로그인 비밀번호로는 Google 이 SMTP 인증을 거부한다(보안 정책상 앱 비밀번호 필수). */
// 2026-09-06(요청사항: "scripts 실행결과 메일보낼때 진행중인내용의 log 파일도 첨부해줘") —
// logFilePath 가 있고 실제로 읽을 수 있으면 이메일에 그대로 첨부한다. 파일이 없거나 너무 커서
// (Gmail 첨부 25MB 제한) 실패해도 이메일 발송 자체가 막히면 안 되므로, 첨부 준비 단계 자체를
// try/catch 로 감싸 실패 시 첨부 없이 발송을 계속한다.
async function sendEmail(subject, text, tag, logFilePath) {
  const to = process.env.NOTIFY_EMAIL_TO;
  const from = process.env.NOTIFY_EMAIL_FROM;
  const appPassword = process.env.NOTIFY_EMAIL_APP_PASSWORD;
  if (!to || !from || !appPassword) {
    console.log(`${tag}[알림] 이메일 설정 없음(NOTIFY_EMAIL_*) — 스킵`);
    return;
  }
  // 2026-09-06(요청사항: "테스트 끝나고 약간의 시간을두고 3~5초 후 메일보내면 어떨까?") —
  // synology-deploy-util.js 의 로그 파일은 fs.createWriteStream 이 비동기로 디스크에 플러시한다
  // (console.log 후킹이 stream.write() 를 호출하는 시점 ≠ 실제로 디스크에 반영되는 시점). 배포
  // 마지막 줄(헬스체크/URL 안내 등)을 찍자마자 바로 이 파일을 첨부로 읽으면, 아직 디스크에 다
  // 안 내려간 상태를 읽어 실제 로그 파일보다 몇 줄 짧게 잘린 첨부가 되는 경합이 있었다(실측
  // 확인 — 메일 첨부는 "Slack 설정 없음" 줄에서 끊기는데 실제 파일엔 그 뒤로 "이메일 발송..."
  // 까지 더 있었음). 짧게 대기해 흘려보낸다.
  await new Promise((r) => setTimeout(r, 4000));

  let attachments;
  try {
    if (logFilePath && fs.existsSync(logFilePath)) {
      attachments = [{ filename: path.basename(logFilePath), path: logFilePath }];
    }
  } catch (e) {
    console.warn(`${tag}[알림] ⚠ 로그 파일 첨부 준비 실패(첨부 없이 계속): ${e.message}`);
  }
  // 2026-09-06(요청사항: "'이메일 발송 완료' 문구가 '이메일 발송'이 되겠지") — "발송 완료"는
  // 그 자체가 "방금 첨부한 파일" 안에는 절대 들어갈 수 없다(파일을 읽어 보낸 다음에야 쓰이는
  // 줄이라 시간 순서상 불가능). 그래서 첨부에 실제로 남도록 발송 시도 "직전"에 남기고, 문구도
  // 완료형이 아닌 진행형으로 바꾼다 — 진짜 성공/실패 결과는 아래 catch 의 실패 로그(또는 이
  // 함수가 예외 없이 끝났다는 사실)로 다음 실행 로그에서 확인.
  console.log(`${tag}[알림] 이메일 발송 → 수신: ${to} | 제목: ${subject}${attachments ? ` | 첨부: ${attachments[0].filename}` : ''}`);
  // 위 로그 줄이 실제 디스크로 흘러나갈 최소한의 여유(짧게) — 그래야 그 줄까지 포함된 상태의
  // 파일이 첨부된다.
  await new Promise((r) => setTimeout(r, 300));

  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: from, pass: appPassword },
    });
    await transporter.sendMail({ from, to, subject, text, ...(attachments ? { attachments } : {}) });
  } catch (e) {
    console.warn(`${tag}[알림] ⚠ 이메일 발송 실패(무시하고 계속 — 배포 결과에는 영향 없음): ${e.message}`);
  }
}

/* [Slack] Incoming Webhook — 별도 라이브러리 없이 Node 내장 https 로 JSON POST. */
function sendSlack(text, tag) {
  const url = process.env.NOTIFY_SLACK_WEBHOOK_URL;
  if (!url) {
    console.log(`${tag}[알림] Slack 설정 없음(NOTIFY_SLACK_WEBHOOK_URL) — 스킵`);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    try {
      const body = JSON.stringify({ text });
      const u = new URL(url);
      const req = https.request(
        {
          hostname: u.hostname,
          path: u.pathname + u.search,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
          timeout: 10000,
        },
        (res) => {
          res.on('data', () => {});
          res.on('end', () => {
            if (res.statusCode === 200) console.log(`${tag}[알림] Slack 발송 완료`);
            else console.warn(`${tag}[알림] ⚠ Slack 발송 실패(HTTP ${res.statusCode}) — 무시하고 계속`);
            resolve();
          });
        }
      );
      req.on('timeout', () => { req.destroy(); console.warn(`${tag}[알림] ⚠ Slack 발송 타임아웃 — 무시하고 계속`); resolve(); });
      req.on('error', (e) => { console.warn(`${tag}[알림] ⚠ Slack 발송 실패(무시하고 계속): ${e.message}`); resolve(); });
      req.write(body);
      req.end();
    } catch (e) {
      console.warn(`${tag}[알림] ⚠ Slack 발송 실패(무시하고 계속): ${e.message}`);
      resolve();
    }
  });
}

// 2026-09-06(요청사항: "URL 점검 결과도 우측에 표시해줘") — synology-deploy-util.js 의
// checkUrlStatus 와 동일 로직을 여기 독립적으로 둔다(위 loadLocalEnv 와 같은 이유 — 이 파일은
// 순환 의존 없이 독립 유지하는 설계라 import 대신 중복 구현).
function checkUrlStatus(url) {
  return new Promise((resolve) => {
    let u;
    try { u = new URL(url); } catch (e) { return resolve('error(bad-url)'); }
    const lib = u.protocol === 'https:' ? require('https') : require('http');
    const req = lib.get({ hostname: u.hostname, port: u.port || undefined, path: u.pathname + u.search, timeout: 8000 }, (res) => {
      res.resume();
      resolve(String(res.statusCode));
    });
    req.on('timeout', () => { req.destroy(); resolve('timeout'); });
    req.on('error', (e) => resolve(`error(${e.code || e.message})`));
  });
}

// 2026-09-08(요청사항: "302면 응답은 왔다는거네 X 표시보다 좀더 부드러운 표현으로 변경해줘 /
// X는 500 오류처럼 완전 실패의 의미로 정해주고 / 200 || 302 이거 외 / 그 외에 코드들도
// 추가해줘 / 다른것들도 마찬가지") — synology-deploy-util.js 의 statusBadge() 와 동일 로직을
// 여기 독립적으로 둔다(위 checkUrlStatus 와 같은 이유 — 순환 의존 없이 독립 유지).
//   ✅ 2xx           — 완전 정상
//   ⚠ 3xx/4xx        — 응답은 왔음(리다이렉트·인증필요 등) — 완전 실패 아님
//   ❌ 5xx 또는 무응답 — timeout/error(...)/5xx 만 완전 실패로 취급
function statusBadge(status) {
  if (/^2\d\d$/.test(status)) return `✅ ${status}`;
  if (/^[34]\d\d$/.test(status)) return `⚠ ${status}`;
  return `❌ ${status}`;
}

/* [점검 안내] checkUrls: [{url, note}] → 사람이 배포 직후 클릭해서 바로 확인할 수 있는 URL 목록을
   코멘트와 함께 나열한 블록으로 포맷. 배포 스크립트마다 자기 대상에 맞는 URL/코멘트를 넘긴다
   (요청사항: "배포메일 보낼때 내용에 점검 안내도 같이 보내줘 — 각종 URL 정보가 나열되고 코멘트가
   있으면되"). 2026-09-06(요청사항: "URL 점검 결과도 우측에 표시해줘") — 각 URL을 실제로 curl
   체크해서 statusBadge() 결과를 URL 오른쪽(코멘트 왼쪽)에 붙인다. */
async function buildInspectionGuide(checkUrls) {
  if (!checkUrls || checkUrls.length === 0) return '';
  const statuses = await Promise.all(checkUrls.map((c) => checkUrlStatus(c.url)));
  const width = Math.max(...checkUrls.map((c) => c.url.length));
  const lines = checkUrls.map((c, i) => {
    const badge = statusBadge(statuses[i]);
    return `  - ${c.url.padEnd(width)}  ${badge}${c.note ? '  — ' + c.note : ''}`;
  });
  // 2026-09-06(요청사항: "점검 url 별 한줄씩 공백란 띄워줘") — URL이 다닥다닥 붙어 있으면
  // 읽기 힘들어 항목 사이에 빈 줄을 하나씩 넣는다.
  return `\n\n📋 점검 안내\n${lines.join('\n\n')}`;
}

/* [서버/환경 정보] serverInfo: [{label, value}] → 어느 서버에 뭐가 어디로 배포됐는지(호스트, 설치
   경로, 컨테이너명, 프로파일, DB 등) 한 블록으로 정리. 요청사항: "서버정보 및 설치 경로정보도
   추가해줘" / "주요 환경정보도 있으면 좋겠어". checkUrls 와 마찬가지로 배포 스크립트가 자기
   대상에 맞는 항목을 넘긴다. */
function buildServerInfo(serverInfo) {
  if (!serverInfo || serverInfo.length === 0) return '';
  const lines = serverInfo.map((it) => `  - ${it.label}: ${it.value}`);
  return `\n\n🖥 서버/환경 정보\n${lines.join('\n')}`;
}

/* [NAS 배포 URL 표] — FO/BO/ecBeBo/ecBeCdn × 포트/서브도메인/gateway 3가지 접속 방식 전체를
 * 어느 배포 스크립트를 실행했든 이메일/Slack 본문에 항상 동일하게 붙인다(요청사항: "모든 첨부란에
 * NAS 배포 URL 정보 다 추가해줘" — FO 푸터/BO 사이드바/ecBeBo·ecBeCdn 운영화면에 이미 떠 있는
 * "🔗 NAS 배포 URL" 팝업과 같은 URL 목록을, 배포 결과 이메일 본문에도 넣어달라는 요청).
 * URL 값은 그 팝업들(apps/ecFeBo/components/layout/foAppFooter.js 의 DEPLOY_LINKS 등)과 반드시
 * 동일하게 유지 — 한쪽만 바뀌면 서로 어긋나므로, 포트/도메인 구성이 바뀌면 양쪽 다 같이 고칠 것. */
const DEPLOY_LINKS_HOST = 'illeesam.synology.me';
// 2026-09-06(요청사항: "FO 에 끝에 / 는 빼줘") — FO 만 경로가 없어(루트) 다른 항목과 달리
// 끝에 '/' 가 남아있던 것 제거.
// 2026-09-06(요청사항: "/index.html 은 자동 인식되게 하면 될거 같은데 안되면 알려줘") — 처음엔
// Spring Boot 정적 리소스 서빙엔 nginx의 index 지시어 같은 자동 인식이 없어(welcome-page 자동
// 인식은 루트 "/" 한정) /home, /admin-tools 단독으로는 404/500 이었다. ecBeBo/ecBeCdn 에
// StaticIndexRedirectController(static/{dir}/index.html 존재 시 리다이렉트, 이름 하드코딩 없어
// 향후 /portal 등 추가돼도 그대로 커버) 를 추가하고, 게이트웨이 프록시 헤더(X-Forwarded-Host/
// Proto 가 비표준 포트·서브도메인 HTTPS 에서 유실되던 버그)까지 고쳐서 이제 전부 index.html
// 없이도 정상 동작(실측 200 확인) — 그래서 아래 4개도 짧은 형태로 통일.
const DEPLOY_LINKS = {
  FO:      { 포트: `http://${DEPLOY_LINKS_HOST}:22000`,           서브도메인: `https://22000.${DEPLOY_LINKS_HOST}`,           gateway: `http://${DEPLOY_LINKS_HOST}:22099` },
  BO:      { 포트: `http://${DEPLOY_LINKS_HOST}:22000/bo.html`,   서브도메인: `https://22000.${DEPLOY_LINKS_HOST}/bo.html`,   gateway: `http://${DEPLOY_LINKS_HOST}:22099/bo.html` },
  ecBeBo:  { 포트: `http://${DEPLOY_LINKS_HOST}:22300/home`,      서브도메인: `https://22300.${DEPLOY_LINKS_HOST}/home`,      gateway: `http://${DEPLOY_LINKS_HOST}:22099/admin-tools` },
  ecBeCdn: { 포트: `http://${DEPLOY_LINKS_HOST}:22400/home`,      서브도메인: `https://22400.${DEPLOY_LINKS_HOST}/home`,      gateway: `http://${DEPLOY_LINKS_HOST}:22099/cdn-admin` },
};
function buildDeployLinksTable() {
  const lines = ['🔗 NAS 배포 URL', ''];
  Object.entries(DEPLOY_LINKS).forEach(([app, rows]) => {
    Object.entries(rows).forEach(([label, url]) => {
      lines.push(`${app} - ${label} : ${url}`);
    });
    lines.push('');
  });
  lines.pop(); // 마지막 그룹 뒤 불필요한 빈 줄 제거
  return `\n\n${lines.join('\n')}`;
}

/**
 * notifyDeployResult — 배포 성공/실패 결과를 이메일+Slack 양쪽에 best-effort 로 통지.
 * 자격정보가 없는 채널은 조용히 스킵되고, 이 함수 자체는 절대 예외를 던지지 않는다
 * (배포 스크립트의 catch 블록/성공 경로 마지막에서 await 로 호출 — 알림 실패가 배포의
 * 최종 성공/실패 판정(exit code)에 영향을 주면 안 되기 때문).
 *
 * @param {string} tag        해당 배포 스크립트의 로그 태그(예: '[deploy-dev-synol-be-ecBeBo.js][BE]')
 * @param {string} scriptName 사람이 읽을 배포 대상 이름(예: '백엔드(EcAdminApi)')
 * @param {boolean} success   성공 여부
 * @param {string} elapsed    소요시간 문자열(MM:SS)
 * @param {string} [detail]   추가 상세(헬스체크 결과, 에러 메시지 등) — 여러 줄 가능
 * @param {Array<{label:string, value:string}>} [serverInfo] 서버/설치경로/환경 정보 항목 목록
 * @param {Array<{url:string, note?:string}>} [checkUrls] 점검 안내로 나열할 URL + 코멘트 목록
 * @param {string} [npmScript] 실행한 워크스페이스/스크립트명(예: 'deploy/ecFeBo' — cd deploy && npm run "apps DEPLOY ecFeBo-22000 (nginx-vue3cdn)") — 제목 끝 + 본문에 표시
 * @param {string} [logFilePath] 이번 실행의 로그 파일 전체경로(synology-deploy-util.js 의 LOG_FILE_PATH)
 *                                — 있으면 이메일에 그대로 첨부(요청사항: "scripts 실행결과 메일보낼때
 *                                진행중인내용의 log 파일도 첨부해줘")
 */
async function notifyDeployResult({ tag, scriptName, success, elapsed, detail, serverInfo, checkUrls, npmScript, logFilePath }) {
  const emoji = success ? '✅' : '❌';
  const statusText = success ? '성공' : '실패';
  // 2026-09-06(요청사항: "무지개 아이콘 추가해줘 🌈✅[ShopJoy] [배포] ecBeGateway 성공") —
  // 앞머리에 🌈 고정 + "[ShopJoy 배포]" 한 덩어리였던 걸 "[ShopJoy] [배포]" 두 덩어리로 분리.
  const subject = `🌈${emoji}[ShopJoy] [배포] ${scriptName} ${statusText} (소요 ${elapsed})`
    + (npmScript ? ` — ${npmScript}` : '');
  const info = buildServerInfo(serverInfo);
  const guide = await buildInspectionGuide(checkUrls);
  const links = buildDeployLinksTable();
  // 2026-09-06(요청사항: "내용에 실행스크립트명도 적어줘") — 제목에도 있지만 본문 첫머리에도
  // 명시해 메일만 봐도 어느 스크립트를 실행한 결과인지 바로 알 수 있게 한다.
  const scriptLine = npmScript ? `실행 스크립트: ${npmScript}\n` : '';
  const logLine = logFilePath ? `로그 파일: ${path.basename(logFilePath)} (첨부${fs.existsSync(logFilePath) ? '됨' : ' 시도 — 파일 없음'})\n` : '';
  const text = `${scriptName} 배포 ${statusText}\n${scriptLine}${logLine}소요시간: ${elapsed}\n\n${detail || ''}${info}${guide}${links}`;
  await Promise.all([
    sendEmail(subject, text, tag, logFilePath),
    sendSlack(`${subject}\n${scriptLine}${detail || ''}${info}${guide}`, tag),
  ]);
}

module.exports = { notifyDeployResult };
