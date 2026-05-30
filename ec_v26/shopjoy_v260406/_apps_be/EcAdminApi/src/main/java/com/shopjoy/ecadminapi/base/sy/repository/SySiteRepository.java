package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSySiteRepository;

import java.util.List;

public interface SySiteRepository extends JpaRepository<SySite, String>, QSySiteRepository {

    /* 표시경로 노드별 사이트 수 집계 (자손 누적 + 검색조건 필터, PostgreSQL 재귀 CTE)
     *   - 일반 path_id 행 : 해당 노드 + 자손 path 의 사이트 수 (검색조건 적용)
     *   - '__total__'     : 검색조건에 부합하는 전체 사이트 수 (트리 루트 "전체" 노드)
     *   - '__orphan__'    : 검색조건에 부합 + path_id IS NULL 인 사이트 수
     *
     *   파라미터: null 이면 해당 조건 무시 (`:param IS NULL OR ...` 패턴).
     *     - statusCd     : site_status_cd 일치
     *     - typeCd       : site_type_cd  일치
     *     - searchValue  : siteCode/siteNm/siteDomain/siteEmail/siteCeo 부분일치 (선택조건 OR)
     *     - dateStart/End: reg_date  범위 (BETWEEN 등가)
     */
    @Query(value = """
            WITH RECURSIVE descendants /* 각 path 의 자손 path_id (자신 포함) */ AS (
                SELECT path_id AS root_id, path_id AS leaf_id
                  FROM sy_path
                UNION ALL
                SELECT d.root_id, c.path_id
                  FROM descendants d
                  JOIN sy_path c ON c.parent_path_id = d.leaf_id
            ),
            filtered_site /* 검색조건이 적용된 사이트 집합 */ AS (
                SELECT site_id, path_id FROM sy_site s
                 WHERE (CAST(:statusCd AS varchar) IS NULL OR s.site_status_cd = :statusCd)
                   AND (CAST(:typeCd   AS varchar) IS NULL OR s.site_type_cd   = :typeCd)
                   AND (CAST(:searchValue AS varchar) IS NULL OR (
                             ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,siteCode,%') AND t.site_code ILIKE '%' || :searchValue || '%')
                          OR ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,siteNm,%') AND t.site_nm ILIKE '%' || :searchValue || '%')
                          OR ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,siteDomain,%') AND t.site_domain ILIKE '%' || :searchValue || '%')
                          OR ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,siteEmail,%') AND t.site_email ILIKE '%' || :searchValue || '%')
                          OR ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,siteCeo,%') AND t.site_ceo ILIKE '%' || :searchValue || '%')
                          ))
                   AND (CAST(:dateStart AS varchar) IS NULL OR s.reg_date >= CAST(:dateStart AS timestamp))
                   AND (CAST(:dateEnd   AS varchar) IS NULL OR s.reg_date <= CAST(:dateEnd   AS timestamp) + INTERVAL '1 day')
            )
            SELECT d.root_id AS path_id, COUNT(s.site_id) AS cnt
              FROM descendants d
              LEFT JOIN filtered_site s ON s.path_id = d.leaf_id
             GROUP BY d.root_id
            UNION ALL
            SELECT '__total__' AS path_id, COUNT(*) AS cnt FROM filtered_site
            UNION ALL
            SELECT '__orphan__' AS path_id, COUNT(*) AS cnt FROM filtered_site WHERE path_id IS NULL
            """, nativeQuery = true)
    List<Object[]> findPathSiteTreeNodeCounts(
            @Param("statusCd")    String statusCd,
            @Param("typeCd")      String typeCd,
            @Param("searchType")  String searchType,
            @Param("searchValue") String searchValue,
            @Param("dateStart")   String dateStart,
            @Param("dateEnd")     String dateEnd);
}
