package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyhApiLog;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyhApiLogRepository;

public interface SyhApiLogRepository extends JpaRepository<SyhApiLog, String>, QSyhApiLogRepository {
}
