-- ============================================================
-- ec_event : 이벤트
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE ec_event (
    event_id        VARCHAR(16)     NOT NULL,
    title           VARCHAR(200)    NOT NULL,
    event_type_cd   VARCHAR(30),                            -- 코드: EVENT_TYPE
    content_html    TEXT,
    banner_url      VARCHAR(500),
    auth_required   CHAR(1)         DEFAULT 'N',            -- 로그인 필요여부
    auth_grade_cd   VARCHAR(20),                            -- 특정등급만 참여 (코드: MEMBER_GRADE)
    start_date      TIMESTAMP,
    end_date        TIMESTAMP,
    status_cd       VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: EVENT_STATUS
    view_count      INTEGER         DEFAULT 0,
    memo            TEXT,
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_date        TIMESTAMP,
    PRIMARY KEY (event_id)
);

COMMENT ON TABLE  ec_event                IS '이벤트';
COMMENT ON COLUMN ec_event.event_id       IS '이벤트ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_event.title          IS '이벤트 제목';
COMMENT ON COLUMN ec_event.event_type_cd  IS '이벤트유형 (코드: EVENT_TYPE)';
COMMENT ON COLUMN ec_event.content_html   IS '내용 (HTML)';
COMMENT ON COLUMN ec_event.banner_url     IS '배너이미지URL';
COMMENT ON COLUMN ec_event.auth_required  IS '로그인필요 Y/N';
COMMENT ON COLUMN ec_event.auth_grade_cd  IS '참여등급 (코드: MEMBER_GRADE)';
COMMENT ON COLUMN ec_event.start_date     IS '시작일';
COMMENT ON COLUMN ec_event.end_date       IS '종료일';
COMMENT ON COLUMN ec_event.status_cd      IS '상태 (코드: EVENT_STATUS)';
COMMENT ON COLUMN ec_event.view_count     IS '조회수';
COMMENT ON COLUMN ec_event.memo           IS '메모';
COMMENT ON COLUMN ec_event.reg_date       IS '등록일';
COMMENT ON COLUMN ec_event.upd_date       IS '수정일';

-- 이벤트 대상 상품
CREATE TABLE ec_event_prod (
    event_prod_id   VARCHAR(16)     NOT NULL,
    event_id        VARCHAR(16)     NOT NULL,
    prod_id         VARCHAR(16)     NOT NULL,
    sort_ord        INTEGER         DEFAULT 0,
    discount_rate   INTEGER         DEFAULT 0,              -- 이벤트 할인율(%)
    PRIMARY KEY (event_prod_id)
);

COMMENT ON TABLE  ec_event_prod                IS '이벤트 대상상품';
COMMENT ON COLUMN ec_event_prod.event_prod_id  IS '이벤트상품ID';
COMMENT ON COLUMN ec_event_prod.event_id       IS '이벤트ID';
COMMENT ON COLUMN ec_event_prod.prod_id        IS '상품ID';
COMMENT ON COLUMN ec_event_prod.sort_ord       IS '정렬순서';
COMMENT ON COLUMN ec_event_prod.discount_rate  IS '이벤트할인율(%)';
