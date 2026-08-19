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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhClaimChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhClaimChgHistRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdhClaimChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhClaimChgHistRepositoryImpl implements QOdhClaimChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhClaimChgHistRepositoryImpl";
    private static final QOdhClaimChgHist odhClaimChgHist = QOdhClaimChgHist.odhClaimChgHist;

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * CHG_TYPE (od_claim 변경유형, sy_code 미등록 — Entity 주석 기준 예시)
     *   CLAIM_TYPE:클레임유형변경, REASON:사유변경, AMOUNT:금액변경, APPROVAL:결재변경, MEMO:메모변경, REFUND:환불변경
     */
    private JPAQuery<OdhClaimChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhClaimChgHistDto.Item.class,
                        odhClaimChgHist.claimChgHistId, // 이력ID (YYMMDDhhmmss+rand4)
                        odhClaimChgHist.claimId,        // 클레임ID (od_claim.)
                        odhClaimChgHist.chgTypeCd,      // 변경유형코드 — CHG_TYPE {CLAIM_TYPE:클레임유형변경, REASON:사유변경, AMOUNT:금액변경, APPROVAL:결재변경, MEMO:메모변경, REFUND:환불변경}
                        odhClaimChgHist.chgField,       // 변경 필드명
                        odhClaimChgHist.beforeVal,      // 변경전값
                        odhClaimChgHist.afterVal,       // 변경후값
                        odhClaimChgHist.chgReason,      // 변경사유
                        odhClaimChgHist.chgUserId,      // 처리자 (sy_user.user_id)
                        odhClaimChgHist.chgDate,        // 처리일시
                        odhClaimChgHist.regBy, odhClaimChgHist.regDate, odhClaimChgHist.updBy, odhClaimChgHist.updDate))
                .from(odhClaimChgHist);
    }

    /* 클레임 변경 이력 키조회 */
    @Override
    public Optional<OdhClaimChgHistDto.Item> selectById(String id) {
        OdhClaimChgHistDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhClaimChgHist.claimChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 클레임 변경 이력 목록조회 */
    @Override
    public List<OdhClaimChgHistDto.Item> selectList(OdhClaimChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odhClaimChgHist.claimChgHistId, search.getClaimChgHistId()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<OdhClaimChgHistDto.Item> query = baseSelColumnQuery()
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
        List<OdhClaimChgHistDto.Item> list = query.fetch();
        return list;
    }

    /* 클레임 변경 이력 페이지조회 */
    @Override
    public BasePage<OdhClaimChgHistDto.Item> selectPageData(OdhClaimChgHistDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odhClaimChgHist.claimChgHistId, search.getClaimChgHistId()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<OdhClaimChgHistDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<OdhClaimChgHistDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhClaimChgHist.count())
                .where(wheres)
                .fetchOne();

        BasePage<OdhClaimChgHistDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("afterVal", odhClaimChgHist.afterVal),
            QdslUtil.FieldDef.like("beforeVal", odhClaimChgHist.beforeVal),
            QdslUtil.FieldDef.like("chgField", odhClaimChgHist.chgField),
            QdslUtil.FieldDef.like("chgReason", odhClaimChgHist.chgReason),
            QdslUtil.FieldDef.like("chgTypeCd", odhClaimChgHist.chgTypeCd),
            QdslUtil.FieldDef.like("chgUserId", odhClaimChgHist.chgUserId),
            QdslUtil.FieldDef.like("claimChgHistId", odhClaimChgHist.claimChgHistId),
            QdslUtil.FieldDef.like("claimId", odhClaimChgHist.claimId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("claimChgHistId", odhClaimChgHist.claimChgHistId,
                   "regDate", odhClaimChgHist.regDate),
        new OrderSpecifier<>(Order.DESC, odhClaimChgHist.regDate),
        new OrderSpecifier<>(Order.ASC, odhClaimChgHist.claimChgHistId));
    }

    /* 클레임 변경 이력 수정 */
    @Override
    public int updateSelective(OdhClaimChgHist entity) {
        if (entity.getClaimChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhClaimChgHist);
        boolean hasAny = false;

        if (entity.getClaimId()    != null) { update.set(odhClaimChgHist.claimId,    entity.getClaimId());    hasAny = true; }
        if (entity.getChgTypeCd()  != null) { update.set(odhClaimChgHist.chgTypeCd,  entity.getChgTypeCd());  hasAny = true; }
        if (entity.getChgField()   != null) { update.set(odhClaimChgHist.chgField,   entity.getChgField());   hasAny = true; }
        if (entity.getBeforeVal()  != null) { update.set(odhClaimChgHist.beforeVal,  entity.getBeforeVal());  hasAny = true; }
        if (entity.getAfterVal()   != null) { update.set(odhClaimChgHist.afterVal,   entity.getAfterVal());   hasAny = true; }
        if (entity.getChgReason()  != null) { update.set(odhClaimChgHist.chgReason,  entity.getChgReason());  hasAny = true; }
        if (entity.getChgUserId()  != null) { update.set(odhClaimChgHist.chgUserId,  entity.getChgUserId());  hasAny = true; }
        if (entity.getChgDate()    != null) { update.set(odhClaimChgHist.chgDate,    entity.getChgDate());    hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(odhClaimChgHist.updBy,      entity.getUpdBy());      hasAny = true; }
        update.set(odhClaimChgHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhClaimChgHist.claimChgHistId.eq(entity.getClaimChgHistId())).execute();
        return (int) affected;
    }
}
