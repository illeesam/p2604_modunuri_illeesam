package com.shopjoy.ecadminapi.base.ec.st.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StReconDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStRecon;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleRaw;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StRecon;
import com.shopjoy.ecadminapi.base.ec.st.repository.QStReconRepository;
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

/** StRecon QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStReconRepositoryImpl implements QStReconRepository {

    private final JPAQueryFactory queryFactory;
    private static final QStRecon     r    = QStRecon.stRecon;
    private static final QSySite      ste  = QSySite.sySite;
    private static final QSyVendor    vnd  = QSyVendor.syVendor;
    private static final QStSettleRaw raw  = QStSettleRaw.stSettleRaw;
    private static final QSyCode      cdRt = new QSyCode("cd_rt");
    private static final QSyCode      cdRs = new QSyCode("cd_rs");

    @Override
    public Optional<StReconDto.Item> selectById(String id) {
        StReconDto.Item dto = baseListQuery()
                .where(r.reconId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<StReconDto.Item> selectList(StReconDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StReconDto.Item> query = baseListQuery().where(where);
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
    public StReconDto.PageResponse selectPageList(StReconDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StReconDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StReconDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(r.count())
                .from(r)
                .where(where)
                .fetchOne();

        StReconDto.PageResponse res = new StReconDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<StReconDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StReconDto.Item.class,
                        r.reconId, r.siteId, r.vendorId, r.reconTypeCd,
                        r.reconStatusCd, r.reconStatusCdBefore, r.settleId, r.settleRawId,
                        r.refId, r.refNo, r.settlePeriod,
                        r.expectedAmt, r.actualAmt, r.diffAmt, r.reconNote,
                        r.resolvedBy, r.resolvedDate,
                        r.regBy, r.regDate, r.updBy, r.updDate,
                        ste.siteNm.as("siteNm"),
                        vnd.vendorNm.as("vendorNm"),
                        raw.prodNm.as("settleRawNm"),
                        cdRt.codeLabel.as("reconTypeCdNm"),
                        cdRs.codeLabel.as("reconStatusCdNm")
                ))
                .from(r)
                .leftJoin(ste).on(ste.siteId.eq(r.siteId))
                .leftJoin(vnd).on(vnd.vendorId.eq(r.vendorId))
                .leftJoin(raw).on(raw.settleRawId.eq(r.settleRawId))
                .leftJoin(cdRt).on(cdRt.codeGrp.eq("RECON_TYPE").and(cdRt.codeValue.eq(r.reconTypeCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("RECON_STATUS").and(cdRs.codeValue.eq(r.reconStatusCd)));
    }

    private BooleanBuilder buildCondition(StReconDto.Request c) {
        BooleanBuilder w = new BooleanBuilder();
        if (c == null) return w;

        if (StringUtils.hasText(c.getSiteId()))  w.and(r.siteId.eq(c.getSiteId()));
        if (StringUtils.hasText(c.getReconId())) w.and(r.reconId.eq(c.getReconId()));

        if (StringUtils.hasText(c.getDateType())
                && StringUtils.hasText(c.getDateStart())
                && StringUtils.hasText(c.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(c.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(c.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (c.getDateType()) {
                case "reg_date":
                    w.and(r.regDate.goe(start)).and(r.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(r.updDate.goe(start)).and(r.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(StReconDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = c == null ? null : c.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, r.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  r.reconId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, r.reconId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  r.regDate)); break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, r.regDate)); break;
            default:         orders.add(new OrderSpecifier(Order.DESC, r.regDate)); break;
        }
        return orders;
    }

    @Override
    public int updateSelective(StRecon entity) {
        if (entity.getReconId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(r);
        boolean hasAny = false;

        if (entity.getSiteId()              != null) { update.set(r.siteId,              entity.getSiteId());              hasAny = true; }
        if (entity.getVendorId()            != null) { update.set(r.vendorId,            entity.getVendorId());            hasAny = true; }
        if (entity.getReconTypeCd()         != null) { update.set(r.reconTypeCd,         entity.getReconTypeCd());         hasAny = true; }
        if (entity.getReconStatusCd()       != null) { update.set(r.reconStatusCd,       entity.getReconStatusCd());       hasAny = true; }
        if (entity.getReconStatusCdBefore() != null) { update.set(r.reconStatusCdBefore, entity.getReconStatusCdBefore()); hasAny = true; }
        if (entity.getSettleId()            != null) { update.set(r.settleId,            entity.getSettleId());            hasAny = true; }
        if (entity.getSettleRawId()         != null) { update.set(r.settleRawId,         entity.getSettleRawId());         hasAny = true; }
        if (entity.getRefId()               != null) { update.set(r.refId,               entity.getRefId());               hasAny = true; }
        if (entity.getRefNo()               != null) { update.set(r.refNo,               entity.getRefNo());               hasAny = true; }
        if (entity.getSettlePeriod()        != null) { update.set(r.settlePeriod,        entity.getSettlePeriod());        hasAny = true; }
        if (entity.getExpectedAmt()         != null) { update.set(r.expectedAmt,         entity.getExpectedAmt());         hasAny = true; }
        if (entity.getActualAmt()           != null) { update.set(r.actualAmt,           entity.getActualAmt());           hasAny = true; }
        if (entity.getDiffAmt()             != null) { update.set(r.diffAmt,             entity.getDiffAmt());             hasAny = true; }
        if (entity.getReconNote()           != null) { update.set(r.reconNote,           entity.getReconNote());           hasAny = true; }
        if (entity.getResolvedBy()          != null) { update.set(r.resolvedBy,          entity.getResolvedBy());          hasAny = true; }
        if (entity.getResolvedDate()        != null) { update.set(r.resolvedDate,        entity.getResolvedDate());        hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(r.updBy,               entity.getUpdBy());               hasAny = true; }
        if (entity.getUpdDate()             != null) { update.set(r.updDate,             entity.getUpdDate());             hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(r.reconId.eq(entity.getReconId())).execute();
        return (int) affected;
    }
}
