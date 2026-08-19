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
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponUsage;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCouponUsage;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCouponUsageRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmCouponUsage QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmCouponUsageRepositoryImpl implements QPmCouponUsageRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmCouponUsageRepositoryImpl";
    private static final QPmCouponUsage pmCouponUsage = QPmCouponUsage.pmCouponUsage;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * discountTypeCd  {RATE: '정률', FIXED: '정액'} (Entity 주석 기준)
     */
    private JPAQuery<PmCouponUsageDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmCouponUsageDto.Item.class,
                        pmCouponUsage.couponUsageId,          // 사용이력ID (PK, YYMMDDhhmmss+rand4)
                        pmCouponUsage.couponId,         // 쿠폰ID (pm_coupon.coupon_id)
                        pmCouponUsage.couponCode,       // 쿠폰코드 스냅샷
                        pmCouponUsage.couponNm,         // 쿠폰명 스냅샷
                        pmCouponUsage.memberId,         // 회원ID (mb_member.member_id)
                        pmCouponUsage.orderId,          // 주문ID (od_order.order_id)
                        pmCouponUsage.orderItemId,      // 주문상품ID (od_order_item.order_item_id, 상품별 쿠폰 적용 시)
                        pmCouponUsage.prodId,           // 상품ID (pd_prod.prod_id, 쿠폰 적용 상품)
                        pmCouponUsage.discountTypeCd,   // 할인유형 — RATE: '정률' / FIXED: '정액'
                        pmCouponUsage.discountValue,    // 할인값 (정률: % / 정액: 원)
                        pmCouponUsage.discountAmt,      // 실할인금액
                        pmCouponUsage.usedDate,         // 사용일시
                        pmCouponUsage.regBy, pmCouponUsage.regDate, pmCouponUsage.updBy, pmCouponUsage.updDate
                ))
                .from(pmCouponUsage);
    }

    /* 쿠폰 사용 이력 키조회 */
    @Override
    public Optional<PmCouponUsageDto.Item> selectById(String couponUsageId) {
        PmCouponUsageDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmCouponUsage.couponUsageId.eq(couponUsageId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 쿠폰 사용 이력 목록조회 */
    @Override
    public List<PmCouponUsageDto.Item> selectList(PmCouponUsageDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(pmCouponUsage.couponUsageId, search.getCouponUsageId()));
        wheres.add(QdslUtil.strEq(pmCouponUsage.orderId, search.getOrderId()));
        wheres.add(QdslUtil.strEq(pmCouponUsage.orderItemId, search.getOrderItemId()));
        wheres.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCouponUsage.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCouponUsage.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PmCouponUsageDto.Item> query = baseSelColumnQuery()
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

    /* 쿠폰 사용 이력 페이지조회 */
    @Override
    public BasePage<PmCouponUsageDto.Item> selectPageData(PmCouponUsageDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(pmCouponUsage.couponUsageId, search.getCouponUsageId()));
        wheres.add(QdslUtil.strEq(pmCouponUsage.orderId, search.getOrderId()));
        wheres.add(QdslUtil.strEq(pmCouponUsage.orderItemId, search.getOrderItemId()));
        wheres.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCouponUsage.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCouponUsage.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);

        JPAQuery<PmCouponUsageDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PmCouponUsageDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres2)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmCouponUsage.count())
                .where(wheres2)
                .fetchOne();

        BasePage<PmCouponUsageDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("couponCode", pmCouponUsage.couponCode),
            QdslUtil.FieldDef.like("couponId", pmCouponUsage.couponId),
            QdslUtil.FieldDef.like("couponNm", pmCouponUsage.couponNm),
            QdslUtil.FieldDef.like("discountTypeCd", pmCouponUsage.discountTypeCd),
            QdslUtil.FieldDef.like("memberId", pmCouponUsage.memberId),
            QdslUtil.FieldDef.like("orderId", pmCouponUsage.orderId),
            QdslUtil.FieldDef.like("orderItemId", pmCouponUsage.orderItemId),
            QdslUtil.FieldDef.like("prodId", pmCouponUsage.prodId),
            QdslUtil.FieldDef.like("couponUsageId", pmCouponUsage.couponUsageId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("couponUsageId", pmCouponUsage.couponUsageId,
                   "couponNm", pmCouponUsage.couponNm,
                   "regDate", pmCouponUsage.regDate),
        new OrderSpecifier<>(Order.DESC, pmCouponUsage.regDate),
        new OrderSpecifier<>(Order.ASC, pmCouponUsage.couponUsageId));
    }

    /* 쿠폰 사용 이력 수정 */
    @Override
    public int updateSelective(PmCouponUsage entity) {
        if (entity.getCouponUsageId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmCouponUsage);
        boolean hasAny = false;

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
        update.set(pmCouponUsage.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmCouponUsage.couponUsageId.eq(entity.getCouponUsageId())).execute();
        return (int) affected;
    }
}
