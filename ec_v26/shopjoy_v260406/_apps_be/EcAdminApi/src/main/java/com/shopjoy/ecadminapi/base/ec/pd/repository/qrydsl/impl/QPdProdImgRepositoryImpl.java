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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdImgDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdImg;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdImg;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdImgRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PdProdImg QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdImgRepositoryImpl implements QPdProdImgRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdImgRepositoryImpl";
    private static final QPdProdImg i = QPdProdImg.pdProdImg;

    /* 상품 이미지 키조회 */
    @Override
    public Optional<PdProdImgDto.Item> selectById(String prodImgId) {
        PdProdImgDto.Item dto = baseQuery()
                .where(i.prodImgId.eq(prodImgId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 이미지 목록조회 */
    @Override
    public List<PdProdImgDto.Item> selectList(PdProdImgDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdImgDto.Item> query = baseQuery().where(
                baseAndProdIds(search),
                baseAndProdId(search),
                baseAndSiteId(search),
                baseAndProdImgId(search),
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

    /* 상품 이미지 페이지조회 */
    @Override
    public PdProdImgDto.PageResponse selectPageList(PdProdImgDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdImgDto.Item> query = baseQuery().where(
                baseAndProdIds(search),
                baseAndProdId(search),
                baseAndSiteId(search),
                baseAndProdImgId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdImgDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(i.count()).from(i).where(
                baseAndProdIds(search),
                baseAndProdId(search),
                baseAndSiteId(search),
                baseAndProdImgId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        ).fetchOne();

        PdProdImgDto.PageResponse res = new PdProdImgDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query — DTO 필드만 프로젝션 */
    private JPAQuery<PdProdImgDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdProdImgDto.Item.class,
                        i.prodImgId,
                        i.siteId,
                        i.prodId,
                        i.optItemId1,
                        i.optItemId2,
                        i.attachId,
                        i.cdnHost,
                        i.cdnImgUrl,
                        i.cdnThumbUrl,
                        i.imgAltText,
                        i.sortOrd,
                        i.isThumb,
                        i.regBy,
                        i.regDate,
                        i.updBy,
                        i.updDate
                ))
                .from(i);
    }

    /* 상품 이미지 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* prodId IN */
    private BooleanExpression baseAndProdIds(PdProdImgDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getProdIds())
                ? i.prodId.in(search.getProdIds()) : null;
    }

    /* prodId 정확 일치 */
    private BooleanExpression baseAndProdId(PdProdImgDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdId())
                ? i.prodId.eq(search.getProdId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PdProdImgDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? i.siteId.eq(search.getSiteId()) : null;
    }

    /* prodImgId 정확 일치 */
    private BooleanExpression baseAndProdImgId(PdProdImgDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdImgId())
                ? i.prodImgId.eq(search.getProdImgId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PdProdImgDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return i.regDate.goe(start).and(i.regDate.lt(endExcl));
            case "upd_date": return i.updDate.goe(start).and(i.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PdProdImgDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",attachId,", i.attachId, pattern);
        or = orLike(or, all, types, ",cdnHost,", i.cdnHost, pattern);
        or = orLike(or, all, types, ",cdnImgUrl,", i.cdnImgUrl, pattern);
        or = orLike(or, all, types, ",cdnThumbUrl,", i.cdnThumbUrl, pattern);
        or = orLike(or, all, types, ",imgAltText,", i.imgAltText, pattern);
        or = orLike(or, all, types, ",isThumb,", i.isThumb, pattern);
        or = orLike(or, all, types, ",optItemId1,", i.optItemId1, pattern);
        or = orLike(or, all, types, ",optItemId2,", i.optItemId2, pattern);
        or = orLike(or, all, types, ",prodId,", i.prodId, pattern);
        or = orLike(or, all, types, ",prodImgId,", i.prodImgId, pattern);
        or = orLike(or, all, types, ",siteId,", i.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PdProdImgDto.Request req) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = req == null ? null : req.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, i.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, i.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, i.prodImgId));

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
                    orders.add(new OrderSpecifier(order, i.prodImgId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, i.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, i.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, i.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, i.prodImgId));
        }
        return orders;
    }

    /* 상품 이미지 수정 */
    @Override
    public int updateSelective(PdProdImg entity) {
        if (entity.getProdImgId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(i.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getProdId()      != null) { update.set(i.prodId,      entity.getProdId());      hasAny = true; }
        if (entity.getOptItemId1()  != null) { update.set(i.optItemId1,  entity.getOptItemId1());  hasAny = true; }
        if (entity.getOptItemId2()  != null) { update.set(i.optItemId2,  entity.getOptItemId2());  hasAny = true; }
        if (entity.getAttachId()    != null) { update.set(i.attachId,    entity.getAttachId());    hasAny = true; }
        if (entity.getCdnHost()     != null) { update.set(i.cdnHost,     entity.getCdnHost());     hasAny = true; }
        if (entity.getCdnImgUrl()   != null) { update.set(i.cdnImgUrl,   entity.getCdnImgUrl());   hasAny = true; }
        if (entity.getCdnThumbUrl() != null) { update.set(i.cdnThumbUrl, entity.getCdnThumbUrl()); hasAny = true; }
        if (entity.getImgAltText()  != null) { update.set(i.imgAltText,  entity.getImgAltText());  hasAny = true; }
        if (entity.getSortOrd()     != null) { update.set(i.sortOrd,     entity.getSortOrd());     hasAny = true; }
        if (entity.getIsThumb()     != null) { update.set(i.isThumb,     entity.getIsThumb());     hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(i.updBy,       entity.getUpdBy());       hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(i.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(i.prodImgId.eq(entity.getProdImgId())).execute();
        return (int) affected;
    }
}
