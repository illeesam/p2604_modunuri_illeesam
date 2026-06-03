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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhOrderItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhOrderItemChgHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** OdhOrderItemChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhOrderItemChgHistRepositoryImpl implements QOdhOrderItemChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhOrderItemChgHistRepositoryImpl";
    private static final QOdhOrderItemChgHist odhOrderItemChgHist = QOdhOrderItemChgHist.odhOrderItemChgHist;

    /* 주문 아이템 변경 이력 baseSelColumnQuery */
    private JPAQuery<OdhOrderItemChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhOrderItemChgHistDto.Item.class,
                        odhOrderItemChgHist.orderItemChgHistId, odhOrderItemChgHist.siteId, odhOrderItemChgHist.orderId, odhOrderItemChgHist.orderItemId,
                        odhOrderItemChgHist.chgTypeCd, odhOrderItemChgHist.chgField, odhOrderItemChgHist.beforeVal, odhOrderItemChgHist.afterVal,
                        odhOrderItemChgHist.chgReason, odhOrderItemChgHist.chgUserId, odhOrderItemChgHist.chgDate,
                        odhOrderItemChgHist.regBy, odhOrderItemChgHist.regDate, odhOrderItemChgHist.updBy, odhOrderItemChgHist.updDate))
                .from(odhOrderItemChgHist);
    }

    /* 주문 아이템 변경 이력 키조회 */
    @Override
    public Optional<OdhOrderItemChgHistDto.Item> selectById(String id) {
        OdhOrderItemChgHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhOrderItemChgHist.orderItemChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 주문 아이템 변경 이력 목록조회 */
    @Override
    public List<OdhOrderItemChgHistDto.Item> selectList(OdhOrderItemChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhOrderItemChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndOrderItemChgHistId(search),
                    baseAndSearchValue(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 주문 아이템 변경 이력 페이지조회 */
    @Override
    public OdhOrderItemChgHistDto.PageResponse selectPageData(OdhOrderItemChgHistDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndOrderItemChgHistId(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdhOrderItemChgHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdhOrderItemChgHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhOrderItemChgHist.count())
                .where(wheres)
                .fetchOne();

        OdhOrderItemChgHistDto.PageResponse res = new OdhOrderItemChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 주문 아이템 변경 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(OdhOrderItemChgHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? odhOrderItemChgHist.siteId.eq(search.getSiteId()) : null;
    }

    /* orderItemChgHistId 정확 일치 */
    private BooleanExpression baseAndOrderItemChgHistId(OdhOrderItemChgHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderItemChgHistId())
                ? odhOrderItemChgHist.orderItemChgHistId.eq(search.getOrderItemChgHistId()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(OdhOrderItemChgHistDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",afterVal,", odhOrderItemChgHist.afterVal, pattern);
        or = orLike(or, all, types, ",beforeVal,", odhOrderItemChgHist.beforeVal, pattern);
        or = orLike(or, all, types, ",chgField,", odhOrderItemChgHist.chgField, pattern);
        or = orLike(or, all, types, ",chgReason,", odhOrderItemChgHist.chgReason, pattern);
        or = orLike(or, all, types, ",chgTypeCd,", odhOrderItemChgHist.chgTypeCd, pattern);
        or = orLike(or, all, types, ",chgUserId,", odhOrderItemChgHist.chgUserId, pattern);
        or = orLike(or, all, types, ",orderId,", odhOrderItemChgHist.orderId, pattern);
        or = orLike(or, all, types, ",orderItemChgHistId,", odhOrderItemChgHist.orderItemChgHistId, pattern);
        or = orLike(or, all, types, ",orderItemId,", odhOrderItemChgHist.orderItemId, pattern);
        or = orLike(or, all, types, ",siteId,", odhOrderItemChgHist.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(OdhOrderItemChgHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odhOrderItemChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhOrderItemChgHist.orderItemChgHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("orderItemChgHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhOrderItemChgHist.orderItemChgHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhOrderItemChgHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odhOrderItemChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhOrderItemChgHist.orderItemChgHistId));
        }
        return orders;
    }

    /* 주문 아이템 변경 이력 수정 */
    @Override
    public int updateSelective(OdhOrderItemChgHist entity) {
        if (entity.getOrderItemChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhOrderItemChgHist);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(odhOrderItemChgHist.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getOrderId()     != null) { update.set(odhOrderItemChgHist.orderId,     entity.getOrderId());     hasAny = true; }
        if (entity.getOrderItemId() != null) { update.set(odhOrderItemChgHist.orderItemId, entity.getOrderItemId()); hasAny = true; }
        if (entity.getChgTypeCd()   != null) { update.set(odhOrderItemChgHist.chgTypeCd,   entity.getChgTypeCd());   hasAny = true; }
        if (entity.getChgField()    != null) { update.set(odhOrderItemChgHist.chgField,    entity.getChgField());    hasAny = true; }
        if (entity.getBeforeVal()   != null) { update.set(odhOrderItemChgHist.beforeVal,   entity.getBeforeVal());   hasAny = true; }
        if (entity.getAfterVal()    != null) { update.set(odhOrderItemChgHist.afterVal,    entity.getAfterVal());    hasAny = true; }
        if (entity.getChgReason()   != null) { update.set(odhOrderItemChgHist.chgReason,   entity.getChgReason());   hasAny = true; }
        if (entity.getChgUserId()   != null) { update.set(odhOrderItemChgHist.chgUserId,   entity.getChgUserId());   hasAny = true; }
        if (entity.getChgDate()     != null) { update.set(odhOrderItemChgHist.chgDate,     entity.getChgDate());     hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(odhOrderItemChgHist.updBy,       entity.getUpdBy());       hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odhOrderItemChgHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhOrderItemChgHist.orderItemChgHistId.eq(entity.getOrderItemChgHistId())).execute();
        return (int) affected;
    }
}
