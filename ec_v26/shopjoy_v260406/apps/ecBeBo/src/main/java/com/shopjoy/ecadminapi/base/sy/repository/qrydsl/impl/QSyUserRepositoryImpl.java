package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.repository.SyDeptRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyDept;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyUserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;

/** SyUser(관리자 사용자) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyUserRepositoryImpl implements QSyUserRepository {

    /* ============================================================
     * 의존성 주입 + Q-class (테이블 별칭)
     * ============================================================ */
    private final JPAQueryFactory queryFactory;
    private final SyDeptRepository syDeptRepository;
    private final EntityManager em;

    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyUserRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QSyUser syUser = QSyUser.syUser;
    private static final QSyDept syDept = QSyDept.syDept;
    private static final QSyRole syRole = QSyRole.syRole;
    /* 같은 sy_code 테이블이 두 번 조인되므로 역할별 alias 부여 */
    private static final QVwSyCode syCode_userStatusCd = new QVwSyCode("code_userStatusCd");
    private static final QVwSyCode syCode_authMethodCd = new QVwSyCode("code_authMethodCd");    /* ============================================================
     * 기본 쿼리 빌드 — SELECT + JOIN (조회 메서드들이 공유하는 base)
     * ============================================================ */

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * USER_STATUS   {ACTIVE: '활성', INACTIVE: '비활성', LOCKED: '잠김'}
     * AUTH_METHOD   {EMAIL: '이메일', GOOGLE: '구글', KAKAO: '카카오', NAVER: '네이버'}
     */
    /** 기본 쿼리 빌드 */
    private JPAQuery<SyUserDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyUserDto.Item.class,
                        syUser.userId,                              // 사용자ID (PK, YYMMDDhhmmss+rand4)
                        syUser.loginId,                              // 로그인 아이디
                        syUser.loginPwdHash,                         // 비밀번호 (bcrypt)
                        syUser.userNm,                               // 사용자명
                        syUser.userEmail,                            // 이메일
                        syUser.userPhone,                            // 연락처
                        syUser.deptId,                               // 부서ID (sy_dept.dept_id)
                        syUser.roleId,                               // 역할ID (sy_role.role_id)
                        syUser.userStatusCd,                         // 상태 — USER_STATUS {ACTIVE: '활성', INACTIVE: '비활성', LOCKED: '잠김'}
                        syUser.lastLogin,                            // 최근 로그인
                        syUser.loginFailCnt,                         // 로그인 실패 횟수
                        syUser.userMemo,                             // 메모
                        syUser.regBy,                                // 등록자
                        syUser.regDate,                              // 등록일시
                        syUser.updBy,                                // 수정자
                        syUser.updDate,                              // 수정일시
                        syUser.authMethodCd,                         // 인증방식 — AUTH_METHOD {EMAIL: '이메일', GOOGLE: '구글', KAKAO: '카카오', NAVER: '네이버'}
                        syUser.lastLoginDate,                        // 마지막 로그인 일시
                        syUser.profileAttachId,                      // 프로필 첨부아이디
                        syDept.deptNm.as("deptNm"),                  // 부서명 (조인: sy_dept)
                        syRole.roleNm.as("roleNm"),                  // 역할명 (조인: sy_role)
                        syCode_userStatusCd.codeLabel.as("userStatusCdNm"),   // 상태 코드명 (조인: sy_code USER_STATUS)
                        syCode_authMethodCd.codeLabel.as("authMethodCdNm"),   // 인증방식 코드명 (조인: sy_code AUTH_METHOD)
                        syUser.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(syUser)
                .leftJoin(syDept).on(syDept.deptId.eq(syUser.deptId)) // 부서
                .leftJoin(syRole).on(syRole.roleId.eq(syUser.roleId)) // 역할
                .leftJoin(syCode_userStatusCd).on(syCode_userStatusCd.codeGrp.eq("USER_STATUS_CD").and(syCode_userStatusCd.codeValue.eq(syUser.userStatusCd))) // 사용자상태
                .leftJoin(syCode_authMethodCd).on(syCode_authMethodCd.codeGrp.eq("AUTH_METHOD_CD").and(syCode_authMethodCd.codeValue.eq(syUser.authMethodCd))) // 인증방식
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(syUser.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(syUser.regBy)) // 등록자
                ;
    }

    /* ============================================================
     * 조회 메서드 — selectById / selectList / selectPageData / selectCount
     * 검색조건은 .where(andXxx(...), ...) 형태로 직접 나열
     * ============================================================ */

    /** 단건 조회 */
    @Override
    public Optional<SyUserDto.Item> selectById(String userId) {
        SyUserDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syUser.userId.eq(userId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /** 전체 목록 (page/size 가 양수면 페이징 적용. null 안전) */
    @Override
    public List<SyUserDto.Item> selectList(SyUserDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(andDeptIdIn(search));
        whereList.add(QdslUtil.strEq(syUser.userStatusCd, search.getStatus())); // 상태 검색값 — USER_STATUS_CD {ACTIVE:활성, INACTIVE:비활성}
        whereList.add(QdslUtil.strEq(syRole.roleNm, search.getRole())); // 역할ID 검색값 (sy_role.role_id)
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syUser.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("last_login_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syUser.lastLoginDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syUser.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        var query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<SyUserDto.Item> list = query.fetch();
        return list;
    }

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    @Override
    public BasePage<SyUserDto.Item> selectPageData(SyUserDto.Request search) {
        int pageNo   = search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(andDeptIdIn(search));
        whereList.add(QdslUtil.strEq(syUser.userStatusCd, search.getStatus())); // 상태 검색값 — USER_STATUS_CD {ACTIVE:활성, INACTIVE:비활성}
        whereList.add(QdslUtil.strEq(syRole.roleNm, search.getRole())); // 역할ID 검색값 (sy_role.role_id)
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syUser.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("last_login_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syUser.lastLoginDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syUser.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        var query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyUserDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syUser.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyUserDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /** 검색조건 기준 전체 카운트 (스트리밍 export 시 안전 상한 검증용) */
    @Override
    public long selectCount(SyUserDto.Request search) {
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(andDeptIdIn(search));
        whereList.add(QdslUtil.strEq(syUser.userStatusCd, search.getStatus())); // 상태 검색값 — USER_STATUS_CD {ACTIVE:활성, INACTIVE:비활성}
        whereList.add(QdslUtil.strEq(syRole.roleNm, search.getRole())); // 역할ID 검색값 (sy_role.role_id)
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syUser.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("last_login_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syUser.lastLoginDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syUser.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        Long total = queryFactory.select(syUser.count())
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectCount()").from(syUser)
                /* andRoleEq 이 syRole 을 참조하므로 join 필요 (목록/페이징과 동일 필터 집합 유지) */
                .leftJoin(syRole).on(syRole.roleId.eq(syUser.roleId)) // 역할
                .where(wheres)
                .fetchOne();
        return CmUtil.nvlLong(total);
    }

    /* 부서 트리 — 선택 노드 + 모든 자손 부서 사용자까지 포함 */
    private BooleanExpression andDeptIdIn(SyUserDto.Request search) {
        return search != null && StringUtils.hasText(search.getDeptId())
                // [QueryDSL] 부서 트리 자손ID 수집
                ? syUser.deptId.in(syDeptRepository.selectTreeDeptIds(search.getDeptId()))
                : null;
    }

    /* searchType 예: "authMethodCd,deptId,loginId,loginPwdHash,profileAttachId" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("authMethodCd", syUser.authMethodCd), // 인증방식 — AUTH_METHOD_CD
            QdslUtil.FieldDef.like("deptId", syUser.deptId), // 부서ID 검색값
            QdslUtil.FieldDef.like("loginId", syUser.loginId), // 로그인 아이디
            QdslUtil.FieldDef.like("loginPwdHash", syUser.loginPwdHash), // 비밀번호 (bcrypt)
            QdslUtil.FieldDef.like("profileAttachId", syUser.profileAttachId), // 프로필 첨부아이디
            QdslUtil.FieldDef.like("roleId", syUser.roleId), // 역할ID (sy_role.role_id)
            QdslUtil.FieldDef.like("userEmail", syUser.userEmail), // 이메일
            QdslUtil.FieldDef.like("userId", syUser.userId), // 사용자ID (YYMMDDhhmmss+rand4)
            QdslUtil.FieldDef.like("userMemo", syUser.userMemo), // 메모
            QdslUtil.FieldDef.like("userNm", syUser.userNm), // 사용자명
            QdslUtil.FieldDef.like("userPhone", syUser.userPhone), // 연락처
            QdslUtil.FieldDef.like("userStatusCd", syUser.userStatusCd) // 상태 — USER_STATUS_CD {ACTIVE:활성, INACTIVE:비활성}
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("userId", syUser.userId,
                   "userNm", syUser.userNm,
                   "loginId", syUser.loginId,
                   "regDate", syUser.regDate,
                   "updDate", syUser.updDate),
        new OrderSpecifier<>(Order.DESC, syUser.regDate));
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
        if (StringUtils.hasText(s.getDateRangeStart())) {
            sql.append("      AND t.reg_date >= CAST(:dateRangeStart AS timestamp)\n");
            p.put("dateRangeStart", s.getDateRangeStart());
        }
        if (StringUtils.hasText(s.getDateRangeEnd())) {
            sql.append("      AND t.reg_date <= CAST(:dateRangeEnd   AS timestamp) + INTERVAL '23:59:59.999999'\n");
            p.put("dateRangeEnd", s.getDateRangeEnd());
        }
    }
}