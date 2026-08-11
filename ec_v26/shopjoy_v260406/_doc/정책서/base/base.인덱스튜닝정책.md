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

## 3. 명명 규칙 ⭐ (2026-08-10 확정 · 전수 적용 완료)

### 3-1. 형식

```
{테이블명}_{타입}{순번}_{컬럼1}[_{컬럼2}][_x{총컬럼수}]
```

| 타입 | 형식 | 개수 |
|---|---|---|
| 일반 인덱스 | `{tbl}_ixNN_{col1}[_{col2}][_xN]` | 497 |
| PK (항상 단일 컬럼 — §3-3) | `{tbl}_pk_{col}` | 169 |
| UNIQUE | `{tbl}_uk[N]_{col1}[_{col2}][_xN]` | 43 |
| FK | `{tbl}_fk[N]_{col}` | 21 |

```
cm_chatt_ix01_chatt_status_cd
cm_chatt_ix02_reg_date
cm_chatt_pk_chatt_id
cm_blog_good_uk_blog_id_user_id_x2
cm_dashboard_item_data_ix01_dashboard_item_id_yyyymmdd_x4
dp_area_fk_ui_id
```

### 3-2. 규칙 상세

1. **테이블명이 맨 앞** — 정렬하면 테이블의 모든 인덱스·제약이 한 덩어리로 모인다. 이게 이 명명의 1순위 목적이다.
2. **타입은 2자로 통일** — `pk` / `uk` / `fk` / `ix`. 정렬 목록에서 타입 표기가 같은 자리에 온다.
   `idx` 가 아니라 **`ix`** 인 이유가 이것이다.
3. **순번**
   - 일반 인덱스: `ix01`, `ix02` … **2자리 0채움**. `ix1` 은 10개를 넘으면 `ix1, ix10, ix2` 로 정렬이 깨진다
   - PK: 테이블당 1개뿐이라 순번 없음
   - UK/FK: **첫 번째는 순번 없이** `_uk` / `_fk`, 두 번째부터 `_uk2` / `_fk2`
4. **컬럼명은 원형 그대로** — `member_id`, `channel_cd`. `_id`/`_cd` 를 떼지 않는다.
   실측상 떼도 최대 길이가 같았고(56자), 실제 컬럼명과 일치해야 매핑을 머릿속에서 안 한다.
5. **컬럼은 최대 2개까지만** 이름에 담는다. 3개 이상이어도 선두 2개까지.
6. **`_x{총컬럼수}` 는 컬럼이 2개 이상일 때 붙인다** — 이름에 다 못 담은 컬럼이 있음을 알리는 신호.
   `_x3` 인데 이름엔 2개만 보이면 "하나 더 있다 → 정의를 봐야 한다" 가 즉시 드러난다.
   단일 컬럼은 숨은 게 없으므로 붙이지 않는다.

### 3-3. PK 구조 정책 ⭐ — 대리키 단일 PK + 복합키는 UNIQUE

**모든 테이블은 자기 테이블명 기반 단일 컬럼을 PK 로 갖는다.**

```
PK 컬럼명 = {테이블명에서 도메인 접두어를 뺀 이름}_id
```

| 테이블 | PK 컬럼 |
|---|---|
| `cm_blog` | `blog_id` |
| `pd_prod_sku` | `prod_sku_id` |
| `pm_coupon_prod` | `coupon_prod_id` |

**복합키가 필요하면 PK 가 아니라 UNIQUE 제약으로 만든다.**
유일성 보장은 UNIQUE 가 그대로 해주므로 기능이 약해지지 않으면서,
- 자식 테이블이 부모를 참조할 때 컬럼 하나만 들고 가면 된다
- JPA 에서 `@IdClass` / `@EmbeddedId` 없이 단순 `@Id` 로 매핑된다
- `findById(id)` 같은 표준 메서드를 그대로 쓴다

```sql
-- ❌ 복합 PK
CONSTRAINT pm_coupon_prod_pk_coupon_id_prod_id_x2 PRIMARY KEY (coupon_id, prod_id)

-- ✅ 대리키 PK + UNIQUE
CONSTRAINT pm_coupon_prod_pk_coupon_prod_id      PRIMARY KEY (coupon_prod_id),
CONSTRAINT pm_coupon_prod_uk_coupon_id_prod_id_x2 UNIQUE     (coupon_id, prod_id)
```

**예외: 로그(`*_log`) · 이력(`*_hist`) 테이블**
적재 전용이라 개별 행을 키로 다룰 일이 없고, PK 컬럼명도 `log_id` / `hist_id` 처럼
짧은 관례명을 쓰는 곳이 많다. 강제하지 않는다.

#### 적용 이력 (2026-08-10) — 전수 정합 완료

