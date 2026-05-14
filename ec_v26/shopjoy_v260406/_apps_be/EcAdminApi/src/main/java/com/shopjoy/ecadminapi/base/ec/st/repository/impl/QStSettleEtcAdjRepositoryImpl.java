package com.shopjoy.ecadminapi.base.ec.st.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleEtcAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleEtcAdj;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleEtcAdj;
import com.shopjoy.ecadminapi.base.ec.st.repository.QStSettleEtcAdjRepository;
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

/** StSettleEtcAdj QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettleEtcAdjRepositoryImpl implements QStSettleEtcAdjRepository {

    private final JPAQueryFactory queryFactory;
    private static final QStSettleEtcAdj a     = QStSettleEtcAdj.stSettleEtcAdj;
    private static final QSySite         ste   = QSySite.sySite;
    private static final QSyCode         cdSeat = new QSyCode("cd_seat");
    private static final QSyCode         cdAd   = new QSyCode("cd_ad");

    @Override
    public Optional<StSettleEtcAdjDto.Item> selectById(String id) {
        StSettleEtcAdjDto.Item dto = baseListQuery()
                .where(a.settleEtcAdjId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<StSettleEtcAdjDto.Item> selectList(StSettleEtcAdjDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleEtcAdjDto.Item> query = baseListQuery().where(where);
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
    public StSettleEtcAdjDto.PageResponse selectPageList(StSettleEtcAdjDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleEtcAdjDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StSettleEtcAdjDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .where(where)
                .fetchOne();

        StSettleEtcAdjDto.PageResponse res = new StSettleEtcAdjDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<StSettleEtcAdjDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleEtcAdjDto.Item.class,
                        a.settleEtcAdjId, a.settleId, a.siteId,
                        a.etcAdjTypeCd, a.etcAdjDirCd, a.etcAdjAmt,
                        a.etcAdjReason, a.settleEtcAdjMemo,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        ste.siteNm.as("siteNm"),
                        cdSeat.codeLabel.as("etcAdjTypeCdNm"),
                        cdAd.codeLabel.as("etcAdjDirCdNm")
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId))
                .leftJoin(cdSeat).on(cdSeat.codeGrp.eq("SETTLE_ETC_ADJ_TYPE").and(cdSeat.codeValue.eq(a.etcAdjTypeCd)))
                .leftJoin(cdAd).on(cdAd.codeGrp.eq("ADJ_DIR").and(cdAd.codeValue.eq(a.etcAdjDirCd)));
    }

    private BooleanBuilder buildCondition(StSettleEtcAdjDto.Request c) {
        BooleanBuilder w = new BooleanBuilder();
        if (c == null) return w;

        if (StringUtils.hasText(c.getSiteId()))         w.and(a.siteId.eq(c.getSiteId()));
        if (StringUtils.hasText(c.getSettleEtcAdjId())) w.and(a.settleEtcAdjId.eq(c.getSettleEtcAdjId()));

        if (StringUtils.hasText(c.getDateType())
                && StringUtils.hasText(c.getDateStart())
                && StringUtils.hasText(c.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(c.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(c.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (c.getDateType()) {
                case "reg_date":
                    w.and(a.regDate.goe(start)).and(a.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(a.updDate.goe(start)).and(a.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(StSettleEtcAdjDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = c == null ? null : c.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  a.settleEtcAdjId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, a.settleEtcAdjId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  a.regDate));        break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, a.regDate));        break;
            default:         orders.add(new OrderSpecifier(Order.DESC, a.regDate));        break;
        }
        return orders;
    }

    @Override
    public int updateSelective(StSettleEtcAdj entity) {
        if (entity.getSettleEtcAdjId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSettleId()         != null) { update.set(a.settleId,         entity.getSettleId());         hasAny = true; }
        if (entity.getSiteId()           != null) { update.set(a.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getEtcAdjTypeCd()     != null) { update.set(a.etcAdjTypeCd,     entity.getEtcAdjTypeCd());     hasAny = true; }
        if (entity.getEtcAdjDirCd()      != null) { update.set(a.etcAdjDirCd,      entity.getEtcAdjDirCd());      hasAny = true; }
        if (entity.getEtcAdjAmt()        != null) { update.set(a.etcAdjAmt,        entity.getEtcAdjAmt());        hasAny = true; }
        if (entity.getEtcAdjReason()     != null) { update.set(a.etcAdjReason,     entity.getEtcAdjReason());     hasAny = true; }
        if (entity.getSettleEtcAdjMemo() != null) { update.set(a.settleEtcAdjMemo, entity.getSettleEtcAdjMemo()); hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(a.updBy,            entity.getUpdBy());            hasAny = true; }
        if (entity.getUpdDate()          != null) { update.set(a.updDate,          entity.getUpdDate());          hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(a.settleEtcAdjId.eq(entity.getSettleEtcAdjId())).execute();
        return (int) affected;
    }
}
