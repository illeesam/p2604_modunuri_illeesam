-- cm_local_attach 테이블 DDL
-- 동네 글·견적요청·전문가 분류 신청의 사진/동영상(순서 sort_ord) — 2026-10-04 신규 (migration_20261004_dm_local.sql)
-- 파일 자체는 sy_attach(ref_table_nm=cm_local_attach, ref_id=local_attach_id)

CREATE TABLE shopjoy_2604.cm_local_attach (
    local_attach_id  VARCHAR(21)   NOT NULL CONSTRAINT cm_local_attach_pk_local_attach_id PRIMARY KEY,
    site_id          VARCHAR(21)   NOT NULL,
    ref_type_cd      VARCHAR(20)   NOT NULL,
    ref_id           VARCHAR(21)   NOT NULL,
    attach_id        VARCHAR(21)   NOT NULL,
    media_type_cd    VARCHAR(20)   DEFAULT 'IMAGE',
    cdn_url          TEXT,
    cdn_thumb_url    TEXT,
    sort_ord         INTEGER,
    reg_by           VARCHAR(30),
    reg_date         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30),
    upd_date         TIMESTAMP,
    reg_site_id      VARCHAR(21)   NOT NULL
);

COMMENT ON TABLE  shopjoy_2604.cm_local_attach IS '동네 글·견적요청·전문가 분류 신청의 사진/동영상';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.local_attach_id IS '동네첨부ID (LOA+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.ref_type_cd IS '연결 대상 유형 (LOCAL_POST 동네 글/QUOTE_REQ 견적요청/EXPERT_CATE 전문가 분류 신청)';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.ref_id IS '연결 대상ID';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.attach_id IS '첨부파일ID (sy_attach.attach_id)';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.media_type_cd IS '매체 종류 (IMAGE/VIDEO)';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.cdn_url IS '원본 URL';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.cdn_thumb_url IS '썸네일 URL';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.sort_ord IS '정렬순서 (1부터)';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.upd_date IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.reg_site_id IS '등록 사이트ID (감사 필드)';

CREATE INDEX cm_local_attach_ix01_ref ON shopjoy_2604.cm_local_attach USING btree (ref_type_cd, ref_id, sort_ord);
CREATE INDEX cm_local_attach_ix02_attach ON shopjoy_2604.cm_local_attach USING btree (attach_id);
