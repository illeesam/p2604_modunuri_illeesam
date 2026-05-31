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
    private static final QPmCouponUsage u = QPmCouponUsage.pmCouponUsage;

    /* 쿠폰 사용 이력 키조회 */
    @Override
    public Optional<PmCouponUsageDto.Item> selectById(String usageId) {
        PmCouponUsageDto.Item dto = baseQuery()
                .where(u.usageId.eq(usageId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 쿠폰 사용 이력 목록조회 */
    @Override
    public List<PmCouponUsageDto.Item> selectList(PmCouponUsageDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponUsageDto.Item> query = baseQuery().where(
                baseAndSiteId(search),
                baseAndUsageId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
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

    /* 쿠폰 사용 이력 페이지조회 */
    @Override
    public PmCouponUsageDto.PageResponse selectPageList(PmCouponUsageDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponUsageDto.Item> query = baseQuery().where(
                baseAndSiteId(search),
                baseAndUsageId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmCouponUsageDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(u.count())
                .from(u)
                .where(
                baseAndSiteId(search),
                baseAndUsageId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        PmCouponUsageDto.PageResponse res = new PmCouponUsageDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 쿠폰 사용 이력 baseQuery */
    private JPAQuery<PmCouponUsageDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmCouponUsageDto.Item.class,
                        u.usageId, u.siteId, u.couponId, u.couponCode, u.couponNm,
                        u.memberId, u.orderId, u.orderItemId, u.prodId,
                        u.discountTypeCd, u.discountValue, u.discountAmt, u.usedDate,
                        u.regBy, u.regDate, u.updBy, u.updDate
                ))
                .from(u);
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
                ? u.siteId.eq(search.getSiteId()) : null;
    }

    /* usageId 정확 일치 */
    private BooleanExpression baseAndUsageId(PmCouponUsageDto.Request search) {
        return search != null && StringUtils.hasText(search.getUsageId())
                ? u.usageId.eq(search.getUsageId()) : null;
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
            case "reg_date": return u.regDate.goe(start).and(u.regDate.lt(endExcl));
            case "upd_date": return u.updDate.goe(start).and(u.updDate.lt(endExcl));
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
        or = orLike(or, all, types, ",couponCode,", u.couponCode, pattern);
        or = orLike(or, all, types, ",couponId,", u.couponId, pattern);
        or = orLike(or, all, types, ",couponNm,", u.couponNm, pattern);
        or = orLike(or, all, types, ",discountTypeCd,", u.discountTypeCd, pattern);
        or = orLike(or, all, types, ",memberId,", u.memberId, pattern);
        or = orLike(or, all, types, ",orderId,", u.orderId, pattern);
        or = orLike(or, all, types, ",orderItemId,", u.orderItemId, pattern);
        or = orLike(or, all, types, ",prodId,", u.prodId, pattern);
        or = orLike(or, all, types, ",siteId,", u.siteId, pattern);
        or = orLike(or, all, types, ",usageId,", u.usageId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, u.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, u.usageId));
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
                    orders.add(new OrderSpecifier(order, u.usageId));
                } else if ("couponNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, u.couponNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, u.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, u.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, u.usageId));
        }
        return orders;
    }

    /* 쿠폰 사용 이력 수정 */
    @Override
    public int updateSelective(PmCouponUsage entity) {
        if (entity.getUsageId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(u);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(u.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getCouponId()       != null) { update.set(u.couponId,       entity.getCouponId());       hasAny = true; }
        if (entity.getCouponCode()     != null) { update.set(u.couponCode,     entity.getCouponCode());     hasAny = true; }
        if (entity.getCouponNm()       != null) { update.set(u.couponNm,       entity.getCouponNm());       hasAny = true; }
        if (entity.getMemberId()       != null) { update.set(u.memberId,       entity.getMemberId());       hasAny = true; }
        if (entity.getOrderId()        != null) { update.set(u.orderId,        entity.getOrderId());        hasAny = true; }
        if (entity.getOrderItemId()    != null) { update.set(u.orderItemId,    entity.getOrderItemId());    hasAny = true; }
        if (entity.getProdId()         != null) { update.set(u.prodId,         entity.getProdId());         hasAny = true; }
        if (entity.getDiscountTypeCd() != null) { update.set(u.discountTypeCd, entity.getDiscountTypeCd()); hasAny = true; }
        if (entity.getDiscountValue()  != null) { update.set(u.discountValue,  entity.getDiscountValue());  hasAny = true; }
        if (entity.getDiscountAmt()    != null) { update.set(u.discountAmt,    entity.getDiscountAmt());    hasAny = true; }
        if (entity.getUsedDate()       != null) { update.set(u.usedDate,       entity.getUsedDate());       hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(u.updBy,          entity.getUpdBy());          hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(u.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(u.usageId.eq(entity.getUsageId())).execute();
        return (int) affected;
    }
}
