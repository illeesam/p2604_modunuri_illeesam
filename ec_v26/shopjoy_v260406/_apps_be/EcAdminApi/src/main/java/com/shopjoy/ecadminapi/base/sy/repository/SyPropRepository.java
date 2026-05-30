package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyPropRepository;

import java.util.List;

public interface SyPropRepository extends JpaRepository<SyProp, String>, QSyPropRepository {
    /* 표시경로 노드별 SyProp 수 집계 (검색조건 + 자손 누적, PostgreSQL 재귀 CTE)
     *   - 일반 path_id : 해당 노드 + 자손 path 의 row 수 (검색조건 적용)
     *   - '__total__'  : 전체 row 수 (트리 루트 "전체" 노드, 검색조건 적용)
     *   - '__orphan__' : path_id IS NULL 인 row 수 (검색조건 적용)
     *
     *   파라미터 — null 이면 해당 조건 무시:
     *     - useYn       : use_yn       일치
     *     - propType    : prop_type_cd 일치
     *     - searchValue : prop_key/prop_value/prop_label 부분일치 OR 검색 */
    @Query(value = """
            WITH RECURSIVE descendants AS (
                SELECT path_id AS root_id, path_id AS leaf_id FROM sy_path
                UNION ALL
                SELECT d.root_id, c.path_id
                  FROM descendants d JOIN sy_path c ON c.parent_path_id = d.leaf_id
            ),
            filtered AS (
                SELECT prop_id, path_id FROM sy_prop t
                 WHERE (CAST(:useYn       AS varchar) IS NULL OR t.use_yn       = :useYn)
                   AND (CAST(:propType    AS varchar) IS NULL OR t.prop_type_cd = :propType)
                   AND (CAST(:searchValue AS varchar) IS NULL OR
                        t.prop_key   ILIKE '%' || :searchValue || '%' OR
                        t.prop_value ILIKE '%' || :searchValue || '%' OR
                        t.prop_label ILIKE '%' || :searchValue || '%')
            )
            SELECT d.root_id AS path_id, COUNT(t.prop_id) AS cnt
              FROM descendants d
              LEFT JOIN filtered t ON t.path_id = d.leaf_id
             GROUP BY d.root_id
            UNION ALL
            SELECT '__total__' AS path_id, COUNT(*) AS cnt FROM filtered
            UNION ALL
            SELECT '__orphan__' AS path_id, COUNT(*) AS cnt FROM filtered WHERE path_id IS NULL
            """, nativeQuery = true)
    List<Object[]> findPathSyPropCounts(
            @Param("useYn")       String useYn,
            @Param("propType")    String propType,
            @Param("searchValue") String searchValue);
}
