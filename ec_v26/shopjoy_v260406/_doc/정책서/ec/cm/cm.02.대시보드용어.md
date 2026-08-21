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
| **항목** | `cm_dashboard_item` 한 건 — 대시보드에 놓이는 단위(KPI/차트/목록) | 테이블·엔티티·컬럼이 전부 `item` (`item_key` `item_nm` `dashboardItemId`) |
| **캔버스** | 사용자 대시보드에서 항목을 끌어 배치하는 편집 영역 | 편집 UI 고유 개념 — 항목과 층위가 다르다 |
| **기준** | 대시보드 정의 자체(이름·UI컴포넌트·열수·소유자) | 메뉴 `대시보드 관리` |

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
| 대시보드 관리 | `CmDashboardMng` | 대시보드 정의 CRUD (이름·UI컴포넌트·열수·소유자). 항목수는 참고 표시만 |
| 대시보드 항목관리 | `CmDashboardItemMng` | 좌: 대시보드 선택 / 우: 항목 목록 + 인라인 폼 |
| 대시보드 항목배치 | `CmDashboardLayoutMng` | 항목 카드 드래그 배치, 폭·높이 조정, 실데이터 시뮬레이션 |
| 대시보드 메뉴관리 | `CmDashboardSysMenuMng` | 좌측메뉴 `대시보드` 그룹 트리 구성 — **사이트 공통** |
| 사용자 대시보드 관리 | `CmDashboardMyMng` | 개인 대시보드 생성·공유설정 + 캔버스 편집(항목 카탈로그 → 캔버스) |
| 사용자 대시보드 메뉴관리 | `CmDashboardMenuMng` | 좌측메뉴 `사용자 대시보드` 그룹 트리 구성 (폴더 + 대시보드) |

### 좌측메뉴 순서

```
대시보드            (동적) 📁폴더 · 📊공용 대시보드          ← SYS 트리
사용자 대시보드      (동적) 📁폴더 · 👤내 것 · 🔗공유받은 것   ← USER 트리
대시보드 관리        기준관리 / 항목관리 / 항목배치 / 메뉴관리 /
                    사용자 대시보드 관리 / 사용자 대시보드 메뉴관리
```

평소 쓰는 것(대시보드 자체)이 위, 설정하는 것(관리)이 아래다.

`홈` 상위메뉴는 **그룹 헤더도 항목도 전부 동적**이라 `LEFT_MENUS.home` 은 빈 배열이다
([lib/app/boAppBase.js](../../../../lib/app/boAppBase.js)). 동적 항목 *아래에* 와야 하는
`대시보드 관리` 그룹은 **`LEFT_MENUS_TAIL`** 이라는 별도 배열에 둔다 — 정적 배열은 항상
동적 항목보다 먼저 렌더되므로 같은 배열에 두면 순서를 맞출 수 없다.

페이지↔상위메뉴 인덱스(`PAGE_TO_TOP` / `PAGE_LABELS` / `ALL_PAGES`)는 셋을 합친
`LEFT_MENUS_ALL`(head + tail + `HOME_FALLBACK_DASH`)로 만든다 — 렌더 순서만 나뉜 것이지
메뉴는 하나이므로, 하나라도 빠뜨리면 F5 후 URL 복원과 즐겨찾기가 깨진다.

### 두 메뉴 트리 (`cm_dashboard_menu`)

노드 구조(폴더/아이템·부모·순서)와 저장 방식(해당 범위 전체 삭제 후 재삽입)이 완전히 같고
다른 것은 "누구의 트리인가" 하나뿐이라 **한 테이블에 `menu_scope_cd` 로 구분**한다.

| `menu_scope_cd` | 좌측 그룹 | `owner_user_id` | 담는 대시보드 | 관리 화면 |
|---|---|---|---|---|
| `SYS` | 대시보드 | NULL — 사이트 공통, 전원 동일 | 공용 | 대시보드 메뉴관리 |
| `USER` | 사용자 대시보드 | 세션 사용자 고정 | 개인(내 것 + 공유받은 것) | 사용자 대시보드 메뉴관리 |

화면도 `CmDashboardMenuMng` **하나**를 `scope` prop 으로 겸한다. `CmDashboardSysMenuMng` 는
`scope="SYS"` 만 넘기는 20줄짜리 래퍼다 — 드래그·폴더·저장 로직이 200줄 넘게 같아서
복사하면 한쪽만 고쳤을 때 반드시 어긋난다.

