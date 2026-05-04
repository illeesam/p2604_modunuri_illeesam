# pd.10 — 상품 상세 API 설계 표준

## 1. 설계 원칙

### FO vs BO 분리

| 구분 | 전략 | 이유 |
|---|---|---|
| **FO 상품상세** | 단일 통합 API 1회 호출 | 사용자 체감 속도 최우선. 한 화면에 모든 정보 노출 |
| **BO 상품수정** | 오픈 시 전체 탭 동시 조회 (`Promise.all`) | 탭별 count 즉시 표시, 탭 전환 시 추가 대기 없음 |

### BO 탭 count 0 표시 정책

- **탭 버튼은 수정/신규 모드 모두 항상 표시** — 데이터가 없어도 탭 버튼이 사라지면 안 됨
- count가 0인 경우 탭 버튼에 `0` 뱃지를 그대로 노출 (숨김 금지)
- **탭 컨텐츠 영역**: 데이터가 없으면 "XX이 없습니다." 안내 문구 표시 (`v-else`)
- count는 오픈 시 API 응답값 기준으로 즉시 반영 (신규 등록 모드는 `0` 고정)

---

## 2. BO 상품 수정 탭별 API

### 기본정보 (항상 조회)

```
GET /api/bo/ec/pd/prod/{prodId}
```

응답: `pd_prod` 단건 — 기본정보·상세설정·가격 탭의 원본 데이터

---

### 이미지 탭

```
GET /api/bo/ec/pd/prod/{prodId}/images
```

- 테이블: `pd_prod_img`
- 정렬: `sort_ord ASC`
- 페이징: 10개씩 (프론트 슬라이스)

| 필드 | 설명 |
|---|---|
| `prodImgId` | 이미지 ID |
| `cdnImgUrl` | 원본 URL |
| `cdnThumbUrl` | 썸네일 URL |
| `isThumb` | 대표 이미지 여부 |
| `optItemId1` | 1단 옵션 연결 (NULL=공통) |
| `optItemId2` | 2단 옵션 연결 (NULL=공통) |
| `imgAltText` | ALT 텍스트 |
| `sortOrd` | 정렬 순서 |

---

### 옵션설정 탭

```
GET /api/bo/ec/pd/prod/{prodId}/opts
```

- 테이블: `pd_prod_opt` (그룹) + `pd_prod_opt_item` (값)
- 응답 구조:

```json
{
  "groups": [ { "optId": "...", "optGrpNm": "색상", "optLevel": 1, "optTypeCd": "COLOR", ... } ],
  "items":  [ { "optItemId": "...", "optId": "...", "optNm": "빨강", "optVal": "RED", ... } ]
}
```

- `items`는 `optId` 기준으로 프론트에서 그룹핑
- 최대 2단 옵션 (1단·2단)

---

### 옵션(가격/재고) 탭

```
GET /api/bo/ec/pd/prod/{prodId}/skus
```

- 테이블: `pd_prod_sku`
- 페이징: 10개씩 (프론트 슬라이스)
- 필터: 1단옵션명 / 2단옵션명 / 재고유무 (프론트 필터 후 페이징)

| 필드 | 설명 |
|---|---|
| `skuId` | SKU ID |
| `skuCode` | SKU 코드 |
| `optItemId1` / `optItemId2` | 연결 옵션값 ID |
| `optItemNm1` / `optItemNm2` | 연결 옵션값명 (JOIN) |
| `addPrice` | 옵션 추가금액 |
| `prodOptStock` | 재고 수량 |
| `useYn` | 사용 여부 |

---

### 상품설명 탭

```
GET /api/bo/ec/pd/prod/{prodId}/contents
```

- 테이블: `pd_prod_content`
- 정렬: `sort_ord ASC`
- 페이징: 10개씩

| 필드 | 설명 |
|---|---|
| `prodContentId` | 콘텐츠 ID |
| `contentTypeCd` | 콘텐츠 유형 (PROD_CONTENT_TYPE) |
| `contentHtml` | HTML 본문 |
| `sortOrd` | 정렬 순서 |

---

### 연관상품 탭

```
GET /api/bo/ec/pd/prod/{prodId}/rels
```

- 테이블: `pd_prod_rel`
- 정렬: `sort_ord ASC`
- 페이징: 10개씩

