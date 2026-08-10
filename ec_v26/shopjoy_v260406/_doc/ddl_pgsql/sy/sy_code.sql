-- sy_code 테이블 DDL
-- 공통코드
-- 2026-08-02: code_grp(text) 컬럼 삭제, code_grp_id(FK→sy_code_grp) 유지
--             코드그룹명은 vw_sy_code VIEW (sy_code JOIN sy_code_grp) 로 조회

CREATE TABLE shopjoy_2604.sy_code (
    code_id           VARCHAR(21)  NOT NULL CONSTRAINT sy_code_pk_code_id PRIMARY KEY,
    reg_site_id           VARCHAR(21)  NOT NULL,
    code_grp_id       VARCHAR(50)  NOT NULL,
    code_value        VARCHAR(50)  NOT NULL,
    code_label        VARCHAR(100) NOT NULL,
    sort_ord          INTEGER      DEFAULT 0,
    use_yn            VARCHAR(1)   DEFAULT 'Y'::bpchar,
    parent_code_value VARCHAR(50) ,
    child_code_values VARCHAR(500),
    code_remark       VARCHAR(300),
    reg_by            VARCHAR(30) ,
    reg_date          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(30) ,
    upd_date          TIMESTAMP   ,
    code_level        INTEGER     ,
    code_opt1         VARCHAR(200),
    CONSTRAINT sy_code_fk_code_grp_id FOREIGN KEY (code_grp_id) REFERENCES shopjoy_2604.sy_code_grp(code_grp_id)
);

COMMENT ON TABLE  shopjoy_2604.sy_code IS '공통코드';
COMMENT ON COLUMN shopjoy_2604.sy_code.code_id IS '코드ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_code.reg_site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_code.code_grp_id IS '코드그룹ID (sy_code_grp.code_grp_id FK)';
COMMENT ON COLUMN shopjoy_2604.sy_code.code_value IS '코드값 (저장값)';
COMMENT ON COLUMN shopjoy_2604.sy_code.code_label IS '코드라벨 (표시명)';
COMMENT ON COLUMN shopjoy_2604.sy_code.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.sy_code.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_code.parent_code_value IS '부모 코드값 (트리 구조 시 상위 code_value, null이면 루트)';
COMMENT ON COLUMN shopjoy_2604.sy_code.child_code_values IS '허용 자식/전이 코드값 목록 (^VAL1^VAL2^ 형식 — 상태 전이 제약이나 하위 코드 목록)';
COMMENT ON COLUMN shopjoy_2604.sy_code.code_remark IS '비고';
COMMENT ON COLUMN shopjoy_2604.sy_code.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_code.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_code.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_code.upd_date IS '수정일';
COMMENT ON COLUMN shopjoy_2604.sy_code.code_level IS '코드 트리 레벨 (1=루트, 2=중간, 3=리프 등). parent_code_value와 함께 다단 트리 구성';
COMMENT ON COLUMN shopjoy_2604.sy_code.code_opt1 IS '코드별 부가 옵션 1 (스타일 색상 hex, 아이콘 클래스 등 자유 문자열)';

CREATE INDEX sy_code_ix01_code_grp_id ON shopjoy_2604.sy_code USING btree (code_grp_id);
CREATE UNIQUE INDEX sy_code_uk_code_grp ON shopjoy_2604.sy_code USING btree (code_grp_id, code_value);
CREATE INDEX sy_code_ix_code_grp_2 ON shopjoy_2604.sy_code USING btree (code_grp_id, use_yn);

-- VIEW: vw_sy_code — sy_code JOIN sy_code_grp 으로 code_grp 텍스트 노출
-- (QueryDSL 에서 QVwSyCode 로 사용, 코드그룹명 JOIN 조회용)
-- 2026-08-02: site_id 컬럼 제거 (sy/syh 도메인 site_id 일괄 삭제 마이그레이션)
CREATE OR REPLACE VIEW shopjoy_2604.vw_sy_code AS
SELECT c.code_id,
       c.code_grp_id,
       g.code_grp,
       g.grp_nm,
       c.code_value,
       c.code_label,
       c.sort_ord,
       c.use_yn,
       c.parent_code_value,
       c.child_code_values,
       c.code_remark,
       c.code_level,
       c.code_opt1,
       c.reg_by,
       c.reg_date,
       c.upd_by,
       c.upd_date
FROM shopjoy_2604.sy_code c
LEFT JOIN shopjoy_2604.sy_code_grp g ON g.code_grp_id = c.code_grp_id;
