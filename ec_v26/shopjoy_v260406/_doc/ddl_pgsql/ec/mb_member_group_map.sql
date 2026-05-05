-- mb_member_group_map 테이블 DDL
-- 회원그룹-회원 매핑

CREATE TABLE shopjoy_2604.mb_member_group_map (
    member_group_id     VARCHAR(21) NOT NULL,
    member_id           VARCHAR(21) NOT NULL,
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    member_group_map_id VARCHAR(21) NOT NULL PRIMARY KEY
);

COMMENT ON TABLE  shopjoy_2604.mb_member_group_map IS '회원그룹-회원 매핑';
COMMENT ON COLUMN shopjoy_2604.mb_member_group_map.member_group_id IS '그룹ID (mb_member_group.group_id)';
COMMENT ON COLUMN shopjoy_2604.mb_member_group_map.member_id IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.mb_member_group_map.reg_by IS '등록자ID';
COMMENT ON COLUMN shopjoy_2604.mb_member_group_map.reg_date IS '등록일시';

CREATE INDEX idx_mb_member_group_map_mem ON shopjoy_2604.mb_member_group_map USING btree (member_id);
CREATE UNIQUE INDEX mb_member_group_map_uq ON shopjoy_2604.mb_member_group_map USING btree (member_group_id, member_id);
