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
    private static final QOdOrderItemDiscnt odOrderItemDiscnt   = QOdOrderItemDiscnt.odOrderItemDiscnt;
    private static final QSySite            ste = new QSySite("ste");
    private static final QOdOrder           ord = new QOdOrder("ord");
    private static final QOdOrderItem       ite = new QOdOrderItem("ite");
    private static final QPmCoupon          cpn = new QPmCoupon("cpn");
    private static final QSyCode            cdOidt = new QSyCode("cd_oidt");

    /** 목록/페이지/단건 공용 base query */
    private JPAQuery<OdOrderItemDiscntDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdOrderItemDiscntDto.Item.class,
                        odOrderItemDiscnt.itemDiscntId, odOrderItemDiscnt.siteId, odOrderItemDiscnt.orderId, odOrderItemDiscnt.orderItemId,
                        odOrderItemDiscnt.discntTypeCd, odOrderItemDiscnt.couponId, odOrderItemDiscnt.couponIssueId,
                        odOrderItemDiscnt.discntRate, odOrderItemDiscnt.unitDiscntAmt, odOrderItemDiscnt.totalDiscntAmt, odOrderItemDiscnt.orderQty,
                        odOrderItemDiscnt.regBy, odOrderItemDiscnt.regDate
                ))
                .from(odOrderItemDiscnt)
                .leftJoin(ste).on(ste.siteId.eq(odOrderItemDiscnt.siteId))
                .leftJoin(ord).on(ord.orderId.eq(odOrderItemDiscnt.orderId))
                .leftJoin(ite).on(ite.orderItemId.eq(odOrderItemDiscnt.orderItemId))
                .leftJoin(cpn).on(cpn.couponId.eq(odOrderItemDiscnt.couponId))
                .leftJoin(cdOidt).on(cdOidt.codeGrp.eq("ORDER_ITEM_DISCNT_TYPE").and(cdOidt.codeValue.eq(odOrderItemDiscnt.discntTypeCd)));
    }

    /* 주문 아이템 할인 키조회 */
    @Override
    public Optional<OdOrderItemDiscntDto.Item> selectById(String itemDiscntId) {
        OdOrderItemDiscntDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odOrderItemDiscnt.itemDiscntId.eq(itemDiscntId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 주문 아이템 할인 목록조회 */
    @Override
    public List<OdOrderItemDiscntDto.Item> selectList(OdOrderItemDiscntDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderItemDiscntDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    andSiteIdEq(search),
                    andItemDiscntIdEq(search),
                    andDateRangeBetween(search),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 주문 아이템 할인 페이지조회 */
    @Override
    public OdOrderItemDiscntDto.PageResponse selectPageData(OdOrderItemDiscntDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andSiteIdEq(search),
                andItemDiscntIdEq(search),
                andDateRangeBetween(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdOrderItemDiscntDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdOrderItemDiscntDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odOrderItemDiscnt.count())
                .where(wheres)
                .fetchOne();

        OdOrderItemDiscntDto.PageResponse res = new OdOrderItemDiscntDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }



    /* 주문 아이템 할인 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteIdEq(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteIdEq(OdOrderItemDiscntDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? odOrderItemDiscnt.siteId.eq(search.getSiteId()) : null;
    }

    /* itemDiscntId 정확 일치 */
    private BooleanExpression andItemDiscntIdEq(OdOrderItemDiscntDto.Request search) {
        return search != null && StringUtils.hasText(search.getItemDiscntId())
                ? odOrderItemDiscnt.itemDiscntId.eq(search.getItemDiscntId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRangeBetween(OdOrderItemDiscntDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return odOrderItemDiscnt.regDate.goe(start).and(odOrderItemDiscnt.regDate.lt(endExcl));
            case "upd_date": return odOrderItemDiscnt.updDate.goe(start).and(odOrderItemDiscnt.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValueLike(OdOrderItemDiscntDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",couponId,", odOrderItemDiscnt.couponId, pattern);
        or = orLike(or, all, types, ",couponIssueId,", odOrderItemDiscnt.couponIssueId, pattern);
        or = orLike(or, all, types, ",discntTypeCd,", odOrderItemDiscnt.discntTypeCd, pattern);
        or = orLike(or, all, types, ",itemDiscntId,", odOrderItemDiscnt.itemDiscntId, pattern);
        or = orLike(or, all, types, ",orderId,", odOrderItemDiscnt.orderId, pattern);
        or = orLike(or, all, types, ",orderItemId,", odOrderItemDiscnt.orderItemId, pattern);
        or = orLike(or, all, types, ",siteId,", odOrderItemDiscnt.siteId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, odOrderItemDiscnt.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odOrderItemDiscnt.itemDiscntId));
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
                    orders.add(new OrderSpecifier(order, odOrderItemDiscnt.itemDiscntId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odOrderItemDiscnt.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odOrderItemDiscnt.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odOrderItemDiscnt.itemDiscntId));
        }
        return orders;
    }

    /* 주문 아이템 할인 수정 */
    @Override
    public int updateSelective(OdOrderItemDiscnt entity) {
        if (entity.getItemDiscntId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odOrderItemDiscnt);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(odOrderItemDiscnt.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getOrderId()        != null) { update.set(odOrderItemDiscnt.orderId,        entity.getOrderId());        hasAny = true; }
        if (entity.getOrderItemId()    != null) { update.set(odOrderItemDiscnt.orderItemId,    entity.getOrderItemId());    hasAny = true; }
        if (entity.getDiscntTypeCd()   != null) { update.set(odOrderItemDiscnt.discntTypeCd,   entity.getDiscntTypeCd());   hasAny = true; }
        if (entity.getCouponId()       != null) { update.set(odOrderItemDiscnt.couponId,       entity.getCouponId());       hasAny = true; }
        if (entity.getCouponIssueId()  != null) { update.set(odOrderItemDiscnt.couponIssueId,  entity.getCouponIssueId());  hasAny = true; }
        if (entity.getDiscntRate()     != null) { update.set(odOrderItemDiscnt.discntRate,     entity.getDiscntRate());     hasAny = true; }
        if (entity.getUnitDiscntAmt()  != null) { update.set(odOrderItemDiscnt.unitDiscntAmt,  entity.getUnitDiscntAmt());  hasAny = true; }
        if (entity.getTotalDiscntAmt() != null) { update.set(odOrderItemDiscnt.totalDiscntAmt, entity.getTotalDiscntAmt()); hasAny = true; }
        if (entity.getOrderQty()       != null) { update.set(odOrderItemDiscnt.orderQty,       entity.getOrderQty());       hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(odOrderItemDiscnt.itemDiscntId.eq(entity.getItemDiscntId())).execute();
        return (int) affected;
    }
}
