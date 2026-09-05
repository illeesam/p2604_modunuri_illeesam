package com.shopjoy.ecBeBo.base.ec.od.repository;

import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl.QOdOrderRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface OdOrderRepository extends JpaRepository<OdOrder, String>, QOdOrderRepository {

    /** 미처리 주문 경보 대상 — orderStatusCd 상태로 threshold 이전 등록 */
    List<OdOrder> findByOrderStatusCdAndRegDateBefore(String orderStatusCd, LocalDateTime threshold);
}
