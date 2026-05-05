---
정책명: 백엔드 API 기술 정책 (EcAdminApi)
정책번호: base-기술-api
관리자: 개발팀
최종수정: 2026-05-05
---

# 백엔드 API 기술 정책 (EcAdminApi)

## 1. 기술 스택

| 기술 | 버전 | 비고 |
|---|---|---|
| Java | 17 | LTS |
| Spring Boot | 3.x | |
| MyBatis | 3.x | XML Mapper 방식 |
| PostgreSQL | - | Schema: `shopjoy_2604` |
| p6spy | - | SQL 로깅 |

---

## 2. 프로젝트 루트 패키지

```
com.shopjoy.ecadminapi
├── base/       기계적으로 생성된 모듈 모음 (auto-generated)
├── share/      bo / fo 양쪽에서 공통 사용하는 모듈 모음
├── bo/         Back Office (관리자 Admin) 전용 모듈 모음
├── fo/         Front Office (사용자 Front) 전용 모듈 모음
├── auth/       인증 관련
├── autorest/   자동 REST 생성
└── common/     공통 설정 (config 등)
```

---

## 3. 패키지별 역할 및 원칙

### 3.1 `base/` — 자동 생성 기반 모듈

- **정의**: DDL → 자동 생성 도구(AutoRest 등)가 기계적으로 만들어 낸 CRUD 모듈
- **특징**: 1 테이블 : 1 세트(Controller/Service/Mapper/Entity) 1:1 매핑
- **수정 금지**: 수동 비즈니스 로직 추가 금지 — 재생성 시 덮어씀
- **🚫 외부 직접 호출 금지** — `/api/base/**` 는 클라이언트(BO/FO)에서 절대 호출 금지. 자세한 내용은 [§ 3.5 BASE URL 직접 호출 금지](#35--api-base--url-직접-호출-금지--)
- **하위 구조**:

```
base/
├── domain/
│   ├── ec/          EC 도메인 (cm/dp/mb/od/pd/pm/st)
│   │   ├── cm/      공통·커뮤니티 (채팅, 공지, 게시판 등)
│   │   ├── dp/      전시 (Display)
│   │   ├── mb/      회원 (Member)
│   │   ├── od/      주문·클레임·배송 (Order)
│   │   ├── pd/      상품 (Product)
│   │   ├── pm/      프로모션 (Promotion: 쿠폰/캐시/적립금/이벤트)
│   │   └── st/      정산 (Settle)
│   └── sy/          SY 도메인 (시스템: 사이트/코드/사용자/권한/메뉴 등)
└── (controller/service/mapper은 각 도메인 서브패키지 내 위치)
```

### 3.2 `share/` — bo/fo 공통 모듈

- **정의**: Back Office와 Front Office 양쪽에서 호출하는 공통 비즈니스 로직
- **예시**: 공통 조회 서비스, 코드 캐시, 파일 업로드, 알림 발송 등
- **원칙**: bo/fo 어느 한 쪽에만 쓰인다면 해당 패키지로 이동

```
share/
├── controller/
├── service/
└── mapper/
```

### 3.3 `bo/` — Back Office (관리자) 전용 모듈

- **정의**: `bo.html` 관리자 화면에서만 호출하는 API 및 비즈니스 로직
- **예시**: 관리자 대시보드, 일괄 처리, 정산 마감, 배치 트리거 등
- **원칙**: Front에서 절대 호출하지 않는 기능만 여기에 위치

```
bo/
├── controller/
├── service/
└── mapper/
```

### 3.4 `fo/` — Front Office (사용자) 전용 모듈

- **정의**: `index.html` 사용자 화면에서만 호출하는 API 및 비즈니스 로직
- **예시**: 상품 목록/상세, 장바구니, 주문, 마이페이지 등 사용자 흐름
- **원칙**: 관리자에서 절대 호출하지 않는 기능만 여기에 위치

```
fo/
├── controller/
├── service/
└── mapper/
```

### 3.5 `/api/base/**` URL 직접 호출 금지 ⭐

**원칙**: `base/` 패키지의 컨트롤러(`/api/base/**`)는 **내부 공통 레이어**다. 프론트엔드에서 직접
호출하면 **반드시 안 된다**. BO 화면은 `/api/bo/**`, FO 화면은 `/api/fo/**` 컨트롤러를 거쳐야 한다.

#### 금지하는 이유

| 항목 | 설명 |
|---|---|
| **인증·인가** | `/api/bo/**` / `/api/fo/**` 만 SecurityConfig 의 BO_ONLY / FO_ONLY 인가 매처를 통과한다. `/api/base/**` 는 `denyAll()` 처리되어 클라이언트 호출 시 **403 Forbidden** 발생 |
| **감사 로그** | UI명/명령명/파일명 등 BO·FO 컨텍스트 헤더 검증·기록은 `/bo`, `/fo` 레이어에서 수행 |
| **API 책임 경계** | `base/` 는 자동 생성 CRUD 만 제공 — 인증·권한·비즈니스 규칙은 `bo/`, `fo/` 레이어 책임 |
| **재생성 안전성** | `base/` 는 DDL 변경 시 재생성됨 — 외부 의존이 있으면 마이그레이션 깨짐 |

#### 올바른 패턴

```js
// ❌ 금지 — BO 화면이 /api/base 직접 호출 → 403
boApi.get('/base/sy/user-token-log/page')
boApiSvc.stSettleConfig = {
  getPage(p, ui, cmd) { return boApi.get('/base/ec/st/settle-config/page', ...) }
};

// ✅ 올바름 — /api/bo/** 컨트롤러를 통해 호출
boApi.get('/bo/sy/user-token-log/page')
boApiSvc.stSettleConfig = {
  getPage(p, ui, cmd) { return boApi.get('/bo/ec/st/config/page', ...) }
};
```

#### 신규 기능이 필요할 때 — 레이어 구성 원칙 ⭐

`base/` 컨트롤러에만 엔드포인트가 있고 BO/FO 컨트롤러가 없으면, **`bo/` 또는 `fo/` 패키지에
Controller 를 신규 작성**한 후 클라이언트에서 호출한다.

**Service 작성 여부는 비즈니스 로직 유무로 결정한다.**

| 케이스 | 권장 구성 |
|---|---|
| **단순 CRUD 위임** (검증·가공·권한 추가 없음) | Controller → **base Service 직접 호출** (BO/FO Service 생략) |
| **비즈니스 로직 있음** (권한 체크·DTO 가공·트랜잭션 조합·캐시·감사 등) | Controller → **BO/FO Service** → base Service / base Mapper |

##### 패턴 1 — 단순 위임 (BO/FO Service 생략 OK)

```java
// ✅ 단순 CRUD 만 위임 — BO Service 불필요
@RestController
@RequestMapping("/api/bo/sy/vendor-user")
@RequiredArgsConstructor
public class BoSyVendorUserController {
    private final SyVendorUserService service;   // base Service 직접 주입

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyVendorUserDto>>> page(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(p)));
    }
}
```

##### 패턴 2 — 비즈니스 로직 보유 (BO/FO Service 필수)

```java
// ✅ BO 전용 권한 체크 + 가공 → BO Service 경유
@RestController
@RequestMapping("/api/bo/ec/st/config")
@RequiredArgsConstructor
public class BoStSettleConfigController {
    private final BoStSettleConfigService service;   // ← BO Service

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<StSettleConfigDto>>> page(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(p)));
    }
}

// BO Service: 비즈니스 로직 + base Mapper/Repository 직접 사용
@Service
@RequiredArgsConstructor
public class BoStSettleConfigService {
    private final StSettleConfigMapper mapper;       // ← base Mapper
    private final StSettleConfigRepository repository; // ← base Repository

    @Transactional
    public StSettleConfig create(StSettleConfig body) {
        body.setSettleConfigId(generateId());
        body.setRegBy(SecurityUtil.getAuthUser().authId());   // ← BO 전용 감사
        body.setRegDate(LocalDateTime.now());
        return repository.save(body);
    }
}
```

##### 핵심 원칙 정리

1. **Controller 는 항상 `bo/` 또는 `fo/` 에 둔다** (인증·인가 레이어 통과 목적)
2. **Service** — 비즈니스 로직 있으면 BO/FO Service, 없으면 생략하고 base Service 직접 호출
3. **CRUD 데이터 액세스** — base Service / base Mapper / base Repository 를 그대로 사용 (재사용)
4. **쿼리 변경이 필요할 때** — base Mapper.xml 을 직접 수정한다 (BO/FO 별도 Mapper 작성 금지)
5. **단순 위임에서 비즈니스 로직이 추가되는 시점** — 그때 BO/FO Service 클래스를 신설하면 된다 (사전 도입 불필요)

#### 점검 방법

```bash
# 프론트 BO 코드에 /base 잔존 점검 (0건이어야 함)
grep -rn "['\"]/\?base/\|/api/base/" pages/bo services/boApiSvc.js base/boApp.js
```

---

## 4. 신규 모듈 배치 기준

```
신규 기능 추가 시 판단 흐름:

1. DDL에서 자동 생성 가능한 CRUD인가?
   → YES: base/ 에 생성 (수동 수정 금지)
   → NO: 다음 단계

2. Admin(bo)과 Front(fo) 양쪽에서 사용하는가?
   → YES: share/
   → NO: 다음 단계

3. Admin(관리자)에서만 사용하는가?
   → YES: bo/

4. Front(사용자)에서만 사용하는가?
   → YES: fo/
```

---

## 5. Mapper XML 경로

Java 패키지 구조와 대응:

```
src/main/resources/mapper/
├── base/
│   ├── autorest/    자동 생성 Mapper XML
│   ├── ec/          EC 도메인 (cm/dp/mb/od/pd/pm/st)
│   └── sy/          SY 도메인
├── share/
├── bo/
└── fo/
```

MyBatis 설정: `classpath:mapper/**/*.xml` 와일드카드로 전체 스캔

---

## 6. MyBatis 설정

```
src/main/java/com/shopjoy/ecadminapi/common/config/
├── MyBatisConfig.java          DataSource, SqlSessionFactory 설정
├── MyBatisQueryInterceptor.java  쿼리 인터셉터
├── P6SpyFormatter.java         SQL 로그 포맷
├── SecurityConfig.java         Spring Security
└── WebConfig.java              CORS, MVC 설정
```

---

## 7. API 응답 구조 ⭐

### 7.1 ApiResponse — 단건/목록 응답

```json
{
  "code": 200,
  "message": "OK",
  "data": { ... }
}
```

`res.data.data` 로 실제 데이터에 접근한다.

### 7.2 PageResult — 페이징 응답 ⭐

`getPageData()` 계열 API는 `data` 필드 안에 `PageResult`를 반환한다.

```json
{
  "code": 200,
  "data": {
    "pageList":       [...],      ← 현재 페이지 데이터 배열
    "pageNo":         1,          ← 현재 페이지 번호 (1부터)
    "pageSize":       20,         ← 페이지당 건수
    "pageTotalCount": 153,        ← 전체 건수
    "pageTotalPage":  8,          ← 전체 페이지 수 (최소 1)
    "pageCond":       { ... }     ← 이번 조회에 사용된 검색 조건
  }
}
```

**프론트에서 올바르게 읽는 방법**:

```js
const res = await boApiSvc.mbMember.getPage({ kw, pageNo, pageSize });
const d = res.data?.data || {};

// ✅ 올바른 필드명
const rows      = d.pageList       || [];   // 데이터 배열
const total     = d.pageTotalCount || 0;    // 전체 건수
const totalPage = d.pageTotalPage  || 1;    // 전체 페이지 수

// ❌ 잘못된 필드명 — 항상 빈 값 반환
// d.list         → undefined
// d.totalCount   → undefined
// d.total        → undefined
// d.items        → undefined
```

> **주의**: 필드명을 `list`, `totalCount`, `total`로 잘못 읽으면 항상 빈 배열·0이 반환되어
> "조회 결과 없음"처럼 보이지만 실제 API는 정상 응답한다.

### 7.3 목록 조회는 항상 페이징 ⭐

**원칙**: 모든 목록 조회는 `getPageData()` 로 페이징 응답을 반환한다. `getList()` 는 내부 호출 또는
"전체 한 번에 받아 메모리에서 처리하는" 특수 목적(예: 코드그룹 캐시) 외에는 외부 노출 금지.

**근거**:
- 데이터가 적으면 페이징 의미 없어 보이지만, 누적되면 페이지네이션 없이는 화면 무거워짐
- 응답 구조 일관 — 화면이 항상 `pageList / pageTotalCount` 형태로 처리
- 백엔드도 `PageHelper` 한 곳에서 ThreadLocal 페이징 컨텍스트를 관리하여 표준화

**기본값** (`PageHelper.DEFAULT_PAGE_NO/SIZE`):
- `pageNo`   = `1`
- `pageSize` = `20`

호출 측에서 `pageNo/pageSize` 가 없거나 NULL 이어도 자동으로 기본값이 적용되므로, **클라이언트가
페이징 파라미터를 보내지 않아도 페이징 응답이 나온다**.

```java
// ✅ FO/BO Service 표준 패턴
@Transactional(readOnly = true)
public Map<String, Object> getReviews(String prodId, Map<String, Object> p) {
    Map<String, Object> param = (p != null) ? new HashMap<>(p) : new HashMap<>();
    param.put("prodId", prodId);

    PageResult<PdReviewDto> page = reviewService.getPageData(param);

    Map<String, Object> result = new LinkedHashMap<>();
    result.put("items",    page.getPageList());
    result.put("total",    page.getPageTotalCount());
    result.put("pageNo",   page.getPageNo());
    result.put("pageSize", page.getPageSize());
    return result;
}
```

```java
// ❌ 분기 금지 — pageSize 유무로 getList() / getPageData() 갈리지 않게
if (param.containsKey("pageSize")) {
    page = service.getPageData(param);
} else {
    list = service.getList(param);   // ← 이런 분기 금지
}
```

**예외 — `getList()` 외부 노출 허용 케이스**:

| 상황 | 사유 |
|---|---|
| 공통 코드 / 사이트 / 카테고리 트리 | 전체 캐싱 전제, 페이징 무의미 |
| 단일 상품의 이미지 / 옵션 / SKU | 한 상품의 모든 항목을 반드시 같이 표시 |
| 통계용 전체 스캔 (`COUNT(*)` 등) | 조회 대상이 본질적으로 리스트가 아님 |

위 외에는 항상 `getPageData()` 를 사용한다.

---

## 관련 정책
- `base.인증-admin.md` — 관리자 인증/토큰 정책
- `base.인증-front.md` — 사용자 인증/토큰 정책
- `sy.51.프로그램설계정책.md` — 화면 설계 기준
- `sy.52.ddl단어사전규칙.md` — DDL 컬럼명 표준
