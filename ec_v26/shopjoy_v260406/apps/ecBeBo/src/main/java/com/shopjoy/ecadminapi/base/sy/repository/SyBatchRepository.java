package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBatchRepository;

import java.util.List;
import java.util.Optional;

public interface SyBatchRepository extends JpaRepository<SyBatch, String>, QSyBatchRepository {

    /** 스케줄러 부팅/재로드용 */
    List<SyBatch> findByBatchStatusCd(String batchStatusCd);

    /** UNIQUE(batch_code) 단건 조회 */
    Optional<SyBatch> findByBatchCode(String batchCode);
}
