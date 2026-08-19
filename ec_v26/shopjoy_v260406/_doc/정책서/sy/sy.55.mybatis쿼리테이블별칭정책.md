---
정책명: MyBatis SQL 쿼리 테이블 별칭 및 컬럼 모호성 제거 정책
정책번호: 910
관리자: 개발팀
최종수정: 2026-04-29
---

# 910. MyBatis SQL 쿼리 테이블 별칭 및 컬럼 모호성 제거 정책

## 목적

MyBatis XML 매퍼의 SQL 쿼리에서 JOIN 조건과 WHERE 절의 컬럼 참조를 명확히 하여 PostgreSQL의 "ambiguous column reference" 에러를 방지하고, 쿼리 가독성 및 유지보수성을 향상시킨다.

## 기본 원칙

### 1. 모든 SELECT 쿼리에 명시적 테이블 별칭 적용

**정의**: 조인된 모든 테이블에 명시적 별칭(alias)을 부여하고, SELECT 절과 WHERE 절의 모든 컬럼 참조에 별칭을 접두어로 붙인다.

**규칙**:
- **주 테이블(FROM)**: 도메인에 따라 관례적 별칭 사용 (예: `pd_prod p`, `od_order o`, `mb_member m`)
- **조인 테이블**: 명시적이고 구분 가능한 약자 사용 (예: `pd_category cat`, `sy_brand b`, `sy_code cd_ps`)
- **테이블 별칭이 없는 경우**: 기본값으로 `a` 사용

### 2. JOIN ON 조건의 컬럼 명시성

**정의**: LEFT/RIGHT/INNER JOIN의 ON 절에서 좌측(조인 대상 테이블)과 우측(조인될 테이블의 외래키) 모두에 테이블 별칭을 붙인다.

**기본 패턴**:
```xml
<!-- ❌ 잘못된 예: 우측 컬럼에 별칭 없음 (모호성 발생) -->
<sql id="pdProdCond">
    <where>
        <if test="status != null">AND prod_status_cd = #{status}</if>
    </where>
</sql>

<select id="selectList">
    SELECT p.*
    FROM pd_prod p
        LEFT JOIN sy_code cd_ps 
            ON cd_ps.code_grp = 'PRODUCT_STATUS' AND cd_ps.code_value = prod_status_cd
</select>

<!-- ✅ 올바른 예: 우측 컬럼에도 별칭 붙임 -->
<sql id="pdProdCond">
    <where>
        <if test="status != null">AND p.prod_status_cd = #{status}</if>
    </where>
</sql>

<select id="selectList">
    SELECT p.*
    FROM pd_prod p
        LEFT JOIN sy_code cd_ps 
            ON cd_ps.code_grp = 'PRODUCT_STATUS' AND cd_ps.code_value = p.prod_status_cd
</select>
```

### 3. SELECT 절의 컬럼 명시성

**정의**: SELECT 절의 모든 컬럼이 명시적으로 테이블 별칭을 포함해야 한다.

**규칙**:
- **와일드카드**: `SELECT *` → `SELECT p.*` (테이블 별칭 필수)
- **JOIN 테이블 컬럼**: 모든 컬럼을 명시적으로 나열 (와일드카드 대신)
- **AS 별칭**: 필요시 결과 컬럼명 지정

