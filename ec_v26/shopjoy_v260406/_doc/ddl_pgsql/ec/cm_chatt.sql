-- cm_chatt 테이블 DDL
-- 채팅 방 (cm_chatt_room 대체, 2026-06-27 재구조화)

CREATE TABLE shopjoy_2604.cm_chatt (
    chatt_id               VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id                VARCHAR(21)  NOT NULL,
    subject                VARCHAR(200),
    chatt_status_cd        VARCHAR(20)  DEFAULT 'PENDING',
    chatt_status_cd_before VARCHAR(20) ,
    last_msg_date          TIMESTAMP   ,
    chatt_memo             TEXT        ,
    close_date             TIMESTAMP   ,
    close_reason           VARCHAR(200),
    reg_by                 VARCHAR(30) ,
    reg_date               TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                 VARCHAR(30) ,
    upd_date               TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.cm_chatt IS '채팅 방';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.chatt_id IS '채팅방ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.subject IS '채팅주제';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.chatt_status_cd IS '상태 (코드: CHATT_STATUS — PENDING/OPEN/CLOSED)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.chatt_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.last_msg_date IS '마지막 메시지 일시';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.chatt_memo IS '관리자 메모';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.close_date IS '종료일시';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.close_reason IS '종료사유';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.upd_date IS '수정일시';

CREATE INDEX idx_cm_chatt_site    ON shopjoy_2604.cm_chatt USING btree (site_id);
CREATE INDEX idx_cm_chatt_status  ON shopjoy_2604.cm_chatt USING btree (chatt_status_cd);
CREATE INDEX idx_cm_chatt_regdate ON shopjoy_2604.cm_chatt USING btree (reg_date DESC);
