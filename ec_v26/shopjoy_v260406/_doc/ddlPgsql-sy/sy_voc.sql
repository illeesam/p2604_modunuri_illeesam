-- ============================================================
CREATE TABLE sy_voc (
    voc_id          VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    voc_master_cd   VARCHAR(20)     NOT NULL,               -- VOC 마스터 분류 코드 (코드: VOC_MASTER)
    voc_detail_cd   VARCHAR(20)     NOT NULL,               -- VOC 세부 분류 코드 (코드: VOC_DETAIL)
    voc_nm          VARCHAR(100)    NOT NULL,               -- VOC 항목명
    voc_content     TEXT,                                   -- VOC 항목 설명
    use_yn          VARCHAR(1)      DEFAULT 'Y',
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (voc_id),
    UNIQUE (site_id, voc_master_cd, voc_detail_cd)
);

COMMENT ON TABLE sy_voc IS '고객의소리 VOC 분류';
COMMENT ON COLUMN sy_voc.voc_id        IS 'VOC분류ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_voc.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_voc.voc_master_cd IS 'VOC마스터코드 (코드: VOC_MASTER)';
COMMENT ON COLUMN sy_voc.voc_detail_cd IS 'VOC세부코드 (코드: VOC_DETAIL)';
COMMENT ON COLUMN sy_voc.voc_nm        IS 'VOC항목명';
COMMENT ON COLUMN sy_voc.voc_content   IS 'VOC항목설명';
COMMENT ON COLUMN sy_voc.use_yn        IS '사용여부 Y/N';
COMMENT ON COLUMN sy_voc.reg_by        IS '등록자ID';
COMMENT ON COLUMN sy_voc.reg_date      IS '등록일시';
COMMENT ON COLUMN sy_voc.upd_by        IS '수정자ID';
COMMENT ON COLUMN sy_voc.upd_date      IS '수정일시';

CREATE INDEX idx_sy_voc_site       ON sy_voc (site_id);
CREATE INDEX idx_sy_voc_master_cd  ON sy_voc (voc_master_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_voc.voc_master_cd (VOC마스터코드) : VOC_MASTER(VOC_MASTER) { 코드값 미정의 }
-- [CODES] sy_voc.voc_detail_cd (VOC세부코드) : VOC_DETAIL(VOC_DETAIL) { 코드값 미정의 }
