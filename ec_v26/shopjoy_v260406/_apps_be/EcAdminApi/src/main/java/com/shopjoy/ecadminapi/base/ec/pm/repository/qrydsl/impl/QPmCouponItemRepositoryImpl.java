package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponItem;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCouponItem;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCouponItemRepository;
import lombok.RequiredArgsConstructor;

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
    private static final QPmCouponItem pmCouponItem = QPmCouponItem.pmCouponItem;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * COUPON_ITEM_TARGET  {PRODUCT: '상품', CATEGORY: '카테고리', VENDOR: '판매자', BRAND: '브랜드'}
     */
    private JPAQuery<PmCouponItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmCouponItemDto.Item.class,
                        pmCouponItem.couponItemId,   // 쿠폰항목ID (PK, YYMMDDhhmmss+rand4)
                        pmCouponItem.couponId,       // 쿠폰ID (pm_coupon.coupon_id)
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
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(pmCouponItem.couponItemId, search.getCouponItemId()));
        wheres.add(QdslUtil.strEq(pmCouponItem.couponId, search.getCouponId()));
        wheres.add(QdslUtil.strEq(pmCouponItem.targetId, search.getTargetId()));
        wheres.add(QdslUtil.strEq(pmCouponItem.targetTypeCd, search.getTargetTypeCd()));
        wheres.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCouponItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCouponItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PmCouponItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres2)
                .orderBy(orders);
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
    public BasePage<PmCouponItemDto.Item> selectPageData(PmCouponItemDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(pmCouponItem.couponItemId, search.getCouponItemId()));
        wheres.add(QdslUtil.strEq(pmCouponItem.couponId, search.getCouponId()));
        wheres.add(QdslUtil.strEq(pmCouponItem.targetId, search.getTargetId()));
        wheres.add(QdslUtil.strEq(pmCouponItem.targetTypeCd, search.getTargetTypeCd()));
        wheres.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCouponItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCouponItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);

        JPAQuery<PmCouponItemDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PmCouponItemDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres2)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmCouponItem.count())
                .where(wheres2)
                .fetchOne();

        BasePage<PmCouponItemDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("couponId", pmCouponItem.couponId),
            QdslUtil.FieldDef.like("couponItemId", pmCouponItem.couponItemId),
            QdslUtil.FieldDef.like("targetId", pmCouponItem.targetId),
            QdslUtil.FieldDef.like("targetTypeCd", pmCouponItem.targetTypeCd)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("couponItemId", pmCouponItem.couponItemId,
                   "regDate", pmCouponItem.regDate),
        new OrderSpecifier<>(Order.DESC, pmCouponItem.regDate),
        new OrderSpecifier<>(Order.ASC, pmCouponItem.couponItemId));
    }

    /* 쿠폰 대상 상품 수정 */
    @Override
    public int updateSelective(PmCouponItem entity) {
        if (entity.getCouponItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmCouponItem);
        boolean hasAny = false;

        if (entity.getCouponId()    != null) { update.set(pmCouponItem.couponId,    entity.getCouponId());    hasAny = true; }
        if (entity.getTargetTypeCd()!= null) { update.set(pmCouponItem.targetTypeCd,entity.getTargetTypeCd());hasAny = true; }
        if (entity.getTargetId()    != null) { update.set(pmCouponItem.targetId,    entity.getTargetId());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pmCouponItem.couponItemId.eq(entity.getCouponItemId())).execute();
        return (int) affected;
    }
}
