-- sy_voc 테이블 DDL
-- 고객의소리 VOC 분류

CREATE TABLE shopjoy_2604.sy_voc (
    voc_id        VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id       VARCHAR(21)  NOT NULL,
    voc_master_cd VARCHAR(20)  NOT NULL,
    voc_detail_cd VARCHAR(20)  NOT NULL,
    voc_nm        VARCHAR(100) NOT NULL,
    voc_content   TEXT        ,
    use_yn        VARCHAR(1)   DEFAULT 'Y'::character varying,
    reg_by        VARCHAR(30) ,
    reg_date      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by        VARCHAR(30) ,
    upd_date      TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.sy_voc IS '고객의소리 VOC 분류';
COMMENT ON COLUMN shopjoy_2604.sy_voc.voc_id IS 'VOC분류ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_voc.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_voc.voc_master_cd IS 'VOC마스터코드 (코드: VOC_MASTER)';
COMMENT ON COLUMN shopjoy_2604.sy_voc.voc_detail_cd IS 'VOC세부코드 (코드: VOC_DETAIL)';
COMMENT ON COLUMN shopjoy_2604.sy_voc.voc_nm IS 'VOC항목명';
COMMENT ON COLUMN shopjoy_2604.sy_voc.voc_content IS 'VOC항목설명';
COMMENT ON COLUMN shopjoy_2604.sy_voc.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_voc.reg_by IS '등록자ID';
COMMENT ON COLUMN shopjoy_2604.sy_voc.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.sy_voc.upd_by IS '수정자ID';
COMMENT ON COLUMN shopjoy_2604.sy_voc.upd_date IS '수정일시';

CREATE INDEX idx_sy_voc_master_cd ON shopjoy_2604.sy_voc USING btree (voc_master_cd);
CREATE INDEX idx_sy_voc_site ON shopjoy_2604.sy_voc USING btree (site_id);
CREATE UNIQUE INDEX sy_voc_site_id_voc_master_cd_voc_detail_cd_key ON shopjoy_2604.sy_voc USING btree (site_id, voc_master_cd, voc_detail_cd);
