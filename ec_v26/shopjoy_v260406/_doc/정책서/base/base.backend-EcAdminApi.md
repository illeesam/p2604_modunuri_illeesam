---
정책명: 백엔드 API 서버 (EcAdminApi) 설계 정책
정책번호: base-backend-EcAdminApi
관리자: 개발팀
최종수정: 2026-04-20
---

# 백엔드 API 서버 (EcAdminApi) 설계 정책

## 1. 개요

`_apps/EcAdminApi` — Spring Boot 3.2 기반 관리자 전용 REST API 서버.  
관리자 프론트(`bo.html`)의 `window.boApi`(`utils/boApiAxios.js` axios 래퍼) + `window.boApiSvc`/`window.coApiSvc`(`services/boApiSvc.js` · `services/coApiSvc.js` 도메인별 서비스 객체) 가 이 서버를 호출한다.

| 항목 | 값 |
|---|---|
| Java | JDK 17 |
| Framework | Spring Boot 3.2 |
| Build | Gradle |
| ORM | JPA (Hibernate) + MyBatis 하이브리드 |
| DB | PostgreSQL (`shopjoy_2604` 스키마) |
| 인증 | JWT (stateless) |
| 서버 포트 | 8080 |
| Context Path | `/api` |

---

## 2. 패키지 구조

```
com.shopjoy.ecadminapi
├─ EcAdminApiApplication.java          진입점 (@SpringBootApplication)
│
├─ auth/                               인증 계층
│   ├─ AuthController.java             POST /auth/admin/login|refresh|logout
│   ├─ AuthService.java                로그인·토큰 발급·갱신·무효화
│   ├─ JwtProvider.java                JWT 생성·검증
│   ├─ JwtAuthFilter.java              OncePerRequestFilter — 토큰 파싱·SecurityContext 주입
│   ├─ UserDetailsServiceImpl.java     sy_user 조회 → Spring Security UserDetails 변환
│   └─ dto/  LoginRequest · LoginResponse · RefreshRequest · TokenPair
│
├─ autorest/                           제너릭 REST 계층 (9가지 표준 오퍼레이션)
│   ├─ AutoRestController.java         URL: /autoRest/{domain}/{sub}/{table}
│   ├─ AutoRestService.java            비즈니스 로직 (CRUD + 페이징)
│   ├─ AutoRestMapper.java             MyBatis 인터페이스
│   ├─ TableConfig.java                테이블별 메타 설정 VO
│   ├─ TableRegistry.java              테이블 화이트리스트 + 설정 저장소
│   └─ dto/
│       ├─ SearchRequest.java          검색 파라미터 (searchValue, filters, date, siteId, status, page, size …)
│       ├─ QueryParam.java             MyBatis 파라미터 VO (빌더 패턴)
│       ├─ RowMap.java                 DB 결과 행 / 요청 바디 (LinkedHashMap 상속)
│       └─ BulkDeleteRequest.java      일괄 삭제 요청 VO
│
├─ domain/
│   └─ sy/entity/SyUser.java          관리자 계정 JPA 엔티티 (인증 전용)
│
├─ common/
│   ├─ exception/
│   │   ├─ BusinessException.java      도메인 예외 (400)
│   │   └─ GlobalExceptionHandler.java @RestControllerAdvice 전역 예외 처리
│   ├─ response/
│   │   ├─ ApiResponse<T>              표준 응답 래퍼 { ok, status, data, message }
│   │   └─ PageResult<T>              페이지 결과 { pageList, pageNo, pageSize, pageTotalCount, pageTotalPage, pageCond }
│   └─ util/PatchUtil.java             null 필드 제외 복사 유틸
│
└─ config/
    ├─ SecurityConfig.java             Spring Security 설정 (JWT stateless)
    ├─ WebConfig.java                  CORS 설정
    └─ MyBatisConfig.java              MyBatis 설정
```

---

## 3. DB 연결

| 항목 | 값 |
|---|---|
| Host | `illeesam.synology.me:17632` |
| Database | `postgres` |
| Schema | `shopjoy_2604` |
| DDL Auto | `validate` (JPA가 스키마를 변경하지 않음) |
| Connection Pool | HikariCP (max 10) |
| Mapper 위치 | `classpath:mapper/**/*.xml` |

---

## 4. 인증 구조 (JWT)

### 4.1 토큰 발급

```
POST /api/auth/admin/login
Body: { "loginId": "admin@shopjoy.com", "password": "admin123!" }
Response: { ok:true, data: { accessToken, refreshToken, user:{...} } }
```

| 토큰 | 만료 | 저장 위치 (클라이언트) |
|---|---|---|
| accessToken | 15분 (900,000ms) | `localStorage modu-admin-token` |
| refreshToken | 7일 (604,800,000ms) | `localStorage modu-admin-refresh` |

### 4.2 토큰 갱신

```
POST /api/auth/admin/refresh
Body: { "refreshToken": "..." }
Response: { ok:true, data: { accessToken, refreshToken } }
```

refreshToken 은 DB(`sy_user_token_log`)에 저장·비교·무효화한다.

### 4.3 로그아웃

```
POST /api/auth/admin/logout
Body: { "refreshToken": "..." }
```

서버에서 refreshToken 을 무효화한다. 클라이언트는 localStorage 삭제.

### 4.4 요청 인증 흐름

```
모든 /api/** 요청 (단, /api/auth/admin/** 제외)
  → JwtAuthFilter
    → Authorization: Bearer {token} 헤더 파싱
    → JwtProvider.validateToken()
    → SecurityContextHolder 에 UsernamePasswordAuthenticationToken 주입
  → Controller 진입 (인증 실패 시 401 반환)
```

### 4.5 허용 공개 경로

```
/api/auth/admin/**   (로그인·갱신·로그아웃)
/api/actuator/**     (헬스체크)
OPTIONS /**           (CORS preflight)
```

---

## 5. AutoRest — 제너릭 CRUD

테이블 이름을 URL 경로변수로 받아 **단일 Controller · Service · Mapper** 로 149개 테이블을 처리하는 제너릭 계층.

### 5.1 URL 패턴

```
/api/autoRest/{domain}/{sub}/{table}
```

`domain`, `sub` 은 라우팅 분류용 경로변수 (현재 서비스 로직에서는 미사용).  
`table` 이 실제 DB 테이블명이며 **TableRegistry 화이트리스트**에서 검증된다.

### 5.2 9가지 표준 오퍼레이션

| # | Method | URL | 설명 |
|---|---|---|---|
| 1 | GET | `/autoRest/{d}/{s}/{table}` | 목록 (최대 1,000건) |
| 2 | GET | `/autoRest/{d}/{s}/{table}/page` | 페이지 조회 |
| 3 | GET | `/autoRest/{d}/{s}/{table}/count` | 건수 조회 |
| 4 | GET | `/autoRest/{d}/{s}/{table}/{id}` | 단건 조회 (childTables 포함) |
| 5 | POST | `/autoRest/{d}/{s}/{table}` | 등록 |
| 6 | PUT | `/autoRest/{d}/{s}/{table}/{id}` | 전체 수정 |
| 7 | PATCH | `/autoRest/{d}/{s}/{table}/{id}` | 부분 수정 (null 필드 제외) |
| 8 | DELETE | `/autoRest/{d}/{s}/{table}/{id}` | 단건 삭제 |
| 9 | DELETE | `/autoRest/{d}/{s}/{table}` | 일괄 삭제 (ids 배열) |

