package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
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
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmSaveIssue QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmSaveIssueRepositoryImpl implements QPmSaveIssueRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmSaveIssueRepositoryImpl";
    private static final QPmSaveIssue pmSaveIssue    = QPmSaveIssue.pmSaveIssue;
    private static final QSySite      sySite  = QSySite.sySite;
    private static final QMbMember    mbMember  = QMbMember.mbMember;
    private static final QOdOrder     odOrder  = QOdOrder.odOrder;
    private static final QOdOrderItem odOrderItem  = QOdOrderItem.odOrderItem;
    private static final QPdProd      pdProd  = QPdProd.pdProd;
    private static final QSyCode      cdSit = new QSyCode("cd_sit");
    private static final QSyCode      cdSis = new QSyCode("cd_sis");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pmSaveIssue.regDate,
        "upd_date", pmSaveIssue.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("issueStatusCd", pmSaveIssue.issueStatusCd),
        Map.entry("issueStatusCdBefore", pmSaveIssue.issueStatusCdBefore),
        Map.entry("memberId", pmSaveIssue.memberId),
        Map.entry("orderId", pmSaveIssue.orderId),
        Map.entry("orderItemId", pmSaveIssue.orderItemId),
        Map.entry("prodId", pmSaveIssue.prodId),
        Map.entry("refId", pmSaveIssue.refId),
        Map.entry("refTypeCd", pmSaveIssue.refTypeCd),
        Map.entry("saveIssueId", pmSaveIssue.saveIssueId),
        Map.entry("saveIssueTypeCd", pmSaveIssue.saveIssueTypeCd),
        Map.entry("saveMemo", pmSaveIssue.saveMemo),
        Map.entry("siteId", pmSaveIssue.siteId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * SAVE_ISSUE_TYPE    {ORDER: '구매확정', EVENT: '이벤트', REVIEW: '리뷰', REFERRAL: '친구초대', ADMIN: '관리자지급'} (Entity 주석: ORDER/EVENT/REVIEW/REFERRAL/ADMIN)
     * SAVE_ISSUE_STATUS  {PENDING: '적립예정', CONFIRMED: '적립완료', EXPIRED: '소멸', CANCELED: '취소'} (Entity 주석 기준)
     * refTypeCd          참조유형 (ORDER/EVENT/REVIEW/ADMIN)
     */
    private JPAQuery<PmSaveIssueDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmSaveIssueDto.Item.class,
                        pmSaveIssue.saveIssueId,               // 적립지급ID (PK, YYMMDDhhmmss+rand4)
                        pmSaveIssue.siteId,                    // 사이트ID (sy_site.site_id)
                        pmSaveIssue.memberId,                  // 회원ID (mb_member.member_id)
                        pmSaveIssue.saveIssueTypeCd,           // 지급유형 — SAVE_ISSUE_TYPE {ORDER, EVENT, REVIEW, REFERRAL, ADMIN}
                        pmSaveIssue.saveAmt,                   // 지급 적립금액
                        pmSaveIssue.saveRate,                  // 적립률 (%, 구매적립 시)
                        pmSaveIssue.refTypeCd,                 // 참조유형 (ORDER/EVENT/REVIEW/ADMIN)
                        pmSaveIssue.refId,                     // 참조ID (order_id / event_id 등)
                        pmSaveIssue.orderId,                   // 주문ID (od_order.order_id, 구매적립 시)
                        pmSaveIssue.orderItemId,               // 주문상품ID (od_order_item.order_item_id, 상품별 적립 시)
                        pmSaveIssue.prodId,                    // 상품ID (pd_prod.prod_id, 적립 기준 상품)
                        pmSaveIssue.expireDate,                // 소멸예정일
                        pmSaveIssue.issueStatusCd,             // 지급상태 — SAVE_ISSUE_STATUS {PENDING, CONFIRMED, EXPIRED, CANCELED}
                        pmSaveIssue.issueStatusCdBefore,       // 변경 전 지급상태
                        pmSaveIssue.saveMemo,                  // 지급 메모
                        pmSaveIssue.regBy, pmSaveIssue.regDate, pmSaveIssue.updBy, pmSaveIssue.updDate
                ))
                .from(pmSaveIssue)
                .leftJoin(sySite).on(sySite.siteId.eq(pmSaveIssue.siteId))
                .leftJoin(mbMember).on(mbMember.memberId.eq(pmSaveIssue.memberId))
                .leftJoin(odOrder).on(odOrder.orderId.eq(pmSaveIssue.orderId))
                .leftJoin(odOrderItem).on(odOrderItem.orderItemId.eq(pmSaveIssue.orderItemId))
                .leftJoin(pdProd).on(pdProd.prodId.eq(pmSaveIssue.prodId))
                .leftJoin(cdSit).on(cdSit.codeGrp.eq("SAVE_ISSUE_TYPE").and(cdSit.codeValue.eq(pmSaveIssue.saveIssueTypeCd)))
                .leftJoin(cdSis).on(cdSis.codeGrp.eq("SAVE_ISSUE_STATUS").and(cdSis.codeValue.eq(pmSaveIssue.issueStatusCd)));
    }

    /* 적립금 지급 이력 키조회 */
    @Override
    public Optional<PmSaveIssueDto.Item> selectById(String saveIssueId) {
        PmSaveIssueDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmSaveIssue.saveIssueId.eq(saveIssueId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 적립금 지급 이력 목록조회 */
    @Override
    public List<PmSaveIssueDto.Item> selectList(PmSaveIssueDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmSaveIssueDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pmSaveIssue.siteId, search.getSiteId()),
                    QdslUtil.strEq(pmSaveIssue.saveIssueId, search.getSaveIssueId()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 적립금 지급 이력 페이지조회 */
    @Override
    public PmSaveIssueDto.PageResponse selectPageData(PmSaveIssueDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pmSaveIssue.siteId, search.getSiteId()),
                QdslUtil.strEq(pmSaveIssue.saveIssueId, search.getSaveIssueId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmSaveIssueDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmSaveIssueDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmSaveIssue.count())
                .where(wheres)
                .fetchOne();

        PmSaveIssueDto.PageResponse res = new PmSaveIssueDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(PmSaveIssueDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmSaveIssueDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pmSaveIssue.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmSaveIssue.saveIssueId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("saveIssueId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmSaveIssue.saveIssueId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmSaveIssue.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pmSaveIssue.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmSaveIssue.saveIssueId));
        }
        return orders;
    }

    /* 적립금 지급 이력 수정 */
    @Override
    public int updateSelective(PmSaveIssue entity) {
        if (entity.getSaveIssueId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmSaveIssue);
        boolean hasAny = false;

        if (entity.getSiteId()              != null) { update.set(pmSaveIssue.siteId,              entity.getSiteId());              hasAny = true; }
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pmSaveIssue.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmSaveIssue.saveIssueId.eq(entity.getSaveIssueId())).execute();
        return (int) affected;
    }
}
