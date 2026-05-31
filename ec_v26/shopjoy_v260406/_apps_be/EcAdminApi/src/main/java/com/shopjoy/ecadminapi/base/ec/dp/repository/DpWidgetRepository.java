package com.shopjoy.ecadminapi.base.ec.dp.repository;

import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpWidgetRepository;

import java.util.List;

public interface DpWidgetRepository extends JpaRepository<DpWidget, String>, QDpWidgetRepository {

    /* 표시경로 노드별 DpWidget 수 집계 (검색조건 + 자손 누적, PostgreSQL 재귀 CTE)
     *   dp_widget 은 path_id 가 없으므로 widget_lib_id → dp_widget_lib.path_id 로 간접 join.
     *   - '__total__'  : 전체 row 수 (검색조건 적용)
     *
     *   파라미터 — null 이면 해당 조건 무시:
     *     - useYn       : use_yn 일치
     *     - searchType  : searchValue 검색 대상 컬럼 csv (',a,b,' wrap)
     *     - searchValue : widget_nm/widget_desc/widget_title 부분일치 OR
     *     - dateStart/End : reg_date 범위 */
    @Query(value = """
            WITH RECURSIVE descendants AS (
                SELECT path_id AS root_id,
                       path_id AS leaf_id
                FROM sy_path
                WHERE biz_cd = 'dp_widget'
                UNION ALL
                SELECT d.root_id,
                       c.path_id
                  FROM descendants d
                  JOIN sy_path c ON c.parent_path_id = d.leaf_id
                 WHERE c.biz_cd = 'dp_widget'
            ),
            filtered AS (
                SELECT t.widget_id,
                       l.path_id
                FROM dp_widget t
                  LEFT JOIN dp_widget_lib l ON l.widget_lib_id = t.widget_lib_id
                 WHERE 1=1
                   AND (CAST(:useYn AS varchar) IS NULL OR t.use_yn = :useYn)
                   AND (CAST(:searchValue AS varchar) IS NULL OR (
                             ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,widgetNm,%')    AND t.widget_nm    ILIKE '%' || :searchValue || '%')
                          OR ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,widgetDesc,%')  AND t.widget_desc  ILIKE '%' || :searchValue || '%')
                          OR ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,widgetTitle,%') AND t.widget_title ILIKE '%' || :searchValue || '%')
                          ))
                   AND (CAST(:dateStart AS varchar) IS NULL OR t.reg_date >= CAST(:dateStart AS timestamp))
                   AND (CAST(:dateEnd   AS varchar) IS NULL OR t.reg_date <= CAST(:dateEnd   AS timestamp) + INTERVAL '1 day')
            )
            SELECT d.root_id AS path_id,
                   COUNT(t.widget_id) AS cnt
              FROM descendants d
              LEFT JOIN filtered t ON t.path_id = d.leaf_id
             GROUP BY d.root_id
            UNION ALL
            SELECT '__total__' AS path_id,
                   COUNT(*) AS cnt
            FROM filtered
            UNION ALL
            SELECT '__orphan__' AS path_id,
                   COUNT(*) AS cnt
            FROM filtered
            WHERE path_id IS NULL
            """, nativeQuery = true)
    List<Object[]> findPathDpWidgetTreeNodeCounts(
            @Param("useYn")       String useYn,
            @Param("searchType")  String searchType,
            @Param("searchValue") String searchValue,
            @Param("dateStart")   String dateStart,
            @Param("dateEnd")     String dateEnd);
}
