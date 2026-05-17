-- cm_chatt_msg 테이블 DDL
-- 채팅 메시지

CREATE TABLE shopjoy_2604.cm_chatt_msg (
    chatt_msg_id  VARCHAR(21) NOT NULL PRIMARY KEY,
    site_id       VARCHAR(21) NOT NULL,
    chatt_room_id VARCHAR(21) NOT NULL,
    sender_cd     VARCHAR(20) NOT NULL,
    msg_text      TEXT       ,
    ref_type      VARCHAR(20),
    ref_id        VARCHAR(21),
    send_date     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    read_yn       VARCHAR(1)  DEFAULT 'N'::bpchar,
    reg_by        VARCHAR(30),
    reg_date      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by        VARCHAR(30),
    upd_date      TIMESTAMP  
);

COMMENT ON TABLE  shopjoy_2604.cm_chatt_msg IS '채팅 메시지';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.chatt_msg_id IS '메시지ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.chatt_room_id IS '채팅방ID';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.sender_cd IS '발신자유형 (MEMBER/ADMIN)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.msg_text IS '메시지내용';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.ref_type IS '참조유형 (ORDER/PRODUCT/CLAIM)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.ref_id IS '참조ID';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.send_date IS '발송일시';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.read_yn IS '읽음여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.upd_date IS '수정일';

CREATE INDEX idx_cm_chatt_msg_site ON shopjoy_2604.cm_chatt_msg USING btree (site_id);
