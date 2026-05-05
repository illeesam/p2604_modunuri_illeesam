-- sy_attach_grp 테이블 DDL
-- 첨부파일 그룹 - 여러 파일을 한 번에 관리하기 위한 그룹 단위

CREATE TABLE shopjoy_2604.sy_attach_grp (
    attach_grp_id     VARCHAR(21)  NOT NULL PRIMARY KEY,
    attach_grp_code   VARCHAR(50)  NOT NULL,
    attach_grp_nm     VARCHAR(100) NOT NULL,
    file_ext_allow    VARCHAR(200),
    max_file_size     BIGINT      ,
    max_file_count    INTEGER     ,
    storage_path      VARCHAR(300),
    use_yn            VARCHAR(1)   DEFAULT 'Y',
    sort_ord          INTEGER      DEFAULT 0,
    attach_grp_remark VARCHAR(500),
    reg_by            VARCHAR(30) ,
    reg_date          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(30) ,
    upd_date          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.sy_attach_grp IS '첨부파일 그룹 - 여러 파일을 한 번에 관리하기 위한 그룹 단위';
COMMENT ON COLUMN shopjoy_2604.sy_attach_grp.attach_grp_id IS '파일 그룹 ID (ATG + timestamp + random)';
COMMENT ON COLUMN shopjoy_2604.sy_attach_grp.attach_grp_code IS '그룹 코드 (businessCode + "_" + timestamp)';
COMMENT ON COLUMN shopjoy_2604.sy_attach_grp.attach_grp_nm IS '그룹 이름 (사용자에게 표시되는 이름)';
COMMENT ON COLUMN shopjoy_2604.sy_attach_grp.file_ext_allow IS '허용 확장자 목록';
COMMENT ON COLUMN shopjoy_2604.sy_attach_grp.max_file_size IS '그룹 내 단일 파일 최대 크기';
COMMENT ON COLUMN shopjoy_2604.sy_attach_grp.max_file_count IS '그룹 내 최대 파일 개수';
COMMENT ON COLUMN shopjoy_2604.sy_attach_grp.use_yn IS '사용 여부 (Y/N)';

CREATE INDEX idx_sy_attach_grp_code ON shopjoy_2604.sy_attach_grp USING btree (attach_grp_code);
CREATE INDEX idx_sy_attach_grp_reg_date ON shopjoy_2604.sy_attach_grp USING btree (reg_date);
CREATE INDEX idx_sy_attach_grp_use_yn ON shopjoy_2604.sy_attach_grp USING btree (use_yn);
