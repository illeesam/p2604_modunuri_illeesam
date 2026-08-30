-- md_sg_project 테이블 DDL
-- 소스젠 프로젝트 마스터 — DDL 묶음 단위

CREATE TABLE shopjoy_2604.md_sg_project (
    project_id        VARCHAR(21)  NOT NULL CONSTRAINT md_sg_project_pk_project_id PRIMARY KEY,
    site_id           VARCHAR(21)  NOT NULL,
    reg_site_id       VARCHAR(21)  NOT NULL,
    member_id         VARCHAR(21),
    project_nm        VARCHAR(200) NOT NULL,
    project_desc      VARCHAR(500),
    base_package      VARCHAR(200),
    db_type_cd        VARCHAR(20),
    ddl_count         INTEGER      DEFAULT 0,
    last_gen_date     TIMESTAMP,
    last_file_count   INTEGER      DEFAULT 0,
    project_status_cd VARCHAR(20)  DEFAULT 'DRAFT',
    use_yn            VARCHAR(1)   DEFAULT 'Y',
    reg_by            VARCHAR(30),
    reg_date          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(30),
    upd_date          TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.md_sg_project IS '소스젠 프로젝트 마스터 — DDL 묶음 단위';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.project_id IS '프로젝트ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.site_id IS '사이트ID (sy_site.site_id) - 업무 소속 사이트';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.reg_site_id IS '등록 사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.member_id IS '작성 회원ID (mb_member.member_id, NULL=관리자 작성)';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.project_nm IS '프로젝트명';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.project_desc IS '프로젝트 설명';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.base_package IS 'Base Package (예: com.exam.app) — 전체 DDL 탭 공유';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.db_type_cd IS 'DB 유형 — SG_DB_TYPE_CD {POSTGRESQL, ORACLE}';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.ddl_count IS '등록된 DDL 탭 수 (md_sg_sourcegen 집계 캐시)';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.last_gen_date IS '마지막 소스 생성 일시';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.last_file_count IS '마지막 생성 파일 수';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.project_status_cd IS '상태 — SG_PROJECT_STATUS_CD {DRAFT:작성중, DONE:생성완료}';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.use_yn IS '사용여부 Y/N (삭제 대체 플래그)';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.upd_date IS '수정일';

CREATE INDEX md_sg_project_ix01_member_id ON shopjoy_2604.md_sg_project USING btree (member_id);
CREATE INDEX md_sg_project_ix02_site_id ON shopjoy_2604.md_sg_project USING btree (site_id);
