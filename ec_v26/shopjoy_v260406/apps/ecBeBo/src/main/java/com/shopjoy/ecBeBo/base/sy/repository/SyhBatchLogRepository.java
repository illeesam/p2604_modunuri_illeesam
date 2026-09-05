package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhBatchLog;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhBatchLogRepository;

public interface SyhBatchLogRepository extends JpaRepository<SyhBatchLog, String>, QSyhBatchLogRepository {
}
