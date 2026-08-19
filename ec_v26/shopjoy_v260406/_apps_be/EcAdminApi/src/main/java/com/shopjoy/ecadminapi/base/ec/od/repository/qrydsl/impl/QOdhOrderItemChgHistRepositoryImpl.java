package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhOrderItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhOrderItemChgHistRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdhOrderItemChgHist(주문 품목 변경 이력) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhOrderItemChgHistRepositoryImpl implements QOdhOrderItemChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhOrderItemChgHistRepositoryImpl";
    private static final QOdhOrderItemChgHist odhOrderItemChgHist = QOdhOrderItemChgHist.odhOrderItemChgHist;

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * CHG_TYPE (od_order_item 변경유형, sy_code 미등록 — Entity 주석 기준 예시)
     *   QTY:수량변경, PRICE:가격변경, OPT:옵션변경, STATUS:상태변경, AMOUNT:금액변경, COUPON:쿠폰변경
     */
    private JPAQuery<OdhOrderItemChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhOrderItemChgHistDto.Item.class,
                        odhOrderItemChgHist.orderItemChgHistId, // 이력ID (YYMMDDhhmmss+rand4)
                        odhOrderItemChgHist.orderId,            // 주문ID (od_order.)
                        odhOrderItemChgHist.orderItemId,        // 주문품목ID (od_order_item.)
                        odhOrderItemChgHist.chgTypeCd,          // 변경유형코드 — CHG_TYPE {QTY:수량변경, PRICE:가격변경, OPT:옵션변경, STATUS:상태변경, AMOUNT:금액변경, COUPON:쿠폰변경}
                        odhOrderItemChgHist.chgField,           // 변경 필드명
                        odhOrderItemChgHist.beforeVal,          // 변경전값
                        odhOrderItemChgHist.afterVal,           // 변경후값
                        odhOrderItemChgHist.chgReason,          // 변경사유
                        odhOrderItemChgHist.chgUserId,          // 처리자 (sy_user.user_id)
                        odhOrderItemChgHist.chgDate,            // 처리일시
                        odhOrderItemChgHist.regBy, odhOrderItemChgHist.regDate, odhOrderItemChgHist.updBy, odhOrderItemChgHist.updDate))
                .from(odhOrderItemChgHist);
    }

    /* 주문 아이템 변경 이력 키조회 */
    @Override
    public Optional<OdhOrderItemChgHistDto.Item> selectById(String id) {
        OdhOrderItemChgHistDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhOrderItemChgHist.orderItemChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 주문 아이템 변경 이력 목록조회 */
    @Override
    public List<OdhOrderItemChgHistDto.Item> selectList(OdhOrderItemChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odhOrderItemChgHist.orderItemChgHistId, search.getOrderItemChgHistId()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<OdhOrderItemChgHistDto.Item> query = baseSelColumnQuery()
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
        List<OdhOrderItemChgHistDto.Item> list = query.fetch();
        return list;
    }

    /* 주문 아이템 변경 이력 페이지조회 */
    @Override
    public BasePage<OdhOrderItemChgHistDto.Item> selectPageData(OdhOrderItemChgHistDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odhOrderItemChgHist.orderItemChgHistId, search.getOrderItemChgHistId()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<OdhOrderItemChgHistDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<OdhOrderItemChgHistDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhOrderItemChgHist.count())
                .where(wheres)
                .fetchOne();

        BasePage<OdhOrderItemChgHistDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("afterVal", odhOrderItemChgHist.afterVal),
            QdslUtil.FieldDef.like("beforeVal", odhOrderItemChgHist.beforeVal),
            QdslUtil.FieldDef.like("chgField", odhOrderItemChgHist.chgField),
            QdslUtil.FieldDef.like("chgReason", odhOrderItemChgHist.chgReason),
            QdslUtil.FieldDef.like("chgTypeCd", odhOrderItemChgHist.chgTypeCd),
            QdslUtil.FieldDef.like("chgUserId", odhOrderItemChgHist.chgUserId),
            QdslUtil.FieldDef.like("orderId", odhOrderItemChgHist.orderId),
            QdslUtil.FieldDef.like("orderItemChgHistId", odhOrderItemChgHist.orderItemChgHistId),
            QdslUtil.FieldDef.like("orderItemId", odhOrderItemChgHist.orderItemId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("orderItemChgHistId", odhOrderItemChgHist.orderItemChgHistId,
                   "regDate", odhOrderItemChgHist.regDate),
        new OrderSpecifier<>(Order.DESC, odhOrderItemChgHist.regDate),
        new OrderSpecifier<>(Order.ASC, odhOrderItemChgHist.orderItemChgHistId));
    }

    /* 주문 아이템 변경 이력 수정 */
    @Override
    public int updateSelective(OdhOrderItemChgHist entity) {
        if (entity.getOrderItemChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhOrderItemChgHist);
        boolean hasAny = false;

        if (entity.getOrderId()     != null) { update.set(odhOrderItemChgHist.orderId,     entity.getOrderId());     hasAny = true; }
        if (entity.getOrderItemId() != null) { update.set(odhOrderItemChgHist.orderItemId, entity.getOrderItemId()); hasAny = true; }
        if (entity.getChgTypeCd()   != null) { update.set(odhOrderItemChgHist.chgTypeCd,   entity.getChgTypeCd());   hasAny = true; }
        if (entity.getChgField()    != null) { update.set(odhOrderItemChgHist.chgField,    entity.getChgField());    hasAny = true; }
        if (entity.getBeforeVal()   != null) { update.set(odhOrderItemChgHist.beforeVal,   entity.getBeforeVal());   hasAny = true; }
        if (entity.getAfterVal()    != null) { update.set(odhOrderItemChgHist.afterVal,    entity.getAfterVal());    hasAny = true; }
        if (entity.getChgReason()   != null) { update.set(odhOrderItemChgHist.chgReason,   entity.getChgReason());   hasAny = true; }
        if (entity.getChgUserId()   != null) { update.set(odhOrderItemChgHist.chgUserId,   entity.getChgUserId());   hasAny = true; }
        if (entity.getChgDate()     != null) { update.set(odhOrderItemChgHist.chgDate,     entity.getChgDate());     hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(odhOrderItemChgHist.updBy,       entity.getUpdBy());       hasAny = true; }
        update.set(odhOrderItemChgHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhOrderItemChgHist.orderItemChgHistId.eq(entity.getOrderItemChgHistId())).execute();
        return (int) affected;
    }
}
