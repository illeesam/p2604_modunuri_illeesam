package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyhUserLoginLog;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyhUserLoginLogRepository;

/* WHERE 없는 전체삭제는 JpaRepository 기본 제공 deleteAllInBatch() 사용 (커스텀 메서드 불필요) */
public interface SyhUserLoginLogRepository extends JpaRepository<SyhUserLoginLog, String>, QSyhUserLoginLogRepository {
}