### 5.3 검색 파라미터 (SearchRequest)

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `searchValue` | String | 키워드 (searchFields 대상 ILIKE) |
| `dateStart` / `dateEnd` | String | 날짜 범위 (dateField 기준) |
| `siteId` | String | 사이트 필터 |
| `status` | String | 상태 코드 필터 |
| `filters` | `Map<String,Object>` | 컬럼별 = 조건 동적 필터 |
| `orderBy` | String | 정렬 (영문/숫자/언더바/쉼표/공백/ASC/DESC만 허용) |
| `page` | int | 페이지 번호 (기본 1) |
| `size` | int | 페이지 크기 (기본 20, 최대 500) |

### 5.4 ID 생성 규칙

등록 시 서버에서 자동 생성:

```
YYMMDDhhmmss + rand(4자리)
예: "2604201430001234"
```

`AutoRestService.generateId()` 참고.

### 5.5 공통 감사 컬럼 자동 처리

| 오퍼레이션 | 자동 처리 컬럼 |
|---|---|
| 등록 (POST) | `reg_by` = loginId, `reg_date` = now() |
| 수정 (PUT·PATCH) | `upd_by` = loginId, `upd_date` = now() |

### 5.6 SQL 인젝션 방지

- 테이블명: `TableRegistry.isSafeIdentifier()` — `^[a-zA-Z][a-zA-Z0-9_]{0,62}$` 정규식
- 컬럼명: `isSafeIdentifier()` 동일 검증
- ORDER BY: `sanitizeOrderBy()` — 영문자·숫자·언더바·쉼표·공백·ASC/DESC 패턴만 허용
- ID 값: `[a-zA-Z0-9_\-]{1,50}` 패턴 검증 (일괄삭제)
- 파라미터 바인딩: MyBatis `#{}` (PreparedStatement) 사용

---

## 6. TableConfig — 테이블별 메타설정

`TableRegistry.java` 의 `@PostConstruct init()` 에서 테이블별 `TableConfig` 를 등록한다.

```java
TableConfig.builder()
    .pkColumn("member_id")
    .requiredFields(List.of("member_email", "member_nm"))
    .searchFields(List.of("member_email", "member_nm", "member_phone"))
    .cdFields(Map.of("grade_cd", "MEMBER_GRADE", "member_status_cd", "MEMBER_STATUS"))
    .fkFields(Map.of("site_id", "sy_site"))
    .childTables(List.of("mb_member_addr"))
    .dateField("join_date")
    .build()
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `pkColumn` | String | PK 컬럼명 |
| `requiredFields` | `List<String>` | 필수 입력 컬럼 (등록·수정 시 검증) |
| `searchFields` | `List<String>` | 키워드 검색 대상 컬럼 |
| `cdFields` | `Map<String,String>` | 코드 컬럼 → 코드그룹 매핑 |
| `fkFields` | `Map<String,String>` | FK 컬럼 → 참조 테이블 매핑 |
| `childTables` | `List<String>` | 단건 조회 시 함께 조회할 자식 테이블 |
| `dateField` | String | 날짜 범위 검색 기준 컬럼 (기본: `reg_date`) |

---

## 7. ORM 전략 — JPA + MyBatis 하이브리드

| 역할 | 기술 | 이유 |
|---|---|---|
| SELECT (목록·페이징·단건) | MyBatis XML Mapper | 동적 WHERE·JOIN·정렬을 XML로 표현 |
| INSERT / UPDATE / DELETE | JPA `EntityManager.createNativeQuery()` | 트랜잭션 관리, flush 타이밍 제어 |
| 인증용 단순 조회 | JPA Repository | `SyUser` 엔티티 전용 |

`open-in-view: false` — OSIV 비활성화로 LazyLoading 범위를 Service 계층으로 제한.

---

## 8. 공통 응답 형식

모든 API 응답은 `ApiResponse<T>` 래퍼를 사용한다.

```json
// 성공
{ "ok": true, "status": 200, "data": { ... } }
{ "ok": true, "status": 201, "data": { ... } }          // 등록
{ "ok": true, "status": 200, "data": null, "message": "삭제되었습니다." }

// 페이지
{ "ok": true, "status": 200, "data": {
    "content": [...], "page": 1, "size": 20,
    "total": 150, "totalPages": 8
}}

// 오류
{ "ok": false, "status": 400, "message": "필수 항목 누락: member_email" }
{ "ok": false, "status": 401, "message": "인증이 필요합니다." }
{ "ok": false, "status": 500, "message": "서버 오류가 발생했습니다." }
```

---

## 9. 예외 처리

`GlobalExceptionHandler` (`@RestControllerAdvice`) 에서 전역 처리:

| 예외 | HTTP 상태 |
|---|---|
| `BusinessException` | 400 Bad Request |
| `EntityNotFoundException` | 404 Not Found |
| `MethodArgumentNotValidException` | 400 (Bean Validation 실패) |
| `AccessDeniedException` | 403 Forbidden |
| `RuntimeException` (그 외) | 500 Internal Server Error |

---

## 10. JPA + MyBatis 동시 트랜잭션 주의사항

- INSERT/UPDATE/DELETE 후 반드시 `em.flush()` 호출 → MyBatis SELECT 전 DB 반영 보장
- `@Transactional` 어노테이션은 Service 메서드에 선언. Controller 에서는 미사용
- 읽기 전용 메서드에 `@Transactional(readOnly = true)` 적용

---

## 11. 새 도메인 API 추가 가이드

AutoRest로 처리되지 않는 복잡한 비즈니스 로직이 필요한 경우 전용 Controller 를 추가한다.

### Step 1. 패키지 생성

```
domain/{dom}/
  entity/{DomEntity}.java       @Entity @Table 정의
controller/{DomController}.java  @RestController
service/{DomService}.java        @Service @Transactional
mapper/{DomMapper}.java          @Mapper (MyBatis)
dto/{DomRequest}.java            요청 VO
dto/{DomResponse}.java           응답 VO
```

### Step 2. Mapper XML 추가

`src/main/resources/mapper/{dom}/{DomMapper}.xml`  
`mybatis.mapper-locations: classpath:mapper/**/*.xml` 로 자동 스캔됨 — 별도 설정 불필요.

### Step 3. TableRegistry 에 등록 (AutoRest 연동 시)

```java
registry.put("테이블명", TableConfig.builder()
    .pkColumn("pk_col")
    .requiredFields(List.of("field1"))
    .searchFields(List.of("field1", "field2"))
    .build());
```

---

## 12. CORS 설정

`WebConfig.java` 에서 모든 origin 허용 (개발 환경).  
운영 배포 시 허용 origin 을 관리자 도메인으로 제한할 것.

```java
registry.addMapping("/**")
    .allowedOriginPatterns("*")
    .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
    .allowedHeaders("*")
    .allowCredentials(true);
```

---

## 13. 프로파일·환경변수

`application.yml` 의 `jwt.secret` 은 Base64 인코딩된 키.  
운영 환경에서는 환경변수로 주입할 것:

```bash
# 운영 배포 시 환경변수 주입 예시
SPRING_DATASOURCE_PASSWORD=...
JWT_SECRET=...
```

---

## 14. MyBatis `${}` 사용 금지 원칙

MyBatis XML 에서 `${}` (문자열 치환)는 **SQL 인젝션 위험** 때문에 **전면 사용 금지**.  
모든 값 바인딩은 반드시 `#{}` (PreparedStatement 파라미터)를 사용한다.

| 구분 | 표현식 | 설명 |
|---|---|---|
| ✅ 허용 | `#{memberId}` | PreparedStatement `?` 로 변환, SQL 인젝션 불가 |
| ❌ 금지 | `${memberId}` | 문자열 그대로 삽입, SQL 인젝션 가능 |

### 적용 방법

테이블명·컬럼명을 동적으로 받는 대신 **테이블별 전용 Mapper XML** 을 생성하여 테이블명·컬럼명을 XML 에 하드코딩한다.  
이 원칙이 §15(150개 Mapper) 구조의 근거다.

