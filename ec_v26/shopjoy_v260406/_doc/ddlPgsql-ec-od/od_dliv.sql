-- 배송 (1주문 N배송 가능 — 정상출고/반품반입/교환배송)
CREATE TABLE od_dliv (
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
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
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
