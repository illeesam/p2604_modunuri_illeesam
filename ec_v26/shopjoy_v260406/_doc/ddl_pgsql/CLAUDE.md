# DDL (Database Definition Language) 가이드

이 디렉토리는 PostgreSQL 데이터베이스 스키마 정의 파일들을 관리합니다.

## 🏗️ 구조

```
ddl_pgsql/
├── 단어사전.sql              (← 필수 참고: 모든 명명 규칙 정의)
├── sy/                       (System: 시스템/공통 테이블)
│   ├── sy_site.sql          (사이트)
│   ├── sy_user.sql          (관리자 사용자)
│   ├── sy_user_role.sql     (사용자-역할 매핑)
│   ├── sy_code_grp.sql      (공통코드 그룹)
│   └── ...
└── ec/                       (E-Commerce: 전자상거래 테이블)
    ├── ec_member.sql        (회원)
    ├── ec_prod.sql          (상품)
    ├── ec_order.sql         (주문)
    └── ...
```

## 📋 필수 명명 규칙 (단어사전.sql 참고)

### 1. Primary Key
**모든 테이블은 `테이블명_id`를 단일 PK로 사용**

```sql
CREATE TABLE sy_user (
    user_id         VARCHAR(16)     NOT NULL,  -- PK
    ...
    PRIMARY KEY (user_id)
);
```

⚠️ **복합 PK 금지** → UNIQUE INDEX로 대체
```sql
CREATE TABLE sy_user_role (
    user_role_id    VARCHAR(16)     NOT NULL,  -- PK
    user_id         VARCHAR(16)     NOT NULL,  -- FK
    role_id         VARCHAR(16)     NOT NULL,  -- FK
    ...
    PRIMARY KEY (user_role_id),
    UNIQUE (user_id, role_id)  -- ← 복합 제약은 UNIQUE로
);
```

### 2. 금액 (_amt)
**"금액"으로 끝나는 모든 컬럼 → `복합어_amt`**

```sql
discount_amt       -- O (할인금액)
refund_amt         -- O (환불금액)
cache_amt          -- O (적립금액)
appr_amt           -- O (결재금액)

amount             -- X (단독 금지)
balance            -- X (단독 금지)
```

### 3. 수량 (_qty)
**"수량"으로 끝나는 모든 컬럼 → `복합어_qty`**

```sql
order_qty          -- O (주문수량)
claim_qty          -- O (클레임수량)
stock_qty          -- O (재고수량)

qty                -- X (단독 금지)
```

### 4. 가격 (_price)
**수식어는 필수, 단독 사용 금지**

```sql
list_price         -- O (정가)
sale_price         -- O (판매가)
unit_price         -- O (단가)
item_price         -- O (소계)

price              -- X (단독 금지)
```

### 5. 상태 코드 (status_cd)
**테이블명을 프리픽스로 사용: `[도메인_][엔티티_]상태명_cd`**

```sql
-- 시스템 테이블
user_status_cd          (sy_user)
alarm_status_cd         (sy_alarm)
batch_status_cd         (sy_batch)
bbs_status_cd           (sy_bbs)
contact_status_cd       (sy_contact)
notice_status_cd        (sy_notice)
site_status_cd          (sy_site)
vendor_status_cd        (sy_vendor)
vendor_content_status_cd (sy_vendor_content)
vendor_user_status_cd   (sy_vendor_user)
send_hist_status_cd     (sy_alarm_send_hist)

-- 이커머스 테이블
member_status_cd        (ec_member)
order_status_cd         (ec_order)
order_item_status_cd    (ec_order_item)
dliv_status_cd          (ec_dliv)
dliv_item_status_cd     (ec_dliv_item)
claim_status_cd         (ec_claim)
claim_item_status_cd    (ec_claim_item)
coupon_status_cd        (ec_coupon)
event_status_cd         (ec_event)
prod_status_cd          (ec_prod)
category_status_cd      (ec_category)
chatt_status_cd         (ec_chatt)
comment_status_cd       (ec_blog_comment)
reply_status_cd         (ec_review_reply)
disp_panel_status_cd    (ec_disp_panel)
disp_widget_status_cd   (ec_disp_widget)
```

### 6. 설명 컬럼 (desc)
**`description` 대신 `desc` 사용**

```sql
product_desc           -- O
category_desc          -- O
template_desc          -- O

product_description    -- X
```

### 7. 결재 (appr)
**`approval` 대신 `appr` 사용**

