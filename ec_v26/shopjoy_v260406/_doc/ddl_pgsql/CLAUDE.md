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
    ├── mb_mem.sql        (회원)
    ├── pd_prod.sql          (상품)
    ├── od_order.sql         (주문)
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
member_status_cd        (mb_mem)
order_status_cd         (od_order)
order_item_status_cd    (od_order_item)
dliv_status_cd          (od_dliv)
dliv_item_status_cd     (od_dliv_item)
claim_status_cd         (od_claim)
claim_item_status_cd    (od_claim_item)
coupon_status_cd        (pm_coupon)
event_status_cd         (pm_event)
prod_status_cd          (pd_prod)
category_status_cd      (pd_category)
chatt_status_cd         (od_chatt)
comment_status_cd       (cm_bltn_reply)
reply_status_cd         (pd_review_reply)
disp_panel_status_cd    (dp_panel)
disp_widget_status_cd   (dp_widget)
```

### 6. 설명 컬럼 (entity_desc 패턴)
**`description` 대신 `entity_desc` 패턴 사용 — 단독 `desc` 금지**

```sql
product_desc           -- O (상품설명)
category_desc          -- O (카테고리설명)
coupon_desc            -- O (쿠폰설명)
event_desc             -- O (이벤트설명)
area_desc              -- O (영역설명)
cache_desc             -- O (적립금설명)

desc                   -- X (단독 금지)
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
category_depth         -- O (pd_category)
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
    
    -- 설명: entity_desc (entity = 테이블/도메인명)
    entity_desc     TEXT,
    
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
reg_by          VARCHAR(16),                           -- 등록자 (sy_user.user_id, mb_mem.member_id)
reg_date        TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,  -- 등록일
upd_by          VARCHAR(16),                           -- 수정자 (sy_user.user_id, mb_mem.member_id)
upd_date        TIMESTAMP,                             -- 수정일
```

⚠️ `reg_by`, `upd_by`는 sy_user.user_id **또는** mb_mem.member_id 둘 다 참조 가능

## 📝 테이블 작성 체크리스트

새 테이블을 추가할 때 다음을 확인하세요:

- [ ] **PK**: `테이블명_id`로 정의됨
- [ ] **코드형**: `테이블명_상태명_cd` 형식 적용
- [ ] **금액**: 모든 금액 컬럼이 `_amt` 서픽스 사용
- [ ] **수량**: 모든 수량 컬럼이 `_qty` 서픽스 사용
- [ ] **설명**: `description` 대신 `entity_desc` 패턴 사용 (테이블명_desc)
- [ ] **감사필드**: reg_by, reg_date, upd_by, upd_date 포함
- [ ] **코멘트**: 테이블과 모든 컬럼에 한글 설명 추가 (실제 컬럼명과 일치 필수)
- [ ] **인덱스**: FK 및 자주 검색되는 컬럼에 인덱스 추가 (실제 컬럼명으로 정의)
- [ ] **UNIQUE**: 필요하면 UNIQUE INDEX로 정의
- [ ] **코멘트-컬럼 검증**: COMMENT ON COLUMN이 실제 컬럼명과 정확히 일치하는지 확인

### ⚠️ 자주 나는 실수: 코멘트와 인덱스 불일치

**문제**: 컬럼명은 `coupon_status_cd`인데 COMMENT와 INDEX가 `status_cd`를 참조

```sql
-- 잘못된 예
CREATE TABLE pm_coupon (
    ...
    coupon_status_cd VARCHAR(20) ...  -- ✅ 컬럼명 (복합어)
    ...
);

COMMENT ON COLUMN pm_coupon.status_cd ...  -- ❌ 오류: 실제 컬럼명은 coupon_status_cd
CREATE INDEX idx_ec_coupon_status ON pm_coupon (status_cd);  -- ❌ 오류
```

**올바른 예**:
```sql
CREATE TABLE pm_coupon (
    ...
    coupon_status_cd VARCHAR(20) ...
    ...
);

