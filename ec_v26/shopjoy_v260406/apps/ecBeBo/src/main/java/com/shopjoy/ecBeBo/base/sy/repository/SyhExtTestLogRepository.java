package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhExtTestLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhExtTestLogRepository;

/* findLatestByChannel(상관 서브쿼리) 은 QSyhExtTestLogRepository.selectLatestByChannel 유지 (2026-08-27) */
public interface SyhExtTestLogRepository extends JpaRepository<SyhExtTestLog, String>, QSyhExtTestLogRepository {

    long countByChannelKey(String channelKey);

    Page<SyhExtTestLog> findByChannelKey(String channelKey, Pageable pageable);

    Page<SyhExtTestLog> findAllByOrderByRegDateDesc(Pageable pageable);
}
