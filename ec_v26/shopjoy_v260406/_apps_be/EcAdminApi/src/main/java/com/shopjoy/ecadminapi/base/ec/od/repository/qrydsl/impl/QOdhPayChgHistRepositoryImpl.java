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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhPayChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhPayChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhPayChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhPayChgHistRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdhPayChgHist(결제 변경 이력 (모든 결제 변경사항 추적)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhPayChgHistRepositoryImpl implements QOdhPayChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhPayChgHistRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QOdhPayChgHist odhPayChgHist = QOdhPayChgHist.odhPayChgHist;

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * PAY_STATUS  {PENDING:대기, COMPLT:완료, FAILED:실패, CANCELLED:취소, PARTIAL_REFUND:부분환불, REFUNDED:전액환불}
     * PAY_CHG_TYPE  {STATUS:상태변경, METHOD:수단변경, AMOUNT:금액변경}
     */
    private JPAQuery<OdhPayChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhPayChgHistDto.Item.class,
                        odhPayChgHist.payChgHistId,        // 결제변경이력ID (YYMMDDhhmmss+rand4)
                        odhPayChgHist.payId,                 // 결제ID (od_pay.)
                        odhPayChgHist.orderId,               // 주문ID (od_order.)
                        odhPayChgHist.payStatusCdBefore,     // 변경 전 결제상태 — PAY_STATUS {PENDING:대기, COMPLT:완료, FAILED:실패, CANCELLED:취소, PARTIAL_REFUND:부분환불, REFUNDED:전액환불}
                        odhPayChgHist.payStatusCdAfter,      // 변경 후 결제상태 — PAY_STATUS (동일 코드그룹)
                        odhPayChgHist.chgTypeCd,             // 변경유형 — PAY_CHG_TYPE {STATUS:상태변경, METHOD:수단변경, AMOUNT:금액변경}
                        odhPayChgHist.chgReason,             // 변경 사유 (예: PG 승인 완료, 수동 환불 등)
                        odhPayChgHist.pgResponse,            // PG 응답 데이터 (JSON)
                        odhPayChgHist.refundAmt,             // 환불 금액 (환불 시만)
                        odhPayChgHist.refundPgTid,           // 환불 거래ID (환불 시 PG로부터 받은 ID)
                        odhPayChgHist.chgUserId,             // 변경 담당자 (sy_user.user_id, mb_member.member_id)
                        odhPayChgHist.chgDate,               // 변경 일시
                        odhPayChgHist.memo,                  // 메모
                        odhPayChgHist.regBy,      // 등록자
                        odhPayChgHist.regDate,    // 등록일시
                        odhPayChgHist.updBy,      // 수정자
                        odhPayChgHist.updDate,    // 수정일시
                        odhPayChgHist.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(odhPayChgHist)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(odhPayChgHist.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(odhPayChgHist.regBy)) // 등록자
                ;
    }

    /* 결제 변경 이력 키조회 */
    @Override
    public Optional<OdhPayChgHistDto.Item> selectById(String id) {
        OdhPayChgHistDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhPayChgHist.payChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 결제 변경 이력 목록조회 */
    @Override
    public List<OdhPayChgHistDto.Item> selectList(OdhPayChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odhPayChgHist.payChgHistId, search.getPayChgHistId()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<OdhPayChgHistDto.Item> query = baseSelColumnQuery()
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
        List<OdhPayChgHistDto.Item> list = query.fetch();
        return list;
    }

    /* 결제 변경 이력 페이지조회 */
    @Override
    public BasePage<OdhPayChgHistDto.Item> selectPageData(OdhPayChgHistDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odhPayChgHist.payChgHistId, search.getPayChgHistId()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<OdhPayChgHistDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<OdhPayChgHistDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhPayChgHist.count())
                .where(wheres)
                .fetchOne();

        BasePage<OdhPayChgHistDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("chgReason", odhPayChgHist.chgReason),
            QdslUtil.FieldDef.like("chgTypeCd", odhPayChgHist.chgTypeCd),
            QdslUtil.FieldDef.like("chgUserId", odhPayChgHist.chgUserId),
            QdslUtil.FieldDef.like("memo", odhPayChgHist.memo),
            QdslUtil.FieldDef.like("orderId", odhPayChgHist.orderId),
            QdslUtil.FieldDef.like("payChgHistId", odhPayChgHist.payChgHistId),
            QdslUtil.FieldDef.like("payId", odhPayChgHist.payId),
            QdslUtil.FieldDef.like("payStatusCdAfter", odhPayChgHist.payStatusCdAfter),
            QdslUtil.FieldDef.like("payStatusCdBefore", odhPayChgHist.payStatusCdBefore),
            QdslUtil.FieldDef.like("pgResponse", odhPayChgHist.pgResponse),
            QdslUtil.FieldDef.like("refundPgTid", odhPayChgHist.refundPgTid)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("payChgHistId", odhPayChgHist.payChgHistId,
                   "regDate", odhPayChgHist.regDate),
        new OrderSpecifier<>(Order.DESC, odhPayChgHist.regDate),
        new OrderSpecifier<>(Order.ASC, odhPayChgHist.payChgHistId));
    }

    /* 결제 변경 이력 수정 */
    @Override
    public int updateSelective(OdhPayChgHist entity) {
        if (entity.getPayChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhPayChgHist);
        boolean hasAny = false;

        if (entity.getPayId()             != null) { update.set(odhPayChgHist.payId,             entity.getPayId());             hasAny = true; }
        if (entity.getOrderId()           != null) { update.set(odhPayChgHist.orderId,           entity.getOrderId());           hasAny = true; }
        if (entity.getPayStatusCdBefore() != null) { update.set(odhPayChgHist.payStatusCdBefore, entity.getPayStatusCdBefore()); hasAny = true; }
        if (entity.getPayStatusCdAfter()  != null) { update.set(odhPayChgHist.payStatusCdAfter,  entity.getPayStatusCdAfter());  hasAny = true; }
        if (entity.getChgTypeCd()         != null) { update.set(odhPayChgHist.chgTypeCd,         entity.getChgTypeCd());         hasAny = true; }
        if (entity.getChgReason()         != null) { update.set(odhPayChgHist.chgReason,         entity.getChgReason());         hasAny = true; }
        if (entity.getPgResponse()        != null) { update.set(odhPayChgHist.pgResponse,        entity.getPgResponse());        hasAny = true; }
        if (entity.getRefundAmt()         != null) { update.set(odhPayChgHist.refundAmt,         entity.getRefundAmt());         hasAny = true; }
        if (entity.getRefundPgTid()       != null) { update.set(odhPayChgHist.refundPgTid,       entity.getRefundPgTid());       hasAny = true; }
        if (entity.getChgUserId()         != null) { update.set(odhPayChgHist.chgUserId,         entity.getChgUserId());         hasAny = true; }
        if (entity.getChgDate()           != null) { update.set(odhPayChgHist.chgDate,           entity.getChgDate());           hasAny = true; }
        if (entity.getMemo()              != null) { update.set(odhPayChgHist.memo,              entity.getMemo());              hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(odhPayChgHist.updBy,             entity.getUpdBy());             hasAny = true; }
        update.set(odhPayChgHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhPayChgHist.payChgHistId.eq(entity.getPayChgHistId())).execute();
        return (int) affected;
    }
}
