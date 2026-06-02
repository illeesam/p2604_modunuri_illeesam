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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDlivItem;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdDlivItem;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdDlivItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.util.CollectionUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** OdDlivItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdDlivItemRepositoryImpl implements QOdDlivItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdDlivItemRepositoryImpl";
    private static final QOdDlivItem odDlivItem = QOdDlivItem.odDlivItem;

    /* 배송 아이템 baseSelColumnQuery */
    private JPAQuery<OdDlivItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdDlivItemDto.Item.class,
                        odDlivItem.dlivItemId, odDlivItem.siteId, odDlivItem.dlivId, odDlivItem.orderItemId,
                        odDlivItem.prodId, odDlivItem.optItemId1, odDlivItem.optItemId2,
                        odDlivItem.dlivTypeCd, odDlivItem.unitPrice, odDlivItem.dlivQty,
                        odDlivItem.dlivItemStatusCd, odDlivItem.dlivItemStatusCdBefore,
                        odDlivItem.regBy, odDlivItem.regDate, odDlivItem.updBy, odDlivItem.updDate
                ))
                .from(odDlivItem);
    }

    /* 배송 아이템 키조회 */
    @Override
    public Optional<OdDlivItemDto.Item> selectById(String dlivItemId) {
        OdDlivItemDto.Item dto = baseSelColumnQuery()
                .where(odDlivItem.dlivItemId.eq(dlivItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배송 아이템 목록조회 */
    @Override
    public List<OdDlivItemDto.Item> selectList(OdDlivItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdDlivItemDto.Item> query = baseSelColumnQuery().where(
                baseAndDlivIds(search),
                baseAndDlivId(search),
                baseAndSiteId(search),
                baseAndDlivItemId(search),
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

    /* 배송 아이템 페이지조회 */
    @Override
    public OdDlivItemDto.PageResponse selectPageData(OdDlivItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdDlivItemDto.Item> query = baseSelColumnQuery().where(
                baseAndDlivIds(search),
                baseAndDlivId(search),
                baseAndSiteId(search),
                baseAndDlivItemId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdDlivItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(odDlivItem.count())
                .from(odDlivItem)
                .where(
                baseAndDlivIds(search),
                baseAndDlivId(search),
                baseAndSiteId(search),
                baseAndDlivItemId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        OdDlivItemDto.PageResponse res = new OdDlivItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* 배송 아이템 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* dlivId IN */
    private BooleanExpression baseAndDlivIds(OdDlivItemDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getDlivIds())
                ? odDlivItem.dlivId.in(search.getDlivIds()) : null;
    }

    /* dlivId 정확 일치 */
    private BooleanExpression baseAndDlivId(OdDlivItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getDlivId())
                ? odDlivItem.dlivId.eq(search.getDlivId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(OdDlivItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? odDlivItem.siteId.eq(search.getSiteId()) : null;
    }

    /* dlivItemId 정확 일치 */
    private BooleanExpression baseAndDlivItemId(OdDlivItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getDlivItemId())
                ? odDlivItem.dlivItemId.eq(search.getDlivItemId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(OdDlivItemDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return odDlivItem.regDate.goe(start).and(odDlivItem.regDate.lt(endExcl));
            case "upd_date": return odDlivItem.updDate.goe(start).and(odDlivItem.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(OdDlivItemDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",dlivId,", odDlivItem.dlivId, pattern);
        or = orLike(or, all, types, ",dlivItemId,", odDlivItem.dlivItemId, pattern);
        or = orLike(or, all, types, ",dlivItemStatusCd,", odDlivItem.dlivItemStatusCd, pattern);
        or = orLike(or, all, types, ",dlivItemStatusCdBefore,", odDlivItem.dlivItemStatusCdBefore, pattern);
        or = orLike(or, all, types, ",dlivTypeCd,", odDlivItem.dlivTypeCd, pattern);
        or = orLike(or, all, types, ",optItemId1,", odDlivItem.optItemId1, pattern);
        or = orLike(or, all, types, ",optItemId2,", odDlivItem.optItemId2, pattern);
        or = orLike(or, all, types, ",orderItemId,", odDlivItem.orderItemId, pattern);
        or = orLike(or, all, types, ",prodId,", odDlivItem.prodId, pattern);
        or = orLike(or, all, types, ",siteId,", odDlivItem.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(OdDlivItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odDlivItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odDlivItem.dlivItemId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("dlivItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odDlivItem.dlivItemId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odDlivItem.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odDlivItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odDlivItem.dlivItemId));
        }
        return orders;
    }

    /* 배송 아이템 수정 */


    @Override
    public int updateSelective(OdDlivItem entity) {
        if (entity.getDlivItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odDlivItem);
        boolean hasAny = false;

        if (entity.getSiteId()                 != null) { update.set(odDlivItem.siteId,                 entity.getSiteId());                 hasAny = true; }
        if (entity.getDlivId()                 != null) { update.set(odDlivItem.dlivId,                 entity.getDlivId());                 hasAny = true; }
        if (entity.getOrderItemId()            != null) { update.set(odDlivItem.orderItemId,            entity.getOrderItemId());            hasAny = true; }
        if (entity.getProdId()                 != null) { update.set(odDlivItem.prodId,                 entity.getProdId());                 hasAny = true; }
        if (entity.getOptItemId1()             != null) { update.set(odDlivItem.optItemId1,             entity.getOptItemId1());             hasAny = true; }
        if (entity.getOptItemId2()             != null) { update.set(odDlivItem.optItemId2,             entity.getOptItemId2());             hasAny = true; }
        if (entity.getDlivTypeCd()             != null) { update.set(odDlivItem.dlivTypeCd,             entity.getDlivTypeCd());             hasAny = true; }
        if (entity.getUnitPrice()              != null) { update.set(odDlivItem.unitPrice,              entity.getUnitPrice());              hasAny = true; }
        if (entity.getDlivQty()                != null) { update.set(odDlivItem.dlivQty,                entity.getDlivQty());                hasAny = true; }
        if (entity.getDlivItemStatusCd()       != null) { update.set(odDlivItem.dlivItemStatusCd,       entity.getDlivItemStatusCd());       hasAny = true; }
        if (entity.getDlivItemStatusCdBefore() != null) { update.set(odDlivItem.dlivItemStatusCdBefore, entity.getDlivItemStatusCdBefore()); hasAny = true; }
        if (entity.getUpdBy()                  != null) { update.set(odDlivItem.updBy,                  entity.getUpdBy());                  hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odDlivItem.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odDlivItem.dlivItemId.eq(entity.getDlivItemId())).execute();
        return (int) affected;
    }
}
