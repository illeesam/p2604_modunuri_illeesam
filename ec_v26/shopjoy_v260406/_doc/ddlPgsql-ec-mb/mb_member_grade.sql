-- ============================================================
CREATE TABLE mb_member_grade (
    grade_id        VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    grade_cd        VARCHAR(20)     NOT NULL,               -- 코드: MEMBER_GRADE (BASIC/SILVER/GOLD/VIP)
    grade_nm        VARCHAR(50)     NOT NULL,
    grade_rank      INTEGER         DEFAULT 1,              -- 등급 우선순위 (낮을수록 낮은 등급)
    min_purchase_amt BIGINT         DEFAULT 0,              -- 등급 유지 최소 구매금액
    save_rate       DECIMAL(5,2)    DEFAULT 1.00,           -- 적립률 (%)
    use_yn          VARCHAR(1)      DEFAULT 'Y',
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (grade_id),
    UNIQUE (site_id, grade_cd)
);

COMMENT ON TABLE mb_member_grade IS '회원등급';
COMMENT ON COLUMN mb_member_grade.grade_id         IS '등급ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN mb_member_grade.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN mb_member_grade.grade_cd         IS '등급코드 (코드: MEMBER_GRADE)';
COMMENT ON COLUMN mb_member_grade.grade_nm         IS '등급명';
COMMENT ON COLUMN mb_member_grade.grade_rank       IS '등급우선순위 (낮을수록 낮은 등급)';
COMMENT ON COLUMN mb_member_grade.min_purchase_amt IS '등급 유지 최소 누적구매금액';
COMMENT ON COLUMN mb_member_grade.save_rate        IS '적립률 (%)';
COMMENT ON COLUMN mb_member_grade.use_yn           IS '사용여부 Y/N';
COMMENT ON COLUMN mb_member_grade.reg_by           IS '등록자ID';
COMMENT ON COLUMN mb_member_grade.reg_date         IS '등록일시';
COMMENT ON COLUMN mb_member_grade.upd_by           IS '수정자ID';
COMMENT ON COLUMN mb_member_grade.upd_date         IS '수정일시';

CREATE INDEX idx_mb_member_grade_site ON mb_member_grade (site_id);
CREATE INDEX idx_mb_member_grade_cd   ON mb_member_grade (grade_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] mb_member_grade.grade_cd (등급코드) : 회원등급 { VIP:VIP, GOLD:우수, NORMAL:일반 }
