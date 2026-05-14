package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewAttachDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewAttach;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdReview;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdReviewAttach;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdReviewAttachRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdReviewAttach QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdReviewAttachRepositoryImpl implements QPdReviewAttachRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdReviewAttach a = QPdReviewAttach.pdReviewAttach;
    private static final QPdReview       r = QPdReview.pdReview;

    /** 단건 조회 */
    @Override
    public Optional<PdReviewAttachDto.Item> selectById(String reviewAttachId) {
        PdReviewAttachDto.Item dto = baseQuerySingle()
                .where(a.reviewAttachId.eq(reviewAttachId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<PdReviewAttachDto.Item> selectList(PdReviewAttachDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search, true);

        JPAQuery<PdReviewAttachDto.Item> query = baseQueryWithJoin().where(where);
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

    /** 페이지 목록 */
    @Override
    public PdReviewAttachDto.PageResponse selectPageList(PdReviewAttachDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search, false);

        JPAQuery<PdReviewAttachDto.Item> query = baseQueryWithJoin().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdReviewAttachDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(a.count())
                .from(a)
                .leftJoin(r).on(r.reviewId.eq(a.reviewId))
                .where(where)
                .fetchOne();

        PdReviewAttachDto.PageResponse res = new PdReviewAttachDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** selectById 용 base query — pd_review JOIN 없음 */
    private JPAQuery<PdReviewAttachDto.Item> baseQuerySingle() {
        return queryFactory
                .select(Projections.bean(PdReviewAttachDto.Item.class,
                        a.reviewAttachId, a.siteId, a.reviewId, a.attachId,
                        a.mediaTypeCd, a.thumbUrl, a.sortOrd,
                        a.regBy, a.regDate, a.updBy, a.updDate
                ))
                .from(a);
    }

    /** 목록/페이지 용 base query — pd_review LEFT JOIN 포함 (prodId 조건 지원) */
    private JPAQuery<PdReviewAttachDto.Item> baseQueryWithJoin() {
        return queryFactory
                .select(Projections.bean(PdReviewAttachDto.Item.class,
                        a.reviewAttachId, a.siteId, a.reviewId, a.attachId,
                        a.mediaTypeCd, a.thumbUrl, a.sortOrd,
                        a.regBy, a.regDate, a.updBy, a.updDate
                ))
                .from(a)
                .leftJoin(r).on(r.reviewId.eq(a.reviewId));
    }

    /** 검색조건 빌드 — Mapper XML pdReviewAttachCond 와 동일 동작 */
    private BooleanBuilder buildCondition(PdReviewAttachDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))         w.and(a.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getReviewAttachId())) w.and(a.reviewAttachId.eq(s.getReviewAttachId()));
        if (StringUtils.hasText(s.getProdId()))         w.and(r.prodId.eq(s.getProdId()));

        // dateType + dateStart + dateEnd
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
     * 정렬조건 빌드 — Mapper XML 정렬절과 동일 토큰
     * @param withSortOrd selectList 의 default 는 sort_ord asc, reg_date desc 이지만 selectPageList 는 reg_date desc
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdReviewAttachDto.Request s, boolean withSortOrd) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            if (withSortOrd) {
                orders.add(new OrderSpecifier(Order.ASC, a.sortOrd));
                orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            } else {
                orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            }
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  a.reviewAttachId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, a.reviewAttachId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  a.regDate));        break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, a.regDate));        break;
            default:
                if (withSortOrd) {
                    orders.add(new OrderSpecifier(Order.ASC, a.sortOrd));
                    orders.add(new OrderSpecifier(Order.DESC, a.regDate));
                } else {
                    orders.add(new OrderSpecifier(Order.DESC, a.regDate));
                }
                break;
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(PdReviewAttach entity) {
        if (entity.getReviewAttachId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(a.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getReviewId()    != null) { update.set(a.reviewId,    entity.getReviewId());    hasAny = true; }
        if (entity.getAttachId()    != null) { update.set(a.attachId,    entity.getAttachId());    hasAny = true; }
        if (entity.getMediaTypeCd() != null) { update.set(a.mediaTypeCd, entity.getMediaTypeCd()); hasAny = true; }
        if (entity.getThumbUrl()    != null) { update.set(a.thumbUrl,    entity.getThumbUrl());    hasAny = true; }
        if (entity.getSortOrd()     != null) { update.set(a.sortOrd,     entity.getSortOrd());     hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(a.updBy,       entity.getUpdBy());       hasAny = true; }
        if (entity.getUpdDate()     != null) { update.set(a.updDate,     entity.getUpdDate());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(a.reviewAttachId.eq(entity.getReviewAttachId())).execute();
        return (int) affected;
    }
}
