-- sy_attach 테이블 DDL
-- 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리

CREATE TABLE shopjoy_2604.sy_attach (
    attach_id          VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id            VARCHAR(21)  NOT NULL,
    attach_grp_id      VARCHAR(21)  NOT NULL,
    file_nm            VARCHAR(300) NOT NULL,
    file_size          BIGINT      ,
    file_ext           VARCHAR(20) ,
    mime_type_cd       VARCHAR(100),
    stored_nm          VARCHAR(300),
    storage_type       VARCHAR(50) ,
    storage_path       VARCHAR(500),
    attach_url         VARCHAR(500),
    cdn_host           VARCHAR(100),
    cdn_img_url        VARCHAR(500),
    thumb_file_nm      VARCHAR(300),
    thumb_stored_nm    VARCHAR(300),
    thumb_url          VARCHAR(500),
    thumb_cdn_url      VARCHAR(500),
    thumb_generated_yn VARCHAR(1)   DEFAULT 'N'::character varying,
    sort_ord           INTEGER      DEFAULT 0,
    attach_memo        VARCHAR(300),
    reg_by             VARCHAR(30) ,
    reg_date           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by             VARCHAR(30) ,
    upd_date           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    cdn_thumb_url      VARCHAR(500),
    physical_path      VARCHAR(700)
);

COMMENT ON TABLE  shopjoy_2604.sy_attach IS '첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리';
COMMENT ON COLUMN shopjoy_2604.sy_attach.attach_id IS '첨부파일 ID (YYMMDDhhmmss+random(4)+seq)';
COMMENT ON COLUMN shopjoy_2604.sy_attach.attach_grp_id IS '파일 그룹 ID (sy_attach_grp과 연계)';
COMMENT ON COLUMN shopjoy_2604.sy_attach.file_nm IS '원본 파일명';
COMMENT ON COLUMN shopjoy_2604.sy_attach.stored_nm IS '저장된 파일명 (YYYYMMDD_hhmmss_seq_random.ext)';
COMMENT ON COLUMN shopjoy_2604.sy_attach.storage_type IS '스토리지 타입 (LOCAL/AWS_S3/NCP_OBS)';
COMMENT ON COLUMN shopjoy_2604.sy_attach.storage_path IS '파일 저장 경로 (정책: /cdn/{업무명}/YYYY/YYYYMM/YYYYMMDD/{파일명})';
COMMENT ON COLUMN shopjoy_2604.sy_attach.thumb_generated_yn IS '썸네일 생성 여부 (동영상은 필수 Y, 이미지는 선택)';
COMMENT ON COLUMN shopjoy_2604.sy_attach.physical_path IS '실제 물리 저장 전체 경로 (서버 절대경로, 예: src/main/resources/static/cdn/attch/NOTICE_ATTACH/2026/202605/20260503/파일명.png)';

CREATE INDEX idx_sy_attach_file_ext ON shopjoy_2604.sy_attach USING btree (file_ext);
CREATE INDEX idx_sy_attach_grp_id ON shopjoy_2604.sy_attach USING btree (attach_grp_id);
CREATE INDEX idx_sy_attach_reg_date ON shopjoy_2604.sy_attach USING btree (reg_date);
CREATE INDEX idx_sy_attach_site ON shopjoy_2604.sy_attach USING btree (site_id);
CREATE INDEX idx_sy_attach_site_id ON shopjoy_2604.sy_attach USING btree (site_id);
CREATE INDEX idx_sy_attach_storage_type ON shopjoy_2604.sy_attach USING btree (storage_type);
