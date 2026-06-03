package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponUsage;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCouponUsage;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCouponUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PmCouponUsage QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmCouponUsageRepositoryImpl implements QPmCouponUsageRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmCouponUsageRepositoryImpl";
    private static final QPmCouponUsage pmCouponUsage = QPmCouponUsage.pmCouponUsage;

    /* 쿠폰 사용 이력 baseSelColumnQuery */
    private JPAQuery<PmCouponUsageDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmCouponUsageDto.Item.class,
                        pmCouponUsage.usageId, pmCouponUsage.siteId, pmCouponUsage.couponId, pmCouponUsage.couponCode, pmCouponUsage.couponNm,
                        pmCouponUsage.memberId, pmCouponUsage.orderId, pmCouponUsage.orderItemId, pmCouponUsage.prodId,
                        pmCouponUsage.discountTypeCd, pmCouponUsage.discountValue, pmCouponUsage.discountAmt, pmCouponUsage.usedDate,
                        pmCouponUsage.regBy, pmCouponUsage.regDate, pmCouponUsage.updBy, pmCouponUsage.updDate
                ))
                .from(pmCouponUsage);
    }

    /* 쿠폰 사용 이력 키조회 */
    @Override
    public Optional<PmCouponUsageDto.Item> selectById(String usageId) {
        PmCouponUsageDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmCouponUsage.usageId.eq(usageId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 쿠폰 사용 이력 목록조회 */
    @Override
    public List<PmCouponUsageDto.Item> selectList(PmCouponUsageDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponUsageDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndUsageId(search),
                    baseAndDateRange(search),
                    baseAndSearchValue(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 쿠폰 사용 이력 페이지조회 */
    @Override
    public PmCouponUsageDto.PageResponse selectPageData(PmCouponUsageDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndUsageId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmCouponUsageDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmCouponUsageDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmCouponUsage.count())
                .where(wheres)
                .fetchOne();

        PmCouponUsageDto.PageResponse res = new PmCouponUsageDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PmCouponUsageDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pmCouponUsage.siteId.eq(search.getSiteId()) : null;
    }

    /* usageId 정확 일치 */
    private BooleanExpression baseAndUsageId(PmCouponUsageDto.Request search) {
        return search != null && StringUtils.hasText(search.getUsageId())
                ? pmCouponUsage.usageId.eq(search.getUsageId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PmCouponUsageDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pmCouponUsage.regDate.goe(start).and(pmCouponUsage.regDate.lt(endExcl));
            case "upd_date": return pmCouponUsage.updDate.goe(start).and(pmCouponUsage.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PmCouponUsageDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",couponCode,", pmCouponUsage.couponCode, pattern);
        or = orLike(or, all, types, ",couponId,", pmCouponUsage.couponId, pattern);
        or = orLike(or, all, types, ",couponNm,", pmCouponUsage.couponNm, pattern);
        or = orLike(or, all, types, ",discountTypeCd,", pmCouponUsage.discountTypeCd, pattern);
        or = orLike(or, all, types, ",memberId,", pmCouponUsage.memberId, pattern);
        or = orLike(or, all, types, ",orderId,", pmCouponUsage.orderId, pattern);
        or = orLike(or, all, types, ",orderItemId,", pmCouponUsage.orderItemId, pattern);
        or = orLike(or, all, types, ",prodId,", pmCouponUsage.prodId, pattern);
        or = orLike(or, all, types, ",siteId,", pmCouponUsage.siteId, pattern);
        or = orLike(or, all, types, ",usageId,", pmCouponUsage.usageId, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmCouponUsageDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pmCouponUsage.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmCouponUsage.usageId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("usageId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmCouponUsage.usageId));
                } else if ("couponNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmCouponUsage.couponNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmCouponUsage.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pmCouponUsage.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmCouponUsage.usageId));
        }
        return orders;
    }

    /* 쿠폰 사용 이력 수정 */


    @Override
    public int updateSelective(PmCouponUsage entity) {
        if (entity.getUsageId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmCouponUsage);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(pmCouponUsage.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getCouponId()       != null) { update.set(pmCouponUsage.couponId,       entity.getCouponId());       hasAny = true; }
        if (entity.getCouponCode()     != null) { update.set(pmCouponUsage.couponCode,     entity.getCouponCode());     hasAny = true; }
        if (entity.getCouponNm()       != null) { update.set(pmCouponUsage.couponNm,       entity.getCouponNm());       hasAny = true; }
        if (entity.getMemberId()       != null) { update.set(pmCouponUsage.memberId,       entity.getMemberId());       hasAny = true; }
        if (entity.getOrderId()        != null) { update.set(pmCouponUsage.orderId,        entity.getOrderId());        hasAny = true; }
        if (entity.getOrderItemId()    != null) { update.set(pmCouponUsage.orderItemId,    entity.getOrderItemId());    hasAny = true; }
        if (entity.getProdId()         != null) { update.set(pmCouponUsage.prodId,         entity.getProdId());         hasAny = true; }
        if (entity.getDiscountTypeCd() != null) { update.set(pmCouponUsage.discountTypeCd, entity.getDiscountTypeCd()); hasAny = true; }
        if (entity.getDiscountValue()  != null) { update.set(pmCouponUsage.discountValue,  entity.getDiscountValue());  hasAny = true; }
        if (entity.getDiscountAmt()    != null) { update.set(pmCouponUsage.discountAmt,    entity.getDiscountAmt());    hasAny = true; }
        if (entity.getUsedDate()       != null) { update.set(pmCouponUsage.usedDate,       entity.getUsedDate());       hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(pmCouponUsage.updBy,          entity.getUpdBy());          hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pmCouponUsage.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmCouponUsage.usageId.eq(entity.getUsageId())).execute();
        return (int) affected;
    }
}
