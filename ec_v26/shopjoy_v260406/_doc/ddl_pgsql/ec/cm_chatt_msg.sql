-- cm_chatt_msg 테이블 DDL
-- 채팅 메시지 (2026-06-27 재구조화 — chatt_room_id→chatt_id, 첨부/발신자 구조 개선)

CREATE TABLE shopjoy_2604.cm_chatt_msg (
    chatt_msg_id       VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id            VARCHAR(21)  NOT NULL,
    chatt_id           VARCHAR(21)  NOT NULL,
    sender_type_cd     VARCHAR(20)  NOT NULL,
    sender_id          VARCHAR(21)  NOT NULL,
    sender_nm          VARCHAR(100),
    msg_text           TEXT        ,
    msg_type_cd        VARCHAR(20)  DEFAULT 'TEXT',
    attach_grp_id      VARCHAR(21) ,
    ref_type           VARCHAR(20) ,
    ref_id             VARCHAR(21) ,
    read_yn            VARCHAR(1)   DEFAULT 'N',
    send_date          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    reg_by             VARCHAR(30) ,
    reg_date           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by             VARCHAR(30) ,
    upd_date           TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.cm_chatt_msg IS '채팅 메시지';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.chatt_msg_id IS '메시지ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.chatt_id IS '채팅방ID (cm_chatt.chatt_id)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.sender_type_cd IS '발신자유형 (MEMBER/ADMIN/SYSTEM)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.sender_id IS '발신자ID (memberId 또는 userId)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.sender_nm IS '발신자명 (비정규화 캐시)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.msg_text IS '메시지 내용';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.msg_type_cd IS '메시지유형 (TEXT/IMAGE/FILE/REF/SYSTEM)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.attach_grp_id IS '첨부그룹ID (sy_attach_grp.attach_grp_id) — 이미지/파일 첨부 시';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.ref_type IS '참조유형 (ORDER/PRODUCT/CLAIM)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.ref_id IS '참조ID';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.read_yn IS '읽음여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.send_date IS '발송일시';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.upd_date IS '수정일시';

CREATE INDEX idx_cm_chatt_msg_chatt    ON shopjoy_2604.cm_chatt_msg USING btree (chatt_id);
CREATE INDEX idx_cm_chatt_msg_sender   ON shopjoy_2604.cm_chatt_msg USING btree (sender_id);
CREATE INDEX idx_cm_chatt_msg_senddate ON shopjoy_2604.cm_chatt_msg USING btree (send_date DESC);
CREATE INDEX idx_cm_chatt_msg_site     ON shopjoy_2604.cm_chatt_msg USING btree (site_id);
