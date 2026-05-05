# DDL 작성 규칙

## ID 생성 규칙
- 형식: `YYMMDDhhmmss + random(4)` = `VARCHAR(16)`
- 예: `2604181530420001`

## 파일 구조
- 파일당 테이블 1개 원칙
- 파일명: `{prefix}_{table_name}.sql`

## DDL 폴더 구조 (`_doc/ddl_pgsql/`)

| 폴더 | 도메인 |
|---|---|
| `ddl_pgsql/ec/` | EC 전체 (cm, dp, mb, od, pd, pm, st 및 그 *_hist 테이블 포함) |
| `ddl_pgsql/sy/` | 시스템 (sy_*, syh_*, zz_sample*) |
| `ddl_pgsql/migration_*.sql` | 운영 변경 이력 SQL (날짜/주제별) |
| `ddl_pgsql/_legacy/` | 옛 도메인별 CLAUDE.md, 설계 메모, 보조 파이썬 스크립트 |

### 진화 이력
- 이전: `ddlPgsql/ddlPgsql-{ec-cm,ec-pd,sy,...}/` 도메인별 분리 폴더 (2026-04-29 이전)
- 현재: `ddl_pgsql/{ec,sy}/` 단순 2폴더 구조 + 파일명 prefix(cm_/dp_/mb_/...)로 도메인 식별 (2026-05-05)

## DDL 파일 생성·갱신 정책 (DB 기준 단일 소스)

**원칙**: DDL 파일은 운영 PostgreSQL DB(`shopjoy_2604`)에서 자동 추출하여 생성한다.

### 자동 추출 도구
- 위치: `c:\tmp\ddl_extract\DdlExtract.java`
- 동작: `information_schema` + `pg_catalog` 메타데이터 조회 → 테이블별 .sql 파일 생성
- 출력 형식:
  1. 헤더 코멘트 (테이블명 + DB 코멘트)
  2. `CREATE TABLE` (컬럼/타입/NULL/DEFAULT/PK + FK 제약)
  3. `COMMENT ON TABLE/COLUMN`
  4. `CREATE INDEX` (PK 제외 모든 인덱스)
- 분류: 테이블명 prefix가 `sy/syh/zz` → `sy/`, 그 외 → `ec/`
- 후처리: `'value'::character varying` → `'value'` 캐스팅 단순화, UTF-8 BOM 제거

### 갱신 시점
- DB 스키마 변경 후 추출 도구 재실행 → 변경된 테이블 .sql 파일 갱신
- 마이그레이션 SQL은 `migration_YYYY_MM_DD_*.sql` 형식으로 별도 보관 (이력 추적)

### Entity와 DDL의 관계
- **JPA Entity가 단일 소스 (Single Source of Truth)** — `_apps/EcAdminApi/.../entity/*.java`
- DDL 파일은 DB 현재 상태의 스냅샷 (운영 검증용·문서용)
- 컬럼명 참조는 Entity의 `@Column(name="...")`를 우선

## 컬럼명 표준
- 단일 단어 컬럼은 테이블명 프리픽스 필수 (예: `name` → `member_nm`, `email` → `site_email`)
- `*_name` → `*_nm` 축약
- 상태 코드: `*_status_cd` 형식
- 변경 전 상태: `*_status_cd_before` 항상 쌍으로
- 예외: `*_log` 테이블은 단일 단어 컬럼 허용 (log, token, ip, device, msg 등)

## 등록/수정 컬럼 패턴
```sql
reg_by      VARCHAR(16),
reg_date    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
upd_by      VARCHAR(16),     -- 수정 기능 있는 테이블만
upd_date    TIMESTAMP,       -- 수정 기능 있는 테이블만
```

## COMMENT 필수
- `COMMENT ON TABLE` + 모든 컬럼 `COMMENT ON COLUMN` 작성

## 인덱스 패턴
- 명명: `idx_{table_name}_{컬럼_축약}` (예: `idx_st_settle_vendor`)
- FK 컬럼, 상태 컬럼, 날짜 컬럼에 인덱스 생성
