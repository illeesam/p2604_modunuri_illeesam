package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBatchRepository;

public interface SyBatchRepository extends JpaRepository<SyBatch, String>, QSyBatchRepository {
    List<SyBatch> findByBatchStatusCd(String batchStatusCd);
    Optional<SyBatch> findByBatchCode(String batchCode);
        /* 표시경로 노드별 SyBatch 수 집계 (검색조건 + 자손 누적, PostgreSQL 재귀 CTE)
     *   - 일반 path_id : 해당 노드 + 자손 path 의 row 수 (검색조건 적용)
     *   - '__total__'  : 전체 row 수 (검색조건 적용)
     *   - '__orphan__' : path_id IS NULL 인 row 수 (검색조건 적용)
     *
     *   파라미터 — null 이면 해당 조건 무시:
     *     - status     : batch_status_cd 일치
     *     - searchValue : batch_code, batch_nm, batch_desc 부분일치 OR
     *     - dateStart/End : reg_date 범위 */
    @Query(value = """
            WITH RECURSIVE descendants AS (
                SELECT path_id AS root_id, path_id AS leaf_id FROM sy_path
                UNION ALL
                SELECT d.root_id, c.path_id
                  FROM descendants d JOIN sy_path c ON c.parent_path_id = d.leaf_id
            ),
            filtered AS (
                SELECT batch_id, path_id FROM sy_batch t
                 WHERE 1=1
                   AND (CAST(:statusCd AS varchar) IS NULL OR t.batch_status_cd = :statusCd)
                   AND (CAST(:searchValue AS varchar) IS NULL OR (
                             ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,batchCode,%') AND t.batch_code ILIKE '%' || :searchValue || '%')
                          OR ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,batchNm,%') AND t.batch_nm ILIKE '%' || :searchValue || '%')
                          OR ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,batchDesc,%') AND t.batch_desc ILIKE '%' || :searchValue || '%')
                          ))
                   AND (CAST(:dateStart AS varchar) IS NULL OR t.reg_date >= CAST(:dateStart AS timestamp))
                   AND (CAST(:dateEnd   AS varchar) IS NULL OR t.reg_date <= CAST(:dateEnd   AS timestamp) + INTERVAL '1 day')
            )
            SELECT d.root_id AS path_id, COUNT(t.batch_id) AS cnt
              FROM descendants d
              LEFT JOIN filtered t ON t.path_id = d.leaf_id
             GROUP BY d.root_id
            UNION ALL
            SELECT '__total__' AS path_id, COUNT(*) AS cnt FROM filtered
            UNION ALL
            SELECT '__orphan__' AS path_id, COUNT(*) AS cnt FROM filtered WHERE path_id IS NULL
            """, nativeQuery = true)
    List<Object[]> findPathSyBatchTreeNodeCounts(@Param("statusCd")    String statusCd,
            @Param("searchType")  String searchType,
            @Param("searchValue") String searchValue,
            @Param("dateStart")   String dateStart,
            @Param("dateEnd")     String dateEnd);

}
