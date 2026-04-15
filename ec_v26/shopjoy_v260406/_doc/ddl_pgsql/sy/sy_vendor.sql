-- ============================================================
-- sy_biz : 사업자 (사업체/법인)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE sy_biz (
    biz_id          VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    biz_no          VARCHAR(20)     NOT NULL,               -- 사업자등록번호 (123-45-67890)
    corp_no         VARCHAR(20),                            -- 법인등록번호 (선택)
    biz_nm          VARCHAR(100)    NOT NULL,               -- 상호 / 회사명
    biz_nm_en       VARCHAR(100),                           -- 영문 상호
    ceo_nm          VARCHAR(50),                            -- 대표자명
    biz_type        VARCHAR(50),                            -- 업태 (예: 도소매)
    biz_item        VARCHAR(100),                           -- 종목 (예: 의류, 잡화)
    biz_class_cd    VARCHAR(20),                            -- 코드: BIZ_CLASS (개인/법인/면세/간이)
    zip_code        VARCHAR(10),
    addr            VARCHAR(200),
    addr_detail     VARCHAR(200),
    phone           VARCHAR(20),
    fax             VARCHAR(20),
    email           VARCHAR(100),
    homepage        VARCHAR(200),
    bank_nm         VARCHAR(50),                            -- 은행명
    bank_account    VARCHAR(50),                            -- 계좌번호
    bank_holder     VARCHAR(50),                            -- 예금주
    biz_reg_url     VARCHAR(500),                           -- 사업자등록증 첨부 URL
    open_date       DATE,                                   -- 개업일자
    contract_date   DATE,                                   -- 계약일자
    status_cd       VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: BIZ_STATUS (ACTIVE/SUSPENDED/TERMINATED)
    disp_path       VARCHAR(200),                           -- 점(.) 구분 표시경로
    remark          VARCHAR(500),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (biz_id),
    UNIQUE (biz_no)
);

COMMENT ON TABLE  sy_biz                IS '사업자 (사업체/법인)';
COMMENT ON COLUMN sy_biz.biz_id         IS '사업자ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_biz.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_biz.biz_no         IS '사업자등록번호';
COMMENT ON COLUMN sy_biz.corp_no        IS '법인등록번호 (선택)';
COMMENT ON COLUMN sy_biz.biz_nm         IS '상호 / 회사명';
COMMENT ON COLUMN sy_biz.biz_nm_en      IS '영문 상호';
COMMENT ON COLUMN sy_biz.ceo_nm         IS '대표자명';
COMMENT ON COLUMN sy_biz.biz_type       IS '업태';
COMMENT ON COLUMN sy_biz.biz_item       IS '종목';
COMMENT ON COLUMN sy_biz.biz_class_cd   IS '사업자구분 (코드: BIZ_CLASS)';
COMMENT ON COLUMN sy_biz.zip_code       IS '우편번호';
COMMENT ON COLUMN sy_biz.addr           IS '주소';
COMMENT ON COLUMN sy_biz.addr_detail    IS '상세주소';
COMMENT ON COLUMN sy_biz.phone          IS '대표 전화';
COMMENT ON COLUMN sy_biz.fax            IS '팩스';
COMMENT ON COLUMN sy_biz.email          IS '대표 이메일';
COMMENT ON COLUMN sy_biz.homepage       IS '홈페이지';
COMMENT ON COLUMN sy_biz.bank_nm        IS '은행명';
COMMENT ON COLUMN sy_biz.bank_account   IS '계좌번호';
COMMENT ON COLUMN sy_biz.bank_holder    IS '예금주';
COMMENT ON COLUMN sy_biz.biz_reg_url    IS '사업자등록증 첨부 URL';
COMMENT ON COLUMN sy_biz.open_date      IS '개업일자';
COMMENT ON COLUMN sy_biz.contract_date  IS '계약일자';
COMMENT ON COLUMN sy_biz.status_cd      IS '상태 (코드: BIZ_STATUS)';
COMMENT ON COLUMN sy_biz.disp_path      IS '점(.) 구분 표시경로';
COMMENT ON COLUMN sy_biz.remark         IS '비고';
COMMENT ON COLUMN sy_biz.reg_by         IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN sy_biz.reg_date       IS '등록일';
COMMENT ON COLUMN sy_biz.upd_by         IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN sy_biz.upd_date       IS '수정일';

CREATE INDEX idx_sy_biz_site   ON sy_biz (site_id);
CREATE INDEX idx_sy_biz_status ON sy_biz (status_cd);
