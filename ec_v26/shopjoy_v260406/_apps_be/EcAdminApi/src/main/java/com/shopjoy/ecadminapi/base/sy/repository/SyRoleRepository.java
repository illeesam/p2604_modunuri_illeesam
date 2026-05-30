package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyRoleRepository;

import java.util.List;

public interface SyRoleRepository extends JpaRepository<SyRole, String>, QSyRoleRepository {

    /* 루트 role + 모든 자손 role_id 수집 (PostgreSQL 재귀 CTE) */
    @Query(value = """
            WITH RECURSIVE t /* 역할 parent_role_id 의 자식 role_id (list) 반환 */ AS (
                SELECT role_id
                  FROM sy_role
                 WHERE role_id = :rootRoleId
                UNION ALL
                SELECT c.role_id
                  FROM sy_role c
                  JOIN t ON c.parent_role_id = t.role_id
            )
            SELECT role_id FROM t
            """, nativeQuery = true)
    List<String> findTreeRoleIds(@Param("rootRoleId") String rootRoleId);
}
