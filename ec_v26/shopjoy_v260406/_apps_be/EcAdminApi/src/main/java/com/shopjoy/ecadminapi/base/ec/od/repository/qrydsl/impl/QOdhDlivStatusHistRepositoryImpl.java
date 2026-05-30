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
    private static final QOdhDlivStatusHist h = QOdhDlivStatusHist.odhDlivStatusHist;

    /* 배송 상태 이력 baseQuery */
    private JPAQuery<OdhDlivStatusHistDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(OdhDlivStatusHistDto.Item.class,
                        h.dlivStatusHistId, h.siteId, h.dlivId, h.orderId,
                        h.dlivStatusCdBefore, h.dlivStatusCd, h.statusReason,
                        h.chgUserId, h.chgDate, h.memo,
                        h.regBy, h.regDate, h.updBy, h.updDate))
                .from(h);
    }

    /* 배송 상태 이력 키조회 */
    @Override
    public Optional<OdhDlivStatusHistDto.Item> selectById(String id) {
        OdhDlivStatusHistDto.Item dto = baseQuery()
                .where(h.dlivStatusHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배송 상태 이력 목록조회 */
    @Override
    public List<OdhDlivStatusHistDto.Item> selectList(OdhDlivStatusHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhDlivStatusHistDto.Item> query = baseQuery().where(
                andSiteId(search),
                andDlivStatusHistId(search),
                andSearchValue(search)
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

    /* 배송 상태 이력 페이지조회 */
    @Override
    public OdhDlivStatusHistDto.PageResponse selectPageList(OdhDlivStatusHistDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhDlivStatusHistDto.Item> query = baseQuery().where(
                andSiteId(search),
                andDlivStatusHistId(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdhDlivStatusHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(h.count()).from(h).where(
                andSiteId(search),
                andDlivStatusHistId(search),
                andSearchValue(search)
        ).fetchOne();

        OdhDlivStatusHistDto.PageResponse res = new OdhDlivStatusHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 배송 상태 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(OdhDlivStatusHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? h.siteId.eq(search.getSiteId()) : null;
    }

    /* dlivStatusHistId 정확 일치 */
    private BooleanExpression andDlivStatusHistId(OdhDlivStatusHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getDlivStatusHistId())
                ? h.dlivStatusHistId.eq(search.getDlivStatusHistId()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(OdhDlivStatusHistDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",chgUserId,", h.chgUserId, pattern);
        or = orLike(or, all, types, ",dlivId,", h.dlivId, pattern);
        or = orLike(or, all, types, ",dlivStatusCd,", h.dlivStatusCd, pattern);
        or = orLike(or, all, types, ",dlivStatusCdBefore,", h.dlivStatusCdBefore, pattern);
        or = orLike(or, all, types, ",dlivStatusHistId,", h.dlivStatusHistId, pattern);
        or = orLike(or, all, types, ",memo,", h.memo, pattern);
        or = orLike(or, all, types, ",orderId,", h.orderId, pattern);
        or = orLike(or, all, types, ",siteId,", h.siteId, pattern);
        or = orLike(or, all, types, ",statusReason,", h.statusReason, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, h.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, h.dlivStatusHistId));
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
                    orders.add(new OrderSpecifier(order, h.dlivStatusHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, h.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, h.dlivStatusHistId));
        }
        return orders;
    }

    /* 배송 상태 이력 수정 */
    @Override
    public int updateSelective(OdhDlivStatusHist entity) {
        if (entity.getDlivStatusHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(h);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(h.siteId,             entity.getSiteId());             hasAny = true; }
        if (entity.getDlivId()             != null) { update.set(h.dlivId,             entity.getDlivId());             hasAny = true; }
        if (entity.getOrderId()            != null) { update.set(h.orderId,            entity.getOrderId());            hasAny = true; }
        if (entity.getDlivStatusCdBefore() != null) { update.set(h.dlivStatusCdBefore, entity.getDlivStatusCdBefore()); hasAny = true; }
        if (entity.getDlivStatusCd()       != null) { update.set(h.dlivStatusCd,       entity.getDlivStatusCd());       hasAny = true; }
        if (entity.getStatusReason()       != null) { update.set(h.statusReason,       entity.getStatusReason());       hasAny = true; }
        if (entity.getChgUserId()          != null) { update.set(h.chgUserId,          entity.getChgUserId());          hasAny = true; }
        if (entity.getChgDate()            != null) { update.set(h.chgDate,            entity.getChgDate());            hasAny = true; }
        if (entity.getMemo()               != null) { update.set(h.memo,               entity.getMemo());               hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(h.updBy,              entity.getUpdBy());              hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(h.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(h.dlivStatusHistId.eq(entity.getDlivStatusHistId())).execute();
        return (int) affected;
    }
}
