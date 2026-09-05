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
async function sendEmail(subject, text, tag) {
  const to = process.env.NOTIFY_EMAIL_TO;
  const from = process.env.NOTIFY_EMAIL_FROM;
  const appPassword = process.env.NOTIFY_EMAIL_APP_PASSWORD;
  if (!to || !from || !appPassword) {
    console.log(`${tag}[알림] 이메일 설정 없음(NOTIFY_EMAIL_*) — 스킵`);
    return;
  }
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: from, pass: appPassword },
    });
    await transporter.sendMail({ from, to, subject, text });
    console.log(`${tag}[알림] 이메일 발송 완료 → 수신: ${to} | 제목: ${subject}`);
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

/* [점검 안내] checkUrls: [{url, note}] → 사람이 배포 직후 클릭해서 바로 확인할 수 있는 URL 목록을
   코멘트와 함께 나열한 블록으로 포맷. 배포 스크립트마다 자기 대상에 맞는 URL/코멘트를 넘긴다
   (요청사항: "배포메일 보낼때 내용에 점검 안내도 같이 보내줘 — 각종 URL 정보가 나열되고 코멘트가
   있으면되"). */
function buildInspectionGuide(checkUrls) {
  if (!checkUrls || checkUrls.length === 0) return '';
  const lines = checkUrls.map((c) => `  - ${c.url}${c.note ? '  — ' + c.note : ''}`);
  return `\n\n📋 점검 안내\n${lines.join('\n')}`;
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
 * @param {string} [npmScript] 실행한 워크스페이스/스크립트명(예: 'deploy/ecFeBo' — cd deploy && npm run ecFeBo) — 제목 끝에 표시
 */
async function notifyDeployResult({ tag, scriptName, success, elapsed, detail, serverInfo, checkUrls, npmScript }) {
  const emoji = success ? '✅' : '❌';
  const statusText = success ? '성공' : '실패';
  const subject = `${emoji} [ShopJoy 배포] ${scriptName} ${statusText} (소요 ${elapsed})`
    + (npmScript ? ` — ${npmScript}` : '');
  const info = buildServerInfo(serverInfo);
  const guide = buildInspectionGuide(checkUrls);
  const text = `${scriptName} 배포 ${statusText}\n소요시간: ${elapsed}\n\n${detail || ''}${info}${guide}`;
  await Promise.all([
    sendEmail(subject, text, tag),
    sendSlack(`${subject}\n${detail || ''}${info}${guide}`, tag),
  ]);
}

module.exports = { notifyDeployResult };
