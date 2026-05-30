package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyPathRepository;

import java.util.List;

public interface SyPathRepository extends JpaRepository<SyPath, String>, QSyPathRepository {

    /* 루트 path + 모든 자손 path_id 수집 (PostgreSQL 재귀 CTE) */
    @Query(value = """
            WITH RECURSIVE t /* 표시경로 parent_path_id 의 자식 path_id (list) 반환 */ AS (
                SELECT path_id
                  FROM sy_path
                 WHERE path_id = :rootPathId
                UNION ALL
                SELECT c.path_id
                  FROM sy_path c
                  JOIN t ON c.parent_path_id = t.path_id
            )
            SELECT path_id FROM t
            """, nativeQuery = true)
    List<String> findTreePathIds(@Param("rootPathId") String rootPathId);
}
