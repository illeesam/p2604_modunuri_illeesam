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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUserRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserRole;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyUserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyUserRole QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyUserRoleRepositoryImpl implements QSyUserRoleRepository {

    private final JPAQueryFactory queryFactory;
    private final SyRoleRepository syRoleRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyUserRoleRepositoryImpl";
    private static final QSyUserRole syUserRole = QSyUserRole.syUserRole;
    private static final QSyUser usr  = new QSyUser("usr");
    private static final QSyRole syRole  = QSyRole.syRole;
    private static final QSyUser usr2 = new QSyUser("usr2");

    /* 사용자별 역할 baseSelColumnQuery */
    private JPAQuery<SyUserRoleDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyUserRoleDto.Item.class,
                        syUserRole.userRoleId, syUserRole.userId, syUserRole.roleId, syUserRole.grantUserId,
                        syUserRole.grantDate, syUserRole.validFrom, syUserRole.validTo, syUserRole.userRoleRemark,
                        syUserRole.regBy, syUserRole.regDate, syUserRole.updBy, syUserRole.updDate,
                        syRole.roleNm.as("roleNm"),
                        syRole.roleCode.as("roleCode"),
                        usr2.userNm.as("grantUserNm")
                ))
                .from(syUserRole)
                .leftJoin(usr).on(usr.userId.eq(syUserRole.userId))
                .leftJoin(syRole).on(syRole.roleId.eq(syUserRole.roleId))
                .leftJoin(usr2).on(usr2.userId.eq(syUserRole.grantUserId));
    }

    /* 사용자별 역할 키조회 */
    @Override
    public Optional<SyUserRoleDto.Item> selectById(String userRoleId) {
        SyUserRoleDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syUserRole.userRoleId.eq(userRoleId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 사용자별 역할 목록조회 */
    @Override
    public List<SyUserRoleDto.Item> selectList(SyUserRoleDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyUserRoleDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndUserRoleId(search),
                baseAndUserId(search),
                baseAndRoleId(search),
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

    /* 사용자별 역할 페이지조회 */
    @Override
    public SyUserRoleDto.PageResponse selectPageData(SyUserRoleDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyUserRoleDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list").where(
                baseAndUserRoleId(search),
                baseAndUserId(search),
                baseAndRoleId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyUserRoleDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(syUserRole.count()).from(syUserRole).where(
                baseAndUserRoleId(search),
                baseAndUserId(search),
                baseAndRoleId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        ).fetchOne();

        SyUserRoleDto.PageResponse res = new SyUserRoleDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 사용자별 역할 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* userRoleId 정확 일치 */
    private BooleanExpression baseAndUserRoleId(SyUserRoleDto.Request search) {
        return search != null && StringUtils.hasText(search.getUserRoleId())
                ? syUserRole.userRoleId.eq(search.getUserRoleId()) : null;
    }

    /* userId 정확 일치 */
    private BooleanExpression baseAndUserId(SyUserRoleDto.Request search) {
        return search != null && StringUtils.hasText(search.getUserId())
                ? syUserRole.userId.eq(search.getUserId()) : null;
    }

    /* roleId 정확 일치 */
    private BooleanExpression baseAndRoleId(SyUserRoleDto.Request search) {
        return search != null && StringUtils.hasText(search.getRoleId())
                ? syUserRole.roleId.eq(search.getRoleId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(SyUserRoleDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return syUserRole.regDate.goe(start).and(syUserRole.regDate.lt(endExcl));
            case "upd_date": return syUserRole.updDate.goe(start).and(syUserRole.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyUserRoleDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",grantUserId,", syUserRole.grantUserId, pattern);
        or = orLike(or, all, types, ",roleId,", syUserRole.roleId, pattern);
        or = orLike(or, all, types, ",siteId,", syUserRole.siteId, pattern);
        or = orLike(or, all, types, ",userId,", syUserRole.userId, pattern);
        or = orLike(or, all, types, ",userRoleId,", syUserRole.userRoleId, pattern);
        or = orLike(or, all, types, ",userRoleRemark,", syUserRole.userRoleRemark, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyUserRoleDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syUserRole.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syUserRole.userRoleId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("userRoleId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syUserRole.userRoleId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syUserRole.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syUserRole.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syUserRole.userRoleId));
        }
        return orders;
    }

    /* 사용자별 역할 수정 */
    @Override
    public int updateSelective(SyUserRole entity) {
        if (entity.getUserRoleId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syUserRole);
        boolean hasAny = false;

        if (entity.getUserId()         != null) { update.set(syUserRole.userId,         entity.getUserId());         hasAny = true; }
        if (entity.getRoleId()         != null) { update.set(syUserRole.roleId,         entity.getRoleId());         hasAny = true; }
        if (entity.getGrantUserId()    != null) { update.set(syUserRole.grantUserId,    entity.getGrantUserId());    hasAny = true; }
        if (entity.getGrantDate()      != null) { update.set(syUserRole.grantDate,      entity.getGrantDate());      hasAny = true; }
        if (entity.getValidFrom()      != null) { update.set(syUserRole.validFrom,      entity.getValidFrom());      hasAny = true; }
        if (entity.getValidTo()        != null) { update.set(syUserRole.validTo,        entity.getValidTo());        hasAny = true; }
        if (entity.getUserRoleRemark() != null) { update.set(syUserRole.userRoleRemark, entity.getUserRoleRemark()); hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(syUserRole.updBy,          entity.getUpdBy());          hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syUserRole.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syUserRole.userRoleId.eq(entity.getUserRoleId())).execute();
        return (int) affected;
    }
}
