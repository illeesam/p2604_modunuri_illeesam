package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAccessErrorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhAccessErrorLogRepository;

/* WHERE 없는 전체삭제는 JpaRepository 기본 제공 deleteAllInBatch() 사용 (커스텀 메서드 불필요) */
public interface SyhAccessErrorLogRepository extends JpaRepository<SyhAccessErrorLog, String>, QSyhAccessErrorLogRepository {
}