- **복합 PK 5건** → 대리키 PK + UNIQUE 전환 (`migration_20260810_surrogate_pk.sql`)
- **PK 컬럼명 불일치 12건** → rename (`migration_20260810_pk_col_rename.sql`)
- 결과: 로그/이력 제외 **불일치 0건**

특히 두 건은 이름 충돌을 해소했다.

| 변경 | 이유 |
|---|---|
| `pm_coupon_issue.issue_id` → `coupon_issue_id` | 참조측(`od_order_discnt`·`od_order_item_discnt`·`st_settle_raw`)이 **이미 `coupon_issue_id` 로 부르고 있었다.** 원본 PK 만 달랐던 불일치 |
| `pd_prod_plan.plan_id` → `prod_plan_id` | `pm_plan.plan_id`(기획전)와 이름이 같아 의미가 혼동됐다 |

**⚠ 컬럼 rename 시 함께 봐야 하는 것**

1. **PK 제약명** — 제약명에 컬럼명이 들어가므로 같이 바꾼다.
   단, 코드 치환 시 `pm_coupon_issue_pk_issue_id` 의 `issue_id` 는 앞이 `_` 라
   단어경계 정규식에 안 걸린다. **별도로 처리해야 한다.**
2. **getter/setter** — `blogImgId` 만 바꾸면 `getBlogImgId()` 가 남아 컴파일이 깨진다.
   `get`/`set` 접두어를 포함해 치환할 것.
3. **같은 이름을 쓰는 다른 엔티티** — 무차별 치환 금지. 실제로 아래는 **보존 대상**이다.

   | 보존 | 이유 |
   |---|---|
   | `mb_like.like_id` | `mb_like` 의 정상 PK (`mb_` 제외 → `like_id`) |
   | `pm_plan.plan_id` / `pm_plan_item.plan_id` | 기획전 PK 및 그 FK |
   | `cm_blog_reply.parent_comment_id` | 자기참조 컬럼 (PK 아님) |
   | `cm_dashboard_menu.parent_node_id` | 자기참조 컬럼 |

4. **엔티티를 사용만 하는 파일** — 경로에 엔티티명이 없어 범위 지정에서 빠진다.
   실제로 `PdProdSalePricePlanJob` / `SySendMsgJob` 이 그랬다. **컴파일러가 최종 검증자**다.

### 3-4. ⚠ camelCase 금지

PostgreSQL 은 **따옴표 없는 식별자를 소문자로 접는다.** `..._memberId` 로 만들어도 실제로는
`..._memberid` 가 된다(실측 확인). 유지하려면 모든 참조를 `"..."` 로 감싸야 하는데
스키마 전체가 snake_case 이므로 맞지 않는다. **컬럼명은 snake_case 원형을 쓴다.**

### 3-5. ⚠ 제약명 = 인덱스명

PK/UNIQUE 는 제약이 인덱스를 백업하며 **PostgreSQL 이 두 이름을 항상 동기화**한다(불일치 0건).
따라서 이름을 바꿀 때는 반드시 제약 쪽 명령을 쓴다.

```sql
-- PK / UNIQUE / FK — 제약이므로 이 명령 (인덱스 이름도 함께 바뀐다)
ALTER TABLE shopjoy_2604.cm_chatt RENAME CONSTRAINT cm_chatt_pkey TO cm_chatt_pk_chatt_id;

-- 제약이 백업하지 않는 일반 인덱스만 이 명령
ALTER INDEX shopjoy_2604.idx_cm_chatt_status RENAME TO cm_chatt_ix01_chatt_status_cd;
```

`ALTER ... RENAME` 은 **즉시 완료되고 재생성이 없다.** PostgreSQL 은 쿼리에서 인덱스명을
참조하지 않으므로(인덱스 힌트 문법 없음) 애플리케이션 코드가 깨지지 않는다.

### 3-6. ⚠ DDL 파일의 무명 제약

DDL 에서 이름을 주지 않으면 PostgreSQL 이 `{tbl}_pkey` / `{tbl}_{col}_key` 로 자동 명명해
**DB 를 새로 만드는 순간 규칙이 깨진다.** 반드시 명시할 것.

```sql
-- ❌ 무명 (재생성 시 cm_blog_pkey 가 된다)
blog_id VARCHAR(21) NOT NULL PRIMARY KEY,
PRIMARY KEY (coupon_id, prod_id)

-- ✅ 명시
blog_id VARCHAR(21) NOT NULL CONSTRAINT cm_blog_pk_blog_id PRIMARY KEY,
CONSTRAINT pm_coupon_prod_pk_coupon_id_prod_id_x2 PRIMARY KEY (coupon_id, prod_id)
```

