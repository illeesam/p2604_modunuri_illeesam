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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdContentChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdContentChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdhProdContentChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdhProdContentChgHistRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PdhProdContentChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdhProdContentChgHistRepositoryImpl implements QPdhProdContentChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdhProdContentChgHistRepositoryImpl";
    private static final QPdhProdContentChgHist a   = QPdhProdContentChgHist.pdhProdContentChgHist;
    private static final QSySite                ste = QSySite.sySite;
    private static final QPdProd                prd = QPdProd.pdProd;
    private static final QSyUser                usr = QSyUser.syUser;

    /* 상품 콘텐츠 변경 이력 baseSelColumnQuery */
    private JPAQuery<PdhProdContentChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdContentChgHistDto.Item.class,
                        a.histId,
                        a.siteId,
                        a.prodId,
                        a.prodContentId,
                        a.contentTypeCd,
                        a.contentBefore,
                        a.contentAfter,
                        a.chgReason,
                        a.chgUserId,
                        a.chgDate,
                        a.regBy, a.regDate, a.updBy, a.updDate
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId))
                .leftJoin(prd).on(prd.prodId.eq(a.prodId))
                .leftJoin(usr).on(usr.userId.eq(a.chgUserId));
    }

    /* 상품 콘텐츠 변경 이력 키조회 */
    @Override
    public Optional<PdhProdContentChgHistDto.Item> selectById(String id) {
        PdhProdContentChgHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(a.histId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 콘텐츠 변경 이력 목록조회 */
    @Override
    public List<PdhProdContentChgHistDto.Item> selectList(PdhProdContentChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdContentChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndSiteId(search),
                baseAndHistId(search),
                baseAndDateRange(search),
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

    /* 상품 콘텐츠 변경 이력 페이지조회 */
    @Override
    public PdhProdContentChgHistDto.PageResponse selectPageData(PdhProdContentChgHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdContentChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list").where(
                baseAndSiteId(search),
                baseAndHistId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdhProdContentChgHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .where(
                baseAndSiteId(search),
                baseAndHistId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        PdhProdContentChgHistDto.PageResponse res = new PdhProdContentChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 상품 콘텐츠 변경 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PdhProdContentChgHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* histId 정확 일치 */
    private BooleanExpression baseAndHistId(PdhProdContentChgHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getHistId())
                ? a.histId.eq(search.getHistId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PdhProdContentChgHistDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            case "upd_date": return a.updDate.goe(start).and(a.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PdhProdContentChgHistDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",chgReason,", a.chgReason, pattern);
        or = orLike(or, all, types, ",chgUserId,", a.chgUserId, pattern);
        or = orLike(or, all, types, ",contentAfter,", a.contentAfter, pattern);
        or = orLike(or, all, types, ",contentBefore,", a.contentBefore, pattern);
        or = orLike(or, all, types, ",contentTypeCd,", a.contentTypeCd, pattern);
        or = orLike(or, all, types, ",histId,", a.histId, pattern);
        or = orLike(or, all, types, ",prodContentId,", a.prodContentId, pattern);
        or = orLike(or, all, types, ",prodId,", a.prodId, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PdhProdContentChgHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.histId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("histId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.histId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.histId));
        }
        return orders;
    }

    /* 상품 콘텐츠 변경 이력 수정 */
    @Override
    public int updateSelective(PdhProdContentChgHist entity) {
        if (entity.getHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(a.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getProdId()        != null) { update.set(a.prodId,        entity.getProdId());        hasAny = true; }
        if (entity.getProdContentId() != null) { update.set(a.prodContentId, entity.getProdContentId()); hasAny = true; }
        if (entity.getContentTypeCd() != null) { update.set(a.contentTypeCd, entity.getContentTypeCd()); hasAny = true; }
        if (entity.getContentBefore() != null) { update.set(a.contentBefore, entity.getContentBefore()); hasAny = true; }
        if (entity.getContentAfter()  != null) { update.set(a.contentAfter,  entity.getContentAfter());  hasAny = true; }
        if (entity.getChgReason()     != null) { update.set(a.chgReason,     entity.getChgReason());     hasAny = true; }
        if (entity.getChgUserId()     != null) { update.set(a.chgUserId,     entity.getChgUserId());     hasAny = true; }
        if (entity.getChgDate()       != null) { update.set(a.chgDate,       entity.getChgDate());       hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(a.updBy,         entity.getUpdBy());         hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.histId.eq(entity.getHistId())).execute();
        return (int) affected;
    }
}
