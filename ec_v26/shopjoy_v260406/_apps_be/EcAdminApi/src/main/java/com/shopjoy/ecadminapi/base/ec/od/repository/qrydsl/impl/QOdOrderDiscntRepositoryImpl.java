package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
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
import org.springframework.util.CollectionUtils;
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
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdOrderDiscntRepositoryImpl";
    private static final QOdOrderDiscnt odOrderDiscnt   = QOdOrderDiscnt.odOrderDiscnt;
    private static final QSySite        ste = new QSySite("ste");
    private static final QOdOrder       ord = new QOdOrder("ord");
    private static final QPmCoupon      cpn = new QPmCoupon("cpn");
    private static final QSyCode        cdOdt = new QSyCode("cd_odt");

    /** 목록/페이지/단건 공용 base query */
    private JPAQuery<OdOrderDiscntDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdOrderDiscntDto.Item.class,
                        odOrderDiscnt.orderDiscntId, odOrderDiscnt.siteId, odOrderDiscnt.orderId,
                        odOrderDiscnt.discntTypeCd, odOrderDiscnt.couponId, odOrderDiscnt.couponIssueId,
                        odOrderDiscnt.discntRate, odOrderDiscnt.discntAmt, odOrderDiscnt.baseItemAmt,
                        odOrderDiscnt.restoreYn, odOrderDiscnt.restoreAmt, odOrderDiscnt.restoreDate,
                        odOrderDiscnt.regBy, odOrderDiscnt.regDate
                ))
                .from(odOrderDiscnt)
                .leftJoin(ste).on(ste.siteId.eq(odOrderDiscnt.siteId))
                .leftJoin(ord).on(ord.orderId.eq(odOrderDiscnt.orderId))
                .leftJoin(cpn).on(cpn.couponId.eq(odOrderDiscnt.couponId))
                .leftJoin(cdOdt).on(cdOdt.codeGrp.eq("ORDER_DISCNT_TYPE").and(cdOdt.codeValue.eq(odOrderDiscnt.discntTypeCd)));
    }

    /* 주문 할인 키조회 */
    @Override
    public Optional<OdOrderDiscntDto.Item> selectById(String orderDiscntId) {
        OdOrderDiscntDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odOrderDiscnt.orderDiscntId.eq(orderDiscntId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 주문 할인 목록조회 */
    @Override
    public List<OdOrderDiscntDto.Item> selectList(OdOrderDiscntDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderDiscntDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndOrderIds(search),
                    baseAndOrderId(search),
                    baseAndSiteId(search),
                    baseAndOrderDiscntId(search),
                    baseAndDateRange(search),
                    baseAndSearchValue(search)
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

    /* 주문 할인 페이지조회 */
    @Override
    public OdOrderDiscntDto.PageResponse selectPageData(OdOrderDiscntDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndOrderIds(search),
                baseAndOrderId(search),
                baseAndSiteId(search),
                baseAndOrderDiscntId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdOrderDiscntDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdOrderDiscntDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odOrderDiscnt.count())
                .where(wheres)
                .fetchOne();

        OdOrderDiscntDto.PageResponse res = new OdOrderDiscntDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }



    /* 주문 할인 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* orderId IN */
    private BooleanExpression baseAndOrderIds(OdOrderDiscntDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getOrderIds())
                ? odOrderDiscnt.orderId.in(search.getOrderIds()) : null;
    }

    /* orderId 정확 일치 */
    private BooleanExpression baseAndOrderId(OdOrderDiscntDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderId())
                ? odOrderDiscnt.orderId.eq(search.getOrderId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(OdOrderDiscntDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? odOrderDiscnt.siteId.eq(search.getSiteId()) : null;
    }

    /* orderDiscntId 정확 일치 */
    private BooleanExpression baseAndOrderDiscntId(OdOrderDiscntDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderDiscntId())
                ? odOrderDiscnt.orderDiscntId.eq(search.getOrderDiscntId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(OdOrderDiscntDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return odOrderDiscnt.regDate.goe(start).and(odOrderDiscnt.regDate.lt(endExcl));
            case "upd_date": return odOrderDiscnt.updDate.goe(start).and(odOrderDiscnt.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(OdOrderDiscntDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",couponId,", odOrderDiscnt.couponId, pattern);
        or = orLike(or, all, types, ",couponIssueId,", odOrderDiscnt.couponIssueId, pattern);
        or = orLike(or, all, types, ",discntTypeCd,", odOrderDiscnt.discntTypeCd, pattern);
        or = orLike(or, all, types, ",orderDiscntId,", odOrderDiscnt.orderDiscntId, pattern);
        or = orLike(or, all, types, ",orderId,", odOrderDiscnt.orderId, pattern);
        or = orLike(or, all, types, ",restoreYn,", odOrderDiscnt.restoreYn, pattern);
        or = orLike(or, all, types, ",siteId,", odOrderDiscnt.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(OdOrderDiscntDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odOrderDiscnt.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odOrderDiscnt.orderDiscntId));
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
                    orders.add(new OrderSpecifier(order, odOrderDiscnt.orderDiscntId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odOrderDiscnt.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odOrderDiscnt.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odOrderDiscnt.orderDiscntId));
        }
        return orders;
    }

    /* 주문 할인 수정 */
    @Override
    public int updateSelective(OdOrderDiscnt entity) {
        if (entity.getOrderDiscntId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odOrderDiscnt);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(odOrderDiscnt.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getOrderId()       != null) { update.set(odOrderDiscnt.orderId,       entity.getOrderId());       hasAny = true; }
        if (entity.getDiscntTypeCd()  != null) { update.set(odOrderDiscnt.discntTypeCd,  entity.getDiscntTypeCd());  hasAny = true; }
        if (entity.getCouponId()      != null) { update.set(odOrderDiscnt.couponId,      entity.getCouponId());      hasAny = true; }
        if (entity.getCouponIssueId() != null) { update.set(odOrderDiscnt.couponIssueId, entity.getCouponIssueId()); hasAny = true; }
        if (entity.getDiscntRate()    != null) { update.set(odOrderDiscnt.discntRate,    entity.getDiscntRate());    hasAny = true; }
        if (entity.getDiscntAmt()     != null) { update.set(odOrderDiscnt.discntAmt,     entity.getDiscntAmt());     hasAny = true; }
        if (entity.getBaseItemAmt()   != null) { update.set(odOrderDiscnt.baseItemAmt,   entity.getBaseItemAmt());   hasAny = true; }
        if (entity.getRestoreYn()     != null) { update.set(odOrderDiscnt.restoreYn,     entity.getRestoreYn());     hasAny = true; }
        if (entity.getRestoreAmt()    != null) { update.set(odOrderDiscnt.restoreAmt,    entity.getRestoreAmt());    hasAny = true; }
        if (entity.getRestoreDate()   != null) { update.set(odOrderDiscnt.restoreDate,   entity.getRestoreDate());   hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(odOrderDiscnt.orderDiscntId.eq(entity.getOrderDiscntId())).execute();
        return (int) affected;
    }
}
