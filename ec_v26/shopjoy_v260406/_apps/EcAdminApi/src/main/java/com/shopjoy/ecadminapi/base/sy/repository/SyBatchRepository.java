package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SyBatchRepository extends JpaRepository<SyBatch, String> {
    List<SyBatch> findByBatchStatusCd(String batchStatusCd);
    Optional<SyBatch> findByBatchCode(String batchCode);
}
