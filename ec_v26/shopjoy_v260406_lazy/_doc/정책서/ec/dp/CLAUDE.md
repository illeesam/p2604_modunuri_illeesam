# 정책서/ec/dp/ — 전시(Display) 도메인 정책

전시 계층 구조(UI > Area > Panel > Widget) 및 위젯 라이브러리 관리 정책.

## 파일 목록

| 파일 | 내용 |
|---|---|
| `dp.01.전시상태표.md` | 전시 계층별 상태 코드 표 (참조 전용) |
| `dp.02.전시.md` | 전시 전체 구조 및 계층 관계 개요 |
| `dp.03.전시Ui.md` | UI 레이아웃 관리, 공개/숨김 정책 |
| `dp.04.전시Area.md` | 영역(Area) 배치, 순서, 디바이스 타입 |
| `dp.05.전시Panel.md` | 패널 생성, 위젯 연결, 노출 조건 |
| `dp.06.전시Widget.md` | 위젯 타입별(image_banner/product_slider 등) 데이터 구조 |
| `dp.07.전시WidgetLib.md` | 위젯 라이브러리 등록 및 재사용 방식 |

## 위젯 타입
`image_banner`, `product_slider`, `product`, `cond_product`, `chart_bar/line/pie`, `text_banner`, `info_card`, `popup`, `file`, `file_list`, `coupon`, `html_editor`, `event_banner`, `cache_banner`, `widget_embed`, `barcode`, `countdown`

## 관련 테이블
`dp_ui`, `dp_area`, `dp_panel`, `dp_panel_widget`, `dp_widget_lib`

## 관련 화면
| pageId | 라벨 |
|---|---|
| `dispUiMng` | 전시관리 > UI관리 |
| `dispAreaMng` | 전시관리 > 영역관리 |
| `dispPanelMng` | 전시관리 > 패널관리 |
| `dispWidgetMng` | 전시관리 > 위젯관리 |
| `dispWidgetLibMng` | 전시관리 > 위젯라이브러리 |
| `dispUiSimul` | 전시관리 > 시뮬레이션 |
