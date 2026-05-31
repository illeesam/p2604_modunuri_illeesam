package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyMenuRepository;

import java.util.List;

public interface SyMenuRepository extends JpaRepository<SyMenu, String>, QSyMenuRepository {

    /* 루트 menu + 모든 자손 menu_id 수집 (PostgreSQL 재귀 CTE) */
    @Query(value = """
            WITH RECURSIVE t /* 메뉴 parent_menu_id 의 자식 menu_id (list) 반환 */ AS (
                SELECT menu_id
                  FROM sy_menu
                 WHERE menu_id = :rootMenuId
                UNION ALL
                SELECT c.menu_id
                  FROM sy_menu c
                  JOIN t ON c.parent_menu_id = t.menu_id
            )
            SELECT menu_id
            FROM t
            """, nativeQuery = true)
    List<String> findTreeMenuIds(@Param("rootMenuId") String rootMenuId);

    /* 표시경로 노드별 SyMenu 수 집계 (검색조건 + 자손 누적, PostgreSQL 재귀 CTE)
     *   sy_menu 는 path_id 컬럼이 없지만 menu_code 가 sy_path.path_id 와 동일 규칙으로 작성됨 (관례).
     *   따라서 sy_menu.menu_code = sy_path.path_id 로 left join 하여 자손까지 누적 카운트.
     *   - '__total__'  : 전체 row 수 (검색조건 적용)
     *
     *   파라미터 — null 이면 해당 조건 무시:
     *     - useYn       : use_yn 일치
     *     - searchType  : searchValue 검색 대상 컬럼 csv (',a,b,' wrap)
     *     - searchValue : menu_code/menu_nm/menu_remark 부분일치 OR
     *     - dateStart/End : reg_date 범위 */
    @Query(value = """
            WITH RECURSIVE descendants /* 메뉴 표시경로 자손 (biz_cd = :bizCd 한정) */ AS (
                SELECT path_id AS root_id,
                       path_id AS leaf_id
                FROM sy_path
                WHERE biz_cd = :bizCd
                UNION ALL
                SELECT d.root_id,
                       c.path_id
                  FROM descendants d
                  JOIN sy_path c ON c.parent_path_id = d.leaf_id
                 WHERE c.biz_cd = :bizCd
            ),
            filtered AS (
                SELECT menu_id,
                       menu_code
                FROM sy_menu t
                 WHERE 1=1
                   AND (CAST(:useYn AS varchar) IS NULL OR t.use_yn = :useYn)
                   AND (CAST(:searchValue AS varchar) IS NULL OR (
                             ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,menuCode,%')   AND t.menu_code   ILIKE '%' || :searchValue || '%')
                          OR ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,menuNm,%')     AND t.menu_nm     ILIKE '%' || :searchValue || '%')
                          OR ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,menuRemark,%') AND t.menu_remark ILIKE '%' || :searchValue || '%')
                          ))
                   AND (CAST(:dateStart AS varchar) IS NULL OR t.reg_date >= CAST(:dateStart AS timestamp))
                   AND (CAST(:dateEnd   AS varchar) IS NULL OR t.reg_date <= CAST(:dateEnd   AS timestamp) + INTERVAL '1 day')
            )
            /* (1) 일반 path_id 행 : 노드 + 자손 누적 카운트 */
            SELECT d.root_id AS path_id,
                   COUNT(t.menu_id) AS cnt
              FROM descendants d
              LEFT JOIN filtered t ON t.menu_code = d.leaf_id
             GROUP BY d.root_id
            UNION ALL
            /* (2) '__total__' : 트리 루트 "전체" 노드용 — 검색조건에 부합하는 전체 카운트 */
            SELECT '__total__' AS path_id,
                   COUNT(*) AS cnt
            FROM filtered
            """, nativeQuery = true)
    List<Object[]> findPathSyMenuTreeNodeCounts(
            @Param("bizCd")     String bizCd,
            @Param("useYn")       String useYn,
            @Param("searchType")  String searchType,
            @Param("searchValue") String searchValue,
            @Param("dateStart")   String dateStart,
            @Param("dateEnd")     String dateEnd);

}
