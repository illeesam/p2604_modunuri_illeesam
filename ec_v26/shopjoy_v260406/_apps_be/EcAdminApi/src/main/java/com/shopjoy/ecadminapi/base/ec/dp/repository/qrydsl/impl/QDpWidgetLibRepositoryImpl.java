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
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetLibDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidgetLib;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpWidgetLib;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpWidgetLibRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
@RequiredArgsConstructor
public class QDpWidgetLibRepositoryImpl implements QDpWidgetLibRepository {

    private final JPAQueryFactory queryFactory;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.ec.dp.repository.qrydsl.impl.QDpWidgetLibRepositoryImpl";
    private static final QDpWidgetLib l = QDpWidgetLib.dpWidgetLib;

    /* 전시 위젯 라이브러리 키조회 */
    @Override
    public Optional<DpWidgetLibDto.Item> selectById(String widgetLibId) {
        return Optional.ofNullable(baseQuery().where(l.widgetLibId.eq(widgetLibId)).fetchOne());
    }

    /* 전시 위젯 라이브러리 목록조회 */
    @Override
    public List<DpWidgetLibDto.Item> selectList(DpWidgetLibDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpWidgetLibDto.Item> query = baseQuery().where(
                andSiteId(search),
                andPathId(search),
                andWidgetLibId(search),
                andWidgetTypeCd(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    /* 전시 위젯 라이브러리 페이지조회 */
    @Override
    public DpWidgetLibDto.PageResponse selectPageList(DpWidgetLibDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpWidgetLibDto.Item> query = baseQuery().where(
                andSiteId(search),
                andPathId(search),
                andWidgetLibId(search),
                andWidgetTypeCd(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<DpWidgetLibDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();
        Long total = queryFactory.select(l.count()).from(l).where(
                andSiteId(search),
                andPathId(search),
                andWidgetLibId(search),
                andWidgetTypeCd(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();
        DpWidgetLibDto.PageResponse res = new DpWidgetLibDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 전시 위젯 라이브러리 baseQuery */
    private JPAQuery<DpWidgetLibDto.Item> baseQuery() {
        return queryFactory.select(Projections.bean(DpWidgetLibDto.Item.class,
                l.widgetLibId, l.siteId, l.widgetCode, l.widgetNm, l.widgetTypeCd,
                l.widgetLibDesc, l.pathId, l.thumbnailUrl, l.widgetContent,
                l.widgetConfigJson, l.isSystem, l.sortOrd, l.useYn,
                l.regBy, l.regDate, l.updBy, l.updDate
        )).from(l);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(DpWidgetLibDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? l.siteId.eq(search.getSiteId()) : null;
    }

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathId(DpWidgetLibDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? l.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "dp_widget_lib"))
                : null;
    }

    /* widgetLibId 정확 일치 */
    private BooleanExpression andWidgetLibId(DpWidgetLibDto.Request search) {
        return search != null && StringUtils.hasText(search.getWidgetLibId())
                ? l.widgetLibId.eq(search.getWidgetLibId()) : null;
    }

    /* widgetTypeCd 정확 일치 */
    private BooleanExpression andWidgetTypeCd(DpWidgetLibDto.Request search) {
        return search != null && StringUtils.hasText(search.getWidgetTypeCd())
                ? l.widgetTypeCd.eq(search.getWidgetTypeCd()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression andUseYn(DpWidgetLibDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? l.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(DpWidgetLibDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return l.regDate.goe(start).and(l.regDate.lt(endExcl));
            case "upd_date": return l.updDate.goe(start).and(l.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(DpWidgetLibDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",isSystem,", l.isSystem, pattern);
        or = orLike(or, all, types, ",pathId,", l.pathId, pattern);
        or = orLike(or, all, types, ",siteId,", l.siteId, pattern);
        or = orLike(or, all, types, ",thumbnailUrl,", l.thumbnailUrl, pattern);
        or = orLike(or, all, types, ",useYn,", l.useYn, pattern);
        or = orLike(or, all, types, ",widgetCode,", l.widgetCode, pattern);
        or = orLike(or, all, types, ",widgetConfigJson,", l.widgetConfigJson, pattern);
        or = orLike(or, all, types, ",widgetContent,", l.widgetContent, pattern);
        or = orLike(or, all, types, ",widgetLibDesc,", l.widgetLibDesc, pattern);
        or = orLike(or, all, types, ",widgetLibId,", l.widgetLibId, pattern);
        or = orLike(or, all, types, ",widgetNm,", l.widgetNm, pattern);
        or = orLike(or, all, types, ",widgetTypeCd,", l.widgetTypeCd, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(DpWidgetLibDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, l.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, l.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, l.widgetLibId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("widgetLibId".equals(field)) {
                    orders.add(new OrderSpecifier(order, l.widgetLibId));
                } else if ("widgetNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, l.widgetNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, l.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, l.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, l.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, l.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, l.widgetLibId));
        }
        return orders;
    }

    /* 전시 위젯 라이브러리 수정 */
    @Override
    public int updateSelective(DpWidgetLib entity) {
        if (entity.getWidgetLibId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(l);
        boolean hasAny = false;
        if (entity.getSiteId()           != null) { update.set(l.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getWidgetCode()       != null) { update.set(l.widgetCode,       entity.getWidgetCode());       hasAny = true; }
        if (entity.getWidgetNm()         != null) { update.set(l.widgetNm,         entity.getWidgetNm());         hasAny = true; }
        if (entity.getWidgetTypeCd()     != null) { update.set(l.widgetTypeCd,     entity.getWidgetTypeCd());     hasAny = true; }
        if (entity.getWidgetLibDesc()    != null) { update.set(l.widgetLibDesc,    entity.getWidgetLibDesc());    hasAny = true; }
        if (entity.getPathId()           != null) { update.set(l.pathId,           entity.getPathId());           hasAny = true; }
        if (entity.getThumbnailUrl()     != null) { update.set(l.thumbnailUrl,     entity.getThumbnailUrl());     hasAny = true; }
        if (entity.getWidgetContent()    != null) { update.set(l.widgetContent,    entity.getWidgetContent());    hasAny = true; }
        if (entity.getWidgetConfigJson() != null) { update.set(l.widgetConfigJson, entity.getWidgetConfigJson()); hasAny = true; }
        if (entity.getIsSystem()         != null) { update.set(l.isSystem,         entity.getIsSystem());         hasAny = true; }
        if (entity.getSortOrd()          != null) { update.set(l.sortOrd,          entity.getSortOrd());          hasAny = true; }
        if (entity.getUseYn()            != null) { update.set(l.useYn,            entity.getUseYn());            hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(l.updBy,            entity.getUpdBy());            hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(l.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(l.widgetLibId.eq(entity.getWidgetLibId())).execute();
    }
}
