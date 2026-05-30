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
    private static final QSyUserRole r = QSyUserRole.syUserRole;
    private static final QSyUser usr  = new QSyUser("usr");
    private static final QSyRole rol  = QSyRole.syRole;
    private static final QSyUser usr2 = new QSyUser("usr2");

    /* 사용자별 역할 buildBaseQuery */
    private JPAQuery<SyUserRoleDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyUserRoleDto.Item.class,
                        r.userRoleId, r.userId, r.roleId, r.grantUserId,
                        r.grantDate, r.validFrom, r.validTo, r.userRoleRemark,
                        r.regBy, r.regDate, r.updBy, r.updDate,
                        rol.roleNm.as("roleNm"),
                        rol.roleCode.as("roleCode"),
                        usr2.userNm.as("grantUserNm")
                ))
                .from(r)
                .leftJoin(usr).on(usr.userId.eq(r.userId))
                .leftJoin(rol).on(rol.roleId.eq(r.roleId))
                .leftJoin(usr2).on(usr2.userId.eq(r.grantUserId));
    }

    /* 사용자별 역할 키조회 */
    @Override
    public Optional<SyUserRoleDto.Item> selectById(String userRoleId) {
        SyUserRoleDto.Item dto = buildBaseQuery()
                .where(r.userRoleId.eq(userRoleId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 사용자별 역할 목록조회 */
    @Override
    public List<SyUserRoleDto.Item> selectList(SyUserRoleDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyUserRoleDto.Item> query = buildBaseQuery().where(
                andUserRoleId(search),
                andUserId(search),
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

    /* 사용자별 역할 페이지조회 */
    @Override
    public SyUserRoleDto.PageResponse selectPageList(SyUserRoleDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyUserRoleDto.Item> query = buildBaseQuery().where(
                andUserRoleId(search),
                andUserId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyUserRoleDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(r.count()).from(r).where(
                andUserRoleId(search),
                andUserId(search),
                andDateRange(search),
                andSearchValue(search)
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
    private BooleanExpression andUserRoleId(SyUserRoleDto.Request search) {
        return search != null && StringUtils.hasText(search.getUserRoleId())
                ? r.userRoleId.eq(search.getUserRoleId()) : null;
    }

    /* userId 정확 일치 */
    private BooleanExpression andUserId(SyUserRoleDto.Request search) {
        return search != null && StringUtils.hasText(search.getUserId())
                ? r.userId.eq(search.getUserId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(SyUserRoleDto.Request search) {
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
    private BooleanExpression andSearchValue(SyUserRoleDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",grantUserId,", r.grantUserId, pattern);
        or = orLike(or, all, types, ",roleId,", r.roleId, pattern);
        or = orLike(or, all, types, ",siteId,", r.siteId, pattern);
        or = orLike(or, all, types, ",userId,", r.userId, pattern);
        or = orLike(or, all, types, ",userRoleId,", r.userRoleId, pattern);
        or = orLike(or, all, types, ",userRoleRemark,", r.userRoleRemark, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, r.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, r.userRoleId));
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
                    orders.add(new OrderSpecifier(order, r.userRoleId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, r.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, r.userRoleId));
        }
        return orders;
    }

    /* 사용자별 역할 수정 */
    @Override
    public int updateSelective(SyUserRole entity) {
        if (entity.getUserRoleId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(r);
        boolean hasAny = false;

        if (entity.getUserId()         != null) { update.set(r.userId,         entity.getUserId());         hasAny = true; }
        if (entity.getRoleId()         != null) { update.set(r.roleId,         entity.getRoleId());         hasAny = true; }
        if (entity.getGrantUserId()    != null) { update.set(r.grantUserId,    entity.getGrantUserId());    hasAny = true; }
        if (entity.getGrantDate()      != null) { update.set(r.grantDate,      entity.getGrantDate());      hasAny = true; }
        if (entity.getValidFrom()      != null) { update.set(r.validFrom,      entity.getValidFrom());      hasAny = true; }
        if (entity.getValidTo()        != null) { update.set(r.validTo,        entity.getValidTo());        hasAny = true; }
        if (entity.getUserRoleRemark() != null) { update.set(r.userRoleRemark, entity.getUserRoleRemark()); hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(r.updBy,          entity.getUpdBy());          hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(r.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(r.userRoleId.eq(entity.getUserRoleId())).execute();
        return (int) affected;
    }
}
