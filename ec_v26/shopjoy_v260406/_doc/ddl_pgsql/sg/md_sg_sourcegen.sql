-- md_sg_sourcegen 테이블 DDL
-- 소스젠 DDL 정의 — 프로젝트당 여러 테이블 DDL 보관

CREATE TABLE shopjoy_2604.md_sg_sourcegen (
    sourcegen_id       VARCHAR(21)  NOT NULL CONSTRAINT md_sg_sourcegen_pk_sourcegen_id PRIMARY KEY,
    site_id      VARCHAR(21)  NOT NULL,
    reg_site_id  VARCHAR(21)  NOT NULL,
    project_id   VARCHAR(21)  NOT NULL,
    tab_no       INTEGER      NOT NULL,
    ddl_text     TEXT,
    schema_nm    VARCHAR(100),
    table_nm     VARCHAR(100),
    class_nm     VARCHAR(100),
    endpoint     VARCHAR(100),
    swagger_tag  VARCHAR(100),
    sub_package  VARCHAR(50),
    sort_ord     INTEGER      DEFAULT 0,
    use_yn       VARCHAR(1)   DEFAULT 'Y',
    reg_by       VARCHAR(30),
    reg_date     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by       VARCHAR(30),
    upd_date     TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.md_sg_sourcegen IS '소스젠 DDL 탭 — 프로젝트당 여러 테이블 DDL 보관';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen.sourcegen_id IS '소스젠ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen.site_id IS '사이트ID (sy_site.site_id) - 업무 소속 사이트';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen.reg_site_id IS '등록 사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen.project_id IS '프로젝트ID (md_sg_project.project_id)';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen.tab_no IS '탭 번호 (1~10)';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen.ddl_text IS 'CREATE TABLE 원문 DDL';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen.schema_nm IS '스키마명 (DDL 파싱 자동 추출)';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen.table_nm IS '테이블명 (DDL 파싱 자동 추출)';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen.class_nm IS '생성 클래스명 (테이블명 PascalCase 자동)';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen.endpoint IS 'REST 엔드포인트 경로 (테이블명 접두어 제거 자동)';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen.swagger_tag IS 'Swagger 태그 (미입력 시 class_nm 사용)';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen.sub_package IS '서브 패키지 (basePackage 하위 폴더 — 테이블명 접두어 자동, 예: zz_exam1 -> zz)';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.md_sg_sourcegen.upd_date IS '수정일';

CREATE INDEX md_sg_sourcegen_ix01_project_id ON shopjoy_2604.md_sg_sourcegen USING btree (project_id);
