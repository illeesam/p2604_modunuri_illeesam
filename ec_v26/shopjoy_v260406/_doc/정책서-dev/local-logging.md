# 로컬 개발 — 로그 파일 경로 정책

## 핵심 정책

**모든 로그 파일은 워크스페이스 외부 절대경로(`C:/_logs/shopjoy/{앱이름}/`)에 기록.**
워크스페이스 안 (`apps/EcBeBo/logs/`) 에는 절대 쓰지 않는다.

2026-09-06: 앱별 하위폴더로 재구조화(요청사항: "로컬의 로그정보 logs/* 폴더에 넣으면
좋겠는데") — 이전엔 EcBeBo/EcBeCdn 이 `C:/_logs/shopjoy/` 한 폴더를 파일명(`ecbebo.log`
vs `ecbecdn.log`)으로만 구분해 같이 썼다. "워크스페이스 밖"이라는 핵심 원칙(아래 배경 참조)은
그대로 유지하면서, `C:/_logs/shopjoy/ecBeBo/`, `C:/_logs/shopjoy/ecBeCdn/` 처럼 앱마다
폴더를 분리했다.

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

### 1) `application-local.yml` (앱마다 자기 이름으로 된 하위폴더)

```yaml
# EcBeBo
logging:
  file:
    path: C:/_logs/shopjoy/ecBeBo

# EcBeCdn
logging:
  file:
    path: C:/_logs/shopjoy/ecBeCdn
```

> `application-dev.yml` 은 이 정책 대상이 아니다 — dev 는 실제로 NAS Docker 컨테이너 안에서
> 도는 게 정상 경로라 `/app/logs`(컨테이너 내부 경로, docker-compose 볼륨마운트로 실제 호스트
> `logs/ecBeBoLogs` 등에 연결) 를 그대로 쓴다. 로컬 PC에서 `dev` 프로파일로 직접 bootRun 하는
> 경우는 DB/Redis/CDN 만 dev NAS 걸 그대로 쓰는 것이지 로그 경로까지 그럴 필요는 없다 —
> 혼동하지 말 것.

### 2) `logback-spring.xml`

`LOG_DIR` 의 defaultValue 도 같은 경로로 통일 (앱마다 자기 폴더):

```xml
<!-- EcBeBo -->
<springProperty scope="context" name="LOG_DIR"
                source="logging.file.path" defaultValue="C:/_logs/shopjoy/ecBeBo"/>

<!-- EcBeCdn -->
<springProperty scope="context" name="LOG_DIR"
                source="logging.file.path" defaultValue="C:/_logs/shopjoy/ecBeCdn"/>
```

`local`, `dev` 프로파일의 root 는 CONSOLE + ASYNC_FILE + ASYNC_ERR 모두 사용
가능 (워크스페이스 밖이라 reload 루프 없음).

## 디렉토리 구조 (2026-09-06 앱별 하위폴더로 재구조화)

```
C:/_logs/shopjoy/
├─ ecBeBo/
│  ├─ ecbebo.log                    ← APP 로그 (롤링)
│  ├─ ecbebo-error.log              ← ERROR 전용
│  └─ archived/
│     ├─ ecbebo.2026-09-06.0.log.gz
│     └─ ecbebo-error.2026-09-06.0.log.gz
└─ ecBeCdn/
   ├─ ecbecdn.log
   ├─ ecbecdn-error.log
   └─ archived/
```

> **적용 범위**: 로컬(local 프로파일)에서 파일 로그를 실제로 쓰는 앱은 현재 EcBeBo/EcBeCdn
> 둘뿐이다. `ecBeRedis`/`ecBeGateway`(순정 이미지, 커스텀 코드 없음 — 로컬에서 직접 띄울 일도
> 거의 없음), `ecFeBo`(정적 파일, 서버 로그 없음), `ecAppFlutter`(현재 `debugPrint` 콘솔
> 출력만, 파일 로깅 없음) 는 이 정책의 대상이 아니다 — 나중에 파일 로깅이 추가되면 같은
> 원칙(워크스페이스 밖 + 앱별 폴더)으로 `C:/_logs/shopjoy/{앱이름}/`에 추가할 것.

`C:/_logs/` 디렉토리는 자동 생성되지만, 권한 문제 발생 시 한 번 수동 생성:

```cmd
mkdir C:\_logs\shopjoy
```

## prod 환경

`prod` 프로파일은 본 정책 적용 안 함. 기존대로 `application-prod.yml` 에 명시된
경로 (운영 서버의 `/var/log/shopjoy` 등) 사용.

## 함께 점검할 항목

