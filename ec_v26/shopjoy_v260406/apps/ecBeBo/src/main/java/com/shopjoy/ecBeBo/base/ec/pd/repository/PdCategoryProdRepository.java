package com.shopjoy.ecBeBo.base.ec.pd.repository;

import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdCategoryProd;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.QPdCategoryProdRepository;

public interface PdCategoryProdRepository extends JpaRepository<PdCategoryProd, String>, QPdCategoryProdRepository {
    void deleteByCategoryIdAndCategoryProdTypeCd(String categoryId, String categoryProdTypeCd);
}
