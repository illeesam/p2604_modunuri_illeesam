package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogFile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CmBlogFileRepository extends JpaRepository<CmBlogFile, String>, QCmBlogFileRepository {
}
