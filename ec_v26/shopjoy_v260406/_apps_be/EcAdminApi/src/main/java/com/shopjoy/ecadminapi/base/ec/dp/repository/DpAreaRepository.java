package com.shopjoy.ecadminapi.base.ec.dp.repository;

import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpAreaRepository;

import java.util.List;

public interface DpAreaRepository extends JpaRepository<DpArea, String>, QDpAreaRepository {
    /* 표시경로 노드별 DpArea 수 집계 (자손 누적, PostgreSQL 재귀 CTE)
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
            SELECT d.root_id AS path_id, COUNT(t.area_id) AS cnt
              FROM descendants d
              LEFT JOIN dp_area t ON t.path_id = d.leaf_id
             GROUP BY d.root_id
            UNION ALL
            SELECT '__total__' AS path_id, COUNT(*) AS cnt FROM dp_area
            UNION ALL
            SELECT '__orphan__' AS path_id, COUNT(*) AS cnt FROM dp_area WHERE path_id IS NULL
            """, nativeQuery = true)
    List<Object[]> findPathDpAreaCounts();

}
