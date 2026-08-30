# 612. 전시 UI 정책

## 1. 목적

전시 UI(dp_ui)는 사용자에게 노출되는 최상위 화면 단위를 정의한다.
하나의 UI는 기기 유형(PC/모바일/태블릿)별로 분리 등록되며, 여러 Area를 순서대로 포함한다.
UI ↔ Area 간 다대다 관계는 `dp_ui_area` 매핑 테이블이 담당하며, Area별 노출 조건(대상·기간·환경)을 독립적으로 제어한다.

---

## 2. 범위

| 역할 | 관계 |
|---|---|
| 관리자 | UI 등록·수정·삭제, Area 매핑, 노출 기간 설정 |
| 배치 | `disp_start_date/time` ~ `disp_end_date/time` 기준으로 `dp_ui_area.disp_yn` 자동 Y/N 전환 |
| 프런트 | `ui_cd`로 UI 식별 → 해당 UI의 Area 목록 조회 후 렌더링 |

---

## 3. 관련 테이블

| 테이블 | 역할 |
|---|---|
| `dp_ui` | 화면 단위 정의 (MOBILE_MAIN, PC_MAIN 등) |
| `dp_ui_area` | UI ↔ Area 매핑, Area별 노출 조건 제어 |
| `dp_area` | Area 상세 정의 (dp_ui 참조) |

---

## 4. 주요 컬럼 — dp_ui

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `ui_id` | VARCHAR(16) | PK. YYMMDDhhmmss+rand4 |
| `site_id` | VARCHAR(16) | 사이트 격리 (sy_site.site_id) |
| `ui_cd` | VARCHAR(50) | UI 코드. site_id + ui_cd UNIQUE |
| `ui_nm` | VARCHAR(100) | UI 명칭 |
| `device_type_cd` | VARCHAR(30) | 디바이스 유형 코드 (DEVICE_TYPE: MOBILE/PC/TABLET) |
| `ui_path` | VARCHAR(200) | 페이지 경로 (예: `/index`, `/event/2026-spring`) |
| `sort_ord` | INTEGER | 목록 정렬 순서 |
| `use_yn` | CHAR(1) | 관리자 사용여부 토글 (Y/N) |
| `use_start_date` | DATE | UI 자체 유효기간 시작일 |
| `use_end_date` | DATE | UI 자체 유효기간 종료일 |

---

## 5. 주요 컬럼 — dp_ui_area

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `ui_area_id` | VARCHAR(16) | PK. YYMMDDhhmmss+rand4 |
| `ui_id` | VARCHAR(16) | FK: dp_ui.ui_id |
| `area_id` | VARCHAR(16) | FK: dp_area.area_id |
| `area_sort_ord` | INTEGER | 해당 UI 내 Area 노출 순서 |
| `visibility_targets` | VARCHAR(200) | 노출 대상 (`^PUBLIC^MEMBER^VIP^` 캐럿 인코딩) |
| `disp_env` | VARCHAR(50) | 전시 환경 (`^PROD^`, `^DEV^`, `^TEST^` 조합) |
| `disp_yn` | CHAR(1) | 배치 자동 관리 전시여부 (Y/N) |
| `disp_start_date` | DATE | Area 전시 시작일 |
| `disp_start_time` | TIME | Area 전시 시작시간 |
| `disp_end_date` | DATE | Area 전시 종료일 |
| `disp_end_time` | TIME | Area 전시 종료시간 |
| `use_yn` | CHAR(1) | 관리자 사용여부 토글 (Y/N) |

> UNIQUE 제약: `(ui_id, area_id)` — 동일 UI에 동일 Area는 1회만 매핑

---

## 6. use_yn vs disp_yn 구분

| 컬럼 | 관리 주체 | 의미 |
|---|---|---|
| `use_yn` | 관리자 수동 | 해당 매핑 자체를 켜고 끔. N이면 배치 대상에서 제외 |
| `disp_yn` | 배치 자동 | `disp_start` ≤ 현재 ≤ `disp_end` 조건으로 자동 Y/N 전환 |