> **참고**: `AutoRestMapper.xml` 은 제네릭 편의 계층으로 내부적으로 `${}` 를 사용하나,  
> `TableRegistry` 화이트리스트·`isSafeIdentifier()` 검증으로 보완하고 있다.  
> 비즈니스 도메인 Mapper 에서는 절대 `${}` 를 사용하지 않는다.

---

## 14.5 Spring Data JPA `@Query` 작성 규칙

JPA Repository 인터페이스의 `@Query` 어노테이션 사용 시 다음 규칙을 따른다. JPQL·nativeQuery 공통.

### 14.5.1 파라미터는 **named 방식 (`:name` + `@Param`)** 사용

```java
// ✅ 권장 — named 방식
@Query(value = """
        WITH RECURSIVE t AS (
            SELECT path_id FROM sy_path WHERE path_id = :rootPathId
            UNION ALL
            SELECT c.path_id FROM sy_path c JOIN t ON c.parent_path_id = t.path_id
        ) SELECT path_id FROM t
        """, nativeQuery = true)
List<String> findTreePathIds(@Param("rootPathId") String rootPathId);

// ❌ 금지 — 위치 기반 `?1` 사용
@Query(value = "SELECT path_id FROM sy_path WHERE path_id = ?1", nativeQuery = true)
List<String> findTreePathIds(String rootPathId);
```

**이유**:
- **가독성**: 쿼리 내 `:rootPathId` 가 의미를 즉시 전달. `?1` 은 메서드 시그니처를 다시 봐야 의미 파악
- **변경 안전성**: 파라미터 순서가 바뀌어도 SQL 영향 없음. 위치 기반은 순서 변경 시 조용히 깨짐
- **재사용**: 동일 파라미터를 SQL 안에서 여러 번 참조 시 `:name` 한 곳만 정의. `?1` 을 여러 곳에 반복하면 오타 위험
- **`@Param` 명시**: `-parameters` 컴파일 옵션 의존 없이 안전 (Java 매개변수명 보존이 안 되는 환경 대비)

### 14.5.2 nativeQuery 사용 가이드

| 상황 | 사용 여부 |
|---|---|
| JPQL/QueryDSL 로 표현 가능한 단순 SELECT | ❌ JPQL 또는 QueryDSL Custom Repository 사용 |
| 동적 WHERE/JOIN 이 필요한 SELECT | ❌ QueryDSL `Q*RepositoryImpl` 에서 BooleanBuilder 로 구성 |
| 동적 WHERE 없는 복잡한 SELECT(목록·페이징) | ⚠️ MyBatis XML Mapper 권장 (§7) |
| `WITH RECURSIVE` (재귀 CTE) | ✅ `@Query(nativeQuery=true)` 가 가장 깔끔 |
| 윈도우 함수·DB 전용 함수 (gen_random_uuid, jsonb 등) | ✅ `@Query(nativeQuery=true)` |
| 대량 UPDATE/DELETE (Modifying) | ✅ `@Query(nativeQuery=true) @Modifying` |

### 14.5.3 nativeQuery 의 위치

- **Spring Data JPA Repository 인터페이스** (`*Repository.java`) 의 `@Query` 로 정의 — 가장 짧고 표준적
- ❌ `QSyPathRepository` (QueryDSL Custom) 인터페이스/구현체에 두지 않음 — QueryDSL 자리는 동적 DSL 쿼리 전용
- ❌ Service 안에서 `em.createNativeQuery(...)` 인라인 사용 금지 — Repository 로 추출하여 재사용·테스트 가능하게 유지

### 14.5.4 트리 자손 조회 — Repository 직접 주입

자기참조 트리(`sy_path`, `sy_dept`, `sy_menu`, `sy_role`, `sy_bbs`, `pd_category`, `cm_blog_cate`) 의 **루트 + 자손 ID 수집** 은 해당 Repository 의 `findTreeXxxIds` 메서드를 **직접 호출**한다. 별도 헬퍼 Service 를 거치지 않는다 — 중간 단계를 줄여 추적이 쉽다.

```java
// ✅ 다른 도메인 Repository 주입 — @RequiredArgsConstructor 로 충분
@RequiredArgsConstructor
public class QSyPropRepositoryImpl implements QSyPropRepository {
    private final JPAQueryFactory queryFactory;
    private final SyPathRepository syPathRepository;

    private BooleanBuilder buildCondition(SyPropDto.Request s) {
        ...
        if (StringUtils.hasText(s.getPathId()))
            w.and(p.pathId.in(syPathRepository.findTreePathIds(s.getPathId())));
        ...
    }
}

// ✅ 자기참조 (예: SyDept 가 SyDeptRepository 주입) — 빈 순환 회피용 @Lazy + 명시적 생성자
public class QSyDeptRepositoryImpl implements QSyDeptRepository {
    private final JPAQueryFactory queryFactory;
    private final SyDeptRepository syDeptRepository;

    public QSyDeptRepositoryImpl(JPAQueryFactory queryFactory,
                                 @Lazy SyDeptRepository syDeptRepository) {
        this.queryFactory = queryFactory;
        this.syDeptRepository = syDeptRepository;
    }
}
```

**주입 패턴 선택 규칙**:
- 다른 도메인 Repository 주입 → `@RequiredArgsConstructor` (lombok)
- **자기 도메인** Repository 주입 → 명시적 생성자 + `@Lazy` (순환 의존 회피)

자기참조가 발생하는 4개 파일 (`QSyDeptRepositoryImpl`, `QSyMenuRepositoryImpl`, `QSyRoleRepositoryImpl`, `QPdCategoryRepositoryImpl`) 만 명시적 생성자를 사용한다.

### 14.5.5 예시 위치

- [`SyPathRepository.findTreePathIds`](/_apps_be/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/base/sy/repository/SyPathRepository.java) — 재귀 CTE 표준 사례
- [`QSyDeptRepositoryImpl`](/_apps_be/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/base/sy/repository/qrydsl/impl/QSyDeptRepositoryImpl.java) — 자기참조 `@Lazy` 명시적 생성자 사례

---

## 14.6 QueryDSL `Q*RepositoryImpl` 표준 패턴

### 14.6.1 표준 예시 — [`QSyUserRepositoryImpl`](/_apps_be/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/base/sy/repository/qrydsl/impl/QSyUserRepositoryImpl.java)

이 파일이 신규/리팩토링 시 따라야 할 표준 모델이다.

### 14.6.2 섹션 6개 + 구분 주석

`Q*RepositoryImpl` 은 다음 6개 섹션을 이 순서로 배치하고, 각 진입부에 구분 주석을 둔다.

```java
public class QSyUserRepositoryImpl implements QSyUserRepository {

    /* ============================================================
     * [1] 의존성 주입 + Q-class (테이블 별칭)
     * ============================================================ */
    private final JPAQueryFactory queryFactory;
    private final SyDeptRepository syDeptRepository;
    private static final QSyUser syUser = QSyUser.syUser;
    // ... 단일 조인은 테이블명 그대로
    /* 같은 sy_code 테이블이 두 번 조인되므로 역할별 alias 부여 */
    private static final QSyCode syCode_userStatusCd = new QSyCode("code_userStatusCd");

    /* ============================================================
     * [2] 기본 쿼리 빌드 — SELECT + JOIN (조회 메서드들이 공유하는 base)
     * ============================================================ */
    private JPAQuery<SyUserDto.Item> buildBaseQuery() { ... }

    /* ============================================================
     * [3] 조회 메서드 — selectById / selectList / selectPageList / selectCount
     * 검색조건은 .where(andXxx(...), ...) 형태로 직접 나열
     * ============================================================ */
    public Optional<SyUserDto.Item> selectById(...) { ... }
    public List<SyUserDto.Item> selectList(...) { ... }
    public SyUserDto.PageResponse selectPageList(...) { ... }
    public long selectCount(...) { ... }

    /* ============================================================
     * [4] 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */
    private BooleanExpression andSiteId(SyUserDto.Request search) { ... }
    private BooleanExpression andDeptId(SyUserDto.Request search) { ... }
    // ...
    private BooleanExpression orLike(...) { ... }

    /* ============================================================
     * [5] 정렬조건 — sort 문자열 파싱 ("userId asc, regDate desc")
     * ============================================================ */
    private List<OrderSpecifier<?>> buildOrder(...) { ... }

    /* ============================================================
     * [6] 변경 메서드 — UPDATE (selective: null 이 아닌 필드만 SET)
     * ============================================================ */
    public int updateSelective(SyUser entity) { ... }
}
```

