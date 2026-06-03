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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhOrderChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhOrderChgHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** OdhOrderChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhOrderChgHistRepositoryImpl implements QOdhOrderChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhOrderChgHistRepositoryImpl";
    private static final QOdhOrderChgHist odhOrderChgHist = QOdhOrderChgHist.odhOrderChgHist;

    /* 주문 변경 이력 baseSelColumnQuery */
    private JPAQuery<OdhOrderChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhOrderChgHistDto.Item.class,
                        odhOrderChgHist.orderChgHistId, odhOrderChgHist.siteId, odhOrderChgHist.orderId,
                        odhOrderChgHist.chgTypeCd, odhOrderChgHist.chgField, odhOrderChgHist.beforeVal, odhOrderChgHist.afterVal,
                        odhOrderChgHist.chgReason, odhOrderChgHist.chgUserId, odhOrderChgHist.chgDate,
                        odhOrderChgHist.regBy, odhOrderChgHist.regDate, odhOrderChgHist.updBy, odhOrderChgHist.updDate))
                .from(odhOrderChgHist);
    }

    /* 주문 변경 이력 키조회 */
    @Override
    public Optional<OdhOrderChgHistDto.Item> selectById(String id) {
        OdhOrderChgHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhOrderChgHist.orderChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 주문 변경 이력 목록조회 */
    @Override
    public List<OdhOrderChgHistDto.Item> selectList(OdhOrderChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhOrderChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndOrderChgHistId(search),
                    baseAndSearchValue(search)
                );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 주문 변경 이력 페이지조회 */
    @Override
    public OdhOrderChgHistDto.PageResponse selectPageData(OdhOrderChgHistDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndOrderChgHistId(search),
                baseAndSearchValue(search)
        };

        JPAQuery<OdhOrderChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdhOrderChgHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(odhOrderChgHist.count())
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .from(odhOrderChgHist)
                .where(wheres)
                .fetchOne();

        OdhOrderChgHistDto.PageResponse res = new OdhOrderChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 주문 변경 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(OdhOrderChgHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? odhOrderChgHist.siteId.eq(search.getSiteId()) : null;
    }

    /* orderChgHistId 정확 일치 */
    private BooleanExpression baseAndOrderChgHistId(OdhOrderChgHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderChgHistId())
                ? odhOrderChgHist.orderChgHistId.eq(search.getOrderChgHistId()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(OdhOrderChgHistDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",afterVal,", odhOrderChgHist.afterVal, pattern);
        or = orLike(or, all, types, ",beforeVal,", odhOrderChgHist.beforeVal, pattern);
        or = orLike(or, all, types, ",chgField,", odhOrderChgHist.chgField, pattern);
        or = orLike(or, all, types, ",chgReason,", odhOrderChgHist.chgReason, pattern);
        or = orLike(or, all, types, ",chgTypeCd,", odhOrderChgHist.chgTypeCd, pattern);
        or = orLike(or, all, types, ",chgUserId,", odhOrderChgHist.chgUserId, pattern);
        or = orLike(or, all, types, ",orderChgHistId,", odhOrderChgHist.orderChgHistId, pattern);
        or = orLike(or, all, types, ",orderId,", odhOrderChgHist.orderId, pattern);
        or = orLike(or, all, types, ",siteId,", odhOrderChgHist.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(OdhOrderChgHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odhOrderChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhOrderChgHist.orderChgHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("orderChgHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhOrderChgHist.orderChgHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhOrderChgHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odhOrderChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhOrderChgHist.orderChgHistId));
        }
        return orders;
    }

    /* 주문 변경 이력 수정 */
    @Override
    public int updateSelective(OdhOrderChgHist entity) {
        if (entity.getOrderChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhOrderChgHist);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(odhOrderChgHist.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getOrderId()    != null) { update.set(odhOrderChgHist.orderId,    entity.getOrderId());    hasAny = true; }
        if (entity.getChgTypeCd()  != null) { update.set(odhOrderChgHist.chgTypeCd,  entity.getChgTypeCd());  hasAny = true; }
        if (entity.getChgField()   != null) { update.set(odhOrderChgHist.chgField,   entity.getChgField());   hasAny = true; }
        if (entity.getBeforeVal()  != null) { update.set(odhOrderChgHist.beforeVal,  entity.getBeforeVal());  hasAny = true; }
        if (entity.getAfterVal()   != null) { update.set(odhOrderChgHist.afterVal,   entity.getAfterVal());   hasAny = true; }
        if (entity.getChgReason()  != null) { update.set(odhOrderChgHist.chgReason,  entity.getChgReason());  hasAny = true; }
        if (entity.getChgUserId()  != null) { update.set(odhOrderChgHist.chgUserId,  entity.getChgUserId());  hasAny = true; }
        if (entity.getChgDate()    != null) { update.set(odhOrderChgHist.chgDate,    entity.getChgDate());    hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(odhOrderChgHist.updBy,      entity.getUpdBy());      hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odhOrderChgHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhOrderChgHist.orderChgHistId.eq(entity.getOrderChgHistId())).execute();
        return (int) affected;
    }
}
