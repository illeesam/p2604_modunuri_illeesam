# 614. 전시 Panel 정책

## 1. 목적

전시 Panel(dp_panel)은 콘텐츠 묶음 단위로, 하나 이상의 위젯 인스턴스(dp_panel_item)를 포함한다.
패널은 Area에 연결되어 실제 화면에 렌더링되며, `disp_panel_status_cd`로 전체 ON/OFF가 가능하다.
패널 내 각 위젯 인스턴스(Panel Item)는 개별 노출 기간·대상·환경을 독립적으로 제어한다.

---

## 2. 범위

| 역할 | 관계 |
|---|---|
| 관리자 | 패널 등록·수정·삭제, 위젯 배치(item_sort_ord), 노출 상태 제어 |
| 배치 | `dp_panel_item.disp_start/end_date/time` 기준 `disp_yn` 자동 Y/N 전환 |
| 프런트 | Area에서 Panel 목록 조회 → Panel 내 Panel Item 순서대로 위젯 렌더링 |

---

## 3. 관련 테이블

| 테이블 | 역할 |
|---|---|
| `dp_panel` | 콘텐츠 묶음 단위 정의 |
| `dp_panel_item` | 패널 안의 위젯 인스턴스 목록 |
| `dp_area` | 상위 Area (dp_panel.area_id FK) |
| `dp_widget_lib` | 위젯 라이브러리 참조 (dp_panel_item.widget_lib_id FK, 선택) |

---

## 4. 주요 컬럼 — dp_panel

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `panel_id` | VARCHAR(16) | PK. YYMMDDhhmmss+rand4 |
| `area_id` | VARCHAR(16) | FK: dp_area.area_id (기본 소속 Area) |
| `site_id` | VARCHAR(16) | 사이트 격리 |
| `panel_nm` | VARCHAR(100) | 패널 명칭 |
| `panel_type_cd` | VARCHAR(30) | 표시 유형 코드 (DISP_TYPE) |
| `disp_path` | VARCHAR(200) | 점(.) 구분 표시 경로 |
| `visibility_targets` | VARCHAR(200) | 패널 레벨 노출 대상 (`^PUBLIC^MEMBER^VIP^`) |
| `use_yn` | CHAR(1) | 관리자 사용여부 토글 (Y/N) |
| `use_start_date` | DATE | 패널 자체 유효기간 시작일 |
| `use_end_date` | DATE | 패널 자체 유효기간 종료일 |
| `disp_panel_status_cd` | VARCHAR(20) | 패널 상태 코드 (DISP_STATUS: ACTIVE/INACTIVE) |
| `disp_panel_status_cd_before` | VARCHAR(20) | 변경 전 패널 상태 (이력 추적용) |
| `content_json` | TEXT | 패널의 콘텐츠 데이터 전체 (JSON) |

---

## 5. disp_panel_status_cd (DISP_STATUS)

| 코드 | 의미 | 전환 조건 |
|---|---|---|
| `ACTIVE` | 패널 전체 활성 — 정상 렌더링 | 관리자 수동 또는 배치 |
| `INACTIVE` | 패널 전체 비활성 — 렌더링 제외 | 관리자 수동 또는 배치 |

상태 변경 시 `disp_panel_status_cd_before`에 이전 값을 저장하여 이력 추적.

---

## 6. 주요 컬럼 — dp_panel_item

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `panel_item_id` | VARCHAR(16) | PK. YYMMDDhhmmss+rand4 |
| `panel_id` | VARCHAR(16) | FK: dp_panel.panel_id |
| `widget_lib_id` | VARCHAR(16) | FK: dp_widget_lib.widget_lib_id (NULL 허용) |
| `widget_type_cd` | VARCHAR(30) | 위젯 유형 코드 (WIDGET_TYPE) |
| `widget_title` | VARCHAR(200) | 위젯 타이틀 텍스트 |
| `widget_content` | TEXT | 위젯 내용 (HTML 에디터 직접 입력) |
| `title_show_yn` | CHAR(1) | 타이틀 화면 표시 여부 (Y/N) |
| `widget_lib_ref_yn` | CHAR(1) | 라이브러리 참조 여부 (Y: 참조, N: 직접 생성) |
| `content_type_cd` | VARCHAR(30) | 콘텐츠 유형 (WIDGET/HTML/TEXT/IMAGE) |
| `item_sort_ord` | INTEGER | 패널 내 위젯 노출 순서 (오름차순) |
| `widget_config_json` | TEXT | 위젯별 설정 JSON |
| `visibility_targets` | VARCHAR(200) | 아이템 레벨 노출 대상 |
| `disp_yn` | CHAR(1) | 배치 자동 관리 전시여부 (Y/N) |
| `disp_start_date` | DATE | 위젯 전시 시작일 |
| `disp_start_time` | TIME | 위젯 전시 시작시간 |
| `disp_end_date` | DATE | 위젯 전시 종료일 |
| `disp_end_time` | TIME | 위젯 전시 종료시간 |
| `disp_env` | VARCHAR(50) | 전시 환경 (`^PROD^`, `^DEV^`, `^TEST^` 조합) |
| `use_yn` | CHAR(1) | 관리자 사용여부 토글 (Y/N) |

---

## 7. 위젯 참조 방식 비교

