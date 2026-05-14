package com.shopjoy.ecadminapi.base.ec.pd.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdBundleItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdBundleItem;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdBundleItem;
import com.shopjoy.ecadminapi.base.ec.pd.repository.QPdProdBundleItemRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdProdBundleItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdBundleItemRepositoryImpl implements QPdProdBundleItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdProdBundleItem i    = QPdProdBundleItem.pdProdBundleItem;
    private static final QSySite           ste  = QSySite.sySite;
    private static final QPdProd           prd  = new QPdProd("prd");
    private static final QPdProd           prd2 = new QPdProd("prd2");

    @Override
    public Optional<PdProdBundleItemDto.Item> selectById(String bundleItemId) {
        PdProdBundleItemDto.Item dto = baseQuery()
                .where(i.bundleItemId.eq(bundleItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PdProdBundleItemDto.Item> selectList(PdProdBundleItemDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdBundleItemDto.Item> query = baseQuery().where(where);
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
    public PdProdBundleItemDto.PageResponse selectPageList(PdProdBundleItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdBundleItemDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdBundleItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(i.count()).from(i).where(where).fetchOne();

        PdProdBundleItemDto.PageResponse res = new PdProdBundleItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<PdProdBundleItemDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdProdBundleItemDto.Item.class,
                        i.bundleItemId, i.siteId, i.bundleProdId, i.itemProdId, i.itemSkuId,
                        i.itemQty, i.priceRate, i.sortOrd, i.useYn,
                        i.regBy, i.regDate, i.updBy, i.updDate
                ))
                .from(i)
                .leftJoin(ste).on(ste.siteId.eq(i.siteId))
                .leftJoin(prd).on(prd.prodId.eq(i.bundleProdId))
                .leftJoin(prd2).on(prd2.prodId.eq(i.itemProdId));
    }

    private BooleanBuilder buildCondition(PdProdBundleItemDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))       w.and(i.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getBundleItemId())) w.and(i.bundleItemId.eq(s.getBundleItemId()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(i.regDate.goe(start)).and(i.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(i.updDate.goe(start)).and(i.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdProdBundleItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, i.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  i.bundleItemId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, i.bundleItemId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  i.regDate));      break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, i.regDate));      break;
            default:         orders.add(new OrderSpecifier(Order.DESC, i.regDate));      break;
        }
        return orders;
    }

    @Override
    public int updateSelective(PdProdBundleItem entity) {
        if (entity.getBundleItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(i.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getBundleProdId() != null) { update.set(i.bundleProdId, entity.getBundleProdId()); hasAny = true; }
        if (entity.getItemProdId()   != null) { update.set(i.itemProdId,   entity.getItemProdId());   hasAny = true; }
        if (entity.getItemSkuId()    != null) { update.set(i.itemSkuId,    entity.getItemSkuId());    hasAny = true; }
        if (entity.getItemQty()      != null) { update.set(i.itemQty,      entity.getItemQty());      hasAny = true; }
        if (entity.getPriceRate()    != null) { update.set(i.priceRate,    entity.getPriceRate());    hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(i.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(i.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(i.updBy,        entity.getUpdBy());        hasAny = true; }
        if (entity.getUpdDate()      != null) { update.set(i.updDate,      entity.getUpdDate());      hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(i.bundleItemId.eq(entity.getBundleItemId())).execute();
        return (int) affected;
    }
}
