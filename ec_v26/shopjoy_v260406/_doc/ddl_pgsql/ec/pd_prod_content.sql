-- pd_prod_content 테이블 DDL
-- 상품 상세 컨텐츠 (HTML 에디터)

CREATE TABLE shopjoy_2604.pd_prod_content (
    prod_content_id VARCHAR(21) NOT NULL PRIMARY KEY,
    site_id         VARCHAR(21) NOT NULL,
    prod_id         VARCHAR(21) NOT NULL,
    content_type_cd VARCHAR(50) NOT NULL,
    content_html    TEXT       ,
    sort_ord        INTEGER     DEFAULT 0,
    use_yn          VARCHAR(1)  DEFAULT 'Y'::bpchar,
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP  
);

COMMENT ON TABLE  shopjoy_2604.pd_prod_content IS '상품 상세 컨텐츠 (HTML 에디터)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_content.prod_content_id IS '상품컨텐츠ID';
COMMENT ON COLUMN shopjoy_2604.pd_prod_content.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_content.prod_id IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_content.content_type_cd IS '컨텐츠유형 (코드: PROD_CONTENT_TYPE — 상세설명, 사용설명, 배송정보, AS정보, 반품정책 등)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_content.content_html IS 'HTML 에디터 컨텐츠';
COMMENT ON COLUMN shopjoy_2604.pd_prod_content.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.pd_prod_content.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pd_prod_content.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_content.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pd_prod_content.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_content.upd_date IS '수정일';

CREATE INDEX idx_pd_prod_content_site ON shopjoy_2604.pd_prod_content USING btree (site_id);
