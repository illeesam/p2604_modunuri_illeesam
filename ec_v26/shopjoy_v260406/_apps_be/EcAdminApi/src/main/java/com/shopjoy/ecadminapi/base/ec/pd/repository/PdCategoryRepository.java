package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdCategoryRepository;

import java.util.List;

public interface PdCategoryRepository extends JpaRepository<PdCategory, String>, QPdCategoryRepository {

    /* 루트 category + 모든 자손 category_id 수집 (PostgreSQL 재귀 CTE) */
    @Query(value = """
            WITH RECURSIVE t /* 카테고리 parent_category_id 의 자식 category_id (list) 반환 */ AS (
                SELECT category_id
                  FROM pd_category
                 WHERE category_id = :rootCategoryId
                UNION ALL
                SELECT c.category_id
                  FROM pd_category c
                  JOIN t ON c.parent_category_id = t.category_id
            )
            SELECT category_id FROM t
            """, nativeQuery = true)
    List<String> findTreeCategoryIds(@Param("rootCategoryId") String rootCategoryId);
}
