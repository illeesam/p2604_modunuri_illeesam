package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogRepository;

/* countByBlogCate(@Query) → QCmBlogRepository.selectCateCounts() 로 전환 (2026-08-27) */
public interface CmBlogRepository extends JpaRepository<CmBlog, String>, QCmBlogRepository {
}
