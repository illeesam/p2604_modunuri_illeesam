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
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponIssue;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCoupon;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCouponIssue;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCouponIssueRepository;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmCouponIssue QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmCouponIssueRepositoryImpl implements QPmCouponIssueRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmCouponIssueRepositoryImpl";
    private static final QPmCouponIssue pmCouponIssue    = QPmCouponIssue.pmCouponIssue;
    private static final QPmCoupon       pmCoupon    = QPmCoupon.pmCoupon;
    private static final QMbMember       mbMember    = QMbMember.mbMember;
    private static final QVwSyCode         cdCt = new QVwSyCode("cd_ct");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * COUPON_TYPE  {PROD_DISCNT: '상품할인', ORDER_DISCNT: '주문할인', SHIP_DISCNT: '배송비할인', SHIP_FREE: '무료배송', JOIN_GIFT: '가입축하', VIP: 'VIP전용', CLAIM_COMP: '클레임보상'}
     * useYn        {Y: '사용', N: '미사용'}
     */
    private JPAQuery<PmCouponIssueDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmCouponIssueDto.Item.class,
                        pmCouponIssue.couponIssueId,     // 발급ID (PK)
                        pmCouponIssue.couponId,    // 쿠폰ID (pm_coupon.coupon_id)
                        pmCouponIssue.memberId,    // 회원ID
                        pmCouponIssue.issueDate,   // 발급일시
                        pmCouponIssue.useYn,       // 사용여부 — Y: '사용' / N: '미사용'
                        pmCouponIssue.useDate,     // 사용일시
                        pmCouponIssue.orderId,     // 사용주문ID
                        pmCouponIssue.regBy, pmCouponIssue.regDate, pmCouponIssue.updBy, pmCouponIssue.updDate,
                        pmCoupon.couponNm.as("couponNm"),           // 쿠폰명 (조인)
                        pmCoupon.couponCd.as("couponCd"),           // 쿠폰코드 (조인)
                        pmCoupon.couponTypeCd.as("couponTypeCd"),   // 쿠폰유형 (조인) — COUPON_TYPE {PROD_DISCNT, ORDER_DISCNT, SHIP_DISCNT, SHIP_FREE, JOIN_GIFT, VIP, CLAIM_COMP}
                        pmCoupon.discountRate.as("discountRate"),   // 할인률 (%) (조인)
                        pmCoupon.discountAmt.as("discountAmt"),     // 할인금액 (조인)
                        pmCoupon.validFrom.as("validFrom"),         // 유효기간 시작 (조인)
                        pmCoupon.validTo.as("validTo"),             // 유효기간 종료 (조인)
                        mbMember.memberNm.as("memberNm"),           // 회원명 (조인)
                        mbMember.loginId.as("memberEmail"),         // 회원 로그인ID/이메일 (조인)
                        mbMember.memberPhone.as("memberPhone"),     // 회원 전화번호 (조인)
                        cdCt.codeLabel.as("couponTypeCdNm")         // 쿠폰유형 코드라벨 (조인)
                ))
                .from(pmCouponIssue)
                .leftJoin(pmCoupon).on(pmCoupon.couponId.eq(pmCouponIssue.couponId))
                .leftJoin(mbMember).on(mbMember.memberId.eq(pmCouponIssue.memberId))
                .leftJoin(cdCt).on(cdCt.codeGrp.eq("COUPON_TYPE_CD").and(cdCt.codeValue.eq(pmCoupon.couponTypeCd)));
    }

    /* 쿠폰 발행 키조회 */
    @Override
    public Optional<PmCouponIssueDto.Item> selectById(String couponIssueId) {
        PmCouponIssueDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmCouponIssue.couponIssueId.eq(couponIssueId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 쿠폰 발행 목록조회 */
    @Override
    public List<PmCouponIssueDto.Item> selectList(PmCouponIssueDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(pmCouponIssue.couponId, search.getCouponIds()));
        whereList.add(QdslUtil.strEq(pmCouponIssue.couponIssueId, search.getCouponIssueId()));
        whereList.add(QdslUtil.strEq(pmCouponIssue.memberId, search.getMemberId()));
        whereList.add(QdslUtil.strEq(pmCouponIssue.useYn, search.getUseYn()));
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCouponIssue.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCouponIssue.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("issue_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCouponIssue.issueDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PmCouponIssueDto.Item> query = baseSelColumnQuery()
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

    /* 쿠폰 발행 페이지조회 */
    @Override
    public BasePage<PmCouponIssueDto.Item> selectPageData(PmCouponIssueDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(pmCouponIssue.couponId, search.getCouponIds()));
        whereList.add(QdslUtil.strEq(pmCouponIssue.couponIssueId, search.getCouponIssueId()));
        whereList.add(QdslUtil.strEq(pmCouponIssue.memberId, search.getMemberId()));
        whereList.add(QdslUtil.strEq(pmCouponIssue.useYn, search.getUseYn()));
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCouponIssue.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCouponIssue.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("issue_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCouponIssue.issueDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PmCouponIssueDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PmCouponIssueDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmCouponIssue.count())
                .where(wheres)
                .fetchOne();

        BasePage<PmCouponIssueDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("couponId", pmCouponIssue.couponId),
            QdslUtil.FieldDef.like("couponIssueId", pmCouponIssue.couponIssueId),
            QdslUtil.FieldDef.like("memberId", pmCouponIssue.memberId),
            QdslUtil.FieldDef.like("orderId", pmCouponIssue.orderId),
            QdslUtil.FieldDef.like("useYn", pmCouponIssue.useYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("couponIssueId", pmCouponIssue.couponIssueId,
                   "issueDate", pmCouponIssue.issueDate),
        new OrderSpecifier<>(Order.DESC, pmCouponIssue.regDate),
        new OrderSpecifier<>(Order.ASC, pmCouponIssue.couponIssueId));
    }

    /* 쿠폰 발행 수정 */
    @Override
    public int updateSelective(PmCouponIssue entity) {
        if (entity.getCouponIssueId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmCouponIssue);
        boolean hasAny = false;

        if (entity.getUseYn()   != null) { update.set(pmCouponIssue.useYn,   entity.getUseYn());   hasAny = true; }
        if (entity.getUseDate() != null) { update.set(pmCouponIssue.useDate, entity.getUseDate()); hasAny = true; }
        if (entity.getOrderId() != null) { update.set(pmCouponIssue.orderId, entity.getOrderId()); hasAny = true; }
        if (entity.getUpdBy()   != null) { update.set(pmCouponIssue.updBy,   entity.getUpdBy());   hasAny = true; }
        update.set(pmCouponIssue.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmCouponIssue.couponIssueId.eq(entity.getCouponIssueId())).execute();
        return (int) affected;
    }
}