**폴백**: 트리가 비어 있으면(한 번도 설정 안 함) 기존과 똑같이 동작한다.
`SYS` 는 `HOME_FALLBACK_DASH`(EC대시보드 / App모니터대시보드), `USER` 는 볼 수 있는 개인 대시보드 전체.

**공용/개인 판정**은 `CmDashboardMng.fnIsMyDash` 와 같은 규약을 쓴다 —
`ownerUserId` 가 있거나 `uiCompNm` 이 `MY:` 로 시작하면 개인화. 한쪽만 다르게 보면
같은 대시보드가 두 화면에서 다른 유형으로 잡힌다(실제로 `ownerUserId` 가 비어 있는데
`uiCompNm` 이 `MY:…` 인 데이터가 있다).

**SYS 아이템 클릭 시 열 화면**은 `uiCompNm` 으로 정한다.

```js
const fnSysDashPageId = (uiCompNm) => {
  if (uiCompNm === 'DashboardBoAppMonitor') return 'appMonitorDashboard';
  /* EC대시보드는 사이트별 변형(Ec01/02/03) 이 pageId 하나로 묶여 있다 */
  if (uiCompNm === 'DashboardBoEc' + (window.BO_SITE_NO || '01')) return 'dashboard';
  return null;   /* 전용 화면 없음 → 대시보드 뷰어로 캔버스를 그린다 */
};
```

전용 화면이 없는 공용 대시보드는 `cmDashboardMyMng` 가 뷰어 역할을 한다
(`ownerUserId` 가 없어 `cfIsMine=false` → 보기 전용). 그래서 `CmDashboardMyMng` 의 목록 필터는
**`dtlId` 로 지정된 한 건에 한해** 공용 대시보드를 통과시킨다. 이 경로 덕분에
`일별 운영 현황` · `실시간 모니터링` 처럼 지금까지 메뉴로 갈 수 없던 공용 대시보드가 열린다.

---

## 3. 사용자 대시보드 공유대상

| 컬럼 | 대상 | 선택 팝업 |
|---|---|---|
| `share_user_ids` | 사용자 | `user` |
| `share_dept_id` | 부서 | `dept` |
| `share_vendor_ids` | 업체 | `vendor` |

셋 다 `^ID1^ID2^` 멀티값이고 판정은 **OR** — 하나라도 맞으면 보인다
(`BoCmDashboardController.isVisibleTo()`). 소유자는 공유대상과 무관하게 항상 볼 수 있다.

세 영역 모두 같은 규약이다 — **[＋추가] 버튼 → 멀티선택 팝업(이미 담은 대상은 체크된 상태로 열림)
→ [선택] 로 전체 교체**. 전부 해제하고 [선택] 하면 비우기가 된다.
칩은 버튼 오른쪽에 한 줄로 놓고, 넘치면 `＋N` 으로 접는다.

```js
const cfShareGroups = computed(() => [
  { type: 'USER',   label: '사용자', cmd: 'setting-pickUser',   icon: '👤', ... },
  { type: 'DEPT',   label: '부서',   cmd: 'setting-pickDept',   icon: '🏢', ... },
  { type: 'VENDOR', label: '업체',   cmd: 'setting-pickVendor', icon: '🏭', ... },
]);
```

메타 배열 하나가 세 줄을 다 그리므로 대상이 늘어도 항목만 더하면 된다.

---

## 4. 캔버스 높이

캔버스는 고정 높이가 아니라 **스크롤 컨테이너(`.bo-main`) 아래 끝까지** 채운다.
아래에 회색 빈 영역이 남지 않게 하는 것이 목적이다.

```js
const sc  = el.closest('.bo-main');           /* 고정 높이 스크롤 컨테이너 */
const end = sc ? sc.getBoundingClientRect().bottom : window.innerHeight;
canvasH.value = Math.max(CANVAS_MIN, Math.round(end - el.getBoundingClientRect().top - 16));
```

- `.bo-main` 하단 기준이라 **스크롤 위치와 무관**하다 (`window.innerHeight` 기준이면 스크롤할 때마다 값이 흔들린다)
- 이름·공유설정 패널을 접거나 펴면 캔버스 시작 위치가 바뀌므로
  `settingOpen` · `tab` · `curId` · `cards.length` · `dtlId` 변화마다 다시 잰다
