package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyUserRepository;

import java.util.List;

public interface SyUserRepository extends JpaRepository<SyUser, String>, QSyUserRepository {

    /* 부서 트리 노드별 SyUser 수 집계 (검색조건 + 자손 누적, PostgreSQL 재귀 CTE)
     *   - 일반 dept_id : 해당 부서 + 자손 부서의 사용자 수
     *   - '__total__'  : 전체 사용자 수 (트리 루트 "전체" 노드)
     *   - '__orphan__' : dept_id IS NULL 인 사용자 수
     *
     *   파라미터 — null 이면 해당 조건 무시:
     *     - statusCd    : user_status_cd 일치
     *     - searchType  : searchValue 검색 대상 컬럼 csv (',a,b,' wrap)
     *     - searchValue : login_id/user_nm/user_email/user_phone 부분일치 OR
     *     - dateStart/End : reg_date 범위 */
    @Query(value = """
            WITH RECURSIVE descendants AS (
                SELECT dept_id AS root_id,
                       dept_id AS leaf_id
                FROM sy_dept
                UNION ALL
                SELECT d.root_id,
                       c.dept_id
                  FROM descendants d
                  JOIN sy_dept c ON c.parent_dept_id = d.leaf_id
            ),
            filtered AS (
                SELECT user_id,
                       dept_id
                FROM sy_user t
                 WHERE 1=1
                   AND (CAST(:statusCd AS varchar) IS NULL OR t.user_status_cd = :statusCd)
                   AND (CAST(:searchValue AS varchar) IS NULL OR (
                             ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,loginId,%')   AND t.login_id   ILIKE '%' || :searchValue || '%')
                          OR ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,userNm,%')    AND t.user_nm    ILIKE '%' || :searchValue || '%')
                          OR ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,userEmail,%') AND t.user_email ILIKE '%' || :searchValue || '%')
                          OR ((CAST(:searchType AS varchar) IS NULL OR :searchType = '' OR :searchType LIKE '%,userPhone,%') AND t.user_phone ILIKE '%' || :searchValue || '%')
                          ))
                   AND (CAST(:dateStart AS varchar) IS NULL OR t.reg_date >= CAST(:dateStart AS timestamp))
                   AND (CAST(:dateEnd   AS varchar) IS NULL OR t.reg_date <= CAST(:dateEnd   AS timestamp) + INTERVAL '1 day')
            )
            SELECT d.root_id AS dept_id,
                   COUNT(t.user_id) AS cnt
              FROM descendants d
              LEFT JOIN filtered t ON t.dept_id = d.leaf_id
             GROUP BY d.root_id
            UNION ALL
            SELECT '__total__' AS dept_id,
                   COUNT(*) AS cnt
            FROM filtered
            UNION ALL
            SELECT '__orphan__' AS dept_id,
                   COUNT(*) AS cnt
            FROM filtered
            WHERE dept_id IS NULL
            """, nativeQuery = true)
    List<Object[]> findDeptSyUserTreeNodeCounts(
            @Param("statusCd")    String statusCd,
            @Param("searchType")  String searchType,
            @Param("searchValue") String searchValue,
            @Param("dateStart")   String dateStart,
            @Param("dateEnd")     String dateEnd);
}
