package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.repository.SyRoleRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRole;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyRoleRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyRole QueryDSL Custom 구현체 */
public class QSyRoleRepositoryImpl implements QSyRoleRepository {

    private final JPAQueryFactory queryFactory;
    private final SyRoleRepository syRoleRepository;
    private final SyPathRepository syPathRepository;
    private final EntityManager em;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyRoleRepositoryImpl";
    private static final QSyRole syRole = QSyRole.syRole;

    public QSyRoleRepositoryImpl(JPAQueryFactory queryFactory, SyPathRepository syPathRepository, @Lazy SyRoleRepository syRoleRepository, EntityManager em) {
        this.queryFactory = queryFactory;
        this.syPathRepository = syPathRepository;
        this.syRoleRepository = syRoleRepository;
        this.em = em;
    }
    private static final QSySite sySite = QSySite.sySite;
    private static final QSyCode cdRt = new QSyCode("cd_rt");

    /* 역할(권한) baseSelColumnQuery */
    private JPAQuery<SyRoleDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyRoleDto.Item.class,
                        syRole.roleId, syRole.siteId, syRole.roleCode, syRole.roleNm, syRole.parentRoleId,
                        syRole.roleTypeCd, syRole.sortOrd, syRole.useYn, syRole.restrictPerm, syRole.roleRemark,
                        syRole.regBy, syRole.regDate, syRole.updBy, syRole.updDate, syRole.pathId,
                        sySite.siteNm.as("siteNm")
                ))
                .from(syRole)
                .leftJoin(sySite).on(sySite.siteId.eq(syRole.siteId))
                .leftJoin(cdRt).on(cdRt.codeGrp.eq("ROLE_TYPE").and(cdRt.codeValue.eq(syRole.roleTypeCd)));
    }

    /* 역할(권한) 키조회 */
    @Override
    public Optional<SyRoleDto.Item> selectById(String roleId) {
        SyRoleDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syRole.roleId.eq(roleId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 역할(권한) 목록조회 */
    @Override
    public List<SyRoleDto.Item> selectList(SyRoleDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyRoleDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndSiteId(search),
                baseAndRoleId(search),
                baseAndParentRoleId(search),
                baseAndRoleTypeCd(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 역할(권한) 페이지조회 */
    @Override
    public SyRoleDto.PageResponse selectPageData(SyRoleDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndRoleId(search),
                baseAndParentRoleId(search),
                baseAndRoleTypeCd(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<SyRoleDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list").where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyRoleDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(syRole.count()).from(syRole).where(wheres).fetchOne();

        SyRoleDto.PageResponse res = new SyRoleDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 검색조건 기준 전체 카운트 (대량 export 안전 상한 검증용) */
    @Override
    public long selectCount(SyRoleDto.Request search) {
        Long total = queryFactory.select(syRole.count()).from(syRole).where(
                baseAndSiteId(search),
                baseAndRoleId(search),
                baseAndParentRoleId(search),
                baseAndRoleTypeCd(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        ).fetchOne();
        return total == null ? 0L : total;
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyRoleDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? syRole.siteId.eq(search.getSiteId()) : null;
    }

    /* roleId 정확 일치 */
    private BooleanExpression baseAndRoleId(SyRoleDto.Request search) {
        return search != null && StringUtils.hasText(search.getRoleId())
                ? syRole.roleId.eq(search.getRoleId()) : null;
    }

    /* parentRoleId 트리 — 선택 노드 + 모든 자손 역할 포함 (sy_role 자기참조 재귀 CTE 인라인) */
    @SuppressWarnings("unchecked")
    private BooleanExpression baseAndParentRoleId(SyRoleDto.Request search) {
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

    /* roleTypeCd 정확 일치 */
    private BooleanExpression baseAndRoleTypeCd(SyRoleDto.Request search) {
        return search != null && StringUtils.hasText(search.getRoleTypeCd())
                ? syRole.roleTypeCd.eq(search.getRoleTypeCd()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(SyRoleDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? syRole.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(SyRoleDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return syRole.regDate.goe(start).and(syRole.regDate.lt(endExcl));
            case "upd_date": return syRole.updDate.goe(start).and(syRole.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyRoleDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",parentRoleId,", syRole.parentRoleId, pattern);
        or = orLike(or, all, types, ",pathId,", syRole.pathId, pattern);
        or = orLike(or, all, types, ",restrictPerm,", syRole.restrictPerm, pattern);
        or = orLike(or, all, types, ",roleCode,", syRole.roleCode, pattern);
        or = orLike(or, all, types, ",roleId,", syRole.roleId, pattern);
        or = orLike(or, all, types, ",roleNm,", syRole.roleNm, pattern);
        or = orLike(or, all, types, ",roleRemark,", syRole.roleRemark, pattern);
        or = orLike(or, all, types, ",roleTypeCd,", syRole.roleTypeCd, pattern);
        or = orLike(or, all, types, ",siteId,", syRole.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", syRole.useYn, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyRoleDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, syRole.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syRole.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syRole.roleId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("roleId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syRole.roleId));
                } else if ("roleNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, syRole.roleNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syRole.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, syRole.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, syRole.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syRole.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syRole.roleId));
        }
        return orders;
    }

    /* 역할(권한) 수정 */
    @Override
    public int updateSelective(SyRole entity) {
        if (entity.getRoleId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syRole);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(syRole.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getRoleCode()     != null) { update.set(syRole.roleCode,     entity.getRoleCode());     hasAny = true; }
        if (entity.getRoleNm()       != null) { update.set(syRole.roleNm,       entity.getRoleNm());       hasAny = true; }
        if (entity.getParentRoleId() != null) { update.set(syRole.parentRoleId, entity.getParentRoleId()); hasAny = true; }
        if (entity.getRoleTypeCd()   != null) { update.set(syRole.roleTypeCd,   entity.getRoleTypeCd());   hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(syRole.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(syRole.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getRestrictPerm() != null) { update.set(syRole.restrictPerm, entity.getRestrictPerm()); hasAny = true; }
        if (entity.getRoleRemark()   != null) { update.set(syRole.roleRemark,   entity.getRoleRemark());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(syRole.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syRole.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (entity.getPathId()       != null) { update.set(syRole.pathId,       entity.getPathId());       hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(syRole.roleId.eq(entity.getRoleId())).execute();
        return (int) affected;
    }
}
