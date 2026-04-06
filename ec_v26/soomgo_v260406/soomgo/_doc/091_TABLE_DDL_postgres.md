# DDL - PostgreSQL

> 숨고 클론 프로젝트 테이블 DDL  
> DB: PostgreSQL 15+  
> 이니셜: `ec_` 이커머스/서비스 | `sy_` 시스템 공통

---

## 스키마 생성

```sql
CREATE SCHEMA IF NOT EXISTS soomgo;
SET search_path = soomgo;
```

---

## sy_ 시스템 공통 테이블

### sy_code — 공통 코드

```sql
CREATE TABLE sy_code (
    code_id         BIGSERIAL       NOT NULL,
    code_grp        VARCHAR(50)     NOT NULL,           -- 코드 그룹 (예: ORDER_STATUS)
    code_label      VARCHAR(100)    NOT NULL,           -- 화면 표시 라벨
    code_value      VARCHAR(100)    NOT NULL,           -- 실제 코드 값
    sort_ord        INT             NOT NULL DEFAULT 0, -- 정렬 순서
    use_yn          CHAR(1)         NOT NULL DEFAULT 'Y' CHECK (use_yn IN ('Y','N')),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_sy_code PRIMARY KEY (code_id),
    CONSTRAINT uq_sy_code_grp_value UNIQUE (code_grp, code_value)
);

COMMENT ON TABLE  sy_code             IS '공통 코드';
COMMENT ON COLUMN sy_code.code_id     IS '코드 ID';
COMMENT ON COLUMN sy_code.code_grp    IS '코드 그룹';
COMMENT ON COLUMN sy_code.code_label  IS '코드 라벨 (화면 표시)';
COMMENT ON COLUMN sy_code.code_value  IS '코드 값';
COMMENT ON COLUMN sy_code.sort_ord    IS '정렬 순서';
COMMENT ON COLUMN sy_code.use_yn      IS '사용 여부 (Y/N)';
```

---

### sy_user — 시스템 사용자 (관리자)

```sql
CREATE TABLE sy_user (
    user_id         BIGSERIAL       NOT NULL,
    login_id        VARCHAR(100)    NOT NULL,           -- 로그인 아이디
    login_pw        VARCHAR(255)    NOT NULL,           -- 비밀번호 (BCrypt)
    user_name       VARCHAR(100)    NOT NULL,           -- 사용자명
    user_email      VARCHAR(200),                       -- 이메일
    role_cd         VARCHAR(50)     NOT NULL DEFAULT 'OPERATOR', -- sy_code(USER_ROLE)
    use_yn          CHAR(1)         NOT NULL DEFAULT 'Y' CHECK (use_yn IN ('Y','N')),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_sy_user PRIMARY KEY (user_id),
    CONSTRAINT uq_sy_user_login_id UNIQUE (login_id)
);

COMMENT ON TABLE  sy_user            IS '시스템 사용자 (관리자)';
COMMENT ON COLUMN sy_user.user_id    IS '사용자 ID';
COMMENT ON COLUMN sy_user.login_id   IS '로그인 ID';
COMMENT ON COLUMN sy_user.login_pw   IS '비밀번호 (BCrypt 해시)';
COMMENT ON COLUMN sy_user.user_name  IS '사용자명';
COMMENT ON COLUMN sy_user.user_email IS '이메일';
COMMENT ON COLUMN sy_user.role_cd    IS '역할 코드 (sy_code: USER_ROLE)';
COMMENT ON COLUMN sy_user.use_yn     IS '사용 여부 (Y/N)';
```

---

### sy_attach_grp — 첨부파일 그룹

```sql
CREATE TABLE sy_attach_grp (
    attach_grp_id   BIGSERIAL       NOT NULL,
    grp_name        VARCHAR(100),                       -- 그룹명 (선택)
    ref_table       VARCHAR(100),                       -- 참조 테이블명
    ref_id          BIGINT,                             -- 참조 레코드 ID
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_sy_attach_grp PRIMARY KEY (attach_grp_id)
);

COMMENT ON TABLE  sy_attach_grp               IS '첨부파일 그룹';
COMMENT ON COLUMN sy_attach_grp.attach_grp_id IS '첨부 그룹 ID';
COMMENT ON COLUMN sy_attach_grp.grp_name      IS '그룹명';
COMMENT ON COLUMN sy_attach_grp.ref_table     IS '참조 테이블명';
COMMENT ON COLUMN sy_attach_grp.ref_id        IS '참조 레코드 ID';
```

---

### sy_attach — 첨부파일

