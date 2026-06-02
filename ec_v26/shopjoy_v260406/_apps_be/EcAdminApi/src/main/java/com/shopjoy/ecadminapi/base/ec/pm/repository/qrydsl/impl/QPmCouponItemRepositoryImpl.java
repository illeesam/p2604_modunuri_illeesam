package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponItem;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCouponItem;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCouponItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PmCouponItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmCouponItemRepositoryImpl implements QPmCouponItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmCouponItemRepositoryImpl";
    private static final QPmCouponItem pmCouponItem = QPmCouponItem.pmCouponItem;

    /* 쿠폰 대상 상품 baseSelColumnQuery */
    private JPAQuery<PmCouponItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmCouponItemDto.Item.class,
                        pmCouponItem.couponItemId, pmCouponItem.couponId, pmCouponItem.siteId,
                        pmCouponItem.targetTypeCd, pmCouponItem.targetId,
                        pmCouponItem.regBy, pmCouponItem.regDate
                ))
                .from(pmCouponItem);
    }

    /* 쿠폰 대상 상품 키조회 */
    @Override
    public Optional<PmCouponItemDto.Item> selectById(String couponItemId) {
        PmCouponItemDto.Item dto = baseSelColumnQuery()
                .where(pmCouponItem.couponItemId.eq(couponItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 쿠폰 대상 상품 목록조회 */
    @Override
    public List<PmCouponItemDto.Item> selectList(PmCouponItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponItemDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndCouponItemId(search),
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

    /* 쿠폰 대상 상품 페이지조회 */
    @Override
    public PmCouponItemDto.PageResponse selectPageData(PmCouponItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponItemDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndCouponItemId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmCouponItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(pmCouponItem.count())
                .from(pmCouponItem)
                .where(
                baseAndSiteId(search),
                baseAndCouponItemId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        PmCouponItemDto.PageResponse res = new PmCouponItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* 쿠폰 대상 상품 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PmCouponItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pmCouponItem.siteId.eq(search.getSiteId()) : null;
    }

    /* couponItemId 정확 일치 */
    private BooleanExpression baseAndCouponItemId(PmCouponItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getCouponItemId())
                ? pmCouponItem.couponItemId.eq(search.getCouponItemId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PmCouponItemDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pmCouponItem.regDate.goe(start).and(pmCouponItem.regDate.lt(endExcl));
            case "upd_date": return pmCouponItem.updDate.goe(start).and(pmCouponItem.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PmCouponItemDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",couponId,", pmCouponItem.couponId, pattern);
        or = orLike(or, all, types, ",couponItemId,", pmCouponItem.couponItemId, pattern);
        or = orLike(or, all, types, ",siteId,", pmCouponItem.siteId, pattern);
        or = orLike(or, all, types, ",targetId,", pmCouponItem.targetId, pattern);
        or = orLike(or, all, types, ",targetTypeCd,", pmCouponItem.targetTypeCd, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PmCouponItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pmCouponItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmCouponItem.couponItemId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("couponItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmCouponItem.couponItemId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmCouponItem.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pmCouponItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmCouponItem.couponItemId));
        }
        return orders;
    }

    /* 쿠폰 대상 상품 수정 */


    @Override
    public int updateSelective(PmCouponItem entity) {
        if (entity.getCouponItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmCouponItem);
        boolean hasAny = false;

        if (entity.getCouponId()    != null) { update.set(pmCouponItem.couponId,    entity.getCouponId());    hasAny = true; }
        if (entity.getSiteId()      != null) { update.set(pmCouponItem.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getTargetTypeCd()!= null) { update.set(pmCouponItem.targetTypeCd,entity.getTargetTypeCd());hasAny = true; }
        if (entity.getTargetId()    != null) { update.set(pmCouponItem.targetId,    entity.getTargetId());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pmCouponItem.couponItemId.eq(entity.getCouponItemId())).execute();
        return (int) affected;
    }
}
