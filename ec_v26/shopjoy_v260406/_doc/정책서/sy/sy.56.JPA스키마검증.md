# sy.56. JPA 스키마 검증 (validate 프로파일)

## 목적

JPA `@Entity` 와 PostgreSQL 실제 스키마(`shopjoy_2604`)의 정합성을 **155개 Entity / 약 2,700개 컬럼 전수**로 한 번에 검증한다. 누락 테이블·컬럼·타입·길이 불일치를 한꺼번에 찾아내 마이그레이션 전 리스크를 제거한다.

## 범위

- EcAdminApi 모듈의 모든 `@Entity` 클래스
- `shopjoy_2604` 스키마의 `information_schema.columns`
- 운영 DB 배포 전 게이트, CI 정합성 검사

## 실행 방법

```
-Dspring.profiles.active=validate
```

JVM 인자에 위 한 줄만 추가하면 EcAdminApi 가 검증 모드로 부팅 → 결과 출력 → 자동 종료한다. 웹 서버는 뜨지 않으며 다른 사이드이펙트 없음.

### 종료 코드

| 코드 | 의미 |
|---|---|
| `0` | ✅ 모든 Entity ↔ DB 일치 (통과) |
| `2` | ❌ 미스매치 발견. 콘솔 리포트의 카테고리별 항목 정리 후 재실행 |
| `1` | DB 연결 실패 등 검증 자체 불가 |

## 출력 카테고리

검증 러너 [`JpaSchemaValidationRunner.java`](../../../_apps/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/common/validation/JpaSchemaValidationRunner.java) 가 4가지 분류로 미스매치를 정리해 출력한다.

| # | 분류 | 의미 | 일반적 해결 |
|---|---|---|---|
| 1 | 누락 테이블 | `@Entity` 는 있지만 DB 테이블 없음 | DDL 적용 / Entity 삭제 |
| 2 | 누락 컬럼 | Entity 필드는 있지만 DB 컬럼 없음 | `ALTER TABLE ... ADD COLUMN` |
| 3 | 타입 불일치 | DB 컬럼 타입 ≠ Entity 매핑 타입 | 어느 쪽이 진실인지 결정 후 정렬 |
| 4 | 길이 불일치 | VARCHAR 길이 다름 | DB 또는 Entity 길이 정렬 |

### 출력 예시

```
✅ JPA 스키마 검증 통과 (전수 검사)
   - DB URL    : jdbc:postgresql://illeesam.synology.me:17632/postgres?...
   - Schema    : shopjoy_2604
   - Entity 수 : 155 개
   - 컬럼 검사 : 2697 건
   ▶ 모든 @Entity 가 DB 컬럼/타입과 일치합니다.
```

## 환경 구성

### `application-validate.yml`

검증 전용 프로파일 — Hibernate `ddl-auto=none` (러너가 직접 검사), Redis/Scheduler/액세스로그 모두 OFF.

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: none      # ← 러너가 전수 검사 수행. validate 가 아님 주의
app:
  redis.enabled: false
  scheduler.enabled: false
  error-log.db-save: false
  access-log.db-save: false
```

### `logback-spring.xml` validate 블록

```xml
<springProfile name="validate">
  <appender name="CONSOLE" .../>
  <logger name="com.shopjoy.ecadminapi"     level="DEBUG"/>
  <logger name="org.hibernate.tool.hbm2ddl" level="DEBUG"/>
  <logger name="org.hibernate.tool.schema"  level="DEBUG"/>
  <root level="DEBUG"><appender-ref ref="CONSOLE"/></root>
