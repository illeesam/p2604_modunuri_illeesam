package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** OdRefund QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdRefundRepositoryImpl implements QOdRefundRepository {

    private final JPAQueryFactory queryFactory;
    private static final QOdRefund r   = QOdRefund.odRefund;
    private static final QSySite   ste = new QSySite("ste");
    private static final QOdOrder  ord = new QOdOrder("ord");
    private static final QOdClaim  cla = new QOdClaim("cla");
    private static final QSyCode   cdRt = new QSyCode("cd_rt");
    private static final QSyCode   cdRs = new QSyCode("cd_rs");
    private static final QSyCode   cdCf = new QSyCode("cd_cf");

    @Override
    public Optional<OdRefundDto.Item> selectById(String refundId) {
        OdRefundDto.Item dto = baseListQuery()
                .where(r.refundId.eq(refundId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<OdRefundDto.Item> selectList(OdRefundDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdRefundDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public OdRefundDto.PageResponse selectPageList(OdRefundDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdRefundDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdRefundDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(r.count())
                .from(r)
                .where(where)
                .fetchOne();

        OdRefundDto.PageResponse res = new OdRefundDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 목록/페이지/단건 공용 base query */
    private JPAQuery<OdRefundDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdRefundDto.Item.class,
                        r.refundId, r.siteId, r.orderId, r.claimId,
                        r.refundTypeCd,
                        r.refundProdAmt, r.refundCouponAmt, r.refundShipAmt,
                        r.refundSaveAmt, r.refundCacheAmt, r.totalRefundAmt,
                        r.refundStatusCd, r.refundStatusCdBefore,
                        r.refundReqDate, r.refundCompltDate,
                        r.faultTypeCd, r.refundReason, r.memo,
                        r.regBy, r.regDate, r.updBy, r.updDate
                ))
                .from(r)
                .leftJoin(ste).on(ste.siteId.eq(r.siteId))
                .leftJoin(ord).on(ord.orderId.eq(r.orderId))
                .leftJoin(cla).on(cla.claimId.eq(r.claimId))
                .leftJoin(cdRt).on(cdRt.codeGrp.eq("REFUND_TYPE").and(cdRt.codeValue.eq(r.refundTypeCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("REFUND_STATUS").and(cdRs.codeValue.eq(r.refundStatusCd)))
                .leftJoin(cdCf).on(cdCf.codeGrp.eq("CLAIM_FAULT").and(cdCf.codeValue.eq(r.faultTypeCd)));
    }

    private BooleanBuilder buildCondition(OdRefundDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))   w.and(r.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getRefundId())) w.and(r.refundId.eq(s.getRefundId()));

        // dateType + dateStart + dateEnd
        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(r.regDate.goe(start)).and(r.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(r.updDate.goe(start)).and(r.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
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
            orders.add(new OrderSpecifier(Order.DESC, r.regDate));
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
                    orders.add(new OrderSpecifier(order, r.refundId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(OdRefund entity) {
        if (entity.getRefundId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(r);
        boolean hasAny = false;

        if (entity.getSiteId()               != null) { update.set(r.siteId,               entity.getSiteId());               hasAny = true; }
        if (entity.getOrderId()              != null) { update.set(r.orderId,              entity.getOrderId());              hasAny = true; }
        if (entity.getClaimId()              != null) { update.set(r.claimId,              entity.getClaimId());              hasAny = true; }
        if (entity.getRefundTypeCd()         != null) { update.set(r.refundTypeCd,         entity.getRefundTypeCd());         hasAny = true; }
        if (entity.getRefundProdAmt()        != null) { update.set(r.refundProdAmt,        entity.getRefundProdAmt());        hasAny = true; }
        if (entity.getRefundCouponAmt()      != null) { update.set(r.refundCouponAmt,      entity.getRefundCouponAmt());      hasAny = true; }
        if (entity.getRefundShipAmt()        != null) { update.set(r.refundShipAmt,        entity.getRefundShipAmt());        hasAny = true; }
        if (entity.getRefundSaveAmt()        != null) { update.set(r.refundSaveAmt,        entity.getRefundSaveAmt());        hasAny = true; }
        if (entity.getRefundCacheAmt()       != null) { update.set(r.refundCacheAmt,       entity.getRefundCacheAmt());       hasAny = true; }
        if (entity.getTotalRefundAmt()       != null) { update.set(r.totalRefundAmt,       entity.getTotalRefundAmt());       hasAny = true; }
        if (entity.getRefundStatusCd()       != null) { update.set(r.refundStatusCd,       entity.getRefundStatusCd());       hasAny = true; }
        if (entity.getRefundStatusCdBefore() != null) { update.set(r.refundStatusCdBefore, entity.getRefundStatusCdBefore()); hasAny = true; }
        if (entity.getRefundReqDate()        != null) { update.set(r.refundReqDate,        entity.getRefundReqDate());        hasAny = true; }
        if (entity.getRefundCompltDate()     != null) { update.set(r.refundCompltDate,     entity.getRefundCompltDate());     hasAny = true; }
        if (entity.getFaultTypeCd()          != null) { update.set(r.faultTypeCd,          entity.getFaultTypeCd());          hasAny = true; }
        if (entity.getRefundReason()         != null) { update.set(r.refundReason,         entity.getRefundReason());         hasAny = true; }
        if (entity.getMemo()                 != null) { update.set(r.memo,                 entity.getMemo());                 hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(r.updBy,                entity.getUpdBy());                hasAny = true; }
        if (entity.getUpdDate()              != null) { update.set(r.updDate,              entity.getUpdDate());              hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(r.refundId.eq(entity.getRefundId())).execute();
        return (int) affected;
    }
}
