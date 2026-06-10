-- 전시(dp_*) 구조 개선 마이그레이션 (2026-06-11) — 적용 완료
-- 1) 계층을 직접 FK 로 단순화: dp_ui -< dp_area(ui_id) -< dp_panel(area_id 신설) -< dp_panel_item
-- 2) 매핑 테이블 dp_ui_area / dp_area_panel 폐기 (프론트/백엔드 호출처 0건)
-- 3) dp_panel.disp_panel_status_cd default 'ACTIVE' -> 'SHOW' (DISP_STATUS 코드그룹 정합)
-- 4) DISP_WIDGET_TYPE 에 렌더러(DispX04Widget) 지원 4유형 추가 -> 27종
-- 5) dp_panel_item / dp_panel.content_json 이중화: content_json 이 화면 소스, panel_item 은 관계형 미러

ALTER TABLE shopjoy_2604.dp_panel ADD COLUMN area_id VARCHAR(21);
COMMENT ON COLUMN shopjoy_2604.dp_panel.area_id IS '영역ID (dp_area.area_id)';
ALTER TABLE shopjoy_2604.dp_panel ALTER COLUMN disp_panel_status_cd SET DEFAULT 'SHOW';
DROP TABLE IF EXISTS shopjoy_2604.dp_ui_area;
DROP TABLE IF EXISTS shopjoy_2604.dp_area_panel;
ALTER TABLE shopjoy_2604.dp_panel DROP CONSTRAINT IF EXISTS dp_panel_area_id_fkey;
ALTER TABLE shopjoy_2604.dp_panel ADD CONSTRAINT dp_panel_area_id_fkey FOREIGN KEY (area_id) REFERENCES shopjoy_2604.dp_area (area_id);
CREATE INDEX IF NOT EXISTS idx_dp_panel_area ON shopjoy_2604.dp_panel (area_id);
ALTER TABLE shopjoy_2604.dp_panel_item DROP CONSTRAINT IF EXISTS dp_panel_item_panel_id_fkey;
ALTER TABLE shopjoy_2604.dp_panel_item ADD CONSTRAINT dp_panel_item_panel_id_fkey FOREIGN KEY (panel_id) REFERENCES shopjoy_2604.dp_panel (panel_id) ON DELETE CASCADE;
ALTER TABLE shopjoy_2604.dp_panel_item DROP CONSTRAINT IF EXISTS dp_panel_item_widget_lib_id_fkey;
ALTER TABLE shopjoy_2604.dp_panel_item ADD CONSTRAINT dp_panel_item_widget_lib_id_fkey FOREIGN KEY (widget_lib_id) REFERENCES shopjoy_2604.dp_widget_lib (widget_lib_id);
CREATE INDEX IF NOT EXISTS idx_dp_panel_item_panel ON shopjoy_2604.dp_panel_item (panel_id);
