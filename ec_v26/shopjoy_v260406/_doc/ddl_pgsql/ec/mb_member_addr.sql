-- mb_member_addr 테이블 DDL
-- 회원 배송지

CREATE TABLE shopjoy_2604.mb_member_addr (
    member_addr_id VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id        VARCHAR(21)  NOT NULL,
    member_id      VARCHAR(21)  NOT NULL,
    addr_nm        VARCHAR(50) ,
    recv_nm        VARCHAR(50)  NOT NULL,
    recv_phone     VARCHAR(20)  NOT NULL,
    zip_cd         VARCHAR(10) ,
    addr           VARCHAR(200),
    addr_detail    VARCHAR(200),
    is_default     VARCHAR(1)   DEFAULT 'N'::bpchar,
    reg_by         VARCHAR(30) ,
    reg_date       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30) ,
    upd_date       TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.mb_member_addr IS '회원 배송지';
COMMENT ON COLUMN shopjoy_2604.mb_member_addr.member_addr_id IS '배송지ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.mb_member_addr.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.mb_member_addr.member_id IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.mb_member_addr.addr_nm IS '배송지명 (예: 집, 회사)';
COMMENT ON COLUMN shopjoy_2604.mb_member_addr.recv_nm IS '수령자명';
COMMENT ON COLUMN shopjoy_2604.mb_member_addr.recv_phone IS '수령자 연락처';
COMMENT ON COLUMN shopjoy_2604.mb_member_addr.zip_cd IS '우편번호';
COMMENT ON COLUMN shopjoy_2604.mb_member_addr.addr IS '기본주소';
COMMENT ON COLUMN shopjoy_2604.mb_member_addr.addr_detail IS '상세주소';
COMMENT ON COLUMN shopjoy_2604.mb_member_addr.is_default IS '기본배송지여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.mb_member_addr.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.mb_member_addr.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.mb_member_addr.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.mb_member_addr.upd_date IS '수정일';

CREATE INDEX idx_mb_member_addr_member ON shopjoy_2604.mb_member_addr USING btree (member_id);
CREATE INDEX idx_mb_member_addr_site ON shopjoy_2604.mb_member_addr USING btree (site_id);
