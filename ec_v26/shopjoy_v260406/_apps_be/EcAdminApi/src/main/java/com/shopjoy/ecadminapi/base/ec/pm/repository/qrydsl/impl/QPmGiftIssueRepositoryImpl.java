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
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftIssue;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGift;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGiftIssue;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmGiftIssueRepository;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmGiftIssue QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmGiftIssueRepositoryImpl implements QPmGiftIssueRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmGiftIssueRepositoryImpl";
    private static final QPmGiftIssue pmGiftIssue    = QPmGiftIssue.pmGiftIssue;
    private static final QPmGift      pmGift  = QPmGift.pmGift;
    private static final QMbMember    mbMember  = QMbMember.mbMember;
    private static final QOdOrder     odOrder  = QOdOrder.odOrder;
    private static final QSySite      sySite  = QSySite.sySite;
    private static final QVwSyCode      cdGis = new QVwSyCode("cd_gis");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * GIFT_ISSUE_STATUS  {ISSUED: '발급됨', DELIVERED: '배송완료', CANCELLED: '취소'}
     */
    private JPAQuery<PmGiftIssueDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmGiftIssueDto.Item.class,
                        pmGiftIssue.giftIssueId,               // 사은품발급ID (PK)
                        pmGiftIssue.giftId,                    // 사은품ID (pm_gift.gift_id)
                        pmGiftIssue.memberId,                  // 회원ID
                        pmGiftIssue.orderId,                   // 기준주문ID (od_order.order_id)
                        pmGiftIssue.issueDate,                 // 발급일시
                        pmGiftIssue.giftIssueStatusCd,         // 상태 — GIFT_ISSUE_STATUS {ISSUED: '발급됨', DELIVERED: '배송완료', CANCELLED: '취소'}
                        pmGiftIssue.giftIssueStatusCdBefore,   // 변경 전 상태
                        pmGiftIssue.giftIssueMemo,             // 메모
                        pmGiftIssue.regBy, pmGiftIssue.regDate, pmGiftIssue.updBy, pmGiftIssue.updDate
                ))
                .from(pmGiftIssue)
                .leftJoin(pmGift).on(pmGift.giftId.eq(pmGiftIssue.giftId))
                .leftJoin(mbMember).on(mbMember.memberId.eq(pmGiftIssue.memberId))
                .leftJoin(odOrder).on(odOrder.orderId.eq(pmGiftIssue.orderId))
                .leftJoin(cdGis).on(cdGis.codeGrp.eq("GIFT_ISSUE_STATUS_CD").and(cdGis.codeValue.eq(pmGiftIssue.giftIssueStatusCd)));
    }

    /* 사은품 발행 이력 키조회 */
    @Override
    public Optional<PmGiftIssueDto.Item> selectById(String giftIssueId) {
        PmGiftIssueDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmGiftIssue.giftIssueId.eq(giftIssueId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 사은품 발행 이력 목록조회 */
    @Override
    public List<PmGiftIssueDto.Item> selectList(PmGiftIssueDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pmGiftIssue.giftIssueId, search.getGiftIssueId()));
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmGiftIssue.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmGiftIssue.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("issue_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmGiftIssue.issueDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PmGiftIssueDto.Item> query = baseSelColumnQuery()
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

    /* 사은품 발행 이력 페이지조회 */
    @Override
    public BasePage<PmGiftIssueDto.Item> selectPageData(PmGiftIssueDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pmGiftIssue.giftIssueId, search.getGiftIssueId()));
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmGiftIssue.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmGiftIssue.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("issue_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmGiftIssue.issueDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PmGiftIssueDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PmGiftIssueDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmGiftIssue.count())
                .where(wheres)
                .fetchOne();

        BasePage<PmGiftIssueDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("giftId", pmGiftIssue.giftId),
            QdslUtil.FieldDef.like("giftIssueId", pmGiftIssue.giftIssueId),
            QdslUtil.FieldDef.like("giftIssueMemo", pmGiftIssue.giftIssueMemo),
            QdslUtil.FieldDef.like("giftIssueStatusCd", pmGiftIssue.giftIssueStatusCd),
            QdslUtil.FieldDef.like("giftIssueStatusCdBefore", pmGiftIssue.giftIssueStatusCdBefore),
            QdslUtil.FieldDef.like("memberId", pmGiftIssue.memberId),
            QdslUtil.FieldDef.like("orderId", pmGiftIssue.orderId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("giftIssueId", pmGiftIssue.giftIssueId,
                   "issueDate", pmGiftIssue.issueDate),
        new OrderSpecifier<>(Order.DESC, pmGiftIssue.regDate),
        new OrderSpecifier<>(Order.ASC, pmGiftIssue.giftIssueId));
    }

    /* 사은품 발행 이력 수정 */
    @Override
    public int updateSelective(PmGiftIssue entity) {
        if (entity.getGiftIssueId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmGiftIssue);
        boolean hasAny = false;

        if (entity.getGiftId()                 != null) { update.set(pmGiftIssue.giftId,                 entity.getGiftId());                 hasAny = true; }
        if (entity.getMemberId()               != null) { update.set(pmGiftIssue.memberId,               entity.getMemberId());               hasAny = true; }
        if (entity.getOrderId()                != null) { update.set(pmGiftIssue.orderId,                entity.getOrderId());                hasAny = true; }
        if (entity.getIssueDate()              != null) { update.set(pmGiftIssue.issueDate,              entity.getIssueDate());              hasAny = true; }
        if (entity.getGiftIssueStatusCd()      != null) { update.set(pmGiftIssue.giftIssueStatusCd,      entity.getGiftIssueStatusCd());      hasAny = true; }
        if (entity.getGiftIssueStatusCdBefore()!= null) { update.set(pmGiftIssue.giftIssueStatusCdBefore,entity.getGiftIssueStatusCdBefore());hasAny = true; }
        if (entity.getGiftIssueMemo()          != null) { update.set(pmGiftIssue.giftIssueMemo,          entity.getGiftIssueMemo());          hasAny = true; }
        if (entity.getUpdBy()                  != null) { update.set(pmGiftIssue.updBy,                  entity.getUpdBy());                  hasAny = true; }
        update.set(pmGiftIssue.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmGiftIssue.giftIssueId.eq(entity.getGiftIssueId())).execute();
        return (int) affected;
    }
}
