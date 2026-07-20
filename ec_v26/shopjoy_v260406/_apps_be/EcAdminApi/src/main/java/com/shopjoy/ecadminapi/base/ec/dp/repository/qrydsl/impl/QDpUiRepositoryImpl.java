package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpUi;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpUiRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** DpUi QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QDpUiRepositoryImpl implements QDpUiRepository {

    private final JPAQueryFactory queryFactory;
    private final SyPathRepository syPathRepository;

    @PersistenceContext
    private EntityManager em;

    private static final String QRY_SRC = "base.ec.dp.repository.qrydsl.impl.QDpUiRepositoryImpl";
    private static final QDpUi dpUi = QDpUi.dpUi;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", dpUi.regDate,
        "upd_date", dpUi.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("deviceTypeCd", dpUi.deviceTypeCd),
        Map.entry("pathId", dpUi.pathId),
        Map.entry("siteId", dpUi.siteId),
        Map.entry("uiCd", dpUi.uiCd),
        Map.entry("uiDesc", dpUi.uiDesc),
        Map.entry("uiId", dpUi.uiId),
        Map.entry("uiNm", dpUi.uiNm),
        Map.entry("useYn", dpUi.useYn)
    );

    /* 전시 UI baseQuery */
    private JPAQuery<DpUiDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(DpUiDto.Item.class,
                        dpUi.uiId, dpUi.siteId, dpUi.uiCd, dpUi.uiNm, dpUi.uiDesc,
                        dpUi.deviceTypeCd, dpUi.pathId, dpUi.sortOrd, dpUi.useYn,
                        dpUi.useStartDate, dpUi.useEndDate,
                        dpUi.regBy, dpUi.regDate, dpUi.updBy, dpUi.updDate
                ))
                .from(dpUi);
    }

    /* 전시 UI 키조회 */
    @Override
    public Optional<DpUiDto.Item> selectById(String uiId) {
        DpUiDto.Item dto = baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(dpUi.uiId.eq(uiId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 전시 UI 목록조회 */
    @Override
    public List<DpUiDto.Item> selectList(DpUiDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<DpUiDto.Item> query = baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(dpUi.siteId, search.getSiteId()),
                    andPathIdIn(search),
                    QdslUtil.strEq(dpUi.uiId, search.getUiId()),
                    QdslUtil.strEq(dpUi.deviceTypeCd, search.getDeviceTypeCd()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 전시 UI 페이지조회 */
    @Override
    public DpUiDto.PageResponse selectPageData(DpUiDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(dpUi.siteId, search.getSiteId()),
                andPathIdIn(search),
                QdslUtil.strEq(dpUi.uiId, search.getUiId()),
                QdslUtil.strEq(dpUi.deviceTypeCd, search.getDeviceTypeCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<DpUiDto.Item> query = baseQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<DpUiDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(dpUi.count())
                .where(wheres)
                .fetchOne();

        DpUiDto.PageResponse res = new DpUiDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathIdIn(DpUiDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? dpUi.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "dp_ui"))
                : null;
    }

private BooleanExpression andSearchValueLike(DpUiDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(DpUiDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, dpUi.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, dpUi.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, dpUi.uiId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("uiId".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpUi.uiId));
                } else if ("uiNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpUi.uiNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpUi.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, dpUi.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, dpUi.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, dpUi.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, dpUi.uiId));
        }
        return orders;
    }

    /* 전시 UI 수정 */
    @Override
    public int updateSelective(DpUi entity) {
        if (entity.getUiId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(dpUi);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(dpUi.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getUiCd()          != null) { update.set(dpUi.uiCd,          entity.getUiCd());          hasAny = true; }
        if (entity.getUiNm()          != null) { update.set(dpUi.uiNm,          entity.getUiNm());          hasAny = true; }
        if (entity.getUiDesc()        != null) { update.set(dpUi.uiDesc,        entity.getUiDesc());        hasAny = true; }
        if (entity.getDeviceTypeCd()  != null) { update.set(dpUi.deviceTypeCd,  entity.getDeviceTypeCd());  hasAny = true; }
        if (entity.getPathId()        != null) { update.set(dpUi.pathId,        entity.getPathId());        hasAny = true; }
        if (entity.getSortOrd()       != null) { update.set(dpUi.sortOrd,       entity.getSortOrd());       hasAny = true; }
        if (entity.getUseYn()         != null) { update.set(dpUi.useYn,         entity.getUseYn());         hasAny = true; }
        if (entity.getUseStartDate()  != null) { update.set(dpUi.useStartDate,  entity.getUseStartDate());  hasAny = true; }
        if (entity.getUseEndDate()    != null) { update.set(dpUi.useEndDate,    entity.getUseEndDate());    hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(dpUi.updBy,         entity.getUpdBy());         hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(dpUi.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(dpUi.uiId.eq(entity.getUiId())).execute();
        return (int) affected;
    }

    /* 표시경로 노드별 dp_ui 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    @Override
    public List<Map<String, Object>> selectPathTreeUiCnts(DpUiDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: selectPathTreeUiCnts() */\n");
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
                filtered /* 검색조건이 적용된 행 */ AS (
                    SELECT ui_id, path_id
                    FROM dp_ui t
                    WHERE 1=1
                """);
        params.put("bizCd", "dp_ui");

        /* 검색조건 — pathtreeAnd*() 헬퍼로 SQL 조각 + 파라미터 함께 추가 */
        pathtreeAndUseYn(search, sql, params);
        pathtreeAndSearchValue(search, sql, params);
        pathtreeAndDateRange(search, sql, params);

        sql.append("""
                )
                  /* (1) 일반 path_id 행 : 노드 + 자손 누적 카운트 */
                  SELECT d.root_id AS path_id, COUNT(t.ui_id) AS cnt
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
     * selectPathTreeUiCnts 전용 SQL 조건 헬퍼
     * ============================================================ */

    private void pathtreeAndUseYn(DpUiDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getUseYn())) return;
        sql.append("      AND t.use_yn = :useYn\n");
        p.put("useYn", s.getUseYn());
    }

    private void pathtreeAndSearchValue(DpUiDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getSearchValue())) return;
        String raw = s.getSearchType();
        boolean noType = !StringUtils.hasText(raw);
        String st = noType ? "" : "," + raw.trim() + ",";
        sql.append("      AND (\n");
        sql.append("            1=0\n");
        if (noType || st.contains(",uiNm,"))   sql.append("         OR t.ui_nm   ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",uiDesc,")) sql.append("         OR t.ui_desc ILIKE '%' || :searchValue || '%'\n");
        sql.append("      )\n");
        p.put("searchValue", s.getSearchValue());
    }

    private void pathtreeAndDateRange(DpUiDto.Request s, StringBuilder sql, Map<String, Object> p) {
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
