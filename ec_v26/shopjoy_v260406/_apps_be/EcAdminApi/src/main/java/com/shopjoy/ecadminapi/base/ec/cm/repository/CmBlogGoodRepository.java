package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogGood;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CmBlogGoodRepository extends JpaRepository<CmBlogGood, String>, QCmBlogGoodRepository {
}