**패턴**:
```xml
<!-- ❌ 잘못된 예1: 모호한 * 와일드카드 -->
<select id="selectById">
    SELECT  *
          , cat.category_nm AS cate_nm
          , b.brand_nm
    FROM pd_prod p
        LEFT JOIN pd_category cat ON cat.category_id = category_id
</select>

<!-- ❌ 잘못된 예2: JOIN 테이블의 와일드카드 -->
<select id="selectAddrsByMemberId">
    SELECT * FROM mb_member_addr
    WHERE member_id = #{memberId}
</select>

<!-- ✅ 올바른 예1: 주 테이블과 JOIN 컬럼 모두 명시 -->
<select id="selectById">
    SELECT  p.*
          , cat.category_nm    AS cate_nm
          , cat.parent_category_id
          , b.brand_nm
          , v.vendor_nm        AS vendor_nm
          , v.vendor_phone     AS vendor_tel
          , u.user_nm          AS md_user_nm
          , cd_ps.code_label   AS prod_status_cd_nm
    FROM pd_prod p
        LEFT JOIN pd_category cat ON cat.category_id = p.category_id
        LEFT JOIN sy_brand     b   ON b.brand_id     = p.brand_id
        LEFT JOIN sy_vendor    v   ON v.vendor_id    = p.vendor_id
        LEFT JOIN sy_user      u   ON u.user_id      = p.md_user_id
        LEFT JOIN sy_code cd_ps ON cd_ps.code_value = p.prod_status_cd
</select>

<!-- ✅ 올바른 예2: 테이블 별칭 명시 -->
<select id="selectAddrsByMemberId">
    SELECT a.*
    FROM mb_member_addr a
    WHERE a.member_id = #{memberId}
</select>
```

### 4. ORDER BY, WHERE 절의 컬럼 명시성

**정의**: ORDER BY 절과 WHERE 절의 모든 컬럼 참조에 테이블 별칭을 붙인다.

**패턴**:
```xml
<!-- ❌ 잘못된 예: 별칭 없는 ORDER BY -->
<select id="selectList">
    ...
    <choose>
        <when test="sort == 'id_asc'">ORDER BY prod_id ASC</when>
        <when test="sort == 'id_desc'">ORDER BY prod_id DESC</when>
    </choose>
</select>

<!-- ✅ 올바른 예: 별칭을 포함한 ORDER BY -->
<select id="selectList">
    ...
    <choose>
        <when test="sort == 'id_asc'">ORDER BY p.prod_id ASC</when>
        <when test="sort == 'id_desc'">ORDER BY p.prod_id DESC</when>
    </choose>
</select>
```

### 5. JOIN 종류 명시 (bare `JOIN` 금지) ⭐ (2026-08-19)

**정의**: `JOIN` 을 단독으로 쓰지 않고 항상 `INNER JOIN` / `LEFT JOIN` / `RIGHT JOIN` / `FULL JOIN` 중 의도한 종류를 명시한다. 결과는 `JOIN`(=INNER JOIN)과 동일하지만, 읽는 사람이 매번 "이게 내부조인이 맞나, 원래 LEFT였는데 실수로 지운 건 아닌가"를 확인할 필요 없이 코드만 보고 바로 조인 종류를 알 수 있어야 한다.

**규칙**:
- Mapper XML `<select>`/`<sql>` 의 `FROM ... JOIN` 전부 `INNER JOIN` 으로 명시
- DDL 소스(`_doc/ddl_pgsql/**/*.sql`)의 `CREATE VIEW` 정의도 동일하게 명시

```xml
<!-- ❌ 잘못된 예 -->
FROM sy_code c
JOIN sy_code_grp g ON g.code_grp_id = c.code_grp_id

<!-- ✅ 올바른 예 -->
FROM sy_code c
INNER JOIN sy_code_grp g ON g.code_grp_id = c.code_grp_id
```

**⚠ PostgreSQL VIEW 예외 (반드시 알아야 함)**: `CREATE VIEW` 정의에 `INNER JOIN` 이라고 써도, PostgreSQL은 뷰를 파싱된 쿼리 트리로 저장하고 `pg_get_viewdef()`(= `\d+`, DBeaver/pgAdmin 등 모든 조회 도구가 내부적으로 쓰는 함수)로 되돌려 보여줄 때 **INNER 는 항상 생략하고 그냥 `JOIN` 으로 정규화해서 보여준다** — LEFT/RIGHT/FULL 은 그대로 유지되지만 INNER 만 예외적으로 사라진다. 즉:
- **DDL 소스 파일**(`.sql`)에는 `INNER JOIN` 을 그대로 남겨 의도를 문서화한다 — 이 파일은 텍스트 그대로 보존되므로 정책이 유효하다.
- 실제 DB에서 `\d+`, `pg_get_viewdef`, DB 클라이언트로 뷰 정의를 다시 열어보면 `JOIN` 으로 보이는 게 **정상**이다 — 버그도 아니고 되돌릴 필요도 없다.
- 이 예외는 **VIEW 에만 해당**한다. Mapper XML의 `<select>` 쿼리는 텍스트 그대로 실행되므로 `INNER JOIN` 이 그대로 유지·표시된다.

