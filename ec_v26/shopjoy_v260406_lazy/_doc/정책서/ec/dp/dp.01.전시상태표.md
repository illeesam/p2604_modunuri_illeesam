<style>
table { width: 100%; border-collapse: collapse; }
th, td { word-break: keep-all; overflow-wrap: break-word; white-space: normal; vertical-align: top; }
</style>

# dp.01. 전시 상태 코드 표

전시(Display) 도메인 전체 상태·분류 코드를 한 곳에서 조회하는 참조 문서.
계층 구조: UI > Area > Panel > Widget. 상세 정책은 dp.02~dp.07을 참조하세요.

---

## 1. 상태 코드 표

### 1-A. 전시 공개 상태 — `use_yn` (UI / Area / Panel / Widget 공통)
UI·Area·Panel·Widget 4개 계층이 공통으로 사용하는 노출 제어 값.
실제 노출은 모든 상위 계층이 Y여야만 성립하며, 하나라도 N이면 숨김 처리된다.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| Y | 활성   | 사용자에게 노출. 상위 계층도 Y여야 표시됨 |
| N | 비활성 | 비노출. 하위 계층 설정과 무관하게 숨김 처리 |

---

### 1-B. 위젯 유형 — `dp_widget.widget_type_cd`
Panel 내 배치되는 위젯의 종류를 지정. 유형에 따라 속성 스키마가 달라진다.
총 20종의 위젯 유형을 지원하며, 상품·이벤트·쿠폰·미디어 등 다양한 콘텐츠를 표현 가능.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| image_banner   | 이미지배너   | 단일 이미지 + 링크 |
| product_slider | 상품슬라이더 | 가로 스크롤 상품 목록 |
| product        | 상품진열     | 고정 상품 목록 |
| cond_product   | 조건부상품   | 조건 기반 자동 상품 노출 |
| chart_bar      | 막대차트     | 데이터 시각화 |
| chart_line     | 선형차트     | 데이터 시각화 |
| chart_pie      | 파이차트     | 데이터 시각화 |
| text_banner    | 텍스트배너   | 텍스트 + 배경색 |
| info_card      | 정보카드     | 아이콘 + 텍스트 카드 |
| popup          | 팝업         | 레이어 팝업 |
| file           | 파일         | 단일 파일 다운로드 |
| file_list      | 파일목록     | 복수 파일 목록 |
| coupon         | 쿠폰         | 쿠폰 발급 위젯 |
| html_editor    | HTML에디터   | 자유 HTML 입력 |
| event_banner   | 이벤트배너   | 이벤트 연결 배너 |
| cache_banner   | 캐시배너     | 충전금 프로모션 배너 |
| widget_embed   | 위젯임베드   | 다른 위젯 삽입 |
| barcode        | 바코드       | 바코드/QR 생성 |
| countdown      | 카운트다운   | D-day 타이머 |
| markdown       | 마크다운     | Markdown → HTML 렌더 |

---

### 1-C. 전시 영역 코드 — `dp_area.area_cd`
`dp_area` 테이블에서 관리하는 영역 코드. 영역 코드는 추가·변경 가능하며, 아래는 기본 제공 예시.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| MAIN_TOP    | 메인상단 | 홈 상단 배너 영역 |
| MAIN_MID    | 메인중단 | 홈 중간 기획 영역 |
| MAIN_BTM    | 메인하단 | 홈 하단 추천 영역 |
| CATEGORY    | 카테고리 | 카테고리 페이지 영역 |
| PROD_DETAIL | 상품상세 | 상품 상세 추천 영역 |
| POPUP       | 팝업     | 전체 팝업 영역 |

---

## 2. 상관관계표

### 2-A. 전시 계층 구조 — 계층(기준) × 테이블·상태·하위관계
UI → Area → Panel → Widget 순으로 계층이 구성되며, 각 계층은 동일한 `use_yn`을 사용.
상위 계층이 N이면 하위 계층 상태와 무관하게 노출 안 됨.

| 계층   | 테이블        | 상태코드 | 하위 포함 | 미리보기 | 비고 |
|:---|:---|:---:|:---:|:---:|:---|
| UI     | `dp_ui`     | `use_yn` | Area   | ✅ | 사이트·디바이스 단위 |
| Area   | `dp_area`   | `use_yn` | Panel  | ✅ | 영역코드(area_cd) 매핑 |
| Panel  | `dp_panel`  | `use_yn` | Widget | ✅ | 위젯 배치 목록 |
| Widget | `dp_widget` | `use_yn` | -      | ✅ | widget_type_cd 별 속성 |

---

### 2-B. 위젯 데이터 소스 — `widget_type_cd`(기준) × 연결 대상
주요 위젯 유형의 데이터 소스와 연결 도메인 테이블을 정리.
상품·쿠폰·이벤트 연결 위젯은 해당 도메인 마스터 ID를 widget_config_json 속성으로 참조.

| `widget_type_cd` | 데이터 소스 | 연결 대상 |
|:---|:---|:---|
| image_banner   | 이미지 URL + 링크      | 이벤트·기획전·외부 |
| product_slider | 상품 ID 목록           | `pd_prod` |
| product        | 상품 ID 목록           | `pd_prod` |
| cond_product   | 조건(카테고리·태그)     | `pd_prod` 자동 |
| coupon         | 쿠폰 ID                | `pm_coupon` |
| event_banner   | 이벤트 ID              | `pm_event` |
| cache_banner   | 캐시 프로모션 ID        | `pm_cache` |
| countdown      | 이벤트 종료일시         | - |
| popup          | 팝업 HTML·이미지        | - |

---

## 변경이력

- 2026-04-18: 초기 작성
- 2026-04-18: 헤딩 형식 변경 (타이틀 좌측·컬럼명 우측) + 설명 추가
