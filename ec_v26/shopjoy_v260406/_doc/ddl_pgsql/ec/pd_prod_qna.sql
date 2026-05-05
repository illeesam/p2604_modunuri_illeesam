-- pd_prod_qna 테이블 DDL
-- 상품문의

CREATE TABLE shopjoy_2604.pd_prod_qna (
    qna_id       VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id      VARCHAR(21) ,
    prod_id      VARCHAR(21)  NOT NULL,
    sku_id       VARCHAR(21) ,
    member_id    VARCHAR(21) ,
    order_id     VARCHAR(21) ,
    qna_type_cd  VARCHAR(20) ,
    qna_title    VARCHAR(200) NOT NULL,
    qna_content  TEXT         NOT NULL,
    scrt_yn      VARCHAR(1)   DEFAULT 'N',
    answ_yn      VARCHAR(1)   DEFAULT 'N',
    answ_content TEXT        ,
    answ_date    TIMESTAMP   ,
    answ_user_id VARCHAR(21) ,
    disp_yn      VARCHAR(1)   DEFAULT 'Y',
    use_yn       VARCHAR(1)   DEFAULT 'Y',
    reg_by       VARCHAR(30) ,
    reg_date     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by       VARCHAR(30) ,
    upd_date     TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.pd_prod_qna IS '상품문의';
COMMENT ON COLUMN shopjoy_2604.pd_prod_qna.qna_id IS '문의ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_qna.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_qna.prod_id IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_qna.sku_id IS 'SKUID (pd_prod_sku.sku_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_qna.member_id IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_qna.order_id IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_qna.qna_type_cd IS '문의유형코드 (코드: PROD_QNA_TYPE)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_qna.qna_title IS '문의제목';
COMMENT ON COLUMN shopjoy_2604.pd_prod_qna.qna_content IS '문의내용';
COMMENT ON COLUMN shopjoy_2604.pd_prod_qna.scrt_yn IS '비밀글여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pd_prod_qna.answ_yn IS '답변여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pd_prod_qna.answ_content IS '답변내용';
COMMENT ON COLUMN shopjoy_2604.pd_prod_qna.answ_date IS '답변일시';
COMMENT ON COLUMN shopjoy_2604.pd_prod_qna.answ_user_id IS '답변자ID (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_qna.disp_yn IS '노출여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pd_prod_qna.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pd_prod_qna.reg_by IS '등록자ID';
COMMENT ON COLUMN shopjoy_2604.pd_prod_qna.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.pd_prod_qna.upd_by IS '수정자ID';
COMMENT ON COLUMN shopjoy_2604.pd_prod_qna.upd_date IS '수정일시';

CREATE INDEX idx_pd_prod_qna_answ ON shopjoy_2604.pd_prod_qna USING btree (answ_yn);
CREATE INDEX idx_pd_prod_qna_member ON shopjoy_2604.pd_prod_qna USING btree (member_id);
CREATE INDEX idx_pd_prod_qna_prod ON shopjoy_2604.pd_prod_qna USING btree (prod_id);
CREATE INDEX idx_pd_prod_qna_site ON shopjoy_2604.pd_prod_qna USING btree (site_id);
