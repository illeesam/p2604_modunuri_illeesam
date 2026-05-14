package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucherIssue;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmVoucher;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmVoucherIssue;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmVoucherIssueRepository;
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

/** PmVoucherIssue QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmVoucherIssueRepositoryImpl implements QPmVoucherIssueRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPmVoucherIssue i    = QPmVoucherIssue.pmVoucherIssue;
    private static final QPmVoucher      vou  = QPmVoucher.pmVoucher;
    private static final QOdOrder        ord  = QOdOrder.odOrder;
    private static final QSySite         ste  = QSySite.sySite;
    private static final QSyCode         cdVis = new QSyCode("cd_vis");

    private JPAQuery<PmVoucherIssueDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmVoucherIssueDto.Item.class,
                        i.voucherIssueId, i.voucherId, i.siteId, i.memberId, i.voucherCode,
                        i.issueDate, i.expireDate, i.useDate, i.orderId, i.useAmt,
                        i.voucherIssueStatusCd, i.voucherIssueStatusCdBefore,
                        i.regBy, i.regDate, i.updBy, i.updDate
                ))
                .from(i)
                .leftJoin(vou).on(vou.voucherId.eq(i.voucherId))
                .leftJoin(ord).on(ord.orderId.eq(i.orderId))
                .leftJoin(ste).on(ste.siteId.eq(i.siteId))
                .leftJoin(cdVis).on(cdVis.codeGrp.eq("VOUCHER_ISSUE_STATUS").and(cdVis.codeValue.eq(i.voucherIssueStatusCd)));
    }

    @Override
    public Optional<PmVoucherIssueDto.Item> selectById(String voucherIssueId) {
        PmVoucherIssueDto.Item dto = baseQuery()
                .where(i.voucherIssueId.eq(voucherIssueId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PmVoucherIssueDto.Item> selectList(PmVoucherIssueDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmVoucherIssueDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public PmVoucherIssueDto.PageResponse selectPageList(PmVoucherIssueDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmVoucherIssueDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmVoucherIssueDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(i.count())
                .from(i)
                .where(where)
                .fetchOne();

        PmVoucherIssueDto.PageResponse res = new PmVoucherIssueDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(PmVoucherIssueDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))         w.and(i.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getVoucherIssueId())) w.and(i.voucherIssueId.eq(s.getVoucherIssueId()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "issue_date":
                    w.and(i.issueDate.goe(start)).and(i.issueDate.lt(endExcl));
                    break;
                case "reg_date":
                    w.and(i.regDate.goe(start)).and(i.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(i.updDate.goe(start)).and(i.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmVoucherIssueDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, i.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  i.voucherIssueId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, i.voucherIssueId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  i.issueDate));      break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, i.issueDate));      break;
            default:         orders.add(new OrderSpecifier(Order.DESC, i.regDate));        break;
        }
        return orders;
    }

    @Override
    public int updateSelective(PmVoucherIssue entity) {
        if (entity.getVoucherIssueId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getVoucherId()                  != null) { update.set(i.voucherId,                  entity.getVoucherId());                  hasAny = true; }
        if (entity.getSiteId()                     != null) { update.set(i.siteId,                     entity.getSiteId());                     hasAny = true; }
        if (entity.getMemberId()                   != null) { update.set(i.memberId,                   entity.getMemberId());                   hasAny = true; }
        if (entity.getVoucherCode()                != null) { update.set(i.voucherCode,                entity.getVoucherCode());                hasAny = true; }
        if (entity.getIssueDate()                  != null) { update.set(i.issueDate,                  entity.getIssueDate());                  hasAny = true; }
        if (entity.getExpireDate()                 != null) { update.set(i.expireDate,                 entity.getExpireDate());                 hasAny = true; }
        if (entity.getUseDate()                    != null) { update.set(i.useDate,                    entity.getUseDate());                    hasAny = true; }
        if (entity.getOrderId()                    != null) { update.set(i.orderId,                    entity.getOrderId());                    hasAny = true; }
        if (entity.getUseAmt()                     != null) { update.set(i.useAmt,                     entity.getUseAmt());                     hasAny = true; }
        if (entity.getVoucherIssueStatusCd()       != null) { update.set(i.voucherIssueStatusCd,       entity.getVoucherIssueStatusCd());       hasAny = true; }
        if (entity.getVoucherIssueStatusCdBefore() != null) { update.set(i.voucherIssueStatusCdBefore, entity.getVoucherIssueStatusCdBefore()); hasAny = true; }
        if (entity.getUpdBy()                      != null) { update.set(i.updBy,                      entity.getUpdBy());                      hasAny = true; }
        if (entity.getUpdDate()                    != null) { update.set(i.updDate,                    entity.getUpdDate());                    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(i.voucherIssueId.eq(entity.getVoucherIssueId())).execute();
        return (int) affected;
    }
}
