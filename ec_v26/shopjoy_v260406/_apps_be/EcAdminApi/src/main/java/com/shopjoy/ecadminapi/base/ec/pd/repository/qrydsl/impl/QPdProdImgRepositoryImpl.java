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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdImgDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdImg;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdImg;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdImgRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdProdImg QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdImgRepositoryImpl implements QPdProdImgRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdImgRepositoryImpl";
    private static final QPdProdImg pdProdImg = QPdProdImg.pdProdImg;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pdProdImg.regDate,
        "upd_date", pdProdImg.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("attachId", pdProdImg.attachId),
        Map.entry("cdnHost", pdProdImg.cdnHost),
        Map.entry("cdnImgUrl", pdProdImg.cdnImgUrl),
        Map.entry("cdnThumbUrl", pdProdImg.cdnThumbUrl),
        Map.entry("imgAltText", pdProdImg.imgAltText),
        Map.entry("isThumb", pdProdImg.isThumb),
        Map.entry("prodOptId1", pdProdImg.prodOptId1),
        Map.entry("prodOptId2", pdProdImg.prodOptId2),
        Map.entry("prodId", pdProdImg.prodId),
        Map.entry("prodImgId", pdProdImg.prodImgId),
        Map.entry("siteId", pdProdImg.siteId)
    );

    private JPAQuery<PdProdImgDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdImgDto.Item.class,
                        pdProdImg.prodImgId,
                        pdProdImg.siteId,
                        pdProdImg.prodId,
                        pdProdImg.prodOptId1,
                        pdProdImg.prodOptId2,
                        pdProdImg.attachId,
                        pdProdImg.cdnHost,
                        pdProdImg.cdnImgUrl,
                        pdProdImg.cdnThumbUrl,
                        pdProdImg.imgAltText,
                        pdProdImg.sortOrd,
                        pdProdImg.isThumb,
                        pdProdImg.regBy,
                        pdProdImg.regDate,
                        pdProdImg.updBy,
                        pdProdImg.updDate
                ))
                .from(pdProdImg);
    }

    /* 상품 이미지 키조회 */
    @Override
    public Optional<PdProdImgDto.Item> selectById(String prodImgId) {
        PdProdImgDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdProdImg.prodImgId.eq(prodImgId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 이미지 목록조회 */
    @Override
    public List<PdProdImgDto.Item> selectList(PdProdImgDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdImgDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(pdProdImg.prodId, search.getProdIds()),
                    QdslUtil.strEq(pdProdImg.prodId, search.getProdId()),
                    QdslUtil.strEq(pdProdImg.siteId, search.getSiteId()),
                    QdslUtil.strEq(pdProdImg.prodImgId, search.getProdImgId()),
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

    /* 상품 이미지 페이지조회 */
    @Override
    public PdProdImgDto.PageResponse selectPageData(PdProdImgDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(pdProdImg.prodId, search.getProdIds()),
                QdslUtil.strEq(pdProdImg.prodId, search.getProdId()),
                QdslUtil.strEq(pdProdImg.siteId, search.getSiteId()),
                QdslUtil.strEq(pdProdImg.prodImgId, search.getProdImgId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdProdImgDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdProdImgDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdImg.count())
                .where(wheres)
                .fetchOne();

        PdProdImgDto.PageResponse res = new PdProdImgDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query — DTO 필드만 프로젝션 */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(PdProdImgDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdProdImgDto.Request req) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = req == null ? null : req.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdImg.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdImg.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdImg.prodImgId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("prodImgId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdImg.prodImgId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdImg.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, pdProdImg.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdImg.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdImg.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdImg.prodImgId));
        }
        return orders;
    }

    /* 상품 이미지 수정 */

    @Override
    public int updateSelective(PdProdImg entity) {
        if (entity.getProdImgId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProdImg);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(pdProdImg.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getProdId()      != null) { update.set(pdProdImg.prodId,      entity.getProdId());      hasAny = true; }
        if (entity.getProdOptId1()  != null) { update.set(pdProdImg.prodOptId1,  entity.getProdOptId1());  hasAny = true; }
        if (entity.getProdOptId2()  != null) { update.set(pdProdImg.prodOptId2,  entity.getProdOptId2());  hasAny = true; }
        if (entity.getAttachId()    != null) { update.set(pdProdImg.attachId,    entity.getAttachId());    hasAny = true; }
        if (entity.getCdnHost()     != null) { update.set(pdProdImg.cdnHost,     entity.getCdnHost());     hasAny = true; }
        if (entity.getCdnImgUrl()   != null) { update.set(pdProdImg.cdnImgUrl,   entity.getCdnImgUrl());   hasAny = true; }
        if (entity.getCdnThumbUrl() != null) { update.set(pdProdImg.cdnThumbUrl, entity.getCdnThumbUrl()); hasAny = true; }
        if (entity.getImgAltText()  != null) { update.set(pdProdImg.imgAltText,  entity.getImgAltText());  hasAny = true; }
        if (entity.getSortOrd()     != null) { update.set(pdProdImg.sortOrd,     entity.getSortOrd());     hasAny = true; }
        if (entity.getIsThumb()     != null) { update.set(pdProdImg.isThumb,     entity.getIsThumb());     hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(pdProdImg.updBy,       entity.getUpdBy());       hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdProdImg.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProdImg.prodImgId.eq(entity.getProdImgId())).execute();
        return (int) affected;
    }
}
