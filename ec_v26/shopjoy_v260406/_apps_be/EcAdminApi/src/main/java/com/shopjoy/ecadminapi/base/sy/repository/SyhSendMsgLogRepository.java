package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendMsgLog;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhSendMsgLogRepository;

public interface SyhSendMsgLogRepository extends JpaRepository<SyhSendMsgLog, String>, QSyhSendMsgLogRepository {
}
