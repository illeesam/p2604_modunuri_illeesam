package com.shopjoy.ecadminapi.base.ec.pm.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderItem;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveIssue;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmSaveIssue;
import com.shopjoy.ecadminapi.base.ec.pm.repository.QPmSaveIssueRepository;
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

/** PmSaveIssue QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmSaveIssueRepositoryImpl implements QPmSaveIssueRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPmSaveIssue i    = QPmSaveIssue.pmSaveIssue;
    private static final QSySite      ste  = QSySite.sySite;
    private static final QMbMember    mem  = QMbMember.mbMember;
    private static final QOdOrder     ord  = QOdOrder.odOrder;
    private static final QOdOrderItem ite  = QOdOrderItem.odOrderItem;
    private static final QPdProd      prd  = QPdProd.pdProd;
    private static final QSyCode      cdSit = new QSyCode("cd_sit");
    private static final QSyCode      cdSis = new QSyCode("cd_sis");

    private JPAQuery<PmSaveIssueDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmSaveIssueDto.Item.class,
                        i.saveIssueId, i.siteId, i.memberId, i.saveIssueTypeCd, i.saveAmt,
                        i.saveRate, i.refTypeCd, i.refId, i.orderId, i.orderItemId, i.prodId,
                        i.expireDate, i.issueStatusCd, i.issueStatusCdBefore, i.saveMemo,
                        i.regBy, i.regDate, i.updBy, i.updDate
                ))
                .from(i)
                .leftJoin(ste).on(ste.siteId.eq(i.siteId))
                .leftJoin(mem).on(mem.memberId.eq(i.memberId))
                .leftJoin(ord).on(ord.orderId.eq(i.orderId))
                .leftJoin(ite).on(ite.orderItemId.eq(i.orderItemId))
                .leftJoin(prd).on(prd.prodId.eq(i.prodId))
                .leftJoin(cdSit).on(cdSit.codeGrp.eq("SAVE_ISSUE_TYPE").and(cdSit.codeValue.eq(i.saveIssueTypeCd)))
                .leftJoin(cdSis).on(cdSis.codeGrp.eq("SAVE_ISSUE_STATUS").and(cdSis.codeValue.eq(i.issueStatusCd)));
    }

    @Override
    public Optional<PmSaveIssueDto.Item> selectById(String saveIssueId) {
        PmSaveIssueDto.Item dto = baseQuery()
                .where(i.saveIssueId.eq(saveIssueId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PmSaveIssueDto.Item> selectList(PmSaveIssueDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmSaveIssueDto.Item> query = baseQuery().where(where);
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
    public PmSaveIssueDto.PageResponse selectPageList(PmSaveIssueDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmSaveIssueDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmSaveIssueDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(i.count())
                .from(i)
                .where(where)
                .fetchOne();

        PmSaveIssueDto.PageResponse res = new PmSaveIssueDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(PmSaveIssueDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))      w.and(i.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getSaveIssueId())) w.and(i.saveIssueId.eq(s.getSaveIssueId()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
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
    private List<OrderSpecifier<?>> buildOrder(PmSaveIssueDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, i.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  i.saveIssueId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, i.saveIssueId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  i.regDate));     break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, i.regDate));     break;
            default:         orders.add(new OrderSpecifier(Order.DESC, i.regDate));     break;
        }
        return orders;
    }

    @Override
    public int updateSelective(PmSaveIssue entity) {
        if (entity.getSaveIssueId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getSiteId()              != null) { update.set(i.siteId,              entity.getSiteId());              hasAny = true; }
        if (entity.getMemberId()            != null) { update.set(i.memberId,            entity.getMemberId());            hasAny = true; }
        if (entity.getSaveIssueTypeCd()     != null) { update.set(i.saveIssueTypeCd,     entity.getSaveIssueTypeCd());     hasAny = true; }
        if (entity.getSaveAmt()             != null) { update.set(i.saveAmt,             entity.getSaveAmt());             hasAny = true; }
        if (entity.getSaveRate()            != null) { update.set(i.saveRate,            entity.getSaveRate());            hasAny = true; }
        if (entity.getRefTypeCd()           != null) { update.set(i.refTypeCd,           entity.getRefTypeCd());           hasAny = true; }
        if (entity.getRefId()               != null) { update.set(i.refId,               entity.getRefId());               hasAny = true; }
        if (entity.getOrderId()             != null) { update.set(i.orderId,             entity.getOrderId());             hasAny = true; }
        if (entity.getOrderItemId()         != null) { update.set(i.orderItemId,         entity.getOrderItemId());         hasAny = true; }
        if (entity.getProdId()              != null) { update.set(i.prodId,              entity.getProdId());              hasAny = true; }
        if (entity.getExpireDate()          != null) { update.set(i.expireDate,          entity.getExpireDate());          hasAny = true; }
        if (entity.getIssueStatusCd()       != null) { update.set(i.issueStatusCd,       entity.getIssueStatusCd());       hasAny = true; }
        if (entity.getIssueStatusCdBefore() != null) { update.set(i.issueStatusCdBefore, entity.getIssueStatusCdBefore()); hasAny = true; }
        if (entity.getSaveMemo()            != null) { update.set(i.saveMemo,            entity.getSaveMemo());            hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(i.updBy,               entity.getUpdBy());               hasAny = true; }
        if (entity.getUpdDate()             != null) { update.set(i.updDate,             entity.getUpdDate());             hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(i.saveIssueId.eq(entity.getSaveIssueId())).execute();
        return (int) affected;
    }
}
