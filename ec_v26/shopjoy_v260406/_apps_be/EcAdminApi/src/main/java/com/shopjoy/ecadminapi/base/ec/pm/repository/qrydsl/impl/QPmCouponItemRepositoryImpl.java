package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
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

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmCouponItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmCouponItemRepositoryImpl implements QPmCouponItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmCouponItemRepositoryImpl";
    private static final QPmCouponItem pmCouponItem = QPmCouponItem.pmCouponItem;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pmCouponItem.regDate,
        "upd_date", pmCouponItem.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("couponId", pmCouponItem.couponId),
        Map.entry("couponItemId", pmCouponItem.couponItemId),
        Map.entry("siteId", pmCouponItem.siteId),
        Map.entry("targetId", pmCouponItem.targetId),
        Map.entry("targetTypeCd", pmCouponItem.targetTypeCd)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * COUPON_ITEM_TARGET  {PRODUCT: '상품', CATEGORY: '카테고리', VENDOR: '판매자', BRAND: '브랜드'}
     */
    private JPAQuery<PmCouponItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmCouponItemDto.Item.class,
                        pmCouponItem.couponItemId,   // 쿠폰항목ID (PK, YYMMDDhhmmss+rand4)
                        pmCouponItem.couponId,       // 쿠폰ID (pm_coupon.coupon_id)
                        pmCouponItem.siteId,         // 사이트ID (sy_site.site_id)
                        pmCouponItem.targetTypeCd,   // 대상유형 — COUPON_ITEM_TARGET {PRODUCT: '상품', CATEGORY: '카테고리', VENDOR: '판매자', BRAND: '브랜드'}
                        pmCouponItem.targetId,       // 대상ID (prod_id / category_id / vendor_id / brand_id)
                        pmCouponItem.regBy, pmCouponItem.regDate
                ))
                .from(pmCouponItem);
    }

    /* 쿠폰 대상 상품 키조회 */
    @Override
    public Optional<PmCouponItemDto.Item> selectById(String couponItemId) {
        PmCouponItemDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmCouponItem.couponItemId.eq(couponItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 쿠폰 대상 상품 목록조회 */
    @Override
    public List<PmCouponItemDto.Item> selectList(PmCouponItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pmCouponItem.siteId, search.getSiteId()),
                    QdslUtil.strEq(pmCouponItem.couponItemId, search.getCouponItemId()),
                    QdslUtil.strEq(pmCouponItem.couponId, search.getCouponId()),
                    QdslUtil.strEq(pmCouponItem.targetId, search.getTargetId()),
                    QdslUtil.strEq(pmCouponItem.targetTypeCd, search.getTargetTypeCd()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 쿠폰 대상 상품 페이지조회 */
    @Override
    public PmCouponItemDto.PageResponse selectPageData(PmCouponItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pmCouponItem.siteId, search.getSiteId()),
                QdslUtil.strEq(pmCouponItem.couponItemId, search.getCouponItemId()),
                QdslUtil.strEq(pmCouponItem.couponId, search.getCouponId()),
                QdslUtil.strEq(pmCouponItem.targetId, search.getTargetId()),
                QdslUtil.strEq(pmCouponItem.targetTypeCd, search.getTargetTypeCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmCouponItemDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmCouponItemDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmCouponItem.count())
                .where(wheres)
                .fetchOne();

        PmCouponItemDto.PageResponse res = new PmCouponItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(PmCouponItemDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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
