package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBatchDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBatch;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBatchRepository;
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
/** SyBatch(배치 작업) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyBatchRepositoryImpl implements QSyBatchRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyBatchRepositoryImpl";
    private static final QSyBatch syBatch = QSyBatch.syBatch;

    /*
     * baseQuery(baseSelColumnQuery 역할) — 코드성 필드 예시 코드값
     * BATCH_CYCLE      {MANUAL: '수동', HOURLY: '시간별', DAILY: '일간', WEEKLY: '주간', MONTHLY: '월간'}
     * BATCH_STATUS_CD  {PENDING: '대기', RUNNING: '실행중', DONE: '완료', FAILED: '실패'} (활성상태, DDL 기본값 'ACTIVE')
     * BATCH_STATUS (sy_code 미등록, DDL 주석 기준) {IDLE: '대기', RUNNING: '실행중', SUCCESS: '성공', FAILED: '실패'}
     */
    private JPAQuery<SyBatchDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyBatchDto.Item.class,
                        syBatch.batchId,          // 배치ID (YYMMDDhhmmss+rand4)
                        syBatch.batchCode,        // 배치코드
                        syBatch.batchNm,          // 배치명
                        syBatch.batchDesc,        // 배치설명
                        syBatch.cronExpr,         // Cron 표현식
                        syBatch.batchCycleCd,     // 주기유형 — BATCH_CYCLE {MANUAL: '수동', HOURLY: '시간별', DAILY: '일간', WEEKLY: '주간', MONTHLY: '월간'}
                        syBatch.batchLastRun,     // 최근실행일시
                        syBatch.batchNextRun,     // 다음실행예정일시
                        syBatch.batchRunCount,    // 실행횟수
                        syBatch.batchStatusCd,    // 활성상태 — BATCH_STATUS_CD {PENDING: '대기', RUNNING: '실행중', DONE: '완료', FAILED: '실패'}
                        syBatch.batchRunStatusCd,   // 실행상태 — BATCH_STATUS {IDLE: '대기', RUNNING: '실행중', SUCCESS: '성공', FAILED: '실패'}
                        syBatch.batchTimeoutSec,  // 타임아웃(초)
                        syBatch.batchMemo,        // 메모
                        syBatch.regBy,            // 등록자
                        syBatch.regDate,          // 등록일시
                        syBatch.updBy,            // 수정자
                        syBatch.updDate,          // 수정일시
                        syBatch.pathId           // 점(.) 구분 표시경로 (트리 빌드용)
                ))
                .from(syBatch);
    }

    /* 배치 키조회 */
    @Override
    public Optional<SyBatchDto.Item> selectById(String batchId) {
        SyBatchDto.Item dtl = baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syBatch.batchId.eq(batchId)).fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 배치 목록조회 */
    @Override
    public List<SyBatchDto.Item> selectList(SyBatchDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(andPathIdIn(search));
        whereList.add(QdslUtil.strEq(syBatch.batchId, search.getBatchId()));
        whereList.add(QdslUtil.strEq(syBatch.batchStatusCd, search.getStatus()));
        whereList.add(QdslUtil.strEq(syBatch.batchRunStatusCd, search.getBatchRunStatusCd()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyBatchDto.Item> query = baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<SyBatchDto.Item> list = query.fetch();
        return list;
    }

    /* 배치 페이지조회 */
    @Override
    public BasePage<SyBatchDto.Item> selectPageData(SyBatchDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(andPathIdIn(search));
        whereList.add(QdslUtil.strEq(syBatch.batchId, search.getBatchId()));
        whereList.add(QdslUtil.strEq(syBatch.batchStatusCd, search.getStatus()));
        whereList.add(QdslUtil.strEq(syBatch.batchRunStatusCd, search.getBatchRunStatusCd()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<SyBatchDto.Item> query = baseQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyBatchDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syBatch.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyBatchDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathIdIn(SyBatchDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? syBatch.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "sy_batch"))
                : null;
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("batchCode", syBatch.batchCode),
            QdslUtil.FieldDef.like("batchCycleCd", syBatch.batchCycleCd),
            QdslUtil.FieldDef.like("batchDesc", syBatch.batchDesc),
            QdslUtil.FieldDef.like("batchId", syBatch.batchId),
            QdslUtil.FieldDef.like("batchMemo", syBatch.batchMemo),
            QdslUtil.FieldDef.like("batchNm", syBatch.batchNm),
            QdslUtil.FieldDef.like("batchRunStatusCd", syBatch.batchRunStatusCd),
            QdslUtil.FieldDef.like("batchStatusCd", syBatch.batchStatusCd),
            QdslUtil.FieldDef.like("cronExpr", syBatch.cronExpr),
            QdslUtil.FieldDef.like("pathId", syBatch.pathId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("batchId", syBatch.batchId,
                   "batchNm", syBatch.batchNm,
                   "regDate", syBatch.regDate),
        new OrderSpecifier<>(Order.DESC, syBatch.regDate),
        new OrderSpecifier<>(Order.ASC, syBatch.batchId));
    }

    /* 배치 수정 */
    @Override
    public int updateSelective(SyBatch entity) {
        if (entity.getBatchId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syBatch);
        boolean hasAny = false;

        if (entity.getBatchCode()       != null) { update.set(syBatch.batchCode,       entity.getBatchCode());       hasAny = true; }
        if (entity.getBatchNm()         != null) { update.set(syBatch.batchNm,         entity.getBatchNm());         hasAny = true; }
        if (entity.getBatchDesc()       != null) { update.set(syBatch.batchDesc,       entity.getBatchDesc());       hasAny = true; }
        if (entity.getCronExpr()        != null) { update.set(syBatch.cronExpr,        entity.getCronExpr());        hasAny = true; }
        if (entity.getBatchCycleCd()    != null) { update.set(syBatch.batchCycleCd,    entity.getBatchCycleCd());    hasAny = true; }
        if (entity.getBatchLastRun()    != null) { update.set(syBatch.batchLastRun,    entity.getBatchLastRun());    hasAny = true; }
        if (entity.getBatchNextRun()    != null) { update.set(syBatch.batchNextRun,    entity.getBatchNextRun());    hasAny = true; }
        if (entity.getBatchRunCount()   != null) { update.set(syBatch.batchRunCount,   entity.getBatchRunCount());   hasAny = true; }
        if (entity.getBatchStatusCd()   != null) { update.set(syBatch.batchStatusCd,   entity.getBatchStatusCd());   hasAny = true; }
        if (entity.getBatchRunStatusCd()  != null) { update.set(syBatch.batchRunStatusCd,  entity.getBatchRunStatusCd());  hasAny = true; }
        if (entity.getBatchTimeoutSec() != null) { update.set(syBatch.batchTimeoutSec, entity.getBatchTimeoutSec()); hasAny = true; }
        if (entity.getBatchMemo()       != null) { update.set(syBatch.batchMemo,       entity.getBatchMemo());       hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(syBatch.updBy,           entity.getUpdBy());           hasAny = true; }
        update.set(syBatch.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (entity.getPathId()          != null) { update.set(syBatch.pathId,          entity.getPathId());          hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(syBatch.batchId.eq(entity.getBatchId())).execute();
        return (int) affected;
    }

    /* 표시경로 노드별 sy_batch 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    @Override
    public List<Map<String, Object>> selectPathTreeBatchCnts(SyBatchDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: selectPathTreeBatchCnts() */\n");
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
                    SELECT batch_id, path_id
                    FROM sy_batch t
                    WHERE 1=1
                """);
        params.put("bizCd", "sy_batch");

        /* 검색조건 — pathtreeAnd*() 헬퍼로 SQL 조각 + 파라미터 함께 추가 */
        pathtreeAndStatus(search, sql, params);
        pathtreeAndSearchValue(search, sql, params);
        pathtreeAndDateRange(search, sql, params);

        sql.append("""
                )
                  /* (1) 일반 path_id 행 : 노드 + 자손 누적 카운트 */
                  SELECT d.root_id AS path_id, COUNT(t.batch_id) AS cnt
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
     * selectPathTreeBatchCnts 전용 SQL 조건 헬퍼
     * ============================================================ */

    /* AND t.batch_status_cd = :statusCd */
    private void pathtreeAndStatus(SyBatchDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getStatus())) return;
        sql.append("      AND t.batch_status_cd = :statusCd\n");
        p.put("statusCd", s.getStatus());
    }

    private void pathtreeAndSearchValue(SyBatchDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getSearchValue())) return;
        String raw = s.getSearchType();
        boolean noType = !StringUtils.hasText(raw);
        String st = noType ? "" : "," + raw.trim() + ",";
        sql.append("      AND (\n");
        sql.append("            1=0\n");
        if (noType || st.contains(",batchCode,")) sql.append("         OR t.batch_code ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",batchNm,"))   sql.append("         OR t.batch_nm   ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",batchDesc,")) sql.append("         OR t.batch_desc ILIKE '%' || :searchValue || '%'\n");
        sql.append("      )\n");
        p.put("searchValue", s.getSearchValue());
    }

    private void pathtreeAndDateRange(SyBatchDto.Request s, StringBuilder sql, Map<String, Object> p) {
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
