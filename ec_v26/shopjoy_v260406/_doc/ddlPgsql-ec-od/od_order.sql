-- 주문 마스터
CREATE TABLE od_order (
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
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
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
