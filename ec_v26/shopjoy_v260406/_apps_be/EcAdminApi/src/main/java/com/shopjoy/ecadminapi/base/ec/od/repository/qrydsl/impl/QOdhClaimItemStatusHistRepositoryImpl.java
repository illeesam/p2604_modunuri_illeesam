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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhClaimItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhClaimItemStatusHistRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdhClaimItemStatusHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhClaimItemStatusHistRepositoryImpl implements QOdhClaimItemStatusHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhClaimItemStatusHistRepositoryImpl";
    private static final QOdhClaimItemStatusHist odhClaimItemStatusHist = QOdhClaimItemStatusHist.odhClaimItemStatusHist;

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * CLAIM_ITEM_STATUS  {REQUESTED:신청, APPROVED:승인, IN_PICKUP:수거중, PROCESSING:처리중, IN_TRANSIT:교환출고중, COMPLT:완료, REJECTED:거부, CANCELLED:취소}
     */
    private JPAQuery<OdhClaimItemStatusHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhClaimItemStatusHistDto.Item.class,
                        odhClaimItemStatusHist.claimItemStatusHistId,   // 클레임상품상태이력ID (YYMMDDhhmmss+rand4)
                        odhClaimItemStatusHist.claimItemId,             // 클레임상품ID (od_claim_item.claim_item_id)
                        odhClaimItemStatusHist.claimId,                 // 클레임ID (od_claim.claim_id)
                        odhClaimItemStatusHist.orderItemId,             // 주문상품ID (od_order_item.order_item_id)
                        odhClaimItemStatusHist.claimItemStatusCdBefore, // 변경 전 클레임상품상태 — CLAIM_ITEM_STATUS {REQUESTED:신청, APPROVED:승인, IN_PICKUP:수거중, PROCESSING:처리중, IN_TRANSIT:교환출고중, COMPLT:완료, REJECTED:거부, CANCELLED:취소}
                        odhClaimItemStatusHist.claimItemStatusCd,       // 변경 후 클레임상품상태 — CLAIM_ITEM_STATUS (동일 코드그룹)
                        odhClaimItemStatusHist.statusReason,            // 상태 변경 사유
                        odhClaimItemStatusHist.chgUserId,               // 변경 담당자 (sy_user.user_id, mb_member.member_id)
                        odhClaimItemStatusHist.chgDate,                 // 변경 일시
                        odhClaimItemStatusHist.memo,                    // 메모
                        odhClaimItemStatusHist.regBy, odhClaimItemStatusHist.regDate, odhClaimItemStatusHist.updBy, odhClaimItemStatusHist.updDate))
                .from(odhClaimItemStatusHist);
    }

    /* 클레임 아이템 상태 이력 키조회 */
    @Override
    public Optional<OdhClaimItemStatusHistDto.Item> selectById(String id) {
        OdhClaimItemStatusHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhClaimItemStatusHist.claimItemStatusHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 클레임 아이템 상태 이력 목록조회 */
    @Override
    public List<OdhClaimItemStatusHistDto.Item> selectList(OdhClaimItemStatusHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(odhClaimItemStatusHist.claimItemStatusHistId, search.getClaimItemStatusHistId()));
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<OdhClaimItemStatusHistDto.Item> query = baseSelColumnQuery()
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

    /* 클레임 아이템 상태 이력 페이지조회 */
    @Override
    public BasePage<OdhClaimItemStatusHistDto.Item> selectPageData(OdhClaimItemStatusHistDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(odhClaimItemStatusHist.claimItemStatusHistId, search.getClaimItemStatusHistId()));
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<OdhClaimItemStatusHistDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<OdhClaimItemStatusHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres2)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhClaimItemStatusHist.count())
                .where(wheres2)
                .fetchOne();

        BasePage<OdhClaimItemStatusHistDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("chgUserId", odhClaimItemStatusHist.chgUserId),
            QdslUtil.FieldDef.like("claimId", odhClaimItemStatusHist.claimId),
            QdslUtil.FieldDef.like("claimItemId", odhClaimItemStatusHist.claimItemId),
            QdslUtil.FieldDef.like("claimItemStatusCd", odhClaimItemStatusHist.claimItemStatusCd),
            QdslUtil.FieldDef.like("claimItemStatusCdBefore", odhClaimItemStatusHist.claimItemStatusCdBefore),
            QdslUtil.FieldDef.like("claimItemStatusHistId", odhClaimItemStatusHist.claimItemStatusHistId),
            QdslUtil.FieldDef.like("memo", odhClaimItemStatusHist.memo),
            QdslUtil.FieldDef.like("orderItemId", odhClaimItemStatusHist.orderItemId),
            QdslUtil.FieldDef.like("statusReason", odhClaimItemStatusHist.statusReason)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("claimItemStatusHistId", odhClaimItemStatusHist.claimItemStatusHistId,
                   "regDate", odhClaimItemStatusHist.regDate),
        new OrderSpecifier<>(Order.DESC, odhClaimItemStatusHist.regDate),
        new OrderSpecifier<>(Order.ASC, odhClaimItemStatusHist.claimItemStatusHistId));
    }

    /* 클레임 아이템 상태 이력 수정 */
    @Override
    public int updateSelective(OdhClaimItemStatusHist entity) {
        if (entity.getClaimItemStatusHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhClaimItemStatusHist);
        boolean hasAny = false;

        if (entity.getClaimItemId()             != null) { update.set(odhClaimItemStatusHist.claimItemId,             entity.getClaimItemId());             hasAny = true; }
        if (entity.getClaimId()                 != null) { update.set(odhClaimItemStatusHist.claimId,                 entity.getClaimId());                 hasAny = true; }
        if (entity.getOrderItemId()             != null) { update.set(odhClaimItemStatusHist.orderItemId,             entity.getOrderItemId());             hasAny = true; }
        if (entity.getClaimItemStatusCdBefore() != null) { update.set(odhClaimItemStatusHist.claimItemStatusCdBefore, entity.getClaimItemStatusCdBefore()); hasAny = true; }
        if (entity.getClaimItemStatusCd()       != null) { update.set(odhClaimItemStatusHist.claimItemStatusCd,       entity.getClaimItemStatusCd());       hasAny = true; }
        if (entity.getStatusReason()            != null) { update.set(odhClaimItemStatusHist.statusReason,            entity.getStatusReason());            hasAny = true; }
        if (entity.getChgUserId()               != null) { update.set(odhClaimItemStatusHist.chgUserId,               entity.getChgUserId());               hasAny = true; }
        if (entity.getChgDate()                 != null) { update.set(odhClaimItemStatusHist.chgDate,                 entity.getChgDate());                 hasAny = true; }
        if (entity.getMemo()                    != null) { update.set(odhClaimItemStatusHist.memo,                    entity.getMemo());                    hasAny = true; }
        if (entity.getUpdBy()                   != null) { update.set(odhClaimItemStatusHist.updBy,                   entity.getUpdBy());                   hasAny = true; }
        update.set(odhClaimItemStatusHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhClaimItemStatusHist.claimItemStatusHistId.eq(entity.getClaimItemStatusHistId())).execute();
        return (int) affected;
    }
}
