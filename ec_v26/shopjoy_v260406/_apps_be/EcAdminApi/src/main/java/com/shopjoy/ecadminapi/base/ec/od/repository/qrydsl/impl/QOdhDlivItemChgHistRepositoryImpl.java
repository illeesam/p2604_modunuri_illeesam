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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhDlivItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhDlivItemChgHistRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdhDlivItemChgHist(배송 품목 변경 이력) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhDlivItemChgHistRepositoryImpl implements QOdhDlivItemChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhDlivItemChgHistRepositoryImpl";
    private static final QOdhDlivItemChgHist odhDlivItemChgHist = QOdhDlivItemChgHist.odhDlivItemChgHist;

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * CHG_TYPE (od_dliv_item 변경유형, sy_code 미등록 — Entity 주석 기준 예시)
     *   QTY:수량변경, STATUS:상태변경, CARRIER:택배사변경, TRACK_NO:송장번호변경, RECV_INFO:수령정보변경
     */
    private JPAQuery<OdhDlivItemChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhDlivItemChgHistDto.Item.class,
                        odhDlivItemChgHist.dlivItemChgHistId, // 이력ID (YYMMDDhhmmss+rand4)
                        odhDlivItemChgHist.dlivId,            // 배송ID (od_dliv.)
                        odhDlivItemChgHist.dlivItemId,        // 배송품목ID (od_dliv_item.)
                        odhDlivItemChgHist.chgTypeCd,         // 변경유형코드 — CHG_TYPE {QTY:수량변경, STATUS:상태변경, CARRIER:택배사변경, TRACK_NO:송장번호변경, RECV_INFO:수령정보변경}
                        odhDlivItemChgHist.chgField,          // 변경 필드명
                        odhDlivItemChgHist.beforeVal,         // 변경전값
                        odhDlivItemChgHist.afterVal,          // 변경후값
                        odhDlivItemChgHist.chgReason,         // 변경사유
                        odhDlivItemChgHist.chgUserId,         // 처리자 (sy_user.user_id)
                        odhDlivItemChgHist.chgDate,           // 처리일시
                        odhDlivItemChgHist.regBy, odhDlivItemChgHist.regDate, odhDlivItemChgHist.updBy, odhDlivItemChgHist.updDate))
                .from(odhDlivItemChgHist);
    }

    /* 배송 아이템 변경 이력 키조회 */
    @Override
    public Optional<OdhDlivItemChgHistDto.Item> selectById(String id) {
        OdhDlivItemChgHistDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhDlivItemChgHist.dlivItemChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 배송 아이템 변경 이력 목록조회 */
    @Override
    public List<OdhDlivItemChgHistDto.Item> selectList(OdhDlivItemChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odhDlivItemChgHist.dlivItemChgHistId, search.getDlivItemChgHistId()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<OdhDlivItemChgHistDto.Item> query = baseSelColumnQuery()
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
        List<OdhDlivItemChgHistDto.Item> list = query.fetch();
        return list;
    }

    /* 배송 아이템 변경 이력 페이지조회 */
    @Override
    public BasePage<OdhDlivItemChgHistDto.Item> selectPageData(OdhDlivItemChgHistDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odhDlivItemChgHist.dlivItemChgHistId, search.getDlivItemChgHistId()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<OdhDlivItemChgHistDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<OdhDlivItemChgHistDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhDlivItemChgHist.count())
                .where(wheres)
                .fetchOne();

        BasePage<OdhDlivItemChgHistDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("afterVal", odhDlivItemChgHist.afterVal),
            QdslUtil.FieldDef.like("beforeVal", odhDlivItemChgHist.beforeVal),
            QdslUtil.FieldDef.like("chgField", odhDlivItemChgHist.chgField),
            QdslUtil.FieldDef.like("chgReason", odhDlivItemChgHist.chgReason),
            QdslUtil.FieldDef.like("chgTypeCd", odhDlivItemChgHist.chgTypeCd),
            QdslUtil.FieldDef.like("chgUserId", odhDlivItemChgHist.chgUserId),
            QdslUtil.FieldDef.like("dlivId", odhDlivItemChgHist.dlivId),
            QdslUtil.FieldDef.like("dlivItemChgHistId", odhDlivItemChgHist.dlivItemChgHistId),
            QdslUtil.FieldDef.like("dlivItemId", odhDlivItemChgHist.dlivItemId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("dlivItemChgHistId", odhDlivItemChgHist.dlivItemChgHistId,
                   "regDate", odhDlivItemChgHist.regDate),
        new OrderSpecifier<>(Order.DESC, odhDlivItemChgHist.regDate),
        new OrderSpecifier<>(Order.ASC, odhDlivItemChgHist.dlivItemChgHistId));
    }

    /* 배송 아이템 변경 이력 수정 */
    @Override
    public int updateSelective(OdhDlivItemChgHist entity) {
        if (entity.getDlivItemChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhDlivItemChgHist);
        boolean hasAny = false;

        if (entity.getDlivId()     != null) { update.set(odhDlivItemChgHist.dlivId,     entity.getDlivId());     hasAny = true; }
        if (entity.getDlivItemId() != null) { update.set(odhDlivItemChgHist.dlivItemId, entity.getDlivItemId()); hasAny = true; }
        if (entity.getChgTypeCd()  != null) { update.set(odhDlivItemChgHist.chgTypeCd,  entity.getChgTypeCd());  hasAny = true; }
        if (entity.getChgField()   != null) { update.set(odhDlivItemChgHist.chgField,   entity.getChgField());   hasAny = true; }
        if (entity.getBeforeVal()  != null) { update.set(odhDlivItemChgHist.beforeVal,  entity.getBeforeVal());  hasAny = true; }
        if (entity.getAfterVal()   != null) { update.set(odhDlivItemChgHist.afterVal,   entity.getAfterVal());   hasAny = true; }
        if (entity.getChgReason()  != null) { update.set(odhDlivItemChgHist.chgReason,  entity.getChgReason());  hasAny = true; }
        if (entity.getChgUserId()  != null) { update.set(odhDlivItemChgHist.chgUserId,  entity.getChgUserId());  hasAny = true; }
        if (entity.getChgDate()    != null) { update.set(odhDlivItemChgHist.chgDate,    entity.getChgDate());    hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(odhDlivItemChgHist.updBy,      entity.getUpdBy());      hasAny = true; }
        update.set(odhDlivItemChgHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhDlivItemChgHist.dlivItemChgHistId.eq(entity.getDlivItemChgHistId())).execute();
        return (int) affected;
    }
}
