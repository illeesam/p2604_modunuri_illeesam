-- ============================================================
-- pm_save_item — 적립금 대상 상품
-- 적립금(pm_save)에 적립 대상으로 지정된 상품/카테고리 등의 목록
-- PK: SAI + yyMMddHHmmss + rand4
-- ============================================================
CREATE TABLE shopjoy_2604.pm_save_item (

    save_item_id    VARCHAR(21)  NOT NULL,              -- PK  SAI+yyMMddHHmmss+rand4

    -- 연관 정보
    save_id         VARCHAR(21)  NOT NULL,              -- FK → pm_save.save_id
    site_id         VARCHAR(21),                        -- FK → sy_site.site_id (NULL = 전사 공통)

    -- 대상 정보
    target_type_cd  VARCHAR(20)  NOT NULL,              -- 대상 유형 코드  (sy_code: SAVE_ITEM_TARGET)
    target_id       VARCHAR(21)  NOT NULL,              -- 대상 ID (상품 ID / 카테고리 ID 등)

    -- 감사 컬럼
    reg_by          VARCHAR(30),                        -- 등록자 ID
    reg_date        TIMESTAMP    DEFAULT now(),         -- 등록일시
    upd_by          VARCHAR(30),                        -- 수정자 ID
    upd_date        TIMESTAMP,                          -- 수정일시

    CONSTRAINT pk_pm_save_item PRIMARY KEY (save_item_id),
    CONSTRAINT fk_pm_save_item_save FOREIGN KEY (save_id) REFERENCES shopjoy_2604.pm_save (save_id)
);

-- 조회용 인덱스
CREATE INDEX idx_pm_si_save_id       ON shopjoy_2604.pm_save_item (save_id);
CREATE INDEX idx_pm_si_site_id       ON shopjoy_2604.pm_save_item (site_id);
CREATE INDEX idx_pm_si_target        ON shopjoy_2604.pm_save_item (target_type_cd, target_id);
CREATE INDEX idx_pm_si_reg_date      ON shopjoy_2604.pm_save_item (reg_date DESC);

COMMENT ON TABLE  shopjoy_2604.pm_save_item                   IS '적립금 대상 상품 (pm_save 하위 항목)';
COMMENT ON COLUMN shopjoy_2604.pm_save_item.save_item_id      IS 'PK: SAI+yyMMddHHmmss+rand4';
COMMENT ON COLUMN shopjoy_2604.pm_save_item.save_id           IS 'FK: pm_save.save_id (적립금 ID)';
COMMENT ON COLUMN shopjoy_2604.pm_save_item.site_id           IS 'FK: sy_site.site_id (NULL=전사 공통)';
COMMENT ON COLUMN shopjoy_2604.pm_save_item.target_type_cd    IS '대상 유형 코드 (sy_code: SAVE_ITEM_TARGET)';
COMMENT ON COLUMN shopjoy_2604.pm_save_item.target_id         IS '대상 ID (상품·카테고리·브랜드 등)';
COMMENT ON COLUMN shopjoy_2604.pm_save_item.reg_by            IS '등록자 ID';
COMMENT ON COLUMN shopjoy_2604.pm_save_item.reg_date          IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.pm_save_item.upd_by            IS '수정자 ID';
COMMENT ON COLUMN shopjoy_2604.pm_save_item.upd_date          IS '수정일시';
