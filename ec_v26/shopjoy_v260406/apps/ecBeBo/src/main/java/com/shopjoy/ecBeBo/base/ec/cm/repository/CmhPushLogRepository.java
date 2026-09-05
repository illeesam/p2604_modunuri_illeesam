package com.shopjoy.ecBeBo.base.ec.cm.repository;

import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmhPushLog;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.cm.repository.qrydsl.QCmhPushLogRepository;

public interface CmhPushLogRepository extends JpaRepository<CmhPushLog, String>, QCmhPushLogRepository {
}
