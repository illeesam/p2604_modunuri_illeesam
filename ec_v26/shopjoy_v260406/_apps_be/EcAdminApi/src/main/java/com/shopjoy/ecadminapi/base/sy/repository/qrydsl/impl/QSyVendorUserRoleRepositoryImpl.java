package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendorUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendorUserRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUserRole;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyVendorUserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyVendorUserRole QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyVendorUserRoleRepositoryImpl implements QSyVendorUserRoleRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyVendorUserRole r = QSyVendorUserRole.syVendorUserRole;
    private static final QSyVendor vnd = QSyVendor.syVendor;
    private static final QSyVendorUser vu = QSyVendorUser.syVendorUser;
    private static final QSyRole rol = QSyRole.syRole;
    private static final QSyUser gu = QSyUser.syUser;

    private JPAQuery<SyVendorUserRoleDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyVendorUserRoleDto.Item.class,
                        r.vendorUserRoleId, r.vendorId, r.userId, r.roleId,
                        r.grantUserId, r.grantDate, r.validFrom, r.validTo,
                        r.vendorUserRoleRemark,
                        r.regBy, r.regDate, r.updBy, r.updDate,
                        vnd.vendorNm.as("vendorNm"),
                        vu.memberNm.as("memberNm"),
                        rol.roleNm.as("roleNm"),
                        gu.userNm.as("grantUserNm")
                ))
                .from(r)
                .leftJoin(vnd).on(vnd.vendorId.eq(r.vendorId))
                .leftJoin(vu).on(vu.vendorUserId.eq(r.userId))
                .leftJoin(rol).on(rol.roleId.eq(r.roleId))
                .leftJoin(gu).on(gu.userId.eq(r.grantUserId));
    }

    @Override
    public Optional<SyVendorUserRoleDto.Item> selectById(String vendorUserRoleId) {
        SyVendorUserRoleDto.Item dto = buildBaseQuery()
                .where(r.vendorUserRoleId.eq(vendorUserRoleId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyVendorUserRoleDto.Item> selectList(SyVendorUserRoleDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyVendorUserRoleDto.Item> query = buildBaseQuery().where(where);
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
    public SyVendorUserRoleDto.PageResponse selectPageList(SyVendorUserRoleDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyVendorUserRoleDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyVendorUserRoleDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(r.count()).from(r).where(where).fetchOne();

        SyVendorUserRoleDto.PageResponse res = new SyVendorUserRoleDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(SyVendorUserRoleDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getVendorUserRoleId())) w.and(r.vendorUserRoleId.eq(s.getVendorUserRoleId()));
        if (StringUtils.hasText(s.getVendorId()))         w.and(r.vendorId.eq(s.getVendorId()));
        if (StringUtils.hasText(s.getUserId()))           w.and(r.userId.eq(s.getUserId()));
        if (StringUtils.hasText(s.getRoleId()))           w.and(r.roleId.eq(s.getRoleId()));

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

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyVendorUserRoleDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, r.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  r.vendorUserRoleId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, r.vendorUserRoleId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  r.regDate));          break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, r.regDate));          break;
            default:         orders.add(new OrderSpecifier(Order.DESC, r.regDate));          break;
        }
        return orders;
    }

    @Override
    public int updateSelective(SyVendorUserRole entity) {
        if (entity.getVendorUserRoleId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(r);
        boolean hasAny = false;

        if (entity.getVendorId()             != null) { update.set(r.vendorId,             entity.getVendorId());             hasAny = true; }
        if (entity.getUserId()               != null) { update.set(r.userId,               entity.getUserId());               hasAny = true; }
        if (entity.getRoleId()               != null) { update.set(r.roleId,               entity.getRoleId());               hasAny = true; }
        if (entity.getGrantUserId()          != null) { update.set(r.grantUserId,          entity.getGrantUserId());          hasAny = true; }
        if (entity.getGrantDate()            != null) { update.set(r.grantDate,            entity.getGrantDate());            hasAny = true; }
        if (entity.getValidFrom()            != null) { update.set(r.validFrom,            entity.getValidFrom());            hasAny = true; }
        if (entity.getValidTo()              != null) { update.set(r.validTo,              entity.getValidTo());              hasAny = true; }
        if (entity.getVendorUserRoleRemark() != null) { update.set(r.vendorUserRoleRemark, entity.getVendorUserRoleRemark()); hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(r.updBy,                entity.getUpdBy());                hasAny = true; }
        if (entity.getUpdDate()              != null) { update.set(r.updDate,              entity.getUpdDate());              hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(r.vendorUserRoleId.eq(entity.getVendorUserRoleId())).execute();
        return (int) affected;
    }
}
