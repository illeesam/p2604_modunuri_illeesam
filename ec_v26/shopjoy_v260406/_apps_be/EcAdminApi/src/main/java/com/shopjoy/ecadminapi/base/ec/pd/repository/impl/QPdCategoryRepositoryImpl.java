package com.shopjoy.ecadminapi.base.ec.pd.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategory;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdCategory;
import com.shopjoy.ecadminapi.base.ec.pd.repository.QPdCategoryRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdCategory QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdCategoryRepositoryImpl implements QPdCategoryRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdCategory c   = QPdCategory.pdCategory;
    private static final QPdCategory p1  = new QPdCategory("p1");
    private static final QPdCategory p2  = new QPdCategory("p2");
    private static final QSyCode     cdCs = new QSyCode("cd_cs");

    @Override
    public Optional<PdCategoryDto.Item> selectById(String categoryId) {
        PdCategoryDto.Item dto = baseQuery()
                .where(c.categoryId.eq(categoryId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PdCategoryDto.Item> selectList(PdCategoryDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdCategoryDto.Item> query = baseQuery().where(where);
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
    public PdCategoryDto.PageResponse selectPageList(PdCategoryDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdCategoryDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdCategoryDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(c.count()).from(c).where(where).fetchOne();

        PdCategoryDto.PageResponse res = new PdCategoryDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query */
    private JPAQuery<PdCategoryDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdCategoryDto.Item.class,
                        c.categoryId, c.siteId, c.parentCategoryId, c.categoryNm,
                        c.categoryDepth, c.sortOrd, c.categoryStatusCd, c.categoryStatusCdBefore,
                        c.imgUrl, c.categoryDesc,
                        c.regBy, c.regDate, c.updBy, c.updDate,
                        p1.categoryNm.as("parentCategoryNm"),
                        p2.categoryNm.as("grandParentCategoryNm"),
                        cdCs.codeLabel.as("categoryStatusCdNm")
                ))
                .from(c)
                .leftJoin(p1).on(p1.categoryId.eq(c.parentCategoryId))
                .leftJoin(p2).on(p2.categoryId.eq(p1.parentCategoryId))
                .leftJoin(cdCs).on(cdCs.codeGrp.eq("USE_YN").and(cdCs.codeValue.eq(c.categoryStatusCd)));
    }

    private BooleanBuilder buildCondition(PdCategoryDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))           w.and(c.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getCategoryId()))       w.and(c.categoryId.eq(s.getCategoryId()));
        if (s.getDepth() != null)                         w.and(c.categoryDepth.eq(s.getDepth()));
        if (StringUtils.hasText(s.getParentCategoryId())) w.and(c.parentCategoryId.eq(s.getParentCategoryId()));
        if (StringUtils.hasText(s.getStatus()))           w.and(c.categoryStatusCd.eq(s.getStatus()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_category_nm")) or.or(c.categoryNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdCategoryDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            // default: depth asc, sort_ord asc, reg_date asc
            orders.add(new OrderSpecifier(Order.ASC, c.categoryDepth));
            orders.add(new OrderSpecifier(Order.ASC, c.sortOrd));
            orders.add(new OrderSpecifier(Order.ASC, c.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  c.categoryId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, c.categoryId)); break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  c.categoryNm)); break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, c.categoryNm)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  c.regDate));    break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, c.regDate));    break;
            default:
                orders.add(new OrderSpecifier(Order.ASC, c.categoryDepth));
                orders.add(new OrderSpecifier(Order.ASC, c.sortOrd));
                orders.add(new OrderSpecifier(Order.ASC, c.regDate));
                break;
        }
        return orders;
    }

    @Override
    public int updateSelective(PdCategory entity) {
        if (entity.getCategoryId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(c);
        boolean hasAny = false;

        if (entity.getCategoryNm()             != null) { update.set(c.categoryNm,             entity.getCategoryNm());             hasAny = true; }
        if (entity.getCategoryStatusCd()       != null) { update.set(c.categoryStatusCd,       entity.getCategoryStatusCd());       hasAny = true; }
        if (entity.getCategoryStatusCdBefore() != null) { update.set(c.categoryStatusCdBefore, entity.getCategoryStatusCdBefore()); hasAny = true; }
        if (entity.getSortOrd()                != null) { update.set(c.sortOrd,                entity.getSortOrd());                hasAny = true; }
        if (entity.getImgUrl()                 != null) { update.set(c.imgUrl,                 entity.getImgUrl());                 hasAny = true; }
        if (entity.getCategoryDesc()           != null) { update.set(c.categoryDesc,           entity.getCategoryDesc());           hasAny = true; }
        if (entity.getUpdBy()                  != null) { update.set(c.updBy,                  entity.getUpdBy());                  hasAny = true; }
        if (entity.getUpdDate()                != null) { update.set(c.updDate,                entity.getUpdDate());                hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(c.categoryId.eq(entity.getCategoryId())).execute();
        return (int) affected;
    }
}