### 14.6.3 검색조건 패턴

1. **`buildCondition` 통합 메서드 금지** — `BooleanBuilder` 한 덩어리로 묶지 않는다
2. **각 조건은 개별 `andXxx()` 메서드** — 반환 타입 `BooleanExpression`, 조건 미충족 시 `null`
3. **각 `andXxx` 는 null-safe** — `search == null` 처리 (`return null`)
4. **메서드 파라미터 이름은 `search`** — Q-class 변수명(`s`=sySite 등) 과 충돌 방지
5. **`.where(...)` vararg 직접 나열** — null 자동 무시. content/count 쿼리 동일 목록 반복 나열로 시각적 일치 보장
6. **searchValue 다중 LIKE OR 은 `orLike(acc, all, types, token, path, pattern)` helper 사용** — 누적 OR 패턴

```java
// 호출처
.where(
        andSiteId(search),
        andDeptId(search),
        andStatus(search),
        andDateRange(search),
        andSearchValue(search)
)

// 정의
private BooleanExpression andSiteId(SyUserDto.Request search) {
    return search != null && StringUtils.hasText(search.getSiteId())
            ? syUser.siteId.eq(search.getSiteId()) : null;
}
```

### 14.6.4 Q-class 변수명 규칙

- 단일 조인 — **테이블명 그대로** (`syUser`, `sySite`)
- **같은 테이블 다회 조인** 시만 역할별 alias path (`syCode_userStatusCd`, `syCode_authMethodCd`)

---

## 14.7 Service `save` / `saveList` 표준 패턴

### 14.7.0 시그니처 — cmd 파라미터 (첫 번째 인자) 필수

`save` / `saveList` 의 **첫 번째 인자는 항상 `String cmd`** (API 마지막 path 세그먼트).

```java
public SyUser save(String cmd, SyUser entity)
public void   saveList(String cmd, List<SyUser> rows)
```

| cmd 값 | 의미 |
|---|---|
| `"base"` | 기본 동작 (`/save`, `/save-list`) — Controller 에서 명시적으로 `"base"` 전달 |
| `"pwd"`, `"order"` 등 | 특수 변형 — 같은 메서드 안에서 cmd 로 분기 |

Controller 매핑:
```java
@PostMapping("/save")             public ... saveDefault(@RequestBody Entity body)                  { service.save("base", body); }
@PostMapping("/save/{cmd}")       public ... saveCmd(@PathVariable("cmd") String cmd, @RequestBody Entity body) { service.save(cmd, body); }
@PostMapping("/save-list")        public ... saveList(@RequestBody List<Entity> rows)               { service.saveList("base", rows); }
@PostMapping("/save-list/{cmd}")  public ... saveListCmd(@PathVariable("cmd") String cmd, @RequestBody List<Entity> rows) { service.saveList(cmd, rows); }
```

**이유**:
- API URL 한 패턴(`/save/{cmd}` , `/save-list/{cmd}`) 으로 다양한 변형 표현
- Service 메서드 한 곳에서 cmd 로 분기 → 컨트롤러는 thin wrapper
- 기본 동작(`null` cmd) 과 변형이 동일 코드 베이스 공유

### 14.7.1 rowStatus 규약

| 입력 | 의미 | 처리 |
|---|---|---|
| `"I"` | Insert | userId 생성 + regBy/regDate 채움 → JPA save |
| `"U"` | Update | updBy 만 서버에서 채우고 `updateSelective` (SELECT 없이 UPDATE, updDate 는 Repository 가 DB CURRENT_TIMESTAMP 자동 적용) |
| `"D"` | Delete | 존재 검증 → deleteById |
| `"M"` | Merge (upsert) | userId 있으면 U, 없으면 I 로 정규화 |
| `null` / `""` / 공백 | (기본) | M 과 동일 처리 (userId 유무로 I/U) |
| 그 외 | 알 수 없음 | **예외 throw** (조용히 무시 금지) |

### 14.7.2 `save(String cmd, Entity entity)` 표준 — 단건 분기

cmd 분기는 **같은 메서드 안에서 if/else if 인라인** 처리. 알 수 없는 cmd 는 메서드 끝에서 예외 throw.

```java
@Transactional
public SyUser save(String cmd, SyUser entity) {
    if ("base".equals(cmd)) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank — userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getUserId() == null || entity.getUserId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getUserId() == null) throw new CmBizException("삭제 대상 userId 가 없습니다....");
            if (!syUserRepository.existsById(entity.getUserId())) throw new CmBizException("...");
            syUserRepository.deleteById(entity.getUserId());
            return null;   // @Transactional 종료 시 자동 flush
        } else if ("I".equals(rowStatus)) {
            entity.setUserId(CmUtil.generateId("sy_user"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            SyUser saved = syUserRepository.save(entity);
            if (saved == null) throw new CmBizException("...");
            return saved;   // @Transactional 종료 시 자동 flush
        } else if ("U".equals(rowStatus)) {
            if (entity.getUserId() == null) throw new CmBizException("수정 대상 userId 가 없습니다....");
            entity.setUpdBy(authId);
            /* updDate 는 Repository.updateSelective 가 DB CURRENT_TIMESTAMP 로 자동 채움 */
            int affected = syUserRepository.updateSelective(entity);
            if (affected == 0) throw new CmBizException("...");
            /* 벌크 UPDATE 후 직후 findById 가 stale 1차 캐시를 보지 않도록 clear 필수 */
            em.clear();
            return findById(entity.getUserId());
        }
        /* 안전망 — 정규화에서 모두 I/U/D 로 매핑되므로 도달 불가 */
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "...");
    }
    // else if ("pwd".equals(cmd)) {
    //     // 비밀번호 저장 전용 흐름
    //     ...
    // }
    throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
}
```

### 14.7.3 `saveList(String cmd, List<Entity> rows)` 표준 — 0단계 정규화 + DELETE/UPDATE/INSERT 단계별

cmd 분기는 **같은 메서드 안에서 if/else if 인라인** 처리. 알 수 없는 cmd 는 메서드 끝에서 예외 throw.

