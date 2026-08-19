package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
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
    private static final QDpUi dpUi = QDpUi.dpUi;    /*
     * baseQuery — 코드성 필드 예시 코드값
     * USE_YN           {Y: '사용', N: '미사용'}
     * DEVICE_TYPE_CD   (코드그룹: DEVICE_TYPE, sy_code 실제 등록값 미확인 — 필드 용도만 참고)
     */
    private JPAQuery<DpUiDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(DpUiDto.Item.class,
                        dpUi.uiId,          // UIID (PK, YYMMDDhhmmss+rand4)
                        dpUi.uiCd,          // UI코드 (예: MOBILE_MAIN, PC_MAIN)
                        dpUi.uiNm,          // UI명
                        dpUi.uiDesc,        // UI설명
                        dpUi.deviceTypeCd,  // 디바이스유형 — DEVICE_TYPE_CD (코드: DEVICE_TYPE_CD)
                        dpUi.pathId,        // 페이지경로
                        dpUi.sortOrd,       // 정렬순서
                        dpUi.useYn,         // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                        dpUi.useStartDate,  // 사용시작일
                        dpUi.useEndDate,    // 사용종료일
                        dpUi.regBy,         // 등록자
                        dpUi.regDate,       // 등록일시
                        dpUi.updBy,         // 수정자
                        dpUi.updDate        // 수정일시
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
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(andPathIdIn(search));
        wheres.add(QdslUtil.strEq(dpUi.uiId, search.getUiId()));
        wheres.add(QdslUtil.strEq(dpUi.deviceTypeCd, search.getDeviceTypeCd()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            wheres.add(QdslUtil.dateBetween(dpUi.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else {
            wheres.add(QdslUtil.dateBetween(dpUi.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));   // reg_date (기본)
        }
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<DpUiDto.Item> query = baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres.toArray(BooleanExpression[]::new))
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
    public BasePage<DpUiDto.Item> selectPageData(DpUiDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(andPathIdIn(search));
        whereList.add(QdslUtil.strEq(dpUi.uiId, search.getUiId()));
        whereList.add(QdslUtil.strEq(dpUi.deviceTypeCd, search.getDeviceTypeCd()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(dpUi.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else if ("reg_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(dpUi.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        }
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

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

        BasePage<DpUiDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathIdIn(DpUiDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? dpUi.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "dp_ui"))
                : null;
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("deviceTypeCd", dpUi.deviceTypeCd),
            QdslUtil.FieldDef.like("pathId", dpUi.pathId),
            QdslUtil.FieldDef.like("uiCd", dpUi.uiCd),
            QdslUtil.FieldDef.like("uiDesc", dpUi.uiDesc),
            QdslUtil.FieldDef.like("uiId", dpUi.uiId),
            QdslUtil.FieldDef.like("uiNm", dpUi.uiNm),
            QdslUtil.FieldDef.like("useYn", dpUi.useYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("uiId", dpUi.uiId,
                   "uiNm", dpUi.uiNm,
                   "regDate", dpUi.regDate,
                   "sortOrd", dpUi.sortOrd),
        new OrderSpecifier<>(Order.ASC, dpUi.sortOrd),
        new OrderSpecifier<>(Order.ASC, dpUi.regDate),
        new OrderSpecifier<>(Order.ASC, dpUi.uiId));
    }

    /* 전시 UI 수정 */
    @Override
    public int updateSelective(DpUi entity) {
        if (entity.getUiId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(dpUi);
        boolean hasAny = false;

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
        if (StringUtils.hasText(s.getDateRangeStart())) {
            sql.append("      AND t.reg_date >= CAST(:dateRangeStart AS timestamp)\n");
            p.put("dateRangeStart", s.getDateRangeStart());
        }
        if (StringUtils.hasText(s.getDateRangeEnd())) {
            sql.append("      AND t.reg_date <= CAST(:dateRangeEnd   AS timestamp) + INTERVAL '23:59:59.999999'\n");
            p.put("dateRangeEnd", s.getDateRangeEnd());
        }
    }
}
