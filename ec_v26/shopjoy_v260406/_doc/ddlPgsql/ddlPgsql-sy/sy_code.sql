-- 코드 항목
CREATE TABLE sy_code (
    code_id             VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    code_grp            VARCHAR(50)     NOT NULL,
    code_value          VARCHAR(50)     NOT NULL,               -- 실제 저장 값
    code_label          VARCHAR(100)    NOT NULL,               -- 화면 표시 라벨
    sort_ord            INTEGER         DEFAULT 0,
    use_yn              CHAR(1)         DEFAULT 'Y',
    parent_code_value   VARCHAR(50),                            -- 부모 코드값 (트리 구조 시 상위 code_value, null이면 루트)
    child_code_values   VARCHAR(500),                           -- 허용 자식/전이 코드값 목록 (^VAL1^VAL2^ 형식)
    code_remark         VARCHAR(300),
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (code_id),
    UNIQUE (code_grp, code_value)
);

COMMENT ON TABLE  sy_code                IS '공통코드';
COMMENT ON COLUMN sy_code.code_id             IS '코드ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_code.site_id             IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_code.code_grp            IS '코드그룹 (sy_code_grp.code_grp)';
COMMENT ON COLUMN sy_code.code_value          IS '코드값 (저장값)';
COMMENT ON COLUMN sy_code.code_label          IS '코드라벨 (표시명)';
COMMENT ON COLUMN sy_code.sort_ord            IS '정렬순서';
COMMENT ON COLUMN sy_code.use_yn              IS '사용여부 Y/N';
COMMENT ON COLUMN sy_code.parent_code_value   IS '부모 코드값 (트리 구조 시 상위 code_value, null이면 루트)';
COMMENT ON COLUMN sy_code.child_code_values   IS '허용 자식/전이 코드값 목록 (^VAL1^VAL2^ 형식 — 상태 전이 제약이나 하위 코드 목록)';
COMMENT ON COLUMN sy_code.code_remark         IS '비고';
COMMENT ON COLUMN sy_code.reg_by              IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_code.reg_date            IS '등록일';
COMMENT ON COLUMN sy_code.upd_by              IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_code.upd_date            IS '수정일';

