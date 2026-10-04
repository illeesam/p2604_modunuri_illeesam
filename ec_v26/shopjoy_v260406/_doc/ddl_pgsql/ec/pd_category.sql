-- pd_category 테이블 DDL
-- 카테고리

CREATE TABLE shopjoy_2604.pd_category (
    category_id               VARCHAR(21)  NOT NULL CONSTRAINT pd_category_pk_category_id PRIMARY KEY,
    site_id                   VARCHAR(21)  NOT NULL,
    reg_site_id               VARCHAR(21) ,
    parent_category_id        VARCHAR(21) ,
    category_nm               VARCHAR(100) NOT NULL,
    category_cd               VARCHAR(50) ,
    category_depth            INTEGER      DEFAULT 1,
    sort_ord                  INTEGER      DEFAULT 0,
    category_status_cd        VARCHAR(20)  DEFAULT 'ACTIVE'::character varying,
    category_status_cd_before VARCHAR(20) ,
    img_url                   VARCHAR(500),
    category_desc             TEXT        ,
    reg_by                    VARCHAR(30) ,
    reg_date                  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                    VARCHAR(30) ,
    upd_date                  TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.pd_category IS '카테고리';
COMMENT ON COLUMN shopjoy_2604.pd_category.category_id IS '카테고리ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pd_category.site_id IS '사이트ID (sy_site.site_id) - 업무 소속 사이트';
COMMENT ON COLUMN shopjoy_2604.pd_category.reg_site_id IS '등록 사이트ID (감사 필드)';
COMMENT ON COLUMN shopjoy_2604.pd_category.parent_category_id IS '상위 카테고리ID';
COMMENT ON COLUMN shopjoy_2604.pd_category.category_nm IS '카테고리명';
COMMENT ON COLUMN shopjoy_2604.pd_category.category_cd IS '카테고리 코드 — 사이트 간 공통 집계 키(예 SHOES). 같은 사이트 안에서 유일';
COMMENT ON COLUMN shopjoy_2604.pd_category.category_depth IS '깊이 (1:대/2:중/3:소)';
COMMENT ON COLUMN shopjoy_2604.pd_category.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.pd_category.category_status_cd IS '상태 (코드: USE_YN)';
COMMENT ON COLUMN shopjoy_2604.pd_category.category_status_cd_before IS '변경 전 카테고리상태 (코드: USE_YN)';
COMMENT ON COLUMN shopjoy_2604.pd_category.img_url IS '이미지URL';
COMMENT ON COLUMN shopjoy_2604.pd_category.category_desc IS '설명';
COMMENT ON COLUMN shopjoy_2604.pd_category.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pd_category.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pd_category.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pd_category.upd_date IS '수정일';

CREATE INDEX pd_category_ix01_parent_category_id ON shopjoy_2604.pd_category USING btree (parent_category_id);
CREATE INDEX idx_pd_category_site_id ON shopjoy_2604.pd_category USING btree (site_id);
-- 카테고리 코드(2026-10-04, migration_20261004_category_cd.py): 같은 사이트 안에서 유일(빈 값 허용) + 사이트 간 집계용 인덱스
CREATE UNIQUE INDEX pd_category_ux01_site_category_cd ON shopjoy_2604.pd_category USING btree (site_id, category_cd) WHERE category_cd IS NOT NULL;
CREATE INDEX pd_category_ix02_category_cd ON shopjoy_2604.pd_category USING btree (category_cd);
