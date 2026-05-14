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
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftIssue;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGift;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGiftIssue;
import com.shopjoy.ecadminapi.base.ec.pm.repository.QPmGiftIssueRepository;
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

/** PmGiftIssue QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmGiftIssueRepositoryImpl implements QPmGiftIssueRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPmGiftIssue i    = QPmGiftIssue.pmGiftIssue;
    private static final QPmGift      gif  = QPmGift.pmGift;
    private static final QMbMember    mem  = QMbMember.mbMember;
    private static final QOdOrder     ord  = QOdOrder.odOrder;
    private static final QSySite      ste  = QSySite.sySite;
    private static final QSyCode      cdGis = new QSyCode("cd_gis");

    private JPAQuery<PmGiftIssueDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmGiftIssueDto.Item.class,
                        i.giftIssueId, i.giftId, i.siteId, i.memberId, i.orderId,
                        i.issueDate, i.giftIssueStatusCd, i.giftIssueStatusCdBefore,
                        i.giftIssueMemo, i.regBy, i.regDate, i.updBy, i.updDate
                ))
                .from(i)
                .leftJoin(gif).on(gif.giftId.eq(i.giftId))
                .leftJoin(mem).on(mem.memberId.eq(i.memberId))
                .leftJoin(ord).on(ord.orderId.eq(i.orderId))
                .leftJoin(ste).on(ste.siteId.eq(i.siteId))
                .leftJoin(cdGis).on(cdGis.codeGrp.eq("GIFT_ISSUE_STATUS").and(cdGis.codeValue.eq(i.giftIssueStatusCd)));
    }

    @Override
    public Optional<PmGiftIssueDto.Item> selectById(String giftIssueId) {
        PmGiftIssueDto.Item dto = baseQuery()
                .where(i.giftIssueId.eq(giftIssueId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PmGiftIssueDto.Item> selectList(PmGiftIssueDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmGiftIssueDto.Item> query = baseQuery().where(where);
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
    public PmGiftIssueDto.PageResponse selectPageList(PmGiftIssueDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmGiftIssueDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmGiftIssueDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(i.count())
                .from(i)
                .where(where)
                .fetchOne();

        PmGiftIssueDto.PageResponse res = new PmGiftIssueDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(PmGiftIssueDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))      w.and(i.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getGiftIssueId())) w.and(i.giftIssueId.eq(s.getGiftIssueId()));

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
    private List<OrderSpecifier<?>> buildOrder(PmGiftIssueDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, i.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  i.giftIssueId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, i.giftIssueId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  i.issueDate));   break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, i.issueDate));   break;
            default:         orders.add(new OrderSpecifier(Order.DESC, i.regDate));     break;
        }
        return orders;
    }

    @Override
    public int updateSelective(PmGiftIssue entity) {
        if (entity.getGiftIssueId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getGiftId()                 != null) { update.set(i.giftId,                 entity.getGiftId());                 hasAny = true; }
        if (entity.getSiteId()                 != null) { update.set(i.siteId,                 entity.getSiteId());                 hasAny = true; }
        if (entity.getMemberId()               != null) { update.set(i.memberId,               entity.getMemberId());               hasAny = true; }
        if (entity.getOrderId()                != null) { update.set(i.orderId,                entity.getOrderId());                hasAny = true; }
        if (entity.getIssueDate()              != null) { update.set(i.issueDate,              entity.getIssueDate());              hasAny = true; }
        if (entity.getGiftIssueStatusCd()      != null) { update.set(i.giftIssueStatusCd,      entity.getGiftIssueStatusCd());      hasAny = true; }
        if (entity.getGiftIssueStatusCdBefore()!= null) { update.set(i.giftIssueStatusCdBefore,entity.getGiftIssueStatusCdBefore());hasAny = true; }
        if (entity.getGiftIssueMemo()          != null) { update.set(i.giftIssueMemo,          entity.getGiftIssueMemo());          hasAny = true; }
        if (entity.getUpdBy()                  != null) { update.set(i.updBy,                  entity.getUpdBy());                  hasAny = true; }
        if (entity.getUpdDate()                != null) { update.set(i.updDate,                entity.getUpdDate());                hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(i.giftIssueId.eq(entity.getGiftIssueId())).execute();
        return (int) affected;
    }
}
