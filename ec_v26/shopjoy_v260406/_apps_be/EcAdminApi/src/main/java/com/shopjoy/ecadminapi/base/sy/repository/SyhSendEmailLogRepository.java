package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendEmailLog;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhSendEmailLogRepository;

public interface SyhSendEmailLogRepository extends JpaRepository<SyhSendEmailLog, String>, QSyhSendEmailLogRepository {
}
