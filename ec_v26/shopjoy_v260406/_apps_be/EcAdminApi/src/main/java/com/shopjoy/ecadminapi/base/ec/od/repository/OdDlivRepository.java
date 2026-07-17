package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdDlivRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface OdDlivRepository extends JpaRepository<OdDliv, String>, QOdDlivRepository {

    /** 특정 배송상태이고 출고일시가 threshold 이전인 배송 목록 */
    @Query("SELECT d FROM OdDliv d WHERE d.dlivStatusCd = :status AND d.dlivShipDate <= :threshold")
    List<OdDliv> findByStatusAndShipDateBefore(@Param("status") String status,
                                               @Param("threshold") LocalDateTime threshold);

    /** 특정 배송상태인 배송 전체 목록 (스윗트래커 실시간 조회용) */
    List<OdDliv> findByDlivStatusCd(String dlivStatusCd);

    /**
     * 주문 자동 완료 대상 조회.
     * 출고 배송(OUTBOUND) 중 DELIVERED 상태이고 배송완료일시가 threshold 이전인 것만 반환.
     * 반품/교환 입고(INBOUND) 건은 주문 완료 산정에서 제외.
     */
    @Query("SELECT d FROM OdDliv d " +
           "WHERE d.dlivDivCd = 'OUTBOUND' " +
           "AND d.dlivStatusCd = 'DELIVERED' " +
           "AND d.dlivDate <= :threshold")
    List<OdDliv> findDeliveredOutboundBefore(@Param("threshold") LocalDateTime threshold);
}
