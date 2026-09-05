package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogTag;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogTagRepository;

public interface CmBlogTagRepository extends JpaRepository<CmBlogTag, String>, QCmBlogTagRepository {
}
