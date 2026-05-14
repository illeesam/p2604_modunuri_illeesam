package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAccessErrorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhAccessErrorLogRepository;

public interface SyhAccessErrorLogRepository extends JpaRepository<SyhAccessErrorLog, String>, QSyhAccessErrorLogRepository {
    @Modifying
    @Query("DELETE FROM SyhAccessErrorLog")
    void deleteAllBulk();
}
