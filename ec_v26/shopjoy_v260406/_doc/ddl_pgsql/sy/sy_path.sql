-- sy_path 테이블 DDL
-- 경로 (업무별 트리)

CREATE TABLE shopjoy_2604.sy_path (
    path_id        VARCHAR(21)  NOT NULL DEFAULT nextval('sy_path_path_id_seq'::regclass) PRIMARY KEY,
    biz_cd         VARCHAR(50)  NOT NULL,
    parent_path_id VARCHAR(21) ,
    path_label     VARCHAR(200) NOT NULL,
    sort_ord       INTEGER      DEFAULT 0,
    use_yn         VARCHAR(1)   DEFAULT 'Y'::bpchar,
    path_remark    VARCHAR(500),
    reg_by         VARCHAR(30) ,
    reg_date       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30) ,
    upd_date       TIMESTAMP   ,
    site_id        VARCHAR(21)  NOT NULL
);

COMMENT ON TABLE  shopjoy_2604.sy_path IS '경로 (업무별 트리)';
COMMENT ON COLUMN shopjoy_2604.sy_path.path_id IS '경로ID (PK, auto)';
COMMENT ON COLUMN shopjoy_2604.sy_path.biz_cd IS '업무코드 (참조 테이블명, 예: sy_brand / sy_code_grp / sy_prop)';
COMMENT ON COLUMN shopjoy_2604.sy_path.parent_path_id IS '부모 경로ID (sy_path.path_id, 루트는 NULL)';
COMMENT ON COLUMN shopjoy_2604.sy_path.path_label IS '경로 라벨 (한글 표시명)';
COMMENT ON COLUMN shopjoy_2604.sy_path.sort_ord IS '동일 부모 내 정렬순서';
COMMENT ON COLUMN shopjoy_2604.sy_path.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_path.path_remark IS '비고';
COMMENT ON COLUMN shopjoy_2604.sy_path.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_path.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_path.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_path.upd_date IS '수정일';

CREATE INDEX idx_sy_path_biz ON shopjoy_2604.sy_path USING btree (biz_cd);
CREATE INDEX idx_sy_path_parent ON shopjoy_2604.sy_path USING btree (parent_path_id);
CREATE INDEX idx_sy_path_site ON shopjoy_2604.sy_path USING btree (site_id);
