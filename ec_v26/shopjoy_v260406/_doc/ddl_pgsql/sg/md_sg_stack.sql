-- md_sg_stack 테이블 DDL
-- 소스젠 [소스 생성] 팝오버에 노출되는 언어/스택 카탈로그 (관리자 화면에서 CRUD)

CREATE TABLE shopjoy_2604.md_sg_stack (
    stack_id        VARCHAR(21)  NOT NULL CONSTRAINT md_sg_stack_pk_stack_id PRIMARY KEY,
    site_id         VARCHAR(21)  NOT NULL,
    reg_site_id     VARCHAR(21)  NOT NULL,
    category_cd     VARCHAR(20)  NOT NULL,
    stack_nm        VARCHAR(100) NOT NULL,
    stack_prefix    VARCHAR(100) NOT NULL,
    version_list    VARCHAR(200) DEFAULT 'v1',
    default_version VARCHAR(20)  DEFAULT 'v1',
    sort_ord        INTEGER      DEFAULT 0,
    use_yn          VARCHAR(1)   DEFAULT 'Y',
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    CONSTRAINT md_sg_stack_uk_stack_prefix UNIQUE (stack_prefix)
);

COMMENT ON TABLE  shopjoy_2604.md_sg_stack IS '소스젠 언어/스택 카탈로그 — [소스 생성] 팝오버 체크리스트의 데이터 소스';
COMMENT ON COLUMN shopjoy_2604.md_sg_stack.stack_id IS '스택ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.md_sg_stack.site_id IS '사이트ID (sy_site.site_id) - 업무 소속 사이트';
COMMENT ON COLUMN shopjoy_2604.md_sg_stack.reg_site_id IS '등록 사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.md_sg_stack.category_cd IS '구획 — SG_STACK_CATEGORY_CD {BACKEND, FRONTEND, FULLSTACK, MOBILE, ETC}';
COMMENT ON COLUMN shopjoy_2604.md_sg_stack.stack_nm IS '화면 표시명 (예: Backend (JPA))';
COMMENT ON COLUMN shopjoy_2604.md_sg_stack.stack_prefix IS '생성 파일 경로 접두어 — gnGenerate() 결과 파일 키와 정확히 일치해야 함 (예: backend_jpa/). 변경 시 생성 엔진과 어긋나지 않도록 주의';
COMMENT ON COLUMN shopjoy_2604.md_sg_stack.version_list IS '선택 가능 버전 목록 (콤마 구분, 예: v1,v2,v3)';
COMMENT ON COLUMN shopjoy_2604.md_sg_stack.default_version IS '기본 선택 버전';
COMMENT ON COLUMN shopjoy_2604.md_sg_stack.sort_ord IS '구획 내 정렬순서';
COMMENT ON COLUMN shopjoy_2604.md_sg_stack.use_yn IS '사용여부 Y/N (N=팝오버 미노출)';
COMMENT ON COLUMN shopjoy_2604.md_sg_stack.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.md_sg_stack.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.md_sg_stack.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.md_sg_stack.upd_date IS '수정일';

CREATE INDEX md_sg_stack_ix01_category_cd ON shopjoy_2604.md_sg_stack USING btree (category_cd, sort_ord);
CREATE INDEX md_sg_stack_ix02_site_id ON shopjoy_2604.md_sg_stack USING btree (site_id);
