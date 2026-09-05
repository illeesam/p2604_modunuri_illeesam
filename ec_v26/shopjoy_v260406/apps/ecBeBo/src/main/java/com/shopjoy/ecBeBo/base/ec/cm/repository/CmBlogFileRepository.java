package com.shopjoy.ecBeBo.base.ec.cm.repository;

import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmBlogFile;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.cm.repository.qrydsl.QCmBlogFileRepository;

public interface CmBlogFileRepository extends JpaRepository<CmBlogFile, String>, QCmBlogFileRepository {
}