### 6. 현재 유효건 조회 — `currentYn` (FO 강제 / BO 옵션) ⭐ (2026-08-19)

**정의**: "지금 유효한 것만"(상태 ACTIVE + 사용여부 Y + 노출기간 이내) 조건은 `BaseRequest.currentYn` 으로 표현하고, `Q*RepositoryImpl` 의 `andCurrentYn{도메인}(String currentYn)` 이 `'Y'` 일 때만 조건을 만든다.

**메서드명은 도메인 접미어를 붙인다** — `andCurrentYnProd` / `andCurrentYnCoupon` / `andCurrentYnDiscnt` / `andCurrentYnEvent` / `andCurrentYnGift`. 도메인마다 유효 판정 기준(상태코드명·기간컬럼명·컬럼타입)이 달라 같은 이름을 쓰면 어느 테이블 기준인지 호출부에서 분간이 안 되고, 파일 간 복붙 시 조건이 뒤섞이기 쉽다. 기존 `andSearchValue`/`andPathLike` 처럼 `and*` 접두어 규칙은 그대로 따른다.

**핵심 규칙 — FO 는 옵션이 아니라 강제**:
- **FO Service 는 요청마다 `req.setCurrentYn("Y")` 를 직접 세팅한다.** 클라이언트가 보내든 말든 무조건 적용 → 새 FO 화면에서 빠뜨릴 여지 자체를 없앤다. 이는 FO 가 `memberId` 를 `SecurityUtil` 로 강제 주입하는 기존 패턴과 같은 성격이다(빠뜨리면 사용자에게 만료·숨김 데이터가 그대로 노출되는 사고).
- **BO 는 기본 미적용**(전체 조회 — 관리자는 만료·미시작 건도 관리해야 함). "지금 노출중인 것만 미리보기" 용도로만 클라이언트가 선택적으로 `currentYn='Y'` 를 보낸다.

```java
// base/ec/pm/repository/qrydsl/impl/QPmEventRepositoryImpl.java
private BooleanExpression andCurrentYnEvent(String currentYn) {
    if (!"Y".equals(currentYn)) return null;   // 미지정이면 조건 미적용
    LocalDate today = LocalDate.now();          // ← 기준시각 1회 계산 (아래 주의 참고)
    return pmEvent.eventStatusCd.eq("ACTIVE")
            .and(pmEvent.useYn.eq("Y"))
            .and(QdslUtil.dateBetween(today, pmEvent.startDate, pmEvent.endDate));
}

// fo/*/service/Fo*Service.java — FO 는 강제
public List<PmEventDto.Item> getList(PmEventDto.Request req) {
    req.setCurrentYn("Y");   // FO 강제 — 클라이언트 파라미터와 무관
    return pmEventRepository.selectList(req);
}
```

**`dateBetween` 오버로드 — 읽는 법은 항상 "첫 인자가 뒤 두 인자 사이에 있는가"**:

| 형태 | 의미 | 용도 |
|---|---|---|
| `dateBetween(regDatePath, "2026-01-01", "2026-12-31")` | **컬럼**이 입력 두 날짜 사이 | 기간검색 (dateRangeType) |
| `dateBetween(today, startDatePath, endDatePath)` | **기준일**이 두 컬럼 사이 | 유효기간 판정 (DATE) |
| `dateBetween(now, startDtPath, endDtPath)` | **기준시각**이 두 컬럼 사이 | 유효기간 판정 (TIMESTAMP) |

기준시각을 인자로 받으므로 "지금"에 묶이지 않는다 — 과거/미래 특정 시점 기준 조회("그날 유효했던 프로모션", BO 시뮬레이션 등)에 그대로 재사용된다.

