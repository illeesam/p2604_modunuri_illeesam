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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdTag;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdTag;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdTagRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PdTag QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdTagRepositoryImpl implements QPdTagRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdTagRepositoryImpl";
    private static final QPdTag  pdTag   = QPdTag.pdTag;
    private static final QSySite sySite = QSySite.sySite;

    /* 태그 baseSelColumnQuery */
    private JPAQuery<PdTagDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdTagDto.Item.class,
                        pdTag.tagId, pdTag.siteId, pdTag.tagNm, pdTag.tagDesc,
                        pdTag.useCount, pdTag.sortOrd, pdTag.useYn,
                        pdTag.regBy, pdTag.regDate, pdTag.updBy, pdTag.updDate
                ))
                .from(pdTag)
                .leftJoin(sySite).on(sySite.siteId.eq(pdTag.siteId));
    }

    /* 태그 키조회 */
    @Override
    public Optional<PdTagDto.Item> selectById(String tagId) {
        PdTagDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdTag.tagId.eq(tagId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 태그 목록조회 */
    @Override
    public List<PdTagDto.Item> selectList(PdTagDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdTagDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndTagId(search),
                    baseAndDateRange(search),
                    baseAndSearchValue(search)
                );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 태그 페이지조회 */
    @Override
    public PdTagDto.PageResponse selectPageData(PdTagDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndTagId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<PdTagDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdTagDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(pdTag.count())
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .from(pdTag)
                .where(wheres)
                .fetchOne();

        PdTagDto.PageResponse res = new PdTagDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PdTagDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pdTag.siteId.eq(search.getSiteId()) : null;
    }

    /* tagId 정확 일치 */
    private BooleanExpression baseAndTagId(PdTagDto.Request search) {
        return search != null && StringUtils.hasText(search.getTagId())
                ? pdTag.tagId.eq(search.getTagId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PdTagDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pdTag.regDate.goe(start).and(pdTag.regDate.lt(endExcl));
            case "upd_date": return pdTag.updDate.goe(start).and(pdTag.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PdTagDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",siteId,", pdTag.siteId, pattern);
        or = orLike(or, all, types, ",tagDesc,", pdTag.tagDesc, pattern);
        or = orLike(or, all, types, ",tagId,", pdTag.tagId, pattern);
        or = orLike(or, all, types, ",tagNm,", pdTag.tagNm, pattern);
        or = orLike(or, all, types, ",useYn,", pdTag.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PdTagDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, pdTag.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pdTag.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdTag.tagId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("tagId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdTag.tagId));
                } else if ("tagNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdTag.tagNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdTag.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, pdTag.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, pdTag.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pdTag.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdTag.tagId));
        }
        return orders;
    }

    /* 태그 수정 */


    @Override
    public int updateSelective(PdTag entity) {
        if (entity.getTagId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdTag);
        boolean hasAny = false;

        if (entity.getSiteId()   != null) { update.set(pdTag.siteId,   entity.getSiteId());   hasAny = true; }
        if (entity.getTagNm()    != null) { update.set(pdTag.tagNm,    entity.getTagNm());    hasAny = true; }
        if (entity.getTagDesc()  != null) { update.set(pdTag.tagDesc,  entity.getTagDesc());  hasAny = true; }
        if (entity.getUseCount() != null) { update.set(pdTag.useCount, entity.getUseCount()); hasAny = true; }
        if (entity.getSortOrd()  != null) { update.set(pdTag.sortOrd,  entity.getSortOrd());  hasAny = true; }
        if (entity.getUseYn()    != null) { update.set(pdTag.useYn,    entity.getUseYn());    hasAny = true; }
        if (entity.getUpdBy()    != null) { update.set(pdTag.updBy,    entity.getUpdBy());    hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdTag.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdTag.tagId.eq(entity.getTagId())).execute();
        return (int) affected;
    }
}
