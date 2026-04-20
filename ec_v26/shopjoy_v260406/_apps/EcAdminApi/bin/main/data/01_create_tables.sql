-- ============================================================
-- ShopJoy 2604 — 전체 테이블 DDL
-- 생성일: 2026-04-19
-- Schema: shopjoy_2604
-- ============================================================

CREATE SCHEMA IF NOT EXISTS shopjoy_2604;
SET search_path TO shopjoy_2604;

-- ============================================================
-- [SY] 도메인
-- ============================================================

-- ============================================================
-- sy_site : 사이트
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS sy_site (
    site_id         VARCHAR(21)     NOT NULL,
    site_code       VARCHAR(50)     NOT NULL,
    site_type_cd    VARCHAR(20),                            -- 코드: SITE_TYPE (EC/ADMIN/API)
    site_nm         VARCHAR(100)    NOT NULL,
    site_domain     VARCHAR(200),
    logo_url        VARCHAR(500),
    favicon_url     VARCHAR(500),
    site_desc       TEXT,
    site_email      VARCHAR(100),
    site_phone      VARCHAR(20),
    site_zip_code   VARCHAR(10),
    site_address    VARCHAR(300),
    site_business_no VARCHAR(20),
    site_ceo        VARCHAR(50),
    site_status_cd  VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: SITE_STATUS
    config_json     TEXT,                                   -- 사이트별 확장 설정 (JSON)
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    disp_path       VARCHAR(200),                           -- 점(.) 구분 표시경로
    PRIMARY KEY (site_id),
    UNIQUE (site_code)
);

COMMENT ON TABLE  sy_site                IS '사이트';
COMMENT ON COLUMN sy_site.site_id        IS '사이트ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_site.site_code      IS '사이트코드';
COMMENT ON COLUMN sy_site.site_type_cd    IS '사이트유형 (코드: SITE_TYPE — EC/ADMIN/API)';
COMMENT ON COLUMN sy_site.site_nm        IS '사이트명';
COMMENT ON COLUMN sy_site.site_domain    IS '도메인';
COMMENT ON COLUMN sy_site.logo_url       IS '로고URL';
COMMENT ON COLUMN sy_site.favicon_url    IS '파비콘URL';
COMMENT ON COLUMN sy_site.site_desc      IS '사이트설명';
COMMENT ON COLUMN sy_site.site_email     IS '대표이메일';
COMMENT ON COLUMN sy_site.site_phone     IS '대표전화';
COMMENT ON COLUMN sy_site.site_zip_code  IS '우편번호';
COMMENT ON COLUMN sy_site.site_address   IS '주소';
COMMENT ON COLUMN sy_site.site_business_no IS '사업자번호';
COMMENT ON COLUMN sy_site.site_ceo       IS '대표자명';
COMMENT ON COLUMN sy_site.site_status_cd IS '상태 (코드: SITE_STATUS)';
COMMENT ON COLUMN sy_site.config_json    IS '확장설정 (JSON)';
COMMENT ON COLUMN sy_site.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_site.reg_date       IS '등록일';
COMMENT ON COLUMN sy_site.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_site.upd_date       IS '수정일';
COMMENT ON COLUMN sy_site.disp_path IS '점(.) 구분 표시경로 (트리 빌드용)';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_site.site_type_cd (사이트유형) : SITE_TYPE { EC:쇼핑몰, ADMIN:관리자, API:API }
-- [CODES] sy_site.site_status_cd (상태) : 사이트상태 { ACTIVE:활성, MAINTENANCE:점검중, INACTIVE:비활성 }

-- ============================================================
-- 코드 그룹
CREATE TABLE IF NOT EXISTS sy_code_grp (
    code_grp_id     VARCHAR(21)     NOT NULL,       -- 코드그룹ID (YYMMDDhhmmss+rand4)
    site_id         VARCHAR(21),                    -- sy_site.site_id
    code_grp        VARCHAR(50)     NOT NULL,       -- 코드그룹코드 (예: MEMBER_GRADE)
    grp_nm          VARCHAR(100)    NOT NULL,
    disp_path       VARCHAR(200),                   -- 점(.) 구분 표시경로 (예: order.payment)
    code_grp_desc   VARCHAR(300),
    use_yn          CHAR(1)         DEFAULT 'Y',
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (code_grp_id),
    UNIQUE (site_id, code_grp)
);

COMMENT ON TABLE  sy_code_grp               IS '공통코드 그룹';
COMMENT ON COLUMN sy_code_grp.code_grp_id   IS '코드그룹ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_code_grp.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_code_grp.code_grp      IS '코드그룹코드 (예: MEMBER_GRADE, UNIQUE with site_id)';
COMMENT ON COLUMN sy_code_grp.grp_nm        IS '그룹명';
COMMENT ON COLUMN sy_code_grp.disp_path     IS '점(.) 구분 표시경로 (트리 빌드용)';
COMMENT ON COLUMN sy_code_grp.code_grp_desc IS '코드그룹설명';
COMMENT ON COLUMN sy_code_grp.use_yn        IS '사용여부 Y/N';
COMMENT ON COLUMN sy_code_grp.reg_by        IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_code_grp.reg_date      IS '등록일';
COMMENT ON COLUMN sy_code_grp.upd_by        IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_code_grp.upd_date      IS '수정일';

CREATE INDEX idx_sy_code_grp_code ON sy_code_grp (code_grp);

-- 코드 항목
CREATE TABLE IF NOT EXISTS sy_code (
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
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
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

-- ============================================================
-- sy_dept : 부서
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS sy_dept (
    dept_id         VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    dept_code       VARCHAR(50)     NOT NULL,
    dept_nm         VARCHAR(100)    NOT NULL,
    parent_dept_id       VARCHAR(21),
    dept_type_cd    VARCHAR(20),                            -- 코드: DEPT_TYPE
    manager_id      VARCHAR(21),                            -- sy_user.user_id
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    dept_remark     VARCHAR(300),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (dept_id),
    UNIQUE (dept_code)
);

COMMENT ON TABLE  sy_dept                IS '부서';
COMMENT ON COLUMN sy_dept.dept_id        IS '부서ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_dept.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_dept.dept_code      IS '부서코드';
COMMENT ON COLUMN sy_dept.dept_nm        IS '부서명';
COMMENT ON COLUMN sy_dept.parent_dept_id      IS '상위부서ID';
COMMENT ON COLUMN sy_dept.dept_type_cd   IS '부서유형 (코드: DEPT_TYPE)';
COMMENT ON COLUMN sy_dept.manager_id     IS '부서장 (sy_user.user_id)';
COMMENT ON COLUMN sy_dept.sort_ord       IS '정렬순서';
COMMENT ON COLUMN sy_dept.use_yn         IS '사용여부 Y/N';
COMMENT ON COLUMN sy_dept.dept_remark    IS '비고';
COMMENT ON COLUMN sy_dept.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_dept.reg_date       IS '등록일';
COMMENT ON COLUMN sy_dept.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_dept.upd_date       IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_dept.dept_type_cd (부서유형) : 부서유형 { HQ:본사, DEV:개발팀, DEV_BACKEND:백엔드, DEV_FRONTEND:프론트엔드, MKT:마케팅팀, LOGIS:물류팀 }

-- ============================================================
-- sy_role : 역할 (권한그룹) / sy_role_menu : 역할-메뉴 매핑
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS sy_role (
    role_id         VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    role_code       VARCHAR(50)     NOT NULL,
    role_nm         VARCHAR(100)    NOT NULL,
    parent_role_id       VARCHAR(21),
    role_type_cd    VARCHAR(20),                            -- 코드: ROLE_TYPE (SYSTEM/CUSTOM)
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    restrict_perm   CHAR(1)         DEFAULT 'N',            -- 제한권한여부
    role_remark     VARCHAR(300),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    disp_path       VARCHAR(200),                           -- 점(.) 구분 표시경로
    PRIMARY KEY (role_id),
    UNIQUE (role_code)
);

COMMENT ON TABLE  sy_role                  IS '역할 (권한그룹)';
COMMENT ON COLUMN sy_role.role_id          IS '역할ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_role.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_role.role_code        IS '역할코드';
COMMENT ON COLUMN sy_role.role_nm          IS '역할명';
COMMENT ON COLUMN sy_role.parent_role_id        IS '상위역할ID';
COMMENT ON COLUMN sy_role.role_type_cd     IS '역할유형 (코드: ROLE_TYPE — SYSTEM/CUSTOM)';
COMMENT ON COLUMN sy_role.sort_ord         IS '정렬순서';
COMMENT ON COLUMN sy_role.use_yn           IS '사용여부 Y/N';
COMMENT ON COLUMN sy_role.restrict_perm    IS '제한권한여부 Y/N';
COMMENT ON COLUMN sy_role.role_remark      IS '비고';
COMMENT ON COLUMN sy_role.reg_by           IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_role.reg_date         IS '등록일';
COMMENT ON COLUMN sy_role.upd_by           IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_role.upd_date         IS '수정일';
COMMENT ON COLUMN sy_role.disp_path IS '점(.) 구분 표시경로 (트리 빌드용)';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_role.role_type_cd (역할유형) : ROLE_TYPE { SUPER:최고관리자, ADMIN:관리자, VENDOR:업체, CS:고객서비스, VIEWER:조회자 }

-- 역할-메뉴 권한 매핑
CREATE TABLE IF NOT EXISTS sy_role_menu (
    role_menu_id    VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    role_id         VARCHAR(21)     NOT NULL,
    menu_id         VARCHAR(21)     NOT NULL,
    perm_level      SMALLINT        DEFAULT 1,              -- 1:조회 / 2:수정 / 3:삭제
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (role_menu_id),
    UNIQUE (role_id, menu_id)
);

COMMENT ON TABLE  sy_role_menu              IS '역할-메뉴 권한 매핑';
COMMENT ON COLUMN sy_role_menu.role_menu_id IS '역할메뉴ID';
COMMENT ON COLUMN sy_role_menu.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_role_menu.role_id      IS '역할ID';
COMMENT ON COLUMN sy_role_menu.menu_id      IS '메뉴ID';
COMMENT ON COLUMN sy_role_menu.perm_level   IS '권한레벨 (1:조회/2:수정/3:삭제)';
COMMENT ON COLUMN sy_role_menu.reg_by       IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_role_menu.reg_date     IS '등록일';
COMMENT ON COLUMN sy_role_menu.upd_by       IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_role_menu.upd_date     IS '수정일';

-- ============================================================
CREATE TABLE IF NOT EXISTS sy_user (
    user_id         VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    login_id        VARCHAR(50)     NOT NULL,
    user_password   VARCHAR(255)    NOT NULL,
    user_nm         VARCHAR(50)     NOT NULL,
    user_email      VARCHAR(100),
    user_phone      VARCHAR(20),
    dept_id         VARCHAR(21),                            -- sy_dept.dept_id
    role_id         VARCHAR(21),                            -- sy_role.role_id
    user_status_cd  VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: USER_STATUS
    last_login      TIMESTAMP,
    login_fail_cnt  SMALLINT        DEFAULT 0,
    user_memo       TEXT,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    -- ── 인증 ──
    auth_method_cd  VARCHAR(20)     DEFAULT 'MAIN',         -- 코드: AUTH_METHOD (MAIN/SMS/OTP/AUTHENTICATOR)
    last_login_date TIMESTAMP,

    PRIMARY KEY (user_id),
    UNIQUE (login_id)
);

COMMENT ON TABLE  sy_user                  IS '관리자 사용자';
COMMENT ON COLUMN sy_user.user_id          IS '사용자ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_user.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_user.login_id         IS '로그인 아이디';
COMMENT ON COLUMN sy_user.user_password    IS '비밀번호 (bcrypt)';
COMMENT ON COLUMN sy_user.user_nm          IS '사용자명';
COMMENT ON COLUMN sy_user.user_email       IS '이메일';
COMMENT ON COLUMN sy_user.user_phone       IS '연락처';
COMMENT ON COLUMN sy_user.dept_id          IS '부서ID (sy_dept.dept_id)';
COMMENT ON COLUMN sy_user.role_id          IS '역할ID (sy_role.role_id)';
COMMENT ON COLUMN sy_user.user_status_cd   IS '상태 (코드: USER_STATUS)';
COMMENT ON COLUMN sy_user.last_login       IS '최근 로그인';
COMMENT ON COLUMN sy_user.login_fail_cnt   IS '로그인 실패 횟수';
COMMENT ON COLUMN sy_user.user_memo        IS '메모';
COMMENT ON COLUMN sy_user.reg_by           IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_user.reg_date         IS '등록일';
COMMENT ON COLUMN sy_user.upd_by           IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_user.upd_date         IS '수정일';
COMMENT ON COLUMN sy_user.auth_method_cd   IS '인증방식 (코드: AUTH_METHOD)';
COMMENT ON COLUMN sy_user.last_login_date  IS '마지막 로그인 일시';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_user.user_status_cd (상태) : 사용자상태 { ACTIVE:활성, INACTIVE:비활성 }
-- [CODES] sy_user.auth_method_cd (인증방식) : AUTH_METHOD { EMAIL:이메일, GOOGLE:구글, KAKAO:카카오, NAVER:네이버 }

-- ============================================================
-- sy_user_role : 관리자 사용자 ↔ 역할 매핑 (N:M)
-- 한 사용자는 여러 역할을, 한 역할은 여러 사용자에 할당 가능
-- ============================================================
CREATE TABLE IF NOT EXISTS sy_user_role (
    user_role_id    VARCHAR(21)     NOT NULL,                -- 사용자역할ID (YYMMDDhhmmss+rand4)
    user_id         VARCHAR(21)     NOT NULL,               -- sy_user.user_id
    role_id         VARCHAR(21)     NOT NULL,               -- sy_role.role_id
    grant_user_id   VARCHAR(21),                            -- 부여자 (sy_user.user_id)
    grant_date      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    valid_from      DATE,                                   -- 적용 시작일 (NULL = 즉시)
    valid_to        DATE,                                   -- 적용 종료일 (NULL = 무기한)
    user_role_remark VARCHAR(500),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (user_role_id),
    UNIQUE (user_id, role_id)
);

COMMENT ON TABLE  sy_user_role             IS '관리자 사용자-역할 매핑 (N:M)';
COMMENT ON COLUMN sy_user_role.user_role_id IS '사용자역할ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_user_role.user_id     IS '사용자ID (sy_user.user_id, UNIQUE with role_id)';
COMMENT ON COLUMN sy_user_role.role_id     IS '역할ID (sy_role.role_id, UNIQUE with user_id)';
COMMENT ON COLUMN sy_user_role.grant_user_id IS '부여자 (sy_user.user_id)';
COMMENT ON COLUMN sy_user_role.grant_date  IS '부여일시';
COMMENT ON COLUMN sy_user_role.valid_from  IS '적용 시작일';
COMMENT ON COLUMN sy_user_role.valid_to    IS '적용 종료일';
COMMENT ON COLUMN sy_user_role.user_role_remark IS '비고';
COMMENT ON COLUMN sy_user_role.reg_by      IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_user_role.reg_date    IS '등록일';
COMMENT ON COLUMN sy_user_role.upd_by      IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_user_role.upd_date    IS '수정일';

CREATE INDEX idx_sy_user_role_user ON sy_user_role (user_id);
CREATE INDEX idx_sy_user_role_role ON sy_user_role (role_id);

-- ============================================================
-- sy_brand : 브랜드
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS sy_brand (
    brand_id        VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    brand_code      VARCHAR(50)     NOT NULL,
    brand_nm        VARCHAR(100)    NOT NULL,
    brand_en_nm     VARCHAR(100),
    disp_path       VARCHAR(200),                           -- 점(.) 구분 표시경로 (예: sports.outdoor)
    logo_url        VARCHAR(500),
    vendor_id       VARCHAR(21),
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    brand_remark    VARCHAR(300),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (brand_id),
    UNIQUE (brand_code)
);

COMMENT ON TABLE  sy_brand               IS '브랜드';
COMMENT ON COLUMN sy_brand.brand_id      IS '브랜드ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_brand.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_brand.brand_code    IS '브랜드코드';
COMMENT ON COLUMN sy_brand.brand_nm      IS '브랜드명 (한글)';
COMMENT ON COLUMN sy_brand.brand_en_nm   IS '브랜드영문명';
COMMENT ON COLUMN sy_brand.disp_path     IS '점(.) 구분 표시경로 (트리 빌드용)';
COMMENT ON COLUMN sy_brand.logo_url      IS '로고URL';
COMMENT ON COLUMN sy_brand.vendor_id     IS '업체ID';
COMMENT ON COLUMN sy_brand.sort_ord      IS '정렬순서';
COMMENT ON COLUMN sy_brand.use_yn        IS '사용여부 Y/N';
COMMENT ON COLUMN sy_brand.brand_remark  IS '비고';
COMMENT ON COLUMN sy_brand.reg_by        IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_brand.reg_date      IS '등록일';
COMMENT ON COLUMN sy_brand.upd_by        IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_brand.upd_date      IS '수정일';

-- ============================================================
-- sy_vendor : 판매/배송업체 (사업체/법인)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS sy_vendor (
    vendor_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    vendor_no          VARCHAR(20)     NOT NULL,               -- 판매/배송업체등록번호 (123-45-67890)
    corp_no         VARCHAR(20),                            -- 법인등록번호 (선택)
    vendor_nm          VARCHAR(100)    NOT NULL,               -- 상호 / 회사명
    vendor_nm_en       VARCHAR(100),                           -- 영문 상호
    ceo_nm          VARCHAR(50),                            -- 대표자명
    vendor_type        VARCHAR(50),                            -- 업태 (예: 도소매)
    vendor_item        VARCHAR(100),                           -- 종목 (예: 의류, 잡화)
    vendor_class_cd    VARCHAR(20),                            -- 코드: VENDOR_CLASS (개인/법인/면세/간이)
    vendor_zip_code VARCHAR(10),
    vendor_addr     VARCHAR(200),
    vendor_addr_detail VARCHAR(200),
    vendor_phone    VARCHAR(20),
    vendor_fax      VARCHAR(20),
    vendor_email    VARCHAR(100),
    vendor_homepage VARCHAR(200),
    vendor_bank_nm  VARCHAR(50),                            -- 은행명
    vendor_bank_account VARCHAR(50),                            -- 계좌번호
    vendor_bank_holder VARCHAR(50),                            -- 예금주
    vendor_reg_url     VARCHAR(500),                           -- 판매/배송업체등록증 첨부 URL
    open_date       DATE,                                   -- 개업일자
    contract_date   DATE,                                   -- 계약일자
    vendor_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: VENDOR_STATUS (ACTIVE/SUSPENDED/TERMINATED)
    disp_path       VARCHAR(200),                           -- 점(.) 구분 표시경로
    vendor_remark   VARCHAR(500),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (vendor_id),
    UNIQUE (vendor_no)
);

COMMENT ON TABLE  sy_vendor                IS '판매/배송업체 (사업체/법인)';
COMMENT ON COLUMN sy_vendor.vendor_id         IS '판매/배송업체ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_vendor.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_vendor.vendor_no         IS '판매/배송업체등록번호';
COMMENT ON COLUMN sy_vendor.corp_no        IS '법인등록번호 (선택)';
COMMENT ON COLUMN sy_vendor.vendor_nm         IS '상호 / 회사명';
COMMENT ON COLUMN sy_vendor.vendor_nm_en      IS '영문 상호';
COMMENT ON COLUMN sy_vendor.ceo_nm         IS '대표자명';
COMMENT ON COLUMN sy_vendor.vendor_type       IS '업태';
COMMENT ON COLUMN sy_vendor.vendor_item       IS '종목';
COMMENT ON COLUMN sy_vendor.vendor_class_cd   IS '판매/배송업체구분 (코드: VENDOR_CLASS)';
COMMENT ON COLUMN sy_vendor.vendor_zip_code IS '우편번호';
COMMENT ON COLUMN sy_vendor.vendor_addr     IS '주소';
COMMENT ON COLUMN sy_vendor.vendor_addr_detail IS '상세주소';
COMMENT ON COLUMN sy_vendor.vendor_phone    IS '대표 전화';
COMMENT ON COLUMN sy_vendor.vendor_fax      IS '팩스';
COMMENT ON COLUMN sy_vendor.vendor_email    IS '대표 이메일';
COMMENT ON COLUMN sy_vendor.vendor_homepage IS '홈페이지';
COMMENT ON COLUMN sy_vendor.vendor_bank_nm  IS '은행명';
COMMENT ON COLUMN sy_vendor.vendor_bank_account IS '계좌번호';
COMMENT ON COLUMN sy_vendor.vendor_bank_holder IS '예금주';
COMMENT ON COLUMN sy_vendor.vendor_reg_url    IS '판매/배송업체등록증 첨부 URL';
COMMENT ON COLUMN sy_vendor.open_date      IS '개업일자';
COMMENT ON COLUMN sy_vendor.contract_date  IS '계약일자';
COMMENT ON COLUMN sy_vendor.vendor_status_cd IS '상태 (코드: VENDOR_STATUS)';
COMMENT ON COLUMN sy_vendor.disp_path      IS '점(.) 구분 표시경로';
COMMENT ON COLUMN sy_vendor.vendor_remark  IS '비고';
COMMENT ON COLUMN sy_vendor.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_vendor.reg_date       IS '등록일';
COMMENT ON COLUMN sy_vendor.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_vendor.upd_date       IS '수정일';

CREATE INDEX idx_sy_vendor_site   ON sy_vendor (site_id);
CREATE INDEX idx_sy_vendor_status ON sy_vendor (vendor_status_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_vendor.vendor_class_cd (판매/배송업체구분) : VENDOR_CLASS { INDIVIDUAL:개인사업자, CORPORATION:법인사업자, TAX_EXEMPT:면세사업자, SIMPLIFIED:간이과세자 }
-- [CODES] sy_vendor.vendor_status_cd (상태) : 업체상태 { ACTIVE:활성, REVIEWING:심사중, BLOCKED:정지 }

-- ============================================================
-- sy_vendor_brand : 판매/배송업체-브랜드 매핑
--   한 업체(sy_vendor)는 여러 브랜드(sy_brand)를 취급할 수 있고
--   한 브랜드는 여러 업체에 의해 공급될 수 있음 (N:N)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS sy_vendor_brand (
    vendor_brand_id VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    vendor_id       VARCHAR(21)     NOT NULL,               -- sy_vendor.vendor_id
    brand_id        VARCHAR(21)     NOT NULL,               -- sy_brand.brand_id
    is_main         CHAR(1)         DEFAULT 'N',            -- 대표 브랜드 여부 Y/N
    contract_cd     VARCHAR(20),                            -- 코드: VENDOR_BRAND_CONTRACT (직매입/위탁/제휴 등)
    start_date      DATE,                                   -- 계약 시작일
    end_date        DATE,                                   -- 계약 종료일
    commission_rate NUMERIC(5,2),                           -- 수수료율 (%)
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    vendor_brand_remark VARCHAR(500),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (vendor_brand_id),
    UNIQUE (vendor_id, brand_id)
);

COMMENT ON TABLE  sy_vendor_brand                 IS '판매/배송업체-브랜드 매핑';
COMMENT ON COLUMN sy_vendor_brand.vendor_brand_id IS '업체브랜드ID (PK)';
COMMENT ON COLUMN sy_vendor_brand.site_id         IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_vendor_brand.vendor_id       IS '업체ID (sy_vendor.vendor_id)';
COMMENT ON COLUMN sy_vendor_brand.brand_id        IS '브랜드ID (sy_brand.brand_id)';
COMMENT ON COLUMN sy_vendor_brand.is_main         IS '대표 브랜드 여부 Y/N';
COMMENT ON COLUMN sy_vendor_brand.contract_cd     IS '계약유형 (코드: VENDOR_BRAND_CONTRACT)';
COMMENT ON COLUMN sy_vendor_brand.start_date      IS '계약 시작일';
COMMENT ON COLUMN sy_vendor_brand.end_date        IS '계약 종료일';
COMMENT ON COLUMN sy_vendor_brand.commission_rate IS '수수료율 (%)';
COMMENT ON COLUMN sy_vendor_brand.sort_ord        IS '정렬순서';
COMMENT ON COLUMN sy_vendor_brand.use_yn          IS '사용여부 Y/N';
COMMENT ON COLUMN sy_vendor_brand.vendor_brand_remark IS '비고';
COMMENT ON COLUMN sy_vendor_brand.reg_by          IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_vendor_brand.reg_date        IS '등록일';
COMMENT ON COLUMN sy_vendor_brand.upd_by          IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_vendor_brand.upd_date        IS '수정일';

CREATE INDEX idx_sy_vendor_brand_vendor ON sy_vendor_brand (vendor_id);
CREATE INDEX idx_sy_vendor_brand_brand  ON sy_vendor_brand (brand_id);
CREATE INDEX idx_sy_vendor_brand_use    ON sy_vendor_brand (use_yn);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_vendor_brand.contract_cd (계약유형) : BRAND_CONTRACT { EXCLUSIVE:독점, NON_EXCLUSIVE:비독점, CONSIGN:위탁 }

-- ============================================================
-- sy_vendor_content : 판매/배송업체 콘텐츠 (회사소개/배너/약관/정책 등)
--   업체별 노출 콘텐츠를 유형별로 다건 관리
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS sy_vendor_content (
    vendor_content_id VARCHAR(21)     NOT NULL,
    site_id           VARCHAR(21),                            -- sy_site.site_id
    vendor_id         VARCHAR(21)     NOT NULL,               -- sy_vendor.vendor_id
    content_type_cd   VARCHAR(30)     NOT NULL,               -- 코드: VENDOR_CONTENT_TYPE (INTRO/BANNER/TERMS/POLICY/NOTICE/FAQ/GUIDE)
    vendor_content_title VARCHAR(200),
    vendor_content_subtitle VARCHAR(300),
    content_html      TEXT,                                   -- 본문 (HTML)
    thumb_url         VARCHAR(500),                           -- 썸네일 이미지
    image_url         VARCHAR(500),                           -- 대표 이미지
    link_url          VARCHAR(500),                           -- 링크 URL
    attach_grp_id     VARCHAR(21),                            -- sy_attach_grp.attach_grp_id
    lang_cd           VARCHAR(10)     DEFAULT 'ko',           -- 다국어 (ko/en/ja 등)
    start_date        TIMESTAMP,                              -- 노출 시작
    end_date          TIMESTAMP,                              -- 노출 종료
    sort_ord          INTEGER         DEFAULT 0,
    vendor_content_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: VENDOR_CONTENT_STATUS (DRAFT/ACTIVE/INACTIVE)
    use_yn            CHAR(1)         DEFAULT 'Y',
    view_count        INTEGER         DEFAULT 0,
    vendor_content_remark VARCHAR(500),
    reg_by            VARCHAR(16),
    reg_date          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(16),
    upd_date          TIMESTAMP,
    PRIMARY KEY (vendor_content_id)
);

COMMENT ON TABLE  sy_vendor_content                   IS '판매/배송업체 콘텐츠 (회사소개/배너/약관 등)';
COMMENT ON COLUMN sy_vendor_content.vendor_content_id IS '업체콘텐츠ID (PK)';
COMMENT ON COLUMN sy_vendor_content.site_id           IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_vendor_content.vendor_id         IS '업체ID (sy_vendor.vendor_id)';
COMMENT ON COLUMN sy_vendor_content.content_type_cd   IS '콘텐츠유형 (코드: VENDOR_CONTENT_TYPE)';
COMMENT ON COLUMN sy_vendor_content.vendor_content_title IS '제목';
COMMENT ON COLUMN sy_vendor_content.vendor_content_subtitle IS '부제';
COMMENT ON COLUMN sy_vendor_content.content_html      IS '본문 (HTML)';
COMMENT ON COLUMN sy_vendor_content.thumb_url         IS '썸네일 URL';
COMMENT ON COLUMN sy_vendor_content.image_url         IS '대표 이미지 URL';
COMMENT ON COLUMN sy_vendor_content.link_url          IS '링크 URL';
COMMENT ON COLUMN sy_vendor_content.attach_grp_id     IS '첨부파일그룹ID (sy_attach_grp.attach_grp_id)';
COMMENT ON COLUMN sy_vendor_content.lang_cd           IS '언어코드 (ko/en/ja)';
COMMENT ON COLUMN sy_vendor_content.start_date        IS '노출 시작일시';
COMMENT ON COLUMN sy_vendor_content.end_date          IS '노출 종료일시';
COMMENT ON COLUMN sy_vendor_content.sort_ord          IS '정렬순서';
COMMENT ON COLUMN sy_vendor_content.vendor_content_status_cd IS '상태 (코드: VENDOR_CONTENT_STATUS)';
COMMENT ON COLUMN sy_vendor_content.use_yn            IS '사용여부 Y/N';
COMMENT ON COLUMN sy_vendor_content.view_count        IS '조회수';
COMMENT ON COLUMN sy_vendor_content.vendor_content_remark IS '비고';
COMMENT ON COLUMN sy_vendor_content.reg_by            IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_vendor_content.reg_date          IS '등록일';
COMMENT ON COLUMN sy_vendor_content.upd_by            IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_vendor_content.upd_date          IS '수정일';

CREATE INDEX idx_sy_vendor_content_vendor ON sy_vendor_content (vendor_id);
CREATE INDEX idx_sy_vendor_content_type   ON sy_vendor_content (content_type_cd);
CREATE INDEX idx_sy_vendor_content_status ON sy_vendor_content (vendor_content_status_cd);
CREATE INDEX idx_sy_vendor_content_date   ON sy_vendor_content (start_date, end_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_vendor_content.content_type_cd (콘텐츠유형) : VENDOR_CONTENT_TYPE { INTRO:소개, POLICY:정책, NOTICE:공지 }
-- [CODES] sy_vendor_content.vendor_content_status_cd (상태) : VENDOR_CONTENT_STATUS { DRAFT:초안, ACTIVE:활성, INACTIVE:비활성 }

-- ============================================================
-- sy_vendor_user : 판매/배송업체 사용자 (판매/배송업체에 소속된 담당자/실무자)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 한 판매/배송업체(sy_vendor)는 여러 담당자를 가질 수 있고,
-- 한 담당자(user)는 sy_user 와 연결되어 로그인 가능 (선택)
-- 역할(role_id)는 sy_role 의 판매/배송업체 역할 트리에서 선택
-- ============================================================
CREATE TABLE IF NOT EXISTS sy_vendor_user (
    vendor_user_id  VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    vendor_id       VARCHAR(21)     NOT NULL,               -- sy_vendor.vendor_id
    user_id         VARCHAR(21),                            -- sy_user.user_id (NULL = 비로그인 단순 담당자)
    role_id         VARCHAR(21),                            -- sy_role.role_id (판매업체/배송업체 역할)
    member_nm       VARCHAR(50)     NOT NULL,               -- 이름
    position_cd     VARCHAR(20),                            -- 코드: POSITION (대표/이사/팀장/사원 등)
    vendor_user_dept_nm VARCHAR(100),                           -- 부서/팀명
    vendor_user_phone VARCHAR(20),                            -- 사무실 전화
    vendor_user_mobile VARCHAR(20)     NOT NULL,               -- 휴대전화
    vendor_user_email VARCHAR(100)    NOT NULL,               -- 이메일
    birth_date      DATE,                                   -- 생년월일
    is_main         CHAR(1)         DEFAULT 'N',            -- 대표 담당자 여부 Y/N
    auth_yn         CHAR(1)         DEFAULT 'N',            -- 업체 관리권한 여부 Y/N
    join_date       DATE,                                   -- 등록(합류) 일자
    leave_date      DATE,                                   -- 퇴직/탈퇴 일자
    vendor_user_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: VENDOR_MEMBER_STATUS (ACTIVE/LEFT/SUSPENDED)
    vendor_user_remark VARCHAR(500),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (vendor_user_id),
    UNIQUE (vendor_id, user_id)
);

COMMENT ON TABLE  sy_vendor_user                IS '판매/배송업체 사용자 (담당자/실무자)';
COMMENT ON COLUMN sy_vendor_user.vendor_user_id IS '판매/배송업체사용자ID (PK)';
COMMENT ON COLUMN sy_vendor_user.site_id        IS '사이트ID';
COMMENT ON COLUMN sy_vendor_user.vendor_id      IS '판매/배송업체ID (sy_vendor.vendor_id)';
COMMENT ON COLUMN sy_vendor_user.user_id        IS '사용자ID (sy_user.user_id, NULL=비로그인)';
COMMENT ON COLUMN sy_vendor_user.role_id        IS '역할ID (sy_role.role_id) - 판매업체/배송업체 역할 트리에서 선택';
COMMENT ON COLUMN sy_vendor_user.member_nm      IS '이름';
COMMENT ON COLUMN sy_vendor_user.position_cd    IS '직위/직책 (코드: POSITION)';
COMMENT ON COLUMN sy_vendor_user.vendor_user_dept_nm IS '부서/팀명';
COMMENT ON COLUMN sy_vendor_user.vendor_user_phone IS '사무실 전화';
COMMENT ON COLUMN sy_vendor_user.vendor_user_mobile IS '휴대전화';
COMMENT ON COLUMN sy_vendor_user.vendor_user_email IS '이메일';
COMMENT ON COLUMN sy_vendor_user.birth_date     IS '생년월일';
COMMENT ON COLUMN sy_vendor_user.is_main        IS '대표 담당자 여부 (업체당 1명 권장)';
COMMENT ON COLUMN sy_vendor_user.auth_yn        IS '업체 관리권한 여부 (Y=업체 정보 수정 가능)';
COMMENT ON COLUMN sy_vendor_user.join_date      IS '등록(합류) 일자';
COMMENT ON COLUMN sy_vendor_user.leave_date     IS '퇴직/탈퇴 일자';
COMMENT ON COLUMN sy_vendor_user.vendor_user_status_cd IS '상태 (코드: VENDOR_MEMBER_STATUS)';
COMMENT ON COLUMN sy_vendor_user.vendor_user_remark IS '비고';
COMMENT ON COLUMN sy_vendor_user.reg_by         IS '등록자';
COMMENT ON COLUMN sy_vendor_user.reg_date       IS '등록일';
COMMENT ON COLUMN sy_vendor_user.upd_by         IS '수정자';
COMMENT ON COLUMN sy_vendor_user.upd_date       IS '수정일';

CREATE INDEX idx_sy_vendor_user_vendor ON sy_vendor_user (vendor_id);
CREATE INDEX idx_sy_vendor_user_user   ON sy_vendor_user (user_id);
CREATE INDEX idx_sy_vendor_user_role   ON sy_vendor_user (role_id);
CREATE INDEX idx_sy_vendor_user_status ON sy_vendor_user (vendor_user_status_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_vendor_user.position_cd (직위/직책) : POSITION { CEO:대표, DIRECTOR:이사, MANAGER:담당자, EMPLOYEE:직원 }
-- [CODES] sy_vendor_user.vendor_user_status_cd (상태) : VENDOR_USER_STATUS { ACTIVE:재직, LEFT:퇴직, SUSPENDED:정지 }

-- ============================================================
-- sy_attach_grp : 첨부파일 그룹 / sy_attach : 첨부파일
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================

CREATE TABLE IF NOT EXISTS sy_attach_grp (
    attach_grp_id   VARCHAR(21)     NOT NULL,
    attach_grp_code VARCHAR(50)     NOT NULL,              -- 고유 코드 (PROD_IMG, MEMBER_DOC, INQUIRY_FILE 등)
    attach_grp_nm   VARCHAR(100)    NOT NULL,              -- 그룹명
    file_ext_allow  VARCHAR(200),                           -- 허용 확장자 (쉼표 구분: jpg,png,gif,pdf)
    max_file_size   BIGINT          DEFAULT 5242880,        -- 최대 파일 크기 (기본 5MB)
    max_file_count  INTEGER         DEFAULT 10,             -- 최대 파일 수
    storage_path    VARCHAR(300),                           -- 저장 경로 (예: /products/images, /members/documents)
    use_yn          CHAR(1)         DEFAULT 'Y',            -- 사용여부 Y/N
    sort_ord        INTEGER         DEFAULT 0,              -- 정렬순서
    attach_grp_remark VARCHAR(500),                            -- 비고/설명
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (attach_grp_id),
    UNIQUE (attach_grp_code)
);

COMMENT ON TABLE  sy_attach_grp              IS '첨부파일 그룹 (용도별 분류)';
COMMENT ON COLUMN sy_attach_grp.attach_grp_id IS '첨부파일그룹ID';
COMMENT ON COLUMN sy_attach_grp.attach_grp_code IS '그룹 고유 코드 (sy_attach의 외래키)';
COMMENT ON COLUMN sy_attach_grp.attach_grp_nm  IS '그룹명 (예: 상품 이미지, 회원 증명서)';
COMMENT ON COLUMN sy_attach_grp.file_ext_allow IS '허용 파일 확장자 (쉼표 구분, NULL=모든 확장자 허용)';
COMMENT ON COLUMN sy_attach_grp.max_file_size  IS '최대 파일 크기 (바이트, 기본 5MB=5242880)';
COMMENT ON COLUMN sy_attach_grp.max_file_count IS '최대 파일 개수 (기본 10개)';
COMMENT ON COLUMN sy_attach_grp.storage_path   IS '저장 경로 (예: /ec/products/images, /sy/members/docs)';
COMMENT ON COLUMN sy_attach_grp.use_yn         IS '사용여부 Y/N';
COMMENT ON COLUMN sy_attach_grp.sort_ord       IS '정렬순서';
COMMENT ON COLUMN sy_attach_grp.attach_grp_remark IS '비고 (용도 설명, 주의사항 등)';
COMMENT ON COLUMN sy_attach_grp.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_attach_grp.reg_date       IS '등록일';
COMMENT ON COLUMN sy_attach_grp.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_attach_grp.upd_date       IS '수정일';

-- 그룹 예시:
-- attach_grp_code='PROD_IMG', attach_grp_nm='상품 이미지', file_ext_allow='jpg,jpeg,png,gif', max_file_size=10485760 (10MB)
-- attach_grp_code='MEMBER_ID', attach_grp_nm='회원 신분증', file_ext_allow='jpg,png,pdf', max_file_size=5242880 (5MB)
-- attach_grp_code='INQUIRY_FILE', attach_grp_nm='고객문의 첨부', file_ext_allow='jpg,png,pdf,doc,docx,xls,xlsx', max_file_size=52428800 (50MB)
-- attach_grp_code='CLAIM_EVIDENCE', attach_grp_nm='클레임 증거', file_ext_allow='jpg,png,pdf,mp4,mov', max_file_size=104857600 (100MB)
-- attach_grp_code='DLIV_PROOF', attach_grp_nm='배송 증명', file_ext_allow='jpg,png,pdf', max_file_size=5242880 (5MB)

-- 첨부파일
CREATE TABLE IF NOT EXISTS sy_attach (
    attach_id       VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    attach_grp_id   VARCHAR(21)     NOT NULL,
    file_nm         VARCHAR(300)    NOT NULL,
    file_size       BIGINT          DEFAULT 0,              -- bytes
    file_ext        VARCHAR(20),
    mime_type_cd    VARCHAR(100),
    stored_nm       VARCHAR(300),                           -- 서버 저장 파일명
    attach_url      VARCHAR(500),                           -- 기본 저장소 접근 URL
    cdn_host        VARCHAR(100),                           -- CDN 호스트 (예: cdn.example.com)
    cdn_img_url     VARCHAR(500),                           -- CDN 원본 이미지 URL (없으면 attach_url 사용)
    cdn_thumb_url   VARCHAR(500),                           -- CDN 썸네일 URL (이미지 파일용)
    sort_ord        INTEGER         DEFAULT 0,
    attach_memo     VARCHAR(300),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (attach_id)
);

COMMENT ON TABLE  sy_attach                  IS '첨부파일';
COMMENT ON COLUMN sy_attach.attach_id        IS '첨부파일ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_attach.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_attach.attach_grp_id    IS '첨부그룹ID';
COMMENT ON COLUMN sy_attach.file_nm          IS '원본파일명';
COMMENT ON COLUMN sy_attach.file_size        IS '파일크기(bytes)';
COMMENT ON COLUMN sy_attach.file_ext         IS '확장자';
COMMENT ON COLUMN sy_attach.mime_type_cd     IS 'MIME 타입 (코드: MIME_TYPE)';
COMMENT ON COLUMN sy_attach.stored_nm        IS '저장 파일명 (UUID)';
COMMENT ON COLUMN sy_attach.attach_url       IS '기본 저장소 접근 URL';
COMMENT ON COLUMN sy_attach.cdn_host         IS 'CDN 호스트명 (예: cdn.example.com)';
COMMENT ON COLUMN sy_attach.cdn_img_url      IS 'CDN 원본 이미지 URL (NULL이면 attach_url 사용)';
COMMENT ON COLUMN sy_attach.cdn_thumb_url    IS 'CDN 썸네일 URL (이미지 파일, 목록/검색용)';
COMMENT ON COLUMN sy_attach.sort_ord         IS '정렬순서';
COMMENT ON COLUMN sy_attach.attach_memo      IS '메모';
COMMENT ON COLUMN sy_attach.reg_by           IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_attach.reg_date         IS '등록일';
COMMENT ON COLUMN sy_attach.upd_by           IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_attach.upd_date         IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_attach.mime_type_cd (MIME 타입) : MIME_TYPE { IMAGE:이미지, VIDEO:동영상, DOCUMENT:문서, TEXT:텍스트, APPLICATION:응용프로그램 }

-- ============================================================
-- sy_bbm : 게시판 마스터 (게시판 설정)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS sy_bbm (
    bbm_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    bbm_code        VARCHAR(50)     NOT NULL,
    bbm_nm          VARCHAR(100)    NOT NULL,
    disp_path       VARCHAR(200),                           -- 점(.) 구분 표시경로
    bbm_type_cd     VARCHAR(20)     DEFAULT 'NORMAL',       -- 코드: BBM_TYPE (NORMAL/FAQ/REVIEW/QNA)
    allow_comment   CHAR(1)         DEFAULT 'N',
    allow_attach    CHAR(1)         DEFAULT 'N',
    allow_like      CHAR(1)         DEFAULT 'N',
    content_type_cd VARCHAR(20)     DEFAULT 'TEXT',         -- 코드: BBM_CONTENT_TYPE (TEXT/HTML)
    scope_type_cd   VARCHAR(20)     DEFAULT 'ALL',          -- 코드: BBM_SCOPE_TYPE (ALL/MEMBER/ADMIN)
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    bbm_remark      VARCHAR(300),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (bbm_id),
    UNIQUE (bbm_code)
);

COMMENT ON TABLE  sy_bbm                  IS '게시판 마스터';
COMMENT ON COLUMN sy_bbm.bbm_id           IS '게시판ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_bbm.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_bbm.bbm_code         IS '게시판코드';
COMMENT ON COLUMN sy_bbm.bbm_nm           IS '게시판명';
COMMENT ON COLUMN sy_bbm.bbm_type_cd       IS '게시판유형 (코드: BBM_TYPE — NORMAL/FAQ/REVIEW/QNA)';
COMMENT ON COLUMN sy_bbm.allow_comment     IS '댓글허용 Y/N';
COMMENT ON COLUMN sy_bbm.allow_attach      IS '첨부허용 Y/N';
COMMENT ON COLUMN sy_bbm.allow_like        IS '좋아요허용 Y/N';
COMMENT ON COLUMN sy_bbm.content_type_cd   IS '내용유형 (코드: BBM_CONTENT_TYPE — TEXT/HTML)';
COMMENT ON COLUMN sy_bbm.scope_type_cd     IS '접근범위 (코드: BBM_SCOPE_TYPE — ALL/MEMBER/ADMIN)';
COMMENT ON COLUMN sy_bbm.sort_ord         IS '정렬순서';
COMMENT ON COLUMN sy_bbm.use_yn           IS '사용여부 Y/N';
COMMENT ON COLUMN sy_bbm.bbm_remark       IS '비고';
COMMENT ON COLUMN sy_bbm.reg_by           IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_bbm.reg_date         IS '등록일';
COMMENT ON COLUMN sy_bbm.upd_by           IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_bbm.upd_date         IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_bbm.bbm_type_cd (게시판유형) : BBM_TYPE { NORMAL:일반, NOTICE:공지, EVENT:이벤트, COOKIE:쿠키 }
-- [CODES] sy_bbm.content_type_cd (내용유형) : CONTENT_TYPE { TEXT:텍스트, HTML:HTML, IMAGE:이미지, VIDEO:동영상, MARKDOWN:마크다운 }
-- [CODES] sy_bbm.scope_type_cd (접근범위) : SCOPE_TYPE { ALL:전체, MEMBER:회원, ADMIN:관리자 }

-- ============================================================
-- sy_bbs : 게시물
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS sy_bbs (
    bbs_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    bbm_id          VARCHAR(21)     NOT NULL,
    parent_bbs_id   VARCHAR(21),                            -- 답글 시 부모글 ID
    member_id       VARCHAR(21),
    author_nm          VARCHAR(50),
    bbs_title       VARCHAR(200)    NOT NULL,
    content_html    TEXT,
    attach_grp_id   VARCHAR(21),
    view_count      INTEGER         DEFAULT 0,
    like_count      INTEGER         DEFAULT 0,
    comment_count   INTEGER         DEFAULT 0,
    is_fixed        CHAR(1)         DEFAULT 'N',
    bbs_status_cd   VARCHAR(20)     DEFAULT 'ACTIVE',       -- ACTIVE/DELETED/HIDDEN
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    disp_path       VARCHAR(200),                           -- 점(.) 구분 표시경로
    PRIMARY KEY (bbs_id)
);

COMMENT ON TABLE  sy_bbs                   IS '게시물';
COMMENT ON COLUMN sy_bbs.bbs_id            IS '게시물ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_bbs.site_id           IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_bbs.bbm_id            IS '게시판ID';
COMMENT ON COLUMN sy_bbs.parent_bbs_id     IS '부모게시물ID (답글)';
COMMENT ON COLUMN sy_bbs.member_id         IS '작성자 회원ID';
COMMENT ON COLUMN sy_bbs.author_nm            IS '작성자명';
COMMENT ON COLUMN sy_bbs.bbs_title         IS '제목';
COMMENT ON COLUMN sy_bbs.content_html      IS '내용 (HTML)';
COMMENT ON COLUMN sy_bbs.attach_grp_id     IS '첨부파일그룹ID';
COMMENT ON COLUMN sy_bbs.view_count        IS '조회수';
COMMENT ON COLUMN sy_bbs.like_count        IS '좋아요수';
COMMENT ON COLUMN sy_bbs.comment_count     IS '댓글수';
COMMENT ON COLUMN sy_bbs.is_fixed          IS '상단고정 Y/N';
COMMENT ON COLUMN sy_bbs.bbs_status_cd     IS '상태 (ACTIVE/DELETED/HIDDEN)';
COMMENT ON COLUMN sy_bbs.reg_by            IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_bbs.reg_date          IS '등록일';
COMMENT ON COLUMN sy_bbs.upd_by            IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_bbs.upd_date          IS '수정일';
COMMENT ON COLUMN sy_bbs.disp_path IS '점(.) 구분 표시경로 (트리 빌드용)';

-- ============================================================
-- sy_notice : 공지사항
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS sy_notice (
    notice_id       VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    notice_title    VARCHAR(200)    NOT NULL,
    notice_type_cd  VARCHAR(30),                            -- 코드: NOTICE_TYPE
    is_fixed        CHAR(1)         DEFAULT 'N',            -- 상단고정 Y/N
    content_html    TEXT,
    attach_grp_id   VARCHAR(21),
    start_date      TIMESTAMP,
    end_date        TIMESTAMP,
    notice_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- ACTIVE/INACTIVE
    view_count      INTEGER         DEFAULT 0,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (notice_id)
);

COMMENT ON TABLE  sy_notice               IS '공지사항';
COMMENT ON COLUMN sy_notice.notice_id     IS '공지ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_notice.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_notice.notice_title  IS '제목';
COMMENT ON COLUMN sy_notice.notice_type_cd IS '공지유형 (코드: NOTICE_TYPE)';
COMMENT ON COLUMN sy_notice.is_fixed      IS '상단고정 Y/N';
COMMENT ON COLUMN sy_notice.content_html  IS '내용 (HTML)';
COMMENT ON COLUMN sy_notice.attach_grp_id IS '첨부파일그룹ID';
COMMENT ON COLUMN sy_notice.start_date    IS '노출시작일';
COMMENT ON COLUMN sy_notice.end_date      IS '노출종료일';
COMMENT ON COLUMN sy_notice.notice_status_cd IS '상태 (ACTIVE/INACTIVE)';
COMMENT ON COLUMN sy_notice.view_count    IS '조회수';
COMMENT ON COLUMN sy_notice.reg_by        IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_notice.reg_date      IS '등록일';
COMMENT ON COLUMN sy_notice.upd_by        IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_notice.upd_date      IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_notice.notice_type_cd (공지유형) : 공지유형 { NORMAL:일반, URGENT:긴급 }

-- ============================================================
-- sy_template : 발송 템플릿 (이메일/SMS/PUSH/카카오)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS sy_template (
    template_id     VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    template_type_cd VARCHAR(20)    NOT NULL,               -- 코드: TEMPLATE_TYPE (EMAIL/SMS/PUSH/KAKAO)
    template_code   VARCHAR(50)     NOT NULL,
    template_nm     VARCHAR(100)    NOT NULL,
    template_subject VARCHAR(200),                           -- 이메일 제목
    template_content TEXT            NOT NULL,
    sample_params   TEXT,                                   -- 치환변수 예시 (JSON)
    use_yn          CHAR(1)         DEFAULT 'Y',
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    disp_path       VARCHAR(200),                           -- 점(.) 구분 표시경로
    PRIMARY KEY (template_id),
    UNIQUE (template_type_cd, template_code)
);

COMMENT ON TABLE  sy_template                IS '발송 템플릿';
COMMENT ON COLUMN sy_template.template_id    IS '템플릿ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_template.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_template.template_type_cd IS '템플릿유형 (코드: TEMPLATE_TYPE)';
COMMENT ON COLUMN sy_template.template_code  IS '템플릿코드';
COMMENT ON COLUMN sy_template.template_nm    IS '템플릿명';
COMMENT ON COLUMN sy_template.template_subject IS '제목 (이메일용)';
COMMENT ON COLUMN sy_template.template_content IS '내용 (치환변수 포함)';
COMMENT ON COLUMN sy_template.sample_params  IS '치환변수 예시 (JSON)';
COMMENT ON COLUMN sy_template.use_yn         IS '사용여부 Y/N';
COMMENT ON COLUMN sy_template.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_template.reg_date       IS '등록일';
COMMENT ON COLUMN sy_template.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_template.upd_date       IS '수정일';
COMMENT ON COLUMN sy_template.disp_path IS '점(.) 구분 표시경로 (트리 빌드용)';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_template.template_type_cd (템플릿유형) : 템플릿유형 { EMAIL:이메일, SMS:SMS, KAKAO:알림톡, PUSH:푸시 }

-- ============================================================
-- sy_alarm : 알림 / sy_alarm_send_hist : 알림 발송 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS sy_alarm (
    alarm_id         VARCHAR(21)     NOT NULL,
    site_id          VARCHAR(21),                            -- sy_site.site_id
    alarm_title      VARCHAR(200)    NOT NULL,
    alarm_type_cd    VARCHAR(30),                            -- 코드: ALARM_TYPE
    channel_cd       VARCHAR(20),                            -- 코드: ALARM_CHANNEL (EMAIL/SMS/PUSH/KAKAO)
    target_type_cd   VARCHAR(20),                            -- 코드: ALARM_TARGET_TYPE (ALL/GRADE/MEMBER)
    target_id        VARCHAR(21),                            -- 특정 회원 or 등급코드
    template_id      VARCHAR(21),
    alarm_msg        TEXT,
    alarm_send_date  TIMESTAMP,
    alarm_status_cd  VARCHAR(20)     DEFAULT 'PENDING',      -- PENDING/SENT/FAILED/CANCELLED
    alarm_send_count INTEGER         DEFAULT 0,
    alarm_fail_count INTEGER         DEFAULT 0,
    reg_by           VARCHAR(16),
    reg_date         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(16),
    upd_date         TIMESTAMP,
    disp_path        VARCHAR(200),                           -- 점(.) 구분 표시경로
    PRIMARY KEY (alarm_id)
);

COMMENT ON TABLE  sy_alarm                IS '알림';
COMMENT ON COLUMN sy_alarm.alarm_id       IS '알림ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_alarm.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_alarm.alarm_title    IS '알림제목';
COMMENT ON COLUMN sy_alarm.alarm_type_cd  IS '알림유형 (코드: ALARM_TYPE)';
COMMENT ON COLUMN sy_alarm.channel_cd     IS '발송채널 (코드: ALARM_CHANNEL)';
COMMENT ON COLUMN sy_alarm.target_type_cd IS '대상유형 (코드: ALARM_TARGET_TYPE — ALL/GRADE/MEMBER)';
COMMENT ON COLUMN sy_alarm.target_id      IS '대상ID (회원ID 또는 등급코드)';
COMMENT ON COLUMN sy_alarm.template_id    IS '템플릿ID';
COMMENT ON COLUMN sy_alarm.alarm_msg      IS '발송내용';
COMMENT ON COLUMN sy_alarm.alarm_send_date IS '발송예정일시';
COMMENT ON COLUMN sy_alarm.alarm_status_cd IS '발송상태 (PENDING/SENT/FAILED/CANCELLED)';
COMMENT ON COLUMN sy_alarm.alarm_send_count IS '발송성공수';
COMMENT ON COLUMN sy_alarm.alarm_fail_count IS '발송실패수';
COMMENT ON COLUMN sy_alarm.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_alarm.reg_date       IS '등록일';
COMMENT ON COLUMN sy_alarm.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_alarm.upd_date       IS '수정일';
COMMENT ON COLUMN sy_alarm.disp_path IS '점(.) 구분 표시경로 (트리 빌드용)';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_alarm.alarm_type_cd (알림유형) : 알림유형 { ORDER:주문, DELIVERY:배송, CLAIM:클레임, MARKETING:마케팅, SYSTEM:시스템 }
-- [CODES] sy_alarm.channel_cd (발송채널) : 알림채널 { EMAIL:이메일, SMS:SMS, KAKAO:알림톡, PUSH:푸시 }
-- [CODES] sy_alarm.target_type_cd (대상유형) : ALARM_TARGET_TYPE: MEMBER/VENDOR/ADMIN/ALL

-- ============================================================
-- sy_batch : 배치 / sy_batch_hist : 배치 실행 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS sy_batch (
    batch_id        VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    batch_code      VARCHAR(50)     NOT NULL,
    batch_nm        VARCHAR(100)    NOT NULL,
    batch_desc      TEXT,
    cron_expr       VARCHAR(100),                           -- cron 표현식 (예: 0 0 * * *)
    batch_cycle_cd  VARCHAR(20),                            -- 코드: BATCH_CYCLE
    batch_last_run  TIMESTAMP,
    batch_next_run  TIMESTAMP,
    batch_run_count INTEGER         DEFAULT 0,
    batch_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: BATCH_STATUS
    batch_run_status VARCHAR(20)     DEFAULT 'IDLE',         -- IDLE/RUNNING/SUCCESS/FAILED
    batch_timeout_sec INTEGER         DEFAULT 300,
    batch_memo      TEXT,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    disp_path       VARCHAR(200),                           -- 점(.) 구분 표시경로
    PRIMARY KEY (batch_id),
    UNIQUE (batch_code)
);

COMMENT ON TABLE  sy_batch                IS '배치 작업';
COMMENT ON COLUMN sy_batch.batch_id       IS '배치ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_batch.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_batch.batch_code     IS '배치코드';
COMMENT ON COLUMN sy_batch.batch_nm       IS '배치명';
COMMENT ON COLUMN sy_batch.batch_desc     IS '배치설명';
COMMENT ON COLUMN sy_batch.cron_expr      IS 'Cron 표현식';
COMMENT ON COLUMN sy_batch.batch_cycle_cd IS '주기유형 (코드: BATCH_CYCLE)';
COMMENT ON COLUMN sy_batch.batch_last_run IS '최근실행일시';
COMMENT ON COLUMN sy_batch.batch_next_run IS '다음실행예정일시';
COMMENT ON COLUMN sy_batch.batch_run_count IS '실행횟수';
COMMENT ON COLUMN sy_batch.batch_status_cd IS '활성상태 (코드: BATCH_STATUS)';
COMMENT ON COLUMN sy_batch.batch_run_status IS '실행상태 (IDLE/RUNNING/SUCCESS/FAILED)';
COMMENT ON COLUMN sy_batch.batch_timeout_sec IS '타임아웃(초)';
COMMENT ON COLUMN sy_batch.batch_memo      IS '메모';
COMMENT ON COLUMN sy_batch.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_batch.reg_date       IS '등록일';
COMMENT ON COLUMN sy_batch.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_batch.upd_date       IS '수정일';
COMMENT ON COLUMN sy_batch.disp_path IS '점(.) 구분 표시경로 (트리 빌드용)';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_batch.batch_cycle_cd (주기유형) : 배치주기 { MANUAL:수동, HOURLY:시간별, DAILY:일간, WEEKLY:주간, MONTHLY:월간 }
-- [CODES] sy_batch.batch_status_cd (활성상태) : 배치상태 { PENDING:대기, RUNNING:실행중, DONE:완료, FAILED:실패 }

-- ============================================================
-- sy_path : 경로 (업무별 트리)
-- ----------------------------------------------------
--  업무코드(biz_code = 테이블명) 별로 독립된 경로 트리를 관리.
--  각 노드는 parent_path_id 로 부모를 참조 (재귀 트리).
--
--  사용 예시:
--    biz_code='sy_brand'    → 브랜드 분류 트리
--    biz_code='sy_code_grp' → 공통코드그룹 분류 트리
--    biz_code='sy_prop'     → 프로퍼티 분류 트리
--    biz_code='ec_disp_*'   → 전시영역/패널 분류 트리
-- ============================================================
CREATE TABLE IF NOT EXISTS sy_path (
    path_id         BIGSERIAL       NOT NULL,
    biz_cd        VARCHAR(50)     NOT NULL,               -- 업무코드 (테이블명)
    parent_path_id  BIGINT,                                 -- 부모 경로ID (sy_path.path_id, 루트는 NULL)
    path_label      VARCHAR(200)    NOT NULL,               -- 경로 라벨 (한글 표시명)
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    path_remark     VARCHAR(500),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (path_id)
);

COMMENT ON TABLE  sy_path                IS '경로 (업무별 트리)';
COMMENT ON COLUMN sy_path.path_id        IS '경로ID (PK, auto)';
COMMENT ON COLUMN sy_path.biz_cd       IS '업무코드 (참조 테이블명, 예: sy_brand / sy_code_grp / sy_prop)';
COMMENT ON COLUMN sy_path.parent_path_id IS '부모 경로ID (sy_path.path_id, 루트는 NULL)';
COMMENT ON COLUMN sy_path.path_label     IS '경로 라벨 (한글 표시명)';
COMMENT ON COLUMN sy_path.sort_ord       IS '동일 부모 내 정렬순서';
COMMENT ON COLUMN sy_path.use_yn         IS '사용여부 Y/N';
COMMENT ON COLUMN sy_path.path_remark    IS '비고';
COMMENT ON COLUMN sy_path.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_path.reg_date       IS '등록일';
COMMENT ON COLUMN sy_path.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_path.upd_date       IS '수정일';

CREATE INDEX idx_sy_path_biz    ON sy_path (biz_cd);
CREATE INDEX idx_sy_path_parent ON sy_path (parent_path_id);

-- ============================================================
-- sy_contact : 고객문의 (1:1 문의)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS sy_contact (
    contact_id      VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    member_id       VARCHAR(21),
    member_nm       VARCHAR(50),
    category_cd     VARCHAR(30),                            -- 코드: 문의유형
    contact_title   VARCHAR(200)    NOT NULL,
    contact_content TEXT            NOT NULL,
    attach_grp_id   VARCHAR(21),
    contact_status_cd VARCHAR(20)     DEFAULT 'PENDING',      -- 코드: CONTACT_STATUS
    contact_answer  TEXT,
    answer_user_id       VARCHAR(21),
    answer_date     TIMESTAMP,
    contact_date    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (contact_id)
);

COMMENT ON TABLE  sy_contact                IS '고객문의';
COMMENT ON COLUMN sy_contact.contact_id     IS '문의ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_contact.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_contact.member_id      IS '회원ID';
COMMENT ON COLUMN sy_contact.member_nm      IS '문의자명';
COMMENT ON COLUMN sy_contact.category_cd    IS '문의유형';
COMMENT ON COLUMN sy_contact.contact_title  IS '제목';
COMMENT ON COLUMN sy_contact.contact_content IS '문의내용';
COMMENT ON COLUMN sy_contact.attach_grp_id  IS '첨부파일그룹ID';
COMMENT ON COLUMN sy_contact.contact_status_cd IS '처리상태 (코드: CONTACT_STATUS)';
COMMENT ON COLUMN sy_contact.contact_answer IS '답변내용';
COMMENT ON COLUMN sy_contact.answer_user_id      IS '답변자 (sy_user.user_id)';
COMMENT ON COLUMN sy_contact.answer_date    IS '답변일시';
COMMENT ON COLUMN sy_contact.contact_date   IS '문의일시';
COMMENT ON COLUMN sy_contact.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_contact.reg_date       IS '등록일';
COMMENT ON COLUMN sy_contact.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_contact.upd_date       IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_contact.contact_status_cd (처리상태) : 문의상태 { RECEIVED:접수, IN_PROGRESS:처리중, DONE:완료, ON_HOLD:보류 }

-- ============================================================
CREATE TABLE IF NOT EXISTS sy_voc (
    voc_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    voc_master_cd   VARCHAR(20)     NOT NULL,               -- VOC 마스터 분류 코드 (코드: VOC_MASTER)
    voc_detail_cd   VARCHAR(20)     NOT NULL,               -- VOC 세부 분류 코드 (코드: VOC_DETAIL)
    voc_nm          VARCHAR(100)    NOT NULL,               -- VOC 항목명
    voc_content     TEXT,                                   -- VOC 항목 설명
    use_yn          VARCHAR(1)      DEFAULT 'Y',
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (voc_id),
    UNIQUE (site_id, voc_master_cd, voc_detail_cd)
);

COMMENT ON TABLE sy_voc IS '고객의소리 VOC 분류';
COMMENT ON COLUMN sy_voc.voc_id        IS 'VOC분류ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_voc.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_voc.voc_master_cd IS 'VOC마스터코드 (코드: VOC_MASTER)';
COMMENT ON COLUMN sy_voc.voc_detail_cd IS 'VOC세부코드 (코드: VOC_DETAIL)';
COMMENT ON COLUMN sy_voc.voc_nm        IS 'VOC항목명';
COMMENT ON COLUMN sy_voc.voc_content   IS 'VOC항목설명';
COMMENT ON COLUMN sy_voc.use_yn        IS '사용여부 Y/N';
COMMENT ON COLUMN sy_voc.reg_by        IS '등록자ID';
COMMENT ON COLUMN sy_voc.reg_date      IS '등록일시';
COMMENT ON COLUMN sy_voc.upd_by        IS '수정자ID';
COMMENT ON COLUMN sy_voc.upd_date      IS '수정일시';

CREATE INDEX idx_sy_voc_site       ON sy_voc (site_id);
CREATE INDEX idx_sy_voc_master_cd  ON sy_voc (voc_master_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_voc.voc_master_cd (VOC마스터코드) : VOC_MASTER { DELIVERY:배송, PRODUCT:상품, PAYMENT:결제, CLAIM:클레임, SERVICE:서비스, ETC:기타 }
-- [CODES] sy_voc.voc_detail_cd (VOC세부코드) : VOC_DETAIL { DELIVERY_DELAY:배송지연, DELIVERY_LOST:배송분실, DELIVERY_DAMAGE:배송파손, PRODUCT_DEFECT:상품불량, PRODUCT_WRONG:상품오배송, PRODUCT_INFO:상품정보오류, PAYMENT_FAIL:결제실패, PAYMENT_REFUND:환불, CLAIM_CANCEL:취소클레임, CLAIM_RETURN:반품클레임, CLAIM_EXCHANGE:교환클레임, SERVICE_MEMBER:회원서비스, ETC:기타 }

-- ============================================================
-- sy_menu : 메뉴
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS sy_menu (
    menu_id         VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    menu_code       VARCHAR(50)     NOT NULL,
    menu_nm         VARCHAR(100)    NOT NULL,
    parent_menu_id       VARCHAR(21),
    menu_url        VARCHAR(200),
    menu_type_cd    VARCHAR(20)     DEFAULT 'PAGE',         -- 코드: MENU_TYPE (PAGE/FOLDER/LINK)
    icon_class      VARCHAR(100),
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    menu_remark     VARCHAR(300),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (menu_id),
    UNIQUE (menu_code)
);

COMMENT ON TABLE  sy_menu                IS '메뉴';
COMMENT ON COLUMN sy_menu.menu_id        IS '메뉴ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_menu.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_menu.menu_code      IS '메뉴코드';
COMMENT ON COLUMN sy_menu.menu_nm        IS '메뉴명';
COMMENT ON COLUMN sy_menu.parent_menu_id      IS '상위메뉴ID';
COMMENT ON COLUMN sy_menu.menu_url       IS '메뉴URL';
COMMENT ON COLUMN sy_menu.menu_type_cd   IS '메뉴유형 (코드: MENU_TYPE — PAGE/FOLDER/LINK)';
COMMENT ON COLUMN sy_menu.icon_class     IS '아이콘 CSS 클래스';
COMMENT ON COLUMN sy_menu.sort_ord       IS '정렬순서';
COMMENT ON COLUMN sy_menu.use_yn         IS '사용여부 Y/N';
COMMENT ON COLUMN sy_menu.menu_remark    IS '비고';
COMMENT ON COLUMN sy_menu.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_menu.reg_date       IS '등록일';
COMMENT ON COLUMN sy_menu.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_menu.upd_date       IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_menu.menu_type_cd (메뉴유형) : MENU_TYPE { PAGE:페이지, FOLDER:폴더, LINK:링크 }

-- ============================================================
-- sy_prop : 프로퍼티 (환경설정/공통 파라미터)
-- disp_path 는 점(.) 구분 표시경로 (예: 'site.email.smtp.host')
-- 좌측 트리 빌드 시 disp_path(표시경로) 의 점을 기준으로 계층 생성
-- ============================================================
CREATE TABLE IF NOT EXISTS sy_prop (
    prop_id         BIGSERIAL       NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id (NULL = 전역)
    disp_path       VARCHAR(200)    NOT NULL,               -- 점 구분 표시경로 (aa.bb.cc)
    prop_key        VARCHAR(100)    NOT NULL,               -- 키 (코드 식별자, snake_case 권장)
    prop_value      TEXT,                                   -- 값 (JSON/문자열/숫자 등)
    prop_label      VARCHAR(200)    NOT NULL,               -- 표시명
    prop_type_cd    VARCHAR(20)     DEFAULT 'STRING',       -- 코드: PROP_TYPE (STRING/NUMBER/BOOLEAN/JSON)
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    prop_remark     VARCHAR(500),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (prop_id),
    UNIQUE (site_id, disp_path, prop_key)                   -- 사이트 + 표시경로 + 키 조합 유일
);

COMMENT ON TABLE  sy_prop              IS '프로퍼티 (환경설정/공통 파라미터)';
COMMENT ON COLUMN sy_prop.prop_id      IS '프로퍼티ID (PK, auto)';
COMMENT ON COLUMN sy_prop.site_id      IS '사이트ID (sy_site.site_id, NULL=전역)';
COMMENT ON COLUMN sy_prop.disp_path    IS '점(.) 구분 표시경로 (aa.bb.cc)';
COMMENT ON COLUMN sy_prop.prop_key     IS '키 (코드 식별자)';
COMMENT ON COLUMN sy_prop.prop_value   IS '값';
COMMENT ON COLUMN sy_prop.prop_label   IS '표시명';
COMMENT ON COLUMN sy_prop.prop_type_cd IS '값 타입 (코드: PROP_TYPE — STRING/NUMBER/BOOLEAN/JSON)';
COMMENT ON COLUMN sy_prop.sort_ord     IS '같은 표시경로 내 정렬순서';
COMMENT ON COLUMN sy_prop.use_yn       IS '사용여부 Y/N';
COMMENT ON COLUMN sy_prop.prop_remark  IS '비고';

CREATE INDEX idx_sy_disp_path  ON sy_prop (disp_path);
CREATE INDEX idx_sy_prop_site  ON sy_prop (site_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_prop.prop_type_cd (값 타입) : PROP_TYPE { STRING:문자열, NUMBER:숫자, BOOLEAN:불리언, JSON:JSON }

-- 다국어 키 마스터
CREATE TABLE IF NOT EXISTS sy_i18n (
    i18n_id         VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id (NULL=전체 공용)
    i18n_key        VARCHAR(200)    NOT NULL,               -- 다국어 키 (예: common.bt.save)
    i18n_desc       VARCHAR(200),                           -- 키 설명
    i18n_scope_cd   VARCHAR(20)     DEFAULT 'COMMON',       -- 코드: I18N_SCOPE (FO/BO/COMMON)
    i18n_category   VARCHAR(50),                            -- 키 첫 세그먼트 (common/error/link 등)
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (i18n_id),
    UNIQUE (i18n_key, i18n_scope_cd)
);

COMMENT ON TABLE  sy_i18n                  IS '다국어 키 마스터';
COMMENT ON COLUMN sy_i18n.i18n_id          IS '다국어ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_i18n.site_id          IS '사이트ID (sy_site.site_id, NULL=전체 공용)';
COMMENT ON COLUMN sy_i18n.i18n_key         IS '다국어 키 (예: common.bt.save, error.FORBIDDEN)';
COMMENT ON COLUMN sy_i18n.i18n_desc        IS '키 설명 (번역자 참고용)';
COMMENT ON COLUMN sy_i18n.i18n_scope_cd    IS '적용범위 (코드: I18N_SCOPE — FO/BO/COMMON)';
COMMENT ON COLUMN sy_i18n.i18n_category    IS '키 첫 세그먼트 (common/error/link/paging 등)';
COMMENT ON COLUMN sy_i18n.sort_ord         IS '정렬순서';
COMMENT ON COLUMN sy_i18n.use_yn           IS '사용여부 Y/N';
COMMENT ON COLUMN sy_i18n.reg_by           IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN sy_i18n.reg_date         IS '등록일';
COMMENT ON COLUMN sy_i18n.upd_by           IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN sy_i18n.upd_date         IS '수정일';

CREATE INDEX idx_sy_i18n_scope    ON sy_i18n (i18n_scope_cd, use_yn);
CREATE INDEX idx_sy_i18n_category ON sy_i18n (i18n_category);
CREATE INDEX idx_sy_i18n_site     ON sy_i18n (site_id) WHERE site_id IS NOT NULL;

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_i18n.i18n_scope_cd (적용범위) : I18N_SCOPE: FO/BO/COMMON

-- 다국어 메시지 (언어별)
CREATE TABLE IF NOT EXISTS sy_i18n_msg (
    i18n_msg_id     VARCHAR(21)     NOT NULL,
    i18n_id         VARCHAR(21)     NOT NULL,               -- sy_i18n.i18n_id
    lang_cd         VARCHAR(10)     NOT NULL,               -- 코드: LANG_CODE (ko/en/ja/in)
    i18n_msg        TEXT            NOT NULL,               -- 번역 메시지
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (i18n_msg_id),
    UNIQUE (i18n_id, lang_cd),
    CONSTRAINT fk_sy_i18n_msg_i18n FOREIGN KEY (i18n_id) REFERENCES sy_i18n (i18n_id)
);

COMMENT ON TABLE  sy_i18n_msg              IS '다국어 메시지 (언어별)';
COMMENT ON COLUMN sy_i18n_msg.i18n_msg_id  IS '다국어 메시지ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_i18n_msg.i18n_id      IS '다국어ID (sy_i18n.i18n_id)';
COMMENT ON COLUMN sy_i18n_msg.lang_cd      IS '언어코드 (코드: LANG_CODE — ko/en/ja/in)';
COMMENT ON COLUMN sy_i18n_msg.i18n_msg     IS '번역 메시지 (플레이스홀더: {0},{1} 지원)';
COMMENT ON COLUMN sy_i18n_msg.reg_by       IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN sy_i18n_msg.reg_date     IS '등록일';
COMMENT ON COLUMN sy_i18n_msg.upd_by       IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN sy_i18n_msg.upd_date     IS '수정일';

CREATE INDEX idx_sy_i18n_msg_i18n ON sy_i18n_msg (i18n_id);
CREATE INDEX idx_sy_i18n_msg_lang ON sy_i18n_msg (lang_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_i18n_msg.lang_cd (언어코드) : LANG_CODE { ko:한국어, en:영어, ja:일본어, in:인도네시아어 }

-- 알림 발송 이력 (수신자별)
CREATE TABLE IF NOT EXISTS syh_alarm_send_hist (
    send_hist_id    VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    alarm_id        VARCHAR(21)     NOT NULL,
    member_id       VARCHAR(21),
    channel         VARCHAR(20),
    send_to         VARCHAR(200),                           -- 이메일 or 전화번호 or 토큰
    send_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    send_hist_status_cd VARCHAR(20)     DEFAULT 'SENT',         -- SENT/FAILED
    error_msg       VARCHAR(500),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (send_hist_id)
);

COMMENT ON TABLE  syh_alarm_send_hist                IS '알림 발송 이력';
COMMENT ON COLUMN syh_alarm_send_hist.send_hist_id   IS '발송이력ID';
COMMENT ON COLUMN syh_alarm_send_hist.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN syh_alarm_send_hist.alarm_id       IS '알림ID';
COMMENT ON COLUMN syh_alarm_send_hist.member_id      IS '수신자 회원ID';
COMMENT ON COLUMN syh_alarm_send_hist.channel        IS '발송채널';
COMMENT ON COLUMN syh_alarm_send_hist.send_to        IS '수신처 (이메일/전화/토큰)';
COMMENT ON COLUMN syh_alarm_send_hist.send_date      IS '발송일시';
COMMENT ON COLUMN syh_alarm_send_hist.send_hist_status_cd IS '발송결과 (SENT/FAILED)';
COMMENT ON COLUMN syh_alarm_send_hist.error_msg      IS '오류메시지';
COMMENT ON COLUMN syh_alarm_send_hist.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_alarm_send_hist.reg_date       IS '등록일';
COMMENT ON COLUMN syh_alarm_send_hist.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_alarm_send_hist.upd_date       IS '수정일';

-- ============================================================
-- syh_api_log : 외부 API 연동 로그
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 용도: PG사, 물류사, 카카오, 네이버 등 외부 API 호출 추적
-- ============================================================
CREATE TABLE IF NOT EXISTS syh_api_log (
    log_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),
    api_type_cd     VARCHAR(50)     NOT NULL,              -- 연동유형코드 (PG/LOGISTICS/KAKAO/NAVER/SMS 등)
    api_nm          VARCHAR(100),                          -- API명 (예: 결제승인, 운송장등록)
    method_cd       VARCHAR(10),                           -- HTTP 메서드 (GET/POST/PUT/DELETE)
    endpoint        VARCHAR(500),                          -- 호출 URL
    req_body        TEXT,                                  -- 요청 파라미터 (민감정보 마스킹)
    res_body        TEXT,                                  -- 응답 본문
    http_status     SMALLINT,                             -- HTTP 응답코드
    result_cd       VARCHAR(20)     DEFAULT 'SUCCESS',     -- SUCCESS/FAIL
    error_msg       VARCHAR(500),                          -- 오류 메시지
    elapsed_ms      INTEGER,                               -- 응답시간 (ms)
    ref_type_cd     VARCHAR(30),                           -- 연관유형코드 (ORDER/DLIV/PUSH 등)
    ref_id          VARCHAR(21),                           -- 연관ID
    call_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (log_id)
);

COMMENT ON TABLE  syh_api_log              IS '외부 API 연동 로그';
COMMENT ON COLUMN syh_api_log.log_id       IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN syh_api_log.site_id      IS '사이트ID';
COMMENT ON COLUMN syh_api_log.api_type_cd  IS '연동유형코드 (PG/LOGISTICS/KAKAO/NAVER/SMS 등)';
COMMENT ON COLUMN syh_api_log.api_nm       IS 'API명 (예: 결제승인)';
COMMENT ON COLUMN syh_api_log.method_cd    IS 'HTTP 메서드';
COMMENT ON COLUMN syh_api_log.endpoint     IS '호출 URL';
COMMENT ON COLUMN syh_api_log.req_body     IS '요청 파라미터 (민감정보 마스킹 처리)';
COMMENT ON COLUMN syh_api_log.res_body     IS '응답 본문';
COMMENT ON COLUMN syh_api_log.http_status  IS 'HTTP 응답코드';
COMMENT ON COLUMN syh_api_log.result_cd    IS '처리결과 (SUCCESS/FAIL)';
COMMENT ON COLUMN syh_api_log.error_msg    IS '오류 메시지';
COMMENT ON COLUMN syh_api_log.elapsed_ms   IS '응답시간 (밀리초)';
COMMENT ON COLUMN syh_api_log.ref_type_cd  IS '연관유형코드 (ORDER/DLIV/PUSH 등)';
COMMENT ON COLUMN syh_api_log.ref_id       IS '연관ID';
COMMENT ON COLUMN syh_api_log.call_date    IS 'API 호출일시';
COMMENT ON COLUMN syh_api_log.reg_by       IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_api_log.reg_date     IS '등록일';
COMMENT ON COLUMN syh_api_log.upd_by       IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_api_log.upd_date     IS '수정일';

CREATE INDEX idx_syh_api_log_type ON syh_api_log (api_type_cd, result_cd);
CREATE INDEX idx_syh_api_log_date ON syh_api_log (call_date);
CREATE INDEX idx_syh_api_log_ref  ON syh_api_log (ref_type_cd, ref_id);

-- 배치 실행 이력
CREATE TABLE IF NOT EXISTS syh_batch_hist (
    batch_hist_id   VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    batch_id        VARCHAR(21)     NOT NULL,
    batch_code      VARCHAR(50),
    batch_nm        VARCHAR(100),
    run_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    end_at          TIMESTAMP,
    duration_ms     INTEGER,                                -- 실행시간(ms)
    run_status      VARCHAR(20),                            -- SUCCESS/FAILED/TIMEOUT
    proc_count      INTEGER         DEFAULT 0,              -- 처리건수
    error_count     INTEGER         DEFAULT 0,
    message         TEXT,
    detail          TEXT,                                   -- 상세 로그 (JSON)
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (batch_hist_id)
);

COMMENT ON TABLE  syh_batch_hist               IS '배치 실행 이력';
COMMENT ON COLUMN syh_batch_hist.batch_hist_id IS '이력ID';
COMMENT ON COLUMN syh_batch_hist.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN syh_batch_hist.batch_id      IS '배치ID';
COMMENT ON COLUMN syh_batch_hist.batch_code    IS '배치코드';
COMMENT ON COLUMN syh_batch_hist.batch_nm      IS '배치명';
COMMENT ON COLUMN syh_batch_hist.run_at        IS '실행시작일시';
COMMENT ON COLUMN syh_batch_hist.end_at        IS '실행종료일시';
COMMENT ON COLUMN syh_batch_hist.duration_ms   IS '실행시간(ms)';
COMMENT ON COLUMN syh_batch_hist.run_status    IS '실행결과 (SUCCESS/FAILED/TIMEOUT)';
COMMENT ON COLUMN syh_batch_hist.proc_count    IS '처리건수';
COMMENT ON COLUMN syh_batch_hist.error_count   IS '오류건수';
COMMENT ON COLUMN syh_batch_hist.message       IS '결과메시지';
COMMENT ON COLUMN syh_batch_hist.detail        IS '상세로그 (JSON)';
COMMENT ON COLUMN syh_batch_hist.reg_by        IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_batch_hist.reg_date      IS '등록일';
COMMENT ON COLUMN syh_batch_hist.upd_by        IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_batch_hist.upd_date      IS '수정일';

-- 배치 실행 로그
CREATE TABLE IF NOT EXISTS syh_batch_log (
    batch_log_id    VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    batch_id        VARCHAR(21)     NOT NULL,
    batch_code      VARCHAR(50),
    batch_nm        VARCHAR(100),
    run_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    end_at          TIMESTAMP,
    duration_ms     INTEGER,                                -- 실행시간(ms)
    run_status      VARCHAR(20),                            -- SUCCESS/FAILED/TIMEOUT
    proc_count      INTEGER         DEFAULT 0,              -- 처리건수
    error_count     INTEGER         DEFAULT 0,
    message         TEXT,
    detail          TEXT,                                   -- 상세 로그 (JSON)
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (batch_log_id)
);

COMMENT ON TABLE  syh_batch_log               IS '배치 실행 로그';
COMMENT ON COLUMN syh_batch_log.batch_log_id  IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN syh_batch_log.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN syh_batch_log.batch_id      IS '배치ID';
COMMENT ON COLUMN syh_batch_log.batch_code    IS '배치코드';
COMMENT ON COLUMN syh_batch_log.batch_nm      IS '배치명';
COMMENT ON COLUMN syh_batch_log.run_at        IS '실행시작일시';
COMMENT ON COLUMN syh_batch_log.end_at        IS '실행종료일시';
COMMENT ON COLUMN syh_batch_log.duration_ms   IS '실행시간(ms)';
COMMENT ON COLUMN syh_batch_log.run_status    IS '실행결과 (SUCCESS/FAILED/TIMEOUT)';
COMMENT ON COLUMN syh_batch_log.proc_count    IS '처리건수';
COMMENT ON COLUMN syh_batch_log.error_count   IS '오류건수';
COMMENT ON COLUMN syh_batch_log.message       IS '결과메시지';
COMMENT ON COLUMN syh_batch_log.detail        IS '상세로그 (JSON)';
COMMENT ON COLUMN syh_batch_log.reg_by        IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_batch_log.reg_date      IS '등록일';
COMMENT ON COLUMN syh_batch_log.upd_by        IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_batch_log.upd_date      IS '수정일';

CREATE INDEX idx_syh_batch_log_batch  ON syh_batch_log (batch_id);
CREATE INDEX idx_syh_batch_log_date   ON syh_batch_log (run_at);
CREATE INDEX idx_syh_batch_log_status ON syh_batch_log (run_status);

-- ============================================================
-- syh_send_email_log : 이메일 발송 로그
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS syh_send_email_log (
    log_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    template_id     VARCHAR(21),                           -- sy_template.template_id
    template_code   VARCHAR(50),                           -- 템플릿코드 스냅샷
    member_id       VARCHAR(21),                           -- 대상 회원ID (ec_member.member_id, 비회원 NULL)
    user_id         VARCHAR(21),                           -- 대상 관리자ID (sy_user.user_id, 관리자 발송 시)
    from_addr       VARCHAR(200)    NOT NULL,              -- 발신 이메일
    to_addr         VARCHAR(200)    NOT NULL,              -- 수신 이메일
    cc_addr         VARCHAR(500),                          -- 참조 (복수 시 콤마 구분)
    bcc_addr        VARCHAR(500),                          -- 숨은참조
    subject         VARCHAR(300)    NOT NULL,              -- 발송 제목 (치환 완료본)
    content         TEXT,                                  -- 발송 본문 (치환 완료본 HTML)
    params          TEXT,                                  -- 치환 파라미터 JSON
    result_cd       VARCHAR(20)     DEFAULT 'SUCCESS',     -- 코드: SEND_RESULT (SUCCESS/FAIL/PENDING)
    fail_reason     VARCHAR(500),                          -- 실패 사유
    send_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    ref_type_cd     VARCHAR(30),                           -- 연관유형코드 (ORDER/CLAIM/JOIN/PWD_RESET 등)
    ref_id          VARCHAR(21),                           -- 연관ID
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (log_id)
);

COMMENT ON TABLE  syh_send_email_log               IS '이메일 발송 로그';
COMMENT ON COLUMN syh_send_email_log.log_id        IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN syh_send_email_log.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN syh_send_email_log.template_id   IS '템플릿ID (sy_template.template_id)';
COMMENT ON COLUMN syh_send_email_log.template_code IS '템플릿코드 스냅샷';
COMMENT ON COLUMN syh_send_email_log.member_id     IS '대상 회원ID (ec_member.member_id, 비회원 NULL)';
COMMENT ON COLUMN syh_send_email_log.user_id       IS '대상 관리자ID (sy_user.user_id, 관리자 발송 시)';
COMMENT ON COLUMN syh_send_email_log.from_addr     IS '발신 이메일';
COMMENT ON COLUMN syh_send_email_log.to_addr       IS '수신 이메일';
COMMENT ON COLUMN syh_send_email_log.cc_addr       IS '참조 이메일 (복수 시 콤마 구분)';
COMMENT ON COLUMN syh_send_email_log.bcc_addr      IS '숨은참조 이메일';
COMMENT ON COLUMN syh_send_email_log.subject       IS '발송 제목 (치환 완료본)';
COMMENT ON COLUMN syh_send_email_log.content       IS '발송 본문 (치환 완료본 HTML)';
COMMENT ON COLUMN syh_send_email_log.params        IS '치환 파라미터 JSON (예: {"order_no":"...","member_nm":"..."})';
COMMENT ON COLUMN syh_send_email_log.result_cd     IS '발송결과 (코드: SEND_RESULT)';
COMMENT ON COLUMN syh_send_email_log.fail_reason   IS '실패 사유';
COMMENT ON COLUMN syh_send_email_log.send_date     IS '발송일시';
COMMENT ON COLUMN syh_send_email_log.ref_type_cd   IS '연관유형코드 (ORDER/CLAIM/JOIN/PWD_RESET 등)';
COMMENT ON COLUMN syh_send_email_log.ref_id        IS '연관ID';
COMMENT ON COLUMN syh_send_email_log.reg_by        IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_send_email_log.reg_date      IS '등록일';
COMMENT ON COLUMN syh_send_email_log.upd_by        IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_send_email_log.upd_date      IS '수정일';

CREATE INDEX idx_syh_send_email_log_member   ON syh_send_email_log (member_id);
CREATE INDEX idx_syh_send_email_log_user     ON syh_send_email_log (user_id);
CREATE INDEX idx_syh_send_email_log_template ON syh_send_email_log (template_id);
CREATE INDEX idx_syh_send_email_log_date     ON syh_send_email_log (send_date);
CREATE INDEX idx_syh_send_email_log_ref      ON syh_send_email_log (ref_type_cd, ref_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] syh_send_email_log.result_cd (발송결과) : SEND_RESULT { SUCCESS:성공, FAILED:실패, PENDING:대기 }

-- ============================================================
-- syh_send_msg_log : 메시지 발송 로그 (SMS / LMS / 카카오 알림톡 / 앱 푸시)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS syh_send_msg_log (
    log_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    channel_cd      VARCHAR(20)     NOT NULL,              -- 코드: MSG_CHANNEL (SMS/LMS/MMS/KAKAO/APP)
    template_id     VARCHAR(21),                           -- sy_template.template_id
    template_code   VARCHAR(50),                           -- 템플릿코드 스냅샷
    member_id       VARCHAR(21),                           -- 대상 회원ID (ec_member.member_id, 비회원 NULL)
    user_id         VARCHAR(21),                           -- 대상 관리자ID (sy_user.user_id, 관리자 발송 시)
    recv_phone      VARCHAR(20),                           -- 수신 전화번호 (SMS/LMS/카카오)
    device_token    VARCHAR(300),                          -- 디바이스 토큰 (앱 푸시용)
    sender_phone    VARCHAR(20),                           -- 발신 번호 (SMS/LMS)
    title           VARCHAR(200),                          -- 제목 (LMS/앱 푸시용)
    content         TEXT,                                  -- 발송 내용 (치환 완료본)
    params          TEXT,                                  -- 치환 파라미터 JSON
    kakao_tpl_code  VARCHAR(50),                           -- 카카오 알림톡 템플릿 코드
    result_cd       VARCHAR(20)     DEFAULT 'SUCCESS',     -- 코드: SEND_RESULT (SUCCESS/FAIL/PENDING)
    result_msg      VARCHAR(200),                          -- 통신사/카카오 응답 메시지
    fail_reason     VARCHAR(500),                          -- 실패 사유
    send_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    ref_type_cd     VARCHAR(30),                           -- 연관유형코드 (ORDER/CLAIM/JOIN/AUTH 등)
    ref_id          VARCHAR(21),                           -- 연관ID
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (log_id)
);

COMMENT ON TABLE  syh_send_msg_log                IS '메시지 발송 로그 (SMS/카카오/앱푸시)';
COMMENT ON COLUMN syh_send_msg_log.log_id         IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN syh_send_msg_log.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN syh_send_msg_log.channel_cd     IS '발송채널 (코드: MSG_CHANNEL)';
COMMENT ON COLUMN syh_send_msg_log.template_id    IS '템플릿ID (sy_template.template_id)';
COMMENT ON COLUMN syh_send_msg_log.template_code  IS '템플릿코드 스냅샷';
COMMENT ON COLUMN syh_send_msg_log.member_id      IS '대상 회원ID (ec_member.member_id, 비회원 NULL)';
COMMENT ON COLUMN syh_send_msg_log.user_id        IS '대상 관리자ID (sy_user.user_id, 관리자 발송 시)';
COMMENT ON COLUMN syh_send_msg_log.recv_phone     IS '수신 전화번호 (SMS/LMS/카카오)';
COMMENT ON COLUMN syh_send_msg_log.device_token   IS '디바이스 토큰 (앱 푸시)';
COMMENT ON COLUMN syh_send_msg_log.sender_phone   IS '발신 번호 (SMS/LMS)';
COMMENT ON COLUMN syh_send_msg_log.title          IS '제목 (LMS/앱 푸시)';
COMMENT ON COLUMN syh_send_msg_log.content        IS '발송 내용 (치환 완료본)';
COMMENT ON COLUMN syh_send_msg_log.params         IS '치환 파라미터 JSON (예: {"order_no":"...","recv_nm":"..."})';
COMMENT ON COLUMN syh_send_msg_log.kakao_tpl_code IS '카카오 알림톡 템플릿 코드 (카카오 채널 시)';
COMMENT ON COLUMN syh_send_msg_log.result_cd      IS '발송결과 (코드: SEND_RESULT)';
COMMENT ON COLUMN syh_send_msg_log.result_msg     IS '통신사/카카오 응답 메시지';
COMMENT ON COLUMN syh_send_msg_log.fail_reason    IS '실패 사유';
COMMENT ON COLUMN syh_send_msg_log.send_date      IS '발송일시';
COMMENT ON COLUMN syh_send_msg_log.ref_type_cd    IS '연관유형코드 (ORDER/CLAIM/JOIN/AUTH 등)';
COMMENT ON COLUMN syh_send_msg_log.ref_id         IS '연관ID';
COMMENT ON COLUMN syh_send_msg_log.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_send_msg_log.reg_date       IS '등록일';
COMMENT ON COLUMN syh_send_msg_log.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_send_msg_log.upd_date       IS '수정일';

CREATE INDEX idx_syh_send_msg_log_member   ON syh_send_msg_log (member_id);
CREATE INDEX idx_syh_send_msg_log_user     ON syh_send_msg_log (user_id);
CREATE INDEX idx_syh_send_msg_log_template ON syh_send_msg_log (template_id);
CREATE INDEX idx_syh_send_msg_log_channel  ON syh_send_msg_log (channel_cd, result_cd);
CREATE INDEX idx_syh_send_msg_log_date     ON syh_send_msg_log (send_date);
CREATE INDEX idx_syh_send_msg_log_ref      ON syh_send_msg_log (ref_type_cd, ref_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] syh_send_msg_log.channel_cd (발송채널) : ALARM_CHANNEL { EMAIL:이메일, SMS:SMS, PUSH:푸시알림, KAKAO:카카오 }
-- [CODES] syh_send_msg_log.result_cd (발송결과) : SEND_RESULT { SUCCESS:성공, FAILED:실패, PENDING:대기 }

-- 관리자 로그인 이력
CREATE TABLE IF NOT EXISTS syh_user_login_hist (
    login_hist_id   VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    user_id         VARCHAR(21)     NOT NULL,
    login_date      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    ip              VARCHAR(50),
    device          VARCHAR(100),
    result_cd       VARCHAR(20)     DEFAULT 'SUCCESS',
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (login_hist_id)
);

COMMENT ON TABLE  syh_user_login_hist               IS '관리자 로그인 이력';
COMMENT ON COLUMN syh_user_login_hist.login_hist_id IS '로그인이력ID';
COMMENT ON COLUMN syh_user_login_hist.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN syh_user_login_hist.user_id       IS '사용자ID';
COMMENT ON COLUMN syh_user_login_hist.login_date    IS '로그인일시';
COMMENT ON COLUMN syh_user_login_hist.ip            IS 'IP주소';
COMMENT ON COLUMN syh_user_login_hist.device        IS '디바이스';
COMMENT ON COLUMN syh_user_login_hist.result_cd     IS '결과 (SUCCESS/FAIL)';
COMMENT ON COLUMN syh_user_login_hist.reg_by        IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_user_login_hist.reg_date      IS '등록일';
COMMENT ON COLUMN syh_user_login_hist.upd_by        IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_user_login_hist.upd_date      IS '수정일';

-- ============================================================
-- syh_user_login_log : 관리자 사용자 로그인 로그
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 보안 주의: access_token / refresh_token 은 SHA-256 해시값 저장 권장
-- ============================================================
CREATE TABLE IF NOT EXISTS syh_user_login_log (
    log_id              VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    user_id             VARCHAR(21),                           -- sy_user.user_id (실패 시 NULL 가능)
    login_id            VARCHAR(100),                          -- 입력한 로그인ID
    login_date          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    result_cd           VARCHAR(20)     DEFAULT 'SUCCESS',     -- 코드: LOGIN_RESULT (SUCCESS/FAIL_PWD/FAIL_LOCKED/FAIL_NOT_FOUND)
    fail_cnt            SMALLINT        DEFAULT 0,             -- 해당 시점 연속 실패 횟수
    ip                  VARCHAR(50),
    device              VARCHAR(200),                          -- User-Agent
    os                  VARCHAR(50),                           -- 파싱된 OS 정보
    browser             VARCHAR(50),                           -- 파싱된 브라우저 정보
    -- 로그인 성공 시 발급 토큰 정보 (실패 시 NULL)
    access_token        VARCHAR(512),                          -- 액세스 토큰 (SHA-256 해시 권장)
    access_token_exp    TIMESTAMP,                             -- 액세스 토큰 만료일시
    refresh_token       VARCHAR(512),                          -- 리프레시 토큰 (SHA-256 해시 권장)
    refresh_token_exp   TIMESTAMP,                             -- 리프레시 토큰 만료일시
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (log_id)
);

COMMENT ON TABLE  syh_user_login_log                   IS '관리자 사용자 로그인 로그';
COMMENT ON COLUMN syh_user_login_log.log_id            IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN syh_user_login_log.site_id           IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN syh_user_login_log.user_id           IS '사용자ID (로그인 실패 시 NULL)';
COMMENT ON COLUMN syh_user_login_log.login_id          IS '입력한 로그인ID';
COMMENT ON COLUMN syh_user_login_log.login_date        IS '로그인 시도일시';
COMMENT ON COLUMN syh_user_login_log.result_cd         IS '결과 (코드: LOGIN_RESULT)';
COMMENT ON COLUMN syh_user_login_log.fail_cnt          IS '해당 시점 연속 실패 횟수';
COMMENT ON COLUMN syh_user_login_log.ip                IS 'IP주소';
COMMENT ON COLUMN syh_user_login_log.device            IS 'User-Agent 전문';
COMMENT ON COLUMN syh_user_login_log.os                IS 'OS 정보';
COMMENT ON COLUMN syh_user_login_log.browser           IS '브라우저 정보';
COMMENT ON COLUMN syh_user_login_log.access_token      IS '액세스 토큰 (SHA-256 해시값 저장 권장, 로그인 실패 시 NULL)';
COMMENT ON COLUMN syh_user_login_log.access_token_exp  IS '액세스 토큰 만료일시';
COMMENT ON COLUMN syh_user_login_log.refresh_token     IS '리프레시 토큰 (SHA-256 해시값 저장 권장)';
COMMENT ON COLUMN syh_user_login_log.refresh_token_exp IS '리프레시 토큰 만료일시';
COMMENT ON COLUMN syh_user_login_log.reg_by            IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_user_login_log.reg_date          IS '등록일';
COMMENT ON COLUMN syh_user_login_log.upd_by            IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_user_login_log.upd_date          IS '수정일';

CREATE INDEX idx_syh_user_login_log_user  ON syh_user_login_log (user_id);
CREATE INDEX idx_syh_user_login_log_date  ON syh_user_login_log (login_date);
CREATE INDEX idx_syh_user_login_log_ip    ON syh_user_login_log (ip);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] syh_user_login_log.result_cd (결과) : LOGIN_RESULT { SUCCESS:성공, FAIL_PW:비밀번호오류, FAIL_LOCKED:잠금, FAIL_DORMANT:휴면, FAIL_WITHDRAWN:탈퇴 }

-- ============================================================
-- syh_user_token_log : 관리자 사용자 토큰 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 용도: 액세스/리프레시 토큰 발급·갱신·폐기 전 생애주기 추적
-- 보안 주의: token 컬럼은 SHA-256 해시값 저장 권장 (원문 저장 금지)
-- ============================================================
CREATE TABLE IF NOT EXISTS syh_user_token_log (
    log_id              VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    user_id             VARCHAR(21)     NOT NULL,              -- sy_user.user_id
    login_log_id        VARCHAR(21),                           -- sy_user_login_log.log_id (최초 발급 시점 연결)
    action_cd           VARCHAR(20)     NOT NULL,              -- 코드: TOKEN_ACTION (ISSUE/REFRESH/REVOKE/EXPIRE)
    token_type_cd       VARCHAR(20)     NOT NULL,              -- 코드: TOKEN_TYPE (ACCESS/REFRESH)
    token               VARCHAR(512)    NOT NULL,              -- 토큰 (SHA-256 해시값 저장 권장)
    token_exp           TIMESTAMP,                             -- 토큰 만료일시
    prev_token          VARCHAR(512),                          -- 갱신 전 토큰 해시 (REFRESH 액션 시)
    ip                  VARCHAR(50),
    device              VARCHAR(200),                          -- User-Agent
    revoke_reason       VARCHAR(200),                          -- 폐기 사유 (REVOKE 시: LOGOUT/FORCE/EXPIRED 등)
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (log_id)
);

COMMENT ON TABLE  syh_user_token_log                 IS '관리자 사용자 토큰 이력';
COMMENT ON COLUMN syh_user_token_log.log_id          IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN syh_user_token_log.site_id         IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN syh_user_token_log.user_id         IS '사용자ID (sy_user.user_id)';
COMMENT ON COLUMN syh_user_token_log.login_log_id    IS '최초 로그인 로그ID (sy_user_login_log.log_id)';
COMMENT ON COLUMN syh_user_token_log.action_cd       IS '토큰 액션 (코드: TOKEN_ACTION — ISSUE/REFRESH/REVOKE/EXPIRE)';
COMMENT ON COLUMN syh_user_token_log.token_type_cd   IS '토큰 유형 (코드: TOKEN_TYPE — ACCESS/REFRESH)';
COMMENT ON COLUMN syh_user_token_log.token           IS '토큰값 (SHA-256 해시 저장 권장)';
COMMENT ON COLUMN syh_user_token_log.token_exp       IS '토큰 만료일시';
COMMENT ON COLUMN syh_user_token_log.prev_token      IS '갱신 전 토큰 해시 (REFRESH 액션 시)';
COMMENT ON COLUMN syh_user_token_log.ip              IS 'IP주소';
COMMENT ON COLUMN syh_user_token_log.device          IS 'User-Agent';
COMMENT ON COLUMN syh_user_token_log.revoke_reason   IS '폐기 사유 (LOGOUT/FORCE/EXPIRED 등)';
COMMENT ON COLUMN syh_user_token_log.reg_by          IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_user_token_log.reg_date        IS '등록일';
COMMENT ON COLUMN syh_user_token_log.upd_by          IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_user_token_log.upd_date        IS '수정일';

CREATE INDEX idx_syh_user_token_log_user      ON syh_user_token_log (user_id);
CREATE INDEX idx_syh_user_token_log_action    ON syh_user_token_log (action_cd);
CREATE INDEX idx_syh_user_token_log_login_log ON syh_user_token_log (login_log_id);
CREATE INDEX idx_syh_user_token_log_date      ON syh_user_token_log (reg_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] syh_user_token_log.action_cd (토큰 액션) : TOKEN_ACTION { ISSUE:발급, REFRESH:갱신, EXPIRE:만료, REVOKE:폐기 }
-- [CODES] syh_user_token_log.token_type_cd (토큰 유형) : TOKEN_TYPE { ACCESS:액세스, REFRESH:갱신, TEMP:임시 }

-- ============================================================
-- [MB] 도메인
-- ============================================================

-- ============================================================
CREATE TABLE IF NOT EXISTS mb_member_grade (
    grade_id        VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    grade_cd        VARCHAR(20)     NOT NULL,               -- 코드: MEMBER_GRADE (BASIC/SILVER/GOLD/VIP)
    grade_nm        VARCHAR(50)     NOT NULL,
    grade_rank      INTEGER         DEFAULT 1,              -- 등급 우선순위 (낮을수록 낮은 등급)
    min_purchase_amt BIGINT         DEFAULT 0,              -- 등급 유지 최소 구매금액
    save_rate       DECIMAL(5,2)    DEFAULT 1.00,           -- 적립률 (%)
    use_yn          VARCHAR(1)      DEFAULT 'Y',
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (grade_id),
    UNIQUE (site_id, grade_cd)
);

COMMENT ON TABLE mb_member_grade IS '회원등급';
COMMENT ON COLUMN mb_member_grade.grade_id         IS '등급ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN mb_member_grade.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN mb_member_grade.grade_cd         IS '등급코드 (코드: MEMBER_GRADE)';
COMMENT ON COLUMN mb_member_grade.grade_nm         IS '등급명';
COMMENT ON COLUMN mb_member_grade.grade_rank       IS '등급우선순위 (낮을수록 낮은 등급)';
COMMENT ON COLUMN mb_member_grade.min_purchase_amt IS '등급 유지 최소 누적구매금액';
COMMENT ON COLUMN mb_member_grade.save_rate        IS '적립률 (%)';
COMMENT ON COLUMN mb_member_grade.use_yn           IS '사용여부 Y/N';
COMMENT ON COLUMN mb_member_grade.reg_by           IS '등록자ID';
COMMENT ON COLUMN mb_member_grade.reg_date         IS '등록일시';
COMMENT ON COLUMN mb_member_grade.upd_by           IS '수정자ID';
COMMENT ON COLUMN mb_member_grade.upd_date         IS '수정일시';

CREATE INDEX idx_mb_member_grade_site ON mb_member_grade (site_id);
CREATE INDEX idx_mb_member_grade_cd   ON mb_member_grade (grade_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] mb_member_grade.grade_cd (등급코드) : 회원등급 { VIP:VIP, GOLD:우수, NORMAL:일반 }

-- ============================================================
CREATE TABLE IF NOT EXISTS mb_member_group (
    group_id        VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    group_nm        VARCHAR(100)    NOT NULL,
    group_memo      TEXT,
    use_yn          VARCHAR(1)      DEFAULT 'Y',
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (group_id)
);

COMMENT ON TABLE mb_member_group IS '회원그룹';
COMMENT ON COLUMN mb_member_group.group_id   IS '그룹ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN mb_member_group.site_id    IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN mb_member_group.group_nm   IS '그룹명';
COMMENT ON COLUMN mb_member_group.group_memo IS '메모';
COMMENT ON COLUMN mb_member_group.use_yn     IS '사용여부 Y/N';
COMMENT ON COLUMN mb_member_group.reg_by     IS '등록자ID';
COMMENT ON COLUMN mb_member_group.reg_date   IS '등록일시';
COMMENT ON COLUMN mb_member_group.upd_by     IS '수정자ID';
COMMENT ON COLUMN mb_member_group.upd_date   IS '수정일시';

-- 회원-그룹 매핑
CREATE TABLE IF NOT EXISTS mb_member_group_map (
    group_id        VARCHAR(21)     NOT NULL,               -- mb_member_group.group_id
    member_id       VARCHAR(21)     NOT NULL,               -- mb_member.member_id
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, member_id)
);

COMMENT ON TABLE mb_member_group_map IS '회원그룹-회원 매핑';
COMMENT ON COLUMN mb_member_group_map.group_id   IS '그룹ID (mb_member_group.group_id)';
COMMENT ON COLUMN mb_member_group_map.member_id  IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN mb_member_group_map.reg_by     IS '등록자ID';
COMMENT ON COLUMN mb_member_group_map.reg_date   IS '등록일시';

CREATE INDEX idx_mb_member_group_site      ON mb_member_group (site_id);
CREATE INDEX idx_mb_member_group_map_mem   ON mb_member_group_map (member_id);

-- ============================================================
CREATE TABLE IF NOT EXISTS mb_member (
    member_id       VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    member_email    VARCHAR(100)    NOT NULL,
    member_password VARCHAR(255)    NOT NULL,
    member_nm       VARCHAR(50)     NOT NULL,
    member_phone    VARCHAR(20),
    member_gender   VARCHAR(1),                             -- M/F
    birth_date      DATE,
    grade_cd        VARCHAR(20)     DEFAULT 'BASIC',        -- 코드: MEMBER_GRADE
    member_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: MEMBER_STATUS
    member_status_cd_before VARCHAR(20),                    -- 변경 전 회원상태
    join_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    last_login      TIMESTAMP,
    order_count     INTEGER         DEFAULT 0,
    total_purchase_amt BIGINT       DEFAULT 0,
    cache_balance_amt  BIGINT       DEFAULT 0,
    member_zip_code VARCHAR(10),
    member_addr     VARCHAR(200),
    member_addr_detail VARCHAR(200),
    member_memo     TEXT,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (member_id),
    UNIQUE (member_email)
);

COMMENT ON TABLE mb_member IS '회원';
COMMENT ON COLUMN mb_member.member_id      IS '회원ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN mb_member.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN mb_member.member_email   IS '이메일 (로그인 ID)';
COMMENT ON COLUMN mb_member.member_password IS '비밀번호 (bcrypt)';
COMMENT ON COLUMN mb_member.member_nm      IS '회원명';
COMMENT ON COLUMN mb_member.member_phone   IS '연락처';
COMMENT ON COLUMN mb_member.member_gender  IS '성별 M/F';
COMMENT ON COLUMN mb_member.birth_date     IS '생년월일';
COMMENT ON COLUMN mb_member.grade_cd       IS '등급 (코드: MEMBER_GRADE)';
COMMENT ON COLUMN mb_member.member_status_cd IS '상태 (코드: MEMBER_STATUS)';
COMMENT ON COLUMN mb_member.member_status_cd_before IS '변경 전 회원상태 (코드: MEMBER_STATUS)';
COMMENT ON COLUMN mb_member.join_date      IS '가입일';
COMMENT ON COLUMN mb_member.last_login     IS '최근 로그인';
COMMENT ON COLUMN mb_member.order_count    IS '주문 건수';
COMMENT ON COLUMN mb_member.total_purchase_amt IS '누적 구매금액';
COMMENT ON COLUMN mb_member.cache_balance_amt  IS '적립금 잔액';
COMMENT ON COLUMN mb_member.member_zip_code IS '우편번호';
COMMENT ON COLUMN mb_member.member_addr    IS '주소';
COMMENT ON COLUMN mb_member.member_addr_detail IS '상세주소';
COMMENT ON COLUMN mb_member.member_memo    IS '메모';
COMMENT ON COLUMN mb_member.reg_by         IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN mb_member.reg_date       IS '등록일';
COMMENT ON COLUMN mb_member.upd_by         IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN mb_member.upd_date       IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] mb_member.grade_cd (등급) : 회원등급 { VIP:VIP, GOLD:우수, NORMAL:일반 }
-- [CODES] mb_member.member_status_cd (상태) : 회원상태 { ACTIVE:활성, BLOCKED:정지, WITHDRAWN:탈퇴 }

-- ============================================================
-- ec_member_addr : 회원 배송지 (복수 관리)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS mb_member_addr (
    addr_id         VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),
    member_id       VARCHAR(21)     NOT NULL,              -- mb_member.member_id
    addr_nm         VARCHAR(50),                           -- 배송지명 (예: 집, 회사)
    recv_nm         VARCHAR(50)     NOT NULL,              -- 수령자명
    recv_phone      VARCHAR(20)     NOT NULL,              -- 수령자 연락처
    zip_cd          VARCHAR(10),                           -- 우편번호
    addr            VARCHAR(200),                          -- 기본주소
    addr_detail     VARCHAR(200),                          -- 상세주소
    is_default      CHAR(1)         DEFAULT 'N',           -- 기본 배송지 여부 Y/N
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (addr_id)
);

COMMENT ON TABLE mb_member_addr IS '회원 배송지';
COMMENT ON COLUMN mb_member_addr.addr_id      IS '배송지ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN mb_member_addr.site_id      IS '사이트ID';
COMMENT ON COLUMN mb_member_addr.member_id    IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN mb_member_addr.addr_nm      IS '배송지명 (예: 집, 회사)';
COMMENT ON COLUMN mb_member_addr.recv_nm      IS '수령자명';
COMMENT ON COLUMN mb_member_addr.recv_phone   IS '수령자 연락처';
COMMENT ON COLUMN mb_member_addr.zip_cd       IS '우편번호';
COMMENT ON COLUMN mb_member_addr.addr         IS '기본주소';
COMMENT ON COLUMN mb_member_addr.addr_detail  IS '상세주소';
COMMENT ON COLUMN mb_member_addr.is_default   IS '기본배송지여부 Y/N';
COMMENT ON COLUMN mb_member_addr.reg_by       IS '등록자';
COMMENT ON COLUMN mb_member_addr.reg_date     IS '등록일';
COMMENT ON COLUMN mb_member_addr.upd_by       IS '수정자';
COMMENT ON COLUMN mb_member_addr.upd_date     IS '수정일';

CREATE INDEX idx_mb_member_addr_member ON mb_member_addr (member_id);

-- ============================================================
-- log 예외: 단일 단어 컬럼 허용 (device_token, os_type, site_id 예외)
CREATE TABLE IF NOT EXISTS mb_dvc_token (
    device_token    VARCHAR(200)    NOT NULL,               -- 앱 디바이스 토큰 값
    site_id         VARCHAR(21)     NOT NULL,               -- sy_site.site_id
    member_id       VARCHAR(21),                            -- mb_member.member_id
    os_type         VARCHAR(10),                            -- ANDROID / IOS
    benefit_noti_yn VARCHAR(1)      DEFAULT 'Y',            -- 혜택 알림 수신 여부
    alim_read_date  TIMESTAMP,                              -- 알림 리스트 읽음 일시
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_date        TIMESTAMP,
    PRIMARY KEY (device_token, site_id)
);

COMMENT ON TABLE mb_dvc_token IS '앱 디바이스 토큰';
COMMENT ON COLUMN mb_dvc_token.device_token    IS '디바이스 토큰 키';
COMMENT ON COLUMN mb_dvc_token.site_id         IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN mb_dvc_token.member_id       IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN mb_dvc_token.os_type         IS 'OS유형 ANDROID/IOS';
COMMENT ON COLUMN mb_dvc_token.benefit_noti_yn IS '혜택알림수신여부 Y/N';
COMMENT ON COLUMN mb_dvc_token.alim_read_date  IS '알림리스트 읽음일시';
COMMENT ON COLUMN mb_dvc_token.reg_date        IS '등록일시';
COMMENT ON COLUMN mb_dvc_token.upd_date        IS '수정일시';

CREATE INDEX idx_mb_dvc_token_member ON mb_dvc_token (member_id);
CREATE INDEX idx_mb_dvc_token_site   ON mb_dvc_token (site_id);

-- ============================================================
-- ec_like : 좋아요 (위시리스트)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS mb_like (
    like_id         VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    member_id       VARCHAR(21)     NOT NULL,               -- mb_member.member_id
    target_type_cd  VARCHAR(20)     NOT NULL,               -- 코드: LIKE_TARGET_TYPE (PRODUCT/BLOG/EVENT)
    target_id       VARCHAR(21)     NOT NULL,               -- 대상ID (pd_prod.prod_id 등)
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (like_id)
);

COMMENT ON TABLE mb_like IS '좋아요 (위시리스트)';
COMMENT ON COLUMN mb_like.like_id      IS '좋아요ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN mb_like.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN mb_like.member_id    IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN mb_like.target_type_cd IS '대상유형 (코드: LIKE_TARGET_TYPE — PRODUCT/BLOG/EVENT)';
COMMENT ON COLUMN mb_like.target_id    IS '대상ID';
COMMENT ON COLUMN mb_like.reg_by       IS '등록자';
COMMENT ON COLUMN mb_like.reg_date     IS '등록일';
COMMENT ON COLUMN mb_like.upd_by       IS '수정자';
COMMENT ON COLUMN mb_like.upd_date     IS '수정일';

CREATE UNIQUE INDEX idx_mb_like_unique ON mb_like (member_id, target_type_cd, target_id);
CREATE INDEX idx_mb_like_member        ON mb_like (member_id);
CREATE INDEX idx_mb_like_target        ON mb_like (target_type_cd, target_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] mb_like.target_type_cd (대상유형) : LIKE_TARGET_TYPE { PRODUCT:상품, BRAND:브랜드 }

-- ============================================================
CREATE TABLE IF NOT EXISTS mb_sns_member (
    sns_mem_id      VARCHAR(21)     NOT NULL,
    member_id       VARCHAR(21)     NOT NULL,               -- mb_member.member_id
    sns_channel_cd  VARCHAR(20)     NOT NULL,               -- 코드: SNS_CHANNEL (KAKAO/NAVER/GOOGLE/APPLE)
    sns_user_id     VARCHAR(200)    NOT NULL,               -- SNS 플랫폼 사용자 ID
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (sns_mem_id),
    UNIQUE (member_id, sns_channel_cd)
);

COMMENT ON TABLE mb_sns_member IS '회원 SNS 연동';
COMMENT ON COLUMN mb_sns_member.sns_mem_id    IS 'SNS연동ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN mb_sns_member.member_id     IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN mb_sns_member.sns_channel_cd IS 'SNS채널코드 (코드: SNS_CHANNEL)';
COMMENT ON COLUMN mb_sns_member.sns_user_id   IS 'SNS 플랫폼 사용자ID';
COMMENT ON COLUMN mb_sns_member.reg_by        IS '등록자ID';
COMMENT ON COLUMN mb_sns_member.reg_date      IS '등록일시';

CREATE INDEX idx_mb_sns_member_member  ON mb_sns_member (member_id);
CREATE INDEX idx_mb_sns_member_channel ON mb_sns_member (sns_channel_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] mb_sns_member.sns_channel_cd (SNS채널코드) : SNS_CHANNEL { KAKAO:카카오, NAVER:네이버, GOOGLE:구글, APPLE:애플 }

-- 로그인 이력
CREATE TABLE IF NOT EXISTS mbh_member_login_hist (
    login_hist_id   VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    member_id       VARCHAR(21)     NOT NULL,
    login_date      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    ip              VARCHAR(50),
    device          VARCHAR(100),
    result_cd       VARCHAR(20)     DEFAULT 'SUCCESS',      -- SUCCESS / FAIL
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (login_hist_id)
);

COMMENT ON TABLE mbh_member_login_hist IS '회원 로그인 이력';
COMMENT ON COLUMN mbh_member_login_hist.login_hist_id IS '로그인이력ID';
COMMENT ON COLUMN mbh_member_login_hist.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN mbh_member_login_hist.member_id     IS '회원ID';
COMMENT ON COLUMN mbh_member_login_hist.login_date    IS '로그인일시';
COMMENT ON COLUMN mbh_member_login_hist.ip            IS 'IP주소';
COMMENT ON COLUMN mbh_member_login_hist.device        IS '디바이스';
COMMENT ON COLUMN mbh_member_login_hist.result_cd     IS '결과 (SUCCESS/FAIL)';
COMMENT ON COLUMN mbh_member_login_hist.reg_by        IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN mbh_member_login_hist.reg_date      IS '등록일';
COMMENT ON COLUMN mbh_member_login_hist.upd_by        IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN mbh_member_login_hist.upd_date      IS '수정일';

-- ============================================================
-- ec_member_login_log : 회원 로그인 로그
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 보안 주의: access_token / refresh_token 은 SHA-256 해시값 저장 권장
-- ============================================================
CREATE TABLE IF NOT EXISTS mbh_member_login_log (
    log_id              VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    member_id           VARCHAR(21),                           -- mb_member.member_id (실패 시 NULL 가능)
    login_id            VARCHAR(100),                          -- 입력한 로그인ID (이메일)
    login_date          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    result_cd           VARCHAR(20)     DEFAULT 'SUCCESS',     -- 코드: LOGIN_RESULT (SUCCESS/FAIL_PWD/FAIL_LOCKED/FAIL_NOT_FOUND)
    fail_cnt            SMALLINT        DEFAULT 0,             -- 해당 시점 연속 실패 횟수
    ip                  VARCHAR(50),
    device              VARCHAR(200),                          -- User-Agent
    os                  VARCHAR(50),                           -- 파싱된 OS 정보
    browser             VARCHAR(50),                           -- 파싱된 브라우저 정보
    country             VARCHAR(10),                           -- 국가코드 (GeoIP)
    -- 로그인 성공 시 발급 토큰 정보 (실패 시 NULL)
    access_token        VARCHAR(512),                          -- 액세스 토큰 (SHA-256 해시 권장)
    access_token_exp    TIMESTAMP,                             -- 액세스 토큰 만료일시
    refresh_token       VARCHAR(512),                          -- 리프레시 토큰 (SHA-256 해시 권장)
    refresh_token_exp   TIMESTAMP,                             -- 리프레시 토큰 만료일시
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (log_id)
);

COMMENT ON TABLE mbh_member_login_log IS '회원 로그인 로그';
COMMENT ON COLUMN mbh_member_login_log.log_id            IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN mbh_member_login_log.site_id           IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN mbh_member_login_log.member_id         IS '회원ID (로그인 실패 시 NULL)';
COMMENT ON COLUMN mbh_member_login_log.login_id          IS '입력한 로그인ID (이메일)';
COMMENT ON COLUMN mbh_member_login_log.login_date        IS '로그인 시도일시';
COMMENT ON COLUMN mbh_member_login_log.result_cd         IS '결과 (코드: LOGIN_RESULT)';
COMMENT ON COLUMN mbh_member_login_log.fail_cnt          IS '해당 시점 연속 실패 횟수';
COMMENT ON COLUMN mbh_member_login_log.ip                IS 'IP주소';
COMMENT ON COLUMN mbh_member_login_log.device            IS 'User-Agent 전문';
COMMENT ON COLUMN mbh_member_login_log.os                IS 'OS 정보';
COMMENT ON COLUMN mbh_member_login_log.browser           IS '브라우저 정보';
COMMENT ON COLUMN mbh_member_login_log.country           IS '국가코드 (GeoIP)';
COMMENT ON COLUMN mbh_member_login_log.access_token      IS '액세스 토큰 (SHA-256 해시값 저장 권장, 로그인 실패 시 NULL)';
COMMENT ON COLUMN mbh_member_login_log.access_token_exp  IS '액세스 토큰 만료일시';
COMMENT ON COLUMN mbh_member_login_log.refresh_token     IS '리프레시 토큰 (SHA-256 해시값 저장 권장)';
COMMENT ON COLUMN mbh_member_login_log.refresh_token_exp IS '리프레시 토큰 만료일시';
COMMENT ON COLUMN mbh_member_login_log.reg_by            IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN mbh_member_login_log.reg_date          IS '등록일';
COMMENT ON COLUMN mbh_member_login_log.upd_by            IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN mbh_member_login_log.upd_date          IS '수정일';

CREATE INDEX idx_mbh_member_login_log_member ON mbh_member_login_log (member_id);
CREATE INDEX idx_mbh_member_login_log_date   ON mbh_member_login_log (login_date);
CREATE INDEX idx_mbh_member_login_log_ip     ON mbh_member_login_log (ip);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] mbh_member_login_log.result_cd (결과) : LOGIN_RESULT { SUCCESS:성공, FAIL_PW:비밀번호오류, FAIL_LOCKED:잠금, FAIL_DORMANT:휴면, FAIL_WITHDRAWN:탈퇴 }

-- ============================================================
-- ec_member_token_log : 회원 토큰 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 용도: 액세스/리프레시 토큰 발급·갱신·폐기 전 생애주기 추적
-- 보안 주의: token 컬럼은 SHA-256 해시값 저장 권장 (원문 저장 금지)
-- ============================================================
CREATE TABLE IF NOT EXISTS mbh_member_token_log (
    log_id              VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    member_id           VARCHAR(21)     NOT NULL,              -- mb_member.member_id
    login_log_id        VARCHAR(21),                           -- mb_member_login_log. (최초 발급 시점 연결)
    action_cd           VARCHAR(20)     NOT NULL,              -- 코드: TOKEN_ACTION (ISSUE/REFRESH/REVOKE/EXPIRE)
    token_type_cd       VARCHAR(20)     NOT NULL,              -- 코드: TOKEN_TYPE (ACCESS/REFRESH)
    token               VARCHAR(512)    NOT NULL,              -- 토큰 (SHA-256 해시값 저장 권장)
    token_exp           TIMESTAMP,                             -- 토큰 만료일시
    prev_token          VARCHAR(512),                          -- 갱신 전 토큰 해시 (REFRESH 액션 시)
    ip                  VARCHAR(50),
    device              VARCHAR(200),                          -- User-Agent
    revoke_reason       VARCHAR(200),                          -- 폐기 사유 (REVOKE 시: LOGOUT/FORCE/EXPIRED 등)
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (log_id)
);

COMMENT ON TABLE mbh_member_token_log IS '회원 토큰 이력';
COMMENT ON COLUMN mbh_member_token_log.log_id          IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN mbh_member_token_log.site_id         IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN mbh_member_token_log.member_id       IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN mbh_member_token_log.login_log_id    IS '최초 로그인 로그ID (mb_member_login_log.)';
COMMENT ON COLUMN mbh_member_token_log.action_cd       IS '토큰 액션 (코드: TOKEN_ACTION — ISSUE/REFRESH/REVOKE/EXPIRE)';
COMMENT ON COLUMN mbh_member_token_log.token_type_cd   IS '토큰 유형 (코드: TOKEN_TYPE — ACCESS/REFRESH)';
COMMENT ON COLUMN mbh_member_token_log.token           IS '토큰값 (SHA-256 해시 저장 권장)';
COMMENT ON COLUMN mbh_member_token_log.token_exp       IS '토큰 만료일시';
COMMENT ON COLUMN mbh_member_token_log.prev_token      IS '갱신 전 토큰 해시 (REFRESH 액션 시)';
COMMENT ON COLUMN mbh_member_token_log.ip              IS 'IP주소';
COMMENT ON COLUMN mbh_member_token_log.device          IS 'User-Agent';
COMMENT ON COLUMN mbh_member_token_log.revoke_reason   IS '폐기 사유 (LOGOUT/FORCE/EXPIRED 등)';
COMMENT ON COLUMN mbh_member_token_log.reg_by          IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN mbh_member_token_log.reg_date        IS '등록일';
COMMENT ON COLUMN mbh_member_token_log.upd_by          IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN mbh_member_token_log.upd_date        IS '수정일';

CREATE INDEX idx_mbh_member_token_log_member    ON mbh_member_token_log (member_id);
CREATE INDEX idx_mbh_member_token_log_action    ON mbh_member_token_log (action_cd);
CREATE INDEX idx_mbh_member_token_log_login_log ON mbh_member_token_log (login_log_id);
CREATE INDEX idx_mbh_member_token_log_date      ON mbh_member_token_log (reg_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] mbh_member_token_log.action_cd (토큰 액션) : TOKEN_ACTION { ISSUE:발급, REFRESH:갱신, EXPIRE:만료, REVOKE:폐기 }
-- [CODES] mbh_member_token_log.token_type_cd (토큰 유형) : TOKEN_TYPE { ACCESS:액세스, REFRESH:갱신, TEMP:임시 }

-- ============================================================
-- [PD] 도메인
-- ============================================================

-- ============================================================
-- ec_category : 카테고리
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pd_category (
    category_id     VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    parent_category_id       VARCHAR(21),
    category_nm     VARCHAR(100)    NOT NULL,
    category_depth  SMALLINT        DEFAULT 1,              -- 1: 대, 2: 중, 3: 소
    sort_ord        INTEGER         DEFAULT 0,
    category_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: USE_YN
    category_status_cd_before VARCHAR(20),                   -- 변경 전 카테고리상태
    img_url         VARCHAR(500),
    category_desc   TEXT,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (category_id)
);

COMMENT ON TABLE pd_category IS '카테고리';
COMMENT ON COLUMN pd_category.category_id   IS '카테고리ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_category.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_category.parent_category_id     IS '상위 카테고리ID';
COMMENT ON COLUMN pd_category.category_nm   IS '카테고리명';
COMMENT ON COLUMN pd_category.category_depth IS '깊이 (1:대/2:중/3:소)';
COMMENT ON COLUMN pd_category.sort_ord      IS '정렬순서';
COMMENT ON COLUMN pd_category.category_status_cd IS '상태 (코드: USE_YN)';
COMMENT ON COLUMN pd_category.category_status_cd_before IS '변경 전 카테고리상태 (코드: USE_YN)';
COMMENT ON COLUMN pd_category.img_url       IS '이미지URL';
COMMENT ON COLUMN pd_category.category_desc IS '설명';
COMMENT ON COLUMN pd_category.reg_by        IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_category.reg_date      IS '등록일';
COMMENT ON COLUMN pd_category.upd_by        IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_category.upd_date      IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pd_category.category_status_cd (상태) : 사용여부 { Y:사용, N:미사용 }

-- ============================================================
CREATE TABLE IF NOT EXISTS pd_dliv_tmplt (
    dliv_tmplt_id       VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    vendor_id           VARCHAR(21),                            -- sy_vendor.vendor_id
    dliv_tmplt_nm       VARCHAR(100)    NOT NULL,
    dliv_method_cd      VARCHAR(20),                            -- 코드: DLIV_METHOD (COURIER/DIRECT/PICKUP)
    dliv_pay_type_cd    VARCHAR(20),                            -- 코드: DLIV_PAY_TYPE (PREPAY/COD)
    dliv_courier_cd     VARCHAR(30),                            -- 배송 택배사 코드
    dliv_cost           BIGINT          DEFAULT 0,              -- 기본 배송비
    free_dliv_min_amt   BIGINT          DEFAULT 0,              -- 무료배송 최소 주문금액 (0=무조건 유료)
    island_extra_cost   BIGINT          DEFAULT 0,              -- 도서산간 추가배송비
    return_cost         BIGINT          DEFAULT 0,              -- 반품배송비 (편도)
    exchange_cost       BIGINT          DEFAULT 0,              -- 교환배송비 (왕복)
    return_courier_cd   VARCHAR(30),                            -- 반품 택배사 코드
    return_addr_zip     VARCHAR(10),                            -- 반품지 우편번호
    return_addr         VARCHAR(200),                           -- 반품지 주소
    return_addr_detail  VARCHAR(200),                           -- 반품지 상세주소
    return_tel_no       VARCHAR(20),                            -- 반품지 전화번호
    base_dliv_yn        VARCHAR(1)      DEFAULT 'N',            -- 기본 배송지 여부
    use_yn              VARCHAR(1)      DEFAULT 'Y',
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (dliv_tmplt_id)
);

COMMENT ON TABLE pd_dliv_tmplt IS '배송템플릿';
COMMENT ON COLUMN pd_dliv_tmplt.dliv_tmplt_id     IS '배송템플릿ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_dliv_tmplt.site_id           IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_dliv_tmplt.vendor_id         IS '업체ID (sy_vendor.vendor_id)';
COMMENT ON COLUMN pd_dliv_tmplt.dliv_tmplt_nm     IS '템플릿명';
COMMENT ON COLUMN pd_dliv_tmplt.dliv_method_cd    IS '배송방법코드 (코드: DLIV_METHOD)';
COMMENT ON COLUMN pd_dliv_tmplt.dliv_pay_type_cd  IS '배송비결제유형 (코드: DLIV_PAY_TYPE) PREPAY:선결제/COD:착불';
COMMENT ON COLUMN pd_dliv_tmplt.dliv_courier_cd   IS '배송 택배사 코드';
COMMENT ON COLUMN pd_dliv_tmplt.dliv_cost         IS '기본 배송비';
COMMENT ON COLUMN pd_dliv_tmplt.free_dliv_min_amt IS '무료배송 최소 주문금액';
COMMENT ON COLUMN pd_dliv_tmplt.island_extra_cost IS '도서산간 추가배송비';
COMMENT ON COLUMN pd_dliv_tmplt.return_cost       IS '반품배송비 (편도)';
COMMENT ON COLUMN pd_dliv_tmplt.exchange_cost     IS '교환배송비 (왕복=반품+재발송)';
COMMENT ON COLUMN pd_dliv_tmplt.return_courier_cd IS '반품 택배사 코드';
COMMENT ON COLUMN pd_dliv_tmplt.return_addr_zip   IS '반품지 우편번호';
COMMENT ON COLUMN pd_dliv_tmplt.return_addr       IS '반품지 주소';
COMMENT ON COLUMN pd_dliv_tmplt.return_addr_detail IS '반품지 상세주소';
COMMENT ON COLUMN pd_dliv_tmplt.return_tel_no     IS '반품지 전화번호';
COMMENT ON COLUMN pd_dliv_tmplt.base_dliv_yn      IS '기본배송지여부 Y/N';
COMMENT ON COLUMN pd_dliv_tmplt.use_yn            IS '사용여부 Y/N';
COMMENT ON COLUMN pd_dliv_tmplt.reg_by            IS '등록자ID';
COMMENT ON COLUMN pd_dliv_tmplt.reg_date          IS '등록일시';
COMMENT ON COLUMN pd_dliv_tmplt.upd_by            IS '수정자ID';
COMMENT ON COLUMN pd_dliv_tmplt.upd_date          IS '수정일시';

CREATE INDEX idx_pd_dliv_tmplt_vendor ON pd_dliv_tmplt (vendor_id);
CREATE INDEX idx_pd_dliv_tmplt_site   ON pd_dliv_tmplt (site_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pd_dliv_tmplt.dliv_method_cd (배송방법코드) : DLIV_METHOD { COURIER:택배, DIRECT:직접배송, PICKUP:방문수령, SAME_DAY:당일배송 }
-- [CODES] pd_dliv_tmplt.dliv_pay_type_cd (배송비결제유형 PREPAY:선결제/COD:착불) : DLIV_PAY_TYPE { PREPAY:선불, COD:착불 }

-- ============================================================
-- ec_tag : 태그
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pd_tag (
    tag_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    tag_nm          VARCHAR(100)    NOT NULL,
    tag_desc        VARCHAR(300),
    use_count       INTEGER         DEFAULT 0,              -- 사용 빈도
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (tag_id),
    UNIQUE (site_id, tag_nm)
);

COMMENT ON TABLE pd_tag IS '태그';
COMMENT ON COLUMN pd_tag.tag_id          IS '태그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_tag.site_id         IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_tag.tag_nm          IS '태그명';
COMMENT ON COLUMN pd_tag.tag_desc        IS '태그설명';
COMMENT ON COLUMN pd_tag.use_count       IS '사용 빈도';
COMMENT ON COLUMN pd_tag.sort_ord        IS '정렬순서';
COMMENT ON COLUMN pd_tag.use_yn          IS '사용여부 Y/N';
COMMENT ON COLUMN pd_tag.reg_by          IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_tag.reg_date        IS '등록일';
COMMENT ON COLUMN pd_tag.upd_by          IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_tag.upd_date        IS '수정일';

CREATE INDEX idx_pd_tag_nm ON pd_tag (tag_nm);

-- ============================================================
-- pd_prod : 상품
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pd_prod (
    prod_id         VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    category_id     VARCHAR(21),
    brand_id        VARCHAR(21),
    vendor_id       VARCHAR(21),
    md_user_id      VARCHAR(21),                            -- 담당MD (sy_user.user_id)
    prod_nm         VARCHAR(200)    NOT NULL,
    prod_type_cd    VARCHAR(20)     DEFAULT 'SINGLE',           -- 코드: PRODUCT_TYPE (SINGLE/GROUP/SET)
    prod_code       VARCHAR(50),
    list_price      BIGINT          DEFAULT 0,
    sale_price      BIGINT          DEFAULT 0,
    purchase_price  BIGINT,                                 -- 매입가(원가) — 내부 관리용
    margin_rate     DECIMAL(5,2),                           -- 마진율 (%) — 내부 관리용
    prod_stock      INTEGER         DEFAULT 0,
    prod_status_cd  VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: PRODUCT_STATUS
    prod_status_cd_before VARCHAR(20),                       -- 변경 전 상품상태
    thumbnail_url   VARCHAR(500),
    content_html    TEXT,
    weight          NUMERIC(10,2),
    size_info_cd    VARCHAR(100),                           -- 코드: PRODUCT_SIZE
    is_new          CHAR(1)         DEFAULT 'N',
    is_best         CHAR(1)         DEFAULT 'N',
    view_count      INTEGER         DEFAULT 0,
    sale_count      INTEGER         DEFAULT 0,
    -- 판매기간
    sale_start_date TIMESTAMP,                              -- 판매기간 시작 (NULL=즉시)
    sale_end_date   TIMESTAMP,                              -- 판매기간 종료 (NULL=무기한)
    -- 구매 제한
    min_buy_qty     INTEGER         DEFAULT 1,              -- 최소구매수량
    max_buy_qty     INTEGER,                                -- 최대구매수량 (NULL=무제한)
    day_max_buy_qty INTEGER,                                -- 1일 최대구매수량 (NULL=무제한)
    id_max_buy_qty  INTEGER,                                -- ID당 최대구매수량 (NULL=무제한)
    -- 성인/배송
    adlt_yn         CHAR(1)         DEFAULT 'N',            -- 성인상품 여부 Y/N
    same_day_dliv_yn CHAR(1)        DEFAULT 'N',            -- 당일배송여부 Y/N
    sold_out_yn     CHAR(1)         DEFAULT 'N',            -- 품절여부 Y/N
    dliv_tmplt_id   VARCHAR(21),                            -- 배송템플릿ID (pd_dliv_tmplt.dliv_tmplt_id)
    -- 혜택 적용 여부
    coupon_use_yn   CHAR(1)         DEFAULT 'Y',            -- 쿠폰 사용 가능 여부 Y/N
    save_use_yn     CHAR(1)         DEFAULT 'Y',            -- 적립금 사용 가능 여부 Y/N
    discnt_use_yn   CHAR(1)         DEFAULT 'Y',            -- 할인 적용 가능 여부 Y/N
    -- 홍보문구
    advrt_stmt      VARCHAR(500),                           -- 홍보문구
    advrt_start_date TIMESTAMP,                             -- 홍보문구 시작일시
    advrt_end_date  TIMESTAMP,                              -- 홍보문구 종료일시
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (prod_id)
);

COMMENT ON TABLE pd_prod IS '상품';
COMMENT ON COLUMN pd_prod.prod_id       IS '상품ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_prod.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_prod.category_id   IS '카테고리ID';
COMMENT ON COLUMN pd_prod.brand_id      IS '브랜드ID';
COMMENT ON COLUMN pd_prod.vendor_id     IS '업체ID';
COMMENT ON COLUMN pd_prod.md_user_id    IS '담당MD (sy_user.user_id) — 등록 시 본인 기본값, 변경 가능';
COMMENT ON COLUMN pd_prod.prod_nm       IS '상품명';
COMMENT ON COLUMN pd_prod.prod_type_cd  IS '상품유형 (코드: PRODUCT_TYPE — SINGLE/GROUP/SET)';
COMMENT ON COLUMN pd_prod.prod_code     IS '상품코드(SKU)';
COMMENT ON COLUMN pd_prod.list_price    IS '정가';
COMMENT ON COLUMN pd_prod.sale_price    IS '판매가';
COMMENT ON COLUMN pd_prod.purchase_price IS '매입가(원가) — 내부 관리용';
COMMENT ON COLUMN pd_prod.margin_rate   IS '마진율 (%) — 내부 관리용';
COMMENT ON COLUMN pd_prod.prod_stock    IS '재고수량';
COMMENT ON COLUMN pd_prod.prod_status_cd IS '상태 (코드: PRODUCT_STATUS)';
COMMENT ON COLUMN pd_prod.prod_status_cd_before IS '변경 전 상품상태 (코드: PRODUCT_STATUS)';
COMMENT ON COLUMN pd_prod.thumbnail_url IS '썸네일URL';
COMMENT ON COLUMN pd_prod.content_html  IS '상세설명 (HTML)';
COMMENT ON COLUMN pd_prod.weight        IS '무게(kg)';
COMMENT ON COLUMN pd_prod.size_info_cd  IS '사이즈 (코드: PRODUCT_SIZE)';
COMMENT ON COLUMN pd_prod.is_new        IS '신상품여부 Y/N';
COMMENT ON COLUMN pd_prod.is_best       IS '베스트여부 Y/N';
COMMENT ON COLUMN pd_prod.view_count    IS '조회수';
COMMENT ON COLUMN pd_prod.sale_count    IS '판매수';
COMMENT ON COLUMN pd_prod.sale_start_date IS '판매기간 시작 (NULL=즉시)';
COMMENT ON COLUMN pd_prod.sale_end_date IS '판매기간 종료 (NULL=무기한)';
COMMENT ON COLUMN pd_prod.min_buy_qty   IS '최소구매수량 (기본 1)';
COMMENT ON COLUMN pd_prod.max_buy_qty   IS '최대구매수량 (NULL=무제한)';
COMMENT ON COLUMN pd_prod.day_max_buy_qty IS '1일 최대구매수량 (NULL=무제한)';
COMMENT ON COLUMN pd_prod.id_max_buy_qty IS 'ID당 최대구매수량 (NULL=무제한)';
COMMENT ON COLUMN pd_prod.adlt_yn       IS '성인상품 여부 Y/N';
COMMENT ON COLUMN pd_prod.same_day_dliv_yn IS '당일배송여부 Y/N';
COMMENT ON COLUMN pd_prod.sold_out_yn   IS '품절여부 Y/N';
COMMENT ON COLUMN pd_prod.dliv_tmplt_id IS '배송템플릿ID (pd_dliv_tmplt.dliv_tmplt_id)';
COMMENT ON COLUMN pd_prod.coupon_use_yn IS '쿠폰 사용 가능 여부 Y/N';
COMMENT ON COLUMN pd_prod.save_use_yn   IS '적립금 사용 가능 여부 Y/N';
COMMENT ON COLUMN pd_prod.discnt_use_yn IS '할인 적용 가능 여부 Y/N';
COMMENT ON COLUMN pd_prod.advrt_stmt    IS '홍보문구 (500자 이내)';
COMMENT ON COLUMN pd_prod.advrt_start_date IS '홍보문구 시작일시';
COMMENT ON COLUMN pd_prod.advrt_end_date IS '홍보문구 종료일시';
COMMENT ON COLUMN pd_prod.reg_by        IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod.reg_date      IS '등록일';
COMMENT ON COLUMN pd_prod.upd_by        IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod.upd_date      IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pd_prod.prod_type_cd (상품유형) : PRODUCT_TYPE { SINGLE:단일상품, GROUP:그룹상품, SET:세트상품 }
-- [CODES] pd_prod.prod_status_cd (상태) : 상품상태 { ON_SALE:판매중, PREPARING:준비중, SOLD_OUT:품절, SUSPENDED:판매중지 }
-- [CODES] pd_prod.size_info_cd (사이즈) : 상품사이즈 { FREE:FREE, XS:XS, S:S, M:M, L:L, XL:XL, XXL:XXL }

-- 상품 이미지 (다중)
-- opt_item_id_1 만 있으면 해당 색상 공통, opt_item_id_2 도 있으면 특정 사이즈 전용
-- 둘 다 NULL이면 상품 대표(공통) 이미지
-- attach_id: 파일 관리 시스템(sy_attach)과 연계 시 사용
CREATE TABLE IF NOT EXISTS pd_prod_img (
    prod_img_id     VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    prod_id         VARCHAR(21)     NOT NULL,              -- FK: pd_prod.prod_id
    opt_item_id_1   VARCHAR(21),                            -- 옵션1 값ID (pd_prod_opt_item.opt_item_id, 예: 색상-블랙)
    opt_item_id_2   VARCHAR(21),                            -- 옵션2 값ID (pd_prod_opt_item.opt_item_id, 예: 사이즈-M)
    attach_id       VARCHAR(21),                            -- FK: sy_attach.attach_id (원본 파일 참조)
    cdn_host        VARCHAR(100),                           -- CDN 호스트명 (예: cdn.example.com)
    cdn_img_url     VARCHAR(500),                           -- CDN 원본 이미지 URL (상세 페이지용)
    cdn_thumb_url   VARCHAR(500),                           -- CDN 썸네일 이미지 URL (목록/검색/카테고리용)
    img_alt_text    VARCHAR(200),                           -- 이미지 대체텍스트 (SEO/접근성)
    sort_ord        INTEGER         DEFAULT 0,              -- 정렬순서
    is_thumb        CHAR(1)         DEFAULT 'N',            -- 대표이미지여부 Y/N
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (prod_img_id)
);

COMMENT ON TABLE pd_prod_img IS '상품 이미지';
COMMENT ON COLUMN pd_prod_img.prod_img_id    IS '상품이미지ID';
COMMENT ON COLUMN pd_prod_img.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_prod_img.prod_id        IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pd_prod_img.opt_item_id_1  IS '옵션1 값ID (pd_prod_opt_item.opt_item_id, 색상 등, NULL이면 공통 이미지)';
COMMENT ON COLUMN pd_prod_img.opt_item_id_2  IS '옵션2 값ID (pd_prod_opt_item.opt_item_id, 사이즈 등, NULL이면 색상 공통)';
COMMENT ON COLUMN pd_prod_img.attach_id      IS '첨부파일ID (sy_attach.attach_id, 원본 파일 보관용)';
COMMENT ON COLUMN pd_prod_img.cdn_host       IS 'CDN 호스트명 (예: cdn.example.com, 원본 시점의 CDN)';
COMMENT ON COLUMN pd_prod_img.cdn_img_url    IS 'CDN 원본 이미지 URL (상세 페이지용, sy_attach 기준)';
COMMENT ON COLUMN pd_prod_img.cdn_thumb_url  IS 'CDN 썸네일 URL (목록/검색/카테고리용, sy_attach 기준)';
COMMENT ON COLUMN pd_prod_img.img_alt_text   IS '이미지 대체텍스트 (alt 속성, SEO/접근성)';
COMMENT ON COLUMN pd_prod_img.sort_ord       IS '정렬순서';
COMMENT ON COLUMN pd_prod_img.is_thumb       IS '대표이미지여부 Y/N';
COMMENT ON COLUMN pd_prod_img.reg_by         IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_img.reg_date       IS '등록일';
COMMENT ON COLUMN pd_prod_img.upd_by         IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_img.upd_date       IS '수정일';

CREATE INDEX idx_pd_prod_img_opt ON pd_prod_img (prod_id, opt_item_id_1, opt_item_id_2);

CREATE TABLE IF NOT EXISTS pd_prod_sku (
    sku_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    prod_id         VARCHAR(21)     NOT NULL,
    opt_item_id_1   VARCHAR(21),                            -- 옵션1 값ID (예: 색상-블랙)
    opt_item_id_2   VARCHAR(21),                            -- 옵션2 값ID (예: 사이즈-M)
    sku_code        VARCHAR(50),                            -- 자체 SKU 코드
    add_price       BIGINT          DEFAULT 0,              -- 옵션 추가금액
    prod_opt_stock  INTEGER         DEFAULT 0,              -- 옵션 조합별 재고
    use_yn          CHAR(1)         DEFAULT 'Y',
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (sku_id)
);

COMMENT ON TABLE pd_prod_sku IS '상품 옵션 SKU (조합별 재고/가격)';
COMMENT ON COLUMN pd_prod_sku.sku_id         IS 'SKU ID';
COMMENT ON COLUMN pd_prod_sku.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_prod_sku.prod_id        IS '상품ID';
COMMENT ON COLUMN pd_prod_sku.opt_item_id_1  IS '옵션1 값ID (pd_prod_opt_item.opt_item_id)';
COMMENT ON COLUMN pd_prod_sku.opt_item_id_2  IS '옵션2 값ID (pd_prod_opt_item.opt_item_id)';
COMMENT ON COLUMN pd_prod_sku.sku_code       IS '자체 SKU 코드';
COMMENT ON COLUMN pd_prod_sku.add_price      IS '옵션 추가금액 (기본가 대비)';
COMMENT ON COLUMN pd_prod_sku.prod_opt_stock IS '해당 옵션 조합 재고수량';
COMMENT ON COLUMN pd_prod_sku.use_yn         IS '사용여부 Y/N';
COMMENT ON COLUMN pd_prod_sku.reg_by         IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_sku.reg_date       IS '등록일';
COMMENT ON COLUMN pd_prod_sku.upd_by         IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_sku.upd_date       IS '수정일';

-- 관련 이력 테이블:
-- pdh_prod_sku_price_hist : 가격 변경 이력 (add_price_before/after BIGINT)
-- pdh_prod_sku_stock_hist : 재고 변경 이력 (stock_before/after INT, chg_qty, chg_reason_cd)
-- pdh_prod_sku_chg_hist   : 상태 변경 이력 (use_yn 등)

-- ============================================================
-- 데이터 예제 (상품 P001 — 티셔츠, 색상 3 × 사이즈 3 = SKU 9개)
-- pd_prod_opt_item: ITEM001=블랙, ITEM002=화이트, ITEM003=딥네이비
--                   ITEM004=S,    ITEM005=M,       ITEM006=L
-- ============================================================
-- prod_id='P001'
--   ├─ opt_item_id_1='ITEM001' (블랙, add_price=0)
--   │   ├─ sku_id='SKU001', opt_item_id_2='ITEM004' (S), sku_code='TS-BLACK-S',  stock=20
--   │   ├─ sku_id='SKU002', opt_item_id_2='ITEM005' (M), sku_code='TS-BLACK-M',  stock=30
--   │   └─ sku_id='SKU003', opt_item_id_2='ITEM006' (L), sku_code='TS-BLACK-L',  stock=15
--   ├─ opt_item_id_1='ITEM002' (화이트, add_price=0)
--   │   ├─ sku_id='SKU004', opt_item_id_2='ITEM004' (S), sku_code='TS-WHITE-S',  stock=10
--   │   ├─ sku_id='SKU005', opt_item_id_2='ITEM005' (M), sku_code='TS-WHITE-M',  stock=25
--   │   └─ sku_id='SKU006', opt_item_id_2='ITEM006' (L), sku_code='TS-WHITE-L',  stock=8
--   └─ opt_item_id_1='ITEM003' (딥네이비, add_price=+2,000)
--       ├─ sku_id='SKU007', opt_item_id_2='ITEM004' (S), sku_code='TS-DNAVY-S',  stock=5
--       ├─ sku_id='SKU008', opt_item_id_2='ITEM005' (M), sku_code='TS-DNAVY-M',  stock=12
--       └─ sku_id='SKU009', opt_item_id_2='ITEM006' (L), sku_code='TS-DNAVY-L',  stock=7

CREATE TABLE IF NOT EXISTS pd_prod_opt (
    opt_id            VARCHAR(21)     NOT NULL,
    site_id           VARCHAR(21),                            -- sy_site.site_id
    prod_id           VARCHAR(21)     NOT NULL,
    opt_grp_nm        VARCHAR(50)     NOT NULL,               -- 예: 색상, 사이즈
    opt_level         INTEGER         NOT NULL DEFAULT 1,     -- 옵션 차원 순서 (1=첫번째, 2=두번째)
    opt_type_cd       VARCHAR(20),                            -- 코드: OPT_TYPE (COLOR/SIZE/MATERIAL/CUSTOM)
    opt_input_type_cd VARCHAR(20)     DEFAULT 'SELECT',       -- 코드: OPT_INPUT_TYPE (SELECT/SELECT_INPUT/MULTI_SELECT)
    sort_ord          INTEGER         DEFAULT 0,
    reg_by            VARCHAR(16),
    reg_date          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(16),
    upd_date          TIMESTAMP,
    PRIMARY KEY (opt_id)
);

COMMENT ON TABLE pd_prod_opt IS '상품 옵션 (색상, 사이즈 등 옵션 차원)';
COMMENT ON COLUMN pd_prod_opt.opt_id            IS '옵션ID';
COMMENT ON COLUMN pd_prod_opt.site_id           IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_prod_opt.prod_id           IS '상품ID';
COMMENT ON COLUMN pd_prod_opt.opt_grp_nm        IS '옵션명 (예: 색상, 사이즈)';
COMMENT ON COLUMN pd_prod_opt.opt_level         IS '옵션 차원 순서 — 1=첫번째(색상), 2=두번째(사이즈)';
COMMENT ON COLUMN pd_prod_opt.opt_type_cd       IS '옵션카테고리 (코드: OPT_TYPE — COLOR/SIZE/MATERIAL/CUSTOM)';
COMMENT ON COLUMN pd_prod_opt.opt_input_type_cd IS '옵션입력방식 (코드: OPT_INPUT_TYPE — SELECT/SELECT_INPUT/MULTI_SELECT)';
COMMENT ON COLUMN pd_prod_opt.sort_ord          IS '정렬순서';
COMMENT ON COLUMN pd_prod_opt.reg_by            IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_opt.reg_date          IS '등록일';
COMMENT ON COLUMN pd_prod_opt.upd_by            IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_opt.upd_date          IS '수정일';

-- 상품 옵션 항목 (예: 빨강, M) → pd_prod_opt_item

-- ============================================================
-- 데이터 예제 (상품 P001 — 티셔츠, 색상+사이즈 2단 옵션)
-- ============================================================
-- prod_id='P001'
--   ├─ opt_id='OPT001', opt_level=1, opt_type_cd='COLOR', opt_grp_nm='색상',   opt_input_type_cd='SELECT'
--   └─ opt_id='OPT002', opt_level=2, opt_type_cd='SIZE',  opt_grp_nm='사이즈', opt_input_type_cd='SELECT'

CREATE TABLE IF NOT EXISTS pd_prod_opt_item (
    opt_item_id         VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    opt_id              VARCHAR(21)     NOT NULL,               -- pd_prod_opt.opt_id
    opt_type_cd         VARCHAR(20)     NOT NULL,               -- 코드: OPT_TYPE (COLOR/SIZE/MATERIAL/CUSTOM)
    opt_nm              VARCHAR(100)    NOT NULL,               -- 옵션값 표시명 (예: 빨강, M)
    opt_val             VARCHAR(50),                            -- 실제 저장값 (opt_val_code_id 선택 시 codeValue 자동 채움, 직접입력 가능)
    opt_val_code_id     VARCHAR(50),                            -- OPT_VAL 공통코드 참조ID (sy_code.code_id, NULL이면 직접입력)
    parent_opt_item_id  VARCHAR(21),                            -- 상위 옵션값ID (2단 옵션에서 1단 값 참조, pd_prod_opt_item.opt_item_id)
    sort_ord            INTEGER         DEFAULT 0,
    use_yn              CHAR(1)         DEFAULT 'Y',
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (opt_item_id)
);

COMMENT ON TABLE pd_prod_opt_item IS '상품 옵션 값';
COMMENT ON COLUMN pd_prod_opt_item.opt_item_id        IS '옵션값ID';
COMMENT ON COLUMN pd_prod_opt_item.site_id            IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_prod_opt_item.opt_id             IS '옵션ID (pd_prod_opt.opt_id)';
COMMENT ON COLUMN pd_prod_opt_item.opt_type_cd        IS '옵션카테고리 (코드: OPT_TYPE — COLOR/SIZE/MATERIAL/CUSTOM)';
COMMENT ON COLUMN pd_prod_opt_item.opt_nm             IS '옵션값 표시명 (예: 빨강, M)';
COMMENT ON COLUMN pd_prod_opt_item.opt_val            IS '실제 저장값 — opt_val_code_id 선택 시 codeValue 자동 채움, 직접입력도 허용';
COMMENT ON COLUMN pd_prod_opt_item.opt_val_code_id    IS 'OPT_VAL 공통코드 참조ID (sy_code.code_id) — NULL이면 opt_val 직접입력';
COMMENT ON COLUMN pd_prod_opt_item.parent_opt_item_id IS '상위 옵션값ID — 2단 옵션에서 상위 1단 옵션값 참조 (pd_prod_opt_item.opt_item_id), NULL이면 독립값(전체 공통)';
COMMENT ON COLUMN pd_prod_opt_item.sort_ord           IS '정렬순서';
COMMENT ON COLUMN pd_prod_opt_item.use_yn             IS '사용여부 Y/N';
COMMENT ON COLUMN pd_prod_opt_item.reg_by             IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_opt_item.reg_date           IS '등록일';
COMMENT ON COLUMN pd_prod_opt_item.upd_by             IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_opt_item.upd_date           IS '수정일';

CREATE INDEX idx_pd_prod_opt_item_opt    ON pd_prod_opt_item (opt_id);
CREATE INDEX idx_pd_prod_opt_item_parent ON pd_prod_opt_item (parent_opt_item_id);

-- ============================================================
-- 값 결정 규칙
-- opt_val_code_id 선택 시 → opt_val = 해당 코드의 codeValue (자동 채움)
-- opt_val_code_id = NULL  → opt_val = 직접입력값 (CUSTOM 또는 임의 문자열)
-- opt_val 은 항상 실제 저장값; opt_val=NULL 는 허용하지 않음 (앱에서 검증)
-- ============================================================

-- ============================================================
-- parent_opt_item_id 사용 규칙
-- ============================================================
-- 1단 옵션 항목: parent_opt_item_id = NULL (상위 없음)
-- 2단 옵션 항목: parent_opt_item_id = NULL   → 어떤 1단 값과도 조합 가능 (전체 공통)
--              parent_opt_item_id = ITEM001  → ITEM001(블랙) 선택 시에만 이 2단 값 노출
-- 예: 색상(블랙)에서는 S/M/L 사이즈만, 색상(화이트)에서는 S/L 사이즈만 제공할 때 사용
-- ============================================================

-- ============================================================
-- 데이터 예제 (상품 P001 — 티셔츠, 색상+사이즈 2단 옵션)
-- pd_prod_opt: OPT001=색상(level=1), OPT002=사이즈(level=2)
-- ============================================================
-- prod_id='P001'
--   ├─ opt_id='OPT001' (COLOR, opt_level=1)
--   │   ├─ opt_item_id='ITEM001', opt_nm='블랙',     opt_val='BLACK', opt_val_code_id=NULL,          parent_opt_item_id=NULL → 저장값: BLACK
--   │   ├─ opt_item_id='ITEM002', opt_nm='화이트',   opt_val='WHITE', opt_val_code_id=NULL,          parent_opt_item_id=NULL → 저장값: WHITE
--   │   └─ opt_item_id='ITEM003', opt_nm='딥네이비', opt_val='NAVY',  opt_val_code_id='DEEP_NAVY',   parent_opt_item_id=NULL → 저장값: NAVY
--   └─ opt_id='OPT002' (SIZE, opt_level=2)
--       ├─ opt_item_id='ITEM004', opt_nm='S', opt_val='S', opt_val_code_id=NULL, parent_opt_item_id=NULL  → 전체 색상 공통
--       ├─ opt_item_id='ITEM005', opt_nm='M', opt_val='M', opt_val_code_id=NULL, parent_opt_item_id=NULL  → 전체 색상 공통
--       └─ opt_item_id='ITEM006', opt_nm='L', opt_val='L', opt_val_code_id=NULL, parent_opt_item_id='ITEM001' → 블랙만 L 사이즈 제공

-- 상품 상세 컨텐츠 (HTML 에디터로 관리)
CREATE TABLE IF NOT EXISTS pd_prod_content (
    prod_content_id VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    prod_id         VARCHAR(21)     NOT NULL,              -- FK: pd_prod.prod_id
    content_type_cd VARCHAR(50)     NOT NULL,              -- 코드: PROD_CONTENT_TYPE (상세설명, 사용설명, 배송정보, AS정보, 반품정책 등)
    content_html    TEXT,                                   -- HTML 에디터 컨텐츠
    sort_ord        INTEGER         DEFAULT 0,              -- 정렬순서
    use_yn          CHAR(1)         DEFAULT 'Y',            -- 사용여부 Y/N
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (prod_content_id)
);

COMMENT ON TABLE pd_prod_content IS '상품 상세 컨텐츠 (HTML 에디터)';
COMMENT ON COLUMN pd_prod_content.prod_content_id IS '상품컨텐츠ID';
COMMENT ON COLUMN pd_prod_content.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_prod_content.prod_id      IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pd_prod_content.content_type_cd IS '컨텐츠유형 (코드: PROD_CONTENT_TYPE — 상세설명, 사용설명, 배송정보, AS정보, 반품정책 등)';
COMMENT ON COLUMN pd_prod_content.content_html IS 'HTML 에디터 컨텐츠';
COMMENT ON COLUMN pd_prod_content.sort_ord     IS '정렬순서';
COMMENT ON COLUMN pd_prod_content.use_yn       IS '사용여부 Y/N';
COMMENT ON COLUMN pd_prod_content.reg_by       IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_content.reg_date     IS '등록일';
COMMENT ON COLUMN pd_prod_content.upd_by       IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_content.upd_date     IS '수정일';

CREATE INDEX idx_pd_prod_content_prod ON pd_prod_content (prod_id, content_type_cd);

-- 컨텐츠 예시:
-- content_type='상세설명', content_html='<h2>제품 특징</h2><p>고급 천연 면...</p>'
-- content_type='사용설명', content_html='<ol><li>물에 불려...</li></ol>'
-- content_type='배송정보', content_html='<p>해외배송 불가, 제주도 배송료 +3,000원</p>'
-- content_type='AS정보', content_html='<p>구매 후 30일 이내 교환/반품 가능</p>'

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pd_prod_content.content_type_cd (컨텐츠유형) : PROD_CONTENT_TYPE { DETAIL:상세설명, NOTICE:안내, GUIDE:이용안내, SIZE_GUIDE:사이즈안내 }

-- 상품-태그 매핑
CREATE TABLE IF NOT EXISTS pd_prod_tag (
    prod_tag_id     VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),
    prod_id         VARCHAR(21)     NOT NULL,               -- pd_prod.prod_id
    tag_id          VARCHAR(21)     NOT NULL,               -- pd_tag.
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (prod_tag_id),
    UNIQUE (prod_id, tag_id)
);

COMMENT ON TABLE pd_prod_tag IS '상품-태그 매핑';
COMMENT ON COLUMN pd_prod_tag.prod_tag_id IS '상품태그ID';
COMMENT ON COLUMN pd_prod_tag.site_id     IS '사이트ID';
COMMENT ON COLUMN pd_prod_tag.prod_id     IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pd_prod_tag.tag_id      IS '태그ID (pd_tag.)';
COMMENT ON COLUMN pd_prod_tag.reg_by      IS '등록자';
COMMENT ON COLUMN pd_prod_tag.reg_date    IS '등록일';

CREATE INDEX idx_pd_prod_tag_prod ON pd_prod_tag (prod_id);
CREATE INDEX idx_pd_prod_tag_tag  ON pd_prod_tag (tag_id);

-- ============================================================
-- pd_prod_rel : 상품 연관 관계
-- REL_PROD  : 연관상품  (같이 보면 좋을 상품, 비슷한 상품)
-- CODY_PROD : 코디상품  (함께 코디하면 좋을 상품, 크로스셀링)
-- ID 규칙   : YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pd_prod_rel (
    prod_rel_id      VARCHAR(21)     NOT NULL,
    prod_id          VARCHAR(21)     NOT NULL,                  -- 기준 상품 (pd_prod.prod_id)
    rel_prod_id      VARCHAR(21)     NOT NULL,                  -- 연관 대상 상품 (pd_prod.prod_id)
    prod_rel_type_cd VARCHAR(20)     NOT NULL,                  -- 관계 유형 코드: PROD_REL_TYPE (REL_PROD / CODY_PROD)
    sort_ord         INTEGER         DEFAULT 0,                 -- 노출 정렬 순서 (낮을수록 우선)
    use_yn           CHAR(1)         DEFAULT 'Y',               -- 사용여부 Y/N
    reg_by           VARCHAR(16),
    reg_date         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(16),
    upd_date         TIMESTAMP,
    PRIMARY KEY (prod_rel_id),
    UNIQUE (prod_id, rel_prod_id, prod_rel_type_cd)             -- 동일 타입 중복 연결 방지
);

COMMENT ON TABLE  pd_prod_rel                  IS '상품 연관 관계 (연관상품/코디상품)';
COMMENT ON COLUMN pd_prod_rel.prod_rel_id      IS '연관관계ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_prod_rel.prod_id          IS '기준 상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pd_prod_rel.rel_prod_id      IS '연관 대상 상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pd_prod_rel.prod_rel_type_cd IS '관계유형 코드 (PROD_REL_TYPE: REL_PROD/CODY_PROD)';
COMMENT ON COLUMN pd_prod_rel.sort_ord         IS '정렬순서 (낮을수록 우선 노출)';
COMMENT ON COLUMN pd_prod_rel.use_yn           IS '사용여부 Y/N';
COMMENT ON COLUMN pd_prod_rel.reg_by           IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN pd_prod_rel.reg_date         IS '등록일';
COMMENT ON COLUMN pd_prod_rel.upd_by           IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN pd_prod_rel.upd_date         IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pd_prod_rel.prod_rel_type_cd (관계유형) : PROD_REL_TYPE
--   REL_PROD  : 연관상품 — 비슷하거나 대체 가능한 상품 (PDP 하단 "관련 상품" 노출)
--   CODY_PROD : 코디상품 — 함께 코디·조합하면 좋은 상품 (PDP 하단 "코디 추천" 노출)

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX idx_pd_prod_rel_prod_id      ON pd_prod_rel (prod_id, prod_rel_type_cd, sort_ord);
CREATE INDEX idx_pd_prod_rel_rel_prod_id  ON pd_prod_rel (rel_prod_id);

![1776594249558](image/pd_prod_set_item/1776594249558.png)![1776594254261](image/pd_prod_set_item/1776594254261.png)![1776594255090](image/pd_prod_set_item/1776594255090.png)![1776594257722](image/pd_prod_set_item/1776594257722.png)![1776594264913](image/pd_prod_set_item/1776594264913.png)![1776594270735](image/pd_prod_set_item/1776594270735.png)![1776594516644](image/pd_prod_set_item/1776594516644.png)![1776594518949](image/pd_prod_set_item/1776594518949.png)![1776595118364](image/pd_prod_set_item/1776595118364.png)-- ============================================================
-- pd_prod_set_item : 세트상품 구성 목록
-- 세트상품(prod_type_cd = 'SET') 의 구성 항목 표시 목록
-- - 세트 자체 재고 일괄 관리 (구성품 개별 재고 차감 없음)
-- - 가격은 세트 단가로 별도 책정 (price_rate 없음)
-- - 클레임은 세트 전체 단위로만 처리 (부분 취소/반품 불가)
-- - component_prod_id = NULL 허용 (상품 미등록 구성품 — 예: 증정 엽서)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pd_prod_set_item (
    set_item_id         VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    set_prod_id         VARCHAR(21)     NOT NULL,               -- 세트상품ID (pd_prod.prod_id, prod_type_cd=SET)
    item_prod_id        VARCHAR(21),                            -- 구성품 상품ID (pd_prod.prod_id, NULL=비상품 구성품)
    item_sku_id         VARCHAR(21),                            -- 구성품 SKU ID (pd_prod_sku.sku_id, NULL=SKU미지정)
    item_nm             VARCHAR(200)    NOT NULL,               -- 구성품 표시명 (예: 머그컵 1개)
    item_qty            INTEGER         DEFAULT 1,              -- 구성 수량
    item_desc           VARCHAR(300),                           -- 구성품 설명 (소재·용량 등 부가 안내)
    sort_ord            INTEGER         DEFAULT 0,              -- 노출 순서
    use_yn              CHAR(1)         DEFAULT 'Y',            -- 사용여부 Y/N
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (set_item_id)
);

COMMENT ON TABLE  pd_prod_set_item                   IS '세트상품 구성 목록 (prod_type_cd=SET, 표시·배송 단위 정의)';
COMMENT ON COLUMN pd_prod_set_item.set_item_id       IS '세트구성ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_prod_set_item.site_id           IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_prod_set_item.set_prod_id       IS '세트상품ID (pd_prod.prod_id, prod_type_cd=SET)';
COMMENT ON COLUMN pd_prod_set_item.item_prod_id      IS '구성품 상품ID (pd_prod.prod_id, NULL=비상품 구성품)';
COMMENT ON COLUMN pd_prod_set_item.item_sku_id       IS '구성품 SKU ID (pd_prod_sku.sku_id, NULL=SKU 미지정)';
COMMENT ON COLUMN pd_prod_set_item.item_nm           IS '구성품 표시명 (예: 머그컵, 접시 2p)';
COMMENT ON COLUMN pd_prod_set_item.item_qty          IS '구성 수량';
COMMENT ON COLUMN pd_prod_set_item.item_desc         IS '구성품 부가 설명 (소재·용량·색상 등)';
COMMENT ON COLUMN pd_prod_set_item.sort_ord          IS '노출 정렬 순서';
COMMENT ON COLUMN pd_prod_set_item.use_yn            IS '사용여부 Y/N';
COMMENT ON COLUMN pd_prod_set_item.reg_by            IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN pd_prod_set_item.reg_date          IS '등록일';
COMMENT ON COLUMN pd_prod_set_item.upd_by            IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN pd_prod_set_item.upd_date          IS '수정일';

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX idx_pd_prod_set_item_set  ON pd_prod_set_item (set_prod_id, sort_ord);
CREATE INDEX idx_pd_prod_set_item_item ON pd_prod_set_item (item_prod_id) WHERE item_prod_id IS NOT NULL;

-- ============================================================
-- pd_prod_bundle_item : 묶음상품 구성품
-- 묶음상품(prod_type_cd = 'BUNDLE') 의 개별 상품 구성 목록
-- - 각 구성품은 독립 상품(pd_prod)으로 존재
-- - 구성품별 개별 재고 차감 / 부분 클레임(개별 취소·반품) 가능
-- - price_rate(안분율) 합계 = 100% 필수 (환불 금액 계산 기준)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pd_prod_bundle_item (
    bundle_item_id      VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    bundle_prod_id      VARCHAR(21)     NOT NULL,               -- 묶음상품ID (pd_prod.prod_id, prod_type_cd=BUNDLE)
    item_prod_id        VARCHAR(21)     NOT NULL,               -- 구성품 상품ID (pd_prod.prod_id)
    item_sku_id         VARCHAR(21),                            -- 구성품 SKU ID (pd_prod_sku.sku_id, NULL=SKU미지정)
    item_qty            INTEGER         DEFAULT 1,              -- 구성 수량
    price_rate          DECIMAL(5,2)    NOT NULL,               -- 가격 안분율 (%) — 구성품 합계 100% 필수
    sort_ord            INTEGER         DEFAULT 0,              -- 노출 순서
    use_yn              CHAR(1)         DEFAULT 'Y',            -- 사용여부 Y/N
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (bundle_item_id),
    UNIQUE (bundle_prod_id, item_prod_id)                       -- 동일 묶음에 동일 상품 중복 방지
);

COMMENT ON TABLE  pd_prod_bundle_item                    IS '묶음상품 구성품 (prod_type_cd=BUNDLE)';
COMMENT ON COLUMN pd_prod_bundle_item.bundle_item_id     IS '묶음구성ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_prod_bundle_item.site_id            IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_prod_bundle_item.bundle_prod_id     IS '묶음상품ID (pd_prod.prod_id, prod_type_cd=BUNDLE)';
COMMENT ON COLUMN pd_prod_bundle_item.item_prod_id       IS '구성품 상품ID (pd_prod.prod_id) — 독립 판매 상품';
COMMENT ON COLUMN pd_prod_bundle_item.item_sku_id        IS '구성품 SKU ID (pd_prod_sku.sku_id, NULL=SKU 미지정)';
COMMENT ON COLUMN pd_prod_bundle_item.item_qty           IS '구성 수량 (기본 1)';
COMMENT ON COLUMN pd_prod_bundle_item.price_rate         IS '가격 안분율 (%) — 구성품 합계 100% 필수, 부분클레임 환불 계산 기준';
COMMENT ON COLUMN pd_prod_bundle_item.sort_ord           IS '노출 정렬 순서';
COMMENT ON COLUMN pd_prod_bundle_item.use_yn             IS '사용여부 Y/N';
COMMENT ON COLUMN pd_prod_bundle_item.reg_by             IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN pd_prod_bundle_item.reg_date           IS '등록일';
COMMENT ON COLUMN pd_prod_bundle_item.upd_by             IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN pd_prod_bundle_item.upd_date           IS '수정일';

-- ============================================================
-- 제약사항 메모
-- ============================================================
-- price_rate 합계 = 100% 강제는 앱 레이어에서 검증
-- (PostgreSQL CHECK 제약으로는 행간 합계 검증 불가)

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX idx_pd_prod_bundle_item_bundle  ON pd_prod_bundle_item (bundle_prod_id, sort_ord);
CREATE INDEX idx_pd_prod_bundle_item_item    ON pd_prod_bundle_item (item_prod_id);

-- ============================================================
CREATE TABLE IF NOT EXISTS pd_prod_qna (
    qna_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    prod_id         VARCHAR(21)     NOT NULL,               -- pd_prod.prod_id
    sku_id          VARCHAR(21),                            -- pd_prod_sku.sku_id (특정 SKU 문의 시)
    member_id       VARCHAR(21),                            -- mb_member.member_id
    order_id        VARCHAR(21),                            -- od_order.order_id (주문 관련 문의 시)
    qna_type_cd     VARCHAR(20),                            -- 코드: PROD_QNA_TYPE (SIZE/QUALITY/DLIV/ETC)
    qna_title       VARCHAR(200)    NOT NULL,
    qna_content     TEXT            NOT NULL,
    scrt_yn         VARCHAR(1)      DEFAULT 'N',            -- 비밀글 여부
    answ_yn         VARCHAR(1)      DEFAULT 'N',
    answ_content    TEXT,
    answ_date       TIMESTAMP,
    answ_user_id    VARCHAR(21),                            -- 답변자 (sy_user.user_id)
    disp_yn         VARCHAR(1)      DEFAULT 'Y',            -- 노출 여부
    use_yn          VARCHAR(1)      DEFAULT 'Y',
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (qna_id)
);

COMMENT ON TABLE pd_prod_qna IS '상품문의';
COMMENT ON COLUMN pd_prod_qna.qna_id       IS '문의ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_prod_qna.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_prod_qna.prod_id      IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pd_prod_qna.sku_id       IS 'SKUID (pd_prod_sku.sku_id)';
COMMENT ON COLUMN pd_prod_qna.member_id    IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN pd_prod_qna.order_id     IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN pd_prod_qna.qna_type_cd  IS '문의유형코드 (코드: PROD_QNA_TYPE)';
COMMENT ON COLUMN pd_prod_qna.qna_title    IS '문의제목';
COMMENT ON COLUMN pd_prod_qna.qna_content  IS '문의내용';
COMMENT ON COLUMN pd_prod_qna.scrt_yn      IS '비밀글여부 Y/N';
COMMENT ON COLUMN pd_prod_qna.answ_yn      IS '답변여부 Y/N';
COMMENT ON COLUMN pd_prod_qna.answ_content IS '답변내용';
COMMENT ON COLUMN pd_prod_qna.answ_date    IS '답변일시';
COMMENT ON COLUMN pd_prod_qna.answ_user_id IS '답변자ID (sy_user.user_id)';
COMMENT ON COLUMN pd_prod_qna.disp_yn      IS '노출여부 Y/N';
COMMENT ON COLUMN pd_prod_qna.use_yn       IS '사용여부 Y/N';
COMMENT ON COLUMN pd_prod_qna.reg_by       IS '등록자ID';
COMMENT ON COLUMN pd_prod_qna.reg_date     IS '등록일시';
COMMENT ON COLUMN pd_prod_qna.upd_by       IS '수정자ID';
COMMENT ON COLUMN pd_prod_qna.upd_date     IS '수정일시';

CREATE INDEX idx_pd_prod_qna_prod   ON pd_prod_qna (prod_id);
CREATE INDEX idx_pd_prod_qna_member ON pd_prod_qna (member_id);
CREATE INDEX idx_pd_prod_qna_answ   ON pd_prod_qna (answ_yn);
CREATE INDEX idx_pd_prod_qna_site   ON pd_prod_qna (site_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pd_prod_qna.qna_type_cd (문의유형코드) : PROD_QNA_TYPE { SIZE:사이즈, QUALITY:품질, DLIV:배송, ETC:기타 }

-- ============================================================
-- ec_review : 상품 리뷰
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pd_review (
    review_id       VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    prod_id         VARCHAR(21)     NOT NULL,              -- pd_prod.prod_id
    member_id       VARCHAR(21)     NOT NULL,              -- mb_member.member_id
    review_title    VARCHAR(200)    NOT NULL,
    review_content  TEXT            NOT NULL,
    rating          NUMERIC(3,1)    NOT NULL,              -- 1.0 ~ 5.0
    helpful_cnt     INTEGER         DEFAULT 0,              -- 도움이 돼요 수
    unhelpful_cnt   INTEGER         DEFAULT 0,              -- 도움이 안 돼요 수
    review_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: REVIEW_STATUS (ACTIVE/HIDDEN/DELETED)
    review_status_cd_before VARCHAR(20),                     -- 변경 전 리뷰상태
    review_date     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (review_id)
);

COMMENT ON TABLE pd_review IS '상품 리뷰';
COMMENT ON COLUMN pd_review.review_id       IS '리뷰ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_review.site_id         IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_review.prod_id         IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pd_review.member_id       IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN pd_review.review_title    IS '리뷰 제목';
COMMENT ON COLUMN pd_review.review_content  IS '리뷰 내용';
COMMENT ON COLUMN pd_review.rating          IS '평점 (1.0~5.0)';
COMMENT ON COLUMN pd_review.helpful_cnt     IS '도움이 돼요 수';
COMMENT ON COLUMN pd_review.unhelpful_cnt   IS '도움이 안 돼요 수';
COMMENT ON COLUMN pd_review.review_status_cd IS '상태 (코드: REVIEW_STATUS)';
COMMENT ON COLUMN pd_review.review_status_cd_before IS '변경 전 리뷰상태 (코드: REVIEW_STATUS)';
COMMENT ON COLUMN pd_review.review_date     IS '리뷰작성일';
COMMENT ON COLUMN pd_review.reg_by          IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_review.reg_date        IS '등록일';
COMMENT ON COLUMN pd_review.upd_by          IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_review.upd_date        IS '수정일';

CREATE INDEX idx_pd_review_prod ON pd_review (prod_id);
CREATE INDEX idx_pd_review_member ON pd_review (member_id);
CREATE INDEX idx_pd_review_status ON pd_review (review_status_cd);
CREATE INDEX idx_pd_review_date ON pd_review (review_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pd_review.review_status_cd (상태) : REVIEW_STATUS { PENDING:검토중, ACTIVE:게시, HIDDEN:숨김, DELETED:삭제 }

-- 리뷰 이미지/동영상
-- attach_id → sy_attach.attach_id (파일 실체: url, file_nm, file_size 등은 sy_attach에서 조회)
-- thumb_url은 동영상 썸네일처럼 별도 생성 파일이므로 유지
CREATE TABLE IF NOT EXISTS pd_review_attach (
    review_attach_id        VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),
    review_id       VARCHAR(21)     NOT NULL,              -- pd_review.
    attach_id       VARCHAR(21)     NOT NULL,              -- sy_attach.attach_id
    media_type_cd   VARCHAR(20)     DEFAULT 'IMAGE',       -- 코드: MEDIA_TYPE (IMAGE/VIDEO)
    thumb_url       VARCHAR(500),                          -- 동영상 썸네일 URL (이미지는 sy_attach.url 사용)
    sort_ord        INTEGER         DEFAULT 0,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (review_attach_id)
);

COMMENT ON TABLE pd_review_attach IS '리뷰 이미지/동영상';
COMMENT ON COLUMN pd_review_attach.review_attach_id     IS '미디어ID';
COMMENT ON COLUMN pd_review_attach.site_id      IS '사이트ID';
COMMENT ON COLUMN pd_review_attach.review_id    IS '리뷰ID (pd_review.)';
COMMENT ON COLUMN pd_review_attach.attach_id    IS '첨부파일ID (sy_attach.attach_id) — url·파일명 여기서 조회';
COMMENT ON COLUMN pd_review_attach.media_type_cd IS '미디어유형 (코드: MEDIA_TYPE)';
COMMENT ON COLUMN pd_review_attach.thumb_url    IS '동영상 썸네일URL (이미지는 sy_attach.url 사용)';
COMMENT ON COLUMN pd_review_attach.sort_ord     IS '정렬순서';
COMMENT ON COLUMN pd_review_attach.reg_by       IS '등록자';
COMMENT ON COLUMN pd_review_attach.reg_date     IS '등록일';
COMMENT ON COLUMN pd_review_attach.upd_by       IS '수정자';
COMMENT ON COLUMN pd_review_attach.upd_date     IS '수정일';

CREATE INDEX idx_pd_review_media_review ON pd_review_attach (review_id);
CREATE INDEX idx_pd_review_media_attach ON pd_review_attach (attach_id);

-- 리뷰 댓글 (판매자 답변 포함)

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pd_review_attach.media_type_cd (미디어유형) : MEDIA_TYPE { IMAGE:이미지, VIDEO:동영상, DOCUMENT:문서 }

CREATE TABLE IF NOT EXISTS pd_review_comment (
    review_comment_id        VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),
    review_id       VARCHAR(21)     NOT NULL,
    parent_reply_id VARCHAR(21),                           -- 대댓글 시 상위 reply_id
    writer_type_cd  VARCHAR(20)     DEFAULT 'MEMBER',      -- 코드: REVIEW_WRITER_TYPE (MEMBER/SELLER/ADMIN)
    writer_id       VARCHAR(21),                           -- member_id 또는 user_id
    writer_nm       VARCHAR(50),
    review_reply_content TEXT            NOT NULL,
    reply_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',      -- ACTIVE/HIDDEN/DELETED
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (review_comment_id)
);

COMMENT ON TABLE pd_review_comment IS '리뷰 댓글';
COMMENT ON COLUMN pd_review_comment.review_comment_id      IS '댓글ID';
COMMENT ON COLUMN pd_review_comment.site_id       IS '사이트ID';
COMMENT ON COLUMN pd_review_comment.review_id     IS '리뷰ID (pd_review.)';
COMMENT ON COLUMN pd_review_comment.parent_reply_id IS '상위댓글ID (대댓글)';
COMMENT ON COLUMN pd_review_comment.writer_type_cd IS '작성자유형 (코드: REVIEW_WRITER_TYPE — MEMBER/SELLER/ADMIN)';
COMMENT ON COLUMN pd_review_comment.writer_id     IS '작성자ID';
COMMENT ON COLUMN pd_review_comment.writer_nm     IS '작성자명';
COMMENT ON COLUMN pd_review_comment.review_reply_content IS '댓글 내용';
COMMENT ON COLUMN pd_review_comment.reply_status_cd IS '상태 (ACTIVE/HIDDEN/DELETED)';
COMMENT ON COLUMN pd_review_comment.reg_by        IS '등록자';
COMMENT ON COLUMN pd_review_comment.reg_date      IS '등록일';
COMMENT ON COLUMN pd_review_comment.upd_by        IS '수정자';
COMMENT ON COLUMN pd_review_comment.upd_date      IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pd_review_comment.writer_type_cd (작성자유형) : REVIEW_WRITER_TYPE { MEMBER:회원, ADMIN:관리자 }

-- ============================================================
CREATE TABLE IF NOT EXISTS pd_restock_noti (
    restock_noti_id VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    prod_id         VARCHAR(21)     NOT NULL,               -- pd_prod.prod_id
    sku_id          VARCHAR(21),                            -- pd_prod_sku.sku_id
    member_id       VARCHAR(21)     NOT NULL,               -- mb_member.member_id
    noti_yn         VARCHAR(1)      DEFAULT 'N',            -- 알림 발송 여부
    noti_date       TIMESTAMP,                              -- 알림 발송 일시
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (restock_noti_id),
    UNIQUE (prod_id, sku_id, member_id)
);

COMMENT ON TABLE pd_restock_noti IS '재입고알림 신청';
COMMENT ON COLUMN pd_restock_noti.restock_noti_id IS '재입고알림ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_restock_noti.site_id         IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_restock_noti.prod_id         IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pd_restock_noti.sku_id          IS 'SKUID (pd_prod_sku.sku_id)';
COMMENT ON COLUMN pd_restock_noti.member_id       IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN pd_restock_noti.noti_yn         IS '알림발송여부 Y/N';
COMMENT ON COLUMN pd_restock_noti.noti_date       IS '알림발송일시';
COMMENT ON COLUMN pd_restock_noti.reg_by          IS '등록자ID';
COMMENT ON COLUMN pd_restock_noti.reg_date        IS '등록일시';
COMMENT ON COLUMN pd_restock_noti.upd_by          IS '수정자ID';
COMMENT ON COLUMN pd_restock_noti.upd_date        IS '수정일시';

CREATE INDEX idx_pd_restock_noti_prod   ON pd_restock_noti (prod_id);
CREATE INDEX idx_pd_restock_noti_member ON pd_restock_noti (member_id);
CREATE INDEX idx_pd_restock_noti_noti   ON pd_restock_noti (noti_yn);

-- ============================================================
-- pd_category_prod : 상품-카테고리 연결 (N:N)
-- 상품 1개에 카테고리 N개 등록 가능 (복수 카테고리)
-- - sort_ord: 카테고리 내 동일 타입 표시 순서
-- - category_prod_type_cd: 카테고리 내 상품 진열 유형
--   (NORMAL=일반상품, HIGHLIGHT=하이라이트상품, RECOMMEND=추천상품,
--    MAIN=대표상품, BANNER=배너상품, HOT_DEAL=핫딜상품)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pd_category_prod (
    category_prod_id        VARCHAR(21)     NOT NULL,
    site_id                 VARCHAR(21),                                        -- sy_site.site_id
    category_id             VARCHAR(21)     NOT NULL,                           -- pd_category.category_id
    prod_id                 VARCHAR(21)     NOT NULL,                           -- pd_prod.prod_id
    category_prod_type_cd   VARCHAR(20)     NOT NULL DEFAULT 'NORMAL',          -- 진열 유형
    sort_ord                INTEGER         DEFAULT 0,                          -- 동일 타입 내 표시 순서
    emphasis_cd             VARCHAR(200),                                       -- 강조옵션 (^BOLD^TEXT_COLOR^EMOTICON^MARQUEE^)
    disp_yn                 CHAR(1)         NOT NULL DEFAULT 'Y',               -- 전시여부 (Y/N)
    disp_start_date         DATE            DEFAULT CURRENT_DATE,               -- 전시시작일
    disp_end_date           DATE            DEFAULT (CURRENT_DATE + INTERVAL '3 years' - EXTRACT(DOY FROM CURRENT_DATE) * INTERVAL '1 day' + INTERVAL '1 year' - INTERVAL '1 day'), -- 전시종료일 (기본: 3년 후 12월31일)
    reg_by                  VARCHAR(16),
    reg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (category_prod_id),
    UNIQUE (category_id, prod_id, category_prod_type_cd)                       -- 동일 카테고리+상품+타입 중복 방지
);

COMMENT ON TABLE  pd_category_prod                              IS '상품-카테고리 연결 (N:N, 복수 카테고리·타입 등록)';
COMMENT ON COLUMN pd_category_prod.category_prod_id            IS '상품카테고리연결ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_category_prod.site_id                     IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_category_prod.category_id                 IS '카테고리ID (pd_category.category_id)';
COMMENT ON COLUMN pd_category_prod.prod_id                     IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pd_category_prod.category_prod_type_cd       IS '진열유형 (NORMAL/HIGHLIGHT/RECOMMEND/MAIN/BANNER/HOT_DEAL)';
COMMENT ON COLUMN pd_category_prod.sort_ord                    IS '표시 순서 (동일 타입 내, 낮을수록 우선 노출)';
COMMENT ON COLUMN pd_category_prod.disp_yn                     IS '전시여부 (Y=전시, N=비전시)';
COMMENT ON COLUMN pd_category_prod.disp_start_date             IS '전시시작일 (NULL=즉시)';
COMMENT ON COLUMN pd_category_prod.disp_end_date               IS '전시종료일 (NULL=무기한, 기본 3년 후 12월31일)';
COMMENT ON COLUMN pd_category_prod.reg_by                      IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN pd_category_prod.reg_date                    IS '등록일';

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX idx_pd_category_prod_prod ON pd_category_prod (prod_id, category_prod_type_cd, sort_ord);
CREATE INDEX idx_pd_category_prod_cat  ON pd_category_prod (category_id, category_prod_type_cd, sort_ord);

CREATE TABLE IF NOT EXISTS pdh_prod_chg_hist (
    prod_chg_hist_id    VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    prod_id         VARCHAR(21)     NOT NULL,
    chg_type_cd     VARCHAR(30),                            -- 변경유형코드 (PRICE / STOCK / STATUS)
    before_val      TEXT,
    after_val       TEXT,
    chg_reason      VARCHAR(200),
    chg_user_id          VARCHAR(21),
    chg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (prod_chg_hist_id)
);

COMMENT ON TABLE pdh_prod_chg_hist IS '상품 변경 이력';
COMMENT ON COLUMN pdh_prod_chg_hist.prod_chg_hist_id IS '이력ID';
COMMENT ON COLUMN pdh_prod_chg_hist.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pdh_prod_chg_hist.prod_id      IS '상품ID';
COMMENT ON COLUMN pdh_prod_chg_hist.chg_type_cd  IS '변경유형코드 (PRICE/STOCK/STATUS)';
COMMENT ON COLUMN pdh_prod_chg_hist.before_val   IS '변경전값';
COMMENT ON COLUMN pdh_prod_chg_hist.after_val    IS '변경후값';
COMMENT ON COLUMN pdh_prod_chg_hist.chg_reason   IS '변경사유';
COMMENT ON COLUMN pdh_prod_chg_hist.chg_user_id       IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN pdh_prod_chg_hist.chg_date     IS '처리일시';
COMMENT ON COLUMN pdh_prod_chg_hist.reg_by       IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pdh_prod_chg_hist.reg_date     IS '등록일';
COMMENT ON COLUMN pdh_prod_chg_hist.upd_by       IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pdh_prod_chg_hist.upd_date     IS '수정일';

-- 상품 컨텐츠 변경 이력
CREATE TABLE IF NOT EXISTS pdh_prod_content_chg_hist (
    hist_id          VARCHAR(21)     NOT NULL,
    site_id          VARCHAR(21),                            -- sy_site.site_id
    prod_id          VARCHAR(21)     NOT NULL,              -- FK: pd_prod.prod_idprod_id
    prod_content_id  VARCHAR(21)     NOT NULL,              -- FK: pd_prod_content.prod_content_id
    content_type_cd  VARCHAR(50),                            -- 컨텐츠유형코드 (상세설명, 사용설명 등)
    content_before   TEXT,                                   -- 변경전 컨텐츠
    content_after    TEXT,                                   -- 변경후 컨텐츠
    chg_reason       VARCHAR(200),                           -- 변경사유
    chg_user_id           VARCHAR(21),                            -- 처리자 (sy_user.user_id)
    chg_date         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP, -- 처리일시
    reg_by           VARCHAR(16),
    reg_date         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(16),
    upd_date         TIMESTAMP,
    PRIMARY KEY (hist_id)
);

COMMENT ON TABLE pdh_prod_content_chg_hist IS '상품 컨텐츠 변경 이력';
COMMENT ON COLUMN pdh_prod_content_chg_hist.hist_id      IS '이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pdh_prod_content_chg_hist.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pdh_prod_content_chg_hist.prod_id      IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pdh_prod_content_chg_hist.prod_content_id IS '상품컨텐츠ID (pd_prod_content.)';
COMMENT ON COLUMN pdh_prod_content_chg_hist.content_type_cd IS '컨텐츠유형코드 (상세설명, 사용설명, 배송정보 등)';
COMMENT ON COLUMN pdh_prod_content_chg_hist.content_before IS '변경전 HTML 컨텐츠';
COMMENT ON COLUMN pdh_prod_content_chg_hist.content_after  IS '변경후 HTML 컨텐츠';
COMMENT ON COLUMN pdh_prod_content_chg_hist.chg_reason    IS '변경사유 (예: 내용 오류 수정, 계절 업데이트)';
COMMENT ON COLUMN pdh_prod_content_chg_hist.chg_user_id        IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN pdh_prod_content_chg_hist.chg_date      IS '처리일시';
COMMENT ON COLUMN pdh_prod_content_chg_hist.reg_by        IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pdh_prod_content_chg_hist.reg_date      IS '등록일';
COMMENT ON COLUMN pdh_prod_content_chg_hist.upd_by        IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pdh_prod_content_chg_hist.upd_date      IS '수정일';

CREATE INDEX idx_pdh_prod_content_chg_hist_prod ON pdh_prod_content_chg_hist (prod_id, chg_date DESC);

-- 변경 예시:
-- content_type='상세설명', content_before='<p>이전 내용...</p>', content_after='<p>신규 내용...</p>', chg_reason='내용 오류 수정'

-- SKU 상태 변경 이력 (use_yn Y/N 등 상태 변경)
-- 가격 변경 → pdh_prod_sku_price_hist
-- 재고 변경 → pdh_prod_sku_stock_hist
CREATE TABLE IF NOT EXISTS pdh_prod_sku_chg_hist (
    hist_id         VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    sku_id          VARCHAR(21)     NOT NULL,               -- pd_prod_sku.sku_id
    prod_id         VARCHAR(21)     NOT NULL,               -- pd_prod.prod_id
    chg_type_cd     VARCHAR(30)     NOT NULL,               -- 변경유형 (코드: SKU_CHG_TYPE — STATUS 등)
    before_val      VARCHAR(100),                           -- 변경 전 값
    after_val       VARCHAR(100),                           -- 변경 후 값
    chg_reason      VARCHAR(200),                           -- 변경사유
    chg_by          VARCHAR(21),                            -- 처리자 (sy_user.user_id)
    chg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (hist_id)
);

COMMENT ON TABLE pdh_prod_sku_chg_hist IS 'SKU 상태 변경 이력 (가격→price_hist, 재고→stock_hist)';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.hist_id      IS '이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.sku_id       IS 'SKU ID (pd_prod_sku.sku_id)';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.prod_id      IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.chg_type_cd  IS '변경유형 (코드: SKU_CHG_TYPE — STATUS 등)';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.before_val   IS '변경 전 값';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.after_val    IS '변경 후 값';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.chg_reason   IS '변경사유';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.chg_by       IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.chg_date     IS '처리일시';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.reg_by       IS '등록자';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.reg_date     IS '등록일';

CREATE INDEX idx_pdh_prod_sku_chg_hist_sku  ON pdh_prod_sku_chg_hist (sku_id);
CREATE INDEX idx_pdh_prod_sku_chg_hist_prod ON pdh_prod_sku_chg_hist (prod_id);

-- SKU 가격 변경 이력
CREATE TABLE IF NOT EXISTS pdh_prod_sku_price_hist (
    hist_id             VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    sku_id              VARCHAR(21)     NOT NULL,               -- pd_prod_sku.sku_id
    prod_id             VARCHAR(21)     NOT NULL,               -- pd_prod.prod_id
    add_price_before    BIGINT          NOT NULL,               -- 변경 전 추가금액
    add_price_after     BIGINT          NOT NULL,               -- 변경 후 추가금액
    chg_reason          VARCHAR(200),                           -- 변경사유 (예: 가격인상, 프로모션 종료)
    chg_by              VARCHAR(21),                            -- 처리자 (sy_user.user_id)
    chg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (hist_id)
);

COMMENT ON TABLE pdh_prod_sku_price_hist IS 'SKU 가격 변경 이력';
COMMENT ON COLUMN pdh_prod_sku_price_hist.hist_id           IS '이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pdh_prod_sku_price_hist.site_id           IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pdh_prod_sku_price_hist.sku_id            IS 'SKU ID (pd_prod_sku.sku_id)';
COMMENT ON COLUMN pdh_prod_sku_price_hist.prod_id           IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pdh_prod_sku_price_hist.add_price_before  IS '변경 전 옵션 추가금액';
COMMENT ON COLUMN pdh_prod_sku_price_hist.add_price_after   IS '변경 후 옵션 추가금액';
COMMENT ON COLUMN pdh_prod_sku_price_hist.chg_reason        IS '변경사유';
COMMENT ON COLUMN pdh_prod_sku_price_hist.chg_by            IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN pdh_prod_sku_price_hist.chg_date          IS '처리일시';
COMMENT ON COLUMN pdh_prod_sku_price_hist.reg_by            IS '등록자';
COMMENT ON COLUMN pdh_prod_sku_price_hist.reg_date          IS '등록일';

CREATE INDEX idx_pdh_prod_sku_price_hist_sku  ON pdh_prod_sku_price_hist (sku_id);
CREATE INDEX idx_pdh_prod_sku_price_hist_prod ON pdh_prod_sku_price_hist (prod_id);
CREATE INDEX idx_pdh_prod_sku_price_hist_date ON pdh_prod_sku_price_hist (chg_date);

-- SKU 재고 변경 이력
CREATE TABLE IF NOT EXISTS pdh_prod_sku_stock_hist (
    hist_id             VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    sku_id              VARCHAR(21)     NOT NULL,               -- pd_prod_sku.sku_id
    prod_id             VARCHAR(21)     NOT NULL,               -- pd_prod.prod_id
    stock_before        INTEGER         NOT NULL,               -- 변경 전 재고수량
    stock_after         INTEGER         NOT NULL,               -- 변경 후 재고수량
    chg_qty             INTEGER         NOT NULL,               -- 변동수량 (양수=입고, 음수=출고)
    chg_reason_cd       VARCHAR(20)     NOT NULL,               -- 코드: SKU_STOCK_CHG (변동사유)
    chg_reason          VARCHAR(200),                           -- 변동사유 상세
    order_item_id       VARCHAR(21),                            -- 연관 주문상품ID (SALE/RETURN/EXCHANGE/CLAIM 시)
    chg_by              VARCHAR(21),                            -- 처리자 (sy_user.user_id)
    chg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (hist_id)
);

COMMENT ON TABLE pdh_prod_sku_stock_hist IS 'SKU 재고 변경 이력';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.hist_id          IS '이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.sku_id           IS 'SKU ID (pd_prod_sku.sku_id)';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.prod_id          IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.stock_before     IS '변경 전 재고수량';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.stock_after      IS '변경 후 재고수량';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.chg_qty          IS '변동수량 (양수=입고, 음수=출고/판매)';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.chg_reason_cd    IS '변동사유 (코드: SKU_STOCK_CHG — SALE/PURCHASE/RETURN/EXCHANGE/ADJUST/CLAIM/ADMIN)';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.chg_reason       IS '변동사유 상세';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.order_item_id    IS '연관 주문상품ID (od_order_item.order_item_id, SALE/RETURN/EXCHANGE/CLAIM 시)';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.chg_by           IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.chg_date         IS '처리일시';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.reg_by           IS '등록자';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.reg_date         IS '등록일';

CREATE INDEX idx_pdh_prod_sku_stock_hist_sku    ON pdh_prod_sku_stock_hist (sku_id);
CREATE INDEX idx_pdh_prod_sku_stock_hist_prod   ON pdh_prod_sku_stock_hist (prod_id);
CREATE INDEX idx_pdh_prod_sku_stock_hist_date   ON pdh_prod_sku_stock_hist (chg_date);
CREATE INDEX idx_pdh_prod_sku_stock_hist_reason ON pdh_prod_sku_stock_hist (chg_reason_cd);
CREATE INDEX idx_pdh_prod_sku_stock_hist_order  ON pdh_prod_sku_stock_hist (order_item_id) WHERE order_item_id IS NOT NULL;

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pdh_prod_sku_stock_hist.chg_reason_cd (변동사유) : SKU_STOCK_CHG:
--   SALE     : 판매 (주문)
--   PURCHASE : 매입/입고
--   RETURN   : 반품 입고
--   EXCHANGE : 교환 (출고/입고)
--   CLAIM    : 클레임 처리
--   ADJUST   : 재고조정 (실사 후 보정)
--   ADMIN    : 관리자 수동변경

-- ============================================================
-- ec_prod_status_hist : 상품 상태 이력 (status_cd 변경 추적)
-- ============================================================
CREATE TABLE IF NOT EXISTS pdh_prod_status_hist (
    prod_status_hist_id  VARCHAR(21)     NOT NULL,
    site_id              VARCHAR(21),                            -- sy_site.site_id
    prod_id              VARCHAR(21)     NOT NULL,
    before_status_cd     VARCHAR(20),                            -- 이전 상태 (코드: PRODUCT_STATUS)
    after_status_cd      VARCHAR(20)     NOT NULL,               -- 변경 상태
    memo                 VARCHAR(300),                           -- 처리 메모
    proc_user_id              VARCHAR(21),                            -- 처리자 (sy_user.user_id)
    proc_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by               VARCHAR(16),
    reg_date             TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by               VARCHAR(16),
    upd_date             TIMESTAMP,
    PRIMARY KEY (prod_status_hist_id)
);

COMMENT ON TABLE pdh_prod_status_hist IS '상품 상태 이력';
COMMENT ON COLUMN pdh_prod_status_hist.prod_status_hist_id IS '이력ID';
COMMENT ON COLUMN pdh_prod_status_hist.site_id             IS '사이트ID';
COMMENT ON COLUMN pdh_prod_status_hist.prod_id             IS '상품ID';
COMMENT ON COLUMN pdh_prod_status_hist.before_status_cd    IS '이전상태 (코드: PRODUCT_STATUS)';
COMMENT ON COLUMN pdh_prod_status_hist.after_status_cd     IS '변경상태 (코드: PRODUCT_STATUS)';
COMMENT ON COLUMN pdh_prod_status_hist.memo                IS '처리메모';
COMMENT ON COLUMN pdh_prod_status_hist.proc_user_id             IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN pdh_prod_status_hist.proc_date           IS '처리일시';
COMMENT ON COLUMN pdh_prod_status_hist.reg_by              IS '등록자';
COMMENT ON COLUMN pdh_prod_status_hist.reg_date            IS '등록일';
COMMENT ON COLUMN pdh_prod_status_hist.upd_by              IS '수정자';
COMMENT ON COLUMN pdh_prod_status_hist.upd_date            IS '수정일';

CREATE INDEX idx_pdh_prod_status_hist_prod ON pdh_prod_status_hist (prod_id);
CREATE INDEX idx_pdh_prod_status_hist_date ON pdh_prod_status_hist (proc_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pdh_prod_status_hist.before_status_cd (이전상태) : 상품상태 { ON_SALE:판매중, PREPARING:준비중, SOLD_OUT:품절, SUSPENDED:판매중지 }
-- [CODES] pdh_prod_status_hist.after_status_cd (변경상태) : 상품상태 { ON_SALE:판매중, PREPARING:준비중, SOLD_OUT:품절, SUSPENDED:판매중지 }

-- ============================================================
-- ec_prod_view_log : 상품/페이지 조회 로그 (추천·분석용)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 용도: 최근 본 상품, 인기 상품 집계, 개인화 추천 기반 데이터
-- ============================================================
CREATE TABLE IF NOT EXISTS pdh_prod_view_log (
    log_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),
    member_id       VARCHAR(21),                           -- 비회원 NULL
    session_key     VARCHAR(100),                          -- 비회원 세션키
    prod_id       VARCHAR(21)     NOT NULL,              -- PROD
    ref_id          VARCHAR(21),                           -- prod_id별 참조ID (prod_id, category_id 등)
    ref_nm          VARCHAR(200),                          -- 참조명 스냅샷 (상품명 등)
    search_kw       VARCHAR(200),                          -- prod_id=SEARCH 시 검색어
    ip              VARCHAR(50),
    device          VARCHAR(200),                          -- User-Agent
    referrer        VARCHAR(500),                          -- 유입 경로 URL
    view_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (log_id)
);

COMMENT ON TABLE pdh_prod_view_log IS '상품/페이지 조회 로그';
COMMENT ON COLUMN pdh_prod_view_log.log_id     IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pdh_prod_view_log.site_id    IS '사이트ID';
COMMENT ON COLUMN pdh_prod_view_log.member_id  IS '회원ID (비회원 NULL)';
COMMENT ON COLUMN pdh_prod_view_log.session_key IS '비회원 세션키';
COMMENT ON COLUMN pdh_prod_view_log.prod_id  IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pdh_prod_view_log.ref_id     IS '참조ID (prod_id 등)';
COMMENT ON COLUMN pdh_prod_view_log.ref_nm     IS '참조명 스냅샷';
COMMENT ON COLUMN pdh_prod_view_log.search_kw  IS '검색어 (SEARCH 유형)';
COMMENT ON COLUMN pdh_prod_view_log.ip         IS 'IP주소';
COMMENT ON COLUMN pdh_prod_view_log.device     IS 'User-Agent';
COMMENT ON COLUMN pdh_prod_view_log.referrer   IS '유입경로 URL';
COMMENT ON COLUMN pdh_prod_view_log.view_date  IS '조회일시';
COMMENT ON COLUMN pdh_prod_view_log.reg_by     IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pdh_prod_view_log.reg_date   IS '등록일';
COMMENT ON COLUMN pdh_prod_view_log.upd_by     IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pdh_prod_view_log.upd_date   IS '수정일';

CREATE INDEX idx_ec_pvl_member ON pdh_prod_view_log (member_id);
CREATE INDEX idx_ec_pvl_ref    ON pdh_prod_view_log (prod_id, ref_id);
CREATE INDEX idx_ec_pvl_date   ON pdh_prod_view_log (view_date);

-- ============================================================
-- [OD] 도메인
-- ============================================================

-- ============================================================
-- ec_cart : 장바구니
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 설계: 헤더 없이 행 단위로 관리. member_id + prod_id + 옵션 조합이 PK 역할.
-- ============================================================
CREATE TABLE IF NOT EXISTS od_cart (
    cart_id         VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    member_id       VARCHAR(21),                           -- mb_member.member_id (비회원 NULL)
    session_key     VARCHAR(100),                          -- 비회원 세션키
    prod_id         VARCHAR(21)     NOT NULL,              -- pd_prod.prod_id
    sku_id          VARCHAR(21),                           -- pd_prod_sku.sku_id
    opt_item_id_1   VARCHAR(21),                           -- 옵션1 값ID (pd_prod_opt_item.opt_item_id, 예: 색상)
    opt_item_id_2   VARCHAR(21),                           -- 옵션2 값ID (pd_prod_opt_item.opt_item_id, 예: 사이즈)
    unit_price      BIGINT          DEFAULT 0,             -- 단가 (담을 시점)
    order_qty       INTEGER         DEFAULT 1,
    item_price      BIGINT          DEFAULT 0,             -- 소계 (unit_price × order_qty)
    is_checked      CHAR(1)         DEFAULT 'Y',           -- 주문 선택 여부 Y/N
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (cart_id)
);

COMMENT ON TABLE od_cart IS '장바구니';
COMMENT ON COLUMN od_cart.cart_id        IS '장바구니ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_cart.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_cart.member_id      IS '회원ID (비회원 NULL)';
COMMENT ON COLUMN od_cart.session_key    IS '비회원 세션키';
COMMENT ON COLUMN od_cart.prod_id        IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN od_cart.sku_id         IS 'SKU ID (pd_prod_sku.sku_id)';
COMMENT ON COLUMN od_cart.opt_item_id_1  IS '옵션1 값ID (pd_prod_opt_item.opt_item_id, 예: 색상)';
COMMENT ON COLUMN od_cart.opt_item_id_2  IS '옵션2 값ID (pd_prod_opt_item.opt_item_id, 예: 사이즈)';
COMMENT ON COLUMN od_cart.unit_price     IS '단가 (담을 시점 가격)';
COMMENT ON COLUMN od_cart.order_qty      IS '수량';
COMMENT ON COLUMN od_cart.item_price     IS '소계 (단가 × 수량)';
COMMENT ON COLUMN od_cart.is_checked     IS '주문선택여부 Y/N';
COMMENT ON COLUMN od_cart.reg_by         IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_cart.reg_date       IS '등록일';
COMMENT ON COLUMN od_cart.upd_by         IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_cart.upd_date       IS '수정일';

CREATE INDEX idx_od_cart_member  ON od_cart (member_id);
CREATE INDEX idx_od_cart_session ON od_cart (session_key);
CREATE INDEX idx_od_cart_prod    ON od_cart (prod_id);

-- 주문 마스터
CREATE TABLE IF NOT EXISTS od_order (
    order_id        VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    member_id       VARCHAR(21)     NOT NULL,
    member_nm       VARCHAR(50),
    orderer_email   VARCHAR(100),                           -- 주문자 이메일 (주문 시점 스냅샷)
    order_grade_cd  VARCHAR(20),                            -- 주문 시점 회원등급 (코드: MEMBER_GRADE)
    order_date      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    access_channel_cd VARCHAR(20),                          -- 주문유입경로 (코드: ACCESS_CHANNEL — WEB_PC/WEB_MOBILE/APP_IOS/APP_ANDROID)
    -- ── 금액 (현재값 — 클레임으로 변동 시 업데이트) ──
    total_amt           BIGINT      DEFAULT 0,              -- 상품합계금액
    total_discount_amt  BIGINT      DEFAULT 0,              -- 총 할인금액 (쿠폰+프로모션 합계)
    coupon_discount_amt BIGINT      DEFAULT 0,              -- 쿠폰할인금액
    cache_use_amt       BIGINT      DEFAULT 0,              -- 적립금사용금액
    shipping_save_use_amt BIGINT    DEFAULT 0,              -- 배송비 적립금 사용금액
    outbound_shipping_fee BIGINT    DEFAULT 0,              -- 출고배송료
    pay_amt             BIGINT      DEFAULT 0,              -- 실결제금액
    -- ── 원 금액 (주문 확정 시점 스냅샷 — 취소/환불 계산 기준) ──
    org_total_amt           BIGINT,                         -- 원 상품합계금액
    org_total_discount_amt  BIGINT,                         -- 원 총 할인금액
    org_shipping_fee        BIGINT,                         -- 원 배송비
    org_cache_use_amt       BIGINT,                         -- 원 적립금사용금액
    org_pay_amt             BIGINT,                         -- 원 실결제금액
    -- ── 결제 ──
    pay_method_cd   VARCHAR(20),                            -- 코드: PAY_METHOD
    pay_date        TIMESTAMP,
    -- ── 주문상태 ──
    order_status_cd VARCHAR(20)     DEFAULT 'PENDING',      -- 코드: ORDER_STATUS
    order_status_cd_before VARCHAR(20),
    -- ── 배송지 ──
    recv_nm         VARCHAR(50),
    recv_phone      VARCHAR(20),
    recv_zip        VARCHAR(10),
    recv_addr       VARCHAR(200),
    recv_addr_detail VARCHAR(200),
    recv_memo       VARCHAR(200),
    entrance_pwd    VARCHAR(20),                            -- 공동현관 비밀번호
    -- ── 환불 계좌 (무통장/가상계좌 환불 시) ──
    refund_bank_cd  VARCHAR(20),                            -- 코드: BANK_CODE
    refund_account_no VARCHAR(50),
    refund_account_nm VARCHAR(50),
    -- ── 쿠폰/메모 ──
    coupon_id       VARCHAR(21),
    memo            TEXT,
    -- ── 배송 요약 (최신 출고 기준 역정규화) ──
    dliv_courier_cd  VARCHAR(30),                           -- 최근 출고 택배사 (코드: COURIER)
    dliv_tracking_no VARCHAR(100),
    dliv_status_cd   VARCHAR(20),                           -- 배송상태 최신 (코드: DLIV_STATUS)
    dliv_status_cd_before VARCHAR(20),
    dliv_ship_date   TIMESTAMP,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    -- ── 결재처리/추가결재요청 (관리자 일괄작업) ──
    appr_status_cd      VARCHAR(20),                        -- 코드: APPROVAL_STATUS (REQ/APPROVED/REJECTED/DONE)
    appr_status_cd_before VARCHAR(20),
    appr_amt            BIGINT,
    appr_target_cd      VARCHAR(30),                        -- 코드: APPROVAL_TARGET (ORDER/PROD/DLIV/EXTRA)
    appr_target_nm      VARCHAR(200),
    appr_reason         VARCHAR(500),
    appr_req_user_id    VARCHAR(21),
    appr_req_date       TIMESTAMP,
    appr_aprv_user_id   VARCHAR(21),
    appr_aprv_date      TIMESTAMP,
    PRIMARY KEY (order_id)
);

COMMENT ON TABLE od_order IS '주문';
COMMENT ON COLUMN od_order.order_id              IS '주문ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_order.site_id               IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_order.member_id             IS '회원ID';
COMMENT ON COLUMN od_order.member_nm             IS '주문자명';
COMMENT ON COLUMN od_order.orderer_email         IS '주문자 이메일 (주문 시점 스냅샷)';
COMMENT ON COLUMN od_order.order_grade_cd        IS '주문 시점 회원등급 (코드: MEMBER_GRADE)';
COMMENT ON COLUMN od_order.order_date            IS '주문일시';
COMMENT ON COLUMN od_order.access_channel_cd     IS '주문유입경로 (코드: ACCESS_CHANNEL — WEB_PC/WEB_MOBILE/APP_IOS/APP_ANDROID)';
COMMENT ON COLUMN od_order.total_amt             IS '상품합계금액 (현재값)';
COMMENT ON COLUMN od_order.total_discount_amt    IS '총 할인금액 쿠폰+프로모션 합계 (현재값)';
COMMENT ON COLUMN od_order.coupon_discount_amt   IS '쿠폰할인금액';
COMMENT ON COLUMN od_order.cache_use_amt         IS '적립금사용금액';
COMMENT ON COLUMN od_order.shipping_save_use_amt IS '배송비 적립금 사용금액';
COMMENT ON COLUMN od_order.outbound_shipping_fee IS '출고배송료 (현재값)';
COMMENT ON COLUMN od_order.pay_amt               IS '실결제금액 (현재값)';
COMMENT ON COLUMN od_order.org_total_amt         IS '원 상품합계금액 (주문 확정 시점 스냅샷)';
COMMENT ON COLUMN od_order.org_total_discount_amt IS '원 총 할인금액 (주문 확정 시점 스냅샷)';
COMMENT ON COLUMN od_order.org_shipping_fee      IS '원 배송비 (주문 확정 시점 스냅샷)';
COMMENT ON COLUMN od_order.org_cache_use_amt     IS '원 적립금사용금액 (주문 확정 시점 스냅샷)';
COMMENT ON COLUMN od_order.org_pay_amt           IS '원 실결제금액 (주문 확정 시점 스냅샷)';
COMMENT ON COLUMN od_order.pay_method_cd         IS '결제수단 (코드: PAY_METHOD)';
COMMENT ON COLUMN od_order.pay_date              IS '결제일시';
COMMENT ON COLUMN od_order.order_status_cd       IS '주문상태 (코드: ORDER_STATUS)';
COMMENT ON COLUMN od_order.order_status_cd_before IS '변경 전 주문상태 (코드: ORDER_STATUS)';
COMMENT ON COLUMN od_order.recv_nm               IS '수령자명';
COMMENT ON COLUMN od_order.recv_phone            IS '수령자연락처';
COMMENT ON COLUMN od_order.recv_zip              IS '수령자우편번호';
COMMENT ON COLUMN od_order.recv_addr             IS '수령자주소';
COMMENT ON COLUMN od_order.recv_addr_detail      IS '수령자상세주소';
COMMENT ON COLUMN od_order.recv_memo             IS '배송메모';
COMMENT ON COLUMN od_order.entrance_pwd          IS '공동현관 비밀번호';
COMMENT ON COLUMN od_order.refund_bank_cd        IS '환불 은행코드 (코드: BANK_CODE — 무통장/가상계좌 환불 시)';
COMMENT ON COLUMN od_order.refund_account_no     IS '환불 계좌번호';
COMMENT ON COLUMN od_order.refund_account_nm     IS '환불 예금주명';
COMMENT ON COLUMN od_order.coupon_id             IS '사용쿠폰ID';
COMMENT ON COLUMN od_order.memo                  IS '관리메모';
COMMENT ON COLUMN od_order.dliv_courier_cd       IS '최근 출고 택배사 (코드: COURIER)';
COMMENT ON COLUMN od_order.dliv_tracking_no      IS '최근 출고 송장번호';
COMMENT ON COLUMN od_order.dliv_status_cd        IS '배송상태 최신 (코드: DLIV_STATUS)';
COMMENT ON COLUMN od_order.dliv_status_cd_before IS '변경 전 배송상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN od_order.dliv_ship_date        IS '최근 출고일시';
COMMENT ON COLUMN od_order.reg_by                IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_order.reg_date              IS '등록일';
COMMENT ON COLUMN od_order.upd_by               IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_order.upd_date              IS '수정일';
COMMENT ON COLUMN od_order.appr_status_cd        IS '결재상태 (코드: APPROVAL_STATUS)';
COMMENT ON COLUMN od_order.appr_status_cd_before IS '변경 전 결재상태 (코드: APPROVAL_STATUS)';
COMMENT ON COLUMN od_order.appr_amt              IS '결재 요청금액';
COMMENT ON COLUMN od_order.appr_target_cd        IS '결재대상 구분 (코드: APPROVAL_TARGET)';
COMMENT ON COLUMN od_order.appr_target_nm        IS '결재 대상명';
COMMENT ON COLUMN od_order.appr_reason           IS '사유/메모';
COMMENT ON COLUMN od_order.appr_req_user_id      IS '결재 요청자 (sy_user.user_id)';
COMMENT ON COLUMN od_order.appr_req_date         IS '결재 요청일시';
COMMENT ON COLUMN od_order.appr_aprv_user_id     IS '결재자 (sy_user.user_id)';
COMMENT ON COLUMN od_order.appr_aprv_date        IS '결재일시';

CREATE INDEX idx_od_order_member   ON od_order (member_id);
CREATE INDEX idx_od_order_status   ON od_order (order_status_cd);
CREATE INDEX idx_od_order_date     ON od_order (order_date);
CREATE INDEX idx_od_order_channel  ON od_order (access_channel_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] od_order.order_grade_cd (주문 시점 회원등급) : 회원등급 { VIP:VIP, GOLD:우수, NORMAL:일반 }
-- [CODES] od_order.access_channel_cd (주문유입경로) : ACCESS_CHANNEL { WEB_PC:PC웹, WEB_MOBILE:모바일웹, APP_IOS:iOS앱, APP_ANDROID:안드로이드앱 }
-- [CODES] od_order.pay_method_cd (결제수단) : 결제수단 { BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스페이먼츠, KAKAO:카카오페이, NAVER:네이버페이, MOBILE:핸드폰결제, SAVE:적립금결제, ZERO:0원결제 }
-- [CODES] od_order.order_status_cd (주문상태) : 주문상태 { PENDING:입금대기, PAID:결제완료, PREPARING:상품준비중, SHIPPED:배송중, DELIVERED:배송완료, COMPLT:구매확정, CANCELLED:취소, AUTO_CANCELLED:자동취소 }
-- [CODES] od_order.refund_bank_cd (환불 은행코드) : BANK_CODE: 국민/신한/우리/하나/농협/기업/부산/대구/경남/광주/전북/제주/수협/씨티/우체국/새마을/카카오/케이/산업/하나
-- [CODES] od_order.dliv_courier_cd (최근 출고 택배사) : 택배사 { CJ:CJ대한통운, LOTTE:롯데택배, HANJIN:한진택배, POST:우체국택배, LOGEN:로젠택배 }
-- [CODES] od_order.dliv_status_cd (배송상태 최신) : 배송상태 { READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패 }
-- [CODES] od_order.appr_status_cd (결재상태) : APPROVAL_STATUS { REQ:요청, APPROVED:승인, REJECTED:반려, DONE:완료 }
-- [CODES] od_order.appr_target_cd (결재대상 구분) : APPROVAL_TARGET { ORDER:주문, PROD:상품, DLIV:배송, EXTRA:추가결재 }

-- 주문 상품
CREATE TABLE IF NOT EXISTS od_order_item (
    order_item_id   VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    order_id        VARCHAR(21)     NOT NULL,
    prod_id         VARCHAR(21)     NOT NULL,
    sku_id          VARCHAR(21),                            -- pd_prod_sku.sku_id
    opt_item_id_1   VARCHAR(21),                            -- 옵션1 값ID (pd_prod_opt_item.opt_item_id)
    opt_item_id_2   VARCHAR(21),                            -- 옵션2 값ID (pd_prod_opt_item.opt_item_id)
    -- ── 상품 스냅샷 (주문 시점) ──
    prod_nm         VARCHAR(200),                           -- 상품명 스냅샷
    brand_nm        VARCHAR(100),                           -- 브랜드명 스냅샷
    dliv_tmplt_id   VARCHAR(21),                            -- 배송비 템플릿ID 스냅샷
    -- ── 금액 (현재값) ──
    normal_price    BIGINT          DEFAULT 0,              -- 정상가 (할인 전 1ea)
    unit_price      BIGINT          DEFAULT 0,              -- 판매가 (단가, 옵션추가금 포함)
    order_qty       INTEGER         DEFAULT 1,
    item_order_amt  BIGINT          DEFAULT 0,              -- 주문금액 (unit_price × order_qty)
    cancel_qty      INTEGER         DEFAULT 0,
    item_cancel_amt BIGINT          DEFAULT 0,              -- 취소금액 (누적)
    complet_qty     INTEGER         DEFAULT 0,
    item_completed_amt BIGINT       DEFAULT 0,              -- 완료금액
    -- ── 원 금액 (주문 확정 시점 스냅샷) ──
    org_unit_price      BIGINT,                             -- 원 단가
    org_item_order_amt  BIGINT,                             -- 원 주문금액
    org_discount_amt    BIGINT,                             -- 원 할인금액
    org_shipping_fee    BIGINT,                             -- 원 배송료
    -- ── 적립금 ──
    save_rate           DECIMAL(5,2),                       -- 주문 시점 적립율 (%)
    save_use_amt        BIGINT          DEFAULT 0,          -- 사용 적립금 (주문상품별 안분)
    save_schd_amt       BIGINT          DEFAULT 0,          -- 적립 예정금액
    -- ── 주문상태 ──
    order_item_status_cd VARCHAR(20)    DEFAULT 'ORDERED',  -- 코드: ORDER_ITEM_STATUS
    order_item_status_cd_before VARCHAR(20),
    -- ── 클레임/구매확정/정산 ──
    claim_yn            CHAR(1)         DEFAULT 'N',        -- 클레임 진행 중 여부
    buy_confirm_yn      CHAR(1)         DEFAULT 'N',        -- 구매확정여부
    buy_confirm_schd_date DATE,                             -- 구매확정 예정일 (배송완료 + N일)
    buy_confirm_date    TIMESTAMP,                          -- 구매확정일시
    settle_yn           CHAR(1)         DEFAULT 'N',        -- 정산처리여부
    settle_date         TIMESTAMP,
    -- ── 예약판매 ──
    reserve_sale_yn         CHAR(1)     DEFAULT 'N',
    reserve_dliv_schd_date  TIMESTAMP,                      -- 예약판매 발송 예정일시
    -- ── 묶음상품 ──
    bundle_group_id     VARCHAR(36),                        -- 묶음 그룹 키 (동일 묶음 구성품 묶음, UUID)
    bundle_price_rate   DECIMAL(5,2),                       -- 묶음 가격 안분율 (%) — pd_prod_bundle.price_rate 스냅샷
    -- ── 사은품 ──
    gift_id             VARCHAR(21),                        -- 발급 사은품ID (pm_gift.gift_id)
    -- ── 부분배송 시 배송정보 ──
    outbound_shipping_fee BIGINT        DEFAULT 0,
    dliv_courier_cd     VARCHAR(30),                        -- 코드: COURIER
    dliv_tracking_no    VARCHAR(100),
    dliv_ship_date      TIMESTAMP,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (order_item_id)
);

COMMENT ON TABLE od_order_item IS '주문상품';
COMMENT ON COLUMN od_order_item.order_item_id    IS '주문상품ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_order_item.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_order_item.order_id         IS '주문ID (od_order.)';
COMMENT ON COLUMN od_order_item.prod_id          IS '상품ID (pd_prod.)';
COMMENT ON COLUMN od_order_item.sku_id           IS 'SKU ID (pd_prod_sku., 무옵션 시 NULL)';
COMMENT ON COLUMN od_order_item.opt_item_id_1     IS '옵션1 값ID (pd_prod_opt_item.opt_item_id)';
COMMENT ON COLUMN od_order_item.opt_item_id_2     IS '옵션2 값ID (pd_prod_opt_item.opt_item_id)';
COMMENT ON COLUMN od_order_item.prod_nm          IS '상품명 (주문 시점 스냅샷)';
COMMENT ON COLUMN od_order_item.brand_nm         IS '브랜드명 (주문 시점 스냅샷)';
COMMENT ON COLUMN od_order_item.dliv_tmplt_id    IS '배송비 템플릿ID 스냅샷';
COMMENT ON COLUMN od_order_item.normal_price     IS '정상가 (할인 전 1ea 가격)';
COMMENT ON COLUMN od_order_item.unit_price       IS '판매가 (단가, 옵션 추가금액 포함)';
COMMENT ON COLUMN od_order_item.order_qty        IS '주문수량';
COMMENT ON COLUMN od_order_item.item_order_amt   IS '주문금액 (unit_price × order_qty)';
COMMENT ON COLUMN od_order_item.cancel_qty       IS '취소수량';
COMMENT ON COLUMN od_order_item.item_cancel_amt  IS '취소금액 (클레임 누적 취소액)';
COMMENT ON COLUMN od_order_item.complet_qty      IS '판매완료수량';
COMMENT ON COLUMN od_order_item.item_completed_amt IS '완료금액 (item_order_amt - item_cancel_amt)';
COMMENT ON COLUMN od_order_item.org_unit_price   IS '원 단가 (주문 확정 시점 스냅샷)';
COMMENT ON COLUMN od_order_item.org_item_order_amt IS '원 주문금액 (주문 확정 시점 스냅샷)';
COMMENT ON COLUMN od_order_item.org_discount_amt IS '원 할인금액 (주문 확정 시점 스냅샷)';
COMMENT ON COLUMN od_order_item.org_shipping_fee IS '원 배송료 (주문 확정 시점 스냅샷)';
COMMENT ON COLUMN od_order_item.save_rate        IS '주문 시점 적립율 (%)';
COMMENT ON COLUMN od_order_item.save_use_amt     IS '사용 적립금 (주문상품별 안분금액)';
COMMENT ON COLUMN od_order_item.save_schd_amt    IS '적립 예정금액 (구매확정 전=예상, 확정 후=실적립)';
COMMENT ON COLUMN od_order_item.order_item_status_cd IS '품목 주문 상태 (코드: ORDER_ITEM_STATUS — ORDERED/PAID/PREPARING/SHIPPING/DELIVERED/CONFIRMED/CANCELLED)';
COMMENT ON COLUMN od_order_item.order_item_status_cd_before IS '변경 전 품목상태 (코드: ORDER_ITEM_STATUS)';
COMMENT ON COLUMN od_order_item.claim_yn         IS '클레임 진행 중 여부 Y/N';
COMMENT ON COLUMN od_order_item.buy_confirm_yn   IS '구매확정여부 Y/N';
COMMENT ON COLUMN od_order_item.buy_confirm_schd_date IS '구매확정 예정일 (배송완료 + N일 자동 설정)';
COMMENT ON COLUMN od_order_item.buy_confirm_date IS '구매확정일시';
COMMENT ON COLUMN od_order_item.settle_yn        IS '정산처리여부 Y/N';
COMMENT ON COLUMN od_order_item.settle_date      IS '정산처리일시';
COMMENT ON COLUMN od_order_item.reserve_sale_yn       IS '예약판매여부 Y/N';
COMMENT ON COLUMN od_order_item.reserve_dliv_schd_date IS '예약판매 발송 예정일시';
COMMENT ON COLUMN od_order_item.bundle_group_id  IS '묶음 그룹키 (동일 묶음 구성품 식별, UUID, 일반상품=NULL)';
COMMENT ON COLUMN od_order_item.bundle_price_rate IS '묶음 가격 안분율 (%) — 부분클레임 환불 계산 기준';
COMMENT ON COLUMN od_order_item.gift_id          IS '발급 사은품ID (pm_gift.gift_id)';
COMMENT ON COLUMN od_order_item.outbound_shipping_fee IS '해당 항목의 배송료 (부분배송 시)';
COMMENT ON COLUMN od_order_item.dliv_courier_cd  IS '해당 항목의 배송 택배사 (코드: COURIER)';
COMMENT ON COLUMN od_order_item.dliv_tracking_no IS '해당 항목의 배송 송장번호';
COMMENT ON COLUMN od_order_item.dliv_ship_date   IS '해당 항목의 출고일시';
COMMENT ON COLUMN od_order_item.reg_by           IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_order_item.reg_date         IS '등록일';
COMMENT ON COLUMN od_order_item.upd_by           IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_order_item.upd_date         IS '수정일';

CREATE INDEX idx_od_order_item_order    ON od_order_item (order_id);
CREATE INDEX idx_od_order_item_prod     ON od_order_item (prod_id);
CREATE INDEX idx_od_order_item_status   ON od_order_item (order_item_status_cd);
CREATE INDEX idx_od_order_item_confirm  ON od_order_item (buy_confirm_yn, buy_confirm_schd_date);
CREATE INDEX idx_od_order_item_settle   ON od_order_item (settle_yn);
CREATE INDEX idx_od_order_item_bundle   ON od_order_item (bundle_group_id) WHERE bundle_group_id IS NOT NULL;

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] od_order_item.order_item_status_cd (품목 주문 상태) : 주문항목상태 { ORDERED:주문완료, PAID:결제완료, PREPARING:준비중, SHIPPING:배송중, DELIVERED:배송완료, CONFIRMED:구매확정, CANCELLED:취소 }
-- [CODES] od_order_item.dliv_courier_cd (해당 항목의 배송 택배사) : 택배사 { CJ:CJ대한통운, LOTTE:롯데택배, HANJIN:한진택배, POST:우체국택배, LOGEN:로젠택배 }

-- ============================================================
-- od_order_discnt : 주문 할인·차감 내역
-- 주문(order) 단위 쿠폰할인 / 적립금차감 / 캐쉬차감을 행별로 기록
-- 환불 시 주문쿠폰 안분 계산 및 복원 기준 데이터
-- ============================================================
CREATE TABLE IF NOT EXISTS od_order_discnt (
    order_discnt_id     VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    order_id            VARCHAR(21)     NOT NULL,               -- od_order.order_id
    -- ── 할인/차감 구분 ──
    discnt_type_cd      VARCHAR(30)     NOT NULL,               -- 코드: ORDER_DISCNT_TYPE
                                                                --   ORDER_COUPON : 주문쿠폰 할인
                                                                --   SAVE_USE     : 적립금 차감
                                                                --   CACHE_USE    : 캐쉬(충전금) 차감
                                                                --   SHIP_DISCNT  : 배송비 할인
                                                                --   PROMO_DISCNT : 프로모션 할인 (기타)
    -- ── 쿠폰 연결 (ORDER_COUPON인 경우) ──
    coupon_id           VARCHAR(21),                            -- pm_coupon.coupon_id
    coupon_issue_id     VARCHAR(21),                            -- pm_coupon_issue.coupon_issue_id
    -- ── 금액 ──
    discnt_rate         DECIMAL(5,2),                           -- 할인율 (%) — 비율할인인 경우
    discnt_amt          BIGINT          DEFAULT 0,              -- 할인·차감 금액
    -- ── 안분 기준 (주문쿠폰 안분 시 참조) ──
    base_item_amt       BIGINT          DEFAULT 0,              -- 안분 기준 상품금액 합계 (쿠폰 적용 대상 items 합계)
    -- ── 상태 (적립금/캐쉬 차감분 복원 추적) ──
    restore_yn          CHAR(1)         DEFAULT 'N',            -- 복원 여부 (환불 시 적립금/캐쉬 복원 완료)
    restore_amt         BIGINT          DEFAULT 0,              -- 복원된 금액 (부분복원 지원)
    restore_date        TIMESTAMP,                              -- 복원 처리일시
    -- ── 기본 ──
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (order_discnt_id)
);

COMMENT ON TABLE od_order_discnt IS '주문할인·차감 내역 (주문쿠폰·적립금·캐쉬)';
COMMENT ON COLUMN od_order_discnt.order_discnt_id  IS '주문할인ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_order_discnt.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_order_discnt.order_id         IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN od_order_discnt.discnt_type_cd   IS '할인유형코드 (코드: ORDER_DISCNT_TYPE — ORDER_COUPON/SAVE_USE/CACHE_USE/SHIP_DISCNT/PROMO_DISCNT)';
COMMENT ON COLUMN od_order_discnt.coupon_id        IS '쿠폰ID (pm_coupon.coupon_id — ORDER_COUPON인 경우)';
COMMENT ON COLUMN od_order_discnt.coupon_issue_id  IS '쿠폰발급ID (pm_coupon_issue.coupon_issue_id — ORDER_COUPON인 경우)';
COMMENT ON COLUMN od_order_discnt.discnt_rate      IS '할인율 (% — 비율할인인 경우)';
COMMENT ON COLUMN od_order_discnt.discnt_amt       IS '할인·차감 금액';
COMMENT ON COLUMN od_order_discnt.base_item_amt    IS '안분 기준 상품금액 (주문쿠폰 안분 계산용 — 쿠폰 적용 대상 items 합계)';
COMMENT ON COLUMN od_order_discnt.restore_yn       IS '복원여부 Y/N (환불 시 적립금·캐쉬 차감 복원 완료 여부)';
COMMENT ON COLUMN od_order_discnt.restore_amt      IS '복원된 금액 (부분반품 시 부분복원 지원)';
COMMENT ON COLUMN od_order_discnt.restore_date     IS '복원 처리일시';
COMMENT ON COLUMN od_order_discnt.reg_by           IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_order_discnt.reg_date         IS '등록일시';

CREATE INDEX idx_od_order_discnt_order     ON od_order_discnt (order_id);
CREATE INDEX idx_od_order_discnt_type      ON od_order_discnt (discnt_type_cd);
CREATE INDEX idx_od_order_discnt_coupon    ON od_order_discnt (coupon_id) WHERE coupon_id IS NOT NULL;
CREATE INDEX idx_od_order_discnt_restore   ON od_order_discnt (restore_yn);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] od_order_discnt.discnt_type_cd (할인유형코드) : ORDER_DISCNT_TYPE { SALE_PRICE:판매가할인, PAY_DISCNT:결제할인, COUPON:쿠폰, PROMOTION:프로모션, SHIP_DISCNT:배송비할인, PRODUCT_DISCNT:상품할인, CLAIM_SHIP:클레임배송비 }

-- ============================================================
-- od_order_item_discnt : 주문상품 할인 내역
-- 상품(item) 단위 즉시할인 및 상품쿠폰 할인을 행별로 기록
-- 환불 시 개당 유효단가 계산의 기준 데이터
-- ============================================================
CREATE TABLE IF NOT EXISTS od_order_item_discnt (
    item_discnt_id      VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    order_id            VARCHAR(21)     NOT NULL,               -- od_order.order_id
    order_item_id       VARCHAR(21)     NOT NULL,               -- od_order_item.order_item_id
    -- ── 할인 구분 ──
    discnt_type_cd      VARCHAR(30)     NOT NULL,               -- 코드: ORDER_ITEM_DISCNT_TYPE
                                                                --   ITEM_DISCNT  : 즉시할인 (상품 판매가 기준 직접 할인)
                                                                --   ITEM_COUPON  : 상품쿠폰 할인
    -- ── 쿠폰 연결 (ITEM_COUPON인 경우) ──
    coupon_id           VARCHAR(21),                            -- pm_coupon.coupon_id
    coupon_issue_id     VARCHAR(21),                            -- pm_coupon_issue.coupon_issue_id
    -- ── 할인 금액 ──
    discnt_rate         DECIMAL(5,2),                           -- 할인율 (%) — 비율할인인 경우
    unit_discnt_amt     BIGINT          DEFAULT 0,              -- 1개당 할인금액
    total_discnt_amt    BIGINT          DEFAULT 0,              -- 전체 할인금액 (unit_discnt_amt × order_qty)
    order_qty           INTEGER         DEFAULT 1,              -- 주문수량 (스냅샷)
    -- ── 기본 ──
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (item_discnt_id)
);

COMMENT ON TABLE od_order_item_discnt IS '주문상품할인 내역 (즉시할인·상품쿠폰)';
COMMENT ON COLUMN od_order_item_discnt.item_discnt_id   IS '주문상품할인ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_order_item_discnt.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_order_item_discnt.order_id         IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN od_order_item_discnt.order_item_id    IS '주문상품ID (od_order_item.order_item_id)';
COMMENT ON COLUMN od_order_item_discnt.discnt_type_cd   IS '할인유형코드 (코드: ORDER_ITEM_DISCNT_TYPE — ITEM_DISCNT/ITEM_COUPON)';
COMMENT ON COLUMN od_order_item_discnt.coupon_id        IS '쿠폰ID (pm_coupon.coupon_id — ITEM_COUPON인 경우)';
COMMENT ON COLUMN od_order_item_discnt.coupon_issue_id  IS '쿠폰발급ID (pm_coupon_issue.coupon_issue_id — ITEM_COUPON인 경우)';
COMMENT ON COLUMN od_order_item_discnt.discnt_rate      IS '할인율 (% — 비율할인인 경우)';
COMMENT ON COLUMN od_order_item_discnt.unit_discnt_amt  IS '1개당 할인금액';
COMMENT ON COLUMN od_order_item_discnt.total_discnt_amt IS '전체 할인금액 (unit_discnt_amt × order_qty)';
COMMENT ON COLUMN od_order_item_discnt.order_qty        IS '주문수량 스냅샷';
COMMENT ON COLUMN od_order_item_discnt.reg_by           IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_order_item_discnt.reg_date         IS '등록일시';

CREATE INDEX idx_od_item_discnt_order      ON od_order_item_discnt (order_id);
CREATE INDEX idx_od_item_discnt_item       ON od_order_item_discnt (order_item_id);
CREATE INDEX idx_od_item_discnt_type       ON od_order_item_discnt (discnt_type_cd);
CREATE INDEX idx_od_item_discnt_coupon     ON od_order_item_discnt (coupon_id) WHERE coupon_id IS NOT NULL;

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] od_order_item_discnt.discnt_type_cd (할인유형코드) : ORDER_DISCNT_TYPE { SALE_PRICE:판매가할인, PAY_DISCNT:결제할인, COUPON:쿠폰, PROMOTION:프로모션, SHIP_DISCNT:배송비할인, PRODUCT_DISCNT:상품할인, CLAIM_SHIP:클레임배송비 }

-- ============================================================
-- od_pay : 결제 (주문당 N건 결제 가능 - 분할결제 대비)
-- 결제 방식: 무통장입금, 가상계좌, 토스페이먼스(카드/계좌/카카오/네이버),
--           핸드폰결제, 카카오페이, 네이버페이
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS od_pay (
    pay_id              VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    order_id            VARCHAR(21)     NOT NULL,               -- od_order.
    claim_id            VARCHAR(21),                            -- od_claim. (클레임 추가결제 시)
    -- ── 결제 구분 ──
    pay_div_cd          VARCHAR(20),                            -- 주문/클레임 구분 (코드: PAY_DIV — ORDER/CLAIM)
    pay_dir_cd          VARCHAR(20),                            -- 입금/환불 방향 (코드: PAY_DIR — DEPOSIT/REFUND)
    pay_occur_type_cd   VARCHAR(20),                            -- 결제발생유형 (코드: PAY_OCCUR_TYPE — ORDER/CLAIM_EXTRA/EXCHANGE_EXTRA)
    -- ── 결제 기본 ──
    pay_method_cd       VARCHAR(20)     NOT NULL,               -- 코드: PAY_METHOD (BANK_TRANSFER/VBANK/TOSS/KAKAO/NAVER/MOBILE)
    pay_channel_cd      VARCHAR(20),                            -- 코드: PAY_CHANNEL (TOSS인 경우: CARD/ACCOUNT/KAKAO/NAVER)
    pay_amt             BIGINT          NOT NULL,               -- 결제 금액
    pay_status_cd       VARCHAR(20)     DEFAULT 'PENDING',      -- 코드: PAY_STATUS (PENDING/COMPLT/FAILED/CANCELLED/REFUNDED)
    pay_status_cd_before VARCHAR(20),
    pay_date            TIMESTAMP,
    -- ── PG 정보 ──
    pg_company_cd       VARCHAR(20),
    pg_transaction_id   VARCHAR(100),
    pg_approval_no      VARCHAR(50),
    pg_response         TEXT,                                   -- PG 응답 JSON
    -- ── 무통장입금 / 가상계좌 ──
    vbank_account       VARCHAR(20),
    vbank_bank_code     VARCHAR(10),                            -- 코드: BANK_CODE
    vbank_bank_nm       VARCHAR(50),
    vbank_holder_nm     VARCHAR(50),
    vbank_due_date      DATE,
    vbank_deposit_nm    VARCHAR(50),
    vbank_deposit_date  TIMESTAMP,
    -- ── 카드 ──
    card_no             VARCHAR(20),                            -- 마스킹: ****-****-****-5678
    card_issuer_cd      VARCHAR(20),
    card_issuer_nm      VARCHAR(50),
    card_type_cd        VARCHAR(20),                            -- 코드: CARD_TYPE (CREDIT/DEBIT/CHECK)
    installment_month   INTEGER         DEFAULT 0,              -- 할부 개월수 (0=일시불)
    -- ── 환불 정보 ──
    refund_amt          BIGINT          DEFAULT 0,
    refund_status_cd    VARCHAR(20),                            -- 코드: REFUND_STATUS (PENDING/COMPLT/FAILED)
    refund_status_cd_before VARCHAR(20),
    refund_date         TIMESTAMP,
    refund_reason       VARCHAR(300),
    -- ── 오류 정보 ──
    failure_reason      VARCHAR(500),
    failure_code        VARCHAR(50),
    failure_date        TIMESTAMP,
    -- ── 기본 ──
    memo                VARCHAR(300),
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (pay_id),
    CONSTRAINT fk_od_pay_order FOREIGN KEY (order_id) REFERENCES od_order (order_id)
);

COMMENT ON TABLE od_pay IS '결제 (주문당 N건 결제 가능 — 분할결제)';
COMMENT ON COLUMN od_pay.pay_id              IS '결제ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_pay.site_id             IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_pay.order_id            IS '주문ID (od_order.)';
COMMENT ON COLUMN od_pay.claim_id            IS '클레임ID (od_claim. — 클레임 추가결제 시)';
COMMENT ON COLUMN od_pay.pay_div_cd          IS '주문/클레임 구분 (코드: PAY_DIV — ORDER/CLAIM)';
COMMENT ON COLUMN od_pay.pay_dir_cd          IS '입금/환불 방향 (코드: PAY_DIR — DEPOSIT/REFUND)';
COMMENT ON COLUMN od_pay.pay_occur_type_cd   IS '결제발생유형 (코드: PAY_OCCUR_TYPE — ORDER/CLAIM_EXTRA/EXCHANGE_EXTRA)';
COMMENT ON COLUMN od_pay.pay_method_cd       IS '결제수단 (코드: PAY_METHOD)';
COMMENT ON COLUMN od_pay.pay_channel_cd      IS '결제채널 (코드: PAY_CHANNEL — TOSS만: CARD/ACCOUNT/KAKAO/NAVER)';
COMMENT ON COLUMN od_pay.pay_amt             IS '결제 금액';
COMMENT ON COLUMN od_pay.pay_status_cd       IS '결제상태 (코드: PAY_STATUS)';
COMMENT ON COLUMN od_pay.pay_status_cd_before IS '변경 전 결제상태 (코드: PAY_STATUS)';
COMMENT ON COLUMN od_pay.pay_date            IS '결제 완료일시';
COMMENT ON COLUMN od_pay.pg_company_cd       IS 'PG사 (TOSS/KAKAO/NAVER 등)';
COMMENT ON COLUMN od_pay.pg_transaction_id   IS 'PG 거래ID';
COMMENT ON COLUMN od_pay.pg_approval_no      IS 'PG 승인번호';
COMMENT ON COLUMN od_pay.pg_response         IS 'PG 응답 데이터 (JSON)';
COMMENT ON COLUMN od_pay.vbank_account       IS '가상계좌 계좌번호';
COMMENT ON COLUMN od_pay.vbank_bank_code     IS '가상계좌 은행코드 (코드: BANK_CODE)';
COMMENT ON COLUMN od_pay.vbank_bank_nm       IS '가상계좌 은행명';
COMMENT ON COLUMN od_pay.vbank_holder_nm     IS '가상계좌 예금주명';
COMMENT ON COLUMN od_pay.vbank_due_date      IS '가상계좌 입금기한';
COMMENT ON COLUMN od_pay.vbank_deposit_nm    IS '가상계좌 입금자명';
COMMENT ON COLUMN od_pay.vbank_deposit_date  IS '가상계좌 입금확인일시';
COMMENT ON COLUMN od_pay.card_no             IS '카드번호 (마스킹: ****-****-****-5678)';
COMMENT ON COLUMN od_pay.card_issuer_cd      IS '카드사 코드';
COMMENT ON COLUMN od_pay.card_issuer_nm      IS '카드사명';
COMMENT ON COLUMN od_pay.card_type_cd        IS '카드 타입 (코드: CARD_TYPE — CREDIT/DEBIT/CHECK)';
COMMENT ON COLUMN od_pay.installment_month   IS '할부 개월수 (0=일시불)';
COMMENT ON COLUMN od_pay.refund_amt          IS '환불 금액';
COMMENT ON COLUMN od_pay.refund_status_cd    IS '환불 상태 (코드: REFUND_STATUS)';
COMMENT ON COLUMN od_pay.refund_status_cd_before IS '변경 전 환불상태 (코드: REFUND_STATUS)';
COMMENT ON COLUMN od_pay.refund_date         IS '환불 완료일시';
COMMENT ON COLUMN od_pay.refund_reason       IS '환불 사유';
COMMENT ON COLUMN od_pay.failure_reason      IS '결제 실패 사유';
COMMENT ON COLUMN od_pay.failure_code        IS '결제 실패 코드 (PG 오류코드)';
COMMENT ON COLUMN od_pay.failure_date        IS '결제 실패일시';
COMMENT ON COLUMN od_pay.memo                IS '메모';
COMMENT ON COLUMN od_pay.reg_by              IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_pay.reg_date            IS '등록일';
COMMENT ON COLUMN od_pay.upd_by              IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_pay.upd_date            IS '수정일';

CREATE INDEX idx_od_pay_order         ON od_pay (order_id);
CREATE INDEX idx_od_pay_claim         ON od_pay (claim_id) WHERE claim_id IS NOT NULL;
CREATE INDEX idx_od_pay_method        ON od_pay (pay_method_cd, pay_status_cd);
CREATE INDEX idx_od_pay_status        ON od_pay (pay_status_cd);
CREATE INDEX idx_od_pay_date          ON od_pay (pay_date);
CREATE INDEX idx_od_pay_pg_tid        ON od_pay (pg_transaction_id);
CREATE INDEX idx_od_pay_vbank_due     ON od_pay (vbank_due_date) WHERE vbank_due_date IS NOT NULL;
CREATE INDEX idx_od_pay_div           ON od_pay (pay_div_cd, pay_dir_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] od_pay.pay_div_cd (주문/클레임 구분) : PAY_DIV { ORDER:주문, CLAIM:클레임 }
-- [CODES] od_pay.pay_dir_cd (입금/환불 방향) : PAY_DIR { DEPOSIT:입금, REFUND:환불 }
-- [CODES] od_pay.pay_occur_type_cd (결제발생유형) : PAY_OCCUR_TYPE { ORDER:주문결제, CLAIM_EXTRA:클레임추가, EXCHANGE_EXTRA:교환추가 }
-- [CODES] od_pay.pay_method_cd (결제수단) : 결제수단 { BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스페이먼츠, KAKAO:카카오페이, NAVER:네이버페이, MOBILE:핸드폰결제, SAVE:적립금결제, ZERO:0원결제 }
-- [CODES] od_pay.pay_channel_cd (결제채널) : PAY_CHANNEL { CARD:카드, ACCOUNT:계좌, KAKAO:카카오, NAVER:네이버 }
-- [CODES] od_pay.pay_status_cd (결제상태) : PAY_STATUS { PENDING:대기, COMPLT:완료, FAILED:실패, CANCELLED:취소, PARTIAL_REFUND:부분환불, REFUNDED:전액환불 }
-- [CODES] od_pay.card_type_cd (카드 타입) : CARD_TYPE { CREDIT:신용, DEBIT:직불, CHECK:체크 }
-- [CODES] od_pay.refund_status_cd (환불 상태) : REFUND_STATUS { PENDING:대기, COMPLT:완료, FAILED:실패 }

-- ============================================================
CREATE TABLE IF NOT EXISTS od_pay_method (
    pay_method_id              VARCHAR(21)     NOT NULL,
    member_id               VARCHAR(21)     NOT NULL,               -- mb_member.member_id
    pay_method_type_cd      VARCHAR(20)     NOT NULL,               -- 코드: PAY_METHOD (CARD/BANK/KAKAO/NAVER/TOSS 등)
    pay_method_nm              VARCHAR(100)    NOT NULL,               -- 결제수단 이름 (예: 신한카드, 카카오페이)
    pay_method_alias           VARCHAR(100),                           -- 별칭 (사용자 설정)
    pay_key_no              VARCHAR(200),                           -- 결제 게이트웨이 키 (카드/계좌 토큰)
    main_method_yn             VARCHAR(1)      DEFAULT 'N',            -- 기본결제수단 여부
    reg_by                  VARCHAR(16),
    reg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(16),
    upd_date                TIMESTAMP,
    PRIMARY KEY (pay_method_id)
);

COMMENT ON TABLE od_pay_method IS '마이페이지 등록 결제수단';
COMMENT ON COLUMN od_pay_method.pay_method_id           IS '결제수단ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_pay_method.member_id            IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN od_pay_method.pay_method_type_cd   IS '결제수단유형코드 (코드: PAY_METHOD)';
COMMENT ON COLUMN od_pay_method.pay_method_nm           IS '결제수단명 (카드사명, 은행명 등)';
COMMENT ON COLUMN od_pay_method.pay_method_alias        IS '별칭 (사용자 설정)';
COMMENT ON COLUMN od_pay_method.pay_key_no           IS '결제 게이트웨이 발급 키/토큰';
COMMENT ON COLUMN od_pay_method.main_method_yn          IS '기본결제수단여부 Y/N';
COMMENT ON COLUMN od_pay_method.reg_by               IS '등록자ID';
COMMENT ON COLUMN od_pay_method.reg_date             IS '등록일시';
COMMENT ON COLUMN od_pay_method.upd_by               IS '수정자ID';
COMMENT ON COLUMN od_pay_method.upd_date             IS '수정일시';

CREATE INDEX idx_od_pay_method_member ON od_pay_method (member_id);
CREATE INDEX idx_od_pay_method_type   ON od_pay_method (pay_method_type_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] od_pay_method.pay_method_type_cd (결제수단유형코드) : PAY_METHOD { BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스페이먼츠, KAKAO:카카오페이, NAVER:네이버페이, MOBILE:핸드폰결제, SAVE:적립금결제, ZERO:0원결제 }

-- ============================================================
-- od_refund : 환불 마스터
-- 클레임(취소/반품) 1건당 1개의 환불 레코드 생성
-- 환불 총액 및 상태 관리 — 수단별 내역은 od_refund_method
-- ============================================================
CREATE TABLE IF NOT EXISTS od_refund (
    refund_id           VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    order_id            VARCHAR(21)     NOT NULL,               -- od_order.order_id
    claim_id            VARCHAR(21),                            -- od_claim.claim_id (클레임 환불 시)
    -- ── 환불 구분 ──
    refund_type_cd      VARCHAR(20)     NOT NULL,               -- 코드: REFUND_TYPE
                                                                --   CANCEL   : 주문취소 환불
                                                                --   RETURN   : 반품 환불
                                                                --   PARTIAL  : 부분환불
                                                                --   EXTRA    : 추가결제 환불 (교환 취소 등)
    -- ── 환불 금액 ──
    refund_prod_amt     BIGINT          DEFAULT 0,              -- 환불 상품금액 (쿠폰안분 차감 후)
    refund_coupon_amt   BIGINT          DEFAULT 0,              -- 주문쿠폰 안분 차감액 (차감되어 미환불)
    refund_ship_amt     BIGINT          DEFAULT 0,              -- 환불 배송비 (음수=추가청구)
    refund_save_amt     BIGINT          DEFAULT 0,              -- 적립금 복원금액
    refund_cache_amt    BIGINT          DEFAULT 0,              -- 캐쉬 복원금액
    total_refund_amt    BIGINT          DEFAULT 0,              -- 총 환불금액 (실결제 환불 합계)
    -- ── 환불 상태 ──
    refund_status_cd    VARCHAR(20)     DEFAULT 'PENDING',      -- 코드: REFUND_STATUS
                                                                --   PENDING  : 환불 대기
                                                                --   COMPLT   : 환불 완료
                                                                --   FAILED   : 환불 실패
                                                                --   PARTIAL  : 부분완료 (일부 수단 완료)
    refund_status_cd_before VARCHAR(20),
    refund_req_date     TIMESTAMP,                              -- 환불 요청일시
    refund_complt_date  TIMESTAMP,                              -- 환불 완료일시
    -- ── 귀책 정보 ──
    fault_type_cd       VARCHAR(20),                            -- 코드: CLAIM_FAULT (CUST/VENDOR/PLATFORM)
    -- ── 메모 ──
    refund_reason       VARCHAR(500),
    memo                VARCHAR(300),
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (refund_id)
);

COMMENT ON TABLE od_refund IS '환불 마스터 (클레임 건별 환불 총괄)';
COMMENT ON COLUMN od_refund.refund_id           IS '환불ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_refund.site_id             IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_refund.order_id            IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN od_refund.claim_id            IS '클레임ID (od_claim.claim_id)';
COMMENT ON COLUMN od_refund.refund_type_cd      IS '환불유형코드 (코드: REFUND_TYPE — CANCEL/RETURN/PARTIAL/EXTRA)';
COMMENT ON COLUMN od_refund.refund_prod_amt     IS '환불 상품금액 (주문쿠폰 안분 차감 후 실환불 대상액)';
COMMENT ON COLUMN od_refund.refund_coupon_amt   IS '주문쿠폰 안분 차감액 (환불 불가 — 쿠폰 재발급 또는 소멸)';
COMMENT ON COLUMN od_refund.refund_ship_amt     IS '환불 배송비 (음수이면 추가청구)';
COMMENT ON COLUMN od_refund.refund_save_amt     IS '적립금 복원금액 (od_order_discnt.SAVE_USE 기준)';
COMMENT ON COLUMN od_refund.refund_cache_amt    IS '캐쉬 복원금액 (od_order_discnt.CACHE_USE 기준)';
COMMENT ON COLUMN od_refund.total_refund_amt    IS '총 환불금액 (실결제 수단으로 돌려주는 합계)';
COMMENT ON COLUMN od_refund.refund_status_cd    IS '환불상태 (코드: REFUND_STATUS — PENDING/COMPLT/FAILED/PARTIAL)';
COMMENT ON COLUMN od_refund.refund_status_cd_before IS '변경 전 환불상태 (코드: REFUND_STATUS)';
COMMENT ON COLUMN od_refund.refund_req_date     IS '환불 요청일시';
COMMENT ON COLUMN od_refund.refund_complt_date  IS '환불 완료일시';
COMMENT ON COLUMN od_refund.fault_type_cd       IS '귀책유형코드 (코드: CLAIM_FAULT — CUST/VENDOR/PLATFORM)';
COMMENT ON COLUMN od_refund.refund_reason       IS '환불 사유';
COMMENT ON COLUMN od_refund.memo                IS '관리 메모';
COMMENT ON COLUMN od_refund.reg_by              IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_refund.reg_date            IS '등록일시';
COMMENT ON COLUMN od_refund.upd_by              IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_refund.upd_date            IS '수정일시';

CREATE INDEX idx_od_refund_order     ON od_refund (order_id);
CREATE INDEX idx_od_refund_claim     ON od_refund (claim_id) WHERE claim_id IS NOT NULL;
CREATE INDEX idx_od_refund_status    ON od_refund (refund_status_cd);
CREATE INDEX idx_od_refund_req_date  ON od_refund (refund_req_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] od_refund.refund_type_cd (환불유형코드) : REFUND_TYPE { CANCEL:취소환불, RETURN:반품환불, PARTIAL:부분환불, EXTRA:추가결제 }
-- [CODES] od_refund.refund_status_cd (환불상태) : REFUND_STATUS { PENDING:대기, COMPLT:완료, FAILED:실패 }
-- [CODES] od_refund.fault_type_cd (귀책유형코드) : FAULT_TYPE { CUST:고객귀책, VENDOR:업체귀책, PLATFORM:플랫폼귀책 }

-- ============================================================
-- od_refund_method : 환불수단 내역
-- 환불 1건에 대해 결제수단별(카드/캐쉬/적립금) 환불금액을 기록
-- 우선순위: 카드(1) → 캐쉬(2) → 적립금(3)
-- ============================================================
CREATE TABLE IF NOT EXISTS od_refund_method (
    refund_method_id    VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    refund_id           VARCHAR(21)     NOT NULL,               -- od_refund.refund_id
    order_id            VARCHAR(21)     NOT NULL,               -- od_order.order_id (조회 편의)
    -- ── 수단 정보 ──
    pay_method_cd       VARCHAR(20)     NOT NULL,               -- 코드: PAY_METHOD (BANK_TRANSFER/VBANK/TOSS/KAKAO/NAVER/MOBILE/CACHE/SAVE)
                                                                --   CACHE : 캐쉬(충전금) 차감분 환불
                                                                --   SAVE  : 적립금 차감분 환불
    refund_priority     SMALLINT        DEFAULT 1,              -- 환불 우선순위 (1=카드/현금성, 2=캐쉬, 3=적립금)
    -- ── 금액 ──
    refund_amt          BIGINT          DEFAULT 0,              -- 해당 수단으로 환불할 금액
    refund_avail_amt    BIGINT          DEFAULT 0,              -- 해당 수단 잔여 환불 가능금액 (원 결제금액 - 기환불액)
    -- ── 처리 정보 ──
    refund_status_cd    VARCHAR(20)     DEFAULT 'PENDING',      -- 코드: REFUND_STATUS (PENDING/COMPLT/FAILED)
    refund_status_cd_before VARCHAR(20),
    refund_date         TIMESTAMP,                              -- 해당 수단 환불 완료일시
    -- ── PG/내부 처리 참조 ──
    pay_id              VARCHAR(21),                            -- od_pay.pay_id (원 결제 레코드 참조)
    pg_refund_id        VARCHAR(100),                           -- PG 환불 거래ID
    pg_response         TEXT,                                   -- PG 환불 응답 JSON
    -- ── 기본 ──
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (refund_method_id)
);

COMMENT ON TABLE od_refund_method IS '환불수단 내역 (수단별 환불금액 및 우선순위)';
COMMENT ON COLUMN od_refund_method.refund_method_id  IS '환불수단ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_refund_method.site_id           IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_refund_method.refund_id         IS '환불ID (od_refund.refund_id)';
COMMENT ON COLUMN od_refund_method.order_id          IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN od_refund_method.pay_method_cd     IS '결제수단코드 (코드: PAY_METHOD — BANK_TRANSFER/VBANK/TOSS/KAKAO/NAVER/MOBILE/CACHE/SAVE)';
COMMENT ON COLUMN od_refund_method.refund_priority   IS '환불 우선순위 (1=카드·현금성 결제수단, 2=캐쉬, 3=적립금)';
COMMENT ON COLUMN od_refund_method.refund_amt        IS '해당 수단으로 환불할 금액';
COMMENT ON COLUMN od_refund_method.refund_avail_amt  IS '해당 수단 잔여 환불 가능금액 (원 결제액 - 기환불 누적액)';
COMMENT ON COLUMN od_refund_method.refund_status_cd  IS '수단별 환불상태 (코드: REFUND_STATUS — PENDING/COMPLT/FAILED)';
COMMENT ON COLUMN od_refund_method.refund_status_cd_before IS '변경 전 환불상태 (코드: REFUND_STATUS)';
COMMENT ON COLUMN od_refund_method.refund_date       IS '해당 수단 환불 완료일시';
COMMENT ON COLUMN od_refund_method.pay_id            IS '원 결제 레코드ID (od_pay.pay_id)';
COMMENT ON COLUMN od_refund_method.pg_refund_id      IS 'PG 환불 거래ID';
COMMENT ON COLUMN od_refund_method.pg_response       IS 'PG 환불 응답 JSON';
COMMENT ON COLUMN od_refund_method.reg_by            IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_refund_method.reg_date          IS '등록일시';
COMMENT ON COLUMN od_refund_method.upd_by            IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_refund_method.upd_date          IS '수정일시';

CREATE INDEX idx_od_refund_method_refund  ON od_refund_method (refund_id);
CREATE INDEX idx_od_refund_method_order   ON od_refund_method (order_id);
CREATE INDEX idx_od_refund_method_pay     ON od_refund_method (pay_id) WHERE pay_id IS NOT NULL;
CREATE INDEX idx_od_refund_method_status  ON od_refund_method (refund_status_cd);
CREATE INDEX idx_od_refund_method_prio    ON od_refund_method (refund_id, refund_priority);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] od_refund_method.pay_method_cd (결제수단코드) : 결제수단 { BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스페이먼츠, KAKAO:카카오페이, NAVER:네이버페이, MOBILE:핸드폰결제, SAVE:적립금결제, ZERO:0원결제 }
-- [CODES] od_refund_method.refund_status_cd (수단별 환불상태) : REFUND_STATUS { PENDING:대기, COMPLT:완료, FAILED:실패 }

-- 배송 (1주문 N배송 가능 — 정상출고/반품반입/교환배송)
CREATE TABLE IF NOT EXISTS od_dliv (
    dliv_id         VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    order_id        VARCHAR(21)     NOT NULL,
    claim_id        VARCHAR(21),                            -- od_claim. (클레임 배송일 때만)
    vendor_id       VARCHAR(21),                            -- 분리출고 시 담당 업체
    member_id       VARCHAR(21),
    member_nm       VARCHAR(50),
    -- ── 수령지 ──
    recv_nm         VARCHAR(50),
    recv_phone      VARCHAR(20),
    recv_zip        VARCHAR(10),
    recv_addr       VARCHAR(200),
    recv_addr_detail VARCHAR(200),
    -- ── 배송 구분/유형 ──
    dliv_div_cd     VARCHAR(20)     DEFAULT 'OUTBOUND',     -- 코드: DLIV_DIV (OUTBOUND/INBOUND)
    dliv_type_cd    VARCHAR(20),                            -- 코드: DLIV_TYPE (NORMAL/RETURN/EXCHANGE/EXCHANGE_OUT)
    dliv_pay_type_cd VARCHAR(20),                           -- 선결제/착불 (코드: DLIV_PAY_TYPE — PREPAY/COD)
    -- ── 출고 (발송) ──
    outbound_courier_cd  VARCHAR(30),                       -- 코드: COURIER
    outbound_tracking_no VARCHAR(100),
    -- ── 반입 (반품 수거) ──
    inbound_courier_cd  VARCHAR(30),                        -- 코드: COURIER
    inbound_tracking_no VARCHAR(100),
    -- ── 배송 상태 ──
    dliv_status_cd  VARCHAR(20)     DEFAULT 'READY',        -- 코드: DLIV_STATUS
    dliv_status_cd_before VARCHAR(20),
    dliv_ship_date  TIMESTAMP,
    dliv_date       TIMESTAMP,
    dliv_memo       VARCHAR(300),
    -- ── 배송비 ──
    shipping_fee         BIGINT      DEFAULT 0,             -- 배송료 (현재값)
    org_shipping_fee     BIGINT,                            -- 원 배송비 (할인 전 스냅샷)
    shipping_discount_amt BIGINT     DEFAULT 0,             -- 배송비 쿠폰할인금액
    shipping_fee_type_cd VARCHAR(20),                       -- 코드: SHIPPING_FEE_TYPE (OUTBOUND/RETURN/INBOUND/EXCHANGE)
    -- ── 교환 참조 ──
    parent_dliv_id  VARCHAR(21),                            -- 교환 시 원본 배송 참조
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    -- ── 결재처리/추가결재요청 (관리자 일괄작업) ──
    appr_status_cd      VARCHAR(20),                        -- 코드: APPROVAL_STATUS
    appr_status_cd_before VARCHAR(20),
    appr_amt            BIGINT,
    appr_target_cd      VARCHAR(30),                        -- 코드: APPROVAL_TARGET
    appr_target_nm      VARCHAR(200),
    appr_reason         VARCHAR(500),
    appr_req_user_id    VARCHAR(21),
    appr_req_date       TIMESTAMP,
    appr_aprv_user_id   VARCHAR(21),
    appr_aprv_date      TIMESTAMP,
    PRIMARY KEY (dliv_id)
);

COMMENT ON TABLE od_dliv IS '배송 (1주문 N배송 가능 — 정상출고/반품반입/교환배송)';
COMMENT ON COLUMN od_dliv.dliv_id            IS '배송ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_dliv.site_id            IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_dliv.order_id           IS '주문ID (od_order.)';
COMMENT ON COLUMN od_dliv.claim_id           IS '클레임ID (od_claim., 클레임 배송일 때만)';
COMMENT ON COLUMN od_dliv.vendor_id          IS '출고 업체ID (벤더별 분리출고 시)';
COMMENT ON COLUMN od_dliv.member_id          IS '회원ID';
COMMENT ON COLUMN od_dliv.member_nm          IS '주문자명';
COMMENT ON COLUMN od_dliv.recv_nm            IS '수령자명';
COMMENT ON COLUMN od_dliv.recv_phone         IS '수령자연락처';
COMMENT ON COLUMN od_dliv.recv_zip           IS '우편번호';
COMMENT ON COLUMN od_dliv.recv_addr          IS '주소';
COMMENT ON COLUMN od_dliv.recv_addr_detail   IS '상세주소';
COMMENT ON COLUMN od_dliv.dliv_div_cd        IS '입출고구분 (코드: DLIV_DIV — OUTBOUND/INBOUND)';
COMMENT ON COLUMN od_dliv.dliv_type_cd       IS '배송유형 (코드: DLIV_TYPE — NORMAL/RETURN/EXCHANGE/EXCHANGE_OUT)';
COMMENT ON COLUMN od_dliv.dliv_pay_type_cd   IS '배송비결제방식 (코드: DLIV_PAY_TYPE — PREPAY/COD)';
COMMENT ON COLUMN od_dliv.outbound_courier_cd IS '출고(발송) 택배사 (코드: COURIER)';
COMMENT ON COLUMN od_dliv.outbound_tracking_no IS '출고(발송) 송장번호';
COMMENT ON COLUMN od_dliv.inbound_courier_cd IS '반입 택배사 (반품일 때만, 코드: COURIER)';
COMMENT ON COLUMN od_dliv.inbound_tracking_no IS '반입 송장번호';
COMMENT ON COLUMN od_dliv.dliv_status_cd     IS '배송상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN od_dliv.dliv_status_cd_before IS '변경 전 배송상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN od_dliv.dliv_ship_date     IS '출고일시';
COMMENT ON COLUMN od_dliv.dliv_date          IS '배송완료일시';
COMMENT ON COLUMN od_dliv.dliv_memo          IS '메모';
COMMENT ON COLUMN od_dliv.shipping_fee       IS '배송료 (현재값)';
COMMENT ON COLUMN od_dliv.org_shipping_fee   IS '원 배송비 (할인 전 스냅샷)';
COMMENT ON COLUMN od_dliv.shipping_discount_amt IS '배송비 쿠폰할인금액';
COMMENT ON COLUMN od_dliv.shipping_fee_type_cd IS '배송료 구분 (코드: SHIPPING_FEE_TYPE — OUTBOUND/RETURN/INBOUND/EXCHANGE)';
COMMENT ON COLUMN od_dliv.parent_dliv_id     IS '부모 배송ID (교환 시 원본 배송 참조)';
COMMENT ON COLUMN od_dliv.reg_by             IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_dliv.reg_date           IS '등록일';
COMMENT ON COLUMN od_dliv.upd_by             IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_dliv.upd_date           IS '수정일';
COMMENT ON COLUMN od_dliv.appr_status_cd     IS '결재상태 (코드: APPROVAL_STATUS)';
COMMENT ON COLUMN od_dliv.appr_status_cd_before IS '변경 전 결재상태 (코드: APPROVAL_STATUS)';
COMMENT ON COLUMN od_dliv.appr_amt           IS '결재 요청금액';
COMMENT ON COLUMN od_dliv.appr_target_cd     IS '결재대상 구분 (코드: APPROVAL_TARGET)';
COMMENT ON COLUMN od_dliv.appr_target_nm     IS '결재 대상명';
COMMENT ON COLUMN od_dliv.appr_reason        IS '사유/메모';
COMMENT ON COLUMN od_dliv.appr_req_user_id   IS '결재 요청자 (sy_user.user_id)';
COMMENT ON COLUMN od_dliv.appr_req_date      IS '결재 요청일시';
COMMENT ON COLUMN od_dliv.appr_aprv_user_id  IS '결재자 (sy_user.user_id)';
COMMENT ON COLUMN od_dliv.appr_aprv_date     IS '결재일시';

CREATE INDEX idx_od_dliv_order     ON od_dliv (order_id);
CREATE INDEX idx_od_dliv_claim     ON od_dliv (claim_id) WHERE claim_id IS NOT NULL;
CREATE INDEX idx_od_dliv_status    ON od_dliv (dliv_status_cd);
CREATE INDEX idx_od_dliv_type      ON od_dliv (dliv_div_cd, dliv_type_cd);
CREATE INDEX idx_od_dliv_ship_date ON od_dliv (dliv_ship_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] od_dliv.dliv_div_cd (입출고구분) : DLIV_DIV { OUTBOUND:출고, INBOUND:입고 }
-- [CODES] od_dliv.dliv_type_cd (배송유형) : DLIV_TYPE { NORMAL:일반, RETURN:반품, EXCHANGE:교환, EXCHANGE_OUT:교환출고 }
-- [CODES] od_dliv.dliv_pay_type_cd (배송비결제방식) : DLIV_PAY_TYPE { PREPAY:선불, COD:착불 }
-- [CODES] od_dliv.outbound_courier_cd (출고(발송) 택배사) : 택배사 { CJ:CJ대한통운, LOTTE:롯데택배, HANJIN:한진택배, POST:우체국택배, LOGEN:로젠택배 }
-- [CODES] od_dliv.dliv_status_cd (배송상태) : 배송상태 { READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패 }
-- [CODES] od_dliv.shipping_fee_type_cd (배송료 구분) : SHIPPING_FEE_TYPE { OUTBOUND:발송비, RETURN:반품비, INBOUND:반입비, EXCHANGE:교환비 }
-- [CODES] od_dliv.appr_status_cd (결재상태) : APPROVAL_STATUS { REQ:요청, APPROVED:승인, REJECTED:반려, DONE:완료 }
-- [CODES] od_dliv.appr_target_cd (결재대상 구분) : APPROVAL_TARGET { ORDER:주문, PROD:상품, DLIV:배송, EXTRA:추가결재 }

-- 배송 항목 (이 배송에 포함된 주문상품 명세)
-- 1 ec_dliv → N ec_dliv_item → 1 ec_order_item (1:1 참조)
-- 부분출고 시 qty < order_item.qty 가능
CREATE TABLE IF NOT EXISTS od_dliv_item (
    dliv_item_id    VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    dliv_id         VARCHAR(21)     NOT NULL,
    order_item_id   VARCHAR(21)     NOT NULL,               -- 원 주문상품ID
    prod_id         VARCHAR(21),
    opt_item_id_1   VARCHAR(21),                            -- 옵션1 값ID (pd_prod_opt_item.opt_item_id)
    opt_item_id_2   VARCHAR(21),                            -- 옵션2 값ID (pd_prod_opt_item.opt_item_id)
    dliv_type_cd    VARCHAR(20)     DEFAULT 'OUT',           -- 입출고구분: OUT 출고 / IN 입고(반품)
    unit_price      BIGINT          DEFAULT 0,
    dliv_qty        INTEGER         DEFAULT 1,              -- 이 배송의 출고수량 (부분출고 시 < 주문수량)
    dliv_item_status_cd VARCHAR(20)     DEFAULT 'READY',        -- 코드: DLIV_STATUS (항목별 추적)
    dliv_item_status_cd_before VARCHAR(20),                  -- 변경 전 배송상태
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (dliv_item_id),
    UNIQUE (dliv_id, order_item_id)                        -- 동일 배송 내 중복 방지
);

COMMENT ON TABLE od_dliv_item IS '배송 항목 (배송에 포함된 주문상품 명세)';
COMMENT ON COLUMN od_dliv_item.dliv_item_id  IS '배송항목ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_dliv_item.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_dliv_item.dliv_id       IS '배송ID (od_dliv.)';
COMMENT ON COLUMN od_dliv_item.order_item_id IS '주문상품ID (od_order_item.)';
COMMENT ON COLUMN od_dliv_item.prod_id       IS '상품ID';
COMMENT ON COLUMN od_dliv_item.opt_item_id_1 IS '옵션1 값ID (pd_prod_opt_item.opt_item_id)';
COMMENT ON COLUMN od_dliv_item.opt_item_id_2 IS '옵션2 값ID (pd_prod_opt_item.opt_item_id)';
COMMENT ON COLUMN od_dliv_item.dliv_type_cd  IS '입출고구분 (OUT:출고 / IN:입고반품)';
COMMENT ON COLUMN od_dliv_item.unit_price    IS '단가 (주문시점 스냅샷)';
COMMENT ON COLUMN od_dliv_item.dliv_qty      IS '출고수량 (부분출고 시 주문수량보다 적을 수 있음)';
COMMENT ON COLUMN od_dliv_item.dliv_item_status_cd IS '항목 배송상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN od_dliv_item.dliv_item_status_cd_before IS '변경 전 배송상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN od_dliv_item.reg_by        IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_dliv_item.reg_date      IS '등록일';
COMMENT ON COLUMN od_dliv_item.upd_by        IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_dliv_item.upd_date      IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] od_dliv_item.dliv_item_status_cd (항목 배송상태) : 배송상태 { READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패 }

-- 클레임 (취소/반품/교환)
CREATE TABLE IF NOT EXISTS od_claim (
    claim_id        VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    order_id        VARCHAR(21)     NOT NULL,
    member_id       VARCHAR(21),
    member_nm       VARCHAR(50),
    claim_type_cd   VARCHAR(20)     NOT NULL,               -- 코드: CLAIM_TYPE (CANCEL/RETURN/EXCHANGE)
    claim_status_cd VARCHAR(20)     DEFAULT 'REQUESTED',    -- 코드: CLAIM_STATUS
    claim_status_cd_before VARCHAR(20),
    reason_cd       VARCHAR(50),                            -- 코드: CANCEL_REASON/RETURN_REASON/EXCHANGE_REASON
    reason_detail   TEXT,
    prod_nm         VARCHAR(200),                           -- 대표 상품명
    -- ── 고객귀책 / 클레임 철회 ──
    customer_fault_yn    CHAR(1)     DEFAULT 'N',           -- 고객귀책여부 (Y=고객, N=판매자)
    claim_cancel_yn      CHAR(1)     DEFAULT 'N',           -- 클레임 철회여부 (신청 자체를 취소)
    claim_cancel_date    TIMESTAMP,
    claim_cancel_reason_cd VARCHAR(50),
    claim_cancel_reason_detail VARCHAR(300),
    -- ── 환불 정보 ──
    refund_method_cd     VARCHAR(20),                       -- 코드: REFUND_METHOD
    refund_amt           BIGINT      DEFAULT 0,             -- 환불 합계금액
    refund_prod_amt      BIGINT      DEFAULT 0,             -- 환불 상품금액
    refund_shipping_amt  BIGINT      DEFAULT 0,             -- 환불 배송비
    refund_save_amt      BIGINT      DEFAULT 0,             -- 환불 적립금 합계 (복원액)
    refund_bank_cd       VARCHAR(20),                       -- 코드: BANK_CODE (계좌이체 환불 시)
    refund_account_no    VARCHAR(50),
    refund_account_nm    VARCHAR(50),
    -- ── 처리 정보 ──
    request_date    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    proc_date       TIMESTAMP,
    proc_user_id    VARCHAR(21),
    memo            TEXT,
    -- ── 추가배송비 ──
    add_shipping_fee     BIGINT      DEFAULT 0,             -- 추가배송비 (교환=출고배송비, 반품/취소=무료배송조건 파괴 시)
    add_shipping_fee_charge_cd VARCHAR(20),                 -- 추가배송비 청구방법코드
    add_shipping_fee_reason VARCHAR(300),                   -- 추가배송비 면제사유
    -- ── 회수지 (반품·교환 수거 주소) ──
    collect_nm           VARCHAR(50),                       -- 수거지 성명
    collect_phone        VARCHAR(20),                       -- 수거지 연락처
    collect_zip          VARCHAR(10),                       -- 수거지 우편번호
    collect_addr         VARCHAR(200),                      -- 수거지 기본주소
    collect_addr_detail  VARCHAR(200),                      -- 수거지 상세주소
    collect_req_memo     VARCHAR(200),                      -- 수거 요청사항
    collect_schd_date    TIMESTAMP,                         -- 수거 예정일시
    -- ── 반품 수거 배송정보 ──
    return_shipping_fee  BIGINT      DEFAULT 0,             -- 수거배송료
    return_courier_cd    VARCHAR(30),                       -- 코드: COURIER
    return_tracking_no   VARCHAR(100),
    return_status_cd     VARCHAR(20),                       -- 수거 상태 (코드: DLIV_STATUS)
    return_status_cd_before VARCHAR(20),
    inbound_shipping_fee BIGINT      DEFAULT 0,             -- 반입배송료
    inbound_courier_cd   VARCHAR(30),                       -- 코드: COURIER
    inbound_tracking_no  VARCHAR(100),
    inbound_dliv_id      VARCHAR(21),                       -- 반입 배송ID (od_dliv.)
    -- ── 교환 배송지 (원 주문 배송지와 다를 경우 별도 설정) ──
    exch_recv_nm         VARCHAR(50),                       -- 교환 수령자명
    exch_recv_phone      VARCHAR(20),
    exch_recv_zip        VARCHAR(10),
    exch_recv_addr       VARCHAR(200),
    exch_recv_addr_detail VARCHAR(200),
    exch_recv_req_memo   VARCHAR(200),
    -- ── 교환 발송 배송정보 ──
    exchange_shipping_fee BIGINT     DEFAULT 0,             -- 교환상품 발송배송료
    exchange_courier_cd   VARCHAR(30),                      -- 코드: COURIER
    exchange_tracking_no  VARCHAR(100),
    outbound_dliv_id      VARCHAR(21),                      -- 교환상품 발송 배송ID (od_dliv.)
    -- ── 배송료 정산 ──
    total_shipping_fee    BIGINT     DEFAULT 0,             -- 총 배송료 (수거+반입+발송)
    shipping_fee_paid_yn  CHAR(1)    DEFAULT 'N',
    shipping_fee_paid_date TIMESTAMP,
    shipping_fee_memo     VARCHAR(300),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    -- ── 결재처리/추가결재요청 (관리자 일괄작업) ──
    appr_status_cd      VARCHAR(20),                        -- 코드: APPROVAL_STATUS
    appr_status_cd_before VARCHAR(20),
    appr_amt            BIGINT,
    appr_target_cd      VARCHAR(30),                        -- 코드: APPROVAL_TARGET
    appr_target_nm      VARCHAR(200),
    appr_reason         VARCHAR(500),
    appr_req_user_id    VARCHAR(21),
    appr_req_date       TIMESTAMP,
    appr_aprv_user_id   VARCHAR(21),
    appr_aprv_date      TIMESTAMP,
    PRIMARY KEY (claim_id)
);

COMMENT ON TABLE od_claim IS '클레임 (취소/반품/교환)';
COMMENT ON COLUMN od_claim.claim_id          IS '클레임ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_claim.site_id           IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_claim.order_id          IS '주문ID';
COMMENT ON COLUMN od_claim.member_id         IS '회원ID';
COMMENT ON COLUMN od_claim.member_nm         IS '회원명';
COMMENT ON COLUMN od_claim.claim_type_cd     IS '클레임유형 (코드: CLAIM_TYPE)';
COMMENT ON COLUMN od_claim.claim_status_cd   IS '클레임상태 (코드: CLAIM_STATUS)';
COMMENT ON COLUMN od_claim.claim_status_cd_before IS '변경 전 클레임상태 (코드: CLAIM_STATUS)';
COMMENT ON COLUMN od_claim.reason_cd         IS '사유코드 (코드: CANCEL_REASON/RETURN_REASON/EXCHANGE_REASON)';
COMMENT ON COLUMN od_claim.reason_detail     IS '사유 상세';
COMMENT ON COLUMN od_claim.prod_nm           IS '대표 상품명';
COMMENT ON COLUMN od_claim.customer_fault_yn IS '고객귀책여부 (Y=고객귀책, N=판매자귀책)';
COMMENT ON COLUMN od_claim.claim_cancel_yn   IS '클레임 철회여부 Y/N (신청 자체를 취소한 경우)';
COMMENT ON COLUMN od_claim.claim_cancel_date IS '클레임 철회일시';
COMMENT ON COLUMN od_claim.claim_cancel_reason_cd IS '클레임 철회사유코드';
COMMENT ON COLUMN od_claim.claim_cancel_reason_detail IS '클레임 철회사유상세';
COMMENT ON COLUMN od_claim.refund_method_cd  IS '환불수단 (코드: REFUND_METHOD)';
COMMENT ON COLUMN od_claim.refund_amt        IS '환불 합계금액 (상품금액+배송비-추가배송비-적립금복원)';
COMMENT ON COLUMN od_claim.refund_prod_amt   IS '환불 상품금액';
COMMENT ON COLUMN od_claim.refund_shipping_amt IS '환불 배송비';
COMMENT ON COLUMN od_claim.refund_save_amt   IS '환불 적립금 합계 (사용 적립금 복원액)';
COMMENT ON COLUMN od_claim.refund_bank_cd    IS '환불 은행코드 (코드: BANK_CODE — 계좌이체 환불 시)';
COMMENT ON COLUMN od_claim.refund_account_no IS '환불 계좌번호';
COMMENT ON COLUMN od_claim.refund_account_nm IS '환불 예금주명';
COMMENT ON COLUMN od_claim.request_date      IS '클레임 요청일시';
COMMENT ON COLUMN od_claim.proc_date         IS '처리일시';
COMMENT ON COLUMN od_claim.proc_user_id      IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN od_claim.memo              IS '관리메모';
COMMENT ON COLUMN od_claim.add_shipping_fee  IS '추가배송비 (교환=출고배송비, 반품/취소=무료배송 조건 파괴 시 추가)';
COMMENT ON COLUMN od_claim.add_shipping_fee_charge_cd IS '추가배송비 청구방법코드';
COMMENT ON COLUMN od_claim.add_shipping_fee_reason IS '추가배송비 면제사유';
COMMENT ON COLUMN od_claim.collect_nm        IS '수거지 성명 (반품·교환 수거 주소)';
COMMENT ON COLUMN od_claim.collect_phone     IS '수거지 연락처';
COMMENT ON COLUMN od_claim.collect_zip       IS '수거지 우편번호';
COMMENT ON COLUMN od_claim.collect_addr      IS '수거지 기본주소';
COMMENT ON COLUMN od_claim.collect_addr_detail IS '수거지 상세주소';
COMMENT ON COLUMN od_claim.collect_req_memo  IS '수거 요청사항';
COMMENT ON COLUMN od_claim.collect_schd_date IS '수거 예정일시';
COMMENT ON COLUMN od_claim.return_shipping_fee   IS '수거배송료';
COMMENT ON COLUMN od_claim.return_courier_cd     IS '수거 택배사 (코드: COURIER)';
COMMENT ON COLUMN od_claim.return_tracking_no    IS '수거 송장번호';
COMMENT ON COLUMN od_claim.return_status_cd      IS '수거 상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN od_claim.return_status_cd_before IS '변경 전 수거상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN od_claim.inbound_shipping_fee  IS '반입배송료';
COMMENT ON COLUMN od_claim.inbound_courier_cd    IS '반입 택배사 (코드: COURIER)';
COMMENT ON COLUMN od_claim.inbound_tracking_no   IS '반입 송장번호';
COMMENT ON COLUMN od_claim.inbound_dliv_id       IS '반입 배송ID (od_dliv.)';
COMMENT ON COLUMN od_claim.exch_recv_nm          IS '교환 수령자명 (원 주문 배송지와 다를 경우)';
COMMENT ON COLUMN od_claim.exch_recv_phone       IS '교환 수령자 연락처';
COMMENT ON COLUMN od_claim.exch_recv_zip         IS '교환 수령지 우편번호';
COMMENT ON COLUMN od_claim.exch_recv_addr        IS '교환 수령지 기본주소';
COMMENT ON COLUMN od_claim.exch_recv_addr_detail IS '교환 수령지 상세주소';
COMMENT ON COLUMN od_claim.exch_recv_req_memo    IS '교환 배송 요청사항';
COMMENT ON COLUMN od_claim.exchange_shipping_fee IS '교환상품 발송배송료';
COMMENT ON COLUMN od_claim.exchange_courier_cd   IS '교환상품 발송 택배사 (코드: COURIER)';
COMMENT ON COLUMN od_claim.exchange_tracking_no  IS '교환상품 발송 송장번호';
COMMENT ON COLUMN od_claim.outbound_dliv_id      IS '교환상품 발송 배송ID (od_dliv.)';
COMMENT ON COLUMN od_claim.total_shipping_fee    IS '총 배송료 (수거+반입+발송)';
COMMENT ON COLUMN od_claim.shipping_fee_paid_yn  IS '배송료 정산 완료 여부 Y/N';
COMMENT ON COLUMN od_claim.shipping_fee_paid_date IS '배송료 정산일시';
COMMENT ON COLUMN od_claim.shipping_fee_memo     IS '배송료 비고';
COMMENT ON COLUMN od_claim.reg_by                IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_claim.reg_date              IS '등록일';
COMMENT ON COLUMN od_claim.upd_by               IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_claim.upd_date              IS '수정일';
COMMENT ON COLUMN od_claim.appr_status_cd        IS '결재상태 (코드: APPROVAL_STATUS)';
COMMENT ON COLUMN od_claim.appr_status_cd_before IS '변경 전 결재상태 (코드: APPROVAL_STATUS)';
COMMENT ON COLUMN od_claim.appr_amt              IS '결재 요청금액';
COMMENT ON COLUMN od_claim.appr_target_cd        IS '결재대상 구분 (코드: APPROVAL_TARGET)';
COMMENT ON COLUMN od_claim.appr_target_nm        IS '결재 대상명';
COMMENT ON COLUMN od_claim.appr_reason           IS '사유/메모';
COMMENT ON COLUMN od_claim.appr_req_user_id      IS '결재 요청자 (sy_user.user_id)';
COMMENT ON COLUMN od_claim.appr_req_date         IS '결재 요청일시';
COMMENT ON COLUMN od_claim.appr_aprv_user_id     IS '결재자 (sy_user.user_id)';
COMMENT ON COLUMN od_claim.appr_aprv_date        IS '결재일시';

CREATE INDEX idx_od_claim_order    ON od_claim (order_id);
CREATE INDEX idx_od_claim_member   ON od_claim (member_id);
CREATE INDEX idx_od_claim_type     ON od_claim (claim_type_cd);
CREATE INDEX idx_od_claim_status   ON od_claim (claim_status_cd);
CREATE INDEX idx_od_claim_date     ON od_claim (request_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] od_claim.claim_type_cd (클레임유형) : 클레임유형 { CANCEL:취소, RETURN:반품, EXCHANGE:교환 }
-- [CODES] od_claim.claim_status_cd (클레임상태) : 클레임상태 { REQUESTED:신청, APPROVED:승인, IN_PICKUP:수거중, PROCESSING:처리중, REFUND_WAIT:환불대기, COMPLT:완료, REJECTED:거부, CANCELLED:철회 }
-- [CODES] od_claim.reason_cd (사유코드) : CANCEL_REASON / RETURN_REASON / EXCHANGE_REASON — claim_type_cd에 따라 분기
-- [CODES] od_claim.refund_method_cd (환불수단) : 환불수단 { CARD_CANCEL:카드취소, BANK_REFUND:계좌환불, CACHE_REFUND:캐쉬환불 }
-- [CODES] od_claim.refund_bank_cd (환불 은행코드) : BANK_CODE: 국민/신한/우리/하나/농협/기업/부산/대구/경남/광주/전북/제주/수협/씨티/우체국/새마을/카카오/케이/산업/하나
-- [CODES] od_claim.return_courier_cd (수거 택배사) : 택배사 { CJ:CJ대한통운, LOTTE:롯데택배, HANJIN:한진택배, POST:우체국택배, LOGEN:로젠택배 }
-- [CODES] od_claim.return_status_cd (수거 상태) : 배송상태 { READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패 }
-- [CODES] od_claim.inbound_courier_cd (반입 택배사) : 택배사 { CJ:CJ대한통운, LOTTE:롯데택배, HANJIN:한진택배, POST:우체국택배, LOGEN:로젠택배 }
-- [CODES] od_claim.exchange_courier_cd (교환상품 발송 택배사) : 택배사 { CJ:CJ대한통운, LOTTE:롯데택배, HANJIN:한진택배, POST:우체국택배, LOGEN:로젠택배 }
-- [CODES] od_claim.appr_status_cd (결재상태) : APPROVAL_STATUS { REQ:요청, APPROVED:승인, REJECTED:반려, DONE:완료 }
-- [CODES] od_claim.appr_target_cd (결재대상 구분) : APPROVAL_TARGET { ORDER:주문, PROD:상품, DLIV:배송, EXTRA:추가결재 }

-- 클레임 항목 (클레임 대상 주문상품 명세)
CREATE TABLE IF NOT EXISTS od_claim_item (
    claim_item_id   VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    claim_id        VARCHAR(21)     NOT NULL,
    order_item_id   VARCHAR(21)     NOT NULL,               -- 원 주문상품ID
    prod_id         VARCHAR(21),
    prod_nm         VARCHAR(200),                           -- 상품명 (주문시점 스냅샷)
    prod_option     VARCHAR(500),                           -- 옵션 (색상/사이즈 스냅샷)
    unit_price      BIGINT          DEFAULT 0,              -- 판매가 (단가)
    claim_qty       INTEGER         DEFAULT 1,
    item_amt        BIGINT          DEFAULT 0,              -- 클레임금액 (unit_price × claim_qty)
    refund_amt      BIGINT          DEFAULT 0,              -- 환불금액
    claim_item_status_cd VARCHAR(20)     DEFAULT 'REQUESTED',    -- 코드: CLAIM_ITEM_STATUS
    claim_item_status_cd_before VARCHAR(20),                 -- 변경 전 클레임상태
    -- ── 클레임 항목별 배송료 ──
    return_shipping_fee  BIGINT       DEFAULT 0,           -- 수거배송료
    inbound_shipping_fee BIGINT       DEFAULT 0,           -- 반입배송료
    exchange_shipping_fee BIGINT      DEFAULT 0,           -- 교환상품 발송배송료
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (claim_item_id)
);

COMMENT ON TABLE od_claim_item IS '클레임 항목 (클레임 대상 주문상품 명세)';
COMMENT ON COLUMN od_claim_item.claim_item_id IS '클레임항목ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_claim_item.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_claim_item.claim_id      IS '클레임ID (od_claim.)';
COMMENT ON COLUMN od_claim_item.order_item_id IS '주문상품ID (od_order_item.)';
COMMENT ON COLUMN od_claim_item.prod_id       IS '상품ID';
COMMENT ON COLUMN od_claim_item.prod_nm       IS '상품명 (주문시점 스냅샷)';
COMMENT ON COLUMN od_claim_item.prod_option   IS '옵션 (색상/사이즈 스냅샷)';
COMMENT ON COLUMN od_claim_item.unit_price    IS '판매가 (단가)';
COMMENT ON COLUMN od_claim_item.claim_qty     IS '클레임 수량';
COMMENT ON COLUMN od_claim_item.item_amt      IS '클레임금액 (unit_price × claim_qty)';
COMMENT ON COLUMN od_claim_item.refund_amt    IS '환불금액';
COMMENT ON COLUMN od_claim_item.claim_item_status_cd IS '항목상태 (코드: CLAIM_ITEM_STATUS)';
COMMENT ON COLUMN od_claim_item.claim_item_status_cd_before IS '변경 전 클레임상태 (코드: CLAIM_ITEM_STATUS)';
COMMENT ON COLUMN od_claim_item.return_shipping_fee   IS '해당 항목의 수거배송료';
COMMENT ON COLUMN od_claim_item.inbound_shipping_fee  IS '해당 항목의 반입배송료';
COMMENT ON COLUMN od_claim_item.exchange_shipping_fee IS '해당 항목의 교환 발송배송료';
COMMENT ON COLUMN od_claim_item.reg_by        IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_claim_item.reg_date      IS '등록일';
COMMENT ON COLUMN od_claim_item.upd_by        IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_claim_item.upd_date      IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] od_claim_item.claim_item_status_cd (항목상태) : 클레임항목상태 { REQUESTED:신청, APPROVED:승인, IN_PICKUP:수거중, PROCESSING:처리중, IN_TRANSIT:교환출고중, COMPLT:완료, REJECTED:거부, CANCELLED:취소 }

-- 주문 상태 이력
CREATE TABLE IF NOT EXISTS odh_order_status_hist (
    order_status_hist_id    VARCHAR(21)     NOT NULL,
    site_id                 VARCHAR(21),                            -- sy_site.site_id
    order_id                VARCHAR(21)     NOT NULL,               -- od_order.order_id
    order_status_cd_before  VARCHAR(20),                            -- 변경 전 주문상태 (코드: ORDER_STATUS)
    order_status_cd         VARCHAR(20),                            -- 변경 후 주문상태 (코드: ORDER_STATUS)
    status_reason           VARCHAR(300),                           -- 상태 변경 사유
    chg_user_id             VARCHAR(21),                            -- 변경 담당자 (sy_user.user_id, mb_member.member_id)
    chg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    memo                    VARCHAR(300),
    reg_by                  VARCHAR(16),
    reg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(16),
    upd_date                TIMESTAMP,
    PRIMARY KEY (order_status_hist_id),
    CONSTRAINT fk_odh_order_status_hist_order FOREIGN KEY (order_id) REFERENCES od_order (order_id)
);

COMMENT ON TABLE odh_order_status_hist IS '주문 상태 이력';
COMMENT ON COLUMN odh_order_status_hist.order_status_hist_id   IS '주문상태이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN odh_order_status_hist.site_id                IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN odh_order_status_hist.order_id               IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN odh_order_status_hist.order_status_cd_before IS '변경 전 주문상태 (코드: ORDER_STATUS)';
COMMENT ON COLUMN odh_order_status_hist.order_status_cd        IS '변경 후 주문상태 (코드: ORDER_STATUS)';
COMMENT ON COLUMN odh_order_status_hist.status_reason          IS '상태 변경 사유';
COMMENT ON COLUMN odh_order_status_hist.chg_user_id            IS '변경 담당자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_order_status_hist.chg_date               IS '변경 일시';
COMMENT ON COLUMN odh_order_status_hist.memo                   IS '메모';
COMMENT ON COLUMN odh_order_status_hist.reg_by                 IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_order_status_hist.reg_date               IS '등록일';
COMMENT ON COLUMN odh_order_status_hist.upd_by                 IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_order_status_hist.upd_date               IS '수정일';

CREATE INDEX idx_odh_order_status_hist_order ON odh_order_status_hist (order_id);
CREATE INDEX idx_odh_order_status_hist_date  ON odh_order_status_hist (chg_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] odh_order_status_hist.order_status_cd (변경 후 주문상태) : 주문상태 { PENDING:입금대기, PAID:결제완료, PREPARING:상품준비중, SHIPPED:배송중, DELIVERED:배송완료, COMPLT:구매확정, CANCELLED:취소, AUTO_CANCELLED:자동취소 }

-- ============================================================
-- ec_order_chg_hist : 주문 변경 이력 (필드 단위 변경 추적)
--   chg_type 예: PAY_METHOD / RECV_INFO / AMOUNT / MEMO / COUPON / CACHE / APPROVAL
-- ============================================================
CREATE TABLE IF NOT EXISTS odh_order_chg_hist (
    order_chg_hist_id  VARCHAR(21)     NOT NULL,
    site_id            VARCHAR(21),                            -- sy_site.site_id
    order_id           VARCHAR(21)     NOT NULL,
    chg_type_cd        VARCHAR(30)     NOT NULL,               -- 변경유형코드 (PAY_METHOD/RECV_INFO/AMOUNT/MEMO/COUPON/CACHE/APPROVAL)
    chg_field          VARCHAR(50),                            -- 변경 필드명 (예: pay_method_cd, recv_addr)
    before_val         TEXT,                                   -- 변경전값
    after_val          TEXT,                                   -- 변경후값
    chg_reason         VARCHAR(300),                           -- 변경사유
    chg_user_id             VARCHAR(21),                            -- 처리자 (sy_user.user_id)
    chg_date           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by             VARCHAR(16),
    reg_date           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by             VARCHAR(16),
    upd_date           TIMESTAMP,
    PRIMARY KEY (order_chg_hist_id)
);

COMMENT ON TABLE odh_order_chg_hist IS '주문 변경 이력';
COMMENT ON COLUMN odh_order_chg_hist.order_chg_hist_id  IS '이력ID';
COMMENT ON COLUMN odh_order_chg_hist.site_id            IS '사이트ID';
COMMENT ON COLUMN odh_order_chg_hist.order_id           IS '주문ID';
COMMENT ON COLUMN odh_order_chg_hist.chg_type_cd        IS '변경유형코드 (PAY_METHOD/RECV_INFO/AMOUNT/MEMO/COUPON/CACHE/APPROVAL)';
COMMENT ON COLUMN odh_order_chg_hist.chg_field          IS '변경 필드명';
COMMENT ON COLUMN odh_order_chg_hist.before_val         IS '변경전값';
COMMENT ON COLUMN odh_order_chg_hist.after_val          IS '변경후값';
COMMENT ON COLUMN odh_order_chg_hist.chg_reason         IS '변경사유';
COMMENT ON COLUMN odh_order_chg_hist.chg_user_id             IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN odh_order_chg_hist.chg_date           IS '처리일시';
COMMENT ON COLUMN odh_order_chg_hist.reg_by             IS '등록자';
COMMENT ON COLUMN odh_order_chg_hist.reg_date           IS '등록일';
COMMENT ON COLUMN odh_order_chg_hist.upd_by             IS '수정자';
COMMENT ON COLUMN odh_order_chg_hist.upd_date           IS '수정일';

CREATE INDEX idx_odh_order_chg_hist_order ON odh_order_chg_hist (order_id);
CREATE INDEX idx_odh_order_chg_hist_type  ON odh_order_chg_hist (chg_type_cd);
CREATE INDEX idx_odh_order_chg_hist_date  ON odh_order_chg_hist (chg_date);

-- 주문상품 상태 이력
CREATE TABLE IF NOT EXISTS odh_order_item_status_hist (
    order_item_status_hist_id    VARCHAR(21)     NOT NULL,
    site_id                      VARCHAR(21),                        -- sy_site.site_id
    order_item_id                VARCHAR(21)     NOT NULL,           -- od_order_item.order_item_id
    order_id                     VARCHAR(21),                        -- od_order.order_id (조회 편의)
    order_item_status_cd_before  VARCHAR(20),                        -- 변경 전 주문상품상태 (코드: ORDER_ITEM_STATUS)
    order_item_status_cd         VARCHAR(20),                        -- 변경 후 주문상품상태 (코드: ORDER_ITEM_STATUS)
    status_reason                VARCHAR(300),                       -- 상태 변경 사유
    chg_user_id                  VARCHAR(21),                        -- 변경 담당자 (sy_user.user_id, mb_member.member_id)
    chg_date                     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    memo                         VARCHAR(300),
    reg_by                       VARCHAR(16),
    reg_date                     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                       VARCHAR(16),
    upd_date                     TIMESTAMP,
    PRIMARY KEY (order_item_status_hist_id),
    CONSTRAINT fk_odh_order_item_status_hist_item FOREIGN KEY (order_item_id) REFERENCES od_order_item (order_item_id)
);

COMMENT ON TABLE odh_order_item_status_hist IS '주문상품 상태 이력';
COMMENT ON COLUMN odh_order_item_status_hist.order_item_status_hist_id   IS '주문상품상태이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN odh_order_item_status_hist.site_id                     IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN odh_order_item_status_hist.order_item_id               IS '주문상품ID (od_order_item.order_item_id)';
COMMENT ON COLUMN odh_order_item_status_hist.order_id                    IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN odh_order_item_status_hist.order_item_status_cd_before IS '변경 전 주문상품상태 (코드: ORDER_ITEM_STATUS)';
COMMENT ON COLUMN odh_order_item_status_hist.order_item_status_cd        IS '변경 후 주문상품상태 (코드: ORDER_ITEM_STATUS)';
COMMENT ON COLUMN odh_order_item_status_hist.status_reason               IS '상태 변경 사유';
COMMENT ON COLUMN odh_order_item_status_hist.chg_user_id                 IS '변경 담당자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_order_item_status_hist.chg_date                    IS '변경 일시';
COMMENT ON COLUMN odh_order_item_status_hist.memo                        IS '메모';
COMMENT ON COLUMN odh_order_item_status_hist.reg_by                      IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_order_item_status_hist.reg_date                    IS '등록일';
COMMENT ON COLUMN odh_order_item_status_hist.upd_by                      IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_order_item_status_hist.upd_date                    IS '수정일';

CREATE INDEX idx_od_oi_status_hist_item  ON odh_order_item_status_hist (order_item_id);
CREATE INDEX idx_od_oi_status_hist_order ON odh_order_item_status_hist (order_id);
CREATE INDEX idx_od_oi_status_hist_date  ON odh_order_item_status_hist (chg_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] odh_order_item_status_hist.order_item_status_cd (변경 후 주문상품상태) : 주문항목상태 { ORDERED:주문완료, PAID:결제완료, PREPARING:준비중, SHIPPING:배송중, DELIVERED:배송완료, CONFIRMED:구매확정, CANCELLED:취소 }

-- ============================================================
-- ec_order_item_chg_hist : 주문 품목 변경 이력 (필드 단위 변경 추적)
--   chg_type 예: QTY / PRICE / OPT / STATUS / AMOUNT / COUPON
-- ============================================================
CREATE TABLE IF NOT EXISTS odh_order_item_chg_hist (
    order_item_chg_hist_id  VARCHAR(21)     NOT NULL,
    site_id                 VARCHAR(21),                            -- sy_site.site_id
    order_id                VARCHAR(21)     NOT NULL,               -- od_order.
    order_item_id           VARCHAR(21)     NOT NULL,               -- od_order_item.
    chg_type_cd             VARCHAR(30)     NOT NULL,               -- 변경유형코드 (QTY/PRICE/OPT/STATUS/AMOUNT/COUPON)
    chg_field               VARCHAR(50),                            -- 변경 필드명
    before_val              TEXT,                                   -- 변경전값
    after_val               TEXT,                                   -- 변경후값
    chg_reason              VARCHAR(300),                           -- 변경사유
    chg_user_id                  VARCHAR(21),                            -- 처리자 (sy_user.user_id)
    chg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by                  VARCHAR(16),
    reg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(16),
    upd_date                TIMESTAMP,
    PRIMARY KEY (order_item_chg_hist_id)
);

COMMENT ON TABLE odh_order_item_chg_hist IS '주문 품목 변경 이력';
COMMENT ON COLUMN odh_order_item_chg_hist.order_item_chg_hist_id  IS '이력ID';
COMMENT ON COLUMN odh_order_item_chg_hist.site_id                 IS '사이트ID';
COMMENT ON COLUMN odh_order_item_chg_hist.order_id                IS '주문ID (od_order.)';
COMMENT ON COLUMN odh_order_item_chg_hist.order_item_id           IS '주문품목ID (od_order_item.)';
COMMENT ON COLUMN odh_order_item_chg_hist.chg_type_cd             IS '변경유형코드 (QTY/PRICE/OPT/STATUS/AMOUNT/COUPON)';
COMMENT ON COLUMN odh_order_item_chg_hist.chg_field               IS '변경 필드명';
COMMENT ON COLUMN odh_order_item_chg_hist.before_val              IS '변경전값';
COMMENT ON COLUMN odh_order_item_chg_hist.after_val               IS '변경후값';
COMMENT ON COLUMN odh_order_item_chg_hist.chg_reason              IS '변경사유';
COMMENT ON COLUMN odh_order_item_chg_hist.chg_user_id                  IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN odh_order_item_chg_hist.chg_date                IS '처리일시';
COMMENT ON COLUMN odh_order_item_chg_hist.reg_by                  IS '등록자';
COMMENT ON COLUMN odh_order_item_chg_hist.reg_date                IS '등록일';
COMMENT ON COLUMN odh_order_item_chg_hist.upd_by                  IS '수정자';
COMMENT ON COLUMN odh_order_item_chg_hist.upd_date                IS '수정일';

CREATE INDEX idx_odh_order_item_chg_hist_order ON odh_order_item_chg_hist (order_id);
CREATE INDEX idx_odh_order_item_chg_hist_item  ON odh_order_item_chg_hist (order_item_id);
CREATE INDEX idx_odh_order_item_chg_hist_type  ON odh_order_item_chg_hist (chg_type_cd);
CREATE INDEX idx_odh_order_item_chg_hist_date  ON odh_order_item_chg_hist (chg_date);

-- ============================================================
-- ec_pay_status_hist : 결제 상태 이력 (결제 상태 변경만 추적)
-- 상태 변경: PENDING → COMPLT, COMPLT → REFUNDED 등
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS odh_pay_status_hist (
    pay_status_hist_id    VARCHAR(21)     NOT NULL,
    site_id               VARCHAR(21),                        -- sy_site.site_id
    pay_id                VARCHAR(21)     NOT NULL,           -- od_pay.
    order_id              VARCHAR(21)     NOT NULL,           -- od_order.
    pay_status_cd_before  VARCHAR(20),                        -- 변경 전 결제상태 (코드: PAY_STATUS)
    pay_status_cd         VARCHAR(20),                        -- 변경 후 결제상태 (코드: PAY_STATUS)
    status_reason         VARCHAR(300),                       -- 상태 변경 사유
    chg_user_id           VARCHAR(21),                        -- 변경 담당자 (sy_user.user_id, mb_member.member_id)
    chg_date              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    memo                  VARCHAR(300),
    reg_by                VARCHAR(16),
    reg_date              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                VARCHAR(16),
    upd_date              TIMESTAMP,
    PRIMARY KEY (pay_status_hist_id),
    CONSTRAINT fk_ec_pay_status_hist_pay FOREIGN KEY (pay_id) REFERENCES od_pay (pay_id)
);

COMMENT ON TABLE odh_pay_status_hist IS '결제 상태 이력 (결제 상태 변경만 추적)';
COMMENT ON COLUMN odh_pay_status_hist.pay_status_hist_id    IS '결제상태이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN odh_pay_status_hist.site_id               IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN odh_pay_status_hist.pay_id                IS '결제ID (od_pay.)';
COMMENT ON COLUMN odh_pay_status_hist.order_id              IS '주문ID (od_order.)';
COMMENT ON COLUMN odh_pay_status_hist.pay_status_cd_before  IS '변경 전 결제상태 (코드: PAY_STATUS)';
COMMENT ON COLUMN odh_pay_status_hist.pay_status_cd         IS '변경 후 결제상태 (코드: PAY_STATUS)';
COMMENT ON COLUMN odh_pay_status_hist.status_reason         IS '상태 변경 사유';
COMMENT ON COLUMN odh_pay_status_hist.chg_user_id           IS '변경 담당자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_pay_status_hist.chg_date              IS '변경 일시';
COMMENT ON COLUMN odh_pay_status_hist.memo                  IS '메모';
COMMENT ON COLUMN odh_pay_status_hist.reg_by                IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_pay_status_hist.reg_date              IS '등록일';
COMMENT ON COLUMN odh_pay_status_hist.upd_by                IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_pay_status_hist.upd_date              IS '수정일';

CREATE INDEX idx_odh_pay_status_hist_pay   ON odh_pay_status_hist (pay_id);
CREATE INDEX idx_odh_pay_status_hist_order ON odh_pay_status_hist (order_id);
CREATE INDEX idx_odh_pay_status_hist_date  ON odh_pay_status_hist (chg_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] odh_pay_status_hist.pay_status_cd (변경 후 결제상태) : PAY_STATUS { PENDING:대기, COMPLT:완료, FAILED:실패, CANCELLED:취소, PARTIAL_REFUND:부분환불, REFUNDED:전액환불 }

-- ============================================================
-- ec_pay_chg_hist : 결제 변경 이력 (모든 결제 변경 추적)
-- 변경유형: 승인(APPROVE), 완료(COMPLETE), 실패(FAIL), 환불(REFUND), 취소(CANCEL), 재시도(RETRY) 등
-- 상태 변경 외 모든 변경사항 기록 (PG 응답, 환불 등)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS odh_pay_chg_hist (
    pay_chg_hist_id     VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    pay_id              VARCHAR(21)     NOT NULL,               -- od_pay.
    order_id            VARCHAR(21)     NOT NULL,               -- od_order.
    pay_status_cd_before VARCHAR(20),                           -- 변경 전 결제상태 (PAY_STATUS)
    pay_status_cd_after VARCHAR(20),                            -- 변경 후 결제상태 (PAY_STATUS)
    chg_type_cd         VARCHAR(30)     NOT NULL,               -- 코드: PAYMENT_CHG_TYPE
                                                                 -- (APPROVE=승인, COMPLETE=완료, FAIL=실패,
                                                                 --  REFUND=환불, CANCEL=취소, RETRY=재시도)
    chg_reason          VARCHAR(300),                           -- 변경 사유
    pg_response         TEXT,                                   -- PG 응답 데이터 (JSON)
    refund_amt          BIGINT,                                 -- 환불 금액 (환불 시만)
    refund_pg_tid       VARCHAR(100),                           -- 환불 거래 ID (환불 시만)
    chg_user_id         VARCHAR(21),                            -- 변경 담당자 (sy_user.user_id, mb_member.member_id)
    chg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    memo                VARCHAR(300),
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (pay_chg_hist_id),
    CONSTRAINT fk_ec_pay_chg_hist_pay FOREIGN KEY (pay_id) REFERENCES od_pay (pay_id)
);

COMMENT ON TABLE odh_pay_chg_hist IS '결제 변경 이력 (모든 결제 변경사항 추적)';
COMMENT ON COLUMN odh_pay_chg_hist.pay_chg_hist_id     IS '결제변경이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN odh_pay_chg_hist.site_id             IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN odh_pay_chg_hist.pay_id              IS '결제ID (od_pay.)';
COMMENT ON COLUMN odh_pay_chg_hist.order_id            IS '주문ID (od_order.)';
COMMENT ON COLUMN odh_pay_chg_hist.pay_status_cd_before IS '변경 전 결제상태 (코드: PAY_STATUS)';
COMMENT ON COLUMN odh_pay_chg_hist.pay_status_cd_after  IS '변경 후 결제상태 (코드: PAY_STATUS)';
COMMENT ON COLUMN odh_pay_chg_hist.chg_type_cd         IS '변경유형 (코드: PAYMENT_CHG_TYPE)';
COMMENT ON COLUMN odh_pay_chg_hist.chg_reason          IS '변경 사유 (예: PG 승인 완료, 수동 환불 등)';
COMMENT ON COLUMN odh_pay_chg_hist.pg_response         IS 'PG 응답 데이터 (JSON)';
COMMENT ON COLUMN odh_pay_chg_hist.refund_amt          IS '환불 금액 (환불 시만)';
COMMENT ON COLUMN odh_pay_chg_hist.refund_pg_tid       IS '환불 거래ID (환불 시 PG로부터 받은 ID)';
COMMENT ON COLUMN odh_pay_chg_hist.chg_user_id         IS '변경 담당자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_pay_chg_hist.chg_date            IS '변경 일시';
COMMENT ON COLUMN odh_pay_chg_hist.memo                IS '메모';
COMMENT ON COLUMN odh_pay_chg_hist.reg_by              IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_pay_chg_hist.reg_date            IS '등록일';
COMMENT ON COLUMN odh_pay_chg_hist.upd_by              IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_pay_chg_hist.upd_date            IS '수정일';

CREATE INDEX idx_odh_pay_chg_hist_pay        ON odh_pay_chg_hist (pay_id);
CREATE INDEX idx_odh_pay_chg_hist_order      ON odh_pay_chg_hist (order_id);
CREATE INDEX idx_odh_pay_chg_hist_chg_type   ON odh_pay_chg_hist (chg_type_cd);
CREATE INDEX idx_odh_pay_chg_hist_date       ON odh_pay_chg_hist (chg_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] odh_pay_chg_hist.chg_type_cd (변경유형) : PAY_CHG_TYPE { STATUS:상태변경, METHOD:수단변경, AMOUNT:금액변경 }

-- 배송 상태 이력
CREATE TABLE IF NOT EXISTS odh_dliv_status_hist (
    dliv_status_hist_id    VARCHAR(21)     NOT NULL,
    site_id                VARCHAR(21),                            -- sy_site.site_id
    dliv_id                VARCHAR(21)     NOT NULL,               -- od_dliv.dliv_id
    order_id               VARCHAR(21),                            -- od_order.order_id (조회 편의)
    dliv_status_cd_before  VARCHAR(20),                            -- 변경 전 배송상태 (코드: DLIV_STATUS)
    dliv_status_cd         VARCHAR(20),                            -- 변경 후 배송상태 (코드: DLIV_STATUS)
    status_reason          VARCHAR(300),                           -- 상태 변경 사유
    chg_user_id            VARCHAR(21),                            -- 변경 담당자 (sy_user.user_id, mb_member.member_id)
    chg_date               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    memo                   VARCHAR(300),
    reg_by                 VARCHAR(16),
    reg_date               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                 VARCHAR(16),
    upd_date               TIMESTAMP,
    PRIMARY KEY (dliv_status_hist_id),
    CONSTRAINT fk_odh_dliv_status_hist_dliv FOREIGN KEY (dliv_id) REFERENCES od_dliv (dliv_id)
);

COMMENT ON TABLE odh_dliv_status_hist IS '배송 상태 이력';
COMMENT ON COLUMN odh_dliv_status_hist.dliv_status_hist_id  IS '배송상태이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN odh_dliv_status_hist.site_id              IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN odh_dliv_status_hist.dliv_id              IS '배송ID (od_dliv.dliv_id)';
COMMENT ON COLUMN odh_dliv_status_hist.order_id             IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN odh_dliv_status_hist.dliv_status_cd_before IS '변경 전 배송상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN odh_dliv_status_hist.dliv_status_cd       IS '변경 후 배송상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN odh_dliv_status_hist.status_reason        IS '상태 변경 사유';
COMMENT ON COLUMN odh_dliv_status_hist.chg_user_id          IS '변경 담당자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_dliv_status_hist.chg_date             IS '변경 일시';
COMMENT ON COLUMN odh_dliv_status_hist.memo                 IS '메모';
COMMENT ON COLUMN odh_dliv_status_hist.reg_by               IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_dliv_status_hist.reg_date             IS '등록일';
COMMENT ON COLUMN odh_dliv_status_hist.upd_by               IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_dliv_status_hist.upd_date             IS '수정일';

CREATE INDEX idx_odh_dliv_status_hist_dliv  ON odh_dliv_status_hist (dliv_id);
CREATE INDEX idx_odh_dliv_status_hist_order ON odh_dliv_status_hist (order_id);
CREATE INDEX idx_odh_dliv_status_hist_date  ON odh_dliv_status_hist (chg_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] odh_dliv_status_hist.dliv_status_cd (변경 후 배송상태) : 배송상태 { READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패 }

-- ============================================================
-- ec_dliv_chg_hist : 배송 변경 이력 (필드 단위 변경 추적)
--   chg_type 예: COURIER / TRACKING / RECV_INFO / MEMO / SPLIT / MERGE
-- ============================================================
CREATE TABLE IF NOT EXISTS odh_dliv_chg_hist (
    dliv_chg_hist_id  VARCHAR(21)     NOT NULL,
    site_id           VARCHAR(21),                            -- sy_site.site_id
    dliv_id           VARCHAR(21)     NOT NULL,
    chg_type_cd       VARCHAR(30)     NOT NULL,               -- 변경유형코드 (COURIER/TRACKING/RECV_INFO/MEMO/SPLIT/MERGE)
    chg_field         VARCHAR(50),                            -- 변경 필드명 (예: courier_cd, tracking_no, recv_addr)
    before_val        TEXT,                                   -- 변경전값
    after_val         TEXT,                                   -- 변경후값
    chg_reason        VARCHAR(300),                           -- 변경사유
    chg_user_id            VARCHAR(21),                            -- 처리자 (sy_user.user_id)
    chg_date          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by            VARCHAR(16),
    reg_date          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(16),
    upd_date          TIMESTAMP,
    PRIMARY KEY (dliv_chg_hist_id)
);

COMMENT ON TABLE odh_dliv_chg_hist IS '배송 변경 이력';
COMMENT ON COLUMN odh_dliv_chg_hist.dliv_chg_hist_id  IS '이력ID';
COMMENT ON COLUMN odh_dliv_chg_hist.site_id           IS '사이트ID';
COMMENT ON COLUMN odh_dliv_chg_hist.dliv_id           IS '배송ID';
COMMENT ON COLUMN odh_dliv_chg_hist.chg_type_cd       IS '변경유형코드 (COURIER/TRACKING/RECV_INFO/MEMO/SPLIT/MERGE)';
COMMENT ON COLUMN odh_dliv_chg_hist.chg_field         IS '변경 필드명';
COMMENT ON COLUMN odh_dliv_chg_hist.before_val        IS '변경전값';
COMMENT ON COLUMN odh_dliv_chg_hist.after_val         IS '변경후값';
COMMENT ON COLUMN odh_dliv_chg_hist.chg_reason        IS '변경사유';
COMMENT ON COLUMN odh_dliv_chg_hist.chg_user_id            IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN odh_dliv_chg_hist.chg_date          IS '처리일시';
COMMENT ON COLUMN odh_dliv_chg_hist.reg_by            IS '등록자';
COMMENT ON COLUMN odh_dliv_chg_hist.reg_date          IS '등록일';
COMMENT ON COLUMN odh_dliv_chg_hist.upd_by            IS '수정자';
COMMENT ON COLUMN odh_dliv_chg_hist.upd_date          IS '수정일';

CREATE INDEX idx_odh_dliv_chg_hist_dliv ON odh_dliv_chg_hist (dliv_id);
CREATE INDEX idx_odh_dliv_chg_hist_type ON odh_dliv_chg_hist (chg_type_cd);
CREATE INDEX idx_odh_dliv_chg_hist_date ON odh_dliv_chg_hist (chg_date);

-- ============================================================
-- ec_dliv_item_chg_hist : 배송 품목 변경 이력 (필드 단위 변경 추적)
--   chg_type 예: QTY / STATUS / CARRIER / TRACK_NO / RECV_INFO
-- ============================================================
CREATE TABLE IF NOT EXISTS odh_dliv_item_chg_hist (
    dliv_item_chg_hist_id  VARCHAR(21)     NOT NULL,
    site_id                VARCHAR(21),                            -- sy_site.site_id
    dliv_id                VARCHAR(21)     NOT NULL,               -- od_dliv.
    dliv_item_id           VARCHAR(21)     NOT NULL,               -- od_dliv_item.
    chg_type_cd            VARCHAR(30)     NOT NULL,               -- 변경유형코드 (QTY/STATUS/CARRIER/TRACK_NO/RECV_INFO)
    chg_field              VARCHAR(50),                            -- 변경 필드명
    before_val             TEXT,                                   -- 변경전값
    after_val              TEXT,                                   -- 변경후값
    chg_reason             VARCHAR(300),                           -- 변경사유
    chg_user_id                 VARCHAR(21),                            -- 처리자 (sy_user.user_id)
    chg_date               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by                 VARCHAR(16),
    reg_date               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                 VARCHAR(16),
    upd_date               TIMESTAMP,
    PRIMARY KEY (dliv_item_chg_hist_id)
);

COMMENT ON TABLE odh_dliv_item_chg_hist IS '배송 품목 변경 이력';
COMMENT ON COLUMN odh_dliv_item_chg_hist.dliv_item_chg_hist_id  IS '이력ID';
COMMENT ON COLUMN odh_dliv_item_chg_hist.site_id                IS '사이트ID';
COMMENT ON COLUMN odh_dliv_item_chg_hist.dliv_id                IS '배송ID (od_dliv.)';
COMMENT ON COLUMN odh_dliv_item_chg_hist.dliv_item_id           IS '배송품목ID (od_dliv_item.)';
COMMENT ON COLUMN odh_dliv_item_chg_hist.chg_type_cd            IS '변경유형코드 (QTY/STATUS/CARRIER/TRACK_NO/RECV_INFO)';
COMMENT ON COLUMN odh_dliv_item_chg_hist.chg_field              IS '변경 필드명';
COMMENT ON COLUMN odh_dliv_item_chg_hist.before_val             IS '변경전값';
COMMENT ON COLUMN odh_dliv_item_chg_hist.after_val              IS '변경후값';
COMMENT ON COLUMN odh_dliv_item_chg_hist.chg_reason             IS '변경사유';
COMMENT ON COLUMN odh_dliv_item_chg_hist.chg_user_id                 IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN odh_dliv_item_chg_hist.chg_date               IS '처리일시';
COMMENT ON COLUMN odh_dliv_item_chg_hist.reg_by                 IS '등록자';
COMMENT ON COLUMN odh_dliv_item_chg_hist.reg_date               IS '등록일';
COMMENT ON COLUMN odh_dliv_item_chg_hist.upd_by                 IS '수정자';
COMMENT ON COLUMN odh_dliv_item_chg_hist.upd_date               IS '수정일';

CREATE INDEX idx_odh_dliv_item_chg_hist_dliv ON odh_dliv_item_chg_hist (dliv_id);
CREATE INDEX idx_odh_dliv_item_chg_hist_item ON odh_dliv_item_chg_hist (dliv_item_id);
CREATE INDEX idx_odh_dliv_item_chg_hist_type ON odh_dliv_item_chg_hist (chg_type_cd);
CREATE INDEX idx_odh_dliv_item_chg_hist_date ON odh_dliv_item_chg_hist (chg_date);

-- 클레임 상태 이력
CREATE TABLE IF NOT EXISTS odh_claim_status_hist (
    claim_status_hist_id    VARCHAR(21)     NOT NULL,
    site_id                 VARCHAR(21),                            -- sy_site.site_id
    claim_id                VARCHAR(21)     NOT NULL,               -- od_claim.claim_id
    order_id                VARCHAR(21),                            -- od_order.order_id (조회 편의)
    claim_status_cd_before  VARCHAR(20),                            -- 변경 전 클레임상태 (코드: CLAIM_STATUS)
    claim_status_cd         VARCHAR(20),                            -- 변경 후 클레임상태 (코드: CLAIM_STATUS)
    status_reason           VARCHAR(300),                           -- 상태 변경 사유
    chg_user_id             VARCHAR(21),                            -- 변경 담당자 (sy_user.user_id, mb_member.member_id)
    chg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    memo                    VARCHAR(300),
    reg_by                  VARCHAR(16),
    reg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(16),
    upd_date                TIMESTAMP,
    PRIMARY KEY (claim_status_hist_id),
    CONSTRAINT fk_odh_claim_status_hist_claim FOREIGN KEY (claim_id) REFERENCES od_claim (claim_id)
);

COMMENT ON TABLE odh_claim_status_hist IS '클레임 상태 이력';
COMMENT ON COLUMN odh_claim_status_hist.claim_status_hist_id   IS '클레임상태이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN odh_claim_status_hist.site_id                IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN odh_claim_status_hist.claim_id               IS '클레임ID (od_claim.claim_id)';
COMMENT ON COLUMN odh_claim_status_hist.order_id               IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN odh_claim_status_hist.claim_status_cd_before IS '변경 전 클레임상태 (코드: CLAIM_STATUS)';
COMMENT ON COLUMN odh_claim_status_hist.claim_status_cd        IS '변경 후 클레임상태 (코드: CLAIM_STATUS)';
COMMENT ON COLUMN odh_claim_status_hist.status_reason          IS '상태 변경 사유';
COMMENT ON COLUMN odh_claim_status_hist.chg_user_id            IS '변경 담당자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_claim_status_hist.chg_date               IS '변경 일시';
COMMENT ON COLUMN odh_claim_status_hist.memo                   IS '메모';
COMMENT ON COLUMN odh_claim_status_hist.reg_by                 IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_claim_status_hist.reg_date               IS '등록일';
COMMENT ON COLUMN odh_claim_status_hist.upd_by                 IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_claim_status_hist.upd_date               IS '수정일';

CREATE INDEX idx_odh_claim_status_hist_claim ON odh_claim_status_hist (claim_id);
CREATE INDEX idx_odh_claim_status_hist_order ON odh_claim_status_hist (order_id);
CREATE INDEX idx_odh_claim_status_hist_date  ON odh_claim_status_hist (chg_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] odh_claim_status_hist.claim_status_cd (변경 후 클레임상태) : 클레임상태 { REQUESTED:신청, APPROVED:승인, IN_PICKUP:수거중, PROCESSING:처리중, REFUND_WAIT:환불대기, COMPLT:완료, REJECTED:거부, CANCELLED:철회 }

-- ============================================================
-- ec_claim_chg_hist : 클레임 변경 이력 (필드 단위 변경 추적)
--   chg_type 예: CLAIM_TYPE / REASON / AMOUNT / APPROVAL / MEMO / REFUND
-- ============================================================
CREATE TABLE IF NOT EXISTS odh_claim_chg_hist (
    claim_chg_hist_id  VARCHAR(21)     NOT NULL,
    site_id            VARCHAR(21),                            -- sy_site.site_id
    claim_id           VARCHAR(21)     NOT NULL,               -- od_claim.
    chg_type_cd        VARCHAR(30)     NOT NULL,               -- 변경유형코드 (CLAIM_TYPE/REASON/AMOUNT/APPROVAL/MEMO/REFUND)
    chg_field          VARCHAR(50),                            -- 변경 필드명
    before_val         TEXT,                                   -- 변경전값
    after_val          TEXT,                                   -- 변경후값
    chg_reason         VARCHAR(300),                           -- 변경사유
    chg_user_id             VARCHAR(21),                            -- 처리자 (sy_user.user_id)
    chg_date           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by             VARCHAR(16),
    reg_date           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by             VARCHAR(16),
    upd_date           TIMESTAMP,
    PRIMARY KEY (claim_chg_hist_id)
);

COMMENT ON TABLE odh_claim_chg_hist IS '클레임 변경 이력';
COMMENT ON COLUMN odh_claim_chg_hist.claim_chg_hist_id  IS '이력ID';
COMMENT ON COLUMN odh_claim_chg_hist.site_id            IS '사이트ID';
COMMENT ON COLUMN odh_claim_chg_hist.claim_id           IS '클레임ID (od_claim.)';
COMMENT ON COLUMN odh_claim_chg_hist.chg_type_cd        IS '변경유형코드 (CLAIM_TYPE/REASON/AMOUNT/APPROVAL/MEMO/REFUND)';
COMMENT ON COLUMN odh_claim_chg_hist.chg_field          IS '변경 필드명';
COMMENT ON COLUMN odh_claim_chg_hist.before_val         IS '변경전값';
COMMENT ON COLUMN odh_claim_chg_hist.after_val          IS '변경후값';
COMMENT ON COLUMN odh_claim_chg_hist.chg_reason         IS '변경사유';
COMMENT ON COLUMN odh_claim_chg_hist.chg_user_id             IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN odh_claim_chg_hist.chg_date           IS '처리일시';
COMMENT ON COLUMN odh_claim_chg_hist.reg_by             IS '등록자';
COMMENT ON COLUMN odh_claim_chg_hist.reg_date           IS '등록일';
COMMENT ON COLUMN odh_claim_chg_hist.upd_by             IS '수정자';
COMMENT ON COLUMN odh_claim_chg_hist.upd_date           IS '수정일';

CREATE INDEX idx_odh_claim_chg_hist_claim ON odh_claim_chg_hist (claim_id);
CREATE INDEX idx_odh_claim_chg_hist_type  ON odh_claim_chg_hist (chg_type_cd);
CREATE INDEX idx_odh_claim_chg_hist_date  ON odh_claim_chg_hist (chg_date);

-- 클레임상품 상태 이력
CREATE TABLE IF NOT EXISTS odh_claim_item_status_hist (
    claim_item_status_hist_id    VARCHAR(21)     NOT NULL,
    site_id                      VARCHAR(21),                        -- sy_site.site_id
    claim_item_id                VARCHAR(21)     NOT NULL,           -- od_claim_item.claim_item_id
    claim_id                     VARCHAR(21),                        -- od_claim.claim_id (조회 편의)
    order_item_id                VARCHAR(21),                        -- od_order_item.order_item_id (조회 편의)
    claim_item_status_cd_before  VARCHAR(20),                        -- 변경 전 클레임상품상태 (코드: CLAIM_ITEM_STATUS)
    claim_item_status_cd         VARCHAR(20),                        -- 변경 후 클레임상품상태 (코드: CLAIM_ITEM_STATUS)
    status_reason                VARCHAR(300),                       -- 상태 변경 사유
    chg_user_id                  VARCHAR(21),                        -- 변경 담당자 (sy_user.user_id, mb_member.member_id)
    chg_date                     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    memo                         VARCHAR(300),
    reg_by                       VARCHAR(16),
    reg_date                     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                       VARCHAR(16),
    upd_date                     TIMESTAMP,
    PRIMARY KEY (claim_item_status_hist_id),
    CONSTRAINT fk_odh_claim_item_status_hist_item FOREIGN KEY (claim_item_id) REFERENCES od_claim_item (claim_item_id)
);

COMMENT ON TABLE odh_claim_item_status_hist IS '클레임상품 상태 이력';
COMMENT ON COLUMN odh_claim_item_status_hist.claim_item_status_hist_id   IS '클레임상품상태이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN odh_claim_item_status_hist.site_id                     IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN odh_claim_item_status_hist.claim_item_id               IS '클레임상품ID (od_claim_item.claim_item_id)';
COMMENT ON COLUMN odh_claim_item_status_hist.claim_id                    IS '클레임ID (od_claim.claim_id)';
COMMENT ON COLUMN odh_claim_item_status_hist.order_item_id               IS '주문상품ID (od_order_item.order_item_id)';
COMMENT ON COLUMN odh_claim_item_status_hist.claim_item_status_cd_before IS '변경 전 클레임상품상태 (코드: CLAIM_ITEM_STATUS)';
COMMENT ON COLUMN odh_claim_item_status_hist.claim_item_status_cd        IS '변경 후 클레임상품상태 (코드: CLAIM_ITEM_STATUS)';
COMMENT ON COLUMN odh_claim_item_status_hist.status_reason               IS '상태 변경 사유';
COMMENT ON COLUMN odh_claim_item_status_hist.chg_user_id                 IS '변경 담당자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_claim_item_status_hist.chg_date                    IS '변경 일시';
COMMENT ON COLUMN odh_claim_item_status_hist.memo                        IS '메모';
COMMENT ON COLUMN odh_claim_item_status_hist.reg_by                      IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_claim_item_status_hist.reg_date                    IS '등록일';
COMMENT ON COLUMN odh_claim_item_status_hist.upd_by                      IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_claim_item_status_hist.upd_date                    IS '수정일';

CREATE INDEX idx_od_ci_status_hist_item     ON odh_claim_item_status_hist (claim_item_id);
CREATE INDEX idx_od_ci_status_hist_claim    ON odh_claim_item_status_hist (claim_id);
CREATE INDEX idx_od_ci_status_hist_oi       ON odh_claim_item_status_hist (order_item_id);
CREATE INDEX idx_od_ci_status_hist_date     ON odh_claim_item_status_hist (chg_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] odh_claim_item_status_hist.claim_item_status_cd (변경 후 클레임상품상태) : 클레임항목상태 { REQUESTED:신청, APPROVED:승인, IN_PICKUP:수거중, PROCESSING:처리중, IN_TRANSIT:교환출고중, COMPLT:완료, REJECTED:거부, CANCELLED:취소 }

-- ============================================================
-- ec_claim_item_chg_hist : 클레임 품목 변경 이력 (필드 단위 변경 추적)
--   chg_type 예: QTY / AMOUNT / REASON / STATUS / REFUND_AMT
-- ============================================================
CREATE TABLE IF NOT EXISTS odh_claim_item_chg_hist (
    claim_item_chg_hist_id  VARCHAR(21)     NOT NULL,
    site_id                 VARCHAR(21),                            -- sy_site.site_id
    claim_id                VARCHAR(21)     NOT NULL,               -- od_claim.
    claim_item_id           VARCHAR(21)     NOT NULL,               -- od_claim_item.
    chg_type_cd             VARCHAR(30)     NOT NULL,               -- 변경유형코드 (QTY/AMOUNT/REASON/STATUS/REFUND_AMT)
    chg_field               VARCHAR(50),                            -- 변경 필드명
    before_val              TEXT,                                   -- 변경전값
    after_val               TEXT,                                   -- 변경후값
    chg_reason              VARCHAR(300),                           -- 변경사유
    chg_user_id                  VARCHAR(21),                            -- 처리자 (sy_user.user_id)
    chg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by                  VARCHAR(16),
    reg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(16),
    upd_date                TIMESTAMP,
    PRIMARY KEY (claim_item_chg_hist_id)
);

COMMENT ON TABLE odh_claim_item_chg_hist IS '클레임 품목 변경 이력';
COMMENT ON COLUMN odh_claim_item_chg_hist.claim_item_chg_hist_id  IS '이력ID';
COMMENT ON COLUMN odh_claim_item_chg_hist.site_id                 IS '사이트ID';
COMMENT ON COLUMN odh_claim_item_chg_hist.claim_id                IS '클레임ID (od_claim.)';
COMMENT ON COLUMN odh_claim_item_chg_hist.claim_item_id           IS '클레임품목ID (od_claim_item.)';
COMMENT ON COLUMN odh_claim_item_chg_hist.chg_type_cd             IS '변경유형코드 (QTY/AMOUNT/REASON/STATUS/REFUND_AMT)';
COMMENT ON COLUMN odh_claim_item_chg_hist.chg_field               IS '변경 필드명';
COMMENT ON COLUMN odh_claim_item_chg_hist.before_val              IS '변경전값';
COMMENT ON COLUMN odh_claim_item_chg_hist.after_val               IS '변경후값';
COMMENT ON COLUMN odh_claim_item_chg_hist.chg_reason              IS '변경사유';
COMMENT ON COLUMN odh_claim_item_chg_hist.chg_user_id                  IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN odh_claim_item_chg_hist.chg_date                IS '처리일시';
COMMENT ON COLUMN odh_claim_item_chg_hist.reg_by                  IS '등록자';
COMMENT ON COLUMN odh_claim_item_chg_hist.reg_date                IS '등록일';
COMMENT ON COLUMN odh_claim_item_chg_hist.upd_by                  IS '수정자';
COMMENT ON COLUMN odh_claim_item_chg_hist.upd_date                IS '수정일';

CREATE INDEX idx_odh_claim_item_chg_hist_claim ON odh_claim_item_chg_hist (claim_id);
CREATE INDEX idx_odh_claim_item_chg_hist_item  ON odh_claim_item_chg_hist (claim_item_id);
CREATE INDEX idx_odh_claim_item_chg_hist_type  ON odh_claim_item_chg_hist (chg_type_cd);
CREATE INDEX idx_odh_claim_item_chg_hist_date  ON odh_claim_item_chg_hist (chg_date);

-- ============================================================
-- [PM] 도메인
-- ============================================================

-- ============================================================
-- pm_coupon : 쿠폰
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pm_coupon (
    coupon_id           VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    coupon_cd           VARCHAR(50)     NOT NULL,               -- 쿠폰코드 (중복 방지)
    coupon_nm           VARCHAR(100)    NOT NULL,
    coupon_type_cd      VARCHAR(20)     NOT NULL,               -- 코드: COUPON_TYPE (RATE/FIXED)
    discount_rate       DECIMAL(5, 2)   DEFAULT 0,              -- 할인률 (%)
    discount_amt        BIGINT          DEFAULT 0,              -- 할인금액
    min_order_amt       BIGINT          DEFAULT 0,              -- 최소주문금액
    min_order_qty       INTEGER,                                -- 최소주문수량 (NULL=제한없음)
    max_discount_amt    BIGINT,                                 -- 최대할인한도 (NULL = 무제한)
    issue_limit         INTEGER,                                -- 총발급한도 (NULL = 무제한)
    issue_cnt           INTEGER         DEFAULT 0,              -- 발급수
    max_issue_per_mem   INTEGER,                                -- 회원당 최대발급수 (NULL=무제한)
    coupon_desc         TEXT,                                   -- 쿠폰설명
    valid_from          DATE,                                   -- 유효기간 시작
    valid_to            DATE,                                   -- 유효기간 종료
    coupon_status_cd    VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: COUPON_STATUS (ACTIVE/INACTIVE/EXPIRED)
    coupon_status_cd_before VARCHAR(20),                        -- 변경 전 쿠폰상태
    use_yn              CHAR(1)         DEFAULT 'Y',
    target_type_cd      VARCHAR(20),                            -- 코드: COUPON_TARGET (ALL/MEMBER/GRADE)
    target_value        VARCHAR(200),                           -- 적용대상값 (등급코드, 회원ID 등)
    mem_grade_cd        VARCHAR(20),                            -- 적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)
    -- 부담금 설정
    self_cdiv_rate      DECIMAL(5,2)    DEFAULT 100,            -- 자사(사이트) 분담율 (%)
    seller_cdiv_rate    DECIMAL(5,2)    DEFAULT 0,              -- 판매자(업체) 분담율 (%)
    seller_cdiv_remark  VARCHAR(300),                           -- 판매자 분담 비고
    -- 채널별 적용 여부
    dvc_pc_yn           CHAR(1)         DEFAULT 'Y',            -- PC 채널 적용여부 Y/N
    dvc_mweb_yn         CHAR(1)         DEFAULT 'Y',            -- 모바일WEB 적용여부 Y/N
    dvc_mapp_yn         CHAR(1)         DEFAULT 'Y',            -- 모바일APP 적용여부 Y/N
    memo                TEXT,
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (coupon_id),
    UNIQUE (coupon_cd)
);

COMMENT ON TABLE pm_coupon IS '쿠폰';
COMMENT ON COLUMN pm_coupon.coupon_id           IS '쿠폰ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_coupon.site_id             IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pm_coupon.coupon_cd           IS '쿠폰코드';
COMMENT ON COLUMN pm_coupon.coupon_nm           IS '쿠폰명';
COMMENT ON COLUMN pm_coupon.coupon_type_cd      IS '쿠폰유형 (코드: COUPON_TYPE)';
COMMENT ON COLUMN pm_coupon.discount_rate       IS '할인률 (%)';
COMMENT ON COLUMN pm_coupon.discount_amt        IS '할인금액';
COMMENT ON COLUMN pm_coupon.min_order_amt       IS '최소주문금액';
COMMENT ON COLUMN pm_coupon.min_order_qty       IS '최소주문수량 (NULL=제한없음)';
COMMENT ON COLUMN pm_coupon.max_discount_amt    IS '최대할인한도 (NULL=무제한)';
COMMENT ON COLUMN pm_coupon.issue_limit         IS '총발급한도 (NULL=무제한)';
COMMENT ON COLUMN pm_coupon.issue_cnt           IS '발급된 개수';
COMMENT ON COLUMN pm_coupon.max_issue_per_mem   IS '회원당 최대발급수 (NULL=무제한)';
COMMENT ON COLUMN pm_coupon.coupon_desc         IS '쿠폰설명';
COMMENT ON COLUMN pm_coupon.valid_from          IS '유효기간 시작';
COMMENT ON COLUMN pm_coupon.valid_to            IS '유효기간 종료';
COMMENT ON COLUMN pm_coupon.coupon_status_cd    IS '상태 (코드: COUPON_STATUS)';
COMMENT ON COLUMN pm_coupon.coupon_status_cd_before IS '변경 전 쿠폰상태 (코드: COUPON_STATUS)';
COMMENT ON COLUMN pm_coupon.use_yn              IS '사용여부 Y/N';
COMMENT ON COLUMN pm_coupon.target_type_cd      IS '적용대상 (코드: COUPON_TARGET)';
COMMENT ON COLUMN pm_coupon.target_value        IS '적용대상값';
COMMENT ON COLUMN pm_coupon.mem_grade_cd        IS '적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)';
COMMENT ON COLUMN pm_coupon.self_cdiv_rate      IS '자사(사이트) 분담율 (%) — 기본 100%';
COMMENT ON COLUMN pm_coupon.seller_cdiv_rate    IS '판매자(업체) 분담율 (%) — 기본 0%';
COMMENT ON COLUMN pm_coupon.seller_cdiv_remark  IS '판매자 분담 비고';
COMMENT ON COLUMN pm_coupon.dvc_pc_yn           IS 'PC 채널 적용여부 Y/N';
COMMENT ON COLUMN pm_coupon.dvc_mweb_yn         IS '모바일WEB 적용여부 Y/N';
COMMENT ON COLUMN pm_coupon.dvc_mapp_yn         IS '모바일APP 적용여부 Y/N';
COMMENT ON COLUMN pm_coupon.memo                IS '메모';
COMMENT ON COLUMN pm_coupon.reg_by              IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_coupon.reg_date            IS '등록일';
COMMENT ON COLUMN pm_coupon.upd_by              IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_coupon.upd_date            IS '수정일';

CREATE INDEX idx_pm_coupon_code   ON pm_coupon (coupon_cd);
CREATE INDEX idx_pm_coupon_type   ON pm_coupon (coupon_type_cd);
CREATE INDEX idx_pm_coupon_status ON pm_coupon (coupon_status_cd);
CREATE INDEX idx_pm_coupon_grade  ON pm_coupon (mem_grade_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_coupon.coupon_type_cd (쿠폰유형) : 쿠폰유형 { RATE:정률 할인, FIXED:정액 할인 }
-- [CODES] pm_coupon.coupon_status_cd (상태) : 쿠폰상태 { ACTIVE:활성, INACTIVE:비활성, EXPIRED:만료 }
-- [CODES] pm_coupon.target_type_cd (적용대상) : PROMO_TARGET_TYPE { ALL:전체, PRODUCT:상품, CATEGORY:카테고리, VENDOR:업체, BRAND:브랜드, MEMBER_GRADE:회원등급 }

-- ============================================================
-- pm_coupon_item : 쿠폰 적용 대상 항목
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 쿠폰이 적용 가능한 상품/카테고리/판매자/브랜드를 지정
-- 항목이 없으면 전체 적용 (pm_coupon.target_type_cd=ALL)
-- ============================================================
CREATE TABLE IF NOT EXISTS pm_coupon_item (
    coupon_item_id      VARCHAR(21)     NOT NULL,
    coupon_id           VARCHAR(21)     NOT NULL,               -- pm_coupon.coupon_id
    site_id             VARCHAR(21),                            -- sy_site.site_id
    target_type_cd      VARCHAR(20)     NOT NULL,               -- 코드: COUPON_ITEM_TARGET (PRODUCT/CATEGORY/VENDOR/BRAND)
    target_id           VARCHAR(21)     NOT NULL,               -- prod_id / category_id / vendor_id / brand_id
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (coupon_item_id),
    UNIQUE (coupon_id, target_type_cd, target_id)
);

COMMENT ON TABLE  pm_coupon_item IS '쿠폰 적용 대상 항목 (상품/카테고리/판매자/브랜드)';
COMMENT ON COLUMN pm_coupon_item.coupon_item_id  IS '쿠폰항목ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_coupon_item.coupon_id       IS '쿠폰ID (pm_coupon.coupon_id)';
COMMENT ON COLUMN pm_coupon_item.site_id         IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pm_coupon_item.target_type_cd  IS '대상유형 (코드: COUPON_ITEM_TARGET — PRODUCT/CATEGORY/VENDOR/BRAND)';
COMMENT ON COLUMN pm_coupon_item.target_id       IS '대상ID (prod_id / category_id / vendor_id / brand_id)';
COMMENT ON COLUMN pm_coupon_item.reg_by          IS '등록자';
COMMENT ON COLUMN pm_coupon_item.reg_date        IS '등록일';

CREATE INDEX idx_pm_coupon_item_coupon ON pm_coupon_item (coupon_id);
CREATE INDEX idx_pm_coupon_item_target ON pm_coupon_item (target_type_cd, target_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_coupon_item.target_type_cd (대상유형) : PROMO_TARGET_TYPE { ALL:전체, PRODUCT:상품, CATEGORY:카테고리, VENDOR:업체, BRAND:브랜드, MEMBER_GRADE:회원등급 }

-- 쿠폰 발급 (회원별 보유)
CREATE TABLE IF NOT EXISTS pm_coupon_issue (
    issue_id        VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    coupon_id       VARCHAR(21)     NOT NULL,
    member_id       VARCHAR(21)     NOT NULL,
    issue_date      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    use_yn          CHAR(1)         DEFAULT 'N',
    use_date        TIMESTAMP,
    order_id        VARCHAR(21),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (issue_id)
);

COMMENT ON TABLE pm_coupon_issue IS '쿠폰 발급';
COMMENT ON COLUMN pm_coupon_issue.issue_id   IS '발급ID';
COMMENT ON COLUMN pm_coupon_issue.site_id    IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pm_coupon_issue.coupon_id  IS '쿠폰ID';
COMMENT ON COLUMN pm_coupon_issue.member_id  IS '회원ID';
COMMENT ON COLUMN pm_coupon_issue.issue_date IS '발급일시';
COMMENT ON COLUMN pm_coupon_issue.use_yn     IS '사용여부 Y/N';
COMMENT ON COLUMN pm_coupon_issue.use_date   IS '사용일시';
COMMENT ON COLUMN pm_coupon_issue.order_id   IS '사용주문ID';
COMMENT ON COLUMN pm_coupon_issue.reg_by     IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_coupon_issue.reg_date   IS '등록일';
COMMENT ON COLUMN pm_coupon_issue.upd_by     IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_coupon_issue.upd_date   IS '수정일';

-- 쿠폰 사용 이력

-- ============================================================
-- pm_coupon_usage : 쿠폰 사용 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pm_coupon_usage (
    usage_id            VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    coupon_id           VARCHAR(21)     NOT NULL,               -- pm_coupon.coupon_id
    coupon_code         VARCHAR(50),                            -- 쿠폰코드 스냅샷
    coupon_nm           VARCHAR(100),                           -- 쿠폰명 스냅샷
    member_id           VARCHAR(21),                            -- mb_member.member_id
    order_id            VARCHAR(21),                            -- od_order.order_id
    order_item_id       VARCHAR(21),                            -- od_order_item.order_item_id (상품별 쿠폰 적용 시)
    prod_id             VARCHAR(21),                            -- pd_prod.prod_id (쿠폰 적용 상품)
    discount_type_cd    VARCHAR(20),                            -- 할인유형 (RATE/FIXED)
    discount_value      INTEGER         DEFAULT 0,              -- 할인값 (율 또는 금액)
    discount_amt        BIGINT          DEFAULT 0,              -- 실할인금액
    used_date           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,

    PRIMARY KEY (usage_id)
);

COMMENT ON TABLE  pm_coupon_usage IS '쿠폰 사용 이력';
COMMENT ON COLUMN pm_coupon_usage.usage_id         IS '사용이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_coupon_usage.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pm_coupon_usage.coupon_id        IS '쿠폰ID (pm_coupon.coupon_id)';
COMMENT ON COLUMN pm_coupon_usage.coupon_code      IS '쿠폰코드 스냅샷';
COMMENT ON COLUMN pm_coupon_usage.coupon_nm        IS '쿠폰명 스냅샷';
COMMENT ON COLUMN pm_coupon_usage.member_id        IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN pm_coupon_usage.order_id         IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN pm_coupon_usage.order_item_id    IS '주문상품ID (od_order_item.order_item_id, 상품별 쿠폰 적용 시)';
COMMENT ON COLUMN pm_coupon_usage.prod_id          IS '상품ID (pd_prod.prod_id, 쿠폰 적용 상품)';
COMMENT ON COLUMN pm_coupon_usage.discount_type_cd IS '할인유형 (RATE=정률 / FIXED=정액)';
COMMENT ON COLUMN pm_coupon_usage.discount_value   IS '할인값 (정률: % / 정액: 원)';
COMMENT ON COLUMN pm_coupon_usage.discount_amt     IS '실할인금액';
COMMENT ON COLUMN pm_coupon_usage.used_date        IS '사용일시';
COMMENT ON COLUMN pm_coupon_usage.reg_by           IS '등록자';
COMMENT ON COLUMN pm_coupon_usage.reg_date         IS '등록일';
COMMENT ON COLUMN pm_coupon_usage.upd_by           IS '수정자';
COMMENT ON COLUMN pm_coupon_usage.upd_date         IS '수정일';

CREATE INDEX idx_pm_coupon_usage_coupon ON pm_coupon_usage (coupon_id);
CREATE INDEX idx_pm_coupon_usage_member ON pm_coupon_usage (member_id);
CREATE INDEX idx_pm_coupon_usage_order  ON pm_coupon_usage (order_id);
CREATE INDEX idx_pm_coupon_usage_item   ON pm_coupon_usage (order_item_id);
CREATE INDEX idx_pm_coupon_usage_prod   ON pm_coupon_usage (prod_id);

-- ============================================================
-- pm_discnt : 할인정책
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pm_discnt (
    discnt_id           VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    discnt_nm           VARCHAR(100)    NOT NULL,               -- 할인명
    discnt_type_cd      VARCHAR(20)     NOT NULL,               -- 코드: DISCNT_TYPE (RATE:정률/FIXED:정액/FREE_SHIP:무료배송)
    discnt_target_cd    VARCHAR(20)     DEFAULT 'ALL',          -- 코드: DISCNT_TARGET (ALL:전체/CATEGORY:카테고리/PRODUCT:상품/MEMBER_GRADE:등급)
    discnt_value        NUMERIC(10,2)   DEFAULT 0,              -- 할인값 (율이면 %, 금액이면 원)
    min_order_amt       BIGINT          DEFAULT 0,              -- 최소주문금액
    min_order_qty       INTEGER,                                -- 최소주문수량 (NULL=제한없음)
    max_discnt_amt      BIGINT,                                 -- 최대할인한도 (NULL이면 무제한)
    start_date          TIMESTAMP,                              -- 할인 시작일시
    end_date            TIMESTAMP,                              -- 할인 종료일시
    discnt_status_cd    VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: DISCNT_STATUS (ACTIVE/INACTIVE/EXPIRED)
    discnt_status_cd_before VARCHAR(20),                        -- 변경 전 상태
    discnt_desc         TEXT,                                   -- 할인 설명
    mem_grade_cd        VARCHAR(20),                            -- 적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)
    -- 부담금 설정
    self_cdiv_rate      DECIMAL(5,2)    DEFAULT 100,            -- 자사(사이트) 분담율 (%)
    seller_cdiv_rate    DECIMAL(5,2)    DEFAULT 0,              -- 판매자(업체) 분담율 (%)
    -- 채널별 적용 여부
    dvc_pc_yn           CHAR(1)         DEFAULT 'Y',            -- PC 채널 적용여부 Y/N
    dvc_mweb_yn         CHAR(1)         DEFAULT 'Y',            -- 모바일WEB 적용여부 Y/N
    dvc_mapp_yn         CHAR(1)         DEFAULT 'Y',            -- 모바일APP 적용여부 Y/N
    use_yn              CHAR(1)         DEFAULT 'Y',
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (discnt_id)
);

COMMENT ON TABLE pm_discnt IS '할인정책';
COMMENT ON COLUMN pm_discnt.discnt_id           IS '할인ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_discnt.site_id             IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pm_discnt.discnt_nm           IS '할인명';
COMMENT ON COLUMN pm_discnt.discnt_type_cd      IS '할인유형 (코드: DISCNT_TYPE — RATE/FIXED/FREE_SHIP)';
COMMENT ON COLUMN pm_discnt.discnt_target_cd    IS '할인대상 (코드: DISCNT_TARGET — ALL/CATEGORY/PRODUCT/MEMBER_GRADE)';
COMMENT ON COLUMN pm_discnt.discnt_value        IS '할인값 (정률이면 %, 정액이면 원)';
COMMENT ON COLUMN pm_discnt.min_order_amt       IS '최소주문금액';
COMMENT ON COLUMN pm_discnt.min_order_qty       IS '최소주문수량 (NULL=제한없음)';
COMMENT ON COLUMN pm_discnt.max_discnt_amt      IS '최대할인한도 (NULL=무제한)';
COMMENT ON COLUMN pm_discnt.start_date          IS '할인 시작일시';
COMMENT ON COLUMN pm_discnt.end_date            IS '할인 종료일시';
COMMENT ON COLUMN pm_discnt.discnt_status_cd    IS '상태 (코드: DISCNT_STATUS)';
COMMENT ON COLUMN pm_discnt.discnt_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN pm_discnt.discnt_desc         IS '할인 설명';
COMMENT ON COLUMN pm_discnt.mem_grade_cd        IS '적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)';
COMMENT ON COLUMN pm_discnt.self_cdiv_rate      IS '자사(사이트) 분담율 (%) — 기본 100%';
COMMENT ON COLUMN pm_discnt.seller_cdiv_rate    IS '판매자(업체) 분담율 (%) — 기본 0%';
COMMENT ON COLUMN pm_discnt.dvc_pc_yn           IS 'PC 채널 적용여부 Y/N';
COMMENT ON COLUMN pm_discnt.dvc_mweb_yn         IS '모바일WEB 적용여부 Y/N';
COMMENT ON COLUMN pm_discnt.dvc_mapp_yn         IS '모바일APP 적용여부 Y/N';
COMMENT ON COLUMN pm_discnt.use_yn              IS '사용여부 Y/N';
COMMENT ON COLUMN pm_discnt.reg_by              IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN pm_discnt.reg_date            IS '등록일';
COMMENT ON COLUMN pm_discnt.upd_by              IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN pm_discnt.upd_date            IS '수정일';

CREATE INDEX idx_pm_discnt_site   ON pm_discnt (site_id);
CREATE INDEX idx_pm_discnt_status ON pm_discnt (discnt_status_cd);
CREATE INDEX idx_pm_discnt_date   ON pm_discnt (start_date, end_date);
CREATE INDEX idx_pm_discnt_grade  ON pm_discnt (mem_grade_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_discnt.discnt_type_cd (할인유형) : DISCNT_TYPE { RATE:정률할인, FIXED:정액할인, FREE_SHIP:무료배송 }
-- [CODES] pm_discnt.discnt_target_cd (할인대상) : DISCNT_TARGET { ALL:전체, CATEGORY:카테고리, PRODUCT:상품, MEMBER_GRADE:회원등급 }
-- [CODES] pm_discnt.discnt_status_cd (상태) : DISCNT_STATUS { ACTIVE:활성, INACTIVE:비활성, EXPIRED:만료 }

-- ============================================================
-- pm_discnt_item : 할인 대상 항목 (상품/카테고리)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pm_discnt_item (
    discnt_item_id      VARCHAR(21)     NOT NULL,
    discnt_id           VARCHAR(21)     NOT NULL,               -- pm_discnt.discnt_id
    site_id             VARCHAR(21),
    target_type_cd      VARCHAR(20)     NOT NULL,               -- 코드: DISCNT_ITEM_TARGET (CATEGORY/PRODUCT/MEMBER_GRADE)
    target_id           VARCHAR(21)     NOT NULL,               -- category_id / prod_id / grade_cd
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (discnt_item_id),
    UNIQUE (discnt_id, target_type_cd, target_id)
);

COMMENT ON TABLE pm_discnt_item IS '할인 대상 항목';
COMMENT ON COLUMN pm_discnt_item.discnt_item_id  IS '할인항목ID';
COMMENT ON COLUMN pm_discnt_item.discnt_id       IS '할인ID (pm_discnt.discnt_id)';
COMMENT ON COLUMN pm_discnt_item.site_id         IS '사이트ID';
COMMENT ON COLUMN pm_discnt_item.target_type_cd  IS '대상유형 (코드: DISCNT_ITEM_TARGET)';
COMMENT ON COLUMN pm_discnt_item.target_id       IS '대상ID (category_id/prod_id/grade_cd)';
COMMENT ON COLUMN pm_discnt_item.reg_by          IS '등록자';
COMMENT ON COLUMN pm_discnt_item.reg_date        IS '등록일';

CREATE INDEX idx_pm_discnt_item_discnt ON pm_discnt_item (discnt_id);
CREATE INDEX idx_pm_discnt_item_target ON pm_discnt_item (target_type_cd, target_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_discnt_item.target_type_cd (대상유형) : PROMO_TARGET_TYPE { ALL:전체, PRODUCT:상품, CATEGORY:카테고리, VENDOR:업체, BRAND:브랜드, MEMBER_GRADE:회원등급 }

-- ============================================================
-- pm_discnt_usage : 할인 적용 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 주문 시 적용된 할인정책을 건별로 기록
-- ============================================================
CREATE TABLE IF NOT EXISTS pm_discnt_usage (
    discnt_usage_id     VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    discnt_id           VARCHAR(21)     NOT NULL,               -- pm_discnt.discnt_id
    discnt_nm           VARCHAR(100),                           -- 할인명 스냅샷
    member_id           VARCHAR(21),                            -- mb_member.member_id
    order_id            VARCHAR(21),                            -- od_order.order_id
    order_item_id       VARCHAR(21),                            -- od_order_item.order_item_id (상품별 할인 적용 시)
    prod_id             VARCHAR(21),                            -- pd_prod.prod_id (할인 적용 상품)
    discnt_type_cd      VARCHAR(20),                            -- 할인유형 스냅샷 (RATE/FIXED/FREE_SHIP)
    discnt_value        NUMERIC(10,2)   DEFAULT 0,              -- 할인값 스냅샷 (율 또는 금액)
    discnt_amt          BIGINT          DEFAULT 0,              -- 실할인금액
    used_date           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (discnt_usage_id)
);

COMMENT ON TABLE  pm_discnt_usage IS '할인 적용 이력 (주문 시 적용된 할인정책 건별 기록)';
COMMENT ON COLUMN pm_discnt_usage.discnt_usage_id  IS '할인사용ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_discnt_usage.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pm_discnt_usage.discnt_id        IS '할인ID (pm_discnt.discnt_id)';
COMMENT ON COLUMN pm_discnt_usage.discnt_nm        IS '할인명 스냅샷';
COMMENT ON COLUMN pm_discnt_usage.member_id        IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN pm_discnt_usage.order_id         IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN pm_discnt_usage.order_item_id    IS '주문상품ID (od_order_item.order_item_id, 상품별 할인 적용 시)';
COMMENT ON COLUMN pm_discnt_usage.prod_id          IS '상품ID (pd_prod.prod_id, 할인 적용 상품)';
COMMENT ON COLUMN pm_discnt_usage.discnt_type_cd   IS '할인유형 스냅샷 (RATE=정률 / FIXED=정액 / FREE_SHIP=무료배송)';
COMMENT ON COLUMN pm_discnt_usage.discnt_value     IS '할인값 스냅샷 (정률이면 % / 정액이면 원)';
COMMENT ON COLUMN pm_discnt_usage.discnt_amt       IS '실할인금액';
COMMENT ON COLUMN pm_discnt_usage.used_date        IS '적용일시';
COMMENT ON COLUMN pm_discnt_usage.reg_by           IS '등록자';
COMMENT ON COLUMN pm_discnt_usage.reg_date         IS '등록일';

CREATE INDEX idx_pm_discnt_usage_discnt ON pm_discnt_usage (discnt_id);
CREATE INDEX idx_pm_discnt_usage_member ON pm_discnt_usage (member_id);
CREATE INDEX idx_pm_discnt_usage_order  ON pm_discnt_usage (order_id);
CREATE INDEX idx_pm_discnt_usage_item   ON pm_discnt_usage (order_item_id);
CREATE INDEX idx_pm_discnt_usage_prod   ON pm_discnt_usage (prod_id);

-- ============================================================
-- ec_cache : 적립금 (캐시)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pm_cache (
    cache_id        VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    member_id       VARCHAR(21)     NOT NULL,
    member_nm       VARCHAR(50),
    cache_type_cd   VARCHAR(20)     NOT NULL,               -- 코드: CACHE_TYPE (EARN/USE/EXPIRE/ADMIN)
    cache_amt       BIGINT          DEFAULT 0,              -- 양수: 적립, 음수: 사용
    balance_amt     BIGINT          DEFAULT 0,              -- 처리 후 잔액
    ref_id          VARCHAR(21),                            -- 참조ID (order_id 등)
    cache_desc      VARCHAR(200),
    proc_user_id         VARCHAR(21),
    cache_date      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    expire_date     DATE,                                   -- 소멸예정일
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (cache_id)
);

COMMENT ON TABLE pm_cache IS '적립금 (캐시)';
COMMENT ON COLUMN pm_cache.cache_id      IS '적립금ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_cache.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pm_cache.member_id     IS '회원ID';
COMMENT ON COLUMN pm_cache.member_nm     IS '회원명';
COMMENT ON COLUMN pm_cache.cache_type_cd IS '유형 (코드: CACHE_TYPE)';
COMMENT ON COLUMN pm_cache.cache_amt     IS '금액 (양수:적립 / 음수:차감)';
COMMENT ON COLUMN pm_cache.balance_amt   IS '처리후 잔액';
COMMENT ON COLUMN pm_cache.ref_id        IS '참조ID (주문ID 등)';
COMMENT ON COLUMN pm_cache.cache_desc    IS '내역 설명';
COMMENT ON COLUMN pm_cache.proc_user_id       IS '처리자 (관리자 직접 부여시)';
COMMENT ON COLUMN pm_cache.cache_date    IS '처리일시';
COMMENT ON COLUMN pm_cache.expire_date   IS '소멸예정일';
COMMENT ON COLUMN pm_cache.reg_by        IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_cache.reg_date      IS '등록일';
COMMENT ON COLUMN pm_cache.upd_by        IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_cache.upd_date      IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_cache.cache_type_cd (유형) : 적립금유형 { EARN_BUY:구매 적립, EARN_ADMIN:관리자 지급, EARN_EVENT:이벤트 지급, USE_ORDER:주문 사용, REFUND:환불 복원, EXPIRE:소멸 }

-- ============================================================
-- pm_save : 마일리지 적립/사용 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 용도: 구매 시 자동 적립, 유효기간 소멸 있는 포인트
-- ============================================================
CREATE TABLE IF NOT EXISTS pm_save (
    save_id             VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    member_id           VARCHAR(21)     NOT NULL,               -- mb_member.member_id
    save_type_cd        VARCHAR(20)     NOT NULL,               -- 코드: SAVE_TYPE (EARN:구매적립/USE:사용/EXPIRE:소멸/CANCEL:적립취소/ADMIN:관리자조정)
    save_amt            BIGINT          NOT NULL,               -- 마일리지 변동액 (양수:적립/음수:차감)
    balance_amt         BIGINT          DEFAULT 0,              -- 처리 후 잔액
    ref_type_cd         VARCHAR(30),                            -- 연관유형 (ORDER/EVENT/ADMIN 등)
    ref_id              VARCHAR(21),                            -- 연관ID (order_id 등)
    expire_date         TIMESTAMP,                              -- 소멸예정일 (EARN 시 설정)
    save_memo           TEXT,                                   -- 메모
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (save_id)
);

COMMENT ON TABLE pm_save IS '마일리지 적립/사용 이력';
COMMENT ON COLUMN pm_save.save_id       IS '마일리지ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_save.site_id       IS '사이트ID';
COMMENT ON COLUMN pm_save.member_id     IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN pm_save.save_type_cd  IS '유형 (코드: SAVE_TYPE — EARN/USE/EXPIRE/CANCEL/ADMIN)';
COMMENT ON COLUMN pm_save.save_amt      IS '변동액 (양수:적립, 음수:차감)';
COMMENT ON COLUMN pm_save.balance_amt   IS '처리 후 잔액';
COMMENT ON COLUMN pm_save.ref_type_cd   IS '연관유형 (ORDER/EVENT/ADMIN 등)';
COMMENT ON COLUMN pm_save.ref_id        IS '연관ID';
COMMENT ON COLUMN pm_save.expire_date   IS '소멸예정일';
COMMENT ON COLUMN pm_save.save_memo     IS '메모';
COMMENT ON COLUMN pm_save.reg_by        IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_save.reg_date      IS '등록일';

CREATE INDEX idx_pm_save_member ON pm_save (member_id);
CREATE INDEX idx_pm_save_type   ON pm_save (save_type_cd);
CREATE INDEX idx_pm_save_expire ON pm_save (expire_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_save.save_type_cd (유형) : SAVE_TYPE { EARN:적립, USE:사용, EXPIRE:소멸, CANCEL:취소, ADMIN:관리자 }

-- ============================================================
-- pm_save_issue : 적립금 지급 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 구매적립/이벤트/리뷰/관리자 등 적립 발생 건별 기록
-- 지급 확정 후 pm_save 원장에 EARN 타입으로 반영
-- ============================================================
CREATE TABLE IF NOT EXISTS pm_save_issue (
    save_issue_id       VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    member_id           VARCHAR(21)     NOT NULL,               -- mb_member.member_id
    save_issue_type_cd  VARCHAR(20)     NOT NULL,               -- 코드: SAVE_ISSUE_TYPE (ORDER:구매적립/EVENT:이벤트/REVIEW:리뷰/REFERRAL:추천/ADMIN:관리자)
    save_amt            BIGINT          NOT NULL,               -- 지급 적립금액
    save_rate           NUMERIC(5,2),                           -- 적립률 (%, 구매적립 시)
    ref_type_cd         VARCHAR(20),                            -- 참조유형 (ORDER/EVENT/REVIEW/ADMIN)
    ref_id              VARCHAR(21),                            -- 참조ID (order_id / event_id 등)
    order_id            VARCHAR(21),                            -- od_order.order_id (구매적립 시)
    order_item_id       VARCHAR(21),                            -- od_order_item.order_item_id (상품별 적립 시)
    prod_id             VARCHAR(21),                            -- pd_prod.prod_id (적립 기준 상품)
    expire_date         TIMESTAMP,                              -- 소멸예정일
    issue_status_cd     VARCHAR(20)     DEFAULT 'PENDING',      -- 코드: SAVE_ISSUE_STATUS (PENDING:대기/CONFIRMED:확정/EXPIRED:소멸/CANCELED:취소)
    issue_status_cd_before VARCHAR(20),                         -- 변경 전 상태
    save_memo           VARCHAR(300),                           -- 지급 메모
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,

    PRIMARY KEY (save_issue_id)
);

COMMENT ON TABLE  pm_save_issue IS '적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등)';
COMMENT ON COLUMN pm_save_issue.save_issue_id       IS '적립지급ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_save_issue.site_id             IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pm_save_issue.member_id           IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN pm_save_issue.save_issue_type_cd  IS '지급유형 (코드: SAVE_ISSUE_TYPE — ORDER/EVENT/REVIEW/REFERRAL/ADMIN)';
COMMENT ON COLUMN pm_save_issue.save_amt            IS '지급 적립금액';
COMMENT ON COLUMN pm_save_issue.save_rate           IS '적립률 (%, 구매적립 시)';
COMMENT ON COLUMN pm_save_issue.ref_type_cd         IS '참조유형 (ORDER/EVENT/REVIEW/ADMIN)';
COMMENT ON COLUMN pm_save_issue.ref_id              IS '참조ID (order_id / event_id 등)';
COMMENT ON COLUMN pm_save_issue.order_id            IS '주문ID (od_order.order_id, 구매적립 시)';
COMMENT ON COLUMN pm_save_issue.order_item_id       IS '주문상품ID (od_order_item.order_item_id, 상품별 적립 시)';
COMMENT ON COLUMN pm_save_issue.prod_id             IS '상품ID (pd_prod.prod_id, 적립 기준 상품)';
COMMENT ON COLUMN pm_save_issue.expire_date         IS '소멸예정일';
COMMENT ON COLUMN pm_save_issue.issue_status_cd     IS '지급상태 (코드: SAVE_ISSUE_STATUS — PENDING/CONFIRMED/EXPIRED/CANCELED)';
COMMENT ON COLUMN pm_save_issue.issue_status_cd_before IS '변경 전 지급상태';
COMMENT ON COLUMN pm_save_issue.save_memo           IS '지급 메모';
COMMENT ON COLUMN pm_save_issue.reg_by              IS '등록자';
COMMENT ON COLUMN pm_save_issue.reg_date            IS '등록일';
COMMENT ON COLUMN pm_save_issue.upd_by              IS '수정자';
COMMENT ON COLUMN pm_save_issue.upd_date            IS '수정일';

CREATE INDEX idx_pm_save_issue_member  ON pm_save_issue (member_id);
CREATE INDEX idx_pm_save_issue_type    ON pm_save_issue (save_issue_type_cd);
CREATE INDEX idx_pm_save_issue_order   ON pm_save_issue (order_id);
CREATE INDEX idx_pm_save_issue_item    ON pm_save_issue (order_item_id);
CREATE INDEX idx_pm_save_issue_status  ON pm_save_issue (issue_status_cd);
CREATE INDEX idx_pm_save_issue_expire  ON pm_save_issue (expire_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_save_issue.save_issue_type_cd (지급유형) : SAVE_ISSUE_TYPE { JOIN:회원가입, ORDER_COMPLT:구매완료, REVIEW_TEXT:텍스트리뷰, REVIEW_PHOTO:포토리뷰, REVIEW_VIDEO:동영상리뷰, EVENT:이벤트, BIRTHDAY:생일, REFERRAL:추천인, ADMIN_GRANT:관리자지급, ADMIN_REVOKE:관리자회수, ORDER_CANCEL:주문취소, EXPIRE:기간만료, CLAIM_SHIP:클레임배송비 }
-- [CODES] pm_save_issue.issue_status_cd (지급상태) : SAVE_ISSUE_STATUS { SCHEDULED:예정, COMPLETED:완료, CANCELLED:취소, EXPIRED:만료 }

-- ============================================================
-- pm_save_usage : 적립금 사용 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 주문 시 사용된 적립금을 건별로 기록
-- 사용 후 pm_save 원장에 USE 타입으로 반영
-- ============================================================
CREATE TABLE IF NOT EXISTS pm_save_usage (
    save_usage_id       VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    member_id           VARCHAR(21)     NOT NULL,               -- mb_member.member_id
    order_id            VARCHAR(21),                            -- od_order.order_id
    order_item_id       VARCHAR(21),                            -- od_order_item.order_item_id (상품별 사용 시)
    prod_id             VARCHAR(21),                            -- pd_prod.prod_id (사용 상품)
    use_amt             BIGINT          NOT NULL,               -- 사용 적립금액
    balance_amt         BIGINT          DEFAULT 0,              -- 사용 후 잔액
    used_date           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (save_usage_id)
);

COMMENT ON TABLE  pm_save_usage IS '적립금 사용 이력 (주문 시 사용된 적립금 건별 기록)';
COMMENT ON COLUMN pm_save_usage.save_usage_id  IS '적립사용ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_save_usage.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pm_save_usage.member_id      IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN pm_save_usage.order_id       IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN pm_save_usage.order_item_id  IS '주문상품ID (od_order_item.order_item_id, 상품별 사용 시)';
COMMENT ON COLUMN pm_save_usage.prod_id        IS '상품ID (pd_prod.prod_id, 사용 상품)';
COMMENT ON COLUMN pm_save_usage.use_amt        IS '사용 적립금액';
COMMENT ON COLUMN pm_save_usage.balance_amt    IS '사용 후 잔액';
COMMENT ON COLUMN pm_save_usage.used_date      IS '사용일시';
COMMENT ON COLUMN pm_save_usage.reg_by         IS '등록자';
COMMENT ON COLUMN pm_save_usage.reg_date       IS '등록일';

CREATE INDEX idx_pm_save_usage_member ON pm_save_usage (member_id);
CREATE INDEX idx_pm_save_usage_order  ON pm_save_usage (order_id);
CREATE INDEX idx_pm_save_usage_item   ON pm_save_usage (order_item_id);
CREATE INDEX idx_pm_save_usage_prod   ON pm_save_usage (prod_id);

-- ============================================================
-- ec_event : 이벤트
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pm_event (
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
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
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

-- ============================================================
-- pm_event_item : 이벤트 적용 대상 항목
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 이벤트에 포함되는 상품/카테고리/판매자/브랜드를 지정
-- sort_no: 이벤트 내 노출 순서
-- 항목이 없으면 전체 적용 (pm_event.target_type_cd 기준)
-- ============================================================
CREATE TABLE IF NOT EXISTS pm_event_item (
    event_item_id       VARCHAR(21)     NOT NULL,
    event_id            VARCHAR(21)     NOT NULL,               -- pm_event.event_id
    site_id             VARCHAR(21),                            -- sy_site.site_id
    target_type_cd      VARCHAR(20)     NOT NULL,               -- 코드: EVENT_ITEM_TARGET (PRODUCT/CATEGORY/VENDOR/BRAND)
    target_id           VARCHAR(21)     NOT NULL,               -- prod_id / category_id / vendor_id / brand_id
    sort_no             INTEGER         DEFAULT 0,              -- 이벤트 내 노출 순서
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (event_item_id),
    UNIQUE (event_id, target_type_cd, target_id)
);

COMMENT ON TABLE  pm_event_item IS '이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드)';
COMMENT ON COLUMN pm_event_item.event_item_id   IS '이벤트항목ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_event_item.event_id        IS '이벤트ID (pm_event.event_id)';
COMMENT ON COLUMN pm_event_item.site_id         IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pm_event_item.target_type_cd  IS '대상유형 (코드: EVENT_ITEM_TARGET — PRODUCT/CATEGORY/VENDOR/BRAND)';
COMMENT ON COLUMN pm_event_item.target_id       IS '대상ID (prod_id / category_id / vendor_id / brand_id)';
COMMENT ON COLUMN pm_event_item.sort_no         IS '이벤트 내 노출 순서';
COMMENT ON COLUMN pm_event_item.reg_by          IS '등록자';
COMMENT ON COLUMN pm_event_item.reg_date        IS '등록일';

CREATE INDEX idx_pm_event_item_event  ON pm_event_item (event_id);
CREATE INDEX idx_pm_event_item_target ON pm_event_item (target_type_cd, target_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_event_item.target_type_cd (대상유형) : PROMO_TARGET_TYPE { ALL:전체, PRODUCT:상품, CATEGORY:카테고리, VENDOR:업체, BRAND:브랜드, MEMBER_GRADE:회원등급 }

-- 이벤트 혜택 (쿠폰/적립 등 구체 혜택 항목)
CREATE TABLE IF NOT EXISTS pm_event_benefit (
    benefit_id      VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),
    event_id        VARCHAR(21)     NOT NULL,              -- pm_event.
    benefit_nm      VARCHAR(100)    NOT NULL,
    benefit_type_cd VARCHAR(20),                            -- 코드: BENEFIT_TYPE (COUPON/POINT/DISCOUNT/GIFT)
    condition_desc  VARCHAR(200),                           -- 조건 설명 (예: 20만원 이상)
    benefit_value   VARCHAR(100),                           -- 혜택 값 (예: 10,000원, 10%)
    coupon_id       VARCHAR(21),                            -- 연결 쿠폰ID (pm_coupon.)
    sort_ord        INTEGER         DEFAULT 0,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (benefit_id)
);

COMMENT ON TABLE pm_event_benefit IS '이벤트 혜택';
COMMENT ON COLUMN pm_event_benefit.benefit_id       IS '혜택ID';
COMMENT ON COLUMN pm_event_benefit.site_id          IS '사이트ID';
COMMENT ON COLUMN pm_event_benefit.event_id         IS '이벤트ID';
COMMENT ON COLUMN pm_event_benefit.benefit_nm       IS '혜택명';
COMMENT ON COLUMN pm_event_benefit.benefit_type_cd  IS '혜택유형 (코드: BENEFIT_TYPE)';
COMMENT ON COLUMN pm_event_benefit.condition_desc   IS '조건 설명';
COMMENT ON COLUMN pm_event_benefit.benefit_value    IS '혜택 값';
COMMENT ON COLUMN pm_event_benefit.coupon_id        IS '연결 쿠폰ID';
COMMENT ON COLUMN pm_event_benefit.sort_ord         IS '정렬순서';
COMMENT ON COLUMN pm_event_benefit.reg_by           IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_event_benefit.reg_date         IS '등록일';
COMMENT ON COLUMN pm_event_benefit.upd_by           IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_event_benefit.upd_date         IS '수정일';

CREATE INDEX idx_pm_event_benefit_event ON pm_event_benefit (event_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_event_benefit.benefit_type_cd (혜택유형) : BENEFIT_TYPE { COUPON:쿠폰, SAVE:적립금, CACHE:캐쉬, GIFT:사은품, DISCOUNT:할인 }

-- ============================================================
-- pm_gift : 사은품
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pm_gift (
    gift_id             VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),
    gift_nm             VARCHAR(100)    NOT NULL,               -- 사은품명
    gift_type_cd        VARCHAR(20)     DEFAULT 'PRODUCT',      -- 코드: GIFT_TYPE (PRODUCT:상품/SAMPLE:샘플/ETC:기타)
    prod_id             VARCHAR(21),                            -- 연결 상품 (pd_prod.prod_id, 비상품이면 NULL)
    gift_stock          INTEGER         DEFAULT 0,              -- 사은품 재고
    gift_desc           TEXT,                                   -- 사은품 설명
    start_date          TIMESTAMP,
    end_date            TIMESTAMP,
    gift_status_cd      VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: GIFT_STATUS (ACTIVE/INACTIVE)
    gift_status_cd_before VARCHAR(20),
    mem_grade_cd        VARCHAR(20),                            -- 적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)
    min_order_amt       BIGINT          DEFAULT 0,              -- 최소주문금액 (사은품 지급 조건)
    min_order_qty       INTEGER,                                -- 최소주문수량 (NULL=제한없음)
    -- 부담금 설정
    self_cdiv_rate      DECIMAL(5,2)    DEFAULT 100,            -- 자사(사이트) 분담율 (%)
    seller_cdiv_rate    DECIMAL(5,2)    DEFAULT 0,              -- 판매자(업체) 분담율 (%)
    use_yn              CHAR(1)         DEFAULT 'Y',
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (gift_id)
);

COMMENT ON TABLE pm_gift IS '사은품';
COMMENT ON COLUMN pm_gift.gift_id           IS '사은품ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_gift.site_id           IS '사이트ID';
COMMENT ON COLUMN pm_gift.gift_nm           IS '사은품명';
COMMENT ON COLUMN pm_gift.gift_type_cd      IS '사은품유형 (코드: GIFT_TYPE — PRODUCT/SAMPLE/ETC)';
COMMENT ON COLUMN pm_gift.prod_id           IS '연결 상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pm_gift.gift_stock        IS '사은품 재고';
COMMENT ON COLUMN pm_gift.gift_desc         IS '사은품 설명';
COMMENT ON COLUMN pm_gift.start_date        IS '시작일시';
COMMENT ON COLUMN pm_gift.end_date          IS '종료일시';
COMMENT ON COLUMN pm_gift.gift_status_cd    IS '상태 (코드: GIFT_STATUS)';
COMMENT ON COLUMN pm_gift.gift_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN pm_gift.mem_grade_cd      IS '적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)';
COMMENT ON COLUMN pm_gift.min_order_amt     IS '최소주문금액 — 사은품 지급 기준 금액';
COMMENT ON COLUMN pm_gift.min_order_qty     IS '최소주문수량 (NULL=제한없음)';
COMMENT ON COLUMN pm_gift.self_cdiv_rate    IS '자사(사이트) 분담율 (%) — 기본 100%';
COMMENT ON COLUMN pm_gift.seller_cdiv_rate  IS '판매자(업체) 분담율 (%) — 기본 0%';
COMMENT ON COLUMN pm_gift.use_yn            IS '사용여부 Y/N';
COMMENT ON COLUMN pm_gift.reg_by            IS '등록자';
COMMENT ON COLUMN pm_gift.reg_date          IS '등록일';
COMMENT ON COLUMN pm_gift.upd_by            IS '수정자';
COMMENT ON COLUMN pm_gift.upd_date          IS '수정일';

CREATE INDEX idx_pm_gift_site   ON pm_gift (site_id);
CREATE INDEX idx_pm_gift_status ON pm_gift (gift_status_cd);
CREATE INDEX idx_pm_gift_grade  ON pm_gift (mem_grade_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_gift.gift_type_cd (사은품유형) : GIFT_TYPE { PRODUCT:상품형, SAMPLE:샘플형, ETC:기타 }
-- [CODES] pm_gift.gift_status_cd (상태) : GIFT_STATUS { ACTIVE:활성, INACTIVE:비활성 }

-- ============================================================
-- pm_gift_cond : 사은품 지급 조건
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pm_gift_cond (
    gift_cond_id        VARCHAR(21)     NOT NULL,
    gift_id             VARCHAR(21)     NOT NULL,               -- pm_gift.gift_id
    site_id             VARCHAR(21),
    cond_type_cd        VARCHAR(20)     NOT NULL,               -- 코드: GIFT_COND_TYPE (ORDER_AMT:주문금액/PRODUCT:상품구매/MEMBER_GRADE:회원등급)
    min_order_amt       BIGINT          DEFAULT 0,              -- ORDER_AMT 조건: 최소주문금액
    target_type_cd      VARCHAR(20),                            -- PRODUCT/CATEGORY/MEMBER_GRADE
    target_id           VARCHAR(21),                            -- prod_id / category_id / grade_cd
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (gift_cond_id)
);

COMMENT ON TABLE pm_gift_cond IS '사은품 지급 조건';
COMMENT ON COLUMN pm_gift_cond.gift_cond_id   IS '사은품조건ID';
COMMENT ON COLUMN pm_gift_cond.gift_id        IS '사은품ID (pm_gift.gift_id)';
COMMENT ON COLUMN pm_gift_cond.site_id        IS '사이트ID';
COMMENT ON COLUMN pm_gift_cond.cond_type_cd   IS '조건유형 (코드: GIFT_COND_TYPE)';
COMMENT ON COLUMN pm_gift_cond.min_order_amt  IS '최소주문금액 (ORDER_AMT 조건)';
COMMENT ON COLUMN pm_gift_cond.target_type_cd IS '대상유형 (PRODUCT/CATEGORY/MEMBER_GRADE)';
COMMENT ON COLUMN pm_gift_cond.target_id      IS '대상ID';
COMMENT ON COLUMN pm_gift_cond.reg_by         IS '등록자';
COMMENT ON COLUMN pm_gift_cond.reg_date       IS '등록일';

CREATE INDEX idx_pm_gift_cond_gift ON pm_gift_cond (gift_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_gift_cond.cond_type_cd (조건유형) : GIFT_COND_TYPE { ORDER_AMT:주문금액, PRODUCT:상품, MEMBER_GRADE:회원등급 }

-- ============================================================
-- pm_gift_issue : 사은품 발급
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pm_gift_issue (
    gift_issue_id       VARCHAR(21)     NOT NULL,
    gift_id             VARCHAR(21)     NOT NULL,               -- pm_gift.gift_id
    site_id             VARCHAR(21),
    member_id           VARCHAR(21)     NOT NULL,               -- mb_member.member_id
    order_id            VARCHAR(21),                            -- 발급 기준 주문 (od_order.order_id)
    issue_date          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    gift_issue_status_cd VARCHAR(20)    DEFAULT 'ISSUED',       -- 코드: GIFT_ISSUE_STATUS (ISSUED:발급/DELIVERED:배송완료/CANCELLED:취소)
    gift_issue_status_cd_before VARCHAR(20),
    gift_issue_memo     TEXT,
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (gift_issue_id)
);

COMMENT ON TABLE pm_gift_issue IS '사은품 발급';
COMMENT ON COLUMN pm_gift_issue.gift_issue_id       IS '사은품발급ID';
COMMENT ON COLUMN pm_gift_issue.gift_id             IS '사은품ID (pm_gift.gift_id)';
COMMENT ON COLUMN pm_gift_issue.site_id             IS '사이트ID';
COMMENT ON COLUMN pm_gift_issue.member_id           IS '회원ID';
COMMENT ON COLUMN pm_gift_issue.order_id            IS '기준주문ID (od_order.order_id)';
COMMENT ON COLUMN pm_gift_issue.issue_date          IS '발급일시';
COMMENT ON COLUMN pm_gift_issue.gift_issue_status_cd IS '상태 (코드: GIFT_ISSUE_STATUS)';
COMMENT ON COLUMN pm_gift_issue.gift_issue_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN pm_gift_issue.gift_issue_memo     IS '메모';
COMMENT ON COLUMN pm_gift_issue.reg_by              IS '등록자';
COMMENT ON COLUMN pm_gift_issue.reg_date            IS '등록일';
COMMENT ON COLUMN pm_gift_issue.upd_by              IS '수정자';
COMMENT ON COLUMN pm_gift_issue.upd_date            IS '수정일';

CREATE INDEX idx_pm_gift_issue_gift   ON pm_gift_issue (gift_id);
CREATE INDEX idx_pm_gift_issue_member ON pm_gift_issue (member_id);
CREATE INDEX idx_pm_gift_issue_order  ON pm_gift_issue (order_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_gift_issue.gift_issue_status_cd (상태) : GIFT_ISSUE_STATUS { ISSUED:발급, DELIVERED:지급완료, CANCELLED:취소 }

-- ============================================================
-- pm_plan : 기획전
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pm_plan (
    plan_id             VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),
    plan_nm             VARCHAR(100)    NOT NULL,               -- 기획전명
    plan_title          VARCHAR(200)    NOT NULL,               -- 기획전 타이틀 (노출용)
    plan_type_cd        VARCHAR(20)     DEFAULT 'THEME',        -- 코드: PLAN_TYPE (SEASON:시즌/BRAND:브랜드/THEME:테마/COLLAB:협업)
    plan_desc           TEXT,                                   -- 기획전 설명
    thumbnail_url       VARCHAR(500),                           -- 썸네일 이미지 URL
    banner_url          VARCHAR(500),                           -- 배너 이미지 URL
    start_date          TIMESTAMP,
    end_date            TIMESTAMP,
    plan_status_cd      VARCHAR(20)     DEFAULT 'DRAFT',        -- 코드: PLAN_STATUS (DRAFT:임시/ACTIVE:진행중/ENDED:종료)
    plan_status_cd_before VARCHAR(20),
    sort_ord            INTEGER         DEFAULT 0,
    use_yn              CHAR(1)         DEFAULT 'Y',
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (plan_id)
);

COMMENT ON TABLE pm_plan IS '기획전';
COMMENT ON COLUMN pm_plan.plan_id           IS '기획전ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_plan.site_id           IS '사이트ID';
COMMENT ON COLUMN pm_plan.plan_nm           IS '기획전명 (내부용)';
COMMENT ON COLUMN pm_plan.plan_title        IS '기획전 타이틀 (노출용)';
COMMENT ON COLUMN pm_plan.plan_type_cd      IS '유형 (코드: PLAN_TYPE — SEASON/BRAND/THEME/COLLAB)';
COMMENT ON COLUMN pm_plan.plan_desc         IS '기획전 설명';
COMMENT ON COLUMN pm_plan.thumbnail_url     IS '썸네일 이미지 URL';
COMMENT ON COLUMN pm_plan.banner_url        IS '배너 이미지 URL';
COMMENT ON COLUMN pm_plan.start_date        IS '시작일시';
COMMENT ON COLUMN pm_plan.end_date          IS '종료일시';
COMMENT ON COLUMN pm_plan.plan_status_cd    IS '상태 (코드: PLAN_STATUS — DRAFT/ACTIVE/ENDED)';
COMMENT ON COLUMN pm_plan.plan_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN pm_plan.sort_ord          IS '정렬순서';
COMMENT ON COLUMN pm_plan.use_yn            IS '사용여부 Y/N';
COMMENT ON COLUMN pm_plan.reg_by            IS '등록자';
COMMENT ON COLUMN pm_plan.reg_date          IS '등록일';
COMMENT ON COLUMN pm_plan.upd_by            IS '수정자';
COMMENT ON COLUMN pm_plan.upd_date          IS '수정일';

CREATE INDEX idx_pm_plan_site   ON pm_plan (site_id);
CREATE INDEX idx_pm_plan_status ON pm_plan (plan_status_cd);
CREATE INDEX idx_pm_plan_date   ON pm_plan (start_date, end_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_plan.plan_type_cd (유형) : PLAN_TYPE { GENERAL:일반, BRAND:브랜드기획, SEASON:시즌, SALE:세일 }
-- [CODES] pm_plan.plan_status_cd (상태) : PLAN_STATUS { DRAFT:초안, ACTIVE:활성, ENDED:종료, INACTIVE:비활성 }

-- ============================================================
-- pm_plan_item : 기획전 상품
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pm_plan_item (
    plan_item_id        VARCHAR(21)     NOT NULL,
    plan_id             VARCHAR(21)     NOT NULL,               -- pm_plan.plan_id
    site_id             VARCHAR(21),
    prod_id             VARCHAR(21)     NOT NULL,               -- pd_prod.prod_id
    sort_ord            INTEGER         DEFAULT 0,
    plan_item_memo      VARCHAR(500),                           -- 항목 메모 (특가/한정수량 등)
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (plan_item_id),
    UNIQUE (plan_id, prod_id)
);

COMMENT ON TABLE pm_plan_item IS '기획전 상품';
COMMENT ON COLUMN pm_plan_item.plan_item_id  IS '기획전상품ID';
COMMENT ON COLUMN pm_plan_item.plan_id       IS '기획전ID (pm_plan.plan_id)';
COMMENT ON COLUMN pm_plan_item.site_id       IS '사이트ID';
COMMENT ON COLUMN pm_plan_item.prod_id       IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pm_plan_item.sort_ord      IS '정렬순서';
COMMENT ON COLUMN pm_plan_item.plan_item_memo IS '항목 메모 (특가/한정수량 등)';
COMMENT ON COLUMN pm_plan_item.reg_by        IS '등록자';
COMMENT ON COLUMN pm_plan_item.reg_date      IS '등록일';
COMMENT ON COLUMN pm_plan_item.upd_by        IS '수정자';
COMMENT ON COLUMN pm_plan_item.upd_date      IS '수정일';

CREATE INDEX idx_pm_plan_item_plan ON pm_plan_item (plan_id);
CREATE INDEX idx_pm_plan_item_prod ON pm_plan_item (prod_id);

-- ============================================================
-- pm_voucher : 상품권 (금액권/정률권)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pm_voucher (
    voucher_id          VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),
    voucher_nm          VARCHAR(100)    NOT NULL,               -- 상품권명
    voucher_type_cd     VARCHAR(20)     NOT NULL,               -- 코드: VOUCHER_TYPE (AMOUNT:금액권/RATE:정률권)
    voucher_value       NUMERIC(10,2)   NOT NULL,               -- 권면금액 (금액이면 원, 정률이면 %)
    min_order_amt       BIGINT          DEFAULT 0,              -- 사용 최소주문금액
    max_discnt_amt      BIGINT,                                 -- 최대할인한도 (정률권, NULL=무제한)
    expire_month        INTEGER,                                 -- 발급 후 유효기간 (개월, NULL=무제한)
    voucher_status_cd   VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: VOUCHER_STATUS (ACTIVE/INACTIVE/EXPIRED)
    voucher_status_cd_before VARCHAR(20),
    voucher_desc        TEXT,
    use_yn              CHAR(1)         DEFAULT 'Y',
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (voucher_id)
);

COMMENT ON TABLE pm_voucher IS '상품권';
COMMENT ON COLUMN pm_voucher.voucher_id         IS '상품권ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_voucher.site_id            IS '사이트ID';
COMMENT ON COLUMN pm_voucher.voucher_nm         IS '상품권명';
COMMENT ON COLUMN pm_voucher.voucher_type_cd    IS '유형 (코드: VOUCHER_TYPE — AMOUNT/RATE)';
COMMENT ON COLUMN pm_voucher.voucher_value      IS '권면금액 또는 할인율';
COMMENT ON COLUMN pm_voucher.min_order_amt      IS '사용 최소주문금액';
COMMENT ON COLUMN pm_voucher.max_discnt_amt     IS '최대할인한도 (정률권)';
COMMENT ON COLUMN pm_voucher.expire_month       IS '유효기간 (발급 후 N개월, NULL=무제한)';
COMMENT ON COLUMN pm_voucher.voucher_status_cd  IS '상태 (코드: VOUCHER_STATUS)';
COMMENT ON COLUMN pm_voucher.voucher_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN pm_voucher.voucher_desc       IS '상품권 설명';
COMMENT ON COLUMN pm_voucher.use_yn             IS '사용여부 Y/N';
COMMENT ON COLUMN pm_voucher.reg_by             IS '등록자';
COMMENT ON COLUMN pm_voucher.reg_date           IS '등록일';
COMMENT ON COLUMN pm_voucher.upd_by             IS '수정자';
COMMENT ON COLUMN pm_voucher.upd_date           IS '수정일';

CREATE INDEX idx_pm_voucher_site   ON pm_voucher (site_id);
CREATE INDEX idx_pm_voucher_status ON pm_voucher (voucher_status_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_voucher.voucher_type_cd (유형) : GIFT_TYPE { PRODUCT:상품형, SAMPLE:샘플형, ETC:기타 }
-- [CODES] pm_voucher.voucher_status_cd (상태) : GIFT_STATUS { ACTIVE:활성, INACTIVE:비활성 }

-- ============================================================
-- pm_voucher_issue : 상품권 발급 및 사용 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS pm_voucher_issue (
    voucher_issue_id    VARCHAR(21)     NOT NULL,
    voucher_id          VARCHAR(21)     NOT NULL,               -- pm_voucher.voucher_id
    site_id             VARCHAR(21),
    member_id           VARCHAR(21),                            -- 발급 대상 회원 (NULL이면 미할당)
    voucher_code        VARCHAR(50)     NOT NULL,               -- 발급된 고유 코드
    issue_date          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    expire_date         TIMESTAMP,                              -- 만료일시
    use_date            TIMESTAMP,                              -- 사용일시
    order_id            VARCHAR(21),                            -- 사용된 주문 (od_order.order_id)
    use_amt             BIGINT,                                 -- 실제 사용 할인금액
    voucher_issue_status_cd VARCHAR(20) DEFAULT 'ISSUED',       -- 코드: VOUCHER_ISSUE_STATUS (ISSUED:발급/USED:사용/EXPIRED:만료/CANCELLED:취소)
    voucher_issue_status_cd_before VARCHAR(20),
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (voucher_issue_id),
    UNIQUE (voucher_code)
);

COMMENT ON TABLE pm_voucher_issue IS '상품권 발급 및 사용 이력';
COMMENT ON COLUMN pm_voucher_issue.voucher_issue_id IS '상품권발급ID';
COMMENT ON COLUMN pm_voucher_issue.voucher_id       IS '상품권ID (pm_voucher.voucher_id)';
COMMENT ON COLUMN pm_voucher_issue.site_id          IS '사이트ID';
COMMENT ON COLUMN pm_voucher_issue.member_id        IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN pm_voucher_issue.voucher_code     IS '발급 고유코드';
COMMENT ON COLUMN pm_voucher_issue.issue_date       IS '발급일시';
COMMENT ON COLUMN pm_voucher_issue.expire_date      IS '만료일시';
COMMENT ON COLUMN pm_voucher_issue.use_date         IS '사용일시';
COMMENT ON COLUMN pm_voucher_issue.order_id         IS '사용된 주문ID (od_order.order_id)';
COMMENT ON COLUMN pm_voucher_issue.use_amt          IS '실제 사용 할인금액';
COMMENT ON COLUMN pm_voucher_issue.voucher_issue_status_cd IS '상태 (코드: VOUCHER_ISSUE_STATUS)';
COMMENT ON COLUMN pm_voucher_issue.voucher_issue_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN pm_voucher_issue.reg_by           IS '등록자';
COMMENT ON COLUMN pm_voucher_issue.reg_date         IS '등록일';
COMMENT ON COLUMN pm_voucher_issue.upd_by           IS '수정자';
COMMENT ON COLUMN pm_voucher_issue.upd_date         IS '수정일';

CREATE INDEX idx_pm_voucher_issue_voucher ON pm_voucher_issue (voucher_id);
CREATE INDEX idx_pm_voucher_issue_member  ON pm_voucher_issue (member_id);
CREATE INDEX idx_pm_voucher_issue_order   ON pm_voucher_issue (order_id);
CREATE INDEX idx_pm_voucher_issue_expire  ON pm_voucher_issue (expire_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_voucher_issue.voucher_issue_status_cd (상태) : SAVE_ISSUE_STATUS { SCHEDULED:예정, COMPLETED:완료, CANCELLED:취소, EXPIRED:만료 }

-- ============================================================
-- [DP] 도메인
-- ============================================================

-- ============================================================
-- dp_ui : 디스플레이 UI
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS dp_ui (
    ui_id           VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    ui_cd           VARCHAR(50)     NOT NULL,               -- 예: MOBILE_MAIN, PC_MAIN, EVENT_PAGE
    ui_nm           VARCHAR(100)    NOT NULL,
    ui_desc         VARCHAR(300),
    device_type_cd  VARCHAR(30),                            -- MOBILE/PC/TABLET 등
    ui_path         VARCHAR(200),                           -- 경로 (예: /index, /event/2026-spring)
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',            -- 사용여부 (Y/N)
    use_start_date  DATE,                                   -- 사용시작일
    use_end_date    DATE,                                   -- 사용종료일
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (ui_id),
    UNIQUE (site_id, ui_cd)
);

COMMENT ON TABLE dp_ui IS '디스플레이 UI (최상위 화면 정의)';
COMMENT ON COLUMN dp_ui.ui_id          IS 'UIID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN dp_ui.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN dp_ui.ui_cd          IS 'UI코드 (예: MOBILE_MAIN, PC_MAIN)';
COMMENT ON COLUMN dp_ui.ui_nm          IS 'UI명';
COMMENT ON COLUMN dp_ui.ui_desc        IS 'UI설명';
COMMENT ON COLUMN dp_ui.device_type_cd IS '디바이스유형 (코드: DEVICE_TYPE)';
COMMENT ON COLUMN dp_ui.ui_path        IS '페이지경로';
COMMENT ON COLUMN dp_ui.sort_ord       IS '정렬순서';
COMMENT ON COLUMN dp_ui.use_yn         IS '사용여부 (Y/N)';
COMMENT ON COLUMN dp_ui.use_start_date IS '사용시작일';
COMMENT ON COLUMN dp_ui.use_end_date   IS '사용종료일';
COMMENT ON COLUMN dp_ui.reg_by         IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_ui.reg_date       IS '등록일';
COMMENT ON COLUMN dp_ui.upd_by         IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_ui.upd_date       IS '수정일';

CREATE INDEX idx_dp_ui_site ON dp_ui (site_id);
CREATE INDEX idx_dp_ui_device ON dp_ui (device_type_cd);
CREATE INDEX idx_dp_ui_use ON dp_ui (use_yn, use_start_date, use_end_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] dp_ui.device_type_cd (디바이스유형) : DEVICE_TYPE { PC:PC, MOBILE:모바일, APP:앱, ALL:전체 }

-- ============================================================
-- dp_area : 디스플레이 영역
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS dp_area (
    area_id         VARCHAR(21)     NOT NULL,
    ui_id           VARCHAR(21)     NOT NULL,              -- FK: dp_ui.ui_id
    site_id         VARCHAR(21),                            -- sy_site.site_id
    area_cd         VARCHAR(50)     NOT NULL,               -- 예: MAIN_TOP, MAIN_BANNER, SIDEBAR_MID
    area_nm         VARCHAR(100)    NOT NULL,
    area_type_cd    VARCHAR(30),                            -- FULL/SIDEBAR/POPUP 등
    area_desc       VARCHAR(300),
    disp_path       VARCHAR(200),                            -- 점(.) 구분 표시경로 (예: FRONT.모바일메인)
    use_yn          CHAR(1)         DEFAULT 'Y',            -- 사용여부 (Y/N)
    use_start_date  DATE,                                   -- 사용시작일
    use_end_date    DATE,                                   -- 사용종료일
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (area_id),
    UNIQUE (site_id, area_cd),
    FOREIGN KEY (ui_id) REFERENCES dp_ui(ui_id)
);

COMMENT ON TABLE dp_area IS '디스플레이 영역';
COMMENT ON COLUMN dp_area.area_id      IS '영역ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN dp_area.ui_id        IS 'UIID (dp_ui.ui_id)';
COMMENT ON COLUMN dp_area.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN dp_area.area_cd      IS '영역코드 (예: MAIN_TOP, SIDEBAR_MID)';
COMMENT ON COLUMN dp_area.area_nm      IS '영역명';
COMMENT ON COLUMN dp_area.area_type_cd IS '영역유형 (코드: DISP_AREA_TYPE)';
COMMENT ON COLUMN dp_area.area_desc    IS '영역설명';
COMMENT ON COLUMN dp_area.disp_path    IS '점(.) 구분 표시경로';
COMMENT ON COLUMN dp_area.use_yn       IS '사용여부 (Y/N)';
COMMENT ON COLUMN dp_area.use_start_date IS '사용시작일';
COMMENT ON COLUMN dp_area.use_end_date   IS '사용종료일';
COMMENT ON COLUMN dp_area.reg_by       IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_area.reg_date     IS '등록일';
COMMENT ON COLUMN dp_area.upd_by       IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_area.upd_date     IS '수정일';

CREATE INDEX idx_dp_area_ui ON dp_area (ui_id);
CREATE INDEX idx_dp_area_site ON dp_area (site_id);
CREATE INDEX idx_dp_area_use ON dp_area (use_yn, use_start_date, use_end_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] dp_area.area_type_cd (영역유형) : DISP_AREA_TYPE { FULL:전체폭, SIDEBAR:사이드바, POPUP:팝업, INLINE:인라인 }

-- ============================================================
-- dp_ui_area : 디스플레이 UI-영역 매핑
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS dp_ui_area (
    ui_area_id          VARCHAR(21)     NOT NULL,
    ui_id               VARCHAR(21)     NOT NULL,              -- FK: dp_ui.ui_id
    area_id             VARCHAR(21)     NOT NULL,              -- FK: dp_area.area_id
    area_sort_ord       INTEGER         DEFAULT 0,              -- 영역정렬순서
    visibility_targets  VARCHAR(200),                           -- 공개대상 (^CODE^CODE^ 형식)
    disp_env            VARCHAR(50)     DEFAULT '^PROD^',       -- 전시 환경 (^PROD^DEV^TEST^ 형식)
    disp_yn             CHAR(1)         DEFAULT 'Y',            -- 전시여부 Y/N
    disp_start_date     DATE,                                   -- 전시시작일
    disp_start_time     TIME,                                   -- 전시시작시간
    disp_end_date       DATE,                                   -- 전시종료일
    disp_end_time       TIME,                                   -- 전시종료시간
    use_yn              CHAR(1)         DEFAULT 'Y',            -- 사용여부 Y/N
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (ui_area_id),
    UNIQUE (ui_id, area_id),
    FOREIGN KEY (ui_id) REFERENCES dp_ui(ui_id),
    FOREIGN KEY (area_id) REFERENCES dp_area(area_id)
);

COMMENT ON TABLE dp_ui_area IS '디스플레이 UI-영역 매핑';
COMMENT ON COLUMN dp_ui_area.ui_area_id    IS 'UI영역ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN dp_ui_area.ui_id         IS 'UIID (dp_ui.ui_id)';
COMMENT ON COLUMN dp_ui_area.area_id         IS '영역ID (dp_area.area_id)';
COMMENT ON COLUMN dp_ui_area.area_sort_ord      IS '영역정렬순서';
COMMENT ON COLUMN dp_ui_area.visibility_targets IS '공개대상 (코드: VISIBILITY_TARGET, ^CODE^CODE^ 형식)';
COMMENT ON COLUMN dp_ui_area.disp_env           IS '전시 환경 (^PROD^DEV^TEST^ 형식)';
COMMENT ON COLUMN dp_ui_area.disp_yn            IS '전시여부 (Y/N) - 배치로 자동 관리';
COMMENT ON COLUMN dp_ui_area.disp_start_date    IS '전시시작일';
COMMENT ON COLUMN dp_ui_area.disp_start_time    IS '전시시작시간';
COMMENT ON COLUMN dp_ui_area.disp_end_date      IS '전시종료일';
COMMENT ON COLUMN dp_ui_area.disp_end_time      IS '전시종료시간';
COMMENT ON COLUMN dp_ui_area.use_yn             IS '사용여부 (Y/N)';
COMMENT ON COLUMN dp_ui_area.reg_by        IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_ui_area.reg_date      IS '등록일';
COMMENT ON COLUMN dp_ui_area.upd_by        IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_ui_area.upd_date      IS '수정일';

CREATE INDEX idx_dp_ui_area_ui ON dp_ui_area (ui_id);
CREATE INDEX idx_dp_ui_area_area ON dp_ui_area (area_id);
CREATE INDEX idx_dp_ui_area_visibility ON dp_ui_area (visibility_targets);
CREATE INDEX idx_dp_ui_area_ord ON dp_ui_area (ui_id, area_sort_ord);
CREATE INDEX idx_dp_ui_area_disp_yn ON dp_ui_area (disp_yn);
CREATE INDEX idx_dp_ui_area_disp_date ON dp_ui_area (disp_start_date, disp_end_date);

-- ============================================================
-- dp_area_panel : 디스플레이 영역-패널 매핑
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS dp_area_panel (
    area_panel_id       VARCHAR(21)     NOT NULL,
    area_id             VARCHAR(21)     NOT NULL,              -- FK: dp_area.area_id
    panel_id            VARCHAR(21)     NOT NULL,              -- FK: dp_panel.panel_id
    panel_sort_ord      INTEGER         DEFAULT 0,              -- 패널정렬순서
    visibility_targets  VARCHAR(200),                           -- 공개대상 (^CODE^CODE^ 형식)
    disp_yn             CHAR(1)         DEFAULT 'Y',            -- 전시여부 Y/N
    disp_start_date     DATE,                                   -- 전시시작일
    disp_start_time     TIME,                                   -- 전시시작시간
    disp_end_date       DATE,                                   -- 전시종료일
    disp_end_time       TIME,                                   -- 전시종료시간
    disp_env            VARCHAR(50)     DEFAULT '^PROD^',       -- 전시 환경 (^PROD^DEV^TEST^ 형식)
    use_yn              CHAR(1)         DEFAULT 'Y',            -- 사용여부 Y/N
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (area_panel_id),
    UNIQUE (area_id, panel_id),
    FOREIGN KEY (area_id) REFERENCES dp_area(area_id),
    FOREIGN KEY (panel_id) REFERENCES dp_panel(panel_id)
);

COMMENT ON TABLE dp_area_panel IS '디스플레이 영역-패널 매핑';
COMMENT ON COLUMN dp_area_panel.area_panel_id    IS '영역패널ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN dp_area_panel.area_id          IS '영역ID (dp_area.area_id)';
COMMENT ON COLUMN dp_area_panel.panel_id           IS '패널ID (dp_panel.panel_id)';
COMMENT ON COLUMN dp_area_panel.panel_sort_ord      IS '패널정렬순서';
COMMENT ON COLUMN dp_area_panel.visibility_targets IS '공개대상 (코드: VISIBILITY_TARGET, ^CODE^CODE^ 형식)';
COMMENT ON COLUMN dp_area_panel.disp_yn            IS '전시여부 (Y/N) - 배치로 자동 관리';
COMMENT ON COLUMN dp_area_panel.disp_start_date    IS '전시시작일';
COMMENT ON COLUMN dp_area_panel.disp_start_time    IS '전시시작시간';
COMMENT ON COLUMN dp_area_panel.disp_end_date      IS '전시종료일';
COMMENT ON COLUMN dp_area_panel.disp_end_time      IS '전시종료시간';
COMMENT ON COLUMN dp_area_panel.disp_env           IS '전시 환경 (^PROD^DEV^TEST^ 형식)';
COMMENT ON COLUMN dp_area_panel.use_yn             IS '사용여부 (Y/N)';
COMMENT ON COLUMN dp_area_panel.reg_by           IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_area_panel.reg_date         IS '등록일';
COMMENT ON COLUMN dp_area_panel.upd_by           IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_area_panel.upd_date         IS '수정일';

CREATE INDEX idx_dp_area_panel_area ON dp_area_panel (area_id);
CREATE INDEX idx_dp_area_panel_panel ON dp_area_panel (panel_id);
CREATE INDEX idx_dp_area_panel_visibility ON dp_area_panel (visibility_targets);
CREATE INDEX idx_dp_area_panel_ord ON dp_area_panel (area_id, panel_sort_ord);
CREATE INDEX idx_dp_area_panel_disp_yn ON dp_area_panel (disp_yn);
CREATE INDEX idx_dp_area_panel_disp_date ON dp_area_panel (disp_start_date, disp_end_date);
CREATE INDEX idx_dp_area_panel_disp_env ON dp_area_panel (disp_env);

-- ============================================================
-- dp_panel : 디스플레이 패널
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS dp_panel (
    panel_id                    VARCHAR(21)     NOT NULL,
    site_id                     VARCHAR(21),                            -- sy_site.site_id
    panel_nm                    VARCHAR(100)    NOT NULL,
    panel_type_cd               VARCHAR(30),                            -- 코드: DISP_TYPE
    disp_path                   VARCHAR(200),                           -- 점(.) 구분 표시경로
    visibility_targets          VARCHAR(200),                           -- 공개대상 (^CODE^CODE^ 형식)
    use_yn                      CHAR(1)         DEFAULT 'Y',            -- 사용여부 (Y/N)
    use_start_date              DATE,                                   -- 사용시작일
    use_end_date                DATE,                                   -- 사용종료일
    disp_panel_status_cd        VARCHAR(20)     DEFAULT 'ACTIVE',      -- 코드: DISP_STATUS
    disp_panel_status_cd_before VARCHAR(20),                            -- 변경 전 패널상태
    content_json                TEXT,                                   -- 패널의 콘텐츠 데이터 (JSON)
    reg_by                      VARCHAR(16),
    reg_date                    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                      VARCHAR(16),
    upd_date                    TIMESTAMP,
    PRIMARY KEY (panel_id),
    FOREIGN KEY (area_id) REFERENCES dp_area(area_id)
);

COMMENT ON TABLE dp_panel IS '디스플레이 패널';
COMMENT ON COLUMN dp_panel.panel_id                    IS '패널ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN dp_panel.site_id                     IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN dp_panel.panel_nm                    IS '패널명';
COMMENT ON COLUMN dp_panel.panel_type_cd               IS '표시유형 (코드: DISP_TYPE)';
COMMENT ON COLUMN dp_panel.disp_path                   IS '점(.) 구분 표시경로';
COMMENT ON COLUMN dp_panel.visibility_targets          IS '공개대상 (코드: VISIBILITY_TARGET, ^CODE^CODE^ 형식)';
COMMENT ON COLUMN dp_panel.use_yn                      IS '사용여부 (Y/N)';
COMMENT ON COLUMN dp_panel.use_start_date              IS '사용시작일';
COMMENT ON COLUMN dp_panel.use_end_date                IS '사용종료일';
COMMENT ON COLUMN dp_panel.disp_panel_status_cd        IS '상태 (코드: DISP_STATUS)';
COMMENT ON COLUMN dp_panel.disp_panel_status_cd_before IS '변경 전 패널상태 (코드: DISP_STATUS)';
COMMENT ON COLUMN dp_panel.content_json                IS '패널콘텐츠 (JSON - 위젯 목록 및 설정)';
COMMENT ON COLUMN dp_panel.reg_by                      IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_panel.reg_date                    IS '등록일';
COMMENT ON COLUMN dp_panel.upd_by                      IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_panel.upd_date                    IS '수정일';

CREATE INDEX idx_dp_panel_site ON dp_panel (site_id);
CREATE INDEX idx_dp_panel_status ON dp_panel (disp_panel_status_cd);
CREATE INDEX idx_dp_panel_use ON dp_panel (use_yn, use_start_date, use_end_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] dp_panel.panel_type_cd (표시유형) : 전시유형 { MAIN_BANNER:메인배너, SUB_BANNER:서브배너, POPUP:팝업, SPECIAL:기획전 }
-- [CODES] dp_panel.disp_panel_status_cd (상태) : 전시상태 { SHOW:노출, HIDE:숨김 }

-- ============================================================
-- dp_panel_item : 디스플레이 패널 항목 (위젯 인스턴스)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 참조 방식: dp_widget_lib 참조 OR 직접 콘텐츠 생성
-- ============================================================
CREATE TABLE IF NOT EXISTS dp_panel_item (
    panel_item_id           VARCHAR(21)     NOT NULL,
    panel_id                VARCHAR(21)     NOT NULL,              -- FK: dp_panel.panel_id
    widget_lib_id           VARCHAR(21),                            -- FK: dp_widget_lib.widget_lib_id (선택사항)
    widget_type_cd          VARCHAR(30),                            -- 위젯유형 (코드: WIDGET_TYPE)
    widget_title            VARCHAR(200),                           -- 위젯 타이틀
    widget_content          TEXT,                                   -- 위젯 내용 (HTML 에디터)
    title_show_yn           CHAR(1)         DEFAULT 'Y',            -- 타이틀 표시 여부
    widget_lib_ref_yn       CHAR(1)         DEFAULT 'N',            -- dp_widget_lib 참조 여부
    content_type_cd         VARCHAR(30),                            -- 콘텐츠 유형 (WIDGET/HTML/TEXT/IMAGE 등)
    item_sort_ord           INTEGER         DEFAULT 0,              -- 항목정렬순서
    widget_config_json      TEXT,                                   -- 위젯별 설정 (JSON - 위젯 특정 설정)
    visibility_targets      VARCHAR(200),                           -- 공개대상 (^CODE^CODE^ 형식)
    disp_yn                 CHAR(1)         DEFAULT 'Y',            -- 전시여부 Y/N
    disp_start_date         DATE,                                   -- 전시시작일
    disp_start_time         TIME,                                   -- 전시시작시간
    disp_end_date           DATE,                                   -- 전시종료일
    disp_end_time           TIME,                                   -- 전시종료시간
    disp_env                VARCHAR(50)     DEFAULT '^PROD^',       -- 전시 환경 (^PROD^DEV^TEST^ 형식)
    use_yn                  CHAR(1)         DEFAULT 'Y',            -- 사용여부 Y/N
    reg_by                  VARCHAR(16),
    reg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(16),
    upd_date                TIMESTAMP,
    PRIMARY KEY (panel_item_id),
    FOREIGN KEY (panel_id) REFERENCES dp_panel(panel_id),
    FOREIGN KEY (widget_lib_id) REFERENCES dp_widget_lib(widget_lib_id)
);

COMMENT ON TABLE dp_panel_item IS '디스플레이 패널 항목 (위젯 인스턴스 - 참조 또는 직접 생성)';
COMMENT ON COLUMN dp_panel_item.panel_item_id         IS '패널항목ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN dp_panel_item.panel_id              IS '패널ID (dp_panel.panel_id)';
COMMENT ON COLUMN dp_panel_item.widget_lib_id         IS '위젯라이브러리ID (dp_widget_lib.widget_lib_id, 선택사항)';
COMMENT ON COLUMN dp_panel_item.widget_type_cd        IS '위젯유형 (코드: WIDGET_TYPE)';
COMMENT ON COLUMN dp_panel_item.widget_title          IS '위젯타이틀';
COMMENT ON COLUMN dp_panel_item.widget_content        IS '위젯내용 (HTML 에디터)';
COMMENT ON COLUMN dp_panel_item.title_show_yn         IS '타이틀표시여부 (Y/N)';
COMMENT ON COLUMN dp_panel_item.widget_lib_ref_yn     IS '위젯라이브러리참조여부 (Y/N)';
COMMENT ON COLUMN dp_panel_item.content_type_cd       IS '콘텐츠유형 (WIDGET/HTML/TEXT/IMAGE 등)';
COMMENT ON COLUMN dp_panel_item.item_sort_ord         IS '항목정렬순서';
COMMENT ON COLUMN dp_panel_item.widget_config_json    IS '위젯설정 (JSON - 위젯별 특정 설정 또는 직접 생성 콘텐츠)';
COMMENT ON COLUMN dp_panel_item.visibility_targets    IS '공개대상 (코드: VISIBILITY_TARGET, ^CODE^CODE^ 형식)';
COMMENT ON COLUMN dp_panel_item.disp_yn               IS '전시여부 (Y/N) - 배치로 자동 관리';
COMMENT ON COLUMN dp_panel_item.disp_start_date       IS '전시시작일';
COMMENT ON COLUMN dp_panel_item.disp_start_time       IS '전시시작시간';
COMMENT ON COLUMN dp_panel_item.disp_end_date         IS '전시종료일';
COMMENT ON COLUMN dp_panel_item.disp_end_time         IS '전시종료시간';
COMMENT ON COLUMN dp_panel_item.disp_env             IS '전시 환경 (^PROD^DEV^TEST^ 형식)';
COMMENT ON COLUMN dp_panel_item.use_yn                IS '사용여부 (Y/N)';
COMMENT ON COLUMN dp_panel_item.reg_by                IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_panel_item.reg_date              IS '등록일';
COMMENT ON COLUMN dp_panel_item.upd_by                IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_panel_item.upd_date              IS '수정일';

CREATE INDEX idx_dp_panel_item_panel ON dp_panel_item (panel_id);
CREATE INDEX idx_dp_panel_item_widget_lib ON dp_panel_item (widget_lib_id);
CREATE INDEX idx_dp_panel_item_ord ON dp_panel_item (panel_id, item_sort_ord);
CREATE INDEX idx_dp_panel_item_disp_yn ON dp_panel_item (disp_yn);
CREATE INDEX idx_dp_panel_item_disp_date ON dp_panel_item (disp_start_date, disp_end_date);
CREATE INDEX idx_dp_panel_item_disp_env ON dp_panel_item (disp_env);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] dp_panel_item.widget_type_cd (위젯유형) : WIDGET_TYPE { image_banner:이미지배너, product_slider:상품슬라이더, product:상품, cond_product:조건상품, chart_bar:막대차트, chart_line:선형차트, chart_pie:파이차트, text_banner:텍스트배너, info_card:정보카드, popup:팝업, file:파일, file_list:파일목록, coupon:쿠폰, html_editor:HTML에디터, event_banner:이벤트배너, cache_banner:캐쉬배너, widget_embed:위젯임베드, barcode:바코드, countdown:카운트다운, markdown:마크다운, video_player:비디오, map_widget:지도 }

-- ============================================================
-- ec_disp_widget_lib : 디스플레이 위젯 라이브러리
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS dp_widget_lib (
    widget_lib_id   VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    widget_code     VARCHAR(50)     NOT NULL,
    widget_nm       VARCHAR(100)    NOT NULL,
    widget_type_cd  VARCHAR(30)     NOT NULL,               -- 코드: WIDGET_TYPE (BANNER/PRODUCT/CATEGORY/HTML/SLIDER)
    widget_lib_desc TEXT,
    disp_path       VARCHAR(500),                            -- 점(.) 구분 표시경로(다중: 콤마 구분)
    thumbnail_url   VARCHAR(500),
    template_html   TEXT,                                   -- 위젯 기본 HTML 템플릿
    config_schema   TEXT,                                   -- 설정 스키마 (JSON)
    is_system       CHAR(1)         DEFAULT 'N',            -- 시스템 기본 위젯 Y/N
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (widget_lib_id),
    UNIQUE (widget_code)
);

COMMENT ON TABLE dp_widget_lib IS '디스플레이 위젯 라이브러리';
COMMENT ON COLUMN dp_widget_lib.widget_lib_id  IS '위젯라이브러리ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN dp_widget_lib.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN dp_widget_lib.widget_code    IS '위젯코드';
COMMENT ON COLUMN dp_widget_lib.widget_nm      IS '위젯명';
COMMENT ON COLUMN dp_widget_lib.widget_type_cd IS '위젯유형 (코드: WIDGET_TYPE — BANNER/PRODUCT/CATEGORY/HTML/SLIDER)';
COMMENT ON COLUMN dp_widget_lib.widget_lib_desc IS '위젯라이브러리설명';
COMMENT ON COLUMN dp_widget_lib.thumbnail_url  IS '미리보기 썸네일URL';
COMMENT ON COLUMN dp_widget_lib.template_html  IS '위젯 HTML 템플릿';
COMMENT ON COLUMN dp_widget_lib.config_schema  IS '설정 스키마 (JSON)';
COMMENT ON COLUMN dp_widget_lib.is_system      IS '시스템기본위젯 Y/N';
COMMENT ON COLUMN dp_widget_lib.sort_ord       IS '정렬순서';
COMMENT ON COLUMN dp_widget_lib.use_yn         IS '사용여부 Y/N';
COMMENT ON COLUMN dp_widget_lib.reg_by         IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_widget_lib.reg_date       IS '등록일';
COMMENT ON COLUMN dp_widget_lib.upd_by         IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_widget_lib.upd_date       IS '수정일';
COMMENT ON COLUMN dp_widget_lib.disp_path IS '점(.) 구분 표시경로';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] dp_widget_lib.widget_type_cd (위젯유형) : WIDGET_TYPE { image_banner:이미지배너, product_slider:상품슬라이더, product:상품, cond_product:조건상품, chart_bar:막대차트, chart_line:선형차트, chart_pie:파이차트, text_banner:텍스트배너, info_card:정보카드, popup:팝업, file:파일, file_list:파일목록, coupon:쿠폰, html_editor:HTML에디터, event_banner:이벤트배너, cache_banner:캐쉬배너, widget_embed:위젯임베드, barcode:바코드, countdown:카운트다운, markdown:마크다운, video_player:비디오, map_widget:지도 }

-- ============================================================
-- dp_widget : 디스플레이 위젯 정의 (라이브러리 참조 또는 직접 생성)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS dp_widget (
    widget_id            VARCHAR(21)     NOT NULL,
    widget_lib_id        VARCHAR(21),                            -- FK: dp_widget_lib.widget_lib_id (선택사항)
    site_id              VARCHAR(21),                            -- sy_site.site_id
    widget_nm            VARCHAR(100)    NOT NULL,
    widget_type_cd       VARCHAR(30)     NOT NULL,              -- 코드: WIDGET_TYPE (image_banner/product_slider 등)
    widget_desc          VARCHAR(300),
    widget_title         VARCHAR(200),                           -- 위젯 타이틀
    widget_content       TEXT,                                   -- 위젯 내용 (HTML 에디터)
    title_show_yn        CHAR(1)         DEFAULT 'Y',            -- 타이틀 표시 여부
    widget_lib_ref_yn    CHAR(1)         DEFAULT 'N',            -- dp_widget_lib 참조 여부
    widget_config_json   TEXT,                                  -- 위젯의 추가 설정 (JSON)
    preview_img_url      VARCHAR(500),                          -- 미리보기 이미지
    sort_ord             INTEGER         DEFAULT 0,
    use_yn               CHAR(1)         DEFAULT 'Y',
    disp_env             VARCHAR(50)     DEFAULT '^PROD^',       -- 전시 환경 (^PROD^DEV^TEST^ 형식)
    reg_by               VARCHAR(16),
    reg_date             TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by               VARCHAR(16),
    upd_date             TIMESTAMP,
    PRIMARY KEY (widget_id),
    UNIQUE (site_id, widget_nm),
    FOREIGN KEY (widget_lib_id) REFERENCES dp_widget_lib(widget_lib_id)
);

COMMENT ON TABLE dp_widget IS '디스플레이 위젯 (라이브러리 참조 또는 직접 생성)';
COMMENT ON COLUMN dp_widget.widget_id            IS '위젯ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN dp_widget.widget_lib_id        IS '위젯라이브러리ID (dp_widget_lib.widget_lib_id, 참조 선택사항)';
COMMENT ON COLUMN dp_widget.site_id              IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN dp_widget.widget_nm            IS '위젯명';
COMMENT ON COLUMN dp_widget.widget_type_cd       IS '위젯유형 (코드: WIDGET_TYPE)';
COMMENT ON COLUMN dp_widget.widget_desc          IS '위젯설명';
COMMENT ON COLUMN dp_widget.widget_title         IS '위젯타이틀';
COMMENT ON COLUMN dp_widget.widget_content       IS '위젯내용 (HTML 에디터)';
COMMENT ON COLUMN dp_widget.title_show_yn        IS '타이틀표시여부 (Y/N)';
COMMENT ON COLUMN dp_widget.widget_lib_ref_yn    IS '위젯라이브러리참조여부 (Y/N)';
COMMENT ON COLUMN dp_widget.widget_config_json   IS '위젯추가설정 (JSON)';
COMMENT ON COLUMN dp_widget.preview_img_url      IS '미리보기이미지URL';
COMMENT ON COLUMN dp_widget.sort_ord             IS '정렬순서';
COMMENT ON COLUMN dp_widget.use_yn               IS '사용여부 (Y/N)';
COMMENT ON COLUMN dp_widget.disp_env             IS '전시 환경 (^PROD^DEV^TEST^ 형식)';
COMMENT ON COLUMN dp_widget.reg_by               IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_widget.reg_date             IS '등록일';
COMMENT ON COLUMN dp_widget.upd_by               IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_widget.upd_date             IS '수정일';

CREATE INDEX idx_dp_widget_lib ON dp_widget (widget_lib_id);
CREATE INDEX idx_dp_widget_site ON dp_widget (site_id);
CREATE INDEX idx_dp_widget_type ON dp_widget (widget_type_cd);
CREATE INDEX idx_dp_widget_disp_env ON dp_widget (disp_env);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] dp_widget.widget_type_cd (위젯유형) : WIDGET_TYPE { image_banner:이미지배너, product_slider:상품슬라이더, product:상품, cond_product:조건상품, chart_bar:막대차트, chart_line:선형차트, chart_pie:파이차트, text_banner:텍스트배너, info_card:정보카드, popup:팝업, file:파일, file_list:파일목록, coupon:쿠폰, html_editor:HTML에디터, event_banner:이벤트배너, cache_banner:캐쉬배너, widget_embed:위젯임베드, barcode:바코드, countdown:카운트다운, markdown:마크다운, video_player:비디오, map_widget:지도 }

-- ============================================================
-- [CM] 도메인
-- ============================================================

-- ============================================================
-- ec_path : 경로 (업무별 트리)
-- ----------------------------------------------------
--  업무코드(biz_code = 테이블명) 별로 독립된 경로 트리를 관리.
--  각 노드는 parent_path_id 로 부모를 참조 (재귀 트리).
--
--  사용 예시:
--    biz_code='sy_brand'    → 브랜드 분류 트리
--    biz_code='sy_code_grp' → 공통코드그룹 분류 트리
--    biz_code='ec_prop'     → 프로퍼티 분류 트리
--    biz_code='ec_disp_*'   → 전시영역/패널 분류 트리
-- ============================================================
CREATE TABLE IF NOT EXISTS cm_path (
    path_id         BIGSERIAL       NOT NULL,
    biz_cd        VARCHAR(50)     NOT NULL,               -- 업무코드 (테이블명)
    parent_path_id  BIGINT,                                 -- 부모 경로ID (sy_path., 루트는 NULL)
    path_label      VARCHAR(200)    NOT NULL,               -- 경로 라벨 (한글 표시명)
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    path_remark     VARCHAR(500),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (path_id)
);

COMMENT ON TABLE cm_path IS '경로 (업무별 트리)';
COMMENT ON COLUMN cm_path.path_id        IS '경로ID (PK, auto)';
COMMENT ON COLUMN cm_path.biz_cd       IS '업무코드 (참조 테이블명, 예: sy_brand / sy_code_grp / ec_prop)';
COMMENT ON COLUMN cm_path.parent_path_id IS '부모 경로ID (sy_path., 루트는 NULL)';
COMMENT ON COLUMN cm_path.path_label     IS '경로 라벨 (한글 표시명)';
COMMENT ON COLUMN cm_path.sort_ord       IS '동일 부모 내 정렬순서';
COMMENT ON COLUMN cm_path.use_yn         IS '사용여부 Y/N';
COMMENT ON COLUMN cm_path.path_remark    IS '비고';
COMMENT ON COLUMN cm_path.reg_by         IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_path.reg_date       IS '등록일';
COMMENT ON COLUMN cm_path.upd_by         IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_path.upd_date       IS '수정일';

CREATE INDEX idx_sy_path_biz ON cm_path (biz_cd);
CREATE INDEX idx_sy_path_parent ON cm_path (parent_path_id);

-- ============================================================
-- ec_blog_cate : 블로그 카테고리
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================

CREATE TABLE IF NOT EXISTS cm_bltn_cate (
    blog_cate_id    VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    blog_cate_nm    VARCHAR(100)    NOT NULL,              -- 카테고리명
    parent_blog_cate_id VARCHAR(21),                        -- 상위 카테고리ID (계층형)
    sort_ord        INTEGER         DEFAULT 0,              -- 정렬순서
    use_yn          CHAR(1)         DEFAULT 'Y',            -- 사용여부 Y/N
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (blog_cate_id)
);

COMMENT ON TABLE cm_bltn_cate IS '블로그 카테고리';
COMMENT ON COLUMN cm_bltn_cate.blog_cate_id IS '블로그카테고리ID';
COMMENT ON COLUMN cm_bltn_cate.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN cm_bltn_cate.blog_cate_nm IS '카테고리명';
COMMENT ON COLUMN cm_bltn_cate.parent_blog_cate_id IS '상위 카테고리ID (NULL이면 최상위)';
COMMENT ON COLUMN cm_bltn_cate.sort_ord     IS '정렬순서';
COMMENT ON COLUMN cm_bltn_cate.use_yn       IS '사용여부 Y/N';
COMMENT ON COLUMN cm_bltn_cate.reg_by       IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_bltn_cate.reg_date     IS '등록일';
COMMENT ON COLUMN cm_bltn_cate.upd_by       IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_bltn_cate.upd_date     IS '수정일';

-- ============================================================
-- ec_blog : 블로그 게시글
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================

CREATE TABLE IF NOT EXISTS cm_bltn (
    blog_id         VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    blog_cate_id    VARCHAR(21),                            -- FK: cm_bltn_cate.blog_cate_idblog_cate_id
    blog_title      VARCHAR(200)    NOT NULL,              -- 제목
    blog_summary    VARCHAR(500),                           -- 요약 (미리보기용)
    blog_content    TEXT            NOT NULL,              -- 본문 (HTML)
    blog_author     VARCHAR(100),                           -- 작성자 이름
    prod_id         VARCHAR(21),                            -- FK: pd_prod.prod_idprod_id (선택사항, 상품 관련 글)
    view_count      INTEGER         DEFAULT 0,              -- 조회수
    use_yn          CHAR(1)         DEFAULT 'Y',            -- 공개여부 Y/N
    is_notice       CHAR(1)         DEFAULT 'N',            -- 공지글 여부 Y/N (상단 고정)
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (blog_id)
);

COMMENT ON TABLE cm_bltn IS '블로그 게시글';
COMMENT ON COLUMN cm_bltn.blog_id      IS '블로그ID';
COMMENT ON COLUMN cm_bltn.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN cm_bltn.blog_cate_id IS '블로그카테고리ID (cm_bltn_cate.blog_cate_id)';
COMMENT ON COLUMN cm_bltn.blog_title   IS '제목';
COMMENT ON COLUMN cm_bltn.blog_summary IS '요약 (미리보기, 검색결과용)';
COMMENT ON COLUMN cm_bltn.blog_content IS '본문 (HTML 에디터)';
COMMENT ON COLUMN cm_bltn.blog_author  IS '작성자 이름';
COMMENT ON COLUMN cm_bltn.prod_id      IS '상품ID (pd_prod.prod_id, 상품 관련 글일 때만)';
COMMENT ON COLUMN cm_bltn.view_count   IS '조회수';
COMMENT ON COLUMN cm_bltn.use_yn       IS '공개여부 Y/N (비공개 글)';
COMMENT ON COLUMN cm_bltn.is_notice    IS '공지글 여부 Y/N (상단 고정)';
COMMENT ON COLUMN cm_bltn.reg_by       IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_bltn.reg_date     IS '등록일';
COMMENT ON COLUMN cm_bltn.upd_by       IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_bltn.upd_date     IS '수정일';

CREATE INDEX idx_cm_bltn_cate ON cm_bltn (blog_cate_id);
CREATE INDEX idx_cm_bltn_prod ON cm_bltn (prod_id);
CREATE INDEX idx_cm_bltn_date ON cm_bltn (reg_date DESC);

CREATE TABLE IF NOT EXISTS cm_bltn_reply (
    comment_id      VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),
    blog_id         VARCHAR(21)     NOT NULL,              -- cm_bltn.
    parent_comment_id VARCHAR(21),                          -- 대댓글 (cm_bltn_reply.blog_comment_id)
    writer_id       VARCHAR(21),                            -- 작성자ID (mb_member.member_id)
    writer_nm       VARCHAR(50),                            -- 작성자명 (스냅샷)
    blog_comment_content TEXT            NOT NULL,
    comment_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: COMMENT_STATUS (ACTIVE/HIDDEN/DELETED)
    comment_status_cd_before VARCHAR(20),                    -- 변경 전 댓글상태
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (comment_id)
);

COMMENT ON TABLE cm_bltn_reply IS '블로그 댓글';
COMMENT ON COLUMN cm_bltn_reply.comment_id   IS '댓글ID';
COMMENT ON COLUMN cm_bltn_reply.site_id      IS '사이트ID';
COMMENT ON COLUMN cm_bltn_reply.blog_id      IS '블로그ID';
COMMENT ON COLUMN cm_bltn_reply.parent_comment_id IS '대댓글 부모ID';
COMMENT ON COLUMN cm_bltn_reply.writer_id    IS '작성자ID';
COMMENT ON COLUMN cm_bltn_reply.writer_nm    IS '작성자명';
COMMENT ON COLUMN cm_bltn_reply.blog_comment_content IS '댓글 내용';
COMMENT ON COLUMN cm_bltn_reply.comment_status_cd IS '상태 (코드: COMMENT_STATUS)';
COMMENT ON COLUMN cm_bltn_reply.comment_status_cd_before IS '변경 전 댓글상태 (코드: COMMENT_STATUS)';
COMMENT ON COLUMN cm_bltn_reply.reg_by       IS '등록자';
COMMENT ON COLUMN cm_bltn_reply.reg_date     IS '등록일';
COMMENT ON COLUMN cm_bltn_reply.upd_by       IS '수정자';
COMMENT ON COLUMN cm_bltn_reply.upd_date     IS '수정일';

CREATE INDEX idx_cm_bltn_reply_blog   ON cm_bltn_reply (blog_id);
CREATE INDEX idx_cm_bltn_reply_parent ON cm_bltn_reply (parent_comment_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] cm_bltn_reply.comment_status_cd (상태) : BBS_STATUS { ACTIVE:활성, HIDDEN:숨김, DELETED:삭제 }

-- ============================================================
-- ec_blog_img : 블로그 이미지
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================

CREATE TABLE IF NOT EXISTS cm_bltn_file (
    blog_img_id     VARCHAR(21)     NOT NULL,
    blog_id         VARCHAR(21)     NOT NULL,              -- FK: cm_bltn.blog_id
    img_url         VARCHAR(500)    NOT NULL,              -- 원본 이미지 URL
    thumb_url       VARCHAR(500),                           -- 썸네일 이미지 URL
    img_alt_text    VARCHAR(200),                           -- 대체텍스트
    sort_ord        INTEGER         DEFAULT 0,              -- 정렬순서
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (blog_img_id)
);

COMMENT ON TABLE cm_bltn_file IS '블로그 이미지';
COMMENT ON COLUMN cm_bltn_file.blog_img_id IS '블로그이미지ID';
COMMENT ON COLUMN cm_bltn_file.blog_id     IS '블로그ID (cm_bltn.)';
COMMENT ON COLUMN cm_bltn_file.img_url     IS '원본 이미지 URL';
COMMENT ON COLUMN cm_bltn_file.thumb_url   IS '썸네일 이미지 URL';
COMMENT ON COLUMN cm_bltn_file.img_alt_text IS '이미지 대체텍스트';
COMMENT ON COLUMN cm_bltn_file.sort_ord    IS '정렬순서';
COMMENT ON COLUMN cm_bltn_file.reg_by      IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_bltn_file.reg_date    IS '등록일';

CREATE INDEX idx_cm_bltn_file_blog ON cm_bltn_file (blog_id);

-- 블로그 태그
CREATE TABLE IF NOT EXISTS cm_bltn_tag (
    blog_tag_id     VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),
    blog_id         VARCHAR(21)     NOT NULL,              -- cm_bltn.
    tag_nm          VARCHAR(50)     NOT NULL,
    sort_ord        INTEGER         DEFAULT 0,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (blog_tag_id)
);

COMMENT ON TABLE cm_bltn_tag IS '블로그 태그';
COMMENT ON COLUMN cm_bltn_tag.blog_tag_id IS '태그ID';
COMMENT ON COLUMN cm_bltn_tag.site_id    IS '사이트ID';
COMMENT ON COLUMN cm_bltn_tag.blog_id    IS '블로그ID';
COMMENT ON COLUMN cm_bltn_tag.tag_nm     IS '태그명';
COMMENT ON COLUMN cm_bltn_tag.sort_ord   IS '정렬순서';
COMMENT ON COLUMN cm_bltn_tag.reg_by     IS '등록자';
COMMENT ON COLUMN cm_bltn_tag.reg_date   IS '등록일';
COMMENT ON COLUMN cm_bltn_tag.upd_by     IS '수정자';
COMMENT ON COLUMN cm_bltn_tag.upd_date   IS '수정일';

CREATE INDEX idx_cm_bltn_tag_blog ON cm_bltn_tag (blog_id);

-- 블로그 댓글

-- ============================================================
-- ec_blog_like : 블로그 좋아요
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================

CREATE TABLE IF NOT EXISTS cm_bltn_good (
    like_id         VARCHAR(21)     NOT NULL,
    blog_id         VARCHAR(21)     NOT NULL,              -- FK: cm_bltn.blog_id
    user_id         VARCHAR(21)     NOT NULL,              -- FK: sy_member.user_id (회원만 가능)
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (like_id),
    UNIQUE (blog_id, user_id)                              -- 중복 방지
);

COMMENT ON TABLE cm_bltn_good IS '블로그 좋아요';
COMMENT ON COLUMN cm_bltn_good.like_id IS '좋아요ID';
COMMENT ON COLUMN cm_bltn_good.blog_id IS '블로그ID (cm_bltn.)';
COMMENT ON COLUMN cm_bltn_good.user_id IS '사용자ID (sy_member.user_id)';
COMMENT ON COLUMN cm_bltn_good.reg_date IS '등록일';

CREATE INDEX idx_cm_bltn_good_blog ON cm_bltn_good (blog_id);
CREATE INDEX idx_cm_bltn_good_user ON cm_bltn_good (user_id);

-- ============================================================
-- ec_chatt : 채팅방 (고객 1:1 상담)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS cm_chatt_room (
    chatt_room_id        VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    member_id       VARCHAR(21)     NOT NULL,
    member_nm       VARCHAR(50),
    admin_user_id   VARCHAR(21),                            -- 담당 관리자 (sy_user.user_id)
    subject         VARCHAR(200),                           -- 채팅 주제
    chatt_status_cd VARCHAR(20)     DEFAULT 'PENDING',      -- 코드: CHATT_STATUS (PENDING/ONGOING/CLOSED)
    chatt_status_cd_before VARCHAR(20),                     -- 변경 전 채팅상태
    last_msg_date   TIMESTAMP,                              -- 마지막 메시지 일시
    member_unread_cnt  INTEGER       DEFAULT 0,              -- 고객 미읽 개수
    admin_unread_cnt   INTEGER       DEFAULT 0,              -- 관리자 미읽 개수
    chatt_memo      TEXT,
    close_date      TIMESTAMP,
    close_reason    VARCHAR(200),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (chatt_room_id)
);

COMMENT ON TABLE cm_chatt_room IS '고객 1:1 채팅 상담';
COMMENT ON COLUMN cm_chatt_room.chatt_room_id IS '채팅방ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN cm_chatt_room.site_id              IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN cm_chatt_room.member_id            IS '회원ID (고객)';
COMMENT ON COLUMN cm_chatt_room.member_nm            IS '회원명';
COMMENT ON COLUMN cm_chatt_room.admin_user_id        IS '담당관리자 (sy_user.user_id)';
COMMENT ON COLUMN cm_chatt_room.subject              IS '채팅주제';
COMMENT ON COLUMN cm_chatt_room.chatt_status_cd      IS '상태 (코드: CHATT_STATUS)';
COMMENT ON COLUMN cm_chatt_room.chatt_status_cd_before IS '변경 전 채팅상태 (코드: CHATT_STATUS)';
COMMENT ON COLUMN cm_chatt_room.last_msg_date        IS '마지막 메시지 일시';
COMMENT ON COLUMN cm_chatt_room.member_unread_cnt    IS '고객 미읽메시지 수';
COMMENT ON COLUMN cm_chatt_room.admin_unread_cnt     IS '관리자 미읽메시지 수';
COMMENT ON COLUMN cm_chatt_room.chatt_memo           IS '메모';
COMMENT ON COLUMN cm_chatt_room.close_date           IS '종료일시';
COMMENT ON COLUMN cm_chatt_room.close_reason         IS '종료사유';
COMMENT ON COLUMN cm_chatt_room.reg_by               IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_chatt_room.reg_date             IS '등록일';
COMMENT ON COLUMN cm_chatt_room.upd_by               IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_chatt_room.upd_date             IS '수정일';

CREATE INDEX idx_od_chatt_member ON cm_chatt_room (member_id);
CREATE INDEX idx_od_chatt_admin ON cm_chatt_room (admin_user_id);
CREATE INDEX idx_od_chatt_status ON cm_chatt_room (chatt_status_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] cm_chatt_room.chatt_status_cd (상태) : 채팅상태 { WAITING:대기, ACTIVE:진행중, DONE:완료 }

-- 채팅 메시지
CREATE TABLE IF NOT EXISTS cm_chatt_msg (
    msg_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    chatt_id        VARCHAR(21)     NOT NULL,
    sender_cd       VARCHAR(20)     NOT NULL,               -- MEMBER / ADMIN
    msg_text        TEXT,
    ref_type        VARCHAR(20),                            -- ORDER / PRODUCT / CLAIM
    ref_id          VARCHAR(21),
    send_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    read_yn         CHAR(1)         DEFAULT 'N',
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (msg_id)
);

COMMENT ON TABLE cm_chatt_msg IS '채팅 메시지';
COMMENT ON COLUMN cm_chatt_msg.msg_id    IS '메시지ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN cm_chatt_msg.site_id   IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN cm_chatt_msg.chatt_id  IS '채팅방ID';
COMMENT ON COLUMN cm_chatt_msg.sender_cd  IS '발신자유형 (MEMBER/ADMIN)';
COMMENT ON COLUMN cm_chatt_msg.msg_text  IS '메시지내용';
COMMENT ON COLUMN cm_chatt_msg.ref_type  IS '참조유형 (ORDER/PRODUCT/CLAIM)';
COMMENT ON COLUMN cm_chatt_msg.ref_id    IS '참조ID';
COMMENT ON COLUMN cm_chatt_msg.send_date IS '발송일시';
COMMENT ON COLUMN cm_chatt_msg.read_yn   IS '읽음여부 Y/N';
COMMENT ON COLUMN cm_chatt_msg.reg_by    IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_chatt_msg.reg_date  IS '등록일';
COMMENT ON COLUMN cm_chatt_msg.upd_by    IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_chatt_msg.upd_date  IS '수정일';

-- ============================================================
-- ec_push_log : 푸시/알림 발송 로그
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 용도: 이메일, SMS, 카카오 알림톡, 앱 푸시 통합 관리
-- ============================================================
CREATE TABLE IF NOT EXISTS cmh_push_log (
    log_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),
    channel_cd      VARCHAR(20)     NOT NULL,              -- 코드: PUSH_CHANNEL (EMAIL/SMS/KAKAO/APP)
    template_id     VARCHAR(21),                           -- sy_template.template_id
    member_id       VARCHAR(21),                           -- 대상 회원 (시스템 발송 시 NULL)
    recv_addr       VARCHAR(200)    NOT NULL,              -- 수신처 (이메일, 전화번호, 토큰 등)
    push_log_title  VARCHAR(200),                          -- 발송 제목
    push_log_content TEXT,                                  -- 발송 내용
    result_cd       VARCHAR(20)     DEFAULT 'SUCCESS',     -- 코드: PUSH_RESULT (SUCCESS/FAIL/PENDING)
    fail_reason     VARCHAR(500),                          -- 실패 사유
    send_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    ref_type_cd     VARCHAR(30),                           -- 연관유형코드 (ORDER/CLAIM/EVENT 등)
    ref_id          VARCHAR(21),                           -- 연관ID (order_id 등)
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (log_id)
);

COMMENT ON TABLE cmh_push_log IS '푸시/알림 발송 로그';
COMMENT ON COLUMN cmh_push_log.log_id       IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN cmh_push_log.site_id      IS '사이트ID';
COMMENT ON COLUMN cmh_push_log.channel_cd   IS '발송채널 (코드: PUSH_CHANNEL)';
COMMENT ON COLUMN cmh_push_log.template_id  IS '템플릿ID (sy_template.template_id)';
COMMENT ON COLUMN cmh_push_log.member_id    IS '대상 회원ID';
COMMENT ON COLUMN cmh_push_log.recv_addr    IS '수신처 (이메일/전화번호/디바이스토큰)';
COMMENT ON COLUMN cmh_push_log.push_log_title IS '발송 제목';
COMMENT ON COLUMN cmh_push_log.push_log_content IS '발송 내용';
COMMENT ON COLUMN cmh_push_log.result_cd    IS '발송결과 (코드: PUSH_RESULT)';
COMMENT ON COLUMN cmh_push_log.fail_reason  IS '실패 사유';
COMMENT ON COLUMN cmh_push_log.send_date    IS '발송일시';
COMMENT ON COLUMN cmh_push_log.ref_type_cd  IS '연관유형코드 (ORDER/CLAIM/EVENT 등)';
COMMENT ON COLUMN cmh_push_log.ref_id       IS '연관ID';
COMMENT ON COLUMN cmh_push_log.reg_by       IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cmh_push_log.reg_date     IS '등록일';
COMMENT ON COLUMN cmh_push_log.upd_by       IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cmh_push_log.upd_date     IS '수정일';

CREATE INDEX idx_sy_push_log_member ON cmh_push_log (member_id);
CREATE INDEX idx_sy_push_log_date ON cmh_push_log (send_date);
CREATE INDEX idx_sy_push_log_channel ON cmh_push_log (channel_cd, result_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] cmh_push_log.channel_cd (발송채널) : ALARM_CHANNEL { EMAIL:이메일, SMS:SMS, PUSH:푸시알림, KAKAO:카카오 }
-- [CODES] cmh_push_log.result_cd (발송결과) : SEND_RESULT { SUCCESS:성공, FAILED:실패, PENDING:대기 }

-- ============================================================
-- [ST] 도메인
-- ============================================================

-- ============================================================
-- st_settle_config : 정산기준 설정
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 우선순위: vendor_id+category_id > vendor_id > site_id(전체기준)
-- ============================================================
CREATE TABLE IF NOT EXISTS st_settle_config (
    settle_config_id    VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21)     NOT NULL,               -- sy_site.site_id
    vendor_id           VARCHAR(21),                            -- sy_vendor.vendor_id (NULL이면 전체)
    category_id         VARCHAR(21),                            -- pd_category.category_id (NULL이면 전체)
    settle_cycle_cd     VARCHAR(20)     DEFAULT 'MONTHLY',      -- 코드: SETTLE_CYCLE (DAILY/WEEKLY/MONTHLY)
    settle_day          INTEGER         DEFAULT 10,             -- 정산일 (월 N일)
    commission_rate     NUMERIC(5,2)    DEFAULT 0,              -- 수수료율 (%)
    min_settle_amt      BIGINT          DEFAULT 0,              -- 최소 정산금액
    settle_config_remark VARCHAR(500),                          -- 비고
    use_yn              CHAR(1)         DEFAULT 'Y',
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (settle_config_id),
    UNIQUE (site_id, vendor_id, category_id)
);

COMMENT ON TABLE st_settle_config IS '정산기준 설정';
COMMENT ON COLUMN st_settle_config.settle_config_id  IS '정산기준ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN st_settle_config.site_id           IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN st_settle_config.vendor_id         IS '업체ID (NULL=전체 기준)';
COMMENT ON COLUMN st_settle_config.category_id       IS '카테고리ID (NULL=전체 기준)';
COMMENT ON COLUMN st_settle_config.settle_cycle_cd   IS '정산주기 (코드: SETTLE_CYCLE — DAILY/WEEKLY/MONTHLY)';
COMMENT ON COLUMN st_settle_config.settle_day        IS '정산일 (월 N일, MONTHLY 시 사용)';
COMMENT ON COLUMN st_settle_config.commission_rate   IS '수수료율 (%)';
COMMENT ON COLUMN st_settle_config.min_settle_amt    IS '최소 정산금액';
COMMENT ON COLUMN st_settle_config.settle_config_remark IS '비고';
COMMENT ON COLUMN st_settle_config.use_yn            IS '사용여부 Y/N';
COMMENT ON COLUMN st_settle_config.reg_by            IS '등록자';
COMMENT ON COLUMN st_settle_config.reg_date          IS '등록일';
COMMENT ON COLUMN st_settle_config.upd_by            IS '수정자';
COMMENT ON COLUMN st_settle_config.upd_date          IS '수정일';

CREATE INDEX idx_st_settle_config_vendor   ON st_settle_config (site_id, vendor_id);
CREATE INDEX idx_st_settle_config_category ON st_settle_config (site_id, category_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] st_settle_config.settle_cycle_cd (정산주기) : SETTLE_CYCLE { WEEKLY:주간, BIWEEKLY:격주, MONTHLY:월간 }

-- ============================================================
-- st_settle_close : 정산마감 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS st_settle_close (
    settle_close_id     VARCHAR(21)     NOT NULL,
    settle_id           VARCHAR(21)     NOT NULL,               -- st_settle.settle_id
    site_id             VARCHAR(21),
    close_status_cd     VARCHAR(20)     NOT NULL,               -- 코드: SETTLE_CLOSE_STATUS (CLOSED:마감/REOPENED:재오픈)
    close_reason        VARCHAR(200),                           -- 마감/재오픈 사유
    final_settle_amt    BIGINT          DEFAULT 0,              -- 마감 시점 최종정산금액 스냅샷
    close_by            VARCHAR(21)     NOT NULL,               -- 처리자 (sy_user.user_id)
    close_date          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (settle_close_id)
);

COMMENT ON TABLE st_settle_close IS '정산마감 이력';
COMMENT ON COLUMN st_settle_close.settle_close_id  IS '마감이력ID';
COMMENT ON COLUMN st_settle_close.settle_id        IS '정산ID (st_settle.settle_id)';
COMMENT ON COLUMN st_settle_close.site_id          IS '사이트ID';
COMMENT ON COLUMN st_settle_close.close_status_cd  IS '마감상태 (코드: SETTLE_CLOSE_STATUS — CLOSED/REOPENED)';
COMMENT ON COLUMN st_settle_close.close_reason     IS '마감/재오픈 사유';
COMMENT ON COLUMN st_settle_close.final_settle_amt IS '마감 시점 최종정산금액 스냅샷';
COMMENT ON COLUMN st_settle_close.close_by         IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN st_settle_close.close_date       IS '처리일시';
COMMENT ON COLUMN st_settle_close.reg_by           IS '등록자';
COMMENT ON COLUMN st_settle_close.reg_date         IS '등록일';

CREATE INDEX idx_st_settle_close_settle ON st_settle_close (settle_id);
CREATE INDEX idx_st_settle_close_date   ON st_settle_close (close_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] st_settle_close.close_status_cd (마감상태) : SETTLE_CLOSE_STATUS { DRAFT:초안, CONFIRMED:확정, PAID:지급완료 }

-- ============================================================
-- st_settle : 정산 마스터 (업체별 정산 집계)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS st_settle (
    settle_id           VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21)     NOT NULL,
    vendor_id           VARCHAR(21)     NOT NULL,               -- sy_vendor.vendor_id
    settle_ym           CHAR(6)         NOT NULL,               -- 정산년월 (YYYYMM)
    settle_start_date   TIMESTAMP       NOT NULL,               -- 정산 기준시작일
    settle_end_date     TIMESTAMP       NOT NULL,               -- 정산 기준종료일
    total_order_amt     BIGINT          DEFAULT 0,              -- 총 주문금액 (당월 신규 주문 귀속)
    total_return_amt    BIGINT          DEFAULT 0,              -- 총 환불금액 (당월 귀속 환불 — 타월 주문 환불 포함)
    total_claim_cnt     INTEGER         DEFAULT 0,              -- 환불 건수 (raw_type_cd=CLAIM 집계)
    total_discnt_amt    BIGINT          DEFAULT 0,              -- 총 할인금액
    commission_rate     NUMERIC(5,2)    DEFAULT 0,              -- 적용 수수료율
    commission_amt      BIGINT          DEFAULT 0,              -- 수수료금액
    settle_amt          BIGINT          DEFAULT 0,              -- 기본 정산금액 (total_order_amt - total_return_amt - total_discnt_amt - commission_amt)
    adj_amt             BIGINT          DEFAULT 0,              -- 정산조정 합계금액
    etc_adj_amt         BIGINT          DEFAULT 0,              -- 기타조정 합계금액
    final_settle_amt    BIGINT          DEFAULT 0,              -- 최종정산금액 (settle_amt + adj_amt + etc_adj_amt)
    settle_status_cd    VARCHAR(20)     DEFAULT 'DRAFT',        -- 코드: SETTLE_STATUS (DRAFT:작성중/CONFIRMED:확정/CLOSED:마감/PAID:지급완료)
    settle_status_cd_before VARCHAR(20),
    settle_memo         TEXT,                                   -- 정산 메모
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (settle_id),
    UNIQUE (site_id, vendor_id, settle_ym)
);

COMMENT ON TABLE st_settle IS '정산 마스터 (업체별 월정산)';
COMMENT ON COLUMN st_settle.settle_id           IS '정산ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN st_settle.site_id             IS '사이트ID';
COMMENT ON COLUMN st_settle.vendor_id           IS '업체ID (sy_vendor.vendor_id)';
COMMENT ON COLUMN st_settle.settle_ym           IS '정산년월 (YYYYMM)';
COMMENT ON COLUMN st_settle.settle_start_date   IS '정산 기준 시작일';
COMMENT ON COLUMN st_settle.settle_end_date     IS '정산 기준 종료일';
COMMENT ON COLUMN st_settle.total_order_amt     IS '총 주문금액 (당월 신규 주문 귀속)';
COMMENT ON COLUMN st_settle.total_return_amt    IS '총 환불금액 (환불 확정월 귀속 — 타월 주문 환불 포함)';
COMMENT ON COLUMN st_settle.total_claim_cnt     IS '환불 건수 (st_settle_raw.raw_type_cd=CLAIM 집계)';
COMMENT ON COLUMN st_settle.total_discnt_amt    IS '총 할인금액';
COMMENT ON COLUMN st_settle.commission_rate     IS '적용 수수료율 (%)';
COMMENT ON COLUMN st_settle.commission_amt      IS '수수료금액';
COMMENT ON COLUMN st_settle.settle_amt          IS '기본 정산금액';
COMMENT ON COLUMN st_settle.adj_amt             IS '정산조정 합계';
COMMENT ON COLUMN st_settle.etc_adj_amt         IS '기타조정 합계';
COMMENT ON COLUMN st_settle.final_settle_amt    IS '최종 정산금액';
COMMENT ON COLUMN st_settle.settle_status_cd    IS '상태 (코드: SETTLE_STATUS — DRAFT/CONFIRMED/CLOSED/PAID)';
COMMENT ON COLUMN st_settle.settle_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN st_settle.settle_memo         IS '정산 메모';
COMMENT ON COLUMN st_settle.reg_by              IS '등록자';
COMMENT ON COLUMN st_settle.reg_date            IS '등록일';
COMMENT ON COLUMN st_settle.upd_by              IS '수정자';
COMMENT ON COLUMN st_settle.upd_date            IS '수정일';

CREATE INDEX idx_st_settle_vendor ON st_settle (site_id, vendor_id);
CREATE INDEX idx_st_settle_ym     ON st_settle (settle_ym);
CREATE INDEX idx_st_settle_status ON st_settle (settle_status_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] st_settle.settle_status_cd (상태) : SETTLE_STATUS { OPEN:진행중, CLOSED:마감, CANCELLED:취소 }

-- ============================================================
-- st_settle_item : 정산 항목 (주문항목별 명세)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS st_settle_item (
    settle_item_id      VARCHAR(21)     NOT NULL,
    settle_id           VARCHAR(21)     NOT NULL,               -- st_settle.settle_id
    site_id             VARCHAR(21),
    order_id            VARCHAR(21)     NOT NULL,               -- od_order.order_id
    order_item_id       VARCHAR(21)     NOT NULL,               -- od_order_item.order_item_id
    vendor_id           VARCHAR(21)     NOT NULL,
    prod_id             VARCHAR(21),
    settle_item_type_cd VARCHAR(20)     DEFAULT 'SALE',         -- 코드: SETTLE_ITEM_TYPE (SALE:판매/CANCEL:취소/RETURN:반품)
    order_date          TIMESTAMP,
    order_qty           INTEGER         DEFAULT 1,
    unit_price          BIGINT          DEFAULT 0,
    item_price          BIGINT          DEFAULT 0,              -- unit_price × order_qty
    discnt_amt          BIGINT          DEFAULT 0,
    commission_rate     NUMERIC(5,2)    DEFAULT 0,
    commission_amt      BIGINT          DEFAULT 0,
    settle_item_amt     BIGINT          DEFAULT 0,              -- item_price - discnt_amt - commission_amt
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (settle_item_id),
    UNIQUE (settle_id, order_item_id)
);

COMMENT ON TABLE st_settle_item IS '정산 항목 (주문항목별 명세)';
COMMENT ON COLUMN st_settle_item.settle_item_id     IS '정산항목ID';
COMMENT ON COLUMN st_settle_item.settle_id          IS '정산ID (st_settle.settle_id)';
COMMENT ON COLUMN st_settle_item.site_id            IS '사이트ID';
COMMENT ON COLUMN st_settle_item.order_id           IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN st_settle_item.order_item_id      IS '주문항목ID (od_order_item.order_item_id)';
COMMENT ON COLUMN st_settle_item.vendor_id          IS '업체ID';
COMMENT ON COLUMN st_settle_item.prod_id            IS '상품ID';
COMMENT ON COLUMN st_settle_item.settle_item_type_cd IS '항목유형 (코드: SETTLE_ITEM_TYPE — SALE/CANCEL/RETURN)';
COMMENT ON COLUMN st_settle_item.order_date         IS '주문일시';
COMMENT ON COLUMN st_settle_item.order_qty          IS '주문수량';
COMMENT ON COLUMN st_settle_item.unit_price         IS '단가';
COMMENT ON COLUMN st_settle_item.item_price         IS '소계 (unit_price × order_qty)';
COMMENT ON COLUMN st_settle_item.discnt_amt         IS '할인금액';
COMMENT ON COLUMN st_settle_item.commission_rate    IS '수수료율 (%)';
COMMENT ON COLUMN st_settle_item.commission_amt     IS '수수료금액';
COMMENT ON COLUMN st_settle_item.settle_item_amt    IS '항목 정산금액';
COMMENT ON COLUMN st_settle_item.reg_by             IS '등록자';
COMMENT ON COLUMN st_settle_item.reg_date           IS '등록일';

CREATE INDEX idx_st_settle_item_settle ON st_settle_item (settle_id);
CREATE INDEX idx_st_settle_item_order  ON st_settle_item (order_id);
CREATE INDEX idx_st_settle_item_vendor ON st_settle_item (vendor_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] st_settle_item.settle_item_type_cd (항목유형) : SETTLE_ITEM_TYPE { SALE:매출, CANCEL:취소, DISCNT:할인, GIFT:사은품, SHIP:배송비, ADJ:조정 }

-- ============================================================
-- st_settle_pay : 정산지급
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS st_settle_pay (
    settle_pay_id       VARCHAR(21)     NOT NULL,
    settle_id           VARCHAR(21)     NOT NULL,               -- st_settle.settle_id
    site_id             VARCHAR(21),
    vendor_id           VARCHAR(21)     NOT NULL,               -- sy_vendor.vendor_id
    pay_amt             BIGINT          NOT NULL,               -- 지급금액
    pay_method_cd       VARCHAR(20)     DEFAULT 'BANK_TRANSFER', -- 코드: PAY_METHOD_CD
    bank_nm             VARCHAR(50),                            -- 은행명
    bank_account        VARCHAR(50),                            -- 계좌번호
    bank_holder         VARCHAR(50),                            -- 예금주
    pay_status_cd       VARCHAR(20)     DEFAULT 'PENDING',      -- 코드: SETTLE_PAY_STATUS (PENDING:지급대기/COMPLT:지급완료/FAILED:지급실패)
    pay_status_cd_before VARCHAR(20),
    pay_date            TIMESTAMP,                              -- 실지급 일시
    pay_by              VARCHAR(21),                            -- 지급처리자 (sy_user.user_id)
    settle_pay_memo     TEXT,
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (settle_pay_id)
);

COMMENT ON TABLE st_settle_pay IS '정산지급';
COMMENT ON COLUMN st_settle_pay.settle_pay_id    IS '정산지급ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN st_settle_pay.settle_id        IS '정산ID (st_settle.settle_id)';
COMMENT ON COLUMN st_settle_pay.site_id          IS '사이트ID';
COMMENT ON COLUMN st_settle_pay.vendor_id        IS '업체ID (sy_vendor.vendor_id)';
COMMENT ON COLUMN st_settle_pay.pay_amt          IS '지급금액';
COMMENT ON COLUMN st_settle_pay.pay_method_cd    IS '지급수단 (코드: PAY_METHOD_CD)';
COMMENT ON COLUMN st_settle_pay.bank_nm          IS '은행명';
COMMENT ON COLUMN st_settle_pay.bank_account     IS '계좌번호';
COMMENT ON COLUMN st_settle_pay.bank_holder      IS '예금주';
COMMENT ON COLUMN st_settle_pay.pay_status_cd    IS '지급상태 (코드: SETTLE_PAY_STATUS — PENDING/COMPLT/FAILED)';
COMMENT ON COLUMN st_settle_pay.pay_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN st_settle_pay.pay_date         IS '실지급 일시';
COMMENT ON COLUMN st_settle_pay.pay_by           IS '지급처리자 (sy_user.user_id)';
COMMENT ON COLUMN st_settle_pay.settle_pay_memo  IS '메모';
COMMENT ON COLUMN st_settle_pay.reg_by           IS '등록자';
COMMENT ON COLUMN st_settle_pay.reg_date         IS '등록일';
COMMENT ON COLUMN st_settle_pay.upd_by           IS '수정자';
COMMENT ON COLUMN st_settle_pay.upd_date         IS '수정일';

CREATE INDEX idx_st_settle_pay_settle ON st_settle_pay (settle_id);
CREATE INDEX idx_st_settle_pay_vendor ON st_settle_pay (vendor_id);
CREATE INDEX idx_st_settle_pay_status ON st_settle_pay (pay_status_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] st_settle_pay.pay_method_cd (지급수단) : PAY_METHOD { BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스페이먼츠, KAKAO:카카오페이, NAVER:네이버페이, MOBILE:핸드폰결제, SAVE:적립금결제, ZERO:0원결제 }
-- [CODES] st_settle_pay.pay_status_cd (지급상태) : SETTLE_PAY_STATUS { PENDING:대기, REQUESTED:지급요청, COMPLT:지급완료, FAILED:실패, DISPUTED:이의신청 }

-- ============================================================
-- st_settle_adj : 정산조정 (수동 가감 조정)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS st_settle_adj (
    settle_adj_id       VARCHAR(21)     NOT NULL,
    settle_id           VARCHAR(21)     NOT NULL,               -- st_settle.settle_id
    site_id             VARCHAR(21),
    adj_type_cd         VARCHAR(20)     NOT NULL,               -- 코드: SETTLE_ADJ_TYPE (ADD:가산/DEDUCT:차감)
    adj_amt             BIGINT          NOT NULL,               -- 조정금액 (양수)
    adj_reason          VARCHAR(200)    NOT NULL,               -- 조정 사유
    settle_adj_memo     TEXT,
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (settle_adj_id)
);

COMMENT ON TABLE st_settle_adj IS '정산조정';
COMMENT ON COLUMN st_settle_adj.settle_adj_id  IS '정산조정ID';
COMMENT ON COLUMN st_settle_adj.settle_id      IS '정산ID (st_settle.settle_id)';
COMMENT ON COLUMN st_settle_adj.site_id        IS '사이트ID';
COMMENT ON COLUMN st_settle_adj.adj_type_cd    IS '조정유형 (코드: SETTLE_ADJ_TYPE — ADD/DEDUCT)';
COMMENT ON COLUMN st_settle_adj.adj_amt        IS '조정금액 (양수, 유형에 따라 가산/차감)';
COMMENT ON COLUMN st_settle_adj.adj_reason     IS '조정 사유';
COMMENT ON COLUMN st_settle_adj.settle_adj_memo IS '메모';
COMMENT ON COLUMN st_settle_adj.reg_by         IS '등록자';
COMMENT ON COLUMN st_settle_adj.reg_date       IS '등록일';
COMMENT ON COLUMN st_settle_adj.upd_by         IS '수정자';
COMMENT ON COLUMN st_settle_adj.upd_date       IS '수정일';

CREATE INDEX idx_st_settle_adj_settle ON st_settle_adj (settle_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] st_settle_adj.adj_type_cd (조정유형) : SETTLE_ADJ_TYPE { PENALTY:패널티, BONUS:보너스, ERROR_FIX:오류수정, OTHER:기타 }

-- ============================================================
-- st_settle_etc_adj : 정산 기타조정 (배송비/반품비/위약금 등)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE IF NOT EXISTS st_settle_etc_adj (
    settle_etc_adj_id   VARCHAR(21)     NOT NULL,
    settle_id           VARCHAR(21)     NOT NULL,               -- st_settle.settle_id
    site_id             VARCHAR(21),
    etc_adj_type_cd     VARCHAR(20)     NOT NULL,               -- 코드: SETTLE_ETC_ADJ_TYPE (SHIP:배송비/RETURN_SHIP:반품배송비/PENALTY:위약금/OTHER:기타)
    etc_adj_dir_cd      VARCHAR(10)     NOT NULL,               -- 코드: ADJ_DIR (ADD:가산/DEDUCT:차감)
    etc_adj_amt         BIGINT          NOT NULL,               -- 기타조정 금액
    etc_adj_reason      VARCHAR(200)    NOT NULL,               -- 사유
    settle_etc_adj_memo TEXT,
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (settle_etc_adj_id)
);

COMMENT ON TABLE st_settle_etc_adj IS '정산 기타조정';
COMMENT ON COLUMN st_settle_etc_adj.settle_etc_adj_id IS '기타조정ID';
COMMENT ON COLUMN st_settle_etc_adj.settle_id         IS '정산ID (st_settle.settle_id)';
COMMENT ON COLUMN st_settle_etc_adj.site_id           IS '사이트ID';
COMMENT ON COLUMN st_settle_etc_adj.etc_adj_type_cd   IS '기타조정유형 (코드: SETTLE_ETC_ADJ_TYPE — SHIP/RETURN_SHIP/PENALTY/OTHER)';
COMMENT ON COLUMN st_settle_etc_adj.etc_adj_dir_cd    IS '가산/차감 (코드: ADJ_DIR — ADD/DEDUCT)';
COMMENT ON COLUMN st_settle_etc_adj.etc_adj_amt       IS '기타조정 금액';
COMMENT ON COLUMN st_settle_etc_adj.etc_adj_reason    IS '사유';
COMMENT ON COLUMN st_settle_etc_adj.settle_etc_adj_memo IS '메모';
COMMENT ON COLUMN st_settle_etc_adj.reg_by            IS '등록자';
COMMENT ON COLUMN st_settle_etc_adj.reg_date          IS '등록일';
COMMENT ON COLUMN st_settle_etc_adj.upd_by            IS '수정자';
COMMENT ON COLUMN st_settle_etc_adj.upd_date          IS '수정일';

CREATE INDEX idx_st_settle_etc_adj_settle ON st_settle_etc_adj (settle_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] st_settle_etc_adj.etc_adj_type_cd (기타조정유형) : SETTLE_ADJ_TYPE { PENALTY:패널티, BONUS:보너스, ERROR_FIX:오류수정, OTHER:기타 }
-- [CODES] st_settle_etc_adj.etc_adj_dir_cd (가산/차감) : ADJ_DIR { ADD:가산, SUB:차감 }

-- ============================================================
-- st_settle_raw : 정산 수집원장
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 기본 수집 단위: od_order_item / od_claim_item
-- 프로모션·쿠폰·할인·상품권·캐쉬·사은품·마일리지 등
-- 정산에 영향을 미치는 모든 요소를 1행에 펼쳐 저장
-- 통계·분석 쿼리의 기반 테이블 — od_order_item join 없이 독립 조회 가능해야 함
-- ============================================================
CREATE TABLE IF NOT EXISTS st_settle_raw (
    settle_raw_id           VARCHAR(21)     NOT NULL,
    site_id                 VARCHAR(21)     NOT NULL,               -- sy_site.site_id

    -- ── 수집 구분
    raw_type_cd             VARCHAR(20)     NOT NULL,               -- 코드: RAW_TYPE (ORDER:주문/CLAIM:클레임)
    raw_status_cd           VARCHAR(20)     DEFAULT 'PENDING',      -- 코드: RAW_STATUS (PENDING/COLLECTED/SETTLED/EXCLUDED)
    raw_status_cd_before    VARCHAR(20),                            -- 변경 전 상태

    -- ── 주문 원천
    order_id                VARCHAR(21)     NOT NULL,               -- od_order.order_id
    order_no                VARCHAR(30),                            -- 주문번호 (스냅샷)
    order_item_id           VARCHAR(21)     NOT NULL,               -- od_order_item.order_item_id
    order_date              TIMESTAMP,                              -- 주문일시 (스냅샷)
    order_item_status_cd    VARCHAR(20),                            -- 수집 시점 주문상태 (스냅샷, 코드: ORDER_ITEM_STATUS)

    -- ── 주문자
    member_id               VARCHAR(21),                            -- 주문 회원ID 스냅샷 (mb_member.member_id)

    -- ── 클레임 원천 (클레임 수집 시)
    claim_id                VARCHAR(21),                            -- od_claim.claim_id
    claim_item_id           VARCHAR(21),                            -- od_claim_item.claim_item_id

    -- ── 업체
    vendor_id               VARCHAR(21),                            -- sy_vendor.vendor_id
    vendor_type_cd          VARCHAR(20),                            -- 코드: VENDOR_TYPE (SALE:판매/DLIV:배송/EXTERNAL:외부)

    -- ── 상품 · 옵션 · 브랜드 · 카테고리
    prod_id                 VARCHAR(21),                            -- pd_prod.prod_id
    prod_nm                 VARCHAR(200),                           -- 상품명 (스냅샷)
    brand_id                VARCHAR(21),                            -- 브랜드ID 스냅샷 (sy_brand.brand_id)
    brand_nm                VARCHAR(100),                           -- 브랜드명 (스냅샷)
    category_id_1           VARCHAR(21),                            -- 카테고리 1단계ID 스냅샷 (대분류, pd_category.category_id)
    category_id_2           VARCHAR(21),                            -- 카테고리 2단계ID 스냅샷 (중분류, pd_category.category_id)
    category_id_3           VARCHAR(21),                            -- 카테고리 3단계ID 스냅샷 (소분류, pd_category.category_id)
    category_id_4           VARCHAR(21),                            -- 카테고리 4단계ID 스냅샷 (pd_category.category_id)
    category_id_5           VARCHAR(21),                            -- 카테고리 5단계ID 스냅샷 (pd_category.category_id)
    sku_id                  VARCHAR(21),                            -- pd_prod_sku.sku_id (스냅샷)
    opt_item_id_1           VARCHAR(21),                            -- pd_prod_opt_item.opt_item_id (옵션1, 스냅샷)
    opt_item_id_2           VARCHAR(21),                            -- pd_prod_opt_item.opt_item_id (옵션2, 스냅샷)
    md_user_id              VARCHAR(21),                            -- 담당 MD (sy_user.user_id)

    -- ── 수량 · 가격
    normal_price            BIGINT          DEFAULT 0,              -- 정상가 (할인 전 1ea, 스냅샷)
    unit_price              BIGINT          DEFAULT 0,              -- 단가 (옵션추가금 포함)
    order_qty               INTEGER         DEFAULT 0,              -- 주문수량
    item_price              BIGINT          DEFAULT 0,              -- 소계 (unit_price × order_qty)

    -- ── 할인 금액
    discnt_amt              BIGINT          DEFAULT 0,              -- 직접할인금액
    coupon_discnt_amt       BIGINT          DEFAULT 0,              -- 쿠폰할인금액
    promo_discnt_amt        BIGINT          DEFAULT 0,              -- 프로모션할인금액

    -- ── 프로모션 · 쿠폰 · 할인 참조
    promo_id                VARCHAR(21),                            -- pm_event.event_id (프로모션)
    coupon_id               VARCHAR(21),                            -- pm_coupon.coupon_id
    coupon_issue_id         VARCHAR(21),                            -- pm_coupon_issue.coupon_issue_id
    discnt_id               VARCHAR(21),                            -- pm_discnt.discnt_id

    -- ── 상품권
    voucher_id              VARCHAR(21),                            -- pm_voucher.voucher_id
    voucher_issue_id        VARCHAR(21),                            -- pm_voucher_issue.voucher_issue_id
    voucher_use_amt         BIGINT          DEFAULT 0,              -- 상품권 사용금액

    -- ── 캐쉬 · 마일리지 · 적립
    cache_use_amt           BIGINT          DEFAULT 0,              -- 캐쉬(적립금) 사용금액
    mileage_use_amt         BIGINT          DEFAULT 0,              -- 마일리지 사용금액
    save_schd_amt           BIGINT          DEFAULT 0,              -- 적립 예정금액 (구매확정 전=예상, 확정 후=실적립)

    -- ── 사은품
    gift_id                 VARCHAR(21),                            -- pm_gift.gift_id
    gift_amt                BIGINT          DEFAULT 0,              -- 사은품 원가금액 (정산 차감)

    -- ── 결제
    pay_method_cd           VARCHAR(20),                            -- 코드: PAY_METHOD_CD

    -- ── 구매확정
    buy_confirm_yn          CHAR(1)         DEFAULT 'N',            -- 구매확정여부 Y/N
    buy_confirm_date        TIMESTAMP,                              -- 구매확정일시

    -- ── 묶음상품
    bundle_price_rate       DECIMAL(5,2),                           -- 묶음 안분율 (%) — 부분 정산 계산 기준

    -- ── 정산 집계 금액
    settle_target_amt       BIGINT          DEFAULT 0,              -- 정산대상금액 (item_price - 모든할인)
    settle_fee_rate         NUMERIC(5,2)    DEFAULT 0,              -- 수수료율 (%)
    settle_fee_amt          BIGINT          DEFAULT 0,              -- 수수료금액
    settle_amt              BIGINT          DEFAULT 0,              -- 정산금액 (settle_target_amt - settle_fee_amt)

    -- ── 정산 집계 연결
    settle_period           VARCHAR(7),                             -- 정산기간 (YYYY-MM)
    settle_id               VARCHAR(21),                            -- st_settle.settle_id (집계 후 연결)

    -- ── 마감
    close_yn                CHAR(1)         DEFAULT 'N',            -- 정산마감 완료 여부 Y/N
    close_date              TIMESTAMP,                              -- 마감일시
    settle_close_id         VARCHAR(21),                            -- st_settle_close.settle_close_id

    -- ── ERP 전표
    erp_voucher_id          VARCHAR(21),                            -- st_erp_voucher.erp_voucher_id
    erp_voucher_line_no     INTEGER,                                -- 전표 라인번호 (st_erp_voucher_line.line_no)
    erp_send_yn             CHAR(1)         DEFAULT 'N',            -- ERP 전송 여부 Y/N
    erp_send_date           TIMESTAMP,                              -- ERP 전송일시

    reg_by                  VARCHAR(16),
    reg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(16),
    upd_date                TIMESTAMP,

    PRIMARY KEY (settle_raw_id)
);

COMMENT ON TABLE  st_settle_raw IS '정산 수집원장 (od_order_item / od_claim_item 기반 정산 원천 데이터, 통계·분석 기반 테이블)';
COMMENT ON COLUMN st_settle_raw.settle_raw_id        IS '수집원장ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN st_settle_raw.site_id              IS '사이트ID';
COMMENT ON COLUMN st_settle_raw.raw_type_cd          IS '수집유형 (코드: RAW_TYPE — ORDER/CLAIM)';
COMMENT ON COLUMN st_settle_raw.raw_status_cd        IS '수집상태 (코드: RAW_STATUS)';
COMMENT ON COLUMN st_settle_raw.raw_status_cd_before IS '변경 전 수집상태';
COMMENT ON COLUMN st_settle_raw.order_id             IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN st_settle_raw.order_no             IS '주문번호 스냅샷';
COMMENT ON COLUMN st_settle_raw.order_item_id        IS '주문상품ID (od_order_item.order_item_id)';
COMMENT ON COLUMN st_settle_raw.order_date           IS '주문일시 스냅샷';
COMMENT ON COLUMN st_settle_raw.order_item_status_cd IS '수집 시점 주문상태 스냅샷 (코드: ORDER_ITEM_STATUS)';
COMMENT ON COLUMN st_settle_raw.member_id            IS '주문 회원ID 스냅샷 (mb_member.member_id)';
COMMENT ON COLUMN st_settle_raw.claim_id             IS '클레임ID (클레임 수집 시)';
COMMENT ON COLUMN st_settle_raw.claim_item_id        IS '클레임상품ID (클레임 수집 시)';
COMMENT ON COLUMN st_settle_raw.vendor_id            IS '업체ID';
COMMENT ON COLUMN st_settle_raw.vendor_type_cd       IS '업체구분 (코드: VENDOR_TYPE — SALE/DLIV/EXTERNAL)';
COMMENT ON COLUMN st_settle_raw.prod_id              IS '상품ID';
COMMENT ON COLUMN st_settle_raw.prod_nm              IS '상품명 스냅샷';
COMMENT ON COLUMN st_settle_raw.brand_id             IS '브랜드ID 스냅샷 (sy_brand.brand_id)';
COMMENT ON COLUMN st_settle_raw.brand_nm             IS '브랜드명 스냅샷';
COMMENT ON COLUMN st_settle_raw.category_id_1        IS '카테고리 1단계(대분류) ID 스냅샷 (pd_category.category_id)';
COMMENT ON COLUMN st_settle_raw.category_id_2        IS '카테고리 2단계(중분류) ID 스냅샷 (pd_category.category_id)';
COMMENT ON COLUMN st_settle_raw.category_id_3        IS '카테고리 3단계(소분류) ID 스냅샷 (pd_category.category_id)';
COMMENT ON COLUMN st_settle_raw.category_id_4        IS '카테고리 4단계 ID 스냅샷 (pd_category.category_id)';
COMMENT ON COLUMN st_settle_raw.category_id_5        IS '카테고리 5단계 ID 스냅샷 (pd_category.category_id)';
COMMENT ON COLUMN st_settle_raw.sku_id               IS 'SKU ID 스냅샷 (pd_prod_sku.sku_id)';
COMMENT ON COLUMN st_settle_raw.opt_item_id_1        IS '옵션1 값ID 스냅샷 (pd_prod_opt_item.opt_item_id)';
COMMENT ON COLUMN st_settle_raw.opt_item_id_2        IS '옵션2 값ID 스냅샷 (pd_prod_opt_item.opt_item_id)';
COMMENT ON COLUMN st_settle_raw.md_user_id           IS '담당MD (sy_user.user_id)';
COMMENT ON COLUMN st_settle_raw.normal_price         IS '정상가 스냅샷 (할인 전 1ea 가격)';
COMMENT ON COLUMN st_settle_raw.unit_price           IS '단가 (옵션 추가금액 포함)';
COMMENT ON COLUMN st_settle_raw.order_qty            IS '주문수량';
COMMENT ON COLUMN st_settle_raw.item_price           IS '소계 (unit_price × order_qty)';
COMMENT ON COLUMN st_settle_raw.discnt_amt           IS '직접할인금액';
COMMENT ON COLUMN st_settle_raw.coupon_discnt_amt    IS '쿠폰할인금액';
COMMENT ON COLUMN st_settle_raw.promo_discnt_amt     IS '프로모션할인금액';
COMMENT ON COLUMN st_settle_raw.promo_id             IS '프로모션ID (pm_event.event_id)';
COMMENT ON COLUMN st_settle_raw.coupon_id            IS '쿠폰ID (pm_coupon.coupon_id)';
COMMENT ON COLUMN st_settle_raw.coupon_issue_id      IS '쿠폰발급ID (pm_coupon_issue.coupon_issue_id)';
COMMENT ON COLUMN st_settle_raw.discnt_id            IS '할인ID (pm_discnt.discnt_id)';
COMMENT ON COLUMN st_settle_raw.voucher_id           IS '상품권ID (pm_voucher.voucher_id)';
COMMENT ON COLUMN st_settle_raw.voucher_issue_id     IS '상품권발급ID (pm_voucher_issue.voucher_issue_id)';
COMMENT ON COLUMN st_settle_raw.voucher_use_amt      IS '상품권 사용금액';
COMMENT ON COLUMN st_settle_raw.cache_use_amt        IS '캐쉬(적립금) 사용금액';
COMMENT ON COLUMN st_settle_raw.mileage_use_amt      IS '마일리지 사용금액';
COMMENT ON COLUMN st_settle_raw.save_schd_amt        IS '적립 예정금액 (구매확정 전=예상, 확정 후=실적립)';
COMMENT ON COLUMN st_settle_raw.gift_id              IS '사은품ID (pm_gift.gift_id)';
COMMENT ON COLUMN st_settle_raw.gift_amt             IS '사은품 원가금액 (정산 차감 대상)';
COMMENT ON COLUMN st_settle_raw.pay_method_cd        IS '결제수단 (코드: PAY_METHOD_CD)';
COMMENT ON COLUMN st_settle_raw.buy_confirm_yn       IS '구매확정여부 Y/N';
COMMENT ON COLUMN st_settle_raw.buy_confirm_date     IS '구매확정일시';
COMMENT ON COLUMN st_settle_raw.bundle_price_rate    IS '묶음 안분율 (%) — 부분 정산 계산 기준';
COMMENT ON COLUMN st_settle_raw.settle_target_amt    IS '정산대상금액 (item_price - 모든 할인)';
COMMENT ON COLUMN st_settle_raw.settle_fee_rate      IS '수수료율 (%)';
COMMENT ON COLUMN st_settle_raw.settle_fee_amt       IS '수수료금액';
COMMENT ON COLUMN st_settle_raw.settle_amt           IS '정산금액 (settle_target_amt - settle_fee_amt)';
COMMENT ON COLUMN st_settle_raw.settle_period        IS '정산기간 (YYYY-MM)';
COMMENT ON COLUMN st_settle_raw.settle_id            IS '정산집계ID (st_settle.settle_id, 집계 후 연결)';
COMMENT ON COLUMN st_settle_raw.close_yn             IS '정산마감 완료 여부 Y/N';
COMMENT ON COLUMN st_settle_raw.close_date           IS '마감일시';
COMMENT ON COLUMN st_settle_raw.settle_close_id      IS '정산마감ID (st_settle_close.settle_close_id)';
COMMENT ON COLUMN st_settle_raw.erp_voucher_id       IS 'ERP 전표ID (st_erp_voucher.erp_voucher_id)';
COMMENT ON COLUMN st_settle_raw.erp_voucher_line_no  IS 'ERP 전표 라인번호 (st_erp_voucher_line.line_no)';
COMMENT ON COLUMN st_settle_raw.erp_send_yn          IS 'ERP 전송 여부 Y/N';
COMMENT ON COLUMN st_settle_raw.erp_send_date        IS 'ERP 전송일시';
COMMENT ON COLUMN st_settle_raw.reg_by               IS '등록자';
COMMENT ON COLUMN st_settle_raw.reg_date             IS '등록일';
COMMENT ON COLUMN st_settle_raw.upd_by               IS '수정자';
COMMENT ON COLUMN st_settle_raw.upd_date             IS '수정일';

CREATE INDEX idx_st_settle_raw_order        ON st_settle_raw (order_id);
CREATE INDEX idx_st_settle_raw_item         ON st_settle_raw (order_item_id);
CREATE INDEX idx_st_settle_raw_claim        ON st_settle_raw (claim_id);
CREATE INDEX idx_st_settle_raw_member       ON st_settle_raw (member_id);
CREATE INDEX idx_st_settle_raw_vendor       ON st_settle_raw (site_id, vendor_id);
CREATE INDEX idx_st_settle_raw_prod         ON st_settle_raw (prod_id);
CREATE INDEX idx_st_settle_raw_sku          ON st_settle_raw (sku_id);
CREATE INDEX idx_st_settle_raw_brand        ON st_settle_raw (brand_id);
CREATE INDEX idx_st_settle_raw_brand_nm     ON st_settle_raw (brand_nm);
CREATE INDEX idx_st_settle_raw_cate1        ON st_settle_raw (category_id_1);
CREATE INDEX idx_st_settle_raw_cate2        ON st_settle_raw (category_id_2);
CREATE INDEX idx_st_settle_raw_cate3        ON st_settle_raw (category_id_3);
CREATE INDEX idx_st_settle_raw_md           ON st_settle_raw (md_user_id);
CREATE INDEX idx_st_settle_raw_period       ON st_settle_raw (settle_period, vendor_id);
CREATE INDEX idx_st_settle_raw_settle       ON st_settle_raw (settle_id);
CREATE INDEX idx_st_settle_raw_status       ON st_settle_raw (raw_status_cd);
CREATE INDEX idx_st_settle_raw_promo        ON st_settle_raw (promo_id);
CREATE INDEX idx_st_settle_raw_coupon       ON st_settle_raw (coupon_id);
CREATE INDEX idx_st_settle_raw_pay          ON st_settle_raw (pay_method_cd);
CREATE INDEX idx_st_settle_raw_confirm      ON st_settle_raw (buy_confirm_yn, buy_confirm_date);
CREATE INDEX idx_st_settle_raw_order_date   ON st_settle_raw (order_date);
CREATE INDEX idx_st_settle_raw_close        ON st_settle_raw (close_yn, settle_period);
CREATE INDEX idx_st_settle_raw_close_id     ON st_settle_raw (settle_close_id);
CREATE INDEX idx_st_settle_raw_erp          ON st_settle_raw (erp_voucher_id) WHERE erp_voucher_id IS NOT NULL;
CREATE INDEX idx_st_settle_raw_erp_send     ON st_settle_raw (erp_send_yn);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] st_settle_raw.raw_type_cd (수집유형) : RAW_TYPE { ORDER:주문, CLAIM:클레임, ADJ:조정 }
-- [CODES] st_settle_raw.raw_status_cd (수집상태) : RAW_STATUS { COLLECTED:수집완료, EXCLUDED:제외, SETTLED:정산완료 }
-- [CODES] st_settle_raw.vendor_type_cd (업체구분) : VENDOR_TYPE { BRAND:브랜드, AGENT:대리점, DIRECT:직매입, CONSIGN:위탁 }
-- [CODES] st_settle_raw.order_item_status_cd (주문상태) : ORDER_ITEM_STATUS { ORDERED:주문완료, PAID:결제완료, PREPARING:준비중, SHIPPING:배송중, DELIVERED:배송완료, CONFIRMED:구매확정, CANCELLED:취소 }
-- [CODES] st_settle_raw.pay_method_cd (결제수단) : PAY_METHOD { BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스페이먼츠, KAKAO:카카오페이, NAVER:네이버페이, MOBILE:핸드폰결제, SAVE:적립금결제, ZERO:0원결제 }

-- ============================================================
-- st_recon : 정산 대사 (Reconciliation)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 주문·결제·클레임·업체 별 기대금액 vs 실제금액 차이 관리
-- ============================================================
CREATE TABLE IF NOT EXISTS st_recon (
    recon_id                VARCHAR(21)     NOT NULL,
    site_id                 VARCHAR(21)     NOT NULL,               -- sy_site.site_id
    vendor_id               VARCHAR(21),                            -- sy_vendor.vendor_id

    -- ── 대사 구분
    recon_type_cd           VARCHAR(20)     NOT NULL,               -- 코드: RECON_TYPE (ORDER:주문/PAY:결제/CLAIM:클레임/VENDOR:업체)
    recon_status_cd         VARCHAR(20)     DEFAULT 'MISMATCH',     -- 코드: RECON_STATUS (MATCHED:일치/MISMATCH:불일치/RESOLVED:해소)
    recon_status_cd_before  VARCHAR(20),                            -- 변경 전 대사상태

    -- ── 참조
    settle_id               VARCHAR(21),                            -- st_settle.settle_id
    settle_raw_id           VARCHAR(21),                            -- st_settle_raw.settle_raw_id
    ref_id                  VARCHAR(21),                            -- 대사 참조ID (order_id / pay_id / claim_id 등)
    ref_no                  VARCHAR(50),                            -- 대사 참조번호 (스냅샷)
    settle_period           VARCHAR(7),                             -- 정산기간 (YYYY-MM)

    -- ── 금액 대사
    expected_amt            BIGINT          DEFAULT 0,              -- 기대금액 (정산 계산값)
    actual_amt              BIGINT          DEFAULT 0,              -- 실제금액 (외부/결제 확인값)
    diff_amt                BIGINT          DEFAULT 0,              -- 차이금액 (expected - actual)

    -- ── 해소
    recon_note              TEXT,                                   -- 대사 메모
    resolved_by             VARCHAR(21),                            -- 해소 처리자 (sy_user.user_id)
    resolved_date           TIMESTAMP,                              -- 해소 일시

    reg_by                  VARCHAR(16),
    reg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(16),
    upd_date                TIMESTAMP,

    PRIMARY KEY (recon_id)
);

COMMENT ON TABLE  st_recon IS '정산 대사 (기대금액 vs 실제금액 불일치 관리)';
COMMENT ON COLUMN st_recon.recon_id               IS '대사ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN st_recon.site_id                IS '사이트ID';
COMMENT ON COLUMN st_recon.vendor_id              IS '업체ID';
COMMENT ON COLUMN st_recon.recon_type_cd          IS '대사유형 (코드: RECON_TYPE — ORDER/PAY/CLAIM/VENDOR)';
COMMENT ON COLUMN st_recon.recon_status_cd        IS '대사상태 (코드: RECON_STATUS — MATCHED/MISMATCH/RESOLVED)';
COMMENT ON COLUMN st_recon.recon_status_cd_before IS '변경 전 대사상태';
COMMENT ON COLUMN st_recon.settle_id              IS '정산ID (st_settle.settle_id)';
COMMENT ON COLUMN st_recon.settle_raw_id          IS '수집원장ID (st_settle_raw.settle_raw_id)';
COMMENT ON COLUMN st_recon.ref_id                 IS '참조ID (order_id / pay_id / claim_id 등)';
COMMENT ON COLUMN st_recon.ref_no                 IS '참조번호 스냅샷';
COMMENT ON COLUMN st_recon.settle_period          IS '정산기간 (YYYY-MM)';
COMMENT ON COLUMN st_recon.expected_amt           IS '기대금액 (정산 계산값)';
COMMENT ON COLUMN st_recon.actual_amt             IS '실제금액 (외부/결제 확인값)';
COMMENT ON COLUMN st_recon.diff_amt               IS '차이금액 (expected_amt - actual_amt)';
COMMENT ON COLUMN st_recon.recon_note             IS '대사 메모';
COMMENT ON COLUMN st_recon.resolved_by            IS '해소 처리자 (sy_user.user_id)';
COMMENT ON COLUMN st_recon.resolved_date          IS '해소 일시';
COMMENT ON COLUMN st_recon.reg_by                 IS '등록자';
COMMENT ON COLUMN st_recon.reg_date               IS '등록일';
COMMENT ON COLUMN st_recon.upd_by                 IS '수정자';
COMMENT ON COLUMN st_recon.upd_date               IS '수정일';

CREATE INDEX idx_st_recon_settle     ON st_recon (settle_id);
CREATE INDEX idx_st_recon_vendor     ON st_recon (site_id, vendor_id);
CREATE INDEX idx_st_recon_type       ON st_recon (recon_type_cd, recon_status_cd);
CREATE INDEX idx_st_recon_period     ON st_recon (settle_period);
CREATE INDEX idx_st_recon_ref        ON st_recon (ref_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] st_recon.recon_type_cd (대사유형) : RECON_TYPE { ORDER:주문, SETTLE:정산 }
-- [CODES] st_recon.recon_status_cd (대사상태) : RECON_STATUS { MATCHED:일치, DIFF:불일치, MANUAL:수동처리 }

-- ============================================================
-- st_erp_voucher : ERP 전표 마스터
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 정산 확정 후 ERP로 전송할 회계 전표를 생성·관리
-- ============================================================
CREATE TABLE IF NOT EXISTS st_erp_voucher (
    erp_voucher_id          VARCHAR(21)     NOT NULL,
    site_id                 VARCHAR(21)     NOT NULL,               -- sy_site.site_id
    vendor_id               VARCHAR(21),                            -- sy_vendor.vendor_id

    -- ── 정산 연결
    settle_id               VARCHAR(21),                            -- st_settle.settle_id
    settle_ym               CHAR(6),                                -- 정산년월 (YYYYMM)

    -- ── 전표 기본
    erp_voucher_type_cd     VARCHAR(20)     NOT NULL,               -- 코드: ERP_VOUCHER_TYPE (SETTLE/RETURN/ADJ/PAY)
    erp_voucher_status_cd   VARCHAR(20)     DEFAULT 'DRAFT',        -- 코드: ERP_VOUCHER_STATUS (DRAFT/CONFIRMED/SENT/MATCHED/MISMATCH/ERROR)
    erp_voucher_status_cd_before VARCHAR(20),                       -- 변경 전 상태
    voucher_date            DATE            NOT NULL,               -- 전표 기준일자
    erp_voucher_desc        VARCHAR(500),                           -- 전표 적요

    -- ── 금액 검증
    total_debit_amt         BIGINT          DEFAULT 0,              -- 차변 합계
    total_credit_amt        BIGINT          DEFAULT 0,              -- 대변 합계

    -- ── ERP 연동
    erp_send_date           TIMESTAMP,                              -- ERP 전송일시
    erp_voucher_no          VARCHAR(50),                            -- ERP 채번 전표번호 (전송 후 수신)
    erp_res_msg             VARCHAR(500),                           -- ERP 처리 응답 메시지

    reg_by                  VARCHAR(16),
    reg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(16),
    upd_date                TIMESTAMP,

    PRIMARY KEY (erp_voucher_id)
);

COMMENT ON TABLE  st_erp_voucher IS 'ERP 전표 마스터 (정산 → ERP 회계 전표)';
COMMENT ON COLUMN st_erp_voucher.erp_voucher_id          IS 'ERP전표ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN st_erp_voucher.site_id                 IS '사이트ID';
COMMENT ON COLUMN st_erp_voucher.vendor_id               IS '업체ID';
COMMENT ON COLUMN st_erp_voucher.settle_id               IS '정산ID (st_settle.settle_id)';
COMMENT ON COLUMN st_erp_voucher.settle_ym               IS '정산년월 (YYYYMM)';
COMMENT ON COLUMN st_erp_voucher.erp_voucher_type_cd     IS '전표유형 (코드: ERP_VOUCHER_TYPE — SETTLE/RETURN/ADJ/PAY)';
COMMENT ON COLUMN st_erp_voucher.erp_voucher_status_cd   IS '전표상태 (코드: ERP_VOUCHER_STATUS — DRAFT/CONFIRMED/SENT/MATCHED/MISMATCH/ERROR)';
COMMENT ON COLUMN st_erp_voucher.erp_voucher_status_cd_before IS '변경 전 전표상태';
COMMENT ON COLUMN st_erp_voucher.voucher_date            IS '전표 기준일자';
COMMENT ON COLUMN st_erp_voucher.erp_voucher_desc        IS '전표 적요';
COMMENT ON COLUMN st_erp_voucher.total_debit_amt         IS '차변 합계 (대변과 일치해야 전표 확정 가능)';
COMMENT ON COLUMN st_erp_voucher.total_credit_amt        IS '대변 합계';
COMMENT ON COLUMN st_erp_voucher.erp_send_date           IS 'ERP 전송일시';
COMMENT ON COLUMN st_erp_voucher.erp_voucher_no          IS 'ERP 채번 전표번호 (전송 후 ERP에서 수신)';
COMMENT ON COLUMN st_erp_voucher.erp_res_msg             IS 'ERP 처리 응답 메시지';
COMMENT ON COLUMN st_erp_voucher.reg_by                  IS '등록자';
COMMENT ON COLUMN st_erp_voucher.reg_date                IS '등록일';
COMMENT ON COLUMN st_erp_voucher.upd_by                  IS '수정자';
COMMENT ON COLUMN st_erp_voucher.upd_date                IS '수정일';

CREATE INDEX idx_st_erp_voucher_settle  ON st_erp_voucher (settle_id);
CREATE INDEX idx_st_erp_voucher_vendor  ON st_erp_voucher (site_id, vendor_id);
CREATE INDEX idx_st_erp_voucher_ym      ON st_erp_voucher (settle_ym);
CREATE INDEX idx_st_erp_voucher_status  ON st_erp_voucher (erp_voucher_status_cd);
CREATE INDEX idx_st_erp_voucher_no      ON st_erp_voucher (erp_voucher_no);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] st_erp_voucher.erp_voucher_type_cd (전표유형) : ERP_VOUCHER_TYPE { SALE:매출, CANCEL:취소, SETTLE:정산, ADJ:조정 }
-- [CODES] st_erp_voucher.erp_voucher_status_cd (전표상태) : ERP_VOUCHER_STATUS { DRAFT:초안, SENT:전송완료, FAILED:전송실패, CONFIRMED:확정 }

-- ============================================================
-- st_erp_voucher_line : ERP 전표 라인 (분개 항목)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 전표 1건당 차변/대변 복수 라인 (대차 균형 필수)
-- ============================================================
CREATE TABLE IF NOT EXISTS st_erp_voucher_line (
    erp_voucher_line_id     VARCHAR(21)     NOT NULL,
    erp_voucher_id          VARCHAR(21)     NOT NULL,               -- st_erp_voucher.erp_voucher_id
    line_no                 INTEGER         NOT NULL,               -- 라인 순번

    -- ── 계정 정보
    account_cd              VARCHAR(20)     NOT NULL,               -- 계정코드 (ERP 계정과목)
    account_nm              VARCHAR(100),                           -- 계정명 (스냅샷)
    cost_center_cd          VARCHAR(20),                            -- 코스트센터 코드
    profit_center_cd        VARCHAR(20),                            -- 수익센터 코드

    -- ── 금액 (차변/대변 중 하나만 입력)
    debit_amt               BIGINT          DEFAULT 0,              -- 차변 금액
    credit_amt              BIGINT          DEFAULT 0,              -- 대변 금액

    -- ── 참조
    ref_type_cd             VARCHAR(20),                            -- 참조유형 (SETTLE/ORDER/CLAIM/PAY/ADJ)
    ref_id                  VARCHAR(21),                            -- 참조ID (settle_id / order_id 등)
    line_memo               VARCHAR(300),                           -- 라인 적요

    reg_by                  VARCHAR(16),
    reg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (erp_voucher_line_id),
    UNIQUE (erp_voucher_id, line_no)
);

COMMENT ON TABLE  st_erp_voucher_line IS 'ERP 전표 라인 (분개 항목, 차변/대변 1행씩)';
COMMENT ON COLUMN st_erp_voucher_line.erp_voucher_line_id IS '전표라인ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN st_erp_voucher_line.erp_voucher_id      IS 'ERP전표ID (st_erp_voucher.erp_voucher_id)';
COMMENT ON COLUMN st_erp_voucher_line.line_no             IS '라인 순번 (전표 내 고유)';
COMMENT ON COLUMN st_erp_voucher_line.account_cd          IS '계정코드 (ERP 계정과목 코드)';
COMMENT ON COLUMN st_erp_voucher_line.account_nm          IS '계정명 스냅샷';
COMMENT ON COLUMN st_erp_voucher_line.cost_center_cd      IS '코스트센터 코드';
COMMENT ON COLUMN st_erp_voucher_line.profit_center_cd    IS '수익센터 코드';
COMMENT ON COLUMN st_erp_voucher_line.debit_amt           IS '차변 금액 (대변과 상호 배타적)';
COMMENT ON COLUMN st_erp_voucher_line.credit_amt          IS '대변 금액 (차변과 상호 배타적)';
COMMENT ON COLUMN st_erp_voucher_line.ref_type_cd         IS '참조유형 (SETTLE/ORDER/CLAIM/PAY/ADJ)';
COMMENT ON COLUMN st_erp_voucher_line.ref_id              IS '참조ID (settle_id / order_id / claim_id 등)';
COMMENT ON COLUMN st_erp_voucher_line.line_memo           IS '라인 적요';
COMMENT ON COLUMN st_erp_voucher_line.reg_by              IS '등록자';
COMMENT ON COLUMN st_erp_voucher_line.reg_date            IS '등록일';

CREATE INDEX idx_st_erp_voucher_line_voucher ON st_erp_voucher_line (erp_voucher_id);
CREATE INDEX idx_st_erp_voucher_line_account ON st_erp_voucher_line (account_cd);
CREATE INDEX idx_st_erp_voucher_line_ref     ON st_erp_voucher_line (ref_id);
