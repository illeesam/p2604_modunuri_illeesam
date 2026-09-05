package com.shopjoy.ecBeBo.base.ec.pd.repository;

import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdhProdSkuPriceHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.QPdhProdSkuPriceHistRepository;

public interface PdhProdSkuPriceHistRepository extends JpaRepository<PdhProdSkuPriceHist, String>, QPdhProdSkuPriceHistRepository {
}
