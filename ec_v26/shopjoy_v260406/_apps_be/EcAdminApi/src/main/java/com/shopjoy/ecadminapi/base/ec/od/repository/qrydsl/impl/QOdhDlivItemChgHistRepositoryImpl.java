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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhDlivItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhDlivItemChgHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** OdhDlivItemChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhDlivItemChgHistRepositoryImpl implements QOdhDlivItemChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhDlivItemChgHistRepositoryImpl";
    private static final QOdhDlivItemChgHist h = QOdhDlivItemChgHist.odhDlivItemChgHist;

    /* 배송 아이템 변경 이력 baseQuery */
    private JPAQuery<OdhDlivItemChgHistDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(OdhDlivItemChgHistDto.Item.class,
                        h.dlivItemChgHistId, h.siteId, h.dlivId, h.dlivItemId,
                        h.chgTypeCd, h.chgField, h.beforeVal, h.afterVal,
                        h.chgReason, h.chgUserId, h.chgDate,
                        h.regBy, h.regDate, h.updBy, h.updDate))
                .from(h);
    }

    /* 배송 아이템 변경 이력 키조회 */
    @Override
    public Optional<OdhDlivItemChgHistDto.Item> selectById(String id) {
        OdhDlivItemChgHistDto.Item dto = baseQuery()
                .where(h.dlivItemChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배송 아이템 변경 이력 목록조회 */
    @Override
    public List<OdhDlivItemChgHistDto.Item> selectList(OdhDlivItemChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhDlivItemChgHistDto.Item> query = baseQuery().where(
                andSiteId(search),
                andDlivItemChgHistId(search),
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

    /* 배송 아이템 변경 이력 페이지조회 */
    @Override
    public OdhDlivItemChgHistDto.PageResponse selectPageList(OdhDlivItemChgHistDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhDlivItemChgHistDto.Item> query = baseQuery().where(
                andSiteId(search),
                andDlivItemChgHistId(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdhDlivItemChgHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(h.count()).from(h).where(
                andSiteId(search),
                andDlivItemChgHistId(search),
                andSearchValue(search)
        ).fetchOne();

        OdhDlivItemChgHistDto.PageResponse res = new OdhDlivItemChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 배송 아이템 변경 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(OdhDlivItemChgHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? h.siteId.eq(search.getSiteId()) : null;
    }

    /* dlivItemChgHistId 정확 일치 */
    private BooleanExpression andDlivItemChgHistId(OdhDlivItemChgHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getDlivItemChgHistId())
                ? h.dlivItemChgHistId.eq(search.getDlivItemChgHistId()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(OdhDlivItemChgHistDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",afterVal,", h.afterVal, pattern);
        or = orLike(or, all, types, ",beforeVal,", h.beforeVal, pattern);
        or = orLike(or, all, types, ",chgField,", h.chgField, pattern);
        or = orLike(or, all, types, ",chgReason,", h.chgReason, pattern);
        or = orLike(or, all, types, ",chgTypeCd,", h.chgTypeCd, pattern);
        or = orLike(or, all, types, ",chgUserId,", h.chgUserId, pattern);
        or = orLike(or, all, types, ",dlivId,", h.dlivId, pattern);
        or = orLike(or, all, types, ",dlivItemChgHistId,", h.dlivItemChgHistId, pattern);
        or = orLike(or, all, types, ",dlivItemId,", h.dlivItemId, pattern);
        or = orLike(or, all, types, ",siteId,", h.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(OdhDlivItemChgHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, h.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, h.dlivItemChgHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("dlivItemChgHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.dlivItemChgHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, h.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, h.dlivItemChgHistId));
        }
        return orders;
    }

    /* 배송 아이템 변경 이력 수정 */
    @Override
    public int updateSelective(OdhDlivItemChgHist entity) {
        if (entity.getDlivItemChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(h);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(h.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getDlivId()     != null) { update.set(h.dlivId,     entity.getDlivId());     hasAny = true; }
        if (entity.getDlivItemId() != null) { update.set(h.dlivItemId, entity.getDlivItemId()); hasAny = true; }
        if (entity.getChgTypeCd()  != null) { update.set(h.chgTypeCd,  entity.getChgTypeCd());  hasAny = true; }
        if (entity.getChgField()   != null) { update.set(h.chgField,   entity.getChgField());   hasAny = true; }
        if (entity.getBeforeVal()  != null) { update.set(h.beforeVal,  entity.getBeforeVal());  hasAny = true; }
        if (entity.getAfterVal()   != null) { update.set(h.afterVal,   entity.getAfterVal());   hasAny = true; }
        if (entity.getChgReason()  != null) { update.set(h.chgReason,  entity.getChgReason());  hasAny = true; }
        if (entity.getChgUserId()  != null) { update.set(h.chgUserId,  entity.getChgUserId());  hasAny = true; }
        if (entity.getChgDate()    != null) { update.set(h.chgDate,    entity.getChgDate());    hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(h.updBy,      entity.getUpdBy());      hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(h.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(h.dlivItemChgHistId.eq(entity.getDlivItemChgHistId())).execute();
        return (int) affected;
    }
}
