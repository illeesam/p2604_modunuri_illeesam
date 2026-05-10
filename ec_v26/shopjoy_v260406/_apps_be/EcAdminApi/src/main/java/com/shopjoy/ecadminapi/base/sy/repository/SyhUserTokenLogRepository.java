package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserTokenLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface SyhUserTokenLogRepository extends JpaRepository<SyhUserTokenLog, String> {
    @Modifying
    @Query("DELETE FROM SyhUserTokenLog")
    void deleteAllBulk();
}
