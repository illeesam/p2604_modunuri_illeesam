package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberTokenLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbhMemberTokenLogRepository;

public interface MbhMemberTokenLogRepository extends JpaRepository<MbhMemberTokenLog, String>, QMbhMemberTokenLogRepository {
    @Modifying
    @Query("DELETE FROM MbhMemberTokenLog")
    void deleteAllBulk();
}
