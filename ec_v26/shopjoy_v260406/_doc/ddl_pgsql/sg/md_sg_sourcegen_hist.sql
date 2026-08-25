-- md_sg_sourcegen_hist 테이블 DDL
-- 소스젠 생성 이력 — 생성 결과 ZIP 을 첨부(sy_attach)로 보관

CREATE TABLE shopjoy_2604.md_sg_sourcegen_hist (
    sourcegen_hist_id   VARCHAR(21)  NOT NULL CONSTRAINT md_sg_sourcegen_hist_pk_sourcegen_hist_id PRIMARY KEY,
    site_id       VARCHAR(21)  NOT NULL,
    reg_site_id   VARCHAR(21)  NOT NULL,
    project_id    VARCHAR(21)  NOT NULL,
    gen_date      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    ddl_count     INTEGER      DEFAULT 0,
    file_count    INTEGER      DEFAULT 0,
    attach_id     VARCHAR(21),
    zip_file_nm   VARCHAR(300),
    zip_file_size BIGINT,
    zip_url       VARCHAR(500),
    gen_memo      VARCHAR(500),
    ddl_snapshot_json TEXT,
    use_yn        VARCHAR(1)   DEFAULT 'Y',
    reg_by        VARCHAR(30),
    reg_date      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by        VARCHAR(30),
    upd_date      TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.md_sg_sourcegen_hist IS '소스젠 생성 이력 — 생성 결과 ZIP 을 첨부(sy_attach)로 보관';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen_hist.sourcegen_hist_id IS '소스젠 생성이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen_hist.site_id IS '사이트ID (sy_site.site_id) - 업무 소속 사이트';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen_hist.reg_site_id IS '등록 사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen_hist.project_id IS '프로젝트ID (md_sg_project.project_id)';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen_hist.gen_date IS '생성 일시';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen_hist.ddl_count IS '이번 생성에 포함된 DDL 탭 수';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen_hist.file_count IS '생성된 소스 파일 수';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen_hist.attach_id IS '생성결과 ZIP 첨부ID (sy_attach.attach_id)';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen_hist.zip_file_nm IS 'ZIP 파일명';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen_hist.zip_file_size IS 'ZIP 파일 크기(byte)';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen_hist.zip_url IS 'ZIP 다운로드 URL (sy_attach.cdn_img_url 사본)';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen_hist.gen_memo IS '생성 메모';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen_hist.ddl_snapshot_json IS 'DDL 탭 스냅샷(JSON) — 이 생성 시점의 basePackage/dbTypeCd + 탭별 ddlText 등. [불러오기] 시 에디터에 복원 후 재생성하는 용도(생성된 소스 자체는 저장 안 함)';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen_hist.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen_hist.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen_hist.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen_hist.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen_hist.upd_date IS '수정일';

CREATE INDEX md_sg_sourcegen_hist_ix01_project_id ON shopjoy_2604.md_sg_sourcegen_hist USING btree (project_id);
CREATE INDEX md_sg_sourcegen_hist_ix02_attach_id ON shopjoy_2604.md_sg_sourcegen_hist USING btree (attach_id);
