# 로컬 개발 — 로그 파일 경로 정책

## 핵심 정책

**모든 로그 파일은 워크스페이스 외부 절대경로(`C:/_logs/shopjoy`)에 기록.**
워크스페이스 안 (`_apps/EcAdminApi/logs/`) 에는 절대 쓰지 않는다.

## 배경 (왜 워크스페이스 밖에 쓰는가)

VSCode **Live Server** (Five Server 포함) 가 워크스페이스 내 파일 변경을 감지하여
브라우저를 자동 reload 한다. 백엔드(Spring Boot) 가 같은 워크스페이스 안에 있는
환경에서 logback `RollingFileAppender` 가 매 API 호출마다 `.log` 파일에 쓰면
다음 사이클이 발생한다:

```
API 호출 → logback FILE appender 가 .log 에 append
         → Live Server 의 file watcher 가 변경 감지
         → 브라우저에 reload 신호 전송
         → 페이지 reload (시각적으로 "깜빡임")
         → reload 직후 init data fetch 가 다시 API 호출
         → 다시 .log append …
```

이 사이클이 0.3 ~ 0.5 초 간격으로 반복되어 화면이 계속 깜빡이는 증상이 나타났다.

`.vscode/settings.json` 의 `liveServer.settings.ignoreFiles` 에 `**/*.log`,
`_apps/**`, `**/build/**`, `**/logs/**` 등이 등록되어 있어도 watcher 구현/플랫폼에
따라 우회되는 사례가 발생.

**근본 해결: 로그 자체를 워크스페이스 밖으로 빼서 watcher 가 도달하지 못하게 한다.**

## 적용 위치

### 1) `application-local.yml`, `application-dev.yml`

```yaml
logging:
  file:
    path: C:/_logs/shopjoy
```

### 2) `logback-spring.xml`

`LOG_DIR` 의 defaultValue 도 같은 경로로 통일:

```xml
<springProperty scope="context" name="LOG_DIR"
                source="logging.file.path" defaultValue="C:/_logs/shopjoy"/>
```

`local`, `dev` 프로파일의 root 는 CONSOLE + ASYNC_FILE + ASYNC_ERR 모두 사용
가능 (워크스페이스 밖이라 reload 루프 없음).

## 디렉토리 구조

```
C:/_logs/shopjoy/
├─ ecadminapi.log                   ← APP 로그 (롤링)
├─ ecadminapi-error.log             ← ERROR 전용
└─ archived/
   ├─ ecadminapi.2026-05-08.0.log.gz
   └─ ecadminapi-error.2026-05-08.0.log.gz
```

`C:/_logs/` 디렉토리는 자동 생성되지만, 권한 문제 발생 시 한 번 수동 생성:

```cmd
mkdir C:\_logs\shopjoy
```

## prod 환경

`prod` 프로파일은 본 정책 적용 안 함. 기존대로 `application-prod.yml` 에 명시된
경로 (운영 서버의 `/var/log/shopjoy` 등) 사용.

## 함께 점검할 항목

- `.vscode/settings.json` 의 `liveServer.settings.ignoreFiles` 에 다음 패턴이
  여전히 포함되어 있어야 한다 (2차 방어선):
  - `_apps/**`
  - `**/*.log`
  - `**/logs/**`
  - `**/build/**`
- 워크스페이스 안에 `_apps/EcAdminApi/logs/` 또는 `_apps/EcAdminApi/LOG_DIR_IS_UNDEFINED/`
  같은 디렉토리가 새로 생기면 어딘가에서 상대경로로 로그가 쓰이고 있다는 신호.
  즉시 점검:
  1. 활성 프로파일 확인 (`-Dspring.profiles.active=local|dev|prod`)
  2. application-{profile}.yml 의 `logging.file.path` 값 확인
  3. logback-spring.xml 의 `LOG_DIR` 해석 결과 확인 (statusListener 로 출력 가능)

## 발견 이력

- 2026-05-08: F5 직후가 아닌 **계속되는** 0.5초 주기 깜빡임 증상 추적.
  Frontend 의 watch/computed/reactive 가 아닌 **백엔드 로그 파일 적재** 가 진짜 트리거였음.
  - `_apps/EcAdminApi/logs/ecadminapi.log` 매 API 호출마다 갱신
  - `_apps/EcAdminApi/LOG_DIR_IS_UNDEFINED/` 디렉토리는 logback 의 `LOG_DIR`
    해석 실패로 fallback 생성된 것으로 추정
  - 해결: `logging.file.path` 와 logback `LOG_DIR` defaultValue 모두
    `C:/_logs/shopjoy` 절대경로로 변경.
