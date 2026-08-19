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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhClaimItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhClaimItemChgHistRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdhClaimItemChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhClaimItemChgHistRepositoryImpl implements QOdhClaimItemChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhClaimItemChgHistRepositoryImpl";
    private static final QOdhClaimItemChgHist odhClaimItemChgHist = QOdhClaimItemChgHist.odhClaimItemChgHist;

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * CHG_TYPE (od_claim_item 변경유형, sy_code 미등록 — Entity 주석 기준 예시)
     *   QTY:수량변경, AMOUNT:금액변경, REASON:사유변경, STATUS:상태변경, REFUND_AMT:환불금액변경
     */
    private JPAQuery<OdhClaimItemChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhClaimItemChgHistDto.Item.class,
                        odhClaimItemChgHist.claimItemChgHistId, // 이력ID (YYMMDDhhmmss+rand4)
                        odhClaimItemChgHist.claimId,            // 클레임ID (od_claim.)
                        odhClaimItemChgHist.claimItemId,        // 클레임품목ID (od_claim_item.)
                        odhClaimItemChgHist.chgTypeCd,          // 변경유형코드 — CHG_TYPE {QTY:수량변경, AMOUNT:금액변경, REASON:사유변경, STATUS:상태변경, REFUND_AMT:환불금액변경}
                        odhClaimItemChgHist.chgField,           // 변경 필드명
                        odhClaimItemChgHist.beforeVal,          // 변경전값
                        odhClaimItemChgHist.afterVal,           // 변경후값
                        odhClaimItemChgHist.chgReason,          // 변경사유
                        odhClaimItemChgHist.chgUserId,          // 처리자 (sy_user.user_id)
                        odhClaimItemChgHist.chgDate,            // 처리일시
                        odhClaimItemChgHist.regBy, odhClaimItemChgHist.regDate, odhClaimItemChgHist.updBy, odhClaimItemChgHist.updDate))
                .from(odhClaimItemChgHist);
    }

    /* 클레임 아이템 변경 이력 키조회 */
    @Override
    public Optional<OdhClaimItemChgHistDto.Item> selectById(String id) {
        OdhClaimItemChgHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhClaimItemChgHist.claimItemChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 클레임 아이템 변경 이력 목록조회 */
    @Override
    public List<OdhClaimItemChgHistDto.Item> selectList(OdhClaimItemChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odhClaimItemChgHist.claimItemChgHistId, search.getClaimItemChgHistId()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<OdhClaimItemChgHistDto.Item> query = baseSelColumnQuery()
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
        return query.fetch();
    }

    /* 클레임 아이템 변경 이력 페이지조회 */
    @Override
    public BasePage<OdhClaimItemChgHistDto.Item> selectPageData(OdhClaimItemChgHistDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odhClaimItemChgHist.claimItemChgHistId, search.getClaimItemChgHistId()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<OdhClaimItemChgHistDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<OdhClaimItemChgHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhClaimItemChgHist.count())
                .where(wheres)
                .fetchOne();

        BasePage<OdhClaimItemChgHistDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("afterVal", odhClaimItemChgHist.afterVal),
            QdslUtil.FieldDef.like("beforeVal", odhClaimItemChgHist.beforeVal),
            QdslUtil.FieldDef.like("chgField", odhClaimItemChgHist.chgField),
            QdslUtil.FieldDef.like("chgReason", odhClaimItemChgHist.chgReason),
            QdslUtil.FieldDef.like("chgTypeCd", odhClaimItemChgHist.chgTypeCd),
            QdslUtil.FieldDef.like("chgUserId", odhClaimItemChgHist.chgUserId),
            QdslUtil.FieldDef.like("claimId", odhClaimItemChgHist.claimId),
            QdslUtil.FieldDef.like("claimItemChgHistId", odhClaimItemChgHist.claimItemChgHistId),
            QdslUtil.FieldDef.like("claimItemId", odhClaimItemChgHist.claimItemId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("claimItemChgHistId", odhClaimItemChgHist.claimItemChgHistId,
                   "regDate", odhClaimItemChgHist.regDate),
        new OrderSpecifier<>(Order.DESC, odhClaimItemChgHist.regDate),
        new OrderSpecifier<>(Order.ASC, odhClaimItemChgHist.claimItemChgHistId));
    }

    /* 클레임 아이템 변경 이력 수정 */
    @Override
    public int updateSelective(OdhClaimItemChgHist entity) {
        if (entity.getClaimItemChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhClaimItemChgHist);
        boolean hasAny = false;

        if (entity.getClaimId()     != null) { update.set(odhClaimItemChgHist.claimId,     entity.getClaimId());     hasAny = true; }
        if (entity.getClaimItemId() != null) { update.set(odhClaimItemChgHist.claimItemId, entity.getClaimItemId()); hasAny = true; }
        if (entity.getChgTypeCd()   != null) { update.set(odhClaimItemChgHist.chgTypeCd,   entity.getChgTypeCd());   hasAny = true; }
        if (entity.getChgField()    != null) { update.set(odhClaimItemChgHist.chgField,    entity.getChgField());    hasAny = true; }
        if (entity.getBeforeVal()   != null) { update.set(odhClaimItemChgHist.beforeVal,   entity.getBeforeVal());   hasAny = true; }
        if (entity.getAfterVal()    != null) { update.set(odhClaimItemChgHist.afterVal,    entity.getAfterVal());    hasAny = true; }
        if (entity.getChgReason()   != null) { update.set(odhClaimItemChgHist.chgReason,   entity.getChgReason());   hasAny = true; }
        if (entity.getChgUserId()   != null) { update.set(odhClaimItemChgHist.chgUserId,   entity.getChgUserId());   hasAny = true; }
        if (entity.getChgDate()     != null) { update.set(odhClaimItemChgHist.chgDate,     entity.getChgDate());     hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(odhClaimItemChgHist.updBy,       entity.getUpdBy());       hasAny = true; }
        update.set(odhClaimItemChgHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhClaimItemChgHist.claimItemChgHistId.eq(entity.getClaimItemChgHistId())).execute();
        return (int) affected;
    }
}
