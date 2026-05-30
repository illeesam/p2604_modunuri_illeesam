package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogCate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogCateRepository;

import java.util.List;

public interface CmBlogCateRepository extends JpaRepository<CmBlogCate, String>, QCmBlogCateRepository {

    /* 루트 blogCate + 모든 자손 blog_cate_id 수집 (PostgreSQL 재귀 CTE) */
    @Query(value = """
            WITH RECURSIVE t /* 블로그카테고리 parent_blog_cate_id 의 자식 blog_cate_id (list) 반환 */ AS (
                SELECT blog_cate_id
                  FROM cm_blog_cate
                 WHERE blog_cate_id = :rootBlogCateId
                UNION ALL
                SELECT c.blog_cate_id
                  FROM cm_blog_cate c
                  JOIN t ON c.parent_blog_cate_id = t.blog_cate_id
            )
            SELECT blog_cate_id FROM t
            """, nativeQuery = true)
    List<String> findTreeBlogCateIds(@Param("rootBlogCateId") String rootBlogCateId);
}