```java
@Transactional
public void saveList(String cmd, List<SyUser> rows) {
    if ("base".equals(cmd)) {
        /* 0단계: rowStatus 정규화 — M/null/blank → userId 유무로 I/U, I/U/D 외는 예외 */
        for (SyUser row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getUserId() == null || row.getUserId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "...");
            }
        }
        CmUtil.requireRowIds(rows, SyUser::getUserId, "U", "userId", this);
        CmUtil.requireRowIds(rows, SyUser::getUserId, "D", "userId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        syUserRepository.deleteAllById(deleteIds);

        // 2단계: UPDATE — updateSelective (updDate 는 Repository 가 DB CURRENT_TIMESTAMP 자동 적용)
        for (SyUser row : updateRows) {
            row.setUpdBy(authId);
            int affected = syUserRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("...");
        }

        // 3단계: INSERT — userId 생성 + audit 채움 + JPA save
        for (SyUser row : insertRows) {
            row.setUserId(CmUtil.generateId("sy_user"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syUserRepository.save(row);
        }

        /* 4단계: 영속성 컨텍스트 동기화 */
        em.flush();
        em.clear();
        return;
    }
    } else if ("order".equals(cmd)) {
        /* order 전용 — 행 드래그앤드롭 정렬 변경 시 sortOrd 만 일괄 UPDATE.
         *   - 입력 row 는 keyId + sortOrd 만 필수 (다른 필드는 무시)
         *   - rowStatus 검증 없음 — 호출자가 변경된 행만 보내야 함
         *   - updateSelective 가 null 필드를 건드리지 않으므로 안전 */
        CmUtil.requireRowIds(rows, SyUser::getUserId, "U", "userId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        for (SyUser row : rows) {
            if (row.getSortOrd() == null) continue;  // sortOrd 없으면 skip
            SyUser patch = new SyUser();
            patch.setUserId(row.getUserId());
            patch.setSortOrd(row.getSortOrd());
            patch.setUpdBy(authId);
            int affected = syUserRepository.updateSelective(patch);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getUserId() + "::" + CmUtil.svcCallerInfo(this));
        }
        em.flush();
        em.clear();
        return;
    }
    throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
}
```

**`order` 분기 - 클라이언트 호출과 짝을 이룬다**:
- URL: `POST /bo/{도메인}/{서브}/save-list/order`
- JS: `boApiSvc.xxx.saveList('order', sortChangedRows, '화면명', '순서변경')`
- 드롭 핸들러는 신규/삭제 행 제외 후 `{ keyId, sortOrd, rowStatus:'U' }` 만 전송
- 저장 성공 후 `handleSearchList()` 로 재조회 — 상세는 [`base.UX-admin.md`](base.UX-admin.md) §19.3

### 14.7.4 핵심 원칙

1. **UPDATE 는 `updateSelective`** — SELECT 없이 UPDATE 만, JPA 1차 캐시 우회. 대량 처리 시 SQL 횟수 50% 감소
2. **`updBy` 는 서버에서 채움** — `SecurityUtil.getAuthUser().authId()`
3. **`updDate` 는 Repository.updateSelective 가 DB CURRENT_TIMESTAMP 로 자동 적용** — 다중 WAS 시계 차이 회피, 트랜잭션 내 시점 일치. Service 에서 `setUpdDate(now)` 호출 불필요
   ```java
   // Repository
   update.set(syUser.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
   ```
4. **존재 검증** — `affected == 0` 으로 검사 (UPDATE) / `existsById` (DELETE)
5. **알 수 없는 rowStatus 는 예외** — 조용히 무시 금지 (정규화 빠짐을 즉시 감지)
6. **flush/clear 최소화** — `@Transactional` 종료 시 JPA 자동 flush 에 의존
   - `save()` D/I 분기 — `em.flush()/clear()` 불필요 (return 직후 트랜잭션 종료)
   - `save()` U 분기 — `em.clear()` 만 필수 (벌크 UPDATE 후 직후 findById 가 stale 1차 캐시 회피)
   - `saveList()` — 메서드 끝에 **1쌍만** (`em.flush(); em.clear();`). 단계별 flush/clear 금지

### 14.7.5 적용 현황 (2026-05-30)

| 상태 | 파일 |
|---|---|
| ✅ 신 표준 적용 | `QSyUserRepositoryImpl`, `SyUserService` |
| ⏳ 점진적 전환 대상 | 그 외 159 `Q*RepositoryImpl` + 165 `*Service` |

**일괄 변환 금지** — 사전 시도에서 대규모 sed 변환이 사고로 이어진 이력 있음. 신규 작성 시 본 표준 따르고, 기존 파일은 기능 수정·리뷰 시점에 함께 전환.

---

## 14.8 Controller `save` / `saveList` 엔드포인트 표준 패턴

### 14.8.1 4가지 엔드포인트 (필수)

`save` / `saveList` 와 짝을 이루는 Controller 는 다음 4가지 엔드포인트를 제공한다.

| 매핑 | 메서드명 | Service 호출 |
|---|---|---|
| `POST /save` | `saveDefault` | `service.save("base", entity)` |
| `POST /save/{cmd}` | `saveCmd` | `service.save(cmd, entity)` |
| `POST /save-list` | `saveList` | `service.saveList("base", rows)` |
| `POST /save-list/{cmd}` | `saveListCmd` | `service.saveList(cmd, rows)` |

### 14.8.2 표준 예시 — [`SyUserController`](/_apps_be/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/base/sy/controller/SyUserController.java)

```java
/** save — rowStatus 단건 분기 저장 (기본) */
@PostMapping("/save")
public ResponseEntity<ApiResponse<SyUser>> saveDefault(@RequestBody SyUser entity) {
    SyUser result = service.save("base", entity);
    return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
}

/** save — rowStatus 단건 분기 저장 (cmd 변형: pwd 등) */
@PostMapping("/save/{cmd}")
public ResponseEntity<ApiResponse<SyUser>> saveCmd(
        @PathVariable("cmd") String cmd, @RequestBody SyUser entity) {
    SyUser result = service.save(cmd, entity);
    return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
}

/** saveList — 일괄 저장 (기본) */
@PostMapping("/save-list")
public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyUser> rows) {
    service.saveList("base", rows);
    return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
}

/** saveList — 일괄 저장 (cmd 변형: order 등) */
@PostMapping("/save-list/{cmd}")
public ResponseEntity<ApiResponse<Void>> saveListCmd(
        @PathVariable("cmd") String cmd, @RequestBody List<SyUser> rows) {
    service.saveList(cmd, rows);
    return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
}
```

### 14.8.3 핵심 원칙

1. **`null` cmd 금지** — 기본 엔드포인트도 `"base"` 명시 전달 (의도 명확화)
2. **메서드명 규약** — `saveDefault`/`saveCmd`/`saveList`/`saveListCmd`. 시그니처 충돌 회피
3. **BO Wrapper Service 도 동일 시그니처** — `BoSyUserService.save(String cmd, ...)` / `saveList(String cmd, ...)`
4. **BO Controller 도 동일 4개 엔드포인트** — [`BoSyUserController`](/_apps_be/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/bo/sy/controller/BoSyUserController.java)

### 14.8.4 cmd 활용 예시

| 도메인 | cmd | 용도 |
|---|---|---|
| sy_user | `pwd` | 비밀번호 변경 전용 (`POST /save/pwd`) |
| pd_category | `order` | 정렬 순서 일괄 변경 (`POST /save-list/order`) |
| sy_role | `clone` | 역할 복제 (`POST /save/clone`) |

같은 entity 의 다양한 변형 동작을 URL 한 패턴으로 표현.

---

## 14.9 신규 SyUser 표준 모델 — 통합 적용 체크리스트

신규 도메인 작성 또는 기존 파일 리팩토링 시 다음 체크리스트를 따른다.

### 14.9.1 Repository (`Q*RepositoryImpl`) — §14.6

- [ ] 섹션 6개 구분 주석 (`/* === [N] 이름 === */`)
- [ ] `buildCondition` 통합 메서드 **없음**
- [ ] 개별 `andXxx()` BooleanExpression 메서드 (null-safe, 파라미터명 `search`)
- [ ] `.where(andXxx(s), ...)` 직접 나열 (content + count 동일 목록)
- [ ] `orLike(...)` 누적 OR helper
- [ ] Q-class 변수명 = 테이블명, 같은 테이블 다회 조인만 alias
- [ ] `updateSelective`: `updDate` DB CURRENT_TIMESTAMP 자동 적용

### 14.9.2 Service (`*Service`) — §14.7

