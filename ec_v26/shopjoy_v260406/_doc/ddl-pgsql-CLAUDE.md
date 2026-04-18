# DDL 작성 규칙

## ID 생성 규칙
- 형식: `YYMMDDhhmmss + random(4)` = `VARCHAR(16)`
- 예: `2604181530420001`

## 파일 구조
- 파일당 테이블 1개 원칙
- 파일명: `{prefix}_{table_name}.sql`

## 도메인 폴더

| 폴더 | 도메인 |
|---|---|
| `ddl-pgsql-ec-cm/` | 커뮤니티 (게시판·채팅·공지·푸시) |
| `ddl-pgsql-ec-dp/` | 전시 (UI·Area·Panel·Widget) |
| `ddl-pgsql-ec-mb/` | 회원 |
| `ddl-pgsql-ec-od/` | 주문·결제·배송·클레임 |
| `ddl-pgsql-ec-pd/` | 상품·카테고리·옵션·배송템플릿 |
| `ddl-pgsql-ec-pm/` | 프로모션 (쿠폰·캐시·적립금·할인·사은품) |
| `ddl-pgsql-ec-st/` | 정산 |
| `ddl-pgsql-sy/` | 시스템 (사이트·코드·사용자·메뉴·권한) |
| `ddl-pgsql-zz.기타/` | 기타 설계 메모 |

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
