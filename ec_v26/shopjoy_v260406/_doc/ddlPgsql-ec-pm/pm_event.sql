-- ============================================================
-- ec_event : 이벤트
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE pm_event (
    event_id        VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
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
    event_status_cd_before VARCHAR(20),                     -- 변경 전 이벤트상태
    target_type_cd  VARCHAR(20),                            -- 코드: EVENT_TARGET (ALL/MEMBER/GRADE/GUEST)
    sort_ord        INTEGER         DEFAULT 0,
    view_cnt        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    event_desc      TEXT,
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (event_id)
);

COMMENT ON TABLE pm_event IS '이벤트';
COMMENT ON COLUMN pm_event.event_id             IS '이벤트ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_event.site_id              IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pm_event.event_nm             IS '이벤트명';
COMMENT ON COLUMN pm_event.event_type_cd        IS '이벤트유형 (코드: EVENT_TYPE)';
COMMENT ON COLUMN pm_event.img_url              IS '배너이미지URL';
COMMENT ON COLUMN pm_event.event_title         IS '이벤트 제목';
COMMENT ON COLUMN pm_event.event_content       IS '이벤트 상세내용';
COMMENT ON COLUMN pm_event.start_date           IS '이벤트 시작일';
COMMENT ON COLUMN pm_event.end_date             IS '이벤트 종료일';
COMMENT ON COLUMN pm_event.notice_start         IS '예고 시작일';
COMMENT ON COLUMN pm_event.notice_end           IS '예고 종료일';
COMMENT ON COLUMN pm_event.event_status_cd      IS '상태 (코드: EVENT_STATUS)';
COMMENT ON COLUMN pm_event.event_status_cd_before IS '변경 전 이벤트상태 (코드: EVENT_STATUS)';
COMMENT ON COLUMN pm_event.target_type_cd       IS '대상유형 (코드: EVENT_TARGET)';
COMMENT ON COLUMN pm_event.sort_ord             IS '정렬순서';
COMMENT ON COLUMN pm_event.view_cnt             IS '조회수';
COMMENT ON COLUMN pm_event.use_yn               IS '사용여부 Y/N';
COMMENT ON COLUMN pm_event.event_desc           IS '이벤트설명';
COMMENT ON COLUMN pm_event.reg_by               IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_event.reg_date             IS '등록일';
COMMENT ON COLUMN pm_event.upd_by               IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_event.upd_date             IS '수정일';

CREATE INDEX idx_pm_event_type ON pm_event (event_type_cd);
CREATE INDEX idx_pm_event_status ON pm_event (event_status_cd);
CREATE INDEX idx_pm_event_date ON pm_event (start_date, end_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_event.event_type_cd (이벤트유형) : 이벤트유형 { DISCOUNT:할인 이벤트, GIFT:증정 이벤트, CACHE:적립 이벤트, CURATED:기획전 }
-- [CODES] pm_event.event_status_cd (상태) : 이벤트상태 { PENDING:대기, ACTIVE:진행중, ENDED:종료 }
-- [CODES] pm_event.target_type_cd (대상유형) : PROMO_TARGET_TYPE { ALL:전체, PRODUCT:상품, CATEGORY:카테고리, VENDOR:업체, BRAND:브랜드, MEMBER_GRADE:회원등급 }