- [ ] `save(String cmd, Entity entity)` / `saveList(String cmd, List<Entity> rows)` 시그니처
- [ ] cmd 분기 **인라인** (private 메서드 분리 X)
- [ ] `"base"` 기본 분기, 알 수 없는 cmd 는 throw
- [ ] rowStatus I/U/D/M + M/null/blank → userId 유무로 I/U
- [ ] UPDATE 는 `updateSelective` 사용
- [ ] `updBy` 만 서버에서, `updDate` 는 Repository 가 DB 시간 자동
- [ ] flush/clear 최소화 (save D/I 분기 0, U 분기 clear만, saveList 메서드 끝 1쌍만)

### 14.9.3 Controller (`*Controller`) — §14.8

- [ ] 4개 엔드포인트 (`POST /save`, `/save/{cmd}`, `/save-list`, `/save-list/{cmd}`)
- [ ] 메서드명: `saveDefault`, `saveCmd`, `saveList`, `saveListCmd`
- [ ] `"base"` 명시 전달 (null 금지)
- [ ] BO Wrapper Service / BO Controller 도 동일 패턴

### 14.9.4 표준 모델 3개

이 세 파일을 참조 모델로 사용:
- [`QSyUserRepositoryImpl.java`](/_apps_be/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/base/sy/repository/qrydsl/impl/QSyUserRepositoryImpl.java)
- [`SyUserService.java`](/_apps_be/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyUserService.java)
- [`SyUserController.java`](/_apps_be/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/base/sy/controller/SyUserController.java) + [`BoSyUserController.java`](/_apps_be/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/bo/sy/controller/BoSyUserController.java)

---

## 15. Domain 계층 — 150개 Entity + 150개 Mapper 구조

### 15.1 설계 원칙

- DDL 테이블 1개 = **Entity 1개** + **Mapper 인터페이스 1개** + **Mapper XML 1개**
- `sy_user` 는 인증 전용 엔티티가 이미 존재하므로 제외 (149개 신규 생성)
- 히스토리 테이블(`mbh_*`, `odh_*`, `pdh_*`, `cmh_*`, `syh_*`)은 기본 도메인 패키지에 포함
- JOIN 이 필요한 모든 조회는 전용 Mapper XML 에 하드코딩 (`${}` 금지)

### 15.2 패키지 매핑

| DDL 폴더 | 도메인 | Java Entity | Mapper 인터페이스 | Mapper XML |
|---|---|---|---|---|
| `ddl_pgsql/ec/` + `cmh_*` | `cm` | `domain.cm.entity.*` | `mapper.cm.*Mapper` | `mapper/cm/*.xml` |
| `ddl_pgsql/ec/` | `dp` | `domain.dp.entity.*` | `mapper.dp.*Mapper` | `mapper/dp/*.xml` |
| `ddl_pgsql/ec/` + `mbh_*` | `mb` | `domain.mb.entity.*` | `mapper.mb.*Mapper` | `mapper/mb/*.xml` |
| `ddl_pgsql/ec/` + `odh_*` | `od` | `domain.od.entity.*` | `mapper.od.*Mapper` | `mapper/od/*.xml` |
| `ddl_pgsql/ec/` + `pdh_*` | `pd` | `domain.pd.entity.*` | `mapper.pd.*Mapper` | `mapper/pd/*.xml` |
| `ddl_pgsql/ec/` | `pm` | `domain.pm.entity.*` | `mapper.pm.*Mapper` | `mapper/pm/*.xml` |
| `ddl_pgsql/ec/` | `st` | `domain.st.entity.*` | `mapper.st.*Mapper` | `mapper/st/*.xml` |
| `ddl_pgsql/sy/` + `syh_*` | `sy` | `domain.sy.entity.*` | `mapper.sy.*Mapper` | `mapper/sy/*.xml` |

### 15.3 Entity 표준 형식 (코드 생성 기준)

테이블 DDL 컬럼을 그대로 Java 필드로 변환. 테이블명·컬럼명은 하드코딩.

```java
// domain/mb/entity/MbMember.java
@Entity
@Table(name = "mb_member", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class MbMember {

    @Id
    @Column(name = "member_id", nullable = false)
    private String memberId;

    @Column(name = "member_email", nullable = false)
    private String memberEmail;

    @Column(name = "member_nm", nullable = false)
    private String memberNm;

    @Column(name = "grade_cd")
    private String gradeCd;

    @Column(name = "member_status_cd")
    private String memberStatusCd;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    // ... DDL 의 모든 컬럼 명시
}
```

**SQL 타입 → Java 타입 변환 기준**

| SQL 타입 | Java 타입 |
|---|---|
| `VARCHAR`, `CHAR`, `TEXT`, `JSONB` | `String` |
| `INTEGER`, `SMALLINT` | `Integer` |
| `BIGINT` | `Long` |
| `BOOLEAN` | `Boolean` |
| `DATE` | `LocalDate` |
| `TIMESTAMP` | `LocalDateTime` |
| `DECIMAL`, `NUMERIC` | `BigDecimal` |

### 15.4 Mapper 인터페이스 표준 형식 (코드 생성 기준)

```java
// mapper/mb/MbMemberMapper.java
@Mapper
public interface MbMemberMapper {

    // 목록 조회 (기본 JOIN 포함 — _cd_nm, FK 원장 포함)
    List<RowMap> selectList(@Param("p") QueryParam p);
    long         selectCount(@Param("p") QueryParam p);

    // 단건 조회 (FK 원장 상세 + 자식 목록 포함)
    RowMap selectById(@Param("id") String id);

    // 쓰기 (Entity 타입 명시)
    int insert(MbMember entity);
    int update(MbMember entity);
    int updateSelective(MbMember entity);   // null 필드 제외 UPDATE
    int deleteById(@Param("id") String id);
}
```

---

## 16. 조회 기본 생성 3원칙

테이블당 Mapper XML 을 생성할 때 아래 3가지 패턴을 **기본 포함**한다.  
개발자는 이 기본 쿼리를 바탕으로 도메인별 요구사항에 맞게 커스텀한다.

---

### 원칙 1 — `_cd` 컬럼 → `_cd_nm` 코드명 포함

상태·분류 코드 컬럼(`*_cd`)은 `sy_code` 테이블과 JOIN 하여 코드명(`*_cd_nm`)을 함께 반환한다.

**코드 조회 구조**
```
sy_code_grp (code_grp VARCHAR PK)
  └─ sy_code (code_grp FK, code_value, code_label)
```

**Mapper XML 패턴**

```xml
<!-- mapper/mb/MbMemberMapper.xml -->
<select id="selectList" resultType="com.shopjoy.ecadminapi.autorest.dto.RowMap">
  SELECT
    t.*,
    -- ① _cd → _cd_nm : sy_code JOIN 으로 코드명 포함
    cd_grade.code_label       AS grade_cd_nm,
    cd_status.code_label      AS member_status_cd_nm
  FROM shopjoy_2604.mb_member t
    LEFT JOIN shopjoy_2604.sy_code cd_grade
        ON cd_grade.code_grp = 'MEMBER_GRADE'
       AND cd_grade.code_value = t.grade_cd
    LEFT JOIN shopjoy_2604.sy_code cd_status
        ON cd_status.code_grp = 'MEMBER_STATUS'
       AND cd_status.code_value = t.member_status_cd
  <where>
    <if test="p.searchValue != null and p.searchValue != ''">
      AND (t.member_nm    ILIKE '%' || #{p.searchValue} || '%'
        OR t.member_email ILIKE '%' || #{p.searchValue} || '%'
        OR t.member_phone ILIKE '%' || #{p.searchValue} || '%')
    </if>
    <if test="p.siteId != null and p.siteId != ''">
      AND t.site_id = #{p.siteId}
    </if>
    <if test="p.status != null and p.status != ''">
      AND t.member_status_cd = #{p.status}
    </if>
    <if test="p.dateStart != null and p.dateStart != ''">
      AND t.reg_date &gt;= #{p.dateStart}::DATE
    </if>
    <if test="p.dateEnd != null and p.dateEnd != ''">
      AND t.reg_date &lt; (#{p.dateEnd}::DATE + INTERVAL '1 day')
    </if>
  </where>
  ORDER BY t.reg_date DESC
  LIMIT #{p.limit} OFFSET #{p.offset}
</select>
```