| 필드 | 설명 |
|---|---|
| `prodRelId` | 연관상품 관계 ID |
| `relProdId` | 연관 상품 ID |
| `relProdNm` | 연관 상품명 (JOIN) |
| `prodRelTypeCd` | 연관 유형 (`REL_PROD` / `CODY_PROD`) |
| `prodRelTypeCdNm` | 연관 유형명 (JOIN) |
| `sortOrd` | 정렬 순서 |

---

## 3. BO 상품 이력 API

```
GET /api/bo/ec/pd/prod/{prodId}/hist/orders   — 연관 주문
GET /api/bo/ec/pd/prod/{prodId}/hist/stock    — 재고 이력
GET /api/bo/ec/pd/prod/{prodId}/hist/price    — 가격 이력
GET /api/bo/ec/pd/prod/{prodId}/hist/status   — 상태 이력
GET /api/bo/ec/pd/prod/{prodId}/hist/changes  — 변경 이력
```

- `PdProdHist` 컴포넌트에서 탭 클릭 시 lazy load (최초 1회)
- 멀티컬럼 모드 전환 시 전체 탭 일괄 로드

---

## 4. FO 상품상세 API — 3계층 분리 ⭐

사용자 행동 흐름과 데이터 성격에 맞춰 **3계층**으로 분리한다.
첫 화면은 단일 호출로 즉시 표시하고, 후속 정보는 lazy load 한다.

### Tier 1 — 첫 화면 (단일 통합 호출, 필수)

```
GET /api/fo/ec/pd/prod/{prodId}
```

응답:
```json
{
  "prod":   { "prodId":"...", "prodNm":"...", "salePrice":..., ... },
  "images": [ { "prodImgId":"...", "cdnImgUrl":"...", ... } ],
  "opts":   { "groups":[ ... ], "items":[ ... ] },
  "skus":   [ { "skuId":"...", "addPrice":..., "stock":..., ... } ]
}
```

- 화면 첫 진입 시 즉시 호출 — 메인 사진/옵션/가격이 동시에 보여야 함
- 옵션과 SKU 는 옵션 선택 즉시 매칭되어야 하므로 함께 묶음

### Tier 2 — 스크롤 / 탭 클릭 시 lazy load

| 엔드포인트 | 트리거 시점 | 응답 |
|---|---|---|
| `GET /api/fo/ec/pd/prod/{prodId}/contents` | 상품설명 영역 스크롤 도달 | `[ { prodContentId, contentTypeCd, contentHtml, sortOrd } ]` |
| `GET /api/fo/ec/pd/prod/{prodId}/rels` | 연관상품 영역 도달 | `[ { prodRelId, relProdId, relProdNm, relProdImgUrl, salePrice, ... } ]` |
| `GET /api/fo/ec/pd/prod/{prodId}/reviews` | 상품평 탭 클릭 (있다면) | `{ summary, items, total }` |
| `GET /api/fo/ec/pd/prod/{prodId}/qna` | Q&A 탭 클릭 (있다면) | `{ items, total }` |

- 첫 화면 로드 후 IntersectionObserver 또는 탭 클릭 이벤트로 호출
- 캐시 가능 (상품 데이터는 안정적, 변경 빈도 낮음)
- 한 번 호출 후 재호출 없이 화면 보존

### Tier 3 — 사용자별 동적 (프로모션 통합)

```
GET /api/fo/ec/pd/prod/{prodId}/promotions
```

응답:
```json
{
  "coupons": [ { "couponId":"...", "couponNm":"...", "discntAmt":..., "issuableYn":"Y" } ],
  "discnts": [ { "discntId":"...", "discntNm":"...", "discntRate":..., "applyYn":"Y" } ],
  "gifts":   [ { "giftId":"...", "giftNm":"...", "giftImgUrl":"...", "condDesc":"..." } ],
  "events":  [ { "eventId":"...", "eventNm":"...", "endDt":"..." } ]
}
```

- **사용자별 개인화** — 회원등급/쿠폰 보유 여부에 따라 동적 응답
- 첫 화면 로드 직후 또는 가격 영역 옆 "받을 수 있는 쿠폰" 표시 시점 호출
- 캐시 단위가 짧음 (5~10분) — 별도 분리로 다른 캐싱 전략 적용 가능
- 통합 1회 호출 — coupons/discnts/gifts/events 를 묶어 처리 (백엔드 service 단순화)

