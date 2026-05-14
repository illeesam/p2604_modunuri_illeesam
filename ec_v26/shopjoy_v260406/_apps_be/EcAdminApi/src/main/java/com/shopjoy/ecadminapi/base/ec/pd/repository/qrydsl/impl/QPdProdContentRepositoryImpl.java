package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdContentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdContent;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdContent;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdProdContent QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdContentRepositoryImpl implements QPdProdContentRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdProdContent c = QPdProdContent.pdProdContent;

    @Override
    public Optional<PdProdContentDto.Item> selectById(String prodContentId) {
        PdProdContentDto.Item dto = baseQuery()
                .where(c.prodContentId.eq(prodContentId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PdProdContentDto.Item> selectList(PdProdContentDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdContentDto.Item> query = baseQuery().where(where);
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
    public PdProdContentDto.PageResponse selectPageList(PdProdContentDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdContentDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdContentDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(c.count()).from(c).where(where).fetchOne();

        PdProdContentDto.PageResponse res = new PdProdContentDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query — DTO 필드만 프로젝션 */
    private JPAQuery<PdProdContentDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdProdContentDto.Item.class,
                        c.prodContentId,
                        c.siteId,
                        c.prodId,
                        c.contentTypeCd,
                        c.contentHtml,
                        c.sortOrd,
                        c.useYn,
                        c.regBy,
                        c.regDate,
                        c.updBy,
                        c.updDate
                ))
                .from(c);
    }

    private BooleanBuilder buildCondition(PdProdContentDto.Request req) {
        BooleanBuilder w = new BooleanBuilder();
        if (req == null) return w;

        if (StringUtils.hasText(req.getProdId()))        w.and(c.prodId.eq(req.getProdId()));
        if (StringUtils.hasText(req.getSiteId()))        w.and(c.siteId.eq(req.getSiteId()));
        if (StringUtils.hasText(req.getProdContentId())) w.and(c.prodContentId.eq(req.getProdContentId()));

        if (StringUtils.hasText(req.getDateType())
                && StringUtils.hasText(req.getDateStart())
                && StringUtils.hasText(req.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(req.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(req.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (req.getDateType()) {
                case "reg_date":
                    w.and(c.regDate.goe(start)).and(c.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(c.updDate.goe(start)).and(c.updDate.lt(endExcl));
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
    private List<OrderSpecifier<?>> buildOrder(PdProdContentDto.Request req) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = req == null ? null : req.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, c.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("prodContentId".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.prodContentId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(PdProdContent entity) {
        if (entity.getProdContentId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(c);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(c.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getProdId()        != null) { update.set(c.prodId,        entity.getProdId());        hasAny = true; }
        if (entity.getContentTypeCd() != null) { update.set(c.contentTypeCd, entity.getContentTypeCd()); hasAny = true; }
        if (entity.getContentHtml()   != null) { update.set(c.contentHtml,   entity.getContentHtml());   hasAny = true; }
        if (entity.getSortOrd()       != null) { update.set(c.sortOrd,       entity.getSortOrd());       hasAny = true; }
        if (entity.getUseYn()         != null) { update.set(c.useYn,         entity.getUseYn());         hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(c.updBy,         entity.getUpdBy());         hasAny = true; }
        if (entity.getUpdDate()       != null) { update.set(c.updDate,       entity.getUpdDate());       hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(c.prodContentId.eq(entity.getProdContentId())).execute();
        return (int) affected;
    }
}
