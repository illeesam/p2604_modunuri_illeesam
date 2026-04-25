# 613. 전시 Area 정책

## 1. 목적

전시 Area(dp_area)는 UI 내의 구역(Zone) 단위를 정의한다.
Area는 `area_cd`로 프런트 렌더링 위치를 결정하며, 여러 Panel을 순서대로 포함한다.
Area ↔ Panel 간 다대다 관계는 `dp_area_panel` 매핑 테이블이 담당하며,
Panel별 노출 조건(대상·기간·환경)을 Area 연결 단위에서 독립 제어한다.

---

## 2. 범위

| 역할 | 관계 |
|---|---|
| 관리자 | Area 등록·수정, Panel 매핑, 노출 기간·대상 설정 |
| 배치 | `dp_area_panel.disp_start/end_date/time` 기준 `disp_yn` 자동 Y/N 전환 |
| 프런트 | `area_cd`로 렌더링 위치 결정 → 해당 Area의 Panel 목록 조회 후 순서대로 렌더링 |

---

## 3. 관련 테이블

| 테이블 | 역할 |
|---|---|
| `dp_area` | 구역 단위 정의 (MAIN_TOP, MAIN_BANNER, SIDEBAR_MID 등) |
| `dp_area_panel` | Area ↔ Panel 매핑, Panel별 노출 조건 제어 |
| `dp_ui` | 상위 UI (dp_area.ui_id FK) |
| `dp_panel` | 하위 패널 (dp_area_panel.panel_id FK) |

---

## 4. 주요 컬럼 — dp_area

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `area_id` | VARCHAR(16) | PK. YYMMDDhhmmss+rand4 |
| `ui_id` | VARCHAR(16) | FK: dp_ui.ui_id (기본 소속 UI) |
| `site_id` | VARCHAR(16) | 사이트 격리 (sy_site.site_id) |
| `area_cd` | VARCHAR(50) | 영역 코드. site_id + area_cd UNIQUE |
| `area_nm` | VARCHAR(100) | 영역 명칭 |
| `area_type_cd` | VARCHAR(30) | 레이아웃 유형 코드 (DISP_AREA_TYPE: FULL/SIDEBAR/POPUP/FLOATING 등) |
| `area_desc` | VARCHAR(300) | 영역 설명 |
| `disp_path` | VARCHAR(200) | 점(.) 구분 표시 경로 (예: `FRONT.모바일메인`, `ADMIN.대시보드`) |
| `use_yn` | CHAR(1) | 관리자 사용여부 토글 (Y/N) |
| `use_start_date` | DATE | Area 자체 유효기간 시작일 |
| `use_end_date` | DATE | Area 자체 유효기간 종료일 |

---

## 5. 주요 컬럼 — dp_area_panel

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `area_panel_id` | VARCHAR(16) | PK. YYMMDDhhmmss+rand4 |
| `area_id` | VARCHAR(16) | FK: dp_area.area_id |
| `panel_id` | VARCHAR(16) | FK: dp_panel.panel_id |
| `panel_sort_ord` | INTEGER | 동일 Area 내 패널 노출 순서 (오름차순) |
| `visibility_targets` | VARCHAR(200) | 노출 대상 (`^PUBLIC^MEMBER^VIP^` 캐럿 인코딩) |
| `disp_yn` | CHAR(1) | 배치 자동 관리 전시여부 (Y/N) |
| `disp_start_date` | DATE | 패널 전시 시작일 |
| `disp_start_time` | TIME | 패널 전시 시작시간 |
| `disp_end_date` | DATE | 패널 전시 종료일 |
| `disp_end_time` | TIME | 패널 전시 종료시간 |
| `disp_env` | VARCHAR(50) | 전시 환경 (`^PROD^`, `^DEV^`, `^TEST^` 조합) |
| `use_yn` | CHAR(1) | 관리자 사용여부 토글 (Y/N) |

> UNIQUE 제약: `(area_id, panel_id)` — 동일 Area에 동일 Panel은 1회만 매핑

---

## 6. area_type_cd 유형 (DISP_AREA_TYPE)

| 코드 | 설명 | 예시 Area |
|---|---|---|
| `FULL` | 전체 너비 레이아웃 | 메인 배너, 상품 슬라이더 |
| `SIDEBAR` | 사이드바 위치 고정 | 사이드 추천 상품, 광고 |
| `POPUP` | 레이어 팝업으로 표시 | 이벤트 팝업, 공지 팝업 |
| `FLOATING` | 화면 고정 플로팅 버튼 | 채팅 버튼, TOP 버튼 |
| `GRID` | 그리드 레이아웃 | 카테고리 상품 격자 |

---

## 7. disp_path 표기 규칙

