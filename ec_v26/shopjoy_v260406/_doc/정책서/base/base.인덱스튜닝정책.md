# 인덱스 튜닝 정책 (PostgreSQL)

## 목적

인덱스를 **감(感)이 아니라 실측 통계로** 결정한다.
"조회가 느릴 것 같으니 일단 걸어두자"는 인덱스는 조회를 빠르게 하지 않으면서 INSERT/UPDATE/DELETE 비용과 저장 공간만 늘린다.

2026-08-10 전수 점검 기준: 179 테이블 / 인덱스 624개.

---

## 1. 인덱스를 만드는 기준

### ✅ 반드시 만든다 — 참조 컬럼(FK / 논리 FK)

부모-자식 참조 컬럼(`*_id`)은 원칙적으로 인덱스를 만든다.

- **조인**에 쓰인다
- **선언된 FK 제약**이면 부모 행 DELETE/UPDATE 시 자식 테이블 검사에도 쓰인다.
  인덱스가 없으면 **부모 1건 삭제마다 자식 전체 seq scan** 이 돈다 — 데이터가 커질수록 급격히 악화된다
- 이 프로젝트는 선언된 FK 가 21개뿐이고 대부분 **논리 FK**(제약 없이 `*_id` 로만 참조)다.
  제약 유무와 무관하게 **참조 컬럼이면 동일하게 취급**한다

### ✅ 만든다 — 추적/식별용 준유니크 컬럼

`trace_id` 처럼 거의 유니크한 컬럼은 "이 건 하나 찾기"의 유일한 경로다. 로그 테이블이어도 만든다.
(액세스 로그는 `AccessLogQueue` 비동기 적재라 인덱스 쓰기 비용 영향이 작다.)

### ❌ 만들지 않는다 — 아래는 근거 있는 미생성

| 대상 | 이유 |
|---|---|
| **저카디널리티 컬럼** (고유값 2~5개) | 한 값이 전체 행의 상당수를 덮으면 플래너가 인덱스를 **쓰지 않는다**. seq scan 이 더 싸다 |
| **거의 전부 NULL 인 컬럼** | 인덱스에 실릴 행이 없다 |
| **`LIKE '%키워드%'` 로만 검색하는 컬럼** | 선두 와일드카드는 btree 를 못 탄다. 필요하면 btree 가 아니라 `pg_trgm` GIN 을 검토할 것 |
| **PK/UNIQUE 와 동일 구성의 별도 인덱스** | PK/UNIQUE 인덱스가 조회에 그대로 쓰인다. 중복분은 쓰기 비용만 추가 |

### ⚠ `reg_site_id` — 단독 인덱스 금지 (172개 테이블)

현재 고유값이 **1개**다. 단일 값이 전체 행을 덮으므로 인덱스를 만들어도 플래너가 쓰지 않는다.

멀티사이트 데이터가 실제로 쌓이면, **단독이 아니라 복합 인덱스**로 만든다:

```sql
-- ❌ 이렇게 하지 말 것
CREATE INDEX idx_pd_prod_site ON pd_prod (reg_site_id);

-- ✅ 자주 함께 쓰는 필터와 묶어서
CREATE INDEX idx_pd_prod_site_status ON pd_prod (reg_site_id, prod_status_cd);
```

> 참고: 컬럼 분포는 `reg_site_id` 172개 테이블 / `site_id` 2개 테이블이다.
> DDL 파일에 `site_id` 로 적혀 있어도 **실 DB 컬럼명은 `reg_site_id`** 인 경우가 있으니 반드시 실 DB 를 확인할 것.

---

## 2. 판단 절차 — 실측 통계로 결정한다

### STEP 1. 통계 갱신

```sql
ANALYZE;
```

### STEP 2. 인덱스 없는 참조 컬럼을 카디널리티와 함께 전수 추출

```sql
SELECT t.relname AS tbl, a.attname AS col,
       s.n_live_tup AS rows,
       st.n_distinct,                        -- 양수=고유값 개수 / 음수=행 대비 비율(-1=유니크)
       (st.null_frac*100)::int AS null_pct
FROM pg_class t
JOIN pg_namespace n ON n.oid = t.relnamespace
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum > 0 AND NOT a.attisdropped
JOIN pg_stat_user_tables s ON s.relid = t.oid
LEFT JOIN pg_stats st ON st.schemaname='shopjoy_2604' AND st.tablename=t.relname AND st.attname=a.attname
WHERE n.nspname = 'shopjoy_2604' AND t.relkind = 'r'
  AND a.attname LIKE '%\_id'
  AND a.attname <> 'reg_site_id'
  AND s.n_live_tup >= 100
  AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid = t.oid AND i.indkey[0] = a.attnum)
ORDER BY s.n_live_tup DESC;
```

