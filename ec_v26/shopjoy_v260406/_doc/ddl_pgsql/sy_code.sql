-- ============================================================
-- sy_code : 공통코드 (그룹 + 항목 통합)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================

-- 코드 그룹
CREATE TABLE sy_code_grp (
    code_grp        VARCHAR(50)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    grp_nm          VARCHAR(100)    NOT NULL,
    description     VARCHAR(300),
    use_yn          CHAR(1)         DEFAULT 'Y',
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (code_grp)
);

COMMENT ON TABLE  sy_code_grp               IS '공통코드 그룹';
COMMENT ON COLUMN sy_code_grp.code_grp      IS '코드그룹키 (예: MEMBER_GRADE)';
COMMENT ON COLUMN sy_code_grp.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_code_grp.grp_nm        IS '그룹명';
COMMENT ON COLUMN sy_code_grp.description   IS '설명';
COMMENT ON COLUMN sy_code_grp.use_yn        IS '사용여부 Y/N';
COMMENT ON COLUMN sy_code_grp.reg_by        IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN sy_code_grp.reg_date      IS '등록일';
COMMENT ON COLUMN sy_code_grp.upd_by        IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN sy_code_grp.upd_date      IS '수정일';

-- 코드 항목
CREATE TABLE sy_code (
    code_id         VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    code_grp        VARCHAR(50)     NOT NULL,
    code_value      VARCHAR(50)     NOT NULL,               -- 실제 저장 값
    code_label      VARCHAR(100)    NOT NULL,               -- 화면 표시 라벨
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    remark          VARCHAR(300),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (code_id),
    UNIQUE (code_grp, code_value)
);

COMMENT ON TABLE  sy_code                IS '공통코드';
COMMENT ON COLUMN sy_code.code_id        IS '코드ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_code.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_code.code_grp       IS '코드그룹 (sy_code_grp.code_grp)';
COMMENT ON COLUMN sy_code.code_value     IS '코드값 (저장값)';
COMMENT ON COLUMN sy_code.code_label     IS '코드라벨 (표시명)';
COMMENT ON COLUMN sy_code.sort_ord       IS '정렬순서';
COMMENT ON COLUMN sy_code.use_yn         IS '사용여부 Y/N';
COMMENT ON COLUMN sy_code.remark         IS '비고';
COMMENT ON COLUMN sy_code.reg_by         IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN sy_code.reg_date       IS '등록일';
COMMENT ON COLUMN sy_code.upd_by         IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN sy_code.upd_date       IS '수정일';

-- ============================================================
-- 주요 코드 그룹 목록
-- MEMBER_GRADE    : 회원등급 (BASIC/SILVER/GOLD/VIP)
-- MEMBER_STATUS   : 회원상태 (ACTIVE/INACTIVE/SUSPENDED/WITHDRAWN)
-- GENDER          : 성별 (M/F)
-- ORDER_STATUS    : 주문상태 (PENDING/PAID/PREPARING/SHIPPED/DELIVERED/CANCELLED)
-- PAY_METHOD      : 결제수단 (CARD/BANK/VBANK/KAKAO/NAVER/CACHE)
-- REFUND_METHOD   : 환불수단 (CARD/BANK/CACHE)
-- COURIER         : 택배사 (CJ/LOGEN/POST/HANJIN/LOTTE)
-- DLIV_STATUS     : 배송상태 (READY/SHIPPED/IN_TRANSIT/DELIVERED/FAILED)
-- CLAIM_TYPE      : 클레임유형 (CANCEL/RETURN/EXCHANGE)
-- CLAIM_STATUS    : 클레임상태 (REQUESTED/CONFIRMED/PROCESSING/COMPLETED/REJECTED)
-- CLAIM_REASON    : 클레임사유 (MIND_CHANGE/DEFECT/WRONG/OTHER)
-- PRODUCT_STATUS  : 상품상태 (ACTIVE/INACTIVE/SOLDOUT/DELETED)
-- PRODUCT_SIZE    : 상품사이즈 (XS/S/M/L/XL/XXL/FREE)
-- COUPON_TYPE     : 쿠폰유형 (RATE/FIXED)
-- COUPON_STATUS   : 쿠폰상태 (ACTIVE/INACTIVE/EXPIRED)
-- CACHE_TYPE      : 적립금유형 (EARN/USE/EXPIRE/ADMIN)
-- EVENT_TYPE      : 이벤트유형 (SALE/LUCKY/REVIEW/JOIN)
-- EVENT_STATUS    : 이벤트상태 (ACTIVE/INACTIVE/ENDED)
-- DISP_TYPE       : 디스플레이유형 (SLIDE/GRID/LIST/SINGLE)
-- DISP_STATUS     : 디스플레이상태 (ACTIVE/INACTIVE)
-- DISP_AREA       : 디스플레이영역 (MAIN_TOP/MAIN_BANNER/MAIN_PRODUCT 등)
-- NOTICE_TYPE     : 공지유형 (GENERAL/EVENT/SERVICE/SYSTEM)
-- CONTACT_STATUS  : 문의상태 (PENDING/ANSWERED/CLOSED)
-- CHATT_STATUS    : 채팅상태 (OPEN/CLOSED)
-- ALARM_TYPE      : 알림유형 (ORDER/CLAIM/SYSTEM/MARKETING)
-- ALARM_CHANNEL   : 알림채널 (EMAIL/SMS/PUSH/KAKAO)
-- TEMPLATE_TYPE   : 템플릿유형 (EMAIL/SMS/PUSH/KAKAO)
-- BATCH_CYCLE     : 배치주기 (DAILY/WEEKLY/MONTHLY/HOURLY/MANUAL)
-- BATCH_STATUS    : 배치상태 (ACTIVE/INACTIVE)
-- VENDOR_STATUS   : 업체상태 (ACTIVE/INACTIVE/SUSPENDED)
-- SITE_STATUS     : 사이트상태 (ACTIVE/MAINTENANCE/INACTIVE)
-- USER_STATUS     : 사용자상태 (ACTIVE/INACTIVE/LOCKED)
-- DEPT_TYPE       : 부서유형 (HQ/BRANCH/TEAM)
-- USE_YN          : 사용여부 (Y/N)
-- ============================================================