```sql
CREATE TABLE sy_attach (
    attach_id       BIGSERIAL       NOT NULL,
    attach_grp_id   BIGINT          NOT NULL,           -- sy_attach_grp FK
    orig_file_name  VARCHAR(255)    NOT NULL,           -- 원본 파일명
    file_path       VARCHAR(500)    NOT NULL,           -- 저장 경로 (S3 key 등)
    file_size       BIGINT          NOT NULL DEFAULT 0, -- 파일 크기 (bytes)
    file_type       VARCHAR(100),                       -- MIME 타입
    sort_ord        INT             NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_sy_attach PRIMARY KEY (attach_id),
    CONSTRAINT fk_sy_attach_grp FOREIGN KEY (attach_grp_id)
        REFERENCES sy_attach_grp (attach_grp_id)
);

CREATE INDEX idx_sy_attach_grp_id ON sy_attach (attach_grp_id);

COMMENT ON TABLE  sy_attach                IS '첨부파일';
COMMENT ON COLUMN sy_attach.attach_id      IS '첨부파일 ID';
COMMENT ON COLUMN sy_attach.attach_grp_id  IS '첨부 그룹 ID';
COMMENT ON COLUMN sy_attach.orig_file_name IS '원본 파일명';
COMMENT ON COLUMN sy_attach.file_path      IS '저장 경로 (URL 또는 S3 key)';
COMMENT ON COLUMN sy_attach.file_size      IS '파일 크기 (bytes)';
COMMENT ON COLUMN sy_attach.file_type      IS 'MIME 타입';
COMMENT ON COLUMN sy_attach.sort_ord       IS '정렬 순서';
```

---

### sy_login_hist — 로그인 이력

```sql
CREATE TABLE sy_login_hist (
    login_hist_id   BIGSERIAL       NOT NULL,
    user_id         BIGINT,                             -- sy_user FK (관리자)
    member_id       BIGINT,                             -- ec_member FK (일반 회원)
    login_dt        TIMESTAMP       NOT NULL DEFAULT NOW(),
    login_ip        VARCHAR(45),                        -- IPv4/IPv6
    login_result_cd VARCHAR(20)     NOT NULL,           -- sy_code(LOGIN_RESULT)
    user_agent      VARCHAR(500),                       -- 브라우저 정보

    CONSTRAINT pk_sy_login_hist PRIMARY KEY (login_hist_id),
    CONSTRAINT fk_sy_login_hist_user FOREIGN KEY (user_id)
        REFERENCES sy_user (user_id),
    CONSTRAINT chk_sy_login_hist_actor CHECK (
        user_id IS NOT NULL OR member_id IS NOT NULL   -- 둘 중 하나는 필수
    )
);

CREATE INDEX idx_sy_login_hist_user_id   ON sy_login_hist (user_id);
CREATE INDEX idx_sy_login_hist_member_id ON sy_login_hist (member_id);
CREATE INDEX idx_sy_login_hist_login_dt  ON sy_login_hist (login_dt DESC);

COMMENT ON TABLE  sy_login_hist                  IS '로그인 이력';
COMMENT ON COLUMN sy_login_hist.login_hist_id    IS '로그인 이력 ID';
COMMENT ON COLUMN sy_login_hist.user_id          IS '시스템 사용자 ID (관리자)';
COMMENT ON COLUMN sy_login_hist.member_id        IS '회원 ID (일반 회원)';
COMMENT ON COLUMN sy_login_hist.login_dt         IS '로그인 일시';
COMMENT ON COLUMN sy_login_hist.login_ip         IS '접속 IP';
COMMENT ON COLUMN sy_login_hist.login_result_cd  IS '로그인 결과 코드 (sy_code: LOGIN_RESULT)';
COMMENT ON COLUMN sy_login_hist.user_agent       IS '브라우저/클라이언트 정보';
```

---

## ec_ 이커머스/서비스 테이블

### ec_member — 회원

