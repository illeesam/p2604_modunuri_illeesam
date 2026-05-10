package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAccessLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface SyhAccessLogRepository extends JpaRepository<SyhAccessLog, String> {
    @Modifying
    @Query("DELETE FROM SyhAccessLog")
    void deleteAllBulk();
}
