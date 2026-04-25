# ec-dp/ 전시 도메인 DDL

## 계층 구조
```
dp_ui (UI)
  └─ dp_ui_area (UI-영역 연결, sort_no)
       └─ dp_area (영역 마스터)
            └─ dp_area_panel (영역-패널 연결, sort_no)
                 └─ dp_panel (패널 마스터)
                      └─ dp_panel_item (패널-위젯 배치, sort_no)
                           └─ dp_widget (위젯 인스턴스)
                                └─ dp_widget_lib (위젯 라이브러리, 재사용)
```

## SQL 파일 목록
- `dp_ui.sql` — 전시 UI 최상위 (PK: ui_id)
- `dp_ui_area.sql` — UI-영역 연결 (PK: ui_area_id, UNIQUE: ui_id + area_id)
- `dp_area.sql` — 영역 마스터 (PK: area_id, area_cd)
- `dp_area_panel.sql` — 영역-패널 연결 (PK: area_panel_id, sort_no)
- `dp_panel.sql` — 패널 마스터 (PK: panel_id)
- `dp_panel_item.sql` — 패널-위젯 배치 (PK: panel_item_id, sort_no)
- `dp_widget.sql` — 위젯 인스턴스 (PK: widget_id, widget_type_cd)
- `dp_widget_lib.sql` — 위젯 라이브러리 (PK: widget_lib_id, 재사용 가능)

## 핵심 컬럼 규칙
- `disp_yn`: 시스템 자동 관리 (공개 조건 충족 시 Y)
- `use_yn`: 관리자 수동 토글
- `widget_lib_ref_yn`: Y=라이브러리 참조, N=직접 콘텐츠
- `visibility_targets`: `^PUBLIC^MEMBER^VIP^` 캐럿 구분 인코딩

## 위젯 타입 (widget_type_cd)
`image_banner`, `product_slider`, `product`, `cond_product`,
`chart_bar`, `chart_line`, `chart_pie`, `text_banner`,
`info_card`, `popup`, `file`, `file_list`, `coupon`,
`html_editor`, `event_banner`, `cache_banner`,
`widget_embed`, `barcode`, `countdown`

## 관리자 화면 경로
| pageId | 라벨 | 관련 테이블 |
|---|---|---|
| `dpDispUiMng` | 전시관리 > 전시UI관리 | dp_ui, dp_ui_area |
| `dpDispAreaMng` | 전시관리 > 전시영역관리 | dp_area, dp_area_panel |
| `dpDispPanelMng` | 전시관리 > 전시패널관리 | dp_panel, dp_panel_item |
| `dpDispWidgetMng` | 전시관리 > 전시위젯관리 | dp_widget |
| `dpDispWidgetLibMng` | 전시관리 > 전시위젯Lib | dp_widget_lib |
| `dpDispUiSimul` | 전시관리 > 전시UI시뮬레이션 | dp_ui 전체 계층 |
| `dpDispRelationMng` | 전시관리 > 전시관계도 | dp_ui 전체 계층 |
| `dpDispUiPreview` | 전시관리 > 전시UI미리보기 | dp_ui |
| `dpDispAreaPreview` | 전시관리 > 전시영역미리보기 | dp_area |
| `dpDispPanelPreview` | 전시관리 > 전시패널미리보기 | dp_panel |
| `dpDispWidgetPreview` | 전시관리 > 전시위젯미리보기 | dp_widget |
| `dpDispWidgetLibPreview` | 전시관리 > 전시위젯Lib미리보기 | dp_widget_lib |

## 관련 정책서
- `_doc/정책서ec/dp.01.전시.md`
- `_doc/정책서ec/dp.02.전시Ui.md`
- `_doc/정책서ec/dp.03.전시Area.md`
- `_doc/정책서ec/dp.04.전시Panel.md`
- `_doc/정책서ec/dp.05.전시Widget.md`
- `_doc/정책서ec/dp.06.전시WidgetLib.md`
