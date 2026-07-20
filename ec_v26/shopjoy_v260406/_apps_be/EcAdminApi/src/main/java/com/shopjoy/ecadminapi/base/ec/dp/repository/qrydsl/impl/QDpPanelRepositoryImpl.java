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
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpPanel;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpPanelRepository;
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
@RequiredArgsConstructor
public class QDpPanelRepositoryImpl implements QDpPanelRepository {

    private final JPAQueryFactory queryFactory;
    private final SyPathRepository syPathRepository;

    @PersistenceContext
    private EntityManager em;

    private static final String QRY_SRC = "base.ec.dp.repository.qrydsl.impl.QDpPanelRepositoryImpl";
    private static final QDpPanel dpPanel = QDpPanel.dpPanel;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", dpPanel.regDate,
        "upd_date", dpPanel.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("contentJson", dpPanel.contentJson),
        Map.entry("dispPanelStatusCd", dpPanel.dispPanelStatusCd),
        Map.entry("dispPanelStatusCdBefore", dpPanel.dispPanelStatusCdBefore),
        Map.entry("panelId", dpPanel.panelId),
        Map.entry("panelNm", dpPanel.panelNm),
        Map.entry("panelTypeCd", dpPanel.panelTypeCd),
        Map.entry("pathId", dpPanel.pathId),
        Map.entry("siteId", dpPanel.siteId),
        Map.entry("useYn", dpPanel.useYn),
        Map.entry("visibilityTargets", dpPanel.visibilityTargets)
    );

    /* 전시 패널 baseSelColumnQuery */
    private JPAQuery<DpPanelDto.Item> baseSelColumnQuery() {
        return queryFactory.select(Projections.bean(DpPanelDto.Item.class,
                dpPanel.panelId, dpPanel.siteId, dpPanel.areaId, dpPanel.panelNm, dpPanel.panelTypeCd, dpPanel.pathId,
                dpPanel.visibilityTargets, dpPanel.useYn, dpPanel.useStartDate, dpPanel.useEndDate,
                dpPanel.dispPanelStatusCd, dpPanel.dispPanelStatusCdBefore, dpPanel.contentJson,
                dpPanel.regBy, dpPanel.regDate, dpPanel.updBy, dpPanel.updDate
        )).from(dpPanel);
    }

    /* 전시 패널 키조회 */
    @Override
    public Optional<DpPanelDto.Item> selectById(String panelId) {
        return Optional.ofNullable(baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(dpPanel.panelId.eq(panelId)).fetchOne());
    }

    /* 전시 패널 목록조회 */
    @Override
    public List<DpPanelDto.Item> selectList(DpPanelDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpPanelDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(dpPanel.siteId, search.getSiteId()),
                    QdslUtil.strEq(dpPanel.areaId, search.getAreaId()),
                    QdslUtil.strIn(dpPanel.areaId, search.getAreaIds()),
                    andPathIdIn(search),
                    QdslUtil.strEq(dpPanel.panelId, search.getPanelId()),
                    QdslUtil.strEq(dpPanel.dispPanelStatusCd, search.getDispPanelStatusCd()),
                    QdslUtil.strEq(dpPanel.panelTypeCd, search.getPanelTypeCd()),
                    QdslUtil.strEq(dpPanel.useYn, search.getUseYn()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 전시 패널 페이지조회 */
    @Override
    public DpPanelDto.PageResponse selectPageData(DpPanelDto.Request search) {
        int pageNo = search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(dpPanel.siteId, search.getSiteId()),
                QdslUtil.strEq(dpPanel.areaId, search.getAreaId()),
                QdslUtil.strIn(dpPanel.areaId, search.getAreaIds()),
                andPathIdIn(search),
                QdslUtil.strEq(dpPanel.panelId, search.getPanelId()),
                QdslUtil.strEq(dpPanel.dispPanelStatusCd, search.getDispPanelStatusCd()),
                QdslUtil.strEq(dpPanel.panelTypeCd, search.getPanelTypeCd()),
                QdslUtil.strEq(dpPanel.useYn, search.getUseYn()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };
        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<DpPanelDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<DpPanelDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();
        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(dpPanel.count())
                .where(wheres)
                .fetchOne();
        DpPanelDto.PageResponse res = new DpPanelDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathIdIn(DpPanelDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? dpPanel.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "dp_panel"))
                : null;
    }

private BooleanExpression andSearchValueLike(DpPanelDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(DpPanelDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, dpPanel.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, dpPanel.panelId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("panelId".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpPanel.panelId));
                } else if ("panelNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpPanel.panelNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpPanel.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, dpPanel.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, dpPanel.panelId));
        }
        return orders;
    }

    /* 전시 패널 수정 */

    @Override
    public int updateSelective(DpPanel entity) {
        if (entity.getPanelId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(dpPanel);
        boolean hasAny = false;
        if (entity.getSiteId()                  != null) { update.set(dpPanel.siteId,                  entity.getSiteId());                  hasAny = true; }
        if (entity.getAreaId()                  != null) { update.set(dpPanel.areaId,                  entity.getAreaId());                  hasAny = true; }
        if (entity.getPanelNm()                 != null) { update.set(dpPanel.panelNm,                 entity.getPanelNm());                 hasAny = true; }
        if (entity.getPanelTypeCd()             != null) { update.set(dpPanel.panelTypeCd,             entity.getPanelTypeCd());             hasAny = true; }
        if (entity.getPathId()                  != null) { update.set(dpPanel.pathId,                  entity.getPathId());                  hasAny = true; }
        if (entity.getVisibilityTargets()       != null) { update.set(dpPanel.visibilityTargets,       entity.getVisibilityTargets());       hasAny = true; }
        if (entity.getUseYn()                   != null) { update.set(dpPanel.useYn,                   entity.getUseYn());                   hasAny = true; }
        if (entity.getUseStartDate()            != null) { update.set(dpPanel.useStartDate,            entity.getUseStartDate());            hasAny = true; }
        if (entity.getUseEndDate()              != null) { update.set(dpPanel.useEndDate,              entity.getUseEndDate());              hasAny = true; }
        if (entity.getDispPanelStatusCd()       != null) { update.set(dpPanel.dispPanelStatusCd,       entity.getDispPanelStatusCd());       hasAny = true; }
        if (entity.getDispPanelStatusCdBefore() != null) { update.set(dpPanel.dispPanelStatusCdBefore, entity.getDispPanelStatusCdBefore()); hasAny = true; }
        if (entity.getContentJson()             != null) { update.set(dpPanel.contentJson,             entity.getContentJson());             hasAny = true; }
        if (entity.getUpdBy()                   != null) { update.set(dpPanel.updBy,                   entity.getUpdBy());                   hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(dpPanel.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(dpPanel.panelId.eq(entity.getPanelId())).execute();
    }

    /* 표시경로 노드별 dp_panel 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    @Override
    public List<Map<String, Object>> selectPathTreePanelCnts(DpPanelDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: selectPathTreePanelCnts() */\n");
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
                    SELECT panel_id, path_id
                    FROM dp_panel t
                    WHERE 1=1
                """);
        params.put("bizCd", "dp_panel");

        /* 검색조건 — pathtreeAnd*() 헬퍼로 SQL 조각 + 파라미터 함께 추가 */
        pathtreeAndStatus(search, sql, params);
        pathtreeAndSearchValue(search, sql, params);
        pathtreeAndDateRange(search, sql, params);

        sql.append("""
                )
                  /* (1) 일반 path_id 행 : 노드 + 자손 누적 카운트 */
                  SELECT d.root_id AS path_id, COUNT(t.panel_id) AS cnt
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
     * selectPathTreePanelCnts 전용 SQL 조건 헬퍼 (fpdp prefix)
     *   - QueryDSL andXxx() (BooleanExpression 반환) 과 구분
     *   - 각 메서드는 SQL 조각을 sql 에 추가하고 동시에 params 에 바인딩
     * ============================================================ */

    /* AND t.disp_panel_status_cd = :statusCd */
    private void pathtreeAndStatus(DpPanelDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getDispPanelStatusCd())) return;
        sql.append("      AND t.disp_panel_status_cd = :statusCd\n");
        p.put("statusCd", s.getDispPanelStatusCd());
    }

    /* AND ( OR t.col_x ILIKE :searchValue ... ) — searchType csv 로 컬럼 분기 */
    private void pathtreeAndSearchValue(DpPanelDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getSearchValue())) return;
        String raw = s.getSearchType();
        boolean noType = !StringUtils.hasText(raw);
        String searchType = noType ? "" : "," + raw.trim() + ",";
        sql.append("      AND (\n");
        sql.append("            1=0\n");
        if (noType || searchType.contains(",panelNm,")) sql.append("         OR t.panel_nm ILIKE '%' || :searchValue || '%'\n");
        sql.append("      )\n");
        p.put("searchValue", s.getSearchValue());
    }

    /* AND t.reg_date >= :dateStart AND t.reg_date <= :dateEnd + 1 day */
    private void pathtreeAndDateRange(DpPanelDto.Request s, StringBuilder sql, Map<String, Object> p) {
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
