package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaimItem;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdClaimItem;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdClaimItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.util.CollectionUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** OdClaimItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdClaimItemRepositoryImpl implements QOdClaimItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdClaimItemRepositoryImpl";
    private static final QOdClaimItem odClaimItem = QOdClaimItem.odClaimItem;

    /* 클레임 아이템 키조회 */
    @Override
    public Optional<OdClaimItemDto.Item> selectById(String claimItemId) {
        OdClaimItemDto.Item dto = baseListQuery()
                .where(odClaimItem.claimItemId.eq(claimItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 클레임 아이템 목록조회 */
    @Override
    public List<OdClaimItemDto.Item> selectList(OdClaimItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdClaimItemDto.Item> query = baseListQuery().where(
                baseAndClaimIds(search),
                baseAndClaimId(search),
                baseAndSiteId(search),
                baseAndClaimItemId(search),
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

    /* 클레임 아이템 페이지조회 */
    @Override
    public OdClaimItemDto.PageResponse selectPageData(OdClaimItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndClaimIds(search),
                baseAndClaimId(search),
                baseAndSiteId(search),
                baseAndClaimItemId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<OdClaimItemDto.Item> query = baseListQuery().where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdClaimItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(odClaimItem.count())
                .from(odClaimItem)
                .where(wheres)
                .fetchOne();

        OdClaimItemDto.PageResponse res = new OdClaimItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 클레임 아이템 baseListQuery */
    private JPAQuery<OdClaimItemDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdClaimItemDto.Item.class,
                        odClaimItem.claimItemId, odClaimItem.siteId, odClaimItem.claimId, odClaimItem.orderItemId,
                        odClaimItem.prodId, odClaimItem.prodNm, odClaimItem.prodOption,
                        odClaimItem.unitPrice, odClaimItem.claimQty, odClaimItem.itemAmt, odClaimItem.refundAmt,
                        odClaimItem.claimItemStatusCd, odClaimItem.claimItemStatusCdBefore,
                        odClaimItem.returnShippingFee, odClaimItem.inboundShippingFee, odClaimItem.exchangeShippingFee,
                        odClaimItem.regBy, odClaimItem.regDate, odClaimItem.updBy, odClaimItem.updDate
                ))
                .from(odClaimItem);
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* claimId IN */
    private BooleanExpression baseAndClaimIds(OdClaimItemDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getClaimIds())
                ? odClaimItem.claimId.in(search.getClaimIds()) : null;
    }

    /* claimId 정확 일치 */
    private BooleanExpression baseAndClaimId(OdClaimItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getClaimId())
                ? odClaimItem.claimId.eq(search.getClaimId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(OdClaimItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? odClaimItem.siteId.eq(search.getSiteId()) : null;
    }

    /* claimItemId 정확 일치 */
    private BooleanExpression baseAndClaimItemId(OdClaimItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getClaimItemId())
                ? odClaimItem.claimItemId.eq(search.getClaimItemId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(OdClaimItemDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return odClaimItem.regDate.goe(start).and(odClaimItem.regDate.lt(endExcl));
            case "upd_date": return odClaimItem.updDate.goe(start).and(odClaimItem.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(OdClaimItemDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",claimId,", odClaimItem.claimId, pattern);
        or = orLike(or, all, types, ",claimItemId,", odClaimItem.claimItemId, pattern);
        or = orLike(or, all, types, ",claimItemStatusCd,", odClaimItem.claimItemStatusCd, pattern);
        or = orLike(or, all, types, ",claimItemStatusCdBefore,", odClaimItem.claimItemStatusCdBefore, pattern);
        or = orLike(or, all, types, ",orderItemId,", odClaimItem.orderItemId, pattern);
        or = orLike(or, all, types, ",prodId,", odClaimItem.prodId, pattern);
        or = orLike(or, all, types, ",prodNm,", odClaimItem.prodNm, pattern);
        or = orLike(or, all, types, ",prodOption,", odClaimItem.prodOption, pattern);
        or = orLike(or, all, types, ",siteId,", odClaimItem.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(OdClaimItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odClaimItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odClaimItem.claimItemId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("claimItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odClaimItem.claimItemId));
                } else if ("prodNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, odClaimItem.prodNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odClaimItem.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odClaimItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odClaimItem.claimItemId));
        }
        return orders;
    }

    /* 클레임 아이템 수정 */
    @Override
    public int updateSelective(OdClaimItem entity) {
        if (entity.getClaimItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odClaimItem);
        boolean hasAny = false;

        if (entity.getSiteId()                  != null) { update.set(odClaimItem.siteId,                  entity.getSiteId());                  hasAny = true; }
        if (entity.getClaimId()                 != null) { update.set(odClaimItem.claimId,                 entity.getClaimId());                 hasAny = true; }
        if (entity.getOrderItemId()             != null) { update.set(odClaimItem.orderItemId,             entity.getOrderItemId());             hasAny = true; }
        if (entity.getProdId()                  != null) { update.set(odClaimItem.prodId,                  entity.getProdId());                  hasAny = true; }
        if (entity.getProdNm()                  != null) { update.set(odClaimItem.prodNm,                  entity.getProdNm());                  hasAny = true; }
        if (entity.getProdOption()              != null) { update.set(odClaimItem.prodOption,              entity.getProdOption());              hasAny = true; }
        if (entity.getUnitPrice()               != null) { update.set(odClaimItem.unitPrice,               entity.getUnitPrice());               hasAny = true; }
        if (entity.getClaimQty()                != null) { update.set(odClaimItem.claimQty,                entity.getClaimQty());                hasAny = true; }
        if (entity.getItemAmt()                 != null) { update.set(odClaimItem.itemAmt,                 entity.getItemAmt());                 hasAny = true; }
        if (entity.getRefundAmt()               != null) { update.set(odClaimItem.refundAmt,               entity.getRefundAmt());               hasAny = true; }
        if (entity.getClaimItemStatusCd()       != null) { update.set(odClaimItem.claimItemStatusCd,       entity.getClaimItemStatusCd());       hasAny = true; }
        if (entity.getClaimItemStatusCdBefore() != null) { update.set(odClaimItem.claimItemStatusCdBefore, entity.getClaimItemStatusCdBefore()); hasAny = true; }
        if (entity.getReturnShippingFee()       != null) { update.set(odClaimItem.returnShippingFee,       entity.getReturnShippingFee());       hasAny = true; }
        if (entity.getInboundShippingFee()      != null) { update.set(odClaimItem.inboundShippingFee,      entity.getInboundShippingFee());      hasAny = true; }
        if (entity.getExchangeShippingFee()     != null) { update.set(odClaimItem.exchangeShippingFee,     entity.getExchangeShippingFee());     hasAny = true; }
        if (entity.getUpdBy()                   != null) { update.set(odClaimItem.updBy,                   entity.getUpdBy());                   hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odClaimItem.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odClaimItem.claimItemId.eq(entity.getClaimItemId())).execute();
        return (int) affected;
    }
}
