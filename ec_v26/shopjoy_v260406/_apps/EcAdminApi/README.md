# EcAdminApi

ShopJoy 전자상거래 플랫폼의 관리자 API 서버.
Spring Boot 기반 REST API + 동적 배치 스케줄러.

---

## 목차

1. [기술 스택](#기술-스택)
2. [프로젝트 구조](#프로젝트-구조)
3. [프로파일별 실행 방법](#프로파일별-실행-방법)
4. [환경변수 목록](#환경변수-목록)
5. [배치 스케줄러](#배치-스케줄러)
6. [주요 설정 상세](#주요-설정-상세)
7. [운영 배포 체크리스트](#운영-배포-체크리스트)

---

## 기술 스택

| 항목 | 버전/값 |
|---|---|
| Java | 17 |
| Spring Boot | 3.x |
| DB | PostgreSQL (스키마: `shopjoy_2604`) |
| ORM | JPA (Hibernate) + MyBatis |
| 인증 | JWT (access 15분 / refresh 7일) |
| 캐시 | Redis (선택, `app.redis.enabled`) |
| 스케줄러 | Spring ThreadPoolTaskScheduler + 동적 cron |
| 빌드 | Gradle |
| 서버 포트 | 3000 |

---

## 프로젝트 구조

```
src/main/java/com/shopjoy/ecadminapi/
├── auth/          JWT 인증·인가 (필터, 토큰 발급/검증)
├── autorest/      공통 REST 응답 구조 (ApiResponse, PageResult)
├── base/          기준 데이터 도메인 (sy.*, ec.* 엔티티/리포지토리)
├── bo/            Back Office API (관리자 도메인별 Controller/Service)
├── cache/         Redis 캐시 유틸 (RedisUtil, RedisConfig)
├── co/            공통 유틸 (코드, 파일 업로드, 페이징)
├── common/        글로벌 예외 처리, 보안 설정
├── ext/           외부 연동 API (Jenkins 등)
├── fo/            Front Office API (회원 도메인별 Controller/Service)
└── sch/           배치 스케줄러
    ├── config/    SchBatchConfig, SchBatchProperties
    ├── controller/SchBatchController
    ├── core/      SchBatchRunner, SchBatchExecutor, SchBatchJobRegistry
    └── handler/   SchBatchJobHandler (인터페이스 + 구현체 10개)

src/main/resources/
├── application.yml          공통 설정 + 전체 속성 레퍼런스
├── application-local.yml    로컬 개발
├── application-dev.yml      개발 서버
├── application-prod.yml     운영 서버
├── logback-spring.xml       로깅 설정
├── mybatis/mybatis-config.xml
└── mapper/**/*.xml          MyBatis SQL Mapper
```

---

## 프로파일별 실행 방법

### [local] 로컬 개발

**java -jar**
```
java -Dspring.profiles.active=local -DDB_HOST=localhost -DDB_PORT=5432 -DDB_NAME=postgres -DDB_SCHEMA=shopjoy_2604 -DDB_USERNAME=postgres -DDB_PASSWORD=postgres -jar C:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_apps\EcAdminApi\build\libs\EcAdminApi-0.0.1-SNAPSHOT.jar
```

**IntelliJ VM options**
```
-Dspring.profiles.active=local -DDB_HOST=localhost -DDB_PORT=5432 -DDB_NAME=postgres -DDB_SCHEMA=shopjoy_2604 -DDB_USERNAME=postgres -DDB_PASSWORD=postgres
```

---

### [dev] 개발 서버

**java -jar**
```
java -Dspring.profiles.active=dev -DDB_HOST=illeesam.synology.me -DDB_PORT=17632 -DDB_NAME=postgres -DDB_SCHEMA=shopjoy_2604 -DDB_USERNAME=postgres -DDB_PASSWORD=(실제값) -jar C:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_apps\EcAdminApi\build\libs\EcAdminApi-0.0.1-SNAPSHOT.jar
```

**IntelliJ VM options**
```
-Dspring.profiles.active=dev -DDB_HOST=illeesam.synology.me -DDB_PORT=17632 -DDB_NAME=postgres -DDB_SCHEMA=shopjoy_2604 -DDB_USERNAME=postgres -DDB_PASSWORD=(실제값)
```

---

### [prod] 운영 서버

#### 권장: 환경변수 방식

운영 환경에서 `-D` 옵션으로 민감 정보를 전달하면 `ps aux`, `shell history` 등에 **평문으로 노출**됩니다.
환경변수를 별도 파일로 분리하는 방식을 강력히 권장합니다.

```bash
# /etc/ecadminapi.env (파일 권한: 600, 소유자: 실행 계정)
export DB_HOST=서버IP또는도메인
export DB_PORT=포트
export DB_NAME=postgres
export DB_SCHEMA=shopjoy_2604
export DB_USERNAME=실제값
export DB_PASSWORD=실제값
export JWT_SECRET=실제값
export JENKINS_BATCH_TOKEN=실제값

# 실행
source /etc/ecadminapi.env
java -Dspring.profiles.active=prod -jar /app/EcAdminApi.jar
```

**systemd 사용 시** (`/etc/systemd/system/ecadminapi.service`):
```ini
[Service]
EnvironmentFile=/etc/ecadminapi.env
ExecStart=java -Dspring.profiles.active=prod -jar /app/EcAdminApi.jar
```

**Docker 사용 시**:
```bash
docker run --env-file /etc/ecadminapi.env \
  -Dspring.profiles.active=prod \
  ecadminapi:latest
```

#### 대안: java -jar 인수 방식 (보안 주의)

```
java -Dspring.profiles.active=prod -DDB_HOST=(서버IP또는도메인) -DDB_PORT=(포트) -DDB_NAME=postgres -DDB_SCHEMA=shopjoy_2604 -DDB_USERNAME=(실제값) -DDB_PASSWORD=(실제값) -DJWT_SECRET=(실제값) -DJENKINS_BATCH_TOKEN=(실제값) -jar /app/EcAdminApi.jar
```

**IntelliJ VM options (운영 서버 직접 디버그 시)**
```
-Dspring.profiles.active=prod -DDB_HOST=(서버IP또는도메인) -DDB_PORT=(포트) -DDB_NAME=postgres -DDB_SCHEMA=shopjoy_2604 -DDB_USERNAME=(실제값) -DDB_PASSWORD=(실제값) -DJWT_SECRET=(실제값) -DJENKINS_BATCH_TOKEN=(실제값)
```

> Spring Boot는 `${DB_PASSWORD}` 플레이스홀더를 OS 환경변수 → JVM 시스템 프로퍼티(`-D`) 순으로 탐색합니다.

---

## 환경변수 목록

### 공통 (모든 프로파일)

| 환경변수 | 설명 | local 기본값 | dev 기본값 | prod |
|---|---|---|---|---|
| `DB_HOST` | PostgreSQL 호스트 | `localhost` | `illeesam.synology.me` | **필수** |
| `DB_PORT` | PostgreSQL 포트 | `5432` | `17632` | **필수** |
| `DB_NAME` | DB명 | `postgres` | `postgres` | `postgres` |
| `DB_SCHEMA` | 스키마명 | `shopjoy_2604` | `shopjoy_2604` | `shopjoy_2604` |
| `DB_USERNAME` | DB 사용자명 | `postgres` | `postgres` | **필수** |
| `DB_PASSWORD` | DB 비밀번호 | `postgres` | **필수** | **필수** |

### prod 전용

| 환경변수 | 설명 | prod 기본값 |
|---|---|---|
| `JWT_SECRET` | JWT 서명 시크릿 키 (Base64, 160bit 이상 권장) | **필수** |
| `JENKINS_BATCH_TOKEN` | Jenkins 배치 호출 인증 토큰 | 빈값 (검증 생략 — 비권장) |
| `REDIS_HOST` | Redis 주 노드 호스트 | `localhost` |
| `REDIS_PORT` | Redis 주 노드 포트 | `6379` |
| `REDIS_PASSWORD` | Redis 비밀번호 | 빈값 |
| `AWS_ACCESS_KEY_ID` | AWS S3 액세스 키 | storage-type=AWS_S3 시 필수 |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 시크릿 키 | storage-type=AWS_S3 시 필수 |
| `AWS_S3_BUCKET` | S3 버킷명 | `shopjoy-files-prod` |
| `AWS_REGION` | AWS 리전 | `ap-northeast-2` |
| `AWS_CLOUDFRONT_URL` | CloudFront CDN URL | `https://cdn.shopjoy.com` |
| `NCP_ACCESS_KEY` | NCP OBS 액세스 키 | storage-type=NCP_OBS 시 필수 |
| `NCP_SECRET_KEY` | NCP OBS 시크릿 키 | storage-type=NCP_OBS 시 필수 |
| `NCP_BUCKET` | NCP OBS 버킷명 | `shopjoy-files-prod` |
| `NCP_ENDPOINT` | NCP OBS 엔드포인트 | `https://obs.kr-standard.ncrdev.ncloud.com` |
| `NCP_CDN_URL` | NCP CDN URL | `https://cdn-ncp.shopjoy.com` |
| `CDN_HOST` | CDN 호스트 | `https://cdn.shopjoy.com` |

---

## 배치 스케줄러

### 개요

`sch` 패키지는 DB(`sy_batch` 테이블) 기반 동적 배치 스케줄러입니다.
앱 기동 시 ACTIVE 상태인 배치를 자동 등록하며, 런타임 중 API로 제어 가능합니다.
**내부 cron 자동 실행**과 **Jenkins 외부 호출** 두 가지 모드를 지원합니다.

---

### 실행 흐름

#### 흐름 1 — 기본 배치 cron 자동 실행

```
앱 기동 (ApplicationRunner)
  │
  ├─ app.scheduler.enabled=false → 전체 스킵
  │
  └─ sy_batch WHERE batch_active_yn='Y' 조회
       │
       └─ 각 배치 → SchBatchJobRegistry.register(batch)
            │
            ├─ jenkins.enabled=true → cron 등록 생략 (Jenkins 모드)
            ├─ cron_expr 없음       → 경고 후 스킵
            └─ CronTrigger 등록 → ThreadPoolTaskScheduler
                 │
                 └─ [지정 시각] → SchBatchExecutor.execute(batch)
                       │
                       ├─ handlerMap.get(batchCode) → 핸들러 조회
                       ├─ 없으면 → batch_run_status=NO_HANDLER 기록
                       └─ handler.execute(batch)
                             ├─ 성공 → batch_run_status=SUCCESS, batch_run_count+1
                             └─ 예외 → batch_run_status=FAIL, 스택트레이스 기록
```

#### 흐름 2 — 관리자 Controller 수동 실행

```
관리자 (BO)
  │
  └─ POST /api/sch/batch/{batchCode}/run   (@BoOnly)
       │
       └─ sy_batch WHERE batch_code=? 조회
            │
            └─ SchBatchExecutor.execute(batch)
                 │
                 └─ (흐름 1의 executor 이후와 동일)
```

#### 흐름 3 — Jenkins 외부 호출 실행

```
Jenkins Pipeline
  │
  └─ POST /api/sch/jenkins/{batchCode}
       Header: X-Jenkins-Token: {token}
       │
       ├─ jenkins.enabled=false → 403 Forbidden
       ├─ 토큰 불일치           → 401 Unauthorized
       └─ sy_batch WHERE batch_code=? 조회
            │
            └─ SchBatchExecutor.execute(batch)
                 │
                 └─ (흐름 1의 executor 이후와 동일)
```

---

### 등록된 배치 목록

| batchCode | 클래스 | cron 표현식 | 실행 주기 | 기능 |
|---|---|---|---|---|
| `SETTLEMENT_REPORT` | `SettlementReportJob` | `0 8 1 * *` | 매월 1일 08:00 | 월간 정산 리포트 생성·이메일 발송 |
| `MEMBER_GRADE_CALC` | `MemberGradeCalcJob` | `0 4 1 * *` | 매월 1일 04:00 | 월 구매 실적 기준 회원 등급 재산정 |
| `CACHE_EXPIRE` | `CacheExpireJob` | `0 5 1 * *` | 매월 1일 05:00 | 1년 이상 미사용 캐시 자동 소멸 |
| `ATTACH_CLEANUP` | `AttachCleanupJob` | `0 3 * * 0` | 매주 일요일 03:00 | 30일 이상 미참조 임시 첨부파일 삭제 |
| `STATS_AGGREGATION` | `StatsAggregationJob` | `0 0 * * *` | 매일 00:00 | 일별/주별/월별 통계 사전 집계 |
| `EVENT_STATUS_SYNC` | `EventStatusSyncJob` | `0 0 * * *` | 매일 00:00 | 이벤트 시작/종료일 기준 상태 동기화 |
| `COUPON_EXPIRE` | `CouponExpireJob` | `0 1 * * *` | 매일 01:00 | 만료일 경과 쿠폰 상태 변경 |
| `ORDER_AUTO_COMPLETE` | `OrderAutoCompleteJob` | `0 2 * * *` | 매일 02:00 | 배송완료 후 7일 경과 주문 자동 완료 |
| `DLIV_STATUS_SYNC` | `DlivStatusSyncJob` | `0 */2 * * *` | 2시간마다 | 택배사 API 연동 배송 상태 업데이트 |
| `DEV_10MINUTE_LOG` | `Dev10MinuteLogJob` | `*/10 * * * *` | 10분마다 | 개발용 주기 실행 로그 확인 |

> **cron 표현식 형식**: Unix 5필드 (`분 시 일 월 요일`).
> SchBatchJobRegistry가 Spring 6필드(`초 분 시 일 월 요일`)로 자동 변환합니다 (`"0 " + cron`).

---

### REST API

#### 관리자 API (`@BoOnly` — BO 관리자 전용)

| 메서드 | URL | 설명 |
|---|---|---|
| `GET` | `/api/sch/batch` | 전체 배치 목록 + 등록 상태 + 실행 모드 조회 |
| `POST` | `/api/sch/batch/{batchCode}/run` | 배치 즉시 수동 실행 |
| `POST` | `/api/sch/batch/{batchCode}/on` | cron 스케줄 등록 |
| `POST` | `/api/sch/batch/{batchCode}/off` | cron 스케줄 해제 |
| `POST` | `/api/sch/reload` | DB 재로드 후 전체 배치 재등록 |

**GET /api/sch/batch 응답 예시**
```json
{
  "data": [
    {
      "batchCode": "ORDER_AUTO_COMPLETE",
      "batchNm": "주문 자동 완료",
      "cronExpr": "0 2 * * *",
      "batchActiveYn": "Y",
      "batchRunStatus": "SUCCESS",
      "batchLastRun": "2026-04-24T02:00:00",
      "batchRunCount": 42,
      "registered": true,
      "execMode": "CRON"
    }
  ]
}
```

`execMode` 값:
- `"CRON"` — 내부 cron 자동 스케줄 등록 모드
- `"JENKINS"` — Jenkins 외부 호출 모드 (`jenkins.enabled=true`)

#### Jenkins 외부 호출 API

| 메서드 | URL | 헤더 | 설명 |
|---|---|---|---|
| `POST` | `/api/sch/jenkins/{batchCode}` | `X-Jenkins-Token: {token}` | Jenkins Pipeline에서 배치 실행 |

**응답 코드**

| 코드 | 조건 |
|---|---|
| `200` | 실행 성공 |
| `400` | batchCode 없음 또는 비활성 배치 |
| `401` | 토큰 불일치 |
| `403` | `jenkins.enabled=false` — Jenkins 모드 비활성 |

---

### 설정 옵션 (`app.scheduler`)

| 속성 | 타입 | 설명 | local | dev | prod |
|---|---|---|---|---|---|
| `enabled` | boolean | 스케줄러 전체 활성 여부 | `false` | `true` | `true` |
| `jenkins.enabled` | boolean | Jenkins 외부 호출 모드 | `false` | `false` | `true` |
| `jenkins.token` | String | Jenkins 인증 토큰 | `""` | `dev-batch-jenkins-tk-9f2a4c8e1b7d` | `${JENKINS_BATCH_TOKEN:}` |
| `jenkins.url` | String | 앱→Jenkins 역방향 트리거 URL (미사용) | `""` | `""` | `${JENKINS_URL:}` |
| `allowed-ips` | String | 스케줄 관리 API 허용 IP | `""` (전체) | `"*"` (전체) | IP 화이트리스트 |

**allowed-ips 형식**
```
""  또는 미설정        → 전체 허용
"*"                    → 전체 허용 (명시적)
"192.168.1.1^10.0.0.1" → "^" 구분 IP 화이트리스트
```

---

### 핵심 클래스 역할

| 클래스 | 역할 |
|---|---|
| `SchBatchRunner` | `ApplicationRunner` 구현. 앱 기동 시 ACTIVE 배치 자동 등록 |
| `SchBatchJobRegistry` | `batchCode → ScheduledFuture` 맵 관리. 동적 등록/해제/재등록 |
| `SchBatchExecutor` | 핸들러 조회 → 실행 → `sy_batch` 이력 업데이트 |
| `SchBatchJobHandler` | 배치 구현체 인터페이스. `batchCode()` + `execute(SyBatch)` |
| `SchBatchController` | 관리자 수동 제어 API + Jenkins 외부 호출 엔드포인트 |
| `SchBatchProperties` | `app.scheduler.*` 설정 바인딩 (`@ConfigurationProperties`) |
| `SchBatchConfig` | `ThreadPoolTaskScheduler` Bean 정의 (poolSize=5) |

---

### 새 배치 핸들러 추가 방법

1. `sch/handler/` 에 클래스 생성
```java
@Slf4j
@Component
public class MyNewJob implements SchBatchJobHandler {

    @Override
    public String batchCode() {
        return "MY_NEW_JOB";  // sy_batch.batch_code 와 일치해야 함
    }

    @Override
    public void execute(SyBatch batch) {
        log.info("[BATCH] {} 시작", batchCode());
        // 실행 로직
        log.info("[BATCH] {} 완료", batchCode());
    }
}
```

2. `sy_batch` 테이블에 INSERT
```sql
INSERT INTO shopjoy_2604.sy_batch (
    batch_id, site_id, batch_code, batch_nm,
    cron_expr, batch_active_yn, batch_run_status, batch_run_count,
    reg_id, reg_date, mod_id, mod_date
) VALUES (
    'BT000011', 'S001', 'MY_NEW_JOB', '내 새 배치',
    '0 3 * * *', 'Y', 'READY', 0,
    'admin', NOW(), 'admin', NOW()
);
```

3. 앱 재기동 또는 `POST /api/sch/reload` 호출 → 자동 등록

---

## 주요 설정 상세

### Redis 캐시 (app.redis)

| 속성 | 설명 |
|---|---|
| `enabled: false` | Redis 비활성. RedisUtil 모든 연산 no-op. DB 직접 조회. |
| `enabled: true` | primary 노드에 연결. secondary 설정 시 추가 연결. |

**캐시 대상별 저장 위치**

| 캐시 | 저장 위치 | 키 패턴 |
|---|---|---|
| auth (세션/블랙리스트) | primary | `auth:session:{userId}`, `auth:blacklist:{token}` |
| code (공통코드) | primary | `code:grp:{groupCode}`, `code:all` |
| prop (시스템 프로퍼티) | primary | `prop:key:{key}`, `prop:all` |
| prod (상품정보) | secondary (미설정 시 primary) | `prod:dtl:{prodId}`, `prod:list:{siteId}` |

**TTL 기본값**

| 대상 | TTL | 비고 |
|---|---|---|
| BO/FO/EXT 세션 | 900초 (15분) | JWT access-expiry와 동일 |
| 공통코드, 메뉴, 역할, 프로퍼티, i18n | 3600초 (1시간) | 변경 시 evict() 호출로 즉시 반영 |
| 상품, 카테고리, 프로모션, 전시 | 3600초 (1시간) | 변경 시 evict() 호출 전제 |

---

### 파일 업로드 (app.file)

**허용 확장자**: `jpg, jpeg, png, gif, webp, pdf, doc, docx, xls, xlsx, ppt, pptx, txt, zip, mp4, avi, mov, mkv, webm, flv, wmv, m4v`

**용량 제한**

| 대상 | 기본값 |
|---|---|
| 파일 1개 | 10MB |
| 요청 전체 | 50MB |
| 이미지 | 5MB |
| 문서 | 20MB |
| 동영상 | 100MB |

**스토리지 타입**

| 타입 | 설명 | 사용 환경 |
|---|---|---|
| `LOCAL` | 서버 로컬 파일시스템 | local / dev |
| `AWS_S3` | AWS S3 버킷 | prod 권장 |
| `NCP_OBS` | Naver Cloud OBS | prod 대안 |

**저장 경로 정책**: `/cdn/{businessCode}/YYYY/YYYYMM/YYYYMMDD/`

**파일명 정책**: `YYYYMMDD_hhmmss_순서번호_random4자리.확장자`
예) `20260421_143045_01_1234.jpg`

---

### 액세스 로그 (app.access-log)

| 속성 | local | dev | prod |
|---|---|---|---|
| `db-save` | `true` | `true` | `true` |
| `filter` | `"*"` (전체) | `"BO^FO^EXT"` | `"BO"` |
| `max-body-size` | `2000` bytes | `2000` bytes | `0` (미수집) |

**filter 형식**
```
"*"           → 전체 기록
"BO"          → BO 관리자 전체
"BO^FO^EXT"   → 인증된 모든 userType
"admin01"     → 특정 userId만
"admin01^BO"  → 특정 userId + BO 전체
```

> `max-body-size: 0` 설정 시 ContentCachingWrapper 자체를 생략 → 성능 최적화.
> prod 환경은 보안/성능 고려 `0` 권장.

---

### 로깅 (logback-spring.xml)

| 프로파일 | 레벨 | 콘솔 | 파일 |
|---|---|---|---|
| local / dev | DEBUG | 컬러 + IntelliJ 클릭링크 | `logs/ecadminapi.log` |
| prod | INFO | 심플 | `logs/ecadminapi.log` |

**로그 파일 위치**
```
logs/ecadminapi.log              일반 로그 (50MB 롤링·30일·2GB·gzip)
logs/ecadminapi-error.log        에러 로그 (20MB 롤링·90일·500MB·gzip)
logs/archived/                   압축 보관
```

---

## 운영 배포 체크리스트

```
[ ] 1. 환경변수 설정 확인
       DB_HOST / DB_PORT / DB_USERNAME / DB_PASSWORD
       JWT_SECRET
       JENKINS_BATCH_TOKEN  (Jenkins 모드 사용 시)
       AWS_* 또는 NCP_*    (클라우드 스토리지 사용 시)

[ ] 2. spring.profiles.active=prod 확인

[ ] 3. 배치 스케줄러
       app.scheduler.jenkins.enabled=true (Jenkins 연동 시)
       allowed-ips 에 Jenkins 서버 IP 추가
       sy_batch 테이블 초기 데이터 INSERT 확인
         → _doc/sample_insert_pgsql/sy_batch.sql 참조

[ ] 4. 파일 스토리지
       app.file.storage-type=AWS_S3 또는 NCP_OBS 확인
       해당 클라우드 자격증명 환경변수 설정

[ ] 5. 액세스 로그
       app.access-log.max-body-size=0 (prod 기본값 확인)

[ ] 6. Redis (사용 시)
       app.redis.enabled=true
       REDIS_HOST / REDIS_PORT / REDIS_PASSWORD 환경변수 설정

[ ] 7. 로그 디렉토리 쓰기 권한 확인
       기본 경로: ./logs/ (실행 위치 기준)
       권장: java -jar 전 logs/ 디렉토리 생성 및 권한 확인
```