COMMENT ON COLUMN pm_coupon.coupon_status_cd ...  -- ✅ 실제 컬럼명 일치
CREATE INDEX idx_ec_coupon_status ON pm_coupon (coupon_status_cd);  -- ✅ 실제 컬럼명 일치
```

**검증 방법**: 각 테이블 수정 시 `COMMENT ON COLUMN 테이블명.컬럼명` 의 컬럼명이 CREATE TABLE 정의와 100% 일치하는지 확인

## 🔗 도메인 접두사

| 접두사 | 설명 | 예시 |
|--------|------|------|
| `sy_` | **System** (공통/시스템) | sy_user, sy_site, sy_code_grp |
| `ec_` | **E-Commerce** (이커머스/쇼핑몰) | mb_mem, pd_prod, od_order |

## 📚 참고 문서

- **단어사전.sql**: 모든 약어, 약자, 엔티티 정의
- **프로젝트 루트 CLAUDE.md**: 전체 프로젝트 구조

## ⚠️ 자주 하는 실수

❌ **단독 단어 사용 금지**
```sql
qty                -- X (order_qty, stock_qty 사용)
amt                -- X (discount_amt, refund_amt 사용)
price              -- X (list_price, sale_price 사용)
stock              -- X (prod_stock, prod_opt_stock 사용)
title              -- X (event_title, notice_title, review_title, push_log_title, contact_title, bbs_title 사용)
content            -- X (event_content, push_log_content, review_content, blog_comment_content, contact_content, template_content 등)
name               -- X (member_nm, prod_nm, category_nm 사용)
phone              -- X (member_phone, user_phone 사용)
email              -- X (member_email, user_email 사용)
password           -- X (member_password, user_password 사용)
gender             -- X (member_gender, user_gender 사용)
addr               -- X (member_addr, user_addr 사용)
addr_detail        -- X (member_addr_detail, user_addr_detail 사용)
zip_code           -- X (member_zip_code, user_zip_code 사용)
memo               -- X (chatt_memo, order_memo 사용)
subject            -- X (template_subject, contact_subject 사용)
answer             -- X (contact_answer, faq_answer 사용)
remark             -- X (user_role_remark, vendor_content_remark, vendor_remark, vendor_user_remark, vendor_brand_remark 사용)
title              -- X (vendor_content_title, event_title 등 이미 포함)
subtitle           -- X (vendor_content_subtitle 사용)
fax                -- X (vendor_fax 사용)
homepage           -- X (vendor_homepage 사용)
mobile             -- X (vendor_user_mobile 사용)
desc               -- X (product_desc, category_desc, coupon_desc 등)
description        -- X (entity_desc 패턴 사용)
approval_*         -- X (appr_* 사용)
```
⚠️ **예외: *_log, *_hist 테이블은 1단어 컬럼 허용**
```sql
-- _log 테이블: 단독 1단어 허용 (ip, device, token, os, browser 등)
sy_user_login_log.ip, sy_user_login_log.device, sy_user_login_log.os, sy_user_login_log.browser
sy_user_token_log.token, sy_user_token_log.ip, sy_user_token_log.device
mb_mem_login_log.ip, mb_mem_login_log.device, mb_mem_login_log.country
mb_mem_token_log.token, mb_mem_token_log.ip, mb_mem_token_log.device
sy_api_log.api_nm, sy_api_log.req_body, sy_api_log.res_body, sy_api_log.http_status
pd_prod_view_log.ip, pd_prod_view_log.device, pd_prod_view_log.referrer

-- _hist 테이블: 원본테이블명_컬럼명 + 기타 1단어 허용
od_order_chg_hist: order_id, order_no (원본), chg_type, chg_reason (1단어)
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
prod_stock         -- O (entity_stock 패턴)
prod_opt_stock     -- O
event_title        -- O (entity_title 패턴)
notice_title       -- O
push_log_title     -- O
review_title       -- O
contact_title      -- O
bbs_title          -- O
event_content      -- O (entity_content 패턴)
push_log_content   -- O
review_content     -- O
blog_comment_content -- O
contact_content    -- O
template_content   -- O
member_nm          -- O (entity_nm 패턴)
member_phone       -- O (entity_phone 패턴)
member_email       -- O (entity_email 패턴)
member_password    -- O (entity_password 패턴)
member_gender      -- O (entity_gender 패턴)
member_addr        -- O (entity_addr 패턴)
member_addr_detail -- O
member_zip_code    -- O
chatt_memo         -- O (entity_memo 패턴)
template_subject   -- O (entity_subject 패턴)
contact_answer     -- O (entity_answer 패턴)
user_role_remark   -- O (entity_remark 패턴)
vendor_content_remark -- O
vendor_remark      -- O
vendor_user_remark -- O
vendor_content_title -- O (entity_title 패턴)
vendor_content_subtitle -- O (entity_subtitle 패턴)
vendor_phone       -- O (entity_phone 패턴)
vendor_email       -- O (entity_email 패턴)
vendor_addr        -- O (entity_addr 패턴)
vendor_zip_code    -- O
vendor_fax         -- O
vendor_homepage    -- O
vendor_bank_nm     -- O
vendor_bank_account -- O
vendor_bank_holder -- O
vendor_user_phone  -- O
vendor_user_email  -- O
vendor_user_mobile -- O
vendor_user_dept_nm -- O
vendor_brand_remark -- O (entity_remark 패턴)
product_desc       -- O (entity_desc 패턴)
coupon_desc        -- O
appr_amt           -- O
alarm_status_cd    -- O
```