**⚠ 기준시각은 반드시 변수로 1회 계산 후 전달**: 메서드 안에서 `LocalDate.now()` 를 매번 부르면 한 쿼리의 시작/종료 비교가 서로 다른 시각을 기준으로 평가될 수 있고(자정 경계에서 목록·카운트 불일치), 같은 요청의 여러 조건이 동일 시점 스냅샷을 공유하지 못한다. **한 요청 = 한 기준시각**.

**⚠ 컬럼 타입에 맞는 오버로드가 자동 선택되도록 기준값 타입을 맞출 것**: DATE 컬럼엔 `LocalDate`, TIMESTAMP 컬럼엔 `LocalDateTime` 을 넘긴다. 섞으면 컴파일 에러로 즉시 잡히거나(다행) "당일 오후 시작" 같은 경계값이 어긋난다. (예: `pm_event`/`pm_discnt`/`pm_gift`/`pm_coupon` 은 DATE, `pd_prod.sale_start_date` 는 TIMESTAMP)

**적용 대상 판단**: 상태·사용여부·기간 조건이 **여러 개 얽혀 있어 매번 다시 쓰면 틀리기 쉬운** 테이블에만 둔다. 단일 조건(`use_yn` 하나뿐 등)은 호출부에서 직접 쓰는 게 낫고, `pm_save` 처럼 거래원장이라 유효기간 개념 자체가 없는 테이블은 대상이 아니다(설정해도 조용히 무시되어 오해만 부른다).

**DB 뷰(`vw_*_cur`)로 만들지 않는 이유**: 이 프로젝트는 검색조건을 전부 `BaseRequest` + QueryDSL `andXxx()` 조합으로 처리한다. 유효조건만 DB 뷰로 빼면 (1) raw 뷰와 `_cur` 뷰를 항상 동기화해야 하고, (2) 다른 검색조건과 조합이 어려워지며, (3) 이 코드베이스에서 유일하게 이질적인 패턴이 된다. 2026-08-19 에 `vw_*_cur` 13종을 만들었다가 같은 이유로 전량 폐기하고 `currentYn` 방식으로 정리했다.

## 테이블 별칭 관례

### 도메인별 주 테이블 별칭

| 테이블 | 별칭 | 도메인 |
|---|---|---|
| `pd_prod` | `p` | 상품(Product) |
| `od_order` | `o` | 주문(Order) |
| `mb_member` | `m` | 회원(Member) |
| `ec_claim` | `c` | 클레임(Claim) |
| `ec_dliv` | `d` | 배송(Delivery) |
| `ec_event` | `e` | 이벤트(Event) |
| `pm_coupon` | `cou` | 쿠폰(Coupon) |
| `sy_user` | `u` | 사용자(User) |
| `sy_site` | `s` | 사이트(Site) |
| `sy_code` | `cd` (또는 도메인별 suffix) | 공통코드(Code) |
| `sy_brand` | `b` | 브랜드(Brand) |
| `sy_vendor` | `v` | 판매자/업체(Vendor) |

### 일반적인 조인 테이블 별칭

| 테이블 | 추천 별칭 | 용도 |
|---|---|---|
| `pd_category` | `cat` | 상품 카테고리 |
| `pd_prod_sku` | `sk` | 상품 SKU / 기본값: `a` |
| `pd_prod_opt_type` | `ot` | 상품 옵션 유형 |
| `pd_prod_opt` | `opt` / `oi1`, `oi2` | 상품 옵션값 (다중 조인 시 번호 붙임) |
| `od_order_item` | `oi` | 주문 상품 |
| `ec_dliv_item` | `di` | 배송 상품 |
| `sy_code` | `cd_os`, `cd_pm`, `cd_ps` | 공통코드 (code_grp별 suffix) |
| `sy_user` | `u` | 사용자 |
| `sy_dept` | `dept` | 부서 |
| `sy_role` | `role` | 역할 |

### 기본값 별칭

테이블 별칭이 **없는 경우** 기본값으로 **`a`**를 사용한다. 이미 명확한 별칭(sk, o, cat, b, v, u 등)이 있으면 기존 별칭을 유지한다.

