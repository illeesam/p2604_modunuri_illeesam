package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdCategoryRepository;

public interface PdCategoryRepository extends JpaRepository<PdCategory, String>, QPdCategoryRepository {
}
