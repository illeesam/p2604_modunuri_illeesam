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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdContentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdContent;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdContent;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PdProdContent QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdContentRepositoryImpl implements QPdProdContentRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdContentRepositoryImpl";
    private static final QPdProdContent pdProdContent = QPdProdContent.pdProdContent;

    private JPAQuery<PdProdContentDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdContentDto.Item.class,
                        pdProdContent.prodContentId,
                        pdProdContent.siteId,
                        pdProdContent.prodId,
                        pdProdContent.contentTypeCd,
                        pdProdContent.contentHtml,
                        pdProdContent.sortOrd,
                        pdProdContent.useYn,
                        pdProdContent.regBy,
                        pdProdContent.regDate,
                        pdProdContent.updBy,
                        pdProdContent.updDate
                ))
                .from(pdProdContent);
    }

    /* 상품 상세 콘텐츠 키조회 */
    @Override
    public Optional<PdProdContentDto.Item> selectById(String prodContentId) {
        PdProdContentDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdProdContent.prodContentId.eq(prodContentId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 상세 콘텐츠 목록조회 */
    @Override
    public List<PdProdContentDto.Item> selectList(PdProdContentDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdContentDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndProdId(search),
                    baseAndSiteId(search),
                    baseAndProdContentId(search),
                    baseAndDateRange(search),
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

    /* 상품 상세 콘텐츠 페이지조회 */
    @Override
    public PdProdContentDto.PageResponse selectPageData(PdProdContentDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndProdId(search),
                baseAndSiteId(search),
                baseAndProdContentId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdProdContentDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdProdContentDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdContent.count())
                .where(wheres)
                .fetchOne();

        PdProdContentDto.PageResponse res = new PdProdContentDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query — DTO 필드만 프로젝션 */
    /* 상품 상세 콘텐츠 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* prodId 정확 일치 */
    private BooleanExpression baseAndProdId(PdProdContentDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdId())
                ? pdProdContent.prodId.eq(search.getProdId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PdProdContentDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pdProdContent.siteId.eq(search.getSiteId()) : null;
    }

    /* prodContentId 정확 일치 */
    private BooleanExpression baseAndProdContentId(PdProdContentDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdContentId())
                ? pdProdContent.prodContentId.eq(search.getProdContentId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PdProdContentDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pdProdContent.regDate.goe(start).and(pdProdContent.regDate.lt(endExcl));
            case "upd_date": return pdProdContent.updDate.goe(start).and(pdProdContent.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PdProdContentDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",contentHtml,", pdProdContent.contentHtml, pattern);
        or = orLike(or, all, types, ",contentTypeCd,", pdProdContent.contentTypeCd, pattern);
        or = orLike(or, all, types, ",prodContentId,", pdProdContent.prodContentId, pattern);
        or = orLike(or, all, types, ",prodId,", pdProdContent.prodId, pattern);
        or = orLike(or, all, types, ",siteId,", pdProdContent.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", pdProdContent.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PdProdContentDto.Request req) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = req == null ? null : req.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdContent.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdContent.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdContent.prodContentId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("prodContentId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdContent.prodContentId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdContent.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, pdProdContent.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdContent.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdContent.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdContent.prodContentId));
        }
        return orders;
    }

    /* 상품 상세 콘텐츠 수정 */

    @Override
    public int updateSelective(PdProdContent entity) {
        if (entity.getProdContentId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProdContent);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(pdProdContent.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getProdId()        != null) { update.set(pdProdContent.prodId,        entity.getProdId());        hasAny = true; }
        if (entity.getContentTypeCd() != null) { update.set(pdProdContent.contentTypeCd, entity.getContentTypeCd()); hasAny = true; }
        if (entity.getContentHtml()   != null) { update.set(pdProdContent.contentHtml,   entity.getContentHtml());   hasAny = true; }
        if (entity.getSortOrd()       != null) { update.set(pdProdContent.sortOrd,       entity.getSortOrd());       hasAny = true; }
        if (entity.getUseYn()         != null) { update.set(pdProdContent.useYn,         entity.getUseYn());         hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(pdProdContent.updBy,         entity.getUpdBy());         hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdProdContent.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProdContent.prodContentId.eq(entity.getProdContentId())).execute();
        return (int) affected;
    }
}
