-- pm_save_item 테이블 DDL
-- 적립금 대상 상품 (pm_save 하위 항목)

CREATE TABLE shopjoy_2604.pm_save_item (
    save_item_id   VARCHAR(21) NOT NULL PRIMARY KEY,
    save_id        VARCHAR(21) NOT NULL,
    site_id        VARCHAR(21) NOT NULL,
    target_type_cd VARCHAR(20) NOT NULL,
    target_id      VARCHAR(21) NOT NULL,
    reg_by         VARCHAR(30),
    reg_date       TIMESTAMP   DEFAULT now(),
    upd_by         VARCHAR(30),
    upd_date       TIMESTAMP  ,
    CONSTRAINT fk_pm_save_item_save FOREIGN KEY (save_id) REFERENCES shopjoy_2604.pm_save (save_id)
);

COMMENT ON TABLE  shopjoy_2604.pm_save_item IS '적립금 대상 상품 (pm_save 하위 항목)';
COMMENT ON COLUMN shopjoy_2604.pm_save_item.save_item_id IS 'PK: SAI+yyMMddHHmmss+rand4';
COMMENT ON COLUMN shopjoy_2604.pm_save_item.save_id IS 'FK: pm_save.save_id (적립금 ID)';
COMMENT ON COLUMN shopjoy_2604.pm_save_item.site_id IS 'FK: sy_site.site_id (NULL=전사 공통)';
COMMENT ON COLUMN shopjoy_2604.pm_save_item.target_type_cd IS '대상 유형 코드 (sy_code: SAVE_ITEM_TARGET)';
COMMENT ON COLUMN shopjoy_2604.pm_save_item.target_id IS '대상 ID (상품·카테고리·브랜드 등)';
COMMENT ON COLUMN shopjoy_2604.pm_save_item.reg_by IS '등록자 ID';
COMMENT ON COLUMN shopjoy_2604.pm_save_item.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.pm_save_item.upd_by IS '수정자 ID';
COMMENT ON COLUMN shopjoy_2604.pm_save_item.upd_date IS '수정일시';

CREATE INDEX idx_pm_save_item_site ON shopjoy_2604.pm_save_item USING btree (site_id);
CREATE INDEX idx_pm_si_reg_date ON shopjoy_2604.pm_save_item USING btree (reg_date DESC);
CREATE INDEX idx_pm_si_save_id ON shopjoy_2604.pm_save_item USING btree (save_id);
CREATE INDEX idx_pm_si_site_id ON shopjoy_2604.pm_save_item USING btree (site_id);
CREATE INDEX idx_pm_si_target ON shopjoy_2604.pm_save_item USING btree (target_type_cd, target_id);
CREATE UNIQUE INDEX pk_pm_save_item ON shopjoy_2604.pm_save_item USING btree (save_item_id);
