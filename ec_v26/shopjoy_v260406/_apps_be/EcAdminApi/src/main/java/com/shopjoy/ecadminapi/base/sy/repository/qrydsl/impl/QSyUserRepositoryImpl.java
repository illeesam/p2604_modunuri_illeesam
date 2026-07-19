package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.repository.SyDeptRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyDept;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyUserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** SyUser QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyUserRepositoryImpl implements QSyUserRepository {

    /* ============================================================
     * 의존성 주입 + Q-class (테이블 별칭)
     * ============================================================ */
    private final JPAQueryFactory queryFactory;
    private final SyDeptRepository syDeptRepository;
    private final EntityManager em;

    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyUserRepositoryImpl";
    private static final QSyUser syUser = QSyUser.syUser;
    private static final QSySite sySite = QSySite.sySite;
    private static final QSyDept syDept = QSyDept.syDept;
    private static final QSyRole syRole = QSyRole.syRole;
    /* 같은 sy_code 테이블이 두 번 조인되므로 역할별 alias 부여 */
    private static final QSyCode syCode_userStatusCd = new QSyCode("code_userStatusCd");
    private static final QSyCode syCode_authMethodCd = new QSyCode("code_authMethodCd");

    /* ============================================================
     * 기본 쿼리 빌드 — SELECT + JOIN (조회 메서드들이 공유하는 base)
     * ============================================================ */

    /** 기본 쿼리 빌드 */
    private JPAQuery<SyUserDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyUserDto.Item.class,
                        syUser.userId,
                        syUser.siteId,
                        syUser.loginId,
                        syUser.loginPwdHash,
                        syUser.userNm,
                        syUser.userEmail,
                        syUser.userPhone,
                        syUser.deptId,
                        syUser.roleId,
                        syUser.userStatusCd,
                        syUser.lastLogin,
                        syUser.loginFailCnt,
                        syUser.userMemo,
                        syUser.regBy,
                        syUser.regDate,
                        syUser.updBy,
                        syUser.updDate,
                        syUser.authMethodCd,
                        syUser.lastLoginDate,
                        syUser.profileAttachId,
                        sySite.siteNm.as("siteNm"),
                        syDept.deptNm.as("deptNm"),
                        syRole.roleNm.as("roleNm"),
                        syCode_userStatusCd.codeLabel.as("userStatusCdNm"),
                        syCode_authMethodCd.codeLabel.as("authMethodCdNm")
                ))
                .from(syUser)
                .leftJoin(sySite).on(sySite.siteId.eq(syUser.siteId))
                .leftJoin(syDept).on(syDept.deptId.eq(syUser.deptId))
                .leftJoin(syRole).on(syRole.roleId.eq(syUser.roleId))
                .leftJoin(syCode_userStatusCd).on(syCode_userStatusCd.codeGrp.eq("USER_STATUS").and(syCode_userStatusCd.codeValue.eq(syUser.userStatusCd)))
                .leftJoin(syCode_authMethodCd).on(syCode_authMethodCd.codeGrp.eq("AUTH_METHOD").and(syCode_authMethodCd.codeValue.eq(syUser.authMethodCd)));
    }

    /* ============================================================
     * 조회 메서드 — selectById / selectList / selectPageData / selectCount
     * 검색조건은 .where(andXxx(...), ...) 형태로 직접 나열
     * ============================================================ */

    /** 단건 조회 */
    @Override
    public Optional<SyUserDto.Item> selectById(String userId) {
        SyUserDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syUser.userId.eq(userId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 (page/size 가 양수면 페이징 적용. null 안전) */
    @Override
    public List<SyUserDto.Item> selectList(SyUserDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        var query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    andSiteIdEq(search),
                    andDeptIdIn(search),
                    andStatusEq(search),
                    andRoleEq(search),
                    andDateRangeBetween(search),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    @Override
    public SyUserDto.PageResponse selectPageData(SyUserDto.Request search) {
        int pageNo   = search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andSiteIdEq(search),
                andDeptIdIn(search),
                andStatusEq(search),
                andRoleEq(search),
                andDateRangeBetween(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        var query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyUserDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syUser.count())
                .where(wheres)
                .fetchOne();

        SyUserDto.PageResponse res = new SyUserDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 기준 전체 카운트 (스트리밍 export 시 안전 상한 검증용) */
    @Override
    public long selectCount(SyUserDto.Request search) {
        Long total = queryFactory.select(syUser.count())
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectCount()").from(syUser)
                /* andRoleEq 이 syRole 을 참조하므로 join 필요 (목록/페이징과 동일 필터 집합 유지) */
                .leftJoin(syRole).on(syRole.roleId.eq(syUser.roleId))
                .where(
                    andSiteIdEq(search),
                    andDeptIdIn(search),
                    andStatusEq(search),
                    andRoleEq(search),
                    andDateRangeBetween(search),
                    andSearchValueLike(search)
                )
                .fetchOne();
        return total == null ? 0L : total;
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteIdEq(s), andDeptIdIn(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteIdEq(SyUserDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? syUser.siteId.eq(search.getSiteId()) : null;
    }

    /* 부서 트리 — 선택 노드 + 모든 자손 부서 사용자까지 포함 */
    private BooleanExpression andDeptIdIn(SyUserDto.Request search) {
        return search != null && StringUtils.hasText(search.getDeptId())
                ? syUser.deptId.in(syDeptRepository.findTreeDeptIds(search.getDeptId()))
                : null;
    }

    /* userStatusCd 정확 일치 */
    private BooleanExpression andStatusEq(SyUserDto.Request search) {
        return search != null && StringUtils.hasText(search.getStatus())
                ? syUser.userStatusCd.eq(search.getStatus()) : null;
    }

    /* 권한 — USER_ROLE 코드값(=역할명) 정확 일치 (조인된 sy_role.role_nm 기준) */
    private BooleanExpression andRoleEq(SyUserDto.Request search) {
        return search != null && StringUtils.hasText(search.getRole())
                ? syRole.roleNm.eq(search.getRole()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRangeBetween(SyUserDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date":        return syUser.regDate.goe(start).and(syUser.regDate.lt(endExcl));
            case "upd_date":        return syUser.updDate.goe(start).and(syUser.updDate.lt(endExcl));
            case "last_login_date": return syUser.lastLoginDate.goe(start).and(syUser.lastLoginDate.lt(endExcl));
            default:                return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValueLike(SyUserDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",authMethodCd,",    syUser.authMethodCd,    pattern);
        or = orLike(or, all, types, ",deptId,",          syUser.deptId,          pattern);
        or = orLike(or, all, types, ",loginId,",         syUser.loginId,         pattern);
        or = orLike(or, all, types, ",loginPwdHash,",    syUser.loginPwdHash,    pattern);
        or = orLike(or, all, types, ",profileAttachId,", syUser.profileAttachId, pattern);
        or = orLike(or, all, types, ",roleId,",          syUser.roleId,          pattern);
        or = orLike(or, all, types, ",siteId,",          syUser.siteId,          pattern);
        or = orLike(or, all, types, ",userEmail,",       syUser.userEmail,       pattern);
        or = orLike(or, all, types, ",userId,",          syUser.userId,          pattern);
        or = orLike(or, all, types, ",userMemo,",        syUser.userMemo,        pattern);
        or = orLike(or, all, types, ",userNm,",          syUser.userNm,          pattern);
        or = orLike(or, all, types, ",userPhone,",       syUser.userPhone,       pattern);
        or = orLike(or, all, types, ",userStatusCd,",    syUser.userStatusCd,    pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
    }

    /* ============================================================
     * 정렬조건 — sort 문자열 파싱 ("userId asc, regDate desc")
     * ============================================================ */

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyUserDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (StringUtils.hasText(sort)) {
            String[] sortParts = sort.split(",");
            for (String part : sortParts) {
                String trimmed = part.trim();
                String[] fieldAndDir = trimmed.split(" ");
                if (fieldAndDir.length == 2) {
                    String field = fieldAndDir[0];
                    String dir = fieldAndDir[1];
                    Order order = "desc".equalsIgnoreCase(dir) ? Order.DESC : Order.ASC;
                    if ("userId".equals(field)) {
                        orders.add(new OrderSpecifier(order, syUser.userId));
                    } else if ("userNm".equals(field)) {
                        orders.add(new OrderSpecifier(order, syUser.userNm));
                    } else if ("loginId".equals(field)) {
                        orders.add(new OrderSpecifier(order, syUser.loginId));
                    } else if ("regDate".equals(field)) {
                        orders.add(new OrderSpecifier(order, syUser.regDate));
                    } else if ("updDate".equals(field)) {
                        orders.add(new OrderSpecifier(order, syUser.updDate));
                    }
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        if (orders.isEmpty()) orders.add(new OrderSpecifier<>(Order.DESC, syUser.regDate));
        return orders;
    }

    /* ============================================================
     * 변경 메서드 — UPDATE (selective: null 이 아닌 필드만 SET)
     * ============================================================ */

    /** updateSelective - null 이 아닌 필드만 UPDATE (MyBatis selective 대체).
     *  updDate 는 항상 DB CURRENT_TIMESTAMP 로 채움 (다중 WAS 시계 차이 회피, 트랜잭션 내 시점 일치). */
    @Override
    public int updateSelective(SyUser entity) {
        if (entity.getUserId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syUser);

        if (entity.getSiteId()          != null) update.set(syUser.siteId,          entity.getSiteId());
        if (entity.getLoginId()         != null) update.set(syUser.loginId,         entity.getLoginId());
        if (entity.getLoginPwdHash()    != null) update.set(syUser.loginPwdHash,    entity.getLoginPwdHash());
        if (entity.getUserNm()          != null) update.set(syUser.userNm,          entity.getUserNm());
        if (entity.getUserEmail()       != null) update.set(syUser.userEmail,       entity.getUserEmail());
        if (entity.getUserPhone()       != null) update.set(syUser.userPhone,       entity.getUserPhone());
        if (entity.getDeptId()          != null) update.set(syUser.deptId,          entity.getDeptId());
        if (entity.getRoleId()          != null) update.set(syUser.roleId,          entity.getRoleId());
        if (entity.getUserStatusCd()    != null) update.set(syUser.userStatusCd,    entity.getUserStatusCd());
        if (entity.getLastLogin()       != null) update.set(syUser.lastLogin,       entity.getLastLogin());
        if (entity.getLoginFailCnt()    != null) update.set(syUser.loginFailCnt,    entity.getLoginFailCnt());
        if (entity.getUserMemo()        != null) update.set(syUser.userMemo,        entity.getUserMemo());
        if (entity.getUpdBy()           != null) update.set(syUser.updBy,           entity.getUpdBy());
        if (entity.getAuthMethodCd()    != null) update.set(syUser.authMethodCd,    entity.getAuthMethodCd());
        if (entity.getLastLoginDate()   != null) update.set(syUser.lastLoginDate,   entity.getLastLoginDate());
        if (entity.getProfileAttachId() != null) update.set(syUser.profileAttachId, entity.getProfileAttachId());

        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syUser.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        long affected = update
                .where(syUser.userId.eq(entity.getUserId()))
                .execute();

        return (int) affected;
    }

    /* 부서 트리 노드별 사용자 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   - 일반 dept_id 행 : 해당 부서 + 자손 부서의 사용자 수 (검색조건 적용)
     *   - '__total__'     : 검색조건에 부합하는 전체 사용자 수 (트리 루트 "전체" 노드)
     *   - '__orphan__'    : 검색조건에 부합 + dept_id IS NULL 인 사용자 수
     */
    @Override
    public List<Map<String, Object>> selectDeptTreeUserCnts(SyUserDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: selectDeptTreeUserCnts() */ \n");
        /* CTE 헤더 — 재귀 dept 자손 누적 + filtered WHERE 시작 */
        sql.append("""
                WITH RECURSIVE descendants /* 각 dept 의 자손 dept_id (자신 포함) */ AS (
                    SELECT dept_id AS root_id, dept_id AS leaf_id
                    FROM sy_dept
                    UNION ALL
                    SELECT d.root_id, c.dept_id
                    FROM descendants d
                    JOIN sy_dept c ON c.parent_dept_id = d.leaf_id
                ),
                filtered /* 검색조건이 적용된 사용자 집합 */ AS (
                    SELECT user_id, dept_id
                    FROM sy_user t
                    WHERE 1=1
                """);

        /* 검색조건 — depttreeAnd*() 헬퍼로 SQL 조각 + 파라미터 함께 추가 */
        depttreeAndStatus(search, sql, params);
        depttreeAndRole(search, sql, params);
        depttreeAndSearchValue(search, sql, params);
        depttreeAndDateRange(search, sql, params);

        /* CTE 닫기 + 메인 UNION ALL 3블록 */
        sql.append("""
                )
                  /* (1) 일반 dept_id 행 : 부서 + 자손 부서 누적 카운트 */
                  SELECT d.root_id AS dept_id, COUNT(t.user_id) AS cnt
                  FROM descendants d
                    LEFT JOIN filtered t ON t.dept_id = d.leaf_id
                  GROUP BY d.root_id
                UNION ALL
                  /* (2) '__total__' : 트리 루트 "전체" 노드용 — 검색조건에 부합하는 전체 카운트 */
                  SELECT '__total__' AS dept_id, COUNT(*) AS cnt
                  FROM filtered
                UNION ALL
                  /* (3) '__orphan__' : 부서 미지정(dept_id IS NULL) 카운트 — 트리 외 표시 */
                  SELECT '__orphan__' AS dept_id, COUNT(*) AS cnt
                  FROM filtered
                  WHERE dept_id IS NULL
                """);

        Query q = em.createNativeQuery(sql.toString());
        params.forEach(q::setParameter);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = (List<Object[]>) q.getResultList();

        /* Object[] → { deptId, cnt } 매핑 — sy_dept 자기참조 트리 카운트라 deptId 키 사용 */
        List<Map<String, Object>> result = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("deptId", row[0] == null ? null : String.valueOf(row[0]));
            m.put("cnt",    row[1] == null ? 0L   : ((Number) row[1]).longValue());
            result.add(m);
        }
        return result;
    }

    /* ============================================================
     * selectDeptTreeUserCnts 전용 SQL 조건 헬퍼 (depttree prefix)
     * ============================================================ */

    private void depttreeAndStatus(SyUserDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getStatus())) return;
        sql.append("      AND t.user_status_cd = :statusCd\n");
        p.put("statusCd", s.getStatus());
    }

    /* 권한 — role_id → sy_role.role_nm 매칭 (목록 andRoleEq 과 동일 기준, 카운트 동기화) */
    private void depttreeAndRole(SyUserDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getRole())) return;
        sql.append("      AND EXISTS (SELECT 1 FROM sy_role r WHERE r.role_id = t.role_id AND r.role_nm = :roleNm)\n");
        p.put("roleNm", s.getRole());
    }

    private void depttreeAndSearchValue(SyUserDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getSearchValue())) return;
        String raw = s.getSearchType();
        boolean noType = !StringUtils.hasText(raw);
        String st = noType ? "" : "," + raw.trim() + ",";
        sql.append("      AND (\n");
        sql.append("            1=0\n");
        if (noType || st.contains(",loginId,"))   sql.append("         OR t.login_id   ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",userNm,"))    sql.append("         OR t.user_nm    ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",userEmail,")) sql.append("         OR t.user_email ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",userPhone,")) sql.append("         OR t.user_phone ILIKE '%' || :searchValue || '%'\n");
        sql.append("      )\n");
        p.put("searchValue", s.getSearchValue());
    }

    private void depttreeAndDateRange(SyUserDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null) return;
        if (StringUtils.hasText(s.getDateStart())) {
            sql.append("      AND t.reg_date >= CAST(:dateStart AS timestamp)\n");
            p.put("dateStart", s.getDateStart());
        }
        if (StringUtils.hasText(s.getDateEnd())) {
            sql.append("      AND t.reg_date <= CAST(:dateEnd   AS timestamp) + INTERVAL '1 day'\n");
            p.put("dateEnd", s.getDateEnd());
        }
    }
}