**응답 예시**

```json
{
  "member_id": "MB001",
  "grade_cd": "VIP",
  "grade_cd_nm": "VIP회원",
  "member_status_cd": "ACTIVE",
  "member_status_cd_nm": "활성"
}
```

---

### 원칙 2 — `_id` FK 컬럼 → 참조 원장 정보 포함

FK 컬럼(`*_id`)은 참조 테이블과 LEFT JOIN 하여 핵심 컬럼(이름·코드 등)을 함께 반환한다.  
`#{}` 만 사용하고 테이블명·컬럼명은 XML 에 하드코딩.

**Mapper XML 패턴**

```xml
<!-- mapper/pd/PdProdMapper.xml -->
<select id="selectList" resultType="com.shopjoy.ecadminapi.autorest.dto.RowMap">
  SELECT
    t.*,
    -- ② _id FK → 원장 정보 포함
    br.brand_nm,
    vd.vendor_nm,
    vd.vendor_no,
    cat.category_nm,
    -- ① _cd → _cd_nm
    cd_status.code_label  AS prod_status_cd_nm
  FROM shopjoy_2604.pd_prod t
    LEFT JOIN shopjoy_2604.sy_brand    br  ON br.brand_id   = t.brand_id
    LEFT JOIN shopjoy_2604.sy_vendor   vd  ON vd.vendor_id  = t.vendor_id
    LEFT JOIN shopjoy_2604.pd_category cat ON cat.category_id = t.category_id
    LEFT JOIN shopjoy_2604.sy_code     cd_status
        ON cd_status.code_grp = 'PROD_STATUS'
       AND cd_status.code_value = t.prod_status_cd
  <where>
    <if test="p.searchValue != null and p.searchValue != ''">
      AND (t.prod_nm ILIKE '%' || #{p.searchValue} || '%'
        OR t.prod_cd ILIKE '%' || #{p.searchValue} || '%')
    </if>
    <if test="p.siteId != null and p.siteId != ''">
      AND t.site_id = #{p.siteId}
    </if>
    <if test="p.status != null and p.status != ''">
      AND t.prod_status_cd = #{p.status}
    </if>
  </where>
  ORDER BY t.reg_date DESC
  LIMIT #{p.limit} OFFSET #{p.offset}
</select>
```

**단건 조회 — FK 원장 전체 상세 포함**

```xml
<select id="selectById" resultType="com.shopjoy.ecadminapi.autorest.dto.RowMap">
  SELECT
    t.*,
    br.brand_nm,   br.brand_logo_url,
    vd.vendor_nm,  vd.vendor_no,   vd.vendor_tel,
    cat.category_nm, cat.category_depth,
    cd_status.code_label AS prod_status_cd_nm
  FROM shopjoy_2604.pd_prod t
    LEFT JOIN shopjoy_2604.sy_brand    br  ON br.brand_id    = t.brand_id
    LEFT JOIN shopjoy_2604.sy_vendor   vd  ON vd.vendor_id   = t.vendor_id
    LEFT JOIN shopjoy_2604.pd_category cat ON cat.category_id = t.category_id
    LEFT JOIN shopjoy_2604.sy_code     cd_status
        ON cd_status.code_grp = 'PROD_STATUS'
       AND cd_status.code_value = t.prod_status_cd
  WHERE t.prod_id = #{id}
</select>
```

**응답 예시**

```json
{
  "prod_id": "PD001",
  "prod_nm": "반팔티셔츠",
  "brand_id": "BR001",
  "brand_nm": "나이키",
  "vendor_id": "VD001",
  "vendor_nm": "글로벌스포츠",
  "vendor_no": "V001",
  "prod_status_cd": "ON_SALE",
  "prod_status_cd_nm": "판매중"
}
```

---

### 원칙 3 — 내 PK 로부터 자식 테이블 목록 포함 (단건 조회)

`selectById` 에서 부모 레코드와 함께 자식 테이블 목록을 **하나의 응답**으로 반환한다.  
자식 키는 `_테이블명` 으로 중첩.

**Service 패턴 (조합 조회)**

```java
// 방법 A: Service 에서 직접 조합
@Transactional(readOnly = true)
public RowMap getOrderById(String orderId) {
    RowMap order = odOrderMapper.selectById(orderId);     // 주문 + FK 원장 + 코드명
    if (order == null) return null;

    order.put("_od_order_item",  odOrderItemMapper.selectByOrderId(orderId));
    order.put("_od_pay",         odPayMapper.selectByOrderId(orderId));
    order.put("_od_dliv",        odDlivMapper.selectByOrderId(orderId));
    return order;
}
```

**자식 Mapper XML 패턴**

```xml
<!-- mapper/od/OdOrderItemMapper.xml -->
<select id="selectByOrderId" resultType="com.shopjoy.ecadminapi.autorest.dto.RowMap">
  SELECT
    oi.*,
    -- ① _cd_nm
    cd_claim.code_label  AS claim_status_cd_nm,
    -- ② FK 원장
    p.prod_nm,
    p.prod_img_url,
    s.sku_code
  FROM shopjoy_2604.od_order_item oi
    LEFT JOIN shopjoy_2604.pd_prod     p   ON p.prod_id   = oi.prod_id
    LEFT JOIN shopjoy_2604.pd_prod_sku s   ON s.sku_id    = oi.sku_id
    LEFT JOIN shopjoy_2604.sy_code     cd_claim
        ON cd_claim.code_grp = 'CLAIM_STATUS'
       AND cd_claim.code_value = oi.claim_status_cd
  WHERE oi.order_id = #{orderId}
  ORDER BY oi.sort_ord ASC
</select>
```

**응답 구조**

```json
GET /api/od/order/{orderId}

{
  "order_id": "OD001",
  "member_id": "MB001",
  "member_nm": "홍길동",
  "order_status_cd": "PAID",
  "order_status_cd_nm": "결제완료",
  "site_id": "S01",
  "site_nm": "쇼핑몰A",
  "_od_order_item": [
    {
      "order_item_id": "OI001",
      "prod_id": "PD001",
      "prod_nm": "반팔티셔츠",
      "prod_img_url": "/img/prod/001.jpg",
      "sku_code": "BLK-M",
      "order_qty": 2,
      "item_order_amt": 39000,
      "claim_status_cd": null,
      "claim_status_cd_nm": null
    }
  ],
  "_od_pay": [
    { "pay_id": "PAY001", "pay_method_cd": "CARD", "pay_amt": 59000, "pay_status_cd": "COMPLT" }
  ],
  "_od_dliv": [
    { "dliv_id": "DLV001", "outbound_courier_cd": "CJ", "outbound_tracking_no": "123456789" }
  ]
}
```

---

## 17. 전체 흐름 — 개발자 커스텀 가이드

### 17.1 코드 자동 생성 후 커스텀 대상

자동 생성(`gen_entities.py`)으로 만들어진 파일에서 개발자가 수정해야 할 항목:

| 파일 | 기본 생성 내용 | 개발자 커스텀 |
|---|---|---|
| `{Class}Mapper.xml` | 단순 `SELECT t.*` + 기본 WHERE | 원칙 1,2,3 JOIN 추가 |
| `{Class}Mapper.java` | 7개 기본 메서드 | 도메인 전용 메서드 추가 |
| `{Class}.java` (Entity) | DDL 컬럼 → Java 필드 | 수정 불필요 (생성 그대로 사용) |

### 17.2 커스텀 우선순위

