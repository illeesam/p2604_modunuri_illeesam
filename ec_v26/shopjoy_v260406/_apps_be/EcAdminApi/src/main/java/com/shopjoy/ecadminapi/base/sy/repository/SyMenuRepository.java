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
}