점(.)으로 계층을 구분하는 표시 경로. 관리자 UI에서 위치를 직관적으로 식별하기 위해 사용.

```
FRONT.모바일메인.상단배너    → 모바일 메인 화면의 상단 배너 구역
FRONT.PC메인.중단           → PC 메인 화면의 중단 구역
ADMIN.대시보드              → 관리자 대시보드 구역
FRONT.이벤트페이지.팝업     → 이벤트 페이지의 팝업 구역
```

---

## 8. 활용 예시

### 예시 1. 모바일 메인 — 배너·상품 Area 순서 배치
```
Area: MAIN_BANNER  (area_type_cd=FULL, disp_path=FRONT.모바일메인.배너)
Area: MAIN_PRODUCT (area_type_cd=FULL, disp_path=FRONT.모바일메인.상품)
Area: SIDEBAR_AD   (area_type_cd=SIDEBAR, disp_path=FRONT.모바일메인.사이드광고)

dp_ui_area.area_sort_ord:
  MAIN_BANNER  → 1
  MAIN_PRODUCT → 2
  SIDEBAR_AD   → 3
```

### 예시 2. MAIN_BANNER Area에 행사별 패널 연결
```sql
-- 봄 행사 배너 패널 (area_sort_ord 1번, 4/1~4/30)
INSERT INTO dp_area_panel VALUES (
    '2604010001000001', 'MAIN_BANNER_area_id', '봄행사배너_panel_id',
    1, '^PUBLIC^', 'Y', '2026-04-01', '00:00:00', '2026-04-30', '23:59:59',
    '^PROD^', 'Y', ...
);

-- 신상품 패널 (area_sort_ord 2번, 상시)
INSERT INTO dp_area_panel VALUES (
    '2604010001000002', 'MAIN_BANNER_area_id', '신상품_panel_id',
    2, '^PUBLIC^MEMBER^', 'Y', NULL, NULL, NULL, NULL,
    '^PROD^', 'Y', ...
);
```
행사 기간 동안 봄 행사 배너가 먼저(1번), 신상품 패널이 두 번째(2번)로 렌더링된다.

### 예시 3. POPUP Area — 1주일 행사 팝업 자동 노출/숨김
```
area_cd          = 'POPUP_SPRING_EVENT'
area_type_cd     = 'POPUP'

dp_area_panel:
  disp_start_date = 2026-04-01
  disp_start_time = 00:00:00
  disp_end_date   = 2026-04-07
  disp_end_time   = 23:59:59
  disp_yn         = 'Y'  ← 배치 자동 관리
```
4월 8일 00:00에 배치가 `disp_yn = 'N'`으로 전환하여 팝업 자동 종료.

### 예시 4. SIDEBAR_MID Area — 비회원 미노출
```
dp_area_panel.visibility_targets = '^MEMBER^VIP^'
```
로그인하지 않은 사용자는 `^PUBLIC^` 포함 여부 검사에서 제외되어 해당 사이드바를 받지 못한다.

### 예시 5. 개발 환경 전용 Area 패널 연결
```
dp_area_panel.disp_env = '^DEV^TEST^'
```
운영 환경 프런트에서는 `LIKE '%^PROD^%'` 조건 불일치로 해당 패널을 받지 못한다.

### 예시 6. area_cd 코드 표준 예시
```
MOBILE_MAIN_TOP      모바일 메인 최상단 (풀배너)
MOBILE_MAIN_MID      모바일 메인 중단 (상품 슬라이더)
MOBILE_MAIN_BOTTOM   모바일 메인 하단 (이벤트 배너)
PC_MAIN_HERO         PC 메인 히어로 배너
PC_SIDEBAR_RIGHT     PC 우측 사이드바
POPUP_NOTICE         공지 팝업
POPUP_EVENT          이벤트 팝업
FLOAT_CHAT           플로팅 채팅 버튼
```

---

## 9. 제약사항

1. `(site_id, area_cd)` UNIQUE — 사이트별 Area 코드 중복 불가
2. `(area_id, panel_id)` UNIQUE — 동일 Area에 동일 Panel 중복 매핑 불가
3. Area 삭제 시 `dp_area_panel` 매핑 레코드 선 삭제 필요 (FK 제약)
4. `panel_sort_ord`가 동일한 경우 `area_panel_id` 오름차순으로 보조 정렬
5. `use_yn = 'N'`이면 배치 `disp_yn` 갱신 대상에서 제외
6. `disp_end_date/time` 미설정(NULL)이면 만료 없는 상시 노출로 처리
7. `area_type_cd`는 공통코드 `DISP_AREA_TYPE` 기준 — 임의 문자열 입력 금지

---

## 10. 변경이력

- 2026-04-18: 초기 작성
