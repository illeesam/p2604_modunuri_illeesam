-- zz_sample1 테이블 DDL
-- 샘플 데이터 1: 콘텐츠 관리

CREATE TABLE shopjoy_2604.zz_sample1 (
    sample1_id        VARCHAR(20) NOT NULL PRIMARY KEY,
    category          VARCHAR(50),
    title             VARCHAR(255),
    content           TEXT,
    status            VARCHAR(20) DEFAULT 'DRAFT',
    view_count        INTEGER DEFAULT 0,
    reg_by            VARCHAR(50),
    reg_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(50),
    upd_date          TIMESTAMP
);

COMMENT ON TABLE shopjoy_2604.zz_sample1 IS 'ZzSample1 - 샘플 데이터 관리 테이블 1';
COMMENT ON COLUMN shopjoy_2604.zz_sample1.sample1_id IS '샘플1 ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.zz_sample1.category IS '카테고리';
COMMENT ON COLUMN shopjoy_2604.zz_sample1.title IS '제목';
COMMENT ON COLUMN shopjoy_2604.zz_sample1.content IS '내용';
COMMENT ON COLUMN shopjoy_2604.zz_sample1.status IS '상태 (DRAFT/PUBLISHED/ARCHIVED)';
COMMENT ON COLUMN shopjoy_2604.zz_sample1.view_count IS '조회 수';
COMMENT ON COLUMN shopjoy_2604.zz_sample1.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.zz_sample1.reg_date IS '등록 날짜';
COMMENT ON COLUMN shopjoy_2604.zz_sample1.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.zz_sample1.upd_date IS '수정 날짜';
