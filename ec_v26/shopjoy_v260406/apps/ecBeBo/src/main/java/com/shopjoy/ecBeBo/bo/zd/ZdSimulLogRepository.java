package com.shopjoy.ecBeBo.bo.zd;

import com.shopjoy.ecBeBo.bo.zd.entity.ZdSimulLog;
import com.shopjoy.ecBeBo.bo.zd.qrydsl.QZdSimulLogRepository;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ZdSimulLogRepository extends JpaRepository<ZdSimulLog, String>, QZdSimulLogRepository {
}
