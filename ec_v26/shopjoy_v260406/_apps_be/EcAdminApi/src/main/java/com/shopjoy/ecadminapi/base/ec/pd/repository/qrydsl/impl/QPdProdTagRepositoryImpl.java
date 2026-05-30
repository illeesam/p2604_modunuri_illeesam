package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PdProdTag QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdTagRepositoryImpl implements QPdProdTagRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdProdTag t   = QPdProdTag.pdProdTag;
    private static final QPdProd    prd = QPdProd.pdProd;
    private static final QSySite    ste = QSySite.sySite;

    /* 상품 태그 키조회 */
    @Override
    public Optional<PdProdTagDto.Item> selectById(String prodTagId) {
        PdProdTagDto.Item dto = baseQuery()
                .where(t.prodTagId.eq(prodTagId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 태그 목록조회 */
    @Override
    public List<PdProdTagDto.Item> selectList(PdProdTagDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdTagDto.Item> query = baseQuery().where(
                andSiteId(search),
                andProdTagId(search),
                andDateRange(search),
                andSearchValue(search)
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

    /* 상품 태그 페이지조회 */
    @Override
    public PdProdTagDto.PageResponse selectPageList(PdProdTagDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdTagDto.Item> query = baseQuery().where(
                andSiteId(search),
                andProdTagId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdTagDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(t.count()).from(t).where(
                andSiteId(search),
                andProdTagId(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();

        PdProdTagDto.PageResponse res = new PdProdTagDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 상품 태그 baseQuery */
    private JPAQuery<PdProdTagDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdProdTagDto.Item.class,
                        t.prodTagId, t.siteId, t.prodId, t.tagId,
                        t.regBy, t.regDate
                ))
                .from(t)
                .leftJoin(prd).on(prd.prodId.eq(t.prodId))
                .leftJoin(ste).on(ste.siteId.eq(t.siteId));
    }

    /* 상품 태그 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(PdProdTagDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? t.siteId.eq(search.getSiteId()) : null;
    }

    /* prodTagId 정확 일치 */
    private BooleanExpression andProdTagId(PdProdTagDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdTagId())
                ? t.prodTagId.eq(search.getProdTagId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(PdProdTagDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return t.regDate.goe(start).and(t.regDate.lt(endExcl));
            case "upd_date": return t.updDate.goe(start).and(t.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(PdProdTagDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",prodId,", t.prodId, pattern);
        or = orLike(or, all, types, ",prodTagId,", t.prodTagId, pattern);
        or = orLike(or, all, types, ",siteId,", t.siteId, pattern);
        or = orLike(or, all, types, ",tagId,", t.tagId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PdProdTagDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, t.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, t.prodTagId));
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
                    orders.add(new OrderSpecifier(order, t.prodTagId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, t.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, t.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, t.prodTagId));
        }
        return orders;
    }

    /* 상품 태그 수정 */
    @Override
    public int updateSelective(PdProdTag entity) {
        if (entity.getProdTagId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(t);
        boolean hasAny = false;

        if (entity.getSiteId() != null) { update.set(t.siteId, entity.getSiteId()); hasAny = true; }
        if (entity.getProdId() != null) { update.set(t.prodId, entity.getProdId()); hasAny = true; }
        if (entity.getTagId()  != null) { update.set(t.tagId,  entity.getTagId());  hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(t.prodTagId.eq(entity.getProdTagId())).execute();
        return (int) affected;
    }
}
