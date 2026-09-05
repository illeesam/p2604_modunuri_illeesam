package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyhBatchLog;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyhBatchLogRepository;

public interface SyhBatchLogRepository extends JpaRepository<SyhBatchLog, String>, QSyhBatchLogRepository {
}
