---
정책명: 메시지 발송 (메일/카카오/SMS/시스템알림)
정책번호: sy.16
관리자: 개발팀
최종수정: 2026-06-13
---

# 메시지 발송 (메일 / 카카오 / SMS / 시스템알림)

문의 접수 완료, 주문/배송 안내 등 업무 이벤트 발생 시 회원·관리자에게 **메일·카카오 알림톡·SMS·
시스템알림**을 발송하고 그 결과를 채널별 이력 테이블에 기록하는 공통 인프라 정책.

발송 기능은 BO·FO 어디서든 재사용되므로 **`co/cm` 레이어**(공통)에 채널별로 분리 구성한다.
기능을 어느 패키지에 두는지의 일반 기준은 [`base/base.기술-api.md`](../base/base.기술-api.md) §3.4-A / §4 참조.

---

## 1. 구성 개요

```
[업무 서비스]                        [발송 오케스트레이터]            [채널 서비스]              [이력 테이블]
FoCmContactService.submit() ──┐
(문의 저장 후 호출)            │
                              ▼
                     CmMsgSendService                ┌─ CmMailSendService  → syh_send_email_log
                     ├ 템플릿 조회(templateCode)     ├─ CmKakaoSendService → syh_send_msg_log (KAKAO)
                     ├ 파라미터 치환 {key}           ├─ CmSmsSendService   → syh_send_msg_log (SMS)
                     └ 채널 조합 ───────────────────┴─ CmAlarmSendService → sy_alarm + syh_alarm_send_hist
```

- **채널 서비스는 1 채널 1 책임**. 메일=`CmMailSendService`, 카카오=`CmKakaoSendService`,
  SMS=`CmSmsSendService`, 시스템알림=`CmAlarmSendService`.
- **오케스트레이터 `CmMsgSendService`** 가 템플릿 조회·치환과 채널 조합을 담당하며, 업무 시나리오별
  진입점(`sendContactReceived(...)`)과 범용 메서드(`sendMailByTemplate(...)` 등)를 제공한다.
- **컨트롤러 `CmMsgSendController`** — 수동/테스트·재발송용. `POST /api/co/cm/send/{mail,kakao,sms,alarm}`.

---

## 2. 발송 호출 규칙

- 업무 서비스(예: `FoCmContactService`)는 **자기 일(문의 저장)을 끝낸 뒤** `cmMsgSendService` 를 호출한다.
- 발송 호출은 **`try-catch` 로 감싼다** — 발송 실패가 본 업무(접수)를 깨면 안 된다.

```java
CmBlog saved = cmBlogRepository.save(entity);
// ... 저장 완료 후
try {
    cmMsgSendService.sendContactReceived(
        saved.getSiteId(), saved.getBlogId(),
        req.getName(), req.getEmail(), req.getTel(), req.getInquiryType());
} catch (Exception e) {
    log.error("[FoCmContact] 알림 발송 실패 (blogId={})", saved.getBlogId(), e); // 접수는 성공 처리
}
```

- 각 채널 서비스도 내부적으로 발송 실패를 삼키고 `SendResultVo.success=false` 로 반환한다(예외 미전파).
  → **한 채널이 실패해도 다른 채널·본 흐름에 영향 없음**.

---

## 3. 템플릿 / 파라미터 치환

- 템플릿은 `sy_template` 에 저장하며, **`templateCode` 로 조회**한다
  (`SyTemplateRepository.findFirstBySiteIdAndTemplateCodeAndUseYn(siteId, code, "Y")`).
- 본문/제목의 `{key}` 플레이스홀더를 `CmUtil.fillTemplate(template, params)` 로 치환한다.
- 발송 로그의 `params` 컬럼에는 `CmUtil.toJsonParams(params)` 로 직렬화해 저장.
- 템플릿이 없으면 채널 서비스/오케스트레이터의 **기본 문구(fallback)** 를 사용한다(발송은 계속 진행).

### 문의접수 알림 표준 템플릿

| templateCode | 유형(template_type_cd) | 용도 | path_id |
|---|---|---|---|
| `CONTACT_RECEIVED_MAIL` | EMAIL | 문의접수 완료 메일 | `template.메일` |
| `CONTACT_RECEIVED_KAKAO` | KAKAO | 문의접수 완료 알림톡 | `template.kakao알림톡` |
| `CONTACT_RECEIVED_ALARM` | EMAIL | 문의접수 시스템알림 | `template.시스템알림` |

치환 파라미터: `{name}`, `{inquiryType}`, `{email}`, `{tel}`.

---

## 4. 이력 테이블 (채널별 분리)

| 채널 | 이력 테이블 | 핵심 컬럼 |
|---|---|---|
| 메일 | `syh_send_email_log` | from_addr, to_addr, subject, result_cd, fail_reason, ref_type_cd/ref_id |
| 카카오·SMS | `syh_send_msg_log` | channel_cd(MSG_CHANNEL), recv_phone, content, kakao_tpl_code, result_cd, fail_reason |
| 시스템알림 | `syh_alarm_send_hist` (+ `sy_alarm`) | alarm_id(필수, sy_alarm FK), channel, send_to, send_hist_status_cd, error_msg |