</springProfile>
```

## 운영 워크플로우

### 일반 개발 흐름

1. Entity 또는 DDL 변경
2. `validate` 프로파일 실행
3. 미스매치 0건 → 운영 배포 가능
4. 미스매치 발생 → 카테고리별 리포트 보고 마이그레이션 SQL 작성
5. 운영 DB 적용 후 다시 (2)

### 마이그레이션 SQL 위치

`_doc/ddl_pgsql/migration_*.sql` — 날짜 또는 주제별 파일로 작성

```
_doc/ddl_pgsql/
├─ migration_2026_05_05_align.sql           ← 일반 정렬 마이그레이션
├─ migration_st_settle_adj_aprv_status_cd.sql  ← 단일 컬럼 추가
├─ migration_zz_sample_align.sql            ← 테이블 단위 재구축
└─ ...
```

### 결정 원칙: DB vs Entity, 어느 쪽이 진실인가

미스매치 발견 시 양쪽 중 어디를 정렬할지 결정해야 한다.

| 상황 | 진실 | 이유 |
|---|---|---|
| 코드(Service/Mapper)가 이미 Entity 기준으로 동작 중 | **Entity** | 코드 영향 최소화 |
| DB에 운영 데이터가 누적되어 있음 | **DB** | 데이터 손실 방지 |
| 정책서 표준에 명시된 길이/타입 | **정책서** | 표준 우선 |
| 샘플/테스트 테이블 (`zz_*`) | **Entity** | 데이터 의미 없음, 코드가 진실 |
| Entity 간 길이 불일치 (예: `*_id` 가 21/20 혼재) | **표준에 통일** | sy.52 단어사전 |

## 길이 표준 (sy.52 와 연계)

### ID 컬럼

| 컬럼 패턴 | 표준 길이 | 비고 |
|---|---|---|
| `*_id` (PK 자체 ID) | `VARCHAR(21)` | `YYMMDDhhmmss(12) + rand4(4)` + prefix(1~5) |
| `category_id_1~5` (참조 ID) | `VARCHAR(21)` | 모든 참조 컬럼은 PK 와 동일 길이 |
| `opt_item_id_1~2` (옵션 참조) | `VARCHAR(21)` | 동일 |
| `bundle_group_id` | `VARCHAR(36)` | UUID 호환 |
| `login_id` | `VARCHAR(50)` | 사용자 입력 로그인 식별자 |
| `sns_user_id` | `VARCHAR(200)` | 외부 SNS 시스템 ID |
| `pg_transaction_id`, `pg_refund_id`, `refund_pg_tid` | `VARCHAR(100)` | PG 외부 거래 ID |
| `opt_val_code_id` | `VARCHAR(50)` | 옵션 값 코드 |

### 감사/로그 컬럼

| 컬럼 패턴 | 표준 길이 | 비고 |
|---|---|---|
| `reg_by`, `upd_by`, `chg_by`, `*_by` | `VARCHAR(20)` | `sy_user.user_id` 와 동일 |
| `ui_nm`, `cmd_nm` (감사 헤더) | `VARCHAR(200)` | UI/명령명은 길어질 수 있음 |

### 코드 컬럼

| 컬럼 패턴 | 표준 길이 |
|---|---|
| `*_status_cd`, `*_type_cd`, `*_method_cd` | `VARCHAR(20)` |

## 신규 Entity/DDL 작성 체크리스트

- [ ] `*_id` 는 `VARCHAR(21)` (참조 컬럼 포함)
- [ ] 상태 컬럼은 반드시 `_cd` 접미어 (`aprv_status` ❌ → `aprv_status_cd` ✅)
- [ ] 모든 `*_cd` 컬럼의 `COMMENT ON COLUMN` 에 `(코드: CODE_GRP — VAL1/VAL2/...)` 명시
- [ ] `*_by` 담당자 컬럼은 `VARCHAR(20)` 통일
- [ ] `BaseEntity` 상속 시 DB 에 `reg_by/reg_date/upd_by/upd_date` 4컬럼 존재 확인
- [ ] 날짜 시·분·초 필요하면 Entity `LocalDateTime` + DB `TIMESTAMP`
- [ ] 날짜만 필요하면 Entity `LocalDate` + DB `DATE`
- [ ] PostgreSQL 에서 `CHAR(N)` 사용 금지 → `VARCHAR(N)` (Hibernate `String` 매핑은 `VARCHAR`)
- [ ] 변경 후 `validate` 프로파일 통과 확인

## CI 활용 (권장)

빌드 파이프라인에 다음 단계 추가:

```bash
# build → validate → test → deploy
java -Dspring.profiles.active=validate -jar EcAdminApi.jar
# 종료 코드 0 일 때만 다음 단계 진행
```

배포 직전 자동 게이트로 활용해 운영 DB 와 코드의 어긋남을 사람이 놓쳐도 잡아낸다.

## 관련 파일

| 종류 | 경로 |
|---|---|
| 검증 러너 | `_apps/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/common/validation/JpaSchemaValidationRunner.java` |
| 프로파일 yml | `_apps/EcAdminApi/src/main/resources/application-validate.yml` |
| logback 블록 | `_apps/EcAdminApi/src/main/resources/logback-spring.xml` (`<springProfile name="validate">`) |
| 마이그레이션 SQL 보관 | `_doc/ddl_pgsql/migration_*.sql` |

## 관련 정책서

- `sy.52.ddl단어사전규칙.md` — 컬럼명 표준
- `sy.55.mybatis쿼리테이블별칭정책.md` — SQL 별칭 정책
- `base/base.기술-api.md` — Entity/Service/Controller 설계 표준

## 변경 이력

- 2026-05-05: 신규 작성. 49건 → 21건 → 0건으로 정리하며 정책 도출.
