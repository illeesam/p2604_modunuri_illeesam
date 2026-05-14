package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettle;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettle;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** StSettle QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettleRepositoryImpl implements QStSettleRepository {

    private final JPAQueryFactory queryFactory;
    private static final QStSettle  s   = QStSettle.stSettle;
    private static final QSyVendor  vnd = QSyVendor.syVendor;
    private static final QSySite    ste = QSySite.sySite;
    private static final QSyCode    cdSs = new QSyCode("cd_ss");

    @Override
    public Optional<StSettleDto.Item> selectById(String id) {
        StSettleDto.Item dto = baseListQuery()
                .where(s.settleId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<StSettleDto.Item> selectList(StSettleDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleDto.Item> query = baseListQuery().where(where);
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
    public StSettleDto.PageResponse selectPageList(StSettleDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StSettleDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(s.count())
                .from(s)
                .where(where)
                .fetchOne();

        StSettleDto.PageResponse res = new StSettleDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<StSettleDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleDto.Item.class,
                        s.settleId, s.siteId, s.vendorId, s.settleYm,
                        s.settleStartDate, s.settleEndDate,
                        s.totalOrderAmt, s.totalReturnAmt, s.totalClaimCnt, s.totalDiscntAmt,
                        s.commissionRate, s.commissionAmt, s.settleAmt,
                        s.adjAmt, s.etcAdjAmt, s.finalSettleAmt,
                        s.settleStatusCd, s.settleStatusCdBefore, s.settleMemo,
                        s.regBy, s.regDate, s.updBy, s.updDate,
                        vnd.vendorNm.as("vendorNm"),
                        ste.siteNm.as("siteNm"),
                        cdSs.codeLabel.as("settleStatusCdNm")
                ))
                .from(s)
                .leftJoin(vnd).on(vnd.vendorId.eq(s.vendorId))
                .leftJoin(ste).on(ste.siteId.eq(s.siteId))
                .leftJoin(cdSs).on(cdSs.codeGrp.eq("SETTLE_STATUS").and(cdSs.codeValue.eq(s.settleStatusCd)));
    }

    private BooleanBuilder buildCondition(StSettleDto.Request c) {
        BooleanBuilder w = new BooleanBuilder();
        if (c == null) return w;

        if (StringUtils.hasText(c.getSiteId()))   w.and(s.siteId.eq(c.getSiteId()));
        if (StringUtils.hasText(c.getSettleId())) w.and(s.settleId.eq(c.getSettleId()));

        // dateType + dateStart + dateEnd
        if (StringUtils.hasText(c.getDateType())
                && StringUtils.hasText(c.getDateStart())
                && StringUtils.hasText(c.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(c.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(c.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (c.getDateType()) {
                case "reg_date":
                    w.and(s.regDate.goe(start)).and(s.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(s.updDate.goe(start)).and(s.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(StSettleDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = c == null ? null : c.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, s.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  s.settleId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, s.settleId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  s.settleYm)); break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, s.settleYm)); break;
            default:         orders.add(new OrderSpecifier(Order.DESC, s.regDate));  break;
        }
        return orders;
    }

    @Override
    public int updateSelective(StSettle entity) {
        if (entity.getSettleId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(s);
        boolean hasAny = false;

        if (entity.getSiteId()               != null) { update.set(s.siteId,               entity.getSiteId());               hasAny = true; }
        if (entity.getVendorId()             != null) { update.set(s.vendorId,             entity.getVendorId());             hasAny = true; }
        if (entity.getSettleYm()             != null) { update.set(s.settleYm,             entity.getSettleYm());             hasAny = true; }
        if (entity.getSettleStartDate()      != null) { update.set(s.settleStartDate,      entity.getSettleStartDate());      hasAny = true; }
        if (entity.getSettleEndDate()        != null) { update.set(s.settleEndDate,        entity.getSettleEndDate());        hasAny = true; }
        if (entity.getTotalOrderAmt()        != null) { update.set(s.totalOrderAmt,        entity.getTotalOrderAmt());        hasAny = true; }
        if (entity.getTotalReturnAmt()       != null) { update.set(s.totalReturnAmt,       entity.getTotalReturnAmt());       hasAny = true; }
        if (entity.getTotalClaimCnt()        != null) { update.set(s.totalClaimCnt,        entity.getTotalClaimCnt());        hasAny = true; }
        if (entity.getTotalDiscntAmt()       != null) { update.set(s.totalDiscntAmt,       entity.getTotalDiscntAmt());       hasAny = true; }
        if (entity.getCommissionRate()       != null) { update.set(s.commissionRate,       entity.getCommissionRate());       hasAny = true; }
        if (entity.getCommissionAmt()        != null) { update.set(s.commissionAmt,        entity.getCommissionAmt());        hasAny = true; }
        if (entity.getSettleAmt()            != null) { update.set(s.settleAmt,            entity.getSettleAmt());            hasAny = true; }
        if (entity.getAdjAmt()               != null) { update.set(s.adjAmt,               entity.getAdjAmt());               hasAny = true; }
        if (entity.getEtcAdjAmt()            != null) { update.set(s.etcAdjAmt,            entity.getEtcAdjAmt());            hasAny = true; }
        if (entity.getFinalSettleAmt()       != null) { update.set(s.finalSettleAmt,       entity.getFinalSettleAmt());       hasAny = true; }
        if (entity.getSettleStatusCd()       != null) { update.set(s.settleStatusCd,       entity.getSettleStatusCd());       hasAny = true; }
        if (entity.getSettleStatusCdBefore() != null) { update.set(s.settleStatusCdBefore, entity.getSettleStatusCdBefore()); hasAny = true; }
        if (entity.getSettleMemo()           != null) { update.set(s.settleMemo,           entity.getSettleMemo());           hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(s.updBy,                entity.getUpdBy());                hasAny = true; }
        if (entity.getUpdDate()              != null) { update.set(s.updDate,              entity.getUpdDate());              hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(s.settleId.eq(entity.getSettleId())).execute();
        return (int) affected;
    }
}