### 3-7. 길이

PostgreSQL 식별자 한계는 **63자**이며 넘으면 **조용히 잘려** 충돌이 날 수 있다.
현재 최대 58자로 여유가 있다. 초과 시에만 컬럼부를 잘라낸다.

### 3-8. 생성 예시

```sql
CREATE INDEX IF NOT EXISTS cm_chatt_ix01_chatt_status_cd
  ON shopjoy_2604.cm_chatt (chatt_status_cd);
```

`IF NOT EXISTS` 를 붙여 재실행이 안전하게 한다.
⚠ 단, **`IF NOT EXISTS` 는 이름으로만 판단**한다(§2 참조). 같은 이름이 다른 컬럼에 이미
있으면 아무 말 없이 no-op 이므로, 생성 확인은 이름이 아니라 `indkey[0]` 로 해야 한다.

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

### 4차 — 명명 규칙 전수 적용 (§3)

기존 이름이 **7가지 패턴**(`idx_` 492 / `_pkey` 158 / `_key` 36 / `pk_` 20 / `uq_` 3 / `ix_` 2 / 기타 3)
으로 갈려 있었고, 테이블명과 불일치하는 것이 69건이었다(예: `cm_blog` 테이블에 `cm_bltn_*`,
`odh_pay_chg_hist` 테이블에 `fk_ec_pay_chg_hist_pay` — 테이블 rename 후 인덱스명이 안 따라온 흔적).

**DB 인덱스·제약 전건 rename + DDL 파일 동기화 완료.** 규칙 외 0건.

DDL 파일에서 함께 정리한 것:
- 마이그레이션에만 있던 인덱스 정의 **150건을 기본 DDL 에 편입** (그대로 두면 DB 재생성 시 누락)
- 무명 인라인 PK **169건**에 `CONSTRAINT` 명시 (§3-5)
- `site_id` → `reg_site_id` 정정: 컬럼정의 167 + COMMENT 148
  (실 DB 는 `reg_site_id` 172개 테이블 / `site_id` 는 `sy_site`·`zd_simul_log` 2개뿐)
- `(site_id)` 인덱스 정의 **162건 제거** — 컬럼명만 고쳐도 `reg_site_id` 는 §1 에 따라 인덱스를
  만들지 않으므로(고유값 1) 정의 자체가 불필요

### 5차 — DDL ↔ DB 완전 정합 (2026-08-10 마무리)

앞 단계에서 보류했던 항목을 순서대로 해소했다. **순서가 중요하다** — 뒤집으면 제약이 유실된다.

1. **DDL 의 `CREATE UNIQUE INDEX` → 테이블 레벨 `CONSTRAINT ... UNIQUE` 전환 (37건)**
   DB 에서는 UNIQUE '제약'인데 DDL 은 인덱스로 표현하고 있었다. 그대로 재생성하면
   제약이 아닌 인덱스만 생겨 `pg_constraint` 에 안 잡힌다.
2. **누락 DDL 파일 생성 (2건)** — `cm_dashboard`, `cm_dashboard_item_data` 는
   **DB 에 있는데 DDL 파일이 아예 없었다.** 실 DB 에서 추출해 생성.
3. **obsolete DDL 파일 보관 이동 (4건)** — `_obsolete/` 로 이동(삭제 아님).
   `cm_chatt_room`(→`cm_chatt`), `cm_dashboard_data`(→`cm_dashboard_item_data`),
   `pd_prod_opt_item` / `pd_prod_opt_type`(→`pd_prod_opt`). 모두 DB 에 테이블이 없다.
   `vw_dp_disp` 는 **뷰**라 정상이므로 유지.
4. **DB 에 없는 인덱스 정의 제거 (71건)** — 1번을 끝낸 뒤라 안전해졌다.
   내역: 의도적 DROP 36 / 없는 컬럼(`site_id`) 참조 19 / UNIQUE 잔재 16.
   특히 `(site_id, ...)` 참조 19건은 컬럼이 없어 **재생성 시 에러가 나던 것**이다.

**최종 상태 — 5개 지표 전부 0**

| 지표 | 결과 |
|---|---|
| 인덱스 없는 FK 제약 | 0 |
| 완전중복 인덱스 | 0 |
| 복합 PK | 0 |
| PK 컬럼명 불일치(로그/이력 제외) | 0 |
| 명명규칙 위반 | 0 |
| DDL↔DB 인덱스 차이 | 0 (추가 0 / DDL 전용 0) |

**⚠ 이 작업에서 배운 함정 — 다음에 같은 점검을 할 때 반드시 확인할 것**

