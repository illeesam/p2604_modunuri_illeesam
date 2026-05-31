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
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdCartDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdCart;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdCart;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdCartRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdOptItem;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** OdCart QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdCartRepositoryImpl implements QOdCartRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdCartRepositoryImpl";
    private static final QOdCart        a   = QOdCart.odCart;
    private static final QSySite        ste = QSySite.sySite;
    private static final QMbMember      mem = QMbMember.mbMember;
    private static final QPdProd        prd = QPdProd.pdProd;
    private static final QPdProdOptItem oi1 = new QPdProdOptItem("oi1");
    private static final QPdProdOptItem oi2 = new QPdProdOptItem("oi2");

    /* 장바구니 키조회 */
    @Override
    public Optional<OdCartDto.Item> selectById(String cartId) {
        OdCartDto.Item dto = baseListQuery()
                .where(a.cartId.eq(cartId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 장바구니 목록조회 */
    @Override
    public List<OdCartDto.Item> selectList(OdCartDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdCartDto.Item> query = baseListQuery().where(
                baseAndSiteId(search),
                baseAndCartId(search),
                baseAndMemberId(search),
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

    /* 장바구니 페이지조회 */
    @Override
    public OdCartDto.PageResponse selectPageList(OdCartDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdCartDto.Item> query = baseListQuery().where(
                baseAndSiteId(search),
                baseAndCartId(search),
                baseAndMemberId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdCartDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .leftJoin(mem).on(mem.memberId.eq(a.memberId))
                .leftJoin(prd).on(prd.prodId.eq(a.prodId))
                .where(
                baseAndSiteId(search),
                baseAndCartId(search),
                baseAndMemberId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        OdCartDto.PageResponse res = new OdCartDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 장바구니 baseListQuery */
    private JPAQuery<OdCartDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdCartDto.Item.class,
                        a.cartId, a.siteId, a.memberId, a.sessionKey, a.prodId, a.skuId,
                        a.optItemId1, a.optItemId2, a.unitPrice, a.orderQty, a.itemPrice, a.isChecked,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        ste.siteNm.as("siteNm"),
                        mem.memberNm.as("memberNm"),
                        prd.prodNm.as("prodNm"),
                        oi1.optNm.as("optNm1"),
                        oi2.optNm.as("optNm2")
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId))
                .leftJoin(mem).on(mem.memberId.eq(a.memberId))
                .leftJoin(prd).on(prd.prodId.eq(a.prodId))
                .leftJoin(oi1).on(oi1.optItemId.eq(a.optItemId1))
                .leftJoin(oi2).on(oi2.optItemId.eq(a.optItemId2));
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(OdCartDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* cartId 정확 일치 */
    private BooleanExpression baseAndCartId(OdCartDto.Request search) {
        return search != null && StringUtils.hasText(search.getCartId())
                ? a.cartId.eq(search.getCartId()) : null;
    }

    /* memberId 정확 일치 */
    private BooleanExpression baseAndMemberId(OdCartDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberId())
                ? a.memberId.eq(search.getMemberId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(OdCartDto.Request search) {
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
    private BooleanExpression baseAndSearchValue(OdCartDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",cartId,", a.cartId, pattern);
        or = orLike(or, all, types, ",isChecked,", a.isChecked, pattern);
        or = orLike(or, all, types, ",memberId,", a.memberId, pattern);
        or = orLike(or, all, types, ",optItemId1,", a.optItemId1, pattern);
        or = orLike(or, all, types, ",optItemId2,", a.optItemId2, pattern);
        or = orLike(or, all, types, ",prodId,", a.prodId, pattern);
        or = orLike(or, all, types, ",sessionKey,", a.sessionKey, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",skuId,", a.skuId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(OdCartDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.cartId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("cartId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.cartId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.cartId));
        }
        return orders;
    }

    /* 장바구니 수정 */
    @Override
    public int updateSelective(OdCart entity) {
        if (entity.getCartId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(a.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getMemberId()    != null) { update.set(a.memberId,    entity.getMemberId());    hasAny = true; }
        if (entity.getSessionKey()  != null) { update.set(a.sessionKey,  entity.getSessionKey());  hasAny = true; }
        if (entity.getProdId()      != null) { update.set(a.prodId,      entity.getProdId());      hasAny = true; }
        if (entity.getSkuId()       != null) { update.set(a.skuId,       entity.getSkuId());       hasAny = true; }
        if (entity.getOptItemId1()  != null) { update.set(a.optItemId1,  entity.getOptItemId1());  hasAny = true; }
        if (entity.getOptItemId2()  != null) { update.set(a.optItemId2,  entity.getOptItemId2());  hasAny = true; }
        if (entity.getUnitPrice()   != null) { update.set(a.unitPrice,   entity.getUnitPrice());   hasAny = true; }
        if (entity.getOrderQty()    != null) { update.set(a.orderQty,    entity.getOrderQty());    hasAny = true; }
        if (entity.getItemPrice()   != null) { update.set(a.itemPrice,   entity.getItemPrice());   hasAny = true; }
        if (entity.getIsChecked()   != null) { update.set(a.isChecked,   entity.getIsChecked());   hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(a.updBy,       entity.getUpdBy());       hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.cartId.eq(entity.getCartId())).execute();
        return (int) affected;
    }
}
