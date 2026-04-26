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

## 4. FO 상품상세 API (참고)

```
GET /api/fo/pd/prod/{prodId}
```

단일 호출로 아래 정보 통합 응답:
- 기본정보 (`pd_prod`)
- 이미지 목록 (`pd_prod_img`)
- 옵션·SKU (`pd_prod_opt` + `pd_prod_opt_item` + `pd_prod_sku`)
- 상품설명 (`pd_prod_content`)
- 연관상품 (`pd_prod_rel`)

---

## 5. 프론트 로딩 표준

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
