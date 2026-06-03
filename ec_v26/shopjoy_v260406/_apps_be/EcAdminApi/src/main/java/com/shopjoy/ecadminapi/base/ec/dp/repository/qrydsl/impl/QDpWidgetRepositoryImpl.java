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

import java.time.LocalDateTime;
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
    private static final QDpWidget dpWidget = QDpWidget.dpWidget;

    /* 전시 위젯 baseQuery */
    private JPAQuery<DpWidgetDto.Item> baseQuery() {
        return queryFactory.select(Projections.bean(DpWidgetDto.Item.class,
                dpWidget.widgetId, dpWidget.widgetLibId, dpWidget.siteId, dpWidget.widgetNm, dpWidget.widgetTypeCd,
                dpWidget.widgetDesc, dpWidget.widgetTitle, dpWidget.widgetContent, dpWidget.titleShowYn,
                dpWidget.widgetLibRefYn, dpWidget.widgetConfigJson, dpWidget.thumbnailUrl,
                dpWidget.sortOrd, dpWidget.useYn, dpWidget.dispEnv,
                dpWidget.regBy, dpWidget.regDate, dpWidget.updBy, dpWidget.updDate
        )).from(dpWidget);
    }

    /* 전시 위젯 키조회 */
    @Override
    public Optional<DpWidgetDto.Item> selectById(String widgetId) {
        return Optional.ofNullable(baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(dpWidget.widgetId.eq(widgetId)).fetchOne());
    }

    /* 전시 위젯 목록조회 */
    @Override
    public List<DpWidgetDto.Item> selectList(DpWidgetDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpWidgetDto.Item> query = baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSearchValue(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 전시 위젯 페이지조회 */
    @Override
    public DpWidgetDto.PageResponse selectPageData(DpWidgetDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSearchValue(search)
        };
        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<DpWidgetDto.Item> query = baseQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<DpWidgetDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();
        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(dpWidget.count())
                .where(wheres)
                .fetchOne();
        DpWidgetDto.PageResponse res = new DpWidgetDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
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
        or = orLike(or, all, types, ",dispEnv,", dpWidget.dispEnv, pattern);
        or = orLike(or, all, types, ",siteId,", dpWidget.siteId, pattern);
        or = orLike(or, all, types, ",thumbnailUrl,", dpWidget.thumbnailUrl, pattern);
        or = orLike(or, all, types, ",titleShowYn,", dpWidget.titleShowYn, pattern);
        or = orLike(or, all, types, ",useYn,", dpWidget.useYn, pattern);
        or = orLike(or, all, types, ",widgetConfigJson,", dpWidget.widgetConfigJson, pattern);
        or = orLike(or, all, types, ",widgetContent,", dpWidget.widgetContent, pattern);
        or = orLike(or, all, types, ",widgetDesc,", dpWidget.widgetDesc, pattern);
        or = orLike(or, all, types, ",widgetId,", dpWidget.widgetId, pattern);
        or = orLike(or, all, types, ",widgetLibId,", dpWidget.widgetLibId, pattern);
        or = orLike(or, all, types, ",widgetLibRefYn,", dpWidget.widgetLibRefYn, pattern);
        or = orLike(or, all, types, ",widgetNm,", dpWidget.widgetNm, pattern);
        or = orLike(or, all, types, ",widgetTitle,", dpWidget.widgetTitle, pattern);
        or = orLike(or, all, types, ",widgetTypeCd,", dpWidget.widgetTypeCd, pattern);
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
            orders.add(new OrderSpecifier<>(Order.ASC, dpWidget.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, dpWidget.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, dpWidget.widgetId));

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
                    orders.add(new OrderSpecifier(order, dpWidget.widgetId));
                } else if ("widgetNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpWidget.widgetNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpWidget.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, dpWidget.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, dpWidget.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, dpWidget.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, dpWidget.widgetId));
        }
        return orders;
    }

    /* 전시 위젯 수정 */
    @Override
    public int updateSelective(DpWidget entity) {
        if (entity.getWidgetId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(dpWidget);
        boolean hasAny = false;
        if (entity.getWidgetLibId()      != null) { update.set(dpWidget.widgetLibId,      entity.getWidgetLibId());      hasAny = true; }
        if (entity.getSiteId()           != null) { update.set(dpWidget.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getWidgetNm()         != null) { update.set(dpWidget.widgetNm,         entity.getWidgetNm());         hasAny = true; }
        if (entity.getWidgetTypeCd()     != null) { update.set(dpWidget.widgetTypeCd,     entity.getWidgetTypeCd());     hasAny = true; }
        if (entity.getWidgetDesc()       != null) { update.set(dpWidget.widgetDesc,       entity.getWidgetDesc());       hasAny = true; }
        if (entity.getWidgetTitle()      != null) { update.set(dpWidget.widgetTitle,      entity.getWidgetTitle());      hasAny = true; }
        if (entity.getWidgetContent()    != null) { update.set(dpWidget.widgetContent,    entity.getWidgetContent());    hasAny = true; }
        if (entity.getTitleShowYn()      != null) { update.set(dpWidget.titleShowYn,      entity.getTitleShowYn());      hasAny = true; }
        if (entity.getWidgetLibRefYn()   != null) { update.set(dpWidget.widgetLibRefYn,   entity.getWidgetLibRefYn());   hasAny = true; }
        if (entity.getWidgetConfigJson() != null) { update.set(dpWidget.widgetConfigJson, entity.getWidgetConfigJson()); hasAny = true; }
        if (entity.getThumbnailUrl()     != null) { update.set(dpWidget.thumbnailUrl,     entity.getThumbnailUrl());     hasAny = true; }
        if (entity.getSortOrd()          != null) { update.set(dpWidget.sortOrd,          entity.getSortOrd());          hasAny = true; }
        if (entity.getUseYn()            != null) { update.set(dpWidget.useYn,            entity.getUseYn());            hasAny = true; }
        if (entity.getDispEnv()          != null) { update.set(dpWidget.dispEnv,          entity.getDispEnv());          hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(dpWidget.updBy,            entity.getUpdBy());            hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(dpWidget.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(dpWidget.widgetId.eq(entity.getWidgetId())).execute();
    }

    /* 표시경로 노드별 dp_widget 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    @Override
    public List<Map<String, Object>> selectPathTreeWidgetCnts(DpWidgetDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: selectPathTreeWidgetCnts() */\n");
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

        /* 검색조건 — pathtreeAnd*() 헬퍼로 SQL 조각 + 파라미터 함께 추가 */
        pathtreeAndUseYn(search, sql, params);
        pathtreeAndSearchValue(search, sql, params);
        pathtreeAndDateRange(search, sql, params);

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

    /* ============================================================
     * selectPathTreeWidgetCnts 전용 SQL 조건 헬퍼
     * ============================================================ */

    private void pathtreeAndUseYn(DpWidgetDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getUseYn())) return;
        sql.append("      AND t.use_yn = :useYn\n");
        p.put("useYn", s.getUseYn());
    }

    private void pathtreeAndSearchValue(DpWidgetDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getSearchValue())) return;
        String raw = s.getSearchType();
        boolean noType = !StringUtils.hasText(raw);
        String st = noType ? "" : "," + raw.trim() + ",";
        sql.append("      AND (\n");
        sql.append("            1=0\n");
        if (noType || st.contains(",widgetNm,"))    sql.append("         OR t.widget_nm    ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",widgetDesc,"))  sql.append("         OR t.widget_desc  ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",widgetTitle,")) sql.append("         OR t.widget_title ILIKE '%' || :searchValue || '%'\n");
        sql.append("      )\n");
        p.put("searchValue", s.getSearchValue());
    }

    private void pathtreeAndDateRange(DpWidgetDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null) return;
        if (StringUtils.hasText(s.getDateStart())) {
            sql.append("      AND t.reg_date >= CAST(:dateStart AS timestamp)\n");
            p.put("dateStart", s.getDateStart());
        }
        if (StringUtils.hasText(s.getDateEnd())) {
            sql.append("      AND t.reg_date <= CAST(:dateEnd   AS timestamp) + INTERVAL '1 day'\n");
            p.put("dateEnd", s.getDateEnd());
        }
    }
}
