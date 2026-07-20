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
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftIssue;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGift;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGiftIssue;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmGiftIssueRepository;
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
    private static final QSyCode      cdGis = new QSyCode("cd_gis");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "issue_date", pmGiftIssue.issueDate,
        "reg_date", pmGiftIssue.regDate,
        "upd_date", pmGiftIssue.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("giftId", pmGiftIssue.giftId),
        Map.entry("giftIssueId", pmGiftIssue.giftIssueId),
        Map.entry("giftIssueMemo", pmGiftIssue.giftIssueMemo),
        Map.entry("giftIssueStatusCd", pmGiftIssue.giftIssueStatusCd),
        Map.entry("giftIssueStatusCdBefore", pmGiftIssue.giftIssueStatusCdBefore),
        Map.entry("memberId", pmGiftIssue.memberId),
        Map.entry("orderId", pmGiftIssue.orderId),
        Map.entry("siteId", pmGiftIssue.siteId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * GIFT_ISSUE_STATUS  {ISSUED: '발급됨', DELIVERED: '배송완료', CANCELLED: '취소'}
     */
    private JPAQuery<PmGiftIssueDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmGiftIssueDto.Item.class,
                        pmGiftIssue.giftIssueId,               // 사은품발급ID (PK)
                        pmGiftIssue.giftId,                    // 사은품ID (pm_gift.gift_id)
                        pmGiftIssue.siteId,                    // 사이트ID
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
                .leftJoin(sySite).on(sySite.siteId.eq(pmGiftIssue.siteId))
                .leftJoin(cdGis).on(cdGis.codeGrp.eq("GIFT_ISSUE_STATUS").and(cdGis.codeValue.eq(pmGiftIssue.giftIssueStatusCd)));
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
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmGiftIssueDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pmGiftIssue.siteId, search.getSiteId()),
                    QdslUtil.strEq(pmGiftIssue.giftIssueId, search.getGiftIssueId()),
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

    /* 사은품 발행 이력 페이지조회 */
    @Override
    public PmGiftIssueDto.PageResponse selectPageData(PmGiftIssueDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pmGiftIssue.siteId, search.getSiteId()),
                QdslUtil.strEq(pmGiftIssue.giftIssueId, search.getGiftIssueId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmGiftIssueDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmGiftIssueDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmGiftIssue.count())
                .where(wheres)
                .fetchOne();

        PmGiftIssueDto.PageResponse res = new PmGiftIssueDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(PmGiftIssueDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmGiftIssueDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pmGiftIssue.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmGiftIssue.giftIssueId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("giftIssueId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmGiftIssue.giftIssueId));
                } else if ("issueDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmGiftIssue.issueDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pmGiftIssue.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmGiftIssue.giftIssueId));
        }
        return orders;
    }

    /* 사은품 발행 이력 수정 */
    @Override
    public int updateSelective(PmGiftIssue entity) {
        if (entity.getGiftIssueId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmGiftIssue);
        boolean hasAny = false;

        if (entity.getGiftId()                 != null) { update.set(pmGiftIssue.giftId,                 entity.getGiftId());                 hasAny = true; }
        if (entity.getSiteId()                 != null) { update.set(pmGiftIssue.siteId,                 entity.getSiteId());                 hasAny = true; }
        if (entity.getMemberId()               != null) { update.set(pmGiftIssue.memberId,               entity.getMemberId());               hasAny = true; }
        if (entity.getOrderId()                != null) { update.set(pmGiftIssue.orderId,                entity.getOrderId());                hasAny = true; }
        if (entity.getIssueDate()              != null) { update.set(pmGiftIssue.issueDate,              entity.getIssueDate());              hasAny = true; }
        if (entity.getGiftIssueStatusCd()      != null) { update.set(pmGiftIssue.giftIssueStatusCd,      entity.getGiftIssueStatusCd());      hasAny = true; }
        if (entity.getGiftIssueStatusCdBefore()!= null) { update.set(pmGiftIssue.giftIssueStatusCdBefore,entity.getGiftIssueStatusCdBefore());hasAny = true; }
        if (entity.getGiftIssueMemo()          != null) { update.set(pmGiftIssue.giftIssueMemo,          entity.getGiftIssueMemo());          hasAny = true; }
        if (entity.getUpdBy()                  != null) { update.set(pmGiftIssue.updBy,                  entity.getUpdBy());                  hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pmGiftIssue.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmGiftIssue.giftIssueId.eq(entity.getGiftIssueId())).execute();
        return (int) affected;
    }
}
