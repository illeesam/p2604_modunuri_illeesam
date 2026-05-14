package com.shopjoy.ecadminapi.base.ec.pd.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSetItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSetItem;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdSetItem;
import com.shopjoy.ecadminapi.base.ec.pd.repository.QPdProdSetItemRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdProdSetItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdSetItemRepositoryImpl implements QPdProdSetItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdProdSetItem i    = QPdProdSetItem.pdProdSetItem;
    private static final QSySite        ste  = QSySite.sySite;
    private static final QPdProd        prd  = new QPdProd("prd");
    private static final QPdProd        prd2 = new QPdProd("prd2");

    @Override
    public Optional<PdProdSetItemDto.Item> selectById(String setItemId) {
        PdProdSetItemDto.Item dto = baseQuery()
                .where(i.setItemId.eq(setItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PdProdSetItemDto.Item> selectList(PdProdSetItemDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdSetItemDto.Item> query = baseQuery().where(where);
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
    public PdProdSetItemDto.PageResponse selectPageList(PdProdSetItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdSetItemDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdSetItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(i.count()).from(i).where(where).fetchOne();

        PdProdSetItemDto.PageResponse res = new PdProdSetItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<PdProdSetItemDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdProdSetItemDto.Item.class,
                        i.setItemId, i.siteId, i.setProdId, i.itemProdId, i.itemSkuId,
                        i.itemNm, i.itemQty, i.itemDesc, i.sortOrd, i.useYn,
                        i.regBy, i.regDate, i.updBy, i.updDate
                ))
                .from(i)
                .leftJoin(ste).on(ste.siteId.eq(i.siteId))
                .leftJoin(prd).on(prd.prodId.eq(i.setProdId))
                .leftJoin(prd2).on(prd2.prodId.eq(i.itemProdId));
    }

    private BooleanBuilder buildCondition(PdProdSetItemDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))    w.and(i.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getSetItemId())) w.and(i.setItemId.eq(s.getSetItemId()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_item_nm")) or.or(i.itemNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

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
    private List<OrderSpecifier<?>> buildOrder(PdProdSetItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, i.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  i.setItemId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, i.setItemId)); break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  i.itemNm));    break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, i.itemNm));    break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  i.regDate));   break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, i.regDate));   break;
            default:         orders.add(new OrderSpecifier(Order.DESC, i.regDate));   break;
        }
        return orders;
    }

    @Override
    public int updateSelective(PdProdSetItem entity) {
        if (entity.getSetItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(i.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getSetProdId()  != null) { update.set(i.setProdId,  entity.getSetProdId());  hasAny = true; }
        if (entity.getItemProdId() != null) { update.set(i.itemProdId, entity.getItemProdId()); hasAny = true; }
        if (entity.getItemSkuId()  != null) { update.set(i.itemSkuId,  entity.getItemSkuId());  hasAny = true; }
        if (entity.getItemNm()     != null) { update.set(i.itemNm,     entity.getItemNm());     hasAny = true; }
        if (entity.getItemQty()    != null) { update.set(i.itemQty,    entity.getItemQty());    hasAny = true; }
        if (entity.getItemDesc()   != null) { update.set(i.itemDesc,   entity.getItemDesc());   hasAny = true; }
        if (entity.getSortOrd()    != null) { update.set(i.sortOrd,    entity.getSortOrd());    hasAny = true; }
        if (entity.getUseYn()      != null) { update.set(i.useYn,      entity.getUseYn());      hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(i.updBy,      entity.getUpdBy());      hasAny = true; }
        if (entity.getUpdDate()    != null) { update.set(i.updDate,    entity.getUpdDate());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(i.setItemId.eq(entity.getSetItemId())).execute();
        return (int) affected;
    }
}
