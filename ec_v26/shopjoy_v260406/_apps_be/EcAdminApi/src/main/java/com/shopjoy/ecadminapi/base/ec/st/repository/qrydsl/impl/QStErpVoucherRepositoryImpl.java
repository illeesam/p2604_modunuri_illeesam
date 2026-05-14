package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StErpVoucherDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStErpVoucher;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucher;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStErpVoucherRepository;
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

/** StErpVoucher QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStErpVoucherRepositoryImpl implements QStErpVoucherRepository {

    private final JPAQueryFactory queryFactory;
    private static final QStErpVoucher v    = QStErpVoucher.stErpVoucher;
    private static final QSySite       ste  = QSySite.sySite;
    private static final QSyVendor     vnd  = QSyVendor.syVendor;
    private static final QSyCode       cdEvt = new QSyCode("cd_evt");
    private static final QSyCode       cdEvs = new QSyCode("cd_evs");

    @Override
    public Optional<StErpVoucherDto.Item> selectById(String id) {
        StErpVoucherDto.Item dto = baseListQuery()
                .where(v.erpVoucherId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<StErpVoucherDto.Item> selectList(StErpVoucherDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StErpVoucherDto.Item> query = baseListQuery().where(where);
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
    public StErpVoucherDto.PageResponse selectPageList(StErpVoucherDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StErpVoucherDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StErpVoucherDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(v.count())
                .from(v)
                .where(where)
                .fetchOne();

        StErpVoucherDto.PageResponse res = new StErpVoucherDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<StErpVoucherDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StErpVoucherDto.Item.class,
                        v.erpVoucherId, v.siteId, v.vendorId, v.settleId, v.settleYm,
                        v.erpVoucherTypeCd, v.erpVoucherStatusCd, v.erpVoucherStatusCdBefore,
                        v.voucherDate, v.erpVoucherDesc,
                        v.totalDebitAmt, v.totalCreditAmt,
                        v.erpSendDate, v.erpVoucherNo, v.erpResMsg,
                        v.regBy, v.regDate, v.updBy, v.updDate,
                        ste.siteNm.as("siteNm"),
                        vnd.vendorNm.as("vendorNm"),
                        cdEvt.codeLabel.as("erpVoucherTypeCdNm"),
                        cdEvs.codeLabel.as("erpVoucherStatusCdNm")
                ))
                .from(v)
                .leftJoin(ste).on(ste.siteId.eq(v.siteId))
                .leftJoin(vnd).on(vnd.vendorId.eq(v.vendorId))
                .leftJoin(cdEvt).on(cdEvt.codeGrp.eq("ERP_VOUCHER_TYPE").and(cdEvt.codeValue.eq(v.erpVoucherTypeCd)))
                .leftJoin(cdEvs).on(cdEvs.codeGrp.eq("ERP_VOUCHER_STATUS").and(cdEvs.codeValue.eq(v.erpVoucherStatusCd)));
    }

    private BooleanBuilder buildCondition(StErpVoucherDto.Request c) {
        BooleanBuilder w = new BooleanBuilder();
        if (c == null) return w;

        if (StringUtils.hasText(c.getSiteId()))       w.and(v.siteId.eq(c.getSiteId()));
        if (StringUtils.hasText(c.getErpVoucherId())) w.and(v.erpVoucherId.eq(c.getErpVoucherId()));

        if (StringUtils.hasText(c.getDateType())
                && StringUtils.hasText(c.getDateStart())
                && StringUtils.hasText(c.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(c.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(c.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (c.getDateType()) {
                case "reg_date":
                    w.and(v.regDate.goe(start)).and(v.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(v.updDate.goe(start)).and(v.updDate.lt(endExcl)); break;
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
    private List<OrderSpecifier<?>> buildOrder(StErpVoucherDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = c == null ? null : c.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, v.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("erpVoucherId".equals(field)) {
                    orders.add(new OrderSpecifier(order, v.erpVoucherId));
                } else if ("settleYm".equals(field)) {
                    orders.add(new OrderSpecifier(order, v.settleYm));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(StErpVoucher entity) {
        if (entity.getErpVoucherId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(v);
        boolean hasAny = false;

        if (entity.getSiteId()                   != null) { update.set(v.siteId,                   entity.getSiteId());                   hasAny = true; }
        if (entity.getVendorId()                 != null) { update.set(v.vendorId,                 entity.getVendorId());                 hasAny = true; }
        if (entity.getSettleId()                 != null) { update.set(v.settleId,                 entity.getSettleId());                 hasAny = true; }
        if (entity.getSettleYm()                 != null) { update.set(v.settleYm,                 entity.getSettleYm());                 hasAny = true; }
        if (entity.getErpVoucherTypeCd()         != null) { update.set(v.erpVoucherTypeCd,         entity.getErpVoucherTypeCd());         hasAny = true; }
        if (entity.getErpVoucherStatusCd()       != null) { update.set(v.erpVoucherStatusCd,       entity.getErpVoucherStatusCd());       hasAny = true; }
        if (entity.getErpVoucherStatusCdBefore() != null) { update.set(v.erpVoucherStatusCdBefore, entity.getErpVoucherStatusCdBefore()); hasAny = true; }
        if (entity.getVoucherDate()              != null) { update.set(v.voucherDate,              entity.getVoucherDate());              hasAny = true; }
        if (entity.getErpVoucherDesc()           != null) { update.set(v.erpVoucherDesc,           entity.getErpVoucherDesc());           hasAny = true; }
        if (entity.getTotalDebitAmt()            != null) { update.set(v.totalDebitAmt,            entity.getTotalDebitAmt());            hasAny = true; }
        if (entity.getTotalCreditAmt()           != null) { update.set(v.totalCreditAmt,           entity.getTotalCreditAmt());           hasAny = true; }
        if (entity.getErpSendDate()              != null) { update.set(v.erpSendDate,              entity.getErpSendDate());              hasAny = true; }
        if (entity.getErpVoucherNo()             != null) { update.set(v.erpVoucherNo,             entity.getErpVoucherNo());             hasAny = true; }
        if (entity.getErpResMsg()                != null) { update.set(v.erpResMsg,                entity.getErpResMsg());                hasAny = true; }
        if (entity.getUpdBy()                    != null) { update.set(v.updBy,                    entity.getUpdBy());                    hasAny = true; }
        if (entity.getUpdDate()                  != null) { update.set(v.updDate,                  entity.getUpdDate());                  hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(v.erpVoucherId.eq(entity.getErpVoucherId())).execute();
        return (int) affected;
    }
}
