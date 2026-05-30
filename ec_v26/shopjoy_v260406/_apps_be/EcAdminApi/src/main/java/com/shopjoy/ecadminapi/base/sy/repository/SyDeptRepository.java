package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyDept;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyDeptRepository;

import java.util.List;

public interface SyDeptRepository extends JpaRepository<SyDept, String>, QSyDeptRepository {

    /* 루트 dept + 모든 자손 dept_id 수집 (PostgreSQL 재귀 CTE) */
    @Query(value = """
            WITH RECURSIVE t /* 부서 parent_dept_id 의 자식 dept_id (list) 반환 */ AS (
                SELECT dept_id
                  FROM sy_dept
                 WHERE dept_id = :rootDeptId
                UNION ALL
                SELECT c.dept_id
                  FROM sy_dept c
                  JOIN t ON c.parent_dept_id = t.dept_id
            )
            SELECT dept_id FROM t
            """, nativeQuery = true)
    List<String> findTreeDeptIds(@Param("rootDeptId") String rootDeptId);
}
