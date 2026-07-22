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
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpArea;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpAreaRepository;
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
import com.shopjoy.ecadminapi.common.util.QdslUtil;
@RequiredArgsConstructor
public class QDpAreaRepositoryImpl implements QDpAreaRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.ec.dp.repository.qrydsl.impl.QDpAreaRepositoryImpl";
    private static final QDpArea dpArea = QDpArea.dpArea;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("areaCd", dpArea.areaCd),
        Map.entry("areaDesc", dpArea.areaDesc),
        Map.entry("areaId", dpArea.areaId),
        Map.entry("areaNm", dpArea.areaNm),
        Map.entry("areaTypeCd", dpArea.areaTypeCd),
        Map.entry("pathId", dpArea.pathId),
        Map.entry("siteId", dpArea.siteId),
        Map.entry("uiId", dpArea.uiId),
        Map.entry("useYn", dpArea.useYn)
    );

    /*
     * baseQuery — 코드성 필드 예시 코드값
     * USE_YN        {Y: '사용', N: '미사용'}
     * AREA_TYPE_CD  (코드그룹: DISP_AREA_TYPE, sy_code 실제 등록값 미확인 — 필드 용도만 참고)
     */
    private JPAQuery<DpAreaDto.Item> baseQuery() {
        return queryFactory.select(Projections.bean(DpAreaDto.Item.class,
                dpArea.areaId,        // 영역ID (PK, YYMMDDhhmmss+rand4)
                dpArea.uiId,          // UIID (dp_ui.ui_id, FK)
                dpArea.siteId,        // 사이트ID (sy_site.site_id)
                dpArea.areaCd,        // 영역코드 (예: MAIN_TOP, SIDEBAR_MID)
                dpArea.areaNm,        // 영역명
                dpArea.areaTypeCd,    // 영역유형 — AREA_TYPE_CD (코드: DISP_AREA_TYPE)
                dpArea.areaDesc,      // 영역설명
                dpArea.pathId,        // 점(.) 구분 표시경로
                dpArea.useYn,         // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                dpArea.useStartDate,  // 사용시작일
                dpArea.useEndDate,    // 사용종료일
                dpArea.regBy,         // 등록자
                dpArea.regDate,       // 등록일시
                dpArea.updBy,         // 수정자
                dpArea.updDate        // 수정일시
        )).from(dpArea);
    }

    /* 전시 영역 키조회 */
    @Override
    public Optional<DpAreaDto.Item> selectById(String areaId) {
        return Optional.ofNullable(baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(dpArea.areaId.eq(areaId)).fetchOne());
    }

    /* 전시 영역 목록조회 */
    @Override
    public List<DpAreaDto.Item> selectList(DpAreaDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpAreaDto.Item> query = baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(dpArea.uiId, search.getUiIds()),
                    QdslUtil.strEq(dpArea.siteId, search.getSiteId()),
                    andPathIdIn(search),
                    QdslUtil.strEq(dpArea.useYn, search.getUseYn()),
                    QdslUtil.strEq(dpArea.areaId, search.getAreaId()),
                    QdslUtil.strEq(dpArea.uiId, search.getUiId()),
                    QdslUtil.strEq(dpArea.areaTypeCd, search.getAreaTypeCd()),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 전시 영역 페이지조회 */
    @Override
    public DpAreaDto.PageResponse selectPageData(DpAreaDto.Request search) {
        int pageNo = search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(dpArea.uiId, search.getUiIds()),
                QdslUtil.strEq(dpArea.siteId, search.getSiteId()),
                andPathIdIn(search),
                QdslUtil.strEq(dpArea.useYn, search.getUseYn()),
                QdslUtil.strEq(dpArea.areaId, search.getAreaId()),
                QdslUtil.strEq(dpArea.uiId, search.getUiId()),
                QdslUtil.strEq(dpArea.areaTypeCd, search.getAreaTypeCd()),
                andSearchValueLike(search)
        };
        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<DpAreaDto.Item> query = baseQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<DpAreaDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();
        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(dpArea.count())
                .where(wheres)
                .fetchOne();
        DpAreaDto.PageResponse res = new DpAreaDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathIdIn(DpAreaDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? dpArea.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "dp_area"))
                : null;
    }

    private BooleanExpression andSearchValueLike(DpAreaDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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
            orders.add(new OrderSpecifier(Order.DESC, dpArea.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, dpArea.areaId));
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
                    orders.add(new OrderSpecifier(order, dpArea.areaId));
                } else if ("areaNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpArea.areaNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpArea.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, dpArea.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, dpArea.areaId));
        }
        return orders;
    }

    /* 전시 영역 수정 */
    @Override
    public int updateSelective(DpArea entity) {
        if (entity.getAreaId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(dpArea);
        boolean hasAny = false;
        if (entity.getUiId()         != null) { update.set(dpArea.uiId,         entity.getUiId());         hasAny = true; }
        if (entity.getSiteId()       != null) { update.set(dpArea.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getAreaCd()       != null) { update.set(dpArea.areaCd,       entity.getAreaCd());       hasAny = true; }
        if (entity.getAreaNm()       != null) { update.set(dpArea.areaNm,       entity.getAreaNm());       hasAny = true; }
        if (entity.getAreaTypeCd()   != null) { update.set(dpArea.areaTypeCd,   entity.getAreaTypeCd());   hasAny = true; }
        if (entity.getAreaDesc()     != null) { update.set(dpArea.areaDesc,     entity.getAreaDesc());     hasAny = true; }
        if (entity.getPathId()       != null) { update.set(dpArea.pathId,       entity.getPathId());       hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(dpArea.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getUseStartDate() != null) { update.set(dpArea.useStartDate, entity.getUseStartDate()); hasAny = true; }
        if (entity.getUseEndDate()   != null) { update.set(dpArea.useEndDate,   entity.getUseEndDate());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(dpArea.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(dpArea.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(dpArea.areaId.eq(entity.getAreaId())).execute();
    }

    /* 표시경로 노드별 dp_area 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    @Override
    public List<Map<String, Object>> selectPathTreeAreaCnts(DpAreaDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: selectPathTreeAreaCnts() */\n");
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
                    SELECT area_id, path_id
                    FROM dp_area t
                    WHERE 1=1
                """);
        params.put("bizCd", "dp_area");

        /* 검색조건 — pathtreeAnd*() 헬퍼로 SQL 조각 + 파라미터 함께 추가 */
        pathtreeAndUseYn(search, sql, params);
        pathtreeAndSearchValue(search, sql, params);
        pathtreeAndDateRange(search, sql, params);

        sql.append("""
                )
                  /* (1) 일반 path_id 행 : 노드 + 자손 누적 카운트 */
                  SELECT d.root_id AS path_id, COUNT(t.area_id) AS cnt
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
     * selectPathTreeAreaCnts 전용 SQL 조건 헬퍼
     * ============================================================ */

    private void pathtreeAndUseYn(DpAreaDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getUseYn())) return;
        sql.append("      AND t.use_yn = :useYn\n");
        p.put("useYn", s.getUseYn());
    }

    private void pathtreeAndSearchValue(DpAreaDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getSearchValue())) return;
        String raw = s.getSearchType();
        boolean noType = !StringUtils.hasText(raw);
        String st = noType ? "" : "," + raw.trim() + ",";
        sql.append("      AND (\n");
        sql.append("            1=0\n");
        if (noType || st.contains(",areaNm,"))   sql.append("         OR t.area_nm   ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",areaDesc,")) sql.append("         OR t.area_desc ILIKE '%' || :searchValue || '%'\n");
        sql.append("      )\n");
        p.put("searchValue", s.getSearchValue());
    }

    private void pathtreeAndDateRange(DpAreaDto.Request s, StringBuilder sql, Map<String, Object> p) {
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
