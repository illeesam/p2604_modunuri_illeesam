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
| `pd_prod_opt` | `opt` / `a` | 상품 옵션 |
| `pd_prod_opt_item` | `oi1`, `oi2` | 상품 옵션 아이템 (다중 조인 시 번호 붙임) |
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
          , oi1.opt_item_nm AS opt_item_nm_1
          , oi2.opt_item_nm AS opt_item_nm_2
    FROM pd_prod_sku sk
        LEFT JOIN pd_prod_opt_item oi1 ON oi1.opt_item_id = sk.opt_item_id_1
        LEFT JOIN pd_prod_opt_item oi2 ON oi2.opt_item_id = sk.opt_item_id_2
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
           <if test="kw != null">AND p.prod_nm ILIKE '%' || #{kw} || '%'</if>
       </where>
   </sql>
   
   <!-- ❌ 잘못된 예 -->
   <sql id="pdProdCond">
       <where>
           <if test="status != null">AND prod_status_cd = #{status}</if>
           <if test="kw != null">AND prod_nm ILIKE '%' || #{kw} || '%'</if>
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
        <if test="kw != null">AND prod_nm ILIKE '%' || #{kw} || '%'</if>
        <if test="dateStart != null">AND reg_date >= #{dateStart}</if>
    </where>
</sql>

<!-- ✅ 올바른 예 -->
<sql id="pdProdCond">
    <where>
        <if test="status != null">AND p.prod_status_cd = #{status}</if>
        <if test="kw != null">AND p.prod_nm ILIKE '%' || #{kw} || '%'</if>
        <if test="dateStart != null">AND p.reg_date >= #{dateStart}</if>
    </where>
</sql>
```

## 변경 이력

| 날짜 | 버전 | 내용 |
|---|---|---|
| 2026-04-29 | 2.1 | 전체 Mapper 완전 정정 완료 — XML 파싱 오류 제거 (3개 파일), COUNT(a.*) 별칭 정정 (43개 파일), SELECT/JOIN/WHERE 모든 컬럼 명시화 (155개 파일 검증) |
| 2026-04-29 | 2.0 | 전체 Mapper 감시 완료 — COUNT(*), SELECT *, Fragment 조건 모두 명시화 (114개 파일 수정) |
| 2026-04-29 | 1.0 | 최초 작성 — 모든 Mapper 쿼리 별칭 규칙 정의 |