-- ============================================================
-- 코드 그룹 목록 (상세 코드값은 sy.08.공통코드.md 참조)
-- ============================================================
-- [회원]
-- MEMBER_STATUS        : 회원상태 (ACTIVE/DORMANT/SUSPENDED/WITHDRAW_WAIT/WITHDRAWN/FORCED_WITHDRAWN)
-- MEMBER_GRADE         : 회원등급 (BASIC/SILVER/GOLD/VIP)
-- GENDER               : 성별 (M/F)
-- SNS_CHANNEL          : SNS 연동 채널 (KAKAO/NAVER/GOOGLE/APPLE)
-- MEMBER_WITHDRAW_REASON : 탈퇴사유 (REJOIN/DELIVERY/PRODUCT/BENEFIT/LOW_USE/UX/OTHER)
--
-- [주문]
-- ORDER_STATUS         : 주문상태 (PENDING/PAID/PREPARING/SHIPPED/DELIVERED/COMPLT/CANCELLED/AUTO_CANCELLED)
-- ORDER_ITEM_STATUS    : 주문항목상태 (NORMAL/PARTIAL_CANCELLED/SHIPPED/DELIVERED/COMPLT/CANCELLED/RETURNED)
-- CANCEL_REASON        : 취소사유 (MIND_CHANGE/WRONG_OPTION/OUT_OF_STOCK/...)
-- RETURN_REASON        : 반품사유 (MIND_CHANGE/SIZE_DIFF/DEFECT/WRONG_DELIVERY/...)
-- EXCHANGE_REASON      : 교환사유 (SIZE_CHANGE/ORDER_MISTAKE/DEFECT/WRONG_DELIVERY)
-- ACCESS_CHANNEL       : 접근채널 (WEB_PC/WEB_MOBILE/APP_IOS/APP_ANDROID)
-- ORDER_DISCNT_TYPE    : 주문할인유형 (SALE_PRICE/COUPON/PROMOTION/SHIP_DISCNT/PRODUCT_DISCNT/...)
--
-- [결제]
-- PAY_METHOD           : 결제수단 (BANK_TRANSFER/VBANK/TOSS/KAKAO/NAVER/MOBILE/SAVE/ZERO)
-- PAY_CHANNEL          : PG 세부채널 (CARD/ACCOUNT/KAKAO/NAVER)
-- PAY_STATUS           : 결제상태 (PENDING/COMPLT/FAILED/CANCELLED/PARTIAL_REFUND/REFUNDED)
-- REFUND_METHOD        : 환불수단 (CARD/BANK/CACHE)
-- BANK_CODE            : 은행코드 (국민/신한/우리/하나/농협/기업/카카오/...)
--
-- [배송]
-- DLIV_STATUS          : 배송상태 (READY/SHIPPED/IN_TRANSIT/DELIVERED/FAILED)
-- DLIV_DIV             : 입출고구분 (OUTBOUND/INBOUND)
-- DLIV_TYPE            : 배송유형 (NORMAL/RETURN/EXCHANGE/EXCHANGE_OUT)
-- DLIV_METHOD          : 배송방법 (COURIER/DIRECT/PICKUP/SAME_DAY)
-- DLIV_PAY_TYPE        : 배송비결제 (PREPAY/COD)
-- DLIV_COST_TYPE       : 배송비유형 (FREE/FIXED/COND_FREE/ISLAND_EXTRA)
-- COURIER              : 택배사 (CJ/LOGEN/POST/HANJIN/LOTTE/KYOUNGDONG/DIRECT)
--
-- [클레임]
-- CLAIM_TYPE           : 클레임유형 (CANCEL/RETURN/EXCHANGE)
-- CLAIM_STATUS         : 클레임상태 (REQUESTED/CONFIRMED/IN_PICKUP/PROCESSING/REFUND_WAIT/COMPLT/REJECTED/WITHDRAWN)
--
-- [상품]
-- PRODUCT_STATUS       : 상품상태 (DRAFT/ACTIVE/STOPPED/SOLD_OUT/DISCONTINUED)
-- PRODUCT_TYPE         : 상품유형 (SINGLE/GROUP/SET)
-- VAT_TYPE             : 부가세유형 (TAXABLE/TAX_FREE)
-- OPT_TYPE             : 옵션카테고리 (NONE/COLOR/SIZE/MATERIAL/CUSTOM)
-- OPT_VAL              : 옵션프리셋값 (RED/BLUE/.../S/M/L/XL/... parentCodeValue=OPT_TYPE값)
-- OPT_INPUT_TYPE       : 옵션입력방식 (SELECT/SELECT_INPUT/MULTI_SELECT)
-- PROD_QNA_TYPE        : 상품문의유형 (SIZE/QUALITY/DLIV/ETC)
--
-- [프로모션]
-- COUPON_TYPE          : 쿠폰유형 (RATE/FIXED/SHIPPING)
-- COUPON_ISSUE_TYPE    : 쿠폰발급유형 (AUTO/MANUAL/DOWNLOAD/JOIN/GRADE/BIRTHDAY/REFERRAL/FIRST_BUY/DORMANT)
-- COUPON_STATUS        : 쿠폰상태 (ACTIVE/INACTIVE/EXPIRED)
-- DISCNT_TYPE          : 할인유형 (RATE/FIXED/FREE_SHIP)
-- DISCNT_STATUS        : 할인상태 (ACTIVE/INACTIVE/EXPIRED)
-- GIFT_TYPE            : 사은품유형 (PRODUCT/SAMPLE/ETC)
-- GIFT_STATUS          : 사은품상태 (ACTIVE/INACTIVE)
-- GIFT_COND_TYPE       : 사은품 지급 조건유형 (ORDER_AMT/PRODUCT/MEMBER_GRADE)
-- SAVE_TYPE            : 적립금유형 (EARN/USE/EXPIRE/CANCEL/ADMIN)
-- SAVE_REASON_TYPE     : 적립금 발생사유 (JOIN/ORDER_COMPLT/REVIEW_TEXT/REVIEW_PHOTO/EVENT/BIRTHDAY/ADMIN_GRANT/...)
-- EVENT_STATUS         : 이벤트상태 (DRAFT/WAITING/ACTIVE/PAUSED/ENDED)
-- CACHE_TYPE           : 캐시(충전금)유형 (CHARGE/USE/REFUND/EXPIRE/ADJ)
-- VOUCHER_STATUS       : 상품권상태 (ACTIVE/USED/EXPIRED/CANCELLED)
-- PROMO_TARGET_TYPE    : 프로모션 대상유형 (ALL/PRODUCT/CATEGORY/VENDOR/BRAND/MEMBER_GRADE)
--
-- [시스템]
-- SITE_STATUS          : 사이트상태 (ACTIVE/MAINTENANCE/INACTIVE)
-- USER_STATUS          : 관리자상태 (ACTIVE/INACTIVE/LOCKED)
-- VENDOR_STATUS        : 업체상태 (ACTIVE/INACTIVE/SUSPENDED)
-- ALARM_TYPE           : 알림유형 (ORDER/CLAIM/SYSTEM/MARKETING)
-- ALARM_CHANNEL        : 알림채널 (EMAIL/SMS/PUSH/KAKAO)
-- TEMPLATE_TYPE        : 템플릿유형 (EMAIL/SMS/PUSH/KAKAO)
-- BATCH_CYCLE          : 배치주기 (HOURLY/DAILY/WEEKLY/MONTHLY/MANUAL)
-- BATCH_STATUS         : 배치상태 (ACTIVE/INACTIVE)
-- CONTACT_STATUS       : 1:1 문의상태 (PENDING/ANSWERED/CLOSED)
-- NOTICE_TYPE          : 공지유형 (GENERAL/EVENT/SERVICE/SYSTEM)
-- DISP_STATUS          : 전시상태 (ACTIVE/INACTIVE)
-- VOC_MASTER           : VOC 마스터 분류 (DELIVERY/PRODUCT/PAYMENT/CLAIM/SERVICE/ETC)
-- VOC_DETAIL           : VOC 세부 분류 (DELIVERY_DELAY/PRODUCT_DEFECT/PAYMENT_FAIL/...)
-- ============================================================

CREATE INDEX idx_sy_code_grp   ON sy_code (code_grp);
CREATE INDEX idx_sy_code_use   ON sy_code (code_grp, use_yn);
