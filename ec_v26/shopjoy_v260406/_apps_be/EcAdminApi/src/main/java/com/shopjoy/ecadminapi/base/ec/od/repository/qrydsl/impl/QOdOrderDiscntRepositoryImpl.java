package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderDiscnt;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderDiscnt;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdOrderDiscntRepository;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCoupon;
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

/** OdOrderDiscnt QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdOrderDiscntRepositoryImpl implements QOdOrderDiscntRepository {

    private final JPAQueryFactory queryFactory;
    private static final QOdOrderDiscnt d   = QOdOrderDiscnt.odOrderDiscnt;
    private static final QSySite        ste = new QSySite("ste");
    private static final QOdOrder       ord = new QOdOrder("ord");
    private static final QPmCoupon      cpn = new QPmCoupon("cpn");
    private static final QSyCode        cdOdt = new QSyCode("cd_odt");

    /* 주문 할인 키조회 */
    @Override
    public Optional<OdOrderDiscntDto.Item> selectById(String orderDiscntId) {
        OdOrderDiscntDto.Item dto = baseListQuery()
                .where(d.orderDiscntId.eq(orderDiscntId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 주문 할인 목록조회 */
    @Override
    public List<OdOrderDiscntDto.Item> selectList(OdOrderDiscntDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderDiscntDto.Item> query = baseListQuery().where(where);
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

    /* 주문 할인 페이지조회 */
    @Override
    public OdOrderDiscntDto.PageResponse selectPageList(OdOrderDiscntDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderDiscntDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdOrderDiscntDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(d.count())
                .from(d)
                .where(where)
                .fetchOne();

        OdOrderDiscntDto.PageResponse res = new OdOrderDiscntDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 목록/페이지/단건 공용 base query */
    private JPAQuery<OdOrderDiscntDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdOrderDiscntDto.Item.class,
                        d.orderDiscntId, d.siteId, d.orderId,
                        d.discntTypeCd, d.couponId, d.couponIssueId,
                        d.discntRate, d.discntAmt, d.baseItemAmt,
                        d.restoreYn, d.restoreAmt, d.restoreDate,
                        d.regBy, d.regDate
                ))
                .from(d)
                .leftJoin(ste).on(ste.siteId.eq(d.siteId))
                .leftJoin(ord).on(ord.orderId.eq(d.orderId))
                .leftJoin(cpn).on(cpn.couponId.eq(d.couponId))
                .leftJoin(cdOdt).on(cdOdt.codeGrp.eq("ORDER_DISCNT_TYPE").and(cdOdt.codeValue.eq(d.discntTypeCd)));
    }

    /* 주문 할인 buildCondition */
    private BooleanBuilder buildCondition(OdOrderDiscntDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))        w.and(d.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getOrderDiscntId())) w.and(d.orderDiscntId.eq(s.getOrderDiscntId()));

        // dateType + dateStart + dateEnd
        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(d.regDate.goe(start)).and(d.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(d.updDate.goe(start)).and(d.updDate.lt(endExcl)); break;
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
    private List<OrderSpecifier<?>> buildOrder(OdOrderDiscntDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, d.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("orderDiscntId".equals(field)) {
                    orders.add(new OrderSpecifier(order, d.orderDiscntId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, d.regDate));
                }
            }
        }
        return orders;
    }

    /* 주문 할인 수정 */
    @Override
    public int updateSelective(OdOrderDiscnt entity) {
        if (entity.getOrderDiscntId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(d);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(d.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getOrderId()       != null) { update.set(d.orderId,       entity.getOrderId());       hasAny = true; }
        if (entity.getDiscntTypeCd()  != null) { update.set(d.discntTypeCd,  entity.getDiscntTypeCd());  hasAny = true; }
        if (entity.getCouponId()      != null) { update.set(d.couponId,      entity.getCouponId());      hasAny = true; }
        if (entity.getCouponIssueId() != null) { update.set(d.couponIssueId, entity.getCouponIssueId()); hasAny = true; }
        if (entity.getDiscntRate()    != null) { update.set(d.discntRate,    entity.getDiscntRate());    hasAny = true; }
        if (entity.getDiscntAmt()     != null) { update.set(d.discntAmt,     entity.getDiscntAmt());     hasAny = true; }
        if (entity.getBaseItemAmt()   != null) { update.set(d.baseItemAmt,   entity.getBaseItemAmt());   hasAny = true; }
        if (entity.getRestoreYn()     != null) { update.set(d.restoreYn,     entity.getRestoreYn());     hasAny = true; }
        if (entity.getRestoreAmt()    != null) { update.set(d.restoreAmt,    entity.getRestoreAmt());    hasAny = true; }
        if (entity.getRestoreDate()   != null) { update.set(d.restoreDate,   entity.getRestoreDate());   hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(d.orderDiscntId.eq(entity.getOrderDiscntId())).execute();
        return (int) affected;
    }
}
