package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PdCategoryRepository extends JpaRepository<PdCategory, String> {
}
