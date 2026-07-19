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
    private static final QPdhProdChgHist pdhProdChgHist   = QPdhProdChgHist.pdhProdChgHist;
    private static final QSySite        sySite = QSySite.sySite;

    /** 기본 쿼리 빌드 */
    private JPAQuery<PdhProdChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdChgHistDto.Item.class,
                        pdhProdChgHist.prodChgHistId,
                        pdhProdChgHist.siteId,
                        pdhProdChgHist.prodId,
                        pdhProdChgHist.chgTypeCd,
                        pdhProdChgHist.beforeVal,
                        pdhProdChgHist.afterVal,
                        pdhProdChgHist.chgReason,
                        pdhProdChgHist.chgUserId,
                        pdhProdChgHist.chgDate,
                        pdhProdChgHist.regBy, pdhProdChgHist.regDate, pdhProdChgHist.updBy, pdhProdChgHist.updDate
                ))
                .from(pdhProdChgHist)
                .leftJoin(sySite).on(sySite.siteId.eq(pdhProdChgHist.siteId));
    }

    /* 상품 변경 이력 키조회 */
    @Override
    public Optional<PdhProdChgHistDto.Item> selectById(String id) {
        PdhProdChgHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(pdhProdChgHist.prodChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 변경 이력 목록조회 */
    @Override
    public List<PdhProdChgHistDto.Item> selectList(PdhProdChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                andSiteIdEq(search),
                andProdChgHistIdEq(search),
                andDateRangeBetween(search),
                andSearchValueLike(search)
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

    /* 상품 변경 이력 페이지조회 */
    @Override
    public PdhProdChgHistDto.PageResponse selectPageData(PdhProdChgHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andSiteIdEq(search),
                andProdChgHistIdEq(search),
                andDateRangeBetween(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdhProdChgHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdhProdChgHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdhProdChgHist.count())
                .where(wheres)
                .fetchOne();

        PdhProdChgHistDto.PageResponse res = new PdhProdChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 — Mapper XML pdhProdChgHistCond 와 동일 동작 */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteIdEq(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteIdEq(PdhProdChgHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pdhProdChgHist.siteId.eq(search.getSiteId()) : null;
    }

    /* prodChgHistId 정확 일치 */
    private BooleanExpression andProdChgHistIdEq(PdhProdChgHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdChgHistId())
                ? pdhProdChgHist.prodChgHistId.eq(search.getProdChgHistId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRangeBetween(PdhProdChgHistDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pdhProdChgHist.regDate.goe(start).and(pdhProdChgHist.regDate.lt(endExcl));
            case "upd_date": return pdhProdChgHist.updDate.goe(start).and(pdhProdChgHist.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValueLike(PdhProdChgHistDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",afterVal,", pdhProdChgHist.afterVal, pattern);
        or = orLike(or, all, types, ",beforeVal,", pdhProdChgHist.beforeVal, pattern);
        or = orLike(or, all, types, ",chgReason,", pdhProdChgHist.chgReason, pattern);
        or = orLike(or, all, types, ",chgTypeCd,", pdhProdChgHist.chgTypeCd, pattern);
        or = orLike(or, all, types, ",chgUserId,", pdhProdChgHist.chgUserId, pattern);
        or = orLike(or, all, types, ",prodChgHistId,", pdhProdChgHist.prodChgHistId, pattern);
        or = orLike(or, all, types, ",prodId,", pdhProdChgHist.prodId, pattern);
        or = orLike(or, all, types, ",siteId,", pdhProdChgHist.siteId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, pdhProdChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdhProdChgHist.prodChgHistId));
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
                    orders.add(new OrderSpecifier(order, pdhProdChgHist.prodChgHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdhProdChgHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pdhProdChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdhProdChgHist.prodChgHistId));
        }
        return orders;
    }

    /** updateSelective — null 이 아닌 필드만 UPDATE */
    @Override
    public int updateSelective(PdhProdChgHist entity) {
        if (entity.getProdChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdhProdChgHist);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(pdhProdChgHist.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getProdId()      != null) { update.set(pdhProdChgHist.prodId,      entity.getProdId());      hasAny = true; }
        if (entity.getChgTypeCd()   != null) { update.set(pdhProdChgHist.chgTypeCd,   entity.getChgTypeCd());   hasAny = true; }
        if (entity.getBeforeVal()   != null) { update.set(pdhProdChgHist.beforeVal,   entity.getBeforeVal());   hasAny = true; }
        if (entity.getAfterVal()    != null) { update.set(pdhProdChgHist.afterVal,    entity.getAfterVal());    hasAny = true; }
        if (entity.getChgReason()   != null) { update.set(pdhProdChgHist.chgReason,   entity.getChgReason());   hasAny = true; }
        if (entity.getChgUserId()   != null) { update.set(pdhProdChgHist.chgUserId,   entity.getChgUserId());   hasAny = true; }
        if (entity.getChgDate()     != null) { update.set(pdhProdChgHist.chgDate,     entity.getChgDate());     hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(pdhProdChgHist.updBy,       entity.getUpdBy());       hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdhProdChgHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdhProdChgHist.prodChgHistId.eq(entity.getProdChgHistId())).execute();
        return (int) affected;
    }
}
