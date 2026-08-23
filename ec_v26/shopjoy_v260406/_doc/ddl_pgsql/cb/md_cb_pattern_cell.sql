-- md_cb_pattern_cell 테이블 DDL
-- 코바늘 도안 격자 셀 (단×코 위치별 기호/배색)

CREATE TABLE shopjoy_2604.md_cb_pattern_cell (
    cell_id     VARCHAR(21) NOT NULL CONSTRAINT md_cb_pattern_cell_pk_cell_id PRIMARY KEY,
    site_id     VARCHAR(21) NOT NULL,
    reg_site_id VARCHAR(21) NOT NULL,
    pattern_id  VARCHAR(21) NOT NULL,
    row_no      INTEGER     NOT NULL,
    col_no      INTEGER     NOT NULL,
    symbol_id   VARCHAR(21) NOT NULL,
    color_hex   VARCHAR(7),
    reg_by      VARCHAR(30),
    reg_date    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by      VARCHAR(30),
    upd_date    TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.md_cb_pattern_cell IS '코바늘 도안 격자 셀 (단×코 위치별 기호/배색)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_cell.cell_id IS '셀ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_cell.site_id IS '사이트ID (sy_site.site_id) - 업무 소속 사이트';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_cell.reg_site_id IS '등록 사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_cell.pattern_id IS '도안ID (md_cb_pattern.pattern_id)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_cell.row_no IS '단 번호 (세로 위치, 1부터)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_cell.col_no IS '코 번호 (가로 위치, 1부터)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_cell.symbol_id IS '기호ID (md_cb_symbol.symbol_id)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_cell.color_hex IS '이 셀의 배색 (예: #FF0000, NULL=기본 실색)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_cell.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_cell.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_cell.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_cell.upd_date IS '수정일';

CREATE UNIQUE INDEX md_cb_pattern_cell_uk_pattern_row_col ON shopjoy_2604.md_cb_pattern_cell USING btree (pattern_id, row_no, col_no);
CREATE INDEX md_cb_pattern_cell_ix01_symbol_id ON shopjoy_2604.md_cb_pattern_cell USING btree (symbol_id);
