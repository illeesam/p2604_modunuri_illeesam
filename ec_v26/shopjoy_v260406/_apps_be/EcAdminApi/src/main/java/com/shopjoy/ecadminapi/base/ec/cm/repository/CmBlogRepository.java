package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CmBlogRepository extends JpaRepository<CmBlog, String>, QCmBlogRepository {
}
