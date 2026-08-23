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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhClaimStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhClaimStatusHistRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdhClaimStatusHist(클레임 상태 이력) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhClaimStatusHistRepositoryImpl implements QOdhClaimStatusHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhClaimStatusHistRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QOdhClaimStatusHist odhClaimStatusHist = QOdhClaimStatusHist.odhClaimStatusHist;

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * CLAIM_STATUS  {REQUESTED:신청, APPROVED:승인, IN_PICKUP:수거중, PROCESSING:처리중, REFUND_WAIT:환불대기, COMPLT:완료, REJECTED:거부, CANCELLED:철회}
     */
    private JPAQuery<OdhClaimStatusHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhClaimStatusHistDto.Item.class,
                        odhClaimStatusHist.claimStatusHistId,   // 클레임상태이력ID (YYMMDDhhmmss+rand4)
                        odhClaimStatusHist.claimId,              // 클레임ID (od_claim.claim_id)
                        odhClaimStatusHist.orderId,              // 주문ID (od_order.order_id)
                        odhClaimStatusHist.claimStatusCdBefore,  // 변경 전 클레임상태 — CLAIM_STATUS {REQUESTED:신청, APPROVED:승인, IN_PICKUP:수거중, PROCESSING:처리중, REFUND_WAIT:환불대기, COMPLT:완료, REJECTED:거부, CANCELLED:철회}
                        odhClaimStatusHist.claimStatusCd,        // 변경 후 클레임상태 — CLAIM_STATUS (동일 코드그룹)
                        odhClaimStatusHist.statusReason,         // 상태 변경 사유
                        odhClaimStatusHist.chgUserId,            // 변경 담당자 (sy_user.user_id, mb_member.member_id)
                        odhClaimStatusHist.chgDate,              // 변경 일시
                        odhClaimStatusHist.memo,                 // 메모
                        odhClaimStatusHist.regBy,      // 등록자
                        odhClaimStatusHist.regDate,    // 등록일시
                        odhClaimStatusHist.updBy,      // 수정자
                        odhClaimStatusHist.updDate,    // 수정일시
                        odhClaimStatusHist.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(odhClaimStatusHist)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(odhClaimStatusHist.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(odhClaimStatusHist.regBy)) // 등록자
                ;
    }

    /* 클레임 상태 이력 키조회 */
    @Override
    public Optional<OdhClaimStatusHistDto.Item> selectById(String id) {
        OdhClaimStatusHistDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhClaimStatusHist.claimStatusHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 클레임 상태 이력 목록조회 */
    @Override
    public List<OdhClaimStatusHistDto.Item> selectList(OdhClaimStatusHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odhClaimStatusHist.claimStatusHistId, search.getClaimStatusHistId())); // 클레임상태이력ID (YYMMDDhhmmss+rand4)
        whereList.add(QdslUtil.strEq(odhClaimStatusHist.claimId, search.getClaimId())); // 클레임ID (od_claim.claim_id)
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<OdhClaimStatusHistDto.Item> query = baseSelColumnQuery()
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
        List<OdhClaimStatusHistDto.Item> list = query.fetch();
        return list;
    }

    /* 클레임 상태 이력 페이지조회 */
    @Override
    public BasePage<OdhClaimStatusHistDto.Item> selectPageData(OdhClaimStatusHistDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odhClaimStatusHist.claimStatusHistId, search.getClaimStatusHistId())); // 클레임상태이력ID (YYMMDDhhmmss+rand4)
        whereList.add(QdslUtil.strEq(odhClaimStatusHist.claimId, search.getClaimId())); // 클레임ID (od_claim.claim_id)
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<OdhClaimStatusHistDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<OdhClaimStatusHistDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhClaimStatusHist.count())
                .where(wheres)
                .fetchOne();

        BasePage<OdhClaimStatusHistDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "chgUserId,claimId,claimStatusCd,claimStatusCdBefore,claimStatusHistId" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("chgUserId", odhClaimStatusHist.chgUserId), // 변경 담당자 (sy_user.user_id, mb_member.member_id)
            QdslUtil.FieldDef.like("claimId", odhClaimStatusHist.claimId), // 클레임ID (od_claim.claim_id)
            QdslUtil.FieldDef.like("claimStatusCd", odhClaimStatusHist.claimStatusCd), // 변경 후 클레임상태 (코드: CLAIM_STATUS)
            QdslUtil.FieldDef.like("claimStatusCdBefore", odhClaimStatusHist.claimStatusCdBefore), // 변경 전 클레임상태 (코드: CLAIM_STATUS)
            QdslUtil.FieldDef.like("claimStatusHistId", odhClaimStatusHist.claimStatusHistId), // 클레임상태이력ID (YYMMDDhhmmss+rand4)
            QdslUtil.FieldDef.like("memo", odhClaimStatusHist.memo), // 메모
            QdslUtil.FieldDef.like("orderId", odhClaimStatusHist.orderId), // 주문ID (od_order.order_id)
            QdslUtil.FieldDef.like("statusReason", odhClaimStatusHist.statusReason) // 상태 변경 사유
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("claimStatusHistId", odhClaimStatusHist.claimStatusHistId,
                   "regDate", odhClaimStatusHist.regDate),
        new OrderSpecifier<>(Order.DESC, odhClaimStatusHist.regDate),
        new OrderSpecifier<>(Order.ASC, odhClaimStatusHist.claimStatusHistId));
    }

    /* 클레임 상태 이력 수정 */
    @Override
    public int updateSelective(OdhClaimStatusHist entity) {
        if (entity.getClaimStatusHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhClaimStatusHist);
        boolean hasAny = false;

        if (entity.getClaimId()             != null) { update.set(odhClaimStatusHist.claimId,             entity.getClaimId());             hasAny = true; }
        if (entity.getOrderId()             != null) { update.set(odhClaimStatusHist.orderId,             entity.getOrderId());             hasAny = true; }
        if (entity.getClaimStatusCdBefore() != null) { update.set(odhClaimStatusHist.claimStatusCdBefore, entity.getClaimStatusCdBefore()); hasAny = true; }
        if (entity.getClaimStatusCd()       != null) { update.set(odhClaimStatusHist.claimStatusCd,       entity.getClaimStatusCd());       hasAny = true; }
        if (entity.getStatusReason()        != null) { update.set(odhClaimStatusHist.statusReason,        entity.getStatusReason());        hasAny = true; }
        if (entity.getChgUserId()           != null) { update.set(odhClaimStatusHist.chgUserId,           entity.getChgUserId());           hasAny = true; }
        if (entity.getChgDate()             != null) { update.set(odhClaimStatusHist.chgDate,             entity.getChgDate());             hasAny = true; }
        if (entity.getMemo()                != null) { update.set(odhClaimStatusHist.memo,                entity.getMemo());                hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(odhClaimStatusHist.updBy,               entity.getUpdBy());               hasAny = true; }
        update.set(odhClaimStatusHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhClaimStatusHist.claimStatusHistId.eq(entity.getClaimStatusHistId())).execute();
        return (int) affected;
    }
}
