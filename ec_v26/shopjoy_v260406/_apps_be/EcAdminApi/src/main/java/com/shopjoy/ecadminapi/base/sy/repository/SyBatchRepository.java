package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBatchRepository;

public interface SyBatchRepository extends JpaRepository<SyBatch, String>, QSyBatchRepository {
    List<SyBatch> findByBatchStatusCd(String batchStatusCd);
    Optional<SyBatch> findByBatchCode(String batchCode);
}
