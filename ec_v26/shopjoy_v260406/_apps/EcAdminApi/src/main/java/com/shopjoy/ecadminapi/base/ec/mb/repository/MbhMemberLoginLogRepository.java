package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberLoginLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface MbhMemberLoginLogRepository extends JpaRepository<MbhMemberLoginLog, String> {
    @Modifying
    @Query("DELETE FROM MbhMemberLoginLog")
    void deleteAllBulk();
}
