-- ============================================================
-- ec_event : 이벤트
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE ec_event (
    event_id        VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    title           VARCHAR(200)    NOT NULL,
    event_type_cd   VARCHAR(20),                            -- 코드: EVENT_TYPE (SALE/COUPON/POINT/EXHIBITION 등)
    tag             VARCHAR(50),                            -- 태그 라벨 (할인, 카드혜택, 적립 등)
    status_cd       VARCHAR(20)     DEFAULT 'DRAFT',        -- 코드: EVENT_STATUS (DRAFT/ONGOING/ENDED/HIDDEN)
    start_date      TIMESTAMP,
    end_date        TIMESTAMP,
    thumb_url       VARCHAR(500),                           -- 썸네일 이미지 URL
    banner_url      VARCHAR(500),                           -- 히어로 배너 이미지 URL
    hero_text       VARCHAR(200),                           -- 히어로 상단 텍스트
    hero_sub        VARCHAR(500),                           -- 히어로 서브 텍스트
    summary         VARCHAR(500),                           -- 요약 설명
    content_html    TEXT,                                   -- 상세 본문 (HTML)
    target_cd       VARCHAR(20),                            -- 코드: EVENT_TARGET (ALL/MEMBER/VIP/NEW 등)
    sort_ord        INTEGER         DEFAULT 0,
    view_count      INTEGER         DEFAULT 0,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (event_id)
);

COMMENT ON TABLE  ec_event                IS '이벤트';
COMMENT ON COLUMN ec_event.event_id       IS '이벤트ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_event.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_event.title          IS '이벤트 제목';
COMMENT ON COLUMN ec_event.event_type_cd  IS '이벤트유형 (코드: EVENT_TYPE)';
COMMENT ON COLUMN ec_event.tag            IS '태그 라벨';
COMMENT ON COLUMN ec_event.status_cd      IS '상태 (코드: EVENT_STATUS)';
COMMENT ON COLUMN ec_event.start_date     IS '시작일시';
COMMENT ON COLUMN ec_event.end_date       IS '종료일시';
COMMENT ON COLUMN ec_event.thumb_url      IS '썸네일URL';
COMMENT ON COLUMN ec_event.banner_url     IS '히어로 배너URL';
COMMENT ON COLUMN ec_event.hero_text      IS '히어로 상단 텍스트';
COMMENT ON COLUMN ec_event.hero_sub       IS '히어로 서브 텍스트';
COMMENT ON COLUMN ec_event.summary        IS '요약 설명';
COMMENT ON COLUMN ec_event.content_html   IS '상세 본문 (HTML)';
COMMENT ON COLUMN ec_event.target_cd      IS '대상 (코드: EVENT_TARGET)';
COMMENT ON COLUMN ec_event.sort_ord       IS '정렬순서';
COMMENT ON COLUMN ec_event.view_count     IS '조회수';
COMMENT ON COLUMN ec_event.reg_by         IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_event.reg_date       IS '등록일';
COMMENT ON COLUMN ec_event.upd_by         IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_event.upd_date       IS '수정일';

CREATE INDEX idx_ec_event_status ON ec_event (status_cd, start_date);
CREATE INDEX idx_ec_event_date   ON ec_event (start_date, end_date);

-- 이벤트 혜택 (쿠폰/적립 등 구체 혜택 항목)
CREATE TABLE ec_event_benefit (
    benefit_id      VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),
    event_id        VARCHAR(16)     NOT NULL,              -- ec_event.event_id
    benefit_nm      VARCHAR(100)    NOT NULL,
    benefit_type_cd VARCHAR(20),                            -- 코드: BENEFIT_TYPE (COUPON/POINT/DISCOUNT/GIFT)
    condition_desc  VARCHAR(200),                           -- 조건 설명 (예: 20만원 이상)
    benefit_value   VARCHAR(100),                           -- 혜택 값 (예: 10,000원, 10%)
    coupon_id       VARCHAR(16),                            -- 연결 쿠폰ID (ec_coupon.coupon_id)
    sort_ord        INTEGER         DEFAULT 0,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (benefit_id)
);

COMMENT ON TABLE  ec_event_benefit                  IS '이벤트 혜택';
COMMENT ON COLUMN ec_event_benefit.benefit_id       IS '혜택ID';
COMMENT ON COLUMN ec_event_benefit.site_id          IS '사이트ID';
COMMENT ON COLUMN ec_event_benefit.event_id         IS '이벤트ID';
COMMENT ON COLUMN ec_event_benefit.benefit_nm       IS '혜택명';
COMMENT ON COLUMN ec_event_benefit.benefit_type_cd  IS '혜택유형 (코드: BENEFIT_TYPE)';
COMMENT ON COLUMN ec_event_benefit.condition_desc   IS '조건 설명';
COMMENT ON COLUMN ec_event_benefit.benefit_value    IS '혜택 값';
COMMENT ON COLUMN ec_event_benefit.coupon_id        IS '연결 쿠폰ID';
COMMENT ON COLUMN ec_event_benefit.sort_ord         IS '정렬순서';
COMMENT ON COLUMN ec_event_benefit.reg_by           IS '등록자';
COMMENT ON COLUMN ec_event_benefit.reg_date         IS '등록일';
COMMENT ON COLUMN ec_event_benefit.upd_by           IS '수정자';
COMMENT ON COLUMN ec_event_benefit.upd_date         IS '수정일';

CREATE INDEX idx_ec_event_benefit_event ON ec_event_benefit (event_id);
