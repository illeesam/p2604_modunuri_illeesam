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
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyRoleRepositoryImpl";
    private static final QSyRole r = QSyRole.syRole;

    public QSyRoleRepositoryImpl(JPAQueryFactory queryFactory, SyPathRepository syPathRepository, @Lazy SyRoleRepository syRoleRepository) {
        this.queryFactory = queryFactory;
        this.syPathRepository = syPathRepository;
        this.syRoleRepository = syRoleRepository;
    }
    private static final QSySite ste = QSySite.sySite;
    private static final QSyCode cdRt = new QSyCode("cd_rt");

    /* 역할(권한) buildBaseQuery */
    private JPAQuery<SyRoleDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyRoleDto.Item.class,
                        r.roleId, r.siteId, r.roleCode, r.roleNm, r.parentRoleId,
                        r.roleTypeCd, r.sortOrd, r.useYn, r.restrictPerm, r.roleRemark,
                        r.regBy, r.regDate, r.updBy, r.updDate, r.pathId,
                        ste.siteNm.as("siteNm")
                ))
                .from(r)
                .leftJoin(ste).on(ste.siteId.eq(r.siteId))
                .leftJoin(cdRt).on(cdRt.codeGrp.eq("ROLE_TYPE").and(cdRt.codeValue.eq(r.roleTypeCd)));
    }

    /* 역할(권한) 키조회 */
    @Override
    public Optional<SyRoleDto.Item> selectById(String roleId) {
        SyRoleDto.Item dto = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(r.roleId.eq(roleId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 역할(권한) 목록조회 */
    @Override
    public List<SyRoleDto.Item> selectList(SyRoleDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyRoleDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                andSiteId(search),
                andRoleId(search),
                andRoleTypeCd(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
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
    public SyRoleDto.PageResponse selectPageList(SyRoleDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyRoleDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageList() :: list").where(
                andSiteId(search),
                andRoleId(search),
                andRoleTypeCd(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyRoleDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(r.count()).from(r).where(
                andSiteId(search),
                andRoleId(search),
                andRoleTypeCd(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();

        SyRoleDto.PageResponse res = new SyRoleDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 검색조건 기준 전체 카운트 (대량 export 안전 상한 검증용) */
    @Override
    public long selectCount(SyRoleDto.Request search) {
        Long total = queryFactory.select(r.count()).from(r).where(
                andSiteId(search),
                andRoleId(search),
                andRoleTypeCd(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();
        return total == null ? 0L : total;
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(SyRoleDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? r.siteId.eq(search.getSiteId()) : null;
    }

    /* roleId 정확 일치 */
    private BooleanExpression andRoleId(SyRoleDto.Request search) {
        return search != null && StringUtils.hasText(search.getRoleId())
                ? r.roleId.eq(search.getRoleId()) : null;
    }

    /* roleTypeCd 정확 일치 */
    private BooleanExpression andRoleTypeCd(SyRoleDto.Request search) {
        return search != null && StringUtils.hasText(search.getRoleTypeCd())
                ? r.roleTypeCd.eq(search.getRoleTypeCd()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression andUseYn(SyRoleDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? r.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(SyRoleDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return r.regDate.goe(start).and(r.regDate.lt(endExcl));
            case "upd_date": return r.updDate.goe(start).and(r.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(SyRoleDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",parentRoleId,", r.parentRoleId, pattern);
        or = orLike(or, all, types, ",pathId,", r.pathId, pattern);
        or = orLike(or, all, types, ",restrictPerm,", r.restrictPerm, pattern);
        or = orLike(or, all, types, ",roleCode,", r.roleCode, pattern);
        or = orLike(or, all, types, ",roleId,", r.roleId, pattern);
        or = orLike(or, all, types, ",roleNm,", r.roleNm, pattern);
        or = orLike(or, all, types, ",roleRemark,", r.roleRemark, pattern);
        or = orLike(or, all, types, ",roleTypeCd,", r.roleTypeCd, pattern);
        or = orLike(or, all, types, ",siteId,", r.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", r.useYn, pattern);
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
            orders.add(new OrderSpecifier<>(Order.ASC, r.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, r.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, r.roleId));

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
                    orders.add(new OrderSpecifier(order, r.roleId));
                } else if ("roleNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.roleNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, r.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, r.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, r.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, r.roleId));
        }
        return orders;
    }

    /* 역할(권한) 수정 */
    @Override
    public int updateSelective(SyRole entity) {
        if (entity.getRoleId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(r);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(r.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getRoleCode()     != null) { update.set(r.roleCode,     entity.getRoleCode());     hasAny = true; }
        if (entity.getRoleNm()       != null) { update.set(r.roleNm,       entity.getRoleNm());       hasAny = true; }
        if (entity.getParentRoleId() != null) { update.set(r.parentRoleId, entity.getParentRoleId()); hasAny = true; }
        if (entity.getRoleTypeCd()   != null) { update.set(r.roleTypeCd,   entity.getRoleTypeCd());   hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(r.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(r.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getRestrictPerm() != null) { update.set(r.restrictPerm, entity.getRestrictPerm()); hasAny = true; }
        if (entity.getRoleRemark()   != null) { update.set(r.roleRemark,   entity.getRoleRemark());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(r.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(r.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (entity.getPathId()       != null) { update.set(r.pathId,       entity.getPathId());       hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(r.roleId.eq(entity.getRoleId())).execute();
        return (int) affected;
    }
}
