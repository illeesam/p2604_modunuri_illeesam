# sy.13. HTTP 요청 에러 로그 정책

## 목적
운영 중 발생하는 ERROR 레벨 예외를 DB에 비동기로 수집하여
장애 원인 추적, 반복 오류 탐지, 보안 이상 징후 모니터링에 활용한다.

## 범위
- BO(관리자) / FO(회원) / EXT(외부) 모든 HTTP 요청 대상
- Logback ERROR 레벨 이상 이벤트 자동 수집
- 스케줄러(배치) 등 비HTTP 컨텍스트의 ERROR도 수집 (요청 필드는 `-` 로 기록)

---

## 수집 구조

```
HTTP 요청
    │
    ▼
JwtAuthFilter (OncePerRequestFilter)
    │  MDC 설정: reqMethod / reqHost / reqPath / reqQuery
    │            reqIp / reqUa / userId / userType / roleId
    ▼
Spring MVC 처리 (Controller → Service → ...)
    │  ERROR 발생
    ▼
Logback DbErrorLogAppender  ← root logger 에 자동 등록
    │  MDC 추출 + stackTrace 조립
    ▼
ErrorLogQueue (LinkedBlockingQueue, 최대 500건)
    │  큐 가득 참 → 즉시 드롭 (non-blocking)
    ▼
err-log-worker (단일 데몬 스레드, 2초 poll 루프)
    │
    ▼
syh_access_error_log 테이블 INSERT
```

---

## 수집 항목

### 요청 정보 (MDC → JwtAuthFilter 주입)
| 항목 | 컬럼 | 설명 |
|---|---|---|
| HTTP 메서드 | `req_method` | GET / POST / PUT / PATCH / DELETE |
| 호스트 | `req_host` | Host 헤더 값 |
| 경로 | `req_path` | 요청 URI |
| 쿼리 | `req_query` | 쿼리스트링 (nullable) |
| 클라이언트 IP | `req_ip` | X-Forwarded-For → X-Real-IP → RemoteAddr 순 |
| User-Agent | `req_ua` | 최대 200자 저장 |

### 인증 정보 (MDC → JwtAuthFilter 주입)
| 항목 | 컬럼 | 설명 |
|---|---|---|
| 사용자 유형 | `user_type` | USER / MEMBER / EXT / `-` |
| 사용자 ID | `user_id` | sy_user.user_id 또는 ec_member.member_id |
| 역할 ID | `role_id` | JWT 클레임의 roleId (nullable) |

> FO(MEMBER) 요청의 `user_id` 는 `member_id` 값임

### 에러 정보 (Logback ILoggingEvent)
| 항목 | 컬럼 | 설명 |
|---|---|---|
| 예외 클래스 | `error_type` | FQCN (e.g. `java.lang.NullPointerException`) |
| 예외 메시지 | `error_msg` | 최대 2000자 |
| 스택 트레이스 | `stack_trace` | 최대 3000자, Caused by 포함 |

### 실행 환경 (Logback ILoggingEvent + 시스템)
| 항목 | 컬럼 | 설명 |
|---|---|---|
| 서버 호스트명 | `server_nm` | InetAddress.getLocalHost().getHostName() |
| 활성 프로파일 | `profile` | local / dev / prod |
| 스레드명 | `thread_nm` | e.g. `http-nio-8080-exec-3` |
| 로거 클래스 | `logger_nm` | 에러를 기록한 클래스 FQCN |

### 시각
| 컬럼 | 설명 |
|---|---|
| `log_dt` | 에러 발생 시각 (이벤트 타임스탬프) |
| `reg_date` | DB 저장 시각 (워커 처리 시점) |

---

## 성능 보호 정책 (큐 드롭)

| 항목 | 값 | 설명 |
|---|---|---|
| 최대 큐 크기 | 100건 | `app.error-log.queue-size` (yml 설정) |
| 초과 시 처리 | 즉시 드롭 | non-blocking offer(), 응답 지연 없음 |
| 드롭 경고 | 100건마다 1회 | `System.err` 출력 (자기 자신 log 호출 시 재귀 위험 방지) |
| 워커 스레드 | 1개 데몬 | `err-log-worker`, 2초 poll 루프 |
| 종료 시 flush | 최대 50건 | `@PreDestroy` 잔여 항목 저장 시도 |

> **드롭 발생 조건**: 짧은 시간에 100건 이상의 에러가 동시 발생하는 경우.
> 정상 운영 환경에서는 드롭이 발생하지 않아야 하며,
> 드롭 경고가 반복될 경우 `queue-size` 값을 늘리거나 근본 원인을 조사한다.

---

## 재귀 방지

`DbErrorLogAppender` 자신의 패키지(`com.shopjoy.ecadminapi.common.log`)에서
발생한 로그 이벤트는 append 대상에서 제외하여 무한 루프를 방지한다.

---

## 관련 파일

| 파일 | 역할 |
|---|---|
| `syh_access_error_log.sql` | DDL |
| `SyhAccessErrorLog.java` | JPA 엔티티 |
| `SyhAccessErrorLogRepository.java` | JPA 레포지토리 |
| `ErrorLogQueue.java` | 비동기 큐 + 워커 스레드 |
| `DbErrorLogAppender.java` | Logback 앱에더 |
| `ErrorLogConfig.java` | Spring 컨텍스트 로드 후 앱에더 등록 |
| `JwtAuthFilter.java` | MDC 설정 (요청·인증 정보) |
| `logback-spring.xml` | 에러 파일 패턴: `[method host/path]` 포함 |

---

## 관련 화면
| pageId | 라벨 |
|---|---|
| `syAccessErrorLogMng` | 시스템 > HTTP 에러 로그 조회 (미구현) |

---

## 제약사항
- 에러 로그 자체의 저장 실패는 `System.err`에만 출력하고 무시 (2차 에러 전파 방지)
- `stack_trace` 3000자 초과분은 잘려 저장됨
- 비HTTP 컨텍스트(배치, 스케줄러)는 요청 관련 컬럼이 `-` 로 기록됨
- 테이블 보관 기간 정책은 별도 결정 필요 (현재 미설정, 수동 삭제 또는 파티셔닝 권장)
