-- 코드 항목
CREATE TABLE sy_code (
    code_id         VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    code_grp        VARCHAR(50)     NOT NULL,
    code_value      VARCHAR(50)     NOT NULL,               -- 실제 저장 값
    code_label      VARCHAR(100)    NOT NULL,               -- 화면 표시 라벨
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    code_remark     VARCHAR(300),
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
COMMENT ON COLUMN sy_code.code_remark    IS '비고';
COMMENT ON COLUMN sy_code.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_code.reg_date       IS '등록일';
COMMENT ON COLUMN sy_code.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_code.upd_date       IS '수정일';

-- ============================================================
-- 주요 코드 그룹 목록
-- MEMBER_GRADE    : 회원등급 (BASIC/SILVER/GOLD/VIP)
-- MEMBER_STATUS   : 회원상태 (ACTIVE/INACTIVE/SUSPENDED/WITHDRAWN)
-- GENDER          : 성별 (M/F)
-- ORDER_STATUS    : 주문상태 (PENDING/PAID/PREPARING/SHIPPED/DELIVERED/CANCELLED)
-- PAY_METHOD      : 결제수단 (BANK_TRANSFER/VBANK/TOSS/KAKAO/NAVER/MOBILE)
-- PAY_CHANNEL     : 결제채널 (TOSS 한정: CARD/ACCOUNT/KAKAO/NAVER)
-- PAY_STATUS      : 결제상태 (PENDING/COMPLT/FAILED/CANCELLED/REFUNDED)
-- PAYMENT_CHG_TYPE : 결제변경유형 (APPROVE/COMPLETE/FAIL/REFUND/CANCEL/RETRY)
-- REFUND_STATUS   : 환불상태 (PENDING/COMPLT/FAILED)
-- REFUND_METHOD   : 환불수단 (CARD/BANK/CACHE)
-- CARD_TYPE       : 카드타입 (CREDIT/DEBIT/CHECK)
-- BANK_CODE       : 은행코드 (신한/국민/우리/하나 등)
-- COURIER         : 택배사 (CJ/LOGEN/POST/HANJIN/LOTTE)
-- DLIV_DIV        : 입출고구분 (OUTBOUND=출고, INBOUND=입고반품)
-- DLIV_TYPE       : 배송유형 (NORMAL=정상배송, RETURN=반품, EXCHANGE=교환, EXCHANGE_OUT=교환출고)
-- DLIV_STATUS     : 배송상태 (READY/SHIPPED/IN_TRANSIT/DELIVERED/FAILED)
-- SHIPPING_FEE_TYPE : 배송료구분 (OUTBOUND=출고, RETURN=수거, INBOUND=반입, EXCHANGE=교환발송)
-- CLAIM_TYPE      : 클레임유형 (CANCEL/RETURN/EXCHANGE)
-- CLAIM_STATUS    : 클레임상태 (REQUESTED/CONFIRMED/PROCESSING/COMPLT/REJECTED)
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
