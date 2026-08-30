-- md_sg_download_hist 테이블 DDL
-- 소스젠 FO 화면에서 [⬇ ZIP 다운로드] 클릭한 기록 (파일 자체는 재보관하지 않음 — 클릭 로그만)

CREATE TABLE shopjoy_2604.md_sg_download_hist (
    download_hist_id VARCHAR(21)  NOT NULL CONSTRAINT md_sg_download_hist_pk_download_hist_id PRIMARY KEY,
    site_id          VARCHAR(21)  NOT NULL,
    reg_site_id      VARCHAR(21)  NOT NULL,
    project_id       VARCHAR(21),
    project_nm       VARCHAR(200),
    base_package     VARCHAR(200),
    zip_file_nm      VARCHAR(300),
    ddl_count        INTEGER      DEFAULT 0,
    file_count       INTEGER      DEFAULT 0,
    attach_id        VARCHAR(21),
    zip_url          VARCHAR(500),
    reg_by           VARCHAR(30),
    reg_date         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30),
    upd_date         TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.md_sg_download_hist IS '소스젠 ZIP 다운로드 클릭 기록 — 파일 재보관 없이 로그만 남긴다';
COMMENT ON COLUMN shopjoy_2604.md_sg_download_hist.download_hist_id IS '다운로드이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.md_sg_download_hist.site_id IS '사이트ID (sy_site.site_id) - 업무 소속 사이트';
COMMENT ON COLUMN shopjoy_2604.md_sg_download_hist.reg_site_id IS '등록 사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.md_sg_download_hist.project_id IS '프로젝트ID (md_sg_project.project_id) — 저장 전 신규 프로젝트에서 다운로드하면 NULL 가능';
COMMENT ON COLUMN shopjoy_2604.md_sg_download_hist.project_nm IS '프로젝트명 스냅샷 (다운로드 시점 값 — 조인 대신 스냅샷 보관, 삭제된 프로젝트도 이력에 남게)';
COMMENT ON COLUMN shopjoy_2604.md_sg_download_hist.base_package IS 'Base Package 스냅샷';
COMMENT ON COLUMN shopjoy_2604.md_sg_download_hist.zip_file_nm IS '다운로드한 ZIP 파일명 스냅샷';
COMMENT ON COLUMN shopjoy_2604.md_sg_download_hist.ddl_count IS '다운로드 시점 DDL 탭 수';
COMMENT ON COLUMN shopjoy_2604.md_sg_download_hist.file_count IS '다운로드 시점 생성 파일 수';
COMMENT ON COLUMN shopjoy_2604.md_sg_download_hist.attach_id IS '다운로드한 ZIP 첨부ID (sy_attach.attach_id) — 2026-08-30 재다운로드 지원을 위해 보관, null 가능(과거 이력)';
COMMENT ON COLUMN shopjoy_2604.md_sg_download_hist.zip_url IS 'ZIP 다운로드 URL — 2026-08-30 재다운로드 지원을 위해 보관, null 가능(과거 이력)';
COMMENT ON COLUMN shopjoy_2604.md_sg_download_hist.reg_by IS '등록자 (다운로드한 FO 회원ID)';
COMMENT ON COLUMN shopjoy_2604.md_sg_download_hist.reg_date IS '등록일 (=다운로드 일시)';
COMMENT ON COLUMN shopjoy_2604.md_sg_download_hist.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.md_sg_download_hist.upd_date IS '수정일';

CREATE INDEX md_sg_download_hist_ix01_project_id ON shopjoy_2604.md_sg_download_hist USING btree (project_id);
CREATE INDEX md_sg_download_hist_ix02_reg_by ON shopjoy_2604.md_sg_download_hist USING btree (reg_by);
CREATE INDEX md_sg_download_hist_ix03_site_id ON shopjoy_2604.md_sg_download_hist USING btree (site_id);
