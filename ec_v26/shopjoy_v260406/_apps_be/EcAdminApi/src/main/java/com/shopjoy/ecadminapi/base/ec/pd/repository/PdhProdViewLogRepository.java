package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdViewLog;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdhProdViewLogRepository;

public interface PdhProdViewLogRepository extends JpaRepository<PdhProdViewLog, String>, QPdhProdViewLogRepository {
}
