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
    private static final QStSettleItem stSettleItem    = QStSettleItem.stSettleItem;
    private static final QOdOrder      odOrder  = QOdOrder.odOrder;
    private static final QOdOrderItem  odOrderItem  = QOdOrderItem.odOrderItem;
    private static final QSySite       sySite  = QSySite.sySite;
    private static final QSyCode       cdSit = new QSyCode("cd_sit");

    /* 정산 항목 baseListQuery */
    private JPAQuery<StSettleItemDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleItemDto.Item.class,
                        stSettleItem.settleItemId, stSettleItem.settleId, stSettleItem.siteId, stSettleItem.orderId, stSettleItem.orderItemId,
                        stSettleItem.vendorId, stSettleItem.prodId, stSettleItem.settleItemTypeCd, stSettleItem.orderDate, stSettleItem.orderQty,
                        stSettleItem.unitPrice, stSettleItem.itemPrice, stSettleItem.discntAmt, stSettleItem.commissionRate, stSettleItem.commissionAmt,
                        stSettleItem.settleItemAmt, stSettleItem.regBy, stSettleItem.regDate,
                        odOrder.memberNm.as("orderNm"),
                        odOrderItem.prodNm.as("orderItemNm"),
                        sySite.siteNm.as("siteNm"),
                        cdSit.codeLabel.as("settleItemTypeCdNm")
                ))
                .from(stSettleItem)
                .leftJoin(odOrder).on(odOrder.orderId.eq(stSettleItem.orderId))
                .leftJoin(odOrderItem).on(odOrderItem.orderItemId.eq(stSettleItem.orderItemId))
                .leftJoin(sySite).on(sySite.siteId.eq(stSettleItem.siteId))
                .leftJoin(cdSit).on(cdSit.codeGrp.eq("SETTLE_ITEM_TYPE").and(cdSit.codeValue.eq(stSettleItem.settleItemTypeCd)));
    }

    /* 정산 항목 키조회 */
    @Override
    public Optional<StSettleItemDto.Item> selectById(String id) {
        StSettleItemDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stSettleItem.settleItemId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 항목 목록조회 */
    @Override
    public List<StSettleItemDto.Item> selectList(StSettleItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleItemDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndSettleItemId(search),
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

    /* 정산 항목 페이지조회 */
    @Override
    public StSettleItemDto.PageResponse selectPageData(StSettleItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndSettleItemId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<StSettleItemDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<StSettleItemDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stSettleItem.count())
                .where(wheres)
                .fetchOne();

        StSettleItemDto.PageResponse res = new StSettleItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
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
                ? stSettleItem.siteId.eq(search.getSiteId()) : null;
    }

    /* settleItemId 정확 일치 */
    private BooleanExpression baseAndSettleItemId(StSettleItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getSettleItemId())
                ? stSettleItem.settleItemId.eq(search.getSettleItemId()) : null;
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
            case "order_date": return stSettleItem.orderDate.goe(start).and(stSettleItem.orderDate.lt(endExcl));
            case "reg_date": return stSettleItem.regDate.goe(start).and(stSettleItem.regDate.lt(endExcl));
            case "upd_date": return stSettleItem.updDate.goe(start).and(stSettleItem.updDate.lt(endExcl));
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
        or = orLike(or, all, types, ",orderId,", stSettleItem.orderId, pattern);
        or = orLike(or, all, types, ",orderItemId,", stSettleItem.orderItemId, pattern);
        or = orLike(or, all, types, ",prodId,", stSettleItem.prodId, pattern);
        or = orLike(or, all, types, ",settleId,", stSettleItem.settleId, pattern);
        or = orLike(or, all, types, ",settleItemId,", stSettleItem.settleItemId, pattern);
        or = orLike(or, all, types, ",settleItemTypeCd,", stSettleItem.settleItemTypeCd, pattern);
        or = orLike(or, all, types, ",siteId,", stSettleItem.siteId, pattern);
        or = orLike(or, all, types, ",vendorId,", stSettleItem.vendorId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, stSettleItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stSettleItem.settleItemId));
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
                    orders.add(new OrderSpecifier(order, stSettleItem.settleItemId));
                } else if ("orderDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettleItem.orderDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, stSettleItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stSettleItem.settleItemId));
        }
        return orders;
    }

    /* 정산 항목 수정 */
    @Override
    public int updateSelective(StSettleItem entity) {
        if (entity.getSettleItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stSettleItem);
        boolean hasAny = false;

        if (entity.getSettleId()         != null) { update.set(stSettleItem.settleId,         entity.getSettleId());         hasAny = true; }
        if (entity.getSiteId()           != null) { update.set(stSettleItem.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getOrderId()          != null) { update.set(stSettleItem.orderId,          entity.getOrderId());          hasAny = true; }
        if (entity.getOrderItemId()      != null) { update.set(stSettleItem.orderItemId,      entity.getOrderItemId());      hasAny = true; }
        if (entity.getVendorId()         != null) { update.set(stSettleItem.vendorId,         entity.getVendorId());         hasAny = true; }
        if (entity.getProdId()           != null) { update.set(stSettleItem.prodId,           entity.getProdId());           hasAny = true; }
        if (entity.getSettleItemTypeCd() != null) { update.set(stSettleItem.settleItemTypeCd, entity.getSettleItemTypeCd()); hasAny = true; }
        if (entity.getOrderDate()        != null) { update.set(stSettleItem.orderDate,        entity.getOrderDate());        hasAny = true; }
        if (entity.getOrderQty()         != null) { update.set(stSettleItem.orderQty,         entity.getOrderQty());         hasAny = true; }
        if (entity.getUnitPrice()        != null) { update.set(stSettleItem.unitPrice,        entity.getUnitPrice());        hasAny = true; }
        if (entity.getItemPrice()        != null) { update.set(stSettleItem.itemPrice,        entity.getItemPrice());        hasAny = true; }
        if (entity.getDiscntAmt()        != null) { update.set(stSettleItem.discntAmt,        entity.getDiscntAmt());        hasAny = true; }
        if (entity.getCommissionRate()   != null) { update.set(stSettleItem.commissionRate,   entity.getCommissionRate());   hasAny = true; }
        if (entity.getCommissionAmt()    != null) { update.set(stSettleItem.commissionAmt,    entity.getCommissionAmt());    hasAny = true; }
        if (entity.getSettleItemAmt()    != null) { update.set(stSettleItem.settleItemAmt,    entity.getSettleItemAmt());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(stSettleItem.settleItemId.eq(entity.getSettleItemId())).execute();
        return (int) affected;
    }
}
