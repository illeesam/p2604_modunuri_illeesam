<style>
table { width: 100%; border-collapse: collapse; }
th, td { word-break: keep-all; overflow-wrap: break-word; white-space: normal; vertical-align: top; }
</style>

# cm.02. 대시보드 용어 · 화면 구성

대시보드 도메인에서 같은 것을 **패널 / 위젯 / 아이템** 세 가지로 부르고 있어(각 80·106·31회)
읽는 사람마다 다르게 이해했다. 2026-07-27 **항목** 하나로 통일했다.

---

## 1. 용어 기준

| 용어 | 가리키는 것 | 근거 |
|---|---|---|
| **대시보드** | `cm_dashboard` 한 건 | — |
| **항목** | `cm_dashboard_item` 한 건 — 대시보드에 놓이는 단위(차트/KPI 카드) | 테이블·엔티티·컬럼이 전부 `item` (`item_key` `item_nm` `dashboardItemId`) |
| **캔버스** | 사용자 대시보드에서 항목을 끌어 배치하는 편집 영역 | 편집 UI 고유 개념 — 항목과 층위가 다르다 |
| **기준** | 대시보드 정의 자체(이름·UI컴포넌트·열수·소유자) | 메뉴 `대시보드 기준관리` |

### ⛔ 쓰지 않는 말

**패널 · 위젯 · 아이템** — 전부 **항목**으로 쓴다.

> **예외**: `패널`이 *일반 UI 패널*(인라인 상세 패널, 설정 패널)을 뜻하는 자리는 그대로 둔다.
> 대시보드 항목과 무관한 레이아웃 용어다. 대시보드 외 화면(`CmBlogMng`, `CmChattMng` 등)의
> "패널"도 이쪽이라 건드리지 않았다.

### 코드 식별자는 바꾸지 않았다

`panelForm` `panelWidth` `buildWidget` `cmDashWidgetUtil` `simState.widgets` 등 JS 식별자와
DB 컬럼(`panel_width` `panel_height`)은 유지한다. 한글 표기만 통일했으므로 식별자는 영향이 없고,
컬럼명을 바꾸면 마이그레이션 비용만 크고 얻는 게 없다.

---

## 2. 화면 구성

| 메뉴 | 화면 | 다루는 것 |
|---|---|---|
| 대시보드 기준관리 | `CmDashboardMng` | 대시보드 정의 CRUD (이름·UI컴포넌트·열수·소유자). 항목수는 참고 표시만 |
| 대시보드 항목관리 | `CmDashboardItemMng` | 좌: 대시보드 선택 / 우: 항목 목록 + 인라인 폼 |
| 대시보드 항목배치 | `CmDashboardLayoutMng` | 항목 카드 드래그 배치, 폭·높이 조정, 실데이터 시뮬레이션 |
| 사용자 대시보드 관리 | `CmDashboardMyMng` | 개인 대시보드 생성·공유설정 + 캔버스 편집(항목 카탈로그 → 캔버스) |
| 사용자 대시보드 메뉴관리 | `CmDashboardMenuMng` | 좌측메뉴 `사용자 대시보드` 그룹 트리 구성 (폴더 + 대시보드) |

좌측메뉴 그룹은 `대시보드` / `대시보드 관리` / `사용자 대시보드` 세 개다.
하위 메뉴가 `사용자 대시보드 …` 이므로 그룹명도 띄어쓰기를 맞춘다.

---

## 3. 사용자 대시보드의 보기/관리 모드

같은 화면(`CmDashboardMyMng`)이 진입 경로에 따라 다르게 동작한다.

| 진입 | `dtlId` | 모드 | 보이는 것 |
|---|---|---|---|
| 메뉴 `사용자 대시보드 관리` | 없음 | **관리** | 탭바·칩목록·이름공유설정·항목 카탈로그·배치저장·삭제 |
| 좌측메뉴의 대시보드 클릭 | 있음 | **보기** | 대시보드명(페이지 제목) + 캔버스만 |

```js
const cfViewMode = computed(() => !!props.dtlId);
const cfCanEdit  = computed(() => cfIsMine.value && !cfViewMode.value);
```

편집 UI는 전부 `cfCanEdit` 로 게이트한다 — 공유받은 대시보드(`cfIsMine=false`)와
보기 모드 양쪽을 한 조건으로 막는다.

---

## 4. 항목 복사 시 `item_key`

`cm_dashboard_item` 에 `(dashboard_id, item_key)` 유니크 제약이 있다. 카탈로그에서 같은 항목을
두 번 담거나, 이름이 같고 출처만 다른 항목을 담으면 충돌한다.

→ 복사 시 그 대시보드 안에서 겹치지 않는 키를 만든다 (`COMP0101` → `COMP0101_2` → `_3`).

키를 바꿔도 안전한 이유: 사용자 대시보드의 데이터 조회는 `item_key` 가 아니라
`optionJson._srcItemId` 로 원본 항목을 가리킨다.
