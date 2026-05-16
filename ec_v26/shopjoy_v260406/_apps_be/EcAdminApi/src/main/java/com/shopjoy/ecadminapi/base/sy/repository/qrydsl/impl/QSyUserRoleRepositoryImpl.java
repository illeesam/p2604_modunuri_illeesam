package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
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
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyUserRoleDto.Item> query = buildBaseQuery().where(where);
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

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyUserRoleDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyUserRoleDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(r.count()).from(r).where(where).fetchOne();

        SyUserRoleDto.PageResponse res = new SyUserRoleDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 사용자별 역할 buildCondition */
    private BooleanBuilder buildCondition(SyUserRoleDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getUserRoleId())) w.and(r.userRoleId.eq(s.getUserRoleId()));
        if (StringUtils.hasText(s.getRoleId()))     w.and(r.roleId.eq(s.getRoleId()));
        if (StringUtils.hasText(s.getUserId()))     w.and(r.userId.eq(s.getUserId()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(r.regDate.goe(start)).and(r.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(r.updDate.goe(start)).and(r.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
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
        if (entity.getUpdDate()        != null) { update.set(r.updDate,        entity.getUpdDate());        hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(r.userRoleId.eq(entity.getUserRoleId())).execute();
        return (int) affected;
    }
}