### 호출 흐름 예시

```
사용자 진입
  ↓
[즉시] GET /prod/{prodId}                    ← Tier 1
[즉시] GET /prod/{prodId}/promotions          ← Tier 3 (가격 영역에 쿠폰 표시)
  ↓
사용자 스크롤 → 상품설명 영역 도달
  ↓
[lazy] GET /prod/{prodId}/contents            ← Tier 2

사용자 스크롤 → 연관상품 영역 도달
  ↓
[lazy] GET /prod/{prodId}/rels                ← Tier 2

사용자 → 상품평 탭 클릭
  ↓
[lazy] GET /prod/{prodId}/reviews             ← Tier 2 (해당 페이지에 있을 때)
```

### 분리 원칙 정리

| 데이터 | 분리 사유 |
|---|---|
| `prod + images + opts + skus` | 첫 화면 필수, 옵션 선택과 즉시 매칭 |
| `contents` | 화면 하단, 스크롤 시점에 표시 — 모바일에서 안 보고 떠나는 경우 많음 |
| `rels` | 별도 도메인 (상품 본체 ≠ 관계), 화면 최하단 |
| `promotions` | 사용자별 개인화, 캐싱 전략 다름, 별도 도메인(`pm_*`) |

---

## 5. 프론트 로딩 표준

### boApi URL 작성 규칙

`window.boApi` (axios 래퍼)는 내부적으로 `/api` prefix를 **자동으로 추가**한다.

| 구분 | 형태 | 실제 요청 URL |
|---|---|---|
| ✅ 올바른 코드 | `boApi.get('/bo/ec/pd/prod/...')` | `GET /api/bo/ec/pd/prod/...` |
| ❌ 잘못된 코드 | `boApi.get('/api/bo/ec/pd/prod/...')` | `GET /api/api/bo/ec/pd/prod/...` (중복) |

- 코드에서는 항상 `/bo/...` 또는 `/fo/...` 로 시작
- 전체 검색 시: `boApi.get('/bo/ec/pd/prod/` 패턴으로 검색

---

### BO 상품수정 오픈 시 (`Promise.all` 병렬)

```js
Promise.all([
  boApi.get('/bo/sy/user/page', ...),               // 담당MD 목록
  boApi.get('/bo/ec/pd/category/page', ...),         // 카테고리 목록
  boApi.get(`/bo/ec/pd/prod/${prodId}`, ...),        // 기본정보
  boApi.get(`/bo/ec/pd/prod/${prodId}/images`, ...),
  boApi.get(`/bo/ec/pd/prod/${prodId}/opts`, ...),
  boApi.get(`/bo/ec/pd/prod/${prodId}/skus`, ...),
  boApi.get(`/bo/ec/pd/prod/${prodId}/contents`, ...),
  boApi.get(`/bo/ec/pd/prod/${prodId}/rels`, ...),
])
```

- 8개 병렬 → 가장 느린 1개 응답시간만 대기
- 완료 후 각 탭 `tabData`에 적재, 탭 count 즉시 반영

### 탭별 페이징

| 탭 | 기본 페이지크기 | 비고 |
|---|---|---|
| 이미지 | 10개 | 프론트 슬라이스 |
| 옵션설정 | 전체 표시 | 그룹 수 적음 |
| SKU | 10개 | 필터 적용 후 페이징 |
| 상품설명 | 10개 | 프론트 슬라이스 |
| 연관상품 | 10개 | 프론트 슬라이스 |

---

## 6. 관련 파일

| 구분 | 파일 |
|---|---|
| BO Controller (기본) | `bo/ec/pd/controller/BoPdProdController.java` |
| BO Controller (탭) | `bo/ec/pd/controller/BoPdProdTabController.java` |
| BO Controller (이력) | `bo/ec/pd/controller/BoPdProdHistController.java` |
| BO Service (이력) | `bo/ec/pd/service/BoPdProdHistService.java` |
| Mapper XML (이력) | `mapper/base/ec/pd/PdProdHistMapper.xml` |
| 프론트 (수정) | `pages/bo/ec/pd/PdProdDtl.js` |
| 프론트 (이력) | `pages/bo/ec/pd/PdProdHist.js` |
