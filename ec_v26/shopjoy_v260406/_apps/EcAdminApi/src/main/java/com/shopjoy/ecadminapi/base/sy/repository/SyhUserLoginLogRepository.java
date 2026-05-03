package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserLoginLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface SyhUserLoginLogRepository extends JpaRepository<SyhUserLoginLog, String> {
    @Modifying
    @Query("DELETE FROM SyhUserLoginLog")
    void deleteAllBulk();
}
