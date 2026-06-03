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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhDlivStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhDlivStatusHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** OdhDlivStatusHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhDlivStatusHistRepositoryImpl implements QOdhDlivStatusHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhDlivStatusHistRepositoryImpl";
    private static final QOdhDlivStatusHist odhDlivStatusHist = QOdhDlivStatusHist.odhDlivStatusHist;

    /* 배송 상태 이력 baseSelColumnQuery */
    private JPAQuery<OdhDlivStatusHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhDlivStatusHistDto.Item.class,
                        odhDlivStatusHist.dlivStatusHistId, odhDlivStatusHist.siteId, odhDlivStatusHist.dlivId, odhDlivStatusHist.orderId,
                        odhDlivStatusHist.dlivStatusCdBefore, odhDlivStatusHist.dlivStatusCd, odhDlivStatusHist.statusReason,
                        odhDlivStatusHist.chgUserId, odhDlivStatusHist.chgDate, odhDlivStatusHist.memo,
                        odhDlivStatusHist.regBy, odhDlivStatusHist.regDate, odhDlivStatusHist.updBy, odhDlivStatusHist.updDate))
                .from(odhDlivStatusHist);
    }

    /* 배송 상태 이력 키조회 */
    @Override
    public Optional<OdhDlivStatusHistDto.Item> selectById(String id) {
        OdhDlivStatusHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhDlivStatusHist.dlivStatusHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배송 상태 이력 목록조회 */
    @Override
    public List<OdhDlivStatusHistDto.Item> selectList(OdhDlivStatusHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhDlivStatusHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndDlivStatusHistId(search),
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

    /* 배송 상태 이력 페이지조회 */
    @Override
    public OdhDlivStatusHistDto.PageResponse selectPageData(OdhDlivStatusHistDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndDlivStatusHistId(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdhDlivStatusHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdhDlivStatusHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhDlivStatusHist.count())
                .where(wheres)
                .fetchOne();

        OdhDlivStatusHistDto.PageResponse res = new OdhDlivStatusHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 배송 상태 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(OdhDlivStatusHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? odhDlivStatusHist.siteId.eq(search.getSiteId()) : null;
    }

    /* dlivStatusHistId 정확 일치 */
    private BooleanExpression baseAndDlivStatusHistId(OdhDlivStatusHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getDlivStatusHistId())
                ? odhDlivStatusHist.dlivStatusHistId.eq(search.getDlivStatusHistId()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(OdhDlivStatusHistDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",chgUserId,", odhDlivStatusHist.chgUserId, pattern);
        or = orLike(or, all, types, ",dlivId,", odhDlivStatusHist.dlivId, pattern);
        or = orLike(or, all, types, ",dlivStatusCd,", odhDlivStatusHist.dlivStatusCd, pattern);
        or = orLike(or, all, types, ",dlivStatusCdBefore,", odhDlivStatusHist.dlivStatusCdBefore, pattern);
        or = orLike(or, all, types, ",dlivStatusHistId,", odhDlivStatusHist.dlivStatusHistId, pattern);
        or = orLike(or, all, types, ",memo,", odhDlivStatusHist.memo, pattern);
        or = orLike(or, all, types, ",orderId,", odhDlivStatusHist.orderId, pattern);
        or = orLike(or, all, types, ",siteId,", odhDlivStatusHist.siteId, pattern);
        or = orLike(or, all, types, ",statusReason,", odhDlivStatusHist.statusReason, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(OdhDlivStatusHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odhDlivStatusHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhDlivStatusHist.dlivStatusHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("dlivStatusHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhDlivStatusHist.dlivStatusHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhDlivStatusHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odhDlivStatusHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhDlivStatusHist.dlivStatusHistId));
        }
        return orders;
    }

    /* 배송 상태 이력 수정 */
    @Override
    public int updateSelective(OdhDlivStatusHist entity) {
        if (entity.getDlivStatusHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhDlivStatusHist);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(odhDlivStatusHist.siteId,             entity.getSiteId());             hasAny = true; }
        if (entity.getDlivId()             != null) { update.set(odhDlivStatusHist.dlivId,             entity.getDlivId());             hasAny = true; }
        if (entity.getOrderId()            != null) { update.set(odhDlivStatusHist.orderId,            entity.getOrderId());            hasAny = true; }
        if (entity.getDlivStatusCdBefore() != null) { update.set(odhDlivStatusHist.dlivStatusCdBefore, entity.getDlivStatusCdBefore()); hasAny = true; }
        if (entity.getDlivStatusCd()       != null) { update.set(odhDlivStatusHist.dlivStatusCd,       entity.getDlivStatusCd());       hasAny = true; }
        if (entity.getStatusReason()       != null) { update.set(odhDlivStatusHist.statusReason,       entity.getStatusReason());       hasAny = true; }
        if (entity.getChgUserId()          != null) { update.set(odhDlivStatusHist.chgUserId,          entity.getChgUserId());          hasAny = true; }
        if (entity.getChgDate()            != null) { update.set(odhDlivStatusHist.chgDate,            entity.getChgDate());            hasAny = true; }
        if (entity.getMemo()               != null) { update.set(odhDlivStatusHist.memo,               entity.getMemo());               hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(odhDlivStatusHist.updBy,              entity.getUpdBy());              hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odhDlivStatusHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhDlivStatusHist.dlivStatusHistId.eq(entity.getDlivStatusHistId())).execute();
        return (int) affected;
    }
}
