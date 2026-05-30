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
            SELECT menu_id FROM t
            """, nativeQuery = true)
    List<String> findTreeMenuIds(@Param("rootMenuId") String rootMenuId);
    /* 표시경로 노드별 SyMenu 수 집계 (자손 누적, PostgreSQL 재귀 CTE)
     *   - 일반 path_id : 해당 노드 + 자손 path 의 row 수
     *   - '__total__'  : 전체 row 수 (트리 루트 "전체" 노드)
     *   - '__orphan__' : path_id IS NULL 인 row 수 */
    @Query(value = """
            WITH RECURSIVE descendants AS (
                SELECT path_id AS root_id, path_id AS leaf_id FROM sy_path
                UNION ALL
                SELECT d.root_id, c.path_id
                  FROM descendants d JOIN sy_path c ON c.parent_path_id = d.leaf_id
            )
            SELECT d.root_id AS path_id, COUNT(t.menu_id) AS cnt
              FROM descendants d
              LEFT JOIN sy_menu t ON t.path_id = d.leaf_id
             GROUP BY d.root_id
            UNION ALL
            SELECT '__total__' AS path_id, COUNT(*) AS cnt FROM sy_menu
            UNION ALL
            SELECT '__orphan__' AS path_id, COUNT(*) AS cnt FROM sy_menu WHERE path_id IS NULL
            """, nativeQuery = true)
    List<Object[]> findPathSyMenuCounts();

}
