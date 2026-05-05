-- pm_event 테이블 DDL
-- 이벤트

CREATE TABLE shopjoy_2604.pm_event (
    event_id               VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id                VARCHAR(21) ,
    event_nm               VARCHAR(100) NOT NULL,
    event_type_cd          VARCHAR(20) ,
    img_url                VARCHAR(500),
    event_title            VARCHAR(200),
    event_content          TEXT        ,
    start_date             DATE         NOT NULL,
    end_date               DATE         NOT NULL,
    notice_start           DATE        ,
    notice_end             DATE        ,
    event_status_cd        VARCHAR(20)  DEFAULT 'DRAFT',
    event_status_cd_before VARCHAR(20) ,
    target_type_cd         VARCHAR(20) ,
    sort_ord               INTEGER      DEFAULT 0,
    view_cnt               INTEGER      DEFAULT 0,
    use_yn                 VARCHAR(1)   DEFAULT 'Y',
    event_desc             TEXT        ,
    reg_by                 VARCHAR(30) ,
    reg_date               TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                 VARCHAR(30) ,
    upd_date               TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.pm_event IS '이벤트';
COMMENT ON COLUMN shopjoy_2604.pm_event.event_id IS '이벤트ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pm_event.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pm_event.event_nm IS '이벤트명';
COMMENT ON COLUMN shopjoy_2604.pm_event.event_type_cd IS '이벤트유형 (코드: EVENT_TYPE)';
COMMENT ON COLUMN shopjoy_2604.pm_event.img_url IS '배너이미지URL';
COMMENT ON COLUMN shopjoy_2604.pm_event.event_title IS '이벤트 제목';
COMMENT ON COLUMN shopjoy_2604.pm_event.event_content IS '이벤트 상세내용';
COMMENT ON COLUMN shopjoy_2604.pm_event.start_date IS '이벤트 시작일';
COMMENT ON COLUMN shopjoy_2604.pm_event.end_date IS '이벤트 종료일';
COMMENT ON COLUMN shopjoy_2604.pm_event.notice_start IS '예고 시작일';
COMMENT ON COLUMN shopjoy_2604.pm_event.notice_end IS '예고 종료일';
COMMENT ON COLUMN shopjoy_2604.pm_event.event_status_cd IS '상태 (코드: EVENT_STATUS)';
COMMENT ON COLUMN shopjoy_2604.pm_event.event_status_cd_before IS '변경 전 이벤트상태 (코드: EVENT_STATUS)';
COMMENT ON COLUMN shopjoy_2604.pm_event.target_type_cd IS '대상유형 (코드: EVENT_TARGET)';
COMMENT ON COLUMN shopjoy_2604.pm_event.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.pm_event.view_cnt IS '조회수';
COMMENT ON COLUMN shopjoy_2604.pm_event.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pm_event.event_desc IS '이벤트설명';
COMMENT ON COLUMN shopjoy_2604.pm_event.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pm_event.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pm_event.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pm_event.upd_date IS '수정일';

CREATE INDEX idx_pm_event_date ON shopjoy_2604.pm_event USING btree (start_date, end_date);
CREATE INDEX idx_pm_event_status ON shopjoy_2604.pm_event USING btree (event_status_cd);
CREATE INDEX idx_pm_event_type ON shopjoy_2604.pm_event USING btree (event_type_cd);
