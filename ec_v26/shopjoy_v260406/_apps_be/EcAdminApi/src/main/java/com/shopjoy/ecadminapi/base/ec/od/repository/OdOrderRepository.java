package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdOrderRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface OdOrderRepository extends JpaRepository<OdOrder, String>, QOdOrderRepository {

    /**
     * 미처리 주문 경보 대상 조회 — PAID 상태로 threshold 이전에 등록된 주문.
     * 결제 완료 후 장시간 방치된 주문을 관리자 알림으로 보고한다.
     */
    @Query("SELECT o FROM OdOrder o " +
           "WHERE o.siteId = :siteId " +
           "AND o.orderStatusCd = 'PAID' " +
           "AND o.regDate < :threshold")
    List<OdOrder> findStalePaidOrders(@Param("siteId") String siteId,
                                       @Param("threshold") LocalDateTime threshold);
}
