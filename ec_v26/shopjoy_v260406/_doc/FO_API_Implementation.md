# FO (Front Office) API 구현 가이드

## 개요

프론트엔드의 모든 목업데이터 참조를 실제 API 호출로 변경했습니다.

### 구현 일시
- 2026-04-21
- 프론트엔드 파일: 15개
- 백엔드 Controller: 4개 (신규)

---

## 프론트엔드 변경사항

### 1. base/stores/foMyStore.js
마이페이지 데이터를 JSON 목업파일에서 API로 변경

| 기능 | 변경 전 | 변경 후 |
|---|---|---|
| 주문 목록 | `my/orders.json` | `GET /api/fo/my/order/list` |
| 클레임 목록 | `my/claims.json` | `GET /api/fo/my/claim/list` |
| 쿠폰 목록 | `my/coupons.json` | `GET /api/fo/my/coupon/list` |
| 캐시 정보 | `my/cash.json` | `GET /api/fo/my/cash/info` |
| 문의 목록 | - | `GET /api/fo/my/inquiry/list` |
| 채팅 목록 | - | `GET /api/fo/my/chat/list` |

### 2. base/foAuth.js
로그인/회원가입을 목업에서 실제 API로 변경

```javascript
// 로그인
POST /auth/fo/auth/login
body: { email, password }

// 회원가입
POST /auth/fo/auth/join
body: { memberNm, email, phone, password, ... }
```

### 3. pages/Login.js
signup 함수를 async로 변경하여 API 응답 대기

### 4. pages/Order.js
주문 페이지에서 쿠폰/캐시 API 호출 경로 변경
- `my/coupons.json` → `GET /api/fo/my/coupon/list`
- `my/cash.json` → `GET /api/fo/my/cash/info`
- `order-intake.json` → `POST /api/fo/order/create`

### 5. pages/Prod0*List.js
상품 목록을 API로 변경
- `products/list.json` → `GET /api/fo/product/list`

### 6. pages/Contact.js
문의 생성을 API로 변경
- `contact-intake.json` → `POST /api/fo/inquiry/create`

---

## 백엔드 Controller 구현

### 1. FoMyController
**파일**: `_apps/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/fo/ec/controller/FoMyController.java`

마이페이지 데이터 조회 API (프론트엔드 경로 호환)

| 메서드 | 경로 | 용도 | 인가 |
|---|---|---|---|
| GET | `/api/fo/my/order/list` | 주문 목록 | MEMBER |
| GET | `/api/fo/my/claim/list` | 클레임 목록 | MEMBER |
| GET | `/api/fo/my/coupon/list` | 쿠폰 목록 | MEMBER |
| GET | `/api/fo/my/cash/info` | 캐시 정보 | MEMBER |
| GET | `/api/fo/my/inquiry/list` | 문의 목록 | MEMBER |
| GET | `/api/fo/my/chat/list` | 채팅 목록 | MEMBER |

**의존성**:
- `FoMyPageService` (마이페이지 서비스)
  - `getMyOrders(Map p)` → `List<OdOrderDto>`
  - `getMyClaims(Map p)` → `List<OdClaimDto>`
  - `getMyCoupons(Map p)` → `List<PmCouponDto>`
  - `getMyCacheHistory(Map p)` → `List<PmCacheDto>`

### 2. FoProductController
**파일**: `_apps/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/fo/ec/controller/FoProductController.java`

상품 조회 API (프론트엔드 경로 호환)

| 메서드 | 경로 | 용도 | 인가 |
|---|---|---|---|
| GET | `/api/fo/product/list` | 상품 목록 | permitAll |
| GET | `/api/fo/product/{id}` | 상품 상세 | permitAll |

**의존성**:
- `FoPdProdService` (상품 서비스)
  - `getList(Map p)` → `List<PdProdDto>`
  - `getById(String id)` → `PdProdDto`

### 3. FoOrderController
**파일**: `_apps/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/fo/ec/controller/FoOrderController.java`

주문 생성 API (프론트엔드 경로 호환)

| 메서드 | 경로 | 용도 | 인가 |
|---|---|---|---|
| POST | `/api/fo/order/create` | 주문 생성 | MEMBER |

