-- ============================================================
-- ec_event : 이벤트
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE ec_event (
    event_id        VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    event_nm        VARCHAR(100)    NOT NULL,
    event_type_cd   VARCHAR(20),                            -- 코드: EVENT_TYPE (PROMOTION/FLASH/CAMPAIGN/COUPON)
    img_url         VARCHAR(500),                           -- 배너이미지
    event_title     VARCHAR(200),                           -- 이벤트 제목
    event_content   TEXT,                                   -- 이벤트 상세 내용
    start_date      DATE            NOT NULL,              -- 이벤트 시작일
    end_date        DATE            NOT NULL,              -- 이벤트 종료일
    notice_start    DATE,                                   -- 예고 시작일
    notice_end      DATE,                                   -- 예고 종료일
    event_status_cd VARCHAR(20)     DEFAULT 'DRAFT',        -- 코드: EVENT_STATUS (DRAFT/ACTIVE/PAUSED/ENDED/CLOSED)
    target_type_cd  VARCHAR(20),                            -- 코드: EVENT_TARGET (ALL/MEMBER/GRADE/GUEST)
    sort_ord        INTEGER         DEFAULT 0,
    view_cnt        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    event_desc      TEXT,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (event_id)
);

COMMENT ON TABLE  ec_event                      IS '이벤트';
COMMENT ON COLUMN ec_event.event_id             IS '이벤트ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_event.site_id              IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_event.event_nm             IS '이벤트명';
COMMENT ON COLUMN ec_event.event_type_cd        IS '이벤트유형 (코드: EVENT_TYPE)';
COMMENT ON COLUMN ec_event.img_url              IS '배너이미지URL';
COMMENT ON COLUMN ec_event.event_title         IS '이벤트 제목';
COMMENT ON COLUMN ec_event.event_content       IS '이벤트 상세내용';
COMMENT ON COLUMN ec_event.start_date           IS '이벤트 시작일';
COMMENT ON COLUMN ec_event.end_date             IS '이벤트 종료일';
COMMENT ON COLUMN ec_event.notice_start         IS '예고 시작일';
COMMENT ON COLUMN ec_event.notice_end           IS '예고 종료일';
COMMENT ON COLUMN ec_event.event_status_cd      IS '상태 (코드: EVENT_STATUS)';
COMMENT ON COLUMN ec_event.target_type_cd       IS '대상유형 (코드: EVENT_TARGET)';
COMMENT ON COLUMN ec_event.sort_ord             IS '정렬순서';
COMMENT ON COLUMN ec_event.view_cnt             IS '조회수';
COMMENT ON COLUMN ec_event.use_yn               IS '사용여부 Y/N';
COMMENT ON COLUMN ec_event.event_desc           IS '이벤트설명';
COMMENT ON COLUMN ec_event.reg_by               IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_event.reg_date             IS '등록일';
COMMENT ON COLUMN ec_event.upd_by               IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_event.upd_date             IS '수정일';

CREATE INDEX idx_ec_event_type ON ec_event (event_type_cd);
CREATE INDEX idx_ec_event_status ON ec_event (event_status_cd);
CREATE INDEX idx_ec_event_date ON ec_event (start_date, end_date);
