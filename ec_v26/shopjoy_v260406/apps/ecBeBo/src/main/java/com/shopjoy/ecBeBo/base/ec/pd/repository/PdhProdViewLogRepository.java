package com.shopjoy.ecBeBo.base.ec.pd.repository;

import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdhProdViewLog;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.QPdhProdViewLogRepository;

public interface PdhProdViewLogRepository extends JpaRepository<PdhProdViewLog, String>, QPdhProdViewLogRepository {
}
