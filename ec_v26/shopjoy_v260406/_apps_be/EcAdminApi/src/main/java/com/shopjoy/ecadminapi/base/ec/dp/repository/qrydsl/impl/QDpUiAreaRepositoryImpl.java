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
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUiArea;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpUiArea;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpUiAreaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** DpUiArea QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QDpUiAreaRepositoryImpl implements QDpUiAreaRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.dp.repository.qrydsl.impl.QDpUiAreaRepositoryImpl";
    private static final QDpUiArea a = QDpUiArea.dpUiArea;

    /* 전시 UI-영역 매핑 키조회 */
    @Override
    public Optional<DpUiAreaDto.Item> selectById(String uiAreaId) {
        DpUiAreaDto.Item dto = baseQuery()
                .where(a.uiAreaId.eq(uiAreaId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 전시 UI-영역 매핑 목록조회 */
    @Override
    public List<DpUiAreaDto.Item> selectList(DpUiAreaDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<DpUiAreaDto.Item> query = baseQuery().where(
                andUiAreaId(search),
                andUseYn(search),
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

    /* 전시 UI-영역 매핑 페이지조회 */
    @Override
    public DpUiAreaDto.PageResponse selectPageList(DpUiAreaDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<DpUiAreaDto.Item> query = baseQuery().where(
                andUiAreaId(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<DpUiAreaDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(a.count()).from(a).where(
                andUiAreaId(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();

        DpUiAreaDto.PageResponse res = new DpUiAreaDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 전시 UI-영역 매핑 baseQuery */
    private JPAQuery<DpUiAreaDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(DpUiAreaDto.Item.class,
                        a.uiAreaId, a.uiId, a.areaId, a.areaSortOrd,
                        a.visibilityTargets, a.dispEnv, a.dispYn,
                        a.dispStartDt, a.dispEndDt, a.useYn,
                        a.regBy, a.regDate, a.updBy, a.updDate
                ))
                .from(a);
    }

    /* 전시 UI-영역 매핑 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* uiAreaId 정확 일치 */
    private BooleanExpression andUiAreaId(DpUiAreaDto.Request search) {
        return search != null && StringUtils.hasText(search.getUiAreaId())
                ? a.uiAreaId.eq(search.getUiAreaId()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression andUseYn(DpUiAreaDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? a.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(DpUiAreaDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            case "upd_date": return a.updDate.goe(start).and(a.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(DpUiAreaDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",areaId,", a.areaId, pattern);
        or = orLike(or, all, types, ",dispEnv,", a.dispEnv, pattern);
        or = orLike(or, all, types, ",dispYn,", a.dispYn, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",uiAreaId,", a.uiAreaId, pattern);
        or = orLike(or, all, types, ",uiId,", a.uiId, pattern);
        or = orLike(or, all, types, ",useYn,", a.useYn, pattern);
        or = orLike(or, all, types, ",visibilityTargets,", a.visibilityTargets, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(DpUiAreaDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.uiAreaId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("uiAreaId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.uiAreaId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.uiAreaId));
        }
        return orders;
    }

    /* 전시 UI-영역 매핑 수정 */
    @Override
    public int updateSelective(DpUiArea entity) {
        if (entity.getUiAreaId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getUiId()              != null) { update.set(a.uiId,              entity.getUiId());              hasAny = true; }
        if (entity.getAreaId()            != null) { update.set(a.areaId,            entity.getAreaId());            hasAny = true; }
        if (entity.getAreaSortOrd()       != null) { update.set(a.areaSortOrd,       entity.getAreaSortOrd());       hasAny = true; }
        if (entity.getVisibilityTargets() != null) { update.set(a.visibilityTargets, entity.getVisibilityTargets()); hasAny = true; }
        if (entity.getDispEnv()           != null) { update.set(a.dispEnv,           entity.getDispEnv());           hasAny = true; }
        if (entity.getDispYn()            != null) { update.set(a.dispYn,            entity.getDispYn());            hasAny = true; }
        if (entity.getDispStartDt()       != null) { update.set(a.dispStartDt,       entity.getDispStartDt());       hasAny = true; }
        if (entity.getDispEndDt()         != null) { update.set(a.dispEndDt,         entity.getDispEndDt());         hasAny = true; }
        if (entity.getUseYn()             != null) { update.set(a.useYn,             entity.getUseYn());             hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(a.updBy,             entity.getUpdBy());             hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.uiAreaId.eq(entity.getUiAreaId())).execute();
        return (int) affected;
    }
}
