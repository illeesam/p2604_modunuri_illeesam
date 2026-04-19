# screenBo-ec-dp/ 관리자 화면 — 전시(DP) 도메인

## 화면 목록
- `dp-ui-mng.html` — 전시UI관리 (UI 목록/생성/편집)
- `dp-area-mng.html` — 영역관리 (UI 내 Area 배치)
- `dp-panel-mng.html` — 패널관리 (Area 내 Panel 구성)
- `dp-widget-mng.html` — 위젯관리 (Panel 내 Widget 배치/편집)

## 전시 계층 구조
```
UI (DispX01Ui)
└─ Area (DispX02Area)
   └─ Panel (DispX03Panel)
      └─ Widget (DispX04Widget)
```

## 위젯 타입
`image_banner`, `product_slider`, `product`, `cond_product`, `chart_bar/line/pie`,
`text_banner`, `info_card`, `popup`, `file`, `file_list`, `coupon`, `html_editor`,
`event_banner`, `cache_banner`, `widget_embed`, `barcode`, `countdown`

## 관련 관리자 컴포넌트
| pageId | 컴포넌트 | 파일 |
|---|---|---|
| `dispUiMng` | `ec-disp-ui-mng` | `pages/admin/ec/dp/DispUiMng.js` |
| `dispAreaMng` | `ec-disp-area-mng` | `pages/admin/ec/dp/DispAreaMng.js` |
| `dispPanelMng` | `ec-disp-panel-mng` | `pages/admin/ec/dp/DispPanelMng.js` |
| `dispWidgetMng` | `ec-disp-widget-mng` | `pages/admin/ec/dp/DispWidgetMng.js` |

## 관련 DDL
- `_doc/ddlPgsql-ec-dp/` — 전시 도메인 전체 DDL

## 관련 정책서
- `_doc/정책서-ec-dp/` — 전시 도메인 정책