```sql
CREATE TABLE ec_member (
    member_id           BIGSERIAL       NOT NULL,
    user_id             BIGINT,                         -- sy_user FK (소셜/자체 연동)
    member_type_cd      VARCHAR(20)     NOT NULL,       -- sy_code(MEMBER_TYPE): CLIENT/PRO
    member_name         VARCHAR(100)    NOT NULL,       -- 이름
    phone               VARCHAR(20),                    -- 연락처
    email               VARCHAR(200)    NOT NULL,       -- 이메일
    location            VARCHAR(100),                   -- 활동 지역
    bio                 TEXT,                           -- 자기 소개 (고수)
    profile_attach_id   BIGINT,                         -- sy_attach FK (프로필 이미지)
    avg_rating          DECIMAL(3,1)    NOT NULL DEFAULT 0.0,
    review_cnt          INT             NOT NULL DEFAULT 0,
    response_rate       INT             NOT NULL DEFAULT 0, -- %
    del_yn              CHAR(1)         NOT NULL DEFAULT 'N' CHECK (del_yn IN ('Y','N')),
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_ec_member PRIMARY KEY (member_id),
    CONSTRAINT uq_ec_member_email UNIQUE (email),
    CONSTRAINT fk_ec_member_user FOREIGN KEY (user_id)
        REFERENCES sy_user (user_id),
    CONSTRAINT fk_ec_member_profile FOREIGN KEY (profile_attach_id)
        REFERENCES sy_attach (attach_id)
);

CREATE INDEX idx_ec_member_type_cd ON ec_member (member_type_cd);
CREATE INDEX idx_ec_member_email   ON ec_member (email);

COMMENT ON TABLE  ec_member                   IS '회원 (의뢰인/고수)';
COMMENT ON COLUMN ec_member.member_id         IS '회원 ID';
COMMENT ON COLUMN ec_member.user_id           IS '시스템 사용자 ID';
COMMENT ON COLUMN ec_member.member_type_cd    IS '회원 유형 코드 (CLIENT/PRO)';
COMMENT ON COLUMN ec_member.member_name       IS '이름';
COMMENT ON COLUMN ec_member.phone             IS '연락처';
COMMENT ON COLUMN ec_member.email             IS '이메일';
COMMENT ON COLUMN ec_member.location          IS '활동 지역';
COMMENT ON COLUMN ec_member.bio               IS '자기 소개 (고수 전용)';
COMMENT ON COLUMN ec_member.profile_attach_id IS '프로필 이미지 첨부파일 ID';
COMMENT ON COLUMN ec_member.avg_rating        IS '평균 평점';
COMMENT ON COLUMN ec_member.review_cnt        IS '리뷰 수';
COMMENT ON COLUMN ec_member.response_rate     IS '응답률 (%)';
COMMENT ON COLUMN ec_member.del_yn            IS '탈퇴 여부 (Y/N)';
```

---

### ec_cate — 서비스 카테고리

```sql
CREATE TABLE ec_cate (
    cate_id         BIGSERIAL       NOT NULL,
    parent_cate_id  BIGINT,                             -- 상위 카테고리 (자기참조, NULL=최상위)
    cate_name       VARCHAR(100)    NOT NULL,           -- 카테고리명
    cate_icon       VARCHAR(10),                        -- 아이콘 (이모지)
    cate_desc       VARCHAR(500),                       -- 설명
    sort_ord        INT             NOT NULL DEFAULT 0,
    use_yn          CHAR(1)         NOT NULL DEFAULT 'Y' CHECK (use_yn IN ('Y','N')),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_ec_cate PRIMARY KEY (cate_id),
    CONSTRAINT fk_ec_cate_parent FOREIGN KEY (parent_cate_id)
        REFERENCES ec_cate (cate_id)
);

CREATE INDEX idx_ec_cate_parent ON ec_cate (parent_cate_id);

COMMENT ON TABLE  ec_cate               IS '서비스 카테고리';
COMMENT ON COLUMN ec_cate.cate_id       IS '카테고리 ID';
COMMENT ON COLUMN ec_cate.parent_cate_id IS '상위 카테고리 ID (NULL=최상위)';
COMMENT ON COLUMN ec_cate.cate_name     IS '카테고리명';
COMMENT ON COLUMN ec_cate.cate_icon     IS '아이콘 (이모지 등)';
COMMENT ON COLUMN ec_cate.cate_desc     IS '카테고리 설명';
COMMENT ON COLUMN ec_cate.sort_ord      IS '정렬 순서';
COMMENT ON COLUMN ec_cate.use_yn        IS '사용 여부 (Y/N)';
```

---

### ec_prod — 서비스 상품 (고수 등록)

