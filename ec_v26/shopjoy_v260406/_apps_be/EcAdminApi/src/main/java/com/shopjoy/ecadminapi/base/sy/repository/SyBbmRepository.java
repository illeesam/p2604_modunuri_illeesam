package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBbmRepository;

import java.util.List;

public interface SyBbmRepository extends JpaRepository<SyBbm, String>, QSyBbmRepository {
    /* 표시경로 노드별 SyBbm 수 집계 (자손 누적, PostgreSQL 재귀 CTE)
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
            SELECT d.root_id AS path_id, COUNT(t.bbm_id) AS cnt
              FROM descendants d
              LEFT JOIN sy_bbm t ON t.path_id = d.leaf_id
             GROUP BY d.root_id
            UNION ALL
            SELECT '__total__' AS path_id, COUNT(*) AS cnt FROM sy_bbm
            UNION ALL
            SELECT '__orphan__' AS path_id, COUNT(*) AS cnt FROM sy_bbm WHERE path_id IS NULL
            """, nativeQuery = true)
    List<Object[]> findPathSyBbmCounts();

}
