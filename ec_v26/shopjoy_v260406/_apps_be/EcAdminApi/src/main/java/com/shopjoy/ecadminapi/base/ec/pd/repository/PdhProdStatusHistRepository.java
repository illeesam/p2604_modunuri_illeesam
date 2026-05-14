package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdStatusHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdhProdStatusHistRepository;

public interface PdhProdStatusHistRepository extends JpaRepository<PdhProdStatusHist, String>, QPdhProdStatusHistRepository {
}
