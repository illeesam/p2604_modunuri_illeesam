-- ============================================================
CREATE TABLE od_pay_mtd (
    pay_mtd_id      VARCHAR(16)     NOT NULL,
    member_id       VARCHAR(16)     NOT NULL,               -- mb_mem.member_id
    mtd_type_cd     VARCHAR(20)     NOT NULL,               -- 코드: PAY_MTD_TYPE (CARD/BANK/KAKAO/NAVER/TOSS)
    pay_mtd_nm      VARCHAR(100)    NOT NULL,               -- 결제수단 이름 (예: 신한카드, 카카오페이)
    pay_mtd_alias   VARCHAR(100),                           -- 별칭 (사용자 설정)
    pay_key_no      VARCHAR(200),                           -- 결제 게이트웨이 키 (카드/계좌 토큰)
    main_mtd_yn     VARCHAR(1)      DEFAULT 'N',            -- 기본결제수단 여부
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (pay_mtd_id)
);

COMMENT ON TABLE od_pay_mtd IS '마이페이지 등록 결제수단';
COMMENT ON COLUMN od_pay_mtd.pay_mtd_id    IS '결제수단ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_pay_mtd.member_id     IS '회원ID (mb_mem.member_id)';
COMMENT ON COLUMN od_pay_mtd.mtd_type_cd   IS '결제수단유형코드 (코드: PAY_MTD_TYPE)';
COMMENT ON COLUMN od_pay_mtd.pay_mtd_nm    IS '결제수단명 (카드사명, 은행명 등)';
COMMENT ON COLUMN od_pay_mtd.pay_mtd_alias IS '별칭 (사용자 설정)';
COMMENT ON COLUMN od_pay_mtd.pay_key_no    IS '결제 게이트웨이 발급 키/토큰';
COMMENT ON COLUMN od_pay_mtd.main_mtd_yn   IS '기본결제수단여부 Y/N';
COMMENT ON COLUMN od_pay_mtd.reg_by        IS '등록자ID';
COMMENT ON COLUMN od_pay_mtd.reg_date      IS '등록일시';
COMMENT ON COLUMN od_pay_mtd.upd_by        IS '수정자ID';
COMMENT ON COLUMN od_pay_mtd.upd_date      IS '수정일시';

CREATE INDEX idx_od_pay_mtd_member ON od_pay_mtd (member_id);
CREATE INDEX idx_od_pay_mtd_type   ON od_pay_mtd (mtd_type_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] od_pay_mtd.mtd_type_cd (결제수단유형코드) : PAY_MTD_TYPE(PAY_MTD_TYPE) { 코드값 미정의 }
