package com.shopjoy.ecadminapi.base.ec.st.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettlePayDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettlePay;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettlePay;
import com.shopjoy.ecadminapi.base.ec.st.repository.QStSettlePayRepository;
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

/** StSettlePay QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettlePayRepositoryImpl implements QStSettlePayRepository {

    private final JPAQueryFactory queryFactory;
    private static final QStSettlePay p     = QStSettlePay.stSettlePay;
    private static final QSyVendor    vnd   = QSyVendor.syVendor;
    private static final QSySite      ste   = QSySite.sySite;
    private static final QSyCode      cdPmc = new QSyCode("cd_pmc");
    private static final QSyCode      cdSps = new QSyCode("cd_sps");

    @Override
    public Optional<StSettlePayDto.Item> selectById(String id) {
        StSettlePayDto.Item dto = baseListQuery()
                .where(p.settlePayId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<StSettlePayDto.Item> selectList(StSettlePayDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettlePayDto.Item> query = baseListQuery().where(where);
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
    public StSettlePayDto.PageResponse selectPageList(StSettlePayDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettlePayDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StSettlePayDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(p.count())
                .from(p)
                .where(where)
                .fetchOne();

        StSettlePayDto.PageResponse res = new StSettlePayDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<StSettlePayDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettlePayDto.Item.class,
                        p.settlePayId, p.settleId, p.siteId, p.vendorId,
                        p.payAmt, p.payMethodCd, p.bankNm, p.bankAccount, p.bankHolder,
                        p.payStatusCd, p.payStatusCdBefore, p.payDate, p.payBy, p.settlePayMemo,
                        p.regBy, p.regDate, p.updBy, p.updDate,
                        vnd.vendorNm.as("vendorNm"),
                        ste.siteNm.as("siteNm"),
                        cdPmc.codeLabel.as("payMethodCdNm"),
                        cdSps.codeLabel.as("payStatusCdNm")
                ))
                .from(p)
                .leftJoin(vnd).on(vnd.vendorId.eq(p.vendorId))
                .leftJoin(ste).on(ste.siteId.eq(p.siteId))
                .leftJoin(cdPmc).on(cdPmc.codeGrp.eq("PAY_METHOD_CD").and(cdPmc.codeValue.eq(p.payMethodCd)))
                .leftJoin(cdSps).on(cdSps.codeGrp.eq("SETTLE_PAY_STATUS").and(cdSps.codeValue.eq(p.payStatusCd)));
    }

    private BooleanBuilder buildCondition(StSettlePayDto.Request c) {
        BooleanBuilder w = new BooleanBuilder();
        if (c == null) return w;

        if (StringUtils.hasText(c.getSiteId()))      w.and(p.siteId.eq(c.getSiteId()));
        if (StringUtils.hasText(c.getSettlePayId())) w.and(p.settlePayId.eq(c.getSettlePayId()));

        // searchValue / searchTypes — def_bank_nm
        if (StringUtils.hasText(c.getSearchValue())) {
            String types = c.getSearchTypes();
            BooleanBuilder or = new BooleanBuilder();
            if (!StringUtils.hasText(types) || types.contains("def_bank_nm")) {
                or.or(p.bankNm.containsIgnoreCase(c.getSearchValue()));
            }
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(c.getDateType())
                && StringUtils.hasText(c.getDateStart())
                && StringUtils.hasText(c.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(c.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(c.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (c.getDateType()) {
                case "reg_date":
                    w.and(p.regDate.goe(start)).and(p.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(p.updDate.goe(start)).and(p.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(StSettlePayDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = c == null ? null : c.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, p.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  p.settlePayId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, p.settlePayId)); break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  p.bankNm));      break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, p.bankNm));      break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  p.regDate));     break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, p.regDate));     break;
            default:         orders.add(new OrderSpecifier(Order.DESC, p.regDate));     break;
        }
        return orders;
    }

    @Override
    public int updateSelective(StSettlePay entity) {
        if (entity.getSettlePayId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(p);
        boolean hasAny = false;

        if (entity.getSettleId()         != null) { update.set(p.settleId,         entity.getSettleId());         hasAny = true; }
        if (entity.getSiteId()           != null) { update.set(p.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getVendorId()         != null) { update.set(p.vendorId,         entity.getVendorId());         hasAny = true; }
        if (entity.getPayAmt()           != null) { update.set(p.payAmt,           entity.getPayAmt());           hasAny = true; }
        if (entity.getPayMethodCd()      != null) { update.set(p.payMethodCd,      entity.getPayMethodCd());      hasAny = true; }
        if (entity.getBankNm()           != null) { update.set(p.bankNm,           entity.getBankNm());           hasAny = true; }
        if (entity.getBankAccount()      != null) { update.set(p.bankAccount,      entity.getBankAccount());      hasAny = true; }
        if (entity.getBankHolder()       != null) { update.set(p.bankHolder,       entity.getBankHolder());       hasAny = true; }
        if (entity.getPayStatusCd()      != null) { update.set(p.payStatusCd,      entity.getPayStatusCd());      hasAny = true; }
        if (entity.getPayStatusCdBefore()!= null) { update.set(p.payStatusCdBefore,entity.getPayStatusCdBefore());hasAny = true; }
        if (entity.getPayDate()          != null) { update.set(p.payDate,          entity.getPayDate());          hasAny = true; }
        if (entity.getPayBy()            != null) { update.set(p.payBy,            entity.getPayBy());            hasAny = true; }
        if (entity.getSettlePayMemo()    != null) { update.set(p.settlePayMemo,    entity.getSettlePayMemo());    hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(p.updBy,            entity.getUpdBy());            hasAny = true; }
        if (entity.getUpdDate()          != null) { update.set(p.updDate,          entity.getUpdDate());          hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(p.settlePayId.eq(entity.getSettlePayId())).execute();
        return (int) affected;
    }
}