- 상세 응답이 늦게 와 패널이 뒤늦게 그려지는 경우가 있어 `nextTick` + `setTimeout(300)` 두 번 잰다
- `CANVAS_MIN`(360) 은 하한선 — 설정 패널을 펼치면 남는 공간이 그보다 작아 캔버스가 화면 아래로 넘어간다(스크롤)

---

## 5. 사용자 대시보드의 보기/관리 모드

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

## 6. 항목 복사 시 `item_key`

`cm_dashboard_item` 에 `(dashboard_id, item_key)` 유니크 제약이 있다. 카탈로그에서 같은 항목을
두 번 담거나, 이름이 같고 출처만 다른 항목을 담으면 충돌한다.

→ 복사 시 그 대시보드 안에서 겹치지 않는 키를 만든다 (`COMP0101` → `COMP0101_2` → `_3`).

키를 바꿔도 안전한 이유: 사용자 대시보드의 데이터 조회는 `item_key` 가 아니라
`optionJson._srcItemId` 로 원본 항목을 가리킨다.

---

## 7. 항목유형 (`item_type_cd`) — 차트종류와 다르다

`chart_type` 하나가 두 가지 의미를 겸하고 있었다. `kpi` 는 차트가 아닌데 차트종류 자리에 있었고,
여기에 목록(표)을 더하려니 `chart_type='table'` 이 되는데 **목록은 차트 종류가 아니다**.
범주가 다른 값을 한 컬럼에 섞으면 "차트유형 선택" UI 가 KPI·목록까지 떠안고,
차트 전용 속성(축·시리즈)을 언제 물어야 하는지 판단할 근거가 사라진다.

| `item_type_cd` | 뜻 | `chart_type` | `series_json` 의 의미 |
|---|---|---|---|
| `KPI` | 숫자 카드 | 무의미(NULL) | 미사용 |
| `CHART` | 차트 | `bar` `line` `pie` `radar` `heatmap` `scatter` | 시리즈 정의 `[{name,color,type}]` |
| `TABLE` | 목록(표) | 무의미(NULL) | **컬럼 정의** `[{name,key,align}]` |

- 마이그레이션: [`migration_20260728_cm_dashboard_item_type.sql`](../../../ddl_pgsql/migration_20260728_cm_dashboard_item_type.sql)
- 프론트는 `cmDashWidgetUtil.itemTypeOf(item)` 로 정규화해 쓴다 —
  `item_type_cd` 가 없는 구 데이터는 `chart_type` 으로 추정(`kpi`→KPI)하므로 하위호환이 유지된다
- 항목관리 화면은 `항목유형` 을 먼저 고르고, **CHART 일 때만** `차트종류` 를 묻는다

### 목록(TABLE) 위젯

운영 대시보드는 차트보다 목록이 많다. 목록은 `cm_dashboard_item_data` 의
`col1Nm~col6Nm`(텍스트) / `col1Num~col9Num`(숫자)을 그대로 표로 그린다.

```json
[{"name":"주문번호","key":"col1Nm"},{"name":"금액","key":"col1Num","align":"right"}]
```

- `series_json` 을 안 주면 값이 들어있는 `col*` 을 자동 감지해 컬럼을 만든다
- 숫자는 천단위 구분, `yyyymmdd` 는 `YYYY-MM-DD` 로 — 차트와 달리 **억/만 단위로 줄이지 않는다**(원값 가독성 우선)

---

## 8. 실데이터 소스 (`data_source_cd`)

대시보드 데이터는 원래 전부 `cm_dashboard_item_data` 에 미리 넣어둔 행이었다.
집계 배치 결과를 보여주는 데는 맞지만 "지금 미처리 주문이 몇 건인가" 는 조회 시점에 세야 의미가 있다.

```
item.data_source_cd 있음 → CmDashboardDataSourceRegistry 의 집계 쿼리 실행 (실데이터)
                  없음/미등록/실패 → cm_dashboard_item_data 읽기 (기존 동작)
```

