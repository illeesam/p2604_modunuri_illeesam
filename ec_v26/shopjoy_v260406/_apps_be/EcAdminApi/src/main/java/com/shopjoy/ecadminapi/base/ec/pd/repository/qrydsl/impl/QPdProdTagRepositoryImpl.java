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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdTag;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdTag;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdTagRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdProdTag QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdTagRepositoryImpl implements QPdProdTagRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdTagRepositoryImpl";
    private static final QPdProdTag pdProdTag   = QPdProdTag.pdProdTag;
    private static final QPdProd    pdProd = QPdProd.pdProd;
    private static final QSySite    sySite = QSySite.sySite;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pdProdTag.regDate,
        "upd_date", pdProdTag.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("prodId", pdProdTag.prodId),
        Map.entry("prodTagId", pdProdTag.prodTagId),
        Map.entry("siteId", pdProdTag.siteId),
        Map.entry("tagId", pdProdTag.tagId)
    );

    /* 상품 태그 baseSelColumnQuery */
    private JPAQuery<PdProdTagDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdTagDto.Item.class,
                        pdProdTag.prodTagId, pdProdTag.siteId, pdProdTag.prodId, pdProdTag.tagId,
                        pdProdTag.regBy, pdProdTag.regDate
                ))
                .from(pdProdTag)
                .leftJoin(pdProd).on(pdProd.prodId.eq(pdProdTag.prodId))
                .leftJoin(sySite).on(sySite.siteId.eq(pdProdTag.siteId));
    }

    /* 상품 태그 키조회 */
    @Override
    public Optional<PdProdTagDto.Item> selectById(String prodTagId) {
        PdProdTagDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdProdTag.prodTagId.eq(prodTagId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 태그 목록조회 */
    @Override
    public List<PdProdTagDto.Item> selectList(PdProdTagDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdTagDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pdProdTag.siteId, search.getSiteId()),
                    QdslUtil.strEq(pdProdTag.prodTagId, search.getProdTagId()),
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

    /* 상품 태그 페이지조회 */
    @Override
    public PdProdTagDto.PageResponse selectPageData(PdProdTagDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pdProdTag.siteId, search.getSiteId()),
                QdslUtil.strEq(pdProdTag.prodTagId, search.getProdTagId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdProdTagDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdProdTagDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdTag.count())
                .where(wheres)
                .fetchOne();

        PdProdTagDto.PageResponse res = new PdProdTagDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* 상품 태그 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(PdProdTagDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdProdTagDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pdProdTag.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdTag.prodTagId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("prodTagId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdTag.prodTagId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdTag.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pdProdTag.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdTag.prodTagId));
        }
        return orders;
    }

    /* 상품 태그 수정 */

    @Override
    public int updateSelective(PdProdTag entity) {
        if (entity.getProdTagId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProdTag);
        boolean hasAny = false;

        if (entity.getSiteId() != null) { update.set(pdProdTag.siteId, entity.getSiteId()); hasAny = true; }
        if (entity.getProdId() != null) { update.set(pdProdTag.prodId, entity.getProdId()); hasAny = true; }
        if (entity.getTagId()  != null) { update.set(pdProdTag.tagId,  entity.getTagId());  hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pdProdTag.prodTagId.eq(entity.getProdTagId())).execute();
        return (int) affected;
    }
}
