-- ============================================================
-- sy_dept : 부서
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE sy_dept (
    dept_id         VARCHAR(16)     NOT NULL,
    dept_code       VARCHAR(50)     NOT NULL,
    dept_name       VARCHAR(100)    NOT NULL,
    parent_id       VARCHAR(16),
    dept_type_cd    VARCHAR(20),                            -- 코드: DEPT_TYPE
    manager_id      VARCHAR(16),                            -- sy_user.user_id
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    remark          VARCHAR(300),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_date        TIMESTAMP,
    PRIMARY KEY (dept_id),
    UNIQUE (dept_code)
);

COMMENT ON TABLE  sy_dept                IS '부서';
COMMENT ON COLUMN sy_dept.dept_id        IS '부서ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_dept.dept_code      IS '부서코드';
COMMENT ON COLUMN sy_dept.dept_name      IS '부서명';
COMMENT ON COLUMN sy_dept.parent_id      IS '상위부서ID';
COMMENT ON COLUMN sy_dept.dept_type_cd   IS '부서유형 (코드: DEPT_TYPE)';
COMMENT ON COLUMN sy_dept.manager_id     IS '부서장 (sy_user.user_id)';
COMMENT ON COLUMN sy_dept.sort_ord       IS '정렬순서';
COMMENT ON COLUMN sy_dept.use_yn         IS '사용여부 Y/N';
COMMENT ON COLUMN sy_dept.remark         IS '비고';
COMMENT ON COLUMN sy_dept.reg_date       IS '등록일';
COMMENT ON COLUMN sy_dept.upd_date       IS '수정일';
