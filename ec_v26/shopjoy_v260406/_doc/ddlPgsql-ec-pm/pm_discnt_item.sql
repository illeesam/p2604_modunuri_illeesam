-- ============================================================
-- pm_discnt_item : 할인 대상 항목 (상품/카테고리)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE pm_discnt_item (
    discnt_item_id      VARCHAR(21)     NOT NULL,
    discnt_id           VARCHAR(21)     NOT NULL,               -- pm_discnt.discnt_id
    site_id             VARCHAR(21),
    target_type_cd      VARCHAR(20)     NOT NULL,               -- 코드: DISCNT_ITEM_TARGET (CATEGORY/PRODUCT/MEMBER_GRADE)
    target_id           VARCHAR(21)     NOT NULL,               -- category_id / prod_id / grade_cd
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (discnt_item_id),
    UNIQUE (discnt_id, target_type_cd, target_id)
);

COMMENT ON TABLE pm_discnt_item IS '할인 대상 항목';
COMMENT ON COLUMN pm_discnt_item.discnt_item_id  IS '할인항목ID';
COMMENT ON COLUMN pm_discnt_item.discnt_id       IS '할인ID (pm_discnt.discnt_id)';
COMMENT ON COLUMN pm_discnt_item.site_id         IS '사이트ID';
COMMENT ON COLUMN pm_discnt_item.target_type_cd  IS '대상유형 (코드: DISCNT_ITEM_TARGET)';
COMMENT ON COLUMN pm_discnt_item.target_id       IS '대상ID (category_id/prod_id/grade_cd)';
COMMENT ON COLUMN pm_discnt_item.reg_by          IS '등록자';
COMMENT ON COLUMN pm_discnt_item.reg_date        IS '등록일';
COMMENT ON COLUMN pm_discnt_item.upd_by   IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_discnt_item.upd_date IS '수정일';

CREATE INDEX idx_pm_discnt_item_discnt ON pm_discnt_item (discnt_id);
CREATE INDEX idx_pm_discnt_item_target ON pm_discnt_item (target_type_cd, target_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_discnt_item.target_type_cd (대상유형) : PROMO_TARGET_TYPE { ALL:전체, PRODUCT:상품, CATEGORY:카테고리, VENDOR:업체, BRAND:브랜드, MEMBER_GRADE:회원등급 }
