package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderItem;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleItemDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleItem;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleItem;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleItemRepository;
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
/** StSettleItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettleItemRepositoryImpl implements QStSettleItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStSettleItemRepositoryImpl";
    private static final QStSettleItem a    = QStSettleItem.stSettleItem;
    private static final QOdOrder      ord  = QOdOrder.odOrder;
    private static final QOdOrderItem  ite  = QOdOrderItem.odOrderItem;
    private static final QSySite       ste  = QSySite.sySite;
    private static final QSyCode       cdSit = new QSyCode("cd_sit");

    /* 정산 항목 키조회 */
    @Override
    public Optional<StSettleItemDto.Item> selectById(String id) {
        StSettleItemDto.Item dto = baseListQuery()
                .where(a.settleItemId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 항목 목록조회 */
    @Override
    public List<StSettleItemDto.Item> selectList(StSettleItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleItemDto.Item> query = baseListQuery().where(
                baseAndSiteId(search),
                baseAndSettleItemId(search),
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

    /* 정산 항목 페이지조회 */
    @Override
    public StSettleItemDto.PageResponse selectPageList(StSettleItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleItemDto.Item> query = baseListQuery().where(
                baseAndSiteId(search),
                baseAndSettleItemId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StSettleItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .where(
                baseAndSiteId(search),
                baseAndSettleItemId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        StSettleItemDto.PageResponse res = new StSettleItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 정산 항목 baseListQuery */
    private JPAQuery<StSettleItemDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleItemDto.Item.class,
                        a.settleItemId, a.settleId, a.siteId, a.orderId, a.orderItemId,
                        a.vendorId, a.prodId, a.settleItemTypeCd, a.orderDate, a.orderQty,
                        a.unitPrice, a.itemPrice, a.discntAmt, a.commissionRate, a.commissionAmt,
                        a.settleItemAmt, a.regBy, a.regDate,
                        ord.memberNm.as("orderNm"),
                        ite.prodNm.as("orderItemNm"),
                        ste.siteNm.as("siteNm"),
                        cdSit.codeLabel.as("settleItemTypeCdNm")
                ))
                .from(a)
                .leftJoin(ord).on(ord.orderId.eq(a.orderId))
                .leftJoin(ite).on(ite.orderItemId.eq(a.orderItemId))
                .leftJoin(ste).on(ste.siteId.eq(a.siteId))
                .leftJoin(cdSit).on(cdSit.codeGrp.eq("SETTLE_ITEM_TYPE").and(cdSit.codeValue.eq(a.settleItemTypeCd)));
    }

    /* 정산 항목 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(StSettleItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* settleItemId 정확 일치 */
    private BooleanExpression baseAndSettleItemId(StSettleItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getSettleItemId())
                ? a.settleItemId.eq(search.getSettleItemId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(StSettleItemDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "order_date": return a.orderDate.goe(start).and(a.orderDate.lt(endExcl));
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            case "upd_date": return a.updDate.goe(start).and(a.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(StSettleItemDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",orderId,", a.orderId, pattern);
        or = orLike(or, all, types, ",orderItemId,", a.orderItemId, pattern);
        or = orLike(or, all, types, ",prodId,", a.prodId, pattern);
        or = orLike(or, all, types, ",settleId,", a.settleId, pattern);
        or = orLike(or, all, types, ",settleItemId,", a.settleItemId, pattern);
        or = orLike(or, all, types, ",settleItemTypeCd,", a.settleItemTypeCd, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",vendorId,", a.vendorId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(StSettleItemDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = c == null ? null : c.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.settleItemId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("settleItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.settleItemId));
                } else if ("orderDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.orderDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.settleItemId));
        }
        return orders;
    }

    /* 정산 항목 수정 */
    @Override
    public int updateSelective(StSettleItem entity) {
        if (entity.getSettleItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSettleId()         != null) { update.set(a.settleId,         entity.getSettleId());         hasAny = true; }
        if (entity.getSiteId()           != null) { update.set(a.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getOrderId()          != null) { update.set(a.orderId,          entity.getOrderId());          hasAny = true; }
        if (entity.getOrderItemId()      != null) { update.set(a.orderItemId,      entity.getOrderItemId());      hasAny = true; }
        if (entity.getVendorId()         != null) { update.set(a.vendorId,         entity.getVendorId());         hasAny = true; }
        if (entity.getProdId()           != null) { update.set(a.prodId,           entity.getProdId());           hasAny = true; }
        if (entity.getSettleItemTypeCd() != null) { update.set(a.settleItemTypeCd, entity.getSettleItemTypeCd()); hasAny = true; }
        if (entity.getOrderDate()        != null) { update.set(a.orderDate,        entity.getOrderDate());        hasAny = true; }
        if (entity.getOrderQty()         != null) { update.set(a.orderQty,         entity.getOrderQty());         hasAny = true; }
        if (entity.getUnitPrice()        != null) { update.set(a.unitPrice,        entity.getUnitPrice());        hasAny = true; }
        if (entity.getItemPrice()        != null) { update.set(a.itemPrice,        entity.getItemPrice());        hasAny = true; }
        if (entity.getDiscntAmt()        != null) { update.set(a.discntAmt,        entity.getDiscntAmt());        hasAny = true; }
        if (entity.getCommissionRate()   != null) { update.set(a.commissionRate,   entity.getCommissionRate());   hasAny = true; }
        if (entity.getCommissionAmt()    != null) { update.set(a.commissionAmt,    entity.getCommissionAmt());    hasAny = true; }
        if (entity.getSettleItemAmt()    != null) { update.set(a.settleItemAmt,    entity.getSettleItemAmt());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(a.settleItemId.eq(entity.getSettleItemId())).execute();
        return (int) affected;
    }
}
