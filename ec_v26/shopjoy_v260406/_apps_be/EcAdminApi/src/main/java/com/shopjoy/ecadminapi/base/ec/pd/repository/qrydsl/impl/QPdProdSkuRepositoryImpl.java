package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSkuDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSku;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdSku;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdSkuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdProdSku QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdSkuRepositoryImpl implements QPdProdSkuRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdSkuRepositoryImpl";
    private static final QPdProdSku pdProdSku = QPdProdSku.pdProdSku;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pdProdSku.regDate,
        "upd_date", pdProdSku.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("prodOptId1", pdProdSku.prodOptId1),
        Map.entry("prodOptId2", pdProdSku.prodOptId2),
        Map.entry("prodId", pdProdSku.prodId),
        Map.entry("siteId", pdProdSku.siteId),
        Map.entry("prodSkuCode", pdProdSku.prodSkuCode),
        Map.entry("prodSkuId", pdProdSku.prodSkuId),
        Map.entry("useYn", pdProdSku.useYn)
    );

    private JPAQuery<PdProdSkuDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdSkuDto.Item.class,
                        pdProdSku.prodSkuId,
                        pdProdSku.prodId,
                        pdProdSku.prodOptId1,
                        pdProdSku.prodOptId2,
                        pdProdSku.prodSkuCode,
                        pdProdSku.addPrice,
                        pdProdSku.useYn,
                        pdProdSku.regBy,
                        pdProdSku.regDate,
                        pdProdSku.updBy,
                        pdProdSku.updDate
                ))
                .from(pdProdSku);
    }

    /* 상품 SKU 키조회 */
    @Override
    public Optional<PdProdSkuDto.Item> selectById(String prodSkuId) {
        PdProdSkuDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdProdSku.prodSkuId.eq(prodSkuId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 SKU 목록조회 */
    @Override
    public List<PdProdSkuDto.Item> selectList(PdProdSkuDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdSkuDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(pdProdSku.prodId, search.getProdIds()),
                    QdslUtil.strEq(pdProdSku.prodId, search.getProdId()),
                    QdslUtil.strEq(pdProdSku.siteId, search.getSiteId()),
                    QdslUtil.strEq(pdProdSku.prodSkuId, search.getProdSkuId()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
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

    /* 상품 SKU 페이지조회 */
    @Override
    public PdProdSkuDto.PageResponse selectPageData(PdProdSkuDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(pdProdSku.prodId, search.getProdIds()),
                QdslUtil.strEq(pdProdSku.prodId, search.getProdId()),
                QdslUtil.strEq(pdProdSku.siteId, search.getSiteId()),
                QdslUtil.strEq(pdProdSku.prodSkuId, search.getProdSkuId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdProdSkuDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdProdSkuDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdSku.count())
                .where(wheres)
                .fetchOne();

        PdProdSkuDto.PageResponse res = new PdProdSkuDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query — DTO 필드만 프로젝션 */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(PdProdSkuDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdProdSkuDto.Request req) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = req == null ? null : req.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pdProdSku.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdSku.prodSkuId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("prodSkuId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdSku.prodSkuId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdSku.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pdProdSku.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdSku.prodSkuId));
        }
        return orders;
    }

    /* 상품 SKU 수정 */

    @Override
    public int updateSelective(PdProdSku entity) {
        if (entity.getProdSkuId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProdSku);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(pdProdSku.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getProdId()       != null) { update.set(pdProdSku.prodId,       entity.getProdId());       hasAny = true; }
        if (entity.getProdOptId1()   != null) { update.set(pdProdSku.prodOptId1,   entity.getProdOptId1());   hasAny = true; }
        if (entity.getProdOptId2()   != null) { update.set(pdProdSku.prodOptId2,   entity.getProdOptId2());   hasAny = true; }
        if (entity.getProdSkuCode()  != null) { update.set(pdProdSku.prodSkuCode,  entity.getProdSkuCode());  hasAny = true; }
        if (entity.getAddPrice()     != null) { update.set(pdProdSku.addPrice,     entity.getAddPrice());     hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(pdProdSku.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(pdProdSku.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdProdSku.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProdSku.prodSkuId.eq(entity.getProdSkuId())).execute();
        return (int) affected;
    }
}