**`n_distinct` 읽는 법**
- 음수 −1 에 가까움 → 거의 유니크 → **인덱스 효과 큼**
- 음수 −0.3 ~ −0.9 → 고유값이 행의 30~90% → **효과 있음**
- 양수 2~5 → 저카디널리티 → **만들지 않음**
- 양수라도 행 수 대비 크면(예: 9,507행 / 595) → **만듦**

### STEP 3. 인덱스 없는 FK 제약 확인

```sql
SELECT t.relname, a.attname, c.conname
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
WHERE c.contype='f' AND c.connamespace='shopjoy_2604'::regnamespace
  AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid=c.conrelid AND i.indkey[0]=c.conkey[1]);
```

**이 결과는 항상 0건이어야 한다.**

### STEP 4. 중복 인덱스 확인

```sql
SELECT t.relname AS tbl, i.indkey::text AS cols, string_agg(ci.relname,' | ') AS idxs
FROM pg_index i
JOIN pg_class ci ON ci.oid=i.indexrelid
JOIN pg_class t  ON t.oid=i.indrelid
JOIN pg_namespace n ON n.oid=t.relnamespace
WHERE n.nspname='shopjoy_2604'
GROUP BY t.relname, i.indkey::text HAVING count(*)>1;
```

**이 결과도 항상 0건이어야 한다.** PK/UNIQUE 와 겹치는 쪽을 DROP 한다.

### STEP 5. 접두중복(prefix-redundant) 인덱스 확인

단일컬럼 인덱스 `(a)` 가 이미 있는 복합 인덱스 `(a, b, ...)` 의 **선두와 같으면** 중복이다.
복합 인덱스가 `a` 단독 조회도 그대로 처리하므로, 단일 인덱스는 쓰기 비용과 공간만 더 쓴다.

**STEP 4(완전 일치 비교)로는 안 잡힌다. 반드시 따로 볼 것.**

```sql
SELECT t.relname AS tbl, ci.relname AS 중복, cj.relname AS 포함하는복합
FROM pg_index i
JOIN pg_class ci ON ci.oid=i.indexrelid
JOIN pg_class t  ON t.oid=i.indrelid
JOIN pg_namespace n ON n.oid=t.relnamespace
JOIN pg_index j ON j.indrelid=i.indrelid AND j.indexrelid<>i.indexrelid
JOIN pg_class cj ON cj.oid=j.indexrelid
WHERE n.nspname='shopjoy_2604'
  AND i.indnatts=1 AND j.indnatts>1
  AND i.indkey[0]=j.indkey[0]
  AND NOT i.indisunique AND NOT i.indisprimary;
```

### ⚠ `CREATE INDEX IF NOT EXISTS` 는 **이름**으로만 판단한다

컬럼 구성을 보지 않는다. 같은 이름의 인덱스가 **다른 컬럼**에 이미 있으면 **아무 말 없이 아무 것도 안 한다.**

```sql
-- 이미 idx_mb_like_target 가 (target_type_cd, target_id) 로 존재하는 상태에서
CREATE INDEX IF NOT EXISTS idx_mb_like_target ON mb_like (target_id);
--   → 에러도 경고도 없이 no-op. target_id 단독 인덱스는 생기지 않는다.
```

**그래서 검증은 "이름이 있는지" 가 아니라 "그 컬럼이 선두인 인덱스가 있는지" 로 해야 한다** (STEP 2 의 `NOT EXISTS ... indkey[0]` 조건).
이름 존재 여부로만 확인하면 생성됐다고 착각한다.

### ⚠ 다형 참조(polymorphic) 컬럼은 단독이 아니라 복합이다

`target_type_cd` + `target_id` 처럼 **타입 + ID 쌍**으로 대상을 가리키는 구조는
항상 두 컬럼을 함께 조건에 넣으므로 `(target_type_cd, target_id)` 복합이 정답이다.
`target_id` 단독 인덱스는 만들지 않는다. `pm_coupon_item` / `pm_event_item` / `pm_discnt_item` / `mb_like` 가 이 패턴이다.

### ⚠ seq_scan 수치만 보고 판단하지 말 것

