package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRoleMenu;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRoleMenu;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyRoleMenuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyRoleMenu QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyRoleMenuRepositoryImpl implements QSyRoleMenuRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyRoleMenu m = QSyRoleMenu.syRoleMenu;
    private static final QSySite ste = QSySite.sySite;

    private JPAQuery<SyRoleMenuDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyRoleMenuDto.Item.class,
                        m.roleMenuId, m.siteId, m.roleId, m.menuId, m.permLevel,
                        m.regBy, m.regDate, m.updBy, m.updDate
                ))
                .from(m)
                .leftJoin(ste).on(ste.siteId.eq(m.siteId));
    }

    @Override
    public Optional<SyRoleMenuDto.Item> selectById(String roleMenuId) {
        SyRoleMenuDto.Item dto = buildBaseQuery()
                .where(m.roleMenuId.eq(roleMenuId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyRoleMenuDto.Item> selectList(SyRoleMenuDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyRoleMenuDto.Item> query = buildBaseQuery().where(where);
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

    @Override
    public SyRoleMenuDto.PageResponse selectPageList(SyRoleMenuDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyRoleMenuDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyRoleMenuDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(m.count()).from(m).where(where).fetchOne();

        SyRoleMenuDto.PageResponse res = new SyRoleMenuDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(SyRoleMenuDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))     w.and(m.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getRoleMenuId())) w.and(m.roleMenuId.eq(s.getRoleMenuId()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(m.regDate.goe(start)).and(m.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(m.updDate.goe(start)).and(m.updDate.lt(endExcl));
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
    private List<OrderSpecifier<?>> buildOrder(SyRoleMenuDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, m.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("roleMenuId".equals(field)) {
                    orders.add(new OrderSpecifier(order, m.roleMenuId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, m.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(SyRoleMenu entity) {
        if (entity.getRoleMenuId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(m);
        boolean hasAny = false;

        if (entity.getSiteId()    != null) { update.set(m.siteId,    entity.getSiteId());    hasAny = true; }
        if (entity.getRoleId()    != null) { update.set(m.roleId,    entity.getRoleId());    hasAny = true; }
        if (entity.getMenuId()    != null) { update.set(m.menuId,    entity.getMenuId());    hasAny = true; }
        if (entity.getPermLevel() != null) { update.set(m.permLevel, entity.getPermLevel()); hasAny = true; }
        if (entity.getUpdBy()     != null) { update.set(m.updBy,     entity.getUpdBy());     hasAny = true; }
        if (entity.getUpdDate()   != null) { update.set(m.updDate,   entity.getUpdDate());   hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(m.roleMenuId.eq(entity.getRoleMenuId())).execute();
        return (int) affected;
    }
}
