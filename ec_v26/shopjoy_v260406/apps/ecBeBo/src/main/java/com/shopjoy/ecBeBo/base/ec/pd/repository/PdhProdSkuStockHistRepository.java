package com.shopjoy.ecBeBo.base.ec.pd.repository;

import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdhProdSkuStockHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.QPdhProdSkuStockHistRepository;

public interface PdhProdSkuStockHistRepository extends JpaRepository<PdhProdSkuStockHist, String>, QPdhProdSkuStockHistRepository {
}