`pg_stat_user_tables.seq_scan` 이 크다고 인덱스가 없는 게 아니다.
**수백 행짜리 작은 테이블은 플래너가 seq scan 을 고르는 것이 정상이고 더 빠르다.**
seq_scan 은 "의심 목록"을 좁히는 힌트일 뿐, 판단 근거는 **카디널리티(STEP 2)** 다.

---

## 3. 명명 규칙

```
idx_{테이블명}_{컬럼약칭}
```

- `_id` 접미어는 약칭에서 뗀다 — `pd_prod.category_id` → `idx_pd_prod_category`
- 복합 인덱스는 컬럼을 이어 붙인다 — `idx_pd_prod_site_status`

```sql
CREATE INDEX IF NOT EXISTS idx_pd_prod_sku_prod ON shopjoy_2604.pd_prod_sku (prod_id);
```

`IF NOT EXISTS` 를 붙여 재실행이 안전하게 한다.

---

## 4. 적용 방법

1. `_doc/ddl_pgsql/migration_YYYYMMDD_index_*.sql` 로 마이그레이션 파일 작성
2. **왜 만들었는지 / 왜 제외했는지**를 파일 주석에 남긴다 — 제외 근거가 없으면 나중에 누가 "빠졌네" 하며 되살린다
3. 실행 후 STEP 3·4 재확인 (둘 다 0건)
4. 마지막에 `ANALYZE;`

> 운영 DB 에 큰 테이블 인덱스를 추가할 때는 `CREATE INDEX CONCURRENTLY` 를 쓴다.
> 단, 트랜잭션 안에서 실행할 수 없으므로 `autoCommit=true` 로 별도 실행해야 한다.

---

## 5. 2026-08-10 적용 결과

전체 3차에 걸쳐 적용. **인덱스 602 → 714개** (순증 112).

| 차수 | 대상 | 마이그레이션 |
|---|---|---|
| 1차 | 행수 100건 이상 테이블 (상품·프로모션·시스템) | `migration_20260810_index_tuning.sql` |
| 2차 | 고객(mb)·주문(od)·정산(st)·시스템(sy) — **행수가 아니라 구조적 역할로 판단** | `migration_20260810_index_tuning2.sql` |
| 3차 | 잔여 참조컬럼 + **접두중복 25건 제거** | `migration_20260810_index_tuning3.sql` |

**최종 상태 (4개 지표 모두 0)**
- 인덱스 없는 FK 제약: **0**
- 완전중복 인덱스: **0**
- 접두중복 인덱스: **0**
- 남은 미인덱스 참조컬럼: 의도적 제외분만 잔존

### 2차의 판단 기준 — "현재 행수" 가 아니라 "구조적 역할"

이 DB 는 mb/od/st 샘플 데이터가 수십 건뿐이라 카디널리티로 거르면 전부 탈락한다.
그러나 **주문·클레임·정산·이력은 운영에서 가장 크게 자라는 테이블**이다.
따라서 이 도메인은 현재 통계가 아니라 **부모-자식 구조**로 판단했다.

근거 — 구조적 등치 필터가 실제로 쓰인다:
`.prodId.eq()` 39회 / `.memberId.eq()` 30회 / `.orderId.eq()` 21회 / `.claimId.eq()` 5회,
Spring Data 파생쿼리 `findByDlivId` / `findBySettleId` / `findByProdId` 등.

### 1차 상세

**생성 27건 / 중복 제거 2건**

| 분류 | 대상 |
|---|---|
| 인덱스 없던 FK 제약 (2) | `dp_panel_item.widget_lib_id`, `mb_member_role.grant_user_id` |
| 상품 (7) | `pd_prod_sku.prod_id` ⭐(9,507행/595고유 — 최대 효과), `pd_prod_content.prod_id`, `pd_review_comment.review_id`, `pd_prod`의 category/brand/vendor/md_user |
| 프로모션 (11) | `pm_coupon_issue`의 coupon/member/order, `pm_*_item.target_id` 4종, `pm_gift_cond.target_id`, `pm_save_issue.prod_id`, `pm_cache`의 member/proc_user |
| 시스템·전시 (4) | `sy_role_menu.menu_id` ⭐(튜닝 전 seq_scan 2,857 / idx_scan 0 — 권한 체크 경로), `sy_code_grp.path_id`, `dp_widget_lib.path_id`, `cm_blog_reply.writer_id` |
| 로그 추적 (3) | `syh_access_log.trace_id`, `syh_access_error_log.trace_id`, `syh_user_login_log.auth_id` |
| **중복 제거 (2)** | `idx_sy_site_site`(=`sy_site_pkey`), `idx_pm_coupon_code`(=`pm_coupon_coupon_cd_key`) |

