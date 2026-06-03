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
    private static final String QRY_SRC = "base.ec.dp.repository.qrydsl.impl.QDpPanelItemRepositoryImpl";
    private static final QDpPanelItem dpPanelItem = QDpPanelItem.dpPanelItem;

    /* 전시 패널 아이템 baseSelColumnQuery */
    private JPAQuery<DpPanelItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(DpPanelItemDto.Item.class,
                        dpPanelItem.panelItemId, dpPanelItem.panelId, dpPanelItem.widgetLibId, dpPanelItem.widgetTypeCd,
                        dpPanelItem.widgetTitle, dpPanelItem.widgetContent, dpPanelItem.titleShowYn, dpPanelItem.widgetLibRefYn,
                        dpPanelItem.contentTypeCd, dpPanelItem.sortOrd, dpPanelItem.widgetConfigJson,
                        dpPanelItem.visibilityTargets, dpPanelItem.dispYn, dpPanelItem.dispStartDt, dpPanelItem.dispEndDt,
                        dpPanelItem.dispEnv, dpPanelItem.useYn,
                        dpPanelItem.regBy, dpPanelItem.regDate, dpPanelItem.updBy, dpPanelItem.updDate
                ))
                .from(dpPanelItem);
    }

    /* 전시 패널 아이템 키조회 */
    @Override
    public Optional<DpPanelItemDto.Item> selectById(String panelItemId) {
        DpPanelItemDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(dpPanelItem.panelItemId.eq(panelItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 전시 패널 아이템 목록조회 */
    @Override
    public List<DpPanelItemDto.Item> selectList(DpPanelItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpPanelItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndPanelIds(search),
                    baseAndPanelItemId(search),
                    baseAndWidgetTypeCd(search),
                    baseAndWidgetLibId(search),
                    baseAndPanelId(search),
                    baseAndUseYn(search),
                    baseAndDateRange(search),
                    baseAndSearchValue(search)
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
    public DpPanelItemDto.PageResponse selectPageData(DpPanelItemDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndPanelIds(search),
                baseAndPanelItemId(search),
                baseAndWidgetTypeCd(search),
                baseAndWidgetLibId(search),
                baseAndPanelId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };
        JPAQuery<DpPanelItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<DpPanelItemDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();

        Long total = queryFactory
                .select(dpPanelItem.count())
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .from(dpPanelItem)
                .where(wheres)
                .fetchOne();

        DpPanelItemDto.PageResponse res = new DpPanelItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* panelId IN */
    private BooleanExpression baseAndPanelIds(DpPanelItemDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getPanelIds())
                ? dpPanelItem.panelId.in(search.getPanelIds()) : null;
    }

    /* panelItemId 정확 일치 */
    private BooleanExpression baseAndPanelItemId(DpPanelItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getPanelItemId())
                ? dpPanelItem.panelItemId.eq(search.getPanelItemId()) : null;
    }

    /* widgetTypeCd 정확 일치 */
    private BooleanExpression baseAndWidgetTypeCd(DpPanelItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getWidgetTypeCd())
                ? dpPanelItem.widgetTypeCd.eq(search.getWidgetTypeCd()) : null;
    }

    /* widgetLibId 정확 일치 */
    private BooleanExpression baseAndWidgetLibId(DpPanelItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getWidgetLibId())
                ? dpPanelItem.widgetLibId.eq(search.getWidgetLibId()) : null;
    }

    /* panelId 정확 일치 */
    private BooleanExpression baseAndPanelId(DpPanelItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getPanelId())
                ? dpPanelItem.panelId.eq(search.getPanelId()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(DpPanelItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? dpPanelItem.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(DpPanelItemDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return dpPanelItem.regDate.goe(start).and(dpPanelItem.regDate.lt(endExcl));
            case "upd_date": return dpPanelItem.updDate.goe(start).and(dpPanelItem.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(DpPanelItemDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",contentTypeCd,", dpPanelItem.contentTypeCd, pattern);
        or = orLike(or, all, types, ",dispEnv,", dpPanelItem.dispEnv, pattern);
        or = orLike(or, all, types, ",dispYn,", dpPanelItem.dispYn, pattern);
        or = orLike(or, all, types, ",panelId,", dpPanelItem.panelId, pattern);
        or = orLike(or, all, types, ",panelItemId,", dpPanelItem.panelItemId, pattern);
        or = orLike(or, all, types, ",siteId,", dpPanelItem.siteId, pattern);
        or = orLike(or, all, types, ",titleShowYn,", dpPanelItem.titleShowYn, pattern);
        or = orLike(or, all, types, ",useYn,", dpPanelItem.useYn, pattern);
        or = orLike(or, all, types, ",visibilityTargets,", dpPanelItem.visibilityTargets, pattern);
        or = orLike(or, all, types, ",widgetConfigJson,", dpPanelItem.widgetConfigJson, pattern);
        or = orLike(or, all, types, ",widgetContent,", dpPanelItem.widgetContent, pattern);
        or = orLike(or, all, types, ",widgetLibId,", dpPanelItem.widgetLibId, pattern);
        or = orLike(or, all, types, ",widgetLibRefYn,", dpPanelItem.widgetLibRefYn, pattern);
        or = orLike(or, all, types, ",widgetTitle,", dpPanelItem.widgetTitle, pattern);
        or = orLike(or, all, types, ",widgetTypeCd,", dpPanelItem.widgetTypeCd, pattern);
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
            orders.add(new OrderSpecifier<>(Order.ASC, dpPanelItem.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, dpPanelItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, dpPanelItem.panelItemId));

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
                    orders.add(new OrderSpecifier(order, dpPanelItem.panelItemId));
                } else if ("widgetTitle".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpPanelItem.widgetTitle));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpPanelItem.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, dpPanelItem.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, dpPanelItem.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, dpPanelItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, dpPanelItem.panelItemId));
        }
        return orders;
    }

    /* 전시 패널 아이템 수정 */


    @Override
    public int updateSelective(DpPanelItem entity) {
        if (entity.getPanelItemId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(dpPanelItem);
        boolean hasAny = false;
        if (entity.getPanelId()           != null) { update.set(dpPanelItem.panelId,           entity.getPanelId());           hasAny = true; }
        if (entity.getWidgetLibId()       != null) { update.set(dpPanelItem.widgetLibId,       entity.getWidgetLibId());       hasAny = true; }
        if (entity.getWidgetTypeCd()      != null) { update.set(dpPanelItem.widgetTypeCd,      entity.getWidgetTypeCd());      hasAny = true; }
        if (entity.getWidgetTitle()       != null) { update.set(dpPanelItem.widgetTitle,       entity.getWidgetTitle());       hasAny = true; }
        if (entity.getWidgetContent()     != null) { update.set(dpPanelItem.widgetContent,     entity.getWidgetContent());     hasAny = true; }
        if (entity.getTitleShowYn()       != null) { update.set(dpPanelItem.titleShowYn,       entity.getTitleShowYn());       hasAny = true; }
        if (entity.getWidgetLibRefYn()    != null) { update.set(dpPanelItem.widgetLibRefYn,    entity.getWidgetLibRefYn());    hasAny = true; }
        if (entity.getContentTypeCd()     != null) { update.set(dpPanelItem.contentTypeCd,     entity.getContentTypeCd());     hasAny = true; }
        if (entity.getSortOrd()           != null) { update.set(dpPanelItem.sortOrd,           entity.getSortOrd());           hasAny = true; }
        if (entity.getWidgetConfigJson()  != null) { update.set(dpPanelItem.widgetConfigJson,  entity.getWidgetConfigJson());  hasAny = true; }
        if (entity.getVisibilityTargets() != null) { update.set(dpPanelItem.visibilityTargets, entity.getVisibilityTargets()); hasAny = true; }
        if (entity.getDispYn()            != null) { update.set(dpPanelItem.dispYn,            entity.getDispYn());            hasAny = true; }
        if (entity.getDispStartDt()       != null) { update.set(dpPanelItem.dispStartDt,       entity.getDispStartDt());       hasAny = true; }
        if (entity.getDispEndDt()         != null) { update.set(dpPanelItem.dispEndDt,         entity.getDispEndDt());         hasAny = true; }
        if (entity.getDispEnv()           != null) { update.set(dpPanelItem.dispEnv,           entity.getDispEnv());           hasAny = true; }
        if (entity.getUseYn()             != null) { update.set(dpPanelItem.useYn,             entity.getUseYn());             hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(dpPanelItem.updBy,             entity.getUpdBy());             hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(dpPanelItem.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(dpPanelItem.panelItemId.eq(entity.getPanelItemId())).execute();
    }
}
