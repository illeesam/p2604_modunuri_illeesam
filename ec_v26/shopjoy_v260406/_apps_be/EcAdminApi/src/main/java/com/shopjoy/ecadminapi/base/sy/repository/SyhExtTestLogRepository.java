package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhExtTestLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhExtTestLogRepository;

/* findByChannelKey → QSyhExtTestLogRepository.selectByChannelKey
   findAllOrderByRegDateDesc → selectAllOrderByRegDateDesc
   findLatestByChannel → selectLatestByChannel 로 전환 (2026-08-27) */
public interface SyhExtTestLogRepository extends JpaRepository<SyhExtTestLog, String>, QSyhExtTestLogRepository {

    @Query("SELECT COUNT(l) FROM SyhExtTestLog l WHERE l.channelKey = :channelKey")
    long countByChannelKey(@Param("channelKey") String channelKey);
}
