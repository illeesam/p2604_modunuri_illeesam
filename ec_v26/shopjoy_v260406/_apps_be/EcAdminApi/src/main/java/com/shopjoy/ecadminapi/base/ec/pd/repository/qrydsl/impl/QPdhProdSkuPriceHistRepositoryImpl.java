package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuPriceHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuPriceHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdhProdSkuPriceHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdhProdSkuPriceHistRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PdhProdSkuPriceHist QueryDSL Custom 구현체 — write-once 로그성 (updBy/updDate 없음) */
@RequiredArgsConstructor
public class QPdhProdSkuPriceHistRepositoryImpl implements QPdhProdSkuPriceHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdhProdSkuPriceHistRepositoryImpl";
    private static final QPdhProdSkuPriceHist pdhProdSkuPriceHist   = QPdhProdSkuPriceHist.pdhProdSkuPriceHist;
    private static final QSySite              sySite = QSySite.sySite;
    private static final QPdProd              pdProd = QPdProd.pdProd;

    /* 상품 SKU 가격 이력 baseSelColumnQuery */
    private JPAQuery<PdhProdSkuPriceHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdSkuPriceHistDto.Item.class,
                        pdhProdSkuPriceHist.histId,
                        pdhProdSkuPriceHist.siteId,
                        pdhProdSkuPriceHist.skuId,
                        pdhProdSkuPriceHist.prodId,
                        pdhProdSkuPriceHist.addPriceBefore,
                        pdhProdSkuPriceHist.addPriceAfter,
                        pdhProdSkuPriceHist.chgReason,
                        pdhProdSkuPriceHist.chgBy,
                        pdhProdSkuPriceHist.chgDate,
                        pdhProdSkuPriceHist.regBy,
                        pdhProdSkuPriceHist.regDate
                ))
                .from(pdhProdSkuPriceHist)
                .leftJoin(sySite).on(sySite.siteId.eq(pdhProdSkuPriceHist.siteId))
                .leftJoin(pdProd).on(pdProd.prodId.eq(pdhProdSkuPriceHist.prodId));
    }

    /* 상품 SKU 가격 이력 키조회 */
    @Override
    public Optional<PdhProdSkuPriceHistDto.Item> selectById(String id) {
        PdhProdSkuPriceHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(pdhProdSkuPriceHist.histId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 SKU 가격 이력 목록조회 */
    @Override
    public List<PdhProdSkuPriceHistDto.Item> selectList(PdhProdSkuPriceHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdSkuPriceHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndSiteId(search),
                baseAndHistId(search),
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

    /* 상품 SKU 가격 이력 페이지조회 */
    @Override
    public PdhProdSkuPriceHistDto.PageResponse selectPageData(PdhProdSkuPriceHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndHistId(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdhProdSkuPriceHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdhProdSkuPriceHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdhProdSkuPriceHist.count())
                .where(wheres)
                .fetchOne();

        PdhProdSkuPriceHistDto.PageResponse res = new PdhProdSkuPriceHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 상품 SKU 가격 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PdhProdSkuPriceHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pdhProdSkuPriceHist.siteId.eq(search.getSiteId()) : null;
    }

    /* histId 정확 일치 */
    private BooleanExpression baseAndHistId(PdhProdSkuPriceHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getHistId())
                ? pdhProdSkuPriceHist.histId.eq(search.getHistId()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PdhProdSkuPriceHistDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",chgBy,", pdhProdSkuPriceHist.chgBy, pattern);
        or = orLike(or, all, types, ",chgReason,", pdhProdSkuPriceHist.chgReason, pattern);
        or = orLike(or, all, types, ",histId,", pdhProdSkuPriceHist.histId, pattern);
        or = orLike(or, all, types, ",prodId,", pdhProdSkuPriceHist.prodId, pattern);
        or = orLike(or, all, types, ",siteId,", pdhProdSkuPriceHist.siteId, pattern);
        or = orLike(or, all, types, ",skuId,", pdhProdSkuPriceHist.skuId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PdhProdSkuPriceHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pdhProdSkuPriceHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdhProdSkuPriceHist.histId));
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
                    orders.add(new OrderSpecifier(order, pdhProdSkuPriceHist.histId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdhProdSkuPriceHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pdhProdSkuPriceHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdhProdSkuPriceHist.histId));
        }
        return orders;
    }

    /* 상품 SKU 가격 이력 수정 */
    @Override
    public int updateSelective(PdhProdSkuPriceHist entity) {
        if (entity.getHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdhProdSkuPriceHist);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(pdhProdSkuPriceHist.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getSkuId()          != null) { update.set(pdhProdSkuPriceHist.skuId,          entity.getSkuId());          hasAny = true; }
        if (entity.getProdId()         != null) { update.set(pdhProdSkuPriceHist.prodId,         entity.getProdId());         hasAny = true; }
        if (entity.getAddPriceBefore() != null) { update.set(pdhProdSkuPriceHist.addPriceBefore, entity.getAddPriceBefore()); hasAny = true; }
        if (entity.getAddPriceAfter()  != null) { update.set(pdhProdSkuPriceHist.addPriceAfter,  entity.getAddPriceAfter());  hasAny = true; }
        if (entity.getChgReason()      != null) { update.set(pdhProdSkuPriceHist.chgReason,      entity.getChgReason());      hasAny = true; }
        if (entity.getChgBy()          != null) { update.set(pdhProdSkuPriceHist.chgBy,          entity.getChgBy());          hasAny = true; }
        if (entity.getChgDate()        != null) { update.set(pdhProdSkuPriceHist.chgDate,        entity.getChgDate());        hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pdhProdSkuPriceHist.histId.eq(entity.getHistId())).execute();
        return (int) affected;
    }
}