```sql
CREATE TABLE ec_prod (
    prod_id         BIGSERIAL       NOT NULL,
    cate_id         BIGINT          NOT NULL,           -- ec_cate FK
    member_id       BIGINT          NOT NULL,           -- ec_member FK (고수)
    prod_name       VARCHAR(200)    NOT NULL,           -- 서비스명
    prod_desc       TEXT,                               -- 서비스 상세 설명
    price           DECIMAL(12,2)   NOT NULL DEFAULT 0,
    price_unit      VARCHAR(50),                        -- 가격 단위 (원, 원/시간, 원~ 등)
    status_cd       VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE', -- sy_code(PROD_STATUS)
    attach_grp_id   BIGINT,                             -- sy_attach_grp FK (포트폴리오)
    del_yn          CHAR(1)         NOT NULL DEFAULT 'N' CHECK (del_yn IN ('Y','N')),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_ec_prod PRIMARY KEY (prod_id),
    CONSTRAINT fk_ec_prod_cate FOREIGN KEY (cate_id)
        REFERENCES ec_cate (cate_id),
    CONSTRAINT fk_ec_prod_member FOREIGN KEY (member_id)
        REFERENCES ec_member (member_id),
    CONSTRAINT fk_ec_prod_attach_grp FOREIGN KEY (attach_grp_id)
        REFERENCES sy_attach_grp (attach_grp_id)
);

CREATE INDEX idx_ec_prod_cate_id   ON ec_prod (cate_id);
CREATE INDEX idx_ec_prod_member_id ON ec_prod (member_id);
CREATE INDEX idx_ec_prod_status_cd ON ec_prod (status_cd);

COMMENT ON TABLE  ec_prod               IS '서비스 상품 (고수 등록 서비스)';
COMMENT ON COLUMN ec_prod.prod_id       IS '상품 ID';
COMMENT ON COLUMN ec_prod.cate_id       IS '카테고리 ID';
COMMENT ON COLUMN ec_prod.member_id     IS '등록 고수 회원 ID';
COMMENT ON COLUMN ec_prod.prod_name     IS '서비스명';
COMMENT ON COLUMN ec_prod.prod_desc     IS '서비스 상세 설명';
COMMENT ON COLUMN ec_prod.price         IS '가격';
COMMENT ON COLUMN ec_prod.price_unit    IS '가격 단위 (원/시간 등)';
COMMENT ON COLUMN ec_prod.status_cd     IS '상품 상태 코드 (sy_code: PROD_STATUS)';
COMMENT ON COLUMN ec_prod.attach_grp_id IS '포트폴리오 이미지 첨부 그룹 ID';
COMMENT ON COLUMN ec_prod.del_yn        IS '삭제 여부 (Y/N)';
```

---

### ec_order — 견적/주문

```sql
CREATE TABLE ec_order (
    order_id            BIGSERIAL       NOT NULL,
    client_member_id    BIGINT          NOT NULL,       -- ec_member FK (의뢰인)
    pro_member_id       BIGINT,                         -- ec_member FK (고수, 매칭 후 설정)
    cate_id             BIGINT          NOT NULL,       -- ec_cate FK
    order_status_cd     VARCHAR(20)     NOT NULL DEFAULT 'REQUESTED', -- sy_code(ORDER_STATUS)
    req_content         TEXT            NOT NULL,       -- 요청 내용
    req_date            DATE,                           -- 희망 날짜
    req_location        VARCHAR(200),                   -- 서비스 위치
    total_amt           DECIMAL(12,2)   NOT NULL DEFAULT 0,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_ec_order PRIMARY KEY (order_id),
    CONSTRAINT fk_ec_order_client FOREIGN KEY (client_member_id)
        REFERENCES ec_member (member_id),
    CONSTRAINT fk_ec_order_pro FOREIGN KEY (pro_member_id)
        REFERENCES ec_member (member_id),
    CONSTRAINT fk_ec_order_cate FOREIGN KEY (cate_id)
        REFERENCES ec_cate (cate_id)
);

CREATE INDEX idx_ec_order_client_member_id ON ec_order (client_member_id);
CREATE INDEX idx_ec_order_pro_member_id    ON ec_order (pro_member_id);
CREATE INDEX idx_ec_order_status_cd        ON ec_order (order_status_cd);
CREATE INDEX idx_ec_order_created_at       ON ec_order (created_at DESC);

COMMENT ON TABLE  ec_order                   IS '견적/주문';
COMMENT ON COLUMN ec_order.order_id          IS '주문 ID';
COMMENT ON COLUMN ec_order.client_member_id  IS '의뢰인 회원 ID';
COMMENT ON COLUMN ec_order.pro_member_id     IS '고수 회원 ID (매칭 후 설정)';
COMMENT ON COLUMN ec_order.cate_id           IS '요청 카테고리 ID';
COMMENT ON COLUMN ec_order.order_status_cd   IS '주문 상태 코드 (sy_code: ORDER_STATUS)';
COMMENT ON COLUMN ec_order.req_content       IS '요청 내용';
COMMENT ON COLUMN ec_order.req_date          IS '희망 서비스 날짜';
COMMENT ON COLUMN ec_order.req_location      IS '서비스 위치';
COMMENT ON COLUMN ec_order.total_amt         IS '총 금액';
```

