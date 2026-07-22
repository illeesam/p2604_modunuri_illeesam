package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdRefundDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefund;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdClaim;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdRefund;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdRefundRepository;
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
/** OdRefund QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdRefundRepositoryImpl implements QOdRefundRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdRefundRepositoryImpl";
    private static final QOdRefund odRefund   = QOdRefund.odRefund;
    private static final QSySite   ste = new QSySite("ste");
    private static final QOdOrder  ord = new QOdOrder("ord");
    private static final QOdClaim  cla = new QOdClaim("cla");
    private static final QSyCode   cdRt = new QSyCode("cd_rt");
    private static final QSyCode   cdRs = new QSyCode("cd_rs");
    private static final QSyCode   cdCf = new QSyCode("cd_cf");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", odRefund.regDate,
        "upd_date", odRefund.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("claimId", odRefund.claimId),
        Map.entry("faultTypeCd", odRefund.faultTypeCd),
        Map.entry("memo", odRefund.memo),
        Map.entry("orderId", odRefund.orderId),
        Map.entry("refundId", odRefund.refundId),
        Map.entry("refundReason", odRefund.refundReason),
        Map.entry("refundStatusCd", odRefund.refundStatusCd),
        Map.entry("refundStatusCdBefore", odRefund.refundStatusCdBefore),
        Map.entry("refundTypeCd", odRefund.refundTypeCd),
        Map.entry("siteId", odRefund.siteId)
    );

    /*
     * baseListQuery — 코드성 필드 예시 코드값
     * REFUND_TYPE   {CANCEL:취소환불, RETURN:반품환불, PARTIAL:부분환불, EXTRA:추가결제환불}
     * REFUND_STATUS {PENDING:대기, COMPLT:완료, FAILED:실패}
     * FAULT_TYPE (od_refund.fault_type_cd, Entity 주석상 코드그룹명 CLAIM_FAULT — 정책서(sy.08) 기준 실제 그룹명은 FAULT_TYPE)
     *   {CUST:구매자 귀책, VENDOR:판매자 귀책, PLATFORM:플랫폼 귀책}
     */
    private JPAQuery<OdRefundDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdRefundDto.Item.class,
                        odRefund.refundId,           // 환불ID (YYMMDDhhmmss+rand4)
                        odRefund.siteId,              // 사이트ID (sy_site.site_id)
                        odRefund.orderId,             // 주문ID (od_order.order_id)
                        odRefund.claimId,             // 클레임ID (od_claim.claim_id)
                        odRefund.refundTypeCd,        // 환불유형코드 — REFUND_TYPE {CANCEL:취소환불, RETURN:반품환불, PARTIAL:부분환불, EXTRA:추가결제환불}
                        odRefund.refundProdAmt,       // 환불 상품금액 (주문쿠폰 안분 차감 후 실환불 대상액)
                        odRefund.refundCouponAmt,     // 주문쿠폰 안분 차감액 (환불 불가 — 쿠폰 재발급 또는 소멸)
                        odRefund.refundShipAmt,       // 환불 배송비 (음수이면 추가청구)
                        odRefund.refundSaveAmt,       // 적립금 복원금액 (od_order_discnt.SAVE_USE 기준)
                        odRefund.refundCacheAmt,      // 캐쉬 복원금액 (od_order_discnt.CACHE_USE 기준)
                        odRefund.totalRefundAmt,      // 총 환불금액 (실결제 수단으로 돌려주는 합계)
                        odRefund.refundStatusCd,      // 환불상태 — REFUND_STATUS {PENDING:대기, COMPLT:완료, FAILED:실패}
                        odRefund.refundStatusCdBefore,// 변경 전 환불상태 — REFUND_STATUS (동일 코드그룹)
                        odRefund.refundReqDate,       // 환불 요청일시
                        odRefund.refundCompltDate,    // 환불 완료일시
                        odRefund.faultTypeCd,         // 귀책유형코드 — FAULT_TYPE {CUST:구매자 귀책, VENDOR:판매자 귀책, PLATFORM:플랫폼 귀책}
                        odRefund.refundReason,        // 환불 사유
                        odRefund.memo,                // 관리 메모
                        odRefund.regBy, odRefund.regDate, odRefund.updBy, odRefund.updDate
                ))
                .from(odRefund)
                .leftJoin(ste).on(ste.siteId.eq(odRefund.siteId))
                .leftJoin(ord).on(ord.orderId.eq(odRefund.orderId))
                .leftJoin(cla).on(cla.claimId.eq(odRefund.claimId))
                .leftJoin(cdRt).on(cdRt.codeGrp.eq("REFUND_TYPE").and(cdRt.codeValue.eq(odRefund.refundTypeCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("REFUND_STATUS").and(cdRs.codeValue.eq(odRefund.refundStatusCd)))
                .leftJoin(cdCf).on(cdCf.codeGrp.eq("CLAIM_FAULT").and(cdCf.codeValue.eq(odRefund.faultTypeCd)));
    }

    /* 환불 키조회 */
    @Override
    public Optional<OdRefundDto.Item> selectById(String refundId) {
        OdRefundDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odRefund.refundId.eq(refundId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 환불 목록조회 */
    @Override
    public List<OdRefundDto.Item> selectList(OdRefundDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdRefundDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(odRefund.siteId, search.getSiteId()),
                    QdslUtil.strEq(odRefund.refundId, search.getRefundId()),
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

    /* 환불 페이지조회 */
    @Override
    public OdRefundDto.PageResponse selectPageData(OdRefundDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(odRefund.siteId, search.getSiteId()),
                QdslUtil.strEq(odRefund.refundId, search.getRefundId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdRefundDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdRefundDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odRefund.count())
                .where(wheres)
                .fetchOne();

        OdRefundDto.PageResponse res = new OdRefundDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(OdRefundDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdRefundDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odRefund.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odRefund.refundId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("refundId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odRefund.refundId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odRefund.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odRefund.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odRefund.refundId));
        }
        return orders;
    }

    /* 환불 수정 */
    @Override
    public int updateSelective(OdRefund entity) {
        if (entity.getRefundId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odRefund);
        boolean hasAny = false;

        if (entity.getSiteId()               != null) { update.set(odRefund.siteId,               entity.getSiteId());               hasAny = true; }
        if (entity.getOrderId()              != null) { update.set(odRefund.orderId,              entity.getOrderId());              hasAny = true; }
        if (entity.getClaimId()              != null) { update.set(odRefund.claimId,              entity.getClaimId());              hasAny = true; }
        if (entity.getRefundTypeCd()         != null) { update.set(odRefund.refundTypeCd,         entity.getRefundTypeCd());         hasAny = true; }
        if (entity.getRefundProdAmt()        != null) { update.set(odRefund.refundProdAmt,        entity.getRefundProdAmt());        hasAny = true; }
        if (entity.getRefundCouponAmt()      != null) { update.set(odRefund.refundCouponAmt,      entity.getRefundCouponAmt());      hasAny = true; }
        if (entity.getRefundShipAmt()        != null) { update.set(odRefund.refundShipAmt,        entity.getRefundShipAmt());        hasAny = true; }
        if (entity.getRefundSaveAmt()        != null) { update.set(odRefund.refundSaveAmt,        entity.getRefundSaveAmt());        hasAny = true; }
        if (entity.getRefundCacheAmt()       != null) { update.set(odRefund.refundCacheAmt,       entity.getRefundCacheAmt());       hasAny = true; }
        if (entity.getTotalRefundAmt()       != null) { update.set(odRefund.totalRefundAmt,       entity.getTotalRefundAmt());       hasAny = true; }
        if (entity.getRefundStatusCd()       != null) { update.set(odRefund.refundStatusCd,       entity.getRefundStatusCd());       hasAny = true; }
        if (entity.getRefundStatusCdBefore() != null) { update.set(odRefund.refundStatusCdBefore, entity.getRefundStatusCdBefore()); hasAny = true; }
        if (entity.getRefundReqDate()        != null) { update.set(odRefund.refundReqDate,        entity.getRefundReqDate());        hasAny = true; }
        if (entity.getRefundCompltDate()     != null) { update.set(odRefund.refundCompltDate,     entity.getRefundCompltDate());     hasAny = true; }
        if (entity.getFaultTypeCd()          != null) { update.set(odRefund.faultTypeCd,          entity.getFaultTypeCd());          hasAny = true; }
        if (entity.getRefundReason()         != null) { update.set(odRefund.refundReason,         entity.getRefundReason());         hasAny = true; }
        if (entity.getMemo()                 != null) { update.set(odRefund.memo,                 entity.getMemo());                 hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(odRefund.updBy,                entity.getUpdBy());                hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odRefund.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odRefund.refundId.eq(entity.getRefundId())).execute();
        return (int) affected;
    }
}
