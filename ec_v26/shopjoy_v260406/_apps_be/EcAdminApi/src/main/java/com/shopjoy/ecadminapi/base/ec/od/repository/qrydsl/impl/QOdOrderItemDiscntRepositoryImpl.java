package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItemDiscnt;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderItem;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderItemDiscnt;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdOrderItemDiscntRepository;
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
/** OdOrderItemDiscnt QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdOrderItemDiscntRepositoryImpl implements QOdOrderItemDiscntRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdOrderItemDiscntRepositoryImpl";
    private static final QOdOrderItemDiscnt d   = QOdOrderItemDiscnt.odOrderItemDiscnt;
    private static final QSySite            ste = new QSySite("ste");
    private static final QOdOrder           ord = new QOdOrder("ord");
    private static final QOdOrderItem       ite = new QOdOrderItem("ite");
    private static final QPmCoupon          cpn = new QPmCoupon("cpn");
    private static final QSyCode            cdOidt = new QSyCode("cd_oidt");

    /* 주문 아이템 할인 키조회 */
    @Override
    public Optional<OdOrderItemDiscntDto.Item> selectById(String itemDiscntId) {
        OdOrderItemDiscntDto.Item dto = baseListQuery()
                .where(d.itemDiscntId.eq(itemDiscntId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 주문 아이템 할인 목록조회 */
    @Override
    public List<OdOrderItemDiscntDto.Item> selectList(OdOrderItemDiscntDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderItemDiscntDto.Item> query = baseListQuery().where(
                andSiteId(search),
                andItemDiscntId(search),
                andDateRange(search),
                andSearchValue(search)
        );
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

    /* 주문 아이템 할인 페이지조회 */
    @Override
    public OdOrderItemDiscntDto.PageResponse selectPageList(OdOrderItemDiscntDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderItemDiscntDto.Item> query = baseListQuery().where(
                andSiteId(search),
                andItemDiscntId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdOrderItemDiscntDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(d.count())
                .from(d)
                .where(
                andSiteId(search),
                andItemDiscntId(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        OdOrderItemDiscntDto.PageResponse res = new OdOrderItemDiscntDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 목록/페이지/단건 공용 base query */
    private JPAQuery<OdOrderItemDiscntDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdOrderItemDiscntDto.Item.class,
                        d.itemDiscntId, d.siteId, d.orderId, d.orderItemId,
                        d.discntTypeCd, d.couponId, d.couponIssueId,
                        d.discntRate, d.unitDiscntAmt, d.totalDiscntAmt, d.orderQty,
                        d.regBy, d.regDate
                ))
                .from(d)
                .leftJoin(ste).on(ste.siteId.eq(d.siteId))
                .leftJoin(ord).on(ord.orderId.eq(d.orderId))
                .leftJoin(ite).on(ite.orderItemId.eq(d.orderItemId))
                .leftJoin(cpn).on(cpn.couponId.eq(d.couponId))
                .leftJoin(cdOidt).on(cdOidt.codeGrp.eq("ORDER_ITEM_DISCNT_TYPE").and(cdOidt.codeValue.eq(d.discntTypeCd)));
    }

    /* 주문 아이템 할인 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(OdOrderItemDiscntDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? d.siteId.eq(search.getSiteId()) : null;
    }

    /* itemDiscntId 정확 일치 */
    private BooleanExpression andItemDiscntId(OdOrderItemDiscntDto.Request search) {
        return search != null && StringUtils.hasText(search.getItemDiscntId())
                ? d.itemDiscntId.eq(search.getItemDiscntId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(OdOrderItemDiscntDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return d.regDate.goe(start).and(d.regDate.lt(endExcl));
            case "upd_date": return d.updDate.goe(start).and(d.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(OdOrderItemDiscntDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",couponId,", d.couponId, pattern);
        or = orLike(or, all, types, ",couponIssueId,", d.couponIssueId, pattern);
        or = orLike(or, all, types, ",discntTypeCd,", d.discntTypeCd, pattern);
        or = orLike(or, all, types, ",itemDiscntId,", d.itemDiscntId, pattern);
        or = orLike(or, all, types, ",orderId,", d.orderId, pattern);
        or = orLike(or, all, types, ",orderItemId,", d.orderItemId, pattern);
        or = orLike(or, all, types, ",siteId,", d.siteId, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdOrderItemDiscntDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, d.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, d.itemDiscntId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("itemDiscntId".equals(field)) {
                    orders.add(new OrderSpecifier(order, d.itemDiscntId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, d.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, d.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, d.itemDiscntId));
        }
        return orders;
    }

    /* 주문 아이템 할인 수정 */
    @Override
    public int updateSelective(OdOrderItemDiscnt entity) {
        if (entity.getItemDiscntId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(d);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(d.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getOrderId()        != null) { update.set(d.orderId,        entity.getOrderId());        hasAny = true; }
        if (entity.getOrderItemId()    != null) { update.set(d.orderItemId,    entity.getOrderItemId());    hasAny = true; }
        if (entity.getDiscntTypeCd()   != null) { update.set(d.discntTypeCd,   entity.getDiscntTypeCd());   hasAny = true; }
        if (entity.getCouponId()       != null) { update.set(d.couponId,       entity.getCouponId());       hasAny = true; }
        if (entity.getCouponIssueId()  != null) { update.set(d.couponIssueId,  entity.getCouponIssueId());  hasAny = true; }
        if (entity.getDiscntRate()     != null) { update.set(d.discntRate,     entity.getDiscntRate());     hasAny = true; }
        if (entity.getUnitDiscntAmt()  != null) { update.set(d.unitDiscntAmt,  entity.getUnitDiscntAmt());  hasAny = true; }
        if (entity.getTotalDiscntAmt() != null) { update.set(d.totalDiscntAmt, entity.getTotalDiscntAmt()); hasAny = true; }
        if (entity.getOrderQty()       != null) { update.set(d.orderQty,       entity.getOrderQty());       hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(d.itemDiscntId.eq(entity.getItemDiscntId())).execute();
        return (int) affected;
    }
}