- `.vscode/settings.json` 의 `liveServer.settings.root`(현재 `/apps/ecFeBo` — 감시 루트 자체를
  프론트 폴더로 한정)가 여전히 설정돼 있어야 한다 (1차 방어선). `liveServer.settings.ignoreFiles`
  에 다음 패턴도 2차 방어선으로 유지:
  - `apps/ecBeBo/**`, `apps/ecBeCdn/**`
  - `**/*.log`, `**/log/**`, `**/logs/**`
  - `**/build/**`
- 워크스페이스 안에 `apps/ecBeBo/logs/` 또는 `apps/LOG_DIR_IS_UNDEFINED/`
  같은 디렉토리가 새로 생기면 어딘가에서 상대경로로 로그가 쓰이고 있다는 신호(2026-09-06:
  실제로 이 정확한 폴더가 워크스페이스에 생겨있던 걸 확인 — 원인은 다음 항목 참조).
  즉시 점검:
  1. 활성 프로파일 확인 (`-Dspring.profiles.active=local|dev|prod`)
  2. application-{profile}.yml 의 `logging.file.path` 값 확인
  3. logback-spring.xml 의 `LOG_DIR` 해석 결과 확인 (statusListener 로 출력 가능)

## 발견 이력

- 2026-09-06: `apps/LOG_DIR_IS_UNDEFINED/{ecbebo.log,ecbebo-error.log}` 폴더가 워크스페이스
  안에 **두 번** 실제로 생겨있는 걸 발견(둘 다 삭제 조치) — 이 문서가 경고하던 바로 그 증상이
  재현된 사례. 두 번째 발견 때는 파일 내용을 직접 읽어 **근본 원인을 확정**했다:
  - 로그 내용이 `org.hibernate.SQL`(`[sch-2]` 스레드, 10초 간격 반복) — 로컬에서 실제로 켜져
    있던 `EcBeBoApplication`(local 프로파일)의 `@Scheduled` 잡(엑셀 다운로드 폴링)이 계속
    남기고 있던 진짜 운영 로그였다. 즉 설정 오타나 잘못된 값 문제가 **아니었다**.
  - `application-local.yml`(`logging.file.path`)과 `logback-spring.xml`(`LOG_DIR`
    springProperty `defaultValue`)은 소스 상 항상 정상값이었다.
  - **확정 원인**: Spring Boot 의 `springProperty`(`SpringPropertyAction`)는 Logback 이
    Spring 의 `Environment`/`ApplicationContext` 가 아직 등록되기 전(이른 부팅 경로 — 예:
    IntelliJ 실행과 동시에 별도 프로세스의 Gradle 빌드가 겹쳐 도는 등 타이밍이 어긋나는 경우)
    에 먼저 초기화되면, **`defaultValue` 조차 적용하지 않고 `LOG_DIR` 자체를 아예 등록하지
    않은 채 조용히 종료**한다(Spring Boot 자체의 알려진 제약 — environment 가 null 이면
    `SpringPropertyAction.end()` 가 바로 return). 그 상태에서 `${LOG_DIR}` 를 그대로 참조하는
    다른 property(`APP_LOG`/`ERR_LOG`/`ARCH_DIR`)는 Logback 이 미해석 변수를
    `"LOG_DIR_IS_UNDEFINED"` 문자열로 치환해버려 그 이름의 폴더가 워크스페이스 안에
    실제로 생긴다.
  - **적용한 수정**: `springProperty` 자체는 유지하되(정상 케이스에서 계속 잘 동작),
    `${LOG_DIR}` 를 **쓰는 곳마다** Logback 고유의 `${VAR:-default}` 구문으로 한 번 더
    방어했다 — 이건 Spring 의 타이밍과 무관하게 Logback 자체가 처리하므로 위 실패 케이스의
    영향을 받지 않는다. `apps/ecBeBo`, `apps/ecBeCdn` 의 `logback-spring.xml` 양쪽 다
    `APP_LOG`/`ERR_LOG`/`ARCH_DIR` 세 property 에 전부 적용 완료.
- 2026-05-08: F5 직후가 아닌 **계속되는** 0.5초 주기 깜빡임 증상 추적.
  Frontend 의 watch/computed/reactive 가 아닌 **백엔드 로그 파일 적재** 가 진짜 트리거였음.
  - `_apps/EcAdminApi/logs/ecadminapi.log` 매 API 호출마다 갱신
  - `_apps/EcAdminApi/LOG_DIR_IS_UNDEFINED/` 디렉토리는 logback 의 `LOG_DIR`
    해석 실패로 fallback 생성된 것으로 추정
  - 해결: `logging.file.path` 와 logback `LOG_DIR` defaultValue 모두
    `C:/_logs/shopjoy` 절대경로로 변경.
