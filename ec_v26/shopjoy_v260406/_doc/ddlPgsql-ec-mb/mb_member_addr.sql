-- ============================================================
-- ec_member_addr : 회원 배송지 (복수 관리)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE mb_member_addr (
    addr_id         VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),
    member_id       VARCHAR(21)     NOT NULL,              -- mb_member.member_id
    addr_nm         VARCHAR(50),                           -- 배송지명 (예: 집, 회사)
    recv_nm         VARCHAR(50)     NOT NULL,              -- 수령자명
    recv_phone      VARCHAR(20)     NOT NULL,              -- 수령자 연락처
    zip_cd          VARCHAR(10),                           -- 우편번호
    addr            VARCHAR(200),                          -- 기본주소
    addr_detail     VARCHAR(200),                          -- 상세주소
    is_default      CHAR(1)         DEFAULT 'N',           -- 기본 배송지 여부 Y/N
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (addr_id)
);

COMMENT ON TABLE mb_member_addr IS '회원 배송지';
COMMENT ON COLUMN mb_member_addr.addr_id      IS '배송지ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN mb_member_addr.site_id      IS '사이트ID';
COMMENT ON COLUMN mb_member_addr.member_id    IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN mb_member_addr.addr_nm      IS '배송지명 (예: 집, 회사)';
COMMENT ON COLUMN mb_member_addr.recv_nm      IS '수령자명';
COMMENT ON COLUMN mb_member_addr.recv_phone   IS '수령자 연락처';
COMMENT ON COLUMN mb_member_addr.zip_cd       IS '우편번호';
COMMENT ON COLUMN mb_member_addr.addr         IS '기본주소';
COMMENT ON COLUMN mb_member_addr.addr_detail  IS '상세주소';
COMMENT ON COLUMN mb_member_addr.is_default   IS '기본배송지여부 Y/N';
COMMENT ON COLUMN mb_member_addr.reg_by       IS '등록자';
COMMENT ON COLUMN mb_member_addr.reg_date     IS '등록일';
COMMENT ON COLUMN mb_member_addr.upd_by       IS '수정자';
COMMENT ON COLUMN mb_member_addr.upd_date     IS '수정일';

CREATE INDEX idx_mb_member_addr_member ON mb_member_addr (member_id);
