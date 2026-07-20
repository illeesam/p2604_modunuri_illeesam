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

import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdhProdSkuPriceHist QueryDSL Custom 구현체 — write-once 로그성 (updBy/updDate 없음) */
@RequiredArgsConstructor
public class QPdhProdSkuPriceHistRepositoryImpl implements QPdhProdSkuPriceHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdhProdSkuPriceHistRepositoryImpl";
    private static final QPdhProdSkuPriceHist pdhProdSkuPriceHist   = QPdhProdSkuPriceHist.pdhProdSkuPriceHist;
    private static final QSySite              sySite = QSySite.sySite;
    private static final QPdProd              pdProd = QPdProd.pdProd;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("chgBy", pdhProdSkuPriceHist.chgBy),
        Map.entry("chgReason", pdhProdSkuPriceHist.chgReason),
        Map.entry("histId", pdhProdSkuPriceHist.histId),
        Map.entry("prodId", pdhProdSkuPriceHist.prodId),
        Map.entry("siteId", pdhProdSkuPriceHist.siteId),
        Map.entry("skuId", pdhProdSkuPriceHist.prodSkuId)
    );

    /* 상품 SKU 가격 이력 baseSelColumnQuery */
    private JPAQuery<PdhProdSkuPriceHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdSkuPriceHistDto.Item.class,
                        pdhProdSkuPriceHist.histId,
                        pdhProdSkuPriceHist.siteId,
                        pdhProdSkuPriceHist.prodSkuId,
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
                QdslUtil.strEq(pdhProdSkuPriceHist.siteId, search.getSiteId()),
                QdslUtil.strEq(pdhProdSkuPriceHist.histId, search.getHistId()),
                andSearchValueLike(search)
        )
        .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
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
                QdslUtil.strEq(pdhProdSkuPriceHist.siteId, search.getSiteId()),
                QdslUtil.strEq(pdhProdSkuPriceHist.histId, search.getHistId()),
                andSearchValueLike(search)
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

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(PdhProdSkuPriceHistDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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
        if (entity.getProdSkuId()      != null) { update.set(pdhProdSkuPriceHist.prodSkuId,      entity.getProdSkuId());      hasAny = true; }
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
