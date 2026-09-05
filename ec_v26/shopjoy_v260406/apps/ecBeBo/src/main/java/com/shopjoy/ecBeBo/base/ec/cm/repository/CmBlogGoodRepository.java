package com.shopjoy.ecBeBo.base.ec.cm.repository;

import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmBlogGood;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.cm.repository.qrydsl.QCmBlogGoodRepository;

public interface CmBlogGoodRepository extends JpaRepository<CmBlogGood, String>, QCmBlogGoodRepository {
}
