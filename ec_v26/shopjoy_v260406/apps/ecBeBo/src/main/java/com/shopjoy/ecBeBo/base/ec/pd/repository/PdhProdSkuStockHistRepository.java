package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuStockHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdhProdSkuStockHistRepository;

public interface PdhProdSkuStockHistRepository extends JpaRepository<PdhProdSkuStockHist, String>, QPdhProdSkuStockHistRepository {
}
