package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReview;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdReview;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdReview QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdReviewRepositoryImpl implements QPdReviewRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdReview r = QPdReview.pdReview;

    /** 단건 조회 */
    @Override
    public Optional<PdReviewDto.Item> selectById(String reviewId) {
        PdReviewDto.Item dto = baseQuery()
                .where(r.reviewId.eq(reviewId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    @Override
    public List<PdReviewDto.Item> selectList(PdReviewDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdReviewDto.Item> query = baseQuery().where(where);
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
    public PdReviewDto.PageResponse selectPageList(PdReviewDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdReviewDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdReviewDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(r.count()).from(r).where(where).fetchOne();

        PdReviewDto.PageResponse res = new PdReviewDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query (DTO Item 필드만 매핑) */
    private JPAQuery<PdReviewDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdReviewDto.Item.class,
                        r.reviewId, r.siteId, r.prodId, r.memberId,
                        r.reviewTitle, r.reviewContent, r.rating,
                        r.helpfulCnt, r.unhelpfulCnt,
                        r.reviewStatusCd, r.reviewStatusCdBefore,
                        r.reviewDate,
                        r.regBy, r.regDate, r.updBy, r.updDate
                ))
                .from(r);
    }

    /** 검색조건 빌드 — Mapper XML pdReviewCond 와 동일 동작 */
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    private BooleanBuilder buildCondition(PdReviewDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))   w.and(r.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getReviewId())) w.and(r.reviewId.eq(s.getReviewId()));
        if (StringUtils.hasText(s.getProdId()))   w.and(r.prodId.eq(s.getProdId()));

        // searchValue + searchType (reviewTitle)
        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",reviewTitle,")) or.or(r.reviewTitle.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        // dateType + dateStart + dateEnd
        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(r.regDate.goe(start)).and(r.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(r.updDate.goe(start)).and(r.updDate.lt(endExcl));
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
    private List<OrderSpecifier<?>> buildOrder(PdReviewDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, r.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("reviewId".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.reviewId));
                } else if ("reviewTitle".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.reviewTitle));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.regDate));
                }
            }
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(PdReview entity) {
        if (entity.getReviewId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(r);
        boolean hasAny = false;

        if (entity.getSiteId()               != null) { update.set(r.siteId,               entity.getSiteId());               hasAny = true; }
        if (entity.getProdId()               != null) { update.set(r.prodId,               entity.getProdId());               hasAny = true; }
        if (entity.getMemberId()             != null) { update.set(r.memberId,             entity.getMemberId());             hasAny = true; }
        if (entity.getReviewTitle()          != null) { update.set(r.reviewTitle,          entity.getReviewTitle());          hasAny = true; }
        if (entity.getReviewContent()        != null) { update.set(r.reviewContent,        entity.getReviewContent());        hasAny = true; }
        if (entity.getRating()               != null) { update.set(r.rating,               entity.getRating());               hasAny = true; }
        if (entity.getHelpfulCnt()           != null) { update.set(r.helpfulCnt,           entity.getHelpfulCnt());           hasAny = true; }
        if (entity.getUnhelpfulCnt()         != null) { update.set(r.unhelpfulCnt,         entity.getUnhelpfulCnt());         hasAny = true; }
        if (entity.getReviewStatusCd()       != null) { update.set(r.reviewStatusCd,       entity.getReviewStatusCd());       hasAny = true; }
        if (entity.getReviewStatusCdBefore() != null) { update.set(r.reviewStatusCdBefore, entity.getReviewStatusCdBefore()); hasAny = true; }
        if (entity.getReviewDate()           != null) { update.set(r.reviewDate,           entity.getReviewDate());           hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(r.updBy,                entity.getUpdBy());                hasAny = true; }
        if (entity.getUpdDate()              != null) { update.set(r.updDate,              entity.getUpdDate());              hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(r.reviewId.eq(entity.getReviewId())).execute();
        return (int) affected;
    }
}