- `syh_alarm_send_hist.alarm_id` 는 **NOT NULL** — 시스템알림 발송 시 `sy_alarm` 1건을 먼저 생성하고
  그 `alarm_id` 를 이력에 기록한다(`CmAlarmSendService` 가 처리).
- 발송결과 코드 `result_cd` = `SEND_RESULT` (SUCCESS/FAILED/PENDING).
- 발송이력 저장 자체가 실패해도 `log.error` 만 남기고 발송 흐름은 계속한다.

---

## 5. 코드 (sy_code)

| code_grp | 값 | 용도 |
|---|---|---|
| `MSG_CHANNEL` | EMAIL/SMS/KAKAO/PUSH | `syh_send_msg_log.channel_cd` 표시명 (BO 이력조회 JOIN 대상) ⭐ 2026-06-13 신규 |
| `SEND_RESULT` | SUCCESS/FAILED/PENDING | 발송결과 |
| `ALARM_CHANNEL` | EMAIL/SMS/KAKAO/PUSH | `sy_alarm.channel_cd` |
| `TEMPLATE_TYPE` | EMAIL/SMS/KAKAO/PUSH | `sy_template.template_type_cd` |

> ⚠️ `QSyhSendMsgLogRepositoryImpl` 이 채널명을 `MSG_CHANNEL` 코드그룹으로 JOIN 한다. 이 그룹이
> 비어 있으면 BO 이력조회 화면의 채널명이 공란이 된다(코드값 자체는 동작). 시드 필수.

---

## 6. 메일(SMTP) 설정

- 의존성: `build.gradle.kts` 에 `spring-boot-starter-mail` 추가.
- 설정: `application-dev.yml` `spring.mail.*` (Gmail `smtp.gmail.com:587`, STARTTLS) + 발신자 표기 `app.mail.from/from-nm`.
- 발송 본문은 HTML 지원(`MimeMessageHelper`, UTF-8). 본문에 태그가 없으면 줄바꿈을 `<br>` 로 변환.

### ⚠️ 운영 함정

| 증상 | 원인 | 해결 |
|---|---|---|
| `JavaMailSender 미설정` | starter-mail 추가 후 `bootJar` 만 실행 → `spring-context-support` jar 가 BOOT-INF/lib 에 미포함 | **`./gradlew clean build`** (clean 필수) |
| YAML `DuplicateKeyException: app` | dev.yml 에 기존 `app:`(license/redis) 블록이 있는데 mail 용 `app:` 을 별도 추가 | 기존 `app:` 블록에 `mail:` **병합** |
| `Authentication failed` | Gmail 일반 비밀번호 사용 | **2단계 인증 후 앱 비밀번호(16자리)** 발급 → `MAIL_PASSWORD` 주입. https://myaccount.google.com/apppasswords |

- **카카오 알림톡 / SMS 는 실 API 미연동** — 발송을 시도(이력 기록)만 하고 항상 `FAILED` 로 남긴다.
  실 연동 시 각 채널 서비스의 발송부만 교체하면 된다(이력 저장 구조는 그대로).

---

## 7. BO 이력조회 화면

- 메뉴: **시스템 > 이력조회 > 메시지발송이력** (`pageId=sySendMsgLog`, `SySendMsgLogMng.js`).
- 3탭: 📧 메일 / 💬 메시지(SMS·카카오) / 🔔 시스템알림. 탭별로 다른 API 호출, 행 클릭 시 발송 내용 펼침.
- BO 조회 컨트롤러(base 서비스 위임): `BoSyhSendEmailLogController` / `BoSyhSendMsgLogController` /
  `BoSyhAlarmSendHistController`. 엔드포인트 `GET /api/bo/sy/{send-email-log,send-msg-log,alarm-send-hist}/page`.
- `boApiSvc` 네임스페이스: `sySendEmailLog` / `sySendMsgLog` / `syAlarmSendHist`.

---

## 8. 관련 테이블

`syh_send_email_log`, `syh_send_msg_log`, `syh_alarm_send_hist`, `sy_alarm`, `sy_template`, `sy_code`

## 9. 관련 화면

| pageId | 라벨 |
|--------|------|
| `sySendMsgLog` | 메시지발송이력 |
| `syTemplateMng` | 템플릿관리 (발송 템플릿 CRUD) |

## 10. 관련 파일

- 백엔드: `co/cm/service/Cm{Mail,Kakao,Sms,Alarm,Msg}SendService.java`, `co/cm/controller/CmMsgSendController.java`,
  `co/cm/data/vo/{SendResultVo,MsgSendReq}.java`, `fo/ec/service/FoCmContactService.java`
- 프론트: `pages/bo/sy/SySendMsgLogMng.js`, `lib/services/boApiSvc.js`
- DDL/시드: `_doc/ddl_pgsql/migration_20260613_contact_send_seed.sql`

## 11. 제약사항

- 발송 호출은 항상 `try-catch` — 발송 실패가 본 업무 트랜잭션을 롤백시키지 않는다.
- 채널 서비스는 예외를 위로 던지지 않고 `SendResultVo.success=false` 로 반환한다.
- 발송 인프라(채널 서비스)는 **중복 구현 금지** — 업무 서비스는 `co/cm` 서비스를 주입해 호출한다.
- 시스템알림 이력은 `sy_alarm` 선생성이 전제(alarm_id NOT NULL).