```xml
<!-- ❌ 잘못된 예: 별칭 없음 -->
<select id="selectSomeQuery">
    SELECT  *
    FROM pd_some_table
        LEFT JOIN other_table ON other_table.id = some_field
    WHERE some_field = #{id}
</select>

<!-- ✅ 올바른 예1: 기존 별칭 유지 -->
<select id="selectSkusByProdId">
    SELECT  sk.*
          , oi1.prod_opt_nm AS prod_opt_nm_1
          , oi2.prod_opt_nm AS prod_opt_nm_2
    FROM pd_prod_sku sk
        LEFT JOIN pd_prod_opt oi1 ON oi1.prod_opt_id = sk.prod_opt1_id
        LEFT JOIN pd_prod_opt oi2 ON oi2.prod_opt_id = sk.prod_opt2_id
    WHERE sk.prod_id = #{prodId}
</select>

<!-- ✅ 올바른 예2: 별칭이 없으면 'a' 사용 -->
<select id="selectSomeQuery">
    SELECT  a.*
    FROM pd_some_table a
        LEFT JOIN other_table b ON b.id = a.some_field
    WHERE a.some_field = #{id}
</select>
```

## 구현 가이드

### 신규 쿼리 작성 시 체크리스트

1. **FROM 절**: 주 테이블에 명시적 별칭 부여
   ```xml
   FROM pd_prod p  ✅
   FROM pd_prod    ❌
   ```

2. **JOIN ON 절**: 양쪽 컬럼 모두 별칭 포함
   ```xml
   LEFT JOIN sy_brand b ON b.brand_id = p.brand_id  ✅
   LEFT JOIN sy_brand b ON b.brand_id = brand_id    ❌
   ```

3. **SELECT 절**: `*` 앞에 테이블 별칭 명시
   ```xml
   SELECT p.*, b.brand_nm                ✅
   SELECT *, b.brand_nm                  ❌
   ```

4. **SELECT COUNT 절**: COUNT 함수도 테이블 별칭 명시
   ```xml
   SELECT COUNT(p.*) FROM pd_prod p      ✅
   SELECT COUNT(*) FROM pd_prod p        ❌
   ```

5. **SQL Fragment 내 조건**: 모든 컬럼에 별칭 붙임
   ```xml
   <!-- ✅ 올바른 예 -->
   <sql id="pdProdCond">
       <where>
           <if test="status != null">AND p.prod_status_cd = #{status}</if>
           <if test="searchValue != null">AND p.prod_nm ILIKE '%' || #{searchValue} || '%'</if>
       </where>
   </sql>
   
   <!-- ❌ 잘못된 예 -->
   <sql id="pdProdCond">
       <where>
           <if test="status != null">AND prod_status_cd = #{status}</if>
           <if test="searchValue != null">AND prod_nm ILIKE '%' || #{searchValue} || '%'</if>
       </where>
   </sql>
   ```

6. **WHERE 절**: 모든 컬럼에 별칭 붙임
   ```xml
   WHERE p.prod_id = #{id} AND p.site_id = #{siteId}  ✅
   WHERE prod_id = #{id} AND site_id = #{siteId}      ❌
   ```

7. **ORDER BY 절**: 컬럼에 별칭 붙임
   ```xml
   ORDER BY p.reg_date DESC, p.prod_id ASC  ✅
   ORDER BY reg_date DESC, prod_id ASC      ❌
   ```

### 기존 쿼리 마이그레이션

다음의 우선순위로 레거시 쿼리를 마이그레이션한다.

1. **높은 우선순위** (즉시 수정 필요)
   - PostgreSQL 서버에서 에러 발생하는 쿼리
   - SELECT 결과가 중복 컬럼을 포함하는 쿼리

2. **중간 우선순위** (정기적 정리)
   - 3개 이상의 JOIN을 포함하는 복잡한 쿼리
   - 재사용 가능한 SQL fragment (`<sql id="...">`)

3. **낮은 우선순위** (단순 쿼리)
   - 단일 테이블 조회 쿼리
   - JOIN이 없는 단순 WHERE 조회

### 일반적인 실수와 해결 방법

#### 실수 1: 조인 조건에서 우측 컬럼 미지정