**제외한 것 (되살리지 말 것)**

| 대상 | 근거 |
|---|---|
| `reg_site_id` 172개 테이블 | 고유값 1 — §1 참조 |
| `syh_access_log.role_id`(2) / `syh_access_error_log.role_id`(4) | 로그 테이블 + 저카디널리티 |
| `syh_*_log.dept_id`/`locale_id`/`vendor_id` | 대부분 NULL |
| `pd_prod_img.attach_id` | 전 행 NULL |
| `syh_user_login_log.login_id` | `QSyhUserLoginLogRepositoryImpl` 이 `FieldDef.like` 로만 검색 — btree 미사용 |
| `pd_prod.dliv_tmplt_id` | 카디널리티/NULL 비율 기준 미달 |

### 2차 상세 — 고객/주문/정산/시스템 (생성 69건)

| 도메인 | 주요 대상 |
|---|---|
| 고객 (mb/mbh) | ⭐`mb_member_sns (sns_channel_cd, sns_user_id)` 복합 — `SocialAuthService.findBySnsChannelCdAndSnsUserId` 조회 순서에 맞춤(소셜 로그인 경로), 로그인/토큰 로그의 `auth_id`·`trace_id` |
| 주문 (od) | ⭐`od_claim_item.claim_id`, 클레임/배송/주문의 상품·SKU·결재자·배송 참조 28건 |
| 정산 (st) | `vendor_id` 계열(정산은 업체 단위 집계가 기본), `st_settle_raw` 의 클레임·쿠폰·할인·상품권 역참조 15건 |
| 시스템 (sy) | `sy_bbs`·`sy_contact`(무한 증가 콘텐츠), `sy_user`의 dept/role, 트리 자기참조(menu/dept/role) 등 |

### 3차 상세 — 잔여 + 접두중복 정리

- 생성: 채팅(`cm_chatt_msg.chatt_room_id`), 대시보드, ⭐`pd_category.parent_category_id`(카테고리 트리 재귀), 상품이력 `pdh_*`, 발송/배치 이력 `syh_*` 등 45건
- 제거: **접두중복 25건** (§2 STEP 5 유형)

### 마이그레이션 파일

- [`migration_20260810_index_tuning.sql`](../../ddl_pgsql/migration_20260810_index_tuning.sql)
- [`migration_20260810_index_tuning2.sql`](../../ddl_pgsql/migration_20260810_index_tuning2.sql)
- [`migration_20260810_index_tuning3.sql`](../../ddl_pgsql/migration_20260810_index_tuning3.sql)

### 추가 제외 항목 (2·3차)

| 대상 | 근거 |
|---|---|
| `odh_*.chg_user_id` 13개 / `pdh_*.chg_user_id` | `QdslUtil.FieldDef.like` → `UPPER(col) LIKE '%값%'`. 선두 와일드카드 + 컬럼 함수라 btree 미사용. 이력 테이블은 운영 최대 증가 대상이라 안 쓰이는 인덱스의 쓰기 비용이 크다 |
| 고정 크기 설정 테이블의 `path_id` | `sy_alarm(11)` `sy_batch(20)` `sy_bbm(18)` `sy_brand(17)` `sy_role(52)` `sy_site(17)` `sy_template(59)` `sy_vendor(17)` `dp_ui(6)` `dp_area(18)` `dp_panel(36)` — 수십 건에서 더 자라지 않아 플래너가 쓰지 않는다. 반대로 `sy_bbs.path_id` 는 게시글이라 무한 증가 → 생성함 |
| `pm_*_item.target_id`, `mb_like.target_id` | 이미 `(target_type_cd, target_id)` 복합이 존재하며 그쪽이 정답 — §2 다형 참조 항목 참조 |

---

## 관련 문서

- [`base.DDL작성규칙.md`](base.DDL작성규칙.md) — DDL 파일 구조, 컬럼명 표준
- [`base.백엔드부팅성능.md`](base.백엔드부팅성능.md) — 부팅 시간 기준선
- [`../sy/sy.55.mybatis쿼리테이블별칭정책.md`](../sy/sy.55.mybatis쿼리테이블별칭정책.md) — SQL 테이블 별칭
- [`../sy/sy.57.사이트테넌시정책.md`](../sy/sy.57.사이트테넌시정책.md) — site_id 표준
