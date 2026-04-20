-- 클레임 (취소/반품/교환)
CREATE TABLE od_claim (
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