---

### ec_order_item — 견적/주문 항목

```sql
CREATE TABLE ec_order_item (
    order_item_id   BIGSERIAL       NOT NULL,
    order_id        BIGINT          NOT NULL,           -- ec_order FK
    prod_id         BIGINT          NOT NULL,           -- ec_prod FK
    qty             INT             NOT NULL DEFAULT 1,
    unit_price      DECIMAL(12,2)   NOT NULL DEFAULT 0, -- 단가
    item_amt        DECIMAL(12,2)   NOT NULL DEFAULT 0, -- qty * unit_price
    item_desc       VARCHAR(300),                       -- 항목 메모
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_ec_order_item PRIMARY KEY (order_item_id),
    CONSTRAINT fk_ec_order_item_order FOREIGN KEY (order_id)
        REFERENCES ec_order (order_id),
    CONSTRAINT fk_ec_order_item_prod FOREIGN KEY (prod_id)
        REFERENCES ec_prod (prod_id),
    CONSTRAINT chk_ec_order_item_qty CHECK (qty > 0),
    CONSTRAINT chk_ec_order_item_amt CHECK (item_amt >= 0)
);

CREATE INDEX idx_ec_order_item_order_id ON ec_order_item (order_id);
CREATE INDEX idx_ec_order_item_prod_id  ON ec_order_item (prod_id);

COMMENT ON TABLE  ec_order_item              IS '견적/주문 항목';
COMMENT ON COLUMN ec_order_item.order_item_id IS '주문 항목 ID';
COMMENT ON COLUMN ec_order_item.order_id     IS '주문 ID';
COMMENT ON COLUMN ec_order_item.prod_id      IS '상품(서비스) ID';
COMMENT ON COLUMN ec_order_item.qty          IS '수량';
COMMENT ON COLUMN ec_order_item.unit_price   IS '단가';
COMMENT ON COLUMN ec_order_item.item_amt     IS '항목 금액 (qty * unit_price)';
COMMENT ON COLUMN ec_order_item.item_desc    IS '항목 메모';
```

---

## 기초 코드 데이터 INSERT

```sql
-- 회원 유형
INSERT INTO sy_code (code_grp, code_label, code_value, sort_ord) VALUES
('MEMBER_TYPE', '의뢰인', 'CLIENT', 1),
('MEMBER_TYPE', '고수',   'PRO',    2);

-- 주문 상태
INSERT INTO sy_code (code_grp, code_label, code_value, sort_ord) VALUES
('ORDER_STATUS', '견적 요청',   'REQUESTED',   1),
('ORDER_STATUS', '진행 중',     'IN_PROGRESS', 2),
('ORDER_STATUS', '완료',        'COMPLETED',   3),
('ORDER_STATUS', '취소',        'CANCELLED',   4);

-- 상품 상태
INSERT INTO sy_code (code_grp, code_label, code_value, sort_ord) VALUES
('PROD_STATUS', '활성',   'ACTIVE',   1),
('PROD_STATUS', '비활성', 'INACTIVE', 2),
('PROD_STATUS', '삭제',   'DELETED',  3);

-- 사용자 역할
INSERT INTO sy_code (code_grp, code_label, code_value, sort_ord) VALUES
('USER_ROLE', '슈퍼관리자', 'SUPER_ADMIN', 1),
('USER_ROLE', '관리자',     'ADMIN',       2),
('USER_ROLE', '운영자',     'OPERATOR',    3);

-- 로그인 결과
INSERT INTO sy_code (code_grp, code_label, code_value, sort_ord) VALUES
('LOGIN_RESULT', '성공',          'SUCCESS',        1),
('LOGIN_RESULT', '비밀번호 오류', 'FAIL_PW',        2),
('LOGIN_RESULT', '계정 잠금',     'FAIL_LOCK',      3),
('LOGIN_RESULT', '계정 없음',     'FAIL_NOT_FOUND', 4);
```

---

## 생성 순서 (의존성 고려)

```
1. sy_code
2. sy_user
3. sy_attach_grp
4. sy_attach
5. sy_login_hist
6. ec_member          (sy_user, sy_attach 참조)
7. ec_cate            (자기참조)
8. ec_prod            (ec_cate, ec_member, sy_attach_grp 참조)
9. ec_order           (ec_member, ec_cate 참조)
10. ec_order_item     (ec_order, ec_prod 참조)
```