```xml
<!-- ❌ 문제: 'category_id'가 어느 테이블의 컬럼인지 불명확 -->
LEFT JOIN pd_category cat ON cat.category_id = category_id

<!-- ✅ 해결: 우측 컬럼에도 별칭 붙임 -->
LEFT JOIN pd_category cat ON cat.category_id = p.category_id
```

#### 실수 2: 공통코드 조인의 다중 조건 누락

```xml
<!-- ❌ 문제: code_grp 문자열과 code_value 컬럼이 섞여 모호 -->
LEFT JOIN sy_code cd_ps ON cd_ps.code_grp = 'PRODUCT_STATUS' AND cd_ps.code_value = prod_status_cd

<!-- ✅ 해결: 모든 참조 컬럼에 별칭 붙임 -->
LEFT JOIN sy_code cd_ps 
    ON cd_ps.code_grp = 'PRODUCT_STATUS' AND cd_ps.code_value = p.prod_status_cd
```

#### 실수 3: WHERE 절의 <include refid="..."> 내 컬럼 누락

```xml
<!-- ❌ 문제: 프래그먼트 내 컬럼이 별칭 없음 -->
<sql id="pdProdCond">
    <where>
        <if test="status != null">AND prod_status_cd = #{status}</if>
    </where>
</sql>

<!-- ✅ 해결: 프래그먼트도 별칭 포함 -->
<sql id="pdProdCond">
    <where>
        <if test="status != null">AND p.prod_status_cd = #{status}</if>
    </where>
</sql>
```

## 오류 메시지 및 대응

### PostgreSQL 에러: column reference "컬럼명" is ambiguous

**원인**: 여러 테이블이 같은 이름의 컬럼을 가질 때, SQL이 어느 테이블의 컬럼을 참조할지 명확하지 않음.

**해결**:
1. 해당 컬럼 앞에 테이블 별칭을 붙임
2. JOIN ON / WHERE / ORDER BY 절에서 모두 확인

### MyBatis 파라미터 바인딩 오류: Parameter 'xxx' not found

**원인**: `#{paramName}` 형식이 맞지 않거나, `@Param` 애노테이션 제거 후 XML에서 `#{p.paramName}` 형식으로 변경해야 하는 경우.

**해결**:
1. Mapper 메서드의 `@Param` 애노테이션 확인
2. `@Param("p")` 제거된 경우: XML의 `#{fieldName}`을 `#{p.fieldName}`으로 변경
3. 동시에 JOIN ON 조건도 `p.fieldName` 형식으로 통일

## 검수 및 배포 기준

### 쿼리 코드 리뷰 시 확인 항목

- [ ] 모든 조인 테이블에 명시적 별칭 부여
- [ ] JOIN ON 절의 우측 컬럼에 별칭 있는지 확인
- [ ] SELECT 절의 `*` 앞에 테이블 별칭 있는지 확인
- [ ] WHERE / ORDER BY의 모든 컬럼이 별칭 포함하는지 확인
- [ ] SQL fragment (`<include refid="...">`) 내 컬럼도 별칭 포함하는지 확인
- [ ] PostgreSQL 로컬 테스트에서 "ambiguous column reference" 에러 없는지 확인

### 테스트 전략

1. **단위 테스트**: 각 쿼리별 별칭 적용 확인
2. **통합 테스트**: 복잡한 JOIN 쿼리의 결과 데이터 정확성 확인
3. **회귀 테스트**: 기존 기능 영향도 최소화 (SELECT 결과 컬럼 순서 동일 유지)

## 관련 파일 및 참조

| 항목 | 파일 | 내용 |
|---|---|---|
| MyBatis Mapper 기본 구조 | `src/main/resources/mapper/**/*.xml` | 모든 Mapper XML 쿼리 |
| 네이밍 규칙 | `sy.52.ddl단어사전규칙.md` | 테이블·컬럼명 표준화 |
| 개발 기준 | `sy.54.네이밍규칙.md` | 코드 변수명 접두어 규칙 |
| Spring Boot 구성 | `CLAUDE.md` (EcAdminApi) | Controller/Service 파라미터 패턴 |

## 일반적인 실수와 해결 방법 (상세)

