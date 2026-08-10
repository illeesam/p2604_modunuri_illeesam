-- ============================================================
-- sy_user_pref : 관리자 사용자 개인화 설정
-- 패널 열림/닫힘 등 UI 상태를 사용자별로 영속화
-- ============================================================
CREATE TABLE shopjoy_2604.sy_user_pref (
    user_id    varchar(21)  NOT NULL,                           -- 관리자 사용자ID (sy_user.user_id)
    pref_key   varchar(100) NOT NULL,                           -- 키 (예: ui.left_menu_open)
    pref_value text         NULL,                               -- 값 (예: 'true')
    reg_by     varchar(30)  NULL,                               -- 등록자
    reg_date   timestamp    DEFAULT CURRENT_TIMESTAMP NOT NULL, -- 등록일시
    upd_by     varchar(30)  NULL,                               -- 수정자
    upd_date   timestamp    NULL,                               -- 최종 수정일시
    CONSTRAINT sy_user_pref_pk_user_id_pref_key_x2 PRIMARY KEY (user_id, pref_key)
);

COMMENT ON TABLE  shopjoy_2604.sy_user_pref            IS '관리자 사용자 개인화 설정';
COMMENT ON COLUMN shopjoy_2604.sy_user_pref.user_id    IS '관리자 사용자ID (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.sy_user_pref.pref_key   IS '설정 키 (예: ui.left_menu_open)';
COMMENT ON COLUMN shopjoy_2604.sy_user_pref.pref_value IS '설정 값 (예: true / false)';
COMMENT ON COLUMN shopjoy_2604.sy_user_pref.reg_by     IS '등록자';
COMMENT ON COLUMN shopjoy_2604.sy_user_pref.reg_date   IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.sy_user_pref.upd_by     IS '수정자';
COMMENT ON COLUMN shopjoy_2604.sy_user_pref.upd_date   IS '최종 수정일시';