```sql
appr_status_cd         -- O
appr_amt               -- O
appr_reason            -- O
appr_req_user_id       -- O
appr_req_date          -- O
appr_aprv_user_id      -- O
appr_aprv_date         -- O

approval_status_cd     -- X
```

### 8. 깊이 (depth)
**`depth` 대신 `테이블명_depth` 사용**

```sql
category_depth         -- O (ec_category)
```

## 🔍 테이블 설계 패턴

### 기본 구조
```sql
CREATE TABLE 도메인_엔티티명 (
    -- PK: 항상 테이블명_id
    엔티티_id        VARCHAR(16)     NOT NULL,
    
    -- FK: 참조 테이블명_id
    site_id         VARCHAR(16),
    parent_엔티티_id VARCHAR(16),
    
    -- 기본 데이터
    엔티티_nm        VARCHAR(100)    NOT NULL,
    
    -- 코드형 컬럼: 테이블명_상태명_cd
    테이블명_status_cd VARCHAR(20)  DEFAULT 'ACTIVE',
    
    -- 금액: 복합어_amt
    discount_amt    BIGINT          DEFAULT 0,
    
    -- 수량: 복합어_qty
    order_qty       INTEGER         DEFAULT 1,
    
    -- 설명: desc (not description)
    desc            TEXT,
    
    -- 감사필드: 항상 이 4개 포함
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    
    PRIMARY KEY (엔티티_id)
);

COMMENT ON TABLE  도메인_엔티티명 IS '엔티티 설명';
COMMENT ON COLUMN 도메인_엔티티명.엔티티_id IS '엔티티ID (YYMMDDhhmmss+rand4)';
...
```

### 감사필드 (Audit Fields) 규칙
**모든 테이블에 포함 필수**

```sql
reg_by          VARCHAR(16),                           -- 등록자 (sy_user.user_id, ec_member.member_id)
reg_date        TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,  -- 등록일
upd_by          VARCHAR(16),                           -- 수정자 (sy_user.user_id, ec_member.member_id)
upd_date        TIMESTAMP,                             -- 수정일
```

⚠️ `reg_by`, `upd_by`는 sy_user.user_id **또는** ec_member.member_id 둘 다 참조 가능

## 📝 테이블 작성 체크리스트

새 테이블을 추가할 때 다음을 확인하세요:

- [ ] **PK**: `테이블명_id`로 정의됨
- [ ] **코드형**: `테이블명_상태명_cd` 형식 적용
- [ ] **금액**: 모든 금액 컬럼이 `_amt` 서픽스 사용
- [ ] **수량**: 모든 수량 컬럼이 `_qty` 서픽스 사용
- [ ] **설명**: `description` 대신 `desc` 사용
- [ ] **감사필드**: reg_by, reg_date, upd_by, upd_date 포함
- [ ] **코멘트**: 테이블과 모든 컬럼에 한글 설명 추가
- [ ] **인덱스**: FK 및 자주 검색되는 컬럼에 인덱스 추가
- [ ] **UNIQUE**: 필요하면 UNIQUE INDEX로 정의

## 🔗 도메인 접두사

| 접두사 | 설명 | 예시 |
|--------|------|------|
| `sy_` | **System** (공통/시스템) | sy_user, sy_site, sy_code_grp |
| `ec_` | **E-Commerce** (이커머스/쇼핑몰) | ec_member, ec_prod, ec_order |

## 📚 참고 문서

- **단어사전.sql**: 모든 약어, 약자, 엔티티 정의
- **프로젝트 루트 CLAUDE.md**: 전체 프로젝트 구조

## ⚠️ 자주 하는 실수

❌ **단독 단어 사용**
```sql
qty                -- X (order_qty, stock_qty 사용)
amt                -- X (discount_amt, refund_amt 사용)
price              -- X (list_price, sale_price 사용)
description        -- X (desc 사용)
approval_*         -- X (appr_* 사용)
```

❌ **비표준 PK**
```sql
PRIMARY KEY (code_grp)           -- X
PRIMARY KEY (user_id, role_id)   -- X (UNIQUE 대체)
```

❌ **테이블명 프리픽스 없는 상태 코드**
```sql
status_cd          -- X (alarm_status_cd, order_status_cd 사용)
```

✅ **올바른 사용**
```sql
order_qty          -- O
discount_amt       -- O
list_price         -- O
desc               -- O
appr_amt           -- O
alarm_status_cd    -- O
```
