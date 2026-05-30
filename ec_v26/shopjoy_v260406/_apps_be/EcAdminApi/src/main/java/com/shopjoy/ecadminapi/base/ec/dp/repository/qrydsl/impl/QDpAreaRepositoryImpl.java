package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpArea;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpAreaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.util.CollectionUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
@RequiredArgsConstructor
public class QDpAreaRepositoryImpl implements QDpAreaRepository {

    private final JPAQueryFactory queryFactory;
    private final SyPathRepository syPathRepository;
    private static final QDpArea a = QDpArea.dpArea;

    /* 전시 영역 키조회 */
    @Override
    public Optional<DpAreaDto.Item> selectById(String areaId) {
        return Optional.ofNullable(baseQuery().where(a.areaId.eq(areaId)).fetchOne());
    }

    /* 전시 영역 목록조회 */
    @Override
    public List<DpAreaDto.Item> selectList(DpAreaDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpAreaDto.Item> query = baseQuery().where(
                andUiIds(search),
                andSiteId(search),
                andUseYn(search),
                andAreaId(search),
                andUiId(search),
                andAreaTypeCd(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    /* 전시 영역 페이지조회 */
    @Override
    public DpAreaDto.PageResponse selectPageList(DpAreaDto.Request search) {
        int pageNo = search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpAreaDto.Item> query = baseQuery().where(
                andUiIds(search),
                andSiteId(search),
                andUseYn(search),
                andAreaId(search),
                andUiId(search),
                andAreaTypeCd(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<DpAreaDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();
        Long total = queryFactory.select(a.count()).from(a).where(
                andUiIds(search),
                andSiteId(search),
                andUseYn(search),
                andAreaId(search),
                andUiId(search),
                andAreaTypeCd(search),
                andSearchValue(search)
        ).fetchOne();
        DpAreaDto.PageResponse res = new DpAreaDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 전시 영역 baseQuery */
    private JPAQuery<DpAreaDto.Item> baseQuery() {
        return queryFactory.select(Projections.bean(DpAreaDto.Item.class,
                a.areaId, a.uiId, a.siteId, a.areaCd, a.areaNm, a.areaTypeCd, a.areaDesc,
                a.pathId, a.useYn, a.useStartDate, a.useEndDate,
                a.regBy, a.regDate, a.updBy, a.updDate
        )).from(a);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* uiId IN */
    private BooleanExpression andUiIds(DpAreaDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getUiIds())
                ? a.uiId.in(search.getUiIds()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(DpAreaDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression andUseYn(DpAreaDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? a.useYn.eq(search.getUseYn()) : null;
    }

    /* areaId 정확 일치 */
    private BooleanExpression andAreaId(DpAreaDto.Request search) {
        return search != null && StringUtils.hasText(search.getAreaId())
                ? a.areaId.eq(search.getAreaId()) : null;
    }

    /* uiId 정확 일치 */
    private BooleanExpression andUiId(DpAreaDto.Request search) {
        return search != null && StringUtils.hasText(search.getUiId())
                ? a.uiId.eq(search.getUiId()) : null;
    }

    /* areaTypeCd 정확 일치 */
    private BooleanExpression andAreaTypeCd(DpAreaDto.Request search) {
        return search != null && StringUtils.hasText(search.getAreaTypeCd())
                ? a.areaTypeCd.eq(search.getAreaTypeCd()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(DpAreaDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",areaCd,", a.areaCd, pattern);
        or = orLike(or, all, types, ",areaDesc,", a.areaDesc, pattern);
        or = orLike(or, all, types, ",areaId,", a.areaId, pattern);
        or = orLike(or, all, types, ",areaNm,", a.areaNm, pattern);
        or = orLike(or, all, types, ",areaTypeCd,", a.areaTypeCd, pattern);
        or = orLike(or, all, types, ",pathId,", a.pathId, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",uiId,", a.uiId, pattern);
        or = orLike(or, all, types, ",useYn,", a.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(DpAreaDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.areaId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("areaId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.areaId));
                } else if ("areaNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.areaNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.areaId));
        }
        return orders;
    }

    /* 전시 영역 수정 */
    @Override
    public int updateSelective(DpArea entity) {
        if (entity.getAreaId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;
        if (entity.getUiId()         != null) { update.set(a.uiId,         entity.getUiId());         hasAny = true; }
        if (entity.getSiteId()       != null) { update.set(a.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getAreaCd()       != null) { update.set(a.areaCd,       entity.getAreaCd());       hasAny = true; }
        if (entity.getAreaNm()       != null) { update.set(a.areaNm,       entity.getAreaNm());       hasAny = true; }
        if (entity.getAreaTypeCd()   != null) { update.set(a.areaTypeCd,   entity.getAreaTypeCd());   hasAny = true; }
        if (entity.getAreaDesc()     != null) { update.set(a.areaDesc,     entity.getAreaDesc());     hasAny = true; }
        if (entity.getPathId()       != null) { update.set(a.pathId,       entity.getPathId());       hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(a.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getUseStartDate() != null) { update.set(a.useStartDate, entity.getUseStartDate()); hasAny = true; }
        if (entity.getUseEndDate()   != null) { update.set(a.useEndDate,   entity.getUseEndDate());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(a.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(a.areaId.eq(entity.getAreaId())).execute();
    }
}
