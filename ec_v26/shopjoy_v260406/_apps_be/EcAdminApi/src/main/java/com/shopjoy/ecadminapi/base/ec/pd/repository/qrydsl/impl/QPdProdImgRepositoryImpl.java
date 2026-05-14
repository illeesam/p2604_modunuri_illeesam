package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdImgDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdImg;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdImg;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdImgRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdProdImg QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdImgRepositoryImpl implements QPdProdImgRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdProdImg i = QPdProdImg.pdProdImg;

    @Override
    public Optional<PdProdImgDto.Item> selectById(String prodImgId) {
        PdProdImgDto.Item dto = baseQuery()
                .where(i.prodImgId.eq(prodImgId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PdProdImgDto.Item> selectList(PdProdImgDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdImgDto.Item> query = baseQuery().where(where);
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
    public PdProdImgDto.PageResponse selectPageList(PdProdImgDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdImgDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdImgDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(i.count()).from(i).where(where).fetchOne();

        PdProdImgDto.PageResponse res = new PdProdImgDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query — DTO 필드만 프로젝션 */
    private JPAQuery<PdProdImgDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdProdImgDto.Item.class,
                        i.prodImgId,
                        i.siteId,
                        i.prodId,
                        i.optItemId1,
                        i.optItemId2,
                        i.attachId,
                        i.cdnHost,
                        i.cdnImgUrl,
                        i.cdnThumbUrl,
                        i.imgAltText,
                        i.sortOrd,
                        i.isThumb,
                        i.regBy,
                        i.regDate,
                        i.updBy,
                        i.updDate
                ))
                .from(i);
    }

    private BooleanBuilder buildCondition(PdProdImgDto.Request req) {
        BooleanBuilder w = new BooleanBuilder();
        if (req == null) return w;

        if (StringUtils.hasText(req.getProdId()))    w.and(i.prodId.eq(req.getProdId()));
        if (StringUtils.hasText(req.getSiteId()))    w.and(i.siteId.eq(req.getSiteId()));
        if (StringUtils.hasText(req.getProdImgId())) w.and(i.prodImgId.eq(req.getProdImgId()));

        if (StringUtils.hasText(req.getDateType())
                && StringUtils.hasText(req.getDateStart())
                && StringUtils.hasText(req.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(req.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(req.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (req.getDateType()) {
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

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdProdImgDto.Request req) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = req == null ? null : req.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, i.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("prodImgId".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.prodImgId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(PdProdImg entity) {
        if (entity.getProdImgId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(i.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getProdId()      != null) { update.set(i.prodId,      entity.getProdId());      hasAny = true; }
        if (entity.getOptItemId1()  != null) { update.set(i.optItemId1,  entity.getOptItemId1());  hasAny = true; }
        if (entity.getOptItemId2()  != null) { update.set(i.optItemId2,  entity.getOptItemId2());  hasAny = true; }
        if (entity.getAttachId()    != null) { update.set(i.attachId,    entity.getAttachId());    hasAny = true; }
        if (entity.getCdnHost()     != null) { update.set(i.cdnHost,     entity.getCdnHost());     hasAny = true; }
        if (entity.getCdnImgUrl()   != null) { update.set(i.cdnImgUrl,   entity.getCdnImgUrl());   hasAny = true; }
        if (entity.getCdnThumbUrl() != null) { update.set(i.cdnThumbUrl, entity.getCdnThumbUrl()); hasAny = true; }
        if (entity.getImgAltText()  != null) { update.set(i.imgAltText,  entity.getImgAltText());  hasAny = true; }
        if (entity.getSortOrd()     != null) { update.set(i.sortOrd,     entity.getSortOrd());     hasAny = true; }
        if (entity.getIsThumb()     != null) { update.set(i.isThumb,     entity.getIsThumb());     hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(i.updBy,       entity.getUpdBy());       hasAny = true; }
        if (entity.getUpdDate()     != null) { update.set(i.updDate,     entity.getUpdDate());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(i.prodImgId.eq(entity.getProdImgId())).execute();
        return (int) affected;
    }
}
