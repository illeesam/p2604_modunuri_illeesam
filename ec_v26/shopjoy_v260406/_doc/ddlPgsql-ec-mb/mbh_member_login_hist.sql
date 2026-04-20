-- 로그인 이력
CREATE TABLE mbh_member_login_hist (
    login_hist_id   VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    member_id       VARCHAR(21)     NOT NULL,
    login_date      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    ip              VARCHAR(50),
    device          VARCHAR(100),
    result_cd       VARCHAR(20)     DEFAULT 'SUCCESS',      -- SUCCESS / FAIL
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (login_hist_id)
);

COMMENT ON TABLE mbh_member_login_hist IS '회원 로그인 이력';
COMMENT ON COLUMN mbh_member_login_hist.login_hist_id IS '로그인이력ID';
COMMENT ON COLUMN mbh_member_login_hist.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN mbh_member_login_hist.member_id     IS '회원ID';
COMMENT ON COLUMN mbh_member_login_hist.login_date    IS '로그인일시';
COMMENT ON COLUMN mbh_member_login_hist.ip            IS 'IP주소';
COMMENT ON COLUMN mbh_member_login_hist.device        IS '디바이스';
COMMENT ON COLUMN mbh_member_login_hist.result_cd     IS '결과 (SUCCESS/FAIL)';
COMMENT ON COLUMN mbh_member_login_hist.reg_by        IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN mbh_member_login_hist.reg_date      IS '등록일';
COMMENT ON COLUMN mbh_member_login_hist.upd_by        IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN mbh_member_login_hist.upd_date      IS '수정일';
