package com.shopjoy.ecadminapi.base.ec.pd.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategoryProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdCategory;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdCategoryProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.repository.QPdCategoryProdRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdCategoryProd QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdCategoryProdRepositoryImpl implements QPdCategoryProdRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdCategoryProd p   = QPdCategoryProd.pdCategoryProd;
    private static final QSySite         ste = QSySite.sySite;
    private static final QPdCategory     cat = QPdCategory.pdCategory;
    private static final QPdProd         prd = QPdProd.pdProd;

    @Override
    public Optional<PdCategoryProdDto.Item> selectById(String categoryProdId) {
        PdCategoryProdDto.Item dto = baseQuery()
                .where(p.categoryProdId.eq(categoryProdId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PdCategoryProdDto.Item> selectList(PdCategoryProdDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdCategoryProdDto.Item> query = baseQuery().where(where);
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
    public PdCategoryProdDto.PageResponse selectPageList(PdCategoryProdDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdCategoryProdDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdCategoryProdDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(p.count()).from(p).where(where).fetchOne();

        PdCategoryProdDto.PageResponse res = new PdCategoryProdDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<PdCategoryProdDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdCategoryProdDto.Item.class,
                        p.categoryProdId, p.siteId, p.categoryId, p.prodId,
                        p.categoryProdTypeCd, p.sortOrd, p.emphasisCd,
                        p.dispYn, p.dispStartDate, p.dispEndDate,
                        p.regBy, p.regDate, p.updBy, p.updDate,
                        ste.siteNm.as("siteNm"),
                        cat.categoryNm.as("categoryNm"),
                        prd.prodNm.as("prodNm")
                ))
                .from(p)
                .leftJoin(ste).on(ste.siteId.eq(p.siteId))
                .leftJoin(cat).on(cat.categoryId.eq(p.categoryId))
                .leftJoin(prd).on(prd.prodId.eq(p.prodId));
    }

    private BooleanBuilder buildCondition(PdCategoryProdDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))         w.and(p.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getCategoryProdId())) w.and(p.categoryProdId.eq(s.getCategoryProdId()));
        if (StringUtils.hasText(s.getProdId()))         w.and(p.prodId.eq(s.getProdId()));
        if (StringUtils.hasText(s.getCategoryId()))     w.and(p.categoryId.eq(s.getCategoryId()));
        if (StringUtils.hasText(s.getTypeCd()))         w.and(p.categoryProdTypeCd.eq(s.getTypeCd()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(p.regDate.goe(start)).and(p.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(p.updDate.goe(start)).and(p.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdCategoryProdDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, p.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  p.categoryProdId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, p.categoryProdId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  p.regDate));        break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, p.regDate));        break;
            default:         orders.add(new OrderSpecifier(Order.DESC, p.regDate));        break;
        }
        return orders;
    }

    @Override
    public int updateSelective(PdCategoryProd entity) {
        if (entity.getCategoryProdId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(p);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(p.siteId,             entity.getSiteId());             hasAny = true; }
        if (entity.getCategoryId()         != null) { update.set(p.categoryId,         entity.getCategoryId());         hasAny = true; }
        if (entity.getProdId()             != null) { update.set(p.prodId,             entity.getProdId());             hasAny = true; }
        if (entity.getCategoryProdTypeCd() != null) { update.set(p.categoryProdTypeCd, entity.getCategoryProdTypeCd()); hasAny = true; }
        if (entity.getSortOrd()            != null) { update.set(p.sortOrd,            entity.getSortOrd());            hasAny = true; }
        if (entity.getEmphasisCd()         != null) { update.set(p.emphasisCd,         entity.getEmphasisCd());         hasAny = true; }
        if (entity.getDispYn()             != null) { update.set(p.dispYn,             entity.getDispYn());             hasAny = true; }
        if (entity.getDispStartDate()      != null) { update.set(p.dispStartDate,      entity.getDispStartDate());      hasAny = true; }
        if (entity.getDispEndDate()        != null) { update.set(p.dispEndDate,        entity.getDispEndDate());        hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(p.categoryProdId.eq(entity.getCategoryProdId())).execute();
        return (int) affected;
    }
}