**의존성**:
- `FoOdOrderService` (주문 서비스)
  - `placeOrder(OdOrder entity)` → `OdOrder`

**요청 바디 예시**:
```json
{
  "orderId": "ORD-2026-12345",
  "orderDate": "2026-04-21",
  "form": {
    "name": "홍길동",
    "tel": "010-1234-5678",
    "email": "hong@example.com",
    "postcode": "12345",
    "address": "서울시 강남구",
    "addressDetail": "테헤란로 123",
    "deliveryReq": "문 앞에 놔주세요"
  },
  "items": [
    {
      "productId": "prod_001",
      "prodNm": "상품1",
      "image": "image.jpg",
      "color": "블랙",
      "size": "L",
      "qty": 1,
      "price": 50000,
      "coupon": "SALE10",
      "discount": 5000
    }
  ],
  "shippingCoupon": "FREE_SHIP",
  "cartTotal": 50000,
  "couponDiscount": 5000,
  "cashUsed": 10000,
  "finalPrice": 35000
}
```

### 4. FoInquiryController
**파일**: `_apps/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/fo/ec/controller/FoInquiryController.java`

문의 생성 API (프론트엔드 경로 호환)

| 메서드 | 경로 | 용도 | 인가 |
|---|---|---|---|
| POST | `/api/fo/inquiry/create` | 문의 생성 | permitAll |

**의존성**:
- `FoCmContactService` (문의 서비스)
  - `submit(Map<String, Object> body)` → `CmBlog`

**요청 바디 예시**:
```json
{
  "email": "user@example.com",
  "subject": "상품 문의",
  "content": "이 상품에 대해 문의합니다",
  "phone": "010-1234-5678"
}
```

---

## API 응답 형식

모든 API는 다음 형식으로 응답합니다:

```json
{
  "ok": true,
  "status": 200,
  "data": {
    "data": [...]  // 또는 객체
  },
  "message": "성공"
}
```

프론트엔드는 `res.data?.data` 로 실제 데이터에 접근합니다.

---

## 추가 구현 필요사항

### 1. FoMyController의 미구현 부분
- `inquiry/list`: `SyContact` 또는 별도 테이블에서 데이터 조회 필요
- `chat/list`: `CmChatt` 또는 별도 테이블에서 데이터 조회 필요
- `cash/info`: 캐시 잔액 조회 메서드 추가 필요

### 2. SecurityConfig 확인
- `/api/fo/inquiry/create`: permitAll 추가 필요 (비회원 접근)
- `/api/fo/product/*`: permitAll 확인

### 3. Service 구현 확인
- `FoMyPageService`: 이미 구현됨
- `FoPdProdService`: 이미 구현됨
- `FoOdOrderService`: 이미 구현됨
- `FoCmContactService`: 이미 구현됨

---

## 테스트 방법

### 1. 로그인
```bash
curl -X POST http://localhost:8080/api/auth/fo/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### 2. 주문 목록
```bash
curl -X GET http://localhost:8080/api/fo/my/order/list \
  -H "Authorization: Bearer <token>"
```

### 3. 상품 목록
```bash
curl -X GET http://localhost:8080/api/fo/product/list
```

### 4. 주문 생성
```bash
curl -X POST http://localhost:8080/api/fo/order/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{...주문 데이터...}'
```

---

## 배포 체크리스트

- [ ] Java Controller 파일들 배포
- [ ] 프론트엔드 JS 파일 배포
- [ ] SecurityConfig에서 `/api/fo/` 경로 인가 설정 확인
- [ ] 각 Service의 필요한 메서드 구현 확인
- [ ] API 테스트 (로그인, 조회, 생성)
- [ ] 데이터베이스 연결 상태 확인

---

## 참고

- **기존 Controller**: `/api/fo/ec/*` (ec 도메인 경로)
- **신규 Controller**: `/api/fo/*` (간단한 경로, 프론트엔드 호환)
- **인증 Controller**: `/api/auth/fo/*` (FoAuthController)

신규 Controller들은 기존 Service를 재사용하여 간단하게 구현되었습니다.
