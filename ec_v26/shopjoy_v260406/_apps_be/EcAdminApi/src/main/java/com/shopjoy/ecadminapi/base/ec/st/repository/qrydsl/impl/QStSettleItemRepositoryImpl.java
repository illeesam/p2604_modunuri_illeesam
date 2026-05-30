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
    private static final QStSettleItem i    = QStSettleItem.stSettleItem;
    private static final QOdOrder      ord  = QOdOrder.odOrder;
    private static final QOdOrderItem  ite  = QOdOrderItem.odOrderItem;
    private static final QSySite       ste  = QSySite.sySite;
    private static final QSyCode       cdSit = new QSyCode("cd_sit");

    /* 정산 항목 키조회 */
    @Override
    public Optional<StSettleItemDto.Item> selectById(String id) {
        StSettleItemDto.Item dto = baseListQuery()
                .where(i.settleItemId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 항목 목록조회 */
    @Override
    public List<StSettleItemDto.Item> selectList(StSettleItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleItemDto.Item> query = baseListQuery().where(
                andSiteId(search),
                andSettleItemId(search),
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

    /* 정산 항목 페이지조회 */
    @Override
    public StSettleItemDto.PageResponse selectPageList(StSettleItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleItemDto.Item> query = baseListQuery().where(
                andSiteId(search),
                andSettleItemId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StSettleItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(i.count())
                .from(i)
                .where(
                andSiteId(search),
                andSettleItemId(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        StSettleItemDto.PageResponse res = new StSettleItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 정산 항목 baseListQuery */
    private JPAQuery<StSettleItemDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleItemDto.Item.class,
                        i.settleItemId, i.settleId, i.siteId, i.orderId, i.orderItemId,
                        i.vendorId, i.prodId, i.settleItemTypeCd, i.orderDate, i.orderQty,
                        i.unitPrice, i.itemPrice, i.discntAmt, i.commissionRate, i.commissionAmt,
                        i.settleItemAmt, i.regBy, i.regDate,
                        ord.memberNm.as("orderNm"),
                        ite.prodNm.as("orderItemNm"),
                        ste.siteNm.as("siteNm"),
                        cdSit.codeLabel.as("settleItemTypeCdNm")
                ))
                .from(i)
                .leftJoin(ord).on(ord.orderId.eq(i.orderId))
                .leftJoin(ite).on(ite.orderItemId.eq(i.orderItemId))
                .leftJoin(ste).on(ste.siteId.eq(i.siteId))
                .leftJoin(cdSit).on(cdSit.codeGrp.eq("SETTLE_ITEM_TYPE").and(cdSit.codeValue.eq(i.settleItemTypeCd)));
    }

    /* 정산 항목 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(StSettleItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? i.siteId.eq(search.getSiteId()) : null;
    }

    /* settleItemId 정확 일치 */
    private BooleanExpression andSettleItemId(StSettleItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getSettleItemId())
                ? i.settleItemId.eq(search.getSettleItemId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(StSettleItemDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "order_date": return i.orderDate.goe(start).and(i.orderDate.lt(endExcl));
            case "reg_date": return i.regDate.goe(start).and(i.regDate.lt(endExcl));
            case "upd_date": return i.updDate.goe(start).and(i.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(StSettleItemDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",orderId,", i.orderId, pattern);
        or = orLike(or, all, types, ",orderItemId,", i.orderItemId, pattern);
        or = orLike(or, all, types, ",prodId,", i.prodId, pattern);
        or = orLike(or, all, types, ",settleId,", i.settleId, pattern);
        or = orLike(or, all, types, ",settleItemId,", i.settleItemId, pattern);
        or = orLike(or, all, types, ",settleItemTypeCd,", i.settleItemTypeCd, pattern);
        or = orLike(or, all, types, ",siteId,", i.siteId, pattern);
        or = orLike(or, all, types, ",vendorId,", i.vendorId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, i.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, i.settleItemId));
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
                    orders.add(new OrderSpecifier(order, i.settleItemId));
                } else if ("orderDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.orderDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, i.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, i.settleItemId));
        }
        return orders;
    }

    /* 정산 항목 수정 */
    @Override
    public int updateSelective(StSettleItem entity) {
        if (entity.getSettleItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getSettleId()         != null) { update.set(i.settleId,         entity.getSettleId());         hasAny = true; }
        if (entity.getSiteId()           != null) { update.set(i.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getOrderId()          != null) { update.set(i.orderId,          entity.getOrderId());          hasAny = true; }
        if (entity.getOrderItemId()      != null) { update.set(i.orderItemId,      entity.getOrderItemId());      hasAny = true; }
        if (entity.getVendorId()         != null) { update.set(i.vendorId,         entity.getVendorId());         hasAny = true; }
        if (entity.getProdId()           != null) { update.set(i.prodId,           entity.getProdId());           hasAny = true; }
        if (entity.getSettleItemTypeCd() != null) { update.set(i.settleItemTypeCd, entity.getSettleItemTypeCd()); hasAny = true; }
        if (entity.getOrderDate()        != null) { update.set(i.orderDate,        entity.getOrderDate());        hasAny = true; }
        if (entity.getOrderQty()         != null) { update.set(i.orderQty,         entity.getOrderQty());         hasAny = true; }
        if (entity.getUnitPrice()        != null) { update.set(i.unitPrice,        entity.getUnitPrice());        hasAny = true; }
        if (entity.getItemPrice()        != null) { update.set(i.itemPrice,        entity.getItemPrice());        hasAny = true; }
        if (entity.getDiscntAmt()        != null) { update.set(i.discntAmt,        entity.getDiscntAmt());        hasAny = true; }
        if (entity.getCommissionRate()   != null) { update.set(i.commissionRate,   entity.getCommissionRate());   hasAny = true; }
        if (entity.getCommissionAmt()    != null) { update.set(i.commissionAmt,    entity.getCommissionAmt());    hasAny = true; }
        if (entity.getSettleItemAmt()    != null) { update.set(i.settleItemAmt,    entity.getSettleItemAmt());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(i.settleItemId.eq(entity.getSettleItemId())).execute();
        return (int) affected;
    }
}