- 마이그레이션: [`migration_20260728_cm_dashboard_data_source.sql`](../../../ddl_pgsql/migration_20260728_cm_dashboard_data_source.sql)
- **SQL 을 DB 컬럼에 담지 않는다** — 임의 SQL 을 값으로 두면 관리 화면에서 편집 가능한 인젝션 경로가 된다.
  DB 에는 이름만 두고 실제 쿼리는 코드(`CmDashboardDataSourceRegistry`)에 둔다
- 등록되지 않은 이름은 **조용히 폴백**한다 — 오타로 대시보드가 죽지 않게
- 소스 SQL 의 SELECT 별칭은 반드시 `col1_nm` / `col1_num` 형식. 사이트 격리는 `:siteId` 바인딩
- 실행 실패도 폴백 — 한 칸이 깨졌다고 화면 전체가 비면 안 된다(실패는 WARN 로그로 남음)

새 소스를 추가하려면 `SQL.put("이름", "…")` 한 줄 + 항목의 `data_source_cd` 지정이면 끝이다.

### ⛔ 네이티브 쿼리에 PostgreSQL 캐스트 `::` 금지

Hibernate 는 네이티브 SQL 에서 `:` 를 **명명 파라미터 시작**으로 읽는다.
`join_date::date` 는 `:date` 파라미터로 오인돼 다음과 같이 깨진다.

```
ERROR: syntax error at or near ":"
→ 그 트랜잭션이 오염(current transaction is aborted)
→ 뒤이은 폴백 조회까지 실패해 대시보드 전체가 500
```

폴백이 있어도 **소용없다** — 같은 트랜잭션이 이미 죽어 있기 때문이다.
실제로 회원·프로모션·시스템 세 대시보드가 통째로 안 뜨는 증상으로 나타났다(2026-07-29).

```sql
-- ❌  CAST 를 :: 로 쓰면 안 된다
LEFT JOIN mb_member m ON m.join_date::date = d.day

-- ✅
LEFT JOIN mb_member m ON CAST(m.join_date AS date) = d.day
```

`:siteId` 처럼 **진짜 바인딩 파라미터만** `:` 를 쓴다.

### 적용 현황 (2026-07-29)

도메인 대시보드 8종 × 8항목 = **64항목 전부 실데이터**. 샘플 데이터 잔존 0.

| 대시보드 | 주요 소스 |
|---|---|
| 회원 | `mb_member`(총원·오늘가입·휴면·탈퇴·가입추이·최근가입·등급분포) |
| 상품 | `pd_prod` / `pd_prod_stock`(재고부족) / `pd_prod_qna`(미답변) / `pd_category` |
| 주문 | `od_order`(오늘·미처리·추이·결제수단) / `od_claim`(진행중) |
| 프로모션 | `pm_event` / `pm_coupon` + `pm_coupon_issue`(발급·사용) / `pm_cache` |
| 전시 | `dp_ui` `dp_area` `dp_panel` `dp_widget` `dp_panel_item` |
| 고객센터 | `sy_contact`(미답변·오늘접수·평균응답·분류) / `cm_chatt`(진행중) / `cm_faq` |
| 정산 | `st_settle`(최근마감월·미지급·수수료) / `st_settle_adj`(조정) |
| 시스템 | `sy_user` `sy_role` `sy_batch` / `syh_access_log` `syh_access_error_log` |

> **로그 테이블은 `site_id` 로 좁히지 않는다** — 미인증 요청 로그는 `site_id` 가 NULL 이라
> 사이트 조건을 걸면 대부분 빠진다(오늘 오류·API 호출량 소스 참조).

---

## 9. 대메뉴별 운영 대시보드 8종

`대시보드` 그룹의 `📁 업무별 대시보드` 폴더에 도메인별 대시보드를 둔다.
회원 / 상품 / 주문 / 프로모션 / 전시 / 고객센터 / 정산 / 시스템 — 각 8항목
(**KPI 4 + 차트 1 + 목록 3** — 운영 화면은 목록 비중이 높아야 쓸모가 있다).

- `ui_comp_nm` 은 `DashboardBoDomain*` 규약 — 전용 Vue 컴포넌트가 아니라 **식별자**다.
  전용 화면이 없으므로 좌측메뉴 클릭 시 대시보드 뷰어(`CmDashboardMyMng`)가 캔버스를 그린다
- 생성 스크립트는 재실행 안전 — `ui_comp_nm LIKE 'DashboardBoDomain%'` 로 지우고 다시 넣는다