```
높음  ① 목록·단건에 _cd_nm, FK 원장 컬럼 추가 (원칙 1, 2)
      ② 단건에 자식 테이블 목록 추가 (원칙 3)
      ③ 도메인 특화 검색 조건 추가
낮음  ④ 집계·통계 전용 쿼리 추가
```

### 17.3 완성된 Mapper XML 예시 — OdOrderMapper.xml (전체)

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.shopjoy.ecadminapi.mapper.od.OdOrderMapper">

  <!-- ================================================================
       목록 조회 — 코드명 + FK 원장 포함
       ================================================================ -->
  <select id="selectList" resultType="com.shopjoy.ecadminapi.autorest.dto.RowMap">
    SELECT
      o.*,
      m.member_nm,     m.member_email,
      s.site_nm,
      cd_status.code_label  AS order_status_cd_nm,
      cd_pay.code_label     AS pay_method_cd_nm
    FROM shopjoy_2604.od_order o
      LEFT JOIN shopjoy_2604.mb_member  m  ON m.member_id = o.member_id
      LEFT JOIN shopjoy_2604.sy_site    s  ON s.site_id   = o.site_id
      LEFT JOIN shopjoy_2604.od_pay     py ON py.order_id = o.order_id
      LEFT JOIN shopjoy_2604.sy_code    cd_status
          ON cd_status.code_grp = 'ORDER_STATUS'
         AND cd_status.code_value = o.order_status_cd
      LEFT JOIN shopjoy_2604.sy_code    cd_pay
          ON cd_pay.code_grp = 'PAY_METHOD'
         AND cd_pay.code_value = py.pay_method_cd
    <where>
      <if test="p.siteId != null and p.siteId != ''">AND o.site_id = #{p.siteId}</if>
      <if test="p.status != null and p.status != ''">AND o.order_status_cd = #{p.status}</if>
      <if test="p.searchValue != null and p.searchValue != ''">
        AND (o.order_id::TEXT ILIKE '%' || #{p.searchValue} || '%'
          OR m.member_nm    ILIKE '%' || #{p.searchValue} || '%'
          OR m.member_email ILIKE '%' || #{p.searchValue} || '%')
      </if>
      <if test="p.dateStart != null and p.dateStart != ''">AND o.reg_date &gt;= #{p.dateStart}::DATE</if>
      <if test="p.dateEnd   != null and p.dateEnd   != ''">AND o.reg_date &lt;  (#{p.dateEnd}::DATE + INTERVAL '1 day')</if>
    </where>
    ORDER BY o.reg_date DESC
    LIMIT #{p.limit} OFFSET #{p.offset}
  </select>

  <select id="selectCount" resultType="long">
    SELECT COUNT(*)
    FROM shopjoy_2604.od_order o
      LEFT JOIN shopjoy_2604.mb_member m ON m.member_id = o.member_id
    <where>
      <if test="p.siteId != null and p.siteId != ''">AND o.site_id = #{p.siteId}</if>
      <if test="p.status != null and p.status != ''">AND o.order_status_cd = #{p.status}</if>
      <if test="p.searchValue != null and p.searchValue != ''">
        AND (o.order_id::TEXT ILIKE '%' || #{p.searchValue} || '%'
          OR m.member_nm ILIKE '%' || #{p.searchValue} || '%')
      </if>
      <if test="p.dateStart != null and p.dateStart != ''">AND o.reg_date &gt;= #{p.dateStart}::DATE</if>
      <if test="p.dateEnd   != null and p.dateEnd   != ''">AND o.reg_date &lt;  (#{p.dateEnd}::DATE + INTERVAL '1 day')</if>
    </where>
  </select>

  <!-- ================================================================
       단건 조회 — FK 원장 상세 포함
       ================================================================ -->
  <select id="selectById" resultType="com.shopjoy.ecadminapi.autorest.dto.RowMap">
    SELECT
      o.*,
      m.member_nm,     m.member_email,    m.member_phone,
      s.site_nm,
      cd_status.code_label  AS order_status_cd_nm
    FROM shopjoy_2604.od_order o
      LEFT JOIN shopjoy_2604.mb_member m ON m.member_id = o.member_id
      LEFT JOIN shopjoy_2604.sy_site   s ON s.site_id   = o.site_id
      LEFT JOIN shopjoy_2604.sy_code   cd_status
          ON cd_status.code_grp = 'ORDER_STATUS'
         AND cd_status.code_value = o.order_status_cd
    WHERE o.order_id = #{id}
  </select>

  <!-- ================================================================
       자식 조회 — 주문에 속한 주문상품 목록 (Service 에서 별도 호출)
       ================================================================ -->
  <select id="selectItemsByOrderId" resultType="com.shopjoy.ecadminapi.autorest.dto.RowMap">
    SELECT
      oi.*,
      p.prod_nm,         p.prod_img_url,
      sk.sku_code,
      cd_claim.code_label  AS claim_status_cd_nm
    FROM shopjoy_2604.od_order_item oi
      LEFT JOIN shopjoy_2604.pd_prod     p   ON p.prod_id  = oi.prod_id
      LEFT JOIN shopjoy_2604.pd_prod_sku sk  ON sk.sku_id  = oi.sku_id
      LEFT JOIN shopjoy_2604.sy_code     cd_claim
          ON cd_claim.code_grp = 'CLAIM_STATUS'
         AND cd_claim.code_value = oi.claim_status_cd
    WHERE oi.order_id = #{orderId}
    ORDER BY oi.sort_ord ASC
  </select>

  <!-- 쓰기 -->
  <insert id="insert" parameterType="com.shopjoy.ecadminapi.domain.od.entity.OdOrder">
    INSERT INTO shopjoy_2604.od_order
      (order_id, site_id, member_id, total_amt, order_status_cd, reg_by, reg_date)
    VALUES
      (#{orderId}, #{siteId}, #{memberId}, #{totalAmt}, #{orderStatusCd}, #{regBy}, #{regDate})
  </insert>

  <update id="updateSelective" parameterType="com.shopjoy.ecadminapi.domain.od.entity.OdOrder">
    UPDATE shopjoy_2604.od_order
    <set>
      <if test="orderStatusCd != null">order_status_cd = #{orderStatusCd},</if>
      <if test="updBy != null">upd_by = #{updBy},</if>
      <if test="updDate != null">upd_date = #{updDate},</if>
    </set>
    WHERE order_id = #{orderId}
  </update>

  <delete id="deleteById">
    DELETE FROM shopjoy_2604.od_order WHERE order_id = #{id}
  </delete>

</mapper>
```

### 17.4 도메인별 자주 쓰는 자식 조회 패턴

| 부모 테이블 | 자식 목록 | Service 조합 메서드 |
|---|---|---|
| `od_order` | `od_order_item`, `od_pay`, `od_dliv`, `od_claim` | `getOrderById(orderId)` |
| `pd_prod` | `pd_prod_sku`, `pd_prod_opt`, `pd_prod_img`, `pd_prod_content` | `getProdById(prodId)` |
| `mb_member` | `mb_member_addr`, 최근 주문 10건 | `getMemberById(memberId)` |
| `pm_coupon` | `pm_coupon_issue`, `pm_coupon_item` | `getCouponById(couponId)` |
| `dp_ui` | `dp_ui_area` → `dp_area` → `dp_area_panel` → `dp_panel` | `getUiById(uiId)` |

---

## 관련 정책

- `base.인증-admin.md` — 관리자 인증 흐름 (프론트엔드 관점)
- `base.권한-admin.md` — RBAC 역할·메뉴 접근 제어
- `sy.04.사용자.md` — sy_user 계정 관리
- `sy.51.프로그램설계정책.md` — 전체 설계 원칙
- `sy.52.ddl단어사전규칙.md` — DDL 컬럼명 표준
