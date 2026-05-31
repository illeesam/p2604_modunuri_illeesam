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
    private static final QOdClaimItem i = QOdClaimItem.odClaimItem;

    /* 클레임 아이템 키조회 */
    @Override
    public Optional<OdClaimItemDto.Item> selectById(String claimItemId) {
        OdClaimItemDto.Item dto = baseListQuery()
                .where(i.claimItemId.eq(claimItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 클레임 아이템 목록조회 */
    @Override
    public List<OdClaimItemDto.Item> selectList(OdClaimItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdClaimItemDto.Item> query = baseListQuery().where(
                andClaimIds(search),
                andClaimId(search),
                andSiteId(search),
                andClaimItemId(search),
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

    /* 클레임 아이템 페이지조회 */
    @Override
    public OdClaimItemDto.PageResponse selectPageList(OdClaimItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdClaimItemDto.Item> query = baseListQuery().where(
                andClaimIds(search),
                andClaimId(search),
                andSiteId(search),
                andClaimItemId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdClaimItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(i.count())
                .from(i)
                .where(
                andClaimIds(search),
                andClaimId(search),
                andSiteId(search),
                andClaimItemId(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        OdClaimItemDto.PageResponse res = new OdClaimItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 클레임 아이템 baseListQuery */
    private JPAQuery<OdClaimItemDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdClaimItemDto.Item.class,
                        i.claimItemId, i.siteId, i.claimId, i.orderItemId,
                        i.prodId, i.prodNm, i.prodOption,
                        i.unitPrice, i.claimQty, i.itemAmt, i.refundAmt,
                        i.claimItemStatusCd, i.claimItemStatusCdBefore,
                        i.returnShippingFee, i.inboundShippingFee, i.exchangeShippingFee,
                        i.regBy, i.regDate, i.updBy, i.updDate
                ))
                .from(i);
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* claimId IN */
    private BooleanExpression andClaimIds(OdClaimItemDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getClaimIds())
                ? i.claimId.in(search.getClaimIds()) : null;
    }

    /* claimId 정확 일치 */
    private BooleanExpression andClaimId(OdClaimItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getClaimId())
                ? i.claimId.eq(search.getClaimId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(OdClaimItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? i.siteId.eq(search.getSiteId()) : null;
    }

    /* claimItemId 정확 일치 */
    private BooleanExpression andClaimItemId(OdClaimItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getClaimItemId())
                ? i.claimItemId.eq(search.getClaimItemId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(OdClaimItemDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return i.regDate.goe(start).and(i.regDate.lt(endExcl));
            case "upd_date": return i.updDate.goe(start).and(i.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(OdClaimItemDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",claimId,", i.claimId, pattern);
        or = orLike(or, all, types, ",claimItemId,", i.claimItemId, pattern);
        or = orLike(or, all, types, ",claimItemStatusCd,", i.claimItemStatusCd, pattern);
        or = orLike(or, all, types, ",claimItemStatusCdBefore,", i.claimItemStatusCdBefore, pattern);
        or = orLike(or, all, types, ",orderItemId,", i.orderItemId, pattern);
        or = orLike(or, all, types, ",prodId,", i.prodId, pattern);
        or = orLike(or, all, types, ",prodNm,", i.prodNm, pattern);
        or = orLike(or, all, types, ",prodOption,", i.prodOption, pattern);
        or = orLike(or, all, types, ",siteId,", i.siteId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, i.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, i.claimItemId));
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
                    orders.add(new OrderSpecifier(order, i.claimItemId));
                } else if ("prodNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.prodNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, i.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, i.claimItemId));
        }
        return orders;
    }

    /* 클레임 아이템 수정 */
    @Override
    public int updateSelective(OdClaimItem entity) {
        if (entity.getClaimItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getSiteId()                  != null) { update.set(i.siteId,                  entity.getSiteId());                  hasAny = true; }
        if (entity.getClaimId()                 != null) { update.set(i.claimId,                 entity.getClaimId());                 hasAny = true; }
        if (entity.getOrderItemId()             != null) { update.set(i.orderItemId,             entity.getOrderItemId());             hasAny = true; }
        if (entity.getProdId()                  != null) { update.set(i.prodId,                  entity.getProdId());                  hasAny = true; }
        if (entity.getProdNm()                  != null) { update.set(i.prodNm,                  entity.getProdNm());                  hasAny = true; }
        if (entity.getProdOption()              != null) { update.set(i.prodOption,              entity.getProdOption());              hasAny = true; }
        if (entity.getUnitPrice()               != null) { update.set(i.unitPrice,               entity.getUnitPrice());               hasAny = true; }
        if (entity.getClaimQty()                != null) { update.set(i.claimQty,                entity.getClaimQty());                hasAny = true; }
        if (entity.getItemAmt()                 != null) { update.set(i.itemAmt,                 entity.getItemAmt());                 hasAny = true; }
        if (entity.getRefundAmt()               != null) { update.set(i.refundAmt,               entity.getRefundAmt());               hasAny = true; }
        if (entity.getClaimItemStatusCd()       != null) { update.set(i.claimItemStatusCd,       entity.getClaimItemStatusCd());       hasAny = true; }
        if (entity.getClaimItemStatusCdBefore() != null) { update.set(i.claimItemStatusCdBefore, entity.getClaimItemStatusCdBefore()); hasAny = true; }
        if (entity.getReturnShippingFee()       != null) { update.set(i.returnShippingFee,       entity.getReturnShippingFee());       hasAny = true; }
        if (entity.getInboundShippingFee()      != null) { update.set(i.inboundShippingFee,      entity.getInboundShippingFee());      hasAny = true; }
        if (entity.getExchangeShippingFee()     != null) { update.set(i.exchangeShippingFee,     entity.getExchangeShippingFee());     hasAny = true; }
        if (entity.getUpdBy()                   != null) { update.set(i.updBy,                   entity.getUpdBy());                   hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(i.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(i.claimItemId.eq(entity.getClaimItemId())).execute();
        return (int) affected;
    }
}
