package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhExtTestLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SyhExtTestLogRepository extends JpaRepository<SyhExtTestLog, String> {

    @Query("SELECT l FROM SyhExtTestLog l WHERE l.channelKey = :channelKey ORDER BY l.regDate DESC")
    Page<SyhExtTestLog> findByChannelKey(@Param("channelKey") String channelKey, Pageable pageable);

    @Query("SELECT COUNT(l) FROM SyhExtTestLog l WHERE l.channelKey = :channelKey")
    long countByChannelKey(@Param("channelKey") String channelKey);

    @Query("""
        SELECT l FROM SyhExtTestLog l
        WHERE l.siteId = :siteId
          AND l.regDate = (
            SELECT MAX(l2.regDate) FROM SyhExtTestLog l2
            WHERE l2.siteId = :siteId AND l2.channelKey = l.channelKey
          )
        ORDER BY l.channelKey
        """)
    List<SyhExtTestLog> findLatestByChannel(@Param("siteId") String siteId);
}
