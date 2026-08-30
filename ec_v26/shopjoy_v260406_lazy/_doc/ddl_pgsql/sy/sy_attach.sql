-- sy_attach 테이블 DDL
-- 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리

CREATE TABLE shopjoy_2604.sy_attach (
    attach_id          VARCHAR(21)  NOT NULL CONSTRAINT sy_attach_pk_attach_id PRIMARY KEY,
    reg_site_id            VARCHAR(21)  NOT NULL,
    file_nm            VARCHAR(300) NOT NULL,
    file_size          BIGINT      ,
    file_ext           VARCHAR(20) ,
    mime_type_cd       VARCHAR(100),
    stored_nm          VARCHAR(300),
    storage_type_cd       VARCHAR(50) ,
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
    physical_path      VARCHAR(700),
    ref_table_nm       VARCHAR(100),
    ref_id             VARCHAR(21)
);

COMMENT ON TABLE  shopjoy_2604.sy_attach IS '첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리';
COMMENT ON COLUMN shopjoy_2604.sy_attach.attach_id IS '첨부파일 ID (YYMMDDhhmmss+random(4)+seq)';
COMMENT ON COLUMN shopjoy_2604.sy_attach.ref_table_nm IS '관련 테이블명 (예: sy_notice) - 대상 엔티티에 직접 연계';
COMMENT ON COLUMN shopjoy_2604.sy_attach.ref_id IS '관련 ID - ref_table_nm 과 조합해 대상 레코드를 식별';
COMMENT ON COLUMN shopjoy_2604.sy_attach.file_nm IS '원본 파일명';
COMMENT ON COLUMN shopjoy_2604.sy_attach.stored_nm IS '저장된 파일명 (YYYYMMDD_hhmmss_seq_random.ext)';
COMMENT ON COLUMN shopjoy_2604.sy_attach.storage_type_cd IS '스토리지 타입 (LOCAL/AWS_S3/NCP_OBS)';
COMMENT ON COLUMN shopjoy_2604.sy_attach.storage_path IS '파일 저장 경로 (정책: /cdn/{업무명}/YYYY/YYYYMM/YYYYMMDD/{파일명})';
COMMENT ON COLUMN shopjoy_2604.sy_attach.thumb_generated_yn IS '썸네일 생성 여부 (동영상은 필수 Y, 이미지는 선택)';
COMMENT ON COLUMN shopjoy_2604.sy_attach.physical_path IS '실제 물리 저장 전체 경로 (서버 절대경로, 예: src/main/resources/static/cdn/attch/NOTICE_ATTACH/2026/202605/20260503/파일명.png)';

CREATE INDEX sy_attach_ix02_file_ext ON shopjoy_2604.sy_attach USING btree (file_ext);
CREATE INDEX sy_attach_ix03_reg_date ON shopjoy_2604.sy_attach USING btree (reg_date);
CREATE INDEX sy_attach_ix04_storage_type_cd ON shopjoy_2604.sy_attach USING btree (storage_type_cd);
CREATE INDEX idx_sy_attach_ref ON shopjoy_2604.sy_attach USING btree (ref_table_nm, ref_id);