### 실수 1: SELECT * 와일드카드 미지정

```xml
<!-- ❌ 잘못된 예 -->
<select id="selectList">
    SELECT  /* comment */
          *
          , b.brand_nm
    FROM pd_prod p
</select>

<!-- ✅ 올바른 예 -->
<select id="selectList">
    SELECT  /* comment */
          p.*
          , b.brand_nm
    FROM pd_prod p
</select>
```

### 실수 2: COUNT(*) 미지정

```xml
<!-- ❌ 잘못된 예 -->
<select id="selectPageCount">
    SELECT COUNT(*)
    FROM pd_prod p
        <include refid="pdProdCond"/>
</select>

<!-- ✅ 올바른 예 -->
<select id="selectPageCount">
    SELECT COUNT(p.*)
    FROM pd_prod p
        <include refid="pdProdCond"/>
</select>
```

### 실수 3: Fragment 내 컬럼 미지정

```xml
<!-- ❌ 잘못된 예 -->
<sql id="pdProdCond">
    <where>
        <if test="status != null">AND prod_status_cd = #{status}</if>
        <if test="searchValue != null">AND prod_nm ILIKE '%' || #{searchValue} || '%'</if>
        <if test="dateStart != null">AND reg_date >= #{dateStart}</if>
    </where>
</sql>

<!-- ✅ 올바른 예 -->
<sql id="pdProdCond">
    <where>
        <if test="status != null">AND p.prod_status_cd = #{status}</if>
        <if test="searchValue != null">AND p.prod_nm ILIKE '%' || #{searchValue} || '%'</if>
        <if test="dateStart != null">AND p.reg_date >= #{dateStart}</if>
    </where>
</sql>
```

## 변경 이력

| 날짜 | 버전 | 내용 |
|---|---|---|
| 2026-08-19 | 2.3 | §6 현재 유효건 조회(`currentYn`) 규칙 추가 — FO Service 강제 세팅 / BO 옵션. `QdslUtil.dateBetween(기준일, 시작컬럼, 종료컬럼)` 오버로드 신설(기존 `dateBetween(컬럼, 시작, 종료)` 과 동일하게 "첫 인자가 뒤 둘 사이" 로 읽힘 — 기준시각을 인자로 받아 과거/미래 시점 조회에도 재사용 가능). `vw_*_cur` 뷰 13종은 만들었다가 전량 폐기(사유 §6). 메서드명은 도메인 접미어(`andCurrentYnProd`/`Coupon`/`Discnt`/`Event`/`Gift`). 적용: PdProd/PmCoupon/PmEvent/PmDiscnt/PmGift Repository + FoPdProd/FoPmEvent Service. 부수 수정: `FoPdProdService.getPromotions()` 가 `*_prod` 매핑 ID 를 Request 에 set 하지 않아 상품 무관 전체 프로모션이 응답되던 버그 |
| 2026-08-19 | 2.2 | §5 JOIN 종류 명시 규칙 추가 (bare `JOIN` 금지 → `INNER/LEFT/RIGHT JOIN` 명시). PostgreSQL VIEW 는 `pg_get_viewdef()` 재조회 시 INNER 만 정규화되어 사라지는 것이 정상 동작임을 명시(DDL 소스 파일에는 그대로 유지). Mapper 1건(`AutoRestMapper.selectCodeLabels`), VIEW 4건(`vw_dp_area`/`vw_dp_panel`/`vw_dp_panel_item`/`vw_sy_role_menu`) 적용 |
| 2026-04-29 | 2.1 | 전체 Mapper 완전 정정 완료 — XML 파싱 오류 제거 (3개 파일), COUNT(a.*) 별칭 정정 (43개 파일), SELECT/JOIN/WHERE 모든 컬럼 명시화 (155개 파일 검증) |
| 2026-04-29 | 2.0 | 전체 Mapper 감시 완료 — COUNT(*), SELECT *, Fragment 조건 모두 명시화 (114개 파일 수정) |
| 2026-04-29 | 1.0 | 최초 작성 — 모든 Mapper 쿼리 별칭 규칙 정의 |
