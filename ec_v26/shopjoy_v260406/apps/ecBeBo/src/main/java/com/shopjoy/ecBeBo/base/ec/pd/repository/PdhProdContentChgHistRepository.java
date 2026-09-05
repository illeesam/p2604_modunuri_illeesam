package com.shopjoy.ecBeBo.base.ec.pd.repository;

import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdhProdContentChgHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.QPdhProdContentChgHistRepository;

public interface PdhProdContentChgHistRepository extends JpaRepository<PdhProdContentChgHist, String>, QPdhProdContentChgHistRepository {
}
