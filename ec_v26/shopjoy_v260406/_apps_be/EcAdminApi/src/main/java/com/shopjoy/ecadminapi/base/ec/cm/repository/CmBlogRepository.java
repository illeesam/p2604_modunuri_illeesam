package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogRepository;

import java.util.List;

public interface CmBlogRepository extends JpaRepository<CmBlog, String>, QCmBlogRepository {

    /** 카테고리별 공개 블로그 건수 — [blogCateId, count] 배열 목록 (FO 사이드바 count) */
    @Query("SELECT b.blogCateId, COUNT(b) FROM CmBlog b "
         + "WHERE b.siteId = :siteId AND b.useYn = 'Y' AND b.blogCateId IS NOT NULL "
         + "GROUP BY b.blogCateId")
    List<Object[]> countByBlogCate(@Param("siteId") String siteId);
}
