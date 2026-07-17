package com.shopjoy.ecadminapi.base.ec.st.repository;

import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleRaw;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleRawRepository;

import java.util.List;

public interface StSettleRawRepository extends JpaRepository<StSettleRaw, String>, QStSettleRawRepository {

    /**
     * 특정 정산기간의 집계 대상 원천 데이터 — 업체별 집계 소스.
     * settle_id 미연결(null) 또는 재집계 대상(DRAFT 상태 정산의 원천) 모두 포함.
     */
    @Query("SELECT r FROM StSettleRaw r " +
           "WHERE r.siteId = :siteId " +
           "AND r.settlePeriod = :settlePeriod " +
           "AND r.vendorId = :vendorId")
    List<StSettleRaw> findBySettlePeriodAndVendor(
            @Param("siteId")       String siteId,
            @Param("settlePeriod") String settlePeriod,
            @Param("vendorId")     String vendorId);

    /**
     * 특정 정산기간에 원천 데이터가 존재하는 업체ID 목록 (사이트별).
     */
    @Query("SELECT DISTINCT r.vendorId FROM StSettleRaw r " +
           "WHERE r.siteId = :siteId " +
           "AND r.settlePeriod = :settlePeriod " +
           "AND r.vendorId IS NOT NULL")
    List<String> findDistinctVendorIdsBySettlePeriod(
            @Param("siteId")       String siteId,
            @Param("settlePeriod") String settlePeriod);
}
