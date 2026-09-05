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
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderItem;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveIssue;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmSaveIssue;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmSaveIssueRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmSaveIssue(적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmSaveIssueRepositoryImpl implements QPmSaveIssueRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmSaveIssueRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QPmSaveIssue pmSaveIssue    = QPmSaveIssue.pmSaveIssue;
    private static final QSySite      sySite  = QSySite.sySite;
    private static final QMbMember    mbMember  = QMbMember.mbMember;
    private static final QOdOrder     odOrder  = QOdOrder.odOrder;
    private static final QOdOrderItem odOrderItem  = QOdOrderItem.odOrderItem;
    private static final QPdProd      pdProd  = QPdProd.pdProd;
    private static final QVwSyCode      codeSaveIssueTypeCd = new QVwSyCode("cd_sit");
    private static final QVwSyCode      codeIssueStatusCd = new QVwSyCode("cd_sis");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * SAVE_ISSUE_TYPE    {ORDER: '구매확정', EVENT: '이벤트', REVIEW: '리뷰', REFERRAL: '친구초대', ADMIN: '관리자지급'} (Entity 주석: ORDER/EVENT/REVIEW/REFERRAL/ADMIN)
     * SAVE_ISSUE_STATUS  {PENDING: '적립예정', CONFIRMED: '적립완료', EXPIRED: '소멸', CANCELED: '취소'} (Entity 주석 기준)
     * refTypeCd          참조유형 (ORDER/EVENT/REVIEW/ADMIN)
     */
    private JPAQuery<PmSaveIssueDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmSaveIssueDto.Item.class,
                        pmSaveIssue.saveIssueId,               // 적립지급ID (PK, YYMMDDhhmmss+rand4)
                        pmSaveIssue.memberId,                  // 회원ID (mb_member.member_id)
                        pmSaveIssue.saveIssueTypeCd,           // 지급유형 — SAVE_ISSUE_TYPE {ORDER, EVENT, REVIEW, REFERRAL, ADMIN}
                        codeSaveIssueTypeCd.codeLabel.as("saveIssueTypeCdNm"), // 코드 라벨
                        pmSaveIssue.saveAmt,                   // 지급 적립금액
                        pmSaveIssue.saveRate,                  // 적립률 (%, 구매적립 시)
                        pmSaveIssue.refTypeCd,                 // 참조유형 (ORDER/EVENT/REVIEW/ADMIN)
                        pmSaveIssue.refId,                     // 참조ID (order_id / event_id 등)
                        pmSaveIssue.orderId,                   // 주문ID (od_order.order_id, 구매적립 시)
                        pmSaveIssue.orderItemId,               // 주문상품ID (od_order_item.order_item_id, 상품별 적립 시)
                        pmSaveIssue.prodId,                    // 상품ID (pd_prod.prod_id, 적립 기준 상품)
                        pmSaveIssue.expireDate,                // 소멸예정일
                        pmSaveIssue.issueStatusCd,             // 지급상태 — SAVE_ISSUE_STATUS {PENDING, CONFIRMED, EXPIRED, CANCELED}
                        codeIssueStatusCd.codeLabel.as("issueStatusCdNm"), // 코드 라벨
                        pmSaveIssue.issueStatusCdBefore,       // 변경 전 지급상태
                        pmSaveIssue.saveMemo,                  // 지급 메모
                        pmSaveIssue.regBy,      // 등록자
                        pmSaveIssue.regDate,    // 등록일시
                        pmSaveIssue.updBy,      // 수정자
                        pmSaveIssue.updDate,    // 수정일시
                        pmSaveIssue.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        pmSaveIssue.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(pmSaveIssue)
                .innerJoin(mbMember).on(mbMember.memberId.eq(pmSaveIssue.memberId)) // 회원
                .innerJoin(codeSaveIssueTypeCd).on(codeSaveIssueTypeCd.codeGrp.eq("SAVE_ISSUE_TYPE_CD").and(codeSaveIssueTypeCd.codeValue.eq(pmSaveIssue.saveIssueTypeCd))) // 적립금발급유형
                .leftJoin(odOrder).on(odOrder.orderId.eq(pmSaveIssue.orderId)) // 주문
                .leftJoin(odOrderItem).on(odOrderItem.orderItemId.eq(pmSaveIssue.orderItemId)) // 주문상품
                .leftJoin(pdProd).on(pdProd.prodId.eq(pmSaveIssue.prodId)) // 상품
                .leftJoin(codeIssueStatusCd).on(codeIssueStatusCd.codeGrp.eq("ISSUE_STATUS_CD").and(codeIssueStatusCd.codeValue.eq(pmSaveIssue.issueStatusCd))) // 발급상태
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(pmSaveIssue.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(pmSaveIssue.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(pmSaveIssue.siteId)) // 사이트

                ;
    }

    /* 적립금 지급 이력 키조회 */
    @Override
    public Optional<PmSaveIssueDto.Item> selectById(String saveIssueId) {
        PmSaveIssueDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmSaveIssue.saveIssueId.eq(saveIssueId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 적립금 지급 이력 목록조회 */
    @Override
    public List<PmSaveIssueDto.Item> selectList(PmSaveIssueDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pmSaveIssue.saveIssueId, search.getSaveIssueId())); // 적립지급ID (YYMMDDhhmmss+rand4)
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmSaveIssue.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmSaveIssue.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pmSaveIssue.siteId, search.getSiteId())); // 사이트ID

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PmSaveIssueDto.Item> query = baseSelColumnQuery()
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
        List<PmSaveIssueDto.Item> list = query.fetch();
        return list;
    }

    /* 적립금 지급 이력 페이지조회 */
    @Override
    public BasePage<PmSaveIssueDto.Item> selectPageData(PmSaveIssueDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pmSaveIssue.saveIssueId, search.getSaveIssueId())); // 적립지급ID (YYMMDDhhmmss+rand4)
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmSaveIssue.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmSaveIssue.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pmSaveIssue.siteId, search.getSiteId())); // 사이트ID
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PmSaveIssueDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PmSaveIssueDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmSaveIssue.count())
                .where(wheres)
                .fetchOne();

        BasePage<PmSaveIssueDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "issueStatusCd,issueStatusCdBefore,memberId,orderId,orderItemId" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("issueStatusCd", pmSaveIssue.issueStatusCd), // 지급상태 — SAVE_ISSUE_STATUS
            QdslUtil.FieldDef.like("issueStatusCdBefore", pmSaveIssue.issueStatusCdBefore), // 변경 전 지급상태
            QdslUtil.FieldDef.like("memberId", pmSaveIssue.memberId), // 회원ID (mb_member.member_id)
            QdslUtil.FieldDef.like("orderId", pmSaveIssue.orderId), // 주문ID (od_order.order_id, 구매적립 시)
            QdslUtil.FieldDef.like("orderItemId", pmSaveIssue.orderItemId), // 주문상품ID (od_order_item.order_item_id, 상품별 적립 시)
            QdslUtil.FieldDef.like("prodId", pmSaveIssue.prodId), // 상품ID (pd_prod.prod_id, 적립 기준 상품)
            QdslUtil.FieldDef.like("refId", pmSaveIssue.refId), // 참조ID (order_id / event_id 등)
            QdslUtil.FieldDef.like("refTypeCd", pmSaveIssue.refTypeCd), // 참조유형 (ORDER/EVENT/REVIEW/ADMIN)
            QdslUtil.FieldDef.like("saveIssueId", pmSaveIssue.saveIssueId), // 적립지급ID (YYMMDDhhmmss+rand4)
            QdslUtil.FieldDef.like("saveIssueTypeCd", pmSaveIssue.saveIssueTypeCd), // 지급유형 — SAVE_ISSUE_TYPE
            QdslUtil.FieldDef.like("saveMemo", pmSaveIssue.saveMemo) // 지급 메모
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("saveIssueId", pmSaveIssue.saveIssueId,
                   "regDate", pmSaveIssue.regDate),
        new OrderSpecifier<>(Order.DESC, pmSaveIssue.regDate),
        new OrderSpecifier<>(Order.ASC, pmSaveIssue.saveIssueId));
    }

    /* 적립금 지급 이력 수정 */
    @Override
    public int updateSelective(PmSaveIssue entity) {
        if (entity.getSaveIssueId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmSaveIssue);
        boolean hasAny = false;

        if (entity.getMemberId()            != null) { update.set(pmSaveIssue.memberId,            entity.getMemberId());            hasAny = true; }
        if (entity.getSaveIssueTypeCd()     != null) { update.set(pmSaveIssue.saveIssueTypeCd,     entity.getSaveIssueTypeCd());     hasAny = true; }
        if (entity.getSaveAmt()             != null) { update.set(pmSaveIssue.saveAmt,             entity.getSaveAmt());             hasAny = true; }
        if (entity.getSaveRate()            != null) { update.set(pmSaveIssue.saveRate,            entity.getSaveRate());            hasAny = true; }
        if (entity.getRefTypeCd()           != null) { update.set(pmSaveIssue.refTypeCd,           entity.getRefTypeCd());           hasAny = true; }
        if (entity.getRefId()               != null) { update.set(pmSaveIssue.refId,               entity.getRefId());               hasAny = true; }
        if (entity.getOrderId()             != null) { update.set(pmSaveIssue.orderId,             entity.getOrderId());             hasAny = true; }
        if (entity.getOrderItemId()         != null) { update.set(pmSaveIssue.orderItemId,         entity.getOrderItemId());         hasAny = true; }
        if (entity.getProdId()              != null) { update.set(pmSaveIssue.prodId,              entity.getProdId());              hasAny = true; }
        if (entity.getExpireDate()          != null) { update.set(pmSaveIssue.expireDate,          entity.getExpireDate());          hasAny = true; }
        if (entity.getIssueStatusCd()       != null) { update.set(pmSaveIssue.issueStatusCd,       entity.getIssueStatusCd());       hasAny = true; }
        if (entity.getIssueStatusCdBefore() != null) { update.set(pmSaveIssue.issueStatusCdBefore, entity.getIssueStatusCdBefore()); hasAny = true; }
        if (entity.getSaveMemo()            != null) { update.set(pmSaveIssue.saveMemo,            entity.getSaveMemo());            hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(pmSaveIssue.updBy,               entity.getUpdBy());               hasAny = true; }
        update.set(pmSaveIssue.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmSaveIssue.saveIssueId.eq(entity.getSaveIssueId())).execute();
        return (int) affected;
    }
}
