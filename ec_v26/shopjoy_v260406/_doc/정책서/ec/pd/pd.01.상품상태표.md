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
상품의 **노출(전시) 라이프사이클**만 나타내는 상태. "지금 진짜 살 수 있는가"(판매예정/판매중/품절)는
이 상태에 없다 — ACTIVE(전시중) 안에서 FO가 판매기간·재고를 응답 시점에 직접 계산해 판정한다(§1-A-1 참조).
DRAFT → ACTIVE ↔ INACTIVE → ENDED 로 전이한다.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| DRAFT    | 임시저장 | 작성 중인 미완성 상품. 사용자에게 미노출. 배치가 절대 자동 전환하지 않음(관리자가 등록을 마친 뒤 ACTIVE로 직접 전환해야 함) |
| ACTIVE   | 전시중   | FO에 노출됨(전시기간 조건도 별도 충족해야 함, §1-A 하단). 이 안에서 판매예정/판매중/품절 세부 구분은 상태가 아니라 계산값 |
| INACTIVE | 판매중지 | FO 미노출. 판매기간(`sale_start_date`~`sale_end_date`)을 벗어나면 배치가 ACTIVE에서 자동 전환, 기간 안으로 돌아오면(관리자가 종료일 연장 등) 배치가 다시 ACTIVE로 자동 복귀 |
| ENDED    | 판매종료 | FO 미노출. 관리자가 명시적으로 완전히 끝낸 최종 상태 — 배치가 절대 건드리지 않음(되살리려면 관리자가 직접 ACTIVE로 전환) |

> **2026-08-23 재정리** — 상태를 5종(DRAFT/SCHEDULED/ACTIVE/SOLDOUT/INACTIVE)에서 4종(DRAFT/ACTIVE/
> INACTIVE/ENDED)으로 단순화했다. `SCHEDULED`(판매예정)와 `SOLDOUT`(품절)은 별도 상태로 두지 않고
> `ACTIVE`(전시중) 하나로 흡수 — FO 입장에서 둘 다 "전시중이긴 하지만 지금 구매는 안 되는" 케이스라
> 상태를 늘리는 대신 `FoPdProdService`가 매 응답마다 판매기간(`sale_start_date`~`sale_end_date`)과
> 재고(`sold_out_yn`)로 `SCHEDULED`/`ON_SALE`/`SOLDOUT`/`ENDED` 를 계산해 내려준다(DB 컬럼 아님, 응답
> 전용 계산 필드 `saleStateCd`). 대신 관리자가 판매를 완전히 끝내는 명시적 결정을 표현할 상태가 없어서
> `ENDED`(판매종료)를 신설했다 — `INACTIVE`(판매중지)는 판매기간에 연동돼 배치가 왔다갔다 자동 전환하는
> 반면, `ENDED`는 순수 관리자 결정이라 배치가 절대 개입하지 않는다는 점이 다르다.
>
> **2026-07-31 정정** — 표는 실제 `sy_code.PROD_STATUS_CD`(당시는 `PROD_STATUS` 오기) 기준으로 맞췄다.
> 이전 문서의 `STOPPED`(중단) / `DISCONTINUED`(단종) 는 코드그룹에 등록된 적이 없는
> 설계 시안이었고, 실제 데이터에도 쓰인 적이 없다.
> 또 테이블명이 `ec_prod` 로 적혀 있었으나 실제는 `pd_prod` 다.
> 데이터에 섞여 있던 비표준 `SELLING` 38건은 `ACTIVE` 로 정규화했다
> (→ [sy.08 공통코드](../../sy/sy.08.공통코드.md) §상태값은 반드시 sy_code 에 있는 값만 저장).

#### 1-A-1. 구매가능 세부상태 — `saleStateCd` (계산값, DB 컬럼 아님)
`prod_status_cd = ACTIVE`(전시중)인 상품에 한해 FO 응답 시점에 계산되는 값. 상태 코드가 아니므로
BO 목록·검색 조건으로 쓸 수 없고, 오직 FO가 배지·구매버튼 활성화 여부를 정하는 데만 쓴다.

| 값 | 의미 | 판정 기준 |
|----|------|-----------|
| SCHEDULED | 출시예정 | `now < sale_start_date` |
| ON_SALE   | 판매중(구매가능) | `sold_out_yn != 'Y'` 이고 판매기간 이내 |
| SOLDOUT   | 품절 | `sold_out_yn = 'Y'` |
| ENDED     | 판매기간 종료 | `now > sale_end_date` (배치가 다음 실행 때 INACTIVE로 내리기 전 짧은 유예 구간에만 잠깐 나타남) |

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
장바구니/주문/쿠폰적용은 `ACTIVE`(전시중) 상태여도 §1-A-1의 `saleStateCd`가 `ON_SALE`일 때만
실제로 가능하다 — 이 표는 `prod_status_cd` 단독 기준이라 `ACTIVE` 행의 ✅는 "그 경우가 있을 수 있다"는
뜻이지 항상 가능하다는 뜻이 아니다.

| `prod_status_cd` | 사용자노출 | 장바구니 | 주문 | 쿠폰적용 | 수정 | 재활성화 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| DRAFT<br>임시저장      | ❌ | ❌ | ❌ | ❌ | ✅ | -  |
| ACTIVE<br>전시중       | ✅ | ✅(saleStateCd=ON_SALE 일 때만) | ✅(〃) | ✅(〃) | ✅ | -  |
| INACTIVE<br>판매중지   | ❌ | ❌ | ❌ | ❌ | ✅ | ✅(배치 자동 또는 관리자 수동) |
| ENDED<br>판매종료      | ❌ | ❌ | ❌ | ❌ | ✅ | ✅(관리자 수동만, 배치 미개입) |

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
- 2026-08-23 (1차): `SCHEDULED`(판매예정) 코드값 신설, §2-A 매트릭스를 실제 코드값(DRAFT/SCHEDULED/ACTIVE/SOLDOUT/INACTIVE) 기준으로 재작성 — `PdProdSaleStatusSyncJob` 참조
- 2026-08-23 (2차, 최종): 위 5종을 DRAFT/ACTIVE(전시중)/INACTIVE(판매중지)/ENDED(판매종료) 4종으로 재정리. SCHEDULED·SOLDOUT은 별도 상태 폐기, ACTIVE로 흡수하고 FO 응답 계산값 `saleStateCd`(§1-A-1)로 대체. ENDED 신설(관리자 전용, 배치 미개입) — FoPdProdService/QPdProdRepositoryImpl/PdProdSaleStatusSyncJob 동반 수정
