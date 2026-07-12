package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuStockHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuStockHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdhProdSkuStockHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdhProdSkuStockHistRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PdhProdSkuStockHist QueryDSL Custom 구현체 — write-once 로그성 (updBy/updDate 없음) */
@RequiredArgsConstructor
public class QPdhProdSkuStockHistRepositoryImpl implements QPdhProdSkuStockHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdhProdSkuStockHistRepositoryImpl";
    private static final QPdhProdSkuStockHist pdhProdSkuStockHist      = QPdhProdSkuStockHist.pdhProdSkuStockHist;
    private static final QSySite              sySite    = QSySite.sySite;
    private static final QPdProd              pdProd    = QPdProd.pdProd;
    private static final QSyCode              cd_ssc = new QSyCode("cd_ssc");

    /* 상품 SKU 재고 이력 baseSelColumnQuery */
    private JPAQuery<PdhProdSkuStockHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdSkuStockHistDto.Item.class,
                        pdhProdSkuStockHist.histId,
                        pdhProdSkuStockHist.siteId,
                        pdhProdSkuStockHist.prodSkuId,
                        pdhProdSkuStockHist.prodId,
                        pdhProdSkuStockHist.stockBefore,
                        pdhProdSkuStockHist.stockAfter,
                        pdhProdSkuStockHist.chgQty,
                        pdhProdSkuStockHist.chgReasonCd,
                        pdhProdSkuStockHist.chgReason,
                        pdhProdSkuStockHist.orderItemId,
                        pdhProdSkuStockHist.chgBy,
                        pdhProdSkuStockHist.chgDate,
                        pdhProdSkuStockHist.regBy,
                        pdhProdSkuStockHist.regDate
                ))
                .from(pdhProdSkuStockHist)
                .leftJoin(sySite).on(sySite.siteId.eq(pdhProdSkuStockHist.siteId))
                .leftJoin(pdProd).on(pdProd.prodId.eq(pdhProdSkuStockHist.prodId))
                .leftJoin(cd_ssc).on(cd_ssc.codeGrp.eq("SKU_STOCK_CHG").and(cd_ssc.codeValue.eq(pdhProdSkuStockHist.chgReasonCd)));
    }

    /* 상품 SKU 재고 이력 키조회 */
    @Override
    public Optional<PdhProdSkuStockHistDto.Item> selectById(String id) {
        PdhProdSkuStockHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(pdhProdSkuStockHist.histId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 SKU 재고 이력 목록조회 */
    @Override
    public List<PdhProdSkuStockHistDto.Item> selectList(PdhProdSkuStockHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdSkuStockHistDto.Item> query = baseSelColumnQuery()
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

    /* 상품 SKU 재고 이력 페이지조회 */
    @Override
    public PdhProdSkuStockHistDto.PageResponse selectPageData(PdhProdSkuStockHistDto.Request search) {
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
        JPAQuery<PdhProdSkuStockHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdhProdSkuStockHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdhProdSkuStockHist.count())
                .where(wheres)
                .fetchOne();

        PdhProdSkuStockHistDto.PageResponse res = new PdhProdSkuStockHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 상품 SKU 재고 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PdhProdSkuStockHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pdhProdSkuStockHist.siteId.eq(search.getSiteId()) : null;
    }

    /* histId 정확 일치 */
    private BooleanExpression baseAndHistId(PdhProdSkuStockHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getHistId())
                ? pdhProdSkuStockHist.histId.eq(search.getHistId()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PdhProdSkuStockHistDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",chgBy,", pdhProdSkuStockHist.chgBy, pattern);
        or = orLike(or, all, types, ",chgReason,", pdhProdSkuStockHist.chgReason, pattern);
        or = orLike(or, all, types, ",chgReasonCd,", pdhProdSkuStockHist.chgReasonCd, pattern);
        or = orLike(or, all, types, ",histId,", pdhProdSkuStockHist.histId, pattern);
        or = orLike(or, all, types, ",orderItemId,", pdhProdSkuStockHist.orderItemId, pattern);
        or = orLike(or, all, types, ",prodId,", pdhProdSkuStockHist.prodId, pattern);
        or = orLike(or, all, types, ",siteId,", pdhProdSkuStockHist.siteId, pattern);
        or = orLike(or, all, types, ",skuId,", pdhProdSkuStockHist.prodSkuId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PdhProdSkuStockHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pdhProdSkuStockHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdhProdSkuStockHist.histId));
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
                    orders.add(new OrderSpecifier(order, pdhProdSkuStockHist.histId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdhProdSkuStockHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pdhProdSkuStockHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdhProdSkuStockHist.histId));
        }
        return orders;
    }

    /* 상품 SKU 재고 이력 수정 */
    @Override
    public int updateSelective(PdhProdSkuStockHist entity) {
        if (entity.getHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdhProdSkuStockHist);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(pdhProdSkuStockHist.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getProdSkuId()   != null) { update.set(pdhProdSkuStockHist.prodSkuId,   entity.getProdSkuId());   hasAny = true; }
        if (entity.getProdId()      != null) { update.set(pdhProdSkuStockHist.prodId,      entity.getProdId());      hasAny = true; }
        if (entity.getStockBefore() != null) { update.set(pdhProdSkuStockHist.stockBefore, entity.getStockBefore()); hasAny = true; }
        if (entity.getStockAfter()  != null) { update.set(pdhProdSkuStockHist.stockAfter,  entity.getStockAfter());  hasAny = true; }
        if (entity.getChgQty()      != null) { update.set(pdhProdSkuStockHist.chgQty,      entity.getChgQty());      hasAny = true; }
        if (entity.getChgReasonCd() != null) { update.set(pdhProdSkuStockHist.chgReasonCd, entity.getChgReasonCd()); hasAny = true; }
        if (entity.getChgReason()   != null) { update.set(pdhProdSkuStockHist.chgReason,   entity.getChgReason());   hasAny = true; }
        if (entity.getOrderItemId() != null) { update.set(pdhProdSkuStockHist.orderItemId, entity.getOrderItemId()); hasAny = true; }
        if (entity.getChgBy()       != null) { update.set(pdhProdSkuStockHist.chgBy,       entity.getChgBy());       hasAny = true; }
        if (entity.getChgDate()     != null) { update.set(pdhProdSkuStockHist.chgDate,     entity.getChgDate());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pdhProdSkuStockHist.histId.eq(entity.getHistId())).execute();
        return (int) affected;
    }
}
