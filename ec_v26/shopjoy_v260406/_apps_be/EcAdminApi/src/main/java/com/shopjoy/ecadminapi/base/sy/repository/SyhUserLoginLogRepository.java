package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserLoginLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhUserLoginLogRepository;

public interface SyhUserLoginLogRepository extends JpaRepository<SyhUserLoginLog, String>, QSyhUserLoginLogRepository {
    @Modifying
    @Query("DELETE FROM SyhUserLoginLog")
    void deleteAllBulk();
}
