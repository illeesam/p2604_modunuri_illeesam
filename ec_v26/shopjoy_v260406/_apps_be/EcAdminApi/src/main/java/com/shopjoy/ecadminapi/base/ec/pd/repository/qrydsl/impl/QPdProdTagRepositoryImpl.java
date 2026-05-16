package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdTag;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdTag;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdTagRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdProdTag QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdTagRepositoryImpl implements QPdProdTagRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdProdTag t   = QPdProdTag.pdProdTag;
    private static final QPdProd    prd = QPdProd.pdProd;
    private static final QSySite    ste = QSySite.sySite;

    /* 상품 태그 키조회 */
    @Override
    public Optional<PdProdTagDto.Item> selectById(String prodTagId) {
        PdProdTagDto.Item dto = baseQuery()
                .where(t.prodTagId.eq(prodTagId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 태그 목록조회 */
    @Override
    public List<PdProdTagDto.Item> selectList(PdProdTagDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdTagDto.Item> query = baseQuery().where(where);
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

    /* 상품 태그 페이지조회 */
    @Override
    public PdProdTagDto.PageResponse selectPageList(PdProdTagDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdTagDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdTagDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(t.count()).from(t).where(where).fetchOne();

        PdProdTagDto.PageResponse res = new PdProdTagDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 상품 태그 baseQuery */
    private JPAQuery<PdProdTagDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdProdTagDto.Item.class,
                        t.prodTagId, t.siteId, t.prodId, t.tagId,
                        t.regBy, t.regDate
                ))
                .from(t)
                .leftJoin(prd).on(prd.prodId.eq(t.prodId))
                .leftJoin(ste).on(ste.siteId.eq(t.siteId));
    }

    /* 상품 태그 buildCondition */
    private BooleanBuilder buildCondition(PdProdTagDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))    w.and(t.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getProdTagId())) w.and(t.prodTagId.eq(s.getProdTagId()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(t.regDate.goe(start)).and(t.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(t.updDate.goe(start)).and(t.updDate.lt(endExcl));
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
    private List<OrderSpecifier<?>> buildOrder(PdProdTagDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, t.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("prodTagId".equals(field)) {
                    orders.add(new OrderSpecifier(order, t.prodTagId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, t.regDate));
                }
            }
        }
        return orders;
    }

    /* 상품 태그 수정 */
    @Override
    public int updateSelective(PdProdTag entity) {
        if (entity.getProdTagId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(t);
        boolean hasAny = false;

        if (entity.getSiteId() != null) { update.set(t.siteId, entity.getSiteId()); hasAny = true; }
        if (entity.getProdId() != null) { update.set(t.prodId, entity.getProdId()); hasAny = true; }
        if (entity.getTagId()  != null) { update.set(t.tagId,  entity.getTagId());  hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(t.prodTagId.eq(entity.getProdTagId())).execute();
        return (int) affected;
    }
}
