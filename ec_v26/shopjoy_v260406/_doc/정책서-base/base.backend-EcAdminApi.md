---
정책명: 백엔드 API 서버 (EcAdminApi) 설계 정책
정책번호: base-backend-EcAdminApi
관리자: 개발팀
최종수정: 2026-04-20
---

# 백엔드 API 서버 (EcAdminApi) 설계 정책

## 1. 개요

`_apps/EcAdminApi` — Spring Boot 3.2 기반 관리자 전용 REST API 서버.  
관리자 프론트(`admin.html`)의 `window.adminApi`(axios 래퍼)가 이 서버를 호출한다.

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
│       ├─ SearchRequest.java          검색 파라미터 (kw, filters, date, siteId, status, page, size …)
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
│   │   └─ PageResult<T>              페이지 결과 { content, page, size, total, totalPages }
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
| `kw` | String | 키워드 (searchFields 대상 ILIKE) |
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

## 15. Domain 계층 — 150개 Entity + 150개 Mapper 구조

### 15.1 설계 원칙

- DDL 테이블 1개 = **Entity 1개** + **Mapper 인터페이스 1개** + **Mapper XML 1개**
- `sy_user` 는 인증 전용 엔티티가 이미 존재하므로 제외 (149개 신규 생성)
- 히스토리 테이블(`mbh_*`, `odh_*`, `pdh_*`, `cmh_*`, `syh_*`)은 기본 도메인 패키지에 포함
- JOIN 이 필요한 모든 조회는 전용 Mapper XML 에 하드코딩 (`${}` 금지)

### 15.2 패키지 매핑

| DDL 폴더 | 도메인 | Java Entity | Mapper 인터페이스 | Mapper XML |
|---|---|---|---|---|
| `ddlPgsql-ec-cm/` + `cmh_*` | `cm` | `domain.cm.entity.*` | `mapper.cm.*Mapper` | `mapper/cm/*.xml` |
| `ddlPgsql-ec-dp/` | `dp` | `domain.dp.entity.*` | `mapper.dp.*Mapper` | `mapper/dp/*.xml` |
| `ddlPgsql-ec-mb/` + `mbh_*` | `mb` | `domain.mb.entity.*` | `mapper.mb.*Mapper` | `mapper/mb/*.xml` |
| `ddlPgsql-ec-od/` + `odh_*` | `od` | `domain.od.entity.*` | `mapper.od.*Mapper` | `mapper/od/*.xml` |
| `ddlPgsql-ec-pd/` + `pdh_*` | `pd` | `domain.pd.entity.*` | `mapper.pd.*Mapper` | `mapper/pd/*.xml` |
| `ddlPgsql-ec-pm/` | `pm` | `domain.pm.entity.*` | `mapper.pm.*Mapper` | `mapper/pm/*.xml` |
| `ddlPgsql-ec-st/` | `st` | `domain.st.entity.*` | `mapper.st.*Mapper` | `mapper/st/*.xml` |
| `ddlPgsql-sy/` + `syh_*` | `sy` | `domain.sy.entity.*` | `mapper.sy.*Mapper` | `mapper/sy/*.xml` |

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
    <if test="p.kw != null and p.kw != ''">
      AND (t.member_nm    ILIKE '%' || #{p.kw} || '%'
        OR t.member_email ILIKE '%' || #{p.kw} || '%'
        OR t.member_phone ILIKE '%' || #{p.kw} || '%')
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
    <if test="p.kw != null and p.kw != ''">
      AND (t.prod_nm ILIKE '%' || #{p.kw} || '%'
        OR t.prod_cd ILIKE '%' || #{p.kw} || '%')
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
      <if test="p.kw != null and p.kw != ''">
        AND (o.order_id::TEXT ILIKE '%' || #{p.kw} || '%'
          OR m.member_nm    ILIKE '%' || #{p.kw} || '%'
          OR m.member_email ILIKE '%' || #{p.kw} || '%')
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
      <if test="p.kw != null and p.kw != ''">
        AND (o.order_id::TEXT ILIKE '%' || #{p.kw} || '%'
          OR m.member_nm ILIKE '%' || #{p.kw} || '%')
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
