package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.repository.SyRoleRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleDto;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRole;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyRoleRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.springframework.context.annotation.Lazy;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
/** SyRole(역할 (권한그룹)) QueryDSL Custom 구현체 */
public class QSyRoleRepositoryImpl implements QSyRoleRepository {

    private final JPAQueryFactory queryFactory;
    private final SyRoleRepository syRoleRepository;
    private final SyPathRepository syPathRepository;
    private final EntityManager em;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyRoleRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QSyRole syRole = QSyRole.syRole;

    public QSyRoleRepositoryImpl(JPAQueryFactory queryFactory, SyPathRepository syPathRepository, @Lazy SyRoleRepository syRoleRepository, EntityManager em) {
        this.queryFactory = queryFactory;
        this.syPathRepository = syPathRepository;
        this.syRoleRepository = syRoleRepository;
        this.em = em;
    }
    private static final QVwSyCode cdRt = new QVwSyCode("cd_rt");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * ROLE_TYPE     {SYSTEM: '시스템', CUSTOM: '커스텀'}
     * USE_YN        {Y: '사용', N: '미사용'}
     * RESTRICT_PERM {Y: '제한권한', N: '일반권한'}
     */
    private JPAQuery<SyRoleDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyRoleDto.Item.class,
                        syRole.roleId,          // 역할ID (YYMMDDhhmmss+rand4)
                        syRole.roleCode,        // 역할코드
                        syRole.roleNm,          // 역할명
                        syRole.parentRoleId,    // 상위역할ID
                        syRole.roleTypeCd,      // 역할유형 — ROLE_TYPE {SYSTEM: '시스템', CUSTOM: '커스텀'}
                        syRole.sortOrd,         // 정렬순서
                        syRole.useYn,           // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                        syRole.restrictPerm,    // 제한권한여부 — RESTRICT_PERM {Y: '제한권한', N: '일반권한'}
                        syRole.roleRemark,      // 비고
                        syRole.regBy,           // 등록자
                        syRole.regDate,         // 등록일시
                        syRole.updBy,           // 수정자
                        syRole.updDate,         // 수정일시
                        syRole.pathId,          // 점(.) 구분 표시경로 (트리 빌드용)
                        syRole.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(syRole)
                .leftJoin(cdRt).on(cdRt.codeGrp.eq("ROLE_TYPE_CD").and(cdRt.codeValue.eq(syRole.roleTypeCd))) // 역할유형
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(syRole.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(syRole.regBy)) // 등록자
                ;
    }

    /* 역할(권한) 키조회 */
    @Override
    public Optional<SyRoleDto.Item> selectById(String roleId) {
        SyRoleDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syRole.roleId.eq(roleId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 역할(권한) 목록조회 */
    @Override
    public List<SyRoleDto.Item> selectList(SyRoleDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syRole.roleId, search.getRoleId()));
        whereList.add(andParentRoleIdIn(search));
        whereList.add(QdslUtil.strEq(syRole.roleTypeCd, search.getRoleTypeCd()));
        whereList.add(QdslUtil.strEq(syRole.useYn, search.getUseYn()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syRole.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syRole.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyRoleDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<SyRoleDto.Item> list = query.fetch();
        return list;
    }

    /* 역할(권한) 페이지조회 */
    @Override
    public BasePage<SyRoleDto.Item> selectPageData(SyRoleDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syRole.roleId, search.getRoleId()));
        whereList.add(andParentRoleIdIn(search));
        whereList.add(QdslUtil.strEq(syRole.roleTypeCd, search.getRoleTypeCd()));
        whereList.add(QdslUtil.strEq(syRole.useYn, search.getUseYn()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syRole.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syRole.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<SyRoleDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyRoleDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syRole.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyRoleDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* 검색조건 기준 전체 카운트 (대량 export 안전 상한 검증용) */
    @Override
    public long selectCount(SyRoleDto.Request search) {
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syRole.roleId, search.getRoleId()));
        whereList.add(andParentRoleIdIn(search));
        whereList.add(QdslUtil.strEq(syRole.roleTypeCd, search.getRoleTypeCd()));
        whereList.add(QdslUtil.strEq(syRole.useYn, search.getUseYn()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syRole.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syRole.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        Long total = queryFactory.select(syRole.count()).setHint("org.hibernate.comment", QRY_SRC + " :: selectCount()").from(syRole).where(wheres).fetchOne();
        return CmUtil.nvlLong(total);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */

    /* parentRoleId 트리 — 선택 노드 + 모든 자손 역할 포함 (sy_role 자기참조 재귀 CTE 인라인) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("parentRoleId", syRole.parentRoleId),
            QdslUtil.FieldDef.like("pathId", syRole.pathId),
            QdslUtil.FieldDef.like("restrictPerm", syRole.restrictPerm),
            QdslUtil.FieldDef.like("roleCode", syRole.roleCode),
            QdslUtil.FieldDef.like("roleId", syRole.roleId),
            QdslUtil.FieldDef.like("roleNm", syRole.roleNm),
            QdslUtil.FieldDef.like("roleRemark", syRole.roleRemark),
            QdslUtil.FieldDef.like("roleTypeCd", syRole.roleTypeCd),
            QdslUtil.FieldDef.like("useYn", syRole.useYn)
        ));
    }

    @SuppressWarnings("unchecked")
    private BooleanExpression andParentRoleIdIn(SyRoleDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getParentRoleId())) return null;
        String sql = "WITH RECURSIVE t AS ( "
                  + "  SELECT role_id FROM sy_role WHERE role_id = :rootRoleId "
                  + "  UNION ALL "
                  + "  SELECT c.role_id FROM sy_role c JOIN t ON c.parent_role_id = t.role_id "
                  + ") SELECT role_id FROM t";
        Query q = em.createNativeQuery(sql);
        q.setParameter("rootRoleId", search.getParentRoleId());
        List<String> roleIds = (List<String>) q.getResultList();
        return syRole.roleId.in(roleIds);
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("roleId", syRole.roleId,
                   "roleNm", syRole.roleNm,
                   "regDate", syRole.regDate,
                   "sortOrd", syRole.sortOrd),
        new OrderSpecifier<>(Order.ASC, syRole.sortOrd),
        new OrderSpecifier<>(Order.ASC, syRole.regDate),
        new OrderSpecifier<>(Order.ASC, syRole.roleId));
    }

    /* 역할(권한) 수정 */
    @Override
    public int updateSelective(SyRole entity) {
        if (entity.getRoleId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syRole);
        boolean hasAny = false;

        if (entity.getRoleCode()     != null) { update.set(syRole.roleCode,     entity.getRoleCode());     hasAny = true; }
        if (entity.getRoleNm()       != null) { update.set(syRole.roleNm,       entity.getRoleNm());       hasAny = true; }
        if (entity.getParentRoleId() != null) { update.set(syRole.parentRoleId, entity.getParentRoleId()); hasAny = true; }
        if (entity.getRoleTypeCd()   != null) { update.set(syRole.roleTypeCd,   entity.getRoleTypeCd());   hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(syRole.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(syRole.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getRestrictPerm() != null) { update.set(syRole.restrictPerm, entity.getRestrictPerm()); hasAny = true; }
        if (entity.getRoleRemark()   != null) { update.set(syRole.roleRemark,   entity.getRoleRemark());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(syRole.updBy,        entity.getUpdBy());        hasAny = true; }
        update.set(syRole.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (entity.getPathId()       != null) { update.set(syRole.pathId,       entity.getPathId());       hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(syRole.roleId.eq(entity.getRoleId())).execute();
        return (int) affected;
    }
}