| 구분 | widget_lib_ref_yn = Y | widget_lib_ref_yn = N |
|---|---|---|
| 데이터 소스 | dp_widget_lib 템플릿 참조 | widget_config_json / widget_content 직접 입력 |
| 재사용 | 여러 패널에서 동일 위젯 공유 | 해당 패널 전용 |
| 수정 반영 | 라이브러리 수정 시 전체 즉시 반영 | 개별 수정 필요 |
| 적합한 경우 | 공통 상품 슬라이더, 표준 배너 | 1회성 이벤트 전용 콘텐츠 |

---

## 8. 노출 조건 계층 우선순위

패널 레벨과 아이템 레벨 모두 통과해야 실제 렌더링:

```
dp_panel.use_yn = 'Y'
  AND dp_panel.disp_panel_status_cd = 'ACTIVE'
  AND dp_panel_item.use_yn = 'Y'
  AND dp_panel_item.disp_yn = 'Y'
  AND dp_panel_item.disp_env LIKE '%^PROD^%'
  AND dp_panel_item.visibility_targets LIKE '%^사용자등급^%'
```

---

## 9. 활용 예시

### 예시 1. 봄 기획전 배너 패널 — image_banner 3개 순서 배치
```
panel_nm = '2026 봄 기획전 배너 패널'
disp_panel_status_cd = 'ACTIVE'
visibility_targets = '^PUBLIC^'

dp_panel_item:
  item_sort_ord=1, widget_type_cd='image_banner', widget_title='봄 신상 배너 1'
    widget_config_json = {"img_url": "/img/spring1.jpg", "link": "/event/spring", "alt": "봄 신상 도착"}
  item_sort_ord=2, widget_type_cd='image_banner', widget_title='봄 신상 배너 2'
    widget_config_json = {"img_url": "/img/spring2.jpg", "link": "/prod/list?tag=spring"}
  item_sort_ord=3, widget_type_cd='image_banner', widget_title='무료배송 안내 배너'
    widget_config_json = {"img_url": "/img/free_ship.jpg", "link": "/faq"}
```

### 예시 2. VIP 쿠폰 패널 — VIP 전용 노출
```
panel_nm = 'VIP 전용 쿠폰 다운로드'
disp_panel_status_cd = 'ACTIVE'
visibility_targets = '^VIP^'

dp_panel_item:
  widget_type_cd = 'coupon'
  widget_config_json = {"coupon_id": "COUPON_VIP_2604", "btn_label": "VIP 특별 쿠폰 받기"}
  visibility_targets = '^VIP^'
```

### 예시 3. 개발 전용 패널 — 운영 환경 미노출
```
panel_nm = '[DEV] 테스트 HTML 패널'
disp_panel_status_cd = 'ACTIVE'

dp_panel_item:
  widget_type_cd = 'html_editor'
  disp_env = '^DEV^TEST^'
  widget_content = '<div style="background:yellow">개발 테스트 콘텐츠</div>'
```
`^PROD^` 없으므로 운영 환경 프런트에서 자동 필터링.

### 예시 4. 카운트다운 위젯 — 행사 종료 시 자동 숨김
```
widget_type_cd = 'countdown'
widget_config_json = {
  "target_datetime": "2026-04-30T23:59:59",
  "label": "봄 행사 종료까지",
  "finished_msg": "행사가 종료되었습니다."
}
disp_end_date = 2026-04-30
disp_end_time = 23:59:59
```
배치가 종료 시각에 `disp_yn = 'N'`으로 전환하여 카운트다운 위젯 자동 숨김.

### 예시 5. 패널 상태 이력 추적
```sql
-- ACTIVE → INACTIVE 전환
UPDATE dp_panel
SET disp_panel_status_cd_before = disp_panel_status_cd,
    disp_panel_status_cd = 'INACTIVE',
    upd_by = '관리자ID',
    upd_date = NOW()
WHERE panel_id = 'TARGET_PANEL_ID';
```

### 예시 6. 이벤트 배너 + 공지 배너 혼합 패널
```
panel_nm = '메인 복합 콘텐츠 패널'

dp_panel_item:
  item_sort_ord=1, widget_type_cd='event_banner'
    widget_config_json = {"event_id": "EVT_2604_SPRING"}
    disp_start_date=2026-04-01, disp_end_date=2026-04-30

  item_sort_ord=2, widget_type_cd='text_banner'
    widget_config_json = {"text": "무료배송 이벤트 진행 중!", "bg_color": "#fff0f4"}
    disp_start_date=2026-04-01, disp_end_date=2026-04-15
```
4월 16일부터는 text_banner만 숨겨지고 event_banner는 4월 말까지 유지.

---

## 10. 제약사항

1. `dp_panel` 삭제 시 `dp_panel_item` 전체 선 삭제 필요 (FK 제약)
2. `disp_panel_status_cd = 'INACTIVE'`이면 하위 Panel Item 조건과 무관하게 전체 미렌더링
3. `item_sort_ord` 중복 시 `panel_item_id` 오름차순으로 보조 정렬
4. `widget_lib_ref_yn = 'Y'`이면 `widget_lib_id`는 NOT NULL — 참조 없는 라이브러리 참조 불가
5. `disp_end_date/time` 미설정(NULL)이면 상시 노출로 처리
6. `panel_type_cd`는 공통코드 `DISP_TYPE` 기준 — 임의 문자열 입력 금지
7. `content_json`은 패널 전체 레이아웃/설정 JSON으로, 관리자 에디터에서만 생성·수정

---

## 11. 변경이력

- 2026-04-18: 초기 작성
