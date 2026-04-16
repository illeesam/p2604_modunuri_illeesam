-- ============================================================
CREATE TABLE od_dliv (
    dliv_id         VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    order_id        VARCHAR(16)     NOT NULL,
    claim_id        VARCHAR(16),                            -- od_claim. (클레임 배송일 때만)
    vendor_id       VARCHAR(16),                            -- 분리출고 시 담당 업체
    member_id       VARCHAR(16),
    member_nm       VARCHAR(50),
    recv_nm         VARCHAR(50),
    recv_phone      VARCHAR(20),
    recv_zip        VARCHAR(10),
    recv_addr       VARCHAR(200),
    recv_addr_detail VARCHAR(200),
    dliv_div_cd     VARCHAR(20)     DEFAULT 'OUTBOUND',     -- 코드: DLIV_DIV (OUTBOUND=출고, INBOUND=입고반품)
    dliv_type_cd    VARCHAR(20),                            -- 코드: DLIV_TYPE (NORMAL/RETURN/EXCHANGE/EXCHANGE_OUT)
    outbound_courier_cd VARCHAR(30),                        -- 출고(발송) 택배사 (코드: COURIER)
    outbound_tracking_no VARCHAR(100),                      -- 출고(발송) 송장
    inbound_courier_cd VARCHAR(30),                         -- 반입 택배사 (반품일 때만)
    inbound_tracking_no VARCHAR(100),                       -- 반입 송장
    dliv_status_cd  VARCHAR(20)     DEFAULT 'READY',        -- 코드: DLIV_STATUS
    dliv_status_cd_before VARCHAR(20),                      -- 변경 전 배송상태
    dliv_ship_date  TIMESTAMP,
    dliv_date       TIMESTAMP,
    dliv_memo       VARCHAR(300),
    shipping_fee    BIGINT          DEFAULT 0,              -- 배송료
    shipping_fee_type_cd VARCHAR(20),                       -- 코드: SHIPPING_FEE_TYPE (OUTBOUND/RETURN/INBOUND/EXCHANGE)
    parent_dliv_id  VARCHAR(16),                            -- 교환 시 원본 배송 참조
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    -- ── 결재처리/추가결재요청 (관리자 일괄작업) ──
    appr_status_cd VARCHAR(20),                          -- 코드: APPROVAL_STATUS (REQ/APPROVED/REJECTED/DONE)
    appr_status_cd_before VARCHAR(20),                  -- 변경 전 결재상태
    appr_amt       BIGINT,                              -- 결재 요청 금액
    appr_target_cd VARCHAR(30),                         -- 코드: APPROVAL_TARGET (ORDER/PROD/DLIV/EXTRA)
    appr_target_nm VARCHAR(200),                        -- 결재 대상명
    appr_reason    VARCHAR(500),                        -- 사유/메모
    appr_req_user_id    VARCHAR(16),                         -- 요청자 (sy_user.user_id)
    appr_req_date  TIMESTAMP,                           -- 요청일시
    appr_aprv_user_id   VARCHAR(16),                         -- 결재자 (sy_user.user_id)
    appr_aprv_date TIMESTAMP,                           -- 결재일시

    PRIMARY KEY (dliv_id)
);

COMMENT ON TABLE od_dliv IS '배송 (1주문 N배송 가능 — 정상출고/반품반입/교환배송)';
COMMENT ON COLUMN od_dliv.dliv_id            IS '배송ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_dliv.site_id            IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_dliv.order_id           IS '주문ID (od_order.)';
COMMENT ON COLUMN od_dliv.claim_id           IS '클레임ID (od_claim., 클레임 배송일 때만)';
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
COMMENT ON COLUMN od_dliv.outbound_courier_cd IS '출고(발송) 택배사 (코드: COURIER)';
COMMENT ON COLUMN od_dliv.outbound_tracking_no IS '출고(발송) 송장번호';
COMMENT ON COLUMN od_dliv.inbound_courier_cd IS '반입 택배사 (반품일 때만, 코드: COURIER)';
COMMENT ON COLUMN od_dliv.inbound_tracking_no IS '반입 송장번호';
COMMENT ON COLUMN od_dliv.dliv_status_cd     IS '배송상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN od_dliv.dliv_status_cd_before IS '변경 전 배송상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN od_dliv.dliv_ship_date     IS '출고일시';
COMMENT ON COLUMN od_dliv.dliv_date          IS '배송완료일시';
COMMENT ON COLUMN od_dliv.dliv_memo          IS '메모';
COMMENT ON COLUMN od_dliv.shipping_fee       IS '배송료';
COMMENT ON COLUMN od_dliv.shipping_fee_type_cd IS '배송료 구분 (코드: SHIPPING_FEE_TYPE — OUTBOUND/RETURN/INBOUND/EXCHANGE)';
COMMENT ON COLUMN od_dliv.parent_dliv_id     IS '부모 배송ID (교환 시 원본 배송 참조)';
COMMENT ON COLUMN od_dliv.reg_by            IS '등록자 (sy_user.user_id, mb_mem.member_id)';
COMMENT ON COLUMN od_dliv.reg_date          IS '등록일';
COMMENT ON COLUMN od_dliv.upd_by            IS '수정자 (sy_user.user_id, mb_mem.member_id)';
COMMENT ON COLUMN od_dliv.upd_date          IS '수정일';

COMMENT ON COLUMN od_dliv.appr_status_cd IS '결재상태 (코드: APPROVAL_STATUS)';
COMMENT ON COLUMN od_dliv.appr_status_cd_before IS '변경 전 결재상태 (코드: APPROVAL_STATUS)';
COMMENT ON COLUMN od_dliv.appr_amt       IS '결재 요청금액';
COMMENT ON COLUMN od_dliv.appr_target_cd IS '결재대상 구분 (코드: APPROVAL_TARGET)';
COMMENT ON COLUMN od_dliv.appr_target_nm IS '결재 대상명';
COMMENT ON COLUMN od_dliv.appr_reason    IS '사유/메모';
COMMENT ON COLUMN od_dliv.appr_req_user_id    IS '결재 요청자 (sy_user.user_id)';
COMMENT ON COLUMN od_dliv.appr_req_date  IS '결재 요청일시';
COMMENT ON COLUMN od_dliv.appr_aprv_user_id   IS '결재자 (sy_user.user_id)';
COMMENT ON COLUMN od_dliv.appr_aprv_date IS '결재일시';
