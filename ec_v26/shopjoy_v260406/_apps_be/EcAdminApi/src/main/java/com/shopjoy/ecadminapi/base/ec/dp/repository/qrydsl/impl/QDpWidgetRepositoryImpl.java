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
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidget;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpWidget;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpWidgetRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
@RequiredArgsConstructor
public class QDpWidgetRepositoryImpl implements QDpWidgetRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private static final String QRY_SRC = "base.ec.dp.repository.qrydsl.impl.QDpWidgetRepositoryImpl";
    private static final QDpWidget w = QDpWidget.dpWidget;

    /* 전시 위젯 키조회 */
    @Override
    public Optional<DpWidgetDto.Item> selectById(String widgetId) {
        return Optional.ofNullable(baseQuery().where(w.widgetId.eq(widgetId)).fetchOne());
    }

    /* 전시 위젯 목록조회 */
    @Override
    public List<DpWidgetDto.Item> selectList(DpWidgetDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpWidgetDto.Item> query = baseQuery().where(
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    /* 전시 위젯 페이지조회 */
    @Override
    public DpWidgetDto.PageResponse selectPageList(DpWidgetDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpWidgetDto.Item> query = baseQuery().where(
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<DpWidgetDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();
        Long total = queryFactory.select(w.count()).from(w).where(
                baseAndSearchValue(search)
        ).fetchOne();
        DpWidgetDto.PageResponse res = new DpWidgetDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 전시 위젯 baseQuery */
    private JPAQuery<DpWidgetDto.Item> baseQuery() {
        return queryFactory.select(Projections.bean(DpWidgetDto.Item.class,
                w.widgetId, w.widgetLibId, w.siteId, w.widgetNm, w.widgetTypeCd,
                w.widgetDesc, w.widgetTitle, w.widgetContent, w.titleShowYn,
                w.widgetLibRefYn, w.widgetConfigJson, w.thumbnailUrl,
                w.sortOrd, w.useYn, w.dispEnv,
                w.regBy, w.regDate, w.updBy, w.updDate
        )).from(w);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(DpWidgetDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",dispEnv,", w.dispEnv, pattern);
        or = orLike(or, all, types, ",siteId,", w.siteId, pattern);
        or = orLike(or, all, types, ",thumbnailUrl,", w.thumbnailUrl, pattern);
        or = orLike(or, all, types, ",titleShowYn,", w.titleShowYn, pattern);
        or = orLike(or, all, types, ",useYn,", w.useYn, pattern);
        or = orLike(or, all, types, ",widgetConfigJson,", w.widgetConfigJson, pattern);
        or = orLike(or, all, types, ",widgetContent,", w.widgetContent, pattern);
        or = orLike(or, all, types, ",widgetDesc,", w.widgetDesc, pattern);
        or = orLike(or, all, types, ",widgetId,", w.widgetId, pattern);
        or = orLike(or, all, types, ",widgetLibId,", w.widgetLibId, pattern);
        or = orLike(or, all, types, ",widgetLibRefYn,", w.widgetLibRefYn, pattern);
        or = orLike(or, all, types, ",widgetNm,", w.widgetNm, pattern);
        or = orLike(or, all, types, ",widgetTitle,", w.widgetTitle, pattern);
        or = orLike(or, all, types, ",widgetTypeCd,", w.widgetTypeCd, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(DpWidgetDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, w.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, w.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, w.widgetId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("widgetId".equals(field)) {
                    orders.add(new OrderSpecifier(order, w.widgetId));
                } else if ("widgetNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, w.widgetNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, w.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, w.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, w.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, w.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, w.widgetId));
        }
        return orders;
    }

    /* 전시 위젯 수정 */
    @Override
    public int updateSelective(DpWidget entity) {
        if (entity.getWidgetId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(w);
        boolean hasAny = false;
        if (entity.getWidgetLibId()      != null) { update.set(w.widgetLibId,      entity.getWidgetLibId());      hasAny = true; }
        if (entity.getSiteId()           != null) { update.set(w.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getWidgetNm()         != null) { update.set(w.widgetNm,         entity.getWidgetNm());         hasAny = true; }
        if (entity.getWidgetTypeCd()     != null) { update.set(w.widgetTypeCd,     entity.getWidgetTypeCd());     hasAny = true; }
        if (entity.getWidgetDesc()       != null) { update.set(w.widgetDesc,       entity.getWidgetDesc());       hasAny = true; }
        if (entity.getWidgetTitle()      != null) { update.set(w.widgetTitle,      entity.getWidgetTitle());      hasAny = true; }
        if (entity.getWidgetContent()    != null) { update.set(w.widgetContent,    entity.getWidgetContent());    hasAny = true; }
        if (entity.getTitleShowYn()      != null) { update.set(w.titleShowYn,      entity.getTitleShowYn());      hasAny = true; }
        if (entity.getWidgetLibRefYn()   != null) { update.set(w.widgetLibRefYn,   entity.getWidgetLibRefYn());   hasAny = true; }
        if (entity.getWidgetConfigJson() != null) { update.set(w.widgetConfigJson, entity.getWidgetConfigJson()); hasAny = true; }
        if (entity.getThumbnailUrl()     != null) { update.set(w.thumbnailUrl,     entity.getThumbnailUrl());     hasAny = true; }
        if (entity.getSortOrd()          != null) { update.set(w.sortOrd,          entity.getSortOrd());          hasAny = true; }
        if (entity.getUseYn()            != null) { update.set(w.useYn,            entity.getUseYn());            hasAny = true; }
        if (entity.getDispEnv()          != null) { update.set(w.dispEnv,          entity.getDispEnv());          hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(w.updBy,            entity.getUpdBy());            hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(w.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(w.widgetId.eq(entity.getWidgetId())).execute();
    }

    /* 표시경로 노드별 dp_widget 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    @Override
    public List<Map<String, Object>> selectPathTreeCntsByBizCd(DpWidgetDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: selectPathTreeCntsByBizCd() */\n");
        sql.append("""
                WITH RECURSIVE descendants /* 각 path 의 자손 path_id (자신 포함, biz_cd 한정) */ AS (
                    SELECT path_id AS root_id, path_id AS leaf_id
                    FROM sy_path
                    WHERE biz_cd = :bizCd
                    UNION ALL
                    SELECT d.root_id, c.path_id
                    FROM descendants d
                    JOIN sy_path c ON c.parent_path_id = d.leaf_id
                    WHERE c.biz_cd = :bizCd
                ),
                filtered /* 검색조건이 적용된 행 (widget_lib_id → path_id 매핑) */ AS (
                    SELECT t.widget_id, l.path_id
                    FROM dp_widget t
                    LEFT JOIN dp_widget_lib l ON l.widget_lib_id = t.widget_lib_id
                    WHERE 1=1
                """);
        params.put("bizCd", "dp_widget");

        if (search != null && StringUtils.hasText(search.getUseYn())) {
            sql.append("      AND t.use_yn = :useYn\n");
            params.put("useYn", search.getUseYn());
        }
        if (search != null && StringUtils.hasText(search.getSearchValue())) {
            String raw = search.getSearchType();

            boolean noType = !StringUtils.hasText(raw);

            String searchType = noType ? "" : "," + raw.trim() + ",";
            sql.append("      AND (\n");
            sql.append("            1=0\n");
            if (noType || searchType.contains(",widgetNm,")) sql.append("         OR t.widget_nm ILIKE '%' || :searchValue || '%'\n");
            if (noType || searchType.contains(",widgetDesc,")) sql.append("         OR t.widget_desc ILIKE '%' || :searchValue || '%'\n");
            if (noType || searchType.contains(",widgetTitle,")) sql.append("         OR t.widget_title ILIKE '%' || :searchValue || '%'\n");
            sql.append("      )\n");
            params.put("searchValue", search.getSearchValue());
        }
        if (search != null && StringUtils.hasText(search.getDateStart())) {
            sql.append("      AND t.reg_date >= CAST(:dateStart AS timestamp)\n");
            params.put("dateStart", search.getDateStart());
        }
        if (search != null && StringUtils.hasText(search.getDateEnd())) {
            sql.append("      AND t.reg_date <= CAST(:dateEnd   AS timestamp) + INTERVAL '1 day'\n");
            params.put("dateEnd", search.getDateEnd());
        }

        sql.append("""
                )
                  /* (1) 일반 path_id 행 : 노드 + 자손 누적 카운트 */
                  SELECT d.root_id AS path_id, COUNT(t.widget_id) AS cnt
                  FROM descendants d
                    LEFT JOIN filtered t ON t.path_id = d.leaf_id
                  GROUP BY d.root_id
                UNION ALL
                  /* (2) '__total__' : 트리 루트 "전체" 노드용 — 검색조건에 부합하는 전체 카운트 */
                  SELECT '__total__' AS path_id, COUNT(*) AS cnt
                  FROM filtered
                UNION ALL
                  /* (3) '__orphan__' : 경로 미지정(path_id IS NULL) 카운트 — 트리 외 표시 */
                  SELECT '__orphan__' AS path_id, COUNT(*) AS cnt
                  FROM filtered
                  WHERE path_id IS NULL
                """);

        Query q = em.createNativeQuery(sql.toString());
        params.forEach(q::setParameter);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = (List<Object[]>) q.getResultList();

        List<Map<String, Object>> result = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("pathId", row[0] == null ? null : String.valueOf(row[0]));
            m.put("cnt",    row[1] == null ? 0L   : ((Number) row[1]).longValue());
            result.add(m);
        }
        return result;
    }
}
