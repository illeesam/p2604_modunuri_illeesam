-- cm_quote_bid 테이블 DDL
-- 전문가 견적 (요청 1건에 전문가당 1건, SENT → ACCEPTED/DECLINED) — 2026-10-04 신규 (migration_20261004_dm_local.sql)

CREATE TABLE shopjoy_2604.cm_quote_bid (
    quote_bid_id      VARCHAR(21)   NOT NULL CONSTRAINT cm_quote_bid_pk_quote_bid_id PRIMARY KEY,
    site_id           VARCHAR(21)   NOT NULL,
    quote_req_id      VARCHAR(21)   NOT NULL,
    expert_id         VARCHAR(21)   NOT NULL,
    expert_member_id  VARCHAR(21)   NOT NULL,
    expert_nm         VARCHAR(100),
    bid_amt           BIGINT,
    bid_msg           TEXT,
    bid_status_cd     VARCHAR(20)   NOT NULL DEFAULT 'SENT',
    chatt_id          VARCHAR(21),
    reply_date        TIMESTAMP,
    reg_by            VARCHAR(30),
    reg_date          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(30),
    upd_date          TIMESTAMP,
    reg_site_id       VARCHAR(21)   NOT NULL,
    CONSTRAINT cm_quote_bid_uk01_req_expert UNIQUE (quote_req_id, expert_id)
);

COMMENT ON TABLE  shopjoy_2604.cm_quote_bid IS '전문가 견적 (견적요청에 대한 응답)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.quote_bid_id IS '견적ID (QUB+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.quote_req_id IS '견적요청ID (cm_quote_req.quote_req_id)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.expert_id IS '전문가ID (cm_expert.expert_id)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.expert_member_id IS '전문가 회원ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.expert_nm IS '전문가 상호 (비정규화 캐시)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.bid_amt IS '견적 금액';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.bid_msg IS '견적 메시지';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.bid_status_cd IS '상태 (코드: DM_QUOTE_BID_STATUS — SENT 보냄/ACCEPTED 수락/DECLINED 거절)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.chatt_id IS '수락 뒤 만든 채팅방ID (cm_chatt.chatt_id)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.reply_date IS '수락·거절 일시';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.upd_date IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.reg_site_id IS '등록 사이트ID (감사 필드)';

CREATE INDEX cm_quote_bid_ix01_expert ON shopjoy_2604.cm_quote_bid USING btree (expert_id, reg_date DESC);