프런트 렌더링 조건: `use_yn = 'Y' AND disp_yn = 'Y' AND disp_env LIKE '%^PROD^%'`

---

## 7. visibility_targets 인코딩 규칙

```
^PUBLIC^              → 비회원 포함 전체 공개
^PUBLIC^MEMBER^       → 비회원 + 일반 회원
^MEMBER^VIP^          → 일반 회원 + VIP 전용 (비회원 미노출)
^VIP^                 → VIP 단독 노출
```

프런트에서 현재 사용자 등급 코드가 해당 문자열에 포함(`LIKE '%^VIP^%'`)되면 노출한다.

---

## 8. 활용 예시

### 예시 1. 기기별 메인 UI 분리 등록
```
ui_cd = 'MOBILE_MAIN', device_type_cd = 'MOBILE', ui_path = '/index'
ui_cd = 'PC_MAIN',     device_type_cd = 'PC',     ui_path = '/index'
ui_cd = 'TABLET_MAIN', device_type_cd = 'TABLET', ui_path = '/index'
```
프런트는 User-Agent 기반으로 `device_type_cd`를 선택해 해당 UI를 로드한다.

### 예시 2. 2026 봄 기획전 임시 UI 한시 운영
```
ui_cd          = 'EVENT_2026_SPRING'
ui_nm          = '2026 봄 기획전'
ui_path        = '/event/2026-spring'
device_type_cd = 'MOBILE'
use_start_date = 2026-04-01
use_end_date   = 2026-04-30
use_yn         = 'Y'
```
4월 1일 이전·이후에는 `use_yn = 'N'`으로 관리자 수동 전환하거나, `use_start_date/end_date` 기준 배치 처리.

### 예시 3. VIP 전용 Area를 모바일 메인 UI에 연결
```sql
-- dp_ui_area 매핑 예시
INSERT INTO dp_ui_area (ui_area_id, ui_id, area_id, area_sort_ord,
    visibility_targets, disp_env, disp_yn, use_yn)
VALUES ('2604010001000001',
    '모바일메인_ui_id', 'VIP전용영역_area_id',
    10,
    '^VIP^',
    '^PROD^',
    'Y', 'Y');
```
비회원·일반 회원은 해당 Area를 받지 못하고, VIP 사용자에게만 렌더링된다.

### 예시 4. 크리스마스 팝업 UI — 24일 22시 오픈, 25일 23:59 종료
```
ui_cd            = 'POPUP_XMAS_2026'
dp_ui_area.disp_start_date = 2026-12-24
dp_ui_area.disp_start_time = 22:00:00
dp_ui_area.disp_end_date   = 2026-12-25
dp_ui_area.disp_end_time   = 23:59:59
```
배치가 매 분 `disp_yn`을 체크해 시작/종료 시각에 자동 Y/N 전환한다.

### 예시 5. 개발 전용 UI (운영 환경 미노출)
```
disp_env = '^DEV^TEST^'
```
운영(PROD) 환경 프런트에서는 `LIKE '%^PROD^%'` 조건 불일치로 자동 제외된다.

---

## 9. 제약사항

1. `(site_id, ui_cd)` UNIQUE — 사이트별 UI 코드 중복 불가
2. `(ui_id, area_id)` UNIQUE — 동일 UI에 동일 Area 중복 매핑 불가
3. `use_yn = 'N'`이면 배치도 무시 — `disp_yn` 변경 없음
4. UI 삭제 시 `dp_ui_area` 매핑 레코드 선 삭제 필요 (FK 제약)
5. `device_type_cd`는 공통코드 `DEVICE_TYPE` 기준 — 임의 문자열 입력 금지
6. `disp_env` 미설정 시 기본값 `^PROD^` 적용 — 운영 환경 기본 노출

---

## 10. 변경이력

- 2026-04-18: 초기 작성
