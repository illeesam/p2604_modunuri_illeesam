package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdhProdChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdhProdChgHistRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PdhProdChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdhProdChgHistRepositoryImpl implements QPdhProdChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdhProdChgHistRepositoryImpl";
    private static final QPdhProdChgHist h   = QPdhProdChgHist.pdhProdChgHist;
    private static final QSySite        ste = QSySite.sySite;

    /** 기본 쿼리 빌드 */
    private JPAQuery<PdhProdChgHistDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdChgHistDto.Item.class,
                        h.prodChgHistId,
                        h.siteId,
                        h.prodId,
                        h.chgTypeCd,
                        h.beforeVal,
                        h.afterVal,
                        h.chgReason,
                        h.chgUserId,
                        h.chgDate,
                        h.regBy, h.regDate, h.updBy, h.updDate
                ))
                .from(h)
                .leftJoin(ste).on(ste.siteId.eq(h.siteId));
    }

    /* 상품 변경 이력 키조회 */
    @Override
    public Optional<PdhProdChgHistDto.Item> selectById(String id) {
        PdhProdChgHistDto.Item dto = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(h.prodChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 변경 이력 목록조회 */
    @Override
    public List<PdhProdChgHistDto.Item> selectList(PdhProdChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdChgHistDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                andSiteId(search),
                andProdChgHistId(search),
                andDateRange(search),
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

    /* 상품 변경 이력 페이지조회 */
    @Override
    public PdhProdChgHistDto.PageResponse selectPageList(PdhProdChgHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdChgHistDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageList() :: list").where(
                andSiteId(search),
                andProdChgHistId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdhProdChgHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(h.count())
                .from(h)
                .where(
                andSiteId(search),
                andProdChgHistId(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        PdhProdChgHistDto.PageResponse res = new PdhProdChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 — Mapper XML pdhProdChgHistCond 와 동일 동작 */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(PdhProdChgHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? h.siteId.eq(search.getSiteId()) : null;
    }

    /* prodChgHistId 정확 일치 */
    private BooleanExpression andProdChgHistId(PdhProdChgHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdChgHistId())
                ? h.prodChgHistId.eq(search.getProdChgHistId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(PdhProdChgHistDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return h.regDate.goe(start).and(h.regDate.lt(endExcl));
            case "upd_date": return h.updDate.goe(start).and(h.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(PdhProdChgHistDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",afterVal,", h.afterVal, pattern);
        or = orLike(or, all, types, ",beforeVal,", h.beforeVal, pattern);
        or = orLike(or, all, types, ",chgReason,", h.chgReason, pattern);
        or = orLike(or, all, types, ",chgTypeCd,", h.chgTypeCd, pattern);
        or = orLike(or, all, types, ",chgUserId,", h.chgUserId, pattern);
        or = orLike(or, all, types, ",prodChgHistId,", h.prodChgHistId, pattern);
        or = orLike(or, all, types, ",prodId,", h.prodId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PdhProdChgHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, h.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, h.prodChgHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("prodChgHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.prodChgHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, h.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, h.prodChgHistId));
        }
        return orders;
    }

    /** updateSelective — null 이 아닌 필드만 UPDATE */
    @Override
    public int updateSelective(PdhProdChgHist entity) {
        if (entity.getProdChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(h);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(h.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getProdId()      != null) { update.set(h.prodId,      entity.getProdId());      hasAny = true; }
        if (entity.getChgTypeCd()   != null) { update.set(h.chgTypeCd,   entity.getChgTypeCd());   hasAny = true; }
        if (entity.getBeforeVal()   != null) { update.set(h.beforeVal,   entity.getBeforeVal());   hasAny = true; }
        if (entity.getAfterVal()    != null) { update.set(h.afterVal,    entity.getAfterVal());    hasAny = true; }
        if (entity.getChgReason()   != null) { update.set(h.chgReason,   entity.getChgReason());   hasAny = true; }
        if (entity.getChgUserId()   != null) { update.set(h.chgUserId,   entity.getChgUserId());   hasAny = true; }
        if (entity.getChgDate()     != null) { update.set(h.chgDate,     entity.getChgDate());     hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(h.updBy,       entity.getUpdBy());       hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(h.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(h.prodChgHistId.eq(entity.getProdChgHistId())).execute();
        return (int) affected;
    }
}
