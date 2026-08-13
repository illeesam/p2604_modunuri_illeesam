package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdRefundDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefund;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdClaim;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdRefund;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdRefundRepository;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
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
    private static final QVwSyCode   cdRt = new QVwSyCode("cd_rt");
    private static final QVwSyCode   cdRs = new QVwSyCode("cd_rs");
    private static final QVwSyCode   cdCf = new QVwSyCode("cd_cf");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_RANGE_FIELDS = Map.of("reg_date", odRefund.regDate,
        "upd_date", odRefund.updDate
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
                .leftJoin(ord).on(ord.orderId.eq(odRefund.orderId))
                .leftJoin(cla).on(cla.claimId.eq(odRefund.claimId))
                .leftJoin(cdRt).on(cdRt.codeGrp.eq("REFUND_TYPE_CD").and(cdRt.codeValue.eq(odRefund.refundTypeCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("REFUND_STATUS_CD").and(cdRs.codeValue.eq(odRefund.refundStatusCd)))
                .leftJoin(cdCf).on(cdCf.codeGrp.eq("FAULT_TYPE_CD").and(cdCf.codeValue.eq(odRefund.faultTypeCd)));
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
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        JPAQuery<OdRefundDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(odRefund.refundId, search.getRefundId()),
                    QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                    andSearchValue(search.getSearchValue(), search.getSearchType())
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
    public BasePage<OdRefundDto.Item> selectPageData(OdRefundDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                QdslUtil.strEq(odRefund.refundId, search.getRefundId()),
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                andSearchValue(search.getSearchValue(), search.getSearchType())
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

        BasePage<OdRefundDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("claimId", odRefund.claimId),
            QdslUtil.FieldDef.like("faultTypeCd", odRefund.faultTypeCd),
            QdslUtil.FieldDef.like("memo", odRefund.memo),
            QdslUtil.FieldDef.like("orderId", odRefund.orderId),
            QdslUtil.FieldDef.like("refundId", odRefund.refundId),
            QdslUtil.FieldDef.like("refundReason", odRefund.refundReason),
            QdslUtil.FieldDef.like("refundStatusCd", odRefund.refundStatusCd),
            QdslUtil.FieldDef.like("refundStatusCdBefore", odRefund.refundStatusCdBefore),
            QdslUtil.FieldDef.like("refundTypeCd", odRefund.refundTypeCd)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("refundId", odRefund.refundId,
                   "regDate", odRefund.regDate),
        new OrderSpecifier<>(Order.DESC, odRefund.regDate),
        new OrderSpecifier<>(Order.ASC, odRefund.refundId));
    }

    /* 환불 수정 */
    @Override
    public int updateSelective(OdRefund entity) {
        if (entity.getRefundId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odRefund);
        boolean hasAny = false;

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
