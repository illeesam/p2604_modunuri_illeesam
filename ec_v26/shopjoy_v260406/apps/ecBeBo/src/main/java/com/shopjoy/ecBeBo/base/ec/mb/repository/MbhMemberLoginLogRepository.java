package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberLoginLog;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbhMemberLoginLogRepository;

/* WHERE 없는 전체삭제는 JpaRepository 기본 제공 deleteAllInBatch() 사용 (커스텀 메서드 불필요) */
public interface MbhMemberLoginLogRepository extends JpaRepository<MbhMemberLoginLog, String>, QMbhMemberLoginLogRepository {
}
