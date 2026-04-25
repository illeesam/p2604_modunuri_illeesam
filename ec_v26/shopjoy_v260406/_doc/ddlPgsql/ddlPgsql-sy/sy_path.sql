-- ============================================================
-- sy_path : 경로 (업무별 트리)
-- ----------------------------------------------------
--  업무코드(biz_code = 테이블명) 별로 독립된 경로 트리를 관리.
--  각 노드는 parent_path_id 로 부모를 참조 (재귀 트리).
--
--  사용 예시:
--    biz_code='sy_brand'    → 브랜드 분류 트리
--    biz_code='sy_code_grp' → 공통코드그룹 분류 트리
--    biz_code='sy_prop'     → 프로퍼티 분류 트리
--    biz_code='ec_disp_*'   → 전시영역/패널 분류 트리
-- ============================================================
CREATE TABLE sy_path (
    path_id         BIGSERIAL       NOT NULL,
    biz_cd        VARCHAR(50)     NOT NULL,               -- 업무코드 (테이블명)
    parent_path_id  BIGINT,                                 -- 부모 경로ID (sy_path.path_id, 루트는 NULL)
    path_label      VARCHAR(200)    NOT NULL,               -- 경로 라벨 (한글 표시명)
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    path_remark     VARCHAR(500),
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (path_id)
);

COMMENT ON TABLE  sy_path                IS '경로 (업무별 트리)';
COMMENT ON COLUMN sy_path.path_id        IS '경로ID (PK, auto)';
COMMENT ON COLUMN sy_path.biz_cd       IS '업무코드 (참조 테이블명, 예: sy_brand / sy_code_grp / sy_prop)';
COMMENT ON COLUMN sy_path.parent_path_id IS '부모 경로ID (sy_path.path_id, 루트는 NULL)';
COMMENT ON COLUMN sy_path.path_label     IS '경로 라벨 (한글 표시명)';
COMMENT ON COLUMN sy_path.sort_ord       IS '동일 부모 내 정렬순서';
COMMENT ON COLUMN sy_path.use_yn         IS '사용여부 Y/N';
COMMENT ON COLUMN sy_path.path_remark    IS '비고';
COMMENT ON COLUMN sy_path.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_path.reg_date       IS '등록일';
COMMENT ON COLUMN sy_path.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_path.upd_date       IS '수정일';

CREATE INDEX idx_sy_path_biz    ON sy_path (biz_cd);
CREATE INDEX idx_sy_path_parent ON sy_path (parent_path_id);
