package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUiArea;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpUiArea;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpUiAreaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** DpUiArea QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QDpUiAreaRepositoryImpl implements QDpUiAreaRepository {

    private final JPAQueryFactory queryFactory;
    private static final QDpUiArea a = QDpUiArea.dpUiArea;

    @Override
    public Optional<DpUiAreaDto.Item> selectById(String uiAreaId) {
        DpUiAreaDto.Item dto = baseQuery()
                .where(a.uiAreaId.eq(uiAreaId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<DpUiAreaDto.Item> selectList(DpUiAreaDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<DpUiAreaDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public DpUiAreaDto.PageResponse selectPageList(DpUiAreaDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<DpUiAreaDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<DpUiAreaDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(a.count()).from(a).where(where).fetchOne();

        DpUiAreaDto.PageResponse res = new DpUiAreaDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<DpUiAreaDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(DpUiAreaDto.Item.class,
                        a.uiAreaId, a.uiId, a.areaId, a.areaSortOrd,
                        a.visibilityTargets, a.dispEnv, a.dispYn,
                        a.dispStartDate, a.dispEndDate, a.useYn,
                        a.regBy, a.regDate, a.updBy, a.updDate
                ))
                .from(a);
    }

    private BooleanBuilder buildCondition(DpUiAreaDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getUiAreaId())) w.and(a.uiAreaId.eq(s.getUiAreaId()));
        if (StringUtils.hasText(s.getUseYn()))    w.and(a.useYn.eq(s.getUseYn()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(a.regDate.goe(start)).and(a.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(a.updDate.goe(start)).and(a.updDate.lt(endExcl));
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
    private List<OrderSpecifier<?>> buildOrder(DpUiAreaDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("uiAreaId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.uiAreaId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(DpUiArea entity) {
        if (entity.getUiAreaId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getUiId()              != null) { update.set(a.uiId,              entity.getUiId());              hasAny = true; }
        if (entity.getAreaId()            != null) { update.set(a.areaId,            entity.getAreaId());            hasAny = true; }
        if (entity.getAreaSortOrd()       != null) { update.set(a.areaSortOrd,       entity.getAreaSortOrd());       hasAny = true; }
        if (entity.getVisibilityTargets() != null) { update.set(a.visibilityTargets, entity.getVisibilityTargets()); hasAny = true; }
        if (entity.getDispEnv()           != null) { update.set(a.dispEnv,           entity.getDispEnv());           hasAny = true; }
        if (entity.getDispYn()            != null) { update.set(a.dispYn,            entity.getDispYn());            hasAny = true; }
        if (entity.getDispStartDate()     != null) { update.set(a.dispStartDate,     entity.getDispStartDate());     hasAny = true; }
        if (entity.getDispEndDate()       != null) { update.set(a.dispEndDate,       entity.getDispEndDate());       hasAny = true; }
        if (entity.getUseYn()             != null) { update.set(a.useYn,             entity.getUseYn());             hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(a.updBy,             entity.getUpdBy());             hasAny = true; }
        if (entity.getUpdDate()           != null) { update.set(a.updDate,           entity.getUpdDate());           hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(a.uiAreaId.eq(entity.getUiAreaId())).execute();
        return (int) affected;
    }
}
