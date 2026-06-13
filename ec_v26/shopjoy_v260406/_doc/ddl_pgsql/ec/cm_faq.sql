-- cm_faq 테이블 DDL
-- FAQ (자주 묻는 질문)

CREATE TABLE shopjoy_2604.cm_faq (
    faq_id        VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id       VARCHAR(21)  NOT NULL,
    path_id       VARCHAR(21) ,
    faq_question  VARCHAR(500) NOT NULL,
    faq_answer    TEXT,
    sort_ord      INTEGER      DEFAULT 0,
    use_yn        VARCHAR(1)   DEFAULT 'Y',
    view_count    INTEGER      DEFAULT 0,
    reg_by        VARCHAR(30) ,
    reg_date      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by        VARCHAR(30) ,
    upd_date      TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.cm_faq IS 'FAQ (자주 묻는 질문)';
COMMENT ON COLUMN shopjoy_2604.cm_faq.faq_id IS 'FAQ ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_faq.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.cm_faq.path_id IS 'FAQ 분류 표시경로 (sy_path.path_id, biz_cd=cm_faq)';
COMMENT ON COLUMN shopjoy_2604.cm_faq.faq_question IS '질문';
COMMENT ON COLUMN shopjoy_2604.cm_faq.faq_answer IS '답변';
COMMENT ON COLUMN shopjoy_2604.cm_faq.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.cm_faq.use_yn IS '노출여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.cm_faq.view_count IS '조회수';
COMMENT ON COLUMN shopjoy_2604.cm_faq.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.cm_faq.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.cm_faq.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.cm_faq.upd_date IS '수정일';

CREATE INDEX idx_cm_faq_site ON shopjoy_2604.cm_faq USING btree (site_id);
CREATE INDEX idx_cm_faq_path ON shopjoy_2604.cm_faq USING btree (path_id);
CREATE INDEX idx_cm_faq_sort ON shopjoy_2604.cm_faq USING btree (sort_ord);
