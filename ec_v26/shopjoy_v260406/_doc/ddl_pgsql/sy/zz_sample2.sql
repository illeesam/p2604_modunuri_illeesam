-- zz_sample2 테이블 DDL
-- 샘플 데이터 2: 재고 관리

CREATE TABLE shopjoy_2604.zz_sample2 (
    sample2_id        VARCHAR(20) NOT NULL PRIMARY KEY,
    item_name         VARCHAR(255),
    item_code         VARCHAR(100),
    price             NUMERIC(12, 2),
    quantity          INTEGER DEFAULT 0,
    remark            TEXT,
    is_active         BOOLEAN DEFAULT true,
    reg_by            VARCHAR(50),
    reg_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(50),
    upd_date          TIMESTAMP
);

COMMENT ON TABLE shopjoy_2604.zz_sample2 IS 'ZzSample2 - 샘플 데이터 관리 테이블 2';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.sample2_id IS '샘플2 ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.item_name IS '아이템 이름';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.item_code IS '아이템 코드';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.price IS '가격';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.quantity IS '수량';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.remark IS '비고';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.is_active IS '활성 여부';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.reg_date IS '등록 날짜';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.upd_date IS '수정 날짜';
