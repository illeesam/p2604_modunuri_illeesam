package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyPropDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyProp;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyPropRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyProp QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyPropRepositoryImpl implements QSyPropRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyProp p = QSyProp.syProp;
    private static final QSySite ste = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    public Optional<SyPropDto.Item> selectById(String propId) {
        SyPropDto.Item dto = baseQuery().where(p.propId.eq(propId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyPropDto.Item> selectList(SyPropDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyPropDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public SyPropDto.PageResponse selectPageList(SyPropDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyPropDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyPropDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(p.count()).from(p).where(where).fetchOne();

        SyPropDto.PageResponse res = new SyPropDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<SyPropDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyPropDto.Item.class,
                        p.propId, p.siteId, p.pathId, p.propKey, p.propValue, p.propLabel,
                        p.propTypeCd, p.sortOrd, p.useYn, p.propRemark,
                        p.regBy, p.regDate, p.updBy, p.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(p)
                .leftJoin(ste).on(ste.siteId.eq(p.siteId));
    }

    private BooleanBuilder buildCondition(SyPropDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))     w.and(p.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getPathId()))     w.and(p.pathId.eq(s.getPathId()));
        if (StringUtils.hasText(s.getPropTypeCd())) w.and(p.propTypeCd.eq(s.getPropTypeCd()));

        if (StringUtils.hasText(s.getDateStart()) && StringUtils.hasText(s.getDateEnd()) && StringUtils.hasText(s.getDateType())) {
            LocalDate ds = LocalDate.parse(s.getDateStart(), DF);
            LocalDate de = LocalDate.parse(s.getDateEnd(), DF);
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(p.regDate.goe(ds.atStartOfDay())).and(p.regDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                case "upd_date":
                    w.and(p.updDate.goe(ds.atStartOfDay())).and(p.updDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                default: break;
            }
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyPropDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, p.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("propId".equals(field)) {
                    orders.add(new OrderSpecifier(order, p.propId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, p.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(SyProp entity) {
        if (entity.getPropId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(p);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(p.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getPathId()     != null) { update.set(p.pathId,     entity.getPathId());     hasAny = true; }
        if (entity.getPropKey()    != null) { update.set(p.propKey,    entity.getPropKey());    hasAny = true; }
        if (entity.getPropValue()  != null) { update.set(p.propValue,  entity.getPropValue());  hasAny = true; }
        if (entity.getPropLabel()  != null) { update.set(p.propLabel,  entity.getPropLabel());  hasAny = true; }
        if (entity.getPropTypeCd() != null) { update.set(p.propTypeCd, entity.getPropTypeCd()); hasAny = true; }
        if (entity.getSortOrd()    != null) { update.set(p.sortOrd,    entity.getSortOrd());    hasAny = true; }
        if (entity.getUseYn()      != null) { update.set(p.useYn,      entity.getUseYn());      hasAny = true; }
        if (entity.getPropRemark() != null) { update.set(p.propRemark, entity.getPropRemark()); hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(p.updBy,      entity.getUpdBy());      hasAny = true; }
        if (entity.getUpdDate()    != null) { update.set(p.updDate,    entity.getUpdDate());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(p.propId.eq(entity.getPropId())).execute();
        return (int) affected;
    }
}
