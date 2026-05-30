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
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelItemDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanelItem;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpPanelItem;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpPanelItemRepository;
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
public class QDpPanelItemRepositoryImpl implements QDpPanelItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final QDpPanelItem i = QDpPanelItem.dpPanelItem;

    /* 전시 패널 아이템 키조회 */
    @Override
    public Optional<DpPanelItemDto.Item> selectById(String panelItemId) {
        return Optional.ofNullable(baseQuery().where(i.panelItemId.eq(panelItemId)).fetchOne());
    }

    /* 전시 패널 아이템 목록조회 */
    @Override
    public List<DpPanelItemDto.Item> selectList(DpPanelItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpPanelItemDto.Item> query = baseQuery().where(
                andPanelIds(search),
                andPanelItemId(search),
                andWidgetTypeCd(search),
                andWidgetLibId(search),
                andPanelId(search),
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

    /* 전시 패널 아이템 페이지조회 */
    @Override
    public DpPanelItemDto.PageResponse selectPageList(DpPanelItemDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpPanelItemDto.Item> query = baseQuery().where(
                andPanelIds(search),
                andPanelItemId(search),
                andWidgetTypeCd(search),
                andWidgetLibId(search),
                andPanelId(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<DpPanelItemDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();
        Long total = queryFactory.select(i.count()).from(i).where(
                andPanelIds(search),
                andPanelItemId(search),
                andWidgetTypeCd(search),
                andWidgetLibId(search),
                andPanelId(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();
        DpPanelItemDto.PageResponse res = new DpPanelItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 전시 패널 아이템 baseQuery */
    private JPAQuery<DpPanelItemDto.Item> baseQuery() {
        return queryFactory.select(Projections.bean(DpPanelItemDto.Item.class,
                i.panelItemId, i.panelId, i.widgetLibId, i.widgetTypeCd,
                i.widgetTitle, i.widgetContent, i.titleShowYn, i.widgetLibRefYn,
                i.contentTypeCd, i.sortOrd, i.widgetConfigJson,
                i.visibilityTargets, i.dispYn, i.dispStartDt, i.dispEndDt,
                i.dispEnv, i.useYn,
                i.regBy, i.regDate, i.updBy, i.updDate
        )).from(i);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* panelId IN */
    private BooleanExpression andPanelIds(DpPanelItemDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getPanelIds())
                ? i.panelId.in(search.getPanelIds()) : null;
    }

    /* panelItemId 정확 일치 */
    private BooleanExpression andPanelItemId(DpPanelItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getPanelItemId())
                ? i.panelItemId.eq(search.getPanelItemId()) : null;
    }

    /* widgetTypeCd 정확 일치 */
    private BooleanExpression andWidgetTypeCd(DpPanelItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getWidgetTypeCd())
                ? i.widgetTypeCd.eq(search.getWidgetTypeCd()) : null;
    }

    /* widgetLibId 정확 일치 */
    private BooleanExpression andWidgetLibId(DpPanelItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getWidgetLibId())
                ? i.widgetLibId.eq(search.getWidgetLibId()) : null;
    }

    /* panelId 정확 일치 */
    private BooleanExpression andPanelId(DpPanelItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getPanelId())
                ? i.panelId.eq(search.getPanelId()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression andUseYn(DpPanelItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? i.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(DpPanelItemDto.Request search) {
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
    private BooleanExpression andSearchValue(DpPanelItemDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",contentTypeCd,", i.contentTypeCd, pattern);
        or = orLike(or, all, types, ",dispEnv,", i.dispEnv, pattern);
        or = orLike(or, all, types, ",dispYn,", i.dispYn, pattern);
        or = orLike(or, all, types, ",panelId,", i.panelId, pattern);
        or = orLike(or, all, types, ",panelItemId,", i.panelItemId, pattern);
        or = orLike(or, all, types, ",siteId,", i.siteId, pattern);
        or = orLike(or, all, types, ",titleShowYn,", i.titleShowYn, pattern);
        or = orLike(or, all, types, ",useYn,", i.useYn, pattern);
        or = orLike(or, all, types, ",visibilityTargets,", i.visibilityTargets, pattern);
        or = orLike(or, all, types, ",widgetConfigJson,", i.widgetConfigJson, pattern);
        or = orLike(or, all, types, ",widgetContent,", i.widgetContent, pattern);
        or = orLike(or, all, types, ",widgetLibId,", i.widgetLibId, pattern);
        or = orLike(or, all, types, ",widgetLibRefYn,", i.widgetLibRefYn, pattern);
        or = orLike(or, all, types, ",widgetTitle,", i.widgetTitle, pattern);
        or = orLike(or, all, types, ",widgetTypeCd,", i.widgetTypeCd, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(DpPanelItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, i.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, i.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, i.panelItemId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("panelItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.panelItemId));
                } else if ("widgetTitle".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.widgetTitle));
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
            orders.add(new OrderSpecifier<>(Order.ASC, i.panelItemId));
        }
        return orders;
    }

    /* 전시 패널 아이템 수정 */
    @Override
    public int updateSelective(DpPanelItem entity) {
        if (entity.getPanelItemId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;
        if (entity.getPanelId()           != null) { update.set(i.panelId,           entity.getPanelId());           hasAny = true; }
        if (entity.getWidgetLibId()       != null) { update.set(i.widgetLibId,       entity.getWidgetLibId());       hasAny = true; }
        if (entity.getWidgetTypeCd()      != null) { update.set(i.widgetTypeCd,      entity.getWidgetTypeCd());      hasAny = true; }
        if (entity.getWidgetTitle()       != null) { update.set(i.widgetTitle,       entity.getWidgetTitle());       hasAny = true; }
        if (entity.getWidgetContent()     != null) { update.set(i.widgetContent,     entity.getWidgetContent());     hasAny = true; }
        if (entity.getTitleShowYn()       != null) { update.set(i.titleShowYn,       entity.getTitleShowYn());       hasAny = true; }
        if (entity.getWidgetLibRefYn()    != null) { update.set(i.widgetLibRefYn,    entity.getWidgetLibRefYn());    hasAny = true; }
        if (entity.getContentTypeCd()     != null) { update.set(i.contentTypeCd,     entity.getContentTypeCd());     hasAny = true; }
        if (entity.getSortOrd()           != null) { update.set(i.sortOrd,           entity.getSortOrd());           hasAny = true; }
        if (entity.getWidgetConfigJson()  != null) { update.set(i.widgetConfigJson,  entity.getWidgetConfigJson());  hasAny = true; }
        if (entity.getVisibilityTargets() != null) { update.set(i.visibilityTargets, entity.getVisibilityTargets()); hasAny = true; }
        if (entity.getDispYn()            != null) { update.set(i.dispYn,            entity.getDispYn());            hasAny = true; }
        if (entity.getDispStartDt()       != null) { update.set(i.dispStartDt,       entity.getDispStartDt());       hasAny = true; }
        if (entity.getDispEndDt()         != null) { update.set(i.dispEndDt,         entity.getDispEndDt());         hasAny = true; }
        if (entity.getDispEnv()           != null) { update.set(i.dispEnv,           entity.getDispEnv());           hasAny = true; }
        if (entity.getUseYn()             != null) { update.set(i.useYn,             entity.getUseYn());             hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(i.updBy,             entity.getUpdBy());             hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(i.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(i.panelItemId.eq(entity.getPanelItemId())).execute();
    }
}
