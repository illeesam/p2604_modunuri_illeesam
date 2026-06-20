package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyPathRepository;

import java.util.List;

public interface SyPathRepository extends JpaRepository<SyPath, String>, QSyPathRepository {

    /* 루트 path + 모든 자손 path_id 수집 (PostgreSQL 재귀 CTE, biz_cd 한정) */
    @Query(value = """
            /* com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository :: findTreePathIds() */
            WITH RECURSIVE t /* 표시경로 parent_path_id 의 자식 path_id (list) 반환 */ AS (
                SELECT path_id
                FROM sy_path
                WHERE path_id = :rootPathId
                  AND biz_cd  = :bizCd
                UNION ALL
                SELECT c.path_id
                FROM sy_path c
                JOIN t ON c.parent_path_id = t.path_id
                WHERE c.biz_cd = :bizCd
            )
            SELECT path_id
            FROM t
            """, nativeQuery = true)
    List<String> findTreePathIds(@Param("rootPathId") String rootPathId,
                                 @Param("bizCd")      String bizCd);

    /* biz_cd 기준 등록된 모든 path_id 목록 (고아 필터용) */
    @Query(value = """
            /* com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository :: findAllPathIdsByBizCd() */
            SELECT path_id FROM sy_path WHERE biz_cd = :bizCd
            """, nativeQuery = true)
    List<String> findAllPathIdsByBizCd(@Param("bizCd") String bizCd);
}
