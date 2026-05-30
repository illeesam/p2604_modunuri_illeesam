package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbs;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBbsRepository;

import java.util.List;

public interface SyBbsRepository extends JpaRepository<SyBbs, String>, QSyBbsRepository {

    /* 루트 bbs + 모든 자손 bbs_id 수집 (PostgreSQL 재귀 CTE) */
    @Query(value = """
            WITH RECURSIVE t /* 게시판 parent_bbs_id 의 자식 bbs_id (list) 반환 */ AS (
                SELECT bbs_id
                  FROM sy_bbs
                 WHERE bbs_id = :rootBbsId
                UNION ALL
                SELECT c.bbs_id
                  FROM sy_bbs c
                  JOIN t ON c.parent_bbs_id = t.bbs_id
            )
            SELECT bbs_id FROM t
            """, nativeQuery = true)
    List<String> findTreeBbsIds(@Param("rootBbsId") String rootBbsId);
}
