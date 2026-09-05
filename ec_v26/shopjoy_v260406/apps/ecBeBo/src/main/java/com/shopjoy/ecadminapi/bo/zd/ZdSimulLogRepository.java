package com.shopjoy.ecadminapi.bo.zd;

import com.shopjoy.ecadminapi.bo.zd.entity.ZdSimulLog;
import com.shopjoy.ecadminapi.bo.zd.qrydsl.QZdSimulLogRepository;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ZdSimulLogRepository extends JpaRepository<ZdSimulLog, String>, QZdSimulLogRepository {
}
