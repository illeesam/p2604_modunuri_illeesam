package com.shopjoy.ecadminapi.base.ec.pd.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSkuDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSku;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdSku;
import com.shopjoy.ecadminapi.base.ec.pd.repository.QPdProdSkuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdProdSku QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdSkuRepositoryImpl implements QPdProdSkuRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdProdSku s = QPdProdSku.pdProdSku;

    @Override
    public Optional<PdProdSkuDto.Item> selectById(String skuId) {
        PdProdSkuDto.Item dto = baseQuery()
                .where(s.skuId.eq(skuId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PdProdSkuDto.Item> selectList(PdProdSkuDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdSkuDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public PdProdSkuDto.PageResponse selectPageList(PdProdSkuDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdSkuDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdSkuDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(s.count()).from(s).where(where).fetchOne();

        PdProdSkuDto.PageResponse res = new PdProdSkuDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query — DTO 필드만 프로젝션 */
    private JPAQuery<PdProdSkuDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdProdSkuDto.Item.class,
                        s.skuId,
                        s.prodId,
                        s.optItemId1,
                        s.optItemId2,
                        s.skuCode,
                        s.addPrice,
                        s.useYn,
                        s.regBy,
                        s.regDate,
                        s.updBy,
                        s.updDate
                ))
                .from(s);
    }

    private BooleanBuilder buildCondition(PdProdSkuDto.Request req) {
        BooleanBuilder w = new BooleanBuilder();
        if (req == null) return w;

        if (StringUtils.hasText(req.getProdId())) w.and(s.prodId.eq(req.getProdId()));
        if (StringUtils.hasText(req.getSiteId())) w.and(s.siteId.eq(req.getSiteId()));
        if (StringUtils.hasText(req.getSkuId()))  w.and(s.skuId.eq(req.getSkuId()));

        if (StringUtils.hasText(req.getDateType())
                && StringUtils.hasText(req.getDateStart())
                && StringUtils.hasText(req.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(req.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(req.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (req.getDateType()) {
                case "reg_date":
                    w.and(s.regDate.goe(start)).and(s.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(s.updDate.goe(start)).and(s.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdProdSkuDto.Request req) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = req == null ? null : req.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, s.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  s.skuId));   break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, s.skuId));   break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  s.regDate)); break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, s.regDate)); break;
            default:         orders.add(new OrderSpecifier(Order.DESC, s.regDate)); break;
        }
        return orders;
    }

    @Override
    public int updateSelective(PdProdSku entity) {
        if (entity.getSkuId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(s);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(s.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getProdId()       != null) { update.set(s.prodId,       entity.getProdId());       hasAny = true; }
        if (entity.getOptItemId1()   != null) { update.set(s.optItemId1,   entity.getOptItemId1());   hasAny = true; }
        if (entity.getOptItemId2()   != null) { update.set(s.optItemId2,   entity.getOptItemId2());   hasAny = true; }
        if (entity.getSkuCode()      != null) { update.set(s.skuCode,      entity.getSkuCode());      hasAny = true; }
        if (entity.getAddPrice()     != null) { update.set(s.addPrice,     entity.getAddPrice());     hasAny = true; }
        if (entity.getProdOptStock() != null) { update.set(s.prodOptStock, entity.getProdOptStock()); hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(s.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(s.updBy,        entity.getUpdBy());        hasAny = true; }
        if (entity.getUpdDate()      != null) { update.set(s.updDate,      entity.getUpdDate());      hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(s.skuId.eq(entity.getSkuId())).execute();
        return (int) affected;
    }
}
