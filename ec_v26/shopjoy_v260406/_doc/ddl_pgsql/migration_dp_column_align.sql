-- ============================================================================
-- migration_dp_column_align.sql
-- dp_panel_item / dp_widget / dp_widget_lib 컬럼명 의미 일치 보정
--
--  1) dp_panel_item.item_sort_ord  -> sort_ord       (dp_widget/dp_widget_lib 와 통일)
--  2) dp_widget.preview_img_url    -> thumbnail_url   (dp_widget_lib 와 통일, 프로젝트 표준)
--
--  - RENAME COLUMN 은 의존 인덱스(idx_dp_panel_item_ord)를 자동으로 따라감
--  - COMMENT 는 컬럼명이 바뀌면 사라지므로 재설정
--  대상 스키마: shopjoy_2604
-- ============================================================================

-- 안전 가드: 컬럼이 이미 변경되어 있으면 RENAME 을 건너뜀
DO $$
BEGIN
    -- 1) dp_panel_item.item_sort_ord -> sort_ord
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'shopjoy_2604'
          AND table_name   = 'dp_panel_item'
          AND column_name  = 'item_sort_ord'
    ) THEN
        ALTER TABLE shopjoy_2604.dp_panel_item RENAME COLUMN item_sort_ord TO sort_ord;
    END IF;

    -- 2) dp_widget.preview_img_url -> thumbnail_url
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'shopjoy_2604'
          AND table_name   = 'dp_widget'
          AND column_name  = 'preview_img_url'
    ) THEN
        ALTER TABLE shopjoy_2604.dp_widget RENAME COLUMN preview_img_url TO thumbnail_url;
    END IF;
END
$$;

-- COMMENT 재설정 (RENAME 후 컬럼 코멘트가 소실되므로 명시 재설정)
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.sort_ord     IS '항목정렬순서';
COMMENT ON COLUMN shopjoy_2604.dp_widget.thumbnail_url    IS '미리보기 썸네일URL';
