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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhOrderChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhOrderChgHistRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdhOrderChgHist(주문 변경 이력) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhOrderChgHistRepositoryImpl implements QOdhOrderChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhOrderChgHistRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QOdhOrderChgHist odhOrderChgHist = QOdhOrderChgHist.odhOrderChgHist;

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * CHG_TYPE (od_order 변경유형, sy_code 미등록 — Entity 주석 기준 예시)
     *   PAY_METHOD:결제수단변경, RECV_INFO:수령정보변경, AMOUNT:금액변경, MEMO:메모변경, COUPON:쿠폰변경, CACHE:적립금변경, APPROVAL:결재변경
     */
    private JPAQuery<OdhOrderChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhOrderChgHistDto.Item.class,
                        odhOrderChgHist.orderChgHistId, // 이력ID (YYMMDDhhmmss+rand4)
                        odhOrderChgHist.orderId,        // 주문ID (od_order.)
                        odhOrderChgHist.chgTypeCd,      // 변경유형코드 — CHG_TYPE {PAY_METHOD:결제수단변경, RECV_INFO:수령정보변경, AMOUNT:금액변경, MEMO:메모변경, COUPON:쿠폰변경, CACHE:적립금변경, APPROVAL:결재변경}
                        odhOrderChgHist.chgField,       // 변경 필드명
                        odhOrderChgHist.beforeVal,      // 변경전값
                        odhOrderChgHist.afterVal,       // 변경후값
                        odhOrderChgHist.chgReason,      // 변경사유
                        odhOrderChgHist.chgUserId,      // 처리자 (sy_user.user_id)
                        odhOrderChgHist.chgDate,        // 처리일시
                        odhOrderChgHist.regBy,      // 등록자
                        odhOrderChgHist.regDate,    // 등록일시
                        odhOrderChgHist.updBy,      // 수정자
                        odhOrderChgHist.updDate,    // 수정일시
                        odhOrderChgHist.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(odhOrderChgHist)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(odhOrderChgHist.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(odhOrderChgHist.regBy)) // 등록자
                ;
    }

    /* 주문 변경 이력 키조회 */
    @Override
    public Optional<OdhOrderChgHistDto.Item> selectById(String id) {
        OdhOrderChgHistDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhOrderChgHist.orderChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 주문 변경 이력 목록조회 */
    @Override
    public List<OdhOrderChgHistDto.Item> selectList(OdhOrderChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odhOrderChgHist.orderChgHistId, search.getOrderChgHistId()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<OdhOrderChgHistDto.Item> query = baseSelColumnQuery()
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
        List<OdhOrderChgHistDto.Item> list = query.fetch();
        return list;
    }

    /* 주문 변경 이력 페이지조회 */
    @Override
    public BasePage<OdhOrderChgHistDto.Item> selectPageData(OdhOrderChgHistDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odhOrderChgHist.orderChgHistId, search.getOrderChgHistId()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<OdhOrderChgHistDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<OdhOrderChgHistDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhOrderChgHist.count())
                .where(wheres)
                .fetchOne();

        BasePage<OdhOrderChgHistDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("afterVal", odhOrderChgHist.afterVal),
            QdslUtil.FieldDef.like("beforeVal", odhOrderChgHist.beforeVal),
            QdslUtil.FieldDef.like("chgField", odhOrderChgHist.chgField),
            QdslUtil.FieldDef.like("chgReason", odhOrderChgHist.chgReason),
            QdslUtil.FieldDef.like("chgTypeCd", odhOrderChgHist.chgTypeCd),
            QdslUtil.FieldDef.like("chgUserId", odhOrderChgHist.chgUserId),
            QdslUtil.FieldDef.like("orderChgHistId", odhOrderChgHist.orderChgHistId),
            QdslUtil.FieldDef.like("orderId", odhOrderChgHist.orderId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("orderChgHistId", odhOrderChgHist.orderChgHistId,
                   "regDate", odhOrderChgHist.regDate),
        new OrderSpecifier<>(Order.DESC, odhOrderChgHist.regDate),
        new OrderSpecifier<>(Order.ASC, odhOrderChgHist.orderChgHistId));
    }

    /* 주문 변경 이력 수정 */
    @Override
    public int updateSelective(OdhOrderChgHist entity) {
        if (entity.getOrderChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhOrderChgHist);
        boolean hasAny = false;

        if (entity.getOrderId()    != null) { update.set(odhOrderChgHist.orderId,    entity.getOrderId());    hasAny = true; }
        if (entity.getChgTypeCd()  != null) { update.set(odhOrderChgHist.chgTypeCd,  entity.getChgTypeCd());  hasAny = true; }
        if (entity.getChgField()   != null) { update.set(odhOrderChgHist.chgField,   entity.getChgField());   hasAny = true; }
        if (entity.getBeforeVal()  != null) { update.set(odhOrderChgHist.beforeVal,  entity.getBeforeVal());  hasAny = true; }
        if (entity.getAfterVal()   != null) { update.set(odhOrderChgHist.afterVal,   entity.getAfterVal());   hasAny = true; }
        if (entity.getChgReason()  != null) { update.set(odhOrderChgHist.chgReason,  entity.getChgReason());  hasAny = true; }
        if (entity.getChgUserId()  != null) { update.set(odhOrderChgHist.chgUserId,  entity.getChgUserId());  hasAny = true; }
        if (entity.getChgDate()    != null) { update.set(odhOrderChgHist.chgDate,    entity.getChgDate());    hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(odhOrderChgHist.updBy,      entity.getUpdBy());      hasAny = true; }
        update.set(odhOrderChgHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhOrderChgHist.orderChgHistId.eq(entity.getOrderChgHistId())).execute();
        return (int) affected;
    }
}
