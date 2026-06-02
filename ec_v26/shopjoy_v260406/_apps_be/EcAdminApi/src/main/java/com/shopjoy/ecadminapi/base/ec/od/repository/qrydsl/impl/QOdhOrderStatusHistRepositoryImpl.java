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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhOrderStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhOrderStatusHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** OdhOrderStatusHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhOrderStatusHistRepositoryImpl implements QOdhOrderStatusHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhOrderStatusHistRepositoryImpl";
    private static final QOdhOrderStatusHist odhOrderStatusHist = QOdhOrderStatusHist.odhOrderStatusHist;

    /* 주문 상태 이력 baseSelColumnQuery */
    private JPAQuery<OdhOrderStatusHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhOrderStatusHistDto.Item.class,
                        odhOrderStatusHist.orderStatusHistId, odhOrderStatusHist.siteId, odhOrderStatusHist.orderId,
                        odhOrderStatusHist.orderStatusCdBefore, odhOrderStatusHist.orderStatusCd, odhOrderStatusHist.statusReason,
                        odhOrderStatusHist.chgUserId, odhOrderStatusHist.chgDate, odhOrderStatusHist.memo,
                        odhOrderStatusHist.regBy, odhOrderStatusHist.regDate, odhOrderStatusHist.updBy, odhOrderStatusHist.updDate))
                .from(odhOrderStatusHist);
    }

    /* 주문 상태 이력 키조회 */
    @Override
    public Optional<OdhOrderStatusHistDto.Item> selectById(String id) {
        OdhOrderStatusHistDto.Item dto = baseSelColumnQuery()
                .where(odhOrderStatusHist.orderStatusHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 주문 상태 이력 목록조회 */
    @Override
    public List<OdhOrderStatusHistDto.Item> selectList(OdhOrderStatusHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhOrderStatusHistDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndOrderStatusHistId(search),
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

    /* 주문 상태 이력 페이지조회 */
    @Override
    public OdhOrderStatusHistDto.PageResponse selectPageData(OdhOrderStatusHistDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndOrderStatusHistId(search),
                baseAndSearchValue(search)
        };

        JPAQuery<OdhOrderStatusHistDto.Item> query = baseSelColumnQuery().where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdhOrderStatusHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(odhOrderStatusHist.count()).from(odhOrderStatusHist).where(wheres).fetchOne();

        OdhOrderStatusHistDto.PageResponse res = new OdhOrderStatusHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 주문 상태 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(OdhOrderStatusHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? odhOrderStatusHist.siteId.eq(search.getSiteId()) : null;
    }

    /* orderStatusHistId 정확 일치 */
    private BooleanExpression baseAndOrderStatusHistId(OdhOrderStatusHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderStatusHistId())
                ? odhOrderStatusHist.orderStatusHistId.eq(search.getOrderStatusHistId()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(OdhOrderStatusHistDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",chgUserId,", odhOrderStatusHist.chgUserId, pattern);
        or = orLike(or, all, types, ",memo,", odhOrderStatusHist.memo, pattern);
        or = orLike(or, all, types, ",orderId,", odhOrderStatusHist.orderId, pattern);
        or = orLike(or, all, types, ",orderStatusCd,", odhOrderStatusHist.orderStatusCd, pattern);
        or = orLike(or, all, types, ",orderStatusCdBefore,", odhOrderStatusHist.orderStatusCdBefore, pattern);
        or = orLike(or, all, types, ",orderStatusHistId,", odhOrderStatusHist.orderStatusHistId, pattern);
        or = orLike(or, all, types, ",siteId,", odhOrderStatusHist.siteId, pattern);
        or = orLike(or, all, types, ",statusReason,", odhOrderStatusHist.statusReason, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(OdhOrderStatusHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odhOrderStatusHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhOrderStatusHist.orderStatusHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("orderStatusHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhOrderStatusHist.orderStatusHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhOrderStatusHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odhOrderStatusHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhOrderStatusHist.orderStatusHistId));
        }
        return orders;
    }

    /* 주문 상태 이력 수정 */
    @Override
    public int updateSelective(OdhOrderStatusHist entity) {
        if (entity.getOrderStatusHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhOrderStatusHist);
        boolean hasAny = false;

        if (entity.getSiteId()              != null) { update.set(odhOrderStatusHist.siteId,              entity.getSiteId());              hasAny = true; }
        if (entity.getOrderId()             != null) { update.set(odhOrderStatusHist.orderId,             entity.getOrderId());             hasAny = true; }
        if (entity.getOrderStatusCdBefore() != null) { update.set(odhOrderStatusHist.orderStatusCdBefore, entity.getOrderStatusCdBefore()); hasAny = true; }
        if (entity.getOrderStatusCd()       != null) { update.set(odhOrderStatusHist.orderStatusCd,       entity.getOrderStatusCd());       hasAny = true; }
        if (entity.getStatusReason()        != null) { update.set(odhOrderStatusHist.statusReason,        entity.getStatusReason());        hasAny = true; }
        if (entity.getChgUserId()           != null) { update.set(odhOrderStatusHist.chgUserId,           entity.getChgUserId());           hasAny = true; }
        if (entity.getChgDate()             != null) { update.set(odhOrderStatusHist.chgDate,             entity.getChgDate());             hasAny = true; }
        if (entity.getMemo()                != null) { update.set(odhOrderStatusHist.memo,                entity.getMemo());                hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(odhOrderStatusHist.updBy,               entity.getUpdBy());               hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odhOrderStatusHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhOrderStatusHist.orderStatusHistId.eq(entity.getOrderStatusHistId())).execute();
        return (int) affected;
    }
}
