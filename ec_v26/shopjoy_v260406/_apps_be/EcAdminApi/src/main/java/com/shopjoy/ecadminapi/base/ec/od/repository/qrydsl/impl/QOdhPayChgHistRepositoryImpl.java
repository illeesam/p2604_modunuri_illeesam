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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhPayChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhPayChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhPayChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhPayChgHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** OdhPayChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhPayChgHistRepositoryImpl implements QOdhPayChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhPayChgHistRepositoryImpl";
    private static final QOdhPayChgHist h = QOdhPayChgHist.odhPayChgHist;

    /* 결제 변경 이력 baseQuery */
    private JPAQuery<OdhPayChgHistDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(OdhPayChgHistDto.Item.class,
                        h.payChgHistId, h.siteId, h.payId, h.orderId,
                        h.payStatusCdBefore, h.payStatusCdAfter,
                        h.chgTypeCd, h.chgReason, h.pgResponse,
                        h.refundAmt, h.refundPgTid,
                        h.chgUserId, h.chgDate, h.memo,
                        h.regBy, h.regDate, h.updBy, h.updDate))
                .from(h);
    }

    /* 결제 변경 이력 키조회 */
    @Override
    public Optional<OdhPayChgHistDto.Item> selectById(String id) {
        OdhPayChgHistDto.Item dto = baseQuery()
                .where(h.payChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 결제 변경 이력 목록조회 */
    @Override
    public List<OdhPayChgHistDto.Item> selectList(OdhPayChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhPayChgHistDto.Item> query = baseQuery().where(
                andSiteId(search),
                andPayChgHistId(search),
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

    /* 결제 변경 이력 페이지조회 */
    @Override
    public OdhPayChgHistDto.PageResponse selectPageList(OdhPayChgHistDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhPayChgHistDto.Item> query = baseQuery().where(
                andSiteId(search),
                andPayChgHistId(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdhPayChgHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(h.count()).from(h).where(
                andSiteId(search),
                andPayChgHistId(search),
                andSearchValue(search)
        ).fetchOne();

        OdhPayChgHistDto.PageResponse res = new OdhPayChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 결제 변경 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(OdhPayChgHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? h.siteId.eq(search.getSiteId()) : null;
    }

    /* payChgHistId 정확 일치 */
    private BooleanExpression andPayChgHistId(OdhPayChgHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getPayChgHistId())
                ? h.payChgHistId.eq(search.getPayChgHistId()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(OdhPayChgHistDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",chgReason,", h.chgReason, pattern);
        or = orLike(or, all, types, ",chgTypeCd,", h.chgTypeCd, pattern);
        or = orLike(or, all, types, ",chgUserId,", h.chgUserId, pattern);
        or = orLike(or, all, types, ",memo,", h.memo, pattern);
        or = orLike(or, all, types, ",orderId,", h.orderId, pattern);
        or = orLike(or, all, types, ",payChgHistId,", h.payChgHistId, pattern);
        or = orLike(or, all, types, ",payId,", h.payId, pattern);
        or = orLike(or, all, types, ",payStatusCdAfter,", h.payStatusCdAfter, pattern);
        or = orLike(or, all, types, ",payStatusCdBefore,", h.payStatusCdBefore, pattern);
        or = orLike(or, all, types, ",pgResponse,", h.pgResponse, pattern);
        or = orLike(or, all, types, ",refundPgTid,", h.refundPgTid, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(OdhPayChgHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, h.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, h.payChgHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("payChgHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.payChgHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, h.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, h.payChgHistId));
        }
        return orders;
    }

    /* 결제 변경 이력 수정 */
    @Override
    public int updateSelective(OdhPayChgHist entity) {
        if (entity.getPayChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(h);
        boolean hasAny = false;

        if (entity.getSiteId()            != null) { update.set(h.siteId,            entity.getSiteId());            hasAny = true; }
        if (entity.getPayId()             != null) { update.set(h.payId,             entity.getPayId());             hasAny = true; }
        if (entity.getOrderId()           != null) { update.set(h.orderId,           entity.getOrderId());           hasAny = true; }
        if (entity.getPayStatusCdBefore() != null) { update.set(h.payStatusCdBefore, entity.getPayStatusCdBefore()); hasAny = true; }
        if (entity.getPayStatusCdAfter()  != null) { update.set(h.payStatusCdAfter,  entity.getPayStatusCdAfter());  hasAny = true; }
        if (entity.getChgTypeCd()         != null) { update.set(h.chgTypeCd,         entity.getChgTypeCd());         hasAny = true; }
        if (entity.getChgReason()         != null) { update.set(h.chgReason,         entity.getChgReason());         hasAny = true; }
        if (entity.getPgResponse()        != null) { update.set(h.pgResponse,        entity.getPgResponse());        hasAny = true; }
        if (entity.getRefundAmt()         != null) { update.set(h.refundAmt,         entity.getRefundAmt());         hasAny = true; }
        if (entity.getRefundPgTid()       != null) { update.set(h.refundPgTid,       entity.getRefundPgTid());       hasAny = true; }
        if (entity.getChgUserId()         != null) { update.set(h.chgUserId,         entity.getChgUserId());         hasAny = true; }
        if (entity.getChgDate()           != null) { update.set(h.chgDate,           entity.getChgDate());           hasAny = true; }
        if (entity.getMemo()              != null) { update.set(h.memo,              entity.getMemo());              hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(h.updBy,             entity.getUpdBy());             hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(h.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(h.payChgHistId.eq(entity.getPayChgHistId())).execute();
        return (int) affected;
    }
}
