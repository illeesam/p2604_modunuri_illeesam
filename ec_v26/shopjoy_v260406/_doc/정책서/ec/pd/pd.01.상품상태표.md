<style>
table { width: 100%; border-collapse: collapse; }
th, td { word-break: keep-all; overflow-wrap: break-word; white-space: normal; vertical-align: top; }
</style>

# pd.01. 상품 상태 코드 표

상품·카테고리 도메인 전체 상태·분류 코드를 한 곳에서 조회하는 참조 문서.
상세 정책은 pd.02.카테고리.md, pd.03.상품.md를 참조하세요.

---

## 1. 상태 코드 표

### 1-A. 상품 상태 — `pd_prod.prod_status_cd` (코드그룹 `PROD_STATUS_CD`)
상품의 판매 가능 여부를 나타내는 라이프사이클 상태.
DRAFT → SCHEDULED → ACTIVE ↔ INACTIVE 로 전이하며, 재고 소진 시 SOLDOUT 으로 표시된다.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| DRAFT     | 임시저장 | 작성 중인 미완성 상품. 사용자에게 미노출. **배치가 절대 자동 전환하지 않음**(관리자가 등록을 마친 뒤 SCHEDULED로 직접 전환해야 함) |
| SCHEDULED | 판매예정 | 등록 완료 · 판매시작일 대기 중. `PROD_SALE_STATUS_SYNC` 배치가 판매시작일시 도달 시 ACTIVE로 자동 전환 |
| ACTIVE    | 판매중   | 정상 노출·주문 가능. 배치가 판매종료일시 경과 시 INACTIVE로 자동 전환 |
| SOLDOUT   | 품절     | 재고 소진. 노출은 되나 주문 불가. 관리자/재고 판단 영역 — 배치가 건드리지 않음 |
| INACTIVE  | 중지     | 판매 중단. 관리자 재활성화 가능 — 배치가 건드리지 않음(ACTIVE→INACTIVE 자동 전환만 배치 담당) |

> **2026-08-23 추가** — `PdProdSaleStatusSyncJob`(`PROD_SALE_STATUS_SYNC`, 매시간)이 SCHEDULED→ACTIVE·
> ACTIVE→INACTIVE 두 전이만 자동 처리하도록 `SCHEDULED` 상태를 신설했다. 이전에는 DRAFT를 배치가 직접
> ACTIVE로 전환했는데, 판매기간(`sale_start_date`)만 먼저 입력된 미완성 초안이 날짜 도달만으로 실수로
> 공개되는 문제가 있어 DRAFT는 배치 대상에서 제외하고 SCHEDULED를 중간 상태로 분리했다.
>
> **2026-07-31 정정** — 표는 실제 `sy_code.PROD_STATUS_CD`(당시는 `PROD_STATUS` 오기) 기준으로 맞췄다.
> 이전 문서의 `STOPPED`(중단) / `DISCONTINUED`(단종) 는 코드그룹에 등록된 적이 없는
> 설계 시안이었고, 실제 데이터에도 쓰인 적이 없다.
> 또 테이블명이 `ec_prod` 로 적혀 있었으나 실제는 `pd_prod` 다.
> 데이터에 섞여 있던 비표준 `SELLING` 38건은 `ACTIVE` 로 정규화했다
> (→ [sy.08 공통코드](../../sy/sy.08.공통코드.md) §상태값은 반드시 sy_code 에 있는 값만 저장).

---

### 1-B. 카테고리 활성 여부 — `ec_category.use_yn`
카테고리 노출 여부를 나타내는 단순 플래그. N 설정 시 하위 상품 노출도 중단된다.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| Y | 활성   | 사용 중인 카테고리. 상품 배정·노출 가능 |
| N | 비활성 | 비활성 카테고리. 하위 상품 노출 중단 |

---

### 1-C. 옵션 상태 — `ec_prod_option.option_status_cd`
개별 옵션 항목(색상·사이즈 등)의 선택 가능 여부. SOLD_OUT은 재고 0일 때 자동 전환.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ACTIVE   | 활성   | 선택 가능한 옵션 |
| SOLD_OUT | 품절   | 재고 0. 선택 불가, UI에 품절 표시 |
| INACTIVE | 비활성 | 판매 중단된 옵션 항목 |

---

### 1-D. 상품 유형 — `ec_prod.prod_type_cd`
취소·반품·교환 가능 여부가 유형별로 다르므로 클레임 처리 시 반드시 확인.
DIGITAL·MADE·FOOD는 표준 클레임 정책 예외 적용.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| GENERAL  | 일반상품   | 일반 실물 배송 상품 |
| DIGITAL  | 디지털상품 | 다운로드·코드 즉시 제공. 취소 불가 |
| MADE     | 주문제작   | 제작 시작 후 취소 불가 |
| FOOD     | 식품       | 냉동·신선. 배송 시작 후 취소 불가 |

---

## 2. 상관관계표

### 2-A. 상품 상태별 액션 가능 여부 — `prod_status_cd`(기준) × 액션
`STOPPED`/`DISCONTINUED`는 실제 등록된 적 없는 코드값이라 아래 표에서 제외했다(§1-A 참조).

| `prod_status_cd` | 사용자노출 | 장바구니 | 주문 | 쿠폰적용 | 수정 | 재활성화 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| DRAFT<br>임시저장      | ❌ | ❌ | ❌ | ❌ | ✅ | -  |
| SCHEDULED<br>판매예정  | ✅(출시예정) | ❌ | ❌ | ❌ | ✅ | -  |
| ACTIVE<br>판매중       | ✅ | ✅ | ✅ | ✅ | ✅ | -  |
| SOLDOUT<br>품절        | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| INACTIVE<br>중지       | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

### 2-B. 상품 유형별 클레임 가능 여부 — `prod_type_cd`(기준) × 클레임 유형
GENERAL만 표준 클레임 정책 전체 적용. 나머지 유형은 각각 예외 규칙이 있다.
† MADE: 제작 시작(PREPARING 진입) 전까지만 취소 가능.  †† FOOD: 상품 하자·오배송 예외 허용.

| `prod_type_cd` | 취소(배송전) | 취소(PREPARING후) | 반품 | 교환 | 비고 |
|:---|:---:|:---:|:---:|:---:|:---|
| GENERAL<br>일반상품   | ✅  | ❌  | ✅  | ✅  | 표준 클레임 정책 적용 |
| DIGITAL<br>디지털상품 | ❌  | ❌  | ❌  | ❌  | 즉시 제공으로 취소 불가 |
| MADE<br>주문제작      | ✅† | ❌  | ❌  | ❌  | 제작 시작 전만 취소 가능 |
| FOOD<br>식품          | ✅  | ❌  | ❌†† | ❌ | 개봉·냉동 파손 시 반품 불가 |

---

## 변경이력

- 2026-04-18: 초기 작성
- 2026-04-18: 헤딩 형식 변경 (타이틀 좌측·컬럼명 우측) + 설명 추가
- 2026-08-23: `SCHEDULED`(판매예정) 코드값 신설 반영, §2-A 매트릭스를 실제 코드값(DRAFT/SCHEDULED/ACTIVE/SOLDOUT/INACTIVE) 기준으로 재작성 — `PdProdSaleStatusSyncJob` 참조