- **비교 기준을 만들 때 넣은 필터가 그대로 삭제 기준이 된다.**
  `zz_*` / `flyway_schema_history` 를 제외하고 "DB 인덱스 목록"을 뽑은 뒤 그것과 DDL 을 비교했더니,
  제외된 테이블의 정의가 전부 "DB 에 없음"으로 잡혀 **10건 넘게 잘못 삭제될 뻔했다.**
  삭제 전에는 반드시 `pg_indexes` 로 **개별 실존 확인**을 할 것.
- **삭제는 항상 마지막에.** UNIQUE 를 제약으로 보존하기 전에 인덱스 정의를 지웠다면 제약 49건이 사라졌다.

### 6차 — 샘플 INSERT(`_doc/sample_insert_pgsql/`) 정합

DDL 뿐 아니라 **샘플 INSERT 도 컬럼명을 직접 쓰므로** 컬럼 rename 의 영향을 받는다.
`SeedAudit` 로 INSERT 문 2,496건의 (테이블, 컬럼)을 실 DB 스키마와 대조했다.

**적용 완료**
- `site_id` → `reg_site_id` (19개 파일) — 안 고치면 재시딩이 전부 실패한다
- `bundle_item_id` → `prod_bundle_item_id`, `set_item_id` → `prod_set_item_id`
- `qna_*` → `prod_qna_*`, `sku_id`/`sku_code` → `prod_sku_*`, `reg_dt`/`rgtr` → `reg_date`/`reg_by`

**⚠ 미해결 — 오늘 작업과 무관한 기존 누적 드리프트 (5개 파일)**

단순 rename 이 아니라 성격별로 판단이 필요해 손대지 않았다.

| 분류 | 대상 | 왜 기계적으로 못 고치나 |
|---|---|---|
| 컬럼 자체가 사라짐 | `pd_prod.prod_stock`·`sale_count`, `pd_prod_sku.prod_opt_stock`, `pd_prod_opt.prod_opt_type_*` | 재고 구조가 재설계돼 대응 컬럼이 없다. INSERT 문 재작성 필요 |
| 값 의미가 바뀜 | `sy_code.code_grp` → `code_grp_id`, `sy_code_grp.disp_path` → `path_id` | 이름만 바꾸면 안 되고 **값도 코드문자열→ID 로 바꿔야 한다** |
| 대상 폐기 | `co_dashboard.sql`(테이블 없음), `pd_prod_opt_type`(폐기) | 파일 자체가 obsolete |
| 스키마 전면 상이 | `sy_zz_sample2_insert.sql` | `item_code/price/quantity` ↔ 실제 `cd_grp/cd_vl/cd_nm` — 다른 설계의 잔재 |

**해소 완료 (2026-08-10)** — 위 미해결분을 아래와 같이 정리해 **INSERT 2,696건 전부 스키마 정합**(테이블 없음 0 / 컬럼 없음 0).

| 파일 | 처리 |
|---|---|
| `sy_code.sql` (1,331건) · `sy_code_grp.sql` (245건) | **DB 에서 재생성**. `code_grp`→`code_grp_id`, `disp_path`→`path_id` 드리프트가 원천 해소됨. 공통코드는 전 화면이 의존하는 기반 데이터라 최우선 처리 |
| `cm_dashboard.sql`(25) · `cm_dashboard_item.sql`(150) | **신규 생성**. 기존 `co_dashboard.sql` 은 `co_`→`cm_` rename 이전 잔재였다 |
| `sy_code_prod_opt.sql` | `_obsolete/` 이동 — `sy_code` 재생성분에 포함됨 |
| `co_dashboard.sql` | `_obsolete/` 이동 — 대상 테이블 없음 |
| `sy_zz_sample2_insert.sql` | `_obsolete/` 이동 — 스키마 전면 상이 + DB 테이블 0행 |
| `pd_prod_samples.sql` | `_obsolete/` 이동 — 제거된 컬럼(`prod_stock`/`sale_count`/`prod_opt_type_*`) 참조. 상품 샘플은 "무엇을 샘플로 둘지"가 업무 판단이라 재생성하지 않고 보관 |

### 재생성 도구

```bash
# 실 DB 데이터를 INSERT 문으로 내보낸다. 컬럼 목록을 스키마에서 읽으므로 드리프트가 원천 차단된다.
java -cp <postgresql.jar> c:/tmp/GenInsert.java <테이블> [정렬컬럼] > out.sql
# 전체 검증
java -cp <postgresql.jar> c:/tmp/SeedAudit.java
```

⚠ 재생성은 **현재 DB 데이터를 그대로 박제**한다. 테스트로 만든 행이 섞여 있으면 함께 들어가므로,
기반 데이터(공통코드 등)에는 적합하지만 업무 샘플에는 내용 검토가 필요하다.

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
