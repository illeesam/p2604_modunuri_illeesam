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
    private static final QOdOrderDiscnt a   = QOdOrderDiscnt.odOrderDiscnt;
    private static final QSySite        ste = new QSySite("ste");
    private static final QOdOrder       ord = new QOdOrder("ord");
    private static final QPmCoupon      cpn = new QPmCoupon("cpn");
    private static final QSyCode        cdOdt = new QSyCode("cd_odt");

    /* 주문 할인 키조회 */
    @Override
    public Optional<OdOrderDiscntDto.Item> selectById(String orderDiscntId) {
        OdOrderDiscntDto.Item dto = baseListQuery()
                .where(a.orderDiscntId.eq(orderDiscntId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 주문 할인 목록조회 */
    @Override
    public List<OdOrderDiscntDto.Item> selectList(OdOrderDiscntDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderDiscntDto.Item> query = baseListQuery().where(
                baseAndOrderIds(search),
                baseAndOrderId(search),
                baseAndSiteId(search),
                baseAndOrderDiscntId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
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

    /* 주문 할인 페이지조회 */
    @Override
    public OdOrderDiscntDto.PageResponse selectPageList(OdOrderDiscntDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderDiscntDto.Item> query = baseListQuery().where(
                baseAndOrderIds(search),
                baseAndOrderId(search),
                baseAndSiteId(search),
                baseAndOrderDiscntId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdOrderDiscntDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .where(
                baseAndOrderIds(search),
                baseAndOrderId(search),
                baseAndSiteId(search),
                baseAndOrderDiscntId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        OdOrderDiscntDto.PageResponse res = new OdOrderDiscntDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 목록/페이지/단건 공용 base query */
    private JPAQuery<OdOrderDiscntDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdOrderDiscntDto.Item.class,
                        a.orderDiscntId, a.siteId, a.orderId,
                        a.discntTypeCd, a.couponId, a.couponIssueId,
                        a.discntRate, a.discntAmt, a.baseItemAmt,
                        a.restoreYn, a.restoreAmt, a.restoreDate,
                        a.regBy, a.regDate
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId))
                .leftJoin(ord).on(ord.orderId.eq(a.orderId))
                .leftJoin(cpn).on(cpn.couponId.eq(a.couponId))
                .leftJoin(cdOdt).on(cdOdt.codeGrp.eq("ORDER_DISCNT_TYPE").and(cdOdt.codeValue.eq(a.discntTypeCd)));
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
                ? a.orderId.in(search.getOrderIds()) : null;
    }

    /* orderId 정확 일치 */
    private BooleanExpression baseAndOrderId(OdOrderDiscntDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderId())
                ? a.orderId.eq(search.getOrderId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(OdOrderDiscntDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* orderDiscntId 정확 일치 */
    private BooleanExpression baseAndOrderDiscntId(OdOrderDiscntDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderDiscntId())
                ? a.orderDiscntId.eq(search.getOrderDiscntId()) : null;
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
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            case "upd_date": return a.updDate.goe(start).and(a.updDate.lt(endExcl));
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
        or = orLike(or, all, types, ",couponId,", a.couponId, pattern);
        or = orLike(or, all, types, ",couponIssueId,", a.couponIssueId, pattern);
        or = orLike(or, all, types, ",discntTypeCd,", a.discntTypeCd, pattern);
        or = orLike(or, all, types, ",orderDiscntId,", a.orderDiscntId, pattern);
        or = orLike(or, all, types, ",orderId,", a.orderId, pattern);
        or = orLike(or, all, types, ",restoreYn,", a.restoreYn, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.orderDiscntId));
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
                    orders.add(new OrderSpecifier(order, a.orderDiscntId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.orderDiscntId));
        }
        return orders;
    }

    /* 주문 할인 수정 */
    @Override
    public int updateSelective(OdOrderDiscnt entity) {
        if (entity.getOrderDiscntId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(a.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getOrderId()       != null) { update.set(a.orderId,       entity.getOrderId());       hasAny = true; }
        if (entity.getDiscntTypeCd()  != null) { update.set(a.discntTypeCd,  entity.getDiscntTypeCd());  hasAny = true; }
        if (entity.getCouponId()      != null) { update.set(a.couponId,      entity.getCouponId());      hasAny = true; }
        if (entity.getCouponIssueId() != null) { update.set(a.couponIssueId, entity.getCouponIssueId()); hasAny = true; }
        if (entity.getDiscntRate()    != null) { update.set(a.discntRate,    entity.getDiscntRate());    hasAny = true; }
        if (entity.getDiscntAmt()     != null) { update.set(a.discntAmt,     entity.getDiscntAmt());     hasAny = true; }
        if (entity.getBaseItemAmt()   != null) { update.set(a.baseItemAmt,   entity.getBaseItemAmt());   hasAny = true; }
        if (entity.getRestoreYn()     != null) { update.set(a.restoreYn,     entity.getRestoreYn());     hasAny = true; }
        if (entity.getRestoreAmt()    != null) { update.set(a.restoreAmt,    entity.getRestoreAmt());    hasAny = true; }
        if (entity.getRestoreDate()   != null) { update.set(a.restoreDate,   entity.getRestoreDate());   hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(a.orderDiscntId.eq(entity.getOrderDiscntId())).execute();
        return (int) affected;
    }
}
