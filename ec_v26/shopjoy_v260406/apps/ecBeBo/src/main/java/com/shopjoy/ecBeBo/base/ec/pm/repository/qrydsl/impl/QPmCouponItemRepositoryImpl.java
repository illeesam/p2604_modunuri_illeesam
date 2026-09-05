package com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl.impl;

import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmCouponItemDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmCouponItem;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.QPmCouponItem;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.QPmCoupon;
import com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl.QPmCouponItemRepository;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;
/** PmCouponItem(쿠폰 적용 대상 항목 (상품/카테고리/판매자/브랜드)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmCouponItemRepositoryImpl implements QPmCouponItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmCouponItemRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QPmCouponItem pmCouponItem = QPmCouponItem.pmCouponItem;
    private static final QPmCoupon couponEx = QPmCoupon.pmCoupon;    /*
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
                        couponEx.validFrom.as("applyStartDate"),  // 적용시작일 (pm_coupon.valid_from, 조인)
                        couponEx.validTo.as("applyEndDate"),      // 적용종료일 (pm_coupon.valid_to, 조인)
                        pmCouponItem.regBy,  // 등록자
                        pmCouponItem.regDate,  // 등록일시
                        pmCouponItem.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        pmCouponItem.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(pmCouponItem)
                .leftJoin(couponEx).on(couponEx.couponId.eq(pmCouponItem.couponId)) // 쿠폰 (적용기간 조인)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(pmCouponItem.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(pmCouponItem.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(pmCouponItem.siteId)) // 사이트

                ;
    }

    /* 쿠폰 대상 상품 키조회 */
    @Override
    public Optional<PmCouponItemDto.Item> selectById(String couponItemId) {
        PmCouponItemDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmCouponItem.couponItemId.eq(couponItemId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 쿠폰 대상 상품 목록조회 */
    @Override
    public List<PmCouponItemDto.Item> selectList(PmCouponItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pmCouponItem.couponItemId, search.getCouponItemId())); // 쿠폰항목ID 필터
        whereList.add(QdslUtil.strEq(pmCouponItem.couponId, search.getCouponId())); // 쿠폰ID 필터 (pm_coupon.coupon_id)
        whereList.add(QdslUtil.strEq(pmCouponItem.targetId, search.getTargetId())); // 대상ID 필터 (prod_id/category_id/vendor_id/brand_id)
        whereList.add(QdslUtil.strEq(pmCouponItem.targetTypeCd, search.getTargetTypeCd())); // 대상유형 필터
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCouponItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCouponItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pmCouponItem.siteId, search.getSiteId())); // 사이트ID

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PmCouponItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<PmCouponItemDto.Item> list = query.fetch();
        return list;
    }

    /* 쿠폰 대상 상품 페이지조회 */
    @Override
    public BasePage<PmCouponItemDto.Item> selectPageData(PmCouponItemDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pmCouponItem.couponItemId, search.getCouponItemId())); // 쿠폰항목ID 필터
        whereList.add(QdslUtil.strEq(pmCouponItem.couponId, search.getCouponId())); // 쿠폰ID 필터 (pm_coupon.coupon_id)
        whereList.add(QdslUtil.strEq(pmCouponItem.targetId, search.getTargetId())); // 대상ID 필터 (prod_id/category_id/vendor_id/brand_id)
        whereList.add(QdslUtil.strEq(pmCouponItem.targetTypeCd, search.getTargetTypeCd())); // 대상유형 필터
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCouponItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCouponItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pmCouponItem.siteId, search.getSiteId())); // 사이트ID
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PmCouponItemDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PmCouponItemDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmCouponItem.count())
                .where(wheres)
                .fetchOne();

        BasePage<PmCouponItemDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "couponId,couponItemId,targetId,targetTypeCd" (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("couponId", pmCouponItem.couponId), // 쿠폰ID 필터 (pm_coupon.coupon_id)
            QdslUtil.FieldDef.like("couponItemId", pmCouponItem.couponItemId), // 쿠폰항목ID 필터
            QdslUtil.FieldDef.like("targetId", pmCouponItem.targetId), // 대상ID 필터 (prod_id/category_id/vendor_id/brand_id)
            QdslUtil.FieldDef.like("targetTypeCd", pmCouponItem.targetTypeCd) // 대상유형 필터
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
