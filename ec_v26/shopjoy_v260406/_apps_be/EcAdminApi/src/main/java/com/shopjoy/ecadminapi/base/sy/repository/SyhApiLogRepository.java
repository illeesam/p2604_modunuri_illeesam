package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhApiLog;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhApiLogRepository;

public interface SyhApiLogRepository extends JpaRepository<SyhApiLog, String>, QSyhApiLogRepository {
}
